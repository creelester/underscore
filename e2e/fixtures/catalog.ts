/**
 * The books the fixture upstream serves, and Claude's read of each.
 *
 * Imported by both `upstream-server.ts`, which serves them, and by the specs, which
 * assert on them — so a spec can never drift from what the stack returns.
 *
 * The titles are invented on purpose: a real one would let a run that had escaped to
 * the live Google Books API still look like it passed.
 */

/** The wire values, lowercase, exactly as `MOODS` in packages/shared/src/moodProfile.ts. */
export type FixtureMood =
  | "cozy"
  | "melancholy"
  | "hopeful"
  | "tense"
  | "dreamy"
  | "nostalgic"
  | "romantic"
  | "playful"
  | "epic"
  | "haunting";

export type FixtureBook = {
  googleBooksId: string;
  title: string;
  authors: string[];
  /** Google's taxonomy paths, which the server reduces to `genre`. */
  categories: string[];
  /** What `genresFromCategories()` leaves of the first category — the banner's genre line. */
  genre: string;
  description: string;
  publishedDate: string;
  publishedYear: string;
  pageCount: number;
  publisher: string;
  language: string;
  /** What the fixture answers a mood request about this book with, verbatim. */
  analysis: {
    /** At most two: `MAX_MOODS`, which the real Claude is held to by the same schema. */
    mood: FixtureMood[];
    pacing: "slow" | "steady" | "fast";
    summary: string;
  };
};

export const FIXTURE_BOOKS: FixtureBook[] = [
  {
    googleBooksId: "e2e-lantern",
    title: "The Lantern of Quiet Hours",
    authors: ["Marisol Vane"],
    categories: ["Fiction / Literary / General"],
    genre: "Literary",
    description:
      "A lighthouse keeper counts the winters by the ships she fails to save, until a letter arrives in her own handwriting.",
    publishedDate: "2019-04-16",
    publishedYear: "2019",
    pageCount: 312,
    publisher: "Harbour & Vale",
    language: "en",
    analysis: {
      mood: ["melancholy", "hopeful"],
      pacing: "slow",
      summary: "A grief that never quite closes, told at the speed of tide.",
    },
  },
  {
    googleBooksId: "e2e-ash",
    title: "Ash and Ivory",
    authors: ["Dorian Kell"],
    categories: ["Fiction / Thrillers / Suspense"],
    genre: "Suspense",
    description:
      "Two chess prodigies, one stolen manuscript, and a night train that does not stop where it should.",
    publishedDate: "2023",
    publishedYear: "2023",
    pageCount: 401,
    publisher: "Coldwater Press",
    language: "en",
    analysis: {
      mood: ["tense", "haunting"],
      pacing: "fast",
      summary: "Momentum first: the dread is in how little time anyone is given.",
    },
  },
];

export function fixtureBook(googleBooksId: string): FixtureBook {
  const book = FIXTURE_BOOKS.find((candidate) => candidate.googleBooksId === googleBooksId);
  if (!book) throw new Error(`No fixture book with id "${googleBooksId}"`);
  return book;
}
