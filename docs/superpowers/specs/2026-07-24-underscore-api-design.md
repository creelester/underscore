# Underscore — API Design

Companion to [`2026-07-24-underscore-mvp-design.md`](./2026-07-24-underscore-mvp-design.md). Covers every backend endpoint for the MVP: auth requirement, request/response shape, and error conditions. All non-auth endpoints are mounted under `/api` and, unless noted, require a valid Better Auth session (cookie-based).

## Shared data shapes

These are defined as zod schemas in `/packages/shared` and referenced by name in the tables below.

### `Book`
| Field | Type | Notes |
|---|---|---|
| `id` | `string` (cuid) | Internal id |
| `googleBooksId` | `string \| null` | Null when `source = MANUAL_GENRE` |
| `title` | `string` | |
| `authors` | `string[]` | |
| `description` | `string \| null` | |
| `categories` | `string[]` | |
| `pageCount` | `number \| null` | Display-only; does not drive playlist length |
| `thumbnailUrl` | `string \| null` | |
| `source` | `"GOOGLE_BOOKS" \| "MANUAL_GENRE"` | |

### `MoodProfile`
| Field | Type | Notes |
|---|---|---|
| `genre` | `string` | e.g. `"sci-fi"` |
| `mood` | `string` | e.g. `"tense, melancholic"` |
| `energy` | `"low" \| "medium" \| "high"` | |
| `summary` | `string` | 1-2 sentence rationale, shown as QA/debug info |

### `Track`
| Field | Type | Notes |
|---|---|---|
| `spotifyTrackId` | `string` | Spotify catalog id |
| `name` | `string` | |
| `artist` | `string` | |
| `albumArtUrl` | `string \| null` | |
| `durationMs` | `number` | |

### `PlaylistTrack`
| Field | Type | Notes |
|---|---|---|
| `track` | `Track` | |
| `position` | `number` | 0-indexed order |
| `isAnchor` | `boolean` | True for the initial ~30 Claude-suggested tracks (always true in MVP — no extension tier) |

### `Playlist`
| Field | Type | Notes |
|---|---|---|
| `id` | `string` (cuid) | |
| `book` | `Book` | |
| `moodProfile` | `MoodProfile` | |
| `tracks` | `PlaylistTrack[]` | Ordered |
| `totalRuntimeMs` | `number` | Sum of track durations — informational only |
| `smallerThanUsual` | `boolean` | True if the &lt;8-anchor regeneration path was hit and fewer than 20 tracks resolved |
| `spotifyPlaylistId` | `string \| null` | Set after first successful export (Phase 7) |
| `createdAt` | `string` (ISO date) | |

### Common error envelope
Non-2xx JSON responses share this shape:
```json
{ "code": "STRING_ERROR_CODE", "message": "human-readable", "retryable": true }
```

---

## Auth — `/api/auth/*`

Handled entirely by Better Auth's mounted handler (`toNodeHandler(auth)`). Not hand-built; documented here for completeness since the app calls these directly via `authClient`.

| Endpoint | Auth | Request | Response | Errors |
|---|---|---|---|---|
| `POST /api/auth/sign-up/email` | none | `{ email, password, name? }` | `{ user, session }` | `400 INVALID_INPUT`, `409 EMAIL_EXISTS` |
| `POST /api/auth/sign-in/email` | none | `{ email, password }` | `{ user, session }` | `401 INVALID_CREDENTIALS` |
| `GET /api/auth/sign-in/social?provider=google\|spotify` | none | query: `provider`, `callbackURL` | redirect to provider OAuth | `400 UNKNOWN_PROVIDER` |
| `GET /api/auth/get-session` | session cookie (optional) | — | `{ user, session } \| null` | — |
| `POST /api/auth/sign-out` | session-required | — | `{ success: true }` | `401 UNAUTHORIZED` |
| `POST /api/auth/link-social` | session-required | `{ provider: "spotify", scopes: string[] }` | redirect to provider OAuth (upgrade scopes on existing linked account) | `401 UNAUTHORIZED` |

