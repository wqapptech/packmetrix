import type { IconName } from "@/components/Icon";
import type { SectionTypeKey } from "./registry";

export type { FieldType, SelectOption, FieldDef, SectionCategory, SectionTypeDef } from "./base-types";
export type { SectionTypeKey } from "./registry";
export { SECTION_TYPE_KEYS } from "./registry";

// ─── Typed data shapes per section type ──────────────────────────────────────

// ── Content ──────────────────────────────────────────────────────────────────

export type ItineraryDay = { day: number; title: string; desc: string; chapter?: string; alt?: number; km?: number };
export type ItineraryData = { days: ItineraryDay[] };

export type InclusionsData = { includes: string[]; excludes: string[] };

export type HotelData = { description: string };

export type HighlightsData = { items: string[] };

export type FaqItem = { question: string; answer: string };
export type FaqData = { items: FaqItem[] };

export type CustomData = { heading: string; content: string; image?: string };

export type ExtrasItem = { name: string; description: string; price: string };
export type ExtrasData = { items: ExtrasItem[] };

export type MealsData = { plan: string; notes: string };

/** @deprecated Replaced by PeopleData. Kept for legacy section rendering. */
export type GuideData = { name: string; bio: string; photo: string; languages: string[] };

export type ImportantNotesItem = { text: string };
export type ImportantNotesData = { items: ImportantNotesItem[] };

export type AboutAgencyData = { content: string; image: string };

/** @deprecated Replaced by ItineraryData with granularity:"hour". Kept for legacy rendering. */
export type ScheduleItem = { time: string; activity: string; location: string };
export type ScheduleData = { items: ScheduleItem[] };

// ── v2: People section (replaces guide + agent extras) ────────────────────────

export type PersonEntry = {
  id: string;
  role: "guide" | "agent" | "mutawif" | "curator" | "trip_lead";
  name: string;
  bio?: string;
  photo?: string;
  languages?: string[];
  years?: number;
  repliesIn?: string;
};
export type PeopleData = { people: PersonEntry[] };

// ── v2: Trek profile (replaces flat difficulty/maxAltitude/distanceKm) ────────

export type TrekProfileData = {
  difficulty: string;
  maxAltitude: number;
  distanceKm: number;
  fitnessNote: string;
};

// ── v2: Scarcity (replaces flat priceWas/spotsRemaining/firstDepartureDate) ───

export type ScarcityData = {
  wasPrice: string;
  spotsRemaining: number;
  totalSpots: number;
  firstDepartureDate: string;
};

// ── Logistics ────────────────────────────────────────────────────────────────

export type PricingTier = { label: string; price: string };
export type PaymentStep = { label: string; amount: string; dueDate: string };
/** v2 pricing absorbs former payment_plan and booking_terms fields. */
export type PricingData = {
  tiers: PricingTier[];
  cancellation: string;
  paymentContent?: string;
  paymentSteps?: PaymentStep[];
  /** Full booking T&C text, absorbed from the legacy booking_terms section. */
  termsContent?: string;
};

/** @deprecated Folded into PricingData.termsContent. Kept for legacy section rendering. */
export type BookingTermsData = { content: string };

export type TransfersData = { description: string; items: string[] };

export type VisaData = { included: string; content: string };

// ── v2: Departures (merges flights + departure_dates) ────────────────────────

export type DepartureEntry = {
  date: string;
  returnDate?: string;
  spots: number;
  price?: string;
  origin?: string;
  arrivingAirport?: string;
  flyingTime?: string;
  arrivingTime?: string;
  deal?: boolean;
};
export type DeparturesData = { entries: DepartureEntry[] };

// ── Legacy logistics (superseded by merged types) ─────────────────────────────

/** @deprecated Use DeparturesData. Kept for legacy section rendering. */
export type LegacyDeparture = {
  name: string; arrivingAirport: string; price: string;
  date: string; flyingTime: string; arrivingTime: string;
};
export type FlightsData = { departures: LegacyDeparture[] };

/** @deprecated Folded into PricingData. Kept for legacy section rendering. */
export type PaymentPlanData = { content: string; steps: PaymentStep[] };

/** @deprecated Use DeparturesData. Kept for legacy section rendering. */
export type DepartureDateEntry = { date: string; returnDate: string; price: string; spots: string };
export type DepartureDatesData = { dates: DepartureDateEntry[] };

// ── Media ────────────────────────────────────────────────────────────────────

/** v2 media (merges gallery + video + map) */
export type MediaData = {
  images: string[];
  videoUrl?: string;
  mapImage?: string;
  mapCaption?: string;
};

