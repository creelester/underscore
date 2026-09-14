import type { Book as BookRow, Playlist as PlaylistRow, PlaylistTrack, Track } from "@prisma/client";
import { PlaylistSchema, type Playlist } from "@underscore/shared";

/**
 * Rows to the API shape. Shared by generation and the bookshelf reads so one playlist
 * cannot go out two ways; both end in `PlaylistSchema.parse`, which is also where
 * `moodProfile` stops being unshaped `Json`.
 */

export type PlaylistRowWithRelations = PlaylistRow & {
  book: BookRow;
  tracks: (PlaylistTrack & { track: Track })[];
};

export function toApiBook(row: BookRow) {
  return {
    id: row.id,
    googleBooksId: row.googleBooksId,
    title: row.title,
    authors: row.authors,
    description: row.description,
    categories: row.categories,
    pageCount: row.pageCount,
    thumbnailUrl: row.thumbnailUrl,
    source: row.source,
  };
}

export function toApiPlaylist(row: PlaylistRowWithRelations): Playlist {
  return PlaylistSchema.parse({
    id: row.id,
    name: row.name,
    book: toApiBook(row.book),
    moodProfile: row.moodProfile,
    tracks: row.tracks.map(({ track, position, isAnchor }) => ({
      track: {
        spotifyTrackId: track.spotifyTrackId,
        name: track.name,
        artist: track.artist,
        albumArtUrl: track.albumArtUrl,
        durationMs: track.durationMs,
      },
      position,
      isAnchor,
    })),
    totalRuntimeMs: row.totalRuntimeMs,
    isTooShort: row.isTooShort,
    spotifyPlaylistId: row.spotifyPlaylistId,
    createdAt: row.createdAt.toISOString(),
  });
}
