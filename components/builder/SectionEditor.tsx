"use client";

import { useRef, useState } from "react";
import Icon from "@/components/Icon";
import type { FieldDef, SectionTypeDef } from "@/lib/sections/types";
import { SAND } from "./constants";
import {
  DA_SURFACE,
  DA_INK1,
  DA_INK2,
  DA_INK3,
  DA_RULE,
  DA_RULE2,
  DA_GOLD,
  DA_GOLD_SOFT,
  DA_DANGER,
} from "@/lib/tokens";
import { FieldLabel, TagInput, TextArea, TextInput, NumberInput, SelectInput } from "./primitives";
import { ImageField } from "./ImageField";
import { VideoField } from "./VideoField";
import { ImageListField } from "./ImageListField";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}
function num(v: unknown): number {
  return typeof v === "number" ? v : 0;
}
function arr(v: unknown): unknown[] {
  return Array.isArray(v) ? v : [];
}
function record(v: unknown): Record<string, unknown> {
  return v !== null && typeof v === "object" && !Array.isArray(v)
    ? (v as Record<string, unknown>)
    : {};
}
function arrOfRecord(v: unknown): Record<string, unknown>[] {
  return arr(v).map(record);
}

function pick<T>(en: T, ar: T, lang: "en" | "ar"): T {
  return lang === "ar" ? ar : en;
}

