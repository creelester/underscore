/**
 * The optional context book detail collects under `Help the model out`, from the
 * design's screen 5.
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

/**
 * The option that trades the closed list for a free-text field. It is a real
 * member of each list rather than a separate control, because the design draws
 * it as one more chip and only reveals the input once it is chosen.
 */
export const SOMETHING_ELSE = 'Something else';

export const BOOK_FORMATS = ['Print', 'Ebook', 'Audiobook'] as const;

export const SETTINGS = [
  'City',
  'Small town',
  'Countryside',
  'Coast or sea',
  'Wilderness',
  'Another world',
  SOMETHING_ELSE,
] as const;

export const ERAS = [
  'Ancient world',
  'Medieval',
  'Pre-industrial',
  'Industrial',
  'Modern',
  'Present day',
  'Near future',
  'Far future',
  SOMETHING_ELSE,
] as const;

export type BookFormat = (typeof BOOK_FORMATS)[number];
export type Setting = (typeof SETTINGS)[number];
export type Era = (typeof ERAS)[number];

export const SECTION_TITLE = 'Help the model out';
export const SECTION_SUBTITLE = 'Optional. Anything you add sharpens the score.';

export const FORMAT_LABEL = 'Book format';
export const SETTING_LABEL = 'Setting';
export const ERA_LABEL = 'Era';

export const SETTING_OTHER_PLACEHOLDER = 'Where is it set?';
export const ERA_OTHER_PLACEHOLDER = 'Which era? e.g. the 1970s';

export const LYRICS_LABEL = 'Lyrics';
export const LYRICS_DESCRIPTION = 'Include music with lyrics';
