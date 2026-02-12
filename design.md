# Suma UI System — Dark Neumorphic Control-Rail

**Inspiration:** `public/Inspiration/image 48.png`

## Token Reference

All tokens are defined in `styles/globals.css` as CSS custom properties.
Tailwind config in `tailwind.config.ts` maps to these properties.

### Colors
| Token | Value | Usage |
|---|---|---|
| `--bg-0` | `#191919` | Deepest base |
| `--bg-1` | `#212121` | Primary page surface |
| `--surface-0` | `#2A2C2D` | Capsule top tint |
| `--surface-1` | `#1C1D1E` | Capsule bottom tint |
| `--surface-selected-0/1` | `#1E1F20/#141516` | Selected segment |
| `--text` | `#E7EAF0` | Primary text |
| `--text-muted` | `rgba(231,234,240,0.65)` | Secondary text |
| `--text-dim` | `rgba(231,234,240,0.45)` | Tertiary/placeholder |
| `--accent` | `#05C028` | Active/on indicators only |

### Radii
`--r-capsule: 28px`, `--r-tile: 16px`, `--r-field: 14px`, `--r-pill: 999px`

### Motion
`--t-fast: 120ms`, `--t-normal: 180ms`, `--ease: cubic-bezier(0.2,0.8,0.2,1)`

## CSS Utility Classes

| Class | Purpose |
|---|---|
| `.neu-capsule` | Raised card with multi-layer shadows |
| `.neu-capsule-flat` | Flatter variant for Train screen |
| `.neu-inset` | Inset well (inputs, stat cards) |
| `.neu-segment-rail` | Segmented control container |
| `.neu-segment` | Segmented control button |
| `.neu-btn-primary` | Raised neumorphic CTA button |
| `.neu-btn-secondary` | Muted pill button |
| `.neu-label` | 11px uppercase micro label |

## Component Architecture

- `ConsoleShell` — page wrapper (840px max, responsive padding)
- `ConsoleCard` — capsule card, supports `variant='raised'|'flat'`
- `SegmentedControl` — text segmented rail with carved seam dividers
- `SeedInput` — inset-well input
- All buttons use `.neu-btn-primary` or `.neu-btn-secondary`

## Page Rules

- **Home** (`/`): full neumorphism via `ConsoleCard variant="raised"`
- **Train** (`/train`): flatter via `ConsoleCard variant="flat"` — higher contrast for speed answering
