import { StyleSheet, type PressableStateCallbackType, type ViewStyle } from 'react-native';

/**
 * The design's press feedback, which is one treatment for every control in the
 * app: `scale(.96)`, and nothing else — emphasis is carried by fill and glow,
 * never by a colour shift on press.
 *
 * A shared module because it was written inline in six components, which made a
 * global design constant look like six local decisions. Passed as `style={pressed}`
 * rather than as an inline arrow, so Pressable gets one stable function and one
 * hoisted style object instead of allocating both on every render.
 */
const styles = StyleSheet.create({
  pressed: { transform: [{ scale: 0.96 }] },
});

export function pressed({ pressed: isPressed }: PressableStateCallbackType): ViewStyle | null {
  return isPressed ? styles.pressed : null;
}

/** The same treatment, for a control that already composes its own styles. */
export const pressedStyle = styles.pressed;
