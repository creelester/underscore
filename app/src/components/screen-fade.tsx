import type { ReactNode } from 'react';
import type { StyleProp, ViewStyle } from 'react-native';
import Animated, { Easing, FadeInDown } from 'react-native-reanimated';

import { MOTION } from '@/lib/theme';

/**
 * The design's `us-fade` — the screen enter every non-splash screen uses:
 * 220ms, `opacity 0→1` with `translateY(8px→0)`, on the standard ease.
 *
 * `FadeInDown` is the right preset but starts 25px out, so the distance is
 * overridden to the design's 8px. Reanimated asks for the flat `translateY`
 * form here rather than a `transform` tuple, which is deprecated for initial
 * values.
 *
 * Built once at module scope: layout-animation builders are re-evaluated on
 * every render if they are constructed inline, which is exactly what the
 * library warns against.
 */
const US_FADE = FadeInDown.duration(MOTION.durMed)
  .easing(Easing.bezier(...MOTION.easeStandard))
  .withInitialValues({ translateY: 8 });

export function ScreenFade({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View entering={US_FADE} style={style}>
      {children}
    </Animated.View>
  );
}
