// Homepage section data model — the SINGLE source of truth.
// The renderer reads this; the dashboard editor (later step) will write it.
//
// Stored on users/{uid}.homepage. Every author-facing TEXT field is BILINGUAL
// ({en, ar}) so the ?language= toggle switches homepage BODY, not just chrome.
//
// Honesty rules (enforced by the renderer, encoded by the defaults here):
//  • Core sections default ON only where content can be derived honestly.
//  • Sections needing authored marketing copy (hero copy, why_us, services,
//    seasonal_offers, accreditation, testimonials) default OFF until authored —
//    never invented text/stats/reviews/badges.
//  • stats renders real numbers only when agency stats exist, else an honest
//    no-numbers fallback (qualities, not fabricated counts).

export type Loc = { en: string; ar: string };
export const loc = (en = "", ar = ""): Loc => ({ en, ar });
/** Pick a language with graceful fallback to the other side. */
export const pick = (l: Loc | undefined, lang: "en" | "ar"): string =>
  !l ? "" : lang === "ar" ? l.ar || l.en : l.en || l.ar;

// ── Section type catalog (matches the locked homepage catalog) ──────────────

export type HomeSectionType =
  // Core
  | "hero" | "about" | "why_us" | "services" | "featured_packages"
  | "destinations" | "testimonials" | "contact"
  // More
  | "stats" | "seasonal_offers" | "accreditation"
  // About-page only
  | "team"
  | "blog" | "gallery" | "faq" | "how_it_works" | "map";

/** The two section-driven pages. Both render through the same model/renderer;
 *  they differ only in which catalog the Add picker offers and where the config
 *  is stored (users/{uid}.homepage vs .aboutPage). */
export type HomePageKind = "home" | "about";

// ── Page catalogs ────────────────────────────────────────────────────────────
// Each page offers its OWN buildable set through the Add picker. `team` is
// ABOUT-ONLY — it is never offered on the homepage. The renderer/persistence
// layer keys off BUILDABLE_TYPES (the union) so any page's section hydrates and
// persists; the pickers key off the page-scoped sets below.

/** Homepage backbone (the always-reachable Core tier of the homepage picker). */
export const CORE_TYPES: HomeSectionType[] = [
  "hero", "about", "why_us", "services", "featured_packages",
  "destinations", "testimonials", "contact",
];

/** Everything the homepage picker offers (Core + More). No `team`. */
export const HOMEPAGE_BUILDABLE: HomeSectionType[] = [
  "hero", "about", "why_us", "services", "featured_packages",
  "destinations", "testimonials", "stats", "seasonal_offers",
  "accreditation", "contact",
];

/** About-page backbone: intro/story/values/team/credentials/CTA mapped onto
 *  hero/about/why_us/team/accreditation/contact. */
export const ABOUT_CORE_TYPES: HomeSectionType[] = [
  "hero", "about", "why_us", "team", "accreditation", "contact",
];

/** Everything the About picker offers (Core + a couple of story-relevant More). */
export const ABOUT_BUILDABLE: HomeSectionType[] = [
  "hero", "about", "why_us", "team", "testimonials", "stats",
  "accreditation", "contact",
];

// ── Buildable catalog — the SINGLE source of truth for the dashboard editor ──
// The ONLY types the renderer (renderSection in HomepageSections.tsx) actually
// renders AND the patch persists. The union of every page's catalog: a new
// rendered section must be added to a page catalog AND the dispatcher in the
// same change. The 5 deferred types (blog/gallery/faq/how_it_works/map) no-op
// in the renderer, so no picker offers them — enabling one would produce an
// invisible live section.
export const BUILDABLE_TYPES: HomeSectionType[] = Array.from(
  new Set<HomeSectionType>([...HOMEPAGE_BUILDABLE, ...ABOUT_BUILDABLE]),
);

