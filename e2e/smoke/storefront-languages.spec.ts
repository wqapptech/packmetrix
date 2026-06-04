/**
 * Smoke test 4 — STOREFRONT EN + AR
 *
 * Loads the agency storefront in English and Arabic modes and verifies:
 *   EN: correct LTR direction + English package content visible
 *   AR: correct RTL direction + Arabic package content visible
 *
 * The ?language= query param is the fastest way to force a language without
 * touching profile settings. It overrides storefrontLanguage in the app.
 */
import { test, expect } from "@playwright/test";
import { smokeState } from "../helpers";

test.describe("Storefront EN + AR", () => {
  test("English storefront is LTR and shows EN package", async ({ page }) => {
    const { SMOKE_AGENCY_SLUG } = smokeState();

    await page.goto(`/${SMOKE_AGENCY_SLUG}?language=en`);
    await page.waitForLoadState("domcontentloaded");

    // The root storefront element must have dir="ltr"
    const root = page.locator("[dir='ltr']").first();
    await expect(root).toBeVisible({ timeout: 10_000 });

    // English package content must be present
    await expect(page.getByText("Smoke Test Maldives")).toBeVisible({
      timeout: 10_000,
    });
  });

  test("Arabic storefront is RTL and shows AR package", async ({ page }) => {
    const { SMOKE_AGENCY_SLUG } = smokeState();

    await page.goto(`/${SMOKE_AGENCY_SLUG}?language=ar`);
    await page.waitForLoadState("domcontentloaded");

    // The root storefront element must have dir="rtl"
    const root = page.locator("[dir='rtl']").first();
    await expect(root).toBeVisible({ timeout: 10_000 });

    // Arabic package destination must be present (not blank/error)
    await expect(page.getByText("المالديف اختبار")).toBeVisible({
      timeout: 10_000,
    });
  });
});
