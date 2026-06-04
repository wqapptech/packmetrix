/**
 * Smoke test — PROFILE / BRANDING SETTINGS
 *
 * Verifies that the profile page loads, accepts a name change, and
 * shows the saved confirmation. If this breaks, every agency's branding
 * update flow is dead.
 */
import { test, expect } from "@playwright/test";
import { smokeState, loginAs } from "../helpers";

test.describe("Profile / branding settings", () => {
  test("agency name change saves successfully", async ({ page }) => {
    const { SMOKE_EMAIL, SMOKE_PASSWORD } = smokeState();

    await loginAs(page, SMOKE_EMAIL, SMOKE_PASSWORD);

    // Navigate via the sidebar link (client-side Next.js routing) so the
    // Firebase Auth SDK is NOT re-initialised on a hard reload — a hard
    // goto("/profile") would cause onAuthStateChanged to fire null first,
    // triggering a redirect to /login before auth restores from IndexedDB.
    await page.getByRole("link", { name: "Profile" }).click();
    await page.waitForURL("**/profile**", { timeout: 10_000 });

    const nameInput = page.getByTestId("profile-name");
    await nameInput.waitFor({ state: "visible", timeout: 20_000 });

    // Change the agency name to something recognisable
    const newName = `SMOKE Agency ${Date.now().toString(36)}`;
    await nameInput.fill(newName);

    // Save button becomes enabled after a change — click it
    const saveBtn = page.getByTestId("profile-save");
    await saveBtn.click();

    // The button text transitions to "Saved" (with a check icon) on success
    await expect(saveBtn).toContainText("Saved", { timeout: 10_000 });
  });
});
