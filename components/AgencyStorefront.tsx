"use client";

// Agency storefront — Direction A · Warm Editorial
// Hero-features the lead (featured || oldest) package full-bleed.
// Conditional sections: render from real data only, never fill with placeholder.
// RTL: dir/lang on root + logical CSS properties. Breakpoint: 760px.

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, getDocs, query, where, doc, getDoc, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import "@/app/storefront.css";

// ── Types ──────────────────────────────────────────────────────────────────

type Package = {
  id: string;
  destination: string;
  price: string;
  nights?: string | number;
  coverImage?: string;
  images?: string[];
  agencySlug?: string;
  isActive?: boolean;
  status?: string;
  language?: string;
  whatsapp?: string;
  contacts?: Array<{ type: string; value: string }>;
  featured?: boolean;
  createdAt?: number;
  userId?: string;
};

type AgencyProfile = {
  name: string;
  tagline?: string;
  logoUrl?: string;
  brandColor?: string;
  storefrontLanguage?: "en" | "ar";
  about_en?: string;
  about_ar?: string;
  whatsapp?: string;
  email?: string;
  statsYears?: number;
  statsTravellers?: number;
  statsRating?: number;
};

// ── Brand-color derivation (spec §1 exact algorithm) ───────────────────────

function _rgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const v = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [0, 2, 4].map((i) => parseInt(v.slice(i, i + 2), 16)) as [number, number, number];
}
function _hex([r, g, b]: [number, number, number]): string {
  return (
    "#" +
    [r, g, b]
      .map((c) => Math.max(0, Math.min(255, Math.round(c))).toString(16).padStart(2, "0"))
      .join("")
  );
}
function _lum([r, g, b]: [number, number, number]): number {
  const a = [r, g, b].map((c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
}
function _contrast(l1: number, l2: number): number {
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}

function deriveBrand(hex: string): Record<string, string> {
  const c = _rgb(hex);
  const L = _lum(c);
  const paperL = _lum(_rgb("#faf5e8"));
  const inkL = _lum(_rgb("#1b1813"));
  // button text: white vs ink — pick higher contrast against the accent
  const brandOn = _contrast(L, 1) >= _contrast(L, inkL) ? "#ffffff" : "#1b1813";
  // foreground text on paper: darken accent until ≥4.5:1
  let t: [number, number, number] = [...c] as [number, number, number];
  let guard = 0;
  while (_contrast(_lum(t), paperL) < 4.5 && guard++ < 20) {
    t = t.map((v) => v * 0.86) as [number, number, number];
  }
  return {
    "--brand": hex,
    "--brand-on": brandOn,
    "--brand-text": _hex(t),
    "--brand-deep": _hex(c.map((v) => v * 0.82) as [number, number, number]),
    "--brand-tint": _hex(c.map((v) => v + (255 - v) * 0.86) as [number, number, number]),
  };
}

const DEFAULT_BRAND = "#1d4e72";

// ── Translations ───────────────────────────────────────────────────────────

const T = {
  en: {
    featured: "Featured journey",
    nights: "nights",
    from: "From",
    perPerson: "per person",
    pp: "pp",
    askTrip: "Ask about this trip",
    viewPackage: "View package",
    view: "View",
    messageUs: "Message us",
    collection: "The collection",
    moreJourneys: "More journeys",
    moreTrips: (n: number) => `${n} more ${n === 1 ? "trip" : "trips"} available`,
    aboutEy: "About",
    whyEy: "Why book with us",
    whyH: "Why book with us",
    contactEy: "Get in touch",
    contactH: "Plan your journey with us",
    contactBody:
      "Message us directly on WhatsApp — we usually reply within the hour.",
    waMessage: "Message us on WhatsApp",
    emailUs: "Email us",
    chat: "Chat with us",
    poweredBy: "Powered by",
    statsYearsLabel: "Years designing journeys",
    statsTravellersLabel: "Travellers hosted",
    statsRatingLabel: "Average guest rating",
  },
  ar: {
    featured: "رحلة مختارة",
    nights: "ليالي",
    from: "من",
    perPerson: "للشخص",
    pp: "/شخص",
    askTrip: "اسأل عن هذه الرحلة",
    viewPackage: "عرض الباقة",
    view: "عرض",
    messageUs: "راسلنا",
    collection: "المجموعة",
    moreJourneys: "رحلات أخرى",
    moreTrips: (n: number) => `${n} رحلات أخرى متاحة`,
    aboutEy: "عن الوكالة",
    whyEy: "لماذا تحجز معنا",
    whyH: "لماذا نختارنا",
    contactEy: "تواصل معنا",
    contactH: "خطط رحلتك معنا",
    contactBody: "راسلنا مباشرة على واتساب — نرد عادةً خلال ساعة.",
    waMessage: "راسلنا على واتساب",
    emailUs: "راسلنا بالبريد",
    chat: "تحدث معنا",
    poweredBy: "مدعوم من",
    statsYearsLabel: "سنة في تصميم الرحلات",
    statsTravellersLabel: "مسافر استضفناهم",
    statsRatingLabel: "متوسط تقييم الضيوف",
  },
} as const;

type Lang = "en" | "ar";
type Strings = (typeof T)[Lang];

// ── Helpers ────────────────────────────────────────────────────────────────

function pkgWhatsapp(pkg: Package): string | null {
  if (pkg.whatsapp) return pkg.whatsapp;
  const wa = pkg.contacts?.find((c) => c.type === "whatsapp");
  return wa?.value ?? null;
}

function isActive(pkg: Package): boolean {
  if (pkg.status === "draft") return false;
  if (pkg.isActive === false) return false;
  return true;
}

function waHref(number: string, text?: string): string {
  const digits = number.replace(/\D/g, "");
  return text
    ? `https://wa.me/${digits}?text=${encodeURIComponent(text)}`
    : `https://wa.me/${digits}`;
}

// ── Responsive hook ────────────────────────────────────────────────────────

function useIsDesktop() {
  const [desktop, setDesktop] = useState(true);
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 760px)");
    setDesktop(mql.matches);
    const handler = (e: MediaQueryListEvent) => setDesktop(e.matches);
    mql.addEventListener("change", handler);
    return () => mql.removeEventListener("change", handler);
  }, []);
  return desktop;
}

