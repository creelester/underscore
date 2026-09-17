import { existsSync } from "node:fs";
import { z } from "zod";

// Loaded here because no runner does it for us: `bun run` does not inject .env into a
// script's environment, and until 93adca1 this only worked because @prisma/client was
// imported first and loads .env as a side effect — not a contract to rely on again.
const NODE_ENV = process.env.NODE_ENV ?? "development";

// Highest priority first: loadEnvFile never overwrites a variable that is already set, so
// the first file to define one wins and the real environment beats every file. That last
// part is what keeps playwright's webServer.env from being overridden by server/.env.
for (const file of [".env.local", `.env.${NODE_ENV}`, ".env"]) {
  if (existsSync(file)) process.loadEnvFile(file);
}

const EnvSchema = z
  .object({
    NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
    PORT: z.coerce.number().int().positive().default(3000),
    DATABASE_URL: z.string().url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_URL: z.string().url(),
    APP_SCHEME: z.string().min(1).default("underscore"),
    APP_ORIGIN: z.string().url(),
    // Empty is a real answer: server/.env.test unsets social sign-in deliberately, and the
    // Google Books volumes endpoint is public.
    GOOGLE_CLIENT_ID: z.string().default(""),
    GOOGLE_CLIENT_SECRET: z.string().default(""),
    SPOTIFY_CLIENT_ID: z.string().default(""),
    SPOTIFY_CLIENT_SECRET: z.string().default(""),
    ANTHROPIC_API_KEY: z.string().optional(),
    GOOGLE_BOOKS_API_KEY: z.string().optional(),
    // Overridable so the e2e stack can point at a fixture server and never reach a live
    // third-party API. Unset means the real endpoint.
    GOOGLE_BOOKS_BASE_URL: z.string().url().default("https://www.googleapis.com/books/v1"),
    ANTHROPIC_BASE_URL: z.string().url().optional(),
    SPOTIFY_ACCOUNTS_BASE_URL: z.string().url().default("https://accounts.spotify.com"),
    SPOTIFY_API_BASE_URL: z.string().url().default("https://api.spotify.com/v1"),
    SEED_USER_EMAIL: z.string().optional(),
    SEED_USER_PASSWORD: z.string().optional(),
  })
  // Better Auth reads the cookie's Secure flag off this URL's scheme, so an http:// value
  // in production ships session cookies without it — the one misconfiguration here that
  // fails open rather than closed.
  .refine((e) => e.NODE_ENV !== "production" || e.BETTER_AUTH_URL.startsWith("https://"), {
    path: ["BETTER_AUTH_URL"],
    message: "must be https:// in production, or session cookies lose the Secure flag",
  });

const parsed = EnvSchema.safeParse({ ...process.env, NODE_ENV });

if (!parsed.success) {
  // Crashing the boot is the point: the alternative is a server that runs misconfigured.
  console.error("Invalid environment:");
  for (const issue of parsed.error.issues) {
    console.error(`  ${issue.path.join(".") || "(root)"}: ${issue.message}`);
  }
  process.exit(1);
}

export const env = parsed.data;
