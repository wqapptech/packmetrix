"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import posthog from "posthog-js";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useLang, switchLang } from "@/hooks/useLang";
import { TRIAL_DAYS } from "@/lib/trial";
import { TEMPLATES } from "@/components/templates";
import { MINI_RENDERS } from "@/components/builder/TemplatePicker";
import { DESTINATION_GRADIENTS } from "@/lib/destination";
import {
  DA_BG, DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2, DA_GOLD, DA_GOLD_DEEP, DA_GOLD_SOFT,
  DA_GREEN, DA_GREEN_SOFT, DA_DANGER, DA_DANGER_SOFT, DA_DARK,
} from "@/lib/tokens";

const DISPLAY = "var(--lp-display, var(--font-newsreader), Newsreader, Georgia, serif)";
const SANS    = "var(--lp-sans, var(--font-inter-tight), system-ui, sans-serif)";
const MONO    = '"JetBrains Mono", ui-monospace, monospace';

const AGENCY_URL =
  process.env.NEXT_PUBLIC_AGENCY_URL ??
  (process.env.NODE_ENV === "development" ? "" : "https://agency.packmetrix.com");

// The live sample site — the Maraya Journeys demo agency. A same-origin relative
// path works in both local (localhost:3000/maraya-journeys) and prod
// (packmetrix.com/maraya-journeys); override with NEXT_PUBLIC_SAMPLE_URL if needed.
const SAMPLE_URL = process.env.NEXT_PUBLIC_SAMPLE_URL ?? "/maraya-journeys";

// ── Sample package shape (global demo content) ───────────────────────────────

type SamplePkg = {
  destinationKind: string;
  agency: string;
  nights: number;
  price: string;
  currency: string;
  title: string; titleAr: string;
  desc?: string; descAr?: string;
  highlights: string[];
};

function maltaPkg(isAr: boolean): SamplePkg {
  return {
    destinationKind: "malta",
    agency: isAr ? "مرايا للأسفار" : "Maraya Journeys",
    nights: 5, price: "388", currency: "€",
    title: "Discover Malta this summer",
    titleAr: "اكتشف جمال مالطا هذا الصيف!",
    desc: "Mediterranean light, harbour walks, and a hotel inside the old citadel walls.",
    descAr: "ضوء البحر المتوسط، نزهات في الميناء، وفندق داخل أسوار القلعة.",
    highlights: isAr ? ["فندق وسط المدينة", "جولة مع مرشد", "تذاكر طيران"] : ["City centre hotel", "Guided city tour", "Return flights"],
  };
}

// How-it-works walkthrough package — a global family escape (Algarve, Portugal)
function familyPkg(isAr: boolean): SamplePkg {
  return {
    destinationKind: "algarve",
    agency: isAr ? "مرايا للأسفار" : "Maraya Journeys",
    nights: 5, price: "1,420", currency: "€",
    title: "Algarve family escape",
    titleAr: "رحلة العائلة إلى الغارفي",
    desc: "Golden cliffs, calm beaches, and an easy coast — five nights for the whole family.",
    descAr: "منحدرات ذهبية، شواطئ هادئة، وساحل مريح — خمس ليالٍ لكل العائلة.",
    highlights: isAr ? ["فندق ٤ نجوم", "سيارة مع سائق", "جولات ساحلية"] : ["4-star hotel", "Car with driver", "Coast tours"],
  };
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const ArrowSVG = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const CheckSVG = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const SparkSVG = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);
const LinkSVG = ({ size = 10 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);
const GlobeSVG = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);
const TypeSVG = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/>
  </svg>
);
const ImgSVG = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
  </svg>
);
const HomeSVG = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
);
function WASvg({ size = 15 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

// ── Sample mockups (the real product, themed) ────────────────────────────────

function MarketingCoverGradient({ kind, height, coverImage }: { kind: string; height: number; coverImage?: string }) {
  const bg = DESTINATION_GRADIENTS[kind] ?? DESTINATION_GRADIENTS.default;
  return (
    <div style={{ width: "100%", height, background: bg, position: "relative", overflow: "hidden" }}>
      {!coverImage && <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,.04) 0, rgba(255,255,255,.04) 1px, transparent 1px, transparent 8px)" }} />}
      {coverImage && <img src={coverImage} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,.45) 100%)" }} />
    </div>
  );
}

// A package page in a phone — Aurora style: cream paper, serif, gold accent.
function AuroraMiniPage({ pkg, lang }: { pkg: SamplePkg; lang: "en" | "ar" }) {
  const isAr  = lang === "ar";
  const paper = "#faf5e8", ink = "#1a1611", ink2 = "#5e564a", gold = "#b08a3e", rule = "#e8dfcc";
  const title = isAr ? pkg.titleAr : pkg.title;
  const desc  = isAr ? pkg.descAr : pkg.desc;
  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ background: paper, color: ink, height: "100%", overflow: "hidden", fontFamily: '"Inter", system-ui, sans-serif' }}>
      <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, background: paper, borderBottom: `1px solid ${rule}` }}>
        <div style={{ width: 18, height: 18, borderRadius: 4, background: ink, color: gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, fontFamily: '"Newsreader", Georgia, serif' }}>M</div>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: ink, fontFamily: '"Newsreader", Georgia, serif' }}>{pkg.agency}</div>
      </div>
      <MarketingCoverGradient kind={pkg.destinationKind} height={150} />
      <div style={{ padding: "14px 16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, fontSize: 9, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase", color: gold }}>
          {pkg.nights} {isAr ? "ليالٍ" : "Nights"}<span style={{ opacity: .5 }}>·</span>{pkg.currency}{pkg.price}
        </div>
        <div style={{ fontFamily: '"Newsreader", Georgia, serif', fontSize: 21, fontWeight: 400, color: ink, letterSpacing: -.5, lineHeight: 1.1, marginBottom: 10 }}>{title}</div>
        {desc && <div style={{ fontSize: 11.5, color: ink2, lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{desc}</div>}
        {pkg.highlights.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 12 }}>
            {pkg.highlights.slice(0, 3).map((h, i) => (
              <span key={i} style={{ fontSize: 9.5, fontWeight: 500, padding: "3px 8px", borderRadius: 999, background: "#fff", border: `1px solid ${rule}`, color: ink, display: "inline-flex", alignItems: "center", gap: 4 }}>
                <span style={{ color: gold }}>✓</span>{h}
              </span>
            ))}
          </div>
        )}
        <button style={{ width: "100%", marginTop: 14, padding: "11px 0", background: "#25D366", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, cursor: "pointer" }}>
          <WASvg size={13} />{isAr ? "تواصل عبر واتساب" : "Contact on WhatsApp"}
        </button>
      </div>
    </div>
  );
}

function BrowserChrome({ url, children, radius = 14, tilt = 0 }: { url: string; children: React.ReactNode; radius?: number; tilt?: number }) {
  return (
    <div style={{
      background: "#0d0a06", borderRadius: radius, overflow: "hidden",
      boxShadow: "0 32px 80px -24px rgba(26,22,17,.30), 0 12px 32px -12px rgba(26,22,17,.12)",
      transform: tilt ? `rotate(${tilt}deg)` : undefined, transformOrigin: "center",
    }}>
      <div style={{ background: "#1a1410", padding: "9px 13px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["#ff5f56", "#ffbd2e", "#27c93f"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}
        </div>
        <div style={{
          flex: 1, marginInlineStart: 6, padding: "3px 10px",
          background: "rgba(255,255,255,.06)", borderRadius: 5,
          fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,.6)", letterSpacing: -0.2,
          display: "flex", alignItems: "center", gap: 5, direction: "ltr",
        }}>
          <span style={{ color: DA_GOLD, display: "inline-flex" }}><LinkSVG size={9} /></span>{url}
        </div>
      </div>
      {children}
    </div>
  );
}

// The agency homepage — cream paper, serif display, gold accent.
function AgencyHomepageMini({ lang = "en", h = 360 }: { lang?: "en" | "ar"; h?: number }) {
  const isAr = lang === "ar";
  const paper = "#faf5e8", ink = "#1a1611", ink2 = "#5e564a", gold = "#b08a3e", rule = "#e8dfcc";
  const nav = isAr ? ["الباقات", "الوجهات", "من نحن"] : ["Packages", "Destinations", "About"];
  const eye = (c: string): React.CSSProperties => ({ fontFamily: SANS, fontSize: 8.5, fontWeight: 700, letterSpacing: 1.6, textTransform: "uppercase", color: c });
  const cards: [string, string, string][] = [["#4a8fb8", "Malta", "€388"], ["#d4865a", "Cappadocia", "€512"], ["#6fbcbd", "Sardinia", "€640"]];
  const names = isAr ? ["مالطا", "كابادوكيا", "سردينيا"] : null;
  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ height: h, background: paper, overflow: "hidden", fontFamily: SANS }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px", borderBottom: `1px solid ${rule}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: ink, color: gold, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontWeight: 600, fontSize: 12 }}>M</div>
          <span style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 600, color: ink }}>{isAr ? "مرايا" : "Maraya"}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {nav.map(n => <span key={n} style={{ fontSize: 10, color: ink2 }}>{n}</span>)}
          <span style={{ fontSize: 9.5, fontWeight: 600, padding: "5px 10px", borderRadius: 6, background: "#25D366", color: "#fff", display: "inline-flex", alignItems: "center", gap: 4 }}><WASvg size={10} />{isAr ? "راسلنا" : "Message"}</span>
        </div>
      </div>
      <div style={{ position: "relative", height: 150 }}>
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg,#4a8fb8,#1f5378 60%,#122d44)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,transparent 35%,rgba(0,0,0,.5))" }} />
        <div style={{ position: "absolute", insetInline: 0, bottom: 0, padding: "0 18px 16px" }}>
          <div style={eye("rgba(255,255,255,.85)")}>{isAr ? "رحلات مختارة بعناية" : "Curated journeys"}</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 600, color: "#fff", letterSpacing: -.5, lineHeight: 1.05, marginTop: 5, maxWidth: "72%", textShadow: "0 2px 16px rgba(0,0,0,.4)" }}>{isAr ? "اكتشف العالم على طريقتك" : "See the world, your way"}</div>
          <div style={{ marginTop: 12 }}>
            <span style={{ fontSize: 9.5, fontWeight: 600, padding: "7px 13px", borderRadius: 7, background: gold, color: "#fff" }}>{isAr ? "تصفّح الباقات" : "Browse packages"}</span>
          </div>
        </div>
      </div>
      <div style={{ padding: "14px 18px" }}>
        <div style={eye(gold)}>{isAr ? "باقات مختارة" : "Featured packages"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9, marginTop: 8 }}>
          {cards.map((c, i) => (
            <div key={i} style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${rule}`, background: "#fff" }}>
              <div style={{ height: 48, background: `linear-gradient(135deg,${c[0]},${c[0]}99)` }} />
              <div style={{ padding: "7px 9px" }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 12, fontWeight: 600, color: ink }}>{names ? names[i] : c[1]}</div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 3 }}>
                  <span style={{ fontSize: 8.5, color: ink2 }}>{isAr ? "٥ ليالٍ" : "5 nights"}</span>
                  <span style={{ fontFamily: DISPLAY, fontSize: 12, fontWeight: 600, color: gold }}>{c[2]}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div style={{ padding: "11px 18px", borderTop: `1px solid ${rule}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontFamily: DISPLAY, fontSize: 12, fontWeight: 600, color: ink }}>{isAr ? "مرايا للأسفار" : "Maraya Journeys"}</span>
        <span style={{ fontSize: 9, color: "#968d7c" }}>{isAr ? "مشغّل بواسطة" : "Powered by"} <b style={{ color: ink2 }}>Packmetrix</b></span>
      </div>
    </div>
  );
}

