import { existsSync } from "node:fs";

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

export const env = {
  NODE_ENV,
  PORT: Number(process.env.PORT ?? 3000),
  DATABASE_URL: process.env.DATABASE_URL!,
  BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET!,
  BETTER_AUTH_URL: process.env.BETTER_AUTH_URL!,
  APP_SCHEME: process.env.APP_SCHEME ?? "underscore",
  APP_ORIGIN: process.env.APP_ORIGIN!,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID ?? "",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET ?? "",
  SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID ?? "",
  SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET ?? "",
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  GOOGLE_BOOKS_API_KEY: process.env.GOOGLE_BOOKS_API_KEY,
  // Overridable so the e2e stack can point at a fixture server and never reach a live
  // third-party API. Unset means the real endpoint.
  GOOGLE_BOOKS_BASE_URL:
    process.env.GOOGLE_BOOKS_BASE_URL ?? "https://www.googleapis.com/books/v1",
  ANTHROPIC_BASE_URL: process.env.ANTHROPIC_BASE_URL,
  SPOTIFY_ACCOUNTS_BASE_URL:
    process.env.SPOTIFY_ACCOUNTS_BASE_URL ?? "https://accounts.spotify.com",
  SPOTIFY_API_BASE_URL:
    process.env.SPOTIFY_API_BASE_URL ?? "https://api.spotify.com/v1",
  SEED_USER_EMAIL: process.env.SEED_USER_EMAIL,
  SEED_USER_PASSWORD: process.env.SEED_USER_PASSWORD,
};
