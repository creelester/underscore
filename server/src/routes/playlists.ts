import { Router } from "express";
import { GeneratePlaylistRequestSchema, PlaylistSchema } from "@underscore/shared";
import { ApiError } from "../lib/apiError";
import { asyncHandler } from "../lib/asyncHandler";
import { perUserLimit } from "../middleware/rateLimit";
import { requireSession } from "../middleware/requireSession";
import { generatePlaylist } from "../services/playlistGenerator";

export const playlistsRouter = Router();

/**
 * POST /api/playlists/generate — the whole pipeline, and the only write path for a `Book`
 * row. Auto-saved; no Spotify link needed, since resolution runs on app-level credentials.
 */
playlistsRouter.post(
  "/generate",
  requireSession,
  // Two Claude calls plus up to 40 Spotify searches each; the costliest route we serve.
  perUserLimit(10),
  asyncHandler(async (req, res) => {
    const body = GeneratePlaylistRequestSchema.safeParse(req.body);
    if (!body.success) {
      throw ApiError.invalidInput(body.error.issues[0]?.message ?? "Invalid request");
    }

    const playlist = await generatePlaylist(req.user!.id, body.data);

    res.json(PlaylistSchema.parse(playlist));
  }),
);
