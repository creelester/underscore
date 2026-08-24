import { View } from 'react-native';

import { Text } from '@/components/ui/text';

/**
 * Placeholder for the Now tab. The real screen is the current-book card —
 * gradient band, `<BOOK> · <N>%`, `Resume` and `Story turned?` — over a list of
 * earlier sections. It needs a saved playlist to have anything to show, so it
 * waits on the scoring flow.
 */
export default function NowScreen() {
  return (
    <View className="flex-1 gap-4">
      <Text className="text-foreground font-display text-[28px] leading-[31px] tracking-tight">
        Now playing
      </Text>
      <Text className="text-ink-muted font-body text-body">
        Nothing scored yet. Find a book in your library to start one.
      </Text>
    </View>
  );
}
