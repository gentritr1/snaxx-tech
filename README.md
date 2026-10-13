# Snaxx Tech — cinematic 3D brand site

The studio website for Snaxx Tech, themed around snacking: one continuous,
scroll-directed 3D film (React Three Fiber + GSAP ScrollTrigger) in a bright
vanilla-cream studio, in which a chocolate bonbon (caramel centre, chocolate
shell, caramel drizzle) opens into the studio's software and a pantry of
games, plus light-weight legal and support pages for each app. Built with React 19, TypeScript, Tailwind
CSS and Vite.

## Experience

- **Awakening** on load: the caramel centre lights up and the camera reveals the confection.
- **Approach and reveal**: hundreds of instanced chocolate pieces peel off as the caramel drizzle unwinds, exposing the glass shell and caramel threads.
- **Fly-through**: the camera passes through the centre into a warm digital pantry.
- **Transformation**: the pieces re-form into a frame around holographic Offday interfaces.
- **Portal**: the pieces halo a glazed, sprinkled donut; the camera flies through its caramel iris into the games.
- **Games**: four exhibits on porcelain plates (a candy dart, a chocolate bar, a candy planet, biscuit tiles) with a tracking shot and synced cards.
- **Studio and contact**: a calm overview and the studio inbox.

The scene is decorative for assistive tech: every word lives in the DOM.
Reduced motion shows one still composition per chapter. If WebGL is
unavailable a poster background is used and the content is unaffected.

## Tech Stack

- **React 19** with TypeScript, **Vite 7**, **Tailwind CSS 3**
- **Three.js**, **React Three Fiber**, **Drei**, **@react-three/postprocessing**
- **GSAP ScrollTrigger** for the scroll-bound choreography
- **maath** for damped motion
- Self-hosted **Geist** and **Geist Mono**

No runtime requests leave the origin: environment lighting, textures and
geometry are procedural, which keeps the strict production CSP intact.

## Quick Start

```bash
npm install
npm run dev
```

## Structure

```
src/
  config.ts                 All copy and product data (the scene reads it too)
  pages/Home.tsx            Chapters + canvas + boot + choreography wiring
  chapters/                 DOM chapters (hero, story, software, portal, games, studio, contact)
  experience/
    Experience.tsx          Fixed canvas host, quality tiers, WebGL fallback
    scroll.ts               Scroll choreography timeline and the awakening
    sceneState.ts           Mutable scene state GSAP writes and R3F reads
    quality.ts              Tier detection and adaptive settings
    scene/                  CameraRig, Atmosphere, Core, Fragments, Particles,
                            SoftwareHolo, Portal, GamesWorld, Effects
    shaders/                Custom GLSL materials
    textures/ui.ts          Canvas-drawn holographic UI textures
  components/               Navigation, Footer, AnimatedButton, PageOverlay, LegalLayout
  pages/LegalPage.tsx       Privacy / terms / support documents
  legal/content.ts          Legal content per app
```

## Performance rules

The scene holds 60 fps at retina resolution (measured in headless Chrome on
an Apple M4 Pro, also under a 4x CPU slowdown). Keep it that way:

- **No transmission.** Any material with `transmission` (including drei's
  `MeshTransmissionMaterial`) makes three.js re-render the whole scene into an
  offscreen buffer every frame. The glass shell is a clear-coated translucent
  physical material instead.
- **A fixed set of lights.** three.js bakes the light count into every lit
  shader, so showing or hiding a light mid-scroll recompiles every material and
  stalls the page. The scene always has the same five lights; one accent light
  roams between the software, portal and game moments.
- **No `backdrop-filter` over the canvas.** The canvas repaints every frame, so
  the browser would re-blur that region every frame. Panels use a mostly opaque
  cream fill instead.
- **Budget triangles.** Instanced shell pieces use a one-segment rounded box
  and a standard (not clear-coated) material; pixel ratio is capped at 1.5.
- **No allocations in `useFrame`.** Reuse vectors, quaternions and eulers.
- **Keep three.js out of the entry bundle.** The home page's DOM code imports
  `sceneState` eagerly, so it must not import `three` (cam and target are plain
  `{x, y, z}` records), and `vite.config.ts` must not use `manualChunks` for the
  3D libraries. The legal and 404 routes then load no 3D code at all; the whole
  3D stack is the lazy `Experience` chunk. Check with
  `grep modulepreload dist/index.html` after a build: it should list nothing.

See `DESIGN.md` for the brand system ("The Confectionery Engine") and
`docs/superpowers/specs/` for the design spec.

## Offday PTO app

The standalone Next.js PTO product lives in [`apps/offday`](apps/offday/README.md).
It includes company workspaces, employee invitations and sign-in, profiles,
manager approvals, PTO balances, and a team calendar.

```sh
cd apps/offday
npm ci
npm run dev
```

Offday keeps its own package manifest, lockfile, tests, and build. The root
commands and Vercel configuration continue to serve the existing Vite site.
The root ESLint configuration excludes Offday because its React Refresh rules
are specific to Vite; run Offday's typecheck and tests from its directory.

Deploy Offday separately on a Node.js server with persistent SQLite storage.
Do not use the root Vercel SPA rewrites for this app or deploy its database
on an ephemeral serverless filesystem. See its README for deployment details
and the remaining work before a commercial launch.
