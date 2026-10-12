---
name: Snaxx Tech
description: A cinematic, real-time 3D brand experience for an independent studio that makes bite-sized software and games.
colors:
  void: "#0A0705"
  graphite: "#15100B"
  steel: "#241B13"
  steel-light: "#362A1F"
  mist: "#B3A48F"
  silver: "#F1E7D8"
  white: "#FFFFFF"
  ember: "#F2B35B"
  ember-soft: "#F7CF8F"
  caramel: "#C9842B"
  cocoa: "#3D2416"
  cream: "#F6ECDC"
  paper: "#FAF4EA"
  paper-deep: "#EFE5D5"
  ink: "#1A110A"
  ink-soft: "#5B4A3A"
  arrows-blue: "#2F8CFF"
  block-destroy-orange: "#FF7A29"
  fjale-gold: "#D08700"
  geo-teal: "#14B8A6"
  offday-mint: "#58D6A6"
typography:
  display:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "clamp(2.75rem, 7.2vw, 7rem)"
    fontWeight: 500
    lineHeight: 0.94
    letterSpacing: "-0.045em"
  headline:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "clamp(2rem, 4.4vw, 4.25rem)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "-0.04em"
  title:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "clamp(1.5rem, 2.4vw, 2.25rem)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "GeistMono, Courier New, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.16em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "12px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  chapter: "100svh"
components:
  button-primary:
    backgroundColor: "{colors.silver}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.silver}"
    border: "1px solid rgb(255 255 255 / 0.25)"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  glass-panel:
    backgroundColor: "rgb(255 255 255 / 0.05)"
    border: "1px solid rgb(255 255 255 / 0.08)"
    backdropFilter: "blur(14px) saturate(1.2)"
    rounded: "{rounded.xl}"
  chip-product:
    backgroundColor: "transparent"
    textColor: "{colors.mist}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
---

# Design System: Snaxx Tech

## Overview

**Creative North Star: "The Confectionery Engine"**

Snaxx Tech makes snacks for your screen, and the brand treats snacking the
way a luxury chocolatier treats a bonbon. The website is one continuous,
real-time 3D film: a levitating confection awakens (a molten caramel centre
inside a glass shell, wrapped in tempered-chocolate pieces and porcelain
rings), cracks open to reveal its centre, re-forms into a frame around the
studio's software, becomes a glazed donut portal, and gives way to a pantry
of game exhibits served on porcelain plates. Every chapter is a cinematic
scene; every transition is part of the same directed sequence.

The register is luxury technology applied to food: Apple reveal, AAA
presentation, a premium chocolate commercial. Luxury comes from restraint.
Warm cocoa darks, real gloss (chocolate, glaze, caramel, porcelain), one
accent light per scene, generous space and exact type. Playfulness lives in
the snacks themselves (sprinkles, a chocolate bar that caramelises row by
row, a candy planet, biscuit letter tiles) and in the copy's appetite, never
in decoration.

**Key characteristics**

- A single fixed WebGL stage behind the page; the DOM carries every word.
- Scroll is the camera: chapters are tall sections with sticky stages, and
  the scene state is scrubbed by one scroll-bound timeline.
- Three signature moments: the Awakening (load), the Transformation
  (chocolate pieces reorganise into a frame around holographic interfaces)
  and Enter the Pantry (flight through a glazed donut into the games).
- Product accents are flavours and stay attached to their products; ember,
  the caramel, is the studio's only accent and is used sparingly.
- Reduced motion is a first-class path: one still composition per chapter.

## Colors

The palette is edible and near-monochrome: cocoa-dark surfaces (void,
graphite, steel), cream and warm-grey text (silver, mist), with ember, the
caramel of the wordmark's bitten cookie, as the energy of the centre. The
legal documents flip to a cream reading surface (paper and ink).

### Primary

- **Void:** Page and scene background; the stage everything else sits on.
- **Silver:** Primary text on dark and the primary button fill.

### Secondary

- **Ember (caramel):** The centre's energy, active navigation, focus rings
  on dark, one highlight per section. Never a background fill for text.
- **Mist:** Secondary text, labels, metadata.

### Product signals

- **Arrows Blue**, **Block Destroy Orange**, **FJALË Gold**, **Geo Teal**,
  **Offday Mint**: the flavours. Each identifies its product, in the DOM
  card ring and dot, in the 3D exhibit light, and among the sprinkles.

### Neutral

- **Graphite / Steel:** Raised cocoa surfaces, hairlines, panel fills.
- **Cocoa / Cream / Caramel:** The 3D materials (tempered chocolate,
  porcelain and shortbread, molten centre) referenced in UI only as tints.
- **Paper / Ink:** The cream reading surface for privacy, terms and support.

