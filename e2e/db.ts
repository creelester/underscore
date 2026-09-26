import { randomUUID } from "node:crypto";

import { Client } from "pg";

import { E2E_DATABASE_URL } from "../playwright.config";

/**
 * A reader's Spotify connection, written straight into `spotifyConnection`.
 *
 * The handshake itself is fixturable now that it is ours (`SPOTIFY_ACCOUNTS_BASE_URL`
 * points it at the fixture server), and music-connector.spec.ts drives it end to end
 * once. This is the shortcut every other test takes: a connection in a chosen state,
 * without three redirects in front of each one.
 *
 * Not a `*.spec.ts`, so Playwright's default testMatch never collects it.
 */

/** A short-lived connection per call: a handful of rows a run, and no pool to tear down. */
async function withClient<T>(run: (client: Client) => Promise<T>): Promise<T> {
  const client = new Client({ connectionString: E2E_DATABASE_URL });
  await client.connect();
  try {
    return await run(client);
  } finally {
    await client.end();
  }
}

export type SpotifyLink = {
  /** Space-delimited, as Spotify grants them — `hasPlaylistScopes` also tolerates commas. */
  scope: string;
  /**
   * Handed straight back while it is fresh, and recorded by the fixture server on every
   * call it authorises, so a per-test value keeps one test's Spotify state to itself.
   */
  accessToken: string;
};

/**
 * Connects Spotify for `userId` as the callback would.
 *
 * The expiry is an hour out so `spotifyAccessToken` returns the token verbatim instead
 * of spending the refresh token first — the fixture would answer, but the test's own
 * token would no longer be the one Spotify sees. In UTC, because Prisma reads these
 * `timestamp` columns as UTC and `NOW()` is the server's local wall clock: west of
 * Greenwich, an hour ahead by that clock is hours in the past by Prisma's.
 */
export async function connectSpotify(
  userId: string,
  { scope, accessToken }: SpotifyLink,
): Promise<void> {
  await withClient((client) =>
    client.query(
      `INSERT INTO "spotifyConnection"
         (id, "userId", "spotifyUserId", "accessToken", "refreshToken",
          "accessTokenExpiresAt", scope, "createdAt", "updatedAt")
       SELECT $1, $2, $3, $4, $5, utc + INTERVAL '1 hour', $6, utc, utc
       FROM (SELECT NOW() AT TIME ZONE 'utc' AS utc) AS clock`,
      [
        randomUUID(),
        userId,
        `spotify-user-${randomUUID()}`,
        accessToken,
        `refresh-${randomUUID()}`,
        scope,
      ],
    ),
  );
}
