import { cssInterop } from 'nativewind';
import type { ViewProps } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { cn } from '@/lib/utils';

/**
 * A block standing in for content that has not arrived yet.
 *
 * React Native Reusables' `Skeleton`, with two changes on the way in. Its
 * `bg-accent` is `--amber-400` here, which would put a bright orange block where
 * a quiet one belongs. And its `animate-pulse` goes through NativeWind's
 * animation path, which peers Reanimated 3 while this app is on 4 — so the pulse
 * comes from Reanimated's own CSS animations instead, which is also what lets
 * the keyframe below be the design's numbers rather than Tailwind's.
 *
 * The fill is `--ink-faint` at low alpha rather than a surface token. Surfaces
 * are mixed to sit on `--bg`, but every screen here is drawn over `AppBackdrop`'s
 * gradient, against which `--surface-2` disappears in *both* themes — verified,
 * not assumed. `--ink-faint` is a mid-tone in each theme and reads on either,
 * which is why `EmptyLibrary` already draws its shelf with it.
 *
 * The design has no skeleton of its own. `us-pulse` is a motion token it defines
 * and never applies, and this is the first thing to use it.
 */

/**
 * `Animated.View` is not one of the components NativeWind wraps, so a `className`
 * on it is silently dropped — the box renders at zero size with no fill while the
 * animation runs on nothing. Registering it here is what makes the classes below
 * reach it.
 */
const AnimatedView = cssInterop(Animated.View, { className: 'style' });

/** `@keyframes us-pulse` — `0%,100% { opacity:.45 } 50% { opacity:1 }`. */
const US_PULSE = { from: { opacity: 0.45 }, to: { opacity: 1 } };

/**
 * Half a cycle, alternated — so the block spends 1.4s going dim → bright → dim,
 * which is the token's shape. The design names no duration, because it never
 * applies the keyframe; this number is ours.
 */
const HALF_CYCLE = '700ms';

/** Held opacity under reduce-motion: the midpoint of the range it would pulse across. */
const STILL_OPACITY = 0.72;

export function Skeleton({ className, style, ...props }: ViewProps) {
  const reduceMotion = useReducedMotion();

  return (
    <AnimatedView
      className={cn('bg-ink-faint/25 rounded-[4px]', className)}
      style={[
        reduceMotion
          ? { opacity: STILL_OPACITY }
          : {
              animationName: US_PULSE,
              animationDuration: HALF_CYCLE,
              animationIterationCount: 'infinite',
              animationDirection: 'alternate',
              animationTimingFunction: 'ease-in-out',
            },
        style,
      ]}
      {...props}
    />
  );
}
