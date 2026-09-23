import { randomBytes } from "node:crypto";
import { z } from "zod";
import { SPOTIFY_PLAYLIST_SCOPES, type MusicConnectorStatusResponse } from "@underscore/shared";
import { env } from "../config/env";
import { ApiError } from "../lib/apiError";
import { createHttpClient } from "../lib/http";
import { prisma } from "../lib/prisma";

/**
 * The reader's Spotify grant: obtaining it, storing it, and keeping it fresh. Ours rather
 * than Better Auth's, because linking a provider there means trusting it for sign-in too.
 */

const accounts = createHttpClient({
  baseURL: env.SPOTIFY_ACCOUNTS_BASE_URL,
  name: "Spotify accounts",
  // A refused refresh is an answer — the reader revoked us — not an outage.
  passThroughStatuses: [400, 401],
});

const api = createHttpClient({ baseURL: env.SPOTIFY_API_BASE_URL, name: "Spotify" });

/** Refresh this far before expiry, so a token cannot lapse mid-export. */
const EXPIRY_MARGIN_MS = 60_000;

/** Long enough to read a consent screen, short enough to be worthless if leaked. */
const STATE_TTL_MS = 10 * 60 * 1000;

export const SPOTIFY_CALLBACK_PATH = "/api/music-connector/callback";

const TokenSchema = z.object({
  access_token: z.string(),
  expires_in: z.number(),
  refresh_token: z.string().optional(),
  scope: z.string().optional(),
});

function credentials(): string {
  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) {
    throw ApiError.upstreamUnavailable("Spotify is not configured");
  }
  return Buffer.from(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`).toString("base64");
}

function redirectUri(): string {
  return `${env.BETTER_AUTH_URL}${SPOTIFY_CALLBACK_PATH}`;
}

/**
 * Where the reader is sent to consent. `show_dialog` is deliberately absent: Spotify
 * answers it with a bare `server_error`, which costs hours to attribute.
 */
export async function beginSpotifyAuth(userId: string, returnUrl: string): Promise<string> {
  const state = randomBytes(32).toString("base64url");

  await prisma.spotifyAuthState.create({
    data: { state, userId, returnUrl, expiresAt: new Date(Date.now() + STATE_TTL_MS) },
  });

  const url = new URL("/authorize", env.SPOTIFY_ACCOUNTS_BASE_URL);
  url.search = new URLSearchParams({
    client_id: env.SPOTIFY_CLIENT_ID,
    response_type: "code",
    redirect_uri: redirectUri(),
    scope: SPOTIFY_PLAYLIST_SCOPES.join(" "),
    state,
  }).toString();

  return url.toString();
}

/** Single-use: the row is consumed whether or not the exchange that follows succeeds. */
export async function consumeAuthState(state: string) {
  const row = await prisma.spotifyAuthState.findUnique({ where: { state } });
  if (row) await prisma.spotifyAuthState.delete({ where: { id: row.id } });

  if (!row || row.expiresAt < new Date()) {
    throw ApiError.invalidInput("That Spotify authorization has expired. Try connecting again.");
  }
  return row;
}

export async function completeSpotifyAuth(userId: string, code: string): Promise<void> {
  const response = await accounts.post(
    "/api/token",
    new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: redirectUri() }),
    {
      headers: {
        Authorization: `Basic ${credentials()}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  const token = TokenSchema.safeParse(response.data);
  if (response.status >= 400 || !token.success) {
    throw ApiError.invalidInput("Spotify refused that authorization. Try connecting again.");
  }
  if (!token.data.refresh_token) {
    // Without one the grant dies in an hour and there is no way to renew it.
    throw ApiError.upstreamUnavailable("Spotify returned no refresh token");
  }

  const profile = await api.get("/me", {
    headers: { Authorization: `Bearer ${token.data.access_token}` },
  });
  const spotifyUserId = z.object({ id: z.string() }).safeParse(profile.data);
  if (!spotifyUserId.success) {
    throw ApiError.upstreamUnavailable("Spotify returned an unrecognized profile");
  }

  const fields = {
    spotifyUserId: spotifyUserId.data.id,
    accessToken: token.data.access_token,
    refreshToken: token.data.refresh_token,
    accessTokenExpiresAt: new Date(Date.now() + token.data.expires_in * 1000),
    scope: token.data.scope ?? SPOTIFY_PLAYLIST_SCOPES.join(" "),
  };

  await prisma.spotifyConnection.upsert({
    where: { userId },
    create: { userId, ...fields },
    update: fields,
  });
}

/** The reader's token, refreshed when it is close enough to expiry to be risky. */
export async function spotifyAccessToken(userId: string): Promise<string> {
  const connection = await prisma.spotifyConnection.findUnique({ where: { userId } });
  if (!connection) throw ApiError.spotifyNotLinked();

  if (connection.accessTokenExpiresAt.getTime() - Date.now() > EXPIRY_MARGIN_MS) {
    return connection.accessToken;
  }

  const response = await accounts.post(
    "/api/token",
    new URLSearchParams({ grant_type: "refresh_token", refresh_token: connection.refreshToken }),
    {
      headers: {
        Authorization: `Basic ${credentials()}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );

  const token = TokenSchema.safeParse(response.data);
  if (response.status >= 400 || !token.success) {
    // The reader revoked us, or the grant lapsed. Only re-consenting fixes it.
    throw ApiError.spotifyTokenExpired();
  }

  await prisma.spotifyConnection.update({
    where: { userId },
    data: {
      accessToken: token.data.access_token,
      accessTokenExpiresAt: new Date(Date.now() + token.data.expires_in * 1000),
      // Spotify only returns a new refresh token sometimes; the old one stays valid.
      ...(token.data.refresh_token ? { refreshToken: token.data.refresh_token } : {}),
    },
  });

  return token.data.access_token;
}

export async function spotifyLinkStatus(userId: string): Promise<MusicConnectorStatusResponse> {
  const connection = await prisma.spotifyConnection.findUnique({
    where: { userId },
    select: { scope: true },
  });

  return { linked: hasPlaylistScopes(connection?.scope), provider: "spotify" };
}

export async function disconnectSpotify(userId: string): Promise<void> {
  await prisma.spotifyConnection.deleteMany({ where: { userId } });
}

/** Spotify delimits granted scopes with spaces; tolerate commas in case a row predates that. */
function hasPlaylistScopes(scope: string | null | undefined): boolean {
  if (!scope) return false;

  const granted = new Set(scope.split(/[,\s]+/).filter(Boolean));
  return SPOTIFY_PLAYLIST_SCOPES.every((required) => granted.has(required));
}
