import { bookKeys } from '@/features/books/keys';
import { apiClient } from '@/lib/api-client';
import { BookDetailResponseSchema, type BookCandidate, type BookDetail } from '@underscore/shared';
import { useQuery, useQueryClient, type QueryClient } from '@tanstack/react-query';

/** What a search hit is missing relative to a detail read. */
const NO_CATALOGUE_FACTS = {
  publisher: null,
  publishedDate: null,
  language: null,
  isbn13: null,
  averageRating: null,
  ratingsCount: null,
} as const;

async function fetchBook(googleBooksId: string): Promise<BookDetail> {
  const { data } = await apiClient.get(`/api/books/${encodeURIComponent(googleBooksId)}`);
  return BookDetailResponseSchema.parse(data).book;
}

/**
 * The volume already sitting in a search result, if the user got here by tapping
 * a library row, widened to the detail shape. It covers everything above the
 * fold, so the screen can paint from it immediately instead of flashing a load
 * on the one path that always has most of the answer already.
 *
 * Scanned across every cached search rather than looked up by key, because the
 * key carries the query string the user typed and the screen does not know it.
 */
function cachedCandidate(
  queryClient: QueryClient,
  googleBooksId: string,
): { book: BookDetail; updatedAt: number } | undefined {
  for (const [key, results] of queryClient.getQueriesData<BookCandidate[]>({
    // The prefix of `bookKeys.search`, so this matches every cached search and
    // nothing else. `bookKeys.all` would also match the detail entries, whose
    // data is a single candidate rather than a list.
    queryKey: [...bookKeys.all, 'search'],
  })) {
    const candidate = results?.find((result) => result.googleBooksId === googleBooksId);
    if (candidate) {
      return {
        // A search hit carries everything above the fold — cover, title, blurb —
        // and none of the facts table, which only the detail endpoint returns.
        // Those rows are absent rather than empty until the fetch lands, and
        // `bookFacts` drops absent rows, so the table fills in instead of
        // flashing placeholders.
        book: { ...candidate, ...NO_CATALOGUE_FACTS },
        updatedAt: queryClient.getQueryState(key)?.dataUpdatedAt ?? 0,
      };
    }
  }
}

/**
 * One volume by its Google id, for the book detail screen.
 *
 * A round trip of its own rather than a read of the search results, because the
 * screen has to survive a deep link and a web reload, when no search has run in
 * this session. The cache seeds it where it can — see `cachedCandidate` — and
 * the real timestamp goes with it so a stale hit still refetches on schedule
 * rather than being treated as fresh.
 */
export function useBook(googleBooksId: string) {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: bookKeys.detail(googleBooksId),
    queryFn: () => fetchBook(googleBooksId),
    enabled: !!googleBooksId,
    initialData: () => cachedCandidate(queryClient, googleBooksId)?.book,
    initialDataUpdatedAt: () => cachedCandidate(queryClient, googleBooksId)?.updatedAt,
    // A volume's metadata does not move; keep it across a back-navigation, as
    // search does with its results.
    staleTime: 5 * 60_000,
  });
}
