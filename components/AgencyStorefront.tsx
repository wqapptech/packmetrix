"use client";

// Agency storefront — slim catalog (matches the locked "Storefront" design):
//   SiteHeader → page title → filter/sort → package grid → WhatsApp CTA → SiteFooter
//
// Shared chrome (SiteHeader/SiteFooter) replaces the storefront's old
// header/footer/contact band. The big hero, about, why-us, services and
// testimonials moved to the (future) homepage. Render from real data only —
// honest empty state when filters match nothing.
//
// RTL: dir/lang on root + logical CSS properties. Arabic-Indic numerals on all
// prices / nights / counts.

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { collection, getDocs, query, where, doc, getDoc, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { withFirestoreRecovery } from "@/lib/firestore-recover";
import { deriveBrand, brandFromUser, waHref, DEFAULT_BRAND_COLOR, type AgencyBrand } from "@/lib/brand";
import SiteHeader, { type NavKey } from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import PackageCard, { arNum } from "@/components/site/PackageCard";
import CookieBanner from "@/components/site/CookieBanner";
import { WaIcon } from "@/components/site/icons";
import { useIsDesktop } from "@/components/site/useIsDesktop";
import { useBfcacheReload, useReloadIfStuck } from "@/components/site/useBfcacheReload";
import { legalLinksFor, legalDocExists, legalHref } from "@/lib/legal";
import { aboutPageHasContent } from "@/lib/homepage";
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
  primaryLanguage?: string;
  featured?: boolean;
  createdAt?: number;
  userId?: string;
};

type Lang = "en" | "ar";
type SortKey = "featured" | "price" | "nights";

// ── Translations ───────────────────────────────────────────────────────────

const T = {
  en: {
    eyebrow: "Catalog",
    title: "Our Trips",
    subtitle:
      "Every journey we currently offer. Filter by destination, sort to taste, and message us to tailor any of them.",
    all: "All",
    sortLabel: "Sort",
    sortFeatured: "Featured",
    sortPrice: "Price: low to high",
    sortNights: "Nights: short to long",
    from: "From",
    pp: "/ person",
    nights: "nights",
    view: "View",
    featuredTag: "Featured",
    trip: (n: string) => `${n} trip`,
    trips: (n: string) => `${n} trips`,
    emptyH: "No trips match yet.",
    emptyBody:
      "We design custom journeys all the time — tell us what you have in mind and we'll plan it.",
    emptyCta: "Plan a custom trip",
    ctaH: "Don't see your trip?",
    ctaBody: "Tell us your dates and who's travelling — we'll design it around you.",
    ctaWa: "Message on WhatsApp",
    ctaEmail: "Send an email",
  },
  ar: {
    eyebrow: "الكتالوج",
    title: "رحلاتنا",
    subtitle:
      "كل الرحلات التي نقدّمها حالياً. صفِّ حسب الوجهة، ورتّب كما تحب، وراسلنا لتخصيص أيٍّ منها.",
    all: "الكل",
    sortLabel: "ترتيب",
    sortFeatured: "مختارة",
    sortPrice: "السعر: من الأقل",
    sortNights: "الليالي: من الأقصر",
    from: "من",
    pp: "/ شخص",
    nights: "ليالٍ",
    view: "عرض",
    featuredTag: "مختارة",
    trip: (n: string) => `${n} رحلة`,
    trips: (n: string) => `${n} رحلة`,
    emptyH: "لا توجد رحلات مطابقة بعد.",
    emptyBody: "نصمّم رحلات مخصّصة دائماً — أخبرنا بما يدور في بالك وسنخطّط له.",
    emptyCta: "خطّط رحلة مخصّصة",
    ctaH: "لم تجد رحلتك؟",
    ctaBody: "أخبرنا بمواعيدك ومن سيسافر — وسنصمّمها حولك.",
    ctaWa: "راسلنا على واتساب",
    ctaEmail: "أرسل بريداً",
  },
} as const;

// ── Helpers ──────────────────────────────────────────────────────────────────

function isActive(pkg: Package): boolean {
  if (pkg.status === "draft") return false;
  if (pkg.isActive === false) return false;
  return true;
}

