# 010 — Micro feel fixes: hamburger scale, service-row GPU wipe

- **Status**: DONE (2026-07-22, verified)
- **Commit**: ebc0b94
- **Severity**: MEDIUM (two small, independent fixes)
- **Category**: Physicality / Performance
- **Estimated scope**: 2 files (src/components/Navigation.tsx one class, src/index.css ~20 lines)

## Fix 1 — Hamburger middle bar: never `scale(0)`

### Problem

```tsx
// src/components/Navigation.tsx:145-151 — current (middle bar)
<span
  className={cn(
    'h-0.5 w-7 transition-[opacity,transform] duration-300 ease-out-quad',
    isScrolled || isMenuOpen ? 'bg-exvia-black' : 'bg-white',
    isMenuOpen && 'scale-0 opacity-0'
  )}
/>
```

Rule: never `scale(0)` — nothing in the real world appears from nothing; target `scale(0.9–0.97)` + `opacity: 0`. On menu close the bar grows back from literal zero. The `opacity-0` already handles the hide.

### Target

```tsx
isMenuOpen && 'scale-90 opacity-0'
```

One class change (`scale-0` → `scale-90`); everything else identical.

## Fix 2 — Service row hover wipe: transform, not `background-size`

### Problem

```css
/* src/index.css:655-664 — current */
.service-row {
  background: linear-gradient(90deg, color-mix(in srgb, var(--service-accent) 5%, transparent), transparent 32%);
  background-size: 0 100%;
  background-repeat: no-repeat;
  transition-property: background-size, opacity, transform;
}

.service-row:hover {
  background-size: 100% 100%;
}
```

Animating `background-size` repaints the gradient off-GPU on every frame of a hover seen tens of times per visit. Rule: animate `transform` and `opacity` only.

### Target

A `::before` overlay that scales on the compositor. The row keeps `opacity, transform` transitions for its scroll reveal (the Tailwind classes on the element set duration/easing for those):

```css
/* target — replaces the block above */
.service-row {
  position: relative;
  transition-property: opacity, transform;
}

.service-row::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, color-mix(in srgb, var(--service-accent) 5%, transparent), transparent 32%);
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 500ms var(--ease-out-quart);
  pointer-events: none;
}

@media (hover: hover) and (pointer: fine) {
  .service-row:hover::before {
    transform: scaleX(1);
  }

  .service-row:hover .service-icon {
    border-color: color-mix(in srgb, var(--service-accent) 40%, white);
  }
}
```

Notes for the executor:

- The existing bare `.service-row:hover .service-icon` rule (currently at `src/index.css:666-668`) MOVES inside the new hover-gate media query as shown (this row's hover effects all gate together; plan 008 deliberately left `.service-row` to this plan).
- `::before` paints beneath the row's grid children (it precedes them in paint order), so no z-index management is needed — but verify visually.
- The wipe reads left→right exactly as before; the soft 32% fade edge now stretches during the scale rather than staying fixed-width. That's the accepted trade for compositor-only animation — flagged in the feel check.

## Repo conventions to follow

- Easing token: `var(--ease-out-quart)` (`src/index.css:66`), the repo's standard for movement.
- Hover gate: `@media (hover: hover) and (pointer: fine)`, as at `src/index.css:258`.

## Steps

1. `src/components/Navigation.tsx`: middle hamburger bar, `scale-0` → `scale-90`.
2. `src/index.css`: replace the `.service-row` / `.service-row:hover` / `.service-row:hover .service-icon` rules with the Target block.

## Boundaries

- Do NOT touch the first/third hamburger bars or their timing.
- Do NOT change `.service-row`'s Tailwind reveal classes in `src/sections/Services.tsx`.
- Do NOT alter the gradient colors/stops.
- If current code differs from the quotes (drift), STOP and report.

## Verification

- **Mechanical**: `npm run build` && `npm run lint` pass.
- **Feel check**:
  - Mobile viewport: toggle the hamburger open/closed several times slowly — the middle bar now fades while shrinking only slightly, and on close it fades back in from 90% rather than inflating from a point. Rapid toggling stays smooth (transitions retarget).
  - Services section, mouse: hover a row — the accent wash sweeps in left→right over 500ms, visually equivalent to before (soft edge may stretch slightly during the sweep — acceptable; if it reads as obviously distorted, report with a screenshot instead of shipping). Icon border still tints.
  - DevTools Performance panel while hovering rows repeatedly: no paint storms attributable to the row background (the wipe is transform-only).
  - Touch emulation: tapping a service row leaves no stuck wash.
- **Done when**: both fixes pass their feel checks and the build is green.
