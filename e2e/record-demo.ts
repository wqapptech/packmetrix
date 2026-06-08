/**
 * Packmetrix — full product demo recorder
 *
 * Designed for AI voice-over generation. Each step has deliberate pauses
 * so the narrator has time to explain what is happening on screen.
 *
 * Flow:
 *   Login → Packages dashboard → Branding page → New Package →
 *   Template picker (Pulse) → AI extraction → Core fields →
 *   Cover image → 8 sections with content → Publish →
 *   Live page preview → Back to dashboard
 *
 * Usage:
 *   DEMO_EMAIL=you@example.com DEMO_PASSWORD=secret npx tsx e2e/record-demo.ts
 *
 * Output: ./videos/<uuid>.webm
 * Convert: ffmpeg -i videos/your-file.webm -c:v libx264 demo.mp4
 */

import * as path from "path";
import * as fs from "fs";
import { chromium, type Page } from "@playwright/test";

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

/** Pause so the voice-over narrator has time to explain what's on screen. */
const beat = (page: Page, ms = 1_200) => page.waitForTimeout(ms);

/** Slow scroll — lets the viewer absorb the content as the camera pans. */
async function slowScroll(page: Page, distance: number, steps = 4) {
  const step = Math.round(distance / steps);
  for (let i = 0; i < steps; i++) {
    await page.evaluate((d) => window.scrollBy({ top: d, behavior: "smooth" }), step);
    await page.waitForTimeout(700);
  }
}

// ── Cursor & click-highlight overlay ─────────────────────────────────────────
// Injected into every page so the recorded video shows cursor position and clicks.

