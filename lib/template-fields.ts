/**
 * Per-template field hints — used by the builder to surface the most
 * relevant input fields for a given template. Templates are opinionated
 * lenses over the universal TPackage data model; this config tells the
 * builder which fields to highlight for each lens.
 */

export type FieldHint = {
  field: string;
  label: string;
  labelAr: string;
};

/**
 * Fields each template emphasises. Not exhaustive — every field is always
 * accessible; this list drives "suggested for this template" UI hints only.
 */
export const TEMPLATE_FIELD_CONFIG: Record<string, FieldHint[]> = {
  aurora: [
    { field: "agent",      label: "Travel designer",     labelAr: "مصمم الرحلة"         },
    { field: "gallery",    label: "Photo gallery",        labelAr: "معرض الصور"          },
    { field: "itinerary",  label: "Day-by-day itinerary", labelAr: "البرنامج اليومي"     },
    { field: "departures", label: "Departure dates",      labelAr: "مواعيد المغادرة"     },
    { field: "rating",     label: "Rating",               labelAr: "التقييم"             },
  ],
  voyage: [
    { field: "agent",              label: "Trip lead",        labelAr: "قائد الرحلة"              },
    { field: "gallery",            label: "Photo gallery",    labelAr: "معرض الصور"               },
    { field: "spotsRemaining",     label: "Spots remaining",  labelAr: "الأماكن المتبقية"         },
    { field: "departures",         label: "Departure dates",  labelAr: "مواعيد المغادرة"          },
    { field: "socialProofTicker",  label: "Social proof",     labelAr: "إثبات اجتماعي"            },
  ],
  pulse: [
    { field: "priceWas",       label: "Original price",   labelAr: "السعر الأصلي"          },
    { field: "saving",         label: "Saving amount",    labelAr: "قيمة التوفير"          },
    { field: "spotsRemaining", label: "Spots remaining",  labelAr: "الأماكن المتبقية"      },
    { field: "departures",     label: "Departure dates",  labelAr: "مواعيد المغادرة"       },
    { field: "viewersNow",     label: "Live viewers",     labelAr: "المشاهدون المباشرون"   },
  ],
  sakina: [
    { field: "agent",          label: "Mutawif / guide",  labelAr: "المطوف / المرشد"       },
    { field: "itinerary",      label: "Itinerary",        labelAr: "برنامج الرحلة"         },
    { field: "departures",     label: "Departure dates",  labelAr: "مواعيد المغادرة"       },
    { field: "spotsRemaining", label: "Spots remaining",  labelAr: "الأماكن المتبقية"      },
    { field: "rating",         label: "Rating",           labelAr: "التقييم"               },
  ],
  petal: [
    { field: "agent",        label: "Travel designer",  labelAr: "مصمم الرحلة"          },
    { field: "gallery",      label: "Photo gallery",    labelAr: "معرض الصور"            },
    { field: "pricingTiers", label: "Room options",     labelAr: "خيارات الغرف"          },
    { field: "departures",   label: "Departure dates",  labelAr: "مواعيد المغادرة"       },
    { field: "rating",       label: "Rating",           labelAr: "التقييم"               },
  ],
  compass: [
    { field: "difficulty",   label: "Difficulty level", labelAr: "مستوى الصعوبة"         },
    { field: "maxAltitude",  label: "Max altitude (m)", labelAr: "الارتفاع الأقصى (م)"   },
    { field: "distanceKm",   label: "Distance (km)",    labelAr: "المسافة (كم)"           },
    { field: "itinerary",    label: "Daily stages",     labelAr: "المراحل اليومية"        },
    { field: "fitnessNote",  label: "Fitness note",     labelAr: "ملاحظة اللياقة"         },
  ],

  // TODO templates — minimal hints for future builder integration
  atlas: [
    { field: "agent",   label: "Curator",       labelAr: "المنسق"        },
    { field: "gallery", label: "Photo gallery", labelAr: "معرض الصور"    },
  ],
  tribe: [
    { field: "spotsRemaining", label: "Spots remaining", labelAr: "الأماكن المتبقية" },
    { field: "agent",          label: "Trip lead",       labelAr: "قائد الرحلة"      },
  ],
  smart: [
    { field: "pricingTiers", label: "Cost breakdown", labelAr: "تفاصيل التكلفة" },
  ],
  family: [
    { field: "pricingTiers",   label: "Room options",    labelAr: "خيارات الغرف"      },
    { field: "spotsRemaining", label: "Spots remaining", labelAr: "الأماكن المتبقية"  },
  ],
};
