---
name: Snaxx Tech
description: A cinematic, real-time 3D brand experience for an independent software and games studio.
colors:
  void: "#07080B"
  graphite: "#111318"
  steel: "#1B1E26"
  steel-light: "#2A2E38"
  mist: "#9AA1AE"
  silver: "#E6E8EE"
  white: "#FFFFFF"
  ember: "#F2B35B"
  ember-soft: "#F7CF8F"
  paper: "#F5F4F0"
  paper-deep: "#ECEAE4"
  ink: "#0E0F12"
  ink-soft: "#4E535E"
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

**Creative North Star: "Precision Engine"**

Snaxx Tech presents itself as an advanced, quietly playful machine. The
website is one continuous, real-time 3D film: a levitating mechanical core
awakens, opens to reveal its internal architecture, re-forms into a frame
around the studio's software, becomes a portal, and gives way to a world of
game exhibits. Every chapter is a cinematic scene; every transition is part
of the same directed sequence.

The register is luxury technology: Apple reveal, AAA presentation,
architectural visualisation. Luxury comes from restraint. Deep darks, real
metal and glass, one accent light per scene, generous space and exact type.
The playfulness the studio is known for lives in the products themselves
(the paper dart, the igniting block row, the dotted globe, the flipping
letter tiles) and in the copy, never in decoration.

**Key characteristics**

- A single fixed WebGL stage behind the page; the DOM carries every word.
- Scroll is the camera: chapters are tall sections with sticky stages, and
  the scene state is scrubbed by one scroll-bound timeline.
- Three signature moments: the Awakening (load), the Transformation (plates
  reorganise into a frame around holographic interfaces) and Enter the
  Digital World (flight through a portal into the games).
- Product accents stay attached to their products; ember is the studio's
  only accent and is used sparingly.
- Reduced motion is a first-class path: one still composition per chapter.

## Colors

The palette is near-monochrome: void, graphite and steel surfaces, silver
and mist text, with ember (derived from the wordmark's bitten-cookie gold)
as the energy of the core. The legal documents flip to a light reading
surface (paper and ink).

### Primary

- **Void:** Page and scene background; the stage everything else sits on.
- **Silver:** Primary text on dark and the primary button fill.

### Secondary

- **Ember:** Core energy, active navigation, focus rings on dark, one
  highlight per section. Never a background fill for text blocks.
- **Mist:** Secondary text, labels, metadata.

### Product signals

- **Arrows Blue**, **Block Destroy Orange**, **FJALË Gold**, **Geo Teal**,
  **Offday Mint**: each identifies its product, in the DOM card ring and dot
  and in the 3D exhibit light.

### Neutral

- **Graphite / Steel:** Raised surfaces, hairlines, panel fills.
- **Paper / Ink:** The reading surface for privacy, terms and support.

### Named rules

**The Product Signal Rule.** A product accent identifies that product and
nothing else.

**The One Light Rule.** Each scene has one dominant accent light. Bloom is
reserved for emissive energy (the heart, filaments, moving plates, the
portal), never for metal or text.

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
  button.
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
- **Don't** put copy only in the canvas; the DOM is the source of truth.
