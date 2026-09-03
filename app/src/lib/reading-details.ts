/**
 * The optional context book detail collects under the slider, from the design's
 * screen 5.
 *
 * App-local rather than in `@underscore/shared` because none of it crosses the
 * wire yet — the mood endpoint that will take it does not exist. When it does,
 * these move to shared and become zod enums beside `MOODS`, for the reason the
 * mood vocabulary is closed: a value with no chip is a value the user can
 * neither pick nor correct.
 *
 * Every group is optional and nothing is pre-selected. The happy path is still
 * naming the book and pressing Analyze — the design's governing constraint is
 * that no mood control is ever required.
 */

export const READING_FORMATS = ['Print', 'Ebook', 'Audiobook'] as const;
export type ReadingFormat = (typeof READING_FORMATS)[number];

export const SETTINGS = [
  'City',
  'Small town',
  'Countryside',
  'Coast or sea',
  'Wilderness',
  'Another world',
] as const;
export type Setting = (typeof SETTINGS)[number];

/** Typographic apostrophe — the design's copy, not an ASCII stand-in. */
export const FORMAT_LABEL = 'How you’re reading it';
export const SETTING_LABEL = 'Setting';
export const LYRICS_LABEL = 'Lyrics';
