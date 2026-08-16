import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from 'nativewind';
import { StyleSheet, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

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

/** Grooves repeat every 17px from 16px out, per the prototype's repeating-radial-gradient. */
const GROOVE_RADII = Array.from(
  { length: Math.floor((RECORD_RADIUS - 16.5) / 17) + 1 },
  (_, i) => 16.5 + i * 17
);

/** `#RRGGBB` at a given alpha. Fading to `transparent` instead would darken the ramp,
 *  because `transparent` is rgba(0,0,0,0) and iOS interpolates through the black. */
function withAlpha(hex: string, alpha: number) {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
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
 * The design's `blur(36px)` on the haze is dropped: blurring an already-smooth linear
 * gradient only softens its box edges, and those sit off-screen or under the fade.
 */
export function SplashBackdrop() {
  const { colorScheme } = useColorScheme();
  const splash = SPLASH[colorScheme === 'light' ? 'light' : 'dark'];

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: splash.ground }]} />

      <View style={[styles.haze, { opacity: splash.hazeOpacity }]}>
        <LinearGradient {...GRAD_HERO} style={StyleSheet.absoluteFill} />
      </View>
      <LinearGradient
        colors={[
          withAlpha(splash.ground, 0),
          withAlpha(splash.ground, 0),
          withAlpha(splash.ground, 0.6),
          splash.ground,
        ]}
        locations={[0, 0.44, 0.72, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={styles.haze}
      />

      <View style={styles.record}>
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  haze: {
    position: 'absolute',
    left: '-30%',
    right: '-30%',
    top: '-12%',
    height: '64%',
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
