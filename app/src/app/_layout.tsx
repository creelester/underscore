import '@/global.css';

import { PortalHost } from '@rn-primitives/portal';
import { QueryClientProvider } from '@tanstack/react-query';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  Quicksand_500Medium,
  Quicksand_600SemiBold,
  Quicksand_700Bold,
} from '@expo-google-fonts/quicksand';
import { Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { colorScheme } from 'nativewind';
import { useEffect } from 'react';
import { Appearance, Platform, StyleSheet, type ColorSchemeName } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/splash-overlay';
import { useSession } from '@/lib/auth-client';
import { queryClient } from '@/lib/query-client';
import { NAV_THEME } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';

SplashScreen.preventAutoHideAsync();

/**
 * Mirrors the device's colour scheme onto NativeWind — on web only.
 *
 * NativeWind's two runtimes disagree, so this has to be one-sided:
 *
 * - **Native** already follows the device. `colorScheme.get()` falls back to a system
 *   observable driven by its own Appearance and AppState listeners. Calling
 *   `colorScheme.set()` here would be harmful, not redundant: on native it delegates to
 *   `Appearance.setColorScheme()`, which *overrides* the app's appearance, pinning it to
 *   whatever the device happened to be at mount and deafening it to later changes.
 * - **Web** does not. Its observable seeds to `'light'` from the absent `dark` class
 *   rather than falling back to the system, and only the literal value `'dark'` ever adds
 *   that class — `'system'` removes it, which would leave `dark:` variants inert while JS
 *   read dark. So web needs the scheme resolved and applied by hand.
 *
 * `darkMode` stays `'class'` rather than `'media'` so a Profile theme override can call
 * `colorScheme.set()` later — under `'media'` that call throws.
 */
function useDeviceColorScheme() {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const apply = (scheme: ColorSchemeName | null | undefined) =>
      colorScheme.set(scheme === 'dark' ? 'dark' : 'light');

    apply(Appearance.getColorScheme());
    const subscription = Appearance.addChangeListener((preferences) =>
      apply(preferences.colorScheme)
    );
    return () => subscription.remove();
  }, []);
}

export default function RootLayout() {
  useDeviceColorScheme();

  const { scheme, isLight } = useTheme();
  const { data: session, isPending } = useSession();
  const [fontsLoaded] = useFonts({
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  return (
    <GestureHandlerRootView style={styles.root}>
      {/* Above ThemeProvider so the cache outlives any theme remount, and above
          the fonts/session gate below so no screen can mount without it. */}
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={NAV_THEME[scheme]}>
          <StatusBar style={isLight ? 'dark' : 'light'} />
          <AnimatedSplashOverlay />
          {!isPending && fontsLoaded && (
            <Stack screenOptions={{ headerShown: false }}>
              {/* One entry guards every signed-in screen, because `(app)` is the auth
                  boundary as a directory rather than as a list: anything under it is
                  protected by existing, so a new screen cannot ship reachable by
                  forgetting to name it here. `(app)` is Expo Router's own name for this
                  group — see its authentication guide — which is why the path stutters:
                  `app/` the workspace, `src/app/` the routes directory, `(app)/` the
                  guarded group. Three different meanings, none of them free to rename. */}
              <Stack.Protected guard={!!session}>
                <Stack.Screen name="(app)" />
              </Stack.Protected>

              {/* `splash` is first, which makes it this group's fallback: `/` and a
                  sign-out both settle there, and the forms are reached from its CTAs.
                  Reordering these silently changes where signed-out visitors land.

                  Both forms fade rather than slide: the splash grows its record to fill
                  the viewport before it pushes (app/splash.tsx), and a slide would carry
                  the form in across that frame instead of out of it. */}
              <Stack.Protected guard={!session}>
                <Stack.Screen name="splash" />
                <Stack.Screen name="how-it-works" options={{ animation: 'fade' }} />
                <Stack.Screen name="connect-music" options={{ animation: 'fade' }} />
                <Stack.Screen name="login" options={{ animation: 'fade' }} />
                <Stack.Screen name="sign-up" options={{ animation: 'fade' }} />
              </Stack.Protected>
            </Stack>
          )}
          <PortalHost />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
