# 002 — Press feedback on every pressable control

- **Status**: DONE
- **Commit**: d1037de
- **Severity**: MEDIUM
- **Category**: Physicality & origin
- **Estimated scope**: 1 CSS class + ~9 class-string edits across 6 files

## Problem

No button on the site has `:active` press feedback — presses feel inert, which
undercuts the toy-like personality the 3D hero establishes (its box squashes on
click; the DOM buttons don't). Pressables affected:

- src/components/Navigation.tsx — "Get in Touch" button (desktop + mobile menu)
- src/sections/CTA.tsx — "Email Us" button
- src/components/LegalLayout.tsx:82,92 — legal cross-link buttons
- src/pages/LegalPage.tsx:61 — "Back to home" button; :103 sidebar app links
- src/pages/NotFound.tsx:37 — "Back to Snaxx Tech" button
- src/sections/Portfolio.tsx:101,110 — Privacy/Terms chips

## Target

A shared utility in src/index.css (place near `.scroll-cue`, ~line 390):

```css
/* Press feedback — subtle toy-like squash on pressables */
.pressable {
  transition: transform 160ms var(--ease-out-quart);
}
.pressable:active {
  transform: scale(0.97);
}
```

Add `pressable` to the className of each control listed above.

## Repo conventions to follow

- Utility classes live at the bottom half of src/index.css (exemplar: `.scroll-cue`,
  src/index.css:390-398) and use the existing easing tokens (src/index.css:64-68).
- Reduced-motion overrides live in the `@media (prefers-reduced-motion: reduce)`
  block near src/index.css:456+ — scale feedback may stay (it is feedback, not
  decoration); do NOT add it to the kill list.

## Steps

1. Add the `.pressable` CSS exactly as in Target to src/index.css.
2. Append `pressable` to the class strings of the nine controls listed in Problem.
3. Magnetic buttons (Navigation "Get in Touch", CTA "Email Us"): the magnetic
   hook writes `transform` on a WRAPPER element each frame. Put `pressable` on the
   inner `<button>`/`<a>`, never on the magnetic wrapper, so the transforms compose
   instead of fighting.

## Boundaries

- Do NOT add feedback to plain text links (footer columns, TOC links) — color
  transition is enough there.
- Do NOT touch the 3D scene (its squash already exists).
- Do NOT change any existing hover/focus classes.

## Verification

- **Mechanical**: `npm run build` passes; `npx eslint src` 0 errors.
- **Feel check**: click-and-hold "Get in Touch" — it compresses slightly and
  springs back on release; while magnetically attracted, pressing still squashes
  (transforms compose). Repeat on a legal chip and the 404 button.
- **Done when**: every listed control visibly responds to :active, and releasing
  mid-hover never snaps or jumps.
