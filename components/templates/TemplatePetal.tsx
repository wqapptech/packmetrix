"use client";

import React from "react";
import { T, localizeTierLabel } from "@/lib/translations";
import {
  WAButton,
  AgencyBar,
  StickyCTA,
  BaseCard,
  useIsDesktop,
  DesktopNav,
  DContainer,
  DesktopFooter,
  getItineraryDays,
} from "./shared";
import type { TPageProps, TCardProps } from "./types";

const ROSE      = "#c8576f";
const PEACH     = "#faf3ef";
const CLAY      = "#d4896a";
const INK       = "#1a0d0d";
const MUTED     = "rgba(26,13,13,0.52)";
const SMUTED    = "rgba(26,13,13,0.32)";
const BORDER    = "rgba(26,13,13,0.07)";
const SERIF     = "var(--font-instrument-serif, var(--font-cormorant), serif)";
const MONO      = "var(--font-jetbrains-mono, ui-monospace, monospace)";
const GOLD      = "#b09142";
const ROSE_SOFT = "#f3d3d8";

// ─── Trust items ──────────────────────────────────────────────────────────────

function buildPetalTrustItems(t: typeof T["en"], pkg: TPageProps["pkg"]): { icon: React.ReactNode; title: string; sub?: string }[] {
  return [
    { icon: "✓", title: t.freeCancellation, sub: t.trustFreeCancellationSub },
    { icon: "✉", title: t.bookWhatsApp, sub: t.trustWhatsAppDesignerSub },
    { icon: "♡", title: t.trustHoneymoonSpec, sub: pkg.agent?.years ? `${pkg.agent.years}+ ${t.petalCouplesDesigned}` : undefined },
    { icon: "✦", title: t.trustOfficialPartner, sub: t.trustOfficialPartnerSub },
  ];
}

// ─── Mobile trust strip ───────────────────────────────────────────────────────

function MobileTrustStrip({ t }: { t: typeof T["en"] }) {
  const items = [t.freeCancellation, t.bookWhatsApp, t.trustHoneymoonSpec, t.trustOfficialPartner];
  return (
    <div style={{
      display: "flex", gap: 0,
      borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`,
      overflowX: "auto", scrollbarWidth: "none",
    }}>
      {items.map((label, i) => (
        <div key={i} style={{
          flexShrink: 0, padding: "10px 14px", fontSize: 12, color: INK,
          fontWeight: 500, whiteSpace: "nowrap" as const,
          borderRight: i < items.length - 1 ? `1px solid ${BORDER}` : undefined,
        }}>
          {label}
        </div>
      ))}
    </div>
  );
}

// ─── Room treatments ─────────────────────────────────────────────────────────

function RoomTreatments({ pkg, lang, onWhatsApp }: { pkg: TPageProps["pkg"]; lang: TPageProps["lang"]; onWhatsApp: () => void }) {
  const t = T[lang];
  const tiers = (pkg.pricingTiers || []).filter(tier => tier.price);
  if (!tiers.length) return null;
  const isRtl = lang === "ar";
  const galleryLen = Math.max(pkg.gallery?.length ?? 0, 1);

  return (
    <section id="pricing" style={{ padding: "28px 18px", scrollMarginTop: 88, direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ fontFamily: SERIF, fontSize: 11, fontStyle: "italic", color: ROSE, letterSpacing: "0.3px", marginBottom: 6 }}>
        {t.roomTreatmentsSub}
      </div>
      <h2 style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 400, color: INK, letterSpacing: "-0.4px", lineHeight: 1.1, margin: "0 0 20px", fontStyle: "italic" }}>
        {t.roomTreatmentsTitle}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {tiers.map((tier, i) => {
          const imgSrc = pkg.gallery?.[i % galleryLen]?.src;
          const isFeature = i === 0;
          return (
            <div key={i} style={{
              background: isFeature ? `linear-gradient(135deg, ${ROSE}, ${CLAY})` : "#fff",
              border: `1px solid ${isFeature ? "transparent" : BORDER}`,
              borderRadius: 18, overflow: "hidden",
              boxShadow: isFeature ? `0 12px 32px ${ROSE}28` : "none",
            }}>
              {imgSrc && (
                <div style={{ height: 160, overflow: "hidden" }}>
                  <img src={imgSrc} alt={tier.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
              )}
              <div style={{ padding: "18px 20px" }}>
                {isFeature && (
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.8)", marginBottom: 8 }}>
                    {t.popularChoice}
                  </div>
                )}
                <div style={{ fontSize: 12.5, color: isFeature ? "rgba(255,255,255,0.75)" : MUTED, marginBottom: 8 }}>{localizeTierLabel(tier.label, lang)}</div>
                <div style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 400, letterSpacing: "-0.8px", lineHeight: 1, color: isFeature ? "#fff" : ROSE, marginBottom: 4 }}>{tier.price}</div>
                <div style={{ fontSize: 11, color: isFeature ? "rgba(255,255,255,0.55)" : SMUTED, marginBottom: 16 }}>
                  {t.couplesTreatmentLabel}
                </div>
                <button onClick={onWhatsApp} style={{
                  width: "100%", padding: "11px", borderRadius: 10, border: "none", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 13.5, fontWeight: 700,
                  background: isFeature ? "rgba(255,255,255,0.22)" : ROSE,
                  color: "#fff",
                }}>
                  {t.bookWhatsApp}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function RoomTreatmentsDesktop({ pkg, lang, onWhatsApp }: { pkg: TPageProps["pkg"]; lang: TPageProps["lang"]; onWhatsApp: () => void }) {
  const t = T[lang];
  const tiers = (pkg.pricingTiers || []).filter(tier => tier.price);
  if (!tiers.length) return null;
  const galleryLen = Math.max(pkg.gallery?.length ?? 0, 1);

  return (
    <DContainer id="pricing" style={{ padding: "64px 80px" }}>
      <div style={{ fontFamily: SERIF, fontSize: 13, fontStyle: "italic", color: ROSE, marginBottom: 8 }}>{t.roomTreatmentsSub}</div>
      <h2 style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 400, letterSpacing: "-0.8px", lineHeight: 1.05, margin: "0 0 36px", fontStyle: "italic" }}>
        {t.roomTreatmentsTitle}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(tiers.length, 3)}, 1fr)`, gap: 20 }}>
        {tiers.map((tier, i) => {
          const imgSrc = pkg.gallery?.[i % galleryLen]?.src;
          const isFeature = i === 0;
          return (
            <div key={i} style={{
              background: isFeature ? `linear-gradient(145deg, ${ROSE}, ${CLAY})` : "#fff",
              border: `1px solid ${isFeature ? "transparent" : BORDER}`,
              borderRadius: 20, overflow: "hidden",
              boxShadow: isFeature ? `0 16px 40px ${ROSE}30` : "none",
            }}>
              {imgSrc && (
                <div style={{ aspectRatio: "4/3", overflow: "hidden" }}>
                  <img src={imgSrc} alt={tier.label} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
              )}
              <div style={{ padding: "24px 26px" }}>
                {isFeature && (
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.8)", marginBottom: 10 }}>
                    {t.popularChoice}
                  </div>
                )}
                <div style={{ fontSize: 13, color: isFeature ? "rgba(255,255,255,0.7)" : MUTED, marginBottom: 10 }}>{localizeTierLabel(tier.label, lang)}</div>
                <div style={{ fontFamily: SERIF, fontSize: 44, fontWeight: 400, letterSpacing: "-1px", lineHeight: 1, color: isFeature ? "#fff" : ROSE, marginBottom: 4 }}>{tier.price}</div>
                <div style={{ fontSize: 11.5, color: isFeature ? "rgba(255,255,255,0.55)" : SMUTED, marginBottom: 22 }}>{t.couplesTreatmentLabel}</div>
                <button onClick={onWhatsApp} style={{
                  width: "100%", padding: "13px", borderRadius: 12, border: "none", cursor: "pointer",
                  fontFamily: "inherit", fontSize: 14, fontWeight: 700,
                  background: isFeature ? "rgba(255,255,255,0.2)" : ROSE, color: "#fff",
                }}>
                  {t.bookWhatsApp}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </DContainer>
  );
}

// ─── Designer closing panel ───────────────────────────────────────────────────

function PetalDesignerPanel({ pkg, agency, lang, onWhatsApp }: { pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; lang: TPageProps["lang"]; onWhatsApp: () => void }) {
  const t = T[lang];
  const agent = pkg.agent;
  const firstName = agent?.name?.split(" ")[0] || agency.name;
  const isRtl = lang === "ar";

  return (
    <section style={{
      background: `linear-gradient(135deg, ${INK} 60%, #3a1020)`,
      padding: "40px 24px",
      direction: isRtl ? "rtl" : "ltr",
    }}>
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.45)", marginBottom: 20 }}>
        {t.petalDesignerLabel} · {agency.name}
      </div>
      {agent && (
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          {agent.avatar
            ? <img src={agent.avatar} alt={agent.name} style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover" }} />
            : <div style={{ width: 60, height: 60, borderRadius: "50%", background: `${ROSE}44`, flexShrink: 0 }} />
          }
          <div>
            <div style={{ fontFamily: SERIF, fontSize: 22, color: "#fff", lineHeight: 1.1 }}>{agent.name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 3 }}>{agent.role}</div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 22 }}>
        {agent?.repliesIn && (
          <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "6px 12px" }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.85)" }}>{t.agentOnlineLabel}</span>
          </div>
        )}
        {!!pkg.reviewCount && (
          <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "6px 12px", fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
            ♡ {pkg.reviewCount}+ {t.petalCouplesDesigned}
          </div>
        )}
      </div>
      <WAButton label={`${t.messageUs.replace(" ▷", "")} ${firstName}`} full onClick={onWhatsApp} />
      <button style={{
        width: "100%", marginTop: 10, padding: "12px", borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.25)", background: "transparent",
        color: "rgba(255,255,255,0.75)", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
      }}>
        {t.petalDiscoveryCall}
      </button>
    </section>
  );
}

