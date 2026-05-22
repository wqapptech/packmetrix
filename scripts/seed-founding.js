/**
 * One-time seed + migration for the Founding Member launch.
 *
 * What it does:
 *  1. Migrates all existing paid users (plan = start | grow | scale) → "founding"
 *     because these are all pre-launch customers who deserve the founding rate.
 *  2. Leaves free/trial users untouched.
 *  3. Creates (or corrects) config/foundingCounter with:
 *       claimed = actual count of users with plan === "founding" AND stripeSubscriptionId
 *       cap     = 50
 *
 * Run (Node 20+):
 *   node --env-file=.env.local scripts/seed-founding.js
 *
 * Safe to run multiple times — idempotent.
 */

const admin = require("firebase-admin");

// ---------------------------------------------------------------------------
// Bootstrap Firebase Admin
// ---------------------------------------------------------------------------
const rawKey = process.env.FIREBASE_ADMIN_KEY;
if (!rawKey) throw new Error("Missing FIREBASE_ADMIN_KEY");

const serviceAccount = JSON.parse(rawKey);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});

const db = admin.firestore();

const LEGACY_PAID_PLANS = new Set(["start", "grow", "scale", "pro"]);

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
async function main() {
  const snap = await db.collection("users").get();
  console.log(`\nFound ${snap.size} users.\n`);

  let migrated = 0;
  let alreadyFounding = 0;
  let skipped = 0;

  const batch = db.batch();
  let batchCount = 0;

  for (const docSnap of snap.docs) {
    const uid = docSnap.id;
    const user = docSnap.data();
    const plan = user.plan ?? "free";
    const hasSub = !!user.stripeSubscriptionId;

    if (plan === "founding") {
      alreadyFounding++;
      console.log(`  [${uid}]  already founding — skip`);
      continue;
    }

    if (plan === "standard") {
      // Standard members are already on the new plan — leave them
      console.log(`  [${uid}]  standard — skip`);
      skipped++;
      continue;
    }

    if (LEGACY_PAID_PLANS.has(plan)) {
      // Migrate all legacy paid plans — with or without a Stripe subscription
      batch.update(docSnap.ref, { plan: "founding", updatedAt: Date.now() });
      migrated++;
      batchCount++;
      console.log(`  [${uid}]  ${plan} → founding${hasSub ? "" : " (no sub — manual plan)"}`);
    } else {
      // free / trial users
      skipped++;
    }

    // Firestore batches are capped at 500 writes
    if (batchCount === 499) {
      await batch.commit();
      console.log("  [batch committed — 499 writes]");
      batchCount = 0;
    }
  }

  if (batchCount > 0) await batch.commit();

  // ---------------------------------------------------------------------------
  // Count true founding members (post-migration)
  // ---------------------------------------------------------------------------
  const foundingSnap = await db
    .collection("users")
    .where("plan", "==", "founding")
    .get();

  // Only count those who actually paid (have a subscription)
  const claimed = foundingSnap.docs.filter(d => !!d.data().stripeSubscriptionId).length;

  // ---------------------------------------------------------------------------
  // Write the counter doc
  // ---------------------------------------------------------------------------
  const counterRef = db.collection("config").doc("foundingCounter");
  await counterRef.set({ claimed, cap: 50 }, { merge: true });

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Users migrated to founding : ${migrated}
  Already on founding         : ${alreadyFounding}
  Skipped (free/trial/std)    : ${skipped}
  ─────────────────────────────────────
  foundingCounter.claimed     : ${claimed}
  foundingCounter.cap         : 50
  Spots remaining             : ${Math.max(0, 50 - claimed)}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
