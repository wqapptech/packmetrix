"use client";

// Shared site footer — wraps SITE surfaces only. Ported from the locked
// "Site Footer" design: dark brand panel, blurb, Gulf social set, link
// columns, legal row, "Powered by Packmetrix".
//
// Content is narrowed to what the data model backs honestly (spec §2): brand
// + tagline blurb, contact (with empty-field fallbacks), socials (only those
// set), an Explore nav column, a legal-row slot, and the Packmetrix credit.
// The design's demo Destinations/Services columns are omitted (no taxonomy).

import type { AgencyBrand } from "@/lib/brand";
import { waHref } from "@/lib/brand";
import { useIsDesktop } from "./useIsDesktop";
import {
  SnapchatIcon, TikTokIcon, InstagramIcon, FacebookIcon, YouTubeIcon, XIcon,
} from "./icons";
import type { NavKey } from "./SiteHeader";
import "@/app/site-chrome.css";

const STR = {
  en: {
    explore: "Explore",
    contact: "Contact",
    nav: { home: "Home", packages: "Packages", about: "About", contact: "Contact" },
    legal: [{ label: "Terms" }, { label: "Privacy" }, { label: "Cookies" }],
    powered: "Powered by",
    waLabel: "WhatsApp",
    callLabel: "Call",
    emailLabel: "Email",
  },
  ar: {
    explore: "استكشف",
    contact: "تواصل",
    nav: { home: "الرئيسية", packages: "الباقات", about: "من نحن", contact: "تواصل" },
    legal: [{ label: "الشروط" }, { label: "الخصوصية" }, { label: "ملفات الارتباط" }],
    powered: "مدعوم من",
    waLabel: "واتساب",
    callLabel: "اتصل",
    emailLabel: "البريد",
  },
} as const;

function markChar(name: string) {
  const c = (name || "").trim().charAt(0);
  return c ? c.toUpperCase() : "A";
}

