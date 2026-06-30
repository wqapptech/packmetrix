"use client";

// ═══════════════════════════════════════════════════════════════════════════
// TRIBE V2 — Small-group cultural journeys · a warm communal travel zine.
// Sand-paper canvas, clay-brown ink, terracotta brand. Bricolage Grotesque
// display, Hanken Grotesk labels, Newsreader italic for the host's voice.
// Postcard photo frames, dashed "postage-stamp" badges, perforated ticket-stub
// departures, big number markers, dark clay panels for mood. Brand colour
// themes every accent, stamp & CTA. One component, all 4 surfaces.
// Wired to real pkg.sections data with graceful empty states.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useState } from "react";
import { useIsDesktop, BaseCard, LightboxCarousel } from "./shared";
import { localizeTierLabel } from "@/lib/translations";
import type { TPageProps, TCardProps, TPackage } from "./types";

type SecData = Record<string, unknown>;

// ─── Brand colour math ────────────────────────────────────────────────────────
function tbHex(h: string): [number, number, number] {
  h = h.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function tbRgba(hex: string, a: number): string { const [r, g, b] = tbHex(hex); return `rgba(${r},${g},${b},${a})`; }
function tbMix(hex: string, target: string, t: number): string {
  const a = tbHex(hex), b = tbHex(target);
  const m = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}
function tbLighten(hex: string, t: number) { return tbMix(hex, "#ffffff", t); }
function tbLum(hex: string) { const [r, g, b] = tbHex(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
function tbOn(hex: string) { return tbLum(hex) > 0.6 ? "#2a211a" : "#ffffff"; }

const URGENT = "#b8442c";

// ─── i18n ─────────────────────────────────────────────────────────────────────
const L_EN = {
  sections: {
    highlights: "Why you'll love it", media: "Postcards from the road", itinerary: "Day by day",
    hotel: "Where you'll stay", meals: "What you'll eat", inclusions: "What's in the bag",
    transfers: "Getting around", visa: "Visa & entry", departures: "Departures",
    pricing: "Choose your room", extras: "Make it yours", scarcity: "Before it's gone",
    people: "Meet your host", reviews: "They came strangers, left friends", agency: "About the agency",
    notes: "Good to know", faq: "Questions, answered", custom: "A note from us", others: "More tribes forming",
  },
  nav: { highlights: "Highlights", itinerary: "Itinerary", hotel: "Stay", inclusions: "Included", departures: "Dates", pricing: "Pricing", reviews: "Reviews", faq: "FAQ" },
  ui: {
    from: "From", perPerson: "per person", night: "night", nights: "nights", included: "Included",
    notIncluded: "Not included", mostPopular: "Most loved", soldOut: "Sold out", left: "left",
    seatsLeft: "spots left", book: "Book", reserve: "Reserve", join: "Join the trip",
    bookWhatsapp: "Book on WhatsApp", messenger: "Messenger", message: "Message us", nextDeparture: "Next departure",
    date: "Date", flight: "Flight", price: "Price", to: "To", day: "Day",
    cancellation: "Cancellation policy", paymentSchedule: "Payment schedule", basedOn: "based on", review: "reviews",
    route: "Route", stops: "stops", years: "years hosting", trips: "trips led", replyTime: "Usually replies within an hour",
    watch: "Watch the film", noVideo: "Video coming soon", play: "Play", pause: "Pause", mute: "Mute",
    unmute: "Unmute", poweredBy: "Powered by PackMetrix", closer: "Come alone. Leave with a tribe.",
    spotsLine: (n: number) => `${n} ${n === 1 ? "spot" : "spots"} left on this departure.`,
    scarcityWindow: "Small groups mean places go quickly. Reach out and we'll hold one while you decide.",
    saveSpot: "Save my spot", stamp: "Field dispatch",
  },
};
const L_AR: typeof L_EN = {
  sections: {
    highlights: "لماذا ستحبّها", media: "بطاقات من الطريق", itinerary: "يومًا بيوم",
    hotel: "مكان إقامتك", meals: "ما ستتناوله", inclusions: "ما يشمله البرنامج",
    transfers: "التنقّلات", visa: "التأشيرة والدخول", departures: "مواعيد المغادرة",
    pricing: "اختر غرفتك", extras: "أضِف لمستك", scarcity: "قبل أن تنفد",
    people: "تعرّف على مضيفك", reviews: "جاؤوا غرباء، وغادروا أصدقاء", agency: "عن الوكالة",
    notes: "معلومات تهمّك", faq: "إجابات على أسئلتك", custom: "كلمة منّا", others: "رحلات أخرى تنطلق قريبًا",
  },
  nav: { highlights: "المميزات", itinerary: "البرنامج", hotel: "الإقامة", inclusions: "المشمول", departures: "المواعيد", pricing: "الأسعار", reviews: "التقييمات", faq: "الأسئلة" },
  ui: {
    from: "من", perPerson: "للفرد", night: "ليلة", nights: "ليالٍ", included: "مشمول",
    notIncluded: "غير مشمول", mostPopular: "الأكثر حبًّا", soldOut: "نفدت", left: "متبقّية",
    seatsLeft: "أماكن متبقّية", book: "احجز", reserve: "احجز", join: "انضمّ للرحلة",
    bookWhatsapp: "احجز عبر واتساب", messenger: "ماسنجر", message: "راسلنا", nextDeparture: "أقرب موعد",
    date: "التاريخ", flight: "الرحلة", price: "السعر", to: "إلى", day: "اليوم",
    cancellation: "سياسة الإلغاء", paymentSchedule: "جدول الدفع", basedOn: "من", review: "تقييم",
    route: "المسار", stops: "محطات", years: "سنوات استضافة", trips: "رحلةً قادها", replyTime: "نردّ عادةً خلال ساعة",
    watch: "شاهد الفيديو", noVideo: "الفيديو قريبًا", play: "تشغيل", pause: "إيقاف", mute: "كتم",
    unmute: "تشغيل الصوت", poweredBy: "مُشغّل بواسطة باكمتريكس", closer: "تعال وحدك، وعُد برفقة العمر.",
    spotsLine: (n: number) => `بقي ${n} ${n === 1 ? "مكان" : "أماكن"} في هذا الموعد.`,
    scarcityWindow: "المجموعات صغيرة، فالأماكن تنفد بسرعة. تواصل معنا ونحتفظ لك بمكان ريثما تقرّر.",
    saveSpot: "احجز مقعدي", stamp: "نشرة ميدانية",
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
  agent: { en: "Your host", ar: "مضيفك" }, curator: { en: "Trip curator", ar: "مصمّم الرحلة" },
  trip_lead: { en: "Trip leader", ar: "قائد الرحلة" }, trip_designer: { en: "Trip designer", ar: "مصمّم الرحلة" },
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
function TbStars({ n = 5, of = 5, size = 14, color }: { n?: number; of?: number; size?: number; color: string }) {
  const star = (fill: string) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} style={{ display: "block" }}><path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 18.6 5.9 20.8l1.2-6.6L2.3 9.6l6.6-.9z" /></svg>
  );
  return <span style={{ display: "inline-flex", gap: 2 }}>{Array.from({ length: of }).map((_, i) => <span key={i}>{star(i < n ? color : tbRgba(color, 0.25))}</span>)}</span>;
}

// ─── Abstract route map ───────────────────────────────────────────────────────
function TbRouteMap({ stops, line, land, ink = "#2a211a", height = 220, rtl = false }: { stops: { label: string }[]; line: string; land: string; ink?: string; height?: number; rtl?: boolean }) {
  const W = 1000, H = 420;
  const pts = stops.map((s, i) => {
    const x = stops.length === 1 ? W / 2 : 120 + (i * (W - 240)) / (stops.length - 1);
    const y = 150 + Math.sin(i * 1.3 + 0.6) * 70 + (i % 2 ? 20 : -10);
    return { ...s, x: rtl ? W - x : x, y };
  });
  const path = pts.map((p, i) => { if (i === 0) return `M ${p.x} ${p.y}`; const prev = pts[i - 1]; const mx = (prev.x + p.x) / 2; return `Q ${mx} ${prev.y - 40} ${p.x} ${p.y}`; }).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height, display: "block", borderRadius: 12, background: tbLighten(land, 0.4) }} preserveAspectRatio="xMidYMid slice">
      <g fill={land} opacity="0.7"><path d="M-40 300 Q 180 250 360 300 T 760 290 Q 920 270 1060 320 L1060 460 L-40 460 Z" /><ellipse cx="220" cy="120" rx="190" ry="90" opacity="0.6" /><ellipse cx="780" cy="100" rx="160" ry="80" opacity="0.6" /></g>
      <path d={path} fill="none" stroke={line} strokeWidth="3.5" strokeDasharray="2 12" strokeLinecap="round" opacity="0.9" />
      {pts.map((p, i) => <g key={i}><circle cx={p.x} cy={p.y} r="10" fill="#fff" stroke={line} strokeWidth="3" /><circle cx={p.x} cy={p.y} r="3.5" fill={line} /><text x={p.x} y={p.y - 22} textAnchor="middle" fill={ink} fontSize="22" fontWeight="700" fontFamily="inherit">{p.label}</text></g>)}
    </svg>
  );
}

