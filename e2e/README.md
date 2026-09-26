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
| upstreams    | live APIs      | fixture server on 3101             |
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

## Third-party upstreams

Google Books, Claude and Spotify are served from `fixtures/upstream-server.ts`, a
third `webServer` on port 3101. `playwright.config.ts` points the API at it with
`GOOGLE_BOOKS_BASE_URL`, `ANTHROPIC_BASE_URL`, `SPOTIFY_ACCOUNTS_BASE_URL` and
`SPOTIFY_API_BASE_URL` — all already overridable in `server/src/config/env.ts` —
plus placeholder credentials, since those connectors refuse to run without them.

Only the third parties are replaced, and only at their own network boundary: the
server, its routes and its zod schemas are all still under test. That is why no
spec stubs `/api/*` with `page.route` — mocking our own API would mock the
contract the test exists to exercise. A run therefore never leaves localhost,
never spends Anthropic credit, and gets the same mood profile every time, which
is what makes the mood screen assertable at all.

The books and their reads live in `fixtures/catalog.ts`, and the anchors Claude
suggests plus the tracks Spotify resolves them to in `fixtures/tracks.ts`. Both are
imported by the fixture server and by the specs, so the two cannot drift. Titles are
invented on purpose: a real one would let a run that had escaped to the live API
still look like it passed. Add a book there, not in a spec.

A book carries two genre labels on purpose. `categories` is Google's input, and
`displayGenre` is what `genresFromCategories()` leaves of it — the label a search
row and book detail show. `analysis.genre` is Claude's own read, typed as the
shared `Genre`, and it is what the mood screen renders. The fixtures keep the two
deliberately different words so a spec cannot assert one and pass on the other.

Claude's playlist title comes from the same place: a book's optional `playlistName`
is what the fixture answers an anchor request with. A book that has none answers
without one, which is the path `defaultPlaylistName` exists for, so both naming
paths are reachable by choosing a book. `expectedPlaylistName()` in `helpers.ts`
resolves either from the fixture and `@underscore/shared`, so no spec writes a
playlist name down.

### User-level Spotify

Export needs the reader's *own* Spotify, not the app's client credentials, so the
fixture server serves that side too: `POST /me/playlists`,
`POST`/`PUT /playlists/:id/items` (the post-February-2026 `/items` paths, not
`/tracks`) and `PUT /playlists/:id` for the name and description. Its state lives
in `fixtures/spotify-user.ts`, keyed by the bearer token each request arrives on,
and records enough to tell a **created** playlist from a **filled** one from a
**renamed** one — the uris in it, its name and description, how many times the
items were appended (`appends`) or replaced (`replaces`), how many times the
playlist itself was edited (`details`), and which token created it. Those three
counters are what let a spec prove that a partial `PUT …/export` changed only
what it named: a rename that quietly re-pushed the tracks shows up as a
`replaces` the spec did not ask for. A spec seeds a token of its own, so parallel
workers never see each other's playlists.

The same module backs a small control surface, namespaced under `/e2e/` so it can
never shadow a Spotify path:

| request                                   | what it is for                                 |
| ----------------------------------------- | ---------------------------------------------- |
| `GET /e2e/spotify/playlists?token=…`      | what that reader's token created, in order     |
| `DELETE /e2e/spotify/playlists/:id`       | the reader deleting it in Spotify; next sync 404s |
| `POST /e2e/spotify/revoke {token,status}` | make Spotify answer that token 401 or 403      |

`music-connector.spec.ts` reads it through a `spotify` fixture rather than calling
those paths inline.

