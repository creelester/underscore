import { apiClient } from '@/lib/api-client';
import { BookSearchResponseSchema, type BookCandidate } from '@underscore/shared';
import { useQuery } from '@tanstack/react-query';

/** Query keys for anything book-shaped, so invalidations are never stringly-typed. */
const bookKeys = {
  all: ['books'] as const,
  search: (query: string) => [...bookKeys.all, 'search', query] as const,
};

/** A single character matches most of the catalog — not worth a round trip. */
export const MIN_QUERY_LENGTH = 2;

/**
 * The server hands back up to 20 volumes.
 *
 * This is a product rule, not a design one. The current design dropped the old
 * screen's explicit "max 8 results, no infinite scroll" line without replacing
 * it, and the prototype caps nothing — but its fixture set is only six books, so
 * a cap could never have shown up there either. The design is silent rather than
 * contradictory, and eight rows is about what fits before the list stops reading
 * as a shortlist and starts reading as a dump.
 *
 * Open with the designer: get the number written back into the design README so
 * it stops living only here.
 */
const MAX_RESULTS = 8;

async function searchBooks(query: string): Promise<BookCandidate[]> {
  const { data } = await apiClient.get('/api/books/search', { params: { q: query } });
  // Parse rather than cast: the response crosses a network boundary, and a
  // server we have not redeployed yet is exactly when the shape disagrees.
  return BookSearchResponseSchema.parse(data).results.slice(0, MAX_RESULTS);
}

/**
 * Search Google Books through our API. Nothing is persisted by searching — a
 * result is a candidate carrying `googleBooksId`, which is what the generation
 * endpoints take.
 */
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
