import type { Page } from "@playwright/test";

import { fixtureBook } from "./fixtures/catalog";
import { FIXTURE_ANCHORS } from "./fixtures/tracks";
import {
  createShelf,
  expectTrackRow,
  expectedPlaylistName,
  logIn,
  playlistHeader,
  searchLibrary,
  type SavedPlaylist,
} from "./helpers";
import { expect, newestFirst, test } from "./shelf";

/**
 * The library home: the saved shelf split into `RECENT` and everything below it, the
 * search that filters it, and the Google Books catalogue behind both as a fallback.
 *
 * The shelf under test is a real one — `createShelf` in helpers.ts scores its books
 * through `POST /api/playlists/generate`, which runs the whole pipeline against the
 * upstream fixtures (e2e/fixtures/upstream-server.ts). So the rows asserted below are
 * rows the product wrote, and nothing here stubs our own API.
 *
 * The shared shelf is a worker fixture and every test that takes it only reads. The two
 * tests that write — an empty account, and a score run through the UI — build accounts
 * of their own.
 */

const ASH = fixtureBook("e2e-ash");
const TESSELLATE = fixtureBook("e2e-tessellate");
const SALTMARSH = fixtureBook("e2e-saltmarsh");

/** Four of the five shelf books are theirs, so filtering on it still overflows RECENT. */
const SHARED_AUTHOR = fixtureBook("e2e-quarry").authors[0];

/**
 * The product copy this spec matches on, because nothing rendering it has a handle of
 * its own. A `testID` on `LibrarySection`'s root view in
 * app/src/components/library-section.tsx would retire every entry here.
 */
const COPY = {
  recent: "Recent",
  rest: "Your playlists",
  savedMatches: "In your library",
  searching: "Searching…",
  emptyLibrary: "Your library is empty.",
} as const;

/**
 * A section, reached as its label's parent — one hop, the shape mood.spec.ts uses for
 * the read banner. Rows are the only buttons inside one and come back in render order,
 * which is what makes the `RECENT`/rest split assertable at all.
 */
const section = (page: Page, label: string) =>
  page.getByText(label, { exact: true }).locator("..");

const rowsIn = (page: Page, label: string) => section(page, label).getByRole("button");

/** A row runs its title straight into its meta line, so only the head of it is known. */
const titled = (title: string) =>
  new RegExp(`^${title.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`);

const playlistRows = (saved: SavedPlaylist[]) =>
  saved.map((entry) => titled(expectedPlaylistName(entry.book)));

/** Every catalogue search the page makes, in order, by search term. */
function recordCatalogueSearches(page: Page): string[] {
  const terms: string[] = [];
  page.on("request", (request) => {
    const url = new URL(request.url());
    if (url.pathname === "/api/books/search") terms.push(url.searchParams.get("q") ?? "");
  });
  return terms;
}

