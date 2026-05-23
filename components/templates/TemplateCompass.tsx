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

function DifficultyBar({ difficulty, lang }: { difficulty: TPageProps["pkg"]["difficulty"]; lang: TPageProps["lang"] }) {
  const t = T[lang];
  if (!difficulty) return null;
  const levels = ["easy", "moderate", "strenuous", "extreme"] as const;
  const levelIndex = levels.indexOf(difficulty);
  const labels = {
    easy:      t.difficultyEasy,
    moderate:  t.difficultyModerate,
    strenuous: t.difficultyStrenuous,
    extreme:   t.difficultyExtreme,
  };
  const colors = { easy: "#2dd4a0", moderate: "#f59e0b", strenuous: ORANGE, extreme: "#ef4444" };
  const color = colors[difficulty] || ORANGE;

  return (
    <div style={{ marginTop: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, color: MUTED }}>{t.difficultyLabel}</div>
        <div style={{ fontSize: 11.5, fontWeight: 800, color, fontFamily: INTER }}>{labels[difficulty] || difficulty}</div>
      </div>
      <div style={{ height: 5, background: "rgba(13,27,46,0.08)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(levelIndex + 1) * 25}%`, background: color, borderRadius: 99, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

// ─── Trek stats band ─────────────────────────────────────────────────────────

function TrekStats({ pkg, lang, layout = "grid" }: { pkg: TPageProps["pkg"]; lang: TPageProps["lang"]; layout?: "grid" | "row" }) {
  const t = T[lang];
  const nights = pkg.nights ? Number(pkg.nights) : null;
  const stats = [
    ...(nights ? [{ v: `${nights}`, u: t.nightsLabel, l: t.logisticsDuration }] : []),
    ...(pkg.distanceKm ? [{ v: String(pkg.distanceKm), u: t.kmUnit, l: t.distanceLabel }] : []),
    ...(pkg.maxAltitude ? [{ v: String(pkg.maxAltitude), u: t.metersUnit, l: t.altitudeLabel }] : []),
  ];
  if (!stats.length) return null;

  if (layout === "row") {
    return (
      <div style={{ display: "flex", gap: 32 }}>
        {stats.map((s, i) => (
          <div key={i}>
            <div style={{ fontFamily: INTER, fontSize: 32, fontWeight: 800, color: "#fff", lineHeight: 1, letterSpacing: "-0.8px" }}>
              {s.v}<span style={{ fontSize: 14, fontWeight: 600, opacity: 0.7, marginLeft: 2 }}>{s.u}</span>
            </div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.55)", textTransform: "uppercase" as const, letterSpacing: "0.8px", marginTop: 3 }}>{s.l}</div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${stats.length}, 1fr)`, gap: 10, padding: "18px 18px 0" }}>
      {stats.map((s, i) => (
        <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 14px" }}>
          <div style={{ fontFamily: INTER, fontSize: 26, fontWeight: 800, color: ORANGE, lineHeight: 1, letterSpacing: "-0.5px" }}>
            {s.v}<span style={{ fontSize: 11, fontWeight: 600, opacity: 0.6, marginLeft: 1 }}>{s.u}</span>
          </div>
          <div style={{ fontSize: 9.5, color: SMUTED, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginTop: 4 }}>{s.l}</div>
        </div>
      ))}
    </div>
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

  const navLinks = [
    ...(itinerary.length ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...(includes.length ? [{ label: t.navIncluded, href: "#included" }] : []),
    ...((pkg.pricingTiers || []).some(t2 => t2.price) ? [{ label: t.navPricing, href: "#pricing" }] : []),
  ];

  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: SAND, color: INK, fontFamily: INTER, direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={ORANGE} navLinks={navLinks} lang={lang} onWhatsApp={onWhatsApp} />

        {/* Full-bleed hero with left overlay */}
        <div style={{ position: "relative", height: 580, overflow: "hidden" }}>
          {coverImage
            ? <img src={coverImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${ORANGE}cc, ${ORANGE}55)` }} />
          }
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.12) 55%, transparent 100%)" }} />
          <DContainer style={{ position: "absolute", inset: 0, padding: "80px 80px", display: "flex", alignItems: "flex-end" }}>
            <div style={{ maxWidth: 600, color: "#fff", paddingBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, opacity: 0.9, letterSpacing: "2px", textTransform: "uppercase" as const, marginBottom: 12 }}>
                {pkg.destination}
              </div>
              <h1 style={{ fontFamily: INTER, fontSize: 68, fontWeight: 800, lineHeight: 0.95, letterSpacing: "-2.5px", margin: "0 0 22px" }}>{title}</h1>
              <TrekStats pkg={pkg} lang={lang} layout="row" />
              {pkg.difficulty && (
                <div style={{ marginTop: 18, maxWidth: 280 }}>
                  <DifficultyBar difficulty={pkg.difficulty} lang={lang} />
                </div>
              )}
              <div style={{ marginTop: 28 }}>
                <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />
              </div>
            </div>
          </DContainer>
        </div>

        {/* Description */}
        <DContainer style={{ padding: "64px 80px 48px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: 64 }}>
            <div>
              <Eyebrow text={t.trekStatsTitle} brand={ORANGE} />
              {pkg.fitnessNote && (
                <div style={{ marginTop: 14, fontSize: 14, color: MUTED, lineHeight: 1.7 }}>{pkg.fitnessNote}</div>
              )}
              <div style={{ marginTop: 24, fontFamily: INTER, fontSize: 38, fontWeight: 800, color: ORANGE, letterSpacing: "-0.8px", lineHeight: 1 }}>{pkg.price}</div>
              <div style={{ fontSize: 11.5, color: SMUTED, marginTop: 5, marginBottom: 18 }}>{nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.perPerson}</div>
              <WAButton label={t.bookWhatsApp} size="md" onClick={onWhatsApp} />
            </div>
            <p style={{ fontSize: 17, color: MUTED, lineHeight: 1.7, margin: 0, alignSelf: "center" }}>{pkg.description}</p>
          </div>
        </DContainer>

        {/* Itinerary */}
        {itinerary.length > 0 && (
          <DContainer id="itinerary" style={{ padding: "32px 80px 64px" }}>
            <Eyebrow text={t.dayByDay} brand={ORANGE} />
            <h2 style={{ fontFamily: INTER, fontSize: 36, fontWeight: 800, letterSpacing: "-0.7px", marginTop: 10, marginBottom: 24 }}>{t.yourJourney}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {itinerary.map((it, i) => (
                <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: ORANGE, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 8 }}>
                    {t.dayLabel} {it.day}
                    {it.km ? ` · ${it.km}${t.kmUnit}` : ""}
                    {it.alt ? ` · ${it.alt}${t.metersUnit}` : ""}
                  </div>
                  <div style={{ fontFamily: INTER, fontSize: 14, fontWeight: 700, color: INK, lineHeight: 1.3, marginBottom: it.desc ? 8 : 0 }}>{it.title}</div>
                  {it.desc && <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.55 }}>{it.desc}</div>}
                </div>
              ))}
            </div>
          </DContainer>
        )}

        <DynamicSectionsDesktop pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
        <ReviewsSectionDesktop pkg={pkg} tokens={tokens} lang={lang} agency={agency} />
        <SharedCTABannerDesktop pkg={pkg} agency={agency} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} onMessenger={onMessenger} />
        <DesktopFooter agency={agency} brand={ORANGE} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: SAND, color: INK, fontFamily: INTER, direction: isRtl ? "rtl" : "ltr" }}>
      <AgencyBar agency={agency} price={pkg.price} brand={ORANGE} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} />

      {/* Hero: full-bleed with strong gradient left */}
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

      {/* Trek stats */}
      <TrekStats pkg={pkg} lang={lang} />

      {/* Difficulty + fitness */}
      {pkg.difficulty && (
        <div style={{ padding: "14px 18px 0" }}>
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

      <DynamicSections pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
      <ReviewsSection pkg={pkg} tokens={tokens} lang={lang} agency={agency} />

      <div style={{ padding: "0 18px 28px" }}>
        <SharedCTABanner pkg={pkg} agency={agency} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} onMessenger={onMessenger} />
      </div>

      <SharedFooter agency={agency} tokens={tokens} />
      <StickyCTA price={pkg.price} nights={nights} label={t.bookWhatsApp} onWhatsApp={onWhatsApp} lang={lang} />
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
