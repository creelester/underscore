import { useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { PlaylistView } from '@/components/playlist-view';
import { ScoringScreen } from '@/components/scoring-screen';
import { Text } from '@/components/ui/text';
import { useSavedPlaylist } from '@/features/bookshelf/use-saved-playlist';
import { isApiError } from '@/lib/api-client';

/** A playlist off the bookshelf. Its sibling `playlist.tsx` generates one and lands here. */
export default function SavedPlaylistScreen() {
  const { playlistId } = useLocalSearchParams<{ playlistId: string }>();
  const { data: playlist, error } = useSavedPlaylist(playlistId);

  if (error) {
    const message = isApiError(error) ? error.message : 'Something went wrong.';

    return (
      <ScoringScreen>
        <View className="gap-[10px] pt-2">
          <Text className="text-foreground font-display text-[19px] leading-[25px]">
            We couldn&apos;t open this one.
          </Text>
          <Text className="text-ink-muted font-body text-body-sm">{message}</Text>
        </View>
      </ScoringScreen>
    );
  }

  if (!playlist) return <ScoringScreen />;

  return <PlaylistView playlist={playlist} />;
}
