import type { TPackage, TReview, TAirport, TItineraryDay, TPricingTier, TAgent, TDeparture, TTrekProfile, TScarcity, TPerson, LocalizedString } from "@/components/templates/types";

type SectionData = Record<string, unknown>;
type RawSection = { id: string; type: string; order: number; data: SectionData };

function getSection(sections: RawSection[], ...types: string[]): SectionData | undefined {
  for (const type of types) {
    const found = sections.find((s) => s.type === type);
    if (found) return found.data;
  }
  return undefined;
}

function getAllSections(sections: RawSection[], type: string): SectionData[] {
  return sections.filter((s) => s.type === type).map((s) => s.data);
}

function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function str(v: unknown): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null) {
    const obj = v as Record<string, unknown>;
    return typeof obj.en === "string" ? obj.en : typeof obj.ar === "string" ? obj.ar : "";
  }
  return String(v);
}

/** Resolve a potentially-localized string field from raw Firestore data. */
function resolveLocStr(v: unknown, lang: "en" | "ar"): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null) {
    const o = v as Record<string, unknown>;
    if (typeof o[lang] === "string") return o[lang] as string;
    if (typeof o.en === "string") return o.en;
    if (typeof o.ar === "string") return o.ar;
  }
  return String(v);
}

/**
 * Recursively resolve any LocalizedString values in a section data object
 * to plain strings for the requested language. Applied before sections are
 * passed to template renderers.
 */
function resolveLocalizedFields(data: SectionData, lang: "en" | "ar"): SectionData {
  const out: SectionData = {};
  for (const [key, val] of Object.entries(data)) {
    if (Array.isArray(val)) {
      out[key] = val.map((item) =>
        item && typeof item === "object" && !Array.isArray(item)
          ? resolveLocalizedFields(item as SectionData, lang)
          : item
      );
    } else if (val && typeof val === "object" && "en" in (val as object) && "ar" in (val as object)) {
      out[key] = resolveLocStr(val, lang);
    } else if (val && typeof val === "object" && !Array.isArray(val)) {
      out[key] = resolveLocalizedFields(val as SectionData, lang);
    } else {
      out[key] = val;
    }
  }
  return out;
}

// ─── People / agent extraction ────────────────────────────────────────────────

function extractAgent(sections: RawSection[], raw: TPackage): TAgent | undefined {
  const peopleSec = getSection(sections, "people");
  if (peopleSec && Array.isArray(peopleSec.people)) {
    const first = (peopleSec.people as SectionData[]).find((p) =>
      str(p.role) === "agent" || str(p.role) === "mutawif" || str(p.role) === "curator" || str(p.role) === "trip_lead"
    ) ?? (peopleSec.people as SectionData[])[0];
    if (first) {
      return {
        name:      str(first.name),
        role:      str(first.role),
        avatar:    str(first.photo) || undefined,
        years:     typeof first.years === "number" ? first.years : undefined,
        repliesIn: str(first.repliesIn) || undefined,
      };
    }
  }
  const guideSec = getSection(sections, "guide");
  if (guideSec) {
    return {
      name:   str(guideSec.name),
      role:   "guide",
      avatar: str(guideSec.photo) || undefined,
    };
  }
  return raw.agent ?? undefined;
}

// ─── Trek profile extraction ──────────────────────────────────────────────────

function extractTrekProfile(sections: RawSection[], raw: TPackage): TTrekProfile | undefined {
  const sec = getSection(sections, "trek_profile");
  if (sec) {
    return {
      difficulty:  (sec.difficulty as TTrekProfile["difficulty"]) || undefined,
      maxAltitude: typeof sec.maxAltitude === "number" ? sec.maxAltitude : undefined,
      distanceKm:  typeof sec.distanceKm  === "number" ? sec.distanceKm  : undefined,
      fitnessNote: str(sec.fitnessNote) || undefined,
    };
  }
  if (raw.difficulty || raw.maxAltitude || raw.distanceKm) {
    return {
      difficulty:  raw.difficulty,
      maxAltitude: raw.maxAltitude,
      distanceKm:  raw.distanceKm,
      fitnessNote: raw.fitnessNote,
    };
  }
  return undefined;
}

// ─── Scarcity extraction ──────────────────────────────────────────────────────

