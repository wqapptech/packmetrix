/**
 * Seed a FULL homepage config for the "maraya-journeys" agency so the homepage
 * renders every section with real content (staging design preview).
 *
 * Writes users/{uid}.homepage — the section model read by readHomepageConfig()
 * / HomepageSections.tsx. Shape mirrors lib/homepage.ts (version:1, sections[]
 * with {type, enabled, order, content}); every authored text field is bilingual
 * {en, ar}.
 *
 * featured_packages + destinations derive from the agency's published packages,
 * so make sure maraya-journeys has packages (scripts/seed-maraya-storefront.js
 * seeds the agency's brand/about/stats — run that too if needed).
 *
 * Run against staging (default project in .env.local):
 *   node --env-file=.env.local scripts/seed-maraya-homepage.js
 *
 * Safe to re-run — overwrites the homepage field wholesale via merge:true.
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

// Bilingual literal helper (matches lib/homepage.ts `loc`).
const L = (en, ar) => ({ en, ar });

// Travel-themed imagery for the design preview (stable Unsplash photo IDs).
const IMG = (id, w = 1600) =>
  `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

// Ordered list of fully-authored sections. order is assigned by array index.
const SECTIONS = [
  {
    type: "hero",
    enabled: true,
    content: {
      eyebrow: L("Hand-planned travel", "سفرٌ مُصمَّم بعناية"),
      headline: L("Travel that feels like it was made for you.", "سفرٌ يبدو وكأنه صُمِّم من أجلك."),
      sub: L(
        "Unhurried, hand-planned journeys — paced to suit you and bookable in a single WhatsApp conversation.",
        "رحلات مدروسة بلا عجلة — بإيقاع يناسبك وتُحجز عبر محادثة واحدة على واتساب."
      ),
      image: IMG("1502602898657-3e91760cbb34"), // Paris-esque travel hero
    },
  },
  {
    type: "about",
    enabled: true,
    content: {
      eyebrow: L("About", "من نحن"),
      heading: L("We design around a feeling, not a checklist.", "نصمّم حول الإحساس، لا قائمة المهام."),
      body: L(
        "Maraya Journeys designs unhurried, hand-planned travel for people who want more than a to-do list. Every trip is built around a feeling — a quiet morning over Cappadocia, an unhurried week in the Maldives, an Umrah without the fatigue — and we take care of the details so you don't have to.",
        "ترتّب مرايا للرحلات تجارب سفر مدروسة بلا عجلة، لمن يبحث عن أكثر من مجرد قائمة مهام. نصمّم كل رحلة حول إحساس — صباح هادئ فوق كابادوكيا، أسبوع متأنٍّ في المالديف، أو عمرة بلا تعب — ونتولّى التفاصيل عنك."
      ),
      link: L("Read our story", "اقرأ قصتنا"),
      image: IMG("1488646953014-85cb44e25828"),
    },
  },
  {
    type: "why_us",
    enabled: true,
    content: {
      eyebrow: L("Why us", "لماذا نحن"),
      heading: L("Travel, the way it should feel.", "السفر كما يجب أن يكون."),
      items: [
        { icon: "moon", title: L("An unhurried pace", "إيقاع بلا عجلة"), desc: L("Itineraries with room to breathe — never a rushed checklist of sights.", "برامج فيها متّسع للراحة — لا قائمة معالم مزدحمة.") },
        { icon: "users", title: L("Hand-planned, never templated", "تخطيط يدوي لا قوالب"), desc: L("Every journey is built from scratch around how you like to travel.", "كل رحلة تُبنى من الصفر حول طريقتك في السفر.") },
        { icon: "chat", title: L("Booked over WhatsApp", "الحجز عبر واتساب"), desc: L("One conversation from first idea to confirmed trip — no forms, no portals.", "محادثة واحدة من الفكرة حتى التأكيد — دون نماذج أو بوابات.") },
        { icon: "shield", title: L("Looked after, end to end", "رعاية من البداية للنهاية"), desc: L("We stay reachable throughout your trip, not just until you've paid.", "نبقى على تواصل طوال رحلتك، لا حتى الدفع فقط.") },
      ],
    },
  },
  {
    type: "featured_packages",
    enabled: true,
    content: {
      eyebrow: L("Featured packages", "باقات مختارة"),
      heading: L("Journeys ready to book.", "رحلات جاهزة للحجز."),
      link: L("See all packages", "كل الباقات"),
      limit: 4,
    },
  },
  {
    type: "destinations",
    enabled: true,
    content: {
      eyebrow: L("Where we go", "وجهاتنا"),
      heading: L("Destinations we love.", "وجهات نعشقها."),
      images: {},
    },
  },
  {
    type: "services",
    enabled: true,
    content: {
      eyebrow: L("What we do", "ماذا نقدّم"),
      heading: L("Every kind of trip, planned with care.", "كل أنواع الرحلات، بعناية."),
      items: [
        { icon: "plane", title: L("Curated escapes", "رحلات مختارة"), desc: L("Signature getaways, shaped around a place and a season.", "رحلات مميّزة مصمّمة حول المكان والموسم.") },
        { icon: "moon", title: L("Umrah, without the fatigue", "عمرة بلا تعب"), desc: L("Spiritual trips planned for comfort and calm.", "رحلات روحانية مخطّطة للراحة والطمأنينة.") },
        { icon: "heart", title: L("Honeymoons & celebrations", "شهر العسل والمناسبات"), desc: L("Quietly special trips for the moments that matter.", "رحلات مميّزة للحظات التي تهمّك.") },
        { icon: "car", title: L("Private transfers & guides", "تنقّلات ومرشدون"), desc: L("Door-to-door logistics and local experts on the ground.", "تنقّلات من الباب للباب وخبراء محليّون.") },
      ],
    },
  },
  {
    type: "stats",
    enabled: true,
    content: {
      eyebrow: L("By the numbers", "بالأرقام"),
      heading: L("A few honest numbers.", "بعض الأرقام الصادقة."),
      years: 5,
      travellers: 2500,
      rating: 4.8,
      fallbackNote: L("", ""),
      qualities: [
        L("Hand-planned trips, every time", "رحلات مخطّطة يدوياً في كل مرّة"),
        L("Reachable throughout your journey", "متواصلون طوال رحلتك"),
      ],
    },
  },
  {
    type: "seasonal_offers",
    enabled: true,
    content: {
      eyebrow: L("Seasonal", "موسمي"),
      heading: L("Cappadocia at dawn, this autumn.", "كابادوكيا عند الفجر، هذا الخريف."),
      body: L(
        "A slow four-day escape timed for the balloon season — hot mornings over the valleys, cave-hotel evenings, and nothing on the schedule you didn't ask for.",
        "رحلة هادئة من أربعة أيام في موسم المناطيد — صباحات فوق الوديان، أمسيات في فنادق الكهوف، ولا شيء في البرنامج لم تطلبه."
      ),
      cta: L("Plan this trip", "خطّط لهذه الرحلة"),
      image: IMG("1570168007204-dfb528c6958f"),
    },
  },
  {
    type: "testimonials",
    enabled: true,
    content: {
      eyebrow: L("Travelers' words", "كلمات مسافرينا"),
      heading: L("What guests say.", "ماذا يقول ضيوفنا."),
      items: [
        { quote: L("They planned everything over WhatsApp and it just worked — we never once felt rushed.", "خطّطوا كل شيء عبر واتساب ونجح الأمر — لم نشعر بالعجلة أبداً."), name: "Layla A.", trip: L("Maldives · 2026", "المالديف · ٢٠٢٦") },
        { quote: L("Our Umrah was calm and well-paced from start to finish. Exactly what we hoped for.", "كانت عمرتنا هادئة ومنظّمة من البداية للنهاية. تماماً كما تمنّينا."), name: "Omar K.", trip: L("Umrah · 2026", "عمرة · ٢٠٢٦") },
      ],
    },
  },
  {
    type: "accreditation",
    enabled: true,
    content: {
      eyebrow: L("Registered & accredited", "مسجّلون ومعتمدون"),
      tag: L("Verified", "موثّق"),
      badges: [
        { title: L("Licensed travel agency", "وكالة سفر مرخّصة"), note: L("Ministry of Tourism", "وزارة السياحة") },
        { title: L("IATA accredited", "معتمد لدى آياتا"), note: L("Member in good standing", "عضوية سارية") },
        { title: L("Secure payments", "مدفوعات آمنة"), note: L("Protected checkout", "دفع محمي") },
        { title: L("ATOL protected", "محمي ضمن ATOL"), note: L("Your trip is covered", "رحلتك مغطّاة") },
      ],
    },
  },
  {
    type: "contact",
    enabled: true,
    content: {
      eyebrow: L("Get in touch", "تواصل معنا"),
      heading: L("Plan your journey with us.", "خطّط رحلتك معنا."),
      body: L(
        "Tell us where you'd like to go and how you like to travel — we'll shape a trip around it and reply on WhatsApp, usually within the hour.",
        "أخبرنا إلى أين تودّ الذهاب وكيف تحبّ السفر — سنصمّم رحلة حول ذلك ونردّ على واتساب، عادةً خلال ساعة."
      ),
      note: L("No call centres. You'll always talk to someone who knows your trip.", "بلا مراكز اتصال. ستتحدث دائماً مع من يعرف رحلتك."),
    },
  },
];

// ── About-page sections (users/{uid}.aboutPage) ──────────────────────────────
// About catalog = hero, about, why_us, team, testimonials, stats, accreditation,
// contact. `team` is About-only (never offered on the homepage).
const ABOUT_SECTIONS = [
  {
    type: "hero",
    enabled: true,
    content: {
      eyebrow: L("About Maraya", "عن مرايا"),
      headline: L("The people behind the journeys.", "الأشخاص خلف الرحلات."),
      sub: L(
        "A small studio of planners who believe travel should feel personal, unhurried, and genuinely looked after.",
        "استوديو صغير من المخطّطين يؤمنون بأن السفر يجب أن يكون شخصياً، بلا عجلة، وبرعاية حقيقية."
      ),
      image: IMG("1500835556837-99ac94a94552"),
    },
  },
  {
    type: "about",
    enabled: true,
    content: {
      eyebrow: L("Our story", "قصتنا"),
      heading: L("Started by travelers, for travelers.", "بدأها مسافرون، لمسافرين."),
      body: L(
        "Maraya began with a simple frustration: trips that felt like checklists instead of experiences. We set out to plan travel the way we wished someone had planned ours — slowly, thoughtfully, and around the people taking the trip. Today we design a small number of journeys each season so every one gets the care it deserves.",
        "بدأت مرايا من إحباط بسيط: رحلات تشبه قوائم المهام بدل التجارب. أردنا أن نخطّط السفر كما تمنّينا أن يخطّطه أحدهم لنا — بتأنٍّ وعناية، وحول من يسافر فعلاً. اليوم نصمّم عدداً محدوداً من الرحلات كل موسم لتنال كل واحدة العناية التي تستحقها."
      ),
      link: L("Explore our trips", "تصفّح رحلاتنا"),
      image: IMG("1469854523086-cc02fe5d8800"),
    },
  },
  {
    type: "why_us",
    enabled: true,
    content: {
      eyebrow: L("What we value", "قيمنا"),
      heading: L("The principles behind every trip.", "المبادئ خلف كل رحلة."),
      items: [
        { icon: "heart", title: L("People first", "الناس أولاً"), desc: L("We plan around the travelers, not a fixed itinerary.", "نخطّط حول المسافرين، لا حول برنامج جامد.") },
        { icon: "moon", title: L("Unhurried by design", "التأنّي بالتصميم"), desc: L("Space to rest is part of the plan, never an afterthought.", "وقت الراحة جزء من الخطة، لا أمر ثانوي.") },
        { icon: "shield", title: L("Honest and transparent", "صدق وشفافية"), desc: L("Clear pricing and real expectations — no surprises.", "أسعار واضحة وتوقّعات صادقة — بلا مفاجآت.") },
        { icon: "star", title: L("Craft over volume", "الإتقان قبل الكم"), desc: L("Fewer trips, each planned with genuine care.", "رحلات أقل، كلٌّ منها بعناية حقيقية.") },
      ],
    },
  },
  {
    type: "team",
    enabled: true,
    content: {
      eyebrow: L("The team", "الفريق"),
      heading: L("Meet the planners.", "تعرّف على المخطّطين."),
      note: L(
        "Real people you'll actually talk to — the same ones who plan your trip answer your WhatsApp.",
        "أشخاص حقيقيون ستتحدث معهم فعلاً — نفس من يخطّط رحلتك يردّ على واتساب."
      ),
      members: [
        { name: L("Sara Al-Rashid", "سارة الراشد"), role: L("Founder & lead planner", "المؤسِّسة وكبيرة المخطّطين"), photo: IMG("1573496359142-b8d87734a5a2", 600) },
        { name: L("Yousef Haddad", "يوسف حدّاد"), role: L("Destinations & logistics", "الوجهات واللوجستيات"), photo: IMG("1500648767791-00dcc994a43e", 600) },
        { name: L("Mariam Saleh", "مريم صالح"), role: L("Guest experience", "تجربة الضيوف"), photo: IMG("1487412720507-e7ab37603c6f", 600) },
        { name: L("Khalid Nasser", "خالد ناصر"), role: L("Umrah & spiritual trips", "العمرة والرحلات الروحانية"), photo: "" },
      ],
    },
  },
  {
    type: "stats",
    enabled: true,
    content: {
      eyebrow: L("By the numbers", "بالأرقام"),
      heading: L("A few honest numbers.", "بعض الأرقام الصادقة."),
      years: 5,
      travellers: 2500,
      rating: 4.8,
      fallbackNote: L("", ""),
      qualities: [
        L("Hand-planned trips, every time", "رحلات مخطّطة يدوياً في كل مرّة"),
        L("Reachable throughout your journey", "متواصلون طوال رحلتك"),
      ],
    },
  },
  {
    type: "accreditation",
    enabled: true,
    content: {
      eyebrow: L("Registered & accredited", "مسجّلون ومعتمدون"),
      tag: L("Verified", "موثّق"),
      badges: [
        { title: L("Licensed travel agency", "وكالة سفر مرخّصة"), note: L("Ministry of Tourism", "وزارة السياحة") },
        { title: L("IATA accredited", "معتمد لدى آياتا"), note: L("Member in good standing", "عضوية سارية") },
        { title: L("Secure payments", "مدفوعات آمنة"), note: L("Protected checkout", "دفع محمي") },
        { title: L("ATOL protected", "محمي ضمن ATOL"), note: L("Your trip is covered", "رحلتك مغطّاة") },
      ],
    },
  },
  {
    type: "contact",
    enabled: true,
    content: {
      eyebrow: L("Get in touch", "تواصل معنا"),
      heading: L("Plan your journey with us.", "خطّط رحلتك معنا."),
      body: L(
        "Tell us where you'd like to go and how you like to travel — we'll shape a trip around it and reply on WhatsApp, usually within the hour.",
        "أخبرنا إلى أين تودّ الذهاب وكيف تحبّ السفر — سنصمّم رحلة حول ذلك ونردّ على واتساب، عادةً خلال ساعة."
      ),
      note: L("No call centres. You'll always talk to someone who knows your trip.", "بلا مراكز اتصال. ستتحدث دائماً مع من يعرف رحلتك."),
    },
  },
];

function buildSections(list) {
  return {
    version: 1,
    sections: list.map((s, i) => ({
      type: s.type,
      enabled: s.enabled !== false,
      order: i,
      content: s.content,
    })),
  };
}

function buildHomepage() {
  return buildSections(SECTIONS);
}

function buildAboutPage() {
  return buildSections(ABOUT_SECTIONS);
}

async function main() {
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "(unknown)";
  console.log(`\nProject: ${project}`);
  console.log(`Agency:  ${AGENCY_SLUG}\n`);

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

  // Heads-up if there are no packages — featured_packages + destinations derive
  // from them, so those two sections would render empty/hidden without any.
  const pkgsSnap = await db.collection("packages")
    .where("agencySlug", "==", AGENCY_SLUG)
    .get();
  console.log(`Published packages found: ${pkgsSnap.size}` +
    (pkgsSnap.empty ? "  (featured_packages + destinations will be empty)" : ""));

  const homepage = buildHomepage();
  const aboutPage = buildAboutPage();

  await userDoc.ref.set({ homepage, aboutPage, updatedAt: Date.now() }, { merge: true });

  console.log(`\nWrote homepage with ${homepage.sections.length} sections:`);
  for (const s of homepage.sections) {
    console.log(`  ${String(s.order).padStart(2)}. ${s.type}${s.enabled ? "" : "  (disabled)"}`);
  }
  console.log(`\nWrote aboutPage with ${aboutPage.sections.length} sections:`);
  for (const s of aboutPage.sections) {
    console.log(`  ${String(s.order).padStart(2)}. ${s.type}${s.enabled ? "" : "  (disabled)"}`);
  }
  console.log("\nDone. Home → /<slug>/home · About → /<slug>/about (or root if siteMode=site).\n");
}

main().catch(err => { console.error(err); process.exit(1); });
