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
  // per-section data shapes
  ItineraryDay,
  ItineraryData,
  Departure,
  FlightsData,
  InclusionsData,
  PricingTier,
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
