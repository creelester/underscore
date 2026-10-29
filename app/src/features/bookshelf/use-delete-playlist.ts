import { bookshelfKeys } from '@/features/bookshelf/keys';
import { apiClient } from '@/lib/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

/** Takes it off the shelf only — a copy already in the reader's Spotify stays theirs. */
export function useDeletePlaylist(playlistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await apiClient.delete(`/api/bookshelf/${encodeURIComponent(playlistId)}`);
    },
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: bookshelfKeys.detail(playlistId) });
      queryClient.invalidateQueries({ queryKey: bookshelfKeys.list() });
    },
  });
}
