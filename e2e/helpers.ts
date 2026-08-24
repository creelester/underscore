import { randomUUID } from "node:crypto";

import { expect, type Page } from "@playwright/test";

/**
 * Fixtures shared by the specs that cross the auth boundary (auth.spec.ts,
 * splash.spec.ts).
 *
 * This file is deliberately not a `*.spec.ts`: Playwright's default testMatch only
 * collects those, so nothing here is picked up as a suite of its own.
 */

/**
 * Reseeded once per *run* by server/prisma/seed.ts (SEED_USER_* in
 * playwright.config.ts), not once per test, and workers run in parallel — so tests
 * only ever *read* this account. Anything that mutates uses `uniqueEmail()`.
 */
export const SEEDED_USER = {
  email: "e2e@underscore.test",
  password: "e2e-password-1234",
} as const;

export const NEW_USER_PASSWORD = "new-user-password-1234";

/**
 * Copy that only the splash screen renders, so it identifies that screen on its own —
 * unlike the lockup, which the boot overlay also draws (see splash.spec.ts).
 */
export const SPLASH_TAGLINE = "a soundtrack to all your stories";

/**
 * Where a signed-in session settles.
 *
 * `/` is never a URL the user rests on: app/src/app/(app)/index.tsx is a
 * `<Redirect>` onto one of the three tabs, which keeps `/now`, `/library` and
 * `/profile` honest instead of one of them answering to `/`. *Which* tab is a
 * product decision that is expected to move — Library today because Now has
 * nothing to show until a book has been scored — so the specs match the tab
 * group rather than pin a destination in twenty places. The exact target has one
 * test of its own, "sends the app root to the tab a session opens on" in
 * auth.spec.ts; that is the test to update when the landing tab changes.
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
 * The signal that a session exists and the app itself is on screen — what every
 * assertion after a successful sign-in or sign-up should use.
 *
 * The anchor is the tab bar (app/src/app/(app)/(tabs)/_layout.tsx), deliberately
 * not any one screen's copy. The bar renders on every signed-in route and only
 * on signed-in routes, so seeing it means both halves of the claim; the tabs
 * underneath it are still being built and their headings will churn.
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

/**
 * Signs out, from the Profile tab where the design puts the control.
 *
 * There is no sign-out on the landing screen any more — the old placeholder home
 * that carried one is gone, so reaching it is a tab switch first.
 */
export async function signOut(page: Page) {
  await page.getByRole("tab", { name: "Profile" }).click();
  await expect(page).toHaveURL(/\/profile$/);

  await page.getByRole("button", { name: "Sign out" }).click();
}

/**
 * Signs out and walks back to the login form.
 *
 * Signing out lands on `/splash`, the first screen in the signed-out group in
 * app/src/app/_layout.tsx and therefore its fallback — not on `/login`. A sign-out /
 * sign-in round trip has to go through the splash's own CTA to reach the form.
 */
export async function signOutToLogin(page: Page) {
  await signOut(page);
  await expect(page.getByText(SPLASH_TAGLINE)).toBeVisible();

  await page.getByRole("button", { name: "I already have an account" }).click();
  await expect(page.getByText("Welcome back.")).toBeVisible();
}
