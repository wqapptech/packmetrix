// Canonical agency brand object — read by site chrome, storefront, and templates.
//
// This is the ONE source of truth for an agency's identity. AgencyProfile
// (storefront) and TAgency (templates) derive from it: they may expose a subset
// of these fields, but the field names and meanings must match here.
//
// deriveBrand() turns a single brand hex into the CSS custom properties the
// chrome + storefront consume (--brand / --brand-on / --accent / contrast …).

// ── Socials (Gulf-first set) ────────────────────────────────────────────────

export type AgencySocials = {
  instagram?: string;
  snapchat?: string;
  tiktok?: string;
  facebook?: string;
  youtube?: string;
  x?: string;
};

// ── Canonical brand object ──────────────────────────────────────────────────

export interface AgencyBrand {
  name: string;
  tagline?: string;
  logoUrl?: string;
  brandColor: string;
  accentColor?: string;
  displayFont: string;
  bodyFont: string;
  whatsapp?: string;
  phone?: string;
  email?: string;
  socials: AgencySocials;
}

// ── Curated font stacks ──────────────────────────────────────────────────────
// Every family below is loaded by next/font in app/layout.tsx — a pairing
// NEVER falls back to a system font. Latin display = Instrument Serif or
// Newsreader; Latin body = Inter Tight or Inter; Arabic display = Noto Naskh;
// Arabic body = IBM Plex Sans Arabic or Tajawal. Templates keep their own type.

const F = {
  instrument: 'var(--font-instrument-serif), "Instrument Serif", Georgia, "Times New Roman", serif',
  newsreader: 'var(--font-newsreader), "Newsreader", Georgia, "Times New Roman", serif',
  interTight: 'var(--font-inter-tight), "Inter Tight", Inter, system-ui, -apple-system, sans-serif',
  inter: 'var(--font-inter), "Inter", system-ui, -apple-system, sans-serif',
  notoNaskh: 'var(--font-noto-naskh-arabic), "Noto Naskh Arabic", "Instrument Serif", Georgia, serif',
  ibmArabic: 'var(--font-ibm-plex-sans-arabic), "IBM Plex Sans Arabic", system-ui, sans-serif',
  tajawal: 'var(--font-tajawal), "Tajawal", "IBM Plex Sans Arabic", system-ui, sans-serif',
} as const;

export type FontPairingId = "editorial" | "literary" | "modern" | "contemporary";

type FontSet = { display: string; body: string };

/**
 * The curated pairings shown in the brand editor. `editorial` is the default
 * and resolves to the exact Warm-Editorial stacks the surfaces shipped with, so
 * an agency that never picks a pairing renders pixel-identical.
 * `previewDisplay` / `previewBody` are short human labels for the editor cards.
 */
export const FONT_PAIRINGS: Record<
  FontPairingId,
  {
    en: FontSet; ar: FontSet;
    previewDisplay: string; previewBody: string; previewDisplayAr: string; previewBodyAr: string;
    label: string; labelAr: string;
    note: { en: string; ar: string };
  }
