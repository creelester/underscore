import { randomUUID } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { SPOTIFY_PLAYLIST_SCOPES } from "@underscore/shared";

import { FIXTURE_BOOKS, type FixtureBook } from "./catalog";
import { readerSpotify } from "./spotify-user";
import { FIXTURE_ANCHORS, parseSearchQuery, toSpotifyTrack } from "./tracks";

/**
 * The third-party edge of the e2e stack: Google Books, Claude and Spotify, served from
 * fixtures.
 *
 * The API server points at it through `GOOGLE_BOOKS_BASE_URL` and `ANTHROPIC_BASE_URL`,
 * both already overridable in server/src/config/env.ts, so everything under test is
 * still the real server, the real routes and the real zod parsing — only the two
 * upstreams are replaced, and only at their own network boundary. That is why the
 * suite does not stub `/api/*` in the browser: a `page.route` on our own API would
 * mock the contract the test exists to exercise.
 *
 * A run therefore never leaves localhost, never spends Anthropic credit, and returns
 * the same mood profile every time — which is what makes the mood screen assertable.
 *
 * Spotify's client-credentials token and catalogue search are here too, which is what
 * lets generation run to completion: the bookshelf specs need saved playlists, and a
 * playlist only exists once its anchors resolve. The user-level side — creating a
 * playlist in the reader's account, filling it and renaming it — is fixtured below on
 * the state in `spotify-user.ts`, which holds enough to tell a created playlist from a
 * filled one from a renamed one, plus a control surface under `/e2e/` for the specs to
 * read it back. The reader's consent handshake is fixtured too, now that it is ours and
 * follows `SPOTIFY_ACCOUNTS_BASE_URL`: `/authorize` grants and redirects straight back.
 */

const PORT = Number(process.env.E2E_UPSTREAM_PORT ?? 3101);

/** A real grant keeps the identity scopes alongside the ones we asked for. */
const GRANTED_SCOPES = ["user-read-email", ...SPOTIFY_PLAYLIST_SCOPES].join(" ");

function sendJson(res: ServerResponse, status: number, body: unknown) {
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  });
  res.end(payload);
}

/** Only the fields `server/src/connectors/googleBooks.ts` reads. */
function toVolume(book: FixtureBook) {
  return {
    id: book.googleBooksId,
    volumeInfo: {
      title: book.title,
      authors: book.authors,
      description: book.description,
      categories: book.categories,
      publishedDate: book.publishedDate,
      pageCount: book.pageCount,
      publisher: book.publisher,
      language: book.language,
      // No imageLinks: a cover URL would be one more thing for the browser to fetch,
      // and BookCover falls back to its mood swatch.
    },
  };
}

/** Substring over title and author, which is as much as any spec asks of search. */
function searchVolumes(query: string) {
  const term = query.trim().toLowerCase();
  return FIXTURE_BOOKS.filter((book) =>
    `${book.title} ${book.authors.join(" ")}`.toLowerCase().includes(term),
  );
}

/** The envelope the Anthropic SDK expects; `readJson` in anthropic.ts reads the text block. */
function toMessage(payload: unknown) {
  return {
    id: "msg_e2e_fixture",
    type: "message",
    role: "assistant",
    model: "claude-opus-5",
    content: [{ type: "text", text: JSON.stringify(payload) }],
    stop_reason: "end_turn",
    stop_sequence: null,
    usage: { input_tokens: 0, output_tokens: 0 },
  };
}

type MessagesRequest = {
  messages?: { content?: string }[];
  output_config?: { format?: { schema?: { properties?: Record<string, unknown> } } };
};

/**
 * Which of the two prompts this is, read off the JSON schema the server asked for
 * rather than off the wording — the prompts are tuned often, the schemas are not.
 */
function isAnchorRequest(body: MessagesRequest) {
  return !!body.output_config?.format?.schema?.properties?.tracks;
}

/**
 * The same thirty anchors every time, under whichever title the book carries. A book
 * with no `playlistName` answers without one, which is the path `defaultPlaylistName`
 * exists for — and the reason `name` is optional on the response schema.
 */
function anchorTracks(book?: FixtureBook) {
  return { name: book?.playlistName, tracks: FIXTURE_ANCHORS };
}

