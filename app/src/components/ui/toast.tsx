import { useEffect } from 'react';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/ui/text';
import { MOTION } from '@/lib/theme';

/**
 * The design's transient confirmation, pinned above the bottom edge. It says what just
 * happened, so it is announced rather than left for a reader to notice.
 */

const TRAVEL = 12;
const RISE_MS = 200;

export function Toast({ message }: { message?: string }) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.set(
      withTiming(message ? 1 : 0, {
        duration: reduceMotion ? 0 : RISE_MS,
        easing: Easing.bezier(...MOTION.easeStandard),
      })
    );
  }, [message, progress, reduceMotion]);

  const rise = useAnimatedStyle(() => ({
    position: 'absolute',
    left: 22,
    right: 22,
    bottom: Math.max(insets.bottom, 26),
    opacity: progress.get(),
    transform: [{ translateY: (1 - progress.get()) * TRAVEL }],
  }));

  if (!message) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={rise}
      className="border-border rounded-[14px] border bg-[rgba(8,3,12,0.9)] px-4 py-[13px]">
      <Text role="status" className="font-body text-body-sm text-center text-[#F8F1FB]">
        {message}
      </Text>
    </Animated.View>
  );
}
