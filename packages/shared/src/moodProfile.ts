import { z } from 'zod';
import { MAX_GENRE_LENGTH, MAX_GENRES } from './book';

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

/** What the correction UI lets the user pick, and so what Claude is held to. */
export const MAX_MOODS = 2;

/** For a profile with no mood, matching the design's no-chip-selected default. */
export const DEFAULT_MOOD: Mood = 'melancholy';

export const MoodProfileSchema = z.object({
  genre: z.array(z.string().min(1).max(MAX_GENRE_LENGTH)).max(MAX_GENRES),
  /** Empty on the manual-genre path. */
  mood: z.array(z.enum(MOODS)).max(MAX_MOODS),
  pacing: z.enum(['slow', 'steady', 'fast']),
  summary: z.string(),
});
export type MoodProfile = z.infer<typeof MoodProfileSchema>;

/** Display labels only; the wire values stay `MoodProfile.pacing`. */
export const PACING_LABELS: Record<MoodProfile['pacing'], string> = {
  slow: 'Slow burn',
  steady: 'Steady',
  fast: 'Breakneck',
};
