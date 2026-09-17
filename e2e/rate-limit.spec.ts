import { expect, test, type APIRequestContext } from "@playwright/test";
import { ApiErrorSchema } from "@underscore/shared";

import { fixtureBook } from "./fixtures/catalog";
import { GENERATE_TIMEOUT_MS, signUpOverApi } from "./helpers";

/**
 * Per-user rate limiting on the billed routes (`server/src/middleware/rateLimit.ts`).
 *
 * Driven over HTTP rather than through the browser: the limiter answers in front of the
 * route handler, so nothing the app renders is part of the contract under test. No page
 * is opened, which is why the file is scoped to one project — a second device
 * emulation of a request that never reaches a DOM is duplication, not coverage.
 *
 * The store is in-memory and the window is an hour, so a budget spent here stays spent
 * for the rest of the run. Every account below is minted by this spec and read by
 * nothing else, so no shared fixture account is ever charged.
 */

test.skip(({ isMobile }) => isMobile, "API-level; a second device project adds no coverage");

/** `perUserLimit(10)` on POST /api/playlists/generate, in server/src/routes/playlists.ts. */
const GENERATE_LIMIT = 10;

const BOOK = fixtureBook("e2e-lantern");

const generate = (api: APIRequestContext) =>
  api.post("/api/playlists/generate", {
    data: { googleBooksId: BOOK.googleBooksId },
    timeout: GENERATE_TIMEOUT_MS,
  });

test.describe("the billed routes", () => {
  // Eleven generations. Under a second against the fixture upstreams; the budget is for
  // a cold machine running this beside the browser projects, not for the measured cost.
  test.describe.configure({ timeout: 90_000 });

  test("spend the generation budget per account rather than across all of them", async () => {
    const spender = await signUpOverApi("rate-limit-spender");
    const bystander = await signUpOverApi("rate-limit-bystander");

    try {
      for (let call = 1; call <= GENERATE_LIMIT; call += 1) {
        const allowed = await generate(spender.api);
        expect(allowed.status(), `generation ${call} of ${GENERATE_LIMIT}`).toBe(200);
      }

      const refused = await generate(spender.api);
      expect(refused.status()).toBe(429);
      // Parsed as the envelope the app reads rather than poked at: `retryable: false` is
      // what keeps React Query from retrying straight back into the same limit.
      expect(ApiErrorSchema.parse(await refused.json())).toMatchObject({
        code: "RATE_LIMITED",
        retryable: false,
      });

      // The regression this spec exists for. A keyGenerator that buckets every user into
      // one key passes everything above and locks the whole product out right here.
      const untouched = await generate(bystander.api);
      expect(untouched.status()).toBe(200);

      // Each route keeps its own budget too, so spending the generation one does not
      // close the search the library home runs on every keystroke.
      const search = await spender.api.get("/api/books/search", {
        params: { q: BOOK.title },
      });
      expect(search.status()).toBe(200);
    } finally {
      await spender.api.dispose();
      await bystander.api.dispose();
    }
  });
});