const CURSOR_SCRIPT = `(function () {
  if (document.getElementById('__demo_cursor__')) return;

  // Hide native scrollbars — they appear as an ugly vertical strip on the right
  // in the recorded video. Content is still scrollable via the script.
  const scrollbarStyle = document.createElement('style');
  scrollbarStyle.textContent = '::-webkit-scrollbar{display:none!important}*{scrollbar-width:none!important}';
  document.head.appendChild(scrollbarStyle);

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
  const videosDir = path.join(process.cwd(), "videos");
  fs.mkdirSync(videosDir, { recursive: true });

  console.log("Launching browser…");

  const browser = await chromium.launch({
    headless: false,
    slowMo: 700,
    args: ["--start-maximized"],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: videosDir, size: { width: 1440, height: 900 } },
  });

  // Cursor overlay auto-applies to every page and new tab.
  await context.addInitScript(CURSOR_SCRIPT);

  const page = await context.newPage();

  // ════════════════════════════════════════════════════════════════════════════
  // 0. LANDING PAGE — opening shot
  //
  // Voice-over narrator says:
  //   "This is Packmetrix — the platform that turns your travel packages into
  //    beautiful, branded landing pages under your own domain, in minutes."
  //
  // The hero headline on screen reads the same thing, so the narration and
  // the visual reinforce each other perfectly.
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 0 — Landing page (opening shot)");
  await page.goto(`${BASE}/`);
  await page.waitForLoadState("domcontentloaded");

  // Pause on the hero — narrator delivers the opening line.
  await beat(page, 4_000);

  // Slow scroll to show the feature highlights beneath the hero.
  await slowScroll(page, 900, 6);
  await beat(page, 1_500);

  // ════════════════════════════════════════════════════════════════════════════
  // 1. LOGIN
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 1 — Login");
  await page.goto(`${BASE}/login`);
  await beat(page, 800);
  await page.getByTestId("login-email").fill(EMAIL);
  await beat(page, 500);
  await page.getByTestId("login-password").fill(PASSWORD);
  await beat(page, 500);
  await page.getByTestId("login-submit").click();
  await page.waitForURL("**/builder**", { timeout: 30_000 });
  await beat(page, 1_500);

  // ════════════════════════════════════════════════════════════════════════════
  // 2. PACKAGES DASHBOARD
  // Show the agency workspace — all packages at a glance.
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 2 — Packages dashboard");
  await page.goto(`${BASE}/packages`);
  await page.waitForLoadState("domcontentloaded");
  await beat(page, 2_000);

  // Scroll down to show package cards, then back up.
  await slowScroll(page, 400, 3);
  await beat(page, 1_500);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await beat(page, 1_000);

  // ════════════════════════════════════════════════════════════════════════════
  // 3. BRANDING PAGE
  // Show agency identity settings: name, logo, brand colour, and — crucially —
  // the custom domain that serves all package pages from the agency's own URL.
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 3 — Branding / profile page");
  await page.goto(`${BASE}/profile`);
  await page.waitForLoadState("domcontentloaded");
  await beat(page, 2_000);

  // Scroll through the top section: agency name, logo, brand colour.
  await slowScroll(page, 500, 4);
  await beat(page, 1_000);

  // Scroll to the custom domain section.
  // We target the field label text ("Your primary business URL") rather than the
  // placeholder, because the account already has a domain configured — the input
  // has a value so its placeholder is never visible.
  const domainLabel = page.getByText("Your primary business URL").first();
  if (await domainLabel.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await domainLabel.scrollIntoViewIfNeeded();
    await beat(page, 800);
    // Scroll a little further so the configured domain value and the
    // green "Live" status badge are both fully in frame.
    await page.evaluate(() => window.scrollBy({ top: 120, behavior: "smooth" }));
    // Long pause — narrator says:
    //   "Connect your own domain — every package page is served from
    //    your URL, with no Packmetrix branding anywhere."
    await beat(page, 3_500);
  } else {
    // Fallback: keep scrolling until something domain-related is visible.
    await slowScroll(page, 500, 4);
    await beat(page, 2_500);
  }

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await beat(page, 1_000);

  // ════════════════════════════════════════════════════════════════════════════
  // 4. START A NEW PACKAGE
  // Navigate back to the packages list and click "New Package".
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 4 — New Package");
  await page.goto(`${BASE}/packages`);
  await page.waitForLoadState("domcontentloaded");
  await beat(page, 1_500);

  // Clear any stale draft before entering the builder so the template picker shows.
  await page.evaluate(() => localStorage.removeItem("builderDraft_v2"));

  const newPkgBtn = page.getByRole("button", { name: /New Package/i }).first();
  await newPkgBtn.waitFor({ state: "visible", timeout: 10_000 });
  await newPkgBtn.click();
  await page.waitForURL("**/builder**", { timeout: 20_000 });
  await beat(page, 1_200);

  // ════════════════════════════════════════════════════════════════════════════
  // 5. TEMPLATE PICKER — SELECT PULSE
  // Browse the gallery briefly, then choose Pulse for its urgency features.
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 5 — Template picker: select Pulse");
  await page.getByText("Use this").first().waitFor({ state: "visible", timeout: 20_000 });
  await beat(page, 1_000);

  // Brief gallery scroll so the viewer sees all template options.
  await slowScroll(page, 350, 3);
  await beat(page, 800);
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await beat(page, 600);

  // Click the Pulse card — the outer div has onClick=onPick, clicking the name
  // text bubbles up to trigger selection.
  const pulseCard = page.locator("text=Pulse").first();
  await pulseCard.scrollIntoViewIfNeeded();
  await beat(page, 500);
  await pulseCard.click();

  // Wait for the "Active" badge to confirm Pulse is selected.
  await page.getByText("Active").waitFor({ state: "visible", timeout: 5_000 });
  await beat(page, 1_000);

  // ════════════════════════════════════════════════════════════════════════════
  // 6. AI EXTRACTION
  // Paste a real-world package description — the AI fills all core fields
  // and transitions directly to the build form (no "Start building" needed).
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

  // Slowly scroll within the textarea so viewers can read the full description,
  // then reset to top so the Extract button is visible.
  await aiTextarea.evaluate((el: HTMLTextAreaElement) => { el.scrollTop = el.scrollHeight / 2; });
  await beat(page, 700);
  await aiTextarea.evaluate((el: HTMLTextAreaElement) => { el.scrollTop = el.scrollHeight; });
  await beat(page, 700);
  await aiTextarea.evaluate((el: HTMLTextAreaElement) => { el.scrollTop = 0; });
  await beat(page, 500);

  // Click extract and wait for the API response + build form to appear.
  // onAiExtract() calls setUiPhase("build"), so the form transitions automatically.
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
  // Scroll through so viewers see every field the AI populated.
  // Only WhatsApp needs to be added manually.
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 7 — Review AI-filled core fields");
  await slowScroll(page, 500, 4);
  await beat(page, 1_000);

  const waInput = page.getByPlaceholder("+1 234 567 8900");
  if (await waInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await waInput.scrollIntoViewIfNeeded();
    await waInput.fill("+31 6 1234 5678");
    await beat(page, 700);
  }

  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  await beat(page, 800);

  // ════════════════════════════════════════════════════════════════════════════
  // 8. COVER IMAGE — SEARCH PHOTOS
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 8 — Cover image");
  const searchPhotosTab = page.getByText("Search Photos");
  if (await searchPhotosTab.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await searchPhotosTab.scrollIntoViewIfNeeded();
    await searchPhotosTab.click();
    await beat(page, 800);

    const photoInput = page.getByPlaceholder("Search for photos…");
    await photoInput.waitFor({ state: "visible", timeout: 10_000 });
    await photoInput.fill("Santorini Greece");
    await beat(page, 500);
    await photoInput.press("Enter");

    await page.waitForTimeout(3_000);
    // Click the photo container div (the element with onClick) rather than the
    // <img> inside it. The .px-ov overlay covers the img, so targeting the parent
    // div (which has the actual handleSelect onClick handler) is more reliable.
    const firstPhotoContainer = page
      .locator("img[src*='pexels'], img[src*='unsplash'], img[src*='images.pexels']")
      .first()
      .locator("..");  // parent <div> which carries onClick={() => handleSelect(photo)}
    if (await firstPhotoContainer.isVisible({ timeout: 8_000 }).catch(() => false)) {
      await firstPhotoContainer.scrollIntoViewIfNeeded();
      await firstPhotoContainer.click();
      await beat(page, 2_000);  // extra wait so preview iframe debounces and updates
    }
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 9. SECTIONS — showcase the full power of packmetrix
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 9 — Building sections");

  /**
   * Opens AddSectionMenu, picks the section matching `label`, then expands it
   * via "Add content →". The callback `fill` runs to populate key fields.
   */
  async function buildSection(label: string, fill: () => Promise<void>) {
    console.log(`  + Section: ${label}`);

    // Open the section menu
    const browseBtn = page.getByText(/Browse all \d+ sections/);
    await browseBtn.scrollIntoViewIfNeeded();
    await browseBtn.click();

    await page.getByText("Add a section").waitFor({ state: "visible", timeout: 10_000 });
    await beat(page, 600);

    // Select the section type
    const sectionBtn = page
      .getByRole("button", { name: new RegExp(label, "i") })
      .first();
    await sectionBtn.scrollIntoViewIfNeeded();
    await sectionBtn.click({ force: true });

    // Modal closes automatically
    await page.getByText("Add a section").waitFor({ state: "hidden", timeout: 8_000 });
    await beat(page, 1_200);

    // Diagnose what's in the DOM before attempting to open the section editor.
    const dbg = await page.evaluate(() => {
      const all = Array.from(document.querySelectorAll("button"));
      const ac  = all.filter((b) => (b.textContent ?? "").includes("Add content"));
      return { totalBtns: all.length, addContentCount: ac.length };
    });
    console.log(`  DOM buttons: ${dbg.totalBtns}, "Add content" found: ${dbg.addContentCount}`);

    // Open the newly added section card.
    // Use dispatchEvent with full mouse event so React's synthetic event system picks it up.
    const openResult = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll("button"));
      const btn  = [...btns].reverse()
        .find((b) => (b.textContent ?? "").includes("Add content"));
      if (!btn) return "not-found";
      btn.scrollIntoView({ block: "nearest" });
      btn.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, composed: true }));
      return "dispatched";
    });
    console.log(`  Add content dispatch: ${openResult}`);
    await beat(page, 1_500);

    // Diagnose DOM state after the click — did the editor mount?
    const afterState = await page.evaluate(() => {
      const acLeft = Array.from(document.querySelectorAll("button"))
        .filter((b) => (b.textContent ?? "").includes("Add content")).length;
      const inputs  = Array.from(document.querySelectorAll("input, textarea"));
      return {
        addContentRemaining: acLeft,
        inputCount: inputs.length,
        placeholders: inputs.map((i) => i.getAttribute("placeholder") ?? i.getAttribute("inputMode") ?? "—"),
      };
    });
    console.log(`  After click → addContent remaining: ${afterState.addContentRemaining}, inputs: ${afterState.inputCount}`);
    console.log(`  Placeholders: ${JSON.stringify(afterState.placeholders)}`);

    // Fill in the key field(s)
    await fill();
    await beat(page, 1_200);
  }

  // ── 9a. SCARCITY & URGENCY ────────────────────────────────────────────────
  // The Pulse hero feature: was-price, spots remaining, live countdown.
  await buildSection("Scarcity", async () => {
    await page.getByPlaceholder("e.g. €1,499").fill("€1,199");
    await beat(page, 400);

    // NumberInput renders as type="text" inputMode="numeric".
    // SectionEditor only mounts when open, so these are the only such inputs.
    const numInputs = page.locator('input[inputMode="numeric"]');
    await numInputs.first().fill("3");   // Spots remaining
    await beat(page, 300);
    await numInputs.nth(1).fill("20");   // Total spots
    await beat(page, 300);

    await page.getByPlaceholder("e.g. 2026-06-15").fill("2026-09-20");
  });

  // ── 9b. ITINERARY ─────────────────────────────────────────────────────────
  // Day-by-day programme — the backbone of any package.
  await buildSection("Itinerary", async () => {
    const dayTitle = page.getByPlaceholder("e.g. Arrival & city tour").first();
    if (await dayTitle.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await dayTitle.fill("Arrival in Santorini · Oia check-in");
    }
  });

  // ── 9c. HIGHLIGHTS ────────────────────────────────────────────────────────
  // Key selling points shown at the top of the page.
  await buildSection("Highlights", async () => {
    const tagInput = page.getByPlaceholder("e.g. 5-star hotel included").first();
    if (await tagInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await tagInput.fill("Private caldera-view villa with infinity pool");
      await tagInput.press("Enter");
    }
  });

  // ── 9d. HOTEL & ACCOMMODATION ─────────────────────────────────────────────
  // Hotel details: name, star rating, location, facilities.
  await buildSection("Hotel", async () => {
    const desc = page
      .getByPlaceholder("Describe the hotel: name, location, facilities, star rating…")
      .first();
    if (await desc.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await desc.fill(
        "Cave hotel carved into the volcanic cliff in Oia. Heated private pool, panoramic Aegean views, daily concierge breakfast."
      );
    }
  });

  // ── 9e. DEPARTURES ────────────────────────────────────────────────────────
  // Available travel dates so clients can book a specific slot.
  await buildSection("Departures", async () => {
    const dateField = page.getByPlaceholder("e.g. 15 March 2026").first();
    if (await dateField.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await dateField.fill("20 September 2026");
    }
  });

  // ── 9f. PRICING ───────────────────────────────────────────────────────────
  // Pricing tiers: per-person, single supplement, child rate, etc.
  await buildSection("Pricing", async () => {
    const tierLabel = page.getByPlaceholder("e.g. Per person (2 pax)").first();
    if (await tierLabel.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await tierLabel.fill("Per person (double room)");
    }
  });

  // ── 9g. REVIEWS ───────────────────────────────────────────────────────────
  // Social proof: traveller testimonials with star ratings.
  await buildSection("Reviews", async () => {
    const reviewerName = page.getByPlaceholder("e.g. Sara M.").first();
    if (await reviewerName.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await reviewerName.fill("Sofia Andersen");
    }
  });

  // ── 9h. ABOUT AGENCY ──────────────────────────────────────────────────────
  // The agency story — builds trust with prospective travellers.
  await buildSection("About", async () => {
    const storyInput = page
      .getByPlaceholder("Tell travellers about your agency, experience, and values…")
      .first();
    if (await storyInput.isVisible({ timeout: 3_000 }).catch(() => false)) {
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
  await publishBtn.scrollIntoViewIfNeeded();
  await beat(page, 600);
  await publishBtn.click();

  // ════════════════════════════════════════════════════════════════════════════
  // 11. SUCCESS SCREEN
  // The share URL shown here uses the account's custom domain
  // (e.g. packages.youragency.com/packageId) — not packmetrix.com.
  // Pause long enough for the narrator to point this out.
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 11 — Success screen");
  await page.getByTestId("builder-done").waitFor({ state: "visible", timeout: 45_000 });
  console.log("  ✓ Package is live!");

  // Let the success screen render fully, then pause on the URL row.
  await beat(page, 2_000);

  // Narrator: "Notice the URL — it's your own domain, not packmetrix.com.
  //            Every package you publish is served from your brand."
  await beat(page, 4_000);

  // ════════════════════════════════════════════════════════════════════════════
  // 12. LIVE PACKAGE PAGE — slow scroll to show every section
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 12 — Preview live Pulse page");
  const previewBtn = page.getByText("Preview page");
  if (await previewBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    const [newTab] = await Promise.all([
      context.waitForEvent("page"),
      previewBtn.click(),
    ]);

    await newTab.waitForLoadState("domcontentloaded");
    // Let the Pulse page render fully — includes countdown timer JS.
    await newTab.waitForTimeout(4_000);

    // Slow scroll through the entire page so viewers see every section.
    for (let i = 0; i < 12; i++) {
      await newTab.evaluate(() => window.scrollBy({ top: 500, behavior: "smooth" }));
      await newTab.waitForTimeout(1_100);
    }

    await beat(newTab, 2_000);
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 13. BACK TO PACKAGES DASHBOARD
  // Show the new package appearing in the list.
  // ════════════════════════════════════════════════════════════════════════════
  console.log("Step 13 — Back to packages dashboard");
  const backBtn = page.getByText("Back to dashboard");
  if (await backBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
    await backBtn.click();
  } else {
    await page.goto(`${BASE}/packages`);
  }
  await page.waitForLoadState("domcontentloaded");
  await beat(page, 2_500);

  // Scroll to show the newly published package card.
  await slowScroll(page, 400, 3);
  await beat(page, 2_000);

  // ── WRAP UP ───────────────────────────────────────────────────────────────
  await context.close();
  await browser.close();

  const files = fs.readdirSync(videosDir)
    .map((f) => ({ f, mtime: fs.statSync(path.join(videosDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  console.log(files.length
    ? `\n✓ Video saved: videos/${files[0].f}\n`
    : "\n✓ Done — check the videos/ directory.\n"
  );
}

main().catch((err) => {
  console.error("Recording failed:", err);
  process.exit(1);
});