function handleMessages(res: ServerResponse, raw: string) {
  const body = JSON.parse(raw) as MessagesRequest;
  // Both prompts name the book; `anchorPrompt` as `Book: …`, `moodPrompt` as `Title: …`.
  const prompt = body.messages?.[0]?.content ?? "";
  const book = FIXTURE_BOOKS.find((candidate) => prompt.includes(candidate.title));

  if (isAnchorRequest(body)) {
    // No book on the manual-genre path, which is a nameless generation too.
    sendJson(res, 200, toMessage(anchorTracks(book)));
    return;
  }

  if (!book) {
    // Loud rather than a stand-in profile: a spec that reaches an unfixtured book
    // should fail, not quietly assert against an invented read.
    sendJson(res, 502, { error: { message: `No fixture read for prompt: ${prompt.slice(0, 120)}` } });
    return;
  }

  sendJson(res, 200, toMessage(book.analysis));
}

/** The bearer token, or the status Spotify would answer without a usable one. */
function authorize(req: IncomingMessage): { token: string } | { status: number } {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!token) return { status: 401 };

  const revoked = readerSpotify.revokedStatus(token);
  return revoked ? { status: revoked } : { token };
}

function spotifyError(res: ServerResponse, status: number, message: string) {
  sendJson(res, status, { error: { status, message } });
}

