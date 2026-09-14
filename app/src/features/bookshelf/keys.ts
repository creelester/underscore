/** Query keys for the saved bookshelf, so invalidations are never stringly-typed. */
export const bookshelfKeys = {
  all: ['bookshelf'] as const,
  list: () => [...bookshelfKeys.all, 'list'] as const,
  detail: (playlistId: string) => [...bookshelfKeys.all, 'detail', playlistId] as const,
};
