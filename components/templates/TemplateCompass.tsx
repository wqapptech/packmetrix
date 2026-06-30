"use client";

// ═══════════════════════════════════════════════════════════════════════════
// COMPASS V2 — Adventure · an expedition field guide.
// Cool map paper, near-black ink, Archivo black uppercase display, Space Mono
// data, slate panels, sharp corners, coordinate ticks, metric chips, an
// elevation profile from itinerary altitudes, amber-flagged scarcity.
// Dynamic brand themes panels/rules/stats/CTAs. One component, all 4 surfaces.
// Wired to real pkg.sections data with graceful empty states.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useState } from "react";
import { useIsDesktop, BaseCard, LightboxCarousel } from "./shared";
import { localizeTierLabel } from "@/lib/translations";
import type { TPageProps, TCardProps, TPackage } from "./types";

type SecData = Record<string, unknown>;

// ─── Brand colour math ────────────────────────────────────────────────────────
function coHex(h: string): [number, number, number] {
  h = h.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function coRgba(hex: string, a: number): string { const [r, g, b] = coHex(hex); return `rgba(${r},${g},${b},${a})`; }
function coMix(hex: string, target: string, t: number): string {
  const a = coHex(hex), b = coHex(target);
  const m = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}
function coLighten(hex: string, t: number) { return coMix(hex, "#ffffff", t); }
function coLum(hex: string) { const [r, g, b] = coHex(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
function coOn(hex: string) { return coLum(hex) > 0.62 ? "#161f18" : "#ffffff"; }

const AMBER = "#c0612a";

// ─── i18n ─────────────────────────────────────────────────────────────────────
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
    seatsLeft: "spots left", book: "Book", reserve: "Reserve", enquire: "Enquire on WhatsApp",
    bookWhatsapp: "Book on WhatsApp", messenger: "Messenger", message: "Message us", nextDeparture: "Next departure",
    date: "Date", flight: "Flight", price: "Price", availability: "Avail", to: "To", dist: "Dist", gain: "Alt",
    cancellation: "Cancellation policy", paymentSchedule: "Payment schedule", basedOn: "based on", review: "reviews",
    route: "Route", elevation: "Elevation profile", stages: "stages", years: "years", replyTime: "Usually replies within an hour",
    watch: "Watch the film", noVideo: "Video coming soon", play: "Play", pause: "Pause", mute: "Mute",
    unmute: "Unmute", poweredBy: "Powered by PackMetrix", begin: "Begin the expedition.", day: "Day",
    spotsLine: (n: number) => `${n} ${n === 1 ? "spot" : "spots"} left on this departure.`,
    scarcityWindow: "Small group sizes mean places go quickly. Reach out and we'll hold one while you decide.",
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
    from: "من", perPerson: "للفرد", night: "ليلة", nights: "ليالٍ", included: "مشمول",
    notIncluded: "غير مشمول", mostPopular: "الأكثر طلبًا", soldOut: "نفدت", left: "متبقّية",
    seatsLeft: "مقاعد متبقّية", book: "احجز", reserve: "احجز", enquire: "استفسر عبر واتساب",
    bookWhatsapp: "احجز عبر واتساب", messenger: "ماسنجر", message: "راسلنا", nextDeparture: "أقرب موعد",
    date: "التاريخ", flight: "الرحلة", price: "السعر", availability: "التوفّر", to: "إلى", dist: "مسافة", gain: "ارتفاع",
    cancellation: "سياسة الإلغاء", paymentSchedule: "جدول الدفع", basedOn: "من", review: "تقييم",
    route: "المسار", elevation: "مخطّط الارتفاع", stages: "مراحل", years: "سنة", replyTime: "نردّ عادةً خلال ساعة",
    watch: "شاهد الفيديو", noVideo: "الفيديو قريبًا", play: "تشغيل", pause: "إيقاف", mute: "كتم",
    unmute: "تشغيل الصوت", poweredBy: "مُشغّل بواسطة باكمتريكس", begin: "ابدأ الرحلة.", day: "اليوم",
    spotsLine: (n: number) => `بقي ${n} ${n === 1 ? "مكان" : "أماكن"} في هذا الموعد.`,
    scarcityWindow: "المجموعات صغيرة، فالأماكن تنفد بسرعة. تواصل معنا ونحتفظ لك بمكان ريثما تقرّر.",
  },
};

const MEAL_LABELS: Record<string, { en: string; ar: string }> = {
  none: { en: "No meals", ar: "بدون وجبات" }, breakfast: { en: "Breakfast", ar: "إفطار" },
  half_board: { en: "Half board", ar: "نصف إقامة" }, full_board: { en: "Full board", ar: "إقامة كاملة" },
  all_inclusive: { en: "All inclusive", ar: "شامل بالكامل" },
};
const VISA_HEAD: Record<string, { en: string; ar: string }> = {
  included: { en: "Visa included", ar: "التأشيرة مشمولة" }, assistance: { en: "Visa assistance provided", ar: "نقدّم المساعدة في التأشيرة" },
  not_included: { en: "Visa not included", ar: "التأشيرة غير مشمولة" }, not_required: { en: "No visa required", ar: "لا تحتاج تأشيرة" },
};
const ROLE_LABELS: Record<string, { en: string; ar: string }> = {
  agent: { en: "Trip designer", ar: "مصمّم الرحلات" }, curator: { en: "Trip designer", ar: "مصمّم الرحلات" },
  trip_lead: { en: "Expedition lead", ar: "قائد الرحلة" }, trip_designer: { en: "Trip designer", ar: "مصمّم الرحلات" },
  guide: { en: "Guide", ar: "المرشد" }, mutawif: { en: "Mutawif", ar: "المطوّف" },
};

// ─── Section-data helpers ─────────────────────────────────────────────────────
function findSec(pkg: TPackage, type: string): SecData | undefined {
  return pkg.sections?.find((s) => s.type === type)?.data as SecData | undefined;
}
function secArr(data: SecData | undefined, key: string): SecData[] {
  const v = data?.[key];
  return Array.isArray(v) ? v.filter((i): i is SecData => i != null && typeof i === "object") : [];
}
function secStr(data: SecData | undefined, key: string): string {
  const v = data?.[key];
  return typeof v === "string" ? v : "";
}
function secNum(item: unknown, key: string): number | undefined {
  if (!item || typeof item !== "object") return undefined;
  const v = (item as SecData)[key];
  return typeof v === "number" ? v : (typeof v === "string" && v.trim() !== "" && !isNaN(Number(v)) ? Number(v) : undefined);
}
function secStrArr(data: SecData | undefined, key: string): string[] {
  const v = data?.[key];
  return Array.isArray(v) ? v.filter((i): i is string => typeof i === "string") : [];
}
function secItemStr(item: unknown, ...keys: string[]): string {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return "";
  const obj = item as SecData;
  for (const k of keys) { const v = secStr(obj, k); if (v) return v; }
  return "";
}
function secMixed(data: SecData | undefined, key: string): Array<SecData | string> {
  const v = data?.[key];
  return Array.isArray(v) ? (v.filter((i) => i != null) as Array<SecData | string>) : [];
}
function lines(s: string): string[] {
  return s.split(/\r?\n/).map((l) => l.replace(/^[-•·]\s*/, "").trim()).filter(Boolean);
}

// ─── WhatsApp icon ────────────────────────────────────────────────────────────
function WAIcon({ s = 16, fill = "currentColor" }: { s?: number; fill?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill={fill}><path d="M20.5 3.5C18.2 1.2 15.2 0 12 0 5.4 0 .1 5.3.1 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.4-1.7c1.7.9 3.7 1.4 5.6 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.3zM12 21.8c-1.7 0-3.4-.5-4.9-1.3l-.4-.2-3.7 1 1-3.6-.2-.4c-.9-1.5-1.4-3.3-1.4-5 0-5.5 4.5-9.9 9.9-9.9 2.6 0 5.1 1 7 2.9 1.9 1.9 2.9 4.4 2.9 7-.1 5.4-4.5 9.5-10.2 9.5z" /></svg>;
}

// ─── Star rating ──────────────────────────────────────────────────────────────
function CoStars({ n = 5, of = 5, size = 14, color }: { n?: number; of?: number; size?: number; color: string }) {
  const star = (fill: string) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} style={{ display: "block" }}><path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 18.6 5.9 20.8l1.2-6.6L2.3 9.6l6.6-.9z" /></svg>
  );
  return <span style={{ display: "inline-flex", gap: 2 }}>{Array.from({ length: of }).map((_, i) => <span key={i}>{star(i < n ? color : coRgba(color, 0.25))}</span>)}</span>;
}

