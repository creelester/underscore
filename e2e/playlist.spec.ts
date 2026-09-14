import type { Page } from "@playwright/test";

import { fixtureBook } from "./fixtures/catalog";
import { FIXTURE_ANCHORS, trackLine } from "./fixtures/tracks";
import { expectedPlaylistName, logIn, type SavedPlaylist } from "./helpers";
import { expect, savedPlaylistFor, test } from "./shelf";

/**
 * `/playlist/<id>` — a playlist read back off the bookshelf. Its heading is the whole
 * point of the naming work: the title Claude sent with the tracks, or the fallback
 * `shared` builds when it sent none. Both come from `expectedPlaylistName`, so neither
 * is written down here.
 *
 * Opened by pressing its row rather than by `page.goto`. `expo export` writes a static
 * site and a dynamic segment gets no page of its own unless the route declares
 * `generateStaticParams`, so `expo serve` answers `/playlist/<id>` with 404 — a deep
 * link is only reachable on a host that rewrites. The row is the reader's path anyway;
 * what it costs is that the library stays mounted underneath, so a name is on screen
 * twice and the heading has to be scoped rather than matched on its own.
 */

const TESSELLATE = fixtureBook("e2e-tessellate");
/** The one shelf book whose anchors come back unnamed, so its playlist falls back. */
const LANTERN = fixtureBook("e2e-lantern");

/**
 * The screen's header block, reached as the book line's parent — one hop, the shape
 * mood.spec.ts uses for the read banner. It scopes the name away from the library row
 * of the same name behind it, and asserts the two lines belong together. A
 * `testID="saved-playlist-header"` in app/src/app/(app)/playlist/[playlistId].tsx would
 * replace the hop.
 */
const header = (page: Page, saved: SavedPlaylist) =>
  page.getByText(saved.book.title, { exact: true }).locator("..");

async function openFromLibrary(page: Page, saved: SavedPlaylist) {
  await page.getByRole("button", { name: expectedPlaylistName(saved.book) }).click();
  await expect(page).toHaveURL(new RegExp(`/playlist/${saved.id}$`));
}

test.describe("a saved playlist", () => {
  test("heads with the name Claude gave it, over the book and its tracks", async ({
    shelf,
    page,
  }) => {
    const saved = savedPlaylistFor(shelf, TESSELLATE.googleBooksId);
    await logIn(page, shelf);

    await openFromLibrary(page, saved);

    await expect(
      header(page, saved).getByText(expectedPlaylistName(TESSELLATE), { exact: true }),
    ).toBeVisible();
    // First and last, in the order the anchors were suggested.
    await expect(page.getByText(trackLine(FIXTURE_ANCHORS[0]))).toBeVisible();
    await expect(
      page.getByText(trackLine(FIXTURE_ANCHORS[FIXTURE_ANCHORS.length - 1])),
    ).toBeVisible();
  });

  test("heads with a name built from the mood and the pacing when Claude sent none", async ({
    shelf,
    page,
  }) => {
    const saved = savedPlaylistFor(shelf, LANTERN.googleBooksId);
    await logIn(page, shelf);

    await openFromLibrary(page, saved);

    // A generation that came back untitled still keeps its thirty resolved tracks.
    await expect(
      header(page, saved).getByText(expectedPlaylistName(LANTERN), { exact: true }),
    ).toBeVisible();
    await expect(page.getByText(trackLine(FIXTURE_ANCHORS[0]))).toBeVisible();
  });
});
