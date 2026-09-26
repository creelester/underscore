import { SPOTIFY_PLAYLIST_SCOPES, type MusicConnectorStatusResponse } from "@underscore/shared";
import { prisma } from "../lib/prisma";

/**
 * Whether the reader's Spotify link can actually write a playlist. Signing in *with*
 * Spotify leaves an account row carrying only identity scopes, so row existence is not
 * the question — calling that linked would hand the app a button that dies at the
 * Spotify call.
 */
export async function spotifyLinkStatus(userId: string): Promise<MusicConnectorStatusResponse> {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: "spotify" },
    select: { scope: true },
  });

  return { linked: hasPlaylistScopes(account?.scope), provider: "spotify" };
}

/** Better Auth stores granted scopes comma-joined, not space-delimited as OAuth sends them. */
function hasPlaylistScopes(scope: string | null | undefined): boolean {
  if (!scope) return false;

  const granted = new Set(scope.split(/[,\s]+/).filter(Boolean));
  return SPOTIFY_PLAYLIST_SCOPES.every((required) => granted.has(required));
}
