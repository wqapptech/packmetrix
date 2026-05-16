"use client";

import React from "react";
import { T } from "@/lib/translations";
import {
  WAButton,
  Eyebrow,
  AgencyBar,
  StickyCTA,
  SharedItinerary,
  SharedIncludes,
  SharedPricing,
  SharedGallery,
  SharedHotel,
  SharedAirports,
  SharedCTABanner,
  SharedFooter,
  BaseCard,
  useIsDesktop,
  DesktopNav,
  DContainer,
  DesktopFooter,
  SharedItineraryDesktop,
  SharedIncludesDesktop,
  SharedHotelDesktop,
  SharedPricingDesktop,
  SharedAirportsDesktop,
  SharedGalleryDesktop,
  SharedCTABannerDesktop,
  ReviewsSection,
  ReviewsSectionDesktop,
} from "./shared";
import type { TPageProps, TCardProps, TemplateTokens } from "./types";

// ─── TemplateVoyagePage ──────────────────────────────────────────────────────

export function TemplateVoyagePage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const brand = "#e94e77";
  const serif = "var(--font-dm-sans, sans-serif)";
  const tokens: TemplateTokens = {
    bg: "#0d1b2e",
    ink: "#ffffff",
    muted: "rgba(255,255,255,0.7)",
    superMuted: "rgba(255,255,255,0.45)",
    border: "rgba(255,255,255,0.08)",
    brand,
    serif,
    dark: true,
  };

  const nights = pkg.nights ? Number(pkg.nights) : null;
  const coverImage = pkg.coverImage || "";
  const title = pkg.title || pkg.destination;
  const isRtl = lang === "ar";
  const langLabel = lang === "ar" ? "Arabic" : "English";
  const itinerary = (pkg.itinerary || []).filter(it => it.title?.trim());
  const isDesktop = useIsDesktop();

  const navLinks = [
    ...((pkg.itinerary || []).some(it => it.title?.trim()) ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...((pkg.includes?.length || (pkg.advantages || []).length || pkg.excludes?.length) ? [{ label: t.navIncluded, href: "#included" }] : []),
    ...((pkg.pricingTiers || []).some(tier => tier.price) ? [{ label: t.navPricing, href: "#pricing" }] : []),
  ];

  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: tokens.bg, color: "#fff", fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={brand} navLinks={navLinks} lang={lang} dark onWhatsApp={onWhatsApp} />

        {/* Hero: big numbers left, image right */}
        <DContainer style={{ padding: "32px 56px 56px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "stretch", minHeight: 480 }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              {nights && (
                <div style={{ fontSize: 120, fontWeight: 900, lineHeight: 0.85, letterSpacing: "-4px", color: "#fff" }}>
                  {nights}<span style={{ fontSize: 48, opacity: 0.7 }}> days</span>
                </div>
              )}
              <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 0.95, letterSpacing: "-3px", color: "#fff" }}>
                {pkg.destination?.split(",")[0]}
              </div>
              <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 0.95, letterSpacing: "-3px", color: brand }}>awaits.</div>
              <p style={{ fontSize: 16, color: "rgba(255,255,255,0.65)", marginTop: 28, lineHeight: 1.55, maxWidth: 420 }}>{pkg.description}</p>
              <div style={{ marginTop: 28 }}>
                <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />
              </div>
            </div>
            <div style={{ position: "relative", borderRadius: 28, overflow: "hidden" }}>
              {coverImage
                ? <img src={coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${brand}cc, ${brand}55)` }} />
              }
            </div>
          </div>
        </DContainer>

        {/* Stats: price + duration (only builder-backed values) */}
        <DContainer style={{ padding: "0 56px 56px" }}>
          <div style={{ display: "grid", gridTemplateColumns: nights ? "1fr 1fr" : "1fr", gap: 14 }}>
            {[
              { v: pkg.price, l: "All-in price", c: brand },
              ...(nights ? [{ v: `${nights}d`, l: "Duration", c: "#2dd4a0" }] : []),
            ].map((s, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "24px 22px" }}>
                <div style={{ fontSize: 36, fontWeight: 900, color: s.c, letterSpacing: "-1px", lineHeight: 1 }}>{s.v}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 10, textTransform: "uppercase", letterSpacing: "0.6px" }}>{s.l}</div>
              </div>
            ))}
          </div>
        </DContainer>

        {/* Itinerary 4-col */}
        {itinerary.length > 0 && (
          <DContainer style={{ padding: "32px 56px 56px" }}>
            <Eyebrow text={t.dayByDay} brand={brand} light />
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.8px", marginTop: 10, marginBottom: 24, color: "#fff" }}>{t.yourJourney}</h2>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(itinerary.length, 4)}, 1fr)`, gap: 12 }}>
              {itinerary.slice(0, 4).map((it, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: 18 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: brand, letterSpacing: "0.5px" }}>Day {it.day}</div>
                  <div style={{ fontSize: 14, color: "#fff", marginTop: 8, lineHeight: 1.4 }}>{it.title}</div>
                </div>
              ))}
            </div>
          </DContainer>
        )}

        <SharedItineraryDesktop pkg={pkg} tokens={tokens} lang={lang} />
        <SharedIncludesDesktop pkg={pkg} tokens={tokens} lang={lang} />
        <SharedHotelDesktop pkg={pkg} tokens={tokens} lang={lang} />
        <SharedPricingDesktop pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
        <SharedAirportsDesktop pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
        <SharedGalleryDesktop pkg={pkg} tokens={tokens} lang={lang} />
        <ReviewsSectionDesktop pkg={pkg} tokens={tokens} lang={lang} agency={agency} />
        <SharedCTABannerDesktop pkg={pkg} agency={agency} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} onMessenger={onMessenger} />

        <DesktopFooter agency={agency} brand={brand} dark />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: tokens.bg, color: tokens.ink,
      fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr",
    }}>
      <AgencyBar agency={agency} price={pkg.price} brand={brand} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} dark />


      {/* ── Hero ── */}
      <div style={{ padding: "0 18px" }}>
        <div style={{ position: "relative", height: 380, borderRadius: 22, overflow: "hidden" }}>
          {coverImage ? (
            <img src={coverImage} alt={pkg.destination} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          ) : (
            <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${brand}88, #0d1b2e)` }} />
          )}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.75) 100%)" }} />

          {/* Oversized nights + destination at bottom */}
          <div style={{ position: "absolute", bottom: 20, left: 20, right: 20 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
              <span style={{ fontSize: 56, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-2px" }}>
                {nights ?? "—"}
              </span>
              <span style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "-0.5px" }}>
                {t.nightsLabel}
              </span>
            </div>
            <div style={{ fontSize: 32, fontWeight: 900, color: "#fff", lineHeight: 1.1, letterSpacing: "-1px", marginBottom: 4 }}>
              {pkg.destination}
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.65)", lineHeight: 1.5, maxWidth: 260 }}>
              {pkg.description}
            </div>
          </div>
        </div>
      </div>

      {/* ── Vibe grid — 2×2 stat cards ── */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {/* Card 1: Destination */}
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 14px" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: brand, lineHeight: 1.2, marginBottom: 5, wordBreak: "break-word" }}>{pkg.destination}</div>
            <div style={{ fontSize: 10, color: tokens.superMuted, textTransform: "uppercase", letterSpacing: "0.6px" }}>Destination</div>
          </div>
          {/* Card 2: Price */}
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 14px" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#f5a623", lineHeight: 1.2, marginBottom: 5 }}>{pkg.price}</div>
            <div style={{ fontSize: 10, color: tokens.superMuted, textTransform: "uppercase", letterSpacing: "0.6px" }}>All-in</div>
          </div>
          {/* Card 3: Nights */}
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 14px" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#2dd4a0", lineHeight: 1.2, marginBottom: 5 }}>
              {nights ? `${nights} ${t.nightsLabel}` : `— ${t.nightsLabel}`}
            </div>
            <div style={{ fontSize: 10, color: tokens.superMuted, textTransform: "uppercase", letterSpacing: "0.6px" }}>{t.nightsLabel}</div>
          </div>
          {/* Card 4: Language */}
          <div style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 14px" }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#7c3aed", lineHeight: 1.2, marginBottom: 5 }}>{langLabel}</div>
            <div style={{ fontSize: 10, color: tokens.superMuted, textTransform: "uppercase", letterSpacing: "0.6px" }}>Language</div>
          </div>
        </div>
      </div>

      <SharedItinerary pkg={pkg} tokens={tokens} lang={lang} />
      <SharedIncludes pkg={pkg} tokens={tokens} lang={lang} />
      <SharedPricing pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
      <SharedGallery pkg={pkg} tokens={tokens} lang={lang} />
      <SharedHotel pkg={pkg} tokens={tokens} lang={lang} />
      <SharedAirports pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
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

export function TemplateVoyageCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete} onToggleActive={onToggleActive}
      headingFont="var(--font-dm-sans, sans-serif)"
      imageBorderRadius={22}
      cardBg="rgba(13,27,46,0.8)"
    />
  );
}
