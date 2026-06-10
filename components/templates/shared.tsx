"use client";

import React from "react";
import Icon from "@/components/Icon";
import { T, localizeTierLabel } from "@/lib/translations";
import type { TPackage, TAgency, TReview, TemplateTokens, Lang, TAgent, TDeparture } from "./types";
import { locStr } from "./types";

// ─── Desktop responsive hook ────────────────────────────────────────────────

const _DesktopCtx = React.createContext<boolean | null>(null);

export function useIsDesktop(): boolean {
  const override = React.useContext(_DesktopCtx);
  const [isDesktop, setIsDesktop] = React.useState(false);
  React.useEffect(() => {
    if (override !== null) return;
    const mq = window.matchMedia("(min-width: 1024px)");
    setIsDesktop(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [override]);
  return override !== null ? override : isDesktop;
}

export function IsDesktopProvider({ value, children }: { value: boolean; children: React.ReactNode }) {
  return <_DesktopCtx.Provider value={value}>{children}</_DesktopCtx.Provider>;
}

// ─── Desktop primitives ─────────────────────────────────────────────────────

export function DesktopNav({ agency, price, brand, navLinks, dark, onWhatsApp, lang }: {
  agency: TAgency; price: string; brand: string;
  navLinks?: Array<{ label: string; href: string }>;
  dark?: boolean; onWhatsApp?: () => void; lang?: Lang;
}) {
  const t = T[lang || "en"];
  const initials = agency.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const bg = dark ? "rgba(13,27,46,0.92)" : "rgba(253,252,249,0.95)";
  const ink = dark ? "#fff" : "#0d1b2e";
  const mut = dark ? "rgba(255,255,255,0.6)" : "rgba(13,27,46,0.55)";
  const border = dark ? "rgba(255,255,255,0.08)" : "rgba(13,27,46,0.08)";

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const el = document.getElementById(href.slice(1));
      if (el) {
        const top = el.getBoundingClientRect().top + window.scrollY - 72;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  };

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 50, height: 64,
      padding: "0 56px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      background: bg, backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${border}`,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {agency.logoUrl
          ? <img src={agency.logoUrl} alt="" style={{ width: 32, height: 32, objectFit: "contain", borderRadius: 7 }} />
          : <div style={{ width: 32, height: 32, borderRadius: 8, background: brand, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>{initials}</div>
        }
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: ink, letterSpacing: "-0.2px", lineHeight: 1 }}>{agency.name}</div>
          {agency.tagline && <div style={{ fontSize: 10.5, color: dark ? "rgba(255,255,255,0.4)" : "rgba(13,27,46,0.35)", marginTop: 3 }}>{agency.tagline}</div>}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
        {(navLinks || []).map((link, i) => (
          <a
            key={i}
            href={link.href}
            onClick={e => handleNavClick(e, link.href)}
            style={{ fontSize: 13, fontWeight: 500, color: mut, textDecoration: "none", cursor: "pointer", transition: "color 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.color = ink)}
            onMouseLeave={e => (e.currentTarget.style.color = mut)}
          >
            {link.label}
          </a>
        ))}
        {agency.agencySlug && (
          <a
            href={`/${agency.agencySlug}${lang ? `?language=${lang}` : ""}`}
            style={{ fontSize: 13, fontWeight: 600, color: brand, textDecoration: "none", cursor: "pointer", transition: "opacity 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            {t.navAllPackages}
          </a>
        )}
        {onWhatsApp && <WAButton label={`Book · ${price}`} size="sm" onClick={onWhatsApp} />}
      </div>
    </div>
  );
}

export function DContainer({ children, max = 1180, style, id }: {
  children: React.ReactNode; max?: number; style?: React.CSSProperties; id?: string;
}) {
  return (
    <div id={id} style={{ maxWidth: max, margin: "0 auto", ...style }}>
      {children}
    </div>
  );
}

export function DesktopFooter({ agency, brand, dark }: {
  agency: TAgency; brand: string; dark?: boolean;
}) {
  const initials = agency.name.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();
  const ink = dark ? "#fff" : "#0d1b2e";
  const sub = dark ? "rgba(255,255,255,0.5)" : "rgba(13,27,46,0.35)";
  const border = dark ? "rgba(255,255,255,0.08)" : "rgba(13,27,46,0.08)";
  return (
    <div style={{
      borderTop: `1px solid ${border}`,
      padding: "28px 56px",
      display: "flex", justifyContent: "space-between", alignItems: "center",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        {agency.logoUrl
          ? <img src={agency.logoUrl} alt="" style={{ width: 24, height: 24, objectFit: "contain", borderRadius: 5 }} />
          : <div style={{ width: 24, height: 24, borderRadius: 6, background: brand, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff" }}>{initials}</div>
        }
        <div style={{ fontSize: 12.5, fontWeight: 700, color: ink }}>{agency.name}</div>
      </div>
      <div style={{ fontSize: 10.5, color: sub, textTransform: "uppercase", letterSpacing: "0.5px" }}>Powered by PackMetrix</div>
    </div>
  );
}

// Desktop wrapper for shared sections
export function DesktopSection({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <DContainer style={{ padding: "44px 80px", ...style }}>
      {children}
    </DContainer>
  );
}

const WA_GREEN = "#25d366";
const WA_SVG_PATH = "M20.5 3.5C18.2 1.2 15.2 0 12 0 5.4 0 .1 5.3.1 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.4-1.7c1.7.9 3.7 1.4 5.6 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.3zM12 21.8c-1.7 0-3.4-.5-4.9-1.3l-.4-.2-3.7 1 1-3.6-.2-.4c-.9-1.5-1.4-3.3-1.4-5 0-5.5 4.5-9.9 9.9-9.9 2.6 0 5.1 1 7 2.9 1.9 1.9 2.9 4.4 2.9 7-.1 5.4-4.5 9.5-10.2 9.5z";

// ─── Atomic primitives ─────────────────────────────────────────────────────

export function WAButton({ label, size = "md", style, full, onClick }: {
  label: string; size?: "sm" | "md" | "lg";
  style?: React.CSSProperties; full?: boolean; onClick?: () => void;
}) {
  const s = { sm: { pad: "8px 14px", fs: 12, ic: 13 }, md: { pad: "13px 22px", fs: 14, ic: 15 }, lg: { pad: "16px 24px", fs: 15, ic: 16 } }[size];
  return (
    <button data-testid="wa-cta" onClick={onClick} style={{
      background: WA_GREEN, color: "#fff", border: "none", borderRadius: 10,
      padding: s.pad, fontSize: s.fs, fontWeight: 700, cursor: "pointer",
      fontFamily: "inherit", display: "inline-flex", alignItems: "center",
      gap: 8, width: full ? "100%" : "auto", justifyContent: "center",
      boxShadow: size === "lg" ? "0 8px 24px rgba(37,211,102,0.3)" : "none",
      ...style,
    }}>
      <svg width={s.ic} height={s.ic} viewBox="0 0 24 24" fill="currentColor">
        <path d={WA_SVG_PATH} />
      </svg>
      {label}
    </button>
  );
}

export function Eyebrow({ text, brand, light, style }: {
  text: string; brand: string; light?: boolean; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 7,
      fontSize: 10, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase",
      color: light ? "rgba(255,255,255,0.85)" : brand, ...style,
    }}>
      <span style={{ width: 16, height: 1, background: light ? "rgba(255,255,255,0.5)" : brand }} />
      {text}
    </div>
  );
}

export function AgencyBar({ agency, price, brand: brandProp, dark, onWhatsApp, lang, navLinks }: {
  agency: TAgency; price: string; brand: string; dark?: boolean; onWhatsApp?: () => void; lang?: Lang;
  navLinks?: Array<{ label: string; href: string }>;
}) {
  const brand = brandProp;
  const t = T[lang || "en"];
  const bg = dark ? "rgba(13,27,46,0.92)" : "rgba(253,252,249,0.95)";
  const ink = dark ? "#fff" : "#0d1b2e";
  const mut = dark ? "rgba(255,255,255,0.55)" : "rgba(13,27,46,0.5)";
  const border = dark ? "rgba(255,255,255,0.08)" : "rgba(13,27,46,0.08)";
  const initials = agency.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const el = document.getElementById(href.slice(1));
      if (el) {
        const navH = 52 + (navLinks?.length ? 36 : 0) + 8;
        const top = el.getBoundingClientRect().top + window.scrollY - navH;
        window.scrollTo({ top, behavior: "smooth" });
      }
    }
  };

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 50,
      background: bg, backdropFilter: "blur(12px)", borderBottom: `1px solid ${border}`,
    }}>
      <div style={{ height: 52, padding: "0 14px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          {agency.logoUrl
            ? <img src={agency.logoUrl} alt="" style={{ width: 26, height: 26, objectFit: "contain", borderRadius: 6 }} />
            : <div style={{ width: 26, height: 26, borderRadius: 7, background: brand, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: "#fff" }}>{initials}</div>
          }
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: ink, letterSpacing: "-0.2px", lineHeight: 1 }}>{agency.name}</div>
            {agency.agencySlug && (
              <a
                href={`/${agency.agencySlug}${lang ? `?language=${lang}` : ""}`}
                style={{ fontSize: 10, color: dark ? "rgba(255,255,255,0.45)" : "rgba(13,27,46,0.4)", textDecoration: "none", letterSpacing: "0.2px" }}
              >
                {t.navAllPackages} ↗
              </a>
            )}
          </div>
        </div>
        {onWhatsApp && <WAButton label={price} size="sm" onClick={onWhatsApp} />}
      </div>
      {navLinks && navLinks.length > 0 && (
        <div style={{
          display: "flex", gap: 6, padding: "0 14px 10px",
          overflowX: "auto", scrollbarWidth: "none",
        }}>
          {navLinks.map((link, i) => (
            <a
              key={i}
              href={link.href}
              onClick={e => handleNavClick(e, link.href)}
              style={{
                flexShrink: 0, fontSize: 11.5, fontWeight: 600, color: mut,
                textDecoration: "none", padding: "5px 12px",
                background: dark ? "rgba(255,255,255,0.07)" : "rgba(13,27,46,0.05)",
                border: `1px solid ${border}`, borderRadius: 99,
              }}
            >
              {link.label}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

export function StickyCTA({ price, nights, label, dark, onWhatsApp, lang }: {
  price: string; nights?: number | null; label?: string; dark?: boolean;
  onWhatsApp?: () => void; lang: Lang;
}) {
  const t = T[lang];
  const bg = dark ? "rgba(13,27,46,0.95)" : "rgba(253,252,249,0.97)";
  const border = dark ? "rgba(255,255,255,0.08)" : "rgba(13,27,46,0.08)";
  const ink = dark ? "#fff" : "#0d1b2e";
  const sub = dark ? "rgba(255,255,255,0.5)" : "rgba(13,27,46,0.35)";
  return (
    <div style={{
      position: "sticky", bottom: 0, zIndex: 40, padding: "10px 14px 12px",
      background: bg, backdropFilter: "blur(12px)", borderTop: `1px solid ${border}`,
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: ink, lineHeight: 1, letterSpacing: "-0.3px" }}>{price}</div>
        <div style={{ fontSize: 10.5, color: sub, marginTop: 3 }}>
          {nights ? `${nights} ${t.nightsLabel} · ${t.perPerson}` : t.perPerson}
        </div>
      </div>
      {onWhatsApp && <WAButton label={label || t.bookWhatsApp} size="md" onClick={onWhatsApp} />}
    </div>
  );
}

// ─── Shared page sections ───────────────────────────────────────────────────

/**
 * Returns itinerary days from whichever storage path is populated.
 * New packages store days inside pkg.sections; legacy packages use pkg.itinerary.
 */
export function getItineraryDays(pkg: TPackage): NonNullable<TPackage["itinerary"]> {
  if (pkg.sections?.length) {
    const sec = pkg.sections.find(s => s.type === "itinerary");
    const days = sec?.data?.days;
    if (Array.isArray(days) && days.length) return days as NonNullable<TPackage["itinerary"]>;
  }
  return pkg.itinerary ?? [];
}

export function SharedItinerary({ pkg, tokens, lang }: { pkg: TPackage; tokens: TemplateTokens; lang: Lang }) {
  const t = T[lang];
  const itinerary = (pkg.itinerary || []).filter(it => it.title?.trim());
  if (!itinerary.length) return null;
  const isRtl = lang === "ar";
  return (
    <section id="itinerary" style={{ padding: "20px 18px", scrollMarginTop: 88 }}>
      <Eyebrow text={t.dayByDay} brand={tokens.brand} />
      <h2 style={{ fontFamily: tokens.serif, fontSize: 26, fontWeight: 400, letterSpacing: "-0.5px", lineHeight: 1.1, color: tokens.ink, margin: "10px 0 20px" }}>
        {t.yourJourney}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {itinerary.map((it, i) => (
          <div key={i} style={{ display: "flex", gap: 14, padding: "14px 16px", background: tokens.dark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${tokens.border}`, borderRadius: 14, alignItems: "flex-start" }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: `${tokens.brand}15`, border: `1px solid ${tokens.brand}30`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: tokens.brand }}>
              {it.day}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: tokens.ink, lineHeight: 1.3, marginBottom: it.desc ? 4 : 0, direction: isRtl ? "rtl" : "ltr" }}>{it.title}</div>
              {it.desc && <div style={{ fontSize: 12, color: tokens.muted, lineHeight: 1.55, direction: isRtl ? "rtl" : "ltr" }}>{it.desc}</div>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SharedIncludes({ pkg, tokens, lang }: { pkg: TPackage; tokens: TemplateTokens; lang: Lang }) {
  const t = T[lang];
  const includes = pkg.includes?.length ? pkg.includes : (pkg.advantages || []);
  const excludes = pkg.excludes || [];
  if (!includes.length && !excludes.length) return null;
  return (
    <section id="included" style={{ padding: "20px 18px", scrollMarginTop: 88 }}>
      <h2 style={{ fontFamily: tokens.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.4px", color: tokens.ink, marginBottom: 20 }}>
        {t.whatsIncluded}
      </h2>
      <div style={{ display: "grid", gridTemplateColumns: excludes.length ? "1fr 1fr" : "1fr", gap: 20 }}>
        {includes.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#2dd4a0", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.6px" }}>{t.includedLabel}</div>
            {includes.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(45,212,160,0.1)", border: "1px solid rgba(45,212,160,0.25)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                  <Icon name="check" size={9} color="#2dd4a0" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 13, color: tokens.muted, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        )}
        {excludes.length > 0 && (
          <div>
            <div style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.6px" }}>{t.notIncluded}</div>
            {excludes.map((item, i) => (
              <div key={i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}>
                  <Icon name="x" size={9} color="#ef4444" strokeWidth={2.5} />
                </div>
                <span style={{ fontSize: 13, color: tokens.muted, lineHeight: 1.5 }}>{item}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export function SharedPricing({ pkg, tokens, lang, onWhatsApp }: { pkg: TPackage; tokens: TemplateTokens; lang: Lang; onWhatsApp: () => void }) {
  const t = T[lang];
  const tiers = (pkg.pricingTiers || []).filter(tier => tier.price);
  if (!tiers.length) return null;
  return (
    <section id="pricing" style={{ padding: "20px 18px", scrollMarginTop: 88 }}>
      <h2 style={{ fontFamily: tokens.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.4px", color: tokens.ink, marginBottom: 20 }}>
        {t.chooseOption}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {tiers.map((tier, i) => (
          <div key={i} style={{
            background: i === 0 ? `linear-gradient(135deg, ${tokens.brand}, ${tokens.brand}cc)` : (tokens.dark ? "rgba(255,255,255,0.04)" : "#fff"),
            border: `1px solid ${i === 0 ? "transparent" : tokens.border}`,
            borderRadius: 16, padding: "20px 18px", position: "relative",
            boxShadow: i === 0 ? `0 12px 32px ${tokens.brand}30` : "none",
          }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: i === 0 ? "rgba(255,255,255,0.7)" : tokens.muted, marginBottom: 8 }}>{localizeTierLabel(tier.label, lang)}</div>
            <div style={{ fontFamily: tokens.serif, fontSize: 36, fontWeight: 400, letterSpacing: "-1px", lineHeight: 1, color: i === 0 ? "#fff" : tokens.ink, marginBottom: 4 }}>{tier.price}</div>
            <div style={{ fontSize: 11, color: i === 0 ? "rgba(255,255,255,0.5)" : tokens.superMuted, marginBottom: 16 }}>{t.perPerson}</div>
            {pkg.whatsapp && (
              <button onClick={onWhatsApp} style={{
                width: "100%", display: "flex", alignItems: "center", justifyContent: "center",
                background: i === 0 ? "rgba(255,255,255,0.2)" : tokens.brand, color: "#fff",
                border: "none", borderRadius: 9, padding: "10px", fontSize: 13, fontWeight: 700,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                {t.bookThisOption}
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Lightbox carousel ──────────────────────────────────────────────────────

export function LightboxCarousel({ images, startIndex, onClose }: {
  images: string[]; startIndex: number; onClose: () => void;
}) {
  const [idx, setIdx] = React.useState(startIndex);
  const touchStartX = React.useRef<number | null>(null);

  React.useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIdx(i => (i - 1 + images.length) % images.length);
      if (e.key === "ArrowRight") setIdx(i => (i + 1) % images.length);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [images.length, onClose]);

  const prev = () => setIdx(i => (i - 1 + images.length) % images.length);
  const next = () => setIdx(i => (i + 1) % images.length);

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (dx > 50) prev();
    else if (dx < -50) next();
    touchStartX.current = null;
  };

  return (
    <div
      onClick={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(0,0,0,0.92)", display: "flex", alignItems: "center", justifyContent: "center" }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Image */}
      <img
        src={images[idx]}
        alt=""
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: "92vw", maxHeight: "88vh", objectFit: "contain", borderRadius: 10, userSelect: "none" }}
      />

      {/* Counter */}
      <div style={{ position: "absolute", top: 18, left: "50%", transform: "translateX(-50%)", background: "rgba(0,0,0,0.6)", borderRadius: 99, padding: "5px 14px", fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>
        {idx + 1} / {images.length}
      </div>

      {/* Close */}
      <button onClick={onClose} style={{ position: "absolute", top: 16, right: 16, width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>×</button>

      {/* Prev / Next */}
      {images.length > 1 && (
        <>
          <button onClick={e => { e.stopPropagation(); prev(); }} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>‹</button>
          <button onClick={e => { e.stopPropagation(); next(); }} style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", width: 40, height: 40, borderRadius: "50%", background: "rgba(255,255,255,0.12)", border: "none", color: "#fff", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>›</button>
        </>
      )}
    </div>
  );
}

export function SharedGallery({ pkg, tokens, lang }: { pkg: TPackage; tokens: TemplateTokens; lang: Lang }) {
  const t = T[lang];
  const [lightboxIdx, setLightboxIdx] = React.useState<number | null>(null);
  const cover = pkg.coverImage || "";
  const images = pkg.images?.filter(Boolean) || [];
  const allImages = [cover, ...images].filter(Boolean);
  const hasGallery = allImages.length > 1 || pkg.videoUrl;
  if (!hasGallery) return null;
  return (
    <section style={{ padding: "20px 18px" }}>
      <h2 style={{ fontFamily: tokens.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.4px", color: tokens.ink, marginBottom: 16 }}>
        {t.gallery}
      </h2>
      {pkg.videoUrl && (
        <video src={pkg.videoUrl} controls style={{ width: "100%", borderRadius: 14, background: "#0d1b2e", maxHeight: 220, marginBottom: 10 }} />
      )}
      {allImages.length > 1 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {allImages.slice(1, 7).map((url, i) => (
            <img
              key={i} src={url} alt=""
              onClick={() => setLightboxIdx(i + 1)}
              style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 10, cursor: "pointer" }}
            />
          ))}
        </div>
      )}
      {lightboxIdx !== null && (
        <LightboxCarousel images={allImages} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </section>
  );
}

export function SharedHotel({ pkg, tokens, lang }: { pkg: TPackage; tokens: TemplateTokens; lang: Lang }) {
  const t = T[lang];
  if (!pkg.hotelDescription) return null;
  return (
    <section style={{ padding: "20px 18px" }}>
      <Eyebrow text={t.hotelLabel} brand={tokens.brand} />
      <h2 style={{ fontFamily: tokens.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.4px", color: tokens.ink, margin: "10px 0 14px" }}>
        {t.hotelSectionTitle}
      </h2>
      <p style={{ fontSize: 14, color: tokens.muted, lineHeight: 1.75 }}>{pkg.hotelDescription}</p>
    </section>
  );
}

export function SharedAirports({ pkg, tokens, lang, onWhatsApp }: { pkg: TPackage; tokens: TemplateTokens; lang: Lang; onWhatsApp: () => void }) {
  const t = T[lang];
  const airports = (pkg.airports || []).filter(a => a.name?.trim());
  if (!airports.length) return null;
  return (
    <section style={{ padding: "20px 18px" }}>
      <h2 style={{ fontFamily: tokens.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.4px", color: tokens.ink, marginBottom: 16 }}>
        {t.departureOptions}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {airports.map((a, i) => (
          <div key={i} style={{ background: i === 0 ? `${tokens.brand}08` : (tokens.dark ? "rgba(255,255,255,0.03)" : "rgba(13,27,46,0.02)"), border: `1px solid ${i === 0 ? tokens.brand + "30" : tokens.border}`, borderRadius: 14, padding: 16 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: tokens.ink, marginBottom: 6 }}>
              {a.arrivingAirport ? `${a.name} → ${a.arrivingAirport}` : a.name}
            </div>
            {a.date && <div style={{ fontSize: 12, color: tokens.muted, marginBottom: 4 }}>{a.date}</div>}
            {(a.flyingTime || a.arrivingTime) && (
              <div style={{ fontSize: 12, color: tokens.muted, marginBottom: 8 }}>
                {[a.flyingTime, a.arrivingTime].filter(Boolean).join(" → ")}
              </div>
            )}
            <div style={{ fontFamily: tokens.serif, fontSize: 28, fontWeight: 400, color: tokens.brand, letterSpacing: "-0.5px", lineHeight: 1, marginBottom: 10 }}>{a.price}</div>
            {pkg.whatsapp && (
              <button onClick={onWhatsApp} style={{ fontSize: 13, color: tokens.brand, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0 }}>
                {t.bookThisFlight}
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

export function SharedCTABanner({ pkg, agency, tokens, lang, onWhatsApp, onMessenger }: {
  pkg: TPackage; agency: TAgency; tokens: TemplateTokens; lang: Lang;
  onWhatsApp: () => void; onMessenger: () => void;
}) {
  const t = T[lang];
  const brand = tokens.brand;
  return (
    <div style={{
      background: `linear-gradient(135deg, ${brand} 0%, ${brand}bb 100%)`,
      borderRadius: 18, overflow: "hidden", position: "relative",
      padding: "32px 24px", margin: "0 0 0 0",
      display: "flex", flexDirection: "column", gap: 20,
    }}>
      <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06, pointerEvents: "none" }} viewBox="0 0 80 80" preserveAspectRatio="xMidYMid slice">
        <defs><pattern id="geo-cta" width="40" height="40" patternUnits="userSpaceOnUse"><polygon points="20,0 40,10 40,30 20,40 0,30 0,10" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs>
        <rect width="100%" height="100%" fill="url(#geo-cta)" />
      </svg>
      <div style={{ position: "relative" }}>
        <div style={{ fontFamily: tokens.serif, fontSize: 24, color: "#fff", marginBottom: 8, lineHeight: 1.2 }}>
          {t.readyToExplore} {pkg.destination}?
        </div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>{t.reserveSpot}</div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative" }}>
        {pkg.whatsapp && <WAButton label={t.bookWhatsApp} size="lg" full onClick={onWhatsApp} />}
        {pkg.messenger && (
          <button data-testid="messenger-cta" onClick={onMessenger} style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            {t.messageMessenger}
          </button>
        )}
      </div>
    </div>
  );
}

export function SharedFooter({ agency, tokens }: { agency: TAgency; tokens: TemplateTokens }) {
  const initials = agency.name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <div style={{ padding: "24px 18px", borderTop: `1px solid ${tokens.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        {agency.logoUrl
          ? <img src={agency.logoUrl} alt="" style={{ width: 24, height: 24, objectFit: "contain", borderRadius: 5 }} />
          : <div style={{ width: 24, height: 24, borderRadius: 6, background: tokens.brand, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 800, color: "#fff" }}>{initials}</div>
        }
        <div style={{ fontSize: 13, fontWeight: 700, color: tokens.ink }}>{agency.name}</div>
      </div>
      <div style={{ fontSize: 10, color: tokens.superMuted }}>Powered by PackMetrix</div>
    </div>
  );
}

// ─── Dashboard card primitives ──────────────────────────────────────────────

/** @deprecated Use BaseCard directly */
export function CardStatRow({ views, clicks, conv, scoreColor, t }: {
  views: number; clicks: number; conv: number; scoreColor: string;
  t: typeof T["en"];
}) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, padding: "12px 16px 0" }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fdfcf9" }}>{views.toLocaleString()}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".4px", marginTop: 2 }}>{t.statViews}</div>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#fdfcf9" }}>{clicks}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".4px", marginTop: 2 }}>{t.statLeads}</div>
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 700, color: scoreColor }}>{conv.toFixed(1)}%</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".4px", marginTop: 2 }}>{t.statConversion}</div>
      </div>
    </div>
  );
}

/** @deprecated Use BaseCard directly */
export function CardActions({ lang, onView, onEdit, onDelete, onToggleActive, onDuplicate, isActive, isPublished }: {
  lang: Lang; onView: () => void; onEdit: () => void;
  onDelete: () => void; onToggleActive: () => void;
  onDuplicate?: () => void;
  isActive: boolean; isPublished: boolean;
}) {
  const t = T[lang];
  return (
    <div style={{ display: "flex", gap: 6, padding: "10px 16px 14px" }}>
      <button onClick={onView} style={{ flex: 1, padding: "7px", borderRadius: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center" }}>
        {t.preview}
      </button>
      <button onClick={onEdit} style={{ flex: 1, padding: "7px", borderRadius: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
        <Icon name="edit" size={12} color="rgba(255,255,255,0.55)" />
        {t.apply}
      </button>
      {onDuplicate && (
        <button onClick={onDuplicate} title={T[lang].duplicatePackageTooltip} style={{ width: 32, height: 32, borderRadius: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.55)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="copy" size={13} color="rgba(255,255,255,0.55)" />
        </button>
      )}
      {isPublished && (
        <button onClick={onToggleActive} title={isActive ? t.markInactive : t.markActive} style={{ width: 32, height: 32, borderRadius: 7, background: isActive ? "rgba(45,212,160,0.08)" : "rgba(255,255,255,0.04)", border: `1px solid ${isActive ? "rgba(45,212,160,0.25)" : "rgba(255,255,255,0.08)"}`, color: isActive ? "rgba(45,212,160,0.8)" : "rgba(255,255,255,0.35)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18.36 6.64A9 9 0 1 1 5.64 5.64" /><line x1="12" y1="2" x2="12" y2="12" /></svg>
        </button>
      )}
      <button onClick={onDelete} style={{ width: 32, height: 32, borderRadius: 7, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(220,80,80,0.7)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }} title={t.deletePackage}>
        <Icon name="trash" size={14} color="rgba(220,80,80,0.7)" />
      </button>
    </div>
  );
}

// BaseCard — white card with 4px template stripe, image, metrics, actions
export function BaseCard({
  pkg, agency, lang,
  onView, onEdit, onDelete, onToggleActive, onDuplicate, onCopyLink,
  stripeColor, templateName, templateDark,
  // kept for backwards compat with existing template Card components (Phase 4 will replace them)
  imageBorderRadius: _ir, headingFont: _hf, cardBg: _cb, accentColor: _ac,
}: {
  pkg: import("./types").TListPackage;
  agency: TAgency; lang: Lang;
  onView: () => void; onEdit: () => void;
  onDelete: () => void; onToggleActive: () => void;
  onDuplicate?: () => void;
  onCopyLink?: () => void;
  stripeColor?: string;
  templateName?: string;
  templateDark?: boolean;
  /** @deprecated ignored in new design */
  imageBorderRadius?: number;
  /** @deprecated ignored in new design */
  headingFont?: string;
  /** @deprecated ignored in new design */
  cardBg?: string;
  /** @deprecated ignored in new design */
  accentColor?: string;
}) {
  const t = T[lang];
  const thumbUrl = pkg.coverImage || pkg.images?.[0];
  const clicks = (pkg.whatsappClicks || 0) + (pkg.messengerClicks || 0);
  const conv = (pkg.views || 0) > 0 ? (clicks / (pkg.views || 1)) * 100 : 0;
  const isPublished = Boolean(pkg.agencySlug);
  const isActive = pkg.isActive !== false;
  const stripe = stripeColor || "#1f5f8e";
  const isOff = !isPublished || !isActive;

  const statusDotColor = !isPublished ? "#f3a847" : isActive ? "#2dd4a0" : "#888";
  const statusLabel = !isPublished ? t.packageStatusDraft : isActive ? t.live : t.packageStatusInactive;

  const isRtl = lang === "ar";

  return (
    <div style={{
      background: "#fff",
      border: "1px solid rgba(0,0,0,0.08)",
      borderRadius: 14,
      overflow: "hidden",
      display: "flex",
      flexDirection: "column",
      opacity: isOff ? 0.6 : 1,
      transition: "opacity 0.2s",
    }}>
      {/* 4px template-color stripe */}
      <div style={{ height: 4, background: stripe, flexShrink: 0 }} />

      {/* Image area */}
      <div style={{ position: "relative", aspectRatio: "16/10", background: "#f0ece5", overflow: "hidden", flexShrink: 0 }}>
        {thumbUrl
          ? <img src={thumbUrl} alt={pkg.destination} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}><Icon name="map" size={28} color="rgba(0,0,0,0.2)" /></div>
        }
        {/* Overlay tags */}
        <div style={{ position: "absolute", top: 10, left: isRtl ? undefined : 10, right: isRtl ? 10 : undefined, display: "flex", alignItems: "flex-start", gap: 6 }}>
          {templateName && (
            <span style={{
              background: "rgba(255,255,255,0.94)", backdropFilter: "blur(8px)",
              fontFamily: "var(--font-jetbrains-mono, monospace)", fontSize: 9.5,
              textTransform: "uppercase", letterSpacing: "0.5px",
              padding: "4px 7px", borderRadius: 4,
              display: "inline-flex", alignItems: "center", gap: 5,
              fontWeight: 600, color: "#1a1f2c",
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: stripe, border: templateDark ? "1px solid rgba(0,0,0,0.5)" : "none", flexShrink: 0 }} />
              {templateName}
            </span>
          )}
        </div>
        <div style={{ position: "absolute", top: 10, right: isRtl ? undefined : 10, left: isRtl ? 10 : undefined }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            background: "rgba(0,0,0,0.55)", backdropFilter: "blur(8px)",
            color: "#fff", fontSize: 10, fontWeight: 600,
            padding: "4px 8px", borderRadius: 4, letterSpacing: "0.2px",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: statusDotColor, flexShrink: 0 }} />
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: "14px 16px 10px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Dest + price */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
          <div style={{ fontSize: 11, color: "rgba(0,0,0,0.42)", fontWeight: 500, letterSpacing: "0.4px", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {pkg.destination}
          </div>
          <div style={{ fontSize: 14, fontWeight: 800, letterSpacing: "-0.3px", color: "#0d1b2e", flexShrink: 0 }}>
            {pkg.price}
          </div>
        </div>
        {/* Title */}
        <div style={{
          fontSize: 14, fontWeight: 600, marginTop: 4, lineHeight: 1.32,
          letterSpacing: "-0.2px", color: "#0d1b2e",
          overflow: "hidden", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>
          {locStr(pkg.title, lang) || pkg.destination}
        </div>
        {/* Metrics */}
        <div style={{ marginTop: 11, paddingTop: 10, borderTop: "1px solid rgba(0,0,0,0.06)", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 4 }}>
          {[
            { v: (pkg.views || 0).toLocaleString(), l: t.statViews, hi: false },
            { v: String(clicks), l: t.statLeads, hi: false },
            { v: conv > 0 ? conv.toFixed(1) + "%" : "—", l: t.statConversion, hi: conv >= 2 },
          ].map(({ v, l, hi }) => (
            <div key={l}>
              <div style={{ fontSize: 14, fontWeight: 700, letterSpacing: "-0.2px", lineHeight: 1, color: hi ? "#16654a" : "#0d1b2e" }}>{v}</div>
              <div style={{ fontSize: 9.5, color: "rgba(0,0,0,0.38)", marginTop: 4, letterSpacing: "0.4px", textTransform: "uppercase", fontWeight: 600, fontFamily: "var(--font-jetbrains-mono, monospace)" }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions bar */}
      <div style={{ display: "flex", alignItems: "center", padding: "9px 12px", borderTop: "1px solid rgba(0,0,0,0.06)", background: "#faf9f5", gap: 2 }}>
        <button onClick={onEdit} style={{ background: "transparent", border: "none", fontSize: 12, color: "#0d1b2e", fontWeight: 600, padding: "5px 8px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
          {t.apply}
        </button>
        <button onClick={onView} style={{ background: "transparent", border: "none", fontSize: 12, color: "rgba(0,0,0,0.4)", fontWeight: 500, padding: "5px 8px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
          {t.preview}
        </button>
        {onCopyLink && (
          <button onClick={onCopyLink} style={{ background: "transparent", border: "none", fontSize: 12, color: "rgba(0,0,0,0.4)", fontWeight: 500, padding: "5px 8px", borderRadius: 6, cursor: "pointer", fontFamily: "inherit" }}>
            {t.copyLink}
          </button>
        )}
        {onDuplicate && (
          <button onClick={onDuplicate} title={t.duplicatePackageTooltip} style={{ background: "transparent", border: "none", padding: "5px 6px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center" }}>
            <Icon name="copy" size={13} color="rgba(0,0,0,0.3)" />
          </button>
        )}
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 4 }}>
          {isPublished && (
            <button
              onClick={onToggleActive}
              title={isActive ? t.markInactive : t.markActive}
              style={{ background: "none", border: "none", cursor: "pointer", padding: "4px 2px", display: "flex", alignItems: "center" }}
            >
              <span style={{
                display: "inline-block", width: 32, height: 18,
                background: isActive ? "#0d1b2e" : "rgba(0,0,0,0.18)",
                borderRadius: 999, position: "relative", transition: "background 0.2s",
              }}>
                <span style={{
                  position: "absolute", top: 2,
                  left: isActive ? 16 : 2,
                  width: 14, height: 14,
                  background: "#fff", borderRadius: "50%",
                  transition: "left 0.2s",
                }} />
              </span>
            </button>
          )}
          <button onClick={onDelete} title={t.deletePackage} style={{ background: "transparent", border: "none", padding: "5px 4px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center" }}>
            <Icon name="trash" size={13} color="rgba(180,50,50,0.55)" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Desktop section header ──────────────────────────────────────────────────

function DesktopSecHead({ kicker, title, brand, light }: {
  kicker?: string; title: string; brand: string; light?: boolean;
}) {
  const ink = light ? "#fff" : "#0d1b2e";
  return (
    <div style={{ marginBottom: 28 }}>
      {kicker && (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: light ? "rgba(255,255,255,0.85)" : brand, letterSpacing: "1.6px", textTransform: "uppercase" }}>
          <span style={{ width: 18, height: 1, background: light ? "rgba(255,255,255,0.5)" : brand }} />
          {kicker}
        </div>
      )}
      <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.1, margin: "10px 0 0", color: ink }}>
        {title}
      </h2>
    </div>
  );
}

// ─── Desktop itinerary: 3-column grid ───────────────────────────────────────

export function SharedItineraryDesktop({ pkg, tokens, lang }: { pkg: TPackage; tokens: TemplateTokens; lang: Lang }) {
  const t = T[lang];
  const itinerary = (pkg.itinerary || []).filter(it => it.title?.trim());
  if (!itinerary.length) return null;
  return (
    <DContainer id="itinerary" style={{ padding: "52px 80px" }}>
      <DesktopSecHead kicker={t.dayByDay} title={`${itinerary.length}-day itinerary`} brand={tokens.brand} light={tokens.dark} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {itinerary.map((it, i) => (
          <div key={i} style={{ background: tokens.dark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${tokens.border}`, borderRadius: 12, padding: 18 }}>
            <div style={{ fontSize: 10.5, fontWeight: 800, color: tokens.brand, letterSpacing: "0.6px", textTransform: "uppercase" }}>Day {it.day}</div>
            <div style={{ fontSize: 15, fontWeight: 700, marginTop: 8, lineHeight: 1.3, color: tokens.dark ? "#fff" : tokens.ink }}>{it.title}</div>
            {it.desc && <div style={{ fontSize: 13, color: tokens.muted, marginTop: 8, lineHeight: 1.55 }}>{it.desc}</div>}
          </div>
        ))}
      </div>
    </DContainer>
  );
}

// ─── Desktop includes/excludes: 2-column grid ───────────────────────────────

export function SharedIncludesDesktop({ pkg, tokens, lang }: { pkg: TPackage; tokens: TemplateTokens; lang: Lang }) {
  const t = T[lang];
  const includes = pkg.includes?.length ? pkg.includes : (pkg.advantages || []);
  const excludes = pkg.excludes || [];
  if (!includes.length && !excludes.length) return null;
  return (
    <DContainer id="included" style={{ padding: "52px 80px" }}>
      <DesktopSecHead kicker={t.whatsIncluded} title={t.whatsIncluded} brand={tokens.brand} light={tokens.dark} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 48 }}>
        {includes.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#2dd4a0", marginBottom: 14, letterSpacing: "0.7px", textTransform: "uppercase" }}>
              {t.includedLabel} · {includes.length} items
            </div>
            {includes.map((it, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", alignItems: "flex-start" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(45,212,160,0.1)", color: "#2dd4a0", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, flexShrink: 0, marginTop: 2 }}>✓</div>
                <div style={{ fontSize: 13.5, color: tokens.dark ? "rgba(255,255,255,0.9)" : tokens.ink, lineHeight: 1.5 }}>{it}</div>
              </div>
            ))}
          </div>
        )}
        {excludes.length > 0 && (
          <div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", marginBottom: 14, letterSpacing: "0.7px", textTransform: "uppercase" }}>{t.notIncluded}</div>
            {excludes.map((it, i) => (
              <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", alignItems: "flex-start" }}>
                <div style={{ width: 18, height: 18, borderRadius: "50%", background: "rgba(239,68,68,0.07)", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 11, flexShrink: 0, marginTop: 2 }}>×</div>
                <div style={{ fontSize: 13.5, color: tokens.dark ? "rgba(255,255,255,0.9)" : tokens.ink, lineHeight: 1.5 }}>{it}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DContainer>
  );
}

// ─── Desktop hotel: 1.2:1 image + copy ──────────────────────────────────────

export function SharedHotelDesktop({ pkg, tokens, lang }: { pkg: TPackage; tokens: TemplateTokens; lang: Lang }) {
  const t = T[lang];
  if (!pkg.hotelDescription) return null;
  return (
    <DContainer style={{ padding: "52px 80px" }}>
      <DesktopSecHead kicker={t.hotelLabel} title={t.hotelSectionTitle} brand={tokens.brand} light={tokens.dark} />
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 40, alignItems: "center" }}>
        {pkg.images?.[0] && (
          <img src={pkg.images[0]} alt="" style={{ width: "100%", height: 360, objectFit: "cover", borderRadius: 14 }} />
        )}
        <p style={{ fontSize: 16, color: tokens.dark ? "rgba(255,255,255,0.8)" : tokens.muted, lineHeight: 1.75, margin: 0 }}>{pkg.hotelDescription}</p>
      </div>
    </DContainer>
  );
}

// ─── Desktop pricing: N-column grid ─────────────────────────────────────────

export function SharedPricingDesktop({ pkg, tokens, lang, onWhatsApp }: { pkg: TPackage; tokens: TemplateTokens; lang: Lang; onWhatsApp: () => void }) {
  const t = T[lang];
  const tiers = (pkg.pricingTiers || []).filter(tier => tier.price);
  if (!tiers.length) return null;
  return (
    <DContainer id="pricing" style={{ padding: "52px 80px" }}>
      <DesktopSecHead kicker="Pricing" title={t.chooseOption} brand={tokens.brand} light={tokens.dark} />
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${tiers.length}, 1fr)`, gap: 16 }}>
        {tiers.map((tier, i) => {
          const featured = i === 0;
          return (
            <div key={i} style={{
              background: featured ? tokens.brand : (tokens.dark ? "rgba(255,255,255,0.04)" : "#fff"),
              color: featured ? "#fff" : (tokens.dark ? "#fff" : tokens.ink),
              border: featured ? "1px solid transparent" : `1px solid ${tokens.border}`,
              borderRadius: 18, padding: "28px 28px", position: "relative",
              boxShadow: featured ? `0 12px 32px ${tokens.brand}33` : "none",
            }}>
              <div style={{ fontSize: 13.5, fontWeight: 600, opacity: featured ? 0.8 : 0.6, marginBottom: 14 }}>{localizeTierLabel(tier.label, lang)}</div>
              <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-1.2px", lineHeight: 1 }}>{tier.price}</div>
              <div style={{ fontSize: 11.5, opacity: 0.55, marginTop: 6 }}>{t.perPerson}</div>
              <div style={{ marginTop: 22 }}>
                <button onClick={onWhatsApp} style={{
                  width: "100%", padding: 12, borderRadius: 10, border: "none", cursor: "pointer", fontFamily: "inherit",
                  fontSize: 14, fontWeight: 700,
                  background: featured ? "rgba(255,255,255,0.22)" : tokens.brand,
                  color: "#fff",
                }}>{t.bookThisOption}</button>
              </div>
            </div>
          );
        })}
      </div>
    </DContainer>
  );
}

// ─── Desktop airports: full data table ──────────────────────────────────────

export function SharedAirportsDesktop({ pkg, tokens, lang, onWhatsApp }: { pkg: TPackage; tokens: TemplateTokens; lang: Lang; onWhatsApp: () => void }) {
  const t = T[lang];
  const airports = (pkg.airports || []).filter(a => a.name?.trim());
  if (!airports.length) return null;
  return (
    <DContainer style={{ padding: "52px 80px" }}>
      <DesktopSecHead kicker="Flights" title={t.departureOptions} brand={tokens.brand} light={tokens.dark} />
      <div style={{ background: tokens.dark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${tokens.border}`, borderRadius: 14, overflow: "hidden" }}>
        <div style={{
          display: "grid", gridTemplateColumns: "1.4fr 1.4fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr",
          padding: "14px 24px", fontSize: 10.5, fontWeight: 800, letterSpacing: "0.6px", textTransform: "uppercase",
          color: tokens.dark ? "rgba(255,255,255,0.5)" : tokens.superMuted,
          borderBottom: `1px solid ${tokens.border}`,
        }}>
          <div>From</div><div>To</div><div>Date</div><div>Departs</div><div>Arrives</div>
          <div style={{ textAlign: "right" }}>Price</div><div />
        </div>
        {airports.map((a, i) => (
          <div key={i} style={{
            display: "grid", gridTemplateColumns: "1.4fr 1.4fr 0.8fr 0.8fr 0.8fr 0.8fr 0.8fr",
            padding: "16px 24px", fontSize: 13.5, alignItems: "center",
            borderTop: i === 0 ? "none" : `1px solid ${tokens.border}`,
            color: tokens.dark ? "#fff" : tokens.ink,
          }}>
            <div style={{ fontWeight: 700 }}>{a.name}</div>
            <div style={{ fontWeight: 700 }}>{a.arrivingAirport || "—"}</div>
            <div style={{ color: tokens.muted }}>{a.date || "—"}</div>
            <div style={{ fontVariantNumeric: "tabular-nums" }}>{a.flyingTime || "—"}</div>
            <div style={{ fontVariantNumeric: "tabular-nums" }}>{a.arrivingTime || "—"}</div>
            <div style={{ textAlign: "right", fontWeight: 800, color: tokens.brand, fontVariantNumeric: "tabular-nums" }}>{a.price}</div>
            <div style={{ textAlign: "right" }}>
              <button onClick={onWhatsApp} style={{ padding: "8px 14px", borderRadius: 8, background: "#25d366", color: "#fff", border: "none", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {t.bookThisFlight}
              </button>
            </div>
          </div>
        ))}
      </div>
    </DContainer>
  );
}

// ─── Desktop gallery: video + 3-col grid ─────────────────────────────────────

export function SharedGalleryDesktop({ pkg, tokens, lang }: { pkg: TPackage; tokens: TemplateTokens; lang: Lang }) {
  const t = T[lang];
  const [lightboxIdx, setLightboxIdx] = React.useState<number | null>(null);
  const imgs = pkg.images || [];
  if (!imgs.length && !pkg.videoUrl) return null;
  return (
    <DContainer style={{ padding: "52px 80px" }}>
      <DesktopSecHead kicker={t.gallery} title={t.gallery} brand={tokens.brand} light={tokens.dark} />
      {pkg.videoUrl && (
        <video src={pkg.videoUrl} controls muted poster={pkg.coverImage} style={{ width: "100%", borderRadius: 14, marginBottom: 12, display: "block", background: "#000", maxHeight: 480 }} />
      )}
      {imgs.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {imgs.slice(0, 6).map((u, i) => (
            <img
              key={i} src={u} alt=""
              onClick={() => setLightboxIdx(i)}
              style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 10, cursor: "pointer" }}
            />
          ))}
        </div>
      )}
      {lightboxIdx !== null && (
        <LightboxCarousel images={imgs} startIndex={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </DContainer>
  );
}

// ─── Reviews ─────────────────────────────────────────────────────────────────

function StarRating({ rating, brand }: { rating: number; brand: string }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map(n => (
        <svg key={n} width="13" height="13" viewBox="0 0 24 24" fill={n <= rating ? brand : "none"} stroke={brand} strokeWidth="2">
          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
      ))}
    </div>
  );
}

export function SharedReviews({ pkg, tokens, lang, agency, reviews: reviewsProp }: { pkg: TPackage; tokens: TemplateTokens; lang: Lang; agency?: TAgency; reviews?: TReview[] }) {
  const t = T[lang];
  if (agency?.showReviews === false) return null;
  const reviews = (reviewsProp ?? pkg.reviews ?? []).filter(r => r.text?.trim());
  if (!reviews.length) return null;
  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  return (
    <section style={{ padding: "20px 18px" }}>
      <Eyebrow text={t.reviewsSectionTitle} brand={tokens.brand} />
      <h2 style={{ fontFamily: tokens.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.4px", color: tokens.ink, margin: "10px 0 12px" }}>
        {t.reviewsSectionSubtitle}
      </h2>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
        <StarRating rating={Math.round(avgRating)} brand={tokens.brand} />
        <span style={{ fontSize: 14, fontWeight: 800, color: tokens.ink }}>{avgRating.toFixed(1)}</span>
        <span style={{ fontSize: 12, color: tokens.muted }}>· {reviews.length} {reviews.length === 1 ? t.reviewLabel : t.reviewsLabel}</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {reviews.map((r, i) => {
          const initials = (r.name || "?").slice(0, 2).toUpperCase();
          return (
            <div key={r.id ?? i} style={{ background: tokens.dark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${tokens.border}`, borderRadius: 14, padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                {r.avatarUrl
                  ? <img src={r.avatarUrl} alt="" style={{ width: 34, height: 34, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                  : <div style={{ width: 34, height: 34, borderRadius: "50%", background: `${tokens.brand}20`, border: `1px solid ${tokens.brand}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: tokens.brand, flexShrink: 0 }}>{initials}</div>
                }
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: tokens.ink }}>{r.name}</div>
                  <StarRating rating={r.rating} brand={tokens.brand} />
                </div>
              </div>
              <p style={{ fontSize: 13, color: tokens.muted, lineHeight: 1.6, margin: 0 }}>{r.text}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function SharedReviewsDesktop({ pkg, tokens, lang, agency, reviews: reviewsProp }: { pkg: TPackage; tokens: TemplateTokens; lang: Lang; agency?: TAgency; reviews?: TReview[] }) {
  const t = T[lang];
  if (agency?.showReviews === false) return null;
  const reviews = (reviewsProp ?? pkg.reviews ?? []).filter(r => r.text?.trim());
  if (!reviews.length) return null;
  const avgRating = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const ink = tokens.dark ? "#fff" : tokens.ink;
  return (
    <DContainer style={{ padding: "52px 80px" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap", gap: 16 }}>
        <div>
          <DesktopSecHead kicker={t.reviewsSectionTitle} title={t.reviewsSectionSubtitle} brand={tokens.brand} light={tokens.dark} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingBottom: 4 }}>
          <StarRating rating={Math.round(avgRating)} brand={tokens.brand} />
          <span style={{ fontSize: 22, fontWeight: 800, color: ink }}>{avgRating.toFixed(1)}</span>
          <span style={{ fontSize: 13, color: tokens.muted }}>· {reviews.length} {reviews.length === 1 ? t.reviewLabel : t.reviewsLabel}</span>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {reviews.map((r, i) => {
          const initials = (r.name || "?").slice(0, 2).toUpperCase();
          return (
            <div key={r.id ?? i} style={{ background: tokens.dark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${tokens.border}`, borderRadius: 16, padding: "24px" }}>
              <StarRating rating={r.rating} brand={tokens.brand} />
              <p style={{ fontSize: 14, color: tokens.dark ? "rgba(255,255,255,0.8)" : tokens.muted, lineHeight: 1.65, margin: "12px 0 16px" }}>{r.text}</p>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {r.avatarUrl
                  ? <img src={r.avatarUrl} alt="" style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                  : <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${tokens.brand}20`, border: `1px solid ${tokens.brand}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 800, color: tokens.brand }}>{initials}</div>
                }
                <div style={{ fontSize: 13, fontWeight: 700, color: ink }}>{r.name}</div>
              </div>
            </div>
          );
        })}
      </div>
    </DContainer>
  );
}

// ─── Visitor review submission form ─────────────────────────────────────────

export function VisitorReviewForm({ pkg, agency, tokens, lang, onNewReview }: {
  pkg: TPackage; agency: TAgency; tokens: TemplateTokens; lang: Lang;
  onNewReview?: (review: TReview) => void;
}) {
  const t = T[lang];
  if (!agency.enableReviews) return null;

  const [name, setName] = React.useState("");
  const [text, setText] = React.useState("");
  const [rating, setRating] = React.useState(5);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || !text.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/submit-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id, name: name.trim(), text: text.trim(), rating }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      onNewReview?.({ id: crypto.randomUUID(), name: name.trim(), text: text.trim(), rating, createdAt: Date.now() });
      setSubmitted(true);
    } catch {
      setError(t.reviewSubmitError);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: tokens.dark ? "rgba(255,255,255,0.06)" : "#fff",
    border: `1px solid ${tokens.border}`, borderRadius: 10,
    padding: "10px 14px", color: tokens.ink, fontSize: 13,
    fontFamily: "inherit", outline: "none",
  };

  if (submitted) {
    return (
      <section style={{ padding: "20px 18px" }}>
        <div style={{ padding: "20px 18px", borderRadius: 14, background: `${tokens.brand}12`, border: `1px solid ${tokens.brand}30`, textAlign: "center" }}>
          <div style={{ fontSize: 22, marginBottom: 8 }}>★</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: tokens.ink }}>{t.reviewSubmitSuccess}</div>
        </div>
      </section>
    );
  }

  return (
    <section style={{ padding: "20px 18px" }}>
      <Eyebrow text={t.writeReviewTitle} brand={tokens.brand} />
      <h2 style={{ fontFamily: tokens.serif, fontSize: 22, fontWeight: 400, letterSpacing: "-0.3px", color: tokens.ink, margin: "10px 0 6px" }}>
        {t.writeReviewTitle}
      </h2>
      <p style={{ fontSize: 13, color: tokens.muted, marginBottom: 18 }}>{t.writeReviewSub}</p>

      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => setRating(n)}
            onMouseEnter={() => setHoverRating(n)}
            onMouseLeave={() => setHoverRating(0)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 2, fontSize: 26, lineHeight: 1, color: n <= (hoverRating || rating) ? tokens.brand : tokens.border }}
          >★</button>
        ))}
      </div>

      <input
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder={t.reviewYourName}
        style={{ ...inputStyle, marginBottom: 10 }}
      />
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder={t.reviewPlaceholder}
        rows={4}
        style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, marginBottom: 12 }}
      />
      {error && <p style={{ fontSize: 12, color: "#ef4444", marginBottom: 10 }}>{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={submitting || !name.trim() || !text.trim()}
        style={{
          padding: "11px 22px", borderRadius: 10, border: "none", cursor: submitting || !name.trim() || !text.trim() ? "not-allowed" : "pointer",
          background: tokens.brand, color: "#fff", fontSize: 13, fontWeight: 700,
          fontFamily: "inherit", opacity: submitting || !name.trim() || !text.trim() ? 0.55 : 1,
        }}
      >
        {submitting ? "…" : t.submitReviewBtn}
      </button>
    </section>
  );
}

export function VisitorReviewFormDesktop({ pkg, agency, tokens, lang, onNewReview }: {
  pkg: TPackage; agency: TAgency; tokens: TemplateTokens; lang: Lang;
  onNewReview?: (review: TReview) => void;
}) {
  const t = T[lang];
  if (!agency.enableReviews) return null;

  const [name, setName] = React.useState("");
  const [text, setText] = React.useState("");
  const [rating, setRating] = React.useState(5);
  const [hoverRating, setHoverRating] = React.useState(0);
  const [submitting, setSubmitting] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    if (!name.trim() || !text.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/submit-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ packageId: pkg.id, name: name.trim(), text: text.trim(), rating }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      onNewReview?.({ id: crypto.randomUUID(), name: name.trim(), text: text.trim(), rating, createdAt: Date.now() });
      setSubmitted(true);
    } catch {
      setError(t.reviewSubmitError);
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", background: tokens.dark ? "rgba(255,255,255,0.06)" : "#fff",
    border: `1px solid ${tokens.border}`, borderRadius: 10,
    padding: "12px 16px", color: tokens.ink, fontSize: 14,
    fontFamily: "inherit", outline: "none",
  };

  if (submitted) {
    return (
      <DContainer style={{ padding: "36px 80px" }}>
        <div style={{ padding: "28px 32px", borderRadius: 18, background: `${tokens.brand}10`, border: `1px solid ${tokens.brand}25`, textAlign: "center", maxWidth: 500 }}>
          <div style={{ fontSize: 28, marginBottom: 10 }}>★</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: tokens.ink }}>{t.reviewSubmitSuccess}</div>
        </div>
      </DContainer>
    );
  }

  return (
    <DContainer style={{ padding: "44px 80px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: 64, alignItems: "start" }}>
        <div>
          <Eyebrow text={t.writeReviewTitle} brand={tokens.brand} />
          <h2 style={{ fontFamily: tokens.serif, fontSize: 38, fontWeight: 400, letterSpacing: "-0.6px", lineHeight: 1.1, color: tokens.dark ? "#fff" : tokens.ink, margin: "14px 0 12px" }}>
            {t.writeReviewTitle}
          </h2>
          <p style={{ fontSize: 15, color: tokens.muted, lineHeight: 1.65 }}>{t.writeReviewSub}</p>
        </div>
        <div>
          <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => setRating(n)}
                onMouseEnter={() => setHoverRating(n)}
                onMouseLeave={() => setHoverRating(0)}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 3, fontSize: 32, lineHeight: 1, color: n <= (hoverRating || rating) ? tokens.brand : tokens.border }}
              >★</button>
            ))}
          </div>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t.reviewYourName}
            style={{ ...inputStyle, marginBottom: 12 }}
          />
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder={t.reviewPlaceholder}
            rows={5}
            style={{ ...inputStyle, resize: "vertical", lineHeight: 1.65, marginBottom: 14 }}
          />
          {error && <p style={{ fontSize: 13, color: "#ef4444", marginBottom: 12 }}>{error}</p>}
          <button
            onClick={handleSubmit}
            disabled={submitting || !name.trim() || !text.trim()}
            style={{
              padding: "13px 28px", borderRadius: 10, border: "none", cursor: submitting || !name.trim() || !text.trim() ? "not-allowed" : "pointer",
              background: tokens.brand, color: "#fff", fontSize: 14, fontWeight: 700,
              fontFamily: "inherit", opacity: submitting || !name.trim() || !text.trim() ? 0.55 : 1,
            }}
          >
            {submitting ? "…" : t.submitReviewBtn}
          </button>
        </div>
      </div>
    </DContainer>
  );
}

