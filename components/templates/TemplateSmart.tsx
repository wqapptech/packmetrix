"use client";

// ═══════════════════════════════════════════════════════════════════════════
// SMART V2 — Budget transparent · honest ledger / receipt.
// Bright paper, hairline grids, dotted-leader rows, monospace prices, an
// itemised "quote" hero built from what's actually in the package. Calm
// dynamic brand. Scarcity reads as reassurance, never pressure.
// One component renders all 4 surfaces. Wired to real pkg.sections data.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useState } from "react";
import { useIsDesktop, BaseCard, LightboxCarousel } from "./shared";
import { localizeTierLabel } from "@/lib/translations";
import type { TPageProps, TCardProps, TPackage } from "./types";

type SecData = Record<string, unknown>;

// ─── Brand colour math ────────────────────────────────────────────────────────
function smHex(h: string): [number, number, number] {
  h = h.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function smRgba(hex: string, a: number): string { const [r, g, b] = smHex(hex); return `rgba(${r},${g},${b},${a})`; }
function smMix(hex: string, target: string, t: number): string {
  const a = smHex(hex), b = smHex(target);
  const m = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}
function smLighten(hex: string, t: number) { return smMix(hex, "#ffffff", t); }
function smLum(hex: string) { const [r, g, b] = smHex(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
function smOn(hex: string) { return smLum(hex) > 0.62 ? "#15212e" : "#ffffff"; }

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
    book: "Book this trip", enquire: "Enquire on WhatsApp", bookWhatsapp: "Book on WhatsApp", messenger: "Messenger",
    message: "Message us", nextDeparture: "Next departure", date: "Date", depart: "Times", price: "Price",
    availability: "Spots", to: "To", cancellation: "Cancellation policy", paymentSchedule: "Payment schedule",
    basedOn: "based on", review: "reviews", stars: "stars", route: "Your route", add: "Add",
    replyTime: "Usually replies within an hour", watch: "Watch the film", noVideo: "Video coming soon",
    play: "Play", pause: "Pause", mute: "Mute", unmute: "Unmute", years: "years", poweredBy: "Powered by PackMetrix",
    quote: "Itemised quote", total: "Total", allIn: "all-in", totalLine: "per person · all lines included",
    theTotal: "The total is the total.", emailCopy: "Email a copy", allInOne: "All in the price",
    spotsLine: (n: number) => `${n} ${n === 1 ? "room" : "rooms"} left at this rate — no rush, just letting you know.`,
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
    book: "احجز هذه الرحلة", enquire: "استفسر عبر واتساب", bookWhatsapp: "احجز عبر واتساب", messenger: "ماسنجر",
    message: "راسلنا", nextDeparture: "أقرب موعد", date: "التاريخ", depart: "الأوقات", price: "السعر",
    availability: "المقاعد", to: "إلى", cancellation: "سياسة الإلغاء", paymentSchedule: "جدول الدفع",
    basedOn: "من", review: "تقييم", stars: "نجوم", route: "مسار رحلتك", add: "أضِف",
    replyTime: "نردّ عادةً خلال ساعة", watch: "شاهد الفيديو", noVideo: "الفيديو قريبًا",
    play: "تشغيل", pause: "إيقاف", mute: "كتم", unmute: "تشغيل الصوت", years: "سنة", poweredBy: "مُشغّل بواسطة باكمتريكس",
    quote: "عرض سعر مفصّل", total: "الإجمالي", allIn: "شامل", totalLine: "للفرد · شاملًا كل البنود",
    theTotal: "الإجمالي هو الإجمالي.", emailCopy: "أرسل نسخة بالبريد", allInOne: "ضمن السعر",
    spotsLine: (n: number) => `بقي ${n} ${n === 1 ? "غرفة" : "غرف"} بهذا السعر — دون استعجال، فقط لعلمك.`,
  },
};

const MEAL_LABELS: Record<string, { en: string; ar: string }> = {
  none: { en: "No meals", ar: "بدون وجبات" }, breakfast: { en: "Breakfast", ar: "إفطار" },
  half_board: { en: "Half board", ar: "نصف إقامة" }, full_board: { en: "Full board", ar: "إقامة كاملة" },
  all_inclusive: { en: "All inclusive", ar: "شامل بالكامل" },
};
const VISA_LABELS: Record<string, { en: string; ar: string }> = {
  included: { en: "Included", ar: "مشمولة" }, assistance: { en: "Assistance", ar: "مساعدة" },
  not_included: { en: "Not included", ar: "غير مشمولة" }, not_required: { en: "Not required", ar: "غير مطلوبة" },
};
const VISA_HEAD: Record<string, { en: string; ar: string }> = {
  included: { en: "Visa included", ar: "التأشيرة مشمولة" }, assistance: { en: "Visa assistance provided", ar: "نقدّم المساعدة في التأشيرة" },
  not_included: { en: "Visa not included", ar: "التأشيرة غير مشمولة" }, not_required: { en: "No visa required", ar: "لا تحتاج تأشيرة" },
};
const ROLE_LABELS: Record<string, { en: string; ar: string }> = {
  agent: { en: "Trip designer", ar: "مصمّم الرحلات" }, curator: { en: "Trip designer", ar: "مصمّم الرحلات" },
  trip_lead: { en: "Trip lead", ar: "قائد الرحلة" }, trip_designer: { en: "Trip designer", ar: "مصمّم الرحلات" },
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
function SmStars({ n = 5, of = 5, size = 14, color }: { n?: number; of?: number; size?: number; color: string }) {
  const star = (fill: string) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} style={{ display: "block" }}><path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 18.6 5.9 20.8l1.2-6.6L2.3 9.6l6.6-.9z" /></svg>
  );
  return <span style={{ display: "inline-flex", gap: 2 }}>{Array.from({ length: of }).map((_, i) => <span key={i}>{star(i < n ? color : smRgba(color, 0.25))}</span>)}</span>;
}

