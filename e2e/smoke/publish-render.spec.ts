/**
 * Smoke test 1 — PUBLISH → RENDER
 *
 * Verifies the core promise: a published package is visible on the agency
 * storefront AND its detail page renders real content. If this breaks,
 * every agency demo is dead.
 *
 * The test packages are created by globalSetup (no UI publish flow needed
 * here — the regression risk is in the render path, not the publish API).
 */
import { test, expect } from "@playwright/test";
import { smokeState } from "../helpers";

test.describe("Publish → Render", () => {
  test("storefront shows EN package destination and price", async ({ page }) => {
    const { SMOKE_AGENCY_SLUG } = smokeState();

    await page.goto(`/${SMOKE_AGENCY_SLUG}?language=en`);
    await page.waitForLoadState("domcontentloaded");

    // Content assertions drive the wait — no networkidle (analytics keep sockets open)
    await expect(page.getByText("Smoke Test Maldives")).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText("1,999").first()).toBeVisible({ timeout: 5_000 });
  });

  test("package detail page renders content, not unavailable screen", async ({
    page,
  }) => {
    const { SMOKE_AGENCY_SLUG, SMOKE_EN_PKG_ID } = smokeState();

    await page.goto(`/${SMOKE_AGENCY_SLUG}/${SMOKE_EN_PKG_ID}`);
    await page.waitForLoadState("domcontentloaded");

    // The package is active — the unavailable screen must NOT appear
    await expect(page.getByTestId("pkg-unavailable")).not.toBeVisible();

    // The template wrapper must be present and show the destination
    await expect(page.getByTestId("pkg-page")).toBeVisible({ timeout: 20_000 });
    // Use .first() — templates render destination in multiple elements (hero + caption)
    await expect(page.getByText("Smoke Test Maldives").first()).toBeVisible({
      timeout: 10_000,
    });
  });
});
