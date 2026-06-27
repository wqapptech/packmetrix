// Homepage builder field registry — maps each BUILDABLE homepage section's
// content schema (lib/homepage.ts) to editor inputs. The builder renders fields
// generically from this; it never hardcodes section types. Every text field is
// bilingual {en, ar} (rendered as side-by-side EN/AR pairs).
//
// Single source of truth pairing: the section set here mirrors BUILDABLE_TYPES.
// Derived/Branding-owned content (about_en/ar, stats numbers, package cards,
// derived destinations, contact buttons) is NOT editable here — it's surfaced
// as a read-only note pointing the agency to Branding.

import type { HomeSectionType, Loc } from "@/lib/homepage";
import { loc } from "@/lib/homepage";
import Icon from "@/components/Icon";

type IconName = Parameters<typeof Icon>[0]["name"];

// FeatureIcon names the renderer (HomepageSections.tsx) actually draws. Anything
// else falls back to the default check-circle glyph, so the editor constrains
// the choice to these (+ a "default" option).
export const FEATURE_ICONS: { value: string; label: string; labelAr: string }[] = [
  { value: "", label: "Default", labelAr: "افتراضي" },
  { value: "chat", label: "Chat", labelAr: "محادثة" },
  { value: "shield", label: "Shield", labelAr: "درع" },
  { value: "star", label: "Star", labelAr: "نجمة" },
  { value: "plane", label: "Plane", labelAr: "طائرة" },
  { value: "hotel", label: "Hotel", labelAr: "فندق" },
  { value: "car", label: "Car", labelAr: "سيارة" },
  { value: "pin", label: "Location pin", labelAr: "موقع" },
  { value: "clock", label: "Clock", labelAr: "ساعة" },
  { value: "moon", label: "Moon", labelAr: "هلال" },
  { value: "users", label: "People", labelAr: "أشخاص" },
  { value: "heart", label: "Heart", labelAr: "قلب" },
];

// ── Field descriptors ────────────────────────────────────────────────────────

export type HField =
  | { kind: "loc"; key: string; label: Loc; placeholder?: Loc; area?: boolean }
  | { kind: "image"; key: string; label: Loc }
  | { kind: "number"; key: string; label: Loc; min?: number; max?: number; decimal?: boolean };

/** A repeatable list. itemMode "loc" → each array element IS a Loc (e.g. stats
 *  qualities). itemMode "object" → each element is an object edited via itemFields. */
export type HItemField =
  | { kind: "loc"; key: string; label: Loc; area?: boolean }
  | { kind: "plain"; key: string; label: Loc; placeholder?: Loc }
  | { kind: "image"; key: string; label: Loc }
  | { kind: "icon"; key: string; label: Loc };

export type HRepeater = {
  key: string;
  label: Loc;
  addLabel: Loc;
  itemMode: "loc" | "object";
  itemFields?: HItemField[]; // required when itemMode === "object"
  itemNoun: Loc;             // singular, for the "Item N" header
};

export type HSectionDef = {
  type: HomeSectionType;
  label: Loc;
  icon: IconName;
  description: Loc;
  required?: boolean;     // hero — cannot be disabled
  fields: HField[];
  repeaters?: HRepeater[];
  /** Read-only notes describing derived / Branding-owned content. */
  derived?: Loc[];
};

const L = (en: string, ar: string): Loc => loc(en, ar);

// ── The registry ─────────────────────────────────────────────────────────────