> = {
  editorial: {
    en: { display: F.instrument, body: F.interTight },
    ar: { display: F.notoNaskh, body: F.ibmArabic },
    previewDisplay: "Instrument Serif", previewBody: "Inter Tight",
    previewDisplayAr: "نوتو نسخ", previewBodyAr: "IBM Plex Arabic",
    label: "Editorial", labelAr: "أنيق",
    note: { en: "Warm, literary — like a printed travel journal.", ar: "دافئ وأدبي — كأنه يوميات سفر مطبوعة." },
  },
  literary: {
    en: { display: F.newsreader, body: F.inter },
    ar: { display: F.notoNaskh, body: F.ibmArabic },
    previewDisplay: "Newsreader", previewBody: "Inter",
    previewDisplayAr: "نوتو نسخ", previewBodyAr: "IBM Plex Arabic",
    label: "Literary", labelAr: "تحريري",
    note: { en: "Editorial headlines with a crisp, readable body.", ar: "عناوين تحريرية مع متن واضح القراءة." },
  },
  modern: {
    en: { display: F.instrument, body: F.inter },
    ar: { display: F.notoNaskh, body: F.tajawal },
    previewDisplay: "Instrument Serif", previewBody: "Inter",
    previewDisplayAr: "نوتو نسخ", previewBodyAr: "Tajawal",
    label: "Modern", labelAr: "حديث",
    note: { en: "Refined serif headers, clean modern body.", ar: "عناوين رشيقة مع متن حديث نظيف." },
  },
  contemporary: {
    en: { display: F.newsreader, body: F.interTight },
    ar: { display: F.notoNaskh, body: F.tajawal },
    previewDisplay: "Newsreader", previewBody: "Inter Tight",
    previewDisplayAr: "نوتو نسخ", previewBodyAr: "Tajawal",
    label: "Contemporary", labelAr: "عصري",
    note: { en: "Crisp editorial with a contemporary edge.", ar: "تحريري واضح بلمسة عصرية." },
  },
};

// ── Curated colour palettes for the brand editor (fast-path swatches) ────────
// Swatches are a convenience, NOT a constraint — the hex input remains the
// escape hatch for any colour. Mirrors the design's BRAND/ACCENT_SWATCHES.
export const BRAND_SWATCHES = ["#1d4e72", "#7a2230", "#1f5d3f", "#3a3a4a", "#5a4a8a", "#b0843a"] as const;
export const ACCENT_SWATCHES = ["#b08a3e", "#c98a3e", "#4d8a5e", "#3a78c4", "#c0533a", "#8a6bb0"] as const;

export const DEFAULT_FONT_PAIRING: FontPairingId = "editorial";

/** Validate an unknown value into a known pairing id, defaulting to editorial. */
export function toFontPairing(v: unknown): FontPairingId {
  return typeof v === "string" && v in FONT_PAIRINGS ? (v as FontPairingId) : DEFAULT_FONT_PAIRING;
}

/** Resolve a pairing id + language into its {display, body} family strings. */
export function fontsForPairing(id: FontPairingId, lang: "en" | "ar"): FontSet {
  return FONT_PAIRINGS[toFontPairing(id)][lang === "ar" ? "ar" : "en"];
}

// Back-compat alias for the old constant name (used by tests / legacy imports).
export const WARM_EDITORIAL_FONTS = {
  en: FONT_PAIRINGS.editorial.en,
  ar: FONT_PAIRINGS.editorial.ar,
} as const;

export const DEFAULT_BRAND_COLOR = "#1d4e72";

// ── Brand-color derivation ──────────────────────────────────────────────────

