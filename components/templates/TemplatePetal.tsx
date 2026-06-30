"use client";

// ═══════════════════════════════════════════════════════════════════════════
// PETAL V2 — Honeymoons / couples · romantic, soft, intimate.
// Blush paper, a dynamic dusty brand accent + sage, high-contrast Playfair /
// Markazi serif with italics, arched imagery, rounded cards, hairline rules.
// One component renders all 4 surfaces. Faithful port of the V2 design, wired
// to real pkg.sections data with graceful empty states. Brand colour themes
// the whole template.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useState } from "react";
import { useIsDesktop, BaseCard, LightboxCarousel } from "./shared";
import { localizeTierLabel } from "@/lib/translations";
import type { TPageProps, TCardProps, TPackage } from "./types";

type SecData = Record<string, unknown>;

// ─── Brand colour math ────────────────────────────────────────────────────────
function ptHex(h: string): [number, number, number] {
  h = h.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function ptRgba(hex: string, a: number): string { const [r, g, b] = ptHex(hex); return `rgba(${r},${g},${b},${a})`; }
function ptLum(hex: string) { const [r, g, b] = ptHex(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
function ptOn(hex: string) { return ptLum(hex) > 0.62 ? "#2e2422" : "#ffffff"; }

const SAGE = "#7d8c6f";

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
    from: "From", forTwo: "For two", perPerson: "per person", night: "night", nights: "nights",
    included: "Included", notIncluded: "Not included", mostPopular: "Most popular", soldOut: "Sold out",
    left: "left", book: "Book", enquire: "Enquire on WhatsApp", bookWhatsapp: "Book on WhatsApp",
    messenger: "Messenger", seeMore: "See more", nextDeparture: "Next departure", date: "Date", price: "Price",
    to: "To", cancellation: "Cancellation policy", paymentSchedule: "Payment schedule", basedOn: "based on",
    review: "reviews", stars: "stars", route: "Your route", replyTime: "Usually replies within an hour",
    day: "Day", watch: "Watch the film", noVideo: "Video coming soon", play: "Play", pause: "Pause",
    mute: "Mute", unmute: "Unmute", years: "years", poweredBy: "Powered by PackMetrix",
    shallWeBegin: "Shall we begin?", spotsLeftLine: (n: number) => `Only ${n} ${n === 1 ? "suite" : "suites"} remain this season.`,
  },
};
const L_AR: typeof L_EN = {
  sections: {
    highlights: "لماذا ستحبّانها", media: "شاهدا بنفسكما", itinerary: "يومًا بيوم",
    hotel: "مكان إقامتكما", meals: "ما ستتناولانه", inclusions: "ما يشمله البرنامج",
    transfers: "التنقّلات", visa: "التأشيرة والدخول", departures: "مواعيد المغادرة",
    pricing: "اختارا غرفتكما", extras: "أضيفا لمستكما", scarcity: "قبل أن تنفد",
    people: "مصمّم رحلتكما", reviews: "آراء المسافرين", agency: "عن الوكالة",
    notes: "معلومات تهمّكما", faq: "إجابات على أسئلتكما", custom: "كلمة منّا", others: "رحلات أخرى",
  },
  nav: { highlights: "المميزات", itinerary: "البرنامج", hotel: "الإقامة", inclusions: "المشمول", departures: "المواعيد", pricing: "الأسعار", reviews: "التقييمات", faq: "الأسئلة" },
  ui: {
    from: "من", forTwo: "لاثنين", perPerson: "للفرد", night: "ليلة", nights: "ليالٍ",
    included: "مشمول", notIncluded: "غير مشمول", mostPopular: "الأكثر طلبًا", soldOut: "نفدت",
    left: "متبقّية", book: "احجزا", enquire: "استفسرا عبر واتساب", bookWhatsapp: "احجزا عبر واتساب",
    messenger: "ماسنجر", seeMore: "شاهدا المزيد", nextDeparture: "أقرب موعد", date: "التاريخ", price: "السعر",
    to: "إلى", cancellation: "سياسة الإلغاء", paymentSchedule: "جدول الدفع", basedOn: "من",
    review: "تقييم", stars: "نجوم", route: "مسار رحلتكما", replyTime: "نردّ عادةً خلال ساعة",
    day: "اليوم", watch: "شاهدا الفيديو", noVideo: "الفيديو قريبًا", play: "تشغيل", pause: "إيقاف",
    mute: "كتم", unmute: "تشغيل الصوت", years: "سنة", poweredBy: "مُشغّل بواسطة باكمتريكس",
    shallWeBegin: "هلّا بدأنا؟", spotsLeftLine: (n: number) => `بقي ${n} ${n === 1 ? "جناح" : "أجنحة"} فقط هذا الموسم.`,
  },
};

const MEAL_LABELS: Record<string, { en: string; ar: string }> = {
  none: { en: "No meals", ar: "بدون وجبات" }, breakfast: { en: "Breakfast included", ar: "إفطار مشمول" },
  half_board: { en: "Half board", ar: "نصف إقامة" }, full_board: { en: "Full board", ar: "إقامة كاملة" },
  all_inclusive: { en: "All inclusive", ar: "شامل بالكامل" },
};
const VISA_LABELS: Record<string, { en: string; ar: string }> = {
  included: { en: "Visa included", ar: "التأشيرة مشمولة" }, assistance: { en: "Visa assistance provided", ar: "نقدّم المساعدة في التأشيرة" },
  not_included: { en: "Visa not included", ar: "التأشيرة غير مشمولة" }, not_required: { en: "No visa required", ar: "لا تحتاجان تأشيرة" },
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
function WAIcon({ s = 16, fill = "#fff" }: { s?: number; fill?: string }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill={fill}><path d="M20.5 3.5C18.2 1.2 15.2 0 12 0 5.4 0 .1 5.3.1 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.4-1.7c1.7.9 3.7 1.4 5.6 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.3zM12 21.8c-1.7 0-3.4-.5-4.9-1.3l-.4-.2-3.7 1 1-3.6-.2-.4c-.9-1.5-1.4-3.3-1.4-5 0-5.5 4.5-9.9 9.9-9.9 2.6 0 5.1 1 7 2.9 1.9 1.9 2.9 4.4 2.9 7-.1 5.4-4.5 9.5-10.2 9.5z" /></svg>;
}

// ─── Star rating ──────────────────────────────────────────────────────────────
function PtStars({ n = 5, of = 5, size = 14, color }: { n?: number; of?: number; size?: number; color: string }) {
  const star = (fill: string) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} style={{ display: "block" }}><path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 18.6 5.9 20.8l1.2-6.6L2.3 9.6l6.6-.9z" /></svg>
  );
  return <span style={{ display: "inline-flex", gap: 2 }}>{Array.from({ length: of }).map((_, i) => <span key={i}>{star(i < n ? color : ptRgba(color, 0.22))}</span>)}</span>;
}