// ─── Video player ─────────────────────────────────────────────────────────────
function TbVideo({ src, poster, accent, onAccent, rtl = false, sans, height = 320, ui }: { src?: string; poster?: string; accent: string; onAccent: string; rtl?: boolean; sans: string; height?: number; ui: typeof L_EN["ui"] }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const ctrl: React.CSSProperties = { width: 38, height: 38, borderRadius: 100, border: "none", cursor: "pointer", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 };
  if (!src) {
    return (
      <div style={{ position: "relative", borderRadius: 14, overflow: "hidden", height, background: "#271e16" }}>
        {poster && <img src={poster} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "grayscale(0.2) brightness(0.55)" }} />}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#fff" }}>
          <div style={{ width: 56, height: 56, borderRadius: 100, border: "1.5px solid rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
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
    <div onClick={toggle} style={{ position: "relative", borderRadius: 14, overflow: "hidden", height, background: "#000", cursor: "pointer" }}>
      <video ref={ref} src={src} poster={poster} muted loop playsInline preload="metadata" onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
      {!playing && (
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, background: "linear-gradient(rgba(0,0,0,0.05),rgba(0,0,0,0.4))" }}>
          <div style={{ width: 70, height: 70, borderRadius: 100, background: accent, color: onAccent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(0,0,0,0.45)" }}>
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
export function TemplateTribePage({ pkg, agency, onWhatsApp, onMessenger, lang = "en" }: TPageProps) {
  const D = useIsDesktop();
  const rtl = lang === "ar";
  const L = rtl ? L_AR : L_EN;
  const brand = agency.brandColor || "#b85c38";
  const onBrand = tbOn(brand);
  const brLight = tbLighten(brand, 0.5);

  const PAPER = "#ece2d2", CARD = "#f7f0e2", CARD2 = "#fbf6ec", INK = "#2a211a", DARK = "#271e16";
  const MUT = "rgba(42,33,26,0.66)", FAINT = "rgba(42,33,26,0.46)", RULE = "rgba(42,33,26,0.16)";
  const disp = rtl ? "var(--font-cairo), 'Cairo', sans-serif" : "var(--font-bricolage), 'Bricolage Grotesque', sans-serif";
  const label = rtl ? "var(--font-tajawal), 'Tajawal', sans-serif" : "var(--font-hanken), 'Hanken Grotesk', sans-serif";
  const body = label;
  const quote = rtl ? "var(--font-markazi), 'Markazi Text', serif" : "var(--font-newsreader), 'Newsreader', serif";
  const px = D ? 72 : 22;
  const ar = (en: string, a: string) => (rtl ? a : en);
  const dig = (s: string | number) => (rtl ? String(s).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]) : String(s));
  const up: React.CSSProperties["textTransform"] = rtl ? "none" : "uppercase";
  const lift = "0 14px 36px rgba(42,33,26,0.16)";

  const title = pkg.title || pkg.destination || "";
  const nightsN = pkg.nights ? Number(pkg.nights) : null;
  const cover = pkg.coverImage || pkg.images?.[0] || secStrArr(findSec(pkg, "media"), "images")[0] || "";
  const mediaImgs = secStrArr(findSec(pkg, "media"), "images");
  const itinDays = secArr(findSec(pkg, "itinerary"), "days").filter((d) => secItemStr(d, "title"));
  const depEntries = secArr(findSec(pkg, "departures"), "entries");
  const person = pkg.people?.find((p) => p.role === "agent" || p.role === "curator" || p.role === "trip_lead")
    ?? pkg.people?.[0] ?? (pkg.agent ? { name: pkg.agent.name, role: pkg.agent.role || "agent", photo: pkg.agent.avatar, years: pkg.agent.years } : undefined);
  const hasDepart = depEntries.length > 0 || (pkg.departures?.length ?? 0) > 0;

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

  // hero stats from real facts
  const heroStats: { k: string; v: string }[] = [
    nightsN ? { k: ar("Duration", "المدة"), v: `${dig(nightsN)} ${L.ui.nights}` } : null,
    itinDays.length ? { k: ar("Days", "الأيام"), v: dig(itinDays.length) } : null,
    pkg.scarcity?.totalSpots ? { k: ar("Group size", "حجم المجموعة"), v: dig(pkg.scarcity.totalSpots) } : null,
    pkg.rating != null ? { k: ar("Rated", "التقييم"), v: dig(pkg.rating) } : null,
  ].filter(Boolean).slice(0, 4) as { k: string; v: string }[];

  // ---- atoms ----
  const Label = ({ children, color = FAINT, size }: { children: React.ReactNode; color?: string; size?: number }) => (
    <span style={{ fontFamily: label, fontSize: size || (D ? 12 : 11), fontWeight: 700, letterSpacing: rtl ? 0 : "1.6px", textTransform: up, color }}>{children}</span>
  );
  const Stamp = ({ children, dark }: { children: React.ReactNode; dark?: boolean }) => (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: label, fontSize: D ? 11.5 : 10.5, fontWeight: 800, letterSpacing: rtl ? 0 : "1.4px", textTransform: up, color: dark ? "#fff" : brand, border: `1.5px dashed ${dark ? "rgba(255,255,255,0.5)" : brand}`, borderRadius: 7, padding: "6px 11px", background: dark ? "rgba(255,255,255,0.06)" : tbRgba(brand, 0.07) }}>{children}</span>
  );
  const Primary = ({ children, full, big, ghost, onDark, onClick }: { children: React.ReactNode; full?: boolean; big?: boolean; ghost?: boolean; onDark?: boolean; onClick?: () => void }) => (
    <button data-testid="wa-cta" onClick={onClick} style={{ fontFamily: disp, background: ghost ? "transparent" : brand, color: ghost ? (onDark ? "#fff" : brand) : onBrand, border: ghost ? `1.5px solid ${onDark ? "rgba(255,255,255,0.6)" : brand}` : "none", borderRadius: 100, padding: big ? "15px 30px" : "11px 22px", fontSize: D ? 14.5 : 13.5, fontWeight: 700, letterSpacing: rtl ? 0 : "0.2px", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, width: full ? "100%" : "auto" }}>
      {!ghost && <WAIcon s={15} fill={onBrand} />} {children}
    </button>
  );
  const H2 = ({ children, size, light }: { children: React.ReactNode; size?: number; light?: boolean }) => (
    <h2 style={{ fontFamily: disp, fontSize: size || (D ? 44 : 30), fontWeight: 700, lineHeight: 1.04, letterSpacing: rtl ? 0 : "-0.8px", color: light ? "#fff" : INK, margin: 0 }}>{children}</h2>
  );
  const Wrap = ({ children, pt, pb, style, id, section }: { children: React.ReactNode; pt?: number; pb?: number; style?: React.CSSProperties; id?: string; section?: string }) => (
    <section id={id} data-pmx-section={section} style={{ scrollMarginTop: D ? 60 : 54, padding: `${pt != null ? pt : (D ? 80 : 46)}px ${px}px ${pb != null ? pb : (D ? 80 : 46)}px`, ...style }}>{children}</section>
  );
  const SecHead = ({ idx, kicker, title: t, sub, light }: { idx: string; kicker: string; title: string; sub?: string; light?: boolean }) => (
    <div style={{ marginBottom: D ? 38 : 26 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <span style={{ fontFamily: disp, fontSize: D ? 14 : 13, fontWeight: 700, color: brand }}>{ar("№", "رقم")} {idx}</span>
        <Label color={light ? "rgba(255,255,255,0.7)" : brand}>{kicker}</Label>
        <span style={{ flex: 1, height: 0, borderTop: `1.5px dashed ${light ? "rgba(255,255,255,0.25)" : RULE}` }} />
      </div>
      <H2 light={light}>{t}</H2>
      {sub && <p style={{ fontFamily: body, fontSize: D ? 17 : 15, color: light ? "rgba(255,255,255,0.75)" : MUT, lineHeight: 1.65, margin: `${D ? 14 : 10}px 0 0`, maxWidth: 600 }}>{sub}</p>}
    </div>
  );
  // postcard photo frame
  const Postcard = ({ src, h, caption, rotate = 0, tag, onClick }: { src: string; h: number; caption?: string; rotate?: number; tag?: string; onClick?: () => void }) => (
    <div style={{ background: "#fff", padding: 8, paddingBottom: caption ? 6 : 8, borderRadius: 4, boxShadow: lift, transform: `rotate(${rtl ? -rotate : rotate}deg)` }}>
      <div style={{ position: "relative", borderRadius: 2, overflow: "hidden" }}>
        <img src={src} alt="" onClick={onClick} style={{ width: "100%", height: h, objectFit: "cover", display: "block", cursor: onClick ? "zoom-in" : "default" }} />
        {tag && <span style={{ position: "absolute", insetInlineStart: 10, top: 10, background: brand, color: onBrand, fontFamily: label, fontSize: 10.5, fontWeight: 800, letterSpacing: rtl ? 0 : "1px", textTransform: up, padding: "4px 9px", borderRadius: 5 }}>{tag}</span>}
      </div>
      {caption && <div style={{ fontFamily: quote, fontStyle: "italic", fontSize: D ? 14 : 12.5, color: MUT, padding: "8px 4px 2px", lineHeight: 1.4 }}>{caption}</div>}
    </div>
  );

  // ════════ HERO ════════
  const Hero = () => (
    <div data-pmx-section="hero" style={{ position: "relative", background: DARK }}>
      <div style={{ position: "relative", minHeight: D ? 600 : 540, overflow: "hidden" }}>
        {cover && <img src={cover} alt="" onClick={() => zoom(cover)} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.62, cursor: "zoom-in" }} />}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(to bottom, rgba(39,30,22,0.45), rgba(39,30,22,0.25) 40%, rgba(39,30,22,0.92))" }} />
        <div style={{ position: "absolute", insetInline: px, top: D ? 26 : 18, display: "flex", justifyContent: "space-between", alignItems: "center", pointerEvents: "none" }}>
          <Stamp dark>{L.ui.stamp}</Stamp>
          {pkg.destination && <Label color="rgba(255,255,255,0.8)"><span data-pmx-field="destination">{pkg.destination}</span></Label>}
        </div>
        <div style={{ position: "absolute", insetInline: px, bottom: D ? 40 : 26, color: "#fff", pointerEvents: "none" }}>
          {pkg.destination && <div style={{ marginBottom: 16 }}><Label color={brLight} size={D ? 13 : 12}>● {pkg.destination}</Label></div>}
          <h1 style={{ fontFamily: disp, fontSize: D ? 76 : 44, fontWeight: 700, lineHeight: 0.98, letterSpacing: rtl ? 0 : "-2px", margin: 0 }} data-pmx-field="title">{title}</h1>
          {pkg.description && <p style={{ fontFamily: body, fontSize: D ? 18 : 15, color: "rgba(255,255,255,0.84)", lineHeight: 1.65, margin: "20px 0 0", maxWidth: 600 }}>{pkg.description}</p>}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: D ? `repeat(${heroStats.length},1fr) auto` : "repeat(2,1fr)", borderTop: `1px solid rgba(255,255,255,0.12)` }}>
        {heroStats.map((s, i) => (
          <div key={i} style={{ padding: D ? "22px 26px" : "16px 20px", borderInlineEnd: `1px solid rgba(255,255,255,0.12)`, borderBottom: (!D && i < 2) ? `1px solid rgba(255,255,255,0.12)` : "none" }}>
            <Label color="rgba(255,255,255,0.5)">{s.k}</Label>
            <div style={{ fontFamily: disp, fontSize: D ? 27 : 22, fontWeight: 700, color: "#fff", marginTop: 6, letterSpacing: rtl ? 0 : "-0.5px" }}>{s.v}</div>
          </div>
        ))}
        <div style={{ padding: D ? "20px 26px" : "18px 20px", display: "flex", alignItems: "center", gridColumn: D ? "auto" : "1 / -1", background: brand }}>
          <div style={{ width: "100%" }}>
            <Label color={tbRgba(onBrand, 0.7)}>{L.ui.from}</Label>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, marginTop: 6 }}>
              <span style={{ fontFamily: disp, fontSize: D ? 28 : 23, fontWeight: 700, color: onBrand }} data-pmx-field="price">{dig(pkg.price || "")}</span>
              {pkg.whatsapp && <Primary onClick={onWhatsApp}>{L.ui.join}</Primary>}
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
        <SecHead idx="01" kicker={L.nav.highlights} title={ar("Why this trip pulls people in", "ما الذي يجذب الناس إلى هذه الرحلة")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(2,1fr)" : "1fr", gap: D ? 16 : 12 }}>
          {items.map((h, i) => {
            const t = secItemStr(h, "title", "text", "label");
            const d = typeof h === "object" ? secItemStr(h, "desc", "description") : "";
            return (
              <div key={i} style={{ display: "flex", gap: 18, padding: D ? "26px 28px" : "20px 20px", background: i % 2 ? CARD2 : CARD, border: `1px solid ${RULE}`, borderRadius: 14, alignItems: "flex-start" }}>
                <span style={{ fontFamily: disp, fontSize: D ? 19 : 17, fontWeight: 700, color: onBrand, background: brand, width: D ? 44 : 38, height: D ? 44 : 38, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{dig(i + 1)}</span>
                <div>
                  <div style={{ fontFamily: disp, fontSize: D ? 22 : 19, fontWeight: 700, color: INK, letterSpacing: rtl ? 0 : "-0.4px", marginBottom: d ? 7 : 0 }}>{t}</div>
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
    const rot = [-1.4, 1, -0.8];
    return (
      <Wrap style={{ background: CARD }} section="media">
        <SecHead idx="02" kicker={L.sections.media} title={ar("Postcards from the road", "بطاقات من الطريق")} />
        {video && <TbVideo src={video} poster={cover || imgs[0]} accent={brand} onAccent={onBrand} rtl={rtl} sans={body} height={D ? 440 : 250} ui={L.ui} />}
        {tiles.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr 1fr", gap: D ? 22 : 14, marginTop: video ? (D ? 30 : 20) : 0 }}>
            {tiles.map((u, k) => <Postcard key={k} src={u} h={D ? 170 : 130} rotate={rot[k]} onClick={() => zoom(u)} />)}
          </div>
        )}
        {(mapImage || stops.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: D && imgs[3] ? "1fr 1fr" : "1fr", gap: D ? 24 : 16, marginTop: D ? 30 : 20, alignItems: "stretch" }}>
            <div style={{ border: `1px solid ${RULE}`, borderRadius: 14, background: CARD2, padding: D ? 18 : 14 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                <Label color={brand}>{L.ui.route}</Label>
                {(stops.length > 0 || itinDays.length > 0) && <Label>{dig(stops.length || itinDays.length)} {L.ui.stops}{nightsN ? ` · ${dig(nightsN)} ${L.ui.nights}` : ""}</Label>}
              </div>
              {mapImage
                ? <img src={mapImage} alt={mapCaption} style={{ width: "100%", height: D ? 210 : 160, objectFit: "cover", borderRadius: 10, display: "block" }} />
                : <TbRouteMap stops={stops} line={brand} land={tbLighten(brand, 0.6)} ink={INK} height={D ? 210 : 160} rtl={rtl} />}
            </div>
            {D && imgs[3] && (
              <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <Postcard src={imgs[3]} h={210} rotate={1.2} caption={mapCaption || undefined} onClick={() => zoom(imgs[3])} />
              </div>
            )}
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
        <SecHead idx="03" kicker={L.sections.itinerary} title={ar(`${itinDays.length} days, one tribe`, `${dig(itinDays.length)} أيام، رفقة واحدة`)} />
        <div style={{ display: "flex", flexDirection: "column", gap: D ? 12 : 10 }}>
          {itinDays.map((it, i) => {
            const tag = secItemStr(it, "tag", "location", "place");
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: tag ? "auto 1fr auto" : "auto 1fr", gap: D ? 22 : 14, alignItems: "center", background: i % 2 ? CARD2 : CARD, border: `1px solid ${RULE}`, borderRadius: 14, padding: D ? "18px 24px" : "15px 16px" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                  <span style={{ fontFamily: disp, fontSize: D ? 26 : 22, fontWeight: 700, color: onBrand, background: brand, width: D ? 50 : 42, height: D ? 50 : 42, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>{dig((it.day as number) ?? i + 1)}</span>
                  <Label size={9}>{L.ui.day}</Label>
                </div>
                <div>
                  <div style={{ fontFamily: disp, fontSize: D ? 20 : 17, fontWeight: 700, color: INK, letterSpacing: rtl ? 0 : "-0.4px" }}>{secItemStr(it, "title")}</div>
                  {secItemStr(it, "desc", "description") && <div style={{ fontFamily: body, fontSize: 13.5, color: MUT, lineHeight: 1.55, marginTop: 4 }}>{secItemStr(it, "desc", "description")}</div>}
                </div>
                {tag && <Stamp>{tag}</Stamp>}
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
    const name = (r0 ? secItemStr(r0, "name") : "") || secStr(h, "name");
    const stars = r0 && typeof r0.stars === "number" ? (r0.stars as number) : (typeof h?.stars === "number" ? (h.stars as number) : 0);
    const blurb = (r0 ? secItemStr(r0, "note", "description", "blurb") : "") || secStr(h, "description") || pkg.hotelDescription || "";
    const features = r0 ? secStrArr(r0, "facilities").concat(secStrArr(r0, "features")) : secStrArr(h, "facilities");
    const stays = richList.length > 1 ? richList.map((r) => ({ n: secItemStr(r, "name"), d: secItemStr(r, "location", "nights", "note") })).filter((s) => s.n) : [];
    if (!blurb && !name) return null;
    const img = mediaImgs[5] || mediaImgs[1] || mediaImgs[0] || cover;
    return (
      <Wrap style={{ background: DARK, color: "#fff" }} section="hotel">
        <SecHead idx="04" kicker={L.sections.hotel} title={name || ar("Where you'll stay", "مكان إقامتك")} sub={!stays.length ? blurb : undefined} light />
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 40 : 24, alignItems: "center" }}>
          <div>
            {stars > 0 && <div style={{ marginBottom: 18 }}><Stamp dark>{dig(stars)} ★ {ar("rated", "تقييم")}</Stamp></div>}
            {stays.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 0, border: `1px solid rgba(255,255,255,0.15)`, borderRadius: 12, overflow: "hidden" }}>
                {stays.map((s, i) => (
                  <div key={i} style={{ padding: D ? "18px 18px" : "14px 14px", borderInlineEnd: i % 2 === 0 ? `1px solid rgba(255,255,255,0.15)` : "none", borderTop: i > 1 ? `1px solid rgba(255,255,255,0.15)` : "none" }}>
                    <div style={{ fontFamily: disp, fontSize: D ? 17 : 15, fontWeight: 700, color: "#fff", letterSpacing: rtl ? 0 : "-0.3px" }}>{s.n}</div>
                    {s.d && <div style={{ marginTop: 5 }}><Label color={brLight}>{s.d}</Label></div>}
                  </div>
                ))}
              </div>
            )}
            {stays.length > 0 && blurb && <p style={{ fontFamily: body, fontSize: D ? 15 : 14, color: "rgba(255,255,255,0.78)", lineHeight: 1.7, margin: "18px 0 0", whiteSpace: "pre-line" }}>{blurb}</p>}
            {features.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 18px", marginTop: 20 }}>
                {features.map((f, i) => <div key={i} style={{ display: "flex", gap: 9, alignItems: "baseline", fontFamily: body, fontSize: 13.5, color: "rgba(255,255,255,0.85)" }}><span style={{ color: brLight }}>✦</span> {f}</div>)}
              </div>
            )}
          </div>
          {img && <Postcard src={img} h={D ? 360 : 220} rotate={-1.4} onClick={() => zoom(img)} />}
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
        <SecHead idx="05" kicker={L.sections.inclusions} title={ar("What's in the bag", "ما يشمله البرنامج")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 16 : 14 }}>
          {includes.length > 0 && (
            <div style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 14, padding: D ? 28 : 22 }}>
              <div style={{ marginBottom: 14 }}><Label color={brand}>✓ {L.ui.included}</Label></div>
              {includes.map((it, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "11px 0", borderTop: i ? `1px solid ${RULE}` : "none", alignItems: "flex-start" }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={brand} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}><path d="M20 6L9 17l-5-5" /></svg>
                  <span style={{ fontFamily: body, fontSize: 14.5, color: INK, lineHeight: 1.5 }}>{it}</span>
                </div>
              ))}
            </div>
          )}
          {excludes.length > 0 && (
            <div style={{ background: CARD2, border: `1px solid ${RULE}`, borderRadius: 14, padding: D ? 28 : 22 }}>
              <div style={{ marginBottom: 14 }}><Label color={FAINT}>✕ {L.ui.notIncluded}</Label></div>
              {excludes.map((it, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "11px 0", borderTop: i ? `1px solid ${RULE}` : "none", alignItems: "flex-start" }}>
                  <span style={{ color: FAINT, fontSize: 16, lineHeight: 1.2, flexShrink: 0 }}>×</span>
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
          <SecHead idx="06" kicker={L.sections.meals} title={planLabel} />
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
        <SecHead idx="07" kicker={L.sections.visa} title={VISA_HEAD[included]?.[lang] || ar("Visa & entry", "التأشيرة والدخول")} />
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
        <SecHead idx="08" kicker={L.sections.transfers} title={ar("Getting you there & around", "وصولك وتنقّلك")} sub={items.length ? undefined : desc} />
        {items.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 16 : 12 }}>
            {items.map((t, i) => (
              <div key={i} style={{ background: CARD2, border: `1px solid ${RULE}`, borderRadius: 14, padding: D ? 26 : 20 }}>
                <span style={{ fontFamily: disp, fontSize: 14, fontWeight: 700, color: brand }}>{dig(`0${i + 1}`.slice(-2))}</span>
                <div style={{ fontFamily: disp, fontSize: D ? 18 : 16, fontWeight: 700, color: INK, letterSpacing: rtl ? 0 : "-0.4px", margin: "10px 0 6px" }}>{secItemStr(t, "leg", "title", "name", "text")}</div>
                {typeof t === "object" && secItemStr(t, "desc", "description") && <div style={{ fontFamily: body, fontSize: 13.5, color: MUT, lineHeight: 1.6 }}>{secItemStr(t, "desc", "description")}</div>}
              </div>
            ))}
          </div>
        )}
      </Wrap>
    );
  };

  // ════════ DEPARTURES — ticket stubs ════════
  const Departures = () => {
    const rows = depEntries.length ? depEntries : (pkg.departures ?? []).map((d) => ({ date: d.date, price: d.price, spots: d.spots } as SecData));
    if (!rows.length) return null;
    const perf: React.CSSProperties = { backgroundImage: `radial-gradient(circle, ${PAPER} 3px, transparent 3.5px)`, backgroundSize: "8px 14px", backgroundRepeat: "repeat-y" };
    const statusChip = (spots: number) => {
      if (spots <= 0) return <Label color={FAINT}>{L.ui.soldOut}</Label>;
      const col = spots <= 3 ? URGENT : brand;
      return <span style={{ fontFamily: label, fontSize: 11.5, fontWeight: 800, color: col, letterSpacing: rtl ? 0 : "0.5px" }}>{dig(spots)} {L.ui.seatsLeft}</span>;
    };
    return (
      <Wrap id="tb-departures" section="departures">
        <SecHead idx="09" kicker={L.sections.departures} title={ar("Pick your departure", "اختر موعد مغادرتك")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 16 : 12 }}>
          {rows.map((r, i) => {
            const spots = typeof r.spots === "number" ? r.spots : Number(r.spots) || 0; const sold = spots <= 0;
            const from = secItemStr(r, "origin", "from"); const date = secItemStr(r, "date");
            const dep = secItemStr(r, "flyingTime"); const arrt = secItemStr(r, "arrivingTime"); const price = secItemStr(r, "price");
            return (
              <div key={i} style={{ display: "flex", background: sold ? CARD : CARD2, border: `1px solid ${RULE}`, borderRadius: 14, overflow: "hidden", opacity: sold ? 0.6 : 1 }}>
                <div style={{ background: brand, color: onBrand, padding: D ? "20px 8px" : "16px 6px", display: "flex", alignItems: "center", justifyContent: "center", width: 40 }}>
                  <span style={{ fontFamily: label, fontSize: 11, fontWeight: 800, letterSpacing: rtl ? 0 : "2px", textTransform: up, writingMode: "vertical-rl", transform: rtl ? "rotate(180deg)" : "none" }}>{dig(date)}</span>
                </div>
                <div style={{ width: 10, ...perf }} />
                <div style={{ flex: 1, padding: D ? "18px 18px" : "16px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <Label color={FAINT}>{L.ui.from}</Label>
                    {price && <div style={{ fontFamily: disp, fontSize: D ? 22 : 20, fontWeight: 700, color: brand }}>{dig(price)}</div>}
                  </div>
                  <div style={{ fontFamily: disp, fontSize: D ? 17 : 16, fontWeight: 700, color: INK, letterSpacing: rtl ? 0 : "-0.3px", marginTop: 4 }}>{from || dig(date)}</div>
                  {(dep || arrt) && <div style={{ fontFamily: body, fontSize: 12.5, color: MUT, marginTop: 2 }}>{dig(dep)}{arrt ? ` → ${dig(arrt)}` : ""}</div>}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px dashed ${RULE}`, marginTop: 12, paddingTop: 12 }}>
                    {statusChip(spots)}
                    {!sold && pkg.whatsapp && <Primary onClick={onWhatsApp}>{L.ui.book}</Primary>}
                  </div>
                </div>
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
      <Wrap style={{ background: CARD }} id="tb-pricing" section="pricing">
        <SecHead idx="10" kicker={L.sections.pricing} title={ar("Pick your room", "اختر غرفتك")} />
        {tiers.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? `repeat(${Math.min(tiers.length, 3)},1fr)` : "1fr", gap: D ? 16 : 12 }}>
            {tiers.map((t, i) => {
              const featured = tiers.length === 3 && i === 1;
              return (
                <div key={i} style={{ background: featured ? DARK : CARD2, color: featured ? "#fff" : INK, border: `1px solid ${featured ? DARK : RULE}`, borderRadius: 16, padding: D ? 28 : 22, position: "relative" }}>
                  {featured && <div style={{ position: "absolute", insetInlineEnd: 20, top: -12 }}><Stamp dark>★ {L.ui.mostPopular}</Stamp></div>}
                  <div style={{ fontFamily: disp, fontSize: D ? 21 : 18, fontWeight: 700, letterSpacing: rtl ? 0 : "-0.4px" }}>{localizeTierLabel(t.label, lang)}</div>
                  <div style={{ fontFamily: disp, fontSize: D ? 40 : 34, fontWeight: 700, marginTop: 16, color: featured ? "#fff" : brand }}>{dig(t.price)}</div>
                  <div style={{ marginTop: 6 }}><Label color={featured ? "rgba(255,255,255,0.5)" : FAINT}>{L.ui.perPerson}</Label></div>
                  {pkg.whatsapp && <div style={{ marginTop: 20 }}><Primary full ghost={!featured} onDark={featured} onClick={onWhatsApp}>{L.ui.book}</Primary></div>}
                </div>
              );
            })}
          </div>
        )}
        {(cancellation.length > 0 || schedule.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 40 : 22, marginTop: tiers.length ? 36 : 0 }}>
            {cancellation.length > 0 && (
              <div>
                <div style={{ marginBottom: 12 }}><Label color={brand}>{L.ui.cancellation}</Label></div>
                {cancellation.map((s, i) => <div key={i} style={{ fontFamily: body, fontSize: 13.5, color: MUT, padding: "9px 0", lineHeight: 1.5, borderTop: `1px solid ${RULE}`, display: "flex", gap: 10 }}><span style={{ color: brand }}>·</span> {s}</div>)}
              </div>
            )}
            {schedule.length > 0 && (
              <div>
                <div style={{ marginBottom: 12 }}><Label color={brand}>{L.ui.paymentSchedule}</Label></div>
                {schedule.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderTop: `1px solid ${RULE}` }}>
                    <span style={{ fontFamily: body, fontSize: 13.5, color: INK }}>{secItemStr(s, "dueDate", "label")}</span><span style={{ fontFamily: disp, fontSize: 16, fontWeight: 700, color: brand }}>{dig(secItemStr(s, "amount"))}</span>
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
        <SecHead idx="11" kicker={L.sections.extras} title={ar("Make it yours", "أضِف لمستك")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 16 : 12 }}>
          {items.map((e, i) => (
            <div key={i} style={{ background: i % 2 ? CARD2 : CARD, border: `1px solid ${RULE}`, borderRadius: 14, padding: D ? 26 : 20 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10, gap: 10 }}>
                <div style={{ fontFamily: disp, fontSize: D ? 18 : 16, fontWeight: 700, color: INK, letterSpacing: rtl ? 0 : "-0.4px" }}>{secItemStr(e, "name", "title")}</div>
                {secItemStr(e, "price") && <span style={{ fontFamily: disp, fontSize: D ? 18 : 16, fontWeight: 700, color: brand, whiteSpace: "nowrap" }}>{dig(secItemStr(e, "price"))}</span>}
              </div>
              {secItemStr(e, "description", "desc") && <div style={{ fontFamily: body, fontSize: 13.5, color: MUT, lineHeight: 1.6 }}>{secItemStr(e, "description", "desc")}</div>}
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
    const pquote = (person as { quote?: string }).quote || "";
    const years = typeof person.years === "number" ? person.years : 0;
    const trips = typeof (person as { trips?: number }).trips === "number" ? (person as { trips?: number }).trips! : 0;
    return (
      <Wrap style={{ background: CARD }} section="people">
        <SecHead idx="12" kicker={L.sections.people} title={ar("Meet your host", "تعرّف على مضيفك")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "auto 1fr" : "1fr", gap: D ? 40 : 22, alignItems: "start" }}>
          <div style={{ justifySelf: rtl ? "end" : "start" }}>
            {person.photo
              ? <Postcard src={person.photo} h={D ? 300 : 240} rotate={-2} />
              : <div style={{ width: D ? 240 : 200, height: D ? 300 : 240, background: CARD2, border: `1px solid ${RULE}`, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: disp, fontSize: D ? 90 : 64, fontWeight: 700, color: brand }}>{person.name[0]}</div>}
          </div>
          <div>
            <div style={{ fontFamily: disp, fontSize: D ? 32 : 26, fontWeight: 700, color: INK, letterSpacing: rtl ? 0 : "-0.8px" }}>{person.name}</div>
            {role && <div style={{ marginTop: 6 }}><Label color={brand}>{role}</Label></div>}
            {bio && <p style={{ fontFamily: body, fontSize: 14.5, color: MUT, lineHeight: 1.75, marginTop: 16 }}>{bio}</p>}
            {pquote && <div style={{ fontFamily: quote, fontSize: D ? 23 : 19, fontStyle: "italic", color: INK, marginTop: 18, lineHeight: 1.5, borderInlineStart: `3px solid ${brand}`, paddingInlineStart: 18 }}>&ldquo;{pquote}&rdquo;</div>}
            {(years > 0 || trips > 0) && (
              <div style={{ display: "flex", gap: 40, marginTop: 22, borderTop: `1px solid ${RULE}`, paddingTop: 18 }}>
                {years > 0 && <div><div style={{ fontFamily: disp, fontSize: 28, fontWeight: 700, color: brand }}>{dig(years)}</div><Label>{L.ui.years}</Label></div>}
                {trips > 0 && <div><div style={{ fontFamily: disp, fontSize: 28, fontWeight: 700, color: brand }}>{dig(trips)}</div><Label>{L.ui.trips}</Label></div>}
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
      <Wrap id="tb-reviews" section="reviews">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: 16 }}>
          <SecHead idx="13" kicker={L.sections.reviews} title={ar("They came strangers, left friends", "جاؤوا غرباء، وغادروا أصدقاء")} />
          <div style={{ textAlign: "end", marginBottom: D ? 38 : 26 }}>
            <div style={{ fontFamily: disp, fontSize: D ? 48 : 40, fontWeight: 700, color: brand, lineHeight: 1 }}>{dig(rating)}</div>
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 6 }}><TbStars n={Math.round(rating)} size={14} color={brand} /></div>
            <div style={{ marginTop: 6 }}><Label>{L.ui.basedOn} {dig(count)} {L.ui.review}</Label></div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 16 : 12 }}>
          {items.slice(0, 6).map((r, i) => (
            <div key={i} style={{ background: i % 2 ? CARD2 : CARD, border: `1px solid ${RULE}`, borderRadius: 14, padding: D ? 26 : 22 }}>
              <TbStars n={Math.round(r.rating || 5)} size={13} color={brand} />
              <p style={{ fontFamily: quote, fontSize: D ? 18 : 16, fontStyle: "italic", color: INK, lineHeight: 1.55, margin: "12px 0 16px" }}>&ldquo;{r.text}&rdquo;</p>
              <div style={{ fontFamily: disp, fontSize: 14, fontWeight: 700, color: INK, letterSpacing: rtl ? 0 : "-0.3px" }}>{r.name}</div>
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
    const total = sc.totalSpots && sc.totalSpots > 0 ? sc.totalSpots : Math.max(sc.spotsRemaining, 14);
    const filled = Math.max(0, total - sc.spotsRemaining);
    return (
      <Wrap style={{ background: DARK, color: "#fff" }} section="scarcity">
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 48 : 24, alignItems: "center" }}>
          <div>
            <div style={{ marginBottom: 18 }}><Stamp dark>● {L.sections.scarcity}</Stamp></div>
            <h2 style={{ fontFamily: disp, fontSize: D ? 34 : 25, fontWeight: 700, lineHeight: 1.15, letterSpacing: rtl ? 0 : "-0.6px", margin: 0 }}>{L.ui.spotsLine(sc.spotsRemaining)}</h2>
            <p style={{ fontFamily: body, fontSize: D ? 16 : 14.5, color: "rgba(255,255,255,0.72)", lineHeight: 1.7, margin: "18px 0 0" }}>{L.ui.scarcityWindow}</p>
          </div>
          <div style={{ border: `1px solid rgba(255,255,255,0.15)`, borderRadius: 16, padding: D ? 30 : 22 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <div><div style={{ fontFamily: disp, fontSize: D ? 56 : 42, fontWeight: 700, color: brLight, lineHeight: 1 }}>{dig(sc.spotsRemaining)}</div><Label color="rgba(255,255,255,0.55)">{L.ui.seatsLeft} / {dig(total)}</Label></div>
              {sc.firstDepartureDate && <div style={{ textAlign: "end" }}><Label color="rgba(255,255,255,0.55)">{L.ui.nextDeparture}</Label><div style={{ fontFamily: disp, fontSize: D ? 22 : 18, fontWeight: 700, color: "#fff", marginTop: 4 }}>{dig(sc.firstDepartureDate)}</div></div>}
            </div>
            {total <= 20 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 20 }}>
                {Array.from({ length: total }).map((_, i) => (
                  <span key={i} style={{ width: 16, height: 16, borderRadius: "50%", background: i < filled ? brand : "transparent", border: `1.5px solid ${i < filled ? brand : "rgba(255,255,255,0.35)"}` }} />
                ))}
              </div>
            )}
            {pkg.whatsapp && <div style={{ marginTop: 20 }}><Primary full big onClick={onWhatsApp}>{L.ui.saveSpot}</Primary></div>}
          </div>
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
        <SecHead idx="14" kicker={L.sections.agency} title={agency.name} sub={agency.tagline} />
        <div style={{ display: "grid", gridTemplateColumns: D && image ? "1.3fr 1fr" : "1fr", gap: D ? 48 : 24, alignItems: "start" }}>
          {story && <p style={{ fontFamily: body, fontSize: D ? 16 : 14.5, color: MUT, lineHeight: 1.85, margin: 0, whiteSpace: "pre-line" }}>{story}</p>}
          {image && <Postcard src={image} h={D ? 300 : 220} rotate={1.4} />}
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
        <SecHead idx="15" kicker={L.sections.notes} title={ar("Good to know", "معلومات تهمّك")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 16 : 12 }}>
          {items.map((n, i) => {
            const t = secItemStr(n, "title");
            const body2 = secItemStr(n, "text", "desc", "description") || (typeof n === "string" ? n : "");
            return (
              <div key={i} style={{ background: CARD2, border: `1px solid ${RULE}`, borderInlineStart: `3px solid ${brand}`, borderRadius: 14, padding: D ? 24 : 20 }}>
                {t && <div style={{ fontFamily: disp, fontSize: D ? 18 : 16, fontWeight: 700, color: INK, letterSpacing: rtl ? 0 : "-0.4px", marginBottom: 6 }}>{t}</div>}
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
        <SecHead idx="16" kicker={L.sections.faq} title={ar("Questions, answered", "إجابات على أسئلتك")} />
        <div>
          {items.map((f, i) => (
            <div key={i} style={{ padding: D ? "24px 0" : "18px 0", borderTop: `1px solid ${RULE}`, borderBottom: i === items.length - 1 ? `1px solid ${RULE}` : "none" }}>
              <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1.4fr" : "1fr", gap: D ? 40 : 8, alignItems: "baseline" }}>
                <div style={{ fontFamily: disp, fontSize: D ? 20 : 17, fontWeight: 700, color: INK, letterSpacing: rtl ? 0 : "-0.4px", lineHeight: 1.25 }}>{secItemStr(f, "question", "q")}</div>
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
    const image = secStr(cs, "image") || mediaImgs[2] || cover;
    if (!heading && !text) return null;
    return (
      <Wrap style={{ background: DARK, color: "#fff" }} section="custom">
        <div style={{ display: "grid", gridTemplateColumns: D && image ? "1.4fr 1fr" : "1fr", gap: D ? 48 : 22, alignItems: "center" }}>
          <div>
            <div style={{ marginBottom: 16 }}><Label color={brLight}>{L.sections.custom}</Label></div>
            {heading && <H2 light size={D ? 42 : 28}>{heading}</H2>}
            {text && <p style={{ fontFamily: quote, fontSize: D ? 20 : 16.5, fontStyle: "italic", color: "rgba(255,255,255,0.85)", lineHeight: 1.7, margin: "18px 0 0", whiteSpace: "pre-line" }}>{text}</p>}
          </div>
          {image && <Postcard src={image} h={D ? 320 : 200} rotate={1.6} onClick={() => zoom(image)} />}
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
        <SecHead idx="17" kicker={L.sections.others} title={ar("More tribes forming", "رحلات أخرى تنطلق قريبًا")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 18 : 14 }}>
          {list.map((o, i) => {
            const oTitle = secItemStr(o, "title"); const place = secItemStr(o, "destination", "place");
            const price = secItemStr(o, "price"); const oNights = secItemStr(o, "nights");
            const img = secItemStr(o, "image"); const link = secItemStr(o, "link");
            const Inner = (
              <div style={{ background: CARD, border: `1px solid ${RULE}`, borderRadius: 14, overflow: "hidden", height: "100%" }}>
                <div style={{ position: "relative", height: D ? 180 : 160, background: CARD2 }}>
                  {img && <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                  {place && <div style={{ position: "absolute", insetInlineStart: 12, top: 12 }}><Stamp dark>{place}</Stamp></div>}
                </div>
                <div style={{ padding: D ? 20 : 18 }}>
                  <div style={{ fontFamily: disp, fontSize: D ? 20 : 18, fontWeight: 700, color: INK, letterSpacing: rtl ? 0 : "-0.5px", lineHeight: 1.15 }}>{oTitle}</div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: `1px solid ${RULE}`, paddingTop: 12, marginTop: 12 }}>
                    {price && <span style={{ fontFamily: disp, fontSize: 20, fontWeight: 700, color: brand }}>{dig(price)}</span>}
                    {oNights && <Label>{dig(oNights)} {L.ui.nights}</Label>}
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
        <Label color={tbRgba(onBrand, 0.7)}>{L.ui.stamp}</Label>
        <div style={{ fontFamily: disp, fontSize: D ? 52 : 32, fontWeight: 700, lineHeight: 1.05, letterSpacing: rtl ? 0 : "-1.2px", maxWidth: 760, margin: "14px auto 0" }}>{L.ui.closer}</div>
        <div style={{ fontFamily: body, fontSize: 14, opacity: 0.9, margin: "16px 0 26px" }}>{L.ui.replyTime}{pkg.whatsapp ? ` · ${dig(pkg.whatsapp)}` : ""}</div>
        <div style={{ display: "inline-flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {pkg.whatsapp && <button onClick={onWhatsApp} data-testid="wa-cta" style={{ fontFamily: disp, background: onBrand, color: brand, border: "none", borderRadius: 100, padding: "15px 30px", fontSize: D ? 14.5 : 13.5, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 9 }}><WAIcon s={15} fill={brand} /> {L.ui.bookWhatsapp}</button>}
          {pkg.messenger && onMessenger && <Primary big ghost onClick={onMessenger}>{L.ui.messenger}</Primary>}
        </div>
      </Wrap>
      <div style={{ padding: `22px ${px}px`, display: "flex", justifyContent: "space-between", alignItems: "center", background: DARK }}>
        <div style={{ fontFamily: disp, fontSize: 18, fontWeight: 700, color: "#fff", letterSpacing: rtl ? 0 : "-0.4px" }}>{agency.name}</div>
        <Label color="rgba(255,255,255,0.5)">{L.ui.poweredBy}</Label>
      </div>
    </div>
  );

  // ════════ BAR ════════
  const Bar = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${px}px`, height: D ? 60 : 54, borderBottom: `1px solid ${RULE}`, background: tbRgba(PAPER, 0.92), backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 30 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 11, height: 11, borderRadius: "50%", background: brand }} />
        <span style={{ fontFamily: disp, fontSize: D ? 19 : 17, fontWeight: 700, color: INK, letterSpacing: rtl ? 0 : "-0.4px" }}>{agency.name}</span>
      </div>
      {D ? (
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          {navItems.map(([key, lbl]) => <button key={key} onClick={() => goTo(key)} style={{ fontFamily: label, fontSize: 11, fontWeight: 700, letterSpacing: rtl ? 0 : "1.2px", textTransform: up, color: MUT, background: "none", border: "none", cursor: "pointer", padding: 0 }}>{lbl}</button>)}
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
      {People()}
      {Reviews()}
      {Scarcity()}
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
export function TemplateTribeCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
