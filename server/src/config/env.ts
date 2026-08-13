import { z } from "zod";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  // No defaults on these three: a missing value must crash at boot rather than
  // silently fall back to something published in this repo.
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  APP_SCHEME: z.string().min(1).default("underscore"),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  SPOTIFY_CLIENT_ID: z.string().default(""),
  SPOTIFY_CLIENT_SECRET: z.string().default(""),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_BOOKS_API_KEY: z.string().optional(),
  // Overridable so the e2e stack can point at a local fixture server: the suite
  // must never reach a live third-party API. Unset means the real endpoint.
  GOOGLE_BOOKS_BASE_URL: z.string().url().default("https://www.googleapis.com/books/v1"),
  APP_ORIGIN: z.string().url(),
  SEED_USER_EMAIL: z.string().email().optional(),
  SEED_USER_PASSWORD: z.string().optional(),
});

export const env = EnvSchema.parse(process.env);
