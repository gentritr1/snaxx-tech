# 005 — Restore the intended durations for `duration-350/400/800`

- **Status**: DONE (2026-07-22, verified)
- **Commit**: ebc0b94
- **Severity**: HIGH
- **Category**: Easing & duration
- **Estimated scope**: 1 file (tailwind.config.js), ~5 lines

## Problem

Tailwind v3.4's default `transitionDuration` scale only contains `75/100/150/200/300/500/700/1000`. This repo's `tailwind.config.js` extends `transitionTimingFunction` but NOT `transitionDuration`. So the classes `duration-350`, `duration-400`, and `duration-800` used across the codebase generate **no CSS at all**, and the elements fall back to the 150ms default baked into Tailwind's `transition-*` utilities.

Verified against the built stylesheet (`dist/assets/index-B7hpto9j.css`): `.duration-700` and `.duration-500` exist; `.duration-800`, `.duration-400`, `.duration-350` do not, and every `transition-property:…` utility carries `transition-duration:.15s`.

Result: these all run at 150ms instead of their declared intent —

- `src/sections/CTA.tsx:34, 50, 63, 75` — section reveals intended 800ms
- `src/sections/Footer.tsx:41, 81, 126, 162` — section reveals intended 800ms
- `src/sections/Testimonials.tsx:47, 60, 73` — section reveals intended 800ms
- `src/sections/About.tsx:58` — section reveal intended 800ms
- `src/components/Navigation.tsx:182, 198` — mobile-menu link/CTA stagger intended 400ms
- `src/components/AnimatedButton.tsx:48, 56` — button label roll-up intended 350ms (its sibling arrow icon at line 66 uses a valid `duration-300`, so the label and icon are currently mistimed relative to each other)

Example of the pattern (current, `src/sections/CTA.tsx:34`):

```tsx
'flex flex-wrap ... transition-[opacity,transform] duration-800 ease-out-quart',
```

## Target

The three missing durations exist as real utilities, so every listed call site renders at its declared duration. No TSX changes — fix the config, not 14 call sites.

```js
// tailwind.config.js — inside theme.extend, alongside transitionTimingFunction
transitionDuration: {
  '350': '350ms',
  '400': '400ms',
  '800': '800ms',
},
```

## Repo conventions to follow

- Custom motion values already live in `theme.extend` of `tailwind.config.js` — see `transitionTimingFunction` at lines 150–156 (`'out-quart': 'cubic-bezier(0.165, 0.840, 0.440, 1)'` etc.). Add `transitionDuration` as a sibling key in the same `extend` object.

## Steps

1. In `tailwind.config.js`, inside `theme.extend` (after the `transitionTimingFunction` block, before the closing brace of `extend`), add the `transitionDuration` object shown in Target.
2. Nothing else. Do not edit any `.tsx` file.

## Boundaries

- Do NOT change any `duration-*` class in TSX (the 700/800 split across sections is a separate cohesion question, out of scope here).
- Do NOT touch `src/components/ui/**` (shadcn boilerplate).
- Do NOT add new dependencies.
- If `theme.extend.transitionDuration` already exists when you open the file, STOP and report.

## Verification

- **Mechanical**: `npm run build` succeeds. Then:
  ```bash
  grep -o '\.duration-800{transition-duration:[^}]*}' dist/assets/*.css
  grep -o '\.duration-400{transition-duration:[^}]*}' dist/assets/*.css
  grep -o '\.duration-350{transition-duration:[^}]*}' dist/assets/*.css
  ```
  Each must print exactly one rule (`.8s`/`400ms`/`350ms` — Tailwind may minify to `.8s`, `.4s`, `.35s`; any equivalent value passes). `npm run lint` stays clean.
- **Feel check**: run the dev server, scroll to the CTA and Footer sections — reveals should now be noticeably slower/softer (800ms glide instead of a 150ms pop) and match the pacing of the Services/Portfolio sections' 700ms reveals. Open the mobile menu (narrow viewport): links should ease up over 400ms with the stagger clearly readable, not snap. Hover the nav "Contact" button: label roll-up (350ms) and arrow slide should feel like one gesture.
- **Done when**: all three grep checks pass and the build is green.
