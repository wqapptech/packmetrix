/**
 * Backfill the `variant` field on every homepage / about-page section that
 * predates the layout-variant feature, in BOTH staging and prod.
 *
 * Pre-variant configs store sections without a `variant`. The renderer already
 * treats an absent variant as the default (shipped) look, so this is a NO-OP
 * visually — it just makes the stored data explicit so future edits round-trip
 * cleanly. ONLY missing variants are filled; any variant already set (incl. an
 * agency-chosen alternate) is left untouched.
 *
 * Touches users/{uid}.homepage.sections[] and users/{uid}.aboutPage.sections[].
 *
 * DEFAULT_VARIANT mirrors the FIRST entry per type in SECTION_VARIANTS
 * (lib/homepage.ts). Keep the two in sync if the catalog's defaults ever change.
 *
 * Dry-run (default — prints what WOULD change, no writes):
 *   node scripts/backfill-homepage-variants.js
 *   node scripts/backfill-homepage-variants.js --env=staging
 *   node scripts/backfill-homepage-variants.js --env=prod
 * Commit:
 *   node scripts/backfill-homepage-variants.js --env=staging --commit
 *   node scripts/backfill-homepage-variants.js --env=prod --commit
 */
const admin = require("firebase-admin");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const COMMIT = process.argv.includes("--commit");
const ENV_ARG = (process.argv.find((a) => a.startsWith("--env=")) || "").split("=")[1];

// First entry per type in SECTION_VARIANTS (lib/homepage.ts).
const DEFAULT_VARIANT = {
  hero: "cinematic",
  about: "image-left",
  why_us: "cards",
  services: "icons",
  featured_packages: "grid",
  destinations: "tiles",
  testimonials: "cards",
  contact: "band",
  stats: "band",
  seasonal_offers: "banner",
  accreditation: "badges",
  team: "grid",
  blog: "default",
  gallery: "default",
  faq: "default",
  how_it_works: "default",
  map: "default",
};

const ENVS = {
  staging: { key: "serviceAccountKeyStaging.json", label: "STAGING" },
  prod:    { key: "serviceAccountKey.json",        label: "PROD" },
};

function dbFor(envKey) {
  const cfg = ENVS[envKey];
  return admin
    .initializeApp(
      { credential: admin.credential.cert(require(path.join(ROOT, cfg.key))) },
      envKey
    )
    .firestore();
}

/**
 * Returns { config, filled:[] } — the same config with `variant` filled on any
 * section that lacks one, plus a log of which types were filled. Returns null
 * when the field isn't a valid config or nothing needs filling.
 */
function backfillConfig(raw) {
  if (!raw || typeof raw !== "object" || !Array.isArray(raw.sections)) return null;
  const filled = [];
  const sections = raw.sections.map((s) => {
    if (!s || typeof s.type !== "string") return s;
    if (typeof s.variant === "string" && s.variant.trim() !== "") return s;
    const variant = DEFAULT_VARIANT[s.type] || "default";
    filled.push(`${s.type}→${variant}`);
    return { ...s, variant };
  });
  if (!filled.length) return null;
  return { config: { version: 1, sections }, filled };
}

async function run(envKey) {
  const cfg = ENVS[envKey];
  const db = dbFor(envKey);
  const snap = await db.collection("users").get();

  let touched = 0;
  let sectionsFilled = 0;
  console.log(`\n========== ${cfg.label} ${COMMIT ? "(COMMIT)" : "(dry-run)"} ==========`);
  for (const doc of snap.docs) {
    const u = doc.data();
    const patch = {};
    const log = [];

    for (const field of ["homepage", "aboutPage"]) {
      const res = backfillConfig(u[field]);
      if (res) {
        patch[field] = res.config;
        sectionsFilled += res.filled.length;
        log.push(`${field}: [${res.filled.join(", ")}]`);
      }
    }

    if (!Object.keys(patch).length) continue;
    touched++;
    console.log(`\n  ${doc.id}  "${u.agencySlug || u.name || "?"}"`);
    for (const line of log) console.log(`      • ${line}`);

    if (COMMIT) {
      await doc.ref.set(patch, { merge: true });
      console.log("      ✓ written");
    }
  }
  console.log(`\n  ${cfg.label}: ${touched} user(s) changed, ${sectionsFilled} section(s) filled${COMMIT ? "" : " (no writes — dry run)"}`);
}

(async () => {
  const targets = ENV_ARG ? [ENV_ARG] : ["staging", "prod"];
  for (const t of targets) {
    if (!ENVS[t]) throw new Error(`unknown --env=${t} (use staging|prod)`);
    await run(t);
  }
  process.exit(0);
})().catch((e) => {
  console.error("FAILED:", e);
  process.exit(1);
});
