# 003 — Snappier nav hovers and mobile-menu choreography

- **Status**: DONE
- **Commit**: d1037de
- **Severity**: MEDIUM
- **Category**: Easing & duration / Cohesion
- **Estimated scope**: 1 file (src/components/Navigation.tsx), ~7 value edits

## Problem

Hover states are tens-of-times-a-day interactions; 500ms color fades read as lag.
The mobile menu's 100ms-per-item stagger plus a 400ms CTA delay means the last
element lands ~900ms after tap — long for a 4-item menu.

Current code (verbatim):

```tsx
// src/components/Navigation.tsx:75 — logo
"text-2xl font-semibold tracking-tight transition-colors duration-500",
// :92 — nav links
"text-base transition-colors duration-500 relative group",
// :133,140,147 — hamburger lines
'h-0.5 w-7 transition-all duration-500 ease-out-quad origin-center',
// :175 + :180 — menu items
'text-3xl font-semibold text-exvia-black transition-all duration-500 ease-out-quart',
style={{ transitionDelay: isMenuOpen ? `${index * 100}ms` : '0ms' }}
// :191 + :194 — menu CTA
'mt-4 transition-all duration-500 ease-out-quart',
style={{ transitionDelay: isMenuOpen ? '400ms' : '0ms' }}
```

## Target

- Logo + nav-link color transitions: `duration-500` → `duration-200`.
  (The bar shell at :65 keeps its 500ms scroll-state transition — that is a
  scroll state change, not a hover.)
- Hamburger lines (:133,140,147): `duration-500`/`duration-300` → `duration-300`
  on all three, property scoped per plan 001 (`transition-[opacity,transform]`).
- Menu items (:175): `duration-500` → `duration-400`; stagger (:180)
  `index * 100` → `index * 60`.
- Menu CTA (:191,194): `duration-500` → `duration-400`; delay `'400ms'` → `'240ms'`.

## Repo conventions to follow

- Tailwind duration utilities already used everywhere; easing tokens
  `ease-out-quad` / `ease-out-quart` stay exactly as they are.

## Steps

1. Apply the six value swaps listed in Target to src/components/Navigation.tsx.
2. If plan 001 has not run yet, leave `transition-all` tokens as found (only
   change durations/delays) — the two plans are independent.

## Boundaries

- Do NOT change the underline hover (handled in plan 001).
- Do NOT alter menu markup, open/close logic, or the bar's scrolled styling.

## Verification

- **Mechanical**: `npm run build` passes; `npx eslint src` 0 errors.
- **Feel check**: hover nav links rapidly — color keeps up with the cursor.
  Open the mobile menu (≤1024px viewport): items cascade quickly (last item
  lands ≈ 420ms) and the close animation never lags the tap.
- **Done when**: no hover transition in Navigation.tsx exceeds 300ms, and the
  mobile menu's final element delay is ≤ 240ms.
