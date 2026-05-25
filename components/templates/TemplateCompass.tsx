"use client";

import React from "react";
import { T } from "@/lib/translations";
import {
  WAButton,
  Eyebrow,
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

const ORANGE  = "#b85c1f";
const SAND    = "#f2f0eb";
const INK     = "#0d1b2e";
const MUTED   = "rgba(13,27,46,0.55)";
const SMUTED  = "rgba(13,27,46,0.35)";
const BORDER  = "rgba(13,27,46,0.08)";
const INTER   = "var(--font-inter-tight, sans-serif)";
const MONO    = "var(--font-jetbrains-mono, ui-monospace, monospace)";

// ─── Section data helpers ─────────────────────────────────────────────────────

type CmSecData = Record<string, unknown>;

function cmFindSec(pkg: TPageProps["pkg"], type: string): CmSecData | undefined {
  return pkg.sections?.find((s) => s.type === type)?.data as CmSecData | undefined;
}
function cmSecArr(data: CmSecData | undefined, key: string): CmSecData[] {
  if (!data) return [];
  const v = data[key];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is CmSecData => x != null && typeof x === "object");
}
function cmSecStr(data: CmSecData | undefined, key: string): string {
  if (!data) return "";
  const v = data[key];
  return typeof v === "string" ? v : "";
}
function cmSecNum(data: CmSecData | undefined, key: string): number | undefined {
  if (!data) return undefined;
  const v = data[key];
  return typeof v === "number" ? v : undefined;
}
function cmSecStrArr(data: CmSecData | undefined, key: string): string[] {
  if (!data) return [];
  const v = data[key];
  return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
}
function cmItemStr(item: CmSecData | string, ...keys: string[]): string {
  if (typeof item === "string") return item;
  for (const k of keys) {
    const v = (item as CmSecData)[k];
    if (typeof v === "string" && v) return v;
  }
  return "";
}

// ─── Compass section components ───────────────────────────────────────────────