### Named rules

**The Product Signal Rule.** A product accent identifies that product and
nothing else.

**The One Light Rule.** Each scene has one dominant accent light. Bloom is
reserved for emissive energy (the caramel centre, filaments, moving pieces,
the portal iris), never for chocolate, porcelain or text.

**The Edible Rule.** Everything rendered in 3D is something you could eat
or serve food on. No bare metal machinery; gold appears only as foil trim.

## Typography

**Display and body:** Geist (self-hosted 400 and 500).
**Label:** Geist Mono 500, tracked uppercase.

Geist at weight 500 with tight negative tracking gives the display type an
engineered, Apple-grade calm. Weight 900 and serif display faces are retired.

### Hierarchy

- **Display** (500, fluid to 7rem, 0.94 line-height): hero naming, the
  portal line, nothing else.
- **Headline** (500, fluid to 4.25rem): chapter titles and legal document
  titles.
- **Title** (500, 1.5–2.25rem): product and game names, principle headings.
- **Body** (400, 1rem, 1.55): copy, capped near 65–70 characters.
- **Lead** (400, 1.06–1.25rem, mist): chapter introductions.
- **Label** (mono 500, 0.6875rem, 0.16em): chapter numbers, status,
  readouts, navigation counters.

### Named rules

**The Chapter Index Rule.** Every chapter opens with an ember index, a
hairline and a label (`03 — Software`). Nothing else uses that pattern.

**The Appetite Rule.** Copy may taste of food (bites, centres, flavours,
the pantry, the kitchen) but never jokes at the product's expense; every
line still says what the product does.

**The Readable Document Rule.** Legal and support copy uses body type on
paper with a 65–75ch measure; the 3D stage never loads on those routes.

## Elevation

Depth is rendered, not faked. Surfaces are flat; the only layered element
is the glass panel (8–12% white fill, 1px hairline, 14px blur), used for
cards that sit over the scene so copy stays legible against bloom. No drop
shadows beyond the glass panel's own long, dark falloff.

### Named rules

**The Glass Rule.** Glass exists only where text sits over the 3D scene.
It is never decorative and never stacked.

## Motion

- **Scroll choreography:** one GSAP timeline scrubbed across the page with
  0.9s smoothing. Camera keyframes use `power2.inOut`; linear only for
  tracking shots.
- **Awakening:** 3.4s power-up on load; copy enters in a 150–1100ms stagger.
- **Interaction:** spring-damped pointer parallax on the camera, hover glow
  and lift on 3D exhibits mirrored to their DOM cards, magnetic contact
  button. Sprinkles trail the camera's focus through the whole film.
- **UI easing:** `ease-out-quart` 200–350ms for state changes.
- **Reduced motion:** no camera flight; each chapter shows a still. Copy
  is always visible. Loops stop.

## Components

### Buttons

- **Primary:** Silver fill, ink text, 8px radius, 12×20 padding, label
  rolls on hover.
- **Outline:** 1px 25% white border, silver text; hover to 70%.
- **Outline (paper):** 1px ink border, ink text; hover fills ink.
- **Focus:** 2px ember ring on dark, 2px blue ring on paper.

### Product cards

Glass panel, product dot, mono status, title, category, description and
actions. The ring takes the product accent on hover, focus and when the 3D
exhibit is hovered.

### Chips

Mono label in a hairline pill. Chips identify context, never filter.

### Navigation

Transparent over the hero; glass-strong after 40px. Links in mist with an
ember underline for the active chapter; a mono chapter counter; a chapter
rail on the right (desktop) with one hairline per chapter.

### Legal document

Light reading surface, sticky paper bar, mono app chip with the product
dot, headline title, sibling-document buttons, narrow reading column,
mini footer with every published legal URL.

## Do's and Don'ts

### Do

- **Do** let the 3D scene carry the identity; keep the DOM quiet around it.
- **Do** keep every 3D material edible: chocolate, caramel, glaze, biscuit,
  porcelain, sugar.
- **Do** keep product accents on their products.
- **Do** keep copy on glass or a scrim when it sits over bright scene areas.
- **Do** provide 44px targets, visible focus and the reduced-motion path.
- **Do** keep every legal URL unchanged: Play Console depends on them.

### Don't

- **Don't** add neon, random particle backgrounds or spinning props without
  narrative purpose.
- **Don't** bloom metal, text or UI panels.
- **Don't** stack glass or use gradient text.
- **Don't** bring back the serif display face or the paper-illustration art.
- **Don't** let the food theme turn cartoonish: no mascots, no drips of
  cheese, no cereal-box type. The reference is a chocolatier, not a diner.
- **Don't** put copy only in the canvas; the DOM is the source of truth.
