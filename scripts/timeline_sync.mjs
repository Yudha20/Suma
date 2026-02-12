#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const DEFAULTS = {
  repo: "/Users/yudha/Downloads/Suma",
  timeline: "/Users/yudha/Downloads/Suma/TIMELINE.md",
  sessionsRoot: path.join(os.homedir(), ".codex", "sessions"),
  state: "/Users/yudha/Downloads/Suma/.codex/timeline_sync_state.json"
};

const UI_PREFIXES = ["app/", "components/", "styles/", "public/"];

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith("--")) {
      continue;
    }
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function runGit(repo, gitArgs) {
  return execFileSync("git", ["-C", repo, ...gitArgs], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"]
  }).trimEnd();
}

function ensureGitRepo(repo) {
  try {
    const out = runGit(repo, ["rev-parse", "--is-inside-work-tree"]);
    if (out !== "true") {
      throw new Error("Current path is not inside a git repository.");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(
      `Missing git repo context at ${repo}. Ensure this automation runs in the project root. Details: ${message}`
    );
  }
}

function parsePorcelainPath(line) {
  if (line.length < 4) {
    return null;
  }
  let raw = line.slice(3).trim();
  if (!raw) {
    return null;
  }
  if (raw.includes(" -> ")) {
    raw = raw.split(" -> ").pop() ?? raw;
  }
  if (raw.startsWith("\"") && raw.endsWith("\"")) {
    raw = raw.slice(1, -1);
  }
  return raw;
}

function sortUnique(list) {
  return [...new Set(list)].sort((a, b) => a.localeCompare(b));
}

function isUiPath(relPath) {
  return UI_PREFIXES.some((prefix) => relPath.startsWith(prefix));
}

function collectLocalChanges(repo) {
  const statusOutput = runGit(repo, ["status", "--porcelain=v1", "-uall"]);
  const unstagedOutput = runGit(repo, ["diff", "--name-only"]);
  const stagedOutput = runGit(repo, ["diff", "--cached", "--name-only"]);

  const fromStatus = statusOutput
    .split(/\r?\n/)
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .map(parsePorcelainPath)
    .filter(Boolean);

  const fromUnstaged = unstagedOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const fromStaged = stagedOutput
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const changedFiles = sortUnique([...fromStatus, ...fromUnstaged, ...fromStaged]);
  const uiFiles = changedFiles.filter(isUiPath);
  const otherFiles = changedFiles.filter((file) => !isUiPath(file));

  return { changedFiles, uiFiles, otherFiles };
}

async function readJsonFileIfExists(filePath, fallback) {
  try {
    const content = await fs.readFile(filePath, "utf8");
    return JSON.parse(content);
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return fallback;
    }
    throw error;
  }
}

function normalizePath(input) {
  return path.resolve(input);
}

function extractMessageFromEvent(event) {
  if (event?.type === "response_item" && event?.payload?.type === "message") {
    const role = event.payload.role;
    if (role !== "user" && role !== "assistant") {
      return null;
    }
    const chunks = Array.isArray(event.payload.content) ? event.payload.content : [];
    const text = chunks
      .map((chunk) => {
        if (!chunk || typeof chunk !== "object") {
          return "";
        }
        if (typeof chunk.text === "string") {
          return chunk.text;
        }
        if (typeof chunk.input_text === "string") {
          return chunk.input_text;
        }
        return "";
      })
      .join(" ")
      .trim();
    if (!text) {
      return null;
    }
    return { role, text };
  }

  if (event?.type === "message" && Array.isArray(event?.content)) {
    const role = typeof event.role === "string" ? event.role : "unknown";
    if (role !== "user" && role !== "assistant") {
      return null;
    }
    const text = event.content
      .map((item) => {
        if (!item || typeof item !== "object") {
          return "";
        }
        if (typeof item.text === "string") {
          return item.text;
        }
        return "";
      })
      .join(" ")
      .trim();
    if (!text) {
      return null;
    }
    return { role, text };
  }

  return null;
}

function sanitizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}

