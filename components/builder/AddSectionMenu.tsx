"use client";

import { useEffect, useRef } from "react";
import Icon from "@/components/Icon";
import { SECTION_REGISTRY_LIST, SECTION_CATEGORIES } from "@/lib/sections/registry";
import type { AnySectionInstance, SectionTypeKey } from "@/lib/sections/types";
import { SAND } from "./constants";
import { DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3, DA_RULE, DA_GOLD, DA_GOLD_SOFT } from "@/lib/tokens";

export function AddSectionMenu({
  existing,
  onAdd,
  onClose,
  lang,
}: {
  existing: AnySectionInstance[];
  onAdd: (type: SectionTypeKey) => void;
  onClose: () => void;
  lang: "en" | "ar";
}) {
  const ref = useRef<HTMLDivElement>(null);
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

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 1000,
      background: "rgba(0,0,0,0.65)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <div
        ref={ref}
        style={{
          background: DA_SURFACE2,
          border: `1px solid ${DA_RULE}`,
          borderRadius: 20,
          width: "100%",
          maxWidth: 520,
          maxHeight: "80vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 14px", borderBottom: `1px solid ${DA_RULE}` }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: DA_INK1 }}>
              {l ? "إضافة قسم" : "Add a section"}
            </div>
            <div style={{ fontSize: 12, color: DA_INK3, marginTop: 2 }}>
              {l ? "اختر نوع القسم لإضافته إلى الباقة" : "Choose a section type to add to your package"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${DA_RULE}`, background: DA_SURFACE, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="x" size={14} color={DA_INK3} />
          </button>
        </div>

        {/* Section list */}
        <div style={{ overflowY: "auto", padding: "14px 20px 20px", background: DA_SURFACE }}>
          {SECTION_CATEGORIES.map((cat) => {
            const items = SECTION_REGISTRY_LIST.filter((d) => d.category === cat.id);
            if (!items.length) return null;
            const catLabel = l ? cat.labelAr : cat.label;
            return (
              <div key={cat.id} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: DA_INK3, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 10 }}>
                  {catLabel}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  {items.map((def) => {
                    const alreadyUsed = usedTypes.has(def.type) && !def.multiple;
                    const defLabel = l ? def.labelAr : def.label;
                    const defDesc = l ? def.descriptionAr : def.description;
                    return (
                      <button
                        key={def.type}
                        onClick={() => { if (!alreadyUsed) { onAdd(def.type); onClose(); } }}
                        disabled={alreadyUsed}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: 10,
                          padding: "12px 14px",
                          borderRadius: 12,
                          border: `1px solid ${alreadyUsed ? DA_RULE : DA_RULE}`,
                          background: alreadyUsed ? DA_SURFACE : DA_SURFACE2,
                          cursor: alreadyUsed ? "not-allowed" : "pointer",
                          opacity: alreadyUsed ? 0.4 : 1,
                          textAlign: "left",
                          fontFamily: "inherit",
                          transition: "border-color 0.15s, background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (!alreadyUsed) {
                            e.currentTarget.style.borderColor = DA_GOLD;
                            e.currentTarget.style.background = DA_GOLD_SOFT;
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = DA_RULE;
                          e.currentTarget.style.background = DA_SURFACE2;
                        }}
                      >
                        <div style={{ flexShrink: 0, marginTop: 1 }}>
                          <Icon name={def.icon} size={16} color={alreadyUsed ? DA_INK3 : SAND} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: alreadyUsed ? DA_INK3 : DA_INK1, marginBottom: 3 }}>
                            {defLabel}
                            {alreadyUsed && (
                              <span style={{ marginLeft: 6, fontSize: 10, color: DA_INK3, fontWeight: 400 }}>
                                {l ? "مضاف" : "Added"}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: DA_INK3, lineHeight: 1.4 }}>
                            {defDesc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