type ItemsRequest = { uris?: string[] };

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => resolve(raw));
    req.on("error", reject);
  });
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://localhost:${PORT}`);

  if (req.method === "GET" && url.pathname === "/health") {
    sendJson(res, 200, { status: "ok" });
    return;
  }

  // Google Books, rooted where GOOGLE_BOOKS_BASE_URL points.
  if (req.method === "GET" && url.pathname === "/volumes") {
    const results = searchVolumes(url.searchParams.get("q") ?? "");
    sendJson(res, 200, { totalItems: results.length, items: results.map(toVolume) });
    return;
  }

  if (req.method === "GET" && url.pathname.startsWith("/volumes/")) {
    const id = decodeURIComponent(url.pathname.slice("/volumes/".length));
    const book = FIXTURE_BOOKS.find((candidate) => candidate.googleBooksId === id);
    // 404 is how the connector learns Google has never heard of a volume.
    if (!book) {
      sendJson(res, 404, { error: { code: 404, message: "not found" } });
      return;
    }
    sendJson(res, 200, toVolume(book));
    return;
  }

  // Spotify accounts, rooted where SPOTIFY_ACCOUNTS_BASE_URL points. The consent screen,
  // with consent always given: the reader goes straight back to whatever redirect_uri the
  // request carried, which is our own callback.
  if (req.method === "GET" && url.pathname === "/authorize") {
    const back = new URL(url.searchParams.get("redirect_uri") ?? "");
    back.searchParams.set("code", `fixture-code-${randomUUID()}`);
    back.searchParams.set("state", url.searchParams.get("state") ?? "");

    res.writeHead(302, { Location: back.toString() });
    res.end();
    return;
  }

  // Two grants arrive here. The app's client-credentials token, which the connector
  // caches for `expires_in` less a minute so one covers a whole run — and the reader's
  // own, which is the only one that comes with a refresh token and granted scopes.
  if (req.method === "POST" && url.pathname === "/api/token") {
    const form = new URLSearchParams(await readBody(req));
    if (form.get("grant_type") === "client_credentials") {
      sendJson(res, 200, { access_token: "e2e-fixture-app-token", expires_in: 3600 });
      return;
    }

    const grant = form.get("code") ?? form.get("refresh_token") ?? "";
    sendJson(res, 200, {
      access_token: `fixture-reader-token-${grant}`,
      refresh_token: `fixture-refresh-${grant}`,
      expires_in: 3600,
      scope: GRANTED_SCOPES,
    });
    return;
  }

  // Who the reader is, which is what the callback asks for before it stores the grant.
  if (req.method === "GET" && url.pathname === "/me") {
    const auth = authorize(req);
    if ("status" in auth) {
      spotifyError(res, auth.status, "No usable token");
      return;
    }

    sendJson(res, 200, { id: `fixture-spotify-user-${auth.token}` });
    return;
  }

  // Spotify catalogue search, rooted where SPOTIFY_API_BASE_URL points. Anything that
  // parses as an anchor resolves; a query in any other shape is a miss, which is how
  // the generator learns a suggested track does not exist.
  if (req.method === "GET" && url.pathname === "/search") {
    const anchor = parseSearchQuery(url.searchParams.get("q") ?? "");
    sendJson(res, 200, { tracks: { items: anchor ? [toSpotifyTrack(anchor)] : [] } });
    return;
  }

  // User-level Spotify, same root as search above but on the reader's own token. The
  // paths are the post-February-2026 `/items` ones, not `/tracks`.
  if (req.method === "POST" && url.pathname === "/me/playlists") {
    const raw = await readBody(req);
    const auth = authorize(req);
    if ("status" in auth) {
      spotifyError(res, auth.status, "No usable token");
      return;
    }

    const created = readerSpotify.create(auth.token, JSON.parse(raw || "{}"));
    sendJson(res, 201, { id: created.id, external_urls: { spotify: created.webUrl } });
    return;
  }

  const items = url.pathname.match(/^\/playlists\/([^/]+)\/items$/);
  if (items && (req.method === "POST" || req.method === "PUT")) {
    const raw = await readBody(req);
    const auth = authorize(req);
    if ("status" in auth) {
      spotifyError(res, auth.status, "No usable token");
      return;
    }

    const playlist = readerSpotify.find(decodeURIComponent(items[1]));
    // What the reader deleting it on their side looks like from here.
    if (!playlist) {
      spotifyError(res, 404, "Playlist not found");
      return;
    }

    const uris = (JSON.parse(raw || "{}") as ItemsRequest).uris ?? [];
    if (req.method === "POST") {
      playlist.uris.push(...uris);
      playlist.appends += 1;
    } else {
      playlist.uris = uris;
      playlist.replaces += 1;
    }

    sendJson(res, req.method === "POST" ? 201 : 200, { snapshot_id: `snap-${playlist.uris.length}` });
    return;
  }

  // The playlist itself — name and description. `/playlists/{id}` was untouched by the
  // February 2026 rename, so this path has no `/items` on it, and Spotify answers 200
  // with an empty body.
  const details = url.pathname.match(/^\/playlists\/([^/]+)$/);
  if (details && req.method === "PUT") {
    const raw = await readBody(req);
    const auth = authorize(req);
    if ("status" in auth) {
      spotifyError(res, auth.status, "No usable token");
      return;
    }

    const playlist = readerSpotify.find(decodeURIComponent(details[1]));
    if (!playlist) {
      spotifyError(res, 404, "Playlist not found");
      return;
    }

    // Only what the request carried: a field left off is a field Spotify keeps.
    const body = JSON.parse(raw || "{}") as { name?: string; description?: string };
    if (body.name !== undefined) playlist.name = body.name;
    if (body.description !== undefined) playlist.description = body.description;
    playlist.details += 1;

    sendJson(res, 200, {});
    return;
  }

  // The harness's own view of the above, under /e2e/ so it can never shadow a Spotify
  // path. Not part of any contract the server knows about.
  if (req.method === "GET" && url.pathname === "/e2e/spotify/playlists") {
    sendJson(res, 200, { playlists: readerSpotify.forToken(url.searchParams.get("token") ?? "") });
    return;
  }

  const oneE2ePlaylist = url.pathname.match(/^\/e2e\/spotify\/playlists\/([^/]+)$/);
  if (oneE2ePlaylist && req.method === "DELETE") {
    sendJson(res, 200, { deleted: readerSpotify.forget(decodeURIComponent(oneE2ePlaylist[1])) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/e2e/spotify/revoke") {
    const { token, status } = JSON.parse((await readBody(req)) || "{}") as {
      token?: string;
      status?: number;
    };
    if (token) readerSpotify.revoke(token, status ?? 401);
    sendJson(res, 200, { token, status: status ?? 401 });
    return;
  }

  // Anthropic. The SDK posts to `<baseURL>/v1/messages?beta=true`.
  if (req.method === "POST" && url.pathname === "/v1/messages") {
    try {
      handleMessages(res, await readBody(req));
    } catch (error) {
      sendJson(res, 500, { error: { message: String(error) } });
    }
    return;
  }

  sendJson(res, 404, { error: { message: `No fixture for ${req.method} ${url.pathname}` } });
});

server.listen(PORT, () => {
  console.log(`e2e upstream fixtures listening on http://localhost:${PORT}`);
});