function classifyMessage(text) {
  const normalized = text.toLowerCase();
  if (/(decision|decide|decided|approved|approve|go with|ship|finalize|accepted)/.test(normalized)) {
    return "Decision";
  }
  if (/(regression|bug|issue|error|failing|failed|broken|crash|incident)/.test(normalized)) {
    return "Regression/Fix";
  }
  if (/(fix|fixed|patch|resolve|resolved|mitigate|rollback)/.test(normalized)) {
    return "Fix";
  }
  if (/\b(ui|ux)\b|design|layout|component|styling|style|screen|page/.test(normalized)) {
    return "UI/UX";
  }
  if (/(implement|change|update|refactor|add|remove|migrate)/.test(normalized)) {
    return "Engineering";
  }
  return null;
}

function truncate(text, maxLength) {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, Math.max(0, maxLength - 3))}...`;
}

function formatRole(role) {
  if (role === "assistant") {
    return "assistant";
  }
  if (role === "user") {
    return "user";
  }
  return "participant";
}

async function listJsonlFiles(rootDir) {
  const files = [];

  async function walk(currentDir) {
    let entries;
    try {
      entries = await fs.readdir(currentDir, { withFileTypes: true });
    } catch (error) {
      const code = error && typeof error === "object" ? error.code : undefined;
      if (code === "ENOENT") {
        return;
      }
      if (code === "EACCES" || code === "EPERM") {
        throw new Error(
          `Permission denied while reading ${currentDir}. Grant access to ~/.codex/sessions for thread scanning.`
        );
      }
      throw error;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isFile() && fullPath.endsWith(".jsonl")) {
        files.push(fullPath);
      }
    }
  }

  await walk(rootDir);
  return files.sort((a, b) => a.localeCompare(b));
}

function toDate(value) {
  if (!value || typeof value !== "string") {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date;
}

async function collectThreadActivity({ sessionsRoot, repoPath, state, firstRun }) {
  const repoCwd = normalizePath(repoPath);
  const jsonlFiles = await listJsonlFiles(sessionsRoot);
  const newOffsets = { ...(state.session_offsets ?? {}) };
  const previousScanDate = toDate(state.last_scan_at);
  const noteworthy = [];
  const threadIdsWithNewMessages = new Set();
  let newMessages = 0;
  let warnings = 0;

  for (const file of jsonlFiles) {
    let content;
    try {
      content = await fs.readFile(file, "utf8");
    } catch (error) {
      const code = error && typeof error === "object" ? error.code : undefined;
      if (code === "EACCES" || code === "EPERM") {
        throw new Error(
          `Permission denied while reading ${file}. Grant access to ~/.codex/sessions for thread scanning.`
        );
      }
      throw error;
    }

    const lines = content.split(/\r?\n/).filter((line) => line.length > 0);
    let threadId = path.basename(file);
    let isWorkspaceThread = false;

    for (let i = 0; i < Math.min(lines.length, 30); i += 1) {
      try {
        const event = JSON.parse(lines[i]);
        if (event?.type === "session_meta") {
          const maybeCwd = event?.payload?.cwd;
          if (typeof event?.payload?.id === "string") {
            threadId = event.payload.id;
          }
          if (typeof maybeCwd === "string" && normalizePath(maybeCwd) === repoCwd) {
            isWorkspaceThread = true;
          }
          break;
        }
      } catch {
        warnings += 1;
      }
    }

    if (!isWorkspaceThread) {
      continue;
    }

    const previousOffset = Number(newOffsets[file]);
    let startLine = 0;
    if (Number.isFinite(previousOffset) && previousOffset >= 0 && previousOffset <= lines.length) {
      startLine = previousOffset;
    } else if (firstRun) {
      startLine = lines.length;
    }

    for (let i = startLine; i < lines.length; i += 1) {
      const line = lines[i].trim();
      if (!line) {
        continue;
      }

      let event;
      try {
        event = JSON.parse(line);
      } catch {
        warnings += 1;
        continue;
      }

      const eventDate = toDate(event?.timestamp);
      if (previousScanDate && eventDate && eventDate <= previousScanDate) {
        continue;
      }

      const message = extractMessageFromEvent(event);
      if (!message) {
        continue;
      }

      const text = sanitizeText(message.text);
      if (!text) {
        continue;
      }

      newMessages += 1;
      threadIdsWithNewMessages.add(threadId);

      const category = classifyMessage(text);
      if (!category) {
        continue;
      }

      noteworthy.push({
        category,
        role: formatRole(message.role),
        text: truncate(text, 160)
      });
    }

    newOffsets[file] = lines.length;
  }

  const seen = new Set();
  const importantBullets = [];
  const priority = ["Decision", "Regression/Fix", "Fix", "UI/UX", "Engineering"];
  noteworthy.sort((a, b) => priority.indexOf(a.category) - priority.indexOf(b.category));
  for (const item of noteworthy) {
    const key = `${item.category}|${item.role}|${item.text.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    importantBullets.push(`${item.category}: ${item.role} - ${item.text}`);
    if (importantBullets.length >= 6) {
      break;
    }
  }

  return {
    sessionOffsets: newOffsets,
    newMessages,
    activeThreadCount: threadIdsWithNewMessages.size,
    importantBullets,
    warnings
  };
}

