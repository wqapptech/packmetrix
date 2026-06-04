/**
 * Seed storefront fields for the "maraya-journeys" agency.
 *
 * Fields set:
 *   brandColor, storefrontLanguage, about_en, about_ar,
 *   statsYears, statsTravellers, statsRating
 *
 * WhatsApp: copied from the first package that has one (if not already on the user doc).
 *
 * Run against staging:
 *   node --env-file=.env.local scripts/seed-maraya-storefront.js
 *
 * Run against production:
 *   node --env-file=.env.production scripts/seed-maraya-storefront.js
 *
 * Safe to re-run — uses merge:true / updateDoc.
 */

const admin = require("firebase-admin");

const rawKey = process.env.FIREBASE_ADMIN_KEY;
if (!rawKey) throw new Error("Missing FIREBASE_ADMIN_KEY");

const serviceAccount = JSON.parse(rawKey);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});

const db = admin.firestore();

const AGENCY_SLUG = "maraya-journeys";

const STOREFRONT_DATA = {
  brandColor:         "#1D4E72",
  storefrontLanguage: "en",
  about_en: "Maraya Journeys designs unhurried, hand-planned travel — built around a feeling, paced to suit you, and bookable in a single WhatsApp conversation. Tell us where you'd like to go, and we'll take care of the rest.",
  about_ar: "ترتّب مرايا للرحلات تجارب سفر مدروسة بلا عجلة، لمن يبحث عن أكثر من مجرد قائمة مهام. نصمّم كل رحلة حول إحساس — صباح هادئ فوق كابادوكيا، أسبوع متأنٍّ في المالديف، أو عمرة بلا تعب — ونتولّى التفاصيل عنك. كل رحلة مُعدّة بعناية، بإيقاع يناسبك، ويمكن حجزها عبر محادثة واحدة على واتساب. أخبرنا إلى أين تودّ الذهاب، وسنتكفّل بالباقي.",
  statsYears:         5,
  statsTravellers:    2500,
  statsRating:        4.8,
};

async function main() {
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "(unknown)";
  console.log(`\nProject: ${project}`);
  console.log(`Agency:  ${AGENCY_SLUG}\n`);

  // 1. Find the user doc
  const usersSnap = await db.collection("users")
    .where("agencySlug", "==", AGENCY_SLUG)
    .limit(1)
    .get();

  if (usersSnap.empty) {
    console.error(`No user found with agencySlug="${AGENCY_SLUG}". Aborting.`);
    process.exit(1);
  }

  const userDoc  = usersSnap.docs[0];
  const userData = userDoc.data();
  console.log(`Found user: ${userDoc.id}  (${userData.email || userData.name || "no email"})`);

  // 2. Resolve WhatsApp — keep existing if present, else pull from packages
  let whatsapp = userData.whatsapp || "";
  if (!whatsapp) {
    const pkgsSnap = await db.collection("packages")
      .where("agencySlug", "==", AGENCY_SLUG)
      .get();

    for (const pkg of pkgsSnap.docs) {
      const d = pkg.data();
      const wa = d.whatsapp ||
        (d.contacts || []).find(c => c.type === "whatsapp")?.value || "";
      if (wa) { whatsapp = wa; break; }
    }
    console.log(whatsapp
      ? `WhatsApp resolved from packages: ${whatsapp}`
      : "WhatsApp: none found in packages — leaving blank"
    );
  } else {
    console.log(`WhatsApp already set: ${whatsapp}`);
  }

  // 3. Write
  const payload = {
    ...STOREFRONT_DATA,
    ...(whatsapp ? { whatsapp } : {}),
    updatedAt: Date.now(),
  };

  await userDoc.ref.set(payload, { merge: true });

  console.log("\nWritten fields:");
  for (const [k, v] of Object.entries(payload)) {
    const display = typeof v === "string" && v.length > 60 ? v.slice(0, 57) + "…" : v;
    console.log(`  ${k.padEnd(20)} ${display}`);
  }
  console.log("\nDone.\n");
}

main().catch(err => { console.error(err); process.exit(1); });
