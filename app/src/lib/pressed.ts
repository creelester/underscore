import { StyleSheet, type PressableStateCallbackType, type ViewStyle } from 'react-native';

/**
 * The design's press feedback for every control: `scale(.96)` and nothing else. Shared
 * because inline in six components it looked like six local decisions. Passed as
 * `style={pressed}`, not an inline arrow, so Pressable gets one stable function.
 */
const styles = StyleSheet.create({
  pressed: { transform: [{ scale: 0.96 }] },
});

export function pressed({ pressed: isPressed }: PressableStateCallbackType): ViewStyle | null {
  return isPressed ? styles.pressed : null;
}

/** The same treatment, for a control that already composes its own styles. */
export const pressedStyle = styles.pressed;
