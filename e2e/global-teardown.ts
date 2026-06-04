import type { FullConfig } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

const STATE_FILE = path.join(process.cwd(), ".smoke-state.json");

function loadEnvLocal() {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key && !process.env[key]) process.env[key] = val;
  }
}

async function globalTeardown(_config: FullConfig) {
  loadEnvLocal();

  if (!fs.existsSync(STATE_FILE)) {
    console.warn("[smoke] No .smoke-state.json found — nothing to clean up");
    return;
  }

  const state = JSON.parse(fs.readFileSync(STATE_FILE, "utf8")) as {
    SMOKE_UID: string;
    SMOKE_AGENCY_SLUG: string;
    SMOKE_EMAIL: string;
  };

  const adminKeyRaw = process.env.FIREBASE_ADMIN_KEY;
  if (!adminKeyRaw) {
    console.warn(
      "[smoke] FIREBASE_ADMIN_KEY not set — manual cleanup needed\n" +
      `[smoke] UID: ${state.SMOKE_UID} | Slug: ${state.SMOKE_AGENCY_SLUG}`
    );
    return;
  }

  const serviceAccount = JSON.parse(adminKeyRaw);

  const { initializeApp, getApps, cert } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");
  const { getFirestore } = await import("firebase-admin/firestore");

  const appName = "smoke-teardown";
  const app =
    getApps().find((a) => a.name === appName) ||
    initializeApp({ credential: cert(serviceAccount) }, appName);
  const adminAuth = getAuth(app);
  const adminDb = getFirestore(app);

  let deletedPkgs = 0;

  try {
    // Delete ALL packages for this test user (covers UI-published packages
    // that don't have _smoke:true because they were created by the builder).
    const pkgsSnap = await adminDb
      .collection("packages")
      .where("userId", "==", state.SMOKE_UID)
      .get();

    if (!pkgsSnap.empty) {
      const batch = adminDb.batch();
      pkgsSnap.docs.forEach((d) => batch.delete(d.ref));
      await batch.commit();
      deletedPkgs = pkgsSnap.size;
    }

    // Delete user doc
    await adminDb.collection("users").doc(state.SMOKE_UID).delete();

    // Delete Firebase Auth user
    await adminAuth.deleteUser(state.SMOKE_UID);

    // Clean up any side-effect users from the signup test
    try {
      const signupUser = await adminAuth.getUserByEmail(
        state.SMOKE_EMAIL.replace("smoke.", "smoke.signup.")
      );
      await adminAuth.deleteUser(signupUser.uid);
      // Also remove their Firestore doc if it exists
      await adminDb.collection("users").doc(signupUser.uid).delete().catch(() => {});
    } catch {
      // Signup test user may not exist if that test was skipped or failed before creation
    }

    fs.unlinkSync(STATE_FILE);

    console.log(
      `[smoke] Teardown complete — deleted ${deletedPkgs} packages + user ${state.SMOKE_UID}`
    );
  } catch (err) {
    console.error("[smoke] Teardown failed — manual cleanup needed");
    console.error("[smoke] State:", state);
    console.error(err);
  }
}

export default globalTeardown;

// Allows running as a standalone script: npx tsx e2e/global-teardown.ts
if (require.main === module) {
  globalTeardown({} as FullConfig).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
