import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackdrop } from '@/components/app-backdrop';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

/**
 * Placeholder for screen 5 (Book detail) — the cover, blurb and "Where are you?"
 * progress slider that opens the scoring flow. Stands in so the library home's
 * Google rows navigate somewhere real.
 */
export default function BookDetailScreen() {
  const insets = useSafeAreaInsets();
  const { googleBooksId } = useLocalSearchParams<{ googleBooksId: string }>();

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

      <Text className="text-foreground font-display text-[28px] leading-[31px] tracking-tight">
        Book detail
      </Text>
      <Text className="text-ink-muted font-body text-body">
        Screen 5 lands here — cover, blurb and the reading-position slider.
      </Text>
      <Text className="text-ink-faint font-mono text-eyebrow tracking-eyebrow uppercase">
        {googleBooksId}
      </Text>
    </View>
  );
}
