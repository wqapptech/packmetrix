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

const RED    = "#e2492a";
const BG     = "#fafaf7";
const INK    = "#0d1b2e";
const MUTED  = "rgba(13,27,46,0.55)";
const SMUTED = "rgba(13,27,46,0.35)";
const BORDER = "rgba(13,27,46,0.08)";

// ─── Countdown timer ─────────────────────────────────────────────────────────

function useCountdown(targetDate?: string) {
  const [remaining, setRemaining] = React.useState({ h: 0, m: 0, s: 0 });

  React.useEffect(() => {
    if (!targetDate) return;
    const target = new Date(targetDate).getTime();
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) { setRemaining({ h: 0, m: 0, s: 0 }); return; }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setRemaining({ h, m, s });
    };
    tick();
    const id = setInterval(tick, 1_000);
    return () => clearInterval(id);
  }, [targetDate]);

  return remaining;
}

function CountdownBanner({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: TPageProps["lang"] }) {
  const t = T[lang];
  // Use first upcoming departure date for the countdown
  const targetDate = pkg.departures?.[0]?.date;
  const { h, m, s } = useCountdown(targetDate);

  if (!targetDate) return null;

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    <div style={{
      background: RED, color: "#fff",
      padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" as const, gap: 8,
    }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, opacity: 0.9 }}>
        🔥 {t.dealExpiresIn}
      </div>
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        {[
          { v: pad(h), l: t.hoursUnit },
          { v: pad(m), l: t.minutesUnit },
          { v: pad(s), l: t.secondsUnit },
        ].map(({ v, l }, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span style={{ fontSize: 18, fontWeight: 700, opacity: 0.6 }}>:</span>}
            <div style={{ textAlign: "center" as const }}>
              <div style={{ fontSize: 22, fontWeight: 800, lineHeight: 1, letterSpacing: "-0.5px", fontVariantNumeric: "tabular-nums" }}>{v}</div>
              <div style={{ fontSize: 8, opacity: 0.7, letterSpacing: "0.5px" }}>{l}</div>
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─── Scarcity band ───────────────────────────────────────────────────────────

function ScarcityBand({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const items: string[] = [];
  if (pkg.spotsRemaining !== undefined) items.push(`🪑 ${pkg.spotsRemaining} ${t.spotsLeft}`);
  if (pkg.viewersNow)     items.push(`👀 ${pkg.viewersNow} ${t.viewersNow}`);
  if (pkg.recentBookings) items.push(`✅ ${t.bookedRecently} ${pkg.recentBookings.hoursAgo} ${t.hoursAgoSuffix}`);
  if (!items.length) return null;
  return (
    <div style={{ background: `${RED}0c`, border: `1px solid ${RED}25`, borderRadius: 10, padding: "10px 14px", margin: "18px 18px 0", display: "flex", flexWrap: "wrap" as const, gap: "8px 18px" }}>
      {items.map((item, i) => (
        <div key={i} style={{ fontSize: 12.5, fontWeight: 600, color: RED }}>{item}</div>
      ))}
    </div>
  );
}

// ─── TemplatePulsePage ────────────────────────────────────────────────────────

export function TemplatePulsePage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const tokens: TemplateTokens = {
    bg: BG, ink: INK, muted: MUTED, superMuted: SMUTED, border: BORDER, brand: RED, serif: "var(--font-dm-sans, sans-serif)",
  };

  const nights     = pkg.nights ? Number(pkg.nights) : null;
  const coverImage = pkg.coverImage || "";
  const title      = pkg.title || pkg.destination;
  const isRtl      = lang === "ar";
  const includes   = pkg.includes?.length ? pkg.includes : (pkg.advantages || []);
  const isDesktop  = useIsDesktop();

  const navLinks = [
    ...((pkg.itinerary || []).some(it => it.title?.trim()) ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...(includes.length ? [{ label: t.navIncluded, href: "#included" }] : []),
    ...((pkg.pricingTiers || []).some(t2 => t2.price) ? [{ label: t.navPricing, href: "#pricing" }] : []),
  ];

  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: BG, color: INK, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={RED} navLinks={navLinks} lang={lang} onWhatsApp={onWhatsApp} />

        {/* Countdown banner — full bleed under nav */}
        <CountdownBanner pkg={pkg} lang={lang} />

        {/* Split hero: image left 1.2, deal info right */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", minHeight: 540 }}>
          <div style={{ position: "relative", overflow: "hidden" }}>
            {coverImage
              ? <img src={coverImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${RED}cc, ${RED}55)` }} />
            }
            {/* Deal badge */}
            {(pkg.saving || pkg.priceWas) && (
              <div style={{ position: "absolute", top: 20, left: 20, background: RED, color: "#fff", padding: "8px 14px", borderRadius: 8, fontSize: 13, fontWeight: 800, letterSpacing: "0.3px" }}>
                {pkg.saving || `Was ${pkg.priceWas}`}
              </div>
            )}
          </div>
          <div style={{ padding: "64px 64px", display: "flex", flexDirection: "column", justifyContent: "center" }}>
            <Eyebrow text={pkg.destination} brand={RED} />
            <h1 style={{ fontSize: 50, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-1.2px", marginTop: 14, marginBottom: 14 }}>{title}</h1>
            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.65, margin: 0 }}>{pkg.description}</p>

            {/* Price block */}
            <div style={{ marginTop: 24, padding: "18px 0", borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
              {pkg.priceWas && <div style={{ fontSize: 18, color: SMUTED, textDecoration: "line-through", marginBottom: 2 }}>{pkg.priceWas}</div>}
              <div style={{ fontSize: 56, fontWeight: 800, color: RED, letterSpacing: "-1.5px", lineHeight: 1 }}>{pkg.price}</div>
              <div style={{ display: "flex", gap: 12, alignItems: "center", marginTop: 6 }}>
                <div style={{ fontSize: 12, color: SMUTED }}>{nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.perPerson}</div>
                {pkg.saving && <div style={{ fontSize: 11, fontWeight: 700, color: "#2dd4a0", background: "rgba(45,212,160,0.1)", borderRadius: 4, padding: "2px 6px" }}>{pkg.saving}</div>}
              </div>
            </div>

            {/* Scarcity */}
            {(pkg.spotsRemaining !== undefined || pkg.viewersNow) && (
              <div style={{ display: "flex", gap: 14, marginTop: 16, flexWrap: "wrap" as const }}>
                {pkg.spotsRemaining !== undefined && (
                  <div style={{ fontSize: 13, fontWeight: 700, color: RED }}>🪑 {pkg.spotsRemaining} {t.spotsLeft}</div>
                )}
                {pkg.viewersNow && (
                  <div style={{ fontSize: 13, fontWeight: 600, color: MUTED }}>👀 {pkg.viewersNow} {t.viewersNow}</div>
                )}
              </div>
            )}

            <div style={{ marginTop: 22 }}>
              <WAButton label={t.bookNowDeal} full size="lg" onClick={onWhatsApp} />
            </div>
            <div style={{ fontSize: 11.5, color: SMUTED, marginTop: 10, display: "flex", alignItems: "center", gap: 5 }}>
              ✓ {t.guaranteedLowestPrice}
            </div>
          </div>
        </div>

        {/* Includes 3-col */}
        {includes.length > 0 && (
          <DContainer id="included" style={{ padding: "64px 80px 48px" }}>
            <Eyebrow text={t.inThePackage} brand={RED} />
            <h2 style={{ fontSize: 30, fontWeight: 800, letterSpacing: "-0.5px", marginTop: 10, marginBottom: 24 }}>{t.everythingIncluded}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
              {includes.slice(0, 6).map((it, i) => (
                <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "18px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${RED}12`, border: `1px solid ${RED}35`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke={RED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="2,6 5,9 10,3" />
                    </svg>
                  </div>
                  <span style={{ fontSize: 13.5, fontWeight: 500, color: INK, lineHeight: 1.4 }}>{it}</span>
                </div>
              ))}
            </div>
          </DContainer>
        )}

        <DynamicSectionsDesktop pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />
        <ReviewsSectionDesktop pkg={pkg} tokens={tokens} lang={lang} agency={agency} />
        <SharedCTABannerDesktop pkg={pkg} agency={agency} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} onMessenger={onMessenger} />
        <DesktopFooter agency={agency} brand={RED} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, color: INK, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
      <AgencyBar agency={agency} price={pkg.price} brand={RED} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} />

      {/* Countdown banner */}
      <CountdownBanner pkg={pkg} lang={lang} />

      {/* Hero image */}
      <div style={{ position: "relative", height: 280, overflow: "hidden" }}>
        {coverImage
          ? <img src={coverImage} alt={pkg.destination} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${RED}55, ${RED}cc)` }} />
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.5) 100%)" }} />
        {(pkg.saving || pkg.priceWas) && (
          <div style={{ position: "absolute", top: 14, left: isRtl ? undefined : 16, right: isRtl ? 16 : undefined, background: RED, color: "#fff", padding: "6px 12px", borderRadius: 7, fontSize: 12, fontWeight: 800 }}>
            {pkg.saving || `Was ${pkg.priceWas}`}
          </div>
        )}
        <div style={{ position: "absolute", bottom: 14, left: isRtl ? undefined : 16, right: isRtl ? 16 : undefined }}>
          <Eyebrow text={pkg.destination} brand={RED} light />
        </div>
      </div>

      {/* Title + desc */}
      <div style={{ padding: "20px 18px 0" }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: INK, lineHeight: 1.15, letterSpacing: "-0.6px", margin: "0 0 10px" }}>{title}</h1>
        <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, margin: 0, direction: isRtl ? "rtl" : "ltr" }}>{pkg.description}</p>
      </div>

      {/* Price block */}
      <div style={{ padding: "18px 18px 0" }}>
        {pkg.priceWas && <div style={{ fontSize: 16, color: SMUTED, textDecoration: "line-through", marginBottom: 2 }}>{pkg.priceWas}</div>}
        <div style={{ fontSize: 36, fontWeight: 800, color: RED, lineHeight: 1, letterSpacing: "-1px", marginBottom: 3 }}>{pkg.price}</div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ fontSize: 12, color: SMUTED, fontWeight: 600 }}>{nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.perPerson}</div>
          {pkg.saving && <div style={{ fontSize: 11, fontWeight: 700, color: "#2dd4a0", background: "rgba(45,212,160,0.1)", borderRadius: 4, padding: "2px 6px" }}>{pkg.saving}</div>}
        </div>
      </div>

      {/* Scarcity band */}
      <ScarcityBand pkg={pkg} lang={lang} />

      {/* Primary CTA */}
      <div style={{ padding: "18px 18px 0" }}>
        <WAButton label={t.bookNowDeal} full size="lg" onClick={onWhatsApp} />
        <div style={{ fontSize: 11.5, color: SMUTED, marginTop: 8, textAlign: "center" as const }}>✓ {t.guaranteedLowestPrice}</div>
      </div>

      {/* Includes grid */}
      {includes.length > 0 && (
        <div id="included" style={{ padding: "22px 18px 0", scrollMarginTop: 88 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 12 }}>{t.includedLabel}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {includes.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px" }}>
                <div style={{ width: 16, height: 16, borderRadius: "50%", background: `${RED}12`, border: `1px solid ${RED}35`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                  <svg width="8" height="8" viewBox="0 0 12 12" fill="none" stroke={RED} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="2,6 5,9 10,3" />
                  </svg>
                </div>
                <span style={{ fontSize: 12, color: MUTED, lineHeight: 1.45, direction: isRtl ? "rtl" : "ltr" }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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

// ─── TemplatePulseCard ────────────────────────────────────────────────────────

export function TemplatePulseCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
