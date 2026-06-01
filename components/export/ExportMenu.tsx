"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { auth } from "@/lib/firebase";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  DA_BG, DA_SURFACE, DA_SURFACE2,
  DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2,
  DA_GOLD, DA_GOLD_DEEP, DA_GOLD_SOFT,
  DA_GREEN, DA_GREEN_SOFT,
} from "@/lib/tokens";

// ─── Types ────────────────────────────────────────────────────────────────────

type ExportFormat = "square" | "vertical";
type ExportLang   = "en" | "ar";

type Phase =
  | { kind: "idle" }
  | { kind: "menu" }
  | { kind: "generating"; format: ExportFormat; exportLang: ExportLang }
  | { kind: "ready"; format: ExportFormat; exportLang: ExportLang; blobUrl: string; filename: string };

export type ExportMenuProps = {
  pkgId:      string;
  agencySlug: string;
  /** The package's authored language — used as the export language automatically. */
  pkgLang:    "en" | "ar";
  /** UI language (separate from export content language) */
  uiLang?: "en" | "ar";
  /** Positioning hint: "below" (PublishSuccess) or "above" (PackageCard) */
  dropdownDir?: "above" | "below";
  /** Compact icon-only trigger (32×30) for PackageCard; default is full-text button */
  compact?: boolean;
};

// ─── Tokens ───────────────────────────────────────────────────────────────────

const DISPLAY = `var(--font-instrument-serif), Georgia, serif`;
const SANS    = `var(--font-inter-tight), system-ui, sans-serif`;

// ─── Tiny format thumbs (same visual cues as design) ─────────────────────────

function ThumbSquare() {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: 3,
      background: "linear-gradient(150deg, #3f7d52 0%, #16331f 100%)",
    }} />
  );
}
function ThumbVertical() {
  return (
    <div style={{
      width: 15, height: 26, borderRadius: 3,
      background: "linear-gradient(150deg, #3f7d52 0%, #16331f 100%)",
    }} />
  );
}

// ─── Format metadata ──────────────────────────────────────────────────────────

function fmtMeta(format: ExportFormat, isUiAr: boolean) {
  return {
    square: {
      title:   isUiAr ? "صورة مربّعة"  : "Square image",
      sub:     isUiAr ? "إنستغرام · ١:١ · PNG" : "Instagram · 1:1 · PNG",
      thumb:   <ThumbSquare />,
      word:    isUiAr ? "الصورة" : "image",
      fileExt: "PNG",
    },
    vertical: {
      title:   isUiAr ? "صورة عمودية" : "Vertical image",
      sub:     isUiAr ? "واتساب وستوري · ٩:١٦ · PNG" : "WhatsApp / Stories · 9:16 · PNG",
      thumb:   <ThumbVertical />,
      word:    isUiAr ? "الصورة" : "image",
      fileExt: "PNG",
    },
  }[format];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DownloadIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
    </svg>
  );
}

function WaIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

