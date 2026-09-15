import { bookshelfKeys } from '@/features/bookshelf/keys';
import { apiClient } from '@/lib/api-client';
import { PlaylistSchema, type GeneratePlaylistRequest, type Playlist } from '@underscore/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/**
 * Far past the client's default: this one request is Claude's ~20 anchors plus a Spotify
 * lookup each, run twice if too few resolve. At the default 15s it always aborted
 * mid-pipeline and surfaced as `UPSTREAM_UNAVAILABLE`.
 */
const GENERATE_TIMEOUT_MS = 180_000;

async function generatePlaylist(request: GeneratePlaylistRequest): Promise<Playlist> {
  const { data } = await apiClient.post('/api/playlists/generate', request, {
    timeout: GENERATE_TIMEOUT_MS,
  });
  return PlaylistSchema.parse(data);
}

/**
 * A mutation, not a query: generation writes a `Playlist` row, so it must never be
 * re-run by a refetch or a remount the way a cached read would be.
 */
export function useGeneratePlaylist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: generatePlaylist,
    // The new playlist heads `RECENT` on the way back to the library.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: bookshelfKeys.all }),
  });
}
