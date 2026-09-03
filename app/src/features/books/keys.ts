/** Query keys for anything book-shaped, so invalidations are never stringly-typed. */
export const bookKeys = {
  all: ['books'] as const,
  search: (query: string) => [...bookKeys.all, 'search', query] as const,
  detail: (googleBooksId: string) => [...bookKeys.all, 'detail', googleBooksId] as const,
};
