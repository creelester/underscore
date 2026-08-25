import { View } from 'react-native';
import Svg, {
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Mask,
  Path,
  Rect,
  Stop,
} from 'react-native-svg';

import { Text } from '@/components/ui/text';
import { useTheme } from '@/lib/use-theme';

/**
 * The library home's empty state, from `Under Score App.dc.html`.
 *
 * Shown when the shelf has nothing on it *and* there is no query — the
 * prototype gates it on `libraryEmpty && !q`. It is not the no-results state:
 * that one answers a search that found nothing, while this one is what a new
 * account sees before it has scored anything.
 *
 * The shelf is line art rather than an illustration asset, so it takes
 * `--ink-faint` from the active theme instead of needing a per-theme export.
 */
export function EmptyLibrary() {
  const { theme } = useTheme();

  return (
    <View className="w-full flex-1 items-center justify-evenly gap-[51px] px-1 pt-2 pb-10">
      <View className="items-center gap-[10px]">
        <Text className="text-foreground font-display text-[22px] leading-[28px] tracking-tight">
          Your library is empty.
        </Text>
        {/* `max-width:30ch` in the prototype — roughly 240px at Inter 14. */}
        <Text className="text-ink-muted font-body text-body-sm max-w-[240px] text-center">
          Search for a book you&rsquo;re reading and start scoring it.
        </Text>
      </View>

      <View className="aspect-[300/220] w-full max-w-[300px]">
        <Svg width="100%" height="100%" viewBox="0 0 300 220" fill="none">
          <Defs>
            {/* The prototype masks the shelf so it dissolves downward rather than
                ending on a hard edge. A luminance mask wants white→black, which is
                what a `mask-image` alpha ramp compiles to. */}
            <SvgLinearGradient id="shelf-fade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="42%" stopColor="#fff" stopOpacity={1} />
              <Stop offset="96%" stopColor="#000" stopOpacity={1} />
            </SvgLinearGradient>
            <Mask id="shelf-mask">
              <Rect x={0} y={0} width={300} height={220} fill="url(#shelf-fade)" />
            </Mask>
          </Defs>

          <G
            mask="url(#shelf-mask)"
            stroke={theme.inkFaint}
            strokeWidth={8}
            strokeLinecap="round"
            opacity={0.5}>
            {/* Uprights, then the shelves, then the two half-height dividers. */}
            <Path d="M22 14v196M278 14v196" />
            <Path d="M22 14h256" />
            <Path d="M22 82h256M22 150h256M22 210h256" />
            <Path d="M150 14v68" strokeOpacity={0.5} />
            <Path d="M150 150v60" strokeOpacity={0.5} />
          </G>
        </Svg>
      </View>
    </View>
  );
}
