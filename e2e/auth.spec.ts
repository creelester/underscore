import { expect, test } from "@playwright/test";

import {
  NEW_USER_PASSWORD,
  SEEDED_USER,
  SPLASH_TAGLINE,
  expectSignedInApp,
  fillLoginForm,
  logInAsSeededUser,
  signOut,
  signOutToLogin,
  uniqueEmail,
} from "./helpers";

/**
 * Authentication: email/password sign-up, login, logout, and the route guards in
 * app/src/app/_layout.tsx.
 *
 * The seeded account is reseeded once per run and workers run in parallel, so tests
 * only read it; anything that creates an account uses `uniqueEmail()`. Forms are
 * reached directly by URL — the walk to them is onboarding.spec.ts's job.
 *
 * Social sign-in is deliberately uncovered: it leaves localhost for Google's and
 * Spotify's consent screens.
 */

test.describe("logging in", () => {
  test("signs in with the seeded account and lands on the app", async ({ page }) => {
    await page.goto("/login");
    await fillLoginForm(page, SEEDED_USER.email, SEEDED_USER.password);
    await page.getByRole("button", { name: "Log in" }).click();

    await expectSignedInApp(page);
  });

  test("matches the account whatever the email casing", async ({ page }) => {
    await page.goto("/login");
    await fillLoginForm(page, SEEDED_USER.email.toUpperCase(), SEEDED_USER.password);
    await page.getByRole("button", { name: "Log in" }).click();

    await expectSignedInApp(page);
  });

  test("matches the account when the email is padded with whitespace", async ({ page }) => {
    await page.goto("/login");
    await fillLoginForm(page, `  ${SEEDED_USER.email}  `, SEEDED_USER.password);
    await page.getByRole("button", { name: "Log in" }).click();

    // loginSchema trims the email; Better Auth lowercases but never trims. Chromium
    // also sanitizes input[type=email], so the padding is gone before zod runs — this
    // pins the user-visible behaviour, not the schema's `.trim()`.
    await expectSignedInApp(page);
  });

  test("reports a whitespace-only email as missing, not malformed", async ({ page }) => {
    await page.goto("/login");
    await fillLoginForm(page, "   ", SEEDED_USER.password);
    await page.getByRole("button", { name: "Log in" }).click();

    // `.trim()` runs before `.min(1)`, so blank-but-not-empty is "required". On web the
    // browser's sanitization gives the same message either way, so this pins wording.
    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.getByText("Enter a valid email")).toBeHidden();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("rejects a wrong password and stays on the login screen", async ({ page }) => {
    await page.goto("/login");
    await fillLoginForm(page, SEEDED_USER.email, "not-the-right-password");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("gives an unknown email the same error as a wrong password", async ({ page }) => {
    await page.goto("/login");
    await fillLoginForm(page, uniqueEmail("no-such-account"), "some-password-1234");
    await page.getByRole("button", { name: "Log in" }).click();

    // Identical wording for both cases: it must not leak whether the address exists.
    await expect(page.getByText("Invalid email or password")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("asks for both fields when the form is submitted empty", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByText("Email is required")).toBeVisible();
    await expect(page.getByText("Password is required")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("reports a malformed email", async ({ page }) => {
    await page.goto("/login");
    await fillLoginForm(page, "not-an-email", SEEDED_USER.password);
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByText("Enter a valid email")).toBeVisible();
    await expect(page).toHaveURL(/\/login$/);
  });

  test("replaces a failed-login error with the next submit's validation error", async ({ page }) => {
    await page.goto("/login");
    await fillLoginForm(page, SEEDED_USER.email, "not-the-right-password");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();

    await page.getByPlaceholder("Password").fill("");
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByText("Password is required")).toBeVisible();
    await expect(page.getByText("Invalid email or password")).toBeHidden();
  });

  test("disables the submit button while the request is in flight", async ({ page }) => {
    // Hold the response open so the in-flight state can be asserted without racing it.
    let releaseSignIn = () => {};
    const signInHeld = new Promise<void>((resolve) => {
      releaseSignIn = resolve;
    });
    await page.route("**/api/auth/sign-in/email", async (route) => {
      await signInHeld;
      await route.continue();
    });

    await page.goto("/login");
    await fillLoginForm(page, SEEDED_USER.email, SEEDED_USER.password);
    const submit = page.getByRole("button", { name: "Log in" });
    await submit.click();

    await expect(submit).toBeDisabled();

    releaseSignIn();
    await expectSignedInApp(page);
  });
});

test.describe("signing up", () => {
  test("creates an account and lands on the app", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByPlaceholder("Name").fill("New Reader");
    await page.getByPlaceholder("Email").fill(uniqueEmail("sign-up"));
    await page.getByPlaceholder("Password").fill(NEW_USER_PASSWORD);
    await page.getByRole("button", { name: "Sign up" }).click();

    await expectSignedInApp(page);
  });

  test("a new account can sign out and sign back in", async ({ page }) => {
    const email = uniqueEmail("round-trip");

    await page.goto("/sign-up");
    await page.getByPlaceholder("Name").fill("Round Trip");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password").fill(NEW_USER_PASSWORD);
    await page.getByRole("button", { name: "Sign up" }).click();
    await expectSignedInApp(page);

    await signOutToLogin(page);

    await fillLoginForm(page, email, NEW_USER_PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await expectSignedInApp(page);
  });

  test("creates the account under the trimmed address when the email is padded", async ({
    page,
  }) => {
    const email = uniqueEmail("padded-sign-up");

    await page.goto("/sign-up");
    await page.getByPlaceholder("Name").fill("Padded Email");
    await page.getByPlaceholder("Email").fill(`  ${email}  `);
    await page.getByPlaceholder("Password").fill(NEW_USER_PASSWORD);
    await page.getByRole("button", { name: "Sign up" }).click();
    await expectSignedInApp(page);

    // Logging back in bare proves the padding never reached the server. As above, the
    // browser strips it too, so this cannot fail alone if `.trim()` is dropped.
    await signOutToLogin(page);

    await fillLoginForm(page, email, NEW_USER_PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await expectSignedInApp(page);
  });

  test("keeps whitespace in the password, which is never trimmed", async ({ page }) => {
    const email = uniqueEmail("padded-password");
    const paddedPassword = `  ${NEW_USER_PASSWORD}  `;

    await page.goto("/sign-up");
    await page.getByPlaceholder("Name").fill("Padded Password");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password").fill(paddedPassword);
    await page.getByRole("button", { name: "Sign up" }).click();
    await expectSignedInApp(page);

    await signOutToLogin(page);

    // Only the email is trimmed — padding can be part of a real password.
    await fillLoginForm(page, email, NEW_USER_PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Invalid email or password")).toBeVisible();

    await fillLoginForm(page, email, paddedPassword);
    await page.getByRole("button", { name: "Log in" }).click();
    await expectSignedInApp(page);
  });

  test("refuses an email that already has an account", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByPlaceholder("Name").fill("Impostor");
    await page.getByPlaceholder("Email").fill(SEEDED_USER.email);
    await page.getByPlaceholder("Password").fill(NEW_USER_PASSWORD);
    await page.getByRole("button", { name: "Sign up" }).click();

    await expect(page.getByText("User already exists. Use another email.")).toBeVisible();
    await expect(page).toHaveURL(/\/sign-up$/);
  });

  test("asks for every field when the form is submitted empty", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByRole("button", { name: "Sign up" }).click();

    await expect(page.getByText("Name is required")).toBeVisible();
    await expect(page.getByText("Email is required")).toBeVisible();
    // Sign-up replaces "Password is required" with its length rule.
    await expect(page.getByText("Use at least 8 characters")).toBeVisible();
    await expect(page).toHaveURL(/\/sign-up$/);
  });

  test("rejects a password shorter than eight characters", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByPlaceholder("Name").fill("Short Password");
    await page.getByPlaceholder("Email").fill(uniqueEmail("short-password"));
    await page.getByPlaceholder("Password").fill("short");
    await page.getByRole("button", { name: "Sign up" }).click();

    await expect(page.getByText("Use at least 8 characters")).toBeVisible();
    await expect(page).toHaveURL(/\/sign-up$/);
  });

  test("reports a malformed email", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByPlaceholder("Name").fill("Bad Email");
    await page.getByPlaceholder("Email").fill("not-an-email");
    await page.getByPlaceholder("Password").fill(NEW_USER_PASSWORD);
    await page.getByRole("button", { name: "Sign up" }).click();

    await expect(page.getByText("Enter a valid email")).toBeVisible();
    await expect(page).toHaveURL(/\/sign-up$/);
  });
});

test.describe("session and route guards", () => {
  test("sends an unauthenticated visitor from the app to the splash screen", async ({ page }) => {
    await page.goto("/");

    // `splash` is registered first in the signed-out group, so it is that group's
    // fallback — an unauthenticated visitor settles there, not on the form.
    await expect(page).toHaveURL(/\/splash$/);
    await expect(page.getByText(SPLASH_TAGLINE)).toBeVisible();
  });

  test("sends the app root to the tab a session opens on", async ({ page }) => {
    await logInAsSeededUser(page);

    await page.goto("/");

    // The one place the landing tab is pinned. `/` redirects to Library rather than the
    // handoff's tab 0 (Now), which has nothing to show until a book is scored. Every
    // other test asserts only that some tab was reached.
    await expect(page).toHaveURL(/\/library$/);
    await expect(page.getByRole("tab", { name: "Library" })).toBeVisible();
  });

  test("keeps the session across a page reload", async ({ page }) => {
    await logInAsSeededUser(page);

    await page.reload();

    await expectSignedInApp(page);
  });

  test("sends a signed-in visitor away from the login screen", async ({ page }) => {
    await logInAsSeededUser(page);

    await page.goto("/login");

    await expectSignedInApp(page);
  });

  test("sends a signed-in visitor away from the sign-up screen", async ({ page }) => {
    await logInAsSeededUser(page);

    await page.goto("/sign-up");

    await expectSignedInApp(page);
  });

  test("signing out returns to the splash screen and survives a reload", async ({ page }) => {
    await logInAsSeededUser(page);

    await signOut(page);
    await expect(page).toHaveURL(/\/splash$/);
    await expect(page.getByText(SPLASH_TAGLINE)).toBeVisible();

    // A reload proves the session was cleared, not just navigated away from.
    await page.reload();
    await expect(page).toHaveURL(/\/splash$/);
    await expect(page.getByText(SPLASH_TAGLINE)).toBeVisible();
  });
});

test.describe("moving between the two forms", () => {
  test("login links to sign-up", async ({ page }) => {
    await page.goto("/login");

    await page.getByRole("link", { name: "Don't have an account? Sign up" }).click();

    await expect(page).toHaveURL(/\/sign-up$/);
    await expect(page.getByPlaceholder("Name")).toBeVisible();
  });

  test("sign-up links back to login", async ({ page }) => {
    await page.goto("/sign-up");

    await page.getByRole("link", { name: "Already have an account? Log in" }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Welcome back.")).toBeVisible();
  });
});
