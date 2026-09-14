import { test as base } from "@playwright/test";

import { fixtureBook } from "./fixtures/catalog";
import { createShelf, type SavedPlaylist, type Shelf } from "./helpers";

/**
 * The saved shelf the bookshelf specs read, as a worker fixture. Not a `*.spec.ts`, so
 * Playwright's default testMatch never collects it.
 *
 * Built once per worker rather than per test: five scores is five generations, and
 * every test that takes it only reads. A test that writes — scoring a book, say —
 * calls `createShelf` for an account of its own instead.
 *
 * Scored oldest first. `GET /api/bookshelf` serves the reverse, so `RECENT` opens on
 * The Quarry Sings at Night, Saltmarsh Almanac and Tessellate, leaving The Orchard at
 * Vesper Hill and The Lantern of Quiet Hours below it. Four of the five are by Marisol
 * Vane, which is what lets a filtered shelf still overflow `RECENT`.
 */
export const SHELF_BOOKS = [
  "e2e-lantern",
  "e2e-orchard",
  "e2e-tessellate",
  "e2e-saltmarsh",
  "e2e-quarry",
].map(fixtureBook);

export const test = base.extend<Record<never, never>, { shelf: Shelf }>({
  shelf: [
    async ({}, use) => {
      await use(await createShelf("shelf", SHELF_BOOKS));
    },
    { scope: "worker" },
  ],
});

export { expect } from "@playwright/test";

/** The order the library lists them in. */
export function newestFirst(shelf: Shelf): SavedPlaylist[] {
  return [...shelf.playlists].reverse();
}

export function savedPlaylistFor(shelf: Shelf, googleBooksId: string): SavedPlaylist {
  const saved = shelf.playlists.find((entry) => entry.book.googleBooksId === googleBooksId);
  if (!saved) throw new Error(`The shelf holds no playlist for "${googleBooksId}"`);
  return saved;
}
