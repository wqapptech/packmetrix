"use client";

import React from "react";
import { T } from "@/lib/translations";
import {
  WAButton,
  Eyebrow,
  AgencyBar,
  StickyCTA,
  SharedCTABanner,
  SharedFooter,
  BaseCard,
  useIsDesktop,
  DesktopNav,
  DContainer,
  DesktopFooter,
  SharedCTABannerDesktop,
  ReviewsSection,
  ReviewsSectionDesktop,
  DynamicSections,
  DynamicSectionsDesktop,
} from "./shared";
import type { TPageProps, TCardProps, TemplateTokens } from "./types";

const BRAND  = "#8a6a3a";
const SERIF  = "var(--font-instrument-serif, var(--font-cormorant), serif)";
const BONE   = "#f5f1ea";
const INK    = "#1a1208";
const MUTED  = "rgba(26,18,8,0.52)";
const SMUTED = "rgba(26,18,8,0.32)";
const BORDER = "rgba(26,18,8,0.08)";

// ─── AgentBand — travel designer strip ──────────────────────────────────────

function AgentBand({ pkg, tokens, lang }: { pkg: TPageProps["pkg"]; tokens: TemplateTokens; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const agent = pkg.agent;
  if (!agent) return null;
  const isRtl = lang === "ar";
  return (
    <div style={{
      margin: "0 18px", borderRadius: 16,
      background: "#fff", border: `1px solid ${tokens.border}`,
      padding: "20px 20px", display: "flex", gap: 16, alignItems: "center",
      direction: isRtl ? "rtl" : "ltr",
    }}>
      {agent.avatar
        ? <img src={agent.avatar} alt={agent.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        : (
          <div style={{
            width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
            background: `${BRAND}18`, border: `1px solid ${BRAND}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: SERIF, fontSize: 24, color: BRAND,
          }}>
            {agent.name[0]}
          </div>
        )
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: BRAND, marginBottom: 4 }}>
          {t.travelDesignerLabel}
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 400, color: INK, lineHeight: 1.1, marginBottom: 3 }}>
          {agent.name}
        </div>
        <div style={{ fontSize: 12, color: MUTED }}>
          {agent.role}
          {agent.years ? ` · ${agent.years} ${t.yearsExpSuffix}` : ""}
          {agent.repliesIn ? ` · ${t.repliesInLabel} ${agent.repliesIn}` : ""}
        </div>
      </div>
      <WAButton label={lang === "ar" ? "واتساب" : "WhatsApp"} size="sm" onClick={() => {}} />
    </div>
  );
}

function AgentBandDesktop({ pkg, tokens, lang, onWhatsApp }: { pkg: TPageProps["pkg"]; tokens: TemplateTokens; lang: TPageProps["lang"]; onWhatsApp: () => void }) {
  const t = T[lang];
  const agent = pkg.agent;
  if (!agent) return null;
  return (
    <DContainer style={{ padding: "0 80px 64px" }}>
      <div style={{
        background: "#fff", border: `1px solid ${tokens.border}`,
        borderRadius: 18, padding: "28px 32px",
        display: "flex", gap: 24, alignItems: "center",
      }}>
        {agent.avatar
          ? <img src={agent.avatar} alt={agent.name} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          : (
            <div style={{
              width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
              background: `${BRAND}18`, border: `1px solid ${BRAND}40`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: SERIF, fontSize: 32, color: BRAND,
            }}>
              {agent.name[0]}
            </div>
          )
        }
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: BRAND, marginBottom: 6 }}>{t.meetYourDesigner}</div>
          <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 400, color: INK, lineHeight: 1.1, marginBottom: 4 }}>{agent.name}</div>
          <div style={{ fontSize: 13, color: MUTED }}>
            {agent.role}
            {agent.years ? ` · ${agent.years} ${t.yearsExpSuffix}` : ""}
            {agent.repliesIn ? ` · ${t.repliesInLabel} ${agent.repliesIn}` : ""}
          </div>
        </div>
        <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />
      </div>
    </DContainer>
  );
}

// ─── Chapter itinerary (narrative format) ───────────────────────────────────

function ChapterItinerary({ pkg, tokens, lang }: { pkg: TPageProps["pkg"]; tokens: TemplateTokens; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const itinerary = (pkg.itinerary || []).filter(it => it.title?.trim());
  if (!itinerary.length) return null;
  const isRtl = lang === "ar";

  return (
    <section id="itinerary" style={{ padding: "28px 18px", scrollMarginTop: 88 }}>
      <Eyebrow text={t.dayByDay} brand={BRAND} />
      <h2 style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 400, letterSpacing: "-0.5px", lineHeight: 1.1, color: INK, margin: "10px 0 24px", fontStyle: "italic" }}>
        {t.yourJourney}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {itinerary.map((it, i) => (
          <div
            key={i}
            style={{
              display: "flex", gap: 16, paddingBottom: 28,
              paddingTop: i > 0 ? 28 : 0,
              borderTop: i > 0 ? `1px solid ${BORDER}` : "none",
              direction: isRtl ? "rtl" : "ltr",
            }}
          >
            {/* Day number column */}
            <div style={{ width: 48, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
              <div style={{ fontFamily: SERIF, fontSize: 11, color: BRAND, fontWeight: 500, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>
                {t.dayLabel}
              </div>
              <div style={{ fontFamily: SERIF, fontSize: 36, color: BRAND, lineHeight: 1, fontWeight: 400, letterSpacing: "-1px" }}>
                {it.day}
              </div>
            </div>
            {/* Content */}
            <div style={{ flex: 1, minWidth: 0 }}>
              {it.chapter && (
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: BRAND, opacity: 0.65, marginBottom: 6 }}>
                  {t.chapterLabel} — {it.chapter}
                </div>
              )}
              <div style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 400, color: INK, lineHeight: 1.25, marginBottom: it.desc ? 8 : 0, fontStyle: "italic" }}>
                {it.title}
              </div>
              {it.desc && (
                <p style={{ fontSize: 13, color: MUTED, lineHeight: 1.7, margin: 0 }}>{it.desc}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function ChapterItineraryDesktop({ pkg, tokens, lang }: { pkg: TPageProps["pkg"]; tokens: TemplateTokens; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const itinerary = (pkg.itinerary || []).filter(it => it.title?.trim());
  if (!itinerary.length) return null;

  return (
    <DContainer id="itinerary" style={{ padding: "72px 80px 56px" }}>
      <Eyebrow text={t.dayByDay} brand={BRAND} />
      <h2 style={{ fontFamily: SERIF, fontSize: 46, fontWeight: 400, letterSpacing: "-1px", lineHeight: 1.05, color: INK, margin: "12px 0 48px", fontStyle: "italic" }}>
        {t.yourJourney}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 64px" }}>
        {itinerary.map((it, i) => (
          <div
            key={i}
            style={{
              paddingBottom: 32, paddingTop: i > 1 ? 32 : 0,
              borderTop: i > 1 ? `1px solid ${BORDER}` : "none",
              display: "flex", gap: 20,
            }}
          >
            <div style={{ width: 40, flexShrink: 0 }}>
              <div style={{ fontFamily: SERIF, fontSize: 32, color: `${BRAND}55`, lineHeight: 1, fontWeight: 400 }}>{it.day}</div>
            </div>
            <div>
              {it.chapter && (
                <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: BRAND, opacity: 0.65, marginBottom: 5 }}>
                  {it.chapter}
                </div>
              )}
              <div style={{ fontFamily: SERIF, fontSize: 20, color: INK, lineHeight: 1.2, marginBottom: it.desc ? 8 : 0, fontStyle: "italic" }}>
                {it.title}
              </div>
              {it.desc && <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, margin: 0 }}>{it.desc}</p>}
            </div>
          </div>
        ))}
      </div>
    </DContainer>
  );
}

// ─── TemplateAuroraPage ──────────────────────────────────────────────────────

export function TemplateAuroraPage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const tokens: TemplateTokens = {
    bg: BONE, ink: INK, muted: MUTED, superMuted: SMUTED, border: BORDER, brand: BRAND, serif: SERIF,
  };

  const nights    = pkg.nights ? Number(pkg.nights) : null;
  const coverImage = pkg.coverImage || "";
  const title     = pkg.title || pkg.destination;
  const isRtl     = lang === "ar";
  const isDesktop = useIsDesktop();

  // Editorial numbered highlights — first 3 includes or itinerary
  const rawHL = pkg.includes?.length ? pkg.includes : (pkg.advantages || []);
  const highlights: { num: string; title: string; desc: string }[] = rawHL.length
    ? rawHL.slice(0, 3).map((item, i) => ({ num: ["01", "02", "03"][i], title: item, desc: "" }))
    : (pkg.itinerary || []).slice(0, 3).map((it, i) => ({ num: ["01", "02", "03"][i], title: it.title, desc: it.desc || "" }));

  const navLinks = [
    ...((pkg.itinerary || []).some(it => it.title?.trim()) ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...((pkg.includes?.length || (pkg.advantages || []).length) ? [{ label: t.navIncluded, href: "#included" }] : []),
    ...((pkg.pricingTiers || []).some(tier => tier.price) ? [{ label: t.navPricing, href: "#pricing" }] : []),
  ];

  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: BONE, color: INK, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={BRAND} navLinks={navLinks} lang={lang} onWhatsApp={onWhatsApp} />

        {/* 50/50 hero */}
        <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", minHeight: 620 }}>
          <div style={{ padding: "84px 80px 56px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div>
              <Eyebrow text={pkg.destination} brand={BRAND} />
              <h1 style={{ fontFamily: SERIF, fontSize: 76, lineHeight: 0.98, fontWeight: 400, letterSpacing: "-2px", marginTop: 22, color: INK, fontStyle: "italic" }}>
                {title}
              </h1>
              <p style={{ fontSize: 17, color: MUTED, lineHeight: 1.7, maxWidth: 460, marginTop: 26 }}>{pkg.description}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 36 }}>
                <div>
                  <div style={{ fontSize: 10, color: SMUTED, letterSpacing: "1.2px", textTransform: "uppercase" as const }}>{t.from}</div>
                  <div style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 400, lineHeight: 1, letterSpacing: "-1.5px", marginTop: 4, color: BRAND }}>{pkg.price}</div>
                  <div style={{ fontSize: 11, color: SMUTED, marginTop: 4 }}>{nights ? `${nights} ${t.nightsLabel} · ${t.perPerson}` : t.perPerson}</div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 12, marginTop: 32 }}>
                <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />
              </div>
            </div>
            {pkg.cancellation && (
              <div style={{ paddingTop: 24, borderTop: `1px solid ${BORDER}`, marginTop: 32, fontSize: 12.5, color: SMUTED }}>
                ✓ {pkg.cancellation}
              </div>
            )}
          </div>
          <div style={{ position: "relative", overflow: "hidden", background: INK }}>
            {coverImage
              ? <img src={coverImage} alt={pkg.destination} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${BRAND}cc, ${BRAND}55)` }} />
            }
          </div>
        </div>

        {/* Agent band */}
        <AgentBandDesktop pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />

        {/* Editorial body */}
        <DContainer style={{ padding: highlights.length ? "72px 80px 24px" : "72px 80px 48px" }}>
          <Eyebrow text={t.editorialTheJourney} brand={BRAND} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 64, marginTop: 18 }}>
            <h2 style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 400, lineHeight: 1.1, letterSpacing: "-0.8px", margin: 0, fontStyle: "italic" }}>
              {nights ? `${nights} ${t.editorialNightsCurated}` : t.editorialCrafted}
            </h2>
            <p style={{ fontFamily: SERIF, fontSize: 20, lineHeight: 1.6, color: INK, margin: 0 }}>{pkg.description}</p>
          </div>
        </DContainer>

        {/* 3-col numbered highlights */}
        {highlights.length > 0 && (
          <DContainer style={{ padding: "48px 80px 80px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 32 }}>
              {highlights.map((h, i) => (
                <div key={i} style={{ paddingTop: 24, borderTop: `1px solid ${BORDER}` }}>
                  <div style={{ fontFamily: SERIF, fontSize: 20, color: BRAND, fontWeight: 400, marginBottom: 14, opacity: 0.65 }}>{h.num}</div>
                  <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 400, lineHeight: 1.2, marginBottom: 10, fontStyle: "italic" }}>{h.title}</div>
                  {h.desc && <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.65 }}>{h.desc}</div>}
                </div>
              ))}
            </div>
          </DContainer>
        )}

        {/* Chapter itinerary */}
        <ChapterItineraryDesktop pkg={pkg} tokens={tokens} lang={lang} />

        <DynamicSectionsDesktop pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
        <ReviewsSectionDesktop pkg={pkg} tokens={tokens} lang={lang} agency={agency} />
        <SharedCTABannerDesktop pkg={pkg} agency={agency} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} onMessenger={onMessenger} />
        <DesktopFooter agency={agency} brand={BRAND} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BONE, color: INK, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
      <AgencyBar agency={agency} price={pkg.price} brand={BRAND} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} />

      {/* Hero */}
      <div style={{ position: "relative", height: 520, overflow: "hidden" }}>
        {coverImage
          ? <img src={coverImage} alt={pkg.destination} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${BRAND}cc, ${BRAND}55)` }} />
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.14) 0%, rgba(0,0,0,0.06) 40%, rgba(0,0,0,0.62) 100%)" }} />
        <div style={{ position: "absolute", top: 20, left: isRtl ? undefined : 18, right: isRtl ? 18 : undefined }}>
          <Eyebrow text={pkg.destination} brand={BRAND} light />
        </div>
        <div style={{ position: "absolute", bottom: 52, left: 20, right: 20 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 400, fontStyle: "italic", color: "#fff", lineHeight: 1.15, letterSpacing: "-0.5px", margin: 0, textShadow: "0 2px 16px rgba(0,0,0,0.35)" }}>
            {title}
          </h1>
        </div>
      </div>

      {/* Offset price card */}
      <div style={{ padding: "0 18px" }}>
        <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 8px 40px rgba(26,18,8,0.12)", padding: "22px 22px 20px", marginTop: -32, position: "relative", zIndex: 2 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: SMUTED, marginBottom: 5 }}>{t.from}</div>
          <div style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 400, color: BRAND, lineHeight: 1, letterSpacing: "-1px", marginBottom: 5 }}>{pkg.price}</div>
          <div style={{ fontSize: 12, color: SMUTED, marginBottom: 18 }}>
            {nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.perPerson}
          </div>
          <WAButton label={t.bookWhatsApp} full onClick={onWhatsApp} />
        </div>
      </div>

      {/* Agent band */}
      <div style={{ marginTop: 20 }}>
        <AgentBand pkg={pkg} tokens={tokens} lang={lang} />
      </div>

      {/* Numbered editorial highlights */}
      {highlights.length > 0 && (
        <section style={{ padding: "28px 18px 8px" }}>
          <Eyebrow text={t.whatsIncluded} brand={BRAND} />
          <div style={{ display: "flex", flexDirection: "column", gap: 0, marginTop: 20, border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", background: "#fff" }}>
            {highlights.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 18, padding: "20px", borderBottom: i < highlights.length - 1 ? `1px solid ${BORDER}` : "none", alignItems: "center" }}>
                <div style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 400, color: BRAND, lineHeight: 1, flexShrink: 0, opacity: 0.6, letterSpacing: "-1px" }}>{item.num}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: SERIF, fontSize: 16, fontStyle: "italic", color: INK, lineHeight: 1.3, marginBottom: item.desc ? 4 : 0 }}>{item.title}</div>
                  {item.desc && <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.55 }}>{item.desc}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Chapter itinerary */}
      <ChapterItinerary pkg={pkg} tokens={tokens} lang={lang} />

      <DynamicSections pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
      <ReviewsSection pkg={pkg} tokens={tokens} lang={lang} agency={agency} />

      <div style={{ padding: "0 18px 28px" }}>
        <SharedCTABanner pkg={pkg} agency={agency} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} onMessenger={onMessenger} />
      </div>

      <SharedFooter agency={agency} tokens={tokens} />
      <StickyCTA price={pkg.price} nights={nights} label={t.bookWhatsApp} onWhatsApp={onWhatsApp} lang={lang} />
    </div>
  );
}

// ─── TemplateAuroraCard ──────────────────────────────────────────────────────

export function TemplateAuroraCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
