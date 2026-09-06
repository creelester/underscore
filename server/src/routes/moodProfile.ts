import { Router } from "express";
import { MoodProfileRequestSchema, MoodProfileResponseSchema } from "@underscore/shared";
import { ApiError } from "../lib/apiError";
import { asyncHandler } from "../lib/asyncHandler";
import { requireSession } from "../middleware/requireSession";
import { buildMoodProfile } from "../services/moodEngine";

export const moodProfileRouter = Router();

/**
 * POST /api/mood-profile — Claude's read of one book, or the user's own genre on the
 * by-hand path. Nothing is persisted here; a profile lives on the playlist built from it.
 */
moodProfileRouter.post(
  "/",
  requireSession,
  asyncHandler(async (req, res) => {
    const body = MoodProfileRequestSchema.safeParse(req.body);
    if (!body.success) {
      throw ApiError.invalidInput(body.error.issues[0]?.message ?? "Invalid request");
    }

    const { profile } = await buildMoodProfile(body.data);

    res.json(MoodProfileResponseSchema.parse({ profile }));
  }),
);
