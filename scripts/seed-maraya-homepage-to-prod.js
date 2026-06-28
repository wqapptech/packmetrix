/**
 * Copy the maraya-journeys AGENCY HOME PAGE DATA from staging -> prod.
 *
 * Copies ONLY the page configs that are absent in prod:
 *   users/{uid}.homepage   (the homepage section model)
 *   users/{uid}.aboutPage  (the about-page section model)
 *
 * Does NOT touch:
 *   - packages (separate `packages` collection — untouched entirely)
 *   - prod contact fields (whatsapp/email differ in prod and are kept)
 *   - plan / stripe / any other brand field already set in prod
 *
 * The user doc in each project is matched by agencySlug="maraya-journeys".
 * Writes use { merge: true } so only homepage/aboutPage are set.
 *
 * Dry-run (default — prints what WOULD change, no writes):
 *   node scripts/seed-maraya-homepage-to-prod.js
 * Commit:
 *   node scripts/seed-maraya-homepage-to-prod.js --commit
 */
const admin = require("firebase-admin");

const AGENCY_SLUG = "maraya-journeys";
const COMMIT = process.argv.includes("--commit");

const stagingDb = admin
  .initializeApp(
    { credential: admin.credential.cert(require("../serviceAccountKeyStaging.json")) },
    "staging"
  )
  .firestore();

const prodDb = admin
  .initializeApp(
    { credential: admin.credential.cert(require("../serviceAccountKey.json")) },
    "prod"
  )
  .firestore();

async function getAgencyDoc(db, label) {
  const snap = await db.collection("users").where("agencySlug", "==", AGENCY_SLUG).get();
  if (snap.empty) throw new Error(`${label}: no user with agencySlug="${AGENCY_SLUG}"`);
  if (snap.size > 1) throw new Error(`${label}: ${snap.size} users match agencySlug — aborting`);
  return snap.docs[0];
}

const summarize = (cfg) =>
  cfg && Array.isArray(cfg.sections)
    ? `${cfg.sections.length} sections [${cfg.sections.map((s) => s.type).join(",")}]`
    : "<absent>";

(async () => {
  const stagingDoc = await getAgencyDoc(stagingDb, "STAGING");
  const prodDoc = await getAgencyDoc(prodDb, "PROD");
  const s = stagingDoc.data();
  const p = prodDoc.data();

  const homepage = s.homepage;
  const aboutPage = s.aboutPage;
  if (!homepage && !aboutPage) throw new Error("STAGING has no homepage/aboutPage to copy");

  console.log(`Source (staging) uid: ${stagingDoc.id}`);
  console.log(`Target (prod)    uid: ${prodDoc.id}\n`);
  console.log("homepage:");
  console.log(`  staging -> ${summarize(homepage)}`);
  console.log(`  prod    -> ${summarize(p.homepage)} (will be overwritten)`);
  console.log("aboutPage:");
  console.log(`  staging -> ${summarize(aboutPage)}`);
  console.log(`  prod    -> ${summarize(p.aboutPage)} (will be overwritten)`);
  console.log("\nUntouched in prod: whatsapp, email, plan, packages, all other fields.");

  const payload = { updatedAt: Date.now() };
  if (homepage) payload.homepage = homepage;
  if (aboutPage) payload.aboutPage = aboutPage;

  if (!COMMIT) {
    console.log("\n[DRY RUN] No writes performed. Re-run with --commit to apply.");
    process.exit(0);
  }

  await prodDoc.ref.set(payload, { merge: true });
  console.log("\n✅ Wrote homepage + aboutPage to prod.");

  // Verify
  const after = (await prodDoc.ref.get()).data();
  console.log(`Verify prod homepage:  ${summarize(after.homepage)}`);
  console.log(`Verify prod aboutPage: ${summarize(after.aboutPage)}`);
  console.log(`Verify prod whatsapp kept: ${after.whatsapp}`);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
