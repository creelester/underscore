import { bookshelfKeys } from '@/features/bookshelf/keys';
import { apiClient } from '@/lib/api-client';
import {
  BookshelfResponseSchema,
  MAX_BOOKSHELF_LIMIT,
  type Playlist,
} from '@underscore/shared';
import { useQuery } from '@tanstack/react-query';

/**
 * The saved playlists, newest first. One page at the endpoint's maximum: the library
 * home scrolls as one list with no paging affordance, so `nextCursor` goes unread
 * until there is somewhere to hang a "load more".
 */
async function fetchBookshelf(): Promise<Playlist[]> {
  const { data } = await apiClient.get('/api/bookshelf', {
    params: { limit: MAX_BOOKSHELF_LIMIT },
  });
  return BookshelfResponseSchema.parse(data).playlists;
}

export function useBookshelf() {
  return useQuery({
    queryKey: bookshelfKeys.list(),
    queryFn: fetchBookshelf,
    // Scoring a book writes to this list, and `useGeneratePlaylist` invalidates it.
    staleTime: 60_000,
  });
}
