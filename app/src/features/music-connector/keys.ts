/** Query keys for the music connector, so invalidations are never stringly-typed. */
export const musicConnectorKeys = {
  all: ['music-connector'] as const,
  status: () => [...musicConnectorKeys.all, 'status'] as const,
};
