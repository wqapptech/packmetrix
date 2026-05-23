"use client";

import React from "react";
import { T } from "@/lib/translations";
import {
  WAButton,
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

const LIME  = "#d6f43d";
const COAL  = "#0d1b2e";
const INK   = "#ffffff";
const MUTED = "rgba(255,255,255,0.65)";
const SMUTED = "rgba(255,255,255,0.4)";
const BORDER = "rgba(255,255,255,0.09)";
const ARCH  = "var(--font-archivo-black, sans-serif)";

// ─── TicketStub itinerary ────────────────────────────────────────────────────

function TicketItinerary({ itinerary, lang }: { itinerary: NonNullable<TPageProps["pkg"]["itinerary"]>; lang: TPageProps["lang"] }) {
  const t = T[lang];
  if (!itinerary.length) return null;
  return (
    <section id="itinerary" style={{ padding: "28px 18px", scrollMarginTop: 88 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.6px", textTransform: "uppercase" as const, color: LIME, marginBottom: 20 }}>
        {t.yourItinerary}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {itinerary.map((it, i) => (
          <div
            key={i}
            style={{
              background: "rgba(255,255,255,0.04)",
              border: `1px solid ${BORDER}`,
              borderRadius: 14, overflow: "hidden",
              display: "flex",
            }}
          >
            {/* Perforated side tab */}
            <div style={{
              width: 52, flexShrink: 0,
              background: `${LIME}15`,
              borderRight: `1px dashed ${LIME}40`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "16px 0", gap: 2,
            }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: LIME, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>{t.ticketStubDay}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: LIME, lineHeight: 1, fontFamily: ARCH }}>{it.day}</div>
            </div>
            {/* Content */}
            <div style={{ flex: 1, padding: "16px 16px" }}>
              {it.chapter && (
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: LIME, opacity: 0.7, marginBottom: 4 }}>
                  {it.chapter}
                </div>
              )}
              <div style={{ fontSize: 14, fontWeight: 700, color: INK, lineHeight: 1.3, marginBottom: it.desc ? 6 : 0 }}>{it.title}</div>
              {it.desc && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>{it.desc}</div>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TicketItineraryDesktop({ itinerary, lang }: { itinerary: NonNullable<TPageProps["pkg"]["itinerary"]>; lang: TPageProps["lang"] }) {
  const t = T[lang];
  if (!itinerary.length) return null;
  return (
    <DContainer id="itinerary" style={{ padding: "56px 80px 64px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: LIME, marginBottom: 28 }}>
        {t.yourItinerary}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {itinerary.map((it, i) => (
          <div
            key={i}
            style={{
              display: "flex", background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`,
              borderRadius: 14, overflow: "hidden",
            }}
          >
            <div style={{
              width: 60, flexShrink: 0,
              background: `${LIME}12`,
              borderRight: `1px dashed ${LIME}35`,
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              padding: "18px 0",
            }}>
              <div style={{ fontSize: 8, fontWeight: 700, color: LIME, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 4 }}>{t.ticketStubDay}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: LIME, lineHeight: 1, fontFamily: ARCH }}>{it.day}</div>
            </div>
            <div style={{ flex: 1, padding: "18px 18px" }}>
              {it.chapter && (
                <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: LIME, opacity: 0.7, marginBottom: 4 }}>{it.chapter}</div>
              )}
              <div style={{ fontSize: 14, fontWeight: 700, color: INK, lineHeight: 1.3, marginBottom: it.desc ? 6 : 0 }}>{it.title}</div>
              {it.desc && <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.6 }}>{it.desc}</div>}
            </div>
          </div>
        ))}
      </div>
    </DContainer>
  );
}

// ─── TemplateVoyagePage ──────────────────────────────────────────────────────

export function TemplateVoyagePage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const tokens: TemplateTokens = {
    bg: COAL, ink: INK, muted: MUTED, superMuted: SMUTED, border: BORDER, brand: LIME, serif: ARCH, dark: true,
  };

  const nights     = pkg.nights ? Number(pkg.nights) : null;
  const coverImage = pkg.coverImage || "";
  const title      = pkg.title || pkg.destination;
  const isRtl      = lang === "ar";
  const itinerary  = (pkg.itinerary || []).filter(it => it.title?.trim());
  const includes   = pkg.includes?.length ? pkg.includes : (pkg.advantages || []);
  const isDesktop  = useIsDesktop();

  const navLinks = [
    ...(itinerary.length ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...(includes.length ? [{ label: t.navIncluded, href: "#included" }] : []),
    ...((pkg.pricingTiers || []).some(t2 => t2.price) ? [{ label: t.navPricing, href: "#pricing" }] : []),
  ];

  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: COAL, color: INK, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={LIME} navLinks={navLinks} lang={lang} dark onWhatsApp={onWhatsApp} />

        {/* Hero: type-heavy left, image right */}
        <DContainer style={{ padding: "56px 80px 48px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "stretch", minHeight: 520 }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {nights && (
                <div style={{ fontFamily: ARCH, fontSize: 128, fontWeight: 400, lineHeight: 0.85, letterSpacing: "-4px", color: INK }}>
                  {nights}<span style={{ fontSize: 52, color: MUTED }}> {t.daysUnit}</span>
                </div>
              )}
              <div style={{ fontFamily: ARCH, fontSize: 80, fontWeight: 400, lineHeight: 0.92, letterSpacing: "-3px", color: INK, marginTop: nights ? 6 : 0 }}>
                {pkg.destination?.split(",")[0]}
              </div>
              <div style={{ fontFamily: ARCH, fontSize: 80, fontWeight: 400, lineHeight: 0.92, letterSpacing: "-3px", color: LIME }}>
                {t.awaitsLabel}
              </div>
              <p style={{ fontSize: 15.5, color: MUTED, marginTop: 28, lineHeight: 1.55, maxWidth: 440 }}>{pkg.description}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 28 }}>
                <div style={{ fontFamily: ARCH, fontSize: 44, color: LIME, letterSpacing: "-1px", lineHeight: 1 }}>{pkg.price}</div>
                <div style={{ fontSize: 12, color: SMUTED, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{t.perPerson}</div>
              </div>
              <div style={{ marginTop: 22 }}>
                <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />
              </div>
            </div>
            <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", minHeight: 420 }}>
              {coverImage
                ? <img src={coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${LIME}44, ${COAL})` }} />
              }
            </div>
          </div>
        </DContainer>

        {/* Includes 4-col */}
        {includes.length > 0 && (
          <DContainer id="included" style={{ padding: "24px 80px 56px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: LIME, marginBottom: 20 }}>
              {t.includedLabel}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {includes.slice(0, 8).map((item, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: LIME, fontSize: 12, marginTop: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, color: MUTED, lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>
          </DContainer>
        )}

        <TicketItineraryDesktop itinerary={itinerary} lang={lang} />

        <DynamicSectionsDesktop pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
        <ReviewsSectionDesktop pkg={pkg} tokens={tokens} lang={lang} agency={agency} />
        <SharedCTABannerDesktop pkg={pkg} agency={agency} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} onMessenger={onMessenger} />
        <DesktopFooter agency={agency} brand={LIME} dark />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COAL, color: INK, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
      <AgencyBar agency={agency} price={pkg.price} brand={LIME} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} dark />

      {/* Hero */}
      <div style={{ padding: "0 18px" }}>
        <div style={{ position: "relative", height: 400, borderRadius: 22, overflow: "hidden" }}>
          {coverImage
            ? <img src={coverImage} alt={pkg.destination} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${LIME}44, ${COAL})` }} />
          }
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 20%, rgba(0,0,0,0.78) 100%)" }} />

          {/* Oversized nights + destination */}
          <div style={{ position: "absolute", bottom: 18, left: 20, right: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 2 }}>
              {nights && (
                <>
                  <span style={{ fontFamily: ARCH, fontSize: 64, color: LIME, lineHeight: 1, letterSpacing: "-2px" }}>{nights}</span>
                  <span style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "-0.4px" }}>{t.nightsLabel}</span>
                </>
              )}
            </div>
            <div style={{ fontFamily: ARCH, fontSize: 36, color: INK, lineHeight: 1.05, letterSpacing: "-1.2px" }}>{pkg.destination}</div>
          </div>
        </div>
      </div>

      {/* Price + book */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontFamily: ARCH, fontSize: 36, color: LIME, letterSpacing: "-1px", lineHeight: 1 }}>{pkg.price}</div>
            <div style={{ fontSize: 11, color: SMUTED, marginTop: 3, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{t.perPerson}</div>
          </div>
          <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />
        </div>
        {pkg.description && (
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65, marginTop: 14, marginBottom: 0 }}>{pkg.description}</p>
        )}
      </div>

      {/* Includes strip */}
      {includes.length > 0 && (
        <div id="included" style={{ padding: "22px 18px 0", scrollMarginTop: 88 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.6px", textTransform: "uppercase" as const, color: LIME, marginBottom: 12 }}>{t.includedLabel}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {includes.slice(0, 6).map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: LIME, fontSize: 13, marginTop: 1, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ticket-stub itinerary */}
      <TicketItinerary itinerary={itinerary} lang={lang} />

      <DynamicSections pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
      <ReviewsSection pkg={pkg} tokens={tokens} lang={lang} agency={agency} />

      <div style={{ padding: "0 18px 28px" }}>
        <SharedCTABanner pkg={pkg} agency={agency} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} onMessenger={onMessenger} />
      </div>

      <SharedFooter agency={agency} tokens={tokens} />
      <StickyCTA price={pkg.price} nights={nights} label={t.bookWhatsApp} dark onWhatsApp={onWhatsApp} lang={lang} />
    </div>
  );
}

// ─── TemplateVoyageCard ──────────────────────────────────────────────────────

export function TemplateVoyageCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
