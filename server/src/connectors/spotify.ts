import { z } from "zod";
import type { AnchorSuggestion, Track } from "@underscore/shared";
import { env } from "../config/env";
import { ApiError } from "../lib/apiError";
import { createHttpClient } from "../lib/http";

/**
 * App-level Spotify — client credentials, no user involved. Catalog search during
 * generation only; playback and export use the per-user OAuth token instead.
 */

const accounts = createHttpClient({
  baseURL: env.SPOTIFY_ACCOUNTS_BASE_URL,
  name: "Spotify accounts",
});

const api = createHttpClient({
  baseURL: env.SPOTIFY_API_BASE_URL,
  name: "Spotify",
  // 401 means the app token went stale, which `resolveAnchor` fixes by refreshing.
  passThroughStatuses: [404, 401],
});

/** Refresh this far before expiry, so a token cannot lapse mid-playlist. */
const EXPIRY_MARGIN_MS = 60_000;

/** Anchors resolve in parallel; enough to keep 30 searches quick, few enough to not be throttled. */
const SEARCH_CONCURRENCY = 5;

const TokenSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
});

const SearchResultSchema = z.object({
  tracks: z
    .object({
      items: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          duration_ms: z.number(),
          artists: z.array(z.object({ name: z.string() })),
          album: z
            .object({ images: z.array(z.object({ url: z.string() })).optional() })
            .optional(),
        }),
      ),
    })
    .optional(),
});

let cachedToken: { value: string; expiresAt: number } | null = null;

async function fetchToken(): Promise<string> {
  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) {
    throw ApiError.upstreamUnavailable("Spotify is not configured");
  }

  const credentials = Buffer.from(
    `${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`,
  ).toString("base64");

  const response = await accounts.post(
    "/api/token",
    new URLSearchParams({ grant_type: "client_credentials" }),
    {
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  const parsed = TokenSchema.safeParse(response.data);
  if (!parsed.success) {
    throw ApiError.upstreamUnavailable("Spotify returned an unrecognized token", parsed.error);
  }

  cachedToken = {
    value: parsed.data.access_token,
    expiresAt: Date.now() + parsed.data.expires_in * 1000 - EXPIRY_MARGIN_MS,
  };
  return cachedToken.value;
}

async function accessToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) return cachedToken.value;
  return fetchToken();
}

/**
 * Spotify's field filters, which match far better than the bare words would: an anchor
 * is an artist and a title, not a free-text query.
 */
function searchQuery({ artist, title }: AnchorSuggestion): string {
  return `track:"${title}" artist:"${artist}"`;
}

async function search(anchor: AnchorSuggestion, token: string) {
  return api.get("/search", {
    params: { q: searchQuery(anchor), type: "track", limit: 1 },
    headers: { Authorization: `Bearer ${token}` },
  });
}

/** Null when the catalog has no match — the caller drops the anchor and carries on. */
async function resolveAnchor(anchor: AnchorSuggestion): Promise<Track | null> {
  let response = await search(anchor, await accessToken());

  // A token can be revoked before it expires. One refresh; a second 401 is credentials.
  if (response.status === 401) {
    cachedToken = null;
    response = await search(anchor, await accessToken());
    if (response.status === 401) {
      throw ApiError.upstreamUnavailable("Spotify rejected the app credentials");
    }
  }
  if (response.status === 404) return null;

  const parsed = SearchResultSchema.safeParse(response.data);
  if (!parsed.success) {
    throw ApiError.upstreamUnavailable("Spotify returned an unrecognized search result", parsed.error);
  }

  const item = parsed.data.tracks?.items[0];
  if (!item) return null;

  return {
    spotifyTrackId: item.id,
    name: item.name,
    artist: item.artists.map((a) => a.name).join(", "),
    albumArtUrl: item.album?.images?.[0]?.url ?? null,
    durationMs: item.duration_ms,
  };
}

/**
 * Resolved tracks in anchor order, misses dropped. Deduplicated by track id: Claude
 * repeats itself across 30 suggestions, and two anchors can resolve to one recording.
 */
export async function resolveAnchors(anchors: AnchorSuggestion[]): Promise<Track[]> {
  const resolved: (Track | null)[] = [];

  for (let start = 0; start < anchors.length; start += SEARCH_CONCURRENCY) {
    const batch = anchors.slice(start, start + SEARCH_CONCURRENCY);
    resolved.push(...(await Promise.all(batch.map(resolveAnchor))));
  }

  const seen = new Set<string>();
  return resolved.filter((track): track is Track => {
    if (!track || seen.has(track.spotifyTrackId)) return false;
    seen.add(track.spotifyTrackId);
    return true;
  });
}
