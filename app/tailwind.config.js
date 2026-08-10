/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // shadcn/RNR semantic names, mapped onto Under Score tokens
        background: 'hsl(var(--background) / <alpha-value>)',
        foreground: 'hsl(var(--foreground) / <alpha-value>)',
        card: {
          DEFAULT: 'hsl(var(--card) / <alpha-value>)',
          foreground: 'hsl(var(--card-foreground) / <alpha-value>)',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover) / <alpha-value>)',
          foreground: 'hsl(var(--popover-foreground) / <alpha-value>)',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary) / <alpha-value>)',
          foreground: 'hsl(var(--primary-foreground) / <alpha-value>)',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary) / var(--secondary-alpha))',
          foreground: 'hsl(var(--secondary-foreground) / <alpha-value>)',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted) / <alpha-value>)',
          foreground: 'hsl(var(--muted-foreground) / <alpha-value>)',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent) / <alpha-value>)',
          foreground: 'hsl(var(--accent-foreground) / <alpha-value>)',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive) / <alpha-value>)',
          foreground: 'hsl(var(--destructive-foreground) / <alpha-value>)',
        },
        // border/input carry alpha in the design system, so the alpha lives in its own
        // variable rather than being flattened into an opaque triplet
        border: 'hsl(var(--border) / var(--border-alpha))',
        'border-strong': 'hsl(var(--border-strong) / var(--border-strong-alpha))',
        input: 'hsl(var(--input) / var(--input-alpha))',
        ring: 'hsl(var(--ring) / <alpha-value>)',

        // Under Score additions with no shadcn equivalent
        surface: {
          DEFAULT: 'hsl(var(--surface) / <alpha-value>)',
          2: 'hsl(var(--surface-2) / <alpha-value>)',
          raised: 'hsl(var(--surface-raised) / <alpha-value>)',
        },
        ink: {
          DEFAULT: 'hsl(var(--ink) / <alpha-value>)',
          muted: 'hsl(var(--ink-muted) / <alpha-value>)',
          faint: 'hsl(var(--ink-faint) / <alpha-value>)',
        },

        // base palette
        plum: {
          950: 'hsl(var(--plum-950) / <alpha-value>)',
          900: 'hsl(var(--plum-900) / <alpha-value>)',
          800: 'hsl(var(--plum-800) / <alpha-value>)',
          700: 'hsl(var(--plum-700) / <alpha-value>)',
          600: 'hsl(var(--plum-600) / <alpha-value>)',
        },
        lilac: {
          300: 'hsl(var(--lilac-300) / <alpha-value>)',
          200: 'hsl(var(--lilac-200) / <alpha-value>)',
        },
        orchid: { 500: 'hsl(var(--orchid-500) / <alpha-value>)' },
        magenta: { 600: 'hsl(var(--magenta-600) / <alpha-value>)' },
        pink: { 500: 'hsl(var(--pink-500) / <alpha-value>)' },
        rose: { 500: 'hsl(var(--rose-500) / <alpha-value>)' },
        coral: { 500: 'hsl(var(--coral-500) / <alpha-value>)' },
        orange: {
          500: 'hsl(var(--orange-500) / <alpha-value>)',
          400: 'hsl(var(--orange-400) / <alpha-value>)',
        },
        amber: { 400: 'hsl(var(--amber-400) / <alpha-value>)' },
        peel: { 400: 'hsl(var(--peel-400) / <alpha-value>)' },
        yellow: { 300: 'hsl(var(--yellow-300) / <alpha-value>)' },
        seafoam: { 300: 'hsl(var(--seafoam-300) / <alpha-value>)' },
        indigo: { 700: 'hsl(var(--indigo-700) / <alpha-value>)' },
      },
      borderRadius: {
        sm: '10px',
        card: '20px',
        lg: '28px',
        pill: '999px',
      },
      fontFamily: {
        display: ['Quicksand_600SemiBold'],
        'display-medium': ['Quicksand_500Medium'],
        'display-bold': ['Quicksand_700Bold'],
        body: ['Inter_400Regular'],
        'body-medium': ['Inter_500Medium'],
        'body-semibold': ['Inter_600SemiBold'],
        // handoff asks for Andale/Space Mono; until a mono face is bundled this falls
        // back to the platform monospace (Menlo on iOS, monospace on Android)
        mono: ['Menlo', 'monospace'],
      },
      fontSize: {
        // handoff type scale — [size, lineHeight]
        'display-xl': ['56px', '59px'],
        'display-lg': ['40px', '43px'],
        'display-md': ['28px', '32px'],
        title: ['22px', '28px'],
        'body-lg': ['18px', '27px'],
        body: ['16px', '25px'],
        'body-sm': ['14px', '21px'],
        eyebrow: ['12px', '17px'],
      },
      letterSpacing: {
        eyebrow: '0.14em',
        label: '0.05em',
        tight: '-0.01em',
        tighter: '-0.02em',
      },
      spacing: {
        // screen horizontal padding and bottom safe padding from the handoff
        screen: '22px',
        'screen-wide': '26px',
        'safe-bottom': '34px',
      },
      transitionTimingFunction: {
        standard: 'cubic-bezier(.32,.72,0,1)',
      },
      transitionDuration: {
        fast: '120ms',
        med: '220ms',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
