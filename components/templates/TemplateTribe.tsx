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
  getItineraryDays,
} from "./shared";
import type { TPageProps, TCardProps } from "./types";

// ─── Tribe palette constants ────────────────────────────────────────────────
const BRAND   = "#b85c2c";
const BG      = "#faf6ef";
const INK     = "#0d1b2e";
const MUTED   = "rgba(13,27,46,0.55)";
const SMUTED  = "rgba(13,27,46,0.35)";
const BORDER  = "rgba(13,27,46,0.08)";
const SANS    = "var(--font-dm-sans, sans-serif)";

// Day → emoji map
const DAY_EMOJI: Record<number, string> = {
  1: "🌅", 2: "🏛", 3: "🏔", 4: "✨", 5: "🍷",
  6: "🎭", 7: "🛶", 8: "🌿", 9: "🏖",
};
function dayEmoji(day: number) { return DAY_EMOJI[day] || "📍"; }

// ─── Section data helpers ────────────────────────────────────────────────────

type TbSecData = Record<string, unknown>;

function tbFindSec(pkg: TPageProps["pkg"], type: string): TbSecData | undefined {
  return pkg.sections?.find((s) => s.type === type)?.data as TbSecData | undefined;
}
function tbSecArr(data: TbSecData | undefined, key: string): TbSecData[] {
  if (!data) return [];
  const v = data[key];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is TbSecData => x != null && typeof x === "object");
}
function tbSecStr(data: TbSecData | undefined, key: string): string {
  if (!data) return "";
  const v = data[key];
  return typeof v === "string" ? v : "";
}
function tbSecNum(data: TbSecData | undefined, key: string): number | undefined {
  if (!data) return undefined;
  const v = data[key];
  return typeof v === "number" ? v : undefined;
}
function tbSecStrArr(data: TbSecData | undefined, key: string): string[] {
  if (!data) return [];
  const v = data[key];
  return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
}
function tbItemStr(item: TbSecData | string, ...keys: string[]): string {
  if (typeof item === "string") return item;
  for (const k of keys) {
    const v = (item as TbSecData)[k];
    if (typeof v === "string" && v) return v;
  }
  return "";
}

// ─── Individual section renderers ────────────────────────────────────────────

