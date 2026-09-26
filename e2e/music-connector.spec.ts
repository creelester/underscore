import { randomUUID } from "node:crypto";

import { expect, request, test as base, type APIRequestContext } from "@playwright/test";
import {
  ApiErrorSchema,
  ExportPlaylistResponseSchema,
  MusicConnectorStatusResponseSchema,
  PlaylistSchema,
  SPOTIFY_PLAYLIST_SCOPES,
  type Playlist,
  type UpdateExportRequest,
} from "@underscore/shared";

import { E2E_API_URL, E2E_UPSTREAM_URL } from "../playwright.config";
import { connectSpotify } from "./db";
import { fixtureBook } from "./fixtures/catalog";
import type { FixtureSpotifyPlaylist } from "./fixtures/spotify-user";
import { GENERATE_TIMEOUT_MS, signUpOverApi } from "./helpers";

/**
 * The Music Connector: connecting a reader's Spotify (`GET /api/music-connector/authorize`
 * and `/callback`, `DELETE /api/music-connector`), whether that connection can write a
 * playlist (`GET /api/music-connector/status`), and putting one there
 * (`POST` / `PUT /api/playlists/:playlistId/export`).
 *
 * Driven over HTTP, like `rate-limit.spec.ts`: neither route has a screen yet, so nothing
 * the app renders is part of the contract under test and there is no page to open.
 *
 * A sync carries only the fields that changed, so the last group here is about what a
 * body leaves alone as much as about what it changes.
 *
 * What Spotify was asked to do is read back off the fixture server's own record
 * (`fixtures/spotify-user.ts`), which is what makes a created playlist distinguishable
 * from a filled one and a replace from an append. What *we* remember of it is read back
 * off `GET /api/bookshelf/:playlistId` rather than out of the database.
 *
 * Every reader here is minted by this spec, scores its own playlist and carries its own
 * Spotify token, so nothing shared is mutated and no two tests can see each other's
 * playlists in the fixture. The consent round trip is driven once, for real; every other
 * test seeds the connection it needs with `connectSpotify`.
 */

/** A grant from before we asked for the playlist scope: identity, and nothing writable. */
const IDENTITY_SCOPES = "user-read-email user-read-private";

/**
 * A real grant keeps the identity scopes alongside the one we asked for, so the status
 * check has to be set membership rather than equality. Space-delimited, as Spotify sends it.
 */
const EXPORT_SCOPES = ["user-read-email", ...SPOTIFY_PLAYLIST_SCOPES].join(" ");

const BOOK = fixtureBook("e2e-lantern");

type Reader = {
  api: APIRequestContext;
  userId: string;
  /**
   * The access token its `spotifyConnection` row carries; the fixture keys its playlists
   * on it.
   */
  spotifyToken: string;
};

/** Mints a reader. With a `scope`, Spotify is connected at it; without, not at all. */
type NewReader = (scope?: string) => Promise<Reader>;

/** The fixture server's record of what user-level Spotify was asked to do. */
type SpotifyFixture = {
  playlistsFor(token: string): Promise<FixtureSpotifyPlaylist[]>;
  /** As if the reader deleted it in Spotify: the next sync then finds it gone. */
  deleteInSpotify(id: string): Promise<void>;
  /** Makes Spotify answer this token 401 (lapsed) or 403 (granted without the scope). */
  revoke(token: string, status: 401 | 403): Promise<void>;
};

