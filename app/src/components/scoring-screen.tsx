import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackdrop } from '@/components/app-backdrop';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

/**
 * The shell every pushed screen in the scoring flow shares: the screen padding
 * and the `← Back` control.
 *
 * A component rather than a route layout because these screens are plain
 * siblings under `(app)`. Giving them a layout would mean wrapping them in a
 * route group of their own purely to hang it on, which buys a directory and
 * changes nothing about what renders.
 *
 * `contentGap` is the space under `← Back`, which the design sets per screen
 * rather than globally — 18px on book detail, 14px on mood and by-hand.
 */

/**
 * Where `← Back` goes when there is no history to pop.
 *
 * These screens are deep-linkable — `/book/<id>` is a real URL, and on web a
 * reload re-enters the route cold — and in that state `router.back()` is a
 * silent no-op, so the control looks broken. The design gives book detail's back
 * an explicit destination rather than a history pop (`goSearch` in the
 * prototype), and the library home is where a score begins, so it is also the
 * right place to land from a cold entry.
 *
 * `replace`, not `push`: the route being left had nothing behind it, and pushing
 * would build a history that runs backwards.
 */
const BACK_FALLBACK = '/library';

export function ScoringScreen({
  children,
  contentGap = 16,
}: {
  // Optional so a screen still waiting on its data can render the shell alone,
  // which is what book detail does instead of flashing a spinner.
  children?: ReactNode;
  contentGap?: number;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="px-screen flex-1"
      style={{
        gap: contentGap,
        paddingTop: insets.top + 6,
        paddingBottom: Math.max(insets.bottom, 34),
      }}>
      <AppBackdrop />

      <View className="flex-row">
        <Button
          variant="text"
          size="sm"
          onPress={() =>
            router.canGoBack() ? router.back() : router.replace(BACK_FALLBACK)
          }>
          <Text>← Back</Text>
        </Button>
      </View>

      {children}
    </View>
  );
}
