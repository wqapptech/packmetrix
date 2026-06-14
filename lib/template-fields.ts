/**
 * Per-template section priority config — data-driven map used by the builder
 * to foreground the most relevant sections for a given template at the top of
 * the sections list. Every section remains editable for any package; this only
 * affects emphasis and ordering in the builder UI.
 *
 * Source of truth: design bundle chat2.md art directions.
 */

export type SectionPriority = {
  /** v2 section type key */
  type: string;
  /** Builder UI label override (falls back to registry label) */
  label?: string;
  labelAr?: string;
};

/**
 * Foregrounded sections per template, in display order.
 * Builder Phase 2 will surface these at the top of the section list when the
 * corresponding template is active.
 */
export const TEMPLATE_SECTION_PRIORITY: Record<string, SectionPriority[]> = {
  aurora: [
    { type: "people",         label: "Travel designer",     labelAr: "مصمم الرحلة" },
    { type: "itinerary",      label: "Day-by-day itinerary", labelAr: "البرنامج اليومي" },
    { type: "media",          label: "Photo gallery",        labelAr: "معرض الصور" },
    { type: "departures",     label: "Departure dates",      labelAr: "مواعيد المغادرة" },
    { type: "reviews",        label: "Reviews",              labelAr: "التقييمات" },
    { type: "other_packages", label: "Related packages",     labelAr: "باقات أخرى" },
  ],
  voyage: [
    { type: "highlights",     label: "Highlights",           labelAr: "أبرز المميزات" },
    { type: "media",          label: "Photo gallery",        labelAr: "معرض الصور" },
    { type: "itinerary",      label: "Itinerary",            labelAr: "البرنامج اليومي" },
    { type: "people",         label: "Trip lead",            labelAr: "قائد الرحلة" },
    { type: "departures",     label: "Departure dates",      labelAr: "مواعيد المغادرة" },
    { type: "other_packages", label: "Related packages",     labelAr: "باقات أخرى" },
  ],
  pulse: [
    { type: "scarcity",       label: "Scarcity & urgency",  labelAr: "الندرة والإلحاح" },
    { type: "pricing",        label: "Pricing",             labelAr: "الأسعار" },
    { type: "departures",     label: "Departure dates",     labelAr: "مواعيد المغادرة" },
    { type: "reviews",        label: "Reviews",             labelAr: "التقييمات" },
    { type: "other_packages", label: "Related packages",    labelAr: "باقات أخرى" },
  ],
  sakina: [
    { type: "people",          label: "Mutawif / guide",    labelAr: "المطوف / المرشد" },
    { type: "itinerary",       label: "Itinerary",          labelAr: "برنامج الرحلة" },
    { type: "important_notes", label: "Important notes",    labelAr: "ملاحظات مهمة" },
    { type: "departures",      label: "Departure dates",    labelAr: "مواعيد المغادرة" },
    { type: "about_agency",    label: "About the agency",   labelAr: "عن الوكالة" },
    { type: "other_packages",  label: "Related packages",   labelAr: "باقات أخرى" },
  ],
  petal: [
    { type: "media",          label: "Photo gallery",       labelAr: "معرض الصور" },
    { type: "hotel",          label: "Accommodation",       labelAr: "الإقامة" },
    { type: "highlights",     label: "Highlights",          labelAr: "أبرز المميزات" },
    { type: "extras",         label: "Optional extras",     labelAr: "الإضافات الاختيارية" },
    { type: "departures",     label: "Departure dates",     labelAr: "مواعيد المغادرة" },
    { type: "other_packages", label: "Related packages",    labelAr: "باقات أخرى" },
  ],
  compass: [
    { type: "trek_profile",    label: "Trek profile",       labelAr: "ملف الرحلة الجبلية" },
    { type: "itinerary",       label: "Daily stages",       labelAr: "المراحل اليومية" },
    { type: "important_notes", label: "Important notes",    labelAr: "ملاحظات مهمة" },
    { type: "departures",      label: "Departure dates",    labelAr: "مواعيد المغادرة" },
    { type: "other_packages",  label: "Related packages",   labelAr: "باقات أخرى" },
  ],
  atlas: [
    { type: "people",         label: "Curator",             labelAr: "المنسق" },
    { type: "hotel",          label: "Accommodation",       labelAr: "الإقامة" },
    { type: "media",          label: "Photo gallery",       labelAr: "معرض الصور" },
    { type: "about_agency",   label: "About the agency",    labelAr: "عن الوكالة" },
    { type: "custom",         label: "Custom section",      labelAr: "قسم مخصص" },
    { type: "other_packages", label: "Related packages",    labelAr: "باقات أخرى" },
  ],
  tribe: [
    { type: "people",         label: "Trip lead",           labelAr: "قائد الرحلة" },
    { type: "reviews",        label: "Reviews",             labelAr: "التقييمات" },
    { type: "about_agency",   label: "About the agency",    labelAr: "عن الوكالة" },
    { type: "custom",         label: "Crew / chat",         labelAr: "الفريق / دردشة" },
    { type: "departures",     label: "Departure dates",     labelAr: "مواعيد المغادرة" },
    { type: "other_packages", label: "Related packages",    labelAr: "باقات أخرى" },
  ],
  smart: [
    { type: "pricing",        label: "Cost breakdown",      labelAr: "تفاصيل التكلفة" },
    { type: "inclusions",     label: "Inclusions",          labelAr: "ما يشمل" },
    { type: "faq",            label: "FAQ",                 labelAr: "الأسئلة الشائعة" },
    { type: "custom",         label: "What this trip doesn't have", labelAr: "ما لا تشمله الرحلة" },
    { type: "departures",     label: "Departure dates",     labelAr: "مواعيد المغادرة" },
    { type: "other_packages", label: "Related packages",    labelAr: "باقات أخرى" },
  ],
  family: [
    { type: "itinerary",       label: "Itinerary",          labelAr: "البرنامج اليومي" },
    { type: "transfers",       label: "Transfers",          labelAr: "التنقلات" },
    { type: "important_notes", label: "Important notes",    labelAr: "ملاحظات مهمة" },
    { type: "custom",          label: "Custom section",     labelAr: "قسم مخصص" },
    { type: "departures",      label: "Departure dates",    labelAr: "مواعيد المغادرة" },
    { type: "other_packages",  label: "Related packages",   labelAr: "باقات أخرى" },
  ],
};

// ─── Legacy field hints (kept for any existing code that imports FieldHint) ───

export type FieldHint = {
  field: string;
  label: string;
  labelAr: string;
};

/**
 * @deprecated Use TEMPLATE_SECTION_PRIORITY instead.
 * Flat field names are superseded by v2 section types.
 */
export const TEMPLATE_FIELD_CONFIG: Record<string, FieldHint[]> = {};
