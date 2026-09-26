import type { Page } from "@playwright/test";

import { fixtureBook } from "./fixtures/catalog";
import { FIXTURE_ANCHORS } from "./fixtures/tracks";
import {
  expectTrackRow,
  expectedPlaylistName,
  logIn,
  playlistHeader,
  type SavedPlaylist,
} from "./helpers";
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
      playlistHeader(page).getByText(expectedPlaylistName(TESSELLATE), { exact: true }),
    ).toBeVisible();
    // The hero's eyebrow, so the name is over this book and not another. Case-insensitive
    // because whether it is uppercased in JS or in CSS is presentation.
    await expect(playlistHeader(page)).toContainText(TESSELLATE.title, { ignoreCase: true });

    // First and last of the suggested anchors.
    await expectTrackRow(page, FIXTURE_ANCHORS[0]);
    await expectTrackRow(page, FIXTURE_ANCHORS[FIXTURE_ANCHORS.length - 1]);
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
      playlistHeader(page).getByText(expectedPlaylistName(LANTERN), { exact: true }),
    ).toBeVisible();
    await expectTrackRow(page, FIXTURE_ANCHORS[0]);
  });
});
