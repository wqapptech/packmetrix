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
} from "./shared";
import type { TPageProps, TCardProps, TPackage, TAgency, Lang } from "./types";

// ─── Design tokens ────────────────────────────────────────────────────────────

const FA = {
  brand:      "#c46a2f",
  bg:         "#fefaf2",
  ink:        "#0d1b2e",
  muted:      "rgba(13,27,46,0.55)",
  superMuted: "rgba(13,27,46,0.35)",
  border:     "rgba(13,27,46,0.08)",
  serif:      "var(--font-dm-sans, sans-serif)",
} as const;

// ─── Section data helpers ─────────────────────────────────────────────────────

type FaSD = Record<string, unknown>;

function faFindSec(pkg: TPackage, type: string): FaSD | undefined {
  return pkg.sections?.find((s) => s.type === type)?.data as FaSD | undefined;
}

function faSecArr(data: FaSD | undefined, key: string): FaSD[] {
  if (!data) return [];
  const v = data[key];
  if (!Array.isArray(v)) return [];
  return v.filter((item): item is FaSD => item != null && typeof item === "object");
}

function faSecStr(data: FaSD | undefined, key: string): string {
  if (!data) return "";
  const v = data[key];
  return typeof v === "string" ? v : "";
}

function faSecNum(data: FaSD | undefined, key: string): number | undefined {
  if (!data) return undefined;
  const v = data[key];
  return typeof v === "number" ? v : undefined;
}

function faSecStrArr(data: FaSD | undefined, key: string): string[] {
  if (!data) return [];
  const v = data[key];
  if (!Array.isArray(v)) return [];
  return v.filter((item): item is string => typeof item === "string");
}

function faItemStr(item: FaSD | string, ...keys: string[]): string {
  if (typeof item === "string") return item;
  for (const k of keys) {
    const v = (item as FaSD)[k];
    if (typeof v === "string" && v) return v;
  }
  return "";
}

// Like faSecArr but also includes plain-string elements
function faSecArrMixed(data: FaSD | undefined, key: string): Array<FaSD | string> {
  if (!data) return [];
  const v = data[key];
  if (!Array.isArray(v)) return [];
  return v.filter((item) => item != null) as Array<FaSD | string>;
}

// ─── Meal / visa labels ───────────────────────────────────────────────────────

const FA_MEAL_LABELS: Record<string, { en: string; ar: string }> = {
  none:          { en: "Meals not included",              ar: "لا تشمل الوجبات" },
  breakfast:     { en: "Breakfast included",              ar: "الإفطار مشمول" },
  half_board:    { en: "Half board · breakfast + dinner", ar: "نصف إقامة · إفطار وعشاء" },
  full_board:    { en: "Full board · all meals",          ar: "إقامة كاملة" },
  all_inclusive: { en: "All-inclusive · meals + drinks",  ar: "شامل كل شيء" },
};

const FA_VISA_LABELS: Record<string, { en: string; ar: string }> = {
  free:       { en: "Visa-free / on arrival",    ar: "بدون تأشيرة / عند الوصول" },
  included:   { en: "Visa included by agency",   ar: "تأشيرة مشمولة في السعر" },
  assistance: { en: "Visa support provided",     ar: "دعم في استخراج التأشيرة" },
  required:   { en: "Visa required · we assist", ar: "تأشيرة مطلوبة · نساعدك" },
};

// ─── Inline SVG icons ─────────────────────────────────────────────────────────

function FaCheckIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={FA.brand} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function FaXIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function FaStars({ value, size = 12 }: { value: number; size?: number }) {
  return (
    <span style={{ display: "inline-flex", gap: 2, color: FA.brand, fontSize: size, lineHeight: 1 }}>
      {"★★★★★".split("").map((s, i) => (
        <span key={i} style={{ opacity: i < Math.round(value) ? 1 : 0.25 }}>{s}</span>
      ))}
    </span>
  );
}

// ─── Section header helper ────────────────────────────────────────────────────

function FaSectionHead({ kicker, title, sub }: { kicker?: string; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      {kicker && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 10, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: FA.brand, marginBottom: 8 }}>
          <span style={{ width: 14, height: 1.5, background: FA.brand, display: "inline-block", borderRadius: 1 }} />
          {kicker}
        </div>
      )}
      <h2 style={{ fontSize: 22, fontWeight: 800, color: FA.ink, letterSpacing: "-0.4px", lineHeight: 1.2, margin: 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: 13.5, color: FA.muted, marginTop: 6, lineHeight: 1.6 }}>{sub}</p>}
    </div>
  );
}

// ─── Individual section renderers ─────────────────────────────────────────────

