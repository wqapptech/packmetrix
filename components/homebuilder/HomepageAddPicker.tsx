"use client";

// Two-tier "Add a section" picker — Core (the page backbone) + More (opt-in).
// Iterates the PAGE-SCOPED catalog (coreTypesFor/moreTypesFor), so the homepage
// never offers About-only sections (e.g. team) and no add path can produce a
// section with no live renderer. Already-present sections render as a disabled
// "On page" tile.

import Icon from "@/components/Icon";
import { pick, coreTypesFor, moreTypesFor, type HomePageKind, type HomeSectionType } from "@/lib/homepage";
import { HOME_FIELD_REGISTRY } from "@/lib/homepage-fields";
import {
  DA_INK1, DA_INK3, DA_RULE, DA_RULE2, DA_SURFACE, DA_SURFACE2, DA_GOLD, DA_GREEN,
} from "@/lib/tokens";

const SANS = `var(--font-sans)`;

function PickerTile({
  type, present, onAdd, lang,
}: {
  type: HomeSectionType;
  present: Set<string>;
  onAdd: (type: HomeSectionType) => void;
  lang: "en" | "ar";
}) {
  const l = lang === "ar";
  const def = HOME_FIELD_REGISTRY[type];
  if (!def) return null;
  const added = present.has(type);
  return (
    <button
      onClick={() => { if (!added) onAdd(type); }}
      disabled={added}
      style={{
        display: "flex", alignItems: "flex-start", gap: 11, padding: "12px 13px", borderRadius: 11,
        textAlign: l ? "right" : "left", width: "100%",
        border: `1px solid ${added ? DA_RULE : DA_RULE2}`,
        background: added ? "transparent" : DA_SURFACE,
        cursor: added ? "default" : "pointer", opacity: added ? 0.6 : 1,
      }}
    >
      <div style={{ width: 34, height: 34, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: DA_SURFACE2, color: added ? DA_INK3 : DA_GOLD, border: `1px solid ${DA_RULE}` }}>
        <Icon name={def.icon} size={17} color={added ? DA_INK3 : DA_GOLD} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontFamily: SANS, fontSize: 13.5, fontWeight: 600, color: added ? DA_INK3 : DA_INK1 }}>{pick(def.label, lang)}</span>
          {added && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, fontFamily: SANS, fontSize: 11, color: DA_GREEN }}>
              <Icon name="check" size={11} color={DA_GREEN} />{l ? "على الصفحة" : "On page"}
            </span>
          )}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 11.5, color: DA_INK3, marginTop: 2, lineHeight: 1.4 }}>{pick(def.description, lang)}</div>
      </div>
      {!added && <Icon name="plus" size={15} color={DA_INK3} />}
    </button>
  );
}

function PickerGroup({
  title, sub, types, present, onAdd, lang,
}: {
  title: string; sub: string; types: HomeSectionType[];
  present: Set<string>; onAdd: (type: HomeSectionType) => void; lang: "en" | "ar";
}) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 10 }}>
        <span style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 700, letterSpacing: "1.4px", textTransform: "uppercase", color: DA_INK3 }}>{title}</span>
        <span style={{ fontFamily: SANS, fontSize: 11, color: DA_INK3 }}>{sub}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 9 }}>
        {types.map((t) => <PickerTile key={t} type={t} present={present} onAdd={onAdd} lang={lang} />)}
      </div>
    </div>
  );
}

export function HomepageAddPicker({
  present, onAdd, onClose, lang, page = "home",
}: {
  present: Set<string>;
  onAdd: (type: HomeSectionType) => void;
  onClose: () => void;
  lang: "en" | "ar";
  /** Which page's catalog to offer. About excludes homepage-only sections and
   *  includes team; home excludes team. */
  page?: HomePageKind;
}) {
  const l = lang === "ar";
  const coreTypes = coreTypesFor(page);
  const moreTypes = moreTypesFor(page);

  return (
    <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 12, overflow: "hidden" }}>
      <div style={{ padding: "14px 16px", borderBottom: `1px solid ${DA_RULE}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: DA_INK1 }}>{l ? "أضف قسماً" : "Add a section"}</div>
          <div style={{ fontFamily: SANS, fontSize: 12, color: DA_INK3, marginTop: 2 }}>{l ? "أساسية وإضافية — تظهر فوراً في المعاينة." : "Core and More — appears instantly in the preview."}</div>
        </div>
        <button onClick={onClose} style={{ width: 30, height: 30, borderRadius: 8, background: DA_SURFACE2, border: `1px solid ${DA_RULE2}`, color: DA_INK3, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name="x" size={13} color={DA_INK3} />
        </button>
      </div>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
        <PickerGroup title={l ? "أساسية" : "Core"} sub={l ? "العمود الفقري للصفحة" : "The backbone of the page"} types={coreTypes} present={present} onAdd={onAdd} lang={lang} />
        {moreTypes.length ? <PickerGroup title={l ? "إضافية" : "More"} sub={l ? "اختياري — أضف ما يناسبك" : "Optional — add what fits"} types={moreTypes} present={present} onAdd={onAdd} lang={lang} /> : null}
      </div>
    </div>
  );
}
