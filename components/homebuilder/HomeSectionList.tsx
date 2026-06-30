"use client";

// Homepage builder section list — a SINGLE ordered list of the buildable
// sections (enabled + disabled together). Each row: drag handle (native DnD),
// icon, label, enable/disable toggle (hero is locked on), ⋯ move up/down, and an
// expandable editor body. An enabled-but-empty authored section shows an inline
// "add content" affordance (the list-side counterpart to the preview placeholder).

import { useRef, useState } from "react";
import Icon from "@/components/Icon";
import { pick, resolveVariant, SECTION_VARIANTS, type HomeSection, type Loc } from "@/lib/homepage";
import { HOME_FIELD_REGISTRY } from "@/lib/homepage-fields";
import { HomeSectionEditor } from "./HomeSectionEditor";
import {
  DA_INK1, DA_INK3, DA_RULE, DA_RULE2, DA_SURFACE, DA_SURFACE2,
  DA_GOLD, DA_GOLD_SOFT, DA_GOLD_DEEP, DA_GREEN,
} from "@/lib/tokens";

const SANS = `var(--font-sans)`;
const locEmpty = (v: unknown): boolean => {
  if (!v || typeof v !== "object") return true;
  const o = v as Loc;
  return !((o.en || "").trim() || (o.ar || "").trim());
};

// Mirrors the renderer's per-section empty test, restricted to AUTHORED content
// the agency controls here (derived sections — featured/destinations/stats
// numbers — are excluded; hero/contact always render).
function isAuthoredEmpty(s: HomeSection): boolean {
  const c = (s.content || {}) as Record<string, unknown>;
  const arr = (k: string) => Array.isArray(c[k]) ? (c[k] as unknown[]) : [];
  switch (s.type) {
    case "about": return locEmpty(c.body);
    case "why_us":
    case "services":
    case "testimonials": return arr("items").length === 0;
    case "accreditation": return arr("badges").length === 0;
    case "team": return arr("members").length === 0;
    case "seasonal_offers": return locEmpty(c.heading) && locEmpty(c.body);
    case "stats": return arr("qualities").length === 0 && locEmpty(c.fallbackNote);
    default: return false; // hero, contact, featured_packages, destinations
  }
}

function Pill({ on }: { on: boolean }) {
  return (
    <div style={{
      width: 38, height: 21, borderRadius: 11, flexShrink: 0,
      background: on ? DA_GREEN : DA_RULE2, transition: "background .2s", position: "relative",
    }}>
      <div style={{
        position: "absolute", top: 3, insetInlineStart: on ? 20 : 3,
        width: 15, height: 15, borderRadius: "50%", background: "#fff",
        transition: "inset-inline-start .2s", boxShadow: "0 1px 3px rgba(0,0,0,.15)",
      }} />
    </div>
  );
}

