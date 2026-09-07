/** Query keys for the mood engine, so invalidations are never stringly-typed. */
export const moodKeys = {
  all: ['mood'] as const,
  profile: (googleBooksId: string) => [...moodKeys.all, 'profile', googleBooksId] as const,
};
