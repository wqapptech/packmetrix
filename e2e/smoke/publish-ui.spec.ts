/**
 * Smoke test — PUBLISH VIA UI → /api/generate
 *
 * Verifies the end-to-end publish path: builder fills → click Publish →
 * /api/generate runs → success screen appears. If this breaks, the
 * core monetised action is dead.
 *
 * Strategy: inject a draft with destination + price pre-filled into
 * localStorage before page load. This skips the template-picker phase
 * and lands directly in build mode, ready to publish.
 */
import { test, expect } from "@playwright/test";
import { smokeState, loginAs } from "../helpers";

const PUBLISH_DRAFT = JSON.stringify({
  core: {
    titleEn: "",
    titleAr: "",
    destination: "SMOKE Publish Destination",
    price: "2,500 USD",
    nights: "5",
    currency: "USD",
    primaryLanguage: "en",
    descriptionEn: "",
    descriptionAr: "",
    whatsapp: "",
    messenger: "",
    coverImage: "",
  },
  sections: [],
  templateId: "aurora",
});

test.describe("Publish via UI", () => {
  test("builder publish flow shows success screen", async ({ page }) => {
    const { SMOKE_EMAIL, SMOKE_PASSWORD } = smokeState();

    await loginAs(page, SMOKE_EMAIL, SMOKE_PASSWORD);

    // Inject a complete draft so the builder loads in build mode (not template picker)
    await page.evaluate(
      (draft) => localStorage.setItem("builderDraft_v2", draft),
      PUBLISH_DRAFT
    );
    await page.reload();
    await page.waitForURL("**/builder**", { timeout: 20_000 });

    // Wait for the build-phase form
    const destinationInput = page.getByPlaceholder("e.g. Mecca, Saudi Arabia");
    await destinationInput.waitFor({ state: "visible", timeout: 20_000 });

    // Verify the draft values are reflected in the form
    await expect(destinationInput).toHaveValue("SMOKE Publish Destination", { timeout: 5_000 });

    // Click publish — triggers /api/generate
    await page.getByTestId("builder-publish").click();

    // Success screen must appear (API call + Firestore write, allow 30 s)
    await expect(page.getByTestId("builder-done")).toBeVisible({ timeout: 30_000 });
  });
});
