/**
 * Syncs coverImage + media section (images, videoUrl, mapImage, mapCaption)
 * from every Arabic demo package to its English counterpart.
 *
 * Source of truth: Firestore (the Arabic packages as they were edited in the builder).
 * Writes to   : Firestore EN packages  +  scripts/sample-packages.json
 *
 * AR → EN demoSampleId mapping: replace "-ar-" with "-en-"
 *   e.g.  sakina-ar-1  →  sakina-en-1
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/sync-demo-media-ar-to-en.js
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/sync-demo-media-ar-to-en.js --dry-run
 */

"use strict";

const admin = require("firebase-admin");
const path  = require("path");
const fs    = require("fs");

const isDryRun = process.argv.includes("--dry-run");

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error("Set GOOGLE_APPLICATION_CREDENTIALS to your service account key JSON.");
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

const TARGET_EMAIL   = "hello@packmetrix.com";
const JSON_PATH      = path.join(__dirname, "sample-packages.json");

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nPackmetrix — Sync AR → EN demo media — ${isDryRun ? "DRY RUN" : "LIVE"}`);
  console.log("=".repeat(60) + "\n");

  // 1. Look up the user
  const userSnap = await db.collection("users").where("email", "==", TARGET_EMAIL).limit(1).get();
  if (userSnap.empty) { console.error(`User not found: ${TARGET_EMAIL}`); process.exit(1); }
  const userId = userSnap.docs[0].id;
  console.log(`userId: ${userId}\n`);

  // 2. Fetch all demo packages for this user
  const demoSnap = await db.collection("packages")
    .where("userId", "==", userId)
    .where("isDemo",  "==", true)
    .get();

  if (demoSnap.empty) {
    console.log("No demo packages found. Run seed-sample-packages.js first.");
    return;
  }

  // 3. Index by demoSampleId
  const byId = {};
  for (const doc of demoSnap.docs) {
    const d = doc.data();
    if (d.demoSampleId) byId[d.demoSampleId] = { ref: doc.ref, data: d };
  }

  console.log(`Found ${Object.keys(byId).length} demo packages.\n`);

  // 4. Find all AR packages and pair them with their EN counterparts
  const arIds = Object.keys(byId).filter(id => id.includes("-ar-"));
  if (arIds.length === 0) {
    console.log("No AR packages found (no demoSampleId containing '-ar-').");
    return;
  }

  // 5. Load the JSON so we can patch it too
  let jsonEntries = [];
  if (fs.existsSync(JSON_PATH)) {
    jsonEntries = JSON.parse(fs.readFileSync(JSON_PATH, "utf-8"));
  }

  const changes = [];  // accumulate for summary

  for (const arId of arIds) {
    const enId = arId.replace("-ar-", "-en-");
    const ar   = byId[arId];
    const en   = byId[enId];

    if (!ar) { console.warn(`  [SKIP] ${arId} not found in Firestore`); continue; }
    if (!en) { console.warn(`  [SKIP] No EN counterpart found for ${arId} (expected ${enId})`); continue; }

    // Extract media from the AR Firestore document
    const arCoverImage = ar.data.coverImage || "";
    const arMediaSec   = findMediaSection(ar.data.sections);
    const arImages     = arMediaSec?.images     ?? ar.data.images   ?? [];
    const arVideoUrl   = arMediaSec?.videoUrl   ?? ar.data.videoUrl ?? "";
    const arMapImage   = arMediaSec?.mapImage   ?? "";
    const arMapCaption = arMediaSec?.mapCaption ?? "";

    // Compare with EN current values
    const enCoverImage = en.data.coverImage || "";
    const enMediaSec   = findMediaSection(en.data.sections);
    const enImages     = enMediaSec?.images   ?? en.data.images   ?? [];
    const enVideoUrl   = enMediaSec?.videoUrl ?? en.data.videoUrl ?? "";

    const coverChanged  = arCoverImage !== enCoverImage;
    const imagesChanged = JSON.stringify(arImages) !== JSON.stringify(enImages);
    const videoChanged  = arVideoUrl   !== enVideoUrl;

    console.log(`${arId}  →  ${enId}`);
    console.log(`  coverImage : ${coverChanged  ? "CHANGED" : "same"}`);
    console.log(`  images     : ${imagesChanged ? "CHANGED" : "same"} (${arImages.length} image(s))`);
    console.log(`  videoUrl   : ${videoChanged  ? "CHANGED" : "same"}${arVideoUrl ? " → " + arVideoUrl.slice(0, 60) : ""}`);

    if (!coverChanged && !imagesChanged && !videoChanged) {
      console.log("  → already in sync, nothing to do\n");
      continue;
    }

    // ── Update EN package in Firestore ──────────────────────────────────────
    const firestoreUpdate = {
      coverImage: arCoverImage,
      images:     arImages,      // flat compat field
      videoUrl:   arVideoUrl,    // flat compat field
      sections:   patchMediaSection(en.data.sections, arImages, arVideoUrl, arMapImage, arMapCaption),
      updatedAt:  Date.now(),
    };

    if (!isDryRun) {
      await en.ref.update(firestoreUpdate);
      console.log(`  ✓ Firestore EN package updated`);
    } else {
      console.log(`  [DRY RUN] would update EN Firestore package`);
    }

    // ── Patch sample-packages.json ──────────────────────────────────────────
    const jsonIdx = jsonEntries.findIndex(e => e && e.demoSampleId === enId);
    if (jsonIdx !== -1) {
      jsonEntries[jsonIdx].coverImage = arCoverImage;

      const mediaSec = (jsonEntries[jsonIdx].sections || []).find(s => s.type === "media");
      if (mediaSec) {
        mediaSec.data.images     = arImages;
        mediaSec.data.videoUrl   = arVideoUrl;
        mediaSec.data.mapImage   = arMapImage;
        mediaSec.data.mapCaption = arMapCaption;
      }

      console.log(`  ✓ sample-packages.json patched for ${enId}`);
    } else {
      console.log(`  [WARN] ${enId} not found in sample-packages.json`);
    }

    changes.push({ arId, enId, coverChanged, imagesChanged, videoChanged });
    console.log();
  }

  // ── Write updated JSON ────────────────────────────────────────────────────
  if (!isDryRun && changes.length > 0) {
    fs.writeFileSync(JSON_PATH, JSON.stringify(jsonEntries, null, 2), "utf-8");
    console.log(`sample-packages.json updated (${changes.length} EN package(s) patched).\n`);
  }

  console.log("=".repeat(60));
  if (changes.length === 0) {
    console.log("\nAll EN packages already match their AR counterparts — nothing changed.");
  } else {
    console.log(`\nDone. ${changes.length} EN package(s) synced from AR.`);
  }
  if (isDryRun) console.log("(Dry run — no writes to Firestore or JSON.)");
  console.log();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findMediaSection(sections) {
  if (!Array.isArray(sections)) return null;
  return sections.find(s => s.type === "media")?.data ?? null;
}

function patchMediaSection(sections, images, videoUrl, mapImage, mapCaption) {
  if (!Array.isArray(sections)) return sections;
  return sections.map(s => {
    if (s.type !== "media") return s;
    return {
      ...s,
      data: { ...s.data, images, videoUrl, mapImage, mapCaption },
    };
  });
}

main().catch(err => { console.error("\nFatal error:", err.message || err); process.exit(1); });
