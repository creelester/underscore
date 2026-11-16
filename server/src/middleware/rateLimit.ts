import rateLimit from "express-rate-limit";
import { ApiError } from "../lib/apiError";

/**
 * Keyed on the user rather than the IP: these routes cost money per account, and Railway's
 * edge puts every user behind the same address. Mount after `requireSession`, which is what
 * makes `req.user` safe to read here — and why no IP fallback key is needed.
 */
/**
 * For a route with no session to key on. Railway's edge puts every reader behind one of a
 * few addresses, so this is nearer a global ceiling than a per-reader one — which is what
 * the demo route wants, since it bounds how many sessions a stranger can mint.
 */
export function publicLimit(limitPerHour: number) {
  return rateLimit({
    windowMs: 60 * 60 * 1000,
    limit: limitPerHour,
    standardHeaders: true,
    legacyHeaders: false,
    // We deliberately leave `trust proxy` unset, which this check would otherwise warn
    // about on every request behind Railway's edge.
    validate: { xForwardedForHeader: false },
    handler: (_req, res) => {
      const error = ApiError.rateLimited();
      res.status(error.status).json(error.toBody());
    },
  });
}

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
