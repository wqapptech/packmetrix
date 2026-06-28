/**
 * One-off migration: import the public content of https://www.nlinareyes.com/
 * ("هولندا بعيون عربية" / Netherlands Through Arab Eyes) into the staging account
 * waleed@packmetrix.com.
 *
 * Writes:
 *   • users/{uid}            → agencySlug, brand fields (tagline/about/socials/
 *                              contact), storefront fields, homepage, aboutPage,
 *                              siteMode
 *   • packages (x3)          → full Aurora-template package docs (Arabic primary,
 *                              bilingual title/description), upserted idempotently
 *                              by (userId + migratedSlug)
 *
 * Template: aurora.  primaryLanguage: ar.  Bilingual title/description.
 *
 * Run against staging (default project in .env.local):
 *   node --env-file=.env.local scripts/migrate-nlinareyes.js --dry-run
 *   node --env-file=.env.local scripts/migrate-nlinareyes.js
 *
 * Idempotent — re-running UPDATES the same 3 packages (match key migratedSlug)
 * and re-writes the brand/homepage wholesale via merge:true.
 */

"use strict";

const admin = require("firebase-admin");

const isDryRun = process.argv.includes("--dry-run");

const rawKey = process.env.FIREBASE_ADMIN_KEY;
if (!rawKey) throw new Error("Missing FIREBASE_ADMIN_KEY");
const serviceAccount = JSON.parse(rawKey);
serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
});
const db = admin.firestore();

// ── Config ───────────────────────────────────────────────────────────────────
const TARGET_EMAIL = "waleed@packmetrix.com";
const AGENCY_SLUG  = "eyes-on-europe";
const TEMPLATE_ID  = "aurora";
const WHATSAPP     = "+31638154776";
const SOURCE_URL   = "https://www.nlinareyes.com/";

// Source images (Arabic filenames → percent-encoded).
const U = (p) => encodeURI(`https://www.nlinareyes.com/wp-content/uploads/${p}`);
const IMG = {
  holland1:  U("2026/02/هولندا-بعيون-عربية-1024x682.jpg"),
  holland2:  U("2026/02/هولندا-بعيون-عربية-2-1024x683.jpg"),
  holland3:  U("2026/02/هولندا-بعيون-عربية-3-1024x683.jpg"),
  honeymoon: U("2026/02/بكج-شهر-عسل-هولندا-عيد-الاضحى-2026-572x1024.jpg"),
  ams1:      U("2026/02/بكج-سياحي-امستردام-7-ايام-رحلة-ساحرة-بين-القنوات-والطبيعة-الأوروبية-1.jpg"),
  ams2:      U("2026/02/بكج-سياحي-امستردام-7-ايام-رحلة-ساحرة-بين-القنوات-والطبيعة-الأوروبية-2.jpg"),
  ams3:      U("2026/02/بكج-سياحي-امستردام-7-ايام-رحلة-ساحرة-بين-القنوات-والطبيعة-الأوروبية-3.jpg"),
  ams4:      U("2026/02/بكج-سياحي-امستردام-7-ايام-رحلة-ساحرة-بين-القنوات-والطبيعة-الأوروبية-4.jpg"),
  eid:       U("2026/02/eid-al-adha-holidays-netherlands-7-days-6-nights-572x1024.jpg"),
  // Destination tiles (source homepage "وجهاتك المميزة" section)
  destNL:    U("2026/02/هولندا11-1024x1024.png"),
  destFR:    U("2026/02/55-1-1024x1024.png"),
  destDE:    U("2026/02/المانيا-1024x1024.png"),
  destBE:    U("2026/02/بلجيكا-1024x1024.png"),
  spring:    U("2026/02/الربيع_في_هولندا.webp"),
};

const ABOUT_AR =
  "عيون على أوروبا شركة سياحية مسجّلة رسمياً ومقرّها أمستردام، تعمل وفق القوانين والأنظمة الأوروبية. " +
  "فريقنا يتحدث العربية ويعرف عادات الضيف العربي وتقاليده، ونقدّم خدمات سياحية متكاملة من الجولات المنظّمة " +
  "والاستقبال من المطار إلى الرحلات العائلية وشهر العسل وحجوزات الفنادق والخدمات المميّزة. وجهتك الموثوقة " +
  "لاكتشاف جمال هولندا وأوروبا بروح عربية.";
const ABOUT_EN =
  "Eyes On Europe is an officially registered tourism company based in Amsterdam, " +
  "operating under European law. Our Arabic-speaking team understands the customs and expectations of " +
  "Arab travellers, offering end-to-end services — guided tours, airport pickup, family holidays, " +
  "honeymoons, hotel bookings and VIP services. Your trusted gateway to the beauty of the Netherlands " +
  "and Europe, with an Arab spirit.";

// ── Brand / storefront fields written to the user doc ─────────────────────────
const BRAND = {
  agencySlug:         AGENCY_SLUG,
  siteMode:           "site",
  // Arabic name override — brandFromUser() uses nameAr in Arabic mode and falls
  // back to the account `name` ("Eyes On Europe") in English mode. Same for tagline.
  nameAr:             "عيون على أوروبا",
  tagline:            "Your trusted gateway to the Netherlands & Europe, with an Arab spirit",
  taglineAr:          "وجهتك الموثوقة لاكتشاف جمال هولندا وأوروبا بروح عربية",
  brandColor:         "#C2410C", // Dutch-orange / terracotta
  fontPairing:        "editorial",
  storefrontLanguage: "ar",
  whatsapp:           WHATSAPP,
  phone:              WHATSAPP,
  // NOTE: users/{uid}.email is the ACCOUNT identity email AND the brand contact
  // email (lib/brand.ts reads u.email). We must NOT clobber it with the source's
  // hollandtae83@gmail.com — that address can't be migrated as a separate field.
  about_ar:           ABOUT_AR,
  about_en:           ABOUT_EN,
  // Source published no stats — these are reasonable placeholders (see report).
  statsYears:         6,
  statsTravellers:    1500,
  statsRating:        4.9,
  socials: {
    instagram: "hollandtae83",
    snapchat:  "bassam4-23",
    tiktok:    "hollandtae",
    facebook:  "profile.php?id=61556067007355",
    youtube:   "@HollandTaetourism",
    x:         "HollandTae98631",
  },
};

// ── Homepage / About page (users/{uid}.homepage / .aboutPage) ─────────────────
const L = (en, ar) => ({ en, ar });

