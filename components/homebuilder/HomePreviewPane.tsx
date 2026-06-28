"use client";

// Live homepage preview — renders the REAL Homepage renderer (editor=true) in an
// iframe at /home-preview, fed the builder's unsaved state via postMessage +
// localStorage. Mirrors the package builder's LivePreviewIframe. EN/AR toggle +
// open-full-desktop-in-tab. Desktop browser-chrome frame (a virtual desktop
// viewport scaled to fit the rail).

import { useCallback, useEffect, useRef } from "react";
import type { HomepageConfig, HomePageKind } from "@/lib/homepage";
import { DA_DARK, DA_GOLD } from "@/lib/tokens";

const SANS = `var(--font-sans)`;
const MONO = `var(--font-mono, ui-monospace, monospace)`;
const STORAGE_KEY = "pmx_home_preview_draft";
const DEBOUNCE_MS = 500;

// Render the homepage at a virtual desktop width, scaled down to fit the rail.
const DESKTOP_VW = 1180;
const CONTAINER_W = 452;
const CONTAINER_H = 600;
const DESKTOP_SCALE = CONTAINER_W / DESKTOP_VW;
const IFRAME_H = Math.ceil(CONTAINER_H / DESKTOP_SCALE);

export function HomePreviewPane({
  config, agency, agencySlug, lang, onLangChange, page = "home",
}: {
  config: HomepageConfig;
  agency: Record<string, unknown>;
  agencySlug: string;
  lang: "en" | "ar";
  onLangChange: (l: "en" | "ar") => void;
  /** Which page the preview renders — "home" (default) or "about". */
  page?: HomePageKind;
}) {
  const isAr = lang === "ar";
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const iframeReady = useRef(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const buildMsg = useCallback(() => ({
    type: "homepagePreview" as const,
    config,
    agency: { ...agency, storefrontLanguage: lang },
    agencySlug,
    page,
  }), [config, agency, agencySlug, lang, page]);

  const push = useCallback(() => {
    const msg = buildMsg();
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(msg)); } catch {}
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) iframe.contentWindow.postMessage(msg, "*");
  }, [buildMsg]);

  const pushRef = useRef(push);
  useEffect(() => { pushRef.current = push; }, [push]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { if (iframeReady.current) push(); }, DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [push]);

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.data?.type === "previewReady") {
        iframeReady.current = true;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        pushRef.current();
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // Open the REAL homepage route (not the synthetic /home-preview) so every
  // in-page link — packages, package cards, legal, language toggle — resolves
  // against real routes. /{slug}/home is the catalog-mode homepage preview
  // (editor placeholders); once the agency flips to site mode it redirects to
  // root. Reflects the EN/AR toggle via ?language=. Falls back to /home-preview
  // only for a brand-new agency with no slug yet.
  const openDesktop = () => {
    const slug = agencySlug && agencySlug !== "preview" ? agencySlug : null;
    if (slug) {
      window.open(`/${slug}/${page}?language=${lang}`, "_blank", "noopener,noreferrer");
      return;
    }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(buildMsg())); } catch {}
    window.open("/home-preview", "_blank", "noopener,noreferrer");
  };

  const host = `${agencySlug || "preview"}.packmetrix.com`;

  return (
    <div style={{ width: CONTAINER_W + 22, background: DA_DARK, borderRadius: 14, padding: 11, display: "flex", flexDirection: "column", gap: 9, boxShadow: "0 24px 60px -20px rgba(0,0,0,.4)" }}>
      {/* Browser chrome bar */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "0 4px" }}>
        <div style={{ display: "flex", gap: 5, flexShrink: 0 }}>
          {["#ff5f57", "#febc2e", "#28c840"].map((c) => (
            <span key={c} style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{ flex: 1, minWidth: 0, height: 22, borderRadius: 6, background: "rgba(255,255,255,.08)", display: "flex", alignItems: "center", gap: 6, padding: "0 10px" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#39d353", flexShrink: 0 }} />
          <span style={{ fontFamily: MONO, fontSize: 9.5, color: "rgba(255,255,255,.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{host}</span>
        </div>
        <div style={{ display: "flex", gap: 2, padding: 2, background: "rgba(255,255,255,.06)", borderRadius: 6, flexShrink: 0 }}>
          {(["en", "ar"] as const).map((ln) => (
            <button key={ln} onClick={() => onLangChange(ln)} style={{
              minWidth: 26, height: 20, borderRadius: 4, border: "none", cursor: "pointer",
              fontFamily: SANS, fontSize: 11, fontWeight: 600,
              background: lang === ln ? DA_GOLD : "transparent",
              color: lang === ln ? "#fff" : "rgba(255,255,255,.5)",
            }}>{ln === "en" ? "EN" : "ع"}</button>
          ))}
          <button onClick={openDesktop} title={isAr ? "فتح بالحجم الكامل" : "Open full-size desktop preview"} style={{ width: 24, height: 20, borderRadius: 4, background: "transparent", color: "rgba(255,255,255,.55)", border: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </button>
        </div>
      </div>

      <div dir="ltr" style={{ width: CONTAINER_W, height: CONTAINER_H, overflow: "hidden", borderRadius: 9, background: "#f4f0e8", flexShrink: 0, boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)" }}>
        <iframe
          ref={iframeRef}
          src="/home-preview"
          style={{ width: DESKTOP_VW, height: IFRAME_H, border: "none", transform: `scale(${DESKTOP_SCALE})`, transformOrigin: "top left", display: "block" }}
          title="Homepage preview"
        />
      </div>
    </div>
  );
}
