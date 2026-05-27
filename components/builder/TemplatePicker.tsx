"use client";

import { useState, useEffect } from "react";
import Icon from "@/components/Icon";
import { TEMPLATES } from "@/components/templates";
import { PRESETS } from "@/lib/sections/presets";
import type { AnySectionInstance } from "@/lib/sections/types";
import {
  DA_BG, DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2, DA_GOLD, DA_GOLD_SOFT, DA_GOLD_DEEP, DA_GREEN,
} from "@/lib/tokens";

const DISPLAY = `var(--font-instrument-serif), Georgia, serif`;
const SANS = `var(--font-inter-tight), system-ui, sans-serif`;
const MONO = `"JetBrains Mono", ui-monospace, "SF Mono", Menlo, monospace`;

// ─── Static mini renders — colors sourced directly from each template's constants ────

// Aurora: bg #efeae1, ink #1a1f2c, brand #8a6a3a (warm gold-brown)
function MiniAurora({ isAr }: { isAr: boolean }) {
  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ background: "#efeae1", height: "100%", display: "flex", flexDirection: "column", fontFamily: '"Inter", sans-serif' }}>
      <div style={{ height: 7, background: "#1a1f2c" }} />
      <div style={{ padding: "8px 12px 0", fontSize: 7, fontWeight: 600, color: "#8a6a3a", letterSpacing: 1.2, textTransform: "uppercase" }}>
        {isAr ? "مرايا · بوتيك" : "Maraya · Boutique"}
      </div>
      <div style={{ height: 72, margin: "10px 12px 0", background: "linear-gradient(135deg, #4a8fb8 0%, #1f5378 100%)", borderRadius: 4 }} />
      <div style={{ padding: "10px 12px 0" }}>
        <div style={{ fontSize: 6.5, color: "#8a6a3a", fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
          {isAr ? "5 ليالٍ · €388" : "5 NIGHTS · €388"}
        </div>
        <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 14, color: "#1a1f2c", marginTop: 4, letterSpacing: -.3, lineHeight: 1.05 }}>
          {isAr ? "اكتشف مالطا هذا الصيف" : "Discover Malta this summer"}
        </div>
        <div style={{ fontSize: 6.5, color: "rgba(26,31,44,0.6)", marginTop: 5, lineHeight: 1.4 }}>
          {isAr ? "ضوء البحر الأبيض المتوسط، نزهات الميناء، وفندق داخل أسوار المدينة القديمة." : "Mediterranean light, harbour walks, and a hotel inside the old citadel walls."}
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ margin: "0 12px 10px", padding: "6px 0", background: "#25D366", borderRadius: 4, fontSize: 7, color: "#fff", fontWeight: 600, textAlign: "center" }}>
        {isAr ? "تواصل معنا" : "Contact us"}
      </div>
    </div>
  );
}

// Voyage: bg #0a0b0c, fg #f5f3ed, acid #d6f43d, pink #ff3e6e
function MiniVoyage({ isAr }: { isAr: boolean }) {
  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ background: "#0a0b0c", height: "100%", color: "#f5f3ed", fontFamily: '"Inter", sans-serif', display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "8px 12px", fontSize: 7, fontWeight: 700, color: "#d6f43d", letterSpacing: 1 }}>VOYAGE</div>
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 4, margin: "0 12px", flex: 1 }}>
        <div style={{ background: "linear-gradient(135deg, #ff3e6e 0%, #b52048 100%)", borderRadius: 4 }} />
        <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", gap: 4 }}>
          <div style={{ background: "linear-gradient(135deg, #d6f43d 0%, #a8be1a 100%)", borderRadius: 4 }} />
          <div style={{ background: "linear-gradient(135deg, #4d6bff 0%, #2a3acc 100%)", borderRadius: 4 }} />
        </div>
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: -.4, lineHeight: 1 }}>
          {isAr ? <>4 مدن. <span style={{ color: "#d6f43d" }}>10 أيام.</span></> : <>4 cities. <span style={{ color: "#d6f43d" }}>10 days.</span></>}
        </div>
        <div style={{ fontSize: 7, color: "rgba(245,243,237,0.55)", marginTop: 6 }}>
          {isAr ? "€899 · رحلة قطار بين المدن" : "€899 · interrail-style"}
        </div>
      </div>
      <div style={{ height: 5, background: "#d6f43d" }} />
    </div>
  );
}

