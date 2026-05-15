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

// ─── TemplateFamilyPage ──────────────────────────────────────────────────────

export function TemplateFamilyPage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const brand = "#c46a2f";
  const serif = "var(--font-dm-sans, sans-serif)";
  const tokens: TemplateTokens = {
    bg: "#fefaf2",
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
  const familyFeatures = (pkg.includes?.length ? pkg.includes : (pkg.advantages || [])).slice(0, 6);
  const itinerary = (pkg.itinerary || []).filter((it: { title?: string }) => it.title?.trim());
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

        {/* 50/50 hero: arched image left + overlapping price card, text right */}
        <DContainer style={{ padding: "56px 80px 56px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "relative", height: 480, borderRadius: 220, overflow: "hidden" }}>
                {coverImage
                  ? <img src={coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                  : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${brand}cc, ${brand}55)` }} />
                }
              </div>
              {/* Overlapping price card */}
              <div style={{ position: "absolute", bottom: -16, right: -16, background: "#fff", borderRadius: 14, padding: "16px 20px", boxShadow: "0 10px 24px rgba(0,0,0,0.08)", border: `1px solid ${tokens.border}` }}>
                <div style={{ fontSize: 10.5, color: tokens.superMuted, letterSpacing: "0.7px", textTransform: "uppercase" }}>Family of 4</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: brand, marginTop: 4, letterSpacing: "-0.5px" }}>{pkg.price}</div>
                <div style={{ fontSize: 11, color: tokens.superMuted, marginTop: 2 }}>Kids under 6 stay free</div>
              </div>
            </div>
            <div>
              <Eyebrow text={pkg.destination} brand={brand} />
              <h1 style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-1.5px", marginTop: 16, marginBottom: 18 }}>{title}</h1>
              <p style={{ fontSize: 16.5, color: tokens.muted, lineHeight: 1.7, margin: 0 }}>{pkg.description}</p>
              <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />
            </div>
          </div>
        </DContainer>

        {/* Family features 3-col */}
        {familyFeatures.length > 0 && (
          <DContainer style={{ padding: "32px 80px 56px" }}>
            <Eyebrow text="Built for families" brand={brand} />
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.8px", marginTop: 10, marginBottom: 28 }}>Everything you&apos;d think to ask for. Already in place.</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {familyFeatures.map((it, i) => (
                <div key={i} style={{ background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 14, padding: 22 }}>
                  <div style={{ fontSize: 15.5, fontWeight: 700 }}>{it}</div>
                </div>
              ))}
            </div>
          </DContainer>
        )}

        {/* Itinerary 4-col */}
        {itinerary.length > 0 && (
          <DContainer style={{ padding: "0 80px 56px" }}>
            <Eyebrow text="A typical day" brand={brand} />
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.8px", marginTop: 10, marginBottom: 24 }}>Easy mornings, naps respected.</h2>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(itinerary.length, 4)}, 1fr)`, gap: 12 }}>
              {itinerary.slice(0, 4).map((it, i) => (
                <div key={i} style={{ background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: brand, letterSpacing: "0.4px" }}>Day {it.day}</div>
                  <div style={{ fontSize: 14, marginTop: 8, lineHeight: 1.4 }}>{it.title}</div>
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
    <div style={{
      minHeight: "100vh", background: tokens.bg, color: tokens.ink,
      fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr",
    }}>
      <AgencyBar agency={agency} price={pkg.price} brand={brand} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} />

      {/* ── Hero with curved bottom ── */}
      <div style={{ position: "relative", height: 320, overflow: "hidden" }}>
        {coverImage ? (
          <img src={coverImage} alt={pkg.destination} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${brand}cc, ${brand}44)` }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.5) 100%)" }} />
        {/* SVG wave bottom */}
        <svg style={{ position: "absolute", bottom: -1, left: 0, width: "100%" }} viewBox="0 0 390 40" preserveAspectRatio="none">
          <path d="M0,40 L0,20 Q195,0 390,20 L390,40 Z" fill="#fefaf2" />
        </svg>
      </div>

      {/* ── Title + description ── */}
      <div style={{ padding: "8px 18px 0" }}>
        <Eyebrow text={pkg.destination} brand={brand} />
        <h1 style={{ fontSize: 30, fontWeight: 800, color: tokens.ink, margin: "10px 0 12px", letterSpacing: "-0.5px", lineHeight: 1.2 }}>
          {title}
        </h1>
        {pkg.description && (
          <p style={{ fontSize: 14, color: tokens.muted, lineHeight: 1.7, margin: 0 }}>{pkg.description}</p>
        )}
      </div>


      {/* ── Family pricing card ── */}
      <div style={{ padding: "22px 18px 0" }}>
        <div style={{ background: brand, borderRadius: 18, padding: "24px 22px", position: "relative", overflow: "hidden" }}>
          {/* Subtle pattern */}
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.07, pointerEvents: "none" }} viewBox="0 0 60 60" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="fam-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="2" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#fam-dots)" />
          </svg>

          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 8, fontWeight: 600 }}>
              per family of four
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#fff", letterSpacing: "-1px", lineHeight: 1, marginBottom: 6 }}>
              {pkg.price}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 20 }}>
              Kids under 12 stay free
            </div>
            <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} style={{ background: "#fff", color: brand }} />
          </div>
        </div>
      </div>

      {/* ── Nights info strip ── */}
      {nights && (
        <div style={{ padding: "14px 18px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 10 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: brand }}>{nights}</span>
            <span style={{ fontSize: 13, color: tokens.muted }}>{t.nightsLabel} · {t.perPerson}</span>
          </div>
        </div>
      )}

      <SharedItinerary pkg={pkg} tokens={tokens} lang={lang} />
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

// ─── TemplateFamilyCard ──────────────────────────────────────────────────────

export function TemplateFamilyCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete} onToggleActive={onToggleActive}
      headingFont="var(--font-dm-sans, sans-serif)"
      imageBorderRadius={0}
      cardBg="#fefaf2"
    />
  );
}
