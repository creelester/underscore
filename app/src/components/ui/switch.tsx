import { Pressable } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  useAnimatedStyle,
  useDerivedValue,
  withTiming,
} from 'react-native-reanimated';

import { MOTION } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';

/**
 * The design's pill toggle — `ThemeSwitch` in the component inventory, used for
 * the Profile preferences rows and for book detail's `LYRICS`.
 *
 * Sized from book detail's inline copy (52 × 32) rather than the DS component's
 * 52 × 30, per the handoff's precedence rule: where a screen inlines its own
 * version, the screen wins. The 20px of knob travel is what the two paddings,
 * the border and the knob leave over, so the geometry is derived rather than
 * repeated as a magic number.
 */

const WIDTH = 52;
const HEIGHT = 32;
const PADDING = 3;
const BORDER = 1;
const KNOB = HEIGHT - 2 * PADDING - 2 * BORDER;
const TRAVEL = WIDTH - 2 * PADDING - 2 * BORDER - KNOB;

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
    backgroundColor: interpolateColor(progress.value, [0, 1], [theme.surface2, theme.primary]),
  }));

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * TRAVEL }],
  }));

  return (
    <Pressable
      role="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked }}
      onPress={() => onCheckedChange(!checked)}
      hitSlop={8}>
      <Animated.View
        style={[
          {
            width: WIDTH,
            height: HEIGHT,
            padding: PADDING,
            borderWidth: BORDER,
            borderColor: theme.border,
            borderRadius: 999,
          },
          trackStyle,
        ]}>
        <Animated.View
          style={[
            {
              width: KNOB,
              height: KNOB,
              borderRadius: KNOB / 2,
              backgroundColor: theme.surfaceRaised,
              boxShadow: shadows.soft,
            },
            knobStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