export const HOME_FIELD_REGISTRY: Record<HomeSectionType, HSectionDef> = {
  hero: {
    type: "hero", icon: "image", required: true,
    label: L("Hero", "الواجهة"),
    description: L("The top banner — the first thing visitors see.", "الشريط العلوي — أول ما يراه الزائر."),
    fields: [
      { kind: "loc", key: "eyebrow", label: L("Eyebrow", "تمهيد") },
      { kind: "loc", key: "headline", label: L("Headline", "العنوان الرئيسي") },
      { kind: "loc", key: "sub", label: L("Subheading", "العنوان الفرعي"), area: true },
      { kind: "image", key: "image", label: L("Background image", "صورة الخلفية") },
    ],
    derived: [L("Empty headline / subheading fall back to your agency name & tagline from Branding.", "عند ترك العنوان فارغاً يُستخدم اسم وكالتك وشعارها من الهوية.")],
  },
  about: {
    type: "about", icon: "users",
    label: L("About", "من نحن"),
    description: L("Tell visitors who you are.", "عرّف الزوار بوكالتك."),
    fields: [
      { kind: "loc", key: "eyebrow", label: L("Eyebrow", "تمهيد") },
      { kind: "loc", key: "heading", label: L("Heading", "العنوان") },
      { kind: "loc", key: "body", label: L("Body", "النص"), area: true },
      { kind: "loc", key: "link", label: L("Link text", "نص الرابط") },
      { kind: "image", key: "image", label: L("Image", "صورة") },
    ],
  },
  why_us: {
    type: "why_us", icon: "star",
    label: L("Why us", "لماذا نحن"),
    description: L("Reasons travelers should choose you.", "أسباب اختيار المسافرين لك."),
    fields: [
      { kind: "loc", key: "eyebrow", label: L("Eyebrow", "تمهيد") },
      { kind: "loc", key: "heading", label: L("Heading", "العنوان") },
    ],
    repeaters: [{
      key: "items", itemMode: "object",
      label: L("Reasons", "الأسباب"), addLabel: L("Add reason", "إضافة سبب"), itemNoun: L("Reason", "سبب"),
      itemFields: [
        { kind: "icon", key: "icon", label: L("Icon", "أيقونة") },
        { kind: "loc", key: "title", label: L("Title", "العنوان") },
        { kind: "loc", key: "desc", label: L("Description", "الوصف"), area: true },
      ],
    }],
  },
  services: {
    type: "services", icon: "package",
    label: L("Services", "خدماتنا"),
    description: L("What you offer.", "ما الذي تقدمه."),
    fields: [
      { kind: "loc", key: "eyebrow", label: L("Eyebrow", "تمهيد") },
      { kind: "loc", key: "heading", label: L("Heading", "العنوان") },
    ],
    repeaters: [{
      key: "items", itemMode: "object",
      label: L("Services", "الخدمات"), addLabel: L("Add service", "إضافة خدمة"), itemNoun: L("Service", "خدمة"),
      itemFields: [
        { kind: "icon", key: "icon", label: L("Icon", "أيقونة") },
        { kind: "loc", key: "title", label: L("Title", "العنوان") },
        { kind: "loc", key: "desc", label: L("Description", "الوصف"), area: true },
      ],
    }],
  },
  featured_packages: {
    type: "featured_packages", icon: "archive",
    label: L("Featured packages", "باقات مختارة"),
    description: L("Showcase a few packages.", "اعرض مجموعة من الباقات."),
    fields: [
      { kind: "loc", key: "eyebrow", label: L("Eyebrow", "تمهيد") },
      { kind: "loc", key: "heading", label: L("Heading", "العنوان") },
      { kind: "loc", key: "link", label: L("Link text", "نص الرابط") },
      { kind: "number", key: "limit", label: L("How many to show", "عدد الباقات المعروضة"), min: 1, max: 12 },
    ],
    derived: [L("The cards are pulled automatically from your published packages.", "تُسحب البطاقات تلقائياً من باقاتك المنشورة.")],
  },
  destinations: {
    type: "destinations", icon: "map",
    label: L("Countries", "الدول"),
    description: L("Countries you operate in.", "الدول التي تعمل بها."),
    fields: [
      { kind: "loc", key: "eyebrow", label: L("Eyebrow", "تمهيد") },
      { kind: "loc", key: "heading", label: L("Heading", "العنوان") },
    ],
    repeaters: [{
      key: "items", itemMode: "object",
      label: L("Countries", "الدول"), addLabel: L("Add country", "إضافة دولة"), itemNoun: L("Country", "دولة"),
      itemFields: [
        { kind: "loc", key: "name", label: L("Name", "الاسم") },
        { kind: "image", key: "image", label: L("Image", "صورة") },
      ],
    }],
    derived: [L("Prefilled from your packages' countries — edit names, swap images, reorder, or add a country you cover but don't have a package for yet. Each tile links to your packages in that country.", "مُعبّأة من دول باقاتك — عدّل الأسماء، بدّل الصور، أعد الترتيب، أو أضف دولة تغطّيها دون باقة بعد. كل بطاقة تربط بباقاتك في تلك الدولة.")],
  },
  testimonials: {
    type: "testimonials", icon: "messenger",
    label: L("Testimonials", "آراء العملاء"),
    description: L("Words from past travelers.", "كلمات من مسافرين سابقين."),
    fields: [
      { kind: "loc", key: "eyebrow", label: L("Eyebrow", "تمهيد") },
      { kind: "loc", key: "heading", label: L("Heading", "العنوان") },
    ],
    repeaters: [{
      key: "items", itemMode: "object",
      label: L("Reviews", "المراجعات"), addLabel: L("Add review", "إضافة مراجعة"), itemNoun: L("Review", "مراجعة"),
      itemFields: [
        { kind: "loc", key: "quote", label: L("Quote", "الاقتباس"), area: true },
        { kind: "plain", key: "name", label: L("Guest name", "اسم الضيف") },
        { kind: "loc", key: "trip", label: L("Trip", "الرحلة") },
        { kind: "image", key: "photo", label: L("Photo", "صورة") },
      ],
    }],
  },
  stats: {
    type: "stats", icon: "chart",
    label: L("Stats", "الأرقام"),
    description: L("Numbers, or honest qualities until the numbers are real.", "أرقام، أو صفات صادقة حتى تصبح الأرقام حقيقية."),
    fields: [
      { kind: "loc", key: "eyebrow", label: L("Eyebrow", "تمهيد") },
      { kind: "loc", key: "heading", label: L("Heading", "العنوان") },
      { kind: "number", key: "years", label: L("Years in business", "سنوات الخبرة"), min: 0 },
      { kind: "number", key: "travellers", label: L("Travellers hosted", "عدد المسافرين"), min: 0 },
      { kind: "number", key: "rating", label: L("Average rating (out of 5)", "متوسط التقييم (من ٥)"), min: 0, max: 5, decimal: true },
      { kind: "loc", key: "fallbackNote", label: L("Note (shown when no numbers)", "ملاحظة (عند غياب الأرقام)"), area: true },
    ],
    repeaters: [{
      key: "qualities", itemMode: "loc",
      label: L("Qualities (shown when no numbers)", "الصفات (عند غياب الأرقام)"), addLabel: L("Add quality", "إضافة صفة"), itemNoun: L("Quality", "صفة"),
    }],
  },
  seasonal_offers: {
    type: "seasonal_offers", icon: "calendar",
    label: L("Seasonal offer", "عرض موسمي"),
    description: L("A featured seasonal promotion.", "عرض موسمي مميز."),
    fields: [
      { kind: "loc", key: "eyebrow", label: L("Eyebrow", "تمهيد") },
      { kind: "loc", key: "heading", label: L("Heading", "العنوان") },
      { kind: "loc", key: "body", label: L("Body", "النص"), area: true },
      { kind: "loc", key: "cta", label: L("Button text", "نص الزر") },
      { kind: "image", key: "image", label: L("Image", "صورة") },
    ],
  },
  accreditation: {
    type: "accreditation", icon: "check",
    label: L("Accreditation", "الاعتمادات"),
    description: L("Registrations & accreditations you hold.", "التسجيلات والاعتمادات التي تحملها."),
    fields: [
      { kind: "loc", key: "eyebrow", label: L("Eyebrow", "تمهيد") },
      { kind: "loc", key: "tag", label: L("Tag", "وسم") },
    ],
    repeaters: [{
      key: "badges", itemMode: "object",
      label: L("Badges", "الشارات"), addLabel: L("Add badge", "إضافة شارة"), itemNoun: L("Badge", "شارة"),
      itemFields: [
        { kind: "loc", key: "title", label: L("Title", "العنوان") },
        { kind: "loc", key: "note", label: L("Note", "ملاحظة") },
      ],
    }],
  },
  contact: {
    type: "contact", icon: "whatsapp",
    label: L("Contact", "تواصل"),
    description: L("Invite visitors to get in touch.", "ادعُ الزوار للتواصل."),
    fields: [
      { kind: "loc", key: "eyebrow", label: L("Eyebrow", "تمهيد") },
      { kind: "loc", key: "heading", label: L("Heading", "العنوان") },
      { kind: "loc", key: "body", label: L("Body", "النص"), area: true },
      { kind: "loc", key: "note", label: L("Small note", "ملاحظة صغيرة") },
    ],
    derived: [L("The WhatsApp & email buttons come from your contact details in Branding.", "يأتي زرّا واتساب والبريد من بيانات التواصل في الهوية.")],
  },
  // About-page only (never offered on the homepage picker).
  team: {
    type: "team", icon: "users",
    label: L("Team", "الفريق"),
    description: L("The people behind your trips.", "الأشخاص خلف رحلاتك."),
    fields: [
      { kind: "loc", key: "eyebrow", label: L("Eyebrow", "تمهيد") },
      { kind: "loc", key: "heading", label: L("Heading", "العنوان") },
      { kind: "loc", key: "note", label: L("Note", "ملاحظة"), area: true },
    ],
    repeaters: [{
      key: "members", itemMode: "object",
      label: L("Team members", "أعضاء الفريق"), addLabel: L("Add member", "إضافة عضو"), itemNoun: L("Member", "عضو"),
      itemFields: [
        { kind: "loc", key: "name", label: L("Name / title", "الاسم / المسمّى") },
        { kind: "loc", key: "role", label: L("Role line", "سطر الدور") },
        { kind: "image", key: "photo", label: L("Photo", "صورة") },
      ],
    }],
    derived: [L("Members with no photo show a placeholder slot until you upload one — never a stock face.", "يظهر العضو بدون صورة بخانة مؤقتة حتى ترفع صورته — دون وجوه جاهزة.")],
  },
  // Deferred types are NOT buildable — present only to satisfy the type map.
  // The builder never reads these (it iterates BUILDABLE_TYPES).
  blog: { type: "blog", icon: "edit", label: L("Blog", "مدونة"), description: L("", ""), fields: [] },
  gallery: { type: "gallery", icon: "image", label: L("Gallery", "معرض"), description: L("", ""), fields: [] },
  faq: { type: "faq", icon: "chart", label: L("FAQ", "أسئلة"), description: L("", ""), fields: [] },
  how_it_works: { type: "how_it_works", icon: "chart", label: L("How it works", "كيف نعمل"), description: L("", ""), fields: [] },
  map: { type: "map", icon: "map", label: L("Map", "خريطة"), description: L("", ""), fields: [] },
};
