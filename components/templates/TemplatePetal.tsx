"use client";

import React from "react";
import { T } from "@/lib/translations";
import {
  WAButton,
  AgencyBar,
  StickyCTA,
  SharedItinerary,
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

const ROSE   = "#c8576f";
const PEACH  = "#faf3ef";
const CLAY   = "#d4896a";
const INK    = "#1a0d0d";
const MUTED  = "rgba(26,13,13,0.52)";
const SMUTED = "rgba(26,13,13,0.32)";
const BORDER = "rgba(26,13,13,0.07)";
const SERIF  = "var(--font-instrument-serif, var(--font-cormorant), serif)";

// ─── Room treatments (replaces generic pricing tiers for couples) ─────────────

function RoomTreatments({ pkg, tokens, lang, onWhatsApp }: { pkg: TPageProps["pkg"]; tokens: TemplateTokens; lang: TPageProps["lang"]; onWhatsApp: () => void }) {
  const t = T[lang];
  const tiers = (pkg.pricingTiers || []).filter(tier => tier.price);
  if (!tiers.length) return null;
  const isRtl = lang === "ar";

  return (
    <section id="pricing" style={{ padding: "28px 18px", scrollMarginTop: 88, direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ fontFamily: SERIF, fontSize: 11, fontStyle: "italic", color: ROSE, letterSpacing: "0.3px", marginBottom: 6 }}>
        {t.roomTreatmentsSub}
      </div>
      <h2 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 400, color: INK, letterSpacing: "-0.4px", lineHeight: 1.1, margin: "0 0 20px", fontStyle: "italic" }}>
        {t.roomTreatmentsTitle}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {tiers.map((tier, i) => (
          <div
            key={i}
            style={{
              background: i === 0 ? `linear-gradient(135deg, ${ROSE}, ${CLAY})` : "#fff",
              border: `1px solid ${i === 0 ? "transparent" : BORDER}`,
              borderRadius: 18, padding: "22px 20px",
              boxShadow: i === 0 ? `0 12px 32px ${ROSE}28` : "none",
            }}
          >
            {i === 0 && (
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>
                {t.popularChoice}
              </div>
            )}
            <div style={{ fontSize: 12.5, color: i === 0 ? "rgba(255,255,255,0.75)" : MUTED, marginBottom: 8 }}>{tier.label}</div>
            <div style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 400, letterSpacing: "-0.8px", lineHeight: 1, color: i === 0 ? "#fff" : ROSE, marginBottom: 4 }}>{tier.price}</div>
            <div style={{ fontSize: 11, color: i === 0 ? "rgba(255,255,255,0.55)" : SMUTED, marginBottom: 16 }}>
              {t.couplesTreatmentLabel}
            </div>
            <button onClick={onWhatsApp} style={{
              width: "100%", padding: "11px", borderRadius: 10, border: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: 13.5, fontWeight: 700,
              background: i === 0 ? "rgba(255,255,255,0.22)" : ROSE,
              color: "#fff",
            }}>
              {t.bookWhatsApp}
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

function RoomTreatmentsDesktop({ pkg, tokens, lang, onWhatsApp }: { pkg: TPageProps["pkg"]; tokens: TemplateTokens; lang: TPageProps["lang"]; onWhatsApp: () => void }) {
  const t = T[lang];
  const tiers = (pkg.pricingTiers || []).filter(tier => tier.price);
  if (!tiers.length) return null;

  return (
    <DContainer id="pricing" style={{ padding: "64px 80px" }}>
      <div style={{ fontFamily: SERIF, fontSize: 13, fontStyle: "italic", color: ROSE, marginBottom: 8 }}>{t.roomTreatmentsSub}</div>
      <h2 style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 400, letterSpacing: "-0.8px", lineHeight: 1.05, margin: "0 0 36px", fontStyle: "italic" }}>
        {t.roomTreatmentsTitle}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(tiers.length, 3)}, 1fr)`, gap: 20 }}>
        {tiers.map((tier, i) => (
          <div key={i} style={{
            background: i === 0 ? `linear-gradient(145deg, ${ROSE}, ${CLAY})` : "#fff",
            border: `1px solid ${i === 0 ? "transparent" : BORDER}`,
            borderRadius: 20, padding: "28px 26px",
            boxShadow: i === 0 ? `0 16px 40px ${ROSE}30` : "none",
          }}>
            {i === 0 && (
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.8)", marginBottom: 10 }}>
                {t.popularChoice}
              </div>
            )}
            <div style={{ fontSize: 13, color: i === 0 ? "rgba(255,255,255,0.7)" : MUTED, marginBottom: 10 }}>{tier.label}</div>
            <div style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 400, letterSpacing: "-1px", lineHeight: 1, color: i === 0 ? "#fff" : ROSE, marginBottom: 4 }}>{tier.price}</div>
            <div style={{ fontSize: 11.5, color: i === 0 ? "rgba(255,255,255,0.55)" : SMUTED, marginBottom: 22 }}>{t.couplesTreatmentLabel}</div>
            <button onClick={onWhatsApp} style={{
              width: "100%", padding: "13px", borderRadius: 12, border: "none", cursor: "pointer",
              fontFamily: "inherit", fontSize: 14, fontWeight: 700,
              background: i === 0 ? "rgba(255,255,255,0.2)" : ROSE, color: "#fff",
            }}>
              {t.bookWhatsApp}
            </button>
          </div>
        ))}
      </div>
    </DContainer>
  );
}

// ─── TemplatePetalPage ────────────────────────────────────────────────────────

export function TemplatePetalPage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const tokens: TemplateTokens = {
    bg: PEACH, ink: INK, muted: MUTED, superMuted: SMUTED, border: BORDER, brand: ROSE, serif: SERIF,
  };

  const nights     = pkg.nights ? Number(pkg.nights) : null;
  const coverImage = pkg.coverImage || "";
  const title      = pkg.title || pkg.destination;
  const isRtl      = lang === "ar";
  const itinerary  = getItineraryDays(pkg).filter(it => it.title?.trim());
  const includes   = (pkg.includes?.length ? pkg.includes : (pkg.advantages || [])).slice(0, 8);
  const isDesktop  = useIsDesktop();

  const navLinks = [
    ...(itinerary.length ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...(includes.length ? [{ label: t.navIncluded, href: "#included" }] : []),
    ...((pkg.pricingTiers || []).some(t2 => t2.price) ? [{ label: t.navPricing, href: "#pricing" }] : []),
  ];

  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: PEACH, color: INK, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={ROSE} navLinks={navLinks} lang={lang} onWhatsApp={onWhatsApp} />

        {/* Asymmetric hero: arched image left, serif copy right */}
        <DContainer style={{ padding: "80px 80px 64px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 72, alignItems: "center" }}>
            <div style={{ position: "relative", height: 560, borderRadius: "260px 260px 14px 14px", overflow: "hidden", background: INK }}>
              {coverImage
                ? <img src={coverImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${ROSE}cc, ${CLAY}88)` }} />
              }
            </div>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: ROSE, fontStyle: "italic", fontFamily: SERIF }}>
                <span style={{ width: 32, height: 1, background: ROSE }} />
                {t.petalJourneyTagline} · {pkg.destination}
              </div>
              <h1 style={{ fontFamily: SERIF, fontSize: 64, lineHeight: 1.02, fontWeight: 400, fontStyle: "italic", letterSpacing: "-1px", marginTop: 20, marginBottom: 22, color: INK }}>
                {title}
              </h1>
              <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.72, margin: "0 0 28px" }}>{pkg.description}</p>
              <div style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 400, color: ROSE, letterSpacing: "-0.8px", marginBottom: 5, lineHeight: 1 }}>{pkg.price}</div>
              <div style={{ fontSize: 12, color: SMUTED, marginBottom: 24 }}>{nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.petalForTwoAllIn}</div>
              <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />
            </div>
          </div>
        </DContainer>

        {/* Inclusions — 2-col list */}
        {includes.length > 0 && (
          <DContainer id="included" style={{ padding: "0 80px 64px" }}>
            <div style={{ fontFamily: SERIF, fontSize: 11, fontStyle: "italic", color: ROSE, marginBottom: 8 }}>{t.petalWhatsPlanned}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {includes.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "14px 16px", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, alignItems: "flex-start" }}>
                  <span style={{ color: ROSE, fontSize: 14, flexShrink: 0, marginTop: 1 }}>♡</span>
                  <span style={{ fontSize: 13.5, color: INK, lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>
          </DContainer>
        )}

        {/* Room treatments */}
        <RoomTreatmentsDesktop pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />

        <DynamicSectionsDesktop pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
        <ReviewsSectionDesktop pkg={pkg} tokens={tokens} lang={lang} agency={agency} />
        <SharedCTABannerDesktop pkg={pkg} agency={agency} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} onMessenger={onMessenger} />
        <DesktopFooter agency={agency} brand={ROSE} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: PEACH, color: INK, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
      <AgencyBar agency={agency} price={pkg.price} brand={ROSE} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} />

      {/* Arched hero */}
      <div style={{ padding: "0 18px" }}>
        <div style={{ position: "relative", height: 440, borderRadius: "200px 200px 16px 16px", overflow: "hidden", background: INK }}>
          {coverImage
            ? <img src={coverImage} alt={pkg.destination} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${ROSE}cc, ${CLAY}88)` }} />
          }
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0.48))" }} />
          <div style={{ position: "absolute", bottom: 20, left: 20, right: 20, textAlign: "center" as const }}>
            <div style={{ fontFamily: SERIF, fontSize: 12, fontStyle: "italic", color: "rgba(255,255,255,0.85)" }}>
              {t.petalJourneyTagline}
            </div>
          </div>
        </div>
      </div>

      {/* Price + title card */}
      <div style={{ padding: "0 18px" }}>
        <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 6px 32px rgba(26,13,13,0.10)", padding: "22px 22px 20px", marginTop: -28, position: "relative", zIndex: 2 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 400, fontStyle: "italic", color: INK, lineHeight: 1.12, letterSpacing: "-0.4px", margin: "0 0 10px" }}>
            {title}
          </h1>
          <div style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 400, color: ROSE, lineHeight: 1, letterSpacing: "-0.8px", marginBottom: 5 }}>{pkg.price}</div>
          <div style={{ fontSize: 12, color: SMUTED, marginBottom: 18 }}>{nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.petalForTwoAllIn}</div>
          <WAButton label={t.bookWhatsApp} full onClick={onWhatsApp} />
        </div>
      </div>

      {/* Description */}
      {pkg.description && (
        <div style={{ padding: "20px 18px 0" }}>
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.75, margin: 0, direction: isRtl ? "rtl" : "ltr" }}>{pkg.description}</p>
        </div>
      )}

      {/* Inclusions — heart-marked */}
      {includes.length > 0 && (
        <div id="included" style={{ padding: "22px 18px 0", scrollMarginTop: 88 }}>
          <div style={{ fontFamily: SERIF, fontSize: 11, fontStyle: "italic", color: ROSE, marginBottom: 10 }}>{t.petalWhatsPlanned}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {includes.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: ROSE, fontSize: 14, flexShrink: 0, marginTop: 1 }}>♡</span>
                <span style={{ fontSize: 13.5, color: INK, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Room treatments */}
      <RoomTreatments pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />

      {/* Itinerary */}
      <SharedItinerary pkg={pkg} tokens={tokens} lang={lang} />

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

// ─── TemplatePetalCard ────────────────────────────────────────────────────────

export function TemplatePetalCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
