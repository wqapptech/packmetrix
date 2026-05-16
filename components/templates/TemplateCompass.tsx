"use client";

import React from "react";
import { T } from "@/lib/translations";
import {
  WAButton,
  Eyebrow,
  AgencyBar,
  StickyCTA,
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

// ─── TemplateCompassPage ────────────────────────────────────────────────────

export function TemplateCompassPage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const brand = "#2d5f3f";
  const sans = "var(--font-dm-sans, sans-serif)";
  const tokens: TemplateTokens = {
    bg: "#f2f0eb",
    ink: "#0d1b2e",
    muted: "rgba(13,27,46,0.55)",
    superMuted: "rgba(13,27,46,0.35)",
    border: "rgba(13,27,46,0.08)",
    brand,
    serif: sans,
  };

  const nights = pkg.nights ? Number(pkg.nights) : null;
  const coverImage = pkg.coverImage || "";
  const title = pkg.title || pkg.destination;
  const isRtl = lang === "ar";
  const itinerary = (pkg.itinerary || []).filter((it) => it.title?.trim());

  const isDesktop = useIsDesktop();

  const navLinks = [
    ...((pkg.itinerary || []).some(it => it.title?.trim()) ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...((pkg.includes?.length || (pkg.advantages || []).length || pkg.excludes?.length) ? [{ label: t.navIncluded, href: "#included" }] : []),
    ...((pkg.pricingTiers || []).some(tier => tier.price) ? [{ label: t.navPricing, href: "#pricing" }] : []),
  ];

  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: tokens.bg, color: tokens.ink, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={brand} navLinks={navLinks} lang={lang} onWhatsApp={onWhatsApp} />

        {/* Full-bleed hero with left overlay */}
        <div style={{ position: "relative", height: 540, overflow: "hidden" }}>
          {coverImage
            ? <img src={coverImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${brand}cc, ${brand}55)` }} />
          }
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to right, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)" }} />
          <DContainer style={{ position: "absolute", inset: 0, padding: "80px 80px", display: "flex", alignItems: "center" }}>
            <div style={{ maxWidth: 560, color: "#fff" }}>
              <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.9, letterSpacing: "1.4px", textTransform: "uppercase", marginBottom: 14 }}>{pkg.destination}</div>
              <h1 style={{ fontSize: 64, fontWeight: 900, lineHeight: 0.98, letterSpacing: "-2px", margin: 0 }}>{title}</h1>
              <p style={{ fontSize: 17, opacity: 0.85, lineHeight: 1.55, marginTop: 20, maxWidth: 480 }}>{pkg.description}</p>
              <div style={{ marginTop: 28 }}>
                <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />
              </div>
            </div>
          </DContainer>
        </div>


        <SharedItineraryDesktop pkg={pkg} tokens={tokens} lang={lang} />
        <SharedIncludesDesktop pkg={pkg} tokens={tokens} lang={lang} />
        <SharedHotelDesktop pkg={pkg} tokens={tokens} lang={lang} />
        <SharedPricingDesktop pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
        <SharedAirportsDesktop pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
        <SharedGalleryDesktop pkg={pkg} tokens={tokens} lang={lang} />
        <ReviewsSectionDesktop pkg={pkg} tokens={tokens} lang={lang} agency={agency} />
        <SharedCTABannerDesktop pkg={pkg} agency={agency} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} onMessenger={onMessenger} />

        <DesktopFooter agency={agency} brand={brand} />
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: tokens.bg,
        color: tokens.ink,
        fontFamily: sans,
        direction: isRtl ? "rtl" : "ltr",
      }}
    >
      <AgencyBar agency={agency} price={pkg.price} brand={brand} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} />

      {/* ── Hero ── */}
      <div style={{ position: "relative", height: 360, overflow: "hidden" }}>
        {coverImage ? (
          <img
            src={coverImage}
            alt={pkg.destination}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${brand}cc, ${brand}55)` }} />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.38) 0%, rgba(0,0,0,0.1) 50%, rgba(0,0,0,0.55) 100%)",
          }}
        />
        {/* Destination bottom-left */}
        <div style={{ position: "absolute", bottom: 18, left: 18, right: 18 }}>
          <Eyebrow text={pkg.destination} brand={brand} light />
        </div>
      </div>

      {/* ── Title + Description ── */}
      <div style={{ padding: "20px 18px 0" }}>
        <h1
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: tokens.ink,
            lineHeight: 1.15,
            letterSpacing: "-0.7px",
            margin: "0 0 12px",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 14,
            color: tokens.muted,
            lineHeight: 1.75,
            margin: 0,
            direction: isRtl ? "rtl" : "ltr",
          }}
        >
          {pkg.description}
        </p>
      </div>

      {/* ── Days as chapters (replaces SharedItinerary) ── */}
      {itinerary.length > 0 && (
        <section style={{ padding: "28px 18px" }}>
          <Eyebrow text={t.dayByDay} brand={brand} />
          <h2
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: tokens.ink,
              margin: "10px 0 18px",
              letterSpacing: "-0.5px",
            }}
          >
            {t.yourJourney}
          </h2>
          <div style={{ display: "flex", flexDirection: "column" }}>
            {itinerary.map((it, i) => (
              <div key={i}>
                <div
                  style={{
                    display: "flex",
                    gap: 16,
                    padding: "16px 0",
                    alignItems: "flex-start",
                  }}
                >
                  <div
                    style={{
                      fontSize: 18,
                      fontWeight: 900,
                      color: brand,
                      lineHeight: 1,
                      flexShrink: 0,
                      minWidth: 28,
                    }}
                  >
                    {String(it.day).padStart(2, "0")}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                        color: tokens.ink,
                        lineHeight: 1.3,
                        marginBottom: it.desc ? 5 : 0,
                        direction: isRtl ? "rtl" : "ltr",
                      }}
                    >
                      {it.title}
                    </div>
                    {it.desc && (
                      <div
                        style={{
                          fontSize: 12.5,
                          color: tokens.muted,
                          lineHeight: 1.6,
                          direction: isRtl ? "rtl" : "ltr",
                        }}
                      >
                        {it.desc}
                      </div>
                    )}
                  </div>
                </div>
                {i < itinerary.length - 1 && (
                  <div
                    style={{
                      height: 1,
                      background: tokens.border,
                      marginLeft: 44,
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <SharedIncludes pkg={pkg} tokens={tokens} lang={lang} />
      <SharedPricing pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
      <SharedGallery pkg={pkg} tokens={tokens} lang={lang} />
      <ReviewsSection pkg={pkg} tokens={tokens} lang={lang} agency={agency} />
      <SharedHotel pkg={pkg} tokens={tokens} lang={lang} />
      <SharedAirports pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />

      <div style={{ padding: "0 18px 28px" }}>
        <SharedCTABanner
          pkg={pkg}
          agency={agency}
          tokens={tokens}
          lang={lang}
          onWhatsApp={onWhatsApp}
          onMessenger={onMessenger}
        />
      </div>

      <SharedFooter agency={agency} tokens={tokens} />

      <StickyCTA
        price={pkg.price}
        nights={nights}
        label={t.bookWhatsApp}
        onWhatsApp={onWhatsApp}
        lang={lang}
      />
    </div>
  );
}

// ─── TemplateCompassCard ────────────────────────────────────────────────────

export function TemplateCompassCard({
  pkg,
  agency,
  lang,
  onView,
  onEdit,
  onDelete,
  onToggleActive,
}: TCardProps) {
  return (
    <BaseCard
      pkg={pkg}
      agency={agency}
      lang={lang}
      onView={onView}
      onEdit={onEdit}
      onDelete={onDelete}
      onToggleActive={onToggleActive}
      headingFont="var(--font-dm-sans, sans-serif)"
      imageBorderRadius={0}
    />
  );
}
