import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';

/**
 * TypeScript mirror of the CSS variables in `src/global.css`. Use these where a raw
 * colour value is required (gradients, status bar, navigation theme, SVG fills) and
 * Tailwind classes everywhere else — the two must stay in sync.
 *
 * Source of truth: the design handoff's design-system/tokens/
 */
export const THEME = {
  light: {
    background: '#FFF8EF',
    surface: '#FFFFFF',
    surface2: '#FDEFE0',
    surfaceRaised: '#FFFFFF',
    border: 'rgba(43,15,61,0.12)',
    borderStrong: 'rgba(43,15,61,0.22)',
    ink: '#2B0F3D',
    inkMuted: '#6B5581',
    inkFaint: '#9C89AC',
    primary: '#FF0084',
    primaryInk: '#FFFFFF',
    accent: '#D97A00',
    btnSecondaryFill: 'rgba(43,15,61,0.10)',
    btnTertiaryFill: '#2B0F3D',
    btnTertiaryInk: '#FFF8EF',
  },
  dark: {
    background: '#0B0410',
    surface: '#150A1E',
    surface2: '#1F0F2A',
    surfaceRaised: '#2B1638',
    border: 'rgba(255,255,255,0.10)',
    borderStrong: 'rgba(255,255,255,0.18)',
    ink: '#F8F1FB',
    inkMuted: '#BCA9CC',
    inkFaint: '#8A7699',
    primary: '#FF0084',
    primaryInk: '#180310',
    accent: '#FFA200',
    btnSecondaryFill: 'rgba(255,255,255,0.12)',
    btnTertiaryFill: '#2B0F3D',
    btnTertiaryInk: '#FFF8EF',
  },
} as const;

/** Base palette — theme-independent. */
export const PALETTE = {
  plum950: '#0B0410',
  plum900: '#150A1E',
  plum800: '#1F0F2A',
  plum700: '#2B1638',
  plum600: '#3A1E66',
  lilac300: '#CDA8E2',
  lilac200: '#E4CFF0',
  orchid500: '#D653A9',
  magenta600: '#C0007A',
  pink500: '#FF0084',
  rose500: '#EA0C5F',
  coral500: '#EA6E4B',
  orange500: '#FF5341',
  orange400: '#FF8820',
  amber400: '#FFA200',
  peel400: '#F6BA00',
  yellow300: '#FAF26F',
  seafoam300: '#ABE3D2',
  indigo700: '#002296',
} as const;

export const RADIUS = { sm: 10, card: 20, lg: 28, pill: 999 } as const;

/** Motion tokens. `EASE_STANDARD` is the handoff's cubic-bezier(.32,.72,0,1). */
export const MOTION = {
  easeStandard: [0.32, 0.72, 0, 1] as const,
  durFast: 120,
  durMed: 220,
} as const;

/**
 * Shadows are RN `boxShadow` strings so the handoff's negative-spread values survive
 * intact — RN's legacy shadowOffset/shadowRadius props cannot express them.
 */
export const SHADOWS = {
  light: {
    glow: '0 16px 32px -14px rgba(255,0,132,0.30)',
    soft: '0 10px 24px -12px rgba(43,15,61,0.14)',
    tertiary: '0 18px 34px -16px rgba(43,15,61,0.55)',
  },
  dark: {
    glow: '0 20px 40px -14px rgba(255,0,132,0.45)',
    soft: '0 12px 30px -12px rgba(0,0,0,0.55)',
    tertiary: '0 18px 34px -16px rgba(43,15,61,0.55)',
  },
} as const;

/**
 * The splash is the one surface that does not sit on `THEME.background`: it stacks a
 * flat ground, a faded hero haze and a half-visible record. See the Splash section of
 * the design handoff README; the values come from the prototype's computed styles.
 *
 * `ground` is deliberately deeper than `background` in both themes — the haze and the
 * record are read against it, not against the app surface.
 */
export const SPLASH = {
  light: {
    ground: '#FDEFE0',
    hazeOpacity: 0.5,
    record: '#E4CFF0',
    groove: 'rgba(43,15,61,0.14)',
  },
  dark: {
    ground: '#1F0F2A',
    hazeOpacity: 0.78,
    record: '#3A1E66',
    groove: 'rgba(11,4,16,0.32)',
  },
} as const;

/**
 * The blotchy field every screen outside the splash sits on, from "App background (all
 * non-splash screens)" in the design handoff README. `AppBackdrop` draws it.
 *
 * One entry per CSS layer, in the order the design lists them — `radial-gradient(rx ry at
 * x y, color alpha 0%, transparent fade)` — with the lengths kept as fractions of the
 * viewport so they scale with the device the way the percentages do.
 */
export const APP_BACKGROUND = {
  light: {
    ground: '#FFF8EF',
    blotches: [
      { color: PALETTE.peel400, alpha: 0.28, x: 0.06, y: 0.02, rx: 0.66, ry: 0.32, fade: 0.7 },
      { color: PALETTE.pink500, alpha: 0.2, x: 0.98, y: 0.16, rx: 0.6, ry: 0.28, fade: 0.72 },
      { color: PALETTE.orange500, alpha: 0.16, x: 0.14, y: 0.6, rx: 0.76, ry: 0.36, fade: 0.74 },
      { color: PALETTE.orchid500, alpha: 0.22, x: 0.94, y: 0.86, rx: 0.68, ry: 0.32, fade: 0.76 },
    ],
  },
  dark: {
    ground: '#150A1E',
    blotches: [
      { color: PALETTE.plum600, alpha: 0.85, x: 0.06, y: 0.02, rx: 0.64, ry: 0.3, fade: 0.7 },
      { color: PALETTE.magenta600, alpha: 0.24, x: 0.98, y: 0.18, rx: 0.58, ry: 0.26, fade: 0.72 },
      // rgb(90,42,140) — a lift between plum-600 and orchid that the palette has no token
      // for; the design uses it only here.
      { color: '#5A2A8C', alpha: 0.4, x: 0.14, y: 0.62, rx: 0.74, ry: 0.34, fade: 0.74 },
      { color: PALETTE.plum600, alpha: 0.55, x: 0.92, y: 0.88, rx: 0.66, ry: 0.3, fade: 0.76 },
    ],
  },
} as const;

export const NAV_THEME: Record<'light' | 'dark', Theme> = {
  light: {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: THEME.light.background,
      card: THEME.light.surface,
      text: THEME.light.ink,
      border: THEME.light.border,
      primary: THEME.light.primary,
      notification: THEME.light.primary,
    },
  },
  dark: {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: THEME.dark.background,
      card: THEME.dark.surface,
      text: THEME.dark.ink,
      border: THEME.dark.border,
      primary: THEME.dark.primary,
      notification: THEME.dark.primary,
    },
  },
};
