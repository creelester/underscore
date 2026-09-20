import { randomUUID } from "node:crypto";

import { Client } from "pg";

import { E2E_DATABASE_URL } from "../playwright.config";

/**
 * The one thing the harness cannot drive over HTTP: the `account` row a Spotify OAuth
 * grant leaves behind.
 *
 * Better Auth hardcodes Spotify's authorize and token URLs, so `SPOTIFY_ACCOUNTS_BASE_URL`
 * — which only redirects our own client-credentials connector — cannot point the handshake
 * at the fixture server. There is no way to fake the round trip; the row is written
 * directly instead. Don't try to fixture the OAuth flow.
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
  /** Comma-joined, which is how Better Auth writes granted scopes — not space-delimited. */
  scope: string;
  /**
   * Handed straight back by `getAccessToken`, and recorded by the fixture server on every
   * call it authorises, so a per-test value keeps one test's Spotify state to itself.
   */
  accessToken: string;
};

/**
 * Links Spotify to `userId` as an OAuth grant would.
 *
 * Two details keep `auth.api.getAccessToken` from reaching the real accounts host, and
 * both are load-bearing: `refreshToken` stays null and the expiry is an hour out, so
 * Better Auth returns the token verbatim rather than refreshing it. The token is stored
 * in plain text because `account.encryptOAuthTokens` is off (the default) in
 * `server/src/lib/auth.ts` — turning it on would mean encrypting this one too.
 */
export async function linkSpotifyAccount(
  userId: string,
  { scope, accessToken }: SpotifyLink,
): Promise<void> {
  await withClient((client) =>
    client.query(
      `INSERT INTO "account"
         (id, "accountId", "providerId", "userId", "accessToken", scope,
          "accessTokenExpiresAt", "createdAt", "updatedAt")
       VALUES ($1, $2, 'spotify', $3, $4, $5, NOW() + INTERVAL '1 hour', NOW(), NOW())`,
      [randomUUID(), `spotify-${randomUUID()}`, userId, accessToken, scope],
    ),
  );
}
