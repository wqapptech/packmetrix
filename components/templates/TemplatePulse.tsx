"use client";

// ═══════════════════════════════════════════════════════════════════════════
// PULSE V2 — Last-minute deals · electric, urgent, flash-sale.
// Near-black UI, neon dynamic brand glow, bold grotesk + tabular numerals,
// live ticker, live countdown to the first departure, pulsing dots.
// One component renders all 4 surfaces. Wired to real pkg.sections data with
// graceful empty states. Brand colour drives every glow/price/CTA.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useState, useEffect } from "react";
import { useIsDesktop, BaseCard, LightboxCarousel } from "./shared";
import { localizeTierLabel } from "@/lib/translations";
import type { TPageProps, TCardProps, TPackage } from "./types";

type SecData = Record<string, unknown>;

// ─── Brand colour math ────────────────────────────────────────────────────────
function puHex(h: string): [number, number, number] {
  h = h.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function puRgba(hex: string, a: number): string { const [r, g, b] = puHex(hex); return `rgba(${r},${g},${b},${a})`; }
function puMix(hex: string, target: string, t: number): string {
  const a = puHex(hex), b = puHex(target);
  const m = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}
function puDarken(hex: string, t: number) { return puMix(hex, "#000000", t); }
function puLum(hex: string) { const [r, g, b] = puHex(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
function puOn(hex: string) { return puLum(hex) > 0.62 ? "#0c0c0f" : "#ffffff"; }

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
    seatsLeft: "spots left", book: "Book now", grab: "Grab this deal", enquire: "Enquire on WhatsApp",
    bookWhatsapp: "Book on WhatsApp", messenger: "Messenger", message: "Message us", save: "Save",
    nextDeparture: "Next departure", date: "Date", depart: "Times", price: "Price", availability: "Spots",
    cancellation: "Cancellation policy", paymentSchedule: "Payment schedule", basedOn: "based on",
    review: "reviews", route: "Your route", replyTime: "Usually replies within an hour", add: "Add",
    watch: "Watch the film", noVideo: "Video coming soon", play: "Play", pause: "Pause", mute: "Mute",
    unmute: "Unmute", was: "was", poweredBy: "Powered by PackMetrix", dealLive: "Deal still live",
    sellingFast: "Selling fast", endsIn: "Deal ends in", dontSleep: "Don't sleep on this one.",
    spotsLine: (n: number) => `${n} ${n === 1 ? "spot" : "spots"} left at this price — moving fast.`,
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
    seatsLeft: "مقاعد متبقّية", book: "احجز الآن", grab: "اغتنم العرض", enquire: "استفسر عبر واتساب",
    bookWhatsapp: "احجز عبر واتساب", messenger: "ماسنجر", message: "راسلنا", save: "وفّر",
    nextDeparture: "أقرب موعد", date: "التاريخ", depart: "الأوقات", price: "السعر", availability: "المقاعد",
    cancellation: "سياسة الإلغاء", paymentSchedule: "جدول الدفع", basedOn: "من",
    review: "تقييم", route: "مسار رحلتك", replyTime: "نردّ عادةً خلال ساعة", add: "أضِف",
    watch: "شاهد الفيديو", noVideo: "الفيديو قريبًا", play: "تشغيل", pause: "إيقاف", mute: "كتم",
    unmute: "تشغيل الصوت", was: "كان", poweredBy: "مُشغّل بواسطة باكمتريكس", dealLive: "العرض ما زال نشطًا",
    sellingFast: "تنفد بسرعة", endsIn: "ينتهي العرض خلال", dontSleep: "لا تفوّت هذا العرض.",
    spotsLine: (n: number) => `بقي ${n} ${n === 1 ? "مكان" : "أماكن"} بهذا السعر — تنفد بسرعة.`,
  },
};

const MEAL_LABELS: Record<string, { en: string; ar: string }> = {
  none: { en: "No meals", ar: "بدون وجبات" }, breakfast: { en: "Breakfast included", ar: "إفطار مشمول" },
  half_board: { en: "Half board", ar: "نصف إقامة" }, full_board: { en: "Full board", ar: "إقامة كاملة" },
  all_inclusive: { en: "All inclusive", ar: "شامل بالكامل" },
};
const VISA_LABELS: Record<string, { en: string; ar: string }> = {
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

// ─── Icons ────────────────────────────────────────────────────────────────────
function WAIcon({ s = 16, fill = "currentColor" }: { s?: number; fill?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill={fill}><path d="M20.5 3.5C18.2 1.2 15.2 0 12 0 5.4 0 .1 5.3.1 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.4-1.7c1.7.9 3.7 1.4 5.6 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.3zM12 21.8c-1.7 0-3.4-.5-4.9-1.3l-.4-.2-3.7 1 1-3.6-.2-.4c-.9-1.5-1.4-3.3-1.4-5 0-5.5 4.5-9.9 9.9-9.9 2.6 0 5.1 1 7 2.9 1.9 1.9 2.9 4.4 2.9 7-.1 5.4-4.5 9.5-10.2 9.5z" /></svg>;
}
const Bolt = ({ s = 22 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4.5 13.5H11l-1 8.5L19.5 10H13z" /></svg>;
const ClockIcon = ({ s = 22 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" strokeLinecap="round" /></svg>;
const Shield = ({ s = 22 }: { s?: number }) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6z" strokeLinejoin="round" /><path d="M9 12l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" /></svg>;
const HL_ICONS = [Bolt, ClockIcon, Shield];

// ─── Star rating ──────────────────────────────────────────────────────────────
function PuStars({ n = 5, of = 5, size = 14, color }: { n?: number; of?: number; size?: number; color: string }) {
  const star = (fill: string) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} style={{ display: "block" }}><path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 18.6 5.9 20.8l1.2-6.6L2.3 9.6l6.6-.9z" /></svg>
  );
  return <span style={{ display: "inline-flex", gap: 2 }}>{Array.from({ length: of }).map((_, i) => <span key={i}>{star(i < n ? color : puRgba(color, 0.25))}</span>)}</span>;
}

// ─── Abstract route map ───────────────────────────────────────────────────────
function PuRouteMap({ stops, line, land = "#23232c", ink = "#f5f5f7", height = 220, rounded = 12, rtl = false }: { stops: { label: string }[]; line: string; land?: string; ink?: string; height?: number; rounded?: number; rtl?: boolean }) {
  const W = 1000, H = 420;
  const pts = stops.map((s, i) => {
    const x = stops.length === 1 ? W / 2 : 120 + (i * (W - 240)) / (stops.length - 1);
    const y = 150 + Math.sin(i * 1.3 + 0.6) * 70 + (i % 2 ? 20 : -10);
    return { ...s, x: rtl ? W - x : x, y };
  });
  const path = pts.map((p, i) => { if (i === 0) return `M ${p.x} ${p.y}`; const prev = pts[i - 1]; const mx = (prev.x + p.x) / 2; return `Q ${mx} ${prev.y - 40} ${p.x} ${p.y}`; }).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height, display: "block", borderRadius: rounded, background: puMix(land, "#000000", 0.3) }} preserveAspectRatio="xMidYMid slice">
      <g fill={land} opacity="0.9"><path d="M-40 300 Q 180 250 360 300 T 760 290 Q 920 270 1060 320 L1060 460 L-40 460 Z" /><ellipse cx="220" cy="120" rx="190" ry="90" opacity="0.5" /><ellipse cx="780" cy="100" rx="160" ry="80" opacity="0.5" /></g>
      <g stroke={puRgba(ink, 0.06)} strokeWidth="1">{[80, 180, 280, 360].map((y) => <line key={y} x1="0" x2={W} y1={y} y2={y} />)}{[200, 400, 600, 800].map((x) => <line key={x} y1="0" y2={H} x1={x} x2={x} />)}</g>
      <path d={path} fill="none" stroke={line} strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round" opacity="0.95" />
      {pts.map((p, i) => <g key={i}><circle cx={p.x} cy={p.y} r="11" fill={land} stroke={line} strokeWidth="3.5" /><circle cx={p.x} cy={p.y} r="4" fill={line} /><text x={p.x} y={p.y - 22} textAnchor="middle" fill={ink} fontSize="22" fontWeight="700" fontFamily="inherit">{p.label}</text></g>)}
    </svg>
  );
}

// ─── Video player ─────────────────────────────────────────────────────────────
function PuVideo({ src, poster, accent, radius = 14, rtl = false, sans, height = 320, ui }: { src?: string; poster?: string; accent: string; radius?: number; rtl?: boolean; sans: string; height?: number; ui: typeof L_EN["ui"] }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const ctrl: React.CSSProperties = { width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 };
  const onAccent = puOn(accent);
  if (!src) {
    return (
      <div style={{ position: "relative", borderRadius: radius, overflow: "hidden", height, background: "#000" }}>
        {poster && <img src={poster} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.3) brightness(0.5)" }} />}
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
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "linear-gradient(rgba(0,0,0,0.05),rgba(0,0,0,0.4))" }}>
          <div style={{ width: 70, height: 70, borderRadius: "50%", background: accent, color: onAccent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(0,0,0,0.45)" }}>
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
export function TemplatePulsePage({ pkg, agency, onWhatsApp, onMessenger, lang = "en" }: TPageProps) {
  const D = useIsDesktop();
  const rtl = lang === "ar";
  const L = rtl ? L_AR : L_EN;
  const brand = agency.brandColor || "#d63a3a";
  const onBrand = puOn(brand);
  const glow = puRgba(brand, 0.45);

  const BG = "#0c0c0f", SURF = "#16161c", SURF2 = "#1f1f27", INK = "#f5f5f7";
  const MUT = "rgba(245,245,247,0.64)", FAINT = "rgba(245,245,247,0.40)", LINE = "rgba(245,245,247,0.10)";
  const disp = rtl ? "var(--font-cairo), 'Cairo', sans-serif" : "var(--font-space-grotesk), 'Space Grotesk', sans-serif";
  const sans = rtl ? "var(--font-tajawal), 'Tajawal', sans-serif" : "var(--font-manrope), 'Manrope', sans-serif";
  const px = D ? 72 : 20;
  const ar = (en: string, a: string) => (rtl ? a : en);
  const dig = (s: string | number) => (rtl ? String(s).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]) : String(s));
  const uc: React.CSSProperties["textTransform"] = rtl ? "none" : "uppercase";

  // keyframes (client-only, injected once)
  useEffect(() => {
    if (typeof document === "undefined" || document.getElementById("pu-kf")) return;
    const s = document.createElement("style");
    s.id = "pu-kf";
    s.textContent =
      "@keyframes puDot{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.35;transform:scale(.7)}}" +
      "@keyframes puGlow{0%,100%{box-shadow:0 0 0 0 var(--pg,rgba(214,58,58,.5))}50%{box-shadow:0 0 0 7px rgba(0,0,0,0)}}" +
      "@keyframes puTick{from{transform:translateX(0)}to{transform:translateX(-50%)}}";
    document.head.appendChild(s);
  }, []);

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

  // ---- nav (only sections present) ----
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

  // ---- live countdown to the first departure (safe parse, client-only) ----
  const depDateStr = pkg.scarcity?.firstDepartureDate || secItemStr(depEntries[0], "date") || pkg.departures?.[0]?.date || "";
  const [rem, setRem] = useState<number | null>(null);
  useEffect(() => {
    const d = new Date(depDateStr);
    const target = depDateStr && !Number.isNaN(d.getTime()) && d.getTime() > Date.now() ? d.getTime() : null;
    if (target == null) return;
    const id = setInterval(() => setRem(Math.max(0, target - Date.now())), 1000);
    return () => clearInterval(id);
  }, [depDateStr]);
  const cd = rem == null ? null : ((): string[] => {
    const t = Math.floor(rem / 1000); const days = Math.floor(t / 86400);
    const h = Math.floor((t % 86400) / 3600), m = Math.floor((t % 3600) / 60), s = t % 60;
    const pad = (n: number) => dig(String(n).padStart(2, "0"));
    return days > 0 ? [pad(days), pad(h), pad(m)] : [pad(h), pad(m), pad(s)];
  })();

  // ---- ticker items composed from real data ----
  const tickerItems = [
    pkg.destination, nightsN ? `${dig(nightsN)} ${L.ui.nights}` : "",
    pkg.scarcity?.spotsRemaining != null ? `${dig(pkg.scarcity.spotsRemaining)} ${L.ui.seatsLeft}` : "",
    pkg.saving ? `${L.ui.save} ${dig(pkg.saving)}` : "",
    pkg.scarcity?.firstDepartureDate ? `${L.ui.nextDeparture} ${dig(pkg.scarcity.firstDepartureDate)}` : "",
  ].filter(Boolean) as string[];

  // ---- atoms ----
  const Live = ({ label }: { label: string }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: sans, fontSize: 11, fontWeight: 700, color: brand, letterSpacing: rtl ? 0 : "0.6px", textTransform: uc }}>
      <span style={{ width: 8, height: 8, borderRadius: "50%", background: brand, animation: "puDot 1.3s ease-in-out infinite" }} />{label}
    </span>
  );
  const CTA = ({ children, full, big, ghost, onClick }: { children: React.ReactNode; full?: boolean; big?: boolean; ghost?: boolean; onClick?: () => void }) => (
    <button data-testid="wa-cta" onClick={onClick} style={{ fontFamily: disp, background: ghost ? "transparent" : brand, color: ghost ? INK : onBrand, border: ghost ? `1.5px solid ${LINE}` : "none", borderRadius: 999, padding: big ? "16px 30px" : "12px 22px", fontSize: D ? (big ? 16 : 14) : 14, fontWeight: 700, letterSpacing: rtl ? 0 : "0.3px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, width: full ? "100%" : "auto", ...(ghost ? {} : { ["--pg" as string]: glow, animation: "puGlow 2.4s ease-out infinite" }) }}>
      {!ghost && <WAIcon s={16} fill={onBrand} />} {children}
    </button>
  );
  const Eyebrow = ({ children }: { children: React.ReactNode }) => (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 9, marginBottom: 12 }}>
      <span style={{ width: 22, height: 3, borderRadius: 2, background: brand }} />
      <span style={{ fontFamily: sans, fontSize: 11, fontWeight: 800, letterSpacing: rtl ? 0 : "1.8px", textTransform: uc, color: brand }}>{children}</span>
    </div>
  );
  const H2 = ({ children, size }: { children: React.ReactNode; size?: number }) => (
    <h2 style={{ fontFamily: disp, fontSize: size || (D ? 40 : 27), fontWeight: 700, lineHeight: 1.04, letterSpacing: rtl ? 0 : "-0.8px", color: INK, margin: 0 }}>{children}</h2>
  );
  const Wrap = ({ children, pt, pb, style, id, section }: { children: React.ReactNode; pt?: number; pb?: number; style?: React.CSSProperties; id?: string; section?: string }) => (
    <section id={id} data-pmx-section={section} style={{ scrollMarginTop: D ? 60 : 54, padding: `${pt != null ? pt : (D ? 70 : 40)}px ${px}px ${pb != null ? pb : (D ? 70 : 40)}px`, ...style }}>{children}</section>
  );
  const SecHead = ({ eyebrow, title: t, sub }: { eyebrow: string; title: string; sub?: string }) => (
    <div style={{ marginBottom: D ? 34 : 24 }}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <H2>{t}</H2>
      {sub && <p style={{ fontFamily: sans, fontSize: D ? 16 : 14, color: MUT, lineHeight: 1.6, margin: "12px 0 0", maxWidth: 560 }}>{sub}</p>}
    </div>
  );
  const Countdown = ({ big }: { big?: boolean }) => {
    if (!cd) return null;
    return (
      <div style={{ display: "flex", alignItems: "center", gap: big ? 8 : 6 }}>
        {cd.map((v, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ fontFamily: disp, fontSize: big ? 26 : 18, color: brand, fontWeight: 700 }}>:</span>}
            <span style={{ fontFamily: disp, fontSize: big ? 26 : 18, fontWeight: 700, color: INK, background: SURF2, border: `1px solid ${LINE}`, borderRadius: 8, padding: big ? "8px 11px" : "5px 8px", minWidth: big ? 44 : 32, textAlign: "center", fontVariantNumeric: "tabular-nums" }}>{v}</span>
          </React.Fragment>
        ))}
      </div>
    );
  };

  // ════════ TICKER ════════
  const Ticker = () => {
    if (!tickerItems.length) return null;
    return (
      <div style={{ background: brand, color: onBrand, overflow: "hidden", whiteSpace: "nowrap", borderBlock: `1px solid ${puRgba("#000000", 0.15)}` }}>
        <div style={{ display: "inline-flex", animation: "puTick 22s linear infinite" }}>
          {[0, 1].map((dup) => (
            <span key={dup} style={{ display: "inline-flex" }}>
              {tickerItems.map((t, i) => <span key={i} style={{ fontFamily: disp, fontSize: 12.5, fontWeight: 700, padding: "9px 22px", letterSpacing: rtl ? 0 : "0.4px", display: "inline-flex", alignItems: "center", gap: 22 }}>{t}<span style={{ opacity: 0.5 }}>◆</span></span>)}
            </span>
          ))}
        </div>
      </div>
    );
  };

  // ════════ HERO ════════
  const Hero = () => {
    const sc = pkg.scarcity;
    return (
      <div data-pmx-section="hero" style={{ position: "relative" }}>
        <div style={{ position: "relative", height: D ? 560 : 440, overflow: "hidden" }}>
          {cover && <img src={cover} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: `linear-gradient(${rtl ? "270deg" : "90deg"}, ${puRgba("#0c0c0f", D ? 0.92 : 0.4)} 0%, ${puRgba("#0c0c0f", D ? 0.5 : 0.55)} 45%, ${puRgba("#0c0c0f", 0.85)} 100%)` }} />
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: D ? "center" : "flex-end", padding: D ? `0 ${px}px` : `0 ${px}px 28px` }}>
            <div style={{ maxWidth: D ? 560 : "100%" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: brand, color: onBrand, padding: "6px 14px", borderRadius: 999, fontFamily: disp, fontSize: 12, fontWeight: 700, letterSpacing: rtl ? 0 : "1px", textTransform: uc, marginBottom: 16 }}>
                <Bolt s={14} /> {ar("Flash deal", "عرض خاطف")}
              </div>
              <h1 style={{ fontFamily: disp, fontSize: D ? 60 : 38, fontWeight: 700, lineHeight: 0.98, letterSpacing: rtl ? 0 : "-1.6px", color: "#fff", margin: 0 }} data-pmx-field="title">{title}</h1>
              {pkg.description && <p style={{ fontFamily: sans, fontSize: D ? 16 : 14, color: "rgba(255,255,255,0.82)", lineHeight: 1.6, margin: "18px 0 0", maxWidth: 440 }}>{pkg.description}</p>}
              <div style={{ display: "flex", alignItems: "flex-end", gap: D ? 28 : 18, marginTop: 26, flexWrap: "wrap" }}>
                <div>
                  {sc?.wasPrice && <div style={{ fontFamily: sans, fontSize: 12, color: "rgba(255,255,255,0.6)", textDecoration: "line-through", marginBottom: 2 }}>{dig(sc.wasPrice)}</div>}
                  <div style={{ fontFamily: disp, fontSize: D ? 56 : 42, fontWeight: 700, color: "#fff", lineHeight: 0.9 }} data-pmx-field="price">{dig(pkg.price || "")}</div>
                  {nightsN != null && <div style={{ fontFamily: sans, fontSize: 12, color: "rgba(255,255,255,0.7)", marginTop: 6 }}>{dig(nightsN)} {L.ui.nights} · {L.ui.perPerson}</div>}
                </div>
                {pkg.saving && (
                  <div style={{ background: puRgba(brand, 0.18), border: `1px solid ${puRgba(brand, 0.5)}`, borderRadius: 10, padding: "8px 14px" }}>
                    <div style={{ fontFamily: sans, fontSize: 10.5, color: "rgba(255,255,255,0.7)", marginBottom: 2 }}>{L.ui.save}</div>
                    <div style={{ fontFamily: disp, fontSize: D ? 24 : 20, fontWeight: 700, color: brand }}>{dig(pkg.saving)}</div>
                  </div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 24, flexWrap: "wrap" }}>
                {pkg.whatsapp && <CTA big onClick={onWhatsApp}>{L.ui.grab}</CTA>}
                {cd && <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <span style={{ fontFamily: sans, fontSize: 10.5, color: "rgba(255,255,255,0.6)", letterSpacing: rtl ? 0 : "0.5px" }}>{L.ui.endsIn}</span>
                  <Countdown />
                </div>}
              </div>
            </div>
          </div>
        </div>
        <Ticker />
      </div>
    );
  };

  // ════════ SCARCITY ════════
  const Scarcity = () => {
    const sc = pkg.scarcity;
    if (!sc || sc.spotsRemaining == null) return null;
    const total = sc.totalSpots && sc.totalSpots > 0 ? sc.totalSpots : Math.max(sc.spotsRemaining, 20);
    const filled = Math.round((sc.spotsRemaining / total) * 20);
    return (
      <Wrap pt={D ? 56 : 32} pb={D ? 30 : 20} section="scarcity">
        <div style={{ background: SURF, border: `1px solid ${puRgba(brand, 0.35)}`, borderRadius: 16, padding: D ? 28 : 20, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", insetInlineEnd: -40, top: -40, width: 180, height: 180, borderRadius: "50%", background: puRgba(brand, 0.12), filter: "blur(20px)" }} />
          <div style={{ display: "flex", flexDirection: D ? "row" : "column", gap: D ? 0 : 18, justifyContent: "space-between", alignItems: D ? "center" : "stretch", position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: disp, fontSize: D ? 56 : 46, fontWeight: 700, color: brand, lineHeight: 0.9 }}>{dig(sc.spotsRemaining)}</div>
                <div style={{ fontFamily: sans, fontSize: 10.5, color: FAINT, letterSpacing: rtl ? 0 : "1px", textTransform: uc, marginTop: 4 }}>{L.ui.seatsLeft}</div>
              </div>
              <div style={{ maxWidth: 360 }}>
                <Live label={L.ui.sellingFast} />
                <div style={{ fontFamily: disp, fontSize: D ? 20 : 16, fontWeight: 700, color: INK, lineHeight: 1.3, marginTop: 8 }}>{L.ui.spotsLine(sc.spotsRemaining)}</div>
                <div style={{ display: "flex", gap: 4, marginTop: 12 }}>
                  {Array.from({ length: 20 }).map((_, i) => <span key={i} style={{ flex: 1, height: 6, borderRadius: 3, background: i < filled ? brand : SURF2 }} />)}
                </div>
              </div>
            </div>
            {(pkg.recentBookings?.count || sc.firstDepartureDate) && (
              <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
                {pkg.recentBookings?.count ? (
                  <div style={{ textAlign: rtl ? "right" : "left" }}>
                    <div style={{ fontFamily: sans, fontSize: 10.5, color: FAINT, marginBottom: 4 }}>{ar("Booked recently", "حُجز مؤخرًا")}</div>
                    <div style={{ fontFamily: disp, fontSize: 22, fontWeight: 700, color: INK }}>{dig(pkg.recentBookings.count)}×</div>
                  </div>
                ) : null}
                {sc.firstDepartureDate && (
                  <div style={{ textAlign: rtl ? "right" : "left" }}>
                    <div style={{ fontFamily: sans, fontSize: 10.5, color: FAINT, marginBottom: 4 }}>{L.ui.nextDeparture}</div>
                    <div style={{ fontFamily: disp, fontSize: 18, fontWeight: 700, color: brand }}>{dig(sc.firstDepartureDate)}</div>
                  </div>
                )}
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
      <Wrap pt={D ? 40 : 24} section="highlights">
        <SecHead eyebrow={L.nav.highlights} title={ar("Why this one's a steal", "لماذا هذا العرض فرصة لا تُفوَّت")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 14 }}>
          {items.map((h, i) => {
            const Ic = HL_ICONS[i % HL_ICONS.length];
            const t = secItemStr(h, "title", "text", "label");
            const d = typeof h === "object" ? secItemStr(h, "desc", "description") : "";
            return (
              <div key={i} style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 14, padding: D ? 26 : 20 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: puRgba(brand, 0.14), color: brand, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}><Ic s={22} /></div>
                <div style={{ fontFamily: disp, fontSize: D ? 20 : 17, fontWeight: 700, color: INK, marginBottom: d ? 8 : 0, lineHeight: 1.25 }}>{t}</div>
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
      <Wrap pt={0} section="media">
        <SecHead eyebrow={L.sections.media} title={ar("See it before you book", "شاهده قبل أن تحجز")} />
        <PuVideo src={video} poster={cover || imgs[0]} accent={brand} radius={14} rtl={rtl} sans={sans} height={D ? 440 : 230} ui={L.ui} />
        {tiles.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: D ? 12 : 7, marginTop: D ? 12 : 7 }}>
            {tiles.map((u, i) => <img key={i} src={u} onClick={() => zoom(u)} style={{ width: "100%", height: D ? 180 : 78, objectFit: "cover", borderRadius: 12, display: "block", cursor: "zoom-in" }} />)}
          </div>
        )}
        {(mapImage || stops.length > 0) && (
          <div style={{ marginTop: D ? 22 : 16 }}>
            <div style={{ fontFamily: sans, fontSize: 10.5, color: brand, fontWeight: 800, letterSpacing: rtl ? 0 : "1.4px", textTransform: uc, marginBottom: 10 }}>{L.ui.route}</div>
            {mapImage
              ? <img src={mapImage} alt={mapCaption} style={{ width: "100%", height: D ? 220 : 160, objectFit: "cover", borderRadius: 12, display: "block" }} />
              : <PuRouteMap stops={stops} line={brand} height={D ? 220 : 160} rounded={12} rtl={rtl} />}
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
      <Wrap style={{ background: SURF }} section="itinerary">
        <SecHead eyebrow={L.sections.itinerary} title={ar("Day by day", "يومًا بيوم")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? `repeat(${Math.min(itinDays.length, 4)},1fr)` : "1fr", gap: D ? 14 : 10 }}>
          {itinDays.map((it, i) => {
            const day = dig((it.day as number) ?? i + 1);
            return (
              <div key={i} style={{ background: BG, border: `1px solid ${LINE}`, borderRadius: 14, padding: D ? 20 : 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ fontFamily: disp, fontSize: 13, fontWeight: 700, color: onBrand, background: brand, borderRadius: 8, width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center" }}>{day}</span>
                </div>
                <div style={{ fontFamily: disp, fontSize: D ? 17 : 16, fontWeight: 700, color: INK, lineHeight: 1.2, marginBottom: 8 }}>{secItemStr(it, "title")}</div>
                {secItemStr(it, "desc", "description") && <div style={{ fontFamily: sans, fontSize: 13, color: MUT, lineHeight: 1.55 }}>{secItemStr(it, "desc", "description")}</div>}
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
    const img = mediaImgs[1] || mediaImgs[0] || cover;
    return (
      <Wrap section="hotel">
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 40 : 18, alignItems: "center" }}>
          {img && (
            <div style={{ position: "relative", borderRadius: 16, overflow: "hidden" }}>
              <img src={img} onClick={() => zoom(img)} style={{ width: "100%", height: D ? 360 : 220, objectFit: "cover", display: "block", cursor: "zoom-in" }} />
              {stars > 0 && (
                <div style={{ position: "absolute", top: 14, insetInlineStart: 14, background: puRgba("#0c0c0f", 0.8), backdropFilter: "blur(6px)", borderRadius: 999, padding: "6px 13px", display: "flex", alignItems: "center", gap: 7 }}>
                  <PuStars n={stars} size={13} color={brand} /><span style={{ fontFamily: disp, fontSize: 12, fontWeight: 700, color: "#fff" }}>{dig(stars)}.0</span>
                </div>
              )}
            </div>
          )}
          <div>
            <Eyebrow>{L.sections.hotel}</Eyebrow>
            <H2 size={D ? 32 : 24}>{name || ar("Your stay", "إقامتك")}</H2>
            {blurb && <p style={{ fontFamily: sans, fontSize: D ? 15 : 14, color: MUT, lineHeight: 1.7, marginTop: 14, whiteSpace: "pre-line" }}>{blurb}</p>}
            {features.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>{features.map((f, i) => <span key={i} style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: INK, background: SURF2, borderRadius: 999, padding: "7px 14px" }}>{f}</span>)}</div>}
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
      <Wrap style={{ background: SURF }} section="meals">
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1.1fr" : "1fr", gap: D ? 48 : 22 }}>
          <div>
            <Eyebrow>{L.sections.meals}</Eyebrow>
            <H2 size={D ? 32 : 24}>{planLabel}</H2>
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
      <Wrap section="inclusions">
        <SecHead eyebrow={L.sections.inclusions} title={ar("What's in the price", "ما يشمله السعر")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 16 : 14 }}>
          {includes.length > 0 && (
            <div style={{ background: SURF, border: `1px solid ${puRgba(brand, 0.3)}`, borderRadius: 14, padding: D ? 24 : 18 }}>
              <div style={{ fontFamily: disp, fontSize: 12, fontWeight: 700, color: brand, letterSpacing: rtl ? 0 : "1px", textTransform: uc, marginBottom: 14 }}>✓ {L.ui.included}</div>
              {includes.map((it, i) => <div key={i} style={{ display: "flex", gap: 11, padding: "8px 0", alignItems: "flex-start" }}><span style={{ color: brand, flexShrink: 0, marginTop: 1, fontWeight: 700 }}>✓</span><span style={{ fontFamily: sans, fontSize: 13.5, color: INK, lineHeight: 1.5 }}>{it}</span></div>)}
            </div>
          )}
          {excludes.length > 0 && (
            <div style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 14, padding: D ? 24 : 18 }}>
              <div style={{ fontFamily: disp, fontSize: 12, fontWeight: 700, color: FAINT, letterSpacing: rtl ? 0 : "1px", textTransform: uc, marginBottom: 14 }}>{L.ui.notIncluded}</div>
              {excludes.map((it, i) => <div key={i} style={{ display: "flex", gap: 11, padding: "8px 0", alignItems: "flex-start" }}><span style={{ color: FAINT, flexShrink: 0, marginTop: 1 }}>—</span><span style={{ fontFamily: sans, fontSize: 13.5, color: MUT, lineHeight: 1.5 }}>{it}</span></div>)}
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
      <Wrap style={{ background: SURF }} section="transfers">
        <SecHead eyebrow={L.sections.transfers} title={ar("Picked up, dropped off", "نقل من الباب للباب")} sub={items.length ? undefined : desc} />
        {items.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 12 }}>
            {items.map((t, i) => (
              <div key={i} style={{ background: BG, border: `1px solid ${LINE}`, borderRadius: 14, padding: D ? 22 : 18 }}>
                <div style={{ fontFamily: disp, fontSize: 13, fontWeight: 700, color: brand, marginBottom: 10 }}>{dig(`0${i + 1}`.slice(-2))}</div>
                <div style={{ fontFamily: disp, fontSize: D ? 17 : 16, fontWeight: 700, color: INK, marginBottom: 6 }}>{secItemStr(t, "leg", "title", "name", "text")}</div>
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
      <Wrap section="visa">
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 48 : 22 }}>
          <div>
            <Eyebrow>{L.sections.visa}</Eyebrow>
            <H2 size={D ? 32 : 24}>{VISA_LABELS[included]?.[lang] || ar("Visa & entry", "التأشيرة والدخول")}</H2>
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
    const status = (spots: number) => spots <= 0 ? { t: L.ui.soldOut, col: FAINT } : spots <= 3 ? { t: `${dig(spots)} ${L.ui.left}`, col: brand } : { t: `${dig(spots)} ${L.ui.left}`, col: "#3ec96a" };
    return (
      <Wrap style={{ background: SURF }} id="pu-departures" section="departures">
        <SecHead eyebrow={L.sections.departures} title={ar("Pick your airport", "اختر مطارك")} />
        {D ? (
          <div style={{ background: BG, border: `1px solid ${LINE}`, borderRadius: 14, overflow: "hidden" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr auto", padding: "13px 22px", fontFamily: sans, fontSize: 10.5, fontWeight: 700, letterSpacing: rtl ? 0 : "0.8px", textTransform: uc, color: FAINT, borderBottom: `1px solid ${LINE}` }}>
              <div>{L.ui.from}</div><div>{L.ui.date}</div><div>{L.ui.depart}</div><div>{L.ui.availability}</div><div style={{ textAlign: "end" }}>{L.ui.price}</div><div />
            </div>
            {rows.map((r, i) => {
              const spots = typeof r.spots === "number" ? r.spots : Number(r.spots) || 0;
              const st = status(spots); const sold = spots <= 0;
              const from = secItemStr(r, "origin", "from"); const date = secItemStr(r, "date");
              const dep = secItemStr(r, "flyingTime"); const arr = secItemStr(r, "arrivingTime"); const price = secItemStr(r, "price");
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr 1fr 1fr auto", padding: "15px 22px", alignItems: "center", borderTop: i ? `1px solid ${LINE}` : "none", opacity: sold ? 0.45 : 1 }}>
                  <div style={{ fontFamily: disp, fontSize: 16, fontWeight: 700, color: INK }}>{from || dig(date)}</div>
                  <div style={{ fontFamily: sans, fontSize: 13, color: MUT }}>{dig(date)}</div>
                  <div style={{ fontFamily: sans, fontSize: 13, color: MUT, fontVariantNumeric: "tabular-nums" }}>{dep ? `${dig(dep)}${arr ? ` → ${dig(arr)}` : ""}` : "—"}</div>
                  <div style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 700, color: st.col }}>{st.t}</div>
                  <div style={{ fontFamily: disp, fontSize: 19, fontWeight: 700, color: INK, textAlign: "end" }}>{dig(price)}</div>
                  <div style={{ textAlign: "end", paddingInlineStart: 16 }}>{sold ? <span style={{ fontFamily: sans, fontSize: 12, color: FAINT }}>—</span> : (pkg.whatsapp ? <CTA onClick={onWhatsApp}>{L.ui.book}</CTA> : null)}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {rows.map((r, i) => {
              const spots = typeof r.spots === "number" ? r.spots : Number(r.spots) || 0;
              const st = status(spots); const sold = spots <= 0;
              const from = secItemStr(r, "origin", "from"); const date = secItemStr(r, "date"); const price = secItemStr(r, "price");
              return (
                <div key={i} style={{ background: BG, border: `1px solid ${LINE}`, borderRadius: 14, padding: 16, opacity: sold ? 0.5 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontFamily: disp, fontSize: 17, fontWeight: 700, color: INK }}>{from || dig(date)}</div>
                    {price && <div style={{ fontFamily: disp, fontSize: 19, fontWeight: 700, color: brand }}>{dig(price)}</div>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, fontFamily: sans, fontSize: 12.5, color: MUT }}>
                    <span>{dig(date)}</span><span style={{ color: st.col, fontWeight: 700 }}>{st.t}</span>
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
      <Wrap id="pu-pricing" section="pricing">
        <SecHead eyebrow={L.sections.pricing} title={ar("Pick your room", "اختر غرفتك")} />
        {tiers.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? `repeat(${Math.min(tiers.length, 3)},1fr)` : "1fr", gap: 14 }}>
            {tiers.map((t, i) => {
              const featured = tiers.length === 3 && i === 1;
              return (
                <div key={i} style={{ background: featured ? SURF : BG, border: featured ? `1.5px solid ${brand}` : `1px solid ${LINE}`, borderRadius: 16, padding: D ? 26 : 20, position: "relative" }}>
                  {featured && <div style={{ position: "absolute", top: -11, insetInlineStart: 22, background: brand, color: onBrand, fontFamily: disp, fontSize: 10, fontWeight: 700, letterSpacing: rtl ? 0 : "0.6px", textTransform: uc, padding: "4px 11px", borderRadius: 999 }}>{L.ui.mostPopular}</div>}
                  <div style={{ fontFamily: sans, fontSize: 13, color: MUT }}>{localizeTierLabel(t.label, lang)}</div>
                  <div style={{ fontFamily: disp, fontSize: D ? 40 : 32, fontWeight: 700, color: INK, lineHeight: 1, marginTop: 8 }}>{dig(t.price)}</div>
                  {pkg.whatsapp && <div style={{ marginTop: 18 }}><CTA full onClick={onWhatsApp}>{L.ui.book}</CTA></div>}
                </div>
              );
            })}
          </div>
        )}
        {(cancellation.length > 0 || schedule.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 32 : 22, marginTop: tiers.length ? 32 : 0 }}>
            {cancellation.length > 0 && (
              <div>
                <div style={{ fontFamily: disp, fontSize: 12, fontWeight: 700, color: brand, letterSpacing: rtl ? 0 : "1px", textTransform: uc, marginBottom: 12 }}>{L.ui.cancellation}</div>
                {cancellation.map((s, i) => <div key={i} style={{ fontFamily: sans, fontSize: 13.5, color: MUT, padding: "6px 0", lineHeight: 1.5 }}>· {s}</div>)}
              </div>
            )}
            {schedule.length > 0 && (
              <div>
                <div style={{ fontFamily: disp, fontSize: 12, fontWeight: 700, color: brand, letterSpacing: rtl ? 0 : "1px", textTransform: uc, marginBottom: 12 }}>{L.ui.paymentSchedule}</div>
                {schedule.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: i ? `1px solid ${LINE}` : "none" }}>
                    <span style={{ fontFamily: sans, fontSize: 13.5, color: INK }}>{secItemStr(s, "dueDate", "label")}</span>
                    <span style={{ fontFamily: disp, fontSize: 14, fontWeight: 700, color: brand }}>{dig(secItemStr(s, "amount"))}</span>
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
      <Wrap style={{ background: SURF }} section="extras">
        <SecHead eyebrow={L.sections.extras} title={ar("Bolt on more", "أضِف المزيد")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 12 }}>
          {items.map((e, i) => (
            <div key={i} style={{ background: BG, border: `1px solid ${LINE}`, borderRadius: 14, padding: D ? 22 : 18, display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ fontFamily: disp, fontSize: D ? 17 : 16, fontWeight: 700, color: INK }}>{secItemStr(e, "name", "title")}</div>
              {secItemStr(e, "description", "desc") && <div style={{ fontFamily: sans, fontSize: 13, color: MUT, lineHeight: 1.55, flex: 1 }}>{secItemStr(e, "description", "desc")}</div>}
              {secItemStr(e, "price") && <div style={{ fontFamily: disp, fontSize: 18, fontWeight: 700, color: brand }}>{dig(secItemStr(e, "price"))}</div>}
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
    return (
      <Wrap section="people">
        <div style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 18, padding: D ? 36 : 24, display: "grid", gridTemplateColumns: D ? "auto 1fr" : "1fr", gap: D ? 36 : 18, alignItems: "center" }}>
          <div style={{ display: "flex", flexDirection: D ? "column" : "row", alignItems: "center", gap: 14 }}>
            <div style={{ position: "relative" }}>
              {person.photo
                ? <img src={person.photo} style={{ width: D ? 150 : 84, height: D ? 150 : 84, borderRadius: "50%", objectFit: "cover" }} />
                : <div style={{ width: D ? 150 : 84, height: D ? 150 : 84, borderRadius: "50%", background: brand, color: onBrand, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: disp, fontSize: D ? 52 : 32, fontWeight: 700 }}>{person.name[0]}</div>}
              <span style={{ position: "absolute", bottom: 6, insetInlineEnd: 6, width: 16, height: 16, borderRadius: "50%", background: "#3ec96a", border: `2.5px solid ${SURF}`, animation: "puDot 1.6s ease-in-out infinite" }} />
            </div>
            {!D && <div><div style={{ fontFamily: disp, fontSize: 20, fontWeight: 700, color: INK }}>{person.name}</div>{role && <div style={{ fontFamily: sans, fontSize: 12.5, color: brand, fontWeight: 600 }}>{role}</div>}</div>}
          </div>
          <div>
            {D && <><Eyebrow>{L.sections.people}</Eyebrow><div style={{ fontFamily: disp, fontSize: 28, fontWeight: 700, color: INK }}>{person.name}</div>{role && <div style={{ fontFamily: sans, fontSize: 13, color: brand, fontWeight: 600, marginTop: 3 }}>{role}</div>}</>}
            {bio && <p style={{ fontFamily: sans, fontSize: 14, color: MUT, lineHeight: 1.7, marginTop: D ? 14 : 0 }}>{bio}</p>}
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
      <Wrap style={{ background: SURF }} id="pu-reviews" section="reviews">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 14, marginBottom: D ? 30 : 22 }}>
          <div><Eyebrow>{L.sections.reviews}</Eyebrow><H2 size={D ? 34 : 25}>{ar("Real, recent, ranked", "حقيقية، حديثة، مُقيَّمة")}</H2></div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontFamily: disp, fontSize: D ? 46 : 36, fontWeight: 700, color: brand, lineHeight: 1 }}>{dig(rating)}</div>
            <div><PuStars n={Math.round(rating)} size={14} color={brand} /><div style={{ fontFamily: sans, fontSize: 11.5, color: FAINT, marginTop: 3 }}>{L.ui.basedOn} {dig(count)} {L.ui.review}</div></div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 14 }}>
          {items.slice(0, 6).map((r, i) => (
            <div key={i} style={{ background: BG, border: `1px solid ${LINE}`, borderRadius: 14, padding: D ? 22 : 18 }}>
              <PuStars n={Math.round(r.rating || 5)} size={13} color={brand} />
              <p style={{ fontFamily: sans, fontSize: 14, color: INK, lineHeight: 1.6, margin: "12px 0 16px" }}>&ldquo;{r.text}&rdquo;</p>
              <div style={{ fontFamily: disp, fontSize: 14, fontWeight: 700, color: INK }}>{r.name}</div>
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
        <div style={{ display: "grid", gridTemplateColumns: D && image ? "1fr 1fr" : "1fr", gap: D ? 48 : 24, alignItems: "center" }}>
          <div>
            <Eyebrow>{L.sections.agency}</Eyebrow>
            <H2 size={D ? 34 : 26}>{agency.name}</H2>
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
      <Wrap style={{ background: SURF }} section="important_notes">
        <SecHead eyebrow={L.sections.notes} title={ar("Read before you book", "اقرأ قبل أن تحجز")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 12 }}>
          {items.map((n, i) => {
            const t = secItemStr(n, "title");
            const body = secItemStr(n, "text", "desc", "description") || (typeof n === "string" ? n : "");
            return (
              <div key={i} style={{ background: BG, border: `1px solid ${LINE}`, borderInlineStart: `3px solid ${brand}`, borderRadius: 12, padding: D ? 20 : 16 }}>
                {t && <div style={{ fontFamily: disp, fontSize: D ? 16 : 15, fontWeight: 700, color: INK, marginBottom: 7 }}>{t}</div>}
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
      <Wrap section="faq">
        <SecHead eyebrow={L.sections.faq} title={ar("Quick answers", "إجابات سريعة")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 14 : 10 }}>
          {items.map((f, i) => (
            <div key={i} style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 14, padding: D ? 22 : 18 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ fontFamily: disp, fontSize: 16, fontWeight: 700, color: brand, flexShrink: 0 }}>Q</span>
                <div style={{ fontFamily: disp, fontSize: D ? 17 : 15.5, fontWeight: 700, color: INK, lineHeight: 1.3 }}>{secItemStr(f, "question", "q")}</div>
              </div>
              {secItemStr(f, "answer", "a") && <p style={{ fontFamily: sans, fontSize: 13.5, color: MUT, lineHeight: 1.65, margin: "10px 0 0", paddingInlineStart: 26 }}>{secItemStr(f, "answer", "a")}</p>}
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
      <Wrap style={{ background: `linear-gradient(135deg, ${puDarken(brand, 0.25)}, ${puDarken(brand, 0.55)})`, color: "#fff" }} section="custom">
        <div style={{ display: "grid", gridTemplateColumns: D && image ? "1.2fr 1fr" : "1fr", gap: D ? 48 : 22, alignItems: "center" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(255,255,255,0.16)", padding: "6px 13px", borderRadius: 999, fontFamily: disp, fontSize: 11, fontWeight: 700, letterSpacing: rtl ? 0 : "1px", textTransform: uc, marginBottom: 16 }}>{L.sections.custom}</div>
            {heading && <div style={{ fontFamily: disp, fontSize: D ? 38 : 27, fontWeight: 700, lineHeight: 1.08, marginBottom: 14 }}>{heading}</div>}
            {body && <p style={{ fontFamily: sans, fontSize: D ? 16 : 14.5, color: "rgba(255,255,255,0.9)", lineHeight: 1.7, margin: 0, whiteSpace: "pre-line" }}>{body}</p>}
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
        <SecHead eyebrow={L.sections.others} title={ar("More deals leaving soon", "عروض أخرى تنطلق قريبًا")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 14 }}>
          {list.map((o, i) => {
            const oTitle = secItemStr(o, "title"); const place = secItemStr(o, "destination", "place");
            const price = secItemStr(o, "price"); const oNights = secItemStr(o, "nights");
            const img = secItemStr(o, "image"); const link = secItemStr(o, "link");
            const Inner = (
              <div style={{ background: SURF, border: `1px solid ${LINE}`, borderRadius: 14, overflow: "hidden", height: "100%" }}>
                <div style={{ position: "relative", height: 150, background: SURF2 }}>
                  {img && <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                  {place && <div style={{ position: "absolute", top: 12, insetInlineStart: 12, background: brand, color: onBrand, fontFamily: disp, fontSize: 10, fontWeight: 700, letterSpacing: rtl ? 0 : "0.6px", textTransform: uc, padding: "4px 10px", borderRadius: 999 }}>{place}</div>}
                </div>
                <div style={{ padding: 18 }}>
                  <div style={{ fontFamily: disp, fontSize: 17, fontWeight: 700, color: INK, lineHeight: 1.25, marginBottom: 12 }}>{oTitle}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    {price && <span style={{ fontFamily: disp, fontSize: 20, fontWeight: 700, color: brand }}>{dig(price)}</span>}
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
      <Wrap pt={D ? 60 : 40} pb={D ? 60 : 40} style={{ background: SURF, textAlign: "center", borderTop: `1px solid ${LINE}` }}>
        <Live label={L.ui.dealLive} />
        <div style={{ fontFamily: disp, fontSize: D ? 44 : 30, fontWeight: 700, color: INK, lineHeight: 1.06, margin: "14px 0 6px" }}>{L.ui.dontSleep}</div>
        <div style={{ fontFamily: sans, fontSize: 14, color: MUT, marginBottom: cd ? 16 : 20 }}>{L.ui.replyTime}{pkg.whatsapp ? ` · ${dig(pkg.whatsapp)}` : ""}</div>
        {cd && <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}><Countdown big /></div>}
        <div style={{ display: "inline-flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {pkg.whatsapp && <CTA big onClick={onWhatsApp}>{L.ui.bookWhatsapp}</CTA>}
          {pkg.messenger && onMessenger && <CTA big ghost onClick={onMessenger}>{L.ui.messenger}</CTA>}
        </div>
      </Wrap>
      <div style={{ padding: `20px ${px}px`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ fontFamily: disp, fontSize: 17, fontWeight: 700, color: INK }}>{agency.name}</div>
        <div style={{ fontFamily: sans, fontSize: 10, color: FAINT, letterSpacing: rtl ? 0 : "1px", textTransform: uc }}>{L.ui.poweredBy}</div>
      </div>
    </div>
  );

  // ════════ BAR ════════
  const initials = (agency.name || "P").split(" ").map((w) => w[0]).slice(0, 2).join("");
  const Bar = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${px}px`, height: D ? 60 : 54, borderBottom: `1px solid ${LINE}`, background: puRgba("#0c0c0f", 0.85), backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 30 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: D ? 32 : 28, height: D ? 32 : 28, borderRadius: 9, background: brand, color: onBrand, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: disp, fontSize: 14, fontWeight: 700 }}>{initials}</div>
        <div style={{ fontFamily: disp, fontSize: D ? 18 : 16, fontWeight: 700, color: INK }}>{agency.name}</div>
      </div>
      {D ? (
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {navItems.map(([key, label]) => <button key={key} onClick={() => goTo(key)} style={{ fontFamily: sans, fontSize: 13, fontWeight: 500, color: MUT, background: "none", border: "none", cursor: "pointer", padding: 0 }}>{label}</button>)}
          {pkg.whatsapp && <CTA onClick={onWhatsApp}>{dig(pkg.price || "")}</CTA>}
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
export function TemplatePulseCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
