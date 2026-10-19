// Site configuration — Snaxx Tech ("Confectionery Engine" rebrand: snacks, served with industrial care).
// Every word on the home page lives here; the 3D experience reads the
// product data below so the scene and the DOM always agree.

export interface SiteConfig {
  language: string;
  title: string;
  description: string;
}

export const siteConfig: SiteConfig = {
  language: "en",
  title: "Snaxx Tech — a small software studio for apps and games",
  description:
    "Snaxx Tech is a small software studio. We make Offday for teams, AppCare for app security, and the games Arrows, Block Destroy, Geo Guesser World 3D! and FJALË.",
};

// Navigation
export interface NavLink {
  label: string;
  href: string;
}

export interface NavigationConfig {
  logo: string;
  links: NavLink[];
  contactLabel: string;
  contactHref: string;
}

export const navigationConfig: NavigationConfig = {
  logo: "Snaxx Tech",
  links: [
    { label: "Software", href: "#software" },
    { label: "AppCare", href: "#appcare" },
    { label: "Games", href: "#games" },
    { label: "Studio", href: "#studio" },
  ],
  contactLabel: "Get in touch",
  contactHref: "#contact",
};

// Hero
export interface HeroConfig {
  headline: [string, string];
  intro: string;
  primaryCta: NavLink;
  secondaryCta: NavLink;
}

export const heroConfig: HeroConfig = {
  headline: ["Small bites.", "Big craving."],
  intro:
    "Snaxx Tech is a small software studio. We design, build and look after apps and games: Offday for teams, AppCare for app security, and four games for Android and the web.",
  primaryCta: { label: "Explore the work", href: "#software" },
  secondaryCta: { label: "Play FJALË", href: "https://xn--fjal-opa.com" },
};

// Story chapters between the hero and the products
export interface ChapterCopy {
  id: string;
  heading: string;
  body: string;
  align?: "left" | "right" | "center";
}

export const storyChapters: ChapterCopy[] = [
  {
    id: "core",
    heading: "We crack every idea open first.",
    body:
      "Before a feature ships, we build a rough version and use it ourselves for a while. If it is not good to use, it does not ship.",
    align: "left",
  },
  {
    id: "inside",
    heading: "Nothing in here is filler.",
    body:
      "Most of the work is in parts you never see: how fast a screen loads, what happens offline, how a tap feels. Get those right and nobody notices them.",
    align: "center",
  },
];

// Software
export interface ProductFeature {
  title: string;
  body: string;
}

export interface SoftwareProduct {
  id: string;
  name: string;
  tagline: string;
  description: string;
  status: string;
  accent: string;
  features: ProductFeature[];
  href?: string;
  actionLabel?: string;
}

export interface SoftwareConfig {
  heading: string;
  description: string;
  products: SoftwareProduct[];
}

export const softwareConfig: SoftwareConfig = {
  heading: "Software for small teams.",
  description:
    "Fast, plain tools for the people who use them every day, with no training session needed.",
  products: [
    {
      id: "offday",
      name: "Offday",
      tagline: "Time off, requested and approved in one place.",
      description:
        "Paid time off for companies: employee accounts, manager approvals, live balances and a shared team calendar.",
      status: "Private beta",
      accent: "#58D6A6",
      features: [
        { title: "Company workspaces", body: "Invite your team, set policies, done." },
        { title: "Manager approvals", body: "Approve with the dates and balance in view." },
        { title: "Live balances", body: "Accruals and carry-over, always current." },
        { title: "Team calendar", body: "See who is out before you plan the week." },
      ],
      actionLabel: "Request access",
      href: "#contact",
    },
    {
      id: "lab",
      name: "The Lab",
      tagline: "Useful little things, still in the oven.",
      description:
        "Small tools and prototypes we build for ourselves first. Some become products. The rest teach us something the products use.",
      status: "3 prototypes in progress",
      accent: "#F2B35B",
      features: [
        { title: "Offline first", body: "Everything works without a signal." },
        { title: "No accounts", body: "Your data stays on your device." },
      ],
    },
  ],
};

// AppCare (security scan product; the 3D loupe scene lives in AppCareLoupe.tsx)
export const appcareConfig = {
  name: "AppCare",
  status: "On sale November 15",
  accent: "#E3A24C",
  heading: "Some flaws only show under the right light.",
  flaws: ["Bookings readable by anyone", "Secret key in the page code", "Access rule lets everyone in"],
  clear: "Under the same light, nothing glows.",
  body:
    "AppCare is a one-time security scan for apps built with Lovable, Bolt, Replit and v0. It explains every finding in plain English and writes the fix prompt to paste into your builder.",
  terms: "$49 once per app · read-only, it never changes your app",
  cta: "Tell me when it is on sale",
  caption: "Illustration on an example app, not a real scan.",
  email: "techsnaxx@gmail.com",
};

