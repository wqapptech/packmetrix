"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { TAgency } from "@/components/templates/types";
import type { CoreForm, AnySectionInstance } from "@/lib/sections/types";
import { TEMPLATES } from "@/components/templates";
import { DA_DARK, DA_GOLD } from "@/lib/tokens";

const SANS = `var(--font-sans)`;
const STORAGE_KEY = "pmx_preview_draft";
const DEBOUNCE_MS = 600;

// Phone viewport (standard mobile template render width)
const PHONE_W = 390;
const CONTAINER_W = 320;
const CONTAINER_H = 540;
const PHONE_SCALE = CONTAINER_W / PHONE_W; // ≈ 0.82
const IFRAME_H = Math.ceil(CONTAINER_H / PHONE_SCALE); // height before scaling


// ─── Converts builder state into a TPackage-compatible wire payload ────────────

export type PreviewPackageCard = {
  title: string;
  destination: string;
  price: string;
  nights: string;
  image: string;
  link: string;
};

function toPreviewPayload(
  core: CoreForm,
  sections: AnySectionInstance[],
  templateId: string,
  otherPackages: PreviewPackageCard[],
): Record<string, unknown> {
  type ArrStr = string[];
  const get = <T,>(type: string): T | undefined =>
    sections.find((s) => s.type === type)?.data as T | undefined;

  const inclusions = get<{ includes: ArrStr; excludes: ArrStr }>("inclusions");
  const itinerary  = get<{ days: Record<string, unknown>[] }>("itinerary");
  const pricing    = get<{ tiers: { label: string; price: string }[]; cancellation: string }>("pricing");
  const mediaSec   = get<{ images?: ArrStr; videoUrl?: string }>("media");
  const peopleSec  = get<{ people: Array<Record<string, unknown>> }>("people");
  const depSec     = get<{ entries: Array<Record<string, unknown>> }>("departures");
  const scarcitySec = get<{ wasPrice: string; spotsRemaining: number; totalSpots: number }>("scarcity");

  const firstPerson = peopleSec?.people?.[0];
  const agent = firstPerson
    ? {
        name:      String(firstPerson.name      ?? ""),
        role:      String(firstPerson.role      ?? "agent"),
        ...(firstPerson.photo     ? { avatar:    String(firstPerson.photo) }     : {}),
        ...(firstPerson.years     ? { years:     Number(firstPerson.years) }     : {}),
        ...(firstPerson.repliesIn ? { repliesIn: String(firstPerson.repliesIn) } : {}),
      }
    : null;

  const legacyDepartures = (depSec?.entries ?? [])
    .filter((e) => e.date)
    .map((e) => ({
      date:  String(e.date  ?? ""),
      spots: Number(e.spots) || 0,
      ...(e.price ? { price: String(e.price) } : {}),
    }));

  const airports = (depSec?.entries ?? [])
    .filter((e) => e.origin)
    .map((e) => ({
      name:            String(e.origin           ?? ""),
      price:           String(e.price            ?? ""),
      ...(e.date            ? { date:            String(e.date) }            : {}),
      ...(e.arrivingAirport ? { arrivingAirport: String(e.arrivingAirport) } : {}),
      ...(e.flyingTime      ? { flyingTime:      String(e.flyingTime) }      : {}),
      ...(e.arrivingTime    ? { arrivingTime:    String(e.arrivingTime) }    : {}),
    }));

  // other_packages is auto-populated from the agency's other active packages
  // at render time on the live page (see app/[agencySlug]/[packageId]/page.tsx).
  // The builder preview has no such fetch, so inject the agency's real packages
  // (fetched by the builder and passed in) so the section mirrors the live page.
  const previewSections = otherPackages.length && sections.some((s) => s.type === "other_packages")
    ? sections.map((s) =>
        s.type === "other_packages"
          ? { ...s, data: { ...(s.data ?? {}), packages: otherPackages } }
          : s,
      )
    : sections;

  return {
    id:              "preview",
    templateId,
    title:           { en: core.titleEn, ar: core.titleAr },
    description:     { en: core.descriptionEn, ar: core.descriptionAr },
    destination:     core.destination,
    price:           core.price,
    currency:        core.currency || undefined,
    nights:          core.nights,
    primaryLanguage: core.primaryLanguage,
    language:        core.primaryLanguage,
    whatsapp:        core.whatsapp,
    messenger:       core.messenger,
    coverImage:      core.coverImage,
    includes:        inclusions?.includes  ?? [],
    excludes:        inclusions?.excludes  ?? [],
    itinerary:       itinerary?.days       ?? [],
    pricingTiers:    pricing?.tiers        ?? [],
    cancellation:    pricing?.cancellation ?? "",
    images:          mediaSec?.images      ?? [],
    videoUrl:        mediaSec?.videoUrl    ?? "",
    airports,
    sections: previewSections,
    ...(agent              ? { agent }                                     : { agent: null }),
    ...(scarcitySec        ? {
                               priceWas:       scarcitySec.wasPrice,
                               spotsRemaining: scarcitySec.spotsRemaining,
                               totalSpots:     scarcitySec.totalSpots,
                             }                                             : {}),
    ...(legacyDepartures.length ? { departures: legacyDepartures }        : {}),
  };
}

