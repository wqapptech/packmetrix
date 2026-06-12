/**
 * Packmetrix — full product demo flow driver
 *
 * Drives the browser through the complete demo so you can record it with
 * Screen Studio. Every page is scrolled to its full height before moving on.
 *
 * Flow:
 *   Landing page → Login → Packages dashboard → Branding page → New Package →
 *   Template picker (Pulse) → AI extraction → Core fields →
 *   Cover image → 8 sections with content → Publish →
 *   Live page preview → Back to dashboard
 *
 * Usage:
 *   DEMO_EMAIL=you@example.com DEMO_PASSWORD=secret npx tsx e2e/record-demo.ts
 */

import { chromium, type Page, type Locator } from "@playwright/test";

// ── Config ────────────────────────────────────────────────────────────────────

const BASE = process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000";
const EMAIL = process.env.DEMO_EMAIL ?? "";
const PASSWORD = process.env.DEMO_PASSWORD ?? "";

if (!EMAIL || !PASSWORD) {
  console.error(
    "\nMissing credentials.\n" +
    "Run:  DEMO_EMAIL=you@example.com DEMO_PASSWORD=yourpassword npx tsx e2e/record-demo.ts\n"
  );
  process.exit(1);
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const beat = (page: Page, ms = 1_200) => page.waitForTimeout(ms);

// Finds the AppLayout scroll container (overflow:auto div) or falls back to
// documentElement. Defined as an inline string so it can be reused in every
// page.evaluate() call without a closure.
const FIND_SCROLLER = `(
  Array.from(document.querySelectorAll('div')).find(el => {
    const s = window.getComputedStyle(el);
    return (s.overflowY === 'auto' || s.overflowY === 'scroll') &&
           el.scrollHeight > el.clientHeight + 10;
  }) || document.documentElement
)`;

/** Scroll the AppLayout content pane to the top instantly. */
async function scrollToTop(page: Page) {
  await page.evaluate(`${FIND_SCROLLER}.scrollTop = 0`);
  await page.waitForTimeout(400);
}

/**
 * Scroll the AppLayout content pane from top to bottom in smooth steps,
 * pause at the bottom, then optionally scroll back to top.
 */
async function scrollFull(
  page: Page,
  opts: { back?: boolean; stepPx?: number; pauseMs?: number; bottomPauseMs?: number } = {}
) {
  const { back = true, stepPx = 480, pauseMs = 800, bottomPauseMs = 2_000 } = opts;

  await scrollToTop(page);
  await page.waitForTimeout(400);

  const maxScroll: number = await page.evaluate(`
    (() => {
      const el = ${FIND_SCROLLER};
      return el.scrollHeight - el.clientHeight;
    })()
  `) as number;

  if (maxScroll <= 0) {
    await page.waitForTimeout(bottomPauseMs);
    return;
  }

  let pos = 0;
  while (pos < maxScroll) {
    pos = Math.min(pos + stepPx, maxScroll);
    await page.evaluate(`${FIND_SCROLLER}.scrollTo({ top: ${pos}, behavior: 'smooth' })`);
    await page.waitForTimeout(pauseMs);
  }

  await page.waitForTimeout(bottomPauseMs);

  if (back) {
    await page.evaluate(`${FIND_SCROLLER}.scrollTo({ top: 0, behavior: 'smooth' })`);
    await page.waitForTimeout(1_200);
  }
}

/**
 * Scroll a field into the vertical centre of the viewport and pause so the
 * camera shows it clearly before any typing begins.
 */
async function revealField(locator: Locator, pauseMs = 700) {
  await locator.scrollIntoViewIfNeeded();
  await locator.evaluate((el) => {
    const scroller = (
      Array.from(document.querySelectorAll("div")).find((e) => {
        const s = window.getComputedStyle(e);
        return (s.overflowY === "auto" || s.overflowY === "scroll") &&
               e.scrollHeight > e.clientHeight + 10;
      }) || document.documentElement
    ) as HTMLElement;
    const rect = el.getBoundingClientRect();
    const containerMid = scroller === document.documentElement
      ? window.innerHeight / 2
      : scroller.getBoundingClientRect().height / 2;
    const offset = rect.top + rect.height / 2 - containerMid;
    if (Math.abs(offset) > 60) scroller.scrollBy({ top: offset, behavior: "smooth" });
  });
  await locator.page().waitForTimeout(pauseMs);
}

// ── Cursor & click-highlight overlay ─────────────────────────────────────────

const CURSOR_SCRIPT = `(function () {
  if (document.getElementById('__demo_cursor__')) return;

  const scrollbarStyle = document.createElement('style');
  scrollbarStyle.textContent = '::-webkit-scrollbar{display:none!important}*{scrollbar-width:none!important}';
  document.head.appendChild(scrollbarStyle);

  // Hide all toast notifications so empty/noisy toasts don't appear on camera.
  const toastStyle = document.createElement('style');
  toastStyle.textContent = [
    '[data-sonner-toaster]',
    '[data-sonner-toast]',
    '[data-radix-toast-viewport]',
    '[id*="toast"]',
    '[class*="Toaster"]',
    '[class*="toaster"]',
    '[class*="toast-container"]',
    '#_rht_toaster',
  ].join(',') + '{display:none!important;pointer-events:none!important}';
  document.head.appendChild(toastStyle);

  const style = document.createElement('style');
  style.textContent = \`
    #__demo_cursor__ {
      position: fixed;
      width: 22px; height: 22px;
      border-radius: 50%;
      border: 2.5px solid rgba(255, 85, 0, 0.85);
      background: rgba(255, 85, 0, 0.18);
      pointer-events: none;
      z-index: 2147483647;
      transform: translate(-50%, -50%);
      transition: background 0.1s, transform 0.08s;
      box-shadow: 0 0 0 1.5px rgba(255,255,255,0.45);
    }
    @keyframes __demo_ripple__ {
      0%   { transform: translate(-50%,-50%) scale(1);   opacity: 0.7; }
      100% { transform: translate(-50%,-50%) scale(4);   opacity: 0;   }
    }
    .__demo_ripple_el__ {
      position: fixed;
      width: 22px; height: 22px;
      border-radius: 50%;
      border: 2px solid rgba(255, 85, 0, 0.55);
      pointer-events: none;
      z-index: 2147483646;
      transform: translate(-50%,-50%);
      animation: __demo_ripple__ 0.55s ease-out forwards;
    }
  \`;
  document.head.appendChild(style);

  const dot = document.createElement('div');
  dot.id = '__demo_cursor__';
  document.body.appendChild(dot);

  document.addEventListener('mousemove', (e) => {
    dot.style.left = e.clientX + 'px';
    dot.style.top  = e.clientY + 'px';
  }, { passive: true });

  document.addEventListener('mousedown', (e) => {
    dot.style.transform = 'translate(-50%,-50%) scale(1.6)';
    dot.style.background = 'rgba(255,85,0,0.42)';
    const r = document.createElement('div');
    r.className = '__demo_ripple_el__';
    r.style.left = e.clientX + 'px';
    r.style.top  = e.clientY + 'px';
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 600);
  });

  document.addEventListener('mouseup', () => {
    dot.style.transform = 'translate(-50%,-50%) scale(1)';
    dot.style.background = 'rgba(255,85,0,0.18)';
  });
})();`;

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Launching browser…");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 600,
  });

  // viewport: null lets the viewport follow the actual window size after we maximize.
  const context = await browser.newContext({ viewport: null });

  await context.addInitScript(CURSOR_SCRIPT);
  const page = await context.newPage();

  // Maximize the window via CDP — --start-maximized is ignored on macOS.
  const cdp = await context.newCDPSession(page);
  const { windowId } = await cdp.send("Browser.getWindowForTarget");
  await cdp.send("Browser.setWindowBounds", { windowId, bounds: { windowState: "maximized" } });
  await page.waitForTimeout(600);

  // ════════════════════════════════════════════════════════════════════════════
  // 0. LANDING PAGE — opening shot
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 0 — Landing page");
  await page.goto(`${BASE}/`);
  await page.waitForLoadState("load");

  // Hold on the hero so the viewer reads the headline.
  await beat(page, 4_000);

  // ════════════════════════════════════════════════════════════════════════════
  // 1. LOGIN
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 1 — Login");
  await page.goto(`${BASE}/login`);
  await page.waitForLoadState("domcontentloaded");
  await beat(page, 1_000);

  await page.getByTestId("login-email").fill(EMAIL);
  await beat(page, 500);
  await page.getByTestId("login-password").fill(PASSWORD);
  await beat(page, 600);
  await page.getByTestId("login-submit").click();
  await page.waitForURL("**/builder**", { timeout: 30_000 });
  await beat(page, 1_500);

  // ════════════════════════════════════════════════════════════════════════════
  // 2. PACKAGES DASHBOARD
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 2 — Packages dashboard");
  await page.goto(`${BASE}/packages`);
  await page.waitForLoadState("load");
  await page.waitForSelector('a[href*="/builder/"], [data-testid*="package"], .package-card', {
    timeout: 10_000,
  }).catch(() => beat(page, 2_000));
  await beat(page, 800);

  // Scroll through all package cards then return to top.
  await scrollFull(page, { back: true, stepPx: 450, pauseMs: 850, bottomPauseMs: 2_000 });

  // ════════════════════════════════════════════════════════════════════════════
  // 2b. LEAD MANAGEMENT
  // Show the leads inbox — every WhatsApp/Messenger tap logged automatically.
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 2b — Lead management");
  await page.goto(`${BASE}/leads`);
  await page.waitForLoadState("load");
  await beat(page, 2_500);

  // Scroll the full leads list then return to top.
  await scrollFull(page, { back: true, stepPx: 450, pauseMs: 850, bottomPauseMs: 2_000 });

  // ════════════════════════════════════════════════════════════════════════════
  // 3. BRANDING PAGE
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 3 — Branding / profile page");
  await page.goto(`${BASE}/profile`);
  await page.waitForLoadState("load");
  await beat(page, 2_500);

  // Scroll the full branding page — agency name, logo, brand colour, custom domain.
  await scrollFull(page, { back: false, stepPx: 420, pauseMs: 850, bottomPauseMs: 1_200 });

  // Pause specifically on the custom domain section so the narrator can highlight it.
  const domainLabel = page.getByText("Your primary business URL").first();
  if (await domainLabel.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await domainLabel.scrollIntoViewIfNeeded();
    await page.evaluate(`${FIND_SCROLLER}.scrollBy({ top: 120, behavior: 'smooth' })`);
    // Narrator: "Connect your own domain — every package page is served from
    //            your URL, with no Packmetrix branding anywhere."
    await beat(page, 3_500);
  }

  await scrollToTop(page);
  await beat(page, 1_000);

  // ════════════════════════════════════════════════════════════════════════════
  // 4. START A NEW PACKAGE
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 4 — New Package");
  await page.goto(`${BASE}/packages`);
  await page.waitForLoadState("load");
  await beat(page, 1_200);

  await page.evaluate(() => localStorage.removeItem("builderDraft_v2"));

  const newPkgBtn = page.getByRole("button", { name: /New Package/i }).first();
  await newPkgBtn.waitFor({ state: "visible", timeout: 10_000 });
  await newPkgBtn.click();
  await page.waitForURL("**/builder**", { timeout: 20_000 });
  await beat(page, 1_200);

  // ════════════════════════════════════════════════════════════════════════════
  // 5. TEMPLATE PICKER — SELECT PULSE
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 5 — Template picker: select Pulse");
  await page.getByText("Use this").first().waitFor({ state: "visible", timeout: 20_000 });
  await beat(page, 1_000);

  // Scroll the full gallery so viewers see all template options.
  await scrollFull(page, { back: true, stepPx: 400, pauseMs: 800, bottomPauseMs: 1_500 });

  // Select Pulse.
  const pulseCard = page.locator("text=Pulse").first();
  await pulseCard.scrollIntoViewIfNeeded();
  await beat(page, 500);
  await pulseCard.click();
  await page.getByText("Active").waitFor({ state: "visible", timeout: 5_000 });
  await beat(page, 1_000);

  // Scroll the full builder page so the viewer sees the selected template and
  // the AI extraction textarea before any typing begins.
  await scrollFull(page, { back: true, stepPx: 420, pauseMs: 850, bottomPauseMs: 1_500 });

  // ════════════════════════════════════════════════════════════════════════════
  // 6. AI EXTRACTION
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 6 — AI extraction");

  const AI_DESCRIPTION =
