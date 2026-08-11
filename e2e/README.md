# End-to-end tests

Playwright drives the Expo **web** build (`react-native-web`) in Chromium, backed
by a dedicated database that is reset on every run.

## Isolation

The suite runs its own stack alongside — never instead of — your dev stack:

|            | dev          | e2e              |
| ---------- | ------------ | ---------------- |
| API port   | 3000         | 3100             |
| Expo web   | 8081         | 8082             |
| database   | `underscore` | `underscore_e2e` |

All of these are injected via `webServer.env` in `playwright.config.ts`, which
takes precedence over `server/.env`. The config refuses to start if
`E2E_DATABASE_URL` points at anything other than `underscore_e2e` — the suite
runs `prisma migrate reset`, which drops every table it finds.

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

Playwright boots both servers itself. The first run is slow — Metro has to cold-
bundle for web (up to ~3 min). Each run resets the database and reseeds
`e2e@underscore.test` / `e2e-password-1234`.

Auth rate limiting is off here: it is gated to `NODE_ENV === "production"` in
`server/src/lib/auth.ts`, and the e2e API runs as `test`. Tests can make as many
deliberate bad-password attempts as they need.

## Writing tests

Add `*.spec.ts` files in this directory. `baseURL` is the e2e Expo server, so
navigate with relative paths:

```ts
await page.goto("/login");
```

Both projects (`chromium` desktop, `mobile-chrome` Pixel 7) run every file.
Scope a test to one with `test.skip(({ browserName }) => ...)` or a `testMatch`
on the project.

## Environment overrides

| variable            | default                                       |
| ------------------- | --------------------------------------------- |
| `E2E_DATABASE_URL`  | `…localhost:5432/underscore_e2e?schema=public` |
| `E2E_BASE_URL`      | `http://localhost:8082`                       |
| `E2E_AUTH_SECRET`   | a fixed test-only string                      |