// Pulse: bg #faf8f3, ink #0c1118, deal #e2492a, trust #16654a
function MiniPulse({ isAr }: { isAr: boolean }) {
  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ background: "#faf8f3", height: "100%", fontFamily: '"Inter", sans-serif', display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "6px 12px", background: "#e2492a", color: "#fff", fontSize: 7, fontWeight: 700, letterSpacing: .5 }}>
        {isAr ? "● آخر 3 أماكن · الرحيل الجمعة" : "● LAST 3 SPOTS · DEPARTS FRI"}
      </div>
      <div style={{ padding: "12px 12px 0" }}>
        <div style={{ fontSize: 7, color: "#e2492a", fontWeight: 700 }}>
          {isAr ? "وفّر €420" : "SAVE €420"}
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 4 }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#0c1118", letterSpacing: -1 }}>€499</div>
          <div style={{ fontSize: 9, color: "rgba(12,17,24,0.6)", textDecoration: "line-through" }}>€919</div>
        </div>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#0c1118", marginTop: 6, lineHeight: 1.1 }}>
          {isAr ? "سردينيا · نهاية الأسبوع" : "Sardinia · weekend"}
        </div>
      </div>
      <div style={{ margin: "10px 12px", height: 4, background: "rgba(12,17,24,0.1)", borderRadius: 2, overflow: "hidden" }}>
        <div style={{ width: "34%", height: "100%", background: "#e2492a" }} />
      </div>
      <div style={{ padding: "0 12px", fontSize: 6.5, color: "rgba(12,17,24,0.6)" }}>
        {isAr ? "16 س 22 د 04 ث متبقية" : "16h 22m 04s remaining"}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ margin: "0 12px 10px", padding: "7px 0", background: "#0c1118", borderRadius: 4, fontSize: 7, color: "#fff", fontWeight: 700, textAlign: "center", letterSpacing: .3 }}>
        {isAr ? "احجز الآن" : "BOOK NOW"}
      </div>
    </div>
  );
}

// Sakina: bg #f6f3ea, ink #0d1b2e (navy), sage #1a5d4a, gold #b09142
function MiniSakina({ isAr }: { isAr: boolean }) {
  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ background: "#f6f3ea", height: "100%", fontFamily: '"Inter", sans-serif', display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px 12px 6px", textAlign: "center" }}>
        <div style={{ fontFamily: "serif", fontSize: 12, color: "#1a5d4a", fontWeight: 600 }}>﷽</div>
      </div>
      <div style={{ padding: "0 12px", textAlign: "center" }}>
        <div style={{ fontSize: 6.5, fontWeight: 700, color: "#1a5d4a", letterSpacing: 1.4 }}>عمرة المغرب</div>
        <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 14, color: "#0d1b2e", marginTop: 6, letterSpacing: -.3, lineHeight: 1.05 }}>
          {isAr ? "عمرة · 12 يوماً" : "Umrah · 12 days"}
        </div>
        <div style={{ fontSize: 6.5, color: "rgba(13,27,46,0.55)", marginTop: 6 }}>
          {isAr ? "مكة · المدينة · مجموعة من 24" : "Mecca · Medina · group of 24"}
        </div>
      </div>
      <div style={{ margin: "10px 12px", padding: 8, background: "#fcfaf3", border: "1px solid rgba(13,27,46,0.08)", borderRadius: 4, fontSize: 6.5, color: "#0d1b2e" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
          <span>{isAr ? "التأشيرة" : "Visa"}</span>
          <span style={{ color: "#1a5d4a", fontWeight: 600 }}>{isAr ? "مشمولة" : "Included"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
          <span>{isAr ? "المحرم" : "Mahram"}</span>
          <span style={{ color: "rgba(13,27,46,0.55)" }}>{isAr ? "مطلوب لمن دون 45" : "Required for <45"}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <span>{isAr ? "الوجبات" : "Meals"}</span>
          <span style={{ color: "#b09142", fontWeight: 600 }}>{isAr ? "نصف إقامة" : "Half board"}</span>
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ margin: "0 12px 10px", padding: "7px 0", background: "#1a5d4a", borderRadius: 4, fontSize: 7, color: "#fff", fontWeight: 600, textAlign: "center" }}>
        {isAr ? "احجز مقعداً" : "Reserve a seat"}
      </div>
    </div>
  );
}

// Petal: bg #faf3ef, ink #1a0d0d, rose #c8576f, clay #d4896a
function MiniPetal({ isAr }: { isAr: boolean }) {
  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ background: "#faf3ef", height: "100%", fontFamily: '"Inter", sans-serif', display: "flex", flexDirection: "column" }}>
      <div style={{ height: 72, margin: 12, background: "linear-gradient(135deg, #e8a0ab 0%, #c8576f 100%)", borderRadius: 50, position: "relative" }}>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, color: "#fff" }}>♥</div>
      </div>
      <div style={{ padding: "0 12px", textAlign: "center" }}>
        <div style={{ fontSize: 6.5, fontWeight: 600, color: "#c8576f", letterSpacing: 1.4, textTransform: "uppercase" }}>
          {isAr ? "شهر عسل · المالديف" : "Honeymoon · Maldives"}
        </div>
        <div style={{ fontFamily: '"Instrument Serif", Georgia, serif', fontStyle: "italic", fontSize: 13, color: "#1a0d0d", marginTop: 4, letterSpacing: -.3 }}>
          {isAr ? "أنتما وحدكما." : "Just the two of you."}
        </div>
        <div style={{ fontSize: 6.5, color: "rgba(26,13,13,0.52)", marginTop: 5 }}>
          {isAr ? "فيلا فوق الماء · 7 ليالٍ · €4,200 للزوجين" : "Overwater villa · 7 nights · €4,200/couple"}
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ margin: "0 12px 10px", padding: "7px 0", background: "#c8576f", borderRadius: 999, fontSize: 7, color: "#fff", fontWeight: 600, textAlign: "center" }}>
        {isAr ? "استفسار خاص" : "Enquire privately"}
      </div>
    </div>
  );
}

