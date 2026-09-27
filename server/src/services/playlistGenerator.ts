import type { PrismaClient, Book as BookRow } from "@prisma/client";
import {
  PlaylistSchema,
  defaultPlaylistName,
  type BookDetail,
  type GeneratePlaylistRequest,
  type ManualBook,
  type Playlist,
  type Track,
} from "@underscore/shared";
import { suggestAnchors } from "../connectors/anthropic";
import { fetchVolume } from "../connectors/googleBooks";
import { resolveAnchors } from "../connectors/spotify";
import { ApiError } from "../lib/apiError";
import { prisma } from "../lib/prisma";
import { buildMoodProfile, manualProfile } from "./moodEngine";
import { toApiBook } from "./playlistMapper";

/** Below this, the suggestion step is worth re-running before shipping what resolved. */
const REGENERATE_BELOW = 8;

/** After a regeneration, a playlist this short is flagged to the user as unusually small. */
const TOO_SHORT_BELOW = 13;

/**
 * How much of the reader's own history a new list has to avoid. Claude reaches for the same
 * canon whatever the book — before this, one track sat in 17 of 21 playlists — and naming
 * what it already gave them is the only lever, since Opus 5 takes no temperature. Capped:
 * an unbounded ban starves a list of anything good after a dozen playlists.
 */
const RECENT_PLAYLISTS = 4;
const MAX_EXCLUDED = 60;

type Transaction = Parameters<Parameters<PrismaClient["$transaction"]>[0]>[0];

/**
 * A supplied profile is used verbatim — it is the one the user saw and corrected. The
 * volume is still fetched: the `Book` row is minted from the catalogue, never the request.
 */
async function resolveProfile(request: GeneratePlaylistRequest) {
  if (request.manualBook) {
    return { profile: request.moodProfile ?? manualProfile(request.manualBook), book: null };
  }
  if (!request.moodProfile) return buildMoodProfile({ googleBooksId: request.googleBooksId! });

  const book = await fetchVolume(request.googleBooksId!);
  if (!book) throw ApiError.bookNotFound();
  return { profile: request.moodProfile, book };
}

/**
 * The only place a `GOOGLE_BOOKS` book is created — search is read-only, so a row here
 * means somebody actually scored this book.
 */
/** What the by-hand path can tell Claude about the book. Nothing, if no title was given. */
function manualBookRef(
  manualBook: ManualBook | undefined,
): Pick<BookDetail, "title" | "authors"> | undefined {
  if (!manualBook?.title) return undefined;

  return { title: manualBook.title, authors: manualBook.author ? [manualBook.author] : [] };
}

async function upsertBook(
  tx: Transaction,
  book: BookDetail | null,
  manualBook: ManualBook | undefined,
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

  // Always its own row, never shared. Matching on `(source, title)` was harmless while the
  // title was one of 38 genre words, but a reader-typed title, author and emoji would hand
  // one reader's book to another's. Two by-hand scores of the same book make two rows.
  const { title, author, coverEmoji } = manualBook!;
  return tx.book.create({
    data: {
      title: title || "Untitled book",
      source: "MANUAL_GENRE",
      googleBooksId: null,
      authors: author ? [author] : [],
      description: null,
      categories: [],
      pageCount: null,
      thumbnailUrl: null,
      coverEmoji: coverEmoji ?? null,
    },
  });
}

/** `artist — title` of what this reader already has, newest playlists first. */
async function recentTracks(userId: string): Promise<string[]> {
  const playlists = await prisma.playlist.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: RECENT_PLAYLISTS,
    select: { tracks: { select: { track: { select: { artist: true, name: true } } } } },
  });

  const used = playlists.flatMap(({ tracks }) =>
    tracks.map(({ track }) => `${track.artist} — ${track.name}`),
  );
  return [...new Set(used)].slice(0, MAX_EXCLUDED);
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

export async function generatePlaylist(
  userId: string,
  request: GeneratePlaylistRequest,
): Promise<Playlist> {
  const { profile, book } = await resolveProfile(request);
  // The by-hand path used to send Claude no book at all — only a genre word. It gets what
  // the reader typed instead, which Claude may recognise even where the catalogue did not.
  const bookRef = book ?? manualBookRef(request.manualBook);

  const context = request.readingContext;
  const exclude = await recentTracks(userId);

  let suggested = await suggestAnchors({ profile, book: bookRef, context, exclude });
  let tracks = await resolveAnchors(suggested.tracks);

  // Claude names tracks that turn out not to exist in the catalog; too few surviving
  // means the suggestions were the problem, so ask once more before settling — this time
  // ruling out what it just named, since none of that resolved.
  const regenerated = tracks.length < REGENERATE_BELOW;
  if (regenerated) {
    const tried = suggested.tracks.map(({ artist, title }) => `${artist} — ${title}`);
    suggested = await suggestAnchors({
      profile,
      book: bookRef,
      context,
      exclude: [...exclude, ...tried],
    });
    tracks = await resolveAnchors(suggested.tracks);
  }

  if (tracks.length === 0) {
    throw ApiError.upstreamUnavailable("No suggested track could be found on Spotify");
  }

  const name = suggested.name ?? defaultPlaylistName(profile);

  // The transaction opens only once the network work is done, so no connection is held
  // across a Claude round-trip.
  return prisma.$transaction(async (tx) => {
    const bookRow = await upsertBook(tx, book, request.manualBook);
    const trackIds = await upsertTracks(tx, tracks);

    const playlist = await tx.playlist.create({
      data: {
        userId,
        name,
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
      name: playlist.name,
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