// ─── Abstract route map ───────────────────────────────────────────────────────
function PtRouteMap({ stops, line, land = "#ead9d0", ink = "#2e2422", height = 220, rounded = 20, rtl = false }: { stops: { label: string }[]; line: string; land?: string; ink?: string; height?: number; rounded?: number; rtl?: boolean }) {
  const W = 1000, H = 420;
  const pts = stops.map((s, i) => {
    const x = stops.length === 1 ? W / 2 : 120 + (i * (W - 240)) / (stops.length - 1);
    const y = 150 + Math.sin(i * 1.3 + 0.6) * 70 + (i % 2 ? 20 : -10);
    return { ...s, x: rtl ? W - x : x, y };
  });
  const path = pts.map((p, i) => { if (i === 0) return `M ${p.x} ${p.y}`; const prev = pts[i - 1]; const mx = (prev.x + p.x) / 2; return `Q ${mx} ${prev.y - 40} ${p.x} ${p.y}`; }).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height, display: "block", borderRadius: rounded, background: "#fdf3ee" }} preserveAspectRatio="xMidYMid slice">
      <g fill={land} opacity="0.85"><path d="M-40 300 Q 180 250 360 300 T 760 290 Q 920 270 1060 320 L1060 460 L-40 460 Z" /><ellipse cx="220" cy="120" rx="190" ry="90" opacity="0.5" /><ellipse cx="780" cy="100" rx="160" ry="80" opacity="0.5" /></g>
      <g stroke={ptRgba(ink, 0.05)} strokeWidth="1">{[80, 180, 280, 360].map((y) => <line key={y} x1="0" x2={W} y1={y} y2={y} />)}{[200, 400, 600, 800].map((x) => <line key={x} y1="0" y2={H} x1={x} x2={x} />)}</g>
      <path d={path} fill="none" stroke={line} strokeWidth="3.5" strokeDasharray="2 12" strokeLinecap="round" opacity="0.9" />
      {pts.map((p, i) => <g key={i}><circle cx={p.x} cy={p.y} r="11" fill="#fff" stroke={line} strokeWidth="3.5" /><circle cx={p.x} cy={p.y} r="4" fill={line} /><text x={p.x} y={p.y - 22} textAnchor="middle" fill={ink} fontSize="22" fontWeight="600" fontFamily="inherit">{p.label}</text></g>)}
    </svg>
  );
}

