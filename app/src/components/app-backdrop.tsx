import { useId } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { APP_BACKGROUND } from '@/lib/theme';
import { useTheme } from '@/lib/use-theme';

/**
 * The background every non-splash screen sits on: flat ground under four soft blotches.
 * Drawn in SVG because the blotches are radial gradients, which NativeWind has no class
 * for and expo-linear-gradient cannot do.
 *
 * Each blotch is an ellipse — `gradientUnits="userSpaceOnUse"` lets `rx`/`ry` be
 * independent percentages of the viewport rather than one radius of a square box. Each
 * fades to its own colour at zero alpha; a generic transparent would drag the midtones
 * grey.
 */
export function AppBackdrop() {
  const { scheme } = useTheme();
  const { width, height } = useWindowDimensions();
  const { ground, blotches } = APP_BACKGROUND[scheme];

  // Gradient ids are document-global on web and a stack keeps two backdrops mounted, so
  // fixed ids collide: the covered screen's defs come first, in a `display: none` subtree
  // that never paints, and the screen on top resolves to those and comes out flat.
  // `useId`'s colons are stripped because these are read back as URL fragments.
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

        {/* CSS paints the first background layer on top and SVG paints in document
            order, so the list is drawn back to front. */}
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
