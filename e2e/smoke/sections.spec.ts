/**
 * Smoke test — ALL SECTION TYPES (EN + AR)
 *
 * Navigates to a pre-built Aurora package that contains all 18 active section
 * types, each populated with "SMOKE …" marker text. Asserts that the rendered
 * page shows content from every section the Aurora template actually renders.
 *
 * Sections skipped from visible-text assertions (aurora-specific):
 *   - media       — images only, no text content
 *   - scarcity     — foregrounded by Pulse; aurora doesn't render it
 */
import { test, expect } from "@playwright/test";
import { smokeState } from "../helpers";

const SECTIONS: Array<{ label: string; text: string }> = [
  { label: "highlights",     text: "SMOKE Highlight One" },
  { label: "itinerary",      text: "SMOKE Itinerary Day" },
  { label: "hotel",          text: "SMOKE Hotel Description" },
  { label: "inclusions",     text: "SMOKE Included Item" },
  { label: "meals",          text: "SMOKE Meal Plan" },
  { label: "visa",           text: "SMOKE Visa Status" },
  { label: "faq",            text: "SMOKE FAQ Question?" },
  { label: "custom",         text: "SMOKE Custom Heading" },
  { label: "extras",         text: "SMOKE Extra Name" },
  { label: "important_notes",text: "SMOKE Important Note" },
  { label: "about_agency",   text: "SMOKE Agency Story" },
  { label: "pricing",        text: "SMOKE Pricing Tier" },
  { label: "transfers",      text: "SMOKE Transfer Route" },
  { label: "departures",     text: "2026-12-01" },
  { label: "reviews",        text: "SMOKE Reviewer Name" },
  { label: "people",         text: "SMOKE Guide Person" },
];

test.describe("Sections render — EN package", () => {
  test("all rendered sections show SMOKE content", async ({ page }) => {
    const { SMOKE_AGENCY_SLUG, SMOKE_SECTIONS_PKG_EN } = smokeState();

    await page.goto(`/${SMOKE_AGENCY_SLUG}/${SMOKE_SECTIONS_PKG_EN}`);
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByTestId("pkg-page")).toBeVisible({ timeout: 20_000 });

    for (const { label, text } of SECTIONS) {
      await expect(
        page.getByText(text).first(),
        `Section "${label}" must show "${text}"`
      ).toBeVisible({ timeout: 10_000 });
    }
  });
});

test.describe("Sections render — AR package", () => {
  test("all rendered sections show SMOKE content", async ({ page }) => {
    const { SMOKE_AGENCY_SLUG, SMOKE_SECTIONS_PKG_AR } = smokeState();

    await page.goto(`/${SMOKE_AGENCY_SLUG}/${SMOKE_SECTIONS_PKG_AR}`);
    await page.waitForLoadState("domcontentloaded");

    await expect(page.getByTestId("pkg-page")).toBeVisible({ timeout: 20_000 });

    for (const { label, text } of SECTIONS) {
      await expect(
        page.getByText(text).first(),
        `Section "${label}" must show "${text}"`
      ).toBeVisible({ timeout: 10_000 });
    }
  });
});
