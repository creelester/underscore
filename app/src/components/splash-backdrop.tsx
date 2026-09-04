import { LinearGradient } from 'expo-linear-gradient';
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
import { useTheme } from '@/lib/use-theme';

/** Prototype's 44px column padding plus the lockup block's 69px offset. Shared with the
 *  boot overlay so the mark does not move when the overlay fades. */
export const LOCKUP_TOP = 113;

const RECORD_SIZE = 540;
const RECORD_RADIUS = RECORD_SIZE / 2;

/** The haze box starts this far above the screen, as a fraction of screen height. */
const HAZE_OVERSHOOT = 0.12;

/** Clearance between the record's edge and where the haze has fully faded out. */
const HAZE_RECORD_GAP = 30;

/** Where the fade is solid ground, and the band it clears over — a fraction of screen
 *  height, so the ramp scales with the device. */
const FADE_INNER = RECORD_RADIUS + HAZE_RECORD_GAP;
const FADE_BAND = 0.45;

/** Grooves repeat every 17px from 16px out, per the prototype's repeating-radial-gradient. */
const GROOVE_RADII = Array.from(
  { length: Math.floor((RECORD_RADIUS - 16.5) / 17) + 1 },
  (_, i) => 16.5 + i * 17
);

/** Clearance on the zoom's cover scale, for rounding. */
const COVER_MARGIN = 1.04;

/** Smoothstep across the band. A straight alpha ramp hits the ground colour at full
 *  speed and the eye reads that corner as an edge. */
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
 * Flat ground, hero haze, and the record cresting the bottom edge. Shared with the boot
 * overlay so the handoff between them has no seam.
 *
 * The haze's `mask-image` fade has no RN equivalent; over flat opaque ground an overlay
 * running to the ground colour at the inverse stops is pixel-equivalent. It is a sibling
 * of the haze, not a child, so the haze's opacity does not dim it short of ground. It is
 * radial and concentric with the disc so it wraps the record's shoulders.
 *
 * The design's `blur(36px)` is dropped: blurring an already-smooth gradient only softens
 * box edges that sit off-screen or under the fade.
 *
 * `zoom` is optional 0→1 progress growing the record to cover the viewport; the boot
 * overlay passes none.
 */
export function SplashBackdrop({ zoom }: { zoom?: SharedValue<number> }) {
  const { scheme } = useTheme();
  const splash = SPLASH[scheme];
  const { width, height } = useWindowDimensions();

  const fadeOuter = FADE_INNER + FADE_BAND * height;

  // Stands in for the prop so the worklet reads one shared value unconditionally.
  const ownZoom = useSharedValue(0);
  const zoomProgress = zoom ?? ownZoom;

  // The disc's centre is the middle of the bottom edge, so the farthest pixel is a top
  // corner. The wrapper shares that centre, so scaling it is concentric.
  const coverScale = (Math.hypot(width / 2, height) / RECORD_RADIUS) * COVER_MARGIN;

  const zoomStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(zoomProgress.get(), [0, 1], [1, coverScale]) }],
  }));

  // The haze box runs to the bottom of the screen so the arc has something to cut out of,
  // but the gradient's axis is fractions of that box. Squashing the endpoints by the same
  // factor pins the ramp to the pixels it covered before the box grew.
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
          {/* Ground colour at zero alpha, not `transparent` — that is rgba(0,0,0,0) and
              the interpolation would run through the black. */}
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
