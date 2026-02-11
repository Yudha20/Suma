# Coding Standards - Math in the Wild

Goal: keep the codebase clean, fast to iterate, and portfolio-grade.

---

## 1) General principles
- Prefer clarity over cleverness.
- Keep components small and composable.
- Separate UI from domain logic (session engine, templates, storage).
- Every “cool” feature must have a fallback and must not block training.

---

## 2) TypeScript
- strict: true
- No any unless justified in a comment.
- Use discriminated unions for mode/state.

Good:
- type Tempo = 'calm'|'fast'|'flow'

Avoid:
- string for enums

---

## 3) Next.js + React conventions
- Keep page.tsx thin, compose from components.
- No business logic in JSX.

Component rules
- One component per file.
- PascalCase components.
- Hooks named useX.

---

## 4) Tailwind styling rules
- Prefer utilities.
- Extract repeated class sets into components.
- If className becomes unreadable, make a component.

---

## 5) State management
- Store only what you need.
- Derived state belongs in selectors/utilities.
- localStorage writes should be batched/debounced.

---

## 6) Storage rules
- All localStorage access goes through lib/storage/local.ts.
- Provide migrate.ts for schema changes.
- Wrap reads in try/catch and validate shape lightly.

---

## 7) Session engine boundaries
- Session engine is pure-ish and testable.
- UI calls engine functions.

Rule:
- prompts and answers generated in lib/questions
- checking/scoring in lib/session

---

## 8) Performance and workers
- Heavy image processing off main thread when possible.
- Strict timeouts and fallbacks.
- Avoid shipping massive OCR libs unless justified.

---

## 9) Accessibility minimum bar
- Fully keyboard usable
- Visible focus ring
- Tap targets >= 44px
- Contrast: prompt + CTA clearly readable
- Not color-only feedback

---

## 10) Micro-interaction standards
- Must improve comprehension or reinforce state.
- 120–200ms for most feedback.
- Avoid layout-jank animations.

---

## 11) Error handling
- No silent failures.
- Photo scan failures fall back to Surprise Me.
- Always allow exit/pause.

---

## 12) Definition of done
A feature is done when:
- Works on mobile + desktop
- Keyboard accessible
- Doesn’t block start
- Saves/loads correctly
- Has basic event logging
- Has fallback paths
