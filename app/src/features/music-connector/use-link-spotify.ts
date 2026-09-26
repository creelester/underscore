import { useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

import { musicConnectorKeys } from '@/features/music-connector/keys';
import { fetchMusicConnectorStatus } from '@/features/music-connector/use-music-connector-status';
import { apiClient } from '@/lib/api-client';

/**
 * Connects the reader's Spotify, through our own connector rather than Better Auth's
 * account linking — linking a provider there means trusting it for sign-in too, which
 * would let an unverified Spotify address be linked into an existing account.
 *
 * Asked for the first time someone saves, never at sign-in: nobody should have to grant
 * playlist access to read a book.
 */

const AuthorizeResponseSchema = z.object({ url: z.string() });

/** Where Spotify sends the reader back. A deep link on native, the page itself on web. */
function returnUrl(): string {
  return Platform.OS === 'web' ? window.location.origin : Linking.createURL('/');
}

export function useLinkSpotify() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.get('/api/music-connector/authorize', {
        params: { returnUrl: returnUrl() },
      });
      const { url } = AuthorizeResponseSchema.parse(data);

      if (Platform.OS === 'web') {
        window.location.assign(url);
        // Never settles: the page is leaving, and resolving would let the caller report a
        // failure to connect in the instant before it does.
        return new Promise<never>(() => {});
      }

      await WebBrowser.openAuthSessionAsync(url, returnUrl());

      // Deliberately not branching on the browser result: a dismissed sheet and a refused
      // grant look identical from here. The server's answer is the only one worth having.
      const status = await fetchMusicConnectorStatus();
      queryClient.setQueryData(musicConnectorKeys.status(), status);
      return status;
    },
  });
}