test.describe("the saved shelf", () => {
  test.beforeEach(async ({ page, shelf }) => {
    await logIn(page, shelf);
  });

  test("puts the three newest playlists under Recent and the rest below", async ({
    shelf,
    page,
  }) => {
    const saved = newestFirst(shelf);

    await expect(rowsIn(page, COPY.recent)).toHaveText(playlistRows(saved.slice(0, 3)));
    await expect(rowsIn(page, COPY.rest)).toHaveText(playlistRows(saved.slice(3)));
  });

  test("filters the shelf by a playlist's own name", async ({ page }) => {
    // "tide" is in the name Claude gave this one and nowhere in the book behind it.
    await searchLibrary(page, "tide");

    await expect(rowsIn(page, COPY.recent)).toHaveText([titled(expectedPlaylistName(SALTMARSH))]);
    // The one match fits inside `RECENT`, so there is no second section to label.
    await expect(section(page, COPY.rest)).toHaveCount(0);
    await expect(section(page, COPY.savedMatches)).toHaveCount(0);
  });

  test("filters the shelf by the book behind a playlist", async ({ page }) => {
    await searchLibrary(page, TESSELLATE.title);

    await expect(rowsIn(page, COPY.recent)).toHaveText([titled(expectedPlaylistName(TESSELLATE))]);
  });

  test("re-fills Recent from what an author filter leaves", async ({ shelf, page }) => {
    const byAuthor = newestFirst(shelf).filter((saved) =>
      saved.book.authors.includes(SHARED_AUTHOR),
    );

    await searchLibrary(page, SHARED_AUTHOR);

    // Filtered first, then split: the newest match this author has is promoted into
    // `RECENT` rather than the three newest overall staying pinned there.
    await expect(rowsIn(page, COPY.recent)).toHaveText(playlistRows(byAuthor.slice(0, 3)));
    await expect(rowsIn(page, COPY.savedMatches)).toHaveText(playlistRows(byAuthor.slice(3)));
    // The book by somebody else is gone from the shelf entirely, not just demoted.
    await expect(
      page.getByRole("button", { name: expectedPlaylistName(TESSELLATE) }),
    ).toHaveCount(0);
  });

  test("never asks the catalogue while the shelf itself matches", async ({ page }) => {
    const searches = recordCatalogueSearches(page);

    await searchLibrary(page, TESSELLATE.title);
    await expect(rowsIn(page, COPY.recent)).toHaveText([titled(expectedPlaylistName(TESSELLATE))]);

    // A term nothing saved matches, so a catalogue search demonstrably does happen —
    // which is also what proves a debounce has elapsed since the term above.
    await searchLibrary(page, "ivory");
    await expect(page.getByRole("button", { name: ASH.title })).toBeVisible();

    expect(searches).toEqual(["ivory"]);
  });

  test("answers a search from the shelf rather than from an unloaded one", async ({ page }) => {
    // Held open rather than slept through: an unloaded shelf is not an empty one, and
    // answering from the catalogue in the meantime would offer a book already saved.
    let releaseShelf = () => {};
    const shelfHeld = new Promise<void>((resolve) => {
      releaseShelf = resolve;
    });
    // A predicate rather than a glob, so `/api/bookshelf/<id>` is not caught with it.
    await page.route(
      (url) => url.pathname === "/api/bookshelf",
      async (route) => {
        await shelfHeld;
        await route.continue();
      },
    );

    await page.reload();
    await searchLibrary(page, TESSELLATE.title);

    // Placeholders, not "No match for …": nothing has been ruled out yet.
    await expect(section(page, COPY.searching)).toBeVisible();

    releaseShelf();

    await expect(rowsIn(page, COPY.recent)).toHaveText([titled(expectedPlaylistName(TESSELLATE))]);
  });

  test("falls back to the catalogue when nothing saved matches", async ({ page }) => {
    await searchLibrary(page, "ivory");

    const row = page.getByRole("button", { name: ASH.title });
    await expect(row).toBeVisible();

    // A catalogue hit leads to book detail — it has no playlist behind it yet.
    await row.click();
    await expect(page).toHaveURL(new RegExp(`/book/${ASH.googleBooksId}$`));
  });

  test("opens a saved playlist from its row", async ({ shelf, page }) => {
    const newest = newestFirst(shelf)[0];

    await page.getByRole("button", { name: expectedPlaylistName(newest.book) }).click();

    await expect(page).toHaveURL(new RegExp(`/playlist/${newest.id}$`));
  });
});

test.describe("an empty library", () => {
  test("shows the empty state until a search replaces it", async ({ page }) => {
    await logIn(page, await createShelf("empty-library", []));

    await expect(page.getByText(COPY.emptyLibrary)).toBeVisible();
    await expect(section(page, COPY.recent)).toHaveCount(0);

    await searchLibrary(page, "ivory");

    await expect(page.getByRole("button", { name: ASH.title })).toBeVisible();
    await expect(page.getByText(COPY.emptyLibrary)).toBeHidden();
  });
});

test.describe("scoring a book from the library", () => {
  test("puts the new playlist at the head of Recent", async ({ page }) => {
    const account = await createShelf("scores-a-book", [TESSELLATE]);
    await logIn(page, account);

    // The shelf is on screen, and cached, before anything is scored — so the new row
    // below can only have arrived through the invalidation the mutation fires.
    await expect(rowsIn(page, COPY.recent)).toHaveText([titled(expectedPlaylistName(TESSELLATE))]);

    // A document load would drop that cache and make the assertion meaningless.
    let documentLoads = 0;
    page.on("load", () => (documentLoads += 1));

    await searchLibrary(page, "ivory");
    await page.getByRole("button", { name: ASH.title }).click();
    await expect(page).toHaveURL(new RegExp(`/book/${ASH.googleBooksId}$`));

    await page.getByRole("button", { name: /^Analyze/ }).click();
    await expect(page.getByText(ASH.analysis.summary)).toBeVisible();

    await page.getByRole("button", { name: /^Generate playlist/ }).click();
    await expect(page).toHaveURL(/\/playlist\?/);
    await expectTrackRow(page, FIXTURE_ANCHORS[0]);
    // Scoped to the hero: the library underneath has already grown a row of the same
    // name, which is the invalidation arriving while the result screen is on top.
    await expect(
      playlistHeader(page).getByText(expectedPlaylistName(ASH), { exact: true }),
    ).toBeVisible();

    // Back through the stack the flow pushed: playlist → mood → book → library.
    await page.goBack();
    await expect(page).toHaveURL(/\/mood\?/);
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/book/${ASH.googleBooksId}$`));
    await page.goBack();
    await expect(page).toHaveURL(/\/library$/);

    // The term typed to find the book is still in the field, and still filtering the
    // shelf with it; clearing it is what puts the whole shelf back on screen.
    await page.getByRole("button", { name: "Clear search" }).click();

    await expect(rowsIn(page, COPY.recent)).toHaveText(
      [ASH, TESSELLATE].map((book) => titled(expectedPlaylistName(book))),
    );
    expect(documentLoads).toBe(0);
  });
});
