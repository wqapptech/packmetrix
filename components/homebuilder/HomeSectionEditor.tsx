"use client";

// Renders the editor body for ONE homepage section, driven generically by the
// field registry (lib/homepage-fields.ts). Reuses the package builder's input
// primitives + ImageField. Every text field is a side-by-side EN/AR pair.

import { FieldLabel, TextInput, TextArea, NumberInput, SelectInput } from "@/components/builder/primitives";
import { ImageField } from "@/components/builder/ImageField";
import { pick, type Loc } from "@/lib/homepage";
import {
  FEATURE_ICONS, type HSectionDef, type HField, type HItemField, type HRepeater,
} from "@/lib/homepage-fields";
import {
  DA_INK2, DA_INK3, DA_RULE, DA_RULE2, DA_SURFACE, DA_BG, DA_GOLD_SOFT, DA_GOLD_DEEP, DA_DANGER,
} from "@/lib/tokens";

const SANS = `var(--font-sans)`;
const emptyLoc = (): Loc => ({ en: "", ar: "" });

function asLoc(v: unknown): Loc {
  if (v && typeof v === "object") {
    const o = v as Record<string, unknown>;
    return { en: typeof o.en === "string" ? o.en : "", ar: typeof o.ar === "string" ? o.ar : "" };
  }
  return emptyLoc();
}

// ── A single bilingual EN/AR pair ────────────────────────────────────────────
function LocPair({
  label, value, onChange, area,
}: { label: string; value: Loc; onChange: (v: Loc) => void; area?: boolean }) {
  const renderInput = (side: "en" | "ar") => {
    const v = value[side];
    const set = (nv: string) => onChange({ ...value, [side]: nv });
    return area ? <TextArea value={v} onChange={set} /> : <TextInput value={v} onChange={set} />;
  };
  return (
    <div>
      {label ? <FieldLabel>{label}</FieldLabel> : null}
      <div style={{ display: "grid", gap: 8 }}>
        <div>
          <div style={{ fontSize: 10, color: DA_INK3, marginBottom: 4, fontFamily: SANS }}>EN</div>
          {renderInput("en")}
        </div>
        <div dir="rtl">
          <div style={{ fontSize: 10, color: DA_INK3, marginBottom: 4, fontFamily: SANS }}>ع</div>
          {renderInput("ar")}
        </div>
      </div>
    </div>
  );
}

// ── Scalar field (loc / image / number) ──────────────────────────────────────
function ScalarField({
  field, content, onChange, userId, lang,
}: {
  field: HField;
  content: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  userId: string;
  lang: "en" | "ar";
}) {
  const set = (v: unknown) => onChange({ ...content, [field.key]: v });
  if (field.kind === "loc") {
    return <LocPair label={pick(field.label, lang)} value={asLoc(content[field.key])} onChange={set} area={field.area} />;
  }
  if (field.kind === "image") {
    return (
      <div>
        <FieldLabel>{pick(field.label, lang)}</FieldLabel>
        <ImageField value={String(content[field.key] || "")} onChange={set} userId={userId} lang={lang} />
      </div>
    );
  }
  // number
  return (
    <div>
      <FieldLabel>{pick(field.label, lang)}</FieldLabel>
      <NumberInput value={Number(content[field.key]) || field.min || 0} onChange={set} min={field.min} max={field.max} decimal={field.decimal} />
    </div>
  );
}

// ── A single repeater item's fields ───────────────────────────────────────────
function ItemFieldEditor({
  field, item, onChange, userId, lang,
}: {
  field: HItemField;
  item: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  userId: string;
  lang: "en" | "ar";
}) {
  const set = (v: unknown) => onChange({ ...item, [field.key]: v });
  if (field.kind === "loc") {
    return <LocPair label={pick(field.label, lang)} value={asLoc(item[field.key])} onChange={set} area={field.area} />;
  }
  if (field.kind === "plain") {
    return (
      <div>
        <FieldLabel>{pick(field.label, lang)}</FieldLabel>
        <TextInput value={String(item[field.key] || "")} onChange={set} placeholder={field.placeholder ? pick(field.placeholder, lang) : undefined} />
      </div>
    );
  }
  if (field.kind === "image") {
    return (
      <div>
        <FieldLabel>{pick(field.label, lang)}</FieldLabel>
        <ImageField value={String(item[field.key] || "")} onChange={set} userId={userId} lang={lang} />
      </div>
    );
  }
  // icon — constrained to FeatureIcon names the renderer knows
  return (
    <div>
      <FieldLabel>{pick(field.label, lang)}</FieldLabel>
      <SelectInput value={String(item[field.key] || "")} onChange={set} options={FEATURE_ICONS} lang={lang} />
    </div>
  );
}

