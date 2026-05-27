"use client";

import { useState } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useLang, switchLang } from "@/hooks/useLang";
import { TEMPLATES } from "@/components/templates";
import { MINI_RENDERS } from "@/components/builder/TemplatePicker";
import {
  DA_BG, DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2, DA_GOLD, DA_GOLD_SOFT,
} from "@/lib/tokens";

const DISPLAY = "var(--font-instrument-serif), Georgia, serif";
const SANS    = "var(--font-inter-tight), system-ui, sans-serif";

const AGENCY_URL =
  process.env.NEXT_PUBLIC_AGENCY_URL ??
  (process.env.NODE_ENV === "development" ? "" : "https://agency.packmetrix.com");

function ArrowSVG({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── Desktop nav ───────────────────────────────────────────────────────────────

function TemplatesNav({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = isAr
    ? { back: "الرئيسية", login: "تسجيل الدخول", claim: "احجز مكانك" }
    : { back: "Home", login: "Login", claim: "Claim your spot" };

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
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 11, textDecoration: "none" }}>
        <div style={{
          width: 30, height: 30, borderRadius: 7,
          background: DA_INK1,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: DISPLAY, fontSize: 14, color: DA_GOLD,
        }}>P</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 19, color: DA_INK1, letterSpacing: -0.2 }}>Packmetrix</div>
      </a>

      <a href="/" style={{ fontFamily: SANS, fontSize: 13, color: DA_INK2, textDecoration: "none" }}>
        ← {L.back}
      </a>

      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          display: "flex", padding: 3,
          background: DA_SURFACE, border: `1px solid ${DA_RULE2}`, borderRadius: 999,
          fontSize: 11.5, fontWeight: 500,
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
        <a href={`${AGENCY_URL}/login`} style={{ fontFamily: SANS, fontSize: 13, color: DA_INK1, fontWeight: 500, textDecoration: "none", marginInline: 4 }}>{L.login}</a>
        <a href={`${AGENCY_URL}/signup`} style={{
          padding: "8px 16px", background: DA_GOLD, color: "#fff",
          border: "none", borderRadius: 8,
          fontFamily: SANS, fontSize: 13, fontWeight: 600,
          display: "inline-flex", alignItems: "center", gap: 6,
          textDecoration: "none",
          boxShadow: "0 1px 2px rgba(0,0,0,.04), inset 0 1px 0 rgba(255,255,255,.15)",
        }}>{L.claim} <ArrowSVG size={13} /></a>
      </div>
    </div>
  );
}

// ── Mobile nav ────────────────────────────────────────────────────────────────

function MobileTemplatesNav({ lang }: { lang: "en" | "ar" }) {
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
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 8, textDecoration: "none" }}>
        <div style={{
          width: 26, height: 26, borderRadius: 6,
          background: DA_INK1,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: DISPLAY, fontSize: 12, color: DA_GOLD,
        }}>P</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 17, color: DA_INK1, letterSpacing: -0.2 }}>Packmetrix</div>
      </a>
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{
          display: "flex", padding: 2, background: DA_SURFACE,
          border: `1px solid ${DA_RULE2}`, borderRadius: 999,
          fontSize: 10.5, fontWeight: 500,
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
          textDecoration: "none",
        }}>{L.claim}</a>
      </div>
    </div>
  );
}

// ── Template card ─────────────────────────────────────────────────────────────

