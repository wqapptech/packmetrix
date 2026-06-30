"use client";

// ═══════════════════════════════════════════════════════════════════════════
// FAMILY V2 — Family holidays · a warm, rounded, reassuring "family planner".
// Cream paper, soft butter & sky panels, generous border-radius, pill chips.
// Quicksand display (friendly geometric), Hanken Grotesk body, Baloo Bhaijaan 2
// for Arabic. Big rounded cards, soft shadows, reassurance-first language.
// Brand colour themes accents, chips & CTA. One component, all 4 surfaces.
// Wired to real pkg.sections data with graceful empty states.
// ═══════════════════════════════════════════════════════════════════════════

import React, { useRef, useState } from "react";
import { useIsDesktop, BaseCard, LightboxCarousel } from "./shared";
import { localizeTierLabel } from "@/lib/translations";
import type { TPageProps, TCardProps, TPackage } from "./types";

type SecData = Record<string, unknown>;

// ─── Brand colour math ────────────────────────────────────────────────────────
function faHex(h: string): [number, number, number] {
  h = h.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
function faRgba(hex: string, a: number): string { const [r, g, b] = faHex(hex); return `rgba(${r},${g},${b},${a})`; }
function faMix(hex: string, target: string, t: number): string {
  const a = faHex(hex), b = faHex(target);
  const m = a.map((v, i) => Math.round(v + (b[i] - v) * t));
  return `rgb(${m[0]},${m[1]},${m[2]})`;
}
function faDarken(hex: string, t: number) { return faMix(hex, "#000000", t); }
function faLum(hex: string) { const [r, g, b] = faHex(hex); return (0.299 * r + 0.587 * g + 0.114 * b) / 255; }
function faOn(hex: string) { return faLum(hex) > 0.62 ? "#33291f" : "#ffffff"; }

// ─── i18n ─────────────────────────────────────────────────────────────────────
const L_EN = {
  sections: {
    highlights: "Why you'll love it", media: "A look at the days", itinerary: "Day by day",
    hotel: "Where you'll stay", meals: "What you'll eat", inclusions: "What's covered",
    transfers: "Getting around", visa: "Visa & entry", departures: "Departures",
    pricing: "Choose your room", extras: "Nice little add-ons", scarcity: "Before it's gone",
    people: "Meet your family host", reviews: "What parents tell us", agency: "About the agency",
    notes: "Good to know", faq: "Questions, answered", custom: "A note from us", others: "More family trips",
  },
  nav: { highlights: "Highlights", itinerary: "Itinerary", hotel: "Stay", inclusions: "Included", departures: "Dates", pricing: "Pricing", reviews: "Reviews", faq: "FAQ" },
  ui: {
    from: "From", perPerson: "per person", perFamily: "for the family", night: "night", nights: "nights",
    included: "Included", notIncluded: "Not included", mostPopular: "Most loved", soldOut: "Sold out",
    left: "left", seatsLeft: "spots left", book: "Book", reserve: "Reserve", plan: "Plan it",
    bookWhatsapp: "Book on WhatsApp", messenger: "Messenger", message: "Message us", nextDeparture: "Next departure",
    date: "Date", flight: "Flight", price: "Price", to: "To", day: "Day",
    cancellation: "Cancellation policy", paymentSchedule: "Payment schedule", basedOn: "based on", review: "reviews",
    route: "Route", years: "years on the ground", trips: "families hosted", replyTime: "Usually replies within an hour",
    watch: "Watch the film", noVideo: "Video coming soon", play: "Play", pause: "Pause", mute: "Mute",
    unmute: "Unmute", poweredBy: "Powered by PackMetrix", closer: "A holiday everyone comes home happy from.",
    spotsLine: (n: number) => `${n} ${n === 1 ? "spot" : "spots"} left on this departure.`,
    scarcityWindow: "Small groups mean places go quickly. Reach out and we'll hold yours while you decide.",
    holdDates: "Hold our dates", badge: "Family favourite",
  },
};
const L_AR: typeof L_EN = {
  sections: {
    highlights: "لماذا ستحبّها", media: "لمحة عن الأيام", itinerary: "يومًا بيوم",
    hotel: "مكان إقامتك", meals: "ما ستتناوله", inclusions: "ما هو مشمول",
    transfers: "التنقّلات", visa: "التأشيرة والدخول", departures: "مواعيد المغادرة",
    pricing: "اختر غرفتك", extras: "إضافات لطيفة", scarcity: "قبل أن تنفد",
    people: "تعرّف على مضيف عائلتك", reviews: "ما يخبرنا به الآباء", agency: "عن الوكالة",
    notes: "معلومات تهمّك", faq: "إجابات على أسئلتك", custom: "كلمة منّا", others: "رحلات عائلية أخرى",
  },
  nav: { highlights: "المميزات", itinerary: "البرنامج", hotel: "الإقامة", inclusions: "المشمول", departures: "المواعيد", pricing: "الأسعار", reviews: "التقييمات", faq: "الأسئلة" },
  ui: {
    from: "من", perPerson: "للفرد", perFamily: "للعائلة", night: "ليلة", nights: "ليالٍ",
    included: "مشمول", notIncluded: "غير مشمول", mostPopular: "الأكثر حبًّا", soldOut: "نفدت",
    left: "متبقّية", seatsLeft: "أماكن متبقّية", book: "احجز", reserve: "احجز", plan: "خطّط لها",
    bookWhatsapp: "احجز عبر واتساب", messenger: "ماسنجر", message: "راسلنا", nextDeparture: "أقرب موعد",
    date: "التاريخ", flight: "الرحلة", price: "السعر", to: "إلى", day: "اليوم",
    cancellation: "سياسة الإلغاء", paymentSchedule: "جدول الدفع", basedOn: "من", review: "تقييم",
    route: "المسار", years: "سنوات ميدانية", trips: "عائلة استضافتها", replyTime: "نردّ عادةً خلال ساعة",
    watch: "شاهد الفيديو", noVideo: "الفيديو قريبًا", play: "تشغيل", pause: "إيقاف", mute: "كتم",
    unmute: "تشغيل الصوت", poweredBy: "مُشغّل بواسطة باكمتريكس", closer: "عطلة يعود منها الجميع سعداء.",
    spotsLine: (n: number) => `بقي ${n} ${n === 1 ? "مكان" : "أماكن"} في هذا الموعد.`,
    scarcityWindow: "المجموعات صغيرة، فالأماكن تنفد بسرعة. تواصل معنا ونحتفظ لك بمكانك ريثما تقرّر.",
    holdDates: "احجز مواعيدنا", badge: "المفضّلة عائليًا",
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
  agent: { en: "Family host", ar: "مضيف العائلة" }, curator: { en: "Trip planner", ar: "مخطّط الرحلة" },
  trip_lead: { en: "Trip leader", ar: "قائد الرحلة" }, trip_designer: { en: "Trip planner", ar: "مخطّط الرحلة" },
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
function FaStars({ n = 5, of = 5, size = 14, color }: { n?: number; of?: number; size?: number; color: string }) {
  const star = (fill: string) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} style={{ display: "block" }}><path d="M12 2l2.9 6.1 6.6.9-4.8 4.6 1.2 6.6L12 18.6 5.9 20.8l1.2-6.6L2.3 9.6l6.6-.9z" /></svg>
  );
  return <span style={{ display: "inline-flex", gap: 2 }}>{Array.from({ length: of }).map((_, i) => <span key={i}>{star(i < n ? color : faRgba(color, 0.28))}</span>)}</span>;
}

// ─── Abstract route map ───────────────────────────────────────────────────────
function FaRouteMap({ stops, line, ink = "#33291f", height = 220, rtl = false }: { stops: { label: string }[]; line: string; ink?: string; height?: number; rtl?: boolean }) {
  const W = 1000, H = 420;
  const pts = stops.map((s, i) => {
    const x = stops.length === 1 ? W / 2 : 120 + (i * (W - 240)) / (stops.length - 1);
    const y = 160 + Math.sin(i * 1.2 + 0.4) * 60 + (i % 2 ? 16 : -8);
    return { ...s, x: rtl ? W - x : x, y };
  });
  const path = pts.map((p, i) => { if (i === 0) return `M ${p.x} ${p.y}`; const prev = pts[i - 1]; const mx = (prev.x + p.x) / 2; return `Q ${mx} ${prev.y - 36} ${p.x} ${p.y}`; }).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height, display: "block", borderRadius: 16, background: "#dde9ea" }} preserveAspectRatio="xMidYMid slice">
      <g fill="#cfe0e1" opacity="0.9"><path d="M-40 300 Q 180 250 360 300 T 760 290 Q 920 270 1060 320 L1060 460 L-40 460 Z" /><ellipse cx="220" cy="130" rx="180" ry="80" /><ellipse cx="790" cy="110" rx="150" ry="72" /></g>
      <path d={path} fill="none" stroke={line} strokeWidth="4" strokeDasharray="2 13" strokeLinecap="round" opacity="0.9" />
      {pts.map((p, i) => <g key={i}><circle cx={p.x} cy={p.y} r="11" fill="#fff" stroke={line} strokeWidth="3.5" /><circle cx={p.x} cy={p.y} r="4" fill={line} /><text x={p.x} y={p.y - 24} textAnchor="middle" fill={ink} fontSize="22" fontWeight="700" fontFamily="inherit">{p.label}</text></g>)}
    </svg>
  );
}

