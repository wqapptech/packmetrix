import type { Lang } from "@/lib/translations";

export type { Lang };

// ─── Localization ─────────────────────────────────────────────────────────────

/** Bilingual content string stored in Firestore for all authored text fields. */
export type LocalizedString = { en: string; ar: string };

/**
 * Union of a plain string (legacy packages) and LocalizedString (v2 packages).
 * Use `locStr()` to resolve to a display string — never access `.en`/`.ar` directly.
 */
export type LocStr = LocalizedString | string;

/**
 * Resolve a LocStr to a plain display string.
 * Falls back across languages when one side is empty.
 */
export function locStr(v: LocStr | undefined, lang: "en" | "ar"): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  return v[lang] || v.en || v.ar || "";
}

// ─── Core sub-types ─────────────────────────────────────────────────────────

export type TReview = {
  id: string;
  name: string;
  text: string;
  rating: number; // 1–5
  avatarUrl?: string;
  createdAt?: number;
  country?: string;
  /** "couple" | "solo" | "family" | "group" — used by Petal to filter */
  partyType?: string;
};

/** Rich itinerary day — backwards-compatible with the original { day, title, desc } shape */
export type TItineraryDay = {
  day: number;
  title: string;
  desc: string;
  /** Narrative chapter name, e.g. "Slowness" (Aurora, Voyage) */
  chapter?: string;
  /** Hero photo for this day (Aurora, Voyage, Compass, Atlas) */
  img?: string;
  /** Altitude in metres at end of day (Compass) */
  alt?: number;
  /** Distance walked in km (Compass) */
  km?: number;
  /** Optional map pin (Compass, Atlas, Voyage) */
  location?: { lat: number; lng: number; label: string };
};

export type TPricingTier = {
  label: string;
  price: string;
  /** Original / was-price shown struck-through (Pulse) */
  was?: string;
  /** Perks shown as a checklist inside the tier card */
  perks?: string[];
  /** Marks this tier as the most popular */
  pop?: boolean;
  /**
   * Human-readable saving for this specific tier, e.g. "Save $800".
   * @deprecated Compute at render from `was - price`. Never store.
   */
  save?: string;
};

export type TAirport = {
  name: string;
  price: string;
  date?: string;
  arrivingAirport?: string;
  flyingTime?: string;
  arrivingTime?: string;
};

/** Named person behind the agency/package (travel designer, mutawif, trip lead…)
 * @deprecated Migrate to the `people` section. Kept for template backward compat. */
export type TAgent = {
  name: string;
  role: string;
  avatar?: string;
  years?: number;
  /** e.g. "30 min" — shown as "replies in <30 min" */
  repliesIn?: string;
};

/** One departure date with availability and optional per-departure price */
export type TDeparture = {
  date: string;
  spots: number;
  price?: string;
  /** Marks this slot as a deal (e.g. charter under-sell) — used by Pulse */
  deal?: boolean;
};

/** Gallery image with optional caption and category */
export type TGalleryItem = {
  src: string;
  caption?: string;
  category?: "room" | "experience" | "destination";
};

// ─── v2 Tier-1 additions ──────────────────────────────────────────────────────

/** v2 unified contact entry (replaces flat whatsapp / messenger fields). */
export type TContact = {
  type: "whatsapp" | "messenger" | "phone" | "email";
  value: string;
  label?: string;
};

// ─── v2 Tier-3 Attributes ─────────────────────────────────────────────────────

export type TrekDifficulty = "easy" | "moderate" | "strenuous" | "extreme";

/**
 * Trek / adventure profile — stored as a `trek_profile` section.
 * Foregrounded by the Compass template.
 */
export type TTrekProfile = {
  difficulty?: TrekDifficulty;
  maxAltitude?: number;
  distanceKm?: number;
  fitnessNote?: string;
};

/**
 * Scarcity signals — stored as a `scarcity` section.
 * Foregrounded by the Pulse template.
 *
 * IMPORTANT: `saving` is NEVER stored — always derived at render as wasPrice − price.
 * IMPORTANT: `viewersNow` is NEVER stored — runtime-simulated by the template.
 */
export type TScarcity = {
  wasPrice?: string;
  spotsRemaining?: number;
  totalSpots?: number;
  firstDepartureDate?: string;
};

// ─── v2 People (merges guide + agent) ─────────────────────────────────────────

export type PersonRole = "guide" | "agent" | "mutawif" | "curator" | "trip_lead";

/** A person behind the package — stored in the `people` section. */
export type TPerson = {
  id: string;
  role: PersonRole;
  name: string;
  bio?: string;
  photo?: string;
  languages?: string[];
  years?: number;
  repliesIn?: string;
};

// ─── Main package type ───────────────────────────────────────────────────────