/** @deprecated Use MediaData. Kept for legacy section rendering. */
export type GalleryData = { images: string[] };
/** @deprecated Use MediaData. Kept for legacy section rendering. */
export type VideoData = { videoUrl: string };
/** @deprecated Use MediaData. Kept for legacy section rendering. */
export type MapData = { image: string; caption: string };

// ── Social proof ──────────────────────────────────────────────────────────────

export type ReviewItem = {
  id: string; name: string; text: string; rating: number;
  avatarUrl?: string;
};
export type ReviewsData = { reviews: ReviewItem[] };

// ── Other packages (cross-promo) ──────────────────────────────────────────────

export type OtherPackageCard = {
  title: string;
  destination?: string;
  price?: string;
  nights?: string;
  image?: string;
  link?: string;
};
export type OtherPackagesData = {
  heading?: string;
  /** Runtime-only — injected by the page loader, never stored in Firestore. */
  packages?: OtherPackageCard[];
};

// ─── Discriminated union — full type safety for rendering and storage ─────────

export type SectionInstance =
  // v2 section types
  | { id: string; type: "people";          order: number; data: PeopleData }
  | { id: string; type: "trek_profile";    order: number; data: TrekProfileData }
  | { id: string; type: "scarcity";        order: number; data: ScarcityData }
  | { id: string; type: "media";           order: number; data: MediaData }
  | { id: string; type: "departures";      order: number; data: DeparturesData }
  | { id: string; type: "other_packages";  order: number; data: OtherPackagesData }
  // stable section types (unchanged from v1)
  | { id: string; type: "itinerary";       order: number; data: ItineraryData }
  | { id: string; type: "inclusions";      order: number; data: InclusionsData }
  | { id: string; type: "pricing";         order: number; data: PricingData }
  | { id: string; type: "hotel";           order: number; data: HotelData }
  | { id: string; type: "reviews";         order: number; data: ReviewsData }
  | { id: string; type: "highlights";      order: number; data: HighlightsData }
  | { id: string; type: "faq";             order: number; data: FaqData }
  | { id: string; type: "custom";          order: number; data: CustomData }
  | { id: string; type: "extras";          order: number; data: ExtrasData }
  | { id: string; type: "meals";           order: number; data: MealsData }
  | { id: string; type: "important_notes"; order: number; data: ImportantNotesData }
  | { id: string; type: "about_agency";    order: number; data: AboutAgencyData }
  | { id: string; type: "transfers";       order: number; data: TransfersData }
  | { id: string; type: "visa";            order: number; data: VisaData }
  // legacy section types (kept for backward compat — not offered for new packages)
  | { id: string; type: "booking_terms";   order: number; data: BookingTermsData }
  | { id: string; type: "guide";           order: number; data: GuideData }
  | { id: string; type: "flights";         order: number; data: FlightsData }
  | { id: string; type: "departure_dates"; order: number; data: DepartureDatesData }
  | { id: string; type: "payment_plan";    order: number; data: PaymentPlanData }
  | { id: string; type: "gallery";         order: number; data: GalleryData }
  | { id: string; type: "video";           order: number; data: VideoData }
  | { id: string; type: "map";             order: number; data: MapData }
  | { id: string; type: "schedule";        order: number; data: ScheduleData };

// Looser view used by the generic dynamic editor
export type AnySectionInstance = {
  id: string;
  type: SectionTypeKey;
  order: number;
  data: Record<string, unknown>;
};

// ─── Core (non-section) fields — builder form state ──────────────────────────

export type CoreForm = {
  /** English package title */
  titleEn: string;
  /** Arabic package title */
  titleAr: string;
  destination: string;
  price: string;
  /** ISO-4217 currency code, e.g. "EUR", "SAR" */
  currency: string;
  nights: string;
  /** English description */
  descriptionEn: string;
  /** Arabic description */
  descriptionAr: string;
  /** Primary authored language — drives template RTL + fallback resolution */
  primaryLanguage: "en" | "ar";
  whatsapp: string;
  messenger: string;
  coverImage: string;
};

export const DEFAULT_CORE_FORM: CoreForm = {
  titleEn: "",
  titleAr: "",
  destination: "",
  price: "",
  currency: "",
  nights: "5",
  descriptionEn: "",
  descriptionAr: "",
  primaryLanguage: "en",
  whatsapp: "",
  messenger: "",
  coverImage: "",
};

// ─── Preset ───────────────────────────────────────────────────────────────────

export type PresetSection = {
  type: SectionTypeKey;
  /** Partial override merged on top of the type's defaultData */
  data?: Partial<Record<string, unknown>>;
};

export type PresetDef = {
  id: string;
  label: string;
  labelAr: string;
  description: string;
  descriptionAr: string;
  icon: IconName;
  sections: PresetSection[];
};
