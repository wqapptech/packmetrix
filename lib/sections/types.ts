import type { IconName } from "@/components/Icon";
import type { SectionTypeKey } from "./registry";

export type { FieldType, SelectOption, FieldDef, SectionCategory, SectionTypeDef } from "./base-types";
export type { SectionTypeKey } from "./registry";
export { SECTION_TYPE_KEYS } from "./registry";

// ─── Typed data shapes per section type ──────────────────────────────────────

export type ItineraryDay = { day: number; title: string; desc: string };
export type ItineraryData = { days: ItineraryDay[] };

export type Departure = {
  name: string;
  arrivingAirport: string;
  price: string;
  date: string;
  flyingTime: string;
  arrivingTime: string;
};
export type FlightsData = { departures: Departure[] };

export type InclusionsData = { includes: string[]; excludes: string[] };

export type PricingTier = { label: string; price: string };
export type PricingData = { tiers: PricingTier[]; cancellation: string };

export type HotelData = { description: string };

export type GalleryData = { images: string[] };

export type VideoData = { videoUrl: string };

export type ReviewItem = {
  id: string;
  name: string;
  text: string;
  rating: number;
  avatarUrl?: string;
};
export type ReviewsData = { reviews: ReviewItem[] };

export type HighlightsData = { items: string[] };

export type FaqItem = { question: string; answer: string };
export type FaqData = { items: FaqItem[] };

export type BookingTermsData = { content: string };

export type CustomData = { heading: string; content: string; image?: string };

export type ExtrasItem = { name: string; description: string; price: string };
export type ExtrasData = { items: ExtrasItem[] };

export type MealsData = { plan: string; notes: string };

export type GuideData = { name: string; bio: string; photo: string; languages: string[] };

export type ImportantNotesItem = { text: string };
export type ImportantNotesData = { items: ImportantNotesItem[] };

export type AboutAgencyData = { content: string; image: string };

export type ScheduleItem = { time: string; activity: string; location: string };
export type ScheduleData = { items: ScheduleItem[] };

export type TransfersData = { description: string; items: string[] };

export type VisaData = { included: string; content: string };

export type DepartureDateEntry = { date: string; returnDate: string; price: string; spots: string };
export type DepartureDatesData = { dates: DepartureDateEntry[] };

export type PaymentStep = { label: string; amount: string; dueDate: string };
export type PaymentPlanData = { content: string; steps: PaymentStep[] };

export type MapData = { image: string; caption: string };

// ─── Discriminated union — full type safety for rendering and storage ─────────

export type SectionInstance =
  | { id: string; type: "itinerary";       order: number; data: ItineraryData }
  | { id: string; type: "flights";         order: number; data: FlightsData }
  | { id: string; type: "inclusions";      order: number; data: InclusionsData }
  | { id: string; type: "pricing";         order: number; data: PricingData }
  | { id: string; type: "hotel";           order: number; data: HotelData }
  | { id: string; type: "gallery";         order: number; data: GalleryData }
  | { id: string; type: "video";           order: number; data: VideoData }
  | { id: string; type: "reviews";         order: number; data: ReviewsData }
  | { id: string; type: "highlights";      order: number; data: HighlightsData }
  | { id: string; type: "faq";             order: number; data: FaqData }
  | { id: string; type: "booking_terms";   order: number; data: BookingTermsData }
  | { id: string; type: "custom";          order: number; data: CustomData }
  | { id: string; type: "extras";          order: number; data: ExtrasData }
  | { id: string; type: "meals";           order: number; data: MealsData }
  | { id: string; type: "guide";           order: number; data: GuideData }
  | { id: string; type: "important_notes"; order: number; data: ImportantNotesData }
  | { id: string; type: "about_agency";    order: number; data: AboutAgencyData }
  | { id: string; type: "schedule";        order: number; data: ScheduleData }
  | { id: string; type: "transfers";       order: number; data: TransfersData }
  | { id: string; type: "visa";            order: number; data: VisaData }
  | { id: string; type: "departure_dates"; order: number; data: DepartureDatesData }
  | { id: string; type: "payment_plan";    order: number; data: PaymentPlanData }
  | { id: string; type: "map";             order: number; data: MapData };

// Looser view used by the generic dynamic editor
export type AnySectionInstance = {
  id: string;
  type: SectionTypeKey;
  order: number;
  data: Record<string, unknown>;
};

// ─── Core (non-section) fields ────────────────────────────────────────────────

export type CoreForm = {
  title: string;
  destination: string;
  price: string;
  nights: string;
  description: string;
  language: "en" | "ar";
  whatsapp: string;
  messenger: string;
  coverImage: string;
};

export const DEFAULT_CORE_FORM: CoreForm = {
  title: "",
  destination: "",
  price: "",
  nights: "5",
  description: "",
  language: "en",
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
