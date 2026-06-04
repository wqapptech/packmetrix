/**
 * Smoke test 3 — BUILDER SAVE / NO DATA LOSS
 *
 * Fills the builder with a destination + price, waits for the autosave to
 * write to localStorage, reloads the page, and asserts the draft is
 * restored. Catches the "builder autosave silently broke" regression.
 *
 * Why inject a draft first: for a new package the builder starts in
 * "template" phase (template picker). Only when a draft exists in
 * localStorage does it skip straight to "build" phase where the form
 * inputs are rendered. We inject a minimal valid draft before the page
 * loads so we land directly in build mode, then overwrite the fields.
 */
import { test, expect } from "@playwright/test";
import { smokeState, loginAs } from "../helpers";

const MINIMAL_DRAFT = JSON.stringify({
  core: {
    destination: "",
    price: "",
    nights: "",
    currency: "",
    primaryLanguage: "en",
    title: "",
    description: "",
    whatsapp: "",
    messenger: "",
    coverImage: "",
  },
  sections: [],
  templateId: "aurora",
});

test.describe("Builder save", () => {
  test("autosaved draft survives a page reload", async ({ page }) => {
    const { SMOKE_EMAIL, SMOKE_PASSWORD } = smokeState();

    // Log in — this lands on /builder
    await loginAs(page, SMOKE_EMAIL, SMOKE_PASSWORD);

    // Inject a minimal draft so the builder loads in build mode (not template picker)
    await page.evaluate(
      (draft) => localStorage.setItem("builderDraft_v2", draft),
      MINIMAL_DRAFT
    );
    await page.reload();
    await page.waitForURL("**/builder**", { timeout: 20_000 });

    // Wait for the build-phase form to appear
    const destinationInput = page.getByPlaceholder("e.g. Mecca, Saudi Arabia");
    await destinationInput.waitFor({ state: "visible", timeout: 20_000 });

    // Fill in recognisable values
    await destinationInput.fill("Smoke Save Test Destination");
    await page.getByPlaceholder("e.g. 1,200 €").fill("2,500 USD");

    // Autosave fires 1.5 s after last change — wait 4 s to be safe
    await page.waitForTimeout(4_000);

    // Hard reload (bypasses client-side cache)
    await page.reload();
    await page.waitForURL("**/builder**", { timeout: 20_000 });

    // Builder must restore the draft from localStorage
    await expect(
      page.getByPlaceholder("e.g. Mecca, Saudi Arabia")
    ).toHaveValue("Smoke Save Test Destination", { timeout: 20_000 });

    await expect(page.getByPlaceholder("e.g. 1,200 €")).toHaveValue(
      "2,500 USD",
      { timeout: 5_000 }
    );

    // Clean up so we don't leave a draft in the test browser profile
    await page.evaluate(() => localStorage.removeItem("builderDraft_v2"));
  });
});
