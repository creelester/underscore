import { SPOTIFY_PLAYLIST_SCOPES } from '@underscore/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { musicConnectorKeys } from '@/features/music-connector/keys';
import { fetchMusicConnectorStatus } from '@/features/music-connector/use-music-connector-status';
import { authClient } from '@/lib/auth-client';

/**
 * Grants the playlist scope on the reader's Spotify. `linkSocial` rather than
 * `signIn.social`: they are already signed in, possibly with Spotify itself, and this
 * only widens what that link may do. Better Auth re-links an existing provider to add
 * scopes rather than refusing it.
 *
 * Asked for here and not at sign-in, so nobody is made to grant playlist access to read
 * a book — the MVP requests it the first time someone saves.
 */
export function useLinkSpotify() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await authClient.linkSocial({
        provider: 'spotify',
        scopes: [...SPOTIFY_PLAYLIST_SCOPES],
        // Relative, so the Expo plugin turns it into a deep link back into the app.
        callbackURL: '/',
      });
      if (error) throw new Error(error.message ?? 'Could not connect Spotify.');

      // The plugin consumes the browser result itself and resolves silently when the
      // redirect carries no cookie, so a refused grant and a dismissed browser both look
      // like success. The server's answer is the only thing worth believing.
      const status = await fetchMusicConnectorStatus();
      queryClient.setQueryData(musicConnectorKeys.status(), status);
      return status;
    },
  });
}
