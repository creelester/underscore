import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { GRAD_WARM, type GradientSpec } from '@/lib/gradients';
import { RADIUS } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';
import { pressedStyle } from '@/lib/pressed';

/**
 * The design's chip, in the two forms it draws. Given a `gradient` it is the DS's
 * `MoodChip`: selected fills with that mood's own gradient. Without one it is the
 * screens' inline pill, whose selected state is a warm gradient ring around an unfilled
 * interior — the web original paints a `padding-box` background over a `border-box` one,
 * which RN has no equivalent for.
 *
 * So the gradient is the chip's outermost box, padded by the ring width, with the
 * interior drawn inside it. It has to be a laid-out child rather than an absolutely
 * positioned fill: `overflow: hidden` on the parent does not clip an absolute
 * `LinearGradient` to the pill on iOS, and giving that fill its own `borderRadius` stops
 * it rendering at all. The unselected state runs through the same box as a flat pair of
 * stops, so selecting a chip cannot change its size.
 *
 * The unselected fill is `--border`, not the DS's `--surface-2`: surfaces are mixed to
 * sit on `--bg`, and surface-2 disappears against `AppBackdrop`'s gradient in both
 * themes — the same reason `Skeleton` avoids it.
 */

/** 2px rather than the design's 1.5: at 1.5 the ring reads as a hairline on the backdrop. */
const BORDER_WIDTH = 2;
const CHECK = ' ✓';

export function Chip({
  label,
  isSelected,
  onPress,
  gradient,
  ink,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
  /** Fills the chip when selected, instead of ringing it. */
  gradient?: GradientSpec;
  /** Label colour over `gradient`, which is not a theme surface. */
  ink?: string;
}) {
  const { theme, isLight } = useTheme();
  const isFilled = isSelected && !!gradient;

  const paint: GradientSpec = isSelected
    ? (gradient ?? GRAD_WARM)
    : { colors: [theme.border, theme.border], start: { x: 0, y: 0 }, end: { x: 1, y: 0 } };

  return (
    <Pressable
      role="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={label}
      onPress={onPress}
      style={(state) => [styles.press, state.pressed && pressedStyle]}>
      <LinearGradient {...paint} style={styles.ring}>
        <View
          style={[
            styles.inner,
            // A fill has nothing to reveal underneath, so the interior steps out of the way.
            {
              backgroundColor: isFilled
                ? 'transparent'
                : isLight
                  ? theme.background
                  : theme.surface,
            },
          ]}>
          <Text
            className="font-display text-sm"
            style={{ color: isFilled ? ink : isSelected ? theme.ink : theme.inkMuted }}>
            {isSelected ? label + CHECK : label}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  press: { borderRadius: RADIUS.pill, overflow: 'hidden' },
  ring: { padding: BORDER_WIDTH, borderRadius: RADIUS.pill },
  inner: {
    paddingHorizontal: 18 - BORDER_WIDTH,
    paddingVertical: 10 - BORDER_WIDTH,
    borderRadius: RADIUS.pill,
  },
});
