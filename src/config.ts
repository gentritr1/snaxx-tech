// Site configuration — Snaxx Tech
// Studio landing page showcasing Arrows (game) and Rowflare,
// with links to per-app Privacy Policy and Terms of Service pages.

export interface SiteConfig {
  language: string;
  title: string;
  description: string;
}

export const siteConfig: SiteConfig = {
  language: "en",
  title: "Snaxx Tech — Indie Apps & Games Studio",
  description:
    "Snaxx Tech is an independent studio crafting playful apps and games, from Arrows and Rowflare coming to Android to the daily Albanian word game FJALË on the web.",
};

// Navigation configuration
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
    { label: "Apps", href: "#portfolio" },
    { label: "Studio", href: "#about" },
    { label: "What We Do", href: "#services" },
  ],
  contactLabel: "Get in Touch",
  contactHref: "#contact",
};

// Hero section configuration
export interface HeroConfig {
  name: string;
  roles: string[];
  intro: string;
  releaseNote: string;
  backgroundImage: string;
}

export const heroConfig: HeroConfig = {
  name: "SNAXX",
  roles: ["Apps, games & useful little things", "Independent by design"],
  intro: "We turn small ideas into apps, games, and satisfying little moments.",
  releaseNote: "Arrows + Rowflare · coming to Android",
  backgroundImage: "/images/hero-bg.jpg",
};

// About section configuration
export interface AboutStat {
  value: string;
  label: string;
}

export interface AboutImage {
  src: string;
  alt: string;
}

export interface AboutConfig {
  label: string;
  heading: string;
  description: string;
  experienceValue: string;
  experienceLabel: string;
  stats: AboutStat[];
  images: AboutImage[];
}

export const aboutConfig: AboutConfig = {
  label: "The Studio",
  heading: "Small team. Big curiosity.",
  description:
    "We make software with a pulse — from the precision arcade action of Arrows to the everyday flow of Rowflare and the daily Albanian word game FJALË. Every tap, swipe, and transition gets attention until it feels just right.",
  experienceValue: "",
  experienceLabel: "",
  stats: [
    { value: "3", label: "Products in our world" },
    { value: "2", label: "Platforms — Android & web" },
    { value: "100%", label: "Indie & independent" },
  ],
  images: [
    { src: "/images/about-1.webp", alt: "Arrows being played on a phone at night" },
    { src: "/images/about-2.webp", alt: "Hands holding a phone playing a glowing puzzle" },
    { src: "/images/about-3.webp", alt: "App wireframe sketches on dark paper" },
    { src: "/images/about-4.webp", alt: "Code on a laptop in a dark studio" },
  ],
};

// Services section configuration
export interface ServiceItem {
  iconName: string;
  title: string;
  description: string;
  image: string;
}

export interface ServicesConfig {
  label: string;
  heading: string;
  services: ServiceItem[];
}

export const servicesConfig: ServicesConfig = {
  label: "What We Do",
  heading: "Built with care. Tested with thumbs.",
  services: [
    {
      iconName: "Gamepad2",
      title: "Game Development",
      description:
        "We design and build tight, replayable arcade experiences like Arrows — simple to pick up, hard to put down.",
      image: "/images/app-arrows.webp",
    },
    {
      iconName: "Smartphone",
      title: "App Design & Engineering",
      description:
        "From first sketch to release, we craft fast, thoughtful apps like Rowflare that make everyday tasks feel effortless.",
      image: "/images/app-rowflare.webp",
    },
    {
      iconName: "ShieldCheck",
      title: "Privacy-First by Default",
      description:
        "No accounts, no clutter. Your progress stays on your device, ads are clearly disclosed, and our policies are written in plain language you can actually read.",
      image: "/images/cta-bg.webp",
    },
    {
      iconName: "HeartHandshake",
      title: "Support That Answers",
      description:
        "Real humans, real replies. We keep maintaining our apps long after launch and listen to the people who use them.",
      image: "/images/support-card.webp",
    },
  ],
};

// Portfolio section configuration
export interface ProjectItem {
  title: string;
  category: string;
  status: string;
  action?: string;
  year: string;
  image: string;
  featured?: boolean;
  href?: string;
  privacyHref?: string;
  termsHref?: string;
  accent?: string;
  /** Promo artwork includes its own footer, which the current card action replaces. */
  hasEmbeddedPromoFooter?: boolean;
}

export interface PortfolioCTA {
  label: string;
  heading: string;
  linkText: string;
  linkHref: string;
}

export interface PortfolioConfig {
  label: string;
  heading: string;
  description: string;
  projects: ProjectItem[];
  cta: PortfolioCTA;
  viewAllLabel: string;
}

