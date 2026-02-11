# Extended Notes — Math in the Wild (MVP)

## 1) AI automation deep dive (photo mode)

### OCR decision criteria

* Use OCR result if any digit group is detected with confidence >= threshold (define threshold in code config)
* If multiple candidates exist:
  * Prefer longest digit group up to 8 digits
  * Break ties by higher confidence
  * If still tied, prefer candidate closer to image center

### Palette mapping (fallback)

**Inputs**

* 4–6 swatches from MMCQ / median‑cut
* Swatches ordered by prominence

**Mapping rule: 6 hue buckets + brightness math**

* Convert swatch color to HSL
* Map hue to 0–5 bucket (360° / 6)
* Convert bucket + brightness to digit:
  * `digit = (bucket * 2 + brightnessIndex) % 10`
  * `brightnessIndex`: 0 for darker half of L, 1 for brighter half

**Seed construction**

* Order digits by swatch prominence
* Concatenate to seed (cap at 8 digits)

### Fallback and error handling

* If OCR fails or times out: use palette fallback
* If palette extraction fails or times out: fall back to Surprise Me
* Always return a seed (never block start)

### Explainability UI

* Drawer: “How we got this number”
* OCR path: show detected digits + highlight preview
* Palette path: show swatches + mapping legend + brightness selection

---

## 2) Question generation details

### Deterministic seed‑based generation

* Use seed to initialize a deterministic RNG
* Question templates are selected in a balanced distribution
* Avoid repeating the same template more than twice in a row

### Range guidelines per template

* Add/Subtract: 2–4 digit numbers based on digit setting
* Multiply: constrain B to 1–12 for mental speed
* Divide: construct A as (B × K) to ensure clean divisibility
* Split: choose N in {2, 3, 4, 5, 6, 8, 10}
* Percent: use fixed 18% GST and round to nearest integer
* Round: choose nearest 10/100/1000 based on digits
* Delta: compute next 100/1000 boundary based on seed length

---

## 3) Timing & feedback details

* Start timer at question render
* Stop timer at Enter submit
* Feedback animation duration < 180ms
* Auto‑advance immediately after feedback

---

## 4) Fix My Misses algorithm

### Selection

* Include attempts that are wrong OR exceed slow threshold
* Exclude any attempt already fixed in last 2 sessions (cool‑down)

### Fix set sizing

* Sprint: up to 3 fixes
* Session: up to 5 fixes

### Ordering

* Prioritize wrong over slow
* Within each group: most recent first

---

## 5) Stats aggregation

* Rolling accuracy (last 50 attempts)
* Rolling median time (last 50 attempts)
* Weak spots: template types with highest wrong + assisted rates
* Assisted rate: reveals / total attempts

---

## 6) State & storage

### Local storage keys

* `mitw.sessionAttempts.v1`
* `mitw.userSettings.v1`
* `mitw.fixQueue.v1`
* `mitw.statsCache.v1`

### Versioning

* If version mismatch, migrate or reset (log event locally)

---

## 7) Component inventory

* ConsoleCard
* PrimaryButton
* SecondaryButton
* SegmentedControl (Digits, Tempo)
* ChipGroup (Moves)
* BottomSheet (More)
* PromptDisplay
* AnswerInput
* ResultToast
* HelpDrawer

---

## 8) Testing strategy (doc‑level)

**Unit tests**

* Question generator produces valid ranges per template
* Divide template always yields integer results
* Slow threshold classification by tempo
* Fix set selection rules (wrong/slow + cooldown)
* Palette mapping deterministic output for given swatches

**Integration tests**

* Home → Start → first question under 2s
* Reveal limit enforced per mode
* Photo flow: OCR success, OCR fail → palette success, palette fail → Surprise
* Stats update after session

**E2E flows**

* Instant start flow
* Typed seed flow
* Surprise Me flow
* Photo mode flow with explainability drawer
