import { useEffect } from 'react';
import { View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';

import { useTheme } from '@/lib/use-theme';

/**
 * The book detail screen's reading-position control — "Where are you?", 0–100.
 *
 * Hand-built rather than pulled from a package. The design draws it as a bare
 * `<input type="range">` tinted with `accent-color`, and the design system has
 * no Slider component to map onto, so this is a screen primitive in the same
 * sense `book-cover.tsx` is — not a `ui/` component.
 *
 * Gesture Handler and Reanimated over `@react-native-community/slider` because
 * both are already dependencies with `GestureHandlerRootView` mounted at the
 * root, the platform sliders cannot be styled to the design's track, and this
 * has to render in the web export the e2e suite drives.
 *
 * The position is a shared value so dragging stays on the UI thread; React only
 * hears about it on whole-percent changes, which is all the label beside it can
 * show anyway.
 */

const TRACK_HEIGHT = 4;
const THUMB_SIZE = 20;
/** The design's row height. The gesture area fills it, so the target clears 44px with hitSlop. */
const ROW_HEIGHT = 28;
const HIT_SLOP = { top: 12, bottom: 12 };

/** One press of an assistive-tech increment. */
const STEP = 5;

const MIN = 0;
const MAX = 100;

function clamp(value: number) {
  'worklet';
  return Math.min(MAX, Math.max(MIN, value));
}

export function ProgressSlider({
  value,
  onValueChange,
  accessibilityLabel,
}: {
  value: number;
  onValueChange: (value: number) => void;
  accessibilityLabel: string;
}) {
  const { theme } = useTheme();

  // The distance the thumb's *centre* travels: the row minus one thumb, so 0%
  // and 100% sit flush with the ends instead of hanging off them.
  const trackWidth = useSharedValue(0);
  const position = useSharedValue(value);

  const onLayout = (event: LayoutChangeEvent) => {
    trackWidth.value = Math.max(0, event.nativeEvent.layout.width - THUMB_SIZE);
  };

  const report = (next: number) => {
    // Whole percents only: the label reads `38%`, and firing on every
    // sub-pixel of travel would re-render React for a frame nobody can see.
    const rounded = Math.round(next);
    if (rounded !== value) onValueChange(rounded);
  };

  const moveTo = (x: number) => {
    'worklet';
    if (trackWidth.value <= 0) return;
    const next = clamp(((x - THUMB_SIZE / 2) / trackWidth.value) * MAX);
    position.value = next;
    runOnJS(report)(next);
  };

  const pan = Gesture.Pan()
    // Claims the drag from the enclosing ScrollView the moment it starts, so a
    // horizontal drag adjusts the value instead of scrolling the screen.
    .activeOffsetX([-4, 4])
    .failOffsetY([-12, 12])
    .onBegin((event) => moveTo(event.x))
    .onUpdate((event) => moveTo(event.x));

  // A tap anywhere on the track jumps to that point, which is what the range
  // input does and what makes a coarse "roughly is fine" answer quick to give.
  const tap = Gesture.Tap().onEnd((event) => moveTo(event.x));

  const fillStyle = useAnimatedStyle(() => ({
    width: THUMB_SIZE / 2 + (position.value / MAX) * trackWidth.value,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (position.value / MAX) * trackWidth.value }],
  }));

  // Dragging owns `position` and reports upward; this is the other direction —
  // a value set from outside (an assistive-tech step, a reset) pushed back in.
  // In an effect rather than in render, which Reanimated warns against.
  useEffect(() => {
    position.value = value;
  }, [position, value]);

  return (
    <GestureDetector gesture={Gesture.Race(pan, tap)}>
      <View
        onLayout={onLayout}
        hitSlop={HIT_SLOP}
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min: MIN, max: MAX, now: value }}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={(event) => {
          const delta = event.nativeEvent.actionName === 'increment' ? STEP : -STEP;
          onValueChange(Math.round(clamp(value + delta)));
        }}
        style={{ flex: 1, height: ROW_HEIGHT, justifyContent: 'center' }}>
        <View
          style={{
            height: TRACK_HEIGHT,
            borderRadius: TRACK_HEIGHT / 2,
            backgroundColor: theme.borderStrong,
          }}
        />

        <Animated.View
          style={[
            {
              position: 'absolute',
              height: TRACK_HEIGHT,
              borderRadius: TRACK_HEIGHT / 2,
              backgroundColor: theme.primary,
            },
            fillStyle,
          ]}
        />

        <Animated.View
          style={[
            {
              position: 'absolute',
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: theme.primary,
            },
            thumbStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
}
