import { expect, test, type Page } from "@playwright/test";
import {
  MAX_GENRES,
  OTHER,
  PACING_LABELS,
  defaultPlaylistName,
  type BookFormat,
  type Genre,
  type Mood,
  type MoodProfile,
} from "@underscore/shared";

import { FIXTURE_ANCHORS } from "./fixtures/tracks";
import {
  GENERATE_TIMEOUT_MS,
  createShelf,
  expectTrackRow,
  logIn,
  logInAsSeededUser,
  playlistHeader,
  searchLibrary,
} from "./helpers";

/**
 * Scoring a book the catalogue never had — `/score-by-hand`, reached from the library
 * home's pinned `+ Add manually`.
 *
 * Nothing on this path is analysed: the reader states the read Claude would otherwise
 * take off a volume, so the CTA goes straight to generation. That generation still runs
 * end to end — through the real server and the fixture upstreams in
 * e2e/fixtures/upstream-server.ts, so no live Claude call is spent. The fixture answers an
 * anchor request for a book it has never heard of without a playlist name, which is the
 * `defaultPlaylistName` path; the expected name is derived from that function rather than
 * written down.
 *
 * What is asserted here is what only this screen has: the seeded title, the genre row's
 * floor and ceiling, the cover sheet, and a generation that carries a `manualBook` instead
 * of a volume id. The semantics it shares with the mood screen — the pacing pills, the
 * fine-tune groups, the mood cap — belong to mood.spec.ts and are not re-tested.
 */

/**
 * A chip's accessible name is its bare label in either state, which is what makes these
 * locators survive a toggle; its selected state reaches the web DOM only as the check the
 * label grows, because react-native-web drops `accessibilityState` (see e2e/README.md).
 */
const CHECK = " ✓";
const chip = (page: Page, label: string) => page.getByRole("button", { name: label });
const selected = (label: string) => `${label}${CHECK}`;

/**
 * The product copy this spec matches on, because the component rendering it has no handle
 * of its own. Each entry names the `testID` that would retire it:
 *
 * - `genreOther` → `testID="genre-other"`, via a `testID` prop on `ChipMultiSelect`
 * - `moodOther` → `testID="mood-other"`, the same prop on the mood row
 * - `addCover` / `changeCover` are the cover tile's own accessible names, not copy on it
 */
const COPY = {
  genreOther: "Which genre?",
  moodOther: "How does it feel?",
  addCover: "Add cover",
  changeCover: "Change cover",
} as const;

/** Annotated, not literal, so renaming one in shared breaks the build rather than a run. */
const SEED_GENRE: Genre = "Literary fiction";
/** As many as the cap allows, so pressing all three is one genre over it. */
const OVER_CAP: Genre[] = ["Fantasy", "Mystery", "Horror"];

const PICKED_MOOD: Mood = "cozy";
const MOOD_CHIP = `${PICKED_MOOD[0].toUpperCase()}${PICKED_MOOD.slice(1)}`;

const PICKED_PACING: MoodProfile["pacing"] = "fast";
/** The screen's own opening pacing, which a generation that touches nothing sends. */
const DEFAULT_PACING: MoodProfile["pacing"] = "steady";

const AUDIOBOOK: BookFormat = "Audiobook";

/** One of `COVERS` in app/src/components/cover-emoji-field.tsx. */
const COVER = "📕";

/** Invented, like the fixture titles: the upstream must not recognise this as a book. */
const TYPED = {
  title: "Harrowgate Nine",
  author: "Imogen Castellan",
  genreOther: "Weird fiction",
} as const;

/**
 * What the stack will call a playlist for a book it could not read: Claude sent no name,
 * so `shared` builds one from the mood and the pacing. Only those two fields matter to it.
 */
const expectedName = (mood: Mood[], pacing: MoodProfile["pacing"]) =>
  defaultPlaylistName({ genre: [], mood, pacing, summary: "" });

/** The cover tile, by the accessible name it carries in each state. */
const coverTile = (page: Page, isSet = false) =>
  page.getByRole("button", { name: isSet ? COPY.changeCover : COPY.addCover });

