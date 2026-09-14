import { useLocalSearchParams } from 'expo-router';
import { ScrollView, View } from 'react-native';

import { ScoringScreen } from '@/components/scoring-screen';
import { Text } from '@/components/ui/text';
import { useSavedPlaylist } from '@/features/bookshelf/use-saved-playlist';
import { isApiError } from '@/lib/api-client';
import { CONTENT_GAP } from '@/lib/theme';

/**
 * A playlist off the bookshelf. Its sibling `playlist.tsx` generates one and lands on
 * the same view; the design's result screen is unbuilt, so both list the tracks as
 * plain text for now.
 */
export default function SavedPlaylistScreen() {
  const { playlistId } = useLocalSearchParams<{ playlistId: string }>();
  const { data: playlist, error } = useSavedPlaylist(playlistId);

  if (error) {
    const message = isApiError(error) ? error.message : 'Something went wrong.';

    return (
      <ScoringScreen>
        <View className="gap-[10px] pt-2">
          <Text className="font-display text-[19px] leading-[25px] text-foreground">
            We couldn&apos;t open this one.
          </Text>
          <Text className="font-body text-body-sm text-ink-muted">{message}</Text>
        </View>
      </ScoringScreen>
    );
  }

  if (!playlist) return <ScoringScreen />;

  return (
    <ScoringScreen>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ gap: CONTENT_GAP }}
        showsVerticalScrollIndicator={false}>
        <View className="gap-1">
          <Text className="font-display text-[30px] leading-[34px] tracking-tight text-foreground">
            {playlist.name}
          </Text>
          <Text className="font-body text-body-sm text-ink-muted">
            {playlist.book.title}
          </Text>
        </View>

        <View className="gap-2">
          {playlist.tracks.map(({ track, position }) => (
            <Text key={position} className="font-body text-body-sm text-ink-muted">
              {track.name} - {track.artist}
            </Text>
          ))}
        </View>
      </ScrollView>
    </ScoringScreen>
  );
}
