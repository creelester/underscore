# Underscore

AI-powered, mood-matched playlists for books being read. See `docs/superpowers/specs/2026-07-24-underscore-mvp-design.md` (MVP PRD) and `docs/superpowers/specs/2026-07-24-underscore-api-design.md` (API reference) for the full design.

## Stack

- Monorepo via bun workspaces: `/app` (Expo/React Native), `/server` (Express + TS), `/packages/shared` (zod schemas/types shared across both)
- Postgres + Prisma
- Better Auth for multi-provider login; Spotify integration is a separate connector (app-level client-credentials for catalog search, user-level OAuth for playback only)
- Claude (Anthropic) for mood/genre analysis and track suggestions
- Google Books API for book metadata
- Railway for hosting
- UI: NativeWind 4.2.6 (Tailwind 3.4.17) + react-native-reusables — shadcn/ui proper is web-only. Tokens live in `app/src/global.css`, `app/tailwind.config.js`, `app/src/lib/theme.ts`; gradients are data (`app/src/lib/gradients.ts`) because NativeWind has no gradient classes.
- E2E: Playwright driving the Expo **web** build in Chromium — `playwright.config.ts`, specs in `e2e/`, see `e2e/README.md`. Harness rules (stack isolation, seeding, how specs are written) live in the `e2e-test-writer` agent.

## Working conventions

- "Update the memory file" means update this file, `CLAUDE.md` — not the per-project memory directory.
- Always enter plan mode before starting to make changes and wait for confirmation
- If a plan is confirmed, swich to auto mode
- Always use the `context7-mcp` MCP server before writing code against an external library, framework, SDK, or API — this includes Expo, Better Auth, Prisma, Spotify Web API, the Anthropic SDK, and Google Books, even when the usage seems obvious. Resolve the library id, then query docs scoped to the specific task at hand. Prefer this over relying on training data or web search for library-specific syntax, config, or setup.
- Follow the phased implementation plan in `docs/superpowers/specs/` — each phase has its own verification steps; don't skip ahead to a later phase's code before the current phase's verification passes.
- Playlists in the MVP are a fixed ~30-track Claude-curated list resolved against Spotify search — no target-runtime/page-count-based sizing and no Spotify Recommendation API usage (deprecated for new Spotify apps as of Nov 2024). Do not reintroduce audio-features-based extension logic.
- Ratings/feedback are out of MVP scope entirely.
- Cut a fresh branch off `main` for each unit of work — don't stack unrelated commits on whatever branch is checked out. Pushing to `origin/main` still needs a confirmation.
- **Writing or fixing tests is the `e2e-test-writer` agent's job.** When the ask is "write tests", "add e2e coverage", "cover this flow", or "this spec is failing", dispatch that agent rather than writing specs inline — it owns the Playwright conventions and the harness invariants. Two of those invariants bind everyone, not just the agent, because ordinary server work can break them: the test stack is fully isolated from dev (its own ports and its own database — never reuse a dev port or share the dev database), and auth rate limiting stays gated to `NODE_ENV === "production"` in `server/src/lib/auth.ts`. Details in `.claude/agents/e2e-test-writer.md`.
- The mood vocabulary is closed: `MOODS` in `packages/shared/src/moodProfile.ts` is a ten-value `as const`, `mood` is `z.array(z.enum(MOODS)).max(2)`. Never widen it back to `z.string()` or normalize unknown moods in the UI. To add a mood: edit `MOODS`, add its `MOOD_STOPS` pair in `app/src/lib/gradients.ts`, update Claude's tool schema. Rationale: `docs/2026-08-10-mood-vocabulary-decision.md`.
- `docs/design_handoff_under_score_app/` is the design source of truth — `README.md` for the spec, `prototypes/Under Score App - standalone.html` authoritative over it for splash copy. The prototypes are references to recreate, not code to port. Dark is the default theme.
- Run `bun run typecheck` and `bun run lint` from the root (they fan out across workspaces) before calling work done; `bun run test:e2e` for the Playwright suite.
