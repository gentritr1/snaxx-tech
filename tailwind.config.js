/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      screens: {
        // Laptop heights where the software column would run under the nav.
        short: { raw: '(max-height: 940px)' },
        // Landscape phones: every chapter stage is one viewport tall.
        shortland: { raw: '(orientation: landscape) and (max-height: 500px)' },
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive) / <alpha-value>)",
          foreground: "hsl(var(--destructive-foreground) / <alpha-value>)",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /* Confectionery Engine brand tokens — see DESIGN.md.
           A bright vanilla-cream studio: `void` is the page cream, `silver` the
           cocoa text. Text-safe on void: silver (13.5:1), mist (5.9:1 on void,
           ~5.0:1 on the rendered 3D background), ember (4.9:1). */
        void: '#F7F0E4',
        graphite: '#EFE5D5',
        steel: '#E2D4C0',
        'steel-light': '#D3C1A8',
        mist: '#6B5846',
        silver: '#2B1D12',
        cocoa: '#3D2416',
        caramel: '#C9842B',
        cream: '#FFFBF5',
        ember: {
          DEFAULT: '#9E5E14',
          soft: '#F2B35B',
          deep: '#7F4A0E',
        },
        paper: {
          DEFAULT: '#FAF4EA',
          deep: '#EFE5D5',
          card: '#FFFFFF',
        },
        ink: {
          DEFAULT: '#1A110A',
          soft: '#5B4A3A',
          faint: '#D7CAB7',
        },
        product: {
          arrows: '#2F8CFF',
          block: '#FF7A29',
          fjale: '#D08700',
          geo: '#14B8A6',
          offday: '#58D6A6',
          lab: '#F2B35B',
        },
      },
      fontFamily: {
        geist: ['Geist', 'Arial', 'sans-serif'],
        'geist-mono': ['GeistMono', 'Courier New', 'monospace'],
        display: ['Geist', 'Arial', 'sans-serif'],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xs: "calc(var(--radius) - 6px)",
      },
      boxShadow: {
        xs: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
        glass: "0 0 0 1px rgb(255 255 255 / 0.06) inset, 0 24px 60px -30px rgb(0 0 0 / 0.8)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "caret-blink": {
          "0%,70%,100%": { opacity: "1" },
          "20%,50%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "caret-blink": "caret-blink 1.25s ease-out infinite",
      },
      transitionTimingFunction: {
        'out-quad': 'cubic-bezier(0.250, 0.460, 0.450, 0.940)',
        'out-cubic': 'cubic-bezier(0.215, 0.610, 0.355, 1)',
        'out-quart': 'cubic-bezier(0.165, 0.840, 0.440, 1)',
        'out-circ': 'cubic-bezier(0.075, 0.820, 0.165, 1)',
        'in-out-quad': 'cubic-bezier(0.455, 0.030, 0.515, 0.955)',
      },
      transitionDuration: {
        '350': '350ms',
        '400': '400ms',
        '800': '800ms',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}
