import { Pressable, StyleSheet } from 'react-native';
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
 * version, the screen wins.
 *
 * `StyleSheet.create` rather than NativeWind classes, which is the exception in
 * this codebase and deliberate: the knob's size and travel are *derived* from
 * the track — width less its padding, borders and the knob — and a Tailwind
 * class has to be a literal string, so classes would mean writing 32, 3 and 24
 * twice and letting them drift. The colours still come from the theme rather
 * than from hex here, because two of them are animated and Reanimated has to
 * own those anyway.
 */

const WIDTH = 52;
const HEIGHT = 32;
const PADDING = 3;
const BORDER = 1;
const KNOB = HEIGHT - 2 * PADDING - 2 * BORDER;
const TRAVEL = WIDTH - 2 * PADDING - 2 * BORDER - KNOB;

const styles = StyleSheet.create({
  track: {
    width: WIDTH,
    height: HEIGHT,
    padding: PADDING,
    borderWidth: BORDER,
    borderRadius: 999,
  },
  knob: {
    width: KNOB,
    height: KNOB,
    borderRadius: KNOB / 2,
  },
});

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
      <Animated.View style={[styles.track, { borderColor: theme.border }, trackStyle]}>
        <Animated.View
          style={[
            styles.knob,
            { backgroundColor: theme.surfaceRaised, boxShadow: shadows.soft },
            knobStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