---

## Books

| Endpoint | Auth | Request | Response (200) | Errors |
|---|---|---|---|---|
| `GET /api/books/search` | session-required | query: `q: string` (title/author) | `{ results: Book[] }` (empty array = no match, not an error) | `502 UPSTREAM_UNAVAILABLE` (Google Books down/timeout) |

---

## Mood Engine

| Endpoint | Auth | Request | Response (200) | Errors |
|---|---|---|---|---|
| `POST /api/mood-profile` | session-required | `{ bookId: string }` **or** `{ manualGenre: string }` (exactly one) | `{ profile: MoodProfile }` | `400 INVALID_INPUT` (neither/both fields set), `404 BOOK_NOT_FOUND`, `502 UPSTREAM_UNAVAILABLE` (Claude down or returned unparseable output) |

Notes: `manualGenre` path never calls Claude — profile is constructed directly from the user's text (`genre = manualGenre`, `energy = "medium"`, `mood = ""`, `summary = ""`).

---

## Playlist generation

| Endpoint | Auth | Request | Response (200) | Errors |
|---|---|---|---|---|
| `POST /api/playlists/generate` | session-required | `{ bookId: string }` **or** `{ manualGenre: string }` | `Playlist` (auto-saved; `spotifyPlaylistId: null`) | `400 INVALID_INPUT`, `404 BOOK_NOT_FOUND`, `502 UPSTREAM_UNAVAILABLE` (Claude or Spotify search down) |

Side effects: runs Mood Engine (if `bookId`) → Playlist Builder (Claude, ~30 anchors) → Spotify app-level resolution (regenerates once if &lt;8 resolve) → persists `Playlist` + `PlaylistTrack` + upserted `Track` rows in a single transaction. No partial `Playlist` row is ever left on failure.

---

## Bookshelf

| Endpoint | Auth | Request | Response (200) | Errors |
|---|---|---|---|---|
| `GET /api/bookshelf` | session-required | query: `cursor?: string`, `limit?: number` (default 20) | `{ playlists: Playlist[], nextCursor: string \| null }` | — |
| `GET /api/bookshelf/:playlistId` | session-required | path: `playlistId` | `Playlist` | `404 PLAYLIST_NOT_FOUND`, `403 FORBIDDEN` (not owner) |

---

## Music Connector / playback

| Endpoint | Auth | Request | Response (200) | Errors |
|---|---|---|---|---|
| `GET /api/music-connector/status` | session-required | — | `{ linked: boolean, provider: "spotify" }` | — |
| `POST /api/playlists/:playlistId/export` | session-required | path: `playlistId` | `{ spotifyPlaylistId: string, webUrl: string, deepLinkUri: string }` (idempotent — returns the existing export if `spotifyPlaylistId` is already set) | `404 PLAYLIST_NOT_FOUND`, `403 FORBIDDEN` (not owner), `409 SPOTIFY_NOT_LINKED` (client should prompt `link-social`), `401 SPOTIFY_TOKEN_EXPIRED` (client should prompt re-link), `502 UPSTREAM_UNAVAILABLE` (Spotify API down) |

---

## Error code reference

| Code | HTTP status | Meaning |
|---|---|---|
| `INVALID_INPUT` | 400 | Request body/query failed schema validation |
| `UNAUTHORIZED` | 401 | No/invalid session |
| `SPOTIFY_TOKEN_EXPIRED` | 401 | User-level Spotify token expired/revoked; re-link required |
| `FORBIDDEN` | 403 | Authenticated but not resource owner |
| `BOOK_NOT_FOUND` | 404 | `bookId` doesn't exist |
| `PLAYLIST_NOT_FOUND` | 404 | `playlistId` doesn't exist |
| `EMAIL_EXISTS` | 409 | Sign-up with already-registered email |
| `SPOTIFY_NOT_LINKED` | 409 | Export attempted with no linked Spotify account |
| `UPSTREAM_UNAVAILABLE` | 502 | Claude, Google Books, or Spotify API failure; `retryable: true` |
