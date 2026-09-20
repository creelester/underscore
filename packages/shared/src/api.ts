import { z } from "zod";
import { BookCandidateSchema, BookDetailSchema } from "./book";
import { PlaylistSchema } from "./playlist";
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

/**
 * A Google volume id, not an internal book id: search persists nothing, so that is the
 * only handle the client holds. The server re-fetches the volume and mints the `Book`
 * row itself, so book metadata is never client-supplied.
 */
const bookOrGenreRefinement = <T extends { googleBooksId?: string; manualGenre?: string }>(
  data: T,
) => (data.googleBooksId ? !data.manualGenre : !!data.manualGenre);

/** The same closed vocabulary Claude answers in; it becomes the `MANUAL_GENRE` book's title. */
const manualGenreSchema = z.enum(GENRES);

export const MoodProfileRequestSchema = z
  .object({
    googleBooksId: z.string().optional(),
    manualGenre: manualGenreSchema.optional(),
  })
  .refine(bookOrGenreRefinement, {
    message: "Exactly one of googleBooksId or manualGenre must be set",
  });
export type MoodProfileRequest = z.infer<typeof MoodProfileRequestSchema>;

export const MoodProfileResponseSchema = z.object({
  profile: MoodProfileSchema,
});
export type MoodProfileResponse = z.infer<typeof MoodProfileResponseSchema>;

export const GeneratePlaylistRequestSchema = z
  .object({
    googleBooksId: z.string().optional(),
    manualGenre: manualGenreSchema.optional(),
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
  .refine(bookOrGenreRefinement, {
    message: "Exactly one of googleBooksId or manualGenre must be set",
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
