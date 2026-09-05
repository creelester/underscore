import { useEffect, type ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { MOTION } from '@/lib/theme';

/**
 * The design's `us-fade`, the enter every non-splash screen uses. Driven from a shared
 * value rather than Reanimated's `entering` prop, which is a mount animation: replaying
 * it means remounting, and the caller wraps the tab slot, where that would throw away
 * every tab screen's state. `replayOn` runs it again without touching the tree below.
 */

/** The 8px the content travels up over, per the design. */
const TRAVEL = 8;

export function ScreenFade({
  children,
  replayOn,
  style,
}: {
  children: ReactNode;
  /** Any value that, when it changes, should play the fade again. */
  replayOn?: unknown;
  style?: StyleProp<ViewStyle>;
}) {
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  // `get`/`set` rather than `.value`: the React Compiler treats a value passed to a
  // hook as immutable, and the eslint rule enforcing that is on.
  useEffect(() => {
    progress.set(0);
    progress.set(
      withTiming(1, {
        duration: reduceMotion ? 0 : MOTION.durMed,
        easing: Easing.bezier(...MOTION.easeStandard),
      })
    );
  }, [replayOn, progress, reduceMotion]);

  const fade = useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ translateY: (1 - progress.get()) * TRAVEL }],
  }));

  return <Animated.View style={[style, fade]}>{children}</Animated.View>;
}
