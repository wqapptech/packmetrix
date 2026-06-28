"use client";

// Dedicated reviews page — lists EVERY customer review (video clips + image
// screenshots + text quotes) from the home testimonials section. The home page
// shows a capped subset with a "View all" link that lands here. Mounted at a
// non-root route (/[agencySlug]/reviews, /sites/[host]/reviews) — never at root.
//
// It mirrors HomepageInner's lean chrome load (agency doc → brand/lang/RTL +
// About-nav gate + legal/cookie links) so the header/footer match the rest of
// the site, then renders the reviews through the shared <ReviewTile>. No package
// data is needed — reviews live entirely on the testimonials section.

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { collection, getDocs, query, where, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { withFirestoreRecovery } from "@/lib/firestore-recover";
import { deriveBrand, brandFromUser, waHref, DEFAULT_BRAND_COLOR, type AgencyBrand } from "@/lib/brand";
import { readHomepageConfig, aboutPageHasContent, pick, type TestimonialsContent } from "@/lib/homepage";
import { legalLinksFor, legalDocExists, legalHref } from "@/lib/legal";
import SiteHeader, { type NavKey } from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import CookieBanner from "./CookieBanner";
import { WaIcon } from "./icons";
import { useIsDesktop } from "./useIsDesktop";
import { useBfcacheReload, useReloadIfStuck } from "./useBfcacheReload";
import { ReviewTile, type Ctx } from "./HomepageSections";
import "@/app/homepage.css";

type Lang = "en" | "ar";

const UI = {
  en: { title: "Reviews", sub: "What our travelers say.", empty: "No reviews yet — check back soon." },
  ar: { title: "آراء العملاء", sub: "ماذا يقول مسافرونا.", empty: "لا توجد مراجعات بعد — عُد قريباً." },
};

function ReviewsInner({ agencySlug, basePath }: { agencySlug: string; basePath: string }) {
  const searchParams = useSearchParams();
  const m = !useIsDesktop();
  useBfcacheReload(true);

  const langParam = searchParams.get("language");
  const forcedLang: Lang | null = langParam === "ar" || langParam === "en" ? langParam : null;

  const [agencyDoc, setAgencyDoc] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  useReloadIfStuck(loading);

  useEffect(() => {
    const load = async () => {
      if (!agencySlug) { setLoading(false); return; }
      try {
        const dd = await withFirestoreRecovery(async () => {
          const snap = await getDocs(query(collection(db, "users"), where("agencySlug", "==", agencySlug), limit(1)));
          return snap.empty ? null : snap.docs[0].data();
        });
        setAgencyDoc(dd);
      } catch (err) {
        console.error("[ReviewsPage] Firestore error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [agencySlug]);

  const storefrontLang: Lang = agencyDoc?.storefrontLanguage === "ar" ? "ar" : "en";
  const lang: Lang = forcedLang ?? storefrontLang;
  const ar = lang === "ar";
  const U = UI[lang];

  const brand: AgencyBrand = useMemo(() => brandFromUser(agencyDoc || {}, lang), [agencyDoc, lang]);
  const themeVars = useMemo(
    () => deriveBrand(brand.brandColor || DEFAULT_BRAND_COLOR, brand.accentColor),
    [brand.brandColor, brand.accentColor]
  );

  // Reviews are authored on the home testimonials section — read it straight off
  // the stored homepage config (hydrated for back-compat). No package-derived
  // seed inputs matter here; we only read this one section's items.
  const tst = useMemo(() => {
    const cfg = readHomepageConfig(agencyDoc?.homepage, {}, "home");
    const sec = cfg.sections.find((s) => s.type === "testimonials");
    return (sec?.content as TestimonialsContent | undefined) || undefined;
  }, [agencyDoc]);
  const items = tst?.items || [];

  const homeHref = basePath || "/";
  const packagesHref = `${basePath}/packages`;
  const aboutHref = `${basePath}/about`;
  const reviewsHref = `${basePath}/reviews`;
  const showAbout = aboutPageHasContent(agencyDoc);
  const aboutNavHref = showAbout ? aboutHref : undefined;
  const hideAboutKeys: NavKey[] | undefined = showAbout ? undefined : ["about"];
  const waLink = brand.whatsapp ? waHref(brand.whatsapp) : null;
  const legalLinks = legalLinksFor(agencyDoc, basePath, lang);
  const cookieHref = legalDocExists(agencyDoc, "cookies") ? legalHref(basePath, "cookies") : undefined;
  const privacyHref = legalDocExists(agencyDoc, "privacy") ? legalHref(basePath, "privacy") : undefined;
  const setLang = (l: Lang) => {
    const url = new URL(window.location.href);
    url.searchParams.set("language", l);
    window.location.assign(url.toString());
  };

  const ctx: Ctx = {
    lang, ar, m, brand, editor: false,
    agency: agencyDoc || {},
    packages: [],
    basePath,
    packagesHref,
    aboutHref,
    reviewsHref,
    waLink,
    openPkg: (id: string) => window.location.assign(`${basePath}/${id}`),
    scrollContact: () => {},
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f4f0e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ borderTopColor: brand.brandColor }} />
      </div>
    );
  }

  const eyebrow = pick(tst?.eyebrow, lang);
  const heading = pick(tst?.heading, lang) || U.title;

  return (
    <div className="hp" dir={ar ? "rtl" : "ltr"} lang={lang} style={{ ...(themeVars as React.CSSProperties), ["--font-display" as string]: brand.displayFont, ["--font-body" as string]: brand.bodyFont, fontFamily: brand.bodyFont, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <SiteHeader
        brand={brand}
        lang={lang}
        active={"reviews"}
        packagesHref={packagesHref}
        homeHref={homeHref}
        aboutHref={aboutNavHref}
        hideKeys={hideAboutKeys}
        onSetLang={setLang}
      />
      <section style={{ padding: `${m ? 56 : 84}px 0`, flex: 1 }}>
        <div className="hp-wrap">
          {eyebrow ? <div className="hp-eyebrow">{eyebrow}</div> : null}
          <h1 className="hp-serif hp-h2" style={{ marginTop: eyebrow ? 10 : 0 }}>{heading}</h1>
          <p style={{ fontSize: 16, color: "var(--ink3)", marginTop: 10 }}>{U.sub}</p>
          {items.length ? (
            <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(3,1fr)", gap: 20, marginTop: 40, alignItems: "start" }}>
              {items.map((it, i) => <ReviewTile key={i} it={it} ctx={ctx} />)}
            </div>
          ) : (
            <p style={{ fontSize: 16, color: "var(--ink3)", marginTop: 40 }}>{U.empty}</p>
          )}
        </div>
      </section>
      <SiteFooter
        brand={brand}
        lang={lang}
        packagesHref={packagesHref}
        homeHref={homeHref}
        aboutHref={aboutNavHref}
        hideKeys={hideAboutKeys}
        legalLinks={legalLinks}
      />
      {m && waLink && (
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="sf-fab" aria-label="WhatsApp">
          <WaIcon size={26} />
        </a>
      )}
      <CookieBanner brand={brand} lang={lang} cookieHref={cookieHref} privacyHref={privacyHref} />
    </div>
  );
}

export default function ReviewsPage({ agencySlug, basePath = "" }: { agencySlug: string; basePath?: string }) {
  return (
    <Suspense fallback={null}>
      <ReviewsInner agencySlug={agencySlug} basePath={basePath} />
    </Suspense>
  );
}
