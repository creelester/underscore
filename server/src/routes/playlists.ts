import { Router } from "express";
import {
  ExportPlaylistResponseSchema,
  GeneratePlaylistRequestSchema,
  PlaylistSchema,
} from "@underscore/shared";
import { ApiError } from "../lib/apiError";
import { asyncHandler } from "../lib/asyncHandler";
import { perUserLimit } from "../middleware/rateLimit";
import { requireSession } from "../middleware/requireSession";
import { exportPlaylist, syncPlaylist } from "../services/playlistExporter";
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

/**
 * POST /api/playlists/:playlistId/export — create the playlist in the reader's Spotify.
 * PUT is the same route for one already there. Neither is metered: `perUserLimit` guards
 * what costs us money, and these spend the reader's own token.
 */
playlistsRouter.post(
  "/:playlistId/export",
  requireSession,
  asyncHandler(async (req, res) => {
    const exported = await exportPlaylist(req.user!.id, req.params.playlistId);

    res.json(ExportPlaylistResponseSchema.parse(exported));
  }),
);

/** PUT /api/playlists/:playlistId/export — make Spotify's copy match ours again. */
playlistsRouter.put(
  "/:playlistId/export",
  requireSession,
  asyncHandler(async (req, res) => {
    const synced = await syncPlaylist(req.user!.id, req.params.playlistId);

    res.json(ExportPlaylistResponseSchema.parse(synced));
  }),
);
