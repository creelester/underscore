import { Router } from "express";
import { MusicConnectorStatusResponseSchema } from "@underscore/shared";
import { asyncHandler } from "../lib/asyncHandler";
import { requireSession } from "../middleware/requireSession";
import { spotifyLinkStatus } from "../services/spotifyLink";

export const musicConnectorRouter = Router();

/** GET /api/music-connector/status — whether the reader's Spotify link can write a playlist. */
musicConnectorRouter.get(
  "/status",
  requireSession,
  asyncHandler(async (req, res) => {
    const status = await spotifyLinkStatus(req.user!.id);

    res.json(MusicConnectorStatusResponseSchema.parse(status));
  }),
);
