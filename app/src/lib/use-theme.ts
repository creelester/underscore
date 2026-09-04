import { useColorScheme } from 'nativewind';

import { SHADOWS, THEME } from '@/lib/theme';

/** The two themes every surface has to be built for — the app follows the device. */
export type ColorScheme = keyof typeof THEME;

/**
 * Resolves NativeWind's colour scheme to the token bundles in `theme.ts`. `scheme` is
 * the `'light' | 'dark' | undefined` narrowing every call site would otherwise repeat
 * before it can index a token record.
 *
 * A hook, not a provider: NativeWind already owns the scheme and re-renders its
 * subscribers, so a provider would be a second source of truth — and would remove no
 * call, since these are read in `style` props on leaf components.
 *
 * Screen-scoped records like `SPLASH` stay out: index them at their one call site.
 */
export function useTheme() {
  const { colorScheme } = useColorScheme();
  // Annotated, not inferred: the literals would widen to `string` and stop indexing the
  // token records.
  const scheme: ColorScheme = colorScheme === 'light' ? 'light' : 'dark';

  return {
    scheme,
    isLight: scheme === 'light',
    theme: THEME[scheme],
    shadows: SHADOWS[scheme],
  };
}