// ─── Abstract route map ───────────────────────────────────────────────────────
function SmRouteMap({ stops, line, land = "#e6edf3", ink = "#15212e", height = 220, rounded = 12, rtl = false }: { stops: { label: string }[]; line: string; land?: string; ink?: string; height?: number; rounded?: number; rtl?: boolean }) {
  const W = 1000, H = 420;
  const pts = stops.map((s, i) => {
    const x = stops.length === 1 ? W / 2 : 120 + (i * (W - 240)) / (stops.length - 1);
    const y = 150 + Math.sin(i * 1.3 + 0.6) * 70 + (i % 2 ? 20 : -10);
    return { ...s, x: rtl ? W - x : x, y };
  });
  const path = pts.map((p, i) => { if (i === 0) return `M ${p.x} ${p.y}`; const prev = pts[i - 1]; const mx = (prev.x + p.x) / 2; return `Q ${mx} ${prev.y - 40} ${p.x} ${p.y}`; }).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height, display: "block", borderRadius: rounded, background: smLighten(land, 0.4) }} preserveAspectRatio="xMidYMid slice">
      <g fill={land} opacity="0.85"><path d="M-40 300 Q 180 250 360 300 T 760 290 Q 920 270 1060 320 L1060 460 L-40 460 Z" /><ellipse cx="220" cy="120" rx="190" ry="90" opacity="0.5" /><ellipse cx="780" cy="100" rx="160" ry="80" opacity="0.5" /></g>
      <g stroke={smRgba(ink, 0.05)} strokeWidth="1">{[80, 180, 280, 360].map((y) => <line key={y} x1="0" x2={W} y1={y} y2={y} />)}{[200, 400, 600, 800].map((x) => <line key={x} y1="0" y2={H} x1={x} x2={x} />)}</g>
      <path d={path} fill="none" stroke={line} strokeWidth="3.5" strokeDasharray="2 12" strokeLinecap="round" opacity="0.9" />
      {pts.map((p, i) => <g key={i}><circle cx={p.x} cy={p.y} r="11" fill="#fff" stroke={line} strokeWidth="3.5" /><circle cx={p.x} cy={p.y} r="4" fill={line} /><text x={p.x} y={p.y - 22} textAnchor="middle" fill={ink} fontSize="22" fontWeight="700" fontFamily="inherit">{p.label}</text></g>)}
    </svg>
  );
}

