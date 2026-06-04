/**
 * Smoke test — ALL TEMPLATES (EN + AR)
 *
 * For every template (aurora, voyage, pulse, sakina, petal, compass, atlas,
 * tribe, smart, family) we verify that:
 *   - The pkg-page wrapper renders (template loaded, no crash)
 *   - The unavailable screen is NOT shown
 *   - The destination text is visible in the hero / caption
 *
 * Each template has a dedicated package created by globalSetup so we
 * navigate directly to the package detail page — no storefront hop needed.
 */
import { test, expect } from "@playwright/test";
import { smokeState } from "../helpers";

const TEMPLATES = [
  "aurora", "voyage", "pulse", "sakina", "petal",
  "compass", "atlas", "tribe", "smart", "family",
] as const;

test.describe("Template rendering — EN", () => {
  for (const tpl of TEMPLATES) {
    test(`${tpl} renders EN package without crashing`, async ({ page }) => {
      const { SMOKE_AGENCY_SLUG, SMOKE_TEMPLATE_PKGS_EN } = smokeState();
      const pkgId = SMOKE_TEMPLATE_PKGS_EN[tpl];

      await page.goto(`/${SMOKE_AGENCY_SLUG}/${pkgId}`);
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByTestId("pkg-unavailable")).not.toBeVisible();
      await expect(page.getByTestId("pkg-page")).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(`SMOKE ${tpl} EN`).first()).toBeVisible({ timeout: 10_000 });
    });
  }
});

test.describe("Template rendering — AR", () => {
  for (const tpl of TEMPLATES) {
    test(`${tpl} renders AR package without crashing`, async ({ page }) => {
      const { SMOKE_AGENCY_SLUG, SMOKE_TEMPLATE_PKGS_AR } = smokeState();
      const pkgId = SMOKE_TEMPLATE_PKGS_AR[tpl];

      await page.goto(`/${SMOKE_AGENCY_SLUG}/${pkgId}`);
      await page.waitForLoadState("domcontentloaded");

      await expect(page.getByTestId("pkg-unavailable")).not.toBeVisible();
      await expect(page.getByTestId("pkg-page")).toBeVisible({ timeout: 20_000 });
      await expect(page.getByText(`دخان ${tpl} AR`).first()).toBeVisible({ timeout: 10_000 });
    });
  }
});
