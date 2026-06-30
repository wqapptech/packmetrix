"use client";

// ═══════════════════════════════════════════════════════════════════════════
// VOYAGE V2 — Youth 18–35 · loud, social, kinetic.
// Near-black canvas, electric dynamic brand accent + story-pop colours,
// oversized Space Grotesk / Cairo display, rotated sticker pills, rounded
// cards, chat-bubble reviews. One component renders all 4 surfaces.
// Faithful port of the V2 design, wired to real pkg.sections data with
// graceful empty states. Brand colour themes the whole template.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useState } from "react";
import { useIsDesktop, BaseCard, LightboxCarousel } from "./shared";
import { localizeTierLabel } from "@/lib/translations";
import type { TPageProps, TCardProps, TPackage } from "./types";

type SecData = Record<string, unknown>;

// ─── Brand colour math ────────────────────────────────────────────────────────
function voHex(h: string): [number, number, number] {
  h = h.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function voRgba(hex: string, a: number): string { const [r, g, b] = voHex(hex); return `rgba(${r},${g},${b},${a})`; }
function voMix(hex: string, target: string, t: number): string {
  const a = voHex(hex), b = voHex(target);
  const m = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}
function voDarken(hex: string, t: number) { return voMix(hex, "#000000", t); }
function voLum(hex: string) { const [r, g, b] = voHex(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
function voOn(hex: string) { return voLum(hex) > 0.62 ? "#0d1424" : "#ffffff"; }

const POP = ["#f5a623", "#2dd4a0", "#7c3aed", "#25d366", "#3aa0ff"];

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
    seatsLeft: "spots left", book: "Book", enquire: "Enquire on WhatsApp", bookWhatsapp: "Book on WhatsApp",
    messenger: "Messenger", lockItIn: "Lock it in", nextDeparture: "Next", date: "Date", price: "Price",
    to: "To", cancellation: "Cancellation policy", paymentSchedule: "Payment schedule", basedOn: "based on",
    review: "reviews", route: "Your route", replyTime: "Usually replies within an hour",
    watch: "Watch the film", noVideo: "Video coming soon", play: "Play", pause: "Pause", mute: "Mute",
    unmute: "Unmute", years: "years", rating: "rating", departures: "departures", poweredBy: "Powered by PackMetrix",
    dontOverthink: "Don't overthink it.", spotsLeftLine: (n: number) => `Only ${n} ${n === 1 ? "spot" : "spots"} left — grab it.`,
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
    seatsLeft: "مقاعد متبقّية", book: "احجز", enquire: "استفسر عبر واتساب", bookWhatsapp: "احجز عبر واتساب",
    messenger: "ماسنجر", lockItIn: "احجز الآن", nextDeparture: "أقرب", date: "التاريخ", price: "السعر",
    to: "إلى", cancellation: "سياسة الإلغاء", paymentSchedule: "جدول الدفع", basedOn: "من",
    review: "تقييم", route: "مسار رحلتك", replyTime: "نردّ عادةً خلال ساعة",
    watch: "شاهد الفيديو", noVideo: "الفيديو قريبًا", play: "تشغيل", pause: "إيقاف", mute: "كتم",
    unmute: "تشغيل الصوت", years: "سنة", rating: "تقييم", departures: "رحلات", poweredBy: "مُشغّل بواسطة باكمتريكس",
    dontOverthink: "لا تُفكّر كثيرًا.", spotsLeftLine: (n: number) => `بقي ${n} ${n === 1 ? "مكان" : "أماكن"} فقط — احجزه.`,
  },
};

const MEAL_LABELS: Record<string, { en: string; ar: string }> = {
  none: { en: "No meals", ar: "بدون وجبات" }, breakfast: { en: "Breakfast included", ar: "إفطار مشمول" },
  half_board: { en: "Half board", ar: "نصف إقامة" }, full_board: { en: "Full board", ar: "إقامة كاملة" },
  all_inclusive: { en: "All inclusive", ar: "شامل بالكامل" },
};
const VISA_LABELS: Record<string, { en: string; ar: string }> = {
  included: { en: "Visa sorted ✓", ar: "التأشيرة جاهزة ✓" }, assistance: { en: "We help with the visa", ar: "نساعدك في التأشيرة" },
  not_included: { en: "Visa not included", ar: "التأشيرة غير مشمولة" }, not_required: { en: "No visa needed", ar: "لا تحتاج تأشيرة" },
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
function WAIcon({ s = 16, fill = "#fff" }: { s?: number; fill?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill={fill}><path d="M20.5 3.5C18.2 1.2 15.2 0 12 0 5.4 0 .1 5.3.1 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.4-1.7c1.7.9 3.7 1.4 5.6 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.3zM12 21.8c-1.7 0-3.4-.5-4.9-1.3l-.4-.2-3.7 1 1-3.6-.2-.4c-.9-1.5-1.4-3.3-1.4-5 0-5.5 4.5-9.9 9.9-9.9 2.6 0 5.1 1 7 2.9 1.9 1.9 2.9 4.4 2.9 7-.1 5.4-4.5 9.5-10.2 9.5z" /></svg>;
}

// ─── Star rating ──────────────────────────────────────────────────────────────
function VoStars({ n = 5, of = 5, size = 14, color = "#f5a623" }: { n?: number; of?: number; size?: number; color?: string }) {
  const star = (fill: string) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} style={{ display: "block" }}><path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 18.6 5.9 20.8l1.2-6.6L2.3 9.6l6.6-.9z" /></svg>
  );
  return <span style={{ display: "inline-flex", gap: 2 }}>{Array.from({ length: of }).map((_, i) => <span key={i}>{star(i < n ? color : voRgba(color, 0.25))}</span>)}</span>;
}

// ─── Abstract route map ───────────────────────────────────────────────────────
function VoRouteMap({ stops, line, land = "#1b2740", ink = "#cdd6e6", height = 220, rounded = 18, rtl = false }: { stops: { label: string }[]; line: string; land?: string; ink?: string; height?: number; rounded?: number; rtl?: boolean }) {
  const W = 1000, H = 420;
  const pts = stops.map((s, i) => {
    const x = stops.length === 1 ? W / 2 : 120 + (i * (W - 240)) / (stops.length - 1);
    const y = 150 + Math.sin(i * 1.3 + 0.6) * 70 + (i % 2 ? 20 : -10);
    return { ...s, x: rtl ? W - x : x, y };
  });
  const path = pts.map((p, i) => { if (i === 0) return `M ${p.x} ${p.y}`; const prev = pts[i - 1]; const mx = (prev.x + p.x) / 2; return `Q ${mx} ${prev.y - 40} ${p.x} ${p.y}`; }).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height, display: "block", borderRadius: rounded, background: voMix(land, "#000000", 0.2) }} preserveAspectRatio="xMidYMid slice">
      <g fill={land} opacity="0.9"><path d="M-40 300 Q 180 250 360 300 T 760 290 Q 920 270 1060 320 L1060 460 L-40 460 Z" /><ellipse cx="220" cy="120" rx="190" ry="90" opacity="0.5" /><ellipse cx="780" cy="100" rx="160" ry="80" opacity="0.5" /></g>
      <g stroke={voRgba(ink, 0.07)} strokeWidth="1">{[80, 180, 280, 360].map((y) => <line key={y} x1="0" x2={W} y1={y} y2={y} />)}{[200, 400, 600, 800].map((x) => <line key={x} y1="0" y2={H} x1={x} x2={x} />)}</g>
      <path d={path} fill="none" stroke={line} strokeWidth="4" strokeDasharray="2 12" strokeLinecap="round" opacity="0.95" />
      {pts.map((p, i) => <g key={i}><circle cx={p.x} cy={p.y} r="11" fill={land} stroke={line} strokeWidth="3.5" /><circle cx={p.x} cy={p.y} r="4" fill={line} /><text x={p.x} y={p.y - 22} textAnchor="middle" fill={ink} fontSize="22" fontWeight="700" fontFamily="inherit">{p.label}</text></g>)}
    </svg>
  );
}

