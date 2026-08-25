import { expect, test } from "@playwright/test";

import { SPLASH_TAGLINE } from "./helpers";

/**
 * Onboarding: the splash's `Get started →` path — three how-it-works pages, then
 * the connect-music screen — ending at the sign-up form.
 *
 * This is the only route a new user has to sign-up. auth.spec.ts reaches
 * `/sign-up` directly by URL, deliberately, so that nothing about the form's own
 * coverage depends on the flow in front of it; the cost is that nothing there
 * would notice if the path to the form broke. That is what this file guards.
 *
 * Every test starts at `/splash`. Both onboarding screens redirect a direct
 * arrival straight back there — they treat "nothing to go back to" as proof the
 * flow was not entered from its start — so a `goto` into the middle of the flow
 * tests the guard rather than the screen. The guard has its own tests below.
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
      // The pager keeps all three pages mounted side by side, so which one is on
      // screen is not something text visibility can answer — an off-screen page
      // inside a scroll container still has a box and still counts as visible.
      // The CTA is the signal instead: `Next →` until the last page, then
      // `Connect music →` (app/src/app/how-it-works.tsx).
      //
      // Scrolled to rather than clicked through, because that is the gesture the
      // screen is built around — react-native-web pages it with CSS scroll snap
      // — and because `Next →` animates the scroll, so two clicks in a row race
      // the page index that the second one reads.
      await page.getByText("Press play.").scrollIntoViewIfNeeded();

      const finish = page.getByRole("button", { name: "Connect music →" });
      await expect(finish).toBeVisible();
      await finish.click();

      await expect(page).toHaveURL(/\/connect-music$/);
      await expect(page.getByText(CONNECT_HEADING)).toBeVisible();
    });

    test("'Skip' leaves how-it-works for connect music", async ({ page }) => {
      // The eyebrow-and-Skip header sits inside the pager, so it repeats once per
      // page and three Skips exist at once. `.first()` is the one on the page the
      // user arrived on — not a way to quiet an ambiguous match.
      await page.getByRole("button", { name: "Skip" }).first().click();

      await expect(page).toHaveURL(/\/connect-music$/);
      await expect(page.getByText(CONNECT_HEADING)).toBeVisible();
    });

    test("'Connect later' ends onboarding at the sign-up form", async ({ page }) => {
      await page.getByRole("button", { name: "Skip" }).first().click();
      await expect(page.getByText(CONNECT_HEADING)).toBeVisible();

      await page.getByRole("button", { name: "Connect later" }).click();

      await expect(page).toHaveURL(/\/sign-up$/);
      // The connect screen stays mounted underneath the pushed form, so this
      // asserts on something only sign-up renders.
      await expect(page.getByPlaceholder("Name")).toBeVisible();
    });
  });

  test.describe("arriving directly", () => {
    // Every file under app/ is an addressable route, so a reload, a restored URL
    // or a deep link can open either onboarding screen out of sequence. Both send
    // that arrival back to the splash rather than opening onboarding halfway
    // through, with no way back.

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
