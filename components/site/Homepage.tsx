"use client";

// Homepage renderer — reads the homepage section model + brand + agency data,
// renders enabled sections in order wrapped in SiteHeader/SiteFooter.
// Mounted at a NON-ROOT preview route (/[agencySlug]/home, /sites/[host]/home);
// root still serves the storefront.

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { collection, getDocs, query, where, doc, getDoc, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { withFirestoreRecovery } from "@/lib/firestore-recover";
import { deriveBrand, brandFromUser, waHref, DEFAULT_BRAND_COLOR, type AgencyBrand } from "@/lib/brand";
import { readHomepageConfig, enabledSections, aboutPageHasContent, type HomePageKind } from "@/lib/homepage";
import { legalLinksFor, legalDocExists, legalHref } from "@/lib/legal";
import SiteHeader, { type NavKey } from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import CookieBanner from "./CookieBanner";
import { WaIcon } from "./icons";
import { useIsDesktop } from "./useIsDesktop";
import { useBfcacheReload, useReloadIfStuck } from "./useBfcacheReload";
import { renderSection, type Ctx } from "./HomepageSections";
import type { CardPackage } from "./PackageCard";
import "@/app/homepage.css";

type Lang = "en" | "ar";
type Pkg = CardPackage & {
  destination: string;
  agencySlug?: string;
  status?: string;
  isActive?: boolean;
  language?: string;
  primaryLanguage?: string;
  createdAt?: number;
  userId?: string;
};

function isActive(p: Pkg): boolean {
  if (p.status === "draft") return false;
  if (p.isActive === false) return false;
  return true;
}

/** Injected state for the dashboard builder preview — when present, the renderer
 *  uses this agency doc + homepage config instead of self-fetching them. Packages
 *  are still fetched by slug (derived sections need real package data). */
export type HomepageOverride = {
  config?: unknown;
  agencyDoc?: Record<string, unknown> | null;
};

function HomepageInner({ agencySlug, basePath, editor, override, page }: { agencySlug: string; basePath: string; editor: boolean; override?: HomepageOverride; page: HomePageKind }) {
  const searchParams = useSearchParams();
  const m = !useIsDesktop();
  useBfcacheReload(!editor && !override); // Back/Forward → reload so Firestore re-fetches (not in builder preview)

  const langParam = searchParams.get("language");
  const forcedLang: Lang | null = langParam === "ar" || langParam === "en" ? langParam : null;

  const [packages, setPackages] = useState<Pkg[]>([]);
  const [agencyDoc, setAgencyDoc] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  useReloadIfStuck(loading && !editor && !override); // safety net for Back-restored hung fetch

  useEffect(() => {
    console.log("[PMX-DIAG] Homepage effect RUNS (mount) — agencySlug =", agencySlug);
    const load = async () => {
      // Builder preview injects the agency doc — render it immediately and skip
      // the user-doc lookup, but still fetch packages so derived sections work.
      if (override) setAgencyDoc(override.agencyDoc ?? null);
      if (!agencySlug) { setLoading(false); return; }
      try {
        console.log("[PMX-DIAG] Homepage load:start (calling Firestore)");
        // All reads run under a watchdog that resets a wedged Firestore stream
        // and retries — otherwise a Back/Forward-killed connection leaves these
        // reads hanging and the spinner up forever. Keep this body side-effect
        // free (setState happens on the resolved result, below).
        const { docData, active } = await withFirestoreRecovery(async () => {
          const snap = await getDocs(query(collection(db, "packages"), where("agencySlug", "==", agencySlug)));
          const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Pkg));

          let dd: Record<string, unknown> | null = override ? (override.agencyDoc ?? null) : null;
          if (!override) {
            const userId = snap.docs[0] ? (snap.docs[0].data() as { userId?: string }).userId : undefined;
            if (userId) {
              const userSnap = await getDoc(doc(db, "users", userId));
              if (userSnap.exists()) dd = userSnap.data();
            }
            if (!dd) {
              const userSnap = await getDocs(query(collection(db, "users"), where("agencySlug", "==", agencySlug), limit(1)));
              if (!userSnap.empty) dd = userSnap.docs[0].data();
            }
          }

          const storefrontLang: Lang = dd?.storefrontLanguage === "ar" ? "ar" : "en";
          const sfLang: Lang = forcedLang ?? storefrontLang;
          const act = all
            .filter(isActive)
            .filter((p) => (p.primaryLanguage || p.language || "en") === sfLang)
            .sort((a, b) => {
              const fa = (a as Pkg & { featured?: boolean }).featured ? 1 : 0;
              const fb = (b as Pkg & { featured?: boolean }).featured ? 1 : 0;
              if (fa !== fb) return fb - fa;
              return (a.createdAt || 0) - (b.createdAt || 0);
            });
          return { docData: dd, active: act };
        });

        console.log("[PMX-DIAG] Homepage load:done —", active.length, "packages");
        if (!override) setAgencyDoc(docData);
        setPackages(active);
      } catch (err) {
        console.error("[PMX-DIAG] Homepage load:ERROR", err);
        console.error("[Homepage] Firestore error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [agencySlug, forcedLang, override]);

  // Count real homepage visits (deduped per session). Skip the agency's own
  // previews: the builder injects `override`, and catalog-mode renders with
  // `editor` — neither is a public visitor.
  useEffect(() => {
    if (!agencySlug || editor || override) return;
    try {
      let sid = localStorage.getItem("pmx_session");
      if (!sid) { sid = crypto.randomUUID(); localStorage.setItem("pmx_session", sid); }
      fetch("/api/track-home-view", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: agencySlug, sessionId: sid }),
      });
    } catch {}
  }, [agencySlug, editor, override]);

  const storefrontLang: Lang = agencyDoc?.storefrontLanguage === "ar" ? "ar" : "en";
  const lang: Lang = forcedLang ?? storefrontLang;
  const ar = lang === "ar";

  const brand: AgencyBrand = useMemo(() => brandFromUser(agencyDoc || {}, lang), [agencyDoc, lang]);
  const themeVars = useMemo(
    () => deriveBrand(brand.brandColor || DEFAULT_BRAND_COLOR, brand.accentColor),
    [brand.brandColor, brand.accentColor]
  );

  const distinctDestinations = useMemo(
    () => new Set(packages.map((p) => p.destination).filter(Boolean)).size,
    [packages]
  );
  const hasContact = !!(brand.whatsapp || brand.phone || brand.email);

  // Builder preview injects the live (unsaved) config; live routes read the
  // stored config off the agency doc — `homepage` for the home page, `aboutPage`
  // for the About page. Either way readHomepageConfig(…, page) hydrates it.
  const rawConfig = override ? override.config : (page === "about" ? agencyDoc?.aboutPage : agencyDoc?.homepage);
  const config = useMemo(
    () =>
      readHomepageConfig(rawConfig, {
        hasAbout: !!(agencyDoc?.about_en || agencyDoc?.about_ar),
        hasPackages: packages.length > 0,
        hasDestinations: distinctDestinations > 0,
        hasContact,
      }, page),
    [rawConfig, agencyDoc, packages.length, distinctDestinations, hasContact, page]
  );

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f4f0e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ borderTopColor: brand.brandColor }} />
      </div>
    );
  }

  // Site-mode chrome links: Home→root, Packages→/packages, About→/about.
  const homeHref = basePath || "/";
  const packagesHref = `${basePath}/packages`;
  const aboutHref = `${basePath}/about`;
  const reviewsHref = `${basePath}/reviews`;
  // Show the About nav link only when /about has authored content (always show it
  // while ON the About page). Otherwise hide it — never link to an empty page.
  const showAbout = page === "about" || aboutPageHasContent(agencyDoc);
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
  const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  const scrollContact = () => scrollTo("hp-contact");

  const ctx: Ctx = {
    lang, ar, m, brand, editor,
    agency: agencyDoc || {},
    packages,
    basePath,
    packagesHref,
    aboutHref,
    reviewsHref,
    waLink,
    openPkg: (id: string) => window.location.assign(`${basePath}/${id}`),
    scrollContact,
  };

  const sections = enabledSections(config);

  // Chrome nav behavior (desktop only — mobile has no nav tabs):
  //  • Home links back to root; Packages → catalog; Contact scrolls to the CTA.
  //  • About is now a dedicated page (/about) — the nav links there on every
  //    surface, and highlights when we're on it. The homepage's About SECTION
  //    stays as a story teaser whose "Read our story" link also lands on /about.
  const active: NavKey = page === "about" ? "about" : "home";

  return (
    <div className="hp" dir={ar ? "rtl" : "ltr"} lang={lang} style={{ ...(themeVars as React.CSSProperties), ["--font-display" as string]: brand.displayFont, ["--font-body" as string]: brand.bodyFont, fontFamily: brand.bodyFont }}>
      <SiteHeader
        brand={brand}
        lang={lang}
        active={active}
        packagesHref={packagesHref}
        homeHref={homeHref}
        aboutHref={aboutNavHref}
        hideKeys={hideAboutKeys}
        onSetLang={setLang}
        onNavContact={hasContact ? scrollContact : undefined}
      />
      {sections.map((s) => (
        <div key={`${s.type}-${s.order}`} id={`hp-sec-${s.type}`}>{renderSection(s, ctx)}</div>
      ))}
      <SiteFooter
        brand={brand}
        lang={lang}
        packagesHref={packagesHref}
        homeHref={homeHref}
        aboutHref={aboutNavHref}
        hideKeys={hideAboutKeys}
        onNavContact={hasContact ? scrollContact : undefined}
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

export default function Homepage({
  agencySlug,
  basePath = "",
  editor = false,
  override,
  page = "home",
}: {
  agencySlug: string;
  basePath?: string;
  /** editor=true shows labeled "appears here" placeholders for enabled-but-empty
      sections — used by the dashboard builder preview AND the agency's catalog-mode
      /home preview. The real public homepage (site mode, served at root) passes
      false so empty sections are hidden from real visitors (no dummy data). */
  editor?: boolean;
  /** Builder preview injection — render this config/agency instead of fetching. */
  override?: HomepageOverride;
  /** Which section-driven page to render — "home" (default) or "about". Selects
   *  the stored config field (homepage vs aboutPage), seed/default catalog, and
   *  the active nav item. */
  page?: HomePageKind;
}) {
  return (
    <Suspense fallback={null}>
      <HomepageInner agencySlug={agencySlug} basePath={basePath} editor={editor} override={override} page={page} />
    </Suspense>
  );
}
