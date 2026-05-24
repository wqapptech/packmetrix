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

const BRAND  = "#8a6a3a";
const SERIF  = "var(--font-instrument-serif, var(--font-cormorant), serif)";
const BONE   = "#f5f1ea";
const INK    = "#1a1208";
const MUTED  = "rgba(26,18,8,0.52)";
const SMUTED = "rgba(26,18,8,0.32)";
const BORDER = "rgba(26,18,8,0.08)";

// ─── SVG icons (inline, reused across components) ────────────────────────────

const ShieldIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);
const WaIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);
const SparkIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
  </svg>
);
const CheckIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const EyeIcon = (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
  </svg>
);
const ClockIcon = (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

// ─── AgentBand — travel designer strip (mid-page) ────────────────────────────

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

// ─── Scarcity ribbon (desktop, below hero) ───────────────────────────────────

function ScarcityRibbon({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const isRtl = lang === "ar";
  if (pkg.spotsRemaining == null && pkg.viewersNow == null && !pkg.recentBookings) return null;
  return (
    <div style={{
      background: INK, color: "#fff", padding: "10px 80px",
      display: "flex", alignItems: "center", gap: 28, fontSize: 12.5,
      direction: isRtl ? "rtl" : "ltr",
    }}>
      {pkg.spotsRemaining != null && pkg.totalSpots != null && (
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: BRAND, display: "inline-block", flexShrink: 0 }} />
          {lang === "ar"
            ? <span><b>{pkg.spotsRemaining}</b> من <b>{pkg.totalSpots}</b> فيلا فقط متاحة</span>
            : <span>Only <b>{pkg.spotsRemaining} of {pkg.totalSpots}</b> villas left</span>}
        </div>
      )}
      {pkg.viewersNow != null && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "rgba(255,255,255,0.65)", display: "flex" }}>{EyeIcon}</span>
          <b>{pkg.viewersNow}</b>&nbsp;{t.viewersNow}
        </div>
      )}
      {pkg.recentBookings && (
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "rgba(255,255,255,0.65)", display: "flex" }}>{ClockIcon}</span>
          {t.lastBookedLabel}&nbsp;<b>{pkg.recentBookings.hoursAgo}&nbsp;{t.hoursAgoSuffix}</b>
        </div>
      )}
      <div style={{ flex: 1 }} />
      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 3 }}>
        {t.seeDeparturesLabel} →
      </span>
    </div>
  );
}

// ─── Trust strip items helper ─────────────────────────────────────────────────

function buildTrustItems(t: typeof T["en"], agent?: TPageProps["pkg"]["agent"]) {
  const items: { icon: React.ReactNode; title: string; sub: string }[] = [
    { icon: ShieldIcon, title: t.freeCancellation, sub: t.trustFreeCancellationSub },
    { icon: WaIcon,     title: t.bookWhatsApp,     sub: t.trustPayWhatsAppSub },
    { icon: SparkIcon,  title: t.trustCurated,     sub: t.trustCuratedSub },
  ];
  if (agent?.years) {
    items.push({ icon: CheckIcon, title: `${agent.years} ${t.yearsExpSuffix}`, sub: "" });
  }
  return items;
}

// ─── Mobile trust strip (horizontal scroll) ──────────────────────────────────

