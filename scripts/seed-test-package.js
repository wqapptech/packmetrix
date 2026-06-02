/**
 * Seeds one sample package (aurora-en-1) under a target email in production.
 * Purpose: verify custom domain routing works end-to-end.
 *
 * Usage:
 *   node --env-file=.env.local scripts/seed-test-package.js
 *   node --env-file=.env.local scripts/seed-test-package.js --dry-run
 */

"use strict";

const admin = require("firebase-admin");
const path  = require("path");
const fs    = require("fs");

const isDryRun = process.argv.includes("--dry-run");

// ── Bootstrap ──────────────────────────────────────────────────────────────────
if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("Missing GOOGLE_APPLICATION_CREDENTIALS\nExample: GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/seed-test-package.js");
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

// ── Config ─────────────────────────────────────────────────────────────────────
const TARGET_EMAIL   = "wqapptech@gmail.com";
const DEMO_SAMPLE_ID = "aurora-en-1";
const BASE_URL       = (process.env.NEXT_PUBLIC_BASE_URL || "https://packmetrix.com").replace(/\/$/, "");

// ── Helpers ────────────────────────────────────────────────────────────────────
function slugify(text) {
  if (!text) return "";
  return text.toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "").trim()
    .replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

function getSecData(sections, type) {
  return sections.find(s => s.type === type)?.data;
}

function buildDocument(entry, userId, agencySlug) {
  const sections = (entry.sections || []).map((s, i) => ({
    id:    `${entry.demoSampleId}__${s.type}__${i}`,
    type:  s.type,
    order: i,
    data:  s.data || {},
  }));

  const inclusions   = getSecData(sections, "inclusions");
  const itinerarySec = getSecData(sections, "itinerary");
  const pricingSec   = getSecData(sections, "pricing");
  const hotelSecs    = sections.filter(s => s.type === "hotel");
  const mediaSec     = getSecData(sections, "media");
  const peopleSec    = getSecData(sections, "people");
  const depSec       = getSecData(sections, "departures");

  const hotelDescription = hotelSecs.length > 0
    ? String(hotelSecs[0].data.description ?? "") : "";

  const firstPerson = peopleSec?.people?.[0];
  const agent = firstPerson ? {
    name: String(firstPerson.name ?? ""),
    role: String(firstPerson.role ?? "agent"),
    ...(firstPerson.photo     ? { avatar:    String(firstPerson.photo) }     : {}),
    ...(firstPerson.years     ? { years:     Number(firstPerson.years) }     : {}),
    ...(firstPerson.repliesIn ? { repliesIn: String(firstPerson.repliesIn) } : {}),
  } : null;

  const legacyDepartures = (depSec?.entries ?? [])
    .filter(e => e.date)
    .map(e => ({ date: String(e.date ?? ""), spots: Number(e.spots) || 0, ...(e.price ? { price: String(e.price) } : {}) }));

  const airports = (depSec?.entries ?? [])
    .filter(e => e.origin)
    .map(e => ({ name: String(e.origin ?? ""), price: String(e.price ?? ""), ...(e.date ? { date: String(e.date) } : {}) }));

  const doc = {
    userId,
    agencySlug,
    templateId:      entry.templateId || "",
    title:           { en: entry.titleEn || "", ar: entry.titleAr || "" },
    description:     { en: entry.descriptionEn || "", ar: entry.descriptionAr || "" },
    destination:     entry.destination   || "",
    price:           entry.price         || "",
    nights:          entry.nights        || null,
    whatsapp:        entry.whatsapp      || "",
    messenger:       entry.messenger     || "",
    coverImage:      entry.coverImage    || "",
    primaryLanguage: entry.primaryLanguage || "en",
    language:        entry.primaryLanguage || "en",
    sections,
    includes:        Array.isArray(inclusions?.includes)   ? inclusions.includes  : [],
    excludes:        Array.isArray(inclusions?.excludes)   ? inclusions.excludes  : [],
    itinerary:       Array.isArray(itinerarySec?.days)     ? itinerarySec.days    : [],
    pricingTiers:    Array.isArray(pricingSec?.tiers)      ? pricingSec.tiers     : [],
    cancellation:    pricingSec?.cancellation              || "",
    hotelDescription,
    images:          Array.isArray(mediaSec?.images)       ? mediaSec.images      : [],
    videoUrl:        mediaSec?.videoUrl                    || "",
    airports,
    reviews:         [],
    advantages:      [],
    agent,
    ...(legacyDepartures.length ? { departures: legacyDepartures } : {}),
    status:       "active",
    isDemo:       true,
    demoSampleId: entry.demoSampleId,
    views:           0,
    whatsappClicks:  0,
    messengerClicks: 0,
  };

  if (entry.currency) doc.currency = entry.currency;
  return doc;
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\nPackmetrix — Seed Test Package — ${isDryRun ? "DRY RUN" : "LIVE"}`);
  console.log(`Target: ${TARGET_EMAIL}   Sample: ${DEMO_SAMPLE_ID}\n`);

  // Load sample data
  const jsonPath = path.join(__dirname, "sample-packages.json");
  const samples  = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const entry    = samples.find(e => e.demoSampleId === DEMO_SAMPLE_ID);
  if (!entry) { console.error(`Sample "${DEMO_SAMPLE_ID}" not found`); process.exit(1); }

  // Resolve user
  const userQuery = await db.collection("users").where("email", "==", TARGET_EMAIL).limit(1).get();
  if (userQuery.empty) { console.error(`User not found: ${TARGET_EMAIL}`); process.exit(1); }

  const userDoc    = userQuery.docs[0];
  const userId     = userDoc.id;
  const userData   = userDoc.data();
  const agencyName = userData.name || "";
  const emailPfx   = slugify((userData.email || "").split("@")[0]);
  const agencySlug = slugify(agencyName) || emailPfx || userId.slice(0, 8).toLowerCase();
  const customDomain = userData.customDomain || null;

  console.log(`userId      : ${userId}`);
  console.log(`agencySlug  : ${agencySlug}`);
  console.log(`customDomain: ${customDomain || "(none set)"}\n`);

  // Check for existing
  const existingSnap = await db.collection("packages")
    .where("userId", "==", userId)
    .where("demoSampleId", "==", DEMO_SAMPLE_ID)
    .limit(1)
    .get();

  const doc = buildDocument(entry, userId, agencySlug);
  let packageId;

  if (!existingSnap.empty) {
    const existing     = existingSnap.docs[0];
    const existingData = existing.data();
    packageId          = existing.id;
    if (!isDryRun) {
      await existing.ref.update({ ...doc, createdAt: existingData.createdAt ?? Date.now(), updatedAt: Date.now() });
      console.log(`[UPDATED] ${packageId}`);
    } else {
      console.log(`[DRY RUN: would UPDATE] ${packageId}`);
    }
  } else {
    if (!isDryRun) {
      const newRef = await db.collection("packages").add({ ...doc, createdAt: Date.now() });
      packageId    = newRef.id;
      console.log(`[CREATED] ${packageId}`);
    } else {
      packageId = "(dry-run)";
      console.log(`[DRY RUN: would CREATE]`);
    }
  }

  console.log("\n── URLs ──────────────────────────────────────────────");
  console.log(`  Subdomain : ${BASE_URL}/${agencySlug}/${packageId}`);
  if (customDomain) {
    console.log(`  Custom    : https://${customDomain}/${packageId}`);
  }
  console.log();
}

main().catch(err => { console.error("Fatal:", err.message || err); process.exit(1); });
