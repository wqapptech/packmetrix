/**
 * Smoke test 2 — AUTH
 *
 * Verifies signup shows the verify-email step, bad passwords are rejected
 * with a visible error, and the pre-created test account can log in and
 * reach the builder.
 *
 * The signup sub-test creates a real Firebase Auth user (unavoidable for an
 * e2e test of signup). afterAll deletes it via firebase-admin so it doesn't
 * accumulate on staging.
 */
import { test, expect } from "@playwright/test";
import { smokeState } from "../helpers";

// Derive the signup email deterministically from the run's smoke email so
// teardown can find it by pattern even if afterAll is skipped.
function signupEmail(smokeEmail: string) {
  return smokeEmail.replace("smoke.", "smoke.signup.");
}

test.describe("Auth", () => {
  test("signup form submits and shows verify-email step", async ({ page }) => {
    const { SMOKE_EMAIL } = smokeState();
    const email = signupEmail(SMOKE_EMAIL);

    await page.goto("/signup");
    await page.getByTestId("signup-name").fill("Smoke Signup User");
    await page.getByTestId("signup-email").fill(email);
    await page.getByTestId("signup-password").fill("ValidPass_Smoke1!");
    await page.getByTestId("signup-confirm").fill("ValidPass_Smoke1!");
    await page.getByTestId("signup-submit").click();

    // After a successful signup the app shows the email-verification step,
    // NOT the dashboard (email must be verified first).
    await expect(page.getByTestId("signup-verify-step")).toBeVisible({
      timeout: 15_000,
    });
  });

  test("wrong password shows error message", async ({ page }) => {
    const { SMOKE_EMAIL } = smokeState();

    await page.goto("/login");
    await page.getByTestId("login-email").fill(SMOKE_EMAIL);
    await page.getByTestId("login-password").fill("definitely-wrong-password");
    await page.getByTestId("login-submit").click();

    await expect(page.getByTestId("login-error")).toBeVisible({
      timeout: 10_000,
    });
    // Must still be on the login page
    await expect(page).toHaveURL(/\/login/);
  });

  test("correct credentials reach the builder", async ({ page }) => {
    const { SMOKE_EMAIL, SMOKE_PASSWORD } = smokeState();

    await page.goto("/login");
    await page.getByTestId("login-email").fill(SMOKE_EMAIL);
    await page.getByTestId("login-password").fill(SMOKE_PASSWORD);
    await page.getByTestId("login-submit").click();

    await page.waitForURL("**/builder**", { timeout: 20_000 });
    await expect(page).toHaveURL(/\/builder/);
  });
});