The reader's consent handshake is fixtured as well, because it is ours rather than
Better Auth's: `beginSpotifyAuth` builds the authorize URL from
`SPOTIFY_ACCOUNTS_BASE_URL`, so `GET /authorize` on the fixture server stands in for
the consent screen and redirects straight back to whatever `redirect_uri` it was
given. `POST /api/token` answers an `authorization_code` grant with an access token,
a refresh token and the granted scopes, and `GET /me` with the Spotify user id the
callback stores. See [Connecting Spotify in a test](#connecting-spotify-in-a-test).

`server/.env.test` carries the same base URLs, so running the e2e stack by hand
needs the fixture server running too:

```sh
bun run e2e/fixtures/upstream-server.ts
```

## One-time setup

```sh
bun install
bun run --filter server prisma:generate
bunx playwright install chromium
docker compose up -d
```

`prisma generate` is explicit because nothing runs it for you: there is no
postinstall hook, and the suite's own reset passes `--skip-generate`. After a
fresh `bun install` — a new clone or a new worktree — the seed step of
`e2e:db:reset` is the first thing to fail without it.

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
than touching the seeded one. See `uniqueEmail()` in `helpers.ts`.

Auth rate limiting is off here: it is gated to `NODE_ENV === "production"` in
`server/src/lib/auth.ts`, and the e2e API runs as `test`. Tests can make as many
deliberate bad-password attempts as they need.

The **billed-route** limiters are a different thing and they *are* on: `perUserLimit`
(`server/src/middleware/rateLimit.ts`) allows one account 10 generations, 20 mood
profiles and 60 catalogue searches an hour. Its store is in memory and its window is
an hour, so a budget is spent for the rest of the run once a test spends it — the API
process restarting between runs is the only thing that clears it. Another reason a
test that generates uses an account of its own: eleven generations on a shared
fixture account would lock out every later test that touches it.

## Writing tests

Add `*.spec.ts` files in this directory. `baseURL` is the e2e Expo server, so
navigate with relative paths:

```ts
await page.goto("/login");
```

Fixtures shared across specs — `SEEDED_USER`, `uniqueEmail()`, `logIn()`,
`logInAsSeededUser()`, `expectSignedInApp()`, `searchLibrary()`, `signOut()`,
`signOutToLogin()`, `signUpOverApi()`, `createShelf()`, `expectedPlaylistName()`,
`playlistHeader()`, `expectTrackRow()` — live in `helpers.ts`, and the worker fixture that holds a shared shelf in
`shelf.ts`.
Neither is a `*.spec.ts`, so Playwright's default `testMatch` never collects them
as suites.

### Accounts with saved playlists

`createShelf(label, books)` mints an account and scores each book on it over HTTP,
through `POST /api/playlists/generate` — the whole pipeline, answered by the same
upstream fixtures a browser's request would reach. It is setup, not coverage: the
library home only gets interesting at four or five saved playlists, and each one
driven through the UI is three navigations. The books are scored in order, so the
shelf's order is known; `GET /api/bookshelf` serves the reverse.

`shelf.ts` wraps one five-playlist account in a **worker-scoped** fixture, because
every test that reads it only reads. A test that writes — scoring a book, or
needing an empty library — calls `createShelf` for an account of its own. Generation
persists a row, so any test that reaches it must not use the seeded account: a
playlist on that shelf would answer another spec's search from the library instead
of from the catalogue.

### Connecting Spotify in a test

The connector reads the `spotifyConnection` table, one row per reader, and
`GET /api/music-connector/status` calls that reader linked only when its `scope`
carries `playlist-modify-private` — a grant from before we asked for it carries
identity scopes only, and calling that linked would hand the app an export that dies
at the Spotify call.

`music-connector.spec.ts` drives the real handshake once, hop by hop with
`maxRedirects: 0` (our authorize route → the fixture's consent screen → our
callback), which is what proves the row the rest of the suite fakes is the row the
product writes. Every other test seeds the state it needs directly, over `pg`
against `E2E_DATABASE_URL`:

```ts
await connectSpotify(userId, { scope: "user-read-email playlist-modify-private", accessToken });
```

Two details in that row are load-bearing, and the function's comment says so:
`scope` is **space-delimited**, as Spotify sends it — `hasPlaylistScopes` splits on
`/[,\s]+/`, so a comma-joined scope also passes, but it is not what the callback
stores; and the expiry is an hour out, so `spotifyAccessToken` hands the token back
verbatim rather than spending the refresh token and replacing it with one the test
does not know.

The token is also the key the fixture server files that reader's playlists under, so
give every test its own.

### Locators and copy

A locator that matches product copy breaks when a writer changes a word, so the
order of preference is: a value the spec already owns (a fixture book's title, a
closed vocabulary from `@underscore/shared`) → a role or an accessible name → a
`testID` → the copy itself.

`tsconfig.json` at the root maps `@underscore/shared`, which Playwright honours,
so a spec can import `MOODS`, `OTHER`, `BOOK_FORMATS`, `SETTINGS` and `ERAS`
instead of retyping the chip labels. Type-annotating a single option
(`const CITY: Setting = "City"`) is the cheap version: renaming the option in
shared then fails `typecheck` rather than a run.

Copy is the last resort, not the first. Where it is unavoidable — the waiting
screen's title, the free-text placeholders — keep every such string in one
`COPY`-style block at the top of the file, naming the `testID` that would retire
it, so a wording change is a one-line fix. Prose that only decorates a screen
(a section heading, an eyebrow) is not worth asserting at all: assert the thing
it labels instead. Match a CTA on its verb (`/^Analyze/`) so a decorative arrow
can move.

Adding a `testID` to a component is a legitimate fix, not test pollution:
react-native-web renders RN `testID` as `data-testid`, Playwright's default
test-id attribute. The playlist hero
(`app/src/components/playlist-hero.tsx`) carries the one there is,
`saved-playlist-header`, because a playlist's name is on screen twice while the
library stays mounted underneath it; `playlistHeader()` in `helpers.ts` is how a
spec reaches it.

Both projects (`chromium` desktop, `mobile-chrome` Pixel 7) run every file, and
`browserName` is `chromium` in both — so what tells them apart is `isMobile`:
`test.skip(({ isMobile }) => isMobile, "…")`. Scope deliberately and say why;
`rate-limit.spec.ts` and `music-connector.spec.ts` are the files that do, because
they drive the API over HTTP and never open a page, so a second device emulation of
them is duplication rather than coverage.

Signed-out visitors land on `/splash`, not on `/login`: `splash` is registered
first in the signed-out group in `app/src/app/_layout.tsx`, which makes it that
group's fallback, so both `/` and a sign-out settle there. The forms are still
reachable directly by URL, but a sign-out / sign-in round trip has to go through
the splash's `I already have an account` CTA — that is what `signOutToLogin()`
does. Sign-out itself is on the Profile tab, so getting to it is a tab switch
first; `signOut()` wraps that.

Signed-in visitors do **not** land on `/`. `app/src/app/(app)/index.tsx`
redirects the app root into the tab group, so a successful sign-in settles on a
tab URL (`/library` today). Assert that with `expectSignedInApp()` rather than a
literal URL or a screen's copy: it anchors on the tab bar, which every signed-in
route renders and no signed-out one does, so it survives both the landing tab
moving and the half-built tabs' headings churning. The exact landing tab is
pinned in exactly one test — "sends the app root to the tab a session opens on"
in `auth.spec.ts` — which is the one to update if it changes.

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
- `accessibilityState` does **not** reach the web DOM: react-native-web 0.21 maps
  the individual `aria-*` props but drops the state object, so a `Chip`'s
  `{ selected }` and the `Switch`'s `{ checked }` are invisible to `getByRole`'s
  state options and to `toBeChecked()`. A chip's selection is assertable only as
  the ` ✓` its label grows (`toHaveText("Cozy ✓")`); its accessible name stays the
  bare label either way, so the locator survives the toggle. The switch has no
  visible text at all, so its state is only observable through what the next
  request carries. Both are real accessibility gaps on web, not just test
  friction.
- A dynamic route has no page of its own in the export. `web.output` is `static`
  and neither `/book/[googleBooksId]` nor `/playlist/[playlistId]` declares
  `generateStaticParams`, so `expo serve` answers `/playlist/<id>` with 404 — a deep
  link is only reachable on a host that rewrites to the app shell. Reach those
  screens by pressing the row or the CTA that pushes them, as a reader would. The
  cost is that the screen underneath stays mounted, so a playlist's name is on
  screen twice; scope the heading rather than matching it bare.
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
