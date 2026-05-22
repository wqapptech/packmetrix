"use client";

import { useState, useEffect } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useLang, switchLang } from "@/hooks/useLang";
import { T } from "@/lib/translations";

const SAND = "#e8c97b";
const SAND_DIM = "#c4a84f";
const NAVY = "#0d1b2e";
const NAVY_MID = "#162540";
const SUCCESS = "#2dd4a0";
const BORDER = "rgba(255,255,255,0.08)";
const MUTED = "rgba(255,255,255,0.5)";
const AGENCY_URL =
  process.env.NEXT_PUBLIC_AGENCY_URL ??
  (process.env.NODE_ENV === "development" ? "" : "https://agency.packmetrix.com");

/* ─── Types ─────────────────────────────────────────────── */

/* ─── Lang switcher button ───────────────────────────────── */
function LangToggle() {
  const lang = useLang();
  return (
    <button
      onClick={() => switchLang(lang === "en" ? "ar" : "en")}
      style={{
        padding: "6px 12px",
        borderRadius: 8,
        border: `1px solid ${BORDER}`,
        background: "rgba(255,255,255,0.05)",
        color: MUTED,
        fontSize: 12.5,
        fontWeight: 700,
        cursor: "pointer",
        fontFamily: "inherit",
        letterSpacing: ".3px",
        transition: "all 0.15s",
      }}
      onMouseEnter={e => {
        e.currentTarget.style.background = "rgba(255,255,255,0.1)";
        e.currentTarget.style.color = "#fff";
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = "rgba(255,255,255,0.05)";
        e.currentTarget.style.color = MUTED;
      }}
    >
      {lang === "en" ? "عربي" : "EN"}
    </button>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */

function NavBar() {
  const isMobile = useIsMobile();
  const lang = useLang();
  const t = T[lang];
  const isRtl = lang === "ar";

  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: `${NAVY}f0`,
      backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${BORDER}`,
      padding: isMobile ? "0 16px" : "0 32px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: 64,
      direction: isRtl ? "rtl" : "ltr",
    }}>
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <img src="/logo.svg" alt="PackMetrix" style={{ width: 28, height: 28 }} />
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.3px", color: "#fdfcf9" }}>
          Pack<em style={{ color: SAND, fontStyle: "normal", fontWeight: 600 }}>metrix</em>
        </span>
      </a>

      <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
        {!isMobile && (
          <a
            href="#pricing"
            style={{ color: MUTED, fontSize: 13.5, fontWeight: 500, textDecoration: "none", padding: "6px 12px" }}
          >
            {t.mktNavPricing}
          </a>
        )}
        <LangToggle />
        <a
          href={`${AGENCY_URL}/login`}
          style={{ color: MUTED, fontSize: 13.5, fontWeight: 500, textDecoration: "none", padding: "6px 8px" }}
        >
          {t.mktNavLogin}
        </a>
        <a
          href={`${AGENCY_URL}/signup`}
          style={{
            background: `linear-gradient(135deg, ${SAND}, ${SAND_DIM})`,
            color: NAVY, fontWeight: 700, fontSize: isMobile ? 12.5 : 13.5,
            padding: isMobile ? "8px 14px" : "8px 18px", borderRadius: 9, textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 6,
            whiteSpace: "nowrap",
          }}
        >
          {isMobile ? t.mktNavGetStarted : t.mktNavSeeInAction}
        </a>
      </div>
    </nav>
  );
}

function Hero() {
  const lang = useLang();
  const t = T[lang];
  const isRtl = lang === "ar";

  return (
    <section style={{
      padding: "96px 32px 80px",
      background: `linear-gradient(160deg, rgba(30,52,90,0.6) 0%, ${NAVY} 60%)`,
      borderBottom: `1px solid ${BORDER}`,
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
      direction: isRtl ? "rtl" : "ltr",
    }}>
      <svg style={{ position: "absolute", inset: 0, opacity: 0.04, pointerEvents: "none" }} width="100%" height="100%">
        <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <circle cx="24" cy="24" r="1.2" fill={SAND} />
        </pattern>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>

      <div style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          background: `${SAND}18`, border: `1px solid ${SAND}40`,
          borderRadius: 99, padding: "5px 14px",
          fontSize: 12, fontWeight: 600, color: SAND, marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: SUCCESS, display: "inline-block" }} />
          {t.mktHeroBadge}
        </div>

        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: "clamp(36px, 6vw, 64px)",
          fontWeight: 400,
          lineHeight: 1.08,
          letterSpacing: isRtl ? "-0.5px" : "-1.5px",
          color: "#fdfcf9",
          marginBottom: 24,
        }}>
          {t.mktHeroH1Pre}{" "}
          <em style={{ color: SAND, fontStyle: "italic" }}>{t.mktHeroH1Em}</em>
          {!isRtl && <br />}
          {" "}{t.mktHeroH1Post}
        </h1>

        <p style={{
          fontSize: "clamp(15px, 2vw, 18px)",
          color: MUTED,
          lineHeight: 1.7,
          maxWidth: 520,
          margin: "0 auto 40px",
        }}>
          {t.mktHeroBody}
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href={`${AGENCY_URL}/signup`}
            style={{
              background: `linear-gradient(135deg, ${SAND}, ${SAND_DIM})`,
              color: NAVY, fontWeight: 700, fontSize: 15,
              padding: "14px 28px", borderRadius: 11, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}
          >
            {t.mktHeroCtaPrimary}
          </a>
          <a
            href="#how-it-works"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${BORDER}`,
              color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 15,
              padding: "14px 28px", borderRadius: 11, textDecoration: "none",
            }}
          >
            {t.mktHeroCtaSecondary}
          </a>
        </div>

        <div style={{ marginTop: 48, display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
          {[
            { v: "10+", l: t.mktTrustTemplates },
            { v: "4", l: t.mktTrustMetrics },
            { v: "2", l: t.mktTrustLanguages },
          ].map((s) => (
            <div key={s.l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: SAND, letterSpacing: "-0.5px" }}>{s.v}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px", marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  const lang = useLang();
  const t = T[lang];
  const isRtl = lang === "ar";

  const features = [
    { icon: "✦", title: t.mktFeat0Title, desc: t.mktFeat0Desc },
    { icon: "📊", title: t.mktFeat1Title, desc: t.mktFeat1Desc },
    { icon: "📥", title: t.mktFeat2Title, desc: t.mktFeat2Desc },
    { icon: "🎨", title: t.mktFeat3Title, desc: t.mktFeat3Desc },
    { icon: "🌐", title: t.mktFeat4Title, desc: t.mktFeat4Desc },
    { icon: "📱", title: t.mktFeat5Title, desc: t.mktFeat5Desc },
  ];

  return (
    <section style={{ padding: "88px 32px", background: NAVY, direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: MUTED, marginBottom: 12 }}>
            {t.mktFeatEyebrow}
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 400, letterSpacing: "-0.8px", color: "#fdfcf9" }}>
            {t.mktFeatH2Pre}{" "}
            <em style={{ color: SAND, fontStyle: "italic" }}>{t.mktFeatH2Em}</em>
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}>
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: NAVY_MID,
                border: `1px solid ${BORDER}`,
                borderRadius: 18,
                padding: "28px 28px",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = `${SAND}30`)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${SAND}12`, border: `1px solid ${SAND}25`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, marginBottom: 16,
              }}>
                {f.icon}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fdfcf9", marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  const lang = useLang();
  const t = T[lang];
  const isRtl = lang === "ar";

  const steps = [
    { n: "01", title: t.mktStep0Title, desc: t.mktStep0Desc },
    { n: "02", title: t.mktStep1Title, desc: t.mktStep1Desc },
    { n: "03", title: t.mktStep2Title, desc: t.mktStep2Desc },
    { n: "04", title: t.mktStep3Title, desc: t.mktStep3Desc },
  ];

  return (
    <section id="how-it-works" style={{ padding: "88px 32px", background: NAVY_MID, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: MUTED, marginBottom: 12 }}>
            {t.mktHowEyebrow}
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 400, letterSpacing: "-0.8px", color: "#fdfcf9" }}>
            {t.mktHowH2Pre}{" "}
            <em style={{ color: SAND, fontStyle: "italic" }}>{t.mktHowH2Em}</em>
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 24,
          position: "relative",
        }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{ position: "relative" }}>
              {i < steps.length - 1 && (
                <div className="hide-mobile" style={{
                  position: "absolute", top: 22,
                  [isRtl ? "right" : "left"]: "calc(50% + 22px)",
                  width: "calc(100% - 22px)", height: 1,
                  background: `linear-gradient(${isRtl ? "270deg" : "90deg"}, ${SAND}40, transparent)`,
                }} />
              )}
              <div style={{
                background: NAVY, border: `1px solid ${BORDER}`,
                borderRadius: 18, padding: "28px 24px", textAlign: "center",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: `${SAND}15`, border: `1px solid ${SAND}35`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'DM Serif Display', serif", fontSize: 16, color: SAND,
                  margin: "0 auto 16px",
                }}>
                  {s.n}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fdfcf9", marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Pricing() {
  const [annual, setAnnual] = useState(false);
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);
  const lang = useLang();
  const t = T[lang];
  const isRtl = lang === "ar";
  const isAr = lang === "ar";

  useEffect(() => {
    fetch("/api/founding-spots")
      .then(r => r.json())
      .then(d => setSpotsRemaining(d.remaining ?? 0))
      .catch(() => setSpotsRemaining(0));
  }, []);

  const soldOut = spotsRemaining !== null && spotsRemaining <= 0;
  const monthlyPrice = soldOut ? 79 : 39;
  const annualTotal = soldOut ? 756 : 390;
  const annualEquiv = soldOut ? "63" : "32.50";
  const displayPrice = annual ? annualEquiv : String(monthlyPrice);

  const features = isAr ? [
    "صفحات باقات غير محدودة",
    "جميع القوالب",
    "صندوق بريد العملاء (واتساب وماسنجر)",
    "تصدير العملاء (CSV)",
    "تاريخ تحليلات غير محدود",
    "نطاق مخصص",
    "كتابة محتوى بالذكاء الاصطناعي",
    "حتى عضوَين في الفريق",
  ] : [
    "Unlimited package pages",
    "All templates",
    "Lead inbox (WhatsApp & Messenger)",
    "Lead export (CSV)",
    "Unlimited analytics history",
    "Custom domain",
    "AI-powered content writing",
    "Up to 2 team members",
  ];

  return (
    <section id="pricing" style={{ padding: "88px 32px", background: NAVY, direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ maxWidth: 700, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          {!soldOut && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <span style={{
                fontSize: 11, fontWeight: 800, padding: "3px 12px", borderRadius: 99,
                background: `linear-gradient(135deg, ${SAND}, ${SAND_DIM})`,
                color: NAVY, textTransform: "uppercase", letterSpacing: ".5px",
              }}>
                {isAr ? "عرض محدود" : "Limited Offer"}
              </span>
              {spotsRemaining !== null && (
                <span style={{ fontSize: 13, color: MUTED }}>
                  {isAr ? `${spotsRemaining} من 50 مقعداً متبقياً` : `${spotsRemaining} of 50 spots remaining`}
                </span>
              )}
            </div>
          )}
          <h2 style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 400, letterSpacing: "-0.8px",
            color: "#fdfcf9", margin: "0 0 14px",
          }}>
            {soldOut
              ? (isAr ? "ابدأ مع الخطة القياسية" : "Get Started with Standard")
              : (isAr ? "كن عضواً مؤسساً" : "Become a Founding Member")
            }
          </h2>
          <p style={{ fontSize: 15, color: MUTED, maxWidth: 460, margin: "0 auto 28px" }}>
            {soldOut
              ? (isAr ? "المقاعد التأسيسية نفدت. الأسعار القياسية تُطبَّق الآن." : "Founding spots are gone. Standard pricing now applies.")
              : (isAr ? "احجز أقل سعر للأبد. 50 مقعداً فقط — لن يرتفع السعر أبداً." : "Lock in the lowest price forever. Only 50 spots — your rate never increases.")
            }
          </p>

          {/* Toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 4, gap: 2 }}>
            {[false, true].map((isAnnual) => (
              <button
                key={String(isAnnual)}
                onClick={() => setAnnual(isAnnual)}
                style={{
                  padding: "7px 18px", borderRadius: 7, fontSize: 13, fontWeight: 700,
                  border: "none", cursor: "pointer", fontFamily: "inherit",
                  background: annual === isAnnual ? (isAnnual ? SAND : "rgba(255,255,255,0.1)") : "transparent",
                  color: annual === isAnnual ? (isAnnual ? NAVY : "#fff") : MUTED,
                  display: "flex", alignItems: "center", gap: 7, transition: "all 0.15s",
                }}
              >
                {isAnnual ? t.mktBillingAnnual : t.mktBillingMonthly}
                {isAnnual && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 99,
                    background: annual ? NAVY : SAND,
                    color: annual ? SAND : NAVY,
                  }}>
                    {isAr ? "وفّر 17%" : "Save 17%"}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: soldOut ? NAVY_MID : `linear-gradient(160deg, rgba(232,201,123,0.07), ${NAVY_MID})`,
          border: soldOut ? `1px solid ${BORDER}` : `1.5px solid ${SAND}45`,
          borderRadius: 22, padding: "36px 32px", position: "relative",
          direction: isRtl ? "rtl" : "ltr",
        }}>
          {!soldOut && (
            <div style={{
              position: "absolute", top: -13, left: isRtl ? "auto" : 28, right: isRtl ? 28 : "auto",
              background: `linear-gradient(135deg, ${SAND}, ${SAND_DIM})`,
              color: NAVY, fontSize: 10.5, fontWeight: 800,
              padding: "4px 14px", borderRadius: 99, letterSpacing: ".5px", textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}>
              {isAr ? "عضو مؤسس" : "FOUNDING MEMBER"}
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 28 }}>
            <div>
              <div style={{ fontSize: 20, fontWeight: 700, color: soldOut ? "#fdfcf9" : SAND, marginBottom: 6 }}>
                {soldOut ? (isAr ? "قياسي" : "Standard") : (isAr ? "تأسيسي" : "Founding")}
              </div>
              <div style={{ fontSize: 13, color: MUTED }}>
                {soldOut
                  ? (isAr ? "للأعضاء الجدد" : "For new members")
                  : (isAr ? "مثبّت مدى الحياة · لن يرتفع أبداً" : "Locked in for life · Never increases")
                }
              </div>
            </div>
            <div style={{ textAlign: isRtl ? "left" : "right" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 4, justifyContent: isRtl ? "flex-start" : "flex-end" }}>
                <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 46, color: "#fdfcf9", letterSpacing: "-1px", lineHeight: 1 }}>
                  €{displayPrice}
                </span>
                <span style={{ fontSize: 14, color: MUTED }}>{t.mktPricingMoSuffix}</span>
              </div>
              {annual && (
                <div style={{ fontSize: 12, color: SUCCESS, fontWeight: 600, marginTop: 4 }}>
                  {isAr ? `مدفوع €${annualTotal} سنوياً` : `billed €${annualTotal}/yr`}
                </div>
              )}
              {!soldOut && !annual && (
                <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>
                  {isAr ? "مقابل 79€ بعد البيع" : "vs. €79/mo after founding"}
                </div>
              )}
            </div>
          </div>

          <div style={{ height: 1, background: BORDER, marginBottom: 24 }} />

          <div style={{
            display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px", marginBottom: 28,
          }}>
            {features.map((f) => (
              <div key={f} style={{ display: "flex", gap: 8, alignItems: "center", padding: "5px 0" }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  background: `${SAND}22`, display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 9, color: SAND,
                }}>✓</div>
                <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{f}</span>
              </div>
            ))}
          </div>

          <a
            href={`${AGENCY_URL}/signup`}
            style={{
              display: "block", textAlign: "center",
              background: soldOut ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${SAND}, ${SAND_DIM})`,
              border: soldOut ? `1px solid ${BORDER}` : "none",
              color: soldOut ? "rgba(255,255,255,0.75)" : NAVY,
              fontWeight: 700, fontSize: 15,
              padding: "14px 20px", borderRadius: 10, textDecoration: "none",
              transition: "opacity 0.15s",
            }}
          >
            {soldOut
              ? (isAr ? "✦ ابدأ الآن مجاناً" : "✦ Start Free Trial")
              : (isAr ? "✦ احجز مقعدك التأسيسي" : "✦ Claim Your Founding Spot")
            }
          </a>
        </div>

        {/* After-founding note */}
        {!soldOut && (
          <div style={{
            marginTop: 14, padding: "10px 18px", borderRadius: 10,
            background: "rgba(255,255,255,0.02)", border: `1px solid ${BORDER}`,
            textAlign: "center",
          }}>
            <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.3)" }}>
              {isAr
                ? `بعد نفاد المقاعد: 79€/شهر${annual ? " · 756€/سنة" : ""}`
                : `After founding sells out: €79/mo${annual ? " · €756/yr annual" : ""}`
              }
            </span>
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 28 }}>
          <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.3)" }}>
            {isAr
              ? "تجربة مجانية 14 يوماً · لا يلزم بطاقة ائتمانية · إلغاء في أي وقت"
              : "14-day free trial · No credit card required · Cancel anytime"
            }
          </p>
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  const lang = useLang();
  const t = T[lang];
  const isRtl = lang === "ar";

  return (
    <section style={{
      padding: "80px 32px",
      background: `linear-gradient(135deg, rgba(232,201,123,0.08), ${NAVY_MID})`,
      borderTop: `1px solid ${SAND}25`,
      borderBottom: `1px solid ${BORDER}`,
      textAlign: "center",
      direction: isRtl ? "rtl" : "ltr",
    }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 400, letterSpacing: "-0.8px", color: "#fdfcf9", marginBottom: 16 }}>
          {t.mktCtaH2Pre}{" "}
          <em style={{ color: SAND, fontStyle: "italic" }}>{t.mktCtaH2Em}</em>
        </h2>
        <p style={{ fontSize: 16, color: MUTED, marginBottom: 32, lineHeight: 1.65 }}>
          {t.mktCtaBody}
        </p>
        <a
          href={`${AGENCY_URL}/signup`}
          style={{
            background: `linear-gradient(135deg, ${SAND}, ${SAND_DIM})`,
            color: NAVY, fontWeight: 700, fontSize: 15,
            padding: "15px 32px", borderRadius: 12, textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 8,
          }}
        >
          {t.mktCtaBtn}
        </a>
      </div>
    </section>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  const lang = useLang();
  const t = T[lang];
  const isRtl = lang === "ar";

  return (
    <footer style={{
      background: "#080f1a",
      borderTop: `1px solid ${BORDER}`,
      padding: "48px 32px 32px",
      color: "rgba(255,255,255,0.35)",
      direction: isRtl ? "rtl" : "ltr",
    }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 40, justifyContent: "space-between", marginBottom: 40 }}>
          <div style={{ maxWidth: 260 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <img src="/logo.svg" alt="PackMetrix" style={{ width: 24, height: 24 }} />
              <span style={{ fontWeight: 700, fontSize: 15, color: "#fdfcf9" }}>
                Pack<em style={{ color: SAND, fontStyle: "normal" }}>metrix</em>
              </span>
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.65 }}>
              {t.mktFooterTagline}
            </p>
          </div>

          <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".7px", color: "rgba(255,255,255,0.25)", marginBottom: 14 }}>
                {t.mktFooterProduct}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: t.mktFooterAgencyApp, href: AGENCY_URL },
                  { label: t.mktFooterPricing, href: "#pricing" },
                  { label: t.mktFooterTemplates, href: `${AGENCY_URL}/signup` },
                ].map((l) => (
                  <a key={l.label} href={l.href} style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.color = SAND)}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".7px", color: "rgba(255,255,255,0.25)", marginBottom: 14 }}>
                {t.mktFooterLegal}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: t.mktFooterPrivacy, href: "/privacy" },
                  { label: t.mktFooterTerms, href: "/terms" },
                ].map((l) => (
                  <a key={l.label} href={l.href} style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{
          borderTop: `1px solid rgba(255,255,255,0.06)`,
          paddingTop: 24,
          display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ fontSize: 12 }}>
            © {year} PackMetrix. {t.mktFooterAllRights}
          </div>
          <div style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span>{t.mktFooterOperatedBy}</span>
            <span style={{ color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>WQ AppTech</span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
            <span>{t.mktFooterCompanyDesc}</span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
            <span>
              KvK{" "}
              <a
                href="https://www.kvk.nl/zoeken/?q=WQ+AppTech"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "rgba(255,255,255,0.45)", textDecoration: "underline" }}
              >
                91019001
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function MarketingPage() {
  const lang = useLang();
  const isRtl = lang === "ar";

  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: "#fdfcf9", fontFamily: "var(--font-dm-sans), 'DM Sans', system-ui, sans-serif", direction: isRtl ? "rtl" : "ltr" }}>
      <NavBar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <CtaBanner />
      <Footer />
    </div>
  );
}