const HOME_SECTIONS = [
  { type: "hero", content: {
      eyebrow:  L("Netherlands, with an Arab spirit", "هولندا بروح عربية"),
      headline: L("Discover the Netherlands & Europe, the way you'd want it.", "اكتشف هولندا وأوروبا كما تتمنّاها."),
      sub: L(
        "An Amsterdam-based, Arabic-speaking tour operator. Private transfers, curated itineraries, and someone who speaks your language — start to finish.",
        "شركة سياحية مقرّها أمستردام بفريق يتحدث العربية. نقل خاص، برامج مدروسة، ومن يتحدث لغتك من البداية حتى النهاية."
      ),
      image: IMG.holland1,
  }},
  { type: "about", content: {
      eyebrow: L("About us", "من نحن"),
      heading: L("Officially registered. Genuinely Arab-friendly.", "مسجّلون رسمياً، وقريبون من الضيف العربي."),
      body: L(ABOUT_EN, ABOUT_AR),
      link: L("Our story", "قصتنا"),
      image: IMG.holland2,
  }},
  { type: "why_us", content: {
      eyebrow: L("Why us", "لماذا نحن"),
      heading: L("Travel the Netherlands without the friction.", "سافر إلى هولندا دون عناء."),
      items: [
        { icon: "chat",   title: L("Arabic-speaking team",   "فريق يتحدث العربية"), desc: L("Plan and travel with people who speak your language.", "خطّط وسافر مع من يتحدث لغتك.") },
        { icon: "car",    title: L("Private transfers",        "نقل خاص"),           desc: L("Airport pickup and a private driver throughout your trip.", "استقبال من المطار وسائق خاص طوال رحلتك.") },
        { icon: "star",   title: L("Five-star comfort",        "راحة بخمس نجوم"),    desc: L("Carefully chosen hotels and a relaxed, well-paced plan.", "فنادق مختارة بعناية وبرنامج مريح ومتوازن.") },
        { icon: "shield", title: L("Registered & licensed",    "مسجّلون ومرخّصون"),  desc: L("An official tourism company based in Amsterdam.", "شركة سياحية رسمية مقرّها أمستردام.") },
      ],
  }},
  { type: "featured_packages", content: {
      eyebrow: L("Packages", "الباقات"),
      heading: L("Trips ready to book.", "رحلات جاهزة للحجز."),
      link: L("See all packages", "كل الباقات"),
      limit: 4,
  }},
  { type: "destinations", content: {
      eyebrow: L("Where we operate", "الدول التي نعمل بها"),
      heading: L("Discover Europe, country by country.", "اكتشف أوروبا، دولةً بعد دولة."),
      images: {},
      // Every country has packages → tiles deep-link to the catalog pre-filtered
      // by the country's exact package `destination` value (filter).
      items: [
        { name: L("Netherlands", "هولندا"), image: IMG.destNL, clickable: true, filter: "هولندا" },
        { name: L("France",      "فرنسا"),  image: IMG.destFR, clickable: true, filter: "فرنسا" },
        { name: L("Germany",     "ألمانيا"), image: IMG.destDE, clickable: true, filter: "ألمانيا" },
        { name: L("Belgium",     "بلجيكا"),  image: IMG.destBE, clickable: true, filter: "بلجيكا" },
      ],
  }},
  { type: "services", content: {
      eyebrow: L("What we do", "ماذا نقدّم"),
      heading: L("Every kind of trip, planned with care.", "كل أنواع الرحلات، بعناية."),
      items: [
        { icon: "plane", title: L("Guided tours",        "جولات سياحية منظّمة"), desc: L("Organised day tours with an Arabic-speaking guide.", "جولات يومية منظّمة مع مرشد يتحدث العربية.") },
        { icon: "car",   title: L("Airport transfers",   "استقبال من المطار"),   desc: L("Airport pickup, drop-off and private drivers throughout.", "استقبال وتوديع من المطار وسائقون خاصون طوال الرحلة.") },
        { icon: "users", title: L("Family holidays",     "رحلات عائلية"),        desc: L("Comfortable holidays designed around families.", "إجازات مريحة مصمّمة حول العائلة.") },
        { icon: "heart", title: L("Honeymoons",          "شهر العسل"),           desc: L("Private, romantic trips for newlyweds.", "رحلات خاصة ورومانسية للعرسان.") },
        { icon: "hotel", title: L("Hotel booking",       "حجز الفنادق"),         desc: L("Carefully chosen hotels booked on your behalf.", "فنادق مختارة بعناية نحجزها نيابةً عنك.") },
        { icon: "star",  title: L("VIP & luxury service", "خدمات VIP والفخامة"), desc: L("Premium add-ons and bespoke five-star experiences.", "خدمات مميّزة وتجارب فاخرة بخمس نجوم.") },
      ],
  }},
  { type: "stats", content: {
      eyebrow: L("By the numbers", "بالأرقام"),
      heading: L("A few honest numbers.", "بعض الأرقام."),
      years: BRAND.statsYears, travellers: BRAND.statsTravellers, rating: BRAND.statsRating,
      fallbackNote: L("", ""),
      qualities: [
        L("Arabic-speaking, Amsterdam-based", "فريق عربي ومقرّه أمستردام"),
        L("Private transfers on every trip",   "نقل خاص في كل رحلة"),
      ],
  }},
  { type: "contact", content: {
      eyebrow: L("Get in touch", "تواصل معنا"),
      heading: L("Plan your trip with us.", "خطّط رحلتك معنا."),
      body: L(
        "Tell us where you'd like to go — we'll shape a trip around it and reply on WhatsApp.",
        "أخبرنا إلى أين تودّ الذهاب — سنصمّم رحلة حول ذلك ونردّ على واتساب."
      ),
      note: L("Amsterdam · Arabic-speaking team", "أمستردام · فريق يتحدث العربية"),
  }},
];

const ABOUT_PAGE_SECTIONS = [
  { type: "hero", content: {
      eyebrow:  L("About us", "من نحن"),
      headline: L("Eyes On Europe", "عيون على أوروبا"),
      sub: L(
        "An officially registered, Amsterdam-based tour operator built for Arab travellers.",
        "شركة سياحية مسجّلة رسمياً ومقرّها أمستردام، مصمّمة للمسافر العربي."
      ),
      image: IMG.holland3,
  }},
  { type: "about", content: {
      eyebrow: L("Our story", "قصتنا"),
      heading: L("Your gateway to the Netherlands & Europe.", "بوابتك إلى هولندا وأوروبا."),
      body: L(ABOUT_EN, ABOUT_AR),
      link: L("See our packages", "تصفّح باقاتنا"),
      image: IMG.holland1,
  }},
  { type: "why_us", content: {
      eyebrow: L("Why choose us", "لماذا تختارنا"),
      heading: L("Professional, cultural, five-star.", "احترافية، ثقافة، وخمس نجوم."),
      items: [
        { icon: "star",   title: L("Professional expertise", "خبرة احترافية"), desc: L("Precision and care in every detail of your trip.", "دقة وعناية في كل تفصيل من رحلتك.") },
        { icon: "chat",   title: L("Cultural knowledge",     "معرفة ثقافية"),  desc: L("A team that understands Arab customs and tastes.", "فريق يفهم عادات الضيف العربي وأذواقه.") },
        { icon: "shield", title: L("Five-star comfort",      "راحة بخمس نجوم"), desc: L("Carefully chosen hotels and a relaxed pace.", "فنادق مختارة بعناية وإيقاع مريح.") },
      ],
  }},
  { type: "contact", content: {
      eyebrow: L("Get in touch", "تواصل معنا"),
      heading: L("Plan your journey with us.", "خطّط رحلتك معنا."),
      body: L(
        "Reach us on WhatsApp and we'll reply with a plan shaped around you.",
        "تواصل معنا عبر واتساب وسنردّ بخطة مصمّمة حولك."
      ),
      note: L("Amsterdam · hollandtae83@gmail.com", "أمستردام · hollandtae83@gmail.com"),
  }},
];

function buildConfig(list) {
  return {
    version: 1,
    sections: list.map((s, i) => ({ type: s.type, enabled: s.enabled !== false, order: i, content: s.content })),
  };
}

// ── The 3 packages (Arabic-primary sections; bilingual title/description) ─────
const PEOPLE = [{
  id: "p1", role: "agent", name: "فريق عيون على أوروبا",
  bio: "فريق يتحدث العربية ومقرّه أمستردام، يخطّط رحلتك ويرافقها من الاستقبال حتى التوديع.",
  photo: "", languages: ["العربية", "الإنجليزية", "الهولندية"], years: 6, repliesIn: "خلال ساعة",
}];

const ABOUT_AGENCY_SEC = { type: "about_agency", data: { content: ABOUT_AR, image: IMG.holland2 } };
const PEOPLE_SEC       = { type: "people",       data: { people: PEOPLE } };

