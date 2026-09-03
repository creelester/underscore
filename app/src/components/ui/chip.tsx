import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { GRAD_WARM } from '@/lib/gradients';
import { useTheme } from '@/lib/use-theme';

/**
 * The design's `MoodChip` — a selectable pill that is **gradient-bordered, not
 * gradient-filled**, and appends a `✓` to its label when selected.
 *
 * The web original is one element with two backgrounds, `padding-box` over
 * `border-box`, which React Native has no equivalent for. Here it is a padded
 * outer view painting the border and an inner view painting the chip's own
 * surface over it, which comes out the same size: the outer 1.5px plus the
 * inner 10/18 padding is exactly the CSS border plus padding.
 *
 * The interior is not one token. The design uses `--bg` in light and
 * `--surface` in dark — the chip sits on the app backdrop, and those are the
 * values that read as "unfilled" against it in each theme.
 */

const BORDER_WIDTH = 1.5;
const CHECK = ' ✓';

export function Chip({
  label,
  isSelected,
  onPress,
}: {
  label: string;
  isSelected: boolean;
  onPress: () => void;
}) {
  const { theme, isLight } = useTheme();
  const interior = isLight ? theme.background : theme.surface;

  return (
    <Pressable
      role="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={label}
      onPress={onPress}
      className="rounded-pill overflow-hidden"
      style={(state) => [
        { padding: BORDER_WIDTH },
        !isSelected && { backgroundColor: theme.border },
        state.pressed && { transform: [{ scale: 0.96 }] },
      ]}>
      {isSelected && <LinearGradient {...GRAD_WARM} style={StyleSheet.absoluteFill} />}

      <View className="rounded-pill px-[18px] py-[10px]" style={{ backgroundColor: interior }}>
        <Text className={`font-display text-sm ${isSelected ? 'text-ink' : 'text-ink-muted'}`}>
          {isSelected ? label + CHECK : label}
        </Text>
      </View>
    </Pressable>
  );
}
