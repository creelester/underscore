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
 * A search hit, not persisted — a `Book` row is minted only when a playlist is
 * generated, so this is identified by its Google volume id. No `source`: search
 * only ever returns Google results.
 */
export const BookCandidateSchema = BookSchema.omit({
  id: true,
  source: true,
}).extend({
  googleBooksId: z.string(),
  // Display metadata for a search row, never persisted — hence here and not on
  // `BookSchema`. Null when Google omits or garbles `publishedDate`.
  publishedYear: z.number().int().nullable(),
});
export type BookCandidate = z.infer<typeof BookCandidateSchema>;

/**
 * A candidate plus the catalogue metadata book detail lists as facts. Kept apart
 * from `BookCandidate` because a search row shows none of it and would carry ~20
 * volumes' worth of unused fields per keystroke. All nullable — Google omits.
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
 * The product rule, not a display helper: `MoodProfile.genre` comes from here
 * rather than from Claude, since Google already classifies the volume. Shared
 * because the server writes it onto the profile and the app renders it.
 */

/** Google files categories as taxonomy paths — `"Fiction / Fantasy / General"`. */
const CATEGORY_SEPARATOR = "/";

/** Segments that classify nothing; Google uses them as leaves constantly. */
const FILLER_SEGMENTS = new Set(["general", "other", "nonclassifiable"]);

/** What the by-hand path lets the user pick, so both paths cap the same way. */
export const MAX_GENRES = 3;

/**
 * A genre is a label, not prose. Enforced because both a corrected profile and the
 * by-hand path put client text into a persisted column.
 */
export const MAX_GENRE_LENGTH = 60;

/** Last non-filler segment: `"Fiction / Fantasy / General"` → `"Fantasy"`. */
function leafGenre(category: string): string | null {
  const segments = category
    .split(CATEGORY_SEPARATOR)
    .map((segment) => segment.trim())
    .filter((segment) => segment && !FILLER_SEGMENTS.has(segment.toLowerCase()));

  return segments.at(-1) ?? null;
}

/**
 * Normalized genres, most representative first — Google orders its categories that
 * way. Deduplicated case-insensitively; paths routinely bottom out on the same word.
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