const test = base.extend<{
  newReader: NewReader;
  spotify: SpotifyFixture;
  signedOut: APIRequestContext;
}>({
  newReader: async ({}, use) => {
    const readers: Reader[] = [];

    await use(async (scope) => {
      const { api } = await signUpOverApi("music-connector");
      const me = await api.get("/api/me");
      expect(me.status()).toBe(200);
      const { user } = (await me.json()) as { user: { id: string } };

      const reader: Reader = {
        api,
        userId: user.id,
        spotifyToken: `spotify-reader-token-${randomUUID()}`,
      };
      if (scope) {
        await connectSpotify(reader.userId, { scope, accessToken: reader.spotifyToken });
      }

      readers.push(reader);
      return reader;
    });

    for (const reader of readers) await reader.api.dispose();
  },

  spotify: async ({}, use) => {
    const api = await request.newContext({ baseURL: E2E_UPSTREAM_URL });

    await use({
      async playlistsFor(token) {
        const response = await api.get("/e2e/spotify/playlists", { params: { token } });
        expect(response.status()).toBe(200);
        return ((await response.json()) as { playlists: FixtureSpotifyPlaylist[] }).playlists;
      },
      async deleteInSpotify(id) {
        const response = await api.delete(`/e2e/spotify/playlists/${id}`);
        expect(await response.json()).toMatchObject({ deleted: true });
      },
      async revoke(token, status) {
        const response = await api.post("/e2e/spotify/revoke", { data: { token, status } });
        expect(response.status()).toBe(200);
      },
    });

    await api.dispose();
  },

  /**
   * The browser the consent redirects arrive in — no session, which is the point: on
   * native the callback lands in a browser that has none. Absolute URLs only, since each
   * hop is a `Location` off the one before.
   */
  signedOut: async ({}, use) => {
    const api = await request.newContext();
    await use(api);
    await api.dispose();
  },
});

test.skip(({ isMobile }) => isMobile, "API-level; a second device project adds no coverage");

/** One saved playlist of this reader's own, scored through the whole pipeline. */
async function score(reader: Reader): Promise<Playlist> {
  const response = await reader.api.post("/api/playlists/generate", {
    data: { googleBooksId: BOOK.googleBooksId },
    timeout: GENERATE_TIMEOUT_MS,
  });
  expect(response.status(), await response.text()).toBe(200);

  return PlaylistSchema.parse(await response.json());
}

/** What the tracks of `playlist` should arrive in Spotify as, in order. */
function expectedUris(playlist: Playlist): string[] {
  return playlist.tracks.map(({ track }) => `spotify:track:${track.spotifyTrackId}`);
}

/** What we remember of a playlist, read back the way the app would read it. */
async function storedPlaylist(reader: Reader, playlistId: string): Promise<Playlist> {
  const response = await reader.api.get(`/api/bookshelf/${playlistId}`);
  expect(response.status()).toBe(200);

  return PlaylistSchema.parse(await response.json());
}

async function storedSpotifyPlaylistId(reader: Reader, playlistId: string) {
  return (await storedPlaylist(reader, playlistId)).spotifyPlaylistId;
}

async function status(reader: Reader) {
  const response = await reader.api.get("/api/music-connector/status");
  expect(response.status()).toBe(200);

  return MusicConnectorStatusResponseSchema.parse(await response.json());
}

const exportPlaylist = (reader: Reader, playlistId: string) =>
  reader.api.post(`/api/playlists/${playlistId}/export`);

/** No `update` sends no body at all, which is the sync that predates the body. */
const syncPlaylist = (reader: Reader, playlistId: string, update?: UpdateExportRequest) =>
  reader.api.put(
    `/api/playlists/${playlistId}/export`,
    update === undefined ? undefined : { data: update },
  );

/** For bodies the schema should reject — none of them type-check as an `UpdateExportRequest`. */
const syncWithBody = (reader: Reader, playlistId: string, body: Record<string, unknown>) =>
  reader.api.put(`/api/playlists/${playlistId}/export`, { data: body });

/** The reader's one playlist in Spotify. A second would mean something created it twice. */
async function inSpotify(spotify: SpotifyFixture, token: string): Promise<FixtureSpotifyPlaylist> {
  const mine = await spotify.playlistsFor(token);
  expect(mine).toHaveLength(1);

  return mine[0];
}

/**
 * The consent round trip, hop by hop. The redirects are followed by hand rather than by
 * the client, because each hop *is* the contract — and because the last one is
 * `underscore://`, which no HTTP client can fetch.
 */
