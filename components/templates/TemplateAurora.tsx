"use client";

// ═══════════════════════════════════════════════════════════════════════════
// AURORA V2 — Luxury / boutique · editorial, hushed, architectural.
// Ivory paper, cool ink, a single dynamic brand accent (per agency).
// Display serif (Cormorant / Amiri) + humanist sans (Mulish / Noto Sans Arabic).
// One component renders all 4 surfaces via { lang } + useIsDesktop().
// Faithful port of the V2 design, wired to real pkg.sections data with
// graceful empty states. Brand colour themes the whole template.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useState } from "react";
import { useIsDesktop, BaseCard, LightboxCarousel } from "./shared";
import { localizeTierLabel } from "@/lib/translations";
import type { TPageProps, TCardProps, TPackage } from "./types";

type SecData = Record<string, unknown>;

// ─── Brand colour math (theme the whole template off one hex) ─────────────────
function auHex(h: string): [number, number, number] {
  h = h.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function auRgba(hex: string, a: number): string { const [r, g, b] = auHex(hex); return `rgba(${r},${g},${b},${a})`; }
function auMix(hex: string, target: string, t: number): string {
  const a = auHex(hex), b = auHex(target);
  const m = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}
function auLighten(hex: string, t: number) { return auMix(hex, "#ffffff", t); }
function auLum(hex: string) { const [r, g, b] = auHex(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
function auOn(hex: string) { return auLum(hex) > 0.62 ? "#1a1a1a" : "#ffffff"; }

// ─── i18n (section chrome + UI strings) ───────────────────────────────────────
const L_EN = {
  sections: {
    highlights: "Why you'll love it", media: "See for yourself", itinerary: "Day by day",
    hotel: "Where you'll stay", meals: "What you'll eat", inclusions: "What's included",
    transfers: "Getting around", visa: "Visa & entry", departures: "Departures",
    pricing: "Choose your room", extras: "Make it yours", scarcity: "Before it's gone",
    people: "Your trip designer", reviews: "Travellers say", agency: "About the agency",
    notes: "Good to know", faq: "Questions, answered", custom: "A note from us", others: "More journeys",
  },
  nav: { highlights: "Highlights", itinerary: "Itinerary", hotel: "Stay", inclusions: "Included", departures: "Dates", pricing: "Pricing", reviews: "Reviews", faq: "FAQ" },
  ui: {
    from: "From", perPerson: "per person", night: "night", nights: "nights", included: "Included",
    notIncluded: "Not included", mostPopular: "Most popular", soldOut: "Sold out", left: "left",
    book: "Book", enquire: "Enquire on WhatsApp", bookWhatsapp: "Book on WhatsApp", messenger: "Messenger",
    nextDeparture: "Next departure", date: "Date", price: "Price", availability: "Availability",
    to: "To", cancellation: "Cancellation policy", paymentSchedule: "Payment schedule", basedOn: "based on",
    review: "reviews", stars: "stars", route: "Your route", replyTime: "Usually replies within an hour",
    curatedBy: "Curated by", watch: "Watch the film", noVideo: "Video coming soon", play: "Play",
    pause: "Pause", mute: "Mute", unmute: "Unmute", years: "years", downloadItinerary: "Download itinerary",
    poweredBy: "Powered by PackMetrix", ready: "Ready when you are.", editorsPick: "Editor's Pick",
    spotsLeftLine: (n: number) => `Only ${n} ${n === 1 ? "place" : "places"} remain.`,
  },
};
const L_AR: typeof L_EN = {
  sections: {
    highlights: "لماذا ستحبّها", media: "شاهد بنفسك", itinerary: "يومًا بيوم",
    hotel: "مكان إقامتك", meals: "ما ستتناوله", inclusions: "ما يشمله البرنامج",
    transfers: "التنقّلات", visa: "التأشيرة والدخول", departures: "مواعيد المغادرة",
    pricing: "اختر غرفتك", extras: "أضِف لمستك", scarcity: "قبل أن تنفد",
    people: "مصمّم رحلتك", reviews: "آراء المسافرين", agency: "عن الوكالة",
    notes: "معلومات تهمّك", faq: "إجابات على أسئلتك", custom: "كلمة منّا", others: "رحلات أخرى",
  },
  nav: { highlights: "المميزات", itinerary: "البرنامج", hotel: "الإقامة", inclusions: "المشمول", departures: "المواعيد", pricing: "الأسعار", reviews: "التقييمات", faq: "الأسئلة" },
  ui: {
    from: "ابتداءً من", perPerson: "للفرد", night: "ليلة", nights: "ليالٍ", included: "مشمول",
    notIncluded: "غير مشمول", mostPopular: "الأكثر طلبًا", soldOut: "نفدت", left: "متبقّية",
    book: "احجز", enquire: "استفسر عبر واتساب", bookWhatsapp: "احجز عبر واتساب", messenger: "ماسنجر",
    nextDeparture: "أقرب موعد", date: "التاريخ", price: "السعر", availability: "التوفّر",
    to: "إلى", cancellation: "سياسة الإلغاء", paymentSchedule: "جدول الدفع", basedOn: "من",
    review: "تقييم", stars: "نجوم", route: "مسار رحلتك", replyTime: "نردّ عادةً خلال ساعة",
    curatedBy: "من تصميم", watch: "شاهد الفيديو", noVideo: "الفيديو قريبًا", play: "تشغيل",
    pause: "إيقاف", mute: "كتم", unmute: "تشغيل الصوت", years: "سنة", downloadItinerary: "حمّل البرنامج",
    poweredBy: "مُشغّل بواسطة باكمتريكس", ready: "نحن جاهزون متى شئت.", editorsPick: "اختيار المحرّر",
    spotsLeftLine: (n: number) => `بقي ${n} ${n === 1 ? "مكان" : "أماكن"} فقط.`,
  },
};

const MEAL_LABELS: Record<string, { en: string; ar: string }> = {
  none: { en: "No meals", ar: "بدون وجبات" },
  breakfast: { en: "Breakfast included", ar: "إفطار مشمول" },
  half_board: { en: "Half board", ar: "نصف إقامة" },
  full_board: { en: "Full board", ar: "إقامة كاملة" },
  all_inclusive: { en: "All inclusive", ar: "شامل بالكامل" },
};
const ROLE_LABELS: Record<string, { en: string; ar: string }> = {
  agent: { en: "Travel designer", ar: "مصمّم الرحلات" },
  curator: { en: "Travel designer", ar: "مصمّم الرحلات" },
  trip_lead: { en: "Trip lead", ar: "قائد الرحلة" },
  trip_designer: { en: "Travel designer", ar: "مصمّم الرحلات" },
  guide: { en: "Guide", ar: "المرشد" },
  mutawif: { en: "Mutawif", ar: "المطوّف" },
};
const VISA_LABELS: Record<string, { en: string; ar: string }> = {
  included: { en: "Visa included", ar: "التأشيرة مشمولة" },
  assistance: { en: "Visa assistance provided", ar: "نقدّم المساعدة في التأشيرة" },
  not_included: { en: "Visa not included", ar: "التأشيرة غير مشمولة" },
  not_required: { en: "No visa required", ar: "لا تحتاج تأشيرة" },
};

// ─── Section-data helpers ─────────────────────────────────────────────────────
function findSec(pkg: TPackage, type: string): SecData | undefined {
  return pkg.sections?.find((s) => s.type === type)?.data as SecData | undefined;
}
function secArr(data: SecData | undefined, key: string): SecData[] {
  if (!data) return [];
  const v = data[key];
  if (!Array.isArray(v)) return [];
  return v.filter((item): item is SecData => item != null && typeof item === "object");
}
function secStr(data: SecData | undefined, key: string): string {
  if (!data) return "";
  const v = data[key];
  return typeof v === "string" ? v : "";
}
function secStrArr(data: SecData | undefined, key: string): string[] {
  if (!data) return [];
  const v = data[key];
  if (!Array.isArray(v)) return [];
  return v.filter((item): item is string => typeof item === "string");
}
function secItemStr(item: unknown, ...keys: string[]): string {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return "";
  const obj = item as SecData;
  for (const k of keys) { const v = secStr(obj, k); if (v) return v; }
  return "";
}
function secMixed(data: SecData | undefined, key: string): Array<SecData | string> {
  if (!data) return [];
  const v = data[key];
  if (!Array.isArray(v)) return [];
  return v.filter((item) => item != null) as Array<SecData | string>;
}
// split a textarea string into clean lines
function lines(s: string): string[] {
  return s.split(/\r?\n/).map((l) => l.replace(/^[-•·]\s*/, "").trim()).filter(Boolean);
}

// ─── WhatsApp icon ────────────────────────────────────────────────────────────
function WAIcon({ s = 16, fill = "#fff" }: { s?: number; fill?: string }) {
  return (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={fill}><path d="M20.5 3.5C18.2 1.2 15.2 0 12 0 5.4 0 .1 5.3.1 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.4-1.7c1.7.9 3.7 1.4 5.6 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.3zM12 21.8c-1.7 0-3.4-.5-4.9-1.3l-.4-.2-3.7 1 1-3.6-.2-.4c-.9-1.5-1.4-3.3-1.4-5 0-5.5 4.5-9.9 9.9-9.9 2.6 0 5.1 1 7 2.9 1.9 1.9 2.9 4.4 2.9 7-.1 5.4-4.5 9.5-10.2 9.5z" /></svg>
  );
}

// ─── Star rating ──────────────────────────────────────────────────────────────
function AuStars({ n = 5, of = 5, size = 14, color = "#e3a008" }: { n?: number; of?: number; size?: number; color?: string }) {
  const star = (fill: string) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} style={{ display: "block" }}>
      <path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 18.6 5.9 20.8l1.2-6.6L2.3 9.6l6.6-.9z" />
    </svg>
  );
  return (
    <span style={{ display: "inline-flex", gap: 2 }}>
      {Array.from({ length: of }).map((_, i) => <span key={i}>{star(i < n ? color : auRgba(color, 0.22))}</span>)}
    </span>
  );
}

// ─── Abstract route map (themeable) ───────────────────────────────────────────
function AuRouteMap({ stops, line, land = "#e7e0d2", ink = "#23262d", height = 220, rounded = 4, rtl = false }: { stops: { label: string }[]; line: string; land?: string; ink?: string; height?: number; rounded?: number; rtl?: boolean }) {
  const W = 1000, H = 420;
  const pts = stops.map((s, i) => {
    const x = stops.length === 1 ? W / 2 : 120 + (i * (W - 240)) / (stops.length - 1);
    const y = 150 + Math.sin(i * 1.3 + 0.6) * 70 + (i % 2 ? 20 : -10);
    return { ...s, x: rtl ? W - x : x, y };
  });
  const path = pts.map((p, i) => {
    if (i === 0) return `M ${p.x} ${p.y}`;
    const prev = pts[i - 1]; const mx = (prev.x + p.x) / 2;
    return `Q ${mx} ${prev.y - 40} ${p.x} ${p.y}`;
  }).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height, display: "block", borderRadius: rounded, background: auLighten(land, 0.35) }} preserveAspectRatio="xMidYMid slice">
      <g fill={land} opacity="0.85">
        <path d="M-40 300 Q 180 250 360 300 T 760 290 Q 920 270 1060 320 L1060 460 L-40 460 Z" />
        <ellipse cx="220" cy="120" rx="190" ry="90" opacity="0.5" />
        <ellipse cx="780" cy="100" rx="160" ry="80" opacity="0.5" />
      </g>
      <g stroke={auRgba(ink, 0.05)} strokeWidth="1">
        {[80, 180, 280, 360].map((y) => <line key={y} x1="0" x2={W} y1={y} y2={y} />)}
        {[200, 400, 600, 800].map((x) => <line key={x} y1="0" y2={H} x1={x} x2={x} />)}
      </g>
      <path d={path} fill="none" stroke={line} strokeWidth="3.5" strokeDasharray="2 12" strokeLinecap="round" opacity="0.9" />
      {pts.map((p, i) => (
        <g key={i}>
          <circle cx={p.x} cy={p.y} r="11" fill="#fff" stroke={line} strokeWidth="3.5" />
          <circle cx={p.x} cy={p.y} r="4" fill={line} />
          <text x={p.x} y={p.y - 22} textAnchor="middle" fill={ink} fontSize="22" fontWeight="700" fontFamily="inherit">{p.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── First-class video player (poster, play overlay, controls, no-video state) ─
function AuVideo({ src, poster, accent, onAccent, radius = 4, rtl = false, sans, height = 320, ui }: { src?: string; poster?: string; accent: string; onAccent: string; radius?: number; rtl?: boolean; sans: string; height?: number; ui: typeof L_EN["ui"] }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const ctrlStyle: React.CSSProperties = { width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 };

  if (!src) {
    return (
      <div style={{ position: "relative", borderRadius: radius, overflow: "hidden", height, background: "#111" }}>
        {poster && <img src={poster} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.4) brightness(0.55)" }} />}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#fff" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.55)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)"><path d="M8 5v14l11-7z" /></svg>
            <div style={{ position: "absolute", width: 64, height: 1.5, background: "rgba(255,255,255,0.7)", transform: "rotate(-45deg)" }} />
          </div>
          <div style={{ fontFamily: sans, fontSize: 13, letterSpacing: "0.3px", opacity: 0.85 }}>{ui.noVideo}</div>
        </div>
      </div>
    );
  }
  const toggle = () => { const v = ref.current; if (!v) return; if (v.paused) { const p = v.play(); if (p && p.catch) p.catch(() => {}); setPlaying(true); } else { v.pause(); setPlaying(false); } };
  const toggleMute = () => { const v = ref.current; if (!v) return; v.muted = !v.muted; setMuted(v.muted); };
  const IconPlay = <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>;
  const IconPause = <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></svg>;
  const IconMuted = <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 5V4L8 9H4zm12.5 3l2.5 2.5-1 1L15.5 13 13 15.5l-1-1L14.5 12 12 9.5l1-1L15.5 11 18 8.5l1 1L16.5 12z" /></svg>;
  const IconSound = <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M4 9v6h4l5 5V4L8 9H4zm12 3a4 4 0 00-2-3.5v7A4 4 0 0016 12zm-2-7.7v2.1a6 6 0 010 11.2v2.1a8 8 0 000-15.4z" /></svg>;
  return (
    <div onClick={toggle} style={{ position: "relative", borderRadius: radius, overflow: "hidden", height, background: "#000", cursor: "pointer" }}>
      <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata"
        onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      {!playing && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "linear-gradient(rgba(0,0,0,0.05),rgba(0,0,0,0.35))" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: accent, color: onAccent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(0,0,0,0.35)" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style={{ marginInlineStart: 3 }}><path d="M8 5v14l11-7z" /></svg>
          </div>
          <div style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: "#fff", letterSpacing: "0.4px", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>{ui.watch}</div>
        </div>
      )}
      <div dir={rtl ? "rtl" : "ltr"} style={{ position: "absolute", insetInline: 0, bottom: 0, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "linear-gradient(transparent, rgba(0,0,0,0.4))" }}>
        <button onClick={(e) => { e.stopPropagation(); toggle(); }} aria-label={playing ? ui.pause : ui.play} title={playing ? ui.pause : ui.play} style={ctrlStyle}>{playing ? IconPause : IconPlay}</button>
        <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} aria-label={muted ? ui.unmute : ui.mute} title={muted ? ui.unmute : ui.mute} style={ctrlStyle}>{muted ? IconMuted : IconSound}</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export function TemplateAuroraPage({ pkg, agency, onWhatsApp, lang = "en" }: TPageProps) {
  const D = useIsDesktop();
  const rtl = lang === "ar";
  const L = rtl ? L_AR : L_EN;
  const brand = agency.brandColor || "#1d4e72";
  const onBrand = auOn(brand);

  const IVORY = "#f3efe7", PAPER = "#fbf9f4", INK = "#23262d";
  const MUT = "rgba(35,38,45,0.58)", FAINT = "rgba(35,38,45,0.42)", RULE = "rgba(35,38,45,0.14)";
  const serif = rtl ? "var(--font-amiri), var(--font-cormorant), 'Amiri', serif" : "var(--font-cormorant), 'Cormorant Garamond', serif";
  const sans = rtl ? "var(--font-noto-sans-arabic), var(--font-mulish), sans-serif" : "var(--font-mulish), 'Mulish', sans-serif";
  const px = D ? 80 : 22;
  const ar = (en: string, a: string) => (rtl ? a : en);
  const dig = (s: string | number) => (rtl ? String(s).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]) : String(s));
  const uc: React.CSSProperties["textTransform"] = rtl ? "none" : "uppercase";

  // ---- normalized data ----
  const title = pkg.title || pkg.destination || "";
  const nightsN = pkg.nights ? Number(pkg.nights) : null;
  const cover = pkg.coverImage || pkg.images?.[0] || secStrArr(findSec(pkg, "media"), "images")[0] || "";
  // ---- clickable gallery (cover + media images) → lightbox carousel ----
  const mediaImgs = secStrArr(findSec(pkg, "media"), "images");
  const photos = Array.from(new Set([cover, ...mediaImgs].filter(Boolean)));
  const [lightbox, setLightbox] = useState<number | null>(null);
  const zoom = (url: string) => { const i = photos.indexOf(url); if (i >= 0) setLightbox(i); };
  const person = pkg.people?.find((p) => p.role === "agent" || p.role === "curator" || p.role === "trip_lead")
    ?? pkg.people?.[0] ?? (pkg.agent ? { name: pkg.agent.name, role: pkg.agent.role || "agent", photo: pkg.agent.avatar, years: pkg.agent.years } : undefined);

  // smooth-scroll the top-bar tabs to their section (only tabs whose section exists)
  const goTo = (type: string) => {
    if (typeof document === "undefined") return;
    document.querySelector(`[data-pmx-section="${type}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const navItems = Object.entries(L.nav).filter(([key]) => {
    if (key === "reviews") return (pkg.reviews?.length ?? 0) > 0 && agency.showReviews !== false;
    if (key === "hotel") return !!(findSec(pkg, "hotel") || findSec(pkg, "hotels") || pkg.hotelDescription);
    if (key === "itinerary") return secArr(findSec(pkg, "itinerary"), "days").length > 0;
    if (key === "inclusions") return secStrArr(findSec(pkg, "inclusions"), "includes").length + secStrArr(findSec(pkg, "inclusions"), "excludes").length + (pkg.includes?.length ?? 0) + (pkg.excludes?.length ?? 0) > 0;
    if (key === "departures") return secArr(findSec(pkg, "departures"), "entries").length > 0 || (pkg.departures?.length ?? 0) > 0;
    if (key === "pricing") return (pkg.pricingTiers?.length ?? 0) > 0 || !!findSec(pkg, "pricing");
    if (key === "faq") return secArr(findSec(pkg, "faq"), "items").length > 0;
    return !!findSec(pkg, key);
  });

  // ---- atoms ----
  const Eyebrow = ({ children, mb = 14, light = false }: { children: React.ReactNode; mb?: number; light?: boolean }) => (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: mb }}>
      <span style={{ width: 26, height: 1, background: light ? "rgba(255,255,255,0.5)" : brand }} />
      <span style={{ fontFamily: sans, fontSize: D ? 11 : 10, fontWeight: 700, letterSpacing: rtl ? "0" : "2.4px", textTransform: uc, color: light ? "rgba(255,255,255,0.8)" : brand }}>{children}</span>
    </div>
  );
  const H2 = ({ children, size }: { children: React.ReactNode; size?: number }) => (
    <h2 style={{ fontFamily: serif, fontSize: size || (D ? 46 : 30), fontWeight: 500, lineHeight: 1.06, letterSpacing: rtl ? "0" : "-0.6px", color: INK, margin: 0 }}>{children}</h2>
  );
  const Wrap = ({ children, pt, pb, bg, dark, id, section }: { children: React.ReactNode; pt?: number; pb?: number; bg?: string; dark?: boolean; id?: string; section?: string }) => (
    <section id={id} data-pmx-section={section} style={{ scrollMarginTop: D ? 70 : 58, padding: `${pt != null ? pt : (D ? 84 : 44)}px ${px}px ${pb != null ? pb : (D ? 84 : 44)}px`, background: dark ? INK : bg, color: dark ? "#fff" : undefined }}>{children}</section>
  );
  const Rule = ({ m = 0 }: { m?: number | string }) => <div style={{ height: 1, background: RULE, margin: m }} />;
  const Primary = ({ children, full, big, onClick }: { children: React.ReactNode; full?: boolean; big?: boolean; onClick?: () => void }) => (
    <button data-testid="wa-cta" onClick={onClick} style={{ fontFamily: sans, background: INK, color: "#fff", border: "none", borderRadius: 2, padding: big ? "16px 26px" : "13px 22px", fontSize: D ? 14 : 13, fontWeight: 700, letterSpacing: "0.2px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, width: full ? "100%" : "auto" }}>
      <WAIcon s={15} /> {children}
    </button>
  );
  const Ghost = ({ children }: { children: React.ReactNode }) => (
    <button style={{ fontFamily: sans, background: "transparent", color: INK, border: `1px solid ${RULE}`, borderRadius: 2, padding: "13px 22px", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>{children}</button>
  );
  const SecHead = ({ eyebrow, title: t, sub }: { eyebrow: string; title: string; sub?: string }) => (
    <div style={{ marginBottom: D ? 36 : 24 }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <H2>{t}</H2>
      {sub && <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: D ? 21 : 17, color: MUT, lineHeight: 1.5, margin: `${D ? 16 : 12}px 0 0`, maxWidth: 640 }}>{sub}</p>}
    </div>
  );

  const num = (i: number) => (rtl ? ["٠١", "٠٢", "٠٣", "٠٤", "٠٥", "٠٦", "٠٧", "٠٨"][i] || dig(i + 1) : `0${i + 1}`.slice(-2));

  // ════════ HERO ════════
  const Hero = () => {
    const priceBlock = (small?: boolean) => (
      <div>
        <div style={{ fontFamily: sans, fontSize: small ? 9.5 : 10.5, color: FAINT, letterSpacing: rtl ? "0" : "1.4px", textTransform: uc }}>{L.ui.from}</div>
        <div style={{ fontFamily: serif, fontSize: small ? 34 : 46, fontWeight: 500, lineHeight: 1, marginTop: 6, color: INK }} data-pmx-field="price">{dig(pkg.price || "")}</div>
        {nightsN != null && <div style={{ fontFamily: sans, fontSize: small ? 10.5 : 11.5, color: FAINT, marginTop: 6 }}>{dig(nightsN)} {L.ui.nights} · {L.ui.perPerson}</div>}
      </div>
    );
    if (D) {
      return (
        <div data-pmx-section="hero" style={{ display: "grid", gridTemplateColumns: "1.02fr 1fr", minHeight: 640 }}>
          <div style={{ padding: "92px 80px 64px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <Eyebrow><span data-pmx-field="destination">{pkg.destination}</span></Eyebrow>
              <h1 style={{ fontFamily: serif, fontSize: 76, fontWeight: 500, lineHeight: 0.98, letterSpacing: rtl ? "0" : "-1.8px", color: INK, margin: "12px 0 0" }} data-pmx-field="title">{title}</h1>
              {pkg.description && <p style={{ fontFamily: sans, fontSize: 17, color: MUT, lineHeight: 1.75, maxWidth: 440, margin: "28px 0 0" }}>{pkg.description}</p>}
              <div style={{ display: "flex", gap: 36, marginTop: 40 }}>
                {priceBlock()}
                <div style={{ width: 1, background: RULE }} />
                <div>
                  <div style={{ fontFamily: sans, fontSize: 10.5, color: FAINT, letterSpacing: rtl ? "0" : "1.4px", textTransform: uc }}>{L.ui.curatedBy}</div>
                  <div style={{ fontFamily: serif, fontSize: 22, marginTop: 8, color: INK }}>{agency.name}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 40 }}>
                {pkg.whatsapp && <Primary big onClick={onWhatsApp}>{L.ui.enquire}</Primary>}
                <Ghost>{L.ui.downloadItinerary}</Ghost>
              </div>
            </div>
          </div>
          <div style={{ position: "relative", overflow: "hidden", background: INK }}>
            {cover && <img src={cover} alt="" onClick={() => zoom(cover)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }} />}
            <div style={{ position: "absolute", top: 26, insetInlineEnd: 26, padding: "7px 15px", borderRadius: 999, background: "rgba(251,249,244,0.94)", fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: "0.4px", color: INK }}>{L.ui.editorsPick}</div>
            {pkg.scarcity?.spotsRemaining != null && (
              <div style={{ position: "absolute", insetInline: 26, bottom: 26, padding: "14px 18px", background: "rgba(35,38,45,0.42)", backdropFilter: "blur(8px)", borderRadius: 4, color: "#fff", display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#fff" }} />
                <span style={{ fontFamily: sans, fontSize: 12.5 }}>{L.ui.spotsLeftLine(pkg.scarcity.spotsRemaining)}</span>
              </div>
            )}
          </div>
        </div>
      );
    }
    return (
      <div data-pmx-section="hero">
        <div style={{ position: "relative", height: 500, overflow: "hidden", background: INK }}>
          {cover && <img src={cover} alt="" onClick={() => zoom(cover)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }} />}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.12) 35%, rgba(0,0,0,0.6))", pointerEvents: "none" }} />
          <div style={{ position: "absolute", top: 18, insetInlineStart: 22, color: "#fff" }}><Eyebrow mb={0} light><span data-pmx-field="destination">{pkg.destination}</span></Eyebrow></div>
          <div style={{ position: "absolute", insetInline: 22, bottom: 64, color: "#fff" }}>
            <h1 style={{ fontFamily: serif, fontSize: 40, fontWeight: 500, lineHeight: 1.02, letterSpacing: rtl ? "0" : "-0.8px", margin: 0 }} data-pmx-field="title">{title}</h1>
          </div>
        </div>
        <div style={{ margin: "-34px 22px 0", background: PAPER, border: `1px solid ${RULE}`, borderRadius: 4, padding: 20, position: "relative", boxShadow: "0 22px 40px rgba(35,38,45,0.12)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            {priceBlock(true)}
            <div style={{ textAlign: "end" }}>
              <div style={{ fontFamily: sans, fontSize: 9.5, color: FAINT, letterSpacing: rtl ? "0" : "1.2px", textTransform: uc }}>{L.ui.curatedBy}</div>
              <div style={{ fontFamily: serif, fontSize: 17, marginTop: 4, color: INK }}>{agency.name}</div>
            </div>
          </div>
          <Rule m="16px 0" />
          {pkg.whatsapp && <Primary full onClick={onWhatsApp}>{L.ui.enquire}</Primary>}
        </div>
        {pkg.description && (
          <section style={{ padding: `28px ${px}px 8px` }}>
            <p style={{ fontFamily: serif, fontSize: 21, fontStyle: "italic", lineHeight: 1.5, color: INK, margin: 0 }}>{pkg.description}</p>
          </section>
        )}
      </div>
    );
  };

  // ════════ SCARCITY ════════
  const Scarcity = () => {
    const sc = pkg.scarcity;
    if (!sc || sc.spotsRemaining == null) return null;
    const total = sc.totalSpots && sc.totalSpots > 0 ? sc.totalSpots : Math.max(sc.spotsRemaining, 6);
    return (
      <Wrap pt={D ? 0 : 8} pb={D ? 56 : 28} section="scarcity">
        <div style={{ border: `1px solid ${RULE}`, borderRadius: 4, padding: D ? "26px 32px" : "20px", display: "flex", flexDirection: D ? "row" : "column", gap: D ? 0 : 16, alignItems: D ? "center" : "stretch", justifyContent: "space-between", background: PAPER }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ fontFamily: serif, fontSize: D ? 52 : 40, fontWeight: 500, color: brand, lineHeight: 1 }}>{dig(sc.spotsRemaining)}</div>
            <div>
              <div style={{ fontFamily: sans, fontSize: 10.5, color: FAINT, letterSpacing: rtl ? "0" : "1.4px", textTransform: uc, marginBottom: 4 }}>{L.sections.scarcity}</div>
              <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: D ? 22 : 18, color: INK, maxWidth: 460, lineHeight: 1.4 }}>{L.ui.spotsLeftLine(sc.spotsRemaining)}</div>
            </div>
          </div>
          <div style={{ textAlign: rtl ? "start" : "end", display: "flex", flexDirection: "column", gap: 8, minWidth: 150 }}>
            {sc.firstDepartureDate && <div style={{ fontFamily: sans, fontSize: 11, color: FAINT }}>{L.ui.nextDeparture} · <strong style={{ color: INK }}>{dig(sc.firstDepartureDate)}</strong></div>}
            <div style={{ display: "flex", gap: 5, justifyContent: rtl ? "flex-start" : "flex-end" }}>
              {Array.from({ length: Math.min(total, 12) }).map((_, i) => <span key={i} style={{ width: 22, height: 4, borderRadius: 2, background: i < sc.spotsRemaining! ? brand : RULE }} />)}
            </div>
          </div>
        </div>
      </Wrap>
    );
  };

  // ════════ HIGHLIGHTS ════════
  const Highlights = () => {
    const items = secMixed(findSec(pkg, "highlights"), "items");
    if (!items.length) return null;
    return (
      <Wrap pt={D ? 48 : 8} section="highlights">
        <SecHead eyebrow={L.nav.highlights} title={L.sections.highlights} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 36 : 0 }}>
          {items.map((h, i) => {
            const t = secItemStr(h, "title", "text", "label");
            const d = typeof h === "object" ? secItemStr(h, "desc", "description") : "";
            return (
              <div key={i} style={{ paddingTop: 22, borderTop: `1px solid ${RULE}`, marginTop: !D && i ? 16 : 0 }}>
                <div style={{ fontFamily: serif, fontSize: 22, color: brand, fontWeight: 500, marginBottom: 12 }}>{num(i)}</div>
                <div style={{ fontFamily: serif, fontSize: D ? 24 : 20, fontWeight: 500, lineHeight: 1.18, color: INK }}>{t}</div>
                {d && <div style={{ fontFamily: sans, fontSize: 14, color: MUT, lineHeight: 1.65, marginTop: 10 }}>{d}</div>}
              </div>
            );
          })}
        </div>
      </Wrap>
    );
  };

  // ════════ MEDIA ════════
  const Media = () => {
    const m = findSec(pkg, "media");
    const imgs = secStrArr(m, "images");
    const video = secStr(m, "videoUrl") || pkg.videoUrl || "";
    const mapImage = secStr(m, "mapImage");
    const mapCaption = secStr(m, "mapCaption");
    if (!imgs.length && !video && !mapImage) return null;
    const itinDays = secArr(findSec(pkg, "itinerary"), "days");
    const stops = (mapImage ? [] : itinDays.slice(0, 5).map((d) => ({ label: secItemStr(d, "title") })).filter((s) => s.label))
      .concat(!mapImage && !itinDays.length && pkg.destination ? [{ label: pkg.destination }] : []);
    return (
      <Wrap pt={0} section="media">
        <SecHead eyebrow={L.sections.media} title={ar("See it before you go", "شاهدها قبل أن تذهب")} />
        <AuVideo src={video} poster={cover || imgs[0]} accent={brand} onAccent={onBrand} radius={4} rtl={rtl} sans={sans} height={D ? 460 : 240} ui={L.ui} />
        {imgs.length > 1 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: D ? 12 : 6, marginTop: D ? 12 : 6 }}>
            {imgs.slice(1, 4).map((u, i) => <img key={i} src={u} onClick={() => zoom(u)} style={{ width: "100%", height: D ? 200 : 84, objectFit: "cover", borderRadius: 4, display: "block", cursor: "zoom-in" }} />)}
          </div>
        )}
        {(mapImage || stops.length > 0) && (
          <div style={{ marginTop: D ? 24 : 16 }}>
            <div style={{ fontFamily: sans, fontSize: 10.5, color: brand, fontWeight: 700, letterSpacing: rtl ? "0" : "1.6px", textTransform: uc, marginBottom: 10 }}>{L.ui.route}</div>
            {mapImage
              ? <img src={mapImage} alt={mapCaption} style={{ width: "100%", height: D ? 320 : 200, objectFit: "cover", borderRadius: 4, display: "block" }} />
              : <AuRouteMap stops={stops} line={brand} ink={INK} height={D ? 240 : 180} rounded={4} rtl={rtl} />}
            {mapCaption && <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 13, color: FAINT, marginTop: 10 }}>{mapCaption}</div>}
          </div>
        )}
      </Wrap>
    );
  };

  // ════════ ITINERARY ════════
  const Itinerary = () => {
    const days = secArr(findSec(pkg, "itinerary"), "days").filter((d) => secItemStr(d, "title"));
    if (!days.length) return null;
    return (
      <Wrap bg={PAPER} section="itinerary">
        <SecHead eyebrow={L.sections.itinerary} title={ar(`${days.length} days, unhurried`, `${dig(days.length)} أيام على مهل`)} />
        <div style={{ position: "relative" }}>
          <div style={{ position: "absolute", insetInlineStart: D ? 28 : 15, top: 6, bottom: 6, width: 1, background: RULE }} />
          {days.map((it, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: D ? "56px 1fr" : "30px 1fr", gap: D ? 28 : 16, padding: "14px 0", position: "relative" }}>
              <div style={{ fontFamily: serif, fontSize: D ? 30 : 22, color: brand, fontWeight: 500, background: PAPER, zIndex: 1, lineHeight: 1 }}>{dig((it.day as number) ?? i + 1)}</div>
              <div>
                <div style={{ fontFamily: serif, fontSize: D ? 21 : 17, fontWeight: 500, color: INK }}>{secItemStr(it, "title")}</div>
                {secItemStr(it, "desc", "description") && <div style={{ fontFamily: sans, fontSize: 13.5, color: MUT, lineHeight: 1.6, marginTop: 4 }}>{secItemStr(it, "desc", "description")}</div>}
              </div>
            </div>
          ))}
        </div>
      </Wrap>
    );
  };

  // ════════ HOTEL ════════
  const Hotel = () => {
    const h = findSec(pkg, "hotel");
    const rich = findSec(pkg, "hotels");
    const richList = secArr(rich, "hotels").length ? secArr(rich, "hotels") : secArr(rich, "items");
    const desc = secStr(h, "description") || pkg.hotelDescription || "";
    const r0 = richList[0];
    const name = r0 ? secItemStr(r0, "name") : "";
    const stars = r0 && typeof r0.stars === "number" ? (r0.stars as number) : 0;
    const blurb = r0 ? secItemStr(r0, "note", "description", "blurb") : desc;
    const features = r0 ? secStrArr(r0, "facilities").concat(secStrArr(r0, "features")) : [];
    if (!blurb && !name) return null;
    const img = secStrArr(findSec(pkg, "media"), "images")[0] || cover;
    return (
      <Wrap section="hotel">
        <div style={{ display: "grid", gridTemplateColumns: D ? "1.1fr 1fr" : "1fr", gap: D ? 48 : 20, alignItems: "center" }}>
          {img && <img src={img} onClick={() => zoom(img)} style={{ width: "100%", height: D ? 380 : 220, objectFit: "cover", borderRadius: 4, cursor: "zoom-in" }} />}
          <div>
            <Eyebrow>{L.sections.hotel}</Eyebrow>
            <H2 size={D ? 36 : 26}>{name || ar("Your stay", "إقامتك")}</H2>
            {stars > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 16px" }}>
                <AuStars n={stars} size={D ? 17 : 15} color={brand} />
                <span style={{ fontFamily: sans, fontSize: 12, color: FAINT }}>{dig(stars)} {L.ui.stars}</span>
              </div>
            )}
            {blurb && <p style={{ fontFamily: sans, fontSize: D ? 15.5 : 14, color: MUT, lineHeight: 1.75, margin: stars > 0 ? 0 : "14px 0 0", whiteSpace: "pre-line" }}>{blurb}</p>}
            {features.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>
                {features.map((f, i) => <span key={i} style={{ fontFamily: sans, fontSize: 12, color: INK, border: `1px solid ${RULE}`, borderRadius: 999, padding: "6px 13px" }}>{f}</span>)}
              </div>
            )}
          </div>
        </div>
      </Wrap>
    );
  };

  // ════════ MEALS ════════
  const Meals = () => {
    const m = findSec(pkg, "meals");
    const plan = secStr(m, "plan");
    const notes = secStr(m, "notes");
    if (!plan && !notes) return null;
    const planLabel = MEAL_LABELS[plan]?.[lang] || plan;
    return (
      <Wrap bg={PAPER} section="meals">
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1.2fr" : "1fr", gap: D ? 56 : 22 }}>
          <div>
            <Eyebrow>{L.sections.meals}</Eyebrow>
            <H2 size={D ? 40 : 28}>{planLabel || ar("Dining", "الطعام")}</H2>
          </div>
          {notes && <p style={{ fontFamily: sans, fontSize: 14.5, color: MUT, lineHeight: 1.75, margin: 0, whiteSpace: "pre-line" }}>{notes}</p>}
        </div>
      </Wrap>
    );
  };

  // ════════ INCLUSIONS ════════
  const Mark = ({ on }: { on?: boolean }) => (
    <span style={{ width: 18, height: 18, borderRadius: "50%", border: `1px solid ${on ? brand : RULE}`, color: on ? brand : FAINT, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0, marginTop: 2 }}>{on ? "✓" : "—"}</span>
  );
  const Inclusions = () => {
    const inc = findSec(pkg, "inclusions");
    const includes = secStrArr(inc, "includes").length ? secStrArr(inc, "includes") : (pkg.includes ?? []);
    const excludes = secStrArr(inc, "excludes").length ? secStrArr(inc, "excludes") : (pkg.excludes ?? []);
    if (!includes.length && !excludes.length) return null;
    return (
      <Wrap section="inclusions">
        <SecHead eyebrow={L.sections.inclusions} title={ar("What's in, what's out", "ما يُشمل وما لا يُشمل")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 56 : 28 }}>
          {includes.length > 0 && (
            <div>
              <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, color: brand, letterSpacing: rtl ? "0" : "1.4px", textTransform: uc, marginBottom: 12 }}>{L.ui.included}</div>
              {includes.map((it, i) => <div key={i} style={{ display: "flex", gap: 12, padding: "9px 0", alignItems: "flex-start" }}><Mark on /><span style={{ fontFamily: sans, fontSize: 14, color: INK, lineHeight: 1.5 }}>{it}</span></div>)}
            </div>
          )}
          {excludes.length > 0 && (
            <div>
              <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, color: FAINT, letterSpacing: rtl ? "0" : "1.4px", textTransform: uc, marginBottom: 12 }}>{L.ui.notIncluded}</div>
              {excludes.map((it, i) => <div key={i} style={{ display: "flex", gap: 12, padding: "9px 0", alignItems: "flex-start" }}><Mark /><span style={{ fontFamily: sans, fontSize: 14, color: MUT, lineHeight: 1.5 }}>{it}</span></div>)}
            </div>
          )}
        </div>
      </Wrap>
    );
  };

  // ════════ TRANSFERS ════════
  const Transfers = () => {
    const tx = findSec(pkg, "transfers");
    const desc = secStr(tx, "description");
    const items = secMixed(tx, "items");
    if (!desc && !items.length) return null;
    return (
      <Wrap bg={PAPER} section="transfers">
        <SecHead eyebrow={L.sections.transfers} title={ar("Moved, never managed", "تنقّل دون عناء")} sub={desc || undefined} />
        {items.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 18 : 0 }}>
            {items.map((t, i) => {
              const tt = secItemStr(t, "leg", "title", "name", "text");
              const td = typeof t === "object" ? secItemStr(t, "desc", "description") : "";
              return (
                <div key={i} style={{ paddingTop: 20, borderTop: `1px solid ${RULE}`, marginTop: !D && i ? 16 : 0 }}>
                  <div style={{ fontFamily: serif, fontSize: 18, color: brand }}>{num(i)}</div>
                  <div style={{ fontFamily: serif, fontSize: D ? 21 : 18, color: INK, marginTop: 8 }}>{tt}</div>
                  {td && <div style={{ fontFamily: sans, fontSize: 13.5, color: MUT, lineHeight: 1.6, marginTop: 6 }}>{td}</div>}
                </div>
              );
            })}
          </div>
        )}
      </Wrap>
    );
  };

  // ════════ VISA ════════
  const Visa = () => {
    const v = findSec(pkg, "visa");
    const included = secStr(v, "included");
    const content = secStr(v, "content");
    if (!included && !content) return null;
    const headline = VISA_LABELS[included]?.[lang] || ar("Visa & entry", "التأشيرة والدخول");
    return (
      <Wrap section="visa">
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 56 : 24 }}>
          <div>
            <Eyebrow>{L.sections.visa}</Eyebrow>
            <H2 size={D ? 34 : 24}>{headline}</H2>
          </div>
          {content && <p style={{ fontFamily: sans, fontSize: 14.5, color: MUT, lineHeight: 1.75, margin: 0, whiteSpace: "pre-line" }}>{content}</p>}
        </div>
      </Wrap>
    );
  };

  // ════════ DEPARTURES ════════
  const Departures = () => {
    const entries = secArr(findSec(pkg, "departures"), "entries");
    const rows = entries.length ? entries : (pkg.departures ?? []).map((d) => ({ date: d.date, price: d.price, spots: d.spots } as SecData));
    if (!rows.length) return null;
    const seatLabel = (n: number) => (rtl ? `${dig(n)} ${L.ui.left}` : `${n} ${L.ui.left}`);
    const cell = (r: SecData) => {
      const spots = typeof r.spots === "number" ? r.spots : Number(r.spots) || 0;
      const sold = spots <= 0;
      const from = secItemStr(r, "origin", "from");
      const to = secItemStr(r, "arrivingAirport", "to");
      const date = secItemStr(r, "date");
      const price = secItemStr(r, "price");
      return { spots, sold, from, to, date, price };
    };
    return (
      <Wrap bg={PAPER} id="au-departures" section="departures">
        <SecHead eyebrow={L.sections.departures} title={ar("When you can go", "متى يمكنك السفر")} />
        {D ? (
          <div style={{ border: `1px solid ${RULE}`, borderRadius: 4, overflow: "hidden", background: IVORY }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr 1fr 1fr auto", padding: "14px 24px", fontFamily: sans, fontSize: 10.5, fontWeight: 700, letterSpacing: rtl ? "0" : "1px", textTransform: uc, color: FAINT, borderBottom: `1px solid ${RULE}` }}>
              <div>{L.ui.from}</div><div>{L.ui.to}</div><div>{L.ui.date}</div><div>{L.ui.availability}</div><div style={{ textAlign: "end" }}>{L.ui.price}</div><div />
            </div>
            {rows.map((r, i) => {
              const c = cell(r);
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1.2fr 1.2fr 1fr 1fr 1fr auto", padding: "16px 24px", alignItems: "center", borderTop: i ? `1px solid ${RULE}` : "none", opacity: c.sold ? 0.5 : 1 }}>
                  <div style={{ fontFamily: serif, fontSize: 18, color: INK }}>{c.from || "—"}</div>
                  <div style={{ fontFamily: sans, fontSize: 13.5, color: MUT }}>{c.to || "—"}</div>
                  <div style={{ fontFamily: sans, fontSize: 13.5, color: INK }}>{dig(c.date)}</div>
                  <div style={{ fontFamily: sans, fontSize: 12.5, color: c.sold ? FAINT : brand, fontWeight: 600 }}>{c.sold ? L.ui.soldOut : seatLabel(c.spots)}</div>
                  <div style={{ fontFamily: serif, fontSize: 20, color: INK, textAlign: "end" }}>{dig(c.price)}</div>
                  <div style={{ textAlign: "end", paddingInlineStart: 18 }}>{c.sold ? <span style={{ fontFamily: sans, fontSize: 12, color: FAINT }}>—</span> : (pkg.whatsapp ? <Primary onClick={onWhatsApp}>{L.ui.book}</Primary> : null)}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.map((r, i) => {
              const c = cell(r);
              return (
                <div key={i} style={{ border: `1px solid ${RULE}`, borderRadius: 4, padding: 16, background: IVORY, opacity: c.sold ? 0.55 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontFamily: serif, fontSize: 20, color: INK }}>{c.from ? `${c.from}${c.to ? ` → ${c.to}` : ""}` : dig(c.date)}</div>
                    {c.price && <div style={{ fontFamily: serif, fontSize: 20, color: brand }}>{dig(c.price)}</div>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: sans, fontSize: 12.5, color: MUT }}>
                    <span>{dig(c.date)}</span><span style={{ color: c.sold ? FAINT : brand, fontWeight: 600 }}>{c.sold ? L.ui.soldOut : seatLabel(c.spots)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Wrap>
    );
  };

  // ════════ PRICING ════════
  const Pricing = () => {
    const pr = findSec(pkg, "pricing");
    const tiers = pkg.pricingTiers ?? [];
    const cancellationStr = secStr(pr, "cancellation") || pkg.cancellation || "";
    const cancellation = lines(cancellationStr);
    const schedule = secArr(pr, "paymentSteps");
    if (!tiers.length && !cancellation.length && !schedule.length) return null;
    return (
      <Wrap id="au-pricing" section="pricing">
        <SecHead eyebrow={L.sections.pricing} title={ar("Choose your room", "اختر غرفتك")} />
        {tiers.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? `repeat(${Math.min(tiers.length, 3)},1fr)` : "1fr", gap: 14 }}>
            {tiers.map((t, i) => {
              const featured = tiers.length === 3 && i === 1;
              return (
                <div key={i} style={{ border: featured ? `1.5px solid ${brand}` : `1px solid ${RULE}`, borderRadius: 4, padding: D ? 28 : 20, background: featured ? PAPER : "transparent", position: "relative" }}>
                  {featured && <div style={{ position: "absolute", top: -10, insetInlineStart: 24, padding: "3px 10px", background: brand, color: onBrand, fontFamily: sans, fontSize: 9.5, fontWeight: 700, letterSpacing: rtl ? "0" : "0.8px", textTransform: uc, borderRadius: 2 }}>{L.ui.mostPopular}</div>}
                  <div style={{ fontFamily: sans, fontSize: 12.5, color: MUT }}>{localizeTierLabel(t.label, lang)}</div>
                  <div style={{ fontFamily: serif, fontSize: D ? 44 : 36, fontWeight: 500, color: INK, lineHeight: 1, marginTop: 8 }}>{dig(t.price)}</div>
                  {pkg.whatsapp && <div style={{ marginTop: 18 }}><Primary full onClick={onWhatsApp}>{L.ui.book}</Primary></div>}
                </div>
              );
            })}
          </div>
        )}
        {(cancellation.length > 0 || schedule.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 40 : 24, marginTop: tiers.length ? 36 : 0 }}>
            {cancellation.length > 0 && (
              <div>
                <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, color: brand, letterSpacing: rtl ? "0" : "1.2px", textTransform: uc, marginBottom: 12 }}>{L.ui.cancellation}</div>
                {cancellation.map((s, i) => <div key={i} style={{ fontFamily: sans, fontSize: 13.5, color: MUT, padding: "6px 0", lineHeight: 1.5 }}>· {s}</div>)}
              </div>
            )}
            {schedule.length > 0 && (
              <div>
                <div style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, color: brand, letterSpacing: rtl ? "0" : "1.2px", textTransform: uc, marginBottom: 12 }}>{L.ui.paymentSchedule}</div>
                {schedule.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderTop: i ? `1px solid ${RULE}` : "none" }}>
                    <span style={{ fontFamily: sans, fontSize: 13.5, color: INK }}>{secItemStr(s, "dueDate", "label")}</span>
                    <span style={{ fontFamily: serif, fontSize: 16, color: brand }}>{dig(secItemStr(s, "amount"))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </Wrap>
    );
  };

  // ════════ EXTRAS ════════
  const Extras = () => {
    const items = secArr(findSec(pkg, "extras"), "items");
    if (!items.length) return null;
    return (
      <Wrap bg={PAPER} section="extras">
        <SecHead eyebrow={L.sections.extras} title={ar("Make it yours", "أضِف لمستك")} />
        {items.map((e, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: D ? "20px 0" : "16px 0", borderTop: `1px solid ${RULE}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: serif, fontSize: D ? 22 : 18, color: INK }}>{secItemStr(e, "name", "title")}</div>
              {secItemStr(e, "description", "desc") && <div style={{ fontFamily: sans, fontSize: 13, color: MUT, marginTop: 4, lineHeight: 1.5 }}>{secItemStr(e, "description", "desc")}</div>}
            </div>
            {secItemStr(e, "price") && <div style={{ fontFamily: serif, fontSize: D ? 22 : 18, color: brand, whiteSpace: "nowrap" }}>{dig(secItemStr(e, "price"))}</div>}
          </div>
        ))}
      </Wrap>
    );
  };

  // ════════ PEOPLE ════════
  const People = () => {
    if (!person?.name) return null;
    const years = typeof person.years === "number" ? person.years : 0;
    const role = person.role ? (ROLE_LABELS[person.role]?.[lang] || person.role.replace(/_/g, " ")) : "";
    const bio = (person as { bio?: string }).bio || "";
    return (
      <Wrap section="people">
        <div style={{ display: "grid", gridTemplateColumns: D ? "auto 1fr" : "1fr", gap: D ? 44 : 20, alignItems: "center" }}>
          <div style={{ display: "flex", justifyContent: D ? "center" : "flex-start" }}>
            {person.photo
              ? <img src={person.photo} style={{ width: D ? 180 : 96, height: D ? 180 : 96, borderRadius: "50%", objectFit: "cover" }} />
              : <div style={{ width: D ? 180 : 96, height: D ? 180 : 96, borderRadius: "50%", background: auLighten(brand, 0.78), color: brand, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: D ? 64 : 36 }}>{person.name[0]}</div>}
          </div>
          <div>
            <Eyebrow>{L.sections.people}</Eyebrow>
            <div style={{ fontFamily: serif, fontSize: D ? 34 : 26, color: INK }}>{person.name}</div>
            {role && <div style={{ fontFamily: sans, fontSize: 12.5, color: brand, fontWeight: 600, letterSpacing: "0.4px", marginTop: 4 }}>{role}</div>}
            {bio && <p style={{ fontFamily: sans, fontSize: 14, color: MUT, lineHeight: 1.7, marginTop: 14 }}>{bio}</p>}
            {years > 0 && (
              <div style={{ display: "flex", gap: 28, marginTop: 18 }}>
                <div><div style={{ fontFamily: serif, fontSize: 26, color: brand }}>{dig(years)}</div><div style={{ fontFamily: sans, fontSize: 11, color: FAINT }}>{L.ui.years}</div></div>
              </div>
            )}
            {pkg.whatsapp && <div style={{ marginTop: 22 }}><Primary onClick={onWhatsApp}>{L.ui.enquire}</Primary></div>}
          </div>
        </div>
      </Wrap>
    );
  };

  // ════════ REVIEWS ════════
  const Reviews = () => {
    if (agency.showReviews === false) return null;
    const items = pkg.reviews ?? [];
    if (!items.length) return null;
    const rating = pkg.rating ?? 5;
    const count = pkg.reviewCount ?? items.length;
    return (
      <Wrap bg={PAPER} id="au-reviews" section="reviews">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: D ? 32 : 22 }}>
          <div><Eyebrow>{L.sections.reviews}</Eyebrow><H2 size={D ? 40 : 28}>{ar("In their words", "بكلماتهم")}</H2></div>
          <div style={{ textAlign: "end" }}>
            <div style={{ fontFamily: serif, fontSize: D ? 48 : 36, color: brand, lineHeight: 1 }}>{dig(rating)}</div>
            <AuStars n={Math.round(rating)} size={14} color={brand} />
            <div style={{ fontFamily: sans, fontSize: 11.5, color: FAINT, marginTop: 4 }}>{L.ui.basedOn} {dig(count)} {L.ui.review}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 14 }}>
          {items.slice(0, 3).map((r, i) => (
            <div key={i} style={{ border: `1px solid ${RULE}`, borderRadius: 4, padding: D ? 24 : 18, background: IVORY }}>
              <AuStars n={Math.round(r.rating || 5)} size={13} color={brand} />
              <p style={{ fontFamily: serif, fontSize: D ? 19 : 17, fontStyle: "italic", color: INK, lineHeight: 1.5, margin: "12px 0 16px" }}>&ldquo;{r.text}&rdquo;</p>
              <div style={{ fontFamily: sans, fontSize: 13, fontWeight: 700, color: INK }}>{r.name}</div>
            </div>
          ))}
        </div>
      </Wrap>
    );
  };

  // ════════ ABOUT AGENCY ════════
  const About = () => {
    const a = findSec(pkg, "about_agency");
    const story = secStr(a, "content");
    const image = secStr(a, "image");
    // Only render when the package actually has an about_agency section with content.
    if (!a || (!story && !image)) return null;
    return (
      <Wrap section="about_agency">
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 56 : 24, alignItems: "center" }}>
          <div>
            <Eyebrow>{L.sections.agency}</Eyebrow>
            <H2 size={D ? 40 : 28}>{agency.name}</H2>
            {agency.tagline && <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 17, color: MUT, marginTop: 8 }}>{agency.tagline}</div>}
            {story && <p style={{ fontFamily: sans, fontSize: 14.5, color: MUT, lineHeight: 1.75, marginTop: 16, whiteSpace: "pre-line" }}>{story}</p>}
          </div>
          {image && <img src={image} style={{ width: "100%", height: D ? 320 : 200, objectFit: "cover", borderRadius: 4 }} />}
        </div>
      </Wrap>
    );
  };

  // ════════ IMPORTANT NOTES ════════
  const Notes = () => {
    const items = secMixed(findSec(pkg, "important_notes"), "items");
    if (!items.length) return null;
    return (
      <Wrap bg={PAPER} section="important_notes">
        <SecHead eyebrow={L.sections.notes} title={ar("Good to know", "معلومات تهمّك")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(2,1fr)" : "1fr", gap: D ? 18 : 0 }}>
          {items.map((n, i) => {
            const t = secItemStr(n, "title");
            const body = secItemStr(n, "text", "desc", "description") || (typeof n === "string" ? n : "");
            return (
              <div key={i} style={{ paddingTop: 18, borderTop: `1px solid ${RULE}`, marginTop: !D && i ? 16 : 0 }}>
                {t && <div style={{ fontFamily: serif, fontSize: D ? 20 : 17, color: INK, marginBottom: 6 }}>{t}</div>}
                <div style={{ fontFamily: sans, fontSize: 13.5, color: MUT, lineHeight: 1.6 }}>{body}</div>
              </div>
            );
          })}
        </div>
      </Wrap>
    );
  };

  // ════════ FAQ ════════
  const Faq = () => {
    const items = secArr(findSec(pkg, "faq"), "items");
    if (!items.length) return null;
    return (
      <Wrap section="faq">
        <SecHead eyebrow={L.sections.faq} title={ar("Questions, answered", "إجابات على أسئلتك")} />
        <div>
          {items.map((f, i) => (
            <div key={i} style={{ padding: D ? "22px 0" : "18px 0", borderTop: `1px solid ${RULE}`, borderBottom: i === items.length - 1 ? `1px solid ${RULE}` : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "baseline" }}>
                <div style={{ fontFamily: serif, fontSize: D ? 23 : 19, color: INK }}>{secItemStr(f, "question", "q")}</div>
                <span style={{ fontFamily: serif, fontSize: 22, color: brand }}>+</span>
              </div>
              {secItemStr(f, "answer", "a") && <p style={{ fontFamily: sans, fontSize: 14, color: MUT, lineHeight: 1.7, margin: "10px 0 0", maxWidth: 720 }}>{secItemStr(f, "answer", "a")}</p>}
            </div>
          ))}
        </div>
      </Wrap>
    );
  };

  // ════════ CUSTOM ════════
  const Custom = () => {
    const cs = findSec(pkg, "custom");
    const heading = secStr(cs, "heading");
    const body = secStr(cs, "content");
    const image = secStr(cs, "image");
    if (!heading && !body) return null;
    return (
      <Wrap dark section="custom">
        <div style={{ display: "grid", gridTemplateColumns: D && image ? "1.3fr 1fr" : "1fr", gap: D ? 56 : 22, alignItems: "center" }}>
          <div>
            <Eyebrow light>{L.sections.custom}</Eyebrow>
            {heading && <div style={{ fontFamily: serif, fontSize: D ? 44 : 30, fontWeight: 500, lineHeight: 1.08, marginBottom: 16 }}>{heading}</div>}
            {body && <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: D ? 22 : 18, color: "rgba(255,255,255,0.82)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>{body}</p>}
          </div>
          {image && <img src={image} style={{ width: "100%", height: D ? 320 : 200, objectFit: "cover", borderRadius: 4 }} />}
        </div>
      </Wrap>
    );
  };

  // ════════ OTHER PACKAGES ════════
  const Others = () => {
    const list = secArr(findSec(pkg, "other_packages"), "packages");
    if (!list.length) return null;
    return (
      <Wrap section="other_packages">
        <SecHead eyebrow={L.sections.others} title={ar(`More from ${agency.name}`, `المزيد من ${agency.name}`)} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 16 }}>
          {list.map((o, i) => {
            const oTitle = secItemStr(o, "title");
            const place = secItemStr(o, "destination", "place");
            const price = secItemStr(o, "price");
            const oNights = secItemStr(o, "nights");
            const img = secItemStr(o, "image");
            const link = secItemStr(o, "link");
            const Card = (
              <div style={{ border: `1px solid ${RULE}`, borderRadius: 4, overflow: "hidden", background: PAPER, height: "100%" }}>
                {img && <img src={img} style={{ width: "100%", height: 160, objectFit: "cover" }} />}
                <div style={{ padding: 18 }}>
                  {place && <div style={{ fontFamily: sans, fontSize: 10.5, color: brand, fontWeight: 700, letterSpacing: rtl ? "0" : "1.2px", textTransform: uc }}>{place}</div>}
                  <div style={{ fontFamily: serif, fontSize: 21, color: INK, margin: "8px 0 12px", lineHeight: 1.15 }}>{oTitle}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    {price && <span style={{ fontFamily: serif, fontSize: 20, color: INK }}>{dig(price)}</span>}
                    {oNights && <span style={{ fontFamily: sans, fontSize: 12, color: FAINT }}>{dig(oNights)} {L.ui.nights}</span>}
                  </div>
                </div>
              </div>
            );
            return link ? <a key={i} href={link} style={{ textDecoration: "none" }}>{Card}</a> : <div key={i}>{Card}</div>;
          })}
        </div>
      </Wrap>
    );
  };

  // ════════ FOOTER / CTA ════════
  const Footer = () => (
    <div>
      <section style={{ padding: `${D ? 72 : 40}px ${px}px`, background: brand, color: onBrand, textAlign: "center" }}>
        <div style={{ fontFamily: serif, fontSize: D ? 52 : 32, fontWeight: 500, lineHeight: 1.1 }}>{L.ui.ready}</div>
        <div style={{ fontFamily: sans, fontSize: 14, opacity: 0.85, margin: "12px 0 24px" }}>{L.ui.replyTime}{pkg.whatsapp ? ` · ${dig(pkg.whatsapp)}` : ""}</div>
        {pkg.whatsapp && (
          <button data-testid="wa-cta" onClick={onWhatsApp} style={{ fontFamily: sans, background: "#fff", color: INK, border: "none", borderRadius: 2, padding: "15px 26px", fontSize: 14, fontWeight: 700, cursor: "pointer", display: "inline-flex", gap: 9, alignItems: "center" }}><WAIcon s={15} fill="#25d366" /> {L.ui.bookWhatsapp}</button>
        )}
      </section>
      <div style={{ padding: `22px ${px}px`, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${RULE}` }}>
        <div style={{ fontFamily: serif, fontSize: 18, color: INK }}>{agency.name}</div>
        <div style={{ fontFamily: sans, fontSize: 10, color: FAINT, letterSpacing: rtl ? "0" : "1px", textTransform: uc }}>{L.ui.poweredBy}</div>
      </div>
    </div>
  );

  // ════════ TOP BAR ════════
  const initials = (agency.name || "A").split(" ").map((w) => w[0]).slice(0, 2).join("");
  const Bar = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${px}px`, height: D ? 60 : 52, borderBottom: `1px solid ${RULE}`, background: "rgba(251,249,244,0.9)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 30 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: D ? 30 : 26, height: D ? 30 : 26, borderRadius: 3, background: brand, color: onBrand, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 13, fontWeight: 600 }}>{initials}</div>
        <div style={{ fontFamily: serif, fontSize: D ? 18 : 16, color: INK }}>{agency.name}</div>
      </div>
      {D ? (
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          {navItems.map(([key, label]) => (
            <button key={key} onClick={() => goTo(key)} style={{ fontFamily: sans, fontSize: 13, color: MUT, background: "none", border: "none", cursor: "pointer", padding: 0 }}>{label}</button>
          ))}
          {pkg.whatsapp && <Primary onClick={onWhatsApp}>{dig(pkg.price || "")}</Primary>}
        </div>
      ) : (pkg.whatsapp && <Primary onClick={onWhatsApp}>{dig(pkg.price || "")}</Primary>)}
    </div>
  );

  return (
    <div dir={rtl ? "rtl" : "ltr"} lang={lang} style={{ width: "100%", background: IVORY, color: INK, fontFamily: sans, position: "relative" }}>
      {Bar()}
      {Hero()}
      {Scarcity()}
      {Highlights()}
      {Media()}
      {Itinerary()}
      {Hotel()}
      {Meals()}
      {Inclusions()}
      {Transfers()}
      {Visa()}
      {Departures()}
      {Pricing()}
      {Extras()}
      {People()}
      {Reviews()}
      {About()}
      {Notes()}
      {Faq()}
      {Custom()}
      {Others()}
      {Footer()}
      {lightbox !== null && photos.length > 0 && <LightboxCarousel images={photos} startIndex={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  );
}

// ─── Card (dashboard listing) ─────────────────────────────────────────────────
export function TemplateAuroraCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
