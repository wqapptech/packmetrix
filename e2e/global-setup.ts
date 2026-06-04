import type { FullConfig } from "@playwright/test";
import * as fs from "fs";
import * as path from "path";

export const STATE_FILE = path.join(process.cwd(), ".smoke-state.json");

const TEMPLATES = ["aurora", "voyage", "pulse", "sakina", "petal", "compass", "atlas", "tribe", "smart", "family"] as const;

/** Parse .env.local so FIREBASE_ADMIN_KEY is visible to this Node process. */
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

/** All 19 active section types populated with recognizable SMOKE-prefixed content. */
function buildSectionsData() {
  return [
    { id: "s1",  type: "highlights",      order: 1,  data: { items: ["SMOKE Highlight One", "SMOKE Highlight Two", "SMOKE Highlight Three"] } },
    { id: "s2",  type: "itinerary",        order: 2,  data: { days: [{ day: 1, title: "SMOKE Itinerary Day", desc: "Day one description" }] } },
    { id: "s3",  type: "hotel",            order: 3,  data: { description: "SMOKE Hotel Description" } },
    { id: "s4",  type: "inclusions",       order: 4,  data: { includes: ["SMOKE Included Item"], excludes: ["SMOKE Excluded Item"] } },
    { id: "s5",  type: "meals",            order: 5,  data: { plan: "SMOKE Meal Plan", notes: "" } },
    { id: "s6",  type: "visa",             order: 6,  data: { included: "SMOKE Visa Status", content: "" } },
    { id: "s7",  type: "faq",              order: 7,  data: { items: [{ question: "SMOKE FAQ Question?", answer: "SMOKE FAQ answer" }] } },
    { id: "s8",  type: "custom",           order: 8,  data: { blocks: [{ heading: "SMOKE Custom Heading", body: "SMOKE custom body" }] } },
    { id: "s9",  type: "extras",           order: 9,  data: { items: [{ name: "SMOKE Extra Name", description: "Extra desc", price: "100 USD" }] } },
    { id: "s10", type: "important_notes",  order: 10, data: { items: [{ text: "SMOKE Important Note" }] } },
    { id: "s11", type: "about_agency",     order: 11, data: { content: "SMOKE Agency Story" } },
    { id: "s12", type: "pricing",          order: 12, data: { tiers: [{ label: "SMOKE Pricing Tier", price: "1,999 USD" }], cancellation: "" } },
    { id: "s13", type: "transfers",        order: 13, data: { description: "SMOKE Transfers Info", items: [{ leg: "SMOKE Transfer Route" }] } },
    { id: "s14", type: "departures",       order: 14, data: { entries: [{ date: "2026-12-01", spots: 5, price: "999 USD" }] } },
    { id: "s15", type: "media",            order: 15, data: { images: [], videoUrl: "" } },
    { id: "s16", type: "reviews",          order: 16, data: { reviews: [{ id: "r1", name: "SMOKE Reviewer Name", text: "SMOKE review text", rating: 5 }] } },
    { id: "s17", type: "people",           order: 17, data: { people: [{ id: "p1", role: "guide", name: "SMOKE Guide Person" }] } },
    { id: "s18", type: "trek_profile",     order: 18, data: { difficulty: "moderate", maxAltitude: 5364, distanceKm: 130, fitnessNote: "SMOKE fitness note" } },
    { id: "s19", type: "scarcity",         order: 19, data: { wasPrice: "2000 USD", spotsRemaining: 3, totalSpots: 20, firstDepartureDate: "2026-12-01" } },
  ];
}

function basePkgFields(userId: string, agencySlug: string, now: number) {
  return {
    userId,
    agencySlug,
    price: "from 1,999 USD",
    views: 0,
    whatsappClicks: 0,
    messengerClicks: 0,
    createdAt: now,
    _smoke: true,
  };
}

