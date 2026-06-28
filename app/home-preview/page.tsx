"use client";

// Dashboard homepage-builder preview surface. Renders the REAL Homepage renderer
// with editor=true (so enabled-but-empty sections show labeled placeholders),
// fed the builder's unsaved state via postMessage + localStorage. Mirrors the
// package builder's /preview route. NOT a public route — slug "home-preview" is
// reserved like /preview, /builder, /profile.

import { useEffect, useState } from "react";
import Homepage, { type HomepageOverride } from "@/components/site/Homepage";
import type { HomePageKind } from "@/lib/homepage";

const STORAGE_KEY = "pmx_home_preview_draft";

type PreviewState = {
  agencySlug: string;
  override: HomepageOverride;
  page: HomePageKind;
};

function buildState(raw: unknown): PreviewState | null {
  if (!raw || typeof raw !== "object") return null;
  const { config, agency, agencySlug, page } = raw as {
    config?: unknown;
    agency?: Record<string, unknown> | null;
    agencySlug?: string;
    page?: HomePageKind;
  };
  return {
    agencySlug: String(agencySlug || "preview"),
    override: { config, agencyDoc: agency ?? null },
    page: page === "about" ? "about" : "home",
  };
}

export default function HomePreviewPage() {
  const [state, setState] = useState<PreviewState | null>(null);

  // postMessage handler (iframe mode from the builder)
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;
      if (e.data.type === "homepagePreview") {
        const s = buildState(e.data);
        if (s) setState(s);
      }
    };
    window.addEventListener("message", onMessage);
    // Signal the builder that our listener is ready (fixes load/hydration race).
    try { window.parent.postMessage({ type: "previewReady" }, "*"); } catch {}
    return () => window.removeEventListener("message", onMessage);
  }, []);

  // localStorage handler (standalone desktop tab + cross-tab sync)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const read = () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try {
        const s = buildState(JSON.parse(raw));
        if (s) setState(s);
      } catch {}
    };
    read();
    const onStorage = (e: StorageEvent) => { if (e.key === STORAGE_KEY) read(); };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return (
    <>
      <style>{`::-webkit-scrollbar { width: 0; height: 0; } html { scrollbar-width: none; }`}</style>
      {!state ? (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f4f0e8" }}>
          <div style={{ opacity: 0.45, fontSize: 13, fontFamily: "system-ui, sans-serif" }}>Preview loading…</div>
        </div>
      ) : (
        <Homepage
          agencySlug={state.agencySlug}
          basePath=""
          editor
          override={state.override}
          page={state.page}
        />
      )}
    </>
  );
}
