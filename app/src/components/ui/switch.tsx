import { Pressable } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

import { BORDER, MOTION } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';

/**
 * Every style prop lives inside `useAnimatedStyle`, layout included: Reanimated 4 drops
 * static styles sitting in an array beside an animated one.
 */

const WIDTH = 52;
const HEIGHT = 32;
const PADDING = 3;

const KNOB = HEIGHT - 2 * PADDING - 2 * BORDER.hairline;
const TRAVEL = WIDTH - 2 * PADDING - 2 * BORDER.hairline - KNOB;

export function Switch({
  checked,
  onCheckedChange,
  accessibilityLabel,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  accessibilityLabel: string;
}) {
  const { theme, shadows } = useTheme();

  const progress = useDerivedValue(() =>
    withTiming(checked ? 1 : 0, {
      duration: MOTION.durMed,
      easing: Easing.bezier(...MOTION.easeStandard),
    })
  );

  const trackStyle = useAnimatedStyle(() => ({
    width: WIDTH,
    height: HEIGHT,
    padding: PADDING,
    borderWidth: BORDER.hairline,
    borderRadius: 999,
    borderColor: theme.border,
    backgroundColor: interpolateColor(progress.value, [0, 1], [theme.surface2, theme.primary]),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
    backgroundColor: theme.surfaceRaised,
    boxShadow: shadows.soft,
    transform: [{ translateX: progress.value * TRAVEL }],
  }));

  return (
    <Pressable
      role="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked }}
      onPress={() => onCheckedChange(!checked)}
      hitSlop={8}>
      <Animated.View style={trackStyle}>
        <Animated.View style={knobStyle} />
      </Animated.View>
    </Pressable>
  );
}