// Compass: bg #f2f0eb (light sandy!), ink #0d1b2e (navy), orange #b85c1f
function MiniCompass({ isAr }: { isAr: boolean }) {
  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ background: "#f2f0eb", height: "100%", color: "#0d1b2e", fontFamily: '"Inter", sans-serif', display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "8px 12px", display: "flex", justifyContent: "space-between", fontSize: 6.5, fontFamily: "monospace", color: "rgba(13,27,46,0.55)" }}>
        <span>N 32.7°</span><span>4,167 M</span>
      </div>
      <div style={{ margin: "0 12px", height: 70, background: "linear-gradient(135deg, #d4c8a8 0%, #b8a888 100%)", borderRadius: 4, position: "relative" }}>
        <svg viewBox="0 0 200 80" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
          <path d="M 10 60 Q 50 20, 90 40 T 190 25" stroke="#b85c1f" strokeWidth="1.5" fill="none" strokeDasharray="3 2" />
          <circle cx="10" cy="60" r="2.5" fill="#b85c1f" />
          <circle cx="190" cy="25" r="2.5" fill="#b85c1f" />
        </svg>
      </div>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontFamily: "monospace", fontSize: 6, color: "rgba(13,27,46,0.55)", letterSpacing: 1 }}>
          {isAr ? "رحلة استكشافية · 14 يوماً · صعبة" : "EXPEDITION · 14 DAYS · STRENUOUS"}
        </div>
        <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 14, color: "#0d1b2e", marginTop: 4, letterSpacing: -.3, lineHeight: 1.05 }}>
          {isAr ? "قمة توبقال" : "Toubkal Summit"}
        </div>
        <div style={{ fontSize: 6.5, color: "rgba(13,27,46,0.55)", marginTop: 5 }}>
          {isAr ? "112 كم · ارتفاع 6,800 م · 8 متسلقين" : "112 km · 6,800 m elevation · 8 climbers"}
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ margin: "0 12px 10px", padding: "7px 0", background: "#b85c1f", borderRadius: 4, fontSize: 7, color: "#fff", fontWeight: 600, textAlign: "center", letterSpacing: .5 }}>
        {isAr ? "انضم للرحلة" : "JOIN THE EXPEDITION"}
      </div>
    </div>
  );
}

// Atlas: bg #f5f3ee, ink #0d1b2e, serif headings (Cormorant), accent subtle green #3d5a40
function MiniAtlas({ isAr }: { isAr: boolean }) {
  const cities    = ["Paris", "Lyon", "Milan", "Roma"];
  const citiesAr  = ["باريس", "ليون", "ميلانو", "روما"];
  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ background: "#f5f3ee", height: "100%", fontFamily: '"DM Sans", sans-serif', display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px 12px" }}>
        <div style={{ fontSize: 6.5, fontWeight: 600, color: "rgba(13,27,46,0.55)", letterSpacing: 1.2 }}>
          {isAr ? "أوروبا · 4 مدن" : "EUROPE · 4 CITIES"}
        </div>
        <div style={{ fontFamily: '"Cormorant", "Instrument Serif", Georgia, serif', fontSize: 16, fontWeight: 600, color: "#0d1b2e", marginTop: 4, letterSpacing: -.5, lineHeight: 1 }}>
          {isAr ? "باريس ← روما" : "Paris → Roma"}
        </div>
      </div>
      <div style={{ margin: "0 12px", display: "flex", gap: 5, alignItems: "center", flex: 1 }}>
        {(isAr ? citiesAr : cities).map((c, i) => (
          <div key={c} style={{ display: "contents" }}>
            <div style={{ flex: 1, padding: 6, background: "#fafaf3", border: "1px solid rgba(13,27,46,0.08)", borderRadius: 3, textAlign: "center" }}>
              <div style={{ height: 28, background: `hsl(${120 + i * 20}, 20%, ${65 - i * 5}%)`, borderRadius: 2, marginBottom: 4 }} />
              <div style={{ fontSize: 6, fontWeight: 600, color: "#0d1b2e" }}>{c}</div>
            </div>
            {i < 3 && <span style={{ color: "rgba(13,27,46,0.35)", fontSize: 8 }}>{isAr ? "←" : "→"}</span>}
          </div>
        ))}
      </div>
      <div style={{ padding: "8px 12px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: '"Cormorant", Georgia, serif', fontSize: 12, fontWeight: 600, color: "#0d1b2e" }}>€1,899</span>
        <span style={{ fontSize: 7, padding: "4px 10px", background: "#0d1b2e", color: "#fff", borderRadius: 2 }}>
          {isAr ? "احجز" : "BOOK"}
        </span>
      </div>
    </div>
  );
}

// Tribe: bg #faf6ef, ink #0d1b2e, accent #c8862e (amber)
function MiniTribe({ isAr }: { isAr: boolean }) {
  const avatarColors = ["#c8862e", "#0d1b2e", "#1a5d4a", "#c8576f", "#b85c1f", "#1f5f8e"];
  const initials = ["A", "K", "S", "M", "R", "L"];
  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ background: "#faf6ef", height: "100%", fontFamily: '"Inter", sans-serif', display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px 12px 6px" }}>
        <div style={{ display: "flex", marginBottom: 8 }}>
          {avatarColors.map((c, i) => (
            <div key={i} style={{
              width: 16, height: 16, borderRadius: "50%", background: c,
              border: "1.5px solid #faf6ef", marginLeft: i === 0 ? 0 : -5,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 6, fontWeight: 700, color: "#fff",
            }}>{initials[i]}</div>
          ))}
          <div style={{ marginLeft: 5, fontSize: 6.5, fontWeight: 600, color: "rgba(13,27,46,0.55)", alignSelf: "center" }}>
            {isAr ? "+6 آخرين" : "+6 more"}
          </div>
        </div>
        <div style={{ fontSize: 6.5, fontWeight: 700, color: "#c8862e", letterSpacing: 1.2, textTransform: "uppercase" }}>
          {isAr ? "12 مسافراً · مجموعة صغيرة" : "12 TRAVELLERS · SMALL GROUP"}
        </div>
        <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 14, color: "#0d1b2e", marginTop: 4, letterSpacing: -.3, lineHeight: 1.05 }}>
          {isAr ? "وادي رم معاً" : "Wadi Rum together"}
        </div>
        <div style={{ fontSize: 6.5, color: "rgba(13,27,46,0.55)", marginTop: 5 }}>
          {isAr ? "بإشراف خالد · انطلاق 14 أكت" : "Hosted by Khalid · dep. Oct 14"}
        </div>
      </div>
      <div style={{ height: 50, margin: "8px 12px", background: "linear-gradient(135deg, #c8a870 0%, #7b6342 100%)", borderRadius: 4 }} />
      <div style={{ padding: "0 12px", display: "flex", justifyContent: "space-between", fontSize: 6.5, color: "rgba(13,27,46,0.55)" }}>
        <span>{isAr ? "€699/شخص" : "€699/person"}</span>
        <span style={{ fontWeight: 600, color: "#c8862e" }}>{isAr ? "4 أماكن متبقية" : "4 spots left"}</span>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ margin: "0 12px 10px", padding: "7px 0", background: "#c8862e", borderRadius: 4, fontSize: 7, color: "#fff", fontWeight: 600, textAlign: "center" }}>
        {isAr ? "انضم للمجموعة" : "Join the group"}
      </div>
    </div>
  );
}

