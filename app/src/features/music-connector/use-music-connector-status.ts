import {
  MusicConnectorStatusResponseSchema,
  type MusicConnectorStatusResponse,
} from '@underscore/shared';
import { useQuery } from '@tanstack/react-query';

import { musicConnectorKeys } from '@/features/music-connector/keys';
import { apiClient } from '@/lib/api-client';

/** Exported so the link flow can re-read the answer without a cached value in the way. */
export async function fetchMusicConnectorStatus(): Promise<MusicConnectorStatusResponse> {
  const { data } = await apiClient.get('/api/music-connector/status');
  return MusicConnectorStatusResponseSchema.parse(data);
}

/**
 * Whether Spotify is linked well enough to write a playlist. `linked` is false for a
 * reader who signed in *with* Spotify and never granted the playlist scope, so this is
 * what decides between saving and asking to connect.
 */
export function useMusicConnectorStatus() {
  return useQuery({
    queryKey: musicConnectorKeys.status(),
    queryFn: fetchMusicConnectorStatus,
    // Linking happens in a browser we hand off to, so a stale `false` would strand the
    // reader on the connect step after they have already granted it.
    staleTime: 0,
  });
}