const PACKAGES = [
  // 1 ── Honeymoon, Eid Al-Adha 2026 ──────────────────────────────────────────
  {
    migratedSlug: "honeymoon-eid-2026",
    titleEn: "Netherlands Honeymoon Package — Eid Al-Adha 2026",
    titleAr: "بكج شهر عسل هولندا — عيد الأضحى ٢٠٢٦",
    descriptionEn: "Seven days of magic and romance through the Dutch countryside, designed for Arab newlyweds seeking privacy and luxury during the Eid holiday.",
    descriptionAr: "سبعة أيام من السحر والرومانسية في الريف الهولندي، مصمّمة خصيصاً للعرسان العرب الباحثين عن الخصوصية والفخامة خلال إجازة عيد الأضحى.",
    destination: "هولندا",
    price: "€2400", currency: "EUR", nights: "6",
    coverImage: IMG.honeymoon,
    sections: [
      { type: "highlights", data: { items: [
        "نقل خاص مع سائق يتحدث العربية في جميع أنحاء هولندا",
        "إقامة في فنادق ٥ نجوم بأجنحة خاصة وإطلالات ساحرة",
        "استقبال وتوديع من المطار وخصوصية تامة للعرسان",
      ]}},
      { type: "itinerary", data: { days: [
        { day: 1, chapter: "الوصول", title: "الوصول إلى أمستردام", desc: "الوصول إلى عاصمة القنوات والجمال. استقبال من المطار والانتقال إلى الفندق، ومساء حر لاكتشاف المدينة.", img: IMG.holland1 },
        { day: 2, chapter: "السحر",  title: "قرية الطواحين", desc: "زيارة قرية الطواحين التقليدية (زانسا سخانس): متاحف وفنون وحرف يدوية لا تُنسى.", img: "" },
        { day: 3, chapter: "الطبيعة", title: "رحلات الطبيعة", desc: "حدائق كيوكنهوف ومزارع الزهور وأجواء الريف الهولندي الساحرة.", img: "" },
        { day: 4, chapter: "الهدوء",  title: "قرية الصيادين", desc: "فولندام، ملاذكم الهادئ على الشواطئ الساحلية بأجوائها البحرية الأصيلة.", img: "" },
        { day: 5, chapter: "الأناقة", title: "لاهاي", desc: "العاصمة السياسية والجمال الملكي: قصور ومتاحف وشواطئ راقية.", img: "" },
        { day: 6, chapter: "السكون",  title: "قرية خيتهورن", desc: "بندقية الشمال الساحرة، حيث تحلّ القوارب محلّ السيارات.", img: "" },
        { day: 7, chapter: "الوداع",  title: "روتردام والمغادرة", desc: "بوابة عالم المكعبات والأبراج، ثم التوديع بذكريات لا تُنسى.", img: "" },
      ]}},
      { type: "hotels", data: { hotels: [
        { name: "فندق ٥ نجوم في أمستردام", stars: 5, nights: "6", location: "أمستردام، هولندا",
          note: "إقامة فاخرة بأجنحة خاصة وإطلالات خلابة. نختار لكم الغرفة الأنسب حسب تفضيلاتكم.",
          facilities: ["أجنحة خاصة", "إطلالات ساحرة", "موقع مركزي"], photo: IMG.holland3 },
      ]}},
      { type: "inclusions", data: {
        includes: ["نقل خاص مع سائق يتحدث العربية", "إقامة ٦ ليالٍ في فندق ٥ نجوم", "استقبال وتوديع من المطار", "خصوصية تامة للعرسان"],
        excludes: ["تذاكر الطيران الدولية", "جميع الوجبات", "رسوم الدخول للمعالم والأنشطة الاختيارية", "المصاريف الشخصية"],
      }},
      { type: "meals", data: { plan: "none", notes: "الوجبات غير مشمولة في هذه الباقة." }},
      { type: "visa",  data: { included: "no", content: "تأشيرة شنغن غير مشمولة؛ يسعدنا مساعدتكم في تجهيز المستندات." }},
      { type: "departures", data: { entries: [
        { date: "2026-05-25", returnDate: "2026-05-31", spots: 6, price: "", deal: false },
      ]}},
      { type: "pricing", data: { tiers: [
        { label: "للعروسين (شخصان)", price: "€2400" },
      ], cancellation: "", paymentContent: "", paymentSteps: [], termsContent: "" }},
      { type: "transfers", data: {
        description: "نقل خاص فاخر مع سائق يتحدث العربية يضمن الخصوصية والراحة طوال الرحلة.",
        items: ["استقبال من المطار → الفندق", "تنقّلات داخلية خاصة بين المدن", "الفندق → المطار"],
      }},
      { type: "important_notes", data: { notes: [
        { text: "السعر للعروسين (شخصان) ولا يشمل تذاكر الطيران." },
        { text: "الوجبات غير مشمولة في هذه الباقة." },
        { text: "تواريخ عيد الأضحى تقريبية وتُؤكَّد عند الحجز." },
      ]}},
      ABOUT_AGENCY_SEC, PEOPLE_SEC,
      { type: "media", data: { images: [IMG.honeymoon, IMG.holland1, IMG.holland2, IMG.holland3], videoUrl: "" }},
      { type: "reviews", data: { reviews: [] }},
    ],
  },

  // 2 ── Amsterdam 7 days ──────────────────────────────────────────────────────
  {
    migratedSlug: "amsterdam-7-days",
    titleEn: "Amsterdam 7-Day Package — Canals & European Nature",
    titleAr: "بكج سياحي أمستردام ٧ أيام — رحلة ساحرة بين القنوات والطبيعة",
    descriptionEn: "An enchanting journey blending natural beauty and rich culture — Amsterdam's canals, world-class museums and calm European corners.",
    descriptionAr: "رحلة ساحرة تجمع بين الجمال الطبيعي والثقافة الغنية: قنوات أمستردام، المتاحف العالمية، وأجواء أوروبية هادئة.",
    destination: "هولندا",
    price: "€2600", currency: "EUR", nights: "7",
    coverImage: IMG.ams1,
    sections: [
      { type: "highlights", data: { items: [
        "جولة بالقارب في قنوات أمستردام مع انعكاسات الغروب",
        "زيارة متحف فان جوخ والريكسموزيوم وحي جوردان",
        "حدائق كيوكنهوف وطواحين زانسا سخانس",
      ]}},
      { type: "itinerary", data: { days: [
        { day: 1, chapter: "الوصول", title: "الوصول وجولة القنوات", desc: "استقبال من المطار، جولة بالقارب في القنوات عند الغروب، ومساء في ساحة الدام بين عروض الشارع.", img: IMG.ams1 },
        { day: 2, chapter: "الفنون", title: "المتاحف والفنون", desc: "متحف فان جوخ والريكسموزيوم، ثم تجوّل في حي جوردان ومقاهيه المستقلة.", img: IMG.ams2 },
        { day: 3, chapter: "الطبيعة", title: "كيوكنهوف والطواحين", desc: "حدائق كيوكنهوف وطواحين زانسا سخانس وحرفها التقليدية.", img: IMG.ams3 },
        { day: 4, chapter: "الحداثة", title: "روتردام الحديثة", desc: "بيوت المكعبات وسوق ماركت هال وأجواء العمارة المعاصرة.", img: IMG.ams4 },
        { day: 5, chapter: "الساحل", title: "لاهاي والشاطئ", desc: "متحف موريتشهاوس وشاطئ شيفيننغن للراحة والمشي.", img: "" },
        { day: 6, chapter: "التاريخ", title: "أوتريخت التاريخية", desc: "قنوات أوتريخت وصعود برج الدوم وأجواء المدينة الهادئة.", img: "" },
        { day: 7, chapter: "الوداع", title: "تسوّق ومغادرة", desc: "سوق الزهور العائم، تسوّق للهدايا، وجبة هولندية تقليدية، ثم التوديع من المطار.", img: "" },
      ]}},
      { type: "hotels", data: { hotels: [
        { name: "فندق ٤ نجوم في أمستردام", stars: 4, nights: "7", location: "أمستردام، هولندا",
          note: "إقامة ٧ ليالٍ في موقع مميّز بأمستردام، قريب من أبرز المعالم.",
          facilities: ["موقع مركزي", "إفطار يومي", "قريب من المعالم"], photo: IMG.ams2 },
      ]}},
      { type: "inclusions", data: {
        includes: ["استقبال وتوديع من المطار", "إقامة ٧ ليالٍ في فندق ٤ نجوم مع إفطار", "٣ أيام جولات منظّمة بسيارة خاصة", "مرشد محلي", "برنامج شامل لأبرز معالم أمستردام"],
        excludes: ["تذاكر الطيران", "الوجبات عدا الإفطار", "رسوم الدخول للمعالم", "المصاريف الشخصية"],
      }},
      { type: "meals", data: { plan: "breakfast", notes: "إفطار يومي في الفندق. باقي الوجبات على حساب الضيف." }},
      { type: "visa",  data: { included: "no", content: "تأشيرة شنغن غير مشمولة." }},
      { type: "pricing", data: { tiers: [
        { label: "السعر الإجمالي للباقة", price: "€2600" },
      ], cancellation: "", paymentContent: "", paymentSteps: [], termsContent: "" }},
      { type: "transfers", data: {
        description: "استقبال وتوديع من المطار، وسيارة خاصة خلال أيام الجولات المنظّمة.",
        items: ["استقبال من المطار → الفندق", "سيارة خاصة خلال ٣ أيام جولات", "الفندق → المطار"],
      }},
      { type: "important_notes", data: { notes: [
        { text: "عنوان الباقة يذكر ٧ أيام بينما يشمل التفصيل ٦ أيام جولات؛ تُؤكَّد التفاصيل عند الحجز." },
        { text: "يُنصح باستخدام الدراجات والقوارب والمواصلات العامة للتنقّل داخل المدن." },
      ]}},
      ABOUT_AGENCY_SEC, PEOPLE_SEC,
      { type: "media", data: { images: [IMG.ams1, IMG.ams2, IMG.ams3, IMG.ams4], videoUrl: "" }},
      { type: "reviews", data: { reviews: [] }},
    ],
  },

  // 3 ── Eid Al-Adha week ───────────────────────────────────────────────────────
  {
    migratedSlug: "eid-al-adha-week",
    titleEn: "Eid Al-Adha Offer — One Week in the Netherlands",
    titleAr: "عروض عيد الأضحى — السفر إلى هولندا أسبوع",
    descriptionEn: "A complete European getaway blending natural beauty with comfortable hotels in the heart of Europe, timed for the Eid Al-Adha holiday.",
    descriptionAr: "تجربة سفر أوروبية متكاملة تجمع جمال الطبيعة بإقامة مريحة في قلب أوروبا، خلال إجازة عيد الأضحى.",
    destination: "هولندا",
    price: "€2100", currency: "EUR", nights: "6",
    coverImage: IMG.eid,
    sections: [
      { type: "highlights", data: { items: [
        "نقل خاص مع سائق يتحدث العربية في جميع أنحاء هولندا",
        "جولات يومية بصحبة مرشد",
        "زيارة أمستردام ولاهاي والطواحين وفولندام وخيتهورن",
      ]}},
      { type: "itinerary", data: { days: [
        { day: 1, chapter: "الوصول", title: "الوصول إلى أمستردام", desc: "بداية الرحلة في قلب أمستردام، استقبال من المطار والانتقال إلى الفندق، وتعرّف على القنوات والعمارة التاريخية.", img: IMG.holland1 },
        { day: 2, chapter: "الفنون", title: "متاحف وفنون أمستردام", desc: "يوم مخصّص للمتاحف والتجارب الثقافية مع جولة مرشدة.", img: "" },
        { day: 3, chapter: "البحر", title: "أجواء فولندام البحرية", desc: "زيارة قرية الصيد التقليدية والاستمتاع بالحياة البحرية الأصيلة ومطاعمها.", img: "" },
        { day: 4, chapter: "السكون", title: "هدوء وجمال خيتهورن", desc: "«بندقية الشمال» حيث تحلّ القوارب محلّ السيارات — أحد أجمل البرامج المنظّمة في هولندا.", img: "" },
        { day: 5, chapter: "الأناقة", title: "أناقة لاهاي الملكية", desc: "استكشاف معالم المدينة الملكية: شواطئ ومتاحف ومعالم سياسية.", img: "" },
        { day: 6, chapter: "الحرية", title: "يوم حر في أمستردام", desc: "يوم حر للتسوّق أو إعادة زيارة الأماكن المفضّلة.", img: "" },
        { day: 7, chapter: "الوداع", title: "المغادرة", desc: "توديع بذكريات لا تُنسى والانتقال إلى المطار.", img: "" },
      ]}},
      { type: "hotels", data: { hotels: [
        { name: "فندق ٤ نجوم في هولندا", stars: 4, nights: "6", location: "هولندا",
          note: "إقامة ٦ ليالٍ في فندق ٤ نجوم مريح مع إفطار يومي.",
          facilities: ["إفطار يومي", "موقع مريح", "خدمة مميّزة"], photo: IMG.holland2 },
      ]}},
      { type: "inclusions", data: {
        includes: ["إقامة ٦ ليالٍ في فندق ٤ نجوم", "استقبال وتوديع من المطار", "نقل خاص مع سائق يتحدث العربية", "جولات يومية بصحبة مرشد", "زيارة أمستردام ولاهاي والطواحين وفولندام وخيتهورن"],
        excludes: ["تذاكر الطيران الدولية", "الوجبات عدا إفطار الفندق", "رسوم دخول المعالم والأنشطة الاختيارية", "المصاريف الشخصية", "أي خدمات إضافية غير مذكورة في البرنامج"],
      }},
      { type: "meals", data: { plan: "breakfast", notes: "إفطار يومي في الفندق فقط." }},
      { type: "visa",  data: { included: "no", content: "تأشيرة شنغن غير مشمولة." }},
      { type: "departures", data: { entries: [
        { date: "2026-05-25", returnDate: "2026-05-31", spots: 8, price: "", deal: false },
      ]}},
      { type: "pricing", data: { tiers: [
        { label: "للشخص في غرفة مزدوجة", price: "€2100" },
      ], cancellation: "", paymentContent: "", paymentSteps: [], termsContent: "" }},
      { type: "transfers", data: {
        description: "استقبال وتوديع من المطار، ونقل خاص مع سائق يتحدث العربية طوال الإقامة.",
        items: ["استقبال من المطار → الفندق", "نقل خاص بين المدن", "الفندق → المطار"],
      }},
      { type: "faq", data: { items: [
        { question: "ما هو أفضل وقت للسفر؟", answer: "يُنصح بشهر يونيو لاعتدال الطقس وذروة جمال الطبيعة." },
        { question: "ماذا أحزم في حقيبتي؟", answer: "ملابس خفيفة مع جاكيت خفيف، ويُفضّل اصطحاب زجاجة ماء قابلة لإعادة الاستخدام." },
        { question: "كيف أتنقّل داخل المدن؟", answer: "يمكن الاستفادة من الدراجات والقوارب والمواصلات العامة بسهولة." },
      ]}},
      { type: "important_notes", data: { notes: [
        { text: "تواريخ عيد الأضحى تقريبية وتُؤكَّد عند الحجز." },
        { text: "السعر للشخص في غرفة مزدوجة." },
      ]}},
      ABOUT_AGENCY_SEC, PEOPLE_SEC,
      { type: "media", data: { images: [IMG.eid, IMG.holland1, IMG.holland2, IMG.holland3], videoUrl: "" }},
      { type: "reviews", data: { reviews: [] }},
    ],
  },

  // 4 ── Amsterdam tours, 5 days ────────────────────────────────────────────────
  {
    migratedSlug: "amsterdam-5-days",
    titleEn: "Amsterdam Tours — 5 Days",
    titleAr: "جولات سياحية في أمستردام ٥ أيام",
    descriptionEn: "Five days of private tours in Amsterdam and the Dutch countryside with an Arabic-speaking driver — Keukenhof, windmills and Giethoorn. Hotels not included.",
    descriptionAr: "خمسة أيام من الجولات الخاصة في أمستردام والريف الهولندي مع سائق يتحدث العربية — كيوكنهوف والطواحين وخيتهورن. لا تشمل الإقامة.",
    destination: "هولندا",
    price: "€1600", currency: "EUR", nights: "4",
    coverImage: IMG.ams1,
    sections: [
      { type: "highlights", data: { items: [
        "جولات يومية خاصة مع سائق يتحدث العربية",
        "زيارة حدائق كيوكنهوف وقرى الطواحين والريف الهولندي",
        "قرية خيتهورن الساحرة وتجربة القنوات",
      ]}},
      { type: "itinerary", data: { days: [
        { day: 1, chapter: "الوصول", title: "الوصول وجولة في قلب أمستردام", desc: "استقبال والانطلاق في جولة بقلب أمستردام بين القنوات والعمارة التاريخية.", img: IMG.ams1 },
        { day: 2, chapter: "الريف",  title: "الريف الهولندي والطواحين", desc: "جولة في الريف الهولندي وقرى الطواحين التقليدية.", img: "" },
        { day: 3, chapter: "الطبيعة", title: "كيوكنهوف وخيتهورن", desc: "حدائق كيوكنهوف ثم قرية خيتهورن «بندقية الشمال».", img: "" },
        { day: 4, chapter: "الثقافة", title: "المتاحف وتجربة القنوات", desc: "زيارة المتاحف وتجربة القوارب في قنوات أمستردام.", img: "" },
        { day: 5, chapter: "الوداع",  title: "تسوّق ووداع المدينة", desc: "تسوّق للهدايا وجولة أخيرة قبل التوديع.", img: "" },
      ]}},
      { type: "inclusions", data: {
        includes: ["سيارة خاصة مريحة طوال الرحلة", "سائق يتحدث العربية في أمستردام", "جولات يومية لمدة ٥ أيام", "زيارة كيوكنهوف والطواحين والريف وخيتهورن", "شريحة إنترنت", "مناسب لمجموعات صغيرة (٤–٧ أشخاص)"],
        excludes: ["تذاكر الطيران الدولية", "الإقامة في الفنادق", "رسوم دخول المعالم", "الوجبات والمصاريف الشخصية"],
      }},
      { type: "meals", data: { plan: "none", notes: "الوجبات غير مشمولة." }},
      { type: "transfers", data: { description: "سيارة خاصة مريحة مع سائق يتحدث العربية طوال الجولات.", items: ["استقبال من المطار", "تنقّلات يومية خاصة", "توديع إلى المطار"] }},
      { type: "important_notes", data: { notes: [
        { text: "السعر لا يشمل الإقامة في الفنادق." },
        { text: "مناسب لمجموعات صغيرة من ٤ إلى ٧ أشخاص." },
      ]}},
      ABOUT_AGENCY_SEC, PEOPLE_SEC,
      { type: "media", data: { images: [IMG.ams1, IMG.ams2, IMG.ams3, IMG.holland1], videoUrl: "" }},
      { type: "reviews", data: { reviews: [] }},
    ],
  },

  // 5 ── Spring in the Netherlands 2026 ─────────────────────────────────────────
  {
    migratedSlug: "netherlands-spring-2026",
    titleEn: "Spring in the Netherlands 2026 — 7 Days",
    titleAr: "رحلات الربيع في هولندا ٢٠٢٦ — ٧ أيام",
    descriptionEn: "A spring programme across the Netherlands — Keukenhof, windmills, Giethoorn, a theme park, Roermond outlets, De Haar Castle and Utrecht. Hotels not included.",
    descriptionAr: "برنامج ربيعي في هولندا يجمع كيوكنهوف والطواحين وخيتهورن ومدينة الملاهي وأوتلت رورموند وقلعة دي هار وأوتريخت. لا تشمل الإقامة.",
    destination: "هولندا",
    price: "€1600", currency: "EUR", nights: "6",
    coverImage: IMG.spring,
    sections: [
      { type: "highlights", data: { items: [
        "حدائق كيوكنهوف وقرى الطواحين في أبهى صورها الربيعية",
        "قرية خيتهورن وحديقة الطيور والنباتات النادرة",
        "مدينة ملاهي إفتلينغ أو واليبي وتسوّق أوتلت رورموند",
      ]}},
      { type: "itinerary", data: { days: [
        { day: 1, chapter: "الزهور", title: "كيوكنهوف وقرى الطواحين", desc: "جولة في حدائق كيوكنهوف وقرى الطواحين التقليدية.", img: IMG.spring },
        { day: 2, chapter: "الطبيعة", title: "خيتهورن وحديقة الطيور", desc: "قرية خيتهورن وحديقة الطيور والنباتات النادرة.", img: "" },
        { day: 3, chapter: "المرح", title: "مدينة الملاهي", desc: "يوم في مدينة ملاهي إفتلينغ أو مجمّع واليبي الترفيهي (اختيار من اثنتين).", img: "" },
        { day: 4, chapter: "التسوّق", title: "أوتلت رورموند", desc: "تسوّق في أكبر أوتلت بهولندا (رورموند).", img: "" },
        { day: 5, chapter: "التاريخ", title: "قلعة دي هار وأوتريخت", desc: "زيارة قلعة دي هار ومدينة أوتريخت التاريخية.", img: "" },
      ]}},
      { type: "inclusions", data: {
        includes: ["كيوكنهوف وقرى الطواحين", "خيتهورن وحديقة الطيور والنباتات", "دخول مدينة الملاهي (اختيار من اثنتين)", "تسوّق أوتلت رورموند", "قلعة دي هار وأوتريخت", "استقبال وتوديع مجاني من المطار", "شريحتا إنترنت مجانيتان", "مجموعة من ٢ إلى ٤ أشخاص"],
        excludes: ["الإقامة في الفنادق", "تذاكر الطيران", "الوجبات والمصاريف الشخصية"],
      }},
      { type: "meals", data: { plan: "none", notes: "الوجبات غير مشمولة." }},
      { type: "transfers", data: { description: "تنقّلات خاصة مع سائق يتحدث العربية، ويشمل الاستقبال والتوديع المجاني من المطار.", items: ["استقبال مجاني من المطار", "تنقّلات يومية خاصة", "توديع مجاني إلى المطار"] }},
      { type: "important_notes", data: { notes: [
        { text: "السعر لا يشمل الإقامة في الفنادق." },
        { text: "مجموعة من ٢ إلى ٤ أشخاص." },
      ]}},
      ABOUT_AGENCY_SEC, PEOPLE_SEC,
      { type: "media", data: { images: [IMG.spring, IMG.holland1, IMG.holland2], videoUrl: "" }},
      { type: "reviews", data: { reviews: [] }},
    ],
  },

  // 6 ── Europe in 5 days: NL · BE · DE ─────────────────────────────────────────
  {
    migratedSlug: "europe-5-days",
    titleEn: "Europe in 5 Days: Netherlands, Belgium & Germany",
    titleAr: "رحلات أوروبا في ٥ أيام: هولندا وبلجيكا وألمانيا",
    descriptionEn: "Three countries in one trip — Amsterdam, windmills, Keukenhof and Giethoorn, Düsseldorf and theme parks in Germany, and Brussels — in a private Mercedes van with an Arabic-speaking driver. Hotels not included.",
    descriptionAr: "ثلاث دول في رحلة واحدة: أمستردام والطواحين وكيوكنهوف وخيتهورن، ودوسلدورف الألمانية ومدن الملاهي، وبروكسل البلجيكية — بسيارة مرسيدس خاصة وسائق يتحدث العربية. لا تشمل الإقامة.",
    destination: "أوروبا",
    price: "€2500", currency: "EUR", nights: "4",
    coverImage: IMG.holland2,
    sections: [
      { type: "highlights", data: { items: [
        "ثلاث دول أوروبية في رحلة واحدة",
        "سيارة مرسيدس V-Class خاصة مع سائق يتحدث العربية",
        "أمستردام ودوسلدورف وبروكسل ومدن الملاهي",
      ]}},
      { type: "itinerary", data: { days: [
        { day: 1, chapter: "هولندا", title: "أمستردام وقرى الطواحين", desc: "أمستردام وقرى الطواحين والريف الهولندي.", img: IMG.holland1 },
        { day: 2, chapter: "هولندا", title: "كيوكنهوف وخيتهورن", desc: "حدائق كيوكنهوف وقرية خيتهورن «بندقية هولندا».", img: "" },
        { day: 3, chapter: "ألمانيا", title: "دوسلدورف والتسوّق", desc: "الانتقال إلى دوسلدورف الألمانية مع وقت للتسوّق.", img: IMG.destDE },
        { day: 4, chapter: "المرح", title: "مدن الملاهي", desc: "مدن الملاهي ومغامرات عائلية.", img: "" },
        { day: 5, chapter: "بلجيكا", title: "بروكسل والعودة", desc: "بروكسل البلجيكية ثم العودة.", img: IMG.destBE },
      ]}},
      { type: "inclusions", data: {
        includes: ["سائق يتحدث العربية بسيارة مرسيدس (V-Class)", "جولات أوروبية منظّمة", "استقبال وتوديع من المطار", "مجموعة من ٤ إلى ٧ أشخاص"],
        excludes: ["الإقامة في الفنادق", "تذاكر الطيران الدولية", "الوجبات والمصاريف الشخصية", "رسوم دخول المعالم"],
      }},
      { type: "meals", data: { plan: "none", notes: "الوجبات غير مشمولة." }},
      { type: "transfers", data: { description: "سيارة مرسيدس V-Class خاصة مع سائق يتحدث العربية عبر الدول الثلاث.", items: ["استقبال من المطار", "تنقّلات خاصة بين الدول", "توديع إلى المطار"] }},
      { type: "important_notes", data: { notes: [
        { text: "السعر لا يشمل الإقامة في الفنادق." },
        { text: "مجموعة من ٤ إلى ٧ أشخاص." },
      ]}},
      ABOUT_AGENCY_SEC, PEOPLE_SEC,
      { type: "media", data: { images: [IMG.holland2, IMG.destDE, IMG.destBE, IMG.holland1], videoUrl: "" }},
      { type: "reviews", data: { reviews: [] }},
    ],
  },

  // 7 ── Paris · Brussels · Amsterdam — one-day tour ────────────────────────────
  {
    migratedSlug: "paris-brussels-amsterdam-day",
    titleEn: "Paris · Brussels · Amsterdam — One-Day Tour for Four",
    titleAr: "رحلة باريس بروكسل أمستردام — جولة يوم واحد لأربعة أشخاص",
    descriptionEn: "Three European cities in a single day with an Arabic-speaking guide and a luxury Mercedes van: breakfast in Paris, lunch and chocolate in Brussels, dinner in Amsterdam. Price covers four people.",
    descriptionAr: "ثلاث مدن أوروبية في يوم واحد مع مرشد يتحدث العربية وسيارة مرسيدس فاخرة: فطور في باريس، وغداء وشوكولاتة في بروكسل، وعشاء في أمستردام. السعر يشمل أربعة أشخاص.",
    destination: "أوروبا",
    price: "€900", currency: "EUR", nights: "0",
    coverImage: IMG.destFR,
    sections: [
      { type: "highlights", data: { items: [
        "فطور في مقهى باريسي قرب برج إيفل وجولة في شوارع باريس الكلاسيكية",
        "الساحة الكبرى وتمثال مانكان بيس وتذوّق الوافل والشوكولاتة في بروكسل",
        "قنوات أمستردام وعشاء ووقت حر للاستكشاف",
      ]}},
      { type: "itinerary", data: { days: [
        { day: 1, chapter: "ثلاث مدن", title: "باريس ← بروكسل ← أمستردام في يوم واحد", desc: "فطور قرب برج إيفل وجولة في باريس، ثم الساحة الكبرى وتمثال مانكان بيس وتذوّق الشوكولاتة في بروكسل، ثم قنوات أمستردام وعشاء ووقت حر. مع زيارة اختيارية لمزارع الجبن التقليدية. استراحة لمدة ساعتين خلال اليوم.", img: IMG.destFR },
      ]}},
      { type: "inclusions", data: {
        includes: ["مرشد/سائق يتحدث العربية", "سيارة مرسيدس فاخرة", "السعر يشمل أربعة أشخاص", "وجبات في كل مدينة (فطور وغداء وعشاء)", "خدمة الإرشاد والمعلومات"],
        excludes: ["الإقامة", "المشروبات والوجبات خارج المحطات المحدّدة", "رسوم دخول المعالم", "الإكراميات"],
      }},
      { type: "transfers", data: { description: "سيارة مرسيدس فاخرة مع سائق يتحدث العربية، الانطلاق من باريس أو أمستردام.", items: ["باريس → بروكسل", "بروكسل → أمستردام", "استراحة لمدة ساعتين"] }},
      { type: "important_notes", data: { notes: [
        { text: "جواز سفر ساري المفعول مطلوب لعبور الحدود." },
        { text: "الأطفال دون السنتين يلزمهم مقعد سيارة مخصّص (على مسؤولية المسافر)." },
        { text: "نقطة الانطلاق: باريس أو أمستردام." },
      ]}},
      ABOUT_AGENCY_SEC, PEOPLE_SEC,
      { type: "media", data: { images: [IMG.destFR, IMG.destBE, IMG.holland1], videoUrl: "" }},
      { type: "reviews", data: { reviews: [] }},
    ],
  },

  // 8 ── France — classic highlights ────────────────────────────────────────────
  {
    migratedSlug: "france-classic",
    titleEn: "Highlights of France — Classic Charm",
    titleAr: "أبرز معالم فرنسا: سحر كلاسيكي",
    descriptionEn: "Eight days across classic France — Paris, Versailles, Lyon, Annecy, Nice and Cannes or Monaco — with private transfers and an Arabic-speaking guide. Accommodation not included.",
    descriptionAr: "ثمانية أيام عبر فرنسا الكلاسيكية: باريس وقصر فرساي وليون وأنسي ونيس وكان أو موناكو، بتنقّلات خاصة ومرشد يتحدث العربية. لا تشمل الإقامة.",
    destination: "فرنسا",
    price: "€700", currency: "EUR", nights: "7",
    coverImage: IMG.destFR,
    sections: [
      { type: "highlights", data: { items: [
        "باريس وقصر فرساي وجولة نهرية",
        "ليون عاصمة المطبخ الفرنسي وأنسي بحيرتها الرومانسية",
        "نيس والريفييرا الفرنسية وكان أو موناكو",
      ]}},
      { type: "itinerary", data: { days: [
        { day: 1, chapter: "باريس", title: "الوصول إلى باريس — مدينة النور", desc: "الوصول واستهلال الرحلة في عاصمة الأنوار.", img: IMG.destFR },
        { day: 2, chapter: "باريس", title: "المعالم التاريخية والفنية", desc: "جولة بين أبرز معالم باريس التاريخية والفنية.", img: "" },
        { day: 3, chapter: "باريس", title: "الأحياء الساحرة وجولة نهرية", desc: "تجوّل في الأحياء الباريسية الساحرة وجولة على نهر السين.", img: "" },
        { day: 4, chapter: "فرساي", title: "قصر فرساي", desc: "زيارة قصر فرساي بعظمته الملكية التاريخية.", img: "" },
        { day: 5, chapter: "ليون", title: "الانتقال إلى ليون", desc: "الانتقال إلى ليون عاصمة المطبخ الفرنسي.", img: "" },
        { day: 6, chapter: "أنسي", title: "الانتقال إلى أنسي", desc: "أنسي، مدينة البحيرة الرومانسية.", img: "" },
        { day: 7, chapter: "نيس", title: "الانتقال إلى نيس", desc: "نيس وسحر الريفييرا الفرنسية.", img: "" },
        { day: 8, chapter: "الوداع", title: "كان أو موناكو ثم المغادرة", desc: "زيارة كان أو موناكو، ثم المغادرة من نيس أو العودة إلى باريس.", img: "" },
      ]}},
      { type: "inclusions", data: {
        includes: ["تنقّلات خاصة مع سائق يتحدث العربية", "مرشد سياحي يتحدث العربية"],
        excludes: ["الإقامة في الفنادق", "تذاكر الطيران", "الوجبات", "رسوم دخول المعالم"],
      }},
      { type: "meals", data: { plan: "none", notes: "الوجبات غير مشمولة." }},
      { type: "transfers", data: { description: "تنقّلات خاصة مع سائق ومرشد يتحدثان العربية عبر مدن فرنسا.", items: ["باريس وفرساي", "ليون وأنسي", "نيس وكان/موناكو"] }},
      { type: "important_notes", data: { notes: [
        { text: "السعر لخدمة النقل والإرشاد فقط ولا يشمل الإقامة." },
        { text: "مسار المغادرة يختلف: من نيس أو العودة إلى باريس." },
      ]}},
      ABOUT_AGENCY_SEC, PEOPLE_SEC,
      { type: "media", data: { images: [IMG.destFR, IMG.holland2], videoUrl: "" }},
      { type: "reviews", data: { reviews: [] }},
    ],
  },

  // 9 ── Germany — scenic cities & Alps ─────────────────────────────────────────
  {
    migratedSlug: "germany-scenic",
    titleEn: "Scenic Germany — Vibrant Cities & Alpine Nature",
    titleAr: "ألمانيا الخلابة: جولة بين المدن النابضة والطبيعة الساحرة",
    descriptionEn: "Eight days across Germany — Berlin, Dresden, Munich, the Alps at Garmisch and Frankfurt — with private transfers and an Arabic-speaking guide. Accommodation not included.",
    descriptionAr: "ثمانية أيام عبر ألمانيا: برلين ودرسدن وميونخ وجبال الألب في غارميش وفرانكفورت، بتنقّلات خاصة ومرشد يتحدث العربية. لا تشمل الإقامة.",
    destination: "ألمانيا",
    price: "€400", currency: "EUR", nights: "7",
    coverImage: IMG.destDE,
    sections: [
      { type: "highlights", data: { items: [
        "برلين ودرسدن وميونخ",
        "طبيعة جبال الألب في غارميش-بارتنكيرشن",
        "فرانكفورت الحديثة وأسواقها",
      ]}},
      { type: "itinerary", data: { days: [
        { day: 1, chapter: "برلين", title: "الوصول إلى برلين", desc: "المعالم التاريخية وساحة ألكسندر بلاتس.", img: IMG.destDE },
        { day: 2, chapter: "برلين", title: "متاحف برلين", desc: "متاحف برلين وبوابة براندنبورغ وجدار برلين.", img: "" },
        { day: 3, chapter: "درسدن", title: "الانتقال إلى درسدن", desc: "استكشاف المدينة القديمة في درسدن.", img: "" },
        { day: 4, chapter: "ميونخ", title: "الانتقال إلى ميونخ", desc: "الساحات التاريخية والحدائق في ميونخ.", img: "" },
        { day: 5, chapter: "ميونخ", title: "قصور ومتاحف ميونخ", desc: "قصور ميونخ والمتاحف والمطبخ البافاري.", img: "" },
        { day: 6, chapter: "الألب", title: "غارميش-بارتنكيرشن", desc: "طبيعة جبال الألب في غارميش-بارتنكيرشن.", img: "" },
        { day: 7, chapter: "فرانكفورت", title: "الانتقال إلى فرانكفورت", desc: "المدينة الحديثة وأسواقها.", img: "" },
        { day: 8, chapter: "الوداع", title: "يوم حر ثم المغادرة", desc: "يوم حر للتسوّق أو زيارة المواقع القريبة قبل المغادرة.", img: "" },
      ]}},
      { type: "inclusions", data: {
        includes: ["تنقّلات خاصة مع سائق يتحدث العربية", "مرشد سياحي يتحدث العربية"],
        excludes: ["الإقامة في الفنادق", "تذاكر الطيران", "الوجبات", "رسوم دخول المعالم"],
      }},
      { type: "meals", data: { plan: "none", notes: "الوجبات غير مشمولة." }},
      { type: "transfers", data: { description: "تنقّلات خاصة مع سائق ومرشد يتحدثان العربية عبر مدن ألمانيا.", items: ["برلين ودرسدن", "ميونخ وغارميش", "فرانكفورت"] }},
      { type: "important_notes", data: { notes: [
        { text: "السعر لخدمة النقل والإرشاد فقط ولا يشمل الإقامة." },
      ]}},
      ABOUT_AGENCY_SEC, PEOPLE_SEC,
      { type: "media", data: { images: [IMG.destDE, IMG.holland3], videoUrl: "" }},
      { type: "reviews", data: { reviews: [] }},
    ],
  },

  // 10 ── Belgium — canals & architecture ───────────────────────────────────────
  {
    migratedSlug: "belgium-canals",
    titleEn: "Belgium — Canals & Architecture",
    titleAr: "بلجيكا بين القنوات والعمارة: برنامج لاكتشاف أجمل الوجهات",
    descriptionEn: "Eight days in Belgium — Brussels, Bruges, Ghent and Antwerp — among canals, architecture and chocolate, with private transfers and an Arabic-speaking guide. Accommodation not included.",
    descriptionAr: "ثمانية أيام في بلجيكا: بروكسل وبروج وغنت وأنتويرب، بين القنوات والعمارة والشوكولاتة، بتنقّلات خاصة ومرشد يتحدث العربية. لا تشمل الإقامة.",
    destination: "بلجيكا",
    price: "€500", currency: "EUR", nights: "7",
    coverImage: IMG.destBE,
    sections: [
      { type: "highlights", data: { items: [
        "بروكسل وبروج وغنت وأنتويرب",
        "القنوات والعمارة التاريخية وجولات القوارب",
        "تجارب الشوكولاتة البلجيكية",
      ]}},
      { type: "itinerary", data: { days: [
        { day: 1, chapter: "بروكسل", title: "الوصول إلى بروكسل", desc: "جولة في الساحة الكبرى وزيارة أشهر المعالم.", img: IMG.destBE },
        { day: 2, chapter: "بروكسل", title: "المتاحف وأتوميوم", desc: "زيارة المتاحف وأتوميوم والشوارع التاريخية والتسوّق.", img: "" },
        { day: 3, chapter: "بروج", title: "رحلة إلى بروج", desc: "استكشاف القنوات والمدينة القديمة وجولة بالقارب.", img: "" },
        { day: 4, chapter: "غنت", title: "غنت", desc: "القلاع والأسواق التاريخية والمقاهي المحلية.", img: "" },
        { day: 5, chapter: "أنتويرب", title: "رحلة إلى أنتويرب", desc: "عاصمة الألماس والموضة وزيارة كاتدرائية المدينة.", img: "" },
        { day: 6, chapter: "الطبيعة", title: "الطبيعة والاسترخاء", desc: "الحدائق والقرى وتجارب الشوكولاتة البلجيكية.", img: "" },
        { day: 7, chapter: "بروكسل", title: "تسوّق بروكسل", desc: "التسوّق والأسواق والمطبخ المحلي.", img: "" },
        { day: 8, chapter: "الوداع", title: "يوم حر ثم المغادرة", desc: "يوم حر أو أنشطة اختيارية قبل المغادرة.", img: "" },
      ]}},
      { type: "inclusions", data: {
        includes: ["تنقّلات خاصة مع سائق يتحدث العربية", "مرشد سياحي يتحدث العربية"],
        excludes: ["الإقامة في الفنادق", "تذاكر الطيران", "الوجبات", "رسوم دخول المعالم"],
      }},
      { type: "meals", data: { plan: "none", notes: "الوجبات غير مشمولة." }},
      { type: "transfers", data: { description: "تنقّلات خاصة مع سائق ومرشد يتحدثان العربية عبر مدن بلجيكا.", items: ["بروكسل وبروج", "غنت وأنتويرب", "العودة إلى بروكسل"] }},
      { type: "important_notes", data: { notes: [
        { text: "السعر لخدمة النقل والإرشاد فقط ولا يشمل الإقامة." },
      ]}},
      ABOUT_AGENCY_SEC, PEOPLE_SEC,
      { type: "media", data: { images: [IMG.destBE, IMG.holland2], videoUrl: "" }},
      { type: "reviews", data: { reviews: [] }},
    ],
  },
];

