# Exvia - Portfolio Website Template

A modern, animated single-page portfolio template with a cinematic hero section featuring mouse-tracking image reveal, scroll-triggered animations, parallax effects, and a testimonial slider. Built with React, TypeScript, Tailwind CSS, and Vite.

## Features

- **Cinematic Hero Section** - Full-screen hero with blurred background, sharp mouse-tracking image window with crosshair, and role labels on sides
- **Scroll Animations** - Intersection Observer based reveal animations with staggered timing
- **Mouse Parallax** - Service cards feature mouse-following hover images with rotation
- **Testimonial Slider** - Auto-advancing carousel with slide transitions, star ratings, and dot/arrow navigation
- **Page Load Overlay** - Smooth loading screen with animated progress indicator
- **Responsive Navigation** - Fixed navbar with transparent-to-white scroll transition, animated hamburger menu for mobile
- **Animated Buttons** - Text slide animation on hover with arrow icon support
- **Bento Grid Portfolio** - Mixed layout grid with featured projects, CTA card, and decorative circles
- **Newsletter Footer** - Full footer with link columns, social icons, and email subscription form
- **Fully Configurable** - All content driven by a single `config.ts` file

## Tech Stack

- **React 19** with TypeScript
- **Vite 7** for development and building
- **Tailwind CSS 3** with custom design tokens (Exvia Design System)
- **Lucide React** for icons (dynamically resolved by name)
- **Geist Font** (Regular, Medium, Mono) loaded via CDN
- **shadcn/ui** component primitives available

## Quick Start

```bash
npm install
npm run dev
```

## Configuration

All site content is managed through `src/config.ts`. Each section has its own configuration object with TypeScript interfaces for type safety. When a config object has empty values, the corresponding section returns `null` and is not rendered.

### Config Objects

- `siteConfig` - Global site title, description, language
- `navigationConfig` - Logo text, nav links, contact button
- `heroConfig` - Name, roles (displayed on left/right sides), background image path
- `aboutConfig` - Label, description, experience badge, stats array, images array
- `servicesConfig` - Label, heading, services array (each with iconName, title, description, image)
- `portfolioConfig` - Label, heading, description, projects array, CTA card, view all label
- `testimonialsConfig` - Label, heading, testimonials array (each with quote, author, role, company, image, rating)
- `ctaConfig` - Tags, heading, description, button text/href, email, background image
- `footerConfig` - Logo, description, link columns, social links, newsletter, copyright, credit

### Icon Names

Service and social icons use Lucide icon names (PascalCase). Examples: `Compass`, `PenTool`, `Layout`, `Code`, `Dribbble`, `Twitter`, `Linkedin`, `Instagram`.

## Required Images

Place images in `public/images/`:

- `hero-bg.jpg` - Hero section background (full-screen, high resolution)
- `about-1.jpg` to `about-4.jpg` - About section image grid (portrait 4:5 ratio)
- `service-1.jpg` to `service-4.jpg` - Service hover preview images
- `portfolio-1.jpg` to `portfolio-5.jpg` - Portfolio project thumbnails
- `testimonial-1.jpg` to `testimonial-3.jpg` - Testimonial author photos (portrait)
- `cta-bg.jpg` - CTA section background image

## Design System

- **Colors**: Black (#131313), White (#FFFFFF), Base Black (#1D1D1D), Subtle (#EAEAEA), Border (#EFEFF2), Blue (#0082F3), Focus (#4D65FF)
- **Typography**: Geist (400, 500) for body, GeistMono (500) for labels and monospace text
- **Animations**: Custom easing curves (out-quad, out-cubic, out-quart, out-circ, in-out-quad)
- **Layout**: Full-width sections with container-large (80rem max) inner content

## Project Structure

```
src/
  config.ts          # All site content configuration
  App.tsx            # Main app with page load overlay
  App.css            # Base Vite styles
  index.css          # Global styles, fonts, animations, utilities
  main.tsx           # React entry point
  components/
    Navigation.tsx   # Fixed navbar with mobile menu
    AnimatedButton.tsx  # Hover-animated button component
    PageOverlay.tsx  # Loading screen overlay
  sections/
    Hero.tsx         # Full-screen hero with mouse-tracking image reveal
    About.tsx        # Two-column about with image grid
    Services.tsx     # Service cards with hover parallax images
    Portfolio.tsx    # Bento grid project showcase
    Testimonials.tsx # Auto-advancing testimonial carousel
    CTA.tsx          # Call-to-action with background image
    Footer.tsx       # Multi-column footer with newsletter
  hooks/
    useMouseParallax.ts  # Mouse parallax for hero and services
    usePageLoad.ts       # Page load state management
    useScrollAnimation.ts # Intersection Observer scroll reveals
    use-mobile.ts        # Mobile breakpoint detection
  lib/
    utils.ts         # cn() utility for class merging
```