test.describe("connecting Spotify", () => {
  /** The app's own scheme, one of the two the server will send a reader back to. */
  const RETURN_URL = "underscore://spotify";

  const param = (url: URL, name: string) => url.searchParams.get(name) ?? "";

  const follow = (signedOut: APIRequestContext, location: string) =>
    signedOut.get(location, { maxRedirects: 0 });

  /** Where the reader is sent to consent, carrying the state that will bring them back. */
  async function consentUrl(reader: Reader): Promise<URL> {
    const response = await reader.api.get("/api/music-connector/authorize", {
      params: { returnUrl: RETURN_URL },
    });
    expect(response.status(), await response.text()).toBe(200);

    return new URL(((await response.json()) as { url: string }).url);
  }

  test("connects the reader through the consent round trip", async ({ newReader, signedOut }) => {
    const reader = await newReader();

    const consent = await consentUrl(reader);
    expect(consent.origin).toBe(new URL(E2E_UPSTREAM_URL).origin);
    expect(param(consent, "redirect_uri")).toBe(`${E2E_API_URL}/api/music-connector/callback`);
    // Asked for at consent time, or nothing the reader does later can write a playlist.
    expect(param(consent, "scope").split(" ")).toEqual(
      expect.arrayContaining([...SPOTIFY_PLAYLIST_SCOPES]),
    );

    const granted = await follow(signedOut, consent.toString());
    expect(granted.status()).toBe(302);

    const callback = await follow(signedOut, granted.headers().location);
    expect(callback.status()).toBe(302);
    expect(callback.headers().location).toBe(`${RETURN_URL}?spotify=connected`);

    expect(await status(reader)).toEqual({ linked: true, provider: "spotify" });
  });

  test("leaves the reader unconnected when consent is refused", async ({
    newReader,
    signedOut,
  }) => {
    const reader = await newReader();
    const consent = await consentUrl(reader);

    // What a refused consent screen sends back: the state, an error, and no code.
    const refused = new URL(param(consent, "redirect_uri"));
    refused.searchParams.set("state", param(consent, "state"));
    refused.searchParams.set("error", "access_denied");

    const callback = await follow(signedOut, refused.toString());
    expect(callback.status()).toBe(302);
    expect(callback.headers().location).toBe(`${RETURN_URL}?spotify=denied`);

    expect(await status(reader)).toEqual({ linked: false, provider: "spotify" });
  });

  test("spends the state, so the same callback cannot be replayed", async ({
    newReader,
    signedOut,
  }) => {
    const reader = await newReader();
    const granted = await follow(signedOut, (await consentUrl(reader)).toString());
    const landing = granted.headers().location;

    expect((await follow(signedOut, landing)).status()).toBe(302);

    const replay = await follow(signedOut, landing);
    expect(replay.status()).toBe(400);
    expect(ApiErrorSchema.parse(await replay.json())).toMatchObject({
      code: "INVALID_INPUT",
      retryable: false,
    });
  });

  // Without this the callback is an open redirect: anyone could have Spotify's round
  // trip deliver a reader to a page of theirs.
  test("refuses to start a flow that would return anywhere but the app", async ({ newReader }) => {
    const reader = await newReader();

    const response = await reader.api.get("/api/music-connector/authorize", {
      params: { returnUrl: "https://not-the-app.example/anywhere" },
    });
    expect(response.status()).toBe(400);
    expect(ApiErrorSchema.parse(await response.json())).toMatchObject({ code: "INVALID_INPUT" });
  });

  test("forgets the connection when the reader disconnects", async ({ newReader }) => {
    const reader = await newReader(EXPORT_SCOPES);
    expect(await status(reader)).toEqual({ linked: true, provider: "spotify" });

    const response = await reader.api.delete("/api/music-connector");
    expect(response.status()).toBe(204);

    expect(await status(reader)).toEqual({ linked: false, provider: "spotify" });
  });
});