// ── Build a full package document (flat compat fields derived from sections) ──
function getSecData(sections, type) { return sections.find((s) => s.type === type)?.data; }

function buildDocument(entry, userId) {
  const sections = entry.sections.map((s, i) => ({
    id: `${entry.migratedSlug}__${s.type}__${i}`, type: s.type, order: i, data: s.data || {},
  }));

  const inclusions = getSecData(sections, "inclusions");
  const itinerary  = getSecData(sections, "itinerary");
  const pricing    = getSecData(sections, "pricing");
  const media      = getSecData(sections, "media");
  const departures = getSecData(sections, "departures");
  const hotels     = getSecData(sections, "hotels");

  const hotelDescription = hotels?.hotels?.[0]?.note || "";
  const legacyDepartures = (departures?.entries ?? []).filter((e) => e.date)
    .map((e) => ({ date: String(e.date), spots: Number(e.spots) || 0, ...(e.price ? { price: String(e.price) } : {}) }));

  return {
    userId,
    agencySlug:      AGENCY_SLUG,
    templateId:      TEMPLATE_ID,
    title:           { en: entry.titleEn, ar: entry.titleAr },
    description:     { en: entry.descriptionEn, ar: entry.descriptionAr },
    destination:     entry.destination,
    price:           entry.price,
    currency:        entry.currency,
    nights:          entry.nights,
    whatsapp:        WHATSAPP,
    messenger:       "",
    coverImage:      entry.coverImage,
    primaryLanguage: "ar",
    language:        "ar",
    sections,
    // flat compat fields
    includes:        Array.isArray(inclusions?.includes) ? inclusions.includes : [],
    excludes:        Array.isArray(inclusions?.excludes) ? inclusions.excludes : [],
    itinerary:       Array.isArray(itinerary?.days) ? itinerary.days : [],
    pricingTiers:    Array.isArray(pricing?.tiers) ? pricing.tiers : [],
    cancellation:    "",
    hotelDescription,
    images:          Array.isArray(media?.images) ? media.images : [],
    videoUrl:        media?.videoUrl || "",
    airports:        [],
    reviews:         [],
    advantages:      [],
    agent:           null,
    ...(legacyDepartures.length ? { departures: legacyDepartures } : {}),
    status:          "active",
    isDemo:          false,
    migratedSlug:    entry.migratedSlug,
    migratedFrom:    SOURCE_URL,
    views: 0, whatsappClicks: 0, messengerClicks: 0,
  };
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const project = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "(unknown)";
  console.log(`\nMigrate nlinareyes.com → ${TARGET_EMAIL}  [${isDryRun ? "DRY RUN" : "LIVE"}]`);
  console.log(`Project: ${project}   Agency: ${AGENCY_SLUG}\n`);

  const usersSnap = await db.collection("users").where("email", "==", TARGET_EMAIL).limit(1).get();
  if (usersSnap.empty) { console.error(`User not found: ${TARGET_EMAIL}`); process.exit(1); }
  const userDoc = usersSnap.docs[0];
  const userId  = userDoc.id;
  console.log(`User: ${userId}\n`);

  // 1. Brand / storefront / homepage / aboutPage on the user doc
  const brandPayload = {
    ...BRAND,
    homepage:  buildConfig(HOME_SECTIONS),
    aboutPage: buildConfig(ABOUT_PAGE_SECTIONS),
    updatedAt: Date.now(),
  };
  if (!isDryRun) await userDoc.ref.set(brandPayload, { merge: true });
  console.log(`${isDryRun ? "[DRY] would write" : "[OK] wrote"} brand + homepage(${brandPayload.homepage.sections.length}) + aboutPage(${brandPayload.aboutPage.sections.length}) on user doc`);

  // 2. Packages — upsert by (userId + migratedSlug)
  for (const entry of PACKAGES) {
    const existing = await db.collection("packages")
      .where("userId", "==", userId).where("migratedSlug", "==", entry.migratedSlug).limit(1).get();
    const doc = buildDocument(entry, userId);
    if (!existing.empty) {
      const ref = existing.docs[0].ref;
      if (!isDryRun) await ref.update({ ...doc, createdAt: existing.docs[0].data().createdAt ?? Date.now(), updatedAt: Date.now() });
      console.log(`  ${isDryRun ? "[DRY] would UPDATE" : "[OK] UPDATED"}  ${entry.migratedSlug}  (${ref.id})`);
    } else {
      let id = "(dry-run)";
      if (!isDryRun) { const ref = await db.collection("packages").add({ ...doc, createdAt: Date.now() }); id = ref.id; }
      console.log(`  ${isDryRun ? "[DRY] would CREATE" : "[OK] CREATED"}  ${entry.migratedSlug}  (${id})`);
    }
  }

  const base = (process.env.NEXT_PUBLIC_BASE_URL || "https://staging.packmetrix.com").replace(/\/$/, "");
  console.log(`\nStorefront: ${base}/${AGENCY_SLUG}`);
  console.log("Done.\n");
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