// The agency storefront — every package, listed (global destinations).
function AgencyStorefrontMini({ lang = "en", h = 360 }: { lang?: "en" | "ar"; h?: number }) {
  const isAr = lang === "ar";
  const paper = "#faf5e8", ink = "#1a1611", ink2 = "#5e564a", gold = "#b08a3e", rule = "#e8dfcc";
  const cards: [string, string, string][] = [["#4a8fb8", "Malta", "€388"], ["#d4865a", "Cappadocia", "€512"], ["#6fbcbd", "Sardinia", "€640"], ["#c89a5a", "Lisbon", "€430"], ["#5a7da8", "Santorini", "€690"], ["#6ea069", "Kyoto", "€880"]];
  const names = isAr ? ["مالطا", "كابادوكيا", "سردينيا", "لشبونة", "سانتوريني", "كيوتو"] : null;
  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ height: h, background: paper, overflow: "hidden", fontFamily: SANS }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 18px", borderBottom: `1px solid ${rule}` }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 22, height: 22, borderRadius: 6, background: ink, color: gold, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontWeight: 600, fontSize: 12 }}>M</div>
          <span style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 600, color: ink }}>{isAr ? "مرايا" : "Maraya"}</span>
        </div>
        <span style={{ fontSize: 9.5, fontWeight: 600, padding: "5px 10px", borderRadius: 6, background: gold, color: "#fff" }}>{isAr ? "كل الباقات" : "All packages"}</span>
      </div>
      <div style={{ padding: "14px 18px" }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 600, color: ink, letterSpacing: -.4 }}>{isAr ? "كل رحلاتنا" : "Every journey we offer"}</div>
          <span style={{ fontSize: 9, color: ink2 }}>{isAr ? "١٢ باقة" : "12 packages"}</span>
        </div>
        <div style={{ display: "flex", gap: 6, marginTop: 8, marginBottom: 12 }}>
          {(isAr ? ["الكل", "شاطئ", "ثقافة", "مدن"] : ["All", "Beach", "Culture", "City"]).map((c, i) => (
            <span key={i} style={{ fontSize: 9, fontWeight: 600, padding: "4px 10px", borderRadius: 999, background: i === 0 ? ink : "#fff", color: i === 0 ? paper : ink2, border: `1px solid ${rule}` }}>{c}</span>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 9 }}>
          {cards.map((c, i) => (
            <div key={i} style={{ borderRadius: 8, overflow: "hidden", border: `1px solid ${rule}`, background: "#fff" }}>
              <div style={{ height: 44, background: `linear-gradient(135deg,${c[0]},${c[0]}99)` }} />
              <div style={{ padding: "6px 8px" }}>
                <div style={{ fontFamily: DISPLAY, fontSize: 11, fontWeight: 600, color: ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{names ? names[i] : c[1]}</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 11, fontWeight: 600, color: gold, marginTop: 2 }}>{c[2]}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Nav ─────────────────────────────────────────────────────────────────────

function LandingNav({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = isAr
    ? { nav: ["المنتج", "القوالب", "كيف يعمل", "الأسعار"], login: "تسجيل الدخول", claim: "ابدأ التجربة" }
    : { nav: ["Product", "Templates", "How it works", "Pricing"], login: "Login", claim: "Start free trial" };
  const anchors = ["solution", "templates", "how", "pricing"];
  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 50,
      background: "rgba(244,240,232,.85)", backdropFilter: "saturate(160%) blur(10px)",
      borderBottom: `1px solid ${DA_RULE}`, padding: "14px 48px",
      display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: SANS,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
        <div style={{ width: 30, height: 30, borderRadius: 7, background: DA_INK1, color: DA_GOLD, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 14 }}>P</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 19, color: DA_INK1, letterSpacing: -0.2 }}>PackMetrix</div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
        {L.nav.map((n, i) => (
          <a key={i} href={`#${anchors[i]}`} style={{ padding: "6px 12px", fontFamily: SANS, fontSize: 13, color: DA_INK2, cursor: "pointer", textDecoration: "none", borderRadius: 6 }}>{n}</a>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", padding: 3, background: DA_SURFACE, border: `1px solid ${DA_RULE2}`, borderRadius: 999, fontSize: 11.5, fontWeight: 500, fontFamily: SANS }}>
          {(["EN", "عربي"] as const).map((l, i) => {
            const active = (lang === "en" && i === 0) || (lang === "ar" && i === 1);
            return (
              <div key={l} onClick={() => switchLang(i === 0 ? "en" : "ar")} style={{ padding: "3px 10px", borderRadius: 999, background: active ? DA_INK1 : "transparent", color: active ? DA_BG : DA_INK2, cursor: "pointer", userSelect: "none" }}>{l}</div>
            );
          })}
        </div>
        <a href={`${AGENCY_URL}/login`} style={{ fontFamily: SANS, fontSize: 13, color: DA_INK1, fontWeight: 500, cursor: "pointer", textDecoration: "none", marginInline: 4 }}>{L.login}</a>
        <a href={`${AGENCY_URL}/signup`} style={{ padding: "8px 16px", background: DA_GOLD, color: "#fff", border: "none", borderRadius: 8, fontFamily: SANS, fontSize: 13, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, textDecoration: "none", boxShadow: "0 1px 2px rgba(0,0,0,.04), inset 0 1px 0 rgba(255,255,255,.15)" }}>{L.claim}<ArrowSVG size={13} /></a>
      </div>
    </div>
  );
}

function MobileLandingNav({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const [menuOpen, setMenuOpen] = useState(false);
  const L = isAr
    ? { nav: ["المنتج", "القوالب", "كيف يعمل", "الأسعار"], login: "تسجيل الدخول", claim: "ابدأ التجربة" }
    : { nav: ["Product", "Templates", "How it works", "Pricing"], login: "Login", claim: "Start free trial" };
  const anchors = ["solution", "templates", "how", "pricing"];
  return (
    <div style={{ position: "sticky", top: 0, zIndex: 50, fontFamily: SANS }}>
      <div style={{ background: "rgba(244,240,232,.9)", backdropFilter: "saturate(160%) blur(10px)", borderBottom: `1px solid ${DA_RULE}`, padding: "12px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setMenuOpen(o => !o)} aria-label="Menu" style={{ background: "none", border: "none", padding: 4, cursor: "pointer", display: "flex", flexDirection: "column", gap: 4.5, justifyContent: "center" }}>
            {[0, 1, 2].map(i => <span key={i} style={{ display: "block", width: 20, height: 1.5, background: DA_INK1, borderRadius: 2 }} />)}
          </button>
          <div style={{ fontFamily: DISPLAY, fontSize: 17, color: DA_INK1, letterSpacing: -0.2 }}>PackMetrix</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", padding: 2, background: DA_SURFACE, border: `1px solid ${DA_RULE2}`, borderRadius: 999, fontSize: 10.5, fontWeight: 500, fontFamily: SANS }}>
            {(["EN", "عربي"] as const).map((l, i) => {
              const active = (lang === "en" && i === 0) || (lang === "ar" && i === 1);
              return <div key={l} onClick={() => switchLang(i === 0 ? "en" : "ar")} style={{ padding: "3px 8px", borderRadius: 999, background: active ? DA_INK1 : "transparent", color: active ? DA_BG : DA_INK2, cursor: "pointer", userSelect: "none" }}>{l}</div>;
            })}
          </div>
          <a href={`${AGENCY_URL}/signup`} style={{ padding: "6px 12px", background: DA_GOLD, color: "#fff", border: "none", borderRadius: 7, fontFamily: SANS, fontSize: 12, fontWeight: 600, textDecoration: "none", cursor: "pointer" }}>{L.claim}</a>
        </div>
      </div>
      {menuOpen && (
        <div style={{ background: "rgba(244,240,232,.97)", backdropFilter: "saturate(160%) blur(10px)", borderBottom: `1px solid ${DA_RULE}`, padding: "8px 0" }}>
          {L.nav.map((n, i) => (
            <a key={i} href={`#${anchors[i]}`} onClick={() => setMenuOpen(false)} style={{ display: "block", padding: "11px 20px", fontFamily: SANS, fontSize: 15, color: DA_INK1, fontWeight: 500, textDecoration: "none", borderBottom: i < L.nav.length - 1 ? `1px solid ${DA_RULE}` : "none", textAlign: isAr ? "right" : "left" }}>{n}</a>
          ))}
          <a href={`${AGENCY_URL}/login`} style={{ display: "block", padding: "11px 20px", fontFamily: SANS, fontSize: 15, color: DA_INK1, fontWeight: 500, textDecoration: "none", textAlign: isAr ? "right" : "left" }}>{L.login}</a>
        </div>
      )}
    </div>
  );
}

// ── Hero ─────────────────────────────────────────────────────────────────────

function SampleLangToggle({ value, onChange }: { value: "en" | "ar"; onChange: (v: "en" | "ar") => void }) {
  return (
    <div style={{ display: "flex", padding: 3, background: DA_SURFACE, border: `1px solid ${DA_RULE2}`, borderRadius: 999, boxShadow: "0 1px 2px rgba(0,0,0,.05)" }}>
      {([["en", "EN"], ["ar", "عربي"]] as const).map(([id, lab]) => {
        const active = value === id;
        return (
          <button key={id} onClick={(e) => { e.preventDefault(); onChange(id); }} style={{ padding: "4px 13px", borderRadius: 999, border: "none", cursor: "pointer", background: active ? DA_INK1 : "transparent", color: active ? DA_BG : DA_INK2, fontFamily: SANS, fontWeight: 600, fontSize: 11.5 }}>{lab}</button>
        );
      })}
    </div>
  );
}

function HeroVisual({ lang, sampleLang, onSampleLang }: { lang: "en" | "ar"; sampleLang: "en" | "ar"; onSampleLang: (v: "en" | "ar") => void }) {
  const uiAr = lang === "ar";
  const Lx = uiAr ? { badge: "نموذج حيّ · بيانات تجريبية", explore: "استكشف النموذج الحيّ" } : { badge: "Live sample · demo data", explore: "Explore the live sample" };
  const onSample = () => posthog.capture("sample_clicked", { location: "hero", lang, device: "desktop" });
  return (
    <div style={{ position: "relative", width: "100%", height: 524 }}>
      <div style={{ position: "absolute", top: 0, insetInline: 0, zIndex: 6, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 11px", background: DA_SURFACE, border: `1px solid ${DA_RULE2}`, borderRadius: 999, fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_INK2, boxShadow: "0 1px 2px rgba(0,0,0,.04)" }}>
          <span style={{ position: "relative", width: 8, height: 8 }}>
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: DA_GREEN }} />
            <span style={{ position: "absolute", inset: -3, borderRadius: "50%", background: DA_GREEN, opacity: .25, animation: "pm-pulse 1.6s ease-out infinite" }} />
          </span>
          {Lx.badge}
        </span>
        <SampleLangToggle value={sampleLang} onChange={onSampleLang} />
      </div>

      <a href={SAMPLE_URL} target="_blank" rel="noopener noreferrer" onClick={onSample} style={{ position: "absolute", top: 44, insetInlineStart: 0, width: 558, textDecoration: "none", display: "block" }}>
        <BrowserChrome url="maraya.travel" tilt={-1.5}><AgencyHomepageMini lang={sampleLang} h={352} /></BrowserChrome>
        <span style={{ position: "absolute", bottom: 16, insetInlineStart: "50%", transform: "translateX(-50%) rotate(-1.5deg)", display: "inline-flex", alignItems: "center", gap: 7, whiteSpace: "nowrap", padding: "10px 18px", background: DA_GOLD, color: "#fff", borderRadius: 999, fontFamily: SANS, fontSize: 13.5, fontWeight: 600, boxShadow: "0 8px 24px -6px rgba(176,138,62,.5), inset 0 1px 0 rgba(255,255,255,.2)" }}>{Lx.explore}<ArrowSVG size={14} /></span>
      </a>

      <a href={SAMPLE_URL} target="_blank" rel="noopener noreferrer" onClick={onSample} style={{ position: "absolute", bottom: -6, insetInlineEnd: 0, width: 208, background: "#0d0a06", borderRadius: 22, padding: 9, textDecoration: "none", display: "block", boxShadow: "0 24px 60px -16px rgba(26,22,17,.32), 0 8px 20px -8px rgba(26,22,17,.16)", transform: "rotate(3deg)", transformOrigin: "center" }}>
        <div style={{ background: "#faf5e8", borderRadius: 14, overflow: "hidden", height: 360 }}>
          <AuroraMiniPage pkg={maltaPkg(sampleLang === "ar")} lang={sampleLang} />
        </div>
      </a>
    </div>
  );
}

function LandingHero({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const [sampleLang, setSampleLang] = useState<"en" | "ar">(lang);
  const [prevLang, setPrevLang] = useState<"en" | "ar">(lang);
  if (prevLang !== lang) { setPrevLang(lang); setSampleLang(lang); }
  const L = isAr ? {
    eyebrow: "لوكالات السفر · ثنائي اللغة",
    titleA: "موقع كامل بهويتك",
    titleB: "لوكالة سفرك.",
    sub: "الرئيسية، المتجر، وصفحات الباقات الجميلة — موحّدة بهويتك، على نطاقك الخاص، في دقائق. ثنائي اللغة (عربي/إنجليزي) وجاهز لـ RTL. ألصق باقة، ويبني باكميتركس الباقي.",
    primary: "ابدأ التجربة المجانية",
    explore: "استكشف النموذج الحيّ",
    demo: "احجز عرضاً توضيحياً",
    proof: [`تجربة ${TRIAL_DAYS} يوماً`, "بدون بطاقة ائتمان", "سعر التأسيس 39 € ثابت مدى الحياة"],
  } : {
    eyebrow: "For travel agencies · bilingual",
    titleA: "A complete branded website",
    titleB: "for your travel agency.",
    sub: "Homepage, storefront, and beautiful package pages — unified by your brand, on your own domain, in minutes. Bilingual EN/AR with proper RTL. Paste a package, and Packmetrix builds the rest.",
    primary: "Start free trial",
    explore: "Explore the live sample",
    demo: "Book a demo",
    proof: [`${TRIAL_DAYS}-day trial`, "No credit card", "Founding price €39 locked for life"],
  };

  return (
    <div id="product" style={{ padding: "64px 48px 80px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 80% 20%, rgba(176,138,62,.10), transparent 55%), radial-gradient(ellipse at 20% 80%, rgba(176,138,62,.06), transparent 50%)" }} />
      <div style={{ position: "relative", maxWidth: 1280, marginInline: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
        <div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", background: DA_SURFACE, border: `1px solid ${DA_RULE2}`, borderRadius: 999, fontFamily: SANS, fontSize: 12, fontWeight: 500, color: DA_INK2, boxShadow: "0 1px 2px rgba(0,0,0,.02)" }}>
            <span style={{ position: "relative", width: 8, height: 8 }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: DA_GOLD }} />
              <span style={{ position: "absolute", inset: -3, borderRadius: "50%", background: DA_GOLD, opacity: .25, animation: "pm-pulse 1.6s ease-out infinite" }} />
            </span>
            {L.eyebrow}
          </div>

          <h1 style={{ margin: "22px 0 0", fontFamily: DISPLAY, fontSize: isAr ? 54 : 60, fontWeight: 400, color: DA_INK1, letterSpacing: -1.6, lineHeight: 1.03 }}>
            <div>{L.titleA}</div>
            <div style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleB}</div>
          </h1>

          <p style={{ marginTop: 22, maxWidth: 540, fontFamily: SANS, fontSize: 17, color: DA_INK2, lineHeight: 1.6 }}>{L.sub}</p>

          <div style={{ marginTop: 28, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <a href={`${AGENCY_URL}/signup`} onClick={() => posthog.capture("cta_clicked", { cta: "signup", location: "hero", lang, device: "desktop" })} style={{ padding: "14px 22px", background: DA_GOLD, color: "#fff", border: "none", borderRadius: 10, fontFamily: SANS, fontSize: 14.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", textDecoration: "none", boxShadow: "0 2px 4px rgba(26,22,17,.08), 0 8px 24px -8px rgba(176,138,62,.4), inset 0 1px 0 rgba(255,255,255,.18)" }}>{L.primary}<ArrowSVG size={15} /></a>
            <a href={SAMPLE_URL} target="_blank" rel="noopener noreferrer" onClick={() => posthog.capture("sample_clicked", { location: "hero_button", lang, device: "desktop" })} style={{ padding: "13px 20px", background: DA_SURFACE, color: DA_INK1, border: `1.5px solid ${DA_GOLD}`, borderRadius: 10, fontFamily: SANS, fontSize: 14, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", textDecoration: "none" }}>
              <span style={{ position: "relative", width: 8, height: 8 }}>
                <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: DA_GREEN }} />
                <span style={{ position: "absolute", inset: -3, borderRadius: "50%", background: DA_GREEN, opacity: .3, animation: "pm-pulse 1.6s ease-out infinite" }} />
              </span>
              {L.explore}<span style={{ color: DA_GOLD, display: "inline-flex" }}><ArrowSVG size={14} /></span>
            </a>
          </div>

          <a href="#demo" onClick={() => posthog.capture("demo_cta_clicked", { location: "hero", lang, device: "desktop" })} style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 14, fontFamily: SANS, fontSize: 13.5, color: DA_INK2, fontWeight: 500, cursor: "pointer", textDecoration: "none" }}>{L.demo}<span style={{ color: DA_GOLD, display: "inline-flex" }}><ArrowSVG size={13} /></span></a>

          <div style={{ marginTop: 22, display: "flex", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            {L.proof.map((p, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 12.5, color: DA_INK2 }}>
                <span style={{ width: 16, height: 16, borderRadius: "50%", background: DA_GREEN_SOFT, color: DA_GREEN, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CheckSVG /></span>
                {p}
              </span>
            ))}
          </div>
        </div>

        <div dir="ltr"><HeroVisual lang={lang} sampleLang={sampleLang} onSampleLang={setSampleLang} /></div>
      </div>
    </div>
  );
}

function MobileLandingHero({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const [sampleLang, setSampleLang] = useState<"en" | "ar">(lang);
  const [prevLang, setPrevLang] = useState<"en" | "ar">(lang);
  if (prevLang !== lang) { setPrevLang(lang); setSampleLang(lang); }
  const L = isAr ? {
    eyebrow: "لوكالات السفر · ثنائي اللغة",
    titleA: "موقع كامل بهويتك",
    titleB: "لوكالة سفرك.",
    sub: "الرئيسية والمتجر وصفحات الباقات — بهويتك، على نطاقك، في دقائق. ثنائي اللغة وجاهز لـ RTL.",
    primary: "ابدأ التجربة المجانية",
    explore: "استكشف النموذج الحيّ",
    demo: "احجز عرضاً توضيحياً",
    badge: "نموذج حيّ · بيانات تجريبية",
    proof: [`تجربة ${TRIAL_DAYS} يوماً`, "بدون بطاقة ائتمان", "39 € تأسيس · مدى الحياة"],
  } : {
    eyebrow: "For travel agencies · bilingual",
    titleA: "A complete branded site",
    titleB: "for your travel agency.",
    sub: "Homepage, storefront, and package pages — your brand, your domain, in minutes. Bilingual EN/AR with proper RTL.",
    primary: "Start free trial",
    explore: "Explore the live sample",
    demo: "Book a demo",
    badge: "Live sample · demo data",
    proof: [`${TRIAL_DAYS}-day trial`, "No credit card", "€39 founding · for life"],
  };

  return (
    <div id="product" style={{ padding: "28px 18px 36px", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse at 50% 0%, rgba(176,138,62,.08), transparent 50%)" }} />
      <div style={{ position: "relative" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "4px 10px 4px 8px", background: DA_SURFACE, border: `1px solid ${DA_RULE2}`, borderRadius: 999, fontFamily: SANS, fontSize: 11, color: DA_INK2 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: DA_GOLD }} />{L.eyebrow}
        </div>

        <h1 style={{ margin: "16px 0 0", fontFamily: DISPLAY, fontSize: isAr ? 34 : 38, fontWeight: 400, color: DA_INK1, letterSpacing: -1.1, lineHeight: 1.04 }}>
          <div>{L.titleA}</div>
          <div style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleB}</div>
        </h1>

        <p style={{ margin: "16px 0 0", fontFamily: SANS, fontSize: 16, color: DA_INK2, lineHeight: 1.6 }}>{L.sub}</p>

        <a href={`${AGENCY_URL}/signup`} onClick={() => posthog.capture("cta_clicked", { cta: "signup", location: "hero", lang, device: "mobile" })} style={{ display: "flex", width: "100%", marginTop: 22, padding: "13px 0", background: DA_GOLD, color: "#fff", border: "none", borderRadius: 10, fontFamily: SANS, fontSize: 14, fontWeight: 600, alignItems: "center", justifyContent: "center", gap: 7, cursor: "pointer", textDecoration: "none", boxSizing: "border-box", boxShadow: "0 2px 4px rgba(26,22,17,.08), 0 8px 20px -6px rgba(176,138,62,.4), inset 0 1px 0 rgba(255,255,255,.18)" }}>{L.primary}<ArrowSVG size={14} /></a>

        <a href={SAMPLE_URL} target="_blank" rel="noopener noreferrer" onClick={() => posthog.capture("sample_clicked", { location: "hero_button", lang, device: "mobile" })} style={{ display: "flex", width: "100%", marginTop: 10, padding: "12px 0", background: DA_SURFACE, color: DA_INK1, border: `1.5px solid ${DA_GOLD}`, borderRadius: 10, fontFamily: SANS, fontSize: 13.5, fontWeight: 600, alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", textDecoration: "none", boxSizing: "border-box" }}>
          <span style={{ position: "relative", width: 8, height: 8 }}>
            <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: DA_GREEN }} />
            <span style={{ position: "absolute", inset: -3, borderRadius: "50%", background: DA_GREEN, opacity: .3, animation: "pm-pulse 1.6s ease-out infinite" }} />
          </span>
          {L.explore}<span style={{ color: DA_GOLD, display: "inline-flex" }}><ArrowSVG size={13} /></span>
        </a>

        <a href="#demo-m" onClick={() => posthog.capture("demo_cta_clicked", { location: "hero", lang, device: "mobile" })} style={{ display: "block", marginTop: 12, textAlign: "center", fontFamily: SANS, fontSize: 13, color: DA_INK2, fontWeight: 500, cursor: "pointer", textDecoration: "none" }}>{L.demo} <span style={{ color: DA_GOLD }}>→</span></a>

        <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
          {L.proof.map((p, i) => (
            <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, fontFamily: SANS, fontSize: 11, color: DA_INK2 }}>
              <span style={{ width: 13, height: 13, borderRadius: "50%", background: DA_GREEN_SOFT, color: DA_GREEN, display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CheckSVG size={8} /></span>{p}
            </span>
          ))}
        </div>

        <div style={{ marginTop: 28 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "4px 10px", background: DA_SURFACE, border: `1px solid ${DA_RULE2}`, borderRadius: 999, fontFamily: SANS, fontSize: 10.5, fontWeight: 600, color: DA_INK2 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: DA_GREEN }} />{L.badge}
            </span>
            <SampleLangToggle value={sampleLang} onChange={setSampleLang} />
          </div>
          <a href={SAMPLE_URL} target="_blank" rel="noopener noreferrer" onClick={() => posthog.capture("sample_clicked", { location: "hero_preview", lang, device: "mobile" })} style={{ display: "block", textDecoration: "none", position: "relative" }}>
            <BrowserChrome url="maraya.travel" radius={12}><AgencyHomepageMini lang={sampleLang} h={300} /></BrowserChrome>
            <span style={{ position: "absolute", bottom: 14, insetInlineStart: "50%", transform: "translateX(-50%)", display: "inline-flex", alignItems: "center", gap: 6, whiteSpace: "nowrap", padding: "9px 16px", background: DA_GOLD, color: "#fff", borderRadius: 999, fontFamily: SANS, fontSize: 12.5, fontWeight: 600, boxShadow: "0 8px 22px -6px rgba(176,138,62,.5), inset 0 1px 0 rgba(255,255,255,.2)" }}>{L.explore}<ArrowSVG size={13} /></span>
          </a>
        </div>
      </div>
    </div>
  );
}

// ── Problem ──────────────────────────────────────────────────────────────────

const XMark = ({ size = 15 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>
);

function problemCopy(isAr: boolean) {
  return isAr ? {
    eyebrow: "المشكلة",
    title: "معظم الوكالات لا تملك موقعاً حقيقياً.",
    sub: "موقع قديم، أو ضعيف، أو لا يوجد أصلاً — والرحلات تُرسَل كملفات PDF أو رسائل نصية. لا مكان يُرسَل إليه العميل ليرى من أنتم وماذا تقدّمون.",
    cards: [
      { h: "ملفات Word وPDF", b: "تُرسَل الباقات كصور وملفات، واحدة تلو الأخرى، بلا رابط ولا علامة." },
      { h: "لا موقع، فقط رقم", b: "شعار ورقم هاتف. لا صفحة رئيسية، لا متجر، لا مكان يبني الثقة." },
      { h: "أو أداة عامة", b: "منشئ مواقع عام لا يفهم السفر ولا طريقة عرض الباقات وبيعها." },
    ],
  } : {
    eyebrow: "The problem",
    title: "Most agencies don't have a real website.",
    sub: "An outdated site, a weak one, or none at all — trips go out as PDFs and plain text. There's nowhere to send a client to see who you are and what you sell.",
    cards: [
      { h: "Word docs & PDFs", b: "Packages go out as images and files, one-by-one — no link, no brand, nothing to track." },
      { h: "No site, just a number", b: "A logo and a phone number. No homepage, no storefront, nothing that builds trust." },
      { h: "Or a generic builder", b: "A one-size-fits-all site builder that doesn't understand travel — or how to present and sell trips." },
    ],
  };
}

function LandingProblem({ lang }: { lang: "en" | "ar" }) {
  const L = problemCopy(lang === "ar");
  return (
    <div style={{ padding: "72px 48px", background: DA_BG }}>
      <div style={{ maxWidth: 1180, marginInline: "auto" }}>
        <div style={{ maxWidth: 680, marginBottom: 40 }}>
          <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_DANGER }}>{L.eyebrow}</div>
          <h2 style={{ margin: "12px 0 0", fontFamily: DISPLAY, fontSize: 44, fontWeight: 400, color: DA_INK1, letterSpacing: -1.1, lineHeight: 1.06 }}>{L.title}</h2>
          <p style={{ margin: "16px 0 0", fontFamily: SANS, fontSize: 17, color: DA_INK2, lineHeight: 1.6 }}>{L.sub}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
          {L.cards.map((c, i) => (
            <div key={i} style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14, padding: 24 }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: DA_DANGER_SOFT, color: DA_DANGER, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}><XMark /></div>
              <h3 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 20, fontWeight: 400, color: DA_INK1, letterSpacing: -.3 }}>{c.h}</h3>
              <p style={{ margin: "8px 0 0", fontFamily: SANS, fontSize: 14.5, color: DA_INK2, lineHeight: 1.55 }}>{c.b}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileLandingProblem({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = problemCopy(isAr);
  return (
    <div style={{ padding: "40px 18px", background: DA_BG }}>
      <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_DANGER }}>{L.eyebrow}</div>
      <h2 style={{ margin: "10px 0 18px", fontFamily: DISPLAY, fontSize: 26, fontWeight: 400, color: DA_INK1, letterSpacing: -.7, lineHeight: 1.1 }}>{L.title}</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {L.cards.map((c, i) => (
          <div key={i} style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 12, padding: 16, display: "flex", gap: 12 }}>
            <div style={{ width: 28, height: 28, borderRadius: 7, background: DA_DANGER_SOFT, color: DA_DANGER, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}><XMark size={14} /></div>
            <div><div style={{ fontFamily: DISPLAY, fontSize: 16, color: DA_INK1 }}>{c.h}</div><div style={{ fontFamily: SANS, fontSize: 13.5, color: DA_INK2, marginTop: 3, lineHeight: 1.5 }}>{c.b}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Showcase — the solution, in real screens ─────────────────────────────────

function showcaseCopy(isAr: boolean) {
  return isAr ? {
    eyebrow: "الحل",
    title: "حضور إلكتروني واحد متماسك،",
    titleAccent: "موحّد بهويتك.",
    sub: "صفحة رئيسية تُعرّف بكم، متجر يعرض كل باقة، وصفحات باقات تُتمّ البيع — كلها بألوانكم وخطوطكم، كلها على نطاقكم.",
    screens: [
      { label: "الصفحة الرئيسية", cap: "تُعرّف بوكالتكم — قصتكم، خدماتكم، وأفضل باقاتكم. أقسام معيارية ترتّبونها كما تشاؤون." },
      { label: "المتجر", cap: "كل باقة في مكان واحد قابل للتصفية. يتصفّحها العميل ويفتح ما يهمّه." },
      { label: "صفحة الباقة", cap: "صفحة جميلة تُتمّ البيع — بالتفاصيل والصور وطريقة واضحة للتواصل." },
    ],
  } : {
    eyebrow: "The solution",
    title: "One coherent web presence,",
    titleAccent: "unified by your brand.",
    sub: "A homepage that introduces you, a storefront that lists every package, and package pages that close the sale — all in your colours and fonts, all on your domain.",
    screens: [
      { label: "Homepage", cap: "Introduces your agency — your story, services, and best packages. Modular sections you arrange yourself." },
      { label: "Storefront", cap: "Every package in one filterable place. Travellers browse and open what catches their eye." },
      { label: "Package page", cap: "A beautiful page that closes the sale — details, gallery, and a clear way to get in touch." },
    ],
  };
}

function ShowcaseScreen({ num, label, caption, children }: { num: string; label: string; caption: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
      <div style={{ marginTop: 18, textAlign: "center" }}>
        <div style={{ fontFamily: MONO, fontSize: 11, color: DA_GOLD, letterSpacing: -.2 }}>{num}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 21, fontWeight: 400, color: DA_INK1, letterSpacing: -.4, marginTop: 4 }}>{label}</div>
        <p style={{ margin: "7px auto 0", maxWidth: 300, fontFamily: SANS, fontSize: 14, color: DA_INK2, lineHeight: 1.5 }}>{caption}</p>
      </div>
    </div>
  );
}

function LandingShowcase({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = showcaseCopy(isAr);
  return (
    <div id="solution" style={{ padding: "80px 48px", background: DA_SURFACE2 }}>
      <div style={{ maxWidth: 1280, marginInline: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 52 }}>
          <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
          <h2 style={{ margin: "12px 0 0", fontFamily: DISPLAY, fontSize: 48, fontWeight: 400, color: DA_INK1, letterSpacing: -1.2, lineHeight: 1.05 }}>{L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span></h2>
          <p style={{ margin: "18px auto 0", maxWidth: 640, fontFamily: SANS, fontSize: 17, color: DA_INK2, lineHeight: 1.6 }}>{L.sub}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 28, alignItems: "start" }}>
          <ShowcaseScreen num="01" label={L.screens[0].label} caption={L.screens[0].cap}>
            <div style={{ width: "100%" }}><BrowserChrome url="maraya.travel" radius={12}><AgencyHomepageMini lang={lang} h={332} /></BrowserChrome></div>
          </ShowcaseScreen>
          <ShowcaseScreen num="02" label={L.screens[1].label} caption={L.screens[1].cap}>
            <div style={{ width: "100%" }}><BrowserChrome url="maraya.travel/packages" radius={12}><AgencyStorefrontMini lang={lang} h={332} /></BrowserChrome></div>
          </ShowcaseScreen>
          <ShowcaseScreen num="03" label={L.screens[2].label} caption={L.screens[2].cap}>
            <div style={{ width: 218, background: "#0d0a06", borderRadius: 22, padding: 9, boxShadow: "0 24px 60px -18px rgba(26,22,17,.3)" }}>
              <div style={{ background: "#faf5e8", borderRadius: 14, overflow: "hidden", height: 372 }}><AuroraMiniPage pkg={maltaPkg(isAr)} lang={lang} /></div>
            </div>
          </ShowcaseScreen>
        </div>
      </div>
    </div>
  );
}

function MobileLandingShowcase({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = showcaseCopy(isAr);
  const cap = (i: number) => (
    <div style={{ marginTop: 10, marginBottom: 22 }}>
      <div style={{ fontFamily: DISPLAY, fontSize: 17, color: DA_INK1 }}>{L.screens[i].label}</div>
      <div style={{ fontFamily: SANS, fontSize: 13.5, color: DA_INK2, marginTop: 3, lineHeight: 1.5 }}>{L.screens[i].cap}</div>
    </div>
  );
  return (
    <div id="solution" style={{ padding: "40px 18px", background: DA_SURFACE2 }}>
      <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
      <h2 style={{ margin: "10px 0 22px", fontFamily: DISPLAY, fontSize: 26, fontWeight: 400, color: DA_INK1, letterSpacing: -.7, lineHeight: 1.1 }}>{L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span></h2>
      <BrowserChrome url="maraya.travel" radius={12}><AgencyHomepageMini lang={lang} h={300} /></BrowserChrome>
      {cap(0)}
      <BrowserChrome url="maraya.travel/packages" radius={12}><AgencyStorefrontMini lang={lang} h={300} /></BrowserChrome>
      {cap(1)}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <div style={{ width: 220, background: "#0d0a06", borderRadius: 20, padding: 9, boxShadow: "0 24px 60px -18px rgba(26,22,17,.3)" }}>
          <div style={{ background: "#faf5e8", borderRadius: 13, overflow: "hidden", height: 380 }}><AuroraMiniPage pkg={maltaPkg(isAr)} lang={lang} /></div>
        </div>
      </div>
      {cap(2)}
    </div>
  );
}

// ── Pillars ──────────────────────────────────────────────────────────────────

function LandingPillars({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = isAr ? {
    eyebrow: "لماذا باكميتركس",
    title: "مصمّم لوكالات السفر،",
    titleAccent: "ليس أداةً عامة.",
    sub: "خمسة أشياء تحصل عليها من اليوم الأول — لا إضافات، لا أكواد.",
    cards: [
      { title: "نطاقك الخاص", body: "موقعك على tours.your-agency.com بشهادة SSL تلقائية — لا على نطاق باكميتركس. سجلّ CNAME واحد فقط." },
      { title: "ثنائي اللغة عربي/إنجليزي", body: "RTL حقيقي — ليس ترجمة آلية. طباعة عربية سليمة، وكلتا اللغتين بنفس العناية." },
      { title: "شارك في أي مكان", body: "شارك أي صفحة عبر واتساب أو إنستغرام أو رابط مباشر — وكل عميل مهتمّ يصل إلى صندوقك." },
      { title: "عشرة قوالب", body: "لكل نوع رحلة قالب. عاينها بمحتواك الحقيقي، واختر بعينيك، وخصّص كل شيء." },
      { title: "صفحة رئيسية معيارية", body: "فعّل، رتّب، وحرّر أقسام صفحتك الرئيسية — وتُعاد المعاينة فوراً. لا قوالب جامدة." },
    ],
  } : {
    eyebrow: "Why Packmetrix",
    title: "Designed for travel agencies,",
    titleAccent: "not a generic tool.",
    sub: "Five things you get from day one — no add-ons, no code.",
    cards: [
      { title: "Your own domain", body: "Your site at tours.your-agency.com with SSL provisioned automatically — not on packmetrix.com. One CNAME record." },
      { title: "Bilingual EN/AR (RTL)", body: "Real right-to-left — not machine-translated. Proper Arabic typography, with both languages given the same care." },
      { title: "Share anywhere", body: "Share any page via WhatsApp, Instagram, or a direct link — and every enquiry lands in your inbox with full context." },
      { title: "Ten templates", body: "A template for every kind of trip. Preview with your real content, pick by sight, and customise everything." },
      { title: "Modular homepage", body: "Toggle, reorder, and edit your homepage sections — the preview rebuilds instantly. No rigid layout." },
    ],
  };
  const icons = [<GlobeSVG key="g" size={18} />, <TypeSVG key="t" size={18} />, <LinkSVG key="l" size={18} />, <ImgSVG key="i" size={18} />, <HomeSVG key="h" size={18} />];
  return (
    <div id="features" style={{ padding: "80px 48px", background: DA_BG }}>
      <div style={{ maxWidth: 1280, marginInline: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
          <h2 style={{ margin: "12px 0 0", fontFamily: DISPLAY, fontSize: 48, fontWeight: 400, color: DA_INK1, letterSpacing: -1.2, lineHeight: 1.05 }}>{L.title}<br /><span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span></h2>
          <p style={{ margin: "18px auto 0", maxWidth: 600, fontFamily: SANS, fontSize: 17, color: DA_INK2, lineHeight: 1.6 }}>{L.sub}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {L.cards.map((c, i) => (
            <div key={i} style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14, padding: 28, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: DA_GOLD_SOFT, color: DA_GOLD, display: "flex", alignItems: "center", justifyContent: "center" }}>{icons[i]}</div>
              <h3 style={{ margin: "4px 0 0", fontFamily: DISPLAY, fontSize: 22, fontWeight: 400, color: DA_INK1, letterSpacing: -.4, lineHeight: 1.15 }}>{c.title}</h3>
              <p style={{ margin: 0, fontFamily: SANS, fontSize: 16, color: DA_INK2, lineHeight: 1.6 }}>{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MobileLandingPillars({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = isAr ? {
    eyebrow: "لماذا باكميتركس", title: "مصمّم لوكالات السفر،", titleAccent: "ليس أداةً عامة.",
    cards: [
      { eyebrow: "٠١ · النطاق", title: "نطاقك بشهادة SSL", body: "tours.your-agency.com — لا packmetrix. CNAME واحد فقط." },
      { eyebrow: "٠٢ · اللغة", title: "عربي/إنجليزي · RTL حقيقي", body: "طباعة عربية سليمة، وكلتا اللغتين بنفس العناية. ليس ترجمة آلية." },
      { eyebrow: "٠٣ · المشاركة", title: "شارك في أي مكان", body: "شارك أي صفحة عبر واتساب أو إنستغرام أو رابط — والعملاء يصلون صندوقك." },
      { eyebrow: "٠٤ · القوالب", title: "عشرة قوالب بصرية", body: "قالب لكل نوع رحلة. اختر بعينيك وخصّص كل شيء." },
      { eyebrow: "٠٥ · الرئيسية", title: "صفحة رئيسية معيارية", body: "فعّل، رتّب، وحرّر أقسامك — والمعاينة تُعاد فوراً." },
    ],
  } : {
    eyebrow: "Why Packmetrix", title: "Designed for travel agencies,", titleAccent: "not a generic tool.",
    cards: [
      { eyebrow: "01 · Domain", title: "Your own domain, SSL auto", body: "tours.your-agency.com — not packmetrix. One CNAME, we provision SSL." },
      { eyebrow: "02 · Bilingual", title: "English + Arabic, real RTL", body: "Proper RTL typography, not machine-translated. Both languages, same care." },
      { eyebrow: "03 · Share", title: "Share anywhere", body: "Share any page via WhatsApp, Instagram, or a link — enquiries land in your inbox." },
      { eyebrow: "04 · Templates", title: "Ten visual templates", body: "A template for every kind of trip. Pick by sight, customise everything." },
      { eyebrow: "05 · Homepage", title: "Modular homepage", body: "Toggle, reorder, edit your homepage sections — preview rebuilds live." },
    ],
  };
  const icons = [<GlobeSVG key="g" size={16} />, <TypeSVG key="t" size={16} />, <WASvg key="w" size={16} />, <ImgSVG key="i" size={16} />, <HomeSVG key="h" size={16} />];
  return (
    <div id="features" style={{ padding: "44px 18px", background: DA_BG }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
        <h2 style={{ margin: "10px 0 0", fontFamily: DISPLAY, fontSize: 28, fontWeight: 400, color: DA_INK1, letterSpacing: -.8, lineHeight: 1.05 }}>{L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span></h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {L.cards.map((c, i) => (
          <div key={i} style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 12, padding: 18, display: "flex", gap: 12 }}>
            <div style={{ width: 34, height: 34, borderRadius: 8, background: DA_GOLD_SOFT, color: DA_GOLD, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{icons[i]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: DA_GOLD }}>{c.eyebrow}</div>
              <h3 style={{ margin: "4px 0 0", fontFamily: DISPLAY, fontSize: 17, fontWeight: 400, color: DA_INK1, letterSpacing: -.3, lineHeight: 1.2 }}>{c.title}</h3>
              <p style={{ margin: "6px 0 0", fontFamily: SANS, fontSize: 15, color: DA_INK2, lineHeight: 1.55 }}>{c.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── How it works (real product screenshots) ─────────────────────────────────

function ShotFrame({ url, height, children }: { url: string; height: number; children: React.ReactNode }) {
  return (
    <div style={{ background: "#0d0a06", borderRadius: 12, overflow: "hidden", boxShadow: "0 24px 60px -24px rgba(26,22,17,.30), 0 8px 24px -12px rgba(26,22,17,.12)", border: "1px solid rgba(26,22,17,.08)" }}>
      <div style={{ background: "#1a1410", padding: "9px 13px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ display: "flex", gap: 5 }}>{["#ff5f56", "#ffbd2e", "#27c93f"].map(c => <div key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />)}</div>
        <div style={{ flex: 1, marginInlineStart: 6, padding: "3px 10px", background: "rgba(255,255,255,.06)", borderRadius: 5, fontFamily: MONO, fontSize: 10, color: "rgba(255,255,255,.6)", letterSpacing: -0.2, display: "flex", alignItems: "center", gap: 5, direction: "ltr" }}>
          <span style={{ color: DA_GOLD, display: "inline-flex" }}><LinkSVG size={9} /></span>{url}
        </div>
      </div>
      <div style={{ background: DA_BG, height, overflow: "hidden" }}>{children}</div>
    </div>
  );
}

function ShotPaste({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  return (
    <ShotFrame url="packmetrix.com/builder" height={300}>
      <div dir={isAr ? "rtl" : "ltr"} style={{ padding: 18, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.3, textTransform: "uppercase", color: DA_GOLD, marginBottom: 4 }}>{isAr ? "باقة جديدة · ١ من ٤" : "New package · 1 of 4"}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 400, color: DA_INK1, letterSpacing: -.4, marginBottom: 12 }}>{isAr ? "ألصق نص باقتك" : "Paste your package text"}</div>
        <div style={{ flex: 1, background: DA_SURFACE2, border: `1px solid ${DA_RULE2}`, borderRadius: 9, padding: 13, fontFamily: SANS, fontSize: 12, color: DA_INK1, lineHeight: 1.7, position: "relative", overflow: "hidden" }}>
          {isAr ? (
            <div style={{ direction: "rtl", textAlign: "right" }}>
              رحلة العائلة إلى الغارفي 🌅 من أمستردام<br />
              ٥ ليالٍ — فندق ٤ نجوم + سيارة<br />
              <span style={{ direction: "ltr", display: "inline-block", unicodeBidi: "isolate" }}>Algarve family escape · 5 nights</span><br />
              يشمل الطيران والإقامة والتنقلات والجولات<br />
              من ١٬٤٢٠ € للفرد · الأطفال خصم ٢٥٪
            </div>
          ) : (
            <div style={{ direction: "ltr", textAlign: "left" }}>
              Algarve family escape 🌅 from Amsterdam<br />
              5 nights — 4-star hotel + car with driver<br />
              Includes flights, accommodation, transfers, and coast tours<br />
              From €1,420 per person · kids 25% off
            </div>
          )}
          <span style={{ display: "inline-block", width: 1.5, height: 13, background: DA_GOLD, verticalAlign: "middle", marginInlineStart: 2, animation: "pm-cursor 1.1s steps(1) infinite" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 12 }}>
          <div style={{ padding: "9px 16px", background: DA_GOLD, color: "#fff", borderRadius: 8, fontFamily: SANS, fontSize: 12.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}><SparkSVG size={13} />{isAr ? "استخراج بالذكاء الاصطناعي" : "Extract with AI"}</div>
          <span style={{ fontFamily: SANS, fontSize: 11.5, color: DA_INK3 }}>{isAr ? "أو املأ يدوياً" : "or fill in manually"}</span>
        </div>
      </div>
    </ShotFrame>
  );
}

function ShotStructured({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const fields: [string, string][] = isAr ? [
    ["الوجهة", "الغارفي، البرتغال"], ["نوع الرحلة", "عائلي"], ["عدد الليالي", "٥"],
    ["السعر للفرد", "١٬٤٢٠ €"], ["الإقامة", "فندق ٤ نجوم"], ["النقل", "سيارة مع سائق"],
  ] : [
    ["Destination", "Algarve, Portugal"], ["Trip type", "Family"], ["Nights", "5"],
    ["Price / person", "€1,420"], ["Stay", "4-star hotel"], ["Transport", "Car with driver"],
  ];
  const chips = isAr ? ["الطيران", "الإقامة", "التنقلات", "جولات ساحلية", "خصم الأطفال ٢٥٪"] : ["Flights", "Hotel", "Transfers", "Coast tours", "Kids −25%"];
  return (
    <ShotFrame url="packmetrix.com/builder" height={300}>
      <div dir={isAr ? "rtl" : "ltr"} style={{ padding: 18, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.3, textTransform: "uppercase", color: DA_GOLD, marginBottom: 4 }}>{isAr ? "مراجعة · ٢ من ٤" : "Review · 2 of 4"}</div>
            <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 400, color: DA_INK1, letterSpacing: -.4 }}>{isAr ? "راجِع وعدّل الحقول" : "Review & edit the fields"}</div>
          </div>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px", background: DA_GREEN_SOFT, color: DA_GREEN, borderRadius: 999, fontFamily: SANS, fontSize: 10.5, fontWeight: 600 }}><SparkSVG size={10} />{isAr ? "عُبّئت تلقائياً" : "Auto-filled"}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          {fields.map(([k, v], i) => (
            <div key={i} style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 8, padding: "8px 10px" }}>
              <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: .6, textTransform: "uppercase", color: DA_INK3 }}>{k}</div>
              <div style={{ fontFamily: SANS, fontSize: 12.5, fontWeight: 500, color: DA_INK1, marginTop: 3 }}>{v}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: .6, textTransform: "uppercase", color: DA_INK3, marginBottom: 7 }}>{isAr ? "يشمل" : "Includes"}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {chips.map((c, i) => (
              <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "4px 9px", background: DA_SURFACE, border: `1px solid ${DA_RULE2}`, borderRadius: 999, fontFamily: SANS, fontSize: 11, color: DA_INK1 }}><span style={{ color: DA_GOLD }}>✓</span>{c}</span>
            ))}
          </div>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <div style={{ padding: "8px 15px", background: DA_GOLD, color: "#fff", borderRadius: 8, fontFamily: SANS, fontSize: 12, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>{isAr ? "متابعة" : "Continue"}<ArrowSVG size={12} /></div>
        </div>
      </div>
    </ShotFrame>
  );
}

function ShotTemplates({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const ids = ["family", "aurora", "sakina", "pulse", "petal", "tribe"];
  const selected = "family";
  return (
    <ShotFrame url="packmetrix.com/builder" height={300}>
      <div dir={isAr ? "rtl" : "ltr"} style={{ padding: 18, height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.3, textTransform: "uppercase", color: DA_GOLD, marginBottom: 4 }}>{isAr ? "القالب · ٣ من ٤" : "Template · 3 of 4"}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 20, fontWeight: 400, color: DA_INK1, letterSpacing: -.4, marginBottom: 12 }}>{isAr ? "اختر القالب بعينيك" : "Choose a template by sight"}</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, flex: 1 }}>
          {ids.map(id => {
            const Render = MINI_RENDERS[id];
            const tpl = TEMPLATES.find(x => x.id === id);
            const isSel = id === selected;
            return (
              <div key={id} style={{ borderRadius: 8, overflow: "hidden", border: `1.5px solid ${isSel ? DA_GOLD : DA_RULE}`, boxShadow: isSel ? `0 0 0 3px ${DA_GOLD_SOFT}` : "none", background: DA_SURFACE, display: "flex", flexDirection: "column" }}>
                <div style={{ height: 92, overflow: "hidden", position: "relative" }}>
                  <div style={{ position: "absolute", inset: 0 }}>{Render ? <Render isAr={isAr} /> : null}</div>
                </div>
                <div style={{ padding: "5px 8px", display: "flex", alignItems: "center", justifyContent: "space-between", borderTop: `1px solid ${DA_RULE}` }}>
                  <span style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, color: DA_INK1 }}>{tpl ? tpl.name : id}</span>
                  {isSel && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: SANS, fontSize: 9, fontWeight: 600, color: DA_GOLD }}><CheckSVG size={9} />{isAr ? "مختار" : "Picked"}</span>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </ShotFrame>
  );
}

function ShotPublished({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const pkg = familyPkg(isAr);
  return (
    <div style={{ position: "relative", display: "flex", justifyContent: "center", paddingBlock: 6 }}>
      <div style={{ width: 232, background: "#0d0a06", borderRadius: 22, padding: 10, boxShadow: "0 24px 60px -18px rgba(26,22,17,.32), 0 8px 20px -8px rgba(26,22,17,.16)" }}>
        <div style={{ background: "#faf5e8", borderRadius: 14, overflow: "hidden", height: 388 }}><AuroraMiniPage pkg={pkg} lang={lang} /></div>
      </div>
      <div style={{ position: "absolute", top: 0, insetInlineStart: isAr ? "auto" : 8, insetInlineEnd: isAr ? 8 : "auto", background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 9, padding: "7px 11px", boxShadow: "0 12px 28px -12px rgba(26,22,17,.25)", display: "flex", alignItems: "center", gap: 7, fontFamily: MONO, fontSize: 10, color: DA_INK1, letterSpacing: -.2 }}>
        <span style={{ width: 7, height: 7, borderRadius: "50%", background: DA_GREEN }} /><span style={{ direction: "ltr" }}>maraya.travel/algarve</span>
      </div>
      <div style={{ position: "absolute", bottom: 6, insetInlineEnd: isAr ? "auto" : 0, insetInlineStart: isAr ? 0 : "auto", background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 11, padding: "11px 14px", boxShadow: "0 16px 36px -14px rgba(26,22,17,.3)", display: "flex", gap: 16 }}>
        {[{ v: "1,284", l: isAr ? "مشاهدة" : "views" }, { v: "+23", l: isAr ? "عميل" : "leads", gold: true }].map((s, i) => (
          <div key={i}>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, fontWeight: 400, color: s.gold ? DA_GOLD : DA_INK1, letterSpacing: -.5, lineHeight: 1 }}>{s.v}</div>
            <div style={{ fontFamily: SANS, fontSize: 9, color: DA_INK3, marginTop: 3, letterSpacing: .4, textTransform: "uppercase" }}>{s.l}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const HOW_SHOTS: Array<(p: { lang: "en" | "ar" }) => React.JSX.Element> = [ShotPaste, ShotStructured, ShotTemplates, ShotPublished];

function howCopy(isAr: boolean) {
  return isAr ? {
    eyebrow: "كيف يعمل",
    title: "من باقة ملصقة إلى",
    titleAccent: "موقع متكامل بهويتك.",
    sub: "أربع خطوات. لا أكواد، لا مصمم. هذه لقطات حقيقية من المنتج.",
    steps: [
      { title: "ألصق باقة", body: "ألصق العرض كما ترسله لعميلك تماماً — عربي، إنجليزي، أو الاثنين. مع الرموز وكل شيء." },
      { title: "يُهيكلها الذكاء الاصطناعي", body: "يقرأها باكميتركس ويملأ كل حقل: الوجهة، الليالي، السعر، الفندق، وما يشمله. عدّل أي شيء بنقرة." },
      { title: "موقعك كاملاً، بهويتك", body: "الرئيسية والمتجر وصفحات الباقات — كلها بألوانك وخطوطك. اختر قالباً ورتّب أقسام صفحتك الرئيسية." },
      { title: "شارك في أي مكان وتتبّع", body: "انشر على نطاقك الخاص، ثم شارك الرابط في أي مكان — إنستغرام أو رسالة أو رابط — وشاهد المشاهدات والعملاء في صندوقك مباشرة." },
    ],
  } : {
    eyebrow: "How it works",
    title: "From a pasted package to a",
    titleAccent: "complete branded site.",
    sub: "Four steps. No code, no designer. These are real screenshots from the product.",
    steps: [
      { title: "Paste a package", body: "Paste the offer exactly as you'd send it to a client — Arabic, English, or both. Emojis and all." },
      { title: "AI structures it", body: "Packmetrix reads it and fills every field: destination, nights, price, hotel, inclusions. Edit anything in a tap." },
      { title: "Your whole site, branded", body: "Homepage, storefront, and package pages — all themed by your colours and fonts. Pick a template and arrange your homepage sections." },
      { title: "Share anywhere & track", body: "Publish to your own domain, then share the link anywhere — Instagram, a message, a link in bio — and watch views and leads land in your inbox in real time." },
    ],
  };
}

function LandingHowItWorks({ lang }: { lang: "en" | "ar" }) {
  const L = howCopy(lang === "ar");
  return (
    <div id="how" style={{ padding: "80px 48px", background: DA_BG }}>
      <div style={{ maxWidth: 1180, marginInline: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
          <h2 style={{ margin: "12px 0 0", fontFamily: DISPLAY, fontSize: 48, fontWeight: 400, color: DA_INK1, letterSpacing: -1.2, lineHeight: 1.05 }}>{L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span></h2>
          <p style={{ margin: "18px auto 0", maxWidth: 520, fontFamily: SANS, fontSize: 17, color: DA_INK2, lineHeight: 1.6 }}>{L.sub}</p>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 40 }}>
          {L.steps.map((s, i) => {
            const Shot = HOW_SHOTS[i];
            const shotFirst = i % 2 === 0;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 48, flexDirection: shotFirst ? "row" : "row-reverse" }}>
                <div style={{ flex: "0 0 52%", maxWidth: "52%" }}><Shot lang={lang} /></div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
                    <div style={{ width: 40, height: 40, borderRadius: "50%", background: DA_INK1, color: DA_GOLD, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 17, fontWeight: 400 }}>{`0${i + 1}`}</div>
                    <h3 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 28, fontWeight: 400, color: DA_INK1, letterSpacing: -.6, lineHeight: 1.1 }}>{s.title}</h3>
                  </div>
                  <p style={{ margin: 0, paddingInlineStart: 54, fontFamily: SANS, fontSize: 17, color: DA_INK2, lineHeight: 1.6, maxWidth: 440 }}>{s.body}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function MobileLandingHowItWorks({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = isAr ? {
    eyebrow: "كيف يعمل", title: "من نصّ إلى موقع متكامل", titleAccent: "في دقائق.",
    steps: [
      { title: "ألصق باقة", body: "ألصق أي باقة من واتساب أو إنستغرام — عربي أو إنجليزي أو الاثنين." },
      { title: "يُهيكلها الذكاء الاصطناعي", body: "نستخرج كل حقل كمحتوى منظّم قابل للتعديل." },
      { title: "موقعك بهويتك", body: "الرئيسية والمتجر وصفحات الباقات — بألوانك وخطوطك." },
      { title: "شارك في أي مكان", body: "انشر على نطاقك، شارك الرابط في أي مكان، وتتبّع كل عميل." },
    ],
  } : {
    eyebrow: "How it works", title: "From a paste to a whole site", titleAccent: "in minutes.",
    steps: [
      { title: "Paste a package", body: "Paste any package from WhatsApp or Instagram — Arabic, English, or both." },
      { title: "AI structures it", body: "We extract every field into clean, editable content." },
      { title: "Your branded site", body: "Homepage, storefront, and package pages — themed by your brand." },
      { title: "Share anywhere", body: "Publish to your domain, share the link anywhere, and track every lead." },
    ],
  };
  return (
    <div id="how" style={{ padding: "44px 18px", background: DA_BG }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
        <h2 style={{ margin: "10px 0 0", fontFamily: DISPLAY, fontSize: 28, fontWeight: 400, color: DA_INK1, letterSpacing: -.8, lineHeight: 1.05 }}>{L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span></h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
        {L.steps.map((s, i) => {
          const Shot = HOW_SHOTS[i];
          return (
            <div key={i}>
              <Shot lang={lang} />
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginTop: 14 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: DA_INK1, color: DA_GOLD, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 13, fontWeight: 400 }}>{`0${i + 1}`}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3 style={{ margin: 0, fontFamily: DISPLAY, fontSize: 18, fontWeight: 400, color: DA_INK1, letterSpacing: -.3, lineHeight: 1.2 }}>{s.title}</h3>
                  <p style={{ margin: "5px 0 0", fontFamily: SANS, fontSize: 15, color: DA_INK2, lineHeight: 1.55 }}>{s.body}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Template showcase ────────────────────────────────────────────────────────

function TemplateShowcase({ lang, mobile }: { lang: "en" | "ar"; mobile?: boolean }) {
  const isAr = lang === "ar";
  const L = isAr
    ? { eyebrow: "القوالب", title: "اختر الشكل الذي يناسب", titleAccent: "نوع الرحلة.", sub: "عشرة قوالب — لكل قالب شخصية بصرية واضحة وحالة استخدام محددة. ابدأ من قالب، خصّص كل شيء.", seeAll: "استعرض القوالب العشرة" }
    : { eyebrow: "Templates", title: "Pick the look that fits", titleAccent: "the trip.", sub: "Ten templates — each with a clear visual personality and a specific use case. Start from one, customise everything.", seeAll: "See all 10 templates" };
  const showcased = TEMPLATES.slice(0, mobile ? 4 : 5);
  const gridCols = mobile ? "1fr 1fr" : "repeat(5, 1fr)";
  return (
    <div id="templates" style={{ padding: mobile ? "44px 18px" : "80px 48px", background: DA_SURFACE2 }}>
      <div style={{ maxWidth: mobile ? undefined : 1280, marginInline: "auto" }}>
        <div style={{ display: mobile ? "block" : "flex", alignItems: mobile ? undefined : "flex-end", justifyContent: mobile ? undefined : "space-between", marginBottom: mobile ? 22 : 36, gap: 24 }}>
          <div style={{ maxWidth: mobile ? undefined : 560 }}>
            <div style={{ fontFamily: SANS, fontSize: mobile ? 10 : 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
            <h2 style={{ margin: "10px 0 0", fontFamily: DISPLAY, fontSize: mobile ? 26 : 44, fontWeight: 400, color: DA_INK1, letterSpacing: mobile ? -0.7 : -1, lineHeight: 1.1 }}>{L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span></h2>
            {!mobile && <p style={{ margin: "16px 0 0", fontFamily: SANS, fontSize: 17, color: DA_INK2, lineHeight: 1.6 }}>{L.sub}</p>}
          </div>
          {!mobile && <Link href="/templates" style={{ fontFamily: SANS, fontSize: 13.5, color: DA_GOLD, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer", textDecoration: "none", paddingBottom: 6 }}>{L.seeAll}<ArrowSVG size={14} /></Link>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: gridCols, gap: mobile ? 10 : 14 }}>
          {showcased.map(tpl => {
            const MiniRender = MINI_RENDERS[tpl.id];
            return (
              <div key={tpl.id} style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: mobile ? 10 : 12, overflow: "hidden" }}>
                <div style={{ height: mobile ? 120 : 160, overflow: "hidden" }}>{MiniRender ? <MiniRender isAr={isAr} /> : null}</div>
                <div style={{ padding: mobile ? "8px 10px" : "10px 12px" }}>
                  <div style={{ fontFamily: DISPLAY, fontSize: mobile ? 13 : 14, color: DA_INK1, fontWeight: 400, letterSpacing: -0.2 }}>{isAr ? tpl.nameAr : tpl.name}</div>
                  <div style={{ fontFamily: SANS, fontSize: mobile ? 10 : 11, color: DA_INK3, marginTop: 2 }}>{isAr ? tpl.targetAr : tpl.target}</div>
                </div>
              </div>
            );
          })}
        </div>
        {mobile && <Link href="/templates" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 18, padding: "10px 0", fontFamily: SANS, fontSize: 13, color: DA_GOLD, fontWeight: 500, cursor: "pointer", textDecoration: "none" }}>{L.seeAll}<ArrowSVG size={13} /></Link>}
      </div>
    </div>
  );
}

// ── Sample pages ─────────────────────────────────────────────────────────────

function exampleCover(kind: string): string {
  const grads: Record<string, string> = {
    santorini:  "linear-gradient(135deg, #4a8fb8 0%, #1f4a6e 100%)",
    sardinia:   "linear-gradient(135deg, #e0734a 0%, #b5371f 100%)",
    maldives:   "linear-gradient(135deg, #4ec5d4 0%, #1f6f8a 60%, #143a52 100%)",
    kyoto:      "linear-gradient(135deg, #b7657a 0%, #5e2a3c 100%)",
    algarve:    "linear-gradient(135deg, #c89a5a 0%, #8a5e2a 100%)",
    iceland:    "linear-gradient(135deg, #5a7da8 0%, #2a3a5e 100%)",
    cappadocia: "linear-gradient(135deg, #d4865a 0%, #864a26 100%)",
  };
  return grads[kind] ?? "linear-gradient(135deg, #5a6e9a 0%, #2a3a5e 100%)";
}

type ExampleItem = {
  kind: string; ar: boolean;
  destination: string; title: string; tag: string;
  price: string; was?: string; agency: string; lang: string;
  coverImage?: string; url?: string;
};

const DEMO_TEMPLATE_TAGS: Record<string, { en: string; ar: string }> = {
  sakina:  { en: "Cultural",    ar: "ثقافي"     },
  family:  { en: "Family",      ar: "عائلي"     },
  pulse:   { en: "Flash Promo", ar: "عروض فورية" },
  petal:   { en: "Honeymoon",   ar: "شهر عسل"   },
  aurora:  { en: "Luxury",      ar: "فاخر"      },
  tribe:   { en: "Group",       ar: "جماعي"     },
  compass: { en: "Adventure",   ar: "مغامرات"   },
  voyage:  { en: "Youth",       ar: "شباب"      },
  atlas:   { en: "Heritage",    ar: "تراثي"     },
  smart:   { en: "Budget",      ar: "اقتصادي"   },
};

async function fetchDemoPackages(lang: "en" | "ar"): Promise<ExampleItem[]> {
  const DEMO_EMAIL = "hello@packmetrix.com";
  let demoUserId: string | null = null;
  let agencyName = lang === "ar" ? "مرايا للأسفار" : "Maraya Journeys";
  try {
    const userSnap = await getDocs(query(collection(db, "users"), where("email", "==", DEMO_EMAIL)));
    if (!userSnap.empty) {
      demoUserId = userSnap.docs[0].id;
      agencyName = userSnap.docs[0].data().name || agencyName;
    }
  } catch { /* keep defaults */ }
  if (!demoUserId) return [];
  const snap = await getDocs(query(collection(db, "packages"), where("userId", "==", demoUserId), where("isDemo", "==", true)));
  const pkgs = snap.docs.map(d => ({ id: d.id, ...(d.data() as Record<string, unknown>) }))
    .filter((p) => ((p as { primaryLanguage?: string; language?: string }).primaryLanguage || (p as { language?: string }).language) === lang && (p as { status?: string }).status === "active");
  return pkgs.slice(0, 6).map((p) => {
    const pp = p as Record<string, unknown>;
    const tagObj = DEMO_TEMPLATE_TAGS[pp.templateId as string] ?? { en: "Travel", ar: "سفر" };
    const rawTitle = pp.title;
    const title = rawTitle && typeof rawTitle === "object"
      ? ((rawTitle as Record<string, string>)[lang] || (rawTitle as Record<string, string>).en || (rawTitle as Record<string, string>).ar || "")
      : String(rawTitle || "");
    return {
      kind: String(pp.templateId || "travel"),
      ar: lang === "ar",
      destination: String(pp.destination || ""),
      title,
      tag: tagObj[lang],
      price: String(pp.price || ""),
      was: (pp.priceWas as string) || undefined,
      agency: agencyName,
      lang: lang === "ar" ? "AR" : "EN",
      coverImage: (pp.coverImage as string) || undefined,
      url: pp.agencySlug && pp.id ? `/${pp.agencySlug}/${pp.id}` : undefined,
    };
  });
}

// Global sample data — illustrative example pages (not real agencies). Used as a
// fallback when the demo account has no published packages to show yet.
function exampleData(isAr: boolean): ExampleItem[] {
  return [
    { kind: "santorini", ar: false, destination: "Santorini, Greece", title: "Caldera views · 5 nights", tag: "Luxury", price: "€1,180", agency: "Maraya Journeys", lang: "EN" },
    { kind: "sardinia", ar: false, destination: "Sardinia, Italy", title: "Flash escape · Sardinia", tag: "Flash Promo", price: "€499", was: "€919", agency: "Levant Voyages", lang: "EN" },
    { kind: "maldives", ar: false, destination: "Maldives", title: "Just the two of you · 7 nights", tag: "Honeymoon", price: "€4,200 / couple", agency: "Cedar & Sea", lang: "EN" },
    { kind: "kyoto", ar: true, destination: isAr ? "كيوتو، اليابان" : "Kyoto, Japan", title: isAr ? "معابد وحدائق · ٦ ليالٍ" : "معابد وحدائق · ٦ ليالٍ", tag: isAr ? "ثقافي" : "Cultural", price: isAr ? "٢٬١٥٠ €" : "€2,150", agency: isAr ? "مرايا للأسفار" : "Maraya Journeys", lang: "AR" },
    { kind: "algarve", ar: true, destination: isAr ? "الغارفي، البرتغال" : "Algarve, Portugal", title: isAr ? "رحلة العائلة · ٥ ليالٍ" : "رحلة العائلة · ٥ ليالٍ", tag: isAr ? "عائلي" : "Family", price: isAr ? "١٬٤٢٠ €" : "€1,420", agency: isAr ? "مرايا للأسفار" : "Maraya Journeys", lang: "AR" },
    { kind: "iceland", ar: false, destination: "Iceland", title: "Ring road group trip · 7 nights", tag: "Group", price: "€1,990 / person", agency: "Tribe Travel Co.", lang: "EN" },
  ];
}

function ExampleCard({ ex, lang }: { ex: ExampleItem; lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const seeLive = isAr ? "تصفح الصفحة" : "View page";
  const comingSoon = isAr ? "قريباً" : "Coming soon";
  return (
    <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14, overflow: "hidden", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "relative", height: 168 }}>
        {ex.coverImage
          ? <img src={ex.coverImage} alt={ex.destination} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{ position: "absolute", inset: 0, background: exampleCover(ex.kind) }} />}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,.05) 0, rgba(255,255,255,.05) 1px, transparent 1px, transparent 9px)" }} />
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,.5) 100%)" }} />
        <div style={{ position: "absolute", top: 12, insetInlineStart: 12 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 9px", background: "rgba(13,10,6,.55)", color: "#fff", borderRadius: 999, fontFamily: SANS, fontSize: 10.5, fontWeight: 500, backdropFilter: "blur(8px)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: DA_GOLD }} />{ex.tag}
          </span>
        </div>
        <div style={{ position: "absolute", top: 12, insetInlineEnd: 12 }}>
          <span style={{ padding: "3px 8px", background: "rgba(13,10,6,.45)", color: "rgba(255,255,255,.92)", borderRadius: 999, fontFamily: MONO, fontSize: 9.5, fontWeight: 500, letterSpacing: .3, backdropFilter: "blur(8px)" }}>{ex.lang === "AR" ? (isAr ? "عربي" : "AR") : (isAr ? "إنجليزي" : "EN")}</span>
        </div>
        <div dir={ex.ar ? "rtl" : "ltr"} style={{ position: "absolute", insetInline: 14, bottom: 12 }}>
          <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: .8, textTransform: "uppercase", color: "rgba(255,255,255,.8)" }}>{ex.destination}</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 19, fontWeight: 400, color: "#fff", letterSpacing: -.3, lineHeight: 1.15, marginTop: 3, textShadow: "0 1px 12px rgba(0,0,0,.4)" }}>{ex.title}</div>
        </div>
      </div>
      <div dir={ex.ar ? "rtl" : "ltr"} style={{ padding: "13px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "baseline", gap: 7 }}>
            <span style={{ fontFamily: DISPLAY, fontSize: 18, color: DA_INK1, letterSpacing: -.3 }}>{ex.price}</span>
            {ex.was && <span style={{ fontFamily: SANS, fontSize: 12, color: DA_INK3, textDecoration: "line-through" }}>{ex.was}</span>}
          </div>
          <div style={{ fontFamily: SANS, fontSize: 11.5, color: DA_INK3, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ex.agency}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4, flexShrink: 0 }}>
          {!ex.url && <span style={{ padding: "2px 7px", background: DA_GOLD_SOFT, color: DA_GOLD_DEEP, borderRadius: 999, fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: .3 }}>{comingSoon}</span>}
          <a href={ex.url ?? "#"} target={ex.url ? "_blank" : undefined} rel={ex.url ? "noopener noreferrer" : undefined} onClick={ex.url ? undefined : e => e.preventDefault()} style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", background: DA_SURFACE2, border: `1px solid ${DA_RULE2}`, borderRadius: 8, fontFamily: SANS, fontSize: 12, fontWeight: 500, color: DA_INK1, textDecoration: "none", opacity: ex.url ? 1 : 0.45, pointerEvents: ex.url ? undefined : "none" }}>
            {seeLive}<span style={{ color: DA_GOLD, transform: ex.ar ? "scaleX(-1)" : "none", display: "inline-flex" }}><ArrowSVG size={12} /></span>
          </a>
        </div>
      </div>
    </div>
  );
}

function useExamples(lang: "en" | "ar"): ExampleItem[] {
  const [items, setItems] = useState<ExampleItem[] | null>(null);
  useEffect(() => {
    let active = true;
    fetchDemoPackages(lang)
      .then(r => { if (active) setItems(r.length ? r : exampleData(lang === "ar")); })
      .catch(() => { if (active) setItems(exampleData(lang === "ar")); });
    return () => { active = false; };
  }, [lang]);
  return items ?? exampleData(lang === "ar");
}

function examplesCopy(isAr: boolean) {
  return isAr ? {
    eyebrow: "صفحات نموذجية",
    title: "شاهد كيف ستبدو",
    titleAccent: "صفحاتك.",
    sub: "صفحات نموذجية مبنية بقوالب باكميتركس — اضغط أيّاً منها لرؤيتها مباشرة كما يراها المسافر.",
  } : {
    eyebrow: "Sample pages",
    title: "See what your",
    titleAccent: "pages could look like.",
    sub: "Example landing pages built with Packmetrix's templates — open any to see it live, exactly as a traveller would.",
  };
}

function LandingExamples({ lang }: { lang: "en" | "ar" }) {
  const data = useExamples(lang);
  const L = examplesCopy(lang === "ar");
  return (
    <div id="examples" style={{ padding: "80px 48px", background: DA_BG }}>
      <div style={{ maxWidth: 1280, marginInline: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
          <h2 style={{ margin: "12px 0 0", fontFamily: DISPLAY, fontSize: 48, fontWeight: 400, color: DA_INK1, letterSpacing: -1.2, lineHeight: 1.05 }}>{L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span></h2>
          <p style={{ margin: "18px auto 0", maxWidth: 560, fontFamily: SANS, fontSize: 17, color: DA_INK2, lineHeight: 1.6 }}>{L.sub}</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18 }}>
          {data.map((ex, i) => <ExampleCard key={i} ex={ex} lang={lang} />)}
        </div>
      </div>
    </div>
  );
}

function MobileLandingExamples({ lang }: { lang: "en" | "ar" }) {
  const data = useExamples(lang);
  const L = examplesCopy(lang === "ar");
  return (
    <div style={{ padding: "44px 18px", background: DA_BG }}>
      <div style={{ marginBottom: 22 }}>
        <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
        <h2 style={{ margin: "10px 0 0", fontFamily: DISPLAY, fontSize: 28, fontWeight: 400, color: DA_INK1, letterSpacing: -.8, lineHeight: 1.05 }}>{L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span></h2>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {data.map((ex, i) => <ExampleCard key={i} ex={ex} lang={lang} />)}
      </div>
    </div>
  );
}

// ── Pricing — Founding + Standard ────────────────────────────────────────────

function PlanCard({ lang, featured, badge, name, price, perMonth, sub, cta, note, spotsLine, fillPct, device }: {
  lang: "en" | "ar"; featured?: boolean; badge: string; name: string; price: string; perMonth: string;
  sub: string; cta: string; note: string; spotsLine?: string; fillPct?: number; device: "desktop" | "mobile";
}) {
  return (
    <div style={{ flex: 1, background: DA_SURFACE, border: `1px solid ${featured ? DA_GOLD : DA_RULE}`, borderRadius: 18, overflow: "hidden", boxShadow: featured ? "0 1px 2px rgba(26,22,17,.04), 0 32px 64px -32px rgba(176,138,62,.25)" : "0 1px 2px rgba(26,22,17,.03)" }}>
      {featured && spotsLine && (
        <div style={{ background: DA_GOLD_SOFT, padding: "11px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, borderBottom: "1px solid rgba(176,138,62,.25)" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontFamily: SANS, fontSize: 12, fontWeight: 600, color: DA_GOLD_DEEP }}>
            <span style={{ position: "relative", width: 8, height: 8 }}>
              <span style={{ position: "absolute", inset: 0, borderRadius: "50%", background: DA_GOLD }} />
              <span style={{ position: "absolute", inset: -3, borderRadius: "50%", background: DA_GOLD, opacity: .3, animation: "pm-pulse 1.6s ease-out infinite" }} />
            </span>
            {spotsLine}
          </div>
          <div style={{ flex: 1, maxWidth: 130, height: 6, background: "rgba(176,138,62,.18)", borderRadius: 999, overflow: "hidden" }}>
            <div style={{ width: `${Math.max(2, Math.min(100, fillPct ?? 2))}%`, height: "100%", background: DA_GOLD, borderRadius: 999 }} />
          </div>
        </div>
      )}
      <div style={{ padding: 28 }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 10px", borderRadius: 999, background: featured ? DA_GOLD : DA_SURFACE2, color: featured ? "#fff" : DA_INK2, border: featured ? "none" : `1px solid ${DA_RULE2}`, fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase" }}>{featured && <SparkSVG size={10} />}{badge}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 28, fontWeight: 400, color: DA_INK1, marginTop: 14, letterSpacing: -.6, lineHeight: 1 }}>{name}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 5, marginTop: 12 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 56, fontWeight: 400, color: DA_INK1, letterSpacing: -1.8, lineHeight: .9 }}>{price}</div>
          <div style={{ fontFamily: SANS, fontSize: 14, color: DA_INK3 }}>{perMonth}</div>
        </div>
        <div style={{ fontFamily: SANS, fontSize: 13, color: DA_INK2, marginTop: 8, minHeight: 36, lineHeight: 1.45 }}>{sub}</div>
        <a href={`${AGENCY_URL}/signup`} onClick={() => posthog.capture("cta_clicked", { cta: "signup", location: `pricing_${featured ? "founding" : "standard"}`, lang, device })} style={{ width: "100%", marginTop: 18, padding: "13px 0", background: featured ? DA_GOLD : DA_INK1, color: featured ? "#fff" : DA_BG, border: "none", borderRadius: 10, fontFamily: SANS, fontSize: 14, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", textDecoration: "none", boxSizing: "border-box", boxShadow: featured ? "0 1px 2px rgba(0,0,0,.06), 0 12px 28px -10px rgba(176,138,62,.45), inset 0 1px 0 rgba(255,255,255,.18)" : "none" }}>{cta}<ArrowSVG size={14} /></a>
        <div style={{ marginTop: 10, textAlign: "center", fontFamily: SANS, fontSize: 11.5, color: DA_INK3 }}>{note}</div>
      </div>
    </div>
  );
}

// One plan, shown dynamically: Founding (€39, locked for life, with live spot
// count + "€79/mo after") while founding spots remain — and it automatically
// becomes the Standard (€79) plan once the founding count is consumed.
function pricingCopy(isAr: boolean, spotsRemaining: number | null) {
  const founding = spotsRemaining === null || spotsRemaining > 0;
  const remaining = spotsRemaining ?? 50;
  const fillPct = spotsRemaining === null ? 4 : Math.round(((50 - remaining) / 50) * 100);
  const spotsLine = spotsRemaining === null
    ? (isAr ? "أماكن التأسيس محدودة" : "Limited founding spots")
    : (isAr ? `${remaining} من ٥٠ مكاناً متبقٍّ` : `${remaining} of 50 founding spots left`);

  const base = isAr ? {
    eyebrow: "الأسعار",
    title: founding ? "خطّة واحدة، بسعر الإطلاق." : "خطّة واحدة، بسيطة.",
    titleAccent: "ابدأ بتجربة ١٤ يوماً.",
    cta: "ابدأ التجربة المجانية",
    note: "تجربة ١٤ يوم · بدون بطاقة ائتمان · إلغاء في أي وقت",
    includedHead: "كل المزايا مشمولة",
    items: ["صفحة رئيسية ومتجر بهويتك", "صفحات باقات غير محدودة", "كل القوالب العشرة", "نطاق مخصص بشهادة SSL", "ثنائي اللغة (عربي/إنجليزي · RTL)", "صندوق عملاء لكل القنوات", "أقسام رئيسية معيارية", "محرر محتوى بالذكاء الاصطناعي", "تصدير العملاء (CSV)"],
    demoPre: "لست مستعدّاً بعد؟", demoLink: "احجز عرضاً توضيحياً أولاً",
  } : {
    eyebrow: "Pricing",
    title: founding ? "One plan, at launch price." : "One simple plan.",
    titleAccent: "Start with a 14-day trial.",
    cta: "Start free trial",
    note: "14-day trial · no credit card · cancel anytime",
    includedHead: "Everything included",
    items: ["Branded homepage + storefront", "Unlimited package pages", "All 10 templates", "Custom domain + SSL", "Bilingual EN/AR (RTL)", "Lead inbox for every channel", "Modular homepage sections", "AI-powered content writing", "Lead export (CSV)"],
    demoPre: "Not ready?", demoLink: "Book a demo first",
  };

  const sub = isAr
    ? (founding
      ? "أوّل ٥٠ وكالة تشترك بسعر التأسيس ٣٩ €/شهر — ويبقى ثابتاً مدى الحياة. بعد نفاد المقاعد ينضمّ الجميع بسعر ٧٩ €/شهر."
      : "انتهى عرض التأسيس — نفس المنتج الكامل لكل الوكالات بسعر ٧٩ €/شهر.")
    : (founding
      ? "The first 50 agencies lock in the founding price of €39/mo — for life. Once the spots are gone, everyone joins at €79/mo."
      : "The founding offer has ended — the same complete product for every agency at €79/mo.");

  const plan = founding
    ? (isAr
      ? { badge: "التأسيس · ٥٠ مكاناً", name: "التأسيس", price: "€39", per: "/شهر", planSub: "لأوّل ٥٠ وكالة — ثابت مدى الحياة ما دمت مشتركاً. بعدها ٧٩ €/شهر.", spotsLine, fillPct }
      : { badge: "Founding · 50 spots", name: "Founding", price: "€39", per: "/mo", planSub: "For the first 50 agencies — locked for life, as long as you stay. €79/mo after.", spotsLine, fillPct })
    : (isAr
      ? { badge: "قياسي", name: "القياسي", price: "€79", per: "/شهر", planSub: "نفس المنتج الكامل لكل الوكالات الجديدة.", spotsLine: undefined, fillPct: undefined }
      : { badge: "Standard", name: "Standard", price: "€79", per: "/mo", planSub: "The same complete product for every new agency.", spotsLine: undefined, fillPct: undefined });

  return { ...base, sub, founding, plan };
}

function LandingPricing({ lang, spotsRemaining }: { lang: "en" | "ar"; spotsRemaining: number | null }) {
  const L = pricingCopy(lang === "ar", spotsRemaining);
  return (
    <div id="pricing" style={{ padding: "80px 48px", background: DA_BG }}>
      <div style={{ maxWidth: 1040, marginInline: "auto" }}>
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
          <h2 style={{ margin: "12px 0 0", fontFamily: DISPLAY, fontSize: 48, fontWeight: 400, color: DA_INK1, letterSpacing: -1.2, lineHeight: 1.05 }}>{L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span></h2>
          <p style={{ margin: "18px auto 0", maxWidth: 600, fontFamily: SANS, fontSize: 17, color: DA_INK2, lineHeight: 1.6 }}>{L.sub}</p>
        </div>
        <div style={{ maxWidth: 460, marginInline: "auto" }}>
          <PlanCard lang={lang} device="desktop" featured={L.founding} badge={L.plan.badge} name={L.plan.name} price={L.plan.price} perMonth={L.plan.per} sub={L.plan.planSub} cta={L.cta} note={L.note} spotsLine={L.plan.spotsLine} fillPct={L.plan.fillPct} />
        </div>
        <div style={{ marginTop: 18, background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 16, padding: "24px 28px" }}>
          <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: 1.3, textTransform: "uppercase", color: DA_INK3, marginBottom: 16, textAlign: "center" }}>{L.includedHead}</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px 22px" }}>
            {L.items.map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontFamily: SANS, fontSize: 13.5, color: DA_INK1 }}>
                <span style={{ width: 18, height: 18, borderRadius: "50%", background: DA_GREEN_SOFT, color: DA_GREEN, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}><CheckSVG size={11} /></span>{item}
              </div>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 16, textAlign: "center", fontFamily: SANS, fontSize: 14, color: DA_INK2 }}>
          {L.demoPre}{" "}<a href="#demo" style={{ color: DA_INK1, fontWeight: 600, textDecoration: "none", borderBottom: `1.5px solid ${DA_GOLD}`, paddingBottom: 1, cursor: "pointer" }}>{L.demoLink}</a>
        </div>
      </div>
    </div>
  );
}

function MobileLandingPricing({ lang, spotsRemaining }: { lang: "en" | "ar"; spotsRemaining: number | null }) {
  const L = pricingCopy(lang === "ar", spotsRemaining);
  return (
    <div id="pricing" style={{ padding: "44px 18px", background: DA_BG }}>
      <div style={{ textAlign: "center", marginBottom: 22 }}>
        <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
        <h2 style={{ margin: "10px 0 0", fontFamily: DISPLAY, fontSize: 28, fontWeight: 400, color: DA_INK1, letterSpacing: -.8, lineHeight: 1.05 }}>{L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span></h2>
      </div>
      <PlanCard lang={lang} device="mobile" featured={L.founding} badge={L.plan.badge} name={L.plan.name} price={L.plan.price} perMonth={L.plan.per} sub={L.plan.planSub} cta={L.cta} note={L.note} spotsLine={L.plan.spotsLine} fillPct={L.plan.fillPct} />
      <div style={{ marginTop: 16, background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14, padding: "18px 18px" }}>
        <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: DA_INK3, marginBottom: 12, textAlign: "center" }}>{L.includedHead}</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
          {L.items.map((item, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, fontFamily: SANS, fontSize: 13, color: DA_INK1 }}>
              <span style={{ width: 16, height: 16, borderRadius: "50%", background: DA_GREEN_SOFT, color: DA_GREEN, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center", marginTop: 1 }}><CheckSVG size={10} /></span>{item}
            </div>
          ))}
        </div>
      </div>
      <div style={{ marginTop: 16, textAlign: "center", fontFamily: SANS, fontSize: 13.5, color: DA_INK2 }}>
        {L.demoPre}{" "}<a href="#demo-m" style={{ color: DA_INK1, fontWeight: 600, textDecoration: "none", borderBottom: `1.5px solid ${DA_GOLD}`, paddingBottom: 1 }}>{L.demoLink}</a>
      </div>
    </div>
  );
}

// ── Final CTA ────────────────────────────────────────────────────────────────

function LandingFinalCta({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = isAr ? {
    eyebrow: "ابدأ اليوم", title: "هل أنت مستعد لتنمية", titleAccent: "وكالة سفرك؟",
    sub: "أطلق موقعك المتكامل هذا الأسبوع. ابدأ مجاناً — سعر التأسيس ٣٩ €/شهر ثابت مدى الحياة.",
    cta: "ابدأ التجربة المجانية", second: `تجربة ${TRIAL_DAYS} يوماً · بدون بطاقة ائتمان`,
  } : {
    eyebrow: "Start today", title: "Ready to grow", titleAccent: "your agency?",
    sub: "Launch your whole branded site this week. Start free — founding price €39/mo, locked for life.",
    cta: "Start free trial", second: `${TRIAL_DAYS}-day trial · no credit card`,
  };
  return (
    <div style={{ padding: "80px 48px", background: DA_DARK, color: DA_BG, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at 50% 100%, rgba(176,138,62,.20), transparent 55%)" }} />
      <div style={{ position: "relative", maxWidth: 720, marginInline: "auto", textAlign: "center" }}>
        <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
        <h2 style={{ margin: "14px 0 0", fontFamily: DISPLAY, fontSize: 56, fontWeight: 400, color: DA_BG, letterSpacing: -1.5, lineHeight: 1.02 }}>{L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span></h2>
        <p style={{ margin: "22px auto 0", maxWidth: 500, fontFamily: SANS, fontSize: 17, color: "rgba(244,240,232,.78)", lineHeight: 1.6 }}>{L.sub}</p>
        <a href={`${AGENCY_URL}/signup`} onClick={() => posthog.capture("cta_clicked", { cta: "signup", location: "final_cta", lang, device: "desktop" })} style={{ display: "inline-flex", marginTop: 32, padding: "16px 30px", background: DA_GOLD, color: "#fff", border: "none", borderRadius: 12, fontFamily: SANS, fontSize: 15, fontWeight: 600, alignItems: "center", gap: 9, cursor: "pointer", textDecoration: "none", boxShadow: "0 4px 12px rgba(0,0,0,.25), 0 12px 32px -8px rgba(176,138,62,.5), inset 0 1px 0 rgba(255,255,255,.18)" }}>{L.cta}<ArrowSVG size={16} /></a>
        <div style={{ marginTop: 16, fontFamily: SANS, fontSize: 12.5, color: "rgba(244,240,232,.55)" }}>{L.second}</div>
      </div>
    </div>
  );
}

function MobileLandingFinalCta({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = isAr ? {
    eyebrow: "ابدأ اليوم", titleA: "هل أنت مستعد لتنمية", titleB: "وكالة سفرك؟",
    sub: "أطلق موقعك المتكامل هذا الأسبوع.", cta: "ابدأ التجربة المجانية", second: `تجربة ${TRIAL_DAYS} يوماً · بدون بطاقة ائتمان`,
  } : {
    eyebrow: "Start today", titleA: "Ready to grow", titleB: "your agency?",
    sub: "Launch your whole branded site this week.", cta: "Start free trial", second: `${TRIAL_DAYS}-day trial · no credit card`,
  };
  return (
    <div style={{ padding: "44px 18px", background: DA_DARK, color: DA_BG, position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at 50% 100%, rgba(176,138,62,.2), transparent 55%)" }} />
      <div style={{ position: "relative", textAlign: "center" }}>
        <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
        <h2 style={{ margin: "12px 0 0", fontFamily: DISPLAY, fontSize: 32, fontWeight: 400, color: DA_BG, letterSpacing: -1, lineHeight: 1.05 }}>
          <div>{L.titleA}</div><div style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleB}</div>
        </h2>
        <p style={{ margin: "16px 0 0", fontFamily: SANS, fontSize: 16, color: "rgba(244,240,232,.72)", lineHeight: 1.55 }}>{L.sub}</p>
        <a href={`${AGENCY_URL}/signup`} onClick={() => posthog.capture("cta_clicked", { cta: "signup", location: "final_cta", lang, device: "mobile" })} style={{ display: "flex", width: "100%", marginTop: 22, padding: "14px 0", background: DA_GOLD, color: "#fff", border: "none", borderRadius: 10, fontFamily: SANS, fontSize: 14, fontWeight: 600, alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", textDecoration: "none", boxSizing: "border-box", boxShadow: "0 4px 12px rgba(0,0,0,.25), 0 12px 32px -8px rgba(176,138,62,.5)" }}>{L.cta}<ArrowSVG size={15} /></a>
        <div style={{ marginTop: 12, fontFamily: SANS, fontSize: 11.5, color: "rgba(244,240,232,.55)" }}>{L.second}</div>
      </div>
    </div>
  );
}

// ── Book a demo (contact form → /api/submit-demo) ────────────────────────────

function DemoSuccessCard({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const t = isAr
    ? { title: "شكراً — سنتواصل قريباً", sub: "وصلنا طلبك. سيتواصل أحد فريقنا عبر واتساب أو البريد لترتيب جولتك." }
    : { title: "Thanks — we'll be in touch", sub: "Your request is in. Someone from our team will reach out by WhatsApp or email to set up your walkthrough." };
  return (
    <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 16, padding: "44px 32px", textAlign: "center" }}>
      <div style={{ width: 56, height: 56, borderRadius: "50%", background: DA_GREEN_SOFT, color: DA_GREEN, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}><CheckSVG size={22} /></div>
      <div style={{ fontFamily: DISPLAY, fontSize: 30, color: DA_INK1, marginBottom: 10, letterSpacing: -0.6 }}>{t.title}</div>
      <p style={{ margin: 0, fontFamily: SANS, fontSize: 15, color: DA_INK2, lineHeight: 1.6, maxWidth: 380, marginInline: "auto" }}>{t.sub}</p>
    </div>
  );
}

function useDemoForm(device: "desktop" | "mobile", isAr: boolean) {
  const [name, setName] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [serverError, setServerError] = useState("");
  const errRequired = isAr ? "هذا الحقل مطلوب." : "This field is required.";
  const errPhone = isAr ? "أدخل رقم واتساب صحيح مع رمز الدولة." : "Please enter a valid WhatsApp number with country code.";
  const errEmail = isAr ? "أدخل عنوان بريد إلكتروني صحيح." : "Please enter a valid email address.";
  const errServer = isAr ? "حدث خطأ. يرجى المحاولة مجدداً." : "Something went wrong. Please try again.";
  const isValidPhone = (v: string) => /^\d{7,15}$/.test(v.replace(/[^\d]/g, ""));
  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  function validate(): Record<string, string> {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = errRequired;
    if (!agencyName.trim()) e.agencyName = errRequired;
    if (!whatsapp.trim()) e.whatsapp = errRequired;
    else if (!isValidPhone(whatsapp)) e.whatsapp = errPhone;
    if (email && !isValidEmail(email)) e.email = errEmail;
    return e;
  }
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({}); setStatus("submitting");
    try {
      const res = await fetch("/api/submit-demo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, agencyName, whatsapp, email, message, website }) });
      if (!res.ok) throw new Error();
      posthog.capture("demo_form_submitted", { has_email: !!email.trim(), lang: isAr ? "ar" : "en", device });
      setStatus("success");
    } catch { setStatus("idle"); setServerError(errServer); }
  }
  return { name, setName, agencyName, setAgencyName, whatsapp, setWhatsapp, email, setEmail, message, setMessage, website, setWebsite, errors, setErrors, status, serverError, handleSubmit };
}

function DemoFormFields({ f, lang }: { f: ReturnType<typeof useDemoForm>; lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = isAr ? {
    labelName: "اسمك", labelAgency: "اسم الوكالة", labelWA: "رقم واتساب", labelEmail: "البريد الإلكتروني", labelMessage: "رسالة", optional: "(اختياري)",
    placeholderName: "مثال: سارة محمد", placeholderAgency: "مثال: مرايا للأسفار", placeholderWA: "+31 6 1234 5678", placeholderEmail: "you@agency.com", placeholderMessage: "أخبرنا باختصار عن وكالتك…",
    cta: "اطلب عرضاً توضيحياً", submitting: "جارٍ الإرسال…", privacy: "نستخدم بياناتك للتواصل بشأن العرض فقط.",
  } : {
    labelName: "Your name", labelAgency: "Agency name", labelWA: "WhatsApp number", labelEmail: "Email address", labelMessage: "Message", optional: "(optional)",
    placeholderName: "e.g., Sarah Jenkins", placeholderAgency: "e.g., Maraya Journeys", placeholderWA: "+31 6 1234 5678", placeholderEmail: "you@agency.com", placeholderMessage: "Tell us about your agency and the trips you sell…",
    cta: "Request a demo", submitting: "Sending…", privacy: "We'll only use your details to reach out about the demo.",
  };
  const inputSt: React.CSSProperties = { width: "100%", padding: "10px 12px", fontFamily: SANS, fontSize: 13.5, color: DA_INK1, background: DA_BG, borderRadius: 8, outline: "none", boxSizing: "border-box" };
  const fieldSt = (key: string): React.CSSProperties => ({ ...inputSt, border: `1px solid ${f.errors[key] ? DA_DANGER : DA_RULE2}` });
  const lbl: React.CSSProperties = { fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_INK3, marginBottom: 5 };
  return (
    <form onSubmit={f.handleSubmit} noValidate>
      <input type="text" tabIndex={-1} aria-hidden="true" autoComplete="off" value={f.website} onChange={e => f.setWebsite(e.target.value)} style={{ position: "absolute", opacity: 0, pointerEvents: "none", width: 0, height: 0 }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <div style={lbl}>{L.labelName}</div>
          <input style={fieldSt("name")} value={f.name} placeholder={L.placeholderName} onChange={e => { f.setName(e.target.value); f.setErrors(er => ({ ...er, name: "" })); }} />
          {f.errors.name && <div style={{ fontFamily: SANS, fontSize: 11, color: DA_DANGER, marginTop: 4 }}>{f.errors.name}</div>}
        </div>
        <div>
          <div style={lbl}>{L.labelAgency}</div>
          <input style={fieldSt("agencyName")} value={f.agencyName} placeholder={L.placeholderAgency} onChange={e => { f.setAgencyName(e.target.value); f.setErrors(er => ({ ...er, agencyName: "" })); }} />
          {f.errors.agencyName && <div style={{ fontFamily: SANS, fontSize: 11, color: DA_DANGER, marginTop: 4 }}>{f.errors.agencyName}</div>}
        </div>
        <div>
          <div style={lbl}>{L.labelWA}</div>
          <div dir="ltr" style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 11, top: "50%", transform: "translateY(-50%)", color: "#25d366", display: "flex", alignItems: "center", pointerEvents: "none" }}><WASvg /></span>
            <input type="tel" dir="ltr" style={{ ...fieldSt("whatsapp"), paddingLeft: 34 }} value={f.whatsapp} placeholder={L.placeholderWA} onChange={e => { f.setWhatsapp(e.target.value); f.setErrors(er => ({ ...er, whatsapp: "" })); }} />
          </div>
          {f.errors.whatsapp && <div style={{ fontFamily: SANS, fontSize: 11, color: DA_DANGER, marginTop: 4 }}>{f.errors.whatsapp}</div>}
        </div>
        <div>
          <div style={lbl}>{L.labelEmail} <span style={{ fontWeight: 400, color: DA_INK3 }}>{L.optional}</span></div>
          <input type="email" style={fieldSt("email")} value={f.email} placeholder={L.placeholderEmail} onChange={e => { f.setEmail(e.target.value); f.setErrors(er => ({ ...er, email: "" })); }} />
          {f.errors.email && <div style={{ fontFamily: SANS, fontSize: 11, color: DA_DANGER, marginTop: 4 }}>{f.errors.email}</div>}
        </div>
        <div>
          <div style={lbl}>{L.labelMessage} <span style={{ fontWeight: 400, color: DA_INK3 }}>{L.optional}</span></div>
          <textarea style={{ ...fieldSt("message"), resize: "vertical", minHeight: 80 }} value={f.message} placeholder={L.placeholderMessage} onChange={e => f.setMessage(e.target.value)} />
        </div>
        {f.serverError && <div style={{ fontFamily: SANS, fontSize: 12.5, color: DA_DANGER }}>{f.serverError}</div>}
        <button type="submit" disabled={f.status === "submitting"} style={{ width: "100%", padding: "13px 0", background: "transparent", border: `1.5px solid ${DA_INK1}`, color: DA_INK1, borderRadius: 10, fontFamily: SANS, fontSize: 14, fontWeight: 600, cursor: f.status === "submitting" ? "not-allowed" : "pointer", opacity: f.status === "submitting" ? 0.65 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxSizing: "border-box" }}>
          {f.status === "submitting" ? L.submitting : <>{L.cta}<ArrowSVG size={13} /></>}
        </button>
        <div style={{ textAlign: "center", fontFamily: SANS, fontSize: 11.5, color: DA_INK3 }}>{L.privacy}</div>
      </div>
    </form>
  );
}

function DemoPitch({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const L = isAr ? {
    eyebrow: "عرض توضيحي", title: "تفضّل أن نُريك", titleAccent: "المنتج أولاً؟",
    sub: "اترك رقم واتسابك ونتواصل معك لجولة سريعة — نُنشئ أمامك موقعاً من إحدى رحلاتك، ونجيب على أي سؤال قبل أن تشترك.",
    points: ["جولة شخصية في أقل من ١٥ دقيقة", "نبني موقعاً من باقتك الحقيقية معك", "بدون التزام — فقط لنرى إن كان يناسبك"],
    reassure: "سنتواصل معك عبر واتساب أو البريد الإلكتروني.",
  } : {
    eyebrow: "Book a demo", title: "Rather see it", titleAccent: "in action first?",
    sub: "Leave your WhatsApp number and we'll set up a quick walkthrough — we'll build a real site from one of your trips with you, and answer anything before you subscribe.",
    points: ["A personal walkthrough in under 15 minutes", "We build a site from your real package, together", "No commitment — just to see if it fits"],
    reassure: "We'll reach out by WhatsApp or email.",
  };
  return (
    <div>
      <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
      <h2 style={{ margin: "12px 0 0", fontFamily: DISPLAY, fontSize: 40, fontWeight: 400, color: DA_INK1, letterSpacing: -1, lineHeight: 1.05 }}>{L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span></h2>
      <p style={{ margin: "18px 0 0", maxWidth: 420, fontFamily: SANS, fontSize: 17, color: DA_INK2, lineHeight: 1.6 }}>{L.sub}</p>
      <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 12 }}>
        {L.points.map((p, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span style={{ width: 22, height: 22, borderRadius: "50%", background: DA_GREEN_SOFT, color: DA_GREEN, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><CheckSVG size={12} /></span>
            <span style={{ fontFamily: SANS, fontSize: 16, color: DA_INK1 }}>{p}</span>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 26, padding: "12px 14px", background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 10, display: "flex", alignItems: "center", gap: 10, maxWidth: 420 }}>
        <span style={{ width: 30, height: 30, borderRadius: 8, background: DA_GREEN_SOFT, color: DA_GREEN, flexShrink: 0, display: "inline-flex", alignItems: "center", justifyContent: "center" }}><WASvg size={15} /></span>
        <span style={{ fontFamily: SANS, fontSize: 12.5, color: DA_INK2, lineHeight: 1.5 }}>{L.reassure}</span>
      </div>
    </div>
  );
}

function LandingDemo({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const f = useDemoForm("desktop", isAr);
  return (
    <div id="demo" dir={isAr ? "rtl" : "ltr"} style={{ padding: "80px 48px", background: DA_SURFACE2 }}>
      <div style={{ maxWidth: 1080, marginInline: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 56, alignItems: "center" }}>
        <DemoPitch lang={lang} />
        {f.status === "success"
          ? <DemoSuccessCard lang={lang} />
          : <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 16, padding: 28, boxShadow: "0 1px 2px rgba(26,22,17,.04), 0 18px 40px -22px rgba(26,22,17,.14)" }}><DemoFormFields f={f} lang={lang} /></div>}
      </div>
    </div>
  );
}

function MobileLandingDemo({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const f = useDemoForm("mobile", isAr);
  const L = isAr
    ? { eyebrow: "عرض توضيحي", title: "تفضّل أن نُريك", titleAccent: "المنتج أولاً؟", sub: "اترك رقم واتسابك ونتواصل معك لجولة سريعة قبل أن تشترك." }
    : { eyebrow: "Book a demo", title: "Rather see it", titleAccent: "in action first?", sub: "Leave your WhatsApp number and we'll set up a quick walkthrough before you subscribe." };
  return (
    <div id="demo-m" dir={isAr ? "rtl" : "ltr"} style={{ padding: "44px 18px", background: DA_SURFACE2 }}>
      {f.status !== "success" && (
        <div style={{ marginBottom: 22 }}>
          <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD }}>{L.eyebrow}</div>
          <h2 style={{ margin: "10px 0 0", fontFamily: DISPLAY, fontSize: 28, fontWeight: 400, color: DA_INK1, letterSpacing: -.8, lineHeight: 1.05 }}>{L.title} <span style={{ fontStyle: "italic", color: DA_GOLD }}>{L.titleAccent}</span></h2>
          <p style={{ margin: "12px 0 0", fontFamily: SANS, fontSize: 13.5, color: DA_INK2, lineHeight: 1.55 }}>{L.sub}</p>
        </div>
      )}
      {f.status === "success"
        ? <DemoSuccessCard lang={lang} />
        : <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14, padding: "20px 18px" }}><DemoFormFields f={f} lang={lang} /></div>}
    </div>
  );
}

// ── Contact modal (footer "Contact us") ──────────────────────────────────────

function ContactModal({ open, onClose, isAr }: { open: boolean; onClose: () => void; isAr: boolean }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  if (!open) return null;
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); setStatus("sending");
    try {
      const res = await fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title, description, email }) });
      if (!res.ok) throw new Error();
      setStatus("sent");
    } catch { setStatus("error"); }
  }
  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", fontFamily: SANS, fontSize: 13.5, color: DA_INK1, background: DA_BG, border: `1px solid ${DA_RULE2}`, borderRadius: 8, outline: "none", boxSizing: "border-box" };
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(13,27,46,0.55)", backdropFilter: "blur(2px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: DA_SURFACE, borderRadius: 16, padding: 32, maxWidth: 460, width: "calc(100% - 36px)", boxShadow: "0 8px 40px rgba(0,0,0,0.18)" }}>
        {status === "sent" ? (
          <div style={{ textAlign: "center", padding: "12px 0" }}>
            <div style={{ width: 48, height: 48, borderRadius: "50%", background: DA_GREEN_SOFT, color: DA_GREEN, display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 16 }}><CheckSVG size={18} /></div>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, color: DA_INK1, marginBottom: 8 }}>{isAr ? "تم إرسال رسالتك!" : "Message sent!"}</div>
            <p style={{ fontFamily: SANS, fontSize: 14, color: DA_INK2, margin: "0 0 24px" }}>{isAr ? "سنرد عليك في أقرب وقت ممكن." : "We'll get back to you as soon as possible."}</p>
            <button onClick={onClose} style={{ padding: "10px 28px", background: DA_INK1, color: DA_BG, border: "none", borderRadius: 8, fontFamily: SANS, fontSize: 13.5, fontWeight: 600, cursor: "pointer" }}>{isAr ? "إغلاق" : "Close"}</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ fontFamily: DISPLAY, fontSize: 22, color: DA_INK1, marginBottom: 6 }}>{isAr ? "تواصل معنا" : "Contact us"}</div>
            <p style={{ fontFamily: SANS, fontSize: 14, color: DA_INK2, margin: "0 0 22px" }}>{isAr ? "أرسل لنا رسالة وسنرد في أقرب وقت." : "Send us a message and we'll get back to you."}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_INK3, marginBottom: 5 }}>{isAr ? "الموضوع" : "Subject"}</div>
                <input style={inputStyle} value={title} onChange={e => setTitle(e.target.value)} placeholder={isAr ? "ما هو موضوع رسالتك؟" : "What's your question?"} required />
              </div>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_INK3, marginBottom: 5 }}>{isAr ? "رسالتك" : "Message"}</div>
                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 100 }} value={description} onChange={e => setDescription(e.target.value)} placeholder={isAr ? "اكتب هنا ما ترغب في استيضاحه…" : "Describe your question or request…"} required />
              </div>
              <div>
                <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_INK3, marginBottom: 5 }}>{isAr ? "بريدك الإلكتروني" : "Your email"}</div>
                <input type="email" style={inputStyle} value={email} onChange={e => setEmail(e.target.value)} placeholder="you@agency.com" required />
              </div>
            </div>
            {status === "error" && <p style={{ fontFamily: SANS, fontSize: 12.5, color: "#c0392b", margin: "12px 0 0" }}>{isAr ? "حدث خطأ. يرجى المحاولة مجدداً." : "Something went wrong. Please try again."}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
              <button type="button" onClick={onClose} style={{ flex: 1, padding: "11px 0", background: "transparent", border: `1px solid ${DA_RULE2}`, borderRadius: 8, fontFamily: SANS, fontSize: 13.5, color: DA_INK2, cursor: "pointer" }}>{isAr ? "إلغاء" : "Cancel"}</button>
              <button type="submit" disabled={status === "sending"} style={{ flex: 2, padding: "11px 0", background: DA_GOLD, color: "#fff", border: "none", borderRadius: 8, fontFamily: SANS, fontSize: 13.5, fontWeight: 600, cursor: "pointer", opacity: status === "sending" ? 0.7 : 1 }}>{status === "sending" ? (isAr ? "جارٍ الإرسال…" : "Sending…") : (isAr ? "إرسال" : "Send message")}</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Footer ───────────────────────────────────────────────────────────────────

type FooterLink = { label: string; href?: string; contact?: boolean };

function LandingFooter({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const [contactOpen, setContactOpen] = useState(false);
  const L = isAr ? {
    tagline: "موقع متكامل بهوية وكالتك — الصفحة الرئيسية والمتجر وصفحات الباقات، على نطاقك الخاص.",
    cols: [
      { head: "المنتج", links: [{ label: "المزايا", href: "#features" }, { label: "القوالب", href: "/templates" }, { label: "الأسعار", href: "#pricing" }, { label: "تسجيل الدخول", href: `${AGENCY_URL}/login` }] },
      { head: "الموارد", links: [{ label: "كيف يعمل", href: "#how" }, { label: "تواصل معنا", contact: true }] },
      { head: "قانوني", links: [{ label: "سياسة الخصوصية", href: "/privacy" }, { label: "شروط الاستخدام", href: "/terms" }, { label: "DPA", href: "/dpa" }] },
    ] as { head: string; links: FooterLink[] }[],
    operator: "تشغيل · WQ AppTech", operatorSub: "مشروع فردي مسجَّل في هولندا · KvK 91019001", copy: "© ٢٠٢٦ Packmetrix. جميع الحقوق محفوظة.",
  } : {
    tagline: "A complete branded website for your travel agency — homepage, storefront, and package pages, on your own domain.",
    cols: [
      { head: "Product", links: [{ label: "Features", href: "#features" }, { label: "Templates", href: "/templates" }, { label: "Pricing", href: "#pricing" }, { label: "Log in", href: `${AGENCY_URL}/login` }] },
      { head: "Resources", links: [{ label: "How it works", href: "#how" }, { label: "Contact us", contact: true }] },
      { head: "Legal", links: [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }, { label: "DPA", href: "/dpa" }] },
    ] as { head: string; links: FooterLink[] }[],
    operator: "Operated by · WQ AppTech", operatorSub: "Registered in the Netherlands · KvK 91019001", copy: "© 2026 Packmetrix. All rights reserved.",
  };
  const linkStyle: React.CSSProperties = { fontFamily: SANS, fontSize: 13, color: DA_INK1, cursor: "pointer", textDecoration: "none" };
  return (
    <>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} isAr={isAr} />
      <div style={{ padding: "56px 48px 32px", background: DA_SURFACE2, borderTop: `1px solid ${DA_RULE}`, fontFamily: SANS }}>
        <div style={{ maxWidth: 1280, marginInline: "auto" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1fr 1fr", gap: 36 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{ width: 28, height: 28, borderRadius: 7, background: DA_INK1, color: DA_GOLD, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 13 }}>P</div>
                <div style={{ fontFamily: DISPLAY, fontSize: 18, color: DA_INK1, letterSpacing: -0.2 }}>Packmetrix</div>
              </div>
              <p style={{ margin: 0, fontFamily: SANS, fontSize: 13, color: DA_INK2, maxWidth: 280, lineHeight: 1.55 }}>{L.tagline}</p>
            </div>
            {L.cols.map((col, i) => (
              <div key={i}>
                <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.3, textTransform: "uppercase", color: DA_INK3, marginBottom: 14 }}>{col.head}</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {col.links.map((link, j) => (
                    link.contact
                      ? <button key={j} type="button" onClick={() => setContactOpen(true)} style={{ ...linkStyle, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: isAr ? "right" : "left" }}>{link.label}</button>
                      : <a key={j} href={link.href} style={linkStyle}>{link.label}</a>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 48, paddingTop: 22, borderTop: `1px solid ${DA_RULE}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, flexWrap: "wrap" }}>
            <div style={{ fontFamily: SANS, fontSize: 12, color: DA_INK3 }}>{L.copy}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontFamily: SANS, fontSize: 12, color: DA_INK3 }}>
              <span style={{ color: DA_INK2, fontWeight: 500 }}>{L.operator}</span>
              <span style={{ color: DA_RULE2 }}>·</span>
              <span>{L.operatorSub}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function MobileLandingFooter({ lang }: { lang: "en" | "ar" }) {
  const isAr = lang === "ar";
  const [contactOpen, setContactOpen] = useState(false);
  const L = isAr ? {
    tagline: "موقع متكامل بهوية وكالتك.",
    cols: [
      { head: "المنتج", links: [{ label: "المزايا", href: "#features" }, { label: "القوالب", href: "/templates" }, { label: "الأسعار", href: "#pricing" }] },
      { head: "الموارد", links: [{ label: "كيف يعمل", href: "#how" }, { label: "تواصل معنا", contact: true }] },
      { head: "قانوني", links: [{ label: "الخصوصية", href: "/privacy" }, { label: "الشروط", href: "/terms" }] },
    ] as { head: string; links: FooterLink[] }[],
    copy: "© ٢٠٢٦ Packmetrix · مسجَّل في هولندا · KvK 91019001",
  } : {
    tagline: "A complete branded website for your travel agency.",
    cols: [
      { head: "Product", links: [{ label: "Features", href: "#features" }, { label: "Templates", href: "/templates" }, { label: "Pricing", href: "#pricing" }] },
      { head: "Resources", links: [{ label: "How it works", href: "#how" }, { label: "Contact us", contact: true }] },
      { head: "Legal", links: [{ label: "Privacy", href: "/privacy" }, { label: "Terms", href: "/terms" }] },
    ] as { head: string; links: FooterLink[] }[],
    copy: "© 2026 Packmetrix · Registered in the Netherlands · KvK 91019001",
  };
  return (
    <>
      <ContactModal open={contactOpen} onClose={() => setContactOpen(false)} isAr={isAr} />
      <div style={{ padding: "32px 18px 22px", background: DA_SURFACE2, borderTop: `1px solid ${DA_RULE}`, fontFamily: SANS }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: 6, background: DA_INK1, color: DA_GOLD, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: DISPLAY, fontSize: 11 }}>P</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 16, color: DA_INK1, letterSpacing: -0.2 }}>Packmetrix</div>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: DA_INK2, lineHeight: 1.5 }}>{L.tagline}</p>
        <div style={{ marginTop: 22, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 18 }}>
          {L.cols.map((col, i) => (
            <div key={i}>
              <div style={{ fontSize: 9.5, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: DA_INK3, marginBottom: 9 }}>{col.head}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {col.links.map((link, j) => (
                  link.contact
                    ? <button key={j} type="button" onClick={() => setContactOpen(true)} style={{ fontSize: 12, color: DA_INK1, background: "none", border: "none", padding: 0, cursor: "pointer", textAlign: isAr ? "right" : "left", fontFamily: SANS }}>{link.label}</button>
                    : <a key={j} href={link.href} style={{ fontSize: 12, color: DA_INK1, textDecoration: "none" }}>{link.label}</a>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 22, paddingTop: 14, borderTop: `1px solid ${DA_RULE}`, fontSize: 10.5, color: DA_INK3, textAlign: "center" }}>{L.copy}</div>
      </div>
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function MarketingPage() {
  const isMobile = useIsMobile();
  const lang = useLang();
  const isAr = lang === "ar";

  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);

  useEffect(() => { posthog.capture("landing_page_viewed", { lang, device: isMobile ? "mobile" : "desktop" }); }, [isMobile, lang]);

  useEffect(() => {
    fetch("/api/founding-spots")
      .then(r => r.json())
      .then(d => setSpotsRemaining(d.remaining ?? 0))
      .catch(() => setSpotsRemaining(0));
  }, []);

  return (
    <div dir={isAr ? "rtl" : "ltr"} className={isAr ? "lp-ar" : undefined} style={{ background: DA_BG, fontFamily: SANS, minHeight: "100vh" }}>
      {isMobile ? (
        <>
          <MobileLandingNav lang={lang} />
          <MobileLandingHero lang={lang} />
          <MobileLandingProblem lang={lang} />
          <MobileLandingShowcase lang={lang} />
          <MobileLandingPillars lang={lang} />
          <MobileLandingHowItWorks lang={lang} />
          <TemplateShowcase lang={lang} mobile />
          <MobileLandingExamples lang={lang} />
          <MobileLandingPricing lang={lang} spotsRemaining={spotsRemaining} />
          <MobileLandingFinalCta lang={lang} />
          <MobileLandingDemo lang={lang} />
          <MobileLandingFooter lang={lang} />
        </>
      ) : (
        <>
          <LandingNav lang={lang} />
          <LandingHero lang={lang} />
          <LandingProblem lang={lang} />
          <LandingShowcase lang={lang} />
          <LandingPillars lang={lang} />
          <LandingHowItWorks lang={lang} />
          <TemplateShowcase lang={lang} />
          <LandingExamples lang={lang} />
          <LandingPricing lang={lang} spotsRemaining={spotsRemaining} />
          <LandingFinalCta lang={lang} />
          <LandingDemo lang={lang} />
          <LandingFooter lang={lang} />
        </>
      )}
    </div>
  );
}
