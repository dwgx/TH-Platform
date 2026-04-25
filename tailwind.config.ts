import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: { '2xl': '1400px' },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
          elev: 'hsl(var(--card-elev))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        success: 'hsl(var(--success))',
        warning: 'hsl(var(--warning))',
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar))',
          foreground: 'hsl(var(--sidebar-foreground))',
        },
        plasma: 'hsl(var(--plasma))',
        arc: 'hsl(var(--arc))',
        ember: 'hsl(var(--ember))',
        rose: 'hsl(var(--rose))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        display: ['var(--font-display)'],
        sans: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'pulse-soft': 'pulse-soft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) backwards',
        'led-flicker': 'led-flicker 4s linear infinite',
        sweep: 'sweep 2.4s cubic-bezier(0.16, 1, 0.3, 1) infinite',
        'mesh-drift': 'mesh-drift 22s ease-in-out infinite',
      },
      backgroundImage: {
        'mesh-1':
          'radial-gradient(ellipse 70% 80% at 80% 30%, hsl(var(--plasma) / 0.55), transparent 60%), radial-gradient(ellipse 60% 70% at 20% 80%, hsl(var(--arc) / 0.30), transparent 60%), linear-gradient(135deg, #1A1325 0%, #0E1230 100%)',
        'mesh-2':
          'radial-gradient(ellipse 60% 80% at 70% 30%, hsl(var(--arc) / 0.45), transparent 55%), radial-gradient(ellipse 60% 60% at 30% 80%, hsl(var(--plasma) / 0.35), transparent 55%), linear-gradient(135deg, #0F1928 0%, #0A1224 100%)',
        'mesh-3':
          'radial-gradient(ellipse 60% 80% at 80% 25%, hsl(var(--ember) / 0.40), transparent 55%), radial-gradient(ellipse 50% 70% at 20% 90%, hsl(var(--rose) / 0.25), transparent 60%), linear-gradient(135deg, #1F1813 0%, #271D14 100%)',
        'mesh-4':
          'radial-gradient(ellipse 70% 80% at 75% 30%, hsl(var(--rose) / 0.35), transparent 55%), radial-gradient(ellipse 50% 60% at 25% 85%, hsl(var(--plasma) / 0.30), transparent 60%), linear-gradient(135deg, #1E1320 0%, #14122A 100%)',
        'mesh-5':
          'radial-gradient(ellipse 60% 70% at 80% 30%, hsl(var(--success) / 0.35), transparent 55%), radial-gradient(ellipse 60% 70% at 20% 80%, hsl(var(--arc) / 0.25), transparent 60%), linear-gradient(135deg, #0E1A1F 0%, #0A1418 100%)',
        'mesh-6':
          'radial-gradient(ellipse 70% 80% at 70% 30%, hsl(var(--ember) / 0.45), transparent 55%), radial-gradient(ellipse 60% 50% at 25% 90%, hsl(var(--warning) / 0.20), transparent 60%), linear-gradient(135deg, #1F1A12 0%, #2A1F0E 100%)',
        'chrome':
          'linear-gradient(180deg, hsl(var(--foreground) / 0.04) 0%, transparent 50%, hsl(var(--foreground) / 0.02) 100%)',
        'plate':
          'linear-gradient(180deg, hsl(var(--card)) 0%, hsl(var(--card-elev)) 100%)',
        'stripe-empty':
          'repeating-linear-gradient(45deg, hsl(var(--muted)), hsl(var(--muted)) 4px, hsl(var(--card)) 4px, hsl(var(--card)) 8px)',
      },
    },
  },
  plugins: [],
};

export default config;
