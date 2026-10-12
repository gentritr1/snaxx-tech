# Snaxx Tech — cinematic 3D brand site

The studio website for Snaxx Tech: one continuous, scroll-directed 3D film
(React Three Fiber + GSAP ScrollTrigger) with the studio's software and
games emerging from the scene, plus light-weight legal and support pages
for each app. Built with React 19, TypeScript, Tailwind CSS and Vite.

## Experience

- **Awakening** on load: the mechanical core powers up and the camera reveals it.
- **Approach and reveal**: hundreds of instanced shell plates peel off and expose the rings, glass heart and energy filaments.
- **Fly-through**: the camera passes through the heart into a digital world.
- **Transformation**: the plates re-form into a frame around holographic Offday interfaces.
- **Portal**: the plates become a ring; the camera flies through into the games world.
- **Games**: four exhibits (Arrows, Block Destroy, Geo Guesser World 3D!, FJALË) with a tracking shot and synced cards.
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

See `DESIGN.md` for the brand system ("Precision Engine") and
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
