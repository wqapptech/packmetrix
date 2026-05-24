"use client";

import React from "react";
import { T } from "@/lib/translations";
import {
  WAButton,
  Eyebrow,
  AgencyBar,
  StickyCTA,
  SharedCTABanner,
  SharedFooter,
  BaseCard,
  useIsDesktop,
  DesktopNav,
  DContainer,
  DesktopFooter,
  SharedCTABannerDesktop,
  ReviewsSection,
  ReviewsSectionDesktop,
  DynamicSections,
  DynamicSectionsDesktop,
  getItineraryDays,
  TrustStrip,
  TrustItem,
} from "./shared";
import type { TPageProps, TCardProps, TemplateTokens } from "./types";

const ORANGE  = "#b85c1f";
const SAND    = "#f2f0eb";
const INK     = "#0d1b2e";
const MUTED   = "rgba(13,27,46,0.55)";
const SMUTED  = "rgba(13,27,46,0.35)";
const BORDER  = "rgba(13,27,46,0.08)";
const INTER   = "var(--font-inter-tight, sans-serif)";

// ─── Difficulty bar ───────────────────────────────────────────────────────────

function DifficultyBar({ difficulty, lang, expanded = false }: { difficulty: TPageProps["pkg"]["difficulty"]; lang: TPageProps["lang"]; expanded?: boolean }) {
  const t = T[lang];
  if (!difficulty) return null;
  const levels = ["easy", "moderate", "strenuous", "extreme"] as const;
  const levelIndex = levels.indexOf(difficulty);
  const labels: Record<string, string> = {
    easy:      t.difficultyEasy,
    moderate:  t.difficultyModerate,
    strenuous: t.difficultyStrenuous,
    extreme:   t.difficultyExtreme,
  };
  const colors: Record<string, string> = { easy: "#2dd4a0", moderate: "#f59e0b", strenuous: ORANGE, extreme: "#ef4444" };
  const color = colors[difficulty] || ORANGE;

  return (
    <div style={{ marginTop: expanded ? 0 : 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: expanded ? 12 : 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, color: MUTED }}>{t.difficultyLabel}</div>
        <div style={{ fontSize: expanded ? 18 : 11.5, fontWeight: 800, color, fontFamily: INTER }}>{labels[difficulty] || difficulty}</div>
      </div>
      <div style={{ height: expanded ? 10 : 5, background: "rgba(13,27,46,0.08)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(levelIndex + 1) * 25}%`, background: color, borderRadius: 99, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

// ─── Trust items ──────────────────────────────────────────────────────────────

function buildCompassTrustItems(t: typeof T["en"]): TrustItem[] {
  return [
    { icon: "✈", title: t.trustHelicopterEvac, sub: t.trustHelicopterEvacSub },
    { icon: "✓", title: t.trustGuideRatioTrust, sub: t.trustGuideRatioTrustSub },
    { icon: "◎", title: t.trustAcclimatisationDays, sub: t.trustAcclimatisationDaysSub },
    { icon: "📡", title: t.trustSatPhone, sub: t.trustSatPhoneSub },
  ];
}

// ─── Trek stats band ─────────────────────────────────────────────────────────

function TrekStatsBand({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const nights = pkg.nights ? Number(pkg.nights) : null;
  const diffLabels: Record<string, string> = {
    easy:      t.difficultyEasy,
    moderate:  t.difficultyModerate,
    strenuous: t.difficultyStrenuous,
    extreme:   t.difficultyExtreme,
  };
  const cells = [
    ...(pkg.maxAltitude ? [{ v: pkg.maxAltitude.toLocaleString(), u: t.metersUnit, l: t.altitudeLabel }] : []),
    ...(pkg.distanceKm ? [{ v: String(pkg.distanceKm), u: t.kmUnit, l: t.distanceLabel }] : []),
    ...(nights ? [{ v: String(nights), u: ` ${t.nightsLabel}`, l: t.tripLengthLabel }] : []),
    { v: "1:4", u: "", l: t.guideRatioLabel },
    ...(pkg.difficulty ? [{ v: diffLabels[pkg.difficulty] || pkg.difficulty, u: "", l: t.difficultyLabel }] : []),
  ];
  if (!cells.length) return null;

  return (
    <div style={{
      background: INK,
      display: "grid",
      gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
    }}>
      {cells.map((s, i) => (
        <div key={i} style={{
          padding: "22px 20px",
          borderRight: i < cells.length - 1 ? "1px solid rgba(255,255,255,0.08)" : undefined,
        }}>
          <div style={{ fontFamily: INTER, fontSize: 26, fontWeight: 800, color: ORANGE, lineHeight: 1, letterSpacing: "-0.5px" }}>
            {s.v}<span style={{ fontSize: 13, fontWeight: 600, opacity: 0.7, marginLeft: 2 }}>{s.u}</span>
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, letterSpacing: "0.8px", marginTop: 5 }}>{s.l}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Honest difficulty section ────────────────────────────────────────────────

function HonestDifficultySection({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: TPageProps["lang"] }) {
  const t = T[lang];
  if (!pkg.difficulty) return null;
  const isRtl = lang === "ar";

  return (
    <DContainer id="difficulty" style={{ padding: "56px 80px", scrollMarginTop: 88 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, direction: isRtl ? "rtl" : "ltr" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 10 }}>
            {t.beforeYouBookLabel}
          </div>
          <h2 style={{ fontFamily: INTER, fontSize: 36, fontWeight: 800, letterSpacing: "-1px", color: INK, margin: "0 0 16px", lineHeight: 1.1 }}>
            {t.honestDifficultyLabel}
          </h2>
          {pkg.fitnessNote && (
            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.65, margin: 0 }}>{pkg.fitnessNote}</p>
          )}
        </div>
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: "28px 28px" }}>
          <DifficultyBar difficulty={pkg.difficulty} lang={lang} expanded />
          {pkg.fitnessNote && (
            <div style={{ marginTop: 16, fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
              <b style={{ color: INK }}>{t.fitnessLabel}: </b>{pkg.fitnessNote}
            </div>
          )}
        </div>
      </div>
    </DContainer>
  );
}

// ─── Guide closing panel ──────────────────────────────────────────────────────

function CompassGuidePanel({ pkg, agency, lang, onWhatsApp }: { pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; lang: TPageProps["lang"]; onWhatsApp: () => void }) {
  const t = T[lang];
  const agent = pkg.agent;
  const firstName = agent?.name?.split(" ")[0] || agency.name;
  const isRtl = lang === "ar";

  return (
    <section style={{ background: INK, padding: "40px 24px", direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.45)", marginBottom: 20 }}>
        {t.compassLeadGuide} · {agency.name}
      </div>
      {agent && (
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          {agent.avatar
            ? <img src={agent.avatar} alt={agent.name} style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover" }} />
            : <div style={{ width: 60, height: 60, borderRadius: "50%", background: `${ORANGE}44`, flexShrink: 0 }} />
          }
          <div>
            <div style={{ fontFamily: INTER, fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.5px" }}>{agent.name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>{agent.role}</div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "6px 12px" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.85)" }}>{t.agentOnlineLabel}</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "6px 12px", fontSize: 11.5, color: "rgba(255,255,255,0.7)" }}>
          ✓ {t.compassUiagmCertified}
        </div>
      </div>
      <WAButton label={`${t.messageUs.replace(" ▷", "")} ${firstName}`} full onClick={onWhatsApp} />
      <button style={{
        width: "100%", marginTop: 10, padding: "12px", borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.25)", background: "transparent",
        color: "rgba(255,255,255,0.75)", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
      }}>
        {t.compassFitnessAssessment}
      </button>
    </section>
  );
}

function CompassGuidePanelDesktop({ pkg, agency, lang, onWhatsApp }: { pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; lang: TPageProps["lang"]; onWhatsApp: () => void }) {
  const t = T[lang];
  const agent = pkg.agent;
  const firstName = agent?.name?.split(" ")[0] || agency.name;
  const isRtl = lang === "ar";

  return (
    <section style={{ background: INK }}>
      <DContainer style={{ padding: "72px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 64, alignItems: "center" }}>
          {/* Portrait */}
          <div style={{
            order: isRtl ? 2 : 1,
            position: "relative", height: 420,
            overflow: "hidden", background: `${ORANGE}22`,
            borderRadius: 16,
          }}>
            {agent?.avatar
              ? <img src={agent.avatar} alt={agent?.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${ORANGE}44, ${INK})` }} />
            }
          </div>
          {/* Content */}
          <div style={{ order: isRtl ? 1 : 2 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.45)", marginBottom: 16 }}>
              {t.compassLeadGuide} · {agency.name}
            </div>
            {agent && (
              <>
                <div style={{ fontFamily: INTER, fontSize: 40, fontWeight: 800, color: "#fff", letterSpacing: "-1.5px", lineHeight: 1.05, marginBottom: 6 }}>{agent.name}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 24 }}>{agent.role}</div>
              </>
            )}
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10, marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "7px 14px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>{t.agentOnlineLabel}</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "7px 14px", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                ✓ {t.compassUiagmCertified}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <WAButton label={`${t.messageUs.replace(" ▷", "")} ${firstName}`} size="lg" onClick={onWhatsApp} />
              <button style={{
                padding: "14px 22px", borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.25)", background: "transparent",
                color: "rgba(255,255,255,0.75)", fontSize: 14, cursor: "pointer", fontFamily: "inherit",
              }}>
                {t.compassFitnessAssessment}
              </button>
            </div>
          </div>
        </div>
      </DContainer>
    </section>
  );
}

// ─── TemplateCompassPage ──────────────────────────────────────────────────────

export function TemplateCompassPage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const tokens: TemplateTokens = {
    bg: SAND, ink: INK, muted: MUTED, superMuted: SMUTED, border: BORDER, brand: ORANGE, serif: INTER,
  };

  const nights     = pkg.nights ? Number(pkg.nights) : null;
  const coverImage = pkg.coverImage || "";
  const title      = pkg.title || pkg.destination;
  const isRtl      = lang === "ar";
  const itinerary  = getItineraryDays(pkg).filter(it => it.title?.trim());
  const includes   = pkg.includes?.length ? pkg.includes : (pkg.advantages || []);
  const isDesktop  = useIsDesktop();
  const trustItems = buildCompassTrustItems(t);

  const altitudeLabel = pkg.maxAltitude ? `${pkg.maxAltitude.toLocaleString()}${t.metersUnit}` : pkg.price;

  const navLinks = [
    ...(itinerary.length ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...(includes.length ? [{ label: t.navIncluded, href: "#included" }] : []),
    ...((pkg.pricingTiers || []).some(t2 => t2.price) ? [{ label: t.navPricing, href: "#pricing" }] : []),
  ];

  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: SAND, color: INK, fontFamily: INTER, direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={ORANGE} navLinks={navLinks} lang={lang} onWhatsApp={onWhatsApp} />

        {/* Hero: text LEFT, image RIGHT (50/50 split) */}
        <DContainer style={{ padding: "80px 80px 64px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            {/* Text column */}
            <div style={{ order: isRtl ? 2 : 1 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 12 }}>
                {pkg.destination}
              </div>
              <h1 style={{ fontFamily: INTER, fontSize: 58, fontWeight: 800, lineHeight: 0.97, letterSpacing: "-2px", margin: "0 0 20px", color: INK }}>{title}</h1>
              {pkg.description && (
                <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.65, margin: "0 0 24px" }}>{pkg.description}</p>
              )}
              <div style={{ fontFamily: INTER, fontSize: 36, fontWeight: 800, color: ORANGE, letterSpacing: "-0.8px", lineHeight: 1 }}>{pkg.price}</div>
              <div style={{ fontSize: 11.5, color: SMUTED, marginTop: 4, marginBottom: 20, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{t.perPerson}</div>
              {pkg.difficulty && (
                <div style={{ maxWidth: 320, marginBottom: 20 }}>
                  <DifficultyBar difficulty={pkg.difficulty} lang={lang} />
                </div>
              )}
              <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />
            </div>
            {/* Image column */}
            <div style={{ order: isRtl ? 1 : 2, position: "relative", height: 520, borderRadius: 16, overflow: "hidden", background: INK }}>
              {coverImage
                ? <img src={coverImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${ORANGE}cc, ${ORANGE}55)` }} />
              }
            </div>
          </div>
        </DContainer>

        {/* 5-col stats band */}
        <TrekStatsBand pkg={pkg} lang={lang} />

        {/* Trust strip */}
        <TrustStrip
          items={trustItems}
          ink={INK} mutedColor={MUTED} borderColor={BORDER} iconAccent={ORANGE}
          layout="row"
          style={{ padding: "20px 80px" }}
        />

        {/* Honest difficulty section */}
        <HonestDifficultySection pkg={pkg} lang={lang} />

        {/* Includes 3-col */}
        {includes.length > 0 && (
          <DContainer id="included" style={{ padding: "0 80px 56px" }}>
            <Eyebrow text={t.includedLabel} brand={ORANGE} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 16 }}>
              {includes.slice(0, 9).map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "12px 14px" }}>
                  <span style={{ color: ORANGE, fontSize: 11, fontWeight: 800, marginTop: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>
          </DContainer>
        )}

        {/* Day-by-day itinerary */}
        {itinerary.length > 0 && (
          <DContainer id="itinerary" style={{ padding: "0 80px 64px" }}>
            <Eyebrow text={t.dayByDay} brand={ORANGE} />
            <h2 style={{ fontFamily: INTER, fontSize: 32, fontWeight: 800, letterSpacing: "-0.7px", margin: "10px 0 24px" }}>{t.compassDailyMetrics}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {itinerary.map((it, i) => (
                <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: ORANGE, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 6 }}>
                    {t.dayLabel} {it.day}
                    {it.km ? ` · ${it.km}${t.kmUnit}` : ""}
                    {it.alt ? ` · ${it.alt}${t.metersUnit}` : ""}
                  </div>
                  <div style={{ fontFamily: INTER, fontSize: 13.5, fontWeight: 700, color: INK, lineHeight: 1.3, marginBottom: it.desc ? 6 : 0 }}>{it.title}</div>
                  {it.desc && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{it.desc}</div>}
                </div>
              ))}
            </div>
          </DContainer>
        )}

        <DynamicSectionsDesktop pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} skip={["itinerary"]} />
        <ReviewsSectionDesktop pkg={pkg} tokens={tokens} lang={lang} agency={agency} />
        <CompassGuidePanelDesktop pkg={pkg} agency={agency} lang={lang} onWhatsApp={onWhatsApp} />
        <SharedCTABannerDesktop pkg={pkg} agency={agency} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} onMessenger={onMessenger} />
        <DesktopFooter agency={agency} brand={ORANGE} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: SAND, color: INK, fontFamily: INTER, direction: isRtl ? "rtl" : "ltr" }}>
      <AgencyBar agency={agency} price={pkg.price} brand={ORANGE} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} />

      {/* Hero: full-bleed with strong bottom gradient on mobile */}
      <div style={{ position: "relative", height: 460, overflow: "hidden" }}>
        {coverImage
          ? <img src={coverImage} alt={pkg.destination} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${ORANGE}cc, ${ORANGE}55)` }} />
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 20%, rgba(0,0,0,0.75) 100%)" }} />
        <div style={{ position: "absolute", bottom: 20, left: 18, right: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.7)", letterSpacing: "2px", textTransform: "uppercase" as const, marginBottom: 6 }}>
            {pkg.destination}
          </div>
          <h1 style={{ fontFamily: INTER, fontSize: 34, fontWeight: 800, color: "#fff", lineHeight: 1.05, letterSpacing: "-1px", margin: 0 }}>{title}</h1>
        </div>
      </div>

      {/* Stats band */}
      <TrekStatsBand pkg={pkg} lang={lang} />

      {/* Difficulty + fitness */}
      {pkg.difficulty && (
        <div style={{ padding: "16px 18px 0" }}>
          <DifficultyBar difficulty={pkg.difficulty} lang={lang} />
          {pkg.fitnessNote && (
            <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>{pkg.fitnessNote}</div>
          )}
        </div>
      )}

      {/* Price + CTA */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontFamily: INTER, fontSize: 32, fontWeight: 800, color: ORANGE, letterSpacing: "-0.8px", lineHeight: 1 }}>{pkg.price}</div>
            <div style={{ fontSize: 11, color: SMUTED, marginTop: 3, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{t.perPerson}</div>
          </div>
          <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />
        </div>
        {pkg.description && (
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65, marginTop: 14, marginBottom: 0 }}>{pkg.description}</p>
        )}
      </div>

      {/* Mobile trust strip — horizontal scroll */}
      <div style={{
        display: "flex", gap: 0, marginTop: 16,
        borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`,
        overflowX: "auto", scrollbarWidth: "none",
      }}>
        {trustItems.map((item, i) => (
          <div key={i} style={{
            flexShrink: 0, padding: "10px 14px", fontSize: 12, color: INK,
            fontWeight: 600, whiteSpace: "nowrap" as const,
            borderRight: i < trustItems.length - 1 ? `1px solid ${BORDER}` : undefined,
          }}>
            {item.title}
          </div>
        ))}
      </div>

      {/* Includes */}
      {includes.length > 0 && (
        <div id="included" style={{ padding: "22px 18px 0", scrollMarginTop: 88 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 12 }}>{t.includedLabel}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {includes.slice(0, 6).map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px" }}>
                <span style={{ color: ORANGE, fontSize: 11, fontWeight: 800, marginTop: 1, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.4 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day-by-day itinerary */}
      {itinerary.length > 0 && (
        <section id="itinerary" style={{ padding: "22px 18px 0", scrollMarginTop: 88 }}>
          <Eyebrow text={t.dayByDay} brand={ORANGE} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
            {itinerary.map((it, i) => (
              <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: `${ORANGE}12`, border: `1px solid ${ORANGE}30`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontSize: 13, fontWeight: 800, color: ORANGE }}>
                  {it.day}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: INTER, fontSize: 13.5, fontWeight: 700, color: INK, lineHeight: 1.3, marginBottom: (it.desc || it.km || it.alt) ? 4 : 0 }}>
                    {it.title}
                  </div>
                  {(it.km || it.alt) && (
                    <div style={{ fontSize: 11, color: ORANGE, fontWeight: 700, marginBottom: it.desc ? 4 : 0 }}>
                      {it.km ? `${it.km}${t.kmUnit}` : ""}
                      {it.km && it.alt ? " · " : ""}
                      {it.alt ? `${it.alt}${t.metersUnit}` : ""}
                    </div>
                  )}
                  {it.desc && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>{it.desc}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <DynamicSections pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} skip={["itinerary"]} />
      <ReviewsSection pkg={pkg} tokens={tokens} lang={lang} agency={agency} />
      <CompassGuidePanel pkg={pkg} agency={agency} lang={lang} onWhatsApp={onWhatsApp} />

      <div style={{ padding: "0 18px 28px" }}>
        <SharedCTABanner pkg={pkg} agency={agency} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} onMessenger={onMessenger} />
      </div>

      <SharedFooter agency={agency} tokens={tokens} />
      <StickyCTA price={altitudeLabel} nights={nights} label={t.bookWhatsApp} onWhatsApp={onWhatsApp} lang={lang} />
    </div>
  );
}

// ─── TemplateCompassCard ──────────────────────────────────────────────────────

export function TemplateCompassCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