// Smart: bg #fdfcf9, ink #0d1b2e, brand #1f5f8e (navy blue — NOT green)
function MiniSmart({ isAr }: { isAr: boolean }) {
  const rows = [
    { label: "Hotels.com", price: "€1,199", us: false },
    { label: "Booking",    price: "€1,089", us: false },
    { label: "Maraya",     price: "€799",   us: true  },
  ];
  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ background: "#fdfcf9", height: "100%", fontFamily: '"DM Sans", sans-serif', display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "10px 12px 0" }}>
        <div style={{ display: "inline-block", padding: "2px 7px", background: "#1f5f8e", color: "#fff", fontSize: 6, fontWeight: 700, letterSpacing: .8, borderRadius: 3 }}>
          {isAr ? "أفضل سعر • -34%" : "BEST VALUE • -34%"}
        </div>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#0d1b2e", marginTop: 5, letterSpacing: -.4, lineHeight: 1 }}>
          {isAr ? "بالي، 7 ليالٍ" : "Bali, 7 nights"}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, padding: "6px 12px 0" }}>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#0d1b2e", letterSpacing: -.8 }}>€799</div>
        <div style={{ fontSize: 7, color: "rgba(13,27,46,0.55)", textDecoration: "line-through" }}>€1,199</div>
      </div>
      <div style={{ margin: "8px 12px 0", border: "1px solid rgba(13,27,46,0.08)", borderRadius: 4, overflow: "hidden" }}>
        {rows.map((r, i) => (
          <div key={r.label} style={{ display: "flex", justifyContent: "space-between", padding: "4px 7px", fontSize: 6.5, background: r.us ? "rgba(31,95,142,0.08)" : "transparent", color: r.us ? "#1f5f8e" : "rgba(13,27,46,0.55)", fontWeight: r.us ? 700 : 400, borderBottom: i < 2 ? "1px solid rgba(13,27,46,0.06)" : "none" }}>
            <span>{r.label}</span><span>{r.price}</span>
          </div>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ margin: "0 12px 10px", padding: "7px 0", background: "#0d1b2e", borderRadius: 4, fontSize: 7, color: "#fff", fontWeight: 600, textAlign: "center" }}>
        {isAr ? "احجز بهذا السعر" : "Lock this rate"}
      </div>
    </div>
  );
}

