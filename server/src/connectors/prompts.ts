import type { BookDetail, MoodProfile } from "@underscore/shared";

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

/** `book` is absent on the manual-genre path, which has no book behind it. */
export function anchorPrompt(
  profile: MoodProfile,
  book?: Pick<BookDetail, "title" | "authors">,
): string {
  return [
    book ? `Book: ${book.title} by ${book.authors.join(", ") || "unknown"}` : null,
    `Genre: ${profile.genre.join(", ") || "unspecified"}`,
    `Mood: ${profile.mood.join(", ") || "unspecified"}`,
    `Pacing: ${profile.pacing}`,
    profile.summary ? `Reader's experience: ${profile.summary}` : null,
    "",
    `Suggest exactly ${ANCHOR_COUNT} tracks.`,
  ]
    .filter((line) => line !== null)
    .join("\n");
}
