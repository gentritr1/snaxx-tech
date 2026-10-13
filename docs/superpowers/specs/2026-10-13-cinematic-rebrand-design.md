# Snaxx Tech — Cinematic 3D Rebrand: Design Spec

Date: 2026-10-13 · Branch: `feat/cinematic-3d-experience` · Status: approved by brief (autonomous build)

## 1. Intent (what the brief asked for)

Rebrand Snaxx Tech from the hand-drawn "Almanac" storybook site into a
cinematic, immersive, real-time 3D web experience. The 3D is the defining
feature: navigation, storytelling and brand identity run through it. The
reference register is Awwwards SOTD / AAA game presentation / Apple reveal /
architectural visualisation / luxury technology brand.

Success: a visitor's first impression is spectacular; scrolling feels like one
continuously directed film; products (software + games) emerge from the 3D
world; the site stays elegant, readable, navigable, responsive and accessible.

### What the user said vs. what I assumed

Said: everything in sections 1–8 of the brief; new branch from main; whole
rebrand, not just the home page; hand over to Opus 5.5 when this model is done.

Assumed (my calls, since the user is away):

- "SaaS products" = **Offday** (the PTO app in `apps/offday`) plus the studio's
  "useful little things" lab. Games = Arrows, Block Destroy, Geo Guesser World
  3D!, FJALË.
- Legal pages (privacy/terms/support) are rebranded to the new identity but stay
  calm, long-form readable documents with no 3D (they are reached from Play
  Console links and must load light and fast).
- The old Almanac illustration/video assets are retired from the home page.
  Product promo art is kept as texture material inside the 3D showcase.
- No new third-party network calls at runtime (the Vercel CSP is strict:
  `connect-src 'self'`, `worker-src 'self'`, `script-src 'self'`). Everything
  is procedural or self-hosted: no HDRI downloads, no DRACO workers, no CDN
  fonts.

## 2. Brand identity: "The Confectionery Engine"

Update (same day): the user asked for the whole site to be themed around
snacks and snacking. North star: *a luxury chocolatier's machine*. The
studio makes snacks for your screen; the craft is industrial-grade. Luxury
comes from restraint: warm cocoa darks, real gloss (chocolate, caramel,
glaze, porcelain), one accent light per scene, generous whitespace, exact
type. In 3D everything is edible or serves food: the core is a caramel
centre in a glass shell wrapped in tempered-chocolate pieces and caramel
drizzle ribbons (the earlier porcelain rings read as a solar system and were
replaced); fragments are sprinkles; particles are sugar dust; the portal is a
glazed donut; the game exhibits sit on porcelain plates (a candy dart, a
chocolate bar, a candy planet, biscuit letter tiles).

### Palette

| Token | Hex | Role |
| --- | --- | --- |
| `void` | `#0A0705` | Page and scene background (dark cocoa) |
| `graphite` | `#15100B` | Raised dark surfaces |
| `steel` | `#241B13` | Borders on dark, panel fills |
| `mist` | `#B3A48F` | Secondary text on dark |
| `silver` | `#F1E7D8` | Primary text on dark (cream) |
| `white` | `#FFFFFF` | Display headlines |
| `ember` | `#F2B35B` | Brand accent (energy core, highlights, focus on dark). Derived from the wordmark's bitten-cookie gold. |
| `arrows-blue` | `#2F8CFF` | Arrows product signal |
| `block-orange` | `#FF7A29` | Block Destroy product signal |
| `fjale-gold` | `#D08700` | FJALË product signal |
| `geo-teal` | `#14B8A6` | Geo Guesser product signal |
| `offday-mint` | `#58D6A6` | Offday product signal |
| `paper` | `#FAF4EA` | Cream reading surface (legal documents) |
| `ink` | `#1A110A` | Text on light |

Rules: The Product Signal Rule survives (accent belongs to its product). Ember
is the only studio-level accent and is used sparingly: the core's energy,
the active nav link, focus rings on dark, one highlight per section.

### Typography

- Display and body: **Geist** (self-hosted 400/500). Display at 500 with
  `-0.04em` tracking and 0.92 line-height; sizes fluid, up to 7rem.
- Labels: **Geist Mono** 500, 0.6875–0.75rem, `0.14em` tracking, uppercase.
- Cormorant Garamond is retired.

### Surfaces, depth and motion

- Flat-at-rest remains. Depth comes from the 3D scene, lighting, and 1px
  `steel` borders; glass panels use `backdrop-blur` with 8–12% white fill.
- Corner radius 12px for panels, 8px for buttons, pills for chips.
- Easing: `--ease-out-quart` for UI, `power2.inOut` for camera moves.
- Reduced motion: the scene renders one still composition per chapter, the
  camera does not fly, DOM reveals become fades.

