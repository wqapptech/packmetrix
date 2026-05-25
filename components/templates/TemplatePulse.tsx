"use client";

import React, { useEffect, useMemo, useState } from "react";
import { T } from "@/lib/translations";
import { BaseCard, useIsDesktop } from "./shared";
import type { TPageProps, TCardProps, TGalleryItem, TPackage, TAirport } from "./types";

/* ═══════════════════════════════════════════════════════════════════════════
   PULSE — Last-minute deals · Conversion machine
   Palette from pulse.css: cream + ink + deal-red + trust-green
   ═══════════════════════════════════════════════════════════════════════════ */

const PL = {
  bg:     "#faf8f3",
  paper:  "#ffffff",
  ink:    "#0c1118",
  mut:    "rgba(12,17,24,0.6)",
  line:   "rgba(12,17,24,0.1)",
  deal:   "#e2492a",
  dealBg: "#fff1ec",
  trust:  "#16654a",
  warn:   "#b8860b",
  wa:     "#25d366",
} as const;

const MONO = "var(--font-jetbrains-mono, 'JetBrains Mono', monospace)";
const SANS = "var(--font-inter-tight, 'Inter Tight', sans-serif)";

/* ─── CSS animation keyframes (injected via <style> tag) ─────────────────── */

const KF = `
@keyframes pl-blink{0%,100%{opacity:1}50%{opacity:.3}}
@keyframes pl-pulse-green{0%{box-shadow:0 0 0 0 rgba(45,212,160,.6)}70%{box-shadow:0 0 0 6px transparent}100%{box-shadow:0 0 0 0 transparent}}
@keyframes pl-pulse-deal{0%{box-shadow:0 0 0 0 rgba(226,73,42,.4)}70%{box-shadow:0 0 0 6px transparent}100%{box-shadow:0 0 0 0 transparent}}
`;

/* ─── SVG icons (inline — no external dependency) ────────────────────────── */

const Ico = {
  shield: (s = 13) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  wa: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  ),
  messenger: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M12 0C5.373 0 0 4.974 0 11.111c0 3.498 1.744 6.614 4.469 8.683V24l4.088-2.242c1.092.3 2.246.464 3.443.464 6.627 0 12-4.975 12-11.111S18.627 0 12 0zm1.191 14.963l-3.055-3.26-5.963 3.26 6.559-6.963 3.13 3.26 5.889-3.26-6.56 6.963z"/>
    </svg>
  ),
  check: (s = 12) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  spark: (s = 13) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z"/>
    </svg>
  ),
  star: (s = 11) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill={PL.warn} stroke={PL.warn} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  eye: (s = 11) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  clock: (s = 11) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
};

/* ─── Lightbox ───────────────────────────────────────────────────────────── */

type LBImage = { src: string; caption?: string };

function PulseLightbox({
  images, startIdx, onClose,
}: {
  images: LBImage[];
  startIdx: number;
  onClose: () => void;
}) {
  const [idx, setIdx] = useState(startIdx);
  const total = images.length;
  const cur = images[idx];

  const prev = () => setIdx(i => (i - 1 + total) % total);
  const next = () => setIdx(i => (i + 1) % total);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  prev();
      if (e.key === "ArrowRight") next();
      if (e.key === "Escape")     onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [total]);

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, zIndex: 1000,
        background: "rgba(0,0,0,0.92)",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
      }}
    >
      {/* close */}
      <button
        onClick={onClose}
        style={{
          position: "absolute", top: 16, right: 16,
          background: "rgba(255,255,255,0.12)", border: "none",
          color: "#fff", width: 38, height: 38, borderRadius: "50%",
          fontSize: 20, cursor: "pointer", display: "grid", placeItems: "center",
          lineHeight: 1,
        }}
      >×</button>

      {/* image */}
      <div onClick={e => e.stopPropagation()} style={{ position: "relative", maxWidth: "92vw", maxHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <img
          src={cur.src}
          alt={cur.caption ?? ""}
          style={{ maxWidth: "92vw", maxHeight: "80vh", objectFit: "contain", borderRadius: 8, display: "block" }}
        />

        {/* prev */}
        {total > 1 && (
          <button
            onClick={e => { e.stopPropagation(); prev(); }}
            style={{
              position: "absolute", left: -52, top: "50%", transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.15)", border: "none",
              color: "#fff", width: 40, height: 40, borderRadius: "50%",
              fontSize: 20, cursor: "pointer", display: "grid", placeItems: "center",
            }}
          >‹</button>
        )}

        {/* next */}
        {total > 1 && (
          <button
            onClick={e => { e.stopPropagation(); next(); }}
            style={{
              position: "absolute", right: -52, top: "50%", transform: "translateY(-50%)",
              background: "rgba(255,255,255,0.15)", border: "none",
              color: "#fff", width: 40, height: 40, borderRadius: "50%",
              fontSize: 20, cursor: "pointer", display: "grid", placeItems: "center",
            }}
          >›</button>
        )}
      </div>

      {/* caption + counter */}
      <div onClick={e => e.stopPropagation()} style={{ marginTop: 14, textAlign: "center" as const }}>
        {cur.caption && (
          <div style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, marginBottom: 6 }}>{cur.caption}</div>
        )}
        {total > 1 && (
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, fontFamily: MONO }}>
            {idx + 1} / {total}
          </div>
        )}
      </div>

      {/* dot strip */}
      {total > 1 && total <= 12 && (
        <div onClick={e => e.stopPropagation()} style={{ display: "flex", gap: 6, marginTop: 12 }}>
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setIdx(i)}
              style={{
                width: i === idx ? 18 : 7, height: 7, borderRadius: 4,
                background: i === idx ? "#fff" : "rgba(255,255,255,0.3)",
                border: "none", cursor: "pointer", padding: 0,
                transition: "width 0.15s, background 0.15s",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Hooks ──────────────────────────────────────────────────────────────── */

function useCountdown(target: number) {
  const [rem, setRem] = useState(0);
  useEffect(() => {
    const tick = () => setRem(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return {
    d: Math.floor(rem / 86400000),
    h: Math.floor(rem / 3600000) % 24,
    m: Math.floor(rem / 60000) % 60,
    s: Math.floor(rem / 1000) % 60,
  };
}

function useTicker(msgs: string[] | undefined, delay = 2600): string {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!msgs?.length) return;
    const id = setInterval(() => setI(p => (p + 1) % msgs.length), delay);
    return () => clearInterval(id);
  }, [msgs, delay]);
  return msgs?.[i] ?? "";
}

/* ─── Stars ──────────────────────────────────────────────────────────────── */

function Stars({ value, size = 11 }: { value: number; size?: number }) {
  const full = Math.round(value);
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} width={size} height={size} viewBox="0 0 24 24"
          fill={n <= full ? PL.warn : "none"} stroke={PL.warn} strokeWidth={1.5}
          strokeLinecap="round" strokeLinejoin="round">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  );
}

/* ─── Helpers ────────────────────────────────────────────────────────────── */

function p2(n: number) { return String(n).padStart(2, "0"); }

function dayLabel(day: number, isRtl: boolean): string {
  if (!isRtl) return `D${String(day).padStart(2, "0")}`;
  const ar = String(day).replace(/\d/g, d => "٠١٢٣٤٥٦٧٨٩"[+d]);
  return `اليوم ${ar}`;
}

function departureTarget(dateStr?: string): number {
  if (!dateStr) return Date.now() + 9 * 86400000;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? Date.now() + 9 * 86400000 : d.getTime();
}

function agencyInitials(name: string): string {
  return name.split(" ").map(w => w[0] ?? "").slice(0, 2).join("").toUpperCase() || "MT";
}

function toEmbedUrl(url: string): string {
  try {
    if (url.includes("youtu.be/")) {
      const id = url.split("youtu.be/")[1]?.split(/[?&#]/)[0];
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("youtube.com/watch")) {
      const id = new URL(url).searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes("youtube.com/embed")) return url;
  } catch {}
  return url;
}

function parsePriceNum(s: string): number | null {
  if (!s) return null;
  const cleaned = s.replace(/[^0-9.]/g, "");
  const n = parseFloat(cleaned);
  return isNaN(n) ? null : n;
}

function computeSavingLabel(priceWas: string | undefined, price: string): string | null {
  if (!priceWas) return null;
  const was = parsePriceNum(priceWas);
  const cur = parsePriceNum(price);
  if (!was || !cur || was <= cur) return null;
  const diff = Math.round(was - cur);
  const sym = price.match(/^[^0-9]+/)?.[0] ?? "";
  return `${sym}${diff.toLocaleString()}`;
}

/* ─── Blinking dot ───────────────────────────────────────────────────────── */

function BlinkDot({ color = PL.deal, size = 7 }: { color?: string; size?: number }) {
  return (
    <span style={{
      width: size, height: size, borderRadius: "50%", background: color,
      flexShrink: 0, display: "inline-block",
      animation: "pl-blink 1.2s infinite",
    }} />
  );
}

/* ─── Section eyebrow + title (mobile) ───────────────────────────────────── */

function SecHead({ eb, title }: { eb: string; title: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 6,
        fontSize: 10.5, fontWeight: 700, color: PL.deal,
        letterSpacing: 1, textTransform: "uppercase", marginBottom: 8,
      }}>
        <span style={{ width: 14, height: 2, background: PL.deal, display: "inline-block", flexShrink: 0 }} />
        {eb}
      </div>
      <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.7, lineHeight: 1.1, margin: 0 }}>
        {title}
      </h2>
    </div>
  );
}

/* ─── Tier card (shared mobile + desktop) ────────────────────────────────── */

type TierT = (typeof T)["en"];

