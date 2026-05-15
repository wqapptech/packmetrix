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

// ─── TemplateSakinaPage ─────────────────────────────────────────────────────

export function TemplateSakinaPage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const brand = "#1a5d4a";
  const sans = "var(--font-dm-sans, sans-serif)";
  const tokens: TemplateTokens = {
    bg: "#f7f4ed",
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
  const airports = (pkg.airports || []).filter((a) => a.name?.trim());

  const logisticsItems = [
    { l: "Destination", v: pkg.destination },
    ...(nights ? [{ l: "Duration", v: `${nights} nights` }] : []),
    ...(airports[0] ? [{ l: "Flight", v: airports[0].name }] : []),
    ...(pkg.hotelDescription ? [{ l: "Hotel", v: pkg.hotelDescription.slice(0, 30) + "…" }] : []),
    { l: "Visa support", v: "Included" },
  ].slice(0, 5);

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

        {/* Hero split: arched image left, text right */}
        <DContainer style={{ padding: "64px 80px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 64, alignItems: "center" }}>
            <div style={{ position: "relative", height: 540, borderRadius: "220px 220px 16px 16px", overflow: "hidden", background: tokens.ink }}>
              {coverImage
                ? <img src={coverImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${brand}cc, ${brand}55)` }} />
              }
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.35))" }} />
            </div>
            <div>
              <Eyebrow text={pkg.destination} brand={brand} />
              <h1 style={{ fontSize: 56, fontWeight: 700, lineHeight: 1.05, letterSpacing: "-1px", marginTop: 18, marginBottom: 20 }}>{title}</h1>
              <p style={{ fontSize: 16.5, color: tokens.muted, lineHeight: 1.7, margin: 0 }}>{pkg.description}</p>
              <div style={{ marginTop: 32 }}>
                <WAButton label="WhatsApp the office" size="lg" onClick={onWhatsApp} />
              </div>
            </div>
          </div>
        </DContainer>

        {/* Logistics 5-col cards */}
        {logisticsItems.length > 0 && (
          <DContainer style={{ padding: "32px 80px 24px" }}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${logisticsItems.length}, 1fr)`, gap: 12 }}>
              {logisticsItems.map((it, i) => (
                <div key={i} style={{ background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 12, padding: "20px 18px" }}>
                  <div style={{ fontSize: 10.5, color: tokens.superMuted, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 8 }}>{it.l}</div>
                  <div style={{ fontSize: 15, fontWeight: 700, lineHeight: 1.25 }}>{it.v}</div>
                </div>
              ))}
            </div>
          </DContainer>
        )}

        {/* Departure dates grid (from airports) */}
        {airports.length > 0 && (
          <DContainer style={{ padding: "48px 80px 96px" }}>
            <Eyebrow text="Departures" brand={brand} />
            <h2 style={{ fontSize: 38, fontWeight: 700, letterSpacing: "-0.8px", marginTop: 10, marginBottom: 24 }}>Choose your date.</h2>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(airports.length, 6)}, 1fr)`, gap: 12 }}>
              {airports.slice(0, 6).map((a, i) => (
                <div key={i} style={{ border: `1px solid ${brand}`, background: "#fff", borderRadius: 12, padding: "18px 16px", cursor: "pointer" }} onClick={onWhatsApp}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, color: tokens.superMuted, letterSpacing: "0.7px" }}>{a.date?.slice(0, 3)?.toUpperCase() || "TBC"}</div>
                  <div style={{ fontSize: 11.5, color: brand, fontWeight: 700, marginTop: 6 }}>{a.arrivingAirport || a.name}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, marginTop: 4 }}>{a.price || pkg.price}</div>
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

        <DesktopFooter agency={agency} brand={brand} />
      </div>
    );
  }

  // Badge text
  const heroBadge =
    airports.length > 0
      ? `${airports.length} ${airports.length === 1 ? "Group" : "Groups"}`
      : "Curated itinerary";

  // Logistics grid rows
  type LogisticsRow = { label: string; value: string };
  const logisticsRows: LogisticsRow[] = [];

  if (pkg.hotelDescription) {
    logisticsRows.push({
      label: "Hotel",
      value: pkg.hotelDescription.slice(0, 20) + " ★★★★★",
    });
  } else {
    logisticsRows.push({ label: "Hotel", value: "Included" });
  }

  if (airports.length > 0) {
    logisticsRows.push({ label: "Flight", value: airports[0].name });
  } else {
    logisticsRows.push({ label: "Flight", value: "Included" });
  }

  logisticsRows.push({
    label: "Guide language",
    value: lang === "ar" ? "Arabic & English" : "English",
  });

  logisticsRows.push({ label: "Visa support", value: "Included" });

  if (pkg.cancellation) {
    logisticsRows.push({
      label: "Cancellation",
      value: pkg.cancellation.slice(0, 20),
    });
  } else {
    logisticsRows.push({ label: "Cancellation", value: "Flexible" });
  }

  // Departure dates from airports or static placeholders
  type DateCard = { label: string; sub: string; soldOut?: boolean; isNew?: boolean };
  const departureDates: DateCard[] =
    airports.length > 0
      ? airports.map((a) => ({
          label: a.name,
          sub: a.date || a.price,
        }))
      : [
          { label: "Dec 12", sub: "From " + pkg.price },
          { label: "Dec 26", sub: "Sold out", soldOut: true },
          { label: "Jan 9", sub: "From " + pkg.price },
          { label: "Feb 6", sub: "From " + pkg.price, isNew: true },
        ];

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
      <div style={{ padding: "20px 18px 0" }}>
        <div
          style={{
            height: 360,
            borderRadius: "160px 160px 14px 14px",
            overflow: "hidden",
            position: "relative",
          }}
        >
          {coverImage ? (
            <img
              src={coverImage}
              alt={pkg.destination}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: `linear-gradient(160deg, ${brand}55, ${brand}cc)`,
              }}
            />
          )}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.04) 50%, rgba(0,0,0,0.5) 100%)",
            }}
          />
          {/* Badge pill */}
          <div
            style={{
              position: "absolute",
              top: 20,
              left: "50%",
              transform: "translateX(-50%)",
              background: brand,
              color: "#fff",
              fontSize: 10.5,
              fontWeight: 800,
              letterSpacing: "0.5px",
              textTransform: "uppercase",
              borderRadius: 99,
              padding: "5px 16px",
              whiteSpace: "nowrap",
            }}
          >
            {heroBadge}
          </div>
        </div>
      </div>

      {/* ── Title + Description ── */}
      <div style={{ padding: "24px 18px 0" }}>
        <Eyebrow text={pkg.destination} brand={brand} />
        <h1
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: tokens.ink,
            lineHeight: 1.2,
            letterSpacing: "-0.5px",
            margin: "10px 0 10px",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 13.5,
            color: tokens.muted,
            lineHeight: 1.7,
            margin: 0,
            direction: isRtl ? "rtl" : "ltr",
          }}
        >
          {pkg.description}
        </p>
      </div>

      {/* ── Logistics grid ── */}
      <div style={{ padding: "24px 18px 0" }}>
        <div
          style={{
            background: "#fff",
            border: `1px solid ${tokens.border}`,
            borderRadius: 16,
            overflow: "hidden",
          }}
        >
          {logisticsRows.map((row, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "14px 18px",
                borderBottom:
                  i < logisticsRows.length - 1 ? `1px solid ${tokens.border}` : "none",
                gap: 12,
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: tokens.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  flexShrink: 0,
                }}
              >
                {row.label}
              </div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: tokens.ink,
                  textAlign: isRtl ? "left" : "right",
                  maxWidth: "60%",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {row.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Departure dates grid ── */}
      <div style={{ padding: "28px 18px 0" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: tokens.muted,
            marginBottom: 14,
          }}
        >
          {t.departures}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {departureDates.map((d, i) => (
            <div
              key={i}
              style={{
                background: d.soldOut ? "rgba(13,27,46,0.03)" : "#fff",
                border: `1px solid ${d.soldOut ? tokens.border : `${brand}40`}`,
                borderRadius: 12,
                padding: "16px 14px",
                position: "relative",
              }}
            >
              {d.isNew && (
                <div
                  style={{
                    position: "absolute",
                    top: 8,
                    right: 8,
                    background: brand,
                    color: "#fff",
                    fontSize: 8,
                    fontWeight: 800,
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                    borderRadius: 99,
                    padding: "2px 7px",
                  }}
                >
                  New
                </div>
              )}
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  color: d.soldOut ? tokens.superMuted : brand,
                  lineHeight: 1.1,
                  marginBottom: 4,
                  letterSpacing: "-0.3px",
                }}
              >
                {d.label}
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: d.soldOut ? tokens.superMuted : tokens.muted,
                  fontWeight: d.soldOut ? 700 : 500,
                }}
              >
                {d.sub}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Book CTA ── */}
      <div style={{ padding: "24px 18px 0" }}>
        <WAButton label={t.bookWhatsApp} full size="lg" onClick={onWhatsApp} />
      </div>

      <SharedItinerary pkg={pkg} tokens={tokens} lang={lang} />
      <SharedIncludes pkg={pkg} tokens={tokens} lang={lang} />
      <SharedPricing pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
      <SharedGallery pkg={pkg} tokens={tokens} lang={lang} />
      <ReviewsSection pkg={pkg} tokens={tokens} lang={lang} agency={agency} />
      <SharedHotel pkg={pkg} tokens={tokens} lang={lang} />
      <SharedAirports pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />

      <div style={{ padding: "28px 18px 28px" }}>
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

// ─── TemplateSakinaCard ─────────────────────────────────────────────────────

export function TemplateSakinaCard({
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
      imageBorderRadius={160}
      cardBg="#f7f4ed"
    />
  );
}
