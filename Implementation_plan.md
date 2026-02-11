# Implementation Plan — Math in the Wild (MVP)

## 1) Scope & non‑goals

**MVP scope**

* Client‑only, responsive web app (desktop/tablet/mobile)
* Core loop: seeded mental‑math sessions with timer, feedback, and “Fix My Misses”
* Optional seed sources: typed number, Surprise Me, Photo mode
* Local stats and local storage only

**Non‑goals (MVP)**

* Accounts, cloud sync, leaderboards
* Streak gamification
* Heavy AI or server inference
* Complex lesson content

**Constraints**

* No backend required for core loop
* No paid APIs
* First question under 2 seconds

---

## 2) User experience goals

* **Instant start**: Start → question immediately
* **Instrument feel**: console‑style UI, minimal reading
* **Clear improvement signal** after each session
* **No dead ends**: Hint → Reveal ladder and always a way forward

---

## 3) Routes & navigation

* `/` (Home Console)
* `/train` (Sprint/Session gameplay)
* `/stats` (Local stats)

Navigation stays minimal: Train (default), Stats, Settings tucked in Train or “More”.

---

## 4) Core flows

**Instant start (no seed)**
1. Home → Start Sprint
2. App generates seed
3. First question appears
4. Finish → summary + Fix preview

**Typed seed**
1. Enter “Number from your day”
2. Set digits/tempo
3. Start → seed‑based questions

**Surprise Me**
1. Tap Surprise Me
2. Show generated number + optional 1‑line note
3. Start

**Photo mode**
1. Upload/capture
2. Scan (hard timeout)
3. Seed produced + “How we got this” drawer
4. Start

---

## 5) Game loop rules

* **No‑skip** in Sprint/Session
* **Help ladder**: Hint → Reveal
* **Reveal limits**
  * Sprint 60s: max 2 reveals
  * Session 120s: max 4 reveals
  * Fix My Misses: unlimited reveals
* **Slow thresholds by tempo**
  * Calm: > 6s
  * Flow: > 4s
  * Fast: > 3s

---

## 6) Question templates (all 8 active)

1. **Add**: A + B
2. **Subtract**: A − B (avoid negative unless explicitly allowed)
3. **Multiply**: A × B (limit ranges)
4. **Divide**: A ÷ B (ensure clean divisibility)
5. **Split**: “Split SEED among N people” (integer result)
6. **Percent**: “Add 18% GST to SEED and round” (rounding defined)
7. **Round**: “Round SEED to nearest 10/100/1000”
8. **Delta**: “How much more to reach next 1000?”

Templates are controlled by Chips in “More” settings.

---

## 7) Session structure

* **Sprint**: 60s
* **Session**: 120s

**Tempo behavior**

* Calm: accuracy‑first pacing
* Flow: mixed pacing
* Fast: speed‑first pacing

**Flash presets**

* 0.7s / 1.2s / 1.8s

---

## 8) Local data model

**SessionAttempt** (stored in localStorage as JSON array)

* `id`
* `timestamp`
* `seed`
* `seedSource`
* `tempo`
* `flash`
* `templateType`
* `questionText`
* `correctAnswer`
* `userAnswer`
* `isCorrect`
* `isAssisted`
* `timeMs`

**Derived stats**

* rolling accuracy
* rolling median time
* weak spots (template + error type)

---

## 9) Fix My Misses

**Definition**

* Any question marked wrong OR slow (based on tempo threshold)

**Behavior**

* Next session begins with a short fix set (count defined in Extended Notes)
* Fix set questions are tagged and stored like normal attempts

---

## 10) Photo mode pipeline

1. Preprocess: downscale to 256–512px, compress, run in Web Worker when possible
2. OCR‑first: extract digits; if multiple candidates, prefer longer group (≤ 8 digits) with higher confidence
3. Fallback: palette‑to‑digits mapping
4. Explainability: “How we got this number” drawer

---

## 11) Performance budgets

* First question: < 2s
* Photo scan: < 1s (modern phone)
* If photo scan fails or times out: fall back to Surprise Me without blocking

---

## 12) Accessibility requirements

* Keyboard navigation end‑to‑end
* Visible focus states
* Tap targets ≥ 44px
* Contrast: prompt text and main actions meet standards
* Success/failure not color‑only

---

## 13) Instrumentation events (local)

* session_started
* seed_source_selected (typed, surprise, photo)
* question_shown
* answer_submitted
* answer_correct
* answer_incorrect
* answer_assisted (reveal used)
* hint_used
* reveal_used
* flash_enabled
* session_completed

Funnel: Home → Start → First Answer → Session Complete

---

## 14) Milestones with acceptance criteria

**Step 1: Skeleton**

* Routes: Home, Train, Stats
* Minimal navigation

**Step 2: Core training**

* Question generator
* Timer
* Answer input + feedback
* Session summary

**Step 3: Tempo + flash**

* Tempo affects slow thresholds
* Flash hides prompt after preset time

**Step 4: Fix My Misses**

* Wrong/slow logged
* Fix set generated for next session

**Step 5: Home console polish**

* Seed input
* Digits + tempo segmented controls
* Surprise Me

**Step 6: Photo mode**

* Upload + preprocess + OCR
* Palette fallback + brightness tweak
* Explainability drawer

**Step 7: Stats**

* Local aggregation
* Weak spots + assisted rate

**Step 8: Accessibility + performance**

* Focus states
* Keyboard support
* Tap targets
* Time‑to‑first‑question < 2s
