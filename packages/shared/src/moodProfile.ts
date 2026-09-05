import { z } from 'zod';
import { MAX_GENRES } from './book';

/**
 * The closed mood vocabulary. Each mood needs a gradient standing in for artwork
 * (`MOOD_STOPS` in app/src/lib/gradients.ts) and a chip in the correction UI, so a mood
 * outside this list would render as a hole.
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

/** For a profile with no mood, matching the design's no-chip-selected default. */
export const DEFAULT_MOOD: Mood = 'melancholy';

export const MoodProfileSchema = z.object({
  genre: z.array(z.string()).max(MAX_GENRES),
  /** Empty on the manual-genre path; capped at two, which is what the design lets the user pick. */
  mood: z.array(z.enum(MOODS)).max(2),
  pacing: z.enum(['slow', 'steady', 'fast']),
  summary: z.string(),
});
export type MoodProfile = z.infer<typeof MoodProfileSchema>;
