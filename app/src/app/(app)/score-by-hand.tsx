import { router } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBackdrop } from '@/components/app-backdrop';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';

/**
 * Placeholder for screen 6b (Score it by hand) — title, genre and mood asked for
 * directly when the catalogue has nothing. Stands in so the library home's
 * `+ Add manually` button navigates somewhere real.
 *
 * When it is built: `← Back` only (the current handoff dropped the
 * `STEP 02 · BY HAND` eyebrow), and genre is `GENRE · PICK UP TO THREE` —
 * multi-select, max three, oldest drops at a fourth, one always stays selected.
 */
export default function ScoreByHandScreen() {
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

      <Text className="text-foreground font-display text-[30px] leading-[34px] tracking-tight">
        Tell us how it reads.
      </Text>
      <Text className="text-ink-muted font-body text-body">
        Screen 6b lands here — title, genre, mood and pacing, with nothing to look up.
      </Text>
    </View>
  );
}
