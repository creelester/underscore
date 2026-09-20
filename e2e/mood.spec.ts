import { expect, test, type Page } from "@playwright/test";
import {
  MOODS,
  OTHER,
  type BookFormat,
  type Era,
  type Mood,
  type MoodProfile,
  type Setting,
} from "@underscore/shared";

import { fixtureBook } from "./fixtures/catalog";
import { createShelf, logIn, logInAsSeededUser, searchLibrary } from "./helpers";

/**
 * The mood screen — Claude's read of a book beside its jacket, and the chips that
 * correct it — reached from book detail's `Analyze →`.
 *
 * The read is deterministic because `POST /mood-profile` runs against the fixture
 * upstream (e2e/fixtures/upstream-server.ts), not against Anthropic: the server, its
 * routes and its schemas are all real, only Claude and Google Books are served from
 * e2e/fixtures/catalog.ts. So the profile asserted below is the one the stack returns
 * on every run, and nothing here mocks our own API.
 *
 * Chip labels come from the closed vocabularies in `@underscore/shared`, and the read
 * itself from the fixture, so almost nothing here matches copy the app owns. What is
 * left is in `COPY`.
 *
 * The mood step itself persists nothing, so those tests share the seeded account. The
 * one that goes on to generate writes a playlist, so it gets an account of its own.
 */

const BOOK = fixtureBook("e2e-lantern");

const capitalize = (word: string) => word[0].toUpperCase() + word.slice(1);

/** Keyed off `MOODS`, so a mood leaving the closed enum fails this spec at compile time. */
const MOOD_CHIP = Object.fromEntries(
  MOODS.map((mood) => [mood, capitalize(mood)]),
) as Record<Mood, string>;

/**
 * `PACING_LABELS` in app/src/lib/gradients.ts — the pills read nothing like the wire
 * values, and that module imports through the app's `@/` alias, so it cannot be pulled in
 * from here. The schema's key type at least fails the build if a pacing is renamed.
 */
const PACING_CHIP: Record<MoodProfile["pacing"], string> = {
  slow: "Slow burn",
  steady: "Steady",
  fast: "Breakneck",
};

/** Annotated, not literal, so renaming an option in shared breaks the build here. */
const AUDIOBOOK: BookFormat = "Audiobook";
const CITY: Setting = "City";
const COAST: Setting = "Coast or sea";
const MEDIEVAL: Era = "Medieval";

/** The fixture's read, as the screen spells it. Oldest mood first, as Claude sent them. */
const READ_MOODS = BOOK.analysis.mood.map((mood) => MOOD_CHIP[mood]);
const [OLDEST_READ_MOOD, NEWEST_READ_MOOD] = READ_MOODS;
const READ_PACING = PACING_CHIP[BOOK.analysis.pacing];

/**
 * The two genre labels this book now carries, and they are not the same string: the read
 * names Claude's, off the closed `GENRES`, while a search row and book detail keep
 * showing whatever Google's categories reduce to.
 */
const READ_GENRE = BOOK.analysis.genre[0];
const ROW_META = `${BOOK.authors[0]} · ${BOOK.publishedYear} · ${BOOK.displayGenre}`;
const DETAIL_META = `${BOOK.displayGenre} · ${BOOK.publishedYear}`;

/**
 * The product copy this spec still matches on, because the component rendering it has no
 * handle of its own. All of it is here, once, so a wording change is a one-line fix. Each
 * entry names the `testID` that would retire it:
 *
 * - `analyzing` → `testID="scoring-progress"` on `ScoringProgress`'s root view
 * - `moodOther` → `testID="mood-other"` on the mood group's `OtherInput`
 * - `settingOther` → `testID="setting-other"`, via a `testID` prop on `OptionGroup`
 */
const COPY = {
  analyzing: (title: string) => `Reading ${title}…`,
  moodOther: "How does it feel?",
  settingOther: "Where is it set?",
} as const;

/**
 * A chip's accessible name is its bare label whichever state it is in, which is what
 * makes this locator survive a toggle. Its *selected* state, though, reaches the web
 * DOM only as the check the label grows: `Chip` says so with `accessibilityState`,
 * which react-native-web 0.21 does not map to `aria-selected`. So selection is asserted
 * on the label text rather than on an aria attribute.
 */
const CHECK = " ✓";
const chip = (page: Page, label: string) => page.getByRole("button", { name: label });
const selected = (label: string) => `${label}${CHECK}`;

/**
 * The column beside the cover: title, author, genre, then a line per mood and one for
 * pacing. It has no handle of its own, so it is reached as the title's parent — one
 * hop, anchored on the fixture's title. A `testID="mood-read-lines"` on that column in
 * app/src/app/(app)/mood.tsx would replace the hop.
 *
 * The scope matters because a mood's name is on screen twice when it is part of the
 * read: once as a line here, once as the chip that put it there. Only usable on a
 * screen reached by `goto`; arriving from book detail leaves that screen mounted
 * underneath, rendering the title a second time.
 */
const banner = (page: Page) => page.getByText(BOOK.title, { exact: true }).locator("..");
const readLine = (page: Page, line: string) => banner(page).getByText(line, { exact: true });

