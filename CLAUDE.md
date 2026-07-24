# Underscore

AI-powered, mood-matched playlists for books being read. See `docs/superpowers/specs/2026-07-24-underscore-mvp-design.md` (MVP PRD) and `docs/superpowers/specs/2026-07-24-underscore-api-design.md` (API reference) for the full design.

## Stack

- Monorepo via bun workspaces: `/app` (Expo/React Native), `/server` (Express + TS), `/packages/shared` (zod schemas/types shared across both)
- Postgres + Prisma
- Better Auth for multi-provider login; Spotify integration is a separate connector (app-level client-credentials for catalog search, user-level OAuth for playback only)
- Claude (Anthropic) for mood/genre analysis and track suggestions
- Google Books API for book metadata
- Railway for hosting

## Working conventions

- Always use the `context7-mcp` MCP server before writing code against an external library, framework, SDK, or API — this includes Expo, Better Auth, Prisma, Spotify Web API, the Anthropic SDK, and Google Books, even when the usage seems obvious. Resolve the library id, then query docs scoped to the specific task at hand. Prefer this over relying on training data or web search for library-specific syntax, config, or setup.
- Follow the phased implementation plan in `docs/superpowers/specs/` — each phase has its own verification steps; don't skip ahead to a later phase's code before the current phase's verification passes.
- Playlists in the MVP are a fixed ~30-track Claude-curated list resolved against Spotify search — no target-runtime/page-count-based sizing and no Spotify Recommendation API usage (deprecated for new Spotify apps as of Nov 2024). Do not reintroduce audio-features-based extension logic.
- Ratings/feedback are out of MVP scope entirely.
