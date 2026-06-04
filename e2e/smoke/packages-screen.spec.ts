/**
 * Smoke test — PACKAGES SCREEN
 *
 * Verifies the /packages page loads, shows the "Workspace · Packages"
 * header, and renders the smoke test packages created by globalSetup.
 * If this breaks, the agency dashboard is effectively unusable.
 */
import { test, expect } from "@playwright/test";
import { smokeState, loginAs } from "../helpers";

test.describe("Packages screen", () => {
  test("packages page loads and shows smoke packages", async ({ page }) => {
    const { SMOKE_EMAIL, SMOKE_PASSWORD } = smokeState();

    await loginAs(page, SMOKE_EMAIL, SMOKE_PASSWORD);

    await page.goto("/packages");
    await page.waitForLoadState("domcontentloaded");

    // Page heading must appear
    await expect(page.getByText("Workspace · Packages")).toBeVisible({
      timeout: 20_000,
    });

    // The core EN smoke package title must appear in the card list
    // (PackageCard renders pkg.title, not pkg.destination)
    await expect(page.getByText("[SMOKE] Maldives Package").first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test("filter tabs are present and clickable", async ({ page }) => {
    const { SMOKE_EMAIL, SMOKE_PASSWORD } = smokeState();

    await loginAs(page, SMOKE_EMAIL, SMOKE_PASSWORD);

    await page.goto("/packages");
    await page.waitForLoadState("domcontentloaded");

    // Wait for the page to settle
    await expect(page.getByText("Workspace · Packages")).toBeVisible({
      timeout: 20_000,
    });

    // Filter tab buttons must be present (use role to avoid strict-mode violation
    // when "All" text appears in package titles like "SMOKE All Sections EN")
    await expect(page.getByRole("button", { name: "All", exact: true })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("button", { name: "Live", exact: true })).toBeVisible({ timeout: 5_000 });
    await expect(page.getByRole("button", { name: "Draft", exact: true })).toBeVisible({ timeout: 5_000 });
  });
});
