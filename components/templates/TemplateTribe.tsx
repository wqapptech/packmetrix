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

// Day → emoji map
const DAY_EMOJI: Record<number, string> = {
  1: "🌅", 2: "🏛", 3: "🏔", 4: "✨", 5: "🍷",
  6: "🎭", 7: "🛶", 8: "🌿", 9: "🏖",
};
function dayEmoji(day: number) { return DAY_EMOJI[day] || "📍"; }

// Static avatar colors
const AVATAR_COLORS = ["#c46a2f", "#1f5f8e", "#2d7a4e", "#7c3aed", "#b85c2c", "#0f766e"];

// Generate initials from a string
function makeInitials(src: string, len: number) {
  const words = src.trim().split(/\s+/);
  let result = "";
  for (const w of words) { if (w[0]) result += w[0].toUpperCase(); }
  // pad with random-ish letters from agency name
  const EXTRA = "ABCDEFGHJKLMNPQRST";
  let idx = 0;
  while (result.length < len) { result += EXTRA[idx % EXTRA.length]; idx++; }
  return result.slice(0, len);
}

const STATIC_AVATARS = [
  { initials: "MR", color: AVATAR_COLORS[0] },
  { initials: "KL", color: AVATAR_COLORS[1] },
  { initials: "BN", color: AVATAR_COLORS[2] },
  { initials: "PT", color: AVATAR_COLORS[3] },
  { initials: "JS", color: AVATAR_COLORS[4] },
  { initials: "FD", color: AVATAR_COLORS[5] },
];

// ─── TemplateTribePage ──────────────────────────────────────────────────────