function PetalDesignerPanelDesktop({ pkg, agency, lang, onWhatsApp }: { pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; lang: TPageProps["lang"]; onWhatsApp: () => void }) {
  const t = T[lang];
  const agent = pkg.agent;
  const firstName = agent?.name?.split(" ")[0] || agency.name;
  const isRtl = lang === "ar";

  return (
    <section style={{ background: `linear-gradient(135deg, ${INK} 60%, #3a1020)` }}>
      <DContainer style={{ padding: "72px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 64, alignItems: "center" }}>
          {/* Portrait */}
          <div style={{
            order: isRtl ? 2 : 1,
            position: "relative", height: 420,
            borderRadius: "200px 200px 12px 12px", overflow: "hidden",
            background: `${ROSE}22`,
          }}>
            {agent?.avatar
              ? <img src={agent.avatar} alt={agent.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${ROSE}44, ${CLAY}22)` }} />
            }
          </div>
          {/* Content */}
          <div style={{ order: isRtl ? 1 : 2 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.45)", marginBottom: 16 }}>
              {t.petalDesignerLabel} · {agency.name}
            </div>
            {agent && (
              <>
                <div style={{ fontFamily: SERIF, fontSize: 40, color: "#fff", lineHeight: 1.05, marginBottom: 6 }}>{agent.name}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 24 }}>{agent.role}</div>
              </>
            )}
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10, marginBottom: 28 }}>
              {agent?.repliesIn && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "7px 14px" }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>{t.agentOnlineLabel}</span>
                </div>
              )}
              {!!pkg.reviewCount && (
                <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "7px 14px", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                  ♡ {pkg.reviewCount}+ {t.petalCouplesDesigned}
                </div>
              )}
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <WAButton label={`${t.messageUs.replace(" ▷", "")} ${firstName}`} size="lg" onClick={onWhatsApp} />
              <button style={{
                padding: "14px 22px", borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.25)", background: "transparent",
                color: "rgba(255,255,255,0.75)", fontSize: 14, cursor: "pointer", fontFamily: "inherit",
              }}>
                {t.petalDiscoveryCall}
              </button>
            </div>
          </div>
        </div>
      </DContainer>
    </section>
  );
}

// ─── Section data helpers ─────────────────────────────────────────────────────

type PtSecData = Record<string, unknown>;

function ptFindSec(pkg: TPageProps["pkg"], type: string): PtSecData | undefined {
  return pkg.sections?.find((s) => s.type === type)?.data as PtSecData | undefined;
}
function ptSecArr(data: PtSecData | undefined, key: string): PtSecData[] {
  if (!data) return [];
  const v = data[key];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is PtSecData => x != null && typeof x === "object");
}
function ptSecStr(data: PtSecData | undefined, key: string): string {
  if (!data) return "";
  const v = data[key];
  return typeof v === "string" ? v : "";
}
function ptSecNum(data: PtSecData | undefined, key: string): number | undefined {
  if (!data) return undefined;
  const v = data[key];
  return typeof v === "number" ? v : undefined;
}
function ptSecStrArr(data: PtSecData | undefined, key: string): string[] {
  if (!data) return [];
  const v = data[key];
  return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
}
function ptItemStr(item: PtSecData | string, ...keys: string[]): string {
  if (typeof item === "string") return item;
  for (const k of keys) {
    const v = (item as PtSecData)[k];
    if (typeof v === "string" && v) return v;
  }
  return "";
}

// ─── Petal section components ─────────────────────────────────────────────────

function PtHighlightsSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = ptFindSec(pkg, "highlights");
  const items = ptSecArr(data, "items");
  if (!items.length) return null;
  const pad = isDesktop ? "0 80px 64px" : "22px 18px 0";
  return (
    <section style={{ padding: pad, borderTop: `1px solid ${BORDER}`, background: PEACH }} data-pmx-section="highlights">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: ROSE, marginBottom: 14 }}>
          {t.ptHighlightsEyebrow}
        </div>
        <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 52 : 34, lineHeight: 1.05, fontWeight: 400, fontStyle: "italic", letterSpacing: "-0.6px", margin: "0 0 44px", color: INK }}>
          {t.ptHighlightsHeading}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr 1fr" : "1fr", gap: isDesktop ? 32 : 28 }}>
          {items.map((it, i) => {
            const title = ptItemStr(it, "title", "t", "heading");
            const body = ptItemStr(it, "body", "b", "description", "text");
            return (
              <article key={i} style={{ borderTop: `1px solid ${ROSE}`, paddingTop: 22 }}>
                <h3 style={{ fontFamily: SERIF, fontSize: isDesktop ? 26 : 20, fontWeight: 500, letterSpacing: "-0.4px", margin: "0 0 14px", lineHeight: 1.15, fontStyle: "italic", color: INK }}>{title}</h3>
                {body && <p style={{ fontSize: 14.5, lineHeight: 1.65, color: MUTED, margin: 0 }}>{body}</p>}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PtHotelsSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = ptFindSec(pkg, "hotels");
  const hotelsSec = ptSecArr(data, "hotels").length ? ptSecArr(data, "hotels") : ptSecArr(data, "items");
  if (!hotelsSec.length && !pkg.hotelDescription?.trim()) return null;
  const pad = isDesktop ? "0 80px 64px" : "22px 18px 0";
  if (!hotelsSec.length) {
    return (
      <section style={{ padding: pad, borderTop: `1px solid ${BORDER}`, background: PEACH }} data-pmx-section="hotel">
        <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
          <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: ROSE, marginBottom: 14 }}>{t.ptWhereYouStay}</div>
          <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: isDesktop ? 20 : 16, lineHeight: 1.55, color: MUTED, margin: 0 }}>{pkg.hotelDescription}</p>
        </div>
      </section>
    );
  }
  const featured = hotelsSec[0];
  const colTemplate = isDesktop
    ? (hotelsSec.length === 1 ? "1.1fr 1fr" : hotelsSec.length === 2 ? "1.4fr 1fr" : "1fr 1fr 1fr")
    : "1fr";
  return (
    <section style={{ padding: pad, borderTop: `1px solid ${BORDER}`, background: PEACH }} data-pmx-section="hotel">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: ROSE, marginBottom: 14 }}>
          {hotelsSec.length === 1 ? t.ptWhereYouStay : t.ptYourTwoProperties}
        </div>
        <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 48 : 30, lineHeight: 1.05, fontWeight: 400, fontStyle: "italic", letterSpacing: "-0.6px", margin: "0 0 36px", color: INK }}>
          {ptItemStr(featured, "name")}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: colTemplate, gap: isDesktop ? 32 : 20 }}>
          {hotelsSec.map((h, i) => {
            const name = ptItemStr(h, "name");
            const location = ptItemStr(h, "location");
            const nightsStr = ptSecStr(h, "nights");
            const note = ptItemStr(h, "note");
            const facilities = ptSecStrArr(h, "facilities");
            const stars = ptSecNum(h, "stars");
            const photo = ptItemStr(h, "photo");
            const isFeaturedLayout = i === 0 && isDesktop;
            return (
              <article key={i} style={{
                background: "#fff",
                boxShadow: "0 20px 40px -24px rgba(45,26,31,0.18)",
                display: isFeaturedLayout ? "grid" : "block",
                gridTemplateColumns: isFeaturedLayout ? "1.2fr 1fr" : undefined,
                alignItems: isFeaturedLayout ? "stretch" : undefined,
              }}>
                {photo && (
                  <div style={{ overflow: "hidden", height: isFeaturedLayout ? "100%" : undefined, aspectRatio: isFeaturedLayout ? undefined : "4/3" }}>
                    <img src={photo} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                )}
                <div style={{ padding: isDesktop ? "32px 36px" : "20px 22px" }}>
                  {location && (
                    <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: ROSE, marginBottom: 6 }}>
                      {location}{nightsStr ? ` · ${nightsStr} ${t.ptNightsLabel}` : ""}
                    </div>
                  )}
                  <h3 style={{ fontFamily: SERIF, fontSize: isDesktop ? 30 : 22, fontStyle: "italic", fontWeight: 500, letterSpacing: "-0.5px", margin: 0, lineHeight: 1.1, color: INK }}>{name}</h3>
                  {stars != null && (
                    <div style={{ color: GOLD, fontSize: 13, letterSpacing: "2px", marginTop: 8 }}>{"★".repeat(Math.min(5, Math.round(stars)))}</div>
                  )}
                  {note && (
                    <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: isDesktop ? 18 : 14, lineHeight: 1.55, color: MUTED, margin: "16px 0 18px" }}>{note}</p>
                  )}
                  {facilities.length > 0 && (
                    <div style={{ paddingTop: 14, borderTop: `1px solid ${BORDER}`, display: "flex", flexWrap: "wrap" as const, gap: "4px 16px" }}>
                      {facilities.slice(0, 5).map((f, j) => (
                        <span key={j} style={{ fontSize: 13, color: MUTED }}>{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PtDeparturesSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = ptFindSec(pkg, "departures");
  const deps = ptSecArr(data, "departures").length
    ? ptSecArr(data, "departures")
    : (pkg.departures ?? []).map(d => d as unknown as PtSecData);
  if (!deps.length) return null;
  const pad = isDesktop ? "0 80px 64px" : "22px 18px 0";
  return (
    <section style={{ padding: pad, borderTop: `1px solid ${BORDER}`, background: PEACH }} data-pmx-section="departures">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: ROSE, marginBottom: 14 }}>
          {t.ptUpcomingWindows}
        </div>
        <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 52 : 34, lineHeight: 1.05, fontWeight: 400, fontStyle: "italic", letterSpacing: "-0.6px", margin: "0 0 36px", color: INK }}>
          {t.ptDeparturesHeading}
        </div>
        <div style={{ display: "flex", flexDirection: "column" as const }}>
          {deps.map((d, i) => {
            const date = ptItemStr(d, "date");
            const spots = ptSecNum(d, "spots") ?? ptSecNum(d, "spotsRemaining");
            const price = ptItemStr(d, "price");
            const isLow = spots != null && spots <= 2;
            return (
              <div key={i} style={{
                display: "grid",
                gridTemplateColumns: isDesktop ? "1.3fr 1fr 0.6fr" : "1fr",
                gap: isDesktop ? 24 : 4,
                alignItems: isDesktop ? "center" : undefined,
                padding: "22px 0",
                borderTop: `1px solid ${BORDER}`,
                borderBottom: i === deps.length - 1 ? `1px solid ${BORDER}` : undefined,
              }}>
                <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: isDesktop ? 26 : 22, fontWeight: 500, letterSpacing: "-0.4px", color: INK }}>{date}</div>
                {spots != null && (
                  <div style={{ fontFamily: MONO, fontSize: 11, letterSpacing: "0.6px", textTransform: "uppercase" as const, color: isLow ? GOLD : MUTED, fontWeight: isLow ? 600 : 400 }}>
                    {isLow ? `${t.ptOnlyVillaLeft} ${spots} ${t.ptVillaLeft}` : `${spots} ${t.ptCouplesLabel}`}
                  </div>
                )}
                {price && <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: isDesktop ? 22 : 18, color: INK }}>{price}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PtFaqSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = ptFindSec(pkg, "faq");
  const items = ptSecArr(data, "items");
  if (!items.length) return null;
  const pad = isDesktop ? "0 80px 64px" : "22px 18px 0";
  return (
    <section style={{ padding: pad, borderTop: `1px solid ${BORDER}`, background: PEACH }} data-pmx-section="faq">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: ROSE, marginBottom: 14 }}>
          {t.ptFaqEyebrow}
        </div>
        <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 52 : 34, lineHeight: 1.05, fontWeight: 400, fontStyle: "italic", letterSpacing: "-0.6px", margin: "0 0 44px", color: INK }}>
          {t.ptFaqHeading}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: isDesktop ? "28px 56px" : 18 }}>
          {items.map((f, i) => {
            const q = ptItemStr(f, "q", "question");
            const a = ptItemStr(f, "a", "answer");
            const showBorder = isDesktop ? i >= 2 : i > 0;
            return (
              <div key={i}>
                <div style={{
                  fontFamily: SERIF, fontStyle: "italic", fontSize: isDesktop ? 22 : 18,
                  fontWeight: 500, letterSpacing: "-0.4px", lineHeight: 1.25,
                  paddingTop: showBorder ? (isDesktop ? 18 : 16) : 0,
                  marginBottom: 8,
                  borderTop: showBorder ? `1px solid ${BORDER}` : "none",
                  color: INK,
                }}>{q}</div>
                <div style={{ fontSize: 14.5, lineHeight: 1.65, color: MUTED }}>{a}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PtImportantNotesSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = ptFindSec(pkg, "important_notes");
  const notes = ptSecArr(data, "notes");
  const items = notes.length ? notes : ptSecArr(data, "items");
  if (!items.length) return null;
  const pad = isDesktop ? "0 80px 64px" : "22px 18px 0";
  return (
    <section style={{ padding: pad, borderTop: `1px solid ${BORDER}`, background: PEACH }} data-pmx-section="important_notes">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: ROSE, marginBottom: 14 }}>
          {t.ptNotesEyebrow}
        </div>
        <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 52 : 34, lineHeight: 1.05, fontWeight: 400, fontStyle: "italic", letterSpacing: "-0.6px", margin: "0 0 36px", color: INK }}>
          {t.ptNotesHeading}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "1fr", gap: 20 }}>
          {items.map((n, i) => {
            const severity = ptItemStr(n, "severity");
            const title = ptItemStr(n, "title", "text");
            const body = ptItemStr(n, "body");
            const isWarn = severity === "warn";
            return (
              <article key={i} style={{
                background: isWarn ? "rgba(200,87,111,0.04)" : "#fff",
                border: `1px solid ${isWarn ? ROSE_SOFT : BORDER}`,
                padding: isDesktop ? "26px 28px" : "18px 20px",
              }}>
                <h3 style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: isDesktop ? 22 : 18, fontWeight: 500, letterSpacing: "-0.3px", margin: "0 0 10px", lineHeight: 1.15, color: INK }}>{title}</h3>
                {body && <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.6, margin: 0 }}>{body}</p>}
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function PtOtherPackagesSection({ pkg, isDesktop, lang, agencySlug }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"]; agencySlug?: string }) {
  const t = T[lang];
  const data = ptFindSec(pkg, "other_packages");
  const cards = ptSecArr(data, "packages");
  if (!cards.length) return null;
  const heading = ptSecStr(data, "heading") || t.otherPackagesHeading;
  const pad = isDesktop ? "0 80px 64px" : "32px 20px 0";
  const isRtl = lang === "ar";
  return (
    <section style={{ padding: pad }} dir={isRtl ? "rtl" : "ltr"} data-pmx-section="other_packages">
      <div style={{ maxWidth: isDesktop ? 1100 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontFamily: SERIF, fontSize: 11, fontStyle: "italic", color: ROSE, letterSpacing: "0.3px", marginBottom: 12 }}>{heading}</div>
        <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8, scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
          {cards.map((card, i) => {
            const img = ptSecStr(card, "image");
            const title = ptItemStr(card, "title");
            const dest = ptSecStr(card, "destination");
            const price = ptSecStr(card, "price");
            const nights = ptSecStr(card, "nights");
            const link = ptSecStr(card, "link");
            return (
              <a key={i} href={link || undefined} style={{
                flex: "0 0 190px", minWidth: 190, borderRadius: 16, overflow: "hidden",
                textDecoration: "none", border: `1px solid ${BORDER}`,
                background: "#fff", scrollSnapAlign: "start",
                display: "flex", flexDirection: "column",
              }}>
                <div style={{ width: "100%", height: 120, background: BORDER, flexShrink: 0 }}>
                  {img && <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                </div>
                <div style={{ padding: "10px 12px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                  {dest && <div style={{ fontFamily: SERIF, fontSize: 10, fontStyle: "italic", color: ROSE }}>{dest}</div>}
                  <div style={{ fontFamily: SERIF, fontSize: 14, fontWeight: 400, color: INK, lineHeight: 1.3 }}>{title}</div>
                  {(nights || price) && (
                    <div style={{ marginTop: "auto", paddingTop: 6, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                      {nights && <span style={{ fontSize: 11, color: MUTED }}>{nights}</span>}
                      {price && <span style={{ fontFamily: SERIF, fontSize: 12, fontWeight: 700, color: ROSE }}>{price}</span>}
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
        {agencySlug && (
          <div style={{ marginTop: 14, textAlign: isRtl ? "left" : "right" }}>
            <a href={`/${agencySlug}`} style={{ fontFamily: SERIF, fontSize: 12, fontStyle: "italic", color: ROSE, textDecoration: "none" }}>
              {t.navAllPackages} →
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function PtAboutAgencySection({ pkg, agency, isDesktop, lang }: { pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = ptFindSec(pkg, "about_agency");
  if (!data && !agency.tagline) return null;
  const story = ptItemStr(data || {}, "story", "content");
  const teamPhoto = ptSecStr(data, "teamPhoto") || ptSecStr(data, "image");
  const foundedRaw = (data as PtSecData | undefined)?.founded;
  const founded = typeof foundedRaw === "number" ? foundedRaw : undefined;
  const lastTrip = ptSecStr(data, "lastTrip");
  const pad = isDesktop ? "0 80px 64px" : "22px 18px 0";
  return (
    <section style={{ padding: pad, borderTop: `1px solid ${BORDER}`, background: PEACH }} data-pmx-section="about_agency">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        {isDesktop ? (
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 56, alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: ROSE, marginBottom: 14 }}>
                {agency.name}{founded ? ` · ${t.ptSinceLabel} ${founded}` : ""}
              </div>
              <div style={{ fontFamily: SERIF, fontSize: 40, lineHeight: 1.1, fontWeight: 400, fontStyle: "italic", letterSpacing: "-0.6px", margin: "0 0 4px", color: INK }}>
                {t.ptStudioHeading} <em style={{ fontStyle: "normal", color: ROSE }}>{t.ptHoneymoonOnly}</em>
              </div>
              {(story || agency.tagline) && (
                <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 20, lineHeight: 1.55, letterSpacing: "-0.2px", color: MUTED, margin: "22px 0 18px" }}>
                  {story || agency.tagline}
                </p>
              )}
              {lastTrip && (
                <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 15, color: ROSE }}>{lastTrip}</div>
              )}
            </div>
            {teamPhoto ? (
              <div style={{ width: "100%", aspectRatio: "4/3", overflow: "hidden" }}>
                <img src={teamPhoto} alt={`${agency.name} team`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ) : (
              <div style={{ width: "100%", aspectRatio: "4/3", background: `linear-gradient(135deg, ${ROSE}22, ${CLAY}11)` }} />
            )}
          </div>
        ) : (
          <>
            <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: ROSE, marginBottom: 14 }}>
              {agency.name}{founded ? ` · ${t.ptSinceLabel} ${founded}` : ""}
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 30, lineHeight: 1.1, fontWeight: 400, fontStyle: "italic", letterSpacing: "-0.5px", margin: "0 0 4px", color: INK }}>
              {t.ptStudioHeading} <em style={{ fontStyle: "normal", color: ROSE }}>{t.ptHoneymoonOnly}</em>
            </div>
            {teamPhoto && (
              <div style={{ width: "100%", aspectRatio: "4/3", overflow: "hidden", margin: "18px 0" }}>
                <img src={teamPhoto} alt={`${agency.name} team`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            {(story || agency.tagline) && (
              <p style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 17, lineHeight: 1.55, color: MUTED, margin: "14px 0 0" }}>
                {story || agency.tagline}
              </p>
            )}
            {lastTrip && (
              <div style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 14, color: ROSE, marginTop: 12 }}>{lastTrip}</div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// ─── Itinerary ────────────────────────────────────────────────────────────────

function PtItinerarySection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = ptFindSec(pkg, "itinerary");
  const days = ptSecArr(data, "days").length ? ptSecArr(data, "days") : (pkg.itinerary ?? []).map(d => ({ day: d.day, title: d.title, desc: d.desc, chapter: d.chapter, img: d.img }));
  if (!days.length) return null;
  const pad = isDesktop ? "0 80px 64px" : "22px 18px 0";
  return (
    <section id="itinerary" style={{ padding: pad, borderTop: `1px solid ${BORDER}`, background: PEACH, scrollMarginTop: 88 }} data-pmx-section="itinerary">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: ROSE, marginBottom: 14 }}>{t.ptDayByDay}</div>
        <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 52 : 34, lineHeight: 1.05, fontWeight: 400, fontStyle: "italic", letterSpacing: "-0.6px", margin: "0 0 44px", color: INK }}>
          {days.length} {t.ptDaysAsWeSeeIt}
        </div>
        <div style={{ display: "flex", flexDirection: "column" as const }}>
          {days.map((d, i) => {
            const day   = typeof d.day === "number" ? d.day : Number(d.day) || (i + 1);
            const title = ptItemStr(d, "title");
            const desc  = ptItemStr(d, "desc", "description");
            const chap  = ptItemStr(d, "chapter");
            const img   = ptItemStr(d, "img", "image");
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: isDesktop ? (img ? "220px 1fr" : "80px 1fr") : "48px 1fr", gap: isDesktop ? 36 : 20, padding: "24px 0", borderTop: `1px solid ${BORDER}`, alignItems: "start" }}>
                <div>
                  {img ? (
                    <div style={{ aspectRatio: "3/4", overflow: "hidden" }}>
                      <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    </div>
                  ) : (
                    <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 56 : 32, fontWeight: 400, fontStyle: "italic", color: ROSE_SOFT, lineHeight: 1 }}>{String(day).padStart(2, "0")}</div>
                  )}
                </div>
                <div style={{ paddingTop: img ? 0 : 4 }}>
                  {chap && <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: ROSE, marginBottom: 6 }}>{chap}</div>}
                  <h3 style={{ fontFamily: SERIF, fontSize: isDesktop ? 26 : 20, fontStyle: "italic", fontWeight: 500, letterSpacing: "-0.4px", margin: "0 0 14px", lineHeight: 1.2, color: INK }}>{title}</h3>
                  {desc && <p style={{ fontSize: isDesktop ? 14.5 : 13.5, lineHeight: 1.65, color: MUTED, margin: 0 }}>{desc}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Inclusions (section-based) ───────────────────────────────────────────────

function PtInclusionsSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data     = ptFindSec(pkg, "inclusions");
  const includes = (data?.includes as string[] | undefined) ?? [];
  const excludes = (data?.excludes as string[] | undefined) ?? [];
  if (!includes.length && !excludes.length) return null;
  const pad = isDesktop ? "0 80px 64px" : "22px 18px 0";
  return (
    <section id="pt-inclusions" style={{ padding: pad, borderTop: `1px solid ${BORDER}`, background: PEACH }} data-pmx-section="inclusions">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: ROSE, marginBottom: 14 }}>{t.ptIncludedInFull}</div>
        {includes.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2,1fr)" : "1fr", gap: isDesktop ? "0 48px" : "0" }}>
            {includes.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, padding: "14px 0", borderBottom: `1px solid ${BORDER}`, alignItems: "flex-start" }}>
                <span style={{ color: ROSE, fontSize: 14, flexShrink: 0, marginTop: 1 }}>♡</span>
                <span style={{ fontSize: isDesktop ? 14.5 : 13.5, color: INK, lineHeight: 1.45 }}>{item}</span>
              </div>
            ))}
          </div>
        )}
        {excludes.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 12 }}>{t.ptNotIncluded}</div>
            {excludes.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: MUTED, marginBottom: 8 }}>
                <span style={{ color: ROSE_SOFT, fontWeight: 700 }}>—</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function PtPricingSection({ pkg, isDesktop, onWhatsApp, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; onWhatsApp: () => void; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data  = ptFindSec(pkg, "pricing");
  const tiers = ptSecArr(data, "tiers").length ? ptSecArr(data, "tiers") : (pkg.pricingTiers ?? []).map(t2 => ({ label: t2.label, price: t2.price, was: t2.was, perks: t2.perks, pop: t2.pop }));
  if (!tiers.length) return null;
  const pad = isDesktop ? "0 80px 64px" : "22px 18px 0";
  return (
    <section id="pricing" style={{ padding: pad, borderTop: `1px solid ${BORDER}`, background: PEACH, scrollMarginTop: 88 }} data-pmx-section="pricing">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: ROSE, marginBottom: 14 }}>{t.ptInvestment}</div>
        <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 52 : 34, lineHeight: 1.05, fontWeight: 400, fontStyle: "italic", letterSpacing: "-0.6px", margin: "0 0 44px", color: INK }}>
          {t.ptWhatYouGet} <em style={{ fontStyle: "normal", color: ROSE }}>{t.ptAsACouple}</em>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? `repeat(${Math.min(tiers.length, 3)},1fr)` : "1fr", gap: isDesktop ? 32 : 20 }}>
          {tiers.map((tier, i) => {
            const pop   = !!tier.pop;
            const label = ptItemStr(tier, "label");
            const price = ptItemStr(tier, "price");
            const was   = ptItemStr(tier, "was");
            const perks = (tier.perks as string[] | undefined) ?? [];
            return (
              <article key={i} style={{ background: pop ? "#fff" : PEACH, border: `1px solid ${pop ? ROSE : BORDER}`, padding: isDesktop ? "32px 36px" : "22px 22px" }}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: ROSE, marginBottom: 8 }}>{label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginBottom: 4 }}>
                  <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 40 : 34, fontStyle: "italic", fontWeight: 400, color: INK, lineHeight: 1 }}>{price}</div>
                  {was && <div style={{ fontSize: 14, textDecoration: "line-through", color: MUTED }}>{was}</div>}
                </div>
                <div style={{ fontSize: 12, color: MUTED, marginBottom: perks.length ? 20 : 0 }}>{t.petalForTwoAllIn}</div>
                {perks.length > 0 && (
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, borderTop: `1px solid ${BORDER}`, paddingTop: 18 }}>
                    {perks.map((p, j) => (
                      <li key={j} style={{ display: "flex", gap: 10, fontSize: 13.5, color: MUTED, marginBottom: 10 }}>
                        <span style={{ color: ROSE }}>♡</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
                <button onClick={onWhatsApp} style={{ marginTop: 20, width: "100%", background: pop ? ROSE : "transparent", color: pop ? "#fff" : ROSE, border: `1px solid ${ROSE}`, padding: "12px 0", fontSize: 13.5, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
                  {t.bookWhatsApp}
                </button>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Transfers ────────────────────────────────────────────────────────────────

function PtTransfersSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data  = ptFindSec(pkg, "transfers");
  const items = ptSecArr(data, "items");
  if (!items.length) return null;
  const pad = isDesktop ? "0 80px 64px" : "22px 18px 0";
  return (
    <section style={{ padding: pad, borderTop: `1px solid ${BORDER}`, background: PEACH }} data-pmx-section="transfers">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: ROSE, marginBottom: 14 }}>{t.ptGettingThere}</div>
        <div style={{ display: "flex", flexDirection: "column" as const }}>
          {items.map((item, i) => {
            const from = ptItemStr(item, "from");
            const to   = ptItemStr(item, "to");
            const type = ptItemStr(item, "type", "transportType");
            const note = ptItemStr(item, "note", "details");
            return (
              <div key={i} style={{ padding: "18px 0", borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ minWidth: 0 }}>
                  {(from || to) && <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 20 : 16, fontStyle: "italic", color: INK, overflowWrap: "break-word" }}>{from}{from && to ? " → " : ""}{to}</div>}
                  {type && <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: ROSE, marginTop: 4 }}>{type}</div>}
                  {note && <div style={{ fontSize: 13, color: MUTED, marginTop: 6, lineHeight: 1.5, overflowWrap: "break-word" }}>{note}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Extras ───────────────────────────────────────────────────────────────────

function PtExtrasSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data  = ptFindSec(pkg, "extras");
  const items = ptSecArr(data, "items");
  if (!items.length) return null;
  const pad = isDesktop ? "0 80px 64px" : "22px 18px 0";
  return (
    <section style={{ padding: pad, borderTop: `1px solid ${BORDER}`, background: PEACH }} data-pmx-section="extras">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: ROSE, marginBottom: 14 }}>{t.ptAddOns}</div>
        <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 48 : 30, lineHeight: 1.05, fontWeight: 400, fontStyle: "italic", letterSpacing: "-0.6px", margin: "0 0 36px", color: INK }}>
          {t.ptLittleExtras} <em style={{ fontStyle: "normal", color: ROSE }}>{t.ptExtrasHeading}</em>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2,1fr)" : "1fr", gap: 0 }}>
          {items.map((item, i) => {
            const name  = ptItemStr(item, "name", "title");
            const price = ptItemStr(item, "price");
            const desc  = ptItemStr(item, "description", "desc");
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: 16, padding: "18px 0", borderTop: `1px solid ${BORDER}`, alignItems: "center" }}>
                <div>
                  <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 18 : 15, fontStyle: "italic", color: INK, marginBottom: desc ? 4 : 0 }}>{name}</div>
                  {desc && <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.55 }}>{desc}</div>}
                </div>
                {price && <div style={{ fontFamily: SERIF, fontSize: 16, fontStyle: "italic", color: ROSE }}>{price}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Media ────────────────────────────────────────────────────────────────────

function PtMediaSection({ pkg, isDesktop }: { pkg: TPageProps["pkg"]; isDesktop: boolean }) {
  const data       = ptFindSec(pkg, "media");
  const images     = (data?.images as string[] | undefined) ?? pkg.images ?? [];
  const videoUrl   = ((data?.videoUrl as string | undefined) ?? pkg.videoUrl ?? "").trim();
  const mapImage   = (data?.mapImage as string | undefined) ?? "";
  const mapCaption = (data?.mapCaption as string | undefined) ?? "";
  if (!images.length && !videoUrl && !mapImage) return null;
  const pad = isDesktop ? "0 80px 64px" : "22px 18px 0";
  const isEmbed = videoUrl && (videoUrl.includes("youtube") || videoUrl.includes("youtu.be") || videoUrl.includes("vimeo"));
  const embedUrl = (() => {
    const yt = videoUrl.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
    if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0`;
    const vi = videoUrl.match(/vimeo\.com\/(\d+)/);
    if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
    return videoUrl;
  })();
  return (
    <section style={{ padding: pad, borderTop: `1px solid ${BORDER}`, background: PEACH }} data-pmx-section="media">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        {images.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3,1fr)" : "1.5fr 1fr", gridTemplateRows: isDesktop ? undefined : "130px 130px", gap: 6, marginBottom: (videoUrl || mapImage) ? 32 : 0 }}>
            {(isDesktop ? images : images.slice(0, 3)).map((src, i) => (
              <div key={i} style={{ overflow: "hidden", gridRow: !isDesktop && i === 0 ? "span 2" : undefined, aspectRatio: isDesktop ? "4/3" : undefined }}>
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }} />
              </div>
            ))}
          </div>
        )}
        {videoUrl && (
          <div style={{ aspectRatio: "16/9", overflow: "hidden", marginBottom: mapImage ? 20 : 0 }}>
            {isEmbed ? (
              <iframe src={embedUrl} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
            ) : (
              <video src={videoUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
            )}
          </div>
        )}
        {mapImage && (
          <div>
            <img src={mapImage} alt={mapCaption} style={{ width: "100%", maxHeight: isDesktop ? 380 : 220, objectFit: "cover", display: "block" }} />
            {mapCaption && <div style={{ padding: "10px 0", fontSize: 12.5, fontFamily: MONO, letterSpacing: "1px", textTransform: "uppercase" as const, color: MUTED }}>{mapCaption}</div>}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── People ───────────────────────────────────────────────────────────────────

function PtPeopleSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data   = ptFindSec(pkg, "people");
  const people = ptSecArr(data, "people");
  if (!people.length) return null;
  const pad = isDesktop ? "0 80px 64px" : "22px 18px 0";
  return (
    <section style={{ padding: pad, borderTop: `1px solid ${BORDER}`, background: PEACH }} data-pmx-section="people">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: ROSE, marginBottom: 14 }}>{t.ptYourDesigners}</div>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2,1fr)" : "1fr", gap: isDesktop ? 48 : 28 }}>
          {people.map((person, i) => {
            const name   = ptItemStr(person, "name");
            const role   = ptItemStr(person, "role");
            const bio    = ptItemStr(person, "bio");
            const photo  = ptItemStr(person, "photo");
            const years  = person.years as number | undefined;
            return (
              <div key={i} style={{ display: "flex", gap: 20, alignItems: "flex-start" }}>
                {photo
                  ? <img src={photo} alt={name} style={{ width: 80, height: 80, objectFit: "cover", flexShrink: 0, borderRadius: "50%" }} />
                  : <div style={{ width: 80, height: 80, background: ROSE_SOFT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, borderRadius: "50%", fontFamily: SERIF, fontSize: 32, color: ROSE }}>{name?.[0]}</div>
                }
                <div>
                  <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 22 : 18, fontStyle: "italic", color: INK, marginBottom: 4 }}>{name}</div>
                  {role && <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: ROSE, marginBottom: bio ? 10 : 0 }}>{role}{years ? ` · ${years}y` : ""}</div>}
                  {bio && <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.65, margin: 0 }}>{bio}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Custom ───────────────────────────────────────────────────────────────────

