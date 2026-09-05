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
 * Mirrors the device's colour scheme onto NativeWind, on web only — the two runtimes
 * disagree. Native already follows the device, and `colorScheme.set()` there delegates
 * to `Appearance.setColorScheme()`, which would pin the app to whatever the device was
 * at mount. Web seeds to `'light'` from the absent `dark` class instead of falling back
 * to the system, so it needs the scheme resolved by hand.
 *
 * `darkMode` stays `'class'`, not `'media'`, so a Profile theme override can call
 * `colorScheme.set()` later — under `'media'` that throws.
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
      {/* Above ThemeProvider so the cache outlives a theme remount, and above the gate
          below so no screen can mount without it. */}
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={NAV_THEME[scheme]}>
          <StatusBar style={isLight ? 'dark' : 'light'} />
          <AnimatedSplashOverlay />
          {!isPending && fontsLoaded && (
            <Stack screenOptions={{ headerShown: false }}>
              {/* One entry guards every signed-in screen: `(app)` is the auth boundary as
                  a directory, so a new screen cannot ship reachable by forgetting to name
                  it here. The name is Expo Router's own, hence the stuttering path. */}
              <Stack.Protected guard={!!session}>
                <Stack.Screen name="(app)" />
              </Stack.Protected>

              {/* `splash` is first, making it this group's fallback: `/` and a sign-out
                  both settle there. Reordering silently moves where signed-out visitors
                  land. Both forms fade rather than slide, because the splash grows its
                  record to fill the viewport first and a slide would cross that frame
                  rather than come out of it. */}
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
