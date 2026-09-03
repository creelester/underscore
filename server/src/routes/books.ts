import { Router } from 'express';
import {
  BookDetailResponseSchema,
  BookSearchQuerySchema,
  BookSearchResponseSchema,
} from '@underscore/shared';
import { fetchVolume, searchVolumes } from '../connectors/googleBooks';
import { ApiError } from '../lib/apiError';
import { asyncHandler } from '../lib/asyncHandler';
import { requireSession } from '../middleware/requireSession';

export const booksRouter = Router();

/**
 * GET /api/books/search?q=…
 *
 * Read-only by design: no Book row is written here. A search hit is a candidate
 * keyed by its Google volume id, and the row is minted later, when a playlist is
 * actually generated from it. See the Books section of the API design doc.
 */
booksRouter.get(
  '/search',
  requireSession,
  asyncHandler(async (req, res) => {
    const query = BookSearchQuerySchema.safeParse(req.query);
    if (!query.success) {
      throw ApiError.invalidInput(
        query.error.issues[0]?.message ?? 'Invalid search query',
      );
    }

    const results = await searchVolumes(query.data.q);

    // Parsing our own output keeps the server honest about the contract the app
    // is built against — a connector change that breaks the shape fails here
    // rather than in the client.
    res.json(BookSearchResponseSchema.parse({ results }));
  }),
);

/**
 * GET /api/books/:googleBooksId
 *
 * The book detail screen's read. Registered after `/search` so the literal path
 * keeps winning — Express matches in declaration order, and a param route here
 * would otherwise swallow it.
 *
 * Read-only for the same reason search is: the `Book` row is minted by
 * `POST /api/playlists/generate`, which re-fetches the volume itself. Nothing a
 * client sends here is ever persisted.
 */
booksRouter.get(
  '/:googleBooksId',
  requireSession,
  asyncHandler(async (req, res) => {
    const book = await fetchVolume(req.params.googleBooksId);
    if (!book) throw ApiError.bookNotFound();

    res.json(BookDetailResponseSchema.parse({ book }));
  }),
);