function PtCustomSection({ pkg, isDesktop }: { pkg: TPageProps["pkg"]; isDesktop: boolean }) {
  const data    = ptFindSec(pkg, "custom");
  const heading = ptSecStr(data, "heading");
  const content = ptSecStr(data, "content");
  const image   = ptSecStr(data, "image");
  if (!heading && !content) return null;
  const pad = isDesktop ? "0 80px 64px" : "22px 18px 0";
  return (
    <section style={{ padding: pad, borderTop: `1px solid ${BORDER}`, background: PEACH }} data-pmx-section="custom">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        {heading && <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: ROSE, marginBottom: 14 }}>{heading}</div>}
        {image && <img src={image} alt={heading} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", display: "block", marginBottom: 22 }} />}
        {content && <p style={{ fontFamily: SERIF, fontSize: isDesktop ? 20 : 16, fontStyle: "italic", lineHeight: 1.7, color: MUTED, margin: 0 }}>{content}</p>}
      </div>
    </section>
  );
}

// ─── Reviews ──────────────────────────────────────────────────────────────────

function PtReviewsSection({ pkg, agency, isDesktop, lang }: { pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const reviews   = pkg.reviews ?? [];
  const canSubmit = agency.enableReviews !== false;
  const showList  = agency.showReviews !== false && reviews.length > 0;
  if (!showList && !canSubmit) return null;

  const [name,   setName]   = React.useState("");
  const [text,   setText]   = React.useState("");
  const [rating, setRating] = React.useState(0);
  const [hover,  setHover]  = React.useState(0);
  const [status, setStatus] = React.useState<"idle"|"sending"|"ok"|"err">("idle");

  const handleSubmit = async () => {
    if (!name.trim() || !text.trim() || !rating || !pkg.id) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/submit-review", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packageId: pkg.id, name: name.trim(), text: text.trim(), rating }) });
      setStatus(res.ok ? "ok" : "err");
    } catch { setStatus("err"); }
  };

  const pad = isDesktop ? "0 80px 64px" : "22px 18px 0";
  return (
    <section style={{ padding: pad, borderTop: `1px solid ${BORDER}`, background: PEACH }} data-pmx-section="reviews">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: ROSE, marginBottom: 14 }}>
          {showList ? `${reviews.length} ${t.ptExperiences}` : t.writeReviewTitle}
        </div>
        {showList && (
          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2,1fr)" : "1fr", gap: isDesktop ? "0 48px" : 0, marginBottom: canSubmit ? 40 : 0 }}>
            {reviews.map((r, i) => (
              <div key={i} style={{ padding: "24px 0", borderTop: `1px solid ${BORDER}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                  <div>
                    <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 18 : 16, fontStyle: "italic", color: INK }}>{r.name}</div>
                    {r.country && <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "1px", textTransform: "uppercase" as const, color: MUTED, marginTop: 4 }}>{r.country}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 2 }}>{[1,2,3,4,5].map(n => <span key={n} style={{ color: n <= r.rating ? GOLD : "rgba(26,13,13,0.15)", fontSize: 14 }}>★</span>)}</div>
                </div>
                <p style={{ fontFamily: SERIF, fontSize: isDesktop ? 17 : 15, fontStyle: "italic", color: MUTED, lineHeight: 1.7, margin: 0 }}>{r.text}</p>
              </div>
            ))}
          </div>
        )}
        {canSubmit && status !== "ok" && (
          <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 32 }}>
            <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 28 : 20, fontStyle: "italic", color: INK, marginBottom: 20 }}>{t.writeReviewTitle}</div>
            <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", fontSize: 24, color: n <= (hover || rating) ? GOLD : "rgba(26,13,13,0.18)", lineHeight: 1 }}>★</button>
              ))}
            </div>
            <input placeholder={t.reviewYourName} value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", border: "none", borderBottom: `1px solid ${BORDER}`, background: "transparent", padding: "10px 0", fontSize: 14, fontFamily: "inherit", color: INK, marginBottom: 14, boxSizing: "border-box" as const }} />
            <textarea placeholder={t.reviewPlaceholder} value={text} onChange={e => setText(e.target.value)} rows={3} style={{ width: "100%", border: "none", borderBottom: `1px solid ${BORDER}`, background: "transparent", padding: "10px 0", fontSize: 14, fontFamily: "inherit", color: INK, marginBottom: 18, resize: "none" as const, boxSizing: "border-box" as const }} />
            <button onClick={handleSubmit} disabled={status === "sending"} style={{ background: ROSE, color: "#fff", border: "none", padding: "12px 28px", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>{status === "sending" ? t.ptSending : t.submitReviewBtn}</button>
            {status === "err" && <div style={{ fontSize: 13, color: "#c0392b", marginTop: 10 }}>{t.reviewSubmitError}</div>}
          </div>
        )}
        {status === "ok" && <div style={{ borderTop: `1px solid ${BORDER}`, paddingTop: 24, fontFamily: SERIF, fontSize: 16, fontStyle: "italic", color: ROSE }}>{t.reviewSubmitSuccess}</div>}
      </div>
    </section>
  );
}

// ─── Desktop trust strip ──────────────────────────────────────────────────────

function PtTrustStrip({ items }: { items: { icon: React.ReactNode; title: string; sub?: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, padding: "20px 80px" }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", borderRight: i < items.length - 1 ? `1px solid ${BORDER}` : "none", paddingRight: 20, paddingLeft: i ? 20 : 0 }}>
          <span style={{ color: ROSE, display: "flex", marginTop: 2 }}>{item.icon}</span>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: INK }}>{item.title}</div>
            {item.sub && <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{item.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── CTA banner ───────────────────────────────────────────────────────────────

function PtCTABanner({ pkg, agency, isDesktop, onWhatsApp, onMessenger, lang }: { pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; isDesktop: boolean; onWhatsApp: () => void; onMessenger: () => void; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const nights = pkg.nights ? Number(pkg.nights) : null;
  const pad = isDesktop ? "48px 80px 64px" : "28px 18px";
  return (
    <section style={{ padding: pad, background: ROSE, color: "#fff" }}>
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined, display: "flex", flexDirection: isDesktop ? "row" as const : "column" as const, justifyContent: "space-between", alignItems: isDesktop ? "center" : "flex-start", gap: 24 }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10.5, letterSpacing: "1.8px", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.65)", marginBottom: 10 }}>{t.ptReserveDates}</div>
          <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 48 : 34, fontStyle: "italic", lineHeight: 1.05, letterSpacing: "-0.6px", color: "#fff" }}>{pkg.price}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginTop: 4 }}>{nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.petalForTwoAllIn}</div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
          <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />
          {pkg.messenger && <button data-testid="messenger-cta" onClick={onMessenger} style={{ background: "rgba(255,255,255,0.15)", color: "#fff", border: "1px solid rgba(255,255,255,0.3)", padding: "14px 22px", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>{t.vyMessenger}</button>}
        </div>
      </div>
    </section>
  );
}

// ─── Mobile footer ────────────────────────────────────────────────────────────

function PtMobileFooter({ agency }: { agency: TPageProps["agency"] }) {
  return (
    <div style={{ padding: "28px 18px", background: PEACH, borderTop: `1px solid ${BORDER}`, textAlign: "center" as const }}>
      {agency.logoUrl && <img src={agency.logoUrl} alt={agency.name} style={{ height: 28, objectFit: "contain", display: "block", margin: "0 auto 10px" }} />}
      <div style={{ fontFamily: SERIF, fontSize: 16, fontStyle: "italic", color: INK }}>{agency.name}</div>
      {agency.tagline && <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: MUTED, marginTop: 4 }}>{agency.tagline}</div>}
    </div>
  );
}

// ─── TemplatePetalPage ────────────────────────────────────────────────────────

export function TemplatePetalPage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const nights     = pkg.nights ? Number(pkg.nights) : null;
  const coverImage = pkg.coverImage || "";
  const title      = pkg.title || pkg.destination;
  const isRtl      = lang === "ar";
  const itinerary  = getItineraryDays(pkg).filter(it => it.title?.trim());
  const includes   = (pkg.includes?.length ? pkg.includes : (pkg.advantages || [])).slice(0, 8);
  const isDesktop  = useIsDesktop();
  const trustItems = buildPetalTrustItems(t, pkg);

  const navLinks = [
    ...(itinerary.length ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...(includes.length ? [{ label: t.navIncluded, href: "#included" }] : []),
    ...((pkg.pricingTiers || []).some(t2 => t2.price) ? [{ label: t.navPricing, href: "#pricing" }] : []),
  ];

  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: PEACH, color: INK, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={ROSE} navLinks={navLinks} lang={lang} onWhatsApp={onWhatsApp} />

        {/* Hero: text LEFT, arched image RIGHT (RTL-aware via order) */}
        <DContainer data-pmx-section="hero" style={{ padding: "80px 80px 64px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: 72, alignItems: "center" }}>
            <div style={{ order: isRtl ? 2 : 1 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 12, color: ROSE, fontStyle: "italic", fontFamily: SERIF }}>
                <span style={{ width: 32, height: 1, background: ROSE }} />
                <span data-pmx-field="destination">{t.petalJourneyTagline} · {pkg.destination}</span>
              </div>
              <h1 data-pmx-field="title" style={{ fontFamily: SERIF, fontSize: 64, lineHeight: 1.02, fontWeight: 400, fontStyle: "italic", letterSpacing: "-1px", marginTop: 20, marginBottom: 22, color: INK }}>
                {title}
              </h1>
              <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.72, margin: "0 0 28px" }}>{pkg.description}</p>
              <div data-pmx-field="price" style={{ fontFamily: SERIF, fontSize: 42, fontWeight: 400, color: ROSE, letterSpacing: "-0.8px", marginBottom: 5, lineHeight: 1 }}>{pkg.price}</div>
              <div style={{ fontSize: 12, color: SMUTED, marginBottom: 24 }}>{nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.petalForTwoAllIn}</div>
              <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />
            </div>
            <div style={{ order: isRtl ? 1 : 2, position: "relative", height: 560, borderRadius: "260px 260px 14px 14px", overflow: "hidden", background: INK }}>
              {coverImage
                ? <img src={coverImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${ROSE}cc, ${CLAY}88)` }} />
              }
            </div>
          </div>
        </DContainer>

        {/* Trust strip */}
        <PtTrustStrip items={trustItems} />

        {/* Inclusions — 2-col */}
        {includes.length > 0 && (
          <DContainer id="included" style={{ padding: "48px 80px" }}>
            <div style={{ fontFamily: SERIF, fontSize: 11, fontStyle: "italic", color: ROSE, marginBottom: 8 }}>{t.petalWhatsPlanned}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              {includes.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 12, padding: "14px 16px", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, alignItems: "flex-start" }}>
                  <span style={{ color: ROSE, fontSize: 14, flexShrink: 0, marginTop: 1 }}>♡</span>
                  <span style={{ fontSize: 13.5, color: INK, lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>
          </DContainer>
        )}

        <PtHighlightsSection pkg={pkg} isDesktop={true} lang={lang} />
        <PtHotelsSection pkg={pkg} isDesktop={true} lang={lang} />
        <PtItinerarySection pkg={pkg} isDesktop={true} lang={lang} />
        <RoomTreatmentsDesktop pkg={pkg} lang={lang} onWhatsApp={onWhatsApp} />
        <PtInclusionsSection pkg={pkg} isDesktop={true} lang={lang} />
        <PtMediaSection pkg={pkg} isDesktop={true} />
        <PtTransfersSection pkg={pkg} isDesktop={true} lang={lang} />
        <PtPricingSection pkg={pkg} isDesktop={true} onWhatsApp={onWhatsApp} lang={lang} />
        <PtDeparturesSection pkg={pkg} isDesktop={true} lang={lang} />
        <PtExtrasSection pkg={pkg} isDesktop={true} lang={lang} />
        <PtCustomSection pkg={pkg} isDesktop={true} />
        <PtPeopleSection pkg={pkg} isDesktop={true} lang={lang} />
        <PtFaqSection pkg={pkg} isDesktop={true} lang={lang} />
        <PtImportantNotesSection pkg={pkg} isDesktop={true} lang={lang} />
        <PtReviewsSection pkg={pkg} agency={agency} isDesktop={true} lang={lang} />
        <PtAboutAgencySection pkg={pkg} agency={agency} isDesktop={true} lang={lang} />
        <PtOtherPackagesSection pkg={pkg} isDesktop={true} lang={lang} agencySlug={agency.agencySlug} />
        <PetalDesignerPanelDesktop pkg={pkg} agency={agency} lang={lang} onWhatsApp={onWhatsApp} />
        <PtCTABanner pkg={pkg} agency={agency} isDesktop={true} onWhatsApp={onWhatsApp} onMessenger={onMessenger} lang={lang} />
        <DesktopFooter agency={agency} brand={ROSE} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: PEACH, color: INK, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
      <AgencyBar agency={agency} price={pkg.price} brand={ROSE} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} />

      {/* Arched hero */}
      <div data-pmx-section="hero" style={{ padding: "0 18px" }}>
        <div style={{ position: "relative", height: 440, borderRadius: "200px 200px 16px 16px", overflow: "hidden", background: INK }}>
          {coverImage
            ? <img src={coverImage} alt={pkg.destination} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${ROSE}cc, ${CLAY}88)` }} />
          }
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.05) 60%, rgba(0,0,0,0.48))" }} />
          <div style={{ position: "absolute", bottom: 20, left: 20, right: 20, textAlign: "center" as const }}>
            <div style={{ fontFamily: SERIF, fontSize: 12, fontStyle: "italic", color: "rgba(255,255,255,0.85)" }}>
              {t.petalJourneyTagline}
            </div>
          </div>
        </div>
      </div>

      {/* Price + title card */}
      <div style={{ padding: "0 18px" }}>
        <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 6px 32px rgba(26,13,13,0.10)", padding: "22px 22px 20px", marginTop: -28, position: "relative", zIndex: 2 }}>
          <h1 data-pmx-field="title" style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 400, fontStyle: "italic", color: INK, lineHeight: 1.12, letterSpacing: "-0.4px", margin: "0 0 10px" }}>
            {title}
          </h1>
          <div data-pmx-field="price" style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 400, color: ROSE, lineHeight: 1, letterSpacing: "-0.8px", marginBottom: 5 }}>{pkg.price}</div>
          <div style={{ fontSize: 12, color: SMUTED, marginBottom: 18 }}>{nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.petalForTwoAllIn}</div>
          <WAButton label={t.bookWhatsApp} full onClick={onWhatsApp} />
        </div>
      </div>

      {/* Mobile trust strip */}
      <MobileTrustStrip t={t} />

      {/* Editorial intro — "The chapter" */}
      {pkg.description && (
        <section style={{ padding: "28px 18px 0" }}>
          <div style={{ fontFamily: SERIF, fontSize: 11, fontStyle: "italic", color: ROSE, marginBottom: 8 }}>{t.petalEditorialLabel}</div>
          <p style={{ fontFamily: SERIF, fontSize: 18, color: INK, lineHeight: 1.7, margin: 0, fontStyle: "italic" }}>{pkg.description}</p>
        </section>
      )}

      {/* Inclusions — heart-marked */}
      {includes.length > 0 && (
        <div id="included" style={{ padding: "22px 18px 0", scrollMarginTop: 88 }}>
          <div style={{ fontFamily: SERIF, fontSize: 11, fontStyle: "italic", color: ROSE, marginBottom: 10 }}>{t.petalWhatsPlanned}</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {includes.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: ROSE, fontSize: 14, flexShrink: 0, marginTop: 1 }}>♡</span>
                <span style={{ fontSize: 13.5, color: INK, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <PtHighlightsSection pkg={pkg} isDesktop={false} lang={lang} />
      <PtHotelsSection pkg={pkg} isDesktop={false} lang={lang} />
      <PtItinerarySection pkg={pkg} isDesktop={false} lang={lang} />
      <RoomTreatments pkg={pkg} lang={lang} onWhatsApp={onWhatsApp} />
      <PtInclusionsSection pkg={pkg} isDesktop={false} lang={lang} />
      <PtMediaSection pkg={pkg} isDesktop={false} />
      <PtTransfersSection pkg={pkg} isDesktop={false} lang={lang} />
      <PtPricingSection pkg={pkg} isDesktop={false} onWhatsApp={onWhatsApp} lang={lang} />
      <PtDeparturesSection pkg={pkg} isDesktop={false} lang={lang} />
      <PtExtrasSection pkg={pkg} isDesktop={false} lang={lang} />
      <PtCustomSection pkg={pkg} isDesktop={false} />
      <PtPeopleSection pkg={pkg} isDesktop={false} lang={lang} />
      <PtFaqSection pkg={pkg} isDesktop={false} lang={lang} />
      <PtImportantNotesSection pkg={pkg} isDesktop={false} lang={lang} />
      <PtReviewsSection pkg={pkg} agency={agency} isDesktop={false} lang={lang} />
      <PtAboutAgencySection pkg={pkg} agency={agency} isDesktop={false} lang={lang} />
      <PtOtherPackagesSection pkg={pkg} isDesktop={false} lang={lang} agencySlug={agency.agencySlug} />
      <PetalDesignerPanel pkg={pkg} agency={agency} lang={lang} onWhatsApp={onWhatsApp} />
      <PtCTABanner pkg={pkg} agency={agency} isDesktop={false} onWhatsApp={onWhatsApp} onMessenger={onMessenger} lang={lang} />
      <PtMobileFooter agency={agency} />
      <StickyCTA price={pkg.price} nights={nights} label={t.bookWhatsApp} onWhatsApp={onWhatsApp} lang={lang} />
    </div>
  );
}

// ─── TemplatePetalCard ────────────────────────────────────────────────────────

export function TemplatePetalCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