function TbItinerarySection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = tbFindSec(pkg, "itinerary");
  const days = tbSecArr(data, "days").length ? tbSecArr(data, "days") : (pkg.itinerary ?? []).map(d => ({ day: d.day, title: d.title, desc: d.desc }));
  if (!days.length) return null;
  const pad = isDesktop ? "0 80px 56px" : "28px 18px 0";
  if (isDesktop) {
    return (
      <div data-pmx-section="itinerary">
      <DContainer id="itinerary" style={{ padding: pad, scrollMarginTop: 88 }}>
        <Eyebrow text={t.tbJourneyDayByDay} brand={BRAND} />
        <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.6px", marginTop: 10, marginBottom: 24 }}>{t.tbAdventureLaidOut}</h2>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(days.length, 5)}, 1fr)`, gap: 12 }}>
          {days.slice(0, 5).map((d, i) => {
            const day = typeof d.day === "number" ? d.day : Number(d.day) || (i + 1);
            return (
              <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "18px 16px" }}>
                <div style={{ fontSize: 10.5, color: BRAND, fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase" as const, marginBottom: 4 }}>{t.dayLabel} {day}</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: INK, lineHeight: 1.3, marginBottom: tbItemStr(d, "desc") ? 6 : 0 }}>{tbItemStr(d, "title")}</div>
                {tbItemStr(d, "desc") && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.45 }}>{tbItemStr(d, "desc")}</div>}
              </div>
            );
          })}
        </div>
      </DContainer>
      </div>
    );
  }
  return (
    <section id="itinerary" style={{ padding: pad, scrollMarginTop: 88 }} data-pmx-section="itinerary">
      <Eyebrow text={t.dayByDay} brand={BRAND} />
      <h2 style={{ fontSize: 22, fontWeight: 700, color: INK, margin: "10px 0 16px", letterSpacing: "-0.3px" }}>{t.tbYourJourney}</h2>
      <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
        {days.map((d, i) => {
          const day = typeof d.day === "number" ? d.day : Number(d.day) || (i + 1);
          return (
            <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, alignItems: "flex-start" }}>
              <div style={{ fontSize: 24, flexShrink: 0, lineHeight: 1, marginTop: 2 }}>{dayEmoji(day)}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: BRAND, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 4 }}>{t.dayLabel} {day}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: INK, lineHeight: 1.3, marginBottom: tbItemStr(d, "desc") ? 4 : 0 }}>{tbItemStr(d, "title")}</div>
                {tbItemStr(d, "desc") && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>{tbItemStr(d, "desc")}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TbHighlightsSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data  = tbFindSec(pkg, "highlights");
  const items = tbSecArr(data, "items").map(i => tbItemStr(i, "text")).filter(Boolean);
  if (!items.length) return null;
  const pad = isDesktop ? "0 80px 48px" : "28px 18px 0";
  return (
    <section style={{ padding: pad }} data-pmx-section="highlights">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 12 }}>{t.tbTripHighlights}</div>
        <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
          {items.map((item, i) => (
            <div key={i} style={{ background: `${BRAND}12`, border: `1px solid ${BRAND}30`, borderRadius: 8, padding: "8px 14px", fontSize: 13, fontWeight: 700, color: BRAND }}>{item}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TbHotelSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = tbFindSec(pkg, "hotel");
  const desc = tbSecStr(data, "description") || pkg.hotelDescription || "";
  const image = tbSecStr(data, "image");
  if (!desc) return null;
  const pad = isDesktop ? "0 80px 48px" : "28px 18px 0";
  return (
    <section style={{ padding: pad }} data-pmx-section="hotel">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 12 }}>{t.tbWhereYouStay}</div>
        <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, overflow: "hidden" }}>
          {image && <img src={image} alt="Hotel" style={{ width: "100%", height: isDesktop ? 240 : 160, objectFit: "cover", display: "block" }} />}
          <div style={{ padding: isDesktop ? "22px 24px" : "16px 18px" }}>
            <p style={{ fontSize: isDesktop ? 15 : 14, color: MUTED, lineHeight: 1.7, margin: 0 }}>{desc}</p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TbInclusionsSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data     = tbFindSec(pkg, "inclusions");
  const includes = (data?.includes as string[] | undefined) ?? pkg.includes ?? [];
  const excludes = (data?.excludes as string[] | undefined) ?? pkg.excludes ?? [];
  if (!includes.length && !excludes.length) return null;
  const pad = isDesktop ? "0 80px 48px" : "28px 18px 0";
  return (
    <section id="included" style={{ padding: pad, scrollMarginTop: 88 }} data-pmx-section="inclusions">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <Eyebrow text={t.tbWhatsIncluded} brand={BRAND} />
        {includes.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3,1fr)" : "1fr 1fr", gap: 8, marginTop: 16, marginBottom: excludes.length ? 16 : 0 }}>
            {includes.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "10px 12px" }}>
                <span style={{ color: BRAND, fontSize: 11, fontWeight: 800, marginTop: 1, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 12.5, color: MUTED, lineHeight: 1.4 }}>{item}</span>
              </div>
            ))}
          </div>
        )}
        {excludes.length > 0 && (
          <div style={{ marginTop: includes.length ? 12 : 0 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 8 }}>{t.tbNotIncluded}</div>
            {excludes.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12.5, color: MUTED, marginBottom: 6 }}>
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

function TbFaqSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data  = tbFindSec(pkg, "faq");
  const items = tbSecArr(data, "items");
  if (!items.length) return null;
  const pad = isDesktop ? "0 80px 48px" : "28px 18px 0";
  return (
    <section style={{ padding: pad }} data-pmx-section="faq">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 12 }}>{t.tbCommonQuestions}</div>
        <div style={{ display: isDesktop ? "grid" : "flex", gridTemplateColumns: isDesktop ? "1fr 1fr" : undefined, flexDirection: isDesktop ? undefined : "column" as const, gap: 0 }}>
          {items.map((f, i) => {
            const q = tbItemStr(f, "q", "question");
            const a = tbItemStr(f, "a", "answer");
            return (
              <div key={i} style={{ borderBottom: `1px solid ${BORDER}`, padding: "14px 0", paddingRight: isDesktop && i % 2 === 0 ? 24 : 0, paddingLeft: isDesktop && i % 2 === 1 ? 24 : 0 }}>
                <div style={{ fontSize: isDesktop ? 14 : 13.5, fontWeight: 800, color: INK, lineHeight: 1.3, marginBottom: 6 }}>{q}</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.65 }}>{a}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TbCustomSection({ pkg, isDesktop }: { pkg: TPageProps["pkg"]; isDesktop: boolean }) {
  const data    = tbFindSec(pkg, "custom");
  const heading = tbSecStr(data, "heading");
  const content = tbSecStr(data, "content");
  const image   = tbSecStr(data, "image");
  if (!heading && !content) return null;
  const pad = isDesktop ? "0 80px 48px" : "28px 18px 0";
  return (
    <section style={{ padding: pad }} data-pmx-section="custom">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        {heading && <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 12 }}>{heading}</div>}
        {image && <img src={image} alt={heading} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 14, marginBottom: 16, display: "block" }} />}
        {content && <div style={{ fontSize: 14, color: MUTED, lineHeight: 1.7 }}>{content}</div>}
      </div>
    </section>
  );
}

function TbExtrasSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data  = tbFindSec(pkg, "extras");
  const items = tbSecArr(data, "items");
  if (!items.length) return null;
  const pad = isDesktop ? "0 80px 48px" : "28px 18px 0";
  return (
    <section style={{ padding: pad }} data-pmx-section="extras">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 12 }}>{t.tbOptionalAddOns}</div>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2,1fr)" : "1fr", gap: 8 }}>
          {items.map((item, i) => {
            const name  = tbItemStr(item, "name", "title");
            const price = tbItemStr(item, "price");
            const desc  = tbItemStr(item, "description", "desc");
            return (
              <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>{name}</div>
                  {desc && <div style={{ fontSize: 12, color: MUTED, marginTop: 4, lineHeight: 1.5 }}>{desc}</div>}
                </div>
                {price && <div style={{ fontSize: 13, fontWeight: 800, color: BRAND, flexShrink: 0 }}>{price}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TbPeopleSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data   = tbFindSec(pkg, "people");
  const people = tbSecArr(data, "people");
  if (!people.length) return null;
  const pad = isDesktop ? "0 80px 48px" : "28px 18px 0";
  return (
    <section style={{ padding: pad }} data-pmx-section="people">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 14 }}>{t.tbYourTribeLeaders}</div>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2,1fr)" : "1fr", gap: 12 }}>
          {people.map((person, i) => {
            const name  = tbItemStr(person, "name");
            const role  = tbItemStr(person, "role");
            const bio   = tbItemStr(person, "bio");
            const photo = tbItemStr(person, "photo");
            const years = person.years as number | undefined;
            const langs = (person.languages as string[] | undefined) ?? [];
            return (
              <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "16px 18px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                {photo
                  ? <img src={photo} alt={name} style={{ width: 56, height: 56, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
                  : <div style={{ width: 56, height: 56, borderRadius: 10, background: `${BRAND}14`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, fontWeight: 800, color: BRAND, flexShrink: 0 }}>{name?.[0]}</div>
                }
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: INK }}>{name}</div>
                  {role && <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.8px", color: BRAND, textTransform: "uppercase" as const, marginTop: 2 }}>{role}{years ? ` · ${years}y` : ""}</div>}
                  {bio && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55, marginTop: 8 }}>{bio}</div>}
                  {langs.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4, marginTop: 8 }}>
                      {langs.map((l, j) => <div key={j} style={{ background: `${BRAND}0e`, border: `1px solid ${BRAND}25`, borderRadius: 4, padding: "2px 7px", fontSize: 10.5, fontWeight: 600, color: BRAND }}>{l}</div>)}
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

function TbImportantNotesSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data  = tbFindSec(pkg, "important_notes");
  const notes = tbSecArr(data, "notes");
  const items = notes.length ? notes : tbSecArr(data, "items");
  if (!items.length) return null;
  const pad = isDesktop ? "0 80px 48px" : "28px 18px 0";
  return (
    <section style={{ padding: pad }} data-pmx-section="important_notes">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 12 }}>{t.tbGoodToKnow}</div>
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3,1fr)" : "1fr", gap: 10 }}>
          {items.map((n, i) => {
            const severity = tbItemStr(n, "severity");
            const title    = tbItemStr(n, "title", "text");
            const body     = tbItemStr(n, "body");
            const isWarn   = severity === "warn";
            return (
              <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderLeftColor: isWarn ? BRAND : BORDER.replace("0.08", "0.3"), borderLeftWidth: 3, borderRadius: "0 12px 12px 0", padding: "14px 16px" }}>
                {isWarn && <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1px", textTransform: "uppercase" as const, color: BRAND, marginBottom: 5 }}>⚠ {t.tbImportantTag}</div>}
                <div style={{ fontSize: 13.5, fontWeight: 700, color: INK, lineHeight: 1.3, marginBottom: body ? 6 : 0 }}>{title}</div>
                {body && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>{body}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TbAboutAgencySection({ pkg, agency, isDesktop, lang }: { pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = tbFindSec(pkg, "about_agency");
  if (!data && !agency.tagline) return null;
  const story     = tbItemStr(data || {}, "story", "content");
  const foundedRaw = (data as TbSecData | undefined)?.founded;
  const founded    = typeof foundedRaw === "number" ? foundedRaw : undefined;
  const teamSize   = tbSecStr(data, "teamSize");
  const teamPhoto  = tbSecStr(data, "teamPhoto") || tbSecStr(data, "image");
  const currentYear = new Date().getFullYear();
  const pad = isDesktop ? "0 80px 64px" : "28px 18px 0";
  return (
    <section style={{ padding: pad }} data-pmx-section="about_agency">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 12 }}>{t.tbAboutPrefix} {agency.name}</div>
        {isDesktop && teamPhoto ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, alignItems: "start" }}>
            <div>
              {story && <p style={{ fontSize: 15, color: MUTED, lineHeight: 1.65, margin: "0 0 20px" }}>{story}</p>}
              {(founded || teamSize) && (
                <div style={{ display: "flex", gap: 24, paddingTop: 16, borderTop: `1px solid ${BORDER}` }}>
                  {founded && (
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: BRAND, lineHeight: 1 }}>{currentYear - founded}+</div>
                      <div style={{ fontSize: 10, color: MUTED, marginTop: 3, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>{t.tbYears}</div>
                    </div>
                  )}
                  {teamSize && (
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 800, color: BRAND, lineHeight: 1 }}>{teamSize}</div>
                      <div style={{ fontSize: 10, color: MUTED, marginTop: 3, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>{t.tbTeam}</div>
                    </div>
                  )}
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
                    <div style={{ fontSize: 22, fontWeight: 800, color: BRAND, lineHeight: 1 }}>{currentYear - founded}+</div>
                    <div style={{ fontSize: 10, color: MUTED, marginTop: 3, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{t.tbYears}</div>
                  </div>
                )}
                <div style={{ flex: 1, textAlign: "center" as const, padding: "8px 0" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: BRAND, lineHeight: 1 }}>100%</div>
                  <div style={{ fontSize: 10, color: MUTED, marginTop: 3, textTransform: "uppercase" as const, letterSpacing: "0.5px" }}>{t.tbSatisfactionLabel}</div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function TbOtherPackagesSection({ pkg, isDesktop, lang, agencySlug }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"]; agencySlug?: string }) {
  const t = T[lang];
  const data = tbFindSec(pkg, "other_packages");
  const cards = tbSecArr(data, "packages");
  if (!cards.length) return null;
  const heading = tbSecStr(data, "heading") || t.otherPackagesHeading;
  const pad = isDesktop ? "0 80px 48px" : "28px 18px 0";
  const isRtl = lang === "ar";
  return (
    <section style={{ padding: pad }} dir={isRtl ? "rtl" : "ltr"} data-pmx-section="other_packages">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 14 }}>{heading}</div>
        <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8, scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
          {cards.map((card, i) => {
            const img = tbSecStr(card, "image");
            const title = tbItemStr(card, "title");
            const dest = tbSecStr(card, "destination");
            const price = tbSecStr(card, "price");
            const nights = tbSecStr(card, "nights");
            const link = tbSecStr(card, "link");
            return (
              <a key={i} href={link || undefined} style={{
                flex: "0 0 190px", minWidth: 190, borderRadius: 14, overflow: "hidden",
                textDecoration: "none", border: `1px solid ${BORDER}`,
                background: "#fff", scrollSnapAlign: "start",
                display: "flex", flexDirection: "column",
              }}>
                <div style={{ width: "100%", height: 120, background: BORDER, flexShrink: 0 }}>
                  {img && <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                </div>
                <div style={{ padding: "10px 12px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                  {dest && <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" as const, color: BRAND }}>{dest}</div>}
                  <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 700, color: INK, lineHeight: 1.3 }}>{title}</div>
                  {(nights || price) && (
                    <div style={{ marginTop: "auto", paddingTop: 6, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                      {nights && <span style={{ fontFamily: SANS, fontSize: 11, color: MUTED }}>{nights}</span>}
                      {price && <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: BRAND }}>{price}</span>}
                    </div>
                  )}
                </div>
              </a>
            );
          })}
        </div>
        {agencySlug && (
          <div style={{ marginTop: 14, textAlign: isRtl ? "left" : "right" }}>
            <a href={`/${agencySlug}`} style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: BRAND, textDecoration: "none" }}>
              {t.navAllPackages} →
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

function TbDeparturesSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data = tbFindSec(pkg, "departures");
  const deps = tbSecArr(data, "departures").length ? tbSecArr(data, "departures") : (pkg.departures ?? []).map(d => d as unknown as TbSecData);
  if (!deps.length) return null;
  const pad = isDesktop ? "0 80px 48px" : "28px 18px 0";
  return (
    <section style={{ padding: pad }} data-pmx-section="departures">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 12 }}>{t.tbDepartureDates}</div>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
          {deps.map((d, i) => {
            const date  = tbItemStr(d, "date");
            const spots = tbSecNum(d, "spots") ?? tbSecNum(d, "spotsRemaining");
            const price = tbItemStr(d, "price");
            const isLow = spots != null && spots <= 4;
            return (
              <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: INK, marginBottom: spots != null ? 3 : 0 }}>{date}</div>
                  {spots != null && <div style={{ fontSize: 11.5, color: isLow ? BRAND : MUTED, fontWeight: isLow ? 700 : 400 }}>{isLow ? `${t.tbOnlySpotsLeft} ${spots} ${t.tbSpotsLeft}` : `${spots} ${t.tbSpotsAvailable}`}</div>}
                </div>
                {price && <div style={{ fontSize: 15, fontWeight: 800, color: BRAND }}>{price}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TbPricingSection({ pkg, isDesktop, onWhatsApp, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; onWhatsApp: () => void; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data  = tbFindSec(pkg, "pricing");
  const tiers = tbSecArr(data, "tiers").length ? tbSecArr(data, "tiers") : (pkg.pricingTiers ?? []).map(t2 => ({ label: t2.label, price: t2.price, was: t2.was, perks: t2.perks, pop: t2.pop }));
  if (!tiers.length) return null;
  const pad = isDesktop ? "0 80px 48px" : "28px 18px 0";
  return (
    <section id="pricing" style={{ padding: pad, scrollMarginTop: 88 }} data-pmx-section="pricing">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <Eyebrow text={t.navPricing} brand={BRAND} />
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? `repeat(${Math.min(tiers.length, 3)},1fr)` : "1fr", gap: 12, marginTop: 16 }}>
          {tiers.map((tier, i) => {
            const pop   = !!tier.pop;
            const label = localizeTierLabel(tbItemStr(tier, "label"), lang);
            const price = tbItemStr(tier, "price");
            const was   = tbItemStr(tier, "was");
            const perks = (tier.perks as string[] | undefined) ?? [];
            return (
              <div key={i} style={{ background: pop ? BRAND : "#fff", border: `1px solid ${pop ? BRAND : BORDER}`, borderRadius: 14, padding: isDesktop ? "24px 24px" : "18px 18px", display: "flex", flexDirection: "column" as const }}>
                {pop && <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: "rgba(255,255,255,0.75)", marginBottom: 8 }}>{t.tbMostPopular}</div>}
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" as const, color: pop ? "rgba(255,255,255,0.75)" : MUTED, marginBottom: 6 }}>{label}</div>
                <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                  <div style={{ fontSize: isDesktop ? 34 : 28, fontWeight: 800, letterSpacing: "-0.5px", color: pop ? "#fff" : BRAND, lineHeight: 1 }}>{price}</div>
                  {was && <div style={{ fontSize: 13, textDecoration: "line-through", color: pop ? "rgba(255,255,255,0.5)" : MUTED }}>{was}</div>}
                </div>
                <div style={{ fontSize: 11, color: pop ? "rgba(255,255,255,0.65)" : MUTED, marginBottom: perks.length ? 14 : 0 }}>{t.perPerson}</div>
                {perks.length > 0 && (
                  <ul style={{ listStyle: "none", padding: 0, margin: "0 0 14px", display: "flex", flexDirection: "column" as const, gap: 8, borderTop: `1px solid ${pop ? "rgba(255,255,255,0.2)" : BORDER}`, paddingTop: 12 }}>
                    {perks.map((p, j) => (
                      <li key={j} style={{ display: "flex", gap: 8, fontSize: 12.5, color: pop ? "rgba(255,255,255,0.85)" : MUTED }}>
                        <span style={{ color: pop ? "rgba(255,255,255,0.7)" : BRAND, fontWeight: 700, flexShrink: 0 }}>✓</span>
                        {p}
                      </li>
                    ))}
                  </ul>
                )}
                <button onClick={onWhatsApp} style={{ marginTop: "auto", background: pop ? "rgba(255,255,255,0.2)" : `${BRAND}12`, border: `1px solid ${pop ? "rgba(255,255,255,0.3)" : `${BRAND}30`}`, borderRadius: 8, padding: "10px 0", fontSize: 13, fontWeight: 700, color: pop ? "#fff" : BRAND, fontFamily: SANS, cursor: "pointer" }}>
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

function TbTransfersSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const data  = tbFindSec(pkg, "transfers");
  const items = tbSecArr(data, "items");
  if (!items.length) return null;
  const pad = isDesktop ? "0 80px 48px" : "28px 18px 0";
  return (
    <section style={{ padding: pad }} data-pmx-section="transfers">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 12 }}>{t.tbTransfersLabel}</div>
        <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
          {items.map((item, i) => {
            const from = tbItemStr(item, "from");
            const to   = tbItemStr(item, "to");
            const type = tbItemStr(item, "type", "transportType");
            const note = tbItemStr(item, "note", "details");
            return (
              <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div style={{ minWidth: 0 }}>
                  {(from || to) && <div style={{ fontSize: 13.5, fontWeight: 700, color: INK, marginBottom: 4, overflowWrap: "break-word" }}>{from}{from && to ? " → " : ""}{to}</div>}
                  {type && <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.8px", color: BRAND, textTransform: "uppercase" as const }}>{type}</div>}
                  {note && <div style={{ fontSize: 12, color: MUTED, marginTop: 4, overflowWrap: "break-word" }}>{note}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function TbMediaSection({ pkg, isDesktop, lang }: { pkg: TPageProps["pkg"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const mediaSec   = tbFindSec(pkg, "media");
  const videoUrl   = tbSecStr(mediaSec, "videoUrl") || pkg.videoUrl || "";
  const mapSrc     = tbSecStr(mediaSec, "mapImage") || tbSecStr(mediaSec, "mapSrc") || "";
  const mapCaption = tbSecStr(mediaSec, "mapCaption") || "";
  const images     = tbSecStrArr(mediaSec, "images");
  if (!videoUrl && !mapSrc && !images.length) return null;
  const pad = isDesktop ? "0 80px 48px" : "28px 18px 0";
  return (
    <section style={{ padding: pad }} data-pmx-section="media">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 12 }}>{t.tbPhotosFilm}</div>
        {mapSrc && (
          <figure style={{ margin: "0 0 12px", position: "relative", borderRadius: 14, overflow: "hidden" }}>
            <img src={mapSrc} alt="map" style={{ width: "100%", height: isDesktop ? 320 : 200, objectFit: "cover", display: "block" }} />
            {mapCaption && <figcaption style={{ position: "absolute", bottom: 0, left: 0, right: 0, background: "linear-gradient(to top, rgba(0,0,0,0.65),transparent)", padding: "18px 14px 12px", color: "#fff", fontSize: 11.5 }}>{mapCaption}</figcaption>}
          </figure>
        )}
        {videoUrl && (() => {
          const isEmbed = videoUrl.includes("youtube") || videoUrl.includes("youtu.be") || videoUrl.includes("vimeo");
          const embed = (() => {
            const yt = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
            if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
            const vi = videoUrl.match(/vimeo\.com\/(\d+)/);
            if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
            return videoUrl;
          })();
          return (
            <figure style={{ margin: "0 0 12px", borderRadius: 14, overflow: "hidden", background: INK, position: "relative", height: isDesktop ? 240 : 200 }}>
              {isEmbed
                ? <iframe src={embed} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
                : <video src={videoUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              }
            </figure>
          );
        })()}
        {images.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(images.length, isDesktop ? 4 : 2)}, 1fr)`, gap: 8 }}>
            {images.slice(0, isDesktop ? 4 : 4).map((src, i) => (
              <div key={i} style={{ borderRadius: 10, overflow: "hidden", height: 100 }}>
                <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }} />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── TbSections — renders all section types via a switch ─────────────────────

function TbSections({ pkg, isDesktop, onWhatsApp, lang, agency }: { pkg: TPageProps["pkg"]; isDesktop: boolean; onWhatsApp: () => void; lang: TPageProps["lang"]; agency: TPageProps["agency"] }) {
  return (
    <>
      <TbItinerarySection pkg={pkg} isDesktop={isDesktop} lang={lang} />
      <TbHighlightsSection pkg={pkg} isDesktop={isDesktop} lang={lang} />
      <TbHotelSection pkg={pkg} isDesktop={isDesktop} lang={lang} />
      <TbInclusionsSection pkg={pkg} isDesktop={isDesktop} lang={lang} />
      <TbMediaSection pkg={pkg} isDesktop={isDesktop} lang={lang} />
      <TbTransfersSection pkg={pkg} isDesktop={isDesktop} lang={lang} />
      <TbPricingSection pkg={pkg} isDesktop={isDesktop} onWhatsApp={onWhatsApp} lang={lang} />
      <TbDeparturesSection pkg={pkg} isDesktop={isDesktop} lang={lang} />
      <TbExtrasSection pkg={pkg} isDesktop={isDesktop} lang={lang} />
      <TbCustomSection pkg={pkg} isDesktop={isDesktop} />
      <TbPeopleSection pkg={pkg} isDesktop={isDesktop} lang={lang} />
      <TbImportantNotesSection pkg={pkg} isDesktop={isDesktop} lang={lang} />
      <TbFaqSection pkg={pkg} isDesktop={isDesktop} lang={lang} />
      <TbAboutAgencySection pkg={pkg} agency={agency} isDesktop={isDesktop} lang={lang} />
      <TbOtherPackagesSection pkg={pkg} isDesktop={isDesktop} lang={lang} agencySlug={agency.agencySlug} />
    </>
  );
}

// ─── TbReviews ───────────────────────────────────────────────────────────────

function TbReviews({ pkg, agency, isDesktop, lang }: { pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; isDesktop: boolean; lang: TPageProps["lang"] }) {
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

  const pad = isDesktop ? "0 80px 48px" : "28px 18px 0";
  return (
    <section style={{ padding: pad }} data-pmx-section="reviews">
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: MUTED, marginBottom: 14 }}>
          {showList ? `${reviews.length} ${t.tbVerifiedReviews}` : t.writeReviewTitle}
        </div>
        {showList && (
          <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(2,1fr)" : "1fr", gap: 10, marginBottom: canSubmit ? 24 : 0 }}>
            {reviews.map((r, i) => (
              <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "16px 18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                  <div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: INK }}>{r.name}</div>
                    {r.country && <div style={{ fontSize: 10, color: MUTED, marginTop: 2 }}>{r.country}</div>}
                  </div>
                  <div style={{ display: "flex", gap: 1 }}>{[1,2,3,4,5].map(n => <span key={n} style={{ color: n <= r.rating ? BRAND : "rgba(13,27,46,0.15)", fontSize: 12 }}>★</span>)}</div>
                </div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{r.text}</div>
              </div>
            ))}
          </div>
        )}
        {canSubmit && status !== "ok" && (
          <div style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: isDesktop ? "24px 28px" : "18px 18px" }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: INK, marginBottom: 14 }}>{t.writeReviewTitle}</div>
            <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
              {[1,2,3,4,5].map(n => (
                <button key={n} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)} onClick={() => setRating(n)} style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", fontSize: 22, color: n <= (hover || rating) ? BRAND : "rgba(13,27,46,0.15)", lineHeight: 1 }}>★</button>
              ))}
            </div>
            <input placeholder={t.reviewYourName} value={name} onChange={e => setName(e.target.value)} style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: SANS, background: "transparent", color: INK, marginBottom: 8, boxSizing: "border-box" as const }} />
            <textarea placeholder={t.reviewPlaceholder} value={text} onChange={e => setText(e.target.value)} rows={3} style={{ width: "100%", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "10px 12px", fontSize: 13, fontFamily: SANS, background: "transparent", color: INK, marginBottom: 14, resize: "none" as const, boxSizing: "border-box" as const }} />
            <button onClick={handleSubmit} disabled={status === "sending"} style={{ background: BRAND, color: "#fff", border: "none", borderRadius: 8, padding: "10px 20px", fontSize: 13, fontWeight: 700, fontFamily: SANS, cursor: "pointer" }}>{status === "sending" ? t.tbSending : t.submitReviewBtn}</button>
            {status === "err" && <div style={{ fontSize: 12, color: "#c0392b", marginTop: 8 }}>{t.tbSomethingWrong}</div>}
          </div>
        )}
        {status === "ok" && <div style={{ background: `${BRAND}10`, border: `1px solid ${BRAND}30`, borderRadius: 10, padding: "14px 18px", fontSize: 13, color: BRAND, fontWeight: 600 }}>{t.reviewSubmitSuccess}</div>}
      </div>
    </section>
  );
}

// ─── TbCTABanner ─────────────────────────────────────────────────────────────

function TbCTABanner({ pkg, agency, isDesktop, onWhatsApp, onMessenger, lang }: { pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; isDesktop: boolean; onWhatsApp: () => void; onMessenger: () => void; lang: TPageProps["lang"] }) {
  const t = T[lang];
  const nights = pkg.nights ? Number(pkg.nights) : null;
  const pad = isDesktop ? "48px 80px 64px" : "24px 18px";
  return (
    <section style={{ padding: pad, background: INK, color: "#fff" }}>
      <div style={{ maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined, display: "flex", flexDirection: isDesktop ? "row" as const : "column" as const, justifyContent: "space-between", alignItems: isDesktop ? "center" : "flex-start", gap: 24 }}>
        <div>
          <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: "1.5px", textTransform: "uppercase" as const, color: BRAND, marginBottom: 8 }}>{t.tbJoinTheTribe}</div>
          <div style={{ fontSize: isDesktop ? 36 : 28, fontWeight: 800, letterSpacing: "-0.8px", color: "#fff", lineHeight: 1 }}>{pkg.price}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 4 }}>{nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.perPerson}</div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
          <WAButton label={t.saveMySeat} size="lg" onClick={onWhatsApp} />
          {pkg.messenger && <button onClick={onMessenger} style={{ background: "#0084ff", color: "#fff", border: "none", borderRadius: 8, padding: "14px 22px", fontSize: 14, fontWeight: 700, fontFamily: SANS, cursor: "pointer" }}>{t.tbMessenger}</button>}
        </div>
      </div>
    </section>
  );
}

// ─── TbMobileFooter ──────────────────────────────────────────────────────────

function TbMobileFooter({ agency }: { agency: TPageProps["agency"] }) {
  return (
    <div style={{ padding: "24px 18px", background: INK, borderTop: "1px solid rgba(255,255,255,0.08)", textAlign: "center" as const }}>
      {agency.logoUrl && <img src={agency.logoUrl} alt={agency.name} style={{ height: 28, objectFit: "contain", display: "block", margin: "0 auto 10px", filter: "brightness(0) invert(1)" }} />}
      <div style={{ fontSize: 14, fontWeight: 700, color: "#fff" }}>{agency.name}</div>
      {agency.tagline && <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{agency.tagline}</div>}
    </div>
  );
}

// ─── TemplateTribePage ───────────────────────────────────────────────────────

export function TemplateTribePage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const nights = pkg.nights ? Number(pkg.nights) : null;
  const coverImage = pkg.coverImage || "";
  const title = pkg.title || pkg.destination;
  const itinerary = getItineraryDays(pkg).filter(it => it.title?.trim());
  const isRtl = lang === "ar";
  const isDesktop = useIsDesktop();

  // Use v2 sections if present, otherwise fall back to legacy itinerary rendering
  const hasV2Itinerary = !!(pkg.sections?.some(s => s.type === "itinerary"));

  const navLinks = [
    ...(itinerary.length || hasV2Itinerary ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...((pkg.includes?.length || (pkg.advantages || []).length || pkg.excludes?.length) ? [{ label: t.navIncluded, href: "#included" }] : []),
    ...((pkg.pricingTiers || []).some(tier => tier.price) ? [{ label: t.navPricing, href: "#pricing" }] : []),
  ];

  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: BG, color: INK, fontFamily: SANS, direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={BRAND} navLinks={navLinks} lang={lang} onWhatsApp={onWhatsApp} />

        {/* Full-bleed hero with floating price card */}
        <div data-pmx-section="hero" style={{ position: "relative", height: 560, overflow: "hidden" }}>
          {coverImage
            ? <img src={coverImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
            : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${BRAND}cc, ${BRAND}55)` }} />
          }
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.15), rgba(0,0,0,0.55))" }} />
          <DContainer style={{ position: "absolute", inset: 0, padding: "0 80px", display: "flex", alignItems: "flex-end", paddingBottom: 56 }}>
            <div style={{ color: "#fff", flex: 1 }}>
              <div data-pmx-field="destination" style={{ fontSize: 12, fontWeight: 700, opacity: 0.9, letterSpacing: "1.4px", textTransform: "uppercase" as const }}>{pkg.destination}</div>
              <h1 data-pmx-field="title" style={{ fontSize: 64, fontWeight: 800, lineHeight: 1, letterSpacing: "-1.6px", margin: "12px 0 0" }}>{title}</h1>
              <p style={{ fontSize: 17, opacity: 0.9, marginTop: 16, maxWidth: 540, lineHeight: 1.5 }}>{pkg.description}</p>
            </div>
            <div style={{ background: "rgba(255,255,255,0.96)", backdropFilter: "blur(12px)", borderRadius: 16, padding: 24, minWidth: 260 }}>
              <div style={{ fontSize: 10.5, color: SMUTED, letterSpacing: "1px", textTransform: "uppercase" as const }}>{t.from}</div>
              <div data-pmx-field="price" style={{ fontSize: 42, fontWeight: 800, letterSpacing: "-1px", marginTop: 4, lineHeight: 1 }}>{pkg.price}</div>
              <div style={{ fontSize: 11, color: SMUTED, marginTop: 4 }}>{nights ? `${nights} ${t.nightsLabel} · ${t.perPerson}` : t.perPerson}</div>
              <div style={{ height: 1, background: BORDER, margin: "16px 0" }} />
              <WAButton label={t.saveMySeat} full size="md" onClick={onWhatsApp} />
            </div>
          </DContainer>
        </div>

        {/* Legacy itinerary 5-col grid (v1 packages only) */}
        {!hasV2Itinerary && itinerary.length > 0 && (
          <DContainer style={{ padding: "56px 80px 56px" }}>
            <Eyebrow text={t.editorialJourneyTogether} brand={BRAND} />
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.6px", marginTop: 10, marginBottom: 24 }}>{t.dayByDayHeading}</h2>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(itinerary.length, 5)}, 1fr)`, gap: 12 }}>
              {itinerary.slice(0, 5).map((it, i) => (
                <div key={i} style={{ background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 12, padding: 18 }}>
                  <div style={{ fontSize: 10.5, color: BRAND, fontWeight: 800, letterSpacing: "0.5px", textTransform: "uppercase" as const }}>{t.dayLabel} {it.day}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 600, marginTop: 4, lineHeight: 1.3 }}>{it.title}</div>
                  {it.desc && <div style={{ fontSize: 12, color: MUTED, marginTop: 4, lineHeight: 1.45 }}>{it.desc}</div>}
                </div>
              ))}
            </div>
          </DContainer>
        )}

        <TbSections pkg={pkg} isDesktop={true} onWhatsApp={onWhatsApp} lang={lang} agency={agency} />
        <TbReviews pkg={pkg} agency={agency} isDesktop={true} lang={lang} />
        <TbCTABanner pkg={pkg} agency={agency} isDesktop={true} onWhatsApp={onWhatsApp} onMessenger={onMessenger} lang={lang} />
        <DesktopFooter agency={agency} brand={BRAND} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, color: INK, fontFamily: SANS, direction: isRtl ? "rtl" : "ltr" }}>
      <AgencyBar agency={agency} price={pkg.price} brand={BRAND} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} />

      {/* Hero */}
      <div data-pmx-section="hero" style={{ position: "relative", height: 320, overflow: "hidden" }}>
        {coverImage ? (
          <img src={coverImage} alt={pkg.destination} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${BRAND}cc, ${BRAND}55)` }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.6) 100%)" }} />
        <div style={{ position: "absolute", top: 20, left: 18 }}>
          <div data-pmx-field="destination"><Eyebrow text={pkg.destination} brand={BRAND} light /></div>
        </div>
        <div style={{ position: "absolute", bottom: 24, left: 20, right: 20 }}>
          <h1 data-pmx-field="title" style={{ fontSize: 28, fontWeight: 800, color: "#fff", lineHeight: 1.15, margin: 0, letterSpacing: "-0.5px", textShadow: "0 2px 12px rgba(0,0,0,0.4)" }}>
            {title}
          </h1>
        </div>
      </div>

      {/* Price strip */}
      <div style={{ padding: "18px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, padding: "16px 18px" }}>
          <div>
            <div style={{ fontSize: 10, color: SMUTED, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 4 }}>{t.from}</div>
            <div data-pmx-field="price" style={{ fontSize: 28, fontWeight: 800, color: BRAND, letterSpacing: "-0.5px", lineHeight: 1 }}>{pkg.price}</div>
            <div style={{ fontSize: 11, color: MUTED, marginTop: 3 }}>{nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.perPerson}</div>
          </div>
          <WAButton label={t.bookWhatsApp} size="md" onClick={onWhatsApp} />
        </div>
      </div>

      {/* Legacy emoji day-by-day (v1 packages only) */}
      {!hasV2Itinerary && itinerary.length > 0 && (
        <section style={{ padding: "28px 18px 0" }}>
          <Eyebrow text={t.dayByDay} brand={BRAND} />
          <h2 style={{ fontSize: 22, fontWeight: 700, color: INK, margin: "10px 0 16px", letterSpacing: "-0.3px" }}>
            {t.yourJourney}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {itinerary.map((it, i) => (
              <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", background: "#fff", border: `1px solid ${BORDER}`, borderRadius: 14, alignItems: "flex-start" }}>
                <div style={{ fontSize: 24, flexShrink: 0, lineHeight: 1, marginTop: 2 }}>{dayEmoji(it.day)}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: BRAND, textTransform: "uppercase" as const, letterSpacing: "0.8px", marginBottom: 4 }}>
                    {t.dayLabel} {it.day}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: INK, lineHeight: 1.3, marginBottom: it.desc ? 4 : 0 }}>{it.title}</div>
                  {it.desc && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>{it.desc}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <TbSections pkg={pkg} isDesktop={false} onWhatsApp={onWhatsApp} lang={lang} agency={agency} />
      <TbReviews pkg={pkg} agency={agency} isDesktop={false} lang={lang} />

      <div style={{ padding: "0 18px 28px" }}>
        <TbCTABanner pkg={pkg} agency={agency} isDesktop={false} onWhatsApp={onWhatsApp} onMessenger={onMessenger} lang={lang} />
      </div>

      <TbMobileFooter agency={agency} />

      <StickyCTA price={pkg.price} nights={nights} label={t.bookWhatsApp} onWhatsApp={onWhatsApp} lang={lang} />
    </div>
  );
}

// ─── TemplateTribeCard ───────────────────────────────────────────────────────

export function TemplateTribeCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete} onToggleActive={onToggleActive} onDuplicate={onDuplicate}
      headingFont={SANS}
      imageBorderRadius={0}
      cardBg={BG}
    />
  );
}