// ─── Abstract route map ───────────────────────────────────────────────────────
function CoRouteMap({ stops, line, land, ink = "#161f18", height = 220, rtl = false }: { stops: { label: string }[]; line: string; land: string; ink?: string; height?: number; rtl?: boolean }) {
  const W = 1000, H = 420;
  const pts = stops.map((s, i) => {
    const x = stops.length === 1 ? W / 2 : 120 + (i * (W - 240)) / (stops.length - 1);
    const y = 150 + Math.sin(i * 1.3 + 0.6) * 70 + (i % 2 ? 20 : -10);
    return { ...s, x: rtl ? W - x : x, y };
  });
  const path = pts.map((p, i) => { if (i === 0) return `M ${p.x} ${p.y}`; const prev = pts[i - 1]; const mx = (prev.x + p.x) / 2; return `Q ${mx} ${prev.y - 40} ${p.x} ${p.y}`; }).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height, display: "block", borderRadius: 2, background: "#dfe2d8" }} preserveAspectRatio="xMidYMid slice">
      <g fill={land} opacity="0.85"><path d="M-40 300 Q 180 250 360 300 T 760 290 Q 920 270 1060 320 L1060 460 L-40 460 Z" /><ellipse cx="220" cy="120" rx="190" ry="90" opacity="0.5" /><ellipse cx="780" cy="100" rx="160" ry="80" opacity="0.5" /></g>
      <g stroke={coRgba(ink, 0.06)} strokeWidth="1">{[80, 180, 280, 360].map((y) => <line key={y} x1="0" x2={W} y1={y} y2={y} />)}{[200, 400, 600, 800].map((x) => <line key={x} y1="0" y2={H} x1={x} x2={x} />)}</g>
      <path d={path} fill="none" stroke={line} strokeWidth="3.5" strokeDasharray="2 12" strokeLinecap="round" opacity="0.9" />
      {pts.map((p, i) => <g key={i}><circle cx={p.x} cy={p.y} r="10" fill="#f2f3ec" stroke={line} strokeWidth="3" /><circle cx={p.x} cy={p.y} r="3.5" fill={line} /><text x={p.x} y={p.y - 22} textAnchor="middle" fill={ink} fontSize="22" fontWeight="700" fontFamily="inherit">{p.label}</text></g>)}
    </svg>
  );
}

