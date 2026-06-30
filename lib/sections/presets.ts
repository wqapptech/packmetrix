import type { PresetDef } from "./types";

export const PRESETS: PresetDef[] = [
  // ─── Umrah / Hajj ──────────────────────────────────────────────────────────

  {
    id: "umrah",
    label: "Umrah / Hajj",
    labelAr: "عمرة / حج",
    description: "Religious package with flights, hotel in Mecca & Medina, visa, daily programme, meals, and payment plan",
    descriptionAr: "باقة دينية مع رحلات جوية وفندق في مكة والمدينة وتأشيرة وبرنامج يومي ووجبات وخطة دفع",
    icon: "star",
    sections: [
      { type: "hotel" },
      {
        type: "itinerary",
        data: {
          days: [
            { day: 1, title: "Arrival in Mecca",             desc: "" },
            { day: 2, title: "Tawaf & Sa'i",                 desc: "" },
            { day: 3, title: "Mecca ziyarat",                desc: "" },
            { day: 4, title: "Medina transfer",              desc: "" },
            { day: 5, title: "Visit Al-Masjid an-Nabawi",   desc: "" },
            { day: 6, title: "Medina ziyarat",               desc: "" },
            { day: 7, title: "Departure day",                desc: "" },
          ],
        },
      },
      {
        type: "meals",
        data: { plan: "half_board", notes: "" },
      },
      {
        type: "visa",
        data: { included: "included", content: "" },
      },
      {
        type: "inclusions",
        data: {
          includes: [
            "Return flights",
            "Hotel accommodation",
            "Airport transfers",
            "Umrah visa",
            "Group guide",
            "Breakfast & dinner daily",
          ],
          excludes: ["Personal expenses", "Travel insurance", "Lunch"],
        },
      },
      {
        type: "important_notes",
        data: {
          items: [
            { text: "Passport must be valid for at least 6 months from date of travel" },
            { text: "Women under 45 must be accompanied by a mahram (male guardian)" },
            { text: "Modest dress required at all times in the holy cities" },
            { text: "COVID/health documentation may be required — check before travel" },
          ],
        },
      },
      {
        type: "pricing",
        data: {
          tiers: [
            { label: "Per person (2 pax)",       price: "" },
            { label: "Solo traveller",           price: "" },
            { label: "Child (2–11 years)",       price: "" },
            { label: "Infant (under 2 years)",   price: "" },
          ],
          cancellation: "Free cancellation up to 45 days before departure. 50% refund up to 30 days before.",
        },
      },
    ],
  },

  // ─── City Break ────────────────────────────────────────────────────────────

  {
    id: "city_break",
    label: "City Break",
    labelAr: "إجازة مدينة",
    description: "Short urban getaway with highlights, transfers, departure dates, day-by-day plan, hotel, and gallery",
    descriptionAr: "إجازة حضرية قصيرة مع مميزات ونقل ومواعيد رحلات وبرنامج يومي وفندق ومعرض",
    icon: "map",
    sections: [
      {
        type: "highlights",
        data: {
          items: [
            "City centre hotel",
            "Guided city tour",
            "Airport transfers included",
            "Breakfast daily",
          ],
        },
      },
      {
        type: "itinerary",
        data: {
          days: [
            { day: 1, title: "Arrival & check-in",      desc: "" },
            { day: 2, title: "City highlights tour",    desc: "" },
            { day: 3, title: "Free day & departure",    desc: "" },
          ],
        },
      },
      { type: "hotel" },
      {
        type: "transfers",
        data: {
          description: "",
          items: ["Airport pickup", "Airport drop-off", "Hotel–city centre shuttle"],
        },
      },
      {
        type: "inclusions",
        data: {
          includes: ["Hotel (2 nights)", "Breakfast daily", "Airport transfers", "City tour"],
          excludes: ["Flights", "Lunch & dinner", "Personal expenses"],
        },
      },
      { type: "pricing" },
    ],
  },

  // ─── Cruise ────────────────────────────────────────────────────────────────

  {
    id: "cruise",
    label: "Cruise",
    labelAr: "رحلة بحرية",
    description: "Sea voyage with port itinerary, meal plan, departure dates, on-board inclusions, gallery, and FAQ",
    descriptionAr: "رحلة بحرية مع جدول موانئ وخطة وجبات ومواعيد إبحار وما يشمله الطاقم ومعرض وأسئلة",
    icon: "globe",
    sections: [
      {
        type: "highlights",
        data: {
          items: [
            "All meals on board",
            "Entertainment included",
            "Multiple ports of call",
            "Cabin accommodation",
          ],
        },
      },
      {
        type: "itinerary",
        data: {
          days: [
            { day: 1, title: "Embarkation",      desc: "" },
            { day: 2, title: "At sea",           desc: "" },
            { day: 3, title: "Port of call",     desc: "" },
            { day: 4, title: "Port of call",     desc: "" },
            { day: 5, title: "Disembarkation",   desc: "" },
          ],
        },
      },
      {
        type: "meals",
        data: { plan: "full_board", notes: "" },
      },
      {
        type: "inclusions",
        data: {
          includes: ["Cabin accommodation", "All meals on board", "Entertainment & shows", "Port taxes"],
          excludes: ["Shore excursions", "Drinks packages", "Gratuities", "Travel insurance"],
        },
      },
      { type: "pricing" },
      { type: "faq" },
    ],
  },

  // ─── Family Beach ──────────────────────────────────────────────────────────

  {
    id: "family_beach",
    label: "Family Beach",
    labelAr: "شاطئ عائلي",
    description: "All-inclusive beach resort for families with meal plan, extras, inclusions, and gallery",
    descriptionAr: "منتجع شاطئي شامل للعائلات مع خطة وجبات وإضافات وما تشمله الباقة ومعرض صور",
    icon: "home",
    sections: [
      {
        type: "highlights",
        data: {
          items: [
            "Family suite / connecting rooms",
            "Kids club & children's pool",
            "All-inclusive meals & drinks",
            "Water sports & beach access",
            "24-hour concierge",
          ],
        },
      },
      { type: "hotel" },
      {
        type: "meals",
        data: { plan: "all_inclusive", notes: "" },
      },
      {
        type: "transfers",
        data: {
          description: "Private air-conditioned vehicle from airport to resort and back.",
          items: ["Airport pickup", "Airport drop-off"],
        },
      },
      {
        type: "inclusions",
        data: {
          includes: [
            "Return flights",
            "Resort accommodation",
            "All-inclusive meals & drinks",
            "Kids club access",
            "Airport transfers",
            "Water sports (non-motorised)",
          ],
          excludes: [
            "Motorised water sports",
            "Spa treatments",
            "Travel insurance",
            "Personal shopping",
          ],
        },
      },
      {
        type: "extras",
        data: {
          items: [
            { name: "Private snorkelling trip",    description: "2-hour guided reef snorkelling for the family", price: "" },
            { name: "Couples spa package",         description: "60-minute massage for 2 adults",               price: "" },
            { name: "Deep-sea fishing excursion",  description: "Half-day fishing trip with equipment",          price: "" },
          ],
        },
      },
      {
        type: "pricing",
        data: {
          tiers: [
            { label: "Per adult (based on 2 adults)",    price: "" },
            { label: "Child 2–11 years",                 price: "" },
            { label: "Infant under 2 years",             price: "" },
            { label: "Family package (2 adults + 2 ch)", price: "" },
          ],
          cancellation: "Free cancellation up to 30 days before departure",
        },
      },
    ],
  },

  // ─── Europe Tour ───────────────────────────────────────────────────────────

  {
    id: "europe_tour",
    label: "Europe Tour",
    labelAr: "جولة أوروبية",
    description: "Multi-city European itinerary with Schengen visa assistance, flights, hotel, departure dates, and payment plan",
    descriptionAr: "جولة أوروبية متعددة المدن مع مساعدة تأشيرة شنغن ورحلات جوية وفندق ومواعيد سفر وخطة دفع",
    icon: "globe",
    sections: [
      {
        type: "highlights",
        data: {
          items: [
            "Multiple European capitals",
            "Licensed Arabic-speaking guide",
            "Schengen visa assistance",
            "4-star hotels throughout",
            "Breakfast daily",
            "Luxury coach transport",
          ],
        },
      },
      {
        type: "visa",
        data: { included: "assistance", content: "" },
      },
      {
        type: "itinerary",
        data: {
          days: [
            { day: 1,  title: "Departure & arrival",         desc: "" },
            { day: 2,  title: "City 1 — highlights tour",    desc: "" },
            { day: 3,  title: "City 1 — free day",           desc: "" },
            { day: 4,  title: "Transfer to City 2",          desc: "" },
            { day: 5,  title: "City 2 — highlights tour",    desc: "" },
            { day: 6,  title: "City 2 — free day",           desc: "" },
            { day: 7,  title: "Transfer to City 3",          desc: "" },
            { day: 8,  title: "City 3 — highlights tour",    desc: "" },
            { day: 9,  title: "City 3 — free day",           desc: "" },
            { day: 10, title: "Return departure",            desc: "" },
          ],
        },
      },
      { type: "hotel" },
      {
        type: "meals",
        data: { plan: "breakfast", notes: "" },
      },
      {
        type: "transfers",
        data: {
          description: "All inter-city transfers by luxury coach. Airport transfers included.",
          items: ["Airport pickup", "Airport drop-off", "Inter-city coach transfers"],
        },
      },
      {
        type: "inclusions",
        data: {
          includes: [
            "Return flights",
            "4-star hotel accommodation",
            "Breakfast daily",
            "Schengen visa assistance",
            "Airport & inter-city transfers",
            "Arabic-speaking licensed guide",
            "Entrance fees to major attractions",
          ],
          excludes: [
            "Lunch & dinner",
            "Personal shopping",
            "Travel insurance",
            "Optional excursions",
          ],
        },
      },
      {
        type: "important_notes",
        data: {
          items: [
            { text: "Passport must be valid for at least 6 months beyond your return date" },
            { text: "Schengen visa application requires 3 months of bank statements" },
            { text: "Visa approval is subject to embassy decision — apply 6–8 weeks in advance" },
            { text: "Travel insurance covering the full trip dates is mandatory for Schengen visa" },
          ],
        },
      },
      {
        type: "pricing",
        data: {
          tiers: [
            { label: "Per person (2 pax)",     price: "" },
            { label: "Solo traveller",         price: "" },
            { label: "Child (2–11 years)",     price: "" },
            { label: "Infant (under 2 years)", price: "" },
          ],
          cancellation: "Free cancellation up to 60 days before departure. 50% refund up to 30 days before.",
        },
      },
    ],
  },

  // ─── Day Tour ──────────────────────────────────────────────────────────────

  {
    id: "day_tour",
    label: "Day Tour",
    labelAr: "جولة يومية",
    description: "Single-day excursion with highlights, simple schedule, and inclusions",
    descriptionAr: "جولة ليوم واحد مع أبرز المميزات وبرنامج بسيط وما تشمله",
    icon: "calendar",
    sections: [
      {
        type: "highlights",
        data: {
          items: [
            "Expert local guide",
            "Entrance fees included",
            "Transport provided",
            "Lunch included",
          ],
        },
      },
      {
        type: "inclusions",
        data: {
          includes: ["Guided tour", "Entrance fees", "Transport", "Lunch"],
          excludes: ["Personal expenses", "Tips"],
        },
      },
      { type: "pricing" },
    ],
  },

  // ─── Honeymoon ─────────────────────────────────────────────────────────────

  {
    id: "honeymoon",
    label: "Honeymoon",
    labelAr: "شهر العسل",
    description: "Romantic getaway with overwater villa, couples spa, private dining, and all-inclusive meals",
    descriptionAr: "عطلة رومانسية مع فيلا على الماء وسبا للأزواج وعشاء خاص وإقامة شاملة",
    icon: "star",
    sections: [
      {
        type: "highlights",
        data: {
          items: [
            "Overwater villa accommodation",
            "All-inclusive meals & beverages",
            "Couples spa treatment included",
            "Private beach access",
            "Sunset cruise for two",
          ],
        },
      },
      { type: "hotel" },
      {
        type: "meals",
        data: { plan: "all_inclusive", notes: "" },
      },
      {
        type: "extras",
        data: {
          items: [
            { name: "Couples massage",                    description: "60-minute relaxation massage for two",                      price: "" },
            { name: "Private beach dinner",               description: "Candlelit dinner set up on the beach",                     price: "" },
            { name: "Sunset cruise",                      description: "Private boat for two with refreshments",                   price: "" },
            { name: "Welcome amenities",                  description: "Rose petals, champagne, and a personalised welcome note",  price: "" },
          ],
        },
      },
      {
        type: "inclusions",
        data: {
          includes: [
            "Overwater villa accommodation",
            "All-inclusive meals & beverages",
            "Airport transfers",
            "Welcome amenities (flowers & champagne)",
            "Daily turndown service",
          ],
          excludes: [
            "International flights",
            "Travel insurance",
            "Spa treatments (bookable as extras)",
            "Personal purchases",
          ],
        },
      },
      {
        type: "pricing",
        data: {
          tiers: [
            { label: "Per couple — overwater villa", price: "" },
            { label: "Per couple — beach villa",     price: "" },
          ],
          cancellation: "Free cancellation up to 30 days before arrival",
        },
      },
    ],
  },

  // ─── Multi-day Tour ────────────────────────────────────────────────────────

  {
    id: "multi_day_tour",
    label: "Multi-day Tour",
    labelAr: "جولة متعددة الأيام",
    description: "Guided multi-day itinerary with hotel, breakfast, transfers, and departure dates",
    descriptionAr: "جولة منظمة متعددة الأيام مع فندق ووجبات صباحية ونقل ومواعيد مغادرة",
    icon: "map",
    sections: [
      {
        type: "highlights",
        data: {
          items: [
            "Expert licensed guide throughout",
            "Hotel accommodation included",
            "All airport & inter-city transfers",
            "Breakfast daily",
            "Small group — personalised experience",
          ],
        },
      },
      {
        type: "itinerary",
        data: {
          days: [
            { day: 1, title: "Arrival & welcome",          desc: "" },
            { day: 2, title: "Main highlights — morning",  desc: "" },
            { day: 3, title: "Excursion day",              desc: "" },
            { day: 4, title: "Free day & optional extras", desc: "" },
            { day: 5, title: "Departure transfer",         desc: "" },
          ],
        },
      },
      { type: "hotel" },
      {
        type: "meals",
        data: { plan: "breakfast", notes: "" },
      },
      {
        type: "transfers",
        data: {
          description: "Private transfers between airport, hotel, and all excursion points.",
          items: ["Airport pickup", "Airport drop-off", "Daily tour transfers"],
        },
      },
      {
        type: "inclusions",
        data: {
          includes: [
            "Hotel accommodation",
            "Breakfast daily",
            "Airport & inter-city transfers",
            "Licensed guide throughout",
            "Entrance fees to main attractions",
          ],
          excludes: [
            "International flights",
            "Lunch & dinner",
            "Personal expenses",
            "Optional excursions",
            "Travel insurance",
          ],
        },
      },
      {
        type: "important_notes",
        data: {
          items: [
            { text: "Passport must be valid for at least 6 months from date of travel" },
            { text: "Travel insurance covering the full trip dates is strongly recommended" },
            { text: "Cancellation policy: see pricing section for full terms" },
          ],
        },
      },
      {
        type: "pricing",
        data: {
          tiers: [
            { label: "Per person (based on 2 sharing)", price: "" },
            { label: "Solo traveller supplement",       price: "" },
            { label: "Child (2–11 years)",              price: "" },
          ],
          cancellation: "Free cancellation up to 45 days before departure. 50% refund up to 21 days before.",
        },
      },
    ],
  },

  // ─── Safari ────────────────────────────────────────────────────────────────

  {
    id: "safari",
    label: "Safari",
    labelAr: "سفاري",
    description: "Wildlife adventure with camp or lodge, daily game drives, and a photo gallery",
    descriptionAr: "مغامرة في البرية مع مخيم أو نزل وجولات يومية ومعرض صور",
    icon: "eye",
    sections: [
      {
        type: "highlights",
        data: {
          items: [
            "Daily game drives",
            "Expert ranger guide",
            "Full board accommodation",
            "Small group size",
          ],
        },
      },
      {
        type: "itinerary",
        data: {
          days: [
            { day: 1, title: "Arrival at camp",               desc: "" },
            { day: 2, title: "Morning & evening game drive",  desc: "" },
            { day: 3, title: "Full-day game drive",           desc: "" },
            { day: 4, title: "Departure transfer",            desc: "" },
          ],
        },
      },
      { type: "hotel" },
      {
        type: "meals",
        data: { plan: "full_board", notes: "" },
      },
      {
        type: "inclusions",
        data: {
          includes: ["All game drives", "Full board meals", "Airport transfers", "Park fees"],
          excludes: ["International flights", "Travel insurance", "Gratuities"],
        },
      },
      { type: "pricing" },
    ],
  },
];

export const PRESET_MAP: Record<string, PresetDef> = Object.fromEntries(
  PRESETS.map((p) => [p.id, p])
);