// ─── Video player ─────────────────────────────────────────────────────────────
function VoVideo({ src, poster, accent, radius = 16, rtl = false, sans, height = 320, ui }: { src?: string; poster?: string; accent: string; radius?: number; rtl?: boolean; sans: string; height?: number; ui: typeof L_EN["ui"] }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const ctrl: React.CSSProperties = { width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 };
  const onAccent = voOn(accent);
  if (!src) {
    return (
      <div style={{ position: "relative", borderRadius: radius, overflow: "hidden", height, background: "#111" }}>
        {poster && <img src={poster} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.3) brightness(0.55)" }} />}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#fff" }}>
          <div style={{ width: 56, height: 56, borderRadius: "50%", border: "1.5px solid rgba(255,255,255,0.55)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
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
          <div style={{ width: 70, height: 70, borderRadius: "50%", background: accent, color: onAccent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(0,0,0,0.4)" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style={{ marginInlineStart: 3 }}><path d="M8 5v14l11-7z" /></svg>
          </div>
          <div style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 700, color: "#fff", letterSpacing: "0.4px", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>{ui.watch}</div>
        </div>
      )}
      <div dir={rtl ? "rtl" : "ltr"} style={{ position: "absolute", insetInline: 0, bottom: 0, padding: 12, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, background: "linear-gradient(transparent, rgba(0,0,0,0.45))" }}>
        <button onClick={(e) => { e.stopPropagation(); toggle(); }} aria-label={playing ? ui.pause : ui.play} title={playing ? ui.pause : ui.play} style={ctrl}>{playing ? IconPause : IconPlay}</button>
        <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} aria-label={muted ? ui.unmute : ui.mute} title={muted ? ui.unmute : ui.mute} style={ctrl}>{muted ? IconMuted : IconSound}</button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export function TemplateVoyagePage({ pkg, agency, onWhatsApp, onMessenger, lang = "en" }: TPageProps) {
  const D = useIsDesktop();
  const rtl = lang === "ar";
  const L = rtl ? L_AR : L_EN;
  const brand = agency.brandColor || "#6d4aff";
  const onBrand = voOn(brand);

  const BG = "#0d1424", CARD = "rgba(255,255,255,0.055)", CARD2 = "rgba(255,255,255,0.09)", BD = "rgba(255,255,255,0.12)";
  const TXT = "#ffffff", MUT = "rgba(255,255,255,0.64)", FAINT = "rgba(255,255,255,0.42)";
  const disp = rtl ? "var(--font-cairo), 'Cairo', sans-serif" : "var(--font-space-grotesk), 'Space Grotesk', sans-serif";
  const sans = rtl ? "var(--font-cairo), 'Cairo', sans-serif" : "var(--font-manrope), 'Manrope', sans-serif";
  const px = D ? 56 : 18;
  const ar = (en: string, a: string) => (rtl ? a : en);
  const dig = (s: string | number) => (rtl ? String(s).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]) : String(s));
  const uc: React.CSSProperties["textTransform"] = rtl ? "none" : "uppercase";

  const title = pkg.title || pkg.destination || "";
  const nightsN = pkg.nights ? Number(pkg.nights) : null;
  const cover = pkg.coverImage || pkg.images?.[0] || secStrArr(findSec(pkg, "media"), "images")[0] || "";
  const itinDays = secArr(findSec(pkg, "itinerary"), "days").filter((d) => secItemStr(d, "title"));
  const mediaImgs = secStrArr(findSec(pkg, "media"), "images");
  // ---- clickable gallery (cover + media images) → lightbox carousel ----
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
  const Sticker = ({ children, rot = -3, bg = brand, col }: { children: React.ReactNode; rot?: number; bg?: string; col?: string }) => (
    <span style={{ display: "inline-block", transform: `rotate(${rtl ? -rot : rot}deg)`, background: bg, color: col || voOn(bg), fontFamily: disp, fontSize: D ? 13 : 11, fontWeight: 700, letterSpacing: "0.3px", padding: "6px 13px", borderRadius: 999, textTransform: uc, whiteSpace: "nowrap" }}>{children}</span>
  );
  const CTA = ({ children, full, big, bg = brand, col, onClick }: { children: React.ReactNode; full?: boolean; big?: boolean; bg?: string; col?: string; onClick?: () => void }) => (
    <button data-testid="wa-cta" onClick={onClick} style={{ fontFamily: disp, background: bg, color: col || voOn(bg), border: "none", borderRadius: 999, padding: big ? "16px 28px" : "12px 22px", fontSize: D ? 15 : 13.5, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, width: full ? "100%" : "auto", boxShadow: `0 10px 28px ${voRgba(bg, 0.35)}` }}>
      <WAIcon s={16} fill={col || voOn(bg)} /> {children}
    </button>
  );
  const Eyebrow = ({ children, color = brand }: { children: React.ReactNode; color?: string }) => (
    <div style={{ fontFamily: disp, fontSize: D ? 12.5 : 11, fontWeight: 700, letterSpacing: rtl ? "0" : "1.6px", textTransform: uc, color, marginBottom: 12 }}>{children}</div>
  );
  const H2 = ({ children, size }: { children: React.ReactNode; size?: number }) => (
    <h2 style={{ fontFamily: disp, fontSize: size || (D ? 48 : 30), fontWeight: 700, lineHeight: 1.0, letterSpacing: rtl ? "0" : "-1.4px", color: TXT, margin: 0 }}>{children}</h2>
  );
  const Wrap = ({ children, pt, pb, style, id, section }: { children: React.ReactNode; pt?: number; pb?: number; style?: React.CSSProperties; id?: string; section?: string }) => (
    <section id={id} data-pmx-section={section} style={{ scrollMarginTop: D ? 70 : 58, padding: `${pt != null ? pt : (D ? 64 : 36)}px ${px}px ${pb != null ? pb : (D ? 64 : 36)}px`, ...style }}>{children}</section>
  );
  const SecHead = ({ eyebrow, title: t, color }: { eyebrow: string; title: string; color?: string }) => (
    <div style={{ marginBottom: D ? 30 : 22 }}><Eyebrow color={color}>{eyebrow}</Eyebrow><H2>{t}</H2></div>
  );
  const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{ background: CARD, border: `1px solid ${BD}`, borderRadius: D ? 22 : 18, padding: D ? 24 : 18, ...style }}>{children}</div>
  );
  const Badge = ({ i, children }: { i: number; children: React.ReactNode }) => (
    <span style={{ width: D ? 40 : 34, height: D ? 40 : 34, borderRadius: 12, background: voRgba(POP[i % POP.length], 0.2), color: POP[i % POP.length], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: disp, fontWeight: 700, fontSize: D ? 16 : 14, flexShrink: 0 }}>{children}</span>
  );
  const num = (i: number) => dig(`0${i + 1}`.slice(-2));

  // ════════ HERO ════════
  const Hero = () => {
    const stickers: string[] = [pkg.destination, nightsN ? `${dig(nightsN)} ${L.ui.nights}` : "", pkg.rating ? `★ ${dig(pkg.rating)}` : ""].filter(Boolean) as string[];
    const words = title.split(" ");
    const lastWord = words.length > 1 ? words.pop()! : "";
    const firstPart = words.join(" ");
    const stats: { v: string; l: string }[] = [];
    if (nightsN) stats.push({ v: dig(nightsN), l: L.ui.nights });
    if (pkg.rating != null) stats.push({ v: dig(pkg.rating), l: L.ui.rating });
    if (pkg.reviewCount != null) stats.push({ v: dig(pkg.reviewCount), l: L.ui.review });
    const depCount = secArr(findSec(pkg, "departures"), "entries").length || (pkg.departures?.length ?? 0);
    if (depCount) stats.push({ v: dig(depCount), l: L.ui.departures });

    return (
      <div data-pmx-section="hero">
        {D ? (
          <Wrap pt={24} pb={40}>
            <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 36, alignItems: "stretch" }}>
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                {stickers.length > 0 && <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" }}>{stickers.map((s, i) => <Sticker key={i} rot={i % 2 ? 2 : -3} bg={i === 0 ? brand : POP[i]}>{s}</Sticker>)}</div>}
                <div style={{ fontFamily: disp, fontWeight: 700, lineHeight: 0.92, letterSpacing: "-3px" }} data-pmx-field="title">
                  <div style={{ fontSize: 88, color: TXT }}>{firstPart || title}</div>
                  {lastWord && <div style={{ fontSize: 88, color: brand }}>{lastWord}</div>}
                </div>
                {pkg.description && <p style={{ fontFamily: sans, fontSize: 16, color: MUT, lineHeight: 1.6, maxWidth: 460, marginTop: 26 }}>{pkg.description}</p>}
                {pkg.whatsapp && <div style={{ display: "flex", gap: 12, marginTop: 26 }}><CTA big onClick={onWhatsApp}>{L.ui.lockItIn}</CTA></div>}
              </div>
              <div style={{ position: "relative", borderRadius: 28, overflow: "hidden", minHeight: 540, background: CARD }}>
                {cover && <img src={cover} onClick={() => zoom(cover)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }} />}
                <div style={{ position: "absolute", insetInlineStart: 18, top: 18 }}><Sticker rot={-4} bg="#fff" col="#0d1424"><span data-pmx-field="destination">{pkg.destination}</span></Sticker></div>
              </div>
            </div>
          </Wrap>
        ) : (
          <div style={{ padding: `12px ${px}px 28px` }}>
            {stickers.length > 0 && <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>{stickers.map((s, i) => <Sticker key={i} rot={i % 2 ? 2 : -3} bg={i === 0 ? brand : POP[i]}>{s}</Sticker>)}</div>}
            <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", height: 360, marginBottom: 18, background: CARD }}>
              {cover && <img src={cover} onClick={() => zoom(cover)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }} />}
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 45%, rgba(13,20,36,0.75))", pointerEvents: "none" }} />
              <div style={{ position: "absolute", insetInline: 16, bottom: 16, fontFamily: disp, fontWeight: 700, lineHeight: 0.92, letterSpacing: "-1.2px", color: "#fff" }} data-pmx-field="title">
                <div style={{ fontSize: 42 }}>{firstPart || title}</div>{lastWord && <div style={{ fontSize: 42, color: brand }}>{lastWord}</div>}
              </div>
            </div>
            {pkg.description && <p style={{ fontFamily: sans, fontSize: 14.5, color: MUT, lineHeight: 1.6 }}>{pkg.description}</p>}
            {pkg.whatsapp && <div style={{ marginTop: 16 }}><CTA full big onClick={onWhatsApp}>{L.ui.lockItIn}</CTA></div>}
          </div>
        )}
        {stats.length > 0 && (
          <Wrap pt={0} pb={24}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${stats.length},1fr)`, gap: D ? 14 : 8 }}>
              {stats.map((s, i) => (
                <Card key={i} style={{ padding: D ? "22px 18px" : "14px 12px" }}>
                  <div style={{ fontFamily: disp, fontSize: D ? 34 : 21, fontWeight: 700, color: POP[i % POP.length], letterSpacing: "-1px", lineHeight: 1 }}>{s.v}</div>
                  <div style={{ fontFamily: sans, fontSize: D ? 12 : 10, color: MUT, marginTop: 8, textTransform: uc, letterSpacing: "0.5px" }}>{s.l}</div>
                </Card>
              ))}
            </div>
          </Wrap>
        )}
      </div>
    );
  };

  // ════════ SCARCITY ════════
  const Scarcity = () => {
    const sc = pkg.scarcity;
    if (!sc || sc.spotsRemaining == null) return null;
    const total = sc.totalSpots && sc.totalSpots > 0 ? sc.totalSpots : Math.max(sc.spotsRemaining, 10);
    const pct = Math.round(((total - sc.spotsRemaining) / total) * 100);
    return (
      <Wrap pt={0} pb={D ? 40 : 28} section="scarcity">
        <div style={{ borderRadius: D ? 24 : 18, padding: D ? 28 : 20, background: `linear-gradient(120deg, ${voRgba(brand, 0.22)}, ${voRgba(POP[2], 0.18)})`, border: `1px solid ${voRgba(brand, 0.4)}` }}>
          <div style={{ display: "flex", flexDirection: D ? "row" : "column", gap: D ? 0 : 16, justifyContent: "space-between", alignItems: D ? "center" : "stretch" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", background: brand, boxShadow: `0 0 0 6px ${voRgba(brand, 0.25)}` }} />
              <div>
                <div style={{ fontFamily: disp, fontSize: 11, fontWeight: 700, letterSpacing: rtl ? 0 : "1.4px", textTransform: uc, color: brand }}>{L.sections.scarcity}</div>
                <div style={{ fontFamily: disp, fontSize: D ? 24 : 18, fontWeight: 700, color: TXT, marginTop: 4, maxWidth: 520, lineHeight: 1.2, letterSpacing: rtl ? 0 : "-0.5px" }}>{L.ui.spotsLeftLine(sc.spotsRemaining)}</div>
              </div>
            </div>
            <div style={{ textAlign: rtl ? "start" : "end", minWidth: D ? 200 : "auto" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, justifyContent: D ? "flex-end" : "flex-start" }}>
                <span style={{ fontFamily: disp, fontSize: D ? 38 : 30, fontWeight: 700, color: TXT, letterSpacing: "-1px" }}>{dig(pkg.price || "")}</span>
                {sc.wasPrice && <span style={{ fontFamily: sans, fontSize: 16, color: FAINT, textDecoration: "line-through" }}>{dig(sc.wasPrice)}</span>}
              </div>
              <div style={{ height: 8, background: "rgba(255,255,255,0.12)", borderRadius: 99, marginTop: 10, overflow: "hidden" }}><div style={{ width: pct + "%", height: "100%", background: brand, borderRadius: 99 }} /></div>
              <div style={{ fontFamily: sans, fontSize: 11.5, color: MUT, marginTop: 6 }}>{dig(sc.spotsRemaining)} {L.ui.seatsLeft}{sc.firstDepartureDate ? ` · ${L.ui.nextDeparture} ${dig(sc.firstDepartureDate)}` : ""}</div>
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
      <Wrap pt={D ? 24 : 8} section="highlights">
        <SecHead eyebrow={L.nav.highlights} title={ar("The bits you'll brag about", "ما ستفخر بحكايته")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 14 }}>
          {items.map((h, i) => {
            const t = secItemStr(h, "title", "text", "label");
            const d = typeof h === "object" ? secItemStr(h, "desc", "description") : "";
            return (
              <Card key={i} style={{ background: `linear-gradient(160deg, ${voRgba(POP[i % POP.length], 0.16)}, ${CARD})` }}>
                <Badge i={i}>{num(i)}</Badge>
                <div style={{ fontFamily: disp, fontSize: D ? 21 : 18, fontWeight: 700, color: TXT, marginTop: 12, letterSpacing: rtl ? 0 : "-0.4px", lineHeight: 1.2 }}>{t}</div>
                {d && <div style={{ fontFamily: sans, fontSize: 13.5, color: MUT, lineHeight: 1.6, marginTop: 8 }}>{d}</div>}
              </Card>
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
    const reel = imgs.slice(1, 5);
    const stops = mapImage ? [] : itinDays.slice(0, 5).map((d) => ({ label: secItemStr(d, "title") })).filter((s) => s.label);
    return (
      <Wrap section="media">
        <SecHead eyebrow={L.sections.media} title={ar("Straight off the group chat", "لقطات من الرحلة")} />
        <div style={{ display: "grid", gridTemplateColumns: reel.length ? "1fr 1fr" : "1fr", gap: D ? 12 : 8, alignItems: "stretch" }}>
          <VoVideo src={video} poster={cover || imgs[0]} accent={brand} radius={D ? 20 : 16} rtl={rtl} sans={sans} height={D ? 420 : 230} ui={L.ui} />
          {reel.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: reel.length > 2 ? "1fr 1fr" : "1fr", gap: D ? 12 : 8 }}>
              {reel.map((u, i) => (
                <div key={i} style={{ position: "relative", borderRadius: D ? 16 : 12, overflow: "hidden", minHeight: 100 }}>
                  <img src={u} onClick={() => zoom(u)} style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }} />
                  {i === 0 && <div style={{ position: "absolute", insetInlineStart: 8, top: 8 }}><Sticker rot={-4} bg={POP[1]} col="#0d1424">#reel</Sticker></div>}
                </div>
              ))}
            </div>
          )}
        </div>
        {(mapImage || stops.length > 0) && (
          <div style={{ marginTop: 18 }}>
            <Eyebrow color={POP[1]}>{L.ui.route}</Eyebrow>
            {mapImage
              ? <img src={mapImage} alt={mapCaption} style={{ width: "100%", height: D ? 230 : 170, objectFit: "cover", borderRadius: 18, display: "block" }} />
              : <VoRouteMap stops={stops} line={brand} height={D ? 230 : 170} rounded={18} rtl={rtl} />}
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
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 12 : 10 }}>
          {itinDays.map((it, i) => (
            <div key={i} style={{ background: CARD, border: `1px solid ${BD}`, borderRadius: 16, padding: D ? 18 : 15, display: "flex", gap: 14, alignItems: "flex-start" }}>
              <Badge i={i}>{dig((it.day as number) ?? i + 1)}</Badge>
              <div>
                <div style={{ fontFamily: disp, fontSize: D ? 16 : 15, fontWeight: 700, color: TXT, letterSpacing: rtl ? 0 : "-0.3px" }}>{secItemStr(it, "title")}</div>
                {secItemStr(it, "desc", "description") && <div style={{ fontFamily: sans, fontSize: 12.5, color: MUT, lineHeight: 1.5, marginTop: 4 }}>{secItemStr(it, "desc", "description")}</div>}
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
    const blurb = (r0 ? secItemStr(r0, "note", "description", "blurb") : "") || secStr(h, "description") || pkg.hotelDescription || "";
    const features = r0 ? secStrArr(r0, "facilities").concat(secStrArr(r0, "features")) : [];
    if (!blurb && !name) return null;
    const img = mediaImgs[2] || mediaImgs[0] || cover;
    return (
      <Wrap section="hotel">
        <SecHead eyebrow={L.sections.hotel} title={ar("Where you crash", "أين تقيم")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "1.1fr 1fr" : "1fr", gap: D ? 32 : 16, alignItems: "center" }}>
          {img && <div style={{ borderRadius: 22, overflow: "hidden", height: D ? 340 : 210 }}><img src={img} onClick={() => zoom(img)} style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }} /></div>}
          <div>
            {name && <div style={{ fontFamily: disp, fontSize: D ? 30 : 23, fontWeight: 700, color: TXT, letterSpacing: rtl ? 0 : "-0.6px" }}>{name}</div>}
            {blurb && <p style={{ fontFamily: sans, fontSize: D ? 15 : 14, color: MUT, lineHeight: 1.7, marginTop: name ? 12 : 0, whiteSpace: "pre-line" }}>{blurb}</p>}
            {features.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>{features.map((f, i) => <span key={i} style={{ fontFamily: sans, fontSize: 12.5, color: TXT, background: CARD2, borderRadius: 999, padding: "7px 14px" }}>{f}</span>)}</div>}
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
        <SecHead eyebrow={L.sections.meals} title={planLabel} />
        {notes && <p style={{ fontFamily: sans, fontSize: 14.5, color: MUT, lineHeight: 1.7, margin: 0, maxWidth: 640, whiteSpace: "pre-line" }}>{notes}</p>}
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
        <SecHead eyebrow={L.sections.inclusions} title={ar("In the price / not in the price", "ضمن السعر / خارجه")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 14 : 12 }}>
          {includes.length > 0 && (
            <Card style={{ background: voRgba("#25d366", 0.1), border: `1px solid ${voRgba("#25d366", 0.3)}` }}>
              <div style={{ fontFamily: disp, fontSize: 13, fontWeight: 700, color: "#25d366", letterSpacing: rtl ? 0 : "1px", textTransform: uc, marginBottom: 12 }}>✓ {L.ui.included}</div>
              {includes.map((it, i) => <div key={i} style={{ fontFamily: sans, fontSize: 13.5, color: TXT, padding: "7px 0", lineHeight: 1.4 }}>{it}</div>)}
            </Card>
          )}
          {excludes.length > 0 && (
            <Card>
              <div style={{ fontFamily: disp, fontSize: 13, fontWeight: 700, color: FAINT, letterSpacing: rtl ? 0 : "1px", textTransform: uc, marginBottom: 12 }}>✕ {L.ui.notIncluded}</div>
              {excludes.map((it, i) => <div key={i} style={{ fontFamily: sans, fontSize: 13.5, color: MUT, padding: "7px 0", lineHeight: 1.4 }}>{it}</div>)}
            </Card>
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
        <SecHead eyebrow={L.sections.transfers} title={ar("Getting around, sorted", "تنقّلك علينا")} />
        {desc && !items.length && <p style={{ fontFamily: sans, fontSize: 14, color: MUT, lineHeight: 1.7, margin: 0, maxWidth: 640 }}>{desc}</p>}
        {items.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 12 }}>
            {items.map((t, i) => (
              <Card key={i}>
                <Badge i={i}>{num(i)}</Badge>
                <div style={{ fontFamily: disp, fontSize: D ? 17 : 16, fontWeight: 700, color: TXT, marginTop: 10 }}>{secItemStr(t, "leg", "title", "name", "text")}</div>
                {typeof t === "object" && secItemStr(t, "desc", "description") && <div style={{ fontFamily: sans, fontSize: 13, color: MUT, lineHeight: 1.55, marginTop: 6 }}>{secItemStr(t, "desc", "description")}</div>}
              </Card>
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
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 32 : 20 }}>
          <div>
            <Eyebrow>{L.sections.visa}</Eyebrow>
            <H2 size={D ? 36 : 24}>{VISA_LABELS[included]?.[lang] || ar("Visa & entry", "التأشيرة والدخول")}</H2>
          </div>
          {content && <p style={{ fontFamily: sans, fontSize: 14.5, color: MUT, lineHeight: 1.7, margin: 0, whiteSpace: "pre-line" }}>{content}</p>}
        </div>
      </Wrap>
    );
  };

  // ════════ DEPARTURES ════════
  const Departures = () => {
    const entries = secArr(findSec(pkg, "departures"), "entries");
    const rows = entries.length ? entries : (pkg.departures ?? []).map((d) => ({ date: d.date, price: d.price, spots: d.spots } as SecData));
    if (!rows.length) return null;
    return (
      <Wrap id="vo-departures" section="departures">
        <SecHead eyebrow={L.sections.departures} title={ar("Pick your launchpad", "اختر نقطة انطلاقك")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 12 }}>
          {rows.map((r, i) => {
            const spots = typeof r.spots === "number" ? r.spots : Number(r.spots) || 0;
            const sold = spots <= 0;
            const from = secItemStr(r, "origin", "from");
            const to = secItemStr(r, "arrivingAirport", "to");
            const date = secItemStr(r, "date");
            const price = secItemStr(r, "price");
            return (
              <Card key={i} style={{ opacity: sold ? 0.5 : 1, background: sold ? CARD : `linear-gradient(160deg, ${voRgba(brand, 0.12)}, ${CARD})` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ fontFamily: disp, fontSize: D ? 20 : 18, fontWeight: 700, color: TXT }}>{from || dig(date)}</div>
                  {to && <div style={{ fontFamily: sans, fontSize: 12, color: MUT }}>→ {to}</div>}
                </div>
                {(from || to) && date && <div style={{ fontFamily: sans, fontSize: 12.5, color: MUT, marginTop: 8 }}>{dig(date)}</div>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 14 }}>
                  {price && <span style={{ fontFamily: disp, fontSize: D ? 24 : 21, fontWeight: 700, color: brand }}>{dig(price)}</span>}
                  <span style={{ fontFamily: sans, fontSize: 11.5, fontWeight: 700, color: sold ? FAINT : "#2dd4a0" }}>{sold ? L.ui.soldOut : `${dig(spots)} ${L.ui.left}`}</span>
                </div>
              </Card>
            );
          })}
        </div>
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
      <Wrap id="vo-pricing" section="pricing">
        <SecHead eyebrow={L.sections.pricing} title={ar("Pick your setup", "اختر باقتك")} />
        {tiers.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? `repeat(${Math.min(tiers.length, 3)},1fr)` : "1fr", gap: 14 }}>
            {tiers.map((t, i) => {
              const featured = tiers.length === 3 && i === 1;
              return (
                <div key={i} style={{ borderRadius: 20, padding: D ? 26 : 20, position: "relative", background: featured ? brand : CARD, color: featured ? onBrand : TXT, border: featured ? "none" : `1px solid ${BD}`, boxShadow: featured ? `0 16px 40px ${voRgba(brand, 0.4)}` : "none" }}>
                  {featured && <div style={{ position: "absolute", top: 16, insetInlineEnd: 16 }}><Sticker rot={3} bg="#fff" col="#0d1424">{L.ui.mostPopular}</Sticker></div>}
                  <div style={{ fontFamily: sans, fontSize: 13, opacity: 0.85 }}>{localizeTierLabel(t.label, lang)}</div>
                  <div style={{ fontFamily: disp, fontSize: D ? 42 : 34, fontWeight: 700, letterSpacing: "-1.5px", marginTop: 8, lineHeight: 1 }}>{dig(t.price)}</div>
                  {pkg.whatsapp && <div style={{ marginTop: 18 }}><CTA full bg={featured ? "#0d1424" : brand} col={featured ? "#fff" : undefined} onClick={onWhatsApp}>{L.ui.book}</CTA></div>}
                </div>
              );
            })}
          </div>
        )}
        {(cancellation.length > 0 || schedule.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: 14, marginTop: tiers.length ? 24 : 0 }}>
            {cancellation.length > 0 && (
              <Card>
                <div style={{ fontFamily: disp, fontSize: 12.5, fontWeight: 700, color: brand, letterSpacing: rtl ? 0 : "1px", textTransform: uc, marginBottom: 12 }}>{L.ui.cancellation}</div>
                {cancellation.map((s, i) => <div key={i} style={{ fontFamily: sans, fontSize: 13, color: MUT, padding: "6px 0", lineHeight: 1.5 }}>· {s}</div>)}
              </Card>
            )}
            {schedule.length > 0 && (
              <Card>
                <div style={{ fontFamily: disp, fontSize: 12.5, fontWeight: 700, color: brand, letterSpacing: rtl ? 0 : "1px", textTransform: uc, marginBottom: 12 }}>{L.ui.paymentSchedule}</div>
                {schedule.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderTop: i ? `1px solid ${BD}` : "none" }}>
                    <span style={{ fontFamily: sans, fontSize: 13, color: TXT }}>{secItemStr(s, "dueDate", "label")}</span>
                    <span style={{ fontFamily: disp, fontSize: 14, fontWeight: 700, color: brand }}>{dig(secItemStr(s, "amount"))}</span>
                  </div>
                ))}
              </Card>
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
        <SecHead eyebrow={L.sections.extras} title={ar("Bolt-ons", "إضافات")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 12 }}>
          {items.map((e, i) => (
            <Card key={i} style={{ display: "flex", flexDirection: "column" }}>
              <Badge i={i}>{num(i)}</Badge>
              <div style={{ fontFamily: disp, fontSize: D ? 18 : 16, fontWeight: 700, color: TXT, marginTop: 10 }}>{secItemStr(e, "name", "title")}</div>
              {secItemStr(e, "description", "desc") && <div style={{ fontFamily: sans, fontSize: 12.5, color: MUT, lineHeight: 1.5, marginTop: 6, flex: 1 }}>{secItemStr(e, "description", "desc")}</div>}
              {secItemStr(e, "price") && <div style={{ fontFamily: disp, fontSize: 20, fontWeight: 700, color: brand, marginTop: 12 }}>{dig(secItemStr(e, "price"))}</div>}
            </Card>
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
        <Card style={{ background: `linear-gradient(150deg, ${voRgba(brand, 0.18)}, ${CARD})`, padding: D ? 36 : 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: D ? "auto 1fr" : "1fr", gap: D ? 32 : 16, alignItems: "center" }}>
            {person.photo
              ? <img src={person.photo} style={{ width: D ? 150 : 90, height: D ? 150 : 90, borderRadius: 24, objectFit: "cover" }} />
              : <div style={{ width: D ? 150 : 90, height: D ? 150 : 90, borderRadius: 24, background: brand, color: onBrand, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: disp, fontSize: D ? 56 : 34, fontWeight: 700 }}>{person.name[0]}</div>}
            <div>
              <Eyebrow>{L.sections.people}</Eyebrow>
              <div style={{ fontFamily: disp, fontSize: D ? 32 : 24, fontWeight: 700, color: TXT, letterSpacing: rtl ? 0 : "-0.6px" }}>{person.name}</div>
              {role && <div style={{ fontFamily: sans, fontSize: 13, color: brand, fontWeight: 600, marginTop: 4 }}>{role}</div>}
              {bio && <p style={{ fontFamily: sans, fontSize: 14, color: MUT, lineHeight: 1.65, marginTop: 12 }}>{bio}</p>}
              {pkg.whatsapp && <div style={{ marginTop: 16 }}><CTA onClick={onWhatsApp}>{L.ui.enquire}</CTA></div>}
            </div>
          </div>
        </Card>
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
      <Wrap id="vo-reviews" section="reviews">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 22, flexWrap: "wrap", gap: 12 }}>
          <div><Eyebrow>{L.sections.reviews}</Eyebrow><H2 size={D ? 40 : 27}>{ar("The group chat agrees", "المسافرون متّفقون")}</H2></div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, background: CARD, border: `1px solid ${BD}`, borderRadius: 999, padding: "8px 16px" }}>
            <span style={{ fontFamily: disp, fontSize: D ? 26 : 22, fontWeight: 700, color: brand }}>{dig(rating)}</span>
            <VoStars n={Math.round(rating)} size={14} />
            <span style={{ fontFamily: sans, fontSize: 11.5, color: MUT }}>{dig(count)}</span>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 12 }}>
          {items.slice(0, 6).map((r, i) => (
            <div key={i} style={{ background: CARD2, borderRadius: 20, borderStartStartRadius: 20, borderEndStartRadius: 6, padding: D ? 20 : 16 }}>
              <VoStars n={Math.round(r.rating || 5)} size={13} />
              <p style={{ fontFamily: sans, fontSize: 14, color: TXT, lineHeight: 1.55, margin: "10px 0 14px" }}>{r.text}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: POP[i % POP.length], display: "flex", alignItems: "center", justifyContent: "center", fontFamily: disp, fontWeight: 700, fontSize: 12, color: "#0d1424" }}>{(r.name || "?")[0]}</div>
                <div style={{ fontFamily: disp, fontSize: 13, fontWeight: 700, color: TXT }}>{r.name}</div>
              </div>
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
        <Card style={{ padding: D ? 36 : 22 }}>
          <div style={{ display: "grid", gridTemplateColumns: D && image ? "1.2fr 1fr" : "1fr", gap: D ? 40 : 22, alignItems: "center" }}>
            <div>
              <Eyebrow>{L.sections.agency}</Eyebrow>
              <H2 size={D ? 36 : 26}>{agency.name}</H2>
              {agency.tagline && <div style={{ fontFamily: sans, fontSize: 14, color: brand, fontWeight: 600, marginTop: 6 }}>{agency.tagline}</div>}
              {story && <p style={{ fontFamily: sans, fontSize: 14.5, color: MUT, lineHeight: 1.7, marginTop: 14, whiteSpace: "pre-line" }}>{story}</p>}
            </div>
            {image && <img src={image} style={{ width: "100%", height: D ? 280 : 200, objectFit: "cover", borderRadius: 18 }} />}
          </div>
        </Card>
      </Wrap>
    );
  };

  // ════════ NOTES ════════
  const Notes = () => {
    const items = secMixed(findSec(pkg, "important_notes"), "items");
    if (!items.length) return null;
    return (
      <Wrap section="important_notes">
        <SecHead eyebrow={L.sections.notes} title={ar("Read this bit", "اقرأ هذا الجزء")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 12 }}>
          {items.map((n, i) => {
            const t = secItemStr(n, "title");
            const body = secItemStr(n, "text", "desc", "description") || (typeof n === "string" ? n : "");
            return (
              <Card key={i} style={{ borderInlineStart: `3px solid ${POP[i % POP.length]}` }}>
                {t && <div style={{ fontFamily: disp, fontSize: D ? 17 : 16, fontWeight: 700, color: TXT }}>{t}</div>}
                <div style={{ fontFamily: sans, fontSize: 13, color: MUT, lineHeight: 1.6, marginTop: t ? 6 : 0 }}>{body}</div>
              </Card>
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
        <SecHead eyebrow={L.sections.faq} title={ar("Got questions?", "عندك أسئلة؟")} />
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {items.map((f, i) => (
            <Card key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "center" }}>
                <div style={{ fontFamily: disp, fontSize: D ? 19 : 16, fontWeight: 700, color: TXT, letterSpacing: rtl ? 0 : "-0.3px" }}>{secItemStr(f, "question", "q")}</div>
                <span style={{ fontFamily: disp, fontSize: 22, fontWeight: 700, color: brand }}>+</span>
              </div>
              {secItemStr(f, "answer", "a") && <p style={{ fontFamily: sans, fontSize: 13.5, color: MUT, lineHeight: 1.65, margin: "10px 0 0" }}>{secItemStr(f, "answer", "a")}</p>}
            </Card>
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
    const image = secStr(cs, "image") || cover;
    if (!heading && !body) return null;
    return (
      <Wrap section="custom">
        <div style={{ borderRadius: D ? 28 : 20, overflow: "hidden", position: "relative", minHeight: D ? 340 : 300 }}>
          {image && <img src={image} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(120deg, ${voRgba(brand, 0.85)}, rgba(13,20,36,0.78))` }} />
          <div style={{ position: "relative", padding: D ? 48 : 26, maxWidth: 640 }}>
            <Sticker rot={-3} bg="#fff" col="#0d1424">{L.sections.custom}</Sticker>
            {heading && <div style={{ fontFamily: disp, fontSize: D ? 44 : 28, fontWeight: 700, color: "#fff", lineHeight: 1.05, letterSpacing: rtl ? 0 : "-1px", margin: "18px 0 14px" }}>{heading}</div>}
            {body && <p style={{ fontFamily: sans, fontSize: D ? 16 : 14, color: "rgba(255,255,255,0.92)", lineHeight: 1.6, margin: 0, whiteSpace: "pre-line" }}>{body}</p>}
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
        <SecHead eyebrow={L.sections.others} title={ar("Where to next?", "إلى أين بعد ذلك؟")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 14 }}>
          {list.map((o, i) => {
            const oTitle = secItemStr(o, "title");
            const place = secItemStr(o, "destination", "place");
            const price = secItemStr(o, "price");
            const oNights = secItemStr(o, "nights");
            const img = secItemStr(o, "image");
            const link = secItemStr(o, "link");
            const Inner = (
              <div style={{ background: CARD, border: `1px solid ${BD}`, borderRadius: 20, overflow: "hidden", height: "100%" }}>
                <div style={{ height: 150, position: "relative", background: CARD2 }}>
                  {img && <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                  {place && <div style={{ position: "absolute", insetInlineStart: 12, top: 12 }}><Sticker rot={-3} bg={POP[i % POP.length]} col="#0d1424">{place}</Sticker></div>}
                </div>
                <div style={{ padding: 16 }}>
                  <div style={{ fontFamily: disp, fontSize: 18, fontWeight: 700, color: TXT, lineHeight: 1.15, letterSpacing: rtl ? 0 : "-0.4px" }}>{oTitle}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginTop: 12 }}>
                    {price && <span style={{ fontFamily: disp, fontSize: 19, fontWeight: 700, color: brand }}>{dig(price)}</span>}
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
      <section style={{ padding: `${D ? 60 : 36}px ${px}px`, background: `linear-gradient(120deg, ${brand}, ${voDarken(brand, 0.25)})`, textAlign: "center", color: onBrand }}>
        <div style={{ fontFamily: disp, fontSize: D ? 52 : 32, fontWeight: 700, lineHeight: 1, letterSpacing: rtl ? 0 : "-1.5px" }}>{L.ui.dontOverthink}</div>
        <div style={{ fontFamily: sans, fontSize: 14, opacity: 0.9, margin: "12px 0 24px" }}>{L.ui.replyTime}</div>
        <div style={{ display: "inline-flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {pkg.whatsapp && <CTA big bg="#0d1424" col="#fff" onClick={onWhatsApp}>{L.ui.bookWhatsapp}</CTA>}
          {pkg.messenger && onMessenger && <button onClick={onMessenger} style={{ fontFamily: disp, background: "rgba(255,255,255,0.18)", color: onBrand, border: "1px solid rgba(255,255,255,0.3)", borderRadius: 999, padding: "16px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer" }}>{L.ui.messenger}</button>}
        </div>
      </section>
      <div style={{ padding: `20px ${px}px`, display: "flex", justifyContent: "space-between", alignItems: "center", background: BG }}>
        <div style={{ fontFamily: disp, fontSize: 17, fontWeight: 700, color: TXT }}>{agency.name}</div>
        <div style={{ fontFamily: sans, fontSize: 10, color: FAINT, letterSpacing: rtl ? 0 : "1px", textTransform: uc }}>{L.ui.poweredBy}</div>
      </div>
    </div>
  );

  // ════════ BAR ════════
  const initials = (agency.name || "V").split(" ").map((w) => w[0]).slice(0, 2).join("");
  const Bar = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${px}px`, height: D ? 60 : 52, background: "rgba(13,20,36,0.85)", backdropFilter: "blur(10px)", borderBottom: `1px solid ${BD}`, position: "sticky", top: 0, zIndex: 30 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <div style={{ width: D ? 30 : 26, height: D ? 30 : 26, borderRadius: 9, background: brand, color: onBrand, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: disp, fontSize: 13, fontWeight: 700 }}>{initials}</div>
        <div style={{ fontFamily: disp, fontSize: D ? 17 : 15, fontWeight: 700, color: TXT }}>{agency.name}</div>
      </div>
      {D ? (
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {navItems.map(([key, label]) => (
            <button key={key} onClick={() => goTo(key)} style={{ fontFamily: sans, fontSize: 13, color: MUT, background: "none", border: "none", cursor: "pointer", padding: 0 }}>{label}</button>
          ))}
          {pkg.whatsapp && <CTA onClick={onWhatsApp}>{dig(pkg.price || "")}</CTA>}
        </div>
      ) : (pkg.whatsapp && <CTA onClick={onWhatsApp}>{dig(pkg.price || "")}</CTA>)}
    </div>
  );

  return (
    <div dir={rtl ? "rtl" : "ltr"} lang={lang} style={{ width: "100%", background: BG, color: TXT, fontFamily: sans, position: "relative" }}>
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
export function TemplateVoyageCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
