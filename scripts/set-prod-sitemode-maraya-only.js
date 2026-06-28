/**
 * PROD: make "site" mode (homepage at root) exclusive to maraya-journeys.
 *
 * With ROOT_FLIP_ENABLED=true the per-agency default is "site", so EVERY agency
 * without an explicit siteMode would serve a homepage at root. To scope the
 * rollout to maraya only, we set siteMode explicitly on every agency:
 *   - maraya-journeys        -> "site"
 *   - every other agency     -> "catalog"
 *
 * Run this BEFORE flipping ROOT_FLIP_ENABLED on prod, so no other agency ever
 * serves a homepage at root.
 *
 * Touches ONLY users/{uid}.siteMode. Does not read or write packages.
 *
 * Dry-run (default):  node scripts/set-prod-sitemode-maraya-only.js
 * Commit:             node scripts/set-prod-sitemode-maraya-only.js --commit
 */
const admin = require("firebase-admin");

const SITE_AGENCY = "maraya-journeys";
const COMMIT = process.argv.includes("--commit");

const db = admin
  .initializeApp({ credential: admin.credential.cert(require("../serviceAccountKey.json")) }, "prod")
  .firestore();

(async () => {
  const snap = await db.collection("users").get();
  const agencies = snap.docs.filter((d) => d.data().agencySlug);

  console.log(`Prod users: ${snap.size} | with agencySlug: ${agencies.length}\n`);

  const plan = [];
  for (const doc of agencies) {
    const d = doc.data();
    const target = d.agencySlug === SITE_AGENCY ? "site" : "catalog";
    const current = d.siteMode === "catalog" ? "catalog" : d.siteMode === "site" ? "site" : "(unset→site)";
    if (current !== target) plan.push({ doc, slug: d.agencySlug, from: current, target });
  }

  console.log(`Will update ${plan.length} of ${agencies.length} agencies:`);
  for (const p of plan) console.log(`  ${p.slug}: ${p.from} -> ${p.target}`);
  const unchanged = agencies.length - plan.length;
  if (unchanged) console.log(`  (${unchanged} already correct)`);

  if (!COMMIT) {
    console.log("\n[DRY RUN] No writes. Re-run with --commit to apply.");
    process.exit(0);
  }

  let batch = db.batch();
  let n = 0;
  for (const p of plan) {
    batch.set(p.doc.ref, { siteMode: p.target }, { merge: true });
    if (++n % 400 === 0) { await batch.commit(); batch = db.batch(); }
  }
  if (n % 400 !== 0) await batch.commit();
  console.log(`\n✅ Updated siteMode on ${plan.length} agencies. maraya-journeys -> site; all others -> catalog.`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
