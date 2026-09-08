import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { cssInterop } from 'nativewind';

import { Text } from '@/components/ui/text';
import { type GradientSpec } from '@/lib/gradients';
import { RADIUS } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';

/**
 * The design's waiting screen, drawn identically for `analyzing` and `generating`: a
 * drifting mood square over a title and a list of steps that tick over as the work runs.
 *
 * The steps are a progress indicator, not a report — one request is in flight, and the
 * server sends no milestones — so they advance on the design's own cadence and hold on
 * the last one until the caller unmounts this. That is why the ticking lives here rather
 * than being driven by a prop no screen could honestly supply.
 */

// The drift rides on a wrapper rather than the gradient itself: NativeWind's animation
// path only reaches components it wraps, and a Reanimated-wrapped `LinearGradient`
// throws on `animationName`. The gradient inside keeps its own size and radius, since an
// absolutely positioned one is not clipped by a rounded parent on iOS.
const AnimatedView = cssInterop(Animated.View, { className: 'style' });

const SQUARE = 210;

/** `@keyframes us-drift`, as its two halves — alternated back into the design's 7s cycle. */
const US_DRIFT = {
  from: {
    transform: [{ scale: 1.04 }, { translateX: '0%' }, { translateY: '0%' }],
  },
  to: {
    transform: [{ scale: 1.12 }, { translateX: '-2%' }, { translateY: '-2%' }],
  },
};
const DRIFT_HALF_CYCLE = '3500ms';

/** The prototype's timings: the first step lands quickly, the rest at a steady beat. */
const FIRST_STEP_MS = 700;
const STEP_MS = 1000;

const DONE = '✓';
const PENDING = '◌';

/** Steps not yet reached are dimmed rather than hidden, so the list never reflows. */
const PENDING_OPACITY = 0.4;

export function ScoringProgress({
  gradient,
  title,
  steps,
}: {
  gradient: GradientSpec;
  title: string;
  steps: readonly string[];
}) {
  const { theme, shadows } = useTheme();
  const reduceMotion = useReducedMotion();
  const [reached, setReached] = useState(0);

  useEffect(() => {
    if (reached >= steps.length - 1) return;
    const timer = setTimeout(
      () => setReached((step) => step + 1),
      reached === 0 ? FIRST_STEP_MS : STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [reached, steps.length]);

  return (
    <View className="flex-1 items-center justify-center gap-[30px] px-[30px] pb-[70px]">
      <AnimatedView
        style={
          reduceMotion
            ? undefined
            : {
                animationName: US_DRIFT,
                animationDuration: DRIFT_HALF_CYCLE,
                animationIterationCount: 'infinite',
                animationDirection: 'alternate',
                animationTimingFunction: 'ease-in-out',
              }
        }>
        <LinearGradient
          {...gradient}
          style={{
            width: SQUARE,
            height: SQUARE,
            borderRadius: RADIUS.card,
            boxShadow: shadows.soft,
          }}
        />
      </AnimatedView>

      <Text className="text-center font-display text-[24px] leading-[29px] text-foreground">
        {title}
      </Text>

      <View className="w-full max-w-[260px] gap-[10px]">
        {steps.map((step, index) => (
          <View
            key={step}
            className="flex-row items-center gap-3"
            style={index <= reached ? undefined : { opacity: PENDING_OPACITY }}>
            <Text
              className="font-mono text-[13px] font-bold"
              style={{
                color: index < reached ? theme.primary : theme.inkFaint,
              }}>
              {index < reached ? DONE : PENDING}
            </Text>
            <Text className="font-body text-body-sm text-foreground">{step}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
