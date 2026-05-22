/**
 * One-time migration: legacy packages → sections-based architecture.
 *
 * What it does:
 *  For every package that has no `sections` array (or an empty one), it builds
 *  a `sections` array from the legacy flat fields and writes it back to Firestore.
 *  Legacy fields are preserved so the fallback render path still works.
 *
 * Sections generated (only when the source data is non-empty):
 *   itinerary      ← pkg.itinerary   (days with title)
 *   inclusions     ← pkg.includes / pkg.excludes / pkg.advantages
 *   hotel          ← pkg.hotelDescription
 *   flights        ← pkg.airports    (entries with a name)
 *   pricing        ← pkg.pricingTiers (entries with a price)
 *   gallery        ← pkg.images
 *   video          ← pkg.videoUrl
 *
 * Run (Node 20+ reads .env.local automatically):
 *   node --env-file=.env.local scripts/migrate-packages-to-sections.js
 *
 * Pass --dry-run to preview changes without writing:
 *   node --env-file=.env.local scripts/migrate-packages-to-sections.js --dry-run
 *
 * Required env vars (same as .env.local):
 *   FIREBASE_ADMIN_KEY
 *   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
 */

const admin = require("firebase-admin");
const crypto = require("crypto");

const DRY_RUN = process.argv.includes("--dry-run");

// ─── Firebase bootstrap ────────────────────────────────────────────────────────

const rawKey = process.env.FIREBASE_ADMIN_KEY;
if (!rawKey) throw new Error("Missing FIREBASE_ADMIN_KEY");

const serviceAccount = JSON.parse(rawKey);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});

const db = admin.firestore();

// ─── Helpers ──────────────────────────────────────────────────────────────────

const uid = () => crypto.randomUUID();

const arr = (v) => (Array.isArray(v) ? v : []);
const str = (v) => (typeof v === "string" ? v.trim() : "");

/**
 * Build a sections array from legacy flat pkg fields.
 * Returns [] if there is nothing to migrate.
 */
function buildSections(pkg) {
  const sections = [];
  let order = 0;

  // itinerary
  const days = arr(pkg.itinerary).filter((d) => str(d.title));
  if (days.length) {
    sections.push({ id: uid(), type: "itinerary", order: order++, data: { days } });
  }

  // inclusions / exclusions  (pkg.advantages is the old name for includes)
  const includes = arr(pkg.includes).length ? arr(pkg.includes) : arr(pkg.advantages);
  const excludes = arr(pkg.excludes);
  if (includes.length || excludes.length) {
    sections.push({ id: uid(), type: "inclusions", order: order++, data: { includes, excludes } });
  }

  // hotel
  const hotelDesc = str(pkg.hotelDescription);
  if (hotelDesc) {
    sections.push({ id: uid(), type: "hotel", order: order++, data: { description: hotelDesc } });
  }

  // flights / departures
  const departures = arr(pkg.airports).filter((a) => str(a.name));
  if (departures.length) {
    sections.push({ id: uid(), type: "flights", order: order++, data: { departures } });
  }

  // pricing
  const tiers = arr(pkg.pricingTiers).filter((t) => str(t.price));
  if (tiers.length) {
    sections.push({
      id: uid(), type: "pricing", order: order++,
      data: { tiers, cancellation: str(pkg.cancellation) },
    });
  }

  // gallery (images only — video is its own section)
  const images = arr(pkg.images).filter(Boolean);
  if (images.length) {
    sections.push({ id: uid(), type: "gallery", order: order++, data: { images } });
  }

  // video
  const videoUrl = str(pkg.videoUrl);
  if (videoUrl) {
    sections.push({ id: uid(), type: "video", order: order++, data: { videoUrl } });
  }

  return sections;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log(DRY_RUN ? "DRY RUN — no writes will happen.\n" : "");

  const snap = await db.collection("packages").get();
  console.log(`Found ${snap.size} packages.\n`);

  let migrated = 0;
  let skipped = 0;

  for (const docSnap of snap.docs) {
    const id = docSnap.id;
    const pkg = docSnap.data();

    // Skip packages that already have sections
    if (arr(pkg.sections).length > 0) {
      skipped++;
      continue;
    }

    const sections = buildSections(pkg);

    if (!sections.length) {
      console.log(`[${id}] (${pkg.destination || "untitled"}) — no legacy data to migrate, skipping`);
      skipped++;
      continue;
    }

    const sectionSummary = sections.map((s) => s.type).join(", ");
    console.log(`[${id}] (${pkg.destination || "untitled"}) → ${sections.length} sections: ${sectionSummary}`);

    if (!DRY_RUN) {
      await docSnap.ref.update({ sections });
    }

    migrated++;
  }

  console.log(`\n${DRY_RUN ? "[DRY RUN] Would migrate" : "Migrated"} ${migrated} packages. ${skipped} already had sections or had no data.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
