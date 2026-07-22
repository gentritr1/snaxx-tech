# 008 — Gate hover motion for touch devices

- **Status**: DONE (2026-07-22, verified)
- **Commit**: ebc0b94
- **Severity**: MEDIUM
- **Category**: Accessibility
- **Estimated scope**: 2 files (tailwind.config.js, src/index.css), ~10 lines

## Problem

Touch browsers fire `:hover` on tap and leave it stuck until the user taps elsewhere. Every Tailwind `hover:`/`group-hover:` transform in the app is ungated, so on phones a tap leaves cards scaled and arrows displaced:

- `src/sections/Portfolio.tsx:56` — `group-hover:scale-[1.025]` (card image zoom)
- `src/sections/Portfolio.tsx:211` — `group-hover:translate-x-1`
- `src/sections/Services.tsx:50` — `md:group-hover:scale-100` (+ opacity/saturate)
- `src/sections/About.tsx:110` — `group-hover:scale-105`
- `src/sections/CTA.tsx:101` — `group-hover:translate-x-1`
- `src/sections/Footer.tsx:95` — `group-hover:translate-x-0` arrow reveal
- `src/components/Navigation.tsx:104` — `group-hover:scale-x-100` underline
- `src/components/LegalLayout.tsx:87, 98`, `src/pages/LegalPage.tsx:155`, `src/pages/NotFound.tsx:40` — arrow nudges

Plus raw CSS equivalents in `src/index.css:641-653`, wrapped in no hover media query:

```css
/* src/index.css:641-653 — current */
.group:hover .project-accent-wash,
.group:focus-visible .project-accent-wash {
  opacity: 1;
}

.portfolio-cta-arrow {
  transition: transform 300ms var(--ease-out-quart);
}

.group:hover .portfolio-cta-arrow,
.group:focus-visible .portfolio-cta-arrow {
  transform: translate(0.5rem, -50%);
}
```

The codebase already knows the correct pattern — the wordmark hover is gated (`src/index.css:258`: `@media (hover: hover) and (pointer: fine)`) — it just was never applied to the Tailwind hovers or these raw rules.

## Target

1. Tailwind generates all `hover:` variants inside `@media (hover: hover)` via the v3 future flag:

```js
// tailwind.config.js — top level, sibling of `theme`
future: {
  hoverOnlyWhenSupported: true,
},
```

2. The raw `.group:hover` rules for `.project-accent-wash` and `.portfolio-cta-arrow` are wrapped in the repo's standard gate, with the `:focus-visible` variants left OUTSIDE the media query (keyboard users get the affordance on every device):

```css
/* target */
.group:focus-visible .project-accent-wash {
  opacity: 1;
}

.portfolio-cta-arrow {
  transition: transform 300ms var(--ease-out-quart);
}

.group:focus-visible .portfolio-cta-arrow {
  transform: translate(0.5rem, -50%);
}

@media (hover: hover) and (pointer: fine) {
  .group:hover .project-accent-wash {
    opacity: 1;
  }
  .group:hover .portfolio-cta-arrow {
    transform: translate(0.5rem, -50%);
  }
}
```

## Repo conventions to follow

- The gate media query is exactly `@media (hover: hover) and (pointer: fine)` — copy the form used at `src/index.css:258`.

## Steps

1. Add the `future` block to `tailwind.config.js` (top level of the exported object, e.g. right after `darkMode`).
2. In `src/index.css`, replace the current 641–653 rules with the Target CSS (split hover into the media query, keep focus-visible ungated).
3. Do NOT touch `.service-row:hover` rules — plan 010 rewrites those and adds its own gate.

## Boundaries

- Do NOT edit any TSX. The flag fixes all Tailwind hovers at the compiler level.
- Do NOT gate `:focus-visible` styles.
- Do NOT touch `src/components/ui/**` or `.service-row`.
- `AnimatedButton`'s JS `onMouseEnter` hover is a known, accepted gap (both labels are identical text; a stuck state is invisible) — leave it.

## Verification

- **Mechanical**: `npm run build` passes, then:
  ```bash
  grep -c '@media (hover:hover){' dist/assets/*.css
  ```
  must be ≥ 1 (Tailwind emits hover rules inside the gate; minified output may drop spaces). And confirm a spot-check class moved inside it:
  ```bash
  grep -o '@media (hover:hover){[^}]*group:hover [^}]*scale-x-100[^}]*}' dist/assets/*.css | head -1
  ```
  (any non-empty match passes; exact formatting varies).
- **Feel check**: in DevTools device emulation (touch, e.g. iPhone), tap a portfolio card: the image must NOT stay zoomed after the tap. Tab through portfolio cards with a keyboard on desktop: the accent wash and CTA arrow still respond to focus. With a mouse, all hover effects behave exactly as before.
- **Done when**: build grep passes and the three feel checks hold.
