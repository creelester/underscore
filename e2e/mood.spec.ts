import { expect, test, type Page } from "@playwright/test";

import { fixtureBook } from "./fixtures/catalog";
import { logInAsSeededUser } from "./helpers";

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
 * Every test here only reads: the mood step persists nothing, so the seeded account is
 * safe to share with the parallel worker running the other project.
 */

const BOOK = fixtureBook("e2e-lantern");

/** `PACING_LABELS` in app/src/lib/gradients.ts — the pills read nothing like the wire values. */
const PACING_LABELS = { slow: "Slow burn", steady: "Steady", fast: "Breakneck" } as const;

const capitalize = (mood: string) => mood[0].toUpperCase() + mood.slice(1);

const READ_MOODS = BOOK.analysis.mood.map(capitalize);
const READ_PACING = PACING_LABELS[BOOK.analysis.pacing];

/**
 * A chip's accessible name is its bare label whichever state it is in, which is what
 * makes this locator survive a toggle. Its *selected* state, though, reaches the web
 * DOM only as the check the label grows: `Chip` says so with `accessibilityState`,
 * which react-native-web 0.21 does not map to `aria-selected`. So selection is asserted
 * on the label text rather than on an aria attribute.
 */
const chip = (page: Page, label: string) => page.getByRole("button", { name: label });
const checked = (label: string) => `${label} ✓`;

