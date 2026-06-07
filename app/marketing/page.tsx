"use client";

import { useState, useEffect } from "react";
import posthog from "posthog-js";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useLang, switchLang } from "@/hooks/useLang";
import { TRIAL_DAYS } from "@/lib/trial";
import { TEMPLATES } from "@/components/templates";
import { MINI_RENDERS } from "@/components/builder/TemplatePicker";
import { AuroraMiniPhone } from "@/components/builder/LivePreviewPhone";
import type { CoreForm } from "@/lib/sections/types";
import {
  DA_BG, DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2, DA_GOLD, DA_GOLD_DEEP, DA_GOLD_SOFT,
  DA_GREEN, DA_GREEN_SOFT, DA_DARK, DA_DANGER,
} from "@/lib/tokens";

const DISPLAY = "var(--lp-display, var(--font-instrument-serif), Georgia, serif)";
const SANS    = "var(--lp-sans, var(--font-inter-tight), system-ui, sans-serif)";
const MONO    = '"JetBrains Mono", ui-monospace, monospace';

const AGENCY_URL =
  process.env.NEXT_PUBLIC_AGENCY_URL ??
  (process.env.NODE_ENV === "development" ? "" : "https://agency.packmetrix.com");

// ── Sample package for hero visual ───────────────────────────────────────────

const MALTA_CORE: CoreForm = {
  titleEn: "Discover Malta this summer",
  titleAr: "اكتشف روعة مالطا هذا الصيف",
  destination: "Malta",
  price: "388",
  currency: "€",
  nights: "5",
  descriptionEn: "Mediterranean light, harbour walks, and a boutique stay inside the old citadel walls.",
  descriptionAr: "إضاءة البحر الأبيض المتوسط الساحرة، نزهات الميناء التاريخي، وإقامة راقية داخل أسوار القلعة العتيقة.",
  primaryLanguage: "en",
  whatsapp: "",
  messenger: "",
  coverImage: "",
};

const MALTA_HL_EN = ["Boutique citadel hotel", "Private guided curation", "Return flights included"];
const MALTA_HL_AR = ["فندق بوتيك داخل أسوار القلعة", "جولة إرشادية خاصة ومنتقاة", "تذاكر طيران ذهاب وإياب مشمولة"];

// Salalah package data — used in How-it-works step 4 mockup (ShotPublished)
const SALALAH_CORE: CoreForm = {
  titleEn: "Salalah khareef family escape",
  titleAr: "رحلة خريف صلالة العائلية المتكاملة",
  destination: "Salalah, Oman",
  price: "2,950",
  currency: "﷼",
  nights: "5",
  descriptionEn: "Misty mountains, dramatic waterfalls, and the green season — five nights for the whole family.",
  descriptionAr: "ضباب الجبال الساحر، الشلالات المتدفقة، وأجواء موسم الخريف الأخضر — خمس ليالٍ مريحة لجميع أفراد العائلة.",
  primaryLanguage: "ar",
  whatsapp: "",
  messenger: "",
  coverImage: "",
};
const SALALAH_HL_EN = ["4-star accommodation", "Private car with driver", "Curated Khareef excursions"];
const SALALAH_HL_AR = ["إقامة فاخرة فئة ٤ نجوم", "سيارة خاصة مع سائق طوال الرحلة", "جولات خريفية مخصصة للوجهة"];

// ── Shared icon SVGs ──────────────────────────────────────────────────────────

const ArrowSVG = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

const CheckSVG = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const SparkSVG = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

// ── Spot progress chip with pulsing dot ───────────────────────────────────────

function FoundingChip({ spotsRemaining, eyebrow }: { spotsRemaining: number | null; eyebrow: string }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 8,
      padding: "5px 11px 5px 9px",
      background: DA_SURFACE, border: `1px solid ${DA_RULE2}`,
      borderRadius: 999, fontFamily: SANS, fontSize: 12, fontWeight: 500, color: DA_INK2,
      boxShadow: "0 1px 2px rgba(0,0,0,.02)",
    }}>
      <span style={{ position: "relative", width: 8, height: 8, flexShrink: 0 }}>
        <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: DA_GOLD }} />
        <span style={{
          position: "absolute", inset: -3, borderRadius: "50%",
          background: DA_GOLD, opacity: 0.25,
          animation: "pm-pulse 1.6s ease-out infinite",
        }} />
      </span>
      {spotsRemaining !== null
        ? <span><span style={{ color: DA_INK1, fontWeight: 600 }}>{spotsRemaining}</span> {eyebrow}</span>
        : <span style={{ color: DA_INK2 }}>{eyebrow}</span>}
    </div>
  );
}

// ── Nav ───────────────────────────────────────────────────────────────────────

function LandingNav({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = isAr
    ? { nav: ["المزايا", "القوالب", "أمثلة حقيقية", "الأسعار"], login: "تسجيل الدخول", claim: "اشترك بـ 39 €" }
    : { nav: ["Features", "Templates", "Examples", "Pricing"], login: "Sign In", claim: "Lock in €39" };

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(244,240,232,.85)",
      backdropFilter: "saturate(160%) blur(10px)",
      borderBottom: `1px solid ${DA_RULE}`,
      padding: "14px 48px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      fontFamily: SANS,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          background: DA_INK1, color: DA_GOLD,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: DISPLAY, fontSize: 14, fontWeight: 400,
        }}>P</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 19, color: DA_INK1, letterSpacing: -0.2 }}>PackMetrix</div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {L.nav.map((n, i) => (
          <a key={i} href={`#${["product","templates","examples","pricing"][i]}`} style={{
            padding: "6px 12px",
            fontFamily: SANS, fontSize: 13, color: DA_INK2,
            cursor: "pointer", textDecoration: "none", borderRadius: 6,
          }}>{n}</a>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          display: "flex", padding: 3,
          background: DA_SURFACE, border: `1px solid ${DA_RULE2}`, borderRadius: 999,
          fontSize: 11.5, fontWeight: 500, fontFamily: SANS,
        }}>
          {(["EN", "عربي"] as const).map((l, i) => {
            const active = (lang === "en" && i === 0) || (lang === "ar" && i === 1);
            return (
              <div key={l} onClick={() => switchLang(i === 0 ? "en" : "ar")} style={{
                padding: "3px 10px", borderRadius: 999,
                background: active ? DA_INK1 : "transparent",
                color: active ? DA_BG : DA_INK2,
                cursor: "pointer", userSelect: "none",
              }}>{l}</div>
            );
          })}
        </div>
        <a href={`${AGENCY_URL}/login`} style={{ fontFamily: SANS, fontSize: 13, color: DA_INK1, fontWeight: 500, cursor: "pointer", textDecoration: "none", marginOuter: 4 }}>{L.login}</a>
        <a href={`${AGENCY_URL}/signup`} style={{
          padding: "8px 16px", background: DA_GOLD, color: "#fff",
          border: "none", borderRadius: 8,
          fontFamily: SANS, fontSize: 13, fontWeight: 600,
          display: "inline-flex", alignItems: "center", gap: 6,
          textDecoration: "none",
          boxShadow: "0 1px 2px rgba(0,0,0,.04), inset 0 1px 0 rgba(255,255,255,.15)",
        }}>{L.claim}<ArrowSVG size={13} /></a>
      </div>
    </div>
  );
}

