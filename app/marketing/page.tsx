"use client";

import { useState, useEffect } from "react";
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
  DA_GREEN, DA_GREEN_SOFT, DA_DARK,
} from "@/lib/tokens";

const DISPLAY = "var(--font-instrument-serif), Georgia, serif";
const SANS    = "var(--font-inter-tight), system-ui, sans-serif";
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
    ? { nav: ["المنتج", "القوالب", "كيف يعمل", "الأسعار"], login: "تسجيل الدخول", claim: "احجز مكانك" }
    : { nav: ["Product", "Templates", "How it works", "Pricing"], login: "Login", claim: "Claim your spot" };

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
          <a key={i} href={`#${["product","templates","how-it-works","pricing"][i]}`} style={{
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
  const L = isAr ? { claim: "احجز" } : { claim: "Claim spot" };
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(244,240,232,.9)",
      backdropFilter: "saturate(160%) blur(10px)",
      borderBottom: `1px solid ${DA_RULE}`,
      padding: "12px 16px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      fontFamily: SANS,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6,
          background: DA_INK1, color: DA_GOLD,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: DISPLAY, fontSize: 12, fontWeight: 400,
        }}>P</div>
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
        <a href={`${AGENCY_URL}/signup`} style={{
          padding: "6px 12px", background: DA_GOLD, color: "#fff",
          border: "none", borderRadius: 7,
          fontFamily: SANS, fontSize: 12, fontWeight: 600,
          textDecoration: "none", cursor: "pointer",
        }}>{L.claim}</a>
      </div>
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function LandingHero({ lang, spotsRemaining }: { lang: "en" | "ar"; spotsRemaining: number | null }) {
  const isAr = lang === "ar";
  const L = isAr ? {
    eyebrowSuffix: "من ٥٠ مكاناً مؤسساً متبقّي",
    eyebrowFallback: "٤٩ من ٥٠ مكاناً مؤسساً متبقّي",
    titleA: "صفحة هبوط مخصّصة",
    titleB: "لكلّ باقة سفر تبيعها.",
    sub: "ألصق برنامج رحلتك في باكميتركس. اختر قالباً. انشر صفحة احترافية على نطاقك الخاص — جاهزة للمشاركة على واتساب وإنستغرام وتيك توك. تتبّع المشاهدات والعملاء من صندوق واحد.",
    primary: "احجز مكانك المؤسس",
    secondary: "شاهد صفحة حقيقية",
    proofA: `تجربة ${TRIAL_DAYS} يوم`,
    proofB: "ثبّت ٣٩ €/شهر مدى الحياة",
    proofC: "بدون بطاقة ائتمان",
  } : {
    eyebrowSuffix: "of 50 founding spots left",
    eyebrowFallback: "49 of 50 founding spots left",
    titleA: "A branded landing page",
    titleB: "for every travel package you sell.",
    sub: "Paste your itinerary into Packmetrix. Pick a template. Publish a polished, branded page at your own domain — ready for WhatsApp, Instagram, and TikTok. Track views and leads in one inbox.",
    primary: "Claim your founding spot",
    secondary: "See a real landing page",
    proofA: `${TRIAL_DAYS}-day trial`,
    proofB: "Lock €39/mo for life",
    proofC: "No credit card",
  };

  const eyebrow = spotsRemaining !== null
    ? `${spotsRemaining} ${L.eyebrowSuffix}`
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

          <p style={{ marginTop: 22, maxWidth: 540, fontFamily: SANS, fontSize: 16, color: DA_INK2, lineHeight: 1.55 }}>{L.sub}</p>

          <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <a href={`${AGENCY_URL}/signup`} style={{
              padding: "14px 22px", background: DA_GOLD, color: "#fff",
              border: "none", borderRadius: 10,
              fontFamily: SANS, fontSize: 14.5, fontWeight: 600,
              display: "inline-flex", alignItems: "center", gap: 8,
              cursor: "pointer", textDecoration: "none",
              boxShadow: "0 2px 4px rgba(26,22,17,.08), 0 8px 24px -8px rgba(176,138,62,.4), inset 0 1px 0 rgba(255,255,255,.18)",
            }}>{L.primary}<ArrowSVG size={15} /></a>
            <a href="#templates" style={{
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
        <div style={{ position: "relative", height: 480 }}>
          {/* Browser chrome mockup */}
          <div style={{
            position: "absolute", top: 0, insetInlineStart: 0,
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
                flex: 1, marginInlineStart: 8, padding: "4px 10px",
                background: "rgba(255,255,255,.06)", borderRadius: 5,
                fontFamily: MONO, fontSize: 10.5, color: "rgba(255,255,255,.6)", letterSpacing: -0.2,
                display: "flex", alignItems: "center", gap: 5, direction: "ltr",
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
            position: "absolute", bottom: -10, insetInlineEnd: 0,
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
    eyebrowSuffix: "من ٥٠ مكاناً مؤسساً",
    eyebrowFallback: "٤٩ من ٥٠ مكاناً مؤسساً",
    titleA: "صفحة هبوط مخصّصة",
    titleB: "لكلّ باقة تبيعها.",
    sub: "ألصق برنامج رحلتك. اختر قالباً. انشر على نطاقك. تتبّع العملاء.",
    primary: "احجز مكانك المؤسس",
    secondary: "شاهد صفحة حقيقية",
    proof: [`تجربة ${TRIAL_DAYS} يوم`, "٣٩ €/شهر مدى الحياة", "بدون بطاقة ائتمان"],
  } : {
    eyebrowSuffix: "of 50 founding spots left",
    eyebrowFallback: "49 of 50 founding spots left",
    titleA: "A branded landing page",
    titleB: "for every travel package.",
    sub: "Paste your itinerary. Pick a template. Publish at your domain. Track every lead.",
    primary: "Claim your founding spot",
    secondary: "See a real landing page",
    proof: [`${TRIAL_DAYS}-day trial`, "€39/mo for life", "No credit card"],
  };

  const eyebrow = spotsRemaining !== null
    ? `${spotsRemaining} ${L.eyebrowSuffix}`
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

        <p style={{ margin: "16px 0 0", fontFamily: SANS, fontSize: 14, color: DA_INK2, lineHeight: 1.55 }}>{L.sub}</p>

        <a href={`${AGENCY_URL}/signup`} style={{
          display: "flex", width: "100%", marginTop: 22, padding: "13px 0",
          background: DA_GOLD, color: "#fff",
          border: "none", borderRadius: 10,
          fontFamily: SANS, fontSize: 14, fontWeight: 600,
          alignItems: "center", justifyContent: "center", gap: 7,
          cursor: "pointer", textDecoration: "none", boxSizing: "border-box",
          boxShadow: "0 2px 4px rgba(26,22,17,.08), 0 8px 20px -6px rgba(176,138,62,.4), inset 0 1px 0 rgba(255,255,255,.18)",
        }}>{L.primary}<ArrowSVG size={14} /></a>

        <a href="#templates" style={{
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
      { eyebrow: "02 · القوالب", title: "عشرة قوالب جاهزة بصرياً", body: "Aurora للباقات الفاخرة. Voyage للشباب. Sakina للعمرة. Pulse للعروض السريعة. اختر بعينيك، عدّل في دقائق." },
      { eyebrow: "03 · العملاء", title: "صندوق عملاء يلتقط واتساب", body: "كل ضغطة على زر الواتساب تظهر في صندوقك مع تاريخ تصفّح كامل وحرارة اهتمام. لا تفقد عميلاً مهتمّاً مجدداً." },
      { eyebrow: "04 · النطاق", title: "نطاقك الخاص بشهادة SSL", body: "tours.your-agency.com — لا packmetrix.com. سجلّ CNAME واحد فقط، ونتولّى الباقي تلقائياً." },
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
      { eyebrow: "02 · Templates", title: "Ten templates, pick with your eyes", body: "Aurora for luxury. Voyage for youth. Sakina for Umrah. Pulse for last-minute offers. Real visual previews, not a name list — customise everything." },
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
          <p style={{ margin: "18px auto 0", maxWidth: 600, fontFamily: SANS, fontSize: 15, color: DA_INK2, lineHeight: 1.55 }}>{L.sub}</p>
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
              <p style={{ margin: 0, fontFamily: SANS, fontSize: 13.5, color: DA_INK2, lineHeight: 1.6 }}>{c.body}</p>
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
      { eyebrow: "02 · القوالب", title: "عشرة قوالب بصرية", body: "Aurora فاخر · Sakina للعمرة · Pulse للعروض. اختر بعينيك." },
      { eyebrow: "03 · العملاء", title: "صندوق واتساب", body: "كل ضغطة على واتساب تظهر في صندوقك مع تاريخ تصفّح كامل." },
      { eyebrow: "04 · النطاق", title: "نطاقك بشهادة SSL", body: "tours.maraya.travel — لا packmetrix. CNAME واحد فقط." },
      { eyebrow: "05 · الجوّال", title: "أول أولوية: الهاتف", body: "كل قالب مصمم للهاتف أوّلاً — لأن معظم العملاء يصلون من قصة إنستغرام." },
      { eyebrow: "06 · اللغة", title: "ثنائي اللغة بالكامل", body: "RTL حقيقي. تقويم هجري. ليس ترجمة آلية." },
    ],
  } : {
    eyebrow: "Everything you need", title: "Built for travel agencies,", titleAccent: "not a generic builder.",
    cards: [
      { eyebrow: "01 · Content", title: "AI extracts your package", body: "Paste a WhatsApp message or itinerary — we lift destination, price, nights, inclusions." },
      { eyebrow: "02 · Templates", title: "Ten visual templates", body: "Aurora for luxury · Sakina for Umrah · Pulse for last-minute. Pick with your eyes." },
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
              <p style={{ margin: "6px 0 0", fontFamily: SANS, fontSize: 12.5, color: DA_INK2, lineHeight: 1.55 }}>{c.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── How it works ──────────────────────────────────────────────────────────────

function LandingHowItWorks({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = isAr ? {
    eyebrow: "كيف يعمل", title: "من النص إلى", titleAccent: "صفحة مباشرة في دقائق", sub: "أربع خطوات. لا أكواد. لا مصمم.",
    steps: [
      { title: "ألصق باقتك", body: "ألصق وصف الباقة من واتساب أو إنستغرام أو ملف نصي. أيّ صياغة، أيّ لغة." },
      { title: "يُهيكلها الذكاء الاصطناعي", body: "نستخرج الوجهة، السعر، الليالي، الإقامة، التنقلات، والمميزات في تنسيق منظَّم." },
      { title: "اختر قالباً", body: "عشرة قوالب جاهزة — لكل نوع رحلة. عاين بعينيك واختر." },
      { title: "انشر وتتبّع", body: "صفحة هبوط على نطاقك. شارك الرابط على واتساب. شاهد المشاهدات والعملاء تتدفّق." },
    ],
  } : {
    eyebrow: "How it works", title: "From a paste to a", titleAccent: "live link in minutes.", sub: "Four steps. No code. No designer.",
    steps: [
      { title: "Paste your package", body: "Paste a description from WhatsApp, Instagram, or a one-pager. Any format, any language." },
      { title: "AI structures it", body: "We extract destination, price, nights, accommodation, transfers, and highlights into a clean schema." },
      { title: "Pick a template", body: "Ten templates, each built for a kind of trip. Preview with your eyes, customise in minutes." },
      { title: "Publish & track", body: "A live page at your domain. Share the link on WhatsApp. Watch views and leads roll in." },
    ],
  };

  const stepVisuals = [
    <div style={{ height: "100%", padding: 14, background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 10, fontFamily: MONO, fontSize: 10.5, color: DA_INK2, lineHeight: 1.55, overflow: "hidden", position: "relative" }}>
      <div style={{ color: DA_GOLD, fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 6 }}>{isAr ? "ألصق هنا" : "Paste here"}</div>
      <div style={{ direction: "ltr", color: DA_INK2 }}>{isAr ? "كابادوكيا 4 ليالٍ يورو 549 رحلة المنطاد..." : "Cappadocia 4n €549 hot-air balloon, hotel Yunak Evleri, transfers in/out..."}</div>
    </div>,
    <div style={{ height: "100%", padding: 14, background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 10, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ color: DA_GOLD, fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>{isAr ? "✦ استخراج" : "✦ Extracted"}</div>
      {[[isAr ? "الوجهة" : "Destination", isAr ? "كابادوكيا" : "Cappadocia"], [isAr ? "السعر" : "Price", "€549"], [isAr ? "الليالي" : "Nights", "4"], [isAr ? "الفندق" : "Hotel", "Yunak Evleri"]].map(([k, v], i) => (
        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", fontFamily: SANS, fontSize: 11, borderBottom: i < 3 ? `1px dashed ${DA_RULE}` : "none" }}>
          <span style={{ color: DA_INK3 }}>{k}</span>
          <span style={{ color: DA_INK1, fontWeight: 500 }}>{v}</span>
        </div>
      ))}
    </div>,
    <div style={{ height: "100%", padding: 14, background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 10 }}>
      <div style={{ color: DA_GOLD, fontSize: 9, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", marginBottom: 8 }}>{isAr ? "اختر قالباً" : "Pick a template"}</div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 5 }}>
        {[{ bg: "linear-gradient(135deg,#4a8fb8,#1f5378)", label: "Aurora", active: true }, { bg: "linear-gradient(135deg,#ff5a5f,#c5374f)", label: "Voyage" }, { bg: "linear-gradient(135deg,#d4c79a,#8a7644)", label: "Sakina" }, { bg: "linear-gradient(135deg,#c46a44,#7a3a22)", label: "Tribe" }].map((tpl, i) => (
          <div key={i} style={{ height: 64, borderRadius: 4, background: tpl.bg, position: "relative", overflow: "hidden", boxShadow: tpl.active ? `0 0 0 2px ${DA_GOLD}, 0 0 0 4px ${DA_BG}` : "none" }}>
            <div style={{ position: "absolute", bottom: 3, insetInlineStart: 4, fontSize: 7, fontWeight: 600, color: "rgba(255,255,255,.85)" }}>{tpl.label}</div>
          </div>
        ))}
      </div>
    </div>,
    <div style={{ height: "100%", padding: 14, background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 10, display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ padding: "5px 8px", background: DA_BG, border: `1px solid ${DA_RULE}`, borderRadius: 6, fontFamily: MONO, fontSize: 10, color: DA_INK1, letterSpacing: -0.2, display: "flex", alignItems: "center", gap: 5, direction: "ltr" }}>
        packages.maraya.travel/cappad…
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
        <span style={{ padding: "3px 7px", background: "#25D366", color: "#fff", borderRadius: 999, fontSize: 9, fontWeight: 600 }}>{isAr ? "واتساب" : "WhatsApp"}</span>
        <span style={{ padding: "3px 7px", background: "linear-gradient(135deg, #f58529, #dd2a7b)", color: "#fff", borderRadius: 999, fontSize: 9, fontWeight: 600 }}>{isAr ? "إنستغرام" : "Instagram"}</span>
      </div>
      <div style={{ marginTop: 6, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 5 }}>
        {[{ v: "412", l: isAr ? "مشاهدة" : "views" }, { v: "+7", l: isAr ? "عملاء" : "leads" }].map((s, i) => (
          <div key={i} style={{ padding: "5px 8px", background: DA_BG, borderRadius: 6, border: `1px solid ${DA_RULE}` }}>
            <div style={{ fontFamily: DISPLAY, fontSize: 16, color: DA_INK1, letterSpacing: -0.3, lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontSize: 8.5, color: DA_INK3, marginTop: 2, letterSpacing: 0.3, textTransform: "uppercase" }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>,
  ];

  return (
    <div id="how-it-works" style={{ padding: "80px 48px", background: DA_BG }}>
      <div style={{ maxWidth: 1280, marginInline: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
          <h2 style={{ margin: "12px 0 0", fontFamily: DISPLAY, fontSize: 48, fontWeight: 400, color: DA_INK1, letterSpacing: -1.2, lineHeight: 1.05 }}>
            {L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span>
          </h2>
          <p style={{ margin: "18px auto 0", maxWidth: 480, fontFamily: SANS, fontSize: 15, color: DA_INK2, lineHeight: 1.55 }}>{L.sub}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 32 }}>
          {L.steps.map((s, i) => (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ height: 130, position: "relative" }}>{stepVisuals[i]}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 6 }}>
                <div style={{ width: 32, height: 32, borderRadius: "50%", background: DA_INK1, color: DA_GOLD, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 14, fontWeight: 400 }}>{`0${i + 1}`}</div>
                <h3 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 22, fontWeight: 400, color: DA_INK1, letterSpacing: -0.4, lineHeight: 1.15 }}>{s.title}</h3>
              </div>
              <p style={{ margin: 0, fontFamily: SANS, fontSize: 13.5, color: DA_INK2, lineHeight: 1.55 }}>{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileLandingHowItWorks({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = isAr ? {
    eyebrow: "كيف يعمل", title: "من النص إلى صفحة مباشرة", titleAccent: "في دقائق.",
    steps: [
      { title: "ألصق باقتك", body: "ألصق وصفاً من واتساب أو إنستغرام." },
      { title: "يُهيكلها الذكاء الاصطناعي", body: "نستخرج كل البيانات في تنسيق منظَّم." },
      { title: "اختر قالباً", body: "عشرة قوالب بصرية لكل نوع رحلة." },
      { title: "انشر وتتبّع", body: "صفحة هبوط على نطاقك — شارك وتابع." },
    ],
  } : {
    eyebrow: "How it works", title: "From a paste to a live link", titleAccent: "in minutes.",
    steps: [
      { title: "Paste your package", body: "Paste any description from WhatsApp or Instagram." },
      { title: "AI structures it", body: "We extract every field into a clean schema." },
      { title: "Pick a template", body: "Ten visual templates, each built for a kind of trip." },
      { title: "Publish & track", body: "A live page at your domain — share and follow leads." },
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
      <div style={{ display: "flex", flexDirection: "column", gap: 0, position: "relative" }}>
        {L.steps.map((s, i) => (
          <div key={i} style={{ display: "flex", gap: 14, paddingBottom: i < L.steps.length - 1 ? 22 : 0, position: "relative" }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: DA_INK1, color: DA_GOLD, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 13, fontWeight: 400 }}>{`0${i + 1}`}</div>
              {i < L.steps.length - 1 && <div style={{ width: 1, flex: 1, background: DA_RULE, marginTop: 4 }} />}
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
              <h3 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 18, fontWeight: 400, color: DA_INK1, letterSpacing: -0.3, lineHeight: 1.2 }}>{s.title}</h3>
              <p style={{ margin: "5px 0 0", fontFamily: SANS, fontSize: 12.5, color: DA_INK2, lineHeight: 1.55 }}>{s.body}</p>
            </div>
          </div>
        ))}
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
            {!mobile && <p style={{ margin: "16px 0 0", fontFamily: SANS, fontSize: 15, color: DA_INK2, lineHeight: 1.55 }}>{L.sub}</p>}
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

// ── Pricing ───────────────────────────────────────────────────────────────────

function LandingPricing({ lang, spotsRemaining }: { lang: "en" | "ar"; spotsRemaining: number | null }) {
  const isAr = lang === "ar";
  const [annual, setAnnual] = useState(false);

  const totalSpots = 50;
  const filled = spotsRemaining !== null ? totalSpots - spotsRemaining : 1;
  const pct = Math.max(2, Math.min(100, (filled / totalSpots) * 100));

  const L = isAr ? {
    eyebrow: "الأسعار", title: "خطّة واحدة.", titleAccent: "سعرٌ مؤسسٌ مدى الحياة.",
    sub: "أوّل ٥٠ وكالة تنضم تُثبَّت أسعارها عند ٣٩ €/شهر — لا تزيد أبداً. بعد امتلاء المجموعة، يصبح السعر العام ٧٩ €/شهر للوكالات الجديدة.",
    chip: "عضو مؤسس", planName: "Founding", perMonth: "/شهر",
    locked: "مثبَّت مدى الحياة · مقابل ٧٩ € لاحقاً",
    spotsLine: spotsRemaining !== null ? `${spotsRemaining} من ٥٠ مكاناً متبقّي` : "٤٩ من ٥٠ مكاناً متبقّي",
    monthly: "شهري", annual: "سنوي", annualSave: "وفّر ١٧٪",
    included: "كل المزايا مشمولة",
    items: ["صفحات باقات غير محدودة", "كل القوالب العشرة", "نطاق مخصص بشهادة SSL", "صندوق عملاء واتساب وماسنجر", "تصدير العملاء (CSV)", "محرر محتوى بالذكاء الاصطناعي", "تحليلات المشاهدات والتحويلات"],
    cta: "احجز مكانك المؤسس",
    trust: `تجربة ${TRIAL_DAYS} يوم · بدون بطاقة ائتمان · إلغاء في أيّ وقت`,
    after: "بعد امتلاء المجموعة المؤسسة: ٧٩ €/شهر للوكالات الجديدة. سعر المؤسسين يبقى ثابتاً.",
  } : {
    eyebrow: "Pricing", title: "One plan.", titleAccent: "Founding rate, locked for life.",
    sub: "The first 50 agencies lock in €39/mo — never increases. After the cohort fills, the public price for new agencies becomes €79/mo.",
    chip: "Founding member", planName: "Founding", perMonth: "/mo",
    locked: "Locked for life · vs €79 later",
    spotsLine: spotsRemaining !== null ? `${spotsRemaining} of 50 spots remaining` : "49 of 50 spots remaining",
    monthly: "Monthly", annual: "Annual", annualSave: "Save 17%",
    included: "Everything included",
    items: ["Unlimited package pages", "All 10 templates", "Custom domain + SSL", "WhatsApp + Messenger lead inbox", "Lead export (CSV)", "AI content writing", "Views & conversion analytics"],
    cta: "Claim your founding spot",
    trust: `${TRIAL_DAYS}-day trial · no credit card · cancel anytime`,
    after: "After the founding cohort closes: €79/mo for new agencies. Founding members keep their locked rate forever.",
  };

  return (
    <div id="pricing" style={{ padding: "80px 48px", background: DA_BG }}>
      <div style={{ maxWidth: 920, marginInline: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
          <h2 style={{ margin: "12px 0 0", fontFamily: DISPLAY, fontSize: 48, fontWeight: 400, color: DA_INK1, letterSpacing: -1.2, lineHeight: 1.05 }}>
            {L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span>
          </h2>
          <p style={{ margin: "18px auto 0", maxWidth: 580, fontFamily: SANS, fontSize: 15, color: DA_INK2, lineHeight: 1.55 }}>{L.sub}</p>
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

            <a href={`${AGENCY_URL}/signup`} style={{
              display: "flex", width: "100%", padding: "14px 0",
              background: DA_GOLD, color: "#fff", border: "none", borderRadius: 10,
              fontFamily: SANS, fontSize: 14.5, fontWeight: 600,
              alignItems: "center", justifyContent: "center", gap: 8,
              cursor: "pointer", textDecoration: "none", boxSizing: "border-box",
              boxShadow: "0 1px 2px rgba(0,0,0,.06), 0 12px 28px -10px rgba(176,138,62,.45), inset 0 1px 0 rgba(255,255,255,.18)",
            }}>{L.cta}<ArrowSVG size={15} /></a>
            <div style={{ marginTop: 12, textAlign: "center", fontFamily: SANS, fontSize: 12, color: DA_INK3 }}>{L.trust}</div>
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
    eyebrow: "الأسعار", title: "خطّة واحدة.", titleAccent: "سعرٌ مؤسس مدى الحياة.",
    spotsLine: spotsRemaining !== null ? `${spotsRemaining} من ٥٠ مكاناً متبقّي` : "٤٩ من ٥٠ مكاناً متبقّي",
    chip: "عضو مؤسس", planName: "Founding", perMonth: "/شهر",
    locked: "مثبَّت مدى الحياة · مقابل ٧٩ € لاحقاً",
    items: ["صفحات باقات غير محدودة", "كل القوالب العشرة", "نطاق مخصص بشهادة SSL", "صندوق عملاء واتساب وماسنجر", "تصدير العملاء (CSV)", "محرر محتوى بالذكاء الاصطناعي", "تحليلات المشاهدات والتحويلات"],
    cta: "احجز مكانك المؤسس",
    trust: `تجربة ${TRIAL_DAYS} يوم · بدون بطاقة ائتمان · إلغاء في أيّ وقت`,
  } : {
    eyebrow: "Pricing", title: "One plan.", titleAccent: "Founding rate, locked for life.",
    spotsLine: spotsRemaining !== null ? `${spotsRemaining} of 50 spots remaining` : "49 of 50 spots remaining",
    chip: "Founding member", planName: "Founding", perMonth: "/mo",
    locked: "Locked for life · vs €79 later",
    items: ["Unlimited package pages", "All 10 templates", "Custom domain + SSL", "WhatsApp + Messenger inbox", "Lead export (CSV)", "AI content writing", "Views & conversion analytics"],
    cta: "Claim your founding spot",
    trust: `${TRIAL_DAYS}-day trial · no credit card · cancel anytime`,
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
          <a href={`${AGENCY_URL}/signup`} style={{
            display: "flex", width: "100%", marginTop: 22, padding: "13px 0",
            background: DA_GOLD, color: "#fff", border: "none", borderRadius: 10,
            fontFamily: SANS, fontSize: 14, fontWeight: 600,
            alignItems: "center", justifyContent: "center", gap: 7,
            cursor: "pointer", textDecoration: "none", boxSizing: "border-box",
            boxShadow: "0 1px 2px rgba(0,0,0,.06), 0 8px 20px -6px rgba(176,138,62,.45), inset 0 1px 0 rgba(255,255,255,.18)",
          }}>{L.cta}<ArrowSVG size={14} /></a>
          <div style={{ marginTop: 10, textAlign: "center", fontFamily: SANS, fontSize: 11, color: DA_INK3 }}>{L.trust}</div>
        </div>
      </div>
    </div>
  );
}

// ── Final CTA ─────────────────────────────────────────────────────────────────

function LandingFinalCta({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = isAr ? {
    eyebrow: "ابدأ اليوم", title: "هل أنت مستعد لتنمية", titleAccent: "وكالة سفرك؟",
    sub: "انشر باقتك الأولى في أقل من ١٠ دقائق. ثبّت سعر ٣٩ €/شهر مدى الحياة.",
    cta: "احجز مكانك المؤسس",
    second: `تجربة ${TRIAL_DAYS} يوم · بدون بطاقة ائتمان`,
  } : {
    eyebrow: "Start today", title: "Ready to grow", titleAccent: "your agency?",
    sub: "Publish your first package in under 10 minutes. Lock €39/mo for life.",
    cta: "Claim your founding spot",
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
        <p style={{ margin: "22px auto 0", maxWidth: 500, fontFamily: SANS, fontSize: 15.5, color: "rgba(244,240,232,.72)", lineHeight: 1.55 }}>{L.sub}</p>
        <a href={`${AGENCY_URL}/signup`} style={{
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
    eyebrow: "ابدأ اليوم", titleA: "هل أنت مستعد لتنمية", titleB: "وكالة سفرك؟",
    sub: "انشر باقتك الأولى في أقل من ١٠ دقائق.",
    cta: "احجز مكانك المؤسس", second: `تجربة ${TRIAL_DAYS} يوم · بدون بطاقة ائتمان`,
  } : {
    eyebrow: "Start today", titleA: "Ready to grow", titleB: "your agency?",
    sub: "Publish your first package in under 10 minutes.",
    cta: "Claim your founding spot", second: `${TRIAL_DAYS}-day trial · no credit card`,
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
        <p style={{ margin: "16px 0 0", fontFamily: SANS, fontSize: 14, color: "rgba(244,240,232,.72)", lineHeight: 1.55 }}>{L.sub}</p>
        <a href={`${AGENCY_URL}/signup`} style={{
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

// ── Footer ────────────────────────────────────────────────────────────────────

function LandingFooter({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = isAr ? {
    tagline: "صفحات هبوط احترافية لوكالات السفر — تنشر، تتبّع، تحوّل.",
    cols: [
      { head: "المنتج", links: [{ label: "الميزات", href: "#product" }, { label: "القوالب", href: "/templates" }, { label: "الأسعار", href: "#pricing" }, { label: "تطبيق الوكالة", href: `${AGENCY_URL}/login` }] },
      { head: "موارد", links: [{ label: "كيف يعمل", href: "#how-it-works" }, { label: "مركز المساعدة", href: "#" }, { label: "تواصل معنا", href: "mailto:hello@packmetrix.com" }] },
      { head: "قانوني", links: [{ label: "سياسة الخصوصية", href: "/privacy" }, { label: "الشروط", href: "/terms" }, { label: "DPA", href: "/dpa" }] },
    ],
    operator: "تشغيل · WQ AppTech",
    operatorSub: "مشروع فردي مسجَّل في هولندا · KvK 91019001",
    copy: "© ٢٠٢٦ باكميتركس. كل الحقوق محفوظة.",
  } : {
    tagline: "Professional landing pages for travel agencies — publish, track, convert.",
    cols: [
      { head: "Product", links: [{ label: "Features", href: "#product" }, { label: "Templates", href: "/templates" }, { label: "Pricing", href: "#pricing" }, { label: "Agency app", href: `${AGENCY_URL}/login` }] },
      { head: "Resources", links: [{ label: "How it works", href: "#how-it-works" }, { label: "Help centre", href: "#" }, { label: "Contact", href: "mailto:hello@packmetrix.com" }] },
      { head: "Legal", links: [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }, { label: "DPA", href: "/dpa" }] },
    ],
    operator: "Operated by · WQ AppTech",
    operatorSub: "Eenmanszaak registered in the Netherlands · KvK 91019001",
    copy: "© 2026 Packmetrix. All rights reserved.",
  };

  return (
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
                  <a key={j} href={link.href} style={{ fontFamily: SANS, fontSize: 13, color: DA_INK1, cursor: "pointer", textDecoration: "none" }}>{link.label}</a>
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
  );
}

function MobileLandingFooter({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = isAr ? {
    tagline: "صفحات هبوط احترافية لوكالات السفر",
    cols: [
      { head: "المنتج", links: [{ label: "الميزات", href: "#product" }, { label: "القوالب", href: "/templates" }, { label: "الأسعار", href: "#pricing" }] },
      { head: "موارد", links: [{ label: "كيف يعمل", href: "#how-it-works" }, { label: "المساعدة", href: "#" }, { label: "تواصل", href: "mailto:hello@packmetrix.com" }] },
      { head: "قانوني", links: [{ label: "الخصوصية", href: "/privacy" }, { label: "الشروط", href: "/terms" }] },
    ],
    copy: "© ٢٠٢٦ باكميتركس · مسجَّل في هولندا · KvK 91019001",
  } : {
    tagline: "Professional landing pages for travel agencies",
    cols: [
      { head: "Product", links: [{ label: "Features", href: "#product" }, { label: "Templates", href: "/templates" }, { label: "Pricing", href: "#pricing" }] },
      { head: "Resources", links: [{ label: "How it works", href: "#how-it-works" }, { label: "Help", href: "#" }, { label: "Contact", href: "mailto:hello@packmetrix.com" }] },
      { head: "Legal", links: [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }] },
    ],
    copy: "© 2026 Packmetrix · Registered in the Netherlands · KvK 91019001",
  };
  return (
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
                <a key={j} href={link.href} style={{ fontSize: 12, color: DA_INK1, textDecoration: "none" }}>{link.label}</a>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 22, paddingTop: 14, borderTop: `1px solid ${DA_RULE}`, fontSize: 10.5, color: DA_INK3, textAlign: "center" }}>{L.copy}</div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const isMobile = useIsMobile();
  const lang = useLang();
  const isAr = lang === "ar";

  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/founding-spots")
      .then(r => r.json())
      .then(d => setSpotsRemaining(d.remaining ?? 0))
      .catch(() => setSpotsRemaining(0));
  }, []);

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ background: DA_BG, fontFamily: SANS, minHeight: "100vh" }}>
      {isMobile ? (
        <>
          <MobileLandingNav lang={lang} />
          <MobileLandingHero lang={lang} spotsRemaining={spotsRemaining} />
          <MobileLandingFeatures lang={lang} />
          <MobileLandingHowItWorks lang={lang} />
          <TemplateShowcase lang={lang} mobile />
          <MobileLandingPricing lang={lang} spotsRemaining={spotsRemaining} />
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
          <LandingPricing lang={lang} spotsRemaining={spotsRemaining} />
          <LandingFinalCta lang={lang} />
          <LandingFooter lang={lang} />
        </>
      )}
    </div>
  );
}
