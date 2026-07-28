import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: { "2xl": "1400px" },
    },
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--brand-primary)',
          dark: 'var(--brand-primary-dark)',
          light: 'var(--brand-primary-light)',
          hover: 'var(--brand-primary-dark)',
        },
        accent: {
          DEFAULT: 'var(--brand-accent)',
          light: 'var(--brand-accent-light)',
          dark: 'var(--brand-accent-dark)',
          muted: 'var(--brand-accent-muted)',
        },
        sidebar: {
          bg: 'var(--bg-sidebar-solid)',
          text: 'var(--text-sidebar)',
          'text-active': 'var(--text-sidebar-active)',
          icon: 'var(--text-sidebar)',
          'icon-active': 'var(--brand-accent)',
          'hover-bg': 'var(--bg-sidebar-hover)',
          'active-bg': 'var(--bg-sidebar-active)',
          'active-border': 'var(--brand-accent)',
        },
        btn: {
          primary: {
            text: 'var(--btn-primary-text)',
          },
          accent: {
            text: 'var(--btn-accent-text)',
          }
        },
        card: {
          DEFAULT: 'var(--bg-card)',
          border: 'var(--border-default)',
        },
        table: {
          header: 'var(--bg-table-header)',
          hover: 'var(--bg-table-row-hover)',
          border: 'var(--border-default)',
        },
        text: {
          primary: 'var(--text-body)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        success: {
          DEFAULT: 'var(--status-success)',
          bg: 'var(--status-success-bg)',
        },
        warning: {
          DEFAULT: 'var(--status-warning)',
          bg: 'var(--status-warning-bg)',
        },
        danger: {
          DEFAULT: 'var(--status-error)',
          bg: 'var(--status-error-bg)',
        },
        info: {
          DEFAULT: 'var(--status-info)',
          bg: 'var(--status-info-bg)',
        },
        badge: {
          draft: 'var(--badge-draft-bg)',
          sent: 'var(--badge-sent-bg)',
          accepted: 'var(--badge-accepted-bg)',
          rejected: 'var(--badge-rejected-bg)',
          active: 'var(--badge-active-bg)',
          closed: 'var(--badge-closed-bg)',
          pending: 'var(--badge-pending-bg)',
          paid: 'var(--badge-paid-bg)',
          partial: 'var(--badge-partial-bg)',
        },
        pipeline: {
          raw: 'var(--stage-raw-bg)',
          design: 'var(--stage-design-bg)',
          printing: 'var(--stage-production-bg)',
          post: 'var(--stage-review-bg)',
          payment: 'var(--stage-payment-bg)',
        },
        background: 'var(--bg-app)',
        foreground: 'var(--text-body)',
        border: 'var(--border-default)',
        input: 'var(--bg-input)',
        ring: 'var(--border-focus)',
        // ── Brand palette (legacy class support) ────────────────────────
        'brand-forest':  'var(--text-heading)',
        'brand-sage':    'var(--brand-accent)',
        'brand-cream':   'var(--bg-card-hover)',
        'brand-border':  'var(--border-default)',
        'brand-muted':   'var(--text-muted)',
        'brand-black':   'var(--text-body)',
        'brand-danger':  'var(--status-error)',
        // ── Semantic aliases for dashboard cards ─────────────────────────
        navy: 'var(--text-heading)',
        gold: 'var(--brand-primary)',
        // ── Override base tailwind colors to force strict 6-color system ──
        green: {
          50: 'var(--status-success-bg)',
          100: 'var(--status-success-bg)',
          200: 'var(--status-success-bg)',
          400: 'var(--status-success)',
          500: 'var(--status-success)',
          600: 'var(--status-success)',
          700: 'var(--status-success)',
        },
        red: {
          50: 'var(--status-error-bg)',
          100: 'var(--status-error-bg)',
          200: 'var(--status-error-bg)',
          400: 'var(--status-error)',
          500: 'var(--status-error)',
          600: 'var(--status-error)',
          700: 'var(--status-error)',
        },
        amber: {
          50: 'var(--status-warning-bg)',
          100: 'var(--status-warning-bg)',
          200: 'var(--status-warning-bg)',
          400: 'var(--status-warning)',
          500: 'var(--status-warning)',
          600: 'var(--status-warning)',
          700: 'var(--status-warning)',
        },
        blue: {
          50: 'var(--status-info-bg)',
          100: 'var(--status-info-bg)',
          200: 'var(--status-info-bg)',
          400: 'var(--status-info)',
          500: 'var(--status-info)',
          600: 'var(--status-info)',
          700: 'var(--status-info)',
        },
        purple: {
          50: 'var(--brand-accent-muted)',
          100: 'var(--brand-accent-muted)',
          200: 'var(--brand-accent-muted)',
          400: 'var(--brand-accent)',
          500: 'var(--brand-accent)',
          600: 'var(--brand-accent)',
          700: 'var(--brand-accent)',
        },
      },
      backgroundImage: {
        'sidebar-gradient': 'var(--bg-sidebar)',
        'btn-primary': 'var(--btn-primary-bg)',
        'btn-primary-hover': 'var(--btn-primary-hover)',
        'btn-accent': 'var(--btn-accent-bg)',
        'btn-accent-hover': 'var(--btn-accent-hover)',
        'btn-danger': 'var(--btn-danger-bg)',
      },
      boxShadow: {
        card: 'var(--shadow-card)',
      },
      fontFamily: {
        sans: ["var(--font-body)", "sans-serif"],
        display: ["var(--font-display)", "sans-serif"],
        syne: ["var(--font-display)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
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
        "slide-in-left": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "slide-in-left": "slide-in-left 0.25s ease-out",
        "fade-in": "fade-in 0.2s ease-out",
      },
    },
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
};
export default config;
