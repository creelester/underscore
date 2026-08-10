import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { Pool } from "pg";
import { auth } from "./lib/auth";
import { env } from "./config/env";
import { requireSession } from "./middleware/requireSession";

export function createApp() {
  const app = express();
  const pool = new Pool({ connectionString: env.DATABASE_URL });

  app.use(cors({ origin: env.APP_ORIGIN, credentials: true }));

  app.all("/api/auth/*", toNodeHandler(auth));

  // express.json() must come after the Better Auth handler above,
  // or Better Auth's client requests get stuck pending.
  app.use(express.json());

  app.get("/api/me", requireSession, (req, res) => {
    res.json({ user: req.user });
  });

  app.get("/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });

  // Terminal error handler. Without this, Express 4's default handler serialises
  // stack traces into the response whenever NODE_ENV !== "production".
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ code: "INTERNAL", message: "Something went wrong", retryable: true });
  });

  return app;
}
