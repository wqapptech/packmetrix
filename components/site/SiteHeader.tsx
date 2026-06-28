"use client";

// Shared site header — wraps SITE surfaces only (storefront, and later the
// homepage / about / contact). NOT used by package templates, which keep their
// own native chrome.
//
// Ported pixel-for-pixel from the locked "Site Header" design, with the fixed
// Warm-Editorial green swapped for the agency's brand vars (deriveBrand()).

import { useState, type MouseEvent } from "react";
import type { AgencyBrand } from "@/lib/brand";
import { waHref } from "@/lib/brand";
import { useIsDesktop } from "./useIsDesktop";
import { WaIcon } from "./icons";
import "@/app/site-chrome.css";

export type NavKey = "home" | "packages" | "about" | "contact";

const NAV: Record<"en" | "ar", { key: NavKey; label: string }[]> = {
  en: [
    { key: "home", label: "Home" },
    { key: "packages", label: "Packages" },
    { key: "about", label: "About" },
    { key: "contact", label: "Contact" },
  ],
  ar: [
    { key: "home", label: "الرئيسية" },
    { key: "packages", label: "الباقات" },
    { key: "about", label: "من نحن" },
    { key: "contact", label: "تواصل" },
  ],
};

function markChar(name: string) {
  const c = (name || "").trim().charAt(0);
  return c ? c.toUpperCase() : "A";
}

