import { z } from "zod";
import { BookSchema } from "./book";
import { MoodProfileSchema } from "./moodProfile";

export const TrackSchema = z.object({
  spotifyTrackId: z.string(),
  name: z.string(),
  artist: z.string(),
  albumArtUrl: z.string().nullable(),
  durationMs: z.number().int().positive(),
});
export type Track = z.infer<typeof TrackSchema>;

export const PlaylistTrackSchema = z.object({
  track: TrackSchema,
  position: z.number().int().nonnegative(),
  isAnchor: z.boolean(),
});
export type PlaylistTrack = z.infer<typeof PlaylistTrackSchema>;

export const PlaylistSchema = z.object({
  id: z.string(),
  book: BookSchema,
  moodProfile: MoodProfileSchema,
  tracks: z.array(PlaylistTrackSchema),
  totalRuntimeMs: z.number().int().nonnegative(),
  smallerThanUsual: z.boolean(),
  spotifyPlaylistId: z.string().nullable(),
  createdAt: z.string(),
});
export type Playlist = z.infer<typeof PlaylistSchema>;
