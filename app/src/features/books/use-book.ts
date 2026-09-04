import { bookKeys } from '@/features/books/keys';
import { apiClient } from '@/lib/api-client';
import { BookDetailResponseSchema, type BookCandidate, type BookDetail } from '@underscore/shared';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';

/** What a search hit is missing relative to a detail read. */
const NO_CATALOGUE_FACTS = {
  publisher: null,
  publishedDate: null,
  language: null,
  averageRating: null,
  ratingsCount: null,
} as const;

async function fetchBook(googleBooksId: string): Promise<BookDetail> {
  const { data } = await apiClient.get(`/api/books/${encodeURIComponent(googleBooksId)}`);
  return BookDetailResponseSchema.parse(data).book;
}

/**
 * The volume already in a search result, widened to the detail shape, so arriving
 * from a library row paints immediately instead of flashing a load.
 *
 * Scanned across cached searches rather than looked up by key: the key carries the
 * query string and the screen does not know it. Memoised because it feeds two
 * options React Query would otherwise call on every render.
 */
function cachedCandidate(
  queryClient: QueryClient,
  googleBooksId: string,
): { book: BookDetail; updatedAt: number } | undefined {
  for (const [key, results] of queryClient.getQueriesData<BookCandidate[]>({
    // Matches every cached search and nothing else; `bookKeys.all` would also match
    // detail entries, whose data is a candidate rather than a list.
    queryKey: [...bookKeys.all, 'search'],
  })) {
    const candidate = results?.find((result) => result.googleBooksId === googleBooksId);
    if (candidate) {
      return {
        // Facts are absent rather than empty until the detail fetch lands, and
        // `bookFacts` drops absent rows, so the table fills in without placeholders.
        book: { ...candidate, ...NO_CATALOGUE_FACTS },
        updatedAt: queryClient.getQueryState(key)?.dataUpdatedAt ?? 0,
      };
    }
  }
}

/**
 * One volume by its Google id. A round trip of its own rather than a read of the
 * search results, because the screen has to survive a deep link or a web reload
 * with no search in this session; `cachedCandidate` seeds it where it can.
 */
export function useBook(googleBooksId: string) {
  const queryClient = useQueryClient();
  const seed = useMemo(
    () => cachedCandidate(queryClient, googleBooksId),
    [queryClient, googleBooksId],
  );

  return useQuery({
    queryKey: bookKeys.detail(googleBooksId),
    queryFn: () => fetchBook(googleBooksId),
    enabled: !!googleBooksId,
    initialData: seed?.book,
    // Without the real timestamp React Query treats the seeded hit as fresh now, and
    // a ten-minute-old search would sit past its `staleTime` without refetching.
    initialDataUpdatedAt: seed?.updatedAt,
    // A volume's metadata does not move; keep it across a back-navigation.
    staleTime: 5 * 60_000,
  });
}