export type TPackage = {
  id: string;
  userId?: string;

  // ── Tier 1: Core fields ────────────────────────────────────────────────────

  destination: string;
  price: string;
  nights?: string | number;

  /**
   * Package title.
   * v2: stored as LocalizedString { en, ar } in Firestore.
   * Legacy: stored as plain string.
   * normalizePkg() always resolves to a plain string before passing to templates.
   */
  title?: string;

  /**
   * Short description.
   * v2: stored as LocalizedString { en, ar } in Firestore.
   * Legacy: stored as plain string.
   * normalizePkg() resolves to string.
   */
  description: string;

  /** ISO-4217 currency code, e.g. "EUR", "SAR", "USD". New in v2. */
  currency?: string;

  /** Package lifecycle status. v2 replaces the legacy isActive boolean. */
  status?: "draft" | "active" | "sold_out";

  /** @deprecated Use `status` instead. */
  isActive?: boolean;

  /** Primary authored language — drives RTL rendering and fallback resolution. */
  primaryLanguage?: "en" | "ar";

  /** @deprecated Renamed to primaryLanguage. */
  language?: string;

  coverImage?: string;

  /** v2 unified contacts list — replaces flat whatsapp / messenger. */
  contacts?: TContact[];

  /** @deprecated Use contacts[]. */
  whatsapp?: string;
  /** @deprecated Use contacts[]. */
  messenger?: string;

  // ── Template selection ────────────────────────────────────────────────────
  templateId?: string;

  // ── Tier 2: Sections (canonical storage) ──────────────────────────────────
  sections?: Array<{ id: string; type: string; order: number; data: Record<string, unknown> }>;

  // ── Tier 3: Attributes (stored as typed section entries) ──────────────────

  /** Trek / adventure profile. Foregrounded by Compass. */
  trekProfile?: TTrekProfile;

  /** Scarcity signals. Foregrounded by Pulse. saving/viewersNow NEVER stored. */
  scarcity?: TScarcity;

  /** People behind the package (guide, agent, mutawif, curator…). */
  people?: TPerson[];

  // ── Flat fields hydrated by normalizePkg() from sections[] ────────────────
  includes?: string[];
  excludes?: string[];
  advantages?: string[];
  hotelDescription?: string;
  airports?: TAirport[];
  itinerary?: TItineraryDay[];
  pricingTiers?: TPricingTier[];
  cancellation?: string;

  /** @deprecated Use sections.media.images. */
  images?: string[];

  videoUrl?: string;
  reviews?: TReview[];
  gallery?: TGalleryItem[];

  spotsRemaining?: number;
  totalSpots?: number;
  departures?: TDeparture[];

  /** Aggregate star rating (1–5). */
  rating?: number;
  /** Total review count across history. */
  reviewCount?: number;
  /** Recent booking signal — "last booked X hours ago" */
  recentBookings?: { count: number; hoursAgo: number };

  /** Cycling social proof messages — auto-generated server-side. */
  socialProofTicker?: string[];

  /**
   * Derived saving amount, e.g. "Save €300".
   * NEVER stored to Firestore — computed at render from (wasPrice - price).
   * normalizePkg() populates this from scarcity.wasPrice when present.
   */
  saving?: string;

  /**
   * Concurrent viewer count — Pulse template urgency signal.
   * NEVER stored to Firestore — runtime-simulated by the template.
   * normalizePkg() sets a seeded random value for SSR consistency.
   */
  viewersNow?: number;

  /**
   * Original was-price — used by Pulse to signal a deal.
   * @deprecated Migrate to the `scarcity` section. Kept for template backward compat.
   */
  priceWas?: string;

  /**
   * The person behind the package.
   * @deprecated Migrate to the `people` section. Kept for template backward compat.
   */
  agent?: TAgent;

  // ── Legacy Compass flat fields (replaced by trek_profile section) ─────────
  /** @deprecated Use trekProfile.maxAltitude */
  maxAltitude?: number;
  /** @deprecated Use trekProfile.distanceKm */
  distanceKm?: number;
  /** @deprecated Use trekProfile.difficulty */
  difficulty?: "easy" | "moderate" | "strenuous" | "extreme";
  /** @deprecated Use trekProfile.fitnessNote */
  fitnessNote?: string;

  // ── Legacy Sakina field ────────────────────────────────────────────────────
  prayerTimes?: { fajr?: string; dhuhr?: string; asr?: string; maghrib?: string; isha?: string };
};

// ─── Agency type ─────────────────────────────────────────────────────────────

export type TAgency = {
  name: string;
  tagline?: string;
  logoUrl?: string;
  brandColor?: string;
  activeTemplate?: string;
  agencySlug?: string;
  enableReviews?: boolean;
  showReviews?: boolean;
};

// ─── Template prop shapes ─────────────────────────────────────────────────────

export type TPageProps = {
  pkg: TPackage;
  agency: TAgency;
  onWhatsApp: () => void;
  onMessenger: () => void;
  lang: Lang;
};

// Lightweight type used in the packages list
export type TListPackage = {
  id: string;
  destination: string;
  price: string;
  views: number;
  whatsappClicks: number;
  messengerClicks: number;
  createdAt?: number;
  coverImage?: string;
  images?: string[];
  agencySlug?: string;
  isActive?: boolean;
  status?: "draft" | "active" | "sold_out";
  title?: LocStr;
  templateId?: string;
  primaryLanguage?: "en" | "ar";
};

export type TCardProps = {
  pkg: TListPackage;
  agency: TAgency;
  lang: Lang;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onDuplicate?: () => void;
};

export type TemplateDefinition = {
  id: string;
  name: string;
  nameAr: string;
  target: string;
  targetAr: string;
  Page: React.ComponentType<TPageProps>;
  Card: React.ComponentType<TCardProps>;
  previewBg: string;
  dark?: boolean;
  /** Brand accent color — sourced from the template's CSS file. */
  templateColor: string;
  /**
   * Whether this template is fully designed and selectable.
   * All 10 templates are now available.
   */
  available: boolean;
};

// Visual tokens passed to shared section renderers
export type TemplateTokens = {
  bg: string;
  ink: string;
  muted: string;
  superMuted: string;
  border: string;
  brand: string;
  serif: string;
  dark?: boolean;
};
