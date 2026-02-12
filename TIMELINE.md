# Suma Timeline

Last updated: 2026-02-12 16:44:30 GMT+5:30 (+0530)

## Simple Summary

This project moved from an empty repo to a working Suma MVP in one session.  
Main progress so far: app scaffold + train loop + storage + OCR/photo seed pipeline + tests + docs + GitHub push.  
Current active work (not committed yet): OCR reliability improvements, tuning dataset setup, and **dark neumorphic UI system**.

## Timeline (Date/Time + What Happened)

- **2026-02-12 16:44:30 GMT+5:30 (+0530)** (automated local scan)
- Local workspace changes: 0 file(s) (0 UI/UX, 0 other).
- Codex thread activity: 3 new message(s) across 1 workspace thread(s).

- **2026-02-12 16:38:08 GMT+5:30 (+0530)** (automated local scan)
- Local workspace changes: 0 file(s) (0 UI/UX, 0 other).
- Codex thread activity: 19 new message(s) across 3 workspace thread(s).
- Key thread updates:
- Regression/Fix: user - # AGENTS.md instructions for /Users/yudha/Downloads/Suma <INSTRUCTIONS> ## Skills A skill is a set of local instructions to follow that is stored in a `SKILL...
- Regression/Fix: assistant - I’m going to reproduce the issue locally first, then trace whether this is a server/runtime problem or a styling/render pipeline break. I’ll check repo statu...
- Regression/Fix: assistant - `app/layout.tsx` still imports `styles/globals.css`, so CSS should load if the stylesheet is valid. I’ll now check for syntax/build errors and run the app lo...
- Regression/Fix: assistant - Build succeeds, so this looks like a runtime/dev-server issue rather than a compile failure. I’ll inspect the recently changed UI files and then validate wha...
- Regression/Fix: assistant - I haven’t found a broken source file yet, so I’m checking the live dev server output next. This will tell us if you’re actually hitting Next.js with CSS asse...
- Regression/Fix: assistant - The CSS URL extraction script had a parsing bug from duplicate matches; I’m fixing that and re-running to test one exact HTML->CSS pair.

- **2026-02-12 16:38 GMT+5:30** (commit `feat: Liquid Glass Micro-Interactions`)
  - **Segmented Control Interaction Refinement:**
    - Restored elastic spring physics (420ms) for segment selection.
    - Implemented **Tap vs. Drag separation** to prevent pointer capture from swallowing clicks.
    - Added subtle **Pressed-down state** (scale squish) for tactile feedback.
    - Added **Re-tap bounce** (jelly wobble) on already-active segments.
    - Tuned animations for uniform feel across all segment widths.

- **2026-02-12 15:56:53 GMT+5:30 (+0530)** (automated local scan)
- Local workspace changes: 2 file(s) (2 UI/UX, 0 other).
- UI/UX touched: `components/SegmentedControl.tsx`, `styles/globals.css`.
- Codex thread activity: 1 new message(s) across 1 workspace thread(s).
- Key thread updates:
- UI/UX: assistant - I’m making one final hardening tweak: marking the segmented component as client-only to prevent any server-component import edge cases with hooks. Then I’ll ...