function CheckCircle({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

// ─── ExportFlow body (the card contents, shared between dropdown and sheet) ───

function ComingSoonPanel({ isUiAr }: { isUiAr: boolean }) {
  return (
    <div style={{ padding: "28px 20px 24px", textAlign: "center" }}>
      <div style={{
        width: 44, height: 44, borderRadius: 12, margin: "0 auto 14px",
        background: DA_GOLD_SOFT, color: DA_GOLD_DEEP,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      </div>
      <div style={{
        fontFamily: DISPLAY, fontSize: 17, color: DA_INK1,
        letterSpacing: "-0.3px", marginBottom: 8,
      }}>
        {isUiAr ? "قريباً" : "Coming soon"}
      </div>
      <div style={{
        fontFamily: SANS, fontSize: 12.5, color: DA_INK3, lineHeight: 1.55,
        maxWidth: 230, margin: "0 auto",
      }}>
        {isUiAr
          ? "تصدير الباقات العربية قيد التطوير. التصدير متاح الآن للباقات الإنجليزية فقط."
          : "Arabic export is in development. Exports are currently available for English packages only."}
      </div>
    </div>
  );
}

function ExportFlowBody({
  phase, exportLang, onPickFormat, onReset, isUiAr, isArabicPkg, error,
}: {
  phase:        Phase;
  exportLang:   ExportLang;
  onPickFormat: (f: ExportFormat) => void;
  onReset:      () => void;
  isUiAr:       boolean;
  isArabicPkg:  boolean;
  error:        string | null;
}) {
  if (phase.kind === "menu") {
    if (isArabicPkg) return <ComingSoonPanel isUiAr={isUiAr} />;
    return (
      <div style={{ padding: 14 }}>
        {/* Format rows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {(["square", "vertical"] as ExportFormat[]).map((fmt) => {
            const meta = fmtMeta(fmt, isUiAr);
            return (
              <button
                key={fmt}
                onClick={() => onPickFormat(fmt)}
                style={{
                  display: "flex", alignItems: "center", gap: 13,
                  padding: "11px 12px", borderRadius: 10,
                  border: `1px solid ${DA_RULE}`, background: DA_SURFACE2, cursor: "pointer",
                  flexDirection: isUiAr ? "row-reverse" : "row",
                  textAlign: "left",
                }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: 9, flexShrink: 0,
                  background: DA_BG, border: `1px solid ${DA_RULE}`, overflow: "hidden",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {meta.thumb}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: DA_INK1 }}>
                    {meta.title}
                  </div>
                  <div style={{ fontFamily: SANS, fontSize: 11.5, color: DA_INK3, marginTop: 1 }}>
                    {meta.sub}
                  </div>
                </div>
                <svg width={15} height={15} viewBox="0 0 24 24" fill="none"
                  stroke={DA_INK3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: isUiAr ? "scaleX(-1)" : "none", flexShrink: 0 }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            );
          })}
        </div>

        {error && (
          <div style={{
            marginTop: 10, padding: "8px 12px", borderRadius: 8,
            background: "rgba(192,83,58,.08)", border: "1px solid rgba(192,83,58,.2)",
            fontFamily: SANS, fontSize: 12, color: "#c0533a",
          }}>
            {error}
          </div>
        )}
      </div>
    );
  }

  if (phase.kind === "generating") {
    const meta = fmtMeta(phase.format, isUiAr);
    return (
      <div style={{ padding: "26px 18px 22px", textAlign: "center" }}>
        {/* Spinner ring */}
        <div style={{ width: 52, height: 52, margin: "0 auto 16px", position: "relative" }}>
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: `3px solid ${DA_RULE}`,
          }} />
          <div style={{
            position: "absolute", inset: 0, borderRadius: "50%",
            border: "3px solid transparent", borderTopColor: DA_GOLD,
            animation: "export-spin .8s linear infinite",
          }} />
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center", color: DA_GOLD,
          }}>
            {meta.thumb}
          </div>
        </div>

        <div style={{ fontFamily: DISPLAY, fontSize: 19, color: DA_INK1, letterSpacing: "-0.3px" }}>
          {isUiAr ? `جارٍ تجهيز ${meta.word}…` : `Preparing your ${meta.word}…`}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 12.5, color: DA_INK2, marginTop: 6 }}>
          {isUiAr ? "عادةً خلال ثوانٍ معدودة." : "This usually takes a few seconds."}
        </div>

        {/* Indeterminate progress bar (CSS animation) */}
        <div style={{
          marginTop: 18, height: 6, background: DA_BG, borderRadius: 999,
          overflow: "hidden", border: `1px solid ${DA_RULE}`,
        }}>
          <div style={{
            height: "100%", background: `linear-gradient(90deg, ${DA_GOLD}, ${DA_GOLD_DEEP})`,
            borderRadius: 999, animation: "export-bar 1.6s ease-in-out infinite",
          }} />
        </div>

        <div style={{ fontFamily: SANS, fontSize: 11, color: DA_INK3, marginTop: 8, letterSpacing: "-0.2px" }}>
          {meta.title} · {phase.exportLang === "ar" ? (isUiAr ? "عربي" : "Arabic") : "English"}
        </div>

        <style>{`
          @keyframes export-spin { to { transform: rotate(360deg); } }
          @keyframes export-bar  { 0%,100%{width:20%;margin-left:0} 50%{width:60%;margin-left:20%} }
        `}</style>
      </div>
    );
  }

  if (phase.kind === "ready") {
    const meta      = fmtMeta(phase.format, isUiAr);
    const langLabel = phase.exportLang === "ar" ? (isUiAr ? "عربي" : "Arabic") : "English";

    const handleDownload = () => {
      const a = document.createElement("a");
      a.href     = phase.blobUrl;
      a.download = phase.filename;
      a.click();
    };

    const handleShareWa = async () => {
      if (navigator.canShare?.({ files: [] })) {
        try {
          const res  = await fetch(phase.blobUrl);
          const blob = await res.blob();
          const file = new File([blob], phase.filename, { type: "image/png" });
          if (navigator.canShare({ files: [file] })) {
            await navigator.share({ files: [file] });
            return;
          }
        } catch { /* fall through to download */ }
      }
      handleDownload();
    };

    return (
      <div style={{ padding: 16 }}>
        {/* Ready indicator */}
        <div style={{
          display: "flex", alignItems: "center", gap: 8, marginBottom: 14,
          flexDirection: isUiAr ? "row-reverse" : "row",
        }}>
          <div style={{
            width: 22, height: 22, borderRadius: "50%",
            background: DA_GREEN_SOFT, color: DA_GREEN,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <CheckCircle size={13} />
          </div>
          <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: DA_INK1 }}>
            {isUiAr ? `${meta.word} جاهز` : `Your ${meta.word} is ready`}
          </span>
        </div>

        {/* File chip */}
        <div style={{
          display: "flex", alignItems: "center", gap: 11, padding: 11,
          background: DA_BG, border: `1px solid ${DA_RULE}`, borderRadius: 10, marginBottom: 14,
          flexDirection: isUiAr ? "row-reverse" : "row",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: DA_SURFACE, border: `1px solid ${DA_RULE}`,
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            {meta.thumb}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{
              fontFamily: SANS, fontSize: 12.5, fontWeight: 500, color: DA_INK1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              direction: "ltr", textAlign: isUiAr ? "right" : "left",
            }}>
              {phase.filename}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 10.5, color: DA_INK3, marginTop: 2 }}>
              {meta.fileExt} · {langLabel}
            </div>
          </div>
        </div>

        {/* Download */}
        <button
          onClick={handleDownload}
          style={{
            width: "100%", padding: "11px 0",
            background: DA_GOLD, color: "#fff", border: "none", borderRadius: 9,
            fontFamily: SANS, fontSize: 13.5, fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
        >
          <DownloadIcon size={15} />
          {isUiAr ? "تنزيل" : "Download"}
        </button>

        {/* Secondary action row */}
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <button
            onClick={handleShareWa}
            style={{
              flex: 1, padding: "9px 0", background: "#25D366", color: "#fff",
              border: "none", borderRadius: 9, fontFamily: SANS, fontSize: 12.5, fontWeight: 600,
              cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
            }}
          >
            <WaIcon size={13} />
            {isUiAr ? "واتساب" : "WhatsApp"}
          </button>
          <button
            onClick={onReset}
            style={{
              flex: 1, padding: "9px 0", background: DA_SURFACE2, color: DA_INK2,
              border: `1px solid ${DA_RULE2}`, borderRadius: 9,
              fontFamily: SANS, fontSize: 12.5, fontWeight: 500, cursor: "pointer",
            }}
          >
            {isUiAr ? "صيغة أخرى" : "Another format"}
          </button>
        </div>
      </div>
    );
  }

  return null;
}

