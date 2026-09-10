import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { cssInterop } from 'nativewind';

import Wave from '@/assets/images/wave.svg';
import { Text } from '@/components/ui/text';
import { type GradientSpec } from '@/lib/gradients';
import { MOTION, RADIUS } from '@/lib/theme';
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

/**
 * The drift rides on a wrapper rather than the gradient itself: NativeWind's animation
 * path only reaches components it wraps, and a Reanimated-wrapped `LinearGradient`
 * throws on `animationName`. The gradient inside keeps its own size and radius, since an
 * absolutely positioned one is not clipped by a rounded parent on iOS.
 */
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

/** How long each aside holds before the last step moves on to the next. */
const ASIDE_MS = 3500;

/**
 * The step in flight spins instead of sitting under `◌`. The design has no such state —
 * its prototype resolves in seconds — but generation runs for a minute or more, and a
 * static marker for that long reads as a hung screen.
 */
const US_SPIN = {
  from: { transform: [{ rotate: '0deg' }] },
  to: { transform: [{ rotate: '360deg' }] },
};
const SPIN_MS = '900ms';

const SPINNER_SIZE = 12;
const SPINNER_BORDER = 2;

/** Wide enough for the glyphs and the ring alike, so a step changing state cannot shift its label. */
const MARKER_WIDTH = 14;

function StepMarker({ state, color }: { state: 'done' | 'active' | 'pending'; color: string }) {
  const reduceMotion = useReducedMotion();

  if (state === 'active' && !reduceMotion) {
    return (
      <View style={{ width: MARKER_WIDTH }} className="items-center">
        <AnimatedView
          style={{
            width: SPINNER_SIZE,
            height: SPINNER_SIZE,
            borderRadius: SPINNER_SIZE / 2,
            borderWidth: SPINNER_BORDER,
            borderColor: color,
            // The gap that makes the ring read as turning rather than pulsing.
            borderTopColor: 'transparent',
            animationName: US_SPIN,
            animationDuration: SPIN_MS,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'linear',
          }}
        />
      </View>
    );
  }

  return (
    <Text
      className="font-mono text-[13px] font-bold"
      style={{ width: MARKER_WIDTH, color, textAlign: 'center' }}>
      {state === 'done' ? DONE : PENDING}
    </Text>
  );
}

const WAVE_WIDTH = 170;
const WAVE_HEIGHT = 47;
const WAVE_GHOST = 'rgba(255,255,255,0.2)';

/** `@keyframes us-wave-draw` as its three segments, summing to the design's 2.8s. */
const DRAW_MS = 1540;
const HOLD_MS = 560;
const WIPE_MS = 700;

/**
 * The wave drawn in left to right, held, then wiped away the same way, over a ghost of
 * itself that never leaves.
 *
 * The design uses `clip-path: inset(…)`, which RN has no equivalent for, so the solid
 * copy shows through a window that first widens from the left edge and then walks that
 * edge across — `phase` runs 0→1 drawing and 1→2 wiping. The copy inside is offset back
 * by however far the window has moved, so the artwork stays put as the window travels.
 */
function WaveMark() {
  const reduceMotion = useReducedMotion();
  const phase = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    const easing = Easing.bezier(...MOTION.easeStandard);

    phase.value = withRepeat(
      withSequence(
        withTiming(0, { duration: 0 }),
        withTiming(1, { duration: DRAW_MS, easing }),
        withTiming(1, { duration: HOLD_MS }),
        withTiming(2, { duration: WIPE_MS, easing }),
      ),
      -1,
    );
  }, [phase, reduceMotion]);

  // Every layout prop is returned from the hook: Reanimated drops the static half of a
  // `[static, animated]` style array.
  const windowStyle = useAnimatedStyle(() => {
    const left = WAVE_WIDTH * Math.max(0, phase.value - 1);
    return {
      position: 'absolute',
      top: 0,
      height: WAVE_HEIGHT,
      overflow: 'hidden',
      left,
      width: WAVE_WIDTH * Math.min(phase.value, 1) - left,
    };
  });

  const innerStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    top: 0,
    width: WAVE_WIDTH,
    height: WAVE_HEIGHT,
    left: -WAVE_WIDTH * Math.max(0, phase.value - 1),
  }));

  // Both copies carry the asset's own mask ids, which collide on web — harmless only
  // because they are the same artwork at the same size, so both resolve to one mask.
  return (
    <View style={{ width: WAVE_WIDTH, height: WAVE_HEIGHT }}>
      <Wave width={WAVE_WIDTH} height={WAVE_HEIGHT} color={WAVE_GHOST} />

      {reduceMotion ? (
        <View style={{ position: 'absolute', top: 0 }}>
          <Wave width={WAVE_WIDTH} height={WAVE_HEIGHT} color="#FFFFFF" />
        </View>
      ) : (
        <Animated.View style={windowStyle}>
          <Animated.View style={innerStyle}>
            <Wave width={WAVE_WIDTH} height={WAVE_HEIGHT} color="#FFFFFF" />
          </Animated.View>
        </Animated.View>
      )}
    </View>
  );
}

export function ScoringProgress({
  gradient,
  title,
  steps,
  asides = [],
}: {
  gradient: GradientSpec;
  title: string;
  steps: readonly string[];
  /** Cycled through on the last step, which is held until the caller unmounts this. */
  asides?: readonly string[];
}) {
  const { theme, shadows } = useTheme();
  const reduceMotion = useReducedMotion();
  const [reached, setReached] = useState(0);
  const [aside, setAside] = useState(-1);

  useEffect(() => {
    if (reached >= steps.length - 1) return;
    const timer = setTimeout(
      () => setReached((step) => step + 1),
      reached === 0 ? FIRST_STEP_MS : STEP_MS,
    );
    return () => clearTimeout(timer);
  }, [reached, steps.length]);

  const onLastStep = reached >= steps.length - 1;

  useEffect(() => {
    if (!onLastStep || asides.length === 0) return;
    const timer = setInterval(() => setAside((index) => index + 1), ASIDE_MS);
    return () => clearInterval(timer);
  }, [onLastStep, asides.length]);

  /** The last step says its own line first, then borrows the asides in turn. */
  const labelFor = (step: string, index: number) =>
    index === steps.length - 1 && aside >= 0 && asides.length > 0
      ? asides[aside % asides.length]
      : step;

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
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <WaveMark />
        </LinearGradient>
      </AnimatedView>

      <Text className="text-center font-display text-[24px] leading-[29px] text-foreground">
        {title}
      </Text>

      <View className="w-full max-w-[260px] gap-[10px]">
        {steps.map((step, index) => (
          <View
            key={index}
            className="flex-row items-center gap-3"
            style={index <= reached ? undefined : { opacity: PENDING_OPACITY }}>
            <StepMarker
              state={index < reached ? 'done' : index === reached ? 'active' : 'pending'}
              // The live step takes the finished step's colour, not the pending grey: it
              // is working, and the ring already tells it apart from a tick.
              color={index <= reached ? theme.primary : theme.inkFaint}
            />
            <Text className="font-body text-body-sm text-foreground">
              {labelFor(step, index)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
