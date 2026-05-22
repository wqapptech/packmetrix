"use client";

import { useEffect, useRef } from "react";
import Icon from "@/components/Icon";
import { SECTION_REGISTRY_LIST, SECTION_CATEGORIES } from "@/lib/sections/registry";
import type { AnySectionInstance, SectionTypeKey } from "@/lib/sections/types";
import { SAND } from "./constants";

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
      background: "rgba(0,0,0,0.6)",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 20,
    }}>
      <div
        ref={ref}
        style={{
          background: "#0d1b2e",
          border: "1px solid rgba(255,255,255,0.12)",
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 20px 14px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>
              {l ? "إضافة قسم" : "Add a section"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
              {l ? "اختر نوع القسم لإضافته إلى الباقة" : "Choose a section type to add to your package"}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 32, height: 32, borderRadius: 8, border: "none", background: "rgba(255,255,255,0.07)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <Icon name="x" size={14} color="rgba(255,255,255,0.5)" />
          </button>
        </div>

        {/* Section list */}
        <div style={{ overflowY: "auto", padding: "14px 20px 20px" }}>
          {SECTION_CATEGORIES.map((cat) => {
            const items = SECTION_REGISTRY_LIST.filter((d) => d.category === cat.id);
            if (!items.length) return null;
            const catLabel = l ? cat.labelAr : cat.label;
            return (
              <div key={cat.id} style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 10 }}>
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
                          border: `1px solid ${alreadyUsed ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.08)"}`,
                          background: alreadyUsed ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.04)",
                          cursor: alreadyUsed ? "not-allowed" : "pointer",
                          opacity: alreadyUsed ? 0.4 : 1,
                          textAlign: "left",
                          fontFamily: "inherit",
                          transition: "border-color 0.15s, background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          if (!alreadyUsed) {
                            e.currentTarget.style.borderColor = `${SAND}40`;
                            e.currentTarget.style.background = `${SAND}08`;
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
                          e.currentTarget.style.background = "rgba(255,255,255,0.04)";
                        }}
                      >
                        <div style={{ flexShrink: 0, marginTop: 1 }}>
                          <Icon name={def.icon} size={16} color={alreadyUsed ? "rgba(255,255,255,0.2)" : SAND} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: 12.5, fontWeight: 600, color: alreadyUsed ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.9)", marginBottom: 3 }}>
                            {defLabel}
                            {alreadyUsed && (
                              <span style={{ marginLeft: 6, fontSize: 10, color: "rgba(255,255,255,0.3)", fontWeight: 400 }}>
                                {l ? "مضاف" : "Added"}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>
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
