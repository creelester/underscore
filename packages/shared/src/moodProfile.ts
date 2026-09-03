import { z } from 'zod';
import { MAX_GENRES } from './book';

/**
 * The closed mood vocabulary. Each mood is a two-stop gradient that stands in for artwork
 * throughout the app, and the correction UI offers exactly these as chips — so a mood outside
 * this list has no artwork and no way for the user to confirm or correct it.
 *
 * Gradient stops: app/src/lib/gradients.ts (MOOD_STOPS)
 */
export const MOODS = [
  'cozy',
  'melancholy',
  'hopeful',
  'tense',
  'dreamy',
  'nostalgic',
  'romantic',
  'playful',
  'epic',
  'haunting',
] as const;
export type Mood = (typeof MOODS)[number];

/** Applied when a profile carries no mood — matches the design's no-chip-selected default. */
export const DEFAULT_MOOD: Mood = 'melancholy';

export const MoodProfileSchema = z.object({
  genre: z.array(z.string()).max(MAX_GENRES),
  /** Empty on the manual-genre path; capped at two, which is what the design lets the user pick. */
  mood: z.array(z.enum(MOODS)).max(2),
  pacing: z.enum(['slow', 'steady', 'fast']),
  summary: z.string(),
});
export type MoodProfile = z.infer<typeof MoodProfileSchema>;
