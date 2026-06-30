"use client";

// ═══════════════════════════════════════════════════════════════════════════
// ATLAS V2 — Premium curated · a print travel journal.
// Warm grey paper, letterpress ink, Playfair serif + Space Grotesk labels +
// Nunito body, a generated table of contents, folios, gallery "plates" with
// captions, generous editorial columns. Brand is a restrained accent.
// One component renders all 4 surfaces. Wired to real pkg.sections data.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useState } from "react";
import { useIsDesktop, BaseCard, LightboxCarousel } from "./shared";
import { localizeTierLabel } from "@/lib/translations";
import type { TPageProps, TCardProps, TPackage } from "./types";

type SecData = Record<string, unknown>;

// ─── Brand colour math ────────────────────────────────────────────────────────
function atHex(h: string): [number, number, number] {
  h = h.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function atRgba(hex: string, a: number): string { const [r, g, b] = atHex(hex); return `rgba(${r},${g},${b},${a})`; }
function atLum(hex: string) { const [r, g, b] = atHex(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
function atOn(hex: string) { return atLum(hex) > 0.62 ? "#1c1b17" : "#ffffff"; }

const ROMAN = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];

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
    reserve: "Reserve", enquire: "Request the dossier", bookWhatsapp: "Book on WhatsApp", messenger: "Email the editor",
    message: "Enquire", nextDeparture: "Next departure", date: "Date", depart: "Times", price: "Price",
    availability: "Availability", to: "To", cancellation: "Cancellation policy", paymentSchedule: "Payment schedule",
    basedOn: "based on", review: "reviews", stars: "stars", route: "Your route", years: "years",
    replyTime: "Usually replies within an hour", watch: "Watch the film", noVideo: "Video coming soon",
    play: "Play", pause: "Pause", mute: "Mute", unmute: "Unmute", poweredBy: "Powered by PackMetrix",
    contents: "Contents", inThisIssue: "In this issue", duration: "Duration", destination: "Destination",
    board: "Board", departuresK: "Departures", plate: "Plate", requestDossier: "Request the full dossier.",
    dossier: "Dossier", theAuthor: "The author", subscribe: "Plan with us",
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
    reserve: "احجز", enquire: "اطلب الملف", bookWhatsapp: "احجز عبر واتساب", messenger: "راسل المحرّر",
    message: "استفسر", nextDeparture: "أقرب موعد", date: "التاريخ", depart: "الأوقات", price: "السعر",
    availability: "التوفّر", to: "إلى", cancellation: "سياسة الإلغاء", paymentSchedule: "جدول الدفع",
    basedOn: "من", review: "تقييم", stars: "نجوم", route: "مسار رحلتك", years: "سنة",
    replyTime: "نردّ عادةً خلال ساعة", watch: "شاهد الفيديو", noVideo: "الفيديو قريبًا",
    play: "تشغيل", pause: "إيقاف", mute: "كتم", unmute: "تشغيل الصوت", poweredBy: "مُشغّل بواسطة باكمتريكس",
    contents: "المحتويات", inThisIssue: "في هذا العدد", duration: "المدة", destination: "الوجهة",
    board: "الإقامة", departuresK: "الانطلاق", plate: "لوحة", requestDossier: "اطلب الملف الكامل.",
    dossier: "الملف", theAuthor: "المؤلِّف", subscribe: "خطّط معنا",
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
  agent: { en: "Travel designer", ar: "مصمّم الرحلات" }, curator: { en: "Curator", ar: "منسّق الرحلة" },
  trip_lead: { en: "Trip lead", ar: "قائد الرحلة" }, trip_designer: { en: "Travel designer", ar: "مصمّم الرحلات" },
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
function AtStars({ n = 5, of = 5, size = 14, color }: { n?: number; of?: number; size?: number; color: string }) {
  const star = (fill: string) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} style={{ display: "block" }}><path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 18.6 5.9 20.8l1.2-6.6L2.3 9.6l6.6-.9z" /></svg>
  );
  return <span style={{ display: "inline-flex", gap: 2 }}>{Array.from({ length: of }).map((_, i) => <span key={i}>{star(i < n ? color : atRgba(color, 0.25))}</span>)}</span>;
}

// ─── Abstract route map ───────────────────────────────────────────────────────
function AtRouteMap({ stops, line, land = "#e4e0d6", ink = "#1c1b17", height = 220, rtl = false }: { stops: { label: string }[]; line: string; land?: string; ink?: string; height?: number; rtl?: boolean }) {
  const W = 1000, H = 420;
  const pts = stops.map((s, i) => {
    const x = stops.length === 1 ? W / 2 : 120 + (i * (W - 240)) / (stops.length - 1);
    const y = 150 + Math.sin(i * 1.3 + 0.6) * 70 + (i % 2 ? 20 : -10);
    return { ...s, x: rtl ? W - x : x, y };
  });
  const path = pts.map((p, i) => { if (i === 0) return `M ${p.x} ${p.y}`; const prev = pts[i - 1]; const mx = (prev.x + p.x) / 2; return `Q ${mx} ${prev.y - 40} ${p.x} ${p.y}`; }).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height, display: "block", background: "#efebe1" }} preserveAspectRatio="xMidYMid slice">
      <g fill={land} opacity="0.9"><path d="M-40 300 Q 180 250 360 300 T 760 290 Q 920 270 1060 320 L1060 460 L-40 460 Z" /><ellipse cx="220" cy="120" rx="190" ry="90" opacity="0.5" /><ellipse cx="780" cy="100" rx="160" ry="80" opacity="0.5" /></g>
      <g stroke={atRgba(ink, 0.05)} strokeWidth="1">{[80, 180, 280, 360].map((y) => <line key={y} x1="0" x2={W} y1={y} y2={y} />)}{[200, 400, 600, 800].map((x) => <line key={x} y1="0" y2={H} x1={x} x2={x} />)}</g>
      <path d={path} fill="none" stroke={line} strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" opacity="0.85" />
      {pts.map((p, i) => <g key={i}><circle cx={p.x} cy={p.y} r="10" fill="#efebe1" stroke={line} strokeWidth="3" /><circle cx={p.x} cy={p.y} r="3.5" fill={line} /><text x={p.x} y={p.y - 22} textAnchor="middle" fill={ink} fontSize="22" fontWeight="500" fontFamily="inherit">{p.label}</text></g>)}
    </svg>
  );
}