// ─── Video player ─────────────────────────────────────────────────────────────
function CoVideo({ src, poster, accent, rtl = false, sans, height = 320, ui }: { src?: string; poster?: string; accent: string; rtl?: boolean; sans: string; height?: number; ui: typeof L_EN["ui"] }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const ctrl: React.CSSProperties = { width: 38, height: 38, borderRadius: 2, border: "none", cursor: "pointer", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 };
  const onAccent = coOn(accent);
  if (!src) {
    return (
      <div style={{ position: "relative", borderRadius: 2, overflow: "hidden", height, background: "#19231d" }}>
        {poster && <img src={poster} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.3) brightness(0.55)" }} />}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#fff" }}>
          <div style={{ width: 56, height: 56, borderRadius: 2, border: "1.5px solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,0.85)"><path d="M8 5v14l11-7z" /></svg>
            <div style={{ position: "absolute", width: 64, height: 1.5, background: "rgba(255,255,255,0.7)", transform: "rotate(-45deg)" }} />
          </div>
          <div style={{ fontFamily: sans, fontSize: 13, opacity: 0.85 }}>{ui.noVideo}</div>
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
    <div onClick={toggle} style={{ position: "relative", borderRadius: 2, overflow: "hidden", height, background: "#000", cursor: "pointer" }}>
      <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      {!playing && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "linear-gradient(rgba(0,0,0,0.05),rgba(0,0,0,0.4))" }}>
          <div style={{ width: 70, height: 70, borderRadius: 2, background: accent, color: onAccent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(0,0,0,0.45)" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style={{ marginInlineStart: 3 }}><path d="M8 5v14l11-7z" /></svg>
          </div>
          <div style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 700, color: "#fff", letterSpacing: "0.4px", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>{ui.watch}</div>
        </div>
      )}
      <div dir={rtl ? "rtl" : "ltr"} style={{ position: "absolute", insetInline: 0, bottom: 0, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "linear-gradient(transparent, rgba(0,0,0,0.5))" }}>
        <button onClick={(e) => { e.stopPropagation(); toggle(); }} aria-label={playing ? ui.pause : ui.play} title={playing ? ui.pause : ui.play} style={ctrl}>{playing ? IconPause : IconPlay}</button>
        <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} aria-label={muted ? ui.unmute : ui.mute} title={muted ? ui.unmute : ui.mute} style={ctrl}>{muted ? IconMuted : IconSound}</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export function TemplateCompassPage({ pkg, agency, onWhatsApp, onMessenger, lang = "en" }: TPageProps) {
  const D = useIsDesktop();
  const rtl = lang === "ar";
  const L = rtl ? L_AR : L_EN;
  const brand = agency.brandColor || "#2f5d50";
  const onBrand = coOn(brand);
  const brLight = coLighten(brand, 0.4);

  const PAPER = "#e8eae2", CARD = "#f2f3ec", INK = "#161f18", SLATE = "#19231d";
  const MUT = "rgba(22,31,24,0.66)", FAINT = "rgba(22,31,24,0.45)", RULE = "rgba(22,31,24,0.16)";
  const disp = rtl ? "var(--font-cairo), 'Cairo', sans-serif" : "var(--font-archivo), 'Archivo', sans-serif";
  const mono = rtl ? "var(--font-tajawal), 'Tajawal', sans-serif" : "var(--font-space-mono), 'Space Mono', monospace";
  const body = rtl ? "var(--font-tajawal), 'Tajawal', sans-serif" : "var(--font-barlow), 'Barlow', sans-serif";
  const px = D ? 72 : 22;
  const ar = (en: string, a: string) => (rtl ? a : en);
  const dig = (s: string | number) => (rtl ? String(s).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]) : String(s));
  const up: React.CSSProperties["textTransform"] = rtl ? "none" : "uppercase";
  const GRID = `linear-gradient(${coRgba("#ffffff", 0.04)} 1px, transparent 1px), linear-gradient(90deg, ${coRgba("#ffffff", 0.04)} 1px, transparent 1px)`;

  const title = pkg.title || pkg.destination || "";
  const nightsN = pkg.nights ? Number(pkg.nights) : null;
  const cover = pkg.coverImage || pkg.images?.[0] || secStrArr(findSec(pkg, "media"), "images")[0] || "";
  const mediaImgs = secStrArr(findSec(pkg, "media"), "images");
  const itinDays = secArr(findSec(pkg, "itinerary"), "days").filter((d) => secItemStr(d, "title"));
  const depEntries = secArr(findSec(pkg, "departures"), "entries");
  const person = pkg.people?.find((p) => p.role === "agent" || p.role === "curator" || p.role === "trip_lead")
    ?? pkg.people?.[0] ?? (pkg.agent ? { name: pkg.agent.name, role: pkg.agent.role || "agent", photo: pkg.agent.avatar, years: pkg.agent.years } : undefined);
  const hasDepart = depEntries.length > 0 || (pkg.departures?.length ?? 0) > 0;

  // itinerary metrics (alt = altitude, km = distance) — real itinerary fields
  const alts = itinDays.map((d) => secNum(d, "alt") ?? 0);
  const hasElev = alts.filter((a) => a > 0).length >= 2;
  const totalKm = itinDays.reduce((sum, d) => sum + (secNum(d, "km") ?? 0), 0);

  // ---- clickable gallery → lightbox ----
  const photos = Array.from(new Set([cover, ...mediaImgs].filter(Boolean)));
  const [lightbox, setLightbox] = useState<number | null>(null);
  const zoom = (url: string) => { const i = photos.indexOf(url); if (i >= 0) setLightbox(i); };

  // ---- nav + section folios ----
  const goTo = (type: string) => { if (typeof document === "undefined") return; document.querySelector(`[data-pmx-section="${type}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }); };
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
  const SEC_ORDER = ["highlights", "media", "itinerary", "hotel", "inclusions", "meals", "visa", "transfers", "departures", "pricing", "extras", "scarcity", "people", "reviews", "about_agency", "important_notes", "faq", "custom", "other_packages"];
  const presentSec = (k: string): boolean => {
    if (k === "reviews") return (pkg.reviews?.length ?? 0) > 0 && agency.showReviews !== false;
    if (k === "people") return !!person?.name;
    if (k === "scarcity") return pkg.scarcity?.spotsRemaining != null;
    if (k === "hotel") return !!(findSec(pkg, "hotel") || findSec(pkg, "hotels") || pkg.hotelDescription);
    if (k === "pricing") return (pkg.pricingTiers?.length ?? 0) > 0 || !!findSec(pkg, "pricing");
    if (k === "departures") return hasDepart;
    if (k === "inclusions") return (pkg.includes?.length ?? 0) > 0 || !!findSec(pkg, "inclusions");
    return !!findSec(pkg, k);
  };
  const presentKeys = SEC_ORDER.filter(presentSec);
  const EN_LET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const AR_LET = ["أ", "ب", "ج", "د", "ه", "و", "ز", "ح", "ط", "ي", "ك", "ل", "م", "ن", "س", "ع", "ف", "ص", "ق"];
  const folio = (k: string) => { const i = presentKeys.indexOf(k); return i < 0 ? "" : (rtl ? AR_LET[i] || dig(i + 1) : EN_LET[i] || String(i + 1)); };

  // hero stats from real facts
  const heroStats: { k: string; v: string }[] = [
    nightsN ? { k: ar("Duration", "المدة"), v: `${dig(nightsN)} ${L.ui.nights}` } : null,
    totalKm > 0 ? { k: ar("Distance", "المسافة"), v: `${dig(Math.round(totalKm))} ${ar("km", "كم")}` } : null,
    itinDays.length ? { k: ar("Stages", "المراحل"), v: dig(itinDays.length) } : null,
    pkg.rating != null ? { k: ar("Rated", "التقييم"), v: dig(pkg.rating) } : null,
  ].filter(Boolean).slice(0, 4) as { k: string; v: string }[];

  // ---- atoms ----
  const Tick = ({ color = brand }: { color?: string }) => (<span style={{ fontFamily: mono, fontSize: 10, color, letterSpacing: rtl ? 0 : "1px" }}>＋</span>);
  const Mono = ({ children, color = FAINT, size }: { children: React.ReactNode; color?: string; size?: number }) => (
    <span style={{ fontFamily: mono, fontSize: size || (D ? 11 : 10), fontWeight: 400, letterSpacing: rtl ? 0 : "1.5px", textTransform: up, color }}>{children}</span>
  );
  const Primary = ({ children, full, big, ghost, onClick }: { children: React.ReactNode; full?: boolean; big?: boolean; ghost?: boolean; onClick?: () => void }) => (
    <button data-testid="wa-cta" onClick={onClick} style={{ fontFamily: disp, background: ghost ? "transparent" : brand, color: ghost ? brand : onBrand, border: ghost ? `1.5px solid ${brand}` : "none", borderRadius: 2, padding: big ? "16px 30px" : "12px 22px", fontSize: D ? 13 : 12, fontWeight: 700, letterSpacing: rtl ? 0 : "0.6px", textTransform: up, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, width: full ? "100%" : "auto" }}>
      {!ghost && <WAIcon s={14} fill={onBrand} />} {children}
    </button>
  );
  const H2 = ({ children, size, light }: { children: React.ReactNode; size?: number; light?: boolean }) => (
    <h2 style={{ fontFamily: disp, fontSize: size || (D ? 46 : 30), fontWeight: 800, lineHeight: 1.0, letterSpacing: rtl ? 0 : "-1px", textTransform: up, color: light ? "#fff" : INK, margin: 0 }}>{children}</h2>
  );
  const Wrap = ({ children, pt, pb, style, id, section }: { children: React.ReactNode; pt?: number; pb?: number; style?: React.CSSProperties; id?: string; section?: string }) => (
    <section id={id} data-pmx-section={section} style={{ scrollMarginTop: D ? 58 : 52, padding: `${pt != null ? pt : (D ? 82 : 46)}px ${px}px ${pb != null ? pb : (D ? 82 : 46)}px`, ...style }}>{children}</section>
  );
  const SecHead = ({ k, kicker, title: t, sub, light }: { k: string; kicker: string; title: string; sub?: string; light?: boolean }) => (
    <div style={{ marginBottom: D ? 40 : 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <span style={{ width: 26, height: 26, border: `1.5px solid ${brand}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: mono, fontSize: 11, color: brand, borderRadius: 2 }}>{folio(k)}</span>
        <Mono color={brand}>{kicker}</Mono>
        <span style={{ flex: 1, height: 1, background: light ? "rgba(255,255,255,0.2)" : RULE }} />
      </div>
      <H2 light={light}>{t}</H2>
      {sub && <p style={{ fontFamily: body, fontSize: D ? 17 : 15, color: light ? "rgba(255,255,255,0.75)" : MUT, lineHeight: 1.6, margin: `${D ? 14 : 10}px 0 0`, maxWidth: 640 }}>{sub}</p>}
    </div>
  );
  const ElevProfile = ({ height, vals }: { height: number; vals: number[] }) => {
    const max = Math.max(...vals, 1);
    const W = 1000, H = 200, pad = 8, n = vals.length;
    const pts = vals.map((v, i) => {
      const x = pad + (i * (W - pad * 2)) / Math.max(n - 1, 1);
      const y = H - pad - (v / max) * (H - pad * 2);
      return [rtl ? W - x : x, y] as [number, number];
    });
    const line = pts.map((p, i) => `${i ? "L" : "M"} ${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
    const area = `${line} L ${pts[n - 1][0].toFixed(1)} ${H} L ${pts[0][0].toFixed(1)} ${H} Z`;
    return (
      <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ width: "100%", height, display: "block" }}>
        <path d={area} fill={coRgba(brand, 0.12)} />
        <path d={line} fill="none" stroke={brand} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {pts.map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r="5" fill={CARD} stroke={brand} strokeWidth="3" />)}
      </svg>
    );
  };

  // ════════ HERO ════════
  const Hero = () => (
    <div data-pmx-section="hero" style={{ position: "relative", background: SLATE }}>
      <div style={{ position: "relative", minHeight: D ? 620 : 540, overflow: "hidden" }}>
        {cover && <img src={cover} alt="" onClick={() => zoom(cover)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.55, cursor: "zoom-in" }} />}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: GRID, backgroundSize: "44px 44px" }} />
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(to bottom, rgba(15,20,16,0.55), rgba(15,20,16,0.35) 45%, rgba(15,20,16,0.9))" }} />
        <div style={{ position: "absolute", insetInline: px, top: D ? 26 : 18, display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff", pointerEvents: "none" }}>
          <Mono color="rgba(255,255,255,0.85)"><span data-pmx-field="destination">{pkg.destination}</span></Mono>
          {nightsN != null && <Mono color="rgba(255,255,255,0.85)">{dig(nightsN)} {L.ui.nights}</Mono>}
        </div>
        <div style={{ position: "absolute", insetInline: px, bottom: D ? 38 : 26, color: "#fff", pointerEvents: "none" }}>
          <div style={{ marginBottom: 14 }}><Mono color={brLight} size={D ? 12 : 11}>● {pkg.destination}</Mono></div>
          <h1 style={{ fontFamily: disp, fontSize: D ? 80 : 44, fontWeight: 800, lineHeight: rtl ? 1.12 : 0.94, letterSpacing: rtl ? 0 : "-2px", textTransform: up, margin: 0 }} data-pmx-field="title">{title}</h1>
          {pkg.description && <p style={{ fontFamily: body, fontSize: D ? 18 : 15, color: "rgba(255,255,255,0.82)", lineHeight: 1.6, margin: "18px 0 0", maxWidth: 600 }}>{pkg.description}</p>}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: D ? `repeat(${heroStats.length},1fr) auto` : (heroStats.length >= 4 ? "repeat(2,1fr)" : `repeat(${heroStats.length || 1},1fr)`), borderTop: `1px solid rgba(255,255,255,0.12)` }}>
        {heroStats.map((s, i) => (
          <div key={i} style={{ padding: D ? "22px 28px" : "16px 20px", borderInlineEnd: (i < heroStats.length - 1) ? `1px solid rgba(255,255,255,0.12)` : "none", borderBottom: (!D && heroStats.length >= 4 && i < 2) ? `1px solid rgba(255,255,255,0.12)` : "none" }}>
            <Mono color="rgba(255,255,255,0.5)">{s.k}</Mono>
            <div style={{ fontFamily: disp, fontSize: D ? 30 : 24, fontWeight: 800, color: "#fff", marginTop: 6, letterSpacing: rtl ? 0 : "-0.5px" }}>{s.v}</div>
          </div>
        ))}
        <div style={{ padding: D ? "22px 28px" : "18px 20px", display: "flex", alignItems: "center", gridColumn: D ? "auto" : "1 / -1", borderTop: D ? "none" : `1px solid rgba(255,255,255,0.12)`, background: brand }}>
          <div style={{ width: "100%" }}>
            <Mono color={coRgba(onBrand, 0.7)}>{L.ui.from}</Mono>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, marginTop: 6 }}>
              <span style={{ fontFamily: disp, fontSize: D ? 30 : 24, fontWeight: 800, color: onBrand }} data-pmx-field="price">{dig(pkg.price || "")}</span>
              {pkg.whatsapp && <Primary onClick={onWhatsApp}>{L.ui.book}</Primary>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // ════════ HIGHLIGHTS ════════
  const Highlights = () => {
    const items = secMixed(findSec(pkg, "highlights"), "items");
    if (!items.length) return null;
    return (
      <Wrap section="highlights">
        <SecHead k="highlights" kicker={L.nav.highlights} title={ar("Why this route", "لماذا هذا المسار")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(2,1fr)" : "1fr", gap: 0 }}>
          {items.map((h, i) => {
            const t = secItemStr(h, "title", "text", "label");
            const d = typeof h === "object" ? secItemStr(h, "desc", "description") : "";
            return (
              <div key={i} style={{ display: "flex", gap: 18, padding: D ? "26px 0" : "20px 0", borderTop: `1px solid ${RULE}`, borderInlineEnd: (D && i % 2 === 0) ? `1px solid ${RULE}` : "none", paddingInlineEnd: (D && i % 2 === 0) ? 40 : 0, paddingInlineStart: (D && i % 2 === 1) ? 40 : 0, alignItems: "flex-start" }}>
                <span style={{ fontFamily: disp, fontSize: D ? 28 : 24, fontWeight: 800, color: brand, lineHeight: 1, minWidth: 42 }}>{dig(`0${i + 1}`.slice(-2))}</span>
                <div>
                  <div style={{ fontFamily: disp, fontSize: D ? 21 : 18, fontWeight: 700, color: INK, textTransform: up, letterSpacing: rtl ? 0 : "-0.3px", marginBottom: d ? 7 : 0 }}>{t}</div>
                  {d && <div style={{ fontFamily: body, fontSize: 14.5, color: MUT, lineHeight: 1.65 }}>{d}</div>}
                </div>
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
    const imgs = mediaImgs;
    const video = secStr(m, "videoUrl") || pkg.videoUrl || "";
    const mapImage = secStr(m, "mapImage");
    const mapCaption = secStr(m, "mapCaption");
    if (!imgs.length && !video && !mapImage) return null;
    const tiles = imgs.slice(0, D ? 3 : 2);
    const stops = mapImage ? [] : itinDays.slice(0, 6).map((d) => ({ label: secItemStr(d, "title") })).filter((s) => s.label);
    const showElev = hasElev;
    return (
      <Wrap style={{ background: CARD }} section="media">
        <SecHead k="media" kicker={L.sections.media} title={ar("From the trail", "من المسار")} />
        {video && <CoVideo src={video} poster={cover || imgs[0]} accent={brand} rtl={rtl} sans={body} height={D ? 440 : 250} ui={L.ui} />}
        {tiles.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "repeat(2,1fr)", gap: D ? 12 : 8, marginTop: video ? (D ? 14 : 8) : 0 }}>
            {tiles.map((u, k) => <img key={k} src={u} onClick={() => zoom(u)} style={{ width: "100%", height: D ? 180 : 130, objectFit: "cover", display: "block", borderRadius: 2, cursor: "zoom-in" }} />)}
          </div>
        )}
        {(mapImage || stops.length > 0 || showElev) && (
          <div style={{ display: "grid", gridTemplateColumns: D && showElev ? "1.3fr 1fr" : "1fr", gap: D ? 24 : 16, marginTop: D ? 28 : 18 }}>
            {(mapImage || stops.length > 0) && (
              <div style={{ border: `1px solid ${RULE}`, borderRadius: 2, background: PAPER, padding: D ? 18 : 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <Mono color={brand}>{L.ui.route}</Mono>
                  {(totalKm > 0 || itinDays.length > 0) && <Mono>{totalKm > 0 ? `${dig(Math.round(totalKm))} ${ar("km", "كم")} · ` : ""}{dig(itinDays.length)} {L.ui.stages}</Mono>}
                </div>
                {mapImage
                  ? <img src={mapImage} alt={mapCaption} style={{ width: "100%", height: D ? 200 : 150, objectFit: "cover", borderRadius: 2, display: "block" }} />
                  : <CoRouteMap stops={stops} line={brand} land={coLighten(brand, 0.82)} ink={INK} height={D ? 200 : 150} rtl={rtl} />}
              </div>
            )}
            {showElev && (
              <div style={{ border: `1px solid ${RULE}`, borderRadius: 2, background: PAPER, padding: D ? 18 : 14, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <Mono color={brand}>{L.ui.elevation}</Mono>
                  <Mono>{ar("metres", "أمتار")}</Mono>
                </div>
                <div style={{ flex: 1, display: "flex", alignItems: "flex-end" }}><ElevProfile height={D ? 150 : 110} vals={alts} /></div>
              </div>
            )}
          </div>
        )}
        {mapCaption && <div style={{ fontFamily: mono, fontSize: 11, color: FAINT, marginTop: 12, letterSpacing: rtl ? 0 : "0.5px" }}>{mapCaption}</div>}
      </Wrap>
    );
  };

  // ════════ ITINERARY ════════
  const Itinerary = () => {
    if (!itinDays.length) return null;
    const Chip = ({ label, value }: { label: string; value: string }) => (
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Mono size={9.5}>{label}</Mono>
        <span style={{ fontFamily: mono, fontSize: D ? 14 : 12.5, fontWeight: 700, color: INK }}>{value}</span>
      </div>
    );
    return (
      <Wrap section="itinerary">
        <SecHead k="itinerary" kicker={L.sections.itinerary} title={ar(`${itinDays.length} days, mapped`, `${dig(itinDays.length)} أيام، بخريطة`)} />
        <div style={{ display: "flex", flexDirection: "column", gap: D ? 10 : 8 }}>
          {itinDays.map((it, i) => {
            const km = secNum(it, "km"); const alt = secNum(it, "alt");
            const hasMetrics = km != null || alt != null;
            return (
              <div key={i} style={{ border: `1px solid ${RULE}`, borderRadius: 2, background: CARD, padding: D ? "20px 24px" : "16px 18px", display: "grid", gridTemplateColumns: D && hasMetrics ? "auto 1fr auto" : "auto 1fr", gap: D ? 24 : 12, alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <span style={{ fontFamily: disp, fontSize: D ? 30 : 24, fontWeight: 800, color: brand, lineHeight: 1 }}>{rtl ? dig((it.day as number) ?? i + 1) : String((it.day as number) ?? i + 1).padStart(2, "0")}</span>
                </div>
                <div>
                  <div style={{ fontFamily: disp, fontSize: D ? 19 : 17, fontWeight: 700, color: INK, textTransform: up, letterSpacing: rtl ? 0 : "-0.3px" }}>{secItemStr(it, "title")}</div>
                  {secItemStr(it, "desc", "description") && <div style={{ fontFamily: body, fontSize: 13.5, color: MUT, lineHeight: 1.55, marginTop: 4 }}>{secItemStr(it, "desc", "description")}</div>}
                </div>
                {hasMetrics && (
                  <div style={{ display: "flex", gap: D ? 24 : 18, paddingInlineStart: D ? 24 : 0, borderInlineStart: D ? `1px solid ${RULE}` : "none", paddingTop: D ? 0 : 10, borderTop: D ? "none" : `1px solid ${RULE}`, gridColumn: D ? "auto" : "1 / -1" }}>
                    {km != null && <Chip label={L.ui.dist} value={`${dig(km)} ${ar("km", "كم")}`} />}
                    {alt != null && <Chip label={L.ui.gain} value={`${dig(alt)} ${ar("m", "م")}`} />}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Wrap>
    );
  };

  // ════════ HOTEL ════════
  const Hotel = () => {
    const h = findSec(pkg, "hotel");
    const rich = findSec(pkg, "hotels");
    const richList = secArr(rich, "hotels").length ? secArr(rich, "hotels") : secArr(rich, "items");
    const r0 = richList[0];
    const name = r0 ? secItemStr(r0, "name") : "";
    const stars = r0 && typeof r0.stars === "number" ? (r0.stars as number) : 0;
    const blurb = (r0 ? secItemStr(r0, "note", "description", "blurb") : "") || secStr(h, "description") || pkg.hotelDescription || "";
    const features = r0 ? secStrArr(r0, "facilities").concat(secStrArr(r0, "features")) : [];
    const hutNames = richList.length > 1 ? richList.map((r) => secItemStr(r, "name")).filter(Boolean) : [];
    if (!blurb && !name) return null;
    const img = mediaImgs[4] || mediaImgs[1] || mediaImgs[0] || cover;
    return (
      <Wrap style={{ background: SLATE, color: "#fff" }} section="hotel">
        <SecHead k="hotel" kicker={L.sections.hotel} title={name || ar("Where you'll stay", "مكان إقامتك")} light />
        <div style={{ display: "grid", gridTemplateColumns: D && img ? "1.1fr 1fr" : "1fr", gap: D ? 40 : 22, alignItems: "center" }}>
          <div>
            {stars > 0 && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid rgba(255,255,255,0.2)`, borderRadius: 2, padding: "6px 12px", marginBottom: 18 }}>
                <CoStars n={stars} size={12} color={brLight} /><Mono color="rgba(255,255,255,0.8)">{dig(stars)} {ar("star", "نجوم")}</Mono>
              </div>
            )}
            {blurb && <p style={{ fontFamily: body, fontSize: D ? 16 : 14.5, color: "rgba(255,255,255,0.82)", lineHeight: 1.75, margin: 0, whiteSpace: "pre-line" }}>{blurb}</p>}
            {hutNames.length > 0 && (
              <div style={{ display: "flex", gap: 0, marginTop: 24, border: `1px solid rgba(255,255,255,0.15)`, borderRadius: 2, overflow: "hidden" }}>
                {hutNames.map((hut, i) => (
                  <div key={i} style={{ flex: 1, padding: D ? "14px 10px" : "12px 6px", textAlign: "center", borderInlineEnd: i < hutNames.length - 1 ? `1px solid rgba(255,255,255,0.15)` : "none" }}>
                    <Mono color={brLight} size={9.5}>{dig(`0${i + 1}`.slice(-2))}</Mono>
                    <div style={{ fontFamily: disp, fontSize: D ? 14 : 12, fontWeight: 700, color: "#fff", textTransform: up, marginTop: 4, letterSpacing: rtl ? 0 : "-0.2px" }}>{hut}</div>
                  </div>
                ))}
              </div>
            )}
            {features.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 18px", marginTop: 20 }}>
                {features.map((f, i) => <div key={i} style={{ display: "flex", gap: 9, alignItems: "baseline", fontFamily: body, fontSize: 13.5, color: "rgba(255,255,255,0.85)" }}><Tick color={brLight} /> {f}</div>)}
              </div>
            )}
          </div>
          {img && <img src={img} alt="" onClick={() => zoom(img)} style={{ width: "100%", height: D ? 380 : 230, objectFit: "cover", display: "block", borderRadius: 2, cursor: "zoom-in" }} />}
        </div>
      </Wrap>
    );
  };

  // ════════ INCLUSIONS ════════
  const Inclusions = () => {
    const inc = findSec(pkg, "inclusions");
    const includes = secStrArr(inc, "includes").length ? secStrArr(inc, "includes") : (pkg.includes ?? []);
    const excludes = secStrArr(inc, "excludes").length ? secStrArr(inc, "excludes") : (pkg.excludes ?? []);
    if (!includes.length && !excludes.length) return null;
    return (
      <Wrap section="inclusions">
        <SecHead k="inclusions" kicker={L.sections.inclusions} title={ar("On the manifest", "المشمول")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 48 : 28 }}>
          {includes.length > 0 && (
            <div>
              <div style={{ marginBottom: 14 }}><Mono color={brand}>✓ {L.ui.included}</Mono></div>
              {includes.map((it, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "11px 0", borderTop: `1px solid ${RULE}`, alignItems: "flex-start" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={brand} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}><path d="M20 6L9 17l-5-5" /></svg>
                  <span style={{ fontFamily: body, fontSize: 14.5, color: INK, lineHeight: 1.5 }}>{it}</span>
                </div>
              ))}
            </div>
          )}
          {excludes.length > 0 && (
            <div>
              <div style={{ marginBottom: 14 }}><Mono color={FAINT}>✕ {L.ui.notIncluded}</Mono></div>
              {excludes.map((it, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "11px 0", borderTop: `1px solid ${RULE}`, alignItems: "flex-start" }}>
                  <span style={{ color: FAINT, fontSize: 15, lineHeight: 1.3, flexShrink: 0, fontFamily: mono }}>×</span>
                  <span style={{ fontFamily: body, fontSize: 14.5, color: MUT, lineHeight: 1.5 }}>{it}</span>
                </div>
              ))}
            </div>
          )}
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
    const planLabel = MEAL_LABELS[plan]?.[lang] || plan || ar("Dining", "الطعام");
    return (
      <Wrap style={{ background: CARD }} section="meals">
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1.1fr" : "1fr", gap: D ? 48 : 24 }}>
          <SecHead k="meals" kicker={L.sections.meals} title={planLabel} />
          {notes && <p style={{ fontFamily: body, fontSize: D ? 16 : 14.5, color: MUT, lineHeight: 1.75, margin: 0, alignSelf: "center", whiteSpace: "pre-line" }}>{notes}</p>}
        </div>
      </Wrap>
    );
  };

  // ════════ VISA ════════
  const Visa = () => {
    const v = findSec(pkg, "visa");
    const included = secStr(v, "included");
    const content = secStr(v, "content");
    if (!included && !content) return null;
    return (
      <Wrap section="visa">
        <SecHead k="visa" kicker={L.sections.visa} title={VISA_HEAD[included]?.[lang] || ar("Visa & entry", "التأشيرة والدخول")} />
        {content && <p style={{ fontFamily: body, fontSize: 14.5, color: MUT, lineHeight: 1.75, margin: 0, maxWidth: 760, whiteSpace: "pre-line" }}>{content}</p>}
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
      <Wrap style={{ background: CARD }} section="transfers">
        <SecHead k="transfers" kicker={L.sections.transfers} title={ar("Getting there & around", "الوصول والتنقّل")} sub={items.length ? undefined : desc} />
        {items.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 12 : 10 }}>
            {items.map((t, i) => (
              <div key={i} style={{ border: `1px solid ${RULE}`, borderRadius: 2, background: PAPER, padding: D ? 24 : 20 }}>
                <Mono color={brand}>{dig(`0${i + 1}`.slice(-2))}</Mono>
                <div style={{ fontFamily: disp, fontSize: D ? 18 : 16, fontWeight: 700, color: INK, textTransform: up, letterSpacing: rtl ? 0 : "-0.3px", margin: "10px 0 6px" }}>{secItemStr(t, "leg", "title", "name", "text")}</div>
                {typeof t === "object" && secItemStr(t, "desc", "description") && <div style={{ fontFamily: body, fontSize: 13.5, color: MUT, lineHeight: 1.6 }}>{secItemStr(t, "desc", "description")}</div>}
              </div>
            ))}
          </div>
        )}
      </Wrap>
    );
  };

  // ════════ DEPARTURES ════════
  const Departures = () => {
    const rows = depEntries.length ? depEntries : (pkg.departures ?? []).map((d) => ({ date: d.date, price: d.price, spots: d.spots } as SecData));
    if (!rows.length) return null;
    const chip = (spots: number) => {
      if (spots <= 0) return <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: AMBER, letterSpacing: rtl ? 0 : "1px", textTransform: up }}>{L.ui.soldOut}</span>;
      const col = spots <= 3 ? AMBER : brand;
      return <span style={{ fontFamily: mono, fontSize: 11, fontWeight: 700, color: col, letterSpacing: rtl ? 0 : "0.5px" }}>{dig(spots)} {L.ui.seatsLeft}</span>;
    };
    return (
      <Wrap id="co-departures" section="departures">
        <SecHead k="departures" kicker={L.sections.departures} title={ar("Departure windows", "مواعيد المغادرة")} />
        {D ? (
          <div style={{ border: `1px solid ${RULE}`, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.2fr 1fr 0.9fr auto", padding: "14px 22px", background: SLATE }}>
              {[L.ui.from, L.ui.date, L.ui.flight, L.ui.availability, L.ui.price, ""].map((h, i) => <Mono key={i} color="rgba(255,255,255,0.6)">{h}</Mono>)}
            </div>
            {rows.map((r, i) => {
              const spots = typeof r.spots === "number" ? r.spots : Number(r.spots) || 0; const sold = spots <= 0;
              const from = secItemStr(r, "origin", "from"); const date = secItemStr(r, "date");
              const dep = secItemStr(r, "flyingTime"); const arrt = secItemStr(r, "arrivingTime"); const price = secItemStr(r, "price");
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.2fr 1fr 0.9fr auto", padding: "18px 22px", alignItems: "center", borderBottom: i < rows.length - 1 ? `1px solid ${RULE}` : "none", background: sold ? coRgba("#000000", 0.03) : CARD, opacity: sold ? 0.6 : 1 }}>
                  <div style={{ fontFamily: disp, fontSize: 17, fontWeight: 700, color: INK, textTransform: up, letterSpacing: rtl ? 0 : "-0.3px" }}>{from || dig(date)}</div>
                  <Mono color={MUT}>{dig(date)}</Mono>
                  <Mono color={MUT}>{dep ? `${dig(dep)}${arrt ? `–${dig(arrt)}` : ""}` : "—"}</Mono>
                  <div>{chip(spots)}</div>
                  <div style={{ fontFamily: disp, fontSize: 18, fontWeight: 800, color: brand, textAlign: "end" }}>{dig(price)}</div>
                  <div style={{ textAlign: "end", paddingInlineStart: 16 }}>{sold ? <Mono color={FAINT}>—</Mono> : (pkg.whatsapp ? <Primary onClick={onWhatsApp}>{L.ui.book}</Primary> : null)}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {rows.map((r, i) => {
              const spots = typeof r.spots === "number" ? r.spots : Number(r.spots) || 0; const sold = spots <= 0;
              const from = secItemStr(r, "origin", "from"); const date = secItemStr(r, "date"); const price = secItemStr(r, "price");
              return (
                <div key={i} style={{ border: `1px solid ${RULE}`, borderRadius: 2, padding: 16, background: CARD, opacity: sold ? 0.6 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontFamily: disp, fontSize: 17, fontWeight: 700, color: INK, textTransform: up }}>{from || dig(date)}</div>
                    {price && <div style={{ fontFamily: disp, fontSize: 19, fontWeight: 800, color: brand }}>{dig(price)}</div>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
                    <Mono color={MUT}>{dig(date)}</Mono>{chip(spots)}
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
    const cancellation = lines(secStr(pr, "cancellation") || pkg.cancellation || "");
    const schedule = secArr(pr, "paymentSteps");
    if (!tiers.length && !cancellation.length && !schedule.length) return null;
    return (
      <Wrap style={{ background: CARD }} id="co-pricing" section="pricing">
        <SecHead k="pricing" kicker={L.sections.pricing} title={ar("Pick your tier", "اختر فئتك")} />
        {tiers.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? `repeat(${Math.min(tiers.length, 3)},1fr)` : "1fr", gap: D ? 12 : 10 }}>
            {tiers.map((t, i) => {
              const featured = tiers.length === 3 && i === 1;
              return (
                <div key={i} style={{ background: featured ? SLATE : PAPER, color: featured ? "#fff" : INK, border: `1px solid ${featured ? SLATE : RULE}`, borderRadius: 2, padding: D ? 28 : 22 }}>
                  {featured && <div style={{ marginBottom: 10 }}><Mono color={brLight}>★ {L.ui.mostPopular}</Mono></div>}
                  <div style={{ fontFamily: disp, fontSize: D ? 20 : 18, fontWeight: 700, textTransform: up, letterSpacing: rtl ? 0 : "-0.3px" }}>{localizeTierLabel(t.label, lang)}</div>
                  <div style={{ fontFamily: disp, fontSize: D ? 42 : 34, fontWeight: 800, marginTop: 16, color: featured ? "#fff" : brand }}>{dig(t.price)}</div>
                  <div style={{ marginTop: 8 }}><Mono color={featured ? "rgba(255,255,255,0.5)" : FAINT}>{L.ui.perPerson}</Mono></div>
                  {pkg.whatsapp && <div style={{ marginTop: 20 }}><Primary full ghost={!featured} onClick={onWhatsApp}>{L.ui.book}</Primary></div>}
                </div>
              );
            })}
          </div>
        )}
        {(cancellation.length > 0 || schedule.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 40 : 22, marginTop: tiers.length ? 36 : 0 }}>
            {cancellation.length > 0 && (
              <div>
                <div style={{ marginBottom: 10 }}><Mono color={brand}>{L.ui.cancellation}</Mono></div>
                {cancellation.map((s, i) => <div key={i} style={{ fontFamily: body, fontSize: 13.5, color: MUT, padding: "8px 0", lineHeight: 1.5, borderTop: `1px solid ${RULE}`, display: "flex", gap: 10 }}><Tick /> {s}</div>)}
              </div>
            )}
            {schedule.length > 0 && (
              <div>
                <div style={{ marginBottom: 10 }}><Mono color={brand}>{L.ui.paymentSchedule}</Mono></div>
                {schedule.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${RULE}` }}>
                    <span style={{ fontFamily: body, fontSize: 13.5, color: INK }}>{secItemStr(s, "dueDate", "label")}</span><span style={{ fontFamily: disp, fontSize: 16, fontWeight: 800, color: brand }}>{dig(secItemStr(s, "amount"))}</span>
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
      <Wrap section="extras">
        <SecHead k="extras" kicker={L.sections.extras} title={ar("Add-ons & gear", "إضافات ومعدّات")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 12 : 10 }}>
          {items.map((e, i) => (
            <div key={i} style={{ border: `1px solid ${RULE}`, borderRadius: 2, background: CARD, padding: D ? 24 : 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
                <div style={{ fontFamily: disp, fontSize: D ? 18 : 16, fontWeight: 700, color: INK, textTransform: up, letterSpacing: rtl ? 0 : "-0.3px" }}>{secItemStr(e, "name", "title")}</div>
                {secItemStr(e, "price") && <span style={{ fontFamily: disp, fontSize: D ? 18 : 16, fontWeight: 800, color: brand, whiteSpace: "nowrap" }}>{dig(secItemStr(e, "price"))}</span>}
              </div>
              {secItemStr(e, "description", "desc") && <div style={{ fontFamily: body, fontSize: 13.5, color: MUT, lineHeight: 1.6 }}>{secItemStr(e, "description", "desc")}</div>}
            </div>
          ))}
        </div>
      </Wrap>
    );
  };

  // ════════ SCARCITY ════════
  const Scarcity = () => {
    const sc = pkg.scarcity;
    if (!sc || sc.spotsRemaining == null) return null;
    const total = sc.totalSpots && sc.totalSpots > 0 ? sc.totalSpots : Math.max(sc.spotsRemaining, 12);
    const pct = Math.round(((total - sc.spotsRemaining) / total) * 100);
    return (
      <Wrap style={{ background: SLATE, color: "#fff" }} section="scarcity">
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 48 : 24, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, border: `1px solid ${AMBER}`, borderRadius: 2, padding: "6px 12px", marginBottom: 18 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: AMBER }} /><Mono color={AMBER}>{L.sections.scarcity}</Mono>
            </div>
            <h2 style={{ fontFamily: disp, fontSize: D ? 34 : 25, fontWeight: 800, lineHeight: 1.15, textTransform: up, letterSpacing: rtl ? 0 : "-0.8px", margin: 0 }}>{L.ui.spotsLine(sc.spotsRemaining)}</h2>
            <p style={{ fontFamily: body, fontSize: D ? 16 : 14.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.7, margin: "18px 0 0" }}>{L.ui.scarcityWindow}</p>
          </div>
          <div style={{ border: `1px solid rgba(255,255,255,0.15)`, borderRadius: 2, padding: D ? 30 : 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div><div style={{ fontFamily: disp, fontSize: D ? 56 : 42, fontWeight: 800, color: brLight, lineHeight: 1 }}>{dig(sc.spotsRemaining)}</div><Mono color="rgba(255,255,255,0.55)">{L.ui.seatsLeft} / {dig(total)}</Mono></div>
              {sc.firstDepartureDate && <div style={{ textAlign: "end" }}><Mono color="rgba(255,255,255,0.55)">{L.ui.nextDeparture}</Mono><div style={{ fontFamily: disp, fontSize: D ? 22 : 18, fontWeight: 800, color: "#fff", marginTop: 4 }}>{dig(sc.firstDepartureDate)}</div></div>}
            </div>
            <div style={{ height: 8, borderRadius: 2, background: "rgba(255,255,255,0.12)", overflow: "hidden", marginTop: 18 }}><div style={{ width: `${pct}%`, height: "100%", background: AMBER }} /></div>
            {pkg.whatsapp && <div style={{ marginTop: 18 }}><Primary full big onClick={onWhatsApp}>{ar("Hold a spot", "احجز مقعدًا")}</Primary></div>}
          </div>
        </div>
      </Wrap>
    );
  };

  // ════════ PEOPLE ════════
  const People = () => {
    if (!person?.name) return null;
    const role = person.role ? (ROLE_LABELS[person.role]?.[lang] || person.role.replace(/_/g, " ")) : "";
    const bio = (person as { bio?: string }).bio || "";
    const years = typeof person.years === "number" ? person.years : 0;
    return (
      <Wrap section="people">
        <SecHead k="people" kicker={L.sections.people} title={ar("Your guide", "مرشدك")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "auto 1fr" : "1fr", gap: D ? 40 : 22, alignItems: "start" }}>
          {person.photo
            ? <img src={person.photo} alt="" style={{ width: D ? 220 : 160, height: D ? 270 : 200, objectFit: "cover", display: "block", borderRadius: 2 }} />
            : <div style={{ width: D ? 220 : 160, height: D ? 270 : 200, background: CARD, border: `1px solid ${RULE}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: disp, fontSize: D ? 80 : 56, fontWeight: 800, color: brand }}>{person.name[0]}</div>}
          <div>
            <div style={{ fontFamily: disp, fontSize: D ? 34 : 26, fontWeight: 800, color: INK, textTransform: up, letterSpacing: rtl ? 0 : "-0.8px" }}>{person.name}</div>
            {role && <div style={{ marginTop: 6 }}><Mono color={brand}>{role}</Mono></div>}
            {bio && <p style={{ fontFamily: body, fontSize: 14.5, color: MUT, lineHeight: 1.75, marginTop: 16 }}>{bio}</p>}
            {years > 0 && (
              <div style={{ display: "flex", gap: 40, marginTop: 22, borderTop: `1px solid ${RULE}`, paddingTop: 18 }}>
                <div><div style={{ fontFamily: disp, fontSize: 28, fontWeight: 800, color: brand }}>{dig(years)}</div><Mono>{L.ui.years}</Mono></div>
              </div>
            )}
            {pkg.whatsapp && <div style={{ marginTop: 20 }}><Primary onClick={onWhatsApp}>{L.ui.message}</Primary></div>}
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
      <Wrap style={{ background: CARD }} id="co-reviews" section="reviews">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <SecHead k="reviews" kicker={L.sections.reviews} title={ar("Trail reports", "تقارير المسار")} />
          <div style={{ textAlign: "end", marginBottom: D ? 40 : 26 }}>
            <div style={{ fontFamily: disp, fontSize: D ? 50 : 40, fontWeight: 800, color: brand, lineHeight: 1 }}>{dig(rating)}</div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}><CoStars n={Math.round(rating)} size={14} color={brand} /></div>
            <div style={{ marginTop: 6 }}><Mono>{L.ui.basedOn} {dig(count)} {L.ui.review}</Mono></div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 12 : 10 }}>
          {items.slice(0, 6).map((r, i) => (
            <div key={i} style={{ border: `1px solid ${RULE}`, borderRadius: 2, background: PAPER, padding: D ? 26 : 22 }}>
              <CoStars n={Math.round(r.rating || 5)} size={13} color={brand} />
              <p style={{ fontFamily: body, fontSize: D ? 16 : 15, color: INK, lineHeight: 1.6, margin: "12px 0 16px" }}>&ldquo;{r.text}&rdquo;</p>
              <div style={{ fontFamily: disp, fontSize: 13, fontWeight: 700, color: INK, textTransform: up, letterSpacing: rtl ? 0 : "-0.2px" }}>{r.name}</div>
            </div>
          ))}
        </div>
      </Wrap>
    );
  };

  // ════════ ABOUT ════════
  const About = () => {
    const a = findSec(pkg, "about_agency");
    const story = secStr(a, "content");
    const image = secStr(a, "image");
    if (!a || (!story && !image)) return null;
    return (
      <Wrap section="about_agency">
        <SecHead k="about_agency" kicker={L.sections.agency} title={agency.name} sub={agency.tagline} />
        <div style={{ display: "grid", gridTemplateColumns: D && image ? "1.3fr 1fr" : "1fr", gap: D ? 48 : 24, alignItems: "start" }}>
          {story && <p style={{ fontFamily: body, fontSize: D ? 16 : 14.5, color: MUT, lineHeight: 1.85, margin: 0, whiteSpace: "pre-line" }}>{story}</p>}
          {image && <img src={image} alt="" style={{ width: "100%", height: D ? 300 : 220, objectFit: "cover", display: "block", borderRadius: 2 }} />}
        </div>
      </Wrap>
    );
  };

  // ════════ NOTES ════════
  const Notes = () => {
    const items = secMixed(findSec(pkg, "important_notes"), "items");
    if (!items.length) return null;
    return (
      <Wrap style={{ background: CARD }} section="important_notes">
        <SecHead k="important_notes" kicker={L.sections.notes} title={ar("Before you commit", "قبل أن تحجز")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 12 : 10 }}>
          {items.map((n, i) => {
            const t = secItemStr(n, "title");
            const body2 = secItemStr(n, "text", "desc", "description") || (typeof n === "string" ? n : "");
            return (
              <div key={i} style={{ border: `1px solid ${RULE}`, borderTop: `3px solid ${brand}`, borderRadius: 2, background: PAPER, padding: D ? 24 : 20 }}>
                {t && <div style={{ fontFamily: disp, fontSize: D ? 18 : 16, fontWeight: 700, color: INK, textTransform: up, letterSpacing: rtl ? 0 : "-0.3px", marginBottom: 6 }}>{t}</div>}
                <div style={{ fontFamily: body, fontSize: 13.5, color: MUT, lineHeight: 1.6 }}>{body2}</div>
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
        <SecHead k="faq" kicker={L.sections.faq} title={ar("Questions, answered", "إجابات على أسئلتك")} />
        <div>
          {items.map((f, i) => (
            <div key={i} style={{ padding: D ? "22px 0" : "18px 0", borderTop: `1px solid ${RULE}`, borderBottom: i === items.length - 1 ? `1px solid ${RULE}` : "none" }}>
              <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1.4fr" : "1fr", gap: D ? 40 : 8, alignItems: "baseline" }}>
                <div style={{ fontFamily: disp, fontSize: D ? 20 : 17, fontWeight: 700, color: INK, textTransform: up, letterSpacing: rtl ? 0 : "-0.3px", lineHeight: 1.25 }}>{secItemStr(f, "question", "q")}</div>
                {secItemStr(f, "answer", "a") && <p style={{ fontFamily: body, fontSize: 14.5, color: MUT, lineHeight: 1.7, margin: 0 }}>{secItemStr(f, "answer", "a")}</p>}
              </div>
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
    const text = secStr(cs, "content");
    const image = secStr(cs, "image") || cover;
    if (!heading && !text) return null;
    return (
      <Wrap style={{ background: SLATE, color: "#fff" }} section="custom">
        <div style={{ display: "grid", gridTemplateColumns: D && image ? "1.4fr 1fr" : "1fr", gap: D ? 48 : 22, alignItems: "center" }}>
          <div>
            <div style={{ marginBottom: 16 }}><Mono color={brLight}>{L.sections.custom}</Mono></div>
            {heading && <H2 light size={D ? 44 : 28}>{heading}</H2>}
            {text && <p style={{ fontFamily: body, fontSize: D ? 17 : 15, color: "rgba(255,255,255,0.82)", lineHeight: 1.75, margin: "18px 0 0", whiteSpace: "pre-line" }}>{text}</p>}
          </div>
          {image && <img src={image} alt="" style={{ width: "100%", height: D ? 320 : 200, objectFit: "cover", display: "block", borderRadius: 2 }} />}
        </div>
      </Wrap>
    );
  };

  // ════════ OTHERS ════════
  const Others = () => {
    const list = secArr(findSec(pkg, "other_packages"), "packages");
    if (!list.length) return null;
    return (
      <Wrap section="other_packages">
        <SecHead k="other_packages" kicker={L.sections.others} title={ar("More expeditions", "رحلات أخرى")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 16 : 14 }}>
          {list.map((o, i) => {
            const oTitle = secItemStr(o, "title"); const place = secItemStr(o, "destination", "place");
            const price = secItemStr(o, "price"); const oNights = secItemStr(o, "nights");
            const img = secItemStr(o, "image"); const link = secItemStr(o, "link");
            const Inner = (
              <div style={{ border: `1px solid ${RULE}`, borderRadius: 2, overflow: "hidden", background: CARD, height: "100%" }}>
                <div style={{ position: "relative", height: D ? 180 : 160, background: PAPER }}>
                  {img && <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                  {place && <div style={{ position: "absolute", insetInlineStart: 12, top: 12, background: SLATE, padding: "5px 10px" }}><Mono color="rgba(255,255,255,0.85)">{place}</Mono></div>}
                </div>
                <div style={{ padding: D ? 20 : 18 }}>
                  <div style={{ fontFamily: disp, fontSize: D ? 20 : 18, fontWeight: 700, color: INK, textTransform: up, letterSpacing: rtl ? 0 : "-0.4px", lineHeight: 1.1 }}>{oTitle}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: `1px solid ${RULE}`, paddingTop: 12, marginTop: 12 }}>
                    {price && <span style={{ fontFamily: disp, fontSize: 20, fontWeight: 800, color: brand }}>{dig(price)}</span>}
                    {oNights && <Mono>{dig(oNights)} {L.ui.nights}</Mono>}
                  </div>
                </div>
              </div>
            );
            return link ? <a key={i} href={link} style={{ textDecoration: "none" }}>{Inner}</a> : <div key={i}>{Inner}</div>;
          })}
        </div>
      </Wrap>
    );
  };

  // ════════ FOOTER ════════
  const Footer = () => (
    <div>
      <Wrap pt={D ? 76 : 46} pb={D ? 76 : 46} style={{ background: brand, color: onBrand, textAlign: "center" }}>
        {pkg.destination && <Mono color={coRgba(onBrand, 0.7)}>{pkg.destination}</Mono>}
        <div style={{ fontFamily: disp, fontSize: D ? 56 : 34, fontWeight: 800, lineHeight: 1.0, textTransform: up, letterSpacing: rtl ? 0 : "-1.5px", maxWidth: 760, margin: "14px auto 0" }}>{L.ui.begin}</div>
        <div style={{ fontFamily: body, fontSize: 14, opacity: 0.85, margin: "16px 0 26px" }}>{L.ui.replyTime}{pkg.whatsapp ? ` · ${dig(pkg.whatsapp)}` : ""}</div>
        <div style={{ display: "inline-flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {pkg.whatsapp && <button onClick={onWhatsApp} data-testid="wa-cta" style={{ fontFamily: disp, background: onBrand, color: brand, border: "none", borderRadius: 2, padding: "16px 30px", fontSize: D ? 13 : 12, fontWeight: 700, letterSpacing: rtl ? 0 : "0.6px", textTransform: up, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 9 }}><WAIcon s={14} fill={brand} /> {L.ui.bookWhatsapp}</button>}
          {pkg.messenger && onMessenger && <Primary big ghost onClick={onMessenger}>{L.ui.messenger}</Primary>}
        </div>
      </Wrap>
      <div style={{ padding: `22px ${px}px`, display: "flex", justifyContent: "space-between", alignItems: "center", background: SLATE }}>
        <div style={{ fontFamily: disp, fontSize: 18, fontWeight: 800, color: "#fff", textTransform: up, letterSpacing: rtl ? 0 : "-0.4px" }}>{agency.name}</div>
        <Mono color="rgba(255,255,255,0.5)">{L.ui.poweredBy}</Mono>
      </div>
    </div>
  );

  // ════════ BAR ════════
  const Bar = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${px}px`, height: D ? 58 : 52, borderBottom: `1px solid ${RULE}`, background: coRgba(PAPER, 0.92), backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 30 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 9, height: 9, background: brand }} />
        <span style={{ fontFamily: disp, fontSize: D ? 18 : 16, fontWeight: 800, color: INK, textTransform: up, letterSpacing: rtl ? 0 : "-0.4px" }}>{agency.name}</span>
      </div>
      {D ? (
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {navItems.map(([key, lbl]) => <button key={key} onClick={() => goTo(key)} style={{ fontFamily: mono, fontSize: 10.5, letterSpacing: rtl ? 0 : "1px", textTransform: up, color: MUT, background: "none", border: "none", cursor: "pointer", padding: 0 }}>{lbl}</button>)}
          {pkg.whatsapp && <Primary onClick={onWhatsApp}>{L.ui.book}</Primary>}
        </div>
      ) : (pkg.whatsapp && <Primary onClick={onWhatsApp}>{L.ui.book}</Primary>)}
    </div>
  );

  return (
    <div dir={rtl ? "rtl" : "ltr"} lang={lang} style={{ width: "100%", background: PAPER, color: INK, fontFamily: body, position: "relative" }}>
      {Bar()}
      {Hero()}
      {Highlights()}
      {Media()}
      {Itinerary()}
      {Hotel()}
      {Inclusions()}
      {Meals()}
      {Visa()}
      {Transfers()}
      {Departures()}
      {Pricing()}
      {Extras()}
      {Scarcity()}
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
export function TemplateCompassCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
