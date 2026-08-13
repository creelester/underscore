import { apiClient } from '@/lib/api-client';
import { BookSearchResponseSchema, type BookCandidate } from '@underscore/shared';
import { useQuery } from '@tanstack/react-query';

/** Query keys for anything book-shaped, so invalidations are never stringly-typed. */
const bookKeys = {
  all: ['books'] as const,
  search: (query: string) => [...bookKeys.all, 'search', query] as const,
};

/** A single character matches most of the catalog — not worth a round trip. */
const MIN_QUERY_LENGTH = 2;

async function searchBooks(query: string): Promise<BookCandidate[]> {
  const { data } = await apiClient.get('/api/books/search', { params: { q: query } });
  // Parse rather than cast: the response crosses a network boundary, and a
  // server we have not redeployed yet is exactly when the shape disagrees.
  return BookSearchResponseSchema.parse(data).results;
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