// ─── Combined reviews + form (manages local state for instant update) ────────

export function ReviewsSection({ pkg, tokens, lang, agency }: {
  pkg: TPackage; tokens: TemplateTokens; lang: Lang; agency: TAgency;
}) {
  const [localReviews, setLocalReviews] = React.useState<TReview[]>(() => (pkg.reviews || []).filter(r => r.text?.trim()));
  const addReview = (r: TReview) => setLocalReviews(prev => [...prev, r]);
  return (
    <>
      <SharedReviews pkg={pkg} tokens={tokens} lang={lang} agency={agency} reviews={localReviews} />
      <VisitorReviewForm pkg={pkg} agency={agency} tokens={tokens} lang={lang} onNewReview={addReview} />
    </>
  );
}

export function ReviewsSectionDesktop({ pkg, tokens, lang, agency }: {
  pkg: TPackage; tokens: TemplateTokens; lang: Lang; agency: TAgency;
}) {
  const [localReviews, setLocalReviews] = React.useState<TReview[]>(() => (pkg.reviews || []).filter(r => r.text?.trim()));
  const addReview = (r: TReview) => setLocalReviews(prev => [...prev, r]);
  return (
    <>
      <SharedReviewsDesktop pkg={pkg} tokens={tokens} lang={lang} agency={agency} reviews={localReviews} />
      <VisitorReviewFormDesktop pkg={pkg} agency={agency} tokens={tokens} lang={lang} onNewReview={addReview} />
    </>
  );
}

