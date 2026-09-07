import type { PrismaClient, Book as BookRow } from "@prisma/client";
import {
  PlaylistSchema,
  type BookDetail,
  type GeneratePlaylistRequest,
  type Playlist,
  type Track,
} from "@underscore/shared";
import { suggestAnchors } from "../connectors/anthropic";
import { fetchVolume } from "../connectors/googleBooks";
import { resolveAnchors } from "../connectors/spotify";
import { ApiError } from "../lib/apiError";
import { prisma } from "../lib/prisma";
import { buildMoodProfile } from "./moodEngine";

/** Below this, the suggestion step is worth re-running before shipping what resolved. */
const REGENERATE_BELOW = 8;

/** After a regeneration, a playlist this short is flagged to the user as unusually small. */
const TOO_SHORT_BELOW = 20;

type Transaction = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/**
 * A supplied profile is used verbatim — it is the one the user saw and corrected. The
 * volume is still fetched: the `Book` row is minted from the catalogue, never the request.
 */
async function resolveProfile(request: GeneratePlaylistRequest) {
  if (!request.moodProfile) return buildMoodProfile(request);
  if (!request.googleBooksId) return { profile: request.moodProfile, book: null };

  const book = await fetchVolume(request.googleBooksId);
  if (!book) throw ApiError.bookNotFound();
  return { profile: request.moodProfile, book };
}

/**
 * The only place a `GOOGLE_BOOKS` book is created — search is read-only, so a row here
 * means somebody actually scored this book.
 */
async function upsertBook(
  tx: Transaction,
  book: BookDetail | null,
  manualGenre: string | undefined,
): Promise<BookRow> {
  if (book) {
    const fields = {
      title: book.title,
      authors: book.authors,
      description: book.description,
      categories: book.categories,
      pageCount: book.pageCount,
      thumbnailUrl: book.thumbnailUrl,
    };
    return tx.book.upsert({
      where: { googleBooksId: book.googleBooksId },
      create: { ...fields, googleBooksId: book.googleBooksId, source: "GOOGLE_BOOKS" },
      update: fields,
    });
  }

  // The stand-in book for the by-hand path: its title is the genre the user typed. No
  // upsert, because `googleBooksId` is the only unique key and this row has none.
  const title = manualGenre!;
  const existing = await tx.book.findFirst({ where: { source: "MANUAL_GENRE", title } });
  return (
    existing ??
    tx.book.create({
      data: {
        title,
        source: "MANUAL_GENRE",
        googleBooksId: null,
        authors: [],
        description: null,
        categories: [],
        pageCount: null,
        thumbnailUrl: null,
      },
    })
  );
}

/** Deduplicated across playlists: the catalog metadata behind a Spotify id is the same for everyone. */
async function upsertTracks(tx: Transaction, tracks: Track[]): Promise<string[]> {
  const rows = [];
  for (const track of tracks) {
    const fields = {
      name: track.name,
      artist: track.artist,
      albumArtUrl: track.albumArtUrl,
      durationMs: track.durationMs,
    };
    rows.push(
      await tx.track.upsert({
        where: { spotifyTrackId: track.spotifyTrackId },
        create: { ...fields, spotifyTrackId: track.spotifyTrackId },
        update: fields,
      }),
    );
  }
  return rows.map((row) => row.id);
}

function toApiBook(row: BookRow) {
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

export async function generatePlaylist(
  userId: string,
  request: GeneratePlaylistRequest,
): Promise<Playlist> {
  const { profile, book } = await resolveProfile(request);
  const bookRef = book ?? undefined;

  let tracks = await resolveAnchors(await suggestAnchors(profile, bookRef));

  // Claude names tracks that turn out not to exist in the catalog; too few surviving
  // means the suggestions were the problem, so ask once more before settling.
  const regenerated = tracks.length < REGENERATE_BELOW;
  if (regenerated) {
    tracks = await resolveAnchors(await suggestAnchors(profile, bookRef));
  }

  if (tracks.length === 0) {
    throw ApiError.upstreamUnavailable("No suggested track could be found on Spotify");
  }

  // The transaction opens only once the network work is done, so no connection is held
  // across a Claude round-trip.
  return prisma.$transaction(async (tx) => {
    const bookRow = await upsertBook(tx, book, request.manualGenre);
    const trackIds = await upsertTracks(tx, tracks);

    const playlist = await tx.playlist.create({
      data: {
        userId,
        bookId: bookRow.id,
        moodProfile: profile,
        totalRuntimeMs: tracks.reduce((total, track) => total + track.durationMs, 0),
        isTooShort: regenerated && tracks.length < TOO_SHORT_BELOW,
        tracks: {
          create: trackIds.map((trackId, position) => ({ trackId, position, isAnchor: true })),
        },
      },
    });

    // Parsed, so a row-to-API mismatch fails here rather than in the client.
    return PlaylistSchema.parse({
      id: playlist.id,
      book: toApiBook(bookRow),
      moodProfile: profile,
      tracks: tracks.map((track, position) => ({ track, position, isAnchor: true })),
      totalRuntimeMs: playlist.totalRuntimeMs,
      isTooShort: playlist.isTooShort,
      spotifyPlaylistId: playlist.spotifyPlaylistId,
      createdAt: playlist.createdAt.toISOString(),
    });
  });
}