function MobileTrustStrip({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const isRtl = lang === "ar";
  const items = buildTrustItems(t, pkg.agent);
  return (
    <div style={{
      overflowX: "auto", display: "flex",
      borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`,
      direction: isRtl ? "rtl" : "ltr",
      // hide scrollbar
      msOverflowStyle: "none",
    } as React.CSSProperties}>
      {items.map((item, i) => (
        <div key={i} style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "13px 16px",
          borderRight: isRtl ? "none" : (i < items.length - 1 ? `1px solid ${BORDER}` : "none"),
          borderLeft:  isRtl ? (i < items.length - 1 ? `1px solid ${BORDER}` : "none") : "none",
          flexShrink: 0, fontSize: 11.5, fontWeight: 600, color: INK, whiteSpace: "nowrap" as const,
        }}>
          <span style={{ color: BRAND, display: "flex", alignItems: "center" }}>{item.icon}</span>
          {item.title}
        </div>
      ))}
    </div>
  );
}

// ─── Dark designer panel — mobile ────────────────────────────────────────────

function AuroraDesignerPanel({ pkg, agency, lang, onWhatsApp }: {
  pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; lang: TPageProps["lang"]; onWhatsApp: () => void;
}) {
  const t = T[lang];
  const agent = pkg.agent;
  if (!agent) return null;
  const isRtl = lang === "ar";

  return (
    <section style={{
      background: INK, color: "#fff",
      padding: "40px 20px 44px",
      direction: isRtl ? "rtl" : "ltr",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: BRAND, marginBottom: 20 }}>
        {t.curatedByLabel}
        {agency.name ? ` · ${agency.name}` : ""}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 20 }}>
        {agent.avatar
          ? <img src={agent.avatar} alt={agent.name} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
          : <div style={{ width: 64, height: 64, borderRadius: "50%", background: `${BRAND}33`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 26, color: BRAND, flexShrink: 0 }}>{agent.name[0]}</div>
        }
        <div>
          <div style={{ fontFamily: SERIF, fontSize: 22, fontWeight: 400, lineHeight: 1.1, marginBottom: 3, fontStyle: "italic" }}>{agent.name}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
            {agent.role}{agent.years ? ` · ${agent.years} ${t.yearsExpSuffix}` : ""}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 24, flexWrap: "wrap" as const }}>
        <span style={{ background: "rgba(255,255,255,0.1)", borderRadius: 100, padding: "5px 12px", fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
          {t.agentOnlineLabel}
        </span>
        <span style={{ background: "rgba(255,255,255,0.1)", borderRadius: 100, padding: "5px 12px", fontSize: 11 }}>
          ✓ {t.verifiedTravelDesigner}
        </span>
      </div>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
        <WAButton
          label={`${lang === "ar" ? "تواصل مع" : "Message"} ${agent.name.split(" ")[0]}`}
          size="md" onClick={onWhatsApp}
        />
        <button style={{
          background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 100, padding: "11px 18px", color: "#fff", fontSize: 13,
          fontFamily: "inherit", cursor: "pointer",
        }}>
          {t.scheduleCallLabel}
        </button>
      </div>
    </section>
  );
}

// ─── Dark designer panel — desktop ───────────────────────────────────────────

function AuroraDesignerPanelDesktop({ pkg, agency, lang, onWhatsApp }: {
  pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; lang: TPageProps["lang"]; onWhatsApp: () => void;
}) {
  const t = T[lang];
  const agent = pkg.agent;
  if (!agent) return null;
  const isRtl = lang === "ar";

  return (
    <section style={{ background: INK, color: "#fff", direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{
        maxWidth: 1180, margin: "0 auto",
        display: "grid", gridTemplateColumns: isRtl ? "3fr 2fr" : "2fr 3fr",
        minHeight: 480, overflow: "hidden",
      }}>
        {/* Portrait */}
        <div style={{
          position: "relative", overflow: "hidden",
          background: `${BRAND}22`,
          order: isRtl ? 2 : 1,
        }}>
          {agent.avatar
            ? <img src={agent.avatar} alt={agent.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 100, color: BRAND, opacity: 0.25 }}>{agent.name[0]}</div>
          }
        </div>
        {/* Content */}
        <div style={{
          padding: "72px 64px", display: "flex", flexDirection: "column", justifyContent: "center",
          order: isRtl ? 1 : 2,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: BRAND, marginBottom: 16 }}>
            {t.designedByLabel}{agency.name ? ` · ${agency.name}` : ""}
          </div>
          <div style={{ fontFamily: SERIF, fontSize: 52, fontWeight: 400, lineHeight: 1, marginBottom: 8, fontStyle: "italic" }}>
            {agent.name}
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginBottom: 28 }}>
            {agent.role}{agent.years ? ` · ${agent.years} ${t.yearsExpSuffix}` : ""}
            {agent.repliesIn ? ` · ${t.repliesInLabel} ${agent.repliesIn}` : ""}
          </div>
          <div style={{ display: "flex", gap: 10, marginBottom: 32, flexWrap: "wrap" as const }}>
            <span style={{ background: "rgba(255,255,255,0.1)", borderRadius: 100, padding: "6px 14px", fontSize: 12, display: "flex", alignItems: "center", gap: 7 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
              {t.agentOnlineLabel}
            </span>
            <span style={{ background: "rgba(255,255,255,0.1)", borderRadius: 100, padding: "6px 14px", fontSize: 12 }}>
              ✓ {t.verifiedTravelDesigner}
            </span>
          </div>
          <div style={{ display: "flex", gap: 14 }}>
            <WAButton
              label={`${lang === "ar" ? "تواصل مع" : "Message"} ${agent.name.split(" ")[0]}`}
              size="lg" onClick={onWhatsApp}
            />
            <button style={{
              background: "transparent", border: "1px solid rgba(255,255,255,0.25)",
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

// ─── Chapter itinerary (narrative format) ────────────────────────────────────

function ChapterItinerary({ pkg, tokens, lang }: { pkg: TPageProps["pkg"]; tokens: TemplateTokens; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const itinerary = (pkg.itinerary || []).filter(it => it.title?.trim());
  if (!itinerary.length) return null;
  const isRtl = lang === "ar";

  return (
    <section id="itinerary" style={{ padding: "28px 0 8px", scrollMarginTop: 88 }}>
      <div style={{ padding: "0 18px" }}>
        <Eyebrow text={t.dayByDay} brand={BRAND} />
        <h2 style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 400, letterSpacing: "-0.5px", lineHeight: 1.1, color: INK, margin: "10px 0 24px", fontStyle: "italic" }}>
          {t.yourJourney}
        </h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {itinerary.map((it, i) => (
          <article key={i} style={{ direction: isRtl ? "rtl" : "ltr" }}>
            {/* Day image when available */}
            {it.img && (
              <div style={{ height: 220, overflow: "hidden", margin: "0 0 0 0" }}>
                <img src={it.img} alt={it.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            )}
            <div style={{
              display: "flex", gap: 16, padding: "20px 18px",
              paddingTop: it.img ? 14 : (i > 0 ? 20 : 0),
              borderTop: !it.img && i > 0 ? `1px solid ${BORDER}` : "none",
            }}>
              {/* Day number column */}
              <div style={{ width: 48, flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
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
          </article>
        ))}
      </div>
    </section>
  );
}

function ChapterItineraryDesktop({ pkg, tokens, lang }: { pkg: TPageProps["pkg"]; tokens: TemplateTokens; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const itinerary = (pkg.itinerary || []).filter(it => it.title?.trim());
  if (!itinerary.length) return null;
  const hasImages = itinerary.some(it => it.img);

  if (hasImages) {
    return (
      <section id="itinerary" style={{ scrollMarginTop: 88 }}>
        <DContainer style={{ padding: "72px 80px 32px" }}>
          <Eyebrow text={t.dayByDay} brand={BRAND} />
          <h2 style={{ fontFamily: SERIF, fontSize: 46, fontWeight: 400, letterSpacing: "-1px", lineHeight: 1.05, color: INK, margin: "12px 0 0", fontStyle: "italic" }}>
            {t.yourJourney}
          </h2>
        </DContainer>
        {itinerary.map((it, i) => {
          const textFirst = i % 2 === 0;
          return (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", minHeight: 380 }}>
              <div style={{
                order: textFirst ? 1 : 2,
                padding: "52px 64px", display: "flex", flexDirection: "column", justifyContent: "center",
                borderTop: i > 0 ? `1px solid ${BORDER}` : "none",
              }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 18 }}>
                  <div style={{ fontFamily: SERIF, fontSize: 44, color: `${BRAND}55`, lineHeight: 1, fontWeight: 400 }}>
                    {String(it.day).padStart(2, "0")}
                  </div>
                  {it.chapter && (
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: BRAND, opacity: 0.65 }}>
                      {t.chapterLabel} · {it.chapter}
                    </div>
                  )}
                </div>
                <div style={{ fontFamily: SERIF, fontSize: 28, color: INK, lineHeight: 1.2, marginBottom: it.desc ? 16 : 0, fontStyle: "italic" }}>
                  {it.title}
                </div>
                {it.desc && <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.7, margin: 0 }}>{it.desc}</p>}
              </div>
              <div style={{
                order: textFirst ? 2 : 1,
                position: "relative", overflow: "hidden", background: `${BRAND}11`,
                borderTop: i > 0 ? `1px solid ${BORDER}` : "none",
              }}>
                {it.img && <img src={it.img} alt={it.title} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
              </div>
            </div>
          );
        })}
      </section>
    );
  }

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

  const trustItems = buildTrustItems(t, pkg.agent);

  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: BONE, color: INK, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={BRAND} navLinks={navLinks} lang={lang} onWhatsApp={onWhatsApp} />

        {/* 50/50 hero */}
        <div style={{ display: "grid", gridTemplateColumns: "1.05fr 1fr", minHeight: 620 }}>
          <div style={{ padding: "84px 80px 56px", display: "flex", flexDirection: "column", justifyContent: "space-between", order: isRtl ? 2 : 1 }}>
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
          <div style={{ position: "relative", overflow: "hidden", background: INK, order: isRtl ? 1 : 2 }}>
            {coverImage
              ? <img src={coverImage} alt={pkg.destination} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${BRAND}cc, ${BRAND}55)` }} />
            }
          </div>
        </div>

        {/* Scarcity ribbon */}
        <ScarcityRibbon pkg={pkg} lang={lang} />

        {/* Trust strip */}
        <TrustStrip
          items={trustItems}
          ink={INK} mutedColor={MUTED} borderColor={BORDER} iconAccent={BRAND}
          layout="row"
          style={{ padding: "20px 80px" }}
        />

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

        <DynamicSectionsDesktop pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} skip={["itinerary"]} />
        <ReviewsSectionDesktop pkg={pkg} tokens={tokens} lang={lang} agency={agency} />

        {/* Dark designer closing panel */}
        <AuroraDesignerPanelDesktop pkg={pkg} agency={agency} lang={lang} onWhatsApp={onWhatsApp} />

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
        {pkg.rating != null && (
          <div style={{ position: "absolute", top: 20, right: isRtl ? undefined : 18, left: isRtl ? 18 : undefined, display: "flex", alignItems: "center", gap: 5, color: "#fff", fontSize: 12 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="#fff" stroke="none"><path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/></svg>
            <span>{pkg.rating}</span>
            {pkg.reviewCount != null && <span style={{ opacity: 0.7 }}>· {pkg.reviewCount}</span>}
          </div>
        )}
        <div style={{ position: "absolute", bottom: 52, left: 20, right: 20 }}>
          <h1 style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 400, fontStyle: "italic", color: "#fff", lineHeight: 1.15, letterSpacing: "-0.5px", margin: 0, textShadow: "0 2px 16px rgba(0,0,0,0.35)" }}>
            {title}
          </h1>
        </div>
      </div>

      {/* Offset booking card */}
      <div style={{ padding: "0 18px" }}>
        <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 8px 40px rgba(26,18,8,0.12)", padding: "22px 22px 20px", marginTop: -32, position: "relative", zIndex: 2 }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: SMUTED, marginBottom: 5 }}>{t.from}</div>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 12, marginBottom: 5 }}>
            <div style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 400, color: BRAND, lineHeight: 1, letterSpacing: "-1px" }}>{pkg.price}</div>
            {nights != null && (
              <div style={{ fontFamily: SERIF, fontSize: 20, color: SMUTED, lineHeight: 1, marginBottom: 4 }}>{nights} {t.nightsLabel}</div>
            )}
          </div>
          <div style={{ fontSize: 12, color: SMUTED, marginBottom: pkg.spotsRemaining != null ? 10 : 18 }}>
            {t.perPerson}
          </div>
          {/* Mobile scarcity line */}
          {pkg.spotsRemaining != null && pkg.totalSpots != null && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14, fontSize: 12, color: MUTED }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: BRAND, flexShrink: 0, display: "inline-block" }} />
              {lang === "ar"
                ? <span><em>فقط</em> <b>{pkg.spotsRemaining}</b> من {pkg.totalSpots} فيلا متاحة لهذا الموعد</span>
                : <span><em>Only</em> <b>{pkg.spotsRemaining}</b> of {pkg.totalSpots} villas remaining for this departure</span>}
            </div>
          )}
          <WAButton label={t.bookWhatsApp} full onClick={onWhatsApp} />
        </div>
      </div>

      {/* Trust strip */}
      <MobileTrustStrip pkg={pkg} lang={lang} />

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

      <DynamicSections pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} skip={["itinerary"]} />

      {/* Dark designer closing panel */}
      <AuroraDesignerPanel pkg={pkg} agency={agency} lang={lang} onWhatsApp={onWhatsApp} />

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
