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

- Architecture: [`Architecture.md`](./Architecture.md)
- Coding standards: [`Coding_Standards.md`](./Coding_Standards.md)
- Implementation plan: [`Implementation_plan.md`](./Implementation_plan.md)
- Extended notes: [`Extended_Notes.md`](./Extended_Notes.md)

## Quick start

### Prerequisites

- Node 20 (see `.nvmrc`)
- npm

If you run the app with a different Node major version, `npm run dev` now exits early with a clear error instead of serving a partially broken UI.

### Install and run

```bash
npm install
npm run dev
```

Or use:

```bash
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

### Local Tesseract traineddata

Suma now expects local traineddata files served from `public/tessdata`:

- `public/tessdata/eng.traineddata.gz` (fast default worker)
- `public/tessdata/digits.traineddata.gz` (on-demand high-accuracy digits worker)

Download and gzip:

```bash
mkdir -p public/tessdata
curl -L "https://github.com/tesseract-ocr/tessdata_fast/raw/main/eng.traineddata" -o public/tessdata/eng.traineddata
gzip -9 -f public/tessdata/eng.traineddata
curl -L "https://github.com/Shreeshrii/tessdata_shreetest/raw/master/digits.traineddata" -o public/tessdata/digits.traineddata
gzip -9 -f public/tessdata/digits.traineddata
```

If you keep plain `.traineddata` files instead of `.gz`, set `gzip: false` in `lib/ocr/tesseractClient.ts`.

## OCR tuning benchmark

Use `/tune` to batch-run OCR against images in `public/tune` and get exact-match accuracy.

- File naming for expected values: put the expected digits after the final hyphen.
- Example: `Capture-2026-02-11-221241-2025.png`
- Supported expected length: 2-8 digits.
- Tune page reports per-file mismatches and allows CSV export.

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
