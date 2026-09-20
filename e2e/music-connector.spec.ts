import { randomUUID } from "node:crypto";

import { expect, request, test as base, type APIRequestContext } from "@playwright/test";
import {
  ApiErrorSchema,
  ExportPlaylistResponseSchema,
  MusicConnectorStatusResponseSchema,
  PlaylistSchema,
  SPOTIFY_PLAYLIST_SCOPES,
  type Playlist,
} from "@underscore/shared";

import { E2E_UPSTREAM_URL } from "../playwright.config";
import { linkSpotifyAccount } from "./db";
import { fixtureBook } from "./fixtures/catalog";
import type { FixtureSpotifyPlaylist } from "./fixtures/spotify-user";
import { GENERATE_TIMEOUT_MS, signUpOverApi } from "./helpers";

/**
 * The Music Connector: whether a reader's Spotify link can write a playlist
 * (`GET /api/music-connector/status`), and putting one there
 * (`POST` / `PUT /api/playlists/:playlistId/export`).
 *
 * Driven over HTTP, like `rate-limit.spec.ts`: neither route has a screen yet, so nothing
 * the app renders is part of the contract under test and there is no page to open.
 *
 * What Spotify was asked to do is read back off the fixture server's own record
 * (`fixtures/spotify-user.ts`), which is what makes a created playlist distinguishable
 * from a filled one and a replace from an append. What *we* remember of it is read back
 * off `GET /api/bookshelf/:playlistId` rather than out of the database.
 *
 * Every reader here is minted by this spec, scores its own playlist and carries its own
 * Spotify token, so nothing shared is mutated and no two tests can see each other's
 * playlists in the fixture.
 */

/** What signing in *with* Spotify leaves behind: identity, and no way to write a playlist. */
const SIGN_IN_SCOPES = "user-read-email,user-read-private";

/**
 * A real grant keeps the identity scopes alongside the one we asked for, so the status
 * check has to be set membership rather than equality. Comma-joined, as Better Auth writes it.
 */
const EXPORT_SCOPES = ["user-read-email", ...SPOTIFY_PLAYLIST_SCOPES].join(",");

const BOOK = fixtureBook("e2e-lantern");

type Reader = {
  api: APIRequestContext;
  userId: string;
  /** The access token its `account` row carries; the fixture keys its playlists on it. */
  spotifyToken: string;
};

/** Mints a reader. With a `scope`, Spotify is linked at it; without, not linked at all. */
type NewReader = (scope?: string) => Promise<Reader>;

/** The fixture server's record of what user-level Spotify was asked to do. */
type SpotifyFixture = {
  playlistsFor(token: string): Promise<FixtureSpotifyPlaylist[]>;
  /** As if the reader deleted it in Spotify: the next sync then finds it gone. */
  deleteInSpotify(id: string): Promise<void>;
  /** Makes Spotify answer this token 401 (lapsed) or 403 (granted without the scope). */
  revoke(token: string, status: 401 | 403): Promise<void>;
};

const test = base.extend<{ newReader: NewReader; spotify: SpotifyFixture }>({
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
        await linkSpotifyAccount(reader.userId, { scope, accessToken: reader.spotifyToken });
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

/** What we remember of an export, read back the way the app would read it. */
async function storedSpotifyPlaylistId(reader: Reader, playlistId: string) {
  const response = await reader.api.get(`/api/bookshelf/${playlistId}`);
  expect(response.status()).toBe(200);

  return PlaylistSchema.parse(await response.json()).spotifyPlaylistId;
}

async function status(reader: Reader) {
  const response = await reader.api.get("/api/music-connector/status");
  expect(response.status()).toBe(200);

  return MusicConnectorStatusResponseSchema.parse(await response.json());
}

const exportPlaylist = (reader: Reader, playlistId: string) =>
  reader.api.post(`/api/playlists/${playlistId}/export`);

const syncPlaylist = (reader: Reader, playlistId: string) =>
  reader.api.put(`/api/playlists/${playlistId}/export`);

test.describe("the music connector status", () => {
  test("reports a reader who has never linked Spotify as unlinked", async ({ newReader }) => {
    expect(await status(await newReader())).toEqual({ linked: false, provider: "spotify" });
  });

  // The regression this spec exists for. A row check rather than a scope check passes
  // every other case here and hands this reader an export that dies at the Spotify call.
  test("reports a Spotify sign-in carrying only identity scopes as unlinked", async ({
    newReader,
  }) => {
    expect(await status(await newReader(SIGN_IN_SCOPES))).toEqual({
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
