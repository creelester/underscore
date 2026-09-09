import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { FIXTURE_BOOKS, type FixtureBook } from "./catalog";

/**
 * The third-party edge of the e2e stack: Google Books and Claude, served from fixtures.
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
 * Spotify is deliberately not served here. No spec generates a playlist to completion,
 * and `SPOTIFY_CLIENT_ID` is unset, so generation fails fast and locally with
 * "Spotify is not configured" rather than reaching the real API.
 */

const PORT = Number(process.env.E2E_UPSTREAM_PORT ?? 3101);

/** `ANCHOR_COUNT` in server/src/connectors/prompts.ts — what the prompt asks for. */
const ANCHOR_COUNT = 30;

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

function anchorTracks() {
  return {
    tracks: Array.from({ length: ANCHOR_COUNT }, (_, index) => ({
      artist: `Fixture Ensemble ${index + 1}`,
      title: `Fixture Movement ${index + 1}`,
    })),
  };
}

function handleMessages(res: ServerResponse, raw: string) {
  const body = JSON.parse(raw) as MessagesRequest;

  if (isAnchorRequest(body)) {
    sendJson(res, 200, toMessage(anchorTracks()));
    return;
  }

  // `moodPrompt` leads with `Title: …`, so the book is identifiable without parsing it.
  const prompt = body.messages?.[0]?.content ?? "";
  const book = FIXTURE_BOOKS.find((candidate) => prompt.includes(candidate.title));

  if (!book) {
    // Loud rather than a stand-in profile: a spec that reaches an unfixtured book
    // should fail, not quietly assert against an invented read.
    sendJson(res, 502, { error: { message: `No fixture read for prompt: ${prompt.slice(0, 120)}` } });
    return;
  }

  sendJson(res, 200, toMessage(book.analysis));
}

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
