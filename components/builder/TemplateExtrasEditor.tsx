"use client";

import { useState } from "react";
import { FieldLabel, TextInput, SelectInput } from "./primitives";
import { ImageField } from "./ImageField";
import {
  DA_BG, DA_SURFACE, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_GOLD, DA_DANGER,
} from "@/lib/tokens";

// ─── Type ─────────────────────────────────────────────────────────────────────

export type TemplateExtras = {
  // Aurora, Sakina — travel designer / mutawif
  agentName: string;
  agentRole: string;
  agentAvatar: string;
  agentYears: string;
  agentRepliesIn: string;
  // Compass — trek stats
  difficulty: string;
  maxAltitude: string;
  distanceKm: string;
  // Pulse — scarcity & urgency
  firstDepartureDate: string;
  departureSpots: string;
  spotsRemaining: string;
  viewersNow: string;
  priceWas: string;
  saving: string;
};

export const DEFAULT_EXTRAS: TemplateExtras = {
  agentName: "", agentRole: "", agentAvatar: "", agentYears: "", agentRepliesIn: "",
  difficulty: "", maxAltitude: "", distanceKm: "",
  firstDepartureDate: "", departureSpots: "", spotsRemaining: "", viewersNow: "",
  priceWas: "", saving: "",
};

// ─── Config per template ──────────────────────────────────────────────────────

const TEMPLATE_CFG: Record<string, { brand: string; features: string[]; agentLabel: { en: string; ar: string } }> = {
  aurora:  { brand: "#8a6a3a", features: ["agent"],    agentLabel: { en: "Travel designer",  ar: "المصمم السياحي" } },
  sakina:  { brand: "#1a5d4a", features: ["agent"],    agentLabel: { en: "Mutawif / Guide",   ar: "المطوف / المرشد" } },
  compass: { brand: "#b85c1f", features: ["trek"],     agentLabel: { en: "", ar: "" } },
  pulse:   { brand: "#e2492a", features: ["scarcity"], agentLabel: { en: "", ar: "" } },
};