export function HomeSectionList({
  sections, onChange, userId, lang, onSectionFocus,
}: {
  sections: HomeSection[];
  onChange: (next: HomeSection[]) => void;
  userId: string;
  lang: "en" | "ar";
  onSectionFocus?: (type: string) => void;
}) {
  const l = lang === "ar";
  const [openType, setOpenType] = useState<string | null>(null);
  const [menuType, setMenuType] = useState<string | null>(null);
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const reorder = (next: HomeSection[]) => onChange(next.map((s, i) => ({ ...s, order: i })));

  const setEnabled = (type: string, enabled: boolean) => {
    if (type === "hero") return; // hero is always on
    onChange(sections.map((s) => (s.type === type ? { ...s, enabled } : s)));
  };
  const setContent = (type: string, content: Record<string, unknown>) =>
    onChange(sections.map((s) => (s.type === type ? { ...s, content: content as HomeSection["content"] } : s)));
  const setVariant = (type: string, variant: string) =>
    onChange(sections.map((s) => (s.type === type ? { ...s, variant } : s)));

  const move = (i: number, dir: -1 | 1) => {
    const to = i + dir;
    if (to < 0 || to >= sections.length) return;
    const next = [...sections];
    const [m] = next.splice(i, 1);
    next.splice(to, 0, m);
    reorder(next);
    setMenuType(null);
  };

  const onDrop = (i: number) => {
    const from = dragIdx.current;
    if (from !== null && from !== i) {
      const next = [...sections];
      const [m] = next.splice(from, 1);
      next.splice(i, 0, m);
      reorder(next);
    }
    dragIdx.current = null;
    setDragOver(null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {sections.map((s, i) => {
        const def = HOME_FIELD_REGISTRY[s.type];
        if (!def) return null;
        const isHero = s.type === "hero";
        const isOpen = openType === s.type;
        const enabled = isHero ? true : s.enabled;
        const showEmpty = enabled && isAuthoredEmpty(s);
        return (
          <div
            key={s.type}
            draggable
            onDragStart={() => { dragIdx.current = i; }}
            onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
            onDrop={() => onDrop(i)}
            onDragEnd={() => { dragIdx.current = null; setDragOver(null); }}
            style={{
              border: `1px solid ${dragOver === i ? DA_GOLD : isOpen ? "rgba(176,138,62,.55)" : DA_RULE}`,
              borderRadius: 12,
              background: dragOver === i ? DA_GOLD_SOFT : DA_SURFACE,
              boxShadow: isOpen && dragOver !== i ? `0 0 0 3px ${DA_GOLD_SOFT}` : "none",
              opacity: enabled ? 1 : 0.62,
              transition: "border-color .15s, box-shadow .15s, opacity .15s",
            }}
          >
            {/* Header row */}
            <div style={{ display: "flex", alignItems: "center", gap: 11, padding: "12px 12px 12px 10px" }}>
              <div style={{ width: 14, flexShrink: 0, display: "flex", justifyContent: "center", color: DA_INK3, cursor: "grab", fontSize: 14 }}>⠿</div>
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: isOpen ? DA_GOLD : DA_GOLD_SOFT, color: isOpen ? "#fff" : DA_GOLD,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name={def.icon} size={17} color={isOpen ? "#fff" : DA_GOLD} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: DA_INK1 }}>{pick(def.label, lang)}</span>
                  {isHero && (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontSize: 10, fontWeight: 600, letterSpacing: .4, color: DA_INK3 }}>
                      <Icon name="lock" size={10} color={DA_INK3} />
                      {l ? "دائم" : "Always on"}
                    </span>
                  )}
                </div>
                <div style={{ fontFamily: SANS, fontSize: 12, color: DA_INK3, marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {pick(def.description, lang)}
                </div>
              </div>

              {/* Edit toggle (pencil) */}
              <button
                onClick={() => { setOpenType(isOpen ? null : s.type); if (!isOpen) onSectionFocus?.(s.type); }}
                title={isOpen ? (l ? "إغلاق" : "Close") : (l ? "تعديل" : "Edit")}
                style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                  width: 30, height: 30, borderRadius: 8, cursor: "pointer",
                  color: isOpen ? DA_GOLD_DEEP : DA_INK3,
                  background: isOpen ? DA_GOLD_SOFT : "transparent",
                  border: `1px solid ${isOpen ? "rgba(176,138,62,.3)" : DA_RULE2}`,
                }}
              >
                <Icon name="edit" size={14} color={isOpen ? DA_GOLD_DEEP : DA_INK3} />
              </button>

              {/* Enable/disable */}
              {isHero ? (
                <div title={l ? "قسم مطلوب — لا يمكن إيقافه" : "Required — cannot be turned off"} style={{ flexShrink: 0, opacity: 0.55, cursor: "not-allowed" }}>
                  <Pill on />
                </div>
              ) : (
                <button onClick={() => setEnabled(s.type, !enabled)} style={{ background: "none", border: "none", padding: 0, cursor: "pointer", flexShrink: 0 }} title={enabled ? (l ? "مفعّل" : "Enabled") : (l ? "مخفي" : "Hidden")}>
                  <Pill on={enabled} />
                </button>
              )}

              {/* ⋯ move menu */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <button
                  onClick={() => setMenuType(menuType === s.type ? null : s.type)}
                  style={{ width: 30, height: 30, borderRadius: 7, border: "none", cursor: "pointer", background: menuType === s.type ? DA_SURFACE2 : "transparent", color: DA_INK3, display: "flex", alignItems: "center", justifyContent: "center" }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><circle cx="5" cy="12" r="1.7" /><circle cx="12" cy="12" r="1.7" /><circle cx="19" cy="12" r="1.7" /></svg>
                </button>
                {menuType === s.type && (
                  <div style={{ position: "absolute", top: "calc(100% + 4px)", insetInlineEnd: 0, zIndex: 40, width: 160, padding: 6, background: DA_SURFACE, border: `1px solid ${DA_RULE2}`, borderRadius: 10, boxShadow: "0 12px 32px -8px rgba(26,20,16,.28)", fontFamily: SANS, fontSize: 13 }}>
                    <button disabled={i === 0} onClick={() => move(i, -1)} style={menuItem(i === 0)}><span style={{ color: DA_INK3 }}>↑</span>{l ? "تحريك لأعلى" : "Move up"}</button>
                    <button disabled={i === sections.length - 1} onClick={() => move(i, 1)} style={menuItem(i === sections.length - 1)}><span style={{ color: DA_INK3 }}>↓</span>{l ? "تحريك لأسفل" : "Move down"}</button>
                  </div>
                )}
              </div>
            </div>

            {/* Empty affordance */}
            {showEmpty && !isOpen && (
              <button
                onClick={() => { setOpenType(s.type); onSectionFocus?.(s.type); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 8, textAlign: l ? "right" : "left",
                  padding: "9px 14px", borderTop: `1px solid rgba(176,138,62,.18)`,
                  background: "rgba(176,138,62,.05)", border: "none", cursor: "pointer",
                  borderRadius: "0 0 11px 11px", fontFamily: SANS, color: DA_GOLD_DEEP, fontSize: 12,
                }}
              >
                <Icon name="plus" size={13} color={DA_GOLD_DEEP} />
                {l ? "مفعّل لكنه فارغ — أضف محتوى ليظهر للزوار" : "On but empty — add content so visitors see it"}
              </button>
            )}

            {/* Editor body */}
            {isOpen && (
              <div style={{ padding: "16px 16px 18px", borderTop: `1px solid ${DA_RULE}` }}>
                <VariantStrip section={s} onPick={(v) => setVariant(s.type, v)} lang={lang} />
                <HomeSectionEditor
                  def={def}
                  content={(s.content || {}) as Record<string, unknown>}
                  onChange={(c) => setContent(s.type, c)}
                  userId={userId}
                  lang={lang}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Layout picker — a row of chips offered only when a section type has more than
// one implemented variant. Switching is content-safe (variant is layout-only),
// so it just re-flows the same authored data and the preview rebuilds instantly.
function VariantStrip({ section, onPick, lang }: { section: HomeSection; onPick: (v: string) => void; lang: "en" | "ar" }) {
  const variants = SECTION_VARIANTS[section.type] || [];
  if (variants.length < 2) return null;
  const active = resolveVariant(section);
  const l = lang === "ar";
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: DA_INK3, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 8 }}>
        {l ? "التصميم" : "Layout"}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {variants.map((v) => {
          const on = v.id === active;
          return (
            <button
              key={v.id}
              onClick={() => onPick(v.id)}
              style={{
                padding: "7px 13px", borderRadius: 8, cursor: "pointer", fontFamily: SANS, fontSize: 12.5, fontWeight: 600,
                background: on ? DA_GOLD_SOFT : DA_SURFACE, color: on ? DA_GOLD_DEEP : DA_INK1,
                border: `1px solid ${on ? "rgba(176,138,62,.45)" : DA_RULE2}`, transition: "all .15s",
              }}
            >
              {pick(v.label, lang)}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function menuItem(disabled: boolean): React.CSSProperties {
  return {
    display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 10px", borderRadius: 7,
    cursor: disabled ? "not-allowed" : "pointer", background: "transparent", border: "none",
    fontFamily: "inherit", fontSize: 13, textAlign: "left", opacity: disabled ? 0.4 : 1, color: DA_INK1,
  };
}