// ─── Video player ─────────────────────────────────────────────────────────────
function AtVideo({ src, poster, accent, rtl = false, sans, height = 320, ui }: { src?: string; poster?: string; accent: string; rtl?: boolean; sans: string; height?: number; ui: typeof L_EN["ui"] }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const ctrl: React.CSSProperties = { width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 };
  const onAccent = atOn(accent);
  if (!src) {
    return (
      <div style={{ position: "relative", overflow: "hidden", height, background: "#1c1b17" }}>
        {poster && <img src={poster} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.4) brightness(0.55)" }} />}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#fff" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
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
    <div onClick={toggle} style={{ position: "relative", overflow: "hidden", height, background: "#000", cursor: "pointer" }}>
      <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      {!playing && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "linear-gradient(rgba(0,0,0,0.05),rgba(0,0,0,0.35))" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: accent, color: onAccent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(0,0,0,0.4)" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style={{ marginInlineStart: 3 }}><path d="M8 5v14l11-7z" /></svg>
          </div>
          <div style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 700, color: "#fff", letterSpacing: "0.4px", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>{ui.watch}</div>
        </div>
      )}
      <div dir={rtl ? "rtl" : "ltr"} style={{ position: "absolute", insetInline: 0, bottom: 0, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "linear-gradient(transparent, rgba(0,0,0,0.4))" }}>
        <button onClick={(e) => { e.stopPropagation(); toggle(); }} aria-label={playing ? ui.pause : ui.play} title={playing ? ui.pause : ui.play} style={ctrl}>{playing ? IconPause : IconPlay}</button>
        <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} aria-label={muted ? ui.unmute : ui.mute} title={muted ? ui.unmute : ui.mute} style={ctrl}>{muted ? IconMuted : IconSound}</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export function TemplateAtlasPage({ pkg, agency, onWhatsApp, onMessenger, lang = "en" }: TPageProps) {
  const D = useIsDesktop();
  const rtl = lang === "ar";
  const L = rtl ? L_AR : L_EN;
  const brand = agency.brandColor || "#9c3b2e";

  const PAPER = "#f4f2ec", CARD = "#fbfaf6", INK = "#1c1b17";
  const MUT = "rgba(28,27,23,0.62)", FAINT = "rgba(28,27,23,0.42)", RULE = "rgba(28,27,23,0.16)";
  const serif = rtl ? "var(--font-markazi), 'Markazi Text', serif" : "var(--font-playfair), 'Playfair Display', serif";
  const label = rtl ? "var(--font-noto-sans-arabic), 'Noto Sans Arabic', sans-serif" : "var(--font-space-grotesk), 'Space Grotesk', sans-serif";
  const body = rtl ? "var(--font-noto-sans-arabic), 'Noto Sans Arabic', sans-serif" : "var(--font-nunito-sans), 'Nunito Sans', sans-serif";
  const px = D ? 80 : 22;
  const ar = (en: string, a: string) => (rtl ? a : en);
  const dig = (s: string | number) => (rtl ? String(s).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]) : String(s));
  const uc: React.CSSProperties["textTransform"] = rtl ? "none" : "uppercase";

  const title = pkg.title || pkg.destination || "";
  const nightsN = pkg.nights ? Number(pkg.nights) : null;
  const cover = pkg.coverImage || pkg.images?.[0] || secStrArr(findSec(pkg, "media"), "images")[0] || "";
  const mediaImgs = secStrArr(findSec(pkg, "media"), "images");
  const itinDays = secArr(findSec(pkg, "itinerary"), "days").filter((d) => secItemStr(d, "title"));
  const depEntries = secArr(findSec(pkg, "departures"), "entries");
  const person = pkg.people?.find((p) => p.role === "agent" || p.role === "curator" || p.role === "trip_lead")
    ?? pkg.people?.[0] ?? (pkg.agent ? { name: pkg.agent.name, role: pkg.agent.role || "agent", photo: pkg.agent.avatar, years: pkg.agent.years } : undefined);
  const mealPlan = secStr(findSec(pkg, "meals"), "plan");
  const hasHotel = !!(findSec(pkg, "hotel") || findSec(pkg, "hotels") || pkg.hotelDescription);
  const hasDepart = depEntries.length > 0 || (pkg.departures?.length ?? 0) > 0;

  // ---- clickable gallery → lightbox ----
  const photos = Array.from(new Set([cover, ...mediaImgs].filter(Boolean)));
  const [lightbox, setLightbox] = useState<number | null>(null);
  const zoom = (url: string) => { const i = photos.indexOf(url); if (i >= 0) setLightbox(i); };

  // ---- nav + contents (present sections) ----
  const goTo = (type: string) => { if (typeof document === "undefined") return; document.querySelector(`[data-pmx-section="${type}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const present = (key: string) => {
    if (key === "reviews") return (pkg.reviews?.length ?? 0) > 0 && agency.showReviews !== false;
    if (key === "hotel") return hasHotel;
    if (key === "pricing") return (pkg.pricingTiers?.length ?? 0) > 0 || !!findSec(pkg, "pricing");
    if (key === "departures") return hasDepart;
    return !!findSec(pkg, key);
  };
  const navItems = Object.entries(L.nav).filter(([key]) => present(key));
  const contentsList: [string, string][] = ([
    ["highlights", L.sections.highlights], ["itinerary", L.sections.itinerary], ["hotel", L.sections.hotel],
    ["inclusions", L.sections.inclusions], ["departures", L.sections.departures], ["pricing", L.sections.pricing],
    ["reviews", L.sections.reviews], ["faq", L.sections.faq],
  ] as [string, string][]).filter(([k]) => present(k)).slice(0, D ? 5 : 4);

  // folio numbers assigned to key sections in document order
  const FOLIO: Record<string, string> = {};
  ["highlights", "itinerary", "hotel", "meals", "departures"].filter(present).forEach((k, i) => { FOLIO[k] = ROMAN[i]; });

  // hero meta strip from real facts
  const meta: { k: string; v: string }[] = [
    nightsN ? { k: L.ui.duration, v: `${dig(nightsN)} ${L.ui.nights}` } : null,
    pkg.destination ? { k: L.ui.destination, v: pkg.destination } : null,
    mealPlan && mealPlan !== "none" ? { k: L.ui.board, v: MEAL_LABELS[mealPlan]?.[lang] || mealPlan } : null,
    hasDepart ? { k: L.ui.departuresK, v: ar("Multiple cities", "عدة مدن") } : null,
  ].filter(Boolean).slice(0, 4) as { k: string; v: string }[];

  // ---- atoms ----
  const Kicker = ({ children, light }: { children: React.ReactNode; light?: boolean }) => (
    <div style={{ fontFamily: label, fontSize: D ? 11 : 10, fontWeight: 600, letterSpacing: rtl ? 0 : "2.6px", textTransform: uc, color: light ? "rgba(255,255,255,0.78)" : brand, marginBottom: 14 }}>{children}</div>
  );
  const Primary = ({ children, full, big, ghost, onClick }: { children: React.ReactNode; full?: boolean; big?: boolean; ghost?: boolean; onClick?: () => void }) => (
    <button data-testid="wa-cta" onClick={onClick} style={{ fontFamily: label, background: ghost ? "transparent" : INK, color: ghost ? INK : "#fff", border: ghost ? `1px solid ${INK}` : "none", borderRadius: 0, padding: big ? "16px 28px" : "13px 22px", fontSize: D ? 12.5 : 12, fontWeight: 600, letterSpacing: rtl ? 0 : "1.4px", textTransform: uc, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, width: full ? "100%" : "auto" }}>
      {!ghost && <WAIcon s={14} fill="#fff" />} {children}
    </button>
  );
  const H2 = ({ children, size }: { children: React.ReactNode; size?: number }) => (
    <h2 style={{ fontFamily: serif, fontSize: size || (D ? 44 : 29), fontWeight: 500, lineHeight: 1.05, letterSpacing: rtl ? 0 : "-0.3px", color: INK, margin: 0 }}>{children}</h2>
  );
  const Wrap = ({ children, pt, pb, style, id, section }: { children: React.ReactNode; pt?: number; pb?: number; style?: React.CSSProperties; id?: string; section?: string }) => (
    <section id={id} data-pmx-section={section} style={{ scrollMarginTop: D ? 56 : 50, padding: `${pt != null ? pt : (D ? 84 : 46)}px ${px}px ${pb != null ? pb : (D ? 84 : 46)}px`, ...style }}>{children}</section>
  );
  const SecHead = ({ folio, kicker, title: t, sub }: { folio?: string; kicker: string; title: string; sub?: string }) => (
    <div style={{ marginBottom: D ? 40 : 26, borderTop: `2px solid ${INK}`, paddingTop: 14 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 14 }}>
        <span style={{ fontFamily: label, fontSize: D ? 11 : 10, fontWeight: 600, letterSpacing: rtl ? 0 : "2.6px", textTransform: uc, color: brand }}>{kicker}</span>
        {folio && <span style={{ fontFamily: label, fontSize: D ? 12 : 11, fontWeight: 600, letterSpacing: "1px", color: brand }}>{folio}</span>}
      </div>
      <H2>{t}</H2>
      {sub && <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: D ? 21 : 17, color: MUT, lineHeight: 1.5, margin: `${D ? 16 : 12}px 0 0`, maxWidth: 620 }}>{sub}</p>}
    </div>
  );

  // ════════ HERO ════════
  const Hero = () => (
    <div data-pmx-section="hero">
      <div style={{ position: "relative", height: D ? 620 : 480, overflow: "hidden", background: INK }}>
        {cover && <img src={cover} alt="" onClick={() => zoom(cover)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }} />}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(to bottom, rgba(0,0,0,0.42) 0%, rgba(0,0,0,0.1) 38%, rgba(0,0,0,0.72) 100%)" }} />
        <div style={{ position: "absolute", insetInline: px, top: D ? 28 : 20, display: "flex", justifyContent: "space-between", alignItems: "center", color: "#fff" }}>
          <span style={{ fontFamily: serif, fontSize: D ? 22 : 18, fontWeight: 600, letterSpacing: rtl ? 0 : "0.5px" }}>{agency.name}</span>
          {pkg.destination && <span style={{ fontFamily: label, fontSize: D ? 11 : 10, fontWeight: 600, letterSpacing: rtl ? 0 : "2px", textTransform: uc, opacity: 0.85 }}>{pkg.destination}</span>}
        </div>
        <div style={{ position: "absolute", insetInline: px, bottom: D ? 40 : 26, color: "#fff", maxWidth: D ? 780 : "100%" }}>
          <Kicker light><span data-pmx-field="destination">{pkg.destination}</span></Kicker>
          <h1 style={{ fontFamily: serif, fontSize: D ? 76 : 42, fontWeight: 500, lineHeight: 0.98, letterSpacing: rtl ? 0 : "-1px", margin: 0 }} data-pmx-field="title">{title}</h1>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: D ? "1.5fr 1fr" : "1fr", gap: D ? 56 : 22, padding: D ? `52px ${px}px 12px` : `30px ${px}px 8px`, alignItems: "start" }}>
        {pkg.description && <p style={{ fontFamily: serif, fontSize: D ? 27 : 19, fontStyle: "italic", lineHeight: 1.45, color: INK, margin: 0 }}>{pkg.description}</p>}
        <div style={{ gridColumn: pkg.description ? "auto" : (D ? "1 / -1" : "auto") }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 0, borderTop: `2px solid ${INK}` }}>
            {meta.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "12px 0", borderBottom: `1px solid ${RULE}` }}>
                <span style={{ fontFamily: label, fontSize: 10.5, fontWeight: 600, letterSpacing: rtl ? 0 : "1.6px", textTransform: uc, color: FAINT }}>{m.k}</span>
                <span style={{ fontFamily: serif, fontSize: D ? 19 : 16, color: INK }}>{m.v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "14px 0 0" }}>
              <span style={{ fontFamily: label, fontSize: 10.5, fontWeight: 600, letterSpacing: rtl ? 0 : "1.6px", textTransform: uc, color: FAINT }}>{L.ui.from}</span>
              <span style={{ fontFamily: serif, fontSize: D ? 30 : 24, color: INK }} data-pmx-field="price">{dig(pkg.price || "")}</span>
            </div>
          </div>
          {pkg.whatsapp && <div style={{ marginTop: 18 }}><Primary full big onClick={onWhatsApp}>{L.ui.enquire}</Primary></div>}
        </div>
      </div>
    </div>
  );

  // ════════ CONTENTS ════════
  const Contents = () => {
    if (!contentsList.length) return null;
    return (
      <Wrap pt={D ? 48 : 30} pb={D ? 36 : 22}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: `2px solid ${INK}`, borderBottom: `1px solid ${RULE}`, paddingBlock: 12, marginBottom: 4 }}>
          <span style={{ fontFamily: label, fontSize: 11, fontWeight: 600, letterSpacing: rtl ? 0 : "2.6px", textTransform: uc, color: brand }}>{L.ui.inThisIssue}</span>
          <span style={{ fontFamily: label, fontSize: 11, fontWeight: 600, letterSpacing: "1px", color: FAINT }}>{L.ui.contents}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: D ? `repeat(${contentsList.length},1fr)` : "1fr 1fr", gap: 0 }}>
          {contentsList.map(([k, t], i) => (
            <button key={k} onClick={() => goTo(k)} style={{ textAlign: "start", background: "none", cursor: "pointer", padding: "16px 0", borderBottom: `1px solid ${RULE}`, borderInlineEnd: (D ? (i < contentsList.length - 1) : (i % 2 === 0)) ? `1px solid ${RULE}` : "none", paddingInlineEnd: 16, paddingInlineStart: i === 0 ? 0 : 16, borderTop: "none", borderLeft: "none", borderRight: "none" }}>
              <div style={{ fontFamily: serif, fontSize: D ? 30 : 24, color: brand, lineHeight: 1, marginBottom: 8 }}>{dig(`0${i + 1}`.slice(-2))}</div>
              <div style={{ fontFamily: body, fontSize: D ? 14 : 12.5, color: INK, lineHeight: 1.35 }}>{t}</div>
            </button>
          ))}
        </div>
      </Wrap>
    );
  };

  // ════════ HIGHLIGHTS ════════
  const Highlights = () => {
    const items = secMixed(findSec(pkg, "highlights"), "items");
    if (!items.length) return null;
    return (
      <Wrap pt={D ? 40 : 24} section="highlights">
        <SecHead folio={FOLIO.highlights} kicker={L.nav.highlights} title={ar("Reasons to go", "أسباب للذهاب")} sub={ar("A small set of moments worth the journey.", "لحظات قليلة تستحقّ الرحلة.")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 40 : 28 }}>
          {items.map((h, i) => {
            const t = secItemStr(h, "title", "text", "label");
            const d = typeof h === "object" ? secItemStr(h, "desc", "description") : "";
            return (
              <div key={i} style={{ paddingTop: 18, borderTop: `1px solid ${RULE}` }}>
                <div style={{ fontFamily: serif, fontSize: D ? 40 : 32, color: brand, fontWeight: 500, lineHeight: 1, marginBottom: 14 }}>{dig(`0${i + 1}`.slice(-2))}</div>
                <div style={{ fontFamily: serif, fontSize: D ? 24 : 20, fontWeight: 500, lineHeight: 1.18, color: INK, marginBottom: d ? 10 : 0 }}>{t}</div>
                {d && <div style={{ fontFamily: body, fontSize: 14, color: MUT, lineHeight: 1.7 }}>{d}</div>}
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
    const big = imgs[0]; const sideTiles = imgs.slice(1, 3);
    const stops = mapImage ? [] : itinDays.slice(0, 5).map((d) => ({ label: secItemStr(d, "title") })).filter((s) => s.label);
    const plate = (n: number) => `${L.ui.plate} ${dig(`0${n}`.slice(-2))}`;
    return (
      <Wrap pt={0} section="media">
        <SecHead kicker={L.sections.media} title={ar("Plates from the field", "لقطات من الميدان")} />
        {video && <>
          <AtVideo src={video} poster={cover || big} accent={brand} rtl={rtl} sans={body} height={D ? 460 : 240} ui={L.ui} />
          <div style={{ fontFamily: label, fontSize: 10.5, color: FAINT, letterSpacing: rtl ? 0 : "1.4px", textTransform: uc, marginTop: 10 }}>{plate(1)} · {L.ui.watch}</div>
        </>}
        {(big || sideTiles.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: D && sideTiles.length ? "2fr 1fr" : "1fr", gap: D ? 16 : 10, marginTop: video ? (D ? 28 : 18) : 0 }}>
            {big && (
              <div>
                <img src={big} onClick={() => zoom(big)} style={{ width: "100%", height: D ? 360 : 220, objectFit: "cover", display: "block", cursor: "zoom-in" }} />
                <div style={{ fontFamily: label, fontSize: 10.5, color: FAINT, letterSpacing: rtl ? 0 : "1.4px", textTransform: uc, marginTop: 8 }}>{plate(2)}</div>
              </div>
            )}
            {sideTiles.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: D ? 16 : 10 }}>
                {sideTiles.map((u, k) => (
                  <div key={k}>
                    <img src={u} onClick={() => zoom(u)} style={{ width: "100%", height: D ? 172 : 150, objectFit: "cover", display: "block", cursor: "zoom-in" }} />
                    <div style={{ fontFamily: label, fontSize: 10, color: FAINT, letterSpacing: rtl ? 0 : "1.2px", textTransform: uc, marginTop: 7 }}>{plate(k + 3)}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        {(mapImage || stops.length > 0) && (
          <div style={{ marginTop: D ? 32 : 22 }}>
            <div style={{ fontFamily: label, fontSize: 10.5, color: brand, fontWeight: 600, letterSpacing: rtl ? 0 : "2px", textTransform: uc, marginBottom: 12 }}>{L.ui.route}</div>
            {mapImage
              ? <img src={mapImage} alt={mapCaption} style={{ width: "100%", height: D ? 230 : 170, objectFit: "cover", display: "block" }} />
              : <AtRouteMap stops={stops} line={INK} ink={INK} height={D ? 230 : 170} rtl={rtl} />}
            {mapCaption && <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 14, color: FAINT, marginTop: 12 }}>{mapCaption}</div>}
          </div>
        )}
      </Wrap>
    );
  };

  // ════════ ITINERARY ════════
  const Itinerary = () => {
    if (!itinDays.length) return null;
    return (
      <Wrap style={{ background: CARD }} section="itinerary">
        <SecHead folio={FOLIO.itinerary} kicker={L.sections.itinerary} title={ar(`${itinDays.length} days, composed`, `${dig(itinDays.length)} أيام مؤلَّفة`)} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? "0 56px" : 0 }}>
          {itinDays.map((it, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: 18, padding: "16px 0", borderTop: `1px solid ${RULE}`, alignItems: "baseline" }}>
              <div style={{ fontFamily: serif, fontSize: D ? 26 : 21, color: brand, fontWeight: 500, lineHeight: 1, minWidth: 30 }}>{dig((it.day as number) ?? i + 1)}</div>
              <div>
                <div style={{ fontFamily: serif, fontSize: D ? 21 : 17, fontWeight: 500, color: INK }}>{secItemStr(it, "title")}</div>
                {secItemStr(it, "desc", "description") && <div style={{ fontFamily: body, fontSize: 13.5, color: MUT, lineHeight: 1.6, marginTop: 4 }}>{secItemStr(it, "desc", "description")}</div>}
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
    const r0 = (secArr(rich, "hotels").length ? secArr(rich, "hotels") : secArr(rich, "items"))[0];
    const name = r0 ? secItemStr(r0, "name") : "";
    const stars = r0 && typeof r0.stars === "number" ? (r0.stars as number) : 0;
    const blurb = (r0 ? secItemStr(r0, "note", "description", "blurb") : "") || secStr(h, "description") || pkg.hotelDescription || "";
    const features = r0 ? secStrArr(r0, "facilities").concat(secStrArr(r0, "features")) : [];
    if (!blurb && !name) return null;
    const img = mediaImgs[3] || mediaImgs[0] || cover;
    return (
      <Wrap section="hotel">
        <SecHead folio={FOLIO.hotel} kicker={L.sections.hotel} title={name || ar("Your stay", "إقامتك")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "1.1fr 1fr" : "1fr", gap: D ? 48 : 20, alignItems: "center" }}>
          {img && <img src={img} onClick={() => zoom(img)} style={{ width: "100%", height: D ? 400 : 230, objectFit: "cover", display: "block", cursor: "zoom-in" }} />}
          <div>
            {stars > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
                <AtStars n={stars} size={D ? 16 : 14} color={brand} />
                <span style={{ fontFamily: label, fontSize: 11, color: FAINT, letterSpacing: rtl ? 0 : "1px", textTransform: uc }}>{dig(stars)} {L.ui.stars}</span>
              </div>
            )}
            {blurb && <p style={{ fontFamily: body, fontSize: D ? 15.5 : 14, color: MUT, lineHeight: 1.8, margin: 0, whiteSpace: "pre-line" }}>{blurb}</p>}
            {features.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, marginTop: 20 }}>
                {features.map((f, i) => <div key={i} style={{ fontFamily: body, fontSize: 13, color: INK, padding: "12px 0", borderTop: `1px solid ${RULE}`, borderInlineEnd: i % 2 === 0 ? `1px solid ${RULE}` : "none", paddingInlineEnd: 14 }}>{f}</div>)}
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
    const planLabel = MEAL_LABELS[plan]?.[lang] || plan || ar("Dining", "الطعام");
    return (
      <Wrap style={{ background: CARD }} section="meals">
        <SecHead folio={FOLIO.meals} kicker={L.sections.meals} title={planLabel} />
        {notes && <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: D ? 20 : 17, color: MUT, lineHeight: 1.6, margin: 0, maxWidth: 720, whiteSpace: "pre-line" }}>{notes}</p>}
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
        <SecHead kicker={L.sections.inclusions} title={ar("What is and isn't carried", "ما يُشمل وما لا يُشمل")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 56 : 28 }}>
          {includes.length > 0 && (
            <div>
              <div style={{ fontFamily: label, fontSize: 11, fontWeight: 600, color: brand, letterSpacing: rtl ? 0 : "1.6px", textTransform: uc, marginBottom: 14 }}>{L.ui.included}</div>
              {includes.map((it, i) => <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: `1px solid ${RULE}`, alignItems: "flex-start" }}><span style={{ fontFamily: serif, fontSize: 15, color: brand, lineHeight: 1.4 }}>—</span><span style={{ fontFamily: body, fontSize: 14, color: INK, lineHeight: 1.55 }}>{it}</span></div>)}
            </div>
          )}
          {excludes.length > 0 && (
            <div>
              <div style={{ fontFamily: label, fontSize: 11, fontWeight: 600, color: FAINT, letterSpacing: rtl ? 0 : "1.6px", textTransform: uc, marginBottom: 14 }}>{L.ui.notIncluded}</div>
              {excludes.map((it, i) => <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: `1px solid ${RULE}`, alignItems: "flex-start" }}><span style={{ fontFamily: serif, fontSize: 15, color: FAINT, lineHeight: 1.4 }}>×</span><span style={{ fontFamily: body, fontSize: 14, color: MUT, lineHeight: 1.55 }}>{it}</span></div>)}
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
      <Wrap style={{ background: CARD }} section="transfers">
        <SecHead kicker={L.sections.transfers} title={ar("Moved without a thought", "تنقّل دون عناء")} sub={items.length ? undefined : desc} />
        {items.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 40 : 0 }}>
            {items.map((t, i) => (
              <div key={i} style={{ paddingTop: 18, borderTop: `1px solid ${RULE}`, marginTop: !D && i ? 14 : 0 }}>
                <div style={{ fontFamily: serif, fontSize: 22, color: brand }}>{dig(`0${i + 1}`.slice(-2))}</div>
                <div style={{ fontFamily: serif, fontSize: D ? 21 : 18, color: INK, marginTop: 8 }}>{secItemStr(t, "leg", "title", "name", "text")}</div>
                {typeof t === "object" && secItemStr(t, "desc", "description") && <div style={{ fontFamily: body, fontSize: 13.5, color: MUT, lineHeight: 1.65, marginTop: 6 }}>{secItemStr(t, "desc", "description")}</div>}
              </div>
            ))}
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
    return (
      <Wrap section="visa">
        <SecHead kicker={L.sections.visa} title={VISA_HEAD[included]?.[lang] || ar("Visa & entry", "التأشيرة والدخول")} />
        {content && <p style={{ fontFamily: body, fontSize: 14.5, color: MUT, lineHeight: 1.75, margin: 0, maxWidth: 760, whiteSpace: "pre-line" }}>{content}</p>}
      </Wrap>
    );
  };

  // ════════ DEPARTURES ════════
  const Departures = () => {
    const rows = depEntries.length ? depEntries : (pkg.departures ?? []).map((d) => ({ date: d.date, price: d.price, spots: d.spots } as SecData));
    if (!rows.length) return null;
    return (
      <Wrap style={{ background: CARD }} id="at-departures" section="departures">
        <SecHead folio={FOLIO.departures} kicker={L.sections.departures} title={ar("Where you set out", "من أين تنطلق")} />
        {D ? (
          <div style={{ borderTop: `2px solid ${INK}` }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.2fr 1fr 1fr auto", padding: "12px 0", fontFamily: label, fontSize: 10.5, fontWeight: 600, letterSpacing: rtl ? 0 : "1.4px", textTransform: uc, color: FAINT, borderBottom: `1px solid ${RULE}` }}>
              <div>{L.ui.from}</div><div>{L.ui.date}</div><div>{L.ui.depart}</div><div>{L.ui.availability}</div><div style={{ textAlign: "end" }}>{L.ui.price}</div><div />
            </div>
            {rows.map((r, i) => {
              const spots = typeof r.spots === "number" ? r.spots : Number(r.spots) || 0; const sold = spots <= 0;
              const from = secItemStr(r, "origin", "from"); const date = secItemStr(r, "date");
              const dep = secItemStr(r, "flyingTime"); const arrt = secItemStr(r, "arrivingTime"); const price = secItemStr(r, "price");
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.2fr 1fr 1fr auto", padding: "18px 0", alignItems: "center", borderBottom: `1px solid ${RULE}`, opacity: sold ? 0.45 : 1 }}>
                  <div style={{ fontFamily: serif, fontSize: 19, color: INK }}>{from || dig(date)}</div>
                  <div style={{ fontFamily: body, fontSize: 13.5, color: MUT }}>{dig(date)}</div>
                  <div style={{ fontFamily: body, fontSize: 13, color: MUT }}>{dep ? `${dig(dep)}${arrt ? ` → ${dig(arrt)}` : ""}` : "—"}</div>
                  <div style={{ fontFamily: body, fontSize: 12.5, color: sold ? FAINT : brand, fontWeight: 700 }}>{sold ? L.ui.soldOut : `${dig(spots)} ${L.ui.left}`}</div>
                  <div style={{ fontFamily: serif, fontSize: 20, color: INK, textAlign: "end" }}>{dig(price)}</div>
                  <div style={{ textAlign: "end", paddingInlineStart: 18 }}>{sold ? <span style={{ fontFamily: body, fontSize: 12, color: FAINT }}>—</span> : (pkg.whatsapp ? <Primary onClick={onWhatsApp}>{L.ui.reserve}</Primary> : null)}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {rows.map((r, i) => {
              const spots = typeof r.spots === "number" ? r.spots : Number(r.spots) || 0; const sold = spots <= 0;
              const from = secItemStr(r, "origin", "from"); const date = secItemStr(r, "date"); const price = secItemStr(r, "price");
              return (
                <div key={i} style={{ padding: "16px 0", borderTop: `1px solid ${RULE}`, opacity: sold ? 0.55 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontFamily: serif, fontSize: 20, color: INK }}>{from || dig(date)}</div>
                    {price && <div style={{ fontFamily: serif, fontSize: 20, color: brand }}>{dig(price)}</div>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: body, fontSize: 12.5, color: MUT }}>
                    <span>{dig(date)}</span><span style={{ color: sold ? FAINT : brand, fontWeight: 700 }}>{sold ? L.ui.soldOut : `${dig(spots)} ${L.ui.left}`}</span>
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
      <Wrap id="at-pricing" section="pricing">
        <SecHead kicker={L.sections.pricing} title={ar("Ways to travel", "طرق للسفر")} />
        {tiers.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? `repeat(${Math.min(tiers.length, 3)},1fr)` : "1fr", gap: 0 }}>
            {tiers.map((t, i) => {
              const featured = tiers.length === 3 && i === 1;
              return (
                <div key={i} style={{ padding: D ? "0 32px" : "24px 0", borderTop: `2px solid ${INK}`, borderInlineStart: (D && i) ? `1px solid ${RULE}` : "none", paddingInlineStart: (D && i) ? 32 : 0, borderBottom: !D ? `1px solid ${RULE}` : "none" }}>
                  <div style={{ paddingTop: D ? 22 : 0 }}>
                    {featured && <div style={{ fontFamily: label, fontSize: 9.5, fontWeight: 600, color: brand, letterSpacing: rtl ? 0 : "1.6px", textTransform: uc, marginBottom: 8 }}>★ {L.ui.mostPopular}</div>}
                    <div style={{ fontFamily: body, fontSize: 13, color: MUT }}>{localizeTierLabel(t.label, lang)}</div>
                    <div style={{ fontFamily: serif, fontSize: D ? 36 : 30, fontWeight: 500, color: INK, lineHeight: 1, marginTop: 8 }}>{dig(t.price)}</div>
                    {pkg.whatsapp && <div style={{ marginTop: 18 }}><Primary full ghost={!featured} onClick={onWhatsApp}>{L.ui.reserve}</Primary></div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {(cancellation.length > 0 || schedule.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 56 : 24, marginTop: tiers.length ? 40 : 0 }}>
            {cancellation.length > 0 && (
              <div>
                <div style={{ fontFamily: label, fontSize: 11, fontWeight: 600, color: brand, letterSpacing: rtl ? 0 : "1.4px", textTransform: uc, marginBottom: 12 }}>{L.ui.cancellation}</div>
                {cancellation.map((s, i) => <div key={i} style={{ fontFamily: body, fontSize: 13.5, color: MUT, padding: "7px 0", lineHeight: 1.5, borderTop: `1px solid ${RULE}` }}>{s}</div>)}
              </div>
            )}
            {schedule.length > 0 && (
              <div>
                <div style={{ fontFamily: label, fontSize: 11, fontWeight: 600, color: brand, letterSpacing: rtl ? 0 : "1.4px", textTransform: uc, marginBottom: 12 }}>{L.ui.paymentSchedule}</div>
                {schedule.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${RULE}` }}>
                    <span style={{ fontFamily: body, fontSize: 13.5, color: INK }}>{secItemStr(s, "dueDate", "label")}</span>
                    <span style={{ fontFamily: serif, fontSize: 17, color: brand }}>{dig(secItemStr(s, "amount"))}</span>
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
      <Wrap style={{ background: CARD }} section="extras">
        <SecHead kicker={L.sections.extras} title={ar("Composed additions", "إضافات مدروسة")} />
        {items.map((e, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 16, padding: D ? "20px 0" : "16px 0", borderTop: `1px solid ${RULE}` }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: serif, fontSize: D ? 22 : 18, color: INK }}>{secItemStr(e, "name", "title")}</div>
              {secItemStr(e, "description", "desc") && <div style={{ fontFamily: body, fontSize: 13, color: MUT, marginTop: 4, lineHeight: 1.5 }}>{secItemStr(e, "description", "desc")}</div>}
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
    const role = person.role ? (ROLE_LABELS[person.role]?.[lang] || person.role.replace(/_/g, " ")) : "";
    const bio = (person as { bio?: string }).bio || "";
    const years = typeof person.years === "number" ? person.years : 0;
    return (
      <Wrap section="people">
        <SecHead kicker={L.sections.people} title={L.ui.theAuthor} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "auto 1fr" : "1fr", gap: D ? 48 : 20, alignItems: "start" }}>
          {person.photo
            ? <img src={person.photo} style={{ width: D ? 200 : 110, height: D ? 240 : 132, objectFit: "cover", display: "block", filter: "grayscale(0.3)" }} />
            : <div style={{ width: D ? 200 : 110, height: D ? 240 : 132, background: CARD, border: `1px solid ${RULE}`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: D ? 72 : 44, color: brand }}>{person.name[0]}</div>}
          <div>
            <div style={{ fontFamily: serif, fontSize: D ? 34 : 26, color: INK }}>{person.name}</div>
            {role && <div style={{ fontFamily: label, fontSize: 11, color: brand, fontWeight: 600, letterSpacing: rtl ? 0 : "1.6px", textTransform: uc, marginTop: 6 }}>{role}</div>}
            {bio && <p style={{ fontFamily: body, fontSize: 14.5, color: MUT, lineHeight: 1.75, marginTop: 16 }}>{bio}</p>}
            {years > 0 && (
              <div style={{ display: "flex", gap: 40, marginTop: 20, borderTop: `1px solid ${RULE}`, paddingTop: 18 }}>
                <div><div style={{ fontFamily: serif, fontSize: 28, color: brand }}>{dig(years)}</div><div style={{ fontFamily: label, fontSize: 10.5, color: FAINT, letterSpacing: rtl ? 0 : "1px", textTransform: uc, marginTop: 4 }}>{L.ui.years}</div></div>
              </div>
            )}
            {pkg.whatsapp && <div style={{ marginTop: 22 }}><Primary onClick={onWhatsApp}>{L.ui.message}</Primary></div>}
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
      <Wrap style={{ background: CARD }} id="at-reviews" section="reviews">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16, marginBottom: D ? 36 : 24, borderTop: `2px solid ${INK}`, paddingTop: 14 }}>
          <div><div style={{ fontFamily: label, fontSize: 11, fontWeight: 600, letterSpacing: rtl ? 0 : "2.6px", textTransform: uc, color: brand, marginBottom: 12 }}>{L.sections.reviews}</div><H2 size={D ? 40 : 28}>{ar("From the letters", "آراء المسافرين")}</H2></div>
          <div style={{ textAlign: "end" }}>
            <div style={{ fontFamily: serif, fontSize: D ? 50 : 38, color: brand, lineHeight: 1 }}>{dig(rating)}</div>
            <AtStars n={Math.round(rating)} size={14} color={brand} />
            <div style={{ fontFamily: body, fontSize: 11.5, color: FAINT, marginTop: 4 }}>{L.ui.basedOn} {dig(count)} {L.ui.review}</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 40 : 24 }}>
          {items.slice(0, 6).map((r, i) => (
            <div key={i} style={{ borderTop: `1px solid ${RULE}`, paddingTop: 18 }}>
              <AtStars n={Math.round(r.rating || 5)} size={13} color={brand} />
              <p style={{ fontFamily: serif, fontSize: D ? 20 : 17, fontStyle: "italic", color: INK, lineHeight: 1.5, margin: "12px 0 16px" }}>&ldquo;{r.text}&rdquo;</p>
              <div style={{ fontFamily: label, fontSize: 12, fontWeight: 600, color: INK, letterSpacing: rtl ? 0 : "0.5px" }}>{r.name}</div>
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
        <SecHead kicker={L.sections.agency} title={agency.name} sub={agency.tagline} />
        <div style={{ display: "grid", gridTemplateColumns: D && image ? "1.3fr 1fr" : "1fr", gap: D ? 56 : 24, alignItems: "start" }}>
          {story && <p style={{ fontFamily: body, fontSize: D ? 15.5 : 14.5, color: MUT, lineHeight: 1.85, margin: 0, columnCount: D && !image ? 2 : 1, columnGap: 40, whiteSpace: "pre-line" }}>{story}</p>}
          {image && <img src={image} style={{ width: "100%", height: D ? 340 : 220, objectFit: "cover", display: "block", filter: "grayscale(0.15)" }} />}
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
        <SecHead kicker={L.sections.notes} title={ar("Notes & provisos", "ملاحظات وشروط")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 40 : 0 }}>
          {items.map((n, i) => {
            const t = secItemStr(n, "title");
            const body2 = secItemStr(n, "text", "desc", "description") || (typeof n === "string" ? n : "");
            return (
              <div key={i} style={{ paddingTop: 16, borderTop: `1px solid ${RULE}`, marginTop: !D && i ? 14 : 0 }}>
                {t && <div style={{ fontFamily: serif, fontSize: D ? 20 : 17, color: INK, marginBottom: 6 }}>{t}</div>}
                <div style={{ fontFamily: body, fontSize: 13.5, color: MUT, lineHeight: 1.65 }}>{body2}</div>
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
        <SecHead kicker={L.sections.faq} title={ar("Questions, answered", "إجابات على أسئلتك")} />
        <div>
          {items.map((f, i) => (
            <div key={i} style={{ padding: D ? "22px 0" : "18px 0", borderTop: `1px solid ${RULE}`, borderBottom: i === items.length - 1 ? `1px solid ${RULE}` : "none" }}>
              <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1.3fr" : "1fr", gap: D ? 40 : 8, alignItems: "baseline" }}>
                <div style={{ fontFamily: serif, fontSize: D ? 23 : 19, color: INK, lineHeight: 1.2 }}>{secItemStr(f, "question", "q")}</div>
                {secItemStr(f, "answer", "a") && <p style={{ fontFamily: body, fontSize: 14, color: MUT, lineHeight: 1.7, margin: 0 }}>{secItemStr(f, "answer", "a")}</p>}
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
      <Wrap style={{ background: INK, color: "#fff" }} section="custom">
        <div style={{ display: "grid", gridTemplateColumns: D && image ? "1fr 1.4fr" : "1fr", gap: D ? 56 : 22, alignItems: "center" }}>
          {image && <img src={image} style={{ width: "100%", height: D ? 360 : 200, objectFit: "cover", display: "block", filter: "grayscale(0.2)" }} />}
          <div>
            <Kicker light>{L.sections.custom}</Kicker>
            {heading && <div style={{ fontFamily: serif, fontSize: D ? 46 : 30, fontWeight: 500, lineHeight: 1.08, marginBottom: 18 }}>{heading}</div>}
            {text && <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: D ? 23 : 18, color: "rgba(255,255,255,0.84)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>{text}</p>}
            {person?.name && <div style={{ fontFamily: serif, fontSize: D ? 20 : 17, color: "#fff", marginTop: 22 }}>— {person.name}</div>}
          </div>
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
        <SecHead kicker={L.sections.others} title={ar("Other journeys", "رحلات أخرى")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 40 : 24 }}>
          {list.map((o, i) => {
            const oTitle = secItemStr(o, "title"); const place = secItemStr(o, "destination", "place");
            const price = secItemStr(o, "price"); const oNights = secItemStr(o, "nights");
            const img = secItemStr(o, "image"); const link = secItemStr(o, "link");
            const Inner = (
              <div>
                <div style={{ height: D ? 220 : 180, background: CARD }}>{img && <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", filter: "grayscale(0.15)" }} />}</div>
                {place && <div style={{ fontFamily: label, fontSize: 10.5, color: brand, fontWeight: 600, letterSpacing: rtl ? 0 : "1.4px", textTransform: uc, marginTop: 14 }}>{place}</div>}
                <div style={{ fontFamily: serif, fontSize: D ? 24 : 20, color: INK, margin: "8px 0 12px", lineHeight: 1.15 }}>{oTitle}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: `1px solid ${RULE}`, paddingTop: 12 }}>
                  {price && <span style={{ fontFamily: serif, fontSize: 20, color: INK }}>{dig(price)}</span>}
                  {oNights && <span style={{ fontFamily: body, fontSize: 12, color: FAINT }}>{dig(oNights)} {L.ui.nights}</span>}
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
      <Wrap pt={D ? 76 : 44} pb={D ? 76 : 44} style={{ background: PAPER, textAlign: "center", borderTop: `2px solid ${INK}` }}>
        <Kicker>{L.ui.subscribe}</Kicker>
        <div style={{ fontFamily: serif, fontSize: D ? 54 : 32, fontWeight: 500, lineHeight: 1.08, color: INK, maxWidth: 720, margin: "0 auto" }}>{L.ui.requestDossier}</div>
        <div style={{ fontFamily: body, fontSize: 14, color: MUT, margin: "14px 0 26px" }}>{L.ui.replyTime}{pkg.whatsapp ? ` · ${dig(pkg.whatsapp)}` : ""}</div>
        <div style={{ display: "inline-flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {pkg.whatsapp && <Primary big onClick={onWhatsApp}>{L.ui.bookWhatsapp}</Primary>}
          {pkg.messenger && onMessenger && <Primary big ghost onClick={onMessenger}>{L.ui.messenger}</Primary>}
        </div>
      </Wrap>
      <div style={{ padding: `22px ${px}px`, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${RULE}` }}>
        <div style={{ fontFamily: serif, fontSize: 18, color: INK }}>{agency.name}</div>
        <div style={{ fontFamily: label, fontSize: 9.5, color: FAINT, letterSpacing: rtl ? 0 : "1px", textTransform: uc }}>{L.ui.poweredBy}</div>
      </div>
    </div>
  );

  // ════════ BAR ════════
  const Bar = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${px}px`, height: D ? 56 : 50, borderBottom: `1px solid ${RULE}`, background: atRgba("#f4f2ec", 0.92), backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 30 }}>
      <div style={{ fontFamily: serif, fontSize: D ? 19 : 17, fontWeight: 600, color: INK, letterSpacing: rtl ? 0 : "0.3px" }}>{agency.name}</div>
      {D ? (
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          {navItems.map(([key, lbl]) => <button key={key} onClick={() => goTo(key)} style={{ fontFamily: label, fontSize: 11, fontWeight: 500, letterSpacing: rtl ? 0 : "1px", textTransform: uc, color: MUT, background: "none", border: "none", cursor: "pointer", padding: 0 }}>{lbl}</button>)}
          {pkg.whatsapp && <Primary onClick={onWhatsApp}>{L.ui.dossier}</Primary>}
        </div>
      ) : (pkg.whatsapp && <Primary onClick={onWhatsApp}>{L.ui.dossier}</Primary>)}
    </div>
  );

  return (
    <div dir={rtl ? "rtl" : "ltr"} lang={lang} style={{ width: "100%", background: PAPER, color: INK, fontFamily: body, position: "relative" }}>
      {Bar()}
      {Hero()}
      {Contents()}
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
export function TemplateAtlasCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
