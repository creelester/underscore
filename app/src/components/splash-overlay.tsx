import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { LogoLockup } from '@/components/logo-lockup';
import { LOCKUP_TOP, SplashBackdrop } from '@/components/splash-backdrop';

const DURATION = 600;

/**
 * Bridges the native splash to the first rendered screen: the same artwork over the
 * whole viewport, hiding the native splash beneath it, then fading out. Shares its
 * pieces with `app/splash.tsx` and its colours with `app.json`, so all three hand off
 * without a seam.
 */
export function AnimatedSplashOverlay() {
  const insets = useSafeAreaInsets();
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      transform: [{ scale: 1 }],
      opacity: 1,
    },
    20: {
      opacity: 1,
    },
    70: {
      opacity: 0,
      easing: Easing.elastic(0.7),
    },
    100: {
      opacity: 0,
      transform: [{ scale: 1 }],
      easing: Easing.elastic(0.7),
    },
  });

  // Positioned as `app/splash.tsx` puts it, not centred, so the fade reveals an
  // identical frame rather than letting the mark settle into place.
  const artwork = (
    <>
      <SplashBackdrop />
      <View style={[styles.lockup, { paddingTop: insets.top + LOCKUP_TOP }]}>
        <LogoLockup />
      </View>
    </>
  );

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}>
      {artwork}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}>
      {artwork}
    </View>
  );
}

const styles = StyleSheet.create({
  lockup: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 1000,
  },
});