/** A cell in the cover sheet, which exists only while that sheet is open. */
const coverCell = (page: Page, emoji: string) => page.getByRole("button", { name: emoji });

const generateButton = (page: Page) => page.getByRole("button", { name: /^Generate playlist/ });

/** The screen as a reader first sees it, with the library left unmounted behind it. */
async function openByHand(page: Page) {
  await page.goto("/score-by-hand");
  await expect(generateButton(page)).toBeVisible();
}

test.describe("getting to the by-hand screen", () => {
  test("seeds the title with the query the catalogue missed", async ({ page }) => {
    await logInAsSeededUser(page);

    // No fixture book matches, which is the state the button exists for — though it is
    // pinned on screen whatever the search is doing.
    await searchLibrary(page, "Nightjar Ledger");
    await page.getByRole("button", { name: /Add manually/ }).click();

    await expect(page).toHaveURL(/\/score-by-hand/);
    // What they are holding is what they were searching for, so it is already typed in.
    await expect(page.getByLabel("Title", { exact: true })).toHaveValue("Nightjar Ledger");
  });
});

/**
 * The picks a reader can get wrong. None of this persists anything, so these share the
 * seeded account; the screen is opened by `goto` so the library is not left mounted under
 * it, duplicating its text.
 */
test.describe("stating the read", () => {
  test.beforeEach(async ({ page }) => {
    await logInAsSeededUser(page);
    await openByHand(page);
  });

  test("keeps a genre selected when it is the only one left", async ({ page }) => {
    // The screen opens on this one, which is what keeps `ManualBook.genre` non-empty from
    // the first paint.
    await expect(chip(page, SEED_GENRE)).toHaveText(selected(SEED_GENRE));

    await chip(page, SEED_GENRE).click();

    // Pressing the last genre off would send a book with no genre at all, so it does not
    // come off.
    await expect(chip(page, SEED_GENRE)).toHaveText(selected(SEED_GENRE));
  });

  test("drops the oldest genre rather than refusing a fourth", async ({ page }) => {
    // These presses on top of the seeded one are one genre over the cap.
    expect(OVER_CAP.length).toBe(MAX_GENRES);
    for (const genre of OVER_CAP) {
      await chip(page, genre).click();
    }

    for (const genre of OVER_CAP) {
      await expect(chip(page, genre)).toHaveText(selected(genre));
    }
    await expect(chip(page, SEED_GENRE)).toHaveText(SEED_GENRE);
  });

  test("lets a mood come back off, since the row may end up empty", async ({ page }) => {
    // Where genre has a floor, mood has none: a reader who would rather not say leaves it
    // blank and Claude infers it.
    await chip(page, MOOD_CHIP).click();
    await expect(chip(page, MOOD_CHIP)).toHaveText(selected(MOOD_CHIP));

    await chip(page, MOOD_CHIP).click();
    await expect(chip(page, MOOD_CHIP)).toHaveText(MOOD_CHIP);
  });

  test("opens a free-text field per row from 'Something else'", async ({ page }) => {
    // Genre, mood, setting and era each offer the escape hatch, in that order down the
    // screen. Which one opened is proven by its placeholder, not by the index.
    const somethingElse = page.getByRole("button", { name: OTHER });

    await somethingElse.first().click();
    const genreOther = page.getByPlaceholder(COPY.genreOther);
    await expect(genreOther).toBeVisible();

    await somethingElse.nth(1).click();
    await expect(page.getByPlaceholder(COPY.moodOther)).toBeVisible();
    // Each row owns its own field; opening the mood one leaves the genre one alone.
    await expect(genreOther).toBeVisible();
  });

  test("picks a cover from the sheet the tile opens, and takes it back off", async ({ page }) => {
    await coverTile(page).click();
    await expect(coverCell(page, COVER)).toBeVisible();

    await coverCell(page, COVER).click();
    // The sheet closes on the pick — it is one choice, not a form — and the tile wears it.
    await expect(coverCell(page, COVER)).toBeHidden();
    await expect(coverTile(page, true).getByText(COVER)).toBeVisible();

    await coverTile(page, true).click();
    await page.getByRole("button", { name: "Remove" }).click();

    // A cover is optional, so there is a way back to having none.
    await expect(coverTile(page)).toBeVisible();
  });
});