function MobileLandingNav({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const [menuOpen, setMenuOpen] = useState(false);
  const L = isAr
    ? { nav: ["المزايا", "القوالب", "أمثلة حقيقية", "الأسعار"], login: "تسجيل الدخول", claim: "احجز بـ 39 €" }
    : { nav: ["Features", "Templates", "Examples", "Pricing"], login: "Sign In", claim: "Lock in €39" };
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 50, fontFamily: SANS }}>
      <div style={{
        background: "rgba(244,240,232,.9)",
        backdropFilter: "saturate(160%) blur(10px)",
        borderBottom: `1px solid ${DA_RULE}`,
        padding: "12px 16px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setMenuOpen(o => !o)}
            aria-label="Menu"
            style={{
              background: "none", border: "none", padding: 4, cursor: "pointer",
              display: "flex", flexDirection: "column", gap: 4.5, justifyContent: "center",
            }}
          >
            <span style={{ display: "block", width: 20, height: 1.5, background: DA_INK1, borderRadius: 2 }} />
            <span style={{ display: "block", width: 20, height: 1.5, background: DA_INK1, borderRadius: 2 }} />
            <span style={{ display: "block", width: 20, height: 1.5, background: DA_INK1, borderRadius: 2 }} />
          </button>
          <div style={{ fontFamily: DISPLAY, fontSize: 17, color: DA_INK1, letterSpacing: -0.2 }}>PackMetrix</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{
            display: "flex", padding: 2, background: DA_SURFACE,
            border: `1px solid ${DA_RULE2}`, borderRadius: 999,
            fontSize: 10.5, fontWeight: 500, fontFamily: SANS,
          }}>
            {(["EN", "عربي"] as const).map((l, i) => {
              const active = (lang === "en" && i === 0) || (lang === "ar" && i === 1);
              return (
                <div key={l} onClick={() => switchLang(i === 0 ? "en" : "ar")} style={{
                  padding: "3px 8px", borderRadius: 999,
                  background: active ? DA_INK1 : "transparent",
                  color: active ? DA_BG : DA_INK2,
                  cursor: "pointer", userSelect: "none",
                }} />
              );
            })}
          </div>
          <a href={`${AGENCY_URL}/login`} style={{
            fontFamily: SANS, fontSize: 12, color: DA_INK1, fontWeight: 500,
            textDecoration: "none",
          }}>{L.login}</a>
          <a href={`${AGENCY_URL}/signup`} style={{
            padding: "6px 12px", background: DA_GOLD, color: "#fff",
            border: "none", borderRadius: 7,
            fontFamily: SANS, fontSize: 12, fontWeight: 600,
            textDecoration: "none", cursor: "pointer",
          }}>{L.claim}</a>
        </div>
      </div>
      {menuOpen && (
        <div style={{
          background: "rgba(244,240,232,.97)",
          backdropFilter: "saturate(160%) blur(10px)",
          borderBottom: `1px solid ${DA_RULE}`,
          padding: "8px 0",
        }}>
          {L.nav.map((n, i) => (
            <a
              key={i}
              href={`#${["product","templates","examples","pricing"][i]}`}
              onClick={() => setMenuOpen(false)}
              style={{
                display: "block", padding: "11px 20px",
                fontFamily: SANS, fontSize: 15, color: DA_INK1, fontWeight: 500,
                textDecoration: "none", borderBottom: i < L.nav.length - 1 ? `1px solid ${DA_RULE}` : "none",
                textAlign: isAr ? "right" : "left",
              }}
            >{n}</a>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function LandingHero({ lang, spotsRemaining }: { lang: "en" | "ar"; spotsRemaining: number | null }) {
  const isAr = lang === "ar";
  const L = isAr ? {
    eyebrowSuffix: "مقعد متبقٍ فقط في عرض الإطلاق من أصل 50 مقعداً متاحاً",
    eyebrowFallback: "متبقي مقعد واحد فقط في عرض الإطلاق من أصل 50 مقعداً متاحاً",
    titleA: "اعرض وبِع باقاتك السياحية",
    titleB: "بأعلى احترافية تحت اسم هويتك المستقلة.",
    sub: "الصق تفاصيل برامجك المكتوبة عشوائياً، اختر قالباً فائق الجاذبية، وانشر صفحة هبوط تخصصية ومستضافة بالكامل على نطاقك الخاص — لتكون جاهزة للمشاركة الفورية مع مسافريك عبر قنوات التواصل، مع تتبع الزيارات والعملاء من نافذة واحدة مركبة ومحمية.",
    primary: "اشترك بسعر 39 € شهرياً مدى الحياة",
    demo: "احجز جلسة استشارية",
    secondary: "تصفح صفحة هبوط تجريبية حية",
    proofA: `فترة تجريبية حرة ومفتوحة لـ ${TRIAL_DAYS} أيام`,
    proofB: "سعر ثابت مدى الحياة · 79 € لاحقاً للشركات الجديدة",
    proofC: "بدون أي متطلبات لبطاقات ائتمانية",
  } : {
    keySuffix: "of 50 global launch locations locked",
    keyFallback: "1 early access strategic slot remains open from structural cap",
    titleA: "Transform static travel itineraries into",
    titleB: "high-converting landing pages under your standalone brand.",
    sub: "Drop in rough schedules, raw copywriting notes, or broadcast messages. Our dedicated builder structures variables, stitches visually beautiful travel sections, and deploys custom domains natively — ready to accelerate your client conversion pipelines.",
    primary: "Secure Launch Price Tier €39/mo",
    demo: "Request Product Demo Walkthrough",
    secondary: "Review live interactive example",
    proofA: `Risk-Free ${TRIAL_DAYS}-Day Premium Evaluation Window`,
    proofB: "Contractual lifetime price protection blueprint applied",
    proofC: "No transactional card entries requested upfront",
  };

  const eyebrow = spotsRemaining !== null
    ? (isAr ? `${spotsRemaining} ${L.eyebrowSuffix}` : `${spotsRemaining} ${L.keySuffix}`)
    : (isAr ? L.eyebrowFallback : L.keyFallback);

  return (
    <div id="product" style={{ padding: "64px 48px 80px", position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 80% 20%, rgba(176,138,62,.10), transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(176,138,62,.06), transparent 50%)",
      }} />
      <div style={{
        position: "relative", maxWidth: 1280, marginInline: "auto",
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center",
      }}>
        {/* Left: content */}
        <div>
          <FoundingChip spotsRemaining={null} eyebrow={eyebrow} />

          <h1 style={{
            margin: "22px 0 0",
            fontFamily: DISPLAY, fontSize: isAr ? 54 : 64, fontWeight: 400,
            color: DA_INK1, letterSpacing: -1.8, lineHeight: 1.08,
          }}>
            <div>{L.titleA}</div>
            <div style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleB}</div>
          </h1>

          <p style={{ marginTop: 22, maxWidth: 540, fontFamily: SANS, fontSize: 17, color: DA_INK2, lineHeight: 1.55 }}>{L.sub}</p>

          <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <a href={`${AGENCY_URL}/signup`} onClick={() => posthog.capture("cta_clicked", { cta: "signup", location: "hero", lang, device: "desktop" })} style={{
              padding: "14px 22px", background: DA_GOLD, color: "#fff",
              border: "none", borderRadius: 10,
              fontFamily: SANS, fontSize: 14.5, fontWeight: 600,
              display: "inline-flex", alignItems: "center", gap: 8,
              cursor: "pointer", textDecoration: "none",
              boxShadow: "0 2px 4px rgba(26,22,17,.08), 0 8px 24px -8px rgba(176,138,62,.4), inset 0 1px 0 rgba(255,255,255,.18)",
            }}>{L.primary}<ArrowSVG size={15} /></a>
            <a href="#demo" onClick={() => posthog.capture("demo_cta_clicked", { location: "hero", lang, device: "desktop" })} style={{
              padding: "13px 18px", background: "transparent",
              border: `1.5px solid ${DA_INK1}`, color: DA_INK1, borderRadius: 10,
              fontFamily: SANS, fontSize: 14.5, fontWeight: 600,
              display: "inline-flex", alignItems: "center", gap: 8,
              cursor: "pointer", textDecoration: "none",
            }}>{L.demo}<ArrowSVG size={13} /></a>
            <a href="#examples" style={{
              padding: "14px 6px", fontFamily: SANS, fontSize: 14, color: DA_INK1, fontWeight: 500,
              cursor: "pointer", textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 6,
            }}>{L.secondary}<ArrowSVG size={13} /></a>
          </div>

          <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            {[L.proofA, L.proofB, L.proofC].map((p, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 12.5, color: DA_INK2 }}>
                <span style={{ width: 16, height: 16, borderRadius: "50%", background: DA_GREEN_SOFT, color: DA_GREEN, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CheckSVG />
                </span>
                {p}
              </span>
            ))}
          </div>
        </div>

        {/* Right: hero visual — browser + phone */}
        <div dir="ltr" style={{ position: "relative", height: 480 }}>
          {/* Browser chrome mockup */}
          <div style={{
            position: "absolute", top: 0, left: 0,
            width: 480, background: "#0d0a06",
            borderRadius: 14, overflow: "hidden",
            boxShadow: "0 32px 80px -24px rgba(26,22,17,.30), 0 12px 32px -12px rgba(26,22,17,.12)",
            transform: "rotate(-1.5deg)", transformOrigin: "center",
          }}>
            <div style={{
              background: "#1a1410", padding: "10px 14px",
              display: "flex", alignItems: "center", gap: 8,
            }}>
              <div style={{ display: "flex", gap: 5 }}>
                {["#ff5f56", "#ffbd2e", "#27c93f"].map(c => (
                  <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                ))}
              </div>
              <div style={{
                flex: 1, marginLeft: 8, padding: "4px 10px",
                background: "rgba(255,255,255,.06)", borderRadius: 5,
                fontFamily: MONO, fontSize: 10.5, color: "rgba(255,255,255,.6)", letterSpacing: -0.2,
                display: "flex", alignItems: "center", gap: 5,
              }}>
                packages.maraya.travel/malta-discover
              </div>
            </div>
            {/* Mini template render — scaled up */}
            <div style={{ height: 340, overflow: "hidden", position: "relative" }}>
              <div style={{ transform: "scale(2.3)", transformOrigin: "top left", width: "43%", height: "43%" }}>
                {(() => { const M = MINI_RENDERS["aurora"]; return <M isAr={isAr} />; })()}
              </div>
            </div>
          </div>

          {/* Phone overlay */}
          <div style={{
            position: "absolute", bottom: -10, right: 0,
            width: 200, background: "#0d0a06",
            borderRadius: 22, padding: 10,
            boxShadow: "0 24px 60px -16px rgba(26,22,17,.32), 0 8px 20px -8px rgba(26,22,17,.16)",
            transform: "rotate(3deg)", transformOrigin: "center",
          }}>
            <div style={{ background: "#faf5e8", borderRadius: 14, overflow: "hidden", height: 360 }}>
              <AuroraMiniPhone
                core={MALTA_CORE}
                highlights={isAr ? MALTA_HL_AR : MALTA_HL_EN}
                lang={lang}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MobileLandingHero({ lang, spotsRemaining }: { lang: "en" | "ar"; spotsRemaining: number | null }) {
  const isAr = lang === "ar";
  const L = isAr ? {
    eyebrowSuffix: "مقعد متبقٍ فقط في عرض الإطلاق من أصل 50 مقعداً متاحاً",
    eyebrowFallback: "متبقي مقعد واحد فقط في عرض الإطلاق من أصل 50 مقعداً متاحاً",
    titleA: "اعرض وبِع باقاتك السياحية",
    titleB: "بأعلى احترافية تحت هويتك المستقلة.",
    sub: "الصق تفاصيل برامجك المكتوبة عشوائياً، اختر قالباً فائق الجاذبية، وانشر صفحة هبوط تخصصية ومستضافة بالكامل على نطاقك الخاص.",
    primary: "اشترك بسعر 39 € شهرياً مدى الحياة",
    demo: "احجز جلسة استشارية خاصة",
    secondary: "تصفح صفحة هبوط تجريبية حية",
    proof: [`فترة تجريبية لـ ${TRIAL_DAYS} أيام`, "سعر ثابت مدى الحياة · 79 € لاحقاً", "بدون بطاقات ائتمانية"],
  } : {
    keySuffix: "of 50 global launch slots locked down successfully",
    keyFallback: "1 residual strategic evaluation allocation maps open inside cap",
    titleA: "Deploys custom high-converting",
    titleB: "landing layouts built specifically around your operations roots.",
    sub: "Drop in messy text updates, pricing blocks, or messaging drafts. Build beautiful presentations and trace customer threads natively.",
    primary: "Secure Launch Price Tier €39/mo",
    demo: "Request consulting call",
    secondary: "Review live interactive example",
    proof: [`Risk-Free ${TRIAL_DAYS}-Day Test Loop`, "Lifetime price tier lock validation", "Zero financial card records requested"],
  };

  const eyebrow = spotsRemaining !== null
    ? (isAr ? `${spotsRemaining} ${L.eyebrowSuffix}` : `${spotsRemaining} ${L.keySuffix}`)
    : (isAr ? L.eyebrowFallback : L.keyFallback);

  return (
    <div id="product" style={{ padding: "28px 18px 36px", position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 0%, rgba(176,138,62,.08), transparent 50%)",
      }} />
      <div style={{ position: "relative" }}>
        <FoundingChip spotsRemaining={null} eyebrow={eyebrow} />

        <h1 style={{
          margin: "16px 0 0", fontFamily: DISPLAY, fontSize: isAr ? 34 : 38, fontWeight: 400,
          color: DA_INK1, letterSpacing: -1.1, lineHeight: 1.06,
        }}>
          <div>{L.titleA}</div>
          <div style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleB}</div>
        </h1>

        <p style={{ margin: "16px 0 0", fontFamily: SANS, fontSize: 16, color: DA_INK2, lineHeight: 1.55 }}>{L.sub}</p>

        <a href={`${AGENCY_URL}/signup`} onClick={() => posthog.capture("cta_clicked", { cta: "signup", location: "hero", lang, device: "mobile" })} style={{
          display: "flex", width: "100%", marginTop: 22, padding: "13px 0",
          background: DA_GOLD, color: "#fff",
          border: "none", borderRadius: 10,
          fontFamily: SANS, fontSize: 14, fontWeight: 600,
          alignItems: "center", justifyContent: "center", gap: 7,
          cursor: "pointer", textDecoration: "none", boxSizing: "border-box",
          boxShadow: "0 2px 4px rgba(26,22,17,.08), 0 8px 20px -6px rgba(176,138,62,.4), inset 0 1px 0 rgba(255,255,255,.18)",
        }}>{L.primary}<ArrowSVG size={14} /></a>

        <a href="#demo-m" onClick={() => posthog.capture("demo_cta_clicked", { location: "hero", lang, device: "mobile" })} style={{
          display: "flex", width: "100%", marginTop: 10, padding: "13px 0",
          background: "transparent", border: `1.5px solid ${DA_INK1}`,
          color: DA_INK1, borderRadius: 10,
          fontFamily: SANS, fontSize: 14, fontWeight: 600,
          alignItems: "center", justifyContent: "center", gap: 7,
          cursor: "pointer", textDecoration: "none", boxSizing: "border-box",
        }}>{L.demo}<ArrowSVG size={14} /></a>

        <a href="#examples" style={{
          display: "block", marginTop: 12, textAlign: "center",
          fontFamily: SANS, fontSize: 13, color: DA_INK1, fontWeight: 500,
          cursor: "pointer", textDecoration: "none",
        }}>{L.secondary} <span style={{ color: DA_GOLD }}>→</span></a>

        <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {L.proof.map((p, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: SANS, fontSize: 11, color: DA_INK2 }}>
              <span style={{ width: 13, height: 13, borderRadius: "50%", background: DA_GREEN_SOFT, color: DA_GREEN, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CheckSVG size={8} />
              </span>
              {p}
            </span>
          ))}
        </div>

        <div style={{ marginTop: 32, display: "flex", justifyContent: "center" }}>
          <div style={{
            width: 230, background: "#0d0a06", borderRadius: 22, padding: 10,
            boxShadow: "0 24px 60px -16px rgba(26,22,17,.30), 0 8px 20px -8px rgba(26,22,17,.16)",
          }}>
            <div style={{ background: "#faf5e8", borderRadius: 14, overflow: "hidden", height: 420 }}>
              <AuroraMiniPhone
                core={MALTA_CORE}
                highlights={isAr ? MALTA_HL_AR : MALTA_HL_EN}
                lang={lang}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Features ──────────────────────────────────────────────────────────────────

function LandingFeatures({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = isAr ? {
    eyebrow: "كل ما تحتاجه للتميز المبيعاتي",
    title: "مطور هندسياً لوكالات السفر،",
    titleAccent: "وليس أداة تصميم عامة عشوائية مشتتة.",
    sub: "ستة أدوات مخصصة ومبتكرة صممناها خصيصاً لتناسب الطريقة التي تبيع بها مكاتب وشركات السياحة عروضها وخدماتها اللوجستية.",
    cards: [
      { eyebrow: "01 · استخراج المحتوى", title: "استخراج هيكل الباقة بالذكاء الاصطناعي", body: "الصق مسودات البرامج أو رسائل مجموعات الواتساب الطويلة والمشتتة — سيتولى نموذجنا المتخصص استخراج الوجهات، هيكلة الأسعار المتعددة، صياغة المشمولات وبناء الجدول يوماً بيوم في ثوانٍ معدودة." },
      { eyebrow: "02 · واجهات العرض البصري", title: "عشرة قوالب وتصميمات معززة للبيع", body: "معرض واسع من التصاميم البصرية النخبوية والفاخرة — لكل نوع رحلة سمة فنية تبرز روعتها وتزيد ثقة المسافرين والمشاهدين بالميدان." },
      { eyebrow: "03 · صندوق الوارد المركزي", title: "تتبع خط المبيعات واقتناص استفسارات واتساب", body: "كل نقرة تفاعلية من الزائر على أزرار الاتصال تترجم فوراً داخل لوحة التحكم كصفقة مبيعات جديدة مع عرض كامل لتاريخ تصفح العميل داخل الصفحة ودرجة جديته." },
      { eyebrow: "04 · إدارة النطاقات", title: "ربط النطاق المخصص المستقل بالكامل مع SSL", body: "انشر عروض باقات السفر بالكامل تحت رابط وعنوان موقعك الرسمي الخاص لتعزيز موثوقية عملك وبناء حضور علامة تجارية قوية في أذهان العملاء." },
      { eyebrow: "05 · انسيابية الهواتف", title: "هندسة وتصميم للهواتف الذكية أولاً", body: "أغلب المسافرين يتصفحون العروض السياحية من هواتفهم عبر روابط إنستغرام أو واتساب. لذلك صممنا كافة التخطيطات والقوالب لتظهر بأبعاد مبهرة ومريحة للجوال." },
      { eyebrow: "06 · الازدواجية اللغوية", title: "دعم حقيقي ثنائي اللغة ومحاذاة كاملة للـ RTL", body: "توفير الميزة ثنائية اللغة الناتجة والمباشرة (عربي + إنجليزي) بشكل احترافي رصين — مع دعم التقويم الهجري، متطلبات تفكيك اللوجستيات للعمرة، ومحاذاة الخطوط العربية." },
    ],
  } : {
    eyebrow: "Engineered Industry Capabilities Suite",
    title: "Purpose-built for travel operators,",
    titleAccent: "not a generic unstyled builder.",
    sub: "Six modular tools architecture designed directly around how incoming travel prospects research, evaluate, and lock booking choices.",
    cards: [
      { eyebrow: "01 · Raw Content Extraction", title: "AI Instant Structural Parsing", body: "Drop in basic itineraries, unformatted marketing posts, old brochures, or text files. Our specialized natural language models isolate targets, flat values, and logistics fields instantly." },
      { eyebrow: "02 · Visual Paradigms", title: "Ten Premium Presentation Layouts", body: "Access targeted structural themes built specifically to translate luxury bespoke escapes, high-altitude expeditions, faith journeys, or social cohorts securely." },
      { eyebrow: "03 · Central Lead Hub", title: "WhatsApp-Native Pipeline Sync", body: "Capture outbound customer inquiries instantly into a centralized desk, mapping session paths, evaluated pricing tiers, and buying intent scores automatically." },
      { eyebrow: "04 · Brand Domain Routing", title: "Masked Addressing with Enterprise SSL", body: "Route standalone custom business domains directly across platform tracking arrays. Complete encryption certificate loops resolve instantly once setup maps catch." },
      { eyebrow: "05 · Handset Optimization", title: "Mobile Viewport Responsiveness First", body: "Calibrated down to 400px widths framework rules natively, ensuring typography elements and visual presentation modules display flawlessly on traveler phones." },
      { eyebrow: "06 · Global Translation", title: "Bilingual English + Arabic RTL Core", body: "Built to deploy dual-language properties seamlessly. Integrates specialized features like automated Hijri mapping, religious operational criteria, and native Arabic layouts." },
    ],
  };

  const featureIcons = ["✦", "▣", "◎", "⊕", "◻", "⌖"];

  return (
    <div id="product" style={{ padding: "80px 48px", background: DA_SURFACE2 }}>
      <div style={{ maxWidth: 1280, marginInline: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
          <h2 style={{ margin: "12px 0 0", fontFamily: DISPLAY, fontSize: isAr ? 42 : 48, fontWeight: 400, color: DA_INK1, letterSpacing: -1.2, lineHeight: 1.08 }}>
            {L.title}<br /><span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span>
          </h2>
          <p style={{ margin: "18px auto 0", maxWidth: 600, fontFamily: SANS, fontSize: 17, color: DA_INK2, lineHeight: 1.55 }}>{L.sub}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: isAr ? "repeat(auto-fit, minmax(340px, 1fr))" : "repeat(3, 1fr)", gap: 16 }}>
          {L.cards.map((c, i) => (
            <div key={i} style={{
              background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14,
              padding: 28, display: "flex", flexDirection: "column", gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: DA_GOLD_SOFT, color: DA_GOLD,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 16,
              }}>{featureIcons[i]}</div>
              <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.3, textTransform: "uppercase", color: DA_GOLD, marginTop: 4 }}>{c.eyebrow}</div>
              <h3 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 22, fontWeight: 400, color: DA_INK1, letterSpacing: -0.4, lineHeight: 1.15 }}>{c.title}</h3>
              <p style={{ margin: 0, fontFamily: SANS, fontSize: 15, color: DA_INK2, lineHeight: 1.6 }}>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileLandingFeatures({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = isAr ? {
    eyebrow: "كل ما تحتاجه للتميز المبيعاتي", title: "مطور هندسياً لوكالات السفر،", titleAccent: "وليس أداة تصميم عامة.",
    cards: [
      { eyebrow: "01 · استخراج ذكي", title: "استخراج هيكل الباقة بالذكاء الاصطناعي", body: "الصق مسودات البرامج أو رسائل الواتساب الطويلة والمشتتة — سيتولى نموذجنا استخراج الوجهات، فئات العملات والأسعار، والمشمولات بدقة في ثوانٍ." },
      { eyebrow: "02 · واجهات العرض", title: "عشرة قوالب وتصميمات معززة للبيع", body: "معرض واسع من التصاميم البصرية النخبوية والفاخرة — لكل نوع رحلة سمة فنية تبرز روعتها وتزيد ثقة المسافرين." },
      { eyebrow: "03 · خط المبيعات", title: "تتبع صفقات واتساب والعملاء المحتملين", body: "كل نقرة تفاعلية من الزائر على أزرار الاتصال تترجم فوراً داخل لوحة التحكم كصفقة مبيعات جديدة مع عرض كامل لتاريخ تصفح العميل." },
      { eyebrow: "04 · إدارة النطاقات", title: "ربط النطاق المخصص المستقل بالكامل", body: "انشر عروض باقات السفر بالكامل تحت رابط وعنوان موقعك الرسمي الخاص لتعزيز موثوقية عملك وبناء حضور علامة تجارية قوية." },
      { eyebrow: "05 · انسيابية الجوال", title: "هندسة وتصميم للهواتف الذكية أولاً", body: "أغلب المسافرين يتصفحون العروض من هواتفهم. لذلك صممنا كافة التخطيطات والقوالب لتظهر بأبعاد مبهرة ومريحة للجوال." },
      { eyebrow: "06 · الازدواجية اللغوية", title: "دعم حقيقي ثنائي اللغة ومحاذاة RTL", body: "توفير الميزة ثنائية اللغة الناتجة والمباشرة (عربي + إنجليزي) بشكل احترافي رصين — مع دعم التقويم الهجري ونظم ترجمة العروض." },
    ],
  } : {
    eyebrow: "Engineered Capabilities Suite", title: "Purpose-built for travel operators,", titleAccent: "not general builders.",
    cards: [
      { eyebrow: "01 · Extraction Engine", title: "AI Instant Structural Parsing", body: "Drop in unformatted itineraries or messy WhatsApp notes. Extract destinations, base prices, schedules natively." },
      { eyebrow: "02 · Layout Paradigms", title: "Premium Presentation Strategy Tiers", body: "Access curated design layouts engineered specifically around modern group tours, honeymoons, or faith departures." },
      { eyebrow: "03 · Inbound Leads", title: "Central Pipeline Communications Sync", body: "Route outbound client clicks straight into system management folders, recording timeline logs and unique context tracks." },
      { eyebrow: "04 · Masked URLs", title: "Custom Business Domains Integration", body: "Deploys your standalone agency web root mapping rules natively across platform assets, managing SSL certificates automatically." },
      { eyebrow: "05 · Responsiveness", title: "Mobile Handset Viewport Execution First", body: "Layout themes scale flawlessly down to small device properties before scaling up, mapping font elements elegantly." },
      { eyebrow: "06 · Global Dialects", title: "English + Arabic Dual Experience Native", body: "Supports correct RTL alignment rules, localized Hijri data configurations, and certified travel text requirements easily." },
    ],
  };
  const featureIcons = ["✦", "▣", "◎", "⊕", "◻", "⌖"];

  return (
    <div style={{ padding: "44px 18px", background: DA_SURFACE2 }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
        <h2 style={{ margin: "10px 0 0", fontFamily: DISPLAY, fontSize: 28, fontWeight: 400, color: DA_INK1, letterSpacing: -0.8, lineHeight: 1.05 }}>
          {L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span>
        </h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {L.cards.map((c, i) => (
          <div key={i} style={{
            background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 12,
            padding: 18, display: "flex", gap: 12,
          }}>
            <div style={{
              width: 34, height: 34, borderRadius: 8,
              background: DA_GOLD_SOFT, color: DA_GOLD, flexShrink: 0,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15,
            }}>{featureIcons[i]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: DA_GOLD }}>{c.eyebrow}</div>
              <h3 style={{ margin: "4px 0 0", fontFamily: DISPLAY, fontSize: 17, fontWeight: 400, color: DA_INK1, letterSpacing: -0.3, lineHeight: 1.2 }}>{c.title}</h3>
              <p style={{ margin: "6px 0 0", fontFamily: SANS, fontSize: 14, color: DA_INK2, lineHeight: 1.55 }}>{c.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────

function ShotFrame({ url, height, children }: { url: string; height: number; children: React.ReactNode }) {
  return (
    <div style={{
      background: "#0d0a06", borderRadius: 12, overflow: "hidden",
      boxShadow: "0 24px 60px -24px rgba(26,22,17,.30), 0 8px 24px -12px rgba(26,22,17,.12)",
      border: "1px solid rgba(26,22,17,.08)",
    }}>
      <div style={{ background: "#1a1410", padding: "9px 13px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["#ff5f56", "#ffbd2e", "#27c93f"].map(c => (
            <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{
          flex: 1, marginInlineStart: 6, padding: "3px 10px",
          background: "rgba(255,255,255,.06)", borderRadius: 5,
          fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,.6)", letterSpacing: -0.2,
          display: "flex", alignItems: "center", gap: 5, direction: "ltr",
        }}>
          {url}
        </div>
      </div>
      <div style={{ background: DA_BG, height, overflow: "hidden" }}>{children}</div>
    </div>
  );
}

function ShotPaste({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  return (
    <ShotFrame url="packmetrix.com/builder" height={300}>
      <div dir={isAr ? "rtl" : "ltr"} style={{ padding: 18, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.3, textTransform: "uppercase", color: DA_GOLD, marginBottom: 4 }}>
          {isAr ? "خطوة البناء الهيكلي الأول الأول · 1 من 4" : "Guided workspace pipeline · 1 of 4"}
        </div>
        <div style={{ windowFilter: "none", fontFamily: DISPLAY, fontSize: 20, fontWeight: 400, color: DA_INK1, letterSpacing: -0.4, marginBottom: 12 }}>
          {isAr ? "الصق نصوص ومسودات الباقة السياحية" : "Provide unformatted content input"}
        </div>
        <div style={{
          flex: 1, background: DA_SURFACE2, border: `1px solid ${DA_RULE2}`,
          borderRadius: 9, padding: 13,
          fontFamily: SANS, fontSize: 12, color: DA_INK1, lineHeight: 1.7,
          position: "relative", overflow: "hidden",
        }}>
          {isAr ? (
            <div style={{ direction: "rtl", textAlign: "right" }}>
              {"رحلة خريف صلالة العائلية 🌿 من مطار الرياض"}<br />
              {"٥ ليالٍ غامرة — فندق ٤ نجوم شامل الإفطار + سيارة خاصة مع سائق"}<br />
              {"الباقة تغطي الطيران الدولي، الإقامة الفندقية، والتنقلات الأرضية والجولات"}<br />
              {"التكلفة الاستثمارية ٢٬٩٥٠ ريال للشخص · تتوفر خصومات الأطفال بنسبة ٢٥٪"}
            </div>
          ) : (
            <div style={{ direction: "ltr", textAlign: "left" }}>
              {"Malta summer escape 🌊 — 5 nights curated itinerary"}<br />
              {"Boutique hotel in Valletta citadel + daily gourmet breakfast standard"}<br />
              {"Includes international aviation routing, private transfers, and excursions"}<br />
              {"Total baseline investment starting from €388 per person twin share"}
            </div>
          )}
          <span style={{
            display: "inline-block", width: 1.5, height: 13, background: DA_GOLD,
            verticalAlign: "middle", marginInlineStart: 2,
            animation: "pm-cursor 1.1s steps(1) infinite",
          }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
          <div style={{
            padding: "9px 16px", background: DA_GOLD, color: "#fff",
            borderRadius: 8, fontFamily: SANS, fontSize: 12.5, fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
          }}>
            <SparkSVG size={13} />{isAr ? "بدء الاستخراج الذكي الهيكلي" : "Extract & Deploy Framework"}
          </div>
          <span style={{ fontFamily: SANS, fontSize: 11.5, color: DA_INK3 }}>
            {isAr ? "أو أدخل الحقول يدوياً بالكامل" : "or populate variables manually"}
          </span>
        </div>
      </div>
    </ShotFrame>
  );
}

function ShotStructured({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const fields: [string, string][] = isAr ? [
    ["الوجهة جغرافياً", "صلالة، سلطنة عُمان"], ["فئة التصنيف", "عطلات عائلية متكاملة"], ["ليالي المبيت", "٥ ليالٍ سياحية"],
    ["السعر الإجمالي الصافي", "٢٬٩٥٠ ر.س للشخص"], ["مواصفات الإقامة", "منتجع فندق ٤ نجوم"], ["لوجستيات النقل", "سيارة خاصة وسائق شخصي"],
  ] : [
    ["Identified Destination", "Salalah, Oman"], ["Category Classification", "Multi-Gen Family Escape"], ["Calculated Nights", "5 nights holiday"],
    ["Total Baseline Pricing", "2,950 SAR per guest"], ["Hospitality Asset", "4-star premium resort"], ["Logistical Transfers", "Private chauffeur services"],
  ];
  const chips = isAr
    ? ["طيران دولي", "إقامة فندقية", "تنقلات أرضية", "جولات خريفية", "خصم الأطفال ٢٥٪"]
    : ["Aviation Routing", "Premium Stay", "Ground Logistics", "Curated Excursions", "Child Credit -25%"];
  return (
    <ShotFrame url="packmetrix.com/builder" height={300}>
      <div dir={isAr ? "rtl" : "ltr"} style={{ padding: 18, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.3, textTransform: "uppercase", color: DA_GOLD, marginBottom: 4 }}>
              {isAr ? "مراجعة وتدقيق البيانات · 2 من 4" : "Data Verification Row · 2 of 4"}
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 400, color: DA_INK1, letterSpacing: -0.4 }}>
              {isAr ? "راجِع وقُم بتدقيق قيم الحقول المستخرجة" : "Verify and map extracted variables"}
            </div>
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "4px 9px", background: DA_GREEN_SOFT, color: DA_GREEN,
            borderRadius: 999, fontFamily: SANS, fontSize: 10.5, fontWeight: 600,
          }}>
            <SparkSVG size={10} />{isAr ? "عُبِّئت تلقائياً بنجاح" : "Variables mapped automatically"}
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {fields.map(([k, v], i) => (
            <div key={i} style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase", color: DA_INK3 }}>{k}</div>
              <div style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 500, color: DA_INK1, marginTop: 3 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: 0.6, textTransform: "uppercase", color: DA_INK3, marginBottom: 7 }}>
            {isAr ? "الخدمات والمزايا المشمولة بالكامل في التكلفة" : "Guaranteed package inclusions master list"}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {chips.map((c, i) => (
              <span key={i} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                padding: "4px 9px", background: DA_SURFACE, border: `1px solid ${DA_RULE2}`,
                borderRadius: 999, fontFamily: SANS, fontSize: 11, color: DA_INK1,
              }}><span style={{ color: DA_GOLD }}>✓</span>{c}</span>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{
            padding: "8px 15px", background: DA_GOLD, color: "#fff",
            borderRadius: 8, fontFamily: SANS, fontSize: 12, fontWeight: 600,
            display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer",
          }}>{isAr ? "متابعة الخطوة التالية" : "Advance design parameters"}</div>
        </div>
      </div>
    </ShotFrame>
  );
}

function ShotTemplates({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const ids = ["family", "aurora", "sakina", "pulse", "petal", "tribe"] as const;
  const selected = "family";
  return (
    <ShotFrame url="packmetrix.com/builder" height={300}>
      <div dir={isAr ? "rtl" : "ltr"} style={{ padding: 18, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.3, textTransform: "uppercase", color: DA_GOLD, marginBottom: 4 }}>
          {isAr ? "محاذاة القالب الفني البصري · 3 من 4" : "Presentation Style Selector · 3 of 4"}
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 400, color: DA_INK1, letterSpacing: -0.4, marginBottom: 12 }}>
          {isAr ? "اختر النمط البصري المناسب لباقتك السياحية" : "Align layout portfolio preset theme"}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, flex: 1 }}>
          {ids.map(id => {
            const Render = MINI_RENDERS[id];
            const isSel = id === selected;
            return (
              <div key={id} style={{
                borderRadius: 8, overflow: "hidden",
                border: `1.5px solid ${isSel ? DA_GOLD : DA_RULE}`,
                boxShadow: isSel ? `0 0 0 3px ${DA_GOLD_SOFT}` : "none",
                background: DA_SURFACE,
              }}>
                <div style={{ height: 92, overflow: "hidden", position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0 }}>
                    {Render ? <Render isAr={isAr} /> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ShotFrame>
  );
}

function ShotPublished({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center", paddingBlock: 6 }}>
      <div style={{
        width: 232, background: "#0d0a06", borderRadius: 22, padding: 10,
        boxShadow: "0 24px 60px -18px rgba(26,22,17,.32), 0 8px 20px -8px rgba(26,22,17,.16)",
      }}>
        <div style={{ background: "#faf5e8", borderRadius: 14, overflow: "hidden", height: 280 }}>
          <AuroraMiniPhone
            core={SALALAH_CORE}
            highlights={isAr ? SALALAH_HL_AR : SALALAH_HL_EN}
            lang={lang}
          />
        </div>
      </div>
      {/* floating live-link pill */}
      <div style={{
        position: "absolute", top: 0,
        幕: isAr ? "auto" : 8, insetInlineStart: isAr ? "auto" : 8, insetInlineEnd: isAr ? 8 : "auto",
        background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 9,
        padding: "7px 11px", boxShadow: "0 12px 28px -12px rgba(26,22,17,.25)",
        display: "flex", alignItems: "center", gap: 7,
        fontFamily: MONO, fontSize: 10, color: DA_INK1, letterSpacing: -0.2,
      }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: DA_GREEN }} />
        <span style={{ direction: "ltr" }}>maraya.travel/salalah</span>
      </div>
      {/* floating counters */}
      <div style={{
        position: "absolute", bottom: 6,
        insetInlineEnd: isAr ? "auto" : 0, insetInlineStart: isAr ? 0 : "auto",
        background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 11,
        padding: "11px 14px", boxShadow: "0 16px 36px -14px rgba(26,22,17,.3)",
        display: "flex", gap: 16,
      }}>
        {[
          { v: isAr ? "١٬٢٨٤" : "1,284", l: isAr ? "مشاهدة حقيقية" : "impressions logged", gold: false },
          { v: isAr ? "٢٣+"   : "+23 threads",   l: isAr ? "عميل مستهدف"   : "captured leads",   gold: true  },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 400, color: s.gold ? DA_GOLD : DA_INK1, letterSpacing: -0.5, lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontFamily: SANS, fontSize: 9, color: DA_INK3, marginTop: 3, letterSpacing: 0.4, textTransform: "uppercase" }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const HOW_SHOTS: Array<(p: { lang: "en" | "ar" }) => React.JSX.Element> = [ShotPaste, ShotStructured, ShotTemplates, ShotPublished];

function LandingHowItWorks({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = isAr ? {
    eyebrow: "دليل مسار العمليات الرقمية لوكالتك",
    title: "من مسودة البرنامج العشوائية وحتى الرابط المنشور عالي الكفاءة",
    titleAccent: "في ثلاث دقائق معدودة تماماً ودون عناء.",
    sub: "أربعة خطوات تنظيمية متكاملة ومؤتمتة بالكامل. لا حاجة لأي أكواد برمجية أو مصممين محترفين. محاكاة حقيقية لواجهات نظام التشغيل الميداني.",
    steps: [
      { title: "1. الصق مسودات ونصوص الباقة السياحية العشوائية", body: "انسخ تفاصيل مسار رحلتك أو منشورك التسويقي الخام المتداول كما ترسلها تماماً عبر مجموعات الواتساب — يدعم اللغة العربية، الإنجليزية، أو الإزدواجية اللغوية المتزامنة مع التعبيرات الإيموجي بمرونة كاملة." },
      { title: "2. معالجة وهيكلة آلية ذكية للحقول الفنية", body: "يقوم نموذج الذكاء الاصطناعي بمسح نصوصك وتصنيفها فوراً داخل قواعد البيانات: يحدد جغرافية الوجهة، السعر المبدئي، ليالي المبيت، مواصفات فندق الإقامة المستضيفة والمشمولات الأساسية للباقة بدقة، مع صلاحية تعديل كاملة بنقرة واحدة." },
      { title: "3. اختيار ومحاذاة القالب البصري واجهة العرض", body: "توفير عشرة قوالب وتصميمات هيكلية فريدة ومجربة، مصممة هندسياً لتلائم عطلات العائلات، مغامرات المتسلقين، أو الزيارات الإيمانية والروحانية للحج والعمرة. شاهد مسار عرض محتواك الحقيقي منتقى بعينيك." },
      { title: "4. نشر الرابط وتفعيل مركز تتبع خط المبيعات والعملاء", body: "انشر العرض فوراً واحصل على رابط تسويقي ذكي مستضاف تحت هويتك ونطاقك الخاص، شاركه بضغطة واحدة على مجموعات الواتساب أو قنوات التواصل الاجتماعي، وراقب نمو Impressions والاتصالات Captured حياً." },
    ],
  } : {
    eyebrow: "Operational Workspace Workflow Overview",
    title: "From raw unstyled notes to published tracking URL asset",
    titleAccent: "in under three minutes flat.",
    sub: "Four clear guided production stages. No visual coding knowledge, no deployment scripts required. Actual graphic interface mockup layouts.",
    steps: [
      { title: "1. Paste unformatted text components block", body: "Dump in messy WhatsApp broadcast copy, old text brochures, rough bulleted lists, or raw trip specifications directly. Accepts multilingual structures and custom layouts gracefully." },
      { title: "2. Automated structural processing lookup", body: "Our text structures parsing automation isolates global target values, currency markers, multi-tier pricing models, flight options, and accommodation rules, mapping values seamlessly into input fields." },
      { title: "3. Align layout template presentation profiles", body: "Match your data rows directly against our specialized travel design catalog presets. Real-time visual layout previews process natively with your exact input variables values mapped." },
      { title: "4. Launch link mapping and gather client pipeline", body: "Publish configurations live onto your custom domain layer, broadcast URLs across client targets chat frameworks, and observe direct inbound buyer contacts update your dashboard central hub." },
    ],
  };

  return (
    <div id="how-it-works" style={{ padding: "80px 48px", background: DA_BG }}>
      <div style={{ maxWidth: 1180, marginInline: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
          <h2 style={{ margin: "12px 0 0", fontFamily: DISPLAY, fontSize: isAr ? 40 : 48, fontWeight: 400, color: DA_INK1, letterSpacing: -1.2, lineHeight: 1.05 }}>
            {L.title} <br /><span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span>
          </h2>
          <p style={{ margin: "18px auto 0", maxWidth: 520, fontFamily: SANS, fontSize: 17, color: DA_INK2, lineHeight: 1.55 }}>{L.sub}</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {L.steps.map((s, i) => {
            const Shot = HOW_SHOTS[i];
            const shotFirst = i % 2 === 0;
            const shotCol = (
              <div key="shot" style={{ flex: "0 0 52%", maxWidth: "52%" }}>
                <Shot lang={lang} />
              </div>
            );
            const textCol = (
              <div key="text" style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: "50%",
                    background: DA_INK1, color: DA_GOLD, flexShrink: 0,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: DISPLAY, fontSize: 17, fontWeight: 400,
                  }}>{`0${i + 1}`}</div>
                  <h3 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 24, fontWeight: 400, color: DA_INK1, letterSpacing: -0.6, lineHeight: 1.1 }}>{s.title}</h3>
                </div>
                <p style={{ margin: 0, paddingInlineStart: 54, fontFamily: SANS, fontSize: 16, color: DA_INK2, lineHeight: 1.6, maxWidth: 420 }}>{s.body}</p>
              </div>
            );
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 48, flexDirection: shotFirst ? "row" : "row-reverse" }}>
                {shotCol}
                {textCol}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MobileLandingHowItWorks({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = isAr ? {
    eyebrow: "كيف يعمل",
    title: "من باقتك إلى صفحة بيع مباشرة",
    titleAccent: "في دقائق معدودة.",
    steps: [
      { title: "1. الصق نصوص مسودات الباقة السياحية", body: "الصق العرض والأسعار كما ترسلها على مجموعات الواتساب تماماً — يدعم عربي، إنجليزي، أو لغتين متزامنتين بمرونة." },
      { title: "2. معالجة وهيكلة آلية بالذكاء الاصطناعي", body: "تحديد دقيق ومؤتمت قيم حقول الوجهة الجغرافية، ليالي المبيت، السعر المبدئي والمشمولات مع صلاحية تعديل فورية." },
      { title: "3. اختيار القالب والسمة الفنية للتصميم", body: "تطبيق النمط البصري المناسب لباقتك من محفظة القوالب (عطلات عائلية، مزارات دينية، مغامرات وعرة) ومحاكاة محتواك." },
      { title: "4. نشر الرابط وتتبع صفقات المبيعات حياً", body: "احصل على صفحة هبوط احترافية مستضافة بنطاقك المخصص الموصول، شارك الرابط بضغطة واحدة وتابع مبيعات صندوق الوارد." },
    ],
  } : {
    eyebrow: "Operational Workflow",
    title: "From raw travel text notes into clean live URL",
    titleAccent: "in moments flat.",
    steps: [
      { title: "1. Provide unformatted trip description copy", body: "Drop in messaging updates, bullet pricing lists, or layout notes text inputs directly without structural restrictions rules." },
      { title: "2. Automatic natural parsing logic sweeps", body: "Isolates and populates target parameters, nights, base price units, and flight rule criteria dynamically inside fields." },
      { title: "3. Choose presentation portfolio layout asset", body: "Rotate targeted layout preservation themes. Map visual galleries, accent color styles, and global identities metrics instantly." },
      { title: "4. Track live customer conversation threads logs", body: "Deploys secure link mapping rules straight onto standalone custom business domains address, tracking conversions." },
    ],
  };

  return (
    <div id="how-it-works" style={{ padding: "44px 18px", background: DA_BG }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
        <h2 style={{ margin: "10px 0 0", fontFamily: DISPLAY, fontSize: 28, fontWeight: 400, color: DA_INK1, letterSpacing: -0.8, lineHeight: 1.05 }}>
          {L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span>
        </h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {L.steps.map((s, i) => {
          const Shot = HOW_SHOTS[i];
          return (
            <div key={i}>
              <Shot lang={lang} />
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginTop: 14 }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%",
                  background: DA_INK1, color: DA_GOLD, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContext: "center",
                  fontFamily: DISPLAY, fontSize: 13, fontWeight: 400,
                }}>{`0${i + 1}`}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 18, fontWeight: 400, color: DA_INK1, letterSpacing: -0.3, lineHeight: 1.2 }}>{s.title}</h3>
                  <p style={{ margin: "5px 0 0", fontFamily: SANS, fontSize: 14, color: DA_INK2, lineHeight: 1.55 }}>{s.body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Template showcase ─────────────────────────────────────────────────────────

function TemplateShowcase({ lang, mobile }: { lang: "en" | "ar"; mobile?: boolean }) {
  const isAr = lang === "ar";
  const L = isAr
    ? { eyebrow: "قوالب وواجهات التصميم العرض البصري", title: "اختر النمط البصري المنسق المناسب لـ", titleAccent: "طبيعة وفئة باقتك السياحية.", sub: "عشرة تصاميم متكاملة — لكل قالب شخصية بصرية مستقلة وحالة استخدام مدروسة. ابدأ من نموذج جاهز، وخصص كل تفصيلة ولون لكنة بالأنظمة.", seeAll: "تصفح الأرشيف الكامل للقوالب العشرة" }
    : { eyebrow: "UI Presentation Template Presets Designs", title: "Select the specific graphic layout philosophy matching", titleAccent: "your unique adventure goals.", sub: "Ten premium, field-tested functional presentation styles engineered to maximize intent. Advance configurations unlock rich custom overrides layers.", seeAll: "Expand complete layouts portfolio strings" };

  const showcased = TEMPLATES.slice(0, mobile ? 4 : 5);
  const gridCols = mobile ? "1fr 1fr" : "repeat(5, 1fr)";

  return (
    <div id="templates" style={{ padding: mobile ? "44px 18px" : "80px 48px", background: DA_SURFACE2 }}>
      <div style={{ maxWidth: mobile ? undefined : 1280, marginInline: "auto" }}>
        <div style={{
          display: mobile ? "block" : "flex",
          alignItems: mobile ? undefined : "flex-end",
          justifyContent: mobile ? undefined : "space-between",
          marginBottom: mobile ? 22 : 36, gap: 24,
        }}>
          <div style={{ maxWidth: mobile ? undefined : 560 }}>
            <div style={{ fontFamily: SANS, fontSize: mobile ? 10 : 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
            <h2 style={{ margin: "10px 0 0", fontFamily: DISPLAY, fontSize: mobile ? 26 : 44, fontWeight: 400, color: DA_INK1, letterSpacing: mobile ? -0.7 : -1, lineHeight: 1.1 }}>
              {L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span>
            </h2>
            {!mobile && <p style={{ margin: "16px 0 0", fontFamily: SANS, fontSize: 17, color: DA_INK2, lineHeight: 1.55 }}>{L.sub}</p>}
          </div>
          {!mobile && (
            <a href="/templates" style={{
              fontFamily: SANS, fontSize: 13.5, color: DA_GOLD, fontWeight: 500,
              display: "inline-flex", alignItems: "center", gap: 6,
              cursor: "pointer", textDecoration: "none", paddingBottom: 6,
            }}>{L.seeAll}<ArrowSVG size={14} /></a>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: mobile ? 10 : 14 }}>
          {showcased.map(tpl => {
            const MiniRender = MINI_RENDERS[tpl.id];
            return (
              <div key={tpl.id} style={{
                background: DA_SURFACE, border: `1px solid ${DA_RULE}`,
                borderRadius: mobile ? 10 : 12, overflow: "hidden",
              }}>
                <div style={{ height: mobile ? 120 : 160, overflow: "hidden" }}>
                  {MiniRender ? <MiniRender isAr={isAr} /> : null}
                </div>
                <div style={{ padding: mobile ? "8px 10px" : "10px 12px" }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: mobile ? 13 : 14, color: DA_INK1, fontWeight: 400, letterSpacing: -0.2 }}>
                    {isAr ? tpl.nameAr : tpl.name}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: mobile ? 10 : 11, color: DA_INK3, marginTop: 2 }}>
                    {isAr ? tpl.targetAr : tpl.target}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {mobile && (
          <a href="/templates" style={{
            display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
            marginTop: 18, padding: "10px 0",
            fontFamily: SANS, fontSize: 13, color: DA_GOLD, fontWeight: 500,
            cursor: "pointer", textDecoration: "none",
          }}>{L.seeAll}<ArrowSVG size={13} /></a>
        )}
      </div>
    </div>
  );
}

// ── Examples ──────────────────────────────────────────────────────────────────

function exampleCover(kind: string): string {
  const grads: Record<string, string> = {
    umrah:      "linear-gradient(135deg, #3f7d52 0%, #1f4a30 100%)",
    sardinia:   "linear-gradient(135deg, #e0734a 0%, #b5371f 100%)",
    maldives:   "linear-gradient(135deg, #4ec5d4 0%, #1f6f8a 60%, #143a52 100%)",
    salalah:    "linear-gradient(135deg, #6ea069 0%, #355c34 100%)",
    cappadocia: "linear-gradient(135deg, #d4865a 0%, #864a26 100%)",
    wadirum:    "linear-gradient(135deg, #c46a44 0%, #6a2f1a 100%)",
  };
  return grads[kind] ?? "linear-gradient(135deg, #5a6e9a 0%, #2a3a5e 100%)";
}

type ExampleItem = {
  kind: string; ar: boolean;
  destination: string; title: string; tag: string;
  price: string; was?: string; agency: string; lang: string;
  coverImage?: string;
  url?: string;
};

const DEMO_TEMPLATE_TAGS: Record<string, { en: string; ar: string }> = {
  sakina:  { en: "Umrah Operations",  ar: "رحلات عمرة دينية"   },
  family:  { en: "Family Holidays",  ar: "عطلات عائلية مريحة"  },
  pulse:   { en: "Flash Promos",     ar: "عروض اللحظة الأخيرة" },
  petal:   { en: "Bespoke Romance",  ar: "ملاذات شهر عسل فاخرة" },
  aurora:  { en: "Bespoke Luxury",   ar: "سياحة نخبوية فاخرة"  },
  tribe:   { en: "Group Escapes",    ar: "أفواج جماعية شبابية" },
  compass: { en: "High Adventure",   ar: "تسلق ومغامرات جبلية" },
  voyage:  { en: "Youth Explorers",  ar: "رحلات الظهر والشباب" },
  atlas:   { en: "Heritage Travel",  ar: "تجارب ثقافية وتراثية" },
  smart:   { en: "Value Budget",     ar: "باقات اقتصادية شفافة" },
};

async function fetchDemoPackages(lang: "en" | "ar"): Promise<ExampleItem[]> {
  const snap = await getDocs(
    query(collection(db, "packages"), where("isDemo", "==", true))
  );

  const pkgs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
    .filter(p => (p.primaryLanguage || p.language) === lang && p.status === "active");

  let agencyName = lang === "ar" ? "مرايا للأسفار" : "Maraya Journeys";
  if (pkgs.length > 0 && pkgs[0].userId) {
    try {
      const userSnap = await getDoc(doc(db, "users", pkgs[0].userId));
      if (userSnap.exists()) agencyName = userSnap.data().name || agencyName;
    } catch { /* keep default */ }
  }

  return pkgs.slice(0, 6).map(p => {
    const tagObj = DEMO_TEMPLATE_TAGS[p.templateId as string] ?? { en: "Travel Portfolio", ar: "عرض سياحي معتمد" };
    const rawTitle = p.title;
    const title = rawTitle && typeof rawTitle === "object"
      ? (rawTitle[lang] || rawTitle.en || rawTitle.ar || "")
      : String(rawTitle || "");

    return {
      kind:       String(p.templateId || "travel"),
      ar:          lang === "ar",
      destination: String(p.destination || ""),
      title,
      tag:        tagObj[lang],
      price:      String(p.price || ""),
      was:        p.priceWas || undefined,
      agency:     agencyName,
      lang:       lang === "ar" ? "AR" : "EN",
      coverImage: p.coverImage || undefined,
      url:        p.agencySlug && p.id ? `/${p.agencySlug}/${p.id}` : undefined,
    };
  });
}

function exampleData(isAr: boolean): ExampleItem[] {
  return [
    {
      kind: "umrah", ar: true,
      destination: isAr ? "مكة المكرمة والمدينة المنورة" : "Makkah & Madinah Sanctuary",
      title: "عمرة رمضان الروحانية · ١٠ ليالٍ",
      tag: isAr ? "رحلات عمرة دينية" : "Umrah Operations Focus",
      price: isAr ? "٤٬٢٠٠ ﷼" : "4,200 SAR",
      agency: isAr ? "دار السكينة لخدمات المعتمرين" : "Dar Al-Sakina Travel Hub",
      lang: "AR",
    },
    {
      kind: "sardinia", ar: false,
      destination: "Sardinia, Italy coast",
      title: "Flash conversion weekend escape drop",
      tag: "Scarcity Flash Promo",
      price: "€499 flat rate", was: "€919 baseline",
      agency: "Levant Voyages Europe",
      lang: "EN",
    },
    {
      kind: "maldives", ar: false,
      destination: "Maldives Luxury Atolls",
      title: "Bespoke romance package layout · 7 nights",
      tag: "Bespoke Romance Escape",
      price: "€4,200 total per couple",
      agency: "Cedar & Sea Bespoke Curation",
      lang: "EN",
    },
    {
      kind: "salalah", ar: true,
      destination: isAr ? "صلالة، سلطنة عُمان" : "Salalah, Oman Green Season",
      title: "خريف ظفار العائلي المتكامل · ٥ ليالٍ",
      tag: isAr ? "ععطلات عائلية مريحة" : "Multi-Gen Family Holiday",
      price: isAr ? "٢٬٩٥٠ ﷼" : "2,950 SAR",
      agency: isAr ? "وكالة مرايا للسفر الاستكشافي" : "Maraya Journeys Workspace",
      lang: "AR",
    },
    {
      kind: "cappadocia", ar: false,
      destination: "Cappadocia, Türkiye Anatolia",
      title: "Hot-air ballooning sequence · boutique stay",
      tag: "Boutique Experience Curation",
      price: "€549 per guest",
      agency: "Maraya Journeys Global Portfolio",
      lang: "EN",
    },
    {
      kind: "wadirum", ar: true,
      destination: isAr ? "صحراء وادي رم، الأردن" : "Wadi Rum Protection Wilderness",
      title: "مغامرة الأفواج الجماعية والأنشطة المشترك · ٤ ليالٍ",
      tag: isAr ? "أفواج جماعية شبابية" : "Group Cohorts Safe Escape",
      price: isAr ? "٦٩٩ ﷼ / للمقعد الفردي" : "699 SAR per cohort seat",
      agency: isAr ? "مؤسسة قبيلة الرحالة للمغامرات" : "Tribe Travel Co. Environment",
      lang: "AR",
    },
  ];
}

function ExampleCard({ ex, lang }: { ex: ExampleItem; lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const seeLive = isAr ? "تصفح صفحة الهبوط المباشرة" : "Launch live page context";
  const comingSoon = isAr ? "قريباً بالأنظمة" : "Tenant build packaging";
  return (
    <div style={{
      background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14,
      overflow: "hidden", display: "flex", flexDirection: "column",
    }}>
      {/* Cover */}
      <div style={{ position: "relative", height: 168 }}>
        {ex.coverImage
          ? <img src={ex.coverImage} alt={ex.destination} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ position: "absolute", inset: 0, background: exampleCover(ex.kind) }} />
        }
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,.05) 0, rgba(255,255,255,.05) 1px, transparent 1px, transparent 9px)",
        }} />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,.5) 100%)",
        }} />
        {/* trip-type tag */}
        <div style={{ position: "absolute", top: 12, insetInlineStart: 12 }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 9px", background: "rgba(13,10,6,.55)", color: "#fff",
            borderRadius: 999, fontFamily: SANS, fontSize: 10.5, fontWeight: 500,
            backdropFilter: "blur(8px)",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: DA_GOLD }} />
            {ex.tag}
          </span>
        </div>
        {/* lang chip */}
        <div style={{ position: "absolute", top: 12, insetInlineEnd: 12 }}>
          <span style={{
            padding: "3px 8px", background: "rgba(13,10,6,.45)", color: "rgba(255,255,255,.92)",
            borderRadius: 999, fontFamily: MONO, fontSize: 9.5, fontWeight: 500, letterSpacing: .3,
            backdropFilter: "blur(8px)",
          }}>{ex.lang === "AR" ? (isAr ? "واجهة عربية معتمدة" : "Arabic native") : (isAr ? "واجهة إنجليزية معتمدة" : "English native")}</span>
        </div>
        {/* destination + title */}
        <div dir={ex.ar ? "rtl" : "ltr"} style={{ position: "absolute", insetInline: 14, bottom: 12 }}>
          <div style={{
            fontFamily: SANS, fontSize: 10.5, fontWeight: 600,
            letterSpacing: .8, textTransform: "uppercase", color: "rgba(255,255,255,.8)",
          }}>{ex.destination}</div>
          <div style={{
            fontFamily: DISPLAY, fontSize: 19, fontWeight: 400, color: "#fff",
            letterSpacing: -.3, lineHeight: 1.15, marginTop: 3,
            textShadow: "0 1px 12px rgba(0,0,0,.4)",
          }}>{ex.title}</div>
        </div>
      </div>

      {/* Footer */}
      <div dir={ex.ar ? "rtl" : "ltr"} style={{
        padding: "13px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
      }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 18, color: DA_INK1, letterSpacing: -.3 }}>{ex.price}</span>
            {ex.was && <span style={{ fontFamily: SANS, fontSize: 12, color: DA_INK3, textDecoration: "line-through" }}>{ex.was}</span>}
          </div>
          <div style={{
            fontFamily: SANS, fontSize: 11.5, color: DA_INK3, marginTop: 2,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>{ex.agency}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          {!ex.url && (
            <span style={{
              padding: "2px 7px", background: DA_GOLD_SOFT, color: DA_GOLD_DEEP,
              borderRadius: 999, fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: .3,
            }}>{comingSoon}</span>
          )}
          <a
            href={ex.url ?? "#"}
            target={ex.url ? "_blank" : undefined}
            rel={ex.url ? "noopener noreferrer" : undefined}
            onClick={ex.url ? undefined : e => e.preventDefault()}
            style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              padding: "7px 12px", background: DA_SURFACE2, border: `1px solid ${DA_RULE2}`,
              borderRadius: 8, fontFamily: SANS, fontSize: 12, fontWeight: 500, color: DA_INK1,
              textDecoration: "none",
              opacity: ex.url ? 1 : 0.45,
              pointerEvents: ex.url ? undefined : "none",
            }}
          >
            {seeLive}
            <span style={{ color: DA_GOLD, transform: ex.ar ? "scaleX(-1)" : "none", display: "inline-flex" }}>
              <ArrowSVG size={12} />
            </span>
          </a>
        </div>
      </div>
    </div>
  );
}

function LandingExamples({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const [liveData, setLiveData] = useState<ExampleItem[] | null>(null);
  useEffect(() => {
    setLiveData(null);
    fetchDemoPackages(lang).then(setLiveData).catch(() => {/* fallback to sample metrics models */});
  }, [lang]);
  const data = liveData ?? exampleData(isAr);
  const L = isAr ? {
    eyebrow: "أمثلة وثائقية حقيقية بالميدان",
    title: "تصفح نماذج صفحات هبوط",
    titleAccent: "فعلية منشورة للجمهور.",
    sub: "هذه صفحات هبوط تسويقية حقيقية قامت بتشييدها وهندستها وكالات سفر متميزة شريكة معنا — اضغط على أي نموذج لمراجعة وتصفح تجربة العميل وال زائر حياً.",
  } : {
    eyebrow: "Authentic Production Environment Case Highlights",
    title: "Review live optimized operational",
    titleAccent: "landing page frameworks deployed.",
    sub: "These are live destination pages traveling agencies engineered on PackMetrix. Click any layout to pull up dynamic view components natively.",
  };
  return (
    <div id="examples" style={{ padding: "80px 48px", background: DA_BG }}>
      <div style={{ maxWidth: 1280, marginInline: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{
            fontFamily: SANS, fontSize: 10.5, fontWeight: 600,
            letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD,
          }}>{L.eyebrow}</div>
          <h2 style={{
            margin: "12px 0 0", fontFamily: DISPLAY, fontSize: isAr ? 40 : 48, fontWeight: 400,
            color: DA_INK1, letterSpacing: -1.2, lineHeight: 1.05,
          }}>
            {L.title}{" "}
            <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span>
          </h2>
          <p style={{
            margin: "18px auto 0", maxWidth: 560,
            fontFamily: SANS, fontSize: 17, color: DA_INK2, lineHeight: 1.55,
          }}>{L.sub}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {data.map((ex, i) => (
            <ExampleCard key={i} ex={ex} lang={lang} />
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileLandingExamples({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const [liveData, setLiveData] = useState<ExampleItem[] | null>(null);
  useEffect(() => {
    setLiveData(null);
    fetchDemoPackages(lang).then(setLiveData).catch(() => {/* use fallback arrays */});
  }, [lang]);
  const data = liveData ?? exampleData(isAr);
  const L = isAr ? {
    eyebrow: "أمثلة حقيقية منشورة",
    title: "تصفح صفحات هبوط",
    titleAccent: "فعلية ومباشرة.",
  } : {
    eyebrow: "Production Examples",
    title: "Review live fully routed",
    titleAccent: "agency portfolios pages.",
  };
  return (
    <div id="examples" style={{ padding: "44px 18px", background: DA_BG }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{
          fontFamily: SANS, fontSize: 10, fontWeight: 600,
          letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD,
        }}>{L.eyebrow}</div>
        <h2 style={{
          margin: "10px 0 0", fontFamily: DISPLAY, fontSize: 28, fontWeight: 400,
          color: DA_INK1, letterSpacing: -.8, lineHeight: 1.05,
        }}>
          {L.title}{" "}
          <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span>
        </h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {data.map((ex, i) => (
          <ExampleCard key={i} ex={ex} lang={lang} />
        ))}
      </div>
    </div>
  );
}

// ── Pricing ───────────────────────────────────────────────────────────────────

function LandingPricing({ lang, spotsRemaining }: { lang: "en" | "ar"; spotsRemaining: number | null }) {
  const isAr = lang === "ar";
  const [annual, setAnnual] = useState(false);

  const totalSpots = 50;
  const filled = spotsRemaining !== null ? totalSpots - spotsRemaining : 1;
  const pct = Math.max(2, Math.min(100, (filled / totalSpots) * 100));

  const L = isAr ? {
    eyebrow: "إدارة الفواتير والاشتراكات المادية للأنظمة",
    title: "خطة استثمارية موحدة الشروط.",
    titleAccent: "اشترك بسعر الإطلاق المخفض، وثبّت قيمته مدى الحياة لعملك.",
    sub: "أول 50 شركة ووكالة سفر تفعل حسابها الآن ستقوم بقفل سعر الاشتراك عند 39 € شهرياً فقط — وسيظل هذا السعر ثابتاً ومضموناً لها طوال مدة اشتراكها بالمنصة دون أي زيادة. بعد اكتمال العدد، سيتم فتح التسجيل للوكالات الجديدة بسعر الخطة القياسي البالغ 79 € شهرياً.",
    chip: "سعر الإطلاق المميز · متاح لـ 50 مقعداً تنظيمياً فقط", planName: "باقة سعر الإطلاق الحصرية", perMonth: "/شهرياً صافي التكلفة",
    locked: "ميزة قفل التكلفة مدى الحياة لحماية عملك · ترتفع التكلفة إلى 79 € لاحقاً للشركات الجديدة",
    spotsLine: spotsRemaining !== null ? `متبقي ${spotsRemaining} مقعداً شاغراً فقط بسعر الإطلاق المخفض` : "متبقي مقعد واحد فقط متاح بسعر الإطلاق المخفض",
    monthly: "نظام السداد شهري دوري مريح", annual: "نظام التزام سنوي موفر للغاية", annualSave: "وفّر فورا 17% من القيمة",
    included: "كافة الخصائص والأدوات الاستراتيجية والذكاء الاصطناعي مفتوحة ومشمولة بالكامل بملفك",
    items: ["إنشاء ونشر باقات سياحية نشطة ومباشرة بدون أي حدود عددية", "صلاحية الوصول واستخدام كامل محفظة قوالب العرض البصري الـ 10", "ربط وتثبيت نطاقات مخصصة مستقلة غير محدودة مع إدارة SSL", "صندوق الوارد المركزي المطور لتلقي وإدارة اتصالات واتساب وبث البيانات", "تصدير قوائم وجداول المسافرين والمبيعات فوراً كملف وثائقي CSV", "الاحتفاظ وسحب سجل بيانات التحليلات وأداء القنوات لفترات ممتدة", "البحث المفتوح بالوسائط المرئية ومكتبات الصور السياحية الفاخرة المبرمجة"],
    cta: "قم بتأكيد الحجز وقفل السعر عند 39 € شهرياً مدى الحياة لعملك",
    trust: `تتضمن فترة تجريبية حرة ومفتوحة لـ ${TRIAL_DAYS} أيام · لا يطلب بطاقة دفع · إلغاء الحساب من خطوة واحدة في أي وقت`,
    notReady: "هل يفضل عملك مراجعة مستشار مبيعات أولاً؟",
    demoLink: "جدول موعد جلسة استشارية وعرض توضيحي مفسر لشركتك",
    after: "تنبيه تنظيمي مالي: بعد انتهاء مهلة عرض الإطلاق الحالي، سيتم تطبيق سعر الاشتراك القياسي البالغ 79 € شهرياً للشركات الجديدة. قم بقفل مميزات حسابك وتأمين ميزانيتك بالسعر المخفض الآن، ولن تتغير قيمته عليك أبداً.",
  } : {
    eyebrow: "Subscription Plan Pricing Architecture",
    title: "One streamlined core workspace tier.",
    titleAccent: "Secure early launch price levels, lock validation for life.",
    sub: "Our initial 50 corporate travel team signups map values permanently at €39/mo, contractually protected against platform index increases. Subsequent global lookup deployments route natively at €79/mo baseline rules framework standard.",
    chip: "Bespoke Early Access Incentive · 50 strategic structural spots total", planName: "Launch price portfolio strategy tier", perMonth: "/mo price baseline",
    locked: "Permanent pricing protection safeguard active · €79/mo tier rules apply later",
    spotsLine: spotsRemaining !== null ? `${spotsRemaining} strategic enrollment slots remaining open inside database` : "1 final allocation workspace configuration open under cap metrics rules",
    monthly: "Monthly configuration renewal cycle", annual: "Annual billing flat commitment layout", annualSave: "Apply instant 17% optimization credit layers",
    included: "All enterprise module tools and AI engines unlocked natively",
    items: ["Publish and manage unlimited travel landing layers simultaneously", "Complete, unrestricted luxury visual templates presentation catalog inclusion", "Standalone custom business domains mapping setup + automated SSL tracking rules", "Centralized lead inbox hub configuration (WhatsApp & Messenger triggers)", "Export client metadata records natively via structured analytical CSV documents", "Permanent lookup capability analytics logs window without data drops", "Instant access to premium global travel stock photos & videos engines"],
    cta: "Commit workspace properties and lock life tier at €39/mo",
    trust: `Risk-Free ${TRIAL_DAYS}-Day Premium Evaluation Window · Zero credit cards entries required · Cancel anytime`,
    notReady: "Require layout workflow clearings configuration first?",
    demoLink: "Coordinate introductory professional consulting call",
    after: "Financial parameters forecast: Post launch pricing loops closure, baseline structures refresh natively at €79/mo rule categories for next-gen onboarding suites. Protect configuration properties inputs today to lock value indexes permanently.",
  };

  return (
    <div id="pricing" style={{ padding: "80px 48px", background: DA_BG }}>
      <div style={{ maxWidth: 920, marginInline: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
          <h2 style={{ margin: "12px 0 0", fontFamily: DISPLAY, fontSize: 48, fontWeight: 400, color: DA_INK1, letterSpacing: -1.2, lineHeight: 1.05 }}>
            {L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span>
          </h2>
          <p style={{ margin: "18px auto 0", maxWidth: 580, fontFamily: SANS, fontSize: 17, color: DA_INK2, lineHeight: 1.55 }}>{L.sub}</p>
        </div>

        <div style={{
          background: DA_SURFACE, border: `1px solid ${DA_GOLD}`,
          borderRadius: 18, overflow: "hidden",
          boxShadow: "0 1px 2px rgba(26,22,17,.04), 0 32px 64px -32px rgba(176,138,62,.25)",
        }}>
          {/* Spots progress bar */}
          <div style={{
            background: DA_GOLD_SOFT, padding: "12px 24px",
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14,
            borderBottom: `1px solid rgba(176,138,62,.25)`,
          }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: SANS, fontSize: 12, fontWeight: 600, color: DA_GOLD_DEEP, letterSpacing: 0.3 }}>
              <span style={{ position: "relative", width: 8, height: 8, flexShrink: 0 }}>
                <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: DA_GOLD }} />
                <span style={{ position: "absolute", inset: -3, borderRadius: "50%", background: DA_GOLD, opacity: 0.3, animation: "pm-pulse 1.6s ease-out infinite" }} />
              </span>
              {L.spotsLine}
            </div>
            <div style={{ flex: 1, maxWidth: 200, height: 6, background: "rgba(176,138,62,.18)", borderRadius: 999, overflow: "hidden" }}>
              <div style={{ width: `${pct}%`, height: "100%", background: DA_GOLD, borderRadius: 999, transition: "width 0.8s ease" }} />
            </div>
          </div>

          <div style={{ padding: 32 }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 24, marginBottom: 28 }}>
              <div>
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "3px 10px", background: DA_GOLD, color: "#fff", borderRadius: 999,
                  fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase",
                }}><SparkSVG size={10} />{L.chip}</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 36, fontWeight: 400, color: DA_INK1, marginTop: 14, letterSpacing: -0.8, lineHeight: 1 }}>{L.planName}</div>
                <div style={{ fontFamily: SANS, fontSize: 13, color: DA_INK2, marginTop: 8 }}>{L.locked}</div>
              </div>
              <div style={{ textAlign: isAr ? "left" : "right" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 5, justifyContent: isAr ? "flex-start" : "flex-end" }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: annual ? 48 : 64, fontWeight: 400, color: DA_INK1, letterSpacing: -2, lineHeight: 0.9 }}>
                    {annual ? "€32.50" : "€39"}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 14, color: DA_INK3 }}>{L.perMonth}</div>
                </div>
                <div style={{ marginTop: 10, display: "inline-flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 9, padding: "2px 7px", background: DA_GREEN, color: "#fff", borderRadius: 999, letterSpacing: 0.3, fontFamily: SANS, whiteSpace: "nowrap", opacity: annual ? 1 : 0, transition: "opacity 0.2s" }}>{L.annualSave}</span>
                  <div style={{ display: "inline-flex", padding: 3, background: DA_BG, border: `1px solid ${DA_RULE2}`, borderRadius: 999, fontSize: 11, fontWeight: 500, fontFamily: SANS }}>
                    <div onClick={() => setAnnual(false)} style={{ padding: "3px 10px", borderRadius: 999, background: !annual ? DA_INK1 : "transparent", color: !annual ? DA_BG : DA_INK2, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>{L.monthly}</div>
                    <div onClick={() => setAnnual(true)} style={{ padding: "3px 10px", borderRadius: 999, background: annual ? DA_INK1 : "transparent", color: annual ? DA_BG : DA_INK2, cursor: "pointer", userSelect: "none", whiteSpace: "nowrap" }}>{L.annual}</div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 1.3, textTransform: "uppercase", color: DA_INK3, marginBottom: 14 }}>{L.included}</div>
            <div style={{ display: "grid", gridTemplateColumns: isAr ? "1fr" : "1fr 1fr 1fr", gap: "10px 18px", marginBottom: 28 }}>
              {L.items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontFamily: SANS, fontSize: 13, color: DA_INK1 }}>
                  <span style={{ width: 18, height: 18, borderRadius: "50%", background: DA_GREEN_SOFT, color: DA_GREEN, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                    <CheckSVG size={11} />
                  </span>
                  {item}
                </div>
              ))}
            </div>

            <a href={`${AGENCY_URL}/signup`} onClick={() => posthog.capture("cta_clicked", { cta: "signup", location: "pricing", lang, device: "desktop" })} style={{
              display: "flex", width: "100%", padding: "14px 0",
              background: DA_GOLD, color: "#fff", border: "none", borderRadius: 10,
              fontFamily: SANS, fontSize: 14.5, fontWeight: 600,
              alignItems: "center", justifyContent: "center", gap: 8,
              cursor: "pointer", textDecoration: "none", boxSizing: "border-box",
              boxShadow: "0 1px 2px rgba(0,0,0,.06), 0 12px 28px -10px rgba(176,138,62,.45), inset 0 1px 0 rgba(255,255,255,.18)",
            }}>{L.cta}<ArrowSVG size={15} /></a>
            <div style={{ marginTop: 12, textAlign: "center", fontFamily: SANS, fontSize: 12, color: DA_INK3 }}>{L.trust}</div>
            <div style={{ marginTop: 8, textAlign: "center", fontFamily: SANS, fontSize: 12.5, color: DA_INK2 }}>
              {L.notReady}{" "}<a href="#demo" style={{ color: DA_INK1, fontWeight: 600 }}>{L.demoLink}</a>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 18, padding: "12px 18px", background: "transparent", border: `1px dashed ${DA_RULE2}`, borderRadius: 10, textAlign: "center", fontFamily: SANS, fontSize: 12.5, color: DA_INK3, lineHeight: 1.55 }}>{L.after}</div>
      </div>
    </div>
  );
}

function MobileLandingPricing({ lang, spotsRemaining }: { lang: "en" | "ar"; spotsRemaining: number | null }) {
  const isAr = lang === "ar";
  const totalSpots = 50;
  const filled = spotsRemaining !== null ? totalSpots - spotsRemaining : 1;
  const pct = Math.max(2, Math.min(100, (filled / totalSpots) * 100));

  const L = isAr ? {
    eyebrow: "خطط الأسعار والاشتراكات", title: "خطة استثمارية واحدة.", titleAccent: "احجز بسعر الإطلاق المخفض، واقفل قيمته مدى الحياة.",
    spotsLine: spotsRemaining !== null ? `متبقي ${spotsRemaining} مقعداً شاغراً فقط بسعر الإطلاق` : "متبقي مقعد واحد فقط متاح بسعر الإطلاق المخفض",
    chip: "عرض الإطلاق الحصري · 50 مقعداً متاحاً فقط", planName: "باقة سعر الإطلاق", perMonth: "/شهرياً",
    locked: "ميزة قفل التكلفة مدى الحياة لعملك · 79 € لاحقاً للشركات الجديدة",
    items: ["إنشاء ونشر باقات سياحية نشطة بدون أي حدود عددية", "صلاحية الوصول واستخدام كامل محفظة قوالب الـ 10", "ربط وتثبيت نطاق مخصص مستقل مع إدارة شهادات SSL", "صندوق الوارد المركزي لتلقي وإدارة اتصالات واتساب", "تصدير قوائم وجداول المسافرين والمبيعات فوراً كملف CSV", "الاحتفاظ وسحب سجل بيانات التحليلات وأداء القنوات بدون قيود", "البحث المفتوح بالوسائط ومكتبات الصور السياحية الفاخرة"],
    cta: "قفل الاشتراك المالي عند 39 € شهرياً مدى الحياة",
    trust: `تتضمن فترة تجريبية حرة ومفتوحة لـ ${TRIAL_DAYS} أيام · لا يطلب بطاقة دفع · إلغاء الحساب في أي وقت`,
    notReady: "هل تفضل مراجعة مستشار المبيعات أولاً؟",
    demoLink: "احجز موعد جلسة استشارية لوكالتك",
  } : {
    eyebrow: "Subscription Pricing Matrix Tiers",
    title: "One structured workspace strategy setup.",
    titleAccent: "Lock launch parameters indexes forever, safeguard pipelines volume.",
    spotsLine: spotsRemaining !== null ? `${spotsRemaining} strategic enrollment slots remaining open` : "1 final configuration balance logged beneath structural cap thresholds",
    chip: "Launch Price Incentive · Restricted allocations window", planName: "Launch price portfolio configuration plan", perMonth: "/mo price baseline",
    locked: "Lifetime value loop lock validation running natively · €79/mo applies later",
    items: ["Launch unrestricted active travel layouts pages simultaneously", "Complete premium templates library options portfolio access", "Standalone custom domains registration + automated SSL routing mapping rules", "Centralized pipeline tracking leads hub inbox modules tool", "Export database client context records natively via CSV text tables", "Permanent lookup capability analytics logs window range histories", "Instant lookup access premium global stock photos galleries"],
    cta: "Lock lifetime subscription strategy at €39/mo tier",
    trust: `Risk-Free ${TRIAL_DAYS}-Day premium evaluation loop · Zero card details requested · Cancel anytime`,
    notReady: "Require workflow consult execution block first?",
    demoLink: "Coordinate introductory product demo walkthrough",
  };

  return (
    <div id="pricing" style={{ padding: "44px 18px", background: DA_BG }}>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
        <h2 style={{ margin: "10px 0 0", fontFamily: DISPLAY, fontSize: 28, fontWeight: 400, color: DA_INK1, letterSpacing: -0.8, lineHeight: 1.05 }}>
          {L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span>
        </h2>
      </div>
      <div style={{ background: DA_SURFACE, border: `1px solid ${DA_GOLD}`, borderRadius: 16, overflow: "hidden", boxShadow: "0 1px 2px rgba(26,22,17,.04), 0 24px 48px -24px rgba(176,138,62,.3)" }}>
        <div style={{ background: DA_GOLD_SOFT, padding: "10px 16px", display: "flex", alignItems: "center", gap: 10, borderBottom: `1px solid rgba(176,138,62,.25)` }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: DA_GOLD, flexShrink: 0 }} />
          <div style={{ flex: 1, fontFamily: SANS, fontSize: 11, fontWeight: 600, color: DA_GOLD_DEEP }}>{L.spotsLine}</div>
          <div style={{ width: 60, height: 5, background: "rgba(176,138,62,.2)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: DA_GOLD, borderRadius: 999 }} />
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", background: DA_GOLD, color: "#fff", borderRadius: 999, fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" }}>
            <SparkSVG size={10} />{L.chip}
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 400, color: DA_INK1, marginTop: 10, letterSpacing: -0.6, lineHeight: 1 }}>{L.planName}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginTop: 12 }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 52, fontWeight: 400, color: DA_INK1, letterSpacing: -1.6, lineHeight: 0.9 }}>€39</div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: DA_INK3 }}>{L.perMonth}</div>
          </div>
          <div style={{ fontFamily: SANS, fontSize: 12, color: DA_INK2, marginTop: 4 }}>{L.locked}</div>
          <div style={{ marginTop: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            {L.items.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontFamily: SANS, fontSize: 12.5, color: DA_INK1 }}>
                <span style={{ width: 16, height: 16, borderRadius: "50%", background: DA_GREEN_SOFT, color: DA_GREEN, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                  <CheckSVG />
                </span>
                {item}
              </div>
            ))}
          </div>
          <a href={`${AGENCY_URL}/signup`} onClick={() => posthog.capture("cta_clicked", { cta: "signup", location: "pricing", lang, device: "mobile" })} style={{
            display: "flex", width: "100%", marginTop: 22, padding: "13px 0",
            background: DA_GOLD, color: "#fff", border: "none", borderRadius: 10,
            fontFamily: SANS, fontSize: 14, fontWeight: 600,
            alignItems: "center", justifyContent: "center", gap: 7,
            cursor: "pointer", textDecoration: "none", boxSizing: "border-box",
            boxShadow: "0 1px 2px rgba(0,0,0,.06), 0 8px 20px -6px rgba(176,138,62,.45), inset 0 1px 0 rgba(255,255,255,.18)",
          }}>{L.cta}<ArrowSVG size={14} /></a>
          <div style={{ marginTop: 10, textAlign: "center", fontFamily: SANS, fontSize: 11, color: DA_INK3 }}>{L.trust}</div>
          <div style={{ marginTop: 8, textAlign: "center", fontFamily: SANS, fontSize: 12, color: DA_INK2 }}>
            {L.notReady}{" "}<a href="#demo-m" style={{ color: DA_INK1, fontWeight: 600 }}>{L.demoLink}</a>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Book-a-demo section ───────────────────────────────────────────────────────

function WASvg() {
  return (
    <svg width={15} height={15} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function DemoSuccessCard({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const t = isAr ? {
    title: "تم جدولة جلستك الاستشارية بنجاح!",
    sub: "سيتواصل معك مستشار مبيعات السفر لدينا عبر الواتساب خلال ٢٤ ساعة لتأكيد وتنسيق موعد العرض التوضيحي المخصص لوكالتك السياحية المتميزة.",
  } : {
    title: "Product demonstration walkthrough registered!",
    sub: "An assigned workspace optimization advisor records your query and dispatches standard synchronization metrics straight to your text framework inside 24 hours.",
  };
  return (
    <div style={{
      background: DA_SURFACE, border: `1px solid ${DA_RULE}`,
      borderRadius: 16, padding: "44px 32px", textAlign: "center",
    }}>
      <div style={{
        width: 56, height: 56, borderRadius: "50%",
        background: DA_GREEN_SOFT, color: DA_GREEN,
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        marginBottom: 20,
      }}>
        <CheckSVG size={22} />
      </div>
      <div style={{ fontFamily: DISPLAY, fontSize: 30, color: DA_INK1, marginBottom: 10, letterSpacing: -0.6 }}>{t.title}</div>
      <p style={{ margin: 0, fontFamily: SANS, fontSize: 15, color: DA_INK2, lineHeight: 1.6, maxWidth: 380, marginInline: "auto" }}>{t.sub}</p>
    </div>
  );
}

function LandingDemo({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const [name, setName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [serverError, setServerError] = useState("");

  const L = isAr ? {
    eyebrow: "طلب عرض توضيحي مباشر وجلسة استشارية خاصة",
    title: "شاهد كفاءة أدوات منصة PackMetrix",
    titleAccent: "وهي تعمل مباشرة على عروضك.",
    sub: "سنرافقك خطوة بخطوة في جلسة قصيرة لنريك كيف تقوم أنظمتنا ببناء ونشر أول صفحة باقة سفر فاخرة لوكالتك في أقل من ١٠ دقائق — مستخدمين نصوص وصور عروضك السياحية الحقيقية.",
    labelName: "اسمك الكريم الكامل", labelAgency: "الاسم التجاري الرسمي للوكالة",
    labelWA: "رقم واتساب الأعمال الفعال للخدمة", labelEmail: "البريد الإلكتروني للعمل", labelMessage: "ملاحظات إضافية وتطلعات شركتك السياحية",
    optional: "(حقل اختياري)",
    placeholderName: "مثال: عبد الرحمن بن سلمان", placeholderAgency: "مثال: وكالة آفاق السفر الفاخرة",
    placeholderWA: "مثال: 4567 123 55 966+", placeholderEmail: "corporate@youragency.com",
    placeholderMessage: "أخبرنا باختصار عن فئات ونوعية باقات وعروض السفر التي تقوم وكالتك بتنظيمها والترويج لها…",
    cta: "تأكيد حجز موعد العرض التوضيحي المفسر", submitting: "جاري تقييد طلب الاستشارة وإرسال البيانات…",
    errRequired: "هذا الحقل الإداري مطلوب ومفتاح إلزامي للتوثيق", errPhone: "صيغة غير مدعومة: أدخل رقم واتساب صحيحاً وشاملاً رمز الدولة التزاماً باللوائح",
    errEmail: "صيغة غير مدعومة: أدخل عنوان بريد إلكتروني صحيح ومطابق لقواعد النطاقات", errServer: "حدث خطأ غير متوقع أثناء معالجة إرسال طلبك. يرجى مراجعة البيانات والمحاولة مجدداً.",
  } : {
    eyebrow: "Schedule a Managed Capabilities Briefing",
    title: "Review workspace optimization models",
    titleAccent: "running live across your content blueprints.",
    sub: "We will demonstrate how to extract, configure, and publish your initial conversion-optimized page layout framework in under ten minutes flat utilizing your raw travel copy.",
    labelName: "Your registered full name", labelAgency: "Official travel enterprise name syntax",
    labelWA: "WhatsApp number input", labelEmail: "Corporate email address string", labelMessage: "General system feedback fields notes",
    optional: "(optional variable argument)",
    placeholderName: "e.g., Sarah Jenkins", placeholderAgency: "e.g., Heritage Horizons Travel",
    placeholderWA: "e.g., +31 6 1234 5678", placeholderEmail: "info@horizons.travel",
    placeholderMessage: "Detail your operational volume projections or mention target luxury presentation templates needed…",
    cta: "Submit briefing request documentation", submitting: "Processing secure token generation loops…",
    errRequired: "Validation constraint check failed. Required field properties value input missing syntax layout rules.", errPhone: "String schema violation. Supply a syntactically correct WhatsApp line framework rule parameters.",
    errEmail: "String layout violation. Provide a correct destination corporate mail string format syntax parameter.", errServer: "Server connection timeout error occurred. Please force interface processing loops update and submit again.",
  };

  function isValidPhone(val: string) { return /^\d{7,15}$/.test(val.replace(/[^\d]/g, "")); }
  function isValidEmail(val: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val); }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = L.errRequired;
    if (!agencyName.trim()) e.agencyName = L.errRequired;
    if (!whatsapp.trim()) e.whatsapp = L.errRequired;
    else if (!isValidPhone(whatsapp)) e.whatsapp = L.errPhone;
    if (email && !isValidEmail(email)) e.email = L.errEmail;
    return e;
  }

  async function handleDemoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStatus("submitting");
    try {
      const res = await fetch("/api/submit-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, agencyName, whatsapp, email, message, website }),
      });
      if (!res.ok) throw new Error();
      posthog.capture("demo_form_submitted", { has_email: !!email.trim(), lang: isAr ? "ar" : "en", device: "desktop" });
      setStatus("success");
    } catch {
      setStatus("idle");
      setServerError(L.errServer);
    }
  }

  const inputSt: React.CSSProperties = {
    width: "100%", padding: "10px 12px",
    fontFamily: SANS, fontSize: 13.5, color: DA_INK1,
    background: DA_BG, borderRadius: 8, outline: "none", boxSizing: "border-box",
  };
  const fieldSt = (key: string): React.CSSProperties => ({
    ...inputSt, border: `1px solid ${errors[key] ? DA_DANGER : DA_RULE2}`,
  });

  return (
    <div id="demo" style={{ padding: "80px 48px", background: DA_BG }}>
      <div style={{ maxWidth: 640, marginInline: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
          <h2 style={{ margin: "12px 0 0", fontFamily: DISPLAY, fontSize: 40, fontWeight: 400, color: DA_INK1, letterSpacing: -1, lineHeight: 1.05 }}>
            {L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span>
          </h2>
          <p style={{ margin: "16px auto 0", maxWidth: 480, fontFamily: SANS, fontSize: 16, color: DA_INK2, lineHeight: 1.55 }}>{L.sub}</p>
        </div>

        {status === "success" ? <DemoSuccessCard lang={lang} /> : (
          <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 16, padding: "28px 32px" }}>
            <form onSubmit={handleDemoSubmit} noValidate>
              <input
                type="text" tabIndex={-1} aria-hidden="true" autoComplete="off"
                value={website} onChange={e => setWebsite(e.target.value)}
                style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
              />
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                <div>
                  <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_INK3, marginBottom: 5 }}>{L.labelName}</div>
                  <input style={fieldSt("name")} value={name} placeholder={L.placeholderName}
                    onChange={e => { setName(e.target.value); setErrors(er => ({ ...er, name: "" })); }} />
                  {errors.name && <div style={{ fontFamily: SANS, fontSize: 11, color: DA_DANGER, marginTop: 4 }}>{errors.name}</div>}
                </div>

                <div>
                  <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_INK3, marginBottom: 5 }}>{L.labelAgency}</div>
                  <input style={fieldSt("agencyName")} value={agencyName} placeholder={L.placeholderAgency}
                    onChange={e => { setAgencyName(e.target.value); setErrors(er => ({ ...er, agencyName: "" })); }} />
                  {errors.agencyName && <div style={{ fontFamily: SANS, fontSize: 11, color: DA_DANGER, marginTop: 4 }}>{errors.agencyName}</div>}
                </div>

                <div>
                  <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_INK3, marginBottom: 5 }}>{L.labelWA}</div>
                  <div dir="ltr" style={{ position: "relative" }}>
                    <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#25d366", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                      <WASvg />
                    </span>
                    <input
                      type="tel" dir="ltr"
                      style={{ ...fieldSt("whatsapp"), paddingLeft: 34 }}
                      value={whatsapp} placeholder={L.placeholderWA}
                      onChange={e => { setWhatsapp(e.target.value); setErrors(er => ({ ...er, whatsapp: "" })); }}
                    />
                  </div>
                  {errors.whatsapp && <div style={{ fontFamily: SANS, fontSize: 11, color: DA_DANGER, marginTop: 4 }}>{errors.whatsapp}</div>}
                </div>

                <div>
                  <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_INK3, marginBottom: 5 }}>
                    {L.labelEmail} <span style={{ fontWeight: 400, color: DA_INK3 }}>{L.optional}</span>
                  </div>
                  <input type="email" style={fieldSt("email")} value={email} placeholder={L.placeholderEmail}
                    onChange={e => { setEmail(e.target.value); setErrors(er => ({ ...er, email: "" })); }} />
                  {errors.email && <div style={{ fontFamily: SANS, fontSize: 11, color: DA_DANGER, marginTop: 4 }}>{errors.email}</div>}
                </div>

                <div>
                  <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_INK3, marginBottom: 5 }}>
                    {L.labelMessage} <span style={{ fontWeight: 400, color: DA_INK3 }}>{L.optional}</span>
                  </div>
                  <textarea
                    style={{ ...fieldSt("message"), resize: "vertical", minHeight: 80 }}
                    value={message} placeholder={L.placeholderMessage}
                    onChange={e => setMessage(e.target.value)}
                  />
                </div>

                {serverError && <div style={{ fontFamily: SANS, fontSize: 12.5, color: DA_DANGER }}>{serverError}</div>}

                <button
                  type="submit"
                  disabled={status === "submitting"}
                  style={{
                    width: "100%", padding: "13px 0",
                    background: "transparent", border: `1.5px solid ${DA_INK1}`,
                    color: DA_INK1, borderRadius: 10,
                    fontFamily: SANS, fontSize: 14, fontWeight: 600,
                    cursor: status === "submitting" ? "not-allowed" : "pointer",
                    opacity: status === "submitting" ? 0.65 : 1,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    boxSizing: "border-box",
                  }}
                >
                  {status === "submitting" ? L.submitting : <>{L.cta}<ArrowSVG size={13} /></>}
                </button>

              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function MobileLandingDemo({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const [name, setName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [serverError, setServerError] = useState("");

  const L = isAr ? {
    eyebrow: "عرض توضيحي للمنصة وجلسة استشارية خاصة",
    title: "شاهد أنظمة PackMetrix",
    titleAccent: "وهي تعمل مباشرة.",
    sub: "سنرافقك خطوة بخطوة لنريك كيف تنشر أول صفحة باقة سفر سياحية فاخرة ومحسنة مبيعات لوكالتك في أقل من ١٠ دقائق.",
    labelName: "اسمك الكريم الكامل", labelAgency: "الاسم التجاري للوكالة",
    labelWA: "رقم واتساب الفعال للخدمة", labelEmail: "البريد الإلكتروني للعمل", labelMessage: "ملاحظات إضافية وتطلعات شركتك السياحية",
    optional: "(اختياري)",
    placeholderName: "محمد أحمد", placeholderAgency: "وكالة النجوم للسفر",
    placeholderWA: "+966 55 123 4567", placeholderEmail: "corporate@youragency.com",
    placeholderMessage: "أخبرنا باختصار عن وكالتك ونوعية عروض السفر التي تنظمها…",
    cta: "تأكيد حجز موعد العرض التوضيحي", submitting: "جاري تقييد طلب الاستشارة وإرسال البيانات…",
    errRequired: "هذا الحقل مطلوب ومفتاح إلزامي للتوثيق", errPhone: "أدخل رقم واتساب صحيحاً وشاملاً رمز الدولة التزاماً باللوائح",
    errEmail: "أدخل عنوان بريد إلكتروني صحيح ومطابق لقواعد النطاقات", errServer: "حدث خطأ غير متوقع. يرجى المحاولة مجدداً.",
  } : {
    eyebrow: "Request Product Demo Walkthrough",
    title: "See PackMetrix tools",
    titleAccent: "running live natively.",
    sub: "We will demonstrate how to configure and deploy your initial conversion-optimized travel landing framework in under ten minutes flat.",
    labelName: "Your full name", labelAgency: "Travel agency name syntax",
    labelWA: "WhatsApp number input", labelEmail: "Corporate email address", labelMessage: "General feedback properties notes",
    optional: "(optional variable argument)",
    placeholderName: "Sarah Jenkins", placeholderAgency: "Bespoke Voyages Co.",
    placeholderWA: "+31 6 1234 5678", placeholderEmail: "info@youragency.com",
    placeholderMessage: "Detail your operational challenges or project volumes…",
    cta: "Submit briefing request documentation", submitting: "Processing secure token generation loops…",
    errRequired: "Validation check failed. Required field properties value missing parameter syntax.", errPhone: "String schema format error. Supply a correct WhatsApp line parameter structure.",
    errEmail: "String layout violation. Provide a valid email target address format syntax parameter.", errServer: "Server connection dropped during authorization loops. Please retry setup execution shortly.",
  };

  function isValidPhone(val: string) { return /^\d{7,15}$/.test(val.replace(/[^\d]/g, "")); }
  function isValidEmail(val: string) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val); }

  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = L.errRequired;
    if (!agencyName.trim()) e.agencyName = L.errRequired;
    if (!whatsapp.trim()) e.whatsapp = L.errRequired;
    else if (!isValidPhone(whatsapp)) e.whatsapp = L.errPhone;
    if (email && !isValidEmail(email)) e.email = L.errEmail;
    return e;
  }

  async function handleDemoSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setStatus("submitting");
    try {
      const res = await fetch("/api/submit-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, agencyName, whatsapp, email, message, website }),
      });
      if (!res.ok) throw new Error();
      posthog.capture("demo_form_submitted", { has_email: !!email.trim(), lang: isAr ? "ar" : "en", device: "mobile" });
      setStatus("success");
    } catch {
      setStatus("idle");
      setServerError(L.errServer);
    }
  }

  const inputSt: React.CSSProperties = {
    width: "100%", padding: "10px 12px",
    fontFamily: SANS, fontSize: 13.5, color: DA_INK1,
    background: DA_BG, borderRadius: 8, outline: "none", boxSizing: "border-box",
  };
  const fieldSt = (key: string): React.CSSProperties => ({
    ...inputSt, border: `1px solid ${errors[key] ? DA_DANGER : DA_RULE2}`,
  });

  return (
    <div id="demo-m" style={{ padding: "44px 18px", background: DA_BG }}>
      <div style={{ textAlign: "center", marginBottom: 24 }}>
        <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
        <h2 style={{ margin: "10px 0 0", fontFamily: DISPLAY, fontSize: 28, fontWeight: 400, color: DA_INK1, letterSpacing: -0.8, lineHeight: 1.05 }}>
          {L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span>
        </h2>
        <p style={{ margin: "12px 0 0", fontFamily: SANS, fontSize: 15, color: DA_INK2, lineHeight: 1.55 }}>{L.sub}</p>
      </div>

      {status === "success" ? (
        <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14, padding: "32px 20px", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: DA_GREEN_SOFT, color: DA_GREEN, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}>
            <CheckSVG size={18} />
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: 24, color: DA_INK1, marginBottom: 8 }}>
            {isAr ? "تم حجز وجدولة طلبك بنجاح!" : "Walkthrough loop registered successfully!"}
          </div>
          <p style={{ margin: 0, fontFamily: SANS, fontSize: 14, color: DA_INK2, lineHeight: 1.6 }}>
            {isAr ? "سنتواصل معك عبر واتساب الأعمال خلال ٢٤ ساعة لتأكيد وتنسيق موعد جلستك الاستشارية الخاصة." : "An assigned advisor confirms variables and reaches out directly inside 24 hours."}
          </p>
        </div>
      ) : (
        <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14, padding: "20px 18px" }}>
          <form onSubmit={handleDemoSubmit} noValidate>
            <input
              type="text" tabIndex={-1} aria-hidden="true" autoComplete="off"
              value={website} onChange={e => setWebsite(e.target.value)}
              style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }}
            />
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>

              <div>
                <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_INK3, marginBottom: 5 }}>{L.labelName}</div>
                <input style={fieldSt("name")} value={name} placeholder={L.placeholderName}
                  onChange={e => { setName(e.target.value); setErrors(er => ({ ...er, name: "" })); }} />
                {errors.name && <div style={{ fontFamily: SANS, fontSize: 11, color: DA_DANGER, marginTop: 4 }}>{errors.name}</div>}
              </div>

              <div>
                <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_INK3, marginBottom: 5 }}>{L.labelAgency}</div>
                <input style={fieldSt("agencyName")} value={agencyName} placeholder={L.placeholderAgency}
                  onChange={e => { setAgencyName(e.target.value); setErrors(er => ({ ...er, agencyName: "" })); }} />
                {errors.agencyName && <div style={{ fontFamily: SANS, fontSize: 11, color: DA_DANGER, marginTop: 4 }}>{errors.agencyName}</div>}
              </div>

              <div>
                <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_INK3, marginBottom: 5 }}>{L.labelWA}</div>
                <div dir="ltr" style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#25d366", display: "flex", alignItems: "center", pointerEvents: "none" }}>
                    <WASvg />
                  </span>
                  <input
                    type="tel" dir="ltr"
                    style={{ ...fieldSt("whatsapp"), paddingLeft: 34 }}
                    value={whatsapp} placeholder={L.placeholderWA}
                    onChange={e => { setWhatsapp(e.target.value); setErrors(er => ({ ...er, whatsapp: "" })); }}
                  />
                </div>
                {errors.whatsapp && <div style={{ fontFamily: SANS, fontSize: 11, color: DA_DANGER, marginTop: 4 }}>{errors.whatsapp}</div>}
              </div>

              <div>
                <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_INK3, marginBottom: 5 }}>
                  {L.labelEmail} <span style={{ fontWeight: 400, color: DA_INK3 }}>{L.optional}</span>
                </div>
                <input type="email" style={fieldSt("email")} value={email} placeholder={L.placeholderEmail}
                  onChange={e => { setEmail(e.target.value); setErrors(er => ({ ...er, email: "" })); }} />
                {errors.email && <div style={{ fontFamily: SANS, fontSize: 11, color: DA_DANGER, marginTop: 4 }}>{errors.email}</div>}
              </div>

              <div>
                <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_INK3, marginBottom: 5 }}>
                  {L.labelMessage} <span style={{ fontWeight: 400, color: DA_INK3 }}>{L.optional}</span>
                </div>
                <textarea
                  style={{ ...fieldSt("message"), resize: "vertical", minHeight: 80 }}
                  value={message} placeholder={L.placeholderMessage}
                  onChange={e => setMessage(e.target.value)}
                />
              </div>

              {serverError && <div style={{ fontFamily: SANS, fontSize: 12.5, color: DA_DANGER }}>{serverError}</div>}

              <button
                type="submit"
                disabled={status === "submitting"}
                style={{
                  width: "100%", padding: "13px 0",
                  background: "transparent", border: `1.5px solid ${DA_INK1}`,
                  color: DA_INK1, borderRadius: 10,
                  fontFamily: SANS, fontSize: 14, fontWeight: 600,
                  cursor: status === "submitting" ? "not-allowed" : "pointer",
                  opacity: status === "submitting" ? 0.65 : 1,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  boxSizing: "border-box",
                }}
              >
                {status === "submitting" ? L.submitting : <>{L.cta}<ArrowSVG size={13} /></>}
              </button>

            </div>
          </form>
        </div>
      )}
    </div>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────────────────