test.describe("the music connector status", () => {
  test("reports a reader who has never connected Spotify as unlinked", async ({ newReader }) => {
    expect(await status(await newReader())).toEqual({ linked: false, provider: "spotify" });
  });

  // The regression this spec exists for. A row check rather than a scope check passes
  // every other case here and hands this reader an export that dies at the Spotify call.
  test("reports a connection granted without the playlist scope as unlinked", async ({
    newReader,
  }) => {
    expect(await status(await newReader(IDENTITY_SCOPES))).toEqual({
      linked: false,
      provider: "spotify",
    });
  });

  test("reports a reader as linked once the row carries the playlist scope", async ({
    newReader,
  }) => {
    expect(await status(await newReader(EXPORT_SCOPES))).toEqual({
      linked: true,
      provider: "spotify",
    });
  });
});

test.describe("exporting a playlist to Spotify", () => {
  // A generation apiece against the fixture upstreams: fast, but not inside the 30s default
  // once several workers share a cold machine.
  test.describe.configure({ timeout: 90_000 });

  test("creates the playlist in Spotify with its tracks and remembers the id", async ({
    newReader,
    spotify,
  }) => {
    const reader = await newReader(EXPORT_SCOPES);
    const playlist = await score(reader);

    const response = await exportPlaylist(reader, playlist.id);
    expect(response.status(), await response.text()).toBe(200);
    const exported = ExportPlaylistResponseSchema.parse(await response.json());

    const [inSpotify] = await spotify.playlistsFor(reader.spotifyToken);
    expect(inSpotify).toBeDefined();
    expect(inSpotify.id).toBe(exported.spotifyPlaylistId);
    expect(inSpotify.name).toBe(playlist.name);
    // The whole point of the export: the tracks are there, in our order.
    expect(inSpotify.uris).toEqual(expectedUris(playlist));

    // Spotify's own link, not the one we could have derived without asking it.
    expect(exported.webUrl).toBe(inSpotify.webUrl);
    expect(exported.deepLinkUri).toBe(`spotify:playlist:${exported.spotifyPlaylistId}`);

    expect(await storedSpotifyPlaylistId(reader, playlist.id)).toBe(exported.spotifyPlaylistId);
  });

  test("hands back the same playlist on a second export rather than creating another", async ({
    newReader,
    spotify,
  }) => {
    const reader = await newReader(EXPORT_SCOPES);
    const playlist = await score(reader);

    const first = ExportPlaylistResponseSchema.parse(
      await (await exportPlaylist(reader, playlist.id)).json(),
    );
    const response = await exportPlaylist(reader, playlist.id);
    expect(response.status(), await response.text()).toBe(200);
    const second = ExportPlaylistResponseSchema.parse(await response.json());

    expect(second.spotifyPlaylistId).toBe(first.spotifyPlaylistId);
    expect(second.deepLinkUri).toBe(first.deepLinkUri);
    // Not `toEqual(first)`: only the id is persisted, so a repeat rebuilds `webUrl` with
    // `spotifyPlaylistWebUrl` instead of returning the link Spotify itself gave us. Both
    // open the same playlist, but the two responses differ — reported to the route's owner.
    expect(second.webUrl).toContain(first.spotifyPlaylistId);

    const mine = await spotify.playlistsFor(reader.spotifyToken);
    expect(mine).toHaveLength(1);
    // Spotify was not touched the second time, so the tracks went in exactly once.
    expect(mine[0].appends).toBe(1);
  });

  test("replaces the items in Spotify when the reader syncs", async ({ newReader, spotify }) => {
    const reader = await newReader(EXPORT_SCOPES);
    const playlist = await score(reader);
    const exported = ExportPlaylistResponseSchema.parse(
      await (await exportPlaylist(reader, playlist.id)).json(),
    );

    const response = await syncPlaylist(reader, playlist.id);
    expect(response.status(), await response.text()).toBe(200);
    expect(ExportPlaylistResponseSchema.parse(await response.json()).spotifyPlaylistId).toBe(
      exported.spotifyPlaylistId,
    );

    const mine = await spotify.playlistsFor(reader.spotifyToken);
    expect(mine).toHaveLength(1);
    expect(mine[0].replaces).toBe(1);
    // Replaced rather than appended: appending would have left every track in twice.
    expect(mine[0].uris).toEqual(expectedUris(playlist));
  });

  test("creates the playlist when a sync arrives for one never exported", async ({
    newReader,
    spotify,
  }) => {
    const reader = await newReader(EXPORT_SCOPES);
    const playlist = await score(reader);

    const response = await syncPlaylist(reader, playlist.id);
    expect(response.status(), await response.text()).toBe(200);
    const synced = ExportPlaylistResponseSchema.parse(await response.json());

    const mine = await spotify.playlistsFor(reader.spotifyToken);
    expect(mine).toHaveLength(1);
    expect(mine[0].id).toBe(synced.spotifyPlaylistId);
    expect(mine[0].uris).toEqual(expectedUris(playlist));
    expect(await storedSpotifyPlaylistId(reader, playlist.id)).toBe(synced.spotifyPlaylistId);
  });

  test("makes a fresh Spotify playlist when the reader deleted ours", async ({
    newReader,
    spotify,
  }) => {
    const reader = await newReader(EXPORT_SCOPES);
    const playlist = await score(reader);
    const first = ExportPlaylistResponseSchema.parse(
      await (await exportPlaylist(reader, playlist.id)).json(),
    );

    await spotify.deleteInSpotify(first.spotifyPlaylistId);

    const response = await syncPlaylist(reader, playlist.id);
    expect(response.status(), await response.text()).toBe(200);
    const again = ExportPlaylistResponseSchema.parse(await response.json());
    expect(again.spotifyPlaylistId).not.toBe(first.spotifyPlaylistId);

    const mine = await spotify.playlistsFor(reader.spotifyToken);
    expect(mine).toHaveLength(1);
    expect(mine[0].uris).toEqual(expectedUris(playlist));
    expect(await storedSpotifyPlaylistId(reader, playlist.id)).toBe(again.spotifyPlaylistId);
  });

  test("refuses to export for a reader who has not linked Spotify", async ({ newReader }) => {
    const reader = await newReader();
    const playlist = await score(reader);

    const response = await exportPlaylist(reader, playlist.id);
    expect(response.status()).toBe(409);
    expect(ApiErrorSchema.parse(await response.json())).toMatchObject({
      code: "SPOTIFY_NOT_LINKED",
      retryable: false,
    });

    expect(await storedSpotifyPlaylistId(reader, playlist.id)).toBeNull();
  });

  test("reports a lapsed Spotify token rather than an outage", async ({ newReader, spotify }) => {
    const reader = await newReader(EXPORT_SCOPES);
    const playlist = await score(reader);
    await spotify.revoke(reader.spotifyToken, 401);

    const response = await exportPlaylist(reader, playlist.id);
    expect(response.status()).toBe(401);
    expect(ApiErrorSchema.parse(await response.json())).toMatchObject({
      code: "SPOTIFY_TOKEN_EXPIRED",
    });

    // Nothing was remembered, so the next export starts clean rather than pointing at a
    // playlist Spotify never created.
    expect(await storedSpotifyPlaylistId(reader, playlist.id)).toBeNull();
  });

  test("reports a token granted before the playlist scope as unlinked", async ({
    newReader,
    spotify,
  }) => {
    const reader = await newReader(EXPORT_SCOPES);
    const playlist = await score(reader);
    await spotify.revoke(reader.spotifyToken, 403);

    const response = await exportPlaylist(reader, playlist.id);
    expect(response.status()).toBe(409);
    expect(ApiErrorSchema.parse(await response.json())).toMatchObject({
      code: "SPOTIFY_NOT_LINKED",
    });
  });

  test("refuses a stranger's playlist", async ({ newReader, spotify }) => {
    const owner = await newReader(EXPORT_SCOPES);
    const playlist = await score(owner);
    // Linked too, so a 409 cannot masquerade as the answer here.
    const stranger = await newReader(EXPORT_SCOPES);

    const response = await exportPlaylist(stranger, playlist.id);
    expect(response.status()).toBe(403);
    expect(ApiErrorSchema.parse(await response.json())).toMatchObject({ code: "FORBIDDEN" });

    expect(await spotify.playlistsFor(stranger.spotifyToken)).toHaveLength(0);
    expect(await storedSpotifyPlaylistId(owner, playlist.id)).toBeNull();
  });

  test("answers a playlist id that does not exist with a 404", async ({ newReader }) => {
    const reader = await newReader(EXPORT_SCOPES);

    const response = await exportPlaylist(reader, "not-a-playlist-id");
    expect(response.status()).toBe(404);
    expect(ApiErrorSchema.parse(await response.json())).toMatchObject({
      code: "PLAYLIST_NOT_FOUND",
    });
  });
});

