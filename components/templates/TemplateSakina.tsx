"use client";

import React from "react";
import { T, localizeTierLabel } from "@/lib/translations";
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
  LightboxCarousel,
  localizeRole,
} from "./shared";
import type { TPageProps, TCardProps } from "./types";

const SAGE   = "#1a5d4a";
const GOLD   = "#b09142";
const BONE   = "#f7f4ed";
const INK    = "#0d1b2e";
const MUTED  = "rgba(13,27,46,0.55)";
const SMUTED = "rgba(13,27,46,0.35)";
const BORDER = "rgba(13,27,46,0.08)";
const SERIF  = "var(--font-cormorant, serif)";

// ─── Section data helpers ─────────────────────────────────────────────────────

type SkSecData = Record<string, unknown>;

function skFindSec(pkg: TPageProps["pkg"], type: string): SkSecData | undefined {
  return pkg.sections?.find((s) => s.type === type)?.data as SkSecData | undefined;
}
function skSecArr(data: SkSecData | undefined, key: string): SkSecData[] {
  if (!data) return [];
  const v = data[key];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is SkSecData => x != null && typeof x === "object");
}
function skSecStr(data: SkSecData | undefined, key: string): string {
  if (!data) return "";
  const v = data[key];
  return typeof v === "string" ? v : "";
}
function skSecNum(data: SkSecData | undefined, key: string): number | undefined {
  if (!data) return undefined;
  const v = data[key];
  return typeof v === "number" ? v : undefined;
}
function skItemStr(item: SkSecData | string, ...keys: string[]): string {
  if (typeof item === "string") return item;
  for (const k of keys) {
    const v = (item as SkSecData)[k];
    if (typeof v === "string" && v) return v;
  }
  return "";
}

// ─── Sakina section components ────────────────────────────────────────────────

function SkFaqSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = skFindSec(pkg, "faq");
  const items = skSecArr(data, "items");
  if (!items.length) return null;
  const pad = isDesktop ? "64px 80px" : "28px 24px";
  return (
    <section id="sk-faq" style={{ padding: pad, background: BONE, scrollMarginTop: 88 }} data-pmx-section="faq">
      <div style={{ maxWidth: isDesktop ? 1080 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 6 }}>{t.skCommonQuestions}</div>
        <div style={{ width: 32, height: 1, background: GOLD, marginBottom: 20 }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
          {items.map((f, i) => {
            const q = skItemStr(f, "q", "question");
            const a = skItemStr(f, "a", "answer");
            return (
              <div key={i} style={{ borderBottom: `1px solid ${BORDER}`, padding: "18px 0" }}>
                <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 19 : 17, fontStyle: "italic", color: INK, lineHeight: 1.3, marginBottom: 8 }}>{q}</div>
                <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.7, paddingLeft: 16, borderLeft: `2px solid ${GOLD}` }}>{a}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SkImportantNotesSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = skFindSec(pkg, "important_notes");
  const notes = skSecArr(data, "notes");
  const items = notes.length ? notes : skSecArr(data, "items");
  if (!items.length) return null;
  const pad = isDesktop ? "64px 80px" : "28px 24px";
  return (
    <section style={{ padding: pad, background: "#fff" }} data-pmx-section="important_notes">
      <div style={{ maxWidth: isDesktop ? 1080 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 6 }}>
          {t.skImportantNotes}
        </div>
        <div style={{ width: 32, height: 1, background: GOLD, marginBottom: 20 }} />
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2, 1fr)" : "1fr", gap: 12 }}>
          {items.map((n, i) => {
            const severity = skItemStr(n, "severity");
            const title = skItemStr(n, "title", "text");
            const body = skItemStr(n, "body");
            const isWarn = severity === "warn";
            return (
              <div key={i} style={{
                background: BONE,
                borderLeft: `3px solid ${isWarn ? GOLD : `rgba(13,27,46,0.15)`}`,
                borderRadius: "0 8px 8px 0",
                padding: "16px 18px",
              }}>
                {isWarn && (
                  <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: GOLD, marginBottom: 6 }}>{t.skRequired}</div>
                )}
                <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 18 : 16, fontStyle: isWarn ? "normal" : "italic", fontWeight: 600, color: INK, lineHeight: 1.3, marginBottom: body ? 6 : 0 }}>{title}</div>
                {body && <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.65 }}>{body}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function SkAboutAgencySection({ pkg, agency, isDesktop, lang }: { pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = skFindSec(pkg, "about_agency");
  if (!data && !agency.tagline) return null;
  const story = skItemStr(data || {}, "story", "content");
  const foundedRaw = (data as SkSecData | undefined)?.founded;
  const founded = typeof foundedRaw === "number" ? foundedRaw : undefined;
  const teamSize = skSecStr(data, "teamSize");
  const teamPhoto = skSecStr(data, "teamPhoto") || skSecStr(data, "image");
  const currentYear = new Date().getFullYear();
  const pad = isDesktop ? "64px 80px" : "28px 24px";
  return (
    <section style={{ padding: pad, background: SAGE }} data-pmx-section="about_agency">
      <div style={{ maxWidth: isDesktop ? 1080 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        {isDesktop && teamPhoto ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>{t.skAboutAgencyLabel} {agency.name}</div>
              {story && <p style={{ fontFamily: SERIF, fontSize: 17, color: "rgba(255,255,255,0.88)", lineHeight: 1.75, margin: "0 0 24px" }}>{story}</p>}
              {(founded || teamSize) && (
                <div style={{ display: "flex", gap: 32, borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 20 }}>
                  {founded && (
                    <div>
                      <div style={{ fontFamily: SERIF, fontSize: 36, color: GOLD, lineHeight: 1 }}>{currentYear - founded}+</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 4, letterSpacing: "1px", textTransform: "uppercase" as const }}>{t.skYearsServingPilgrims}</div>
                    </div>
                  )}
                  {teamSize && (
                    <div>
                      <div style={{ fontFamily: SERIF, fontSize: 36, color: GOLD, lineHeight: 1 }}>{teamSize}</div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 4, letterSpacing: "1px", textTransform: "uppercase" as const }}>{t.skTeamMembers}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
            <div style={{ height: 380, borderRadius: 12, overflow: "hidden" }}>
              <img src={teamPhoto} alt={`${agency.name} team`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.5)", marginBottom: 12 }}>{t.skAboutAgencyLabel} {agency.name}</div>
            {teamPhoto && (
              <div style={{ height: 200, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
                <img src={teamPhoto} alt={`${agency.name} team`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>
            )}
            {story && <p style={{ fontFamily: SERIF, fontSize: 16, fontStyle: "italic", color: "rgba(255,255,255,0.85)", lineHeight: 1.75, margin: "0 0 20px" }}>{story}</p>}
            {(founded || teamSize) && (
              <div style={{ display: "flex", gap: 0, borderTop: "1px solid rgba(255,255,255,0.15)", paddingTop: 16 }}>
                {founded && (
                  <div style={{ flex: 1, textAlign: "center" as const, borderRight: "1px solid rgba(255,255,255,0.15)", padding: "8px 0" }}>
                    <div style={{ fontFamily: SERIF, fontSize: 28, color: GOLD, lineHeight: 1 }}>{currentYear - founded}+</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 3, textTransform: "uppercase" as const, letterSpacing: "1px" }}>{t.auYearsLabel}</div>
                  </div>
                )}
                {teamSize && (
                  <div style={{ flex: 1, textAlign: "center" as const, padding: "8px 0" }}>
                    <div style={{ fontFamily: SERIF, fontSize: 28, color: GOLD, lineHeight: 1 }}>{teamSize}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.5)", marginTop: 3, textTransform: "uppercase" as const, letterSpacing: "1px" }}>{t.skTeam}</div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

// ─── Other Packages ──────────────────────────────────────────────────────────

function SkOtherPackagesSection({ pkg, isDesktop, lang, agencySlug }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"]; agencySlug?: string }) {
  const t = T[lang];
  const data = skFindSec(pkg, "other_packages");
  const cards = skSecArr(data, "packages");
  if (!cards.length) return null;
  const heading = skSecStr(data, "heading") || t.otherPackagesHeading;
  const pad = isDesktop ? "0 72px 64px" : "32px 18px 0";
  const isRtl = lang === "ar";
  return (
    <section style={{ padding: pad, background: BONE }} dir={isRtl ? "rtl" : "ltr"} data-pmx-section="other_packages">
      <div style={{ maxWidth: isDesktop ? 1140 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 6 }}>{heading}</div>
          <div style={{ width: 32, height: 1, background: GOLD }} />
        </div>
        <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8, scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
          {cards.map((card, i) => {
            const img = skSecStr(card, "image");
            const title = skSecStr(card, "title");
            const dest = skSecStr(card, "destination");
            const price = skSecStr(card, "price");
            const nights = skSecStr(card, "nights");
            const link = skSecStr(card, "link");
            return (
              <a key={i} href={link || undefined} style={{
                flex: "0 0 190px", minWidth: 190, borderRadius: 8, overflow: "hidden",
                textDecoration: "none", border: `1px solid ${BORDER}`,
                background: "#fff", scrollSnapAlign: "start",
                display: "flex", flexDirection: "column",
              }}>
                <div style={{ width: "100%", height: 120, background: BORDER, flexShrink: 0 }}>
                  {img && <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                </div>
                <div style={{ padding: "10px 12px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                  {dest && <div style={{ fontFamily: SERIF, fontSize: 10, color: GOLD, letterSpacing: "1px", textTransform: "uppercase" as const }}>{dest}</div>}
                  <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: INK, lineHeight: 1.3 }}>{title}</div>
                  {(nights || price) && (
                    <div style={{ marginTop: "auto", paddingTop: 6, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                      {nights && <span style={{ fontFamily: SERIF, fontSize: 11, color: MUTED }}>{nights}</span>}
                      {price && <span style={{ fontFamily: SERIF, fontSize: 13, fontWeight: 700, color: GOLD }}>{price}</span>}
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
        {agencySlug && (
          <div style={{ marginTop: 14, textAlign: isRtl ? "left" : "right" }}>
            <a href={`/${agencySlug}/packages`} style={{ fontFamily: SERIF, fontSize: 12, fontWeight: 600, color: GOLD, textDecoration: "none", letterSpacing: "0.3px" }}>
              {t.navAllPackages} →
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Shared section head ─────────────────────────────────────────────────────

function SkSecHead({ label, isDesktop }: { label: string; isDesktop: boolean }) {
  return (
    <div style={{ marginBottom: isDesktop ? 28 : 20 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "2px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 6 }}>{label}</div>
      <div style={{ width: 32, height: 1, background: GOLD }} />
    </div>
  );
}

// ─── Highlights ───────────────────────────────────────────────────────────────

function SkHighlightsSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = skFindSec(pkg, "highlights");
  const items = skSecArr(data, "items").map(i => skItemStr(i, "text")).filter(Boolean);
  if (!items.length) return null;
  const pad = isDesktop ? "64px 80px" : "28px 24px";
  return (
    <section id="sk-highlights" style={{ padding: pad, background: BONE }} data-pmx-section="highlights">
      <div style={{ maxWidth: isDesktop ? 1080 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <SkSecHead label={t.skHighlights} isDesktop={isDesktop} />
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 10 }}>
          {items.map((item, i) => (
            <div key={i} style={{ background: `${SAGE}10`, border: `1px solid ${SAGE}30`, borderRadius: 100, padding: "8px 16px", fontSize: 13, fontWeight: 600, color: SAGE }}>{item}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Itinerary ────────────────────────────────────────────────────────────────

function SkItinerarySection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = skFindSec(pkg, "itinerary");
  const days = skSecArr(data, "days").length ? skSecArr(data, "days") : (pkg.itinerary ?? []).map(d => ({ day: d.day, title: d.title, desc: d.desc, chapter: d.chapter }));
  if (!days.length) return null;
  const pad = isDesktop ? "64px 80px" : "28px 24px";
  return (
    <section id="itinerary" style={{ padding: pad, background: "#fff", scrollMarginTop: 88 }} data-pmx-section="itinerary">
      <div style={{ maxWidth: isDesktop ? 1080 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <SkSecHead label={`${t.skDayByDay} · ${days.length} ${t.skDays}`} isDesktop={isDesktop} />
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 0 }}>
          {days.map((d, i) => {
            const day   = typeof d.day === "number" ? d.day : Number(d.day) || (i + 1);
            const title = skItemStr(d, "title");
            const desc  = skItemStr(d, "desc", "description");
            const chap  = skItemStr(d, "chapter");
            return (
              <div key={i} style={{ display: "grid", gridTemplateColumns: isDesktop ? "80px 1fr" : "60px 1fr", gap: 20, alignItems: "start", borderBottom: i < days.length - 1 ? `1px solid ${BORDER}` : "none", padding: "22px 0" }}>
                <div style={{ background: `${SAGE}10`, border: `1px solid ${SAGE}25`, borderRadius: 12, padding: "12px 8px", textAlign: "center" as const }}>
                  <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 24 : 20, fontWeight: 400, color: SAGE, lineHeight: 1 }}>{day}</div>
                  {chap && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" as const, color: MUTED, marginTop: 4 }}>{chap}</div>}
                </div>
                <div style={{ paddingTop: 4 }}>
                  <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 20 : 17, fontWeight: 600, color: INK, lineHeight: 1.25, marginBottom: 8 }}>{title}</div>
                  {desc && <div style={{ fontSize: isDesktop ? 14 : 13, color: MUTED, lineHeight: 1.7 }}>{desc}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Hotel ────────────────────────────────────────────────────────────────────

function SkHotelSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = skFindSec(pkg, "hotel");
  const desc = skSecStr(data, "description") || pkg.hotelDescription || "";
  const image = skSecStr(data, "image");
  if (!desc) return null;
  const pad = isDesktop ? "64px 80px" : "28px 24px";
  return (
    <section id="sk-hotel" style={{ padding: pad, background: BONE }} data-pmx-section="hotel">
      <div style={{ maxWidth: isDesktop ? 1080 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <SkSecHead label={t.skAccommodation} isDesktop={isDesktop} />
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden" }}>
          {image && <img src={image} alt="Hotel" style={{ width: "100%", height: isDesktop ? 260 : 180, objectFit: "cover", display: "block" }} />}
          <div style={{ padding: isDesktop ? "24px 28px" : "18px 18px" }}>
            <p style={{ fontFamily: SERIF, fontSize: isDesktop ? 17 : 15, fontStyle: "italic", color: INK, lineHeight: 1.75, margin: 0 }}>{desc}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Inclusions ───────────────────────────────────────────────────────────────

function SkInclusionsSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = skFindSec(pkg, "inclusions");
  const includes = (data?.includes as string[] | undefined) ?? pkg.includes ?? [];
  const excludes = (data?.excludes as string[] | undefined) ?? pkg.excludes ?? [];
  const advantages = (data?.advantages as string[] | undefined) ?? pkg.advantages ?? [];
  if (!includes.length && !excludes.length && !advantages.length) return null;
  const pad = isDesktop ? "64px 80px" : "28px 24px";
  const cols = isDesktop ? "repeat(3,1fr)" : "1fr";
  return (
    <section id="included" style={{ padding: pad, background: "#fff", scrollMarginTop: 88 }} data-pmx-section="inclusions">
      <div style={{ maxWidth: isDesktop ? 1080 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <SkSecHead label={t.skIncludedInPackage} isDesktop={isDesktop} />
        {includes.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: cols, gap: 8, marginBottom: excludes.length ? 20 : 0 }}>
            {includes.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 0", borderBottom: `1px solid ${BORDER}` }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 2 }}><polyline points="20 6 9 17 4 12"/></svg>
                <span style={{ fontSize: 13.5, lineHeight: 1.5, color: INK }}>{item}</span>
              </div>
            ))}
          </div>
        )}
        {advantages.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: cols, gap: 8, marginBottom: excludes.length ? 20 : 0 }}>
            {advantages.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", padding: "12px 0", borderBottom: `1px solid ${BORDER}` }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 2 }}><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                <span style={{ fontSize: 13.5, lineHeight: 1.5, color: INK }}>{item}</span>
              </div>
            ))}
          </div>
        )}
        {excludes.length > 0 && (
          <div style={{ marginTop: includes.length ? 16 : 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 10 }}>{t.skNotIncluded}</div>
            {excludes.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: MUTED, marginBottom: 8 }}>
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

// ─── Media ────────────────────────────────────────────────────────────────────

function skToEmbed(url: string): string {
  const yt = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?rel=0&modestbranding=1`;
  const vi = url.match(/vimeo\.com\/(\d+)/);
  if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
  return url;
}

function SkMediaSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = skFindSec(pkg, "media");
  const images    = (data?.images as string[] | undefined) ?? pkg.images ?? [];
  const videoUrl  = (data?.videoUrl as string | undefined ?? pkg.videoUrl ?? "").trim();
  const mapImage  = (data?.mapImage as string | undefined) ?? "";
  const mapCaption = (data?.mapCaption as string | undefined) ?? "";
  const [lbIdx, setLbIdx] = React.useState<number | null>(null);
  if (!images.length && !videoUrl && !mapImage) return null;
  const pad = isDesktop ? "64px 80px" : "28px 24px";
  const isEmbed = videoUrl && (videoUrl.includes("youtube") || videoUrl.includes("youtu.be") || videoUrl.includes("vimeo"));
  return (
    <section id="sk-media" style={{ padding: pad, background: BONE }} data-pmx-section="media">
      <div style={{ maxWidth: isDesktop ? 1080 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        {images.length > 0 && (
          <>
            <SkSecHead label={t.skGallery} isDesktop={isDesktop} />
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3,1fr)" : "1.5fr 1fr", gridTemplateRows: isDesktop ? undefined : "130px 130px", gap: 6, marginBottom: (videoUrl || mapImage) ? 32 : 0 }}>
              {(isDesktop ? images : images.slice(0, 3)).map((src, i) => (
                <div key={i} onClick={() => setLbIdx(i)} style={{ borderRadius: 12, overflow: "hidden", aspectRatio: isDesktop ? "4/3" : undefined, gridRow: !isDesktop && i === 0 ? "span 2" : undefined, cursor: "pointer" }}>
                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }} />
                </div>
              ))}
            </div>
          </>
        )}
        {videoUrl && (
          <div style={{ borderRadius: 14, overflow: "hidden", aspectRatio: "16/9", border: `1px solid ${BORDER}`, marginBottom: mapImage ? 20 : 0 }}>
            {isEmbed ? (
              <iframe src={skToEmbed(videoUrl)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
            ) : (
              <video src={videoUrl.includes("#") ? videoUrl : videoUrl + "#t=0.1"} controls playsInline preload="metadata" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
            )}
          </div>
        )}
        {mapImage && (
          <div style={{ borderRadius: 14, overflow: "hidden", border: `1px solid ${BORDER}` }}>
            <img src={mapImage} alt={mapCaption} style={{ width: "100%", maxHeight: isDesktop ? 380 : 220, objectFit: "cover", display: "block" }} />
            {mapCaption && <div style={{ padding: "10px 14px", background: "#fff", fontSize: 12.5, color: MUTED }}>{mapCaption}</div>}
          </div>
        )}
      </div>
      {lbIdx !== null && <LightboxCarousel images={images} startIndex={lbIdx} onClose={() => setLbIdx(null)} />}
    </section>
  );
}

// ─── Transfers ────────────────────────────────────────────────────────────────

function SkTransfersSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = skFindSec(pkg, "transfers");
  const items = skSecArr(data, "items");
  if (!items.length) return null;
  const pad = isDesktop ? "64px 80px" : "28px 24px";
  return (
    <section id="sk-transfers" style={{ padding: pad, background: "#fff" }} data-pmx-section="transfers">
      <div style={{ maxWidth: isDesktop ? 1080 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <SkSecHead label={t.skTransfers} isDesktop={isDesktop} />
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
          {items.map((item, i) => {
            const from = skItemStr(item, "from");
            const to   = skItemStr(item, "to");
            const type = skItemStr(item, "type", "transportType");
            const note = skItemStr(item, "note", "details");
            return (
              <div key={i} style={{ background: BONE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 18px", display: "grid", gridTemplateColumns: "1fr auto", alignItems: "center", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  {(from || to) && <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 16 : 14, fontWeight: 600, color: INK, marginBottom: 4, overflowWrap: "break-word" }}>{from}{from && to ? " → " : ""}{to}</div>}
                  {type && <div style={{ fontSize: 12, color: SAGE, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.6px", marginBottom: note ? 4 : 0 }}>{type}</div>}
                  {note && <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.5, overflowWrap: "break-word" }}>{note}</div>}
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={SAGE} strokeWidth="2"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h5l3 3v5h-8V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

function SkPricingSection({ pkg, isDesktop, onWhatsApp, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; onWhatsApp: () => void; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = skFindSec(pkg, "pricing");
  const tiers = skSecArr(data, "tiers").length ? skSecArr(data, "tiers") : (pkg.pricingTiers ?? []).map(t2 => ({ label: t2.label, price: t2.price, was: t2.was, perks: t2.perks, pop: t2.pop }));
  if (!tiers.length) return null;
  const pad = isDesktop ? "64px 80px" : "28px 24px";
  return (
    <section id="pricing" style={{ padding: pad, background: BONE, scrollMarginTop: 88 }} data-pmx-section="pricing">
      <div style={{ maxWidth: isDesktop ? 1080 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <SkSecHead label={t.skPricing} isDesktop={isDesktop} />
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? `repeat(${Math.min(tiers.length, 3)},1fr)` : "1fr", gap: 14 }}>
          {tiers.map((tier, i) => {
            const pop   = !!tier.pop;
            const label = localizeTierLabel(skItemStr(tier, "label"), lang);
            const price = skItemStr(tier, "price");
            const was   = skItemStr(tier, "was");
            const perks = (tier.perks as string[] | undefined) ?? [];
            return (
              <div key={i} style={{ background: pop ? SAGE : "#fff", color: pop ? "#fff" : INK, border: `1.5px solid ${pop ? SAGE : BORDER}`, borderRadius: 18, padding: "22px 22px", display: "flex", flexDirection: "column" as const, gap: 6 }}>
                {pop && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.65)", marginBottom: 4 }}>{t.skMostPopular}</div>}
                <div style={{ fontSize: 13.5, fontWeight: 700, color: pop ? "rgba(255,255,255,0.8)" : MUTED, letterSpacing: "-0.1px" }}>{label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                  <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 36 : 32, fontWeight: 400, color: pop ? "#fff" : SAGE, lineHeight: 1 }}>{price}</div>
                  {was && <div style={{ fontSize: 13, textDecoration: "line-through", color: pop ? "rgba(255,255,255,0.45)" : MUTED }}>{was}</div>}
                </div>
                <div style={{ fontSize: 11.5, color: pop ? "rgba(255,255,255,0.6)" : MUTED, marginBottom: 4 }}>{t.perPerson}</div>
                {perks.length > 0 && (
                  <ul style={{ listStyle: "none", padding: 0, margin: "8px 0 0", display: "flex", flexDirection: "column" as const, gap: 8 }}>
                    {perks.map((p, j) => (
                      <li key={j} style={{ display: "flex", gap: 8, fontSize: 13, color: pop ? "rgba(255,255,255,0.85)" : MUTED }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={pop ? "rgba(255,255,255,0.7)" : SAGE} strokeWidth="2.5" style={{ flexShrink: 0, marginTop: 1 }}><polyline points="20 6 9 17 4 12"/></svg>
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
                {pkg.whatsapp && <button onClick={onWhatsApp} style={{ marginTop: 16, background: pop ? "rgba(255,255,255,0.18)" : `${SAGE}15`, border: `1px solid ${pop ? "rgba(255,255,255,0.25)" : `${SAGE}30`}`, borderRadius: 100, padding: "11px 0", fontSize: 13, fontWeight: 700, color: pop ? "#fff" : SAGE, fontFamily: "inherit", cursor: "pointer", width: "100%" }}>
                  {t.whatsAppTheOffice}
                </button>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Departures ───────────────────────────────────────────────────────────────

function SkDeparturesSection({ pkg, isDesktop, onWhatsApp, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; onWhatsApp: () => void; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = skFindSec(pkg, "departures") ?? skFindSec(pkg, "departure_dates");
  const entries = skSecArr(data, "entries").length ? skSecArr(data, "entries") : skSecArr(data, "dates");
  const legacyDeps = pkg.departures ?? [];
  if (!entries.length && !legacyDeps.length) return null;
  const pad = isDesktop ? "64px 80px" : "28px 24px";
  return (
    <section id="sk-departures" style={{ padding: pad, background: "#fff" }} data-pmx-section="departures">
      <div style={{ maxWidth: isDesktop ? 1080 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <SkSecHead label={t.skDepartureDates} isDesktop={isDesktop} />
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
          {(entries.length ? entries.map(e => ({ date: skItemStr(e, "date"), returnDate: skItemStr(e, "returnDate"), spots: skItemStr(e, "spots"), price: skItemStr(e, "price") })) : legacyDeps.map(d => ({ date: d.date, returnDate: "", spots: String(d.spots ?? ""), price: d.price ?? "" }))).map((dep, i) => {
            const inner = (
              <>
                <div>
                  <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 17 : 15, fontWeight: 600, color: INK }}>{dep.date}</div>
                  {dep.returnDate && <div style={{ fontSize: 12, color: MUTED, marginTop: 2 }}>{t.skReturns}: {dep.returnDate}</div>}
                  {dep.spots && <div style={{ fontSize: 12, color: SAGE, marginTop: 2, fontWeight: 600 }}>{dep.spots} {t.skSpotsAvailable}</div>}
                </div>
                {dep.price && <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 22 : 18, color: SAGE, fontWeight: 400 }}>{dep.price}</div>}
              </>
            );
            return pkg.whatsapp
              ? <button key={i} onClick={onWhatsApp} style={{ background: BONE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: "left" as const, fontFamily: "inherit", width: "100%" }}>{inner}</button>
              : <div key={i} style={{ background: BONE, border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%" }}>{inner}</div>;
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Extras ───────────────────────────────────────────────────────────────────

function SkExtrasSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = skFindSec(pkg, "extras");
  const items = skSecArr(data, "items");
  if (!items.length) return null;
  const pad = isDesktop ? "64px 80px" : "28px 24px";
  return (
    <section id="sk-extras" style={{ padding: pad, background: BONE }} data-pmx-section="extras">
      <div style={{ maxWidth: isDesktop ? 1080 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <SkSecHead label={t.skOptionalExtras} isDesktop={isDesktop} />
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2,1fr)" : "1fr", gap: 10 }}>
          {items.map((item, i) => {
            const name  = skItemStr(item, "name", "title");
            const price = skItemStr(item, "price");
            const desc  = skItemStr(item, "description", "desc");
            return (
              <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "16px 18px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: INK, marginBottom: desc ? 4 : 0 }}>{name}</div>
                  {desc && <div style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.55 }}>{desc}</div>}
                </div>
                {price && <div style={{ fontFamily: SERIF, fontSize: 16, color: SAGE, fontWeight: 400, flexShrink: 0 }}>{price}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Custom section ───────────────────────────────────────────────────────────

function SkCustomSection({ pkg, isDesktop }: { pkg: TPageProps["pkg"]; isDesktop: boolean }) {
  const data = skFindSec(pkg, "custom");
  const heading = skSecStr(data, "heading");
  const content = skSecStr(data, "content");
  const image   = skSecStr(data, "image");
  if (!heading && !content) return null;
  const pad = isDesktop ? "64px 80px" : "28px 24px";
  return (
    <section id="sk-custom" style={{ padding: pad, background: "#fff" }} data-pmx-section="custom">
      <div style={{ maxWidth: isDesktop ? 1080 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        {heading && <SkSecHead label={heading} isDesktop={isDesktop} />}
        {image && <img src={image} alt={heading} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 14, marginBottom: 18, display: "block" }} />}
        {content && <p style={{ fontFamily: SERIF, fontSize: isDesktop ? 17 : 15, fontStyle: "italic", color: MUTED, lineHeight: 1.75, margin: 0 }}>{content}</p>}
      </div>
    </section>
  );
}

// ─── People ───────────────────────────────────────────────────────────────────

function SkPeopleSection({ pkg, isDesktop, onWhatsApp, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; onWhatsApp: () => void; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = skFindSec(pkg, "people");
  const people = skSecArr(data, "people");
  if (!people.length) return null;
  const pad = isDesktop ? "64px 80px" : "28px 24px";
  return (
    <section id="sk-people" style={{ padding: pad, background: `${SAGE}0a` }} data-pmx-section="people">
      <div style={{ maxWidth: isDesktop ? 1080 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <SkSecHead label={t.mutawifLabel} isDesktop={isDesktop} />
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 16 }}>
          {people.map((person, i) => {
            const name   = skItemStr(person, "name");
            const role   = skItemStr(person, "role");
            const bio    = skItemStr(person, "bio");
            const photo  = skItemStr(person, "photo");
            const langs  = (person.languages as string[] | undefined) ?? [];
            const years  = person.years as number | undefined;
            return (
              <div key={i} style={{ background: "#fff", border: `1px solid ${SAGE}20`, borderRadius: 16, padding: isDesktop ? "24px 28px" : "18px 18px", display: "flex", gap: 18, alignItems: "flex-start" }}>
                {photo
                  ? <img src={photo} alt={name} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${SAGE}20` }} />
                  : <div style={{ width: 72, height: 72, borderRadius: "50%", background: `${SAGE}12`, border: `1px solid ${SAGE}30`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SERIF, fontSize: 28, color: SAGE, flexShrink: 0 }}>{name?.[0] ?? "م"}</div>
                }
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: SAGE, marginBottom: 4 }}>{role || t.mutawifLabel}</div>
                  <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 22 : 18, fontWeight: 600, color: INK, lineHeight: 1.1, marginBottom: 6 }}>{name}</div>
                  {years && <div style={{ fontSize: 12.5, color: MUTED, marginBottom: bio ? 8 : 0 }}>{years} {t.yearsExpSuffix}</div>}
                  {bio && <p style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.65, margin: "0 0 12px" }}>{bio}</p>}
                  {langs.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
                      {langs.map((l, j) => (
                        <div key={j} style={{ background: `${SAGE}0c`, border: `1px solid ${SAGE}20`, borderRadius: 100, padding: "3px 10px", fontSize: 11, fontWeight: 600, color: SAGE }}>{l}</div>
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

// ─── Reviews ──────────────────────────────────────────────────────────────────

function SkReviewsSection({ pkg, agency, isDesktop, lang }: { pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
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

  const pad = isDesktop ? "64px 80px" : "28px 24px";
  return (
    <section id="sk-reviews" style={{ padding: pad, background: "#fff" }} data-pmx-section="reviews">
      <div style={{ maxWidth: isDesktop ? 1080 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <SkSecHead label={showList ? `${reviews.length} ${t.skVerifiedReviews}` : t.writeReviewTitle} isDesktop={isDesktop} />
        {showList && (
          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2,1fr)" : "1fr", gap: 16, marginBottom: canSubmit ? 32 : 0 }}>
            {reviews.map((r, i) => (
              <div key={i} style={{ background: BONE, border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: INK }}>{r.name}</div>
                    {r.country && <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{r.country}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 2 }}>{[1,2,3,4,5].map(n => <span key={n} style={{ color: n <= r.rating ? GOLD : "rgba(13,27,46,0.15)", fontSize: 14 }}>★</span>)}</div>
                </div>
                <p style={{ fontFamily: SERIF, fontSize: 14, fontStyle: "italic", color: MUTED, lineHeight: 1.7, margin: 0 }}>{r.text}</p>
              </div>
            ))}
          </div>
        )}
        {canSubmit && status !== "ok" && (
          <div style={{ background: BONE, border: `1px solid ${BORDER}`, borderRadius: 16, padding: isDesktop ? "28px 32px" : "20px 20px" }}>
            <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 20 : 17, fontWeight: 600, color: INK, marginBottom: 16 }}>{t.writeReviewTitle}</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", fontSize: 24, color: n <= (hover || rating) ? GOLD : "rgba(13,27,46,0.2)", lineHeight: 1 }}>★</button>
              ))}
            </div>
            <input placeholder={t.reviewYourName} value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px", fontSize: 14, fontFamily: "inherit", background: "#fff", color: INK, marginBottom: 10, boxSizing: "border-box" as const }} />
            <textarea placeholder={t.reviewPlaceholder} value={text} onChange={e => setText(e.target.value)} rows={3} style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 10, padding: "12px 14px", fontSize: 14, fontFamily: "inherit", background: "#fff", color: INK, marginBottom: 14, resize: "none" as const, boxSizing: "border-box" as const }} />
            <button onClick={handleSubmit} disabled={status === "sending"} style={{ background: SAGE, color: "#fff", border: "none", borderRadius: 100, padding: "13px 28px", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>{status === "sending" ? t.skSending : t.submitReviewBtn}</button>
            {status === "err" && <div style={{ fontSize: 13, color: "#c0392b", marginTop: 10 }}>{t.reviewSubmitError}</div>}
          </div>
        )}
        {status === "ok" && <div style={{ background: `${SAGE}12`, border: `1px solid ${SAGE}30`, borderRadius: 14, padding: "20px 24px", fontSize: 14, color: SAGE, fontWeight: 600 }}>{t.reviewSubmitSuccess}</div>}
      </div>
    </section>
  );
}

// ─── Trust strip (desktop) ────────────────────────────────────────────────────

function SkTrustStrip({ items, style }: { items: { icon: React.ReactNode; title: string; sub?: string }[]; style?: React.CSSProperties }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: `repeat(${items.length}, 1fr)`, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, ...style }}>
      {items.map((item, i) => (
        <div key={i} style={{ padding: "18px 20px", borderRight: i < items.length - 1 ? `1px solid ${BORDER}` : "none", display: "flex", gap: 10, alignItems: "flex-start" }}>
          <span style={{ color: SAGE, display: "flex", marginTop: 2 }}>{item.icon}</span>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: INK }}>{item.title}</div>
            {item.sub && <div style={{ fontSize: 11, color: MUTED, marginTop: 2 }}>{item.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── CTA banner ───────────────────────────────────────────────────────────────

function SkCTABanner({ pkg, agency, isDesktop, onWhatsApp, onMessenger, lang }: { pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; isDesktop: boolean; onWhatsApp: () => void; onMessenger: () => void; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const nights = pkg.nights ? Number(pkg.nights) : null;
  return (
    <section style={{ background: BONE, padding: isDesktop ? "48px 80px" : "24px 18px" }}>
      <div style={{ maxWidth: isDesktop ? 1080 : undefined, margin: isDesktop ? "0 auto" : undefined, background: `${SAGE}0a`, border: `1px solid ${SAGE}25`, borderRadius: 18, padding: isDesktop ? "36px 40px" : "24px 22px", display: "flex", flexDirection: isDesktop ? "row" as const : "column" as const, alignItems: isDesktop ? "center" : "flex-start", gap: 20, justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 28 : 22, fontWeight: 600, color: INK, marginBottom: 6 }}>{t.readyToExplore}</div>
          <div style={{ fontFamily: SERIF, fontSize: isDesktop ? 36 : 30, color: SAGE, lineHeight: 1, marginBottom: 4 }}>{pkg.price}</div>
          <div style={{ fontSize: 12, color: MUTED }}>{nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.perPerson}</div>
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const }}>
          {pkg.whatsapp && <WAButton label={t.whatsAppTheOffice} size="lg" onClick={onWhatsApp} />}
          {pkg.messenger && (
            <button data-testid="messenger-cta" onClick={onMessenger} style={{ background: "#0084ff", color: "#fff", border: "none", borderRadius: 100, padding: "14px 22px", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer" }}>{t.vyMessenger}</button>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Mobile footer ────────────────────────────────────────────────────────────

function SkMobileFooter({ agency, lang }: { agency: TPageProps["agency"]; lang: TPageProps["lang"] }) {
  return (
    <div style={{ padding: "28px 18px", background: BONE, borderTop: `1px solid ${BORDER}`, textAlign: "center" as const }}>
      {agency.logoUrl && <img src={agency.logoUrl} alt={agency.name} style={{ height: 32, objectFit: "contain", marginBottom: 10, display: "block", margin: "0 auto 10px" }} />}
      <div style={{ fontFamily: SERIF, fontSize: 15, fontWeight: 600, color: INK, marginBottom: 4 }}>{agency.name}</div>
      {agency.tagline && <div style={{ fontSize: 12, color: MUTED }}>{agency.tagline}</div>}
    </div>
  );
}

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

function MutawifBand({ pkg, lang, onWhatsApp }: { pkg: TPageProps["pkg"]; lang: TPageProps["lang"]; onWhatsApp: () => void }) {
  const t = T[lang];
  const agent = pkg.agent;
  if (!agent) return null;
  const isRtl = lang === "ar";
  return (
    <div style={{
      margin: "0 18px",
      background: `${SAGE}0c`, border: `1px solid ${SAGE}30`,
      borderRadius: 16, padding: "20px 20px",
      display: "flex", flexDirection: "column", gap: 14,
      direction: isRtl ? "rtl" : "ltr",
    }}>
      <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
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
            {localizeRole(agent.role, t)}{agent.years ? ` · ${agent.years} ${t.yearsExpSuffix}` : ""}
          </div>
        </div>
      </div>
      {pkg.whatsapp && <WAButton label={t.whatsAppTheOffice} size="sm" full onClick={onWhatsApp} />}
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
            {localizeRole(agent.role, t)}{agent.years ? ` · ${agent.years} ${t.yearsExpSuffix}` : ""}
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
      {pkg.whatsapp && <WAButton label={t.whatsAppTheOffice} size="lg" onClick={onWhatsApp} />}
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
            {localizeRole(agent.role, t)}{agent.years ? ` · ${agent.years} ${t.yearsExpSuffix}` : ""}
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
          {pkg.whatsapp && <WAButton label={t.whatsAppTheOffice} size="lg" onClick={onWhatsApp} />}
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
    ...(itinerary.length || pkg.sections?.some(s => s.type === "itinerary") ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...((pkg.includes?.length || (pkg.advantages || []).length || pkg.sections?.some(s => s.type === "inclusions")) ? [{ label: t.navIncluded, href: "#included" }] : []),
    ...((pkg.pricingTiers || []).some(t2 => t2.price) || pkg.sections?.some(s => s.type === "pricing") ? [{ label: t.navPricing, href: "#pricing" }] : []),
    ...(pkg.sections?.some(s => s.type === "hotel" || s.type === "hotels") || pkg.hotelDescription ? [{ label: t.navHotel, href: "#sk-hotel" }] : []),
    ...(pkg.sections?.some(s => s.type === "departures") || (pkg.departures ?? []).length ? [{ label: t.navDepartures, href: "#sk-departures" }] : []),
    ...(pkg.sections?.some(s => s.type === "reviews") || (pkg.reviews ?? []).length ? [{ label: t.navReviews, href: "#sk-reviews" }] : []),
    ...(pkg.sections?.some(s => s.type === "faq") ? [{ label: t.navFaq, href: "#sk-faq" }] : []),
  ];

  if (isDesktop) {
    return (
      <div dir={isRtl ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: BONE, color: INK, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={SAGE} navLinks={navLinks} lang={lang} onWhatsApp={pkg.whatsapp ? onWhatsApp : undefined} />

        {/* Hero: text LEFT, arch image RIGHT (design-correct) */}
        <DContainer data-pmx-section="hero" style={{ padding: "64px 80px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: 64, alignItems: "center" }}>
            {/* Text column — left */}
            <div style={{ order: isRtl ? 2 : 1 }}>
              <Eyebrow text={t.spiritualJourney} brand={SAGE} />
              <h1 data-pmx-field="title" style={{ fontFamily: SERIF, fontSize: 60, fontWeight: 600, lineHeight: 1.02, letterSpacing: "-0.8px", marginTop: 18, marginBottom: 20, color: INK }}>
                {title}
              </h1>
              <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.72, margin: "0 0 28px" }}>{pkg.description}</p>
              <div data-pmx-field="price" style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 400, color: SAGE, letterSpacing: "-0.8px", marginBottom: 6, lineHeight: 1 }}>{pkg.price}</div>
              <div style={{ fontSize: 12, color: SMUTED, marginBottom: 24 }}>{nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.perPerson}</div>
              {pkg.whatsapp && <WAButton label={t.whatsAppTheOffice} size="lg" onClick={onWhatsApp} />}
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
        <SkTrustStrip items={trustItems} style={{ padding: "0 80px" }} />

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
                <div style={{ fontSize: 13, color: MUTED }}>{localizeRole(pkg.agent.role, t)}{pkg.agent.years ? ` · ${pkg.agent.years} ${t.yearsExpSuffix}` : ""}</div>
              </div>
            )}
            {pkg.whatsapp && <WAButton label={t.whatsAppTheOffice} size="lg" onClick={onWhatsApp} />}
          </div>
        </DContainer>

        <SkHighlightsSection pkg={pkg} isDesktop={true} lang={lang} />
        <SkItinerarySection pkg={pkg} isDesktop={true} lang={lang} />
        <SkHotelSection pkg={pkg} isDesktop={true} lang={lang} />
        <SkInclusionsSection pkg={pkg} isDesktop={true} lang={lang} />
        <SkMediaSection pkg={pkg} isDesktop={true} lang={lang} />
        <SkTransfersSection pkg={pkg} isDesktop={true} lang={lang} />
        <SkPricingSection pkg={pkg} isDesktop={true} onWhatsApp={onWhatsApp} lang={lang} />
        <SkDeparturesSection pkg={pkg} isDesktop={true} onWhatsApp={onWhatsApp} lang={lang} />
        <SkExtrasSection pkg={pkg} isDesktop={true} lang={lang} />
        <SkCustomSection pkg={pkg} isDesktop={true} />
        <SkImportantNotesSection pkg={pkg} isDesktop={true} lang={lang} />
        <SkFaqSection pkg={pkg} isDesktop={true} lang={lang} />
        <SkReviewsSection pkg={pkg} agency={agency} isDesktop={true} lang={lang} />
        <SkPeopleSection pkg={pkg} isDesktop={true} onWhatsApp={onWhatsApp} lang={lang} />
        <SkAboutAgencySection pkg={pkg} agency={agency} isDesktop={true} lang={lang} />
        <SkOtherPackagesSection pkg={pkg} isDesktop={true} lang={lang} agencySlug={agency.agencySlug} />

        {/* Mutawif dark closing panel (legacy agent field) */}
        <MutawifClosingPanelDesktop pkg={pkg} agency={agency} lang={lang} onWhatsApp={onWhatsApp} />

        <SkCTABanner pkg={pkg} agency={agency} isDesktop={true} onWhatsApp={onWhatsApp} onMessenger={onMessenger} lang={lang} />
        <DesktopFooter agency={agency} brand={SAGE} />
      </div>
    );
  }

  // ── Mobile ──────────────────────────────────────────────────────────────────
  return (
    <div dir={isRtl ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: BONE, color: INK, fontFamily: "var(--font-dm-sans, sans-serif)", direction: isRtl ? "rtl" : "ltr" }}>
      <AgencyBar agency={agency} price={pkg.price} brand={SAGE} onWhatsApp={pkg.whatsapp ? onWhatsApp : undefined} lang={lang} navLinks={navLinks} />

      {/* Arched hero */}
      <div data-pmx-section="hero" style={{ padding: "0 18px" }}>
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
          <h1 data-pmx-field="title" style={{ fontFamily: SERIF, fontSize: 32, fontWeight: 600, color: INK, lineHeight: 1.12, letterSpacing: "-0.4px", margin: "0 0 10px" }}>
            {title}
          </h1>
          <div data-pmx-field="price" style={{ fontFamily: SERIF, fontSize: 38, fontWeight: 400, color: SAGE, lineHeight: 1, letterSpacing: "-0.8px", marginBottom: 5 }}>{pkg.price}</div>
          <div style={{ fontSize: 12, color: SMUTED, marginBottom: 18 }}>{nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.perPerson}</div>
          {pkg.whatsapp && <WAButton label={t.whatsAppTheOffice} full onClick={onWhatsApp} />}
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
        <MutawifBand pkg={pkg} lang={lang} onWhatsApp={onWhatsApp} />
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

      <SkHighlightsSection pkg={pkg} isDesktop={false} lang={lang} />
      <SkItinerarySection pkg={pkg} isDesktop={false} lang={lang} />
      <SkHotelSection pkg={pkg} isDesktop={false} lang={lang} />
      <SkInclusionsSection pkg={pkg} isDesktop={false} lang={lang} />
      <SkMediaSection pkg={pkg} isDesktop={false} lang={lang} />
      <SkTransfersSection pkg={pkg} isDesktop={false} lang={lang} />
      <SkPricingSection pkg={pkg} isDesktop={false} onWhatsApp={onWhatsApp} lang={lang} />
      <SkDeparturesSection pkg={pkg} isDesktop={false} onWhatsApp={onWhatsApp} lang={lang} />
      <SkExtrasSection pkg={pkg} isDesktop={false} lang={lang} />
      <SkCustomSection pkg={pkg} isDesktop={false} />
      <SkImportantNotesSection pkg={pkg} isDesktop={false} lang={lang} />
      <SkFaqSection pkg={pkg} isDesktop={false} lang={lang} />
      <SkReviewsSection pkg={pkg} agency={agency} isDesktop={false} lang={lang} />
      <SkPeopleSection pkg={pkg} isDesktop={false} onWhatsApp={onWhatsApp} lang={lang} />
      <SkAboutAgencySection pkg={pkg} agency={agency} isDesktop={false} lang={lang} />
      <SkOtherPackagesSection pkg={pkg} isDesktop={false} lang={lang} agencySlug={agency.agencySlug} />

      {/* Mutawif dark closing panel (legacy agent field) */}
      <MutawifClosingPanel pkg={pkg} agency={agency} lang={lang} onWhatsApp={onWhatsApp} />

      <SkCTABanner pkg={pkg} agency={agency} isDesktop={false} onWhatsApp={onWhatsApp} onMessenger={onMessenger} lang={lang} />
      <SkMobileFooter agency={agency} lang={lang} />
      <StickyCTA price={pkg.price} nights={nights} label={t.whatsAppTheOffice} onWhatsApp={pkg.whatsapp ? onWhatsApp : undefined} lang={lang} />
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
