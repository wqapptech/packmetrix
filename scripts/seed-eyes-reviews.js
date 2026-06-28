/**
 * Seed the "eyes-on-europe" agency's customer reviews into its home testimonials
 * section — the real reviews migrated from the old WordPress site (nlinareyes.com):
 * 3 video testimonials (.webm) + 11 image screenshots. Media is HOT-LINKED to the
 * old site (per product decision) — the URLs point straight at nlinareyes.com.
 *
 * The reviews render via the extended testimonials model (lib/homepage.ts): each
 * item's kind is inferred from its `media` URL (video vs image). The home page
 * shows the first `limit` reviews with a "View all" link to /reviews, which lists
 * them all.
 *
 * Writes users/{uid}.homepage — patches ONLY the testimonials section's content,
 * preserving every other section. Idempotent (merge:true; safe to re-run).
 *
 *   node --env-file=.env.local scripts/seed-eyes-reviews.js
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

const AGENCY_SLUG = "eyes-on-europe";
const L = (en, ar) => ({ en, ar });
// encodeURI keeps the URL structure but percent-encodes the Arabic filenames so
// the stored value is a valid, fetchable URL.
const U = (url) => encodeURI(url);

const BASE = "https://www.nlinareyes.com/wp-content/uploads";

// Video testimonials (.webm) — shown first so the home section leads with video.
const VIDEOS = [
  `${BASE}/2026/03/2.webm`,
  `${BASE}/2026/03/اراء-العملاء-فيديو.webm`,
  `${BASE}/2026/03/اراء-العملاء3.webm`,
];

// Image-screenshot reviews (WhatsApp / Instagram) — full-resolution originals so
// they stay readable (the renderer uses object-fit: contain, so no cropping).
const IMAGES = [
  `${BASE}/2025/12/1-1.jpg`,
  `${BASE}/2025/12/22333.jpg`,
  `${BASE}/2025/12/89755.jpg`,
  `${BASE}/2025/12/9663.jpg`,
  `${BASE}/2024/02/ad9c9ed5-403a-46aa-b854-33951bb0ece4-1.jpg`,
  `${BASE}/2024/02/af10de00-6d05-4dd6-97a5-2da1f5e64fae-1.jpg`,
  `${BASE}/2024/02/af78bc24-2f99-40b9-82c9-fdd7fbd1ad7f.jpg`,
  `${BASE}/2024/02/ceef3cd4-08d0-48c3-bea2-bebec9b97a66-1.jpg`,
  `${BASE}/2024/02/e12a8e4d-484e-403d-81ad-51cf7be61ac0-1.jpg`,
  `${BASE}/2024/03/5ceaff81-d418-43db-b21d-1a574cee1332.jpeg`,
  `${BASE}/2024/03/fe337920-e5ab-4ab9-ac2e-2c3c29609eb5.jpeg`,
];

const ITEMS = [...VIDEOS, ...IMAGES].map((url) => ({ media: U(url) }));

// The authored copy for the section header. Media-only reviews carry no quote.
const TESTIMONIALS_CONTENT = {
  eyebrow: L("Travelers' words", "كلمات مسافرينا"),
  heading: L("What our guests say", "ماذا يقول ضيوفنا"),
  link: L("View all reviews", "عرض كل المراجعات"),
  limit: 4,
  items: ITEMS,
};

async function main() {
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "(unknown)";
  console.log(`\nProject: ${project}`);
  console.log(`Agency:  ${AGENCY_SLUG}`);
  console.log(`Reviews: ${VIDEOS.length} videos + ${IMAGES.length} images = ${ITEMS.length}\n`);

  const usersSnap = await db.collection("users")
    .where("agencySlug", "==", AGENCY_SLUG)
    .limit(1)
    .get();

  if (usersSnap.empty) {
    console.error(`No user found with agencySlug="${AGENCY_SLUG}". Aborting.`);
    process.exit(1);
  }

  const userDoc = usersSnap.docs[0];
  const userData = userDoc.data();
  console.log(`Found user: ${userDoc.id}  (${userData.email || userData.name || "no email"})`);

  // Patch ONLY the testimonials section, preserving every other section + order.
  const existing = userData.homepage && Array.isArray(userData.homepage.sections)
    ? userData.homepage.sections
    : [];
  const idx = existing.findIndex((s) => s && s.type === "testimonials");

  let sections;
  if (idx >= 0) {
    const prev = existing[idx];
    sections = existing.map((s, i) =>
      i === idx
        ? { ...s, enabled: true, content: { ...(prev.content || {}), ...TESTIMONIALS_CONTENT } }
        : s
    );
    console.log(`Updated existing testimonials section (order ${prev.order ?? idx}).`);
  } else {
    const maxOrder = existing.reduce((mx, s) => Math.max(mx, typeof s.order === "number" ? s.order : 0), -1);
    sections = [...existing, { type: "testimonials", enabled: true, order: maxOrder + 1, content: TESTIMONIALS_CONTENT }];
    console.log(`No testimonials section found — appended one (order ${maxOrder + 1}).`);
  }

  const homepage = { version: 1, sections };
  await userDoc.ref.set({ homepage, updatedAt: Date.now() }, { merge: true });

  console.log(`\nWrote ${ITEMS.length} reviews into the testimonials section.`);
  console.log(`Home shows the first ${TESTIMONIALS_CONTENT.limit}; all appear at /reviews.\n`);
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
