"use client";

import { useRef, useState } from "react";
import Icon from "@/components/Icon";
import { SECTION_REGISTRY, SECTION_REGISTRY_LIST } from "@/lib/sections/registry";
import type { AnySectionInstance, SectionTypeKey } from "@/lib/sections/types";
import { TEMPLATE_SECTION_PRIORITY } from "@/lib/template-fields";
import { TEMPLATES } from "@/components/templates";
import { SectionCard } from "./SectionCard";
import { AddSectionMenu } from "./AddSectionMenu";
import { SAND } from "./constants";
import {
  DA_GOLD, DA_GOLD_SOFT, DA_INK1, DA_INK2, DA_INK3, DA_RULE, DA_RULE2, DA_SURFACE,
} from "@/lib/tokens";

const SANS = `var(--font-sans)`;

// Sections shown as quick-add tiles — core backbone, filtered by already-added
const QUICK_ADD_TYPES: SectionTypeKey[] = [
  "highlights", "itinerary", "hotel", "inclusions",
  "media", "departures", "pricing", "people", "reviews",
];

export function SectionList({
  sections,
  onChange,
  userId,
  lang,
  templateId,
  isMobile = false,
  onSectionFocus,
}: {
  sections: AnySectionInstance[];
  onChange: (sections: AnySectionInstance[]) => void;
  userId: string;
  lang: "en" | "ar";
  templateId?: string;
  isMobile?: boolean;
  onSectionFocus?: (sectionType: string) => void;
}) {
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [showMenu, setShowMenu] = useState(false);
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const l = lang === "ar";

  // Template suggestion strip — sections recommended by the active template
  const tpl = templateId ? TEMPLATES.find((t) => t.id === templateId) : undefined;
  const suggestions = (() => {
    if (!templateId) return [];
    const priority = TEMPLATE_SECTION_PRIORITY[templateId] ?? [];
    return priority.filter(
      (p) => p.type in SECTION_REGISTRY && !sections.some((s) => s.type === p.type)
    );
  })();

  // ── Section mutations ────────────────────────────────────────────────────────

  const updateSection = (id: string, data: Record<string, unknown>) => {
    onChange(sections.map((s) => (s.id === id ? { ...s, data } : s)));
    // First edit removes the "new/invitation" marker
    setNewIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

  const removeSection = (id: string) => {
    onChange(sections.filter((s) => s.id !== id));
    setOpenIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    setNewIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  };

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
    const id = `${type}_${Date.now()}`;
    const newSection: AnySectionInstance = {
      id,
      type,
      order: sections.length,
      data: { ...def.defaultData },
    };
    onChange([...sections, newSection]);
    // Skip invitation state for auto-populated sections
    if (!def.skipInviteState) {
      setNewIds((prev) => new Set([...prev, id]));
    }
  };

  // Opening a "new" section removes the invitation marker and expands the form.
  // Also fires onSectionFocus so the preview scrolls to that section.
  const toggleOpen = (id: string) => {
    setNewIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
    const opening = !openIds.has(id);
    setOpenIds((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
    // Fire focus outside the updater — calling the parent's setState inside a
    // state updater triggers a setState-during-render warning.
    if (opening) {
      const sec = sections.find((s) => s.id === id);
      if (sec) onSectionFocus?.(sec.type);
    }
  };

  // ── Drag-and-drop ────────────────────────────────────────────────────────────

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

  // ── Quick-add tiles ──────────────────────────────────────────────────────────

  const existingTypes = new Set(sections.map((s) => s.type));
  const quickAddDefs = QUICK_ADD_TYPES
    .filter((t) => !existingTypes.has(t))
    .slice(0, 3)
    .map((t) => SECTION_REGISTRY[t])
    .filter(Boolean);

  // Count non-legacy section types available to add
  const totalSectionTypes = SECTION_REGISTRY_LIST.filter((d) => !d.legacy).length;

  return (
    <div>
      {/* Template suggestion strip */}
      {suggestions.length > 0 && (
        <div style={{
          marginBottom: 14,
          padding: "10px 14px 12px",
          borderRadius: 10,
          background: tpl ? `${tpl.templateColor}0d` : DA_GOLD_SOFT,
          border: `1px dashed ${tpl ? `${tpl.templateColor}40` : "rgba(232,201,123,0.2)"}`,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 700, letterSpacing: "0.8px",
            textTransform: "uppercase" as const,
            color: tpl ? tpl.templateColor : SAND,
            marginBottom: 8, opacity: 0.8,
          }}>
            {l
              ? `مقترح لـ ${tpl ? tpl.nameAr : templateId}`
              : `Suggested for ${tpl?.name ?? templateId}`}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 6 }}>
            {suggestions.map((p) => {
              const label = l && p.labelAr
                ? p.labelAr
                : p.label ?? SECTION_REGISTRY[p.type as SectionTypeKey]?.label ?? p.type;
              return (
                <button
                  key={p.type}
                  onClick={() => addSection(p.type as SectionTypeKey)}
                  style={{
                    fontSize: 12, fontFamily: "inherit", cursor: "pointer",
                    padding: "4px 10px", borderRadius: 7,
                    background: tpl ? `${tpl.templateColor}18` : DA_GOLD_SOFT,
                    border: `1px solid ${tpl ? `${tpl.templateColor}30` : "rgba(232,201,123,0.2)"}`,
                    color: tpl ? tpl.templateColor : SAND,
                    display: "inline-flex", alignItems: "center", gap: 5,
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

      {/* Empty state */}
      {sections.length === 0 && !suggestions.length && (
        <div style={{
          padding: "28px 20px", borderRadius: 14,
          border: `1.5px dashed ${DA_RULE}`,
          textAlign: "center" as const, color: DA_INK3, fontSize: 13,
          marginBottom: 14, fontFamily: SANS,
        }}>
          {l ? "لا توجد أقسام بعد — أضف قسماً أدناه" : "No sections yet — add one below"}
        </div>
      )}

      {/* Section rows */}
      {sections.map((section, i) => (
        <div
          key={section.id}
          id={`section-${section.id}`}
          style={{ marginBottom: 10 }}
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
            isOpen={openIds.has(section.id)}
            onToggle={() => toggleOpen(section.id)}
            onChange={(data) => updateSection(section.id, data)}
            onRemove={() => removeSection(section.id)}
            onMoveUp={() => moveSection(i, -1)}
            onMoveDown={() => moveSection(i, 1)}
            userId={userId}
            lang={lang}
            templateId={templateId}
            isDragOver={dragOver === i}
            dragHandleProps={{ onMouseDown: (e) => e.stopPropagation() }}
            isMobile={isMobile}
            isNew={newIds.has(section.id)}
            onFocusWithin={onSectionFocus ? () => onSectionFocus(section.type) : undefined}
          />
        </div>
      ))}

      {/* Quick-add tiles */}
      {quickAddDefs.length > 0 && (
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : `repeat(${Math.min(quickAddDefs.length, 3)}, 1fr)`,
          gap: 10,
          marginTop: sections.length > 0 ? 18 : 0,
          marginBottom: 10,
        }}>
          {quickAddDefs.map((def) => (
            <button
              key={def.type}
              onClick={() => addSection(def.type as SectionTypeKey)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                textAlign: l ? "right" : "left",
                padding: "13px 14px", borderRadius: 11, cursor: "pointer",
                background: DA_SURFACE, border: `1px solid ${DA_RULE}`,
                fontFamily: SANS, transition: "border-color 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(176,138,62,.4)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = DA_RULE; }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 9, flexShrink: 0,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: DA_GOLD_SOFT, color: DA_GOLD,
              }}>
                <Icon name={def.icon} size={17} color={DA_GOLD} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: DA_INK1 }}>
                  {l ? def.labelAr : def.label}
                </div>
                <div style={{ fontSize: 11.5, color: DA_INK3, marginTop: 1 }}>
                  {l
                    ? ((def as any).descriptionAr ?? (def as any).description ?? "")
                    : ((def as any).description ?? "")}
                </div>
              </div>
              <Icon name="plus" size={15} color={DA_INK3} />
            </button>
          ))}
        </div>
      )}

      {/* Browse all sections */}
      <button
        onClick={() => setShowMenu(true)}
        style={{
          marginTop: quickAddDefs.length > 0 ? 6 : sections.length > 0 ? 18 : 0,
          width: "100%",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 9,
          padding: "13px 16px", borderRadius: 11, cursor: "pointer",
          background: "transparent", border: `1.5px dashed ${DA_RULE2}`,
          color: DA_INK1, fontFamily: SANS, fontSize: 13.5, fontWeight: 600,
          transition: "border-color 0.15s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = DA_GOLD; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = DA_RULE2; }}
      >
        {/* search icon */}
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={DA_GOLD} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        {l ? `تصفح جميع الأقسام (${totalSectionTypes})` : `Browse all ${totalSectionTypes} sections`}
        <span
          aria-hidden
          style={{ transform: l ? "scaleX(-1)" : "none", display: "inline-block", color: DA_INK3 }}
        >→</span>
      </button>

      {showMenu && (
        <AddSectionMenu
          existing={sections}
          onAdd={addSection}
          onClose={() => setShowMenu(false)}
          lang={lang}
          templateId={templateId}
        />
      )}
    </div>
  );
}
