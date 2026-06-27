"use client";

// Reusable long-form legal/utility page — doc-driven (terms|privacy|cookies).
// Renders AGENCY-AUTHORED content (lib/legal) inside SiteHeader/SiteFooter with
// an anchored numbered TOC, a "last updated" date, and a readable measure.
// Unauthored docs → honest empty state. Arabic-Indic numerals in AR.

import { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { collection, getDocs, query, where, doc as fsDoc, getDoc, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { withFirestoreRecovery } from "@/lib/firestore-recover";
import { deriveBrand, brandFromUser, waHref, DEFAULT_BRAND_COLOR, type AgencyBrand } from "@/lib/brand";
import { pick } from "@/lib/homepage";
import {
  readLegalDoc, legalLinksFor, legalHref, legalDocExists, DEFAULT_LEGAL_TITLE,
  formatLegalDate, type LegalType,
} from "@/lib/legal";
import SiteHeader from "./SiteHeader";
import SiteFooter from "./SiteFooter";
import CookieBanner from "./CookieBanner";
import { WaIcon } from "./icons";
import { arNum } from "./PackageCard";
import { useIsDesktop } from "./useIsDesktop";
import { useBfcacheReload, useReloadIfStuck } from "./useBfcacheReload";
import "@/app/legal.css";

type Lang = "en" | "ar";

const UI = {
  en: { eyebrow: "Legal", updated: "Last updated", toc: "On this page", notPublished: "This document hasn't been published yet.", notPublishedBody: "Check back soon, or reach the team directly.", qH: "Questions about this document?", qBody: "Reach the team directly — we're happy to explain anything here.", qCta: "Ask on WhatsApp", backHome: "Back to home" },
  ar: { eyebrow: "قانوني", updated: "آخر تحديث", toc: "في هذه الصفحة", notPublished: "لم يتم نشر هذا المستند بعد.", notPublishedBody: "عُد قريباً، أو تواصل مع الفريق مباشرة.", qH: "أسئلة حول هذا المستند؟", qBody: "تواصل مع الفريق مباشرة — يسعدنا توضيح أي شيء هنا.", qCta: "اسأل على واتساب", backHome: "العودة للرئيسية" },
} as const;

function paragraphs(text: string): string[] {
  return (text || "").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

function LegalInner({ agencySlug, basePath, docType, siteMode }: { agencySlug: string; basePath: string; docType: LegalType; siteMode: "catalog" | "site" }) {
  const searchParams = useSearchParams();
  const m = !useIsDesktop();
  useBfcacheReload(); // Back/Forward from a frozen page → reload so Firestore re-fetches

  const langParam = searchParams.get("language");
  const forcedLang: Lang | null = langParam === "ar" || langParam === "en" ? langParam : null;

  const [agencyDoc, setAgencyDoc] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);
  useReloadIfStuck(loading); // safety net for Back-restored hung fetch

  useEffect(() => {
    const load = async () => {
      if (!agencySlug) return;
      try {
        // Watchdog-wrapped so a Back/Forward-wedged Firestore stream can't hang
        // the spinner — it resets the connection and retries. Side-effect free.
        const data = await withFirestoreRecovery(async () => {
          let dd: Record<string, unknown> | null = null;
          const userSnap = await getDocs(query(collection(db, "users"), where("agencySlug", "==", agencySlug), limit(1)));
          if (!userSnap.empty) dd = userSnap.docs[0].data();
          else {
            // Fallback via a package's userId (parity with storefront resolution).
            const pkgSnap = await getDocs(query(collection(db, "packages"), where("agencySlug", "==", agencySlug), limit(1)));
            const uid = pkgSnap.docs[0] ? (pkgSnap.docs[0].data() as { userId?: string }).userId : undefined;
            if (uid) {
              const u = await getDoc(fsDoc(db, "users", uid));
              if (u.exists()) dd = u.data();
            }
          }
          return dd;
        });
        setAgencyDoc(data);
      } catch (err) {
        console.error("[Legal] Firestore error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [agencySlug]);

  const storefrontLang: Lang = agencyDoc?.storefrontLanguage === "ar" ? "ar" : "en";
  const lang: Lang = forcedLang ?? storefrontLang;
  const ar = lang === "ar";
  const L = UI[lang];

  const brand: AgencyBrand = useMemo(() => brandFromUser(agencyDoc || {}, lang), [agencyDoc, lang]);
  const themeVars = useMemo(() => deriveBrand(brand.brandColor || DEFAULT_BRAND_COLOR, brand.accentColor), [brand.brandColor, brand.accentColor]);

  const legalDoc = useMemo(() => readLegalDoc(agencyDoc, docType), [agencyDoc, docType]);
  const legalLinks = useMemo(() => legalLinksFor(agencyDoc, basePath, lang), [agencyDoc, basePath, lang]);

  if (loading) {
    return <div style={{ minHeight: "100vh", background: "#f4f0e8", display: "flex", alignItems: "center", justifyContent: "center" }}><div className="spinner" style={{ borderTopColor: brand.brandColor }} /></div>;
  }

  const rootHref = basePath || "/";
  const homeHref = siteMode === "site" ? rootHref : undefined;
  const packagesHref = siteMode === "site" ? `${basePath}/packages` : rootHref;
  // Hard navigation — see AgencyStorefront: the public site is MPA, so client-side
  // router.push desyncs App Router history and blanks the page on browser Back.
  const setLang = (l: Lang) => {
    const url = new URL(window.location.href);
    url.searchParams.set("language", l);
    window.location.assign(url.toString());
  };
  const cookieHref = legalDocExists(agencyDoc, "cookies") ? legalHref(basePath, "cookies") : undefined;
  const privacyHref = legalDocExists(agencyDoc, "privacy") ? legalHref(basePath, "privacy") : undefined;
  const waLink = brand.whatsapp ? waHref(brand.whatsapp) : null;

  const docTitle = pick(legalDoc?.title || DEFAULT_LEGAL_TITLE[docType], lang);
  const sections = legalDoc?.sections ?? [];
  const lastUpdated = legalDoc?.updatedAt ? formatLegalDate(legalDoc.updatedAt, lang) : "";

  const chrome = (children: React.ReactNode) => (
    <div className="lg" dir={ar ? "rtl" : "ltr"} lang={lang} style={{ ...(themeVars as React.CSSProperties), ["--font-display" as string]: brand.displayFont, ["--font-body" as string]: brand.bodyFont, fontFamily: brand.bodyFont }}>
      <SiteHeader brand={brand} lang={lang} active="legal" packagesHref={packagesHref} homeHref={homeHref} onSetLang={setLang} />
      {children}
      <SiteFooter brand={brand} lang={lang} packagesHref={packagesHref} homeHref={homeHref} legalLinks={legalLinks} />
      <CookieBanner brand={brand} lang={lang} cookieHref={cookieHref} privacyHref={privacyHref} />
    </div>
  );

  // Honest empty state — never fabricate legal text.
  if (!legalDoc) {
    return chrome(
      <section style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: m ? "80px 22px" : "120px 56px", textAlign: "center" }}>
        <div style={{ maxWidth: 520 }}>
          <span className="lg-eyebrow" style={{ justifyContent: "center" }}>{L.eyebrow}</span>
          <h1 style={{ fontFamily: brand.displayFont, fontSize: m ? 30 : 42, fontWeight: 600, letterSpacing: "-0.02em", margin: "16px 0 0", color: "var(--ink)" }}>{docTitle}</h1>
          <p style={{ fontSize: 16, lineHeight: 1.6, color: "var(--ink2)", margin: "16px auto 0", maxWidth: "42ch" }}>{L.notPublished}</p>
          <p style={{ fontSize: 14.5, color: "var(--ink3)", margin: "8px auto 0" }}>{L.notPublishedBody}</p>
          <a href={rootHref} style={{ display: "inline-flex", marginTop: 24, fontSize: 14.5, fontWeight: 600, color: "var(--brand-text)" }}>{L.backHome}</a>
        </div>
      </section>
    );
  }

  return chrome(
    <>
      {/* Title band */}
      <section style={{ borderBottom: "1px solid var(--rule)", background: "var(--band)" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: m ? "34px 22px 30px" : "52px 56px 44px" }}>
          <span className="lg-eyebrow">{L.eyebrow}</span>
          <h1 style={{ fontFamily: brand.displayFont, fontSize: m ? 38 : 56, fontWeight: 600, lineHeight: 1.05, letterSpacing: "-0.02em", margin: "14px 0 0", color: "var(--ink)" }}>{docTitle}</h1>
          {lastUpdated && (
            <div style={{ marginTop: 20 }}>
              <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 500, color: "var(--ink2)", background: "var(--card)", border: "1px solid #e0d6c2", padding: "7px 13px", borderRadius: 999, whiteSpace: "nowrap" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>
                {L.updated} {lastUpdated}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* Body: TOC + content */}
      <section style={{ padding: m ? "32px 0 60px" : "56px 0 92px" }}>
        <div style={{ maxWidth: 1180, margin: "0 auto", padding: `0 ${m ? 22 : 56}px`, display: "grid", gridTemplateColumns: m ? "1fr" : "248px 1fr", gap: m ? 28 : 64, alignItems: "start" }}>
          <nav style={{ position: m ? "static" : "sticky", top: 24, background: "var(--card)", border: "1px solid var(--rule2)", borderRadius: 14, padding: "22px 22px 24px" }}>
            <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.13em", textTransform: "uppercase", color: "var(--ink3)", marginBottom: 14 }}>{L.toc}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {sections.map((s, i) => (
                <a key={s.id} href={`#${s.id}`} className="lg-toc-link">
                  <span className="lg-toc-num">{arNum(String(i + 1).padStart(2, "0"), ar)}</span>
                  <span>{pick(s.title, lang)}</span>
                </a>
              ))}
            </div>
          </nav>

          <div style={{ minWidth: 0 }}>
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} style={{ scrollMarginTop: 96, paddingTop: i === 0 ? 0 : m ? 36 : 48 }}>
                <h2 style={{ fontFamily: brand.displayFont, fontSize: m ? 24 : 30, fontWeight: 600, lineHeight: 1.15, letterSpacing: "-0.015em", margin: 0, display: "flex", alignItems: "baseline", gap: 12, color: "var(--ink)" }}>
                  <span style={{ fontFamily: brand.bodyFont, fontSize: 14, fontWeight: 600, color: "var(--brand-text)" }}>{arNum(String(i + 1).padStart(2, "0"), ar)}</span>
                  {pick(s.title, lang)}
                </h2>
                {paragraphs(pick(s.body, lang)).map((p, j) => (
                  <p key={j} style={{ fontSize: m ? 15.5 : 16.5, lineHeight: 1.75, color: "#4a443a", margin: j === 0 ? "18px 0 0" : "16px 0 0", maxWidth: "68ch" }}>{p}</p>
                ))}
                {s.bullets && s.bullets.length > 0 && (
                  <ul style={{ margin: "16px 0 0", paddingInlineStart: 22, maxWidth: "66ch", display: "flex", flexDirection: "column", gap: 9 }}>
                    {s.bullets.map((b, k) => (
                      <li key={k} style={{ fontSize: m ? 15.5 : 16.5, lineHeight: 1.6, color: "#4a443a" }}>{pick(b, lang)}</li>
                    ))}
                  </ul>
                )}
              </section>
            ))}

            {waLink && (
              <div style={{ marginTop: 48, padding: "24px 26px", background: "var(--card)", border: "1px solid var(--rule2)", borderRadius: 14, display: "flex", alignItems: "center", gap: 14, flexWrap: "wrap" }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <div style={{ fontFamily: brand.displayFont, fontSize: 20, fontWeight: 600, letterSpacing: "-0.01em" }}>{L.qH}</div>
                  <div style={{ fontSize: 14, color: "var(--ink2)", marginTop: 4 }}>{L.qBody}</div>
                </div>
                <a href={waLink} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "var(--wa)", color: "#fff", fontSize: 14.5, fontWeight: 600, padding: "13px 20px", borderRadius: 11, whiteSpace: "nowrap", textDecoration: "none" }}><WaIcon size={17} />{L.qCta}</a>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

export default function LegalPage({ agencySlug, basePath = "", docType, siteMode = "catalog" }: { agencySlug: string; basePath?: string; docType: LegalType; siteMode?: "catalog" | "site" }) {
  return (
    <Suspense fallback={null}>
      <LegalInner agencySlug={agencySlug} basePath={basePath} docType={docType} siteMode={siteMode} />
    </Suspense>
  );
}
