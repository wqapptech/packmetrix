"use client";

// ═══════════════════════════════════════════════════════════════════════════
// SAKINA V2 — Religious / Umrah · a quiet, reverent journal.
// Ivory paper, deep ink, gold thread, Cormorant/Amiri serif, Jost labels,
// Mukta body, mihrab arches, centred rhythm, calm. Scarcity is reassurance.
// Dynamic brand colour themes arches, rules, numerals, CTAs.
// One component renders all 4 surfaces. Wired to real pkg.sections data.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useState } from "react";
import { useIsDesktop, BaseCard, LightboxCarousel } from "./shared";
import { localizeTierLabel } from "@/lib/translations";
import type { TPageProps, TCardProps, TPackage } from "./types";

type SecData = Record<string, unknown>;

// ─── Brand colour math ────────────────────────────────────────────────────────
function skHex(h: string): [number, number, number] {
  h = h.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function skRgba(hex: string, a: number): string { const [r, g, b] = skHex(hex); return `rgba(${r},${g},${b},${a})`; }
function skMix(hex: string, target: string, t: number): string {
  const a = skHex(hex), b = skHex(target);
  const m = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}
function skLighten(hex: string, t: number) { return skMix(hex, "#ffffff", t); }
function skLum(hex: string) { const [r, g, b] = skHex(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
function skOn(hex: string) { return skLum(hex) > 0.62 ? "#1f2a22" : "#ffffff"; }

const GOLD = "#b0894e";

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
    seatsLeft: "places left", book: "Reserve", reserve: "Reserve your place", enquire: "Enquire on WhatsApp",
    bookWhatsapp: "Book on WhatsApp", messenger: "Messenger", message: "Message us", nextDeparture: "Next departure",
    date: "Date", depart: "Times", price: "Price", availability: "Availability", to: "To",
    cancellation: "Cancellation policy", paymentSchedule: "Payment schedule", basedOn: "based on", review: "reviews",
    stars: "stars", route: "Your route", years: "years", replyTime: "Usually replies within an hour",
    watch: "Watch the film", noVideo: "Video coming soon", play: "Play", pause: "Pause", mute: "Mute",
    unmute: "Unmute", poweredBy: "Powered by PackMetrix", duration: "Duration", destination: "Destination",
    board: "Board", begin: "Begin your journey.",
    spotsLine: (n: number) => `A small group — ${n} ${n === 1 ? "place" : "places"} remain.`,
    reassure: "Take the time you need. We'll hold your enquiry and answer every question before you commit.",
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
    seatsLeft: "أماكن متبقّية", book: "احجز", reserve: "احجز مكانك", enquire: "استفسر عبر واتساب",
    bookWhatsapp: "احجز عبر واتساب", messenger: "ماسنجر", message: "راسلنا", nextDeparture: "أقرب موعد",
    date: "التاريخ", depart: "الأوقات", price: "السعر", availability: "التوفّر", to: "إلى",
    cancellation: "سياسة الإلغاء", paymentSchedule: "جدول الدفع", basedOn: "من", review: "تقييم",
    stars: "نجوم", route: "مسار رحلتك", years: "سنة", replyTime: "نردّ عادةً خلال ساعة",
    watch: "شاهد الفيديو", noVideo: "الفيديو قريبًا", play: "تشغيل", pause: "إيقاف", mute: "كتم",
    unmute: "تشغيل الصوت", poweredBy: "مُشغّل بواسطة باكمتريكس", duration: "المدة", destination: "الوجهة",
    board: "الإقامة", begin: "ابدأ رحلتك.",
    spotsLine: (n: number) => `مجموعة صغيرة — بقي ${n} ${n === 1 ? "مكان" : "أماكن"}.`,
    reassure: "خذ وقتك. سنحتفظ باستفسارك ونجيب عن كل سؤال قبل أن تلتزم.",
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
  agent: { en: "Travel designer", ar: "مصمّم الرحلات" }, curator: { en: "Travel designer", ar: "مصمّم الرحلات" },
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
function SkStars({ n = 5, of = 5, size = 14, color = GOLD }: { n?: number; of?: number; size?: number; color?: string }) {
  const star = (fill: string) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} style={{ display: "block" }}><path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 18.6 5.9 20.8l1.2-6.6L2.3 9.6l6.6-.9z" /></svg>
  );
  return <span style={{ display: "inline-flex", gap: 2 }}>{Array.from({ length: of }).map((_, i) => <span key={i}>{star(i < n ? color : skRgba(color, 0.25))}</span>)}</span>;
}

// ─── Abstract route map ───────────────────────────────────────────────────────
function SkRouteMap({ stops, line, land, ink = "#1f2a22", height = 220, rounded = 14, rtl = false }: { stops: { label: string }[]; line: string; land: string; ink?: string; height?: number; rounded?: number; rtl?: boolean }) {
  const W = 1000, H = 420;
  const pts = stops.map((s, i) => {
    const x = stops.length === 1 ? W / 2 : 120 + (i * (W - 240)) / (stops.length - 1);
    const y = 150 + Math.sin(i * 1.3 + 0.6) * 70 + (i % 2 ? 20 : -10);
    return { ...s, x: rtl ? W - x : x, y };
  });
  const path = pts.map((p, i) => { if (i === 0) return `M ${p.x} ${p.y}`; const prev = pts[i - 1]; const mx = (prev.x + p.x) / 2; return `Q ${mx} ${prev.y - 40} ${p.x} ${p.y}`; }).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height, display: "block", borderRadius: rounded, background: "#f0ecdf" }} preserveAspectRatio="xMidYMid slice">
      <g fill={land} opacity="0.9"><path d="M-40 300 Q 180 250 360 300 T 760 290 Q 920 270 1060 320 L1060 460 L-40 460 Z" /><ellipse cx="220" cy="120" rx="190" ry="90" opacity="0.5" /><ellipse cx="780" cy="100" rx="160" ry="80" opacity="0.5" /></g>
      <g stroke={skRgba(ink, 0.05)} strokeWidth="1">{[80, 180, 280, 360].map((y) => <line key={y} x1="0" x2={W} y1={y} y2={y} />)}{[200, 400, 600, 800].map((x) => <line key={x} y1="0" y2={H} x1={x} x2={x} />)}</g>
      <path d={path} fill="none" stroke={line} strokeWidth="3" strokeDasharray="2 12" strokeLinecap="round" opacity="0.85" />
      {pts.map((p, i) => <g key={i}><circle cx={p.x} cy={p.y} r="10" fill="#fdfbf4" stroke={line} strokeWidth="3" /><circle cx={p.x} cy={p.y} r="3.5" fill={line} /><text x={p.x} y={p.y - 22} textAnchor="middle" fill={ink} fontSize="22" fontWeight="500" fontFamily="inherit">{p.label}</text></g>)}
    </svg>
  );
}

