# Suma

Suma is a client-only mental math web app (Next.js + TypeScript + Tailwind) built around short timed sessions, real-world seed numbers, and a photo-to-seed OCR flow with explainable fallback.

Working product direction: "Math in the Wild" MVP.

## What is implemented

- Home console (`/`) with:
  - Sprint (60s) and Session (120s) start
  - typed seed input (sanitized to digits)
  - Surprise Me seed generation
  - photo upload and paste (`Cmd+V` / `Ctrl+V`) seed extraction
  - digits selector and tempo selector
- Train flow (`/train`) with:
  - timer countdown
  - single-prompt answer loop
  - Enter to submit, Esc to exit
  - session summary (score, accuracy, average time)
- Stats page shell (`/stats`)
- localStorage persistence for settings and attempts
- Fix My Misses queue seeding in session engine
- OCR-first photo pipeline with palette fallback and explainability drawer

## Stack

- Next.js App Router
- React
- TypeScript (`strict`)
- Tailwind CSS
- Zustand (state store)
- Vitest (unit tests)

## Project docs

- Architecture: `/Users/yudha/Downloads/Suma/Architecture.md`
- Coding standards: `/Users/yudha/Downloads/Suma/Coding_Standards.md`
- Implementation plan: `/Users/yudha/Downloads/Suma/Implementation_plan.md`
- Extended notes: `/Users/yudha/Downloads/Suma/Extended_Notes.md`

## Quick start

### Prerequisites

- Node 20 (see `.nvmrc`)
- npm

### Install and run

```bash
cd /Users/yudha/Downloads/Suma
npm install
npm run dev
```

Or use:

```bash
cd /Users/yudha/Downloads/Suma
./start.sh
```

Open `http://localhost:3000`.

## Quality checks

```bash
npm test
npx tsc --noEmit
npm run lint
npm run build
```

## Architecture boundaries

- UI in `/app` and `/components`
- domain logic in `/lib/session` and `/lib/questions`
- persistence only through `/lib/storage/local.ts`
- photo processing under `/lib/photo`
- optional workers in `/workers`
- no backend dependency for core loop

## Local storage keys

- `miw.settings.v1`
- `miw.attempts.v1`

## OCR and photo behavior

Photo seed derivation uses this order:

1. preprocess image (downscale + brightness + OCR binarization)
2. OCR candidate extraction (TextDetector, then grid pass, then Tesseract fallback)
3. choose best numeric candidate (2-8 digits, scored by confidence and usable length)
4. if OCR is unusable, fallback to deterministic palette-to-digits mapping
5. expose explainability in "How we got this number"

If OCR fails on large images, crop the numeric region tighter for better accuracy. The app will still return a seed via fallback so training is never blocked.

## Scripts

- `npm run dev`: start development server
- `npm run build`: production build
- `npm run start`: run production server
- `npm run test`: run Vitest suite
- `npm run lint`: run Next/ESLint checks

## Repo structure

```text
app/
components/
lib/
  hooks/
  metrics/
  photo/
  questions/
  session/
  state/
  storage/
styles/
tests/
workers/
```

## Current status

The app is functional for MVP core flow and local development. Next planned enhancements are deeper Fix My Misses behavior, full Stats completion, and photo OCR robustness tuning.