function TierCard({
  tier, isRtl, t,
}: {
  tier: { label: string; price: string; was?: string; perks?: string[]; pop?: boolean; save?: string };
  isRtl: boolean;
  t: TierT;
}) {
  return (
    <div style={{
      background: PL.paper, borderRadius: 12, padding: 16, position: "relative",
      border: tier.pop ? `1.5px solid ${PL.deal}` : `1.5px solid ${PL.line}`,
      boxShadow: tier.pop ? "0 12px 28px -16px rgba(226,73,42,0.3)" : "none",
    }}>
      {tier.pop && (
        <div style={{
          position: "absolute", top: -10,
          ...(isRtl ? { left: 12 } : { right: 12 }),
          background: PL.deal, color: "#fff",
          fontSize: 10, fontWeight: 800, letterSpacing: 0.4, textTransform: "uppercase",
          padding: "4px 8px", borderRadius: 4,
        }}>
          {t.mostBooked}
        </div>
      )}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.2 }}>{tier.label}</div>
        {tier.save && (
          <div style={{ background: PL.dealBg, color: PL.deal, fontSize: 11, fontWeight: 800, padding: "3px 7px", borderRadius: 4, whiteSpace: "nowrap" }}>
            {tier.save}
          </div>
        )}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 4 }}>
        {tier.was && <span style={{ fontSize: 13, color: PL.mut, textDecoration: "line-through" }}>{tier.was}</span>}
        <span style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1 }}>{tier.price}</span>
      </div>
      <div style={{ fontSize: 11, color: PL.mut, marginTop: 4 }}>{t.perPerson}</div>
      {!!tier.perks?.length && (
        <ul style={{
          listStyle: "none", padding: 0, margin: 0,
          borderTop: `1px solid ${PL.line}`, paddingTop: 12, marginTop: 12,
          display: "flex", flexDirection: "column", gap: 6, fontSize: 12.5,
        }}>
          {tier.perks.map((p, j) => (
            <li key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start", lineHeight: 1.4 }}>
              <span style={{ color: PL.trust, marginTop: 1 }}>{Ico.check(12)}</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SECTIONS RENDERER
   Renders all pkg.sections[] in user-defined order with Pulse styling.
   Skips "reviews" (rendered from pkg.reviews separately).
   ═══════════════════════════════════════════════════════════════════════════ */

type SectionT = { id: string; type: string; order: number; data: Record<string, unknown> };
type TranslationT = (typeof T)["en"];

function PulseSection({
  s, t, isRtl, onWhatsApp, desktop, onImageClick,
}: { s: SectionT; t: TranslationT; isRtl: boolean; onWhatsApp: () => void; desktop: boolean; onImageClick?: (images: LBImage[], idx: number) => void }) {
  const d = s.data;

  function SH({ label, title }: { label: string; title?: string }) {
    if (desktop) {
      return (
        <div style={{ marginBottom: 18, paddingBottom: 12, borderBottom: `2px solid ${PL.ink}` }}>
          <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8, margin: 0, lineHeight: 1.1 }}>{title || label}</h2>
        </div>
      );
    }
    return <SecHead eb={label} title={title || label} />;
  }

  function Card({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
    return (
      <div style={{ background: PL.paper, border: `1px solid ${PL.line}`, borderRadius: 12, overflow: "hidden", ...style }}>
        {children}
      </div>
    );
  }

  const wrap = desktop ? {} : { padding: "32px 14px 28px" };

  switch (s.type) {

    /* ── inclusions ─────────────────────────────────────────────────────── */
    case "inclusions": {
      const includes = (d.includes as string[] | undefined) ?? [];
      const excludes = (d.excludes as string[] | undefined) ?? [];
      if (!includes.length && !excludes.length) return null;
      const inclCols = desktop ? "repeat(3,1fr)" : "1fr 1fr";
      return (
        <div id="pl-inclusions" style={wrap}>
          <SH label={t.includedLabel} title={t.everythingIncluded} />
          {includes.length > 0 && (
            <div style={{ display: "grid", gridTemplateColumns: inclCols, gap: 10, marginBottom: excludes.length ? 20 : 0 }}>
              {includes.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start", background: PL.paper, border: `1px solid ${PL.line}`, borderRadius: 10, padding: "12px 14px" }}>
                  <span style={{ color: PL.trust, flexShrink: 0, marginTop: 1 }}>{Ico.check(12)}</span>
                  <span style={{ fontSize: 13, lineHeight: 1.45 }}>{item}</span>
                </div>
              ))}
            </div>
          )}
          {excludes.length > 0 && (
            <div style={{ borderTop: includes.length ? `1px solid ${PL.line}` : "none", paddingTop: includes.length ? 16 : 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: PL.mut, letterSpacing: 0.4, textTransform: "uppercase" as const, marginBottom: 10 }}>{t.notIncluded}</div>
              <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
                {excludes.map((item, i) => (
                  <div key={i} style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 13, color: PL.mut }}>
                    <span style={{ color: PL.deal, fontWeight: 800, flexShrink: 0 }}>×</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      );
    }

    /* ── highlights ─────────────────────────────────────────────────────── */
    case "highlights": {
      const items = (d.items as string[] | undefined) ?? [];
      if (!items.length) return null;
      return (
        <div id="pl-highlights" style={wrap}>
          <SH label={t.sectionHighlightsTitle} title={t.sectionHighlightsTitle} />
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
            {items.map((item, i) => (
              <div key={i} style={{ background: PL.dealBg, color: PL.deal, borderRadius: 20, padding: "7px 14px", fontSize: 13, fontWeight: 600, letterSpacing: -0.1 }}>
                {item}
              </div>
            ))}
          </div>
        </div>
      );
    }

    /* ── hotel ──────────────────────────────────────────────────────────── */
    case "hotel": {
      const desc = d.description as string | undefined;
      if (!desc) return null;
      return (
        <div id="pl-hotel" style={wrap}>
          <SH label={t.hotelLabel} title={t.hotelLabel} />
          <Card style={{ padding: 18 }}>
            <p style={{ fontSize: desktop ? 15 : 13.5, color: PL.mut, lineHeight: 1.7, margin: 0 }}>{desc}</p>
          </Card>
        </div>
      );
    }

    /* ── faq ────────────────────────────────────────────────────────────── */
    case "faq": {
      const items = (d.items as { question: string; answer: string }[] | undefined) ?? [];
      if (!items.length) return null;
      return (
        <div id="pl-faq" style={wrap}>
          <SH label={t.frequentlyAsked} title={t.frequentlyAsked} />
          <Card>
            {items.map((item, i) => (
              <div key={i} style={{ padding: "16px 18px", borderBottom: i < items.length - 1 ? `1px solid ${PL.line}` : "none" }}>
                <div style={{ fontSize: desktop ? 15 : 14, fontWeight: 700, letterSpacing: -0.2, marginBottom: 8 }}>{item.question}</div>
                <div style={{ fontSize: desktop ? 14 : 13, color: PL.mut, lineHeight: 1.6 }}>{item.answer}</div>
              </div>
            ))}
          </Card>
        </div>
      );
    }

    /* ── flights ────────────────────────────────────────────────────────── */
    case "flights": {
      const deps = (d.departures as TAirport[] | undefined) ?? [];
      if (!deps.length) return null;
      return (
        <div style={wrap}>
          <SH label={t.flightsLabel} title={t.flightsLabel} />
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 10 }}>
            {deps.map((dep, i) => (
              <div key={i} onClick={onWhatsApp} style={{ background: PL.paper, border: `1px solid ${PL.line}`, borderRadius: 12, padding: 16, cursor: "pointer" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.3 }}>{dep.name}</div>
                    {dep.arrivingAirport?.trim() && <div style={{ fontSize: 11.5, color: PL.mut, marginTop: 4 }}>→ {dep.arrivingAirport}</div>}
                    {dep.flyingTime?.trim() && <div style={{ fontSize: 11.5, color: PL.mut, marginTop: 2 }}>{dep.flyingTime}</div>}
                    {dep.arrivingTime?.trim() && <div style={{ fontSize: 11.5, color: PL.mut, marginTop: 2 }}>{dep.arrivingTime}</div>}
                    {dep.date?.trim() && <div style={{ fontSize: 11.5, color: PL.mut, marginTop: 2 }}>{dep.date}</div>}
                  </div>
                  <div style={{ textAlign: isRtl ? "left" : "right", flexShrink: 0 }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: PL.deal, letterSpacing: -0.5 }}>{dep.price}</div>
                    <div style={{ fontSize: 11, color: PL.wa, fontWeight: 600, marginTop: 4 }}>{t.bookWhatsApp}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    /* ── departure_dates ────────────────────────────────────────────────── */
    case "departures":
    case "departure_dates": {
      const dates = (d.entries as { date: string; returnDate?: string; price?: string; spots?: string | number }[] | undefined)
        ?? (d.dates as { date: string; returnDate: string; price: string; spots: string }[] | undefined)
        ?? [];
      if (!dates.length) return null;
      return (
        <div id="pl-departures" style={wrap}>
          <SH label={t.sectionDepartureDatesTitle} title={t.sectionDepartureDatesTitle} />
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {dates.map((dep, i) => (
              <button key={i} onClick={onWhatsApp} style={{ background: PL.paper, border: `1.5px solid ${PL.line}`, borderRadius: 10, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", cursor: "pointer", textAlign: isRtl ? "right" : "left", fontFamily: SANS, width: "100%" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.3 }}>{dep.date}</div>
                  {dep.returnDate && <div style={{ fontSize: 11.5, color: PL.mut, marginTop: 3 }}>{dep.returnDate}</div>}
                  {dep.spots && <div style={{ fontSize: 11.5, color: PL.mut, marginTop: 2 }}>{dep.spots} {t.spotsAvailable}</div>}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5 }}>{dep.price}</div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    /* ── itinerary ──────────────────────────────────────────────────────── */
    case "itinerary": {
      const days = (d.days as { day: number; title: string; desc: string; chapter?: string }[] | undefined) ?? [];
      if (!days.length) return null;
      return (
        <div id="pl-itinerary" style={wrap}>
          <SH label={`${t.dayByDay} · ${days.length} ${t.daysLabel.toLowerCase()}`} title={`${t.dayByDay} · ${days.length} ${t.daysLabel.toLowerCase()}`} />
          <div style={{ background: PL.paper, border: `1px solid ${PL.line}`, borderRadius: 12, overflow: "hidden" }}>
            {days.map((d, i) => (
              <div key={i} style={{ padding: desktop ? "16px 20px" : "14px 16px", borderBottom: i < days.length - 1 ? `1px solid ${PL.line}` : "none", display: "grid", gridTemplateColumns: desktop ? "80px 1fr" : "auto 1fr", gap: desktop ? 22 : 14, alignItems: "start" }}>
                <div style={{ background: PL.dealBg, color: PL.deal, borderRadius: 8, padding: desktop ? 10 : "8px 10px", textAlign: "center", minWidth: 52 }}>
                  <div style={{ fontSize: desktop ? 22 : 16, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1 }}>{dayLabel(d.day, isRtl)}</div>
                  {d.chapter && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" as const, marginTop: 3 }}>{d.chapter}</div>}
                </div>
                <div style={{ paddingTop: 2 }}>
                  <div style={{ fontSize: 11, color: PL.mut, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" as const }}>{t.dayLabel} {d.day}</div>
                  <div style={{ fontSize: desktop ? 15 : 14, fontWeight: 700, letterSpacing: -0.2 }}>{d.title}</div>
                  <div style={{ fontSize: desktop ? 13 : 12.5, color: PL.mut, lineHeight: 1.55, marginTop: 6 }}>{d.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    /* ── gallery ────────────────────────────────────────────────────────── */
    case "gallery": {
      const rawImages = (d.images as string[] | undefined) ?? [];
      if (!rawImages.length) return null;
      const lbImages: LBImage[] = rawImages.map(src => ({ src }));
      const clickable = (i: number): React.CSSProperties => onImageClick
        ? { cursor: "pointer" }
        : {};
      if (desktop) {
        return (
          <div id="pl-gallery" style={wrap}>
            <SH label={t.gallery} title={t.gallery} />
            <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gridTemplateRows: "180px 180px", gap: 6 }}>
              {lbImages.slice(0, 5).map((img, i) => (
                <div key={i} onClick={() => onImageClick?.(lbImages, i)} style={{ overflow: "hidden", borderRadius: 8, gridRow: i === 0 ? "span 2" : undefined, ...clickable(i) }}>
                  <img src={img.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.2s", display: "block" }} />
                </div>
              ))}
            </div>
          </div>
        );
      }
      return (
        <div id="pl-gallery" style={wrap}>
          <SH label={t.gallery} title={t.gallery} />
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gridTemplateRows: "130px 130px", gap: 4 }}>
            {lbImages.slice(0, 3).map((img, i) => (
              <div key={i} onClick={() => onImageClick?.(lbImages, i)} style={{ overflow: "hidden", borderRadius: 8, gridRow: i === 0 ? "span 2" : undefined, ...clickable(i) }}>
                <img src={img.src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            ))}
          </div>
        </div>
      );
    }

    /* ── pricing ────────────────────────────────────────────────────────── */
    case "pricing": {
      const tiers = (d.tiers as { label: string; price: string; was?: string; perks?: string[]; pop?: boolean; save?: string }[] | undefined) ?? [];
      if (!tiers.length) return null;
      return (
        <div id="pl-pricing" style={wrap}>
          <SH label={t.navPricing} title={t.navPricing} />
          <div style={{ display: desktop ? "grid" : "flex", gridTemplateColumns: desktop ? "repeat(3,1fr)" : undefined, flexDirection: desktop ? undefined : "column" as const, gap: 10 }}>
            {tiers.map((tier, i) => <TierCard key={i} tier={tier} isRtl={isRtl} t={t} />)}
          </div>
        </div>
      );
    }

    /* ── booking_terms ──────────────────────────────────────────────────── */
    case "booking_terms": {
      const content = d.content as string | undefined;
      if (!content) return null;
      return (
        <div style={wrap}>
          <SH label={t.sectionBookingTermsTitle} title={t.sectionBookingTermsTitle} />
          <Card style={{ padding: 18 }}>
            <p style={{ fontSize: 13, color: PL.mut, lineHeight: 1.75, margin: 0, whiteSpace: "pre-wrap" }}>{content}</p>
          </Card>
        </div>
      );
    }

    /* ── payment_plan ───────────────────────────────────────────────────── */
    case "payment_plan": {
      const content = d.content as string | undefined;
      const steps = (d.steps as { label: string; amount: string; dueDate: string }[] | undefined) ?? [];
      if (!content && !steps.length) return null;
      return (
        <div style={wrap}>
          <SH label={t.sectionPaymentPlanTitle} title={t.sectionPaymentPlanTitle} />
          <Card>
            {content && (
              <div style={{ padding: "16px 18px", borderBottom: steps.length ? `1px solid ${PL.line}` : "none" }}>
                <p style={{ fontSize: 13.5, color: PL.ink, lineHeight: 1.6, margin: 0 }}>{content}</p>
              </div>
            )}
            {steps.map((step, i) => (
              <div key={i} style={{ padding: "14px 18px", borderBottom: i < steps.length - 1 ? `1px solid ${PL.line}` : "none", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 700 }}>{step.label}</div>
                  {step.dueDate && <div style={{ fontSize: 11.5, color: PL.mut, marginTop: 3 }}>{step.dueDate}</div>}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: PL.deal, flexShrink: 0 }}>{step.amount}</div>
              </div>
            ))}
          </Card>
        </div>
      );
    }

    /* ── important_notes ────────────────────────────────────────────────── */
    case "important_notes": {
      const items = (d.items as { text: string }[] | undefined) ?? [];
      if (!items.length) return null;
      return (
        <div style={wrap}>
          <SH label={t.sectionImportantNotesTitle} title={t.sectionImportantNotesTitle} />
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", background: "#fffbeb", border: "1px solid #f5e090", borderRadius: 10, padding: "12px 14px" }}>
                <span style={{ color: PL.warn, flexShrink: 0, marginTop: 1, fontWeight: 800, fontSize: 14, lineHeight: 1 }}>!</span>
                <span style={{ fontSize: 13, color: PL.ink, lineHeight: 1.55 }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    /* ── meals ──────────────────────────────────────────────────────────── */
    case "meals": {
      const plan = d.plan as string | undefined;
      const notes = d.notes as string | undefined;
      if (!plan && !notes) return null;
      return (
        <div style={wrap}>
          <SH label={t.sectionMealsTitle} title={t.sectionMealsTitle} />
          <Card style={{ padding: 16 }}>
            {plan && (
              <div style={{ display: "inline-flex", alignItems: "center", background: PL.dealBg, color: PL.deal, borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 700, marginBottom: notes ? 12 : 0 }}>
                {plan}
              </div>
            )}
            {notes && <p style={{ fontSize: 13, color: PL.mut, lineHeight: 1.65, margin: 0 }}>{notes}</p>}
          </Card>
        </div>
      );
    }

    /* ── transfers ──────────────────────────────────────────────────────── */
    case "transfers": {
      const description = d.description as string | undefined;
      const items = (d.items as string[] | undefined) ?? [];
      if (!description && !items.length) return null;
      return (
        <div style={wrap}>
          <SH label={t.sectionTransfersTitle} title={t.sectionTransfersTitle} />
          <Card style={{ padding: 16 }}>
            {description && <p style={{ fontSize: desktop ? 14 : 13.5, color: PL.ink, lineHeight: 1.65, margin: items.length ? "0 0 14px" : 0 }}>{description}</p>}
            {items.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8 }}>
                {items.map((item, i) => (
                  <div key={i} style={{ background: PL.bg, border: `1px solid ${PL.line}`, borderRadius: 8, padding: "5px 10px", fontSize: 12.5, fontWeight: 500 }}>{item}</div>
                ))}
              </div>
            )}
          </Card>
        </div>
      );
    }

    /* ── visa ───────────────────────────────────────────────────────────── */
    case "visa": {
      const included = d.included as string | undefined;
      const content = d.content as string | undefined;
      if (!included && !content) return null;
      const isIncl = !!(included?.toLowerCase().includes("yes") || included?.toLowerCase().includes("included") || included?.toLowerCase().includes("مشمول"));
      return (
        <div style={wrap}>
          <SH label={t.sectionVisaTitle} title={t.sectionVisaTitle} />
          <Card style={{ padding: 16 }}>
            {included && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: isIncl ? "rgba(22,101,74,0.08)" : PL.dealBg, color: isIncl ? PL.trust : PL.deal, borderRadius: 20, padding: "6px 14px", fontSize: 13, fontWeight: 700, marginBottom: content ? 12 : 0 }}>
                {included}
              </div>
            )}
            {content && <p style={{ fontSize: 13, color: PL.mut, lineHeight: 1.65, margin: 0 }}>{content}</p>}
          </Card>
        </div>
      );
    }

    /* ── extras ─────────────────────────────────────────────────────────── */
    case "extras": {
      const items = (d.items as { name: string; description: string; price: string }[] | undefined) ?? [];
      if (!items.length) return null;
      return (
        <div style={wrap}>
          <SH label={t.sectionExtrasTitle} title={t.sectionExtrasTitle} />
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, background: PL.paper, border: `1px solid ${PL.line}`, borderRadius: 10, padding: "14px 16px" }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{item.name}</div>
                  {item.description && <div style={{ fontSize: 12.5, color: PL.mut, marginTop: 5, lineHeight: 1.45 }}>{item.description}</div>}
                </div>
                {item.price && <div style={{ fontSize: 20, fontWeight: 800, color: PL.deal, flexShrink: 0 }}>{item.price}</div>}
              </div>
            ))}
          </div>
        </div>
      );
    }

    /* ── guide ──────────────────────────────────────────────────────────── */
    case "guide": {
      const name = d.name as string | undefined;
      const bio = d.bio as string | undefined;
      const photo = d.photo as string | undefined;
      const languages = (d.languages as string[] | undefined) ?? [];
      if (!name) return null;
      return (
        <div style={wrap}>
          <SH label={t.sectionGuideTitle} title={name} />
          <Card style={{ padding: 18 }}>
            <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
              {photo ? (
                <img src={photo} alt={name} style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 72, height: 72, borderRadius: "50%", background: PL.dealBg, display: "grid", placeItems: "center", flexShrink: 0, fontSize: 26, fontWeight: 700, color: PL.deal }}>
                  {name.charAt(0)}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{name}</div>
                {bio && <p style={{ fontSize: 13, color: PL.mut, lineHeight: 1.55, margin: "8px 0 0" }}>{bio}</p>}
                {languages.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginTop: 12 }}>
                    {languages.map((lang, i) => (
                      <div key={i} style={{ background: PL.bg, border: `1px solid ${PL.line}`, borderRadius: 6, padding: "3px 8px", fontSize: 11.5, fontWeight: 500 }}>{lang}</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      );
    }

    /* ── about_agency ───────────────────────────────────────────────────── */
    case "about_agency": {
      const content = d.content as string | undefined;
      const image = d.image as string | undefined;
      if (!content) return null;
      return (
        <div style={wrap}>
          <SH label={t.sectionAboutAgencyTitle} title={t.sectionAboutAgencyTitle} />
          <Card>
            {image && <img src={image} alt="" style={{ width: "100%", height: desktop ? 240 : 160, objectFit: "cover", display: "block" }} />}
            <div style={{ padding: 18 }}>
              <p style={{ fontSize: desktop ? 15 : 13.5, color: PL.mut, lineHeight: 1.7, margin: 0 }}>{content}</p>
            </div>
          </Card>
        </div>
      );
    }

    /* ── schedule ───────────────────────────────────────────────────────── */
    case "schedule": {
      const items = (d.items as { time: string; activity: string; location: string }[] | undefined) ?? [];
      if (!items.length) return null;
      return (
        <div style={wrap}>
          <SH label={t.sectionScheduleTitle} title={t.sectionScheduleTitle} />
          <Card>
            {items.map((item, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: desktop ? "100px 1fr" : "72px 1fr", borderBottom: i < items.length - 1 ? `1px solid ${PL.line}` : "none" }}>
                <div style={{ background: PL.bg, padding: "14px 10px", fontFamily: MONO, fontSize: 13, fontWeight: 700, color: PL.deal, borderRight: `1px solid ${PL.line}`, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center" as const }}>
                  {item.time}
                </div>
                <div style={{ padding: "14px 16px" }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>{item.activity}</div>
                  {item.location && <div style={{ fontSize: 11.5, color: PL.mut, marginTop: 4 }}>{item.location}</div>}
                </div>
              </div>
            ))}
          </Card>
        </div>
      );
    }

    /* ── custom ─────────────────────────────────────────────────────────── */
    case "custom": {
      const heading = d.heading as string | undefined;
      const content = d.content as string | undefined;
      const image = d.image as string | undefined;
      if (!heading && !content) return null;
      return (
        <div style={wrap}>
          {heading && <SH label="" title={heading} />}
          {image && <img src={image} alt={heading ?? ""} style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 12, marginBottom: 16, display: "block" }} />}
          {content && (
            <Card style={{ padding: 18 }}>
              <p style={{ fontSize: desktop ? 15 : 13.5, color: PL.mut, lineHeight: 1.7, margin: 0 }}>{content}</p>
            </Card>
          )}
        </div>
      );
    }

    /* ── map ────────────────────────────────────────────────────────────── */
    case "map": {
      const image = d.image as string | undefined;
      const caption = d.caption as string | undefined;
      if (!image) return null;
      return (
        <div style={wrap}>
          <SH label={t.sectionMapTitle} title={caption || t.sectionMapTitle} />
          <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${PL.line}` }}>
            <img src={image} alt={caption ?? ""} style={{ width: "100%", display: "block", maxHeight: desktop ? 400 : 240, objectFit: "cover" }} />
            {caption && (
              <div style={{ padding: "10px 14px", background: PL.paper, fontSize: 12.5, color: PL.mut }}>{caption}</div>
            )}
          </div>
        </div>
      );
    }

    /* ── video ──────────────────────────────────────────────────────────── */
    case "video": {
      const videoUrl = (d.videoUrl as string | undefined)?.trim();
      if (!videoUrl) return null;
      const isYT = videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
      const isVimeo = videoUrl.includes("vimeo.com");
      return (
        <div style={wrap}>
          <SH label={t.sectionVideoTitle} title={t.sectionVideoTitle} />
          <div style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "16/9", border: `1px solid ${PL.line}`, background: "#000" }}>
            {(isYT || isVimeo) ? (
              <iframe
                src={toEmbedUrl(videoUrl)}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ width: "100%", height: "100%", border: "none", display: "block" }}
              />
            ) : (
              <video
                src={videoUrl}
                controls
                playsInline
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
              />
            )}
          </div>
        </div>
      );
    }

    /* ── people ─────────────────────────────────────────────────────────── */
    case "people": {
      const people = (d.people as Array<{ id?: string; name: string; role?: string; bio?: string; photo?: string; languages?: string[]; years?: number; repliesIn?: string }> | undefined) ?? [];
      if (!people.length) return null;
      return (
        <div id="pl-people" style={wrap}>
          <SH label={t.sectionGuideTitle} title={t.sectionGuideTitle} />
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 12 }}>
            {people.map((person, i) => (
              <Card key={person.id ?? i} style={{ padding: 18 }}>
                <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
                  {person.photo ? (
                    <img src={person.photo} alt={person.name} style={{ width: 64, height: 64, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: PL.dealBg, display: "grid", placeItems: "center", flexShrink: 0, fontSize: 22, fontWeight: 700, color: PL.deal }}>
                      {person.name.charAt(0)}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>{person.name}</div>
                    {person.role && <div style={{ fontSize: 11, fontWeight: 600, color: PL.mut, textTransform: "uppercase" as const, letterSpacing: 0.4, marginTop: 2 }}>{person.role}</div>}
                    {person.bio && <p style={{ fontSize: 13, color: PL.mut, lineHeight: 1.55, margin: "8px 0 0" }}>{person.bio}</p>}
                    {!!person.languages?.length && (
                      <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6, marginTop: 10 }}>
                        {person.languages.map((lang, j) => (
                          <div key={j} style={{ background: PL.bg, border: `1px solid ${PL.line}`, borderRadius: 6, padding: "3px 8px", fontSize: 11.5, fontWeight: 500 }}>{lang}</div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      );
    }

    /* ── media ──────────────────────────────────────────────────────────── */
    case "media": {
      const images  = (d.images as string[] | undefined) ?? [];
      const videoUrl = (d.videoUrl as string | undefined)?.trim();
      const mapImage = d.mapImage as string | undefined;
      const mapCaption = d.mapCaption as string | undefined;
      if (!images.length && !videoUrl && !mapImage) return null;
      const isYT    = videoUrl ? (videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be")) : false;
      const isVimeo = videoUrl ? videoUrl.includes("vimeo.com") : false;
      return (
        <div id="pl-media" style={wrap}>
          {images.length > 0 && (
            <>
              <SH label={t.gallery} title={t.gallery} />
              <div style={{ display: "grid", gridTemplateColumns: desktop ? "repeat(3,1fr)" : "1.5fr 1fr", gridTemplateRows: desktop ? undefined : "130px 130px", gap: 4, marginBottom: (videoUrl || mapImage) ? 24 : 0 }}>
                {(desktop ? images : images.slice(0, 3)).map((src, i) => (
                  <div key={i} onClick={() => onImageClick?.(images.map(s => ({ src: s })), i)} style={{ overflow: "hidden", borderRadius: 8, gridRow: !desktop && i === 0 ? "span 2" : undefined, cursor: onImageClick ? "pointer" : "default", aspectRatio: desktop ? "4/3" : undefined }}>
                    <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                ))}
              </div>
            </>
          )}
          {videoUrl && (
            <div style={{ borderRadius: 12, overflow: "hidden", aspectRatio: "16/9", border: `1px solid ${PL.line}`, background: "#000", marginBottom: mapImage ? 24 : 0 }}>
              {(isYT || isVimeo) ? (
                <iframe src={toEmbedUrl(videoUrl)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ width: "100%", height: "100%", border: "none", display: "block" }} />
              ) : (
                <video src={videoUrl} controls playsInline style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
              )}
            </div>
          )}
          {mapImage && (
            <div style={{ borderRadius: 12, overflow: "hidden", border: `1px solid ${PL.line}` }}>
              <img src={mapImage} alt={mapCaption ?? ""} style={{ width: "100%", display: "block", maxHeight: desktop ? 400 : 240, objectFit: "cover" }} />
              {mapCaption && <div style={{ padding: "10px 14px", background: PL.paper, fontSize: 12.5, color: PL.mut }}>{mapCaption}</div>}
            </div>
          )}
        </div>
      );
    }

    default:
      return null;
  }
}

function PulseSections({ pkg, t, isRtl, onWhatsApp, desktop = false, onImageClick }: {
  pkg: TPackage; t: TranslationT; isRtl: boolean; onWhatsApp: () => void; desktop?: boolean;
  onImageClick?: (images: LBImage[], idx: number) => void;
}) {
  if (!pkg.sections?.length) return null;
  const sorted = [...pkg.sections].sort((a, b) => a.order - b.order);
  return (
    <>
      {sorted.map(s => (
        <PulseSection key={s.id} s={s as SectionT} t={t} isRtl={isRtl} onWhatsApp={onWhatsApp} desktop={desktop} onImageClick={onImageClick} />
      ))}
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   REVIEWS SECTION — shows existing reviews + a submission form
   ═══════════════════════════════════════════════════════════════════════════ */

function PulseReviews({
  pkg, agency, t, isRtl, desktop = false,
}: {
  pkg: TPackage;
  agency: { name: string; enableReviews?: boolean; showReviews?: boolean; agencySlug?: string };
  t: TranslationT;
  isRtl: boolean;
  desktop?: boolean;
}) {
  const hasReviews = !!(pkg.reviews?.length);
  const canSubmit  = agency.enableReviews !== false;
  if (!hasReviews && !canSubmit) return null;

  const [name,    setName]    = useState("");
  const [text,    setText]    = useState("");
  const [rating,  setRating]  = useState(0);
  const [hover,   setHover]   = useState(0);
  const [status,  setStatus]  = useState<"idle" | "sending" | "ok" | "err">("idle");

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

  const wrap = desktop ? { marginBottom: 40 } : { padding: "32px 14px 28px" };

  const reviews = pkg.reviews ?? [];

  return (
    <div id="pl-reviews" style={wrap}>
      {/* heading */}
      <div style={{ marginBottom: 20 }}>
        {desktop ? (
          <div style={{ paddingBottom: 12, borderBottom: `2px solid ${PL.ink}`, display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8, margin: 0 }}>
              {hasReviews
                ? `${pkg.reviewCount ?? reviews.length} ${t.verifiedGuestsAvg}${pkg.rating ? ` ${pkg.rating}★` : ""}`
                : t.writeReviewTitle}
            </h2>
          </div>
        ) : (
          <SecHead
            eb={hasReviews ? `${pkg.reviewCount ?? reviews.length} ${t.verifiedGuestsAvg}` : t.reviewsLabel}
            title={hasReviews ? t.seeAllReviews.replace(" →", "") : t.writeReviewTitle}
          />
        )}
      </div>

      {/* existing reviews */}
      {hasReviews && (
        <div style={{
          display: desktop ? "grid" : "flex",
          gridTemplateColumns: desktop ? "1fr 1fr" : undefined,
          flexDirection: desktop ? undefined : "column" as const,
          gap: 12, marginBottom: 28,
        }}>
          {reviews.slice(0, desktop ? 4 : 99).map((r, i) => (
            <article key={i} style={{ background: PL.paper, border: `1px solid ${PL.line}`, borderRadius: 10, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, letterSpacing: -0.2 }}>{r.name}</div>
                  {r.country && <div style={{ fontSize: 10.5, color: PL.mut, marginTop: 2 }}>{r.country}</div>}
                </div>
                <Stars value={r.rating} />
                {r.createdAt && (
                  <div style={{ fontSize: 10.5, color: PL.mut, flexShrink: 0 }}>
                    {new Date(r.createdAt).toLocaleDateString(isRtl ? "ar-SA" : "en-US", { month: "short", year: "numeric" })}
                  </div>
                )}
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.5, color: PL.ink }}>{r.text}</div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, color: PL.trust, marginTop: 8, fontWeight: 600 }}>
                {Ico.check(11)} {t.verifiedViaWhatsApp}
              </div>
            </article>
          ))}
        </div>
      )}

      {/* review submission form */}
      {canSubmit && status !== "ok" && (
        <div style={{ background: PL.paper, border: `1px solid ${PL.line}`, borderRadius: 12, padding: desktop ? 24 : 18 }}>
          <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.1, marginBottom: 4 }}>{t.writeReviewTitle}</div>
          <div style={{ fontSize: 12, color: PL.mut, marginBottom: 16, lineHeight: 1.5 }}>{t.writeReviewSub}</div>

          {/* star selector */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: PL.mut, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: 0.4 }}>{t.reviewYourRating}</div>
            <div style={{ display: "flex", gap: 4 }}>
              {[1, 2, 3, 4, 5].map(n => (
                <button key={n}
                  onClick={() => setRating(n)}
                  onMouseEnter={() => setHover(n)}
                  onMouseLeave={() => setHover(0)}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: "2px 1px", lineHeight: 1 }}
                >
                  <svg width={22} height={22} viewBox="0 0 24 24"
                    fill={(hover || rating) >= n ? PL.warn : "none"}
                    stroke={PL.warn} strokeWidth={1.5}
                    strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>

          {/* name */}
          <div style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: PL.mut, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: 0.4 }}>{t.reviewYourName}</div>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t.reviewerNamePlaceholder}
              maxLength={80}
              style={{
                width: "100%", boxSizing: "border-box" as const,
                border: `1px solid ${PL.line}`, borderRadius: 8, padding: "10px 12px",
                fontSize: 13, fontFamily: SANS, color: PL.ink, background: PL.bg,
                outline: "none",
              }}
            />
          </div>

          {/* review text */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: PL.mut, marginBottom: 6, textTransform: "uppercase" as const, letterSpacing: 0.4 }}>{t.reviewYourReview}</div>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder={t.reviewPlaceholder}
              rows={4}
              maxLength={800}
              style={{
                width: "100%", boxSizing: "border-box" as const,
                border: `1px solid ${PL.line}`, borderRadius: 8, padding: "10px 12px",
                fontSize: 13, fontFamily: SANS, color: PL.ink, background: PL.bg,
                resize: "vertical" as const, outline: "none",
              }}
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!name.trim() || !text.trim() || !rating || status === "sending"}
            style={{
              width: "100%", background: rating && name.trim() && text.trim() ? PL.ink : PL.line,
              color: "#fff", border: "none", borderRadius: 8,
              padding: "12px 16px", fontWeight: 700, fontSize: 13,
              cursor: rating && name.trim() && text.trim() ? "pointer" : "not-allowed",
              fontFamily: SANS, transition: "background 0.15s",
            }}
          >
            {status === "sending" ? "…" : t.submitReviewBtn}
          </button>

          {status === "err" && (
            <div style={{ fontSize: 12, color: PL.deal, marginTop: 8, textAlign: "center" as const }}>{t.reviewSubmitError}</div>
          )}
        </div>
      )}

      {/* success state */}
      {status === "ok" && (
        <div style={{ background: "rgba(22,101,74,0.06)", border: `1px solid rgba(22,101,74,0.2)`, borderRadius: 12, padding: 20, textAlign: "center" as const }}>
          <div style={{ fontSize: 24, marginBottom: 8 }}>⭐</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: PL.trust }}>{t.reviewSubmitSuccess}</div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MOBILE LAYOUT
   ═══════════════════════════════════════════════════════════════════════════ */

/* ─── Section nav helpers ─────────────────────────────────────────────────── */

type SectionNavItem = { label: string; href: string };

const SECTION_NAV_HREFS: Partial<Record<string, string>> = {
  itinerary:      "#pl-itinerary",
  gallery:        "#pl-gallery",
  departure_dates:"#pl-departures",
  pricing:        "#pl-pricing",
  highlights:     "#pl-highlights",
  inclusions:     "#pl-inclusions",
  faq:            "#pl-faq",
  hotel:          "#pl-hotel",
};

function sectionNavLabel(type: string, t: TranslationT): string {
  switch (type) {
    case "itinerary":      return t.navItinerary;
    case "gallery":        return t.gallery;
    case "departure_dates":return t.departures;
    case "pricing":        return t.navPricing;
    case "highlights":     return t.sectionHighlightsTitle;
    case "inclusions":     return t.includedLabel;
    case "faq":            return t.frequentlyAsked;
    case "hotel":          return t.hotelLabel;
    default:               return "";
  }
}

function buildNavLinks(pkg: TPackage, gallery: TGalleryItem[], hasDeps: boolean, hasTiers: boolean, t: TranslationT): SectionNavItem[] {
  if (pkg.sections?.length) {
    const sorted = [...pkg.sections].sort((a, b) => a.order - b.order);
    const links: SectionNavItem[] = sorted
      .filter(s => SECTION_NAV_HREFS[s.type])
      .map(s => ({ label: sectionNavLabel(s.type, t), href: SECTION_NAV_HREFS[s.type]! }))
      .filter(l => l.label);
    links.push({ label: t.reviewsLabel, href: "#pl-reviews" });
    return links;
  }
  const links: SectionNavItem[] = [];
  if (pkg.itinerary?.length) links.push({ label: t.navItinerary, href: "#pl-itinerary" });
  if (gallery.length)         links.push({ label: t.gallery,     href: "#pl-gallery" });
  if (hasDeps)                links.push({ label: t.departures,  href: "#pl-departures" });
  if (hasTiers)               links.push({ label: t.navPricing,  href: "#pl-pricing" });
  links.push({ label: t.reviewsLabel, href: "#pl-reviews" });
  return links;
}

/* ─── Mobile layout ──────────────────────────────────────────────────────── */

function PulseMobile({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const isRtl = lang === "ar";
  const dir = isRtl ? "rtl" : "ltr";

  // Auto-generate viewer count (SSR-safe: starts 0, randomizes on mount)
  const [autoViewers, setAutoViewers] = useState<number | null>(null);
  useEffect(() => { setAutoViewers(8 + Math.floor(Math.random() * 17)); }, []);

  // Lightbox state
  const [lightbox, setLightbox] = useState<{ images: LBImage[]; idx: number } | null>(null);
  const openLightbox = (images: LBImage[], idx: number) => setLightbox({ images, idx });

  // departure_dates section (auto-extract first date for countdown)
  const depSection = pkg.sections?.find(s => s.type === "departure_dates");
  const depSectionDates = (depSection?.data?.dates as { date: string; spots: string }[] | undefined) ?? [];
  const firstDepDate = pkg.departures?.[0]?.date || depSectionDates[0]?.date;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const target    = useMemo(() => departureTarget(firstDepDate), [firstDepDate]);
  const cd        = useCountdown(target);
  const ticker    = useTicker(pkg.socialProofTicker, 2600);
  const nights    = pkg.nights ? Number(pkg.nights) : null;
  const cover     = pkg.coverImage ?? "";
  const mark      = agencyInitials(agency.name);

  // Auto-compute saving from priceWas - price when not explicitly set
  const autoSaving = !pkg.saving && pkg.priceWas ? computeSavingLabel(pkg.priceWas, pkg.price) : null;
  const effectiveSaving = pkg.saving || autoSaving;
  const hasDeal   = !!(pkg.priceWas || effectiveSaving);

  const hasScar   = pkg.spotsRemaining !== undefined && pkg.totalSpots !== undefined;
  const hasTicker = !!(pkg.socialProofTicker?.length);
  const gallery: TGalleryItem[] = pkg.gallery ?? pkg.images?.map(src => ({ src })) ?? [];
  // hasDeps: true when departure dates come from extras OR from departure_dates section
  const hasDeps   = !!(pkg.departures?.length || depSectionDates.length);
  // Only show urgency departures block when NOT handled by a departure_dates section
  const showUrgencyDeps = !!(pkg.departures?.length && !depSection);
  const hasTiers  = !!(pkg.pricingTiers?.length);
  const hasAgent  = !!(pkg.agent);
  // Effective viewers: manual override OR auto-generated
  const effectiveViewers = pkg.viewersNow !== undefined ? pkg.viewersNow : autoViewers;

  const cdLabels: [string, string, string, string] = [t.daysLabel, t.hoursLabelShort, t.minLabel, t.secLabel];
  const firstDate = firstDepDate?.split(" ").slice(0, 2).join(" ") ?? "";

  return (
    <div style={{ background: PL.bg, color: PL.ink, fontFamily: SANS, direction: dir, minHeight: "100vh", paddingBottom: 80 }}>
      <style dangerouslySetInnerHTML={{ __html: KF }} />

      {/* ── Deal ribbon ── */}
      {hasDeal && (
        <div style={{
          background: PL.ink, color: "#fff",
          height: 28, display: "flex", alignItems: "center",
          padding: "0 14px", fontSize: 11.5, letterSpacing: 0.1, gap: 10, overflow: "hidden",
        }}>
          <BlinkDot color={PL.deal} size={6} />
          <span>
            {t.lastMinute} · {t.savingLabel} <b style={{ color: PL.deal }}>{effectiveSaving}</b>
          </span>
          {cd.d >= 0 && (
            <span style={{
              marginLeft: isRtl ? undefined : "auto",
              marginRight: isRtl ? "auto" : undefined,
              fontFamily: MONO, fontSize: 10.5, letterSpacing: 0.4,
              color: "rgba(255,255,255,0.55)",
            }}>
              {t.departsIn} <b style={{ color: "#fff" }}>{cd.d}d {p2(cd.h)}:{p2(cd.m)}</b>
            </span>
          )}
        </div>
      )}

      {/* ── Sticky nav ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 20,
        height: 52, background: "rgba(255,255,255,0.94)", backdropFilter: "blur(14px)",
        borderBottom: `1px solid ${PL.line}`,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {agency.logoUrl ? (
            <img src={agency.logoUrl} alt={agency.name} style={{ height: 26, width: "auto", objectFit: "contain" }} />
          ) : (
            <div style={{
              width: 26, height: 26, background: PL.ink, color: "#fff",
              borderRadius: 6, display: "grid", placeItems: "center",
              fontWeight: 800, fontSize: 12, letterSpacing: -0.5,
            }}>{mark}</div>
          )}
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: -0.2 }}>{agency.name}</div>
            {agency.tagline && <div style={{ fontSize: 10, color: PL.mut, marginTop: 1 }}>{agency.tagline}</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16, overflowX: "auto" }}>
          {buildNavLinks(pkg, gallery, hasDeps, hasTiers, t).map(link => (
            <a key={link.href} href={link.href} style={{
              fontSize: 12, fontWeight: 600, color: PL.mut, textDecoration: "none", whiteSpace: "nowrap",
            }}>
              {link.label}
            </a>
          ))}
          <button onClick={onWhatsApp} style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 700, color: "#fff",
            background: PL.wa, padding: "6px 12px",
            borderRadius: 8, border: "none", cursor: "pointer", fontFamily: SANS, whiteSpace: "nowrap", flexShrink: 0,
          }}>
            {Ico.wa(12)} {t.bookWhatsApp}
          </button>
        </div>
      </div>

      {/* ── Hero ── */}
      <div style={{ position: "relative", height: 380, overflow: "hidden", background: PL.ink }}>
        {cover && <img src={cover} alt={pkg.destination} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom,rgba(0,0,0,.25) 0%,rgba(0,0,0,.1) 50%,rgba(0,0,0,.85) 100%)" }} />

        {/* sticker + rating */}
        <div style={{ position: "absolute", top: 16, left: 16, right: 16, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          {hasDeal && effectiveSaving && (
            <div style={{
              background: PL.deal, color: "#fff",
              padding: "8px 12px", borderRadius: 6,
              fontWeight: 800, fontSize: 11, letterSpacing: 0.3, textTransform: "uppercase",
              boxShadow: "0 4px 14px rgba(226,73,42,0.4)",
            }}>
              {t.savingLabel}
              <b style={{ fontSize: 18, letterSpacing: -0.3, display: "block", lineHeight: 1, marginTop: 2 }}>
                {effectiveSaving}
              </b>
            </div>
          )}
          {pkg.rating && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "rgba(255,255,255,0.95)", color: PL.ink,
              padding: "5px 9px", borderRadius: 6, fontSize: 11.5, fontWeight: 600, letterSpacing: -0.1,
            }}>
              {Ico.star(11)} {pkg.rating}{pkg.reviewCount ? ` · ${pkg.reviewCount}` : ""}
            </div>
          )}
        </div>

        {/* title — sits above the booking card which floats −28px over hero bottom */}
        <div style={{ position: "absolute", bottom: 46, left: 16, right: 16, color: "#fff" }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.8)", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8 }}>
            {pkg.destination}{nights ? ` · ${nights} ${t.nightsLabel}` : ""}
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: -1, lineHeight: 1.1, margin: 0 }}>
            {pkg.title ?? pkg.destination}
          </h1>
        </div>
      </div>

      {/* ── Booking card (floats −28px over hero bottom) ── */}
      <div style={{
        margin: "-28px 14px 0", background: PL.paper,
        border: `1px solid ${PL.line}`, borderRadius: 14, padding: 16,
        position: "relative", zIndex: 5,
        boxShadow: "0 18px 40px -20px rgba(0,0,0,0.18)",
      }}>
        {/* price row */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              {pkg.priceWas && (
                <span style={{ fontSize: 14, color: PL.mut, textDecoration: "line-through" }}>{pkg.priceWas}</span>
              )}
              <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: -1, lineHeight: 1 }}>{pkg.price}</span>
            </div>
            <div style={{ fontSize: 11, color: PL.mut, marginTop: 4 }}>{t.pricePerGuestTwinShare}</div>
          </div>
          {effectiveSaving && (
            <div style={{
              background: PL.dealBg, color: PL.deal,
              fontWeight: 800, fontSize: 12, padding: "6px 10px", borderRadius: 6, letterSpacing: -0.1,
            }}>
              {effectiveSaving}
            </div>
          )}
        </div>

        {/* scarcity */}
        {hasScar && (
          <div style={{
            background: PL.dealBg, color: PL.deal,
            borderRadius: 10, padding: "10px 12px", marginBottom: 12, fontSize: 12,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <BlinkDot color={PL.deal} size={7} />
              <span>
                {t.onlyLabel} <b>{pkg.spotsRemaining} of {pkg.totalSpots}</b>{" "}
                {t.spotLeftOf}{firstDate ? ` ${firstDate}` : ""}
              </span>
            </div>
            <div style={{ display: "flex", gap: 14, marginTop: 6, fontSize: 11 }}>
              {effectiveViewers !== null && effectiveViewers > 0 && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {Ico.eye(11)} <b>{effectiveViewers}</b> {t.viewingNow}
                </span>
              )}
              {pkg.recentBookings && (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                  {Ico.clock(11)} {t.bookedLabel} {pkg.recentBookings.hoursAgo}{t.hoursAgoLabel}
                </span>
              )}
            </div>
          </div>
        )}

        {/* CTA buttons */}
        <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
          <button onClick={onWhatsApp} style={{
            flex: 1, background: PL.wa, color: "#fff", border: "none", borderRadius: 10,
            padding: "14px 16px", fontWeight: 800, fontSize: 14, letterSpacing: -0.1,
            cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
            boxShadow: "0 4px 14px rgba(37,211,102,0.3)", fontFamily: SANS,
          }}>
            {Ico.wa(14)} {t.bookWhatsApp}
          </button>
          {pkg.messenger && (
            <button onClick={onMessenger} style={{
              background: "#0084ff", color: "#fff", border: "none",
              borderRadius: 10, padding: "14px 16px", fontWeight: 700, fontSize: 13,
              cursor: "pointer", fontFamily: SANS, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, flexShrink: 0,
            }}>
              {Ico.messenger(14)}
            </button>
          )}
        </div>

        {/* countdown — only when a departure date exists */}
        {hasDeps && (
          <>
            <div style={{ fontSize: 11, color: PL.mut, textAlign: "center", marginBottom: 8, fontWeight: 500 }}>
              {t.departsIn}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
              {([p2(cd.d), p2(cd.h), p2(cd.m), p2(cd.s)] as string[]).map((v, i) => (
                <div key={i} style={{
                  background: PL.bg, border: `1px solid ${PL.line}`,
                  borderRadius: 8, padding: "9px 4px", textAlign: "center",
                }}>
                  <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5, fontFamily: MONO, lineHeight: 1, color: PL.deal }}>{v}</div>
                  <div style={{ fontSize: 9.5, color: PL.mut, marginTop: 4, letterSpacing: 0.4, textTransform: "uppercase", fontWeight: 500 }}>{cdLabels[i]}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Social proof ticker ── */}
      {hasTicker && ticker && (
        <div style={{
          margin: "14px 14px 0", background: "#f0ece5", borderRadius: 10,
          padding: "11px 14px", display: "flex", alignItems: "center", gap: 10, fontSize: 12.5,
        }}>
          <span style={{
            width: 8, height: 8, borderRadius: "50%", background: PL.trust, flexShrink: 0,
            animation: "pl-pulse-green 1.8s ease-out infinite",
          }} />
          <span>{ticker}</span>
        </div>
      )}

      {/* ── Trust strip (2×2 grid — only show items with real data) ── */}
      {(() => {
        const items = [
          pkg.cancellation ? { icon: Ico.shield(13), text: pkg.cancellation } : null,
          { icon: Ico.wa(13), text: t.payViaWhatsApp },
          pkg.hotelDescription ? { icon: Ico.check(13), text: pkg.hotelDescription.split(",")[0] } : null,
          { icon: Ico.spark(13), text: agency.name },
        ].filter(Boolean) as { icon: React.ReactNode; text: string }[];
        if (!items.length) return null;
        const cols = items.length >= 4 ? "1fr 1fr" : `repeat(${items.length}, 1fr)`;
        return (
          <div style={{
            margin: "16px 14px 0", background: PL.paper,
            border: `1px solid ${PL.line}`, borderRadius: 10, padding: "4px 6px",
            display: "grid", gridTemplateColumns: cols,
          }}>
            {items.map((c, i) => (
              <div key={i} style={{
                padding: "10px 10px", display: "flex", alignItems: "center", gap: 8,
                fontSize: 11.5, fontWeight: 500,
                borderRight: items.length >= 4 && i % 2 === 0 ? `1px solid ${PL.line}` : "none",
                borderBottom: items.length >= 4 && i < 2 ? `1px solid ${PL.line}` : "none",
              }}>
                <span style={{ color: PL.trust }}>{c.icon}</span>
                <span>{c.text}</span>
              </div>
            ))}
          </div>
        );
      })()}

      {/* ── Sections (user-added content in defined order) ── */}
      {pkg.sections?.length ? (
        <PulseSections pkg={pkg} t={t} isRtl={isRtl} onWhatsApp={onWhatsApp} desktop={false} onImageClick={openLightbox} />
      ) : (
        <>
          {!!pkg.itinerary?.length && (
            <div id="pl-itinerary" style={{ padding: "32px 14px 28px" }}>
              <SecHead eb={`${t.dayByDay} · ${pkg.itinerary.length} ${t.daysLabel.toLowerCase()}`} title={pkg.title ?? pkg.destination} />
              <div style={{ background: PL.paper, border: `1px solid ${PL.line}`, borderRadius: 12, overflow: "hidden" }}>
                {pkg.itinerary.map((d, i) => (
                  <div key={i} style={{ padding: "14px 16px", borderBottom: i < pkg.itinerary!.length - 1 ? `1px solid ${PL.line}` : "none", display: "grid", gridTemplateColumns: "auto 1fr", gap: 14, alignItems: "start" }}>
                    <div style={{ background: PL.dealBg, color: PL.deal, borderRadius: 8, padding: "8px 10px", textAlign: "center", minWidth: 52 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1 }}>{dayLabel(d.day, isRtl)}</div>
                      {d.chapter && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", marginTop: 3 }}>{d.chapter}</div>}
                    </div>
                    <div style={{ paddingTop: 2 }}>
                      <div style={{ fontSize: 10.5, color: PL.mut, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>{t.dayLabel} {d.day}</div>
                      <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3, letterSpacing: -0.2 }}>{d.title}</div>
                      <div style={{ fontSize: 12.5, color: PL.mut, lineHeight: 1.5, marginTop: 6 }}>{d.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {(pkg.includes?.length || pkg.excludes?.length) && (
            <PulseSection s={{ id: "fb-inclusions", type: "inclusions", order: 0, data: { includes: pkg.includes ?? [], excludes: pkg.excludes ?? [] } }} t={t} isRtl={isRtl} onWhatsApp={onWhatsApp} desktop={false} />
          )}
          {gallery.length > 0 && (
            <div style={{ padding: "32px 14px 28px" }}>
              <SecHead eb={t.gallery} title={pkg.hotelDescription?.split(",")[0] ?? pkg.destination} />
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gridTemplateRows: "130px 130px", gap: 4 }}>
                {gallery.slice(0, 3).map((g, i) => (
                  <div key={i} onClick={() => openLightbox(gallery, i)} style={{ overflow: "hidden", borderRadius: 8, gridRow: i === 0 ? "span 2" : undefined, cursor: "pointer" }}>
                    <img src={g.src} alt={g.caption ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                ))}
              </div>
            </div>
          )}
          {hasTiers && (
            <div id="pl-pricing" style={{ padding: "32px 14px 28px" }}>
              <SecHead eb={t.navPricing} title={t.navPricing} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {pkg.pricingTiers!.map((tier, i) => <TierCard key={i} tier={tier} isRtl={isRtl} t={t} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Departures (urgency-led — only when no departure_dates section) ── */}
      {showUrgencyDeps && (
        <div id="pl-departures" style={{ padding: "32px 14px 28px" }}>
          <SecHead eb={t.departures} title={t.dealSooner} />
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {pkg.departures!.map((dep, i) => (
              <button key={i} onClick={onWhatsApp} style={{
                background: dep.deal ? `linear-gradient(180deg,#fff 0%,${PL.dealBg} 100%)` : PL.paper,
                border: dep.deal ? `1.5px solid ${PL.deal}` : `1.5px solid ${PL.line}`,
                borderRadius: 10, padding: "14px 16px",
                display: "grid", gridTemplateColumns: "1fr auto", gap: 8, alignItems: "center",
                cursor: "pointer", textAlign: isRtl ? "right" : "left", fontFamily: SANS,
              }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.4 }}>{dep.date}</div>
                  <div style={{ fontSize: 11, color: dep.spots <= 4 ? PL.deal : PL.mut, marginTop: 4, fontWeight: 500 }}>
                    {dep.spots <= 4
                      ? <b>{t.onlyLabel} {dep.spots} {t.spotsLeft}</b>
                      : `${dep.spots} ${t.spotsAvailable}`}
                  </div>
                </div>
                <div style={{ textAlign: isRtl ? "left" : "right" }}>
                  <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.5, lineHeight: 1 }}>
                    {dep.price ?? pkg.price}
                  </div>
                  {dep.deal && effectiveSaving && (
                    <div style={{
                      display: "inline-block", fontSize: 9.5, background: PL.deal, color: "#fff",
                      padding: "2px 6px", borderRadius: 3, fontWeight: 700, letterSpacing: 0.3,
                      textTransform: "uppercase", marginTop: 4,
                    }}>
                      {effectiveSaving}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}


      {/* ── Reviews + submission form ── */}
      <PulseReviews pkg={pkg} agency={agency} t={t} isRtl={isRtl} desktop={false} />

      {/* ── Agent close (dark ink card) ── */}
      {hasAgent && (
        <div style={{ margin: "32px 14px 0", background: PL.ink, color: "#fff", borderRadius: 14, padding: 22 }}>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {pkg.agent!.avatar ? (
              <img src={pkg.agent!.avatar} alt={pkg.agent!.name}
                style={{ width: 56, height: 56, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.1)",
                display: "grid", placeItems: "center", fontSize: 20, fontWeight: 700, flexShrink: 0,
              }}>
                {pkg.agent!.name.charAt(0)}
              </div>
            )}
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, letterSpacing: -0.3 }}>{pkg.agent!.name}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", marginTop: 3 }}>
                {pkg.agent!.role}{pkg.agent!.years ? ` · ${pkg.agent!.years} ${t.yearsExpSuffix}` : ""}
              </div>
              {pkg.agent!.repliesIn && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6, marginTop: 8,
                  background: "rgba(255,255,255,0.1)", padding: "4px 8px", borderRadius: 4,
                  fontFamily: MONO, fontSize: 10, letterSpacing: 0.3,
                }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2dd4a0", animation: "pl-pulse-green 1.8s infinite" }} />
                  {t.onlineRepliesIn} {pkg.agent!.repliesIn}
                </div>
              )}
            </div>
          </div>
          <p style={{ fontSize: 14.5, lineHeight: 1.5, marginTop: 18, color: "rgba(255,255,255,0.92)", marginBottom: 0 }}>
            {pkg.description}
          </p>
          <div style={{ marginTop: 18 }}>
            <button onClick={onWhatsApp} style={{
              width: "100%", background: PL.wa, color: "#fff", border: "none", borderRadius: 10,
              padding: "14px 16px", fontWeight: 800, fontSize: 14, letterSpacing: -0.1,
              cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 14px rgba(37,211,102,0.3)", fontFamily: SANS,
            }}>
              {Ico.wa(14)} {t.bookWhatsApp}
            </button>
          </div>
        </div>
      )}

      {/* ── All packages link ── */}
      {agency.agencySlug && (
        <div style={{ padding: "20px 14px 4px", textAlign: "center" as const }}>
          <a href={`/${agency.agencySlug}`} style={{
            fontSize: 13, fontWeight: 600, color: PL.mut,
            textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            {t.seeAllPackages}
          </a>
        </div>
      )}

      {/* ── Sticky bottom CTA ── */}
      <div style={{
        position: "sticky", bottom: 0, left: 0, right: 0,
        background: PL.paper, borderTop: `1px solid ${PL.line}`,
        padding: "10px 12px", display: "flex", alignItems: "center", gap: 10,
        zIndex: 40, boxShadow: "0 -10px 30px -10px rgba(0,0,0,0.12)",
      }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
            {pkg.priceWas && (
              <span style={{ fontSize: 11.5, color: PL.mut, textDecoration: "line-through" }}>{pkg.priceWas}</span>
            )}
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: -0.5 }}>{pkg.price}</span>
            {effectiveSaving && (
              <span style={{ fontSize: 10.5, background: PL.dealBg, color: PL.deal, padding: "2px 6px", borderRadius: 4, fontWeight: 700, flexShrink: 0 }}>{effectiveSaving}</span>
            )}
          </div>
          <div style={{ fontSize: 10, color: PL.mut, marginTop: 1, display: "inline-flex", alignItems: "center", gap: 5 }}>
            {hasScar && <><BlinkDot color={PL.deal} size={5} /><b style={{ color: PL.deal }}>{pkg.spotsRemaining}</b></>}
            {t.pricePerGuestTwinShare}
          </div>
        </div>
        <button onClick={onWhatsApp} style={{
          background: PL.wa, color: "#fff", border: "none", borderRadius: 10,
          padding: "12px 16px", fontWeight: 800, fontSize: 13,
          cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 8,
          boxShadow: "0 4px 14px rgba(37,211,102,0.3)", fontFamily: SANS, flexShrink: 0,
        }}>
          {Ico.wa(13)} {t.bookWhatsApp}
        </button>
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <PulseLightbox images={lightbox.images} startIdx={lightbox.idx} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   DESKTOP LAYOUT
   ═══════════════════════════════════════════════════════════════════════════ */

function PulseDesktop({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const isRtl = lang === "ar";
  const dir = isRtl ? "rtl" : "ltr";

  // Auto-generate viewer count (SSR-safe)
  const [autoViewers, setAutoViewers] = useState<number | null>(null);
  useEffect(() => { setAutoViewers(8 + Math.floor(Math.random() * 17)); }, []);

  // Lightbox state
  const [lightbox, setLightbox] = useState<{ images: LBImage[]; idx: number } | null>(null);
  const openLightbox = (images: LBImage[], idx: number) => setLightbox({ images, idx });

  // departure_dates section (auto-extract first date for countdown)
  const depSection = pkg.sections?.find(s => s.type === "departure_dates");
  const depSectionDates = (depSection?.data?.dates as { date: string; spots: string }[] | undefined) ?? [];
  const firstDepDate = pkg.departures?.[0]?.date || depSectionDates[0]?.date;

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const target    = useMemo(() => departureTarget(firstDepDate), [firstDepDate]);
  const cd        = useCountdown(target);
  const ticker    = useTicker(pkg.socialProofTicker, 2800);
  const nights    = pkg.nights ? Number(pkg.nights) : null;
  const cover     = pkg.coverImage ?? "";
  const mark      = agencyInitials(agency.name);

  // Auto-compute saving
  const autoSaving = !pkg.saving && pkg.priceWas ? computeSavingLabel(pkg.priceWas, pkg.price) : null;
  const effectiveSaving = pkg.saving || autoSaving;
  const hasDeal   = !!(pkg.priceWas || effectiveSaving);

  const hasScar   = pkg.spotsRemaining !== undefined && pkg.totalSpots !== undefined;
  const hasTicker = !!(pkg.socialProofTicker?.length);
  const gallery: TGalleryItem[] = pkg.gallery ?? pkg.images?.map(src => ({ src })) ?? [];
  const hasDeps   = !!(pkg.departures?.length || depSectionDates.length);
  const showUrgencyDeps = !!(pkg.departures?.length && !depSection);
  const hasTiers  = !!(pkg.pricingTiers?.length);
  const hasAgent  = !!(pkg.agent);
  const effectiveViewers = pkg.viewersNow !== undefined ? pkg.viewersNow : autoViewers;

  const filled = hasScar
    ? Math.round(((pkg.totalSpots! - pkg.spotsRemaining!) / pkg.totalSpots!) * 100)
    : 0;

  const cdLabels: [string, string, string, string] = [t.daysLabel, t.hoursLabelShort, t.minLabel, t.secLabel];

  function DSHead({ title, cta, onCta }: { title: string; cta?: string; onCta?: () => void }) {
    return (
      <div style={{
        marginBottom: 18, paddingBottom: 12, borderBottom: `2px solid ${PL.ink}`,
        display: "flex", justifyContent: "space-between", alignItems: "flex-end",
      }}>
        <h2 style={{ fontSize: 28, fontWeight: 800, letterSpacing: -0.8, margin: 0 }}>{title}</h2>
        {cta && (
          <span style={{ fontSize: 12, fontWeight: 600, color: PL.deal, cursor: "pointer", flexShrink: 0 }} onClick={onCta}>
            {cta}
          </span>
        )}
      </div>
    );
  }

  return (
    <div style={{ background: PL.bg, color: PL.ink, fontFamily: SANS, direction: dir }}>
      <style dangerouslySetInnerHTML={{ __html: KF }} />

      {/* ── Deal ribbon ── */}
      {hasDeal && (
        <div style={{
          background: PL.ink, color: "#fff",
          height: 28, display: "flex", alignItems: "center",
          padding: "0 40px", fontSize: 11.5, letterSpacing: 0.1, gap: 10, overflow: "hidden",
        }}>
          <BlinkDot color={PL.deal} size={6} />
          <span>
            {t.lastMinute} · {t.charterReleaseLabel} · {t.savingLabel}{" "}
            <b style={{ color: PL.deal }}>{effectiveSaving}</b>
          </span>
          {hasDeps && (
            <span style={{
              marginLeft: isRtl ? undefined : "auto",
              marginRight: isRtl ? "auto" : undefined,
              fontFamily: MONO, fontSize: 10.5, letterSpacing: 0.4, color: "rgba(255,255,255,0.55)",
            }}>
              {t.departsIn}{" "}
              <b style={{ color: "#fff" }}>{cd.d}d {p2(cd.h)}:{p2(cd.m)}:{p2(cd.s)}</b>
            </span>
          )}
        </div>
      )}

      {/* ── Desktop sticky nav ── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 30,
        height: 64, background: "rgba(250,248,243,0.92)", backdropFilter: "blur(12px)",
        borderBottom: `1px solid ${PL.line}`,
        display: "flex", alignItems: "center", padding: "0 40px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          {agency.logoUrl ? (
            <img src={agency.logoUrl} alt={agency.name} style={{ height: 30, width: "auto" }} />
          ) : (
            <div style={{ width: 30, height: 30, background: PL.ink, color: "#fff", borderRadius: 6, display: "grid", placeItems: "center", fontWeight: 800, fontSize: 13, letterSpacing: -0.5 }}>
              {mark}
            </div>
          )}
          <div>
            <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: -0.3 }}>{agency.name}</div>
            {agency.tagline && <div style={{ fontSize: 10.5, color: PL.mut, marginTop: 1 }}>{agency.tagline}</div>}
          </div>
        </div>

        <div style={{ display: "flex", gap: 28, marginLeft: isRtl ? undefined : 48, marginRight: isRtl ? 48 : undefined }}>
          {buildNavLinks(pkg, gallery, hasDeps, hasTiers, t).map(link => (
            <a key={link.href} href={link.href} style={{ fontSize: 13, fontWeight: 500, color: PL.mut, cursor: "pointer", textDecoration: "none" }}>
              {link.label}
            </a>
          ))}
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 14,
          marginLeft: isRtl ? undefined : "auto",
          marginRight: isRtl ? "auto" : undefined,
        }}>
          <div style={{ textAlign: isRtl ? "left" : "right" }}>
            {pkg.priceWas && <div style={{ fontSize: 11, color: PL.mut }}><s>{pkg.priceWas}</s>{effectiveSaving ? ` · ${effectiveSaving}` : ""}</div>}
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.4 }}>{pkg.price}</div>
          </div>
          <button onClick={onWhatsApp} style={{
            background: PL.wa, color: "#fff", border: "none", borderRadius: 10,
            padding: "10px 18px", fontWeight: 700, fontSize: 13, cursor: "pointer",
            display: "inline-flex", alignItems: "center", gap: 8,
            boxShadow: "0 4px 14px rgba(37,211,102,0.3)", fontFamily: SANS,
          }}>
            {Ico.wa(13)} {t.bookWhatsApp}
          </button>
        </div>
      </div>

      {/* ── Split hero: 1.5fr image + 1fr booking sidebar ── */}
      <section style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr" }}>
        {/* media panel */}
        <div style={{ position: "relative", minHeight: 540, background: PL.ink, overflow: "hidden" }}>
          {cover && <img src={cover} alt={pkg.destination} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top,rgba(0,0,0,.6) 0%,rgba(0,0,0,.1) 50%,rgba(0,0,0,.4) 100%)" }} />

          <div style={{ position: "absolute", top: 20, left: 24, right: 24, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            {hasDeal && effectiveSaving && (
              <div style={{
                background: PL.deal, color: "#fff", padding: "10px 16px", borderRadius: 8,
                display: "flex", alignItems: "center", gap: 10,
                boxShadow: "0 6px 18px rgba(226,73,42,0.45)",
              }}>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", opacity: 0.85 }}>
                    {t.charterReleaseLabel}
                  </div>
                  <div style={{ fontSize: 30, fontWeight: 800, letterSpacing: -0.8, lineHeight: 1 }}>{effectiveSaving}</div>
                </div>
              </div>
            )}
            {pkg.rating && (
              <div style={{
                background: PL.paper, color: PL.ink, padding: "8px 12px", borderRadius: 8,
                fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", gap: 7, letterSpacing: -0.1,
              }}>
                {Ico.star(13)} {pkg.rating}{" "}
                <small style={{ fontWeight: 500, color: PL.mut }}>· {pkg.reviewCount} {t.reviewsLabel}</small>
              </div>
            )}
          </div>

          <div style={{ position: "absolute", bottom: 24, left: 24, right: 24, color: "#fff" }}>
            <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", opacity: 0.85, marginBottom: 10 }}>
              {pkg.destination}{nights ? ` · ${nights} ${t.nightsLabel}` : ""}
            </div>
            <h1 style={{ fontSize: 48, fontWeight: 800, letterSpacing: -1.4, lineHeight: 1.05, margin: 0, maxWidth: 600 }}>
              {pkg.title ?? pkg.destination}
            </h1>
          </div>
        </div>

        {/* booking sidebar */}
        <div style={{
          background: PL.paper,
          borderLeft: isRtl ? "none" : `1px solid ${PL.line}`,
          borderRight: isRtl ? `1px solid ${PL.line}` : "none",
          padding: "28px 28px 32px",
          display: "flex", flexDirection: "column", gap: 16,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: PL.deal }}>
            {t.lastMinute}
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              {pkg.priceWas && (
                <span style={{ fontSize: 18, color: PL.mut, textDecoration: "line-through", fontWeight: 500 }}>{pkg.priceWas}</span>
              )}
              <span style={{ fontSize: 54, fontWeight: 800, letterSpacing: -1.6, lineHeight: 1 }}>{pkg.price}</span>
              {effectiveSaving && (
                <span style={{ display: "inline-block", background: PL.deal, color: "#fff", fontWeight: 800, fontSize: 12, padding: "5px 8px", borderRadius: 4, letterSpacing: 0.2 }}>
                  {effectiveSaving}
                </span>
              )}
            </div>
            <div style={{ fontSize: 12.5, color: PL.mut, marginTop: -4 }}>
              {t.perPerson}{nights ? ` · ${nights} ${t.nightsLabel}` : ""}
            </div>
          </div>

          {/* countdown grid — only when a departure date exists */}
          {hasDeps && (
            <div style={{ background: PL.dealBg, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 11, color: PL.deal, fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                <BlinkDot color={PL.deal} size={7} /> {t.departsIn}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
                {([p2(cd.d), p2(cd.h), p2(cd.m), p2(cd.s)] as string[]).map((v, i) => (
                  <div key={i} style={{ background: PL.paper, borderRadius: 6, padding: "10px 4px", textAlign: "center" }}>
                    <div style={{ fontFamily: MONO, fontSize: 22, fontWeight: 700, letterSpacing: -0.5, color: PL.deal, lineHeight: 1 }}>{v}</div>
                    <div style={{ fontSize: 9, color: PL.mut, marginTop: 4, letterSpacing: 0.3, textTransform: "uppercase", fontWeight: 600 }}>{cdLabels[i]}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* spots-remaining bar */}
          {hasScar && (
            <div style={{ background: PL.paper, border: `1px solid ${PL.line}`, borderRadius: 10, padding: "12px 14px", fontSize: 12.5 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <BlinkDot color={PL.deal} size={6} />
                <span>
                  {t.onlyLabel} <b style={{ color: PL.deal }}>{pkg.spotsRemaining} of {pkg.totalSpots}</b> {t.spotsLeft}
                </span>
              </div>
              <div style={{ height: 4, background: PL.line, borderRadius: 999, marginTop: 10, overflow: "hidden" }}>
                <div style={{ height: "100%", background: `linear-gradient(90deg,${PL.deal},#f37e62)`, borderRadius: 999, width: `${filled}%` }} />
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 11, color: PL.mut, marginTop: 8 }}>
                {effectiveViewers !== null && effectiveViewers > 0 && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {Ico.eye(11)} {effectiveViewers} {t.viewingNow}
                  </span>
                )}
                {pkg.recentBookings && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                    {Ico.clock(11)} {t.bookedLabel} {pkg.recentBookings.hoursAgo}{t.hoursAgoLabel}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* CTAs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <button onClick={onWhatsApp} style={{
              background: PL.wa, color: "#fff", border: "none", borderRadius: 10,
              padding: "16px 20px", fontWeight: 700, fontSize: 15, cursor: "pointer",
              display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
              boxShadow: "0 4px 14px rgba(37,211,102,0.3)", fontFamily: SANS,
            }}>
              {Ico.wa(15)} {t.bookWhatsApp}
            </button>
            {pkg.messenger && (
              <button onClick={onMessenger} style={{
                background: "#0084ff", color: "#fff", border: "none", borderRadius: 10,
                padding: "13px 20px", fontWeight: 600, fontSize: 13.5, cursor: "pointer",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
                fontFamily: SANS,
              }}>
                {Ico.messenger(14)} Messenger
              </button>
            )}
          </div>

          {/* assurances — only show items with real data */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8, fontSize: 12, color: PL.mut }}>
            {([
              pkg.cancellation ? { icon: Ico.shield(12), text: pkg.cancellation } : null,
              { icon: Ico.check(12),  text: t.payViaWhatsApp },
              { icon: Ico.spark(12),  text: `${agency.name} · ${t.iataLicensed}` },
            ] as (null | { icon: React.ReactNode; text: string })[]).filter(Boolean).map((a, i) => (
              <div key={i} style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ color: PL.trust }}>{a!.icon}</span>
                <span>{a!.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trust + social proof strip (mirrors hero's 1.5/1 columns) ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", borderBottom: `1px solid ${PL.line}` }}>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          padding: "16px 40px", gap: 24,
          borderRight: isRtl ? "none" : `1px solid ${PL.line}`,
          borderLeft: isRtl ? `1px solid ${PL.line}` : "none",
        }}>
          {([
            pkg.cancellation ? { icon: Ico.shield(18), t1: t.freeCancellation, t2: pkg.cancellation } : null,
            { icon: Ico.wa(18), t1: t.payViaWhatsApp, t2: null } as { icon: React.ReactNode; t1: string; t2: string | null },
            pkg.hotelDescription ? { icon: Ico.check(18), t1: pkg.hotelDescription.split(",")[0], t2: pkg.destination } : null,
            { icon: Ico.spark(18), t1: agency.name, t2: t.iataLicensed } as { icon: React.ReactNode; t1: string; t2: string | null },
          ]).filter(Boolean).map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12.5, fontWeight: 500 }}>
              <span style={{ color: PL.trust }}>{c!.icon}</span>
              <div>
                <div style={{ fontWeight: 700, letterSpacing: -0.1 }}>{c!.t1}</div>
                {c!.t2 && <div style={{ fontSize: 11, color: PL.mut, marginTop: 1, fontWeight: 400 }}>{c!.t2}</div>}
              </div>
            </div>
          ))}
        </div>
        {hasTicker && (
          <div style={{ background: PL.ink, color: "#fff", padding: "16px 28px", display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#2dd4a0", animation: "pl-pulse-green 1.8s infinite", flexShrink: 0 }} />
            <span>{ticker}</span>
          </div>
        )}
      </div>

      {/* ── Body grid: 1.6fr main + 1fr sticky rail ── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 56, padding: "48px 40px 56px", alignItems: "start" }}>

        {/* main column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>

          {/* sections (user-added content in defined order) */}
          {pkg.sections?.length ? (
            <PulseSections pkg={pkg} t={t} isRtl={isRtl} onWhatsApp={onWhatsApp} desktop={true} onImageClick={openLightbox} />
          ) : (
            <>
              {!!pkg.itinerary?.length && (
                <section id="pl-itinerary">
                  <DSHead title={`${t.dayByDay} · ${pkg.itinerary.length} ${t.daysLabel.toLowerCase()}`} />
                  <div style={{ background: PL.paper, border: `1px solid ${PL.line}`, borderRadius: 12, overflow: "hidden" }}>
                    {pkg.itinerary.map((d, i) => (
                      <div key={i} style={{ padding: "16px 20px", display: "grid", gridTemplateColumns: "80px 1fr", gap: 22, borderBottom: i < pkg.itinerary!.length - 1 ? `1px solid ${PL.line}` : "none", alignItems: "start" }}>
                        <div style={{ background: PL.dealBg, color: PL.deal, borderRadius: 8, padding: 10, textAlign: "center" }}>
                          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: -0.6, lineHeight: 1 }}>{dayLabel(d.day, isRtl)}</div>
                          {d.chapter && <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", marginTop: 4 }}>{d.chapter}</div>}
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: PL.mut, fontWeight: 600, letterSpacing: 0.4, textTransform: "uppercase" }}>{t.dayLabel} {d.day}</div>
                          <div style={{ fontSize: 15, fontWeight: 700, letterSpacing: -0.2 }}>{d.title}</div>
                          <div style={{ fontSize: 13, color: PL.mut, lineHeight: 1.55, marginTop: 6 }}>{d.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {(pkg.includes?.length || pkg.excludes?.length) && (
                <PulseSection s={{ id: "fb-inclusions", type: "inclusions", order: 0, data: { includes: pkg.includes ?? [], excludes: pkg.excludes ?? [] } }} t={t} isRtl={isRtl} onWhatsApp={onWhatsApp} desktop={true} />
              )}
              {gallery.length > 0 && (
                <section id="pl-gallery">
                  <DSHead title={t.gallery} />
                  <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 1fr", gridTemplateRows: "180px 180px", gap: 6 }}>
                    {gallery.slice(0, 5).map((g, i) => (
                      <div key={i} onClick={() => openLightbox(gallery, i)} style={{ overflow: "hidden", borderRadius: 8, position: "relative", gridRow: i === 0 ? "span 2" : undefined, cursor: "pointer" }}>
                        <img src={g.src} alt={g.caption ?? ""} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                        {g.caption && (
                          <div style={{ position: "absolute", bottom: 8, left: isRtl ? undefined : 8, right: isRtl ? 8 : undefined, background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 10, padding: "3px 6px", borderRadius: 4, fontWeight: 600 }}>
                            {g.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {hasTiers && (
                <section id="pl-pricing">
                  <DSHead title={t.navPricing} />
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                    {pkg.pricingTiers!.map((tier, i) => <TierCard key={i} tier={tier} isRtl={isRtl} t={t} />)}
                  </div>
                </section>
              )}
            </>
          )}

          {/* reviews + submission form */}
          <PulseReviews pkg={pkg} agency={agency} t={t} isRtl={isRtl} desktop={true} />
        </div>

        {/* sticky right rail */}
        <div style={{ position: "sticky", top: 96, display: "flex", flexDirection: "column", gap: 16 }}>

          {showUrgencyDeps && (
            <div style={{ background: PL.paper, border: `1px solid ${PL.line}`, borderRadius: 12, padding: 18 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 12px", letterSpacing: -0.1 }}>
                {t.otherDepartures}
              </h4>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {pkg.departures!.map((dep, i) => (
                  <div key={i} onClick={onWhatsApp} style={{
                    border: dep.deal ? `1.5px solid ${PL.deal}` : `1.5px solid ${PL.line}`,
                    borderRadius: 10, padding: "12px 14px",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    cursor: "pointer", background: dep.deal ? PL.dealBg : PL.paper,
                  }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: -0.3 }}>{dep.date}</div>
                      <div style={{ fontSize: 11, color: dep.spots <= 4 ? PL.deal : PL.mut, marginTop: 3 }}>
                        {dep.spots <= 4
                          ? <b>{t.onlyLabel} {dep.spots} {t.spotsLeft}</b>
                          : `${dep.spots} ${t.spotsAvailable}`}
                      </div>
                    </div>
                    <div style={{ fontSize: 16, fontWeight: 800, letterSpacing: -0.4 }}>
                      {dep.price ?? pkg.price}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* contact card — only show when description or agent exists */}
          {(pkg.description || pkg.agent) && (
            <div style={{ background: PL.paper, border: `1px solid ${PL.line}`, borderRadius: 12, padding: 18 }}>
              <h4 style={{ fontSize: 13, fontWeight: 700, margin: "0 0 10px", letterSpacing: -0.1 }}>
                {pkg.agent ? pkg.agent.name : agency.name}
              </h4>
              {pkg.description && (
                <p style={{ fontSize: 12.5, color: PL.mut, lineHeight: 1.55, margin: "0 0 14px" }}>
                  {pkg.description.slice(0, 180)}{pkg.description.length > 180 ? "…" : ""}
                </p>
              )}
              <button onClick={onWhatsApp} style={{
                width: "100%", background: PL.wa, color: "#fff", border: "none",
                borderRadius: 8, padding: "11px 14px", fontWeight: 700, fontSize: 12.5,
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, fontFamily: SANS,
              }}>
                {Ico.wa(13)} {t.bookWhatsApp}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Agent final CTA (dark full-width band) ── */}
      {hasAgent && (
        <section style={{
          background: PL.ink, color: "#fff",
          padding: "56px 40px",
          display: "grid", gridTemplateColumns: "1fr 1.4fr",
          gap: 56, alignItems: "center",
        }}>
          <div style={{ aspectRatio: "4/5", borderRadius: 12, overflow: "hidden" }}>
            {pkg.agent!.avatar ? (
              <img src={pkg.agent!.avatar} alt={pkg.agent!.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ width: "100%", height: "100%", background: "rgba(255,255,255,0.08)", display: "grid", placeItems: "center", fontSize: 64, fontWeight: 700 }}>
                {pkg.agent!.name.charAt(0)}
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: 0.6, textTransform: "uppercase", color: "rgba(255,255,255,0.55)" }}>
              {t.yourAgentLabel} · {agency.name}
            </div>
            <div style={{ fontSize: 38, fontWeight: 800, letterSpacing: -1, marginTop: 10, lineHeight: 1.05 }}>
              {pkg.agent!.name}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", marginTop: 8 }}>
              {pkg.agent!.role}{pkg.agent!.years ? ` · ${pkg.agent!.years} ${t.yearsExpSuffix}` : ""}
            </div>
            <p style={{ fontSize: 18, lineHeight: 1.55, marginTop: 22, color: "rgba(255,255,255,0.92)", maxWidth: 560, marginBottom: 0 }}>
              {pkg.description}
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button onClick={onWhatsApp} style={{
                background: PL.wa, color: "#fff", border: "none", borderRadius: 10,
                padding: "14px 22px", fontWeight: 700, fontSize: 14, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 8, fontFamily: SANS,
              }}>
                {Ico.wa(15)} {t.bookWhatsApp}
              </button>
              {pkg.messenger && (
                <button onClick={onMessenger} style={{
                  background: "#0084ff", color: "#fff", border: "none",
                  borderRadius: 10, padding: "14px 20px", fontWeight: 600, fontSize: 13.5,
                  cursor: "pointer", fontFamily: SANS, display: "inline-flex", alignItems: "center", gap: 8,
                }}>
                  {Ico.messenger(14)} Messenger
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Footer ── */}
      <div style={{
        padding: "22px 40px", display: "flex", justifyContent: "space-between", alignItems: "center",
        fontSize: 11, color: PL.mut, borderTop: `1px solid ${PL.line}`,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <span>© {agency.name} · {t.iataLicensed}</span>
          {agency.agencySlug && (
            <a href={`/${agency.agencySlug}`} style={{ color: PL.mut, textDecoration: "none", fontWeight: 600 }}>
              {t.seeAllPackages}
            </a>
          )}
        </div>
        <div>{t.poweredBy}</div>
      </div>

      {/* ── Lightbox ── */}
      {lightbox && (
        <PulseLightbox images={lightbox.images} startIdx={lightbox.idx} onClose={() => setLightbox(null)} />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   EXPORTS
   ═══════════════════════════════════════════════════════════════════════════ */

export function TemplatePulsePage(props: TPageProps) {
  const isDesktop = useIsDesktop();
  return isDesktop ? <PulseDesktop {...props} /> : <PulseMobile {...props} />;
}

export function TemplatePulseCard({
  pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate,
}: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
      headingFont={SANS}
      imageBorderRadius={0}
    />
  );
}
