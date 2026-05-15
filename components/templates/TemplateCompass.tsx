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
  const airports = (pkg.airports || []).filter((a) => a.name?.trim());
  const itinerary = (pkg.itinerary || []).filter((it) => it.title?.trim());

  // Stat strip data
  const flyingTime = airports[0]?.flyingTime || "—";
  const days = (nights || 0) + 1;

  // Grade logic
  const cancellationLower = (pkg.cancellation || "").toLowerCase();
  const isFlexible = cancellationLower.includes("flexible") || cancellationLower.includes("free");
  const grade = !isFlexible && nights && Number(nights) > 10 ? "Strenuous" : "Moderate";

  // Pill tags
  const showAdventureTag = true; // always for Compass
  const showGroupTag = airports.length > 0;

  const statItems = [
    { l: "Distance", v: airports[0]?.flyingTime || "—" },
    { l: "Days", v: nights ? `${nights + 1} days` : "—" },
    { l: "Grade", v: grade },
  ];

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
                <WAButton label="Hold a spot" size="lg" onClick={onWhatsApp} />
              </div>
            </div>
          </DContainer>
        </div>

        {/* Stat strip (floating) */}
        <DContainer style={{ padding: "0 80px", marginTop: -40, position: "relative", zIndex: 5 }}>
          <div style={{ background: "#fff", borderRadius: 16, padding: "24px 32px", boxShadow: "0 20px 40px rgba(0,0,0,0.08)", display: "grid", gridTemplateColumns: `repeat(${statItems.length}, 1fr)`, gap: 0 }}>
            {statItems.map((s, i) => (
              <div key={i} style={{ paddingLeft: i === 0 ? 0 : 32, borderLeft: i === 0 ? "none" : `1px solid ${tokens.border}` }}>
                <div style={{ fontSize: 10.5, color: tokens.superMuted, letterSpacing: "0.8px", textTransform: "uppercase" }}>{s.l}</div>
                <div style={{ fontSize: 28, fontWeight: 800, marginTop: 6, letterSpacing: "-0.5px" }}>{s.v}</div>
              </div>
            ))}
          </div>
        </DContainer>

        {/* Difficulty + Route 2-col */}
        <DContainer style={{ padding: "80px 80px 24px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 64, alignItems: "start" }}>
            <div>
              <Eyebrow text="Difficulty" brand={brand} />
              <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.6px", marginTop: 14, marginBottom: 20 }}>{grade} — rated by terrain.</h2>
              <div style={{ display: "flex", gap: 6 }}>
                {[1, 2, 3, 4, 5].map(n => (
                  <div key={n} style={{ flex: 1, height: 10, borderRadius: 5, background: n <= (grade === "Strenuous" ? 4 : 3) ? brand : "rgba(13,27,46,0.1)" }} />
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11.5, color: tokens.superMuted, marginTop: 10 }}>
                <span>Easy</span><span>Moderate</span><span>Strenuous</span>
              </div>
            </div>
            <div>
              <Eyebrow text="The route" brand={brand} />
              <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.6px", marginTop: 14, marginBottom: 24 }}>
                {nights ? `${nights} days, hut to hut.` : "Day by day."}
              </h2>
              {itinerary.length > 0 ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                  {itinerary.slice(0, 6).map((day, i) => (
                    <div key={i} style={{ background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 10, padding: "16px 18px" }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: brand, letterSpacing: "-0.5px", marginBottom: 6 }}>
                        {String(day.day).padStart(2, "0")}
                      </div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, lineHeight: 1.35 }}>{day.title}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ fontSize: 15, color: tokens.muted, lineHeight: 1.65 }}>{pkg.description}</p>
              )}
            </div>
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
        {/* Tags — top-left */}
        <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 8 }}>
          {showAdventureTag && (
            <div
              style={{
                background: brand,
                color: "#fff",
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: "0.6px",
                textTransform: "uppercase",
                borderRadius: 99,
                padding: "4px 12px",
              }}
            >
              Adventure
            </div>
          )}
          {showGroupTag && (
            <div
              style={{
                background: "rgba(255,255,255,0.22)",
                backdropFilter: "blur(8px)",
                color: "#fff",
                fontSize: 10.5,
                fontWeight: 700,
                borderRadius: 99,
                padding: "4px 12px",
              }}
            >
              Small group
            </div>
          )}
        </div>
        {/* Destination bottom-left */}
        <div style={{ position: "absolute", bottom: 18, left: 18, right: 18 }}>
          <Eyebrow text={pkg.destination} brand={brand} light />
        </div>
      </div>

      {/* ── Stat strip ── */}
      <div style={{ padding: "0 18px" }}>
        <div
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 4px 24px rgba(13,27,46,0.09)",
            padding: "18px 0",
            marginTop: -24,
            position: "relative",
            zIndex: 2,
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
          }}
        >
          {[
            { label: "Distance", value: flyingTime },
            { label: "Days", value: String(days) },
            { label: "Grade", value: grade },
          ].map((stat, i) => (
            <div
              key={i}
              style={{
                textAlign: "center",
                padding: "0 10px",
                borderRight: i < 2 ? `1px solid ${tokens.border}` : "none",
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: brand,
                  lineHeight: 1.1,
                  letterSpacing: "-0.5px",
                }}
              >
                {stat.value}
              </div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: tokens.muted,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  marginTop: 4,
                }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Difficulty bar ── */}
      <div style={{ padding: "28px 18px 8px" }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: tokens.muted,
            marginBottom: 10,
            textTransform: "uppercase",
            letterSpacing: "0.8px",
          }}
        >
          Difficulty
        </div>
        <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
          {[0, 1, 2, 3, 4].map((seg) => (
            <div
              key={seg}
              style={{
                flex: 1,
                height: 6,
                borderRadius: 99,
                background: seg < 3 ? brand : `${brand}22`,
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 9.5,
            color: tokens.superMuted,
            fontWeight: 600,
          }}
        >
          <span>Easy</span>
          <span>Strenuous</span>
          <span>Extreme</span>
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
