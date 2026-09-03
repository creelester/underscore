import { z } from "zod";
import { BookCandidateSchema } from "./book";
import { PlaylistSchema } from "./playlist";
import { MoodProfileSchema } from "./moodProfile";

export const BookSearchQuerySchema = z.object({
  q: z.string().trim().min(1, "A search term is required"),
});
export type BookSearchQuery = z.infer<typeof BookSearchQuerySchema>;

export const BookSearchResponseSchema = z.object({
  results: z.array(BookCandidateSchema),
});
export type BookSearchResponse = z.infer<typeof BookSearchResponseSchema>;

/**
 * A single volume, for the book detail screen. Same `BookCandidate` search
 * returns and equally unpersisted — the screen has to be reachable by deep link
 * and after a reload, when no search result is in memory to read from.
 */
export const BookDetailResponseSchema = z.object({
  book: BookCandidateSchema,
});
export type BookDetailResponse = z.infer<typeof BookDetailResponseSchema>;

/**
 * The generation endpoints take a Google volume id rather than an internal book
 * id: search persists nothing, so at the point of asking for a playlist the only
 * handle the client holds is Google's. The server re-fetches the volume and
 * mints the `Book` row itself, so book metadata is never client-supplied.
 */
const bookOrGenreRefinement = <T extends { googleBooksId?: string; manualGenre?: string }>(
  data: T,
) => (data.googleBooksId ? !data.manualGenre : !!data.manualGenre);

export const MoodProfileRequestSchema = z
  .object({
    googleBooksId: z.string().optional(),
    manualGenre: z.string().optional(),
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
    manualGenre: z.string().optional(),
  })
  .refine(bookOrGenreRefinement, {
    message: "Exactly one of googleBooksId or manualGenre must be set",
  });
export type GeneratePlaylistRequest = z.infer<typeof GeneratePlaylistRequestSchema>;

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