function pad2(value) {
  return String(value).padStart(2, "0");
}

function formatTimezoneOffset(date) {
  const minutes = -date.getTimezoneOffset();
  const sign = minutes >= 0 ? "+" : "-";
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const mins = abs % 60;
  return `${sign}${pad2(hours)}${pad2(mins)}`;
}

function formatZoneName(date) {
  const formatter = new Intl.DateTimeFormat("en-US", { timeZoneName: "short" });
  const parts = formatter.formatToParts(date);
  const zone = parts.find((part) => part.type === "timeZoneName")?.value ?? "LOCAL";
  return zone.toUpperCase();
}

function formatTimestamp(date) {
  const year = date.getFullYear();
  const month = pad2(date.getMonth() + 1);
  const day = pad2(date.getDate());
  const hours = pad2(date.getHours());
  const minutes = pad2(date.getMinutes());
  const seconds = pad2(date.getSeconds());
  const zone = formatZoneName(date);
  const offset = formatTimezoneOffset(date);
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${zone} (${offset})`;
}

function compactFileList(files, maxItems = 8) {
  if (files.length <= maxItems) {
    return files.map((item) => `\`${item}\``).join(", ");
  }
  const visible = files.slice(0, maxItems).map((item) => `\`${item}\``).join(", ");
  return `${visible}, +${files.length - maxItems} more`;
}

function replaceSection(lines, heading, contentLines) {
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) {
    return lines;
  }
  const end = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
  const nextSection = end === -1 ? lines.length : end;
  const before = lines.slice(0, start + 1);
  const after = lines.slice(nextSection);
  return [...before, "", ...contentLines, "", ...after];
}

