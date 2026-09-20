/**
 * The books the fixture upstream serves, and Claude's read of each.
 *
 * Imported by both `upstream-server.ts`, which serves them, and by the specs, which
 * assert on them — so a spec can never drift from what the stack returns.
 *
 * The titles are invented on purpose: a real one would let a run that had escaped to
 * the live Google Books API still look like it passed.
 */

import type { Genre } from "@underscore/shared";

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
  /** Google's taxonomy paths, the only genre input the server gets from the catalogue. */
  categories: string[];
  /**
   * What `genresFromCategories()` leaves of the first category — the label a search row
   * and book detail show. Deliberately coarser than `analysis.genre`, which is Claude's:
   * the two labels diverge now, and a fixture that blurred them would hide it.
   */
  displayGenre: string;
  description: string;
  publishedDate: string;
  publishedYear: string;
  pageCount: number;
  publisher: string;
  language: string;
  /**
   * The title the fixture's Claude gives a playlist for this book. Absent on purpose
   * for some books: a generation that comes back without one falls through to
   * `defaultPlaylistName`, and both paths are worth a spec.
   */
  playlistName?: string;
  /** What the fixture answers a mood request about this book with, verbatim. */
  analysis: {
    /**
     * Claude's own read of the genre, off the closed `GENRES` list — typed from shared,
     * so a value that is not in the vocabulary fails the typecheck, not a spec.
     */
    genre: Genre[];
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
    displayGenre: "Literary",
    description:
      "A lighthouse keeper counts the winters by the ships she fails to save, until a letter arrives in her own handwriting.",
    publishedDate: "2019-04-16",
    publishedYear: "2019",
    pageCount: 312,
    publisher: "Harbour & Vale",
    language: "en",
    analysis: {
      genre: ["Literary fiction"],
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
    displayGenre: "Suspense",
    description:
      "Two chess prodigies, one stolen manuscript, and a night train that does not stop where it should.",
    publishedDate: "2023",
    publishedYear: "2023",
    pageCount: 401,
    publisher: "Coldwater Press",
    language: "en",
    playlistName: "Night Train Signals",
    analysis: {
      genre: ["Thriller"],
      mood: ["tense", "haunting"],
      pacing: "fast",
      summary: "Momentum first: the dread is in how little time anyone is given.",
    },
  },
  {
    googleBooksId: "e2e-orchard",
    title: "The Orchard at Vesper Hill",
    authors: ["Marisol Vane"],
    categories: ["Fiction / Literary / General"],
    displayGenre: "Literary",
    description:
      "Three sisters inherit a failing orchard and the ledger their mother kept of everything she never said.",
    publishedDate: "2021-09-02",
    publishedYear: "2021",
    pageCount: 288,
    publisher: "Harbour & Vale",
    language: "en",
    playlistName: "Windfall Season",
    analysis: {
      genre: ["Literary fiction"],
      mood: ["nostalgic", "cozy"],
      pacing: "steady",
      summary: "Warm at the edges, with a long argument running underneath it.",
    },
  },
  {
    googleBooksId: "e2e-tessellate",
    title: "Tessellate",
    authors: ["Ines Harrow"],
    categories: ["Fiction / Science Fiction / Hard Science Fiction"],
    displayGenre: "Hard Science Fiction",
    description:
      "A cartographer of impossible rooms is hired to map a building that finishes her sentences.",
    publishedDate: "2024-01-30",
    publishedYear: "2024",
    pageCount: 356,
    publisher: "Meridian House",
    language: "en",
    playlistName: "Cut Glass Dawn",
    analysis: {
      genre: ["Science fiction"],
      mood: ["dreamy", "tense"],
      pacing: "steady",
      summary: "Geometry as dread: the unease is architectural, never loud.",
    },
  },
  {
    googleBooksId: "e2e-saltmarsh",
    title: "Saltmarsh Almanac",
    authors: ["Marisol Vane"],
    categories: ["Nature / Ecology"],
    displayGenre: "Ecology",
    description:
      "A year of tide charts, bird counts and the slow disappearance of a coastline nobody is measuring.",
    publishedDate: "2018-06-11",
    publishedYear: "2018",
    pageCount: 224,
    publisher: "Harbour & Vale",
    language: "en",
    playlistName: "Tide Tables",
    analysis: {
      genre: ["Nature writing"],
      mood: ["cozy", "melancholy"],
      pacing: "slow",
      summary: "Patient observation, and an elegy the author never admits to writing.",
    },
  },
  {
    googleBooksId: "e2e-quarry",
    title: "The Quarry Sings at Night",
    authors: ["Marisol Vane"],
    categories: ["Fiction / Mystery & Detective / General"],
    displayGenre: "Mystery & Detective",
    description:
      "A flooded quarry gives up a car with no driver, and a village agrees on the wrong story.",
    publishedDate: "2025-03-18",
    publishedYear: "2025",
    pageCount: 342,
    publisher: "Coldwater Press",
    language: "en",
    playlistName: "Deep Water Marks",
    analysis: {
      genre: ["Mystery"],
      mood: ["haunting", "tense"],
      pacing: "steady",
      summary: "A quiet place keeping a loud secret, and everyone rehearsing their part.",
    },
  },
];

export function fixtureBook(googleBooksId: string): FixtureBook {
  const book = FIXTURE_BOOKS.find((candidate) => candidate.googleBooksId === googleBooksId);
  if (!book) throw new Error(`No fixture book with id "${googleBooksId}"`);
  return book;
}
