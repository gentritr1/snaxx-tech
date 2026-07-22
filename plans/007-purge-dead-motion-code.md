# 007 — Purge dead motion code & resolve the wordmark CSS conflict

- **Status**: DONE (2026-07-22, verified)
- **Commit**: ebc0b94
- **Severity**: MEDIUM (one behavioral fix + large risk-free cleanup)
- **Category**: Cohesion & tokens / Performance
- **Estimated scope**: 3 files (src/index.css heavily, src/sections/Hero.tsx one line, tailwind.config.js, delete src/hooks/useMouseParallax.ts)

## Problem

Three generations of hero/wordmark implementations left ~150 lines of dead motion CSS, one live conflict, and one regression:

**A. Live conflict — duplicate `.snaxx-letter` blocks.** `src/index.css` defines `.snaxx-letter` twice. Block 1 (lines 242–248, the current sprite wordmark) declares `transition: transform 200ms var(--ease-out-quart)`. Block 2 (lines 556–574, leftover from the old text wordmark) re-declares it:

```css
/* src/index.css:557-574 — current, leftover */
.snaxx-letter {
  display: inline-block;
  transform: translateY(0);
  opacity: 1;
  transition: transform 0.3s var(--ease-out-quart);
}
.snaxx-loaded .snaxx-letter { transform: translateY(0) rotate(0deg); opacity: 1; }
@media (hover: hover) and (pointer: fine) {
  .snaxx-loaded .snaxx-letter:hover {
    transform: translateY(-7px) rotate(-2deg);
    transition: transform 0.3s var(--ease-out-quart) 0s;
  }
}
```

`snaxx-loaded` is applied nowhere in the app (grep of all TSX + index.html: zero hits), so the `.snaxx-loaded` rules are dead — but the bare `.snaxx-letter` re-declaration is NOT dead: it wins the cascade and overrides the intended 200ms hover transition to 300ms.

**B. Regression — hero scroll cue.** The previously-approved design is `.scroll-cue` (`src/index.css:577-585`): a 3-iteration bob that then rests, with a reduced-motion override at line 701. The current hero instead uses Tailwind's infinite `animate-bounce`:

```tsx
{/* src/sections/Hero.tsx:244 — current */}
<ArrowDown className="w-3.5 h-3.5 text-white/45 animate-bounce" />
```

Infinite looping decoration on an always-visible element, and the tuned CSS sits dead.

**C. Dead code** (verified: zero references in any TSX or index.html):

- `src/index.css:183-205` — `.animate-fade-in`, `.animate-slide-up`, `.animate-scale-in`, `.anim-hidden`, `.anim-visible`
- `src/index.css:208-226` — `@keyframes fadeIn`, `@keyframes slideUp` (only consumed by the dead utilities above)
- `src/index.css:312-319` — `@keyframes scaleIn`
- `src/index.css:321-331` — `@keyframes heroContainerScale` (animates `width`/`height` — forbidden layout animation; doubly delete)
- `src/index.css:333-350` — `@keyframes textSlideOut`, `textSlideIn`
- `src/index.css:352-369` — `@keyframes slideActive`, `slideInactive`
- `src/index.css:371-394` — `@keyframes menuLineFirst`, `menuLineThird` (hamburger uses Tailwind transitions instead)
- `src/index.css:396-400` — `.parallax-element`
- `src/index.css:481-545` — the entire old "lens hero": `.hero-backdrop`, `.hero-color-wash`, `.hero-lens`, `.hero-lens-image`, `.hero-lens-label`, `.hero-crosshair`, `.hero-crosshair-x`, `.hero-crosshair-y`, `.hero-mobile-focus` (CSS vars `--lens-*` are set by nothing)
- In the reduced-motion block: `.snaxx-loaded .snaxx-letter:hover` (694-696) and `.hero-lens { display: none; }` (698-700)
- In `@media (max-width: 768px)` (757-772): the `.hero-lens` and `.hero-mobile-focus` rules only — KEEP the `.text-h1/.type-h2/.text-h3` typography rules in that block
- `src/index.css:787-793` — the entire `@media (max-width: 639px)` block (`.hero-launch-chip`, `.hero-release-chip`, `.hero-explore-link` are referenced nowhere)
- `src/hooks/useMouseParallax.ts` — whole file unused (both exports imported by nothing)
- `tailwind.config.js` keyframes/animation entries with zero users: `fade-in`, `fade-up`, `slide-up`, `scale-in`, `hero-reveal`, `text-slide-out`, `text-slide-in`, `slide-in-right`, `spin-slow`. KEEP `accordion-down`, `accordion-up`, `caret-blink` (used by shadcn components in `src/components/ui/`).

