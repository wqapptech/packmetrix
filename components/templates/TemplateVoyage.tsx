"use client";

import React from "react";
import { T } from "@/lib/translations";
import {
  WAButton,
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

const LIME   = "#d6f43d";
const COAL   = "#0d1b2e";
const INK    = "#ffffff";
const MUTED  = "rgba(255,255,255,0.65)";
const SMUTED = "rgba(255,255,255,0.4)";
const BORDER = "rgba(255,255,255,0.09)";
const ARCH   = "var(--font-archivo-black, sans-serif)";

// ─── Social-proof ticker (cycles through messages) ───────────────────────────

function useTicker(messages: string[], intervalMs = 3000): string {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => setIdx(i => (i + 1) % messages.length), intervalMs);
    return () => clearInterval(id);
  }, [messages.length, intervalMs]);
  return messages[idx] ?? "";
}

function SocialProofTicker({ pkg, lang, style }: { pkg: TPageProps["pkg"]; lang: TPageProps["lang"]; style?: React.CSSProperties }) {
  const messages = pkg.socialProofTicker ?? [];
  const current = useTicker(messages);
  if (!messages.length) return null;
  return (
    <div style={{
      background: LIME, color: COAL, display: "flex", alignItems: "center", gap: 10,
      padding: "9px 18px", fontSize: 12.5, fontWeight: 700,
      ...style,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%", background: COAL, opacity: 0.55,
        display: "inline-block", flexShrink: 0,
        animation: "pulse 1.4s ease-in-out infinite",
      }} />
      <span style={{ letterSpacing: "0.2px" }}>{current}</span>
    </div>
  );
}

// ─── Ticket-stub itinerary (with optional day image) ─────────────────────────

