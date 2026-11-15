import type { MusicConnectorStatusResponse } from '@underscore/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { musicConnectorKeys } from '@/features/music-connector/keys';
import { apiClient } from '@/lib/api-client';

/** Forgets the grant only — playlists already saved to Spotify stay there. */
export function useDisconnectSpotify() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (): Promise<void> => {
      await apiClient.delete('/api/music-connector');
    },
    onSuccess: () => {
      queryClient.setQueryData<MusicConnectorStatusResponse>(musicConnectorKeys.status(), {
        linked: false,
        provider: 'spotify',
      });
    },
  });
}
