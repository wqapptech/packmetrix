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

// ─── TemplateAuroraPage ─────────────────────────────────────────────────────

export function TemplateAuroraPage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const brand = "#2a3a52";
  const serif = "var(--font-cormorant, var(--font-dm-serif), serif)";
  const tokens: TemplateTokens = {
    bg: "#f5f1ea",
    ink: "#0d1b2e",
    muted: "rgba(13,27,46,0.55)",
    superMuted: "rgba(13,27,46,0.35)",
    border: "rgba(13,27,46,0.08)",
    brand,
    serif,
  };

  const nights = pkg.nights ? Number(pkg.nights) : null;
  const coverImage = pkg.coverImage || "";
  const title = pkg.title || pkg.destination;
  const isRtl = lang === "ar";

  // Editorial highlights: first 3 from includes/advantages or itinerary
  const highlightItems: { num: string; title: string; desc: string }[] = [];
  const rawHighlights = (pkg.includes?.length ? pkg.includes : (pkg.advantages || []));
  if (rawHighlights.length > 0) {
    rawHighlights.slice(0, 3).forEach((item, i) => {
      highlightItems.push({ num: ["01", "02", "03"][i], title: item, desc: "" });
    });
  } else if (pkg.itinerary?.length) {
    pkg.itinerary.slice(0, 3).forEach((it, i) => {
      highlightItems.push({ num: ["01", "02", "03"][i], title: it.title, desc: it.desc || "" });
    });
  }

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

        {/* 50/50 hero: text left, image right */}
        <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", minHeight: 620 }}>
          {/* Text side */}
          <div style={{ padding: "84px 80px 56px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <Eyebrow text={pkg.destination} brand={brand} />
              <h1 style={{ fontFamily: serif, fontSize: 76, lineHeight: 0.98, fontWeight: 400, letterSpacing: "-2px", marginTop: 22, color: tokens.ink }}>
                {title}
              </h1>
              <p style={{ fontSize: 17, color: tokens.muted, lineHeight: 1.7, maxWidth: 460, marginTop: 26 }}>{pkg.description}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 32, marginTop: 40 }}>
                <div>
                  <div style={{ fontSize: 10.5, color: tokens.superMuted, letterSpacing: "1px", textTransform: "uppercase" }}>{t.from}</div>
                  <div style={{ fontFamily: serif, fontSize: 46, fontWeight: 400, lineHeight: 1, letterSpacing: "-1.5px", marginTop: 4 }}>{pkg.price}</div>
                  <div style={{ fontSize: 11, color: tokens.superMuted, marginTop: 4 }}>{nights ? `${nights} ${t.nightsLabel} · ${t.perPerson}` : t.perPerson}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
                <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />
              </div>
            </div>
            {nights && (
              <div style={{ display: "flex", gap: 32, paddingTop: 28, borderTop: `1px solid ${tokens.border}`, marginTop: 40 }}>
                <div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink }}>{nights} {t.nightsLabel}</div>
                  <div style={{ fontSize: 11, color: tokens.superMuted, marginTop: 3 }}>{t.perPerson}</div>
                </div>
                {pkg.cancellation && (
                  <div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: tokens.ink }}>{pkg.cancellation}</div>
                    <div style={{ fontSize: 11, color: tokens.superMuted, marginTop: 3 }}>{t.freeCancellation}</div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Image side */}
          <div style={{ position: "relative", overflow: "hidden", background: tokens.ink }}>
            {coverImage
              ? <img src={coverImage} alt={pkg.destination} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${brand}cc, ${brand}55)` }} />
            }
          </div>
        </div>

        {/* Editorial body: 1:2 grid */}
        <DContainer style={{ padding: "96px 80px 32px" }}>
          <Eyebrow text={t.editorialTheJourney} brand={brand} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 64, marginTop: 18 }}>
            <h2 style={{ fontFamily: serif, fontSize: 38, fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.8px", margin: 0 }}>
              {nights ? `${nights} ${t.editorialNightsCurated}` : t.editorialCrafted}
            </h2>
            <p style={{ fontFamily: serif, fontSize: 20, lineHeight: 1.55, color: tokens.ink, margin: 0 }}>
              {pkg.description}
            </p>
          </div>
        </DContainer>

        {/* 3-col numbered highlights */}
        {highlightItems.length > 0 && (
          <DContainer style={{ padding: "56px 80px 96px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
              {highlightItems.map((h, i) => (
                <div key={i} style={{ paddingTop: 24, borderTop: `1px solid ${tokens.border}` }}>
                  <div style={{ fontFamily: serif, fontSize: 20, color: brand, fontWeight: 500, marginBottom: 14 }}>{h.num}</div>
                  <div style={{ fontFamily: serif, fontSize: 24, fontWeight: 500, lineHeight: 1.15, marginBottom: 12 }}>{h.title}</div>
                  {h.desc && <div style={{ fontSize: 14, color: tokens.muted, lineHeight: 1.6 }}>{h.desc}</div>}
                </div>
              ))}
            </div>
          </DContainer>
        )}

        {/* Shared sections */}
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
        fontFamily: "var(--font-dm-sans, sans-serif)",
        direction: isRtl ? "rtl" : "ltr",
      }}
    >
      <AgencyBar agency={agency} price={pkg.price} brand={brand} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} />

      {/* ── Hero ── */}
      <div style={{ position: "relative", height: 520, overflow: "hidden" }}>
        {coverImage ? (
          <img
            src={coverImage}
            alt={pkg.destination}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${brand}cc, ${brand}55)` }} />
        )}
        {/* Dark gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.08) 40%, rgba(0,0,0,0.65) 100%)",
          }}
        />
        {/* Eyebrow destination — top-left */}
        <div style={{ position: "absolute", top: 22, left: 18 }}>
          <Eyebrow text={pkg.destination} brand={brand} light />
        </div>
        {/* Large italic serif title — bottom-left */}
        <div style={{ position: "absolute", bottom: 52, left: 20, right: 20 }}>
          <h1
            style={{
              fontFamily: serif,
              fontSize: 36,
              fontWeight: 400,
              fontStyle: "italic",
              color: "#fff",
              lineHeight: 1.15,
              letterSpacing: "-0.5px",
              margin: 0,
              textShadow: "0 2px 16px rgba(0,0,0,0.35)",
            }}
          >
            {title}
          </h1>
        </div>
      </div>

      {/* ── Offset price card ── */}
      <div style={{ padding: "0 18px" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 18,
            boxShadow: "0 8px 40px rgba(13,27,46,0.13)",
            padding: "24px 22px 20px",
            marginTop: -32,
            position: "relative",
            zIndex: 2,
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              color: tokens.muted,
              marginBottom: 6,
            }}
          >
            {t.from}
          </div>
          <div
            style={{
              fontFamily: serif,
              fontSize: 42,
              fontWeight: 400,
              color: brand,
              lineHeight: 1,
              letterSpacing: "-1px",
              marginBottom: 6,
            }}
          >
            {pkg.price}
          </div>
          <div style={{ fontSize: 12, color: tokens.superMuted, marginBottom: 18 }}>
            {nights ? `${nights} ${t.nightsLabel} · ` : ""}
            {t.perPerson}
          </div>
          <WAButton label={t.bookWhatsApp} full onClick={onWhatsApp} />
        </div>
      </div>

      {/* ── Editorial highlights ── */}
      {highlightItems.length > 0 && (
        <section style={{ padding: "36px 18px 12px" }}>
          <Eyebrow text={t.whatsIncluded} brand={brand} />
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 0,
              marginTop: 20,
              border: `1px solid ${tokens.border}`,
              borderRadius: 14,
              overflow: "hidden",
              background: "#fff",
            }}
          >
            {highlightItems.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  gap: 18,
                  padding: "20px 20px",
                  borderBottom:
                    i < highlightItems.length - 1 ? `1px solid ${tokens.border}` : "none",
                  alignItems: "center",
                }}
              >
                <div
                  style={{
                    fontFamily: serif,
                    fontSize: 32,
                    fontWeight: 400,
                    color: brand,
                    lineHeight: 1,
                    flexShrink: 0,
                    opacity: 0.7,
                    letterSpacing: "-1px",
                  }}
                >
                  {item.num}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: tokens.ink,
                      lineHeight: 1.3,
                      marginBottom: item.desc ? 5 : 0,
                      direction: isRtl ? "rtl" : "ltr",
                    }}
                  >
                    {item.title}
                  </div>
                  {item.desc && (
                    <div
                      style={{
                        fontSize: 12.5,
                        color: tokens.muted,
                        lineHeight: 1.55,
                        direction: isRtl ? "rtl" : "ltr",
                      }}
                    >
                      {item.desc}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <SharedItinerary pkg={pkg} tokens={tokens} lang={lang} />
      <SharedIncludes pkg={pkg} tokens={tokens} lang={lang} />
      <SharedPricing pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
      <SharedGallery pkg={pkg} tokens={tokens} lang={lang} />
      <SharedHotel pkg={pkg} tokens={tokens} lang={lang} />
      <SharedAirports pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
      <ReviewsSection pkg={pkg} tokens={tokens} lang={lang} agency={agency} />

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

// ─── TemplateAuroraCard ─────────────────────────────────────────────────────

export function TemplateAuroraCard({
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
      headingFont="var(--font-cormorant, var(--font-dm-serif), serif)"
      imageBorderRadius={0}
    />
  );
}
