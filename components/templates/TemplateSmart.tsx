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
  localizeRole,
} from "./shared";
import type { TPageProps, TCardProps, TPackage, TAgency, TReview } from "./types";
import type { Lang } from "@/lib/translations";

// ─── Smart palette ───────────────────────────────────────────────────────────

const SM = {
  brand:      "#1f5f8e",
  bg:         "#fdfcf9",
  ink:        "#0d1b2e",
  muted:      "rgba(13,27,46,0.55)",
  superMuted: "rgba(13,27,46,0.35)",
  border:     "rgba(13,27,46,0.08)",
  paper:      "#ffffff",
} as const;

const FONT = "var(--font-ibm-plex-sans, sans-serif)";
const MONO = "var(--font-ibm-plex-mono, monospace)";

// ─── Section data helpers ─────────────────────────────────────────────────────

function smFindSec(pkg: TPackage, type: string) {
  return pkg.sections?.find(s => s.type === type) ?? null;
}

function smSecArr(sec: ReturnType<typeof smFindSec>, key: string): unknown[] {
  if (!sec) return [];
  const v = sec.data[key];
  return Array.isArray(v) ? v : [];
}

function smSecStr(sec: ReturnType<typeof smFindSec>, key: string): string {
  if (!sec) return "";
  const v = sec.data[key];
  return typeof v === "string" ? v : "";
}

function smSecNum(sec: ReturnType<typeof smFindSec>, key: string): number {
  if (!sec) return 0;
  const v = sec.data[key];
  return typeof v === "number" ? v : 0;
}

function smSecStrArr(sec: ReturnType<typeof smFindSec>, key: string): string[] {
  return smSecArr(sec, key).map(i => String(i)).filter(Boolean);
}

function smItemStr(item: unknown, key: string): string {
  if (!item || typeof item !== "object") return "";
  const v = (item as Record<string, unknown>)[key];
  return typeof v === "string" ? v : "";
}

// ─── Price parsing (for the transparency comparison + breakdown) ───────────────
// pkg.price is a display string that may carry a currency prefix/suffix
// ("SAR 4,500", "$1,200", "4500 ر.س"). We extract the numeric value, then
// re-emit computed figures with the SAME currency framing so illustrative
// numbers read consistently with the real price. Grouping is done with a plain
// regex (no locale) to stay deterministic across SSR/hydration.
function smPriceParts(raw: string): { num: number; fmt: (v: number) => string } | null {
  const s = String(raw ?? "");
  const m = s.match(/[\d][\d.,]*/);
  if (!m) return null;
  const num = Number(m[0].replace(/,/g, ""));
  if (!isFinite(num) || num <= 0) return null;
  const idx = m.index ?? 0;
  const prefix = s.slice(0, idx);
  const suffix = s.slice(idx + m[0].length);
  const fmt = (v: number) =>
    `${prefix}${Math.round(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}${suffix}`;
  return { num, fmt };
}

// Tabular numerals — applied to every figure so price columns align cleanly.
const SM_NUM = { fontVariantNumeric: "tabular-nums" as const };

// Local strings for the transparency blocks. Kept inline (not in translations.ts)
// to honour the file-scope of this change; covers EN + AR.
const SM_TX: Record<Lang, {
  howCompares: string; thisPackage: string; typicalAgency: string;
  illustrativeComparison: string; illustrativeBreakdown: string;
  accommodation: string; experiences: string; transport: string;
  guideSupport: string; platformFee: string;
}> = {
  en: {
    howCompares: "How this price compares",
    thisPackage: "This package",
    typicalAgency: "Typical agency price",
    illustrativeComparison: "Illustrative comparison",
    illustrativeBreakdown: "Illustrative breakdown",
    accommodation: "Accommodation",
    experiences: "Experiences",
    transport: "Transport",
    guideSupport: "Guide & support",
    platformFee: "Platform fee",
  },
  ar: {
    howCompares: "كيف يقارَن هذا السعر",
    thisPackage: "هذه الباقة",
    typicalAgency: "سعر الوكالات المعتاد",
    illustrativeComparison: "مقارنة توضيحية",
    illustrativeBreakdown: "تفصيل توضيحي",
    accommodation: "الإقامة",
    experiences: "التجارب",
    transport: "النقل",
    guideSupport: "المرشد والدعم",
    platformFee: "رسوم المنصة",
  },
};

