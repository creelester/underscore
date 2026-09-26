import { z } from "zod";
import { BookSchema } from "./book";
import { MoodProfileSchema, PACING_LABELS, type MoodProfile } from "./moodProfile";

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

/** A title is a label, not prose — and it has one line of a library row to fit in. */
export const MAX_PLAYLIST_NAME_LENGTH = 60;

/**
 * Claude names a playlist as it builds one. This is the fallback for the generation
 * that came back without a title, and for the manual-genre path, which has no book to
 * take an image from.
 */
export function defaultPlaylistName(profile: MoodProfile): string {
  const pacing = PACING_LABELS[profile.pacing];
  const mood = profile.mood[0];
  if (!mood) return pacing;

  return `${mood[0].toUpperCase()}${mood.slice(1)} ${pacing.toLowerCase()}`;
}

// Spotify's URI and link shapes. Here rather than in the connector because the server
// writes them on export and the app reads them back off a `spotifyPlaylistId` alone.

export function spotifyTrackUri(spotifyTrackId: string): string {
  return `spotify:track:${spotifyTrackId}`;
}

export function spotifyPlaylistDeepLink(spotifyPlaylistId: string): string {
  return `spotify:playlist:${spotifyPlaylistId}`;
}

export function spotifyPlaylistWebUrl(spotifyPlaylistId: string): string {
  return `https://open.spotify.com/playlist/${spotifyPlaylistId}`;
}

export const PlaylistSchema = z.object({
  id: z.string(),
  name: z.string().trim().min(1).max(MAX_PLAYLIST_NAME_LENGTH),
  book: BookSchema,
  moodProfile: MoodProfileSchema,
  tracks: z.array(PlaylistTrackSchema),
  totalRuntimeMs: z.number().int().nonnegative(),
  isTooShort: z.boolean(),
  spotifyPlaylistId: z.string().nullable(),
  createdAt: z.string(),
});
export type Playlist = z.infer<typeof PlaylistSchema>;
