import type { Page } from "@playwright/test";
import { ApiErrorSchema, PACING_LABELS, PlaylistSchema } from "@underscore/shared";

import { fixtureBook, type FixtureBook } from "./fixtures/catalog";
import { FIXTURE_ANCHORS } from "./fixtures/tracks";
import {
  GENERATE_TIMEOUT_MS,
  createShelf,
  expectTrackRow,
  expectedPlaylistName,
  logIn,
  playlistHeader,
  signUpOverApi,
  type Account,
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
/** A second playlist to keep, so a shelf that loses one still has a row to show. */
const SALTMARSH = fixtureBook("e2e-saltmarsh");

/** A mood in the reader's own words, as the mood screen's `Something else` would send it. */
const TYPED_MOOD = "like rain on a tin roof";

/** The confirm sheet's heading, which is what says it is open. */
const DELETE_CONFIRM = "Delete this playlist?";

const capitalize = (word: string) => word[0].toUpperCase() + word.slice(1);

/**
 * The mood line under the hero, derived from the fixture's read rather than written down:
 * the profile's moods, a typed one among them, then the pacing.
 */
const moodLine = (book: FixtureBook, typed?: string) => {
  const moods = [...book.analysis.mood, ...(typed ? [typed] : [])].map(capitalize);

  return `${moods.join(", ")} · ${PACING_LABELS[book.analysis.pacing]}`;
};

/** A saved playlist's row in the library, which is also the way into its screen. */
const libraryRow = (page: Page, saved: SavedPlaylist) =>
  page.getByRole("button", { name: expectedPlaylistName(saved.book) });

async function openFromLibrary(page: Page, saved: SavedPlaylist) {
  await libraryRow(page, saved).click();
  await expect(page).toHaveURL(new RegExp(`/playlist/${saved.id}$`));
}

/**
 * An account with one playlist scored from a profile carrying a typed mood — the profile
 * the mood screen hands over when `Something else` was filled in.
 *
 * Over HTTP rather than through the mood screen, which is that screen's spec's job
 * (e2e/mood.spec.ts): scored this way, nothing of the generation is still on screen, so
 * the phrase the playlist renders can only have come back out of `Playlist.moodProfile`.
 */
async function scoreWithTypedMood(
  book: FixtureBook,
): Promise<{ account: Account; saved: SavedPlaylist }> {
  const { account, api } = await signUpOverApi("playlist-typed-mood");

  try {
    const response = await api.post("/api/playlists/generate", {
      data: {
        googleBooksId: book.googleBooksId,
        moodProfile: { ...book.analysis, moodOther: TYPED_MOOD },
      },
      timeout: GENERATE_TIMEOUT_MS,
    });
    if (!response.ok()) {
      throw new Error(`Scoring "${book.title}" failed: ${await response.text()}`);
    }

    const playlist = PlaylistSchema.parse(await response.json());
    return { account, saved: { id: playlist.id, book } };
  } finally {
    await api.dispose();
  }
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

  test("says the read it was built from under the name", async ({ shelf, page }) => {
    const saved = savedPlaylistFor(shelf, TESSELLATE.googleBooksId);
    await logIn(page, shelf);

    await openFromLibrary(page, saved);

    await expect(page.getByText(moodLine(TESSELLATE), { exact: true })).toBeVisible();
  });

  test("says a mood typed in the reader's own words back among the read's own", async ({
    page,
  }) => {
    const { account, saved } = await scoreWithTypedMood(LANTERN);
    await logIn(page, account);

    await openFromLibrary(page, saved);

    // Read back off the stored profile, so the phrase survived generation rather than
    // only reaching Claude. It sits among the moods, not in a line of its own.
    await expect(page.getByText(moodLine(LANTERN, TYPED_MOOD), { exact: true })).toBeVisible();
  });
});

/** The `•••` menu, as far as the confirm. */
async function openDeleteConfirm(page: Page) {
  await page.getByRole("button", { name: "Playlist options" }).click();
  await page.getByRole("button", { name: "Delete playlist", exact: true }).click();
  await expect(page.getByText(DELETE_CONFIRM, { exact: true })).toBeVisible();
}

test.describe("deleting a saved playlist", () => {
  // A shelf apiece below, so the same budget the export specs take for a generation.
  test.describe.configure({ timeout: 90_000 });

  test("keeps it when the reader backs out of the confirm", async ({ shelf, page }) => {
    // The shared shelf will do: backing out is what this test asserts, so it writes nothing.
    const saved = savedPlaylistFor(shelf, TESSELLATE.googleBooksId);
    await logIn(page, shelf);
    await openFromLibrary(page, saved);

    await openDeleteConfirm(page);
    await page.getByRole("button", { name: "Keep", exact: true }).click();

    await expect(page.getByText(DELETE_CONFIRM, { exact: true })).toBeHidden();
    await expect(page).toHaveURL(new RegExp(`/playlist/${saved.id}$`));
    await expect(
      playlistHeader(page).getByText(expectedPlaylistName(TESSELLATE), { exact: true }),
    ).toBeVisible();

    // Back to the library and reloaded, so the row is one the shelf still serves rather
    // than one React Query is still holding.
    await page.goBack();
    await expect(page).toHaveURL(/\/library$/);
    await page.reload();
    await expect(libraryRow(page, saved)).toBeVisible();
  });

  test("takes it off the shelf and lands back on the library", async ({ page }) => {
    const shelf = await createShelf("playlist-delete", [SALTMARSH, TESSELLATE]);
    const [kept, deleted] = shelf.playlists;
    await logIn(page, shelf);
    await openFromLibrary(page, deleted);

    await openDeleteConfirm(page);
    await page.getByRole("button", { name: "Delete", exact: true }).click();

    await expect(page).toHaveURL(/\/library$/);
    // The kept row first, so the shelf has loaded before the absence is believed.
    await expect(libraryRow(page, kept)).toBeVisible();
    await expect(libraryRow(page, deleted)).toHaveCount(0);

    // Reloaded, because a row gone from the cache is not a playlist gone from the shelf.
    await page.reload();
    await expect(libraryRow(page, kept)).toBeVisible();
    await expect(libraryRow(page, deleted)).toHaveCount(0);
  });
});

/**
 * `assertOwned` in server/src/services/bookshelf.ts, which nothing on screen can reach:
 * the app only ever offers a reader their own playlists.
 */
test.describe("deleting a playlist that is not yours", () => {
  test.describe.configure({ timeout: 90_000 });
  test.skip(({ isMobile }) => isMobile, "API-level; a second device project adds no coverage");

  test("refuses a stranger's delete and leaves the playlist with its owner", async () => {
    const owner = await signUpOverApi("playlist-owner");
    const stranger = await signUpOverApi("playlist-stranger");

    try {
      const generated = await owner.api.post("/api/playlists/generate", {
        data: { googleBooksId: SALTMARSH.googleBooksId },
        timeout: GENERATE_TIMEOUT_MS,
      });
      expect(generated.ok(), await generated.text()).toBe(true);
      const playlist = PlaylistSchema.parse(await generated.json());

      const refused = await stranger.api.delete(`/api/bookshelf/${playlist.id}`);
      expect(refused.status()).toBe(403);
      expect(ApiErrorSchema.parse(await refused.json())).toMatchObject({
        code: "FORBIDDEN",
        retryable: false,
      });

      const stillThere = await owner.api.get(`/api/bookshelf/${playlist.id}`);
      expect(stillThere.status()).toBe(200);
      expect(PlaylistSchema.parse(await stillThere.json()).id).toBe(playlist.id);
    } finally {
      await owner.api.dispose();
      await stranger.api.dispose();
    }
  });
});
