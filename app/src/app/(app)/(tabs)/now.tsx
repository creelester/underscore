import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackdrop } from '@/components/app-backdrop';
import { Text } from '@/components/ui/text';

/**
 * Placeholder for the Now tab (handoff screen 10, "Now"). The real screen is the
 * current-book card — gradient band, `<BOOK> · <N>%`, `Resume` and
 * `Story turned?` — over a list of earlier sections. It needs a saved playlist
 * to have anything to show, so it waits on the scoring flow.
 */
export default function NowScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View className="px-screen flex-1 gap-4" style={{ paddingTop: insets.top + 6 }}>
      <AppBackdrop />

      <Text className="text-foreground font-display text-[28px] leading-[31px] tracking-tight">
        Now playing
      </Text>
      <Text className="text-ink-muted font-body text-body">
        Nothing scored yet. Find a book in your library to start one.
      </Text>
    </View>
  );
}