// ─── Video player ─────────────────────────────────────────────────────────────
function SkVideo({ src, poster, accent, rtl = false, sans, height = 320, ui }: { src?: string; poster?: string; accent: string; rtl?: boolean; sans: string; height?: number; ui: typeof L_EN["ui"] }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const ctrl: React.CSSProperties = { width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 };
  const onAccent = skOn(accent);
  if (!src) {
    return (
      <div style={{ position: "relative", overflow: "hidden", height, background: "#1f2a22" }}>
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
export function TemplateSakinaPage({ pkg, agency, onWhatsApp, onMessenger, lang = "en" }: TPageProps) {
  const D = useIsDesktop();
  const rtl = lang === "ar";
  const L = rtl ? L_AR : L_EN;
  const brand = agency.brandColor || "#1f6f6b";
  const onBrand = skOn(brand);
  const soft = skLighten(brand, 0.82);
  const softer = skLighten(brand, 0.92);
  const tint = (a: number) => skRgba(brand, a);

  const PAPER = "#f6f2e9", CARD = "#fdfbf4", INK = "#1f2a22";
  const MUT = "rgba(31,42,34,0.66)", FAINT = "rgba(31,42,34,0.42)", RULE = "rgba(31,42,34,0.14)";
  const serif = rtl ? "var(--font-amiri), 'Amiri', serif" : "var(--font-cormorant), 'Cormorant Garamond', serif";
  const label = rtl ? "var(--font-tajawal), 'Tajawal', sans-serif" : "var(--font-jost), 'Jost', sans-serif";
  const body = rtl ? "var(--font-tajawal), 'Tajawal', sans-serif" : "var(--font-mukta), 'Mukta', sans-serif";
  const px = D ? 76 : 22;
  const ar = (en: string, a: string) => (rtl ? a : en);
  const dig = (s: string | number) => (rtl ? String(s).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]) : String(s));
  const uc: React.CSSProperties["textTransform"] = rtl ? "none" : "uppercase";
  const ARCH = D ? "200px 200px 16px 16px" : "120px 120px 12px 12px";

  const title = pkg.title || pkg.destination || "";
  const nightsN = pkg.nights ? Number(pkg.nights) : null;
  const cover = pkg.coverImage || pkg.images?.[0] || secStrArr(findSec(pkg, "media"), "images")[0] || "";
  const mediaImgs = secStrArr(findSec(pkg, "media"), "images");
  const itinDays = secArr(findSec(pkg, "itinerary"), "days").filter((d) => secItemStr(d, "title"));
  const depEntries = secArr(findSec(pkg, "departures"), "entries");
  const mealPlan = secStr(findSec(pkg, "meals"), "plan");
  const hasDepart = depEntries.length > 0 || (pkg.departures?.length ?? 0) > 0;
  const person = pkg.people?.find((p) => p.role === "agent" || p.role === "curator" || p.role === "trip_lead")
    ?? pkg.people?.[0] ?? (pkg.agent ? { name: pkg.agent.name, role: pkg.agent.role || "agent", photo: pkg.agent.avatar, years: pkg.agent.years } : undefined);

  // hotels (rich list or single description) → cards
  const hRich = findSec(pkg, "hotels");
  const richList = secArr(hRich, "hotels").length ? secArr(hRich, "hotels") : secArr(hRich, "items");
  const hotelDesc = secStr(findSec(pkg, "hotel"), "description") || pkg.hotelDescription || "";
  const hotels = richList.length
    ? richList.map((r) => ({ name: secItemStr(r, "name"), stars: typeof r.stars === "number" ? (r.stars as number) : 0, blurb: secItemStr(r, "note", "description", "blurb"), features: secStrArr(r, "facilities").concat(secStrArr(r, "features")) }))
    : (hotelDesc ? [{ name: "", stars: 0, blurb: hotelDesc, features: [] as string[] }] : []);

  // ---- clickable gallery → lightbox ----
  const photos = Array.from(new Set([cover, ...mediaImgs].filter(Boolean)));
  const [lightbox, setLightbox] = useState<number | null>(null);
  const zoom = (url: string) => { const i = photos.indexOf(url); if (i >= 0) setLightbox(i); };

  // ---- nav ----
  const goTo = (type: string) => { if (typeof document === "undefined") return; document.querySelector(`[data-pmx-section="${type}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" }); };
  const navItems = Object.entries(L.nav).filter(([key]) => {
    if (key === "reviews") return (pkg.reviews?.length ?? 0) > 0 && agency.showReviews !== false;
    if (key === "hotel") return hotels.length > 0;
    if (key === "itinerary") return secArr(findSec(pkg, "itinerary"), "days").length > 0;
    if (key === "inclusions") return secStrArr(findSec(pkg, "inclusions"), "includes").length + secStrArr(findSec(pkg, "inclusions"), "excludes").length + (pkg.includes?.length ?? 0) + (pkg.excludes?.length ?? 0) > 0;
    if (key === "departures") return secArr(findSec(pkg, "departures"), "entries").length > 0 || (pkg.departures?.length ?? 0) > 0;
    if (key === "pricing") return (pkg.pricingTiers?.length ?? 0) > 0 || !!findSec(pkg, "pricing");
    if (key === "faq") return secArr(findSec(pkg, "faq"), "items").length > 0;
    return !!findSec(pkg, key);
  });

  // hero meta from real facts
  const meta: { k: string; v: string }[] = [
    nightsN ? { k: L.ui.duration, v: `${dig(nightsN)} ${L.ui.nights}` } : null,
    pkg.destination ? { k: L.ui.destination, v: pkg.destination } : null,
    mealPlan && mealPlan !== "none" ? { k: L.ui.board, v: MEAL_LABELS[mealPlan]?.[lang] || mealPlan } : null,
  ].filter(Boolean).slice(0, 3) as { k: string; v: string }[];

  // ---- atoms ----
  const Diamond = ({ color = GOLD, s = 7 }: { color?: string; s?: number }) => (
    <span style={{ display: "inline-block", width: s, height: s, transform: "rotate(45deg)", background: color, opacity: 0.9 }} />
  );
  const RuleM = ({ center }: { center?: boolean }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: center ? "center" : "flex-start", gap: 10 }}>
      <span style={{ height: 1, width: center ? 44 : 30, background: GOLD, opacity: 0.6 }} />
      <Diamond />
      {center && <span style={{ height: 1, width: 44, background: GOLD, opacity: 0.6 }} />}
    </div>
  );
  const Kicker = ({ children, light, center }: { children: React.ReactNode; light?: boolean; center?: boolean }) => (
    <div style={{ fontFamily: label, fontSize: D ? 11 : 10, fontWeight: 500, letterSpacing: rtl ? 0 : "3px", textTransform: uc, color: light ? "rgba(255,255,255,0.82)" : brand, marginBottom: 14, textAlign: center ? "center" : "start" }}>{children}</div>
  );
  const Primary = ({ children, full, big, ghost, onClick }: { children: React.ReactNode; full?: boolean; big?: boolean; ghost?: boolean; onClick?: () => void }) => (
    <button data-testid="wa-cta" onClick={onClick} style={{ fontFamily: label, background: ghost ? "transparent" : brand, color: ghost ? brand : onBrand, border: ghost ? `1px solid ${brand}` : "none", borderRadius: 999, padding: big ? "15px 30px" : "12px 24px", fontSize: D ? 12.5 : 12, fontWeight: 500, letterSpacing: rtl ? 0 : "1.2px", textTransform: uc, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, width: full ? "100%" : "auto" }}>
      {!ghost && <WAIcon s={14} fill={onBrand} />} {children}
    </button>
  );
  const H2 = ({ children, size, center }: { children: React.ReactNode; size?: number; center?: boolean }) => (
    <h2 style={{ fontFamily: serif, fontSize: size || (D ? 46 : 30), fontWeight: 500, lineHeight: 1.08, letterSpacing: rtl ? 0 : "0.2px", color: INK, margin: 0, textAlign: center ? "center" : "start" }}>{children}</h2>
  );
  const Wrap = ({ children, pt, pb, style, id, section }: { children: React.ReactNode; pt?: number; pb?: number; style?: React.CSSProperties; id?: string; section?: string }) => (
    <section id={id} data-pmx-section={section} style={{ scrollMarginTop: D ? 60 : 52, padding: `${pt != null ? pt : (D ? 84 : 48)}px ${px}px ${pb != null ? pb : (D ? 84 : 48)}px`, ...style }}>{children}</section>
  );
  const SecHead = ({ kicker, title: t, sub, center }: { kicker: string; title: string; sub?: string; center?: boolean }) => (
    <div style={{ marginBottom: D ? 46 : 30, textAlign: center ? "center" : "start", display: center ? "flex" : "block", flexDirection: "column", alignItems: center ? "center" : "stretch" }}>
      {center && <div style={{ marginBottom: 16 }}><RuleM center /></div>}
      <Kicker center={center}>{kicker}</Kicker>
      <H2 center={center}>{t}</H2>
      {sub && <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: D ? 22 : 18, color: MUT, lineHeight: 1.5, margin: `${D ? 14 : 10}px 0 0`, maxWidth: 600 }}>{sub}</p>}
    </div>
  );

  // ════════ HERO ════════
  const Hero = () => (
    <div data-pmx-section="hero">
      <div style={{ position: "relative", height: D ? 600 : 470, overflow: "hidden", background: INK, borderRadius: `0 0 ${D ? 50 : 28}px ${D ? 50 : 28}px` }}>
        {cover && <img src={cover} alt="" onClick={() => zoom(cover)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }} />}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(to bottom, rgba(15,22,17,0.5) 0%, rgba(15,22,17,0.15) 40%, rgba(15,22,17,0.82) 100%)" }} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", textAlign: "center", padding: `0 ${px}px ${D ? 56 : 34}px`, color: "#fff", pointerEvents: "none" }}>
          <div style={{ marginBottom: 18 }}><RuleM center /></div>
          <Kicker light center><span data-pmx-field="destination">{pkg.destination}</span></Kicker>
          <h1 style={{ fontFamily: serif, fontSize: D ? 76 : 44, fontWeight: 500, lineHeight: 1.02, letterSpacing: rtl ? 0 : "0.3px", margin: 0, maxWidth: 900 }} data-pmx-field="title">{title}</h1>
        </div>
      </div>
      <Wrap pt={D ? 52 : 32} pb={0}>
        <div style={{ display: "grid", gridTemplateColumns: D ? "1.4fr 1fr" : "1fr", gap: D ? 56 : 26, alignItems: "center" }}>
          {pkg.description && <p style={{ fontFamily: serif, fontSize: D ? 27 : 20, fontStyle: "italic", lineHeight: 1.5, color: INK, margin: 0 }}>{pkg.description}</p>}
          <div style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 20, padding: D ? 26 : 20, gridColumn: pkg.description ? "auto" : (D ? "1 / -1" : "auto") }}>
            {meta.map((m, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "11px 0", borderBottom: `1px solid ${RULE}` }}>
                <span style={{ fontFamily: label, fontSize: 10.5, fontWeight: 500, letterSpacing: rtl ? 0 : "1.4px", textTransform: uc, color: FAINT }}>{m.k}</span>
                <span style={{ fontFamily: serif, fontSize: D ? 20 : 17, color: INK }}>{m.v}</span>
              </div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "14px 0 16px" }}>
              <span style={{ fontFamily: label, fontSize: 10.5, fontWeight: 500, letterSpacing: rtl ? 0 : "1.4px", textTransform: uc, color: FAINT }}>{L.ui.from}</span>
              <span style={{ fontFamily: serif, fontSize: D ? 32 : 26, color: brand }} data-pmx-field="price">{dig(pkg.price || "")}</span>
            </div>
            {pkg.whatsapp && <Primary full big onClick={onWhatsApp}>{L.ui.reserve}</Primary>}
          </div>
        </div>
      </Wrap>
    </div>
  );

  // ════════ HIGHLIGHTS ════════
  const Highlights = () => {
    const items = secMixed(findSec(pkg, "highlights"), "items");
    if (!items.length) return null;
    return (
      <Wrap section="highlights">
        <SecHead center kicker={L.nav.highlights} title={ar("Why travellers choose this journey", "لماذا يختار المسافرون هذه الرحلة")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(2,1fr)" : "1fr", gap: D ? 28 : 18 }}>
          {items.map((h, i) => {
            const t = secItemStr(h, "title", "text", "label");
            const d = typeof h === "object" ? secItemStr(h, "desc", "description") : "";
            return (
              <div key={i} style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 20, padding: D ? 30 : 22, display: "flex", gap: 18, alignItems: "flex-start" }}>
                <div style={{ minWidth: D ? 46 : 40, width: D ? 46 : 40, height: D ? 56 : 50, borderRadius: "999px 999px 6px 6px", border: `1.5px solid ${brand}`, display: "flex", alignItems: "center", justifyContent: "center", color: brand, fontFamily: serif, fontSize: D ? 22 : 19 }}>{dig(i + 1)}</div>
                <div>
                  <div style={{ fontFamily: serif, fontSize: D ? 24 : 20, color: INK, marginBottom: d ? 6 : 0, lineHeight: 1.15 }}>{t}</div>
                  {d && <div style={{ fontFamily: body, fontSize: 14, color: MUT, lineHeight: 1.7 }}>{d}</div>}
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
    const stops = mapImage ? [] : itinDays.slice(0, 5).map((d) => ({ label: secItemStr(d, "title") })).filter((s) => s.label);
    return (
      <Wrap style={{ background: CARD }} section="media">
        <SecHead center kicker={L.sections.media} title={ar("See for yourself", "شاهد بنفسك")} />
        {video && (
          <div style={{ borderRadius: ARCH, overflow: "hidden", border: `1px solid ${RULE}`, boxShadow: "0 18px 50px -28px rgba(31,42,34,0.5)" }}>
            <SkVideo src={video} poster={cover || imgs[0]} accent={brand} rtl={rtl} sans={body} height={D ? 440 : 250} ui={L.ui} />
          </div>
        )}
        {tiles.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr 1fr", gap: D ? 16 : 10, marginTop: video ? (D ? 22 : 14) : 0 }}>
            {tiles.map((u, k) => (
              <div key={k} style={{ borderRadius: D ? "120px 120px 12px 12px" : "70px 70px 8px 8px", overflow: "hidden", border: `1px solid ${RULE}` }}>
                <img src={u} onClick={() => zoom(u)} style={{ width: "100%", height: D ? 230 : 150, objectFit: "cover", display: "block", cursor: "zoom-in" }} />
              </div>
            ))}
          </div>
        )}
        {(mapImage || stops.length > 0) && (
          <div style={{ marginTop: D ? 34 : 24, background: PAPER, border: `1px solid ${RULE}`, borderRadius: 20, padding: D ? 26 : 18 }}>
            <Kicker>{L.ui.route}</Kicker>
            {mapImage
              ? <img src={mapImage} alt={mapCaption} style={{ width: "100%", height: D ? 220 : 160, objectFit: "cover", borderRadius: 14, display: "block" }} />
              : <SkRouteMap stops={stops} line={brand} land={soft} ink={INK} height={D ? 220 : 160} rounded={14} rtl={rtl} />}
            {mapCaption && <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 15, color: FAINT, marginTop: 14, textAlign: "center" }}>{mapCaption}</div>}
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
        <SecHead center kicker={L.sections.itinerary} title={ar(`${itinDays.length} nights, day by day`, `${dig(itinDays.length)} ليالٍ، يومًا بيوم`)} />
        <div style={{ maxWidth: 760, margin: "0 auto", position: "relative" }}>
          <div style={{ position: "absolute", insetInlineStart: D ? 23 : 19, top: 8, bottom: 8, width: 1.5, background: `linear-gradient(${tint(0.45)}, ${RULE})` }} />
          {itinDays.map((it, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: D ? "48px 1fr" : "40px 1fr", gap: D ? 26 : 18, padding: "12px 0", position: "relative" }}>
              <div style={{ width: D ? 48 : 40, height: D ? 48 : 40, borderRadius: "50%", background: CARD, border: `1.5px solid ${brand}`, color: brand, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: D ? 21 : 18, zIndex: 1 }}>{dig((it.day as number) ?? i + 1)}</div>
              <div style={{ paddingTop: D ? 6 : 4, paddingBottom: 14, borderBottom: i < itinDays.length - 1 ? `1px solid ${RULE}` : "none" }}>
                <div style={{ fontFamily: serif, fontSize: D ? 23 : 19, color: INK, lineHeight: 1.2 }}>{secItemStr(it, "title")}</div>
                {secItemStr(it, "desc", "description") && <div style={{ fontFamily: body, fontSize: 13.5, color: MUT, lineHeight: 1.65, marginTop: 4 }}>{secItemStr(it, "desc", "description")}</div>}
              </div>
            </div>
          ))}
        </div>
      </Wrap>
    );
  };

  // ════════ HOTEL ════════
  const Hotel = () => {
    if (!hotels.length) return null;
    const img = (k: number) => mediaImgs[k % Math.max(mediaImgs.length, 1)] || mediaImgs[0] || cover;
    return (
      <Wrap style={{ background: CARD }} section="hotel">
        <SecHead center kicker={L.sections.hotel} title={ar("Where you'll stay", "مكان إقامتك")} />
        <div style={{ display: "grid", gridTemplateColumns: D && hotels.length > 1 ? "1fr 1fr" : "1fr", gap: D ? 28 : 20, maxWidth: hotels.length === 1 ? 760 : "none", margin: hotels.length === 1 ? "0 auto" : 0 }}>
          {hotels.map((h, k) => (
            <div key={k} style={{ background: PAPER, border: `1px solid ${RULE}`, borderRadius: 22, overflow: "hidden" }}>
              {img(k) && <img src={img(k)} alt="" onClick={() => zoom(img(k))} style={{ width: "100%", height: D ? 220 : 170, objectFit: "cover", display: "block", cursor: "zoom-in" }} />}
              <div style={{ padding: D ? 26 : 20 }}>
                {h.stars > 0 && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                    <SkStars n={h.stars} size={D ? 15 : 13} color={GOLD} />
                    <span style={{ fontFamily: label, fontSize: 10.5, color: FAINT, letterSpacing: rtl ? 0 : "1px", textTransform: uc }}>{dig(h.stars)} {L.ui.stars}</span>
                  </div>
                )}
                {h.name && <div style={{ fontFamily: serif, fontSize: D ? 27 : 22, color: INK }}>{h.name}</div>}
                {h.blurb && <p style={{ fontFamily: body, fontSize: 13.5, color: MUT, lineHeight: 1.7, margin: h.name ? "14px 0 0" : 0, whiteSpace: "pre-line" }}>{h.blurb}</p>}
                {h.features.length > 0 && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px 14px", marginTop: 16 }}>
                    {h.features.map((f, i) => <div key={i} style={{ display: "flex", gap: 8, alignItems: "baseline", fontFamily: body, fontSize: 12.5, color: INK }}><Diamond color={GOLD} s={5} /> {f}</div>)}
                  </div>
                )}
              </div>
            </div>
          ))}
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
        <SecHead center kicker={L.sections.inclusions} title={ar("What's included", "ما يشمله البرنامج")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 28 : 20, maxWidth: 980, margin: "0 auto" }}>
          {includes.length > 0 && (
            <div style={{ background: softer, border: `1px solid ${tint(0.25)}`, borderRadius: 20, padding: D ? 28 : 22 }}>
              <div style={{ fontFamily: label, fontSize: 11, fontWeight: 500, color: brand, letterSpacing: rtl ? 0 : "1.6px", textTransform: uc, marginBottom: 14 }}>{L.ui.included}</div>
              {includes.map((it, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: i ? `1px solid ${RULE}` : "none", alignItems: "flex-start" }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={brand} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}><path d="M20 6L9 17l-5-5" /></svg>
                  <span style={{ fontFamily: body, fontSize: 14, color: INK, lineHeight: 1.55 }}>{it}</span>
                </div>
              ))}
            </div>
          )}
          {excludes.length > 0 && (
            <div style={{ borderRadius: 20, padding: D ? 28 : 22, border: `1px solid ${RULE}` }}>
              <div style={{ fontFamily: label, fontSize: 11, fontWeight: 500, color: FAINT, letterSpacing: rtl ? 0 : "1.6px", textTransform: uc, marginBottom: 14 }}>{L.ui.notIncluded}</div>
              {excludes.map((it, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "10px 0", borderTop: i ? `1px solid ${RULE}` : "none", alignItems: "flex-start" }}>
                  <span style={{ color: FAINT, fontSize: 16, lineHeight: 1.2, flexShrink: 0 }}>×</span>
                  <span style={{ fontFamily: body, fontSize: 14, color: MUT, lineHeight: 1.55 }}>{it}</span>
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
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1.1fr" : "1fr", gap: D ? 56 : 26, alignItems: "center" }}>
          <SecHead kicker={L.sections.meals} title={planLabel} />
          {notes && <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: D ? 21 : 18, color: MUT, lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>{notes}</p>}
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
        <div style={{ background: brand, color: onBrand, borderRadius: 26, padding: D ? 48 : 28 }}>
          <div style={{ display: "grid", gridTemplateColumns: D && content ? "1fr 1fr" : "1fr", gap: D ? 48 : 24 }}>
            <div>
              <div style={{ fontFamily: label, fontSize: 11, fontWeight: 500, letterSpacing: rtl ? 0 : "3px", textTransform: uc, opacity: 0.82, marginBottom: 14 }}>{L.sections.visa}</div>
              <h2 style={{ fontFamily: serif, fontSize: D ? 40 : 28, fontWeight: 500, lineHeight: 1.1, margin: 0 }}>{VISA_HEAD[included]?.[lang] || ar("Visa & entry", "التأشيرة والدخول")}</h2>
            </div>
            {content && <p style={{ fontFamily: body, fontSize: 14.5, lineHeight: 1.8, margin: 0, opacity: 0.9, alignSelf: "center", whiteSpace: "pre-line" }}>{content}</p>}
          </div>
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
        <SecHead center kicker={L.sections.transfers} title={ar("Getting around", "التنقّلات")} sub={items.length ? undefined : desc} />
        {items.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 24 : 16 }}>
            {items.map((t, i) => (
              <div key={i} style={{ background: PAPER, border: `1px solid ${RULE}`, borderRadius: 18, padding: D ? 26 : 20, textAlign: "center" }}>
                <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}><Diamond color={brand} s={9} /></div>
                <div style={{ fontFamily: serif, fontSize: D ? 22 : 19, color: INK }}>{secItemStr(t, "leg", "title", "name", "text")}</div>
                {typeof t === "object" && secItemStr(t, "desc", "description") && <div style={{ fontFamily: body, fontSize: 13.5, color: MUT, lineHeight: 1.65, marginTop: 6 }}>{secItemStr(t, "desc", "description")}</div>}
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
    return (
      <Wrap id="sk-departures" section="departures">
        <SecHead center kicker={L.sections.departures} title={ar("Departures & airports", "المغادرة والمطارات")} />
        {D ? (
          <div style={{ border: `1px solid ${RULE}`, borderRadius: 20, overflow: "hidden", maxWidth: 1000, margin: "0 auto" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.2fr 1fr 0.9fr auto", padding: "16px 24px", fontFamily: label, fontSize: 10.5, fontWeight: 500, letterSpacing: rtl ? 0 : "1.2px", textTransform: uc, color: FAINT, background: CARD, borderBottom: `1px solid ${RULE}` }}>
              <div>{L.ui.from}</div><div>{L.ui.date}</div><div>{L.ui.depart}</div><div>{L.ui.availability}</div><div style={{ textAlign: "end" }}>{L.ui.price}</div><div />
            </div>
            {rows.map((r, i) => {
              const spots = typeof r.spots === "number" ? r.spots : Number(r.spots) || 0; const sold = spots <= 0;
              const from = secItemStr(r, "origin", "from"); const date = secItemStr(r, "date");
              const dep = secItemStr(r, "flyingTime"); const arrt = secItemStr(r, "arrivingTime"); const price = secItemStr(r, "price");
              return (
                <div key={i} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1.2fr 1fr 0.9fr auto", padding: "18px 24px", alignItems: "center", borderBottom: i < rows.length - 1 ? `1px solid ${RULE}` : "none", opacity: sold ? 0.5 : 1 }}>
                  <div style={{ fontFamily: serif, fontSize: 20, color: INK }}>{from || dig(date)}</div>
                  <div style={{ fontFamily: body, fontSize: 13.5, color: MUT }}>{dig(date)}</div>
                  <div style={{ fontFamily: body, fontSize: 12.5, color: MUT }}>{dep ? `${dig(dep)}${arrt ? ` → ${dig(arrt)}` : ""}` : "—"}</div>
                  <div style={{ fontFamily: body, fontSize: 12.5, color: sold ? FAINT : (spots <= 3 ? GOLD : brand), fontWeight: 600 }}>{sold ? L.ui.soldOut : `${dig(spots)} ${L.ui.seatsLeft}`}</div>
                  <div style={{ fontFamily: serif, fontSize: 21, color: brand, textAlign: "end" }}>{dig(price)}</div>
                  <div style={{ textAlign: "end", paddingInlineStart: 18 }}>{sold ? <span style={{ fontFamily: body, fontSize: 12, color: FAINT }}>—</span> : (pkg.whatsapp ? <Primary onClick={onWhatsApp}>{L.ui.book}</Primary> : null)}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {rows.map((r, i) => {
              const spots = typeof r.spots === "number" ? r.spots : Number(r.spots) || 0; const sold = spots <= 0;
              const from = secItemStr(r, "origin", "from"); const date = secItemStr(r, "date"); const price = secItemStr(r, "price");
              return (
                <div key={i} style={{ border: `1px solid ${RULE}`, borderRadius: 16, padding: 18, background: CARD, opacity: sold ? 0.55 : 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <div style={{ fontFamily: serif, fontSize: 21, color: INK }}>{from || dig(date)}</div>
                    {price && <div style={{ fontFamily: serif, fontSize: 21, color: brand }}>{dig(price)}</div>}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: body, fontSize: 12.5, color: MUT }}>
                    <span>{dig(date)}</span><span style={{ color: sold ? FAINT : (spots <= 3 ? GOLD : brand), fontWeight: 600 }}>{sold ? L.ui.soldOut : `${dig(spots)} ${L.ui.seatsLeft}`}</span>
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
      <Wrap style={{ background: CARD }} id="sk-pricing" section="pricing">
        <SecHead center kicker={L.sections.pricing} title={ar("Choose your room", "اختر غرفتك")} />
        {tiers.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? `repeat(${Math.min(tiers.length, 3)},1fr)` : "1fr", gap: D ? 22 : 16, maxWidth: 980, margin: "0 auto" }}>
            {tiers.map((t, i) => {
              const featured = tiers.length === 3 && i === 1;
              return (
                <div key={i} style={{ background: featured ? brand : PAPER, color: featured ? onBrand : INK, border: featured ? "none" : `1px solid ${RULE}`, borderRadius: 22, padding: D ? 30 : 24, textAlign: "center", position: "relative" }}>
                  {featured && <div style={{ fontFamily: label, fontSize: 9.5, fontWeight: 500, letterSpacing: rtl ? 0 : "1.6px", textTransform: uc, opacity: 0.9, marginBottom: 10 }}>★ {L.ui.mostPopular}</div>}
                  <div style={{ fontFamily: serif, fontSize: D ? 26 : 22 }}>{localizeTierLabel(t.label, lang)}</div>
                  <div style={{ fontFamily: serif, fontSize: D ? 42 : 34, marginTop: 14, color: featured ? onBrand : brand }}>{dig(t.price)}</div>
                  <div style={{ fontFamily: body, fontSize: 11.5, opacity: 0.65, marginTop: 2 }}>{L.ui.perPerson}</div>
                  {pkg.whatsapp && <div style={{ marginTop: 20 }}><Primary full ghost={!featured} onClick={onWhatsApp}>{L.ui.book}</Primary></div>}
                </div>
              );
            })}
          </div>
        )}
        {(cancellation.length > 0 || schedule.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 40 : 22, marginTop: tiers.length ? 36 : 0, maxWidth: 980, marginInline: "auto" }}>
            {cancellation.length > 0 && (
              <div>
                <div style={{ fontFamily: label, fontSize: 11, fontWeight: 500, color: brand, letterSpacing: rtl ? 0 : "1.4px", textTransform: uc, marginBottom: 10 }}>{L.ui.cancellation}</div>
                {cancellation.map((s, i) => <div key={i} style={{ fontFamily: body, fontSize: 13.5, color: MUT, padding: "8px 0", lineHeight: 1.5, borderTop: `1px solid ${RULE}`, display: "flex", gap: 10 }}><Diamond color={GOLD} s={5} /> {s}</div>)}
              </div>
            )}
            {schedule.length > 0 && (
              <div>
                <div style={{ fontFamily: label, fontSize: 11, fontWeight: 500, color: brand, letterSpacing: rtl ? 0 : "1.4px", textTransform: uc, marginBottom: 10 }}>{L.ui.paymentSchedule}</div>
                {schedule.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderTop: `1px solid ${RULE}` }}>
                    <span style={{ fontFamily: body, fontSize: 13.5, color: INK }}>{secItemStr(s, "dueDate", "label")}</span><span style={{ fontFamily: serif, fontSize: 18, color: brand }}>{dig(secItemStr(s, "amount"))}</span>
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
        <SecHead center kicker={L.sections.extras} title={ar("Make it yours", "أضِف لمستك")} />
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          {items.map((e, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: D ? "20px 0" : "16px 0", borderTop: `1px solid ${RULE}`, borderBottom: i === items.length - 1 ? `1px solid ${RULE}` : "none" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: serif, fontSize: D ? 23 : 19, color: INK }}>{secItemStr(e, "name", "title")}</div>
                {secItemStr(e, "description", "desc") && <div style={{ fontFamily: body, fontSize: 13, color: MUT, marginTop: 3, lineHeight: 1.5 }}>{secItemStr(e, "description", "desc")}</div>}
              </div>
              {secItemStr(e, "price") && <div style={{ fontFamily: serif, fontSize: D ? 22 : 18, color: brand, whiteSpace: "nowrap" }}>{dig(secItemStr(e, "price"))}</div>}
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
      <Wrap style={{ background: CARD }} section="scarcity">
        <div style={{ background: softer, border: `1px solid ${tint(0.25)}`, borderRadius: 26, padding: D ? 44 : 26, textAlign: "center", maxWidth: 820, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}><Kicker center>{L.sections.scarcity}</Kicker></div>
          <h2 style={{ fontFamily: serif, fontSize: D ? 34 : 25, fontWeight: 500, color: INK, lineHeight: 1.3, margin: "0 auto", maxWidth: 620 }}>{L.ui.spotsLine(sc.spotsRemaining)}</h2>
          <div style={{ maxWidth: 420, margin: "26px auto 0" }}>
            <div style={{ height: 8, borderRadius: 999, background: tint(0.18), overflow: "hidden" }}><div style={{ width: `${pct}%`, height: "100%", background: brand, borderRadius: 999 }} /></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 10, fontFamily: label, fontSize: 11, color: MUT, letterSpacing: rtl ? 0 : "0.5px" }}>
              <span>{dig(sc.spotsRemaining)} {L.ui.seatsLeft}</span>
              {sc.firstDepartureDate && <span>{L.ui.nextDeparture}: {dig(sc.firstDepartureDate)}</span>}
            </div>
          </div>
          <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: D ? 18 : 15.5, color: MUT, lineHeight: 1.6, margin: "22px auto 0", maxWidth: 520 }}>{L.ui.reassure}</p>
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
        <div style={{ display: "grid", gridTemplateColumns: D ? "auto 1fr" : "1fr", gap: D ? 48 : 24, alignItems: "center", maxWidth: 960, margin: "0 auto" }}>
          <div style={{ justifySelf: "center", width: D ? 240 : 200, borderRadius: ARCH, overflow: "hidden", border: `1px solid ${RULE}` }}>
            {person.photo
              ? <img src={person.photo} alt="" style={{ width: "100%", height: D ? 300 : 240, objectFit: "cover", display: "block" }} />
              : <div style={{ width: "100%", height: D ? 300 : 240, background: softer, color: brand, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: D ? 90 : 64 }}>{person.name[0]}</div>}
          </div>
          <div>
            <Kicker>{L.sections.people}</Kicker>
            <div style={{ fontFamily: serif, fontSize: D ? 36 : 28, color: INK }}>{person.name}</div>
            {role && <div style={{ fontFamily: label, fontSize: 11, color: brand, fontWeight: 500, letterSpacing: rtl ? 0 : "1.6px", textTransform: uc, marginTop: 6 }}>{role}</div>}
            {bio && <p style={{ fontFamily: body, fontSize: 14.5, color: MUT, lineHeight: 1.75, marginTop: 16 }}>{bio}</p>}
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
      <Wrap style={{ background: CARD }} id="sk-reviews" section="reviews">
        <div style={{ textAlign: "center", marginBottom: D ? 40 : 28, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <RuleM center />
          <div style={{ fontFamily: serif, fontSize: D ? 58 : 44, color: brand, lineHeight: 1, marginTop: 16 }}>{dig(rating)}</div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 8 }}><SkStars n={Math.round(rating)} size={16} color={GOLD} /></div>
          <div style={{ fontFamily: body, fontSize: 12.5, color: FAINT, marginTop: 8 }}>{L.ui.basedOn} {dig(count)} {L.ui.review}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 24 : 18 }}>
          {items.slice(0, 6).map((r, i) => (
            <div key={i} style={{ background: PAPER, border: `1px solid ${RULE}`, borderRadius: 20, padding: D ? 28 : 22 }}>
              <SkStars n={Math.round(r.rating || 5)} size={13} color={GOLD} />
              <p style={{ fontFamily: serif, fontSize: D ? 20 : 17.5, fontStyle: "italic", color: INK, lineHeight: 1.55, margin: "12px 0 16px" }}>&ldquo;{r.text}&rdquo;</p>
              <div style={{ fontFamily: label, fontSize: 12, fontWeight: 500, color: INK }}>{r.name}</div>
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
        <SecHead center kicker={L.sections.agency} title={agency.name} sub={agency.tagline} />
        {story && <div style={{ maxWidth: 760, margin: "0 auto", textAlign: "center" }}><p style={{ fontFamily: serif, fontSize: D ? 22 : 18, fontStyle: "italic", color: MUT, lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>{story}</p></div>}
        {image && <div style={{ maxWidth: 760, margin: "28px auto 0", borderRadius: 20, overflow: "hidden", border: `1px solid ${RULE}` }}><img src={image} alt="" style={{ width: "100%", height: D ? 320 : 220, objectFit: "cover", display: "block" }} /></div>}
      </Wrap>
    );
  };

  // ════════ NOTES ════════
  const Notes = () => {
    const items = secMixed(findSec(pkg, "important_notes"), "items");
    if (!items.length) return null;
    return (
      <Wrap style={{ background: CARD }} section="important_notes">
        <SecHead center kicker={L.sections.notes} title={ar("Good to know", "معلومات تهمّك")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 24 : 16 }}>
          {items.map((n, i) => {
            const t = secItemStr(n, "title");
            const body2 = secItemStr(n, "text", "desc", "description") || (typeof n === "string" ? n : "");
            return (
              <div key={i} style={{ background: PAPER, border: `1px solid ${RULE}`, borderRadius: 18, padding: D ? 26 : 20 }}>
                {t && <div style={{ fontFamily: serif, fontSize: D ? 21 : 18, color: INK, marginBottom: 6 }}>{t}</div>}
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
        <SecHead center kicker={L.sections.faq} title={ar("Questions, answered", "إجابات على أسئلتك")} />
        <div style={{ maxWidth: 820, margin: "0 auto" }}>
          {items.map((f, i) => (
            <div key={i} style={{ padding: D ? "24px 0" : "18px 0", borderTop: `1px solid ${RULE}`, borderBottom: i === items.length - 1 ? `1px solid ${RULE}` : "none" }}>
              <div style={{ fontFamily: serif, fontSize: D ? 24 : 20, color: INK, lineHeight: 1.25, marginBottom: secItemStr(f, "answer", "a") ? 8 : 0 }}>{secItemStr(f, "question", "q")}</div>
              {secItemStr(f, "answer", "a") && <p style={{ fontFamily: body, fontSize: 14, color: MUT, lineHeight: 1.75, margin: 0 }}>{secItemStr(f, "answer", "a")}</p>}
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
      <div data-pmx-section="custom" style={{ position: "relative", overflow: "hidden", background: INK }}>
        {image && <img src={image} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.22 }} />}
        <section style={{ position: "relative", textAlign: "center", padding: `${D ? 84 : 48}px ${px}px` }}>
          <div style={{ maxWidth: 720, margin: "0 auto", color: "#fff" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}><Diamond color={GOLD} s={10} /></div>
            <div style={{ fontFamily: label, fontSize: 11, fontWeight: 500, letterSpacing: rtl ? 0 : "3px", textTransform: uc, color: "rgba(255,255,255,0.7)", marginBottom: 16 }}>{L.sections.custom}</div>
            {heading && <div style={{ fontFamily: serif, fontSize: D ? 46 : 30, fontWeight: 500, lineHeight: 1.15, marginBottom: 18 }}>{heading}</div>}
            {text && <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: D ? 23 : 18, color: "rgba(255,255,255,0.86)", lineHeight: 1.65, margin: 0, whiteSpace: "pre-line" }}>{text}</p>}
          </div>
        </section>
      </div>
    );
  };

  // ════════ OTHERS ════════
  const Others = () => {
    const list = secArr(findSec(pkg, "other_packages"), "packages");
    if (!list.length) return null;
    return (
      <Wrap section="other_packages">
        <SecHead center kicker={L.sections.others} title={ar("More journeys", "رحلات أخرى")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 24 : 18 }}>
          {list.map((o, i) => {
            const oTitle = secItemStr(o, "title"); const place = secItemStr(o, "destination", "place");
            const price = secItemStr(o, "price"); const oNights = secItemStr(o, "nights");
            const img = secItemStr(o, "image"); const link = secItemStr(o, "link");
            const Inner = (
              <div style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 20, overflow: "hidden", height: "100%" }}>
                <div style={{ height: D ? 180 : 160, background: PAPER }}>{img && <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}</div>
                <div style={{ padding: D ? 22 : 18 }}>
                  {place && <div style={{ fontFamily: label, fontSize: 10.5, color: brand, fontWeight: 500, letterSpacing: rtl ? 0 : "1.4px", textTransform: uc }}>{place}</div>}
                  <div style={{ fontFamily: serif, fontSize: D ? 23 : 20, color: INK, margin: "8px 0 12px", lineHeight: 1.15 }}>{oTitle}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: `1px solid ${RULE}`, paddingTop: 12 }}>
                    {price && <span style={{ fontFamily: serif, fontSize: 20, color: brand }}>{dig(price)}</span>}
                    {oNights && <span style={{ fontFamily: body, fontSize: 12, color: FAINT }}>{dig(oNights)} {L.ui.nights}</span>}
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
      <div style={{ background: brand, color: onBrand }}>
        <section style={{ padding: `${D ? 76 : 46}px ${px}px`, textAlign: "center" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 18 }}><Diamond color={onBrand} s={9} /></div>
          <div style={{ fontFamily: serif, fontSize: D ? 50 : 32, fontWeight: 500, lineHeight: 1.1, maxWidth: 700, margin: "0 auto" }}>{L.ui.begin}</div>
          <div style={{ fontFamily: body, fontSize: 14, opacity: 0.85, margin: "14px 0 26px" }}>{L.ui.replyTime}{pkg.whatsapp ? ` · ${dig(pkg.whatsapp)}` : ""}</div>
          <div style={{ display: "inline-flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            {pkg.whatsapp && <button onClick={onWhatsApp} data-testid="wa-cta" style={{ fontFamily: label, background: "#fff", color: brand, border: "none", borderRadius: 999, padding: "15px 30px", fontSize: D ? 12.5 : 12, fontWeight: 600, letterSpacing: rtl ? 0 : "1.2px", textTransform: uc, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 9 }}><WAIcon s={14} fill={brand} /> {L.ui.bookWhatsapp}</button>}
            {pkg.messenger && onMessenger && <Primary big ghost onClick={onMessenger}>{L.ui.messenger}</Primary>}
          </div>
        </section>
      </div>
      <div style={{ padding: `22px ${px}px`, display: "flex", justifyContent: "space-between", alignItems: "center", background: PAPER }}>
        <div style={{ fontFamily: serif, fontSize: 19, color: INK }}>{agency.name}</div>
        <div style={{ fontFamily: label, fontSize: 9.5, color: FAINT, letterSpacing: rtl ? 0 : "1px", textTransform: uc }}>{L.ui.poweredBy}</div>
      </div>
    </div>
  );

  // ════════ BAR ════════
  const Bar = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${px}px`, height: D ? 60 : 52, borderBottom: `1px solid ${RULE}`, background: skRgba(PAPER, 0.9), backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 30 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Diamond color={brand} s={9} />
        <span style={{ fontFamily: serif, fontSize: D ? 22 : 19, fontWeight: 500, color: INK, letterSpacing: rtl ? 0 : "0.3px" }}>{agency.name}</span>
      </div>
      {D ? (
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          {navItems.map(([key, lbl]) => <button key={key} onClick={() => goTo(key)} style={{ fontFamily: label, fontSize: 11, fontWeight: 500, letterSpacing: rtl ? 0 : "1px", textTransform: uc, color: MUT, background: "none", border: "none", cursor: "pointer", padding: 0 }}>{lbl}</button>)}
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
export function TemplateSakinaCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