// ─── Video player (radius accepts string for arched corners) ──────────────────
function PtVideo({ src, poster, accent, radius = 16, rtl = false, sans, height = 320, ui }: { src?: string; poster?: string; accent: string; radius?: number | string; rtl?: boolean; sans: string; height?: number; ui: typeof L_EN["ui"] }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const ctrl: React.CSSProperties = { width: 38, height: 38, borderRadius: "50%", border: "none", cursor: "pointer", background: "rgba(0,0,0,0.45)", backdropFilter: "blur(6px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 };
  const onAccent = ptOn(accent);
  if (!src) {
    return (
      <div style={{ position: "relative", borderRadius: radius, overflow: "hidden", height, background: "#2e2422" }}>
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
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "linear-gradient(rgba(0,0,0,0.05),rgba(0,0,0,0.35))" }}>
          <div style={{ width: 72, height: 72, borderRadius: "50%", background: accent, color: onAccent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(0,0,0,0.35)" }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="currentColor" style={{ marginInlineStart: 3 }}><path d="M8 5v14l11-7z" /></svg>
          </div>
          <div style={{ fontFamily: sans, fontSize: 12.5, fontWeight: 600, color: "#fff", letterSpacing: "0.4px", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>{ui.watch}</div>
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
export function TemplatePetalPage({ pkg, agency, onWhatsApp, onMessenger, lang = "en" }: TPageProps) {
  const D = useIsDesktop();
  const rtl = lang === "ar";
  const L = rtl ? L_AR : L_EN;
  const brand = agency.brandColor || "#9e6b7a";
  const onBrand = ptOn(brand);

  const BG = "#f8efe9", PAPER = "#fdf9f5", INK = "#2e2422";
  const MUT = "rgba(46,36,34,0.6)", FAINT = "rgba(46,36,34,0.42)", RULE = "rgba(46,36,34,0.12)";
  const serif = rtl ? "var(--font-markazi), var(--font-playfair), 'Markazi Text', serif" : "var(--font-playfair), 'Playfair Display', serif";
  const sans = rtl ? "var(--font-tajawal), var(--font-nunito-sans), sans-serif" : "var(--font-nunito-sans), 'Nunito Sans', sans-serif";
  const px = D ? 76 : 22;
  const ar = (en: string, a: string) => (rtl ? a : en);
  const dig = (s: string | number) => (rtl ? String(s).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]) : String(s));
  const uc: React.CSSProperties["textTransform"] = rtl ? "none" : "uppercase";
  const arch = (r: number): React.CSSProperties => ({ borderRadius: `${r}px ${r}px 24px 24px`, overflow: "hidden" });

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
  const Script = ({ children, color = brand, size, mb = 0 }: { children: React.ReactNode; color?: string; size?: number; mb?: number }) => (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: mb }}>
      <span style={{ width: 22, height: 1, background: color }} />
      <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: size || (D ? 17 : 14), color }}>{children}</span>
    </div>
  );
  const H2 = ({ children, size }: { children: React.ReactNode; size?: number }) => (
    <h2 style={{ fontFamily: serif, fontSize: size || (D ? 46 : 30), fontWeight: 500, lineHeight: 1.08, letterSpacing: rtl ? 0 : "-0.4px", color: INK, margin: 0 }}>{children}</h2>
  );
  const Wrap = ({ children, pt, pb, style, id, section }: { children: React.ReactNode; pt?: number; pb?: number; style?: React.CSSProperties; id?: string; section?: string }) => (
    <section id={id} data-pmx-section={section} style={{ scrollMarginTop: D ? 70 : 58, padding: `${pt != null ? pt : (D ? 76 : 40)}px ${px}px ${pb != null ? pb : (D ? 76 : 40)}px`, ...style }}>{children}</section>
  );
  const CTA = ({ children, full, big, bg = brand, col, onClick }: { children: React.ReactNode; full?: boolean; big?: boolean; bg?: string; col?: string; onClick?: () => void }) => (
    <button data-testid="wa-cta" onClick={onClick} style={{ fontFamily: sans, background: bg, color: col || ptOn(bg), border: "none", borderRadius: 999, padding: big ? "15px 28px" : "12px 22px", fontSize: D ? 14.5 : 13.5, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, width: full ? "100%" : "auto", boxShadow: `0 10px 26px ${ptRgba(bg, 0.28)}` }}>
      <WAIcon s={15} fill={col || ptOn(bg)} /> {children}
    </button>
  );
  const Ghost = ({ children }: { children: React.ReactNode }) => (
    <button style={{ fontFamily: sans, background: "transparent", color: INK, border: `1.5px solid ${RULE}`, borderRadius: 999, padding: "13px 22px", fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>{children}</button>
  );
  const SecHead = ({ kicker, title: t, sub, center }: { kicker: string; title: string; sub?: string; center?: boolean }) => (
    <div style={{ marginBottom: D ? 34 : 24, display: "flex", flexDirection: "column", alignItems: center ? "center" : "flex-start", textAlign: center ? "center" : "start" }}>
      <Script mb={10}>{kicker}</Script>
      <H2>{t}</H2>
      {sub && <p style={{ fontFamily: sans, fontSize: D ? 16 : 14.5, color: MUT, lineHeight: 1.7, margin: "12px 0 0", maxWidth: 620 }}>{sub}</p>}
    </div>
  );
  const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{ background: PAPER, border: `1px solid ${RULE}`, borderRadius: 22, padding: D ? 24 : 18, ...style }}>{children}</div>
  );
  const num = (i: number) => dig(`0${i + 1}`.slice(-2));

  // ════════ HERO ════════
  const Hero = () => {
    const priceCard = (
      <>
        <div style={{ fontFamily: sans, fontSize: 10.5, color: FAINT, letterSpacing: rtl ? 0 : "0.8px", textTransform: uc }}>{L.ui.forTwo}</div>
        <div style={{ fontFamily: serif, fontSize: D ? 50 : 44, fontWeight: 500, color: brand, lineHeight: 1, margin: "6px 0 4px" }} data-pmx-field="price">{dig(pkg.price || "")}</div>
        {nightsN != null && <div style={{ fontFamily: sans, fontSize: 11.5, color: FAINT }}>{dig(nightsN)} {L.ui.nights} · {L.ui.perPerson}</div>}
      </>
    );
    if (D) {
      return (
        <Wrap pt={70} pb={48} section="hero">
          <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", gap: 64, alignItems: "center" }}>
            <div style={{ position: "relative", height: 580, ...arch(260), background: PAPER }}>
              {cover && <img src={cover} onClick={() => zoom(cover)} style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }} />}
            </div>
            <div>
              <Script mb={16}><span data-pmx-field="destination">{pkg.destination}</span></Script>
              <h1 style={{ fontFamily: serif, fontSize: 60, fontWeight: 500, fontStyle: "italic", lineHeight: 1.04, letterSpacing: rtl ? 0 : "-1px", color: INK, margin: "8px 0 0" }} data-pmx-field="title">{title}</h1>
              {pkg.description && <p style={{ fontFamily: sans, fontSize: 17, color: MUT, lineHeight: 1.8, margin: "24px 0 0", maxWidth: 440 }}>{pkg.description}</p>}
              <div style={{ marginTop: 34 }}>{priceCard}</div>
              <div style={{ display: "flex", gap: 12, marginTop: 30 }}>
                {pkg.whatsapp && <CTA big onClick={onWhatsApp}>{L.ui.enquire}</CTA>}
                <Ghost>{L.ui.seeMore}</Ghost>
              </div>
            </div>
          </div>
        </Wrap>
      );
    }
    return (
      <Wrap pt={26} pb={20} section="hero">
        <Script mb={14}><span data-pmx-field="destination">{pkg.destination}</span></Script>
        <h1 style={{ fontFamily: serif, fontSize: 36, fontWeight: 500, fontStyle: "italic", lineHeight: 1.08, letterSpacing: rtl ? 0 : "-0.5px", color: INK, margin: "6px 0 20px" }} data-pmx-field="title">{title}</h1>
        <div style={{ position: "relative", height: 380, ...arch(200), background: PAPER }}>
          {cover && <img src={cover} onClick={() => zoom(cover)} style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }} />}
        </div>
        {pkg.description && <p style={{ fontFamily: sans, fontSize: 15, color: MUT, lineHeight: 1.75, margin: "20px 0 0" }}>{pkg.description}</p>}
        <div style={{ background: PAPER, border: `1px solid ${RULE}`, borderRadius: 22, padding: 20, marginTop: 20, textAlign: "center" }}>
          {priceCard}
          {pkg.whatsapp && <div style={{ marginTop: 14 }}><CTA full onClick={onWhatsApp}>{L.ui.enquire}</CTA></div>}
        </div>
      </Wrap>
    );
  };

  // ════════ SCARCITY ════════
  const Scarcity = () => {
    const sc = pkg.scarcity;
    if (!sc || sc.spotsRemaining == null) return null;
    const total = sc.totalSpots && sc.totalSpots > 0 ? sc.totalSpots : Math.max(sc.spotsRemaining, 6);
    return (
      <Wrap pt={0} pb={D ? 40 : 24} section="scarcity">
        <div style={{ background: ptRgba(brand, 0.07), border: `1px solid ${ptRgba(brand, 0.2)}`, borderRadius: 24, padding: D ? "24px 32px" : "20px", display: "flex", flexDirection: D ? "row" : "column", gap: D ? 0 : 14, alignItems: "center", justifyContent: "space-between", textAlign: D ? "start" : "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14, flexDirection: D ? "row" : "column" }}>
            <span style={{ fontFamily: serif, fontStyle: "italic", fontSize: D ? 40 : 32, color: brand, lineHeight: 1 }}>{dig(sc.spotsRemaining)}</span>
            <div>
              <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 13, color: brand, marginBottom: 4 }}>{L.sections.scarcity}</div>
              <div style={{ fontFamily: serif, fontSize: D ? 22 : 18, color: INK, lineHeight: 1.4, maxWidth: 480 }}>{L.ui.spotsLeftLine(sc.spotsRemaining)}</div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: D ? (rtl ? "flex-start" : "flex-end") : "center" }}>
            {sc.firstDepartureDate && <div style={{ fontFamily: sans, fontSize: 11.5, color: MUT }}>{L.ui.nextDeparture} · <strong style={{ color: brand }}>{dig(sc.firstDepartureDate)}</strong></div>}
            <div style={{ display: "flex", gap: 6 }}>
              {Array.from({ length: Math.min(total, 12) }).map((_, i) => <span key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: i < sc.spotsRemaining! ? brand : ptRgba(brand, 0.2) }} />)}
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
        <SecHead kicker={L.nav.highlights} title={ar("Three quiet luxuries", "ثلاث لحظات هانئة")} sub={ar("Designed for two, and only two.", "صُمّمت لاثنين، ولاثنين فقط.")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 22 : 16 }}>
          {items.map((h, i) => {
            const t = secItemStr(h, "title", "text", "label");
            const d = typeof h === "object" ? secItemStr(h, "desc", "description") : "";
            return (
              <Card key={i} style={{ padding: D ? 28 : 20 }}>
                <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 22, color: i % 3 === 1 ? SAGE : brand }}>{num(i)}</div>
                <div style={{ fontFamily: serif, fontSize: D ? 24 : 20, fontWeight: 500, color: INK, margin: "10px 0 8px", lineHeight: 1.2 }}>{t}</div>
                {d && <div style={{ fontFamily: sans, fontSize: 14, color: MUT, lineHeight: 1.7 }}>{d}</div>}
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
    const tiles = imgs.slice(0, D ? 3 : 2);
    const stops = mapImage ? [] : itinDays.slice(0, 5).map((d) => ({ label: secItemStr(d, "title") })).filter((s) => s.label);
    return (
      <Wrap pt={0} section="media">
        <SecHead kicker={L.sections.media} title={ar("A look at your days", "لمحة من أيامكما")} center />
        <PtVideo src={video} poster={cover || imgs[0]} accent={brand} radius={D ? "240px 240px 24px 24px" : "150px 150px 20px 20px"} rtl={rtl} sans={sans} height={D ? 440 : 300} ui={L.ui} />
        {tiles.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr 1fr" : "1fr 1fr", gap: D ? 16 : 10, marginTop: D ? 20 : 12 }}>
            {tiles.map((u, i) => <div key={i} style={{ position: "relative", height: D ? 240 : 170, ...arch(D ? 120 : 90) }}><img src={u} onClick={() => zoom(u)} style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }} /></div>)}
          </div>
        )}
        {(mapImage || stops.length > 0) && (
          <div style={{ marginTop: 22 }}>
            <div style={{ display: "flex", justifyContent: "center" }}><Script mb={10}>{L.ui.route}</Script></div>
            {mapImage
              ? <img src={mapImage} alt={mapCaption} style={{ width: "100%", height: D ? 220 : 170, objectFit: "cover", borderRadius: 20, display: "block" }} />
              : <PtRouteMap stops={stops} line={brand} ink={INK} height={D ? 220 : 170} rounded={20} rtl={rtl} />}
            {mapCaption && <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 13.5, color: FAINT, marginTop: 10, textAlign: "center" }}>{mapCaption}</div>}
          </div>
        )}
      </Wrap>
    );
  };

  // ════════ ITINERARY ════════
  const Itinerary = () => {
    if (!itinDays.length) return null;
    return (
      <Wrap style={{ background: PAPER }} section="itinerary">
        <SecHead kicker={L.sections.itinerary} title={ar(`${itinDays.length} unhurried days`, `${dig(itinDays.length)} أيام على مهل`)} center />
        <div style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
          <div style={{ position: "absolute", insetInlineStart: D ? 70 : 46, top: 8, bottom: 8, width: 1, background: RULE }} />
          {itinDays.map((it, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: D ? "92px 1fr" : "62px 1fr", gap: D ? 24 : 14, padding: "14px 0", alignItems: "start" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontFamily: sans, fontSize: 9.5, color: FAINT, letterSpacing: rtl ? 0 : "1px", textTransform: uc }}>{L.ui.day}</div>
                <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: D ? 34 : 26, color: brand, lineHeight: 1 }}>{dig((it.day as number) ?? i + 1)}</div>
              </div>
              <div style={{ paddingTop: 4 }}>
                <div style={{ fontFamily: serif, fontSize: D ? 22 : 18, fontWeight: 500, color: INK }}>{secItemStr(it, "title")}</div>
                {secItemStr(it, "desc", "description") && <div style={{ fontFamily: sans, fontSize: 13.5, color: MUT, lineHeight: 1.65, marginTop: 4 }}>{secItemStr(it, "desc", "description")}</div>}
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
    const img = mediaImgs[1] || mediaImgs[0] || cover;
    return (
      <Wrap section="hotel">
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1.1fr" : "1fr", gap: D ? 56 : 20, alignItems: "center" }}>
          {img && <div style={{ height: D ? 420 : 240, ...arch(220) }}><img src={img} onClick={() => zoom(img)} style={{ width: "100%", height: "100%", objectFit: "cover", cursor: "zoom-in" }} /></div>}
          <div>
            <Script mb={10}>{L.sections.hotel}</Script>
            <H2 size={D ? 38 : 26}>{name || ar("Your stay", "إقامتكما")}</H2>
            {stars > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "12px 0 16px" }}>
                <PtStars n={stars} size={D ? 17 : 15} color={brand} />
                <span style={{ fontFamily: sans, fontSize: 12, color: FAINT }}>{dig(stars)} {L.ui.stars}</span>
              </div>
            )}
            {blurb && <p style={{ fontFamily: sans, fontSize: D ? 15.5 : 14, color: MUT, lineHeight: 1.8, margin: stars > 0 ? 0 : "14px 0 0", whiteSpace: "pre-line" }}>{blurb}</p>}
            {features.length > 0 && <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}>{features.map((f, i) => <span key={i} style={{ fontFamily: sans, fontSize: 12.5, color: INK, background: ptRgba(SAGE, 0.16), borderRadius: 999, padding: "7px 14px" }}>{f}</span>)}</div>}
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
      <Wrap style={{ background: PAPER }} section="meals">
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1.2fr" : "1fr", gap: D ? 56 : 22 }}>
          <div>
            <Script mb={10}>{L.sections.meals}</Script>
            <H2 size={D ? 40 : 27}>{planLabel}</H2>
          </div>
          {notes && <p style={{ fontFamily: sans, fontSize: 14.5, color: MUT, lineHeight: 1.75, margin: 0, whiteSpace: "pre-line" }}>{notes}</p>}
        </div>
      </Wrap>
    );
  };

  // ════════ INCLUSIONS ════════
  const Mark = ({ on }: { on?: boolean }) => (
    <span style={{ width: 18, height: 18, borderRadius: "50%", background: on ? ptRgba(brand, 0.12) : "transparent", border: on ? "none" : `1px solid ${RULE}`, color: on ? brand : FAINT, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0, marginTop: 2 }}>{on ? "♥" : "·"}</span>
  );
  const Inclusions = () => {
    const inc = findSec(pkg, "inclusions");
    const includes = secStrArr(inc, "includes").length ? secStrArr(inc, "includes") : (pkg.includes ?? []);
    const excludes = secStrArr(inc, "excludes").length ? secStrArr(inc, "excludes") : (pkg.excludes ?? []);
    if (!includes.length && !excludes.length) return null;
    return (
      <Wrap section="inclusions">
        <SecHead kicker={L.sections.inclusions} title={ar("What's tended to", "ما رتّبناه لكما")} center />
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 56 : 24, maxWidth: 900, margin: "0 auto" }}>
          {includes.length > 0 && (
            <div>
              <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 16, color: brand, marginBottom: 12 }}>{L.ui.included}</div>
              {includes.map((it, i) => <div key={i} style={{ display: "flex", gap: 12, padding: "9px 0", alignItems: "flex-start" }}><Mark on /><span style={{ fontFamily: sans, fontSize: 14, color: INK, lineHeight: 1.5 }}>{it}</span></div>)}
            </div>
          )}
          {excludes.length > 0 && (
            <div>
              <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 16, color: FAINT, marginBottom: 12 }}>{L.ui.notIncluded}</div>
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
      <Wrap style={{ background: PAPER }} section="transfers">
        <SecHead kicker={L.sections.transfers} title={ar("Carried, gently", "تنقّل برفق")} sub={desc || undefined} center />
        {items.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 20 : 14 }}>
            {items.map((t, i) => (
              <Card key={i} style={{ textAlign: "center", padding: D ? 28 : 20, background: BG }}>
                <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 20, color: i % 3 === 1 ? SAGE : brand }}>{num(i)}</div>
                <div style={{ fontFamily: serif, fontSize: D ? 21 : 18, color: INK, margin: "8px 0 6px" }}>{secItemStr(t, "leg", "title", "name", "text")}</div>
                {typeof t === "object" && secItemStr(t, "desc", "description") && <div style={{ fontFamily: sans, fontSize: 13.5, color: MUT, lineHeight: 1.65 }}>{secItemStr(t, "desc", "description")}</div>}
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
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 56 : 24 }}>
          <div>
            <Script mb={10}>{L.sections.visa}</Script>
            <H2 size={D ? 36 : 25}>{VISA_LABELS[included]?.[lang] || ar("Visa & entry", "التأشيرة والدخول")}</H2>
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
    return (
      <Wrap style={{ background: PAPER }} id="pt-departures" section="departures">
        <SecHead kicker={L.sections.departures} title={ar("Where you'll fly from", "من أين ستنطلقان")} center />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 14, maxWidth: D ? "none" : 520, margin: "0 auto" }}>
          {rows.map((r, i) => {
            const spots = typeof r.spots === "number" ? r.spots : Number(r.spots) || 0;
            const sold = spots <= 0;
            const from = secItemStr(r, "origin", "from");
            const to = secItemStr(r, "arrivingAirport", "to");
            const date = secItemStr(r, "date");
            const price = secItemStr(r, "price");
            return (
              <div key={i} style={{ background: BG, border: `1px solid ${RULE}`, borderRadius: 22, padding: D ? 24 : 18, opacity: sold ? 0.55 : 1, textAlign: "center" }}>
                <div style={{ fontFamily: serif, fontSize: D ? 24 : 21, color: INK }}>{from || dig(date)}</div>
                {(to || date) && <div style={{ fontFamily: sans, fontSize: 12, color: MUT, marginTop: 4 }}>{to ? `→ ${to}` : ""}{to && date ? " · " : ""}{from || to ? dig(date) : ""}</div>}
                {price && <div style={{ fontFamily: serif, fontSize: D ? 30 : 26, color: brand, margin: "12px 0 6px" }}>{dig(price)}</div>}
                <div style={{ fontFamily: sans, fontSize: 12, fontWeight: 700, color: sold ? FAINT : SAGE }}>{sold ? L.ui.soldOut : `${dig(spots)} ${L.ui.left}`}</div>
              </div>
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
      <Wrap id="pt-pricing" section="pricing">
        <SecHead kicker={L.sections.pricing} title={ar("Choose your room", "اختارا غرفتكما")} center />
        {tiers.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? `repeat(${Math.min(tiers.length, 3)},1fr)` : "1fr", gap: 16, maxWidth: D ? "none" : 520, margin: "0 auto" }}>
            {tiers.map((t, i) => {
              const featured = tiers.length === 3 && i === 1;
              return (
                <div key={i} style={{ borderRadius: 24, padding: D ? 30 : 22, position: "relative", textAlign: "center", background: featured ? brand : PAPER, color: featured ? onBrand : INK, border: featured ? "none" : `1px solid ${RULE}`, boxShadow: featured ? `0 18px 40px ${ptRgba(brand, 0.3)}` : "none" }}>
                  {featured && <div style={{ position: "absolute", top: 16, insetInline: 0, display: "flex", justifyContent: "center" }}><span style={{ fontFamily: serif, fontStyle: "italic", fontSize: 13, color: "#fff", background: "rgba(255,255,255,0.2)", borderRadius: 999, padding: "3px 14px" }}>{L.ui.mostPopular}</span></div>}
                  <div style={{ fontFamily: sans, fontSize: 13, opacity: 0.8, marginTop: featured ? 28 : 0 }}>{localizeTierLabel(t.label, lang)}</div>
                  <div style={{ fontFamily: serif, fontSize: D ? 46 : 38, fontWeight: 500, lineHeight: 1, margin: "10px 0 8px" }}>{dig(t.price)}</div>
                  {pkg.whatsapp && <div style={{ marginTop: 18 }}><CTA full bg={featured ? "#fff" : brand} col={featured ? brand : undefined} onClick={onWhatsApp}>{L.ui.book}</CTA></div>}
                </div>
              );
            })}
          </div>
        )}
        {(cancellation.length > 0 || schedule.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 40 : 24, maxWidth: 900, margin: tiers.length ? "36px auto 0" : "0 auto" }}>
            {cancellation.length > 0 && (
              <div>
                <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 16, color: brand, marginBottom: 12 }}>{L.ui.cancellation}</div>
                {cancellation.map((s, i) => <div key={i} style={{ fontFamily: sans, fontSize: 13.5, color: MUT, padding: "6px 0", lineHeight: 1.5 }}>· {s}</div>)}
              </div>
            )}
            {schedule.length > 0 && (
              <div>
                <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 16, color: brand, marginBottom: 12 }}>{L.ui.paymentSchedule}</div>
                {schedule.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderTop: i ? `1px solid ${RULE}` : "none" }}>
                    <span style={{ fontFamily: sans, fontSize: 13.5, color: INK }}>{secItemStr(s, "dueDate", "label")}</span>
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
      <Wrap style={{ background: PAPER }} section="extras">
        <SecHead kicker={L.sections.extras} title={ar("A few tender touches", "لمسات حانية")} center />
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {items.map((e, i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16, padding: D ? "20px 0" : "16px 0", borderTop: `1px solid ${RULE}` }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: serif, fontSize: D ? 22 : 18, color: INK }}>{secItemStr(e, "name", "title")}</div>
                {secItemStr(e, "description", "desc") && <div style={{ fontFamily: sans, fontSize: 13, color: MUT, marginTop: 4, lineHeight: 1.5 }}>{secItemStr(e, "description", "desc")}</div>}
              </div>
              {secItemStr(e, "price") && <div style={{ fontFamily: serif, fontSize: D ? 22 : 18, color: brand, whiteSpace: "nowrap" }}>{dig(secItemStr(e, "price"))}</div>}
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
        <div style={{ display: "grid", gridTemplateColumns: D ? "auto 1fr" : "1fr", gap: D ? 48 : 20, alignItems: "center", maxWidth: 900, margin: "0 auto" }}>
          <div style={{ width: D ? 200 : 130, height: D ? 250 : 170, margin: D ? 0 : "0 auto", ...arch(120) }}>
            {person.photo
              ? <img src={person.photo} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", height: "100%", background: ptRgba(brand, 0.12), color: brand, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 64 }}>{person.name[0]}</div>}
          </div>
          <div style={{ textAlign: D ? "start" : "center" }}>
            <Script mb={8}>{L.sections.people}</Script>
            <div style={{ fontFamily: serif, fontSize: D ? 34 : 26, color: INK }}>{person.name}</div>
            {role && <div style={{ fontFamily: sans, fontSize: 12.5, color: brand, fontWeight: 700, marginTop: 4 }}>{role}</div>}
            {bio && <p style={{ fontFamily: sans, fontSize: 14, color: MUT, lineHeight: 1.75, marginTop: 14 }}>{bio}</p>}
            {pkg.whatsapp && <div style={{ marginTop: 18 }}><CTA onClick={onWhatsApp}>{L.ui.enquire}</CTA></div>}
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
      <Wrap style={{ background: PAPER }} id="pt-reviews" section="reviews">
        <SecHead kicker={L.sections.reviews} title={ar("Loved, in their words", "بكلماتهم هم")} center />
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <span style={{ fontFamily: serif, fontSize: D ? 44 : 34, color: brand }}>{dig(rating)}</span>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}><PtStars n={Math.round(rating)} size={15} color={brand} /></div>
          <div style={{ fontFamily: sans, fontSize: 11.5, color: FAINT, marginTop: 6 }}>{L.ui.basedOn} {dig(count)} {L.ui.review}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 16 }}>
          {items.slice(0, 3).map((r, i) => (
            <Card key={i} style={{ background: BG, padding: D ? 26 : 20 }}>
              <PtStars n={Math.round(r.rating || 5)} size={13} color={brand} />
              <p style={{ fontFamily: serif, fontStyle: "italic", fontSize: D ? 19 : 17, color: INK, lineHeight: 1.55, margin: "12px 0 16px" }}>&ldquo;{r.text}&rdquo;</p>
              <div style={{ fontFamily: serif, fontSize: 15, color: brand }}>{r.name}</div>
            </Card>
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
        <div style={{ display: "grid", gridTemplateColumns: D && image ? "1fr 1fr" : "1fr", gap: D ? 56 : 24, alignItems: "center" }}>
          <div>
            <Script mb={10}>{L.sections.agency}</Script>
            <H2 size={D ? 42 : 28}>{agency.name}</H2>
            {agency.tagline && <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 17, color: SAGE, marginTop: 8 }}>{agency.tagline}</div>}
            {story && <p style={{ fontFamily: sans, fontSize: 14.5, color: MUT, lineHeight: 1.8, marginTop: 16, whiteSpace: "pre-line" }}>{story}</p>}
          </div>
          {image && <div style={{ height: D ? 360 : 220, ...arch(200) }}><img src={image} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>}
        </div>
      </Wrap>
    );
  };

  // ════════ NOTES ════════
  const Notes = () => {
    const items = secMixed(findSec(pkg, "important_notes"), "items");
    if (!items.length) return null;
    return (
      <Wrap style={{ background: PAPER }} section="important_notes">
        <SecHead kicker={L.sections.notes} title={ar("Good to know", "معلومات تهمّكما")} center />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 16 }}>
          {items.map((n, i) => {
            const t = secItemStr(n, "title");
            const body = secItemStr(n, "text", "desc", "description") || (typeof n === "string" ? n : "");
            return (
              <Card key={i} style={{ background: BG }}>
                {t && <div style={{ fontFamily: serif, fontSize: D ? 20 : 17, color: INK, marginBottom: 6 }}>{t}</div>}
                <div style={{ fontFamily: sans, fontSize: 13.5, color: MUT, lineHeight: 1.65 }}>{body}</div>
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
        <SecHead kicker={L.sections.faq} title={ar("Questions, answered", "إجابات على أسئلتكما")} center />
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {items.map((f, i) => (
            <div key={i} style={{ padding: D ? "22px 0" : "18px 0", borderTop: `1px solid ${RULE}`, borderBottom: i === items.length - 1 ? `1px solid ${RULE}` : "none" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "baseline" }}>
                <div style={{ fontFamily: serif, fontSize: D ? 23 : 19, color: INK }}>{secItemStr(f, "question", "q")}</div>
                <span style={{ fontFamily: serif, fontSize: 22, color: brand }}>♥</span>
              </div>
              {secItemStr(f, "answer", "a") && <p style={{ fontFamily: sans, fontSize: 14, color: MUT, lineHeight: 1.7, margin: "10px 0 0" }}>{secItemStr(f, "answer", "a")}</p>}
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
    const image = secStr(cs, "image") || cover;
    if (!heading && !body) return null;
    return (
      <Wrap section="custom">
        <div style={{ background: ptRgba(brand, 0.06), borderRadius: 28, overflow: "hidden", display: "grid", gridTemplateColumns: D && image ? "1.2fr 1fr" : "1fr" }}>
          <div style={{ padding: D ? "56px 56px" : "30px 24px" }}>
            <Script mb={14}>{L.sections.custom}</Script>
            {heading && <div style={{ fontFamily: serif, fontSize: D ? 40 : 27, fontWeight: 500, fontStyle: "italic", lineHeight: 1.12, color: INK, marginBottom: 16 }}>{heading}</div>}
            {body && <p style={{ fontFamily: sans, fontSize: D ? 15.5 : 14, color: MUT, lineHeight: 1.8, margin: 0, whiteSpace: "pre-line" }}>{body}</p>}
          </div>
          {image && <div style={{ position: "relative", minHeight: D ? 360 : 220 }}><img src={image} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /></div>}
        </div>
      </Wrap>
    );
  };

  // ════════ OTHERS ════════
  const Others = () => {
    const list = secArr(findSec(pkg, "other_packages"), "packages");
    if (!list.length) return null;
    return (
      <Wrap style={{ background: PAPER }} section="other_packages">
        <SecHead kicker={L.sections.others} title={ar("More journeys for two", "رحلات أخرى لاثنين")} center />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: 18 }}>
          {list.map((o, i) => {
            const oTitle = secItemStr(o, "title");
            const place = secItemStr(o, "destination", "place");
            const price = secItemStr(o, "price");
            const oNights = secItemStr(o, "nights");
            const img = secItemStr(o, "image");
            const link = secItemStr(o, "link");
            const Inner = (
              <div style={{ background: BG, border: `1px solid ${RULE}`, borderRadius: 22, overflow: "hidden", height: "100%" }}>
                <div style={{ height: 170, position: "relative", background: PAPER }}>{img && <img src={img} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}</div>
                <div style={{ padding: 18, textAlign: "center" }}>
                  {place && <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 12.5, color: SAGE }}>{place}</div>}
                  <div style={{ fontFamily: serif, fontSize: 21, color: INK, margin: "6px 0 12px", lineHeight: 1.2 }}>{oTitle}</div>
                  <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: 8 }}>
                    {price && <span style={{ fontFamily: serif, fontSize: 20, color: brand }}>{dig(price)}</span>}
                    {oNights && <span style={{ fontFamily: sans, fontSize: 12, color: FAINT }}>· {dig(oNights)} {L.ui.nights}</span>}
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
      <section style={{ padding: `${D ? 72 : 44}px ${px}px`, background: brand, color: onBrand, textAlign: "center" }}>
        <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: D ? 52 : 32, fontWeight: 500, lineHeight: 1.1 }}>{L.ui.shallWeBegin}</div>
        <div style={{ fontFamily: sans, fontSize: 14, opacity: 0.85, margin: "12px 0 24px" }}>{L.ui.replyTime}{pkg.whatsapp ? ` · ${dig(pkg.whatsapp)}` : ""}</div>
        <div style={{ display: "inline-flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {pkg.whatsapp && <CTA big bg="#fff" col={brand} onClick={onWhatsApp}>{L.ui.bookWhatsapp}</CTA>}
          {pkg.messenger && onMessenger && <button onClick={onMessenger} style={{ fontFamily: sans, background: "rgba(255,255,255,0.18)", color: onBrand, border: "1px solid rgba(255,255,255,0.3)", borderRadius: 999, padding: "15px 26px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}>{L.ui.messenger}</button>}
        </div>
      </section>
      <div style={{ padding: `22px ${px}px`, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${RULE}` }}>
        <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: 18, color: INK }}>{agency.name}</div>
        <div style={{ fontFamily: sans, fontSize: 10, color: FAINT, letterSpacing: rtl ? 0 : "1px", textTransform: uc }}>{L.ui.poweredBy}</div>
      </div>
    </div>
  );

  // ════════ BAR ════════
  const initials = (agency.name || "P").split(" ").map((w) => w[0]).slice(0, 2).join("");
  const Bar = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${px}px`, height: D ? 60 : 52, borderBottom: `1px solid ${RULE}`, background: "rgba(253,249,245,0.9)", backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 30 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: D ? 30 : 26, height: D ? 30 : 26, borderRadius: "50%", background: brand, color: onBrand, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: serif, fontSize: 13, fontWeight: 600 }}>{initials}</div>
        <div style={{ fontFamily: serif, fontStyle: "italic", fontSize: D ? 19 : 16, color: INK }}>{agency.name}</div>
      </div>
      {D ? (
        <div style={{ display: "flex", alignItems: "center", gap: 26 }}>
          {navItems.map(([key, label]) => (
            <button key={key} onClick={() => goTo(key)} style={{ fontFamily: sans, fontSize: 13, color: MUT, background: "none", border: "none", cursor: "pointer", padding: 0 }}>{label}</button>
          ))}
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
export function TemplatePetalCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
