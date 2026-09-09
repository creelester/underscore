import { useId } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Svg, { Defs, LinearGradient, Mask, Rect, Stop } from 'react-native-svg';

import { moodGradient, type Mood } from '@/lib/gradients';

/**
 * The mood gradient bleeding down from behind the header, fading out over the top of
 * the screen.
 *
 * SVG, not `expo-linear-gradient`: the colour runs at 160° while the fade runs straight
 * down, and one gradient cannot do both. The fade is a luminance `Mask` rather than a
 * second gradient over the first, which would need an opaque colour and so would cover
 * `AppBackdrop` instead of letting it through.
 */

const TOP = -58;
const HEIGHT = 392;
const OPACITY = 0.42;

/** The design's `linear-gradient(180deg,#000 0%,#000 52%,rgba(0,0,0,.55) 74%,transparent)`. */
const FADE = [
  { offset: 0, opacity: 1 },
  { offset: 0.52, opacity: 1 },
  { offset: 0.74, opacity: 0.55 },
  { offset: 1, opacity: 0 },
];

export function MoodWash({ moods }: { moods: readonly Mood[] }) {
  const { colors, locations, start, end } = moodGradient(moods);
  // Every coordinate is in pixels, as in `AppBackdrop`: percentages on an `Svg` with no
  // `viewBox` resolve against nothing and the whole wash comes out empty.
  const { width } = useWindowDimensions();

  // Gradient ids are document-global on web and the stack keeps two scoring screens
  // mounted, so fixed ids collide — see the same guard in `AppBackdrop`.
  const instance = useId().replace(/:/g, '');
  const fillId = `wash-${instance}`;
  const maskId = `wash-mask-${instance}`;
  const rampId = `wash-ramp-${instance}`;

  return (
    <View
      pointerEvents="none"
      style={{ position: 'absolute', left: 0, right: 0, top: TOP, height: HEIGHT, opacity: OPACITY }}>
      <Svg width={width} height={HEIGHT}>
        <Defs>
          <LinearGradient
            id={fillId}
            gradientUnits="userSpaceOnUse"
            x1={start.x * width}
            y1={start.y * HEIGHT}
            x2={end.x * width}
            y2={end.y * HEIGHT}>
            {colors.map((color, index) => (
              <Stop
                key={index}
                offset={locations?.[index] ?? index / (colors.length - 1)}
                stopColor={color}
              />
            ))}
          </LinearGradient>

          <LinearGradient
            id={rampId}
            gradientUnits="userSpaceOnUse"
            x1={0}
            y1={0}
            x2={0}
            y2={HEIGHT}>
            {FADE.map(({ offset, opacity }) => (
              <Stop key={offset} offset={offset} stopColor="#FFFFFF" stopOpacity={opacity} />
            ))}
          </LinearGradient>

          <Mask id={maskId} maskUnits="userSpaceOnUse" maskType="luminance">
            <Rect width={width} height={HEIGHT} fill={`url(#${rampId})`} />
          </Mask>
        </Defs>

        <Rect width={width} height={HEIGHT} fill={`url(#${fillId})`} mask={`url(#${maskId})`} />
      </Svg>
    </View>
  );
}
