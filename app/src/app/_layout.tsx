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
import { colorScheme, useColorScheme } from 'nativewind';
import { Platform } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AnimatedSplashOverlay } from '@/components/splash-overlay';
import { useSession } from '@/lib/auth-client';
import { queryClient } from '@/lib/query-client';
import { DEFAULT_COLOR_SCHEME, NAV_THEME } from '@/lib/theme';

SplashScreen.preventAutoHideAsync();

// Dark is the product default rather than a system preference; light is opt-in from Profile.
// NativeWind's web runtime needs `document`, which the static prerender does not have,
// so on web the default is applied in the browser only.
if (Platform.OS !== 'web' || typeof document !== 'undefined') {
  colorScheme.set(DEFAULT_COLOR_SCHEME);
}

export default function RootLayout() {
  const { colorScheme: scheme } = useColorScheme();
  const { data: session, isPending } = useSession();
  const [fontsLoaded] = useFonts({
    Quicksand_500Medium,
    Quicksand_600SemiBold,
    Quicksand_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  const theme = scheme === 'light' ? 'light' : 'dark';

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Above ThemeProvider so the cache outlives any theme remount, and above
          the fonts/session gate below so no screen can mount without it. */}
      <QueryClientProvider client={queryClient}>
        <ThemeProvider value={NAV_THEME[theme]}>
          <StatusBar style={theme === 'light' ? 'dark' : 'light'} />
          <AnimatedSplashOverlay />
          {!isPending && fontsLoaded && (
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Protected guard={!!session}>
                <Stack.Screen name="(app)" />
              </Stack.Protected>

              <Stack.Protected guard={!session}>
                <Stack.Screen name="login" />
                <Stack.Screen name="sign-up" />
              </Stack.Protected>
            </Stack>
          )}
          <PortalHost />
        </ThemeProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
