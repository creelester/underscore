import { z } from "zod";

/**
 * The optional answers the mood screen collects under `Fine-tune to sharpen the score`.
 * They reach the Playlist Builder only — the design puts them below Claude's read, so
 * the analysis has already run by the time they exist and they can shape tracks but not
 * mood. Every group is optional and nothing is pre-selected: the happy path is pressing
 * `Generate playlist` on the read as given.
 *
 * Closed vocabularies for the same reason `MOODS` is closed — a value with no chip is a
 * value the user can neither pick nor change.
 */

/** The chip that trades the closed list for a free-text field, drawn as one more option. */
export const OTHER = "Something else";

export const BOOK_FORMATS = ["Print", "Ebook", "Audiobook"] as const;

export const SETTINGS = [
  "City",
  "Small town",
  "Countryside",
  "Coast or sea",
  "Wilderness",
  "Another world",
  OTHER,
] as const;

export const ERAS = [
  "Ancient world",
  "Medieval",
  "Pre-industrial",
  "Industrial",
  "Modern",
  "Present day",
  "Near future",
  "Far future",
  OTHER,
] as const;

export type BookFormat = (typeof BOOK_FORMATS)[number];
export type Setting = (typeof SETTINGS)[number];
export type Era = (typeof ERAS)[number];

/** A phrase, not a paragraph — it becomes one line of a prompt. */
export const MAX_READING_DETAIL_LENGTH = 60;

const otherSchema = z.string().trim().max(MAX_READING_DETAIL_LENGTH).optional();

/**
 * The `Something else` text stays in its own field rather than replacing the chip
 * value, so the server can tell a vocabulary answer from the escape hatch. Every answer
 * is optional rather than nullable: none of them is ever deliberately empty, they are
 * simply not given.
 */
export const ReadingContextSchema = z.object({
  lyrics: z.boolean(),
  /**
   * A mood the closed vocabulary cannot carry, in the reader's own words. It rides here
   * rather than in `MoodProfile.mood` because that enum stays closed — every value there
   * needs a gradient and a chip. Absent means the option was never chosen.
   */
  moodOther: otherSchema,
  format: z.enum(BOOK_FORMATS).optional(),
  setting: z.enum(SETTINGS).optional(),
  settingOther: otherSchema,
  era: z.enum(ERAS).optional(),
  eraOther: otherSchema,
});
export type ReadingContext = z.infer<typeof ReadingContextSchema>;