// Family: bg #fefaf2, ink #0d1b2e, brand #c46a2f (amber-orange), accent-2 #3d5a8c (blue)
function MiniFamily({ isAr }: { isAr: boolean }) {
  const tags    = ["Pool", "Kids club", "Beach", "Buffet", "Spa"];
  const tagsAr  = ["مسبح", "نادي الأطفال", "شاطئ", "بوفيه", "سبا"];
  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ background: "#fefaf2", height: "100%", fontFamily: '"DM Sans", sans-serif', display: "flex", flexDirection: "column" }}>
      <div style={{ height: 50, margin: 12, background: "linear-gradient(135deg, #4d8fc0 0%, #3d5a8c 60%, #c46a2f 100%)", borderRadius: 6, position: "relative" }}>
        <div style={{ position: "absolute", top: 4, right: 4, padding: "1px 5px", background: "rgba(255,255,255,.92)", borderRadius: 999, fontSize: 5.5, fontWeight: 700, color: "#0d1b2e" }}>
          {isAr ? "الكل شامل" : "ALL-IN"}
        </div>
      </div>
      <div style={{ padding: "0 12px" }}>
        <div style={{ fontSize: 6.5, fontWeight: 700, color: "#c46a2f", letterSpacing: 1.2 }}>
          {isAr ? "2 بالغ · طفلان · الأطفال مجاناً" : "2 ADULTS · 2 KIDS · KIDS FREE"}
        </div>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#0d1b2e", marginTop: 4, letterSpacing: -.4, lineHeight: 1 }}>
          {isAr ? "منتجع الغردقة" : "Hurghada Resort"}
        </div>
      </div>
      <div style={{ display: "flex", gap: 4, margin: "6px 12px", flexWrap: "wrap" }}>
        {(isAr ? tagsAr : tags).map(tag => (
          <span key={tag} style={{ fontSize: 6, padding: "2px 6px", background: "#fff", borderRadius: 999, fontWeight: 600, color: "#0d1b2e", border: "1px solid rgba(13,27,46,0.1)" }}>{tag}</span>
        ))}
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ padding: "0 12px 6px", fontSize: 8, fontWeight: 700, color: "#0d1b2e" }}>
        {isAr ? "من €1,899 / للعائلة" : "From €1,899 / family"}
      </div>
      <div style={{ margin: "0 12px 10px", padding: "7px 0", background: "#c46a2f", borderRadius: 6, fontSize: 7.5, color: "#fff", fontWeight: 700, textAlign: "center" }}>
        {isAr ? "احجز رحلة العائلة" : "Book the family trip"}
      </div>
    </div>
  );
}

export const MINI_RENDERS: Record<string, (p: { isAr: boolean }) => React.JSX.Element> = {
  aurora:  MiniAurora,
  voyage:  MiniVoyage,
  pulse:   MiniPulse,
  sakina:  MiniSakina,
  petal:   MiniPetal,
  compass: MiniCompass,
  atlas:   MiniAtlas,
  tribe:   MiniTribe,
  smart:   MiniSmart,
  family:  MiniFamily,
};

// ─── Single template card ─────────────────────────────────────────────────────