function extractScarcity(sections: RawSection[], raw: TPackage): TScarcity | undefined {
  const sec = getSection(sections, "scarcity");
  if (sec) {
    return {
      wasPrice:           str(sec.wasPrice)           || undefined,
      spotsRemaining:     typeof sec.spotsRemaining === "number" ? sec.spotsRemaining : undefined,
      totalSpots:         typeof sec.totalSpots       === "number" ? sec.totalSpots       : undefined,
      firstDepartureDate: str(sec.firstDepartureDate) || undefined,
    };
  }
  if (raw.priceWas || raw.spotsRemaining) {
    return {
      wasPrice:       raw.priceWas,
      spotsRemaining: raw.spotsRemaining,
      totalSpots:     raw.totalSpots,
    };
  }
  return undefined;
}

// ─── People extraction ────────────────────────────────────────────────────────

function extractPeople(sections: RawSection[], raw: TPackage): TPerson[] | undefined {
  const sec = getSection(sections, "people");
  if (sec && Array.isArray(sec.people) && (sec.people as SectionData[]).length > 0) {
    return (sec.people as SectionData[]).map((p, i) => ({
      id:        str(p.id) || `person_${i}`,
      role:      (str(p.role) || "agent") as TPerson["role"],
      name:      str(p.name),
      bio:       str(p.bio)  || undefined,
      photo:     str(p.photo) || undefined,
      languages: strArr(p.languages),
      years:     typeof p.years === "number" ? p.years : undefined,
      repliesIn: str(p.repliesIn) || undefined,
    }));
  }
  const guideSec = getSection(sections, "guide");
  if (guideSec) {
    return [{
      id: "guide_legacy",
      role: "guide",
      name: str(guideSec.name),
      bio:  str(guideSec.bio)   || undefined,
      photo: str(guideSec.photo) || undefined,
      languages: strArr(guideSec.languages),
    }];
  }
  if (raw.agent?.name) {
    return [{
      id: "agent_legacy",
      role: (raw.agent.role || "agent") as TPerson["role"],
      name: raw.agent.name,
      bio: undefined,
      photo: raw.agent.avatar || undefined,
      years: raw.agent.years,
      repliesIn: raw.agent.repliesIn,
    }];
  }
  return undefined;
}

// ─── Departures extraction ────────────────────────────────────────────────────

function extractDepartures(sections: RawSection[], raw: TPackage): TDeparture[] | undefined {
  // v2 departures section
  const depSec = getSection(sections, "departures");
  if (depSec && Array.isArray(depSec.entries) && (depSec.entries as SectionData[]).length > 0) {
    return (depSec.entries as SectionData[]).map((e) => ({
      date:  str(e.date),
      spots: typeof e.spots === "number" ? e.spots : Number(e.spots) || 0,
      price: str(e.price) || undefined,
      deal:  e.deal === true || e.deal === "true" || undefined,
    })).filter((e) => e.date);
  }
  // legacy departure_dates section
  const ddSec = getSection(sections, "departure_dates");
  if (ddSec && Array.isArray(ddSec.dates)) {
    return (ddSec.dates as SectionData[]).map((d) => ({
      date:  str(d.date),
      spots: typeof d.spots === "number" ? d.spots : Number(d.spots) || 0,
      price: str(d.price) || undefined,
    })).filter((d) => d.date);
  }
  return raw.departures?.length ? raw.departures : undefined;
}

// ─── Airport / flights extraction ─────────────────────────────────────────────

function extractAirports(sections: RawSection[], raw: TPackage): TAirport[] | undefined {
  // v2 departures → airports (legacy compat shape)
  const depSec = getSection(sections, "departures");
  if (depSec && Array.isArray(depSec.entries)) {
    const withOrigin = (depSec.entries as SectionData[]).filter((e) => str(e.origin));
    if (withOrigin.length > 0) {
      return withOrigin.map((e) => ({
        name:            str(e.origin),
        price:           str(e.price),
        date:            str(e.date) || undefined,
        arrivingAirport: str(e.arrivingAirport) || undefined,
        flyingTime:      str(e.flyingTime) || undefined,
        arrivingTime:    str(e.arrivingTime) || undefined,
      }));
    }
  }
  // legacy flights section
  const flightsSec = getSection(sections, "flights");
  if (flightsSec && Array.isArray(flightsSec.departures)) {
    return (flightsSec.departures as SectionData[]).map((d) => ({
      name:            str(d.name),
      price:           str(d.price),
      date:            str(d.date) || undefined,
      arrivingAirport: str(d.arrivingAirport) || undefined,
      flyingTime:      str(d.flyingTime) || undefined,
      arrivingTime:    str(d.arrivingTime) || undefined,
    }));
  }
  return raw.airports?.length ? raw.airports : undefined;
}