function makeEmptyItem(itemFields: FieldDef[], existingCount: number): Record<string, unknown> {
  const item: Record<string, unknown> = {};
  for (const f of itemFields) {
    switch (f.type) {
      case "text":
      case "textarea":
      case "richtext":
      case "image":
      case "video":
        item[f.key] = "";
        break;
      case "number":
        // Auto-increment fields named "day" or "order"
        item[f.key] =
          f.key === "day" || f.key === "order"
            ? existingCount + 1
            : (f.min ?? 0);
        break;
      case "tagList":
      case "imageList":
        item[f.key] = [];
        break;
      case "select":
        item[f.key] = f.options?.[0]?.value ?? "";
        break;
      default:
        item[f.key] = "";
    }
  }
  // Auto-generate an id if no field defines one (needed for TReview compatibility)
  if (!("id" in item)) {
    item.id = `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
  }
  return item;
}

// ─── Field renderer (forward-declared so RepeaterField can call it) ───────────

// The actual render logic lives in FieldRenderer below. RepeaterField calls
// renderField() which is the same function — no circular module dependency.

type RenderCtx = {
  userId: string;
  lang: "en" | "ar";
};

function renderField(
  field: FieldDef,
  value: unknown,
  onChange: (v: unknown) => void,
  parentData: Record<string, unknown>,
  ctx: RenderCtx
): React.ReactNode {
  const { userId, lang } = ctx;
  const placeholder =
    lang === "ar" && field.placeholderAr ? field.placeholderAr : field.placeholder;

  switch (field.type) {
    case "text":
      return (
        <TextInput
          value={str(value)}
          onChange={onChange}
          placeholder={placeholder}
        />
      );

    case "textarea":
    case "richtext":
      return (
        <TextArea
          value={str(value)}
          onChange={onChange}
          placeholder={placeholder}
          rows={field.type === "richtext" ? 6 : 3}
        />
      );

    case "number":
      return (
        <NumberInput
          value={num(value)}
          onChange={onChange}
          min={field.min}
          max={field.max}
          placeholder={placeholder}
        />
      );

    case "select":
      return (
        <SelectInput
          value={str(value)}
          onChange={onChange}
          options={field.options ?? []}
          lang={lang}
        />
      );

    case "tagList":
      return (
        <TagInput
          value={arr(value).map(String)}
          onChange={onChange}
          placeholder={placeholder}
          lang={lang}
        />
      );

    case "image":
      return (
        <ImageField
          value={str(value)}
          onChange={onChange}
          userId={userId}
          lang={lang}
        />
      );

    case "video":
      return (
        <VideoField
          value={str(value)}
          onChange={onChange}
          userId={userId}
          lang={lang}
        />
      );

    case "imageList":
      return (
        <ImageListField
          value={arr(value).map(String)}
          onChange={onChange}
          userId={userId}
          lang={lang}
        />
      );

    case "repeater":
      if (!field.itemFields) return null;
      return (
        <RepeaterField
          field={field}
          value={arrOfRecord(value)}
          onChange={onChange}
          ctx={ctx}
        />
      );

    default:
      return null;
  }
}

// ─── Repeater ─────────────────────────────────────────────────────────────────

function RepeaterField({
  field,
  value,
  onChange,
  ctx,
}: {
  field: FieldDef;
  value: Record<string, unknown>[];
  onChange: (v: unknown) => void;
  ctx: RenderCtx;
}) {
  const { lang } = ctx;
  const itemFields = field.itemFields ?? [];
  const [openIdx, setOpenIdx] = useState<number | null>(value.length > 0 ? 0 : null);
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const addLabel = pick(`Add ${field.itemLabel ?? "item"}`, `إضافة ${field.itemLabelAr ?? "عنصر"}`, lang);
  const emptyLabel = pick(
    `No ${(field.itemLabel ?? "item").toLowerCase()}s yet — click below to add one`,
    `لا يوجد ${field.itemLabelAr ?? "عناصر"} بعد — انقر أدناه لإضافة`,
    lang
  );
  const duplicateLabel = pick("Duplicate", "نسخ", lang);
  const deleteLabel = pick("Delete", "حذف", lang);
  const moveUpLabel = pick("Up", "أعلى", lang);
  const moveDownLabel = pick("Down", "أسفل", lang);

  const update = (items: Record<string, unknown>[]) => onChange(items);

  const add = () => {
    const next = [...value, makeEmptyItem(itemFields, value.length)];
    update(next);
    setOpenIdx(next.length - 1);
  };

  const remove = (i: number) => {
    const next = value.filter((_, j) => j !== i);
    update(next);
    setOpenIdx(i > 0 ? i - 1 : next.length > 0 ? 0 : null);
  };

  const duplicate = (i: number) => {
    const next = [...value.slice(0, i + 1), { ...value[i] }, ...value.slice(i + 1)];
    update(next);
    setOpenIdx(i + 1);
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= value.length) return;
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    update(next);
    setOpenIdx(to);
  };

  const setItemField = (i: number, key: string, v: unknown) => {
    const next = [...value];
    next[i] = { ...next[i], [key]: v };
    update(next);
  };

  // Drag reorder
  const onDragStart = (i: number) => { dragIdx.current = i; };
  const onDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOver(i); };
  const onDrop = (i: number) => {
    const from = dragIdx.current;
    if (from !== null && from !== i) move(from, i);
    dragIdx.current = null;
    setDragOver(null);
  };
  const onDragEnd = () => { dragIdx.current = null; setDragOver(null); };

  // Derive a short summary for collapsed item headers
  function itemSummary(item: Record<string, unknown>, idx: number): string {
    const firstText = itemFields.find(
      (f) => (f.type === "text" || f.type === "textarea") && str(item[f.key])
    );
    if (firstText) {
      const v = str(item[firstText.key]);
      return v.length > 48 ? v.slice(0, 48) + "…" : v;
    }
    const numField = itemFields.find((f) => f.type === "number");
    if (numField) {
      const label = lang === "ar" && field.itemLabelAr ? field.itemLabelAr : (field.itemLabel ?? "Item");
      return `${label} ${num(item[numField.key]) || idx + 1}`;
    }
    const label = lang === "ar" && field.itemLabelAr ? field.itemLabelAr : (field.itemLabel ?? "Item");
    return `${label} ${idx + 1}`;
  }

  return (
    <div>
      {value.length === 0 && (
        <div
          style={{
            padding: "20px 16px",
            borderRadius: 12,
            border: `1.5px dashed ${DA_RULE}`,
            textAlign: "center",
            color: DA_INK3,
            fontSize: 13,
            marginBottom: 10,
          }}
        >
          {emptyLabel}
        </div>
      )}

      {value.map((item, i) => {
        const isOpen = openIdx === i;
        const summary = itemSummary(item, i);
        return (
          <div
            key={i}
            draggable
            onDragStart={() => onDragStart(i)}
            onDragOver={(e) => onDragOver(e, i)}
            onDrop={() => onDrop(i)}
            onDragEnd={onDragEnd}
            style={{
              marginBottom: 8,
              background: dragOver === i ? DA_GOLD_SOFT : DA_SURFACE,
              border: `1px solid ${dragOver === i ? DA_GOLD : DA_RULE}`,
              borderRadius: 12,
              overflow: "hidden",
              transition: "border-color 0.15s, background 0.15s",
              opacity: dragOver === i ? 0.6 : 1,
            }}
          >
            {/* Item header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                cursor: "pointer",
              }}
              onClick={() => setOpenIdx(isOpen ? null : i)}
            >
              {/* Drag handle */}
              <div
                style={{ cursor: "grab", color: DA_INK3, padding: "0 2px", flexShrink: 0 }}
                onMouseDown={(e) => e.stopPropagation()}
              >
                ⠿
              </div>

              {/* Summary */}
              <div style={{ flex: 1, fontSize: 13, color: DA_INK1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {summary}
              </div>

              {/* Controls */}
              <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
                <button
                  onClick={(e) => { e.stopPropagation(); move(i, i - 1); }}
                  disabled={i === 0}
                  title={moveUpLabel}
                  style={iconBtn(i === 0)}
                >
                  ↑
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); move(i, i + 1); }}
                  disabled={i === value.length - 1}
                  title={moveDownLabel}
                  style={iconBtn(i === value.length - 1)}
                >
                  ↓
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); duplicate(i); }}
                  title={duplicateLabel}
                  style={iconBtn(false)}
                >
                  <Icon name="copy" size={11} color={DA_INK2} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); remove(i); }}
                  title={deleteLabel}
                  style={iconBtn(false)}
                >
                  <Icon name="trash" size={11} color={DA_DANGER} />
                </button>
                <span style={{ marginLeft: 4, color: DA_INK3, fontSize: 12, transition: "transform 0.15s", display: "inline-block", transform: isOpen ? "rotate(180deg)" : "none" }}>
                  ▾
                </span>
              </div>
            </div>

            {/* Item body */}
            {isOpen && (
              <div style={{ padding: "0 14px 14px" }}>
                {itemFields.map((subField) => {
                  if (subField.showIf && !subField.showIf(item)) return null;
                  const label =
                    lang === "ar" && subField.labelAr
                      ? subField.labelAr
                      : subField.label;
                  const helpText =
                    lang === "ar" && subField.helpTextAr
                      ? subField.helpTextAr
                      : subField.helpText;
                  return (
                    <div key={subField.key}>
                      <FieldLabel required={subField.required}>{label}</FieldLabel>
                      {helpText && (
                        <div style={{ fontSize: 11.5, color: DA_INK3, marginBottom: 6 }}>
                          {helpText}
                        </div>
                      )}
                      {renderField(
                        subField,
                        item[subField.key],
                        (v) => setItemField(i, subField.key, v),
                        item,
                        ctx
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      <button
        onClick={add}
        style={{
          marginTop: 4,
          fontSize: 12,
          color: SAND,
          background: DA_GOLD_SOFT,
          border: `1px solid ${DA_RULE2}`,
          borderRadius: 8,
          cursor: "pointer",
          fontFamily: "inherit",
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
        }}
      >
        <Icon name="plus" size={13} color={SAND} />
        {addLabel}
      </button>
    </div>
  );
}

function iconBtn(disabled: boolean): React.CSSProperties {
  return {
    width: 24,
    height: 24,
    borderRadius: 6,
    border: "none",
    background: DA_GOLD_SOFT,
    cursor: disabled ? "not-allowed" : "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 12,
    color: disabled ? DA_INK3 : DA_INK2,
    opacity: disabled ? 0.4 : 1,
    padding: 0,
    lineHeight: 1,
  };
}

// ─── FieldRenderer (public component) ────────────────────────────────────────

export function FieldRenderer({
  field,
  value,
  onChange,
  parentData,
  userId,
  lang,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  parentData: Record<string, unknown>;
  userId: string;
  lang: "en" | "ar";
}) {
  return (
    <>
      {renderField(field, value, onChange, parentData, { userId, lang })}
    </>
  );
}

// ─── SectionEditor ────────────────────────────────────────────────────────────

export function SectionEditor({
  data,
  def,
  onChange,
  userId,
  lang,
}: {
  data: Record<string, unknown>;
  def: SectionTypeDef;
  onChange: (data: Record<string, unknown>) => void;
  userId: string;
  lang: "en" | "ar";
}) {
  const ctx: RenderCtx = { userId, lang };

  const setField = (key: string, value: unknown) =>
    onChange({ ...data, [key]: value });

  return (
    <div>
      {def.fields.map((field) => {
        if (field.showIf && !field.showIf(data)) return null;

        const label =
          lang === "ar" && field.labelAr ? field.labelAr : field.label;
        const helpText =
          lang === "ar" && field.helpTextAr ? field.helpTextAr : field.helpText;

        return (
          <div key={field.key}>
            <FieldLabel required={field.required}>{label}</FieldLabel>
            {helpText && (
              <div style={{ fontSize: 11.5, color: DA_INK3, marginBottom: 6, lineHeight: 1.5 }}>
                {helpText}
              </div>
            )}
            {renderField(field, data[field.key], (v) => setField(field.key, v), data, ctx)}
          </div>
        );
      })}
    </div>
  );
}
