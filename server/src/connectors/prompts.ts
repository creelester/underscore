import { ANCHOR_COUNT, OTHER, type BookDetail, type MoodProfile, type ReadingContext } from "@underscore/shared";

/**
 * What Claude is asked, kept apart from how it is asked. `anthropic.ts` owns the
 * transport and the schemas; the wording lives here, where it can be read and tuned
 * without the request plumbing around it.
 */

export const MOOD_SYSTEM = `You read a book's metadata and report the genre and the mood a
soundtrack for it should carry.
Name one or two genres, the most representative first, always at least one — the closest
on the list when none of them fits exactly. The categories you are given are a catalogue's,
and are usually too coarse to be the answer.
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

export const ANCHOR_SYSTEM = `You build reading soundtracks: playlists that sit behind a book
without competing with it.
The mood is the brief. Every track has to carry it, and a track has not earned its place by
being instrumental and cinematic — genre and pacing only shape a list the mood has already
decided. Suggest real, released tracks a listener could find on Spotify: exact artist and
track names, no compilations, no invented titles, no two tracks by the same artist. Lean
instrumental unless the reader's answers say otherwise.
Reach wide for them. At most four of the tracks may come from the modern post-classical
school of solo piano and small string ensemble: that music already fills every playlist ever
made for reading, and a fifth from it displaces something this book actually needed. Across
the list, draw on at least four of — scores for film, television and games; contemporary
classical or ambient; electronic; jazz; the folk or traditional music of any culture;
post-rock; popular music in a language other than English.
If the book has a film, television or game adaptation with a released score, up to three
tracks may come from it.
Order them as an arc rather than a ranking: where the book opens, where it turns, where it
leaves the reader.
Name the playlist too: two to four words, an image or a phrase the book earns rather
than a description of it — "Tides and Statues", "Small Town, Long Fuse", "Coal and
Frost". Never the book's title, never the mood or pacing word, never the word playlist.`;

/**
 * One steer, drawn per request. Opus 5 takes no sampling parameters — `temperature`,
 * `top_p` and `top_k` are removed and return a 400 — so the same profile asked twice
 * returns the same list unless the prompt itself differs. This is that difference, and it
 * is why a regeneration is worth asking for at all.
 */
const ANGLES = [
  "strings, voice and acoustic instruments",
  "electronics, synthesizers and processed sound",
  "percussion, guitar and bands playing in a room together",
  "recordings made before 1995",
  "recordings from the last five years",
  "artists recording outside the English-speaking world",
  "the scores of film, television and games",
  "folk and traditional music",
] as const;

/** The chip unless it was the escape hatch, in which case whatever was typed under it. */
function resolveDetail(choice?: string, other?: string): string | undefined {
  if (choice !== OTHER) return choice;
  return other?.trim() || undefined;
}

/**
 * The fine-tune answers, as prompt lines. Lyrics always renders: one state confirms
 * ANCHOR_SYSTEM's default, the other is the only thing that lifts it. Format only earns a
 * line for an audiobook, where a narrator is already competing for the ear.
 */
function readingContextLines(context: ReadingContext): (string | undefined)[] {
  const setting = resolveDetail(context.setting, context.settingOther);
  const era = resolveDetail(context.era, context.eraOther);

  return [
    context.lyrics
      ? "Lyrics: tracks with vocals are welcome alongside instrumentals."
      : "Lyrics: instrumental only — no vocals.",
    context.format === "Audiobook"
      ? "The reader is listening to an audiobook, so nothing should crowd a narrator."
      : undefined,
    setting ? `Setting: ${setting}` : undefined,
    era ? `Era: ${era}` : undefined,
  ];
}

/**
 * The moods, with a typed `Something else` among them rather than as a footnote — the
 * reader reaching for a word the vocabulary lacks is the nuance the enum cannot hold, and
 * it should weigh as much as the two it sits beside.
 */
function moodLine(profile: MoodProfile): string {
  return `Mood: ${beside(profile.mood, profile.moodOther) || "unspecified"}`;
}

/** Same shape as the moods, for the same reason — the by-hand picker has its own escape hatch. */
function genreLine(profile: MoodProfile): string {
  return `Genre: ${beside(profile.genre, profile.genreOther) || "unspecified"}`;
}

/** A closed vocabulary's values with the reader's own word among them, not after them. */
function beside(chosen: readonly string[], other?: string): string {
  return [...chosen, ...(other?.trim() ? [other.trim()] : [])].join(", ");
}

export type AnchorRequest = {
  profile: MoodProfile;
  /**
   * The catalogue volume, or on the by-hand path what the reader typed — Claude may well
   * know a book Google Books came back empty on. Absent only when no title was given.
   */
  book?: Pick<BookDetail, "title" | "authors">;
  /** Absent whenever the caller had no fine-tune answers to pass on. */
  context?: ReadingContext;
  /** `artist — title` of tracks this list must not suggest. */
  exclude?: string[];
};

export function anchorPrompt({ profile, book, context, exclude }: AnchorRequest): string {
  const angle = ANGLES[Math.floor(Math.random() * ANGLES.length)];

  return [
    book ? `Book: ${book.title} by ${book.authors.join(", ") || "unknown"}` : undefined,
    genreLine(profile),
    moodLine(profile),
    `Pacing: ${profile.pacing}`,
    profile.summary ? `Reader's experience: ${profile.summary}` : undefined,
    ...(context ? readingContextLines(context) : []),
    `Lean this list toward ${angle}, so far as the mood and the lyrics rule still hold.`,
    exclude?.length ? ["", "Do not suggest any of these:", ...exclude].join("\n") : undefined,
    "",
    `Suggest exactly ${ANCHOR_COUNT} tracks, and name the playlist in two to four words that are not the book's title.`,
  ]
    .filter((line) => line !== undefined)
    .join("\n");
}
