import { bookshelfKeys } from '@/features/bookshelf/keys';
import { apiClient } from '@/lib/api-client';
import { PlaylistSchema, type Playlist } from '@underscore/shared';
import { useQuery } from '@tanstack/react-query';

async function fetchSavedPlaylist(playlistId: string): Promise<Playlist> {
  const { data } = await apiClient.get(`/api/bookshelf/${encodeURIComponent(playlistId)}`);
  return PlaylistSchema.parse(data);
}

/**
 * One saved playlist. A round trip of its own rather than a read of the list, because
 * the screen has to survive a deep link or a web reload with no bookshelf in memory.
 */
export function useSavedPlaylist(playlistId: string) {
  return useQuery({
    queryKey: bookshelfKeys.detail(playlistId),
    queryFn: () => fetchSavedPlaylist(playlistId),
    enabled: !!playlistId,
    // A saved playlist does not move; keep it across a back-navigation.
    staleTime: 5 * 60_000,
  });
}
