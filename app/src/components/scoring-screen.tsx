import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackdrop } from '@/components/app-backdrop';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

/**
 * The screen padding and `← Back` control every pushed scoring screen shares. A
 * component, not a route layout: these are plain siblings under `(app)`, and a layout
 * would need a route group of its own purely to hang it on.
 *
 * `contentGap` is the space under `← Back`, which the design sets per screen.
 */

/**
 * Where `← Back` goes with no history to pop — a deep link or a web reload, where
 * `router.back()` is a silent no-op and the control looks broken. The library home is
 * where a score begins, and the design gives back an explicit destination anyway.
 *
 * `replace`, not `push`: pushing would build a history that runs backwards.
 */
const BACK_FALLBACK = '/library';

export function ScoringScreen({
  children,
  contentGap = 16,
}: {
  // Optional so a screen awaiting data can render the shell alone, as book detail does.
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
