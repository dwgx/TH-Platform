import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Surfaces
        rail: 'hsl(var(--bg-rail))',
        sidebar: 'hsl(var(--bg-sidebar))',
        content: 'hsl(var(--bg-content))',
        members: 'hsl(var(--bg-members))',
        floating: 'hsl(var(--bg-floating))',
        hover: 'hsl(var(--bg-hover))',
        active: 'hsl(var(--bg-active))',
        input: 'hsl(var(--bg-input))',

        // Text
        header: 'hsl(var(--fg-header))',
        body: 'hsl(var(--fg-normal))',
        muted: 'hsl(var(--fg-muted))',
        link: 'hsl(var(--fg-link))',

        // Brand + accents
        brand: {
          DEFAULT: 'hsl(var(--brand))',
          hover: 'hsl(var(--brand-hover))',
          foreground: 'hsl(var(--brand-foreground))',
        },
        success: 'hsl(var(--success))',
        danger: 'hsl(var(--danger))',
        warning: 'hsl(var(--warning))',

        // Borders
        border: 'hsl(var(--border))',
        separator: 'hsl(var(--separator))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
      },
      animation: {
        'pulse-soft': 'pulse-soft 1.5s ease-in-out infinite',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
