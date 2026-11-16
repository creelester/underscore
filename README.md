# Underscore

AI-powered, mood-matched playlists for books being read.

See `docs/specs/2026-07-24-underscore-mvp-design.md` (MVP PRD) and
`docs/specs/2026-07-24-underscore-api-design.md` (API reference) for the full design.

## Stack

- Monorepo via bun workspaces: `/app` (Expo/React Native), `/server` (Express + TS), `/packages/shared` (zod schemas/types shared across both)
- Postgres + Prisma
- Better Auth for multi-provider login; Spotify integration is a separate connector (app-level client-credentials for catalog search, user-level OAuth for playback only)
- Claude (Anthropic) for mood/genre analysis and track suggestions
- Google Books API for book metadata
- Railway for hosting

## Getting started

### Prerequisites

- [Bun](https://bun.sh)
- Postgres 16 — either a local install or the bundled Docker service

#### Postgres

Homebrew (macOS):

```bash
brew install postgresql@16
brew services start postgresql@16

# one-time: create the role and database the app expects
createuser -s underscore
psql -d postgres -c "ALTER ROLE underscore WITH PASSWORD 'underscore';"
createdb -O underscore underscore
```

Docker (only if you'd rather not install Postgres locally — requires Docker Desktop):

```bash
docker compose up -d   # older Docker installs use: docker-compose up -d
```

Either way the app connects on `localhost:5432` with the `DATABASE_URL` in
`server/.env.example`. Check it's up with:

```bash
psql "postgresql://underscore:underscore@localhost:5432/underscore" -c '\conninfo'
```

### Setup

```bash
bun install

# server
cp server/.env.example server/.env   # fill in secrets
bun run --filter server prisma migrate dev

# app
cp app/.env.example app/.env.local
```

### Running

```bash
bun run dev          # API + Expo, opening the iOS Simulator
bun run dev:server   # Express API on :3000
bun run dev:ios      # Expo dev server, opening the iOS Simulator
bun run dev:app      # Expo dev server only
```

With `dev:app`, press `i` for iOS Simulator, `a` for Android emulator, or scan the
QR code with Expo Go.

## Scripts

- `bun run dev` — start the API and the app in the iOS Simulator concurrently
- `bun run dev:server` — start the API server
- `bun run dev:ios` — start the Expo dev server and open the iOS Simulator
- `bun run dev:app` — start the Expo dev server
- `bun run lint` — lint `app/` (the only workspace with an eslint config)
- `bun run typecheck` — typecheck all workspaces
- `bun run test:e2e` — the Playwright suite, against the Expo web build in Chromium

## Deployment

One Railway service serves both the API and the web app. `railway.json` holds the build,
the migration step and the start command.

### Why one service, not two

On web the session is a browser cookie sent with `withCredentials`, and Better Auth marks
it `SameSite=Lax`. Two Railway services are cross-site — `up.railway.app` is on the Public
Suffix List — so the cookie would never be sent and sign-in would fail with no visible
error. `SameSite=None` is not a fix: Safari blocks third-party cookies by default, so that
trades a broken deploy for a browser-specific one. Serving both from one origin removes the
problem instead of configuring around it, and gives every OAuth redirect URI one host.

Express serves the Expo export in `server/src/app.ts`, mounted only when `app/dist` exists
so development and the e2e stack are unaffected.

### Environment

Set on the Railway service:

| Variable | Notes |
| --- | --- |
| `DATABASE_URL` | from the Postgres plugin |
| `BETTER_AUTH_SECRET` | `openssl rand -base64 32` |
| `BETTER_AUTH_URL`, `APP_ORIGIN` | both the service's own `https://` domain |
| `ANTHROPIC_API_KEY` | |
| `SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET` | |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | |
| `RESEND_API_KEY`, `EMAIL_FROM` | `env.ts` refuses to boot without the pair |
| `DEMO_USER_EMAIL`, `DEMO_USER_PASSWORD` | the shared demo account; empty disables the button |
| `EXPO_PUBLIC_API_URL` | the same public origin — **inlined at export time**, so it must be set during the build, not just at runtime |
| `EXPO_NO_DOTENV=1` | stops any `app/.env*` shadowing the above during the build |

`env.ts` refuses to boot if `BETTER_AUTH_URL` is not https, so a misconfiguration fails
loudly rather than shipping insecure cookies.

### Redirect URIs

These must match exactly what the code derives from `BETTER_AUTH_URL`:

- Spotify: `https://<domain>/api/music-connector/callback` and `https://<domain>/api/auth/callback/spotify`
- Google: `https://<domain>/api/auth/callback/google`

### Spotify's quota ceiling

A Spotify app in Development Mode allows **5 allowlisted users**, and Extended Quota Mode
requires a registered business with 250,000 MAU. So playlist *export* can never work for a
general visitor — only for accounts added by hand under Users Management. Catalog search is
unaffected: it uses app-level client credentials, not a user's token. The UI says this
plainly rather than letting Spotify's own consent screen turn people away unexplained.

### Deploying

1. `railway login`, create the project, add the Postgres plugin, set the variables above.
2. Register the redirect URIs, and allowlist your own Spotify account under Users Management.
3. **Set a hard monthly spend cap in the Anthropic console.** Signup is unverified, so this
   is the real backstop against runaway generation cost — it is not enforced in code.
4. Deploy, and confirm the `preDeployCommand` applied the migrations in the deploy log.
5. Create the demo account through the deployed app — the seed deliberately refuses to run
   with `NODE_ENV=production` — then generate a few playlists as it so the shelf isn't empty.
6. Smoke test on Safari specifically; it is the browser most likely to expose a cookie
   mistake, and the whole same-origin decision exists for it.

### Known follow-ups

- Spotify tokens are stored unencrypted at rest.
- No `helmet`; the API sets no security headers of its own.
- An unknown `/api` path 404s as HTML rather than the JSON error envelope, because there is
  no `NOT_FOUND` in the `ErrorCode` enum.
- Nothing pins which header the rate limiter trusts behind the platform edge. Verify with
  `curl -H 'x-real-ip: 1.2.3.4'` against the deployed service: if a client-supplied header
  passes through, the sign-in limit is bypassable by rotating it; if the edge sets one
  address for everyone, a few bad logins lock out every reader.
- The e2e suite drives `expo serve`, not the Express serving path above, so production
  static resolution has no automated coverage.