function LandingFinalCta({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = isAr ? {
    eyebrow: "ابدأ رحلة التميز والنمو الآن", title: "هل اتخذت القرار الاستراتيجي وأصبحت مستعداً لتنمية", titleAccent: "وكالتك وشركتك السياحية بالمنطقة؟",
    sub: "قم بتهيئة وهندسة ونشر أولى صفحات هبوط عروض سفرك السياحية ب مظهر احترافي ومحسن مبيعات في أقل من عشر دقائق معدودة تماماً. اقفل ميزانيتك للاشتراك بسعر الإطلاق المخفض البالغ 39 € شهرياً مدى الحياة لعملك.",
    cta: "تأكيد قفل السعر عند 39 € شهرياً مدى الحياة",
    second: `شامل فترة تجريبية حرة ومفتوحة لـ ${TRIAL_DAYS} أيام · بدون أي متطلبات لبطاقات ائتمانية أو رسوم مسبقة`,
  } : {
    eyebrow: "Accelerate Booking Velocity Today",
    title: "Are you ready to optimize structural conversions across",
    titleAccent: "your entire agency portfolio catalog?",
    sub: "Construct and distribute your initial configuration profile framework in under ten minutes flat. Safeguard pipeline values natively at the exclusive launch tier price level of €39/mo forever.",
    cta: "Lock lifetime pricing strategy at €39/mo",
    second: `Includes immediate access risk-free ${TRIAL_DAYS}-day premium validation loop · zero banking card profiles requested`,
  };
  return (
    <div style={{ padding: "80px 48px", background: DA_DARK, color: DA_BG, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at 50% 100%, rgba(176,138,62,.20), transparent 55%)" }} />
      <div style={{ position: "relative", maxWidth: 720, marginInline: "auto", textAlign: "center" }}>
        <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
        <h2 style={{ margin: "14px 0 0", fontFamily: DISPLAY, fontSize: isAr ? 46 : 56, fontWeight: 400, color: DA_BG, letterSpacing: -1.5, lineHeight: 1.02 }}>
          {L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span>
        </h2>
        <p style={{ margin: "22px auto 0", maxWidth: 500, fontFamily: SANS, fontSize: 16, color: "rgba(244,240,232,.72)", lineHeight: 1.55 }}>{L.sub}</p>
        <a href={`${AGENCY_URL}/signup`} onClick={() => posthog.capture("cta_clicked", { cta: "signup", location: "final_cta", lang, device: "desktop" })} style={{
          display: "inline-flex", marginTop: 32, padding: "16px 30px",
          background: DA_GOLD, color: "#fff", border: "none", borderRadius: 12,
          fontFamily: SANS, fontSize: 15, fontWeight: 600,
          alignItems: "center", gap: 9, cursor: "pointer", textDecoration: "none",
          boxShadow: "0 4px 12px rgba(0,0,0,.25), 0 12px 32px -8px rgba(176,138,62,.5), inset 0 1px 0 rgba(255,255,255,.18)",
        }}>{L.cta}<ArrowSVG size={16} /></a>
        <div style={{ marginTop: 16, fontFamily: SANS, fontSize: 12.5, color: "rgba(244,240,232,.55)" }}>{L.second}</div>
      </div>
    </div>
  );
}

function MobileLandingFinalCta({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = isAr ? {
    eyebrow: "ابدأ رحلة التميز والنمو اليوم", titleA: "هل أنت مستعد لتسريع نمو مبيعات وحجوزات", titleB: "وكالتك وشركتك السياحية بالمنطقة؟",
    sub: "أنشئ واقفل أولى صفحات هبوط عروض سفرك السياحية بمظهر احترافي ومحسن مبيعات في أقل من ١٠ دقائق.",
    cta: "قفل الاشتراك المالي عند 39 € شهرياً مدى الحياة", second: `شامل فترة تجريبية حرة ومفتوحة لـ ${TRIAL_DAYS} أيام · بدون أي متطلبات لبطاقات دفع`,
  } : {
    eyebrow: "Launch Configuration Profile Instantly",
    titleA: "Are you ready to accelerate strategy rules velocity across",
    titleB: "your traveling agency model layers?",
    sub: "Construct your initial optimized travel portfolio presentation framework inside ten minutes.",
    cta: "Lock lifetime subscription at €39/mo", second: `Includes free lookup validation loop active covering ${TRIAL_DAYS} days · zero credit requirements`,
  };
  return (
    <div style={{ padding: "44px 18px", background: DA_DARK, color: DA_BG, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at 50% 100%, rgba(176,138,62,.2), transparent 55%)" }} />
      <div style={{ position: "relative", textAlign: "center" }}>
        <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
        <h2 style={{ margin: "12px 0 0", fontFamily: DISPLAY, fontSize: 32, fontWeight: 400, color: DA_BG, letterSpacing: -1, lineHeight: 1.05 }}>
          <div>{L.titleA}</div>
          <div style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleB}</div>
        </h2>
        <p style={{ margin: "16px 0 0", fontFamily: SANS, fontSize: 16, color: "rgba(244,240,232,.72)", lineHeight: 1.55 }}>{L.sub}</p>
        <a href={`${AGENCY_URL}/signup`} onClick={() => posthog.capture("cta_clicked", { cta: "signup", location: "final_cta", lang, device: "mobile" })} style={{
          display: "flex", width: "100%", marginTop: 22, padding: "14px 0",
          background: DA_GOLD, color: "#fff", border: "none", borderRadius: 10,
          fontFamily: SANS, fontSize: 14, fontWeight: 600,
          alignItems: "center", justifyContent: "center", gap: 8,
          cursor: "pointer", textDecoration: "none", boxSizing: "border-box",
          boxShadow: "0 4px 12px rgba(0,0,0,.25), 0 12px 32px -8px rgba(176,138,62,.5)",
        }}>{L.cta}<ArrowSVG size={15} /></a>
        <div style={{ marginTop: 12, fontFamily: SANS, fontSize: 11.5, color: "rgba(244,240,232,.55)" }}>{L.second}</div>
      </div>
    </div>
  );
}

// ── Contact Modal ─────────────────────────────────────────────────────────────

function ContactModal({ open, onClose, isAr }: { open: boolean; onClose: () => void; isAr: boolean }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, email }),
      });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch {
      setStatus("error");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", fontFamily: SANS, fontSize: 13.5,
    color: DA_INK1, background: DA_BG, border: `1px solid ${DA_RULE2}`,
    borderRadius: 8, outline: "none", boxSizing: "border-box",
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(13,27,46,0.55)", backdropFilter: "blur(2px)" }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: DA_SURFACE, borderRadius: 16, padding: 32, maxWidth: 460, width: "calc(100% - 36px)", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}
      >
        {status === "sent" ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: DA_GREEN_SOFT, color: DA_GREEN, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 22, marginBottom: 16 }}>✓</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, color: DA_INK1, marginBottom: 8 }}>{isAr ? "تم إرسال رسالتك بنجاح تامة!" : "Operational notice logged successfully!"}</div>
            <p style={{ fontFamily: SANS, fontSize: 14, color: DA_INK2, margin: "0 0 24px" }}>{isAr ? "سيقوم مستشار السفر لدينا بالرد ومراجعة ملفك في أقرب وقت ممكن بمصداقية." : "Our administrative helpdesk traces structural data fields loops and responds inside short limits."}</p>
            <button onClick={onClose} style={{ padding: "10px 28px", background: DA_INK1, color: DA_BG, border: "none", borderRadius: 8, fontFamily: SANS, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
              {isAr ? "إغلاق النافذة والعودة" : "Dismiss view context"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, color: DA_INK1, marginBottom: 6 }}>{isAr ? "فتح خط اتصال مباشر وقنوات المراسلة" : "Open communication line framework"}</div>
            <p style={{ fontFamily: SANS, fontSize: 14, color: DA_INK2, margin: "0 0 22px" }}>{isAr ? "أرسل لنا تفاصيل استفسارك اللوجستي أو التقني وسيقوم المنسق بالرد الفوري بوضوح." : "Dispatched data payloads map directly to remote lookup verification sweeps."}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_INK3, marginBottom: 5 }}>{isAr ? "موضوع الرسالة الرئيسي" : "Explicit Message Subject"}</div>
                <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder={isAr ? "ما هو عنوان استفسارك؟" : "What category parameters require audit?"} required />
              </div>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_INK3, marginBottom: 5 }}>{isAr ? "تفاصيل نص الاستفسار الميداني" : "Experiential Description Copy Block"}</div>
                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 100 }} value={description} onChange={e => setDescription(e.target.value)} placeholder={isAr ? "اكتب هنا بالتفصيل ما ترغب في استيضاحه من لوائح أو ميزات…" : "Enter unformatted query notes directly here…"} required />
              </div>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_INK3, marginBottom: 5 }}>{isAr ? "عنوان بريدك الإلكتروني الرسمي للمتابعة" : "Authenticated corporate destination mail address"}</div>
                <input type="email" style={inputStyle} value={email} placeholder="corporate@agency.com" required />
              </div>
            </div>
            {status === "error" && (
              <p style={{ fontFamily: SANS, fontSize: 12.5, color: "#c0392b", margin: "12px 0 0" }}>{isAr ? "تعذر تأمين الاتصال بقواعد البيانات. يرجى مراجعة الشبكة وإعادة المحاولة." : "Server handshake failure mapped. Retry dispatch token sequence block loop."}</p>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: "11px 0", background: "transparent", border: `1px solid ${DA_RULE2}`, borderRadius: 8, fontFamily: SANS, fontSize: 13.5, color: DA_INK2, cursor: "pointer" }}>
                {isAr ? "إلغاء الإجراء والعودة" : "Drop inputs setup adjustment layouts"}
              </button>
              <button type="submit" disabled={status === "sending"} style={{ flex: 2, padding: "11px 0", background: DA_GOLD, color: "#fff", border: "none", borderRadius: 8, fontFamily: SANS, fontSize: 13.5, fontWeight: 600, cursor: "pointer", opacity: status === "sending" ? 0.7 : 1 }}>
                {status === "sending" ? (isAr ? "جاري معالجة الإرسال السحابي…" : "Processing data write maps…") : (isAr ? "تأكيد إرسال رسالتي الفورية" : "Publish feedback brief properties")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function LandingFooter({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const [contactOpen, setContactOpen] = useState(false);

  const L = isAr ? {
    tagline: "منظومة ونظم صفحات الهبوط الاحترافية الذكية لوكالات السفر والبعثات الميدانية — تنشر البرامج الاحترافية، تحلل أداء القنوات، وتضاعف عقود مبيعات السفر بكفاءة وأمان.",
    cols: [
      { head: "المنتج وأدوات التشغيل", links: [{ label: "المزايا البرمجية الاستراتيجية", href: "#product" }, { label: "قوالب التصميم واجهات العرض البصري", href: "/templates" }, { label: "خطط الأسعار والاشتراكات المادية للأنظمة", href: "#pricing" }, { label: "تسجيل الدخول لمحيط لوحة عمليات الوكالة", href: `${AGENCY_URL}/login` }] },
      { head: "الموارد والأدلة اللوجستية", links: [{ label: "دليل مسار العمليات الرقمية للوكالة", href: "#how-it-works" }, { label: "فتح خط اتصال مباشر وقنوات المراسلة", contact: true }] },
      { head: "الوثائق القانونية والحوكمة والامتثال", links: [{ label: "وثيقة وسياسة حماية البيانات وخصوصية الزوار والمستخدمين", href: "/privacy" }, { label: "وثيقة شروط واتفاقية تقديم الخدمة والالتزامات", href: "/terms" }, { label: "اتفاقية معالجة وحماية البيانات الفيدرالية المبرمجة", href: "/dpa" }] },
    ],
    operator: "تشغيل وإدارة البنية التحتية وهندسة الخادم برعاية · WQ AppTech",
    operatorSub: "مؤسسة فردية مسجلة وخاضعة لأحكام وقوانين السجل التجاري والشركات في مملكة هولندا · KvK 91019001",
    copy: "© ٢٠٢٦ باكميتركس لذكاء باقات السفر السياحية. جميع الحقوق القانونية، العلامات التجارية والأصول البرمجية محفوظة بالكامل وبصفة عالمية ومسجلة.",
  } : {
    tagline: "Next-Gen Travel Package Conversion Intelligence — empowering specialized travel agencies to publish professionally, evaluate performance scientifically, and scale conversions seamlessly.",
    cols: [
      { head: "Platform Core Engine Tools", links: [{ label: "Advanced Generative AI Capabilities Suite", href: "#product" }, { label: "Layout Themes Portfolio Selector", href: "/templates" }, { label: "Subscription Framework Tiers Layout", href: "#pricing" }, { label: "Authenticated dashboard workspace manager terminal", href: `${AGENCY_URL}/login` }] },
      { head: "Operational Guides Indexes", links: [{ label: "From unstyled travel text updates to published URL asset workflow", href: "#how-it-works" }, { label: "Open communication line framework interface", contact: true }] },
      { head: "Governance & Compliance Regulatory paths", links: [{ label: "Privacy Policy Framework Rules Guidelines Documentation", href: "/privacy" }, { label: "Terms of Operational Service Agreement Compliance Contracts", href: "/terms" }, { label: "Data Processing Amendment (DPA) security parameters files", href: "/dpa" }] },
    ],
    operator: "System framework architected and hosted under enterprise operations layer · WQ AppTech",
    operatorSub: "Eenmanszaak compliance structure officially logged under corporate registry acts within the Kingdom of the Netherlands · KvK 91019001",
    copy: "© 2026 PackMetrix International Core Environments. All corporate rights and proprietary assets reserved universally.",
  };

  const linkStyle: React.CSSProperties = { fontFamily: SANS, fontSize: 13, color: DA_INK1, cursor: "pointer", textDecoration: "none" };

  return (
    <>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} isAr={isAr} />
      <div style={{ padding: "56px 48px 32px", background: DA_SURFACE2, borderTop: `1px solid ${DA_RULE}`, fontFamily: SANS }}>
        <div style={{ maxWidth: 1280, marginInline: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: isAr ? "1.2fr 1fr 1fr 1fr" : "1.5fr 1fr 1fr 1fr", gap: 36 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: DA_INK1, color: DA_GOLD, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 13 }}>P</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 18, color: DA_INK1, letterSpacing: -0.2 }}>PackMetrix</div>
              </div>
              <p style={{ margin: 0, fontFamily: SANS, fontSize: 13, color: DA_INK2, maxWidth: 280, lineHeight: 1.55 }}>{L.tagline}</p>
            </div>
            {L.cols.map((col, i) => (
              <div key={i}>
                <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.3, textTransform: "uppercase", color: DA_INK3, marginBottom: 14 }}>{col.head}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {col.links.map((link, j) => (
                    link.contact
                      ? <button key={j} onClick={() => setContactOpen(true)} style={{ ...linkStyle, background: "none", border: "none", padding: 0, textAlign: isAr ? "right" : "left" }}>{link.label}</button>
                      : <a key={j} href={link.href} style={linkStyle}>{link.label}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 48, paddingTop: 22, borderTop: `1px solid ${DA_RULE}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <div style={{ fontFamily: SANS, fontSize: 12, color: DA_INK3 }}>{L.copy}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: SANS, fontSize: 12, color: DA_INK3 }}>
              <span style={{ color: DA_INK2, fontWeight: 500 }}>{L.operator}</span>
              <span style={{ color: DA_RULE2 }}>·</span>
              <span style={{ textAlign: isAr ? "right" : "left" }}>{L.operatorSub}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MobileLandingFooter({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const [contactOpen, setContactOpen] = useState(false);

  const L = isAr ? {
    tagline: "منظومة ونظم صفحات الهبوط الاحترافية الذكية لوكالات السفر والبعثات الميدانية المعتمدة",
    cols: [
      { head: "المنتج وأدوات التشغيل", links: [{ label: "المزايا الاستراتيجية", href: "#product" }, { label: "قوالب العرض البصري الواجهات", href: "/templates" }, { label: "خطط الأسعار والاشتراكات المادية", href: "#pricing" }] },
      { head: "الموارد والأدلة", links: [{ label: "دليل مسار العمليات الرقمية", href: "#how-it-works" }, { label: "قنوات الاتصال المفتوحة المباشرة", contact: true }] },
      { head: "الوثائق الحوكمة الامتثال", links: [{ label: "وثيقة حماية خصوصية البيانات والزوار", href: "/privacy" }, { label: "وثيقة شروط واتفاقيات تقديم الخدمة", href: "/terms" }] },
    ],
    copy: "© ٢٠٢٦ باكميتركس لذكاء باقات السفر السياحية · جميع الحقوق محفوظة ومقيدة مسجَّل في هولندا · مسيرة العمل التشغيلي الموثقة بالأنظمة برعاية KvK 91019001",
  } : {
    tagline: "Next-Gen Travel Package Conversion Intelligence Layouts Environments Universal",
    cols: [
      { head: "Platform Core Tools", links: [{ label: "Advanced Capabilities Suite AI Features", href: "#product" }, { label: "Layout Themes Presets Portfolio", href: "/templates" }, { label: "Subscription Framework Tiers", href: "#pricing" }] },
      { head: "Operational Strategy Indexes", links: [{ label: "From unstyled updates to published URL workflow", href: "#how-it-works" }, { label: "Open communication line tracking portal", contact: true }] },
      { head: "Governance Contracts Regulatory", links: [{ label: "Privacy Policy Framework Rules Guidelines", href: "/privacy" }, { label: "Terms of Operational Service Compliance Agreement", href: "/terms" }] },
    ],
    copy: "© 2026 PackMetrix International Core Environments · All corporate rights and proprietary assets reserved universally · Registered inside the Kingdom of the Netherlands · KvK 91019001",
  };

  return (
    <>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} isAr={isAr} />
      <div style={{ padding: "32px 18px 22px", background: DA_SURFACE2, borderTop: `1px solid ${DA_RULE}`, fontFamily: SANS }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: DA_INK1, color: DA_GOLD, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 11 }}>P</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 16, color: DA_INK1, letterSpacing: -0.2 }}>PackMetrix</div>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: DA_INK2, lineHeight: 1.5 }}>{L.tagline}</p>
        <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
          {L.cols.map((col, i) => (
            <div key={i}>
              <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: DA_INK3, marginBottom: 9 }}>{col.head}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {col.links.map((link, j) => (
                  link.contact
                    ? <button key={j} onClick={() => setContactOpen(true)} style={{ fontSize: 12, color: DA_INK1, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: isAr ? "right" : "left", fontFamily: SANS }}>{link.label}</button>
                    : <a key={j} href={link.href} style={{ fontSize: 12, color: DA_INK1, textDecoration: "none" }}>{link.label}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 22, paddingTop: 14, borderTop: `1px solid ${DA_RULE}`, fontSize: 10.5, color: DA_INK3, textAlign: "center" }}>{L.copy}</div>
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const isMobile = useIsMobile();
  const lang = useLang();
  const isAr = lang === "ar";

  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);

  useEffect(() => { posthog.capture("landing_page_viewed", { lang, device: isMobile ? "mobile" : "desktop" }); }, [isMobile, lang]);

  useEffect(() => {
    fetch("/api/founding-spots")
      .then(r => r.json())
      .then(d => setSpotsRemaining(d.remaining ?? 0))
      .catch(() => setSpotsRemaining(0));
  }, []);

  return (
    <div dir={isAr ? "rtl" : "ltr"} className={isAr ? "lp-ar" : undefined} style={{ background: DA_BG, fontFamily: SANS, minHeight: "100vh" }}>
      {isMobile ? (
        <>
          <MobileLandingNav lang={lang} />
          <MobileLandingHero lang={lang} spotsRemaining={spotsRemaining} />
          <MobileLandingFeatures lang={lang} />
          <MobileLandingHowItWorks lang={lang} />
          <TemplateShowcase lang={lang} mobile />
          <MobileLandingExamples lang={lang} />
          <MobileLandingPricing lang={lang} spotsRemaining={spotsRemaining} />
          <MobileLandingDemo lang={lang} />
          <MobileLandingFinalCta lang={lang} />
          <MobileLandingFooter lang={lang} />
        </>
      ) : (
        <>
          <LandingNav lang={lang} />
          <LandingHero lang={lang} spotsRemaining={spotsRemaining} />
          <LandingFeatures lang={lang} />
          <LandingHowItWorks lang={lang} />
          <TemplateShowcase lang={lang} />
          <LandingExamples lang={lang} />
          <LandingPricing lang={lang} spotsRemaining={spotsRemaining} />
          <LandingDemo lang={lang} />
          <LandingFinalCta lang={lang} />
          <LandingFooter lang={lang} />
        </>
      )}
    </div>
  );
}