import { moodKeys } from '@/features/mood/keys';
import { apiClient } from '@/lib/api-client';
import { MoodProfileResponseSchema, type MoodProfile } from '@underscore/shared';
import { useQuery } from '@tanstack/react-query';

async function fetchMoodProfile(googleBooksId: string): Promise<MoodProfile> {
  const { data } = await apiClient.post('/api/mood-profile', { googleBooksId });
  return MoodProfileResponseSchema.parse(data).profile;
}

/**
 * Claude's read of one book. A query despite the POST — the endpoint persists nothing,
 * and it is a billed round trip, so stepping back to book detail and forward again has
 * to serve the same read rather than pay for a second one that could differ from the
 * corrections on screen.
 */
export function useMoodProfile(googleBooksId: string) {
  return useQuery({
    queryKey: moodKeys.profile(googleBooksId),
    queryFn: () => fetchMoodProfile(googleBooksId),
    enabled: !!googleBooksId,
    // A book's read does not move; only a fresh mount of the app should re-run it.
    staleTime: Infinity,
  });
}
