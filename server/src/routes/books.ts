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
 * GET /api/books/search?q=… — read-only. The `Book` row is minted later, when a
 * playlist is generated from the candidate.
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

    // Parsing our own output means a connector change that breaks the shape fails here
    // rather than in the client.
    res.json(BookSearchResponseSchema.parse({ results }));
  }),
);

/**
 * GET /api/books/:googleBooksId — the book detail read, also read-only. Registered
 * after `/search` so the literal path keeps winning: Express matches in declaration
 * order and this param route would otherwise swallow it.
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
