# 006 — Reduced motion: kill movement, keep comprehension feedback

- **Status**: DONE (2026-07-22, verified)
- **Commit**: ebc0b94 (line numbers assume plan 007 has already run; re-locate by content, not line number)
- **Severity**: HIGH
- **Category**: Accessibility
- **Estimated scope**: 1 file (src/index.css), ~15 lines changed

## Problem

The global reduced-motion block nukes ALL transition feedback, not just movement. Current code (`src/index.css:671–730`, the `@media (prefers-reduced-motion: reduce)` block):

```css
/* src/index.css:676-683 — current */
*,
*::before,
*::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  scroll-behavior: auto !important;
  transition-duration: 0.01ms !important;
}
```

The correct rule is "fewer and gentler, NOT zero — keep transitions that aid comprehension, remove position changes." The blanket `transition-duration: 0.01ms !important` wrongly makes instant:

- Testimonials person-swap crossfades (`src/sections/Testimonials.tsx:85, 133, 151`) — an auto-advancing carousel that now hard-cuts between people with zero fade, a jarring content teleport.
- All hover/focus color feedback (nav links, buttons, star ratings, service icon borders).
- The route-entry fade the file itself tries to preserve — `src/index.css:708-712` sets `.page-enter { animation: pageEnter 200ms ... }` with a comment "keep the fade, drop the movement", but the wildcard's `animation-duration: 0.01ms !important` overrides the 200ms, so even that intended fade renders instantly. Self-defeating.

## Target

Replace the wildcard's transition kill with a property allow-list: transforms can never animate (movement dies), but opacity/visibility/color feedback transitions briefly and gently. Restore the `.page-enter` fade duration explicitly.

```css
/* target — replaces the current wildcard block */
*,
*::before,
*::after {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  scroll-behavior: auto !important;
  /* Movement dies (transform is not transitionable here); comprehension
     feedback — fades, color changes — survives, briefly and gently. */
  transition-property: opacity, visibility, color, background-color, border-color, box-shadow !important;
  transition-duration: 150ms !important;
  transition-timing-function: ease !important;
  transition-delay: 0ms !important;
}
```

And for the route fade (inside the same media block, where `.page-enter` is re-declared):

```css
/* target — .page-enter override inside the reduced-motion block */
.page-enter {
  animation-name: pageEnterFade;
  animation-duration: 200ms !important; /* outlives the wildcard kill */
}
```

Intended behavior notes (these are deliberate, not side effects):

- Because `transition-property` + `transition-duration` are forced on every element, ANY opacity/color change now fades over 150ms under reduced motion, even on elements that declared no transition. That is the "gentler" goal.
- Scroll-reveal sections never move under reduced motion regardless: the JS hooks (`src/hooks/useScrollAnimation.ts:12-14`, `useMotion.ts`) already short-circuit and render final state immediately. This change only affects state-driven UI (menu open/close, carousel swaps, hovers).
- The mobile menu overlay (`transition-[opacity,visibility]` in `src/components/Navigation.tsx:170`) keeps its fade because `opacity` and `visibility` are both in the allow-list; its links no longer slide (transform excluded) — they fade in place, and `transition-delay: 0ms` collapses the stagger. Correct.
- The hamburger bars snap between states instantly (their transition is `transform` + a color; the color part still fades 150ms). Correct — position change removed, feedback kept.

## Repo conventions to follow

- All reduced-motion handling lives in the single `@media (prefers-reduced-motion: reduce)` block near the end of `src/index.css` — edit in place, do not create a second media block.
- The targeted per-element overrides already in that block (`.marquee-track`, `.snaxx-letter`, `.snaxx-bitten`, `.snaxx-crumb`, `.scroll-cue`, `.credit-heart`, `.credit-coffee`, `.notfound-arrow` → `animation: none` / `transform: none`) are correct — keep them all unchanged.

## Steps

1. In `src/index.css`, inside `@media (prefers-reduced-motion: reduce)`, replace the four-line wildcard declaration block (`animation-duration / animation-iteration-count / scroll-behavior / transition-duration`) with the eight-line Target version above.
2. In the same media block, find the `.page-enter` override (currently re-declares the `pageEnter` animation shorthand then swaps `animation-name: pageEnterFade`). Replace its body with the two-line Target version (`animation-name` + `animation-duration: 200ms !important`), keeping the existing comment if present. The `@keyframes pageEnterFade` definition stays as is.
3. Leave every other rule in the media block untouched.

## Boundaries

- Do NOT touch anything outside the `@media (prefers-reduced-motion: reduce)` block.
- Do NOT edit any TSX or hook — the JS gating is already correct.
- Do NOT remove the targeted `animation: none` overrides.
- If the wildcard block does not match the quoted current code (drift), STOP and report.

## Verification

- **Mechanical**: `npm run build` and `npm run lint` pass.
- **Feel check** (DevTools → Rendering → Emulate `prefers-reduced-motion: reduce`):
  - Testimonials: click next — quote/author/image crossfade over ~150ms instead of hard-cutting. Nothing slides vertically.
  - Mobile menu: open it — backdrop and links fade in (no upward slide, no stagger); close fades too.
  - Hover a nav link or the Contact button — color feedback still eases; nothing moves.
  - Navigate to `/legal/arrows/privacy` (or any legal page) — the page fades in over ~200ms rather than popping.
  - Marquee is static; wordmark letters appear without dropping; no bobbing arrow.
  - Toggle the emulation off — full motion returns (durations back to authored values).
- **Done when**: all feel checks pass in both emulation states.
