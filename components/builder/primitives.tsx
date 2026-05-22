"use client";

import { useState } from "react";
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
        fontSize: 12,
        fontWeight: 600,
        color: "rgba(255,255,255,0.45)",
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
        <span style={{ color: SAND, fontSize: 10, lineHeight: 1 }}>*</span>
      )}
    </div>
  );
}

// ─── TextInput ────────────────────────────────────────────────────────────────

const INPUT_BASE: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 10,
  padding: "10px 14px",
  color: "var(--white)",
  fontSize: 13,
  fontFamily: "inherit",
  outline: "none",
  transition: "border-color 0.2s",
};

function onFocusSand(e: React.FocusEvent<HTMLElement>) {
  (e.target as HTMLElement).style.borderColor = `${SAND}60`;
}
function onBlurNormal(e: React.FocusEvent<HTMLElement>) {
  (e.target as HTMLElement).style.borderColor = "rgba(255,255,255,0.1)";
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
      onFocus={onFocusSand}
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
      onFocus={onFocusSand}
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
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      min={min}
      max={max}
      placeholder={placeholder}
      style={{ ...INPUT_BASE, width: "auto", minWidth: 80 }}
      onFocus={onFocusSand}
      onBlur={onBlurNormal}
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
      onFocus={onFocusSand}
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
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 99,
                padding: "5px 11px",
                fontSize: 12,
                color: "rgba(255,255,255,0.8)",
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
                  color: "rgba(255,255,255,0.35)",
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
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "8px 12px",
            color: "var(--white)",
            fontSize: 12,
            fontFamily: "inherit",
            outline: "none",
          }}
          onFocus={onFocusSand}
          onBlur={onBlurNormal}
        />
        <button
          onClick={commit}
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 10,
            padding: "8px 14px",
            color: "rgba(255,255,255,0.5)",
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