function TicketItinerary({ itinerary, lang }: { itinerary: NonNullable<TPageProps["pkg"]["itinerary"]>; lang: TPageProps["lang"] }) {
  const t = T[lang];
  if (!itinerary.length) return null;
  return (
    <section id="itinerary" style={{ padding: "28px 18px", scrollMarginTop: 88 }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.6px", textTransform: "uppercase" as const, color: LIME, marginBottom: 20 }}>
        {t.yourItinerary}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {itinerary.map((it, i) => (
          <div key={i} style={{
            background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`,
            borderRadius: 14, overflow: "hidden",
          }}>
            {/* Day image when available */}
            {it.img && (
              <div style={{ height: 180, overflow: "hidden", position: "relative" }}>
                <img src={it.img} alt={it.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                {it.chapter && (
                  <div style={{
                    position: "absolute", bottom: 10, left: 12,
                    background: LIME, color: COAL,
                    fontFamily: ARCH, fontSize: 11, fontWeight: 700,
                    padding: "3px 10px", borderRadius: 4, letterSpacing: "0.5px",
                  }}>
                    {it.chapter}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: "flex" }}>
              {/* Perforated side tab */}
              <div style={{
                width: 52, flexShrink: 0,
                background: `${LIME}15`,
                borderRight: `1px dashed ${LIME}40`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "16px 0", gap: 2,
              }}>
                <div style={{ fontSize: 8, fontWeight: 700, color: LIME, letterSpacing: "0.8px", textTransform: "uppercase" as const }}>{t.ticketStubDay}</div>
                <div style={{ fontSize: 28, fontWeight: 700, color: LIME, lineHeight: 1, fontFamily: ARCH }}>{it.day}</div>
              </div>
              {/* Content */}
              <div style={{ flex: 1, padding: "16px 16px" }}>
                {!it.img && it.chapter && (
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: LIME, opacity: 0.7, marginBottom: 4 }}>
                    {it.chapter}
                  </div>
                )}
                <div style={{ fontSize: 14, fontWeight: 700, color: INK, lineHeight: 1.3, marginBottom: it.desc ? 6 : 0 }}>{it.title}</div>
                {it.desc && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.6 }}>{it.desc}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function TicketItineraryDesktop({ itinerary, lang }: { itinerary: NonNullable<TPageProps["pkg"]["itinerary"]>; lang: TPageProps["lang"] }) {
  const t = T[lang];
  if (!itinerary.length) return null;
  return (
    <DContainer id="itinerary" style={{ padding: "56px 80px 64px" }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: LIME, marginBottom: 28 }}>
        {t.yourItinerary}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {itinerary.map((it, i) => (
          <div key={i} style={{
            display: "flex", flexDirection: "column",
            background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`,
            borderRadius: 14, overflow: "hidden",
          }}>
            {it.img && (
              <div style={{ height: 140, overflow: "hidden", position: "relative", flexShrink: 0 }}>
                <img src={it.img} alt={it.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                {it.chapter && (
                  <div style={{
                    position: "absolute", bottom: 8, left: 10,
                    background: LIME, color: COAL,
                    fontFamily: ARCH, fontSize: 10, fontWeight: 700,
                    padding: "2px 8px", borderRadius: 3,
                  }}>
                    {it.chapter}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: "flex", flex: 1 }}>
              <div style={{
                width: 44, flexShrink: 0,
                background: `${LIME}12`,
                borderRight: `1px dashed ${LIME}35`,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "14px 0",
              }}>
                <div style={{ fontSize: 7, fontWeight: 700, color: LIME, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 3 }}>{t.ticketStubDay}</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: LIME, lineHeight: 1, fontFamily: ARCH }}>{it.day}</div>
              </div>
              <div style={{ flex: 1, padding: "14px 14px" }}>
                {!it.img && it.chapter && (
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: LIME, opacity: 0.7, marginBottom: 4 }}>{it.chapter}</div>
                )}
                <div style={{ fontSize: 13, fontWeight: 700, color: INK, lineHeight: 1.3, marginBottom: it.desc ? 5 : 0 }}>{it.title}</div>
                {it.desc && <div style={{ fontSize: 11.5, color: MUTED, lineHeight: 1.6 }}>{it.desc}</div>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </DContainer>
  );
}

// ─── Stats strip (trip highlights) ──────────────────────────────────────────

function StatsStrip({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const nights = pkg.nights ? Number(pkg.nights) : null;
  const cells: { v: string; l: string }[] = [];
  if (nights) cells.push({ v: `${nights}${t.daysUnit[0]}`, l: t.tripLengthLabel });
  if (pkg.totalSpots) cells.push({ v: String(pkg.totalSpots), l: t.maxCrewLabel });
  if (pkg.rating != null) cells.push({ v: String(pkg.rating), l: `${pkg.reviewCount ?? ""} ${t.reviewsLabel}`.trim() });
  if (pkg.spotsRemaining != null) cells.push({ v: String(pkg.spotsRemaining), l: t.spotsLeft });
  if (!cells.length) return null;

  return (
    <div style={{
      display: "flex", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`,
    }}>
      {cells.map((c, i) => (
        <div key={i} style={{
          flex: 1, padding: "14px 18px", textAlign: "center" as const,
          borderRight: i < cells.length - 1 ? `1px solid ${BORDER}` : "none",
        }}>
          <div style={{ fontFamily: ARCH, fontSize: 26, color: INK, lineHeight: 1, letterSpacing: "-0.5px" }}>{c.v}</div>
          <div style={{ fontSize: 10, color: SMUTED, marginTop: 4, textTransform: "uppercase" as const, letterSpacing: "0.6px" }}>{c.l}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Poster price card (mobile) ──────────────────────────────────────────────

function PosterCard({ pkg, lang, onWhatsApp }: { pkg: TPageProps["pkg"]; lang: TPageProps["lang"]; onWhatsApp: () => void }) {
  const t = T[lang];
  const isRtl = lang === "ar";
  const nextDep = (pkg.departures ?? [])[0];

  return (
    <div style={{
      margin: "16px 18px",
      background: "rgba(255,255,255,0.05)",
      border: `1px solid ${BORDER}`,
      borderRadius: 18, padding: "20px 20px",
      direction: isRtl ? "rtl" : "ltr",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, color: SMUTED }}>
          {t.allInPerCrewLabel}
        </div>
        {pkg.spotsRemaining != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 12, color: LIME, fontWeight: 700 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: LIME, display: "inline-block" }} />
            {lang === "ar" ? `${pkg.spotsRemaining} ${t.spotsLeft}` : `Only ${pkg.spotsRemaining} spots`}
          </div>
        )}
      </div>
      <div style={{ fontFamily: ARCH, fontSize: 44, color: LIME, letterSpacing: "-1.5px", lineHeight: 1, marginBottom: 6 }}>
        {pkg.price}
      </div>
      {nextDep && (
        <div style={{ fontSize: 12, color: SMUTED, marginBottom: 16 }}>
          {lang === "ar" ? `يغادر ${nextDep.date}` : `Departs ${nextDep.date}`}
        </div>
      )}
      <WAButton label={t.getOnTripLabel} full onClick={onWhatsApp} />
    </div>
  );
}

// ─── Crew lead panel ─────────────────────────────────────────────────────────

function CrewLeadPanel({ pkg, agency, lang, onWhatsApp }: {
  pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; lang: TPageProps["lang"]; onWhatsApp: () => void;
}) {
  const t = T[lang];
  const agent = pkg.agent;
  if (!agent) return null;
  const isRtl = lang === "ar";

  return (
    <section style={{
      background: `${LIME}14`,
      borderTop: `1px solid ${LIME}25`,
      padding: "36px 18px 40px",
      direction: isRtl ? "rtl" : "ltr",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: LIME, marginBottom: 18 }}>
        {t.crewLeadLabel} · {agency.name}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
        {agent.avatar
          ? <img src={agent.avatar} alt={agent.name} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${LIME}40` }} />
          : <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${LIME}22`, border: `1px solid ${LIME}40`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ARCH, fontSize: 24, color: LIME, flexShrink: 0 }}>{agent.name[0]}</div>
        }
        <div>
          <div style={{ fontFamily: ARCH, fontSize: 19, color: INK, lineHeight: 1.15, marginBottom: 3 }}>
            {lang === "ar" ? `أهلاً، أنا ${agent.name}` : `Hi, I'm ${agent.name}.`}
          </div>
          <div style={{ fontSize: 12, color: MUTED }}>
            {agent.role}{agent.years ? ` · ${agent.years} ${t.yearsExpSuffix}` : ""}
          </div>
        </div>
      </div>
      {agent.repliesIn && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, fontSize: 12, color: LIME }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
          {t.agentOnlineLabel}
        </div>
      )}
      <WAButton
        label={`${lang === "ar" ? "واتساب مع" : "WhatsApp"} ${agent.name.split(" ")[0]}`}
        size="lg" onClick={onWhatsApp}
      />
    </section>
  );
}

function CrewLeadPanelDesktop({ pkg, agency, lang, onWhatsApp }: {
  pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; lang: TPageProps["lang"]; onWhatsApp: () => void;
}) {
  const t = T[lang];
  const agent = pkg.agent;
  if (!agent) return null;
  const isRtl = lang === "ar";

  return (
    <section style={{
      background: `${LIME}10`,
      borderTop: `1px solid ${LIME}20`,
      direction: isRtl ? "rtl" : "ltr",
    }}>
      <div style={{
        maxWidth: 1180, margin: "0 auto",
        display: "grid", gridTemplateColumns: isRtl ? "3fr 2fr" : "2fr 3fr",
        minHeight: 420, overflow: "hidden",
      }}>
        {/* Portrait */}
        <div style={{
          position: "relative", overflow: "hidden",
          background: `${LIME}15`, order: isRtl ? 2 : 1,
        }}>
          {agent.avatar
            ? <img src={agent.avatar} alt={agent.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ARCH, fontSize: 100, color: LIME, opacity: 0.2 }}>{agent.name[0]}</div>
          }
        </div>
        {/* Content */}
        <div style={{ padding: "64px 64px", display: "flex", flexDirection: "column", justifyContent: "center", order: isRtl ? 1 : 2 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: LIME, marginBottom: 14 }}>
            {t.crewLeadLabel} · {agency.name}
          </div>
          <div style={{ fontFamily: ARCH, fontSize: 44, color: INK, lineHeight: 1.05, letterSpacing: "-1px", marginBottom: 6 }}>
            {lang === "ar" ? `أهلاً،\nأنا ${agent.name}.` : `Hi, I'm\n${agent.name}.`}
          </div>
          <div style={{ fontSize: 13, color: MUTED, marginBottom: 24 }}>
            {agent.role}{agent.years ? ` · ${agent.years} ${t.yearsExpSuffix}` : ""}
            {agent.repliesIn ? ` · ${t.repliesInLabel} ${agent.repliesIn}` : ""}
          </div>
          {agent.repliesIn && (
            <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 28, fontSize: 12.5, color: LIME, fontWeight: 600 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
              {t.agentOnlineLabel}
            </div>
          )}
          <div style={{ display: "flex", gap: 12 }}>
            <WAButton
              label={`${lang === "ar" ? "واتساب مع" : "WhatsApp"} ${agent.name.split(" ")[0]}`}
              size="lg" onClick={onWhatsApp}
            />
            <button style={{
              background: "transparent", border: `1px solid ${LIME}40`,
              borderRadius: 100, padding: "14px 22px", color: LIME, fontSize: 14,
              fontFamily: "inherit", cursor: "pointer",
            }}>
              {t.scheduleCallLabel}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── TemplateVoyagePage ──────────────────────────────────────────────────────

export function TemplateVoyagePage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const tokens: TemplateTokens = {
    bg: COAL, ink: INK, muted: MUTED, superMuted: SMUTED, border: BORDER, brand: LIME, serif: ARCH, dark: true,
  };

  const nights     = pkg.nights ? Number(pkg.nights) : null;
  const coverImage = pkg.coverImage || "";
  const title      = pkg.title || pkg.destination;
  const isRtl      = lang === "ar";
  const itinerary  = (pkg.itinerary || []).filter(it => it.title?.trim());
  const includes   = pkg.includes?.length ? pkg.includes : (pkg.advantages || []);
  const isDesktop  = useIsDesktop();

  const navLinks = [
    ...(itinerary.length ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...(includes.length ? [{ label: t.navIncluded, href: "#included" }] : []),
    ...((pkg.pricingTiers || []).some(t2 => t2.price) ? [{ label: t.navPricing, href: "#pricing" }] : []),
  ];

  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: COAL, color: INK, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={LIME} navLinks={navLinks} lang={lang} dark onWhatsApp={onWhatsApp} />

        {/* Social proof ticker */}
        <SocialProofTicker pkg={pkg} lang={lang} style={{ padding: "9px 80px" }} />

        {/* Hero: type-heavy left, image right */}
        <DContainer style={{ padding: "56px 80px 40px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "stretch", minHeight: 520 }}>
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", order: isRtl ? 2 : 1 }}>
              {nights && (
                <div style={{ fontFamily: ARCH, fontSize: 128, fontWeight: 400, lineHeight: 0.85, letterSpacing: "-4px", color: INK }}>
                  {nights}<span style={{ fontSize: 52, color: MUTED }}> {t.daysUnit}</span>
                </div>
              )}
              <div style={{ fontFamily: ARCH, fontSize: 80, fontWeight: 400, lineHeight: 0.92, letterSpacing: "-3px", color: INK, marginTop: nights ? 6 : 0 }}>
                {pkg.destination?.split(",")[0]}
              </div>
              <div style={{ fontFamily: ARCH, fontSize: 80, fontWeight: 400, lineHeight: 0.92, letterSpacing: "-3px", color: LIME }}>
                {t.awaitsLabel}
              </div>
              <p style={{ fontSize: 15.5, color: MUTED, marginTop: 28, lineHeight: 1.55, maxWidth: 440 }}>{pkg.description}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 28 }}>
                <div style={{ fontFamily: ARCH, fontSize: 44, color: LIME, letterSpacing: "-1px", lineHeight: 1 }}>{pkg.price}</div>
                <div style={{ fontSize: 12, color: SMUTED, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{t.perPerson}</div>
              </div>
              {pkg.spotsRemaining != null && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 8, fontSize: 13, color: LIME, fontWeight: 700 }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: LIME, display: "inline-block" }} />
                  {lang === "ar" ? `${pkg.spotsRemaining} ${t.spotsLeft}` : `Only ${pkg.spotsRemaining} spots left`}
                </div>
              )}
              <div style={{ marginTop: 22 }}>
                <WAButton label={t.getOnTripLabel} size="lg" onClick={onWhatsApp} />
              </div>
            </div>
            <div style={{ position: "relative", borderRadius: 24, overflow: "hidden", minHeight: 420, order: isRtl ? 1 : 2 }}>
              {coverImage
                ? <img src={coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${LIME}44, ${COAL})` }} />
              }
            </div>
          </div>
        </DContainer>

        {/* Stats strip */}
        <StatsStrip pkg={pkg} lang={lang} />

        {/* Includes 4-col */}
        {includes.length > 0 && (
          <DContainer id="included" style={{ padding: "48px 80px 56px" }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: LIME, marginBottom: 20 }}>
              {t.includedLabel}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
              {includes.slice(0, 8).map((item, i) => (
                <div key={i} style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "14px 14px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <span style={{ color: LIME, fontSize: 12, marginTop: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 13, color: MUTED, lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>
          </DContainer>
        )}

        <TicketItineraryDesktop itinerary={itinerary} lang={lang} />

        <DynamicSectionsDesktop pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} skip={["itinerary"]} />
        <ReviewsSectionDesktop pkg={pkg} tokens={tokens} lang={lang} agency={agency} />

        {/* Crew lead closing panel */}
        <CrewLeadPanelDesktop pkg={pkg} agency={agency} lang={lang} onWhatsApp={onWhatsApp} />

        <SharedCTABannerDesktop pkg={pkg} agency={agency} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} onMessenger={onMessenger} />
        <DesktopFooter agency={agency} brand={LIME} dark />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: COAL, color: INK, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
      <AgencyBar agency={agency} price={pkg.price} brand={LIME} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} dark />

      {/* Social proof ticker */}
      <SocialProofTicker pkg={pkg} lang={lang} />

      {/* Hero */}
      <div style={{ padding: "0 18px" }}>
        <div style={{ position: "relative", height: 400, borderRadius: 22, overflow: "hidden" }}>
          {coverImage
            ? <img src={coverImage} alt={pkg.destination} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${LIME}44, ${COAL})` }} />
          }
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 20%, rgba(0,0,0,0.78) 100%)" }} />

          {/* Meta row */}
          <div style={{ position: "absolute", top: 14, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "1px", textTransform: "uppercase" as const }}>
              {pkg.destination}
            </div>
            {pkg.spotsRemaining != null && pkg.totalSpots != null && (
              <div style={{ fontSize: 11, color: LIME, fontWeight: 700 }}>
                {pkg.spotsRemaining}/{pkg.totalSpots} {t.spotsLeft}
              </div>
            )}
          </div>

          {/* Oversized nights + destination */}
          <div style={{ position: "absolute", bottom: 18, left: 20, right: 20 }}>
            {nights && (
              <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 2 }}>
                <span style={{ fontFamily: ARCH, fontSize: 64, color: LIME, lineHeight: 1, letterSpacing: "-2px" }}>{nights}</span>
                <span style={{ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.65)", letterSpacing: "-0.4px" }}>{t.nightsLabel}</span>
              </div>
            )}
            <div style={{ fontFamily: ARCH, fontSize: 36, color: INK, lineHeight: 1.05, letterSpacing: "-1.2px" }}>{pkg.destination}</div>
          </div>
        </div>
      </div>

      {/* Stats strip */}
      <StatsStrip pkg={pkg} lang={lang} />

      {/* Poster price card */}
      <PosterCard pkg={pkg} lang={lang} onWhatsApp={onWhatsApp} />

      {/* Description */}
      {pkg.description && (
        <div style={{ padding: "0 18px 4px" }}>
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65, margin: 0 }}>{pkg.description}</p>
        </div>
      )}

      {/* Includes strip */}
      {includes.length > 0 && (
        <div id="included" style={{ padding: "22px 18px 0", scrollMarginTop: 88 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.6px", textTransform: "uppercase" as const, color: LIME, marginBottom: 12 }}>{t.includedLabel}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {includes.slice(0, 6).map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: LIME, fontSize: 13, marginTop: 1, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: MUTED, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ticket-stub itinerary */}
      <TicketItinerary itinerary={itinerary} lang={lang} />

      <DynamicSections pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} skip={["itinerary"]} />
      <ReviewsSection pkg={pkg} tokens={tokens} lang={lang} agency={agency} />

      {/* Crew lead closing panel */}
      <CrewLeadPanel pkg={pkg} agency={agency} lang={lang} onWhatsApp={onWhatsApp} />

      <div style={{ padding: "0 18px 28px" }}>
        <SharedCTABanner pkg={pkg} agency={agency} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} onMessenger={onMessenger} />
      </div>

      <SharedFooter agency={agency} tokens={tokens} />
      <StickyCTA price={pkg.price} nights={nights} label={t.bookWhatsApp} dark onWhatsApp={onWhatsApp} lang={lang} />
    </div>
  );
}

// ─── TemplateVoyageCard ──────────────────────────────────────────────────────

export function TemplateVoyageCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
