import { useColorScheme } from 'nativewind';

import { SHADOWS, THEME } from '@/lib/theme';

/** The two themes every surface has to be built for — the app follows the device. */
export type ColorScheme = keyof typeof THEME;

/**
 * Resolves NativeWind's colour scheme to the token bundles in `theme.ts`.
 *
 * NativeWind types `colorScheme` as `'light' | 'dark' | undefined`, so every call site
 * otherwise repeats the same `=== 'light' ? 'light' : 'dark'` narrowing before it can
 * index a token record. `scheme` is that narrowing, done once.
 *
 * A hook rather than a provider: NativeWind already owns the scheme and already
 * re-renders its subscribers, so a provider would be a second source of truth to keep in
 * sync with it — and the app already has to reconcile the two runtimes by hand
 * (`useDeviceColorScheme` in app/_layout.tsx). It would also not remove a single call,
 * because these values are read inside `style` props on leaf components, which would
 * each still need a `useContext`.
 *
 * Screen-scoped token records — `SPLASH` — stay out of this: index them with `scheme`
 * at the one place that uses them rather than paying for them everywhere.
 */
export function useTheme() {
  const { colorScheme } = useColorScheme();
  // Annotated, not inferred: as a plain object property the literals would widen to
  // `string`, which then cannot index the token records the callers reach for.
  const scheme: ColorScheme = colorScheme === 'light' ? 'light' : 'dark';

  return {
    scheme,
    isLight: scheme === 'light',
    theme: THEME[scheme],
    shadows: SHADOWS[scheme],
  };
}
