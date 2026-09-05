import { cssInterop } from 'nativewind';
import type { ViewProps } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import { cn } from '@/lib/utils';

/**
 * A block standing in for content that has not arrived yet — RNR's `Skeleton` with two
 * changes. Its `bg-accent` is `--amber-400` here, and its `animate-pulse` goes through
 * NativeWind's animation path, which peers Reanimated 3 while this app is on 4.
 *
 * Filled with `--ink-faint` at low alpha, not a surface token: surfaces are mixed to
 * sit on `--bg`, and `--surface-2` disappears against `AppBackdrop`'s gradient in both
 * themes. The design defines `us-pulse` but never applies it; this is its first use.
 */

// `Animated.View` is not one of the components NativeWind wraps, so a `className` on it
// is silently dropped and the box renders at zero size with no fill.
const AnimatedView = cssInterop(Animated.View, { className: 'style' });

/** `@keyframes us-pulse` — `0%,100% { opacity:.45 } 50% { opacity:1 }`. */
const US_PULSE = { from: { opacity: 0.45 }, to: { opacity: 1 } };

/** Half a cycle, alternated into a 1.4s dim → bright → dim. The design names no
 *  duration, because it never applies the keyframe; this number is ours. */
const HALF_CYCLE = '700ms';

/** Under reduce-motion: the midpoint of the range it would pulse across. */
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
