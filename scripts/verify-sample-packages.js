/**
 * Verify all seeded demo packages under hello@packmetrix.com render correctly.
 *
 * For each document where isDemo==true, this script:
 *   1. Fetches the raw Firestore document (same as the live page does).
 *   2. Runs a JS port of normalizePkg() to hydrate flat fields from sections[].
 *   3. Checks that every field the template renderer needs is present and non-empty.
 *   4. Reports a pass/fail summary.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/verify-sample-packages.js
 *
 * Exit code 0 = all pass.  Exit code 1 = one or more failures (or fatal error).
 */

"use strict";

const admin = require("firebase-admin");

// ─── Credentials ──────────────────────────────────────────────────────────────

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    "Error: GOOGLE_APPLICATION_CREDENTIALS is not set.\n" +
    "Example:\n" +
    "  GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/verify-sample-packages.js"
  );
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

const TARGET_EMAIL = "hello@packmetrix.com";

// ─── JS port of normalizePkg (key subset) ─────────────────────────────────────

function resolveLocStr(v, lang) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    if (typeof v[lang] === "string" && v[lang]) return v[lang];
    if (typeof v.en   === "string" && v.en)   return v.en;
    if (typeof v.ar   === "string" && v.ar)   return v.ar;
  }
  return String(v);
}

function getSecData(sections, type) {
  return sections.find(s => s.type === type)?.data;
}

function strArr(v) {
  return Array.isArray(v) ? v.filter(x => typeof x === "string") : [];
}

function str(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") return String(v.en || v.ar || "");
  return String(v);
}

/**
 * Simplified normalizePkg — hydrates the flat fields that templates rely on
 * from the v2 sections[] array.  Returns an object with the same shape as
 * normalizePkg() in lib/sections/normalize.ts.
 */
function normalizePkg(raw, lang) {
  const resolvedLang = lang || (
    ((raw.primaryLanguage || raw.language) === "ar") ? "ar" : "en"
  );

  const out = { ...raw };

  // Resolve LocalizedString title/description
  out.title       = resolveLocStr(raw.title, resolvedLang) || undefined;
  out.description = resolveLocStr(raw.description, resolvedLang) || "";

  if (!Array.isArray(raw.sections) || raw.sections.length === 0) return out;

  const sections = raw.sections;

  const inclusions  = getSecData(sections, "inclusions");
  if (inclusions) {
    out.includes = strArr(inclusions.includes);
    out.excludes = strArr(inclusions.excludes);
  }

  const itinerarySec = getSecData(sections, "itinerary");
  if (Array.isArray(itinerarySec?.days)) {
    out.itinerary = itinerarySec.days.map(d => ({
      day:   typeof d.day === "number" ? d.day : Number(d.day) || 0,
      title: str(d.title),
      desc:  str(d.desc),
    }));
  }

  const pricingSec = getSecData(sections, "pricing");
  if (pricingSec) {
    if (Array.isArray(pricingSec.tiers)) {
      out.pricingTiers = pricingSec.tiers.map(t => ({
        label: resolveLocStr(t.label, resolvedLang),
        price: str(t.price),
      }));
    }
    if (pricingSec.cancellation !== undefined) {
      out.cancellation = str(pricingSec.cancellation);
    }
  }

  const hotelSecs = sections.filter(s => s.type === "hotel");
  if (hotelSecs.length > 0) {
    out.hotelDescription = str(hotelSecs[0].data.description);
  }

  const mediaSec = getSecData(sections, "media");
  if (mediaSec) {
    if (Array.isArray(mediaSec.images)) out.images   = strArr(mediaSec.images);
    if (mediaSec.videoUrl)              out.videoUrl = str(mediaSec.videoUrl);
  }

  const depSec = getSecData(sections, "departures");
  if (depSec && Array.isArray(depSec.entries) && depSec.entries.length > 0) {
    out.departures = depSec.entries
      .filter(e => e.date)
      .map(e => ({ date: str(e.date), spots: Number(e.spots) || 0 }));
  }

  const peopleSec = getSecData(sections, "people");
  if (peopleSec && Array.isArray(peopleSec.people) && peopleSec.people.length > 0) {
    const p = peopleSec.people[0];
    out.agent = {
      name: str(p.name),
      role: str(p.role) || "agent",
    };
    out.people = peopleSec.people.map((p, i) => ({
      id:        str(p.id) || `person_${i}`,
      role:      str(p.role) || "agent",
      name:      str(p.name),
    }));
  }

  const trekSec = getSecData(sections, "trek_profile");
  if (trekSec) {
    out.trekProfile = {
      difficulty:  trekSec.difficulty,
      maxAltitude: trekSec.maxAltitude,
      distanceKm:  trekSec.distanceKm,
    };
    out.difficulty  = trekSec.difficulty;
    out.maxAltitude = trekSec.maxAltitude;
    out.distanceKm  = trekSec.distanceKm;
  }

  const scarcitySec = getSecData(sections, "scarcity");
  if (scarcitySec) {
    out.scarcity = {
      wasPrice:       str(scarcitySec.wasPrice) || undefined,
      spotsRemaining: scarcitySec.spotsRemaining,
      totalSpots:     scarcitySec.totalSpots,
    };
    out.priceWas       = scarcitySec.wasPrice;
    out.spotsRemaining = scarcitySec.spotsRemaining;
  }

  const reviewsSec = getSecData(sections, "reviews");
  if (reviewsSec && Array.isArray(reviewsSec.reviews) && reviewsSec.reviews.length > 0) {
    out.reviews = reviewsSec.reviews.map((r, i) => ({
      id:     str(r.id) || `r_${i}`,
      name:   str(r.name),
      text:   str(r.text),
      rating: typeof r.rating === "number" ? r.rating : 5,
    }));
  }

  return out;
}

