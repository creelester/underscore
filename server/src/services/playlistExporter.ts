import {
  spotifyPlaylistDeepLink,
  spotifyPlaylistWebUrl,
  spotifyTrackUri,
  type ExportPlaylistResponse,
  type Playlist,
  type UpdateExportRequest,
} from "@underscore/shared";
import {
  addSpotifyItems,
  createSpotifyPlaylist,
  replaceSpotifyItems,
  spotifyAccessToken,
  updateSpotifyPlaylistDetails,
} from "../connectors/spotifyUser";
import { prisma } from "../lib/prisma";
import { getPlaylist } from "./bookshelf";

/**
 * Putting a playlist in the reader's own Spotify. `POST` creates and `PUT` syncs, but
 * both upsert, so the app never has to sequence two calls to get it right: exporting
 * something already exported hands back the existing links, and syncing something never
 * exported creates it.
 *
 * A sync changes only what it was handed, so renaming a playlist leaves the tracks where
 * the reader dragged them.
 */

function links(spotifyPlaylistId: string, webUrl?: string): ExportPlaylistResponse {
  return {
    spotifyPlaylistId,
    webUrl: webUrl ?? spotifyPlaylistWebUrl(spotifyPlaylistId),
    deepLinkUri: spotifyPlaylistDeepLink(spotifyPlaylistId),
  };
}

/** One request holds 100 items and a playlist is a fixed ~20, so the list never needs splitting. */
function uris(playlist: Playlist): string[] {
  return playlist.tracks.map(({ track }) => spotifyTrackUri(track.spotifyTrackId));
}

async function create(
  userId: string,
  playlist: Playlist,
  description = `Scored for ${playlist.book.title} by Under Score.`,
): Promise<ExportPlaylistResponse> {
  const token = await spotifyAccessToken(userId);
  const created = await createSpotifyPlaylist(token, { name: playlist.name, description });

  await addSpotifyItems(token, created.spotifyPlaylistId, uris(playlist));

  // Written only once the tracks are in: a failure halfway would otherwise leave a row
  // pointing at an empty playlist, which every later sync would treat as already done.
  await prisma.playlist.update({
    where: { id: playlist.id },
    data: { spotifyPlaylistId: created.spotifyPlaylistId },
  });

  return links(created.spotifyPlaylistId, created.webUrl);
}

export async function exportPlaylist(
  userId: string,
  playlistId: string,
): Promise<ExportPlaylistResponse> {
  const playlist = await getPlaylist(userId, playlistId);
  if (playlist.spotifyPlaylistId) return links(playlist.spotifyPlaylistId);

  return create(userId, playlist);
}

export async function syncPlaylist(
  userId: string,
  playlistId: string,
  update: UpdateExportRequest = {},
): Promise<ExportPlaylistResponse> {
  const { name, description } = update;
  const details = name !== undefined || description !== undefined;
  // Nothing named means the tracks — what a sync meant before it took a body at all.
  const tracks = update.tracks ?? !details;

  let playlist = await getPlaylist(userId, playlistId);

  // The new name is ours to keep as well: left off our row, the next track sync would
  // carry the old one back to Spotify.
  if (name !== undefined && name !== playlist.name) {
    await prisma.playlist.update({ where: { id: playlist.id }, data: { name } });
    playlist = { ...playlist, name };
  }

  if (!playlist.spotifyPlaylistId) return create(userId, playlist, description);

  const token = await spotifyAccessToken(userId);
  const spotifyPlaylistId = playlist.spotifyPlaylistId;

  const stillThere =
    (!details ||
      (await updateSpotifyPlaylistDetails(token, spotifyPlaylistId, { name, description }))) &&
    (!tracks || (await replaceSpotifyItems(token, spotifyPlaylistId, uris(playlist))));

  if (stillThere) return links(spotifyPlaylistId);

  // Gone from Spotify — the reader deleted it there. Forget the id and make a new one,
  // rather than failing a sync they asked for.
  await prisma.playlist.update({
    where: { id: playlist.id },
    data: { spotifyPlaylistId: null },
  });

  return create(userId, playlist, description);
}