/**
 * `PUT /api/playlists/:playlistId/export` with a body: a sync changes only what it was
 * handed, so a rename leaves the items where the reader dragged them.
 *
 * `details`, `replaces` and `appends` on the fixture's own record are what make "only"
 * assertable — a rename that quietly re-pushed the tracks would pass every assertion
 * about the name.
 */
test.describe("syncing only the fields a playlist asked to change", () => {
  test.describe.configure({ timeout: 90_000 });

  /** An exported playlist of this reader's own, and the links Spotify gave it. */
  async function exported(reader: Reader) {
    const playlist = await score(reader);
    const response = await exportPlaylist(reader, playlist.id);
    expect(response.status(), await response.text()).toBe(200);

    return { playlist, ...ExportPlaylistResponseSchema.parse(await response.json()) };
  }

  test("renames in Spotify and on our row without re-pushing the tracks", async ({
    newReader,
    spotify,
  }) => {
    const reader = await newReader(EXPORT_SCOPES);
    const { playlist, spotifyPlaylistId } = await exported(reader);
    const renamed = "Hours by the Harbour Light";

    // Padded, because the schema trims: what reaches Spotify is what proves it.
    const response = await syncPlaylist(reader, playlist.id, { name: `  ${renamed}  ` });
    expect(response.status(), await response.text()).toBe(200);
    expect(ExportPlaylistResponseSchema.parse(await response.json()).spotifyPlaylistId).toBe(
      spotifyPlaylistId,
    );

    const theirs = await inSpotify(spotify, reader.spotifyToken);
    expect(theirs.name).toBe(renamed);
    expect(theirs.details).toBe(1);
    // The point of a partial body: the items were left alone.
    expect(theirs.replaces).toBe(0);
    expect(theirs.appends).toBe(1);
    expect(theirs.uris).toEqual(expectedUris(playlist));

    // Ours as well as Spotify's, or the app would go on showing the old name.
    expect((await storedPlaylist(reader, playlist.id)).name).toBe(renamed);
  });

  test("changes the Spotify description and leaves the name and the items alone", async ({
    newReader,
    spotify,
  }) => {
    const reader = await newReader(EXPORT_SCOPES);
    const { playlist } = await exported(reader);
    const description = "Rewritten by the reader, not by us.";

    const response = await syncPlaylist(reader, playlist.id, { description });
    expect(response.status(), await response.text()).toBe(200);

    const theirs = await inSpotify(spotify, reader.spotifyToken);
    expect(theirs.description).toBe(description);
    expect(theirs.details).toBe(1);
    expect(theirs.name).toBe(playlist.name);
    expect(theirs.replaces).toBe(0);
    expect(theirs.uris).toEqual(expectedUris(playlist));

    expect((await storedPlaylist(reader, playlist.id)).name).toBe(playlist.name);
  });

  test("replaces the items and nothing else when the body asks for the tracks", async ({
    newReader,
    spotify,
  }) => {
    const reader = await newReader(EXPORT_SCOPES);
    const { playlist } = await exported(reader);

    const response = await syncPlaylist(reader, playlist.id, { tracks: true });
    expect(response.status(), await response.text()).toBe(200);

    const theirs = await inSpotify(spotify, reader.spotifyToken);
    expect(theirs.replaces).toBe(1);
    expect(theirs.uris).toEqual(expectedUris(playlist));
    // Nothing named, so the playlist itself was never touched.
    expect(theirs.details).toBe(0);
    expect(theirs.name).toBe(playlist.name);
  });

  test("treats an empty body as the track sync it meant before there was a body", async ({
    newReader,
    spotify,
  }) => {
    const reader = await newReader(EXPORT_SCOPES);
    const { playlist } = await exported(reader);

    const response = await syncPlaylist(reader, playlist.id, {});
    expect(response.status(), await response.text()).toBe(200);

    const theirs = await inSpotify(spotify, reader.spotifyToken);
    expect(theirs.replaces).toBe(1);
    expect(theirs.uris).toEqual(expectedUris(playlist));
    expect(theirs.details).toBe(0);
  });

  test("creates a playlist never exported under the name the rename gave it", async ({
    newReader,
    spotify,
  }) => {
    const reader = await newReader(EXPORT_SCOPES);
    const playlist = await score(reader);
    const renamed = "A Letter in Her Own Hand";

    const response = await syncPlaylist(reader, playlist.id, { name: renamed });
    expect(response.status(), await response.text()).toBe(200);
    const synced = ExportPlaylistResponseSchema.parse(await response.json());

    const theirs = await inSpotify(spotify, reader.spotifyToken);
    expect(theirs.id).toBe(synced.spotifyPlaylistId);
    // Created carrying the new name, rather than created and then renamed.
    expect(theirs.name).toBe(renamed);
    expect(theirs.details).toBe(0);
    expect(theirs.appends).toBe(1);
    expect(theirs.uris).toEqual(expectedUris(playlist));

    const stored = await storedPlaylist(reader, playlist.id);
    expect(stored.name).toBe(renamed);
    expect(stored.spotifyPlaylistId).toBe(synced.spotifyPlaylistId);
  });

  test("remakes a playlist the reader deleted, carrying the rename that found it gone", async ({
    newReader,
    spotify,
  }) => {
    const reader = await newReader(EXPORT_SCOPES);
    const { playlist, spotifyPlaylistId } = await exported(reader);
    const renamed = "The Winters She Counted";

    await spotify.deleteInSpotify(spotifyPlaylistId);

    const response = await syncPlaylist(reader, playlist.id, { name: renamed });
    expect(response.status(), await response.text()).toBe(200);
    const synced = ExportPlaylistResponseSchema.parse(await response.json());
    expect(synced.spotifyPlaylistId).not.toBe(spotifyPlaylistId);

    // A rename is not a track sync, but a playlist rebuilt from nothing needs its items.
    const theirs = await inSpotify(spotify, reader.spotifyToken);
    expect(theirs.name).toBe(renamed);
    expect(theirs.uris).toEqual(expectedUris(playlist));
    expect(theirs.appends).toBe(1);

    expect(await storedSpotifyPlaylistId(reader, playlist.id)).toBe(synced.spotifyPlaylistId);
  });

  test("refuses a body the schema rejects and leaves Spotify untouched", async ({
    newReader,
    spotify,
  }) => {
    const reader = await newReader(EXPORT_SCOPES);
    const { playlist } = await exported(reader);

    // Every way `UpdateExportRequestSchema` can fail: a name that is empty once trimmed,
    // one past 100 characters, a description past 300, and a non-boolean `tracks`.
    const rejected: Record<string, unknown>[] = [
      { name: "" },
      { name: "   " },
      { name: "n".repeat(101) },
      { description: "d".repeat(301) },
      { tracks: "yes" },
    ];

    for (const body of rejected) {
      const response = await syncWithBody(reader, playlist.id, body);
      expect(response.status(), JSON.stringify(body).slice(0, 60)).toBe(400);
      expect(ApiErrorSchema.parse(await response.json())).toMatchObject({
        code: "INVALID_INPUT",
        retryable: false,
      });
    }

    // A rejected body reaches neither Spotify nor our row.
    const theirs = await inSpotify(spotify, reader.spotifyToken);
    expect(theirs.details).toBe(0);
    expect(theirs.replaces).toBe(0);
    expect(theirs.name).toBe(playlist.name);
    expect((await storedPlaylist(reader, playlist.id)).name).toBe(playlist.name);
  });
});
