import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  withTiming,
} from 'react-native-reanimated';

import { MOTION } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';

/**
 * Onboarding step indicator, per the design spec: the active dot elongates
 * into a `--primary` pill; the rest are 8px ink-faint circles.
 */
const DOT = 8;
const DOT_ACTIVE_WIDTH = 22;

type ProgressDotsProps = {
  count: number;
  active: number;
};

function Dot({ isActive }: { isActive: boolean }) {
  const reduceMotion = useReducedMotion();
  const { theme } = useTheme();

  const style = useAnimatedStyle(() => {
    const timing = {
      duration: reduceMotion ? 0 : MOTION.durMed,
      easing: Easing.bezier(...MOTION.easeStandard),
    };
    return {
      width: withTiming(isActive ? DOT_ACTIVE_WIDTH : DOT, timing),
      backgroundColor: withTiming(isActive ? theme.primary : theme.inkFaint, timing),
    };
  });

  return <Animated.View style={[{ height: DOT, borderRadius: DOT / 2 }, style]} />;
}

export function ProgressDots({ count, active }: ProgressDotsProps) {
  return (
    <View className="flex-row items-center gap-1.5">
      {Array.from({ length: count }, (_, index) => (
        <Dot key={index} isActive={index === active} />
      ))}
    </View>
  );
}
