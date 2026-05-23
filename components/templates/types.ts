import type { Lang } from "@/lib/translations";

export type { Lang };

// ─── Core sub-types ─────────────────────────────────────────────────────────

export type TReview = {
  id: string;
  name: string;
  text: string;
  rating: number; // 1–5
  avatarUrl?: string;
  createdAt?: number;
  country?: string;
  /** "couple" | "solo" | "family" | "group" — used by Petal to filter couple reviews */
  partyType?: string;
};

/** Rich itinerary day — backwards-compatible with the original { day, title, desc } shape */
export type TItineraryDay = {
  day: number;
  title: string;
  desc: string;
  /** Narrative chapter name, e.g. "Slowness" (used by Aurora, Voyage) */
  chapter?: string;
  /** Hero photo for this day (used by Aurora, Voyage, Compass, Atlas) */
  img?: string;
  /** Altitude in metres at end of day (Compass) */
  alt?: number;
  /** Distance walked in km (Compass) */
  km?: number;
  /** Optional map pin (Compass, Atlas, Voyage) */
  location?: { lat: number; lng: number; label: string };
};

export type TPricingTier = { label: string; price: string };
export type TAirport     = {
  name: string; price: string; date?: string;
  arrivingAirport?: string; flyingTime?: string; arrivingTime?: string;
};

/** Named person behind the agency/package (travel designer, mutawif, trip lead…) */
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
  /** "room" | "experience" | "destination" — for future category filtering */
  category?: "room" | "experience" | "destination";
};

// ─── Main package type ───────────────────────────────────────────────────────

export type TPackage = {
  id: string;
  userId?: string;
  destination: string;
  price: string;
  nights?: string | number;
  title?: string;
  description: string;
  includes?: string[];
  excludes?: string[];
  advantages?: string[];
  hotelDescription?: string;
  airports?: TAirport[];
  itinerary?: TItineraryDay[];
  pricingTiers?: TPricingTier[];
  cancellation?: string;
  whatsapp?: string;
  messenger?: string;
  coverImage?: string;
  /** Legacy flat image array — new code should prefer gallery */
  images?: string[];
  videoUrl?: string;
  language?: string;
  isActive?: boolean;
  reviews?: TReview[];
  // sections-based architecture (Phase 5+)
  sections?: Array<{ id: string; type: string; order: number; data: Record<string, unknown> }>;

  // ── New fields (all optional — every template renders gracefully without them) ──

  /** Rich gallery with captions; promoted from images[] */
  gallery?: TGalleryItem[];

  /** Spots still available on the next departure */
  spotsRemaining?: number;
  /** Total capacity for the package */
  totalSpots?: number;

  /** All upcoming departures with availability and pricing */
  departures?: TDeparture[];

  /** Aggregate star rating (1–5), stored to avoid re-computing from reviews */
  rating?: number;
  /** Total review count across all history, not just on-package reviews */
  reviewCount?: number;

  /** Recent booking signal — powers "last booked X hours ago" */
  recentBookings?: { count: number; hoursAgo: number };
  /** Live viewer count — capped server-side (e.g. 6–25) for honest scarcity */
  viewersNow?: number;
  /** Cycling social proof messages (Pulse, Voyage) — auto-generated server-side */
  socialProofTicker?: string[];

  /** Original / was-price for deal packages (Pulse, Family) */
  priceWas?: string;
  /** Human-readable saving amount, e.g. "Save $790" */
  saving?: string;

  /** The person behind the package: travel designer, mutawif, trip lead, etc. */
  agent?: TAgent;

  // ── Compass-specific fields ───────────────────────────────────────────────
  /** Maximum altitude reached on the trek, in metres */
  maxAltitude?: number;
  /** Total trekking distance in km */
  distanceKm?: number;
  /** Honest difficulty classification */
  difficulty?: "easy" | "moderate" | "strenuous" | "extreme";
  /** Free-text fitness requirement note shown with the difficulty bar */
  fitnessNote?: string;
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
  title?: string;
  /** Template used by this package — drives the stripe color on admin cards */
  templateId?: string;
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
  /** Brand accent color used for the stripe in admin cards and template selector */
  templateColor: string;
  /**
   * Whether this template is fully designed and selectable.
   * false = placeholder / TODO — shown in selector but not selectable.
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
