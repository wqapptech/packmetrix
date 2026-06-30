/**
 * Remove 10 retired package-section types from every package's `sections[]`,
 * in BOTH staging and prod. Before stripping, defensively migrate any real
 * data from `flights` -> `departures` and `video` -> `media` so nothing is lost.
 *
 * Removed types:
 *   trek_profile, guide, schedule, flights, booking_terms,
 *   departure_dates, payment_plan, gallery, video, map
 *
 * Kept (NOT touched): meals, visa, scarcity, other_packages + all canonical
 * sections (itinerary, highlights, hotel, inclusions, faq, custom, extras,
 * people, important_notes, about_agency, departures, pricing, transfers,
 * media, reviews).
 *
 * Dry-run (default — prints what WOULD change, no writes):
 *   node scripts/strip-legacy-sections.js
 *   node scripts/strip-legacy-sections.js --env=staging
 *   node scripts/strip-legacy-sections.js --env=prod
 * Commit:
 *   node scripts/strip-legacy-sections.js --env=staging --commit
 *   node scripts/strip-legacy-sections.js --env=prod --commit
 */
const admin = require("firebase-admin");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const COMMIT = process.argv.includes("--commit");
const ENV_ARG = (process.argv.find((a) => a.startsWith("--env=")) || "").split("=")[1];

const REMOVED = new Set([
  "trek_profile", "guide", "schedule", "flights", "booking_terms",
  "departure_dates", "payment_plan", "gallery", "video", "map",
]);

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

const isStr = (v) => typeof v === "string" && v.trim() !== "";
const findSec = (sections, type) => sections.find((s) => s && s.type === type);

// A flights.departures entry counts as "real" if any field is non-empty.
function flightsHasRealData(flightsSec) {
  const deps = flightsSec && Array.isArray(flightsSec.data?.departures) ? flightsSec.data.departures : [];
  return deps.some((d) =>
    d && Object.values(d).some((v) => (typeof v === "string" ? v.trim() !== "" : typeof v === "number" ? v !== 0 : !!v))
  );
}

/**
 * Returns { sections, changes:[] } — a new sections array with migrations
 * applied and removed types stripped, plus a human log of what changed.
 */
function transform(pkg) {
  const sections = Array.isArray(pkg.sections) ? pkg.sections.map((s) => ({ ...s, data: { ...s.data } })) : [];
  const changes = [];

  // ── Migrate flights -> departures (only if flights carries real data) ──
  const flightsSec = findSec(sections, "flights");
  if (flightsSec && flightsHasRealData(flightsSec)) {
    let depSec = findSec(sections, "departures");
    if (!depSec) {
      depSec = { id: `dep_${pkg.__id}`, type: "departures", order: flightsSec.order, data: { entries: [] } };
      sections.push(depSec);
      changes.push("created departures section");
    }
    if (!Array.isArray(depSec.data.entries)) depSec.data.entries = [];
    for (const d of flightsSec.data.departures) {
      depSec.data.entries.push({
        date: d.date || "", returnDate: "", spots: 0, price: d.price || "",
        origin: d.name || "", arrivingAirport: d.arrivingAirport || "",
        flyingTime: d.flyingTime || "", arrivingTime: d.arrivingTime || "", deal: false,
      });
    }
    changes.push(`migrated ${flightsSec.data.departures.length} flights entr(ies) -> departures`);
  } else if (flightsSec) {
    changes.push("flights had no real data — stripped");
  }

  // ── Migrate video -> media (only if media lacks a videoUrl) ──
  const videoSec = findSec(sections, "video");
  if (videoSec && isStr(videoSec.data?.videoUrl)) {
    let mediaSec = findSec(sections, "media");
    if (!mediaSec) {
      mediaSec = { id: `media_${pkg.__id}`, type: "media", order: videoSec.order, data: { images: [], videoUrl: "", mapImage: "", mapCaption: "" } };
      sections.push(mediaSec);
      changes.push("created media section");
    }
    if (!isStr(mediaSec.data.videoUrl)) {
      mediaSec.data.videoUrl = videoSec.data.videoUrl;
      changes.push("migrated video.videoUrl -> media.videoUrl");
    } else {
      changes.push("media already had videoUrl (legacy video superseded) — stripped");
    }
  }

  // ── Strip all removed types, then re-index order ──
  const removedTypes = sections.filter((s) => REMOVED.has(s.type)).map((s) => s.type);
  let next = sections.filter((s) => !REMOVED.has(s.type));
  next = next
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((s, i) => ({ ...s, order: i }));

  if (removedTypes.length) changes.push(`removed [${removedTypes.join(", ")}]`);

  return { sections: next, changes, removedCount: removedTypes.length };
}

async function run(envKey) {
  const cfg = ENVS[envKey];
  const db = dbFor(envKey);
  const snap = await db.collection("packages").get();

  let touched = 0;
  let stripped = 0;
  console.log(`\n========== ${cfg.label} ${COMMIT ? "(COMMIT)" : "(dry-run)"} ==========`);
  for (const doc of snap.docs) {
    const pkg = doc.data();
    pkg.__id = doc.id;
    if (!Array.isArray(pkg.sections) || !pkg.sections.length) continue;
    const before = pkg.sections.length;
    const { sections, changes, removedCount } = transform(pkg);
    if (removedCount === 0 && before === sections.length) continue;

    touched++;
    stripped += removedCount;
    console.log(`\n  ${doc.id}  "${pkg.title || "?"}"  (${before} -> ${sections.length} sections)`);
    for (const c of changes) console.log(`      • ${c}`);

    if (COMMIT) {
      await doc.ref.set({ sections }, { merge: true });
      console.log("      ✓ written");
    }
  }
  console.log(`\n  ${cfg.label}: ${touched} package(s) changed, ${stripped} legacy section(s) removed${COMMIT ? "" : " (no writes — dry run)"}`);
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
