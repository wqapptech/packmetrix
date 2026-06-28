"use client";

import { useState, useRef, useEffect } from "react";
import {
  DA_BG, DA_SURFACE, DA_INK1, DA_INK2, DA_INK3, DA_RULE, DA_GOLD,
} from "@/lib/tokens";
import { SAND } from "./constants";

// ─── FieldLabel ───────────────────────────────────────────────────────────────

export function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 600,
        color: DA_INK3,
        letterSpacing: "0.5px",
        textTransform: "uppercase",
        marginBottom: 6,
        marginTop: 16,
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      {children}
      {required && (
        <span style={{ color: DA_GOLD, fontSize: 10, lineHeight: 1 }}>*</span>
      )}
    </div>
  );
}

// ─── TextInput ────────────────────────────────────────────────────────────────

const INPUT_BASE: React.CSSProperties = {
  width: "100%",
  background: DA_SURFACE,
  border: `1px solid ${DA_RULE}`,
  borderRadius: 10,
  padding: "10px 14px",
  color: DA_INK1,
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.2s",
};

function onFocusGold(e: React.FocusEvent<HTMLElement>) {
  (e.target as HTMLElement).style.borderColor = DA_GOLD;
}
function onBlurNormal(e: React.FocusEvent<HTMLElement>) {
  (e.target as HTMLElement).style.borderColor = DA_RULE;
}

export function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={INPUT_BASE}
      onFocus={onFocusGold}
      onBlur={onBlurNormal}
    />
  );
}

export function TextArea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{ ...INPUT_BASE, resize: "vertical", lineHeight: 1.6 }}
      onFocus={onFocusGold}
      onBlur={onBlurNormal}
    />
  );
}

// ─── NumberInput ──────────────────────────────────────────────────────────────

export function NumberInput({
  value,
  onChange,
  min,
  max,
  placeholder,
  decimal,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  placeholder?: string;
  decimal?: boolean; // allow a single fractional part (e.g. a 4.8 rating)
}) {
  const [raw, setRaw] = useState(value === 0 ? "" : String(value));

  // Sync from parent only when external value actually changes
  const prevRef = useRef(value);
  useEffect(() => {
    if (value !== prevRef.current) {
      prevRef.current = value;
      setRaw(value === 0 ? "" : String(value));
    }
  }, [value]);

  return (
    <input
      type="text"
      inputMode={decimal ? "decimal" : "numeric"}
      pattern={decimal ? "[0-9.]*" : "[0-9]*"}
      value={raw}
      placeholder={placeholder}
      onChange={(e) => {
        const s = decimal
          ? e.target.value.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1")
          : e.target.value.replace(/[^0-9]/g, "");
        setRaw(s);
        if (s !== "" && s !== ".") {
          const n = Number(s);
          if (Number.isNaN(n)) return;
          if (min !== undefined && n < min) return;
          if (max !== undefined && n > max) return;
          prevRef.current = n;
          onChange(n);
        }
      }}
      onBlur={() => {
        if (raw === "") {
          const fallback = min ?? 0;
          prevRef.current = fallback;
          setRaw(fallback === 0 ? "" : String(fallback));
          onChange(fallback);
        }
      }}
      style={{ ...INPUT_BASE, width: "auto", minWidth: 80 }}
      onFocus={onFocusGold}
    />
  );
}

// ─── SelectInput ──────────────────────────────────────────────────────────────

export function SelectInput({
  value,
  onChange,
  options,
  lang,
}: {
  value: string;
  onChange: (v: string) => void;
  options: Array<{ value: string; label: string; labelAr?: string }>;
  lang: "en" | "ar";
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{
        ...INPUT_BASE,
        cursor: "pointer",
        appearance: "none",
        WebkitAppearance: "none",
      }}
      onFocus={onFocusGold}
      onBlur={onBlurNormal}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {lang === "ar" && opt.labelAr ? opt.labelAr : opt.label}
        </option>
      ))}
    </select>
  );
}

// ─── TagInput ────────────────────────────────────────────────────────────────

export function TagInput({
  value,
  onChange,
  placeholder,
  lang,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  lang: "en" | "ar";
}) {
  const [draft, setDraft] = useState("");

  const commit = () => {
    const trimmed = draft.trim();
    if (trimmed && !value.includes(trimmed)) onChange([...value, trimmed]);
    setDraft("");
  };

  const addLabel = lang === "ar" ? "إضافة" : "Add";

  return (
    <div>
      {value.length > 0 && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 7,
            marginBottom: 10,
          }}
        >
          {value.map((item, i) => (
            <span
              key={i}
              style={{
                background: DA_BG,
                border: `1px solid ${DA_RULE}`,
                borderRadius: 99,
                padding: "5px 11px",
                fontSize: 12,
                color: DA_INK2,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {item}
              <button
                onClick={() => onChange(value.filter((_, j) => j !== i))}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: DA_INK3,
                  padding: 0,
                  fontSize: 14,
                  lineHeight: 1,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commit();
            }
          }}
          placeholder={placeholder}
          style={{
            flex: 1,
            background: DA_SURFACE,
            border: `1px solid ${DA_RULE}`,
            borderRadius: 10,
            padding: "8px 12px",
            color: DA_INK1,
            fontSize: 12,
            fontFamily: "inherit",
            outline: "none",
          }}
          onFocus={onFocusGold}
          onBlur={onBlurNormal}
        />
        <button
          onClick={commit}
          style={{
            background: DA_SURFACE,
            border: `1px solid ${DA_RULE}`,
            borderRadius: 10,
            padding: "8px 14px",
            color: DA_INK3,
            fontSize: 12,
            fontFamily: "inherit",
            cursor: "pointer",
            whiteSpace: "nowrap",
          }}
        >
          {addLabel}
        </button>
      </div>
    </div>
  );
}