// ─── Video player ─────────────────────────────────────────────────────────────
function FaVideo({ src, poster, accent, onAccent, rtl = false, sans, height = 320, radius = 22, ui }: { src?: string; poster?: string; accent: string; onAccent: string; rtl?: boolean; sans: string; height?: number; radius?: number; ui: typeof L_EN["ui"] }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const ctrl: React.CSSProperties = { width: 38, height: 38, borderRadius: 100, border: "none", cursor: "pointer", background: "rgba(0,0,0,0.5)", backdropFilter: "blur(6px)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 };
  if (!src) {
    return (
      <div style={{ position: "relative", borderRadius: radius, overflow: "hidden", height, background: "#e3ddd2" }}>
        {poster && <img src={poster} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: "brightness(0.7)" }} />}
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "#fff" }}>
          <div style={{ width: 56, height: 56, borderRadius: 100, border: "1.5px solid rgba(255,255,255,0.6)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="rgba(255,255,255,0.9)"><path d="M8 5v14l11-7z" /></svg>
            <div style={{ position: "absolute", width: 64, height: 1.5, background: "rgba(255,255,255,0.8)", transform: "rotate(-45deg)" }} />
          </div>
          <div style={{ fontFamily: sans, fontSize: 13, opacity: 0.9 }}>{ui.noVideo}</div>
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
          <div style={{ width: 70, height: 70, borderRadius: 100, background: accent, color: onAccent, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 12px 32px rgba(0,0,0,0.35)" }}>
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
export function TemplateFamilyPage({ pkg, agency, onWhatsApp, onMessenger, lang = "en" }: TPageProps) {
  const D = useIsDesktop();
  const rtl = lang === "ar";
  const L = rtl ? L_AR : L_EN;
  const brand = agency.brandColor || "#3f72a8";
  const onBrand = faOn(brand);

  const PAPER = "#fbf7f0", CARD = "#ffffff", BUTTER = "#fdf3e3", SKY = "#eef3f4";
  const INK = "#33291f", MUT = "rgba(51,41,31,0.62)", FAINT = "rgba(51,41,31,0.42)", RULE = "rgba(51,41,31,0.10)";
  const disp = rtl ? "var(--font-baloo), 'Baloo Bhaijaan 2', sans-serif" : "var(--font-quicksand), 'Quicksand', sans-serif";
  const body = rtl ? "var(--font-tajawal), 'Tajawal', sans-serif" : "var(--font-hanken), 'Hanken Grotesk', sans-serif";
  const px = D ? 72 : 22;
  const ar = (en: string, a: string) => (rtl ? a : en);
  const dig = (s: string | number) => (rtl ? String(s).replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[+d]) : String(s));
  const up: React.CSSProperties["textTransform"] = rtl ? "none" : "uppercase";
  const RAD = 22;
  const soft = "0 10px 30px rgba(51,41,31,0.08)";
  const softer = "0 6px 18px rgba(51,41,31,0.06)";

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

  // hero stats from real facts
  const heroStats: { k: string; v: string }[] = [
    nightsN ? { k: ar("Duration", "المدة"), v: `${dig(nightsN)} ${L.ui.nights}` } : null,
    itinDays.length ? { k: ar("Days", "الأيام"), v: dig(itinDays.length) } : null,
    pkg.destination ? { k: ar("Destination", "الوجهة"), v: pkg.destination } : null,
    pkg.rating != null ? { k: ar("Rated", "التقييم"), v: dig(pkg.rating) } : null,
  ].filter(Boolean).slice(0, 4) as { k: string; v: string }[];

  // ---- atoms ----
  const Label = ({ children, color = FAINT, size }: { children: React.ReactNode; color?: string; size?: number }) => (
    <span style={{ fontFamily: disp, fontSize: size || (D ? 12 : 11), fontWeight: 700, letterSpacing: rtl ? 0 : "0.8px", textTransform: up, color }}>{children}</span>
  );
  const Chip = ({ children, tone = "brand", icon }: { children: React.ReactNode; tone?: "brand" | "sky" | "butter"; icon?: React.ReactNode }) => {
    const bg = tone === "brand" ? faRgba(brand, 0.1) : tone === "sky" ? "#dde9ea" : "#f6e7cf";
    const fg = tone === "brand" ? faDarken(brand, 0.12) : tone === "sky" ? "#3a5a5e" : "#8a5a1e";
    return <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: disp, fontSize: D ? 12.5 : 11.5, fontWeight: 700, color: fg, background: bg, borderRadius: 100, padding: "5px 12px" }}>{icon}{children}</span>;
  };
  const Primary = ({ children, full, big, ghost, onClick }: { children: React.ReactNode; full?: boolean; big?: boolean; ghost?: boolean; onClick?: () => void }) => (
    <button data-testid="wa-cta" onClick={onClick} style={{ fontFamily: disp, background: ghost ? "transparent" : brand, color: ghost ? brand : onBrand, border: ghost ? `2px solid ${faRgba(brand, 0.4)}` : "none", borderRadius: 100, padding: big ? "16px 32px" : "12px 22px", fontSize: D ? 15 : 14, fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 9, width: full ? "100%" : "auto", boxShadow: ghost ? "none" : softer }}>
      {!ghost && <WAIcon s={15} fill={onBrand} />} {children}
    </button>
  );
  const H2 = ({ children, size, light }: { children: React.ReactNode; size?: number; light?: boolean }) => (
    <h2 style={{ fontFamily: disp, fontSize: size || (D ? 42 : 29), fontWeight: 700, lineHeight: 1.1, letterSpacing: rtl ? 0 : "-0.6px", color: light ? "#fff" : INK, margin: 0 }}>{children}</h2>
  );
  const Wrap = ({ children, pt, pb, style, id, section }: { children: React.ReactNode; pt?: number; pb?: number; style?: React.CSSProperties; id?: string; section?: string }) => (
    <section id={id} data-pmx-section={section} style={{ scrollMarginTop: D ? 62 : 56, padding: `${pt != null ? pt : (D ? 78 : 46)}px ${px}px ${pb != null ? pb : (D ? 78 : 46)}px`, ...style }}>{children}</section>
  );
  const SecHead = ({ kicker, title: t, sub, light, center }: { kicker: string; title: string; sub?: string; light?: boolean; center?: boolean }) => (
    <div style={{ marginBottom: D ? 36 : 24, textAlign: center ? "center" : "start", maxWidth: center ? 680 : "none", marginInline: center ? "auto" : 0 }}>
      <div style={{ marginBottom: 12 }}><Label color={light ? "rgba(255,255,255,0.7)" : brand} size={D ? 12.5 : 11.5}>{kicker}</Label></div>
      <H2 light={light}>{t}</H2>
      {sub && <p style={{ fontFamily: body, fontSize: D ? 17 : 15, color: light ? "rgba(255,255,255,0.8)" : MUT, lineHeight: 1.65, margin: `${D ? 14 : 10}px ${center ? "auto" : 0} 0`, maxWidth: 600 }}>{sub}</p>}
    </div>
  );
  const Photo = ({ src, h, r = RAD, children, onClick }: { src: string; h: number | string; r?: number; children?: React.ReactNode; onClick?: () => void }) => (
    <div style={{ position: "relative", borderRadius: r, overflow: "hidden", boxShadow: soft }}>
      <img src={src} alt="" onClick={onClick} style={{ width: "100%", height: h, objectFit: "cover", display: "block", cursor: onClick ? "zoom-in" : "default" }} />
      {children}
    </div>
  );

  // ════════ HERO ════════
  const Hero = () => (
    <div data-pmx-section="hero" style={{ background: PAPER, padding: `${D ? 30 : 18}px ${px}px ${D ? 40 : 28}px` }}>
      <Photo src={cover} h={D ? 560 : 480} r={28} onClick={() => cover && zoom(cover)}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "linear-gradient(to bottom, rgba(40,30,20,0.30), rgba(40,30,20,0.05) 38%, rgba(40,30,20,0.82))" }} />
        <div style={{ position: "absolute", insetInline: D ? 40 : 22, top: D ? 30 : 20, display: "flex", justifyContent: "space-between", alignItems: "center", pointerEvents: "none" }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontFamily: disp, fontSize: D ? 13 : 11.5, fontWeight: 700, color: INK, background: "rgba(255,255,255,0.92)", borderRadius: 100, padding: "7px 14px" }}>♥ {L.ui.badge}</span>
          {pkg.destination && <Label color="rgba(255,255,255,0.9)"><span data-pmx-field="destination">{pkg.destination}</span></Label>}
        </div>
        <div style={{ position: "absolute", insetInline: D ? 40 : 22, bottom: D ? 40 : 26, color: "#fff", pointerEvents: "none" }}>
          {pkg.destination && <div style={{ marginBottom: 14 }}><Label color="rgba(255,255,255,0.82)" size={D ? 13 : 12}>{pkg.destination}</Label></div>}
          <h1 style={{ fontFamily: disp, fontSize: D ? 66 : 38, fontWeight: 700, lineHeight: 1.02, letterSpacing: rtl ? 0 : "-1.5px", margin: 0 }} data-pmx-field="title">{title}</h1>
          {pkg.description && <p style={{ fontFamily: body, fontSize: D ? 18 : 15, color: "rgba(255,255,255,0.9)", lineHeight: 1.6, margin: "18px 0 0", maxWidth: 560 }}>{pkg.description}</p>}
        </div>
      </Photo>
      <div style={{ display: "grid", gridTemplateColumns: D ? `repeat(${heroStats.length},1fr) auto` : "repeat(2,1fr)", gap: D ? 14 : 10, marginTop: D ? 22 : 14 }}>
        {heroStats.map((s, i) => (
          <div key={i} style={{ background: CARD, borderRadius: 18, padding: D ? "18px 22px" : "14px 16px", boxShadow: softer }}>
            <Label>{s.k}</Label>
            <div style={{ fontFamily: disp, fontSize: D ? 24 : 20, fontWeight: 700, color: INK, marginTop: 5, letterSpacing: rtl ? 0 : "-0.4px" }}>{s.v}</div>
          </div>
        ))}
        <div style={{ background: brand, borderRadius: 18, padding: D ? "16px 24px" : "14px 16px", display: "flex", alignItems: "center", gridColumn: D ? "auto" : "1 / -1", boxShadow: soft }}>
          <div style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <Label color={faRgba(onBrand, 0.7)}>{L.ui.from}</Label>
              <div style={{ fontFamily: disp, fontSize: D ? 26 : 22, fontWeight: 700, color: onBrand, marginTop: 3 }} data-pmx-field="price">{dig(pkg.price || "")}</div>
            </div>
            {pkg.whatsapp && <Primary onClick={onWhatsApp}>{L.ui.plan}</Primary>}
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
        <SecHead kicker={L.nav.highlights} title={ar("Built for travelling with kids", "مصمّمة للسفر مع الأطفال")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(2,1fr)" : "1fr", gap: D ? 18 : 12 }}>
          {items.map((h, i) => {
            const t = secItemStr(h, "title", "text", "label");
            const d = typeof h === "object" ? secItemStr(h, "desc", "description") : "";
            return (
              <div key={i} style={{ display: "flex", gap: 18, padding: D ? "28px 30px" : "22px 20px", background: CARD, borderRadius: RAD, boxShadow: softer, alignItems: "flex-start" }}>
                <span style={{ fontFamily: disp, fontSize: D ? 18 : 16, fontWeight: 700, color: brand, background: faRgba(brand, 0.1), width: D ? 46 : 40, height: D ? 46 : 40, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{dig(i + 1)}</span>
                <div>
                  <div style={{ fontFamily: disp, fontSize: D ? 21 : 18, fontWeight: 700, color: INK, letterSpacing: rtl ? 0 : "-0.3px", marginBottom: d ? 7 : 0 }}>{t}</div>
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
    const stops = mapImage ? [] : itinDays.slice(0, 6).map((d) => ({ label: secItemStr(d, "title") })).filter((s) => s.label);
    const sideImg = imgs[2] || imgs[1] || imgs[0];
    const showRoute = mapImage || stops.length > 0;
    return (
      <Wrap style={{ background: SKY }} section="media">
        <SecHead kicker={L.sections.media} title={ar("A look at the days", "لمحة عن الأيام")} />
        {video && <FaVideo src={video} poster={cover || imgs[0]} accent={brand} onAccent={onBrand} rtl={rtl} sans={body} height={D ? 440 : 250} radius={RAD} ui={L.ui} />}
        {(showRoute || sideImg) && (
          <div style={{ display: "grid", gridTemplateColumns: D && showRoute && sideImg ? "1.3fr 1fr" : "1fr", gap: D ? 22 : 14, marginTop: video ? (D ? 28 : 18) : 0 }}>
            {showRoute && (
              <div style={{ background: CARD, borderRadius: RAD, padding: D ? 22 : 16, boxShadow: softer }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                  <Label color={brand}>{L.ui.route}</Label>
                  {(stops.length > 0 || itinDays.length > 0) && <Chip tone="sky">{dig(stops.length || itinDays.length)} {ar("stops", "محطات")}</Chip>}
                </div>
                {mapImage
                  ? <img src={mapImage} alt={mapCaption} style={{ width: "100%", height: D ? 220 : 160, objectFit: "cover", borderRadius: 16, display: "block" }} />
                  : <FaRouteMap stops={stops} line={brand} ink={INK} height={D ? 220 : 160} rtl={rtl} />}
              </div>
            )}
            {sideImg && (
              <Photo src={sideImg} h={D ? (showRoute ? "100%" : 360) : 200} onClick={() => zoom(sideImg)}>
                {mapCaption && <div style={{ position: "absolute", insetInline: 14, bottom: 14, pointerEvents: "none" }}>
                  <div style={{ background: "rgba(255,255,255,0.94)", borderRadius: 14, padding: "10px 14px", fontFamily: body, fontSize: D ? 13.5 : 12.5, color: INK, lineHeight: 1.45 }}>{mapCaption}</div>
                </div>}
              </Photo>
            )}
          </div>
        )}
        {imgs.length > 3 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr 1fr", gap: D ? 18 : 12, marginTop: D ? 22 : 14 }}>
            {imgs.slice(3, D ? 6 : 5).map((u, k) => <Photo key={k} src={u} h={D ? 170 : 120} onClick={() => zoom(u)} />)}
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
        <SecHead kicker={L.sections.itinerary} title={ar(`${itinDays.length} days at family pace`, `${dig(itinDays.length)} أيامٍ بإيقاع العائلة`)} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(2,1fr)" : "1fr", gap: D ? 14 : 10 }}>
          {itinDays.map((it, i) => {
            const tag = secItemStr(it, "tag", "location", "place");
            return (
              <div key={i} style={{ display: "flex", gap: 16, background: CARD, borderRadius: RAD, padding: D ? "18px 22px" : "15px 16px", boxShadow: softer, alignItems: "flex-start" }}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, flexShrink: 0 }}>
                  <span style={{ fontFamily: disp, fontSize: D ? 22 : 19, fontWeight: 700, color: onBrand, background: brand, width: D ? 46 : 40, height: D ? 46 : 40, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center" }}>{dig((it.day as number) ?? i + 1)}</span>
                  <Label size={9}>{L.ui.day}</Label>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                    <div style={{ fontFamily: disp, fontSize: D ? 18 : 16, fontWeight: 700, color: INK, letterSpacing: rtl ? 0 : "-0.3px" }}>{secItemStr(it, "title")}</div>
                    {tag && <Chip>{tag}</Chip>}
                  </div>
                  {secItemStr(it, "desc", "description") && <div style={{ fontFamily: body, fontSize: 13.5, color: MUT, lineHeight: 1.55, marginTop: 5 }}>{secItemStr(it, "desc", "description")}</div>}
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
    const richList = secArr(rich, "hotels").length ? secArr(rich, "hotels") : secArr(rich, "items");
    const r0 = richList[0];
    const name = (r0 ? secItemStr(r0, "name") : "") || secStr(h, "name");
    const stars = r0 && typeof r0.stars === "number" ? (r0.stars as number) : (typeof h?.stars === "number" ? (h.stars as number) : 0);
    const blurb = (r0 ? secItemStr(r0, "note", "description", "blurb") : "") || secStr(h, "description") || pkg.hotelDescription || "";
    const features = r0 ? secStrArr(r0, "facilities").concat(secStrArr(r0, "features")) : secStrArr(h, "facilities");
    const stays = richList.length > 1
      ? richList.map((r, i) => ({ n: secItemStr(r, "name"), d: secItemStr(r, "location", "nights", "note"), img: secItemStr(r, "image") || mediaImgs[i === 0 ? 1 : 4] || mediaImgs[0] || cover })).filter((s) => s.n)
      : [];
    if (!blurb && !name) return null;
    const hero = mediaImgs[1] || mediaImgs[0] || cover;
    return (
      <Wrap style={{ background: BUTTER }} section="hotel">
        <SecHead kicker={L.sections.hotel} title={name || ar("Where you'll stay", "مكان إقامتك")} sub={blurb || undefined} />
        {stays.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 22 : 16 }}>
            {stays.map((s, i) => (
              <div key={i} style={{ background: CARD, borderRadius: RAD, overflow: "hidden", boxShadow: softer }}>
                {s.img && <Photo src={s.img} h={D ? 200 : 160} r={0} onClick={() => zoom(s.img)} />}
                <div style={{ padding: D ? "20px 24px" : "16px 18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
                    <div style={{ fontFamily: disp, fontSize: D ? 20 : 17, fontWeight: 700, color: INK }}>{s.n}</div>
                    {s.d && <Chip>{s.d}</Chip>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          hero && <Photo src={hero} h={D ? 360 : 220} onClick={() => zoom(hero)} />
        )}
        {(stars > 0 || features.length > 0) && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 20, justifyContent: "center" }}>
            {stars > 0 && <Chip tone="sky" icon={<span>★</span>}>{dig(stars)} {ar("star", "نجوم")}</Chip>}
            {features.map((f, i) => <Chip key={i} tone={i % 2 ? "butter" : "brand"}>{f}</Chip>)}
          </div>
        )}
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
        <SecHead kicker={L.sections.inclusions} title={ar("What's covered", "ما هو مشمول")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 18 : 14 }}>
          {includes.length > 0 && (
            <div style={{ background: CARD, borderRadius: RAD, padding: D ? 28 : 22, boxShadow: softer }}>
              <div style={{ marginBottom: 14 }}><Chip icon={<span>✓</span>}>{L.ui.included}</Chip></div>
              {includes.map((it, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "11px 0", borderTop: i ? `1px solid ${RULE}` : "none", alignItems: "flex-start" }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={brand} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" style={{ marginTop: 2, flexShrink: 0 }}><path d="M20 6L9 17l-5-5" /></svg>
                  <span style={{ fontFamily: body, fontSize: 14.5, color: INK, lineHeight: 1.5 }}>{it}</span>
                </div>
              ))}
            </div>
          )}
          {excludes.length > 0 && (
            <div style={{ background: SKY, borderRadius: RAD, padding: D ? 28 : 22 }}>
              <div style={{ marginBottom: 14 }}><Label color={FAINT}>{L.ui.notIncluded}</Label></div>
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
      <Wrap style={{ background: SKY }} section="meals">
        <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1.1fr" : "1fr", gap: D ? 48 : 24 }}>
          <SecHead kicker={L.sections.meals} title={planLabel} />
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
        <SecHead kicker={L.sections.visa} title={VISA_HEAD[included]?.[lang] || ar("Visa & entry", "التأشيرة والدخول")} />
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
      <Wrap style={{ background: BUTTER }} section="transfers">
        <SecHead kicker={L.sections.transfers} title={ar("Getting around, sorted", "تنقّلكم مُؤمَّن بالكامل")} sub={items.length ? undefined : desc} />
        {items.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 18 : 12 }}>
            {items.map((t, i) => (
              <div key={i} style={{ background: CARD, borderRadius: RAD, padding: D ? 26 : 20, boxShadow: softer }}>
                <span style={{ fontFamily: disp, fontSize: D ? 17 : 15, fontWeight: 700, color: brand, background: faRgba(brand, 0.1), width: 38, height: 38, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>{dig(i + 1)}</span>
                <div style={{ fontFamily: disp, fontSize: D ? 18 : 16, fontWeight: 700, color: INK, letterSpacing: rtl ? 0 : "-0.3px", margin: "12px 0 6px" }}>{secItemStr(t, "leg", "title", "name", "text")}</div>
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
    const statusChip = (spots: number) => {
      if (spots <= 0) return <Label color={FAINT}>{L.ui.soldOut}</Label>;
      return <Chip tone={spots <= 3 ? "butter" : "brand"}>{dig(spots)} {L.ui.seatsLeft}</Chip>;
    };
    return (
      <Wrap id="fa-departures" section="departures">
        <SecHead kicker={L.sections.departures} title={ar("Pick your departure", "اختر موعد مغادرتك")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 18 : 12 }}>
          {rows.map((r, i) => {
            const spots = typeof r.spots === "number" ? r.spots : Number(r.spots) || 0; const sold = spots <= 0;
            const from = secItemStr(r, "origin", "from"); const date = secItemStr(r, "date");
            const dep = secItemStr(r, "flyingTime"); const arrt = secItemStr(r, "arrivingTime"); const price = secItemStr(r, "price");
            return (
              <div key={i} style={{ background: CARD, borderRadius: RAD, padding: D ? 26 : 20, boxShadow: softer, opacity: sold ? 0.6 : 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <Label>{dig(date)}</Label>
                  {price && <div style={{ fontFamily: disp, fontSize: D ? 24 : 21, fontWeight: 700, color: brand }}>{dig(price)}</div>}
                </div>
                <div style={{ fontFamily: disp, fontSize: D ? 18 : 16, fontWeight: 700, color: INK, marginTop: 8 }}>{from || dig(date)}</div>
                {(dep || arrt) && <div style={{ fontFamily: body, fontSize: 12.5, color: MUT, marginTop: 3 }}>{dig(dep)}{arrt ? ` → ${dig(arrt)}` : ""}</div>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${RULE}`, marginTop: 14, paddingTop: 14 }}>
                  {statusChip(spots)}
                  {!sold && pkg.whatsapp && <Primary onClick={onWhatsApp}>{L.ui.book}</Primary>}
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
      <Wrap style={{ background: SKY }} id="fa-pricing" section="pricing">
        <SecHead kicker={L.sections.pricing} title={ar("Choose your room", "اختر غرفتك")} />
        {tiers.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: D ? `repeat(${Math.min(tiers.length, 3)},1fr)` : "1fr", gap: D ? 18 : 12 }}>
            {tiers.map((t, i) => {
              const featured = tiers.length === 3 && i === 1;
              return (
                <div key={i} style={{ background: featured ? brand : CARD, color: featured ? onBrand : INK, borderRadius: RAD, padding: D ? 30 : 24, position: "relative", boxShadow: featured ? soft : softer }}>
                  {featured && <div style={{ position: "absolute", insetInlineEnd: 22, top: -12 }}><span style={{ fontFamily: disp, fontSize: 11.5, fontWeight: 700, color: brand, background: "#fff", borderRadius: 100, padding: "5px 12px", boxShadow: softer }}>★ {L.ui.mostPopular}</span></div>}
                  <div style={{ fontFamily: disp, fontSize: D ? 22 : 19, fontWeight: 700 }}>{localizeTierLabel(t.label, lang)}</div>
                  <div style={{ fontFamily: disp, fontSize: D ? 42 : 34, fontWeight: 700, marginTop: 16 }}>{dig(t.price)}</div>
                  <div style={{ marginTop: 4, fontFamily: body, fontSize: 12.5, opacity: 0.7 }}>{L.ui.perPerson}</div>
                  {pkg.whatsapp && <div style={{ marginTop: 20 }}><Primary full ghost={!featured} onClick={onWhatsApp}>{L.ui.book}</Primary></div>}
                </div>
              );
            })}
          </div>
        )}
        {(cancellation.length > 0 || schedule.length > 0) && (
          <div style={{ display: "grid", gridTemplateColumns: D ? "1fr 1fr" : "1fr", gap: D ? 40 : 22, marginTop: tiers.length ? 36 : 0 }}>
            {cancellation.length > 0 && (
              <div style={{ background: CARD, borderRadius: RAD, padding: D ? 26 : 20, boxShadow: softer }}>
                <div style={{ marginBottom: 12 }}><Label color={brand}>{L.ui.cancellation}</Label></div>
                {cancellation.map((s, i) => <div key={i} style={{ fontFamily: body, fontSize: 13.5, color: MUT, padding: "9px 0", lineHeight: 1.5, borderTop: i ? `1px solid ${RULE}` : "none", display: "flex", gap: 10 }}><span style={{ color: brand }}>♥</span> {s}</div>)}
              </div>
            )}
            {schedule.length > 0 && (
              <div style={{ background: CARD, borderRadius: RAD, padding: D ? 26 : 20, boxShadow: softer }}>
                <div style={{ marginBottom: 12 }}><Label color={brand}>{L.ui.paymentSchedule}</Label></div>
                {schedule.map((s, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "11px 0", borderTop: i ? `1px solid ${RULE}` : "none" }}>
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
        <SecHead kicker={L.sections.extras} title={ar("Nice little add-ons", "إضافات لطيفة")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 18 : 12 }}>
          {items.map((e, i) => (
            <div key={i} style={{ background: CARD, borderRadius: RAD, padding: D ? 26 : 20, boxShadow: softer }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10, gap: 10 }}>
                <div style={{ fontFamily: disp, fontSize: D ? 18 : 16, fontWeight: 700, color: INK }}>{secItemStr(e, "name", "title")}</div>
                {secItemStr(e, "price") && <span style={{ fontFamily: disp, fontSize: D ? 17 : 15, fontWeight: 700, color: onBrand, background: brand, borderRadius: 100, padding: "4px 12px", whiteSpace: "nowrap" }}>{dig(secItemStr(e, "price"))}</span>}
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
      <Wrap style={{ background: BUTTER }} section="people">
        <SecHead kicker={L.sections.people} title={ar("Meet your family host", "تعرّف على مضيف عائلتك")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "auto 1fr" : "1fr", gap: D ? 40 : 22, alignItems: "center" }}>
          {person.photo
            ? <Photo src={person.photo} h={D ? 280 : 240} r={RAD} />
            : <div style={{ width: D ? 240 : 200, height: D ? 280 : 240, background: CARD, borderRadius: RAD, boxShadow: soft, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: disp, fontSize: D ? 90 : 64, fontWeight: 700, color: brand }}>{person.name[0]}</div>}
          <div>
            <div style={{ fontFamily: disp, fontSize: D ? 30 : 25, fontWeight: 700, color: INK, letterSpacing: rtl ? 0 : "-0.6px" }}>{person.name}</div>
            {role && <div style={{ marginTop: 8 }}><Chip>{role}</Chip></div>}
            {bio && <p style={{ fontFamily: body, fontSize: 14.5, color: MUT, lineHeight: 1.75, marginTop: 16 }}>{bio}</p>}
            {pquote && <div style={{ fontFamily: disp, fontSize: D ? 20 : 17, fontWeight: 600, color: brand, marginTop: 16, lineHeight: 1.5 }}>&ldquo;{pquote}&rdquo;</div>}
            {(years > 0 || trips > 0) && (
              <div style={{ display: "flex", gap: 14, marginTop: 22, flexWrap: "wrap" }}>
                {years > 0 && <Chip tone="sky">{dig(years)} {L.ui.years}</Chip>}
                {trips > 0 && <Chip tone="sky">{dig(trips)} {L.ui.trips}</Chip>}
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
      <Wrap id="fa-reviews" section="reviews">
        <SecHead kicker={L.sections.reviews} title={ar("What parents tell us", "ما يخبرنا به الآباء")} center />
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 14, marginBottom: D ? 32 : 22 }}>
          <span style={{ fontFamily: disp, fontSize: D ? 40 : 32, fontWeight: 700, color: brand }}>{dig(rating)}</span>
          <FaStars n={Math.round(rating)} size={16} color={brand} />
          <Label>{dig(count)} {L.ui.review}</Label>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 18 : 12 }}>
          {items.slice(0, 6).map((r, i) => (
            <div key={i} style={{ background: CARD, borderRadius: RAD, padding: D ? 26 : 22, boxShadow: softer }}>
              <FaStars n={Math.round(r.rating || 5)} size={14} color={brand} />
              <p style={{ fontFamily: body, fontSize: D ? 15 : 14, color: INK, lineHeight: 1.65, margin: "12px 0 16px" }}>&ldquo;{r.text}&rdquo;</p>
              <div style={{ fontFamily: disp, fontSize: 15, fontWeight: 700, color: INK }}>{r.name}</div>
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
    const total = sc.totalSpots && sc.totalSpots > 0 ? sc.totalSpots : Math.max(sc.spotsRemaining, 10);
    const filled = Math.max(0, total - sc.spotsRemaining);
    return (
      <Wrap style={{ background: SKY }} section="scarcity">
        <div style={{ background: CARD, borderRadius: 28, padding: D ? 44 : 26, boxShadow: soft }}>
          <div style={{ display: "grid", gridTemplateColumns: D ? "1.2fr 1fr" : "1fr", gap: D ? 44 : 24, alignItems: "center" }}>
            <div>
              <div style={{ marginBottom: 16 }}><Chip tone="butter" icon={<span>◷</span>}>{L.sections.scarcity}</Chip></div>
              <h2 style={{ fontFamily: disp, fontSize: D ? 32 : 24, fontWeight: 700, lineHeight: 1.2, letterSpacing: rtl ? 0 : "-0.5px", margin: 0, color: INK }}>{L.ui.spotsLine(sc.spotsRemaining)}</h2>
              <p style={{ fontFamily: body, fontSize: D ? 16 : 14.5, color: MUT, lineHeight: 1.7, margin: "18px 0 0" }}>{L.ui.scarcityWindow}</p>
            </div>
            <div style={{ background: BUTTER, borderRadius: RAD, padding: D ? 30 : 22 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <div><div style={{ fontFamily: disp, fontSize: D ? 54 : 42, fontWeight: 700, color: brand, lineHeight: 1 }}>{dig(sc.spotsRemaining)}</div><Label>{L.ui.seatsLeft} / {dig(total)}</Label></div>
                {sc.firstDepartureDate && <div style={{ textAlign: "end" }}><Label>{L.ui.nextDeparture}</Label><div style={{ fontFamily: disp, fontSize: D ? 22 : 18, fontWeight: 700, color: INK, marginTop: 4 }}>{dig(sc.firstDepartureDate)}</div></div>}
              </div>
              {total <= 20 && (
                <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                  {Array.from({ length: total }).map((_, i) => (
                    <span key={i} style={{ flex: 1, height: 10, borderRadius: 100, background: i < filled ? faRgba(brand, 0.25) : brand }} />
                  ))}
                </div>
              )}
              {pkg.whatsapp && <div style={{ marginTop: 22 }}><Primary full big onClick={onWhatsApp}>{L.ui.holdDates}</Primary></div>}
            </div>
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
        <SecHead kicker={L.sections.agency} title={agency.name} sub={agency.tagline} />
        <div style={{ display: "grid", gridTemplateColumns: D && image ? "1.3fr 1fr" : "1fr", gap: D ? 48 : 24, alignItems: "start" }}>
          {story && <p style={{ fontFamily: body, fontSize: D ? 16 : 14.5, color: MUT, lineHeight: 1.85, margin: 0, whiteSpace: "pre-line" }}>{story}</p>}
          {image && <Photo src={image} h={D ? 300 : 220} />}
        </div>
      </Wrap>
    );
  };

  // ════════ NOTES ════════
  const Notes = () => {
    const items = secMixed(findSec(pkg, "important_notes"), "items");
    if (!items.length) return null;
    return (
      <Wrap style={{ background: BUTTER }} section="important_notes">
        <SecHead kicker={L.sections.notes} title={ar("Good to know", "معلومات تهمّك")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 18 : 12 }}>
          {items.map((n, i) => {
            const t = secItemStr(n, "title");
            const body2 = secItemStr(n, "text", "desc", "description") || (typeof n === "string" ? n : "");
            return (
              <div key={i} style={{ background: CARD, borderRadius: RAD, padding: D ? 26 : 20, boxShadow: softer }}>
                {t && <div style={{ fontFamily: disp, fontSize: D ? 18 : 16, fontWeight: 700, color: INK, letterSpacing: rtl ? 0 : "-0.3px", marginBottom: 7 }}>{t}</div>}
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
        <SecHead kicker={L.sections.faq} title={ar("Questions, answered", "إجابات على أسئلتك")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(2,1fr)" : "1fr", gap: D ? 16 : 12 }}>
          {items.map((f, i) => (
            <div key={i} style={{ background: CARD, borderRadius: RAD, padding: D ? 26 : 20, boxShadow: softer }}>
              <div style={{ fontFamily: disp, fontSize: D ? 18 : 16, fontWeight: 700, color: INK, letterSpacing: rtl ? 0 : "-0.3px", lineHeight: 1.3, marginBottom: 8 }}>{secItemStr(f, "question", "q")}</div>
              {secItemStr(f, "answer", "a") && <p style={{ fontFamily: body, fontSize: 14, color: MUT, lineHeight: 1.7, margin: 0 }}>{secItemStr(f, "answer", "a")}</p>}
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
      <Wrap style={{ background: brand }} section="custom">
        <div style={{ display: "grid", gridTemplateColumns: D && image ? "1.3fr 1fr" : "1fr", gap: D ? 48 : 22, alignItems: "center" }}>
          <div>
            <div style={{ marginBottom: 14 }}><Label color={faRgba(onBrand, 0.7)}>{L.sections.custom}</Label></div>
            {heading && <H2 light size={D ? 38 : 26}>{heading}</H2>}
            {text && <p style={{ fontFamily: body, fontSize: D ? 17 : 15, color: faRgba(onBrand, 0.9), lineHeight: 1.75, margin: "18px 0 0", whiteSpace: "pre-line" }}>{text}</p>}
          </div>
          {image && <Photo src={image} h={D ? 300 : 200} onClick={() => zoom(image)} />}
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
        <SecHead kicker={L.sections.others} title={ar("More family trips", "رحلات عائلية أخرى")} />
        <div style={{ display: "grid", gridTemplateColumns: D ? "repeat(3,1fr)" : "1fr", gap: D ? 18 : 14 }}>
          {list.map((o, i) => {
            const oTitle = secItemStr(o, "title"); const place = secItemStr(o, "destination", "place");
            const price = secItemStr(o, "price"); const oNights = secItemStr(o, "nights");
            const img = secItemStr(o, "image"); const link = secItemStr(o, "link");
            const Inner = (
              <div style={{ background: CARD, borderRadius: RAD, overflow: "hidden", boxShadow: softer, height: "100%" }}>
                <div style={{ position: "relative", height: D ? 170 : 150, background: SKY }}>
                  {img && <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                  {place && <div style={{ position: "absolute", insetInlineStart: 12, top: 12 }}><span style={{ fontFamily: disp, fontSize: 11.5, fontWeight: 700, color: INK, background: "rgba(255,255,255,0.94)", borderRadius: 100, padding: "5px 12px" }}>{place}</span></div>}
                </div>
                <div style={{ padding: D ? 20 : 18 }}>
                  <div style={{ fontFamily: disp, fontSize: D ? 19 : 17, fontWeight: 700, color: INK, letterSpacing: rtl ? 0 : "-0.3px", lineHeight: 1.2 }}>{oTitle}</div>
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
      <Wrap pt={D ? 72 : 44} pb={D ? 72 : 44} style={{ background: BUTTER, textAlign: "center" }}>
        <Label color={brand}>{L.ui.badge}</Label>
        <div style={{ fontFamily: disp, fontSize: D ? 46 : 30, fontWeight: 700, lineHeight: 1.1, letterSpacing: rtl ? 0 : "-1px", maxWidth: 720, margin: "14px auto 0", color: INK }}>{L.ui.closer}</div>
        <div style={{ fontFamily: body, fontSize: 14, color: MUT, margin: "16px 0 26px" }}>{L.ui.replyTime}{pkg.whatsapp ? ` · ${dig(pkg.whatsapp)}` : ""}</div>
        <div style={{ display: "inline-flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          {pkg.whatsapp && <Primary big onClick={onWhatsApp}>{L.ui.bookWhatsapp}</Primary>}
          {pkg.messenger && onMessenger && <Primary big ghost onClick={onMessenger}>{L.ui.messenger}</Primary>}
        </div>
      </Wrap>
      <div style={{ padding: `22px ${px}px`, display: "flex", justifyContent: "space-between", alignItems: "center", background: CARD }}>
        <div style={{ fontFamily: disp, fontSize: 18, fontWeight: 700, color: INK }}>{agency.name}</div>
        <Label>{L.ui.poweredBy}</Label>
      </div>
    </div>
  );

  // ════════ BAR ════════
  const Bar = () => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: `0 ${px}px`, height: D ? 62 : 56, background: faRgba(PAPER, 0.92), backdropFilter: "blur(10px)", position: "sticky", top: 0, zIndex: 30, borderBottom: `1px solid ${RULE}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ width: 26, height: 26, borderRadius: 9, background: brand, display: "flex", alignItems: "center", justifyContent: "center", color: onBrand, fontSize: 14 }}>♥</span>
        <span style={{ fontFamily: disp, fontSize: D ? 19 : 17, fontWeight: 700, color: INK, letterSpacing: rtl ? 0 : "-0.3px" }}>{agency.name}</span>
      </div>
      {D ? (
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          {navItems.map(([key, lbl]) => <button key={key} onClick={() => goTo(key)} style={{ fontFamily: disp, fontSize: 13, fontWeight: 600, color: MUT, background: "none", border: "none", cursor: "pointer", padding: 0 }}>{lbl}</button>)}
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
export function TemplateFamilyCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
