// Maps a Firestore package document + user/agency document into the flat
// ExportData shape consumed by the render components. All fields degrade
// gracefully — never returns "undefined" visible in generated files.

import { guessDestinationKind } from "@/lib/destination";

export type ExportData = {
  destinationKind: string;
  tag:        string;
  destination:string;
  title:      string;
  subtitle:   string;
  price:      string;
  was?:       string;
  saving?:    string;
  perPerson:  string;
  nights:     number;
  dates?:     string;
  agency:     string;
  agencyTag:  string;
  url:        string;
  whatsapp:   string;
  highlights: string[];
  overview:   string;
  itinerary:  { d: string; t: string; b: string }[];
  includes:   string[];
  excludes:   string[];
  coverImageUrl?: string;
};

function parsePriceNum(s: string): number {
  return parseFloat(s.replace(/[^0-9.]/g, "").replace(/,/g, "")) || 0;
}

function deriveSaving(price: string, was: string): string | undefined {
  const p = parsePriceNum(price);
  const w = parsePriceNum(was);
  if (!p || !w || w <= p) return undefined;
  const diff = Math.round(w - p);
  // Currency symbol/code: everything not a digit, comma, period, or space
  const currency = price.replace(/[0-9,. ]/g, "").trim();
  if (currency) return `Save ${diff.toLocaleString()} ${currency}`.trim();
  return `Save ${diff.toLocaleString()}`;
}

// Resolve a LocStr (plain string or { en, ar }) for a given lang
function resolveStr(v: unknown, lang: "en" | "ar"): string {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object" && v !== null) {
    const o = v as Record<string, string>;
    return o[lang] || o.en || o.ar || "";
  }
  return "";
}

function findSection<T = Record<string, unknown>>(
  sections: Array<{ type: string; order: number; data: unknown }> | undefined,
  type: string,
): T | null {
  return (sections?.find((s) => s.type === type)?.data as T) ?? null;
}

// Tag by destination kind
const DESTINATION_TAGS: Record<string, { en: string; ar: string }> = {
  umrah:      { en: "Umrah",      ar: "عمرة" },
  malta:      { en: "Cultural",   ar: "ثقافية" },
  maldives:   { en: "Beach",      ar: "شاطئية" },
  bali:       { en: "Beach",      ar: "شاطئية" },
  sardinia:   { en: "Coastal",    ar: "ساحلية" },
  cappadocia: { en: "Adventure",  ar: "مغامرة" },
  paris:      { en: "City Break", ar: "سياحة مدنية" },
  rome:       { en: "Cultural",   ar: "ثقافية" },
  istanbul:   { en: "City Break", ar: "سياحة مدنية" },
  dubai:      { en: "Luxury",     ar: "فاخرة" },
  marrakech:  { en: "Cultural",   ar: "ثقافية" },
  hurghada:   { en: "Beach",      ar: "شاطئية" },
  default:    { en: "Travel",     ar: "سفر" },
};

function pkgUrl(agencySlug: string, pkgId: string): string {
  const env = process.env.NEXT_PUBLIC_ENV;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "";
  if (env === "production") {
    return `https://${agencySlug}.packmetrix.com/${pkgId}`;
  }
  // Staging/preview with a real non-localhost base URL
  if (appUrl && !appUrl.includes("localhost")) {
    return `${appUrl}/${agencySlug}/${pkgId}`;
  }
  // Dev/localhost: still emit a production URL so exported QR codes work when scanned
  return `https://${agencySlug}.packmetrix.com/${pkgId}`;
}

export function buildExportData(
  pkg: Record<string, unknown>,
  user: Record<string, unknown>,
  lang: "en" | "ar",
): ExportData {
  const isAr = lang === "ar";
  const sections = (pkg.sections as Array<{ type: string; order: number; data: unknown }>) ?? [];

  const destination = (pkg.destination as string) || "";
  const destinationKind = guessDestinationKind(destination);
  const tagMap = DESTINATION_TAGS[destinationKind] ?? DESTINATION_TAGS.default;
  const tag = isAr ? tagMap.ar : tagMap.en;

  const title    = resolveStr(pkg.title, lang) || destination;
  const subtitle = resolveStr(pkg.description, lang);
  const price    = (pkg.price as string) || "";
  const nights   = Number(pkg.nights) || 0;

  // Was-price from scarcity section
  const scarcity = findSection<{ wasPrice?: string; firstDepartureDate?: string }>(sections, "scarcity");
  const wasPrice = scarcity?.wasPrice || "";
  const saving   = wasPrice ? deriveSaving(price, wasPrice) : undefined;

  // Departure date from departures section
  const departures = findSection<{ entries?: Array<{ date?: string; returnDate?: string }> }>(sections, "departures");
  const firstDate  = departures?.entries?.[0]?.date || scarcity?.firstDepartureDate || "";

  // Inclusions (fetched before highlights so we can use as fallback)
  const incl = findSection<{ includes?: string[]; excludes?: string[] }>(sections, "inclusions");
  const includes = incl?.includes || [];
  const excludes = incl?.excludes || [];

  // Highlights — fall back to first 3 inclusions if section is empty
  const hl = findSection<{ items?: string[] }>(sections, "highlights");
  const hlItems = (hl?.items || []).filter(Boolean).slice(0, 3);
  const highlights = hlItems.length > 0 ? hlItems : includes.slice(0, 3);

  // Overview — package description falls back to first highlight
  const overview = subtitle || highlights[0] || "";

  // Itinerary
  const itin = findSection<{ days?: Array<{ day?: number; title?: string; desc?: string }> }>(sections, "itinerary");
  const itinerary = (itin?.days || []).slice(0, 30).map((d) => ({
    d: isAr ? `اليوم ${d.day ?? ""}` : `Day ${d.day ?? ""}`,
    t: d.title || "",
    b: d.desc  || "",
  }));

  // Per-person label from pricing tiers
  const pricing = findSection<{ tiers?: Array<{ label?: string; price?: string }> }>(sections, "pricing");
  const tierLabel = pricing?.tiers?.[0]?.label || "";
  const perPerson = tierLabel || (isAr ? "للفرد" : "per person");

  // Agency
  const agencySlug = (pkg.agencySlug as string) || (user.agencySlug as string) || "";
  const agencyName = (user.name as string) || "";
  const agencyTag  = (user.tagline as string) || "";

  // Contact — prefer contacts[] array, fall back to legacy whatsapp field
  const contacts = (pkg.contacts as Array<{ type: string; value: string }>) || [];
  const waContact = contacts.find((c) => c.type === "whatsapp");
  const whatsapp  = waContact?.value || (pkg.whatsapp as string) || "";

  // Package URL
  const url = pkgUrl(agencySlug, pkg.id as string);

  return {
    destinationKind,
    tag,
    destination,
    title,
    subtitle,
    price,
    was:     wasPrice || undefined,
    saving,
    perPerson,
    nights,
    dates:   firstDate || undefined,
    agency:  agencyName,
    agencyTag,
    url,
    whatsapp,
    highlights,
    overview,
    itinerary,
    includes,
    excludes,
    coverImageUrl: (pkg.coverImage as string) || undefined,
  };
}