function FaItinerary({ pkg, lang }: { pkg: TPackage; lang: Lang }) {
  const t = T[lang];
  const data = faFindSec(pkg, "itinerary");
  const rawDays = faSecArr(data, "days");
  // fall back to legacy pkg.itinerary
  const days = rawDays.length
    ? rawDays
    : (pkg.itinerary ?? []).filter((d) => d.title?.trim()).map((d) => ({ ...d } as FaSD));
  if (!days.length) return null;
  return (
    <section id="itinerary" style={{ padding: "20px 18px", scrollMarginTop: 88 }} data-pmx-section="itinerary">
      <FaSectionHead kicker={t.familyTypicalDay} title={t.familyEasyMornings} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {days.map((day, i) => {
          const dayNum = faSecNum(day as FaSD, "day") ?? (i + 1);
          const title = faSecStr(day as FaSD, "title");
          const desc = faSecStr(day as FaSD, "desc");
          return (
            <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", background: "#fff", border: `1px solid ${FA.border}`, borderRadius: 14, alignItems: "flex-start" }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: `${FA.brand}14`, border: `1px solid ${FA.brand}30`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: FA.brand }}>
                {dayNum}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: FA.ink, lineHeight: 1.3, marginBottom: desc ? 4 : 0 }}>{title}</div>
                {desc && <div style={{ fontSize: 12.5, color: FA.muted, lineHeight: 1.55 }}>{desc}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FaHighlights({ pkg, lang }: { pkg: TPackage; lang: Lang }) {
  const t = T[lang];
  const data = faFindSec(pkg, "highlights");
  const rawItems = faSecArrMixed(data, "items");
  if (rawItems.length < 1) return null;
  return (
    <section style={{ padding: "20px 18px" }} data-pmx-section="highlights">
      <FaSectionHead kicker={t.builtForFamilies} title={t.familyFeaturesHeading} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {rawItems.map((item, i) => {
          const title = typeof item === "string" ? item : (faItemStr(item as FaSD, "title") || faItemStr(item as FaSD, "body"));
          const body = typeof item === "object" ? faItemStr(item as FaSD, "body") : "";
          return (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", background: "#fff", border: `1px solid ${FA.border}`, borderRadius: 12 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${FA.brand}12`, border: `1px solid ${FA.brand}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                <FaCheckIcon size={11} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: FA.ink, lineHeight: 1.3 }}>{title}</div>
                {body && title !== body && <div style={{ fontSize: 12.5, color: FA.muted, marginTop: 3, lineHeight: 1.5 }}>{body}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FaHotel({ pkg, lang }: { pkg: TPackage; lang: Lang }) {
  const t = T[lang];
  const data = faFindSec(pkg, "hotel");
  const desc = faSecStr(data, "description") || pkg.hotelDescription;
  const hotels = faSecArr(faFindSec(pkg, "hotels"), "hotels");
  if (!desc && !hotels.length) return null;
  return (
    <section style={{ padding: "20px 18px" }} data-pmx-section="hotel">
      <FaSectionHead kicker={t.faWhereYouStay} title={t.faFamilyHome} />
      {hotels.length > 0 ? (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {hotels.map((h, i) => (
            <div key={i} style={{ background: "#fff", border: `1px solid ${FA.border}`, borderRadius: 14, overflow: "hidden" }}>
              {faSecStr(h, "photo") && (
                <img src={faSecStr(h, "photo")} alt={faSecStr(h, "name")} style={{ width: "100%", height: 160, objectFit: "cover", display: "block" }} />
              )}
              <div style={{ padding: "14px 16px" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: FA.ink }}>{faSecStr(h, "name")}</div>
                {faSecStr(h, "location") && <div style={{ fontSize: 12, color: FA.muted, marginTop: 2 }}>{faSecStr(h, "location")}</div>}
                {faSecStr(h, "note") && <div style={{ fontSize: 13, color: FA.muted, marginTop: 8, lineHeight: 1.5 }}>{faSecStr(h, "note")}</div>}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p style={{ fontSize: 14, color: FA.muted, lineHeight: 1.75, margin: 0 }}>{desc}</p>
      )}
    </section>
  );
}

function FaInclusions({ pkg, lang }: { pkg: TPackage; lang: Lang }) {
  const t = T[lang];
  const data = faFindSec(pkg, "inclusions");
  const includes = faSecStrArr(data, "includes").length
    ? faSecStrArr(data, "includes")
    : (pkg.includes?.length ? pkg.includes : (pkg.advantages ?? []));
  const excludes = faSecStrArr(data, "excludes").length
    ? faSecStrArr(data, "excludes")
    : (pkg.excludes ?? []);

  // meals/visa from inclusions or separate sections
  const mealsData = faFindSec(pkg, "meals");
  const visaData = faFindSec(pkg, "visa");
  const meals = faSecStr(data, "meals") || faSecStr(mealsData, "plan");
  const visaStatus = faSecStr(data, "visa") || faSecStr(visaData, "included");

  if (!includes.length && !excludes.length && !meals && !visaStatus) return null;
  return (
    <section id="included" style={{ padding: "20px 18px", scrollMarginTop: 88 }} data-pmx-section="inclusions">
      <FaSectionHead kicker={t.includedLabel} title={t.faWhatsIncludedFamily} />
      {(meals || visaStatus) && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
          {meals && (
            <div style={{ background: `${FA.brand}10`, border: `1px solid ${FA.brand}25`, borderRadius: 99, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: FA.brand }}>
              {FA_MEAL_LABELS[meals]?.[lang] ?? meals}
            </div>
          )}
          {visaStatus && (
            <div style={{ background: `${FA.brand}10`, border: `1px solid ${FA.brand}25`, borderRadius: 99, padding: "5px 12px", fontSize: 12, fontWeight: 600, color: FA.brand }}>
              {FA_VISA_LABELS[visaStatus]?.[lang] ?? visaStatus}
            </div>
          )}
        </div>
      )}
      <div style={{ display: "grid", gridTemplateColumns: excludes.length ? "1fr 1fr" : "1fr", gap: 16 }}>
        {includes.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: FA.brand, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>{t.includedLabel}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {includes.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${FA.brand}12`, border: `1px solid ${FA.brand}25`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                    <FaCheckIcon size={9} />
                  </div>
                  <span style={{ fontSize: 13, color: FA.muted, lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {excludes.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 10 }}>{t.notIncluded}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {excludes.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                  <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                    <FaXIcon size={9} />
                  </div>
                  <span style={{ fontSize: 13, color: FA.muted, lineHeight: 1.5 }}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function FaFaq({ pkg, lang }: { pkg: TPackage; lang: Lang }) {
  const t = T[lang];
  const data = faFindSec(pkg, "faq");
  const items = faSecArr(data, "items");
  if (!items.length) return null;
  return (
    <section style={{ padding: "20px 18px" }} data-pmx-section="faq">
      <FaSectionHead kicker={t.frequentlyAsked} title={t.faFamilyQuestions} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {items.map((f, i) => {
          const q = faSecStr(f, "question") || faSecStr(f, "q");
          const a = faSecStr(f, "answer") || faSecStr(f, "a");
          return (
            <div key={i} style={{ background: "#fff", border: `1px solid ${FA.border}`, borderRadius: 12, overflow: "hidden" }}>
              <div style={{ padding: "12px 14px 10px", display: "flex", gap: 10, alignItems: "flex-start" }}>
                <div style={{ width: 22, height: 22, borderRadius: 7, background: FA.brand, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff", marginTop: 1 }}>
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: FA.ink, lineHeight: 1.35 }}>{q}</div>
              </div>
              {a && <div style={{ padding: "0 14px 12px 46px", fontSize: 13, color: FA.muted, lineHeight: 1.6 }}>{a}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FaCustom({ pkg, lang }: { pkg: TPackage; lang: Lang }) {
  const data = faFindSec(pkg, "custom");
  if (!data) return null;
  const heading = faSecStr(data, "heading");
  const content = faSecStr(data, "content");
  const image = faSecStr(data, "image");
  if (!heading && !content) return null;
  return (
    <section style={{ padding: "20px 18px" }} data-pmx-section="custom">
      {image && <img src={image} alt={heading} style={{ width: "100%", borderRadius: 14, marginBottom: 14, maxHeight: 200, objectFit: "cover" }} />}
      {heading && <h3 style={{ fontSize: 18, fontWeight: 800, color: FA.ink, letterSpacing: "-0.3px", margin: "0 0 10px" }}>{heading}</h3>}
      {content && <p style={{ fontSize: 13.5, color: FA.muted, lineHeight: 1.7, margin: 0 }}>{content}</p>}
    </section>
  );
}

function FaExtras({ pkg, lang }: { pkg: TPackage; lang: Lang }) {
  const t = T[lang];
  const data = faFindSec(pkg, "extras");
  const items = faSecArr(data, "items");
  if (!items.length) return null;
  return (
    <section style={{ padding: "20px 18px" }} data-pmx-section="extras">
      <FaSectionHead kicker={t.faOptionalAddOns} title={t.faLittleThings} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((e, i) => {
          const name = faSecStr(e, "label") || faSecStr(e, "name");
          const desc = faSecStr(e, "desc") || faSecStr(e, "description");
          const price = faSecStr(e, "price");
          return (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "center", padding: "12px 14px", background: "#fff", border: `1px solid ${FA.border}`, borderRadius: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: FA.ink }}>{name}</div>
                {desc && <div style={{ fontSize: 12.5, color: FA.muted, marginTop: 3, lineHeight: 1.5 }}>{desc}</div>}
              </div>
              {price && <div style={{ fontSize: 14, fontWeight: 800, color: FA.brand, flexShrink: 0 }}>{price}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FaPeople({ pkg, lang }: { pkg: TPackage; lang: Lang }) {
  const t = T[lang];
  const data = faFindSec(pkg, "people");
  const people = faSecArr(data, "people");
  if (!people.length) return null;
  return (
    <section style={{ padding: "20px 18px" }} data-pmx-section="people">
      <FaSectionHead kicker={t.faTravelTeam} title={t.faPeopleWhoCare} />
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {people.map((p, i) => {
          const name = faSecStr(p, "name");
          const role = faSecStr(p, "role");
          const bio = faSecStr(p, "bio");
          const photo = faSecStr(p, "photo");
          const years = faSecNum(p, "years");
          return (
            <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", background: "#fff", border: `1px solid ${FA.border}`, borderRadius: 14, alignItems: "flex-start" }}>
              {photo
                ? <img src={photo} alt={name} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                : <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${FA.brand}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 18, fontWeight: 800, color: FA.brand }}>
                    {name.charAt(0).toUpperCase()}
                  </div>
              }
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 800, color: FA.ink }}>{name}</div>
                {role && <div style={{ fontSize: 11.5, color: FA.brand, fontWeight: 600, textTransform: "capitalize", marginTop: 2 }}>{role.replace("_", " ")}</div>}
                {years != null && <div style={{ fontSize: 12, color: FA.muted, marginTop: 2 }}>{years} {t.faYearsExperience}</div>}
                {bio && <div style={{ fontSize: 12.5, color: FA.muted, marginTop: 6, lineHeight: 1.55 }}>{bio}</div>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FaImportantNotes({ pkg, lang }: { pkg: TPackage; lang: Lang }) {
  const t = T[lang];
  const data = faFindSec(pkg, "important_notes");
  const notes = faSecArr(data, "notes");
  const items = notes.length ? notes : faSecArr(data, "items");
  if (!items.length) return null;
  return (
    <section style={{ padding: "20px 18px" }} data-pmx-section="important_notes">
      <FaSectionHead kicker={t.faGoodToKnow} title={t.faBeforeYouPackBags} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((n, i) => {
          const severity = faSecStr(n, "severity");
          const title = faSecStr(n, "title") || faSecStr(n, "text");
          const body = faSecStr(n, "body");
          const isWarn = severity === "warn";
          return (
            <div key={i} style={{ padding: "12px 14px", background: isWarn ? "#fff8f4" : "#fff", border: `1px solid ${isWarn ? FA.brand + "40" : FA.border}`, borderRadius: 12, borderLeft: `3px solid ${isWarn ? FA.brand : FA.border}` }}>
              {isWarn && (
                <div style={{ fontSize: 9.5, fontWeight: 800, color: FA.brand, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 4 }}>
                  {t.faImportantTag}
                </div>
              )}
              <div style={{ fontSize: 13.5, fontWeight: 600, color: FA.ink, lineHeight: 1.35 }}>{title}</div>
              {body && <div style={{ fontSize: 12.5, color: FA.muted, marginTop: 5, lineHeight: 1.55 }}>{body}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FaAboutAgency({ pkg, agency, lang }: { pkg: TPackage; agency: TAgency; lang: Lang }) {
  const data = faFindSec(pkg, "about_agency");
  const content = faSecStr(data, "content");
  const image = faSecStr(data, "image");
  if (!content) return null;
  const initials = agency.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <section style={{ padding: "20px 18px" }} data-pmx-section="about_agency">
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        {agency.logoUrl
          ? <img src={agency.logoUrl} alt="" style={{ width: 36, height: 36, borderRadius: 9, objectFit: "contain" }} />
          : <div style={{ width: 36, height: 36, borderRadius: 9, background: FA.brand, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>{initials}</div>
        }
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: FA.ink }}>{agency.name}</div>
          {agency.tagline && <div style={{ fontSize: 11.5, color: FA.muted }}>{agency.tagline}</div>}
        </div>
      </div>
      {image && <img src={image} alt={agency.name} style={{ width: "100%", borderRadius: 12, marginBottom: 12, maxHeight: 180, objectFit: "cover" }} />}
      <p style={{ fontSize: 13.5, color: FA.muted, lineHeight: 1.7, margin: 0 }}>{content}</p>
    </section>
  );
}

function FaDepartures({ pkg, lang }: { pkg: TPackage; lang: Lang }) {
  const t = T[lang];
  const data = faFindSec(pkg, "departures");
  const entries = faSecArr(data, "entries");
  // legacy fallbacks
  const legacyDeps = pkg.departures ?? [];
  const deps = entries.length
    ? entries.map((e) => ({
        date: faSecStr(e, "date"),
        spots: faSecNum(e, "spots") ?? 0,
        price: faSecStr(e, "price"),
        deal: !!(e as FaSD).deal,
      }))
    : legacyDeps;
  if (!deps.length) return null;
  return (
    <section style={{ padding: "20px 18px" }} data-pmx-section="departures">
      <FaSectionHead kicker={t.faDepartureDates} title={t.faPickPerfectWindow} />
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {deps.map((d, i) => {
          const spots = "spots" in d ? d.spots : 0;
          const isLow = typeof spots === "number" && spots <= 3;
          return (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", background: "#fff", border: `1px solid ${FA.border}`, borderRadius: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: FA.ink }}>{d.date}</div>
                <div style={{ fontSize: 12, color: isLow ? FA.brand : FA.muted, marginTop: 2, fontWeight: isLow ? 700 : 400 }}>
                  {isLow ? `${t.faOnlySpotsLeft} ${spots} ${t.faSpotsLeftLabel}` : `${spots} ${t.faSpotsAvailable}`}
                </div>
              </div>
              {d.price && <div style={{ fontSize: 15, fontWeight: 800, color: FA.brand, flexShrink: 0 }}>{d.price}</div>}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function FaPricing({ pkg, lang, onWhatsApp }: { pkg: TPackage; lang: Lang; onWhatsApp: () => void }) {
  const t = T[lang];
  const data = faFindSec(pkg, "pricing");
  const tiers = faSecArr(data, "tiers").length ? faSecArr(data, "tiers") : (pkg.pricingTiers ?? []).map((tier) => ({ ...tier } as FaSD));
  const cancellation = faSecStr(data, "cancellation") || pkg.cancellation;
  if (!tiers.length && !cancellation) return null;
  return (
    <section id="pricing" style={{ padding: "20px 18px", scrollMarginTop: 88 }} data-pmx-section="pricing">
      <FaSectionHead kicker={t.navPricing} title={t.faWhatFamiliesChoose} />
      {tiers.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: cancellation ? 16 : 0 }}>
          {tiers.map((tier, i) => {
            const label = localizeTierLabel(faSecStr(tier, "label"), lang);
            const price = faSecStr(tier, "price");
            const isPop = !!(tier as FaSD).pop;
            return (
              <div key={i} style={{
                background: isPop ? FA.brand : "#fff",
                border: `1px solid ${isPop ? "transparent" : FA.border}`,
                borderRadius: 16, padding: "20px 18px",
                boxShadow: isPop ? `0 8px 24px ${FA.brand}30` : "none",
                position: "relative",
              }}>
                {isPop && (
                  <div style={{ position: "absolute", top: -1, right: 16, background: "#fff", color: FA.brand, fontSize: 10, fontWeight: 800, padding: "3px 10px", borderRadius: "0 0 8px 8px", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                    {t.faMostPopular}
                  </div>
                )}
                <div style={{ fontSize: 12, fontWeight: 600, color: isPop ? "rgba(255,255,255,0.75)" : FA.muted, marginBottom: 6 }}>{label}</div>
                <div style={{ fontSize: 34, fontWeight: 800, color: isPop ? "#fff" : FA.ink, letterSpacing: "-1px", lineHeight: 1 }}>{price}</div>
                <div style={{ fontSize: 11.5, color: isPop ? "rgba(255,255,255,0.6)" : FA.superMuted, marginTop: 4, marginBottom: 14 }}>{t.perPerson}</div>
                <WAButton label={t.bookWhatsApp} size="md" onClick={onWhatsApp} style={isPop ? { background: "#fff", color: FA.brand } : undefined} />
              </div>
            );
          })}
        </div>
      )}
      {cancellation && (
        <div style={{ padding: "12px 14px", background: `${FA.brand}08`, border: `1px solid ${FA.brand}20`, borderRadius: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: FA.brand, textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 5 }}>
            {t.faCancellationPolicy}
          </div>
          <div style={{ fontSize: 12.5, color: FA.muted, lineHeight: 1.6 }}>{cancellation}</div>
        </div>
      )}
    </section>
  );
}

function FaTransfers({ pkg, lang }: { pkg: TPackage; lang: Lang }) {
  const t = T[lang];
  const data = faFindSec(pkg, "transfers");
  if (!data) return null;
  const rawItems = faSecArrMixed(data, "items");
  const desc = faSecStr(data, "description");
  if (!rawItems.length && !desc) return null;
  return (
    <section style={{ padding: "20px 18px" }} data-pmx-section="transfers">
      <FaSectionHead kicker={t.faGettingAround} title={t.faDoorToDoorComfort} />
      {desc && !rawItems.length && <p style={{ fontSize: 13.5, color: FA.muted, lineHeight: 1.7, margin: 0 }}>{desc}</p>}
      {rawItems.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {rawItems.map((item, i) => {
            const leg = faItemStr(item as FaSD, "leg", "from", "title");
            const label = typeof item === "string" ? item : leg;
            const included = typeof item === "object" ? (item as FaSD).included !== false : true;
            return (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 14px", background: "#fff", border: `1px solid ${FA.border}`, borderRadius: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: FA.brand, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0, fontSize: 13.5, color: FA.ink, fontWeight: 500, overflowWrap: "break-word" }}>{label}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: included ? FA.brand : FA.muted, flexShrink: 0 }}>
                  {included ? t.faTransferIncluded : t.faTransferAddOn}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function FaMedia({ pkg, lang }: { pkg: TPackage; lang: Lang }) {
  const t = T[lang];
  const data = faFindSec(pkg, "media");
  const images = faSecStrArr(data, "images").length
    ? faSecStrArr(data, "images")
    : (pkg.gallery?.map((g) => g.src) ?? pkg.images ?? []);
  const videoUrl = faSecStr(data, "videoUrl") || pkg.videoUrl || "";
  const mapImage = faSecStr(data, "mapImage") || faSecStr(data, "mapSrc");
  const mapCaption = faSecStr(data, "mapCaption");
  if (!images.length && !videoUrl && !mapImage) return null;
  return (
    <section style={{ padding: "20px 18px" }} data-pmx-section="media">
      <FaSectionHead kicker={t.faInPhotographs} title={t.faGlimpseAwaits} />
      {videoUrl && (() => {
        const isEmbed = videoUrl.includes("youtube") || videoUrl.includes("youtu.be") || videoUrl.includes("vimeo");
        const embedUrl = (() => {
          const yt = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
          if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
          const vi = videoUrl.match(/vimeo\.com\/(\d+)/);
          if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
          return videoUrl;
        })();
        return isEmbed
          ? <iframe src={embedUrl} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ width: "100%", height: 220, borderRadius: 12, border: "none", display: "block", marginBottom: 10 }} />
          : <video src={videoUrl} controls playsInline style={{ width: "100%", borderRadius: 12, background: "#0d1b2e", maxHeight: 220, marginBottom: 10 }} />;
      })()}
      {mapImage && (
        <div style={{ marginBottom: 10, borderRadius: 12, overflow: "hidden" }}>
          <img src={mapImage} alt={mapCaption || "map"} style={{ width: "100%", objectFit: "cover", maxHeight: 200 }} />
          {mapCaption && <div style={{ fontSize: 12, color: FA.muted, padding: "6px 2px" }}>{mapCaption}</div>}
        </div>
      )}
      {images.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
          {images.slice(0, 6).map((url, i) => (
            <img key={i} src={url} alt="" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 10 }} onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
          ))}
        </div>
      )}
    </section>
  );
}

// ─── FaReviews component ──────────────────────────────────────────────────────

function FaReviews({ pkg, agency, lang }: { pkg: TPackage; agency: TAgency; lang: Lang }) {
  const t = T[lang];
  const [name, setName] = React.useState("");
  const [text, setText] = React.useState("");
  const [rating, setRating] = React.useState(5);
  const [submitted, setSubmitted] = React.useState(false);

  // reviews can come from pkg.reviews or from a reviews section
  const secData = faFindSec(pkg, "reviews");
  const secReviews = faSecArr(secData, "reviews");
  const reviews = secReviews.length
    ? secReviews.map((r) => ({
        id: faSecStr(r, "id") || String(Math.random()),
        name: faSecStr(r, "name"),
        text: faSecStr(r, "text"),
        rating: faSecNum(r, "rating") ?? 5,
      }))
    : (pkg.reviews ?? []);

  const showReviewForm = agency.enableReviews || agency.showReviews;
  if (!reviews.length && !showReviewForm) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    setSubmitted(true);
  };

  return (
    <section style={{ padding: "20px 18px" }} data-pmx-section="reviews">
      <FaSectionHead
        kicker={t.faWhatFamiliesSay}
        title={t.faRealStories}
      />

      {pkg.rating != null && (
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: `${FA.brand}0a`, border: `1px solid ${FA.brand}20`, borderRadius: 12, marginBottom: 14 }}>
          <div style={{ fontSize: 40, fontWeight: 800, color: FA.brand, lineHeight: 1 }}>{pkg.rating}</div>
          <div>
            <FaStars value={pkg.rating} size={16} />
            {pkg.reviewCount != null && (
              <div style={{ fontSize: 12, color: FA.muted, marginTop: 4 }}>
                {pkg.reviewCount} {t.faReviewsCount}
              </div>
            )}
          </div>
        </div>
      )}

      {reviews.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {reviews.slice(0, 5).map((r, i) => (
            <div key={r.id ?? i} style={{ padding: "14px 16px", background: "#fff", border: `1px solid ${FA.border}`, borderRadius: 14 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: FA.ink }}>{r.name}</div>
                <FaStars value={r.rating} size={12} />
              </div>
              <p style={{ fontSize: 13, color: FA.muted, lineHeight: 1.6, margin: 0 }}>{r.text}</p>
            </div>
          ))}
        </div>
      )}

      {showReviewForm && !submitted && (
        <div style={{ background: "#fff", border: `1px solid ${FA.border}`, borderRadius: 14, padding: "18px 16px" }}>
          <h3 style={{ fontSize: 15, fontWeight: 800, color: FA.ink, margin: "0 0 14px" }}>{t.writeReviewTitle}</h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.reviewYourName}
              style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${FA.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", background: "#fefaf2", color: FA.ink }}
            />
            <div style={{ display: "flex", gap: 4 }}>
              {[1,2,3,4,5].map((s) => (
                <button key={s} type="button" onClick={() => setRating(s)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "2px", fontSize: 22, color: s <= rating ? FA.brand : FA.border, lineHeight: 1 }}>
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t.reviewPlaceholder}
              rows={3}
              style={{ padding: "10px 12px", borderRadius: 8, border: `1px solid ${FA.border}`, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical", background: "#fefaf2", color: FA.ink }}
            />
            <button type="submit" style={{ background: FA.brand, color: "#fff", border: "none", borderRadius: 9, padding: "11px 18px", fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
              {t.submitReviewBtn}
            </button>
          </form>
        </div>
      )}
      {showReviewForm && submitted && (
        <div style={{ padding: "14px 16px", background: `${FA.brand}10`, border: `1px solid ${FA.brand}25`, borderRadius: 12, fontSize: 13.5, fontWeight: 600, color: FA.brand }}>
          {t.reviewSubmitSuccess}
        </div>
      )}
    </section>
  );
}

// ─── FaOtherPackages ──────────────────────────────────────────────────────────

function FaOtherPackages({ pkg, lang, agencySlug }: { pkg: TPackage; lang: Lang; agencySlug?: string }) {
  const t = T[lang];
  const data = faFindSec(pkg, "other_packages");
  const cards = faSecArr(data, "packages");
  if (!cards.length) return null;
  const heading = faSecStr(data, "heading") || t.otherPackagesHeading;
  const isRtl = lang === "ar";
  return (
    <section style={{ padding: "32px 18px 0" }} dir={isRtl ? "rtl" : "ltr"} data-pmx-section="other_packages">
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase" as const, color: FA.muted, marginBottom: 14 }}>{heading}</div>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8, scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
        {cards.map((card, i) => {
          const img = faSecStr(card, "image");
          const title = faSecStr(card, "title");
          const dest = faSecStr(card, "destination");
          const price = faSecStr(card, "price");
          const nights = faSecStr(card, "nights");
          const link = faSecStr(card, "link");
          return (
            <a key={i} href={link || undefined} style={{
              flex: "0 0 190px", minWidth: 190, borderRadius: 14, overflow: "hidden",
              textDecoration: "none", border: `1px solid ${FA.border}`,
              background: "#fff", scrollSnapAlign: "start",
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ width: "100%", height: 120, background: FA.border, flexShrink: 0 }}>
                {img && <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
              </div>
              <div style={{ padding: "10px 12px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                {dest && <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" as const, color: FA.brand }}>{dest}</div>}
                <div style={{ fontFamily: FA.serif, fontSize: 14, fontWeight: 700, color: FA.ink, lineHeight: 1.3 }}>{title}</div>
                {(nights || price) && (
                  <div style={{ marginTop: "auto", paddingTop: 6, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    {nights && <span style={{ fontSize: 11, color: FA.muted }}>{nights}</span>}
                    {price && <span style={{ fontSize: 12, fontWeight: 700, color: FA.brand }}>{price}</span>}
                  </div>
                )}
              </div>
            </a>
          );
        })}
      </div>
      {agencySlug && (
        <div style={{ marginTop: 14, textAlign: isRtl ? "left" : "right" }}>
          <a href={`/${agencySlug}`} style={{ fontSize: 12, fontWeight: 700, color: FA.brand, textDecoration: "none" }}>
            {t.navAllPackages} →
          </a>
        </div>
      )}
    </section>
  );
}

// ─── FaSection switch ─────────────────────────────────────────────────────────

interface FaSectionProps {
  s: { id: string; type: string; order: number; data: Record<string, unknown> };
  isDesktop: boolean;
  onWhatsApp: () => void;
  lang: Lang;
  agency: TAgency;
  pkg: TPackage;
}

function FaSection({ s, isDesktop, onWhatsApp, lang, agency, pkg }: FaSectionProps) {
  switch (s.type) {
    case "itinerary":      return <FaItinerary pkg={pkg} lang={lang} />;
    case "highlights":     return <FaHighlights pkg={pkg} lang={lang} />;
    case "hotel":
    case "hotels":         return <FaHotel pkg={pkg} lang={lang} />;
    case "inclusions":
    case "meals":
    case "visa":           return <FaInclusions pkg={pkg} lang={lang} />;
    case "faq":            return <FaFaq pkg={pkg} lang={lang} />;
    case "custom":         return <FaCustom pkg={pkg} lang={lang} />;
    case "extras":         return <FaExtras pkg={pkg} lang={lang} />;
    case "people":         return <FaPeople pkg={pkg} lang={lang} />;
    case "important_notes": return <FaImportantNotes pkg={pkg} lang={lang} />;
    case "about_agency":   return <FaAboutAgency pkg={pkg} agency={agency} lang={lang} />;
    case "other_packages": return <FaOtherPackages pkg={pkg} lang={lang} agencySlug={agency.agencySlug} />;
    case "departures":     return <FaDepartures pkg={pkg} lang={lang} />;
    case "pricing":        return <FaPricing pkg={pkg} lang={lang} onWhatsApp={onWhatsApp} />;
    case "transfers":      return <FaTransfers pkg={pkg} lang={lang} />;
    case "media":          return <FaMedia pkg={pkg} lang={lang} />;
    case "reviews":        return <FaReviews pkg={pkg} agency={agency} lang={lang} />;
    default:               return null;
  }
}

// ─── FaSections wrapper ────────────────────────────────────────────────────────

function FaSections({ pkg, isDesktop, onWhatsApp, lang, agency }: {
  pkg: TPackage; isDesktop: boolean; onWhatsApp: () => void; lang: Lang; agency: TAgency;
}) {
  const sections = [...(pkg.sections ?? [])].sort((a, b) => a.order - b.order);
  return (
    <>
      {sections.map((s) => (
        <FaSection key={s.id} s={s} isDesktop={isDesktop} onWhatsApp={onWhatsApp} lang={lang} agency={agency} pkg={pkg} />
      ))}
    </>
  );
}

// ─── FaCTABanner ─────────────────────────────────────────────────────────────

function FaCTABanner({ pkg, agency, isDesktop, onWhatsApp, onMessenger, lang }: {
  pkg: TPackage; agency: TAgency; isDesktop: boolean; onWhatsApp: () => void; onMessenger: () => void; lang: Lang;
}) {
  const t = T[lang];
  return (
    <div style={{
      background: `linear-gradient(135deg, ${FA.brand} 0%, #e0813d 100%)`,
      borderRadius: 18, overflow: "hidden", position: "relative",
      padding: isDesktop ? "40px 44px" : "28px 22px",
    }}>
      {/* Warm dot pattern */}
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.07, pointerEvents: "none" }} viewBox="0 0 60 60" preserveAspectRatio="xMidYMid slice">
        <defs>
          <pattern id="fa-cta-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <circle cx="10" cy="10" r="2" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#fa-cta-dots)" />
      </svg>
      <div style={{ position: "relative" }}>
        <div style={{ fontSize: isDesktop ? 28 : 22, fontWeight: 800, color: "#fff", marginBottom: 8, lineHeight: 1.2, letterSpacing: "-0.4px" }}>
          {t.faReadyToTakeFamily} {pkg.destination}?
        </div>
        <div style={{ fontSize: 13.5, color: "rgba(255,255,255,0.72)", marginBottom: 22, lineHeight: 1.55 }}>
          {t.faReserveFamilySpot}
        </div>
        <div style={{ display: "flex", flexDirection: isDesktop ? "row" : "column", gap: 10 }}>
          <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} style={{ background: "#fff", color: FA.brand }} />
          {pkg.messenger && (
            <button data-testid="messenger-cta" onClick={onMessenger} style={{ background: "rgba(255,255,255,0.2)", color: "#fff", border: "1px solid rgba(255,255,255,0.35)", borderRadius: 10, padding: "14px 22px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {t.faMessengerBtn}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── FaMobileFooter ──────────────────────────────────────────────────────────

function FaMobileFooter({ agency }: { agency: TAgency }) {
  const initials = agency.name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ padding: "22px 18px 28px", borderTop: `1px solid ${FA.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        {agency.logoUrl
          ? <img src={agency.logoUrl} alt="" style={{ width: 24, height: 24, objectFit: "contain", borderRadius: 5 }} />
          : <div style={{ width: 24, height: 24, borderRadius: 6, background: FA.brand, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff" }}>{initials}</div>
        }
        <div style={{ fontSize: 13, fontWeight: 700, color: FA.ink }}>{agency.name}</div>
      </div>
      <div style={{ fontSize: 10, color: FA.superMuted }}>Powered by PackMetrix</div>
    </div>
  );
}

// ─── TemplateFamilyPage ──────────────────────────────────────────────────────

export function TemplateFamilyPage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const nights = pkg.nights ? Number(pkg.nights) : null;
  const coverImage = pkg.coverImage || "";
  const title = pkg.title || pkg.destination;
  const isRtl = lang === "ar";
  const isDesktop = useIsDesktop();

  const navLinks = [
    ...((pkg.sections?.some((s) => s.type === "itinerary") || (pkg.itinerary ?? []).some((it) => it.title?.trim())) ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...((pkg.sections?.some((s) => s.type === "inclusions") || pkg.includes?.length || (pkg.advantages ?? []).length) ? [{ label: t.navIncluded, href: "#included" }] : []),
    ...((pkg.sections?.some((s) => s.type === "pricing") || (pkg.pricingTiers ?? []).some((tier) => tier.price)) ? [{ label: t.navPricing, href: "#pricing" }] : []),
  ];

  // Legacy fallback data for sections not yet migrated
  const familyFeatures = (pkg.includes?.length ? pkg.includes : (pkg.advantages || [])).slice(0, 6);

  if (isDesktop) {
    return (
      <div style={{ minHeight: "100vh", background: FA.bg, color: FA.ink, fontFamily: FA.serif, direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={FA.brand} navLinks={navLinks} lang={lang} onWhatsApp={onWhatsApp} />

        {/* 50/50 hero: arched image left + overlapping price card, text right */}
        <DContainer style={{ padding: "56px 80px 56px" }} data-pmx-section="hero">
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <div style={{ position: "relative", height: 480, borderRadius: 220, overflow: "hidden" }}>
                {coverImage
                  ? <img src={coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                  : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${FA.brand}cc, ${FA.brand}55)` }} />
                }
              </div>
              {/* Overlapping price card */}
              <div style={{ position: "absolute", bottom: -16, right: -16, background: "#fff", borderRadius: 14, padding: "16px 20px", boxShadow: "0 10px 24px rgba(0,0,0,0.08)", border: `1px solid ${FA.border}` }}>
                <div style={{ fontSize: 10.5, color: FA.superMuted, letterSpacing: "0.7px", textTransform: "uppercase" }}>{t.familyOf4}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: FA.brand, marginTop: 4, letterSpacing: "-0.5px" }} data-pmx-field="price">{pkg.price}</div>
                <div style={{ fontSize: 11, color: FA.superMuted, marginTop: 2 }}>{t.kidsUnder6Free}</div>
              </div>
            </div>
            <div data-pmx-field="destination">
              <Eyebrow text={pkg.destination} brand={FA.brand} />
              <h1 style={{ fontSize: 60, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-1.5px", marginTop: 16, marginBottom: 18 }} data-pmx-field="title">{title}</h1>
              <p style={{ fontSize: 16.5, color: FA.muted, lineHeight: 1.7, margin: "0 0 24px" }}>{pkg.description}</p>
              <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />
            </div>
          </div>
        </DContainer>

        {/* Family features 3-col (legacy fallback) */}
        {familyFeatures.length > 0 && !pkg.sections?.some((s) => s.type === "highlights") && (
          <DContainer style={{ padding: "32px 80px 56px" }}>
            <Eyebrow text={t.builtForFamilies} brand={FA.brand} />
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.8px", marginTop: 10, marginBottom: 28 }}>{t.familyFeaturesHeading}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
              {familyFeatures.map((it, i) => (
                <div key={i} style={{ background: "#fff", border: `1px solid ${FA.border}`, borderRadius: 14, padding: 22 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: `${FA.brand}12`, border: `1px solid ${FA.brand}25`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 1 }}>
                      <FaCheckIcon size={10} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: FA.ink, lineHeight: 1.35 }}>{it}</div>
                  </div>
                </div>
              ))}
            </div>
          </DContainer>
        )}

        {/* Sections */}
        <DContainer style={{ padding: "0 80px" }}>
          <FaSections pkg={pkg} isDesktop={true} onWhatsApp={onWhatsApp} lang={lang} agency={agency} />
        </DContainer>

        {/* Reviews (standalone if not already in sections) */}
        {!(pkg.sections?.some((s) => s.type === "reviews")) && (pkg.reviews?.length ?? 0) > 0 && (
          <DContainer style={{ padding: "0 80px" }}>
            <FaReviews pkg={pkg} agency={agency} lang={lang} />
          </DContainer>
        )}

        {/* CTA banner */}
        <DContainer style={{ padding: "32px 80px 56px" }}>
          <FaCTABanner pkg={pkg} agency={agency} isDesktop={true} onWhatsApp={onWhatsApp} onMessenger={onMessenger} lang={lang} />
        </DContainer>

        <DesktopFooter agency={agency} brand={FA.brand} />
      </div>
    );
  }

  // ── Mobile ────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: "100vh", background: FA.bg, color: FA.ink,
      fontFamily: FA.serif, direction: isRtl ? "rtl" : "ltr",
    }}>
      <AgencyBar agency={agency} price={pkg.price} brand={FA.brand} onWhatsApp={onWhatsApp} lang={lang} navLinks={navLinks} />

      {/* Hero with curved bottom */}
      <div style={{ position: "relative", height: 320, overflow: "hidden" }} data-pmx-section="hero">
        {coverImage ? (
          <img src={coverImage} alt={pkg.destination} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
        ) : (
          <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${FA.brand}cc, ${FA.brand}44)` }} />
        )}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.5) 100%)" }} />
        {/* SVG wave bottom */}
        <svg style={{ position: "absolute", bottom: -1, left: 0, width: "100%" }} viewBox="0 0 390 40" preserveAspectRatio="none">
          <path d="M0,40 L0,20 Q195,0 390,20 L390,40 Z" fill={FA.bg} />
        </svg>
      </div>

      {/* Title + description */}
      <div style={{ padding: "8px 18px 0" }} data-pmx-field="destination">
        <Eyebrow text={pkg.destination} brand={FA.brand} />
        <h1 style={{ fontSize: 30, fontWeight: 800, color: FA.ink, margin: "10px 0 12px", letterSpacing: "-0.5px", lineHeight: 1.2 }} data-pmx-field="title">
          {title}
        </h1>
        {pkg.description && (
          <p style={{ fontSize: 14, color: FA.muted, lineHeight: 1.7, margin: 0 }}>{pkg.description}</p>
        )}
      </div>

      {/* Family pricing card */}
      <div style={{ padding: "22px 18px 0" }}>
        <div style={{ background: FA.brand, borderRadius: 18, padding: "24px 22px", position: "relative", overflow: "hidden" }}>
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.07, pointerEvents: "none" }} viewBox="0 0 60 60" preserveAspectRatio="xMidYMid slice">
            <defs>
              <pattern id="fam-dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="10" cy="10" r="2" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#fam-dots)" />
          </svg>
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", marginBottom: 8, fontWeight: 600 }}>
              {t.perFamilyOfFour}
            </div>
            <div style={{ fontSize: 40, fontWeight: 800, color: "#fff", letterSpacing: "-1px", lineHeight: 1, marginBottom: 6 }} data-pmx-field="price">
              {pkg.price}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.65)", marginBottom: 20 }}>
              {t.kidsUnder12Free}
            </div>
            <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} style={{ background: "#fff", color: FA.brand }} />
          </div>
        </div>
      </div>

      {/* Nights info strip */}
      {nights && (
        <div style={{ padding: "14px 18px 0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: "#fff", border: `1px solid ${FA.border}`, borderRadius: 10 }}>
            <span style={{ fontSize: 20, fontWeight: 800, color: FA.brand }}>{nights}</span>
            <span style={{ fontSize: 13, color: FA.muted }}>{t.nightsLabel} · {t.perPerson}</span>
          </div>
        </div>
      )}

      {/* All sections */}
      <FaSections pkg={pkg} isDesktop={false} onWhatsApp={onWhatsApp} lang={lang} agency={agency} />

      {/* Reviews (standalone if not in sections) */}
      {!(pkg.sections?.some((s) => s.type === "reviews")) && (pkg.reviews?.length ?? 0) > 0 && (
        <FaReviews pkg={pkg} agency={agency} lang={lang} />
      )}

      {/* CTA banner */}
      <div style={{ padding: "0 18px 28px" }}>
        <FaCTABanner pkg={pkg} agency={agency} isDesktop={false} onWhatsApp={onWhatsApp} onMessenger={onMessenger} lang={lang} />
      </div>

      <FaMobileFooter agency={agency} />

      <StickyCTA price={pkg.price} nights={nights} label={t.bookWhatsApp} onWhatsApp={onWhatsApp} lang={lang} />
    </div>
  );
}

// ─── TemplateFamilyCard ──────────────────────────────────────────────────────

export function TemplateFamilyCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete} onToggleActive={onToggleActive} onDuplicate={onDuplicate}
      headingFont={FA.serif}
      imageBorderRadius={0}
      cardBg={FA.bg}
    />
  );
}
