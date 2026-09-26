import { z } from "zod";
import { isAPIError } from "better-auth/api";
import type { AxiosResponse } from "axios";
import { spotifyPlaylistWebUrl } from "@underscore/shared";
import { env } from "../config/env";
import { ApiError } from "../lib/apiError";
import { auth } from "../lib/auth";
import { createHttpClient } from "../lib/http";

/**
 * User-level Spotify — the reader's own OAuth token, used to put a playlist in their
 * account. Separate from `spotify.ts`, which holds the app credentials that catalogue
 * search runs on: the two never share a token, and generation must keep working for a
 * reader who has linked nothing.
 */

const api = createHttpClient({
  baseURL: env.SPOTIFY_API_BASE_URL,
  name: "Spotify",
  // All three are answers we translate rather than outages: the token lapsed, it predates
  // the playlist scope, or the reader deleted the playlist on their side.
  passThroughStatuses: [401, 403, 404],
});

const CreatedPlaylistSchema = z.object({
  id: z.string(),
  external_urls: z.object({ spotify: z.string() }).optional(),
});

export type CreatedPlaylist = { spotifyPlaylistId: string; webUrl: string };

/**
 * The reader's token, refreshed when stale. Better Auth answers a missing account and a
 * failed refresh with the same status, so the code on its body is what tells them apart.
 * Anything else is rethrown rather than read as a lapsed link: selecting the account by
 * `providerId` is not a contract Better Auth promises to keep, and a version bump that
 * broke it would otherwise show up to readers as a Spotify problem they cannot fix.
 */
export async function spotifyAccessToken(userId: string): Promise<string> {
  try {
    const { accessToken } = await auth.api.getAccessToken({
      body: { providerId: "spotify", userId },
    });
    if (!accessToken) throw ApiError.spotifyNotLinked();
    return accessToken;
  } catch (err) {
    if (err instanceof ApiError) throw err;
    if (!isAPIError(err)) throw err;
    if (err.body?.code === "ACCOUNT_NOT_FOUND") throw ApiError.spotifyNotLinked();
    if (err.body?.code === "FAILED_TO_GET_ACCESS_TOKEN") throw ApiError.spotifyTokenExpired();
    throw err;
  }
}

/** 401 is a lapsed token; 403 is a token granted before we asked for the playlist scope. */
function assertAuthorized(response: AxiosResponse) {
  if (response.status === 401) throw ApiError.spotifyTokenExpired();
  if (response.status === 403) throw ApiError.spotifyNotLinked();
}

function authorized(token: string) {
  return { headers: { Authorization: `Bearer ${token}` } };
}

export async function createSpotifyPlaylist(
  token: string,
  { name, description }: { name: string; description: string },
): Promise<CreatedPlaylist> {
  const response = await api.post(
    "/me/playlists",
    { name, description, public: false },
    authorized(token),
  );
  assertAuthorized(response);

  const parsed = CreatedPlaylistSchema.safeParse(response.data);
  if (!parsed.success) {
    throw ApiError.upstreamUnavailable("Spotify returned an unrecognized playlist", parsed.error);
  }

  return {
    spotifyPlaylistId: parsed.data.id,
    webUrl: parsed.data.external_urls?.spotify ?? spotifyPlaylistWebUrl(parsed.data.id),
  };
}

/**
 * Name and description, each sent only when given. The playlist path itself was untouched
 * by the February 2026 rename, so this is `/playlists/{id}` and not `/items`. False when
 * Spotify has no such playlist any more.
 */
export async function updateSpotifyPlaylistDetails(
  token: string,
  spotifyPlaylistId: string,
  details: { name?: string; description?: string },
): Promise<boolean> {
  const response = await api.put(`/playlists/${spotifyPlaylistId}`, details, authorized(token));
  assertAuthorized(response);
  return response.status !== 404;
}

/** `/items`, not `/tracks` — the track-shaped paths were deprecated in February 2026. */
export async function addSpotifyItems(token: string, spotifyPlaylistId: string, uris: string[]) {
  const response = await api.post(
    `/playlists/${spotifyPlaylistId}/items`,
    { uris },
    authorized(token),
  );
  assertAuthorized(response);
  if (response.status === 404) {
    throw ApiError.upstreamUnavailable("Spotify no longer has the playlist we just created");
  }
}

/** False when Spotify has no such playlist any more — the reader deleted it on their side. */
export async function replaceSpotifyItems(
  token: string,
  spotifyPlaylistId: string,
  uris: string[],
): Promise<boolean> {
  const response = await api.put(
    `/playlists/${spotifyPlaylistId}/items`,
    { uris },
    authorized(token),
  );
  assertAuthorized(response);
  return response.status !== 404;
}
