import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { LogoLockup } from '@/components/logo-lockup';
import { LOCKUP_TOP, SplashBackdrop } from '@/components/splash-backdrop';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/use-theme';

// `PUSH_AT_MS` lands short of `ZOOM_MS` so the pushed screen fades in while the disc is
// still growing. The zoom skips the design's `--ease-standard`, which over a ~3.5×
// growth arrives as a cut rather than a zoom.
const ZOOM_MS = 460;
const COLUMN_FADE_MS = 110;
const PUSH_AT_MS = 260;

/**
 * The unauthenticated landing screen — registered first in the signed-out group in
 * `_layout.tsx`, which is what makes `/` and a sign-out settle here.
 */
export default function SplashScreen() {
  const { isLight } = useTheme();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const zoom = useSharedValue(0);
  const column = useSharedValue(1);
  const leaving = useRef(false);

  // A ref so the focus cleanup can cancel the push if the screen goes away first.
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // `get`/`set` rather than `.value`: the React Compiler treats a value passed to a hook
  // as immutable, and the eslint rule enforcing that is on.
  // `flex` rides inside the worklet: Reanimated drops static layout passed alongside an
  // animated style, so it cannot sit in the `style` array next to it.
  const columnStyle = useAnimatedStyle(() => ({ flex: 1, opacity: column.get() }));

  // The screen stays mounted under what it pushed. Resetting on focus rather than after
  // the push is what makes a swipe back — including one abandoned halfway — land on the
  // ordinary splash instead of a plum field.
  useFocusEffect(
    useCallback(() => {
      leaving.current = false;
      zoom.set(0);
      column.set(1);

      // A screen torn down mid-transition would otherwise navigate from under whatever
      // replaced it.
      return () => {
        if (pushTimer.current) clearTimeout(pushTimer.current);
      };
    }, [zoom, column])
  );

  /**
   * Falls into the record: the column clears, the disc grows to cover the viewport, and
   * the pushed screen fades in over it (`animation: 'fade'` on both targets in
   * `_layout.tsx`).
   */
  const leave = (href: Href) => {
    if (leaving.current) return;
    leaving.current = true;

    if (reduceMotion) {
      router.push(href);
      return;
    }

    column.set(withTiming(0, { duration: COLUMN_FADE_MS }));
    zoom.set(withTiming(1, { duration: ZOOM_MS, easing: Easing.inOut(Easing.quad) }));

    pushTimer.current = setTimeout(() => router.push(href), PUSH_AT_MS);
  };

  // The animated node carries no `className`: NativeWind's cssInterop and Reanimated both
  // rewrite `style`, and the class styles lose. Layout sits on the plain child. Insets are
  // applied by hand because `<SafeAreaView>` would drop the design's 34px bottom gap.
  return (
    <View className="flex-1">
      <SplashBackdrop zoom={zoom} />

      <Animated.View style={columnStyle}>
        <View
          className="px-screen-wide flex-1 justify-between"
          style={{
            paddingTop: insets.top,
            paddingBottom: Math.max(insets.bottom, 34),
          }}>
          <View className="items-center" style={styles.lockup}>
            <LogoLockup />
            <Text className="text-plum-600 dark:text-lilac-200 font-display-medium text-body mt-[18px] text-center">
              a soundtrack to all your stories
            </Text>
          </View>

          <View className="gap-3">
            <Button
              size="lg"
              variant={isLight ? 'tertiary' : 'primary'}
              onPress={() => leave('/how-it-works')}>
              <Text>Get started →</Text>
            </Button>
            <Button size="lg" variant="secondary" onPress={() => leave('/login')}>
              <Text>I already have an account</Text>
            </Button>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: { paddingTop: LOCKUP_TOP },
});
