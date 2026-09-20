import {
  ExportPlaylistResponseSchema,
  PlaylistSchema,
  type ExportPlaylistResponse,
} from '@underscore/shared';
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';

import { bookshelfKeys } from '@/features/bookshelf/keys';
import { apiClient } from '@/lib/api-client';

/**
 * Putting a playlist in the reader's Spotify. One module for two hooks because it is one
 * endpoint under two methods: `POST` is the first save, `PUT` a later sync. Both upsert
 * on the server, so neither has to know what the other did.
 *
 * Mutations, not queries — each one writes to the reader's Spotify account.
 */

function path(playlistId: string): string {
  return `/api/playlists/${encodeURIComponent(playlistId)}/export`;
}

/** The playlist on screen came from a cache, so it has to learn its own Spotify id. */
function recordExport(
  queryClient: QueryClient,
  playlistId: string,
  { spotifyPlaylistId }: ExportPlaylistResponse,
) {
  queryClient.setQueryData(bookshelfKeys.detail(playlistId), (cached: unknown) => {
    const playlist = PlaylistSchema.safeParse(cached);
    return playlist.success ? { ...playlist.data, spotifyPlaylistId } : cached;
  });
  queryClient.invalidateQueries({ queryKey: bookshelfKeys.list() });
}

export function useExportPlaylist(playlistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<ExportPlaylistResponse> => {
      const { data } = await apiClient.post(path(playlistId));
      return ExportPlaylistResponseSchema.parse(data);
    },
    onSuccess: (exported) => recordExport(queryClient, playlistId, exported),
  });
}

export function useSyncPlaylist(playlistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<ExportPlaylistResponse> => {
      const { data } = await apiClient.put(path(playlistId));
      return ExportPlaylistResponseSchema.parse(data);
    },
    // A sync can land on a new Spotify playlist: one the reader deleted there is remade.
    onSuccess: (synced) => recordExport(queryClient, playlistId, synced),
  });
}
