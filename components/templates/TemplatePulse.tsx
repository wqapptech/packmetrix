"use client";

import React from "react";
import { T } from "@/lib/translations";
import {
  WAButton,
  Eyebrow,
  AgencyBar,
  StickyCTA,
  SharedItinerary,
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
  SharedIncludesDesktop,
  SharedItineraryDesktop,
  SharedHotelDesktop,
  SharedPricingDesktop,
  SharedAirportsDesktop,
  SharedGalleryDesktop,
  SharedCTABannerDesktop,
  ReviewsSection,
  ReviewsSectionDesktop,
} from "./shared";
import type { TPageProps, TCardProps, TemplateTokens } from "./types";

// ─── TemplatePulsePage ──────────────────────────────────────────────────────

export function TemplatePulsePage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const brand = "#d63a3a";
  const sans = "var(--font-dm-sans, sans-serif)";
  const tokens: TemplateTokens = {
    bg: "#fafaf7",
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

  // Includes grid
  const includeItems = pkg.includes?.length ? pkg.includes : (pkg.advantages || []);

  const includesItems = pkg.includes?.length ? pkg.includes : (pkg.advantages || []);

  const isDesktop = useIsDesktop();

  const navLinks = [
    ...((pkg.itinerary || []).some(it => it.title?.trim()) ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...((pkg.includes?.length || (pkg.advantages || []).length || pkg.excludes?.length) ? [{ label: t.navIncluded, href: "#included" }] : []),
    ...((pkg.pricingTiers || []).some(tier => tier.price) ? [{ label: t.navPricing, href: "#pricing" }] : []),
  ];

  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: tokens.bg, color: tokens.ink, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
        {/* Full-width urgency banner */}
        <div style={{ background: brand, color: "#fff", padding: "10px 56px", fontSize: 12.5, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 14 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#fff" }} />
          Flash deal · Limited seats at this price
        </div>

        <DesktopNav agency={agency} price={pkg.price} brand={brand} navLinks={navLinks} lang={lang} onWhatsApp={onWhatsApp} />

        {/* Split hero: image left 1.2, deal info right */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", minHeight: 540 }}>
          <div style={{ position: "relative", overflow: "hidden" }}>
            {coverImage
              ? <img src={coverImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${brand}cc, ${brand}55)` }} />
            }
          </div>
          <div style={{ padding: "72px 64px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <Eyebrow text={pkg.destination} brand={brand} />
            <h1 style={{ fontSize: 48, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-1.2px", marginTop: 14, marginBottom: 16 }}>{title}</h1>
            <p style={{ fontSize: 15.5, color: tokens.muted, lineHeight: 1.6, margin: 0 }}>{pkg.description}</p>
            <div style={{ marginTop: 24, padding: "20px 0", borderTop: `1px solid ${tokens.border}`, borderBottom: `1px solid ${tokens.border}` }}>
              <div style={{ fontSize: 54, fontWeight: 800, color: brand, letterSpacing: "-1.5px", lineHeight: 1 }}>{pkg.price}</div>
              <div style={{ fontSize: 12, color: tokens.superMuted, marginTop: 6 }}>{t.perPerson} · all taxes included</div>
            </div>
            <div style={{ marginTop: 22 }}>
              <WAButton label={t.bookWhatsApp} full size="lg" onClick={onWhatsApp} />
            </div>
          </div>
        </div>

        {/* Includes 3-col grid */}
        {includesItems.length > 0 && (
          <DContainer style={{ padding: "72px 80px 56px" }}>
            <Eyebrow text="In the package" brand={brand} />
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.6px", marginTop: 10, marginBottom: 28 }}>Everything included.</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {includesItems.slice(0, 6).map((it, i) => (
                <div key={i} style={{ background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 12, padding: 20, display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: brand, marginTop: 5, flexShrink: 0 }} />
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{it}</div>
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
      {/* CSS animation for pulse dot */}
      <style>{`@keyframes pmxPulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }`}</style>

      <AgencyBar agency={agency} price={pkg.price} brand={brand} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} />

      {/* ── Urgency banner ── */}
      <div
        style={{
          background: brand,
          padding: "10px 18px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        <span
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#fff",
            flexShrink: 0,
            display: "inline-block",
            animation: "pmxPulse 1.4s ease-in-out infinite",
          }}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "#fff",
            letterSpacing: "0.3px",
          }}
        >
          Limited availability · Book now
        </span>
      </div>

      {/* ── Hero ── */}
      <div style={{ position: "relative", height: 280, overflow: "hidden" }}>
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
              background: `linear-gradient(135deg, ${brand}55, ${brand}cc)`,
            }}
          />
        )}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.52) 100%)",
          }}
        />
        {/* "Limited offer" pill badge — top-left */}
        <div
          style={{
            position: "absolute",
            top: 14,
            left: 14,
            background: "#fff",
            color: brand,
            fontSize: 10,
            fontWeight: 800,
            letterSpacing: "0.6px",
            textTransform: "uppercase",
            borderRadius: 99,
            padding: "4px 12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
          }}
        >
          Limited offer
        </div>
        {/* Destination eyebrow bottom-left */}
        <div style={{ position: "absolute", bottom: 14, left: 16 }}>
          <Eyebrow text={pkg.destination} brand={brand} light />
        </div>
      </div>

      {/* ── Title + Description ── */}
      <div style={{ padding: "22px 18px 0" }}>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 800,
            color: tokens.ink,
            lineHeight: 1.15,
            letterSpacing: "-0.6px",
            margin: "0 0 12px",
          }}
        >
          {title}
        </h1>
        <p
          style={{
            fontSize: 14,
            color: tokens.muted,
            lineHeight: 1.72,
            margin: 0,
            direction: isRtl ? "rtl" : "ltr",
          }}
        >
          {pkg.description}
        </p>
      </div>

      {/* ── Price block ── */}
      <div style={{ padding: "22px 18px 0" }}>
        <div
          style={{
            fontSize: 34,
            fontWeight: 800,
            color: brand,
            lineHeight: 1,
            letterSpacing: "-1px",
            marginBottom: 4,
          }}
        >
          {pkg.price}
        </div>
        <div style={{ fontSize: 12, color: tokens.superMuted, fontWeight: 600 }}>
          {t.perPerson}
          {nights ? ` · ${nights} ${t.nightsLabel}` : ""}
        </div>
      </div>

      {/* ── Seats-remaining bar ── */}
      <div style={{ padding: "22px 18px 0" }}>
        <div
          style={{
            background: "#fff",
            border: `1px solid ${tokens.border}`,
            borderRadius: 14,
            padding: "18px 18px",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: tokens.ink,
              marginBottom: 12,
            }}
          >
            Limited seats available
          </div>
          <div
            style={{
              height: 7,
              background: `${brand}18`,
              borderRadius: 99,
              overflow: "hidden",
              marginBottom: 10,
            }}
          >
            <div
              style={{
                height: "100%",
                width: "40%",
                background: brand,
                borderRadius: 99,
              }}
            />
          </div>
          <div style={{ fontSize: 11.5, color: tokens.muted }}>
            Book soon to secure your spot
          </div>
        </div>
      </div>

      {/* ── Includes grid ── */}
      {includeItems.length > 0 && (
        <div style={{ padding: "22px 18px 0" }}>
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
            {t.includedLabel}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 10,
            }}
          >
            {includeItems.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  background: "#fff",
                  border: `1px solid ${tokens.border}`,
                  borderRadius: 10,
                  padding: "12px 12px",
                }}
              >
                <div
                  style={{
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: `${brand}15`,
                    border: `1px solid ${brand}40`,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginTop: 1,
                  }}
                >
                  <svg
                    width="8"
                    height="8"
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke={brand}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                </div>
                <span
                  style={{
                    fontSize: 12,
                    color: tokens.muted,
                    lineHeight: 1.45,
                    direction: isRtl ? "rtl" : "ltr",
                  }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Primary CTA ── */}
      <div style={{ padding: "24px 18px 0" }}>
        <WAButton label={t.bookWhatsApp} full size="lg" onClick={onWhatsApp} />
      </div>

      <SharedItinerary pkg={pkg} tokens={tokens} lang={lang} />
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

// ─── TemplatePulseCard ──────────────────────────────────────────────────────

export function TemplatePulseCard({
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
