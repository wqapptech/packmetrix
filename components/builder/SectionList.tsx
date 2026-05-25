"use client";

import { useRef, useState } from "react";
import Icon from "@/components/Icon";
import { SECTION_REGISTRY } from "@/lib/sections/registry";
import type { AnySectionInstance, SectionTypeKey } from "@/lib/sections/types";
import { TEMPLATE_SECTION_PRIORITY } from "@/lib/template-fields";
import { TEMPLATES } from "@/components/templates";
import { SectionCard } from "./SectionCard";
import { AddSectionMenu } from "./AddSectionMenu";
import { SAND } from "./constants";

export function SectionList({
  sections,
  onChange,
  userId,
  lang,
  templateId,
}: {
  sections: AnySectionInstance[];
  onChange: (sections: AnySectionInstance[]) => void;
  userId: string;
  lang: "en" | "ar";
  templateId?: string;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const l = lang === "ar";

  // Compute which foregrounded sections for the active template are still missing
  const tpl = templateId ? TEMPLATES.find((t) => t.id === templateId) : undefined;
  const suggestions = (() => {
    if (!templateId) return [];
    const priority = TEMPLATE_SECTION_PRIORITY[templateId] ?? [];
    return priority.filter(
      (p) =>
        p.type in SECTION_REGISTRY &&
        !sections.some((s) => s.type === p.type)
    );
  })();

  const updateSection = (id: string, data: Record<string, unknown>) =>
    onChange(sections.map((s) => (s.id === id ? { ...s, data } : s)));

  const removeSection = (id: string) =>
    onChange(sections.filter((s) => s.id !== id));

  const moveSection = (index: number, direction: -1 | 1) => {
    const to = index + direction;
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    const [moved] = next.splice(index, 1);
    next.splice(to, 0, moved);
    onChange(next.map((s, i) => ({ ...s, order: i })));
  };

  const addSection = (type: SectionTypeKey) => {
    const def = SECTION_REGISTRY[type];
    const newSection: AnySectionInstance = {
      id: `${type}_${Date.now()}`,
      type,
      order: sections.length,
      data: { ...def.defaultData },
    };
    onChange([...sections, newSection]);
  };

  // Drag-and-drop handlers
  const onDragStart = (i: number) => { dragIdx.current = i; };
  const onDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOver(i); };
  const onDrop = (i: number) => {
    const from = dragIdx.current;
    if (from !== null && from !== i) {
      const next = [...sections];
      const [moved] = next.splice(from, 1);
      next.splice(i, 0, moved);
      onChange(next.map((s, idx) => ({ ...s, order: idx })));
    }
    dragIdx.current = null;
    setDragOver(null);
  };
  const onDragEnd = () => { dragIdx.current = null; setDragOver(null); };

  return (
    <div>
      {/* Template suggestion strip — shows missing foregrounded sections */}
      {suggestions.length > 0 && (
        <div style={{
          marginBottom: 14,
          padding: "10px 14px 12px",
          borderRadius: 10,
          background: tpl ? `${tpl.templateColor}0d` : "rgba(232,201,123,0.05)",
          border: `1px dashed ${tpl ? `${tpl.templateColor}40` : "rgba(232,201,123,0.2)"}`,
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase" as const, color: tpl ? tpl.templateColor : SAND, marginBottom: 8, opacity: 0.8 }}>
            {l
              ? `مقترح لـ ${tpl ? (l ? tpl.nameAr : tpl.name) : templateId}`
              : `Suggested for ${tpl?.name ?? templateId}`}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
            {suggestions.map((p) => {
              const label = l && p.labelAr ? p.labelAr : p.label ?? SECTION_REGISTRY[p.type as SectionTypeKey]?.label ?? p.type;
              return (
                <button
                  key={p.type}
                  onClick={() => addSection(p.type as SectionTypeKey)}
                  style={{
                    fontSize: 12, fontFamily: "inherit", cursor: "pointer",
                    padding: "4px 10px", borderRadius: 7,
                    background: tpl ? `${tpl.templateColor}18` : "rgba(232,201,123,0.08)",
                    border: `1px solid ${tpl ? `${tpl.templateColor}30` : "rgba(232,201,123,0.2)"}`,
                    color: tpl ? tpl.templateColor : SAND,
                    display: "inline-flex", alignItems: "center", gap: 5,
                    transition: "background 0.15s",
                  }}
                >
                  <Icon name="plus" size={11} color={tpl?.templateColor ?? SAND} />
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {sections.length === 0 && (
        <div style={{
          padding: "28px 20px",
          borderRadius: 14,
          border: "1.5px dashed rgba(255,255,255,0.08)",
          textAlign: "center",
          color: "rgba(255,255,255,0.3)",
          fontSize: 13,
          marginBottom: 14,
        }}>
          {l ? "لا توجد أقسام بعد — أضف قسماً أدناه" : "No sections yet — add one below"}
        </div>
      )}

      {sections.map((section, i) => (
        <div
          key={section.id}
          draggable
          onDragStart={() => onDragStart(i)}
          onDragOver={(e) => onDragOver(e, i)}
          onDrop={() => onDrop(i)}
          onDragEnd={onDragEnd}
        >
          <SectionCard
            section={section}
            index={i}
            total={sections.length}
            onChange={(data) => updateSection(section.id, data)}
            onRemove={() => removeSection(section.id)}
            onMove={(dir) => moveSection(i, dir)}
            userId={userId}
            lang={lang}
            isDragOver={dragOver === i}
            dragHandleProps={{ onMouseDown: (e) => e.stopPropagation() }}
          />
        </div>
      ))}

      <button
        onClick={() => setShowMenu(true)}
        style={{
          width: "100%",
          marginTop: sections.length > 0 ? 4 : 0,
          padding: "12px 16px",
          borderRadius: 12,
          border: `1.5px dashed rgba(232,201,123,0.25)`,
          background: "rgba(232,201,123,0.03)",
          color: SAND,
          fontSize: 13,
          fontWeight: 600,
          fontFamily: "inherit",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          transition: "border-color 0.15s, background 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = `${SAND}60`;
          e.currentTarget.style.background = `${SAND}08`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = `rgba(232,201,123,0.25)`;
          e.currentTarget.style.background = "rgba(232,201,123,0.03)";
        }}
      >
        <Icon name="plus" size={14} color={SAND} />
        {l ? "إضافة قسم" : "Add section"}
      </button>

      {showMenu && (
        <AddSectionMenu
          existing={sections}
          onAdd={addSection}
          onClose={() => setShowMenu(false)}
          lang={lang}
        />
      )}
    </div>
  );
}