function prependToSection(lines, heading, entryLines) {
  const start = lines.findIndex((line) => line.trim() === heading);
  if (start === -1) {
    return lines;
  }
  const end = lines.findIndex((line, index) => index > start && /^##\s+/.test(line));
  const nextSection = end === -1 ? lines.length : end;
  const before = lines.slice(0, start + 1);
  const sectionBody = lines.slice(start + 1, nextSection);
  const after = lines.slice(nextSection);

  let firstContentIndex = 0;
  while (firstContentIndex < sectionBody.length && sectionBody[firstContentIndex].trim() === "") {
    firstContentIndex += 1;
  }

  const rebuiltBody = ["", ...entryLines, "", ...sectionBody.slice(firstContentIndex)];

  return [...before, ...rebuiltBody, ...after];
}

async function updateTimeline({
  timelinePath,
  now,
  localChanges,
  threadActivity
}) {
  let content;
  try {
    content = await fs.readFile(timelinePath, "utf8");
  } catch (error) {
    const code = error && typeof error === "object" ? error.code : undefined;
    if (code === "ENOENT") {
      throw new Error(`Timeline file missing at ${timelinePath}.`);
    }
    if (code === "EACCES" || code === "EPERM") {
      throw new Error(`Timeline file is not writable at ${timelinePath}.`);
    }
    throw error;
  }

  let lines = content.split(/\r?\n/);
  const lastUpdatedIndex = lines.findIndex((line) => line.startsWith("Last updated:"));
  if (lastUpdatedIndex !== -1) {
    lines[lastUpdatedIndex] = `Last updated: ${formatTimestamp(now)}`;
  }

  const entryLines = [];
  entryLines.push(`- **${formatTimestamp(now)}** (automated local scan)`);
  entryLines.push(
    `- Local workspace changes: ${localChanges.changedFiles.length} file(s) (${localChanges.uiFiles.length} UI/UX, ${localChanges.otherFiles.length} other).`
  );
  if (localChanges.uiFiles.length > 0) {
    entryLines.push(`- UI/UX touched: ${compactFileList(localChanges.uiFiles)}.`);
  }
  if (localChanges.otherFiles.length > 0) {
    entryLines.push(`- Other engineering changes: ${compactFileList(localChanges.otherFiles)}.`);
  }
  entryLines.push(
    `- Codex thread activity: ${threadActivity.newMessages} new message(s) across ${threadActivity.activeThreadCount} workspace thread(s).`
  );
  if (threadActivity.importantBullets.length > 0) {
    entryLines.push("- Key thread updates:");
    for (const bullet of threadActivity.importantBullets) {
      entryLines.push(`- ${bullet}`);
    }
  }
  if (threadActivity.warnings > 0) {
    entryLines.push(`- Scan warnings: skipped ${threadActivity.warnings} unreadable/corrupt session line(s).`);
  }

  lines = prependToSection(lines, "## Timeline (Date/Time + What Happened)", entryLines);

  const pendingLines =
    localChanges.changedFiles.length > 0
      ? localChanges.changedFiles.map((file) => `- \`${file}\``)
      : ["- _(none)_"];
  lines = replaceSection(lines, "## Current Pending Local Changes (Not Yet Committed)", pendingLines);

  await fs.writeFile(timelinePath, `${lines.join("\n").replace(/\n+$/, "\n")}`, "utf8");
}

function computeFingerprint(payload) {
  const hash = createHash("sha256");
  hash.update(JSON.stringify(payload));
  return hash.digest("hex");
}

async function writeStateAtomic(statePath, state) {
  await fs.mkdir(path.dirname(statePath), { recursive: true });
  const tmpPath = `${statePath}.tmp`;
  await fs.writeFile(tmpPath, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  await fs.rename(tmpPath, statePath);
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(
      [
        "Usage: node scripts/timeline_sync.mjs [options]",
        "",
        "Options:",
        "  --repo <path>           Repository path",
        "  --timeline <path>       Timeline markdown file path",
        "  --sessions-root <path>  Codex sessions root",
        "  --state <path>          State file path"
      ].join("\n")
    );
    return;
  }

  const repo = normalizePath(String(args.repo ?? DEFAULTS.repo));
  const timeline = normalizePath(String(args.timeline ?? DEFAULTS.timeline));
  const sessionsRoot = normalizePath(String(args["sessions-root"] ?? DEFAULTS.sessionsRoot));
  const statePath = normalizePath(String(args.state ?? DEFAULTS.state));
  const now = new Date();

  ensureGitRepo(repo);

  const initialState = {
    last_scan_at: null,
    session_offsets: {},
    last_fingerprint: "",
    last_timeline_write_at: null
  };
  const state = await readJsonFileIfExists(statePath, initialState);
  const firstRun = !state.last_scan_at;

  const localChanges = collectLocalChanges(repo);
  const threadActivity = await collectThreadActivity({
    sessionsRoot,
    repoPath: repo,
    state,
    firstRun
  });

  const hasChanges = localChanges.changedFiles.length > 0 || threadActivity.newMessages > 0;
  const fingerprint = computeFingerprint({
    local: {
      changedFiles: localChanges.changedFiles,
      uiFiles: localChanges.uiFiles,
      otherFiles: localChanges.otherFiles
    },
    thread: {
      newMessages: threadActivity.newMessages,
      activeThreadCount: threadActivity.activeThreadCount,
      importantBullets: threadActivity.importantBullets
    }
  });

  let action = "no_changes";
  if (hasChanges) {
    if (state.last_fingerprint === fingerprint) {
      action = "deduped";
    } else {
      await updateTimeline({
        timelinePath: timeline,
        now,
        localChanges,
        threadActivity
      });
      action = "written";
      state.last_fingerprint = fingerprint;
      state.last_timeline_write_at = now.toISOString();
    }
  }

  state.last_scan_at = now.toISOString();
  state.session_offsets = threadActivity.sessionOffsets;
  await writeStateAtomic(statePath, state);

  const summary = {
    action,
    timeline,
    local_changes: localChanges.changedFiles.length,
    ui_changes: localChanges.uiFiles.length,
    other_changes: localChanges.otherFiles.length,
    thread_new_messages: threadActivity.newMessages,
    workspace_threads_with_activity: threadActivity.activeThreadCount,
    warnings: threadActivity.warnings
  };

  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`timeline_sync failed: ${message}`);
  process.exit(1);
});
