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
// Every value below is injected through webServer.env. That is what makes the
// isolation hold: neither Bun's .env auto-loading nor Prisma's own dotenv pass
// overrides a variable already present in process.env, so server/.env cannot
// leak the dev DATABASE_URL into a test run.

const API_PORT = 3100;
const WEB_PORT = 8082;
const API_URL = `http://localhost:${API_PORT}`;
const WEB_URL = `http://localhost:${WEB_PORT}`;

const E2E_DATABASE_URL =
  process.env.E2E_DATABASE_URL ??
  "postgresql://underscore:underscore@localhost:5432/underscore_e2e?schema=public";

// `prisma migrate reset` drops every table it finds. Fail loudly at config load
// rather than discovering at runtime that E2E_DATABASE_URL points somewhere real.
const databaseName = new URL(E2E_DATABASE_URL).pathname.replace(/^\//, "");
if (databaseName !== "underscore_e2e") {
  throw new Error(
    `Refusing to run: E2E_DATABASE_URL targets database "${databaseName}", not "underscore_e2e". ` +
      `The e2e suite resets this database on every run.`,
  );
}

// A Metro cache of this stack's own, for the same reason it gets its own ports and
// database. `expo export` *inlines* EXPO_PUBLIC_* at transform time, but Metro's
// transform cache is keyed on file contents and babel config only — the env vars are
// in no part of that key. A cache warmed by any other production export therefore
// hands this run a bundle with that export's API URL inlined, which in practice means
// the dev API on :3000: the suite would drive the dev stack while every comment above
// promised it could not. Pointing TMPDIR at a directory of our own gives the export
// its own `<TMPDIR>/metro-cache`, so no other build can poison it and it stays warm
// between runs (a cold export is ~15s, a warm one ~5s). `--clear` would fix the
// staleness too, but it deletes the *shared* cache — including a running dev server's.
// The API port is in the directory name so that changing it starts from a clean cache
// rather than a stale inline of the old one.
const METRO_CACHE_DIR = join(tmpdir(), `underscore-e2e-metro-${API_PORT}`);
mkdirSync(METRO_CACHE_DIR, { recursive: true });

// Test-only credentials for a throwaway localhost database. These unlock
// nothing — server/src/config/env.ts deliberately refuses to default
// BETTER_AUTH_SECRET so no real secret is ever committed, and these keep that
// property while leaving the harness zero-setup.
const E2E_AUTH_SECRET =
  process.env.E2E_AUTH_SECRET ?? "e2e-only-not-a-real-secret-0123456789";
const E2E_USER_EMAIL = "e2e@underscore.test";
const E2E_USER_PASSWORD = "e2e-password-1234";

export default defineConfig({
  testDir: "./e2e",
  // Traces, screenshots and videos land beside the HTML report rather than in a
  // `test-results/` directory at the repo root.
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

  // Both Chromium-engine: the product is a phone app and its web build is the
  // test surface, so viewport matters more than engine. react-native-web output
  // is effectively identical across engines, and each extra engine is another
  // browser download — add Firefox/WebKit here if that stops being true.
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 7"] } },
  ],

  webServer: [
    {
      // The DB reset is chained here rather than living in globalSetup because
      // Playwright starts webServer *before* globalSetup — a reset there would
      // run against an already-booted API. Chaining guarantees migrate + seed
      // finish before the server listens.
      command:
        "bun run --filter server e2e:db:reset && bun run --filter server start:e2e",
      // /health runs SELECT 1, so a green probe means the e2e database is
      // genuinely reachable, not just that the process is up.
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
      // A *production* web export, not `expo start --web`. In a dev bundle the
      // client's `process.env` comes from expo/virtual/env, which spreads the
      // contents of app/.env* over anything the shell injected — so a developer's
      // app/.env.local (EXPO_PUBLIC_API_URL=:3000) silently wins and the whole
      // e2e run drives the *dev* API. `expo export` runs in production mode,
      // where babel-preset-expo inlines EXPO_PUBLIC_* straight from this
      // process.env and .env.local is not part of the production env-file list.
      // That makes the injection below the only source of the API URL.
      command: `bun run --filter app e2e:export && bun run --filter app e2e:serve -- --port ${WEB_PORT}`,
      url: WEB_URL,
      // Never reuse: the served bundle is a build artefact, so a stale server
      // would test whatever the app looked like on a previous run.
      reuseExistingServer: false,
      // Metro's first cold export is slow.
      timeout: 300_000,
      stdout: "pipe",
      stderr: "pipe",
      env: {
        // app/src/lib/auth-client.ts otherwise defaults to :3000, the dev API.
        EXPO_PUBLIC_API_URL: API_URL,
        // Belt and braces on top of the production env-file list: no .env file
        // of any name gets read, so nothing can shadow the value above.
        EXPO_NO_DOTENV: "1",
        // …and the third way that URL could be wrong: a Metro cache holding a
        // transform with someone else's value already inlined. See METRO_CACHE_DIR.
        TMPDIR: METRO_CACHE_DIR,
      },
    },
  ],
});
