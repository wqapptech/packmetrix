/**
 * Smoke test — WHATSAPP / MESSENGER CTA BUTTONS
 *
 * Verifies that every template's package landing page:
 *   1. Shows a visible WhatsApp booking CTA when pkg.whatsapp is set
 *   2. Calls window.open with the correct wa.me URL on click (EN spot-check)
 *   3. Shows a visible Messenger CTA when pkg.messenger is set (SharedCTABanner)
 *
 * Covered: all 10 templates × EN + AR = 20 visibility assertions.
 * URL correctness is verified once per language to avoid 20 window.open checks.
 */
import { test, expect } from "@playwright/test";
import { smokeState } from "../helpers";

const TEMPLATES = [
  "aurora", "voyage", "pulse", "sakina", "petal",
  "compass", "atlas", "tribe", "smart", "family",
] as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

import type { Page } from "@playwright/test";

/** Install a window.open interceptor that records URLs instead of opening tabs. */
async function interceptWindowOpen(page: Page) {
  await page.addInitScript(() => {
    (window as any).__openedUrls = [] as string[];
    const orig = window.open.bind(window);
    window.open = (url?: string | URL, ...rest: any[]) => {
      (window as any).__openedUrls.push(String(url ?? ""));
      return orig(url as string, ...rest);
    };
  });
}

async function lastOpenedUrl(page: Page): Promise<string> {
  const urls: string[] = await page.evaluate(() => (window as any).__openedUrls ?? []);
  return urls[urls.length - 1] ?? "";
}

// ── WhatsApp visibility — all templates × EN + AR ────────────────────────────

test.describe("WhatsApp CTA visibility — EN", () => {
  for (const tpl of TEMPLATES) {
    test(`${tpl} — WA button visible (EN)`, async ({ page }) => {
      const { SMOKE_AGENCY_SLUG, SMOKE_TEMPLATE_PKGS_EN } = smokeState();
      const pkgId = SMOKE_TEMPLATE_PKGS_EN[tpl];

      await page.goto(`/${SMOKE_AGENCY_SLUG}/${pkgId}`);
      await expect(page.getByTestId("pkg-page")).toBeVisible({ timeout: 20_000 });

      await expect(page.getByTestId("wa-cta").first()).toBeVisible({ timeout: 10_000 });
    });
  }
});

test.describe("WhatsApp CTA visibility — AR", () => {
  for (const tpl of TEMPLATES) {
    test(`${tpl} — WA button visible (AR)`, async ({ page }) => {
      const { SMOKE_AGENCY_SLUG, SMOKE_TEMPLATE_PKGS_AR } = smokeState();
      const pkgId = SMOKE_TEMPLATE_PKGS_AR[tpl];

      await page.goto(`/${SMOKE_AGENCY_SLUG}/${pkgId}`);
      await expect(page.getByTestId("pkg-page")).toBeVisible({ timeout: 20_000 });

      await expect(page.getByTestId("wa-cta").first()).toBeVisible({ timeout: 10_000 });
    });
  }
});

// ── WhatsApp URL correctness ─────────────────────────────────────────────────

test.describe("WhatsApp CTA — URL correctness", () => {
  test("EN click opens correct wa.me URL with phone number", async ({ page }) => {
    const { SMOKE_AGENCY_SLUG, SMOKE_TEMPLATE_PKGS_EN } = smokeState();
    // aurora is the default; use it as the representative template
    const pkgId = SMOKE_TEMPLATE_PKGS_EN["aurora"];

    await interceptWindowOpen(page);
    await page.goto(`/${SMOKE_AGENCY_SLUG}/${pkgId}`);
    await expect(page.getByTestId("pkg-page")).toBeVisible({ timeout: 20_000 });

    await page.getByTestId("wa-cta").first().click();

    const url = await lastOpenedUrl(page);
    expect(url).toMatch(/^https:\/\/wa\.me\//);
    // smoke package has whatsapp: "15550001234"
    expect(url).toContain("15550001234");
    expect(url).toContain("wa.me");
  });

  test("AR click opens correct wa.me URL with phone number", async ({ page }) => {
    const { SMOKE_AGENCY_SLUG, SMOKE_TEMPLATE_PKGS_AR } = smokeState();
    const pkgId = SMOKE_TEMPLATE_PKGS_AR["aurora"];

    await interceptWindowOpen(page);
    await page.goto(`/${SMOKE_AGENCY_SLUG}/${pkgId}`);
    await expect(page.getByTestId("pkg-page")).toBeVisible({ timeout: 20_000 });

    await page.getByTestId("wa-cta").first().click();

    const url = await lastOpenedUrl(page);
    expect(url).toMatch(/^https:\/\/wa\.me\//);
    expect(url).toContain("15550001234");
  });
});

// ── Messenger CTA ────────────────────────────────────────────────────────────

test.describe("Messenger CTA", () => {
  test("messenger button visible and opens correct m.me URL (EN — atlas)", async ({ page }) => {
    const { SMOKE_AGENCY_SLUG, SMOKE_TEMPLATE_PKGS_EN } = smokeState();
    // atlas has a messenger button in its CTA banner
    const pkgId = SMOKE_TEMPLATE_PKGS_EN["atlas"];

    await interceptWindowOpen(page);
    await page.goto(`/${SMOKE_AGENCY_SLUG}/${pkgId}`);
    await expect(page.getByTestId("pkg-page")).toBeVisible({ timeout: 20_000 });

    const messengerBtn = page.getByTestId("messenger-cta").first();
    await expect(messengerBtn).toBeVisible({ timeout: 10_000 });

    await messengerBtn.click();

    const url = await lastOpenedUrl(page);
    expect(url).toContain("m.me");
    expect(url).toContain("smoke-test-page");
  });

  test("messenger button visible (AR — atlas)", async ({ page }) => {
    const { SMOKE_AGENCY_SLUG, SMOKE_TEMPLATE_PKGS_AR } = smokeState();
    const pkgId = SMOKE_TEMPLATE_PKGS_AR["atlas"];

    await page.goto(`/${SMOKE_AGENCY_SLUG}/${pkgId}`);
    await expect(page.getByTestId("pkg-page")).toBeVisible({ timeout: 20_000 });

    await expect(page.getByTestId("messenger-cta").first()).toBeVisible({ timeout: 10_000 });
  });
});
