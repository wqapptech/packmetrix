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
} from "./shared";
import type { TPageProps, TCardProps } from "./types";

// ─── Atlas design tokens ─────────────────────────────────────────────────────

const AT = {
  bg:         "#f5f3ee",
  ink:        "#0d1b2e",
  muted:      "rgba(13,27,46,0.55)",
  superMuted: "rgba(13,27,46,0.35)",
  border:     "rgba(13,27,46,0.08)",
  brand:      "#2a2a2a",
  serif:      "var(--font-cormorant, var(--font-dm-serif), serif)",
  sans:       "var(--font-dm-sans, sans-serif)",
} as const;

// ─── Section data helpers ────────────────────────────────────────────────────

type AtSD = Record<string, unknown>;

function atFindSec(pkg: TPageProps["pkg"], type: string): AtSD | undefined {
  return pkg.sections?.find((s) => s.type === type)?.data as AtSD | undefined;
}

function atSecArr(d: AtSD | undefined, key: string): AtSD[] {
  if (!d) return [];
  const v = d[key];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is AtSD => x != null && typeof x === "object");
}

function atSecStr(d: AtSD | undefined, key: string): string {
  if (!d) return "";
  const v = d[key];
  return typeof v === "string" ? v : "";
}

function atSecNum(d: AtSD | undefined, key: string): number | undefined {
  if (!d) return undefined;
  const v = d[key];
  return typeof v === "number" ? v : undefined;
}

function atSecStrArr(d: AtSD | undefined, key: string): string[] {
  if (!d) return [];
  const v = d[key];
  return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
}

function atItemStr(item: AtSD | string, ...keys: string[]): string {
  if (typeof item === "string") return item;
  for (const k of keys) {
    const v = (item as AtSD)[k];
    if (typeof v === "string" && v) return v;
  }
  return "";
}

function atArrMixed(d: AtSD | undefined, key: string): Array<AtSD | string> {
  if (!d) return [];
  const v = d[key];
  if (!Array.isArray(v)) return [];
  return v.filter((x) => x != null) as Array<AtSD | string>;
}

// ─── MEAL / VISA label maps ───────────────────────────────────────────────────

const MEAL_LABELS: Record<string, { en: string; ar: string }> = {
  none:          { en: "Meals not included",              ar: "لا تشمل الوجبات" },
  breakfast:     { en: "Breakfast included",              ar: "الإفطار مشمول" },
  half_board:    { en: "Half board · breakfast + dinner", ar: "نصف إقامة · إفطار وعشاء" },
  full_board:    { en: "Full board · all meals",          ar: "إقامة كاملة" },
  all_inclusive: { en: "All-inclusive · meals + drinks",  ar: "شامل كل شيء" },
};

const VISA_LABELS: Record<string, { en: string; ar: string }> = {
  free:       { en: "Visa-free / on arrival",    ar: "بدون تأشيرة / عند الوصول" },
  included:   { en: "Visa included by agency",   ar: "تأشيرة مشمولة في السعر" },
  assistance: { en: "Visa support provided",     ar: "دعم في استخراج التأشيرة" },
  required:   { en: "Visa required · we assist", ar: "تأشيرة مطلوبة · نساعدك" },
};

// ─── Section switch ───────────────────────────────────────────────────────────

