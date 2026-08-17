import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { GRAD_HERO } from '@/lib/gradients';
import { SPLASH } from '@/lib/theme';

/**
 * Distance from below the status bar to the top of the lockup: the prototype's 44px
 * column padding plus the lockup block's 69px offset. Shared by the splash screen and
 * the boot overlay so the mark does not move when the overlay fades.
 */
export const LOCKUP_TOP = 113;

const RECORD_SIZE = 540;
const RECORD_RADIUS = RECORD_SIZE / 2;

/** The haze box starts this far above the screen, as a fraction of screen height. */
const HAZE_OVERSHOOT = 0.12;

/** Clearance between the record's edge and where the haze has fully faded out. */
const HAZE_RECORD_GAP = 30;

/** Radius at which the fade is solid ground, and how far out it takes to clear —
 *  the latter as a fraction of screen height, so the ramp scales with the device. */
const FADE_INNER = RECORD_RADIUS + HAZE_RECORD_GAP;
const FADE_BAND = 0.45;

/** Grooves repeat every 17px from 16px out, per the prototype's repeating-radial-gradient. */
const GROOVE_RADII = Array.from(
  { length: Math.floor((RECORD_RADIUS - 16.5) / 17) + 1 },
  (_, i) => 16.5 + i * 17
);

/** Clearance on the zoom's cover scale, for rounding. */
const COVER_MARGIN = 1.04;

/**
 * The fade sampled as a smoothstep across the band, ground at `t = 0` and clear at
 * `t = 1`. A gradient interpolates linearly between its stops, and a straight alpha
 * ramp arrives at the ground colour at full speed — the eye reads that corner in the
 * ramp as an edge. Easing in and out of it removes the line.
 */
const FADE = Array.from({ length: 9 }, (_, i) => {
  const t = i / 8;
  return { t, alpha: 1 - t * t * (3 - 2 * t) };
});

/** The ramp above, as gradient stops, preceded by the solid disc it starts from. */
function fadeStops(outer: number) {
  return [
    { offset: 0, alpha: 1 },
    ...FADE.map(({ t, alpha }) => ({
      offset: (FADE_INNER + t * (outer - FADE_INNER)) / outer,
      alpha,
    })),
  ];
}

/**
 * The splash's three stacked layers: flat ground, hero haze, and the record whose top
 * half crests the bottom edge. Shared by the boot overlay and the splash screen so the
 * handoff between them has no seam. See docs/design/README.md, Splash.
 *
 * The haze's `mask-image` fade has no React Native equivalent, but the ground beneath
 * it is flat and opaque, so an overlay running from transparent to the ground colour at
 * the inverse stops is pixel-equivalent. It is a sibling of the haze rather than a
 * child so the haze's own opacity does not dim the fade short of the ground colour.
 *
 * That overlay is radial, centred on the record: the haze ends on an arc concentric
 * with the disc rather than on a horizontal line, so it wraps the record's shoulders
 * instead of cutting across them. The record's centre is exactly the bottom edge of
 * the screen — `bottom: -RECORD_RADIUS` — which is what makes the two share a centre.
 *
 * The design's `blur(36px)` on the haze is dropped: blurring an already-smooth linear
 * gradient only softens its box edges, and those sit off-screen or under the fade.
 *
 * `zoom` is an optional 0→1 progress the caller drives to grow the record until it covers
 * the viewport — the splash hands it one on the way out, the boot overlay does not. The
 * disc is otherwise still: it is a flat field of concentric circles, so rotating it shows
 * nothing, and the sheen that would have carried a spin was not worth the addition to an
 * artwork the design draws flat.
 */
export function SplashBackdrop({ zoom }: { zoom?: SharedValue<number> }) {
  const { colorScheme } = useColorScheme();
  const splash = SPLASH[colorScheme === 'light' ? 'light' : 'dark'];
  const { width, height } = useWindowDimensions();

  const fadeOuter = FADE_INNER + FADE_BAND * height;

  // Stands in for the prop when the caller has no zoom of its own — the boot overlay,
  // which draws the same artwork but never grows it — so the worklet below can read one
  // shared value unconditionally.
  const ownZoom = useSharedValue(0);
  const zoomProgress = zoom ?? ownZoom;

  // What the disc has to reach to cover the viewport: its centre is the middle of the
  // bottom edge, so the farthest pixel from it is a top corner. The 540px wrapper is
  // centred on that same point, so scaling it is concentric — the disc grows out of the
  // bottom edge it already sits on rather than drifting as it goes.
  const coverScale = (Math.hypot(width / 2, height) / RECORD_RADIUS) * COVER_MARGIN;

  // `get` rather than `.value`: the React Compiler treats a value passed to a hook as
  // immutable, and the eslint rule that enforces that is on.
  const zoomStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(zoomProgress.get(), [0, 1], [1, coverScale]) }],
  }));

  // The haze box has to run to the bottom of the screen for the arc to have anything
  // to cut out of, but the hero gradient's axis is expressed as fractions of that box,
  // so growing it would drag the colours down with it. Squashing the axis endpoints by
  // the same factor pins the ramp to the pixels it covered when the box stopped above
  // the record — every point in the taller box then gets the colour the shorter box's
  // gradient would have had there, and the added strip is its natural continuation.
  const boxHeight = height * (1 + HAZE_OVERSHOOT);
  const axisScale = (boxHeight - FADE_INNER) / boxHeight;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: splash.ground }]} />

      <View style={[styles.haze, { opacity: splash.hazeOpacity }]}>
        <LinearGradient
          {...GRAD_HERO}
          start={{ x: GRAD_HERO.start.x, y: GRAD_HERO.start.y * axisScale }}
          end={{ x: GRAD_HERO.end.x, y: GRAD_HERO.end.y * axisScale }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <Svg style={StyleSheet.absoluteFill} width={width} height={height}>
        <Defs>
          {/* Fading to `transparent` instead of to the ground colour at zero alpha
              would darken the ramp: `transparent` is rgba(0,0,0,0), and the
              interpolation runs through the black. */}
          <RadialGradient
            id="haze-fade"
            gradientUnits="userSpaceOnUse"
            cx={width / 2}
            cy={height}
            r={fadeOuter}>
            {fadeStops(fadeOuter).map(({ offset, alpha }) => (
              <Stop
                key={offset}
                offset={offset}
                stopColor={splash.ground}
                stopOpacity={alpha}
              />
            ))}
          </RadialGradient>
        </Defs>
        <Rect width={width} height={height} fill="url(#haze-fade)" />
      </Svg>

      <Animated.View style={[styles.record, zoomStyle]}>
        <Svg width={RECORD_SIZE} height={RECORD_SIZE}>
          <Circle
            cx={RECORD_RADIUS}
            cy={RECORD_RADIUS}
            r={RECORD_RADIUS}
            fill={splash.record}
          />
          {GROOVE_RADII.map((r) => (
            <Circle
              key={r}
              cx={RECORD_RADIUS}
              cy={RECORD_RADIUS}
              r={r}
              fill="none"
              stroke={splash.groove}
              strokeWidth={1}
            />
          ))}
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  haze: {
    position: 'absolute',
    left: '-30%',
    right: '-30%',
    top: `-${HAZE_OVERSHOOT * 100}%`,
    bottom: 0,
  },
  record: {
    position: 'absolute',
    left: '50%',
    bottom: -RECORD_RADIUS,
    width: RECORD_SIZE,
    height: RECORD_SIZE,
    marginLeft: -RECORD_RADIUS,
  },
});