export default function SiteHeader({
  brand,
  lang,
  active = "packages",
  packagesHref = "#",
  homeHref,
  aboutHref,
  onSetLang,
  onNavContact,
  onNavPackages,
  onNavAbout,
  hideKeys,
}: {
  brand: AgencyBrand;
  lang: "en" | "ar";
  /** Highlighted nav item. Accepts any string so non-nav pages (e.g. "legal") highlight nothing. */
  active?: NavKey | string;
  packagesHref?: string;
  homeHref?: string;
  /** The About page URL — when set, About becomes an active link to /about. */
  aboutHref?: string;
  /** Language toggle handler. */
  onSetLang?: (l: "en" | "ar") => void;
  /** Contact nav handler (e.g. scroll to the WhatsApp CTA band). */
  onNavContact?: () => void;
  /** When set, Packages scrolls in-page (homepage → featured section) instead of
   *  linking to the catalog. */
  onNavPackages?: () => void;
  /** When set, About becomes an in-page scroll (homepage → about section). Takes
   *  precedence over aboutHref. */
  onNavAbout?: () => void;
  /** Nav keys to omit entirely (e.g. hide "home" on the homepage). */
  hideKeys?: NavKey[];
}) {
  const desktop = useIsDesktop();
  const [menuOpen, setMenuOpen] = useState(false);
  const dir = lang === "ar" ? "rtl" : "ltr";
  const cta = lang === "ar" ? "راسلنا" : "Message us";
  const wa = brand.whatsapp ? waHref(brand.whatsapp) : null;
  const nav = NAV[lang].filter((item) => !hideKeys?.includes(item.key));

  // Resolve a nav item's behavior. A provided onNav* handler turns the item into
  // an in-page scroll (homepage); otherwise Packages links to the catalog and
  // Home links to root. Items with no target are rendered muted/non-interactive.
  const navProps = (key: NavKey) => {
    if (key === "packages") {
      if (onNavPackages) return { onClick: onNavPackages, muted: false as const };
      return { href: packagesHref, muted: false as const };
    }
    if (key === "home" && homeHref) return { href: homeHref, muted: false as const };
    if (key === "about") {
      if (onNavAbout) return { onClick: onNavAbout, muted: false as const };
      if (aboutHref) return { href: aboutHref, muted: false as const };
    }
    if (key === "contact" && onNavContact)
      return { onClick: onNavContact, muted: false as const };
    return { muted: true as const };
  };

  const Toggle = ({ small }: { small?: boolean }) => (
    <div className="sc-langtoggle" style={{ padding: small ? 2 : 3 }}>
      {(["en", "ar"] as const).map((l) => {
        const on = lang === l;
        return (
          <button
            key={l}
            type="button"
            onClick={() => onSetLang?.(l)}
            aria-pressed={on}
            className="sc-langseg"
            style={{
              fontSize: small ? 12 : 13,
              padding: small ? "5px 9px" : "6px 12px",
              background: on ? "var(--brand)" : "transparent",
              color: on ? "var(--brand-on)" : "#6b6356",
            }}
          >
            {l === "en" ? "EN" : "ع"}
          </button>
        );
      })}
    </div>
  );

  const Mark = ({ size, radius, font }: { size: number; radius: number; font: number }) =>
    brand.logoUrl ? (
      <img
        src={brand.logoUrl}
        alt={brand.name}
        style={{ width: size, height: size, objectFit: "contain", borderRadius: radius, flex: "0 0 auto" }}
      />
    ) : (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: radius,
          background: "var(--brand)",
          color: "var(--brand-on)",
          display: "grid",
          placeItems: "center",
          fontFamily: brand.displayFont,
          fontSize: font,
          fontWeight: 600,
          lineHeight: 1,
          flex: "0 0 auto",
        }}
      >
        {markChar(brand.name)}
      </div>
    );

  if (desktop) {
    return (
      <header
        dir={dir}
        className="sc-header"
        style={{ fontFamily: brand.bodyFont, height: 80, padding: "0 56px" }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <Mark size={42} radius={11} font={23} />
          <span className="sc-name" style={{ fontFamily: brand.displayFont, fontSize: 25 }}>
            {brand.name}
          </span>
        </div>
        <nav style={{ flex: 1, display: "flex", justifyContent: "center", gap: 36 }}>
          {nav.map((item) => {
            const p = navProps(item.key);
            const isActive = item.key === active;
            return (
              <a
                key={item.key}
                href={"href" in p ? p.href : undefined}
                onClick={"onClick" in p ? p.onClick : undefined}
                aria-current={isActive ? "page" : undefined}
                className={`sc-navlink${p.muted ? " is-muted" : ""}${isActive ? " is-active" : ""}`}
                style={{ fontSize: 15 }}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <Toggle />
          {wa && (
            <a href={wa} target="_blank" rel="noopener noreferrer" className="sc-cta" style={{ fontSize: 14.5, padding: "11px 18px" }}>
              <WaIcon size={16} />
              {cta}
            </a>
          )}
        </div>
      </header>
    );
  }

  return (
    <header
      dir={dir}
      className="sc-header sc-header-mobile"
      style={{ fontFamily: brand.bodyFont, height: 62, padding: "0 18px", justifyContent: "space-between" }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <Mark size={34} radius={9} font={18} />
        <span className="sc-name" style={{ fontFamily: brand.displayFont, fontSize: 20 }}>
          {brand.name}
        </span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
        <Toggle small />
        {wa && (
          <a
            href={wa}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={cta}
            className="sc-cta-icon"
          >
            <WaIcon size={18} />
          </a>
        )}
        {nav.length > 0 && (
          <button
            type="button"
            className="sc-burger"
            aria-label={lang === "ar" ? "القائمة" : "Menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
          >
            <span className={`sc-burger-box${menuOpen ? " is-open" : ""}`}>
              <span />
              <span />
              <span />
            </span>
          </button>
        )}
      </div>
      {menuOpen && nav.length > 0 && (
        <nav className="sc-mobilemenu" dir={dir}>
          {nav.map((item) => {
            const p = navProps(item.key);
            const isActive = item.key === active;
            const handleClick = (e: MouseEvent) => {
              if ("onClick" in p && p.onClick) {
                e.preventDefault();
                p.onClick();
              }
              setMenuOpen(false);
            };
            return (
              <a
                key={item.key}
                href={"href" in p ? p.href : undefined}
                onClick={handleClick}
                aria-current={isActive ? "page" : undefined}
                className={`sc-mobilelink${p.muted ? " is-muted" : ""}${isActive ? " is-active" : ""}`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      )}
    </header>
  );
}
