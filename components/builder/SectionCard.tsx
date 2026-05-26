"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { SECTION_REGISTRY } from "@/lib/sections/registry";
import type { AnySectionInstance } from "@/lib/sections/types";
import { SectionEditor } from "./SectionEditor";
import { SAND } from "./constants";
import {
  DA_SURFACE, DA_INK1, DA_INK2, DA_INK3, DA_RULE, DA_RULE2,
  DA_GOLD, DA_GOLD_SOFT, DA_DANGER,
} from "@/lib/tokens";

export function SectionCard({
  section,
  index,
  total,
  onChange,
  onRemove,
  onMove,
  userId,
  lang,
  dragHandleProps,
  isDragOver,
}: {
  section: AnySectionInstance;
  index: number;
  total: number;
  onChange: (data: Record<string, unknown>) => void;
  onRemove: () => void;
  onMove: (direction: -1 | 1) => void;
  userId: string;
  lang: "en" | "ar";
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragOver?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const def = SECTION_REGISTRY[section.type];
  if (!def) return null;

  const l = lang === "ar";
  const label = l ? def.labelAr : def.label;
  const summary = def.summaryText ? def.summaryText(section.data, lang) : "";

  const deleteLabel = l ? "حذف" : "Delete";
  const moveUpLabel = l ? "أعلى" : "Move up";
  const moveDownLabel = l ? "أسفل" : "Move down";

  return (
    <div
      style={{
        marginBottom: 8,
        background: isDragOver ? DA_GOLD_SOFT : DA_SURFACE,
        border: `1px solid ${isDragOver ? DA_GOLD : DA_RULE}`,
        borderRadius: 14,
        overflow: "hidden",
        transition: "border-color 0.15s, background 0.15s",
        opacity: isDragOver ? 0.7 : 1,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "12px 14px",
          cursor: "pointer",
        }}
        onClick={() => setOpen((o) => !o)}
      >
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          style={{
            cursor: "grab",
            color: DA_INK3,
            padding: "0 2px",
            flexShrink: 0,
            fontSize: 16,
            lineHeight: 1,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          ⠿
        </div>

        {/* Icon + label */}
        <div style={{ flexShrink: 0, opacity: 0.7 }}>
          <Icon name={def.icon} size={15} color={DA_INK2} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: DA_INK1 }}>{label}</div>
          {summary && !open && (
            <div style={{ fontSize: 11.5, color: DA_INK3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>
              {summary}
            </div>
          )}
        </div>

        {/* Controls */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => onMove(-1)}
            disabled={index === 0}
            title={moveUpLabel}
            style={iconBtn(index === 0)}
          >↑</button>
          <button
            onClick={() => onMove(1)}
            disabled={index === total - 1}
            title={moveDownLabel}
            style={iconBtn(index === total - 1)}
          >↓</button>
          <button
            onClick={onRemove}
            title={deleteLabel}
            style={iconBtn(false)}
          >
            <Icon name="trash" size={11} color={DA_DANGER} />
          </button>
          <span style={{
            marginLeft: 4,
            color: DA_INK3,
            fontSize: 12,
            display: "inline-block",
            transform: open ? "rotate(180deg)" : "none",
            transition: "transform 0.15s",
          }}>▾</span>
        </div>
      </div>

      {/* Body */}
      {open && (
        <div style={{ padding: "0 14px 16px" }}>
          <SectionEditor
            def={def}
            data={section.data}
            onChange={onChange}
            userId={userId}
            lang={lang}
          />
        </div>
      )}
    </div>
  );
}

function iconBtn(disabled: boolean): React.CSSProperties {
  return {
    width: 26,
    height: 26,
    borderRadius: 7,
    border: "none",
    background: DA_SURFACE,
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    color: disabled ? DA_RULE2 : DA_INK3,
    opacity: disabled ? 0.4 : 1,
    padding: 0,
    lineHeight: 1,
  };
}
