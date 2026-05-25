/**
 * One-time migration: rewrite legacy Firestore package documents to v2 format.
 *
 * What this script does:
 *   1. title / description: plain string → { en, ar } LocalizedString
 *   2. guide section → people section with role:"guide"
 *   3. agent flat field → people section with role based on agent.role
 *   4. flat trek fields → trek_profile section
 *   5. flat scarcity fields → scarcity section (saving + viewersNow REMOVED)
 *   6. gallery + video + map sections → single media section
 *   7. flights + departure_dates sections → single departures section
 *   8. payment_plan section → folded into pricing.paymentContent + pricing.paymentSteps
 *   9. language field → primaryLanguage
 *  10. isActive boolean → status: "active" | "draft"
 *  11. booking_terms section → folded into pricing.termsContent
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/migrate-packages-v2.js [--dry-run]
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/migrate-packages-v2.js --detect-arabic
 *
 * Run with --dry-run first to preview changes without writing.
 *
 * --detect-arabic:
 *   Scans ALL packages for documents that contain Arabic-range characters in
 *   title or description but have NO language / primaryLanguage field set.
 *   Reports a list for manual review — does NOT write anything.
 *   Packages with language:"ar" or primaryLanguage:"ar" are excluded (already
 *   handled correctly by the migration).
 */

const admin = require("firebase-admin");

const isDryRun       = process.argv.includes("--dry-run");
const isDetectArabic = process.argv.includes("--detect-arabic");

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("Set GOOGLE_APPLICATION_CREDENTIALS to your service account key JSON.");
  process.exit(1);
}

// ─── Arabic detection helpers ─────────────────────────────────────────────────

/** True if the string contains any character in the Arabic Unicode blocks. */
function containsArabic(s) {
  if (!s || typeof s !== "string") return false;
  // Covers: Arabic (0600–06FF), Arabic Supplement (0750–077F),
  // Arabic Extended-A (08A0–08FF), Arabic Presentation Forms-A (FB50–FDFF),
  // Arabic Presentation Forms-B (FE70–FEFF)
  return /[؀-ۿݐ-ݿࢠ-ࣿﭐ-﷿ﹰ-﻿]/.test(s);
}

/** Extract a plain string from a title/description that may be a plain string or {en,ar} object. */
function plainText(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") return String(v.en || v.ar || "");
  return String(v);
}

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

// ─── helpers ─────────────────────────────────────────────────────────────────

function isLocalized(v) {
  return v && typeof v === "object" && ("en" in v || "ar" in v);
}

function toLocalized(v, primaryLang) {
  if (!v || isLocalized(v)) return v;
  const s = String(v);
  return primaryLang === "ar" ? { en: "", ar: s } : { en: s, ar: "" };
}

function getSection(sections, ...types) {
  for (const type of types) {
    const s = sections.find((x) => x.type === type);
    if (s) return s;
  }
  return null;
}

function getAllSections(sections, type) {
  return sections.filter((x) => x.type === type);
}

function nextOrder(sections) {
  return sections.length > 0 ? Math.max(...sections.map((s) => s.order ?? 0)) + 1 : 0;
}

// ─── migration logic ──────────────────────────────────────────────────────────

