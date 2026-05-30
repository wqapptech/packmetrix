/**
 * Delete all demo packages seeded under hello@packmetrix.com.
 *
 * Matches documents where:
 *   userId  == <hello@packmetrix.com's UID>
 *   isDemo  == true
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/unseed-sample-packages.js --dry-run
 *   GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/unseed-sample-packages.js
 *
 * --dry-run  Preview what would be deleted without touching Firestore.
 *
 * Idempotent: running on a clean database (no demo docs) does nothing.
 */

"use strict";

const admin = require("firebase-admin");

// ─── CLI flags ────────────────────────────────────────────────────────────────

const isDryRun = process.argv.includes("--dry-run");

// ─── Credentials ──────────────────────────────────────────────────────────────

if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error(
    "Error: GOOGLE_APPLICATION_CREDENTIALS is not set.\n" +
    "Example:\n" +
    "  GOOGLE_APPLICATION_CREDENTIALS=./serviceAccountKey.json node scripts/unseed-sample-packages.js --dry-run"
  );
  process.exit(1);
}

admin.initializeApp({ credential: admin.credential.applicationDefault() });
const db = admin.firestore();

// ─── Constants ────────────────────────────────────────────────────────────────

const TARGET_EMAIL = "hello@packmetrix.com";

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(`\nPackmetrix — Unseed Sample Packages — ${isDryRun ? "DRY RUN (no deletes)" : "LIVE RUN"}`);
  console.log("=".repeat(60) + "\n");

  // 1. Resolve the target user's UID
  const userQuery = await db.collection("users")
    .where("email", "==", TARGET_EMAIL)
    .limit(1)
    .get();

  if (userQuery.empty) {
    console.error(`User not found: ${TARGET_EMAIL}`);
    process.exit(1);
  }

  const userId = userQuery.docs[0].id;
  console.log(`Target user  : ${TARGET_EMAIL}`);
  console.log(`userId       : ${userId}\n`);

  // 2. Query all demo packages under this user
  const demoSnap = await db.collection("packages")
    .where("userId", "==", userId)
    .where("isDemo",  "==", true)
    .get();

  if (demoSnap.empty) {
    console.log("Nothing to delete — no demo packages found for this user.");
    console.log();
    return;
  }

  // 3. Preview / delete
  console.log(`Found ${demoSnap.size} demo package(s):\n`);

  const toDelete = [];
  for (const docSnap of demoSnap.docs) {
    const d = docSnap.data();
    const demoSampleId = d.demoSampleId || "(no demoSampleId)";
    const title        = resolveTitle(d.title, d.primaryLanguage || d.language || "en");
    const templateId   = d.templateId || "(no template)";

    console.log(`  ${docSnap.id}  [${templateId}]  ${demoSampleId}`);
    if (title) console.log(`    Title: ${title}`);

    toDelete.push(docSnap.ref);
  }

  console.log();

  if (isDryRun) {
    console.log(`Dry run — ${toDelete.length} document(s) would be deleted. Pass no flags to confirm.`);
    console.log();
    return;
  }

  // 4. Delete in batches (Firestore limit: 500 per batch)
  let deleted = 0;
  for (let i = 0; i < toDelete.length; i += 490) {
    const batch = db.batch();
    const chunk = toDelete.slice(i, i + 490);
    for (const ref of chunk) batch.delete(ref);
    await batch.commit();
    deleted += chunk.length;
    if (toDelete.length > 490) console.log(`  (batch committed — ${deleted} deleted so far)`);
  }

  console.log("=".repeat(60));
  console.log(`\nDeleted ${deleted} demo package(s) from Firestore.`);
  console.log();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function resolveTitle(title, lang) {
  if (!title) return "";
  if (typeof title === "string") return title.slice(0, 80);
  if (typeof title === "object") {
    const v = title[lang] || title.en || title.ar || "";
    return String(v).slice(0, 80);
  }
  return String(title).slice(0, 80);
}

main().catch(err => {
  console.error("\nFatal error:", err.message || err);
  process.exit(1);
});