function _rgb(hex: string): [number, number, number] {
  const h = (hex || "").replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const out = [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16));
  return out.map((n) => (Number.isFinite(n) ? n : 0)) as [number, number, number];
}
function _hex([r, g, b]: [number, number, number]): string {
  return (
    "#" +
    [r, g, b]
      .map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0"))
      .join("")
  );
}
function _lum([r, g, b]: [number, number, number]): number {
  const a = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function _contrast(l1: number, l2: number): number {
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

/** Pick #fff or near-black ink for best contrast on the given color. */
function onColor(rgb: [number, number, number]): string {
  const L = _lum(rgb);
  const ink: [number, number, number] = [27, 24, 19]; // #1b1813
  return _contrast(L, 1) >= _contrast(L, _lum(ink)) ? "#ffffff" : "#1b1813";
}

/** Darken a color until it reaches ≥4.5:1 against paper (readable as text). */
function readableOnPaper(rgb: [number, number, number]): string {
  const paperL = _lum(_rgb("#faf5e8"));
  let t: [number, number, number] = [...rgb] as [number, number, number];
  let guard = 0;
  while (_contrast(_lum(t), paperL) < 4.5 && guard++ < 20) {
    t = t.map((v) => v * 0.86) as [number, number, number];
  }
  return _hex(t);
}

/**
 * Map a brand color (and optional accent) onto the storefront/chrome CSS vars.
 *
 *   --brand        the brand color, as-is (surfaces: header mark, CTA, footer)
 *   --brand-on     contrast text/icon color ON --brand (#fff or ink)
 *   --brand-text   brand darkened to be readable as text on paper (≥4.5:1)
 *   --brand-deep   brand × 0.82 (shadows, borders, contact band)
 *   --brand-tint   brand lightened 86% (tinted backgrounds)
 *   --accent       accentColor if set, else falls back to --brand
 *   --accent-on    contrast text/icon color ON --accent
 */
export function deriveBrand(hex: string, accentHex?: string): Record<string, string> {
  const c = _rgb(hex || DEFAULT_BRAND_COLOR);
  const accent = _rgb(accentHex || hex || DEFAULT_BRAND_COLOR);
  return {
    "--brand": hex || DEFAULT_BRAND_COLOR,
    "--brand-on": onColor(c),
    "--brand-text": readableOnPaper(c),
    "--brand-deep": _hex(c.map((v) => v * 0.82) as [number, number, number]),
    "--brand-tint": _hex(c.map((v) => v + (255 - v) * 0.86) as [number, number, number]),
    "--accent": accentHex || hex || DEFAULT_BRAND_COLOR,
    "--accent-on": onColor(accent),
  };
}

// ── Firestore users/{uid} → AgencyBrand ─────────────────────────────────────

/**
 * Build the canonical brand object from a users/{uid} document.
 * Accepts socials either nested (`socials.instagram`) or flat (`instagram`).
 * Fonts resolve from the agency's chosen `fontPairing` id (default: editorial).
 */
export function brandFromUser(
  u: Record<string, unknown>,
  lang: "en" | "ar" = "en"
): AgencyBrand {
  const s = (u.socials as Record<string, unknown> | undefined) || {};
  const social = (k: string) => String((s[k] ?? u[k]) || "") || undefined;
  const fonts = fontsForPairing(toFontPairing(u.fontPairing), lang);
  // Optional Arabic overrides — fall back to the base (English) field when absent.
  const ar = (base: unknown, arVal: unknown) =>
    lang === "ar" && String(arVal || "").trim() ? String(arVal) : String(base || "");
  return {
    name: ar(u.name || u.email || "Travel Agency", u.nameAr),
    tagline: (ar(u.tagline, u.taglineAr)) || undefined,
    logoUrl: String(u.logoUrl || "") || undefined,
    brandColor: String(u.brandColor || "") || DEFAULT_BRAND_COLOR,
    accentColor: String(u.accentColor || "") || undefined,
    displayFont: fonts.display,
    bodyFont: fonts.body,
    whatsapp: String(u.whatsapp || "") || undefined,
    phone: String(u.phone || "") || undefined,
    email: String(u.email || "") || undefined,
    socials: {
      instagram: social("instagram"),
      snapchat: social("snapchat"),
      tiktok: social("tiktok"),
      facebook: social("facebook"),
      youtube: social("youtube"),
      x: social("x"),
    },
  };
}

// ── Typed write path: brand editor → users/{uid} doc ────────────────────────

export const SOCIAL_KEYS = ["instagram", "snapchat", "tiktok", "facebook", "youtube", "x"] as const;

/** The fields the brand editor owns. One typed shape, one canonical write. */
export interface BrandEditFields {
  name: string;
  tagline?: string;
  logoUrl?: string;
  brandColor: string;
  accentColor?: string;
  fontPairing: FontPairingId;
  whatsapp?: string;
  phone?: string;
  email?: string;
  socials: AgencySocials;
}

const _clean = (v?: string) => {
  const t = (v || "").trim();
  return t.length ? t : undefined;
};

/**
 * Map the editor's brand fields to the canonical users/{uid} patch.
 * Optional top-level fields collapse to "" (read side treats "" as absent);
 * socials collapse to a fresh map of ONLY the set handles, so cleared handles
 * disappear (updateDoc replaces the `socials` map wholesale) — honest empties
 * everywhere downstream.
 */
export function brandDocPatch(b: BrandEditFields): Record<string, unknown> {
  const socials: Record<string, string> = {};
  for (const k of SOCIAL_KEYS) {
    const v = _clean(b.socials[k]);
    if (v) socials[k] = v;
  }
  return {
    name: (b.name || "").trim(),
    tagline: _clean(b.tagline) ?? "",
    logoUrl: _clean(b.logoUrl) ?? "",
    brandColor: b.brandColor,
    accentColor: _clean(b.accentColor) ?? "",
    fontPairing: toFontPairing(b.fontPairing),
    whatsapp: _clean(b.whatsapp) ?? "",
    phone: _clean(b.phone) ?? "",
    email: _clean(b.email) ?? "",
    socials,
  };
}

// ── Contrast helpers for the editor's live warnings ─────────────────────────

/** WCAG contrast ratio between two hex colors (1–21). */
export function contrastRatio(hexA: string, hexB: string): number {
  return _contrast(_lum(_rgb(hexA)), _lum(_rgb(hexB)));
}

/**
 * The button-text decision for a brand/accent color: which ink (#fff or near
 * black) gives the best contrast, the achieved ratio, and whether it clears the
 * WCAG AA bar (4.5:1) for the label. Mirrors deriveBrand's --brand-on choice so
 * the editor warning matches what actually ships.
 */
export function brandReadable(hex: string): { on: string; ratio: number; ok: boolean } {
  const c = _rgb(hex);
  const L = _lum(c);
  const onWhite = _contrast(L, 1);
  const onInk = _contrast(L, _lum(_rgb("#1b1813")));
  const useWhite = onWhite >= onInk;
  const ratio = useWhite ? onWhite : onInk;
  return { on: useWhite ? "#ffffff" : "#1b1813", ratio, ok: ratio >= 4.5 };
}

/**
 * WCAG band for a contrast ratio — the persistent readout in the colour editor.
 * AAA ≥ 7, AA ≥ 4.5, AA-Large ≥ 3, else Fail. `ok` is true at AA or better.
 */
export function ratioBand(ratio: number): { label: string; labelAr: string; ok: boolean } {
  if (ratio >= 7) return { label: "AAA", labelAr: "AAA", ok: true };
  if (ratio >= 4.5) return { label: "AA", labelAr: "AA", ok: true };
  if (ratio >= 3) return { label: "AA Large only", labelAr: "AA كبير فقط", ok: false };
  return { label: "Fail", labelAr: "ضعيف", ok: false };
}

/**
 * Accent-as-text-on-paper: the accent darkened (if needed) until it reads as
 * text on cream paper, plus the achieved ratio. Mirrors deriveBrand's
 * --brand-text guard so the editor's accent readout matches what ships.
 */
export function accentReadable(hex: string): { text: string; ratio: number } {
  const text = readableOnPaper(_rgb(hex));
  return { text, ratio: contrastRatio(text, "#faf5e8") };
}

/** Normalize a phone/whatsapp number into a wa.me link. */
export function waHref(number: string, text?: string): string {
  const digits = (number || "").replace(/\D/g, "");
  return text
    ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${digits}`;
}

/**
 * Build an email-compose link. On mobile, `mailto:` reliably hands off to the
 * native mail app. On desktop many machines have no default mail handler, so a
 * bare `mailto:` silently does nothing — there we open Gmail's web compose in a
 * new tab (works for anyone signed into Gmail, the common case).
 */
export function emailHref(email: string, mobile: boolean): string {
  if (mobile) return `mailto:${email}`;
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
}
