import { z } from "zod";

const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  BETTER_AUTH_SECRET: z.string().min(1).default("dev-secret-change-me"),
  BETTER_AUTH_URL: z.string().min(1).default("http://localhost:3000"),
  APP_SCHEME: z.string().min(1).default("underscore"),
  GOOGLE_CLIENT_ID: z.string().default(""),
  GOOGLE_CLIENT_SECRET: z.string().default(""),
  SPOTIFY_CLIENT_ID: z.string().default(""),
  SPOTIFY_CLIENT_SECRET: z.string().default(""),
  ANTHROPIC_API_KEY: z.string().optional(),
  GOOGLE_BOOKS_API_KEY: z.string().optional(),
  APP_ORIGIN: z.string().default("http://localhost:8081"),
});

export const env = EnvSchema.parse(process.env);