export default function SiteFooter({
  brand,
  lang,
  packagesHref = "#",
  homeHref,
  aboutHref,
  onNavContact,
  legalLinks = [],
  hideKeys,
}: {
  brand: AgencyBrand;
  lang: "en" | "ar";
  packagesHref?: string;
  homeHref?: string;
  /** The About page URL — when set, the About nav item links there (else muted). */
  aboutHref?: string;
  onNavContact?: () => void;
  /** Real legal-page links (only docs the agency has authored). Empty → no legal row. */
  legalLinks?: { label: string; href: string }[];
  /** Nav items to omit entirely (e.g. About when the agency has no About page). */
  hideKeys?: NavKey[];
}) {
  const desktop = useIsDesktop();
  const dir = lang === "ar" ? "rtl" : "ltr";
  const L = STR[lang];
  const year = 2026;

  // WhatsApp lives in the contact column; the social row is the Gulf set.
  const socials: { key: keyof AgencyBrand["socials"]; href: string; node: React.ReactNode; label: string }[] = [];
  const s = brand.socials;
  const push = (key: keyof AgencyBrand["socials"], node: React.ReactNode, label: string) => {
    const v = s[key];
    if (v) socials.push({ key, href: v, node, label });
  };
  push("instagram", <InstagramIcon size={17} />, "Instagram");
  push("snapchat", <SnapchatIcon size={17} />, "Snapchat");
  push("tiktok", <TikTokIcon size={16} />, "TikTok");
  push("facebook", <FacebookIcon size={17} />, "Facebook");
  push("youtube", <YouTubeIcon size={17} />, "YouTube");
  push("x", <XIcon size={15} />, "X");

  // Contact links with empty-field fallbacks — only render what exists.
  const contacts: { href: string; label: string; ext?: boolean }[] = [];
  if (brand.whatsapp) contacts.push({ href: waHref(brand.whatsapp), label: L.waLabel, ext: true });
  if (brand.phone) contacts.push({ href: `tel:${brand.phone.replace(/[^\d+]/g, "")}`, label: L.callLabel });
  if (brand.email) contacts.push({ href: `mailto:${brand.email}`, label: L.emailLabel });

  const allNavItems: { key: NavKey; label: string; muted: boolean; href?: string; onClick?: () => void }[] = [
    { key: "home", label: L.nav.home, muted: !homeHref, href: homeHref },
    { key: "packages", label: L.nav.packages, muted: false, href: packagesHref },
    { key: "about", label: L.nav.about, muted: !aboutHref, href: aboutHref },
    { key: "contact", label: L.nav.contact, muted: !onNavContact, onClick: onNavContact },
  ];
  const navItems = allNavItems.filter((n) => !hideKeys?.includes(n.key));

  const Brand = ({ size, font }: { size: number; font: number }) => (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      {brand.logoUrl ? (
        <img src={brand.logoUrl} alt={brand.name} className="sc-foot-mark" style={{ width: size, height: size }} />
      ) : (
        <div
          className="sc-foot-mark"
          style={{ width: size, height: size, fontFamily: brand.displayFont, fontSize: font }}
        >
          {markChar(brand.name)}
        </div>
      )}
      <span style={{ fontFamily: brand.displayFont, fontSize: size === 38 ? 22 : 21, fontWeight: 600, color: "var(--brand-on)", whiteSpace: "nowrap" }}>
        {brand.name}
      </span>
    </div>
  );

  const Socials = () =>
    socials.length ? (
      <div style={{ display: "flex", gap: 10, marginTop: 20, flexWrap: "wrap" }}>
        {socials.map((soc) => (
          <a
            key={String(soc.key)}
            href={soc.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={soc.label}
            className="sc-foot-social"
          >
            {soc.node}
          </a>
        ))}
      </div>
    ) : null;

  const Column = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div style={{ display: "flex", flexDirection: "column", gap: 13, minWidth: 120 }}>
      <div className="sc-foot-coltitle">{title}</div>
      {children}
    </div>
  );

  const NavCol = () => (
    <Column title={L.explore}>
      {navItems.map((n) => (
        <a
          key={n.key}
          href={n.href}
          onClick={n.onClick}
          className={`sc-foot-link${n.muted ? " is-muted" : ""}`}
        >
          {n.label}
        </a>
      ))}
    </Column>
  );

  const ContactCol = () =>
    contacts.length ? (
      <Column title={L.contact}>
        {contacts.map((c) => (
          <a key={c.label} href={c.href} target={c.ext ? "_blank" : undefined} rel={c.ext ? "noopener noreferrer" : undefined} className="sc-foot-link">
            {c.label}
          </a>
        ))}
      </Column>
    ) : null;

  // Legal row: only the docs the agency has actually published. Empty → nothing.
  const Legal = () =>
    legalLinks.length ? (
      <div className="sc-foot-legal">
        {legalLinks.map((lk) => (
          <a key={lk.href} href={lk.href} className="sc-foot-link">
            {lk.label}
          </a>
        ))}
      </div>
    ) : null;

  const Rights = () => (
    <span className="sc-foot-rights">© {year} {brand.name}</span>
  );

  const Powered = () => (
    <span className="sc-foot-powered">
      {L.powered} <b>Packmetrix</b>
    </span>
  );

  if (desktop) {
    return (
      <footer dir={dir} className="sc-footer" style={{ fontFamily: brand.bodyFont }}>
        <div className="sc-footer-top">
          <div style={{ maxWidth: 380, flex: "0 0 auto" }}>
            <Brand size={38} font={20} />
            {brand.tagline && <p className="sc-foot-blurb">{brand.tagline}</p>}
            <Socials />
          </div>
          <div style={{ display: "flex", gap: 60, flexWrap: "wrap" }}>
            <NavCol />
            <ContactCol />
          </div>
        </div>
        <div className="sc-footer-bar">
          <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
            <Legal />
            <Rights />
          </div>
          <Powered />
        </div>
      </footer>
    );
  }

  return (
    <footer dir={dir} className="sc-footer" style={{ fontFamily: brand.bodyFont }}>
      <div style={{ padding: "44px 22px 30px" }}>
        <Brand size={36} font={18} />
        {brand.tagline && <p className="sc-foot-blurb">{brand.tagline}</p>}
        <Socials />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px 20px", marginTop: 32 }}>
          <NavCol />
          <ContactCol />
        </div>
      </div>
      <div className="sc-footer-bar is-mobile">
        <Legal />
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <Rights />
          <Powered />
        </div>
      </div>
    </footer>
  );
}