/**
 * The column beside the cover: title, author, genre, then a line per mood and one for
 * pacing. It has no handle of its own, so it is reached as the title's parent — one
 * hop, anchored on user-visible text.
 *
 * The scope matters because a mood's name is on screen twice when it is part of the
 * read: once as a line here, once as the chip that put it there. Only usable on a
 * screen reached by `goto`; walking in from book detail leaves that screen mounted
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

  test("walks search → book detail → the read of the book", async ({ page }) => {
    await page.getByPlaceholder("Search your books, or any book").fill("lantern");

    // The row is a button whose name is the title and its meta line.
    await page.getByRole("button", { name: BOOK.title }).click();
    await expect(page).toHaveURL(new RegExp(`/book/${BOOK.googleBooksId}$`));
    await expect(page.getByText(BOOK.description)).toBeVisible();

    await page.getByRole("button", { name: "Analyze →" }).click();

    await expect(page).toHaveURL(new RegExp(`/mood\\?googleBooksId=${BOOK.googleBooksId}$`));
    // Book detail stays mounted underneath, so this asserts on text only the mood
    // screen renders — the read itself, and the heading over the corrections.
    await expect(page.getByText(BOOK.analysis.summary)).toBeVisible();
    await expect(page.getByText("Fine-tune to sharpen the score")).toBeVisible();
    for (const mood of READ_MOODS) {
      await expect(chip(page, mood)).toHaveText(checked(mood));
    }
    await expect(chip(page, READ_PACING)).toHaveText(checked(READ_PACING));
  });

  test("shows the analyzing screen while the read is in flight", async ({ page }) => {
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

    await page.getByPlaceholder("Search your books, or any book").fill("lantern");
    await page.getByRole("button", { name: BOOK.title }).click();
    await page.getByRole("button", { name: "Analyze →" }).click();

    // The book is already cached from the search, so the wait names it.
    await expect(page.getByText(`Reading ${BOOK.title}…`)).toBeVisible();
    await expect(page.getByText("Pulling the book’s details")).toBeVisible();

    releaseRead();

    await expect(page.getByText(BOOK.analysis.summary)).toBeVisible();
    await expect(page.getByText(`Reading ${BOOK.title}…`)).toBeHidden();
  });
});

test.describe("the read Claude sent back", () => {
  test.beforeEach(async ({ page }) => {
    await logInAsSeededUser(page);
    await openMoodScreen(page);
  });

  test("names the book, its genre, and a line per mood plus the pacing", async ({ page }) => {
    await expect(readLine(page, BOOK.authors[0])).toBeVisible();
    await expect(readLine(page, BOOK.genre)).toBeVisible();

    for (const mood of READ_MOODS) {
      await expect(readLine(page, mood)).toBeVisible();
    }
    await expect(readLine(page, READ_PACING)).toBeVisible();

    // The correction chips open on the same answer the lines above state.
    await expect(page.getByText("Mood · change if it's off")).toBeVisible();
    for (const mood of READ_MOODS) {
      await expect(chip(page, mood)).toHaveText(checked(mood));
    }
  });

  test("dropping a mood and picking another rewrites the lines", async ({ page }) => {
    await chip(page, "Hopeful").click();

    await expect(chip(page, "Hopeful")).toHaveText("Hopeful");
    await expect(readLine(page, "Hopeful")).toHaveCount(0);

    await chip(page, "Cozy").click();

    await expect(chip(page, "Cozy")).toHaveText(checked("Cozy"));
    await expect(readLine(page, "Cozy")).toBeVisible();
    // The mood that was left alone, and the pacing, are still the read.
    await expect(readLine(page, "Melancholy")).toBeVisible();
    await expect(readLine(page, READ_PACING)).toBeVisible();
  });

  test("a third mood replaces the oldest rather than being refused", async ({ page }) => {
    // The read opens on two — `MAX_MOODS` — so this press is over the cap.
    await chip(page, "Tense").click();

    await expect(chip(page, "Tense")).toHaveText(checked("Tense"));
    await expect(readLine(page, "Tense")).toBeVisible();

    // The newer of the two survives; the older one goes.
    await expect(chip(page, "Hopeful")).toHaveText(checked("Hopeful"));
    await expect(readLine(page, "Hopeful")).toBeVisible();
    await expect(chip(page, "Melancholy")).toHaveText("Melancholy");
    await expect(readLine(page, "Melancholy")).toHaveCount(0);
  });

  test("a pacing pill replaces the pacing line and cannot be cleared", async ({ page }) => {
    await chip(page, "Breakneck").click();

    await expect(readLine(page, "Breakneck")).toBeVisible();
    await expect(readLine(page, READ_PACING)).toHaveCount(0);
    await expect(chip(page, READ_PACING)).toHaveText(READ_PACING);

    // Pacing is the one required group: pressing the chosen pill again keeps it.
    await chip(page, "Breakneck").click();
    await expect(chip(page, "Breakneck")).toHaveText(checked("Breakneck"));
    await expect(readLine(page, "Breakneck")).toBeVisible();
  });

  test("the fine-tune groups take an answer and give it back", async ({ page }) => {
    await chip(page, "Audiobook").click();
    await expect(chip(page, "Audiobook")).toHaveText(checked("Audiobook"));

    // Optional groups clear on a second press — the only way back to no answer.
    await chip(page, "Audiobook").click();
    await expect(chip(page, "Audiobook")).toHaveText("Audiobook");

    await chip(page, "Coast or sea").click();
    await chip(page, "Medieval").click();

    await expect(chip(page, "Coast or sea")).toHaveText(checked("Coast or sea"));
    await expect(chip(page, "Medieval")).toHaveText(checked("Medieval"));
    // Single-select: the answer moves rather than accumulating.
    await chip(page, "City").click();
    await expect(chip(page, "City")).toHaveText(checked("City"));
    await expect(chip(page, "Coast or sea")).toHaveText("Coast or sea");
  });

  test("'Something else' opens a free-text field under its own group", async ({ page }) => {
    // Mood, Setting and Era each offer the escape hatch, in that order down the screen.
    // Which one opened is proven by the placeholder, not by the index.
    const somethingElse = page.getByRole("button", { name: "Something else" });

    await somethingElse.first().click();
    const moodOther = page.getByPlaceholder("How does it feel?");
    await expect(moodOther).toBeVisible();

    await moodOther.fill("like rain on a tin roof");
    await expect(moodOther).toHaveValue("like rain on a tin roof");

    await somethingElse.nth(1).click();
    await expect(page.getByPlaceholder("Where is it set?")).toBeVisible();
    // The mood field is unaffected by another group's escape hatch.
    await expect(moodOther).toHaveValue("like rain on a tin roof");

    // Pressing it again closes the field it opened.
    await somethingElse.first().click();
    await expect(moodOther).toBeHidden();
  });

  test("'Generate playlist →' carries the corrected read to the playlist step", async ({
    page,
  }) => {
    await chip(page, "Tense").click();
    await chip(page, "Breakneck").click();
    await page.getByRole("button", { name: "Something else" }).first().click();
    await page.getByPlaceholder("How does it feel?").fill("like rain on a tin roof");
    await page.getByRole("switch", { name: "Include music with lyrics" }).click();
    await chip(page, "Audiobook").click();

    const generation = page.waitForRequest("**/api/playlists/generate");
    await page.getByRole("button", { name: "Generate playlist →" }).click();

    await expect(page).toHaveURL(/\/playlist/);

    // The request body, unusually, because it is the point: the corrected profile is
    // handed over so generation never re-reads the book and disagrees with what was on
    // screen, and nothing the playlist screen renders would show which read it used.
    const body = (await generation).postDataJSON();
    expect(body.googleBooksId).toBe(BOOK.googleBooksId);
    expect(body.moodProfile).toMatchObject({
      // The corrections, not the read: `hopeful` survived the third pick, `tense` is new.
      mood: ["hopeful", "tense"],
      pacing: "fast",
      genre: [BOOK.genre],
      summary: BOOK.analysis.summary,
    });
    expect(body.readingContext).toMatchObject({
      lyrics: true,
      moodOther: "like rain on a tin roof",
      format: "Audiobook",
    });
  });
});