function migratePackage(docId, data) {
  const changes = [];
  const update = {};

  const primaryLang = data.primaryLanguage || data.language || "en";

  // 1. title / description → LocalizedString
  if (data.title && !isLocalized(data.title)) {
    update.title = toLocalized(data.title, primaryLang);
    changes.push("title → LocalizedString");
  }
  if (data.description && !isLocalized(data.description)) {
    update.description = toLocalized(data.description, primaryLang);
    changes.push("description → LocalizedString");
  }

  // 9. language → primaryLanguage (delete old field via FieldValue.delete())
  if (data.language && !data.primaryLanguage) {
    update.primaryLanguage = data.language === "ar" ? "ar" : "en";
    update.language = admin.firestore.FieldValue.delete();
    changes.push("language → primaryLanguage");
  }

  // 10. isActive → status
  if (data.isActive !== undefined && !data.status) {
    update.status = data.isActive ? "active" : "draft";
    changes.push(`isActive:${data.isActive} → status:${update.status}`);
  }

  // Remove never-stored fields
  if (data.saving !== undefined) {
    update.saving = admin.firestore.FieldValue.delete();
    changes.push("removed: saving (derived at render)");
  }
  if (data.viewersNow !== undefined) {
    update.viewersNow = admin.firestore.FieldValue.delete();
    changes.push("removed: viewersNow (runtime)");
  }

  // Section migrations
  let sections = Array.isArray(data.sections) ? [...data.sections] : [];
  let sectionsChanged = false;

  // 2. guide section → people section
  const guideSec = getSection(sections, "guide");
  if (guideSec && !getSection(sections, "people")) {
    sections = sections.filter((s) => s.type !== "guide");
    sections.push({
      id:    `people_from_guide_${Date.now()}`,
      type:  "people",
      order: guideSec.order,
      data: {
        people: [{
          id:        "guide_migrated",
          role:      "guide",
          name:      guideSec.data.name || "",
          bio:       guideSec.data.bio  || "",
          photo:     guideSec.data.photo || "",
          languages: guideSec.data.languages || [],
          years:     0,
          repliesIn: "",
        }],
      },
    });
    sectionsChanged = true;
    changes.push("guide section → people section");
  }

  // 3. agent flat field → people section (if not already migrated from guide)
  if (data.agent?.name && !getSection(sections, "people")) {
    sections.push({
      id:    `people_from_agent_${Date.now()}`,
      type:  "people",
      order: nextOrder(sections),
      data: {
        people: [{
          id:        "agent_migrated",
          role:      data.agent.role || "agent",
          name:      data.agent.name,
          bio:       "",
          photo:     data.agent.avatar || "",
          languages: [],
          years:     data.agent.years  || 0,
          repliesIn: data.agent.repliesIn || "",
        }],
      },
    });
    sectionsChanged = true;
    changes.push("agent flat field → people section");
  }
  if (data.agent !== undefined) {
    update.agent = admin.firestore.FieldValue.delete();
    if (!changes.some((c) => c.includes("agent"))) changes.push("removed: agent (legacy flat field)");
  }

  // 4. flat trek fields → trek_profile section
  if ((data.difficulty || data.maxAltitude || data.distanceKm) && !getSection(sections, "trek_profile")) {
    sections.push({
      id:    `trek_profile_${Date.now()}`,
      type:  "trek_profile",
      order: nextOrder(sections),
      data: {
        difficulty:  data.difficulty  || "",
        maxAltitude: data.maxAltitude || 0,
        distanceKm:  data.distanceKm  || 0,
        fitnessNote: data.fitnessNote || "",
      },
    });
    sectionsChanged = true;
    changes.push("flat trek fields → trek_profile section");
  }
  const trekLegacy = [];
  for (const f of ["difficulty", "maxAltitude", "distanceKm", "fitnessNote"]) {
    if (data[f] !== undefined) { update[f] = admin.firestore.FieldValue.delete(); trekLegacy.push(f); }
  }
  if (trekLegacy.length) changes.push("removed: " + trekLegacy.join(", ") + " (legacy trek flat fields)");

  // 5. flat scarcity fields → scarcity section
  if ((data.priceWas || data.spotsRemaining) && !getSection(sections, "scarcity")) {
    sections.push({
      id:    `scarcity_${Date.now()}`,
      type:  "scarcity",
      order: nextOrder(sections),
      data: {
        wasPrice:           data.priceWas           || "",
        spotsRemaining:     data.spotsRemaining     || 0,
        totalSpots:         data.totalSpots         || 0,
        firstDepartureDate: data.departures?.[0]?.date || "",
      },
    });
    sectionsChanged = true;
    changes.push("flat scarcity fields → scarcity section");
  }
  const scarcityLegacy = [];
  for (const f of ["priceWas", "spotsRemaining", "totalSpots"]) {
    if (data[f] !== undefined) { update[f] = admin.firestore.FieldValue.delete(); scarcityLegacy.push(f); }
  }
  if (scarcityLegacy.length) changes.push("removed: " + scarcityLegacy.join(", ") + " (legacy scarcity flat fields)");

  // 6. gallery + video + map → media section
  const gallerySec = getSection(sections, "gallery");
  const videoSec   = getSection(sections, "video");
  const mapSec     = getSection(sections, "map");
  if ((gallerySec || videoSec || mapSec) && !getSection(sections, "media")) {
    const minOrder = Math.min(
      gallerySec?.order ?? 999,
      videoSec?.order   ?? 999,
      mapSec?.order     ?? 999
    );
    sections = sections.filter((s) => !["gallery", "video", "map"].includes(s.type));
    sections.push({
      id:    `media_${Date.now()}`,
      type:  "media",
      order: minOrder,
      data: {
        images:     gallerySec?.data?.images   ?? [],
        videoUrl:   videoSec?.data?.videoUrl   ?? "",
        mapImage:   mapSec?.data?.image        ?? "",
        mapCaption: mapSec?.data?.caption      ?? "",
      },
    });
    sectionsChanged = true;
    changes.push("gallery + video + map → media section");
  }

  // 7. flights + departure_dates → departures section
  const flightsSec  = getSection(sections, "flights");
  const ddSec       = getSection(sections, "departure_dates");
  if ((flightsSec || ddSec) && !getSection(sections, "departures")) {
    const entries = [];
    if (flightsSec && Array.isArray(flightsSec.data.departures)) {
      for (const d of flightsSec.data.departures) {
        entries.push({
          date:            d.date            || "",
          spots:           0,
          price:           d.price           || "",
          origin:          d.name            || "",
          arrivingAirport: d.arrivingAirport || "",
          flyingTime:      d.flyingTime      || "",
          arrivingTime:    d.arrivingTime    || "",
          deal:            false,
        });
      }
    }
    if (ddSec && Array.isArray(ddSec.data.dates)) {
      for (const d of ddSec.data.dates) {
        entries.push({
          date:       d.date       || "",
          returnDate: d.returnDate || "",
          spots:      Number(d.spots) || 0,
          price:      d.price     || "",
          deal:       false,
        });
      }
    }
    const minOrder = Math.min(
      flightsSec?.order ?? 999,
      ddSec?.order      ?? 999
    );
    sections = sections.filter((s) => !["flights", "departure_dates"].includes(s.type));
    sections.push({
      id:    `departures_${Date.now()}`,
      type:  "departures",
      order: minOrder,
      data:  { entries },
    });
    sectionsChanged = true;
    changes.push("flights + departure_dates → departures section");
  }

  // 8. payment_plan → fold into pricing section
  const ppSec      = getSection(sections, "payment_plan");
  const pricingSec = getSection(sections, "pricing");
  if (ppSec) {
    if (pricingSec) {
      // Merge into existing pricing section
      pricingSec.data = {
        ...pricingSec.data,
        paymentContent: ppSec.data.content || "",
        paymentSteps:   ppSec.data.steps   || [],
      };
    } else {
      // No pricing section — convert payment_plan to pricing
      sections.push({
        id:    `pricing_from_pp_${Date.now()}`,
        type:  "pricing",
        order: ppSec.order,
        data: {
          tiers:          [],
          cancellation:   "",
          paymentContent: ppSec.data.content || "",
          paymentSteps:   ppSec.data.steps   || [],
        },
      });
    }
    sections = sections.filter((s) => s.type !== "payment_plan");
    sectionsChanged = true;
    changes.push("payment_plan → folded into pricing");
  }

  // 11. booking_terms → fold into pricing.termsContent
  const btSec = getSection(sections, "booking_terms");
  if (btSec) {
    // Re-fetch pricing after possible creation above
    const pricingSecNow = getSection(sections, "pricing");
    if (pricingSecNow) {
      pricingSecNow.data = {
        ...pricingSecNow.data,
        termsContent: btSec.data.content || "",
      };
    } else {
      sections.push({
        id:    `pricing_from_bt_${Date.now()}`,
        type:  "pricing",
        order: btSec.order,
        data: {
          tiers:          [],
          cancellation:   "",
          paymentContent: "",
          paymentSteps:   [],
          termsContent:   btSec.data.content || "",
        },
      });
    }
    sections = sections.filter((s) => s.type !== "booking_terms");
    sectionsChanged = true;
    changes.push("booking_terms → folded into pricing.termsContent");
  }

  if (sectionsChanged) {
    // Re-number order to close gaps
    sections.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
    sections.forEach((s, i) => { s.order = i; });
    update.sections = sections;
  }

  return { changes, update };
}