**D. Stray `will-change`.** `.credit-heart` (line 599) and `.credit-coffee` (line 605) run 2 iterations then sit static forever, but `will-change: transform` pins them on compositor layers permanently. Same for `.scroll-cue` (line 579) after its 3 bobs.

## Target

- Exactly one `.snaxx-letter` block (the sprite one, 242–248) — hover transition back to its intended 200ms by deletion of the override.
- Hero scroll cue uses `scroll-cue` instead of `animate-bounce`; bobs 3 times, rests, and is properly silenced by its existing reduced-motion override.
- All code listed in C deleted; `will-change` lines in D removed (`animation` declarations stay).

## Repo conventions to follow

- `src/index.css` is organized by feature with comment headers — delete whole commented sections cleanly, don't leave orphaned comments.
- The hero arrow keeps its size/color classes: `className="w-3.5 h-3.5 text-white/45 scroll-cue"`.

## Steps

1. `src/index.css`: delete block 2 of `.snaxx-letter` and both `.snaxx-loaded` rules (556–574), plus the `.snaxx-loaded .snaxx-letter:hover` override inside the reduced-motion block (694-696). Keep the "Hero wordmark — per-letter rise-in + hover lift" comment out too (it describes the deleted block).
2. `src/index.css`: delete every item in Problem C above. For the 768px media query, remove only the `.hero-lens` / `.hero-mobile-focus` rules; typography rules stay.
3. `src/index.css`: remove the three `will-change` declarations from `.credit-heart`, `.credit-coffee`, `.scroll-cue` (keep everything else in those rules).
4. `src/sections/Hero.tsx:244`: change `animate-bounce` → `scroll-cue`.
5. Delete `src/hooks/useMouseParallax.ts`.
6. `tailwind.config.js`: remove the nine dead keyframes + animation entries listed in C (both the `keyframes` and matching `animation` keys). Leave `accordion-*` and `caret-blink`.

## Boundaries

- Do NOT touch `HeroScene.tsx` / `HeroCanvas.tsx` (separately tuned 3D playground).
- Do NOT touch `src/components/ui/**`.
- Do NOT delete `.marquee*`, `.pressable`, `.skip-link`, `.page-enter`/`pageEnter`/`pageEnterFade`, `.project-accent-wash`, `.portfolio-cta-arrow`, `.service-row`, `.service-icon`, `.notfound-arrow`, `.credit-heart/.credit-coffee` (rules stay; only their `will-change` lines go).
- Before deleting anything, re-grep it yourself across `src/**` and `index.html`; if ANY item in C has a reference, leave that item and report it.
- If a listed line range doesn't match the described content (drift), re-locate by selector name; if still absent, skip and report.

## Verification

- **Mechanical**: `npm run build` && `npm run lint` pass. `npx tsc -b` clean (catches the deleted-hook import if anything silently imported it). Then confirm no references linger:
  ```bash
  grep -rn 'snaxx-loaded\|hero-lens\|parallax-element\|useMouseParallax\|animate-bounce' src/ index.html
  ```
  must print nothing.
- **Feel check**: reload the home page. The scroll cue arrow bobs exactly 3 times (~5.4s) then rests. Hover a wordmark letter — it lifts with a quick 200ms response (previously 300ms; should feel snappier). Click the wordmark — chomp + crumbs still fire. Footer heart/coffee still pulse twice when scrolled into view.
- **Done when**: build green, grep empty, and the three feel checks pass.
