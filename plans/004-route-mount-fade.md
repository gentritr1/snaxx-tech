# 004 — Soft entrance for lazy routes (legal pages & 404)

- **Status**: DONE
- **Commit**: d1037de
- **Severity**: LOW
- **Category**: Missed opportunities
- **Estimated scope**: 3 files (index.css, LegalPage.tsx, NotFound.tsx)

## Problem

Route changes teleport. `src/App.tsx` lazy-loads LegalPage and NotFound with
`<Suspense fallback={null}>`, and `ScrollToTop` jumps to (0,0) — the new page
pops in with zero transition. A Play-Store visitor tapping a privacy link gets
the most abrupt moment on an otherwise carefully-moving site.

## Target

A one-shot mount animation on the page root of both lazy pages:

```css
/* src/index.css — near the other keyframes (~line 180) */
@keyframes pageEnter {
  from { opacity: 0; transform: translateY(6px); }
  to   { opacity: 1; transform: translateY(0); }
}
.page-enter {
  animation: pageEnter 240ms var(--ease-out-quart) both;
}
```

Reduced-motion variant — inside the existing
`@media (prefers-reduced-motion: reduce)` block (src/index.css ~456+):

```css
.page-enter {
  animation: pageEnter 200ms var(--ease-out-quart) both;
  /* keep the fade, drop the movement */
  animation-name: pageEnterFade;
}
@keyframes pageEnterFade {
  from { opacity: 0; }
  to   { opacity: 1; }
}
```

## Repo conventions to follow

- Keyframes live in src/index.css alongside `fadeIn`/`slideUp` (~line 180);
  exemplar: `.animate-fade-in` at src/index.css:184.
- Both lazy pages have a single root wrapper div — add the class there.

## Steps

1. Add the keyframes + classes to src/index.css exactly as in Target.
2. Add `page-enter` to the root wrapper div of src/pages/LegalPage.tsx.
3. Add `page-enter` to the root wrapper div of src/pages/NotFound.tsx.

## Boundaries

- Do NOT animate Home (`/`) — the hero has its own load choreography.
- Do NOT add route-EXIT animations or a router transition library.
- Do NOT touch ScrollToTop.

## Verification

- **Mechanical**: `npm run build` passes; `npx eslint src` 0 errors.
- **Feel check**: from Home, click a Privacy chip — the legal page fades and
  rises in over ~240ms instead of popping. Visit a junk URL — the 404 does the
  same. Toggle prefers-reduced-motion (DevTools → Rendering) — the page still
  fades but no longer moves.
- **Done when**: both lazy routes enter softly, Home is unaffected, and the
  animation plays exactly once per mount.
