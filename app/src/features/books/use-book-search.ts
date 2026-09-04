import { bookKeys } from '@/features/books/keys';
import { apiClient } from '@/lib/api-client';
import { BookSearchResponseSchema, type BookCandidate } from '@underscore/shared';
import { useQuery } from '@tanstack/react-query';

/** A single character matches most of the catalog — not worth a round trip. */
export const MIN_QUERY_LENGTH = 2;

/**
 * The server hands back up to 20; eight is about what still reads as a shortlist. A
 * product rule, not a design one — the current design dropped the old "max 8 results"
 * line without replacing it. Open with the designer: get the number written back in.
 */
const MAX_RESULTS = 8;

async function searchBooks(query: string): Promise<BookCandidate[]> {
  const { data } = await apiClient.get('/api/books/search', { params: { q: query } });
  // Parse rather than cast: a server we have not redeployed yet is exactly when the
  // shape disagrees.
  return BookSearchResponseSchema.parse(data).results.slice(0, MAX_RESULTS);
}

/** Searching persists nothing; a hit is a candidate keyed by `googleBooksId`. */
export function useBookSearch(query: string) {
  const trimmed = query.trim();

  return useQuery({
    queryKey: bookKeys.search(trimmed),
    queryFn: () => searchBooks(trimmed),
    enabled: trimmed.length >= MIN_QUERY_LENGTH,
    // Results for a given term are stable; keep them through a back-navigation.
    staleTime: 5 * 60_000,
  });
}
