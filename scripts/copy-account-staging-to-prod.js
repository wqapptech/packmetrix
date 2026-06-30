/**
 * Copy a single agency account from STAGING -> PROD.
 *
 * Copies, for the account identified by EMAIL:
 *   - Auth user        : recreated in prod with the SAME uid + email.
 *                        A TEMP password is set (see TEMP_PASSWORD); the owner
 *                        resets it on first login in prod. (Firebase does not
 *                        expose plaintext passwords, so they cannot be copied.)
 *   - users/{uid}       : full brand/profile doc (homepage, aboutPage, etc.)
 *   - packages          : every doc where userId == uid (doc IDs preserved)
 *   - leads             : every doc where userId == uid (doc IDs preserved)
 *
 * Preserving the uid keeps every userId reference (packages, leads) valid.
 *
 * Does NOT touch anything else in prod. Aborts if the prod auth user or the
 * prod users/{uid} doc already exists (no clobber).
 *
 * NOTE: package docs may contain image URLs pointing at the STAGING storage
 * bucket. Those URLs still resolve, but the assets are not copied — re-upload
 * to the prod bucket separately if you need full independence from staging.
 *
 * Dry-run (default — prints what WOULD happen, no writes):
 *   node scripts/copy-account-staging-to-prod.js
 * Commit:
 *   node scripts/copy-account-staging-to-prod.js --commit
 */
const admin = require("firebase-admin");

const EMAIL = "waleed@packmetrix.com";
const TEMP_PASSWORD = "Packmetrix-Temp-2026!"; // owner resets on first login
const COMMIT = process.argv.includes("--commit");

const stagingApp = admin.initializeApp(
  { credential: admin.credential.cert(require("../serviceAccountKeyStaging.json")) },
  "staging"
);
const prodApp = admin.initializeApp(
  { credential: admin.credential.cert(require("../serviceAccountKey.json")) },
  "prod"
);
const sDb = stagingApp.firestore();
const pDb = prodApp.firestore();

const log = (...a) => console.log(...a);

async function copyQuery(label, col, uid) {
  const snap = await sDb.collection(col).where("userId", "==", uid).get();
  log(`  ${col}: ${snap.size} doc(s) to copy`);
  if (!COMMIT) {
    snap.docs.forEach((d) => log(`    - ${col}/${d.id}`));
    return snap.size;
  }
  // Batched writes (chunks of 400 to stay under the 500 limit).
  const docs = snap.docs;
  for (let i = 0; i < docs.length; i += 400) {
    const batch = pDb.batch();
    docs.slice(i, i + 400).forEach((d) => batch.set(pDb.collection(col).doc(d.id), d.data()));
    await batch.commit();
  }
  log(`    -> wrote ${docs.length} ${col} doc(s) to prod`);
  return snap.size;
}

(async () => {
  log(`=== Copy account ${EMAIL}: STAGING -> PROD ===`);
  log(COMMIT ? "MODE: COMMIT (writing to prod)\n" : "MODE: DRY-RUN (no writes)\n");

  // 1. Resolve staging auth user + verify prod is a clean slate.
  const sUser = await stagingApp.auth().getUserByEmail(EMAIL);
  const uid = sUser.uid;
  log(`staging uid: ${uid}`);

  let prodExists = false;
  try {
    await prodApp.auth().getUser(uid);
    prodExists = true;
  } catch (e) {
    if (e.code !== "auth/user-not-found") throw e;
  }
  try {
    await prodApp.auth().getUserByEmail(EMAIL);
    prodExists = true;
  } catch (e) {
    if (e.code !== "auth/user-not-found") throw e;
  }
  if (prodExists) throw new Error("PROD already has this uid/email — aborting (no clobber).");

  const prodUserDoc = await pDb.collection("users").doc(uid).get();
  if (prodUserDoc.exists) throw new Error(`PROD users/${uid} already exists — aborting (no clobber).`);

  // 2. Auth user.
  log("\n[auth] create prod user (same uid, temp password)");
  if (COMMIT) {
    await prodApp.auth().createUser({
      uid,
      email: EMAIL,
      emailVerified: sUser.emailVerified,
      password: TEMP_PASSWORD,
      displayName: sUser.displayName,
      disabled: false,
    });
    log(`    -> created prod auth user ${uid}`);
  } else {
    log(`    would create uid=${uid} email=${EMAIL} (temp password)`);
  }

  // 3. users/{uid} doc.
  log("\n[users] copy profile doc");
  const sUserDoc = await sDb.collection("users").doc(uid).get();
  if (!sUserDoc.exists) throw new Error(`staging users/${uid} missing — nothing to copy.`);
  const ud = sUserDoc.data();
  log(`  agencySlug=${ud.agencySlug} plan=${ud.plan} homepage=${!!ud.homepage} aboutPage=${!!ud.aboutPage}`);
  if (COMMIT) {
    await pDb.collection("users").doc(uid).set(ud);
    log(`    -> wrote prod users/${uid}`);
  }

  // 4. Owned collections.
  log("\n[packages]");
  const nPkg = await copyQuery("packages", "packages", uid);
  log("\n[leads]");
  const nLead = await copyQuery("leads", "leads", uid);

  log(`\n=== ${COMMIT ? "DONE" : "DRY-RUN COMPLETE"} ===`);
  log(`  auth: ${COMMIT ? "created" : "would create"} | users: 1 | packages: ${nPkg} | leads: ${nLead}`);
  if (!COMMIT) log("\nRe-run with --commit to apply.");
  else log(`\nTemp password: ${TEMP_PASSWORD}  (owner should reset it in prod)`);
  process.exit(0);
})().catch((e) => {
  console.error("\nFAILED:", e.message);
  process.exit(1);
});
