import { z } from "zod";
import { BookSchema } from "./book";
import { PlaylistSchema } from "./playlist";
import { MoodProfileSchema } from "./moodProfile";

export const BookSearchResponseSchema = z.object({
  results: z.array(BookSchema),
});
export type BookSearchResponse = z.infer<typeof BookSearchResponseSchema>;

const bookOrGenreRefinement = <T extends { bookId?: string; manualGenre?: string }>(
  data: T,
) => (data.bookId ? !data.manualGenre : !!data.manualGenre);

export const MoodProfileRequestSchema = z
  .object({
    bookId: z.string().optional(),
    manualGenre: z.string().optional(),
  })
  .refine(bookOrGenreRefinement, {
    message: "Exactly one of bookId or manualGenre must be set",
  });
export type MoodProfileRequest = z.infer<typeof MoodProfileRequestSchema>;

export const MoodProfileResponseSchema = z.object({
  profile: MoodProfileSchema,
});
export type MoodProfileResponse = z.infer<typeof MoodProfileResponseSchema>;

export const GeneratePlaylistRequestSchema = z
  .object({
    bookId: z.string().optional(),
    manualGenre: z.string().optional(),
  })
  .refine(bookOrGenreRefinement, {
    message: "Exactly one of bookId or manualGenre must be set",
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
