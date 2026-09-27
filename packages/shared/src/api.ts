import { z } from "zod";
import { BookCandidateSchema, BookDetailSchema } from "./book";
import { PlaylistSchema } from "./playlist";
import { MAX_GENRES } from "./book";
import { GENRES, MoodProfileSchema } from "./moodProfile";
import { ReadingContextSchema } from "./readingContext";

/** A page of the bookshelf. The app asks for the maximum; it has no paging affordance yet. */
export const DEFAULT_BOOKSHELF_LIMIT = 20;
export const MAX_BOOKSHELF_LIMIT = 50;

export const BookSearchQuerySchema = z.object({
  q: z.string().trim().min(1, "A search term is required"),
});
export type BookSearchQuery = z.infer<typeof BookSearchQuerySchema>;

export const BookSearchResponseSchema = z.object({
  results: z.array(BookCandidateSchema),
});
export type BookSearchResponse = z.infer<typeof BookSearchResponseSchema>;

/**
 * A single volume, unpersisted like search — book detail has to be reachable by deep
 * link and after a reload, with no search result in memory.
 */
export const BookDetailResponseSchema = z.object({
  book: BookDetailSchema,
});
export type BookDetailResponse = z.infer<typeof BookDetailResponseSchema>;

/** A phrase, not a paragraph: it becomes a book row's title or its author line. */
export const MAX_MANUAL_BOOK_FIELD_LENGTH = 120;

/**
 * Everything one emoji can take once ZWJ sequences and skin-tone modifiers are counted —
 * which is why this is not 1. `Extended_Pictographic` is what keeps the field from
 * becoming a second title.
 */
export const MAX_COVER_EMOJI_LENGTH = 16;

const manualBookFieldSchema = z
  .string()
  .trim()
  .max(MAX_MANUAL_BOOK_FIELD_LENGTH)
  .optional();

/**
 * The book the reader described themselves, when the catalogue has nothing. Everything but
 * the genre is optional — the title falls back to `Untitled book`, and the genre is what
 * keeps `MoodProfile.genre` non-empty so every screen reading `genre[0]` still resolves.
 */
export const ManualBookSchema = z.object({
  title: manualBookFieldSchema,
  author: manualBookFieldSchema,
  genre: z.array(z.enum(GENRES)).min(1).max(MAX_GENRES),
  coverEmoji: z
    .string()
    .trim()
    .max(MAX_COVER_EMOJI_LENGTH)
    .regex(/\p{Extended_Pictographic}/u, "Cover must be an emoji")
    .optional(),
});
export type ManualBook = z.infer<typeof ManualBookSchema>;

/**
 * A Google volume id, not an internal book id: search persists nothing, so that is the
 * only handle the client holds. The server re-fetches the volume and mints the `Book`
 * row itself, so book metadata is never client-supplied on that path.
 */
const bookOrManualRefinement = <T extends { googleBooksId?: string; manualBook?: unknown }>(
  data: T,
) => (data.googleBooksId ? !data.manualBook : !!data.manualBook);

/**
 * Only a Google volume reaches the Mood Engine. The by-hand path states its own mood, so
 * there is nothing here to analyse and nothing ever called this with a genre.
 */
export const MoodProfileRequestSchema = z.object({
  googleBooksId: z.string(),
});
export type MoodProfileRequest = z.infer<typeof MoodProfileRequestSchema>;

export const MoodProfileResponseSchema = z.object({
  profile: MoodProfileSchema,
});
export type MoodProfileResponse = z.infer<typeof MoodProfileResponseSchema>;

export const GeneratePlaylistRequestSchema = z
  .object({
    googleBooksId: z.string().optional(),
    /** The reader's own description of a book the catalogue could not find. */
    manualBook: ManualBookSchema.optional(),
    /**
     * The profile the user was shown, corrections included. Omitted, the server runs
     * the Mood Engine itself — sent, it is used verbatim, so a corrected mood reaches
     * the Playlist Builder instead of a second, possibly different, read of the book.
     */
    moodProfile: MoodProfileSchema.optional(),
    /**
     * The mood screen's fine-tune answers. Generation only: the screen collects them
     * below Claude's read, so they are never in hand early enough to inform it.
     */
    readingContext: ReadingContextSchema.optional(),
  })
  .refine(bookOrManualRefinement, {
    message: "Exactly one of googleBooksId or manualBook must be set",
  });
export type GeneratePlaylistRequest = z.infer<typeof GeneratePlaylistRequestSchema>;

/** Coerced, not piped: `limit` arrives as a query string. */
export const BookshelfQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(MAX_BOOKSHELF_LIMIT).default(DEFAULT_BOOKSHELF_LIMIT),
});
export type BookshelfQuery = z.infer<typeof BookshelfQuerySchema>;

export const BookshelfResponseSchema = z.object({
  playlists: z.array(PlaylistSchema),
  nextCursor: z.string().nullable(),
});
export type BookshelfResponse = z.infer<typeof BookshelfResponseSchema>;

/**
 * The user-level scope the connector needs, and the whole of it: creating a private
 * playlist, filling it, renaming it and unfollowing it all sit behind this one. Shared
 * because the app asks for it at link time and the server checks for it afterwards.
 */
export const SPOTIFY_PLAYLIST_SCOPES = ["playlist-modify-private"] as const;

export const MusicConnectorStatusResponseSchema = z.object({
  linked: z.boolean(),
  provider: z.literal("spotify"),
});
export type MusicConnectorStatusResponse = z.infer<typeof MusicConnectorStatusResponseSchema>;

export const ExportPlaylistResponseSchema = z.object({
  spotifyPlaylistId: z.string(),
  webUrl: z.string(),
  deepLinkUri: z.string(),
});
export type ExportPlaylistResponse = z.infer<typeof ExportPlaylistResponseSchema>;

/**
 * What a sync should change. Every field is optional: a caller passes what moved and
 * nothing else, so a rename leaves the tracks where the reader dragged them. An empty
 * body means the tracks, which is what a sync meant before there was a body at all.
 */
export const UpdateExportRequestSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
  description: z.string().trim().max(300).optional(),
  tracks: z.boolean().optional(),
});
export type UpdateExportRequest = z.infer<typeof UpdateExportRequestSchema>;