function CmHotelsSection({ pkg, isDesktop }: { pkg: TPageProps["pkg"]; isDesktop: boolean }) {
  const data = cmFindSec(pkg, "hotels");
  const hotels = cmSecArr(data, "hotels").length ? cmSecArr(data, "hotels") : cmSecArr(data, "items");
  if (!hotels.length && !pkg.hotelDescription?.trim()) return null;
  const pad = isDesktop ? "0 80px 48px" : "22px 18px 0";
  if (!hotels.length) {
    return (
      <section style={{ padding: pad }}>
        <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 12 }}>Accommodation</div>
          <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.65 }}>{pkg.hotelDescription}</div>
        </div>
      </section>
    );
  }
  return (
    <section style={{ padding: pad }}>
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 10 }}>Where you stay</div>
        <h3 style={{ fontFamily: INTER, fontSize: isDesktop ? 28 : 22, fontWeight: 800, letterSpacing: "-0.5px", margin: "0 0 18px", color: INK }}>Teahouses &amp; lodges</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {hotels.map((h, i) => {
            const nights = cmSecStr(h, "nights");
            const facilities = cmSecStrArr(h, "facilities");
            const stars = cmSecNum(h, "stars");
            return (
              <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden", display: isDesktop ? "flex" : "block" }}>
                {cmSecStr(h, "photo") && (
                  <div style={{ width: isDesktop ? 240 : undefined, height: isDesktop ? "auto" : 140, flexShrink: 0, position: "relative", overflow: "hidden" }}>
                    <img src={cmSecStr(h, "photo")} alt={cmSecStr(h, "name")} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block", minHeight: isDesktop ? 160 : undefined }} />
                    {nights && (
                      <div style={{ position: "absolute", bottom: 8, right: 8, background: ORANGE, color: "#fff", fontFamily: INTER, fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 4 }}>
                        {nights}N
                      </div>
                    )}
                  </div>
                )}
                <div style={{ padding: "14px 16px", flex: 1 }}>
                  {cmSecStr(h, "location") && (
                    <div style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 4 }}>{cmSecStr(h, "location")}</div>
                  )}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: facilities.length ? 8 : 0 }}>
                    <div style={{ fontFamily: INTER, fontSize: 14, fontWeight: 800, color: INK, lineHeight: 1.2 }}>{cmSecStr(h, "name")}</div>
                    {stars != null && (
                      <div style={{ display: "flex", gap: 1, flexShrink: 0 }}>
                        {"★★★★★".split("").map((s, j) => (
                          <span key={j} style={{ fontSize: 10, color: j < Math.round(stars!) ? ORANGE : "rgba(13,27,46,0.2)" }}>{s}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {cmSecStr(h, "note") && <div style={{ fontSize: 12, color: MUTED, marginBottom: facilities.length ? 8 : 0 }}>{cmSecStr(h, "note")}</div>}
                  {facilities.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4 }}>
                      {facilities.slice(0, 5).map((f, j) => (
                        <span key={j} style={{ background: `${ORANGE}10`, borderRadius: 4, fontSize: 10, color: MUTED, padding: "3px 7px" }}>{f}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CmMediaSection({ pkg, isDesktop }: { pkg: TPageProps["pkg"]; isDesktop: boolean }) {
  const mediaSec = cmFindSec(pkg, "media");
  const videoUrl = cmSecStr(mediaSec, "videoUrl") || pkg.videoUrl || "";
  const mapSrc = cmSecStr(mediaSec, "mapImage") || cmSecStr(mediaSec, "mapSrc") || "";
  const mapCaption = cmSecStr(mediaSec, "mapCaption") || "";
  const images = cmSecStrArr(mediaSec, "images");
  if (!videoUrl && !mapSrc && !images.length) return null;
  const pad = isDesktop ? "0 80px 48px" : "22px 18px 0";
  return (
    <section style={{ padding: pad }}>
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 10 }}>Route &amp; film</div>
        <div style={{ display: isDesktop ? "grid" : "flex", gridTemplateColumns: isDesktop ? (mapSrc && videoUrl ? "1.2fr 1fr" : "1fr") : undefined, flexDirection: isDesktop ? undefined : "column" as const, gap: 12 }}>
          {mapSrc && (
            <figure style={{ margin: 0, position: "relative", borderRadius: 12, overflow: "hidden", order: isDesktop ? 1 : 0 }}>
              <img src={mapSrc} alt="route map" style={{ width: "100%", height: isDesktop ? 340 : 220, objectFit: "cover", display: "block" }} />
              <figcaption style={{
                position: "absolute", bottom: 0, left: 0, right: 0,
                background: "linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 100%)",
                padding: "20px 14px 12px",
                color: "#fff", fontSize: 11.5, fontFamily: MONO, letterSpacing: "0.5px",
              }}>
                {mapCaption || "Route map"}
              </figcaption>
            </figure>
          )}
          {videoUrl && (
            <figure style={{ margin: 0, borderRadius: 12, overflow: "hidden", background: INK, position: "relative", height: isDesktop ? 200 : 160, order: isDesktop ? 2 : 1 }}>
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div style={{ width: 52, height: 52, borderRadius: "50%", background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width={20} height={20} viewBox="0 0 24 24" fill="#fff"><path d="M8 5v14l11-7z" /></svg>
                </div>
              </div>
              <figcaption style={{ position: "absolute", bottom: 10, left: 12, fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,0.7)", letterSpacing: "0.5px" }}>Film</figcaption>
            </figure>
          )}
        </div>
        {images.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(images.length, isDesktop ? 4 : 2)}, 1fr)`, gap: 8, marginTop: 10 }}>
            {images.slice(0, isDesktop ? 4 : 4).map((src, i) => (
              <div key={i} style={{ borderRadius: 10, overflow: "hidden", height: 100 }}>
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CmDeparturesSection({ pkg, isDesktop }: { pkg: TPageProps["pkg"]; isDesktop: boolean }) {
  const data = cmFindSec(pkg, "departures");
  const deps = cmSecArr(data, "departures").length ? cmSecArr(data, "departures") : (pkg.departures ?? []).map(d => d as unknown as CmSecData);
  if (!deps.length) return null;
  const seasons = ["Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov"] as const;
  const getSeasonLabel = (dateStr: string) => {
    const m = dateStr.toLowerCase();
    if (m.includes("mar") || m.includes("apr") || m.includes("may")) return "Spring";
    if (m.includes("sep") || m.includes("oct") || m.includes("nov")) return "Autumn";
    return "";
  };
  const pad = isDesktop ? "0 80px 48px" : "22px 18px 0";
  return (
    <section style={{ padding: pad }}>
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 10 }}>Departure windows</div>
        <h3 style={{ fontFamily: INTER, fontSize: isDesktop ? 28 : 22, fontWeight: 800, letterSpacing: "-0.5px", margin: "0 0 18px", color: INK }}>Seasonal openings</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {deps.map((d, i) => {
            const date = cmItemStr(d, "date");
            const spots = cmSecNum(d, "spots") ?? cmSecNum(d, "spotsRemaining");
            const price = cmItemStr(d, "price");
            const season = getSeasonLabel(date);
            const isLow = spots != null && spots <= 4;
            return (
              <div key={i} style={{
                background: "#fff", border: `1px solid ${BORDER}`,
                borderRadius: 12, padding: "14px 16px",
                display: "flex", alignItems: "center", gap: 12,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    {season && (
                      <span style={{ fontFamily: MONO, fontSize: 9, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" as const, color: ORANGE, background: `${ORANGE}12`, padding: "2px 7px", borderRadius: 4 }}>{season}</span>
                    )}
                    <span style={{ fontFamily: INTER, fontSize: 13.5, fontWeight: 700, color: INK }}>{date}</span>
                  </div>
                  {spots != null && (
                    <div style={{ fontSize: 11.5, color: isLow ? ORANGE : MUTED, fontWeight: isLow ? 700 : 400 }}>
                      {isLow ? `Only ${spots} spots left` : `${spots} spots available`}
                    </div>
                  )}
                </div>
                {price && <div style={{ fontFamily: INTER, fontSize: 15, fontWeight: 800, color: ORANGE }}>{price}</div>}
                <button style={{
                  background: ORANGE, color: "#fff",
                  border: "none", borderRadius: 8, padding: "8px 16px",
                  fontFamily: INTER, fontSize: 12, fontWeight: 700, cursor: "pointer", flexShrink: 0,
                }}>Reserve</button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CmFaqSection({ pkg, isDesktop }: { pkg: TPageProps["pkg"]; isDesktop: boolean }) {
  const data = cmFindSec(pkg, "faq");
  const items = cmSecArr(data, "items");
  if (!items.length) return null;
  const pad = isDesktop ? "0 80px 48px" : "22px 18px 0";
  return (
    <section style={{ padding: pad }}>
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 10 }}>Common questions</div>
        <div style={{ display: isDesktop ? "grid" : "flex", gridTemplateColumns: isDesktop ? "1fr 1fr" : undefined, flexDirection: isDesktop ? undefined : "column" as const, gap: 0 }}>
          {items.map((f, i) => {
            const q = cmItemStr(f, "q", "question");
            const a = cmItemStr(f, "a", "answer");
            return (
              <div key={i} style={{ borderBottom: `1px solid ${BORDER}`, padding: "14px 0", paddingRight: isDesktop && i % 2 === 0 ? 24 : 0, paddingLeft: isDesktop && i % 2 === 1 ? 24 : 0 }}>
                <div style={{ fontFamily: INTER, fontSize: isDesktop ? 14 : 13.5, fontWeight: 800, color: INK, lineHeight: 1.3, marginBottom: 6 }}>{q}</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.65 }}>{a}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CmImportantNotesSection({ pkg, isDesktop }: { pkg: TPageProps["pkg"]; isDesktop: boolean }) {
  const data = cmFindSec(pkg, "important_notes");
  const notes = cmSecArr(data, "notes");
  const items = notes.length ? notes : cmSecArr(data, "items");
  if (!items.length) return null;
  const pad = isDesktop ? "0 80px 48px" : "22px 18px 0";
  return (
    <section style={{ padding: pad }}>
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 10 }}>Before you go</div>
        <h3 style={{ fontFamily: INTER, fontSize: isDesktop ? 28 : 22, fontWeight: 800, letterSpacing: "-0.5px", margin: "0 0 16px", color: INK }}>Important notes</h3>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "1fr", gap: 10 }}>
          {items.map((n, i) => {
            const severity = cmItemStr(n, "severity");
            const title = cmItemStr(n, "title", "text");
            const body = cmItemStr(n, "body");
            const isWarn = severity === "warn";
            return (
              <div key={i} style={{
                background: "#fff",
                borderLeft: `3px solid ${isWarn ? ORANGE : BORDER.replace("0.08", "0.3")}`,
                borderRadius: "0 10px 10px 0",
                border: `1px solid ${BORDER}`,
                borderLeftColor: isWarn ? ORANGE : BORDER.replace("0.08", "0.3"),
                borderLeftWidth: 3,
                padding: "14px 16px",
              }}>
                {isWarn && (
                  <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase" as const, color: ORANGE, marginBottom: 5, display: "flex", alignItems: "center", gap: 4 }}>
                    <span>⚠</span> Important
                  </div>
                )}
                <div style={{ fontFamily: INTER, fontSize: 13.5, fontWeight: 700, color: INK, lineHeight: 1.3, marginBottom: body ? 6 : 0 }}>{title}</div>
                {body && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>{body}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CmAboutAgencySection({ pkg, agency, isDesktop }: { pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; isDesktop: boolean }) {
  const data = cmFindSec(pkg, "about_agency");
  if (!data && !agency.tagline) return null;
  const story = cmItemStr(data || {}, "story", "content");
  const foundedRaw = (data as CmSecData | undefined)?.founded;
  const founded = typeof foundedRaw === "number" ? foundedRaw : undefined;
  const teamSize = cmSecStr(data, "teamSize");
  const teamPhoto = cmSecStr(data, "teamPhoto") || cmSecStr(data, "image");
  const currentYear = new Date().getFullYear();
  const pad = isDesktop ? "0 80px 64px" : "22px 18px 0";
  return (
    <section style={{ padding: pad }}>
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 10 }}>About {agency.name}</div>
        {isDesktop && teamPhoto ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>
            <div>
              {story && <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.65, margin: "0 0 20px" }}>{story}</p>}
              {(founded || teamSize) && (
                <div style={{ display: "flex", gap: 24, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
                  {founded && (
                    <div>
                      <div style={{ fontFamily: INTER, fontSize: 28, fontWeight: 800, color: ORANGE, lineHeight: 1 }}>{currentYear - founded}+</div>
                      <div style={{ fontSize: 10, color: MUTED, marginTop: 3, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>Years</div>
                    </div>
                  )}
                  {teamSize && (
                    <div>
                      <div style={{ fontFamily: INTER, fontSize: 28, fontWeight: 800, color: ORANGE, lineHeight: 1 }}>{teamSize}</div>
                      <div style={{ fontSize: 10, color: MUTED, marginTop: 3, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>Team</div>
                    </div>
                  )}
                  <div>
                    <div style={{ fontFamily: INTER, fontSize: 28, fontWeight: 800, color: ORANGE, lineHeight: 1 }}>97%</div>
                    <div style={{ fontSize: 10, color: MUTED, marginTop: 3, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>Summit rate</div>
                  </div>
                </div>
              )}
            </div>
            <div style={{ height: 280, borderRadius: 14, overflow: "hidden" }}>
              <img src={teamPhoto} alt={`${agency.name} team`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
        ) : (
          <>
            {teamPhoto && (
              <div style={{ height: 200, borderRadius: 12, overflow: "hidden", marginBottom: 14 }}>
                <img src={teamPhoto} alt={`${agency.name} team`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            {story && <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65, margin: "0 0 16px" }}>{story}</p>}
            {(founded || teamSize) && (
              <div style={{ display: "flex", gap: 0, borderTop: `1px solid ${BORDER}`, paddingTop: 14 }}>
                {founded && (
                  <div style={{ flex: 1, textAlign: "center" as const, borderRight: `1px solid ${BORDER}`, padding: "8px 0" }}>
                    <div style={{ fontFamily: INTER, fontSize: 22, fontWeight: 800, color: ORANGE, lineHeight: 1 }}>{currentYear - founded}+</div>
                    <div style={{ fontSize: 10, color: MUTED, marginTop: 3, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Years</div>
                  </div>
                )}
                <div style={{ flex: 1, textAlign: "center" as const, padding: "8px 0" }}>
                  <div style={{ fontFamily: INTER, fontSize: 22, fontWeight: 800, color: ORANGE, lineHeight: 1 }}>97%</div>
                  <div style={{ fontSize: 10, color: MUTED, marginTop: 3, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>Summit rate</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// ─── Difficulty bar ───────────────────────────────────────────────────────────

function DifficultyBar({ difficulty, lang, expanded = false }: { difficulty: TPageProps["pkg"]["difficulty"]; lang: TPageProps["lang"]; expanded?: boolean }) {
  const t = T[lang];
  if (!difficulty) return null;
  const levels = ["easy", "moderate", "strenuous", "extreme"] as const;
  const levelIndex = levels.indexOf(difficulty);
  const labels: Record<string, string> = {
    easy:      t.difficultyEasy,
    moderate:  t.difficultyModerate,
    strenuous: t.difficultyStrenuous,
    extreme:   t.difficultyExtreme,
  };
  const colors: Record<string, string> = { easy: "#2dd4a0", moderate: "#f59e0b", strenuous: ORANGE, extreme: "#ef4444" };
  const color = colors[difficulty] || ORANGE;

  return (
    <div style={{ marginTop: expanded ? 0 : 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: expanded ? 12 : 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, color: MUTED }}>{t.difficultyLabel}</div>
        <div style={{ fontSize: expanded ? 18 : 11.5, fontWeight: 800, color, fontFamily: INTER }}>{labels[difficulty] || difficulty}</div>
      </div>
      <div style={{ height: expanded ? 10 : 5, background: "rgba(13,27,46,0.08)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${(levelIndex + 1) * 25}%`, background: color, borderRadius: 99, transition: "width 0.3s" }} />
      </div>
    </div>
  );
}

// ─── Trust items ──────────────────────────────────────────────────────────────

function buildCompassTrustItems(t: typeof T["en"]): { icon: React.ReactNode; title: string; sub?: string }[] {
  return [
    { icon: "✈", title: t.trustHelicopterEvac, sub: t.trustHelicopterEvacSub },
    { icon: "✓", title: t.trustGuideRatioTrust, sub: t.trustGuideRatioTrustSub },
    { icon: "◎", title: t.trustAcclimatisationDays, sub: t.trustAcclimatisationDaysSub },
    { icon: "📡", title: t.trustSatPhone, sub: t.trustSatPhoneSub },
  ];
}

// ─── Trek stats band ─────────────────────────────────────────────────────────

function TrekStatsBand({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const nights = pkg.nights ? Number(pkg.nights) : null;
  const diffLabels: Record<string, string> = {
    easy:      t.difficultyEasy,
    moderate:  t.difficultyModerate,
    strenuous: t.difficultyStrenuous,
    extreme:   t.difficultyExtreme,
  };
  const cells = [
    ...(pkg.maxAltitude ? [{ v: pkg.maxAltitude.toLocaleString(), u: t.metersUnit, l: t.altitudeLabel }] : []),
    ...(pkg.distanceKm ? [{ v: String(pkg.distanceKm), u: t.kmUnit, l: t.distanceLabel }] : []),
    ...(nights ? [{ v: String(nights), u: ` ${t.nightsLabel}`, l: t.tripLengthLabel }] : []),
    { v: "1:4", u: "", l: t.guideRatioLabel },
    ...(pkg.difficulty ? [{ v: diffLabels[pkg.difficulty] || pkg.difficulty, u: "", l: t.difficultyLabel }] : []),
  ];
  if (!cells.length) return null;

  return (
    <div style={{
      background: INK,
      display: "grid",
      gridTemplateColumns: `repeat(${cells.length}, 1fr)`,
    }}>
      {cells.map((s, i) => (
        <div key={i} style={{
          padding: "22px 20px",
          borderRight: i < cells.length - 1 ? "1px solid rgba(255,255,255,0.08)" : undefined,
        }}>
          <div style={{ fontFamily: INTER, fontSize: 26, fontWeight: 800, color: ORANGE, lineHeight: 1, letterSpacing: "-0.5px" }}>
            {s.v}<span style={{ fontSize: 13, fontWeight: 600, opacity: 0.7, marginLeft: 2 }}>{s.u}</span>
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, letterSpacing: "0.8px", marginTop: 5 }}>{s.l}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Honest difficulty section ────────────────────────────────────────────────

function HonestDifficultySection({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: TPageProps["lang"] }) {
  const t = T[lang];
  if (!pkg.difficulty) return null;
  const isRtl = lang === "ar";

  return (
    <DContainer id="difficulty" style={{ padding: "56px 80px", scrollMarginTop: 88 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, direction: isRtl ? "rtl" : "ltr" }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 10 }}>
            {t.beforeYouBookLabel}
          </div>
          <h2 style={{ fontFamily: INTER, fontSize: 36, fontWeight: 800, letterSpacing: "-1px", color: INK, margin: "0 0 16px", lineHeight: 1.1 }}>
            {t.honestDifficultyLabel}
          </h2>
          {pkg.fitnessNote && (
            <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.65, margin: 0 }}>{pkg.fitnessNote}</p>
          )}
        </div>
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, padding: "28px 28px" }}>
          <DifficultyBar difficulty={pkg.difficulty} lang={lang} expanded />
          {pkg.fitnessNote && (
            <div style={{ marginTop: 16, fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
              <b style={{ color: INK }}>{t.fitnessLabel}: </b>{pkg.fitnessNote}
            </div>
          )}
        </div>
      </div>
    </DContainer>
  );
}

// ─── Guide closing panel ──────────────────────────────────────────────────────

function CompassGuidePanel({ pkg, agency, lang, onWhatsApp }: { pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; lang: TPageProps["lang"]; onWhatsApp: () => void }) {
  const t = T[lang];
  const agent = pkg.agent;
  const firstName = agent?.name?.split(" ")[0] || agency.name;
  const isRtl = lang === "ar";

  return (
    <section style={{ background: INK, padding: "40px 24px", direction: isRtl ? "rtl" : "ltr" }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.45)", marginBottom: 20 }}>
        {t.compassLeadGuide} · {agency.name}
      </div>
      {agent && (
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20 }}>
          {agent.avatar
            ? <img src={agent.avatar} alt={agent.name} style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover" }} />
            : <div style={{ width: 60, height: 60, borderRadius: "50%", background: `${ORANGE}44`, flexShrink: 0 }} />
          }
          <div>
            <div style={{ fontFamily: INTER, fontSize: 20, fontWeight: 800, color: "#fff", lineHeight: 1.1, letterSpacing: "-0.5px" }}>{agent.name}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>{agent.role}</div>
          </div>
        </div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginBottom: 22 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "6px 12px" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
          <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.85)" }}>{t.agentOnlineLabel}</span>
        </div>
        <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "6px 12px", fontSize: 11.5, color: "rgba(255,255,255,0.7)" }}>
          ✓ {t.compassUiagmCertified}
        </div>
      </div>
      <WAButton label={`${t.messageUs.replace(" ▷", "")} ${firstName}`} full onClick={onWhatsApp} />
      <button style={{
        width: "100%", marginTop: 10, padding: "12px", borderRadius: 10,
        border: "1px solid rgba(255,255,255,0.25)", background: "transparent",
        color: "rgba(255,255,255,0.75)", fontSize: 13, cursor: "pointer", fontFamily: "inherit",
      }}>
        {t.compassFitnessAssessment}
      </button>
    </section>
  );
}

function CompassGuidePanelDesktop({ pkg, agency, lang, onWhatsApp }: { pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; lang: TPageProps["lang"]; onWhatsApp: () => void }) {
  const t = T[lang];
  const agent = pkg.agent;
  const firstName = agent?.name?.split(" ")[0] || agency.name;
  const isRtl = lang === "ar";

  return (
    <section style={{ background: INK }}>
      <DContainer style={{ padding: "72px 80px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.6fr", gap: 64, alignItems: "center" }}>
          {/* Portrait */}
          <div style={{
            order: isRtl ? 2 : 1,
            position: "relative", height: 420,
            overflow: "hidden", background: `${ORANGE}22`,
            borderRadius: 16,
          }}>
            {agent?.avatar
              ? <img src={agent.avatar} alt={agent?.name} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${ORANGE}44, ${INK})` }} />
            }
          </div>
          {/* Content */}
          <div style={{ order: isRtl ? 1 : 2 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.45)", marginBottom: 16 }}>
              {t.compassLeadGuide} · {agency.name}
            </div>
            {agent && (
              <>
                <div style={{ fontFamily: INTER, fontSize: 40, fontWeight: 800, color: "#fff", letterSpacing: "-1.5px", lineHeight: 1.05, marginBottom: 6 }}>{agent.name}</div>
                <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 24 }}>{agent.role}</div>
              </>
            )}
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10, marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "7px 14px" }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.85)" }}>{t.agentOnlineLabel}</span>
              </div>
              <div style={{ background: "rgba(255,255,255,0.08)", borderRadius: 20, padding: "7px 14px", fontSize: 12, color: "rgba(255,255,255,0.7)" }}>
                ✓ {t.compassUiagmCertified}
              </div>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <WAButton label={`${t.messageUs.replace(" ▷", "")} ${firstName}`} size="lg" onClick={onWhatsApp} />
              <button style={{
                padding: "14px 22px", borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.25)", background: "transparent",
                color: "rgba(255,255,255,0.75)", fontSize: 14, cursor: "pointer", fontFamily: "inherit",
              }}>
                {t.compassFitnessAssessment}
              </button>
            </div>
          </div>
        </div>
      </DContainer>
    </section>
  );
}

// ─── Missing section components ─────────────────────────────────────────────

function CmHighlightsSection({ pkg, isDesktop }: { pkg: TPageProps["pkg"]; isDesktop: boolean }) {
  const data  = cmFindSec(pkg, "highlights");
  const items = cmSecArr(data, "items").map(i => cmItemStr(i, "text")).filter(Boolean);
  if (!items.length) return null;
  const pad = isDesktop ? "0 80px 48px" : "22px 18px 0";
  return (
    <section style={{ padding: pad }}>
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 12 }}>Trek highlights</div>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
          {items.map((item, i) => (
            <div key={i} style={{ background: `${ORANGE}10`, border: `1px solid ${ORANGE}30`, borderRadius: 6, padding: "7px 14px", fontSize: 12.5, fontWeight: 700, color: ORANGE }}>{item}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CmInclusionsSection({ pkg, isDesktop }: { pkg: TPageProps["pkg"]; isDesktop: boolean }) {
  const data     = cmFindSec(pkg, "inclusions");
  const includes = (data?.includes as string[] | undefined) ?? pkg.includes ?? [];
  const excludes = (data?.excludes as string[] | undefined) ?? pkg.excludes ?? [];
  if (!includes.length && !excludes.length) return null;
  const pad = isDesktop ? "0 80px 48px" : "22px 18px 0";
  return (
    <section id="included" style={{ padding: pad, scrollMarginTop: 88 }}>
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <Eyebrow text="What's included" brand={ORANGE} />
        {includes.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3,1fr)" : "1fr 1fr", gap: 8, marginBottom: excludes.length ? 16 : 0, marginTop: 16 }}>
            {includes.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px" }}>
                <span style={{ color: ORANGE, fontSize: 11, fontWeight: 800, marginTop: 1, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 12, color: MUTED, lineHeight: 1.4 }}>{item}</span>
              </div>
            ))}
          </div>
        )}
        {excludes.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 8 }}>Not included</div>
            {excludes.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, color: MUTED, marginBottom: 6 }}>
                <span style={{ color: "rgba(13,27,46,0.3)", fontWeight: 700 }}>—</span>
                <span>{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function CmPricingSection({ pkg, isDesktop, onWhatsApp, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; onWhatsApp: () => void; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data  = cmFindSec(pkg, "pricing");
  const tiers = cmSecArr(data, "tiers").length ? cmSecArr(data, "tiers") : (pkg.pricingTiers ?? []).map(t2 => ({ label: t2.label, price: t2.price, was: t2.was, perks: t2.perks, pop: t2.pop }));
  if (!tiers.length) return null;
  const pad = isDesktop ? "0 80px 48px" : "22px 18px 0";
  return (
    <section id="pricing" style={{ padding: pad, scrollMarginTop: 88 }}>
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <Eyebrow text={t.navPricing} brand={ORANGE} />
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? `repeat(${Math.min(tiers.length, 3)},1fr)` : "1fr", gap: 12, marginTop: 16 }}>
          {tiers.map((tier, i) => {
            const pop   = !!tier.pop;
            const label = cmItemStr(tier, "label");
            const price = cmItemStr(tier, "price");
            const was   = cmItemStr(tier, "was");
            const perks = (tier.perks as string[] | undefined) ?? [];
            return (
              <div key={i} style={{ background: pop ? ORANGE : "#fff", border: `1px solid ${pop ? ORANGE : BORDER}`, borderRadius: 14, padding: isDesktop ? "24px 24px" : "18px 18px", display: "flex", flexDirection: "column" as const }}>
                {pop && <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.75)", marginBottom: 8 }}>Most popular</div>}
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" as const, color: pop ? "rgba(255,255,255,0.75)" : MUTED, marginBottom: 6 }}>{label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                  <div style={{ fontFamily: INTER, fontSize: isDesktop ? 34 : 28, fontWeight: 800, letterSpacing: "-0.5px", color: pop ? "#fff" : ORANGE, lineHeight: 1 }}>{price}</div>
                  {was && <div style={{ fontSize: 13, textDecoration: "line-through", color: pop ? "rgba(255,255,255,0.5)" : MUTED }}>{was}</div>}
                </div>
                <div style={{ fontSize: 11, color: pop ? "rgba(255,255,255,0.65)" : MUTED, marginBottom: perks.length ? 14 : 0 }}>{t.perPerson}</div>
                {perks.length > 0 && (
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 14px", display: "flex", flexDirection: "column" as const, gap: 8, borderTop: `1px solid ${pop ? "rgba(255,255,255,0.2)" : BORDER}`, paddingTop: 12 }}>
                    {perks.map((p, j) => (
                      <li key={j} style={{ display: "flex", gap: 8, fontSize: 12.5, color: pop ? "rgba(255,255,255,0.85)" : MUTED }}>
                        <span style={{ color: pop ? "rgba(255,255,255,0.7)" : ORANGE, fontWeight: 700, flexShrink: 0 }}>✓</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
                <button onClick={onWhatsApp} style={{ marginTop: "auto", background: pop ? "rgba(255,255,255,0.2)" : `${ORANGE}12`, border: `1px solid ${pop ? "rgba(255,255,255,0.3)" : `${ORANGE}30`}`, borderRadius: 8, padding: "10px 0", fontSize: 13, fontWeight: 700, color: pop ? "#fff" : ORANGE, fontFamily: INTER, cursor: "pointer" }}>
                  {t.bookWhatsApp}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CmTransfersSection({ pkg, isDesktop }: { pkg: TPageProps["pkg"]; isDesktop: boolean }) {
  const data  = cmFindSec(pkg, "transfers");
  const items = cmSecArr(data, "items");
  if (!items.length) return null;
  const pad = isDesktop ? "0 80px 48px" : "22px 18px 0";
  return (
    <section style={{ padding: pad }}>
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 14 }}>Transfers</div>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
          {items.map((item, i) => {
            const from = cmItemStr(item, "from");
            const to   = cmItemStr(item, "to");
            const type = cmItemStr(item, "type", "transportType");
            const note = cmItemStr(item, "note", "details");
            return (
              <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  {(from || to) && <div style={{ fontFamily: INTER, fontSize: 13.5, fontWeight: 700, color: INK, marginBottom: 4 }}>{from}{from && to ? " → " : ""}{to}</div>}
                  {type && <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", color: ORANGE, textTransform: "uppercase" as const }}>{type}</div>}
                  {note && <div style={{ fontSize: 12, color: MUTED, marginTop: 4 }}>{note}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CmExtrasSection({ pkg, isDesktop }: { pkg: TPageProps["pkg"]; isDesktop: boolean }) {
  const data  = cmFindSec(pkg, "extras");
  const items = cmSecArr(data, "items");
  if (!items.length) return null;
  const pad = isDesktop ? "0 80px 48px" : "22px 18px 0";
  return (
    <section style={{ padding: pad }}>
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 14 }}>Optional add-ons</div>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2,1fr)" : "1fr", gap: 8 }}>
          {items.map((item, i) => {
            const name  = cmItemStr(item, "name", "title");
            const price = cmItemStr(item, "price");
            const desc  = cmItemStr(item, "description", "desc");
            return (
              <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: INTER, fontSize: 13, fontWeight: 700, color: INK }}>{name}</div>
                  {desc && <div style={{ fontSize: 12, color: MUTED, marginTop: 4, lineHeight: 1.5 }}>{desc}</div>}
                </div>
                {price && <div style={{ fontFamily: MONO, fontSize: 13, fontWeight: 700, color: ORANGE, flexShrink: 0 }}>{price}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CmCustomSection({ pkg, isDesktop }: { pkg: TPageProps["pkg"]; isDesktop: boolean }) {
  const data    = cmFindSec(pkg, "custom");
  const heading = cmSecStr(data, "heading");
  const content = cmSecStr(data, "content");
  const image   = cmSecStr(data, "image");
  if (!heading && !content) return null;
  const pad = isDesktop ? "0 80px 48px" : "22px 18px 0";
  return (
    <section style={{ padding: pad }}>
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        {heading && <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 12 }}>{heading}</div>}
        {image && <img src={image} alt={heading} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 12, marginBottom: 16, display: "block" }} />}
        {content && <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.7 }}>{content}</div>}
      </div>
    </section>
  );
}

function CmPeopleSection({ pkg, isDesktop }: { pkg: TPageProps["pkg"]; isDesktop: boolean }) {
  const data   = cmFindSec(pkg, "people");
  const people = cmSecArr(data, "people");
  if (!people.length) return null;
  const pad = isDesktop ? "0 80px 48px" : "22px 18px 0";
  return (
    <section style={{ padding: pad }}>
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 14 }}>Your team</div>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2,1fr)" : "1fr", gap: 12 }}>
          {people.map((person, i) => {
            const name  = cmItemStr(person, "name");
            const role  = cmItemStr(person, "role");
            const bio   = cmItemStr(person, "bio");
            const photo = cmItemStr(person, "photo");
            const years = person.years as number | undefined;
            const langs = (person.languages as string[] | undefined) ?? [];
            return (
              <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                {photo
                  ? <img src={photo} alt={name} style={{ width: 56, height: 56, borderRadius: 8, objectFit: "cover", flexShrink: 0 }} />
                  : <div style={{ width: 56, height: 56, borderRadius: 8, background: `${ORANGE}12`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontSize: 20, fontWeight: 800, color: ORANGE, flexShrink: 0 }}>{name?.[0]}</div>
                }
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: INTER, fontSize: 14, fontWeight: 800, color: INK }}>{name}</div>
                  {role && <div style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, letterSpacing: "0.8px", color: ORANGE, textTransform: "uppercase" as const, marginTop: 2 }}>{role}{years ? ` · ${years}y exp` : ""}</div>}
                  {bio && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, marginTop: 8 }}>{bio}</div>}
                  {langs.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4, marginTop: 10 }}>
                      {langs.map((l, j) => <div key={j} style={{ background: `${ORANGE}0c`, border: `1px solid ${ORANGE}20`, borderRadius: 4, padding: "2px 7px", fontSize: 10.5, fontWeight: 600, color: ORANGE }}>{l}</div>)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function CmReviewsSection({ pkg, agency, isDesktop, lang }: { pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
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

  const pad = isDesktop ? "0 80px 48px" : "22px 18px 0";
  return (
    <section style={{ padding: pad }}>
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 14 }}>
          {showList ? `${reviews.length} verified reviews` : t.writeReviewTitle}
        </div>
        {showList && (
          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2,1fr)" : "1fr", gap: 10, marginBottom: canSubmit ? 24 : 0 }}>
            {reviews.map((r, i) => (
              <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: INTER, fontSize: 13.5, fontWeight: 700, color: INK }}>{r.name}</div>
                    {r.country && <div style={{ fontFamily: MONO, fontSize: 10, color: MUTED, marginTop: 2 }}>{r.country}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 1 }}>{[1,2,3,4,5].map(n => <span key={n} style={{ color: n <= r.rating ? ORANGE : "rgba(13,27,46,0.15)", fontSize: 12 }}>★</span>)}</div>
                </div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{r.text}</div>
              </div>
            ))}
          </div>
        )}
        {canSubmit && status !== "ok" && (
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: isDesktop ? "24px 28px" : "18px 18px" }}>
            <div style={{ fontFamily: INTER, fontSize: 15, fontWeight: 800, color: INK, marginBottom: 14 }}>{t.writeReviewTitle}</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", fontSize: 22, color: n <= (hover || rating) ? ORANGE : "rgba(13,27,46,0.15)", lineHeight: 1 }}>★</button>
              ))}
            </div>
            <input placeholder={t.reviewYourName} value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: INTER, background: "transparent", color: INK, marginBottom: 8, boxSizing: "border-box" as const }} />
            <textarea placeholder={t.reviewPlaceholder} value={text} onChange={e => setText(e.target.value)} rows={3} style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: INTER, background: "transparent", color: INK, marginBottom: 14, resize: "none" as const, boxSizing: "border-box" as const }} />
            <button onClick={handleSubmit} disabled={status === "sending"} style={{ background: ORANGE, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, fontFamily: INTER, cursor: "pointer" }}>{status === "sending" ? "Sending…" : t.submitReviewBtn}</button>
            {status === "err" && <div style={{ fontSize: 12, color: "#c0392b", marginTop: 8 }}>Something went wrong.</div>}
          </div>
        )}
        {status === "ok" && <div style={{ background: `${ORANGE}10`, border: `1px solid ${ORANGE}30`, borderRadius: 10, padding: "14px 18px", fontSize: 13, color: ORANGE, fontWeight: 600 }}>{t.reviewSubmitSuccess}</div>}
      </div>
    </section>
  );
}

function CmTrustStrip({ items }: { items: { icon: React.ReactNode; title: string; sub?: string }[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, padding: "16px 80px" }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", borderRight: i < items.length - 1 ? `1px solid ${BORDER}` : "none", paddingRight: 16, paddingLeft: i ? 16 : 0 }}>
          <span style={{ color: ORANGE, display: "flex", marginTop: 1 }}>{item.icon}</span>
          <div>
            <div style={{ fontFamily: INTER, fontSize: 12, fontWeight: 700, color: INK }}>{item.title}</div>
            {item.sub && <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{item.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

function CmCTABanner({ pkg, agency, isDesktop, onWhatsApp, onMessenger, lang }: { pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; isDesktop: boolean; onWhatsApp: () => void; onMessenger: () => void; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const nights = pkg.nights ? Number(pkg.nights) : null;
  const pad = isDesktop ? "48px 80px 64px" : "24px 18px";
  return (
    <section style={{ padding: pad, background: INK, color: "#fff" }}>
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined, display: "flex", flexDirection: isDesktop ? "row" as const : "column" as const, justifyContent: "space-between", alignItems: isDesktop ? "center" : "flex-start", gap: 24 }}>
        <div>
          <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: ORANGE, marginBottom: 8 }}>Ready to summit?</div>
          <div style={{ fontFamily: INTER, fontSize: isDesktop ? 36 : 28, fontWeight: 800, letterSpacing: "-0.8px", color: "#fff", lineHeight: 1 }}>{pkg.price}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>{nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.perPerson}</div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
          <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />
          {pkg.messenger && <button onClick={onMessenger} style={{ background: "#0084ff", color: "#fff", border: "none", borderRadius: 8, padding: "14px 22px", fontSize: 14, fontWeight: 700, fontFamily: INTER, cursor: "pointer" }}>Messenger</button>}
        </div>
      </div>
    </section>
  );
}

function CmMobileFooter({ agency }: { agency: TPageProps["agency"] }) {
  return (
    <div style={{ padding: "24px 18px", background: INK, borderTop: `1px solid rgba(255,255,255,0.08)`, textAlign: "center" as const }}>
      {agency.logoUrl && <img src={agency.logoUrl} alt={agency.name} style={{ height: 28, objectFit: "contain", display: "block", margin: "0 auto 10px", filter: "brightness(0) invert(1)" }} />}
      <div style={{ fontFamily: INTER, fontSize: 14, fontWeight: 700, color: "#fff" }}>{agency.name}</div>
      {agency.tagline && <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{agency.tagline}</div>}
    </div>
  );
}

// ─── TemplateCompassPage ──────────────────────────────────────────────────────

export function TemplateCompassPage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const nights     = pkg.nights ? Number(pkg.nights) : null;
  const coverImage = pkg.coverImage || "";
  const title      = pkg.title || pkg.destination;
  const isRtl      = lang === "ar";
  const itinerary  = getItineraryDays(pkg).filter(it => it.title?.trim());
  const includes   = pkg.includes?.length ? pkg.includes : (pkg.advantages || []);
  const isDesktop  = useIsDesktop();
  const trustItems = buildCompassTrustItems(t);

  const altitudeLabel = pkg.maxAltitude ? `${pkg.maxAltitude.toLocaleString()}${t.metersUnit}` : pkg.price;

  const navLinks = [
    ...(itinerary.length ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...(includes.length ? [{ label: t.navIncluded, href: "#included" }] : []),
    ...((pkg.pricingTiers || []).some(t2 => t2.price) ? [{ label: t.navPricing, href: "#pricing" }] : []),
  ];

  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: SAND, color: INK, fontFamily: INTER, direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={ORANGE} navLinks={navLinks} lang={lang} onWhatsApp={onWhatsApp} />

        {/* Hero: text LEFT, image RIGHT (50/50 split) */}
        <DContainer style={{ padding: "80px 80px 64px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 64, alignItems: "center" }}>
            {/* Text column */}
            <div style={{ order: isRtl ? 2 : 1 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 12 }}>
                {pkg.destination}
              </div>
              <h1 style={{ fontFamily: INTER, fontSize: 58, fontWeight: 800, lineHeight: 0.97, letterSpacing: "-2px", margin: "0 0 20px", color: INK }}>{title}</h1>
              {pkg.description && (
                <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.65, margin: "0 0 24px" }}>{pkg.description}</p>
              )}
              <div style={{ fontFamily: INTER, fontSize: 36, fontWeight: 800, color: ORANGE, letterSpacing: "-0.8px", lineHeight: 1 }}>{pkg.price}</div>
              <div style={{ fontSize: 11.5, color: SMUTED, marginTop: 4, marginBottom: 20, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{t.perPerson}</div>
              {pkg.difficulty && (
                <div style={{ maxWidth: 320, marginBottom: 20 }}>
                  <DifficultyBar difficulty={pkg.difficulty} lang={lang} />
                </div>
              )}
              <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />
            </div>
            {/* Image column */}
            <div style={{ order: isRtl ? 1 : 2, position: "relative", height: 520, borderRadius: 16, overflow: "hidden", background: INK }}>
              {coverImage
                ? <img src={coverImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${ORANGE}cc, ${ORANGE}55)` }} />
              }
            </div>
          </div>
        </DContainer>

        {/* 5-col stats band */}
        <TrekStatsBand pkg={pkg} lang={lang} />

        {/* Trust strip */}
        <CmTrustStrip items={trustItems} />

        {/* Honest difficulty section */}
        <HonestDifficultySection pkg={pkg} lang={lang} />

        {/* Includes 3-col */}
        {includes.length > 0 && (
          <DContainer id="included" style={{ padding: "0 80px 56px" }}>
            <Eyebrow text={t.includedLabel} brand={ORANGE} />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 16 }}>
              {includes.slice(0, 9).map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "12px 14px" }}>
                  <span style={{ color: ORANGE, fontSize: 11, fontWeight: 800, marginTop: 1, flexShrink: 0 }}>✓</span>
                  <span style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.4 }}>{item}</span>
                </div>
              ))}
            </div>
          </DContainer>
        )}

        {/* Day-by-day itinerary */}
        {itinerary.length > 0 && (
          <DContainer id="itinerary" style={{ padding: "0 80px 64px" }}>
            <Eyebrow text={t.dayByDay} brand={ORANGE} />
            <h2 style={{ fontFamily: INTER, fontSize: 32, fontWeight: 800, letterSpacing: "-0.7px", margin: "10px 0 24px" }}>{t.compassDailyMetrics}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {itinerary.map((it, i) => (
                <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: 20 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: ORANGE, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 6 }}>
                    {t.dayLabel} {it.day}
                    {it.km ? ` · ${it.km}${t.kmUnit}` : ""}
                    {it.alt ? ` · ${it.alt}${t.metersUnit}` : ""}
                  </div>
                  <div style={{ fontFamily: INTER, fontSize: 13.5, fontWeight: 700, color: INK, lineHeight: 1.3, marginBottom: it.desc ? 6 : 0 }}>{it.title}</div>
                  {it.desc && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.5 }}>{it.desc}</div>}
                </div>
              ))}
            </div>
          </DContainer>
        )}

        <CmHotelsSection pkg={pkg} isDesktop={true} />
        <CmMediaSection pkg={pkg} isDesktop={true} />
        <CmHighlightsSection pkg={pkg} isDesktop={true} />
        <CmInclusionsSection pkg={pkg} isDesktop={true} />
        <CmPricingSection pkg={pkg} isDesktop={true} onWhatsApp={onWhatsApp} lang={lang} />
        <CmTransfersSection pkg={pkg} isDesktop={true} />
        <CmExtrasSection pkg={pkg} isDesktop={true} />
        <CmCustomSection pkg={pkg} isDesktop={true} />
        <CmPeopleSection pkg={pkg} isDesktop={true} />
        <CmDeparturesSection pkg={pkg} isDesktop={true} />
        <CmFaqSection pkg={pkg} isDesktop={true} />
        <CmImportantNotesSection pkg={pkg} isDesktop={true} />
        <CmReviewsSection pkg={pkg} agency={agency} isDesktop={true} lang={lang} />
        <CmAboutAgencySection pkg={pkg} agency={agency} isDesktop={true} />
        <CompassGuidePanelDesktop pkg={pkg} agency={agency} lang={lang} onWhatsApp={onWhatsApp} />
        <CmCTABanner pkg={pkg} agency={agency} isDesktop={true} onWhatsApp={onWhatsApp} onMessenger={onMessenger} lang={lang} />
        <DesktopFooter agency={agency} brand={ORANGE} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: SAND, color: INK, fontFamily: INTER, direction: isRtl ? "rtl" : "ltr" }}>
      <AgencyBar agency={agency} price={pkg.price} brand={ORANGE} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} />

      {/* Hero: full-bleed with strong bottom gradient on mobile */}
      <div style={{ position: "relative", height: 460, overflow: "hidden" }}>
        {coverImage
          ? <img src={coverImage} alt={pkg.destination} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${ORANGE}cc, ${ORANGE}55)` }} />
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 20%, rgba(0,0,0,0.75) 100%)" }} />
        <div style={{ position: "absolute", bottom: 20, left: 18, right: 18 }}>
          <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,0.7)", letterSpacing: "2px", textTransform: "uppercase" as const, marginBottom: 6 }}>
            {pkg.destination}
          </div>
          <h1 style={{ fontFamily: INTER, fontSize: 34, fontWeight: 800, color: "#fff", lineHeight: 1.05, letterSpacing: "-1px", margin: 0 }}>{title}</h1>
        </div>
      </div>

      {/* Stats band */}
      <TrekStatsBand pkg={pkg} lang={lang} />

      {/* Difficulty + fitness */}
      {pkg.difficulty && (
        <div style={{ padding: "16px 18px 0" }}>
          <DifficultyBar difficulty={pkg.difficulty} lang={lang} />
          {pkg.fitnessNote && (
            <div style={{ fontSize: 12, color: MUTED, marginTop: 6 }}>{pkg.fitnessNote}</div>
          )}
        </div>
      )}

      {/* Price + CTA */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <div>
            <div style={{ fontFamily: INTER, fontSize: 32, fontWeight: 800, color: ORANGE, letterSpacing: "-0.8px", lineHeight: 1 }}>{pkg.price}</div>
            <div style={{ fontSize: 11, color: SMUTED, marginTop: 3, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{t.perPerson}</div>
          </div>
          <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />
        </div>
        {pkg.description && (
          <p style={{ fontSize: 14, color: MUTED, lineHeight: 1.65, marginTop: 14, marginBottom: 0 }}>{pkg.description}</p>
        )}
      </div>

      {/* Mobile trust strip — horizontal scroll */}
      <div style={{
        display: "flex", gap: 0, marginTop: 16,
        borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`,
        overflowX: "auto", scrollbarWidth: "none",
      }}>
        {trustItems.map((item, i) => (
          <div key={i} style={{
            flexShrink: 0, padding: "10px 14px", fontSize: 12, color: INK,
            fontWeight: 600, whiteSpace: "nowrap" as const,
            borderRight: i < trustItems.length - 1 ? `1px solid ${BORDER}` : undefined,
          }}>
            {item.title}
          </div>
        ))}
      </div>

      {/* Includes */}
      {includes.length > 0 && (
        <div id="included" style={{ padding: "22px 18px 0", scrollMarginTop: 88 }}>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 12 }}>{t.includedLabel}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {includes.slice(0, 6).map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "10px 12px" }}>
                <span style={{ color: ORANGE, fontSize: 11, fontWeight: 800, marginTop: 1, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.4 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day-by-day itinerary */}
      {itinerary.length > 0 && (
        <section id="itinerary" style={{ padding: "22px 18px 0", scrollMarginTop: 88 }}>
          <Eyebrow text={t.dayByDay} brand={ORANGE} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 16 }}>
            {itinerary.map((it, i) => (
              <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                <div style={{ width: 38, height: 38, borderRadius: 9, background: `${ORANGE}12`, border: `1px solid ${ORANGE}30`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: INTER, fontSize: 13, fontWeight: 800, color: ORANGE }}>
                  {it.day}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: INTER, fontSize: 13.5, fontWeight: 700, color: INK, lineHeight: 1.3, marginBottom: (it.desc || it.km || it.alt) ? 4 : 0 }}>
                    {it.title}
                  </div>
                  {(it.km || it.alt) && (
                    <div style={{ fontSize: 11, color: ORANGE, fontWeight: 700, marginBottom: it.desc ? 4 : 0 }}>
                      {it.km ? `${it.km}${t.kmUnit}` : ""}
                      {it.km && it.alt ? " · " : ""}
                      {it.alt ? `${it.alt}${t.metersUnit}` : ""}
                    </div>
                  )}
                  {it.desc && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>{it.desc}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <CmHotelsSection pkg={pkg} isDesktop={false} />
      <CmMediaSection pkg={pkg} isDesktop={false} />
      <CmHighlightsSection pkg={pkg} isDesktop={false} />
      <CmInclusionsSection pkg={pkg} isDesktop={false} />
      <CmPricingSection pkg={pkg} isDesktop={false} onWhatsApp={onWhatsApp} lang={lang} />
      <CmTransfersSection pkg={pkg} isDesktop={false} />
      <CmExtrasSection pkg={pkg} isDesktop={false} />
      <CmCustomSection pkg={pkg} isDesktop={false} />
      <CmPeopleSection pkg={pkg} isDesktop={false} />
      <CmDeparturesSection pkg={pkg} isDesktop={false} />
      <CmFaqSection pkg={pkg} isDesktop={false} />
      <CmImportantNotesSection pkg={pkg} isDesktop={false} />
      <CmReviewsSection pkg={pkg} agency={agency} isDesktop={false} lang={lang} />
      <CmAboutAgencySection pkg={pkg} agency={agency} isDesktop={false} />
      <CompassGuidePanel pkg={pkg} agency={agency} lang={lang} onWhatsApp={onWhatsApp} />
      <CmCTABanner pkg={pkg} agency={agency} isDesktop={false} onWhatsApp={onWhatsApp} onMessenger={onMessenger} lang={lang} />
      <CmMobileFooter agency={agency} />
      <StickyCTA price={altitudeLabel} nights={nights} label={t.bookWhatsApp} onWhatsApp={onWhatsApp} lang={lang} />
    </div>
  );
}

// ─── TemplateCompassCard ──────────────────────────────────────────────────────

export function TemplateCompassCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