// ─── Arabic detection run ─────────────────────────────────────────────────────

async function detectArabic() {
  console.log("\nPackmetrix — Arabic language detection scan\n" + "=".repeat(50));
  console.log("Scanning for packages with Arabic text but no language field set.\n");
  console.log("Packages already marked language/primaryLanguage:'ar' are EXCLUDED\n");
  console.log("(they are handled correctly by the standard migration).\n");

  const snapshot = await db.collection("packages").get();
  console.log(`Scanned ${snapshot.size} documents.\n`);

  const flagged = [];

  for (const docSnap of snapshot.docs) {
    const d = docSnap.data();

    // Skip docs that already have a language marker
    if (d.primaryLanguage || d.language) continue;

    // Skip docs already in v2 (LocalizedString) — they were migrated correctly
    if (d.title && typeof d.title === "object" && ("en" in d.title || "ar" in d.title)) continue;

    const titleText = plainText(d.title);
    const descText  = plainText(d.description);

    if (containsArabic(titleText) || containsArabic(descText)) {
      flagged.push({
        id:          docSnap.id,
        title:       titleText.slice(0, 80),
        description: descText.slice(0, 60),
      });
    }
  }

  if (flagged.length === 0) {
    console.log("✓ No ambiguous packages found — all Arabic-text docs already have a language field.");
    return;
  }

  console.log(`⚠  Found ${flagged.length} package(s) with Arabic text but no language field:\n`);
  console.log("  ID                              | Title (truncated)");
  console.log("  " + "-".repeat(70));
  for (const pkg of flagged) {
    const id = pkg.id.padEnd(32);
    console.log(`  ${id} | ${pkg.title || "(no title)"}`);
    if (pkg.description) {
      console.log(`  ${"".padEnd(32)} | desc: ${pkg.description}`);
    }
  }
  console.log("\nAction: for each package above, either:");
  console.log("  a) Add language:\"ar\" to the Firestore doc manually, then run the migration.");
  console.log("  b) Confirm it is actually an English package with an Arabic place name (leave it).");
  console.log("\nNo documents were written.");
}

// ─── main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nPackmetrix v2 migration — ${isDryRun ? "DRY RUN (no writes)" : "LIVE RUN"}\n`);

  const snapshot = await db.collection("packages").get();
  console.log(`Found ${snapshot.size} package documents.\n`);

  let migrated = 0;
  let skipped  = 0;
  const batch  = db.batch();
  let batchCount = 0;

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    const { changes, update } = migratePackage(docSnap.id, data);

    if (changes.length === 0) {
      skipped++;
      continue;
    }

    console.log(`[${docSnap.id}] ${changes.join(", ")}`);
    migrated++;

    if (!isDryRun) {
      batch.update(docSnap.ref, update);
      batchCount++;
      // Firestore batch limit: 500 writes
      if (batchCount >= 490) {
        await batch.commit();
        batchCount = 0;
        console.log("  (batch committed)");
      }
    }
  }

  if (!isDryRun && batchCount > 0) {
    await batch.commit();
  }

  console.log(`\nDone. ${migrated} migrated, ${skipped} already up to date.`);
  if (isDryRun) console.log("(Dry run — no documents were written.)");
}

(isDetectArabic ? detectArabic : main)().catch((err) => { console.error(err); process.exit(1); });
