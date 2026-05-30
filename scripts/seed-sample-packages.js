/**
 * Seed 12 demo packages under hello@packmetrix.com in production Firestore.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/seed-sample-packages.js
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/seed-sample-packages.js --dry-run
 *
 * Idempotent: running twice will UPDATE existing packages, not create duplicates.
 * Match key: userId + demoSampleId
 *
 * Each document is marked  isDemo:true  and  demoSampleId:<string>  so it can be
 * excluded from cohort/agency-count queries and deleted cleanly by unseed script.
 *
 * Documents are written in the FULL v2 shape produced by buildApiPayload() +
 * the generate/update API routes — identical to what the builder saves.
 * No analytics events, billing changes, or notifications are triggered because
 * we write directly to Firestore via the Admin SDK, bypassing all API routes.
 */

"use strict";

const admin = require("firebase-admin");
const path  = require("path");
const fs    = require("fs");

// ─── CLI flags ────────────────────────────────────────────────────────────────

const isDryRun = process.argv.includes("--dry-run");

// ─── Credentials (same approach as migrate-packages-v2.js) ───────────────────

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    "Error: GOOGLE_APPLICATION_CREDENTIALS is not set.\n" +
    "Example:\n" +
    "  GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/seed-sample-packages.js"
  );
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

// ─── Constants ────────────────────────────────────────────────────────────────

const TARGET_EMAIL = "hello@packmetrix.com";
const BASE_URL     = (process.env.BASE_URL || "https://packmetrix.com").replace(/\/$/, "");

// ─── Pure helpers (mirrors the app's slugify & buildApiPayload exactly) ───────

