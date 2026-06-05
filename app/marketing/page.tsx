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
  titleAr: "اكتشف جمال مالطا هذا الصيف!",
  destination: "Malta",
  price: "388",
  currency: "€",
  nights: "5",
  descriptionEn: "Mediterranean light, harbour walks, and a hotel inside the old citadel walls.",
  descriptionAr: "ضوء البحر المتوسط، نزهات في الميناء، وفندق داخل أسوار القلعة.",
  primaryLanguage: "en",
  whatsapp: "",
  messenger: "",
  coverImage: "",
};

const MALTA_HL_EN = ["City centre hotel", "Guided city tour", "Return flights"];
const MALTA_HL_AR = ["فندق وسط المدينة", "جولة مع مرشد", "تذاكر طيران"];

// Salalah package data — used in How-it-works step 4 screenshot (ShotPublished)
const SALALAH_CORE: CoreForm = {
  titleEn: "Salalah khareef escape",
  titleAr: "رحلة خريف صلالة العائلية",
  destination: "Salalah, Oman",
  price: "2,950",
  currency: "﷼",
  nights: "5",
  descriptionEn: "Misty mountains, waterfalls, and the green season — five nights for the whole family.",
  descriptionAr: "ضباب الجبال، الشلالات، وموسم الخريف الأخضر — خمس ليالٍ لكل العائلة.",
  primaryLanguage: "ar",
  whatsapp: "",
  messenger: "",
  coverImage: "",
};
const SALALAH_HL_EN = ["4-star hotel", "Car with driver", "Khareef tours"];
const SALALAH_HL_AR = ["فندق ٤ نجوم", "سيارة مع سائق", "جولات الخريف"];

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
  // TODO: native AR speaker to verify tone — "ثبّت" / launch-price phrasing
  const L = isAr
    ? { nav: ["المنتج", "القوالب", "أمثلة", "الأسعار"], login: "تسجيل الدخول", claim: "ثبّت ٣٩ €" }
    : { nav: ["Product", "Templates", "Examples", "Pricing"], login: "Login", claim: "Lock in €39" };

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
        <div style={{ fontFamily: DISPLAY, fontSize: 19, color: DA_INK1, letterSpacing: -0.2 }}>Packmetrix</div>
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
        <a href={`${AGENCY_URL}/login`} style={{ fontFamily: SANS, fontSize: 13, color: DA_INK1, fontWeight: 500, cursor: "pointer", textDecoration: "none", marginInline: 4 }}>{L.login}</a>
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
  // TODO: native AR speaker to verify tone — "ثبّت" / launch-price phrasing
  const L = isAr
    ? { nav: ["المنتج", "القوالب", "أمثلة", "الأسعار"], login: "تسجيل الدخول", claim: "ثبّت ٣٩ €" }
    : { nav: ["Product", "Templates", "Examples", "Pricing"], login: "Login", claim: "Lock in €39" };
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
          <div style={{ fontFamily: DISPLAY, fontSize: 17, color: DA_INK1, letterSpacing: -0.2 }}>Packmetrix</div>
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
                }}>{l}</div>
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
  // TODO: native AR speaker to verify tone — "ثبّت" / launch-price phrasing
  const L = isAr ? {
    eyebrowSuffix: "من ٥٠ مكاناً بسعر الإطلاق",
    eyebrowFallback: "٤٩ من ٥٠ مكاناً بسعر الإطلاق",
    // TODO[native-ar-review]: confirm "قدّم وبع" reads naturally and confidently; confirm "علامتك التجارية" vs "هويتك" for the target audience — PROVISIONAL pending native review
    titleA: "قدّم وبع باقاتك",
    titleB: "باحترافية، تحت علامتك التجارية.",
    sub: "ألصق برنامج رحلتك. اختر قالباً. انشر صفحة احترافية على نطاقك — جاهزة للمشاركة أينما كان عملاؤك. تتبّع المشاهدات والعملاء من صندوق واحد.",
    primary: "ثبّت سعر ٣٩ € مدى الحياة",
    // TODO: native AR speaker to verify tone — "احجز عرضاً" phrasing
    demo: "احجز عرضاً",
    secondary: "شاهد صفحة حقيقية",
    proofA: `تجربة ${TRIAL_DAYS} يوم`,
    proofB: "ثبّت ٣٩ €/شهر مدى الحياة",
    proofC: "بدون بطاقة ائتمان",
  } : {
    eyebrowSuffix: "of 50 launch spots left",
    eyebrowFallback: "49 of 50 launch spots left",
    titleA: "Present and sell every package",
    titleB: "beautifully, on your own brand.",
    sub: "Paste your itinerary. Pick a template. Publish a polished, branded page on your own domain — ready to share wherever your customers are. Track views and leads in one inbox.",
    primary: "Lock in €39 forever",
    demo: "Book a demo",
    secondary: "See a real landing page",
    proofA: `${TRIAL_DAYS}-day trial`,
    proofB: "Lock €39/mo for life",
    proofC: "No credit card",
  };

  const eyebrow = spotsRemaining !== null
    ? L.eyebrowSuffix
    : L.eyebrowFallback;

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
          <FoundingChip spotsRemaining={spotsRemaining} eyebrow={eyebrow} />

          <h1 style={{
            margin: "22px 0 0",
            fontFamily: DISPLAY, fontSize: 64, fontWeight: 400,
            color: DA_INK1, letterSpacing: -1.8, lineHeight: 1.02,
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
        {/* dir="ltr" locks this design composition so it never flips in RTL */}
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
  // TODO: native AR speaker to verify tone — "ثبّت" / launch-price phrasing
  const L = isAr ? {
    eyebrowSuffix: "من ٥٠ مكاناً بسعر الإطلاق",
    eyebrowFallback: "٤٩ من ٥٠ مكاناً بسعر الإطلاق",
    // TODO[native-ar-review]: confirm "قدّم وبع" reads naturally and confidently; confirm "علامتك التجارية" vs "هويتك" for the target audience — PROVISIONAL pending native review
    titleA: "قدّم وبع باقاتك",
    titleB: "باحترافية، تحت علامتك التجارية.",
    sub: "ألصق برنامج رحلتك. اختر قالباً. انشر على نطاقك. تتبّع العملاء.",
    primary: "ثبّت سعر ٣٩ € مدى الحياة",
    // TODO: native AR speaker to verify tone — "احجز عرضاً" phrasing
    demo: "احجز عرضاً",
    secondary: "شاهد صفحة حقيقية",
    proof: [`تجربة ${TRIAL_DAYS} يوم`, "٣٩ €/شهر مدى الحياة", "بدون بطاقة ائتمان"],
  } : {
    eyebrowSuffix: "of 50 launch spots left",
    eyebrowFallback: "49 of 50 launch spots left",
    titleA: "Present and sell every package",
    titleB: "beautifully, on your own brand.",
    sub: "Paste your itinerary. Pick a template. Publish at your domain. Track every lead.",
    primary: "Lock in €39 forever",
    demo: "Book a demo",
    secondary: "See a real landing page",
    proof: [`${TRIAL_DAYS}-day trial`, "€39/mo for life", "No credit card"],
  };

  const eyebrow = spotsRemaining !== null
    ? L.eyebrowSuffix
    : L.eyebrowFallback;

  return (
    <div id="product" style={{ padding: "28px 18px 36px", position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse at 50% 0%, rgba(176,138,62,.08), transparent 50%)",
      }} />
      <div style={{ position: "relative" }}>
        <FoundingChip spotsRemaining={spotsRemaining} eyebrow={eyebrow} />

        <h1 style={{
          margin: "16px 0 0", fontFamily: DISPLAY, fontSize: 38, fontWeight: 400,
          color: DA_INK1, letterSpacing: -1.1, lineHeight: 1.04,
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
    eyebrow: "كل ما تحتاجه",
    title: "مبنية لوكالات السفر،",
    titleAccent: "ليست أداةً عامة.",
    sub: "ست أدوات صنعناها تحديداً للطريقة التي يبيع بها مكاتب السفر — لا منشئ مواقع عام.",
    cards: [
      { eyebrow: "01 · المحتوى", title: "ذكاء اصطناعي يستخرج باقتك", body: "ألصق رسالة واتساب أو وصف رحلة بأي صياغة — يستخرج Packmetrix الوجهة والسعر وعدد الليالي والأماكن المتضمَّنة في صفحة احترافية." },
      { eyebrow: "02 · القوالب", title: "عشرة قوالب جاهزة بصرياً", body: "عشرة تصاميم — لكل نوع رحلة شكله الخاص. شاهد معاينات بصرية حقيقية بمحتواك أنت، واختر ما يناسبك بعينيك." },
      { eyebrow: "03 · العملاء", title: "صندوق عملاء يلتقط واتساب", body: "كل ضغطة على زر الواتساب تظهر في صندوقك مع تاريخ تصفّح كامل وحرارة اهتمام. لا تفقد عميلاً مهتمّاً مجدداً." },
      { eyebrow: "04 · النطاق", title: "نطاقك الخاص بشهادة SSL", body: "صفحاتك على نطاقك أنت، لا على نطاق شركة أخرى. سجّل سجل CNAME واحداً فقط، ونتولّى شهادة SSL والإعداد تلقائياً." }, // TODO: native AR speaker to verify tone
      { eyebrow: "05 · الجوّال", title: "أول أولوية: الهاتف", body: "أغلب العملاء يصلون من قصة إنستغرام أو رسالة واتساب — على هاتف. كل قالب يبدو رائعاً على شاشة ٤٠٠ بكسل قبل أي شيء آخر." },
      { eyebrow: "06 · اللغة", title: "ثنائي اللغة بالكامل", body: "إنجليزي وعربي مع دعم RTL حقيقي — ليس ترجمة آلية. التقويم الهجري، فروقات المهرم، تأكيدات النيّة — كل ما يحتاج باقات العمرة." },
    ],
  } : {
    eyebrow: "Everything you need",
    title: "Built for travel agencies,",
    titleAccent: "not a generic website builder.",
    sub: "Six tools we built specifically for the way agencies sell trips — not a one-size-fits-all page builder.",
    cards: [
      { eyebrow: "01 · Content", title: "AI extracts your package from text", body: "Paste a WhatsApp message or a one-pager — Packmetrix lifts destination, price, nights, and inclusions into a clean, structured page in seconds." },
      { eyebrow: "02 · Templates", title: "Ten templates, pick with your eyes", body: "Ten designs, each built for a kind of trip. Real visual previews with your own content — not a name list. Pick with your eyes, customise everything." },
      { eyebrow: "03 · Leads", title: "WhatsApp-native lead inbox", body: "Every WhatsApp tap lands in your inbox with full browsing history and an engagement score. Never lose a warm enquiry to a missed notification again." },
      { eyebrow: "04 · Domain", title: "Your own domain, with SSL", body: "tours.your-agency.com — not packmetrix.com. One CNAME record, we provision the SSL certificate automatically. Branded from the first click." },
      { eyebrow: "05 · Mobile", title: "Built for the phone, first", body: "Most travellers arrive from an Instagram story or a WhatsApp message — on a phone. Every template is designed at 400px before it scales up, not the other way around." },
      { eyebrow: "06 · Bilingual", title: "English + Arabic, properly RTL", body: "Not Google-translated. Hijri calendar support, Mahram requirements for Umrah, RTL-aware typography. Both languages get the same care." },
    ],
  };

  const featureIcons = ["✦", "▣", "◎", "⊕", "◻", "⌖"];

  return (
    <div id="product" style={{ padding: "80px 48px", background: DA_SURFACE2 }}>
      <div style={{ maxWidth: 1280, marginInline: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
          <h2 style={{ margin: "12px 0 0", fontFamily: DISPLAY, fontSize: 48, fontWeight: 400, color: DA_INK1, letterSpacing: -1.2, lineHeight: 1.05 }}>
            {L.title}<br /><span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span>
          </h2>
          <p style={{ margin: "18px auto 0", maxWidth: 600, fontFamily: SANS, fontSize: 17, color: DA_INK2, lineHeight: 1.55 }}>{L.sub}</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
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
    eyebrow: "كل ما تحتاجه", title: "مبنية لوكالات السفر،", titleAccent: "ليست أداةً عامة.",
    cards: [
      { eyebrow: "01 · المحتوى", title: "ذكاء اصطناعي يستخرج باقتك", body: "ألصق رسالة واتساب أو وصف رحلة — نستخرج الوجهة والسعر والليالي." },
      { eyebrow: "02 · القوالب", title: "عشرة قوالب بصرية", body: "عشرة قوالب لكل نوع رحلة. شاهد معاينات حقيقية واختر بعينيك." },
      { eyebrow: "03 · العملاء", title: "صندوق واتساب", body: "كل ضغطة على واتساب تظهر في صندوقك مع تاريخ تصفّح كامل." },
      { eyebrow: "04 · النطاق", title: "نطاقك بشهادة SSL", body: "نطاقك أنت، لا نطاق شركة أخرى. سجل CNAME واحد فقط." }, // TODO: native AR speaker to verify tone
      { eyebrow: "05 · الجوّال", title: "أول أولوية: الهاتف", body: "كل قالب مصمم للهاتف أوّلاً — لأن معظم العملاء يصلون من قصة إنستغرام." },
      { eyebrow: "06 · اللغة", title: "ثنائي اللغة بالكامل", body: "RTL حقيقي. تقويم هجري. ليس ترجمة آلية." },
    ],
  } : {
    eyebrow: "Everything you need", title: "Built for travel agencies,", titleAccent: "not a generic builder.",
    cards: [
      { eyebrow: "01 · Content", title: "AI extracts your package", body: "Paste a WhatsApp message or itinerary — we lift destination, price, nights, inclusions." },
      { eyebrow: "02 · Templates", title: "Ten visual templates", body: "Ten designs for every trip type. Real previews with your own content — pick with your eyes." },
      { eyebrow: "03 · Leads", title: "WhatsApp-native inbox", body: "Every WhatsApp tap lands in your inbox with full browsing history and engagement score." },
      { eyebrow: "04 · Domain", title: "Your own domain, SSL auto", body: "tours.maraya.travel — not packmetrix. One CNAME, we provision SSL." },
      { eyebrow: "05 · Mobile", title: "Built for the phone, first", body: "Every template is designed for 400px first — because that's where your clients arrive." },
      { eyebrow: "06 · Bilingual", title: "English + Arabic, properly RTL", body: "Hijri calendar, Mahram support, RTL typography. Not Google-translated." },
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
// Shot components: ShotPaste, ShotStructured, ShotPublished are designed
// approximations of the product UI — replace with real screenshots when ready.
// ShotTemplates uses real MINI_RENDERS directly (no simplified version).

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

// TODO: replace with real screenshot
function ShotPaste({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  return (
    <ShotFrame url="packmetrix.com/builder" height={300}>
      <div dir={isAr ? "rtl" : "ltr"} style={{ padding: 18, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.3, textTransform: "uppercase", color: DA_GOLD, marginBottom: 4 }}>
          {isAr ? "باقة جديدة · ١ من ٤" : "New package · 1 of 4"}
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 400, color: DA_INK1, letterSpacing: -0.4, marginBottom: 12 }}>
          {isAr ? "ألصق نص باقتك" : "Paste your package text"}
        </div>
        <div style={{
          flex: 1, background: DA_SURFACE2, border: `1px solid ${DA_RULE2}`,
          borderRadius: 9, padding: 13,
          fontFamily: SANS, fontSize: 12, color: DA_INK1, lineHeight: 1.7,
          position: "relative", overflow: "hidden",
        }}>
          {isAr ? (
            <div style={{ direction: "rtl", textAlign: "right" }}>
              {"عرض خريف صلالة 🌿 من جدة"}<br />
              {"٥ ليالٍ — فندق ٤ نجوم + سيارة"}<br />
              {"يشمل الطيران والإقامة والتنقلات والجولات"}<br />
              {"من ٢٬٩٥٠ ريال للفرد · الأطفال خصم ٢٥٪"}
            </div>
          ) : (
            <div style={{ direction: "ltr", textAlign: "left" }}>
              {"Malta summer escape 🌊 — 5 nights"}<br />
              {"4-star hotel in Valletta + daily breakfast"}<br />
              {"Includes return flights, airport transfers,"}<br />
              {"guided city tour · from €388/person"}
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
            <SparkSVG size={13} />{isAr ? "استخراج بالذكاء الاصطناعي" : "Extract with AI"}
          </div>
          <span style={{ fontFamily: SANS, fontSize: 11.5, color: DA_INK3 }}>
            {isAr ? "أو املأ يدوياً" : "or fill in manually"}
          </span>
        </div>
      </div>
    </ShotFrame>
  );
}

// TODO: replace with real screenshot
function ShotStructured({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const fields: [string, string][] = isAr ? [
    ["الوجهة", "صلالة، عُمان"], ["نوع الرحلة", "عائلي"], ["عدد الليالي", "٥"],
    ["السعر للفرد", "٢٬٩٥٠ ﷼"], ["الإقامة", "فندق ٤ نجوم"], ["النقل", "سيارة مع سائق"],
  ] : [
    ["Destination", "Salalah, Oman"], ["Trip type", "Family"], ["Nights", "5"],
    ["Price / person", "2,950 SAR"], ["Stay", "4-star hotel"], ["Transport", "Car with driver"],
  ];
  const chips = isAr
    ? ["الطيران", "الإقامة", "التنقلات", "جولات الخريف", "خصم الأطفال ٢٥٪"]
    : ["Flights", "Hotel", "Transfers", "Khareef tours", "Kids −25%"];
  return (
    <ShotFrame url="packmetrix.com/builder" height={300}>
      <div dir={isAr ? "rtl" : "ltr"} style={{ padding: 18, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.3, textTransform: "uppercase", color: DA_GOLD, marginBottom: 4 }}>
              {isAr ? "مراجعة · ٢ من ٤" : "Review · 2 of 4"}
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 400, color: DA_INK1, letterSpacing: -0.4 }}>
              {isAr ? "راجِع وعدّل الحقول" : "Review & edit the fields"}
            </div>
          </div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "4px 9px", background: DA_GREEN_SOFT, color: DA_GREEN,
            borderRadius: 999, fontFamily: SANS, fontSize: 10.5, fontWeight: 600,
          }}>
            <SparkSVG size={10} />{isAr ? "عُبّئت تلقائياً" : "Auto-filled"}
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
            {isAr ? "يشمل" : "Includes"}
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
          }}>{isAr ? "متابعة" : "Continue"}<ArrowSVG size={12} /></div>
        </div>
      </div>
    </ShotFrame>
  );
}

// ShotTemplates — uses real MINI_RENDERS, not a simplified version
function ShotTemplates({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const ids = ["family", "aurora", "sakina", "pulse", "petal", "tribe"] as const;
  const selected = "family";
  return (
    <ShotFrame url="packmetrix.com/builder" height={300}>
      <div dir={isAr ? "rtl" : "ltr"} style={{ padding: 18, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.3, textTransform: "uppercase", color: DA_GOLD, marginBottom: 4 }}>
          {isAr ? "القالب · ٣ من ٤" : "Template · 3 of 4"}
        </div>
        <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 400, color: DA_INK1, letterSpacing: -0.4, marginBottom: 12 }}>
          {isAr ? "اختر القالب بعينيك" : "Choose a template by sight"}
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

// TODO: replace with real screenshot
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
        insetInlineStart: isAr ? "auto" : 8, insetInlineEnd: isAr ? 8 : "auto",
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
          { v: isAr ? "١٬٢٨٤" : "1,284", l: isAr ? "مشاهدة" : "views", gold: false },
          { v: isAr ? "٢٣+"   : "+23",   l: isAr ? "عميل"   : "leads",  gold: true  },
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
    eyebrow: "كيف يعمل",
    title: "من باقتك إلى",
    titleAccent: "صفحة مباشرة في دقائق.",
    sub: "أربع خطوات. لا أكواد، لا مصمم. هذه لقطات حقيقية من المنتج.",
    steps: [
      { title: "ألصق باقتك", body: "ألصق العرض كما ترسله على واتساب تماماً — عربي، إنجليزي، أو الاثنين. مع الرموز التعبيرية وكل شيء." },
      { title: "يُهيكلها الذكاء الاصطناعي", body: "يقرأها باكميتركس ويملأ كل حقل: الوجهة، الليالي، السعر، الفندق، وما يشمله. عدّل أي شيء بنقرة." },
      { title: "اختر قالباً", body: "عشرة تصاميم، لكل نوع رحلة. شاهدها بمحتواك الحقيقي، واختر الأنسب. هذه أقوى لحظة بصرية في المنتج." },
      { title: "انشر وتتبّع", body: "انشر على نطاقك، ضع الرابط في واتساب أو إنستغرام، وشاهد المشاهدات والعملاء يصلون إلى صندوقك مباشرة." },
    ],
  } : {
    eyebrow: "How it works",
    title: "From your package to a",
    titleAccent: "live page in minutes.",
    sub: "Four steps. No code, no designer. These are real screenshots from the product.",
    steps: [
      { title: "Paste your package", body: "Paste the offer exactly as you'd send it on WhatsApp — Arabic, English, or both. Emojis and all." },
      { title: "AI structures it", body: "Packmetrix reads it and fills every field: destination, nights, price, hotel, inclusions. Edit anything in a tap." },
      { title: "Choose a template", body: "Ten designs, each built for a kind of trip. See them with your real content and pick the one that fits — the product's strongest visual moment." },
      { title: "Publish & track", body: "Publish to your domain, drop the link in WhatsApp or Instagram, and watch views and leads land in your inbox in real time." },
    ],
  };

  return (
    <div id="how-it-works" style={{ padding: "80px 48px", background: DA_BG }}>
      <div style={{ maxWidth: 1180, marginInline: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
          <h2 style={{ margin: "12px 0 0", fontFamily: DISPLAY, fontSize: 48, fontWeight: 400, color: DA_INK1, letterSpacing: -1.2, lineHeight: 1.05 }}>
            {L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span>
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
                  <h3 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 28, fontWeight: 400, color: DA_INK1, letterSpacing: -0.6, lineHeight: 1.1 }}>{s.title}</h3>
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
    title: "من باقتك إلى صفحة مباشرة",
    titleAccent: "في دقائق.",
    steps: [
      { title: "ألصق باقتك", body: "ألصق العرض كما ترسله على واتساب — عربي، إنجليزي، أو الاثنين." },
      { title: "يُهيكلها الذكاء الاصطناعي", body: "يملأ كل حقل تلقائياً: الوجهة، الليالي، السعر، الفندق. عدّل بنقرة." },
      { title: "اختر قالباً", body: "عشرة قوالب لكل نوع رحلة. شاهدها بمحتواك الحقيقي واختر." },
      { title: "انشر وتتبّع", body: "صفحة هبوط على نطاقك. شارك الرابط على واتساب وتابع العملاء." },
    ],
  } : {
    eyebrow: "How it works",
    title: "From your package to a live page",
    titleAccent: "in minutes.",
    steps: [
      { title: "Paste your package", body: "Paste the offer exactly as you'd send it on WhatsApp — Arabic, English, or both." },
      { title: "AI structures it", body: "Fills every field automatically: destination, nights, price, hotel. Edit anything in a tap." },
      { title: "Choose a template", body: "Ten designs for every trip type. See them with your real content and pick the one that fits." },
      { title: "Publish & track", body: "A live page at your domain. Drop the link on WhatsApp and watch leads arrive." },
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
                  display: "flex", alignItems: "center", justifyContent: "center",
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
    ? { eyebrow: "القوالب", title: "اختر الشكل الذي يناسب", titleAccent: "نوع الرحلة.", sub: "عشرة قوالب — لكل قالب شخصية بصرية واضحة وحالة استخدام محددة. ابدأ من قالب، خصّص كل شيء.", seeAll: "استعرض القوالب العشرة" }
    : { eyebrow: "Templates", title: "Pick the look that fits", titleAccent: "the trip.", sub: "Ten templates — each with a clear visual personality and a specific use case. Start from one, customise everything.", seeAll: "See all 10 templates" };

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
//
// TODO: real-url swap-in points — replace before going live:
//   1. Sakina / Umrah (AR):       data-todo="real-url" href="#"  →  actual published page URL
//   2. Pulse / Sardinia (EN):     data-todo="real-url" href="#"  →  actual published page URL
//   3. Petal / Maldives (EN):     data-todo="real-url" href="#"  →  actual published page URL
//   4. Family / Salalah (AR):     data-todo="real-url" href="#"  →  actual published page URL
//   5. Aurora / Cappadocia (EN):  data-todo="real-url" href="#"  →  actual published page URL
//   6. Tribe / Wadi Rum (AR):     data-todo="real-url" href="#"  →  actual published page URL
//
// Cover images: all exampleCover() entries are gradient placeholders.
// TODO: swap each gradient for the real published page's cover photo once pages are live.

// TODO: replace gradients with real cover photos once published pages are ready
function exampleCover(kind: string): string {
  const grads: Record<string, string> = {
    umrah:      "linear-gradient(135deg, #3f7d52 0%, #1f4a30 100%)",      // TODO: real cover → Makkah/Madinah photo
    sardinia:   "linear-gradient(135deg, #e0734a 0%, #b5371f 100%)",      // TODO: real cover → Sardinia coast photo
    maldives:   "linear-gradient(135deg, #4ec5d4 0%, #1f6f8a 60%, #143a52 100%)", // TODO: real cover → Maldives overwater photo
    salalah:    "linear-gradient(135deg, #6ea069 0%, #355c34 100%)",      // TODO: real cover → Salalah khareef photo
    cappadocia: "linear-gradient(135deg, #d4865a 0%, #864a26 100%)",      // TODO: real cover → Cappadocia balloons photo
    wadirum:    "linear-gradient(135deg, #c46a44 0%, #6a2f1a 100%)",      // TODO: real cover → Wadi Rum desert photo
  };
  return grads[kind] ?? "linear-gradient(135deg, #5a6e9a 0%, #2a3a5e 100%)";
}

type ExampleItem = {
  kind: string; ar: boolean;
  destination: string; title: string; tag: string;
  price: string; was?: string; agency: string; lang: string;
  coverImage?: string; // real photo URL — gradient fallback when absent
  url?: string;        // live page href — disables link when absent
};

const DEMO_TEMPLATE_TAGS: Record<string, { en: string; ar: string }> = {
  sakina:  { en: "Umrah",    ar: "عمرة"      },
  family:  { en: "Family",   ar: "عائلي"     },
  pulse:   { en: "Deal",     ar: "عرض"       },
  petal:   { en: "Boutique", ar: "بوتيك"     },
  aurora:  { en: "Luxury",   ar: "فاخر"      },
  tribe:   { en: "Group",    ar: "مجموعات"   },
  compass: { en: "Trek",     ar: "مشي"       },
  voyage:  { en: "Voyage",   ar: "بحري"      },
  atlas:   { en: "Explorer", ar: "مستكشف"    },
  smart:   { en: "Smart",    ar: "ذكي"       },
};

async function fetchDemoPackages(lang: "en" | "ar"): Promise<ExampleItem[]> {
  const snap = await getDocs(
    query(collection(db, "packages"), where("isDemo", "==", true))
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pkgs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
    .filter(p => (p.primaryLanguage || p.language) === lang && p.status === "active");

  // Fetch agency display name once (all demo packages share a userId)
  let agencyName = lang === "ar" ? "مرايا للأسفار" : "Maraya Journeys";
  if (pkgs.length > 0 && pkgs[0].userId) {
    try {
      const userSnap = await getDoc(doc(db, "users", pkgs[0].userId));
      if (userSnap.exists()) agencyName = userSnap.data().name || agencyName;
    } catch { /* keep default */ }
  }

  return pkgs.slice(0, 6).map(p => {
    const tagObj = DEMO_TEMPLATE_TAGS[p.templateId as string] ?? { en: "Travel", ar: "سفر" };
    const rawTitle = p.title;
    const title = rawTitle && typeof rawTitle === "object"
      ? (rawTitle[lang] || rawTitle.en || rawTitle.ar || "")
      : String(rawTitle || "");

    return {
      kind:       String(p.templateId || "travel"),
      ar:         lang === "ar",
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
      destination: isAr ? "مكة والمدينة" : "Makkah & Madinah",
      title: "عمرة رمضان · ١٠ ليالٍ",
      tag: isAr ? "عمرة" : "Umrah",
      price: isAr ? "٤٬٢٠٠ ﷼" : "4,200 SAR",
      agency: isAr ? "دار السكينة للسفر" : "Dar Al-Sakina Travel",
      lang: "AR",
    },
    {
      kind: "sardinia", ar: false,
      destination: "Sardinia, Italy",
      title: "Last-minute weekend escape",
      tag: "Last-minute",
      price: "€499", was: "€919",
      agency: "Levant Voyages",
      lang: "EN",
    },
    {
      kind: "maldives", ar: false,
      destination: "Maldives",
      title: "Just the two of you · 7 nights",
      tag: "Honeymoon",
      price: "€4,200 / couple",
      agency: "Cedar & Sea",
      lang: "EN",
    },
    {
      kind: "salalah", ar: true,
      destination: isAr ? "صلالة، عُمان" : "Salalah, Oman",
      title: "خريف ظفار العائلي · ٥ ليالٍ",
      tag: isAr ? "عائلي" : "Family",
      price: isAr ? "٢٬٩٥٠ ﷼" : "2,950 SAR",
      agency: isAr ? "مرايا للأسفار" : "Maraya Journeys",
      lang: "AR",
    },
    {
      kind: "cappadocia", ar: false,
      destination: "Cappadocia, Türkiye",
      title: "Hot-air balloons · boutique stay",
      tag: "Boutique",
      price: "€549",
      agency: "Maraya Journeys",
      lang: "EN",
    },
    {
      kind: "wadirum", ar: true,
      destination: isAr ? "وادي رم، الأردن" : "Wadi Rum, Jordan",
      title: "رحلة جماعية · ٤ ليالٍ",
      tag: isAr ? "مجموعات" : "Group",
      price: isAr ? "٦٩٩ ﷼ / شخص" : "699 SAR / person",
      agency: isAr ? "قبيلة الرحالة" : "Tribe Travel Co.",
      lang: "AR",
    },
  ];
}

function ExampleCard({ ex, lang }: { ex: ExampleItem; lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  // TODO: native AR speaker to verify tone — "ثبّت" / launch-price phrasing
  const seeLive = isAr ? "شاهد الصفحة المباشرة" : "See live page";
  const comingSoon = isAr ? "قريباً" : "Coming soon";
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
        {/* lang chip — TODO: native AR speaker to verify tone for عربي / إنجليزي */}
        <div style={{ position: "absolute", top: 12, insetInlineEnd: 12 }}>
          <span style={{
            padding: "3px 8px", background: "rgba(13,10,6,.45)", color: "rgba(255,255,255,.92)",
            borderRadius: 999, fontFamily: MONO, fontSize: 9.5, fontWeight: 500, letterSpacing: .3,
            backdropFilter: "blur(8px)",
          }}>{ex.lang === "AR" ? (isAr ? "عربي" : "AR") : (isAr ? "إنجليزي" : "EN")}</span>
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
    fetchDemoPackages(lang).then(setLiveData).catch(() => {/* keep static fallback */});
  }, [lang]);
  const data = liveData ?? exampleData(isAr);
  // TODO: native AR speaker to verify tone — "ثبّت" / launch-price phrasing
  const L = isAr ? {
    eyebrow: "أمثلة حقيقية",
    title: "شاهد صفحات",
    titleAccent: "حقيقية منشورة.",
    sub: "هذه صفحات هبوط فعلية أنشأتها وكالات على باكميتركس — اضغط أيّاً منها لرؤيتها مباشرة كما يراها المسافر.",
  } : {
    eyebrow: "Real examples",
    title: "See real",
    titleAccent: "example pages.",
    sub: "These are actual landing pages agencies built on Packmetrix — click any one to see it live, exactly as a traveller would.",
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
            margin: "12px 0 0", fontFamily: DISPLAY, fontSize: 48, fontWeight: 400,
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
    fetchDemoPackages(lang).then(setLiveData).catch(() => {/* keep static fallback */});
  }, [lang]);
  const data = liveData ?? exampleData(isAr);
  // TODO: native AR speaker to verify tone — "ثبّت" / launch-price phrasing
  const L = isAr ? {
    eyebrow: "أمثلة حقيقية",
    title: "شاهد صفحات",
    titleAccent: "حقيقية منشورة.",
  } : {
    eyebrow: "Real examples",
    title: "See real",
    titleAccent: "example pages.",
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

  // TODO: native AR speaker to verify tone — "ثبّت" / launch-price phrasing
  const L = isAr ? {
    eyebrow: "الأسعار", title: "خطّة واحدة.", titleAccent: "بسعر الإطلاق، ثابت مدى الحياة.",
    sub: "أوّل ٥٠ وكالة تشترك تحصل على سعر ٣٩ €/شهر — ويبقى ثابتاً ما دامت مشتركة. بعد ذلك يصبح السعر ٧٩ €/شهر للوكالات الجديدة.",
    chip: "سعر الإطلاق · ٥٠ مكاناً", planName: "سعر الإطلاق", perMonth: "/شهر",
    locked: "ثابت مدى الحياة · ٧٩ € لاحقاً",
    spotsLine: spotsRemaining !== null ? `${spotsRemaining} من ٥٠ مكاناً بسعر الإطلاق` : "٤٩ من ٥٠ مكاناً بسعر الإطلاق",
    monthly: "شهري", annual: "سنوي", annualSave: "وفّر ١٧٪",
    included: "كل المزايا مشمولة",
    items: ["صفحات باقات غير محدودة", "كل القوالب العشرة", "نطاق مخصص بشهادة SSL", "صندوق عملاء واتساب وماسنجر", "تصدير العملاء (CSV)", "تحليلات بدون حد زمني", "بحث في الصور والفيديو"],
    cta: "ثبّت سعر ٣٩ € مدى الحياة",
    trust: `تجربة ${TRIAL_DAYS} يوم · بدون بطاقة ائتمان · إلغاء في أيّ وقت`,
    // TODO: native AR speaker to verify tone
    notReady: "لست مستعداً بعد؟",
    demoLink: "احجز عرضاً أولاً",
    after: "بعد انتهاء سعر الإطلاق: ٧٩ €/شهر للوكالات الجديدة. ثبّت سعرك الآن ولن يتغيّر أبداً.",
  } : {
    eyebrow: "Pricing", title: "One plan.", titleAccent: "Launch price, locked for life.",
    sub: "The first 50 agencies lock in €39/mo — and keep that price for as long as they stay. After that, new agencies pay €79/mo.",
    chip: "Launch price · 50 spots", planName: "Launch price", perMonth: "/mo",
    locked: "Locked for life · €79 later",
    spotsLine: spotsRemaining !== null ? `${spotsRemaining} of 50 launch spots left` : "49 of 50 launch spots left",
    monthly: "Monthly", annual: "Annual", annualSave: "Save 17%",
    included: "Everything included",
    items: ["Unlimited package pages", "All 10 templates", "Custom domain + SSL", "WhatsApp + Messenger lead inbox", "Lead export (CSV)", "Unlimited analytics history", "Photo & video search"],
    cta: "Lock in €39 forever",
    trust: `${TRIAL_DAYS}-day trial · no credit card · cancel anytime`,
    notReady: "Not ready yet?",
    demoLink: "Book a demo first",
    after: "After launch pricing ends: €79/mo for new agencies. Lock in now and your price never changes.",
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
                <div style={{ marginTop: 10, display: "inline-flex", padding: 3, background: DA_BG, border: `1px solid ${DA_RULE2}`, borderRadius: 999, fontSize: 11, fontWeight: 500, fontFamily: SANS }}>
                  <div onClick={() => setAnnual(false)} style={{ padding: "3px 10px", borderRadius: 999, background: !annual ? DA_INK1 : "transparent", color: !annual ? DA_BG : DA_INK2, cursor: "pointer", userSelect: "none" }}>{L.monthly}</div>
                  <div onClick={() => setAnnual(true)} style={{ padding: "3px 10px", borderRadius: 999, background: annual ? DA_INK1 : "transparent", color: annual ? DA_BG : DA_INK2, cursor: "pointer", userSelect: "none", display: "inline-flex", alignItems: "center", gap: 5 }}>
                    {L.annual}
                    <span style={{ fontSize: 9, padding: "1px 5px", background: DA_GREEN, color: "#fff", borderRadius: 999, letterSpacing: 0.3 }}>{L.annualSave}</span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 1.3, textTransform: "uppercase", color: DA_INK3, marginBottom: 14 }}>{L.included}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px 18px", marginBottom: 28 }}>
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

  // TODO: native AR speaker to verify tone — "ثبّت" / launch-price phrasing
  const L = isAr ? {
    eyebrow: "الأسعار", title: "خطّة واحدة.", titleAccent: "بسعر الإطلاق، ثابت مدى الحياة.",
    spotsLine: spotsRemaining !== null ? `${spotsRemaining} من ٥٠ مكاناً بسعر الإطلاق` : "٤٩ من ٥٠ مكاناً بسعر الإطلاق",
    chip: "سعر الإطلاق · ٥٠ مكاناً", planName: "سعر الإطلاق", perMonth: "/شهر",
    locked: "ثابت مدى الحياة · ٧٩ € لاحقاً",
    items: ["صفحات باقات غير محدودة", "كل القوالب العشرة", "نطاق مخصص بشهادة SSL", "صندوق عملاء واتساب وماسنجر", "تصدير العملاء (CSV)", "تحليلات بدون حد زمني", "بحث في الصور والفيديو"],
    cta: "ثبّت سعر ٣٩ € مدى الحياة",
    trust: `تجربة ${TRIAL_DAYS} يوم · بدون بطاقة ائتمان · إلغاء في أيّ وقت`,
    // TODO: native AR speaker to verify tone
    notReady: "لست مستعداً بعد؟",
    demoLink: "احجز عرضاً أولاً",
  } : {
    eyebrow: "Pricing", title: "One plan.", titleAccent: "Launch price, locked for life.",
    spotsLine: spotsRemaining !== null ? `${spotsRemaining} of 50 launch spots left` : "49 of 50 launch spots left",
    chip: "Launch price · 50 spots", planName: "Launch price", perMonth: "/mo",
    locked: "Locked for life · €79 later",
    items: ["Unlimited package pages", "All 10 templates", "Custom domain + SSL", "WhatsApp + Messenger lead inbox", "Lead export (CSV)", "Unlimited analytics history", "Photo & video search"],
    cta: "Lock in €39 forever",
    trust: `${TRIAL_DAYS}-day trial · no credit card · cancel anytime`,
    notReady: "Not ready yet?",
    demoLink: "Book a demo first",
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
  // TODO: native AR speaker to verify tone
  const t = isAr ? {
    title: "تم الحجز!",
    sub: "سنتواصل معك على واتساب خلال ٢٤ ساعة لتحديد موعد العرض الشخصي.",
  } : {
    title: "You're booked!",
    sub: "We'll reach out on WhatsApp within 24 hours to schedule your personal walkthrough.",
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
  const [website, setWebsite] = useState(""); // honeypot — must stay empty
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [serverError, setServerError] = useState("");

  // TODO: native AR speaker to verify tone — "احجز عرضاً" / demo section phrasing
  const L = isAr ? {
    eyebrow: "عرض توضيحي",
    title: "شاهد باكميتركس",
    titleAccent: "وهي تعمل.",
    sub: "سنريك كيف تنشر أول صفحة باقة سفر مميزة في أقل من ١٠ دقائق — مباشرةً، على محتواك الخاص.",
    labelName: "اسمك", labelAgency: "اسم الوكالة",
    labelWA: "رقم واتساب", labelEmail: "البريد الإلكتروني", labelMessage: "رسالة",
    optional: "(اختياري)",
    placeholderName: "محمد أحمد", placeholderAgency: "وكالة النجوم",
    placeholderWA: "+966 55 123 4567", placeholderEmail: "you@agency.com",
    placeholderMessage: "أخبرنا عن وكالتك ونوع الباقات التي تبيعها...",
    cta: "احجز العرض", submitting: "جارٍ الإرسال...",
    errRequired: "هذا الحقل مطلوب", errPhone: "أدخل رقم واتساب صحيحاً",
    errEmail: "أدخل بريداً إلكترونياً صحيحاً", errServer: "حدث خطأ. يرجى المحاولة مجدداً.",
  } : {
    eyebrow: "Book a demo",
    title: "See Packmetrix",
    titleAccent: "in action.",
    sub: "We'll show you how to publish your first branded package page in under 10 minutes — live, on your own content.",
    labelName: "Your name", labelAgency: "Agency name",
    labelWA: "WhatsApp number", labelEmail: "Email", labelMessage: "Message",
    optional: "(optional)",
    placeholderName: "Jane Smith", placeholderAgency: "Desert Tours",
    placeholderWA: "+31 6 1234 5678", placeholderEmail: "you@agency.com",
    placeholderMessage: "Tell us about your agency and what packages you sell...",
    cta: "Book my demo", submitting: "Sending...",
    errRequired: "This field is required", errPhone: "Enter a valid WhatsApp number",
    errEmail: "Enter a valid email address", errServer: "Something went wrong. Please try again.",
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
              {/* Honeypot — invisible to users; bots fill it, we discard server-side */}
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
  const [website, setWebsite] = useState(""); // honeypot — must stay empty
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [serverError, setServerError] = useState("");

  // TODO: native AR speaker to verify tone — "احجز عرضاً" / demo section phrasing
  const L = isAr ? {
    eyebrow: "عرض توضيحي",
    title: "شاهد باكميتركس",
    titleAccent: "وهي تعمل.",
    sub: "سنريك كيف تنشر أول صفحة باقة سفر مميزة في أقل من ١٠ دقائق.",
    labelName: "اسمك", labelAgency: "اسم الوكالة",
    labelWA: "رقم واتساب", labelEmail: "البريد الإلكتروني", labelMessage: "رسالة",
    optional: "(اختياري)",
    placeholderName: "محمد أحمد", placeholderAgency: "وكالة النجوم",
    placeholderWA: "+966 55 123 4567", placeholderEmail: "you@agency.com",
    placeholderMessage: "أخبرنا عن وكالتك...",
    cta: "احجز العرض", submitting: "جارٍ الإرسال...",
    errRequired: "هذا الحقل مطلوب", errPhone: "أدخل رقم واتساب صحيحاً",
    errEmail: "أدخل بريداً إلكترونياً صحيحاً", errServer: "حدث خطأ. يرجى المحاولة مجدداً.",
  } : {
    eyebrow: "Book a demo",
    title: "See Packmetrix",
    titleAccent: "in action.",
    sub: "We'll show you how to publish your first branded package page in under 10 minutes.",
    labelName: "Your name", labelAgency: "Agency name",
    labelWA: "WhatsApp number", labelEmail: "Email", labelMessage: "Message",
    optional: "(optional)",
    placeholderName: "Jane Smith", placeholderAgency: "Desert Tours",
    placeholderWA: "+31 6 1234 5678", placeholderEmail: "you@agency.com",
    placeholderMessage: "Tell us about your agency...",
    cta: "Book my demo", submitting: "Sending...",
    errRequired: "This field is required", errPhone: "Enter a valid WhatsApp number",
    errEmail: "Enter a valid email address", errServer: "Something went wrong. Please try again.",
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
            {isAr ? "تم الحجز!" : "You're booked!"}
          </div>
          <p style={{ margin: 0, fontFamily: SANS, fontSize: 14, color: DA_INK2, lineHeight: 1.6 }}>
            {isAr ? "سنتواصل معك على واتساب خلال ٢٤ ساعة." : "We'll reach out on WhatsApp within 24 hours."}
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
  // TODO: native AR speaker to verify tone — "ثبّت" / launch-price phrasing
  const L = isAr ? {
    eyebrow: "ابدأ اليوم", title: "هل أنت مستعد لتنمية", titleAccent: "وكالة سفرك؟",
    sub: "انشر باقتك الأولى في أقل من ١٠ دقائق. ثبّت سعر ٣٩ €/شهر مدى الحياة.",
    cta: "ثبّت سعر ٣٩ € مدى الحياة",
    second: `تجربة ${TRIAL_DAYS} يوم · بدون بطاقة ائتمان`,
  } : {
    eyebrow: "Start today", title: "Ready to grow", titleAccent: "your agency?",
    sub: "Publish your first package in under 10 minutes. Lock €39/mo for life.",
    cta: "Lock in €39 forever",
    second: `${TRIAL_DAYS}-day trial · no credit card`,
  };
  return (
    <div style={{ padding: "80px 48px", background: DA_DARK, color: DA_BG, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at 50% 100%, rgba(176,138,62,.20), transparent 55%)" }} />
      <div style={{ position: "relative", maxWidth: 720, marginInline: "auto", textAlign: "center" }}>
        <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
        <h2 style={{ margin: "14px 0 0", fontFamily: DISPLAY, fontSize: 56, fontWeight: 400, color: DA_BG, letterSpacing: -1.5, lineHeight: 1.02 }}>
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
  // TODO: native AR speaker to verify tone — "ثبّت" / launch-price phrasing
  const L = isAr ? {
    eyebrow: "ابدأ اليوم", titleA: "هل أنت مستعد لتنمية", titleB: "وكالة سفرك؟",
    sub: "انشر باقتك الأولى في أقل من ١٠ دقائق.",
    cta: "ثبّت سعر ٣٩ € مدى الحياة", second: `تجربة ${TRIAL_DAYS} يوم · بدون بطاقة ائتمان`,
  } : {
    eyebrow: "Start today", titleA: "Ready to grow", titleB: "your agency?",
    sub: "Publish your first package in under 10 minutes.",
    cta: "Lock in €39 forever", second: `${TRIAL_DAYS}-day trial · no credit card`,
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
            <div style={{ fontFamily: DISPLAY, fontSize: 22, color: DA_INK1, marginBottom: 8 }}>{isAr ? "تم الإرسال!" : "Message sent!"}</div>
            <p style={{ fontFamily: SANS, fontSize: 14, color: DA_INK2, margin: "0 0 24px" }}>{isAr ? "سنرد عليك في أقرب وقت ممكن." : "We'll get back to you as soon as possible."}</p>
            <button onClick={onClose} style={{ padding: "10px 28px", background: DA_INK1, color: DA_BG, border: "none", borderRadius: 8, fontFamily: SANS, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>
              {isAr ? "إغلاق" : "Close"}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, color: DA_INK1, marginBottom: 6 }}>{isAr ? "تواصل معنا" : "Contact us"}</div>
            <p style={{ fontFamily: SANS, fontSize: 14, color: DA_INK2, margin: "0 0 22px" }}>{isAr ? "أرسل لنا رسالة وسنرد عليك." : "Send us a message and we'll get back to you."}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_INK3, marginBottom: 5 }}>{isAr ? "الموضوع" : "Subject"}</div>
                <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder={isAr ? "موضوع رسالتك" : "What's this about?"} required />
              </div>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_INK3, marginBottom: 5 }}>{isAr ? "الرسالة" : "Message"}</div>
                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 100 }} value={description} onChange={e => setDescription(e.target.value)} placeholder={isAr ? "اكتب رسالتك هنا..." : "Tell us more..."} required />
              </div>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_INK3, marginBottom: 5 }}>{isAr ? "بريدك الإلكتروني" : "Your email"}</div>
                <input type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required />
              </div>
            </div>
            {status === "error" && (
              <p style={{ fontFamily: SANS, fontSize: 12.5, color: "#c0392b", margin: "12px 0 0" }}>{isAr ? "حدث خطأ، يرجى المحاولة مجدداً." : "Something went wrong, please try again."}</p>
            )}
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: "11px 0", background: "transparent", border: `1px solid ${DA_RULE2}`, borderRadius: 8, fontFamily: SANS, fontSize: 13.5, color: DA_INK2, cursor: "pointer" }}>
                {isAr ? "إلغاء" : "Cancel"}
              </button>
              <button type="submit" disabled={status === "sending"} style={{ flex: 2, padding: "11px 0", background: DA_GOLD, color: "#fff", border: "none", borderRadius: 8, fontFamily: SANS, fontSize: 13.5, fontWeight: 600, cursor: "pointer", opacity: status === "sending" ? 0.7 : 1 }}>
                {status === "sending" ? (isAr ? "جارٍ الإرسال..." : "Sending...") : (isAr ? "إرسال" : "Send message")}
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
    tagline: "صفحات هبوط احترافية لوكالات السفر — تنشر، تتبّع، تحوّل.",
    cols: [
      { head: "المنتج", links: [{ label: "الميزات", href: "#product" }, { label: "القوالب", href: "/templates" }, { label: "الأسعار", href: "#pricing" }, { label: "تطبيق الوكالة", href: `${AGENCY_URL}/login` }] },
      { head: "موارد", links: [{ label: "كيف يعمل", href: "#how-it-works" }, { label: "تواصل معنا", contact: true }] },
      // TODO: native AR speaker to verify tone for "اتفاقية معالجة البيانات"
      { head: "قانوني", links: [{ label: "سياسة الخصوصية", href: "/privacy" }, { label: "الشروط", href: "/terms" }, { label: "اتفاقية معالجة البيانات", href: "/dpa" }] },
    ],
    operator: "تشغيل · WQ AppTech",
    operatorSub: "مشروع فردي مسجَّل في هولندا · KvK 91019001",
    copy: "© ٢٠٢٦ باكميتركس. كل الحقوق محفوظة.",
  } : {
    tagline: "Professional landing pages for travel agencies — publish, track, convert.",
    cols: [
      { head: "Product", links: [{ label: "Features", href: "#product" }, { label: "Templates", href: "/templates" }, { label: "Pricing", href: "#pricing" }, { label: "Agency app", href: `${AGENCY_URL}/login` }] },
      { head: "Resources", links: [{ label: "How it works", href: "#how-it-works" }, { label: "Contact us", contact: true }] },
      { head: "Legal", links: [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }, { label: "DPA", href: "/dpa" }] },
    ],
    operator: "Operated by · WQ AppTech",
    operatorSub: "Eenmanszaak registered in the Netherlands · KvK 91019001",
    copy: "© 2026 Packmetrix. All rights reserved.",
  };

  const linkStyle: React.CSSProperties = { fontFamily: SANS, fontSize: 13, color: DA_INK1, cursor: "pointer", textDecoration: "none" };

  return (
    <>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} isAr={isAr} />
      <div style={{ padding: "56px 48px 32px", background: DA_SURFACE2, borderTop: `1px solid ${DA_RULE}`, fontFamily: SANS }}>
        <div style={{ maxWidth: 1280, marginInline: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 36 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: DA_INK1, color: DA_GOLD, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 13 }}>P</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 18, color: DA_INK1, letterSpacing: -0.2 }}>Packmetrix</div>
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
              <span>{L.operatorSub}</span>
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
    tagline: "صفحات هبوط احترافية لوكالات السفر",
    cols: [
      { head: "المنتج", links: [{ label: "الميزات", href: "#product" }, { label: "القوالب", href: "/templates" }, { label: "الأسعار", href: "#pricing" }] },
      { head: "موارد", links: [{ label: "كيف يعمل", href: "#how-it-works" }, { label: "تواصل معنا", contact: true }] },
      { head: "قانوني", links: [{ label: "الخصوصية", href: "/privacy" }, { label: "الشروط", href: "/terms" }] },
    ],
    copy: "© ٢٠٢٦ باكميتركس · مسجَّل في هولندا · KvK 91019001",
  } : {
    tagline: "Professional landing pages for travel agencies",
    cols: [
      { head: "Product", links: [{ label: "Features", href: "#product" }, { label: "Templates", href: "/templates" }, { label: "Pricing", href: "#pricing" }] },
      { head: "Resources", links: [{ label: "How it works", href: "#how-it-works" }, { label: "Contact us", contact: true }] },
      { head: "Legal", links: [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }] },
    ],
    copy: "© 2026 Packmetrix · Registered in the Netherlands · KvK 91019001",
  };

  return (
    <>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} isAr={isAr} />
      <div style={{ padding: "32px 18px 22px", background: DA_SURFACE2, borderTop: `1px solid ${DA_RULE}`, fontFamily: SANS }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: DA_INK1, color: DA_GOLD, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 11 }}>P</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 16, color: DA_INK1, letterSpacing: -0.2 }}>Packmetrix</div>
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { posthog.capture("landing_page_viewed", { lang, device: isMobile ? "mobile" : "desktop" }); }, []);

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
