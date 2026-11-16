import { Router } from "express";
import { DemoAvailabilityResponseSchema } from "@underscore/shared";
import { env } from "../config/env";
import { ApiError } from "../lib/apiError";
import { asyncHandler } from "../lib/asyncHandler";
import { auth } from "../lib/auth";
import { publicLimit } from "../middleware/rateLimit";

/**
 * One shared account, so a visitor sees real playlists without signing up. The sign-in
 * happens here rather than in the app because the password would otherwise ship in the web
 * bundle, where everything reachable is public.
 */

export const demoRouter = Router();

const isConfigured = () => !!env.DEMO_USER_EMAIL && !!env.DEMO_USER_PASSWORD;

/** GET /api/demo-session — whether the splash should offer the button at all. */
demoRouter.get(
  "/",
  (_req, res) => {
    res.json(DemoAvailabilityResponseSchema.parse({ available: isConfigured() }));
  },
);

/** POST /api/demo-session — sign the browser in as the demo reader. */
demoRouter.post(
  "/",
  publicLimit(60),
  asyncHandler(async (_req, res) => {
    if (!isConfigured()) throw ApiError.forbidden("This deployment has no demo account");

    const { headers } = await auth.api.signInEmail({
      returnHeaders: true,
      body: { email: env.DEMO_USER_EMAIL, password: env.DEMO_USER_PASSWORD },
    });

    // Forwarding Better Auth's own Set-Cookie is the whole of signing in; the app then
    // re-reads the session rather than being handed a user it would have to trust.
    const cookies = headers.getSetCookie();
    if (cookies.length > 0) res.setHeader("Set-Cookie", cookies);

    res.status(204).end();
  }),
);