/** True when a section type is editable in the builder (and rendered live). */
export function isBuildableType(t: string): t is HomeSectionType {
  return (BUILDABLE_TYPES as string[]).includes(t);
}

/** The buildable catalog a given page's Add picker offers. */
export function buildableFor(page: HomePageKind): HomeSectionType[] {
  return page === "about" ? ABOUT_BUILDABLE : HOMEPAGE_BUILDABLE;
}
/** A page's Core tier (the always-present backbone). */
export function coreTypesFor(page: HomePageKind): HomeSectionType[] {
  return page === "about" ? ABOUT_CORE_TYPES : CORE_TYPES;
}
/** A page's More tier (opt-in via the picker) = buildable minus Core. */
export function moreTypesFor(page: HomePageKind): HomeSectionType[] {
  const core = coreTypesFor(page);
  return buildableFor(page).filter((t) => !core.includes(t));
}

// ── Per-type content schemas ────────────────────────────────────────────────

export type IconCard = { icon?: string; title: Loc; desc: Loc };

export type HeroContent = {
  eyebrow?: Loc;
  headline?: Loc;     // empty → renderer falls back to agency name
  sub?: Loc;          // empty → renderer falls back to agency tagline
  image?: string;
};
export type AboutContent = {
  eyebrow?: Loc;
  heading?: Loc;
  body?: Loc;         // empty → renderer falls back to about_en/ar
  image?: string;
  link?: Loc;
};
export type WhyUsContent = { eyebrow?: Loc; heading?: Loc; items: IconCard[] };
export type ServicesContent = { eyebrow?: Loc; heading?: Loc; items: IconCard[] };
export type FeaturedPackagesContent = { eyebrow?: Loc; heading?: Loc; link?: Loc; limit?: number };
// `items` (optional): explicit, bilingual destination tiles authored on the
// section itself. When present they REPLACE the package-derived tiles — used to
// show coverage countries that have no bookable packages yet. A tile is
// clickable (links to the catalog) only when `clickable` is true.
// `filter` (optional): the exact package `destination` value this tile filters
// the catalog by (links to /packages?destination=<filter>). Falls back to the
// tile's own name when absent (derived tiles, where name === destination).
export type DestinationTile = { name: Loc; image?: string; clickable?: boolean; filter?: string };
export type DestinationsContent = { eyebrow?: Loc; heading?: Loc; images?: Record<string, string>; items?: DestinationTile[] };

/** Build explicit, editable destination tiles from an agency's distinct package
 *  destinations. The builder uses this to PREFILL the Countries section so the
 *  agency can rename, swap images, reorder, or add coverage countries that have
 *  no packages yet. The bilingual name is seeded from the (single-language)
 *  destination string on both sides — the agency edits the other language — and
 *  the image from a package cover. `filter` pins the exact catalog destination so
 *  the tile keeps linking correctly even after the name is translated. */
export function deriveDestinationItems(
  pkgs: { destination?: string; coverImage?: string; images?: string[] }[],
): DestinationTile[] {
  const seen = new Map<string, string | undefined>();
  for (const p of pkgs) {
    const name = (p.destination || "").trim();
    if (name && !seen.has(name)) seen.set(name, p.coverImage || p.images?.[0]);
  }
  return Array.from(seen.entries()).map(([name, image]) => ({
    name: { en: name, ar: name },
    image,
    clickable: true,
    filter: name,
  }));
}
// A review item. `media` (optional) is a hot-linked image-screenshot or video URL;
// its kind is INFERRED from the URL extension via reviewKind() — no separate kind
// field. quote/name are optional so a media-only review (screenshot/video clip with
// no prose) is valid; a text review keeps the classic quote + name + avatar shape.
export type Testimonial = { quote?: Loc; name?: string; trip?: Loc; photo?: string; media?: string };
// `limit`: how many reviews to show on the home section (the rest live on /reviews).
// `link`: "View all" label linking to the dedicated reviews page.
export type TestimonialsContent = { eyebrow?: Loc; heading?: Loc; link?: Loc; limit?: number; items: Testimonial[] };

