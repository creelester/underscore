import { z } from "zod";

export const BookSourceSchema = z.enum(["GOOGLE_BOOKS", "MANUAL_GENRE"]);
export type BookSource = z.infer<typeof BookSourceSchema>;

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
