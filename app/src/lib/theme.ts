import { DarkTheme, DefaultTheme, type Theme } from 'expo-router';

/**
 * TypeScript mirror of the CSS variables in `src/global.css`. Use these where a raw
 * colour value is required (gradients, status bar, navigation theme, SVG fills) and
 * Tailwind classes everywhere else — the two must stay in sync.
 *
 * Source of truth: docs/design/design-system/tokens/
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
 * docs/design/README.md; the values come from the prototype's computed styles.
 *
 * `ground` is deliberately deeper than `background` in both themes — the haze and the
 * record are read against it, not against the app surface.
 *
 * `sheen` is the band of light the record's spin carries around: the disc is otherwise
 * rotationally symmetric, so without it the rotation is invisible. It flips sense with
 * the theme — a highlight on the deep plum disc, a shadow-side on the pale lilac one,
 * where a white highlight would have nothing to lift.
 */
export const SPLASH = {
  light: {
    ground: '#FDEFE0',
    hazeOpacity: 0.5,
    record: '#E4CFF0',
    groove: 'rgba(43,15,61,0.14)',
    sheen: '#2B0F3D',
    sheenOpacity: 0.05,
  },
  dark: {
    ground: '#1F0F2A',
    hazeOpacity: 0.78,
    record: '#3A1E66',
    groove: 'rgba(11,4,16,0.32)',
    sheen: '#FFFFFF',
    sheenOpacity: 0.06,
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