export type ReviewKind = "text" | "image" | "video";

/** Infer a review's kind from its media URL extension (query/hash stripped first).
 *  No media → "text". A present-but-unrecognized extension defaults to "image"
 *  (safer to attempt an <img> than to silently drop a hot-linked URL). */
export function reviewKind(media?: string): ReviewKind {
  const url = (media || "").trim();
  if (!url) return "text";
  const path = url.split(/[?#]/)[0].toLowerCase();
  if (/\.(mp4|webm|mov|m4v)$/.test(path)) return "video";
  if (/\.(jpe?g|png|webp|gif|avif|svg)$/.test(path)) return "image";
  return "image";
}
export type ContactContent = { eyebrow?: Loc; heading?: Loc; body?: Loc; note?: Loc };
// Numbers (years/travellers/rating) are authored HERE — the homepage Stats
// section is their single source of truth. The renderer reads these first and
// only falls back to the legacy agency.stats* fields when a number is absent.
export type StatsContent = { eyebrow?: Loc; heading?: Loc; years?: number; travellers?: number; rating?: number; fallbackNote?: Loc; qualities: Loc[] };
export type SeasonalOffersContent = { eyebrow?: Loc; heading?: Loc; body?: Loc; cta?: Loc; image?: string };
export type Badge = { title: Loc; note?: Loc };
export type AccreditationContent = { eyebrow?: Loc; tag?: Loc; badges: Badge[] };
// Team — About-page only. Honest: photos are agency-uploaded; absent photos
// render a placeholder slot (never a stock face). Empty members → hidden live.
export type TeamMember = { name: Loc; role?: Loc; photo?: string };
export type TeamContent = { eyebrow?: Loc; heading?: Loc; note?: Loc; members: TeamMember[] };
export type FaqContent = { eyebrow?: Loc; heading?: Loc; items: { q: Loc; a: Loc }[] };
export type GalleryContent = { eyebrow?: Loc; heading?: Loc; images: string[] };
export type GenericContent = { eyebrow?: Loc; heading?: Loc; body?: Loc };

export type HomeContentMap = {
  hero: HeroContent;
  about: AboutContent;
  why_us: WhyUsContent;
  services: ServicesContent;
  featured_packages: FeaturedPackagesContent;
  destinations: DestinationsContent;
  testimonials: TestimonialsContent;
  contact: ContactContent;
  stats: StatsContent;
  seasonal_offers: SeasonalOffersContent;
  accreditation: AccreditationContent;
  team: TeamContent;
  blog: GenericContent;
  gallery: GalleryContent;
  faq: FaqContent;
  how_it_works: GenericContent;
  map: GenericContent;
};

export type HomeSection<T extends HomeSectionType = HomeSectionType> = {
  type: T;
  enabled: boolean;
  order: number;
  content: HomeContentMap[T];
};

export type HomepageConfig = {
  version: 1;
  sections: HomeSection[];
};

// ── Tiering: Core (the page backbone, always present) vs More (opt-in) ───────
// MORE_TYPES are the homepage's opt-in sections offered through the Add-a-section
// picker. They are NOT seeded into a fresh homepage — an agency adds them on
// demand (stats is the most-likely-empty section, so opt-in is honest). The
// per-page tiers come from moreTypesFor()/coreTypesFor(); this constant is the
// homepage's, kept for back-compat.
export const MORE_TYPES: HomeSectionType[] = moreTypesFor("home");

const H = (en: string, ar: string) => loc(en, ar);

/** The default authored-content shell for one section type (no fabricated facts;
 *  headings here are navigational labels). Used by the seed AND the Add picker so
 *  a picker-added section hydrates identically to a seeded one. */
function sectionContentShell(type: HomeSectionType): HomeSection["content"] {
  switch (type) {
    case "hero": return { eyebrow: loc(), headline: loc(), sub: loc(), image: "" } as HeroContent;
    case "about": return { eyebrow: H("About", "من نحن"), heading: loc(), body: loc(), link: loc(), image: "" } as AboutContent;
    case "why_us": return { eyebrow: H("Why us", "لماذا نحن"), heading: loc(), items: [] } as WhyUsContent;
    case "services": return { eyebrow: H("What we do", "ماذا نقدّم"), heading: loc(), items: [] } as ServicesContent;
    case "featured_packages": return { eyebrow: H("Featured packages", "باقات مختارة"), heading: H("Journeys ready to book.", "رحلات جاهزة للحجز."), link: H("See all packages", "كل الباقات"), limit: 4 } as FeaturedPackagesContent;
    case "destinations": return { eyebrow: H("Where we go", "وجهاتنا"), heading: H("Destinations", "الوجهات"), images: {} } as DestinationsContent;
    case "testimonials": return { eyebrow: H("Travelers' words", "كلمات مسافرينا"), heading: H("What guests say", "ماذا يقول ضيوفنا"), link: H("View all reviews", "عرض كل المراجعات"), limit: 4, items: [] } as TestimonialsContent;
    case "stats": return { eyebrow: H("By the numbers", "بالأرقام"), heading: H("Honest about where we are.", "صادقون في أرقامنا."), years: 0, travellers: 0, rating: 0, fallbackNote: loc(), qualities: [] } as StatsContent;
    case "seasonal_offers": return { eyebrow: H("Seasonal", "موسمي"), heading: loc(), body: loc(), cta: loc(), image: "" } as SeasonalOffersContent;
    case "accreditation": return { eyebrow: H("Registered & accredited", "مسجّلون ومعتمدون"), badges: [] } as AccreditationContent;
    case "team": return { eyebrow: H("The team", "الفريق"), heading: loc(), note: loc(), members: [] } as TeamContent;
    case "contact": return { eyebrow: H("Get in touch", "تواصل معنا"), heading: H("Plan your journey with us.", "خطّط رحلتك معنا."), body: H("Message us on WhatsApp — we usually reply within the hour.", "راسلنا على واتساب — نردّ عادةً خلال ساعة."), note: loc() } as ContactContent;
    default: return { eyebrow: loc(), heading: loc(), body: loc() } as GenericContent;
  }
}

/** Mint a fresh section of a given type (for the seed and the Add picker). */
export function makeSection(type: HomeSectionType, enabled = true): HomeSection {
  return { type, enabled, order: 0, content: sectionContentShell(type) };
}

// ── Typed default / seed ────────────────────────────────────────────────────
// A fresh agency gets the CORE backbone only. Sections that can be derived
// honestly are data-gated ON (about/featured/destinations/contact); the
// authored-copy core sections (why_us/services/testimonials) default ON to
// prompt authoring (honest-empty hides them live until filled). More sections
// (stats/seasonal/accreditation) are not seeded — added via the picker.

type SeedInput = {
  hasAbout?: boolean;
  hasPackages?: boolean;
  hasDestinations?: boolean;
  hasContact?: boolean;
};

export function defaultHomepageConfig(seed: SeedInput = {}): HomepageConfig {
  const enabledFor: Record<string, boolean> = {
    hero: true,
    about: !!seed.hasAbout,
    why_us: true,
    services: true,
    featured_packages: !!seed.hasPackages,
    destinations: !!seed.hasDestinations,
    testimonials: true,
    contact: !!seed.hasContact,
  };
  const sections: HomeSection[] = CORE_TYPES.map((type, i) => ({
    ...makeSection(type, enabledFor[type] ?? false),
    order: i,
  }));
  return { version: 1, sections };
}

// The About page's backbone — intro/story/values/team/credentials/CTA. About
// and Why-us seed ON to prompt authoring (honest-empty hides them live until
// filled); team & accreditation likewise (placeholder slots / no invented
// badges); contact is data-gated on real contact details, like the homepage.
export function defaultAboutConfig(seed: SeedInput = {}): HomepageConfig {
  const enabledFor: Record<string, boolean> = {
    hero: true,
    about: true,
    why_us: true,
    team: true,
    accreditation: true,
    contact: !!seed.hasContact,
  };
  const sections: HomeSection[] = ABOUT_CORE_TYPES.map((type, i) => ({
    ...makeSection(type, enabledFor[type] ?? false),
    order: i,
  }));
  return { version: 1, sections };
}

/** The seed/default config for a given page. */
export function defaultConfig(page: HomePageKind, seed: SeedInput = {}): HomepageConfig {
  return page === "about" ? defaultAboutConfig(seed) : defaultHomepageConfig(seed);
}

// ── Config hydration: merge a stored (possibly partial) config with defaults ──

export function readHomepageConfig(
  raw: unknown,
  seed: SeedInput = {},
  page: HomePageKind = "home"
): HomepageConfig {
  const def = defaultConfig(page, seed);
  if (!raw || typeof raw !== "object" || !Array.isArray((raw as HomepageConfig).sections)) {
    return def;
  }
  const stored = raw as HomepageConfig;
  // A content shell for ANY buildable type (not just the seeded Core set), so a
  // picker-added More section — absent from the default seed — still rehydrates
  // with its full default content on reload. Defaults indexed for enabled fallback.
  const byType = new Map(def.sections.map((s) => [s.type, s]));
  const merged: HomeSection[] = stored.sections
    .filter((s) => s && typeof s.type === "string")
    .map((s, i) => {
      const base = byType.get(s.type);
      const shell = isBuildableType(s.type) ? makeSection(s.type).content : undefined;
      return {
        type: s.type,
        enabled: typeof s.enabled === "boolean" ? s.enabled : base?.enabled ?? false,
        order: typeof s.order === "number" ? s.order : i,
        content: { ...(shell as object), ...(s.content as object) } as HomeSection["content"],
      };
    });
  return { version: 1, sections: merged };
}

/** Enabled sections in render order. */
export function enabledSections(cfg: HomepageConfig): HomeSection[] {
  return [...cfg.sections].filter((s) => s.enabled).sort((a, b) => a.order - b.order);
}

// ── Write path: clean + patch (mirrors lib/brand.ts brandDocPatch) ───────────
// The editor writes ONLY the model's authored fields. Empty Loc / empty strings
// are stripped before write so a toggled-on-but-empty section persists no
// placeholder junk and degrades to honest-empty (hidden) on the live page — the
// renderer's pick()/fallback logic already treats absent fields as empty.

function isLoc(v: unknown): v is Loc {
  if (!v || typeof v !== "object" || Array.isArray(v)) return false;
  const keys = Object.keys(v as object);
  return keys.length > 0 && keys.every((k) => k === "en" || k === "ar");
}

/** Recursively drop empty Loc fields, empty strings, and empty items. Returns
 *  undefined when the value carries no content (so the caller can omit it). */
function cleanValue(v: unknown): unknown {
  if (isLoc(v)) {
    const en = (v.en || "").trim();
    const ar = (v.ar || "").trim();
    if (!en && !ar) return undefined;       // fully empty → absent
    return { en, ar };                       // keep both langs (one may be "")
  }
  if (typeof v === "string") {
    const t = v.trim();
    return t.length ? t : undefined;
  }
  if (typeof v === "number" || typeof v === "boolean") return v;
  if (Array.isArray(v)) {
    const items = v.map(cleanValue).filter((x) => x !== undefined);
    return items.length ? items : undefined;
  }
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      const cleaned = cleanValue(val);
      if (cleaned !== undefined) out[k] = cleaned;
    }
    return Object.keys(out).length ? out : undefined;
  }
  return undefined;
}

