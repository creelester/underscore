import { z } from "zod";

export const BookSourceSchema = z.enum(["GOOGLE_BOOKS", "MANUAL_GENRE"]);
export type BookSource = z.infer<typeof BookSourceSchema>;

/** A book we have persisted — it has an internal id and a playlist behind it. */
export const BookSchema = z.object({
  id: z.string(),
  googleBooksId: z.string().nullable(),
  title: z.string(),
  authors: z.array(z.string()),
  description: z.string().nullable(),
  categories: z.array(z.string()),
  pageCount: z.number().int().positive().nullable(),
  thumbnailUrl: z.string().nullable(),
  source: BookSourceSchema,
});
export type Book = z.infer<typeof BookSchema>;

/**
 * A search hit, which is not persisted. `GET /api/books/search` writes nothing —
 * a `Book` row is minted only when a playlist is generated — so a candidate has
 * no internal `id` to offer and is identified by its Google volume id, which is
 * what the generation endpoints take. `source` is omitted because search only
 * ever returns Google results; MANUAL_GENRE books never pass through here.
 */
export const BookCandidateSchema = BookSchema.omit({
  id: true,
  source: true,
}).extend({
  googleBooksId: z.string(),
  // Display metadata for a search row (`Author · Year · Genre`), not a property of
  // a book we keep: it is never persisted, so it lives here rather than on
  // `BookSchema`, and the Prisma `book` table has no column for it. Null whenever
  // Google omits `publishedDate` or reports something we cannot read a year out of.
  publishedYear: z.number().int().nullable(),
});
export type BookCandidate = z.infer<typeof BookCandidateSchema>;

/**
 * A candidate plus the catalogue metadata the book detail screen lists as facts —
 * publisher, full publication date, language, ISBN and the community rating.
 *
 * Separate from `BookCandidate` rather than folded into it because a search row
 * shows none of this: carrying it would mean ~20 volumes' worth of fields per
 * keystroke to render `Author · Year · Genre`. Every field is nullable because
 * Google omits rather than nulls, and a book with no ISBN is ordinary, not an
 * error — the screen drops the row instead.
 */
export const BookDetailSchema = BookCandidateSchema.extend({
  publisher: z.string().nullable(),
  /** Whatever precision Google holds: "2020", "2020-09" or "2020-09-15". */
  publishedDate: z.string().nullable(),
  /** BCP-47, usually a bare ISO-639-1 code like "en". */
  language: z.string().nullable(),
  averageRating: z.number().nullable(),
  ratingsCount: z.number().int().nullable(),
});
export type BookDetail = z.infer<typeof BookDetailSchema>;

/**
 * The genre of a book, taken from Google's own subject categories.
 *
 * This is the *product* rule, not a display helper: when a book is scored, the
 * `MoodProfile.genre` on the resulting playlist comes from here rather than from
 * Claude. Google already classifies the volume, so asking the model to re-derive
 * something the catalogue states is a round trip that can only introduce
 * disagreement — and the two paths now line up, since the by-hand fallback also
 * takes its genres from the user rather than inferring them.
 *
 * Lives in shared because the server writes it onto the profile and the app
 * renders it, and a rule applied differently on the two sides is a bug waiting
 * to happen.
 */

/** Google files categories as taxonomy paths — `"Fiction / Fantasy / General"`. */
const CATEGORY_SEPARATOR = "/";

/**
 * Path segments that classify nothing. Google uses them as leaves constantly,
 * and `"General"` as a genre says less than the parent it hangs off.
 */
const FILLER_SEGMENTS = new Set(["general", "other", "nonclassifiable"]);

/** What the by-hand path lets the user pick, so both paths cap the same way. */
export const MAX_GENRES = 3;

/**
 * The useful genre in one category path: the last segment that isn't filler, so
 * `"Fiction / Fantasy / General"` reads `"Fantasy"` and a bare `"Fiction"` stays
 * `"Fiction"`.
 */
function leafGenre(category: string): string | null {
  const segments = category
    .split(CATEGORY_SEPARATOR)
    .map((segment) => segment.trim())
    .filter((segment) => segment && !FILLER_SEGMENTS.has(segment.toLowerCase()));

  return segments.at(-1) ?? null;
}

/**
 * Normalized genres for a volume, most representative first — Google orders its
 * categories that way and the profile's `genre` is documented in the same order.
 *
 * Deduplicated case-insensitively, because a volume routinely carries several
 * paths that bottom out on the same word.
 */
export function genresFromCategories(categories: readonly string[]): string[] {
  const genres: string[] = [];
  const seen = new Set<string>();

  for (const category of categories) {
    const genre = leafGenre(category);
    if (!genre || seen.has(genre.toLowerCase())) continue;

    seen.add(genre.toLowerCase());
    genres.push(genre);
    if (genres.length === MAX_GENRES) break;
  }

  return genres;
}