// ─── ExportFlow card (header + body) ─────────────────────────────────────────

function ExportFlowCard({
  phase, exportLang, onPickFormat, onReset, isUiAr, isArabicPkg, error, width,
}: {
  phase:        Phase;
  exportLang:   ExportLang;
  onPickFormat: (f: ExportFormat) => void;
  onReset:      () => void;
  isUiAr:       boolean;
  isArabicPkg:  boolean;
  error:        string | null;
  width:        number | string;
}) {
  return (
    <div style={{
      width,
      background:   DA_SURFACE,
      border:       `1px solid ${DA_RULE}`,
      borderRadius: 14,
      boxShadow:    "0 1px 2px rgba(26,22,17,.05), 0 18px 44px -18px rgba(26,22,17,.28)",
      overflow:     "hidden",
      fontFamily:   SANS,
    }}>
      {/* Header */}
      <div style={{
        padding: "14px 16px 12px",
        borderBottom: `1px solid ${DA_RULE}`,
        display: "flex", alignItems: "center", gap: 8,
        flexDirection: isUiAr ? "row-reverse" : "row",
      }}>
        <div style={{
          width: 26, height: 26, borderRadius: 7,
          background: DA_GOLD_SOFT, color: DA_GOLD_DEEP,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <DownloadIcon size={14} />
        </div>
        <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: DA_INK1 }}>
          {isUiAr ? "تصدير الباقة" : "Export package"}
        </div>
      </div>

      <ExportFlowBody
        phase={phase} exportLang={exportLang}
        onPickFormat={onPickFormat}
        onReset={onReset} isUiAr={isUiAr} isArabicPkg={isArabicPkg} error={error}
      />
    </div>
  );
}