/**
 * Hydrates a TPackage from its sections[] array and resolves any LocalizedString
 * fields to plain strings for the requested language.
 *
 * Old packages without sections[] are returned with localized strings resolved.
 * New v2 packages have sections[] that take priority over stale flat fields.
 */
export function normalizePkg(pkg: TPackage, lang?: "en" | "ar"): TPackage {
  const resolvedLang = lang ?? ((pkg.primaryLanguage ?? (pkg as any).language) === "ar" ? "ar" : "en");

  // Resolve core localized fields (v2 packages store {en, ar} objects)
  const rawTitle = (pkg as any).title;
  const rawDescription = (pkg as any).description;

  const resolvedTitle = resolveLocStr(rawTitle, resolvedLang) || undefined;
  const resolvedDescription = resolveLocStr(rawDescription, resolvedLang) || "";

  const normalized: TPackage = {
    ...pkg,
    title: resolvedTitle,
    description: resolvedDescription,
    primaryLanguage: resolvedLang,
  };

  if (!Array.isArray(pkg.sections) || pkg.sections.length === 0) {
    // Old flat-field packages — just resolve localized strings and return
    normalized.trekProfile = extractTrekProfile([], pkg);
    normalized.scarcity    = extractScarcity([], pkg);
    normalized.people      = extractPeople([], pkg);
    return normalized;
  }

  const sections = pkg.sections as RawSection[];

  // Resolve localized fields in all section data objects
  normalized.sections = sections.map((s) => ({
    ...s,
    data: resolveLocalizedFields(s.data, resolvedLang),
  }));

  // Hydrate flat fields from sections (for template backward compat)

  const inclusions = getSection(sections, "inclusions");
  if (inclusions) {
    normalized.includes = strArr(inclusions.includes);
    normalized.excludes = strArr(inclusions.excludes);
  }

  const airports = extractAirports(sections, pkg);
  if (airports) normalized.airports = airports;

  if (Array.isArray((getSection(sections, "itinerary") ?? {})?.days)) {
    const itinerarySec = getSection(sections, "itinerary")!;
    normalized.itinerary = (itinerarySec.days as SectionData[]).map((d) => ({
      day:     typeof d.day === "number" ? d.day : Number(d.day) || 0,
      title:   str(d.title),
      desc:    str(d.desc),
      chapter: str(d.chapter) || undefined,
      img:     str(d.img) || undefined,
      alt:     typeof d.alt === "number" ? d.alt : undefined,
      km:      typeof d.km === "number"  ? d.km  : undefined,
    })) as TItineraryDay[];
  }

  // pricing — v2 pricing section includes payment plan fields
  const pricingSec = getSection(sections, "pricing");
  if (pricingSec) {
    if (Array.isArray(pricingSec.tiers)) {
      normalized.pricingTiers = (pricingSec.tiers as SectionData[]).map((t) => ({
        label: resolveLocStr(t.label, resolvedLang),
        price: str(t.price),
      })) as TPricingTier[];
    }
    if (pricingSec.cancellation !== undefined) {
      normalized.cancellation = str(pricingSec.cancellation);
    }
  } else {
    // legacy payment_plan → fold into pricing compat
    const ppSec = getSection(sections, "payment_plan");
    if (ppSec && !normalized.cancellation) {
      normalized.cancellation = str(ppSec.content) || undefined;
    }
  }

  // hotel (v2: multiple instances possible)
  const hotelSections = getAllSections(sections, "hotel");
  if (hotelSections.length > 0) {
    normalized.hotelDescription = str(hotelSections[0].description);
  }

  // media (v2) → flat images + videoUrl
  const mediaSec = getSection(sections, "media");
  if (mediaSec) {
    if (Array.isArray(mediaSec.images)) normalized.images = strArr(mediaSec.images);
    if (mediaSec.videoUrl) normalized.videoUrl = str(mediaSec.videoUrl);
  } else {
    // legacy gallery / video
    const gallerySec = getSection(sections, "gallery");
    if (gallerySec && Array.isArray(gallerySec.images)) {
      normalized.images = strArr(gallerySec.images);
    }
    const videoSec = getSection(sections, "video");
    if (videoSec) normalized.videoUrl = str(videoSec.videoUrl);
  }

  // reviews — merge agency-authored section reviews with customer-submitted flat reviews.
  // Critical: an empty section (reviews: []) must NOT overwrite pkg.reviews that holds
  // reviews submitted via the /api/submit-review endpoint.
  const reviewsSec = getSection(sections, "reviews");
  const secReviewItems = (reviewsSec && Array.isArray(reviewsSec.reviews))
    ? (reviewsSec.reviews as SectionData[])
    : [];
  if (secReviewItems.length > 0) {
    const sectionReviews = secReviewItems.map((r) => ({
      id:        str(r.id) || `r_${Math.random().toString(36).slice(2)}`,
      name:      str(r.name),
      text:      str(r.text),
      rating:    typeof r.rating === "number" ? r.rating : Number(r.rating) || 5,
      avatarUrl: str(r.avatarUrl) || undefined,
      country:   str(r.country) || undefined,
      partyType: str(r.partyType) || undefined,
    })) as TReview[];
    // Append customer-submitted reviews (flat field) not already in the section list
    const sectionIds = new Set(sectionReviews.map((r) => r.id));
    const flatReviews = Array.isArray(pkg.reviews)
      ? (pkg.reviews as TReview[]).filter((r) => r.id && !sectionIds.has(r.id))
      : [];
    normalized.reviews = [...sectionReviews, ...flatReviews];
  }
  // When secReviewItems is empty, pkg.reviews from the initial spread is preserved.

  // Departures (v2) → departures flat field
  const departures = extractDepartures(sections, pkg);
  if (departures) normalized.departures = departures;

  // Attributes
  normalized.agent      = extractAgent(sections, pkg) ?? pkg.agent;
  normalized.trekProfile = extractTrekProfile(sections, pkg);
  normalized.scarcity   = extractScarcity(sections, pkg);
  normalized.people     = extractPeople(sections, pkg);

  // Hydrate legacy flat trek fields for templates that read them directly
  if (normalized.trekProfile) {
    normalized.difficulty  = normalized.trekProfile.difficulty;
    normalized.maxAltitude = normalized.trekProfile.maxAltitude;
    normalized.distanceKm  = normalized.trekProfile.distanceKm;
    normalized.fitnessNote = normalized.trekProfile.fitnessNote;
  }

  // Hydrate legacy flat scarcity fields for templates that read them directly
  if (normalized.scarcity) {
    normalized.priceWas      = normalized.scarcity.wasPrice;
    normalized.spotsRemaining = normalized.scarcity.spotsRemaining;
    normalized.totalSpots    = normalized.scarcity.totalSpots;
  }

  // Resolve contacts → flat whatsapp / messenger for template compat
  if (Array.isArray((pkg as any).contacts)) {
    const contacts = (pkg as any).contacts as Array<{ type: string; value: string }>;
    const wa = contacts.find((c) => c.type === "whatsapp");
    const ms = contacts.find((c) => c.type === "messenger");
    if (wa && !normalized.whatsapp) normalized.whatsapp = wa.value;
    if (ms && !normalized.messenger) normalized.messenger = ms.value;
  }

  // Strip trailing "per person" labels that some agents paste into the price field.
  if (normalized.price) {
    normalized.price = normalized.price.replace(/\s+per\s+person\b.*/i, "").trim();
  }

  // Derive `saving` at render from wasPrice − price (NEVER stored).
  if (!normalized.saving && normalized.priceWas && normalized.price) {
    const parse = (s: string) => parseFloat(s.replace(/[^0-9.]/g, ""));
    const was  = parse(normalized.priceWas);
    const curr = parse(normalized.price);
    if (!isNaN(was) && !isNaN(curr) && was > curr) {
      const diff = Math.round(was - curr);
      // Keep the currency symbol from the price string if present
      const sym = normalized.price.match(/[€$£¥₹]/)?.[0] ?? "";
      normalized.saving = `${sym}${diff.toLocaleString()}`;
    }
  }

  return normalized;
}
