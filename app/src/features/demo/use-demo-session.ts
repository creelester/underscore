import { DemoAvailabilityResponseSchema } from '@underscore/shared';
import { useMutation, useQuery } from '@tanstack/react-query';

import { demoKeys } from '@/features/demo/keys';
import { apiClient } from '@/lib/api-client';
import { authClient } from '@/lib/auth-client';

/**
 * Whether this deployment has a demo account configured. Asked rather than assumed so the
 * splash never offers a button that cannot work — the credentials live only on the server.
 */
export function useDemoAvailability() {
  return useQuery({
    queryKey: demoKeys.availability(),
    queryFn: async () => {
      const { data } = await apiClient.get('/api/demo-session');
      return DemoAvailabilityResponseSchema.parse(data);
    },
    // Fixed at deploy time, so re-asking during a visit buys nothing.
    staleTime: Infinity,
  });
}

/**
 * Signs the browser in as the demo reader. The server answers with Better Auth's own
 * session cookie, so the session is re-read from it rather than built from the response.
 */
export function useDemoSession() {
  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/api/demo-session');

      const { data } = await authClient.getSession();
      if (!data) throw new Error('The demo session did not take');
    },
  });
}