// ── Icons ──────────────────────────────────────────────────────────────────

function WaIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ flexShrink: 0 }}
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function ArrowIcon({ size = 15 }: { size?: number }) {
  return (
    <svg
      className="sf-arrow"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// ── Cover ──────────────────────────────────────────────────────────────────

function Cover({
  pkg,
  style,
  children,
}: {
  pkg: Package;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}) {
  const thumb = pkg.coverImage || pkg.images?.[0];
  return (
    <div
      className="sf-cover"
      style={{
        background:
          "linear-gradient(135deg, #c4956a 0%, #7a4f2e 55%, #3c2410 100%)",
        ...style,
      }}
    >
      {thumb && (
        <img
          src={thumb}
          alt={pkg.destination}
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      )}
      {children}
    </div>
  );
}

// ── Agency logo / mark ─────────────────────────────────────────────────────

function AgencyMark({
  agency,
  size = 42,
  dark = false,
}: {
  agency: AgencyProfile;
  size?: number;
  dark?: boolean;
}) {
  if (agency.logoUrl) {
    return (
      <img
        src={agency.logoUrl}
        alt=""
        style={{
          width: size,
          height: size,
          objectFit: "contain",
          borderRadius: 6,
          flexShrink: 0,
        }}
      />
    );
  }
  const initials = (agency.name || "A").slice(0, 2).toUpperCase();
  return (
    <div
      className={`sf-mark${dark ? " sf-mark--dark" : ""}`}
      style={{ width: size, height: size, fontSize: size * 0.42 }}
    >
      {initials}
    </div>
  );
}

// ── Price lockup ───────────────────────────────────────────────────────────

function PriceLockup({
  pkg,
  L,
  size,
}: {
  pkg: Package;
  L: Strings;
  size: number;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: ".16em",
          textTransform: "uppercase",
          color: "var(--ink3)",
          marginBottom: 4,
        }}
      >
        {L.from}
      </div>
      <div
        className="sf-serif"
        style={{
          fontSize: size,
          fontWeight: 600,
          lineHeight: 0.92,
          letterSpacing: "-0.02em",
          color: "var(--ink)",
        }}
      >
        {pkg.price}
      </div>
      <div style={{ fontSize: 13.5, color: "var(--ink2)", marginTop: 6 }}>
        {L.perPerson}
      </div>
    </div>
  );
}

