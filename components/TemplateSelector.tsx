"use client";

import { TEMPLATES } from "./templates/index";
import type { Lang } from "./templates/types";
import { T } from "@/lib/translations";

const TEMPLATE_ICONS: Record<string, string> = {
  aurora:  "✦",
  compass: "◎",
  petal:   "✿",
  sakina:  "☽",
  pulse:   "●",
  tribe:   "◈",
  voyage:  "▲",
  atlas:   "❖",
  smart:   "◻",
  family:  "♥",
};

// Visual preview accent color per template (used when no brand color is available)
const TEMPLATE_ACCENT: Record<string, string> = {
  aurora:  "#2a3a52",
  compass: "#2d5f3f",
  petal:   "#8a4a5a",
  sakina:  "#1a5d4a",
  pulse:   "#d63a3a",
  tribe:   "#b85c2c",
  voyage:  "#e94e77",
  atlas:   "#2a2a2a",
  smart:   "#1f5f8e",
  family:  "#c46a2f",
};

type Props = {
  activeTemplateId: string;
  lang: Lang;
  onSelect: (id: string) => void;
};

export default function TemplateSelector({ activeTemplateId, lang, onSelect }: Props) {
  const t = T[lang];
  const isRtl = lang === "ar";

  return (
    <div dir={isRtl ? "rtl" : "ltr"}>
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6 }}>{t.templateSectionTitle}</div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 16 }}>{t.templateSectionSubtitle}</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {TEMPLATES.map(tpl => {
          const isActive = tpl.id === activeTemplateId;
          const accent = TEMPLATE_ACCENT[tpl.id];
          const name = isRtl ? tpl.nameAr : tpl.name;
          const target = isRtl ? tpl.targetAr : tpl.target;

          return (
            <div
              key={tpl.id}
              onClick={() => onSelect(tpl.id)}
              style={{
                borderRadius: 12,
                border: `1.5px solid ${isActive ? accent : "rgba(255,255,255,0.08)"}`,
                overflow: "hidden",
                cursor: "pointer",
                transition: "border-color .15s",
                background: isActive ? `${accent}10` : "rgba(255,255,255,0.02)",
              }}
            >
              {/* Mini preview thumbnail */}
              <div style={{
                height: 80,
                background: tpl.previewBg,
                position: "relative",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                padding: "8px 10px",
                overflow: "hidden",
              }}>
                {/* Decorative top bar mimicking the agency bar */}
                <div style={{
                  position: "absolute", top: 0, left: 0, right: 0, height: 20,
                  background: tpl.dark ? "rgba(13,27,46,0.9)" : "rgba(253,252,249,0.9)",
                  borderBottom: `1px solid ${tpl.dark ? "rgba(255,255,255,0.08)" : "rgba(13,27,46,0.08)"}`,
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  padding: "0 8px",
                }} >
                  <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: accent }} />
                    <div style={{ width: 24, height: 4, borderRadius: 2, background: tpl.dark ? "rgba(255,255,255,0.2)" : "rgba(13,27,46,0.15)" }} />
                  </div>
                  <div style={{ width: 20, height: 6, borderRadius: 3, background: "#25d366", opacity: 0.9 }} />
                </div>

                {/* Decorative content lines */}
                <div style={{ position: "absolute", top: 28, left: 10, right: 10 }}>
                  {tpl.id === "aurora" && (
                    <>
                      <div style={{ width: "60%", height: 3, borderRadius: 2, background: tpl.dark ? "rgba(255,255,255,0.5)" : "rgba(13,27,46,0.5)", marginBottom: 3 }} />
                      <div style={{ width: "80%", height: 5, borderRadius: 2, background: tpl.dark ? "rgba(255,255,255,0.8)" : "rgba(13,27,46,0.8)", marginBottom: 3, fontFamily: "serif" }} />
                      <div style={{ width: "45%", height: 3, borderRadius: 2, background: accent, opacity: 0.7 }} />
                    </>
                  )}
                  {tpl.id === "compass" && (
                    <>
                      <div style={{ display: "flex", gap: 4 }}>
                        {[1,2,3].map(i => <div key={i} style={{ flex: 1, height: 12, borderRadius: 3, background: tpl.dark ? "rgba(255,255,255,0.08)" : "rgba(13,27,46,0.07)", border: `1px solid ${tpl.dark ? "rgba(255,255,255,0.1)" : "rgba(13,27,46,0.1)"}` }} />)}
                      </div>
                      <div style={{ marginTop: 4, display: "flex", gap: 3 }}>
                        {[4,3,2,3,1].map((h, i) => <div key={i} style={{ flex: 1, height: h * 2, borderRadius: 2, background: i < 4 ? accent : "rgba(13,27,46,0.12)" }} />)}
                      </div>
                    </>
                  )}
                  {tpl.id === "petal" && (
                    <>
                      <div style={{ width: "70%", height: 4, borderRadius: 99, background: "rgba(13,27,46,0.25)", marginBottom: 3, fontStyle: "italic" }} />
                      <div style={{ width: "90%", height: 24, borderRadius: 99, background: `${accent}20`, border: `1px solid ${accent}30` }} />
                    </>
                  )}
                  {tpl.id === "sakina" && (
                    <>
                      <div style={{ width: "90%", height: 24, borderRadius: "60px 60px 4px 4px", background: `${accent}15`, border: `1px solid ${accent}25` }} />
                      <div style={{ marginTop: 3, width: "100%", height: 8, borderRadius: 3, background: "rgba(255,255,255,0.9)", border: `1px solid rgba(13,27,46,0.07)` }} />
                    </>
                  )}
                  {tpl.id === "pulse" && (
                    <>
                      <div style={{ width: "100%", height: 7, borderRadius: 2, background: accent, opacity: 0.9 }} />
                      <div style={{ marginTop: 3, width: "55%", height: 7, borderRadius: 2, background: tpl.dark ? "rgba(255,255,255,0.6)" : "rgba(13,27,46,0.5)" }} />
                      <div style={{ marginTop: 3, display: "flex", gap: 3, alignItems: "center" }}>
                        <div style={{ fontSize: 8, fontWeight: 800, color: accent }}>34%</div>
                        <div style={{ flex: 1, height: 4, borderRadius: 2, background: "rgba(13,27,46,0.08)", overflow: "hidden" }}>
                          <div style={{ width: "34%", height: "100%", background: accent }} />
                        </div>
                      </div>
                    </>
                  )}
                  {tpl.id === "tribe" && (
                    <>
                      <div style={{ display: "flex", gap: 3 }}>
                        {["#c46a2f","#1f5f8e","#2d7a4e","#7c3aed","#b85c2c","#0f766e"].map((c, i) => (
                          <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
                        ))}
                      </div>
                      <div style={{ marginTop: 4, width: "80%", height: 3, borderRadius: 2, background: "rgba(13,27,46,0.2)" }} />
                      <div style={{ marginTop: 2, width: "60%", height: 3, borderRadius: 2, background: "rgba(13,27,46,0.12)" }} />
                    </>
                  )}
                  {tpl.id === "voyage" && (
                    <>
                      <div style={{ display: "flex", gap: 4 }}>
                        {[accent, "#f5a623", "#2dd4a0", "#7c3aed"].map((c, i) => (
                          <div key={i} style={{ width: 12, height: 12, borderRadius: "50%", background: c, opacity: 0.9 }} />
                        ))}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 14, fontWeight: 900, color: "#fff", lineHeight: 1, letterSpacing: "-1px" }}>12</div>
                    </>
                  )}
                  {tpl.id === "atlas" && (
                    <>
                      <div style={{ display: "flex", gap: 4, alignItems: "center", marginBottom: 2 }}>
                        <div style={{ width: 16, height: 2, background: "rgba(13,27,46,0.2)" }} />
                        <div style={{ width: 8, height: 8, borderRadius: "50%", border: `1px solid rgba(13,27,46,0.2)` }} />
                        <div style={{ width: 20, height: 2, background: "rgba(13,27,46,0.2)" }} />
                      </div>
                      <div style={{ width: "85%", height: 6, borderRadius: 2, background: "rgba(13,27,46,0.55)" }} />
                      <div style={{ marginTop: 2, width: "60%", height: 3, borderRadius: 2, background: "rgba(13,27,46,0.2)", fontStyle: "italic" }} />
                    </>
                  )}
                  {tpl.id === "smart" && (
                    <>
                      <div style={{ width: "100%", borderRadius: 3, background: "rgba(255,255,255,0.9)", border: "1px solid rgba(13,27,46,0.08)", overflow: "hidden" }}>
                        {[1,2,3].map(i => (
                          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "2px 5px", borderTop: i === 1 ? "none" : "1px solid rgba(13,27,46,0.06)", fontSize: 5, color: "rgba(13,27,46,0.5)" }}>
                            <span>Line {i}</span><span style={{ color: accent, fontWeight: 700 }}>€{i*100}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {tpl.id === "family" && (
                    <>
                      <div style={{ display: "flex", gap: 3 }}>
                        {["Tots", "Kids", "Teens"].map((label, i) => (
                          <div key={i} style={{ flex: 1, padding: "2px 0", borderRadius: 4, background: i === 0 ? accent : "rgba(255,255,255,0.8)", border: `1px solid ${i === 0 ? accent : "rgba(13,27,46,0.1)"}`, textAlign: "center" }}>
                            <div style={{ fontSize: 5, fontWeight: 700, color: i === 0 ? "#fff" : "rgba(13,27,46,0.6)" }}>{label}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 3, width: "100%", height: 14, borderRadius: 4, background: `${accent}20`, border: `1px solid ${accent}30` }} />
                    </>
                  )}
                </div>

                {/* Active indicator */}
                {isActive && (
                  <div style={{
                    position: "absolute", top: 24, right: 6,
                    width: 14, height: 14, borderRadius: "50%",
                    background: accent, display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="8" height="8" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Label row */}
              <div style={{ padding: "8px 10px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 11.5, fontWeight: 700, color: "#fdfcf9", display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ fontSize: 10, color: accent }}>{TEMPLATE_ICONS[tpl.id]}</span>
                    {name}
                  </div>
                  <div style={{ fontSize: 9.5, color: "rgba(255,255,255,0.4)", marginTop: 1 }}>{target}</div>
                </div>
                <div style={{
                  fontSize: 9.5, fontWeight: 700, padding: "3px 8px", borderRadius: 5,
                  background: isActive ? `${accent}20` : "rgba(255,255,255,0.06)",
                  color: isActive ? accent : "rgba(255,255,255,0.5)",
                  border: `1px solid ${isActive ? accent + "40" : "rgba(255,255,255,0.06)"}`,
                  whiteSpace: "nowrap",
                }}>
                  {isActive ? t.templateActive : t.templateSelect}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
