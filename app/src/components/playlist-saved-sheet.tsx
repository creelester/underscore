import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Sheet } from '@/components/ui/sheet';
import { Text } from '@/components/ui/text';
import { GRAD_WARM } from '@/lib/gradients';
import { useTheme } from '@/lib/use-theme';

/**
 * What the reader sees the moment a playlist reaches their Spotify. The design's second
 * button, `Play here instead`, is absent: there is no in-app player, so opening Spotify is
 * the only way to hear it.
 */

const CHECK = 60;

export function PlaylistSavedSheet({
  isOpen,
  onClose,
  title,
  onOpenSpotify,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onOpenSpotify: () => void;
}) {
  const { shadows } = useTheme();

  return (
    <Sheet isOpen={isOpen} onClose={onClose} label="Saved to Spotify">
      <View className="gap-[14px]">
        <View
          className="rounded-pill items-center justify-center self-center overflow-hidden"
          style={{ width: CHECK, height: CHECK, boxShadow: shadows.glow }}>
          <LinearGradient {...GRAD_WARM} style={StyleSheet.absoluteFill} />
          <Text className="font-display-bold text-[22px] text-[#180310]">✓</Text>
        </View>

        <Text className="text-foreground font-display text-center text-[21px] leading-[26px]">
          {title} is in your Spotify.
        </Text>
        <Text className="text-ink-muted font-body text-body-sm text-center">
          It stays in step with the book — just say when the story turns.
        </Text>

        <Button size="lg" className="w-full" onPress={onOpenSpotify}>
          <Text>Open in Spotify →</Text>
        </Button>
        <Button variant="text" size="sm" className="w-full" onPress={onClose}>
          <Text>Done</Text>
        </Button>
      </View>
    </Sheet>
  );
}
