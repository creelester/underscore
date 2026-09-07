import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { defineConfig, devices } from "@playwright/test";

// The e2e stack runs on its own ports and its own database so a running dev
// stack is never disturbed and a test run can never write to the dev data:
//
//              dev     e2e
//   API        3000    3100
//   Expo web   8081    8082
//   database   underscore    underscore_e2e
//
// Every value below is injected through webServer.env. Neither the server's own env-file
// loader nor Prisma's dotenv pass overrides a variable already in process.env, so
// server/.env cannot leak the dev DATABASE_URL into a test run.

const API_PORT = 3100;
const WEB_PORT = 8082;
const API_URL = `http://localhost:${API_PORT}`;
const WEB_URL = `http://localhost:${WEB_PORT}`;

const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  "postgresql://underscore:underscore@localhost:5432/underscore_e2e?schema=public";

// `prisma migrate reset` drops every table it finds — fail at config load rather than
// discover at runtime that E2E_DATABASE_URL points somewhere real.
const databaseName = new URL(E2E_DATABASE_URL).pathname.replace(/^\//, "");
if (databaseName !== "underscore_e2e") {
  throw new Error(
    `Refusing to run: E2E_DATABASE_URL targets database "${databaseName}", not "underscore_e2e". ` +
      `The e2e suite resets this database on every run.`,
  );
}

// `expo export` inlines EXPO_PUBLIC_* at transform time, but Metro's cache is keyed on
// file contents and babel config only — not the env vars. A cache warmed by any other
// production export would hand this run the dev API URL. Own TMPDIR means own
// `<TMPDIR>/metro-cache`: unpoisonable, and still warm between runs (~5s vs ~15s cold).
// `--clear` would also fix staleness but deletes the shared cache, dev server included.
// The API port is in the directory name so changing it starts clean.
const METRO_CACHE_DIR = join(tmpdir(), `underscore-e2e-metro-${API_PORT}`);
mkdirSync(METRO_CACHE_DIR, { recursive: true });

// Test-only credentials for a throwaway localhost database; they unlock nothing. They
// keep a real secret out of the repo while leaving the harness zero-setup.
const E2E_AUTH_SECRET =
  process.env.E2E_AUTH_SECRET ?? "e2e-only-not-a-real-secret-0123456789";
const E2E_USER_EMAIL = "e2e@underscore.test";
const E2E_USER_PASSWORD = "e2e-password-1234";

export default defineConfig({
  testDir: "./e2e",
  // Beside the HTML report rather than in a repo-root `test-results/`.
  outputDir: "./e2e/test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { outputFolder: "e2e/.report", open: "never" }], ["list"]],

  use: {
    baseURL: process.env.E2E_BASE_URL ?? WEB_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },

  // Both Chromium: the product is a phone app, so viewport matters more than engine and
  // react-native-web output is effectively identical across engines.
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  ],

  webServer: [
    {
      // Chained rather than in globalSetup: Playwright starts webServer first, so a
      // reset there would run against an already-booted API.
      command:
        "bun run --filter server e2e:db:reset && bun run --filter server start:e2e",
      // /health runs SELECT 1, so green means the database is reachable, not just the
      // process up.
      url: `${API_URL}/health`,
      // Never reuse: an API already listening was started against the dev database.
      reuseExistingServer: false,
      timeout: 120_000,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        NODE_ENV: "test",
        PORT: String(API_PORT),
        DATABASE_URL: E2E_DATABASE_URL,
        BETTER_AUTH_SECRET: E2E_AUTH_SECRET,
        BETTER_AUTH_URL: API_URL,
        // Must match the Expo origin exactly or cors() blocks every app request.
        APP_ORIGIN: WEB_URL,
        SEED_USER_EMAIL: E2E_USER_EMAIL,
        SEED_USER_PASSWORD: E2E_USER_PASSWORD,
      },
    },
    {
      // A production export, not `expo start --web`. A dev bundle's `process.env` comes
      // from expo/virtual/env, which spreads app/.env* over anything the shell injected —
      // a developer's app/.env.local would silently point the run at the dev API. In
      // production mode babel-preset-expo inlines EXPO_PUBLIC_* from this process.env and
      // skips .env.local, making the injection below the only source of the API URL.
      command: `bun run --filter app e2e:export && bun run --filter app e2e:serve -- --port ${WEB_PORT}`,
      url: WEB_URL,
      // Never reuse: a stale server would serve a previous run's bundle.
      reuseExistingServer: false,
      // Metro's first cold export is slow.
      timeout: 300_000,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        // app/src/lib/auth-client.ts otherwise defaults to :3000, the dev API.
        EXPO_PUBLIC_API_URL: API_URL,
        // Belt and braces: no .env file of any name is read, so nothing shadows the
        // value above.
        EXPO_NO_DOTENV: "1",
        // The third way that URL could be wrong: a cache holding someone else's inline.
        TMPDIR: METRO_CACHE_DIR,
      },
    },
  ],
});
