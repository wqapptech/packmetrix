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

// ─── TemplateAtlasPage ───────────────────────────────────────────────────────

export function TemplateAtlasPage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const brand = "#2a2a2a";
  const serif = "var(--font-cormorant, var(--font-dm-serif), serif)";
  const tokens: TemplateTokens = {
    bg: "#f5f3ee",
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
  const galleryImages = [pkg.coverImage, ...(pkg.images || [])].filter(Boolean) as string[];
  const isDesktop = useIsDesktop();

  const navLinks = [
    ...((pkg.itinerary || []).some(it => it.title?.trim()) ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...((pkg.includes?.length || (pkg.advantages || []).length || pkg.excludes?.length) ? [{ label: t.navIncluded, href: "#included" }] : []),
    ...((pkg.pricingTiers || []).some(tier => tier.price) ? [{ label: t.navPricing, href: "#pricing" }] : []),
  ];

  // Current month + year for masthead
  const now = new Date();
  const monthYear = now.toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", { month: "long", year: "numeric" });

  // Photo essay images (not coverImage)
  const extraImages = (pkg.images || []).filter(Boolean);

  // Drop cap: split description into first letter + rest
  const desc = pkg.description || "";
  const firstChar = desc[0] || "";
  const restDesc = desc.slice(1);

  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: tokens.bg, color: tokens.ink, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={brand} navLinks={navLinks} lang={lang} onWhatsApp={onWhatsApp} />

        {/* Centered masthead */}
        <DContainer style={{ padding: "56px 80px 32px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 14, fontSize: 11, color: tokens.superMuted, textTransform: "uppercase", letterSpacing: "2px", fontWeight: 700 }}>
            <span>Curated</span>
            <span style={{ width: 1, height: 10, background: tokens.border }} />
            <span>{pkg.destination}</span>
          </div>
          <h1 style={{ fontFamily: serif, fontSize: 88, fontWeight: 400, lineHeight: 0.98, letterSpacing: "-2.5px", marginTop: 28, maxWidth: 900, margin: "28px auto 0" }}>
            {title}
          </h1>
          <div style={{ fontSize: 14, color: tokens.superMuted, marginTop: 24, fontStyle: "italic", fontFamily: serif }}>
            {nights ? `${nights} ${t.editorialDaysCurated}` : t.editorialCuratedJourney} · {agency.name}
          </div>
        </DContainer>

        {/* Wide hero */}
        <DContainer style={{ padding: "16px 80px 8px" }}>
          <div style={{ position: "relative", height: 540, overflow: "hidden", borderRadius: 4 }}>
            {coverImage
              ? <img src={coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
              : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${brand}cc, ${brand}55)` }} />
            }
          </div>
          <div style={{ fontSize: 11, color: tokens.superMuted, fontStyle: "italic", marginTop: 10, fontFamily: serif, textAlign: "center" }}>
            {pkg.destination} · {agency.name}
          </div>
        </DContainer>

        {/* Two-column body text */}
        <DContainer max={1080} style={{ padding: "56px 80px 32px" }}>
          <div style={{ columns: 2, columnGap: 48 }}>
            <p style={{ fontFamily: serif, fontSize: 18, lineHeight: 1.55, margin: "0 0 16px" }}>
              <span style={{ fontSize: 64, float: "left", lineHeight: 0.85, paddingRight: 8, paddingTop: 6, fontWeight: 500 }}>
                {(pkg.description || "T")[0]}
              </span>
              {(pkg.description || "").slice(1)}
            </p>
            <p style={{ fontFamily: serif, fontSize: 18, lineHeight: 1.55, margin: "0 0 16px" }}>
              A pace deliberately set for the curious traveler. Every stop hand-picked, every detail considered so you can focus on the experience.
            </p>
          </div>
        </DContainer>

        {/* Pull quote */}
        <DContainer max={780} style={{ padding: "24px 80px 24px", textAlign: "center" }}>
          <div style={{ borderTop: `1px solid ${tokens.border}`, borderBottom: `1px solid ${tokens.border}`, padding: "32px 0" }}>
            <div style={{ fontFamily: serif, fontSize: 32, fontStyle: "italic", lineHeight: 1.25, color: tokens.ink }}>
              &ldquo;What we ask of a journey is a slowness sufficient to notice.&rdquo;
            </div>
            <div style={{ fontSize: 11, color: tokens.superMuted, marginTop: 14, letterSpacing: "1.2px", textTransform: "uppercase" }}>— {agency.name}, curator</div>
          </div>
        </DContainer>

        {/* Photo essay 3-col */}
        {galleryImages.length > 1 && (
          <DContainer style={{ padding: "40px 80px 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {galleryImages.slice(0, 3).map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: "100%", aspectRatio: "3/4" as React.CSSProperties["aspectRatio"], objectFit: "cover", borderRadius: 4 }} />
              ))}
            </div>
          </DContainer>
        )}

        {/* Booking line */}
        <DContainer max={780} style={{ padding: "32px 80px" }}>
          <div style={{ borderTop: `1px solid ${tokens.border}`, paddingTop: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 10.5, color: tokens.superMuted, letterSpacing: "1.4px", textTransform: "uppercase" }}>{t.from}</div>
              <div style={{ fontFamily: serif, fontSize: 48, fontWeight: 400, marginTop: 4, letterSpacing: "-1px", lineHeight: 1 }}>{pkg.price}</div>
              <div style={{ fontSize: 12, color: tokens.superMuted, marginTop: 6 }}>{nights ? `${nights} ${t.nightsLabel} · ${t.perPerson}` : t.perPerson}</div>
            </div>
            <WAButton label="Enquire" size="lg" onClick={onWhatsApp} />
          </div>
        </DContainer>

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

      {/* ── Magazine masthead ── */}
      <div style={{ padding: "18px 22px 0", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, color: tokens.superMuted, textTransform: "uppercase", letterSpacing: "1.4px", fontWeight: 600 }}>No. 01</span>
        <span style={{ width: 1, height: 10, background: tokens.border, display: "inline-block" }} />
        <span style={{ fontSize: 10, color: tokens.superMuted, textTransform: "uppercase", letterSpacing: "1.4px", fontWeight: 600 }}>{monthYear}</span>
        <span style={{ width: 1, height: 10, background: tokens.border, display: "inline-block" }} />
        <span style={{ fontSize: 10, color: tokens.superMuted, textTransform: "uppercase", letterSpacing: "1.4px", fontWeight: 600 }}>{pkg.destination}</span>
      </div>

      {/* ── Large serif title ── */}
      <div style={{ padding: "16px 22px 0" }}>
        <h1 style={{
          fontFamily: serif, fontSize: 44, fontWeight: 400, letterSpacing: "-1px",
          lineHeight: 1.1, color: tokens.ink, margin: "0 0 10px",
        }}>
          {title}
        </h1>
        <p style={{ fontSize: 13, fontStyle: "italic", color: tokens.muted, margin: 0 }}>
          {agency.tagline ? agency.tagline : `Curated by ${agency.name}`}
        </p>
      </div>

      {/* ── Hero image ── */}
      <div style={{ padding: "20px 22px 0" }}>
        {coverImage ? (
          <img src={coverImage} alt={pkg.destination} style={{ width: "100%", height: 340, objectFit: "cover", display: "block", borderRadius: 4 }} />
        ) : (
          <div style={{ width: "100%", height: 340, background: `linear-gradient(135deg, ${brand}44, ${brand}22)`, borderRadius: 4 }} />
        )}
        <div style={{ marginTop: 8, fontSize: 11, fontStyle: "italic", color: tokens.superMuted }}>
          A curated journey · {pkg.destination}
        </div>
      </div>

      {/* ── Drop cap description ── */}
      {desc && (
        <div style={{ padding: "22px 22px 0" }}>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: tokens.muted, margin: 0 }}>
            {firstChar && (
              <span style={{
                fontFamily: serif, fontSize: 52, fontWeight: 400,
                float: isRtl ? "right" : "left", lineHeight: 0.85,
                paddingRight: isRtl ? 0 : 6, paddingLeft: isRtl ? 6 : 0,
                marginTop: 6, color: brand,
              }}>
                {firstChar}
              </span>
            )}
            {restDesc}
          </p>
          <div style={{ clear: "both" }} />
        </div>
      )}

      {/* ── Pull quote ── */}
      <div style={{ padding: "22px 22px 0" }}>
        <div style={{ borderLeft: `3px solid ${brand}`, paddingLeft: 18 }}>
          <p style={{ fontFamily: serif, fontSize: 19, fontStyle: "italic", color: tokens.ink, lineHeight: 1.55, margin: 0 }}>
            &ldquo;What we ask of a journey is a slowness sufficient to notice.&rdquo;
          </p>
        </div>
      </div>

      {/* ── Photo essay ── */}
      {extraImages.length > 0 && (
        <div style={{ padding: "22px 22px 0" }}>
          {extraImages.length === 1 ? (
            <img src={extraImages[0]} alt="" style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 4 }} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {extraImages.slice(0, 2).map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 4 }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Booking line ── */}
      <div style={{ padding: "22px 22px 0" }}>
        <div style={{ height: 1, background: tokens.border, marginBottom: 18 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: tokens.superMuted, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>{t.from}</div>
            <div style={{ fontFamily: serif, fontSize: 34, fontWeight: 400, color: brand, letterSpacing: "-1px", lineHeight: 1 }}>{pkg.price}</div>
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
      <ReviewsSection pkg={pkg} tokens={tokens} lang={lang} agency={agency} />
      <SharedHotel pkg={pkg} tokens={tokens} lang={lang} />
      <SharedAirports pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />

      <div style={{ padding: "0 18px 28px" }}>
        <SharedCTABanner pkg={pkg} agency={agency} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} onMessenger={onMessenger} />
      </div>

      <SharedFooter agency={agency} tokens={tokens} />

      <StickyCTA price={pkg.price} nights={nights} label={t.bookWhatsApp} onWhatsApp={onWhatsApp} lang={lang} />
    </div>
  );
}

// ─── TemplateAtlasCard ───────────────────────────────────────────────────────

export function TemplateAtlasCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete} onToggleActive={onToggleActive}
      headingFont="var(--font-cormorant, var(--font-dm-serif), serif)"
      imageBorderRadius={4}
      cardBg="#f5f3ee"
    />
  );
}
