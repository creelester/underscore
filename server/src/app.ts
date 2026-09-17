import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { Pool } from "pg";
import { auth } from "./lib/auth";
import { env } from "./config/env";
import { isApiError } from "./lib/apiError";
import { requireSession } from "./middleware/requireSession";
import { bookshelfRouter } from "./routes/bookshelf";
import { booksRouter } from "./routes/books";
import { moodProfileRouter } from "./routes/moodProfile";
import { playlistsRouter } from "./routes/playlists";

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
  app.use("/api/bookshelf", bookshelfRouter);
  app.use("/api/mood-profile", moodProfileRouter);
  app.use("/api/playlists", playlistsRouter);

  // Where the emailed verification link lands. A deep link would be right on the phone
  // and dead in a desktop mail client, so this is a plain page instead.
  app.get("/verified", (req, res) => {
    const failed = typeof req.query.error === "string";
    res
      .status(failed ? 400 : 200)
      .type("html")
      .send(verifiedPage(failed));
  });

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

function verifiedPage(failed: boolean): string {
  const heading = failed ? "That link didn’t work" : "Email verified";
  const body = failed
    ? "It may have expired or already been used. Ask for a new one from Under Score."
    : "You’re all set — head back to Under Score.";
  return `<!doctype html><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Under Score</title>
<style>
  :root { color-scheme: light dark; }
  body { margin: 0; min-height: 100vh; display: grid; place-content: center; gap: 12px;
         padding: 24px; text-align: center; background: #FDEFE0; color: #1F0F2A;
         font: 16px/1.5 system-ui, sans-serif; }
  h1 { margin: 0; font-size: 22px; }
  p { margin: 0; opacity: 0.7; }
  @media (prefers-color-scheme: dark) { body { background: #1F0F2A; color: #FDEFE0; } }
</style>
<h1>${heading}</h1>
<p>${body}</p>`;
}
