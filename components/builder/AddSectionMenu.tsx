"use client";

import { useEffect, useRef, useState } from "react";
import Icon from "@/components/Icon";
import { SECTION_REGISTRY_LIST } from "@/lib/sections/registry";
import { getPickerNote } from "@/lib/sections/affiliation";
import type { AnySectionInstance, SectionTypeKey } from "@/lib/sections/types";
import { SAND } from "./constants";
import {
  DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2, DA_GOLD, DA_GOLD_SOFT, DA_GREEN, DA_GREEN_SOFT,
} from "@/lib/tokens";

const SANS = `var(--font-sans)`;
const DISPLAY = `var(--font-display)`;

function SectionCard({
  def,
  usedTypes,
  onAdd,
  onClose,
  l,
  templateId,
}: {
  def: (typeof import("@/lib/sections/registry").SECTION_REGISTRY_LIST)[number];
  usedTypes: Set<string>;
  onAdd: (type: SectionTypeKey) => void;
  onClose: () => void;
  l: boolean;
  templateId?: string;
}) {
  const alreadyUsed = usedTypes.has(def.type) && !def.multiple;
  const defLabel = l ? def.labelAr : def.label;
  const defDesc = l
    ? ((def as any).descriptionAr ?? (def as any).description ?? "")
    : ((def as any).description ?? "");
  const pickerNote = getPickerNote(def as any, l ? "ar" : "en", templateId);
  return (
    <button
      onClick={() => { if (!alreadyUsed) { onAdd(def.type as SectionTypeKey); onClose(); } }}
      disabled={alreadyUsed}
      style={{
        display: "flex", alignItems: "flex-start", gap: 12,
        padding: "13px 15px", borderRadius: 12,
        border: `1px solid ${alreadyUsed ? DA_RULE : DA_RULE2}`,
        background: alreadyUsed ? "transparent" : DA_SURFACE,
        cursor: alreadyUsed ? "default" : "pointer",
        opacity: alreadyUsed ? 0.55 : 1,
        textAlign: l ? "right" : "left",
        fontFamily: SANS,
        transition: "border-color 0.12s, background 0.12s",
      }}
      onMouseEnter={(e) => {
        if (!alreadyUsed) {
          e.currentTarget.style.borderColor = "rgba(176,138,62,.55)";
          e.currentTarget.style.background = "rgba(176,138,62,.04)";
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = alreadyUsed ? DA_RULE : DA_RULE2;
        e.currentTarget.style.background = alreadyUsed ? "transparent" : DA_SURFACE;
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 9, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: alreadyUsed ? DA_SURFACE2 : DA_GOLD_SOFT,
        color: alreadyUsed ? DA_INK3 : DA_GOLD,
        border: `1px solid ${DA_RULE}`,
      }}>
        <Icon name={def.icon} size={17} color={alreadyUsed ? DA_INK3 : DA_GOLD} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" as const }}>
          <span style={{ fontSize: 13.5, fontWeight: 600, color: alreadyUsed ? DA_INK3 : DA_INK1 }}>
            {defLabel}
          </span>
          {alreadyUsed && (
            <span style={{
              fontSize: 11, color: DA_GREEN, fontWeight: 600,
              display: "inline-flex", alignItems: "center", gap: 3,
              background: DA_GREEN_SOFT, borderRadius: 5, padding: "1px 6px",
            }}>
              <Icon name="check" size={10} color={DA_GREEN} strokeWidth={2.5} />
              {l ? "مضاف" : "Added"}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: DA_INK3, marginTop: 3, lineHeight: 1.45 }}>
          {defDesc}
        </div>
        {pickerNote && !alreadyUsed && (
          <div style={{
            display: "flex", alignItems: "flex-start", gap: 4,
            marginTop: 5,
          }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              stroke="rgba(176,138,62,.7)" style={{ flexShrink: 0, marginTop: 1 }}>
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span style={{ fontSize: 11, color: "rgba(176,138,62,.8)", lineHeight: 1.4 }}>
              {pickerNote}
            </span>
          </div>
        )}
      </div>
      {!alreadyUsed && <Icon name="plus" size={15} color={DA_INK3} />}
    </button>
  );
}

export function AddSectionMenu({
  existing,
  onAdd,
  onClose,
  lang,
  templateId,
}: {
  existing: AnySectionInstance[];
  onAdd: (type: SectionTypeKey) => void;
  onClose: () => void;
  lang: "en" | "ar";
  templateId?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const l = lang === "ar";

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const usedTypes = new Set(existing.map((s) => s.type));

  // Core backbone sections — shown prominently first
  const CORE_TYPES = new Set([
    "highlights", "itinerary", "hotel", "inclusions",
    "media", "pricing", "departures", "reviews", "people",
  ]);

  // All section types are user-addable (no legacy types remain)
  const allVisible = SECTION_REGISTRY_LIST;

  // Filter by search query
  const q = query.trim().toLowerCase();
  const matches = (def: typeof allVisible[number]) => {
    if (!q) return true;
    return (
      def.label.toLowerCase().includes(q) ||
      (def.labelAr ?? "").toLowerCase().includes(q) ||
      ((def as any).description ?? "").toLowerCase().includes(q) ||
      ((def as any).descriptionAr ?? "").toLowerCase().includes(q)
    );
  };

  const coreDefs = allVisible.filter((d) => CORE_TYPES.has(d.type) && matches(d));
  const moreDefs = allVisible.filter((d) => !CORE_TYPES.has(d.type) && matches(d));
  const totalCount = allVisible.length;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 1000,
      background: "rgba(26,20,16,.55)",
      backdropFilter: "blur(2px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20,
    }}>
      <div
        ref={ref}
        data-testid="section-menu-panel"
        dir={l ? "rtl" : "ltr"}
        style={{
          background: DA_SURFACE2,
          border: `1px solid ${DA_RULE2}`,
          borderRadius: 18,
          width: "100%",
          maxWidth: 680,
          maxHeight: "82vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 40px 90px -30px rgba(26,20,16,.45)",
        }}
      >
        {/* Header */}
        <div style={{
          padding: "22px 26px 18px",
          borderBottom: `1px solid ${DA_RULE}`,
          background: DA_SURFACE2,
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 400, color: DA_INK1, letterSpacing: -0.5, lineHeight: 1 }}>
                {l ? "أضف قسماً" : "Add a section"}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 12.5, color: DA_INK2, marginTop: 6 }}>
                {l
                  ? `اختر نوع القسم لإضافته إلى باقتك · ${totalCount} نوعاً`
                  : `Choose a section type to add to your package · ${totalCount} types`}
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                background: DA_SURFACE, border: `1px solid ${DA_RULE2}`, color: DA_INK3,
                display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
              }}
            >
              <Icon name="x" size={14} color={DA_INK3} />
            </button>
          </div>

          {/* Search */}
          <div style={{
            marginTop: 16, display: "flex", alignItems: "center", gap: 9,
            height: 40, padding: "0 13px",
            background: DA_SURFACE, border: `1px solid ${DA_RULE2}`, borderRadius: 10,
          }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={DA_INK3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" />
            </svg>
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={l ? `ابحث في ${totalCount} قسماً…` : `Search ${totalCount} sections…`}
              style={{
                flex: 1, background: "transparent", border: "none", outline: "none",
                fontFamily: SANS, fontSize: 13.5, color: DA_INK1,
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                style={{ background: "none", border: "none", cursor: "pointer", color: DA_INK3, fontSize: 16, lineHeight: 1, padding: 0 }}
              >×</button>
            )}
          </div>
        </div>

        {/* Section list */}
        <div style={{ overflowY: "auto", padding: "6px 26px 24px", background: DA_SURFACE2 }}>
          {/* Core sections */}
          {coreDefs.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{
                fontFamily: SANS, fontSize: 10.5, fontWeight: 700,
                letterSpacing: 1.4, textTransform: "uppercase" as const,
                color: DA_GOLD, marginBottom: 12,
              }}>
                {l ? "الأقسام الأساسية" : "Core sections"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {coreDefs.map((def) => <SectionCard key={def.type} def={def} usedTypes={usedTypes} onAdd={onAdd} onClose={onClose} l={l} templateId={templateId} />)}
              </div>
            </div>
          )}

          {/* More sections */}
          {moreDefs.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{
                fontFamily: SANS, fontSize: 10.5, fontWeight: 700,
                letterSpacing: 1.4, textTransform: "uppercase" as const,
                color: DA_INK3, marginBottom: 12,
              }}>
                {l ? "أقسام إضافية" : "More sections"}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {moreDefs.map((def) => <SectionCard key={def.type} def={def} usedTypes={usedTypes} onAdd={onAdd} onClose={onClose} l={l} templateId={templateId} />)}
              </div>
            </div>
          )}

          {/* No results */}
          {q && coreDefs.length === 0 && moreDefs.length === 0 && (
            <div style={{ padding: "40px 0", textAlign: "center" as const, color: DA_INK3, fontFamily: SANS, fontSize: 13.5 }}>
              {l ? `لا توجد نتائج لـ "${query}"` : `No sections match "${query}"`}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
