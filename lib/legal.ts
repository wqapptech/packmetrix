// Legal/utility document model — AGENCY-AUTHORED, Packmetrix only renders.
// Stored on users/{uid}.legal.{terms|privacy|cookies}. Every author-facing text
// field is bilingual ({en, ar}). A document "exists" only when the agency has
// authored at least one section — unauthored docs render an honest empty state
// and are hidden from the footer legal row. Nothing is fabricated.

import { pick, type Loc } from "./homepage";

export type LegalType = "terms" | "privacy" | "cookies";
export const LEGAL_TYPES: LegalType[] = ["terms", "privacy", "cookies"];

export type LegalSection = {
  id?: string;        // anchor; derived from index when absent
  title: Loc;
  body: Loc;          // paragraphs separated by blank lines
  bullets?: Loc[];
};

export type LegalDoc = {
  updatedAt?: string; // ISO date or display string
  title?: Loc;        // optional override; defaults to the standard doc name
  sections: LegalSection[];
};

// Standard document names (not fabricated agency facts — just the legal labels).
export const DEFAULT_LEGAL_TITLE: Record<LegalType, Loc> = {
  terms: { en: "Terms & Conditions", ar: "الشروط والأحكام" },
  privacy: { en: "Privacy Policy", ar: "سياسة الخصوصية" },
  cookies: { en: "Cookie Policy", ar: "سياسة ملفات الارتباط" },
};

function rawLegal(agencyDoc: Record<string, unknown> | null | undefined, type: LegalType): unknown {
  const legal = agencyDoc?.legal as Record<string, unknown> | undefined;
  return legal?.[type];
}

/** A doc exists only when it has ≥1 authored section with a title. */
export function legalDocExists(agencyDoc: Record<string, unknown> | null | undefined, type: LegalType): boolean {
  const raw = rawLegal(agencyDoc, type) as LegalDoc | undefined;
  const secs = raw?.sections;
  return Array.isArray(secs) && secs.some((s) => s && (s.title?.en || s.title?.ar));
}

/** Read + normalize an authored doc, or null if unauthored. */
export function readLegalDoc(agencyDoc: Record<string, unknown> | null | undefined, type: LegalType): LegalDoc | null {
  if (!legalDocExists(agencyDoc, type)) return null;
  const raw = rawLegal(agencyDoc, type) as LegalDoc;
  const sections = (raw.sections || [])
    .filter((s) => s && (s.title?.en || s.title?.ar))
    .map((s, i) => ({
      id: s.id || `s-${i + 1}`,
      title: s.title,
      body: s.body || { en: "", ar: "" },
      bullets: Array.isArray(s.bullets) ? s.bullets : undefined,
    }));
  return { updatedAt: raw.updatedAt, title: raw.title, sections };
}

/** The docs an agency has actually published — for the footer legal row. */
export function availableLegalDocs(agencyDoc: Record<string, unknown> | null | undefined): { type: LegalType; title: Loc }[] {
  return LEGAL_TYPES.filter((t) => legalDocExists(agencyDoc, t)).map((t) => {
    const raw = rawLegal(agencyDoc, t) as LegalDoc;
    return { type: t, title: raw.title || DEFAULT_LEGAL_TITLE[t] };
  });
}

// ── Date formatting with Arabic-Indic numerals ──────────────────────────────

const AR_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const toArabicDigits = (s: string) => s.replace(/[0-9]/g, (d) => AR_DIGITS[Number(d)]);
const MONTHS = {
  en: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  ar: ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"],
};

/** "2026-06-12" → "12 June 2026" / "١٢ يونيو ٢٠٢٦". Falls back to the raw value. */
export function formatLegalDate(value: string | undefined, lang: "en" | "ar"): string {
  if (!value) return "";
  const mIso = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (mIso) {
    const [, y, mo, d] = mIso;
    const month = MONTHS[lang][Number(mo) - 1] || mo;
    const out = `${Number(d)} ${month} ${y}`;
    return lang === "ar" ? toArabicDigits(out) : out;
  }
  return lang === "ar" ? toArabicDigits(value) : value;
}

export function legalHref(basePath: string, type: LegalType): string {
  return `${basePath}/legal/${type}`;
}

/** Build footer legal links (only existing docs). */
export function legalLinksFor(
  agencyDoc: Record<string, unknown> | null | undefined,
  basePath: string,
  lang: "en" | "ar"
): { label: string; href: string }[] {
  return availableLegalDocs(agencyDoc).map((d) => ({
    label: pick(d.title, lang),
    href: legalHref(basePath, d.type),
  }));
}
