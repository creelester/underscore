/**
 * The state behind user-level Spotify: the playlists the export routes put in "the
 * reader's account", and the tokens a spec has made Spotify refuse.
 *
 * Kept out of `upstream-server.ts` so the type is importable by a spec without starting
 * a second fixture server — the spec reads these records back off the `/e2e/spotify/*`
 * control endpoints, so the two cannot drift.
 *
 * Everything is keyed by the bearer token the request arrived on. Each spec seeds a token
 * of its own, so parallel workers never see each other's playlists and "was a second one
 * created?" stays answerable per test.
 */

export type FixtureSpotifyPlaylist = {
  id: string;
  name: string;
  description: string;
  /** Proves the export travelled on the reader's token, not the app's client-credentials one. */
  token: string;
  /** Spotify's own link. A spec compares the export response to this rather than rebuilding it. */
  webUrl: string;
  uris: string[];
  /** `POST /items` calls: one per create. A second one means the tracks were appended twice. */
  appends: number;
  /** `PUT /items` calls. */
  replaces: number;
};

const playlists = new Map<string, FixtureSpotifyPlaylist>();
const revoked = new Map<string, number>();
let created = 0;

export const readerSpotify = {
  create(token: string, { name = "", description = "" }: { name?: string; description?: string }) {
    created += 1;
    const id = `e2e-spotify-playlist-${created}`;
    const playlist: FixtureSpotifyPlaylist = {
      id,
      name,
      description,
      token,
      // The `si` marker is what lets a spec prove the export response carries Spotify's
      // own link rather than `playlistWebUrl()`'s locally derived fallback.
      webUrl: `https://open.spotify.com/playlist/${id}?si=e2e-fixture`,
      uris: [],
      appends: 0,
      replaces: 0,
    };
    playlists.set(id, playlist);
    return playlist;
  },

  find(id: string) {
    return playlists.get(id);
  },

  /** Stands in for the reader deleting it in Spotify; the next sync then 404s. */
  forget(id: string) {
    return playlists.delete(id);
  },

  forToken(token: string) {
    return [...playlists.values()].filter((playlist) => playlist.token === token);
  },

  revoke(token: string, status: number) {
    revoked.set(token, status);
  },

  /** 401 for a lapsed token, 403 for one granted before we asked for the playlist scope. */
  revokedStatus(token: string) {
    return revoked.get(token);
  },
};
