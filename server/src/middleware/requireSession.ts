import type { NextFunction, Request, Response } from "express";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "../lib/auth";

type Session = typeof auth.$Infer.Session;

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: Session["user"];
    }
  }
}

export async function requireSession(req: Request, res: Response, next: NextFunction) {
  // Express 4 does not forward rejected promises from async middleware, so an
  // unguarded throw here becomes a fatal unhandled rejection rather than a 500.
  try {
    const session = await auth.api.getSession({ headers: fromNodeHeaders(req.headers) });
    if (!session) {
      res.status(401).json({ code: "UNAUTHORIZED", message: "Authentication required", retryable: false });
      return;
    }
    req.user = session.user;
    next();
  } catch (err) {
    next(err);
  }
}
