"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/Icon";
import { PRESETS } from "@/lib/sections/presets";
import { SECTION_REGISTRY } from "@/lib/sections/registry";
import type { AnySectionInstance, CoreForm } from "@/lib/sections/types";
import { SAND } from "./constants";
import { T } from "@/lib/translations";
import {
  DA_BG, DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_GOLD, DA_GOLD_SOFT, DA_GREEN, DA_DANGER,
} from "@/lib/tokens";

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
  highlights?: string[];
  airports?: Array<{
    name: string;
    arrivingAirport?: string;
    price?: string;
    date?: string;
    flyingTime?: string;
    arrivingTime?: string;
  }>;
  departures?: Array<{
    date: string;
    returnDate?: string;
    spots?: number;
    price?: string;
    origin?: string;
  }>;
  itinerary?: Array<{ day: number; title: string; desc: string }>;
  pricingTiers?: Array<{ label: string; price: string }>;
  hotelDescription?: string;
  importantNotes?: string[];
  people?: Array<{ role: string; name: string; bio?: string; languages?: string[] }>;
  reviews?: Array<{ name: string; rating: number; text: string }>;
  transfers?: string[];
  meals?: string;
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
        if (section.type === "highlights" && extracted.highlights?.length) {
          section.data = { ...section.data, items: extracted.highlights };
        }
        if (section.type === "flights" && extracted.airports?.length) {
          const flightDeps = extracted.airports.map((a) => ({
            name:            a.name            || "",
            arrivingAirport: a.arrivingAirport || "",
            price:           a.price           || "",
            date:            a.date            || "",
            flyingTime:      a.flyingTime      || "",
            arrivingTime:    a.arrivingTime    || "",
          }));
          section.data = { ...section.data, departures: flightDeps };
        }
        if (section.type === "departures" && extracted.departures?.length) {
          const entries = extracted.departures.map((d) => ({
            date:            d.date            || "",
            returnDate:      d.returnDate      || "",
            spots:           d.spots           ?? 0,
            price:           d.price           || "",
            origin:          d.origin          || "",
            arrivingAirport: "",
            flyingTime:      "",
            arrivingTime:    "",
            deal:            false,
          }));
          section.data = { ...section.data, entries };
        }
        if (section.type === "departure_dates" && extracted.departures?.length) {
          const dates = extracted.departures.map((d) => ({
            date:       d.date       || "",
            returnDate: d.returnDate || "",
            price:      d.price      || "",
            spots:      d.spots != null ? String(d.spots) : "",
          }));
          section.data = { ...section.data, dates };
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
        if (section.type === "important_notes" && extracted.importantNotes?.length) {
          section.data = { ...section.data, items: extracted.importantNotes.map((text) => ({ text })) };
        }
        if (section.type === "people" && extracted.people?.length) {
          const now = Date.now();
          section.data = {
            ...section.data,
            people: extracted.people.map((p, i) => ({
              id:        `person_${now}_${i}`,
              role:      p.role      || "agent",
              name:      p.name      || "",
              bio:       p.bio       || "",
              photo:     "",
              languages: p.languages || [],
              years:     0,
              repliesIn: "",
            })),
          };
        }
        if (section.type === "reviews" && extracted.reviews?.length) {
          const now = Date.now();
          section.data = {
            ...section.data,
            reviews: extracted.reviews.map((r, i) => ({
              id:        `review_${now}_${i}`,
              name:      r.name   || "",
              rating:    r.rating ?? 5,
              text:      r.text   || "",
              avatarUrl: "",
            })),
          };
        }
        if (section.type === "transfers" && extracted.transfers?.length) {
          section.data = { ...section.data, items: extracted.transfers };
        }
        if (section.type === "meals" && extracted.meals) {
          section.data = { ...section.data, plan: extracted.meals };
        }
      }

      // Inject sections for extracted data that has no matching section in this preset
      const hasSection = (t: string) => sections.some((s) => s.type === t);
      const now2 = Date.now();

      if (extracted.people?.length && !hasSection("people")) {
        const def = SECTION_REGISTRY["people"];
        sections.push({
          id: `people_${now2}`,
          type: "people",
          order: sections.length,
          data: {
            ...def.defaultData,
            people: extracted.people.map((p, i) => ({
              id:        `person_${now2}_${i}`,
              role:      p.role      || "agent",
              name:      p.name      || "",
              bio:       p.bio       || "",
              photo:     "",
              languages: p.languages || [],
              years:     0,
              repliesIn: "",
            })),
          },
        });
      }

      if (extracted.reviews?.length && !hasSection("reviews")) {
        const def = SECTION_REGISTRY["reviews"];
        sections.push({
          id: `reviews_${now2}`,
          type: "reviews",
          order: sections.length,
          data: {
            ...def.defaultData,
            reviews: extracted.reviews.map((r, i) => ({
              id:        `review_${now2}_${i}`,
              name:      r.name   || "",
              rating:    r.rating ?? 5,
              text:      r.text   || "",
              avatarUrl: "",
            })),
          },
        });
      }

      if (
        extracted.departures?.length &&
        !hasSection("departures") &&
        !hasSection("departure_dates")
      ) {
        const def = SECTION_REGISTRY["departures"];
        sections.push({
          id: `departures_${now2}`,
          type: "departures",
          order: sections.length,
          data: {
            ...def.defaultData,
            entries: extracted.departures.map((d) => ({
              date:            d.date       || "",
              returnDate:      d.returnDate || "",
              spots:           d.spots      ?? 0,
              price:           d.price      || "",
              origin:          d.origin     || "",
              arrivingAirport: "",
              flyingTime:      "",
              arrivingTime:    "",
              deal:            false,
            })),
          },
        });
      }
    }

    const coreOverrides: Partial<CoreForm> = {};
    if (extracted?.destination)       coreOverrides.destination = extracted.destination;
    if (extracted?.price)             coreOverrides.price       = extracted.price;
    if (extracted?.nights)            coreOverrides.nights      = extracted.nights;
    if (extracted?.title)       coreOverrides.titleEn       = extracted.title;
    if (extracted?.description) coreOverrides.descriptionEn = extracted.description;
    if (extracted?.language === "ar" || extracted?.language === "en") {
      coreOverrides.primaryLanguage = extracted.language;
    }

    onApply(coreOverrides, sections);
  };

  const startBlank = () => onApply({}, []);

  const suggestedId = extracted?.suggestedPreset || "";

  return (
    <div style={{ maxWidth: 580, margin: "0 auto" }}>
      <div style={{ textAlign: "center", marginBottom: 32 }}>
        <div style={{ width: 48, height: 48, borderRadius: 14, background: DA_GOLD_SOFT, border: `1px solid ${DA_RULE}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
          <Icon name="package" size={22} color={SAND} />
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 8, color: DA_INK1 }}>
          {l ? "اختر نموذج الباقة" : "Choose a package template"}
        </h2>
        <p style={{ fontSize: 13.5, color: DA_INK3, lineHeight: 1.6, maxWidth: 400, margin: "0 auto" }}>
          {l
            ? "ابدأ من نموذج جاهز ثم خصّصه، أو ابدأ من صفحة بيضاء."
            : "Start from a ready-made template then customise it, or start with a blank canvas."}
        </p>
      </div>

      {/* AI extract accordion */}
      <div style={{ marginBottom: 24, borderRadius: 14, border: `1px solid ${aiOpen ? DA_GOLD : DA_RULE}`, overflow: "hidden", transition: "border-color 0.2s" }}>
        <button
          onClick={() => setAiOpen((o) => !o)}
          style={{ width: "100%", display: "flex", alignItems: "center", gap: 12, padding: "14px 16px", background: aiOpen ? DA_GOLD_SOFT : DA_SURFACE, border: "none", cursor: "pointer", fontFamily: "inherit", transition: "background 0.15s" }}
        >
          <div style={{ width: 32, height: 32, borderRadius: 9, background: DA_GOLD_SOFT, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <Icon name="sparkle" size={16} color={SAND} />
          </div>
          <div style={{ flex: 1, textAlign: "left" }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, color: DA_INK1 }}>
              {l ? "استخراج بيانات بالذكاء الاصطناعي" : "Extract data with AI"}
            </div>
            <div style={{ fontSize: 12, color: DA_INK3, marginTop: 2 }}>
              {l ? "الصق وصف باقتك وسنملأ الحقول تلقائياً ونقترح النموذج المناسب" : "Paste your package description — we'll fill the fields and suggest a template"}
            </div>
          </div>
          <span style={{ color: DA_INK3, fontSize: 12, transform: aiOpen ? "rotate(180deg)" : "none", transition: "transform 0.15s" }}>▾</span>
        </button>

        {aiOpen && (
          <div style={{ padding: "0 16px 16px", background: DA_SURFACE }}>
            <textarea
              value={extractText}
              onChange={(e) => setExtractText(e.target.value)}
              placeholder={l ? "الصق وصف الرحلة هنا…" : "Paste your trip description, brochure, or social post here…"}
              style={{ width: "100%", minHeight: 220, maxHeight: 400, background: DA_BG, border: `1px solid ${DA_RULE}`, borderRadius: 10, padding: "10px 14px", color: DA_INK1, fontSize: 13, fontFamily: "inherit", outline: "none", resize: "vertical" as const, lineHeight: 1.6, marginTop: 12, overflowY: "auto" }}
              onFocus={(e) => (e.target.style.borderColor = DA_GOLD)}
              onBlur={(e) => (e.target.style.borderColor = DA_RULE)}
            />

            {extractError && (
              <p style={{ fontSize: 12, color: DA_DANGER, marginTop: 8 }}>{extractError}</p>
            )}

            {extracted && (
              <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 10, background: DA_GREEN + "12", border: `1px solid ${DA_GREEN}30`, fontSize: 12.5, color: DA_INK1, display: "flex", flexWrap: "wrap" as const, gap: "4px 16px" }}>
                <span style={{ color: DA_GREEN, fontWeight: 700, width: "100%", marginBottom: 4 }}>
                  <Icon name="check" size={12} color={DA_GREEN} strokeWidth={2.5} />
                  {" "}{l ? "تم الاستخراج — اختر نموذجاً أدناه" : "Extracted — pick a template below"}
                </span>
                {extracted.destination && <span style={{ color: DA_INK2 }}>📍 {extracted.destination}</span>}
                {extracted.price       && <span style={{ color: DA_INK2 }}>💰 {extracted.price}</span>}
                {extracted.nights      && <span style={{ color: DA_INK2 }}>🌙 {extracted.nights} {l ? "ليالٍ" : "nights"}</span>}
                {extracted.advantages?.length ? <span style={{ color: DA_INK2 }}>✓ {extracted.advantages.length} {l ? "مشمولات" : "inclusions"}</span> : null}
                {extracted.itinerary?.length   ? <span style={{ color: DA_INK2 }}>🗓 {extracted.itinerary.length} {l ? "أيام" : "days"}</span> : null}
                {extracted.airports?.length    ? <span style={{ color: DA_INK2 }}>✈ {extracted.airports.length} {l ? "رحلات" : "departure(s)"}</span> : null}
                {suggestedId && (
                  <span style={{ color: DA_GOLD, fontWeight: 600 }}>
                    ✦ {l ? "مقترح:" : "Suggested:"} {PRESETS.find(p => p.id === suggestedId)?.[l ? "labelAr" : "label"] ?? suggestedId}
                  </span>
                )}
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
              <button
                onClick={handleExtract}
                disabled={extracting || !extractText.trim()}
                style={{ padding: "9px 20px", borderRadius: 10, border: "none", background: extracting || !extractText.trim() ? DA_RULE : `linear-gradient(135deg, ${SAND}, #c4a84f)`, color: extracting || !extractText.trim() ? DA_INK3 : DA_SURFACE2, fontSize: 13, fontWeight: 700, fontFamily: "inherit", cursor: extracting || !extractText.trim() ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 8 }}
              >
                {extracting
                  ? <><span className="spinner-warm" style={{ borderTopColor: SAND }} /> {l ? "جاري الاستخراج…" : "Extracting…"}</>
                  : <><Icon name="sparkle" size={13} color={DA_SURFACE2} /> {l ? "استخراج" : "Extract with AI"}</>}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User templates */}
      {userPresets.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: DA_INK3, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 8 }}>
            {t.yourSavedTemplates}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            {userPresets.map(up => (
              <div
                key={up.id}
                style={{ position: "relative", borderRadius: 12, border: `1px solid ${DA_RULE}`, background: DA_SURFACE, overflow: "hidden" }}
              >
                <button
                  onClick={() => applyUserPreset(up)}
                  style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 6, padding: "13px 14px 11px", background: "transparent", border: "none", cursor: "pointer", fontFamily: "inherit", textAlign: "left" }}
                  onMouseEnter={e => { e.currentTarget.style.background = DA_GOLD_SOFT; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: DA_GOLD_SOFT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon name="package" size={15} color={SAND} />
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: DA_INK1, lineHeight: 1.3 }}>{up.name}</div>
                  <div style={{ fontSize: 11, color: DA_GOLD, display: "flex", alignItems: "center", gap: 4 }}>
                    {up.sections.length} {l ? "أقسام" : "sections"} <Icon name="arrow_right" size={9} color={DA_GOLD} />
                  </div>
                </button>
                <button
                  onClick={() => deleteUserPreset(up.id)}
                  disabled={deletingId === up.id}
                  title={t.deleteTemplateTooltip}
                  style={{ position: "absolute", top: 8, right: 8, width: 24, height: 24, borderRadius: 6, border: "none", background: DA_DANGER + "18", color: DA_DANGER, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", opacity: deletingId === up.id ? 0.4 : 1 }}
                >
                  <Icon name="trash" size={11} color={DA_DANGER} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Preset cards */}
      <div style={{ fontSize: 10, fontWeight: 700, color: DA_INK3, letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 8 }}>
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
                border: `1px solid ${isRecommended ? DA_GOLD : DA_RULE}`,
                background: isRecommended ? DA_GOLD_SOFT : DA_SURFACE,
                cursor: "pointer",
                fontFamily: "inherit",
                textAlign: "left",
                position: "relative" as const,
                transition: "border-color 0.15s, background 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = DA_GOLD;
                e.currentTarget.style.background = DA_GOLD_SOFT;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = isRecommended ? DA_GOLD : DA_RULE;
                e.currentTarget.style.background = isRecommended ? DA_GOLD_SOFT : DA_SURFACE;
              }}
            >
              {isRecommended && (
                <div style={{ position: "absolute", top: -1, right: -1, background: DA_GOLD, color: DA_SURFACE2, fontSize: 9, fontWeight: 800, letterSpacing: "0.5px", borderRadius: "0 13px 0 8px", padding: "3px 9px" }}>
                  {l ? "مقترح ✦" : "✦ SUGGESTED"}
                </div>
              )}

              <div style={{ width: 36, height: 36, borderRadius: 10, background: isRecommended ? DA_GOLD + "40" : DA_GOLD_SOFT, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={preset.icon} size={18} color={SAND} />
              </div>

              <div>
                <div style={{ fontSize: 13.5, fontWeight: 700, color: DA_INK1, marginBottom: 4 }}>{presetLabel}</div>
                <div style={{ fontSize: 11.5, color: DA_INK3, lineHeight: 1.45 }}>{presetDesc}</div>
              </div>

              <div style={{ fontSize: 11, color: DA_GOLD, display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                {preset.sections.length} {l ? "أقسام" : "sections"}
                <Icon name="arrow_right" size={10} color={DA_GOLD} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Start blank */}
      <button
        onClick={startBlank}
        style={{ width: "100%", padding: "12px 16px", borderRadius: 12, border: `1px solid ${DA_RULE}`, background: DA_SURFACE, color: DA_INK2, fontSize: 13, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "color 0.15s, border-color 0.15s" }}
        onMouseEnter={(e) => { e.currentTarget.style.color = DA_INK1; e.currentTarget.style.borderColor = DA_RULE; }}
        onMouseLeave={(e) => { e.currentTarget.style.color = DA_INK2; e.currentTarget.style.borderColor = DA_RULE; }}
      >
        <Icon name="plus" size={13} color={DA_INK2} />
        {l ? "ابدأ من صفحة بيضاء" : "Start from a blank canvas"}
      </button>
    </div>
  );
}