// ─── Main component ────────────────────────────────────────────────────────────

export function LivePreviewIframe({
  core,
  sections,
  lang,
  templateId,
  agency,
  otherPackages = [],
  phoneOnly = false,
  activeSection,
  activeField,
}: {
  core: CoreForm;
  sections: AnySectionInstance[];
  lang: "en" | "ar";
  templateId: string;
  agency: TAgency | null;
  otherPackages?: PreviewPackageCard[];
  phoneOnly?: boolean;
  activeSection?: string | null;
  activeField?: string | null;
}) {
  const [updating, setUpdating] = useState(false);
  const [tooltip, setTooltip]   = useState<string | null>(null);
  const [autoFollow, setAutoFollow] = useState(true);
  const iframeRef  = useRef<HTMLIFrameElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const iframeReady = useRef(false);
  const suppressAutoFollowUntil = useRef(0);
  const isAr = lang === "ar";

  const tpl           = TEMPLATES.find((t) => t.id === templateId);
  const templateLabel = isAr ? (tpl?.nameAr ?? templateId) : (tpl?.name ?? templateId);
  const templateTarget = isAr ? (tpl?.targetAr ?? "") : (tpl?.target ?? "");

  // ── Serialize agency for postMessage / localStorage ───────────────────────
  const agencyMsg = agency
    ? {
        name:          agency.name,
        tagline:       agency.tagline ?? "",
        logoUrl:       agency.logoUrl ?? "",
        brandColor:    agency.brandColor ?? "#1f5f8e",
        agencySlug:    agency.agencySlug ?? "preview",
        enableReviews: agency.enableReviews ?? false,
        showReviews:   agency.showReviews   ?? true,
      }
    : null;

  // ── Build & dispatch preview payload ─────────────────────────────────────
  const pushPreview = useCallback(() => {
    const payload = toPreviewPayload(core, sections, templateId, otherPackages);
    const msg     = { payload, templateId, agency: agencyMsg };

    // Persist to localStorage so the desktop new-tab view can read it
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(msg)); } catch {}

    // Push into the iframe
    const iframe = iframeRef.current;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage({ type: "previewData", ...msg }, "*");
    }
    setUpdating(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [core, sections, templateId, agency, otherPackages]);

  // ── Keep a stable ref to pushPreview so the message handler never goes stale ─
  const pushPreviewRef = useRef(pushPreview);
  useEffect(() => { pushPreviewRef.current = pushPreview; }, [pushPreview]);

  // ── Debounce on any state change ─────────────────────────────────────────
  useEffect(() => {
    setUpdating(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      if (iframeReady.current) pushPreview();
      // If iframe not ready yet, previewReady signal from preview page will trigger pushPreview
    }, DEBOUNCE_MS);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [core, sections, templateId, agency, pushPreview]);

  // ── iframe onLoad — marks the iframe DOM as loaded (React may not be hydrated yet) ──
  const handleIframeLoad = useCallback(() => {
    setUpdating(false);
    // Don't call pushPreview here — wait for previewReady signal from the page
    // to avoid sending before the message listener is registered.
  }, []);

  // ── Single stable message handler ────────────────────────────────────────
  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (!e.data || typeof e.data !== "object") return;

      if (e.data.type === "previewReady") {
        // Preview page's React has hydrated and its listener is active
        iframeReady.current = true;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        pushPreviewRef.current();
      }

      if (e.data.type === "sectionNotFound") {
        setTooltip(
          e.data.lang === "ar" || isAr
            ? "هذا القسم فارغ — أضف محتوى لرؤيته"
            : "This section is empty — add content to see it"
        );
        setTimeout(() => setTooltip(null), 3000);
      }

      if (e.data.type === "userScrolled") {
        suppressAutoFollowUntil.current = Date.now() + 4000;
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // stable — uses pushPreviewRef to avoid stale closures

  // ── Auto-follow: section-level (debounced 200ms to absorb rapid focus changes) ─
  useEffect(() => {
    if (!activeSection || !autoFollow) return;
    const timer = setTimeout(() => {
      if (Date.now() < suppressAutoFollowUntil.current) return;
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow || !iframeReady.current) return;
      iframe.contentWindow.postMessage({ type: "scrollToSection", key: activeSection }, "*");
    }, 200);
    return () => clearTimeout(timer);
  }, [activeSection, autoFollow]);

  // ── Auto-follow: field-level (debounced 200ms) ────────────────────────────
  useEffect(() => {
    if (!activeField || !autoFollow) return;
    const timer = setTimeout(() => {
      if (Date.now() < suppressAutoFollowUntil.current) return;
      const iframe = iframeRef.current;
      if (!iframe?.contentWindow || !iframeReady.current) return;
      iframe.contentWindow.postMessage({ type: "scrollToField", key: activeField }, "*");
    }, 200);
    return () => clearTimeout(timer);
  }, [activeField, autoFollow]);

  // ── Open desktop preview in new tab ──────────────────────────────────────
  const openDesktopTab = () => {
    // Sync latest state to localStorage so the new tab reads current draft
    const payload = toPreviewPayload(core, sections, templateId, otherPackages);
    const msg = { payload, templateId, agency: agencyMsg };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(msg)); } catch {}
    window.open("/preview", "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{
      width: CONTAINER_W + 28,
      background: DA_DARK,
      borderRadius: 18,
      padding: 14,
      boxShadow: "0 24px 60px -20px rgba(0,0,0,.4), 0 8px 24px -8px rgba(0,0,0,.2)",
      display: "flex", flexDirection: "column", gap: 12,
      position: "relative",
    }}>
      {/* ── Header strip ─────────────────────────────────────────────────── */}
      {!phoneOnly && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
          {/* Label + updating indicator */}
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <div style={{ fontFamily: SANS, fontSize: 9.5, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(255,255,255,.55)" }}>
              {isAr ? "معاينة مباشرة" : "Live preview"}
            </div>
            {updating && (
              <span style={{ fontFamily: SANS, fontSize: 9, color: "rgba(255,255,255,.3)", letterSpacing: 0.4 }}>
                {isAr ? "• يتحدث…" : "• updating…"}
              </span>
            )}
          </div>

          {/* Controls: auto-follow toggle + phone icon + open-in-tab */}
          <div style={{ display: "flex", gap: 2, padding: 2, background: "rgba(255,255,255,.06)", borderRadius: 6 }}>
            {/* Auto-follow toggle */}
            <button
              onClick={() => setAutoFollow(f => !f)}
              title={isAr
                ? (autoFollow ? "إيقاف المتابعة التلقائية" : "تشغيل المتابعة التلقائية")
                : (autoFollow ? "Auto-follow on (click to pause)" : "Auto-follow off (click to resume)")}
              style={{
                width: 26, height: 22, borderRadius: 4,
                background: autoFollow ? DA_GOLD : "transparent",
                color: autoFollow ? "#fff" : "rgba(255,255,255,.35)",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 0.15s, color 0.15s",
              }}
            >
              {/* target/crosshair icon */}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <circle cx="12" cy="12" r="7" />
                <circle cx="12" cy="12" r="2.5" fill="currentColor" stroke="none" />
                <line x1="12" y1="2" x2="12" y2="5" />
                <line x1="12" y1="19" x2="12" y2="22" />
                <line x1="2" y1="12" x2="5" y2="12" />
                <line x1="19" y1="12" x2="22" y2="12" />
              </svg>
            </button>
            {/* Phone — active, decorative */}
            <div style={{
              width: 26, height: 22, borderRadius: 4,
              background: DA_GOLD,
              color: "#fff",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="7" y="2" width="10" height="20" rx="2" /><line x1="11" y1="18" x2="13" y2="18" />
              </svg>
            </div>
            {/* Desktop — opens new tab */}
            <button
              onClick={openDesktopTab}
              style={{
                width: 26, height: 22, borderRadius: 4,
                background: "transparent",
                color: "rgba(255,255,255,.55)",
                border: "none", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}
              title={isAr ? "فتح معاينة سطح المكتب في تبويب جديد" : "Open full-size desktop preview"}
            >
              {/* external-link icon */}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ── Scaled iframe screen ──────────────────────────────────────────── */}
      <div dir="ltr" style={{
        width: CONTAINER_W,
        height: CONTAINER_H,
        overflow: "hidden",
        borderRadius: 11,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)",
        background: "#fdfcf9",
        flexShrink: 0,
      }}>
        <iframe
          ref={iframeRef}
          src="/preview"
          onLoad={handleIframeLoad}
          style={{
            width: PHONE_W,
            height: IFRAME_H,
            border: "none",
            transform: `scale(${PHONE_SCALE})`,
            transformOrigin: "top left",
            display: "block",
          }}
          title="Package preview"
        />
      </div>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <div style={{ padding: "0 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: SANS, fontSize: 11, color: "rgba(255,255,255,.7)", overflow: "hidden" }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: DA_GOLD, flexShrink: 0 }} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{templateLabel}</span>
          {templateTarget && (
            <>
              <span style={{ color: "rgba(255,255,255,.3)", flexShrink: 0 }}>·</span>
              <span style={{ color: "rgba(255,255,255,.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{templateTarget}</span>
            </>
          )}
        </div>
      </div>

      {/* ── Empty-section tooltip ─────────────────────────────────────────── */}
      {tooltip && (
        <div style={{
          position: "absolute",
          bottom: 64,
          left: "50%",
          transform: "translateX(-50%)",
          background: "rgba(13,11,8,.92)",
          color: "#f0e8d8",
          fontFamily: SANS,
          fontSize: 12,
          borderRadius: 8,
          padding: "8px 14px",
          whiteSpace: "nowrap",
          boxShadow: "0 4px 14px rgba(0,0,0,.4)",
          zIndex: 20,
          pointerEvents: "none",
        }}>
          {tooltip}
        </div>
      )}
    </div>
  );
}
