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

/**
 * Resolve a Firebase service account so teardown can run even when
 * FIREBASE_ADMIN_KEY isn't exported. Tries, in order:
 *   1. FIREBASE_ADMIN_KEY                       (inline JSON — CI / .env.local)
 *   2. FIREBASE_ADMIN_KEY_FILE / GOOGLE_APPLICATION_CREDENTIALS (path to JSON)
 *   3. serviceAccountKey*.json in the project root (gitignored local keys)
 * When multiple keys are available, prefer the one whose project_id matches
 * the target project so we never clean the wrong Firebase project.
 * Returns null if no usable credential is found.
 */
function resolveServiceAccount(): { project_id?: string; [k: string]: unknown } | null {
  const inline = process.env.FIREBASE_ADMIN_KEY;
  if (inline) {
    try {
      return JSON.parse(inline);
    } catch {
      console.warn("[smoke] FIREBASE_ADMIN_KEY is set but is not valid JSON — ignoring");
    }
  }

  const candidatePaths = [
    process.env.FIREBASE_ADMIN_KEY_FILE,
    process.env.GOOGLE_APPLICATION_CREDENTIALS,
    path.join(process.cwd(), "serviceAccountKey.json"),
    path.join(process.cwd(), "serviceAccountKeyStaging.json"),
  ].filter((p): p is string => Boolean(p));

  const parsed: Array<{ project_id?: string; [k: string]: unknown }> = [];
  for (const p of candidatePaths) {
    if (!fs.existsSync(p)) continue;
    try {
      parsed.push(JSON.parse(fs.readFileSync(p, "utf8")));
    } catch {
      console.warn(`[smoke] Could not parse service account at ${p} — skipping`);
    }
  }
  if (parsed.length === 0) return null;

  const target =
    process.env.SMOKE_TARGET_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (target) {
    const match = parsed.find((sa) => sa.project_id === target);
    if (match) return match;
  }
  return parsed[0];
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

  const signupEmail = state.SMOKE_EMAIL.replace("smoke.", "smoke.signup.");
  const serviceAccount = resolveServiceAccount();
  if (!serviceAccount) {
    console.warn(
      "[smoke] No admin credentials found (FIREBASE_ADMIN_KEY, FIREBASE_ADMIN_KEY_FILE, " +
      "or serviceAccountKey*.json in the project root) — manual cleanup needed\n" +
      `[smoke] UID: ${state.SMOKE_UID} | Slug: ${state.SMOKE_AGENCY_SLUG} | Signup: ${signupEmail}`
    );
    return;
  }

  const { initializeApp, getApps, cert } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");
  const { getFirestore } = await import("firebase-admin/firestore");

  // Guard against the silent-leak failure mode: if the resolved key cleans a
  // different Firebase project than the one the tests ran against, the signup
  // user (created on the target project by the deployed app) survives.
  const target =
    process.env.SMOKE_TARGET_PROJECT ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  if (target && serviceAccount.project_id !== target) {
    console.warn(
      `[smoke] WARNING: admin key project "${serviceAccount.project_id}" does not match ` +
      `target project "${target}". Users created on the target project will NOT be cleaned.\n` +
      `[smoke] Provide a service account for "${target}" (FIREBASE_ADMIN_KEY / ` +
      "serviceAccountKey.json) to clean it. Aborting to avoid touching the wrong project."
    );
    return;
  }
  console.log(`[smoke] Teardown cleaning project: ${serviceAccount.project_id}`);

  const appName = "smoke-teardown";
  const app =
    getApps().find((a) => a.name === appName) ||
    initializeApp({ credential: cert(serviceAccount as Parameters<typeof cert>[0]) }, appName);
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
      const signupUser = await adminAuth.getUserByEmail(signupEmail);
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
