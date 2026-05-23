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
} from "./shared";
import type { TPageProps, TCardProps, TemplateTokens } from "./types";

const SAGE   = "#1a5d4a";
const BONE   = "#f7f4ed";
const INK    = "#0d1b2e";
const MUTED  = "rgba(13,27,46,0.55)";
const SMUTED = "rgba(13,27,46,0.35)";
const BORDER = "rgba(13,27,46,0.08)";
const SERIF  = "var(--font-cormorant, serif)";

// ─── MutawifBand ─────────────────────────────────────────────────────────────

function MutawifBand({ pkg, tokens, lang, onWhatsApp }: { pkg: TPageProps["pkg"]; tokens: TemplateTokens; lang: TPageProps["lang"]; onWhatsApp: () => void }) {
  const t = T[lang];
  const agent = pkg.agent;
  if (!agent) return null;
  const isRtl = lang === "ar";
  return (
    <div style={{
      margin: "0 18px",
      background: `${SAGE}0c`, border: `1px solid ${SAGE}30`,
      borderRadius: 16, padding: "20px 20px",
      display: "flex", gap: 16, alignItems: "center",
      direction: isRtl ? "rtl" : "ltr",
    }}>
      {agent.avatar
        ? <img src={agent.avatar} alt={agent.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        : (
          <div style={{
            width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
            background: `${SAGE}18`, border: `1px solid ${SAGE}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: SERIF, fontSize: 24, color: SAGE,
          }}>
            {agent.name[0]}
          </div>
        )
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: SAGE, marginBottom: 4 }}>
          {t.mutawifLabel}
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: INK, lineHeight: 1.1, marginBottom: 3 }}>{agent.name}</div>
        <div style={{ fontSize: 12, color: MUTED }}>
          {agent.role}
          {agent.years ? ` · ${agent.years} ${t.yearsExpSuffix}` : ""}
        </div>
      </div>
      <WAButton label={t.whatsAppTheOffice} size="sm" onClick={onWhatsApp} />
    </div>
  );
}

function MutawifBandDesktop({ pkg, tokens, lang, onWhatsApp }: { pkg: TPageProps["pkg"]; tokens: TemplateTokens; lang: TPageProps["lang"]; onWhatsApp: () => void }) {
  const t = T[lang];
  const agent = pkg.agent;
  if (!agent) return null;
  return (
    <DContainer style={{ padding: "0 80px 64px" }}>
      <div style={{
        background: `${SAGE}0a`, border: `1px solid ${SAGE}25`,
        borderRadius: 18, padding: "28px 32px",
        display: "flex", gap: 24, alignItems: "center",
      }}>
        {agent.avatar
          ? <img src={agent.avatar} alt={agent.name} style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          : (
            <div style={{ width: 68, height: 68, borderRadius: "50%", flexShrink: 0, background: `${SAGE}18`, border: `1px solid ${SAGE}40`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 28, color: SAGE }}>
              {agent.name[0]}
            </div>
          )
        }
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: SAGE, marginBottom: 6 }}>{t.mutawifLabel}</div>
          <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, color: INK, lineHeight: 1.1, marginBottom: 4 }}>{agent.name}</div>
          <div style={{ fontSize: 13, color: MUTED }}>{agent.role}{agent.years ? ` · ${agent.years} ${t.yearsExpSuffix}` : ""}</div>
        </div>
        <WAButton label={t.whatsAppTheOffice} size="lg" onClick={onWhatsApp} />
      </div>
    </DContainer>
  );
}

// ─── Logistical facts strip ───────────────────────────────────────────────────

function LogisticsStrip({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const nights   = pkg.nights ? Number(pkg.nights) : null;
  const airports = (pkg.airports || []).filter(a => a.name?.trim());
  const items = [
    { l: t.fieldDestination,  v: pkg.destination },
    ...(nights ? [{ l: t.logisticsDuration, v: `${nights} ${t.nightsLabel}` }] : []),
    ...(airports[0] ? [{ l: t.logisticsFlight, v: airports[0].name }] : []),
    ...(pkg.hotelDescription ? [{ l: t.logisticsHotel, v: pkg.hotelDescription.slice(0, 28) + "…" }] : []),
  ].slice(0, 4);
  if (!items.length) return null;
  return (
    <div style={{ padding: "18px 18px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {items.map((it, i) => (
        <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 14px" }}>
          <div style={{ fontSize: 9.5, color: SMUTED, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 5 }}>{it.l}</div>
          <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: INK, lineHeight: 1.2 }}>{it.v}</div>
        </div>
      ))}
    </div>
  );
}

// ─── TemplateSakinaPage ───────────────────────────────────────────────────────

export function TemplateSakinaPage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const tokens: TemplateTokens = {
    bg: BONE, ink: INK, muted: MUTED, superMuted: SMUTED, border: BORDER, brand: SAGE, serif: SERIF,
  };

  const nights     = pkg.nights ? Number(pkg.nights) : null;
  const coverImage = pkg.coverImage || "";
  const title      = pkg.title || pkg.destination;
  const isRtl      = lang === "ar";
  const itinerary  = (pkg.itinerary || []).filter(it => it.title?.trim());
  const airports   = (pkg.airports || []).filter(a => a.name?.trim());
  const isDesktop  = useIsDesktop();

  const logisticsItems = [
    { l: t.fieldDestination, v: pkg.destination },
    ...(nights ? [{ l: t.logisticsDuration, v: `${nights} ${t.nightsLabel}` }] : []),
    ...(airports[0] ? [{ l: t.logisticsFlight, v: airports[0].name }] : []),
    ...(pkg.hotelDescription ? [{ l: t.logisticsHotel, v: pkg.hotelDescription.slice(0, 30) + "…" }] : []),
    { l: t.visaSupport, v: t.includedLabel },
  ].slice(0, 5);

  const navLinks = [
    ...(itinerary.length ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...((pkg.includes?.length || (pkg.advantages || []).length) ? [{ label: t.navIncluded, href: "#included" }] : []),
    ...((pkg.pricingTiers || []).some(t2 => t2.price) ? [{ label: t.navPricing, href: "#pricing" }] : []),
  ];

  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: BONE, color: INK, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={SAGE} navLinks={navLinks} lang={lang} onWhatsApp={onWhatsApp} />

        {/* Arched-image hero: arch left, text right */}
        <DContainer style={{ padding: "64px 80px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 64, alignItems: "center" }}>
            <div style={{ position: "relative", height: 540, borderRadius: "220px 220px 16px 16px", overflow: "hidden", background: INK }}>
              {coverImage
                ? <img src={coverImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${SAGE}cc, ${SAGE}55)` }} />
              }
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.32))" }} />
            </div>
            <div>
              <Eyebrow text={t.spiritualJourney} brand={SAGE} />
              <h1 style={{ fontFamily: SERIF, fontSize: 60, fontWeight: 600, lineHeight: 1.02, letterSpacing: "-0.8px", marginTop: 18, marginBottom: 20, color: INK }}>
                {title}
              </h1>
              <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.72, margin: "0 0 28px" }}>{pkg.description}</p>
              <div style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 400, color: SAGE, letterSpacing: "-0.8px", marginBottom: 6, lineHeight: 1 }}>{pkg.price}</div>
              <div style={{ fontSize: 12, color: SMUTED, marginBottom: 24 }}>{nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.perPerson}</div>
              <WAButton label={t.whatsAppTheOffice} size="lg" onClick={onWhatsApp} />
            </div>
          </div>
        </DContainer>

        {/* Logistics 5-col */}
        {logisticsItems.length > 0 && (
          <DContainer style={{ padding: "0 80px 48px" }}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${logisticsItems.length}, 1fr)`, gap: 12 }}>
              {logisticsItems.map((it, i) => (
                <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 16px" }}>
                  <div style={{ fontSize: 10, color: SMUTED, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 6 }}>{it.l}</div>
                  <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, lineHeight: 1.2, color: INK }}>{it.v}</div>
                </div>
              ))}
            </div>
          </DContainer>
        )}

        {/* Mutawif band */}
        <MutawifBandDesktop pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />

        <DynamicSectionsDesktop pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
        <ReviewsSectionDesktop pkg={pkg} tokens={tokens} lang={lang} agency={agency} />
        <SharedCTABannerDesktop pkg={pkg} agency={agency} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} onMessenger={onMessenger} />
        <DesktopFooter agency={agency} brand={SAGE} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BONE, color: INK, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
      <AgencyBar agency={agency} price={pkg.price} brand={SAGE} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} />

      {/* Arched hero */}
      <div style={{ padding: "0 18px" }}>
        <div style={{ position: "relative", height: 420, borderRadius: "200px 200px 16px 16px", overflow: "hidden", background: INK }}>
          {coverImage
            ? <img src={coverImage} alt={pkg.destination} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${SAGE}cc, ${SAGE}55)` }} />
          }
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.55))" }} />
          <div style={{ position: "absolute", bottom: 20, left: 20, right: 20, textAlign: "center" as const }}>
            <Eyebrow text={t.spiritualJourney} brand={SAGE} light />
          </div>
        </div>
      </div>

      {/* Title + price card */}
      <div style={{ padding: "0 18px" }}>
        <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 6px 32px rgba(13,27,46,0.10)", padding: "22px 22px 20px", marginTop: -28, position: "relative", zIndex: 2 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 600, color: INK, lineHeight: 1.12, letterSpacing: "-0.4px", margin: "0 0 10px" }}>
            {title}
          </h1>
          <div style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 400, color: SAGE, lineHeight: 1, letterSpacing: "-0.8px", marginBottom: 5 }}>{pkg.price}</div>
          <div style={{ fontSize: 12, color: SMUTED, marginBottom: 18 }}>{nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.perPerson}</div>
          <WAButton label={t.whatsAppTheOffice} full onClick={onWhatsApp} />
        </div>
      </div>

      {/* Logistics facts */}
      <LogisticsStrip pkg={pkg} lang={lang} />

      {/* Description */}
      {pkg.description && (
        <div style={{ padding: "18px 18px 0" }}>
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.75, margin: 0, direction: isRtl ? "rtl" : "ltr" }}>{pkg.description}</p>
        </div>
      )}

      {/* Mutawif band */}
      <div style={{ marginTop: 20 }}>
        <MutawifBand pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
      </div>

      {/* Departure group dates */}
      {airports.length > 0 && (
        <section id="departures" style={{ padding: "22px 18px 0", scrollMarginTop: 88 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, color: SAGE, marginBottom: 12 }}>
            {t.groupDepartures}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {airports.map((a, i) => (
              <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: INK }}>{a.name}{a.arrivingAirport ? ` → ${a.arrivingAirport}` : ""}</div>
                  {a.date && <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{a.date}</div>}
                </div>
                <div style={{ fontFamily: SERIF, fontSize: 20, color: SAGE, fontWeight: 400 }}>{a.price}</div>
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
      <StickyCTA price={pkg.price} nights={nights} label={t.whatsAppTheOffice} onWhatsApp={onWhatsApp} lang={lang} />
    </div>
  );
}

// ─── TemplateSakinaCard ───────────────────────────────────────────────────────

export function TemplateSakinaCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
