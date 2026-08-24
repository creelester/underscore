import { useId } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { APP_BACKGROUND } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';

/**
 * The background every screen outside the splash sits on: a flat ground with four soft
 * blotches across it, purple in dark and warm in light. See "App background (all
 * non-splash screens)" in the design spec — the design is explicit that this is
 * not flat near-black.
 *
 * Drawn rather than declared, because the blotches are CSS radial gradients: NativeWind
 * has no gradient classes and expo-linear-gradient cannot do radial, so this takes the
 * SVG route splash-backdrop.tsx already uses.
 *
 * Each blotch is an ellipse, not a circle — `radial-gradient(64% 30% at 6% 2%, …)` sizes
 * its two radii against the width and the height independently. `gradientUnits="userSpaceOnUse"`
 * is what lets `rx`/`ry` be those percentages of the viewport rather than one radius of a
 * square box.
 *
 * CSS `transparent` inside a gradient means that same colour at zero alpha, so each blotch
 * fades to itself. Running it to a generic transparent instead would drag the midtones grey.
 */
export function AppBackdrop() {
  const { scheme } = useTheme();
  const { width, height } = useWindowDimensions();
  const { ground, blotches } = APP_BACKGROUND[scheme];

  // Gradient ids are document-global on web, and a stack keeps the screen underneath
  // mounted, so two backdrops are live at once whenever one screen sits over another.
  // Fixed ids would collide there: the covered screen's definitions come first, they sit
  // in a `display: none` subtree that never paints, and the screen on top resolves its
  // fills to those and comes out flat. `useId` gives each instance its own namespace;
  // the colons React puts in it are stripped because these are read back as URL fragments.
  const instance = useId().replace(/:/g, '');
  const blotchId = (index: number) => `blotch-${instance}-${index}`;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Svg width={width} height={height}>
        <Defs>
          {blotches.map(({ color, alpha, fade, x, y, rx, ry }, index) => (
            <RadialGradient
              key={index}
              id={blotchId(index)}
              gradientUnits="userSpaceOnUse"
              cx={x * width}
              cy={y * height}
              rx={rx * width}
              ry={ry * height}>
              <Stop offset={0} stopColor={color} stopOpacity={alpha} />
              <Stop offset={fade} stopColor={color} stopOpacity={0} />
            </RadialGradient>
          ))}
        </Defs>

        <Rect width={width} height={height} fill={ground} />

        {/* CSS paints the first background layer on top, SVG paints in document order,
            so the list is drawn back to front to keep the stacking the design's. */}
        {blotches
          .map((_, index) => index)
          .reverse()
          .map((index) => (
            <Rect key={index} width={width} height={height} fill={`url(#${blotchId(index)})`} />
          ))}
      </Svg>
    </View>
  );
}
