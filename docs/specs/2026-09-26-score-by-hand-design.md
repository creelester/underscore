# Score by hand — design

Companion to [`2026-07-24-underscore-mvp-design.md`](./2026-07-24-underscore-mvp-design.md) and
[`2026-07-24-underscore-api-design.md`](./2026-07-24-underscore-api-design.md), which this
changes in two places (`Book`, and the manual path's request shape).

## Where this sits

Three screens in the app are still placeholders: `score-by-hand.tsx`, the Now tab and the
Settings tab. "MVP done" means none of them is a placeholder any more. This spec covers the
first; Now and Settings get their own, in that order. Deployment, the missing unit and
integration tests, and the parked Expo 57.0.23 upgrade are outside the wrap-up.

By-hand comes first because it is the only one of the three that is also *scope*: the MVP PRD
promises a manual-genre fallback for a book the catalogue cannot find, and the server, the
schemas and the rate limiter for it already exist. Only the screen is missing — and the mood
screen's error path is waiting on it too.

## Problem

`POST /api/playlists/generate` accepts `manualGenre: Genre` — one value from the closed
vocabulary, which becomes the stand-in book's title. That was enough when the fallback was
"generate me something ambient for sci-fi". The design's by-hand screen asks for more: a
cover, a title, an author, a year, up to three genres, the mood, the pacing, and the same
fine-tune answers the mood screen collects. None of that has anywhere to go.

## Scope

In:

- The by-hand screen, as the design draws it, minus the cover photo (below).
- `manualBook` replacing `manualGenre` on the generate endpoint.
- An emoji cover, persisted, rendered wherever a manual book's artwork appears.
- Extracting the mood and fine-tune blocks out of `mood.tsx` so both screens share them.

Out:

- **The cover photo** (`Take a photo` / `Choose from photos`). It needs an image picker, an
  upload endpoint and somewhere to keep the bytes — infra the MVP has never had. Deferred to
  v2. Not to be confused with the OCR cover-scan lookup the PRD rules out; this was only ever
  artwork.
- Playlist rename, delete and regenerate. Still absent from the actions sheet, still not MVP.

## The cover, without a photo

The frame stays where the design puts it. Inside it: the mood gradient, a book icon by
default, and the reader's own emoji once they set one. Tapping the frame focuses a
single-character text field.

There is no programmatic emoji-only keyboard on iOS, so "pick an emoji" is the reader
switching to their own emoji keyboard over a one-character field. That is the standard
approach and it works; it is not a grid we control, and the schema has to assume any string
can arrive — hence the validation below.

The book icon is scoped to this frame. A Google book with no thumbnail keeps its bare
gradient in `BookCover`, because putting the icon there outright would change library rows
that are already right.

## Genre

The picker shows the ten the prototype draws, plus `Something else`:

> Literary, Fantasy, Sci-fi, Mystery, Thriller, Romance, Horror, Memoir, History, Poetry

`GENRES` in `packages/shared/src/moodProfile.ts` has 39 values and is unchanged — it exists so
Claude names the genre against a closed list on the Google path, and the label has to read the
same across both paths. So the picker is a curated subset, `BY_HAND_GENRES`, typed
`readonly Genre[]` so a rename in `GENRES` breaks the build rather than the screen. All ten map
onto it: `Literary` → `Literary fiction`, `Sci-fi` → `Science fiction`, the rest verbatim.

Selection: at least one always held, at most three, the oldest dropping at a fourth.

`Something else` is additive and never one of the three — the same rule the mood chips already
follow, for the same reason: `MoodProfile.genre` is a closed enum and free text cannot live
there. It rides in `ReadingContext.genreOther`, reaches the anchor prompt, and is never
persisted or returned. Requiring one real chip is what keeps `MoodProfile.genre` non-empty, so
every screen that reads `genre[0]` still resolves.

## Shared schemas

```ts
ManualBookSchema = {
  title?:      string   // trimmed, ≤120 — the book row falls back to "Untitled book"
  author?:     string   // trimmed, ≤120
  year?:       number   // int, 1000 … current year + 1
  genre:       Genre[]  // 1–3, from GENRES
  coverEmoji?: string   // ≤16 chars, must contain \p{Extended_Pictographic}
}
```

Optional, not nullable, throughout — an answer nobody gave is `undefined`. The `coverEmoji`
cap is 16 rather than 1 because a single emoji is several code units once ZWJ sequences and
skin-tone modifiers are involved; the `Extended_Pictographic` requirement is what stops the
field being a second title.

Changes elsewhere:

- `GeneratePlaylistRequestSchema`: `manualGenre` → `manualBook`, and `bookOrGenreRefinement`
  becomes exactly-one-of `googleBooksId | manualBook`.
- `ReadingContextSchema` gains `genreOther?: string`, ≤60, beside `moodOther`.
- `BookSchema` gains `publishedYear: number | null` and `coverEmoji: string | null` — nullable,
  because Prisma reads them back as `null` and making them optional would drop the keys out of
  responses the app already parses. `BookCandidateSchema` stops *adding* `publishedYear` and
  inherits it.
- `MoodProfileRequestSchema` narrows to `{ googleBooksId }`. The by-hand path never runs the
  Mood Engine — the reader states the mood themselves — so nothing calls it with a genre, and
  the app never did.

## Data

Two nullable columns on `Book`: `publishedYear`, `coverEmoji`.

`publishedYear` is populated on the Google path as well, in the same `upsertBook` line. No
screen changes as a result: saved-playlist rows read `Book · Author` via `playlistMetaLine`,
and `bookMetaLine`'s `Author · Year · Genre` runs off the unpersisted search candidate. It is
one line in the same migration and it stops the column meaning two different things.

**Manual books stop being shared.** Today the manual branch is
`findFirst({ source: MANUAL_GENRE, title })`, which was harmless when the title was a genre
word. With reader-typed titles, authors and emoji it would hand one reader's emoji to another
reader's "Dune". The manual branch always creates its own row. Two by-hand scores of the same
book make two rows; that is the right trade against cross-account bleed.

`BookSource.MANUAL_GENRE` keeps its name. It reads slightly off now, and renaming an enum
value costs a migration for no behavioural gain.

## Server

`upsertBook`'s manual branch takes the whole `manualBook`: title (or `"Untitled book"`),
`authors: author ? [author] : []`, `publishedYear`, `coverEmoji`, always `create`.

`resolveProfile` keeps its fallback for a request arriving with no `moodProfile` — a deep link,
or a reload — building one from `manualBook.genre` with `mood: []` and `pacing: "steady"`. The
screen itself always sends a profile, because the reader picked it.

`anchorPrompt(profile, book?, context?)` currently gets **no** `book` on the manual path: there
was nothing but a genre word to give it. It now gets `{ title, authors, publishedYear }`, so Claude sees
the actual book — which it may well know even when Google Books came back empty. That is the
quality win hiding in this change.

The year is the reason it is in the prompt at all: persisted and never rendered, it would be a
field the design collects for nothing. It reads as `Book: <title> by <author> (<year>)`, and it
is not the same as `ReadingContext.era` — one is when the book was written, the other where the
reader says it is set. `genreOther` joins `moodOther` in `readingContextLines`.

Generation stays one call and keeps its 10/hour limit.

## App

`score-by-hand.tsx` becomes the real screen, in the design's order: cover, TITLE / AUTHOR /
YEAR, `GENRE · PICK UP TO THREE`, `MOOD · PICK UP TO TWO`, `PACING`, divider, the lyrics switch
and the format/setting/era groups, `Generate playlist →`. It reuses `ScoringScreen`, `MoodWash`,
`Chip`, `OptionGroup`, `OtherInput`, `Switch` and `ControlledInput`. New: the cover frame and
the genre picker.

Title pre-fills from the library search query, as the prototype does — the reader typed the
book's name to get here.

`playlist.tsx` learns a serialized `manualBook` route param, skips `useBook`, and builds either
request shape. `BookCover` renders `coverEmoji` over the gradient. The mood screen's
`TODO(next iteration)` becomes a real link: a volume Google has lost goes to `/score-by-hand`
with its title filled in.

**One refactor.** `mood.tsx` is 282 lines and the by-hand screen needs ~150 of them — the mood
chips with their `Something else`, and the lyrics/format/setting/era block. Both come out into
components the two screens share. Skipping this means two copies that drift on the first change
to either.

## Error handling

- Generation failures land on the existing `playlist.tsx` error state; a by-hand request adds
  no new failure mode, since it skips both Google Books and the Mood Engine.
- A `manualBook` with no genre is `400 INVALID_INPUT`, refused by the schema. The picker cannot
  produce one — it always holds at least one chip.
- An emoji field carrying non-pictographic text is `400 INVALID_INPUT`. The screen trims and
  validates before enabling the CTA, so this is the deep-link case.

## PR stack

Each PR is at most 10 files, typechecks and lints on its own, and is stacked in GitHub on the
one above it (`gh pr create --base <previous-branch>`), retargeted onto `main` as its parent
lands.

| # | PR | Files | Ships |
| - | -- | ----- | ----- |
| 1 | `Book.publishedYear` + `Book.coverEmoji`: migration, `BookSchema`, mapper, populated on the Google path | 7 | Nothing on screen; columns exist and are read back |
| 2 | `manualBook` replaces `manualGenre`: `ManualBookSchema`, `BY_HAND_GENRES`, `genreOther`, the generator's manual branch, the prompt, `MoodProfileRequest` narrowed | 9 | The endpoint accepts the new shape, verifiable by hand |
| 3 | Extract the mood picker and fine-tune fields out of `mood.tsx` | 3 | Pure refactor; the mood screen behaves identically |
| 4 | The by-hand screen, wired end to end and reachable from `+ Add manually` | 6 | Where it lights up |
| 5 | Emoji covers on library rows and the playlist hero, mood-screen error path | 5 | Polish |
| 6 | e2e spec, via the `e2e-test-writer` agent | 3 | Regression cover |

PRs 1 and 2 ship no UI, which is not the same as shipping inert UI: nothing on screen waits on
a later PR. PR 3 is independent of 1 and 2 and can go in parallel.

## Verification

- `bun run typecheck` and `bun run lint` from the root on every PR.
- PR 2 by hand against the API: sign in, pass the signed session cookie, `POST` a `manualBook`
  with and without `moodProfile`, and one with a bad emoji for the `400`.
- PR 4 on the simulator, both themes — the web export is a proxy, not the check.
- PR 6: `bun run test:e2e`.

## Design divergences to record at the site

- No cover photo; emoji over the gradient instead, with a book icon as the default. Cristina's
  call, 2026-09-26.
- The genre picker is `BY_HAND_GENRES`, ten of the vocabulary's 39, because that is what the
  prototype draws.
