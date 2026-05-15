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

// ─── TemplateSmartPage ───────────────────────────────────────────────────────

export function TemplateSmartPage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const brand = "#1f5f8e";
  const serif = "var(--font-dm-sans, sans-serif)";
  const tokens: TemplateTokens = {
    bg: "#fdfcf9",
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

  // Breakdown rows from pricingTiers or a single total row
  type BreakdownRow = { l: string; v: string };
  const breakdownRows: BreakdownRow[] = (pkg.pricingTiers || []).filter(tier => tier.price).length > 0
    ? (pkg.pricingTiers || []).filter(tier => tier.price).map(tier => ({ l: tier.label, v: tier.price }))
    : [{ l: t.perPerson, v: pkg.price }];

  const isDesktop = useIsDesktop();

  const navLinks = [
    ...((pkg.itinerary || []).some(it => it.title?.trim()) ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...((pkg.includes?.length || (pkg.advantages || []).length || pkg.excludes?.length) ? [{ label: t.navIncluded, href: "#included" }] : []),
    ...((pkg.pricingTiers || []).some(tier => tier.price) ? [{ label: t.navPricing, href: "#pricing" }] : []),
  ];

  const breakdown = breakdownRows.map(r => ({ l: r.l, v: r.v }));

  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: tokens.bg, color: tokens.ink, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={brand} navLinks={navLinks} lang={lang} onWhatsApp={onWhatsApp} />

        {/* Split hero: image left 1.2, text right */}
        <DContainer style={{ padding: "56px 80px 48px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 48, alignItems: "center" }}>
            <div style={{ position: "relative", height: 440, borderRadius: 14, overflow: "hidden" }}>
              {coverImage
                ? <img src={coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${brand}cc, ${brand}55)` }} />
              }
            </div>
            <div>
              <Eyebrow text={pkg.destination} brand={brand} />
              <h1 style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-1.2px", marginTop: 16, marginBottom: 18 }}>{title}</h1>
              <p style={{ fontSize: 16, color: tokens.muted, lineHeight: 1.65, margin: 0 }}>{pkg.description}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 28 }}>
                <div style={{ fontSize: 56, fontWeight: 800, color: brand, letterSpacing: "-1.5px", lineHeight: 1 }}>{pkg.price}</div>
                <div style={{ fontSize: 14, color: tokens.superMuted }}>{t.perPerson} · all-in</div>
              </div>
              <div style={{ marginTop: 24 }}>
                <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />
              </div>
            </div>
          </div>
        </DContainer>

        {/* Breakdown */}
        {breakdown.length > 0 && (
          <DContainer style={{ padding: "32px 80px 64px" }}>
            <Eyebrow text={`What's in ${pkg.price}`} brand={brand} />
            <h3 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.4px", margin: "8px 0 16px" }}>The honest breakdown.</h3>
            <div style={{ background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 12, overflow: "hidden", maxWidth: 560 }}>
              {breakdown.map((b, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "14px 18px", borderTop: i === 0 ? "none" : `1px solid ${tokens.border}` }}>
                  <div style={{ fontSize: 14, color: tokens.ink }}>{b.l}</div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{b.v}</div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "16px 18px", background: `${brand}0d`, borderTop: `1px solid ${tokens.border}` }}>
                <div style={{ fontSize: 14, fontWeight: 800 }}>Total per person</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: brand }}>{pkg.price}</div>
              </div>
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
    <div style={{
      minHeight: "100vh", background: tokens.bg, color: tokens.ink,
      fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr",
    }}>
      <AgencyBar agency={agency} price={pkg.price} brand={brand} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} />

      {/* ── Hero ── */}
      <div style={{ position: "relative", height: 230, overflow: "hidden" }}>
        {coverImage ? (
          <img src={coverImage} alt={pkg.destination} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${brand}cc, ${brand}44)` }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5))" }} />
      </div>

      {/* ── Title + description ── */}
      <div style={{ padding: "22px 18px 0" }}>
        <Eyebrow text={pkg.destination} brand={brand} />
        <h1 style={{ fontSize: 26, fontWeight: 800, color: tokens.ink, margin: "10px 0 12px", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
          {title}
        </h1>
        {pkg.description && (
          <p style={{ fontSize: 14, color: tokens.muted, lineHeight: 1.7, margin: 0 }}>{pkg.description}</p>
        )}
      </div>

      {/* ── "What's in the price" breakdown ── */}
      <div style={{ padding: "22px 18px 0" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: tokens.superMuted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>
          What&apos;s in the price
        </div>
        <div style={{ background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 14, overflow: "hidden" }}>
          {breakdownRows.map((row, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "13px 16px", borderBottom: i < breakdownRows.length - 1 ? `1px solid ${tokens.border}` : "none",
            }}>
              <span style={{ fontSize: 13, color: tokens.muted }}>{row.l}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: tokens.ink }}>{row.v}</span>
            </div>
          ))}
          {/* Total footer row */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px", background: `${brand}0d`,
            borderTop: `1px solid ${brand}20`,
          }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: tokens.ink }}>{t.perPerson} total</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: brand }}>{pkg.price}</span>
          </div>
        </div>
      </div>


      {/* ── Book CTA inline ── */}
      <div style={{ padding: "22px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: tokens.superMuted, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 3 }}>{t.from}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: brand, letterSpacing: "-0.5px", lineHeight: 1 }}>{pkg.price}</div>
            <div style={{ fontSize: 11, color: tokens.superMuted, marginTop: 3 }}>
              {nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.perPerson}
            </div>
          </div>
          <WAButton label={t.bookWhatsApp} size="md" onClick={onWhatsApp} />
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

      <StickyCTA price={pkg.price} nights={nights} label={t.bookWhatsApp} onWhatsApp={onWhatsApp} lang={lang} />
    </div>
  );
}

// ─── TemplateSmartCard ───────────────────────────────────────────────────────

export function TemplateSmartCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete} onToggleActive={onToggleActive}
      headingFont="var(--font-dm-sans, sans-serif)"
      imageBorderRadius={0}
    />
  );
}