// ── Footer ─────────────────────────────────────────────────────────────────

function Footer({ agency, L, m }: { agency: AgencyProfile; L: Strings; m: boolean }) {
  return (
    <footer
      style={{
        padding: m ? "24px 22px" : "32px 56px",
        borderTop: "1px solid var(--rule)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 14,
        background: "var(--paper)",
        marginTop: "auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <AgencyMark agency={agency} size={30} />
        <span
          className="sf-serif"
          style={{ fontSize: 16, fontWeight: 600, whiteSpace: "nowrap" }}
        >
          {agency.name}
        </span>
      </div>
      <span style={{ fontSize: 12.5, color: "var(--ink3)" }}>
        {L.poweredBy}{" "}
        <b style={{ color: "var(--ink2)", fontWeight: 600 }}>PackMetrix</b>
      </span>
    </footer>
  );
}

// ── Hero ───────────────────────────────────────────────────────────────────

function Hero({
  lead,
  agency,
  L,
  m,
  hasContact,
  onContact,
}: {
  lead: Package;
  agency: AgencyProfile;
  L: Strings;
  m: boolean;
  hasContact: boolean;
  onContact: () => void;
}) {
  return (
    <div style={{ position: "relative", height: m ? 520 : 760, flexShrink: 0 }}>
      <Cover
        pkg={lead}
        style={{ position: "absolute", inset: 0 }}
      >
        <div className="sf-scrim-t" />
        <div className="sf-scrim-b" />
      </Cover>

      {/* Header bar inside hero */}
      <header
        style={{
          position: "absolute",
          top: 0,
          insetInline: 0,
          zIndex: 2,
          padding: m ? "18px 22px" : "30px 56px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
          <AgencyMark agency={agency} size={m ? 36 : 42} dark />
          <span
            className="sf-serif"
            style={{
              fontSize: m ? 18 : 21,
              fontWeight: 600,
              letterSpacing: "-0.01em",
              color: "#fff",
              whiteSpace: "nowrap",
            }}
          >
            {agency.name}
          </span>
        </div>

        {hasContact && (
          <button
            onClick={onContact}
            className="sf-btn"
            style={{
              background: "rgba(255,255,255,.16)",
              color: "#fff",
              boxShadow: "inset 0 0 0 1px rgba(255,255,255,.28)",
              backdropFilter: "blur(8px)",
              WebkitBackdropFilter: "blur(8px)",
              fontSize: m ? 13.5 : 14.5,
              padding: m ? "10px 14px" : "12px 18px",
            }}
          >
            <WaIcon size={m ? 15 : 16} />
            {L.messageUs}
          </button>
        )}
      </header>

      {/* Hero caption */}
      <div
        style={{
          position: "absolute",
          insetInline: 0,
          bottom: 0,
          zIndex: 2,
          padding: m ? "0 22px 28px" : "0 56px 50px",
        }}
      >
        <span className="sf-eyebrow on-dark">
          {agency.name} · {L.featured}
        </span>
        <h1
          className="sf-display"
          style={{
            marginTop: m ? 14 : 20,
            fontSize: m ? 44 : 100,
            color: "#fff",
            maxWidth: 1000,
            textShadow: "0 4px 30px rgba(0,0,0,.34)",
          }}
        >
          {lead.destination}
        </h1>
        {lead.nights && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: m ? 10 : 16,
              marginTop: m ? 16 : 22,
            }}
          >
            <span className="sf-pill">
              <span
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "var(--brand-text)",
                  flexShrink: 0,
                }}
              />
              {Number(lead.nights)} {L.nights}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Booking bar ────────────────────────────────────────────────────────────

function BookingBar({
  lead,
  L,
  m,
  router,
  basePath,
}: {
  lead: Package;
  L: Strings;
  m: boolean;
  router: ReturnType<typeof useRouter>;
  basePath: string;
}) {
  const wa = pkgWhatsapp(lead);
  const href = wa
    ? waHref(
        wa,
        `Hi, I'm interested in the ${lead.destination} package`
      )
    : null;

  if (m) {
    return (
      <div
        style={{
          padding: "22px",
          background: "var(--paper)",
          borderTop: "1px solid var(--rule)",
          display: "flex",
          flexDirection: "column",
          gap: 18,
          flexShrink: 0,
        }}
      >
        <PriceLockup pkg={lead} L={L} size={46} />
        <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
          <button
            onClick={() => router.push(`${basePath}/${lead.id}`)}
            className="sf-btn sf-btn--brand"
            style={{ fontSize: 16, padding: "16px", width: "100%" }}
          >
            {L.viewPackage} <ArrowIcon size={16} />
          </button>
          {href && (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="sf-btn sf-btn--wa"
              style={{ fontSize: 16, padding: "15px", width: "100%" }}
            >
              <WaIcon size={18} /> {L.askTrip}
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "34px 56px",
        background: "var(--paper)",
        borderTop: "1px solid var(--rule)",
        flexShrink: 0,
      }}
    >
      <PriceLockup pkg={lead} L={L} size={56} />
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {href && (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="sf-btn sf-btn--wa"
            style={{ fontSize: 15.5, padding: "17px 24px" }}
          >
            <WaIcon size={18} /> {L.askTrip}
          </a>
        )}
        <button
          onClick={() => router.push(`${basePath}/${lead.id}`)}
          className="sf-btn sf-btn--brand"
          style={{ fontSize: 15.5, padding: "18px 30px" }}
        >
          {L.viewPackage} <ArrowIcon size={16} />
        </button>
      </div>
    </div>
  );
}

// ── Package card ───────────────────────────────────────────────────────────

function PackageCard({
  pkg,
  L,
  m,
  router,
  basePath,
}: {
  pkg: Package;
  L: Strings;
  m: boolean;
  router: ReturnType<typeof useRouter>;
  basePath: string;
}) {
  return (
    <article className="sf-pcard" onClick={() => router.push(`${basePath}/${pkg.id}`)}>
      <Cover pkg={pkg} style={{ height: m ? 196 : 218, position: "relative" }}>
        <div className="sf-scrim-b" />
        {pkg.nights && (
          <span
            className="sf-pill"
            style={{
              position: "absolute",
              top: 16,
              insetInlineEnd: 16,
              fontSize: 12,
              padding: "6px 12px",
              zIndex: 2,
            }}
          >
            {Number(pkg.nights)} {L.nights}
          </span>
        )}
      </Cover>
      <div className="sf-pcard__body">
        <h3
          className="sf-serif"
          style={{
            fontSize: 27,
            fontWeight: 600,
            letterSpacing: "-0.015em",
            margin: "8px 0 0",
            lineHeight: 1.08,
            color: "var(--ink)",
          }}
        >
          {pkg.destination}
        </h3>
        <div className="sf-pcard__foot">
          <div>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 600,
                letterSpacing: ".14em",
                textTransform: "uppercase",
                color: "var(--ink3)",
              }}
            >
              {L.from}
            </div>
            <div
              className="sf-serif"
              style={{
                fontSize: 28,
                fontWeight: 600,
                letterSpacing: "-0.02em",
                marginTop: 2,
                color: "var(--ink)",
              }}
            >
              {pkg.price}{" "}
              <span
                style={{
                  fontFamily: "inherit",
                  fontSize: 13,
                  fontWeight: 400,
                  color: "var(--ink2)",
                }}
              >
                {L.pp}
              </span>
            </div>
          </div>
          <span className="sf-link">
            {L.view} <ArrowIcon size={14} />
          </span>
        </div>
      </div>
    </article>
  );
}

// ── Grid of remaining packages ─────────────────────────────────────────────

function Grid({
  packages,
  L,
  m,
  router,
  basePath,
}: {
  packages: Package[];
  L: Strings;
  m: boolean;
  router: ReturnType<typeof useRouter>;
  basePath: string;
}) {
  return (
    <section className="sf-section" style={{ paddingTop: m ? 52 : 76 }}>
      <div
        className="sf-sec-head"
        style={{ marginBottom: m ? 26 : 36, alignItems: m ? "flex-start" : "flex-end" }}
      >
        <div>
          <span className="sf-eyebrow">{L.collection}</span>
          <h2 className="sf-h2" style={{ marginTop: 16 }}>
            {L.moreJourneys}
          </h2>
        </div>
        <div style={{ fontSize: 14, color: "var(--ink2)", paddingBottom: 6 }}>
          {L.moreTrips(packages.length)}
        </div>
      </div>
      <div className="sf-grid">
        {packages.map((p) => (
          <PackageCard key={p.id} pkg={p} L={L} m={m} router={router} basePath={basePath} />
        ))}
      </div>
    </section>
  );
}

// ── About section (renders only when an about text exists for the active lang) ──

function About({ agency, about, L, m }: { agency: AgencyProfile; about: string; L: Strings; m: boolean }) {
  if (!about) return null;
  return (
    <section
      style={{
        width: "100%",
        maxWidth: 880,
        marginInline: "auto",
        paddingInline: m ? 22 : 56,
        paddingBottom: 64,
        paddingTop: m ? 64 : 92,
        textAlign: "center",
        boxSizing: "border-box",
      }}
    >
      <span className="sf-eyebrow is-center">{L.aboutEy}</span>
      <h2 className="sf-h2" style={{ marginTop: 16 }}>
        {agency.name}
      </h2>
      <p
        style={{
          fontSize: m ? 16 : 19,
          lineHeight: 1.62,
          color: "var(--ink2)",
          margin: "22px auto 0",
          maxWidth: 680,
        }}
      >
        {about}
      </p>
    </section>
  );
}

// ── Why book / trust stats (renders only when ≥1 real figure exists) ───────

function WhyBook({ agency, L, m }: { agency: AgencyProfile; L: Strings; m: boolean }) {
  const stats: Array<[string, string]> = [];
  if (agency.statsYears) stats.push([String(agency.statsYears), L.statsYearsLabel]);
  if (agency.statsTravellers)
    stats.push([`${agency.statsTravellers}+`, L.statsTravellersLabel]);
  if (agency.statsRating) stats.push([String(agency.statsRating), L.statsRatingLabel]);
  if (!stats.length) return null;

  return (
    <section className="sf-section" style={{ paddingTop: m ? 56 : 80 }}>
      <div
        className="sf-sec-head"
        style={{ marginBottom: m ? 26 : 34, alignItems: m ? "flex-start" : "center" }}
      >
        <div>
          <span className="sf-eyebrow">{L.whyEy}</span>
          <h2 className="sf-h2" style={{ marginTop: 16 }}>
            {L.whyH}
          </h2>
        </div>
      </div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: m ? "1fr" : `repeat(${stats.length}, 1fr)`,
          gap: m ? 16 : 22,
        }}
      >
        {stats.map(([n, label], i) => (
          <div key={i} className="sf-stat">
            <div className="sf-stat__n">{n}</div>
            <div className="sf-stat__l">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Contact band (renders only when agency has a contact) ──────────────────

function Contact({ agency, L, m }: { agency: AgencyProfile; L: Strings; m: boolean }) {
  const hasWa = !!agency.whatsapp;
  const hasEmail = !!agency.email;
  if (!hasWa && !hasEmail) return null;

  const wHref = hasWa ? waHref(agency.whatsapp!) : null;
  const eHref = hasEmail ? `mailto:${agency.email}` : null;

  return (
    <section className="sf-contact" style={{ marginTop: m ? 64 : 92 }}>
      <div className="sf-contact-inner">
        <span className="sf-eyebrow is-center">{L.contactEy}</span>
        <h2
          className="sf-h2"
          style={{ marginTop: 16, fontSize: m ? 34 : 52 }}
        >
          {L.contactH}
        </h2>
        <p
          style={{
            fontSize: m ? 16 : 18,
            lineHeight: 1.6,
            color: "var(--ink2)",
            margin: "18px auto 0",
            maxWidth: 560,
          }}
        >
          {L.contactBody}
        </p>
        <div
          style={{
            display: "flex",
            flexDirection: m ? "column" : "row",
            justifyContent: "center",
            gap: m ? 11 : 14,
            marginTop: 30,
          }}
        >
          {wHref && (
            <a
              href={wHref}
              target="_blank"
              rel="noopener noreferrer"
              className="sf-btn sf-btn--wa-solid"
              style={{
                fontSize: 16,
                padding: m ? "16px" : "18px 28px",
                width: m ? "100%" : "auto",
              }}
            >
              <WaIcon size={19} /> {L.waMessage}
            </a>
          )}
          {eHref && (
            <a
              href={eHref}
              className="sf-btn sf-btn--ghost"
              style={{
                fontSize: 16,
                padding: m ? "15px" : "17px 26px",
                width: m ? "100%" : "auto",
              }}
            >
              {L.emailUs}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}

// ── Floating WhatsApp FAB (renders only when agency has WhatsApp) ──────────

function Fab({ agency, L, m }: { agency: AgencyProfile; L: Strings; m: boolean }) {
  if (!agency.whatsapp) return null;
  return (
    <a
      href={waHref(agency.whatsapp)}
      target="_blank"
      rel="noopener noreferrer"
      className={`sf-fab${m ? " sf-fab--m" : ""}`}
      aria-label={L.chat}
    >
      <WaIcon size={m ? 26 : 22} />
      {!m && <span>{L.chat}</span>}
    </a>
  );
}

// ── Spinner ────────────────────────────────────────────────────────────────

function Spinner({ brand }: { brand: string }) {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#faf5e8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="spinner" style={{ borderTopColor: brand }} />
    </div>
  );
}

// ── Main storefront component ──────────────────────────────────────────────

function StorefrontInner({ agencySlug, basePath }: { agencySlug: string; basePath: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const m = !useIsDesktop();

  // ?language=ar|en overrides both package filtering and UI language.
  // Without it, the agency's configured storefrontLanguage is used.
  const langParam = searchParams.get("language");
  const forcedLang: Lang | null = langParam === "ar" || langParam === "en" ? langParam : null;

  const [packages, setPackages] = useState<Package[]>([]);
  const [agency, setAgency] = useState<AgencyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!agencySlug) return;
      try {
        const snap = await getDocs(
          query(collection(db, "packages"), where("agencySlug", "==", agencySlug))
        );
        const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Package));

        const toAgencyProfile = (u: Record<string, unknown>): AgencyProfile => ({
          name:               String(u.name || u.email || "Travel Agency"),
          tagline:            String(u.tagline || ""),
          logoUrl:            String(u.logoUrl || ""),
          brandColor:         String(u.brandColor || ""),
          storefrontLanguage: u.storefrontLanguage === "ar" ? "ar" : "en",
          about_en:           String(u.about_en || u.about || ""),
          about_ar:           String(u.about_ar || ""),
          whatsapp:           String(u.whatsapp || ""),
          email:              String(u.email || ""),
          statsYears:         Number(u.statsYears) || 0,
          statsTravellers:    Number(u.statsTravellers) || 0,
          statsRating:        Number(u.statsRating) || 0,
        });

        // Primary: resolve agency profile via a package's userId
        let agencyData: AgencyProfile | null = null;
        const firstDoc = snap.docs[0];
        if (firstDoc) {
          const userId = (firstDoc.data() as { userId?: string }).userId;
          if (userId) {
            const userSnap = await getDoc(doc(db, "users", userId));
            if (userSnap.exists()) {
              agencyData = toAgencyProfile(userSnap.data());
              setAgency(agencyData);
            }
          }
        }

        // Fallback: look up the user directly by agencySlug (handles seeded/new agencies with no packages yet)
        if (!agencyData) {
          const userSnap = await getDocs(
            query(collection(db, "users"), where("agencySlug", "==", agencySlug), limit(1))
          );
          if (!userSnap.empty) {
            agencyData = toAgencyProfile(userSnap.docs[0].data());
            setAgency(agencyData);
          }
        }

        const sfLang: Lang = forcedLang ?? agencyData?.storefrontLanguage ?? "en";
        const active = all
          .filter(isActive)
          .filter((p) => {
            const pkgLang = (p as Package & { primaryLanguage?: string }).primaryLanguage || p.language || "en";
            return pkgLang === sfLang;
          })
          .sort((a, b) => {
            // featured first, then oldest (ascending createdAt)
            const fa = a.featured ? 1 : 0;
            const fb = b.featured ? 1 : 0;
            if (fa !== fb) return fb - fa;
            return (a.createdAt || 0) - (b.createdAt || 0);
          });
        setPackages(active);
      } catch (err) {
        console.error("[Storefront] Firestore error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [agencySlug, forcedLang]);

  const lang: Lang = forcedLang ?? agency?.storefrontLanguage ?? "en";
  const L = T[lang];
  const brand = agency?.brandColor || DEFAULT_BRAND;
  const themeVars = deriveBrand(brand);

  if (loading) return <Spinner brand={brand} />;

  const lead = packages[0] ?? null;
  const rest = packages.slice(1);

  // Agency-level contact: header "Message us" button, contact band, FAB
  const agencyWa = agency?.whatsapp || "";
  const agencyEmail = agency?.email || "";
  const hasAgencyContact = !!(agencyWa || agencyEmail);

  // Contact handler: scroll to contact band if exists, else open WhatsApp
  const handleContact = () => {
    if (agencyWa) {
      window.open(waHref(agencyWa), "_blank", "noopener,noreferrer");
    } else if (agencyEmail) {
      window.location.href = `mailto:${agencyEmail}`;
    }
  };

  if (!agency || !lead) {
    // No packages in this language — render agency identity + footer only (spec §6 edge case)
    return (
      <div
        className="sf"
        dir={lang === "ar" ? "rtl" : "ltr"}
        lang={lang}
        style={{ ...themeVars as React.CSSProperties, justifyContent: "flex-end" }}
      >
        {agency && (
          <>
            {/* Minimal header so the agency is identifiable */}
            <header style={{
              padding: m ? "18px 22px" : "24px 56px",
              display: "flex", alignItems: "center", gap: 13,
              borderBottom: "1px solid var(--rule)",
              background: "var(--paper)",
            }}>
              <AgencyMark agency={agency} size={m ? 36 : 42} />
              <span className="sf-serif" style={{ fontSize: m ? 18 : 21, fontWeight: 600, letterSpacing: "-0.01em" }}>
                {agency.name}
              </span>
            </header>
            <div style={{ flex: 1 }} />
            <Footer agency={agency} L={L} m={m} />
          </>
        )}
      </div>
    );
  }

  return (
    <div
      className="sf"
      dir={lang === "ar" ? "rtl" : "ltr"}
      lang={lang}
      style={themeVars as React.CSSProperties}
    >
      {/* §5 — Hero: lead package always full-bleed */}
      <Hero
        lead={lead}
        agency={agency}
        L={L}
        m={m}
        hasContact={hasAgencyContact}
        onContact={handleContact}
      />

      {/* §5 — Booking bar: always with hero */}
      <BookingBar lead={lead} L={L} m={m} router={router} basePath={basePath} />

      {/* §5 / §6 — Grid: only when packages.length > 1 */}
      {rest.length > 0 && <Grid packages={rest} L={L} m={m} router={router} basePath={basePath} />}

      {/* §6 — About: only when agency wrote an intro for this language */}
      <About
        agency={agency}
        about={lang === "ar" ? (agency.about_ar || agency.about_en || "") : (agency.about_en || agency.about_ar || "")}
        L={L}
        m={m}
      />

      {/* §6 — Why book: only when ≥1 real figure exists */}
      <WhyBook agency={agency} L={L} m={m} />

      {/* §6 — Contact band: only when agency has a contact */}
      <Contact agency={agency} L={L} m={m} />

      {/* §6 — Footer: always */}
      <Footer agency={agency} L={L} m={m} />

      {/* §6 — Floating FAB: only when agency has WhatsApp */}
      <Fab agency={agency} L={L} m={m} />
    </div>
  );
}

export default function AgencyStorefront({
  agencySlug,
  basePath = "",
}: {
  agencySlug: string;
  basePath?: string;
}) {
  return (
    <Suspense fallback={null}>
      <StorefrontInner agencySlug={agencySlug} basePath={basePath} />
    </Suspense>
  );
}
