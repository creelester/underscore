import { useEffect, type ReactNode } from 'react';
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
}: {
  children: ReactNode;
  /** Any value that, when it changes, should play the fade again. */
  replayOn?: unknown;
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

  // `flex` belongs in the animated style, not a static one alongside it. Reanimated 4
  // drops the static half of `style={[layout, animated]}` on this component, which
  // collapsed the tab slot to zero height and rendered every tab screen invisible.
  const fade = useAnimatedStyle(() => ({
    flex: 1,
    opacity: progress.get(),
    transform: [{ translateY: (1 - progress.get()) * TRAVEL }],
  }));

  return <Animated.View style={fade}>{children}</Animated.View>;
}
