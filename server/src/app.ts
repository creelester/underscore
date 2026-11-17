import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
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
import { demoRouter } from "./routes/demo";
import { moodProfileRouter } from "./routes/moodProfile";
import { musicConnectorRouter } from "./routes/musicConnector";
import { playlistsRouter } from "./routes/playlists";

/**
 * Expo's static export writes a dynamic route as a literal `[playlistId].html`, which no
 * static handler matches against a real id, so it is resolved from the parent directory.
 * The `webRoot` check is what keeps a `..` in the path inside the export.
 */
function dynamicRouteFile(webRoot: string, urlPath: string): string | undefined {
  const segments = urlPath.split("/").filter(Boolean);
  if (segments.length === 0) return undefined;

  const dir = join(webRoot, ...segments.slice(0, -1));
  if (!dir.startsWith(webRoot) || !existsSync(dir)) return undefined;

  const template = readdirSync(dir).find((entry) => /^\[.+]\.html$/.test(entry));
  return template && join(dir, template);
}

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
  app.use("/api/demo-session", demoRouter);
  app.use("/api/mood-profile", moodProfileRouter);
  app.use("/api/music-connector", musicConnectorRouter);
  app.use("/api/playlists", playlistsRouter);

  app.get("/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });

  // The Expo web export, from this same origin because the session cookie has to reach
  // us: on web the browser holds it, Better Auth marks it SameSite=Lax, and Safari blocks
  // third-party cookies outright — so a separate web host cannot sign anyone in. Resolved
  // from this module, not the cwd, and absent in development, where Expo serves the app.
  const webRoot = join(__dirname, "..", "..", "app", "dist");
  if (existsSync(webRoot)) {
    // `extensions` is what resolves /login to login.html, as Expo's own Express example does.
    app.use(express.static(webRoot, { extensions: ["html"] }));
    app.get("*", (req, res, next) => {
      // `/api` is excluded, or an unknown endpoint would answer a page instead of a 404.
      if (req.path.startsWith("/api/")) return next();

      const route = dynamicRouteFile(webRoot, req.path);
      if (route) {
        res.sendFile(route);
        return;
      }
      res.status(404).sendFile(join(webRoot, "+not-found.html"));
    });
  }

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