/** Straight to the mood step, the screen behind it left unmounted. */
async function openMoodScreen(page: Page) {
  await page.goto(`/mood?googleBooksId=${BOOK.googleBooksId}`);
  // The banner is what the read landing looks like; the analyzing state has no title.
  await expect(page.getByText(BOOK.title, { exact: true })).toBeVisible();
}

test.describe("reaching the mood screen", () => {
  test.beforeEach(async ({ page }) => {
    await logInAsSeededUser(page);
  });

  test("opens a book's read from a search result", async ({ page }) => {
    await searchLibrary(page, "lantern");

    // The row is a button whose name is the title and its meta line.
    await page.getByRole("button", { name: BOOK.title }).click();
    await expect(page).toHaveURL(new RegExp(`/book/${BOOK.googleBooksId}$`));
    await expect(page.getByText(BOOK.description)).toBeVisible();

    // The arrow is decoration, so the CTA is matched on its verb alone.
    await page.getByRole("button", { name: /^Analyze/ }).click();

    await expect(page).toHaveURL(new RegExp(`/mood\\?googleBooksId=${BOOK.googleBooksId}$`));
    // Book detail stays mounted underneath, so this asserts on what only the mood screen
    // renders: the fixture's summary, and the chips opened on the read.
    await expect(page.getByText(BOOK.analysis.summary)).toBeVisible();
    for (const mood of READ_MOODS) {
      await expect(chip(page, mood)).toHaveText(selected(mood));
    }
    await expect(chip(page, READ_PACING)).toHaveText(selected(READ_PACING));
  });

  test("leaves the catalogue's genre on the way in and shows Claude's on the read", async ({
    page,
  }) => {
    await searchLibrary(page, "lantern");

    // Google's coarse label, on both catalogue surfaces. Claude has not been asked yet,
    // and its answer is a different word for the same book once it has been.
    const row = page.getByRole("button", { name: BOOK.title });
    await expect(row).toContainText(ROW_META);
    await expect(row).not.toContainText(READ_GENRE);

    await row.click();
    await expect(page.getByText(DETAIL_META, { exact: true })).toBeVisible();
    await expect(page.getByText(READ_GENRE, { exact: true })).toHaveCount(0);

    await page.getByRole("button", { name: /^Analyze/ }).click();

    await expect(page.getByText(READ_GENRE, { exact: true })).toBeVisible();
  });

  test("waits on a screen naming the book until the read lands", async ({ page }) => {
    // Held open rather than slept through, so the transient state can be asserted
    // without racing it. The request still goes to the real server, just later.
    let releaseRead = () => {};
    const readHeld = new Promise<void>((resolve) => {
      releaseRead = resolve;
    });
    await page.route("**/api/mood-profile", async (route) => {
      await readHeld;
      await route.continue();
    });

    await searchLibrary(page, "lantern");
    await page.getByRole("button", { name: BOOK.title }).click();
    await page.getByRole("button", { name: /^Analyze/ }).click();

    // The book is already cached from the search, so the wait names it.
    await expect(page.getByText(COPY.analyzing(BOOK.title))).toBeVisible();

    releaseRead();

    await expect(page.getByText(BOOK.analysis.summary)).toBeVisible();
    await expect(page.getByText(COPY.analyzing(BOOK.title))).toBeHidden();
  });
});

