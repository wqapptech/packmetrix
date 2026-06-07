"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import PackageRenderer from "@/components/PackageRenderer";
import type { TPackage, TAgency, Lang } from "@/components/templates/types";
import { normalizePkg } from "@/lib/sections/normalize";

const STORAGE_KEY = "pmx_preview_draft";
const DEFAULT_BRAND = "#1f5f8e";

type PreviewState = {
  pkg: TPackage;
  agency: TAgency;
  lang: Lang;
  templateId: string;
};


function buildState(
  payload: unknown,
  tplId: string,
  agencyData: Record<string, unknown> | null
): PreviewState | null {
  try {
    const raw = { ...(payload as object), templateId: tplId } as unknown as TPackage;
    const normalized = normalizePkg(raw);
    const lang: Lang = normalized.primaryLanguage === "ar" ? "ar" : "en";
    const agency: TAgency = agencyData
      ? {
          name: String(agencyData.name || "Travel Agency"),
          tagline: String(agencyData.tagline || ""),
          logoUrl: String(agencyData.logoUrl || ""),
          brandColor: String(agencyData.brandColor || DEFAULT_BRAND),
          activeTemplate: tplId,
          agencySlug: String(agencyData.agencySlug || "preview"),
          enableReviews: Boolean(agencyData.enableReviews),
          showReviews: agencyData.showReviews !== false,
        }
      : {
          name: "Travel Agency",
          brandColor: DEFAULT_BRAND,
          activeTemplate: tplId,
          agencySlug: "preview",
          enableReviews: false,
          showReviews: false,
        };
    return { pkg: normalized, agency, lang, templateId: tplId };
  } catch (e) {
    console.error("[preview] normalizePkg error:", e);
    return null;
  }
}

export default function PreviewPage() {
  const [state, setState] = useState<PreviewState | null>(null);
  const lastHighlightedEl = useRef<Element | null>(null);
  const highlightTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Highlight an element — clears the previous highlight first to avoid stacking
  const applyHighlight = useCallback((el: Element) => {
    if (lastHighlightedEl.current && lastHighlightedEl.current !== el) {
      lastHighlightedEl.current.classList.remove("pmx-section-highlight");
    }
    if (highlightTimer.current) clearTimeout(highlightTimer.current);
    lastHighlightedEl.current = el;
    el.classList.remove("pmx-section-highlight");
    void (el as HTMLElement).offsetHeight; // reflow to restart animation
    el.classList.add("pmx-section-highlight");
    highlightTimer.current = setTimeout(() => {
      el.classList.remove("pmx-section-highlight");
      lastHighlightedEl.current = null;
    }, 1400);
  }, []);

  // ── postMessage handler (iframe mode from builder) ────────────────────────
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;

      if (e.data.type === "previewData") {
        const s = buildState(e.data.payload, e.data.templateId, e.data.agency ?? null);
        if (s) setState(s);
      }

      if (e.data.type === "scrollToSection") {
        const key = String(e.data.key ?? "");
        const el = document.querySelector(`[data-pmx-section="${key}"]`);
        if (el) {
          const rect = el.getBoundingClientRect();
          const inView = rect.top >= 0 && rect.bottom <= window.innerHeight;
          if (!inView) el.scrollIntoView({ behavior: "smooth", block: "start" });
          applyHighlight(el);
          try { window.parent.postMessage({ type: "sectionFound", key }, "*"); } catch {}
        } else {
          try { window.parent.postMessage({ type: "sectionNotFound", key }, "*"); } catch {}
        }
      }

      if (e.data.type === "scrollToField") {
        const key = String(e.data.key ?? "");
        const el = document.querySelector(`[data-pmx-field="${key}"]`);
        if (el) {
          const rect = el.getBoundingClientRect();
          const inView = rect.top >= 0 && rect.bottom <= window.innerHeight;
          if (!inView) el.scrollIntoView({ behavior: "smooth", block: "center" });
          applyHighlight(el);
        }
        // No sectionNotFound — field misses are always silent
      }
    };
    window.addEventListener("message", onMessage);
    // Signal parent that the message listener is ready — fixes the race condition
    // where handleIframeLoad fires before React hydration registers this listener.
    try { window.parent.postMessage({ type: "previewReady" }, "*"); } catch {}
    return () => window.removeEventListener("message", onMessage);
  }, [applyHighlight]);

  // ── localStorage handler (both standalone and iframe mode) ────────────────
  useEffect(() => {
    if (typeof window === "undefined") return;

    const readFromStorage = () => {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      try {
        const { payload, templateId, agency } = JSON.parse(raw);
        const s = buildState(payload, templateId, agency ?? null);
        if (s) setState(s);
      } catch {}
    };

    readFromStorage();

    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) readFromStorage();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ── Notify builder when user manually scrolls (suppresses auto-follow) ────
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const onScroll = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        try { window.parent.postMessage({ type: "userScrolled" }, "*"); } catch {}
      }, 200);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (timer) clearTimeout(timer);
    };
  }, []);

  return (
    <>
      <style>{`
        @keyframes pmx-section-flash {
          0%   { box-shadow: inset 0 0 0 3px #b08a3e, 0 0 0 4px rgba(176,138,62,.25); }
          70%  { box-shadow: inset 0 0 0 3px #b08a3e, 0 0 0 4px rgba(176,138,62,.25); }
          100% { box-shadow: none; }
        }
        .pmx-section-highlight {
          animation: pmx-section-flash 1.4s ease-out forwards;
        }
      `}</style>

      {!state ? (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#fdfcf9" }}>
          <div style={{ textAlign: "center", opacity: 0.45, fontSize: 13, fontFamily: "system-ui, sans-serif" }}>
            Preview loading…
          </div>
        </div>
      ) : (
        <PackageRenderer
          pkg={state.pkg}
          agency={state.agency}
          lang={state.lang}
          templateId={state.templateId}
          onWhatsApp={() => {}}
          onMessenger={() => {}}
        />
      )}
    </>
  );
}