function TemplateGalleryCard({
  tpl,
  lang,
  mobile,
}: {
  tpl: typeof TEMPLATES[0];
  lang: "en" | "ar";
  mobile: boolean;
}) {
  const isAr = lang === "ar";
  const MiniRender = MINI_RENDERS[tpl.id];
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: DA_SURFACE,
        border: `1px solid ${hovered ? DA_RULE2 : DA_RULE}`,
        borderRadius: mobile ? 12 : 16,
        overflow: "hidden",
        transition: "border-color .15s, box-shadow .15s",
        boxShadow: hovered ? "0 8px 24px -8px rgba(0,0,0,.12)" : "none",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Preview */}
      <div style={{
        aspectRatio: "3 / 4",
        background: tpl.previewBg ?? DA_BG,
        position: "relative",
        overflow: "hidden",
        borderBottom: `1px solid ${DA_RULE}`,
        flexShrink: 0,
      }}>
        <div style={{
          position: "absolute", inset: mobile ? 10 : 14,
          borderRadius: 6,
          overflow: "hidden",
          boxShadow: "0 4px 16px -4px rgba(0,0,0,.15), 0 0 0 1px rgba(0,0,0,.04)",
        }}>
          {MiniRender ? <MiniRender isAr={isAr} /> : null}
        </div>
      </div>

      {/* Info + CTA */}
      <div style={{
        padding: mobile ? "12px 14px" : "14px 18px",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        flex: 1,
      }}>
        <div>
          <div style={{
            fontFamily: DISPLAY,
            fontSize: mobile ? 15 : 17,
            color: DA_INK1,
            letterSpacing: -0.3,
            marginBottom: 3,
          }}>
            {isAr ? tpl.nameAr : tpl.name}
          </div>
          <div style={{
            fontFamily: SANS,
            fontSize: mobile ? 11 : 12,
            color: DA_INK3,
            lineHeight: 1.4,
          }}>
            {isAr ? tpl.targetAr : tpl.target}
          </div>
        </div>

        <a
          href={`${AGENCY_URL}/signup`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 5,
            padding: mobile ? "8px 0" : "9px 0",
            borderRadius: 8,
            background: hovered ? DA_GOLD : DA_GOLD_SOFT,
            color: hovered ? "#fff" : DA_GOLD,
            fontFamily: SANS,
            fontSize: mobile ? 11.5 : 12.5,
            fontWeight: 600,
            textDecoration: "none",
            transition: "background .15s, color .15s",
          }}
        >
          {isAr ? "استخدم هذا القالب" : "Use this template"}
          <ArrowSVG size={11} />
        </a>
      </div>
    </div>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function TemplatesFooter({ lang, mobile }: { lang: "en" | "ar"; mobile: boolean }) {
  const isAr = lang === "ar";
  if (mobile) {
    return (
      <div style={{ padding: "32px 18px 22px", background: DA_SURFACE2, borderTop: `1px solid ${DA_RULE}`, fontFamily: SANS }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: DA_INK1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 11, color: DA_GOLD }}>P</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 16, color: DA_INK1, letterSpacing: -0.2 }}>Packmetrix</div>
        </div>
        <p style={{ margin: "0 0 18px", fontSize: 12, color: DA_INK2, lineHeight: 1.5 }}>
          {isAr ? "صفحات هبوط احترافية لوكالات السفر" : "Professional landing pages for travel agencies"}
        </p>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          {[
            { label: isAr ? "الرئيسية" : "Home", href: "/" },
            { label: isAr ? "الأسعار" : "Pricing", href: "/#pricing" },
            { label: isAr ? "الخصوصية" : "Privacy", href: "/privacy" },
            { label: isAr ? "الشروط" : "Terms", href: "/terms" },
          ].map((l) => (
            <a key={l.href} href={l.href} style={{ fontSize: 12, color: DA_INK1, textDecoration: "none" }}>{l.label}</a>
          ))}
        </div>
        <div style={{ marginTop: 18, fontSize: 10.5, color: DA_INK3 }}>
          {isAr ? "© ٢٠٢٦ باكميتركس · مسجَّل في هولندا · KvK 91019001" : "© 2026 Packmetrix · Registered in the Netherlands · KvK 91019001"}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "48px 48px 28px", background: DA_SURFACE2, borderTop: `1px solid ${DA_RULE}`, fontFamily: SANS }}>
      <div style={{ maxWidth: 1280, marginInline: "auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 24 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 7, background: DA_INK1, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 13, color: DA_GOLD }}>P</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 18, color: DA_INK1, letterSpacing: -0.2 }}>Packmetrix</div>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[
            { label: isAr ? "الرئيسية" : "Home", href: "/" },
            { label: isAr ? "الأسعار" : "Pricing", href: "/#pricing" },
            { label: isAr ? "الخصوصية" : "Privacy", href: "/privacy" },
            { label: isAr ? "الشروط" : "Terms", href: "/terms" },
            { label: isAr ? "DPA" : "DPA", href: "/dpa" },
          ].map((l) => (
            <a key={l.href} href={l.href} style={{ fontFamily: SANS, fontSize: 13, color: DA_INK2, textDecoration: "none" }}>{l.label}</a>
          ))}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12, color: DA_INK3 }}>
          {isAr ? "© ٢٠٢٦ باكميتركس · KvK 91019001" : "© 2026 Packmetrix · KvK 91019001"}
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function TemplatesPage() {
  const isMobile = useIsMobile();
  const lang = useLang();
  const isAr = lang === "ar";

  const L = isAr ? {
    eyebrow: "القوالب",
    title: "عشرة قوالب.",
    titleAccent: "شخصية بصرية لكلّ رحلة.",
    sub: "كل قالب مصمَّم لنوع سفر مختلف — من الرفاهية إلى المغامرة. اختر ما يناسب وكالتك وخصّصه بالكامل.",
    cta: "ابدأ تجربتك المجانية",
    ctaSub: "لا بطاقة ائتمان مطلوبة · تجربة مجانية 14 يوماً",
  } : {
    eyebrow: "Templates",
    title: "Ten templates.",
    titleAccent: "A personality for every trip type.",
    sub: "Each template is designed for a different kind of travel — from luxury to adventure. Pick the one that fits your agency, customise everything.",
    cta: "Start your free trial",
    ctaSub: "No credit card required · 14-day free trial",
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: DA_BG, fontFamily: SANS }}>
      {isMobile ? <MobileTemplatesNav lang={lang} /> : <TemplatesNav lang={lang} />}

      {/* Header */}
      <div style={{ padding: isMobile ? "36px 18px 28px" : "64px 48px 48px", background: DA_SURFACE2, borderBottom: `1px solid ${DA_RULE}` }}>
        <div style={{ maxWidth: isMobile ? undefined : 1280, marginInline: "auto" }}>
          <div style={{
            fontFamily: SANS, fontSize: isMobile ? 10 : 10.5, fontWeight: 600,
            letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD,
            marginBottom: 12,
          }}>
            {L.eyebrow}
          </div>
          <h1 style={{
            margin: "0 0 14px",
            fontFamily: DISPLAY,
            fontSize: isMobile ? 28 : 48,
            fontWeight: 400,
            color: DA_INK1,
            letterSpacing: isMobile ? -0.7 : -1.2,
            lineHeight: 1.1,
          }}>
            {L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span>
          </h1>
          <p style={{
            margin: 0,
            fontFamily: SANS,
            fontSize: isMobile ? 13.5 : 16,
            color: DA_INK2,
            lineHeight: 1.6,
            maxWidth: 560,
          }}>
            {L.sub}
          </p>
        </div>
      </div>

      {/* Template grid */}
      <div style={{ padding: isMobile ? "28px 16px 40px" : "48px 48px 80px" }}>
        <div style={{
          maxWidth: isMobile ? undefined : 1280,
          marginInline: "auto",
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr 1fr"
            : "repeat(5, 1fr)",
          gap: isMobile ? 12 : 20,
        }}>
          {TEMPLATES.map((tpl) => (
            <TemplateGalleryCard
              key={tpl.id}
              tpl={tpl}
              lang={lang}
              mobile={isMobile}
            />
          ))}
        </div>
      </div>

      {/* CTA band */}
      <div style={{
        padding: isMobile ? "36px 18px" : "64px 48px",
        background: DA_INK1,
        textAlign: "center",
      }}>
        <div style={{ maxWidth: 560, marginInline: "auto" }}>
          <h2 style={{
            margin: "0 0 12px",
            fontFamily: DISPLAY,
            fontSize: isMobile ? 26 : 36,
            fontWeight: 400,
            color: "#f4f0e8",
            letterSpacing: -0.8,
            lineHeight: 1.15,
          }}>
            {isAr ? "جاهز لنشر أول صفحتك؟" : "Ready to publish your first page?"}
          </h2>
          <p style={{ margin: "0 0 28px", fontFamily: SANS, fontSize: isMobile ? 13.5 : 15, color: "rgba(244,240,232,.65)", lineHeight: 1.6 }}>
            {isAr
              ? "أنشئ صفحتك الأولى في أقل من 3 دقائق — من النص إلى الصفحة المنشورة."
              : "Build your first page in under 3 minutes — from raw text to a published page."
            }
          </p>
          <a
            href={`${AGENCY_URL}/signup`}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: isMobile ? "13px 28px" : "15px 36px",
              background: DA_GOLD, color: "#fff",
              borderRadius: 10, border: "none",
              fontFamily: SANS, fontSize: isMobile ? 14 : 15, fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 4px 16px -4px rgba(176,138,62,.5)",
            }}
          >
            {L.cta} <ArrowSVG size={14} />
          </a>
          <div style={{ marginTop: 12, fontFamily: SANS, fontSize: 12, color: "rgba(244,240,232,.45)" }}>
            {L.ctaSub}
          </div>
        </div>
      </div>

      <TemplatesFooter lang={lang} mobile={isMobile} />
    </div>
  );
}
