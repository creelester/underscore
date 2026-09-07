import { SOMETHING_ELSE, type BookDetail, type MoodProfile, type ReadingContext } from "@underscore/shared";

/**
 * What Claude is asked, kept apart from how it is asked. `anthropic.ts` owns the
 * transport and the schemas; the wording lives here, where it can be read and tuned
 * without the request plumbing around it.
 */

/** The design's "~30 tracks". Asked for in the prompt — a JSON schema takes no length bound. */
export const ANCHOR_COUNT = 30;

export const MOOD_SYSTEM = `You read a book's metadata and report the mood a soundtrack for it should carry.
Choose at most two moods, the ones a reader would recognise from the first chapter.
Pacing is the book's rhythm, not its length. The summary is one or two sentences of
rationale, and the only place nuance outside the mood vocabulary belongs.`;

export function moodPrompt(book: BookDetail): string {
  return [
    `Title: ${book.title}`,
    `Authors: ${book.authors.join(", ") || "unknown"}`,
    `Categories: ${book.categories.join("; ") || "none given"}`,
    `Description: ${book.description ?? "none given"}`,
  ].join("\n");
}

export const ANCHOR_SYSTEM = `You build reading soundtracks: instrumental-leaning, cinematic playlists
that sit behind a book without competing with it.
Suggest real, released tracks a listener could find on Spotify — exact artist and track
names, no compilations, no invented titles, no two tracks by the same artist.
If the book has a film, television or game adaptation with a released score, draw a few
tracks from it.`;

/** The chip unless it was the escape hatch, in which case whatever was typed under it. */
function resolveDetail(choice: string | null, other: string | null): string | null {
  if (choice !== SOMETHING_ELSE) return choice;
  return other?.trim() || null;
}

/**
 * The fine-tune answers, as prompt lines. Lyrics always renders, since both states say
 * something against ANCHOR_SYSTEM's instrumental lean. Format only earns a line for an
 * audiobook, where a narrator is already competing for the ear.
 */
function readingContextLines(context: ReadingContext): (string | null)[] {
  const setting = resolveDetail(context.setting, context.settingOther);
  const era = resolveDetail(context.era, context.eraOther);
  const moodOther = context.moodOther?.trim();

  return [
    // Beside the profile's own moods, not instead of them — the reader reaching for a
    // word the vocabulary lacks is exactly the nuance the enum cannot hold.
    moodOther ? `The reader also calls it: ${moodOther}` : null,
    context.lyrics
      ? "Lyrics: tracks with vocals are welcome alongside instrumentals."
      : "Lyrics: instrumental only — no vocals.",
    context.format === "Audiobook"
      ? "The reader is listening to an audiobook, so nothing should crowd a narrator."
      : null,
    setting ? `Setting: ${setting}` : null,
    era ? `Era: ${era}` : null,
  ];
}

/** `book` is absent on the manual-genre path, which has no book behind it. */
export function anchorPrompt(
  profile: MoodProfile,
  book?: Pick<BookDetail, "title" | "authors">,
  context?: ReadingContext,
): string {
  return [
    book ? `Book: ${book.title} by ${book.authors.join(", ") || "unknown"}` : null,
    `Genre: ${profile.genre.join(", ") || "unspecified"}`,
    `Mood: ${profile.mood.join(", ") || "unspecified"}`,
    `Pacing: ${profile.pacing}`,
    profile.summary ? `Reader's experience: ${profile.summary}` : null,
    ...(context ? readingContextLines(context) : []),
    "",
    `Suggest exactly ${ANCHOR_COUNT} tracks.`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}