// ─── Checks ───────────────────────────────────────────────────────────────────

/**
 * Returns an array of failure strings for the given normalized package.
 * Empty array = all checks pass.
 */
function runChecks(raw, pkg) {
  const failures = [];

  const req = (field, label) => {
    if (!pkg[field]) failures.push(`${label || field} is empty`);
  };

  // Core fields
  req("title",       "title");
  req("description", "description");
  req("price",       "price");
  req("destination", "destination");
  req("coverImage",  "coverImage");
  req("templateId",  "templateId");
  req("agencySlug",  "agencySlug");
  req("userId",      "userId");

  // Status
  if (raw.status !== "active") {
    failures.push(`status is "${raw.status}" — expected "active"`);
  }

  // Demo markers
  if (!raw.isDemo)       failures.push("isDemo is not true");
  if (!raw.demoSampleId) failures.push("demoSampleId is missing");

  // Sections existence
  if (!Array.isArray(raw.sections) || raw.sections.length === 0) {
    failures.push("sections[] is empty");
  } else {
    const types = new Set(raw.sections.map(s => s.type));

    // Every section must have id, type, order, data
    for (const s of raw.sections) {
      if (!s.id)   failures.push(`section [${s.type}] is missing id`);
      if (!s.type) failures.push(`section missing type`);
      if (typeof s.order !== "number") failures.push(`section [${s.type}] missing numeric order`);
      if (!s.data || typeof s.data !== "object") failures.push(`section [${s.type}] missing data`);
    }

    // Warn about missing sections (not hard failures — not all templates need all 15)
    const recommended = ["itinerary", "inclusions", "pricing", "departures", "people", "media"];
    for (const t of recommended) {
      if (!types.has(t)) failures.push(`[WARN] missing recommended section: ${t}`);
    }
  }

  // Hydrated flat fields (normalizePkg should have populated these from sections)
  if (!Array.isArray(pkg.itinerary) || pkg.itinerary.length === 0) {
    failures.push("[WARN] itinerary[] is empty after normalization");
  }

  // LocalizedString title resolution
  if (raw.title && typeof raw.title === "object") {
    const hasEn = typeof raw.title.en === "string" && raw.title.en.trim().length > 0;
    const hasAr = typeof raw.title.ar === "string" && raw.title.ar.trim().length > 0;
    if (!hasEn && !hasAr) failures.push("title LocalizedString has no content in either language");
  }

  return failures;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\nPackmetrix — Verify Sample Packages");
  console.log("=".repeat(60) + "\n");

  const userQuery = await db.collection("users")
    .where("email", "==", TARGET_EMAIL)
    .limit(1)
    .get();

  if (userQuery.empty) {
    console.error(`User not found: ${TARGET_EMAIL}`);
    process.exit(1);
  }

  const userId = userQuery.docs[0].id;
  console.log(`Target user : ${TARGET_EMAIL}  (${userId})\n`);

  const demoSnap = await db.collection("packages")
    .where("userId", "==", userId)
    .where("isDemo",  "==", true)
    .get();

  if (demoSnap.empty) {
    console.log("No demo packages found. Run seed-sample-packages.js first.");
    console.log();
    return;
  }

  console.log(`Found ${demoSnap.size} demo package(s).\n`);

  let passed  = 0;
  let failed  = 0;
  let warned  = 0;

  const failedIds = [];

  for (const docSnap of demoSnap.docs) {
    const raw = { id: docSnap.id, ...docSnap.data() };
    const lang = raw.primaryLanguage || raw.language || "en";
    const pkg  = normalizePkg(raw, lang);

    const allIssues = runChecks(raw, pkg);
    const errors    = allIssues.filter(f => !f.startsWith("[WARN]"));
    const warnings  = allIssues.filter(f => f.startsWith("[WARN]"));

    const demoSampleId = raw.demoSampleId || "(unknown)";
    const templateId   = raw.templateId   || "(no template)";
    const title        = pkg.title        || "(no title)";

    if (errors.length === 0) {
      passed++;
      const warnNote = warnings.length > 0 ? `  (${warnings.length} warning(s))` : "";
      console.log(`  ✓  ${docSnap.id}  [${templateId}]  ${demoSampleId}${warnNote}`);
      console.log(`       title: ${title.slice(0, 70)}`);
      if (warnings.length > 0) {
        for (const w of warnings) console.log(`       ${w}`);
        warned += warnings.length;
      }
    } else {
      failed++;
      failedIds.push(docSnap.id);
      console.log(`  ✗  ${docSnap.id}  [${templateId}]  ${demoSampleId}`);
      console.log(`       title: ${title.slice(0, 70)}`);
      for (const e of errors)   console.log(`       ERROR: ${e}`);
      for (const w of warnings) console.log(`       ${w}`);
    }

    console.log();
  }

  console.log("=".repeat(60));
  console.log(`\nResults: ${passed} passed, ${failed} failed, ${warned} warning(s)`);

  if (failed > 0) {
    console.log(`\nFailed package IDs:`);
    for (const id of failedIds) console.log(`  ${id}`);
    console.log();
    process.exit(1);
  }

  console.log();
  process.exit(0);
}

main().catch(err => {
  console.error("\nFatal error:", err.message || err);
  process.exit(1);
});
