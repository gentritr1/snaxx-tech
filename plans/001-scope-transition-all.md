# 001 — Scope every `transition-all` to the properties that actually animate

- **Status**: DONE
- **Commit**: d1037de
- **Severity**: MEDIUM
- **Category**: Performance
- **Estimated scope**: 8 files, ~25 class-string edits

## Problem

`transition-all` animates unintended properties off-GPU and invites accidental
layout animation. It appears on nearly every scroll-reveal element and several
hover effects. Examples (current code, verbatim):

```tsx
// src/sections/Hero.tsx:101 — reveal (animates opacity+transform only)
'hidden lg:block absolute left-8 lg:left-16 top-1/2 -translate-y-1/2 z-30 pointer-events-none transition-all duration-[1200ms] ease-out-quart',

// src/sections/Services.tsx:50 — hover (animates transform, opacity, filter)
className="h-full w-full object-cover transition-all duration-500 ease-out-quart md:scale-105 md:opacity-55 md:saturate-50 md:group-hover:scale-100 md:group-hover:opacity-100 md:group-hover:saturate-100"

// src/components/Navigation.tsx:98 — nav underline animates WIDTH (layout!)
"absolute -bottom-1 left-0 w-0 h-px transition-all duration-300 group-hover:w-full"
```

Affected lines (all `transition-all`): Hero.tsx:101,114,129 · Services.tsx:30,50,71,79 ·
Footer.tsx:41,65,81,95,126,162 · CTA.tsx:34,50,63,75 · Testimonials.tsx:47,60,73 (+any
further in that file) · Navigation.tsx:65,98,133,140,147,163,175,191 ·
Portfolio.tsx:122 (card className) and Portfolio.tsx:200 (CTA card) · Hero.tsx scroll-cue block (~151).

## Target

Replace each `transition-all` with a scoped Tailwind arbitrary property list
matching what actually changes. Duration/easing classes stay untouched.

- Reveal elements (opacity + translate): `transition-[opacity,transform]`
- Services hover image (scale + opacity + saturate): `transition-[opacity,transform,filter]`
- Navigation bar shell (Navigation.tsx:65 — background/color/shadow on scroll):
  `transition-[background-color,color,box-shadow]`
- Hamburger lines (133,140,147 — rotate/translate/opacity): `transition-[opacity,transform]`
- Mobile menu overlay (163 — opacity/visibility): `transition-[opacity,visibility]`
- Footer social circles (65 — colors): `transition-colors`
- Footer link arrow (95 — opacity+translate): `transition-[opacity,transform]`
- **Nav underline (98) — layout fix**: replace width animation with transform:
  ```tsx
  "absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100"
  ```

## Repo conventions to follow

- Easing tokens live in src/index.css:64-68 (`--ease-out-quart` etc.) exposed as
  Tailwind classes like `ease-out-quart` — keep using them.
- Exemplar already correct: src/index.css:204 (`transition: opacity .8s …, transform .8s …`).

## Steps

1. For each affected line above, swap the `transition-all` token for the scoped
   variant listed in Target. Nothing else in the class string changes.
2. Navigation.tsx:98: apply the underline rewrite exactly as shown.
3. Grep the repo to confirm zero remaining `transition-all` in src/ (excluding
   node_modules and ui/ primitives that aren't rendered).

## Boundaries

- Do NOT touch src/components/ui/* (unused shadcn primitives).
- Do NOT change durations, easings, markup, or add dependencies.
- Do NOT touch HeroScene/HeroCanvas (3D scene is separately tuned).
- If a line's animated properties differ from the mapping above, scope to what
  that element actually changes; if unclear, STOP and report.

## Verification

- **Mechanical**: `npm run build` passes; `npx eslint src` stays at 0 errors;
  `grep -rn "transition-all" src --include="*.tsx" | grep -v components/ui` returns nothing.
- **Feel check**: scroll the page — every section reveal still fades/rises
  identically. Hover a nav link — underline sweeps left→right (no layout shift
  of neighbors). Hover a services row on desktop — image still de-saturates in.
- **Done when**: grep is clean and reveals/hovers look unchanged at normal speed.