export function hasTemplateExtras(templateId: string): boolean {
  return !!(TEMPLATE_CFG[templateId]?.features.length);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function TemplateExtrasEditor({
  templateId,
  extras,
  onChange,
  userId,
  lang,
}: {
  templateId: string;
  extras: TemplateExtras;
  onChange: (e: TemplateExtras) => void;
  userId: string;
  lang: "en" | "ar";
}) {
  const [open, setOpen] = useState(false);
  const l = lang === "ar";
  const cfg = TEMPLATE_CFG[templateId];
  if (!cfg) return null;

  const set = <K extends keyof TemplateExtras>(key: K, val: string) =>
    onChange({ ...extras, [key]: val });

  const { brand, features } = cfg;
  const hasAgent    = features.includes("agent");
  const hasTrek     = features.includes("trek");
  const hasScarcity = features.includes("scarcity");

  const anyFilled =
    (hasAgent    && (extras.agentName || extras.agentRole)) ||
    (hasTrek     && (extras.difficulty || extras.maxAltitude || extras.distanceKm)) ||
    (hasScarcity && (extras.spotsRemaining || extras.priceWas || extras.firstDepartureDate));

  return (
    <div style={{ marginTop: 4 }}>
      {/* Accordion toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%", textAlign: "left",
          background: open ? DA_GOLD + "12" : DA_SURFACE,
          border: `1px solid ${open ? DA_GOLD : DA_RULE}`,
          borderRadius: open ? "12px 12px 0 0" : 12,
          padding: "12px 14px", cursor: "pointer", fontFamily: "inherit",
          display: "flex", alignItems: "center", gap: 10,
          transition: "all 0.15s",
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: "50%", background: anyFilled ? DA_GOLD : DA_RULE, flexShrink: 0, transition: "background 0.2s" }} />
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: open ? DA_INK1 : DA_INK2 }}>
          {l ? "إعدادات القالب" : "Template options"}
        </span>
        {anyFilled && !open && (
          <span style={{ fontSize: 11, color: DA_GOLD, background: DA_GOLD + "18", borderRadius: 6, padding: "2px 8px", fontWeight: 600, flexShrink: 0 }}>
            {l ? "تم التعبئة" : "Filled"}
          </span>
        )}
        <span style={{ color: DA_INK3, fontSize: 12, display: "inline-block", transition: "transform 0.15s", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
      </button>

      {open && (
        <div style={{
          border: `1px solid ${DA_RULE}`, borderTop: "none",
          borderRadius: "0 0 12px 12px", padding: "16px 14px 20px",
          background: DA_SURFACE,
        }}>
          {/* ── Travel designer (Aurora, Sakina) ───────────────────────────── */}
          {hasAgent && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: DA_GOLD, letterSpacing: "1.2px", textTransform: "uppercase" as const, marginBottom: 14 }}>
                {l ? cfg.agentLabel.ar : cfg.agentLabel.en}
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 2 }}>
                  <FieldLabel>{l ? "الاسم" : "Name"}</FieldLabel>
                  <TextInput value={extras.agentName} onChange={v => set("agentName", v)} placeholder={l ? "مثال: خالد العمري" : "e.g. Khalid Al-Omri"} />
                </div>
                <div style={{ flex: 2 }}>
                  <FieldLabel>{l ? "اللقب / الدور" : "Title / role"}</FieldLabel>
                  <TextInput value={extras.agentRole} onChange={v => set("agentRole", v)} placeholder={l ? "مثال: مصمم رحلات" : "e.g. Travel designer"} />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <FieldLabel>{l ? "سنوات الخبرة" : "Years exp."}</FieldLabel>
                  <TextInput value={extras.agentYears} onChange={v => set("agentYears", v)} placeholder="e.g. 8" />
                </div>
                <div style={{ flex: 2 }}>
                  <FieldLabel>{l ? "وقت الرد" : "Replies in"}</FieldLabel>
                  <TextInput value={extras.agentRepliesIn} onChange={v => set("agentRepliesIn", v)} placeholder={l ? "مثال: ٣٠ دقيقة" : "e.g. 30 min"} />
                </div>
              </div>

              <FieldLabel>{l ? "صورة (اختياري)" : "Photo (optional)"}</FieldLabel>
              <ImageField value={extras.agentAvatar} onChange={v => set("agentAvatar", v)} userId={userId} lang={lang} />
            </>
          )}

          {/* ── Trek stats (Compass) ────────────────────────────────────────── */}
          {hasTrek && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: DA_GOLD, letterSpacing: "1.2px", textTransform: "uppercase" as const, marginBottom: 14 }}>
                {l ? "إحصائيات الرحلة" : "Trek stats"}
              </div>

              <FieldLabel>{l ? "مستوى الصعوبة" : "Difficulty"}</FieldLabel>
              <SelectInput
                value={extras.difficulty}
                onChange={v => set("difficulty", v)}
                options={[
                  { value: "",           label: "— Not set —",  labelAr: "— غير محدد —" },
                  { value: "easy",       label: "Easy",         labelAr: "سهل" },
                  { value: "moderate",   label: "Moderate",     labelAr: "متوسط" },
                  { value: "strenuous",  label: "Strenuous",    labelAr: "شاق" },
                  { value: "extreme",    label: "Extreme",      labelAr: "متطرف" },
                ]}
                lang={lang}
              />

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <FieldLabel>{l ? "أقصى ارتفاع (م)" : "Max altitude (m)"}</FieldLabel>
                  <TextInput value={extras.maxAltitude} onChange={v => set("maxAltitude", v)} placeholder="e.g. 5364" />
                </div>
                <div style={{ flex: 1 }}>
                  <FieldLabel>{l ? "المسافة الكلية (كم)" : "Total distance (km)"}</FieldLabel>
                  <TextInput value={extras.distanceKm} onChange={v => set("distanceKm", v)} placeholder="e.g. 130" />
                </div>
              </div>
            </>
          )}

          {/* ── Scarcity & urgency (Pulse) ──────────────────────────────────── */}
          {hasScarcity && (
            <>
              <div style={{ fontSize: 10, fontWeight: 700, color: DA_GOLD, letterSpacing: "1.2px", textTransform: "uppercase" as const, marginBottom: 14 }}>
                {l ? "الندرة والإلحاح" : "Scarcity & urgency"}
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <FieldLabel>{l ? "الأماكن المتبقية" : "Spots remaining"}</FieldLabel>
                  <TextInput value={extras.spotsRemaining} onChange={v => set("spotsRemaining", v)} placeholder="e.g. 4" />
                </div>
                <div style={{ flex: 1 }}>
                  <FieldLabel>{l ? "السعر الأصلي" : "Was price"}</FieldLabel>
                  <TextInput value={extras.priceWas} onChange={v => set("priceWas", v)} placeholder="e.g. €1,499" />
                </div>
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <div style={{ flex: 2 }}>
                  <FieldLabel>{l ? "تاريخ أول رحلة (للعداد)" : "First departure (for countdown)"}</FieldLabel>
                  <TextInput value={extras.firstDepartureDate} onChange={v => set("firstDepartureDate", v)} placeholder="e.g. 2026-06-15" />
                </div>
                <div style={{ flex: 1 }}>
                  <FieldLabel>{l ? "الأماكن" : "Spots"}</FieldLabel>
                  <TextInput value={extras.departureSpots} onChange={v => set("departureSpots", v)} placeholder="e.g. 12" />
                </div>
              </div>

              <div style={{ marginTop: 10, padding: "8px 12px", borderRadius: 8, background: DA_DANGER + "0d", border: `1px solid ${DA_DANGER}30`, fontSize: 12, color: DA_INK2, lineHeight: 1.55 }}>
                {l
                  ? "⏱ يُحسب العد التنازلي تلقائياً من أول تاريخ رحلة. ويُحسب التوفير تلقائياً من السعر الأصلي مطروحاً منه السعر الحالي. عدد المشاهدين يعكس الزوار الحاليين في الوقت الفعلي."
                  : "⏱ Countdown uses the first departure date. Saving is auto-calculated from Was price − current price. Viewer count reflects real active visitors in real time."}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