async function globalSetup(_config: FullConfig) {
  loadEnvLocal();

  const adminKeyRaw = process.env.FIREBASE_ADMIN_KEY;
  if (!adminKeyRaw) {
    throw new Error(
      "[smoke] FIREBASE_ADMIN_KEY not set — add it to .env.local\n" +
      "Smoke tests require a staging Firebase project. See .env.test.local.example."
    );
  }

  const serviceAccount = JSON.parse(adminKeyRaw);

  const { initializeApp, getApps, cert } = await import("firebase-admin/app");
  const { getAuth } = await import("firebase-admin/auth");
  const { getFirestore } = await import("firebase-admin/firestore");

  const appName = "smoke-setup";
  const app =
    getApps().find((a) => a.name === appName) ||
    initializeApp({ credential: cert(serviceAccount) }, appName);
  const adminAuth = getAuth(app);
  const adminDb = getFirestore(app);

  const shortId = Date.now().toString(36).slice(-6);
  const testEmail = `smoke.${shortId}@packmetrix-test.invalid`;
  const testPassword = `Smoke_${shortId}_T3st!`;
  const testAgencySlug = `smoke-${shortId}`;
  const now = Date.now();

  // Create a pre-verified Firebase Auth user so login works immediately.
  const userRecord = await adminAuth.createUser({
    email: testEmail,
    password: testPassword,
    emailVerified: true,
    displayName: "Smoke Test Agency",
  });

  await adminDb
    .collection("users")
    .doc(userRecord.uid)
    .set({
      email: testEmail,
      name: "Smoke Test Agency",
      agencySlug: testAgencySlug,
      plan: "free",
      // Active trial so the builder doesn't redirect to /paywall
      trialEndsAt: now + 30 * 24 * 60 * 60 * 1000,
      aiUsage: 0,
      stripeCustomerId: null,
      createdAt: now,
      _smoke: true,
    });

  const base = basePkgFields(userRecord.uid, testAgencySlug, now);

  // ── Core EN + AR packages (storefront + publish→render tests) ──────────────
  const [enPkg, arPkg] = await Promise.all([
    adminDb.collection("packages").add({
      ...base,
      destination: "Smoke Test Maldives",
      title: "[SMOKE] Maldives Package",
      description: "Smoke test package — safe to delete",
      primaryLanguage: "en",
      language: "en",
      sections: [],
      templateId: "aurora",
    }),
    adminDb.collection("packages").add({
      ...base,
      destination: "المالديف اختبار",
      price: "7,499 ريال",
      title: "[دخان] باقة المالديف",
      description: "حزمة اختبار — آمن للحذف",
      primaryLanguage: "ar",
      language: "ar",
      sections: [],
      templateId: "aurora",
      createdAt: now + 1,
    }),
  ]);

  // ── Sections packages: all 19 section types with SMOKE-prefixed content ─────
  const sectionsData = buildSectionsData();
  const [sectionsPkgEn, sectionsPkgAr] = await Promise.all([
    adminDb.collection("packages").add({
      ...base,
      destination: "SMOKE Sections Package",
      title: "SMOKE All Sections EN",
      description: "Smoke sections test — safe to delete",
      primaryLanguage: "en",
      language: "en",
      templateId: "aurora",
      sections: sectionsData,
      createdAt: now + 2,
    }),
    adminDb.collection("packages").add({
      ...base,
      destination: "حزمة اختبار الأقسام",
      title: "SMOKE All Sections AR",
      description: "حزمة اختبار الأقسام — آمن للحذف",
      primaryLanguage: "ar",
      language: "ar",
      templateId: "aurora",
      sections: sectionsData,
      createdAt: now + 3,
    }),
  ]);

  // ── Template packages: one EN + one AR per template ──────────────────────────
  const templatePkgPromises = TEMPLATES.flatMap((tpl, i) => [
    adminDb.collection("packages").add({
      ...base,
      destination: `SMOKE ${tpl} EN`,
      title: `SMOKE ${tpl} EN Package`,
      description: "Smoke template test",
      primaryLanguage: "en",
      language: "en",
      templateId: tpl,
      sections: [],
      createdAt: now + 10 + i * 2,
    }),
    adminDb.collection("packages").add({
      ...base,
      destination: `دخان ${tpl} AR`,
      title: `SMOKE ${tpl} AR Package`,
      description: "اختبار القالب",
      primaryLanguage: "ar",
      language: "ar",
      templateId: tpl,
      sections: [],
      createdAt: now + 11 + i * 2,
    }),
  ]);

  const templatePkgRefs = await Promise.all(templatePkgPromises);

  const templatePkgsEn: Record<string, string> = {};
  const templatePkgsAr: Record<string, string> = {};
  TEMPLATES.forEach((tpl, i) => {
    templatePkgsEn[tpl] = templatePkgRefs[i * 2].id;
    templatePkgsAr[tpl] = templatePkgRefs[i * 2 + 1].id;
  });

  const state = {
    SMOKE_EMAIL: testEmail,
    SMOKE_PASSWORD: testPassword,
    SMOKE_UID: userRecord.uid,
    SMOKE_AGENCY_SLUG: testAgencySlug,
    SMOKE_EN_PKG_ID: enPkg.id,
    SMOKE_AR_PKG_ID: arPkg.id,
    SMOKE_SECTIONS_PKG_EN: sectionsPkgEn.id,
    SMOKE_SECTIONS_PKG_AR: sectionsPkgAr.id,
    SMOKE_TEMPLATE_PKGS_EN: templatePkgsEn,
    SMOKE_TEMPLATE_PKGS_AR: templatePkgsAr,
  };

  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));

  console.log(
    `\n[smoke] Setup complete` +
    `\n  agency slug      : ${testAgencySlug}` +
    `\n  EN pkg           : ${enPkg.id}` +
    `\n  AR pkg           : ${arPkg.id}` +
    `\n  sections EN pkg  : ${sectionsPkgEn.id}` +
    `\n  sections AR pkg  : ${sectionsPkgAr.id}` +
    `\n  template pkgs    : ${TEMPLATES.length * 2} (${TEMPLATES.length} EN + ${TEMPLATES.length} AR)\n`
  );
}

export default globalSetup;