## 3. Experience architecture

One fixed, full-viewport `<Canvas>` lives behind the scrolling DOM. The DOM
is a sequence of chapter sections (each 100–200vh) whose copy fades in and
out with GSAP ScrollTrigger. A master GSAP timeline, scrubbed by one
ScrollTrigger spanning the whole page, tweens a plain mutable **scene state**
object (camera position/target, disassembly amount, portal openness, world
blend, per-product focus). R3F `useFrame` reads that object each frame and
damps toward it (maath). Pointer position adds a spring-damped parallax
offset on top of the camera rig.

```
Home.tsx
├─ <Experience/>          fixed canvas, lazy-loaded, Suspense + WebGL fallback
│   ├─ CameraRig          reads sceneState, pointer parallax, damping
│   ├─ Atmosphere         fog, Environment (Lightformers), key/rim lights, grid floor shader
│   ├─ Core               rings, instanced plates, glass heart, energy filaments, fragments
│   ├─ Particles          GPU points, vertex-shader motion, trail drift
│   ├─ SoftwareHolo       holographic dashboard panels (canvas-drawn textures) + frame plates
│   ├─ Portal             ring + swirl shader, opens on scroll
│   └─ GamesWorld         Arrows plane + trail, Block Destroy grid, Geo globe, FJALË tiles
│   └─ Effects            Bloom (selective via emissive), Vignette, DoF (desktop only)
├─ <Navigation/>          dark glass bar, chapter-aware active link
├─ chapters (DOM copy)    Hero · Awakening · Inside · Software · Portal · Games · Studio · Contact
└─ <Footer/>
```

### Scroll choreography (progress 0→1 across the page)

| Range | Chapter | Camera | Scene |
| --- | --- | --- | --- |
| load | Awakening (WOW 1) | slow dolly back from inside the shell | lights power on, rings spin up, plates settle |
| 0.00–0.14 | Hero | hold, pointer parallax | core idle: rings precess, heart pulses |
| 0.14–0.30 | Approach + reveal | dolly in, slight orbit | outer plates peel off and orbit; inner structure exposed |
| 0.30–0.40 | Fly-through | camera passes through the heart | fog darkens, filaments bright, grid floor fades in |
| 0.40–0.60 | Transformation (WOW 2) → Software | pull back to a frontal composition | plates re-form into a frame around holographic dashboard panels (Offday) |
| 0.60–0.70 | Portal (WOW 3) | fly into the ring | plates converge into a portal ring; swirl shader opens; world blends |
| 0.70–0.90 | Games | lateral tracking shot | four game exhibits; each gets focus as its DOM card is centred |
| 0.90–1.00 | Studio + Contact | slow rise, look back | core silhouette distant; particles calm |

### Interaction

- Pointer → camera parallax (spring, ±0.35 units) and light intensity shift.
- Hover on game exhibits/holo panels: raycast, emissive and scale respond; the
  DOM card gets the same highlight (synced through sceneState.hover).
- Click on an exhibit scrolls to its DOM card (keyboard users already have the
  DOM links; canvas is `aria-hidden`).

### Quality tiers

`detectTier()` → `high` (desktop, dpr≤2, DoF on, 900 plates, 6k particles),
`medium` (dpr 1.5, no DoF, 600 plates, 3k particles), `low` (mobile/coarse
pointer or low device memory: dpr 1, bloom only, 320 plates, 1.5k
particles, transmission material swapped for physical glass). drei
`PerformanceMonitor` steps dpr down on sustained low fps. WebGL unavailable →
a still poster + the full DOM content.

## 4. Pages

- **Home**: the experience above.
- **Legal (privacy/terms/support)**: rebranded document layout on `paper`
  with a `void` header bar, mono chips, Geist type; no 3D.
- **404**: dark, one line of ember, link home.
- **Navigation**: fixed glass bar on `void`; wordmark letter + "Snaxx Tech";
  links Software · Games · Studio · Contact; mobile full-screen menu.
- **Footer**: dark, three columns, legal links preserved exactly (Play Console
  depends on these URLs).

## 5. Error handling and accessibility

- Canvas creation failure or context loss → poster fallback (no blank page).
- All copy, links and product data live in the DOM; the canvas is decorative.
- Focus-visible rings in ember on dark, blue on light. 44px targets. Skip link.
- `prefers-reduced-motion` honoured for scene and DOM.

## 6. Testing

- `npm run build` (tsc + vite) must pass; `npm run lint` clean.
- Browser verification at desktop and mobile widths: console clean, scroll
  through every chapter, screenshots of the three WOW moments, legal route
  renders without the 3D bundle.
