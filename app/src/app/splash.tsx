import { router, useFocusEffect } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useCallback, useRef } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoLockup } from '@/components/logo-lockup';
import { LOCKUP_TOP, SplashBackdrop } from '@/components/splash-backdrop';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

/**
 * The record's growth to full-viewport cover, and the column's exit ahead of it.
 *
 * The zoom is the one transition that does not take the handoff's `--ease-standard`
 * (`MOTION.easeStandard`): that curve spends most of its travel in its first quarter,
 * which over a ~3.5× growth arrives as a cut rather than a zoom. An ease-in-out is slow
 * enough at both ends for the eye to follow the disc all the way out.
 */
const ZOOM_MS = 520;
const COLUMN_FADE_MS = 160;

type Destination = '/sign-up' | '/login';

/** Wrapped rather than passed as `router.push`, which `scheduleOnRN` would call bare. */
const navigate = (href: Destination) => router.push(href);

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
  const reduceMotion = useReducedMotion();

  const zoom = useSharedValue(0);
  const column = useSharedValue(1);
  const leaving = useRef(false);

  // `get`/`set` rather than `.value` throughout: the React Compiler treats a value
  // passed to a hook as immutable, and the eslint rule that enforces that is on.
  const columnStyle = useAnimatedStyle(() => ({ opacity: column.get() }));

  // The screen stays mounted under whatever it pushed, holding the frame it left on.
  // Resetting on focus rather than after the push is what makes a swipe back land on
  // the ordinary splash instead of a plum field — including a back gesture abandoned
  // halfway, which never fires a completion of its own.
  useFocusEffect(
    useCallback(() => {
      leaving.current = false;
      zoom.set(0);
      column.set(1);
    }, [zoom, column])
  );

  /**
   * Falls into the record: the column clears, the disc grows until it is the whole
   * viewport, and the pushed screen fades in over it (`animation: 'fade'` on both
   * targets in `_layout.tsx`). The push waits for the zoom so the form does not
   * arrive over a half-grown disc.
   */
  const leave = (href: Destination) => {
    if (leaving.current) return;
    leaving.current = true;

    if (reduceMotion) {
      navigate(href);
      return;
    }

    column.set(withTiming(0, { duration: COLUMN_FADE_MS }));
    zoom.set(
      withTiming(
        1,
        { duration: ZOOM_MS, easing: Easing.inOut(Easing.quad) },
        (finished) => {
          'worklet';
          if (finished) scheduleOnRN(navigate, href);
        }
      )
    );
  };

  // Insets are applied by hand rather than through `<SafeAreaView>`, which writes its
  // own padding and would silently drop the design's 34px bottom gap. That 34px is the
  // designer's stand-in for the home indicator, so on a device the inset replaces it.
  return (
    <View className="flex-1">
      <SplashBackdrop zoom={zoom} />

      <Animated.View
        className="px-screen-wide flex-1 justify-between"
        style={[
          {
            paddingTop: insets.top,
            paddingBottom: Math.max(insets.bottom, 34),
          },
          columnStyle,
        ]}>
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
            onPress={() => leave('/sign-up')}>
            <Text>Get started →</Text>
          </Button>
          <Button size="lg" variant="secondary" onPress={() => leave('/login')}>
            <Text>I already have an account</Text>
          </Button>
        </View>
      </Animated.View>
    </View>
  );
}
