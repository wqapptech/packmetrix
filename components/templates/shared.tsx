"use client";

import React from "react";
import Icon from "@/components/Icon";
import { T } from "@/lib/translations";
import type { TPackage, TAgency, TReview, TemplateTokens, Lang } from "./types";

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
  dark?: boolean; onWhatsApp: () => void; lang?: Lang;
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
            href={`/${agency.agencySlug}`}
            style={{ fontSize: 13, fontWeight: 600, color: brand, textDecoration: "none", cursor: "pointer", transition: "opacity 0.15s" }}
            onMouseEnter={e => (e.currentTarget.style.opacity = "0.75")}
            onMouseLeave={e => (e.currentTarget.style.opacity = "1")}
          >
            {t.navAllPackages}
          </a>
        )}
        <WAButton label={`Book · ${price}`} size="sm" onClick={onWhatsApp} />
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
    <button onClick={onClick} style={{
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
  agency: TAgency; price: string; brand: string; dark?: boolean; onWhatsApp: () => void; lang?: Lang;
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
                href={`/${agency.agencySlug}`}
                style={{ fontSize: 10, color: dark ? "rgba(255,255,255,0.45)" : "rgba(13,27,46,0.4)", textDecoration: "none", letterSpacing: "0.2px" }}
              >
                {t.navAllPackages} ↗
              </a>
            )}
          </div>
        </div>
        <WAButton label={price} size="sm" onClick={onWhatsApp} />
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
  onWhatsApp: () => void; lang: Lang;
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
      <WAButton label={label || t.bookWhatsApp} size="md" onClick={onWhatsApp} />
    </div>
  );
}

// ─── Shared page sections ───────────────────────────────────────────────────

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
            <div style={{ fontSize: 12, fontWeight: 600, color: i === 0 ? "rgba(255,255,255,0.7)" : tokens.muted, marginBottom: 8 }}>{tier.label}</div>
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

function LightboxCarousel({ images, startIndex, onClose }: {
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
          <button onClick={onMessenger} style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
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

function scoreFromConv(conv: number) {
  if (conv >= 5) return 95;
  if (conv >= 3) return 85;
  if (conv >= 2) return 75;
  if (conv >= 1) return 60;
  if (conv > 0) return 45;
  return 30;
}

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

export function CardActions({ lang, onView, onEdit, onDelete, onToggleActive, isActive, isPublished }: {
  lang: Lang; onView: () => void; onEdit: () => void;
  onDelete: () => void; onToggleActive: () => void;
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

// BaseCard — used by all template card variants with their visual customizations
export function BaseCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, imageBorderRadius = 0, headingFont = "inherit", cardBg = "rgba(255,255,255,0.025)", accentColor }: {
  pkg: import("./types").TListPackage;
  agency: TAgency; lang: Lang;
  onView: () => void; onEdit: () => void;
  onDelete: () => void; onToggleActive: () => void;
  imageBorderRadius?: number;
  headingFont?: string;
  cardBg?: string;
  accentColor?: string;
}) {
  const t = T[lang];
  const brand = accentColor || "#1f5f8e";
  const thumbUrl = pkg.coverImage || pkg.images?.[0];
  const clicks = (pkg.whatsappClicks || 0) + (pkg.messengerClicks || 0);
  const conv = (pkg.views || 0) > 0 ? (clicks / pkg.views) * 100 : 0;
  const score = scoreFromConv(conv);
  const scoreColor = score >= 80 ? "#2dd4a0" : score >= 65 ? "#e8c97b" : "#f5a623";
  const isPublished = Boolean(pkg.agencySlug);
  const isActive = pkg.isActive !== false;
  const badgeBg = !isPublished ? "rgba(255,255,255,0.18)" : isActive ? "rgba(45,212,160,0.88)" : "rgba(180,90,30,0.82)";
  const badgeColor = !isPublished ? "#fff" : "#0a1426";
  const badgeLabel = !isPublished ? t.packageStatusDraft : isActive ? `● ${t.live}` : `○ ${t.packageStatusInactive}`;

  return (
    <div style={{ background: cardBg, border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden" }}>
      <div style={{ height: 160, position: "relative", background: thumbUrl ? `url(${thumbUrl}) center/cover` : brand, borderRadius: `${imageBorderRadius}px ${imageBorderRadius}px 0 0`, display: "flex", alignItems: "center", justifyContent: "center", backgroundSize: "cover", backgroundPosition: "center" }}>
        {!thumbUrl && <Icon name="map" size={28} color="rgba(255,255,255,0.5)" />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.6))", borderRadius: `${imageBorderRadius}px ${imageBorderRadius}px 0 0` }} />
        <div style={{ position: "absolute", top: 10, left: 10, padding: "3px 10px", borderRadius: 99, background: badgeBg, backdropFilter: "blur(8px)", color: badgeColor, fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".4px" }}>{badgeLabel}</div>
        <div style={{ position: "absolute", top: 10, right: 10, padding: "4px 10px", borderRadius: 99, background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)", color: "#fff", fontSize: 10.5, fontWeight: 700 }}>
          Score <b style={{ color: scoreColor, marginLeft: 4 }}>{score}</b>
        </div>
        <div style={{ position: "absolute", left: 12, right: 12, bottom: 10 }}>
          <div style={{ fontSize: 19, fontWeight: 700, color: "#fff", letterSpacing: "-0.3px", lineHeight: 1.1, fontFamily: headingFont }}>{pkg.destination}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.85)", marginTop: 2 }}>{pkg.price}</div>
        </div>
      </div>
      <CardStatRow views={pkg.views || 0} clicks={clicks} conv={conv} scoreColor={scoreColor} t={t} />
      <CardActions lang={lang} onView={onView} onEdit={onEdit} onDelete={onDelete} onToggleActive={onToggleActive} isActive={isActive} isPublished={isPublished} />
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
              <div style={{ fontSize: 13.5, fontWeight: 600, opacity: featured ? 0.8 : 0.6, marginBottom: 14 }}>{tier.label}</div>
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
