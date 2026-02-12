# Suma Timeline

Last updated: 2026-02-12 08:18:11 GMT+5:30 (+0530)

## Simple Summary

This project moved from an empty repo to a working Suma MVP in one session.  
Main progress so far: app scaffold + train loop + storage + OCR/photo seed pipeline + tests + docs + GitHub push.  
Current active work (not committed yet): OCR reliability improvements, tuning dataset setup, and **dark neumorphic UI system**.

## Timeline (Date/Time + What Happened)

- **2026-02-12 08:54 GMT+5:30** (commit `UI Fixes`)
  - **Neumorphic UI Polish & Fixes:**
    - Fixed **Segmented Control** alignment: logic now correctly accounts for rail padding (`calc((100% - 8px) / N)`), preventing indicator overflow.
    - Fixed **Home Action Buttons**: added explicit `z-index: 10` and `position: relative` to `.neu-btn-primary` and `.neu-btn-secondary` to resolve click intercept issues by invisible overlays.
    - Verified all micro-interactions (staggered entrance, spring physics, hover states) and navigation flows in browser.

- **2026-02-12 08:18:11 GMT+5:30 (+0530)** (automated local scan)
- Local workspace changes: 36 file(s) (22 UI/UX, 14 other).
- UI/UX touched: `app/page.tsx`, `app/stats/page.tsx`, `app/train/page.tsx`, `app/tune/page.tsx`, `components/AnswerInput.tsx`, `components/ConsoleCard.tsx`, `components/ConsoleShell.tsx`, `components/HomeActionPanel.tsx`, +14 more.
- Other engineering changes: `.gitignore`, `design.md`, `lib/hooks/useTrainController.ts`, `lib/ocr/tesseractClient.ts`, `lib/photo/binarize.ts`, `lib/photo/ocr.ts`, `lib/photo/pipeline.ts`, `package.json`, +6 more.
- Codex thread activity: 35 new message(s) across 3 workspace thread(s).
- Key thread updates:
- Decision: user - Cool. Here’s a clean “handoff pack” you can paste to an agent. It does exactly this: * Next.js serves **local traineddata** from `/public/tessdata` * Default...
- Decision: assistant - I verified execution, and I’m doing one quality pass: filtering out non-user/assistant system chatter from thread summaries so timeline entries focus on mean...
- Regression/Fix: user - # AGENTS.md instructions for /Users/yudha/Downloads/Suma <INSTRUCTIONS> ## Skills A skill is a set of local instructions to follow that is stored in a `SKILL...
- Regression/Fix: assistant - The home page HTML is definitely rendering on `3002`, so the issue is likely CSS token/class generation or client-side interaction logic, not missing markup....
- Regression/Fix: assistant - I’ve validated render paths and test suite; no runtime errors are appearing now on `3002`. I’m preparing a clean handoff with exact status, what I changed, a...
- Regression/Fix: assistant - Fixed. The app on `127.0.0.1:3002` is back up and serving normally (node process listening on port `3002`), and the stale chunk/runtime crash is cleared. - R...

- **2026-02-12 ~08:05 IST** (pending local, not committed yet)
  - **Dark Neumorphic UI System implemented:**
    - `globals.css` rewritten: full CSS custom property token set (colors, surfaces, strokes, radii, motion), neumorphic utility classes (`.neu-capsule`, `.neu-inset`, `.neu-segment-rail`, `.neu-btn-primary/secondary`), range slider styling, focus-visible halo.
    - `tailwind.config.ts` remapped to reference CSS custom properties for all colors, shadows, radii.
    - All 11 components rewritten: `ConsoleShell`, `ConsoleCard` (with `variant='raised'|'flat'`), `SegmentedControl` (carved seam dividers), `SeedInput` (inset well), `HomeHeader`, `HomeSetupPanel`, `HomeActionPanel`, `PromptDisplay`, `AnswerInput`, `SessionSummary`, `PhotoExplainDrawer`.
    - All 4 pages updated: `/` (full neumorphism), `/train` (flatter per spec §10), `/stats`, `/tune`.
    - Build passes (`npm run build`, exit 0). All 29 tests pass (7 test files).
    - Visually verified in browser: capsule cards with multi-layer shadows, segmented controls with seam dividers, inset-well inputs, raised buttons, correct typography.