- **2026-02-12 15:56:28 GMT+5:30 (+0530)** (automated local scan)
- Local workspace changes: 2 file(s) (2 UI/UX, 0 other).
- UI/UX touched: `components/SegmentedControl.tsx`, `styles/globals.css`.
- Codex thread activity: 5 new message(s) across 2 workspace thread(s).
- Key thread updates:
- UI/UX: assistant - - Replaced brightness number entry on `/app/tune/page.tsx:198` with a slider that moves in 5-unit intervals and shows the current value, so the control is ea...
- UI/UX: assistant - `framer-motion` is unavailable in this environment right now, so I’m implementing the same liquid-drag interaction natively (pointer + velocity + trailing th...
- UI/UX: assistant - I’ve swapped the component logic to native drag + liquid thumb. Next I’m updating only the segmented-control CSS primitives so the new thumb/trail behave smo...
- UI/UX: assistant - I’ve finished the component and style integration. I’m running tests and a build check now to ensure the drag behavior compiles cleanly and doesn’t break exi...

- **2026-02-12 15:49:24 GMT+5:30 (+0530)** (automated local scan)
- Local workspace changes: 0 file(s) (0 UI/UX, 0 other).
- Codex thread activity: 1 new message(s) across 1 workspace thread(s).
- Key thread updates:
- Engineering: assistant - `npm install` is currently hanging without output (likely network stall). I’m going to stop that attempt and proceed with a no-new-dependency implementation ...

- **2026-02-12 15:48:48 GMT+5:30 (+0530)** (automated local scan)
- Local workspace changes: 1 file(s) (0 UI/UX, 1 other).
- Other engineering changes: `TIMELINE.md`.
- Codex thread activity: 14 new message(s) across 2 workspace thread(s).
- Key thread updates:
- Regression/Fix: user - # AGENTS.md instructions for /Users/yudha/Downloads/Suma <INSTRUCTIONS> ## Skills A skill is a set of local instructions to follow that is stored in a `SKILL...
- UI/UX: user - can you do it so that if i drag across segmented controls, it give me a drag effect? just like liquid glss but in neomorphic effect of ours? i've got somethi...
- UI/UX: assistant - Yes, I can adopt that Framer Motion-driven liquid drag behavior. The component already fits our neumorphic language (rounded capsules, gradients, soft shadow...
- UI/UX: assistant - I’m proceeding with the integration now: I’ll replace the current segmented control behavior with a drag-enabled liquid thumb interaction, keep the existing ...
- UI/UX: assistant - I’m implementing this with your Framer-style motion model. First I’ll install `framer-motion`, then replace the segmented control internals with pointer-drag...
- Engineering: assistant - I checked current setup: segmented control is still static and `framer-motion` isn’t in dependencies, so I’m integrating your drag model directly and adding ...

- **2026-02-12 15:06:15 GMT+5:30 (+0530)** (automated local scan)
- Local workspace changes: 0 file(s) (0 UI/UX, 0 other).
- Codex thread activity: 1 new message(s) across 1 workspace thread(s).
- Key thread updates:
- Engineering: assistant - Done. `TIMELINE.md` was updated and pushed to GitHub. Result: - Pushed branch: `main` - Latest pushed commit: `b3c159b` - Working tree: clean (`git status` e...

- **2026-02-12 11:26:39 GMT+5:30 (+0530)** (automated local scan)
- Local workspace changes: 0 file(s) (0 UI/UX, 0 other).
- Codex thread activity: 1 new message(s) across 1 workspace thread(s).
- Key thread updates:
- Engineering: assistant - Pre-push caught one new thread event and updated `TIMELINE.md` again, so push was correctly blocked. I’m auto-retrying: commit the new timeline delta and pus...

- **2026-02-12 11:25:27 GMT+5:30 (+0530)** (automated local scan)
- Local workspace changes: 0 file(s) (0 UI/UX, 0 other).
- Codex thread activity: 1 new message(s) across 1 workspace thread(s).

- **2026-02-12 11:25:16 GMT+5:30 (+0530)** (automated local scan)
- Local workspace changes: 1 file(s) (0 UI/UX, 1 other).
- Other engineering changes: `TIMELINE.md`.
- Codex thread activity: 2 new message(s) across 1 workspace thread(s).
- Key thread updates:
- Engineering: user - update timeline now and push to git
- Engineering: assistant - I’m doing it now: run `timeline:sync`, commit the resulting `TIMELINE.md` update, then push with the pre-push guard.

- **2026-02-12 11:23:46 GMT+5:30 (+0530)** (automated local scan)
- Local workspace changes: 0 file(s) (0 UI/UX, 0 other).
- Codex thread activity: 2 new message(s) across 1 workspace thread(s).
- Key thread updates:
- Engineering: assistant - Done. I updated uncommitted changes, synced timeline, committed, and pushed to `origin/main`. Pushed commits: 1. `4222f35` - `Update timeline and local chang...

- **2026-02-12 11:20:49 GMT+5:30 (+0530)** (automated local scan)
- Local workspace changes: 0 file(s) (0 UI/UX, 0 other).
- Codex thread activity: 1 new message(s) across 1 workspace thread(s).
- Key thread updates:
- Engineering: assistant - Timeline sync is updated now. I’m staging all current changes, creating one commit, and pushing to `origin/main` through the hook.

- **2026-02-12 11:20:36 GMT+5:30 (+0530)** (automated local scan)
- Local workspace changes: 11 file(s) (6 UI/UX, 5 other).
- UI/UX touched: `app/tune/page.tsx`, `components/AnswerInput.tsx`, `components/HomeActionPanel.tsx`, `components/SeedInput.tsx`, `components/SegmentedControl.tsx`, `styles/globals.css`.
- Other engineering changes: `.githooks/pre-push`, `lib/hooks/useTrainController.ts`, `lib/state/store.ts`, `tests/store.test.ts`, `TIMELINE.md`.
- Codex thread activity: 5 new message(s) across 1 workspace thread(s).
- Key thread updates:
- Engineering: assistant - Done. I implemented a hard pre-push guard for your repo. ### Implemented - Added hook: `/Users/yudha/Downloads/Suma/.githooks/pre-push` - Enabled repo hook p...
- Engineering: user - Sure like no verify I can bypass however, every time I say get Pushti ensure that the timeline is updated and only then it should push
- Engineering: assistant - Understood. From now on, whenever you ask me to `git push`, I will do this sequence: 1. `npm run timeline:sync` 2. Verify `/Users/yudha/Downloads/Suma/TIMELI...
- Engineering: user - uncommitted changes need to be updated too and push to git
- Engineering: assistant - I’ll take all current uncommitted changes through the full flow now: sync `TIMELINE.md`, commit everything, and push. I’ll run it in a tight sequence so the ...

- **2026-02-12 11:18:13 GMT+5:30 (+0530)** (automated local scan)
- Local workspace changes: 11 file(s) (6 UI/UX, 5 other).
- UI/UX touched: `app/tune/page.tsx`, `components/AnswerInput.tsx`, `components/HomeActionPanel.tsx`, `components/SeedInput.tsx`, `components/SegmentedControl.tsx`, `styles/globals.css`.
- Other engineering changes: `.githooks/pre-push`, `lib/hooks/useTrainController.ts`, `lib/state/store.ts`, `tests/store.test.ts`, `TIMELINE.md`.
- Codex thread activity: 72 new message(s) across 3 workspace thread(s).
- Key thread updates:
- Regression/Fix: assistant - The code quality is solid: functionality is organized around composable `use*` controllers and shared layout/utility components, keeping UI logic separate fr...
- Regression/Fix: assistant - **Code Differences** - **Tailwind + globals**: Introduced `consoleSurface*` palette, `consoleEdgeSoft`, new shadows, and updated body background (radial + li...
- Regression/Fix: user - # AGENTS.md instructions for /Users/yudha/Downloads/Suma <INSTRUCTIONS> ## Skills A skill is a set of local instructions to follow that is stored in a `SKILL...
- Regression/Fix: assistant - Adjusted. The “correct answer” feedback no longer uses the harsh neon green pulse. - Updated `/Users/yudha/Downloads/Suma/styles/globals.css:674` to a softer...
- Regression/Fix: assistant - Root cause was in session startup: Sprint/Session modes were always preloading the historical fix queue first, so you kept seeing the same recycled prompts i...
- Regression/Fix: assistant - I also want to give you a stronger guarantee for this exact bug, so I’m adding a regression test that asserts Sprint/Session start from seeded generation (no...

- **2026-02-12 11:18:02 GMT+5:30 (+0530)** (automated local scan)
- Local workspace changes: 10 file(s) (6 UI/UX, 4 other).
- UI/UX touched: `app/tune/page.tsx`, `components/AnswerInput.tsx`, `components/HomeActionPanel.tsx`, `components/SeedInput.tsx`, `components/SegmentedControl.tsx`, `styles/globals.css`.
- Other engineering changes: `.githooks/pre-push`, `lib/hooks/useTrainController.ts`, `lib/state/store.ts`, `tests/store.test.ts`.
- Codex thread activity: 72 new message(s) across 3 workspace thread(s).
- Key thread updates:
- Regression/Fix: assistant - The code quality is solid: functionality is organized around composable `use*` controllers and shared layout/utility components, keeping UI logic separate fr...
- Regression/Fix: assistant - **Code Differences** - **Tailwind + globals**: Introduced `consoleSurface*` palette, `consoleEdgeSoft`, new shadows, and updated body background (radial + li...
- Regression/Fix: user - # AGENTS.md instructions for /Users/yudha/Downloads/Suma <INSTRUCTIONS> ## Skills A skill is a set of local instructions to follow that is stored in a `SKILL...
- Regression/Fix: assistant - Adjusted. The “correct answer” feedback no longer uses the harsh neon green pulse. - Updated `/Users/yudha/Downloads/Suma/styles/globals.css:674` to a softer...
- Regression/Fix: assistant - Root cause was in session startup: Sprint/Session modes were always preloading the historical fix queue first, so you kept seeing the same recycled prompts i...
- Regression/Fix: assistant - I also want to give you a stronger guarantee for this exact bug, so I’m adding a regression test that asserts Sprint/Session start from seeded generation (no...

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

- _(none)_

## How To Read This File

- If an item has a commit hash, it is already in Git history.
- If marked "pending local", it exists in workspace but is not committed/pushed yet.
- Timeline order is **newest first** (top = latest).
