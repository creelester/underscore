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
- Postgres 16 (via `docker-compose up -d`, or a local install)

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
bun run dev:server   # Express API on :3000
bun run dev:app      # Expo dev server
bun run dev          # Runs both client and server concurrently
```

Open the app in iOS Simulator, Android emulator, or Expo Go.

## Scripts

- `bun run dev:server` — start the API server
- `bun run dev:app` — start the Expo dev server
- `bun run lint` — lint all workspaces
- `bun run typecheck` — typecheck all workspaces
