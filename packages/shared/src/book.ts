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
