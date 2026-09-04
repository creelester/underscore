import { expect, test } from "@playwright/test";

import { SPLASH_TAGLINE } from "./helpers";

/**
 * Onboarding: the splash's `Get started →` path — three how-it-works pages, then the
 * connect-music screen — ending at the sign-up form. auth.spec.ts reaches `/sign-up`
 * by URL so the form's coverage does not depend on the flow; this file guards the flow.
 *
 * Every test starts at `/splash`, because both onboarding screens send a direct
 * arrival back there — a `goto` into the middle tests the guard, not the screen.
 */

/** Copy only the connect screen renders, so it identifies that screen on its own. */
const CONNECT_HEADING = "Connect your favorite streaming platform";

test.describe("onboarding", () => {
  test.describe("walking the flow", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/splash");
      await page.getByRole("button", { name: "Get started →" }).click();
      await expect(page).toHaveURL(/\/how-it-works$/);
      await expect(page.getByRole("button", { name: "Next →" })).toBeVisible();
    });

    test("reaching the last page turns the CTA into 'Connect music'", async ({ page }) => {
      // All three pages stay mounted, and an off-screen one still counts as visible, so
      // the CTA is the signal instead. Scrolled rather than clicked: that is the gesture
      // the screen is built around, and `Next →` animates, so two clicks race.
      await page.getByText("Press play.").scrollIntoViewIfNeeded();

      const finish = page.getByRole("button", { name: "Connect music →" });
      await expect(finish).toBeVisible();
      await finish.click();

      await expect(page).toHaveURL(/\/connect-music$/);
      await expect(page.getByText(CONNECT_HEADING)).toBeVisible();
    });

    test("'Skip' leaves how-it-works for connect music", async ({ page }) => {
      // The header sits inside the pager, so three Skips exist at once; `.first()` is
      // the one on the arrival page, not a way to quiet an ambiguous match.
      await page.getByRole("button", { name: "Skip" }).first().click();

      await expect(page).toHaveURL(/\/connect-music$/);
      await expect(page.getByText(CONNECT_HEADING)).toBeVisible();
    });

    test("'Connect later' ends onboarding at the sign-up form", async ({ page }) => {
      await page.getByRole("button", { name: "Skip" }).first().click();
      await expect(page.getByText(CONNECT_HEADING)).toBeVisible();

      await page.getByRole("button", { name: "Connect later" }).click();

      await expect(page).toHaveURL(/\/sign-up$/);
      // The connect screen stays mounted underneath, so assert on sign-up's own copy.
      await expect(page.getByPlaceholder("Name")).toBeVisible();
    });
  });

  test.describe("arriving directly", () => {
    // Every file under app/ is addressable, so a reload or deep link can open either
    // screen out of sequence. Both send that arrival back to the splash.

    test("sends a direct arrival at how-it-works back to the splash", async ({ page }) => {
      await page.goto("/how-it-works");

      await expect(page).toHaveURL(/\/splash$/);
      await expect(page.getByText(SPLASH_TAGLINE)).toBeVisible();
    });

    test("sends a direct arrival at connect-music back to the splash", async ({ page }) => {
      await page.goto("/connect-music");

      await expect(page).toHaveURL(/\/splash$/);
      await expect(page.getByText(SPLASH_TAGLINE)).toBeVisible();
    });
  });
});