// ── Repeater ──────────────────────────────────────────────────────────────────
function Repeater({
  rep, content, onChange, userId, lang,
}: {
  rep: HRepeater;
  content: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  userId: string;
  lang: "en" | "ar";
}) {
  const l = lang === "ar";
  const list: unknown[] = Array.isArray(content[rep.key]) ? (content[rep.key] as unknown[]) : [];

  const setList = (next: unknown[]) => onChange({ ...content, [rep.key]: next });
  const addItem = () => setList([...list, rep.itemMode === "loc" ? emptyLoc() : {}]);
  const removeItem = (i: number) => setList(list.filter((_, j) => j !== i));
  const moveItem = (i: number, dir: -1 | 1) => {
    const to = i + dir;
    if (to < 0 || to >= list.length) return;
    const next = [...list];
    const [m] = next.splice(i, 1);
    next.splice(to, 0, m);
    setList(next);
  };
  const setItem = (i: number, val: unknown) => setList(list.map((it, j) => (j === i ? val : it)));

  return (
    <div style={{ marginTop: 18 }}>
      <FieldLabel>{pick(rep.label, lang)}</FieldLabel>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {list.map((it, i) => (
          <div key={i} style={{ border: `1px solid ${DA_RULE}`, borderRadius: 11, background: DA_SURFACE, padding: "12px 14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: DA_INK2, fontFamily: SANS }}>
                {pick(rep.itemNoun, lang)} {i + 1}
              </span>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => moveItem(i, -1)} disabled={i === 0} style={iconBtn(i === 0)} title={l ? "أعلى" : "Up"}>↑</button>
                <button onClick={() => moveItem(i, 1)} disabled={i === list.length - 1} style={iconBtn(i === list.length - 1)} title={l ? "أسفل" : "Down"}>↓</button>
                <button onClick={() => removeItem(i)} style={{ ...iconBtn(false), color: DA_DANGER }} title={l ? "حذف" : "Remove"}>×</button>
              </div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {rep.itemMode === "loc" ? (
                <LocPair label="" value={asLoc(it)} onChange={(v) => setItem(i, v)} />
              ) : (
                (rep.itemFields || []).map((f) => (
                  <ItemFieldEditor
                    key={f.key}
                    field={f}
                    item={(it && typeof it === "object" ? it : {}) as Record<string, unknown>}
                    onChange={(v) => setItem(i, v)}
                    userId={userId}
                    lang={lang}
                  />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
      <button
        onClick={addItem}
        style={{
          marginTop: 10, width: "100%", padding: "9px 14px", borderRadius: 9, cursor: "pointer",
          background: DA_GOLD_SOFT, border: `1px dashed rgba(176,138,62,.4)`, color: DA_GOLD_DEEP,
          fontFamily: SANS, fontSize: 12.5, fontWeight: 600,
        }}
      >
        + {pick(rep.addLabel, lang)}
      </button>
    </div>
  );
}

function iconBtn(disabled: boolean): React.CSSProperties {
  return {
    width: 24, height: 24, borderRadius: 6, border: `1px solid ${DA_RULE2}`,
    background: DA_BG, color: DA_INK3, cursor: disabled ? "not-allowed" : "pointer",
    opacity: disabled ? 0.4 : 1, fontSize: 13, lineHeight: 1, fontFamily: SANS,
  };
}

// ── Section editor ────────────────────────────────────────────────────────────
export function HomeSectionEditor({
  def, content, onChange, userId, lang,
}: {
  def: HSectionDef;
  content: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  userId: string;
  lang: "en" | "ar";
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {(def.derived || []).map((note, i) => (
        <div key={i} style={{
          display: "flex", gap: 8, padding: "9px 12px", borderRadius: 9,
          background: "rgba(77,138,94,0.07)", border: `1px solid rgba(77,138,94,0.25)`,
        }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4d8a5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <span style={{ fontSize: 11.5, color: DA_INK2, lineHeight: 1.5, fontFamily: SANS }}>{pick(note, lang)}</span>
        </div>
      ))}
      {def.fields.map((f) => (
        <ScalarField key={f.key} field={f} content={content} onChange={onChange} userId={userId} lang={lang} />
      ))}
      {(def.repeaters || []).map((rep) => (
        <Repeater key={rep.key} rep={rep} content={content} onChange={onChange} userId={userId} lang={lang} />
      ))}
    </div>
  );
}
