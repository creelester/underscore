import rateLimit from "express-rate-limit";
import { ApiError } from "../lib/apiError";

/**
 * Keyed on the user rather than the IP: these routes cost money per account, and Railway's
 * edge puts every user behind the same address. Mount after `requireSession`, which is what
 * makes `req.user` safe to read here — and why no IP fallback key is needed.
 */
export function perUserLimit(limitPerHour: number) {
  return rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: limitPerHour,
    keyGenerator: (req) => req.user!.id,
    standardHeaders: true,
    legacyHeaders: false,
    // The default handler sends plain text; the app parses every error as our envelope.
    handler: (_req, res) => {
      const error = ApiError.rateLimited();
      res.status(error.status).json(error.toBody());
    },
  });
}
