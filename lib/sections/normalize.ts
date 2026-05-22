import type { TPackage, TReview, TAirport, TItineraryDay, TPricingTier } from "@/components/templates/types";

type SectionData = Record<string, unknown>;
type RawSection = { id: string; type: string; order: number; data: SectionData };

function getSection(sections: RawSection[], type: string): SectionData | undefined {
  return sections.find((s) => s.type === type)?.data;
}

function strArr(v: unknown): string[] {
  return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
}

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

/**
 * Hydrates the flat TPackage fields from the sections[] array.
 * Sections take priority over stale flat fields for new-format packages.
 * Old packages without sections[] are returned unchanged.
 */
export function normalizePkg(pkg: TPackage): TPackage {
  if (!Array.isArray(pkg.sections) || pkg.sections.length === 0) return pkg;

  const sections = pkg.sections as RawSection[];

  const inclusions  = getSection(sections, "inclusions");
  const flights     = getSection(sections, "flights");
  const itinerary   = getSection(sections, "itinerary");
  const pricing     = getSection(sections, "pricing");
  const hotel       = getSection(sections, "hotel");
  const gallery     = getSection(sections, "gallery");
  const video       = getSection(sections, "video");
  const reviewsSec  = getSection(sections, "reviews");

  const normalized: TPackage = { ...pkg };

  if (inclusions) {
    normalized.includes = strArr(inclusions.includes);
    normalized.excludes = strArr(inclusions.excludes);
  }

  if (flights && Array.isArray(flights.departures)) {
    normalized.airports = (flights.departures as SectionData[]).map((d) => ({
      name:            str(d.name),
      price:           str(d.price),
      date:            str(d.date),
      arrivingAirport: str(d.arrivingAirport),
      flyingTime:      str(d.flyingTime),
      arrivingTime:    str(d.arrivingTime),
    })) as TAirport[];
  }

  if (itinerary && Array.isArray(itinerary.days)) {
    normalized.itinerary = (itinerary.days as SectionData[]).map((d) => ({
      day:   typeof d.day === "number" ? d.day : Number(d.day) || 0,
      title: str(d.title),
      desc:  str(d.desc),
    })) as TItineraryDay[];
  }

  if (pricing) {
    if (Array.isArray(pricing.tiers)) {
      normalized.pricingTiers = (pricing.tiers as SectionData[]).map((t) => ({
        label: str(t.label),
        price: str(t.price),
      })) as TPricingTier[];
    }
    if (pricing.cancellation !== undefined) {
      normalized.cancellation = str(pricing.cancellation);
    }
  }

  if (hotel) {
    normalized.hotelDescription = str(hotel.description);
  }

  if (gallery && Array.isArray(gallery.images)) {
    normalized.images = strArr(gallery.images);
  }

  if (video) {
    normalized.videoUrl = str(video.videoUrl);
  }

  if (reviewsSec && Array.isArray(reviewsSec.reviews)) {
    normalized.reviews = (reviewsSec.reviews as SectionData[]).map((r) => ({
      id:        str(r.id) || `r_${Math.random().toString(36).slice(2)}`,
      name:      str(r.name),
      text:      str(r.text),
      rating:    typeof r.rating === "number" ? r.rating : Number(r.rating) || 5,
      avatarUrl: str(r.avatarUrl) || undefined,
    })) as TReview[];
  }

  return normalized;
}
