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
 */
export function ScoringScreen({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="px-screen flex-1 gap-4"
      style={{
        paddingTop: insets.top + 6,
        paddingBottom: Math.max(insets.bottom, 34),
      }}>
      <AppBackdrop />

      <View className="flex-row">
        <Button variant="text" size="sm" onPress={() => router.back()}>
          <Text>← Back</Text>
        </Button>
      </View>

      {children}
    </View>
  );
}
