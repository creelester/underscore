import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from '@/components/ui/text';
import { GRAD_WARM } from '@/lib/gradients';
import { useTheme } from '@/lib/use-theme';
import { pressedStyle } from '@/lib/pressed';

/**
 * The design's `MoodChip` — gradient-bordered, not gradient-filled. The web original
 * is one element with `padding-box` over `border-box` backgrounds, which RN has no
 * equivalent for, so this is a padded outer view painting the border under an inner
 * view painting the surface — the same size either way.
 *
 * The interior is `--bg` in light and `--surface` in dark: those are what read as
 * "unfilled" against the app backdrop in each theme.
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
        styles.border,
        !isSelected && { backgroundColor: theme.border },
        state.pressed && pressedStyle,
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

const styles = StyleSheet.create({
  border: { padding: BORDER_WIDTH },
});
