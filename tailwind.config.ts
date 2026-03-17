import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        vittare: {
          green: {
            900: '#12A357',
            800: '#0F8A4A',
            700: '#2FB06B',
            500: '#6FCB9C',
          },
          forest: {
            900: '#1F4D2E',
            800: '#193F26',
            600: '#3A6A4C',
            400: '#6D8F7A',
          },
          teal: {
            600: '#7FCFC2',
            500: '#6AB7AB',
            300: '#98D9CF',
            100: '#BFE9E2',
          },
          rose: {
            600: '#E7839D',
            500: '#D16484',
            300: '#EDADB2',
            100: '#F5C7D1',
          },
          gold: {
            600: '#F5C243',
            500: '#D9A932',
            300: '#F7CF69',
            100: '#F6E4B2',
          },
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          light: "hsl(var(--primary-light))",
          dark: "hsl(var(--primary-dark))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
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
      },
      fontSize: {
        'vittare-h1':    ['3rem',   { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'vittare-h2':    ['2.25rem',{ lineHeight: '1.15', letterSpacing: '-0.01em' }],
        'vittare-h3':    ['1.5rem', { lineHeight: '1.3' }],
        'vittare-body':  ['1rem',   { lineHeight: '1.6' }],
        'vittare-quote': ['1.125rem',{ lineHeight: '1.7' }],
        'vittare-badge': ['0.75rem',{ lineHeight: '1', letterSpacing: '0.02em' }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        'vittare-sm':   '0.5rem',
        'vittare-md':   '1rem',
        'vittare-lg':   '1.5rem',
        'vittare-full': '9999px',
      },
      boxShadow: {
        'vittare-card':  '0 2px 12px rgba(31, 77, 46, 0.08)',
        'vittare-hover': '0 6px 24px rgba(31, 77, 46, 0.14)',
      },
      keyframes: {
        "gradient-shift": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        "aurora": {
          "0%, 100%": { backgroundPosition: "0% 50%", backgroundSize: "200% 200%" },
          "50%": { backgroundPosition: "100% 50%", backgroundSize: "250% 250%" },
        },
        "ticker": {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
        },
        "glow-pulse": {
          "0%, 100%": { opacity: "0.4" },
          "50%": { opacity: "0.8" },
        },
        "shimmer": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
        "count-up": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "gradient-shift": "gradient-shift 5s ease infinite",
        "aurora": "aurora 8s ease infinite",
        "ticker": "ticker 30s linear infinite",
        "ticker-slow": "ticker 45s linear infinite",
        "float": "float 6s ease-in-out infinite",
        "glow-pulse": "glow-pulse 3s ease-in-out infinite",
        "shimmer": "shimmer 2.5s ease-in-out infinite",
        "count-up": "count-up 0.6s ease-out forwards",
        "fade-in": "fade-in 0.7s cubic-bezier(0.16,1,0.3,1) forwards",
      },
      fontFamily: {
        erstoria: ['Erstoria', 'DM Serif Display', 'Georgia', 'serif'],
        karla: ['Karla', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
