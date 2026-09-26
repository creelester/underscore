import { Router } from "express";
import { MusicConnectorStatusResponseSchema } from "@underscore/shared";
import { env } from "../config/env";
import { ApiError } from "../lib/apiError";
import { asyncHandler } from "../lib/asyncHandler";
import { requireSession } from "../middleware/requireSession";
import {
  beginSpotifyAuth,
  completeSpotifyAuth,
  consumeAuthState,
  disconnectSpotify,
  spotifyLinkStatus,
} from "../services/spotifyConnection";

/**
 * Connecting the reader's Spotify. Ours rather than Better Auth's: linking a provider
 * there means listing it in `trustedProviders`, which is not scoped to linking and would
 * let an unverified Spotify address be linked into an existing account at sign-in.
 */

export const musicConnectorRouter = Router();

/**
 * Where the reader may be sent back to. Without this the callback is an open redirect —
 * anyone could hand us a `returnUrl` and have Spotify's round trip deliver a reader to it.
 * The same set Better Auth trusts, and `exp://` is development-only for the same reason.
 */
function isTrustedReturnUrl(returnUrl: string): boolean {
  const allowed = [
    `${env.APP_SCHEME}://`,
    env.APP_ORIGIN,
    ...(env.NODE_ENV === "development" ? ["exp://"] : []),
  ];

  return allowed.some((prefix) => returnUrl.startsWith(prefix));
}

/** GET /api/music-connector/status — whether the connection can write a playlist. */
musicConnectorRouter.get(
  "/status",
  requireSession,
  asyncHandler(async (req, res) => {
    const status = await spotifyLinkStatus(req.user!.id);

    res.json(MusicConnectorStatusResponseSchema.parse(status));
  }),
);

/**
 * GET /api/music-connector/authorize — the consent URL to open, and the state that will
 * carry this reader through it. Session-required, which is what makes the callback able
 * to trust the user it reads back out of the state row.
 */
musicConnectorRouter.get(
  "/authorize",
  requireSession,
  asyncHandler(async (req, res) => {
    const returnUrl = typeof req.query.returnUrl === "string" ? req.query.returnUrl : "";
    if (!isTrustedReturnUrl(returnUrl)) {
      throw ApiError.invalidInput("Unrecognized return URL");
    }

    res.json({ url: await beginSpotifyAuth(req.user!.id, returnUrl) });
  }),
);

/**
 * GET /api/music-connector/callback — where Spotify lands. Deliberately session-free: on
 * native this arrives in a browser that has none, since the session lives in SecureStore
 * rather than a cookie. The state row is the identity.
 */
musicConnectorRouter.get(
  "/callback",
  asyncHandler(async (req, res) => {
    const { code, state, error } = req.query;
    if (typeof state !== "string") throw ApiError.invalidInput("Missing authorization state");

    const pending = await consumeAuthState(state);
    // Re-checked rather than trusted from the row: what was allowed when the flow started
    // is not necessarily what is allowed now.
    const returnUrl = isTrustedReturnUrl(pending.returnUrl) ? pending.returnUrl : env.APP_ORIGIN;

    // The reader refused, or Spotify failed. Either way they go back to the app, which
    // re-reads status and finds it still unlinked.
    if (typeof code !== "string" || error) {
      res.redirect(`${returnUrl}${returnUrl.includes("?") ? "&" : "?"}spotify=denied`);
      return;
    }

    await completeSpotifyAuth(pending.userId, code);
    res.redirect(`${returnUrl}${returnUrl.includes("?") ? "&" : "?"}spotify=connected`);
  }),
);

/** DELETE /api/music-connector — disconnect. Nothing already in Spotify is touched. */
musicConnectorRouter.delete(
  "/",
  requireSession,
  asyncHandler(async (req, res) => {
    await disconnectSpotify(req.user!.id);

    res.status(204).end();
  }),
);
