import { randomUUID } from "node:crypto";

import { expect, request, type Page } from "@playwright/test";
import { PlaylistSchema, defaultPlaylistName } from "@underscore/shared";

import { E2E_API_URL } from "../playwright.config";
import type { FixtureBook } from "./fixtures/catalog";

/**
 * Fixtures shared by the specs that cross the auth boundary. Not a `*.spec.ts` so
 * Playwright's default testMatch does not collect it as a suite.
 */

/**
 * Reseeded once per run, not per test, and workers run in parallel — so tests only
 * ever read this account. Anything that mutates uses `uniqueEmail()`.
 */
export const SEEDED_USER = {
  email: "e2e@underscore.test",
  password: "e2e-password-1234",
} as const;

export const NEW_USER_PASSWORD = "new-user-password-1234";

/** Only the splash renders this, unlike the lockup the boot overlay also draws. */
export const SPLASH_TAGLINE = "a soundtrack to all your stories";

/**
 * Where a signed-in session settles. `/` is a `<Redirect>` onto one of the tabs, and
 * which tab is expected to move, so specs match the group rather than pin a
 * destination. Only "sends the app root to the tab a session opens on" in
 * auth.spec.ts pins the exact target.
 */
export const APP_TAB_URL = /\/(now|library|settings)$/;

/** A never-before-seen address, so parallel workers can never collide on one account. */
export function uniqueEmail(label: string) {
  return `${label}-${randomUUID()}@underscore.test`;
}

export type Account = { email: string; password: string };

/** Shared by every account `createShelf` mints; all of them are throwaway. */
export const TEST_ACCOUNT_PASSWORD = "test-account-password-1234";

export type SavedPlaylist = { id: string; book: FixtureBook };

/** Oldest first, in the order they were scored — the bookshelf serves the reverse. */
export type Shelf = Account & { playlists: SavedPlaylist[] };

/** Generation is thirty catalogue lookups; well inside this, but not inside the 30s default. */
const GENERATE_TIMEOUT_MS = 120_000;

/**
 * An account with `books` already scored, built over HTTP rather than through the UI.
 *
 * The library home only gets interesting at four or five saved playlists, and each one
 * through the flow is three navigations and a generation. Nothing is stubbed to get
 * here: these are real requests to the real API, answered by the same upstream fixtures
 * the browser's requests would reach, so the rows under test are rows the product wrote.
 */
export async function createShelf(label: string, books: FixtureBook[]): Promise<Shelf> {
  const account: Account = { email: uniqueEmail(label), password: TEST_ACCOUNT_PASSWORD };
  // Its own cookie jar, held only for this setup and disposed below.
  const api = await request.newContext({ baseURL: E2E_API_URL });

  try {
    const signUp = await api.post("/api/auth/sign-up/email", {
      data: { ...account, name: "Shelf Owner" },
    });
    if (!signUp.ok()) {
      throw new Error(`Sign-up failed for ${account.email}: ${await signUp.text()}`);
    }

    const playlists: SavedPlaylist[] = [];
    // One at a time: `createdAt` is what orders the shelf, and the specs assert on it.
    for (const book of books) {
      const response = await api.post("/api/playlists/generate", {
        data: { googleBooksId: book.googleBooksId },
        timeout: GENERATE_TIMEOUT_MS,
      });
      if (!response.ok()) {
        throw new Error(`Scoring "${book.title}" failed: ${await response.text()}`);
      }

      const playlist = PlaylistSchema.parse(await response.json());
      playlists.push({ id: playlist.id, book });
    }

    return { ...account, playlists };
  } finally {
    await api.dispose();
  }
}

/**
 * What the stack should call a playlist for `book`: the title the fixture's Claude
 * returns, or — for a book that deliberately has none — the fallback `shared` builds
 * from the mood and pacing. Derived rather than written down, so neither half can be
 * asserted against a stale copy of itself.
 */
export function expectedPlaylistName(book: FixtureBook): string {
  return (
    book.playlistName ??
    defaultPlaylistName({
      genre: [book.genre],
      mood: book.analysis.mood,
      pacing: book.analysis.pacing,
      summary: book.analysis.summary,
    })
  );
}

export async function fillLoginForm(page: Page, email: string, password: string) {
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
}

/**
 * The assertion to use after any successful sign-in or sign-up. Anchored on the tab
 * bar, which renders on every signed-in route and only on those, rather than on a
 * screen's copy — the tabs are still being built and their headings will churn.
 */
export async function expectSignedInApp(page: Page) {
  await expect(page).toHaveURL(APP_TAB_URL);
  await expect(page.getByRole("tab", { name: "Library" })).toBeVisible();
}

/** Signs in as `account` and waits for the app to be on screen. */
export async function logIn(page: Page, account: Account) {
  await page.goto("/login");
  await fillLoginForm(page, account.email, account.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expectSignedInApp(page);
}

/** Signs in as the seeded user and waits for the app to be on screen. */
export async function logInAsSeededUser(page: Page) {
  await logIn(page, SEEDED_USER);
}

/**
 * Types a term into the library home's search field.
 *
 * Located by role rather than by its placeholder: the placeholder is a full sentence of
 * marketing copy, and the library screen carries the only text field in the signed-in
 * app, so `textbox` is both stabler and unambiguous. One line to change to
 * `getByTestId("library-search")` if the field ever gains a `testID`.
 */
export async function searchLibrary(page: Page, term: string) {
  await page.getByRole("textbox").fill(term);
}

/** Signs out from the Settings tab, where the design puts the control. */
export async function signOut(page: Page) {
  await page.getByRole("tab", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/settings$/);

  await page.getByRole("button", { name: "Sign out" }).click();
}

/**
 * Signs out and walks back to the login form. Signing out lands on `/splash` — the
 * signed-out group's fallback — so the round trip goes via the splash's own CTA.
 */
export async function signOutToLogin(page: Page) {
  await signOut(page);
  await expect(page.getByText(SPLASH_TAGLINE)).toBeVisible();

  await page.getByRole("button", { name: "I already have an account" }).click();
  await expect(page.getByText("Welcome back.")).toBeVisible();
}
