# Architecture - Math in the Wild

Target: ship an MVP in 1 day with a clean structure that won’t collapse when you add Photo/OCR + Fix My Misses.

---

## 1) Stack (confirmed default)
- Next.js (App Router)
- React
- TypeScript (strict)
- Tailwind CSS
- Zustand (tiny state store) OR plain React context (either works; Zustand recommended for speed)
- Framer Motion (optional) for micro-interactions only

### Tech stack overrides / constraints
- Client-only MVP (no backend)
- Persist via localStorage only
- Heavy work (palette/OCR) runs in a Web Worker
- Image is aggressively downscaled/compressed before processing
- Photo/OCR is progressive enhancement with strict timeouts + fallbacks

---

## 2) High-level system design
Three product surfaces:
1) Home Console: settings + seed + start
2) Train: session engine (timer + prompt loop)
3) Stats: local aggregation + weak spots

Under the hood:
- Session Engine generates questions, checks answers, records attempts.
- History Store persists attempts and settings.
- Photo Pipeline produces a seed number (OCR-first, palette fallback).

---

## 3) App routes
- / -> Home Console
- /train -> Sprint/Session gameplay
- /stats -> stats + weak spots

Optional later:
- /settings -> if you don’t want Settings inside Home “More”

---

## 4) State model (recommended slices)
SettingsSlice
- digitsMax: 2|3|4|6|8
- tempo: 'calm'|'fast'|'flow'
- flashEnabled: boolean
- flashMs: number
- movesEnabled: MoveId[]
- sttEnabled: boolean
- brightnessTweak: number

SessionSlice
- mode: 'sprint60'|'session120'|'fix'
- seed: string (2–8 digits)
- seedSource: 'auto'|'typed'|'surprise'|'photo-ocr'|'photo-palette'
- startTs, endTs
- timeLeftMs
- currentQuestion?: Question
- queue: Question[]
- results: Attempt[]

HistorySlice
- attempts: Attempt[] (rolling window)
- weakSpots: WeakSpot[] (derived)
- fixQueue: Question[] (derived)

PhotoSlice
- photoStatus: 'idle'|'processing'|'done'|'error'
- photoCandidates: string[]
- paletteSwatches: Swatch[]
- explainability: ExplainBlock[]

---

## 5) localStorage keys
- miw.settings.v1
- miw.attempts.v1
- miw.seedHistory.v1 (optional)

Attempt shape (minimal)
- id, ts
- seed, seedSource
- mode, tempo, flash
- moveId, templateId
- prompt, answer, userAnswer
- isCorrect, isAssisted, hintUsed
- timeMs

---

## 6) Session Engine
Responsibilities
- Build queue from (seed + digitsMax + enabled moves)
- Present 1 question at a time
- Validate input + correctness
- Record timing + assistance (hint/reveal)
- Auto-advance on submit
- End session on timer
- Produce summary + fix queue

MoveId examples
- add, sub, mul, div, split, gst18, round, next1000

Fix My Misses derivation
- wrong OR slow OR assisted -> eligible
- prioritize recent (last 50) attempts

---

## 7) Seed sources
- Auto: weighted distribution (2–8 digits; 8 is rare)
- Typed: sanitize to 2–8 digits
- Surprise: optional “real-world note”
- Photo OCR: extracted digits
- Photo Palette: derived digits

Determinism
- Use a seeded RNG from seed + sessionStartTs.

---

## 8) Photo pipeline
Principle: optional, never blocks training.

Stages
1) Acquire: upload/camera
2) Downscale: canvas resize to 256–512px max
3) Preprocess: brightness tweak
4) OCR-first:
   - Use TextDetector if available
   - Else optional library behind flag
   - Hard timeout (900–1500ms budget)
5) Fallback: palette extraction (MMCQ / median-cut)
6) Explainability: store how seed was created

Workers
- palette.worker.ts
- ocr.worker.ts (optional)

---

## 9) Performance budgets
- Time-to-first-question: < 2s
- Photo seed: best-effort < 1s; timeout then fallback
- No main-thread blocking > 50ms

---

## 10) Folder layout (recommended)
app/
page.tsx # Home Console
train/page.tsx # Train
stats/page.tsx # Stats
layout.tsx

components/
ConsoleShell.tsx
ConsoleCard.tsx
SeedInput.tsx
SegmentedControl.tsx
MoreSheet.tsx
PromptDisplay.tsx
AnswerInput.tsx
HelpControl.tsx
SessionSummary.tsx

lib/
session/
engine.ts
rng.ts
scoring.ts
questions/
templates.ts
builders.ts
storage/
local.ts
migrate.ts
photo/
downscale.ts
brightness.ts
palette.ts
mapping.ts
metrics/
events.ts
logger.ts

workers/
palette.worker.ts
ocr.worker.ts

styles/
globals.css

---

## 11) Build order
1) Routes + shells (Home/Train/Stats)
2) Session engine + templates
3) History persistence
4) Fix My Misses
5) Console polish + More sheet
6) Photo pipeline (downscale + palette fallback)
7) OCR enhancement
8) Stats aggregation
9) Accessibility + perf pass