/** Clean a single section's content for persistence. Always returns an object. */
export function cleanHomeContent(content: unknown): Record<string, unknown> {
  return (cleanValue(content) as Record<string, unknown>) ?? {};
}

/**
 * Map a section-driven page's editor config to its canonical users/{uid} patch.
 * Mirrors brandDocPatch: returns a top-level field — `homepage` for the home
 * page, `aboutPage` for the About page — written wholesale via updateDoc and
 * re-hydrated on read by readHomepageConfig(…, page). Only buildable types are
 * persisted, hero is forced enabled, order is normalized to array position, and
 * empty authored fields are stripped (honest empties downstream).
 */
export function configDocPatch(
  cfg: HomepageConfig,
  page: HomePageKind = "home"
): Record<string, unknown> {
  const sections: HomeSection[] = cfg.sections
    .filter((s) => s && isBuildableType(s.type))
    .map((s, i) => ({
      type: s.type,
      enabled: s.type === "hero" ? true : !!s.enabled,
      order: i,
      content: cleanHomeContent(s.content) as HomeSection["content"],
    }));
  const field = page === "about" ? "aboutPage" : "homepage";
  return { [field]: { version: 1, sections } };
}

/** Back-compat alias — the homepage patch. */
export function homepageDocPatch(cfg: HomepageConfig): Record<string, unknown> {
  return configDocPatch(cfg, "home");
}

