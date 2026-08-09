# Underscore

AI-powered, mood-matched playlists for books being read.

See `docs/superpowers/specs/2026-07-24-underscore-mvp-design.md` (MVP PRD) and
`docs/superpowers/specs/2026-07-24-underscore-api-design.md` (API reference) for the full design.

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
- `bun run lint` — lint all workspaces
- `bun run typecheck` — typecheck all workspaces
