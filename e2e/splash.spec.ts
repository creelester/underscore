import { expect, test } from "@playwright/test";

import { SPLASH_TAGLINE, expectSignedInApp, logInAsSeededUser } from "./helpers";

/**
 * The splash screen: where signed-out visitors land, and the two CTAs that lead off
 * it.
 *
 * `splash` is registered first in the signed-out group in app/src/app/_layout.tsx,
 * which makes it that group's fallback — reordering those screens would silently send
 * `/` and every sign-out somewhere else, so the landing assertions below are the guard
 * on that ordering.
 *
 * Nothing here asserts on colour: the app follows the device colour scheme, and
 * Playwright's default (`colorScheme: "light"`) is not the app's own default, so a
 * theme-dependent assertion would pin the harness rather than the product.
 */

test.describe("the splash screen", () => {
  test("is where a signed-out visitor lands from the app root", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/splash$/);
    await expect(page.getByText(SPLASH_TAGLINE)).toBeVisible();
  });

  test("shows the logo lockup and the tagline", async ({ page }) => {
    await page.goto("/splash");

    // The tagline first: it is the one thing only this screen renders, so seeing it
    // means the screen itself is mounted rather than just the boot overlay.
    await expect(page.getByText(SPLASH_TAGLINE)).toBeVisible();

    // The lockup ships as an inline `<svg>`, so it takes role `img`; its accessible
    // name is the `accessibilityLabel` LogoLockup sets, which react-native-svg renders
    // as `aria-label`. (The artwork's own `<title>` does not survive the export —
    // SVGO's `removeTitle` runs as part of react-native-svg-transformer's preset.)
    //
    // The boot overlay (app/src/components/splash-overlay.tsx) draws the same lockup
    // over the whole viewport until it fades out, so for about half a second there are
    // two. Waiting for the count to settle is what keeps the strict-mode locator from
    // resolving to both — a strict violation fails an assertion outright, it is not
    // retried away.
    const lockup = page.getByRole("img", { name: "Under Score" });
    await expect(lockup).toHaveCount(1);
    await expect(lockup).toBeVisible();
  });

  test("sends 'Get started' into the how-it-works flow", async ({ page }) => {
    await page.goto("/splash");

    await page.getByRole("button", { name: "Get started →" }).click();

    // `Get started →` opens onboarding, not the sign-up form: sign-up is the far
    // end of that flow, two screens later (app/src/app/splash.tsx). `I already
    // have an account`, below, is the CTA that skips onboarding. The walk from
    // here through to sign-up is onboarding.spec.ts.
    await expect(page).toHaveURL(/\/how-it-works$/);
    // The splash stays mounted underneath the pushed screen, so this asserts on
    // something only how-it-works renders.
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