// ── About-page content gate ───────────────────────────────────────────────────
// The About nav link (SiteHeader + SiteFooter) appears ONLY when the agency has
// authored a real About page — i.e. at least one enabled section the site-mode
// renderer would actually show. Hero (falls back to the agency name) and contact
// (a CTA every agency has) are NOT signals: they render for everyone and prove
// nothing about an authored story. Mirrors the honest-empty rules in
// HomepageSections.tsx so the link's presence tracks what /about really renders.

function locHasText(v: unknown): boolean {
  if (!v || typeof v !== "object") return false;
  const l = v as Loc;
  return !!String(l.en || "").trim() || !!String(l.ar || "").trim();
}

function nonEmptyArray(v: unknown): boolean {
  return Array.isArray(v) && v.length > 0;
}

/** Would this enabled About section render live (editor=false)? Mirrors the
 *  per-section honest-empty checks in HomepageSections.tsx. `agency` supplies the
 *  same legacy fallbacks the renderer reads (about_en/ar, stats*). */
function aboutSectionRendersLive(s: HomeSection, agency: Record<string, unknown>): boolean {
  const c = s.content as Record<string, unknown>;
  switch (s.type) {
    case "about":
      return locHasText(c.body) || !!(agency.about_en || agency.about_ar);
    case "why_us":
    case "services":
    case "testimonials":
      return nonEmptyArray(c.items);
    case "team":
      return nonEmptyArray(c.members);
    case "accreditation":
      return nonEmptyArray(c.badges);
    case "stats": {
      const hasNumber =
        Number(c.years) || Number(agency.statsYears) ||
        Number(c.travellers) || Number(agency.statsTravellers) ||
        Number(c.rating) || Number(agency.statsRating);
      const hasQuality = nonEmptyArray(c.qualities) && (c.qualities as Loc[]).some(locHasText);
      return !!hasNumber || hasQuality || locHasText(c.fallbackNote);
    }
    default:
      return false; // hero / contact / non-About types never gate the link
  }
}

/** True when the agency has authored real About-page content. Gates the About
 *  nav link — when false the link is HIDDEN (not muted). Hydrates the stored
 *  aboutPage config exactly as the /about route does, so the link only appears
 *  when /about would render more than the hero + contact CTA. */
export function aboutPageHasContent(agency: Record<string, unknown> | null | undefined): boolean {
  if (!agency) return false;
  const cfg = readHomepageConfig(agency.aboutPage, {}, "about");
  return cfg.sections.some((s) => s.enabled && aboutSectionRendersLive(s, agency));
}
