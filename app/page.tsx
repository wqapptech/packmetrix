"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useLang } from "@/hooks/useLang";
import { T } from "@/lib/translations";
import AppLayout from "@/components/AppLayout";
import Icon from "@/components/Icon";

const SAND = "#e8c97b";
const SUCCESS = "#2dd4a0";

type Step = "paste" | "extracting" | "preview";

type PreviewData = {
  destination: string;
  price: string;
  nights?: number;
  description: string;
  advantages: string[];
  airports: { name: string; price: string }[];
};

export default function Home() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const lang = useLang();
  const t = T[lang];
  const isRtl = lang === "ar";
  const arabicFont = "'Cairo', 'Noto Sans Arabic', system-ui, sans-serif";
  const bodyFont = isRtl ? arabicFont : "inherit";
  const headingFont = isRtl ? arabicFont : "var(--font-dm-serif), 'DM Serif Display', serif";
  const [step, setStep] = useState<Step>("paste");
  const [text, setText] = useState("");
  const [previewData, setPreviewData] = useState<PreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!text.trim()) return;
    setStep("extracting");
    setError(null);
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Extraction failed");
      localStorage.setItem("packageData", JSON.stringify(json));
      setPreviewData(json);
      setStep("preview");
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please try again.");
      setStep("paste");
    }
  };

  const desktopSteps = [
    { n: "01", label: t.homeStep1Label, desc: t.homeStep1Desc },
    { n: "02", label: t.homeStep2Label, desc: t.homeStep2Desc },
    { n: "03", label: t.homeStep3Label, desc: t.homeStep3Desc },
    { n: "04", label: t.homeStep4Label, desc: t.homeStep4Desc },
  ];

  /* ─────────────────────────────────────────────────────────
     MOBILE LAYOUT
  ───────────────────────────────────────────────────────── */
  if (isMobile) {
    return (
      <AppLayout>
        <div dir={isRtl ? "rtl" : "ltr"} style={{ background: "var(--navy)", display: "flex", flexDirection: "column", minHeight: "100%", fontFamily: bodyFont }}>

          {/* ── Hero ── */}
          <div style={{
            padding: "28px 16px 24px",
            background: "linear-gradient(160deg, rgba(30,52,90,0.85) 0%, rgba(13,27,46,0) 80%)",
          }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: `${SAND}18`, border: `1px solid ${SAND}35`,
              borderRadius: 99, padding: "4px 11px",
              fontSize: 11, fontWeight: 600, color: SAND, marginBottom: 16,
            }}>
              <Icon name="sparkle" size={11} color={SAND} strokeWidth={2} />
              {t.homeAiBadgeMobile}
            </div>

            <h1 style={{
              fontFamily: headingFont,
              fontSize: 30, fontWeight: isRtl ? 700 : 400, lineHeight: isRtl ? 1.4 : 1.18,
              letterSpacing: isRtl ? "-0.3px" : "-0.5px", color: "#fdfcf9",
              marginBottom: 10,
            }}>
              {t.homeHeadingPre}{" "}
              <em style={{ color: SAND, fontStyle: isRtl ? "normal" : "italic" }}>{t.homeHeadingEm}</em>
            </h1>

            <p style={{
              fontSize: 14, color: "rgba(255,255,255,0.45)",
              lineHeight: 1.6,
            }}>
              {t.homeMobileSubtitle}
            </p>
          </div>

          {/* ── Input card ── */}
          <div style={{ padding: "0 16px 14px" }}>
            <div style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 20, padding: 20,
            }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: isRtl ? "0.3px" : "0.8px",
                textTransform: "uppercase", color: "rgba(255,255,255,0.3)",
                marginBottom: 10,
              }}>
                {t.homeMobileTravelPostLabel}
              </div>

              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={t.homeMobilePastePlaceholder}
                dir={isRtl ? "rtl" : "ltr"}
                style={{
                  width: "100%", height: 160,
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: 14,
                  color: "#fdfcf9",
                  fontSize: 14, fontFamily: bodyFont, lineHeight: 1.6,
                  padding: "14px", resize: "none", outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => (e.target.style.borderColor = `${SAND}70`)}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />

              <div style={{ display: "flex", justifyContent: isRtl ? "flex-start" : "flex-end", marginTop: 6, marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>{text.length} {t.homeCharacters}</span>
              </div>

              {error && (
                <p style={{ marginBottom: 10, fontSize: 13, color: "var(--danger)" }}>{error}</p>
              )}

              <button
                onClick={handleExtract}
                disabled={!text.trim() || step === "extracting"}
                style={{
                  width: "100%",
                  padding: "15px",
                  background: (!text.trim() || step === "extracting")
                    ? "rgba(255,255,255,0.07)"
                    : `linear-gradient(135deg, ${SAND}, #c4a84f)`,
                  border: "none", borderRadius: 12,
                  fontSize: 15, fontWeight: 700,
                  color: (!text.trim() || step === "extracting") ? "rgba(255,255,255,0.3)" : "#0d1b2e",
                  fontFamily: bodyFont,
                  cursor: (!text.trim() || step === "extracting") ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  transition: "all 0.2s",
                }}
              >
                {step === "extracting" ? (
                  <><span className="spinner" style={{ borderTopColor: SAND }} /> {t.homeAnalyzing}</>
                ) : (
                  <><Icon name="sparkle" size={18} color="#0d1b2e" strokeWidth={2.5} /> {t.homeExtractBtn}</>
                )}
              </button>
            </div>
          </div>

          {/* ── Extracting skeleton ── */}
          {step === "extracting" && (
            <div style={{ padding: "0 16px 14px" }}>
              <div style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 16, padding: 20,
              }}>
                <div style={{ fontSize: 13, color: SAND, fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
                  <span className="spinner" style={{ borderTopColor: SAND }} />
                  {t.homeMobileExtractingLabel}
                </div>
                {[75, 50, 85, 60].map((w, i) => (
                  <div key={i} className="shimmer-bg" style={{ height: i === 0 ? 20 : 13, width: `${w}%`, borderRadius: 6, marginBottom: 10 }} />
                ))}
              </div>
            </div>
          )}

          {/* ── Preview result ── */}
          {step === "preview" && previewData && (
            <div style={{ padding: "0 16px 14px" }}>
              <div style={{
                borderRadius: 18, overflow: "hidden",
                border: `1px solid ${SAND}35`,
                background: "rgba(255,255,255,0.04)",
              }}>
                <div style={{
                  background: "linear-gradient(135deg, #c9713a, #8b4513)",
                  padding: "20px 20px 16px", position: "relative",
                }}>
                  <div style={{
                    position: "absolute", top: 12, right: isRtl ? "auto" : 12, left: isRtl ? 12 : "auto",
                    background: `${SAND}ee`, borderRadius: 99,
                    padding: "3px 10px", fontSize: 10, fontWeight: 800, color: "#0d1b2e",
                    textTransform: "uppercase", letterSpacing: ".4px",
                  }}>✦ {t.homeAiExtractedBadge}</div>
                  <div style={{ fontFamily: headingFont, fontSize: 22, color: "#fff", marginBottom: 4 }}>
                    {previewData.destination}
                  </div>
                  <div style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", fontWeight: 600 }}>
                    {previewData.nights ? `${previewData.nights} ${t.nightsLabel} · ` : ""}{previewData.price}
                  </div>
                </div>

                <div style={{ padding: "16px 20px" }}>
                  {previewData.description && (
                    <p style={{ fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 14 }}>
                      {previewData.description.slice(0, 120)}{previewData.description.length > 120 ? "…" : ""}
                    </p>
                  )}

                  {previewData.advantages?.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                      {previewData.advantages.slice(0, 3).map((a, i) => (
                        <span key={i} style={{
                          fontSize: 12, background: `${SUCCESS}15`,
                          border: `1px solid ${SUCCESS}30`,
                          borderRadius: 99, padding: "4px 10px", color: SUCCESS,
                        }}>✓ {a}</span>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => router.push("/builder")}
                    style={{
                      width: "100%", padding: "15px",
                      background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
                      color: "#0d1b2e", border: "none", borderRadius: 12,
                      fontSize: 15, fontWeight: 700,
                      fontFamily: bodyFont, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    {t.homeOpenInBuilder}
                    <Icon name={isRtl ? "arrow_left" : "arrow_right"} size={16} color="#0d1b2e" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── How it works ── */}
          {step === "paste" && (
            <div style={{ padding: "4px 16px 0" }}>
              <div style={{
                fontSize: 11, fontWeight: 700, letterSpacing: isRtl ? "0.3px" : "0.8px",
                textTransform: "uppercase", color: "rgba(255,255,255,0.3)",
                marginBottom: 12, paddingLeft: isRtl ? 0 : 2, paddingRight: isRtl ? 2 : 0,
              }}>
                {t.homeHowItWorks}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[
                  { n: "01", icon: "copy",     label: t.homeStep1Label,         desc: t.homeStep1Desc },
                  { n: "02", icon: "sparkle",  label: t.homeMobileStep2Label,   desc: t.homeMobileStep2Desc },
                  { n: "03", icon: "edit",     label: t.homeMobileStep3Label,   desc: t.homeMobileStep3Desc },
                  { n: "04", icon: "trending", label: t.homeMobileStep4Label,   desc: t.homeMobileStep4Desc },
                ].map((s, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 14, alignItems: "center",
                    background: "rgba(255,255,255,0.025)",
                    border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: 14, padding: "13px 14px",
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                      background: `${SAND}12`, border: `1px solid ${SAND}25`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}>
                      <Icon name={s.icon as any} size={16} color={SAND} strokeWidth={1.8} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.85)", marginBottom: 2 }}>{s.label}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.38)" }}>{s.desc}</div>
                    </div>
                    <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.15)", letterSpacing: "0.5px" }}>{s.n}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ height: "max(32px, env(safe-area-inset-bottom, 32px))" }} />
        </div>
      </AppLayout>
    );
  }

  /* ─────────────────────────────────────────────────────────
     DESKTOP LAYOUT  (unchanged)
  ───────────────────────────────────────────────────────── */
  return (
    <AppLayout>
      <div dir={isRtl ? "rtl" : "ltr"} style={{ flex: 1, overflow: "auto", background: "var(--navy)", display: "flex", flexDirection: "column", fontFamily: bodyFont }}>

        {/* Hero */}
        <div style={{
          padding: "60px 64px 40px",
          background: "linear-gradient(160deg, rgba(22,37,64,0.9) 0%, rgba(13,27,46,0) 60%)",
          borderBottom: "1px solid var(--border)",
        }}>
          <div className="fade-up" style={{ maxWidth: 580 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: `${SAND}18`, border: `1px solid ${SAND}40`,
              borderRadius: 99, padding: "4px 12px",
              fontSize: 12, fontWeight: 500, color: SAND, marginBottom: 18,
            }}>
              <Icon name="sparkle" size={12} color={SAND} strokeWidth={2} />
              {t.homeAiBadge}
            </div>
            <h1 style={{
              fontFamily: headingFont,
              fontSize: isRtl ? 40 : 48, fontWeight: isRtl ? 700 : 400, lineHeight: isRtl ? 1.4 : 1.12,
              letterSpacing: isRtl ? "-0.5px" : "-1px", color: "var(--white)", marginBottom: 16,
            }}>
              {t.homeHeadingPre}{isRtl ? " " : <br />}{isRtl ? "" : "into "}<em style={{ color: SAND, fontStyle: isRtl ? "normal" : "italic" }}>{t.homeHeadingEm}</em>
            </h1>
            <p style={{ fontSize: 17, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, maxWidth: 440 }}>
              {t.homeSubtitle}
            </p>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: "40px 64px", flex: 1, display: "flex", gap: 32 }}>

          {/* Left: input + steps */}
          <div className="fade-up" style={{ flex: 1, maxWidth: 540, animationDelay: "0.08s" }}>
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
              borderRadius: 20, padding: 24,
            }}>
              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.5)", letterSpacing: isRtl ? "0.3px" : "0.5px", textTransform: "uppercase" }}>
                  {t.homeTravelPostLabel}
                </span>
              </div>
              <textarea
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={t.homePastePlaceholder}
                dir={isRtl ? "rtl" : "ltr"}
                style={{
                  width: "100%", height: 220,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 12, color: "var(--white)",
                  fontSize: 13, fontFamily: bodyFont, lineHeight: 1.7,
                  padding: "14px 16px", resize: "none", outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => (e.target.style.borderColor = `${SAND}60`)}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              />
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{text.length} {t.homeCharacters}</span>
                <button
                  onClick={handleExtract}
                  disabled={!text.trim() || step === "extracting"}
                  style={{
                    background: step === "extracting" ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${SAND}, #c4a84f)`,
                    color: step === "extracting" ? "rgba(255,255,255,0.4)" : "#0d1b2e",
                    border: "none", borderRadius: 10,
                    padding: "10px 24px", fontSize: 14, fontWeight: 700,
                    fontFamily: bodyFont,
                    cursor: step === "extracting" ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", gap: 8,
                    transition: "all 0.2s",
                  }}
                >
                  {step === "extracting"
                    ? <><span className="spinner" style={{ borderTopColor: SAND }} /> {t.homeAnalyzingDesktop}</>
                    : <><Icon name="sparkle" size={14} color="#0d1b2e" strokeWidth={2.5} /> {t.homeExtractBtn}</>
                  }
                </button>
              </div>
              {error && <p style={{ marginTop: 10, fontSize: 12, color: "var(--danger)" }}>{error}</p>}
            </div>

            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 12 }}>
              {desktopSteps.map((s, i) => {
                const done = step === "preview" && i < 2;
                const active = (step === "extracting" && i === 0) || (step === "paste" && i === 0);
                return (
                  <div key={i} style={{ display: "flex", gap: 14, alignItems: "flex-start", opacity: done || active ? 1 : 0.35 }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                      background: done ? `${SAND}22` : "rgba(255,255,255,0.05)",
                      border: `1px solid ${done ? SAND : "rgba(255,255,255,0.1)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700,
                      color: done ? SAND : "rgba(255,255,255,0.35)",
                    }}>
                      {done ? <Icon name="check" size={12} color={SAND} strokeWidth={2.5} /> : s.n}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.75)" }}>{s.label}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginTop: 1 }}>{s.desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right: preview */}
          <div style={{ flex: 1, maxWidth: 420 }}>
            {step === "paste" && (
              <div className="fade-in" style={{
                height: 420,
                background: "rgba(255,255,255,0.02)",
                border: "1px dashed rgba(255,255,255,0.1)",
                borderRadius: 20,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 12, color: "rgba(255,255,255,0.2)",
              }}>
                <Icon name="package" size={40} color="rgba(255,255,255,0.1)" strokeWidth={1} />
                <p style={{ fontSize: 13, textAlign: "center", maxWidth: 200 }}>
                  {t.homePreviewPlaceholder}
                </p>
              </div>
            )}

            {step === "extracting" && (
              <div className="fade-in" style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border)",
                borderRadius: 20, padding: 24,
              }}>
                <div style={{ fontSize: 12, color: SAND, fontWeight: 600, marginBottom: 20, display: "flex", alignItems: "center", gap: 6 }}>
                  <span className="spinner" style={{ borderTopColor: SAND }} />
                  {t.homeAiExtractingLabel}
                </div>
                {[80, 55, 90, 65, 40, 70].map((w, i) => (
                  <div key={i} className="shimmer-bg" style={{ height: i === 0 ? 22 : 14, width: `${w}%`, borderRadius: 6, marginBottom: 12 }} />
                ))}
              </div>
            )}

            {step === "preview" && previewData && (
              <div className="slide-in" style={{
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${SAND}40`,
                borderRadius: 20, overflow: "hidden",
              }}>
                <div style={{
                  background: "linear-gradient(135deg, #c9713a, #8b4513)",
                  height: 80, display: "flex", alignItems: "flex-end",
                  padding: "12px 20px", position: "relative",
                }}>
                  <div style={{
                    position: "absolute", top: 8, right: isRtl ? "auto" : 10, left: isRtl ? 10 : "auto",
                    background: `${SAND}dd`, borderRadius: 99,
                    padding: "3px 10px", fontSize: 11, fontWeight: 700, color: "#0d1b2e",
                  }}>{t.homeAiExtractedBadge}</div>
                  <div>
                    <div style={{ fontFamily: headingFont, fontSize: 20, color: "#fff", textShadow: "0 1px 6px rgba(0,0,0,0.5)" }}>
                      {previewData.destination}
                    </div>
                    <div style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>
                      {previewData.nights ? `${previewData.nights} ${t.nightsLabel} · ` : ""}{previewData.price}
                    </div>
                  </div>
                </div>
                <div style={{ padding: "16px 20px" }}>
                  <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.6, marginBottom: 14 }}>
                    {previewData.description}
                  </p>
                  {previewData.advantages?.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 8 }}>
                        {t.includedLabel}
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {previewData.advantages.slice(0, 4).map((a, i) => (
                          <span key={i} style={{
                            fontSize: 11, background: "rgba(45,212,160,0.12)",
                            border: "1px solid rgba(45,212,160,0.25)",
                            borderRadius: 99, padding: "3px 10px", color: SUCCESS,
                          }}>✓ {a}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {previewData.airports?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.35)", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 8 }}>
                        {t.homeDepartureAirports}
                      </div>
                      {previewData.airports.map((a, i) => (
                        <div key={i} style={{
                          display: "flex", justifyContent: "space-between",
                          padding: "7px 0",
                          borderBottom: i < previewData.airports.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                          fontSize: 12,
                        }}>
                          <span style={{ color: "rgba(255,255,255,0.65)" }}>{a.name}</span>
                          <span style={{ fontWeight: 700, color: SAND }}>{a.price}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <button
                    onClick={() => router.push("/builder")}
                    style={{
                      width: "100%",
                      background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
                      color: "#0d1b2e", border: "none", borderRadius: 10,
                      padding: "11px", fontSize: 13, fontWeight: 700,
                      fontFamily: bodyFont, cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    }}
                  >
                    <Icon name="edit" size={14} color="#0d1b2e" strokeWidth={2.5} />
                    {t.homeOpenInBuilder}
                    <Icon name={isRtl ? "arrow_left" : "arrow_right"} size={14} color="#0d1b2e" strokeWidth={2.5} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
