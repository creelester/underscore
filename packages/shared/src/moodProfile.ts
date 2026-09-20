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

/**
 * The closed genre vocabulary. Claude names the genre from the book itself — Google's
 * categories bottom out at "Fiction" for most trade fiction — and is held to this list
 * so the label reads the same across books and the by-hand picker has something finite
 * to render.
 */
export const GENRES = [
  'Literary fiction',
  'Science fiction',
  'Fantasy',
  'Horror',
  'Thriller',
  'Mystery',
  'Crime',
  'Romance',
  'Historical fiction',
  'Adventure',
  'Dystopian',
  'Magical realism',
  'Gothic',
  'Western',
  'Satire',
  'Short stories',
  'Poetry',
  'Graphic novel',
  'Young adult',
  "Children's",
  'Memoir',
  'Biography',
  'History',
  'True crime',
  'Essays',
  'Science',
  'Nature writing',
  'Philosophy',
  'Psychology',
  'Politics',
  'Travel',
  'Business',
  'Self-help',
  'Religion & spirituality',
  'Art & design',
  'Music',
  'Sports',
  'Food & cooking',
] as const;
export type Genre = (typeof GENRES)[number];

/** What the correction UI lets the user pick, and so what Claude is held to. */
export const MAX_MOODS = 2;

/** For a profile with no mood, matching the design's no-chip-selected default. */
export const DEFAULT_MOOD: Mood = 'melancholy';

export const MoodProfileSchema = z.object({
  genre: z.array(z.enum(GENRES)).max(MAX_GENRES),
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