// ─── SmCompare — two-bar transparency strip (Packmetrix vs typical agency) ─────
function SmCompare({ pkg, lang, isDesktop }: { pkg: TPackage; lang: Lang; isDesktop: boolean }) {
  const parts = smPriceParts(pkg.price);
  if (!parts) return null;
  const tx = SM_TX[lang];
  const marketPrice = parts.fmt(parts.num * 1.28);

  // Fill is a normal in-flow block sized by width % inside a track. It hugs the
  // inline-start edge, so it grows from the left in LTR and from the right in
  // RTL automatically — no hardcoded left/right.
  const Row = ({ name, pct, fill, value, bold }: {
    name: string; pct: number; fill: string; value: string; bold: boolean;
  }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
      <span style={{ width: isDesktop ? 150 : 104, flexShrink: 0, fontSize: 13, color: SM.muted }}>{name}</span>
      <div style={{ flex: 1, height: 12, background: `${SM.ink}0d`, borderRadius: 6, overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", background: fill, borderRadius: 6 }} />
      </div>
      <span style={{ width: isDesktop ? 110 : 82, flexShrink: 0, textAlign: "end", fontSize: 13.5, fontWeight: bold ? 800 : 700, color: bold ? SM.brand : SM.ink, ...SM_NUM }}>{value}</span>
    </div>
  );

  return (
    <div style={{ background: SM.paper, border: `1px solid ${SM.border}`, borderRadius: 14, padding: isDesktop ? "22px 24px" : "18px 18px", maxWidth: isDesktop ? 560 : undefined }}>
      <p style={{ fontSize: 11, fontWeight: 800, color: SM.superMuted, textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 16px" }}>{tx.howCompares}</p>
      <Row name={tx.thisPackage} pct={78} fill={SM.brand} value={pkg.price} bold />
      <Row name={tx.typicalAgency} pct={100} fill={`${SM.ink}1f`} value={marketPrice} bold={false} />
      <p style={{ fontSize: 12, color: SM.superMuted, margin: "4px 0 0" }}>{tx.illustrativeComparison}</p>
    </div>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SmSecHead({ label, title, isDesktop }: { label?: string; title: string; isDesktop: boolean }) {
  return (
    <div style={{ marginBottom: isDesktop ? 28 : 18 }}>
      {label && (
        <div style={{
          fontFamily: MONO, fontSize: 10, fontWeight: 800, color: SM.superMuted,
          textTransform: "uppercase", letterSpacing: "1.4px", marginBottom: 6,
        }}>
          {label}
        </div>
      )}
      <h2 style={{
        fontSize: isDesktop ? 32 : 22, fontWeight: 800,
        letterSpacing: isDesktop ? "-0.5px" : "-0.3px",
        color: SM.ink, margin: 0, lineHeight: 1.15,
        fontFamily: FONT,
      }}>
        {title}
      </h2>
    </div>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function SmLightbox({ images, startIdx, onClose }: { images: string[]; startIdx: number; onClose: () => void }) {
  const [idx, setIdx] = React.useState(startIdx);
  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [images.length]);

  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <img src={images[idx]} alt="" onClick={e => e.stopPropagation()} style={{ maxWidth: "92vw", maxHeight: "88vh", objectFit: "contain", borderRadius: 10 }} />
      <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", borderRadius: 99, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
        {idx + 1} / {images.length}
      </div>
      <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>
      {images.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); prev(); }} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          <button onClick={e => { e.stopPropagation(); next(); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
        </>
      )}
    </div>
  );
}

// ─── Star rating ──────────────────────────────────────────────────────────────

function SmStars({ rating }: { rating: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} width="12" height="12" viewBox="0 0 24 24"
          fill={n <= rating ? SM.brand : "none"}
          stroke={SM.brand} strokeWidth="2">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  );
}

// ─── SmSection — single section renderer ─────────────────────────────────────

function SmSection({ s, isDesktop, onWhatsApp, lang, agency }: {
  s: NonNullable<TPackage["sections"]>[number];
  isDesktop: boolean;
  onWhatsApp?: () => void;
  lang: Lang;
  agency: TAgency;
}) {
  const t = T[lang];
  const isRtl = lang === "ar";
  const cardStyle: React.CSSProperties = {
    background: SM.paper, border: `1px solid ${SM.border}`, borderRadius: 12, overflow: "hidden",
  };
  const secPad: React.CSSProperties = isDesktop
    ? { padding: "52px 80px", maxWidth: 1180, margin: "0 auto" }
    : { padding: "20px 18px" };

  switch (s.type) {

    // ── Itinerary ─────────────────────────────────────────────────────────────
    case "itinerary": {
      const days = (smSecArr(s as ReturnType<typeof smFindSec>, "days") as Array<{ day?: number; title?: string; desc?: string }>)
        .filter(d => d.title?.trim());
      if (!days.length) return null;
      return (
        <section id="itinerary" style={{ ...secPad, scrollMarginTop: 88 }} data-pmx-section="itinerary">
          <SmSecHead label={t.dayByDay} title={t.yourJourney} isDesktop={isDesktop} />
          <div style={isDesktop
            ? { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }
            : { display: "flex", flexDirection: "column", gap: 8 }}>
            {days.map((d, i) => (
              <div key={i} style={{ ...cardStyle, padding: isDesktop ? "18px 20px" : "14px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                <div style={{
                  width: isDesktop ? 38 : 34, height: isDesktop ? 38 : 34, borderRadius: 10, flexShrink: 0,
                  background: `${SM.brand}12`, border: `1px solid ${SM.brand}28`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: isDesktop ? 12 : 11, fontWeight: 800, color: SM.brand,
                }}>
                  {d.day ?? i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: isDesktop ? 14 : 13, fontWeight: 700, color: SM.ink, lineHeight: 1.3, marginBottom: d.desc ? 4 : 0, direction: isRtl ? "rtl" : "ltr" }}>
                    {d.title}
                  </div>
                  {d.desc && (
                    <div style={{ fontSize: isDesktop ? 13 : 12, color: SM.muted, lineHeight: 1.55, direction: isRtl ? "rtl" : "ltr" }}>
                      {d.desc}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    // ── Highlights ────────────────────────────────────────────────────────────
    case "highlights": {
      const items = smSecStrArr(s as ReturnType<typeof smFindSec>, "items");
      if (!items.length) return null;
      const title = t.smHighlights;
      return (
        <section style={secPad} data-pmx-section="highlights">
          <SmSecHead label={title} title={title} isDesktop={isDesktop} />
          {isDesktop ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
              {items.map((item, i) => (
                <div key={i} style={{ ...cardStyle, padding: "14px 18px", display: "flex", alignItems: "center", gap: 10, direction: isRtl ? "rtl" : "ltr" }}>
                  <span style={{ color: SM.brand, fontWeight: 700, fontSize: 16, flexShrink: 0 }}>✦</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: SM.ink }}>{item}</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {items.map((item, i) => (
                <div key={i} style={{ padding: "7px 14px", borderRadius: 99, background: `${SM.brand}10`, border: `1px solid ${SM.brand}28`, fontSize: 13, fontWeight: 600, color: SM.brand, direction: isRtl ? "rtl" : "ltr" }}>
                  ✦ {item}
                </div>
              ))}
            </div>
          )}
        </section>
      );
    }

    // ── Hotel ─────────────────────────────────────────────────────────────────
    case "hotel": {
      const desc = smSecStr(s as ReturnType<typeof smFindSec>, "description");
      if (!desc) return null;
      return (
        <section id="hotel" style={{ ...secPad, scrollMarginTop: 88 }} data-pmx-section="hotel">
          <SmSecHead label={t.hotelLabel} title={t.hotelSectionTitle} isDesktop={isDesktop} />
          <p style={{ fontSize: isDesktop ? 15 : 14, color: SM.muted, lineHeight: 1.75, margin: 0 }}>{desc}</p>
        </section>
      );
    }

    // ── Inclusions ────────────────────────────────────────────────────────────
    case "inclusions": {
      const includes = smSecStrArr(s as ReturnType<typeof smFindSec>, "includes");
      const excludes = smSecStrArr(s as ReturnType<typeof smFindSec>, "excludes");
      const meals = smSecStr(s as ReturnType<typeof smFindSec>, "meals");
      const visa = smSecStr(s as ReturnType<typeof smFindSec>, "visa");
      if (!includes.length && !excludes.length) return null;
      return (
        <section id="included" style={{ ...secPad, scrollMarginTop: 88 }} data-pmx-section="inclusions">
          <SmSecHead label={t.whatsIncluded} title={t.whatsIncluded} isDesktop={isDesktop} />
          {(meals || visa) && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
              {meals && (
                <span style={{ padding: "5px 13px", borderRadius: 99, background: `${SM.brand}12`, border: `1px solid ${SM.brand}28`, fontSize: 12.5, fontWeight: 700, color: SM.brand }}>
                  {meals}
                </span>
              )}
              {visa && (
                <span style={{ padding: "5px 13px", borderRadius: 99, background: `${SM.brand}12`, border: `1px solid ${SM.brand}28`, fontSize: 12.5, fontWeight: 700, color: SM.brand }}>
                  {visa}
                </span>
              )}
            </div>
          )}
          <div style={isDesktop
            ? { display: "grid", gridTemplateColumns: excludes.length ? "1fr 1fr" : "1fr", gap: 48 }
            : { display: "grid", gridTemplateColumns: excludes.length ? "1fr 1fr" : "1fr", gap: 20 }}>
            {includes.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#16a34a", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.7px" }}>
                  {t.includedLabel}
                </div>
                {includes.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%",
                      background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.22)",
                      flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      marginTop: 2, fontWeight: 800, fontSize: 10, color: "#16a34a",
                    }}>✓</div>
                    <span style={{ fontSize: isDesktop ? 13.5 : 13, color: SM.muted, lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            )}
            {excludes.length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.7px" }}>
                  {t.notIncluded}
                </div>
                {excludes.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: "50%",
                      background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)",
                      flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                      marginTop: 2, fontWeight: 800, fontSize: 10, color: "#ef4444",
                    }}>×</div>
                    <span style={{ fontSize: isDesktop ? 13.5 : 13, color: SM.muted, lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      );
    }

    // ── FAQ ───────────────────────────────────────────────────────────────────
    case "faq": {
      const items = (smSecArr(s as ReturnType<typeof smFindSec>, "items") as Array<{ question?: string; answer?: string }>)
        .filter(it => it?.question?.trim());
      if (!items.length) return null;
      const title = t.frequentlyAsked || (isRtl ? "الأسئلة الشائعة" : "FAQ");
      return (
        <section id="faq" style={{ ...secPad, scrollMarginTop: 88 }} data-pmx-section="faq">
          <SmSecHead title={title} isDesktop={isDesktop} />
          <div style={isDesktop
            ? { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }
            : { display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((it, i) => (
              <div key={i} style={{ ...cardStyle, padding: isDesktop ? "20px 22px" : "14px 16px" }}>
                <div style={{ fontSize: isDesktop ? 14 : 13, fontWeight: 700, color: SM.ink, marginBottom: it.answer ? 8 : 0, direction: isRtl ? "rtl" : "ltr" }}>
                  {it.question}
                </div>
                {it.answer && (
                  <div style={{ fontSize: isDesktop ? 13 : 12, color: SM.muted, lineHeight: 1.6, direction: isRtl ? "rtl" : "ltr" }}>
                    {it.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    }

    // ── Custom ────────────────────────────────────────────────────────────────
    case "custom": {
      const heading = smSecStr(s as ReturnType<typeof smFindSec>, "heading");
      const content = smSecStr(s as ReturnType<typeof smFindSec>, "content");
      const image   = smSecStr(s as ReturnType<typeof smFindSec>, "image");
      if (!heading && !content) return null;
      return (
        <section style={secPad} data-pmx-section="custom">
          {heading && <SmSecHead title={heading} isDesktop={isDesktop} />}
          {isDesktop && image ? (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 40, alignItems: "start" }}>
              <img src={image} alt="" style={{ width: "100%", borderRadius: 12, aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
              {content && <p style={{ fontSize: 15, color: SM.muted, lineHeight: 1.75, margin: 0, direction: isRtl ? "rtl" : "ltr" }}>{content}</p>}
            </div>
          ) : (
            <>
              {image && <img src={image} alt="" style={{ width: "100%", borderRadius: 12, marginBottom: 14, aspectRatio: "16/9", objectFit: "cover", display: "block" }} />}
              {content && <p style={{ fontSize: isDesktop ? 15 : 14, color: SM.muted, lineHeight: 1.75, margin: 0, direction: isRtl ? "rtl" : "ltr" }}>{content}</p>}
            </>
          )}
        </section>
      );
    }

    // ── Extras ────────────────────────────────────────────────────────────────
    case "extras": {
      const items = (smSecArr(s as ReturnType<typeof smFindSec>, "items") as Array<{ name?: string; description?: string; price?: string }>)
        .filter(it => it?.name?.trim());
      if (!items.length) return null;
      return (
        <section style={secPad} data-pmx-section="extras">
          <SmSecHead title={t.sectionExtrasTitle} isDesktop={isDesktop} />
          <div style={isDesktop
            ? { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }
            : { display: "flex", flexDirection: "column", gap: 8 }}>
            {items.map((it, i) => (
              <div key={i} style={{ ...cardStyle, padding: isDesktop ? "18px 22px" : "14px 16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: it.description ? 6 : 0 }}>
                  <div style={{ fontSize: isDesktop ? 14 : 13, fontWeight: 700, color: SM.ink, direction: isRtl ? "rtl" : "ltr" }}>{it.name}</div>
                  {it.price && <div style={{ fontSize: 13, fontWeight: 700, color: SM.brand, whiteSpace: "nowrap" }}>{it.price}</div>}
                </div>
                {it.description && (
                  <div style={{ fontSize: isDesktop ? 13 : 12, color: SM.muted, lineHeight: 1.6, direction: isRtl ? "rtl" : "ltr" }}>{it.description}</div>
                )}
              </div>
            ))}
          </div>
        </section>
      );
    }

    // ── People ────────────────────────────────────────────────────────────────
    case "people": {
      const people = (smSecArr(s as ReturnType<typeof smFindSec>, "people") as Array<{
        name?: string; bio?: string; photo?: string; role?: string; languages?: string[];
      }>).filter(p => p?.name?.trim());
      if (!people.length) return null;
      const title = t.smOurTeam;
      return (
        <section style={secPad} data-pmx-section="people">
          <SmSecHead title={title} isDesktop={isDesktop} />
          <div style={isDesktop
            ? { display: "grid", gridTemplateColumns: `repeat(${Math.min(people.length, 3)}, 1fr)`, gap: 16 }
            : { display: "flex", flexDirection: "column", gap: 10 }}>
            {people.map((p, i) => (
              <div key={i} style={{ ...cardStyle, padding: isDesktop ? "20px 22px" : "16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
                {p.photo ? (
                  <img src={p.photo} alt={p.name} style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 52, height: 52, borderRadius: "50%", background: `${SM.brand}12`, border: `1px solid ${SM.brand}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 800, color: SM.brand, flexShrink: 0 }}>
                    {(p.name || "?").slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: isDesktop ? 15 : 14, fontWeight: 700, color: SM.ink }}>{p.name}</div>
                  {p.role && (
                    <div style={{ fontSize: 11, fontWeight: 600, color: SM.brand, textTransform: "uppercase", letterSpacing: "0.5px", marginTop: 2 }}>{localizeRole(p.role, t)}</div>
                  )}
                  {Array.isArray(p.languages) && p.languages.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 6 }}>
                      {p.languages.map((l: unknown, li: number) => (
                        <span key={li} style={{ fontSize: 10.5, padding: "2px 8px", borderRadius: 99, background: `${SM.brand}10`, color: SM.brand, fontWeight: 600 }}>{String(l)}</span>
                      ))}
                    </div>
                  )}
                  {p.bio && <p style={{ fontSize: isDesktop ? 13 : 12, color: SM.muted, lineHeight: 1.6, margin: "6px 0 0", direction: isRtl ? "rtl" : "ltr" }}>{p.bio}</p>}
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    // ── Guide (legacy) ────────────────────────────────────────────────────────
    case "guide": {
      const name = smSecStr(s as ReturnType<typeof smFindSec>, "name");
      const bio  = smSecStr(s as ReturnType<typeof smFindSec>, "bio");
      const photo = smSecStr(s as ReturnType<typeof smFindSec>, "photo");
      const languages = smSecStrArr(s as ReturnType<typeof smFindSec>, "languages");
      if (!name && !bio) return null;
      return (
        <section style={secPad} data-pmx-section="people">
          <SmSecHead title={t.sectionGuideTitle} isDesktop={isDesktop} />
          <div style={{ ...cardStyle, padding: isDesktop ? "22px 24px" : "16px 18px", display: "flex", gap: 14, alignItems: "flex-start", maxWidth: isDesktop ? 640 : undefined }}>
            {photo && <img src={photo} alt={name} style={{ width: isDesktop ? 80 : 60, height: isDesktop ? 80 : 60, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />}
            <div style={{ flex: 1 }}>
              {name && <div style={{ fontSize: isDesktop ? 17 : 15, fontWeight: 700, color: SM.ink, marginBottom: 4 }}>{name}</div>}
              {languages.length > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: bio ? 8 : 0 }}>
                  {languages.map((l, i) => (
                    <span key={i} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: `${SM.brand}12`, color: SM.brand, fontWeight: 600 }}>{l}</span>
                  ))}
                </div>
              )}
              {bio && <p style={{ fontSize: isDesktop ? 14 : 13, color: SM.muted, lineHeight: 1.65, margin: 0, direction: isRtl ? "rtl" : "ltr" }}>{bio}</p>}
            </div>
          </div>
        </section>
      );
    }

    // ── Important Notes ───────────────────────────────────────────────────────
    case "important_notes": {
      const items = (smSecArr(s as ReturnType<typeof smFindSec>, "items") as Array<{ text?: string }>)
        .filter(it => it?.text?.trim());
      if (!items.length) return null;
      return (
        <section style={secPad} data-pmx-section="important_notes">
          <SmSecHead title={t.sectionImportantNotesTitle} isDesktop={isDesktop} />
          <div style={{
            background: `${SM.brand}07`, border: `1px solid ${SM.brand}22`,
            borderRadius: 14, padding: isDesktop ? "22px 28px" : "16px 18px",
            display: isDesktop && items.length > 3 ? "grid" : "flex",
            gridTemplateColumns: isDesktop && items.length > 3 ? "1fr 1fr" : undefined,
            flexDirection: isDesktop && items.length > 3 ? undefined : "column",
            gap: 12, maxWidth: isDesktop ? 800 : undefined,
          }}>
            {items.map((it, i) => (
              <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span style={{ color: SM.brand, fontSize: 15, lineHeight: 1, marginTop: 2, flexShrink: 0 }}>⚑</span>
                <p style={{ fontSize: isDesktop ? 14 : 13, color: SM.ink, lineHeight: 1.65, margin: 0, direction: isRtl ? "rtl" : "ltr" }}>{it.text}</p>
              </div>
            ))}
          </div>
        </section>
      );
    }

    // ── About Agency ──────────────────────────────────────────────────────────
    case "about_agency": {
      const content = smSecStr(s as ReturnType<typeof smFindSec>, "content");
      const image   = smSecStr(s as ReturnType<typeof smFindSec>, "image");
      if (!content && !image) return null;
      return (
        <section style={secPad} data-pmx-section="about_agency">
          <SmSecHead title={t.sectionAboutAgencyTitle} isDesktop={isDesktop} />
          {isDesktop && image ? (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48, alignItems: "center" }}>
              <div>
                {content && <p style={{ fontSize: 15, color: SM.muted, lineHeight: 1.75, margin: 0, direction: isRtl ? "rtl" : "ltr" }}>{content}</p>}
              </div>
              <img src={image} alt="" style={{ width: "100%", borderRadius: 14, aspectRatio: "4/3", objectFit: "cover", display: "block" }} />
            </div>
          ) : (
            <>
              {image && <img src={image} alt="" style={{ width: "100%", borderRadius: 12, marginBottom: 14, aspectRatio: "16/9", objectFit: "cover", display: "block" }} />}
              {content && <p style={{ fontSize: isDesktop ? 15 : 14, color: SM.muted, lineHeight: 1.75, margin: 0, direction: isRtl ? "rtl" : "ltr" }}>{content}</p>}
            </>
          )}
        </section>
      );
    }

    // ── Departures ────────────────────────────────────────────────────────────
    case "departures":
    case "departure_dates": {
      const dates = (smSecArr(s as ReturnType<typeof smFindSec>, "dates") as Array<{ date?: string; returnDate?: string; price?: string; spots?: string }>)
        .filter(it => it?.date?.trim());
      if (!dates.length) return null;
      return (
        <section id="departures" style={{ ...secPad, scrollMarginTop: 88 }} data-pmx-section="departures">
          <SmSecHead title={t.sectionDepartureDatesTitle} isDesktop={isDesktop} />
          {isDesktop ? (
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(dates.length, 3)}, 1fr)`, gap: 12 }}>
              {dates.map((it, i) => (
                <div key={i} style={{ ...cardStyle, padding: "20px 22px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: SM.ink, marginBottom: 6, direction: isRtl ? "rtl" : "ltr" }}>{it.date}</div>
                  {it.returnDate && <div style={{ fontSize: 12.5, color: SM.muted, marginBottom: 6 }}>→ {it.returnDate}</div>}
                  {it.price && <div style={{ fontSize: 22, fontWeight: 800, color: SM.brand, letterSpacing: "-0.5px", lineHeight: 1 }}>{it.price}</div>}
                  {it.spots && <div style={{ fontSize: 11.5, color: SM.brand, fontWeight: 600, marginTop: 6 }}>{it.spots}</div>}
                </div>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {dates.map((it, i) => (
                <div key={i} style={{ ...cardStyle, padding: "13px 15px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                    <div>
                      <div style={{ fontSize: 13.5, fontWeight: 700, color: SM.ink, direction: isRtl ? "rtl" : "ltr" }}>{it.date}{it.returnDate ? ` → ${it.returnDate}` : ""}</div>
                      {it.spots && <div style={{ fontSize: 11, color: SM.brand, fontWeight: 600, marginTop: 2 }}>{it.spots}</div>}
                    </div>
                    {it.price && <div style={{ fontSize: 15, fontWeight: 800, color: SM.brand, whiteSpace: "nowrap" }}>{it.price}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      );
    }

    // ── Pricing ───────────────────────────────────────────────────────────────
    case "pricing": {
      const tiers = (smSecArr(s as ReturnType<typeof smFindSec>, "tiers") as Array<{ label?: string; price?: string; perks?: string[] }>)
        .filter(tier => tier?.price);
      if (!tiers.length) return null;
      return (
        <section id="pricing" style={{ ...secPad, scrollMarginTop: 88 }} data-pmx-section="pricing">
          <SmSecHead label={t.navPricing} title={t.chooseOption} isDesktop={isDesktop} />
          <div style={isDesktop
            ? { display: "grid", gridTemplateColumns: `repeat(${tiers.length}, 1fr)`, gap: 14 }
            : { display: "flex", flexDirection: "column", gap: 10 }}>
            {tiers.map((tier, i) => {
              const featured = i === 0;
              return (
                <div key={i} style={{
                  background: featured ? SM.brand : SM.paper,
                  border: `1px solid ${featured ? "transparent" : SM.border}`,
                  borderRadius: isDesktop ? 16 : 14,
                  padding: isDesktop ? "26px 26px" : "18px 18px",
                  boxShadow: featured ? `0 8px 24px ${SM.brand}28` : "none",
                }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: featured ? "rgba(255,255,255,0.72)" : SM.muted, marginBottom: 10 }}>{localizeTierLabel(tier.label ?? "", lang)}</div>
                  <div style={{ fontSize: isDesktop ? 40 : 34, fontWeight: 800, letterSpacing: "-1px", lineHeight: 1, color: featured ? "#fff" : SM.ink }}>{tier.price}</div>
                  <div style={{ fontSize: 11, color: featured ? "rgba(255,255,255,0.5)" : SM.superMuted, marginTop: 5, marginBottom: 16 }}>{t.perPerson}</div>
                  {Array.isArray(tier.perks) && tier.perks.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      {(tier.perks as string[]).map((perk: string, pi: number) => (
                        <div key={pi} style={{ display: "flex", gap: 7, alignItems: "flex-start", marginBottom: 6 }}>
                          <span style={{ color: featured ? "rgba(255,255,255,0.8)" : SM.brand, fontSize: 13, flexShrink: 0 }}>✓</span>
                          <span style={{ fontSize: 12.5, color: featured ? "rgba(255,255,255,0.85)" : SM.muted }}>{perk}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {onWhatsApp && <button onClick={onWhatsApp} style={{
                    width: "100%", padding: isDesktop ? "12px" : "10px", borderRadius: 10, border: "none",
                    cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700,
                    background: featured ? "rgba(255,255,255,0.2)" : SM.brand, color: "#fff",
                  }}>
                    {t.bookThisOption}
                  </button>}
                </div>
              );
            })}
          </div>
        </section>
      );
    }

    // ── Transfers ─────────────────────────────────────────────────────────────
    case "transfers": {
      const desc  = smSecStr(s as ReturnType<typeof smFindSec>, "description");
      const items = smSecStrArr(s as ReturnType<typeof smFindSec>, "items");
      if (!desc && !items.length) return null;
      return (
        <section style={secPad} data-pmx-section="transfers">
          <SmSecHead title={t.sectionTransfersTitle} isDesktop={isDesktop} />
          {desc && <p style={{ fontSize: isDesktop ? 15 : 14, color: SM.muted, lineHeight: 1.7, margin: "0 0 14px", direction: isRtl ? "rtl" : "ltr" }}>{desc}</p>}
          {items.length > 0 && (
            <div style={isDesktop
              ? { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }
              : { display: "flex", flexWrap: "wrap", gap: 8 }}>
              {items.map((item, i) => (
                <div key={i} style={{ ...cardStyle, padding: isDesktop ? "12px 16px" : "6px 13px", borderRadius: isDesktop ? 10 : 99, fontSize: isDesktop ? 13.5 : 12.5, color: SM.ink, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ color: SM.brand, fontWeight: 700 }}>✓</span>
                  {item}
                </div>
              ))}
            </div>
          )}
        </section>
      );
    }

    // ── Media ─────────────────────────────────────────────────────────────────
    case "media":
    case "gallery": {
      const rawImages = smSecArr(s as ReturnType<typeof smFindSec>, "images").map(i => String(i)).filter(Boolean);
      const videoUrl  = smSecStr(s as ReturnType<typeof smFindSec>, "videoUrl");
      const mapImage  = smSecStr(s as ReturnType<typeof smFindSec>, "mapImage");
      if (!rawImages.length && !videoUrl && !mapImage) return null;
      return (
        <SmGallerySection images={rawImages} videoUrl={videoUrl} mapImage={mapImage} isDesktop={isDesktop} lang={lang} t={t} />
      );
    }

    // ── Reviews (rendered separately via SmReviews) ───────────────────────────
    case "reviews":
      return null;

    // ── Meals ─────────────────────────────────────────────────────────────────
    case "meals": {
      const plan  = smSecStr(s as ReturnType<typeof smFindSec>, "plan") || "none";
      const notes = smSecStr(s as ReturnType<typeof smFindSec>, "notes");
      const mealKey = plan === "none" ? "mealNone" : plan === "breakfast" ? "mealBreakfast" : plan === "half_board" ? "mealHalfBoard" : plan === "full_board" ? "mealFullBoard" : plan === "all_inclusive" ? "mealAllInclusive" : null;
      const label = mealKey ? t[mealKey] : t.mealNotSpecified;
      return (
        <section style={secPad} data-pmx-section="meals">
          <SmSecHead title={t.sectionMealsTitle} isDesktop={isDesktop} />
          <div style={{ display: "inline-flex", padding: isDesktop ? "8px 20px" : "6px 14px", borderRadius: 99, background: `${SM.brand}12`, border: `1px solid ${SM.brand}28`, fontSize: isDesktop ? 14 : 13, fontWeight: 700, color: SM.brand, marginBottom: notes ? 12 : 0 }}>
            {label}
          </div>
          {notes && <p style={{ fontSize: isDesktop ? 14 : 13, color: SM.muted, lineHeight: 1.7, margin: 0, direction: isRtl ? "rtl" : "ltr" }}>{notes}</p>}
        </section>
      );
    }

    // ── Visa ──────────────────────────────────────────────────────────────────
    case "visa": {
      const included = smSecStr(s as ReturnType<typeof smFindSec>, "included") || "required";
      const content  = smSecStr(s as ReturnType<typeof smFindSec>, "content");
      const visaLabel = included === "included" ? t.visaIncluded : included === "assistance" ? t.visaAssistance : included === "free" ? t.visaFree : t.visaRequired;
      return (
        <section style={secPad} data-pmx-section="visa">
          <SmSecHead title={t.sectionVisaTitle} isDesktop={isDesktop} />
          <div style={{ display: "inline-flex", padding: isDesktop ? "8px 20px" : "6px 14px", borderRadius: 99, background: `${SM.brand}12`, border: `1px solid ${SM.brand}28`, fontSize: isDesktop ? 14 : 13, fontWeight: 700, color: SM.brand, marginBottom: content ? 12 : 0 }}>
            {visaLabel}
          </div>
          {content && <p style={{ fontSize: isDesktop ? 14 : 13, color: SM.muted, lineHeight: 1.7, margin: 0, direction: isRtl ? "rtl" : "ltr" }}>{content}</p>}
        </section>
      );
    }

    // ── Booking Terms ─────────────────────────────────────────────────────────
    case "booking_terms": {
      const text = smSecStr(s as ReturnType<typeof smFindSec>, "content");
      if (!text) return null;
      const title = t.smBookingTerms;
      return (
        <section style={secPad} data-pmx-section="booking_terms">
          <SmSecHead title={title} isDesktop={isDesktop} />
          <div style={{ ...cardStyle, padding: isDesktop ? "22px 28px" : "16px 18px", maxWidth: isDesktop ? 800 : undefined }}>
            <p style={{ fontSize: isDesktop ? 14 : 13, color: SM.muted, lineHeight: 1.8, margin: 0, direction: isRtl ? "rtl" : "ltr", whiteSpace: "pre-wrap" }}>{text}</p>
          </div>
        </section>
      );
    }

    // ── Payment Plan ──────────────────────────────────────────────────────────
    case "payment_plan": {
      const content = smSecStr(s as ReturnType<typeof smFindSec>, "content");
      const steps = (smSecArr(s as ReturnType<typeof smFindSec>, "steps") as Array<{ label?: string; amount?: string; dueDate?: string }>)
        .filter(st => st?.label?.trim());
      if (!content && !steps.length) return null;
      return (
        <section style={secPad} data-pmx-section="payment_plan">
          <SmSecHead title={t.sectionPaymentPlanTitle} isDesktop={isDesktop} />
          {content && <p style={{ fontSize: isDesktop ? 15 : 13.5, color: SM.muted, lineHeight: 1.7, margin: "0 0 16px", direction: isRtl ? "rtl" : "ltr" }}>{content}</p>}
          {steps.length > 0 && (
            <div style={isDesktop
              ? { display: "grid", gridTemplateColumns: `repeat(${Math.min(steps.length, 4)}, 1fr)`, gap: 12 }
              : { display: "flex", flexDirection: "column", gap: 8 }}>
              {steps.map((step, i) => (
                <div key={i} style={isDesktop
                  ? { ...cardStyle, padding: "20px 22px" }
                  : { ...cardStyle, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: isDesktop ? 32 : 24, height: isDesktop ? 32 : 24, borderRadius: "50%",
                    background: SM.brand, color: "#fff",
                    fontSize: isDesktop ? 13 : 11, fontWeight: 700,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, marginBottom: isDesktop ? 12 : 0,
                  }}>{i + 1}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: isDesktop ? 14 : 13, fontWeight: 700, color: SM.ink, marginBottom: 4, direction: isRtl ? "rtl" : "ltr" }}>{step.label}</div>
                    {step.amount && <div style={{ fontSize: isDesktop ? 20 : 14, fontWeight: 800, color: SM.brand, letterSpacing: "-0.4px" }}>{step.amount}</div>}
                    {step.dueDate && <div style={{ fontSize: 11.5, color: SM.muted, marginTop: 3 }}>{step.dueDate}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      );
    }

    // ── Schedule ──────────────────────────────────────────────────────────────
    case "schedule": {
      const items = (smSecArr(s as ReturnType<typeof smFindSec>, "items") as Array<{ time?: string; activity?: string; location?: string }>)
        .filter(it => it?.activity?.trim());
      if (!items.length) return null;
      return (
        <section style={secPad} data-pmx-section="schedule">
          <SmSecHead title={t.sectionScheduleTitle} isDesktop={isDesktop} />
          <div style={{ maxWidth: isDesktop ? 700 : undefined }}>
            {items.map((it, i) => (
              <div key={i} style={{
                display: "flex", gap: isDesktop ? 24 : 14,
                padding: isDesktop ? "14px 0" : "12px 0",
                borderBottom: i < items.length - 1 ? `1px solid ${SM.border}` : "none",
                alignItems: "flex-start",
              }}>
                {it.time && <div style={{ fontSize: isDesktop ? 13 : 12, fontWeight: 700, color: SM.brand, minWidth: isDesktop ? 52 : 44, flexShrink: 0, paddingTop: 2 }}>{it.time}</div>}
                <div>
                  <div style={{ fontSize: isDesktop ? 14 : 13, fontWeight: 600, color: SM.ink, direction: isRtl ? "rtl" : "ltr" }}>{it.activity}</div>
                  {it.location && <div style={{ fontSize: isDesktop ? 12.5 : 12, color: SM.muted, marginTop: 2, direction: isRtl ? "rtl" : "ltr" }}>{it.location}</div>}
                </div>
              </div>
            ))}
          </div>
        </section>
      );
    }

    // ── Map ───────────────────────────────────────────────────────────────────
    case "map": {
      const img = smSecStr(s as ReturnType<typeof smFindSec>, "image");
      const cap = smSecStr(s as ReturnType<typeof smFindSec>, "caption");
      if (!img) return null;
      return (
        <section style={secPad} data-pmx-section="map">
          <img src={img} alt={cap || "Map"} style={{ width: "100%", borderRadius: isDesktop ? 16 : 12, display: "block", objectFit: "cover", aspectRatio: isDesktop ? "21/9" : "16/9" }} />
          {cap && <div style={{ fontSize: 12.5, color: SM.muted, textAlign: "center", marginTop: 10, direction: isRtl ? "rtl" : "ltr" }}>{cap}</div>}
        </section>
      );
    }

    // ── Video ─────────────────────────────────────────────────────────────────
    case "video": {
      const videoUrl = smSecStr(s as ReturnType<typeof smFindSec>, "videoUrl");
      if (!videoUrl) return null;
      const title = t.smVideo;
      return (
        <section style={secPad} data-pmx-section="video">
          <SmSecHead title={title} isDesktop={isDesktop} />
          <video src={videoUrl.includes("#") ? videoUrl : videoUrl + "#t=0.1"} controls muted preload="metadata" style={{ width: "100%", borderRadius: isDesktop ? 16 : 12, background: "#000", maxHeight: isDesktop ? 500 : 280, display: "block" }} />
        </section>
      );
    }

    // ── Flights ───────────────────────────────────────────────────────────────
    case "flights": {
      const departures = (smSecArr(s as ReturnType<typeof smFindSec>, "departures") as Array<{ name?: string; price?: string; date?: string; arrivingAirport?: string; flyingTime?: string; arrivingTime?: string }>)
        .filter(a => a?.name?.trim());
      if (!departures.length) return null;
      return (
        <section style={secPad} data-pmx-section="flights">
          <SmSecHead title={t.departureOptions} isDesktop={isDesktop} />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {departures.map((a, i) => (
              <div key={i} style={{ ...cardStyle, padding: isDesktop ? "16px 22px" : "14px 16px" }}>
                <div style={{ fontSize: isDesktop ? 15 : 14, fontWeight: 700, color: SM.ink, marginBottom: 6 }}>
                  {a.arrivingAirport ? `${a.name} → ${a.arrivingAirport}` : a.name}
                </div>
                {a.date && <div style={{ fontSize: 12, color: SM.muted, marginBottom: 4 }}>{a.date}</div>}
                {a.price && <div style={{ fontSize: isDesktop ? 24 : 20, fontWeight: 800, color: SM.brand, letterSpacing: "-0.5px" }}>{a.price}</div>}
                {onWhatsApp && <button onClick={onWhatsApp} style={{ marginTop: 10, fontSize: 12, color: SM.brand, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                  {t.bookThisFlight}
                </button>}
              </div>
            ))}
          </div>
        </section>
      );
    }

    // ── other_packages ────────────────────────────────────────────────────────
    case "other_packages": {
      const packages = smSecArr(s as ReturnType<typeof smFindSec>, "packages") as Array<Record<string, unknown>>;
      if (!packages.length) return null;
      const heading = smSecStr(s as ReturnType<typeof smFindSec>, "heading") || t.otherPackagesHeading;
      return (
        <section style={{ padding: isDesktop ? "40px 56px" : "32px 18px 0" }} dir={isRtl ? "rtl" : "ltr"} data-pmx-section="other_packages">
          <div style={{ maxWidth: isDesktop ? 1100 : undefined, margin: isDesktop ? "0 auto" : undefined }}>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" as const, color: SM.muted, marginBottom: 14 }}>{heading}</div>
            <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8, scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
              {packages.map((card, i) => {
                const img = typeof card.image === "string" ? card.image : "";
                const title = typeof card.title === "string" ? card.title : "";
                const dest = typeof card.destination === "string" ? card.destination : "";
                const price = typeof card.price === "string" ? card.price : "";
                const nights = typeof card.nights === "string" ? card.nights : "";
                const link = typeof card.link === "string" ? card.link : "";
                return (
                  <a key={i} href={link || undefined} style={{
                    flex: "0 0 195px", minWidth: 195, borderRadius: 10, overflow: "hidden",
                    textDecoration: "none", border: `1px solid ${SM.border}`,
                    background: SM.paper, scrollSnapAlign: "start",
                    display: "flex", flexDirection: "column",
                  }}>
                    <div style={{ width: "100%", height: 120, background: SM.border, flexShrink: 0 }}>
                      {img && <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
                    </div>
                    <div style={{ padding: "10px 12px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                      {dest && <div style={{ fontFamily: FONT, fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" as const, color: SM.brand }}>{dest}</div>}
                      <div style={{ fontFamily: FONT, fontSize: 13.5, fontWeight: 700, color: SM.ink, lineHeight: 1.3 }}>{title}</div>
                      {(nights || price) && (
                        <div style={{ marginTop: "auto", paddingTop: 6, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                          {nights && <span style={{ fontFamily: FONT, fontSize: 11, color: SM.muted }}>{nights}</span>}
                          {price && <span style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: SM.brand }}>{price}</span>}
                        </div>
                      )}
                    </div>
                  </a>
                );
              })}
            </div>
            {agency.agencySlug && (
              <div style={{ marginTop: 14, textAlign: isRtl ? "left" : "right" }}>
                <a href={`/${agency.agencySlug}/packages`} style={{ fontFamily: FONT, fontSize: 12, fontWeight: 700, color: SM.brand, textDecoration: "none" }}>
                  {t.navAllPackages} →
                </a>
              </div>
            )}
          </div>
        </section>
      );
    }

    default:
      return null;
  }
}

// ─── Gallery sub-component (used by media/gallery cases) ─────────────────────

function SmGallerySection({ images, videoUrl, mapImage, isDesktop, lang, t }: {
  images: string[]; videoUrl: string; mapImage: string;
  isDesktop: boolean; lang: Lang; t: typeof T["en"];
}) {
  const [lbIdx, setLbIdx] = React.useState<number | null>(null);
  const isRtl = lang === "ar";
  if (!images.length && !videoUrl && !mapImage) return null;
  return (
    <section style={{ padding: isDesktop ? "52px 80px" : "20px 18px", maxWidth: isDesktop ? 1180 : undefined, margin: isDesktop ? "0 auto" : undefined }} data-pmx-section="media">
      <h2 style={{ fontSize: isDesktop ? 32 : 22, fontWeight: 800, letterSpacing: "-0.4px", color: SM.ink, marginBottom: isDesktop ? 24 : 16, fontFamily: FONT }}>{t.gallery}</h2>
      {videoUrl && (() => {
        const isEmbed = videoUrl.includes("youtube") || videoUrl.includes("youtu.be") || videoUrl.includes("vimeo");
        const embedUrl = (() => {
          const yt = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
          if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
          const vi = videoUrl.match(/vimeo\.com\/(\d+)/);
          if (vi) return `https://player.vimeo.com/video/${vi[1]}`;
          return videoUrl;
        })();
        const h = isDesktop ? 460 : 220;
        return isEmbed
          ? <iframe src={embedUrl} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ width: "100%", height: h, borderRadius: isDesktop ? 14 : 12, border: "none", display: "block", marginBottom: 12 }} />
          : <video src={videoUrl} controls muted playsInline poster={images[0]} style={{ width: "100%", borderRadius: isDesktop ? 14 : 12, background: "#000", maxHeight: h, marginBottom: 12, display: "block" }} />;
      })()}
      {images.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: isDesktop ? "repeat(3, 1fr)" : "1fr 1fr", gap: isDesktop ? 10 : 8 }}>
          {images.slice(0, 6).map((url, i) => (
            <img key={i} src={url} alt="" onClick={() => setLbIdx(i)} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 10, cursor: "pointer", display: "block" }} onError={(e) => { (e.currentTarget as HTMLElement).style.display = "none"; }} />
          ))}
        </div>
      )}
      {mapImage && <img src={mapImage} alt="" style={{ width: "100%", borderRadius: isDesktop ? 14 : 12, marginTop: 12, display: "block", objectFit: "cover", aspectRatio: isDesktop ? "21/9" : "16/9" }} />}
      {lbIdx !== null && <SmLightbox images={images} startIdx={lbIdx} onClose={() => setLbIdx(null)} />}
    </section>
  );
}

// ─── SmSections — render all sections in order ────────────────────────────────

function SmSections({ pkg, isDesktop, onWhatsApp, lang, agency }: {
  pkg: TPackage; isDesktop: boolean; onWhatsApp?: () => void; lang: Lang; agency: TAgency;
}) {
  const sections = pkg.sections;

  // Legacy fallback (no sections[])
  if (!sections?.length) {
    const t = T[lang];
    const inclusions = pkg.includes?.length || (pkg.advantages || []).length || pkg.excludes?.length;
    const isRtl = lang === "ar";
    const cardStyle: React.CSSProperties = { background: SM.paper, border: `1px solid ${SM.border}`, borderRadius: 12 };
    const secPad: React.CSSProperties = isDesktop ? { padding: "52px 80px", maxWidth: 1180, margin: "0 auto" } : { padding: "20px 18px" };

    return (
      <>
        {(pkg.itinerary || []).filter(it => it.title?.trim()).length > 0 && (
          <section id="itinerary" style={{ ...secPad, scrollMarginTop: 88 }}>
            <SmSecHead label={t.dayByDay} title={t.yourJourney} isDesktop={isDesktop} />
            <div style={isDesktop ? { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 } : { display: "flex", flexDirection: "column", gap: 8 }}>
              {(pkg.itinerary || []).filter(it => it.title?.trim()).map((it, i) => (
                <div key={i} style={{ ...cardStyle, padding: isDesktop ? "18px 20px" : "14px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: `${SM.brand}12`, border: `1px solid ${SM.brand}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: SM.brand }}>
                    {it.day}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: SM.ink, lineHeight: 1.3, marginBottom: it.desc ? 4 : 0, direction: isRtl ? "rtl" : "ltr" }}>{it.title}</div>
                    {it.desc && <div style={{ fontSize: 12, color: SM.muted, lineHeight: 1.55, direction: isRtl ? "rtl" : "ltr" }}>{it.desc}</div>}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
        {inclusions && (
          <section id="included" style={{ ...secPad, scrollMarginTop: 88 }}>
            <SmSecHead label={t.whatsIncluded} title={t.whatsIncluded} isDesktop={isDesktop} />
            <div style={{ display: "grid", gridTemplateColumns: (pkg.excludes || []).length ? "1fr 1fr" : "1fr", gap: isDesktop ? 48 : 20 }}>
              {(pkg.includes?.length ? pkg.includes : (pkg.advantages || [])).length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#16a34a", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.7px" }}>{t.includedLabel}</div>
                  {(pkg.includes?.length ? pkg.includes : (pkg.advantages || [])).map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(22,163,74,0.08)", border: "1px solid rgba(22,163,74,0.22)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2, fontWeight: 800, fontSize: 10, color: "#16a34a" }}>✓</div>
                      <span style={{ fontSize: 13, color: SM.muted, lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}
              {(pkg.excludes || []).length > 0 && (
                <div>
                  <div style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.7px" }}>{t.notIncluded}</div>
                  {(pkg.excludes || []).map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                      <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 2, fontWeight: 800, fontSize: 10, color: "#ef4444" }}>×</div>
                      <span style={{ fontSize: 13, color: SM.muted, lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}
        {(pkg.pricingTiers || []).filter(tier => tier.price).length > 0 && (
          <section id="pricing" style={{ ...secPad, scrollMarginTop: 88 }}>
            <SmSecHead label={t.navPricing} title={t.chooseOption} isDesktop={isDesktop} />
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {(pkg.pricingTiers || []).filter(tier => tier.price).map((tier, i) => (
                <div key={i} style={{
                  background: i === 0 ? SM.brand : SM.paper,
                  border: `1px solid ${i === 0 ? "transparent" : SM.border}`,
                  borderRadius: 14, padding: "18px",
                  boxShadow: i === 0 ? `0 8px 24px ${SM.brand}28` : "none",
                }}>
                  <div style={{ fontSize: 12, color: i === 0 ? "rgba(255,255,255,0.7)" : SM.muted, marginBottom: 8 }}>{localizeTierLabel(tier.label, lang)}</div>
                  <div style={{ fontSize: 34, fontWeight: 800, letterSpacing: "-1px", lineHeight: 1, color: i === 0 ? "#fff" : SM.ink }}>{tier.price}</div>
                  <div style={{ fontSize: 11, color: i === 0 ? "rgba(255,255,255,0.5)" : SM.superMuted, marginTop: 5, marginBottom: 14 }}>{t.perPerson}</div>
                  {onWhatsApp && <button onClick={onWhatsApp} style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 700, background: i === 0 ? "rgba(255,255,255,0.2)" : SM.brand, color: "#fff" }}>
                    {t.bookThisOption}
                  </button>}
                </div>
              ))}
            </div>
          </section>
        )}
      </>
    );
  }

  const sorted = [...sections].sort((a, b) => a.order - b.order);
  return (
    <>
      {sorted.map(s => (
        <SmSection key={s.id} s={s} isDesktop={isDesktop} onWhatsApp={onWhatsApp} lang={lang} agency={agency} />
      ))}
    </>
  );
}

// ─── SmReviews ────────────────────────────────────────────────────────────────

function SmReviews({ pkg, agency, isDesktop, lang }: { pkg: TPackage; agency: TAgency; isDesktop: boolean; lang: Lang }) {
  const t = T[lang];
  const [localReviews, setLocalReviews] = React.useState<TReview[]>(() => (pkg.reviews || []).filter(r => r.text?.trim()));
  const addReview = (r: TReview) => setLocalReviews(prev => [...prev, r]);

  if (agency.showReviews === false) return null;

  const reviews = localReviews;
  const hasReviews = reviews.length > 0;
  const avgRating = hasReviews ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const secPad: React.CSSProperties = isDesktop ? { padding: "52px 80px", maxWidth: 1180, margin: "0 auto" } : { padding: "20px 18px" };

  return (
    <>
      {hasReviews && (
        <section style={secPad} data-pmx-section="reviews">
          <div style={isDesktop
            ? { display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28 }
            : { marginBottom: 18 }}>
            <div>
              <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 800, color: SM.superMuted, textTransform: "uppercase", letterSpacing: "1.4px", marginBottom: 6 }}>
                {t.reviewsSectionTitle}
              </div>
              <h2 style={{ fontSize: isDesktop ? 32 : 22, fontWeight: 800, letterSpacing: "-0.4px", color: SM.ink, margin: 0, fontFamily: FONT }}>
                {t.reviewsSectionSubtitle}
              </h2>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, paddingBottom: isDesktop ? 4 : 0, marginTop: isDesktop ? 0 : 10 }}>
              <SmStars rating={Math.round(avgRating)} />
              <span style={{ fontSize: isDesktop ? 20 : 15, fontWeight: 800, color: SM.ink }}>{avgRating.toFixed(1)}</span>
              <span style={{ fontSize: 12, color: SM.muted }}>· {reviews.length} {reviews.length === 1 ? t.reviewLabel : t.reviewsLabel}</span>
            </div>
          </div>
          <div style={isDesktop
            ? { display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }
            : { display: "flex", flexDirection: "column", gap: 10 }}>
            {reviews.map((r, i) => {
              const initials = (r.name || "?").slice(0, 2).toUpperCase();
              return (
                <div key={r.id ?? i} style={{ background: SM.paper, border: `1px solid ${SM.border}`, borderRadius: isDesktop ? 14 : 12, padding: isDesktop ? "22px 22px" : "14px 16px" }}>
                  {isDesktop ? (
                    <>
                      <SmStars rating={r.rating} />
                      <p style={{ fontSize: 13.5, color: SM.muted, lineHeight: 1.65, margin: "10px 0 16px" }}>{r.text}</p>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {r.avatarUrl
                          ? <img src={r.avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                          : <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${SM.brand}15`, border: `1px solid ${SM.brand}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: SM.brand }}>{initials}</div>
                        }
                        <div style={{ fontSize: 13, fontWeight: 700, color: SM.ink }}>{r.name}</div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        {r.avatarUrl
                          ? <img src={r.avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                          : <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${SM.brand}15`, border: `1px solid ${SM.brand}28`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: SM.brand, flexShrink: 0 }}>{initials}</div>
                        }
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: SM.ink }}>{r.name}</div>
                          <SmStars rating={r.rating} />
                        </div>
                      </div>
                      <p style={{ fontSize: 13, color: SM.muted, lineHeight: 1.6, margin: 0 }}>{r.text}</p>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}
      {agency.enableReviews && <SmReviewForm pkg={pkg} isDesktop={isDesktop} lang={lang} onNewReview={addReview} />}
    </>
  );
}

// ─── SmReviewForm ─────────────────────────────────────────────────────────────

function SmReviewForm({ pkg, isDesktop, lang, onNewReview }: {
  pkg: TPackage; isDesktop: boolean; lang: Lang; onNewReview: (r: TReview) => void;
}) {
  const t = T[lang];
  const [name, setName] = React.useState("");
  const [text, setText] = React.useState("");
  const [rating, setRating] = React.useState(5);
  const [hover, setHover] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || !text.trim()) return;
    setSubmitting(true); setError(null);
    try {
      const res = await fetch("/api/submit-review", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id, name: name.trim(), text: text.trim(), rating }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      onNewReview({ id: crypto.randomUUID(), name: name.trim(), text: text.trim(), rating, createdAt: Date.now() });
      setSubmitted(true);
    } catch { setError(t.reviewSubmitError); }
    finally { setSubmitting(false); }
  };

  const secPad: React.CSSProperties = isDesktop ? { padding: "44px 80px", maxWidth: 1180, margin: "0 auto" } : { padding: "20px 18px" };
  const inputStyle: React.CSSProperties = {
    width: "100%", background: SM.paper, border: `1px solid ${SM.border}`,
    borderRadius: 10, padding: "11px 14px", color: SM.ink, fontSize: 13,
    fontFamily: "inherit", outline: "none", boxSizing: "border-box",
  };

  if (submitted) {
    return (
      <section style={secPad} data-pmx-section="reviews">
        <div style={{ padding: "22px 20px", borderRadius: 14, background: `${SM.brand}10`, border: `1px solid ${SM.brand}28`, textAlign: "center" }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>★</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: SM.ink }}>{t.reviewSubmitSuccess}</div>
        </div>
      </section>
    );
  }

  const formContent = (
    <>
      <div style={{ display: "flex", gap: 4, marginBottom: 14 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} onClick={() => setRating(n)} onMouseEnter={() => setHover(n)} onMouseLeave={() => setHover(0)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, fontSize: isDesktop ? 30 : 26, lineHeight: 1, color: n <= (hover || rating) ? SM.brand : SM.border }}>
            ★
          </button>
        ))}
      </div>
      <input value={name} onChange={e => setName(e.target.value)} placeholder={t.reviewYourName} style={{ ...inputStyle, marginBottom: 10 }} />
      <textarea value={text} onChange={e => setText(e.target.value)} placeholder={t.reviewPlaceholder} rows={isDesktop ? 5 : 4}
        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, marginBottom: 12 }} />
      {error && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>{error}</p>}
      <button onClick={handleSubmit} disabled={submitting || !name.trim() || !text.trim()} style={{
        padding: isDesktop ? "13px 28px" : "11px 22px", borderRadius: 10, border: "none",
        cursor: submitting || !name.trim() || !text.trim() ? "not-allowed" : "pointer",
        background: SM.brand, color: "#fff", fontSize: 13, fontWeight: 700,
        fontFamily: "inherit", opacity: submitting || !name.trim() || !text.trim() ? 0.55 : 1,
      }}>
        {submitting ? "…" : t.submitReviewBtn}
      </button>
    </>
  );

  if (isDesktop) {
    return (
      <section style={secPad} data-pmx-section="reviews">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 64, alignItems: "start" }}>
          <div>
            <div style={{ fontFamily: MONO, fontSize: 10, fontWeight: 800, color: SM.superMuted, textTransform: "uppercase", letterSpacing: "1.4px", marginBottom: 8 }}>{t.writeReviewTitle}</div>
            <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: "-0.5px", color: SM.ink, margin: "0 0 12px", fontFamily: FONT }}>{t.writeReviewTitle}</h2>
            <p style={{ fontSize: 14, color: SM.muted, lineHeight: 1.65, margin: 0 }}>{t.writeReviewSub}</p>
          </div>
          <div>{formContent}</div>
        </div>
      </section>
    );
  }

  return (
    <section style={secPad} data-pmx-section="reviews">
      <Eyebrow text={t.writeReviewTitle} brand={SM.brand} />
      <h2 style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.3px", color: SM.ink, margin: "10px 0 6px", fontFamily: FONT }}>{t.writeReviewTitle}</h2>
      <p style={{ fontSize: 13, color: SM.muted, marginBottom: 16 }}>{t.writeReviewSub}</p>
      {formContent}
    </section>
  );
}

// ─── SmCTABanner ──────────────────────────────────────────────────────────────

function SmCTABanner({ pkg, agency, isDesktop, onWhatsApp, onMessenger, lang }: {
  pkg: TPackage; agency: TAgency; isDesktop: boolean;
  onWhatsApp: () => void; onMessenger: () => void; lang: Lang;
}) {
  const t = T[lang];
  if (isDesktop) {
    return (
      <DContainer style={{ padding: "56px 80px" }}>
        <div style={{
          background: `linear-gradient(135deg, ${SM.brand} 0%, ${SM.brand}cc 100%)`,
          borderRadius: 20, padding: "52px 60px", position: "relative", overflow: "hidden",
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 48,
        }}>
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.05, pointerEvents: "none" }} viewBox="0 0 80 80" preserveAspectRatio="xMidYMid slice">
            <defs><pattern id="sm-geo-dt" width="40" height="40" patternUnits="userSpaceOnUse"><polygon points="20,0 40,10 40,30 20,40 0,30 0,10" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#sm-geo-dt)" />
          </svg>
          <div style={{ position: "relative" }}>
            <div style={{ fontSize: 38, fontWeight: 800, color: "#fff", letterSpacing: "-0.8px", lineHeight: 1.1, marginBottom: 10 }}>
              {t.readyToExplore} {pkg.destination}?
            </div>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.65)" }}>{t.reserveSpot}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative", flexShrink: 0 }}>
            {pkg.whatsapp && <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />}
            {pkg.messenger && (
              <button onClick={onMessenger} style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 10, padding: "14px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {t.messageMessenger}
              </button>
            )}
          </div>
        </div>
      </DContainer>
    );
  }

  return (
    <div style={{ padding: "0 18px 28px" }}>
      <div style={{
        background: `linear-gradient(135deg, ${SM.brand} 0%, ${SM.brand}bb 100%)`,
        borderRadius: 18, padding: "28px 22px", position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column", gap: 18,
      }}>
        <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06, pointerEvents: "none" }} viewBox="0 0 80 80" preserveAspectRatio="xMidYMid slice">
          <defs><pattern id="sm-geo-mb" width="40" height="40" patternUnits="userSpaceOnUse"><polygon points="20,0 40,10 40,30 20,40 0,30 0,10" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs>
          <rect width="100%" height="100%" fill="url(#sm-geo-mb)" />
        </svg>
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", lineHeight: 1.2, marginBottom: 6 }}>
            {t.readyToExplore} {pkg.destination}?
          </div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{t.reserveSpot}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
          {pkg.whatsapp && <WAButton label={t.bookWhatsApp} size="lg" full onClick={onWhatsApp} />}
          {pkg.messenger && (
            <button onClick={onMessenger} style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 10, padding: "12px 24px", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
              {t.messageMessenger}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SmMobileFooter ───────────────────────────────────────────────────────────

function SmMobileFooter({ agency }: { agency: TAgency }) {
  const initials = agency.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ padding: "22px 18px", borderTop: `1px solid ${SM.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        {agency.logoUrl
          ? <img src={agency.logoUrl} alt="" style={{ width: 24, height: 24, objectFit: "contain", borderRadius: 5 }} />
          : <div style={{ width: 24, height: 24, borderRadius: 6, background: SM.brand, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff" }}>{initials}</div>
        }
        <div style={{ fontSize: 13, fontWeight: 700, color: SM.ink }}>{agency.name}</div>
      </div>
      <div style={{ fontSize: 10, color: SM.superMuted }}>Powered by PackMetrix</div>
    </div>
  );
}

// ─── TemplateSmartPage ────────────────────────────────────────────────────────

export function TemplateSmartPage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const nights = pkg.nights ? Number(pkg.nights) : null;
  const coverImage = pkg.coverImage || "";
  const title = pkg.title || pkg.destination;
  const isRtl = lang === "ar";
  const isDesktop = useIsDesktop();

  // Breakdown rows — itemised line-items, not pricing tiers. The data model has
  // no stored line-item breakdown, so these are illustrative shares of the base
  // price (40/25/20/10/5 → sums exactly to pkg.price). Labelled "Illustrative
  // breakdown" in the UI so there is no fake precision.
  type BreakdownRow = { l: string; v: string };
  const stx = SM_TX[lang];
  const priceParts = smPriceParts(pkg.price);
  const breakdownIllustrative = !!priceParts;
  const breakdownRows: BreakdownRow[] = priceParts
    ? [
        { l: stx.accommodation, v: priceParts.fmt(priceParts.num * 0.40) },
        { l: stx.experiences,   v: priceParts.fmt(priceParts.num * 0.25) },
        { l: stx.transport,     v: priceParts.fmt(priceParts.num * 0.20) },
        { l: stx.guideSupport,  v: priceParts.fmt(priceParts.num * 0.10) },
        { l: stx.platformFee,   v: priceParts.fmt(priceParts.num * 0.05) },
      ]
    : [{ l: t.perPerson, v: pkg.price }];

  const navLinks = [
    ...((pkg.itinerary || []).some(it => it.title?.trim()) || (pkg.sections?.some(s => s.type === "itinerary")) ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...((pkg.includes?.length || (pkg.advantages || []).length || pkg.excludes?.length || pkg.sections?.some(s => s.type === "inclusions")) ? [{ label: t.navIncluded, href: "#included" }] : []),
    ...((pkg.pricingTiers || []).some(tier => tier.price) || pkg.sections?.some(s => s.type === "pricing") ? [{ label: t.navPricing, href: "#pricing" }] : []),
    ...(pkg.sections?.some(s => s.type === "hotel" || s.type === "hotels") || pkg.hotelDescription ? [{ label: t.navHotel, href: "#hotel" }] : []),
    ...(pkg.sections?.some(s => s.type === "departures") || (pkg.departures ?? []).length ? [{ label: t.navDepartures, href: "#departures" }] : []),
    ...(pkg.sections?.some(s => s.type === "reviews") || (pkg.reviews ?? []).length ? [{ label: t.navReviews, href: "#reviews" }] : []),
    ...(pkg.sections?.some(s => s.type === "faq") ? [{ label: t.navFaq, href: "#faq" }] : []),
  ];

  if (isDesktop) {
    return (
      <div dir={isRtl ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: SM.bg, color: SM.ink, fontFamily: FONT, direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={SM.brand} navLinks={navLinks} lang={lang} onWhatsApp={pkg.whatsapp ? onWhatsApp : undefined} />

        {/* Split hero: image left, text right */}
        <DContainer data-pmx-section="hero" style={{ padding: "56px 80px 48px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 48, alignItems: "center" }}>
            <div style={{ position: "relative", height: 440, borderRadius: 14, overflow: "hidden" }}>
              {coverImage
                ? <img src={coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
                : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${SM.brand}cc, ${SM.brand}55)` }} />
              }
            </div>
            <div>
              <div data-pmx-field="destination"><Eyebrow text={pkg.destination} brand={SM.brand} /></div>
              <h1 data-pmx-field="title" style={{ fontSize: 52, fontWeight: 800, lineHeight: 1.05, letterSpacing: "-1.2px", marginTop: 16, marginBottom: 18, fontFamily: FONT }}>{title}</h1>
              <p style={{ fontSize: 16, color: SM.muted, lineHeight: 1.65, margin: 0 }}>{pkg.description}</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginTop: 28 }}>
                <div data-pmx-field="price" style={{ fontSize: 56, fontWeight: 800, color: SM.brand, letterSpacing: "-1.5px", lineHeight: 1, ...SM_NUM }}>{pkg.price}</div>
                <div style={{ fontSize: 14, color: SM.superMuted }}>{t.perPerson} · {t.allInSuffix}</div>
              </div>
              <div style={{ marginTop: 24 }}>
                {pkg.whatsapp && <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />}
              </div>
            </div>
          </div>
        </DContainer>

        {/* Breakdown */}
        {breakdownRows.length > 0 && (
          <DContainer style={{ padding: "0 80px 56px" }}>
            <Eyebrow text={`${t.whatsInPriceEyebrow} ${pkg.price}`} brand={SM.brand} />
            <h3 style={{ fontSize: 24, fontWeight: 800, letterSpacing: "-0.4px", margin: "8px 0 16px", fontFamily: FONT }}>{t.honestBreakdown}</h3>
            <div style={{ background: SM.paper, border: `1px solid ${SM.border}`, borderRadius: 12, overflow: "hidden", maxWidth: 560 }}>
              {breakdownRows.map((b, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "13px 18px", borderTop: i === 0 ? "none" : `1px solid ${SM.border}` }}>
                  <div style={{ fontSize: 13.5, color: SM.ink }}>{b.l}</div>
                  <div style={{ fontSize: 13.5, fontWeight: 700, ...SM_NUM }}>{b.v}</div>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "14px 18px", background: `${SM.brand}1a`, borderTop: `1px solid ${SM.border}` }}>
                <div style={{ fontSize: 13.5, fontWeight: 800 }}>{t.totalPerPerson}</div>
                <div style={{ fontSize: 20, fontWeight: 800, color: SM.brand, ...SM_NUM }}>{pkg.price}</div>
              </div>
            </div>
            {breakdownIllustrative && (
              <p style={{ fontSize: 12, color: SM.superMuted, margin: "10px 0 0" }}>{stx.illustrativeBreakdown}</p>
            )}
          </DContainer>
        )}

        {/* Transparency comparison strip */}
        <DContainer style={{ padding: "0 80px 56px" }}>
          <SmCompare pkg={pkg} lang={lang} isDesktop={true} />
        </DContainer>

        <SmSections pkg={pkg} isDesktop={true} onWhatsApp={pkg.whatsapp ? onWhatsApp : undefined} lang={lang} agency={agency} />
        <div id="reviews" style={{ scrollMarginTop: 88 }}><SmReviews pkg={pkg} agency={agency} isDesktop={true} lang={lang} /></div>
        <SmCTABanner pkg={pkg} agency={agency} isDesktop={true} onWhatsApp={onWhatsApp} onMessenger={onMessenger} lang={lang} />
        <DesktopFooter agency={agency} brand={SM.brand} />
      </div>
    );
  }

  return (
    <div dir={isRtl ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: SM.bg, color: SM.ink, fontFamily: FONT, direction: isRtl ? "rtl" : "ltr" }}>
      <AgencyBar agency={agency} price={pkg.price} brand={SM.brand} onWhatsApp={pkg.whatsapp ? onWhatsApp : undefined} lang={lang} navLinks={navLinks} />

      {/* Hero */}
      <div data-pmx-section="hero" style={{ position: "relative", height: 230, overflow: "hidden" }}>
        {coverImage
          ? <img src={coverImage} alt={pkg.destination} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", background: `linear-gradient(135deg, ${SM.brand}cc, ${SM.brand}44)` }} />
        }
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5))" }} />
      </div>

      {/* Title + description */}
      <div style={{ padding: "22px 18px 0" }}>
        <div data-pmx-field="destination"><Eyebrow text={pkg.destination} brand={SM.brand} /></div>
        <h1 data-pmx-field="title" style={{ fontSize: 26, fontWeight: 800, color: SM.ink, margin: "10px 0 12px", letterSpacing: "-0.5px", lineHeight: 1.2, fontFamily: FONT }}>
          {title}
        </h1>
        {pkg.description && (
          <p style={{ fontSize: 14, color: SM.muted, lineHeight: 1.7, margin: 0 }}>{pkg.description}</p>
        )}
      </div>

      {/* Price breakdown */}
      <div style={{ padding: "22px 18px 0" }}>
        <div style={{ fontSize: 11, fontWeight: 800, color: SM.superMuted, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>
          {t.whatsInThePriceLabel}
        </div>
        <div style={{ background: SM.paper, border: `1px solid ${SM.border}`, borderRadius: 14, overflow: "hidden" }}>
          {breakdownRows.map((row, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "13px 16px", borderBottom: i < breakdownRows.length - 1 ? `1px solid ${SM.border}` : "none",
            }}>
              <span style={{ fontSize: 13, color: SM.muted }}>{row.l}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: SM.ink }}>{row.v}</span>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "13px 16px", background: `${SM.brand}08`, borderTop: `1px solid ${SM.brand}18` }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: SM.ink }}>{t.totalPerPerson}</span>
            <span style={{ fontSize: 16, fontWeight: 800, color: SM.brand }}>{pkg.price}</span>
          </div>
        </div>
      </div>

      {/* Book CTA inline */}
      <div style={{ padding: "20px 18px 0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, background: SM.paper, border: `1px solid ${SM.border}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 10, color: SM.superMuted, textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: 3 }}>{t.from}</div>
            <div data-pmx-field="price" style={{ fontSize: 26, fontWeight: 800, color: SM.brand, letterSpacing: "-0.5px", lineHeight: 1 }}>{pkg.price}</div>
            <div style={{ fontSize: 11, color: SM.superMuted, marginTop: 3 }}>
              {nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.perPerson}
            </div>
          </div>
          {pkg.whatsapp && <WAButton label={t.bookWhatsApp} size="md" onClick={onWhatsApp} />}
        </div>
      </div>

      <SmSections pkg={pkg} isDesktop={false} onWhatsApp={pkg.whatsapp ? onWhatsApp : undefined} lang={lang} agency={agency} />
      <SmReviews pkg={pkg} agency={agency} isDesktop={false} lang={lang} />
      <SmCTABanner pkg={pkg} agency={agency} isDesktop={false} onWhatsApp={onWhatsApp} onMessenger={onMessenger} lang={lang} />
      <SmMobileFooter agency={agency} />
      <StickyCTA price={pkg.price} nights={nights} label={t.bookWhatsApp} onWhatsApp={pkg.whatsapp ? onWhatsApp : undefined} lang={lang} />
    </div>
  );
}

// ─── TemplateSmartCard ────────────────────────────────────────────────────────

export function TemplateSmartCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete} onToggleActive={onToggleActive} onDuplicate={onDuplicate}
      headingFont={FONT}
      imageBorderRadius={0}
    />
  );
}