// Games
export interface GameItem {
  id: "arrows" | "block-destroy" | "geo-guesser" | "fjale";
  name: string;
  category: string;
  description: string;
  status: string;
  accent: string;
  image: string;
  href?: string;
  actionLabel?: string;
  /** Slug in src/legal/content.ts; the card links to that app on the /legal hub. */
  legalSlug?: string;
}

export interface GamesConfig {
  heading: string;
  description: string;
  portalHeading: string;
  games: GameItem[];
}

export const gamesConfig: GamesConfig = {
  heading: "Four games, made to be replayed.",
  description:
    "A precision arcade, a calm block puzzle, a geography game and a daily word game in Albanian. Different games, the same care for how each round feels.",
  portalHeading: "Now, the games.",
  games: [
    {
      id: "arrows",
      name: "Arrows",
      category: "Calm arrow puzzle",
      description:
        "A picture drawn out of arrows. Tap one whose lane is clear to send it off the board, and clear the whole picture. No timer, no rush.",
      status: "Coming to Android",
      accent: "#2F8CFF",
      image: "/images/app-arrows.webp",
      legalSlug: "arrows",
    },
    {
      id: "block-destroy",
      name: "Block Destroy",
      category: "Offline block puzzle",
      description:
        "A quiet block puzzle with no timer, no account and no signal needed. Place a piece, clear a line, take your time.",
      status: "Coming to Android",
      accent: "#FF7A29",
      image: "/images/app-block-destroy.webp",
      legalSlug: "block-destroy",
    },
    {
      id: "geo-guesser",
      name: "Geo Guesser World 3D!",
      category: "Explore and guess",
      description:
        "Dropped anywhere on Earth in 3D. Look around, read the clues, and pin where you think you are.",
      status: "Live on Android",
      accent: "#14B8A6",
      image: "/images/app-geo-guesser.webp",
      href: "https://play.google.com/store/apps/details?id=com.snaxxtech.geoguesser&hl=en",
      actionLabel: "Play Geoguesser",
      legalSlug: "geo-guesser-world-3d",
    },
    {
      id: "fjale",
      name: "FJALË",
      category: "Daily Albanian word game",
      description:
        "One word a day, five letters, six tries. Built for the Albanian language and the people who love it.",
      status: "Live on the web",
      accent: "#D08700",
      image: "/images/app-fjale.webp",
      href: "https://xn--fjal-opa.com",
      actionLabel: "Play FJALË",
    },
  ],
};

// Studio
export interface StudioStat {
  value: string;
  label: string;
}

export interface StudioPrinciple {
  title: string;
  body: string;
}

export interface StudioConfig {
  heading: string;
  description: string;
  stats: StudioStat[];
  principles: StudioPrinciple[];
}

export const studioConfig: StudioConfig = {
  heading: "Small studio, long support.",
  description:
    "We are a small, independent team. The people who design a product also build it, ship it and answer its support email years later.",
  stats: [
    { value: "5", label: "Products, live or on the way" },
    { value: "2", label: "Platforms: Android & web" },
    { value: "100%", label: "Independent" },
  ],
  principles: [
    {
      title: "Privacy by default",
      body: "No accounts unless the product needs them, progress on your device, ads clearly disclosed, policies written in plain language.",
    },
    {
      title: "Support that answers",
      body: "Real people reply within two to three business days, and we keep maintaining products long after launch.",
    },
    {
      title: "Motion with intent",
      body: "Every animation explains a relationship or answers an input. Reduced-motion users get the same information, calmly.",
    },
  ],
};

// Contact
export interface ContactConfig {
  heading: string;
  description: string;
  buttonText: string;
  email: string;
}

export const contactConfig: ContactConfig = {
  heading: "Write to us. We read everything.",
  description:
    "Game support, Offday access, press, or a product you want built. One inbox, answered by the people who make the products.",
  buttonText: "Email the studio",
  email: "techsnaxx@gmail.com",
};

// Footer
export interface FooterLinkColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface FooterConfig {
  logo: string;
  description: string;
  columns: FooterLinkColumn[];
  copyright: string;
  credit: string;
}

export const footerConfig: FooterConfig = {
  logo: "Snaxx Tech",
  description:
    "A small software studio making apps and games: Offday, Arrows, Block Destroy, Geo Guesser World 3D! and FJALË.",
  columns: [
    {
      title: "Products",
      links: [
        { label: "Offday", href: "#software" },
        { label: "AppCare", href: "#appcare" },
        { label: "Arrows", href: "#games" },
        { label: "Block Destroy", href: "#games" },
        { label: "Geo Guesser World 3D!", href: "#games" },
        { label: "FJALË", href: "https://xn--fjal-opa.com" },
      ],
    },
    {
      title: "Studio",
      links: [
        { label: "About", href: "#studio" },
        { label: "Contact", href: "#contact" },
      ],
    },
    {
      title: "Legal",
      links: [{ label: "Privacy & terms", href: "/legal" }],
    },
  ],
  copyright: "© 2026 Snaxx Tech. All rights reserved.",
  credit: "Made with care, coffee & crumbs.",
};