export function TemplateTribePage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const brand = "#b85c2c";
  const serif = "var(--font-dm-sans, sans-serif)";
  const tokens: TemplateTokens = {
    bg: "#faf6ef",
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
  const itinerary = (pkg.itinerary || []).filter(it => it.title?.trim());
  const isRtl = lang === "ar";
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

        {/* Full-bleed hero with floating price card */}
        <div style={{ position: "relative", height: 560, overflow: "hidden" }}>
          {coverImage
            ? <img src={coverImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${brand}cc, ${brand}55)` }} />
          }
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.55))" }} />
          <DContainer style={{ position: "absolute", inset: 0, padding: "0 80px", display: "flex", alignItems: "flex-end", paddingBottom: 56 }}>
            <div style={{ color: "#fff", flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.9, letterSpacing: "1.4px", textTransform: "uppercase" }}>{pkg.destination}</div>
              <h1 style={{ fontSize: 64, fontWeight: 800, lineHeight: 1, letterSpacing: "-1.6px", margin: "12px 0 0" }}>{title}</h1>
              <p style={{ fontSize: 17, opacity: 0.9, marginTop: 16, maxWidth: 540, lineHeight: 1.5 }}>{pkg.description}</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)", borderRadius: 16, padding: 24, minWidth: 260 }}>
              <div style={{ fontSize: 10.5, color: tokens.superMuted, letterSpacing: "1px", textTransform: "uppercase" }}>{t.from}</div>
              <div style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-1px", marginTop: 4, lineHeight: 1 }}>{pkg.price}</div>
              <div style={{ fontSize: 11, color: tokens.superMuted, marginTop: 4 }}>{nights ? `${nights} ${t.nightsLabel} · ${t.perPerson}` : t.perPerson}</div>
              <div style={{ height: 1, background: tokens.border, margin: "16px 0" }} />
              <WAButton label="Save my seat" full size="md" onClick={onWhatsApp} />
            </div>
          </DContainer>
        </div>

        {/* Itinerary 5-col grid */}
        {itinerary.length > 0 && (
          <DContainer style={{ padding: "56px 80px 56px" }}>
            <Eyebrow text={t.editorialJourneyTogether} brand={brand} />
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.6px", marginTop: 10, marginBottom: 24 }}>Day by day.</h2>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(itinerary.length, 5)}, 1fr)`, gap: 12 }}>
              {itinerary.slice(0, 5).map((it, i) => (
                <div key={i} style={{ background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ fontSize: 10.5, color: brand, fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase" }}>Day {it.day}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 4, lineHeight: 1.3 }}>{it.title}</div>
                  {it.desc && <div style={{ fontSize: 12, color: tokens.muted, marginTop: 4, lineHeight: 1.45 }}>{it.desc}</div>}
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

  // Build avatar list: 2 initials from agency name + 4 static extras
  const agencyInitials = makeInitials(agency.name, 2);
  const allAvatars = [
    { initials: agencyInitials[0] + (agencyInitials[1] || "A"), color: brand },
    { initials: agencyInitials[1] ? agencyInitials[0] + agencyInitials[1] : "AA", color: AVATAR_COLORS[1] },
    ...STATIC_AVATARS.slice(0, 4),
  ].slice(0, 8);

  return (
    <div style={{
      minHeight: "100vh", background: tokens.bg, color: tokens.ink,
      fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr",
    }}>
      <AgencyBar agency={agency} price={pkg.price} brand={brand} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} />

      {/* ── Hero ── */}
      <div style={{ position: "relative", height: 320, overflow: "hidden" }}>
        {coverImage ? (
          <img src={coverImage} alt={pkg.destination} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${brand}cc, ${brand}55)` }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)" }} />
        <div style={{ position: "absolute", top: 20, left: 18 }}>
          <Eyebrow text={pkg.destination} brand={brand} light />
        </div>
        <div style={{ position: "absolute", bottom: 24, left: 20, right: 20 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1.15, margin: 0, letterSpacing: "-0.5px", textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
            {title}
          </h1>
        </div>
      </div>

      {/* ── Roster card ── */}
      <div style={{ padding: "22px 18px 0" }}>
        <div style={{ background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 16, padding: "20px 18px" }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: brand, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 14 }}>
            You&apos;ll travel with
          </div>
          {/* Avatar grid */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
            {allAvatars.map((av, i) => (
              <div key={i} style={{
                width: 42, height: 42, borderRadius: "50%",
                background: av.color, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff",
                flexShrink: 0,
              }}>
                {av.initials.slice(0, 2)}
              </div>
            ))}
          </div>
          {/* Group stats */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: `${brand}08`, borderRadius: 9 }}>
              <span style={{ fontSize: 12, color: tokens.muted }}>Average age</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: tokens.ink }}>34</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: `${brand}08`, borderRadius: 9 }}>
              <span style={{ fontSize: 12, color: tokens.muted }}>Mix</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: tokens.ink }}>Solo &amp; couples</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", background: `${brand}08`, borderRadius: 9 }}>
              <span style={{ fontSize: 12, color: tokens.muted }}>Group size</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: tokens.ink }}>Small group · curated</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Price strip ── */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 14, padding: "16px 18px" }}>
          <div>
            <div style={{ fontSize: 10, color: tokens.superMuted, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>{t.from}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: brand, letterSpacing: "-0.5px", lineHeight: 1 }}>{pkg.price}</div>
            <div style={{ fontSize: 11, color: tokens.muted, marginTop: 3 }}>
              {nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.perPerson}
            </div>
          </div>
          <WAButton label={t.bookWhatsApp} size="md" onClick={onWhatsApp} />
        </div>
      </div>

      {/* ── Emoji Day-by-Day ── */}
      {itinerary.length > 0 && (
        <section style={{ padding: "28px 18px 0" }}>
          <Eyebrow text={t.dayByDay} brand={brand} />
          <h2 style={{ fontSize: 22, fontWeight: 700, color: tokens.ink, margin: "10px 0 16px", letterSpacing: "-0.3px" }}>
            {t.yourJourney}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {itinerary.map((it, i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 14, alignItems: "flex-start" }}>
                <div style={{ fontSize: 24, flexShrink: 0, lineHeight: 1, marginTop: 2 }}>{dayEmoji(it.day)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: brand, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>
                    Day {it.day}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: tokens.ink, lineHeight: 1.3, marginBottom: it.desc ? 4 : 0 }}>{it.title}</div>
                  {it.desc && <div style={{ fontSize: 12, color: tokens.muted, lineHeight: 1.55 }}>{it.desc}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Static testimonial card ── */}
      <div style={{ padding: "22px 18px 0" }}>
        <div style={{ background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 16, padding: "22px 20px" }}>
          <div style={{ fontSize: 28, color: brand, lineHeight: 1, marginBottom: 10, fontWeight: 800 }}>&ldquo;</div>
          <p style={{ fontSize: 15, lineHeight: 1.65, color: tokens.ink, fontStyle: "italic", margin: "0 0 14px" }}>
            Felt like a long weekend with friends I&apos;d known for years.
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: brand, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff" }}>SF</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: tokens.ink }}>Sarah F.</div>
              <div style={{ fontSize: 11, color: tokens.superMuted }}>June 2024</div>
            </div>
          </div>
        </div>
      </div>

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

// ─── TemplateTribeCard ──────────────────────────────────────────────────────

export function TemplateTribeCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete} onToggleActive={onToggleActive}
      headingFont="var(--font-dm-sans, sans-serif)"
      imageBorderRadius={0}
      cardBg="#faf6ef"
    />
  );
}
