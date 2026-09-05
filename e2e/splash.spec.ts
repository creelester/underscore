import { expect, test } from "@playwright/test";

import { SPLASH_TAGLINE, expectSignedInApp, logInAsSeededUser } from "./helpers";

/**
 * The splash screen: where signed-out visitors land, and the two CTAs off it. It is
 * registered first in the signed-out group, making it that group's fallback —
 * reordering would silently move `/` and every sign-out, which the landing assertions
 * guard.
 *
 * Nothing asserts on colour: Playwright's `colorScheme: "light"` default is not the
 * app's, so a theme assertion would pin the harness rather than the product.
 */

test.describe("the splash screen", () => {
  test("is where a signed-out visitor lands from the app root", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/splash$/);
    await expect(page.getByText(SPLASH_TAGLINE)).toBeVisible();
  });

  test("shows the logo lockup and the tagline", async ({ page }) => {
    await page.goto("/splash");

    // Only this screen renders the tagline, so it proves the screen and not the overlay.
    await expect(page.getByText(SPLASH_TAGLINE)).toBeVisible();

    // Inline `<svg>`, so role `img` named by LogoLockup's `accessibilityLabel` — the
    // artwork's own `<title>` is stripped by SVGO in the svg-transformer preset.
    //
    // The boot overlay draws the same lockup, so for ~half a second there are two.
    // Waiting for the count to settle keeps the strict-mode locator off both; a strict
    // violation fails outright rather than being retried.
    const lockup = page.getByRole("img", { name: "Under Score" });
    await expect(lockup).toHaveCount(1);
    await expect(lockup).toBeVisible();
  });

  test("sends 'Get started' into the how-it-works flow", async ({ page }) => {
    await page.goto("/splash");

    await page.getByRole("button", { name: "Get started →" }).click();

    // `Get started →` opens onboarding; sign-up is two screens further on. The walk
    // through to it is onboarding.spec.ts.
    await expect(page).toHaveURL(/\/how-it-works$/);
    // The splash stays mounted underneath, so assert on how-it-works' own copy.
    await expect(page.getByRole("button", { name: "Next →" })).toBeVisible();
  });

  test("sends 'I already have an account' to the login form", async ({ page }) => {
    await page.goto("/splash");

    await page.getByRole("button", { name: "I already have an account" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Welcome back.")).toBeVisible();
  });

  test("sends a signed-in visitor away from the splash", async ({ page }) => {
    await logInAsSeededUser(page);

    await page.goto("/splash");

    await expectSignedInApp(page);
  });
});
