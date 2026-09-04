import { randomUUID } from "node:crypto";

import { expect, type Page } from "@playwright/test";

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
export const APP_TAB_URL = /\/(now|library|profile)$/;

/** A never-before-seen address, so parallel workers can never collide on one account. */
export function uniqueEmail(label: string) {
  return `${label}-${randomUUID()}@underscore.test`;
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

/** Signs in as the seeded user and waits for the app to be on screen. */
export async function logInAsSeededUser(page: Page) {
  await page.goto("/login");
  await fillLoginForm(page, SEEDED_USER.email, SEEDED_USER.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expectSignedInApp(page);
}

/** Signs out from the Profile tab, where the design puts the control. */
export async function signOut(page: Page) {
  await page.getByRole("tab", { name: "Profile" }).click();
  await expect(page).toHaveURL(/\/profile$/);

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
