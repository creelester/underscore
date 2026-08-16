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

/** A never-before-seen address, so parallel workers can never collide on one account. */
export function uniqueEmail(label: string) {
  return `${label}-${randomUUID()}@underscore.test`;
}

export async function fillLoginForm(page: Page, email: string, password: string) {
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
}

/** Signs in as the seeded user and waits for the app to be on screen. */
export async function logInAsSeededUser(page: Page) {
  await page.goto("/login");
  await fillLoginForm(page, SEEDED_USER.email, SEEDED_USER.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Signed in.")).toBeVisible();
}

/**
 * Signs out and walks back to the login form.
 *
 * Signing out lands on `/splash`, the first screen in the signed-out group in
 * app/src/app/_layout.tsx and therefore its fallback — not on `/login`. A sign-out /
 * sign-in round trip has to go through the splash's own CTA to reach the form.
 */
export async function signOutToLogin(page: Page) {
  await page.getByRole("button", { name: "Sign out" }).click();
  await expect(page.getByText(SPLASH_TAGLINE)).toBeVisible();

  await page.getByRole("button", { name: "I already have an account" }).click();
  await expect(page.getByText("Welcome back.")).toBeVisible();
}