// ─── Video player ─────────────────────────────────────────────────────────────
function SmVideo({ src, poster, accent, radius = 14, rtl = false, sans, height = 320, ui }: { src?: string; poster?: string; accent: string; radius?: number; rtl?: boolean; sans: string; height?: number; ui: typeof L_EN["ui"] }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const ctrl: React.CSSProperties = { width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 };
  const onAccent = smOn(accent);
  if (!src) {
    return (
      <div style={{ position: "relative", borderRadius: radius, overflow: "hidden", height, background: "#15212e" }}>
        {poster && <img src={poster} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.3) brightness(0.55)" }} />}
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
    <div onClick={toggle} style={{ position: "relative", borderRadius: radius, overflow: "hidden", height, background: "#000", cursor: "pointer" }}>
      <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      {!playing && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "linear-gradient(rgba(0,0,0,0.05),rgba(0,0,0,0.35))" }}>
          <div style={{ width: 70, height: 70, borderRadius: "50%", background: accent, color: onAccent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(0,0,0,0.35)" }}>
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
export function TemplateSmartPage({ pkg, agency, onWhatsApp, onMessenger, lang = "en" }: TPageProps) {
  const D = useIsDesktop();
  const rtl = lang === "ar";
  const L = rtl ? L_AR : L_EN;
  const brand = agency.brandColor || "#2563aa";
  const onBrand = smOn(brand);

  const BG = "#f7f9fb", PAPER = "#ffffff", INK = "#15212e";
  const MUT = "rgba(21,33,46,0.6)", FAINT = "rgba(21,33,46,0.4)", LINE = "rgba(21,33,46,0.1)";
  const SOFT = smLighten(brand, 0.92);
  const disp = rtl ? "var(--font-tajawal), 'Tajawal', sans-serif" : "var(--font-manrope), 'Manrope', sans-serif";
  const sans = disp;
  const mono = rtl ? "var(--font-tajawal), 'Tajawal', sans-serif" : "var(--font-space-mono), 'Space Mono', monospace";
  const px = D ? 72 : 20;
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

  // ---- clickable gallery → lightbox ----
  const photos = Array.from(new Set([cover, ...mediaImgs].filter(Boolean)));
  const [lightbox, setLightbox] = useState<number | null>(null);
  const zoom = (url: string) => { const i = photos.indexOf(url); if (i >= 0) setLightbox(i); };

  // ---- nav ----
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

  // ---- itemised quote built from real package facts ----
  const mealPlan = secStr(findSec(pkg, "meals"), "plan");
  const visaInc = secStr(findSec(pkg, "visa"), "included");
  const hasTransfers = !!(secStr(findSec(pkg, "transfers"), "description") || secMixed(findSec(pkg, "transfers"), "items").length);
  const hasHotel = !!(findSec(pkg, "hotel") || findSec(pkg, "hotels") || pkg.hotelDescription);
  const hasDepart = depEntries.length > 0 || (pkg.departures?.length ?? 0) > 0;
  const breakdown: { l: string; v: string }[] = [
    nightsN ? { l: ar("Trip length", "مدة الرحلة"), v: `${dig(nightsN)} ${L.ui.nights}` } : null,
    hasHotel ? { l: L.sections.hotel, v: L.ui.allInOne } : null,
    mealPlan && mealPlan !== "none" ? { l: ar("Meals", "الوجبات"), v: MEAL_LABELS[mealPlan]?.[lang] || mealPlan } : null,
    hasTransfers ? { l: L.sections.transfers, v: L.ui.allInOne } : null,
    visaInc ? { l: ar("Visa", "التأشيرة"), v: VISA_LABELS[visaInc]?.[lang] || visaInc } : null,
    hasDepart ? { l: ar("Flights", "الطيران"), v: ar("Multiple cities", "عدة مدن") } : null,
  ].filter(Boolean).slice(0, 6) as { l: string; v: string }[];

  // ---- atoms ----
  const CTA = ({ children, full, big, ghost, onClick }: { children: React.ReactNode; full?: boolean; big?: boolean; ghost?: boolean; onClick?: () => void }) => (
    <button data-testid="wa-cta" onClick={onClick} style={{ fontFamily: sans, background: ghost ? "transparent" : brand, color: ghost ? brand : onBrand, border: ghost ? `1.5px solid ${brand}` : "none", borderRadius: 10, padding: big ? "15px 26px" : "11px 20px", fontSize: D ? 14 : 13.5, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, width: full ? "100%" : "auto" }}>
      {!ghost && <WAIcon s={15} fill={onBrand} />} {children}
    </button>
  );
  const Eyebrow = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 12, background: SOFT, padding: "5px 12px", borderRadius: 7 }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: brand }} />
      <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: rtl ? 0 : "1px", textTransform: uc, color: brand }}>{children}</span>
    </div>
  );
  const H2 = ({ children, size }: { children: React.ReactNode; size?: number }) => (
    <h2 style={{ fontFamily: disp, fontSize: size || (D ? 38 : 26), fontWeight: 800, lineHeight: 1.08, letterSpacing: rtl ? 0 : "-0.6px", color: INK, margin: 0 }}>{children}</h2>
  );
  const Wrap = ({ children, pt, pb, style, id, section }: { children: React.ReactNode; pt?: number; pb?: number; style?: React.CSSProperties; id?: string; section?: string }) => (
    <section id={id} data-pmx-section={section} style={{ scrollMarginTop: D ? 60 : 54, padding: `${pt != null ? pt : (D ? 64 : 38)}px ${px}px ${pb != null ? pb : (D ? 64 : 38)}px`, ...style }}>{children}</section>
  );
  const SecHead = ({ eyebrow, title: t, sub }: { eyebrow: string; title: string; sub?: string }) => (
    <div style={{ marginBottom: D ? 30 : 22 }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <H2>{t}</H2>
      {sub && <p style={{ fontFamily: sans, fontSize: D ? 15.5 : 14, color: MUT, lineHeight: 1.6, margin: "12px 0 0", maxWidth: 560 }}>{sub}</p>}
    </div>
  );
  const LeaderRow = ({ label, sub, value, bold, big }: { label: string; sub?: string; value: string; bold?: boolean; big?: boolean }) => (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 8, padding: "11px 0" }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontFamily: sans, fontSize: big ? (D ? 16 : 15) : 14, fontWeight: bold ? 800 : 600, color: INK }}>{label}</div>
        {sub && <div style={{ fontFamily: sans, fontSize: 11.5, color: FAINT, marginTop: 2 }}>{sub}</div>}
      </div>
      <div style={{ flex: 1, borderBottom: `1px dotted ${LINE}`, marginBottom: 5 }} />
      <div style={{ flexShrink: 0, fontFamily: mono, fontSize: big ? (D ? 22 : 19) : 15, fontWeight: bold ? 700 : 400, color: bold ? brand : INK }}>{value}</div>
    </div>
  );

  // ════════ HERO ════════
  const Hero = () => (
    <div data-pmx-section="hero" style={{ background: BG }}>
      {cover && (
        <div style={{ padding: D ? `40px ${px}px 0` : `18px ${px}px 0` }}>
          <div style={{ position: "relative", borderRadius: 16, overflow: "hidden", border: `1px solid ${LINE}`, height: D ? 300 : 190 }}>
            <img src={cover} alt="" onClick={() => zoom(cover)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", cursor: "zoom-in" }} />
          </div>
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 48 : 24, padding: D ? `${cover ? 40 : 60}px ${px}px ${cover ? 48 : 60}px` : `${cover ? 22 : 34}px ${px}px 24px`, alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: SOFT, color: brand, padding: "7px 14px", borderRadius: 999, fontFamily: sans, fontSize: 12, fontWeight: 700, letterSpacing: rtl ? 0 : "0.4px", marginBottom: 18 }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: brand }} /> <span data-pmx-field="destination">{pkg.destination}</span>
          </div>
          <h1 style={{ fontFamily: disp, fontSize: D ? 50 : 33, fontWeight: 800, lineHeight: 1.04, letterSpacing: rtl ? 0 : "-1.2px", color: INK, margin: 0 }} data-pmx-field="title">{title}</h1>
          {pkg.description && <p style={{ fontFamily: sans, fontSize: D ? 16 : 14.5, color: MUT, lineHeight: 1.7, margin: "20px 0 0", maxWidth: 420 }}>{pkg.description}</p>}
          <div style={{ display: "flex", gap: 12, marginTop: 26, flexWrap: "wrap" }}>
            {pkg.whatsapp && <CTA big onClick={onWhatsApp}>{L.ui.book}</CTA>}
            {pkg.messenger && onMessenger && <CTA big ghost onClick={onMessenger}>{L.ui.messenger}</CTA>}
          </div>
        </div>
        <div style={{ background: PAPER, borderRadius: 16, border: `1px solid ${LINE}`, boxShadow: "0 18px 50px rgba(21,33,46,0.08)", overflow: "hidden" }}>
          <div style={{ padding: D ? "20px 24px" : "16px 18px", borderBottom: `1px dashed ${LINE}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontFamily: mono, fontSize: 12, fontWeight: 700, color: INK, letterSpacing: rtl ? 0 : "1px", textTransform: uc }}>{L.ui.quote}</div>
            <div style={{ fontFamily: mono, fontSize: 11, color: FAINT }}>{pkg.destination}</div>
          </div>
          {breakdown.length > 0 && <div style={{ padding: D ? "8px 24px" : "6px 18px" }}>{breakdown.map((b, i) => <LeaderRow key={i} label={b.l} value={b.v} />)}</div>}
          <div style={{ padding: D ? "14px 24px 22px" : "12px 18px 18px", borderTop: `2px solid ${INK}`, background: SOFT }}>
            <LeaderRow label={L.ui.total} value={dig(pkg.price || "")} bold big />
            <div style={{ fontFamily: sans, fontSize: 11.5, color: MUT, marginTop: 2 }}>{L.ui.totalLine}</div>
          </div>
        </div>
      </div>
    </div>
  );

  // ════════ SCARCITY ════════
  const Scarcity = () => {
    const sc = pkg.scarcity;
    if (!sc || sc.spotsRemaining == null) return null;
    return (
      <Wrap pt={D ? 40 : 26} pb={D ? 24 : 16} section="scarcity">
        <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 14, padding: D ? "24px 28px" : 20, display: "flex", flexDirection: D ? "row" : "column", gap: D ? 0 : 16, justifyContent: "space-between", alignItems: D ? "center" : "stretch" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: SOFT, color: brand, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" /></svg>
            </div>
            <div style={{ maxWidth: 460 }}>
              <div style={{ fontFamily: sans, fontSize: 10.5, color: FAINT, letterSpacing: rtl ? 0 : "1px", textTransform: uc, marginBottom: 4 }}>{L.sections.scarcity}</div>
              <div style={{ fontFamily: sans, fontSize: D ? 15.5 : 14, fontWeight: 600, color: INK, lineHeight: 1.5 }}>{L.ui.spotsLine(sc.spotsRemaining)}</div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 22 }}>
            <div>
              <div style={{ fontFamily: mono, fontSize: D ? 30 : 24, fontWeight: 700, color: brand, lineHeight: 1 }}>{dig(sc.spotsRemaining)}</div>
              <div style={{ fontFamily: sans, fontSize: 11, color: FAINT, marginTop: 4 }}>{ar("rooms at this rate", "غرف بهذا السعر")}</div>
            </div>
            {sc.firstDepartureDate && (
              <div>
                <div style={{ fontFamily: mono, fontSize: D ? 18 : 16, fontWeight: 700, color: INK, lineHeight: 1, marginTop: D ? 8 : 5 }}>{dig(sc.firstDepartureDate)}</div>
                <div style={{ fontFamily: sans, fontSize: 11, color: FAINT, marginTop: 4 }}>{L.ui.nextDeparture}</div>
              </div>
            )}
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
      <Wrap pt={D ? 36 : 22} section="highlights">
        <SecHead eyebrow={L.nav.highlights} title={ar("Honesty, built in", "الشفافية من صميمنا")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 14 }}>
          {items.map((h, i) => {
            const t = secItemStr(h, "title", "text", "label");
            const d = typeof h === "object" ? secItemStr(h, "desc", "description") : "";
            return (
              <div key={i} style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 14, padding: D ? 26 : 20 }}>
                <div style={{ fontFamily: mono, fontSize: 13, fontWeight: 700, color: brand, marginBottom: 12 }}>{dig(`0${i + 1}`.slice(-2))}</div>
                <div style={{ fontFamily: disp, fontSize: D ? 19 : 17, fontWeight: 800, color: INK, marginBottom: d ? 8 : 0, lineHeight: 1.25 }}>{t}</div>
                {d && <div style={{ fontFamily: sans, fontSize: 13.5, color: MUT, lineHeight: 1.6 }}>{d}</div>}
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
    const tiles = imgs.slice(1, 4);
    const stops = mapImage ? [] : itinDays.slice(0, 5).map((d) => ({ label: secItemStr(d, "title") })).filter((s) => s.label);
    return (
      <Wrap style={{ background: PAPER }} section="media">
        <SecHead eyebrow={L.sections.media} title={ar("Exactly what you're buying", "بالضبط ما تشتريه")} />
        <SmVideo src={video} poster={cover || imgs[0]} accent={brand} radius={14} rtl={rtl} sans={sans} height={D ? 420 : 220} ui={L.ui} />
        {tiles.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: D ? 12 : 7, marginTop: D ? 12 : 7 }}>
            {tiles.map((u, i) => <img key={i} src={u} onClick={() => zoom(u)} style={{ width: "100%", height: D ? 170 : 76, objectFit: "cover", borderRadius: 12, display: "block", cursor: "zoom-in" }} />)}
          </div>
        )}
        {(mapImage || stops.length > 0) && (
          <div style={{ marginTop: D ? 22 : 16 }}>
            <div style={{ fontFamily: mono, fontSize: 11, color: brand, fontWeight: 700, letterSpacing: rtl ? 0 : "1px", textTransform: uc, marginBottom: 10 }}>{L.ui.route}</div>
            {mapImage
              ? <img src={mapImage} alt={mapCaption} style={{ width: "100%", height: D ? 210 : 160, objectFit: "cover", borderRadius: 12, display: "block" }} />
              : <SmRouteMap stops={stops} line={brand} ink={INK} height={D ? 210 : 160} rounded={12} rtl={rtl} />}
            {mapCaption && <div style={{ fontFamily: sans, fontSize: 12.5, color: FAINT, marginTop: 10 }}>{mapCaption}</div>}
          </div>
        )}
      </Wrap>
    );
  };

  // ════════ ITINERARY ════════
  const Itinerary = () => {
    if (!itinDays.length) return null;
    return (
      <Wrap section="itinerary">
        <SecHead eyebrow={L.sections.itinerary} title={ar("Day by day", "يومًا بيوم")} />
        <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 14, overflow: "hidden" }}>
          {itinDays.map((it, i) => {
            const day = (it.day as number) ?? i + 1;
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: D ? "60px 1fr" : "44px 1fr", gap: D ? 20 : 14, padding: D ? "18px 24px" : "15px 16px", alignItems: "center", borderTop: i ? `1px solid ${LINE}` : "none" }}>
                <div style={{ fontFamily: mono, fontSize: D ? 15 : 13, fontWeight: 700, color: onBrand, background: brand, borderRadius: 8, width: D ? 40 : 32, height: D ? 40 : 32, display: "flex", alignItems: "center", justifyContent: "center" }}>{rtl ? dig(day) : `D${day}`}</div>
                <div>
                  <div style={{ fontFamily: disp, fontSize: D ? 17 : 15.5, fontWeight: 800, color: INK }}>{secItemStr(it, "title")}</div>
                  {secItemStr(it, "desc", "description") && <div style={{ fontFamily: sans, fontSize: 13, color: MUT, lineHeight: 1.5, marginTop: 3 }}>{secItemStr(it, "desc", "description")}</div>}
                </div>
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
    const r0 = (secArr(rich, "hotels").length ? secArr(rich, "hotels") : secArr(rich, "items"))[0];
    const name = r0 ? secItemStr(r0, "name") : "";
    const stars = r0 && typeof r0.stars === "number" ? (r0.stars as number) : 0;
    const blurb = (r0 ? secItemStr(r0, "note", "description", "blurb") : "") || secStr(h, "description") || pkg.hotelDescription || "";
    const features = r0 ? secStrArr(r0, "facilities").concat(secStrArr(r0, "features")) : [];
    if (!blurb && !name) return null;
    const img = mediaImgs[2] || mediaImgs[0] || cover;
    return (
      <Wrap style={{ background: PAPER }} section="hotel">
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 40 : 18, alignItems: "center" }}>
          {img && <img src={img} onClick={() => zoom(img)} style={{ width: "100%", height: D ? 340 : 210, objectFit: "cover", borderRadius: 14, display: "block", cursor: "zoom-in" }} />}
          <div>
            <Eyebrow>{L.sections.hotel}</Eyebrow>
            <H2 size={D ? 30 : 23}>{name || ar("Your stay", "إقامتك")}</H2>
            {stars > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "10px 0 14px" }}>
                <SmStars n={stars} size={15} color={brand} /><span style={{ fontFamily: sans, fontSize: 12, color: FAINT }}>{dig(stars)} {L.ui.stars}</span>
              </div>
            )}
            {blurb && <p style={{ fontFamily: sans, fontSize: D ? 15 : 14, color: MUT, lineHeight: 1.7, margin: stars > 0 ? 0 : "14px 0 0", whiteSpace: "pre-line" }}>{blurb}</p>}
            {features.length > 0 && <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 18 }}>{features.map((f, i) => <div key={i} style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: INK, background: BG, border: `1px solid ${LINE}`, borderRadius: 9, padding: "9px 13px" }}>{f}</div>)}</div>}
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
      <Wrap section="meals">
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1.1fr" : "1fr", gap: D ? 48 : 22 }}>
          <div>
            <Eyebrow>{L.sections.meals}</Eyebrow>
            <H2 size={D ? 30 : 23}>{planLabel}</H2>
          </div>
          {notes && <p style={{ fontFamily: sans, fontSize: 14, color: MUT, lineHeight: 1.7, margin: 0, whiteSpace: "pre-line" }}>{notes}</p>}
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
      <Wrap style={{ background: PAPER }} section="inclusions">
        <SecHead eyebrow={L.sections.inclusions} title={ar("On the bill vs. off it", "على الفاتورة وخارجها")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 16 : 14 }}>
          {includes.length > 0 && (
            <div style={{ background: SOFT, borderRadius: 14, padding: D ? 24 : 18 }}>
              <div style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 800, color: brand, letterSpacing: rtl ? 0 : "1px", textTransform: uc, marginBottom: 14 }}>{L.ui.included}</div>
              {includes.map((it, i) => <div key={i} style={{ display: "flex", gap: 11, padding: "8px 0", alignItems: "flex-start" }}><span style={{ width: 18, height: 18, borderRadius: "50%", background: brand, color: onBrand, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0, marginTop: 1 }}>✓</span><span style={{ fontFamily: sans, fontSize: 13.5, color: INK, lineHeight: 1.5 }}>{it}</span></div>)}
            </div>
          )}
          {excludes.length > 0 && (
            <div style={{ background: BG, border: `1px solid ${LINE}`, borderRadius: 14, padding: D ? 24 : 18 }}>
              <div style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 800, color: FAINT, letterSpacing: rtl ? 0 : "1px", textTransform: uc, marginBottom: 14 }}>{L.ui.notIncluded}</div>
              {excludes.map((it, i) => <div key={i} style={{ display: "flex", gap: 11, padding: "8px 0", alignItems: "flex-start" }}><span style={{ width: 18, height: 18, borderRadius: "50%", border: `1px solid ${LINE}`, color: FAINT, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0, marginTop: 1 }}>—</span><span style={{ fontFamily: sans, fontSize: 13.5, color: MUT, lineHeight: 1.5 }}>{it}</span></div>)}
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
      <Wrap section="transfers">
        <SecHead eyebrow={L.sections.transfers} title={ar("Getting around", "التنقّل")} sub={items.length ? undefined : desc} />
        {items.length > 0 && (
          <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 14, overflow: "hidden" }}>
            {items.map((t, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: D ? "1fr 2fr" : "1fr", gap: D ? 20 : 4, padding: D ? "18px 24px" : "15px 16px", alignItems: D ? "center" : "stretch", borderTop: i ? `1px solid ${LINE}` : "none" }}>
                <div style={{ fontFamily: disp, fontSize: D ? 16 : 15, fontWeight: 800, color: INK }}>{secItemStr(t, "leg", "title", "name", "text")}</div>
                {typeof t === "object" && secItemStr(t, "desc", "description") && <div style={{ fontFamily: sans, fontSize: 13, color: MUT, lineHeight: 1.55 }}>{secItemStr(t, "desc", "description")}</div>}
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
      <Wrap style={{ background: PAPER }} section="visa">
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 48 : 22 }}>
          <div>
            <Eyebrow>{L.sections.visa}</Eyebrow>
            <H2 size={D ? 30 : 23}>{VISA_HEAD[included]?.[lang] || ar("Visa & entry", "التأشيرة والدخول")}</H2>
          </div>
          {content && <p style={{ fontFamily: sans, fontSize: 14, color: MUT, lineHeight: 1.7, margin: 0, whiteSpace: "pre-line" }}>{content}</p>}
        </div>
      </Wrap>
    );
  };

  // ════════ DEPARTURES ════════
  const Departures = () => {
    const rows = depEntries.length ? depEntries : (pkg.departures ?? []).map((d) => ({ date: d.date, price: d.price, spots: d.spots } as SecData));
    if (!rows.length) return null;
    const col = (spots: number) => spots <= 0 ? FAINT : spots <= 3 ? "#c2730a" : brand;
    return (
      <Wrap id="sm-departures" section="departures">
        <SecHead eyebrow={L.sections.departures} title={ar("Where you fly from", "من أين تنطلق")} />
        {D ? (
          <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.2fr 1fr 1fr auto", padding: "13px 24px", fontFamily: mono, fontSize: 10.5, fontWeight: 700, letterSpacing: rtl ? 0 : "0.6px", textTransform: uc, color: FAINT, borderBottom: `1px solid ${LINE}`, background: BG }}>
              <div>{L.ui.from}</div><div>{L.ui.date}</div><div>{L.ui.depart}</div><div>{L.ui.availability}</div><div style={{ textAlign: "end" }}>{L.ui.price}</div><div />
            </div>
            {rows.map((r, i) => {
              const spots = typeof r.spots === "number" ? r.spots : Number(r.spots) || 0; const sold = spots <= 0;
              const from = secItemStr(r, "origin", "from"); const date = secItemStr(r, "date");
              const dep = secItemStr(r, "flyingTime"); const arrt = secItemStr(r, "arrivingTime"); const price = secItemStr(r, "price");
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.2fr 1fr 1fr auto", padding: "15px 24px", alignItems: "center", borderTop: i ? `1px solid ${LINE}` : "none", opacity: sold ? 0.5 : 1 }}>
                  <div style={{ fontFamily: disp, fontSize: 15, fontWeight: 800, color: INK }}>{from || dig(date)}</div>
                  <div style={{ fontFamily: sans, fontSize: 13, color: MUT }}>{dig(date)}</div>
                  <div style={{ fontFamily: mono, fontSize: 12.5, color: MUT }}>{dep ? `${dig(dep)}${arrt ? `→${dig(arrt)}` : ""}` : "—"}</div>
                  <div style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 700, color: col(spots) }}>{sold ? L.ui.soldOut : `${dig(spots)} ${L.ui.left}`}</div>
                  <div style={{ fontFamily: mono, fontSize: 17, fontWeight: 700, color: INK, textAlign: "end" }}>{dig(price)}</div>
                  <div style={{ textAlign: "end", paddingInlineStart: 16 }}>{sold ? <span style={{ fontFamily: sans, fontSize: 12, color: FAINT }}>—</span> : (pkg.whatsapp ? <CTA onClick={onWhatsApp}>{ar("Book", "احجز")}</CTA> : null)}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.map((r, i) => {
              const spots = typeof r.spots === "number" ? r.spots : Number(r.spots) || 0; const sold = spots <= 0;
              const from = secItemStr(r, "origin", "from"); const date = secItemStr(r, "date"); const price = secItemStr(r, "price");
              return (
                <div key={i} style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: 16, opacity: sold ? 0.55 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontFamily: disp, fontSize: 16, fontWeight: 800, color: INK }}>{from || dig(date)}</div>
                    {price && <div style={{ fontFamily: mono, fontSize: 17, fontWeight: 700, color: brand }}>{dig(price)}</div>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: sans, fontSize: 12.5, color: MUT }}>
                    <span>{dig(date)}</span><span style={{ color: col(spots), fontWeight: 700 }}>{sold ? L.ui.soldOut : `${dig(spots)} ${L.ui.left}`}</span>
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
      <Wrap style={{ background: PAPER }} id="sm-pricing" section="pricing">
        <SecHead eyebrow={L.sections.pricing} title={ar("Pick your option", "اختر خيارك")} />
        {tiers.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? `repeat(${Math.min(tiers.length, 3)},1fr)` : "1fr", gap: 14 }}>
            {tiers.map((t, i) => {
              const featured = tiers.length === 3 && i === 1;
              return (
                <div key={i} style={{ background: featured ? SOFT : BG, border: featured ? `1.5px solid ${brand}` : `1px solid ${LINE}`, borderRadius: 14, padding: D ? 26 : 20, position: "relative" }}>
                  {featured && <div style={{ position: "absolute", top: -11, insetInlineStart: 22, background: brand, color: onBrand, fontFamily: sans, fontSize: 10, fontWeight: 700, letterSpacing: rtl ? 0 : "0.6px", textTransform: uc, padding: "4px 11px", borderRadius: 999 }}>{L.ui.mostPopular}</div>}
                  <div style={{ fontFamily: sans, fontSize: 13, color: MUT }}>{localizeTierLabel(t.label, lang)}</div>
                  <div style={{ fontFamily: mono, fontSize: D ? 36 : 30, fontWeight: 700, color: INK, lineHeight: 1, marginTop: 8 }}>{dig(t.price)}</div>
                  {pkg.whatsapp && <div style={{ marginTop: 18 }}><CTA full onClick={onWhatsApp}>{ar("Book", "احجز")}</CTA></div>}
                </div>
              );
            })}
          </div>
        )}
        {(cancellation.length > 0 || schedule.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 32 : 22, marginTop: tiers.length ? 32 : 0 }}>
            {cancellation.length > 0 && (
              <div>
                <div style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 800, color: brand, letterSpacing: rtl ? 0 : "1px", textTransform: uc, marginBottom: 12 }}>{L.ui.cancellation}</div>
                {cancellation.map((s, i) => <div key={i} style={{ fontFamily: sans, fontSize: 13.5, color: MUT, padding: "6px 0", lineHeight: 1.5 }}>· {s}</div>)}
              </div>
            )}
            {schedule.length > 0 && (
              <div>
                <div style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 800, color: brand, letterSpacing: rtl ? 0 : "1px", textTransform: uc, marginBottom: 12 }}>{L.ui.paymentSchedule}</div>
                {schedule.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: i ? `1px solid ${LINE}` : "none" }}>
                    <span style={{ fontFamily: sans, fontSize: 13.5, color: INK }}>{secItemStr(s, "dueDate", "label")}</span>
                    <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: brand }}>{dig(secItemStr(s, "amount"))}</span>
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
        <SecHead eyebrow={L.sections.extras} title={ar("Add only what you want", "أضِف ما تريده فقط")} />
        <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 14, overflow: "hidden" }}>
          {items.map((e, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, padding: D ? "18px 24px" : "15px 16px", borderTop: i ? `1px solid ${LINE}` : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: disp, fontSize: D ? 16 : 15, fontWeight: 800, color: INK }}>{secItemStr(e, "name", "title")}</div>
                {secItemStr(e, "description", "desc") && <div style={{ fontFamily: sans, fontSize: 12.5, color: MUT, marginTop: 3, lineHeight: 1.5 }}>{secItemStr(e, "description", "desc")}</div>}
              </div>
              {secItemStr(e, "price") && <span style={{ fontFamily: mono, fontSize: 15, fontWeight: 700, color: brand, whiteSpace: "nowrap" }}>{dig(secItemStr(e, "price"))}</span>}
            </div>
          ))}
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
      <Wrap style={{ background: PAPER }} section="people">
        <div style={{ display: "grid", gridTemplateColumns: D ? "auto 1fr" : "1fr", gap: D ? 40 : 18, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: D ? "column" : "row", alignItems: "center", gap: 14 }}>
            {person.photo
              ? <img src={person.photo} style={{ width: D ? 150 : 84, height: D ? 150 : 84, borderRadius: "50%", objectFit: "cover" }} />
              : <div style={{ width: D ? 150 : 84, height: D ? 150 : 84, borderRadius: "50%", background: SOFT, color: brand, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: disp, fontSize: D ? 52 : 32, fontWeight: 800 }}>{person.name[0]}</div>}
            {!D && <div><div style={{ fontFamily: disp, fontSize: 19, fontWeight: 800, color: INK }}>{person.name}</div>{role && <div style={{ fontFamily: sans, fontSize: 12.5, color: brand, fontWeight: 600 }}>{role}</div>}</div>}
          </div>
          <div>
            {D && <><Eyebrow>{L.sections.people}</Eyebrow><div style={{ fontFamily: disp, fontSize: 26, fontWeight: 800, color: INK }}>{person.name}</div>{role && <div style={{ fontFamily: sans, fontSize: 13, color: brand, fontWeight: 600, marginTop: 3 }}>{role}</div>}</>}
            {bio && <p style={{ fontFamily: sans, fontSize: 14, color: MUT, lineHeight: 1.7, marginTop: D ? 14 : 0 }}>{bio}</p>}
            {years > 0 && <div style={{ display: "flex", gap: 24, marginTop: 18 }}><div><div style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, color: brand }}>{dig(years)}</div><div style={{ fontFamily: sans, fontSize: 11, color: FAINT }}>{L.ui.years}</div></div></div>}
            {pkg.whatsapp && <div style={{ marginTop: 18 }}><CTA onClick={onWhatsApp}>{L.ui.message}</CTA></div>}
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
      <Wrap id="sm-reviews" section="reviews">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: D ? 30 : 22 }}>
          <div><Eyebrow>{L.sections.reviews}</Eyebrow><H2 size={D ? 32 : 24}>{ar("No surprises, they say", "يقولون: لا مفاجآت")}</H2></div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontFamily: mono, fontSize: D ? 42 : 34, fontWeight: 700, color: brand, lineHeight: 1 }}>{dig(rating)}</div>
            <div><SmStars n={Math.round(rating)} size={14} color={brand} /><div style={{ fontFamily: sans, fontSize: 11.5, color: FAINT, marginTop: 3 }}>{L.ui.basedOn} {dig(count)} {L.ui.review}</div></div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 14 }}>
          {items.slice(0, 6).map((r, i) => (
            <div key={i} style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 14, padding: D ? 22 : 18 }}>
              <SmStars n={Math.round(r.rating || 5)} size={13} color={brand} />
              <p style={{ fontFamily: sans, fontSize: 14, color: INK, lineHeight: 1.6, margin: "12px 0 16px" }}>&ldquo;{r.text}&rdquo;</p>
              <div style={{ fontFamily: disp, fontSize: 14, fontWeight: 800, color: INK }}>{r.name}</div>
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
      <Wrap style={{ background: PAPER }} section="about_agency">
        <div style={{ display: "grid", gridTemplateColumns: D && image ? "1fr 1fr" : "1fr", gap: D ? 48 : 24, alignItems: "center" }}>
          <div>
            <Eyebrow>{L.sections.agency}</Eyebrow>
            <H2 size={D ? 32 : 25}>{agency.name}</H2>
            {agency.tagline && <div style={{ fontFamily: sans, fontSize: 14, color: brand, fontWeight: 600, marginTop: 6 }}>{agency.tagline}</div>}
            {story && <p style={{ fontFamily: sans, fontSize: 14.5, color: MUT, lineHeight: 1.7, marginTop: 16, whiteSpace: "pre-line" }}>{story}</p>}
          </div>
          {image && <img src={image} style={{ width: "100%", height: D ? 300 : 200, objectFit: "cover", borderRadius: 14 }} />}
        </div>
      </Wrap>
    );
  };

  // ════════ NOTES ════════
  const Notes = () => {
    const items = secMixed(findSec(pkg, "important_notes"), "items");
    if (!items.length) return null;
    return (
      <Wrap section="important_notes">
        <SecHead eyebrow={L.sections.notes} title={ar("The fine print, in plain sight", "التفاصيل الدقيقة، بكل وضوح")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 12 }}>
          {items.map((n, i) => {
            const t = secItemStr(n, "title");
            const body = secItemStr(n, "text", "desc", "description") || (typeof n === "string" ? n : "");
            return (
              <div key={i} style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 12, padding: D ? 20 : 16 }}>
                {t && <div style={{ fontFamily: disp, fontSize: D ? 16 : 15, fontWeight: 800, color: INK, marginBottom: 7 }}>{t}</div>}
                <div style={{ fontFamily: sans, fontSize: 13, color: MUT, lineHeight: 1.55 }}>{body}</div>
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
      <Wrap style={{ background: PAPER }} section="faq">
        <SecHead eyebrow={L.sections.faq} title={ar("Questions, answered", "إجابات على أسئلتك")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 14 : 10 }}>
          {items.map((f, i) => (
            <div key={i} style={{ background: BG, border: `1px solid ${LINE}`, borderRadius: 12, padding: D ? 22 : 18 }}>
              <div style={{ fontFamily: disp, fontSize: D ? 16.5 : 15.5, fontWeight: 800, color: INK, lineHeight: 1.3 }}>{secItemStr(f, "question", "q")}</div>
              {secItemStr(f, "answer", "a") && <p style={{ fontFamily: sans, fontSize: 13.5, color: MUT, lineHeight: 1.65, margin: "10px 0 0" }}>{secItemStr(f, "answer", "a")}</p>}
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
      <Wrap style={{ background: brand, color: onBrand }} section="custom">
        <div style={{ display: "grid", gridTemplateColumns: D && image ? "1.2fr 1fr" : "1fr", gap: D ? 48 : 22, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: smRgba(onBrand === "#ffffff" ? "#ffffff" : "#000000", 0.16), padding: "6px 13px", borderRadius: 999, fontFamily: sans, fontSize: 11, fontWeight: 700, letterSpacing: rtl ? 0 : "0.6px", textTransform: uc, marginBottom: 16 }}>{L.sections.custom}</div>
            {heading && <div style={{ fontFamily: disp, fontSize: D ? 36 : 26, fontWeight: 800, lineHeight: 1.1, marginBottom: 14 }}>{heading}</div>}
            {body && <p style={{ fontFamily: sans, fontSize: D ? 16 : 14.5, opacity: 0.92, lineHeight: 1.7, margin: 0, whiteSpace: "pre-line" }}>{body}</p>}
          </div>
          {image && <img src={image} style={{ width: "100%", height: D ? 300 : 200, objectFit: "cover", borderRadius: 14 }} />}
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
        <SecHead eyebrow={L.sections.others} title={ar("More trips, fully costed", "رحلات أخرى، بأسعار واضحة")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 14 }}>
          {list.map((o, i) => {
            const oTitle = secItemStr(o, "title"); const place = secItemStr(o, "destination", "place");
            const price = secItemStr(o, "price"); const oNights = secItemStr(o, "nights");
            const img = secItemStr(o, "image"); const link = secItemStr(o, "link");
            const Inner = (
              <div style={{ background: PAPER, border: `1px solid ${LINE}`, borderRadius: 14, overflow: "hidden", height: "100%" }}>
                <div style={{ height: 150, background: BG }}>{img && <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}</div>
                <div style={{ padding: 18 }}>
                  {place && <div style={{ fontFamily: sans, fontSize: 10.5, color: brand, fontWeight: 700, letterSpacing: rtl ? 0 : "1px", textTransform: uc }}>{place}</div>}
                  <div style={{ fontFamily: disp, fontSize: 17, fontWeight: 800, color: INK, margin: "8px 0 12px", lineHeight: 1.2 }}>{oTitle}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    {price && <span style={{ fontFamily: mono, fontSize: 18, fontWeight: 700, color: INK }}>{dig(price)}</span>}
                    {oNights && <span style={{ fontFamily: sans, fontSize: 12, color: FAINT }}>{dig(oNights)} {L.ui.nights}</span>}
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
      <Wrap pt={D ? 56 : 38} pb={D ? 56 : 38} style={{ background: SOFT, textAlign: "center" }}>
        <H2 size={D ? 40 : 28}>{L.ui.theTotal}</H2>
        <div style={{ fontFamily: sans, fontSize: 14, color: MUT, margin: "12px 0 22px" }}>{L.ui.replyTime}{pkg.whatsapp ? ` · ${dig(pkg.whatsapp)}` : ""}</div>
        <div style={{ display: "inline-flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {pkg.whatsapp && <CTA big onClick={onWhatsApp}>{L.ui.bookWhatsapp}</CTA>}
          {pkg.messenger && onMessenger && <CTA big ghost onClick={onMessenger}>{L.ui.messenger}</CTA>}
        </div>
      </Wrap>
      <div style={{ padding: `20px ${px}px`, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${LINE}`, background: PAPER }}>
        <div style={{ fontFamily: disp, fontSize: 17, fontWeight: 800, color: INK }}>{agency.name}</div>
        <div style={{ fontFamily: sans, fontSize: 10, color: FAINT, letterSpacing: rtl ? 0 : "1px", textTransform: uc }}>{L.ui.poweredBy}</div>
      </div>
    </div>
  );

  // ════════ BAR ════════
  const initials = (agency.name || "S").split(" ").map((w) => w[0]).slice(0, 2).join("");
  const Bar = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${px}px`, height: D ? 60 : 54, borderBottom: `1px solid ${LINE}`, background: smRgba("#ffffff", 0.92), backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 30 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: D ? 32 : 28, height: D ? 32 : 28, borderRadius: 8, background: brand, color: onBrand, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: disp, fontSize: 14, fontWeight: 800 }}>{initials}</div>
        <div style={{ fontFamily: disp, fontSize: D ? 18 : 16, fontWeight: 800, color: INK }}>{agency.name}</div>
      </div>
      {D ? (
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {navItems.map(([key, label]) => <button key={key} onClick={() => goTo(key)} style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: MUT, background: "none", border: "none", cursor: "pointer", padding: 0 }}>{label}</button>)}
          {pkg.whatsapp && <CTA onClick={onWhatsApp}>{dig(pkg.price || "")} {L.ui.allIn}</CTA>}
        </div>
      ) : (pkg.whatsapp && <CTA onClick={onWhatsApp}>{dig(pkg.price || "")}</CTA>)}
    </div>
  );

  return (
    <div dir={rtl ? "rtl" : "ltr"} lang={lang} style={{ width: "100%", background: BG, color: INK, fontFamily: sans, position: "relative" }}>
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
export function TemplateSmartCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
