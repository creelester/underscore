# Session recap — seed.ts & Prisma editor errors

_Date: 2026-08-07 · Scope: `server/`_

Two editor-only errors were reported and resolved. Both turned out to be **false alarms from tooling, not broken build/runtime** — the app compiled and ran fine throughout.

---

## 1. `seed.ts` — "is the `process` package missing?"

**Symptom:** TypeScript error on `process.exit(...)` in `server/prisma/seed.ts` (classic _"Cannot find name 'process'. Do you need to install type definitions for node?"_).

**Diagnosis:**
- `process` is a Node global, not a package. Its types come from `@types/node`, which was **already installed** (`server/devDependencies`, `^22.7.4`).
- Root cause: `seed.ts` lives in `prisma/`, which is **outside** the file set covered by `server/tsconfig.json` (`rootDir: "src"`, `include: ["src"]`). The editor fell back to an inferred project that didn't load `@types/node`.
- At runtime it was always fine — `bun run prisma:seed` uses `tsx prisma/seed.ts`, which ignores tsconfig `include` and provides Node globals.

**Fix:** Added `server/prisma/tsconfig.json` scoping Node types to the prisma scripts, without touching the `src`→`dist` build:
```jsonc
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "noEmit": true,
    "types": ["node"]
  },
  "include": ["."]
}
```

**Verified:** `tsc --noEmit -p prisma/tsconfig.json` exits 0, no `process`/`seed.ts` errors. (May require "TypeScript: Restart TS Server" in VS Code to clear the squiggle.)

---

## 2. `schema.prisma` — "datasource property `url` is no longer supported"

**Symptom:** Prisma error pointing to `prisma.config.ts` / `accelerateUrl` / `prisma7-client-config`.

**Diagnosis:**
- That message is a **Prisma 7** rule. The local Prisma CLI is **5.22.0**, where `url = env("DATABASE_URL")` in the datasource is fully valid — `npx prisma validate` passes and `generate` works.
- npm ranges were `^5.20.0` (caps below v6), so the real toolchain was never going to v7.
- Root cause: the **VS Code Prisma extension** auto-updated to a v7 engine and validated the v5 schema by v7 rules.

**Decision:** Considered two options —
- **A. Stay on Prisma 5** (no code/schema change; matches the MVP stack in `CLAUDE.md`). ← **chosen**
- B. Migrate to Prisma 7 (`prisma.config.ts` + `@prisma/adapter-pg` driver adapter + package bumps; higher risk mid-MVP, needed a Better Auth compatibility check). Initially selected, then reverted to A.

**Fix (Option A):**
- Pinned deps in `server/package.json` to the installed version (defensive — locks intent, prevents drift toward v7):
  - `@prisma/client`: `^5.20.0` → `5.22.0`
  - `prisma`: `^5.20.0` → `5.22.0`
- Ran `bun install` to sync the lockfile.
- **Editor (manual, the actual fix for the squiggle):** pin the VS Code Prisma extension (`Prisma.prisma`) to a **5.x** version via Extensions → ▾ → "Install Specific Version…", then disable its auto-update (per-extension, or `"extensions.autoUpdate": false`) so it can't drift back to v7.

**Verified:** resolved `prisma`/`@prisma/client` both `5.22.0`; `npx prisma validate` → schema is valid.

**Note:** `schema.prisma` was intentionally **not** changed — `url` stays. No Prisma 7 migration was performed.

---

## Files touched
- **Added:** `server/prisma/tsconfig.json`
- **Edited:** `server/package.json` (two version pins), `bun.lock` (via `bun install`)

## Open / optional follow-ups
- Pin the VS Code Prisma extension to 5.x (manual step above) — required to clear error #2 in the editor.
- Optional: add `.vscode/settings.json` with `"extensions.autoUpdate": false` so the extension pin survives for anyone who clones the repo.