function priceValue(p: Package): number {
  const n = Number(String(p.price).replace(/[^\d.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}
function nightsValue(p: Package): number {
  const n = Number(p.nights);
  return Number.isFinite(n) ? n : 0;
}

// ── Spinner ────────────────────────────────────────────────────────────────

function Spinner({ brand }: { brand: string }) {
  return (
    <div style={{ minHeight: "100vh", background: "#f4f0e8", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner" style={{ borderTopColor: brand }} />
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────

function StorefrontInner({ agencySlug, basePath, siteMode }: { agencySlug: string; basePath: string; siteMode: "catalog" | "site" }) {
  const searchParams = useSearchParams();
  const m = !useIsDesktop();
  useBfcacheReload(); // Back/Forward from a frozen page → reload so Firestore re-fetches

  const langParam = searchParams.get("language");
  const forcedLang: Lang | null = langParam === "ar" || langParam === "en" ? langParam : null;
  // Optional deep-link from the homepage country tiles: /packages?destination=هولندا
  const destParam = searchParams.get("destination");

  const [packages, setPackages] = useState<Package[]>([]);
  const [agencyDoc, setAgencyDoc] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  useReloadIfStuck(loading); // safety net: a Back-restored page whose fetch hangs reloads once

  const [dest, setDest] = useState<string>(destParam?.trim() || "all");
  const [sort, setSort] = useState<SortKey>("featured");

  useEffect(() => {
    const load = async () => {
      if (!agencySlug) return;
      try {
        // Reads run under a watchdog that resets a Back/Forward-wedged Firestore
        // stream and retries, so the spinner can't hang forever. Side-effect free
        // — setState happens on the resolved result below.
        const { docData, active } = await withFirestoreRecovery(async () => {
          const snap = await getDocs(
            query(collection(db, "packages"), where("agencySlug", "==", agencySlug))
          );
          const all = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Package));

          // Resolve the agency profile: primary via a package's userId, fallback by slug.
          let dd: Record<string, unknown> | null = null;
          const firstDoc = snap.docs[0];
          const userId = firstDoc ? (firstDoc.data() as { userId?: string }).userId : undefined;
          if (userId) {
            const userSnap = await getDoc(doc(db, "users", userId));
            if (userSnap.exists()) dd = userSnap.data();
          }
          if (!dd) {
            const userSnap = await getDocs(
              query(collection(db, "users"), where("agencySlug", "==", agencySlug), limit(1))
            );
            if (!userSnap.empty) dd = userSnap.docs[0].data();
          }

          const storefrontLang: Lang = dd?.storefrontLanguage === "ar" ? "ar" : "en";
          const sfLang: Lang = forcedLang ?? storefrontLang;
          const act = all
            .filter(isActive)
            .filter((p) => (p.primaryLanguage || p.language || "en") === sfLang)
            .sort((a, b) => {
              const fa = a.featured ? 1 : 0;
              const fb = b.featured ? 1 : 0;
              if (fa !== fb) return fb - fa;
              return (a.createdAt || 0) - (b.createdAt || 0);
            });
          return { docData: dd, active: act };
        });

        setAgencyDoc(docData);
        setPackages(active);
      } catch (err) {
        console.error("[Storefront] Firestore error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [agencySlug, forcedLang]);

  const storefrontLang: Lang = agencyDoc?.storefrontLanguage === "ar" ? "ar" : "en";
  const lang: Lang = forcedLang ?? storefrontLang;
  const ar = lang === "ar";
  const L = T[lang];

  const brand: AgencyBrand = useMemo(
    () => brandFromUser(agencyDoc || {}, lang),
    [agencyDoc, lang]
  );
  const themeVars = useMemo(
    () => deriveBrand(brand.brandColor || DEFAULT_BRAND_COLOR, brand.accentColor),
    [brand.brandColor, brand.accentColor]
  );

  // Distinct destinations → filter pills (only worth showing when >1).
  const destinations = useMemo(
    () => Array.from(new Set(packages.map((p) => p.destination).filter(Boolean))),
    [packages]
  );

  const filtered = useMemo(() => {
    let list = dest === "all" ? packages : packages.filter((p) => p.destination === dest);
    if (sort === "price") list = [...list].sort((a, b) => priceValue(a) - priceValue(b));
    else if (sort === "nights") list = [...list].sort((a, b) => nightsValue(a) - nightsValue(b));
    return list;
  }, [packages, dest, sort]);

  if (loading) return <Spinner brand={brand.brandColor} />;

  const n = filtered.length;
  const countLabel = ar ? L.trips(arNum(n, true)) : n === 1 ? L.trip(String(n)) : L.trips(String(n));

  // Nav resolution by mode. site: Home→root (homepage), Packages→/packages.
  // catalog: Home muted (no homepage), Packages→root (the storefront itself).
  const rootHref = basePath || "/";
  const homeHref = siteMode === "site" ? rootHref : undefined;
  const packagesHref = siteMode === "site" ? `${basePath}/packages` : rootHref;
  // About lives at /about in both modes, but only when the agency has authored
  // real About content — otherwise the nav item is hidden (not muted).
  const showAbout = aboutPageHasContent(agencyDoc);
  const aboutHref = showAbout ? `${basePath}/about` : undefined;
  const hideKeys: NavKey[] | undefined = showAbout ? undefined : ["about"];
  // Hard navigation (not router.push): the public site is MPA — chrome links are
  // plain <a>. Mixing client-side router.push here desyncs the App Router history
  // cache and blanks the page on browser Back. window.location keeps one model.
  const setLang = (l: Lang) => {
    const url = new URL(window.location.href);
    url.searchParams.set("language", l);
    window.location.assign(url.toString());
  };
  const scrollToContact = () => {
    document.getElementById("sf-contact")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const hasWa = !!brand.whatsapp;
  const hasEmail = !!brand.email;
  const showCta = hasWa || hasEmail;
  const waLink = hasWa ? waHref(brand.whatsapp!) : null;

  const legalLinks = legalLinksFor(agencyDoc, basePath, lang);
  const cookieHref = legalDocExists(agencyDoc, "cookies") ? legalHref(basePath, "cookies") : undefined;
  const privacyHref = legalDocExists(agencyDoc, "privacy") ? legalHref(basePath, "privacy") : undefined;

  return (
    <div
      className="sf"
      dir={ar ? "rtl" : "ltr"}
      lang={lang}
      style={{ ...(themeVars as React.CSSProperties), ["--font-display" as string]: brand.displayFont, ["--font-body" as string]: brand.bodyFont, fontFamily: brand.bodyFont }}
    >
      <SiteHeader
        brand={brand}
        lang={lang}
        active="packages"
        packagesHref={packagesHref}
        homeHref={homeHref}
        aboutHref={aboutHref}
        hideKeys={hideKeys}
        onSetLang={setLang}
        onNavContact={showCta ? scrollToContact : undefined}
      />

      {/* ── Page title ── */}
      <section className="sf-titlebar">
        <div className="sf-wrap">
          <span className="sf-eyebrow">{L.eyebrow}</span>
          <h1 className="sf-serif sf-title" style={{ fontSize: m ? 40 : 62 }}>
            {L.title}
          </h1>
          <p className="sf-sub" style={{ fontSize: m ? 15 : 17 }}>
            {L.subtitle}
          </p>
        </div>
      </section>

      {/* ── Filter / sort bar ── */}
      <section className="sf-filterbar">
        <div className="sf-wrap sf-filterbar__inner">
          <div className="sf-pills">
            {destinations.length > 1 && (
              <>
                <button
                  className={`sf-pill${dest === "all" ? " is-on" : ""}`}
                  onClick={() => setDest("all")}
                >
                  {L.all}
                </button>
                {destinations.map((d) => (
                  <button
                    key={d}
                    className={`sf-pill${dest === d ? " is-on" : ""}`}
                    onClick={() => setDest(d)}
                  >
                    {d}
                  </button>
                ))}
              </>
            )}
          </div>
          <div className="sf-sortwrap">
            <span className="sf-sortlabel">{L.sortLabel}</span>
            <select
              className="sf-select"
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="featured">{L.sortFeatured}</option>
              <option value="price">{L.sortPrice}</option>
              <option value="nights">{L.sortNights}</option>
            </select>
          </div>
        </div>
      </section>

      {/* ── Grid ── */}
      <section className="sf-gridsec">
        <div className="sf-wrap">
          <div className="sf-count">{countLabel}</div>
          {n > 0 ? (
            <div className="sf-grid">
              {filtered.map((p) => (
                <PackageCard
                  key={p.id}
                  pkg={p}
                  lang={lang}
                  onOpen={() => window.location.assign(`${basePath}/${p.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className="sf-empty">
              <h3 className="sf-serif sf-empty__h">{L.emptyH}</h3>
              <p className="sf-empty__p">{L.emptyBody}</p>
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="sf-wa-solid sf-empty__cta">
                  <WaIcon size={18} /> {L.emptyCta}
                </a>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Contact / WhatsApp CTA ── */}
      {showCta && (
        <section id="sf-contact" className="sf-cta">
          <div className="sf-wrap sf-cta__inner">
            <div className="sf-cta__copy">
              <h2 className="sf-serif sf-cta__h" style={{ fontSize: m ? 30 : 40 }}>
                {L.ctaH}
              </h2>
              <p className="sf-cta__body">{L.ctaBody}</p>
            </div>
            <div className="sf-cta__btns">
              {waLink && (
                <a href={waLink} target="_blank" rel="noopener noreferrer" className="sf-wa-solid">
                  <WaIcon size={18} /> {L.ctaWa}
                </a>
              )}
              {hasEmail && (
                <a href={`mailto:${brand.email}`} className="sf-ghost-btn">
                  {L.ctaEmail}
                </a>
              )}
            </div>
          </div>
        </section>
      )}

      <SiteFooter
        brand={brand}
        lang={lang}
        packagesHref={packagesHref}
        homeHref={homeHref}
        aboutHref={aboutHref}
        hideKeys={hideKeys}
        onNavContact={showCta ? scrollToContact : undefined}
        legalLinks={legalLinks}
      />

      {/* Mobile WhatsApp FAB — kept (does not conflict with the header icon CTA) */}
      {m && waLink && (
        <a href={waLink} target="_blank" rel="noopener noreferrer" className="sf-fab" aria-label={L.ctaWa}>
          <WaIcon size={26} />
        </a>
      )}

      <CookieBanner brand={brand} lang={lang} cookieHref={cookieHref} privacyHref={privacyHref} />
    </div>
  );
}

export default function AgencyStorefront({
  agencySlug,
  basePath = "",
  siteMode = "catalog",
}: {
  agencySlug: string;
  basePath?: string;
  /** "catalog" = storefront at root (default, today's behavior); "site" = homepage at root, storefront at /packages. Drives nav only. */
  siteMode?: "catalog" | "site";
}) {
  return (
    <Suspense fallback={null}>
      <StorefrontInner agencySlug={agencySlug} basePath={basePath} siteMode={siteMode} />
    </Suspense>
  );
}