/**
 * Generation writes a `Playlist` row, so each of these takes an account of its own: the
 * seeded one is read-only for the whole suite, and `perUserLimit` allows one account ten
 * generations an hour.
 */
test.describe("handing a described book to generation", () => {
  test("sends the described book, not a volume id, and lands on its playlist", async ({
    page,
  }) => {
    await logIn(page, await createShelf("by-hand-described", []));
    await openByHand(page);

    await coverTile(page).click();
    await coverCell(page, COVER).click();

    await page.getByLabel("Title", { exact: true }).fill(TYPED.title);
    await page.getByLabel("Author", { exact: true }).fill(TYPED.author);

    await chip(page, OVER_CAP[0]).click();
    await page.getByRole("button", { name: OTHER }).first().click();
    await page.getByPlaceholder(COPY.genreOther).fill(TYPED.genreOther);

    await chip(page, MOOD_CHIP).click();
    await chip(page, PACING_LABELS[PICKED_PACING]).click();

    // One fine-tune answer of each kind, to prove this screen wires the context at all —
    // the groups' own semantics are mood.spec.ts's.
    await page.getByRole("switch", { name: "Include music with lyrics" }).click();
    await chip(page, AUDIOBOOK).click();

    const generation = page.waitForRequest("**/api/playlists/generate");
    await generateButton(page).click();

    await expect(page).toHaveURL(/\/playlist/);

    // The request body, unusually, because it is the point of the path: there is no volume
    // behind a book the reader described, so the book itself travels in the request and
    // nothing on the result would show which of the two it came from.
    const body = (await generation).postDataJSON();
    expect(body).not.toHaveProperty("googleBooksId");
    expect(body.manualBook).toEqual({
      title: TYPED.title,
      author: TYPED.author,
      genre: [SEED_GENRE, OVER_CAP[0]],
      coverEmoji: COVER,
    });
    expect(body.moodProfile).toMatchObject({
      genre: [SEED_GENRE, OVER_CAP[0]],
      // Rides beside the closed vocabularies rather than in them, as the typed mood does.
      genreOther: TYPED.genreOther,
      mood: [PICKED_MOOD],
      pacing: PICKED_PACING,
    });
    expect(body.readingContext).toMatchObject({ lyrics: true, format: AUDIOBOOK });

    // Generation is thirty catalogue lookups, so this waits on the harness's generation
    // budget rather than the default assertion timeout.
    const name = expectedName([PICKED_MOOD], PICKED_PACING);
    await expect(playlistHeader(page).getByText(name, { exact: true })).toBeVisible({
      timeout: GENERATE_TIMEOUT_MS,
    });
    // Scoped to the hero: the screen behind stays mounted and shows the typed title too.
    await expect(playlistHeader(page)).toContainText(TYPED.title, { ignoreCase: true });
    await expectTrackRow(page, FIXTURE_ANCHORS[0]);
  });

  test("scores a book with no mood stated and nothing else filled in", async ({ page }) => {
    await logIn(page, await createShelf("by-hand-default", []));
    await openByHand(page);

    // The screen as it opens, which is the shortest path through it: a genre is already
    // selected, a pacing is already chosen, and mood is allowed to stay empty.
    const generation = page.waitForRequest("**/api/playlists/generate");
    await generateButton(page).click();

    const body = (await generation).postDataJSON();
    expect(body.manualBook).toEqual({ genre: [SEED_GENRE] });
    expect(body.moodProfile).toMatchObject({ mood: [], pacing: DEFAULT_PACING });

    // An unstated mood leaves the name to the pacing alone.
    const name = expectedName([], DEFAULT_PACING);
    await expect(playlistHeader(page).getByText(name, { exact: true })).toBeVisible({
      timeout: GENERATE_TIMEOUT_MS,
    });
    await expectTrackRow(page, FIXTURE_ANCHORS[0]);
  });
});
