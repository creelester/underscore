import { router } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoLockup } from '@/components/logo-lockup';
import { LOCKUP_TOP, SplashBackdrop } from '@/components/splash-backdrop';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

/**
 * The unauthenticated landing screen — registered first in the signed-out group in
 * `_layout.tsx`, which is what makes `/` and a sign-out settle here.
 *
 * `Get started →` goes straight to sign-up only until the handoff's "How it works"
 * flow (screen 2) exists; that flow is what it points at in the prototype.
 *
 * The primary CTA changes variant by theme: the haze dies just above the buttons, so
 * in dark the warm gradient sits on flat plum, while in light the ground is close
 * enough to the gradient that the solid-plum tertiary is used instead.
 */
export default function SplashScreen() {
  const { colorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  // Insets are applied by hand rather than through `<SafeAreaView>`, which writes its
  // own padding and would silently drop the design's 34px bottom gap. That 34px is the
  // designer's stand-in for the home indicator, so on a device the inset replaces it.
  return (
    <View className="flex-1">
      <SplashBackdrop />

      <View
        className="px-screen-wide flex-1 justify-between"
        style={{
          paddingTop: insets.top,
          paddingBottom: Math.max(insets.bottom, 34),
        }}>
        {/* The tagline takes the lockup's colour in each theme. */}
        <View className="items-center" style={{ paddingTop: LOCKUP_TOP }}>
          <LogoLockup />
          <Text className="text-plum-600 dark:text-lilac-200 font-display-medium text-body mt-[18px] text-center">
            a soundtrack to all your stories
          </Text>
        </View>

        <View className="gap-3">
          <Button
            size="lg"
            variant={colorScheme === 'light' ? 'tertiary' : 'primary'}
            onPress={() => router.push('/sign-up')}>
            <Text>Get started →</Text>
          </Button>
          <Button size="lg" variant="secondary" onPress={() => router.push('/login')}>
            <Text>I already have an account</Text>
          </Button>
        </View>
      </View>
    </View>
  );
}