function TemplateCard({
  templateId,
  name,
  nameAr,
  target,
  targetAr,
  popular,
  isNew,
  selected,
  lang,
  onPick,
}: {
  templateId: string;
  name: string;
  nameAr: string;
  target: string;
  targetAr: string;
  popular?: boolean;
  isNew?: boolean;
  selected: boolean;
  lang: "en" | "ar";
  onPick: () => void;
}) {
  const isAr = lang === "ar";
  const MiniRender = MINI_RENDERS[templateId] ?? MiniAurora;
  const miniProps = { isAr };

  return (
    <div
      onClick={onPick}
      style={{
        background: DA_SURFACE,
        border: `1px solid ${selected ? DA_GOLD : DA_RULE}`,
        borderRadius: 14,
        overflow: "hidden",
        position: "relative",
        boxShadow: selected ? `0 0 0 3px ${DA_GOLD_SOFT}` : "none",
        cursor: "pointer",
        transition: "border-color .15s, box-shadow .15s",
      }}
    >
      {/* Preview area — height adapts via CSS aspect-ratio trick */}
      <div style={{
        aspectRatio: "3 / 4",
        background: DA_BG,
        position: "relative",
        overflow: "hidden",
        borderBottom: `1px solid ${DA_RULE}`,
      }}>
        <div style={{
          position: "absolute", inset: 16,
          borderRadius: 6,
          overflow: "hidden",
          boxShadow: "0 4px 16px -4px rgba(0,0,0,.15), 0 0 0 1px rgba(0,0,0,.04)",
        }}>
          <MiniRender {...miniProps} />
        </div>

        {popular && (
          <div style={{
            position: "absolute", top: 12, left: 12,
            padding: "3px 8px",
            background: DA_INK1, color: DA_BG,
            borderRadius: 999,
            fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: .3,
          }}>
            {isAr ? "الأكثر استخداماً" : "Most picked"}
          </div>
        )}
        {isNew && (
          <div style={{
            position: "absolute", top: 12, left: 12,
            padding: "3px 8px",
            background: DA_GOLD, color: "#fff",
            borderRadius: 999,
            fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: .3,
          }}>
            {isAr ? "جديد" : "New"}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <div>
          <div style={{ fontFamily: DISPLAY, fontSize: 18, color: DA_INK1, letterSpacing: -.3, lineHeight: 1.1 }}>
            {isAr ? nameAr : name}
          </div>
          <div style={{ fontSize: 11.5, color: DA_INK2, marginTop: 2, fontFamily: SANS }}>
            {isAr ? targetAr : target}
          </div>
        </div>

        {selected ? (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "5px 10px", background: DA_GOLD, color: "#fff",
            borderRadius: 999, fontSize: 11.5, fontWeight: 600, fontFamily: SANS,
          }}>
            <Icon name="check" size={12} color="#fff" strokeWidth={2.5} />
            {isAr ? "نشط" : "Active"}
          </div>
        ) : (
          <button
            onClick={(e) => { e.stopPropagation(); onPick(); }}
            style={{
              padding: "6px 11px", background: DA_SURFACE2,
              border: `1px solid ${DA_RULE2}`, borderRadius: 7,
              color: DA_INK1, fontFamily: SANS, fontSize: 11.5, fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {isAr ? "اختر" : "Use this"}
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main gallery ─────────────────────────────────────────────────────────────

type AiExtractResult = {
  destination?: string;
  price?: string;
  nights?: string;
  titleEn?: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  primaryLanguage?: "en" | "ar";
  includes?: string[];
  suggestedTemplateId?: string;
};

type UserPreset = { id: string; name: string; sections: AnySectionInstance[]; createdAt: number };

const PRESET_TO_TEMPLATE: Record<string, string> = {
  umrah:          "sakina",
  city_break:     "atlas",
  cruise:         "voyage",
  day_tour:       "pulse",
  safari:         "compass",
  honeymoon:      "petal",
  multi_day_tour: "atlas",
  family_beach:   "family",
  europe_tour:    "atlas",
};

export function VisualTemplatePicker({
  selectedId,
  onStart,
  lang,
  isMobile,
  userId,
  onAiExtract,
  isEditMode,
  onCancel,
}: {
  selectedId: string;
  onStart: (templateId: string, tripTypeId: string | null, userPresetSections: AnySectionInstance[] | null) => void;
  lang: "en" | "ar";
  isMobile?: boolean;
  userId?: string;
  onAiExtract?: (result: AiExtractResult) => void;
  isEditMode?: boolean;
  onCancel?: () => void;
}) {
  const isAr = lang === "ar";
  const [localTemplateId, setLocalTemplateId] = useState(selectedId);
  const [localTripType, setLocalTripType] = useState<string | null>(null);
  const [localUserPreset, setLocalUserPreset] = useState<UserPreset | null>(null);
  const [aiText, setAiText] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [userPresets, setUserPresets] = useState<UserPreset[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/user-presets?userId=${encodeURIComponent(userId)}`)
      .then(r => r.ok ? r.json() : { presets: [] })
      .then(data => setUserPresets(data.presets ?? []));
  }, [userId]);

  const handleTripTypeClick = (presetId: string) => {
    const next = localTripType === presetId ? null : presetId;
    setLocalTripType(next);
    if (next) {
      setLocalUserPreset(null);
      const suggested = PRESET_TO_TEMPLATE[presetId];
      if (suggested) setLocalTemplateId(suggested);
    }
  };

  const handleUserPresetClick = (preset: UserPreset) => {
    const next = localUserPreset?.id === preset.id ? null : preset;
    setLocalUserPreset(next ?? null);
    if (next) setLocalTripType(null);
  };

  const handleStart = () => {
    if (localUserPreset) {
      onStart(
        localTemplateId,
        null,
        localUserPreset.sections.map((s, i) => ({
          ...s,
          id: `${s.type}_${Date.now()}_${i}`,
          order: i,
        })),
      );
    } else {
      onStart(localTemplateId, localTripType, null);
    }
  };

  const handleExtract = async () => {
    const text = aiText.trim();
    if (!text) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, userId: userId ?? "anonymous" }),
      });
      const data = await res.json();
      if (!res.ok) { setAiError(data.error || "Extraction failed."); return; }

      const lng: "en" | "ar" = data.language === "ar" ? "ar" : "en";
      const suggestedTemplateId = PRESET_TO_TEMPLATE[data.suggestedPreset ?? ""] ?? localTemplateId;

      const result: AiExtractResult = {
        destination:     data.destination    || undefined,
        price:           data.price          || undefined,
        nights:          data.nights         || undefined,
        titleEn:         lng === "en" ? (data.title || undefined)       : undefined,
        titleAr:         lng === "ar" ? (data.title || undefined)       : undefined,
        descriptionEn:   lng === "en" ? (data.description || undefined) : undefined,
        descriptionAr:   lng === "ar" ? (data.description || undefined) : undefined,
        primaryLanguage: lng,
        includes:        Array.isArray(data.advantages) ? data.advantages : undefined,
        suggestedTemplateId,
      };

      onAiExtract?.(result);
    } catch {
      setAiError(isAr ? "حدث خطأ. حاول مجدداً." : "Something went wrong. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const L = isAr ? {
    eyebrow: isEditMode ? "تغيير القالب" : "اختيار القالب",
    title: isEditMode ? "غيّر قالب الصفحة." : "اختر قالباً بعينيك",
    sub: isEditMode
      ? "اختر تصميماً مختلفاً لصفحة باقتك. محتواك وأقسامك لن تتغير."
      : "كل قالب مصمم لنوع رحلة محدّد. هذه معاينات حقيقية — ليس قائمة أسماء. ابدأ من قالب جاهز ثم خصّص كل شيء.",
    aiTitle: "أو ابدأ من نص جاهز",
    aiSub: "الصق وصف باقتك من رسالة واتساب أو خطة رحلة — سنستخرج التفاصيل ونقترح القالب المناسب.",
    aiCta: "استخراج بالذكاء الاصطناعي",
    aiPlaceholder: "الكانتي... المكان اللي بيرجعك نفسك 🌿☕ قهوة الصبح مع هدوء... 5 ليالٍ · يورو 422",
    builtIn: "القوالب المتاحة",
    tripTypeLabel: "نوع الرحلة",
    tripTypeSub: "اختياري — اختر نوع الرحلة لملء الأقسام المناسبة تلقائياً",
    savedSetsLabel: "مجموعات الأقسام المحفوظة",
    startBuilding: isEditMode ? "تطبيق القالب" : "ابدأ البناء",
    startBlank: "ابدأ بلوحة فارغة",
    backToEditing: "← العودة للتحرير",
  } : {
    eyebrow: isEditMode ? "Change template" : "Template",
    title: isEditMode ? "Change your page design." : "Choose with your eyes.",
    sub: isEditMode
      ? "Switch the visual style of your package page. Your content and sections stay untouched."
      : "Each template is designed for a kind of trip. These are real previews of what your page will look like — not just names. Start from one and customise everything.",
    aiTitle: "Or start from text you've already written",
    aiSub: "Paste a package description from WhatsApp or an itinerary — we'll extract the details and suggest the best template.",
    aiCta: "Extract with AI",
    aiPlaceholder: "Paste your package description here — any format, any language…",
    builtIn: "Templates",
    tripTypeLabel: "Trip type",
    tripTypeSub: "Optional — pick a trip type to pre-fill the right sections",
    savedSetsLabel: "Your saved section sets",
    startBuilding: isEditMode ? "Apply template" : "Start building →",
    startBlank: "Start from blank canvas",
    backToEditing: "← Back to editing",
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{
      flex: 1, padding: isMobile ? "24px 16px 48px" : "32px 40px 48px",
      background: DA_BG, overflowY: "auto",
      fontFamily: SANS,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <div style={{
          fontFamily: SANS, fontSize: 10.5, fontWeight: 600,
          letterSpacing: 1.5, textTransform: "uppercase", color: DA_INK3, marginBottom: 10,
        }}>
          {L.eyebrow}
        </div>
        <div style={{
          fontFamily: DISPLAY, fontSize: isMobile ? 28 : 42, fontWeight: 400,
          color: DA_INK1, letterSpacing: -1, lineHeight: 1,
        }}>
          {L.title}
        </div>
        <div style={{ fontSize: 14, color: DA_INK2, marginTop: 10, maxWidth: 620, lineHeight: 1.55 }}>
          {L.sub}
        </div>
      </div>

      {/* AI banner — hidden in edit mode */}
      {!isEditMode && <div style={{
        background: DA_SURFACE,
        border: `1px solid ${DA_RULE}`,
        borderRadius: 14, padding: isMobile ? 16 : 20, marginBottom: 28,
      }}>
        {/* Header row */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 12 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: DA_GOLD_SOFT, color: DA_GOLD,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <Icon name="sparkle" size={16} color={DA_GOLD} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: SANS, fontSize: isMobile ? 13.5 : 14, fontWeight: 600, color: DA_INK1 }}>{L.aiTitle}</div>
            <div style={{ fontSize: 12, color: DA_INK2, marginTop: 2, lineHeight: 1.5 }}>{L.aiSub}</div>
          </div>
        </div>

        {/* Textarea */}
        <textarea
          value={aiText}
          onChange={e => { setAiText(e.target.value); setAiError(null); }}
          placeholder={L.aiPlaceholder}
          rows={isMobile ? 4 : 3}
          style={{
            padding: 12,
            background: DA_SURFACE2,
            border: `1px solid ${aiError ? "#c0533a" : DA_RULE2}`,
            borderRadius: 9,
            fontFamily: MONO, fontSize: 11.5, color: DA_INK1, lineHeight: 1.5,
            width: "100%", resize: "vertical", outline: "none",
            boxSizing: "border-box",
          }}
          onFocus={e => { e.currentTarget.style.borderColor = DA_GOLD; }}
          onBlur={e => { e.currentTarget.style.borderColor = aiError ? "#c0533a" : DA_RULE2; }}
        />
        {aiError && (
          <div style={{ fontSize: 11.5, color: "#c0533a", marginTop: 5 }}>{aiError}</div>
        )}

        {/* Extract button */}
        <button
          onClick={handleExtract}
          disabled={!aiText.trim() || aiLoading}
          style={{
            marginTop: 10,
            width: isMobile ? "100%" : "auto",
            padding: isMobile ? "11px 14px" : "9px 14px",
            background: !aiText.trim() || aiLoading ? DA_SURFACE : DA_GOLD,
            color: !aiText.trim() || aiLoading ? DA_INK3 : "#fff",
            border: `1px solid ${!aiText.trim() || aiLoading ? DA_RULE2 : "transparent"}`,
            borderRadius: 9, fontFamily: SANS, fontSize: 12.5, fontWeight: 600,
            cursor: !aiText.trim() || aiLoading ? "not-allowed" : "pointer",
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
          }}
        >
          {aiLoading ? (
            <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5, borderTopColor: DA_GOLD }} />
          ) : (
            <Icon name="sparkle" size={13} color={!aiText.trim() ? DA_INK3 : "#fff"} />
          )}
          {L.aiCta}
        </button>
      </div>}

      {/* Grid label */}
      <div style={{
        fontSize: 11, fontFamily: SANS, fontWeight: 600, letterSpacing: 1.3,
        textTransform: "uppercase", color: DA_INK3, marginBottom: 14,
      }}>
        {L.builtIn} · {TEMPLATES.length}
      </div>

      {/* 5-column grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)",
        gap: 16,
        marginBottom: 28,
      }}>
        {TEMPLATES.map((tpl) => (
          <TemplateCard
            key={tpl.id}
            templateId={tpl.id}
            name={tpl.name}
            nameAr={tpl.nameAr}
            target={tpl.target}
            targetAr={tpl.targetAr}
            popular={["aurora", "voyage"].includes(tpl.id)}
            isNew={tpl.id === "sakina"}
            selected={tpl.id === localTemplateId}
            lang={lang}
            onPick={() => setLocalTemplateId(tpl.id)}
          />
        ))}
      </div>

      {/* Trip-type chips — hidden in edit mode */}
      {!isEditMode && <div style={{
        padding: "18px 20px",
        background: DA_SURFACE,
        border: `1px solid ${DA_RULE}`,
        borderRadius: 14,
        marginBottom: 10,
      }}>
        <div style={{
          display: "flex", alignItems: "baseline", gap: 10, marginBottom: 12,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: 1.2,
            textTransform: "uppercase" as const, color: DA_INK3,
          }}>
            {L.tripTypeLabel}
          </div>
          <div style={{ fontSize: 11.5, color: DA_INK3 }}>{L.tripTypeSub}</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
          {PRESETS.map((preset) => {
            const sel = localTripType === preset.id;
            return (
              <button
                key={preset.id}
                onClick={() => handleTripTypeClick(preset.id)}
                style={{
                  padding: "5px 13px",
                  borderRadius: 999,
                  background: sel ? DA_GOLD_SOFT : "transparent",
                  border: `1px solid ${sel ? DA_GOLD : DA_RULE2}`,
                  color: sel ? DA_GOLD_DEEP : DA_INK3,
                  fontSize: 12,
                  fontWeight: sel ? 600 : 400,
                  fontFamily: SANS,
                  cursor: "pointer",
                }}
              >
                {isAr ? preset.labelAr : preset.label}
              </button>
            );
          })}
        </div>
      </div>}

      {/* Saved section sets */}
      {userPresets.length > 0 && (
        <div style={{
          padding: "18px 20px",
          background: DA_SURFACE,
          border: `1px solid ${DA_RULE}`,
          borderRadius: 14,
          marginBottom: 10,
        }}>
          <div style={{
            fontSize: 11, fontWeight: 600, letterSpacing: 1.2,
            textTransform: "uppercase" as const, color: DA_INK3, marginBottom: 12,
          }}>
            {L.savedSetsLabel}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
            {userPresets.map((preset) => {
              const sel = localUserPreset?.id === preset.id;
              return (
                <button
                  key={preset.id}
                  onClick={() => handleUserPresetClick(preset)}
                  style={{
                    padding: "5px 13px",
                    borderRadius: 999,
                    background: sel ? DA_GOLD_SOFT : "transparent",
                    border: `1px solid ${sel ? DA_GOLD : DA_RULE2}`,
                    color: sel ? DA_GOLD_DEEP : DA_INK3,
                    fontSize: 12,
                    fontWeight: sel ? 600 : 400,
                    fontFamily: SANS,
                    cursor: "pointer",
                    display: "inline-flex", alignItems: "center", gap: 5,
                  }}
                >
                  {sel && <Icon name="check" size={10} color={DA_GOLD_DEEP} strokeWidth={2.5} />}
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* CTA */}
      <div style={{
        display: "flex", flexDirection: "column",
        alignItems: isMobile ? "stretch" : "center",
        gap: 10,
        paddingTop: 24, paddingBottom: 8,
      }}>
        <button
          onClick={handleStart}
          style={{
            padding: isMobile ? "13px 24px" : "12px 32px",
            background: DA_GOLD,
            border: "none",
            borderRadius: 10,
            color: "#fff",
            fontFamily: SANS,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            display: "inline-flex", alignItems: "center",
            justifyContent: "center", gap: 7,
          }}
        >
          <Icon name="sparkle" size={14} color="#fff" />
          {L.startBuilding}
        </button>
        {isEditMode ? (
          onCancel && (
            <button
              onClick={onCancel}
              style={{
                background: "none",
                border: `1px solid ${DA_RULE}`,
                borderRadius: 9,
                color: DA_INK3,
                fontFamily: SANS,
                fontSize: 12,
                cursor: "pointer",
                padding: isMobile ? "11px 24px" : "4px 8px",
                textAlign: "center",
              }}
            >
              {L.backToEditing}
            </button>
          )
        ) : (
          <button
            onClick={() => onStart(localTemplateId, null, null)}
            style={{
              background: "none",
              border: isMobile ? `1px solid ${DA_RULE}` : "none",
              borderRadius: isMobile ? 9 : 0,
              color: DA_INK3,
              fontFamily: SANS,
              fontSize: 12,
              cursor: "pointer",
              padding: isMobile ? "11px 24px" : "4px 8px",
              textAlign: "center",
            }}
          >
            {L.startBlank}
          </button>
        )}
      </div>
    </div>
  );
}
