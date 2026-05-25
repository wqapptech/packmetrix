"use client";

import type { AnySectionInstance, CoreForm } from "@/lib/sections/types";
import { TEMPLATES } from "@/components/templates";

const SAND = "#e8c97b";
const SUCCESS = "#2dd4a0";

function score(core: CoreForm, sections: AnySectionInstance[]): number {
  let s = 0;
  if (core.destination)  s += 10;
  if (core.price)        s += 10;
  if (core.titleEn || core.titleAr)             s += 10;
  if (core.descriptionEn || core.descriptionAr) s += 10;
  if (core.whatsapp)    s += 15;
  if (core.coverImage)  s += 20;

  const inclusions = sections.find((x) => x.type === "inclusions");
  if (inclusions) {
    const inc = inclusions.data.includes;
    if (Array.isArray(inc) && inc.length > 0) s += 10;
  }
  const itinerary = sections.find((x) => x.type === "itinerary");
  if (itinerary) {
    const days = itinerary.data.days;
    if (Array.isArray(days) && days.some((d: any) => d.title)) s += 15;
  }

  return Math.min(100, s);
}

export function MiniPreview({
  core,
  sections,
  lang,
  templateId,
}: {
  core: CoreForm;
  sections: AnySectionInstance[];
  lang: "en" | "ar";
  templateId?: string;
}) {
  const l = lang === "ar";
  const tpl = templateId ? TEMPLATES.find((t) => t.id === templateId) : undefined;
  const heroUrl = core.coverImage;
  const sc = score(core, sections);
  const scoreColor = sc >= 80 ? SUCCESS : sc >= 50 ? SAND : "#f5a623";

  // Pull includes from inclusions section for the mini preview
  const inclusionSection = sections.find((x) => x.type === "inclusions");
  const includes: string[] = Array.isArray(inclusionSection?.data?.includes)
    ? (inclusionSection!.data.includes as string[]).slice(0, 2)
    : [];

  const scoreLabel = l ? "النقاط" : "Score";
  const scoreMsg =
    sc >= 80
      ? (l ? "تبدو قوية!" : "Looking strong!")
      : sc >= 50
      ? (l ? "استمر في الإضافة" : "Keep filling in details")
      : (l ? "أضف المزيد من التفاصيل" : "Add more details");
  const bookLabel = l ? "احجز عبر واتساب" : "Book on WhatsApp";
  const contactLabel = l ? "تواصل معنا" : "Contact us";
  const sectionsLabel = l
    ? `${sections.length} قسم`
    : `${sections.length} section${sections.length !== 1 ? "s" : ""}`;

  return (
    <div style={{
      background: "rgba(0,0,0,0.35)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 18,
      padding: 14,
      position: "sticky" as const,
      top: 16,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: ".7px", textTransform: "uppercase" as const }}>
          {l ? "معاينة مباشرة" : "Live preview"}
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", background: "rgba(255,255,255,0.05)", borderRadius: 6, padding: "2px 8px" }}>
          📱
        </span>
      </div>

      {/* Phone frame */}
      <div style={{
        width: "100%",
        aspectRatio: "9/19",
        background: "#0a1426",
        borderRadius: 24,
        border: "6px solid #1a2438",
        overflow: "hidden",
        position: "relative" as const,
      }}>
        {/* Hero */}
        <div style={{
          height: "42%",
          position: "relative" as const,
          background: heroUrl
            ? `url("${heroUrl}") center/cover`
            : "linear-gradient(135deg, #1f5f8e, #0e3a5c)",
        }}>
          <div style={{ position: "absolute" as const, inset: 0, background: "linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.7))" }} />
          <div style={{ position: "absolute" as const, left: 12, right: 12, bottom: 10, color: "#fff" }}>
            <div style={{ fontSize: 8, opacity: 0.7, marginBottom: 3, letterSpacing: ".5px", textTransform: "uppercase" as const }}>
              {core.nights || "—"} {l ? "ليلة" : "nights"} · {core.price || "—"}
            </div>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 16, lineHeight: 1.1 }}>
              {(l ? core.titleAr || core.titleEn : core.titleEn || core.titleAr) || core.destination || (l ? "وجهتك" : "Your destination")}
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: "10px 12px", background: "#fdfcf9", height: "58%", overflow: "hidden" }}>
          {(core.descriptionEn || core.descriptionAr) && (
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 10, lineHeight: 1.3, marginBottom: 7, color: "#0d1b2e" }}>
              {((l ? core.descriptionAr || core.descriptionEn : core.descriptionEn || core.descriptionAr) || "").slice(0, 60)}
              {((l ? core.descriptionAr || core.descriptionEn : core.descriptionEn || core.descriptionAr) || "").length > 60 ? "…" : ""}
            </div>
          )}
          <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 3, marginBottom: 8 }}>
            {includes.map((inc, i) => (
              <span key={i} style={{ fontSize: 6.5, background: "rgba(13,27,46,0.07)", borderRadius: 99, padding: "2px 6px", color: "#0d1b2e" }}>
                ✓ {inc}
              </span>
            ))}
          </div>
          <div style={{ background: "#25d366", color: "#fff", borderRadius: 6, padding: "6px", textAlign: "center" as const, fontSize: 9, fontWeight: 700 }}>
            {core.whatsapp ? bookLabel : contactLabel}
          </div>
          {sections.length > 0 && (
            <div style={{ textAlign: "center" as const, fontSize: 6.5, color: "rgba(13,27,46,0.4)", marginTop: 6 }}>
              + {sectionsLabel}
            </div>
          )}
        </div>
      </div>

      {/* Template badge */}
      {tpl && (
        <div style={{ marginTop: 10, padding: "6px 10px", background: `${tpl.templateColor}12`, border: `1px solid ${tpl.templateColor}30`, borderRadius: 8, display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: tpl.templateColor, flexShrink: 0 }} />
          <span style={{ fontSize: 10.5, color: tpl.templateColor, fontWeight: 600 }}>
            {l ? tpl.nameAr : tpl.name}
          </span>
        </div>
      )}

      {/* Score */}
      <div style={{ marginTop: tpl ? 6 : 10, padding: "8px 10px", background: "rgba(232,201,123,0.07)", border: "1px solid rgba(232,201,123,0.2)", borderRadius: 9, fontSize: 10.5, color: "rgba(255,255,255,0.65)", display: "flex", gap: 8, alignItems: "center" }}>
        <span style={{ color: SAND }}>✦</span>
        <span>
          <b style={{ color: scoreColor }}>{scoreLabel} {sc}/100</b>
          {" · "}{scoreMsg}
        </span>
      </div>
    </div>
  );
}