function slugify(text) {
  if (!text) return "";
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Returns data of the first section with matching type, or undefined. */
function getSecData(sections, type) {
  return sections.find(s => s.type === type)?.data;
}

/**
 * Converts one entry from sample-packages.json into a complete Firestore
 * document that matches the shape produced by buildApiPayload() + generate/
 * update API routes.  All flat compat fields are derived from sections[].
 *
 * @param {object} entry   - One item from sample-packages.json
 * @param {string} userId  - Firestore UID of hello@packmetrix.com
 * @param {string} agencySlug
 * @returns {object} ready-to-write Firestore document (without createdAt/updatedAt)
 */
function buildDocument(entry, userId, agencySlug) {
  if (!entry.demoSampleId) throw new Error("Entry missing demoSampleId");

  // Attach id and order to each section (section IDs are deterministic so
  // repeated seeds produce the same section IDs — avoids phantom duplicates).
  const sections = (entry.sections || []).map((s, i) => ({
    id:    `${entry.demoSampleId}__${s.type}__${i}`,
    type:  s.type,
    order: i,
    data:  s.data || {},
  }));

  // ── Extract section data objects ──────────────────────────────────────────
  const inclusions  = getSecData(sections, "inclusions");
  const itinerarySec = getSecData(sections, "itinerary");
  const pricingSec  = getSecData(sections, "pricing");
  const hotelSecs   = sections.filter(s => s.type === "hotel");
  const mediaSec    = getSecData(sections, "media");
  const peopleSec   = getSecData(sections, "people");
  const trekSec     = getSecData(sections, "trek_profile");
  const scarcitySec = getSecData(sections, "scarcity");
  const depSec      = getSecData(sections, "departures");

  // ── Flat compat: hotelDescription ────────────────────────────────────────
  const hotelDescription = hotelSecs.length > 0
    ? String(hotelSecs[0].data.description ?? "")
    : "";

  // ── Flat compat: agent (derived from first person) ────────────────────────
  const firstPerson = peopleSec?.people?.[0];
  const agent = firstPerson ? {
    name: String(firstPerson.name ?? ""),
    role: String(firstPerson.role ?? "agent"),
    ...(firstPerson.photo     ? { avatar:    String(firstPerson.photo) }     : {}),
    ...(firstPerson.years     ? { years:     Number(firstPerson.years) }     : {}),
    ...(firstPerson.repliesIn ? { repliesIn: String(firstPerson.repliesIn) } : {}),
  } : null;

  // ── Flat compat: departures ───────────────────────────────────────────────
  const legacyDepartures = (depSec?.entries ?? [])
    .filter(e => e.date)
    .map(e => ({
      date:  String(e.date  ?? ""),
      spots: Number(e.spots) || 0,
      ...(e.price ? { price: String(e.price) } : {}),
    }));

  // ── Flat compat: airports (from departure entries that have an origin) ────
  const airports = (depSec?.entries ?? [])
    .filter(e => e.origin)
    .map(e => ({
      name:  String(e.origin ?? ""),
      price: String(e.price  ?? ""),
      ...(e.date            ? { date:            String(e.date) }            : {}),
      ...(e.arrivingAirport ? { arrivingAirport: String(e.arrivingAirport) } : {}),
      ...(e.flyingTime      ? { flyingTime:      String(e.flyingTime) }      : {}),
      ...(e.arrivingTime    ? { arrivingTime:    String(e.arrivingTime) }    : {}),
    }));

  // ── Assemble the full document ────────────────────────────────────────────
  const doc = {
    // Ownership
    userId,
    agencySlug,

    // Template
    templateId: entry.templateId || "",

    // v2 LocalizedString fields (both sides always present)
    title:       { en: entry.titleEn || "", ar: entry.titleAr || "" },
    description: { en: entry.descriptionEn || "", ar: entry.descriptionAr || "" },

    // Core
    destination:     entry.destination     || "",
    price:           entry.price           || "",
    nights:          entry.nights          || null,
    whatsapp:        entry.whatsapp        || "",
    messenger:       entry.messenger       || "",
    coverImage:      entry.coverImage      || "",

    // Language (set both so normalizePkg & any legacy code both resolve correctly)
    primaryLanguage: entry.primaryLanguage || "en",
    language:        entry.primaryLanguage || "en",

    // v2 canonical sections (single source of truth)
    sections,

    // Flat backward-compat fields derived from sections (same derivation as
    // buildApiPayload in app/builder/page.tsx lines 332-353)
    includes:         Array.isArray(inclusions?.includes)      ? inclusions.includes  : [],
    excludes:         Array.isArray(inclusions?.excludes)      ? inclusions.excludes  : [],
    itinerary:        Array.isArray(itinerarySec?.days)        ? itinerarySec.days    : [],
    pricingTiers:     Array.isArray(pricingSec?.tiers)         ? pricingSec.tiers     : [],
    cancellation:     pricingSec?.cancellation                 || "",
    hotelDescription,
    images:           Array.isArray(mediaSec?.images)          ? mediaSec.images      : [],
    videoUrl:         mediaSec?.videoUrl                       || "",
    airports,
    reviews:          [], // flat field = customer-submitted; authored reviews live in sections
    advantages:       [],

    // Legacy agent flat field (for templates that read pkg.agent directly)
    agent,

    // Trek profile extras (only when trek_profile section is present)
    ...(trekSec ? {
      difficulty:  trekSec.difficulty  || null,
      maxAltitude: trekSec.maxAltitude ?? null,
      distanceKm:  trekSec.distanceKm  ?? null,
      fitnessNote: trekSec.fitnessNote || null,
    } : {}),

    // Scarcity extras (only when scarcity section is present)
    ...(scarcitySec ? {
      priceWas:       scarcitySec.wasPrice       || null,
      spotsRemaining: scarcitySec.spotsRemaining ?? null,
      totalSpots:     scarcitySec.totalSpots      ?? null,
    } : {}),

    // Legacy departures flat field (only when entries exist)
    ...(legacyDepartures.length ? { departures: legacyDepartures } : {}),

    // Status — set explicitly so these never appear as "draft" in the dashboard
    status: "active",

    // Demo markers — used by unseed and metric exclusion logic
    isDemo:       true,
    demoSampleId: entry.demoSampleId,

    // Analytics counters (zero on create; preserved on update)
    views:           0,
    whatsappClicks:  0,
    messengerClicks: 0,
  };

  // Include currency only when provided (same behaviour as buildApiPayload)
  if (entry.currency) doc.currency = entry.currency;

  return doc;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nPackmetrix — Seed Sample Packages — ${isDryRun ? "DRY RUN (no writes)" : "LIVE RUN"}`);
  console.log("=".repeat(60) + "\n");

  // 1. Load sample content
  const jsonPath = path.join(__dirname, "sample-packages.json");
  if (!fs.existsSync(jsonPath)) {
    console.error(`Missing ${jsonPath}\nCreate it or run the script from the project root.`);
    process.exit(1);
  }

  let samples;
  try {
    samples = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  } catch (err) {
    console.error(`Failed to parse sample-packages.json: ${err.message}`);
    process.exit(1);
  }

  // Filter out comment-only entries (the first entry has _comment fields for docs)
  const validSamples = samples.filter(e => e.demoSampleId);
  console.log(`Loaded ${validSamples.length} packages from sample-packages.json\n`);

  if (validSamples.length === 0) {
    console.error("No valid entries found. Make sure each entry has a demoSampleId.");
    process.exit(1);
  }

  // 2. Resolve target user
  const userQuery = await db.collection("users")
    .where("email", "==", TARGET_EMAIL)
    .limit(1)
    .get();

  if (userQuery.empty) {
    console.error(`User not found in Firestore: ${TARGET_EMAIL}`);
    console.error("Check that the email is correct and the service account has read access.");
    process.exit(1);
  }

  const userDoc    = userQuery.docs[0];
  const userId     = userDoc.id;
  const userData   = userDoc.data();
  const agencyName = userData.name || "";
  const emailPfx   = slugify((userData.email || "").split("@")[0]);
  const agencySlug = slugify(agencyName) || emailPfx || userId.slice(0, 8).toLowerCase();

  console.log(`Target user  : ${TARGET_EMAIL}`);
  console.log(`userId       : ${userId}`);
  console.log(`agencySlug   : ${agencySlug}\n`);

  // 3. Upsert each package
  const results = [];

  for (const entry of validSamples) {
    const { demoSampleId } = entry;

    // Warn if any core content fields are still placeholders
    const hasPlaceholders = ["titleEn", "destination", "price", "coverImage"].some(
      k => String(entry[k] || "").includes("FILL_")
    );
    if (hasPlaceholders) {
      console.warn(`  [WARN] ${demoSampleId} still has FILL_ placeholder values — fill in sample-packages.json first`);
    }

    // Check for an existing doc
    const existingSnap = await db.collection("packages")
      .where("userId",       "==", userId)
      .where("demoSampleId", "==", demoSampleId)
      .limit(1)
      .get();

    const doc = buildDocument(entry, userId, agencySlug);

    if (!existingSnap.empty) {
      // UPDATE: preserve createdAt and accumulated analytics counters
      const existing    = existingSnap.docs[0];
      const existingData = existing.data();

      if (!isDryRun) {
        await existing.ref.update({
          ...doc,
          createdAt:       existingData.createdAt       ?? Date.now(),
          views:           existingData.views           ?? 0,
          whatsappClicks:  existingData.whatsappClicks  ?? 0,
          messengerClicks: existingData.messengerClicks ?? 0,
          updatedAt:       Date.now(),
        });
      }

      const packageId = existing.id;
      console.log(`  [UPDATED] ${demoSampleId.padEnd(20)} → ${packageId}`);
      results.push({ demoSampleId, packageId, lang: entry.primaryLanguage || "en" });

    } else {
      // CREATE new document
      if (!isDryRun) {
        const newRef = await db.collection("packages").add({
          ...doc,
          createdAt: Date.now(),
        });
        console.log(`  [CREATED] ${demoSampleId.padEnd(20)} → ${newRef.id}`);
        results.push({ demoSampleId, packageId: newRef.id, lang: entry.primaryLanguage || "en" });
      } else {
        console.log(`  [DRY RUN: would CREATE] ${demoSampleId}`);
        results.push({ demoSampleId, packageId: "(dry-run)", lang: entry.primaryLanguage || "en" });
      }
    }
  }

  // 4. Print published URLs grouped by language
  console.log("\n" + "=".repeat(60));
  console.log("Published URLs:\n");

  const enPkgs = results.filter(r => r.lang !== "ar");
  const arPkgs = results.filter(r => r.lang === "ar");

  if (enPkgs.length) {
    console.log("── English ─────────────────────────────────────────────");
    for (const r of enPkgs) {
      console.log(`  ${BASE_URL}/${agencySlug}/${r.packageId}`);
      console.log(`  (${r.demoSampleId})\n`);
    }
  }

  if (arPkgs.length) {
    console.log("── Arabic ──────────────────────────────────────────────");
    for (const r of arPkgs) {
      console.log(`  ${BASE_URL}/${agencySlug}/${r.packageId}`);
      console.log(`  (${r.demoSampleId})\n`);
    }
  }

  console.log("=".repeat(60));
  console.log(`\nDone. ${results.length} packages seeded under ${TARGET_EMAIL}`);
  if (isDryRun) console.log("(Dry run — no documents were written to Firestore.)");
  console.log();
}

main().catch(err => {
  console.error("\nFatal error:", err.message || err);
  process.exit(1);
});
