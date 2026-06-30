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
  ReviewItem,
  ReviewsData,
  HighlightsData,
  FaqItem,
  FaqData,
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
  ScarcityData,
  MediaData,
  DepartureEntry,
  DeparturesData,
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
