# End-to-end tests

Playwright drives the Expo **web** build (`react-native-web`) in Chromium, backed
by a dedicated database that is reset on every run.

The web build under test is a **production export** (`expo export` into
`app/dist-e2e`, served by `expo serve`), not `expo start --web`. That is not a
preference — it is what makes the API URL injection hold. In a dev bundle the
client's `process.env` comes from `expo/virtual/env`, which spreads the contents
of `app/.env*` over anything the shell injected, so a developer's local
`app/.env.local` (`EXPO_PUBLIC_API_URL=http://localhost:3000`) silently wins and
the whole suite drives the **dev** API. `expo export` runs in production mode,
where `babel-preset-expo` inlines `EXPO_PUBLIC_*` from the CLI's own environment
and `.env.local` is not in the production env-file list; `EXPO_NO_DOTENV=1` is set
on top of that so no `.env` file of any name is read. The export is rebuilt on
every run, so no test ever runs against a stale bundle.

Inlining has one more way to go wrong, which is why the e2e stack also gets its
own Metro cache (below): Metro keys its transform cache on file contents and babel
config and on nothing else — `EXPO_PUBLIC_*` is in no part of that key, even
though `expo export` bakes those values into the output. A cache warmed by any
other production export therefore replays that export's API URL into this one.

## Isolation

The suite runs its own stack alongside — never instead of — your dev stack:

|              | dev            | e2e                                |
| ------------ | -------------- | ---------------------------------- |
| API port     | 3000           | 3100                               |
| Expo web     | 8081           | 8082                               |
| database     | `underscore`   | `underscore_e2e`                   |
| Metro cache  | `$TMPDIR`      | `$TMPDIR/underscore-e2e-metro-3100` |

All of these are injected via `webServer.env` in `playwright.config.ts`, which
takes precedence over `server/.env`. The config refuses to start if
`E2E_DATABASE_URL` points at anything other than `underscore_e2e` — the suite
runs `prisma migrate reset`, which drops every table it finds.

The Metro cache is redirected by handing the export its own `TMPDIR`; Metro roots
its cache at `<TMPDIR>/metro-cache`. `expo export --clear` would also defeat a
stale inline, but it deletes the cache your dev server is using, so it is not what
the harness does. The API port is part of the directory name, so changing a port
starts from a clean cache rather than a stale inline of the old one.

## One-time setup

```sh
bun install
bunx playwright install chromium
docker compose up -d
```

The `underscore_e2e` database is created automatically by
`docker/postgres/init-e2e-db.sh` — but Postgres only runs that on a **fresh**
data volume. If your container predates it:

```sh
docker compose exec -T postgres psql -U underscore -c 'CREATE DATABASE underscore_e2e'
```

## Running

```sh
bun run test:e2e          # headless, both projects
bun run test:e2e:ui       # interactive UI mode
bun run test:e2e:report   # open the last HTML report
```

Playwright boots both servers itself. The first run after a `bun install` or a
port change is the slow one — the e2e Metro cache starts empty and the web export
is bundled cold (tens of seconds, and up to ~3 min on a cold machine); later runs
reuse that cache and re-export in about 5s. Each run resets the database and
reseeds `e2e@underscore.test` / `e2e-password-1234`.

Reseeding happens once per *run*, not per test, and workers run in parallel, so a
test that mutates state must create its own account with a unique email rather
than touching the seeded one. See `uniqueEmail()` in `auth.spec.ts`.

Auth rate limiting is off here: it is gated to `NODE_ENV === "production"` in
`server/src/lib/auth.ts`, and the e2e API runs as `test`. Tests can make as many
deliberate bad-password attempts as they need.

## Writing tests

Add `*.spec.ts` files in this directory. `baseURL` is the e2e Expo server, so
navigate with relative paths:

```ts
await page.goto("/login");
```

Fixtures shared across specs — `SEEDED_USER`, `uniqueEmail()`,
`logInAsSeededUser()`, `signOutToLogin()` — live in `helpers.ts`. It is not a
`*.spec.ts`, so Playwright's default `testMatch` never collects it as a suite.

Both projects (`chromium` desktop, `mobile-chrome` Pixel 7) run every file.
Scope a test to one with `test.skip(({ browserName }) => ...)` or a `testMatch`
on the project.

Signed-out visitors land on `/splash`, not on `/login`: `splash` is registered
first in the signed-out group in `app/src/app/_layout.tsx`, which makes it that
group's fallback, so both `/` and a sign-out settle there. The forms are still
reachable directly by URL, but a sign-out / sign-in round trip has to go through
the splash's `I already have an account` CTA — that is what `signOutToLogin()`
does.

The app follows the device colour scheme, and Playwright's default is
`colorScheme: "light"` — which is not the app's own default. Keep specs
theme-agnostic (assert on roles and text, never on colours) rather than pinning a
scheme in the config.

A few things about the app's web output are worth knowing before you write a
locator:

- Screens pushed onto an expo-router `Stack` stay mounted underneath the current
  one, so after `/login → /sign-up → /login` the text "Welcome back." matches
  twice and strict mode fails. Start each test from a `page.goto`, and assert on
  something the screen you navigated *from* does not also render.
- `Pressable` renders a real `<button>` with `disabled`/`aria-disabled`, and
  `TextInput` a real `<input>`, so `getByRole`, `getByPlaceholder` and
  `toBeDisabled()` all work without any test-only markup.
- The boot overlay (`app/src/components/splash-overlay.tsx`) draws the splash
  artwork — including the logo lockup — over every first paint for about half a
  second before it fades out and unmounts. Anything it renders therefore exists
  twice for that window, and a strict-mode violation fails an assertion outright
  rather than being retried away, so wait the duplicate out with `toHaveCount(1)`
  instead of reaching for `.first()`. See `splash.spec.ts`.
- `keyboardType="email-address"` becomes `<input type="email">`, and Chromium
  runs the HTML value-sanitization algorithm on that type — leading and trailing
  whitespace is stripped before the app ever sees it. So a `fill("  a@b.c  ")`
  test asserts the user-visible outcome but cannot prove the app trims; the
  `.trim()` in `app/src/lib/auth-schemas.ts` is only observable on native and
  belongs to a unit test.

## Environment overrides

| variable            | default                                       |
| ------------------- | --------------------------------------------- |
| `E2E_DATABASE_URL`  | `…localhost:5432/underscore_e2e?schema=public` |
| `E2E_BASE_URL`      | `http://localhost:8082`                       |
| `E2E_AUTH_SECRET`   | a fixed test-only string                      |