- **2026-02-12 07:27:02 GMT+5:30 (+0530)** (automated local scan)
- Local workspace changes: 21 file(s) (15 UI/UX, 6 other).
- UI/UX touched: `app/page.tsx`, `app/train/page.tsx`, `app/tune/page.tsx`, `components/AnswerInput.tsx`, `components/ConsoleCard.tsx`, `components/HomeActionPanel.tsx`, `components/HomeHeader.tsx`, `components/HomeSetupPanel.tsx`, +7 more.
- Other engineering changes: `.gitignore`, `lib/hooks/useTrainController.ts`, `package.json`, `scripts/timeline_sync.mjs`, `tailwind.config.ts`, `TIMELINE.md`.
- Codex thread activity: 3 new message(s) across 2 workspace thread(s).
- Key thread updates:
- Decision: participant - Approved command prefix saved: - ["/bin/zsh", "-lc", "export NVM_DIR=\"$HOME/.nvm\" && [ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\" && npm run dev:res...
- Decision: participant - Approved command prefix saved: - ["/bin/zsh", "-lc", "export NVM_DIR=\"$HOME/.nvm\"; [ -s \"$NVM_DIR/nvm.sh\" ] && . \"$NVM_DIR/nvm.sh\"; npm run timeline:sy...
- Regression/Fix: assistant - I now have a persistent `3002` server running and it is returning `GET / 200`; I’m checking live runtime logs for client/hydration errors next, then I’ll pat...

- **2026-02-12 07:25:12 GMT+5:30 (+0530)** (automated local scan)
- Local workspace changes: 20 file(s) (15 UI/UX, 5 other).
- UI/UX touched: `app/page.tsx`, `app/train/page.tsx`, `app/tune/page.tsx`, `components/AnswerInput.tsx`, `components/ConsoleCard.tsx`, `components/HomeActionPanel.tsx`, `components/HomeHeader.tsx`, `components/HomeSetupPanel.tsx`, +7 more.
- Other engineering changes: `.gitignore`, `lib/hooks/useTrainController.ts`, `package.json`, `scripts/timeline_sync.mjs`, `tailwind.config.ts`.
- Codex thread activity: 2 new message(s) across 2 workspace thread(s).
- Key thread updates:
- Decision: participant - Approved command prefix saved: - ["/bin/zsh", "-lc", "pkill -f \"next dev\" 2>/dev/null || true; export NVM_DIR=\"$HOME/.nvm\"; [ -s \"$NVM_DIR/nvm.sh\" ] &&...
- Regression/Fix: assistant - I found and fixed a real issue before finishing: the first script version replaced the entire timeline history block instead of prepending. I’m patching the ...

- **2026-02-11 22:00+ IST** (operational, not a code commit)
- Dev server/CSS issue was debugged; server restarted cleanly and stylesheet serving verified.

- **2026-02-11 21:46 IST to 22:08 IST** (pending local, not committed yet)
- **OCR improvement batch (compacted):**
- Better extraction for tricky digits and lookalike characters.
- Better preprocessing for thin/weak digit strokes.
- Improved Tesseract handling with extra recognition variants for difficult images.
- OCR tests extended for these edge cases.
- Explainability panel updated for easier reading during debugging.

- **2026-02-11 21:46:10 IST** (`05d293c`)
- README privacy fix: removed absolute local machine paths.

- **2026-02-11 21:40:31 IST** (`87cae57`)
- README expanded to explain project setup and scope.

- **2026-02-11 21:32:35 IST** (`474a170`)
- Merged local project history with remote `main` baseline (safe history merge, no overwrite).

- **2026-02-11 21:32:09 IST** (`abaf75f`)
- Full Suma app initialized and committed.
- Added Next.js app routes (`/`, `/train`, `/stats`), components, session engine, local storage layer, photo pipeline, tests, fonts, and project configs.

- **2026-02-11 21:29:49 IST** (`64f47f4`)
- Repo baseline existed on GitHub (`README.md` only).

## Major Change Buckets (Compacted)

- **Core Product Foundation**
- Home, Train, Stats flows created.
- Session engine and local attempts/settings persistence established.

- **Photo/OCR Pipeline**
- OCR-first + palette fallback architecture implemented.
- Ongoing reliability tuning now focused on large/noisy images.

- **Quality + Safety**
- Unit tests added and passing in local runs.
- Type-check passing in local runs.
- Documentation and privacy cleanup completed.

- **Repo/Delivery**
- GitHub remote connected.
- Main branch pushed with history preserved.

## Current Pending Local Changes (Not Yet Committed)

- `.gitignore`
- `app/page.tsx`
- `app/stats/page.tsx`
- `app/train/page.tsx`
- `app/tune/page.tsx`
- `components/AnswerInput.tsx`
- `components/ConsoleCard.tsx`
- `components/ConsoleShell.tsx`
- `components/HomeActionPanel.tsx`
- `components/HomeHeader.tsx`
- `components/HomeSetupPanel.tsx`
- `components/PhotoExplainDrawer.tsx`
- `components/PromptDisplay.tsx`
- `components/SeedInput.tsx`
- `components/SegmentedControl.tsx`
- `components/SessionSummary.tsx`
- `design.md`
- `lib/hooks/useTrainController.ts`
- `lib/ocr/tesseractClient.ts`
- `lib/photo/binarize.ts`
- `lib/photo/ocr.ts`
- `lib/photo/pipeline.ts`
- `package.json`
- `public/Inspiration/image 48.png`
- `public/progression/1.png`
- `public/progression/2.png`
- `public/tessdata/.gitkeep`
- `public/tessdata/digits.traineddata.gz`
- `public/tessdata/eng.traineddata.gz`
- `README.md`
- `scripts/timeline_sync.mjs`
- `start.sh`
- `styles/globals.css`
- `tailwind.config.ts`
- `tests/ocr.test.ts`
- `TIMELINE.md`

## How To Read This File

- If an item has a commit hash, it is already in Git history.
- If marked "pending local", it exists in workspace but is not committed/pushed yet.
- Timeline order is **newest first** (top = latest).