test.describe("the read Claude sent back", () => {
  test.beforeEach(async ({ page }) => {
    await logInAsSeededUser(page);
    await openMoodScreen(page);
  });

  test("names the book, its genre, and a line per mood plus the pacing", async ({ page }) => {
    await expect(readLine(page, BOOK.authors[0])).toBeVisible();
    await expect(readLine(page, READ_GENRE)).toBeVisible();

    for (const mood of READ_MOODS) {
      await expect(readLine(page, mood)).toBeVisible();
    }
    await expect(readLine(page, READ_PACING)).toBeVisible();

    // The correction chips open on the same answer the lines above state.
    for (const mood of READ_MOODS) {
      await expect(chip(page, mood)).toHaveText(selected(mood));
    }
  });

  test("dropping a mood and picking another rewrites the lines", async ({ page }) => {
    await chip(page, NEWEST_READ_MOOD).click();

    await expect(chip(page, NEWEST_READ_MOOD)).toHaveText(NEWEST_READ_MOOD);
    await expect(readLine(page, NEWEST_READ_MOOD)).toHaveCount(0);

    // Not part of the read, so picking it can only come from the press.
    await chip(page, MOOD_CHIP.cozy).click();

    await expect(chip(page, MOOD_CHIP.cozy)).toHaveText(selected(MOOD_CHIP.cozy));
    await expect(readLine(page, MOOD_CHIP.cozy)).toBeVisible();
    // The mood that was left alone, and the pacing, are still the read.
    await expect(readLine(page, OLDEST_READ_MOOD)).toBeVisible();
    await expect(readLine(page, READ_PACING)).toBeVisible();
  });

  test("a third mood replaces the oldest rather than being refused", async ({ page }) => {
    // The read opens on two — `MAX_MOODS` — so this press is over the cap.
    await chip(page, MOOD_CHIP.tense).click();

    await expect(chip(page, MOOD_CHIP.tense)).toHaveText(selected(MOOD_CHIP.tense));
    await expect(readLine(page, MOOD_CHIP.tense)).toBeVisible();

    // The newer of the two survives; the older one goes.
    await expect(chip(page, NEWEST_READ_MOOD)).toHaveText(selected(NEWEST_READ_MOOD));
    await expect(readLine(page, NEWEST_READ_MOOD)).toBeVisible();
    await expect(chip(page, OLDEST_READ_MOOD)).toHaveText(OLDEST_READ_MOOD);
    await expect(readLine(page, OLDEST_READ_MOOD)).toHaveCount(0);
  });

  test("a pacing pill replaces the pacing line and cannot be cleared", async ({ page }) => {
    const fast = PACING_CHIP.fast;
    await chip(page, fast).click();

    await expect(readLine(page, fast)).toBeVisible();
    await expect(readLine(page, READ_PACING)).toHaveCount(0);
    await expect(chip(page, READ_PACING)).toHaveText(READ_PACING);

    // Pacing is the one required group: pressing the chosen pill again keeps it.
    await chip(page, fast).click();
    await expect(chip(page, fast)).toHaveText(selected(fast));
    await expect(readLine(page, fast)).toBeVisible();
  });

  test("a fine-tune answer clears on a second press, and each group holds only one", async ({
    page,
  }) => {
    await chip(page, AUDIOBOOK).click();
    await expect(chip(page, AUDIOBOOK)).toHaveText(selected(AUDIOBOOK));

    // Optional groups clear on a second press — the only way back to no answer.
    await chip(page, AUDIOBOOK).click();
    await expect(chip(page, AUDIOBOOK)).toHaveText(AUDIOBOOK);

    await chip(page, COAST).click();
    await chip(page, MEDIEVAL).click();

    await expect(chip(page, COAST)).toHaveText(selected(COAST));
    await expect(chip(page, MEDIEVAL)).toHaveText(selected(MEDIEVAL));
    // Single-select: the answer moves rather than accumulating.
    await chip(page, CITY).click();
    await expect(chip(page, CITY)).toHaveText(selected(CITY));
    await expect(chip(page, COAST)).toHaveText(COAST);
  });

  test("picking 'Something else' opens a free-text field for that group alone", async ({
    page,
  }) => {
    // Mood, Setting and Era each offer the escape hatch, in that order down the screen.
    // Which one opened is proven by the field's placeholder, not by the index.
    const somethingElse = page.getByRole("button", { name: OTHER });

    await somethingElse.first().click();
    const moodOther = page.getByPlaceholder(COPY.moodOther);
    await expect(moodOther).toBeVisible();

    await moodOther.fill("like rain on a tin roof");
    await expect(moodOther).toHaveValue("like rain on a tin roof");

    await somethingElse.nth(1).click();
    await expect(page.getByPlaceholder(COPY.settingOther)).toBeVisible();
    // The mood field is unaffected by another group's escape hatch.
    await expect(moodOther).toHaveValue("like rain on a tin roof");

    // Pressing it again closes the field it opened.
    await somethingElse.first().click();
    await expect(moodOther).toBeHidden();
  });

});

/**
 * Generation writes a `Playlist` row, so this one cannot share the seeded account the
 * rest of the file reads: a saved playlist on that shelf would answer the searches
 * above from the library instead of from the catalogue.
 */
test.describe("handing over to generation", () => {
  test.beforeEach(async ({ page }) => {
    await logIn(page, await createShelf("mood-generates", []));
    await openMoodScreen(page);
  });

  test("hands the corrected read, not the original, to the playlist step", async ({ page }) => {
    await chip(page, MOOD_CHIP.tense).click();
    await chip(page, PACING_CHIP.fast).click();
    await page.getByRole("button", { name: OTHER }).first().click();
    await page.getByPlaceholder(COPY.moodOther).fill("like rain on a tin roof");
    await page.getByRole("switch", { name: "Include music with lyrics" }).click();
    await chip(page, AUDIOBOOK).click();

    const generation = page.waitForRequest("**/api/playlists/generate");
    await page.getByRole("button", { name: /^Generate playlist/ }).click();

    await expect(page).toHaveURL(/\/playlist/);

    // The request body, unusually, because it is the point: the corrected profile is
    // handed over so generation never re-reads the book and disagrees with what was on
    // screen, and nothing the playlist screen renders would show which read it used.
    const body = (await generation).postDataJSON();
    expect(body.googleBooksId).toBe(BOOK.googleBooksId);
    expect(body.moodProfile).toMatchObject({
      // The corrections, not the read: the newer read mood survived the third pick.
      mood: [BOOK.analysis.mood[1], "tense"],
      pacing: "fast",
      genre: BOOK.analysis.genre,
      summary: BOOK.analysis.summary,
    });
    expect(body.readingContext).toMatchObject({
      lyrics: true,
      moodOther: "like rain on a tin roof",
      format: AUDIOBOOK,
    });
  });
});