function AtSection({
  s, isDesktop, onWhatsApp, lang, agency,
}: {
  s: { id: string; type: string; order: number; data: Record<string, unknown> };
  isDesktop: boolean;
  onWhatsApp: () => void;
  lang: TPageProps["lang"];
  agency: TPageProps["agency"];
}) {
  const t = T[lang];
  const d = s.data as AtSD;
  const pad = isDesktop ? "0 80px 48px" : "22px 22px 0";
  const maxW = isDesktop ? 1080 : undefined;

  // Section heading helper
  function SH({ label }: { label: string }) {
    return (
      <div style={{
        fontSize: 10.5, fontWeight: 700, letterSpacing: "1.4px",
        textTransform: "uppercase" as const,
        color: AT.superMuted, marginBottom: 12,
      }}>
        {label}
      </div>
    );
  }

  // Divider
  function Div() {
    return <div style={{ height: 1, background: AT.border, margin: "0 0 24px" }} />;
  }

  switch (s.type) {
    // ── highlights ────────────────────────────────────────────────────────────
    case "highlights": {
      const items = atArrMixed(d, "items");
      if (items.length < 2) return null;
      return (
        <div style={{ padding: pad }}>
          <div style={{ maxWidth: maxW, margin: isDesktop ? "0 auto" : undefined }}>
            <Div />
            <SH label={atSecStr(d, "eyebrow") || t.atHighlights} />
            <div style={{
              display: "grid",
              gridTemplateColumns: isDesktop
                ? `repeat(${Math.min(items.length, 3)}, 1fr)`
                : "1fr",
              gap: isDesktop ? 32 : 16,
            }}>
              {items.map((item, i) => {
                const title = atItemStr(item, "title");
                const body = atItemStr(item, "body", "desc");
                return (
                  <div key={i}>
                    <div style={{
                      fontFamily: AT.serif, fontSize: isDesktop ? 42 : 34,
                      fontWeight: 400, color: AT.superMuted, lineHeight: 1,
                      marginBottom: 6,
                    }}>
                      {String(i + 1).padStart(2, "0")}
                    </div>
                    <div style={{ fontFamily: AT.serif, fontSize: isDesktop ? 20 : 17, fontWeight: 600, color: AT.ink, marginBottom: 4 }}>
                      {title || (typeof item === "string" ? item : "")}
                    </div>
                    {body && <p style={{ fontSize: 13, color: AT.muted, lineHeight: 1.65, margin: 0 }}>{body}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // ── itinerary ─────────────────────────────────────────────────────────────
    case "itinerary": {
      const items = atSecArr(d, "items").length ? atSecArr(d, "items") : atSecArr(d, "days");
      if (!items.length) return null;
      return (
        <div id="itinerary" style={{ padding: pad, scrollMarginTop: 64 }}>
          <div style={{ maxWidth: maxW, margin: isDesktop ? "0 auto" : undefined }}>
            <Div />
            <SH label={atSecStr(d, "eyebrow") || t.navItinerary} />
            {isDesktop ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px 40px" }}>
                {items.map((it, i) => {
                  const day = atItemStr(it, "day") || String(i + 1);
                  const title = atItemStr(it, "title");
                  const desc = atItemStr(it, "desc", "description");
                  const img = atItemStr(it, "img", "image");
                  return (
                    <div key={i} style={{ borderTop: `1px solid ${AT.border}`, paddingTop: 16, paddingBottom: 16 }}>
                      <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
                        {img && <img src={img} alt={title} style={{ width: 72, height: 60, objectFit: "cover", borderRadius: 3, flexShrink: 0 }} />}
                        <div>
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, color: AT.superMuted, marginBottom: 3 }}>
                            {t.dayLabel} {day}
                          </div>
                          <div style={{ fontFamily: AT.serif, fontSize: 16, fontWeight: 600, color: AT.ink, marginBottom: 3 }}>{title}</div>
                          {desc && <p style={{ fontSize: 12.5, color: AT.muted, lineHeight: 1.6, margin: 0 }}>{desc}</p>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                {items.map((it, i) => {
                  const day = atItemStr(it, "day") || String(i + 1);
                  const title = atItemStr(it, "title");
                  const desc = atItemStr(it, "desc", "description");
                  const img = atItemStr(it, "img", "image");
                  return (
                    <div key={i} style={{ borderTop: `1px solid ${AT.border}`, paddingTop: 14, paddingBottom: 14 }}>
                      {img && <img src={img} alt={title} style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 3, marginBottom: 10 }} />}
                      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, color: AT.superMuted, marginBottom: 3 }}>
                        {t.dayLabel} {day}
                      </div>
                      <div style={{ fontFamily: AT.serif, fontSize: 17, fontWeight: 600, color: AT.ink, marginBottom: 4 }}>{title}</div>
                      {desc && <p style={{ fontSize: 13, color: AT.muted, lineHeight: 1.65, margin: 0 }}>{desc}</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }

    // ── hotel / hotels ────────────────────────────────────────────────────────
    case "hotel":
    case "hotels": {
      const hotels = atSecArr(d, "hotels").length ? atSecArr(d, "hotels") : atSecArr(d, "items");
      const fallbackDesc = atSecStr(d, "description") || atSecStr(d, "note");
      if (!hotels.length && !fallbackDesc) return null;
      return (
        <div style={{ padding: pad }}>
          <div style={{ maxWidth: maxW, margin: isDesktop ? "0 auto" : undefined }}>
            <Div />
            <SH label={atSecStr(d, "eyebrow") || t.hotelLabel} />
            {hotels.length > 0 ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: isDesktop ? `repeat(${Math.min(hotels.length, 3)}, 1fr)` : "1fr",
                gap: 16,
              }}>
                {hotels.map((h, i) => {
                  const stars = atSecNum(h, "stars");
                  const nights = atSecStr(h, "nights");
                  const facs = atSecStrArr(h, "facilities");
                  const photo = atItemStr(h, "photo", "image");
                  return (
                    <div key={i} style={{ border: `1px solid ${AT.border}`, borderRadius: 4, overflow: "hidden" }}>
                      {photo && <img src={photo} alt={atItemStr(h, "name")} style={{ width: "100%", height: 140, objectFit: "cover" }} />}
                      <div style={{ padding: 14 }}>
                        {atItemStr(h, "location", "city") && (
                          <div style={{ fontSize: 10, color: AT.superMuted, letterSpacing: "0.8px", textTransform: "uppercase" as const, marginBottom: 3 }}>{atItemStr(h, "location", "city")}</div>
                        )}
                        <div style={{ fontFamily: AT.serif, fontSize: 15, fontWeight: 600, color: AT.ink }}>{atItemStr(h, "name")}</div>
                        {stars != null && (
                          <div style={{ color: AT.brand, fontSize: 11, marginTop: 3 }}>{"★".repeat(Math.round(Math.min(stars, 5)))}</div>
                        )}
                        {nights && <div style={{ fontSize: 11, color: AT.muted, marginTop: 4 }}>{nights} {t.nightsLabel}</div>}
                        {atItemStr(h, "note", "description") && (
                          <p style={{ fontSize: 12.5, color: AT.muted, lineHeight: 1.55, margin: "6px 0 0" }}>{atItemStr(h, "note", "description")}</p>
                        )}
                        {facs.length > 0 && (
                          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 4, marginTop: 8 }}>
                            {facs.slice(0, 4).map((f, j) => (
                              <span key={j} style={{ fontSize: 10.5, background: "rgba(13,27,46,0.05)", borderRadius: 3, padding: "2px 7px", color: AT.muted }}>{f}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ fontFamily: AT.serif, fontSize: 15, color: AT.muted, lineHeight: 1.65, margin: 0 }}>{fallbackDesc}</p>
            )}
          </div>
        </div>
      );
    }

    // ── inclusions ────────────────────────────────────────────────────────────
    case "inclusions": {
      const includes = atSecStrArr(d, "includes").length ? atSecStrArr(d, "includes") : [];
      const excludes = atSecStrArr(d, "excludes").length ? atSecStrArr(d, "excludes") : [];
      const meals = atSecStr(d, "meals");
      const visa = atSecStr(d, "visa");
      const visaDetails = atSecStr(d, "visaDetails");
      if (!includes.length && !excludes.length && !meals && !visa) return null;
      return (
        <div id="included" style={{ padding: pad, scrollMarginTop: 64 }}>
          <div style={{ maxWidth: maxW, margin: isDesktop ? "0 auto" : undefined }}>
            <Div />
            <SH label={atSecStr(d, "eyebrow") || t.whatsIncluded} />
            {(meals || visa) && (
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" as const, marginBottom: 18 }}>
                {meals && (
                  <div style={{ border: `1px solid ${AT.border}`, borderRadius: 4, padding: "8px 12px" }}>
                    <div style={{ fontSize: 9.5, letterSpacing: "1px", textTransform: "uppercase" as const, color: AT.superMuted, marginBottom: 3 }}>{t.atMealPlan}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: AT.ink }}>{MEAL_LABELS[meals]?.[lang] ?? meals}</div>
                  </div>
                )}
                {visa && (
                  <div style={{ border: `1px solid ${AT.border}`, borderRadius: 4, padding: "8px 12px" }}>
                    <div style={{ fontSize: 9.5, letterSpacing: "1px", textTransform: "uppercase" as const, color: AT.superMuted, marginBottom: 3 }}>{t.atVisa}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 600, color: AT.ink }}>{VISA_LABELS[visa]?.[lang] ?? visa}</div>
                    {visaDetails && <div style={{ fontSize: 11, color: AT.muted, marginTop: 2 }}>{visaDetails}</div>}
                  </div>
                )}
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: isDesktop && (includes.length > 0 && excludes.length > 0) ? "1fr 1fr" : "1fr", gap: 24 }}>
              {includes.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: AT.ink, marginBottom: 10, textTransform: "uppercase" as const, letterSpacing: "0.8px" }}>{t.includedLabel}</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {includes.map((item, i) => (
                      <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13.5, color: AT.muted, marginBottom: 7 }}>
                        <span style={{ color: AT.brand, fontWeight: 700, fontSize: 12, marginTop: 1, flexShrink: 0 }}>✓</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {excludes.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: AT.ink, marginBottom: 10, textTransform: "uppercase" as const, letterSpacing: "0.8px" }}>{t.notIncluded}</div>
                  <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                    {excludes.map((item, i) => (
                      <li key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontSize: 13.5, color: AT.muted, marginBottom: 7 }}>
                        <span style={{ color: AT.superMuted, fontWeight: 700, fontSize: 12, marginTop: 1, flexShrink: 0 }}>✕</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      );
    }

    // ── faq ───────────────────────────────────────────────────────────────────
    case "faq": {
      const items = atSecArr(d, "items");
      if (!items.length) return null;
      return (
        <div style={{ padding: pad }}>
          <div style={{ maxWidth: maxW, margin: isDesktop ? "0 auto" : undefined }}>
            <Div />
            <SH label={atSecStr(d, "eyebrow") || t.atFaq} />
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: "0 40px" }}>
              {items.map((item, i) => (
                <div key={i} style={{ borderTop: `1px solid ${AT.border}`, padding: "16px 0" }}>
                  <div style={{ fontFamily: AT.serif, fontSize: 15, fontWeight: 600, color: AT.ink, marginBottom: 6 }}>{atItemStr(item, "question", "q")}</div>
                  <p style={{ fontSize: 13, color: AT.muted, lineHeight: 1.65, margin: 0 }}>{atItemStr(item, "answer", "a")}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    // ── custom ────────────────────────────────────────────────────────────────
    case "custom": {
      const title = atSecStr(d, "title") || atSecStr(d, "heading");
      const body = atSecStr(d, "body") || atSecStr(d, "text") || atSecStr(d, "content");
      if (!title && !body) return null;
      return (
        <div style={{ padding: pad }}>
          <div style={{ maxWidth: maxW, margin: isDesktop ? "0 auto" : undefined }}>
            <Div />
            {title && <div style={{ fontFamily: AT.serif, fontSize: isDesktop ? 28 : 22, fontWeight: 400, color: AT.ink, marginBottom: 12 }}>{title}</div>}
            {body && <p style={{ fontFamily: AT.serif, fontSize: 15, color: AT.muted, lineHeight: 1.75, margin: 0 }}>{body}</p>}
          </div>
        </div>
      );
    }

    // ── extras ────────────────────────────────────────────────────────────────
    case "extras": {
      const items = atSecArr(d, "items").length ? atSecArr(d, "items") : atSecArr(d, "extras");
      if (!items.length) return null;
      return (
        <div style={{ padding: pad }}>
          <div style={{ maxWidth: maxW, margin: isDesktop ? "0 auto" : undefined }}>
            <Div />
            <SH label={atSecStr(d, "eyebrow") || t.atOptionalExtras} />
            <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: 1 }}>
              {items.map((e, i) => {
                const name = atItemStr(e, "label", "name");
                const desc = atItemStr(e, "desc", "description");
                const price = atItemStr(e, "price");
                return (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "14px 0", borderTop: `1px solid ${AT.border}`, gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: AT.ink }}>{name}</div>
                      {desc && <p style={{ fontSize: 12, color: AT.muted, margin: "4px 0 0", lineHeight: 1.5 }}>{desc}</p>}
                    </div>
                    {price && <div style={{ fontSize: 13, fontWeight: 700, color: AT.brand, flexShrink: 0 }}>{price}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // ── people ────────────────────────────────────────────────────────────────
    case "people": {
      const items = atSecArr(d, "people").length ? atSecArr(d, "people") : atSecArr(d, "items");
      if (!items.length) return null;
      return (
        <div style={{ padding: pad }}>
          <div style={{ maxWidth: maxW, margin: isDesktop ? "0 auto" : undefined }}>
            <Div />
            <SH label={atSecStr(d, "eyebrow") || t.atYourTeam} />
            <div style={{
              display: "grid",
              gridTemplateColumns: isDesktop ? `repeat(${Math.min(items.length, 4)}, 1fr)` : "1fr 1fr",
              gap: 20,
            }}>
              {items.map((p, i) => {
                const photo = atItemStr(p, "photo", "avatar");
                const name = atItemStr(p, "name");
                const role = atItemStr(p, "role");
                const bio = atItemStr(p, "bio");
                const years = atSecNum(p as AtSD, "years");
                return (
                  <div key={i}>
                    {photo ? (
                      <img src={photo} alt={name} style={{ width: "100%", aspectRatio: "1" as React.CSSProperties["aspectRatio"], objectFit: "cover", borderRadius: 4, marginBottom: 10 }} />
                    ) : (
                      <div style={{ width: "100%", aspectRatio: "1" as React.CSSProperties["aspectRatio"], background: "rgba(13,27,46,0.06)", borderRadius: 4, marginBottom: 10 }} />
                    )}
                    <div style={{ fontFamily: AT.serif, fontSize: 15, fontWeight: 600, color: AT.ink }}>{name}</div>
                    {role && <div style={{ fontSize: 11, color: AT.superMuted, marginTop: 2, textTransform: "capitalize" as const }}>{role}</div>}
                    {years != null && <div style={{ fontSize: 11, color: AT.superMuted, marginTop: 1 }}>{years} {t.atYrsExp}</div>}
                    {bio && <p style={{ fontSize: 12.5, color: AT.muted, lineHeight: 1.55, margin: "6px 0 0" }}>{bio}</p>}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // ── important_notes ───────────────────────────────────────────────────────
    case "important_notes": {
      const items = atArrMixed(d, "items");
      const body = atSecStr(d, "body") || atSecStr(d, "text");
      if (!items.length && !body) return null;
      return (
        <div style={{ padding: pad }}>
          <div style={{ maxWidth: maxW, margin: isDesktop ? "0 auto" : undefined }}>
            <Div />
            <SH label={atSecStr(d, "eyebrow") || t.atImportantNotesLabel} />
            {body && <p style={{ fontSize: 13.5, color: AT.muted, lineHeight: 1.7, margin: "0 0 12px" }}>{body}</p>}
            {items.length > 0 && (
              <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {items.map((item, i) => (
                  <li key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: AT.muted, marginBottom: 8, lineHeight: 1.6 }}>
                    <span style={{ flexShrink: 0, width: 4, height: 4, borderRadius: "50%", background: AT.superMuted, display: "inline-block", marginTop: 7 }} />
                    <span>{typeof item === "string" ? item : atItemStr(item, "text", "note", "body")}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      );
    }

    // ── about_agency ──────────────────────────────────────────────────────────
    case "about_agency": {
      const body = atSecStr(d, "body") || atSecStr(d, "about") || atSecStr(d, "description");
      const title = atSecStr(d, "title") || atSecStr(d, "heading");
      if (!body && !title) return null;
      return (
        <div style={{ padding: pad }}>
          <div style={{ maxWidth: maxW, margin: isDesktop ? "0 auto" : undefined }}>
            <Div />
            <SH label={atSecStr(d, "eyebrow") || `${t.atAboutAgencyPrefix} ${agency.name}`} />
            {title && (
              <div style={{ fontFamily: AT.serif, fontSize: isDesktop ? 26 : 20, fontWeight: 400, color: AT.ink, marginBottom: 10 }}>{title}</div>
            )}
            {body && <p style={{ fontFamily: AT.serif, fontSize: 15, color: AT.muted, lineHeight: 1.75, margin: 0 }}>{body}</p>}
          </div>
        </div>
      );
    }

    // ── departures / departure_dates ──────────────────────────────────────────
    case "departures":
    case "departure_dates": {
      const items = atSecArr(d, "departures").length ? atSecArr(d, "departures") : atSecArr(d, "items");
      if (!items.length) return null;
      return (
        <div id="pricing" style={{ padding: pad, scrollMarginTop: 64 }}>
          <div style={{ maxWidth: maxW, margin: isDesktop ? "0 auto" : undefined }}>
            <Div />
            <SH label={atSecStr(d, "eyebrow") || t.departures} />
            <div style={{
              display: "grid",
              gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "1fr 1fr",
              gap: 8,
            }}>
              {items.map((dep, i) => {
                const date = atItemStr(dep, "date");
                const spots = atSecNum(dep as AtSD, "spots");
                const price = atItemStr(dep, "price");
                return (
                  <div key={i} style={{ border: `1px solid ${AT.border}`, borderRadius: 4, padding: "10px 12px" }}>
                    <div style={{ fontFamily: AT.serif, fontSize: 14, fontWeight: 600, color: AT.ink }}>{date}</div>
                    {price && <div style={{ fontSize: 13, color: AT.brand, fontWeight: 700, marginTop: 3 }}>{price}</div>}
                    {spots != null && (
                      <div style={{ fontSize: 11, color: spots <= 3 ? "#c0392b" : AT.superMuted, marginTop: 3 }}>
                        {spots} {spots === 1 ? "spot" : "spots"} left
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // ── pricing ───────────────────────────────────────────────────────────────
    case "pricing": {
      const tiers = atSecArr(d, "tiers").length ? atSecArr(d, "tiers") : atSecArr(d, "items");
      const cancellation = atSecStr(d, "cancellation");
      if (!tiers.length) return null;
      return (
        <div id="pricing" style={{ padding: pad, scrollMarginTop: 64 }}>
          <div style={{ maxWidth: maxW, margin: isDesktop ? "0 auto" : undefined }}>
            <Div />
            <SH label={atSecStr(d, "eyebrow") || t.chooseOption} />
            <div style={{
              display: "grid",
              gridTemplateColumns: isDesktop ? `repeat(${Math.min(tiers.length, 3)}, 1fr)` : "1fr",
              gap: 12,
            }}>
              {tiers.map((tier, i) => {
                const pop = (tier as AtSD).pop === true;
                const label = localizeTierLabel(atItemStr(tier, "label"), lang);
                const price = atItemStr(tier, "price");
                const was = atItemStr(tier, "was");
                const perks = atSecStrArr(tier as AtSD, "perks");
                return (
                  <div key={i} style={{
                    border: `1px solid ${pop ? AT.brand : AT.border}`,
                    borderRadius: 4,
                    padding: "18px 16px",
                    background: pop ? AT.brand : "transparent",
                  }}>
                    {pop && (
                      <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: "rgba(245,243,238,0.6)", marginBottom: 8 }}>
                        {t.mostPopular}
                      </div>
                    )}
                    <div style={{ fontSize: 12, color: pop ? "rgba(245,243,238,0.7)" : AT.superMuted, marginBottom: 4 }}>{label}</div>
                    {was && (
                      <div style={{ fontSize: 13, color: pop ? "rgba(245,243,238,0.5)" : AT.superMuted, textDecoration: "line-through", marginBottom: 2 }}>{was}</div>
                    )}
                    <div style={{ fontFamily: AT.serif, fontSize: 30, fontWeight: 400, color: pop ? AT.bg : AT.ink, letterSpacing: "-0.5px", lineHeight: 1 }}>{price}</div>
                    <div style={{ fontSize: 11, color: pop ? "rgba(245,243,238,0.55)" : AT.superMuted, marginTop: 3 }}>{t.perPerson}</div>
                    {perks.length > 0 && (
                      <ul style={{ margin: "12px 0 0", padding: 0, listStyle: "none" }}>
                        {perks.map((perk, j) => (
                          <li key={j} style={{ display: "flex", gap: 6, fontSize: 12.5, color: pop ? "rgba(245,243,238,0.8)" : AT.muted, marginBottom: 5 }}>
                            <span style={{ flexShrink: 0, color: pop ? "rgba(245,243,238,0.7)" : AT.brand }}>✓</span>
                            {perk}
                          </li>
                        ))}
                      </ul>
                    )}
                    <button onClick={onWhatsApp} style={{
                      marginTop: 14, width: "100%", padding: "10px 0", fontSize: 12.5,
                      fontWeight: 700, border: `1px solid ${pop ? "rgba(245,243,238,0.35)" : AT.border}`,
                      background: "transparent", color: pop ? AT.bg : AT.ink,
                      borderRadius: 3, cursor: "pointer",
                    }}>
                      {t.enquire} →
                    </button>
                  </div>
                );
              })}
            </div>
            {cancellation && (
              <p style={{ fontSize: 12, color: AT.superMuted, marginTop: 14, fontStyle: "italic" }}>{cancellation}</p>
            )}
          </div>
        </div>
      );
    }

    // ── transfers ─────────────────────────────────────────────────────────────
    case "transfers": {
      const items = atArrMixed(d, "items");
      const desc = atSecStr(d, "description");
      if (!items.length && !desc) return null;
      return (
        <div style={{ padding: pad }}>
          <div style={{ maxWidth: maxW, margin: isDesktop ? "0 auto" : undefined }}>
            <Div />
            <SH label={atSecStr(d, "eyebrow") || t.atTransfers} />
            {desc && !items.length && <p style={{ fontSize: 13.5, color: AT.muted, lineHeight: 1.7, margin: 0 }}>{desc}</p>}
            {items.length > 0 && (
              <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
                {items.map((t2, i) => {
                  const leg = atItemStr(t2, "leg", "from", "title") || (typeof t2 === "string" ? t2 : "");
                  const mode = typeof t2 === "object" ? atSecStr(t2 as AtSD, "mode") : "";
                  const duration = typeof t2 === "object" ? atSecStr(t2 as AtSD, "duration") : "";
                  const note = typeof t2 === "object" ? atSecStr(t2 as AtSD, "note") : "";
                  const included = typeof t2 === "object" ? (t2 as AtSD).included !== false : true;
                  const meta = [mode, duration].filter(Boolean).join(" · ");
                  return (
                    <li key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", borderTop: `1px solid ${AT.border}`, padding: "12px 0" }}>
                      <div style={{ fontFamily: AT.serif, fontSize: 18, color: AT.superMuted, flexShrink: 0, lineHeight: 1, paddingTop: 2 }}>{String(i + 1).padStart(2, "0")}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600, color: AT.ink }}>{leg}</div>
                        {meta && <div style={{ fontSize: 11.5, color: AT.muted, marginTop: 3 }}>{meta}</div>}
                        {note && <p style={{ fontSize: 12, color: AT.muted, margin: "4px 0 0", lineHeight: 1.55 }}>{note}</p>}
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, letterSpacing: "0.8px",
                        textTransform: "uppercase" as const,
                        border: `1px solid ${AT.border}`, borderRadius: 3,
                        padding: "3px 7px", color: AT.superMuted, flexShrink: 0,
                      }}>
                        {included ? t.atIncludedLabel : t.atAddOn}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </div>
      );
    }

    // ── media ─────────────────────────────────────────────────────────────────
    case "media": {
      const videoUrl = atSecStr(d, "videoUrl") || atSecStr(d, "video");
      const videoPoster = atSecStr(d, "videoPoster") || atSecStr(d, "poster");
      const mapSrc = atSecStr(d, "mapImage") || atSecStr(d, "map");
      const mapCaption = atSecStr(d, "mapCaption");
      const photos = atSecStrArr(d, "images");
      const hasVideo = !!(videoUrl || videoPoster);
      const hasMap = !!mapSrc;
      const hasPhotos = photos.length > 0;
      if (!hasVideo && !hasMap && !hasPhotos) return null;
      const isEmbed = videoUrl && (videoUrl.includes("youtube") || videoUrl.includes("youtu.be") || videoUrl.includes("vimeo"));
      const atToEmbed = (u: string) => {
        const yt = u.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
        if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
        const vi = u.match(/vimeo\.com\/(\d+)/);
        if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
        return u;
      };
      return (
        <div style={{ padding: pad }}>
          <div style={{ maxWidth: maxW, margin: isDesktop ? "0 auto" : undefined }}>
            <Div />
            <SH label={atSecStr(d, "eyebrow") || t.gallery} />
            {hasPhotos && (
              <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "1fr 1fr", gap: 8, marginBottom: (hasVideo || hasMap) ? 16 : 0 }}>
                {photos.slice(0, 6).map((src, i) => (
                  <img key={i} src={src} alt="" style={{ width: "100%", aspectRatio: "4/3" as React.CSSProperties["aspectRatio"], objectFit: "cover", borderRadius: 3 }} onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
                ))}
              </div>
            )}
            {(hasVideo || hasMap) && (
              <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "1fr 1fr" : "1fr", gap: 12 }}>
                {hasVideo && videoUrl && (
                  <div style={{ position: "relative", borderRadius: 4, overflow: "hidden", height: 220 }}>
                    {isEmbed
                      ? <iframe src={atToEmbed(videoUrl)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
                      : <video src={videoUrl} controls playsInline poster={videoPoster || undefined} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                    }
                  </div>
                )}
                {hasMap && (
                  <div style={{ position: "relative", borderRadius: 4, overflow: "hidden" }}>
                    <img src={mapSrc} alt="map" style={{ width: "100%", height: 220, objectFit: "cover" }} />
                    {mapCaption && (
                      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "8px 10px", background: "rgba(13,27,46,0.55)", fontSize: 11, color: "rgba(245,243,238,0.9)", fontStyle: "italic" }}>
                        {mapCaption}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      );
    }

    // ── reviews (handled by AtReviews, skip here) ─────────────────────────────
    case "reviews":
      return null;

    default:
      return null;
  }
}

// ─── AtSections wrapper ───────────────────────────────────────────────────────

function AtSections({
  pkg, isDesktop, onWhatsApp, lang, agency,
}: {
  pkg: TPageProps["pkg"];
  isDesktop: boolean;
  onWhatsApp: () => void;
  lang: TPageProps["lang"];
  agency: TPageProps["agency"];
}) {
  if (!pkg.sections?.length) return null;
  const sorted = [...pkg.sections].sort((a, b) => a.order - b.order);
  return (
    <>
      {sorted.map((s) => (
        <AtSection
          key={s.id}
          s={s as { id: string; type: string; order: number; data: Record<string, unknown> }}
          isDesktop={isDesktop}
          onWhatsApp={onWhatsApp}
          lang={lang}
          agency={agency}
        />
      ))}
    </>
  );
}

// ─── AtReviews ────────────────────────────────────────────────────────────────

function AtReviews({
  pkg, agency, isDesktop, lang,
}: {
  pkg: TPageProps["pkg"];
  agency: TPageProps["agency"];
  isDesktop: boolean;
  lang: TPageProps["lang"];
}) {
  const t = T[lang];
  const reviews = pkg.reviews ?? [];
  const canSubmit = agency.enableReviews !== false;
  const showList = agency.showReviews !== false && reviews.length > 0;
  if (!showList && !canSubmit) return null;

  const [name, setName]     = React.useState("");
  const [text, setText]     = React.useState("");
  const [rating, setRating] = React.useState(0);
  const [hover, setHover]   = React.useState(0);
  const [status, setStatus] = React.useState<"idle" | "sending" | "ok" | "err">("idle");

  const handleSubmit = async () => {
    if (!name.trim() || !text.trim() || !rating || !pkg.id) return;
    setStatus("sending");
    try {
      const res = await fetch("/api/submit-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id, name: name.trim(), text: text.trim(), rating }),
      });
      setStatus(res.ok ? "ok" : "err");
    } catch {
      setStatus("err");
    }
  };

  const pad = isDesktop ? "0 80px 48px" : "22px 22px 0";
  const avgRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

  return (
    <div style={{ padding: pad }}>
      <div style={{ maxWidth: isDesktop ? 1080 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
        <div style={{ height: 1, background: AT.border, margin: "0 0 24px" }} />
        {showList && (
          <>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
              <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: AT.superMuted }}>
                {reviews.length} {t.verifiedGuestsAvg}
              </div>
              {avgRating > 0 && (
                <div style={{ display: "flex", gap: 2 }}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <span key={n} style={{ color: n <= Math.round(avgRating) ? AT.brand : "rgba(13,27,46,0.15)", fontSize: 13 }}>★</span>
                  ))}
                </div>
              )}
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: isDesktop ? "repeat(2, 1fr)" : "1fr",
              gap: 10,
              marginBottom: canSubmit ? 24 : 0,
            }}>
              {reviews.map((r, i) => (
                <div key={i} style={{ border: `1px solid ${AT.border}`, borderRadius: 4, padding: "14px 16px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: AT.ink }}>{r.name}</div>
                      {r.country && <div style={{ fontSize: 10.5, color: AT.superMuted, marginTop: 2 }}>{r.country}</div>}
                    </div>
                    <div style={{ display: "flex", gap: 1 }}>
                      {[1, 2, 3, 4, 5].map((n) => (
                        <span key={n} style={{ color: n <= r.rating ? AT.brand : "rgba(13,27,46,0.15)", fontSize: 12 }}>★</span>
                      ))}
                    </div>
                  </div>
                  <p style={{ fontSize: 13, color: AT.muted, lineHeight: 1.65, margin: 0 }}>{r.text}</p>
                </div>
              ))}
            </div>
          </>
        )}
        {canSubmit && status !== "ok" && (
          <div style={{ border: `1px solid ${AT.border}`, borderRadius: 4, padding: isDesktop ? "24px 28px" : "18px" }}>
            <div style={{ fontFamily: AT.serif, fontSize: 17, fontWeight: 400, color: AT.ink, marginBottom: 14 }}>{t.writeReviewTitle}</div>
            <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  onClick={() => setRating(n)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 2, fontSize: 22, color: n <= (hover || rating) ? AT.brand : "rgba(13,27,46,0.15)", lineHeight: 1 }}
                >
                  ★
                </button>
              ))}
            </div>
            <input
              placeholder={t.reviewYourName}
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={{
                width: "100%", border: `1px solid ${AT.border}`, borderRadius: 3,
                padding: "10px 12px", fontSize: 13, fontFamily: AT.sans,
                background: "transparent", color: AT.ink, marginBottom: 8,
                boxSizing: "border-box" as const,
              }}
            />
            <textarea
              placeholder={t.reviewPlaceholder}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              style={{
                width: "100%", border: `1px solid ${AT.border}`, borderRadius: 3,
                padding: "10px 12px", fontSize: 13, fontFamily: AT.sans,
                background: "transparent", color: AT.ink, marginBottom: 14,
                resize: "none" as const, boxSizing: "border-box" as const,
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={status === "sending"}
              style={{
                background: AT.brand, color: AT.bg, border: "none", borderRadius: 3,
                padding: "10px 22px", fontSize: 13, fontWeight: 700,
                fontFamily: AT.sans, cursor: "pointer",
              }}
            >
              {status === "sending" ? t.atSending : t.submitReviewBtn}
            </button>
            {status === "err" && (
              <div style={{ fontSize: 12, color: "#c0392b", marginTop: 8 }}>{t.atSomethingWrong}</div>
            )}
          </div>
        )}
        {status === "ok" && (
          <div style={{ background: `rgba(42,42,42,0.06)`, border: `1px solid rgba(42,42,42,0.18)`, borderRadius: 4, padding: "14px 18px", fontSize: 13, color: AT.ink, fontWeight: 600 }}>
            {t.reviewSubmitSuccess}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── AtCTABanner ─────────────────────────────────────────────────────────────

function AtCTABanner({
  pkg, agency, isDesktop, onWhatsApp, onMessenger, lang,
}: {
  pkg: TPageProps["pkg"];
  agency: TPageProps["agency"];
  isDesktop: boolean;
  onWhatsApp: () => void;
  onMessenger: () => void;
  lang: TPageProps["lang"];
}) {
  const t = T[lang];
  const nights = pkg.nights ? Number(pkg.nights) : null;
  const pad = isDesktop ? "48px 80px 64px" : "28px 22px";
  return (
    <div style={{ padding: pad, background: AT.ink, color: AT.bg }}>
      <div style={{
        maxWidth: isDesktop ? 1080 : undefined,
        margin: isDesktop ? "0 auto" : undefined,
        display: "flex",
        flexDirection: isDesktop ? "row" as const : "column" as const,
        justifyContent: "space-between",
        alignItems: isDesktop ? "center" : "flex-start",
        gap: 24,
      }}>
        <div>
          <div style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase" as const, color: "rgba(245,243,238,0.45)", marginBottom: 10 }}>
            {t.readyToExplore}
          </div>
          <div style={{ fontFamily: AT.serif, fontSize: isDesktop ? 52 : 36, fontWeight: 400, letterSpacing: "-1px", lineHeight: 1, color: AT.bg }}>{pkg.price}</div>
          <div style={{ fontSize: 12, color: "rgba(245,243,238,0.5)", marginTop: 6 }}>
            {nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.perPerson}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" as const }}>
          <WAButton label={t.enquire} size="lg" onClick={onWhatsApp} />
          {pkg.messenger && (
            <button
              onClick={onMessenger}
              style={{ background: "rgba(245,243,238,0.1)", color: AT.bg, border: `1px solid rgba(245,243,238,0.18)`, borderRadius: 6, padding: "14px 22px", fontSize: 14, fontWeight: 700, fontFamily: AT.sans, cursor: "pointer" }}
            >
              {t.messageMessenger}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AtMobileFooter ───────────────────────────────────────────────────────────

function AtMobileFooter({ agency }: { agency: TPageProps["agency"] }) {
  return (
    <div style={{ padding: "24px 22px", background: AT.ink, textAlign: "center" as const }}>
      {agency.logoUrl && (
        <img src={agency.logoUrl} alt={agency.name} style={{ height: 28, objectFit: "contain", display: "block", margin: "0 auto 10px", filter: "brightness(0) invert(1)" }} />
      )}
      <div style={{ fontSize: 13.5, fontWeight: 700, color: AT.bg, letterSpacing: "0.2px" }}>{agency.name}</div>
      {agency.tagline && <div style={{ fontSize: 11.5, color: "rgba(245,243,238,0.45)", marginTop: 4 }}>{agency.tagline}</div>}
      <div style={{ fontSize: 10.5, color: "rgba(245,243,238,0.25)", marginTop: 14 }}>Powered by PackMetrix</div>
    </div>
  );
}

// ─── TemplateAtlasPage ───────────────────────────────────────────────────────

export function TemplateAtlasPage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const nights = pkg.nights ? Number(pkg.nights) : null;
  const coverImage = pkg.coverImage || "";
  const title = pkg.title || pkg.destination;
  const isRtl = lang === "ar";
  const galleryImages = [pkg.coverImage, ...(pkg.images || [])].filter(Boolean) as string[];
  const isDesktop = useIsDesktop();

  const navLinks = [
    ...((pkg.itinerary || []).some(it => it.title?.trim()) || pkg.sections?.some(s => s.type === "itinerary") ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...(pkg.sections?.some(s => s.type === "inclusions") || (pkg.includes?.length || (pkg.advantages || []).length || pkg.excludes?.length) ? [{ label: t.navIncluded, href: "#included" }] : []),
    ...(pkg.sections?.some(s => s.type === "pricing") || (pkg.pricingTiers || []).some(tier => tier.price) ? [{ label: t.navPricing, href: "#pricing" }] : []),
  ];

  // Current month + year for masthead
  const now = new Date();
  const monthYear = now.toLocaleString(lang === "ar" ? "ar-EG" : "en-GB", { month: "long", year: "numeric" });

  // Photo essay images (not coverImage)
  const extraImages = (pkg.images || []).filter(Boolean);
  const desc = pkg.description || "";

  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: AT.bg, color: AT.ink, fontFamily: AT.sans, direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={AT.brand} navLinks={navLinks} lang={lang} onWhatsApp={onWhatsApp} />

        {/* Centered masthead */}
        <DContainer style={{ padding: "56px 80px 32px", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 14, fontSize: 11, color: AT.superMuted, textTransform: "uppercase", letterSpacing: "2px", fontWeight: 700 }}>
            <span>{t.editorialCurated}</span>
            <span style={{ width: 1, height: 10, background: AT.border }} />
            <span>{pkg.destination}</span>
          </div>
          <h1 style={{ fontFamily: AT.serif, fontSize: 88, fontWeight: 400, lineHeight: 0.98, letterSpacing: "-2.5px", marginTop: 28, maxWidth: 900, margin: "28px auto 0" }}>
            {title}
          </h1>
          <div style={{ fontSize: 14, color: AT.superMuted, marginTop: 24, fontStyle: "italic", fontFamily: AT.serif }}>
            {nights ? `${nights} ${t.editorialDaysCurated}` : t.editorialCuratedJourney} · {agency.name}
          </div>
        </DContainer>

        {/* Wide hero */}
        <DContainer style={{ padding: "16px 80px 8px" }}>
          <div style={{ position: "relative", height: 540, overflow: "hidden", borderRadius: 4 }}>
            {coverImage
              ? <img src={coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
              : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${AT.brand}cc, ${AT.brand}55)` }} />
            }
          </div>
          <div style={{ fontSize: 11, color: AT.superMuted, fontStyle: "italic", marginTop: 10, fontFamily: AT.serif, textAlign: "center" }}>
            {pkg.destination} · {agency.name}
          </div>
        </DContainer>

        {/* Two-column body text */}
        <DContainer max={1080} style={{ padding: "56px 80px 32px" }}>
          <div style={{ columns: 2, columnGap: 48 }}>
            <p style={{ fontFamily: AT.serif, fontSize: 18, lineHeight: 1.55, margin: "0 0 16px" }}>
              {pkg.description || ""}
            </p>
            <p style={{ fontFamily: AT.serif, fontSize: 18, lineHeight: 1.55, margin: "0 0 16px" }}>
              {t.atlasEditorialBody}
            </p>
          </div>
        </DContainer>

        {/* Photo essay 3-col */}
        {galleryImages.length > 1 && (
          <DContainer style={{ padding: "40px 80px 32px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
              {galleryImages.slice(0, 3).map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: "100%", aspectRatio: "3/4" as React.CSSProperties["aspectRatio"], objectFit: "cover", borderRadius: 4 }} />
              ))}
            </div>
          </DContainer>
        )}

        {/* Booking line */}
        <DContainer max={780} style={{ padding: "32px 80px" }}>
          <div style={{ borderTop: `1px solid ${AT.border}`, paddingTop: 32, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 10.5, color: AT.superMuted, letterSpacing: "1.4px", textTransform: "uppercase" }}>{t.from}</div>
              <div style={{ fontFamily: AT.serif, fontSize: 48, fontWeight: 400, marginTop: 4, letterSpacing: "-1px", lineHeight: 1 }}>{pkg.price}</div>
              <div style={{ fontSize: 12, color: AT.superMuted, marginTop: 6 }}>{nights ? `${nights} ${t.nightsLabel} · ${t.perPerson}` : t.perPerson}</div>
            </div>
            <WAButton label={t.enquire} size="lg" onClick={onWhatsApp} />
          </div>
        </DContainer>

        <AtSections pkg={pkg} isDesktop={true} onWhatsApp={onWhatsApp} lang={lang} agency={agency} />
        <AtReviews pkg={pkg} agency={agency} isDesktop={true} lang={lang} />
        <AtCTABanner pkg={pkg} agency={agency} isDesktop={true} onWhatsApp={onWhatsApp} onMessenger={onMessenger} lang={lang} />

        <DesktopFooter agency={agency} brand={AT.brand} />
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: AT.bg, color: AT.ink,
      fontFamily: AT.sans, direction: isRtl ? "rtl" : "ltr",
    }}>
      <AgencyBar agency={agency} price={pkg.price} brand={AT.brand} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} />

      {/* Magazine masthead */}
      <div style={{ padding: "18px 22px 0", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <span style={{ fontSize: 10, color: AT.superMuted, textTransform: "uppercase", letterSpacing: "1.4px", fontWeight: 600 }}>{t.atlasIssueNo}</span>
        <span style={{ width: 1, height: 10, background: AT.border, display: "inline-block" }} />
        <span style={{ fontSize: 10, color: AT.superMuted, textTransform: "uppercase", letterSpacing: "1.4px", fontWeight: 600 }}>{monthYear}</span>
        <span style={{ width: 1, height: 10, background: AT.border, display: "inline-block" }} />
        <span style={{ fontSize: 10, color: AT.superMuted, textTransform: "uppercase", letterSpacing: "1.4px", fontWeight: 600 }}>{pkg.destination}</span>
      </div>

      {/* Large serif title */}
      <div style={{ padding: "16px 22px 0" }}>
        <h1 style={{
          fontFamily: AT.serif, fontSize: 44, fontWeight: 400, letterSpacing: "-1px",
          lineHeight: 1.1, color: AT.ink, margin: "0 0 10px",
        }}>
          {title}
        </h1>
        <p style={{ fontSize: 13, fontStyle: "italic", color: AT.muted, margin: 0 }}>
          {agency.tagline ? agency.tagline : `${t.curatedByPrefix} ${agency.name}`}
        </p>
      </div>

      {/* Hero image */}
      <div style={{ padding: "20px 22px 0" }}>
        {coverImage ? (
          <img src={coverImage} alt={pkg.destination} style={{ width: "100%", height: 340, objectFit: "cover", display: "block", borderRadius: 4 }} />
        ) : (
          <div style={{ width: "100%", height: 340, background: `linear-gradient(135deg, ${AT.brand}44, ${AT.brand}22)`, borderRadius: 4 }} />
        )}
        <div style={{ marginTop: 8, fontSize: 11, fontStyle: "italic", color: AT.superMuted }}>
          {t.curatedJourneyCaption} · {pkg.destination}
        </div>
      </div>

      {/* Description */}
      {desc && (
        <div style={{ padding: "22px 22px 0" }}>
          <p style={{ fontSize: 15, lineHeight: 1.75, color: AT.muted, margin: 0 }}>
            {desc}
          </p>
        </div>
      )}

      {/* Photo essay */}
      {extraImages.length > 0 && (
        <div style={{ padding: "22px 22px 0" }}>
          {extraImages.length === 1 ? (
            <img src={extraImages[0]} alt="" style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 4 }} />
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {extraImages.slice(0, 2).map((url, i) => (
                <img key={i} src={url} alt="" style={{ width: "100%", height: 200, objectFit: "cover", borderRadius: 4 }} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking line */}
      <div style={{ padding: "22px 22px 0" }}>
        <div style={{ height: 1, background: AT.border, marginBottom: 18 }} />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: AT.superMuted, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 4 }}>{t.from}</div>
            <div style={{ fontFamily: AT.serif, fontSize: 34, fontWeight: 400, color: AT.brand, letterSpacing: "-1px", lineHeight: 1 }}>{pkg.price}</div>
            <div style={{ fontSize: 11, color: AT.superMuted, marginTop: 3 }}>
              {nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.perPerson}
            </div>
          </div>
          <WAButton label={t.enquire} size="md" onClick={onWhatsApp} />
        </div>
      </div>

      <AtSections pkg={pkg} isDesktop={false} onWhatsApp={onWhatsApp} lang={lang} agency={agency} />
      <AtReviews pkg={pkg} agency={agency} isDesktop={false} lang={lang} />

      <AtCTABanner pkg={pkg} agency={agency} isDesktop={false} onWhatsApp={onWhatsApp} onMessenger={onMessenger} lang={lang} />
      <AtMobileFooter agency={agency} />

      <StickyCTA price={pkg.price} nights={nights} label={t.enquire} onWhatsApp={onWhatsApp} lang={lang} />
    </div>
  );
}

// ─── TemplateAtlasCard ───────────────────────────────────────────────────────

export function TemplateAtlasCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete} onToggleActive={onToggleActive} onDuplicate={onDuplicate}
      headingFont="var(--font-cormorant, var(--font-dm-serif), serif)"
      imageBorderRadius={4}
      cardBg="#f5f3ee"
    />
  );
}
