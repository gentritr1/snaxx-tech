---
name: Snaxx Tech
description: A cinematic, playful showcase for an independent apps and games studio.
colors:
  ink: "#131313"
  ink-soft: "#1D1D1D"
  canvas: "#FFFFFF"
  surface-muted: "#EAEAEA"
  border-subtle: "#EFEFF2"
  electric-blue: "#0082F3"
  focus-blue: "#4D65FF"
  arrows-blue: "#0082F3"
  rowflare-orange: "#FF7A29"
  fjale-gold: "#D08700"
typography:
  display:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "clamp(3rem, 10vw, 6rem)"
    fontWeight: 900
    lineHeight: 0.85
    letterSpacing: "-0.04em"
  headline:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "clamp(2.5rem, 4rem, 4rem)"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Geist, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "GeistMono, Courier New, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.1em"
rounded:
  xs: "2px"
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
  section: "clamp(4rem, 8vw, 7.5rem)"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.canvas}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  chip-app:
    backgroundColor: "{colors.canvas}"
    textColor: "{colors.ink-soft}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
---

# Design System: Snaxx Tech

## Overview

**Creative North Star: "The Kinetic Playroom"**

Snaxx Tech combines a dark, cinematic studio atmosphere with bright product-specific signals and precise, responsive interaction. The experience should feel like opening the door to a small team actively experimenting: polished enough to trust, lively enough to remember, and always centered on real things the studio has made.

The system rejects stiff corporate seriousness, generic agency-template or repetitive card-grid AI styling, childish gimmicks, and motion overload. Playfulness comes from composition, product imagery, copy, and purposeful behavior rather than decorative clutter.

**Key Characteristics:**

- Cinematic dark-to-light pacing anchored by real product assets.
- Oversized Geist display type paired with compact Geist Mono labels.
- Product accents used as orientation signals, not generic decoration.
- Square and moderately rounded geometry, with full pills reserved for chips.
- Motion that reveals relationships and responds to input while preserving a reduced-motion path.

## Colors

The palette is nearly monochrome at the studio level, allowing electric blue, Rowflare orange, and FJALË gold to announce product identity.

### Primary

- **Studio Ink:** The default text, navigation, button, and dark-surface anchor.
- **Clean Canvas:** The reading surface for long copy and product information.

### Secondary

- **Electric Blue:** The studio's technical spark and Arrows identifier.
- **Rowflare Orange:** A warm product-specific accent for Rowflare.

### Tertiary

- **FJALË Gold:** A restrained identifier for the word game and its warm artwork.
- **Focus Blue:** The shared accessible focus indicator; it must remain visible on light and dark contexts.

### Neutral

- **Soft Ink:** Secondary dark surfaces and high-emphasis muted text.
- **Muted Surface:** Quiet section bands and restrained hover feedback.
- **Subtle Border:** Dividers and structural boundaries without artificial depth.

### Named Rules

**The Product Signal Rule.** Use a product accent to identify its product, not as an interchangeable decoration across unrelated sections.

## Typography

**Display Font:** Geist (with Arial and sans-serif fallback)  
**Body Font:** Geist (with Arial and sans-serif fallback)  
**Label/Mono Font:** GeistMono (with Courier New and monospace fallback)

**Character:** Geist provides clean, contemporary shapes that let product imagery and motion lead. Geist Mono adds a compact maker-studio cadence to short metadata, never to long reading text.

### Hierarchy

- **Display** (900, fluid up to 6rem, 0.85 line-height): Hero naming and rare signature moments only.
- **Headline** (600, fluid up to 4rem, 1 line-height): Major section and legal-document titles.
- **Title** (500–600, 1.25–2.5rem, 1.1–1.3 line-height): Product and content-section headings.
- **Body** (400, 1rem, 1.5–1.75 line-height): Explanations and legal copy, capped near 70 characters per line.
- **Label** (500, 0.75rem, tracked uppercase): Short metadata, navigation cues, and status labels only.

### Named Rules

**The Readable Document Rule.** Legal and support copy uses body type with generous leading and a 65–75ch measure; display behavior never competes with comprehension.

## Elevation

The system is flat by default. Depth is created through full-bleed photography, tonal layering, sticky positioning, borders, and limited backdrop blur. The only established shadow is a compact `0 1px 2px rgb(0 0 0 / 0.05)` navigation lift; broad decorative shadows do not belong.

### Shadow Vocabulary

- **Navigation Lift** (`0 1px 2px rgb(0 0 0 / 0.05)`): Used only when navigation separates from scrolled content.

### Named Rules

**The Flat-at-Rest Rule.** Surfaces remain flat until hierarchy or interactive state requires separation.

## Components

### Buttons

- **Shape:** Compact rounded rectangle using the 8px large radius; pill shapes are reserved for chips.
- **Primary:** Studio Ink with white text, medium weight, and 12px × 20px padding.
- **Hover / Focus:** Text, arrow, or background movement follows the established 200–350ms ease-out curves; `:focus-visible` uses Focus Blue and never relies on motion alone.
- **Secondary / Ghost:** White or transparent surfaces with a clear full border; never pair a wide soft shadow with a 1px decorative border.

### Chips

- **Style:** White pill, subtle full border, mono label, and one small product-color marker.
- **State:** Chips identify context; they are not presented as filters unless they actually change content.

### Cards / Containers

- **Corner Style:** Square imagery or restrained 8–12px rounding.
- **Background:** Clean Canvas, Studio Ink, or a product-led image.
- **Shadow Strategy:** Flat by default; rely on contrast and composition.
- **Border:** Subtle Border when separation is necessary.
- **Internal Padding:** 16–32px, scaling with the content hierarchy.

### Inputs / Fields

- **Style:** White-on-dark or dark-on-light, 8px radius, clear label, and full border.
- **Focus:** Visible Focus Blue outline or border shift with no layout movement.
- **Error / Disabled:** Use explicit copy and state styling; never communicate status by opacity or color alone.

### Navigation

Navigation is transparent over the cinematic hero and becomes a near-opaque white bar after scrolling. Links use readable Geist body type, visible hover/focus feedback, and a full-screen mobile menu with a predictable close control and preserved browser navigation.

### Legal Document

Legal pages use a sticky studio bar, a muted document header, app-specific chip, sibling-document links, desktop table of contents, and a narrow reading column. Page and section headings remain semantic, anchor targets clear the sticky header, and the footer exposes every app-specific legal URL.

## Do's and Don'ts

### Do:

- **Do** use real Arrows, Rowflare, and FJALË assets as the primary source of personality.
- **Do** keep product accents attached to their named product.
- **Do** keep legal and support copy on Clean Canvas with a readable 65–75ch measure.
- **Do** provide visible keyboard focus, 44px touch targets, and reduced-motion alternatives.
- **Do** use the established ease-out curves and transform/opacity-based motion for interactive feedback.

### Don't:

- **Don't** make the site feel like stiff corporate seriousness.
- **Don't** introduce generic agency-template or repetitive card-grid AI styling.
- **Don't** use childish gimmicks or motion overload that blocks content.
- **Don't** use gradient text, decorative glassmorphism, oversized corner radii, or colored side-stripe accents.
- **Don't** repeat tiny tracked uppercase eyebrows as default scaffolding for every section.
- **Don't** replace product imagery with abstract placeholder panels or hand-drawn sketch SVGs.
