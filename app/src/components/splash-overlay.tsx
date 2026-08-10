import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { GRAD_WARM } from '@/lib/gradients';
import { RADIUS, THEME } from '@/lib/theme';

const DURATION = 600;

/**
 * Bridges the native splash to the first rendered screen: draws the same artwork over
 * the whole viewport, hides the native splash underneath it, then fades itself out.
 *
 * The mark is a placeholder — the real lockup needs the JayaGiri display face, which
 * is not licensed yet.
 */
export function AnimatedSplashOverlay() {
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

  const mark = <LinearGradient {...GRAD_WARM} style={styles.mark} />;

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}>
      {mark}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}>
      {mark}
    </View>
  );
}

const styles = StyleSheet.create({
  mark: {
    width: 96,
    height: 96,
    borderRadius: RADIUS.card,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: THEME.dark.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
