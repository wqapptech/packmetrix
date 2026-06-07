"use client";

import { useState, useRef, useEffect } from "react";
import Icon from "@/components/Icon";
import { SECTION_REGISTRY } from "@/lib/sections/registry";
import type { AnySectionInstance } from "@/lib/sections/types";
import { SectionEditor } from "./SectionEditor";
import {
  DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2, DA_GOLD, DA_GOLD_SOFT, DA_GOLD_DEEP, DA_DANGER,
} from "@/lib/tokens";

const SANS = `var(--font-inter-tight), system-ui, sans-serif`;

export function SectionCard({
  section,
  index,
  total,
  isOpen,
  onToggle,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  userId,
  lang,
  dragHandleProps,
  isDragOver,
  isMobile = false,
  isNew = false,
  onFocusWithin,
}: {
  section: AnySectionInstance;
  index: number;
  total: number;
  isOpen: boolean;
  onToggle: () => void;
  onChange: (data: Record<string, unknown>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  userId: string;
  lang: "en" | "ar";
  dragHandleProps?: React.HTMLAttributes<HTMLDivElement>;
  isDragOver?: boolean;
  isMobile?: boolean;
  isNew?: boolean;
  onFocusWithin?: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const def = SECTION_REGISTRY[section.type];
  if (!def) return null;

  const l = lang === "ar";
  const label = l ? def.labelAr : def.label;
  const summary = def.summaryText ? def.summaryText(section.data, lang) : "";
  const inviteDesc = l
    ? ((def as any).descriptionAr ?? (def as any).description ?? "")
    : ((def as any).description ?? "");

  // Close ⋯ menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // ── Empty / invitation state ───────────────────────────────────────────────
  if (isNew) {
    return (
      <div
        style={{
          border: `1.5px dashed ${DA_RULE2}`,
          borderRadius: 12,
          background: "rgba(176,138,62,.035)",
          padding: isMobile ? "14px 14px" : "16px 18px",
          display: "flex",
          alignItems: isMobile ? "flex-start" : "center",
          flexDirection: isMobile ? "column" : "row",
          gap: isMobile ? 12 : 14,
        }}
      >
        <div style={{
          display: "flex", alignItems: "center", gap: 13,
          width: isMobile ? "100%" : "auto",
          flex: isMobile ? "none" : "0 0 auto",
        }}>
          <div style={{
            width: 38, height: 38, borderRadius: 9, flexShrink: 0,
            border: `1.5px dashed ${DA_RULE2}`, color: DA_GOLD,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: DA_SURFACE,
          }}>
            <Icon name={def.icon} size={17} color={DA_GOLD} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: DA_INK1 }}>
                {label}
              </span>
              <span style={{
                fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 0.4,
                textTransform: "uppercase" as const, color: DA_INK3,
                border: `1px solid ${DA_RULE2}`, borderRadius: 5, padding: "1px 6px",
              }}>
                {l ? "فارغ" : "Empty"}
              </span>
            </div>
            {inviteDesc && (
              <div style={{ fontFamily: SANS, fontSize: 13, color: DA_INK2, marginTop: 3 }}>
                {inviteDesc}
              </div>
            )}
          </div>
        </div>
        <button
          onClick={onToggle}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7,
            flexShrink: 0, whiteSpace: "nowrap" as const,
            width: isMobile ? "100%" : "auto",
            padding: "9px 15px", borderRadius: 9,
            background: DA_GOLD_SOFT, border: `1px solid rgba(176,138,62,.35)`,
            color: DA_GOLD_DEEP, fontFamily: SANS, fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}
        >
          <Icon name="plus" size={14} color={DA_GOLD_DEEP} />
          {l ? "إضافة محتوى" : "Add content"}
          <span
            aria-hidden
            style={{
              marginInlineStart: 2,
              transform: l ? "scaleX(-1)" : "none",
              display: "inline-block",
              fontSize: 14,
            }}
          >→</span>
        </button>
      </div>
    );
  }

  // ── Filled state (closed or open) ──────────────────────────────────────────
  const showAffordances = isMobile || hovered || menuOpen || isOpen;

  return (
    <div
      onMouseEnter={() => !isMobile && setHovered(true)}
      onMouseLeave={() => !isMobile && setHovered(false)}
      style={{
        border: `1px solid ${isDragOver ? DA_GOLD : isOpen ? "rgba(176,138,62,.55)" : DA_RULE}`,
        borderRadius: 12,
        background: isDragOver ? DA_GOLD_SOFT : DA_SURFACE,
        boxShadow: isOpen && !isDragOver ? `0 0 0 3px ${DA_GOLD_SOFT}` : "none",
        opacity: isDragOver ? 0.7 : 1,
        transition: "border-color 0.15s, box-shadow 0.15s",
      }}
    >
      {/* Header — entire row is the click target */}
      <div
        onClick={onToggle}
        style={{
          display: "flex",
          alignItems: "center",
          gap: isMobile ? 10 : 12,
          padding: isMobile ? "12px 12px" : "13px 14px 13px 12px",
          background: hovered && !isOpen ? "rgba(176,138,62,.05)" : "transparent",
          borderRadius: isOpen ? "11px 11px 0 0" : 11,
          cursor: "pointer",
        }}
      >
        {/* Drag grip — desktop hover only */}
        {!isMobile && (
          <div
            {...dragHandleProps}
            style={{
              width: 14, flexShrink: 0, display: "flex", justifyContent: "center",
              color: DA_INK3, opacity: hovered ? 1 : 0,
              cursor: "grab", fontSize: 15, lineHeight: 1,
              transition: "opacity 0.15s",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            ⠿
          </div>
        )}

        {/* Icon tile */}
        <div style={{
          width: isMobile ? 34 : 38, height: isMobile ? 34 : 38, borderRadius: 9, flexShrink: 0,
          background: isOpen ? DA_GOLD : DA_GOLD_SOFT,
          color: isOpen ? "#fff" : DA_GOLD,
          display: "flex", alignItems: "center", justifyContent: "center",
          transition: "background 0.15s, color 0.15s",
        }}>
          <Icon
            name={def.icon}
            size={isMobile ? 15 : 17}
            color={isOpen ? "#fff" : DA_GOLD}
          />
        </div>

        {/* Label + summary */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: DA_INK1 }}>
            {label}
          </div>
          {summary && (
            <div style={{
              fontFamily: SANS, fontSize: 12.5, color: DA_INK3, marginTop: 2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {summary}
            </div>
          )}
        </div>

        {/* Edit / Open affordance button */}
        <div
          onClick={(e) => { e.stopPropagation(); onToggle(); }}
          style={{
            display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0,
            fontFamily: SANS, fontSize: 12.5, fontWeight: 600,
            color: isOpen ? DA_GOLD_DEEP : (showAffordances ? DA_INK1 : DA_INK3),
            padding: "6px 10px", borderRadius: 8,
            background: isOpen ? DA_GOLD_SOFT : (hovered && !isMobile ? DA_SURFACE2 : "transparent"),
            border: `1px solid ${isOpen ? "rgba(176,138,62,.3)" : (hovered && !isMobile ? DA_RULE2 : "transparent")}`,
            transition: "all 0.15s",
          }}
        >
          {isOpen ? (
            <>
              <span style={{ display: "inline-block", transform: "rotate(180deg)", lineHeight: 1 }}>▾</span>
              {l ? "مفتوح" : "Open"}
            </>
          ) : (
            <>
              {/* pencil unicode */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
              {l ? "تعديل" : "Edit"}
            </>
          )}
        </div>

        {/* ⋯ overflow menu */}
        <div
          ref={menuRef}
          style={{ position: "relative", flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((m) => !m); }}
            style={{
              width: 30, height: 30, borderRadius: 7, border: "none", cursor: "pointer",
              background: menuOpen ? DA_SURFACE2 : "transparent",
              color: DA_INK3,
              opacity: isMobile || hovered || menuOpen ? 1 : 0,
              display: "flex", alignItems: "center", justifyContent: "center",
              transition: "opacity 0.15s",
            }}
            title={l ? "خيارات" : "Options"}
          >
            {/* three dots */}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.7" />
              <circle cx="12" cy="12" r="1.7" />
              <circle cx="19" cy="12" r="1.7" />
            </svg>
          </button>

          {menuOpen && (
            <div style={{
              position: "absolute", top: "calc(100% + 4px)", insetInlineEnd: 0, zIndex: 40,
              width: 180, padding: 6,
              background: DA_SURFACE, border: `1px solid ${DA_RULE2}`, borderRadius: 10,
              boxShadow: "0 12px 32px -8px rgba(26,20,16,.28)",
              fontFamily: SANS, fontSize: 13, color: DA_INK1,
            }}>
              <button
                disabled={index === 0}
                onClick={() => { onMoveUp(); setMenuOpen(false); }}
                style={menuItemStyle(index === 0, false)}
              >
                <span style={{ color: DA_INK3, fontSize: 11 }}>↑</span>
                {l ? "تحريك لأعلى" : "Move up"}
              </button>
              <button
                disabled={index === total - 1}
                onClick={() => { onMoveDown(); setMenuOpen(false); }}
                style={menuItemStyle(index === total - 1, false)}
              >
                <span style={{ color: DA_INK3, fontSize: 11 }}>↓</span>
                {l ? "تحريك لأسفل" : "Move down"}
              </button>
              <div style={{ height: 1, background: DA_RULE, margin: "5px 6px" }} />
              <button
                onClick={() => { onRemove(); setMenuOpen(false); }}
                style={menuItemStyle(false, true)}
              >
                <Icon name="trash" size={13} color={DA_DANGER} />
                {l ? "حذف القسم" : "Delete section"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Body — visible when open */}
      {isOpen && (
        <div
          onFocus={onFocusWithin}
          style={{
            padding: "16px 16px 18px",
            borderTop: `1px solid ${DA_RULE}`,
            borderRadius: "0 0 11px 11px",
            overflow: "hidden",
          }}
        >
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

function menuItemStyle(disabled: boolean, danger: boolean): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 10,
    width: "100%", padding: "8px 10px", borderRadius: 7,
    cursor: disabled ? "not-allowed" : "pointer",
    background: "transparent", border: "none",
    fontFamily: "inherit", fontSize: 13,
    textAlign: "left" as const,
    opacity: disabled ? 0.4 : 1,
    color: danger ? DA_DANGER : "inherit",
  };
}
