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
  TrustStrip,
} from "./shared";
import type { TPageProps, TCardProps, TemplateTokens } from "./types";

const SAGE   = "#1a5d4a";
const BONE   = "#f7f4ed";
const INK    = "#0d1b2e";
const MUTED  = "rgba(13,27,46,0.55)";
const SMUTED = "rgba(13,27,46,0.35)";
const BORDER = "rgba(13,27,46,0.08)";
const SERIF  = "var(--font-cormorant, serif)";

// ─── Prayer times card ────────────────────────────────────────────────────────

function PrayerTimesCard({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const pt = pkg.prayerTimes;
  const isRtl = lang === "ar";

  const prayers: { key: keyof NonNullable<typeof pt>; label: string }[] = [
    { key: "fajr",    label: t.fajr },
    { key: "dhuhr",   label: t.dhuhr },
    { key: "asr",     label: t.asr },
    { key: "maghrib", label: t.maghrib },
    { key: "isha",    label: t.isha },
  ];

  // Show card even without times — spiritual context is the value
  return (
    <div style={{
      background: `${SAGE}08`, border: `1px solid ${SAGE}25`,
      borderRadius: 16, padding: "18px 18px",
      direction: isRtl ? "rtl" : "ltr",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: SAGE, marginBottom: 14 }}>
        {t.prayerTimesTitle}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 6 }}>
        {prayers.map(({ key, label }) => (
          <div key={key} style={{ textAlign: "center" as const, padding: "10px 4px", background: "#fff", borderRadius: 10, border: `1px solid ${BORDER}` }}>
            <div style={{ fontFamily: SERIF, fontSize: 12, color: SAGE, fontWeight: 600, marginBottom: pt?.[key] ? 4 : 0 }}>{label}</div>
            {pt?.[key] && (
              <div style={{ fontSize: 11, color: INK, fontWeight: 700 }}>{pt[key]}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Trust items for Sakina ───────────────────────────────────────────────────

function buildSakinaTrustItems(t: typeof T["en"]) {
  const shieldSvg = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
  const waSvg = <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>;
  const checkSvg = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>;
  const homeSvg = <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;

  return [
    { icon: shieldSvg, title: t.trustMinistryLicensed, sub: t.trustMinistryLicensedSub },
    { icon: checkSvg,  title: t.trustVisaAssistance,   sub: t.trustVisaAssistanceSub },
    { icon: homeSvg,   title: t.trustSameMosque,       sub: t.trustSameMosqueSub },
    { icon: waSvg,     title: t.bookWhatsApp,           sub: t.trustPayWhatsAppSub },
  ];
}

// ─── MutawifBand (mid-page light) ────────────────────────────────────────────

function MutawifBand({ pkg, tokens, lang, onWhatsApp }: { pkg: TPageProps["pkg"]; tokens: TemplateTokens; lang: TPageProps["lang"]; onWhatsApp: () => void }) {
  const t = T[lang];
  const agent = pkg.agent;
  if (!agent) return null;
  const isRtl = lang === "ar";
  return (
    <div style={{
      margin: "0 18px",
      background: `${SAGE}0c`, border: `1px solid ${SAGE}30`,
      borderRadius: 16, padding: "20px 20px",
      display: "flex", gap: 16, alignItems: "center",
      direction: isRtl ? "rtl" : "ltr",
    }}>
      {agent.avatar
        ? <img src={agent.avatar} alt={agent.name} style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        : (
          <div style={{
            width: 56, height: 56, borderRadius: "50%", flexShrink: 0,
            background: `${SAGE}18`, border: `1px solid ${SAGE}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: SERIF, fontSize: 24, color: SAGE,
          }}>
            {agent.name[0]}
          </div>
        )
      }
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: SAGE, marginBottom: 4 }}>
          {t.mutawifLabel}
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: INK, lineHeight: 1.1, marginBottom: 3 }}>{agent.name}</div>
        <div style={{ fontSize: 12, color: MUTED }}>
          {agent.role}{agent.years ? ` · ${agent.years} ${t.yearsExpSuffix}` : ""}
        </div>
      </div>
      <WAButton label={t.whatsAppTheOffice} size="sm" onClick={onWhatsApp} />
    </div>
  );
}

// ─── Mutawif dark closing panel ───────────────────────────────────────────────

function MutawifClosingPanel({ pkg, agency, lang, onWhatsApp }: {
  pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; lang: TPageProps["lang"]; onWhatsApp: () => void;
}) {
  const t = T[lang];
  const agent = pkg.agent;
  if (!agent) return null;
  const isRtl = lang === "ar";

  return (
    <section style={{
      background: SAGE, color: "#fff",
      padding: "40px 20px 44px",
      direction: isRtl ? "rtl" : "ltr",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.65)", marginBottom: 20 }}>
        {t.mutawifLabel} · {agency.name}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
        {agent.avatar
          ? <img src={agent.avatar} alt={agent.name} style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(255,255,255,0.3)" }} />
          : <div style={{ width: 68, height: 68, borderRadius: "50%", background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 28, color: "#fff", flexShrink: 0 }}>{agent.name[0]}</div>
        }
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 600, lineHeight: 1.1, marginBottom: 3 }}>{agent.name}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)" }}>
            {agent.role}{agent.years ? ` · ${agent.years} ${t.yearsExpSuffix}` : ""}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 22, flexWrap: "wrap" as const }}>
        <span style={{ background: "rgba(255,255,255,0.18)", borderRadius: 100, padding: "5px 12px", fontSize: 11, fontWeight: 700 }}>
          ✓ {t.hajjCertifiedLabel}
        </span>
        {agent.repliesIn && (
          <span style={{ background: "rgba(255,255,255,0.18)", borderRadius: 100, padding: "5px 12px", fontSize: 11, display: "flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            {t.agentOnlineLabel}
          </span>
        )}
      </div>
      <WAButton label={t.whatsAppTheOffice} size="lg" onClick={onWhatsApp} />
    </section>
  );
}

function MutawifClosingPanelDesktop({ pkg, agency, lang, onWhatsApp }: {
  pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; lang: TPageProps["lang"]; onWhatsApp: () => void;
}) {
  const t = T[lang];
  const agent = pkg.agent;
  if (!agent) return null;
  const isRtl = lang === "ar";

  return (
    <section style={{ background: SAGE, color: "#fff", direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{
        maxWidth: 1180, margin: "0 auto",
        display: "grid", gridTemplateColumns: isRtl ? "3fr 2fr" : "2fr 3fr",
        minHeight: 460, overflow: "hidden",
      }}>
        <div style={{ position: "relative", overflow: "hidden", background: `rgba(0,0,0,0.15)`, order: isRtl ? 2 : 1 }}>
          {agent.avatar
            ? <img src={agent.avatar} alt={agent.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.9 }} />
            : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 100, color: "rgba(255,255,255,0.2)" }}>{agent.name[0]}</div>
          }
        </div>
        <div style={{ padding: "64px 64px", display: "flex", flexDirection: "column", justifyContent: "center", order: isRtl ? 1 : 2 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.6)", marginBottom: 16 }}>
            {t.mutawifLabel} · {agency.name}
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 48, fontWeight: 600, lineHeight: 1, marginBottom: 8 }}>{agent.name}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)", marginBottom: 24 }}>
            {agent.role}{agent.years ? ` · ${agent.years} ${t.yearsExpSuffix}` : ""}
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap" as const }}>
            <span style={{ background: "rgba(255,255,255,0.18)", borderRadius: 100, padding: "6px 14px", fontSize: 12, fontWeight: 700 }}>
              ✓ {t.hajjCertifiedLabel}
            </span>
            {agent.repliesIn && (
              <span style={{ background: "rgba(255,255,255,0.18)", borderRadius: 100, padding: "6px 14px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
                {t.agentOnlineLabel}
              </span>
            )}
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <WAButton label={t.whatsAppTheOffice} size="lg" onClick={onWhatsApp} />
            <button style={{
              background: "rgba(255,255,255,0.12)", border: "1px solid rgba(255,255,255,0.25)",
              borderRadius: 100, padding: "14px 24px", color: "#fff", fontSize: 14,
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

// ─── Logistical facts strip ───────────────────────────────────────────────────

function LogisticsStrip({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const nights   = pkg.nights ? Number(pkg.nights) : null;
  const airports = (pkg.airports || []).filter(a => a.name?.trim());
  const items = [
    { l: t.fieldDestination,  v: pkg.destination },
    ...(nights ? [{ l: t.logisticsDuration, v: `${nights} ${t.nightsLabel}` }] : []),
    ...(airports[0] ? [{ l: t.logisticsFlight, v: airports[0].name }] : []),
    ...(pkg.hotelDescription ? [{ l: t.logisticsHotel, v: pkg.hotelDescription.slice(0, 28) + "…" }] : []),
  ].slice(0, 4);
  if (!items.length) return null;
  return (
    <div style={{ padding: "18px 18px 0", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
      {items.map((it, i) => (
        <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 14px" }}>
          <div style={{ fontSize: 9.5, color: SMUTED, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 5 }}>{it.l}</div>
          <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, color: INK, lineHeight: 1.2 }}>{it.v}</div>
        </div>
      ))}
    </div>
  );
}

// ─── TemplateSakinaPage ───────────────────────────────────────────────────────

export function TemplateSakinaPage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const tokens: TemplateTokens = {
    bg: BONE, ink: INK, muted: MUTED, superMuted: SMUTED, border: BORDER, brand: SAGE, serif: SERIF,
  };

  const nights     = pkg.nights ? Number(pkg.nights) : null;
  const coverImage = pkg.coverImage || "";
  const title      = pkg.title || pkg.destination;
  const isRtl      = lang === "ar";
  const itinerary  = (pkg.itinerary || []).filter(it => it.title?.trim());
  const airports   = (pkg.airports || []).filter(a => a.name?.trim());
  const isDesktop  = useIsDesktop();
  const trustItems = buildSakinaTrustItems(t);

  const logisticsItems = [
    { l: t.fieldDestination, v: pkg.destination },
    ...(nights ? [{ l: t.logisticsDuration, v: `${nights} ${t.nightsLabel}` }] : []),
    ...(airports[0] ? [{ l: t.logisticsFlight, v: airports[0].name }] : []),
    ...(pkg.hotelDescription ? [{ l: t.logisticsHotel, v: pkg.hotelDescription.slice(0, 30) + "…" }] : []),
    { l: t.visaSupport, v: t.includedLabel },
  ].slice(0, 5);

  const navLinks = [
    ...(itinerary.length ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...((pkg.includes?.length || (pkg.advantages || []).length) ? [{ label: t.navIncluded, href: "#included" }] : []),
    ...((pkg.pricingTiers || []).some(t2 => t2.price) ? [{ label: t.navPricing, href: "#pricing" }] : []),
  ];

  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: BONE, color: INK, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={SAGE} navLinks={navLinks} lang={lang} onWhatsApp={onWhatsApp} />

        {/* Hero: text LEFT, arch image RIGHT (design-correct) */}
        <DContainer style={{ padding: "64px 80px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 64, alignItems: "center" }}>
            {/* Text column — left */}
            <div style={{ order: isRtl ? 2 : 1 }}>
              <Eyebrow text={t.spiritualJourney} brand={SAGE} />
              <h1 style={{ fontFamily: SERIF, fontSize: 60, fontWeight: 600, lineHeight: 1.02, letterSpacing: "-0.8px", marginTop: 18, marginBottom: 20, color: INK }}>
                {title}
              </h1>
              <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.72, margin: "0 0 28px" }}>{pkg.description}</p>
              <div style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 400, color: SAGE, letterSpacing: "-0.8px", marginBottom: 6, lineHeight: 1 }}>{pkg.price}</div>
              <div style={{ fontSize: 12, color: SMUTED, marginBottom: 24 }}>{nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.perPerson}</div>
              <WAButton label={t.whatsAppTheOffice} size="lg" onClick={onWhatsApp} />
            </div>
            {/* Arch image column — right */}
            <div style={{ position: "relative", height: 540, borderRadius: "220px 220px 16px 16px", overflow: "hidden", background: INK, order: isRtl ? 1 : 2 }}>
              {coverImage
                ? <img src={coverImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${SAGE}cc, ${SAGE}55)` }} />
              }
              <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0) 50%, rgba(0,0,0,0.32))" }} />
            </div>
          </div>
        </DContainer>

        {/* Trust strip */}
        <TrustStrip
          items={trustItems}
          ink={INK} mutedColor={MUTED} borderColor={BORDER} iconAccent={SAGE}
          layout="row"
          style={{ padding: "20px 80px" }}
        />

        {/* Logistics 5-col */}
        {logisticsItems.length > 0 && (
          <DContainer style={{ padding: "24px 80px 48px" }}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${logisticsItems.length}, 1fr)`, gap: 12 }}>
              {logisticsItems.map((it, i) => (
                <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 16px" }}>
                  <div style={{ fontSize: 10, color: SMUTED, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 6 }}>{it.l}</div>
                  <div style={{ fontFamily: SERIF, fontSize: 16, fontWeight: 600, lineHeight: 1.2, color: INK }}>{it.v}</div>
                </div>
              ))}
            </div>
          </DContainer>
        )}

        {/* Prayer times card */}
        <DContainer style={{ padding: "0 80px 48px" }}>
          <PrayerTimesCard pkg={pkg} lang={lang} />
        </DContainer>

        {/* Mutawif mid-page band */}
        <DContainer style={{ padding: "0 80px 64px" }}>
          <div style={{
            background: `${SAGE}0a`, border: `1px solid ${SAGE}25`,
            borderRadius: 18, padding: "28px 32px",
            display: "flex", gap: 24, alignItems: "center",
          }}>
            {pkg.agent?.avatar
              ? <img src={pkg.agent.avatar} alt={pkg.agent.name} style={{ width: 68, height: 68, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              : <div style={{ width: 68, height: 68, borderRadius: "50%", flexShrink: 0, background: `${SAGE}18`, border: `1px solid ${SAGE}40`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 28, color: SAGE }}>
                  {pkg.agent?.name[0] ?? "م"}
                </div>
            }
            {pkg.agent && (
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: SAGE, marginBottom: 6 }}>{t.mutawifLabel}</div>
                <div style={{ fontFamily: SERIF, fontSize: 26, fontWeight: 600, color: INK, lineHeight: 1.1, marginBottom: 4 }}>{pkg.agent.name}</div>
                <div style={{ fontSize: 13, color: MUTED }}>{pkg.agent.role}{pkg.agent.years ? ` · ${pkg.agent.years} ${t.yearsExpSuffix}` : ""}</div>
              </div>
            )}
            <WAButton label={t.whatsAppTheOffice} size="lg" onClick={onWhatsApp} />
          </div>
        </DContainer>

        <DynamicSectionsDesktop pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
        <ReviewsSectionDesktop pkg={pkg} tokens={tokens} lang={lang} agency={agency} />

        {/* Mutawif dark closing panel */}
        <MutawifClosingPanelDesktop pkg={pkg} agency={agency} lang={lang} onWhatsApp={onWhatsApp} />

        <SharedCTABannerDesktop pkg={pkg} agency={agency} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} onMessenger={onMessenger} />
        <DesktopFooter agency={agency} brand={SAGE} />
      </div>
    );
  }

  // ── Mobile ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: BONE, color: INK, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
      <AgencyBar agency={agency} price={pkg.price} brand={SAGE} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} />

      {/* Arched hero */}
      <div style={{ padding: "0 18px" }}>
        <div style={{ position: "relative", height: 420, borderRadius: "200px 200px 16px 16px", overflow: "hidden", background: INK }}>
          {coverImage
            ? <img src={coverImage} alt={pkg.destination} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${SAGE}cc, ${SAGE}55)` }} />
          }
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 50%, rgba(0,0,0,0.55))" }} />
          <div style={{ position: "absolute", bottom: 20, left: 20, right: 20, textAlign: "center" as const }}>
            <Eyebrow text={t.spiritualJourney} brand={SAGE} light />
          </div>
        </div>
      </div>

      {/* Title + price card */}
      <div style={{ padding: "0 18px" }}>
        <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 6px 32px rgba(13,27,46,0.10)", padding: "22px 22px 20px", marginTop: -28, position: "relative", zIndex: 2 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 600, color: INK, lineHeight: 1.12, letterSpacing: "-0.4px", margin: "0 0 10px" }}>
            {title}
          </h1>
          <div style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 400, color: SAGE, lineHeight: 1, letterSpacing: "-0.8px", marginBottom: 5 }}>{pkg.price}</div>
          <div style={{ fontSize: 12, color: SMUTED, marginBottom: 18 }}>{nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.perPerson}</div>
          <WAButton label={t.whatsAppTheOffice} full onClick={onWhatsApp} />
        </div>
      </div>

      {/* Trust strip */}
      <div style={{ overflowX: "auto", display: "flex", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, marginTop: 16, msOverflowStyle: "none" } as React.CSSProperties}>
        {trustItems.map((item, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "12px 16px",
            borderRight: isRtl ? "none" : (i < trustItems.length - 1 ? `1px solid ${BORDER}` : "none"),
            borderLeft:  isRtl ? (i < trustItems.length - 1 ? `1px solid ${BORDER}` : "none") : "none",
            flexShrink: 0, fontSize: 11.5, fontWeight: 600, color: INK, whiteSpace: "nowrap" as const,
          }}>
            <span style={{ color: SAGE, display: "flex" }}>{item.icon}</span>
            {item.title}
          </div>
        ))}
      </div>

      {/* Logistics facts */}
      <LogisticsStrip pkg={pkg} lang={lang} />

      {/* Description */}
      {pkg.description && (
        <div style={{ padding: "18px 18px 0" }}>
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.75, margin: 0 }}>{pkg.description}</p>
        </div>
      )}

      {/* Prayer times card */}
      <div style={{ padding: "18px 18px 0" }}>
        <PrayerTimesCard pkg={pkg} lang={lang} />
      </div>

      {/* Mutawif band */}
      <div style={{ marginTop: 20 }}>
        <MutawifBand pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
      </div>

      {/* Departure group dates */}
      {airports.length > 0 && (
        <section id="departures" style={{ padding: "22px 18px 0", scrollMarginTop: 88 }}>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, color: SAGE, marginBottom: 12 }}>
            {t.groupDepartures}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {airports.map((a, i) => (
              <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: INK }}>{a.name}{a.arrivingAirport ? ` → ${a.arrivingAirport}` : ""}</div>
                  {a.date && <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{a.date}</div>}
                </div>
                <div style={{ fontFamily: SERIF, fontSize: 20, color: SAGE, fontWeight: 400 }}>{a.price}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <DynamicSections pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
      <ReviewsSection pkg={pkg} tokens={tokens} lang={lang} agency={agency} />

      {/* Mutawif dark closing panel */}
      <MutawifClosingPanel pkg={pkg} agency={agency} lang={lang} onWhatsApp={onWhatsApp} />

      <div style={{ padding: "0 18px 28px" }}>
        <SharedCTABanner pkg={pkg} agency={agency} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} onMessenger={onMessenger} />
      </div>

      <SharedFooter agency={agency} tokens={tokens} />
      <StickyCTA price={pkg.price} nights={nights} label={t.whatsAppTheOffice} onWhatsApp={onWhatsApp} lang={lang} />
    </div>
  );
}

// ─── TemplateSakinaCard ───────────────────────────────────────────────────────

export function TemplateSakinaCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