// ─── Highlights ──────────────────────────────────────────────────────────────

export function SharedHighlights({ items, tokens, lang }: {
  items: unknown; tokens: TemplateTokens; lang: Lang;
}) {
  const strItems = (Array.isArray(items) ? items : []).map(i => String(i)).filter(Boolean);
  if (!strItems.length) return null;
  const isRtl = lang === "ar";
  const title = isRtl ? "أبرز المميزات" : "Highlights";
  return (
    <section style={{ padding: "20px 18px" }}>
      <Eyebrow text={title} brand={tokens.brand} />
      <h2 style={{ fontFamily: tokens.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.4px", color: tokens.ink, margin: "10px 0 16px" }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        {strItems.map((item, i) => (
          <div key={i} style={{ padding: "7px 14px", borderRadius: 99, background: `${tokens.brand}12`, border: `1px solid ${tokens.brand}30`, fontSize: 13, fontWeight: 600, color: tokens.brand, direction: isRtl ? "rtl" : "ltr" }}>
            ✦ {item}
          </div>
        ))}
      </div>
    </section>
  );
}

export function SharedHighlightsDesktop({ items, tokens, lang }: {
  items: unknown; tokens: TemplateTokens; lang: Lang;
}) {
  const strItems = (Array.isArray(items) ? items : []).map(i => String(i)).filter(Boolean);
  if (!strItems.length) return null;
  const isRtl = lang === "ar";
  const title = isRtl ? "أبرز المميزات" : "Highlights";
  return (
    <DContainer style={{ padding: "52px 80px" }}>
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: tokens.dark ? "rgba(255,255,255,0.85)" : tokens.brand, letterSpacing: "1.6px", textTransform: "uppercase" }}>
          <span style={{ width: 18, height: 1, background: tokens.dark ? "rgba(255,255,255,0.5)" : tokens.brand }} />
          {title}
        </div>
        <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.1, margin: "10px 0 0", color: tokens.dark ? "#fff" : tokens.ink }}>
          {title}
        </h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
        {strItems.map((item, i) => (
          <div key={i} style={{ padding: "14px 18px", borderRadius: 12, background: tokens.dark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${i === 0 ? tokens.brand + "40" : tokens.border}`, fontSize: 14, fontWeight: 600, color: tokens.dark ? "#fff" : tokens.ink, display: "flex", alignItems: "center", gap: 10, direction: isRtl ? "rtl" : "ltr" }}>
            <span style={{ color: tokens.brand, fontSize: 18, flexShrink: 0 }}>✦</span>
            {item}
          </div>
        ))}
      </div>
    </DContainer>
  );
}

// ─── FAQ ─────────────────────────────────────────────────────────────────────

export function SharedFaq({ items, tokens, lang }: {
  items: unknown; tokens: TemplateTokens; lang: Lang;
}) {
  const faqItems = (Array.isArray(items) ? items : []) as Array<{ question?: string; answer?: string }>;
  const valid = faqItems.filter(it => it?.question?.trim());
  if (!valid.length) return null;
  const isRtl = lang === "ar";
  const title = isRtl ? "الأسئلة الشائعة" : "FAQ";
  return (
    <section style={{ padding: "20px 18px" }}>
      <h2 style={{ fontFamily: tokens.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.4px", color: tokens.ink, marginBottom: 20 }}>
        {title}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {valid.map((it, i) => (
          <div key={i} style={{ background: tokens.dark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${tokens.border}`, borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: tokens.ink, marginBottom: it.answer ? 8 : 0, direction: isRtl ? "rtl" : "ltr" }}>{it.question}</div>
            {it.answer && <div style={{ fontSize: 13, color: tokens.muted, lineHeight: 1.6, direction: isRtl ? "rtl" : "ltr" }}>{it.answer}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function SharedFaqDesktop({ items, tokens, lang }: {
  items: unknown; tokens: TemplateTokens; lang: Lang;
}) {
  const faqItems = (Array.isArray(items) ? items : []) as Array<{ question?: string; answer?: string }>;
  const valid = faqItems.filter(it => it?.question?.trim());
  if (!valid.length) return null;
  const isRtl = lang === "ar";
  const title = isRtl ? "الأسئلة الشائعة" : "FAQ";
  return (
    <DContainer style={{ padding: "52px 80px" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.1, margin: 0, color: tokens.dark ? "#fff" : tokens.ink }}>{title}</h2>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {valid.map((it, i) => (
          <div key={i} style={{ background: tokens.dark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${tokens.border}`, borderRadius: 14, padding: "20px 22px" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: tokens.dark ? "#fff" : tokens.ink, marginBottom: it.answer ? 10 : 0, direction: isRtl ? "rtl" : "ltr" }}>{it.question}</div>
            {it.answer && <div style={{ fontSize: 13.5, color: tokens.muted, lineHeight: 1.65, direction: isRtl ? "rtl" : "ltr" }}>{it.answer}</div>}
          </div>
        ))}
      </div>
    </DContainer>
  );
}

// ─── Booking Terms ────────────────────────────────────────────────────────────

export function SharedBookingTerms({ content, tokens, lang }: {
  content: unknown; tokens: TemplateTokens; lang: Lang;
}) {
  const text = typeof content === "string" ? content.trim() : "";
  if (!text) return null;
  const isRtl = lang === "ar";
  const title = isRtl ? "شروط الحجز" : "Booking Terms";
  return (
    <section style={{ padding: "20px 18px" }}>
      <h2 style={{ fontFamily: tokens.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.4px", color: tokens.ink, marginBottom: 16 }}>
        {title}
      </h2>
      <div style={{ background: tokens.dark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${tokens.border}`, borderRadius: 14, padding: "16px 18px" }}>
        <p style={{ fontSize: 13, color: tokens.muted, lineHeight: 1.75, margin: 0, direction: isRtl ? "rtl" : "ltr", whiteSpace: "pre-wrap" }}>{text}</p>
      </div>
    </section>
  );
}

export function SharedBookingTermsDesktop({ content, tokens, lang }: {
  content: unknown; tokens: TemplateTokens; lang: Lang;
}) {
  const text = typeof content === "string" ? content.trim() : "";
  if (!text) return null;
  const isRtl = lang === "ar";
  const title = isRtl ? "شروط الحجز" : "Booking Terms";
  return (
    <DContainer style={{ padding: "52px 80px" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.1, margin: 0, color: tokens.dark ? "#fff" : tokens.ink }}>{title}</h2>
      </div>
      <div style={{ background: tokens.dark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${tokens.border}`, borderRadius: 14, padding: "24px 28px", maxWidth: 800 }}>
        <p style={{ fontSize: 14, color: tokens.muted, lineHeight: 1.8, margin: 0, direction: isRtl ? "rtl" : "ltr", whiteSpace: "pre-wrap" }}>{text}</p>
      </div>
    </DContainer>
  );
}

// ─── Custom Section ───────────────────────────────────────────────────────────

export function SharedCustomSection({ heading, content, image, tokens, lang }: {
  heading: unknown; content?: unknown; image?: unknown;
  tokens: TemplateTokens; lang: Lang;
}) {
  const h   = typeof heading === "string" ? heading.trim() : "";
  const c   = typeof content === "string" ? content.trim() : "";
  const img = typeof image   === "string" ? image.trim()   : "";
  if (!h && !c) return null;
  const isRtl = lang === "ar";
  return (
    <section style={{ padding: "20px 18px" }}>
      {h && (
        <h2 style={{ fontFamily: tokens.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.4px", color: tokens.ink, marginBottom: 14, direction: isRtl ? "rtl" : "ltr" }}>
          {h}
        </h2>
      )}
      {img && <img src={img} alt="" style={{ width: "100%", borderRadius: 12, marginBottom: 14, aspectRatio: "16/9", objectFit: "cover", display: "block" }} />}
      {c && <p style={{ fontSize: 14, color: tokens.muted, lineHeight: 1.75, margin: 0, direction: isRtl ? "rtl" : "ltr" }}>{c}</p>}
    </section>
  );
}

export function SharedCustomSectionDesktop({ heading, content, image, tokens, lang }: {
  heading: unknown; content?: unknown; image?: unknown;
  tokens: TemplateTokens; lang: Lang;
}) {
  const h   = typeof heading === "string" ? heading.trim() : "";
  const c   = typeof content === "string" ? content.trim() : "";
  const img = typeof image   === "string" ? image.trim()   : "";
  if (!h && !c) return null;
  const isRtl = lang === "ar";
  return (
    <DContainer style={{ padding: "52px 80px" }}>
      {h && (
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.1, margin: 0, color: tokens.dark ? "#fff" : tokens.ink, direction: isRtl ? "rtl" : "ltr" }}>{h}</h2>
        </div>
      )}
      {img ? (
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 40, alignItems: "start" }}>
          <img src={img} alt="" style={{ width: "100%", borderRadius: 14, aspectRatio: "16/9", objectFit: "cover", display: "block" }} />
          {c && <p style={{ fontSize: 15, color: tokens.muted, lineHeight: 1.75, margin: 0, direction: isRtl ? "rtl" : "ltr" }}>{c}</p>}
        </div>
      ) : (
        c && <p style={{ fontSize: 15, color: tokens.muted, lineHeight: 1.75, margin: 0, maxWidth: 720, direction: isRtl ? "rtl" : "ltr" }}>{c}</p>
      )}
    </DContainer>
  );
}

// ─── Extras ───────────────────────────────────────────────────────────────────

export function SharedExtras({ items, tokens, lang }: { items: unknown; tokens: TemplateTokens; lang: Lang }) {
  const list = (Array.isArray(items) ? items : []) as Array<{ name?: string; description?: string; price?: string }>;
  const valid = list.filter(it => it?.name?.trim());
  if (!valid.length) return null;
  const isRtl = lang === "ar";
  const title = T[lang].sectionExtrasTitle;
  return (
    <section style={{ padding: "20px 18px" }}>
      <h2 style={{ fontFamily: tokens.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.4px", color: tokens.ink, marginBottom: 14 }}>{title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {valid.map((it, i) => (
          <div key={i} style={{ background: tokens.dark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${tokens.border}`, borderRadius: 12, padding: "14px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: tokens.ink, direction: isRtl ? "rtl" : "ltr" }}>{it.name}</div>
              {it.price && <div style={{ fontSize: 13, fontWeight: 700, color: tokens.brand, whiteSpace: "nowrap" }}>{it.price}</div>}
            </div>
            {it.description && <div style={{ fontSize: 12.5, color: tokens.muted, lineHeight: 1.6, marginTop: 5, direction: isRtl ? "rtl" : "ltr" }}>{it.description}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

export function SharedExtrasDesktop({ items, tokens, lang }: { items: unknown; tokens: TemplateTokens; lang: Lang }) {
  const list = (Array.isArray(items) ? items : []) as Array<{ name?: string; description?: string; price?: string }>;
  const valid = list.filter(it => it?.name?.trim());
  if (!valid.length) return null;
  const isRtl = lang === "ar";
  const title = T[lang].sectionExtrasTitle;
  return (
    <DContainer style={{ padding: "52px 80px" }}>
      <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.1, color: tokens.ink, marginBottom: 28 }}>{title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14 }}>
        {valid.map((it, i) => (
          <div key={i} style={{ background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 14, padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8, marginBottom: it.description ? 8 : 0 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: tokens.ink, direction: isRtl ? "rtl" : "ltr" }}>{it.name}</div>
              {it.price && <div style={{ fontSize: 14, fontWeight: 700, color: tokens.brand, whiteSpace: "nowrap" }}>{it.price}</div>}
            </div>
            {it.description && <div style={{ fontSize: 13, color: tokens.muted, lineHeight: 1.6, direction: isRtl ? "rtl" : "ltr" }}>{it.description}</div>}
          </div>
        ))}
      </div>
    </DContainer>
  );
}

// ─── Meals ────────────────────────────────────────────────────────────────────

export function SharedMeals({ plan, notes, tokens, lang }: { plan: unknown; notes: unknown; tokens: TemplateTokens; lang: Lang }) {
  const p = typeof plan === "string" ? plan : "none";
  const n = typeof notes === "string" ? notes.trim() : "";
  const t = T[lang];
  const mealKey = p === "none" ? "mealNone" : p === "breakfast" ? "mealBreakfast" : p === "half_board" ? "mealHalfBoard" : p === "full_board" ? "mealFullBoard" : p === "all_inclusive" ? "mealAllInclusive" : null;
  const label = mealKey ? t[mealKey] : t.mealNotSpecified;
  const title = t.sectionMealsTitle;
  const isRtl = lang === "ar";
  return (
    <section style={{ padding: "20px 18px" }}>
      <h2 style={{ fontFamily: tokens.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.4px", color: tokens.ink, marginBottom: 14 }}>{title}</h2>
      <div style={{ background: tokens.dark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${tokens.border}`, borderRadius: 14, padding: "16px 18px" }}>
        <div style={{ display: "inline-flex", padding: "6px 14px", borderRadius: 99, background: `${tokens.brand}15`, border: `1px solid ${tokens.brand}30`, fontSize: 13, fontWeight: 700, color: tokens.brand, marginBottom: n ? 12 : 0 }}>
          {label}
        </div>
        {n && <p style={{ fontSize: 13, color: tokens.muted, lineHeight: 1.7, margin: 0, direction: isRtl ? "rtl" : "ltr" }}>{n}</p>}
      </div>
    </section>
  );
}

export function SharedMealsDesktop({ plan, notes, tokens, lang }: { plan: unknown; notes: unknown; tokens: TemplateTokens; lang: Lang }) {
  const p = typeof plan === "string" ? plan : "none";
  const n = typeof notes === "string" ? notes.trim() : "";
  const t = T[lang];
  const mealKey = p === "none" ? "mealNone" : p === "breakfast" ? "mealBreakfast" : p === "half_board" ? "mealHalfBoard" : p === "full_board" ? "mealFullBoard" : p === "all_inclusive" ? "mealAllInclusive" : null;
  const label = mealKey ? t[mealKey] : t.mealNotSpecified;
  const title = t.sectionMealsTitle;
  const isRtl = lang === "ar";
  return (
    <DContainer style={{ padding: "52px 80px" }}>
      <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.1, color: tokens.ink, marginBottom: 22 }}>{title}</h2>
      <div style={{ display: "inline-flex", padding: "8px 20px", borderRadius: 99, background: `${tokens.brand}15`, border: `1px solid ${tokens.brand}30`, fontSize: 15, fontWeight: 700, color: tokens.brand, marginBottom: n ? 16 : 0 }}>
        {label}
      </div>
      {n && <p style={{ fontSize: 15, color: tokens.muted, lineHeight: 1.75, margin: 0, maxWidth: 680, direction: isRtl ? "rtl" : "ltr" }}>{n}</p>}
    </DContainer>
  );
}

// ─── Tour Guide ───────────────────────────────────────────────────────────────

export function SharedGuide({ name, bio, photo, languages, tokens, lang }: {
  name: unknown; bio: unknown; photo: unknown; languages: unknown;
  tokens: TemplateTokens; lang: Lang;
}) {
  const n = typeof name === "string" ? name.trim() : "";
  const b = typeof bio === "string" ? bio.trim() : "";
  const img = typeof photo === "string" ? photo.trim() : "";
  const langs = (Array.isArray(languages) ? languages : []).map(l => String(l)).filter(Boolean);
  if (!n && !b) return null;
  const isRtl = lang === "ar";
  const title = T[lang].sectionGuideTitle;
  return (
    <section style={{ padding: "20px 18px" }}>
      <h2 style={{ fontFamily: tokens.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.4px", color: tokens.ink, marginBottom: 14 }}>{title}</h2>
      <div style={{ background: tokens.dark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${tokens.border}`, borderRadius: 14, padding: "18px 16px", display: "flex", gap: 14, alignItems: "flex-start" }}>
        {img && <img src={img} alt={n} style={{ width: 60, height: 60, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />}
        <div style={{ flex: 1 }}>
          {n && <div style={{ fontSize: 15, fontWeight: 700, color: tokens.ink, marginBottom: 4, direction: isRtl ? "rtl" : "ltr" }}>{n}</div>}
          {langs.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: b ? 10 : 0 }}>
              {langs.map((l, i) => (
                <span key={i} style={{ fontSize: 11, padding: "2px 8px", borderRadius: 99, background: `${tokens.brand}12`, color: tokens.brand, fontWeight: 600 }}>{l}</span>
              ))}
            </div>
          )}
          {b && <p style={{ fontSize: 13, color: tokens.muted, lineHeight: 1.65, margin: 0, direction: isRtl ? "rtl" : "ltr" }}>{b}</p>}
        </div>
      </div>
    </section>
  );
}

export function SharedGuideDesktop({ name, bio, photo, languages, tokens, lang }: {
  name: unknown; bio: unknown; photo: unknown; languages: unknown;
  tokens: TemplateTokens; lang: Lang;
}) {
  const n = typeof name === "string" ? name.trim() : "";
  const b = typeof bio === "string" ? bio.trim() : "";
  const img = typeof photo === "string" ? photo.trim() : "";
  const langs = (Array.isArray(languages) ? languages : []).map(l => String(l)).filter(Boolean);
  if (!n && !b) return null;
  const isRtl = lang === "ar";
  const title = T[lang].sectionGuideTitle;
  return (
    <DContainer style={{ padding: "52px 80px" }}>
      <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.1, color: tokens.ink, marginBottom: 28 }}>{title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: img ? "auto 1fr" : "1fr", gap: 32, alignItems: "start", maxWidth: 700 }}>
        {img && <img src={img} alt={n} style={{ width: 100, height: 100, borderRadius: "50%", objectFit: "cover" }} />}
        <div>
          {n && <div style={{ fontSize: 22, fontWeight: 700, color: tokens.ink, marginBottom: 8, direction: isRtl ? "rtl" : "ltr" }}>{n}</div>}
          {langs.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
              {langs.map((l, i) => (
                <span key={i} style={{ fontSize: 12, padding: "3px 10px", borderRadius: 99, background: `${tokens.brand}12`, color: tokens.brand, fontWeight: 600 }}>{l}</span>
              ))}
            </div>
          )}
          {b && <p style={{ fontSize: 15, color: tokens.muted, lineHeight: 1.75, margin: 0, direction: isRtl ? "rtl" : "ltr" }}>{b}</p>}
        </div>
      </div>
    </DContainer>
  );
}

// ─── Important Notes ──────────────────────────────────────────────────────────

export function SharedImportantNotes({ items, tokens, lang }: { items: unknown; tokens: TemplateTokens; lang: Lang }) {
  const list = (Array.isArray(items) ? items : []) as Array<{ text?: string }>;
  const valid = list.filter(it => it?.text?.trim());
  if (!valid.length) return null;
  const isRtl = lang === "ar";
  const title = T[lang].sectionImportantNotesTitle;
  return (
    <section style={{ padding: "20px 18px" }}>
      <h2 style={{ fontFamily: tokens.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.4px", color: tokens.ink, marginBottom: 14 }}>{title}</h2>
      <div style={{ background: `${tokens.brand}08`, border: `1px solid ${tokens.brand}25`, borderRadius: 14, padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10 }}>
        {valid.map((it, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: tokens.brand, fontSize: 16, lineHeight: 1, marginTop: 1, flexShrink: 0 }}>⚑</span>
            <p style={{ fontSize: 13, color: tokens.ink, lineHeight: 1.65, margin: 0, direction: isRtl ? "rtl" : "ltr" }}>{it.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SharedImportantNotesDesktop({ items, tokens, lang }: { items: unknown; tokens: TemplateTokens; lang: Lang }) {
  const list = (Array.isArray(items) ? items : []) as Array<{ text?: string }>;
  const valid = list.filter(it => it?.text?.trim());
  if (!valid.length) return null;
  const isRtl = lang === "ar";
  const title = T[lang].sectionImportantNotesTitle;
  return (
    <DContainer style={{ padding: "52px 80px" }}>
      <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.1, color: tokens.ink, marginBottom: 28 }}>{title}</h2>
      <div style={{ background: `${tokens.brand}08`, border: `1px solid ${tokens.brand}25`, borderRadius: 16, padding: "24px 28px", display: "grid", gridTemplateColumns: valid.length > 3 ? "1fr 1fr" : "1fr", gap: 14, maxWidth: 800 }}>
        {valid.map((it, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ color: tokens.brand, fontSize: 18, lineHeight: 1, marginTop: 1, flexShrink: 0 }}>⚑</span>
            <p style={{ fontSize: 14, color: tokens.ink, lineHeight: 1.7, margin: 0, direction: isRtl ? "rtl" : "ltr" }}>{it.text}</p>
          </div>
        ))}
      </div>
    </DContainer>
  );
}

// ─── About Agency ─────────────────────────────────────────────────────────────

export function SharedAboutAgency({ content, image, tokens, lang }: { content: unknown; image: unknown; tokens: TemplateTokens; lang: Lang }) {
  const c = typeof content === "string" ? content.trim() : "";
  const img = typeof image === "string" ? image.trim() : "";
  if (!c && !img) return null;
  const isRtl = lang === "ar";
  const title = T[lang].sectionAboutAgencyTitle;
  return (
    <section style={{ padding: "20px 18px" }}>
      <h2 style={{ fontFamily: tokens.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.4px", color: tokens.ink, marginBottom: 14 }}>{title}</h2>
      {img && <img src={img} alt="" style={{ width: "100%", borderRadius: 12, marginBottom: 14, aspectRatio: "16/9", objectFit: "cover", display: "block" }} />}
      {c && <p style={{ fontSize: 14, color: tokens.muted, lineHeight: 1.75, margin: 0, direction: isRtl ? "rtl" : "ltr" }}>{c}</p>}
    </section>
  );
}

export function SharedAboutAgencyDesktop({ content, image, tokens, lang }: { content: unknown; image: unknown; tokens: TemplateTokens; lang: Lang }) {
  const c = typeof content === "string" ? content.trim() : "";
  const img = typeof image === "string" ? image.trim() : "";
  if (!c && !img) return null;
  const isRtl = lang === "ar";
  const title = T[lang].sectionAboutAgencyTitle;
  return (
    <DContainer style={{ padding: "52px 80px" }}>
      <div style={{ display: "grid", gridTemplateColumns: img ? "1fr 1fr" : "1fr", gap: 48, alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.1, color: tokens.ink, marginBottom: 20 }}>{title}</h2>
          {c && <p style={{ fontSize: 15, color: tokens.muted, lineHeight: 1.75, margin: 0, direction: isRtl ? "rtl" : "ltr" }}>{c}</p>}
        </div>
        {img && <img src={img} alt="" style={{ width: "100%", borderRadius: 16, aspectRatio: "4/3", objectFit: "cover", display: "block" }} />}
      </div>
    </DContainer>
  );
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export function SharedSchedule({ items, tokens, lang }: { items: unknown; tokens: TemplateTokens; lang: Lang }) {
  const list = (Array.isArray(items) ? items : []) as Array<{ time?: string; activity?: string; location?: string }>;
  const valid = list.filter(it => it?.activity?.trim());
  if (!valid.length) return null;
  const isRtl = lang === "ar";
  const title = T[lang].sectionScheduleTitle;
  return (
    <section style={{ padding: "20px 18px" }}>
      <h2 style={{ fontFamily: tokens.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.4px", color: tokens.ink, marginBottom: 14 }}>{title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {valid.map((it, i) => (
          <div key={i} style={{ display: "flex", gap: 14, padding: "12px 0", borderBottom: i < valid.length - 1 ? `1px solid ${tokens.border}` : "none", alignItems: "flex-start" }}>
            {it.time && <div style={{ fontSize: 12, fontWeight: 700, color: tokens.brand, minWidth: 44, flexShrink: 0, paddingTop: 2 }}>{it.time}</div>}
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: tokens.ink, direction: isRtl ? "rtl" : "ltr" }}>{it.activity}</div>
              {it.location && <div style={{ fontSize: 12, color: tokens.muted, marginTop: 2, direction: isRtl ? "rtl" : "ltr" }}>{it.location}</div>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SharedScheduleDesktop({ items, tokens, lang }: { items: unknown; tokens: TemplateTokens; lang: Lang }) {
  const list = (Array.isArray(items) ? items : []) as Array<{ time?: string; activity?: string; location?: string }>;
  const valid = list.filter(it => it?.activity?.trim());
  if (!valid.length) return null;
  const isRtl = lang === "ar";
  const title = T[lang].sectionScheduleTitle;
  return (
    <DContainer style={{ padding: "52px 80px" }}>
      <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.1, color: tokens.ink, marginBottom: 28 }}>{title}</h2>
      <div style={{ maxWidth: 700 }}>
        {valid.map((it, i) => (
          <div key={i} style={{ display: "flex", gap: 24, padding: "14px 0", borderBottom: i < valid.length - 1 ? `1px solid ${tokens.border}` : "none", alignItems: "flex-start" }}>
            {it.time && <div style={{ fontSize: 13, fontWeight: 700, color: tokens.brand, minWidth: 52, flexShrink: 0, paddingTop: 2 }}>{it.time}</div>}
            <div>
              <div style={{ fontSize: 15, fontWeight: 600, color: tokens.ink, direction: isRtl ? "rtl" : "ltr" }}>{it.activity}</div>
              {it.location && <div style={{ fontSize: 13, color: tokens.muted, marginTop: 3, direction: isRtl ? "rtl" : "ltr" }}>{it.location}</div>}
            </div>
          </div>
        ))}
      </div>
    </DContainer>
  );
}

// ─── Transfers ────────────────────────────────────────────────────────────────

export function SharedTransfers({ description, items, tokens, lang }: { description: unknown; items: unknown; tokens: TemplateTokens; lang: Lang }) {
  const d = typeof description === "string" ? description.trim() : "";
  const list = (Array.isArray(items) ? items : []).map(i => String(i)).filter(Boolean);
  if (!d && !list.length) return null;
  const isRtl = lang === "ar";
  const title = T[lang].sectionTransfersTitle;
  return (
    <section style={{ padding: "20px 18px" }}>
      <h2 style={{ fontFamily: tokens.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.4px", color: tokens.ink, marginBottom: 14 }}>{title}</h2>
      {d && <p style={{ fontSize: 14, color: tokens.muted, lineHeight: 1.7, margin: "0 0 14px", direction: isRtl ? "rtl" : "ltr" }}>{d}</p>}
      {list.length > 0 && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {list.map((item, i) => (
            <div key={i} style={{ padding: "6px 13px", borderRadius: 99, background: tokens.dark ? "rgba(255,255,255,0.07)" : "#fff", border: `1px solid ${tokens.border}`, fontSize: 12.5, color: tokens.ink, fontWeight: 500 }}>
              ✓ {item}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function SharedTransfersDesktop({ description, items, tokens, lang }: { description: unknown; items: unknown; tokens: TemplateTokens; lang: Lang }) {
  const d = typeof description === "string" ? description.trim() : "";
  const list = (Array.isArray(items) ? items : []).map(i => String(i)).filter(Boolean);
  if (!d && !list.length) return null;
  const isRtl = lang === "ar";
  const title = T[lang].sectionTransfersTitle;
  return (
    <DContainer style={{ padding: "52px 80px" }}>
      <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.1, color: tokens.ink, marginBottom: 20 }}>{title}</h2>
      {d && <p style={{ fontSize: 15, color: tokens.muted, lineHeight: 1.75, margin: "0 0 20px", maxWidth: 680, direction: isRtl ? "rtl" : "ltr" }}>{d}</p>}
      {list.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
          {list.map((item, i) => (
            <div key={i} style={{ padding: "12px 16px", background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 10, fontSize: 14, color: tokens.ink, fontWeight: 500, display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ color: tokens.brand, fontWeight: 700, fontSize: 16 }}>✓</span> {item}
            </div>
          ))}
        </div>
      )}
    </DContainer>
  );
}

// ─── Visa ─────────────────────────────────────────────────────────────────────

function getVisaLabel(s: string, lang: Lang): string {
  const t = T[lang];
  if (s === "included")   return t.visaIncluded;
  if (s === "assistance") return t.visaAssistance;
  if (s === "free")       return t.visaFree;
  return t.visaRequired;
}

export function SharedVisa({ included, content, tokens, lang }: { included: unknown; content: unknown; tokens: TemplateTokens; lang: Lang }) {
  const s = typeof included === "string" ? included : "required";
  const c = typeof content === "string" ? content.trim() : "";
  const label = getVisaLabel(s, lang);
  const isRtl = lang === "ar";
  const title = T[lang].sectionVisaTitle;
  return (
    <section style={{ padding: "20px 18px" }}>
      <h2 style={{ fontFamily: tokens.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.4px", color: tokens.ink, marginBottom: 14 }}>{title}</h2>
      <div style={{ background: tokens.dark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${tokens.border}`, borderRadius: 14, padding: "16px 18px" }}>
        <div style={{ display: "inline-flex", padding: "5px 13px", borderRadius: 99, background: `${tokens.brand}15`, border: `1px solid ${tokens.brand}30`, fontSize: 12.5, fontWeight: 700, color: tokens.brand, marginBottom: c ? 12 : 0 }}>
          {label}
        </div>
        {c && <p style={{ fontSize: 13, color: tokens.muted, lineHeight: 1.7, margin: 0, direction: isRtl ? "rtl" : "ltr" }}>{c}</p>}
      </div>
    </section>
  );
}

export function SharedVisaDesktop({ included, content, tokens, lang }: { included: unknown; content: unknown; tokens: TemplateTokens; lang: Lang }) {
  const s = typeof included === "string" ? included : "required";
  const c = typeof content === "string" ? content.trim() : "";
  const label = getVisaLabel(s, lang);
  const isRtl = lang === "ar";
  const title = T[lang].sectionVisaTitle;
  return (
    <DContainer style={{ padding: "52px 80px" }}>
      <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.1, color: tokens.ink, marginBottom: 22 }}>{title}</h2>
      <div style={{ display: "inline-flex", padding: "8px 20px", borderRadius: 99, background: `${tokens.brand}15`, border: `1px solid ${tokens.brand}30`, fontSize: 14, fontWeight: 700, color: tokens.brand, marginBottom: c ? 16 : 0 }}>
        {label}
      </div>
      {c && <p style={{ fontSize: 15, color: tokens.muted, lineHeight: 1.75, margin: 0, maxWidth: 680, direction: isRtl ? "rtl" : "ltr" }}>{c}</p>}
    </DContainer>
  );
}

// ─── Departure Dates ──────────────────────────────────────────────────────────

export function SharedDepartureDates({ dates, tokens, lang }: { dates: unknown; tokens: TemplateTokens; lang: Lang }) {
  const list = (Array.isArray(dates) ? dates : []) as Array<{ date?: string; returnDate?: string; price?: string; spots?: string }>;
  const valid = list.filter(it => it?.date?.trim());
  if (!valid.length) return null;
  const isRtl = lang === "ar";
  const title = T[lang].sectionDepartureDatesTitle;
  return (
    <section style={{ padding: "20px 18px" }}>
      <h2 style={{ fontFamily: tokens.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.4px", color: tokens.ink, marginBottom: 14 }}>{title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {valid.map((it, i) => (
          <div key={i} style={{ background: tokens.dark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${tokens.border}`, borderRadius: 12, padding: "13px 15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: tokens.ink, direction: isRtl ? "rtl" : "ltr" }}>{it.date}{it.returnDate ? ` → ${it.returnDate}` : ""}</div>
                {it.spots && <div style={{ fontSize: 11.5, color: tokens.brand, fontWeight: 600, marginTop: 2 }}>{it.spots}</div>}
              </div>
              {it.price && <div style={{ fontSize: 15, fontWeight: 800, color: tokens.brand, whiteSpace: "nowrap" }}>{it.price}</div>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function SharedDepartureDatesDesktop({ dates, tokens, lang }: { dates: unknown; tokens: TemplateTokens; lang: Lang }) {
  const list = (Array.isArray(dates) ? dates : []) as Array<{ date?: string; returnDate?: string; price?: string; spots?: string }>;
  const valid = list.filter(it => it?.date?.trim());
  if (!valid.length) return null;
  const isRtl = lang === "ar";
  const title = T[lang].sectionDepartureDatesTitle;
  return (
    <DContainer style={{ padding: "52px 80px" }}>
      <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.1, color: tokens.ink, marginBottom: 28 }}>{title}</h2>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(valid.length, 3)}, 1fr)`, gap: 12 }}>
        {valid.map((it, i) => (
          <div key={i} style={{ background: "#fff", border: `1px solid ${i === 0 ? tokens.brand + "40" : tokens.border}`, borderRadius: 14, padding: "20px 22px" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: tokens.ink, marginBottom: 6, direction: isRtl ? "rtl" : "ltr" }}>{it.date}</div>
            {it.returnDate && <div style={{ fontSize: 13, color: tokens.muted, marginBottom: 6 }}>→ {it.returnDate}</div>}
            {it.price && <div style={{ fontSize: 22, fontWeight: 800, color: tokens.brand, letterSpacing: "-0.5px", lineHeight: 1 }}>{it.price}</div>}
            {it.spots && <div style={{ fontSize: 12, color: tokens.brand, fontWeight: 600, marginTop: 6 }}>{it.spots}</div>}
          </div>
        ))}
      </div>
    </DContainer>
  );
}

// ─── Payment Plan ─────────────────────────────────────────────────────────────

export function SharedPaymentPlan({ content, steps, tokens, lang }: { content: unknown; steps: unknown; tokens: TemplateTokens; lang: Lang }) {
  const c = typeof content === "string" ? content.trim() : "";
  const list = (Array.isArray(steps) ? steps : []) as Array<{ label?: string; amount?: string; dueDate?: string }>;
  const valid = list.filter(it => it?.label?.trim());
  if (!c && !valid.length) return null;
  const isRtl = lang === "ar";
  const title = T[lang].sectionPaymentPlanTitle;
  return (
    <section style={{ padding: "20px 18px" }}>
      <h2 style={{ fontFamily: tokens.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.4px", color: tokens.ink, marginBottom: 14 }}>{title}</h2>
      {c && <p style={{ fontSize: 13.5, color: tokens.muted, lineHeight: 1.7, margin: "0 0 14px", direction: isRtl ? "rtl" : "ltr" }}>{c}</p>}
      {valid.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {valid.map((step, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, background: tokens.dark ? "rgba(255,255,255,0.04)" : "#fff", border: `1px solid ${tokens.border}`, borderRadius: 10, padding: "12px 14px" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: tokens.brand, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{i + 1}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: tokens.ink, direction: isRtl ? "rtl" : "ltr" }}>{step.label}</div>
                {step.dueDate && <div style={{ fontSize: 11.5, color: tokens.muted }}>{step.dueDate}</div>}
              </div>
              {step.amount && <div style={{ fontSize: 14, fontWeight: 800, color: tokens.brand, whiteSpace: "nowrap" }}>{step.amount}</div>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function SharedPaymentPlanDesktop({ content, steps, tokens, lang }: { content: unknown; steps: unknown; tokens: TemplateTokens; lang: Lang }) {
  const c = typeof content === "string" ? content.trim() : "";
  const list = (Array.isArray(steps) ? steps : []) as Array<{ label?: string; amount?: string; dueDate?: string }>;
  const valid = list.filter(it => it?.label?.trim());
  if (!c && !valid.length) return null;
  const isRtl = lang === "ar";
  const title = T[lang].sectionPaymentPlanTitle;
  return (
    <DContainer style={{ padding: "52px 80px" }}>
      <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.1, color: tokens.ink, marginBottom: 20 }}>{title}</h2>
      {c && <p style={{ fontSize: 15, color: tokens.muted, lineHeight: 1.75, margin: "0 0 24px", maxWidth: 680, direction: isRtl ? "rtl" : "ltr" }}>{c}</p>}
      {valid.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(valid.length, 4)}, 1fr)`, gap: 12 }}>
          {valid.map((step, i) => (
            <div key={i} style={{ background: "#fff", border: `1px solid ${tokens.border}`, borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ width: 32, height: 32, borderRadius: "50%", background: tokens.brand, color: "#fff", fontSize: 13, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>{i + 1}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: tokens.ink, marginBottom: 4, direction: isRtl ? "rtl" : "ltr" }}>{step.label}</div>
              {step.amount && <div style={{ fontSize: 20, fontWeight: 800, color: tokens.brand, letterSpacing: "-0.5px" }}>{step.amount}</div>}
              {step.dueDate && <div style={{ fontSize: 12, color: tokens.muted, marginTop: 4 }}>{step.dueDate}</div>}
            </div>
          ))}
        </div>
      )}
    </DContainer>
  );
}

// ─── Map ──────────────────────────────────────────────────────────────────────

export function SharedMap({ image, caption, tokens, lang }: { image: unknown; caption: unknown; tokens: TemplateTokens; lang: Lang }) {
  const img = typeof image === "string" ? image.trim() : "";
  const cap = typeof caption === "string" ? caption.trim() : "";
  if (!img) return null;
  const isRtl = lang === "ar";
  return (
    <section style={{ padding: "20px 18px" }}>
      <img src={img} alt={cap || "Map"} style={{ width: "100%", borderRadius: 14, display: "block", objectFit: "cover", aspectRatio: "16/9" }} />
      {cap && <div style={{ fontSize: 12, color: tokens.muted, textAlign: "center", marginTop: 8, direction: isRtl ? "rtl" : "ltr" }}>{cap}</div>}
    </section>
  );
}

export function SharedMapDesktop({ image, caption, tokens, lang }: { image: unknown; caption: unknown; tokens: TemplateTokens; lang: Lang }) {
  const img = typeof image === "string" ? image.trim() : "";
  const cap = typeof caption === "string" ? caption.trim() : "";
  if (!img) return null;
  const isRtl = lang === "ar";
  return (
    <DContainer style={{ padding: "52px 80px" }}>
      <img src={img} alt={cap || "Map"} style={{ width: "100%", borderRadius: 18, display: "block", objectFit: "cover", aspectRatio: "21/9" }} />
      {cap && <div style={{ fontSize: 13, color: tokens.muted, textAlign: "center", marginTop: 12, direction: isRtl ? "rtl" : "ltr" }}>{cap}</div>}
    </DContainer>
  );
}

export function SharedVideo({ videoUrl, tokens, lang }: { videoUrl: unknown; tokens: TemplateTokens; lang: Lang }) {
  const url = typeof videoUrl === "string" ? videoUrl.trim() : "";
  if (!url) return null;
  const title = lang === "ar" ? "فيديو" : "Video";
  return (
    <section style={{ padding: "20px 18px" }}>
      <h2 style={{ fontFamily: tokens.serif, fontSize: 24, fontWeight: 400, letterSpacing: "-0.4px", color: tokens.ink, marginBottom: 16 }}>
        {title}
      </h2>
      <video src={url} controls style={{ width: "100%", borderRadius: 14, background: "#0d1b2e", maxHeight: 280, display: "block" }} />
    </section>
  );
}

export function SharedVideoDesktop({ videoUrl, tokens, lang }: { videoUrl: unknown; tokens: TemplateTokens; lang: Lang }) {
  const url = typeof videoUrl === "string" ? videoUrl.trim() : "";
  if (!url) return null;
  const title = lang === "ar" ? "فيديو" : "Video";
  return (
    <DContainer style={{ padding: "52px 80px" }}>
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.1, margin: 0, color: tokens.dark ? "#fff" : tokens.ink }}>{title}</h2>
      </div>
      <video src={url} controls muted style={{ width: "100%", borderRadius: 18, background: "#000", maxHeight: 520, display: "block" }} />
    </DContainer>
  );
}

// ─── Dynamic section renderer ─────────────────────────────────────────────────
// Renders sections in stored order (new packages) or legacy hardcoded order (old packages).

export function DynamicSections({ pkg, tokens, lang, onWhatsApp, skip }: {
  pkg: TPackage; tokens: TemplateTokens; lang: Lang;
  onWhatsApp: () => void; skip?: string[];
}) {
  const skipSet = new Set(skip || []);
  const sections = pkg.sections;

  if (!sections?.length) {
    return (
      <>
        {!skipSet.has("itinerary")  && <SharedItinerary  pkg={pkg} tokens={tokens} lang={lang} />}
        {!skipSet.has("inclusions") && <SharedIncludes   pkg={pkg} tokens={tokens} lang={lang} />}
        {!skipSet.has("pricing")    && <SharedPricing    pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />}
        {!skipSet.has("gallery")    && <SharedGallery    pkg={pkg} tokens={tokens} lang={lang} />}
        {!skipSet.has("hotel")      && <SharedHotel      pkg={pkg} tokens={tokens} lang={lang} />}
        {!skipSet.has("flights")    && <SharedAirports   pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />}
      </>
    );
  }

  const sorted = [...sections].sort((a, b) => a.order - b.order);
  return (
    <>
      {sorted.map(s => {
        if (skipSet.has(s.type)) return null;
        switch (s.type) {
          case "itinerary":     return <SharedItinerary      key={s.id} pkg={{ ...pkg, itinerary: s.data.days as TPackage["itinerary"] }} tokens={tokens} lang={lang} />;
          case "inclusions":    return <SharedIncludes       key={s.id} pkg={{ ...pkg, includes: s.data.includes as string[], excludes: s.data.excludes as string[] }} tokens={tokens} lang={lang} />;
          case "pricing":       return <SharedPricing        key={s.id} pkg={{ ...pkg, pricingTiers: s.data.tiers as TPackage["pricingTiers"], cancellation: s.data.cancellation as string }} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />;
          case "gallery":       return <SharedGallery        key={s.id} pkg={{ ...pkg, images: s.data.images as string[], videoUrl: "" }} tokens={tokens} lang={lang} />;
          case "hotel":         return <SharedHotel          key={s.id} pkg={{ ...pkg, hotelDescription: s.data.description as string }} tokens={tokens} lang={lang} />;
          case "flights":       return <SharedAirports       key={s.id} pkg={{ ...pkg, airports: s.data.departures as TPackage["airports"] }} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />;
          case "highlights":      return <SharedHighlights       key={s.id} items={s.data.items} tokens={tokens} lang={lang} />;
          case "faq":             return <SharedFaq              key={s.id} items={s.data.items} tokens={tokens} lang={lang} />;
          case "booking_terms":   return <SharedBookingTerms     key={s.id} content={s.data.content} tokens={tokens} lang={lang} />;
          case "custom":          return <SharedCustomSection    key={s.id} heading={s.data.heading} content={s.data.content} image={s.data.image} tokens={tokens} lang={lang} />;
          case "extras":          return <SharedExtras           key={s.id} items={s.data.items} tokens={tokens} lang={lang} />;
          case "meals":           return <SharedMeals            key={s.id} plan={s.data.plan} notes={s.data.notes} tokens={tokens} lang={lang} />;
          case "guide":           return <SharedGuide            key={s.id} name={s.data.name} bio={s.data.bio} photo={s.data.photo} languages={s.data.languages} tokens={tokens} lang={lang} />;
          case "important_notes": return <SharedImportantNotes   key={s.id} items={s.data.items} tokens={tokens} lang={lang} />;
          case "about_agency":    return <SharedAboutAgency      key={s.id} content={s.data.content} image={s.data.image} tokens={tokens} lang={lang} />;
          case "schedule":        return <SharedSchedule         key={s.id} items={s.data.items} tokens={tokens} lang={lang} />;
          case "transfers":       return <SharedTransfers        key={s.id} description={s.data.description} items={s.data.items} tokens={tokens} lang={lang} />;
          case "visa":            return <SharedVisa             key={s.id} included={s.data.included} content={s.data.content} tokens={tokens} lang={lang} />;
          case "departure_dates": return <SharedDepartureDates   key={s.id} dates={s.data.dates} tokens={tokens} lang={lang} />;
          case "payment_plan":    return <SharedPaymentPlan      key={s.id} content={s.data.content} steps={s.data.steps} tokens={tokens} lang={lang} />;
          case "map":             return <SharedMap              key={s.id} image={s.data.image} caption={s.data.caption} tokens={tokens} lang={lang} />;
          case "video":           return <SharedVideo            key={s.id} videoUrl={s.data.videoUrl} tokens={tokens} lang={lang} />;
          case "media":           return (
            <React.Fragment key={s.id}>
              {Array.isArray(s.data.images) && (s.data.images as string[]).length > 0 &&
                <SharedGallery pkg={{ ...pkg, images: s.data.images as string[], videoUrl: "" }} tokens={tokens} lang={lang} />}
              {!!(s.data.videoUrl) &&
                <SharedVideo videoUrl={s.data.videoUrl as string} tokens={tokens} lang={lang} />}
              {!!(s.data.mapImage) &&
                <SharedMap image={s.data.mapImage as string} caption={s.data.mapCaption as string | undefined} tokens={tokens} lang={lang} />}
            </React.Fragment>
          );
          default:                return null;
        }
      })}
    </>
  );
}

export function DynamicSectionsDesktop({ pkg, tokens, lang, onWhatsApp, skip }: {
  pkg: TPackage; tokens: TemplateTokens; lang: Lang;
  onWhatsApp: () => void; skip?: string[];
}) {
  const skipSet = new Set(skip || []);
  const sections = pkg.sections;

  if (!sections?.length) {
    return (
      <>
        {!skipSet.has("itinerary")  && <SharedItineraryDesktop  pkg={pkg} tokens={tokens} lang={lang} />}
        {!skipSet.has("inclusions") && <SharedIncludesDesktop   pkg={pkg} tokens={tokens} lang={lang} />}
        {!skipSet.has("hotel")      && <SharedHotelDesktop      pkg={pkg} tokens={tokens} lang={lang} />}
        {!skipSet.has("pricing")    && <SharedPricingDesktop    pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />}
        {!skipSet.has("flights")    && <SharedAirportsDesktop   pkg={pkg} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />}
        {!skipSet.has("gallery")    && <SharedGalleryDesktop    pkg={pkg} tokens={tokens} lang={lang} />}
      </>
    );
  }

  const sorted = [...sections].sort((a, b) => a.order - b.order);
  return (
    <>
      {sorted.map(s => {
        if (skipSet.has(s.type)) return null;
        switch (s.type) {
          case "itinerary":     return <SharedItineraryDesktop     key={s.id} pkg={{ ...pkg, itinerary: s.data.days as TPackage["itinerary"] }} tokens={tokens} lang={lang} />;
          case "inclusions":    return <SharedIncludesDesktop      key={s.id} pkg={{ ...pkg, includes: s.data.includes as string[], excludes: s.data.excludes as string[] }} tokens={tokens} lang={lang} />;
          case "pricing":       return <SharedPricingDesktop       key={s.id} pkg={{ ...pkg, pricingTiers: s.data.tiers as TPackage["pricingTiers"], cancellation: s.data.cancellation as string }} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />;
          case "gallery":       return <SharedGalleryDesktop       key={s.id} pkg={{ ...pkg, images: s.data.images as string[], videoUrl: "" }} tokens={tokens} lang={lang} />;
          case "hotel":         return <SharedHotelDesktop         key={s.id} pkg={{ ...pkg, hotelDescription: s.data.description as string }} tokens={tokens} lang={lang} />;
          case "flights":       return <SharedAirportsDesktop      key={s.id} pkg={{ ...pkg, airports: s.data.departures as TPackage["airports"] }} tokens={tokens} lang={lang} onWhatsApp={onWhatsApp} />;
          case "highlights":      return <SharedHighlightsDesktop    key={s.id} items={s.data.items} tokens={tokens} lang={lang} />;
          case "faq":             return <SharedFaqDesktop           key={s.id} items={s.data.items} tokens={tokens} lang={lang} />;
          case "booking_terms":   return <SharedBookingTermsDesktop  key={s.id} content={s.data.content} tokens={tokens} lang={lang} />;
          case "custom":          return <SharedCustomSectionDesktop key={s.id} heading={s.data.heading} content={s.data.content} image={s.data.image} tokens={tokens} lang={lang} />;
          case "extras":          return <SharedExtrasDesktop        key={s.id} items={s.data.items} tokens={tokens} lang={lang} />;
          case "meals":           return <SharedMealsDesktop         key={s.id} plan={s.data.plan} notes={s.data.notes} tokens={tokens} lang={lang} />;
          case "guide":           return <SharedGuideDesktop         key={s.id} name={s.data.name} bio={s.data.bio} photo={s.data.photo} languages={s.data.languages} tokens={tokens} lang={lang} />;
          case "important_notes": return <SharedImportantNotesDesktop key={s.id} items={s.data.items} tokens={tokens} lang={lang} />;
          case "about_agency":    return <SharedAboutAgencyDesktop   key={s.id} content={s.data.content} image={s.data.image} tokens={tokens} lang={lang} />;
          case "schedule":        return <SharedScheduleDesktop      key={s.id} items={s.data.items} tokens={tokens} lang={lang} />;
          case "transfers":       return <SharedTransfersDesktop     key={s.id} description={s.data.description} items={s.data.items} tokens={tokens} lang={lang} />;
          case "visa":            return <SharedVisaDesktop          key={s.id} included={s.data.included} content={s.data.content} tokens={tokens} lang={lang} />;
          case "departure_dates": return <SharedDepartureDatesDesktop key={s.id} dates={s.data.dates} tokens={tokens} lang={lang} />;
          case "payment_plan":    return <SharedPaymentPlanDesktop   key={s.id} content={s.data.content} steps={s.data.steps} tokens={tokens} lang={lang} />;
          case "map":             return <SharedMapDesktop           key={s.id} image={s.data.image} caption={s.data.caption} tokens={tokens} lang={lang} />;
          case "video":           return <SharedVideoDesktop         key={s.id} videoUrl={s.data.videoUrl} tokens={tokens} lang={lang} />;
          case "media":           return (
            <React.Fragment key={s.id}>
              {Array.isArray(s.data.images) && (s.data.images as string[]).length > 0 &&
                <SharedGalleryDesktop pkg={{ ...pkg, images: s.data.images as string[], videoUrl: "" }} tokens={tokens} lang={lang} />}
              {!!(s.data.videoUrl) &&
                <SharedVideoDesktop videoUrl={s.data.videoUrl as string} tokens={tokens} lang={lang} />}
              {!!(s.data.mapImage) &&
                <SharedMapDesktop image={s.data.mapImage as string} caption={s.data.mapCaption as string | undefined} tokens={tokens} lang={lang} />}
            </React.Fragment>
          );
          default:                return null;
        }
      })}
    </>
  );
}

// ─── Design-system CRO primitives ───────────────────────────────────────────
// Shared across ALL redesigned templates. Each template passes its own
// color/font tokens — the components have no opinion about aesthetics.

// ── Stars ────────────────────────────────────────────────────────────────────

export function Stars({ value = 5, size = 12, color = "currentColor" }: {
  value?: number; size?: number; color?: string;
}) {
  return (
    <span style={{ display: "inline-flex", gap: 1, color }}>
      {[1, 2, 3, 4, 5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24"
          fill={i <= Math.round(value) ? "currentColor" : "none"}
          stroke="currentColor" strokeWidth={1.6}>
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </span>
  );
}

// ── ScarcityBar ───────────────────────────────────────────────────────────────

export function ScarcityBar({ spotsRemaining, totalSpots, viewersNow, recentBookings, accentColor, mutedColor, style }: {
  spotsRemaining: number;
  totalSpots: number;
  viewersNow?: number;
  recentBookings?: { count: number; hoursAgo: number };
  accentColor: string;
  mutedColor: string;
  style?: React.CSSProperties;
}) {
  const pct = Math.round(((totalSpots - spotsRemaining) / totalSpots) * 100);
  const alertColor = "#b03a2e";
  const isLow = spotsRemaining <= 3;

  return (
    <div style={{ ...style }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, marginBottom: 6 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{
            width: 7, height: 7, borderRadius: "50%",
            background: isLow ? alertColor : accentColor,
            flexShrink: 0,
            animation: isLow ? "tpl-blink 1.4s infinite" : undefined,
          }} />
          <span style={{ fontSize: 12, fontWeight: 600, color: isLow ? alertColor : accentColor }}>
            Only <b>{spotsRemaining}</b> of {totalSpots} spots left
          </span>
        </div>
        {(viewersNow || recentBookings) && (
          <span style={{ fontSize: 11, color: mutedColor }}>
            {viewersNow ? `${viewersNow} viewing` : ""}
            {viewersNow && recentBookings ? " · " : ""}
            {recentBookings ? `last booked ${recentBookings.hoursAgo}h ago` : ""}
          </span>
        )}
      </div>
      <div style={{ height: 4, borderRadius: 99, background: `${accentColor}20`, overflow: "hidden" }}>
        <div style={{
          height: "100%", borderRadius: 99,
          background: isLow ? alertColor : accentColor,
          width: `${pct}%`,
          transition: "width 0.6s ease",
        }} />
      </div>
    </div>
  );
}

// ── SocialProofTicker ─────────────────────────────────────────────────────────

export function SocialProofTicker({ messages, bg, textColor, dotColor, style }: {
  messages: string[];
  bg: string;
  textColor: string;
  dotColor: string;
  style?: React.CSSProperties;
}) {
  const [idx, setIdx] = React.useState(0);
  const [visible, setVisible] = React.useState(true);

  React.useEffect(() => {
    if (!messages.length) return;
    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + 1) % messages.length);
        setVisible(true);
      }, 220);
    }, 3200);
    return () => clearInterval(id);
  }, [messages.length]);

  if (!messages.length) return null;

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 9,
      background: bg, padding: "9px 14px",
      ...style,
    }}>
      <span style={{
        width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
        background: dotColor,
        animation: "tpl-pulse-dot 1.8s infinite",
      }} />
      <span style={{
        fontSize: 12, fontWeight: 500, color: textColor,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(5px)",
        transition: "opacity 0.22s ease, transform 0.22s ease",
        display: "block",
      }}>
        {messages[idx]}
      </span>
    </div>
  );
}

// ── TrustStrip ────────────────────────────────────────────────────────────────

export type TrustItem = {
  icon: React.ReactNode;
  title: string;
  sub?: string;
};

export function TrustStrip({ items, ink, mutedColor, borderColor, iconAccent, layout = "grid", style }: {
  items: TrustItem[];
  ink: string;
  mutedColor: string;
  borderColor: string;
  iconAccent: string;
  layout?: "grid" | "row";
  style?: React.CSSProperties;
}) {
  const isRow = layout === "row";
  return (
    <div style={{
      display: isRow ? "flex" : "grid",
      gridTemplateColumns: isRow ? undefined : "1fr 1fr",
      gap: isRow ? 32 : "12px 16px",
      padding: isRow ? "22px 40px" : "20px",
      borderTop: `1px solid ${borderColor}`,
      borderBottom: `1px solid ${borderColor}`,
      ...style,
    }}>
      {items.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: isRow ? "flex-start" : "center", gap: isRow ? 12 : 8 }}>
          <div style={{
            width: isRow ? 28 : 22, height: isRow ? 28 : 22,
            borderRadius: "50%", border: `1px solid ${borderColor}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: iconAccent, flexShrink: 0,
          }}>
            {item.icon}
          </div>
          <div>
            <div style={{ fontSize: isRow ? 13 : 11.5, fontWeight: 600, color: ink }}>{item.title}</div>
            {item.sub && isRow && <div style={{ fontSize: 11, color: mutedColor, marginTop: 3 }}>{item.sub}</div>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── DepartureSelector ─────────────────────────────────────────────────────────

export function DepartureSelector({ departures, accentColor, ink, mutedColor, borderColor, paperColor, style }: {
  departures: TDeparture[];
  accentColor: string;
  ink: string;
  mutedColor: string;
  borderColor: string;
  paperColor: string;
  style?: React.CSSProperties;
}) {
  const [sel, setSel] = React.useState(0);
  if (!departures.length) return null;
  const isLow = (d: TDeparture) => d.spots <= 3;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8, ...style }}>
      {departures.map((d, i) => {
        const active = sel === i;
        return (
          <button
            key={i}
            onClick={() => setSel(i)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
              padding: "13px 16px",
              background: active ? `${accentColor}12` : paperColor,
              border: `1.5px solid ${active ? accentColor : borderColor}`,
              borderRadius: 12, cursor: "pointer", fontFamily: "inherit", textAlign: "left",
              transition: "all 0.15s",
            }}
          >
            <div style={{ fontSize: 14, fontWeight: 700, color: ink, letterSpacing: "-0.2px" }}>{d.date}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: isLow(d) ? "#b03a2e" : mutedColor }}>
                {isLow(d) ? `Only ${d.spots} left` : `${d.spots} spots`}
              </span>
              {d.price && (
                <span style={{ fontSize: 14, fontWeight: 800, color: active ? accentColor : ink, letterSpacing: "-0.3px" }}>
                  {d.price}
                  {d.deal && <span style={{ marginLeft: 6, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px", color: "#e2492a", background: "#fff1ec", padding: "2px 5px", borderRadius: 4 }}>deal</span>}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── AgentBand (mobile) ────────────────────────────────────────────────────────

export function AgentBand({ agent, agencyName, ctaLabel, onWhatsApp, lang, style }: {
  agent: TAgent;
  agencyName: string;
  ctaLabel: string;
  onWhatsApp: () => void;
  lang: Lang;
  style?: React.CSSProperties;
}) {
  const isRtl = lang === "ar";
  return (
    <section style={{
      background: "#1a1f2c", color: "#fff",
      padding: "48px 20px",
      direction: isRtl ? "rtl" : "ltr",
      ...style,
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 18, flexWrap: "wrap" }}>
        {agent.avatar && (
          <img
            src={agent.avatar} alt={agent.name}
            style={{ width: 72, height: 72, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: "2px solid rgba(255,255,255,0.12)" }}
          />
        )}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.2px", textTransform: "uppercase", color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>
            {agencyName}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.4px", lineHeight: 1.1, marginBottom: 4 }}>{agent.name}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginBottom: 14 }}>
            {agent.role}{agent.years ? ` · ${agent.years} yrs` : ""}
          </div>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 11, color: "rgba(255,255,255,0.6)",
            background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.12)",
            padding: "5px 10px", borderRadius: 99,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#2dd4a0", animation: "tpl-pulse-dot 1.8s infinite" }} />
            Online{agent.repliesIn ? ` · replies in <${agent.repliesIn}` : ""}
          </span>
        </div>
      </div>
      <button onClick={onWhatsApp} style={{
        marginTop: 24, width: "100%",
        background: "#25d366", color: "#fff",
        border: "none", borderRadius: 12, padding: "14px",
        fontSize: 15, fontWeight: 700, cursor: "pointer",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        fontFamily: "inherit",
      }}>
        <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.5 3.5C18.2 1.2 15.2 0 12 0 5.4 0 .1 5.3.1 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.4-1.7c1.7.9 3.7 1.4 5.6 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.3zM12 21.8c-1.7 0-3.4-.5-4.9-1.3l-.4-.2-3.7 1 1-3.6-.2-.4c-.9-1.5-1.4-3.3-1.4-5 0-5.5 4.5-9.9 9.9-9.9 2.6 0 5.1 1 7 2.9 1.9 1.9 2.9 4.4 2.9 7-.1 5.4-4.5 9.5-10.2 9.5z" />
        </svg>
        {ctaLabel}
      </button>
    </section>
  );
}

// ── AgentBandDesktop ──────────────────────────────────────────────────────────

export function AgentBandDesktop({ agent, agencyName, quote, ctaLabel, secondaryCta, onWhatsApp, lang, style }: {
  agent: TAgent;
  agencyName: string;
  quote?: string;
  ctaLabel: string;
  secondaryCta?: string;
  onWhatsApp: () => void;
  lang: Lang;
  style?: React.CSSProperties;
}) {
  const isRtl = lang === "ar";
  return (
    <section style={{
      background: "#1a1f2c", color: "#fff",
      padding: "72px 80px",
      direction: isRtl ? "rtl" : "ltr",
      ...style,
    }}>
      <div style={{ maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: agent.avatar ? "260px 1fr" : "1fr", gap: 64, alignItems: "center" }}>
        {agent.avatar && (
          <img src={agent.avatar} alt={agent.name}
            style={{ width: "100%", aspectRatio: "3/4", objectFit: "cover", borderRadius: 16, border: "1px solid rgba(255,255,255,0.1)" }}
          />
        )}
        <div>
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "1.4px", textTransform: "uppercase", color: "rgba(255,255,255,0.45)", marginBottom: 16 }}>
            {agencyName}
          </div>
          <div style={{ fontSize: 44, fontWeight: 800, letterSpacing: "-1px", lineHeight: 1.05, marginBottom: 8 }}>{agent.name}</div>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,0.55)", marginBottom: 24 }}>
            {agent.role}{agent.years ? ` · ${agent.years} years` : ""}
          </div>
          {quote && (
            <p style={{ fontSize: 17, fontStyle: "italic", color: "rgba(255,255,255,0.75)", lineHeight: 1.6, margin: "0 0 28px", maxWidth: 520 } as React.CSSProperties}>
              &ldquo;{quote}&rdquo;
            </p>
          )}
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            fontSize: 11.5, color: "rgba(255,255,255,0.6)",
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
            padding: "6px 12px", borderRadius: 99,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#2dd4a0", animation: "tpl-pulse-dot 1.8s infinite" }} />
            Online{agent.repliesIn ? ` · replies in <${agent.repliesIn}` : ""}
          </span>
          <div style={{ marginTop: 28, display: "flex", gap: 12 }}>
            <button onClick={onWhatsApp} style={{
              background: "#25d366", color: "#fff", border: "none", borderRadius: 12,
              padding: "14px 24px", fontSize: 15, fontWeight: 700, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 8, fontFamily: "inherit",
            }}>
              <svg width={16} height={16} viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.5 3.5C18.2 1.2 15.2 0 12 0 5.4 0 .1 5.3.1 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.4-1.7c1.7.9 3.7 1.4 5.6 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.3zM12 21.8c-1.7 0-3.4-.5-4.9-1.3l-.4-.2-3.7 1 1-3.6-.2-.4c-.9-1.5-1.4-3.3-1.4-5 0-5.5 4.5-9.9 9.9-9.9 2.6 0 5.1 1 7 2.9 1.9 1.9 2.9 4.4 2.9 7-.1 5.4-4.5 9.5-10.2 9.5z" />
              </svg>
              {ctaLabel}
            </button>
            {secondaryCta && (
              <button style={{
                background: "transparent", color: "#fff",
                border: "1px solid rgba(255,255,255,0.25)", borderRadius: 12,
                padding: "13px 20px", fontSize: 14, fontWeight: 500,
                cursor: "pointer", fontFamily: "inherit",
              }}>
                {secondaryCta}
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Desktop contact: full-width brand banner ────────────────────────────────

export function SharedCTABannerDesktop({ pkg, agency, tokens, lang, onWhatsApp, onMessenger }: {
  pkg: TPackage; agency: TAgency; tokens: TemplateTokens; lang: Lang;
  onWhatsApp: () => void; onMessenger: () => void;
}) {
  const t = T[lang];
  return (
    <DContainer style={{ padding: "52px 80px 72px" }}>
      <div style={{ background: tokens.brand, color: "#fff", borderRadius: 24, padding: "48px 56px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 40, flexWrap: "wrap" }}>
        <div>
          <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.8px", lineHeight: 1.1 }}>
            {t.readyToExplore} {pkg.destination}?
          </div>
          <div style={{ fontSize: 15, opacity: 0.85, marginTop: 8 }}>
            {pkg.whatsapp && `WhatsApp ${pkg.whatsapp}`}
            {pkg.whatsapp && pkg.messenger && " · "}
            {pkg.messenger && `m.me/${pkg.messenger}`}
          </div>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {pkg.whatsapp && <WAButton label={t.bookWhatsApp} size="lg" onClick={onWhatsApp} />}
          {pkg.messenger && (
            <button onClick={onMessenger} style={{
              padding: "16px 24px", background: "rgba(255,255,255,0.18)", color: "#fff",
              border: "1px solid rgba(255,255,255,0.28)", borderRadius: 10,
              fontSize: 15, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
            }}>
              {t.messageMessenger}
            </button>
          )}
        </div>
      </div>
    </DContainer>
  );
}
