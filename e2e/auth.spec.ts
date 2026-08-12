import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

/**
 * Authentication: email/password sign-up, login, logout, and the route guards in
 * app/src/app/_layout.tsx.
 *
 * The seeded account is reseeded once per run (server/prisma/seed.ts, driven by
 * SEED_USER_EMAIL / SEED_USER_PASSWORD in playwright.config.ts), not once per
 * test, and workers run in parallel — so tests only ever *read* it. Anything that
 * creates an account uses `uniqueEmail()`.
 *
 * Social sign-in is deliberately uncovered: it would leave localhost for Google's
 * and Spotify's consent screens.
 */

const SEEDED_USER = {
  email: "e2e@underscore.test",
  password: "e2e-password-1234",
} as const;

const NEW_USER_PASSWORD = "new-user-password-1234";

/** A never-before-seen address, so parallel workers can never collide on one account. */
function uniqueEmail(label: string) {
  return `${label}-${randomUUID()}@underscore.test`;
}

async function fillLoginForm(page: Page, email: string, password: string) {
  await page.getByPlaceholder("Email").fill(email);
  await page.getByPlaceholder("Password").fill(password);
}

/** Signs in as the seeded user and waits for the app to be on screen. */
async function logInAsSeededUser(page: Page) {
  await page.goto("/login");
  await fillLoginForm(page, SEEDED_USER.email, SEEDED_USER.password);
  await page.getByRole("button", { name: "Log in" }).click();
  await expect(page.getByText("Signed in.")).toBeVisible();
}

test.describe("logging in", () => {
  test("signs in with the seeded account and lands on the app", async ({ page }) => {
    await page.goto("/login");
    await fillLoginForm(page, SEEDED_USER.email, SEEDED_USER.password);
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByText("Signed in.")).toBeVisible();
  });

  test("matches the account whatever the email casing", async ({ page }) => {
    await page.goto("/login");
    await fillLoginForm(page, SEEDED_USER.email.toUpperCase(), SEEDED_USER.password);
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page.getByText("Signed in.")).toBeVisible();
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

    // Identical wording for both cases is the point: it does not leak whether the
    // address has an account.
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
    // Hold the sign-in response open so the in-flight state can be asserted without
    // racing it, then release it and let the flow finish for real.
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
    await expect(page.getByText("Signed in.")).toBeVisible();
  });
});

test.describe("signing up", () => {
  test("creates an account and lands on the app", async ({ page }) => {
    await page.goto("/sign-up");
    await page.getByPlaceholder("Name").fill("New Reader");
    await page.getByPlaceholder("Email").fill(uniqueEmail("sign-up"));
    await page.getByPlaceholder("Password").fill(NEW_USER_PASSWORD);
    await page.getByRole("button", { name: "Sign up" }).click();

    await expect(page).toHaveURL("/");
    await expect(page.getByText("Signed in.")).toBeVisible();
  });

  test("a new account can sign out and sign back in", async ({ page }) => {
    const email = uniqueEmail("round-trip");

    await page.goto("/sign-up");
    await page.getByPlaceholder("Name").fill("Round Trip");
    await page.getByPlaceholder("Email").fill(email);
    await page.getByPlaceholder("Password").fill(NEW_USER_PASSWORD);
    await page.getByRole("button", { name: "Sign up" }).click();
    await expect(page.getByText("Signed in.")).toBeVisible();

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page.getByText("Welcome back.")).toBeVisible();

    await fillLoginForm(page, email, NEW_USER_PASSWORD);
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page.getByText("Signed in.")).toBeVisible();
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
    // The sign-up schema replaces the login schema's "Password is required" with
    // its own length rule, so an empty password reports the length message.
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
  test("sends an unauthenticated visitor from the app to the login screen", async ({ page }) => {
    await page.goto("/");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Welcome back.")).toBeVisible();
  });

  test("keeps the session across a page reload", async ({ page }) => {
    await logInAsSeededUser(page);

    await page.reload();

    await expect(page).toHaveURL("/");
    await expect(page.getByText("Signed in.")).toBeVisible();
  });

  test("sends a signed-in visitor away from the login screen", async ({ page }) => {
    await logInAsSeededUser(page);

    await page.goto("/login");

    await expect(page).toHaveURL("/");
    await expect(page.getByText("Signed in.")).toBeVisible();
  });

  test("sends a signed-in visitor away from the sign-up screen", async ({ page }) => {
    await logInAsSeededUser(page);

    await page.goto("/sign-up");

    await expect(page).toHaveURL("/");
    await expect(page.getByText("Signed in.")).toBeVisible();
  });

  test("signing out returns to login and survives a reload", async ({ page }) => {
    await logInAsSeededUser(page);

    await page.getByRole("button", { name: "Sign out" }).click();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Welcome back.")).toBeVisible();

    // A reload proves the session was actually cleared and not just navigated away from.
    await page.reload();
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("Welcome back.")).toBeVisible();
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