// ─── Mobile bottom sheet ──────────────────────────────────────────────────────

function ExportSheet({
  phase, exportLang, onPickFormat, onReset, onClose, isUiAr, isArabicPkg, error,
}: {
  phase:        Phase;
  exportLang:   ExportLang;
  onPickFormat: (f: ExportFormat) => void;
  onReset:      () => void;
  onClose:      () => void;
  isUiAr:       boolean;
  isArabicPkg:  boolean;
  error:        string | null;
}) {
  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 9000,
        background: "rgba(26,22,17,.4)",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        position: "absolute", insetInlineStart: 0, insetInlineEnd: 0, bottom: 0,
        background: DA_SURFACE, borderTopLeftRadius: 20, borderTopRightRadius: 20,
        boxShadow: "0 -12px 40px -8px rgba(26,22,17,.3)",
        overflow: "hidden",
        direction: isUiAr ? "rtl" : "ltr",
      }}>
        {/* Drag handle */}
        <div style={{ display: "flex", justifyContent: "center", paddingTop: 10 }}>
          <div style={{ width: 38, height: 4, borderRadius: 999, background: DA_RULE2 }} />
        </div>

        {/* Header */}
        <div style={{
          padding: "10px 20px 12px",
          borderBottom: `1px solid ${DA_RULE}`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div style={{
              width: 26, height: 26, borderRadius: 7,
              background: DA_GOLD_SOFT, color: DA_GOLD_DEEP,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <DownloadIcon size={14} />
            </div>
            <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: DA_INK1 }}>
              {isUiAr ? "تصدير الباقة" : "Export package"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: DA_INK3, padding: 4,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div style={{ padding: "6px 0 env(safe-area-inset-bottom, 16px)" }}>
          <ExportFlowBody
            phase={phase} exportLang={exportLang}
            onPickFormat={onPickFormat}
            onReset={onReset} isUiAr={isUiAr} isArabicPkg={isArabicPkg} error={error}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Trigger buttons ──────────────────────────────────────────────────────────

function ExportTriggerButton({
  active, isUiAr, onClick,
}: { active: boolean; isUiAr: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        display:        "inline-flex",
        alignItems:     "center",
        justifyContent: "center",
        gap:            8,
        padding:        "9px 16px",
        height:         38,
        background:     active ? DA_BG      : DA_SURFACE,
        color:          DA_INK1,
        border:         `1px solid ${active ? DA_GOLD : DA_RULE2}`,
        boxShadow:      active ? `0 0 0 3px ${DA_GOLD_SOFT}` : "none",
        borderRadius:   8,
        fontFamily:     SANS,
        fontSize:       13.5,
        fontWeight:     500,
        cursor:         "pointer",
        flexDirection:  isUiAr ? "row-reverse" : "row",
      }}
    >
      <DownloadIcon size={15} />
      {isUiAr ? "تصدير وتنزيل" : "Export / Download"}
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        style={{
          color: DA_INK3,
          transform: active ? "rotate(180deg)" : "none",
          transition: "transform .15s",
        }}>
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
  );
}

function ExportTriggerCompact({
  active, isUiAr, onClick,
}: { active: boolean; isUiAr: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title={isUiAr ? "تصدير وتنزيل" : "Export / Download"}
      style={{
        width:          32,
        height:         30,
        padding:        0,
        display:        "inline-flex",
        alignItems:     "center",
        justifyContent: "center",
        background:     active ? DA_BG      : DA_SURFACE2,
        color:          DA_INK1,
        border:         `1px solid ${active ? DA_GOLD : DA_RULE2}`,
        boxShadow:      active ? `0 0 0 2px ${DA_GOLD_SOFT}` : "none",
        borderRadius:   7,
        cursor:         "pointer",
      }}
    >
      <DownloadIcon size={13} />
    </button>
  );
}

// ─── ExportMenu (the full orchestrated component) ─────────────────────────────

export function ExportMenu({ pkgId, agencySlug, pkgLang, uiLang = "en", dropdownDir = "below", compact = false }: ExportMenuProps) {
  const isMobile   = useIsMobile();
  const isUiAr     = uiLang === "ar";
  const isArabicPkg = pkgLang === "ar";

  const [phase, setPhase] = useState<Phase>({ kind: "idle" });
  const [error, setError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const triggerRef  = useRef<HTMLDivElement>(null);

  // Revoke previous blob URL when it changes
  const blobUrlRef = useRef<string | null>(null);
  useEffect(() => {
    return () => {
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
    };
  }, []);

  // Click-outside to dismiss dropdown
  useEffect(() => {
    if (phase.kind === "idle" || isMobile) return;
    function handler(e: MouseEvent) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target as Node) &&
        triggerRef.current  && !triggerRef.current.contains(e.target as Node)
      ) {
        setPhase({ kind: "idle" });
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [phase.kind, isMobile]);

  const handleTrigger = () => {
    setError(null);
    setPhase((p) => p.kind === "idle" ? { kind: "menu" } : { kind: "idle" });
  };

  const handlePickFormat = useCallback(async (format: ExportFormat) => {
    setError(null);
    setPhase({ kind: "generating", format, exportLang: pkgLang });

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("Not authenticated");
      const token = await currentUser.getIdToken();

      const res = await fetch(
        `/api/export?pkgId=${encodeURIComponent(pkgId)}&format=${format}&lang=${pkgLang}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server error ${res.status}`);
      }

      const blob     = await res.blob();
      const blobUrl  = URL.createObjectURL(blob);
      if (blobUrlRef.current) URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = blobUrl;

      // Derive filename from Content-Disposition or construct fallback
      const cd       = res.headers.get("content-disposition") || "";
      const fnMatch  = cd.match(/filename="([^"]+)"/);
      const ext      = "png";
      const filename = fnMatch?.[1] || `package-${format}-${pkgLang}.${ext}`;

      setPhase({ kind: "ready", format, exportLang: pkgLang, blobUrl, filename });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Export failed";
      setError(msg);
      setPhase({ kind: "menu" });
    }
  }, [pkgLang, pkgId]);

  const handleReset = () => {
    setError(null);
    setPhase({ kind: "menu" });
  };
  const handleClose = () => {
    setError(null);
    setPhase({ kind: "idle" });
  };

  const isOpen  = phase.kind !== "idle";

  const Trigger = compact ? ExportTriggerCompact : ExportTriggerButton;

  // ── Mobile: render bottom sheet ──────────────────────────────────────────
  if (isMobile) {
    return (
      <>
        <Trigger active={isOpen} isUiAr={isUiAr} onClick={handleTrigger} />
        {isOpen && (
          <ExportSheet
            phase={phase} exportLang={pkgLang}
            onPickFormat={handlePickFormat}
            onReset={handleReset} onClose={handleClose}
            isUiAr={isUiAr} isArabicPkg={isArabicPkg} error={error}
          />
        )}
      </>
    );
  }

  // ── Desktop: trigger + floating dropdown ─────────────────────────────────
  return (
    <div ref={triggerRef} style={{ position: "relative", display: "inline-block" }}>
      <Trigger active={isOpen} isUiAr={isUiAr} onClick={handleTrigger} />

      {isOpen && (
        <div
          ref={dropdownRef}
          style={{
            position: "absolute",
            zIndex: 200,
            left:  "50%",
            transform: "translateX(-50%)",
            ...(dropdownDir === "above"
              ? { bottom: "calc(100% + 8px)" }
              : { top:    "calc(100% + 8px)" }),
          }}
        >
          <ExportFlowCard
            phase={phase} exportLang={pkgLang}
            onPickFormat={handlePickFormat}
            onReset={handleReset} isUiAr={isUiAr} isArabicPkg={isArabicPkg} error={error}
            width={320}
          />
        </div>
      )}
    </div>
  );
}
