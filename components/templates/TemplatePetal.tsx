"use client";

import React from "react";
import { T } from "@/lib/translations";
import {
  WAButton,
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

// ─── TemplatePetalPage ──────────────────────────────────────────────────────

export function TemplatePetalPage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const brand = "#8a4a5a";
  const serif = "var(--font-cormorant, var(--font-dm-serif), serif)";
  const tokens: TemplateTokens = {
    bg: "#faf3ef",
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

  // What we've planned — prefer includes over advantages
  const plannedItems = pkg.includes?.length ? pkg.includes : (pkg.advantages || []);

  const petalItems = (pkg.includes?.length ? pkg.includes : (pkg.advantages || [])).slice(0, 8);

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

        {/* Asymmetric hero: arched image left, text right */}
        <DContainer style={{ padding: "80px 80px 64px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 72, alignItems: "center" }}>
            <div style={{ position: "relative", height: 560, borderRadius: "260px 260px 14px 14px", overflow: "hidden", background: tokens.ink }}>
              {coverImage
                ? <img src={coverImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${brand}cc, ${brand}55)` }} />
              }
            </div>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: brand, fontStyle: "italic", fontFamily: serif }}>
                <span style={{ width: 32, height: 1, background: brand }} />
                A journey for two · {pkg.destination}
              </div>
              <h1 style={{ fontFamily: serif, fontSize: 64, lineHeight: 1.02, fontWeight: 400, fontStyle: "italic", letterSpacing: "-1px", marginTop: 20, marginBottom: 22 }}>
                {title}
              </h1>
              <p style={{ fontFamily: serif, fontSize: 22, lineHeight: 1.55, color: tokens.ink, fontStyle: "italic", margin: 0 }}>{pkg.description}</p>
              <div style={{ marginTop: 36 }}>
                <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />
              </div>
            </div>
          </div>
        </DContainer>

        {/* What's planned: 2-col + sticky price card */}
        <DContainer style={{ padding: "48px 80px 96px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 48, alignItems: "start" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: brand, letterSpacing: "1.4px", textTransform: "uppercase", marginBottom: 18 }}>What we&apos;ve planned</div>
              <h2 style={{ fontFamily: serif, fontSize: 38, fontWeight: 400, lineHeight: 1.1, marginTop: 0, marginBottom: 24 }}>
                {nights ? `${nights} days, nothing else to organise.` : "Everything organised."}
              </h2>
              {petalItems.length > 0 && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 24px" }}>
                  {petalItems.map((it, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, paddingTop: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: "50%", background: brand, marginTop: 8, flexShrink: 0 }} />
                      <div style={{ fontSize: 14.5, color: tokens.ink, lineHeight: 1.5 }}>{it}</div>
                    </div>
                  ))}
                </div>
              )}
              <SharedItinerary pkg={pkg} tokens={tokens} lang={lang} />
            </div>
            {/* Sticky price card */}
            <div style={{ background: brand, color: "#fff", borderRadius: 22, padding: 32, textAlign: "center", position: "sticky", top: 88 }}>
              <div style={{ fontSize: 11, opacity: 0.75, letterSpacing: "1.4px", textTransform: "uppercase" }}>For two · all-in</div>
              <div style={{ fontFamily: serif, fontSize: 60, fontWeight: 400, lineHeight: 1, marginTop: 10 }}>{pkg.price}</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>{nights ? `${nights} ${t.nightsLabel}` : t.perPerson}</div>
              <div style={{ height: 1, background: "rgba(255,255,255,0.2)", margin: "22px 0" }} />
              <WAButton label={t.bookWhatsApp} full size="md" style={{ background: "#fff", color: tokens.ink }} onClick={onWhatsApp} />
              <div style={{ fontSize: 11, opacity: 0.7, marginTop: 12 }}>Replies usually within an hour</div>
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
        fontFamily: "var(--font-dm-sans, sans-serif)",
        direction: isRtl ? "rtl" : "ltr",
      }}
    >
      <AgencyBar agency={agency} price={pkg.price} brand={brand} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} />

      {/* ── Header section ── */}
      <div style={{ padding: "32px 22px 20px", textAlign: "center" }}>
        {/* Line accent + italic sub-eyebrow */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            marginBottom: 18,
          }}
        >
          <div style={{ flex: 1, height: 1, background: `${brand}40`, maxWidth: 48 }} />
          <div
            style={{
              fontFamily: serif,
              fontStyle: "italic",
              fontSize: 14,
              color: brand,
              letterSpacing: "0.2px",
              whiteSpace: "nowrap",
            }}
          >
            A journey for two · {pkg.destination}
          </div>
          <div style={{ flex: 1, height: 1, background: `${brand}40`, maxWidth: 48 }} />
        </div>
        {/* Large italic serif h1 */}
        <h1
          style={{
            fontFamily: serif,
            fontSize: 38,
            fontWeight: 400,
            fontStyle: "italic",
            color: tokens.ink,
            lineHeight: 1.15,
            letterSpacing: "-0.8px",
            margin: 0,
          }}
        >
          {title}
        </h1>
      </div>

      {/* ── Arched hero image ── */}
      <div style={{ padding: "0 22px", marginBottom: 28 }}>
        <div
          style={{
            height: 380,
            borderRadius: "200px 200px 14px 14px",
            overflow: "hidden",
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
                background: `linear-gradient(160deg, ${brand}44, ${brand}bb)`,
              }}
            />
          )}
        </div>
      </div>

      {/* ── Description ── */}
      <div style={{ padding: "0 22px 24px" }}>
        <p
          style={{
            fontFamily: serif,
            fontStyle: "italic",
            fontSize: 17,
            color: tokens.muted,
            lineHeight: 1.8,
            margin: 0,
            direction: isRtl ? "rtl" : "ltr",
          }}
        >
          {pkg.description}
        </p>
      </div>

      {/* ── What we've planned card ── */}
      {plannedItems.length > 0 && (
        <div style={{ padding: "0 18px 28px" }}>
          <div
            style={{
              background: "#fff",
              border: `1px solid ${tokens.border}`,
              borderRadius: 18,
              padding: "24px 20px",
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: brand,
                marginBottom: 18,
                letterSpacing: "0.3px",
                textTransform: "uppercase",
              }}
            >
              What we&apos;ve planned
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
              {plannedItems.map((item, i) => (
                <div
                  key={i}
                  style={{ display: "flex", alignItems: "flex-start", gap: 12 }}
                >
                  <div
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: brand,
                      flexShrink: 0,
                      marginTop: 6,
                    }}
                  />
                  <span
                    style={{
                      fontSize: 13.5,
                      color: tokens.muted,
                      lineHeight: 1.55,
                      direction: isRtl ? "rtl" : "ltr",
                    }}
                  >
                    {item}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Price card ── */}
      <div style={{ padding: "0 18px 28px" }}>
        <div
          style={{
            background: brand,
            borderRadius: 18,
            padding: "28px 24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.7)",
              marginBottom: 8,
            }}
          >
            For two, all in
          </div>
          <div
            style={{
              fontFamily: serif,
              fontSize: 42,
              fontWeight: 400,
              color: "#fff",
              lineHeight: 1,
              letterSpacing: "-1px",
              marginBottom: 8,
            }}
          >
            {pkg.price}
          </div>
          {nights && (
            <div
              style={{
                fontSize: 12,
                color: "rgba(255,255,255,0.6)",
                marginBottom: 24,
              }}
            >
              {nights} {t.nightsLabel}
            </div>
          )}
          {!nights && <div style={{ marginBottom: 24 }} />}
          <WAButton
            label={t.messageUs}
            full
            onClick={onWhatsApp}
            style={{ background: "#fff", color: tokens.ink }}
          />
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
        label={t.messageUs}
        onWhatsApp={onWhatsApp}
        lang={lang}
      />
    </div>
  );
}

// ─── TemplatePetalCard ──────────────────────────────────────────────────────

export function TemplatePetalCard({
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
      imageBorderRadius={200}
      cardBg="#faf3ef"
    />
  );
}
