"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { PRESETS } from "@/lib/sections/presets";
import { SECTION_REGISTRY } from "@/lib/sections/registry";
import type { AnySectionInstance, CoreForm } from "@/lib/sections/types";
import { SAND } from "./constants";
import { T } from "@/lib/translations";

type UserPreset = { id: string; name: string; sections: AnySectionInstance[]; createdAt: number };

type ExtractResult = {
  destination?: string;
  price?: string;
  nights?: string;
  title?: string;
  description?: string;
  language?: "en" | "ar";
  suggestedPreset?: string;
  advantages?: string[];
  excludes?: string[];
  airports?: Array<{
    name: string;
    arrivingAirport?: string;
    price?: string;
    date?: string;
    flyingTime?: string;
    arrivingTime?: string;
  }>;
  itinerary?: Array<{ day: number; title: string; desc: string }>;
  pricingTiers?: Array<{ label: string; price: string }>;
  hotelDescription?: string;
};

export function PresetPicker({
  onApply,
  lang,
  userId,
}: {
  onApply: (core: Partial<CoreForm>, sections: AnySectionInstance[]) => void;
  lang: "en" | "ar";
  userId?: string;
}) {
  const [extractText, setExtractText] = useState("");
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [extracted, setExtracted] = useState<ExtractResult | null>(null);
  const [aiOpen, setAiOpen] = useState(false);
  const [userPresets, setUserPresets] = useState<UserPreset[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const l = lang === "ar";
  const t = T[lang];

  useEffect(() => {
    if (!userId) return;
    fetch(`/api/user-presets?userId=${encodeURIComponent(userId)}`)
      .then(r => r.ok ? r.json() : { presets: [] })
      .then(data => setUserPresets(data.presets ?? []));
  }, [userId]);

  const deleteUserPreset = async (id: string) => {
    if (!userId) return;
    setDeletingId(id);
    await fetch(`/api/user-presets?id=${encodeURIComponent(id)}&userId=${encodeURIComponent(userId)}`, { method: "DELETE" });
    setUserPresets(prev => prev.filter(p => p.id !== id));
    setDeletingId(null);
  };

  const applyUserPreset = (preset: UserPreset) => {
    const sections: AnySectionInstance[] = preset.sections.map((s, i) => ({
      ...s,
      id: `${s.type}_${Date.now()}_${i}`,
      order: i,
    }));
    onApply({}, sections);
  };

  const handleExtract = async () => {
    if (!extractText.trim()) return;
    setExtracting(true);
    setExtractError(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: extractText }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Extraction failed");
      setExtracted(json);
    } catch (err: any) {
      setExtractError(err.message || (l ? "فشل الاستخراج" : "Extraction failed. Please try again."));
    } finally {
      setExtracting(false);
    }
  };

  const applyPreset = (presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const sections: AnySectionInstance[] = preset.sections.map((ps, i) => {
      const def = SECTION_REGISTRY[ps.type];
      return {
        id: `${ps.type}_${Date.now()}_${i}`,
        type: ps.type,
        order: i,
        data: { ...def.defaultData, ...(ps.data ?? {}) },
      };
    });

    // Merge all extracted data into the appropriate sections
    if (extracted) {
      for (const section of sections) {
        if (section.type === "inclusions") {
          if (extracted.advantages?.length) section.data = { ...section.data, includes: extracted.advantages };
          if (extracted.excludes?.length)   section.data = { ...section.data, excludes: extracted.excludes };
        }
        if (section.type === "flights" && extracted.airports?.length) {
          const departures = extracted.airports.map((a) => ({
            name:            a.name            || "",
            arrivingAirport: a.arrivingAirport || "",
            price:           a.price           || "",
            date:            a.date            || "",
            flyingTime:      a.flyingTime      || "",
            arrivingTime:    a.arrivingTime    || "",
          }));
          section.data = { ...section.data, departures };
        }
        if (section.type === "itinerary" && extracted.itinerary?.length) {
          section.data = { ...section.data, days: extracted.itinerary };
        }
        if (section.type === "pricing" && extracted.pricingTiers?.length) {
          section.data = { ...section.data, tiers: extracted.pricingTiers };
        }
        if (section.type === "hotel" && extracted.hotelDescription) {
          section.data = { ...section.data, description: extracted.hotelDescription };
        }
      }
    }

    const coreOverrides: Partial<CoreForm> = {};
    if (extracted?.destination)       coreOverrides.destination = extracted.destination;
    if (extracted?.price)             coreOverrides.price       = extracted.price;
    if (extracted?.nights)            coreOverrides.nights      = extracted.nights;
    if (extracted?.title)             coreOverrides.title       = extracted.title;
    if (extracted?.description)       coreOverrides.description = extracted.description;
    if (extracted?.language === "ar" || extracted?.language === "en") {
      coreOverrides.language = extracted.language;
    }

    onApply(coreOverrides, sections);
  };

  const startBlank = () => onApply({}, []);

  const suggestedId = extracted?.suggestedPreset || "";

  return (
    <div style={{ maxWidth: 580, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: `${SAND}18`, border: `1px solid ${SAND}30`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Icon name="package" size={22} color={SAND} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>
          {l ? "اختر نموذج الباقة" : "Choose a package template"}
        </h2>
        <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.6, maxWidth: 400, margin: "0 auto" }}>
          {l
            ? "ابدأ من نموذج جاهز ثم خصّصه، أو ابدأ من صفحة بيضاء."
            : "Start from a ready-made template then customise it, or start with a blank canvas."}
        </p>
      </div>

      {/* AI extract accordion */}
      <div style={{ marginBottom: 24, borderRadius: 14, border: `1px solid ${aiOpen ? SAND + "30" : "rgba(255,255,255,0.08)"}`, overflow: "hidden", transition: "border-color 0.2s" }}>
        <button
          onClick={() => setAiOpen((o) => !o)}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: aiOpen ? `${SAND}08` : "rgba(255,255,255,0.03)", border: "none", cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 9, background: `${SAND}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="sparkle" size={16} color={SAND} />
          </div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff" }}>
              {l ? "استخراج بيانات بالذكاء الاصطناعي" : "Extract data with AI"}
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
              {l ? "الصق وصف باقتك وسنملأ الحقول تلقائياً ونقترح النموذج المناسب" : "Paste your package description — we'll fill the fields and suggest a template"}
            </div>
          </div>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, transform: aiOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▾</span>
        </button>

        {aiOpen && (
          <div style={{ padding: "0 16px 16px" }}>
            <textarea
              value={extractText}
              onChange={(e) => setExtractText(e.target.value)}
              placeholder={l ? "الصق وصف الرحلة هنا…" : "Paste your trip description, brochure, or social post here…"}
              style={{ width: "100%", minHeight: 140, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", color: "var(--white)", fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical" as const, lineHeight: 1.6, marginTop: 12 }}
              onFocus={(e) => (e.target.style.borderColor = `${SAND}60`)}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />

            {extractError && (
              <p style={{ fontSize: 12, color: "#ef9090", marginTop: 8 }}>{extractError}</p>
            )}

            {extracted && (
              <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: "rgba(45,212,160,0.07)", border: "1px solid rgba(45,212,160,0.2)", fontSize: 12.5, color: "rgba(255,255,255,0.8)", display: "flex", flexWrap: "wrap" as const, gap: "4px 16px" }}>
                <span style={{ color: "#2dd4a0", fontWeight: 700, width: "100%", marginBottom: 4 }}>
                  <Icon name="check" size={12} color="#2dd4a0" strokeWidth={2.5} />
                  {" "}{l ? "تم الاستخراج — اختر نموذجاً أدناه" : "Extracted — pick a template below"}
                </span>
                {extracted.destination && <span style={{ color: "rgba(255,255,255,0.5)" }}>📍 {extracted.destination}</span>}
                {extracted.price       && <span style={{ color: "rgba(255,255,255,0.5)" }}>💰 {extracted.price}</span>}
                {extracted.nights      && <span style={{ color: "rgba(255,255,255,0.5)" }}>🌙 {extracted.nights} {l ? "ليالٍ" : "nights"}</span>}
                {extracted.advantages?.length ? <span style={{ color: "rgba(255,255,255,0.5)" }}>✓ {extracted.advantages.length} {l ? "مشمولات" : "inclusions"}</span> : null}
                {extracted.itinerary?.length   ? <span style={{ color: "rgba(255,255,255,0.5)" }}>🗓 {extracted.itinerary.length} {l ? "أيام" : "days"}</span> : null}
                {extracted.airports?.length    ? <span style={{ color: "rgba(255,255,255,0.5)" }}>✈ {extracted.airports.length} {l ? "رحلات" : "departure(s)"}</span> : null}
                {suggestedId && (
                  <span style={{ color: SAND, fontWeight: 600 }}>
                    ✦ {l ? "مقترح:" : "Suggested:"} {PRESETS.find(p => p.id === suggestedId)?.[l ? "labelAr" : "label"] ?? suggestedId}
                  </span>
                )}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
              <button
                onClick={handleExtract}
                disabled={extracting || !extractText.trim()}
                style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: extracting || !extractText.trim() ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${SAND}, #c4a84f)`, color: extracting || !extractText.trim() ? "rgba(255,255,255,0.3)" : "#0d1b2e", fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: extracting || !extractText.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}
              >
                {extracting
                  ? <><span className="spinner" style={{ borderTopColor: SAND }} /> {l ? "جاري الاستخراج…" : "Extracting…"}</>
                  : <><Icon name="sparkle" size={13} color="#0d1b2e" /> {l ? "استخراج" : "Extract with AI"}</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User templates */}
      {userPresets.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 8 }}>
            {t.yourSavedTemplates}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {userPresets.map(up => (
              <div
                key={up.id}
                style={{ position: "relative", borderRadius: 12, border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.04)", overflow: "hidden" }}
              >
                <button
                  onClick={() => applyUserPreset(up)}
                  style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, padding: "13px 14px 11px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                  onMouseEnter={e => { e.currentTarget.style.background = `${SAND}08`; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: `${SAND}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="package" size={15} color={SAND} />
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: "#fff", lineHeight: 1.3 }}>{up.name}</div>
                  <div style={{ fontSize: 11, color: SAND, display: "flex", alignItems: "center", gap: 4 }}>
                    {up.sections.length} {l ? "أقسام" : "sections"} <Icon name="arrow_right" size={9} color={SAND} />
                  </div>
                </button>
                <button
                  onClick={() => deleteUserPreset(up.id)}
                  disabled={deletingId === up.id}
                  title={t.deleteTemplateTooltip}
                  style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: 6, border: "none", background: "rgba(220,80,80,0.12)", color: "rgba(220,80,80,0.6)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: deletingId === up.id ? 0.4 : 1 }}
                >
                  <Icon name="trash" size={11} color="rgba(220,80,80,0.7)" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preset cards */}
      <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 8 }}>
        {t.builtInTemplates}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
        {PRESETS.map((preset) => {
          const isRecommended = suggestedId === preset.id;
          const presetLabel = l ? preset.labelAr : preset.label;
          const presetDesc  = l ? preset.descriptionAr : preset.description;

          return (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                gap: 10,
                padding: "16px 14px",
                borderRadius: 14,
                border: `1px solid ${isRecommended ? SAND + "60" : "rgba(255,255,255,0.08)"}`,
                background: isRecommended ? `${SAND}09` : "rgba(255,255,255,0.03)",
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                position: "relative" as const,
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = `${SAND}40`;
                e.currentTarget.style.background = `${SAND}07`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isRecommended ? `${SAND}60` : "rgba(255,255,255,0.08)";
                e.currentTarget.style.background = isRecommended ? `${SAND}09` : "rgba(255,255,255,0.03)";
              }}
            >
              {isRecommended && (
                <div style={{ position: "absolute", top: -1, right: -1, background: SAND, color: "#0d1b2e", fontSize: 9, fontWeight: 800, letterSpacing: "0.5px", borderRadius: "0 13px 0 8px", padding: "3px 9px" }}>
                  {l ? "مقترح ✦" : "✦ SUGGESTED"}
                </div>
              )}

              <div style={{ width: 36, height: 36, borderRadius: 10, background: isRecommended ? `${SAND}30` : `${SAND}18`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={preset.icon} size={18} color={SAND} />
              </div>

              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{presetLabel}</div>
                <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.35)", lineHeight: 1.45 }}>{presetDesc}</div>
              </div>

              <div style={{ fontSize: 11, color: SAND, display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                {preset.sections.length} {l ? "أقسام" : "sections"}
                <Icon name="arrow_right" size={10} color={SAND} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Start blank */}
      <button
        onClick={startBlank}
        style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.07)", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 13, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "color 0.15s, border-color 0.15s" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.7)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(255,255,255,0.4)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)"; }}
      >
        <Icon name="plus" size={13} color="rgba(255,255,255,0.4)" />
        {l ? "ابدأ من صفحة بيضاء" : "Start from a blank canvas"}
      </button>
    </div>
  );
}
