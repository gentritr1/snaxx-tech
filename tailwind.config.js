/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  future: {
    hoverOnlyWhenSupported: true,
  },
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
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
        exvia: {
          black: '#131313',
          white: '#FFFFFF',
          'base-black': '#1D1D1D',
          subtle: '#EAEAEA',
          border: '#EFEFF2',
          blue: '#0082F3',
          focus: '#4D65FF',
        },
      },
      fontFamily: {
        geist: ['Geist', 'Arial', 'sans-serif'],
        'geist-mono': ['GeistMono', 'Courier New', 'monospace'],
      },
      fontSize: {
        'h1': ['clamp(3rem, 21vw, 21vw)', { lineHeight: '1', letterSpacing: '-0.04em' }],
        'h2': ['4rem', { lineHeight: '1', letterSpacing: '-0.04em' }],
        'h3': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.04em' }],
        'h4': ['2.5rem', { lineHeight: '1.1' }],
        'h5': ['1.5rem', { lineHeight: '1.2' }],
        'h6': ['1.25rem', { lineHeight: '1.3' }],
        'small': ['0.875rem', { lineHeight: '1.5' }],
        'xs': ['0.75rem', { lineHeight: '1.5' }],
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