`Santorini Autumn Special — 5 Nights 🇬🇷

Escape to the caldera this September. Private pool villa in Oia, sunset dinners, Aegean cruise.

Price: €599 per person (was €1,199)
Departure: September 20, 2026
Duration: 5 nights · Destination: Santorini, Greece

⚠️ Only 3 spots remaining out of 20!

What's included:
- Return flights from Amsterdam
- Private caldera-view villa with pool
- Daily breakfast
- Airport transfers in Santorini
- Guided Aegean sunset cruise

Book now before the offer disappears.`;

  const aiTextarea = page.getByPlaceholder(
    "Paste your package description here — any format, any language…"
  );
  await aiTextarea.scrollIntoViewIfNeeded();
  await aiTextarea.click();
  await beat(page, 600);
  await aiTextarea.fill(AI_DESCRIPTION);
  await beat(page, 800);

  // Pan through the textarea so viewers can read the description.
  await aiTextarea.evaluate((el: HTMLTextAreaElement) => { el.scrollTop = el.scrollHeight / 2; });
  await beat(page, 700);
  await aiTextarea.evaluate((el: HTMLTextAreaElement) => { el.scrollTop = el.scrollHeight; });
  await beat(page, 700);
  await aiTextarea.evaluate((el: HTMLTextAreaElement) => { el.scrollTop = 0; });
  await beat(page, 500);

  await page.getByText("Extract with AI").click();

  await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes("/api/extract") && r.request().method() === "POST",
      { timeout: 30_000 }
    ),
    page.getByPlaceholder("e.g. Mecca, Saudi Arabia").waitFor({
      state: "visible",
      timeout: 30_000,
    }),
  ]);

  console.log("  ✓ AI extraction complete — build form appeared");
  await beat(page, 2_000);

  // ════════════════════════════════════════════════════════════════════════════
  // 7. REVIEW PRE-FILLED CORE FIELDS
  // Scroll the entire build form so every AI-populated field is visible.
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 7 — Review AI-filled core fields");

  await scrollFull(page, { back: false, stepPx: 420, pauseMs: 850, bottomPauseMs: 1_200 });

  // Fill WhatsApp manually (not extracted by AI).
  const waInput = page.getByPlaceholder("+1 234 567 8900");
  if (await waInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await revealField(waInput);
    await waInput.fill("+31 6 1234 5678");
    await beat(page, 700);
  }

  await scrollToTop(page);
  await beat(page, 800);

  // ════════════════════════════════════════════════════════════════════════════
  // 8. COVER IMAGE — SEARCH PHOTOS
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 8 — Cover image");
  const searchPhotosTab = page.getByText("Search Photos");
  if (await searchPhotosTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await revealField(searchPhotosTab);
    await searchPhotosTab.click();
    await beat(page, 800);

    const photoInput = page.getByPlaceholder("Search for photos…");
    await photoInput.waitFor({ state: "visible", timeout: 10_000 });
    await revealField(photoInput);
    await photoInput.fill("Santorini Greece");
    await beat(page, 500);
    await photoInput.press("Enter");

    await page.waitForTimeout(3_000);

    const firstPhotoContainer = page
      .locator("img[src*='pexels'], img[src*='unsplash'], img[src*='images.pexels']")
      .first()
      .locator("..");
    if (await firstPhotoContainer.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await revealField(firstPhotoContainer);
      await firstPhotoContainer.click();
      await beat(page, 2_000);
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 9. SECTIONS — showcase the full power of packmetrix
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 9 — Building sections");

  async function buildSection(label: string, fill: () => Promise<void>) {
    console.log(`  + Section: ${label}`);

    const baseline = await page.evaluate(() =>
      document.querySelectorAll("input, textarea").length
    );

    const browseBtn = page.getByText(/Browse all \d+ sections/);
    await revealField(browseBtn, 500);
    await browseBtn.click();
    await page.getByText("Add a section").waitFor({ state: "visible", timeout: 10_000 });
    await beat(page, 600);

    const sectionBtn = page
      .getByRole("button", { name: new RegExp("^" + label, "i") })
      .last();
    await revealField(sectionBtn, 500);
    await sectionBtn.click();

    await page.getByText("Add a section").waitFor({ state: "hidden", timeout: 8_000 });
    await beat(page, 1_200);

    const addContentBtn = page
      .locator("button")
      .filter({ hasText: /Add content/i })
      .last();
    if (await addContentBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await revealField(addContentBtn, 500);
      await addContentBtn.click({ force: true });
      await beat(page, 1_500);
    }

    const afterCount = await page.evaluate(() =>
      document.querySelectorAll("input, textarea").length
    );
    if (afterCount <= baseline) {
      console.log(`  Fallback: clicking header for "${label}"`);
      await page.evaluate(() => {
        const wrappers = Array.from(document.querySelectorAll('[id^="section-"]'));
        const last = wrappers[wrappers.length - 1];
        const header = last?.firstElementChild?.firstElementChild as HTMLElement | null;
        header?.click();
      });
      await beat(page, 1_500);
    }

    // Scroll the whole section editor to the top of the viewport so the camera
    // sees the full section before any fields are touched.
    await page.evaluate(() => {
      const wrappers = Array.from(document.querySelectorAll('[id^="section-"]'));
      const last = wrappers[wrappers.length - 1] as HTMLElement | undefined;
      last?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    await beat(page, 1_000);

    await fill();
    await beat(page, 1_200);
  }

  // ── 9a. SCARCITY & URGENCY ────────────────────────────────────────────────
  await buildSection("Scarcity", async () => {
    const wasPrice = page.getByPlaceholder("e.g. €1,499").first();
    if (await wasPrice.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await revealField(wasPrice);
      await wasPrice.fill("€1,199");
      await beat(page, 400);

      const numInputs = page.locator('input[inputMode="numeric"]');
      if (await numInputs.first().isVisible({ timeout: 3_000 }).catch(() => false)) {
        await revealField(numInputs.first());
        await numInputs.first().fill("3");
        await beat(page, 300);
        await revealField(numInputs.nth(1));
        await numInputs.nth(1).fill("20");
        await beat(page, 300);
      }

      const depDate = page.getByPlaceholder("e.g. 2026-06-15").first();
      if (await depDate.isVisible({ timeout: 3_000 }).catch(() => false)) {
        await revealField(depDate);
        await depDate.fill("2026-09-20");
      }
    }
  });

  // ── 9b. ITINERARY ─────────────────────────────────────────────────────────
  await buildSection("Itinerary", async () => {
    // The section starts with 3 days pre-populated — fill each by index.
    const dayInputs = page.getByPlaceholder("e.g. Arrival & city tour");

    const day1 = dayInputs.nth(0);
    if (await day1.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await revealField(day1);
      await day1.fill("Arrival in Santorini · Oia check-in");
      await beat(page, 500);
    }

    const day2 = dayInputs.nth(1);
    if (await day2.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await revealField(day2);
      await day2.fill("Aegean sunset cruise · Akrotiri ruins");
      await beat(page, 500);
    }

    const day3 = dayInputs.nth(2);
    if (await day3.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await revealField(day3);
      await day3.fill("Beach day at Perissa · Fira evening walk");
    }
  });

  // ── 9c. HIGHLIGHTS ────────────────────────────────────────────────────────
  await buildSection("Highlights", async () => {
    const tagInput = page.getByPlaceholder("e.g. 5-star hotel included").first();
    if (await tagInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await revealField(tagInput);
      await tagInput.fill("Private caldera-view villa with infinity pool");
      await tagInput.press("Enter");
    }
  });

  // ── 9d. HOTEL & ACCOMMODATION ─────────────────────────────────────────────
  await buildSection("Hotel", async () => {
    const desc = page
      .getByPlaceholder("Describe the hotel: name, location, facilities, star rating…")
      .first();
    if (await desc.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await revealField(desc);
      await desc.fill(
        "Cave hotel carved into the volcanic cliff in Oia. Heated private pool, panoramic Aegean views, daily concierge breakfast."
      );
    }
  });

  // ── 9e. DEPARTURES ────────────────────────────────────────────────────────
  await buildSection("Departures", async () => {
    const dateField = page.getByPlaceholder("e.g. 15 March 2026").first();
    if (await dateField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await revealField(dateField);
      await dateField.fill("20 September 2026");
    }
  });

  // ── 9f. PRICING ───────────────────────────────────────────────────────────
  await buildSection("Pricing", async () => {
    const tierLabel = page.getByPlaceholder("e.g. Per person (2 pax)").first();
    if (await tierLabel.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await revealField(tierLabel);
      await tierLabel.fill("Per person (double room)");
    }
  });

  // ── 9g. REVIEWS ───────────────────────────────────────────────────────────
  await buildSection("Customer Reviews", async () => {
    const reviewerName = page.getByPlaceholder("e.g. Sara M.").first();
    if (await reviewerName.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await revealField(reviewerName);
      await reviewerName.fill("Sofia Andersen");
    }
  });

  // ── 9h. ABOUT AGENCY ──────────────────────────────────────────────────────
  await buildSection("About", async () => {
    const storyInput = page
      .getByPlaceholder("Tell travellers about your agency, experience, and values…")
      .first();
    if (await storyInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await revealField(storyInput);
      await storyInput.fill(
        "10 years crafting intimate Mediterranean escapes. Over 2,400 happy travellers — 4.9★ average rating."
      );
    }
  });

  // ════════════════════════════════════════════════════════════════════════════
  // 10. PUBLISH
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 10 — Publish");
  await beat(page, 1_000);

  const publishBtn = page.getByTestId("builder-publish");
  await revealField(publishBtn);
  await publishBtn.click();

  // ════════════════════════════════════════════════════════════════════════════
  // 11. SUCCESS SCREEN
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 11 — Success screen");
  await page.getByTestId("builder-done").waitFor({ state: "visible", timeout: 45_000 });
  console.log("  ✓ Package is live!");

  await beat(page, 2_000);

  // Scroll the success screen fully — the share URL row with the custom domain
  // is the key moment for the narrator.
  await scrollFull(page, { back: true, stepPx: 400, pauseMs: 900, bottomPauseMs: 3_500 });

  // ════════════════════════════════════════════════════════════════════════════
  // 12. LIVE PACKAGE PAGE — full scroll through every section
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 12 — Preview live Pulse page");
  const previewBtn = page.getByText("Preview page");
  if (await previewBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    const [newTab] = await Promise.all([
      context.waitForEvent("page"),
      previewBtn.click(),
    ]);
    await newTab.waitForLoadState("domcontentloaded");
    const liveUrl = newTab.url();
    await newTab.close();

    await page.goto(liveUrl);
    await page.waitForLoadState("load");
    // Extra wait for countdown timer JS and lazy images.
    await page.waitForTimeout(3_500);

    // Scroll the entire live page — hero → highlights → itinerary → hotel →
    // departures → pricing → reviews → about → footer.
    await scrollFull(page, { back: false, stepPx: 460, pauseMs: 1_000, bottomPauseMs: 2_500 });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 12b. AGENCY STOREFRONT — show the new package appearing on the storefront
  // Navigate back to the builder success screen to use the "Preview storefront"
  // link, which now includes the newly published package.
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 12b — Agency storefront");
  await page.goto(`${BASE}/profile`);
  await page.waitForLoadState("load");
  await beat(page, 2_000);
  const storefrontBtn = page.getByText("Preview storefront").first();
  if (await storefrontBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    const [sfTab] = await Promise.all([
      context.waitForEvent("page"),
      storefrontBtn.click(),
    ]);
    await sfTab.waitForLoadState("domcontentloaded");
    const sfUrl = sfTab.url();
    await sfTab.close();

    await page.goto(sfUrl);
    await page.waitForLoadState("load");
    await beat(page, 2_500);

    // Scroll the full storefront so every package card including the new one is visible.
    await scrollFull(page, { back: true, stepPx: 480, pauseMs: 900, bottomPauseMs: 2_000 });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 13. BACK TO PACKAGES DASHBOARD
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 13 — Back to packages dashboard");
  const backBtn = page.getByText("Back to dashboard");
  if (await backBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await backBtn.click();
  } else {
    await page.goto(`${BASE}/packages`);
  }
  await page.waitForLoadState("load");
  // Wait for package cards (including the newly published one) to render.
  await page.waitForSelector('a[href*="/builder/"], [data-testid*="package"], .package-card', {
    timeout: 10_000,
  }).catch(() => beat(page, 3_000));
  await beat(page, 1_500);

  // Scroll the full dashboard so every package card is seen, then return to top.
  await scrollFull(page, { back: true, stepPx: 450, pauseMs: 850, bottomPauseMs: 2_500 });

  // ── WRAP UP ───────────────────────────────────────────────────────────────
  console.log("\n✓ Demo flow complete — stop Screen Studio recording now.\n");

  // Keep the browser open briefly so you can stop Screen Studio cleanly.
  await page.waitForTimeout(5_000);

  await context.close();
  await browser.close();
}

main().catch((err) => {
  console.error("Demo flow failed:", err);
  process.exit(1);
});
