/** Query keys for the demo account, so invalidations are never stringly-typed. */
export const demoKeys = {
  all: ['demo'] as const,
  availability: () => [...demoKeys.all, 'availability'] as const,
};
