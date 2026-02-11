# Suma Timeline

Last updated: 2026-02-11 22:07:50 IST (+0530)

## Simple Summary

This project moved from an empty repo to a working Suma MVP in one session.  
Main progress so far: app scaffold + train loop + storage + OCR/photo seed pipeline + tests + docs + GitHub push.  
Current active work (not committed yet): OCR reliability improvements and tuning dataset setup.

## Timeline (Date/Time + What Happened)

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

- `components/PhotoExplainDrawer.tsx`
- `lib/photo/binarize.ts`
- `lib/photo/ocr.ts`
- `tests/ocr.test.ts`
- `public/tune/` (new tuning image folder)
- `TIMELINE.md` (this file)

## How To Read This File

- If an item has a commit hash, it is already in Git history.
- If marked "pending local", it exists in workspace but is not committed/pushed yet.
- Timeline order is **newest first** (top = latest).
