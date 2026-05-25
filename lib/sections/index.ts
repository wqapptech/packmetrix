export type {
  FieldType,
  FieldDef,
  SelectOption,
  SectionCategory,
  SectionTypeKey,
  SectionTypeDef,
  SectionInstance,
  AnySectionInstance,
  PresetSection,
  PresetDef,
  // stable per-section data shapes
  ItineraryDay,
  ItineraryData,
  InclusionsData,
  PricingTier,
  PaymentStep,
  PricingData,
  HotelData,
  GalleryData,
  VideoData,
  ReviewItem,
  ReviewsData,
  HighlightsData,
  FaqItem,
  FaqData,
  BookingTermsData,
  CustomData,
  ExtrasItem,
  ExtrasData,
  MealsData,
  ImportantNotesItem,
  ImportantNotesData,
  AboutAgencyData,
  TransfersData,
  VisaData,
  // v2 section data shapes
  PeopleData,
  PersonEntry,
  TrekProfileData,
  ScarcityData,
  MediaData,
  DepartureEntry,
  DeparturesData,
  // legacy section data shapes (kept for backward compat rendering)
  GuideData,
  FlightsData,
  DepartureDatesData,
  PaymentPlanData,
  ScheduleData,
  MapData,
} from "./types";

export { SECTION_TYPE_KEYS, DEFAULT_CORE_FORM } from "./types";
export type { CoreForm } from "./types";

export {
  SECTION_REGISTRY,
  SECTION_REGISTRY_LIST,
  SECTION_CATEGORIES,
} from "./registry";

export { PRESETS, PRESET_MAP } from "./presets";

export { normalizePkg } from "./normalize";
