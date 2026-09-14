import { Router } from "express";
import { BookshelfQuerySchema, BookshelfResponseSchema, PlaylistSchema } from "@underscore/shared";
import { ApiError } from "../lib/apiError";
import { asyncHandler } from "../lib/asyncHandler";
import { requireSession } from "../middleware/requireSession";
import { getPlaylist, listBookshelf } from "../services/bookshelf";

export const bookshelfRouter = Router();

/** GET /api/bookshelf — the user's saved playlists, newest first. */
bookshelfRouter.get(
  "/",
  requireSession,
  asyncHandler(async (req, res) => {
    const query = BookshelfQuerySchema.safeParse(req.query);
    if (!query.success) {
      throw ApiError.invalidInput(query.error.issues[0]?.message ?? "Invalid bookshelf query");
    }

    res.json(BookshelfResponseSchema.parse(await listBookshelf(req.user!.id, query.data)));
  }),
);

/** GET /api/bookshelf/:playlistId — one saved playlist, 403 rather than 404 for a stranger's. */
bookshelfRouter.get(
  "/:playlistId",
  requireSession,
  asyncHandler(async (req, res) => {
    res.json(PlaylistSchema.parse(await getPlaylist(req.user!.id, req.params.playlistId)));
  }),
);
