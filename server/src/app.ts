import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { Pool } from "pg";
import { auth } from "./lib/auth";
import { env } from "./config/env";
import { isApiError } from "./lib/apiError";
import { requireSession } from "./middleware/requireSession";
import { booksRouter } from "./routes/books";

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

  app.use("/api/books", booksRouter);

  app.get("/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });

  // Express 4's default handler serialises stack traces into the response whenever
  // NODE_ENV !== "production". An ApiError is a message we wrote; anything else could
  // carry a connection string or an upstream key, so it goes out as an opaque 500.
  app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    if (isApiError(err)) {
      // The upstream detail on `cause` makes a 502 diagnosable in the log only.
      if (err.code === "UPSTREAM_UNAVAILABLE") {
        console.error(`[upstream] ${err.message}`, err.cause ?? "");
      }
      res.status(err.status).json(err.toBody());
      return;
    }
    console.error(err);
    res.status(500).json({ code: "INTERNAL", message: "Something went wrong", retryable: true });
  });

  return app;
}
