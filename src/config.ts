// Site configuration — Snaxx Tech ("Precision Engine" rebrand).
// Every word on the home page lives here; the 3D experience reads the
// product data below so the scene and the DOM always agree.

export interface SiteConfig {
  language: string;
  title: string;
  description: string;
}

export const siteConfig: SiteConfig = {
  language: "en",
  title: "Snaxx Tech — Precision-built apps & games",
  description:
    "Snaxx Tech is an independent studio engineering software and games with industrial care: Offday for teams, and the games Arrows, Block Destroy, Geo Guesser World 3D! and the daily Albanian word game FJALË.",
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
    { label: "Games", href: "#games" },
    { label: "Studio", href: "#studio" },
  ],
  contactLabel: "Get in touch",
  contactHref: "#contact",
};

// Hero
export interface HeroConfig {
  eyebrow: string;
  headline: [string, string];
  intro: string;
  primaryCta: NavLink;
  secondaryCta: NavLink;
  readouts: string[];
}

export const heroConfig: HeroConfig = {
  eyebrow: "Independent studio · Apps, games & useful little things",
  headline: ["Small ideas.", "Engineered large."],
  intro:
    "We build software and games the way a watchmaker builds a movement: every part machined, every motion tuned, nothing decorative.",
  primaryCta: { label: "Explore the work", href: "#software" },
  secondaryCta: { label: "Play FJALË", href: "https://xn--fjal-opa.com" },
  readouts: ["CORE // ONLINE", "RINGS // 3", "COMPONENTS // 900"],
};

// Story chapters between the hero and the products
export interface ChapterCopy {
  id: string;
  index: string;
  label: string;
  heading: string;
  body: string;
  align?: "left" | "right" | "center";
}

export const storyChapters: ChapterCopy[] = [
  {
    id: "core",
    index: "01",
    label: "The core",
    heading: "Every product starts as a machine we can take apart.",
    body:
      "Before a feature ships, we open it up. Components come off, the structure underneath gets inspected, and what stays is only what earns its place.",
    align: "left",
  },
  {
    id: "inside",
    index: "02",
    label: "Inside",
    heading: "Nothing in here is decorative.",
    body:
      "Interaction timing, loading paths, offline behaviour, the weight of a tap. The craft is in the parts you never see, so the parts you do feel effortless.",
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
  index: string;
  label: string;
  heading: string;
  description: string;
  products: SoftwareProduct[];
}

export const softwareConfig: SoftwareConfig = {
  index: "03",
  label: "Software",
  heading: "Tools that feel engineered, not assembled.",
  description:
    "Working software for small teams: fast, legible and respectful of the people who use it every day.",
  products: [
    {
      id: "offday",
      name: "Offday",
      tagline: "Time off that approves itself.",
      description:
        "A paid-time-off system for companies: employee accounts, manager approvals, balances and a team calendar in one calm workspace.",
      status: "Private beta",
      accent: "#58D6A6",
      features: [
        { title: "Company workspaces", body: "Invite your team, set policies, done." },
        { title: "Manager approvals", body: "One tap, with context, from anywhere." },
        { title: "Live balances", body: "Accruals and carry-over, always current." },
        { title: "Team calendar", body: "See who is out before you plan the week." },
      ],
      actionLabel: "Request access",
      href: "#contact",
    },
    {
      id: "lab",
      name: "The Lab",
      tagline: "Useful little things, in motion.",
      description:
        "Small utilities and prototypes we build to scratch our own itches. Some graduate into products; the rest make the products better.",
      status: "3 prototypes running",
      accent: "#F2B35B",
      features: [
        { title: "Offline first", body: "Everything works without a signal." },
        { title: "No accounts", body: "Your data stays on your device." },
      ],
    },
  ],
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
  privacyHref?: string;
  termsHref?: string;
  supportHref?: string;
}

export interface GamesConfig {
  index: string;
  label: string;
  heading: string;
  description: string;
  portalLabel: string;
  portalHeading: string;
  games: GameItem[];
}

export const gamesConfig: GamesConfig = {
  index: "04",
  label: "Games",
  heading: "Worlds built to be replayed.",
  description:
    "Four games, four different sparks: precision, calm, curiosity and language. One shared obsession with the next tap feeling right.",
  portalLabel: "Enter the worlds",
  portalHeading: "Beyond the work, the worlds we play in.",
  games: [
    {
      id: "arrows",
      name: "Arrows",
      category: "Precision arcade",
      description:
        "Fly a paper arrow through a sky of hazards. Simple to pick up, hard to put down, and tuned to the frame.",
      status: "Coming to Android",
      accent: "#2F8CFF",
      image: "/images/app-arrows.webp",
      privacyHref: "/privacy/arrows",
      termsHref: "/terms/arrows",
    },
    {
      id: "block-destroy",
      name: "Block Destroy",
      category: "Offline block puzzle",
      description:
        "Place, clear, breathe. A quiet puzzle with no timer, no account and no signal required.",
      status: "Coming to Android",
      accent: "#FF7A29",
      image: "/images/app-block-destroy.webp",
      privacyHref: "/block-destroy/privacy",
      termsHref: "/block-destroy/terms",
      supportHref: "/block-destroy/support",
    },
    {
      id: "geo-guesser",
      name: "Geo Guesser World 3D!",
      category: "Explore and guess",
      description:
        "Dropped anywhere on Earth in 3D. Look around, read the clues, and pin where you think you are.",
      status: "Coming to Android",
      accent: "#14B8A6",
      image: "/images/app-geo-guesser.webp",
      privacyHref: "/geo-guesser-world-3d/privacy",
      termsHref: "/geo-guesser-world-3d/terms",
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
  index: string;
  label: string;
  heading: string;
  description: string;
  stats: StudioStat[];
  principles: StudioPrinciple[];
}

export const studioConfig: StudioConfig = {
  index: "05",
  label: "Studio",
  heading: "Small team. Industrial standards.",
  description:
    "Snaxx Tech is an independent studio. We keep the team small so every product gets the same hands from first sketch to long-term support.",
  stats: [
    { value: "5", label: "Products in the world" },
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
  index: string;
  label: string;
  heading: string;
  description: string;
  buttonText: string;
  email: string;
  tags: string[];
}

export const contactConfig: ContactConfig = {
  index: "06",
  label: "Contact",
  heading: "Ideas, questions, bug reports. We read every one.",
  description:
    "Support for any of our games, access to Offday, a press inquiry or a strange and wonderful idea: our inbox is open.",
  buttonText: "Email the studio",
  email: "techsnaxx@gmail.com",
  tags: ["Android", "Web", "Independent studio"],
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
    "An independent studio engineering software and games with care. Home of Offday, Arrows, Block Destroy, Geo Guesser World 3D! and FJALË.",
  columns: [
    {
      title: "Products",
      links: [
        { label: "Offday", href: "#software" },
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
      links: [
        { label: "Arrows — Privacy", href: "/privacy/arrows" },
        { label: "Arrows — Terms", href: "/terms/arrows" },
        { label: "Block Destroy — Privacy", href: "/block-destroy/privacy" },
        { label: "Block Destroy — Terms", href: "/block-destroy/terms" },
        { label: "Block Destroy — Support", href: "/block-destroy/support" },
        { label: "Geo Guesser — Privacy", href: "/geo-guesser-world-3d/privacy" },
        { label: "Geo Guesser — Terms", href: "/geo-guesser-world-3d/terms" },
      ],
    },
  ],
  copyright: "© 2026 Snaxx Tech. All rights reserved.",
  credit: "Engineered with care, coffee & code.",
};