export const portfolioConfig: PortfolioConfig = {
  label: "Our Apps",
  heading: "Meet the ideas that escaped the notes app.",
  description:
    "Three different sparks, one shared obsession: make the next tap feel obvious, useful, or unexpectedly fun.",
  projects: [
    {
      title: "Arrows",
      category: "Precision arcade game",
      status: "Coming to Android",
      action: "Release in progress",
      year: "2026",
      image: "/images/app-arrows.webp",
      featured: true,
      accent: "#0082F3",
      privacyHref: "/privacy/arrows",
      termsHref: "/terms/arrows",
    },
    {
      title: "Rowflare",
      category: "A focused mobile utility",
      status: "Coming to Android",
      action: "Release in progress",
      year: "2026",
      image: "/images/app-rowflare.webp",
      accent: "#FF7A29",
      privacyHref: "/privacy/rowflare",
      termsHref: "/terms/rowflare",
    },
    {
      title: "FJALË",
      category: "The daily Albanian word game",
      status: "Live on the web",
      action: "Play FJALË online",
      year: "2026",
      image: "/images/app-fjale.webp",
      href: "https://xn--fjal-opa.com",
      accent: "#D08700",
      hasEmbeddedPromoFooter: true,
    },
    {
      title: "What's Next",
      category: "Something small and surprising is taking shape in the lab.",
      status: "In the lab",
      year: "Soon",
      image: "/images/lab-next.webp",
      accent: "#131313",
    },
  ],
  cta: {
    label: "Open inbox",
    heading: "Have a bug, a question, or a wonderfully strange idea?",
    linkText: "Send it our way",
    linkHref: "#contact",
  },
  viewAllLabel: "",
};

// Testimonials section configuration (hidden — no testimonials yet)
export interface TestimonialItem {
  quote: string;
  author: string;
  role: string;
  company: string;
  image: string;
  rating: number;
}

export interface TestimonialsConfig {
  label: string;
  heading: string;
  testimonials: TestimonialItem[];
}

export const testimonialsConfig: TestimonialsConfig = {
  label: "",
  heading: "",
  testimonials: [],
};

// CTA section configuration
export interface CTAConfig {
  tags: string[];
  heading: string;
  description: string;
  buttonText: string;
  buttonHref: string;
  email: string;
  backgroundImage: string;
}

export const ctaConfig: CTAConfig = {
  tags: ["Android", "Web", "Independent studio"],
  heading: "Ideas, questions, bug reports — we read every one.",
  description:
    "Whether it's support for Arrows, Rowflare, or FJALË, a press inquiry, or a wild idea for our next app — our inbox is always open.",
  buttonText: "Email Us",
  buttonHref: "mailto:techsnaxx@gmail.com",
  email: "techsnaxx@gmail.com",
  backgroundImage: "/images/cta-bg.webp",
};

// Footer section configuration
export interface FooterLinkColumn {
  title: string;
  links: { label: string; href: string }[];
}

export interface SocialLink {
  iconName: string;
  href: string;
  label: string;
}

export interface FooterConfig {
  logo: string;
  description: string;
  columns: FooterLinkColumn[];
  socialLinks: SocialLink[];
  newsletterHeading: string;
  newsletterDescription: string;
  newsletterButtonText: string;
  newsletterPlaceholder: string;
  copyright: string;
  credit: string;
}

export const footerConfig: FooterConfig = {
  logo: "Snaxx Tech",
  description:
    "An independent studio crafting apps and games with care. Home of Arrows, Rowflare, and the daily Albanian word game FJALË.",
  columns: [
    {
      title: "Apps",
      links: [
        { label: "Arrows", href: "#portfolio" },
        { label: "Rowflare", href: "#portfolio" },
        { label: "FJALË", href: "https://xn--fjal-opa.com" },
        { label: "What's Next", href: "#portfolio" },
      ],
    },
    {
      title: "Studio",
      links: [
        { label: "About", href: "#about" },
        { label: "What We Do", href: "#services" },
        { label: "Support", href: "#contact" },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Arrows — Privacy", href: "/privacy/arrows" },
        { label: "Arrows — Terms", href: "/terms/arrows" },
        { label: "Rowflare — Privacy", href: "/privacy/rowflare" },
        { label: "Rowflare — Terms", href: "/terms/rowflare" },
      ],
    },
  ],
  socialLinks: [],
  newsletterHeading: "",
  newsletterDescription: "",
  newsletterButtonText: "",
  newsletterPlaceholder: "",
  copyright: "© 2026 Snaxx Tech. All rights reserved.",
  credit: "Made with care, coffee & code.",
};
