"use client";

import type { CoreForm } from "@/lib/sections/types";
import type { AnySectionInstance } from "@/lib/sections/types";
import { DA_DARK, DA_GOLD } from "@/lib/tokens";
import { useState } from "react";
import { TEMPLATES } from "@/components/templates";
import { guessDestinationKind, DESTINATION_GRADIENTS } from "@/lib/destination";

const SANS = `var(--font-inter-tight), system-ui, sans-serif`;

// ─── Cover gradient strip ─────────────────────────────────────────────────────

function CoverGradient({ kind, height }: { kind: string; height: number }) {
  const bg = DESTINATION_GRADIENTS[kind] ?? DESTINATION_GRADIENTS.default;
  return (
    <div style={{ width: "100%", height, background: bg, position: "relative", overflow: "hidden" }}>
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,.04) 0, rgba(255,255,255,.04) 1px, transparent 1px, transparent 8px)",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,.45) 100%)",
      }} />
    </div>
  );
}

// ─── Shared mini props ────────────────────────────────────────────────────────

type MiniProps = { core: CoreForm; highlights: string[]; lang: "en" | "ar" };

// ─── Template themes for desktop generic renderer ─────────────────────────────

type TemplateTheme = { bg: string; ink: string; ink2: string; accent: string; rule: string };

const TEMPLATE_THEMES: Record<string, TemplateTheme> = {
  aurora:  { bg: "#faf5e8", ink: "#1a1611", ink2: "#5e564a", accent: "#b08a3e", rule: "#e8dfcc" },
  voyage:  { bg: "#10131a", ink: "#ffffff", ink2: "rgba(255,255,255,.6)", accent: "#ff5a5f", rule: "rgba(255,255,255,.1)" },
  pulse:   { bg: "#ffffff", ink: "#0d0d10", ink2: "#5a5650", accent: "#e83a2e", rule: "#f2eee8" },
  sakina:  { bg: "#f4f1e8", ink: "#1a1a12", ink2: "#5a5040", accent: "#2d5a3e", rule: "#e0d9c8" },
  petal:   { bg: "#fff3ef", ink: "#5a2a3c", ink2: "#8a4a5c", accent: "#c95870", rule: "#f4cfc8" },
  compass: { bg: "#1f1d18", ink: "#e6dcc0", ink2: "#a89972", accent: "#d4b876", rule: "rgba(212,184,118,.2)" },
  atlas:   { bg: "#ffffff", ink: "#0d0d0d", ink2: "#666", accent: "#333", rule: "#e8e8e8" },
  tribe:   { bg: "#f4ece0", ink: "#1a1410", ink2: "#5e4a32", accent: "#c46a44", rule: "#e0d4c0" },
  smart:   { bg: "#ffffff", ink: "#0d1115", ink2: "#5a5650", accent: "#0d8a5a", rule: "#ebe7dc" },
  family:  { bg: "#fff8e6", ink: "#0d3a55", ink2: "#2a5a70", accent: "#d27a1a", rule: "#ffe0a0" },
};

// ─── Aurora phone mini ────────────────────────────────────────────────────────

export function AuroraMiniPhone({ core, highlights, lang }: MiniProps) {
  const isAr = lang === "ar";
  const paper = "#faf5e8";
  const ink   = "#1a1611";
  const ink2  = "#5e564a";
  const gold  = "#b08a3e";
  const rule  = "#e8dfcc";

  const title = isAr ? (core.titleAr || core.destination || "") : (core.titleEn || core.destination || "");
  const desc  = isAr ? (core.descriptionAr || "") : (core.descriptionEn || "");
  const nights   = Number(core.nights) || 5;
  const currency = core.currency || "€";
  const price    = core.price || "—";
  const destKind = guessDestinationKind(core.destination || "");

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{
      background: paper, color: ink, height: "100%", overflow: "hidden",
      fontFamily: '"Inter", system-ui, sans-serif',
    }}>
      <div style={{
        padding: "10px 16px", display: "flex", alignItems: "center", gap: 8,
        background: paper, borderBottom: `1px solid ${rule}`,
      }}>
        <div style={{
          width: 18, height: 18, borderRadius: 4, background: ink, color: gold,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 9, fontWeight: 700,
        }}>P</div>
        <div style={{ fontSize: 10.5, fontWeight: 600, color: ink }}>Packmetrix</div>
      </div>

      <CoverGradient kind={destKind} height={170} />

      <div style={{ padding: "16px 18px 20px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 6, marginBottom: 8,
          fontSize: 9, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase", color: gold,
        }}>
          {nights} {isAr ? "ليالٍ" : "Nights"}
          <span style={{ opacity: .5 }}>·</span>
          {currency}{price}
        </div>
        <div style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 22, fontWeight: 400, color: ink,
          letterSpacing: -.5, lineHeight: 1.1, marginBottom: 12,
        }}>
          {title || (isAr ? "عنوان الباقة" : "Package title")}
        </div>
        {desc && (
          <div style={{
            fontSize: 11.5, color: ink2, lineHeight: 1.55,
            display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>{desc}</div>
        )}
        {highlights.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 14 }}>
            {highlights.slice(0, 3).map((h, i) => (
              <span key={i} style={{
                fontSize: 9.5, fontWeight: 500,
                padding: "3px 8px", borderRadius: 999,
                background: "#fff", border: `1px solid ${rule}`, color: ink,
                display: "inline-flex", alignItems: "center", gap: 4,
              }}>
                <span style={{ color: gold }}>✓</span>{h}
              </span>
            ))}
          </div>
        )}
        <button style={{
          width: "100%", marginTop: 16, padding: "12px 0",
          background: "#25D366", color: "#fff", border: "none",
          borderRadius: 8, fontSize: 12.5, fontWeight: 600,
          fontFamily: '"Inter", sans-serif',
          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
          cursor: "pointer",
        }}>
          {isAr ? "تواصل عبر واتساب" : "Contact us on WhatsApp"}
        </button>
      </div>
    </div>
  );
}

// ─── Voyage phone mini ────────────────────────────────────────────────────────

function VoyageMiniPhone({ core, highlights, lang }: MiniProps) {
  const isAr = lang === "ar";
  const bg   = "#10131a";
  const ink  = "#ffffff";
  const red  = "#ff5a5f";
  const teal = "#2ab8b8";

  const title    = isAr ? (core.titleAr || core.destination || "") : (core.titleEn || core.destination || "");
  const nights   = Number(core.nights) || 5;
  const currency = core.currency || "€";
  const price    = core.price || "—";
  const destKind = guessDestinationKind(core.destination || "");
  const destGrad = DESTINATION_GRADIENTS[destKind] ?? DESTINATION_GRADIENTS.default;

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{
      background: bg, color: ink, height: "100%", overflow: "hidden",
      fontFamily: '"Inter", system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", borderBottom: "1px solid rgba(255,255,255,.1)",
      }}>
        <div style={{ fontSize: 9.5, fontWeight: 700, letterSpacing: 2, color: ink }}>VOYAGE</div>
        <div style={{ fontSize: 9, color: "rgba(255,255,255,.5)", fontWeight: 500 }}>
          {nights} {isAr ? "ليالٍ" : "nights"}
        </div>
      </div>

      {/* 2:1 grid of gradient blocks */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 3, padding: "12px 14px 0" }}>
        <div style={{
          height: 90, borderRadius: 6, background: destGrad, position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(0,0,0,.5) 100%)" }} />
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
          <div style={{ flex: 1, borderRadius: 6, background: `linear-gradient(135deg, ${red} 0%, #c03040 100%)` }} />
          <div style={{ flex: 1, borderRadius: 6, background: `linear-gradient(135deg, ${teal} 0%, #1a8888 100%)` }} />
        </div>
      </div>

      <div style={{ padding: "14px 16px" }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: ink, lineHeight: 1.15, marginBottom: 8 }}>
          {title || (isAr ? "عنوان الباقة" : "Package title")}
          {" "}
          <span style={{ color: red }}>{nights}{isAr ? "ن" : "N"}</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: ink }}>
            {currency}{price}
          </div>
          <div style={{
            fontSize: 8.5, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase",
            padding: "2px 7px", borderRadius: 4, background: "rgba(255,90,95,.15)", color: red,
          }}>
            {isAr ? "رحلة مميزة" : "Premium"}
          </div>
        </div>

        {highlights.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 5, marginBottom: 14 }}>
            {highlights.slice(0, 2).map((h, i) => (
              <div key={i} style={{ fontSize: 10, color: "rgba(255,255,255,.65)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ color: red, fontSize: 8 }}>▶</span>{h}
              </div>
            ))}
          </div>
        )}

        <button style={{
          width: "100%", padding: "11px 0",
          background: red, color: "#fff", border: "none",
          borderRadius: 6, fontSize: 12, fontWeight: 700,
          cursor: "pointer",
        }}>
          {isAr ? "احجز الآن" : "Book Now"}
        </button>
      </div>

      {/* Red bottom bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 5, background: red }} />
    </div>
  );
}

// ─── Pulse phone mini ─────────────────────────────────────────────────────────

function PulseMiniPhone({ core, highlights, lang }: MiniProps) {
  const isAr    = lang === "ar";
  const red     = "#e83a2e";
  const ink     = "#0d0d10";

  const title    = isAr ? (core.titleAr || core.destination || "") : (core.titleEn || core.destination || "");
  const nights   = Number(core.nights) || 5;
  const currency = core.currency || "€";
  const price    = core.price || "—";
  const wasPrice = Number(String(price).replace(/[^\d.]/g, "")) * 1.34;
  const wasPriceStr = wasPrice > 0 ? Math.round(wasPrice).toString() : "—";
  const destKind = guessDestinationKind(core.destination || "");

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{
      background: "#ffffff", color: ink, height: "100%", overflow: "hidden",
      fontFamily: '"Inter", system-ui, sans-serif',
    }}>
      {/* Urgent red header bar */}
      <div style={{
        background: red, padding: "8px 14px",
        fontSize: 9, fontWeight: 700, letterSpacing: 1.2,
        color: "#fff", textTransform: "uppercase",
      }}>
        {isAr ? "● آخر ٣ أماكن · تغادر الجمعة" : "● LAST 3 SPOTS · DEPARTS FRI"}
      </div>

      <CoverGradient kind={destKind} height={120} />

      <div style={{ padding: "14px 16px" }}>
        {/* Big price */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
          <div style={{ fontSize: 32, fontWeight: 800, color: ink, lineHeight: 1 }}>
            {currency}{price}
          </div>
          <div style={{ fontSize: 13, color: "#999", textDecoration: "line-through" }}>
            {currency}{wasPriceStr}
          </div>
        </div>

        <div style={{ fontSize: 14, fontWeight: 600, color: ink, marginBottom: 4, lineHeight: 1.2 }}>
          {title || (isAr ? "عنوان الباقة" : "Package title")}
        </div>
        <div style={{ fontSize: 10.5, color: "#888", marginBottom: 14 }}>
          {nights} {isAr ? "ليالٍ" : "nights"}
        </div>

        {/* Progress bar */}
        <div style={{ marginBottom: 6 }}>
          <div style={{ height: 5, background: "#f0ece4", borderRadius: 3, overflow: "hidden" }}>
            <div style={{ width: "34%", height: "100%", background: red, borderRadius: 3 }} />
          </div>
        </div>
        <div style={{ fontSize: 9, color: "#999", marginBottom: 14 }}>
          {isAr ? "باقي ١٦س ٢٢د" : "16h 22m remaining"}
        </div>

        <button style={{
          width: "100%", padding: "12px 0",
          background: ink, color: "#fff", border: "none",
          borderRadius: 6, fontSize: 12.5, fontWeight: 700,
          cursor: "pointer",
        }}>
          {isAr ? "احجز الآن" : "BOOK NOW"}
        </button>
      </div>
    </div>
  );
}

// ─── Sakina phone mini ────────────────────────────────────────────────────────

function SakinaMiniPhone({ core, highlights, lang }: MiniProps) {
  const isAr  = lang === "ar";
  const bg    = "#f4f1e8";
  const green = "#2d5a3e";
  const ink   = "#1a1a12";

  const title    = isAr ? (core.titleAr || core.destination || "") : (core.titleEn || core.destination || "");
  const nights   = Number(core.nights) || 5;
  const currency = core.currency || "€";
  const price    = core.price || "—";

  return (
    <div dir="rtl" style={{
      background: bg, color: ink, height: "100%", overflow: "hidden",
      fontFamily: '"Inter", system-ui, sans-serif',
    }}>
      <div style={{ textAlign: "center", padding: "18px 16px 0" }}>
        {/* Basmala */}
        <div style={{
          fontFamily: "serif", fontSize: 24, color: green,
          marginBottom: 6, lineHeight: 1.4,
        }}>﷽</div>
        <div style={{
          fontSize: 9, fontWeight: 600, letterSpacing: 1.8, textTransform: "uppercase",
          color: green, marginBottom: 8,
        }}>
          {isAr ? "باقة عمرة" : "Umrah Package"}
        </div>
        <div style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 20, fontWeight: 400, color: ink,
          letterSpacing: -.3, lineHeight: 1.15, marginBottom: 16,
        }}>
          {title || (isAr ? "عنوان الباقة" : "Package title")}
        </div>
      </div>

      {/* Details card */}
      <div style={{
        margin: "0 14px 14px",
        background: "#fff", borderRadius: 8,
        padding: "10px 14px",
        boxShadow: "0 2px 10px rgba(0,0,0,.06)",
      }}>
        {[
          { label: isAr ? "تأشيرة" : "Visa",    value: isAr ? "مشمولة" : "Included", green: true },
          { label: isAr ? "محرم"  : "Mahram",   value: isAr ? "مطلوب"  : "Required", green: false },
          { label: isAr ? "وجبات" : "Meals",    value: isAr ? "نصف إقامة" : "Half board", green: true },
        ].map((row, i) => (
          <div key={i} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "6px 0", borderBottom: i < 2 ? "1px solid #e8e4d8" : "none",
            fontSize: 10.5,
          }}>
            <span style={{ color: "#6b6050" }}>{row.label}</span>
            <span style={{ color: row.green ? green : ink, fontWeight: 600 }}>{row.value}</span>
          </div>
        ))}
      </div>

      <div style={{ textAlign: "center", padding: "0 16px" }}>
        <div style={{ fontSize: 11, color: "#6b6050", marginBottom: 4 }}>
          {isAr ? "السعر للشخص" : "Price per person"}
        </div>
        <div style={{ fontSize: 22, fontWeight: 700, color: ink, marginBottom: 14 }}>
          {currency}{price}
        </div>
        <button style={{
          width: "100%", padding: "11px 0",
          background: green, color: "#fff", border: "none",
          borderRadius: 7, fontSize: 12, fontWeight: 600,
          cursor: "pointer",
        }}>
          {isAr ? "احجز مقعدك" : "Reserve a seat"}
        </button>
      </div>
    </div>
  );
}

// ─── Petal phone mini ─────────────────────────────────────────────────────────

function PetalMiniPhone({ core, highlights, lang }: MiniProps) {
  const isAr  = lang === "ar";
  const rose  = "#c95870";
  const ink   = "#5a2a3c";

  const title    = isAr ? (core.titleAr || core.destination || "") : (core.titleEn || core.destination || "");
  const nights   = Number(core.nights) || 5;
  const currency = core.currency || "€";
  const price    = core.price || "—";
  const dest     = core.destination || (isAr ? "الوجهة" : "Destination");
  const destKind = guessDestinationKind(dest);
  const destGrad = DESTINATION_GRADIENTS[destKind] ?? DESTINATION_GRADIENTS.default;

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{
      background: "linear-gradient(180deg, #fff3ef 0%, #fde2db 100%)",
      color: ink, height: "100%", overflow: "hidden",
      fontFamily: '"Inter", system-ui, sans-serif',
    }}>
      <div style={{ padding: "20px 16px 0", display: "flex", flexDirection: "column", alignItems: "center" }}>
        {/* Heart-shaped cover */}
        <div style={{
          width: 120, height: 120,
          borderRadius: 50,
          background: destGrad,
          position: "relative", overflow: "hidden",
          marginBottom: 14,
        }}>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(201,88,112,.25) 0%, rgba(201,88,112,.6) 100%)" }} />
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 36, color: "rgba(255,255,255,.9)",
          }}>♥</div>
        </div>

        <div style={{
          fontSize: 9, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase",
          color: rose, marginBottom: 8, textAlign: "center",
        }}>
          {isAr ? "شهر عسل · " : "Honeymoon · "}{dest}
        </div>

        <div style={{
          fontFamily: "Georgia, serif", fontStyle: "italic",
          fontSize: 20, color: ink, textAlign: "center",
          lineHeight: 1.2, marginBottom: 10,
        }}>
          {title || (isAr ? "عنوان الباقة" : "Package title")}
        </div>

        <div style={{ fontSize: 11, color: rose, marginBottom: 16, opacity: .85 }}>
          {nights} {isAr ? "ليالٍ" : "nights"} · {currency}{price}{isAr ? " / زوجين" : " / couple"}
        </div>

        <button style={{
          padding: "11px 28px",
          background: rose, color: "#fff", border: "none",
          borderRadius: 999, fontSize: 12, fontWeight: 600,
          cursor: "pointer",
        }}>
          {isAr ? "استفسر بخصوصية" : "Enquire privately"}
        </button>
      </div>
    </div>
  );
}

// ─── Compass phone mini ───────────────────────────────────────────────────────

function CompassMiniPhone({ core, highlights, lang }: MiniProps) {
  const isAr = lang === "ar";
  const bg   = "#1f1d18";
  const ink  = "#e6dcc0";
  const gold = "#d4b876";

  const title    = isAr ? (core.titleAr || core.destination || "") : (core.titleEn || core.destination || "");
  const nights   = Number(core.nights) || 5;
  const days     = nights + 1;
  const currency = core.currency || "€";
  const price    = core.price || "—";

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{
      background: bg, color: ink, height: "100%", overflow: "hidden",
      fontFamily: '"Courier New", Courier, monospace',
    }}>
      {/* Monospace coordinates header */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "10px 16px", borderBottom: `1px solid rgba(212,184,118,.2)`,
      }}>
        <div style={{ fontSize: 9.5, color: gold, letterSpacing: .5 }}>N 32.7°</div>
        <div style={{ fontSize: 9.5, color: "rgba(230,220,192,.5)", letterSpacing: .5 }}>{days} {isAr ? "أيام" : "DAYS"}</div>
      </div>

      {/* Route card */}
      <div style={{
        margin: "12px 14px",
        border: `1px solid rgba(212,184,118,.2)`,
        borderRadius: 6, padding: "14px",
        position: "relative",
      }}>
        <svg width="100%" height="40" viewBox="0 0 220 40" style={{ overflow: "visible" }}>
          <circle cx="14" cy="20" r="5" fill="none" stroke={gold} strokeWidth="1.5" />
          <circle cx="14" cy="20" r="2" fill={gold} />
          <line x1="19" y1="20" x2="201" y2="20" stroke={gold} strokeWidth="1" strokeDasharray="4 3" />
          <circle cx="206" cy="20" r="5" fill={gold} />
        </svg>
        <div style={{ fontSize: 8.5, letterSpacing: 1.5, textTransform: "uppercase", color: "rgba(230,220,192,.6)", marginTop: 6 }}>
          {isAr ? "رحلة · " : "EXPEDITION · "}{days} {isAr ? "أيام" : "DAYS"} · {isAr ? "متحدي" : "STRENUOUS"}
        </div>
      </div>

      <div style={{ padding: "0 16px" }}>
        <div style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 20, fontWeight: 400, color: "#f0e6c8",
          lineHeight: 1.2, marginBottom: 12,
        }}>
          {title || (isAr ? "عنوان الباقة" : "Package title")}
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: ink }}>{currency}{price}</div>
          {highlights.length > 0 && (
            <div style={{ fontSize: 9.5, color: "rgba(230,220,192,.55)", fontStyle: "italic", maxWidth: "55%", textAlign: isAr ? "left" : "right" }}>
              {highlights[0]}
            </div>
          )}
        </div>

        <button style={{
          width: "100%", padding: "11px 0",
          background: "transparent", color: gold,
          border: `1.5px solid ${gold}`,
          borderRadius: 5, fontSize: 10.5, fontWeight: 700,
          letterSpacing: 1, textTransform: "uppercase",
          cursor: "pointer",
          fontFamily: '"Courier New", monospace',
        }}>
          {isAr ? "انضم للرحلة" : "JOIN THE EXPEDITION"}
        </button>
      </div>
    </div>
  );
}

// ─── Atlas phone mini ─────────────────────────────────────────────────────────

function AtlasMiniPhone({ core, highlights, lang }: MiniProps) {
  const isAr    = lang === "ar";
  const ink     = "#0d0d0d";
  const ink2    = "#666";

  const title    = isAr ? (core.titleAr || core.destination || "") : (core.titleEn || core.destination || "");
  const nights   = Number(core.nights) || 5;
  const currency = core.currency || "€";
  const price    = core.price || "—";

  const cities = ["Paris", "Lyon", "Milan", "Roma"];
  const cityColors = ["#8a9ab8", "#c8a870", "#b8a890", "#c46a44"];

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{
      background: "#ffffff", color: ink, height: "100%", overflow: "hidden",
      fontFamily: '"Inter", system-ui, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        padding: "10px 16px", borderBottom: "1px solid #e8e8e8",
        fontSize: 9, fontWeight: 700, letterSpacing: 1.4,
        textTransform: "uppercase", color: "#888",
      }}>
        {isAr ? "جولة متعددة المدن · " : "MULTI-CITY TOUR · "}{nights} {isAr ? "ليالٍ" : "NIGHTS"}
      </div>

      <div style={{ padding: "16px 16px 0" }}>
        <div style={{ fontSize: 19, fontWeight: 800, color: ink, lineHeight: 1.15, marginBottom: 16 }}>
          {title || (isAr ? "عنوان الباقة" : "Package title")}
        </div>

        {/* City blocks row */}
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 16, overflowX: "hidden" }}>
          {cities.map((city, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 5,
                  background: cityColors[i], opacity: .9,
                }} />
                <div style={{ fontSize: 7.5, fontWeight: 600, color: ink, letterSpacing: .5 }}>{city}</div>
              </div>
              {i < cities.length - 1 && (
                <div style={{ fontSize: 11, color: "#bbb", marginBottom: 14 }}>→</div>
              )}
            </div>
          ))}
        </div>

        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "10px 0", borderTop: "1px solid #e8e8e8", marginBottom: 14,
        }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: ink }}>{currency}{price}</div>
          <div style={{ fontSize: 10, color: ink2 }}>{nights} {isAr ? "ليالٍ" : "nights"}</div>
        </div>

        <button style={{
          width: "100%", padding: "12px 0",
          background: ink, color: "#fff", border: "none",
          borderRadius: 6, fontSize: 12, fontWeight: 700,
          cursor: "pointer",
        }}>
          {isAr ? "احجز الجولة" : "BOOK THE TOUR"}
        </button>
      </div>
    </div>
  );
}

// ─── Tribe phone mini ─────────────────────────────────────────────────────────

function TribeMiniPhone({ core, highlights, lang }: MiniProps) {
  const isAr   = lang === "ar";
  const bg     = "#f4ece0";
  const orange = "#c46a44";
  const ink    = "#1a1410";

  const title    = isAr ? (core.titleAr || core.destination || "") : (core.titleEn || core.destination || "");
  const nights   = Number(core.nights) || 5;
  const currency = core.currency || "€";
  const price    = core.price || "—";
  const destKind = guessDestinationKind(core.destination || "");

  const avatarColors = ["#c46a44", "#e8a87c", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b"];

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{
      background: bg, color: ink, height: "100%", overflow: "hidden",
      fontFamily: '"Inter", system-ui, sans-serif',
    }}>
      <div style={{ padding: "18px 16px 0" }}>
        {/* Avatar stack */}
        <div style={{ display: "flex", alignItems: "center", marginBottom: 10 }}>
          <div style={{ display: "flex" }}>
            {avatarColors.map((c, i) => (
              <div key={i} style={{
                width: 28, height: 28, borderRadius: "50%",
                background: c, border: "2px solid " + bg,
                marginLeft: i === 0 ? 0 : -6,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 8.5, fontWeight: 700, color: "#fff",
              }}>
                {String.fromCharCode(65 + i)}
              </div>
            ))}
          </div>
          <div style={{ marginLeft: 6, fontSize: 9, fontWeight: 600, color: orange }}>+6</div>
        </div>

        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 1.4, textTransform: "uppercase",
          color: orange, marginBottom: 10,
        }}>
          {isAr ? "١٢ مسافراً · مجموعة صغيرة" : "12 TRAVELLERS · SMALL GROUP"}
        </div>

        <div style={{
          fontFamily: '"Instrument Serif", serif',
          fontSize: 20, fontWeight: 400, color: ink,
          lineHeight: 1.2, marginBottom: 12,
        }}>
          {title || (isAr ? "عنوان الباقة" : "Package title")}
        </div>

        {/* Destination gradient block */}
        <div style={{
          height: 70, borderRadius: 7,
          overflow: "hidden", marginBottom: 12,
          position: "relative",
        }}>
          <CoverGradient kind={destKind} height={70} />
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: ink }}>{currency}{price}<span style={{ fontSize: 10, fontWeight: 500, color: "#a8896a" }}>/{isAr ? "شخص" : "pp"}</span></div>
          <div style={{ fontSize: 9, fontWeight: 600, color: orange }}>
            {isAr ? "٤ أماكن متبقية" : "4 spots left"}
          </div>
        </div>

        <button style={{
          width: "100%", padding: "11px 0",
          background: orange, color: "#fff", border: "none",
          borderRadius: 7, fontSize: 12, fontWeight: 600,
          cursor: "pointer",
        }}>
          {isAr ? "انضم للمجموعة" : "Join the group"}
        </button>
      </div>
    </div>
  );
}

// ─── Smart phone mini ─────────────────────────────────────────────────────────

function SmartMiniPhone({ core, highlights, lang }: MiniProps) {
  const isAr  = lang === "ar";
  const green = "#0d8a5a";
  const ink   = "#0d1115";

  const title    = isAr ? (core.titleAr || core.destination || "") : (core.titleEn || core.destination || "");
  const currency = core.currency || "€";
  const price    = core.price || "—";
  const numPrice = Number(String(price).replace(/[^\d.]/g, ""));
  const wasPrice = numPrice > 0 ? Math.round(numPrice * 1.34) : 0;
  const wasPriceStr = wasPrice > 0 ? wasPrice.toString() : "—";
  const bcom   = numPrice > 0 ? Math.round(numPrice * 1.22) : 0;
  const hcom   = numPrice > 0 ? Math.round(numPrice * 1.28) : 0;

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{
      background: "#ffffff", color: ink, height: "100%", overflow: "hidden",
      fontFamily: '"Inter", system-ui, sans-serif',
    }}>
      <div style={{ padding: "14px 16px 0" }}>
        {/* Best value badge */}
        <div style={{ marginBottom: 10 }}>
          <span style={{
            fontSize: 9.5, fontWeight: 700, letterSpacing: 1,
            padding: "3px 10px", borderRadius: 4,
            background: "#e6f5ee", color: green,
          }}>
            {isAr ? "أفضل قيمة • -34٪" : "BEST VALUE • -34%"}
          </span>
        </div>

        <div style={{ fontSize: 15, fontWeight: 800, color: ink, marginBottom: 8, lineHeight: 1.2 }}>
          {title || (isAr ? "عنوان الباقة" : "Package title")}
        </div>

        {/* Big price + strikethrough */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: ink }}>{currency}{price}</div>
          <div style={{ fontSize: 13, color: "#bbb", textDecoration: "line-through" }}>{currency}{wasPriceStr}</div>
        </div>

        {/* Price comparison table */}
        <div style={{ borderRadius: 7, overflow: "hidden", border: "1px solid #ebe7dc", marginBottom: 14 }}>
          {[
            { label: "Hotels.com",    val: hcom,    highlight: false },
            { label: "Booking.com",   val: bcom,    highlight: false },
            { label: isAr ? "وكالتنا" : "Your Agency", val: numPrice, highlight: true },
          ].map((row, i) => (
            <div key={i} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              padding: "7px 10px",
              background: row.highlight ? "#e6f5ee" : (i % 2 === 0 ? "#fafafa" : "#fff"),
              borderTop: i > 0 ? "1px solid #ebe7dc" : "none",
              fontSize: 10,
              fontWeight: row.highlight ? 700 : 400,
              color: row.highlight ? green : "#5a5650",
            }}>
              <span>{row.label}</span>
              <span>{currency}{row.val > 0 ? row.val : "—"}</span>
            </div>
          ))}
        </div>

        <button style={{
          width: "100%", padding: "12px 0",
          background: ink, color: "#fff", border: "none",
          borderRadius: 6, fontSize: 12.5, fontWeight: 700,
          cursor: "pointer",
        }}>
          {isAr ? "قفّل هذا السعر" : "Lock this rate"}
        </button>
      </div>
    </div>
  );
}

// ─── Family phone mini ────────────────────────────────────────────────────────

function FamilyMiniPhone({ core, highlights, lang }: MiniProps) {
  const isAr   = lang === "ar";
  const blue   = "#0d3a55";
  const orange = "#d27a1a";

  const title    = isAr ? (core.titleAr || core.destination || "") : (core.titleEn || core.destination || "");
  const nights   = Number(core.nights) || 5;
  const currency = core.currency || "€";
  const price    = core.price || "—";
  const destKind = guessDestinationKind(core.destination || "");

  const tags = isAr
    ? ["حمام سباحة", "نادي أطفال", "شاطئ", "بوفيه"]
    : ["Pool", "Kids club", "Beach", "Buffet"];

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{
      background: "linear-gradient(180deg, #fff8e6 0%, #ffecc4 100%)",
      color: blue, height: "100%", overflow: "hidden",
      fontFamily: '"Inter", system-ui, sans-serif',
    }}>
      <div style={{ padding: "14px 14px 0" }}>
        {/* Destination gradient hero block with ALL-IN badge */}
        <div style={{ position: "relative", height: 80, borderRadius: 8, overflow: "hidden", marginBottom: 10 }}>
          <CoverGradient kind={destKind} height={80} />
          <div style={{
            position: "absolute", top: 7, right: 7,
            background: orange, color: "#fff",
            fontSize: 8, fontWeight: 700, letterSpacing: .8,
            padding: "2px 7px", borderRadius: 4,
          }}>ALL-IN</div>
        </div>

        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: 1.2, textTransform: "uppercase",
          color: orange, marginBottom: 8,
        }}>
          {isAr ? "٢ بالغ · ٢ طفل · الأطفال مجاناً" : "2 ADULTS · 2 KIDS · KIDS FREE"}
        </div>

        <div style={{ fontSize: 16, fontWeight: 800, color: blue, lineHeight: 1.2, marginBottom: 10 }}>
          {title || (isAr ? "عنوان الباقة" : "Package title")}
        </div>

        {/* Tag chips */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 14 }}>
          {tags.map((tag, i) => (
            <span key={i} style={{
              fontSize: 9.5, fontWeight: 500,
              padding: "3px 9px", borderRadius: 999,
              background: "#fff",
              color: blue,
              boxShadow: "0 1px 4px rgba(0,0,0,.08)",
            }}>{tag}</span>
          ))}
        </div>

        <div style={{ fontSize: 13, fontWeight: 700, color: blue, marginBottom: 14 }}>
          {isAr ? "من " : "From "}{currency}{price}{isAr ? " / عائلة" : " / family"}
        </div>

        <button style={{
          width: "100%", padding: "11px 0",
          background: orange, color: "#fff", border: "none",
          borderRadius: 7, fontSize: 12, fontWeight: 600,
          cursor: "pointer",
        }}>
          {isAr ? "احجز رحلة العائلة" : "Book the family trip"}
        </button>
      </div>
    </div>
  );
}

// ─── Aurora desktop mini ──────────────────────────────────────────────────────

function AuroraMiniDesktop({ core, highlights, lang }: MiniProps) {
  const isAr = lang === "ar";
  const paper = "#faf5e8";
  const ink   = "#1a1611";
  const ink2  = "#5e564a";
  const gold  = "#b08a3e";
  const rule  = "#e8dfcc";

  const title    = isAr ? (core.titleAr || core.destination || "") : (core.titleEn || core.destination || "");
  const desc     = isAr ? (core.descriptionAr || "") : (core.descriptionEn || "");
  const nights   = Number(core.nights) || 5;
  const currency = core.currency || "€";
  const price    = core.price || "—";
  const destKind = guessDestinationKind(core.destination || "");

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{
      background: paper, color: ink, height: "100%", overflow: "hidden",
      fontFamily: '"Inter", system-ui, sans-serif',
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 14px", borderBottom: `1px solid ${rule}`, background: paper,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{ width: 14, height: 14, borderRadius: 3, background: ink, color: gold, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700 }}>P</div>
          <div style={{ fontSize: 9.5, fontWeight: 600, color: ink }}>Packmetrix</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 8, color: ink2 }}>
          <span>{isAr ? "الرحلة" : "Journey"}</span>
          <span>{isAr ? "الإقامة" : "Stay"}</span>
          <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: "italic", fontSize: 11, color: ink }}>{currency}{price}</span>
          <span style={{ padding: "3px 8px", background: "#25D366", color: "#fff", borderRadius: 999, fontSize: 7.5, fontWeight: 600 }}>{isAr ? "واتساب" : "WhatsApp"}</span>
        </div>
      </div>
      <div style={{ position: "relative", height: 160 }}>
        <CoverGradient kind={destKind} height={160} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 22px 14px" }}>
          <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(255,255,255,.85)" }}>
            {nights} {isAr ? "ليالٍ" : "nights"}
          </div>
          <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 26, fontWeight: 400, color: "#fff", letterSpacing: -.8, lineHeight: 1.05, marginTop: 4, textShadow: "0 2px 16px rgba(0,0,0,.4)", maxWidth: "70%" }}>
            {title || (isAr ? "عنوان الباقة" : "Package title")}
          </div>
        </div>
      </div>
      <div style={{ padding: "18px 22px", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 22 }}>
        <div>
          <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase", color: gold, marginBottom: 6 }}>
            {isAr ? "الرحلة" : "The Journey"} · 01
          </div>
          {desc && (
            <div style={{ fontSize: 9.5, color: ink2, lineHeight: 1.55 }}>
              <span style={{ fontFamily: '"Instrument Serif", serif', fontSize: 20, float: isAr ? "right" : "left", lineHeight: .9, marginInlineEnd: 4, marginTop: 2, color: ink }}>{desc[0]}</span>
              {desc.slice(1, 120)}
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase", color: gold, marginBottom: 8 }}>
            {isAr ? "المشمول" : "Inclusions"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {highlights.slice(0, 3).map((h, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9.5, color: ink, paddingBottom: 5, borderBottom: i < 2 ? `1px solid ${rule}` : "none" }}>
                <span style={{ color: gold }}>✓</span>{h}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Generic desktop renderer for non-Aurora templates ────────────────────────

function ThemedMiniDesktop({ core, highlights, lang, theme }: MiniProps & { theme: TemplateTheme }) {
  const isAr = lang === "ar";
  const { bg, ink, ink2, accent, rule } = theme;

  const title    = isAr ? (core.titleAr || core.destination || "") : (core.titleEn || core.destination || "");
  const desc     = isAr ? (core.descriptionAr || "") : (core.descriptionEn || "");
  const nights   = Number(core.nights) || 5;
  const currency = core.currency || "€";
  const price    = core.price || "—";
  const destKind = guessDestinationKind(core.destination || "");

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{
      background: bg, color: ink, height: "100%", overflow: "hidden",
      fontFamily: '"Inter", system-ui, sans-serif',
    }}>
      {/* Nav strip */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 14px", borderBottom: `1px solid ${rule}`, background: bg,
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            width: 14, height: 14, borderRadius: 3,
            background: accent, color: bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 8, fontWeight: 700,
          }}>P</div>
          <div style={{ fontSize: 9.5, fontWeight: 600, color: ink }}>Packmetrix</div>
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center", fontSize: 8, color: ink2 }}>
          <span>{isAr ? "الرحلة" : "Journey"}</span>
          <span>{isAr ? "الإقامة" : "Stay"}</span>
          <span style={{ fontFamily: '"Instrument Serif", serif', fontStyle: "italic", fontSize: 11, color: ink }}>{currency}{price}</span>
          <span style={{ padding: "3px 8px", background: "#25D366", color: "#fff", borderRadius: 999, fontSize: 7.5, fontWeight: 600 }}>{isAr ? "واتساب" : "WhatsApp"}</span>
        </div>
      </div>

      {/* Hero band */}
      <div style={{ position: "relative", height: 160 }}>
        <CoverGradient kind={destKind} height={160} />
        <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: "0 22px 14px" }}>
          <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase", color: "rgba(255,255,255,.85)" }}>
            {nights} {isAr ? "ليالٍ" : "nights"}
          </div>
          <div style={{ fontFamily: '"Instrument Serif", serif', fontSize: 26, fontWeight: 400, color: "#fff", letterSpacing: -.8, lineHeight: 1.05, marginTop: 4, textShadow: "0 2px 16px rgba(0,0,0,.4)", maxWidth: "70%" }}>
            {title || (isAr ? "عنوان الباقة" : "Package title")}
          </div>
        </div>
      </div>

      {/* 2-col body */}
      <div style={{ padding: "18px 22px", display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 22 }}>
        <div>
          <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase", color: accent, marginBottom: 6 }}>
            {isAr ? "الرحلة" : "The Journey"} · 01
          </div>
          {desc && (
            <div style={{ fontSize: 9.5, color: ink2, lineHeight: 1.55 }}>
              <span style={{ fontFamily: '"Instrument Serif", serif', fontSize: 20, float: isAr ? "right" : "left", lineHeight: .9, marginInlineEnd: 4, marginTop: 2, color: ink }}>{desc[0]}</span>
              {desc.slice(1, 120)}
            </div>
          )}
        </div>
        <div>
          <div style={{ fontSize: 8, fontWeight: 600, letterSpacing: 1.4, textTransform: "uppercase", color: accent, marginBottom: 8 }}>
            {isAr ? "المشمول" : "Inclusions"}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
            {highlights.slice(0, 3).map((h, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9.5, color: ink, paddingBottom: 5, borderBottom: i < 2 ? `1px solid ${rule}` : "none" }}>
                <span style={{ color: accent }}>✓</span>{h}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Dispatch maps ────────────────────────────────────────────────────────────

const PHONE_RENDERS: Record<string, React.FC<MiniProps>> = {
  aurora:  AuroraMiniPhone,
  voyage:  VoyageMiniPhone,
  pulse:   PulseMiniPhone,
  sakina:  SakinaMiniPhone,
  petal:   PetalMiniPhone,
  compass: CompassMiniPhone,
  atlas:   AtlasMiniPhone,
  tribe:   TribeMiniPhone,
  smart:   SmartMiniPhone,
  family:  FamilyMiniPhone,
};

// ─── Main bezel component ─────────────────────────────────────────────────────

export function LivePreviewPhone({
  core,
  sections,
  lang,
  templateId,
}: {
  core: CoreForm;
  sections: AnySectionInstance[];
  lang: "en" | "ar";
  templateId: string;
}) {
  const [mode, setMode] = useState<"phone" | "desktop">("phone");
  const isPhone = mode === "phone";
  const isAr    = lang === "ar";

  const tpl           = TEMPLATES.find(t => t.id === templateId);
  const templateLabel = isAr ? (tpl?.nameAr ?? templateId) : (tpl?.name ?? templateId);
  const templateTarget = isAr ? (tpl?.targetAr ?? "") : (tpl?.target ?? "");

  const inclSec    = sections.find(s => s.type === "inclusions");
  const highlights: string[] = inclSec?.data && Array.isArray((inclSec.data as any).includes)
    ? (inclSec.data as any).includes.slice(0, 3)
    : [];

  const PhoneRender = PHONE_RENDERS[templateId] ?? PHONE_RENDERS.aurora;
  const theme       = TEMPLATE_THEMES[templateId] ?? TEMPLATE_THEMES.aurora;

  return (
    <div style={{
      width: isPhone ? 320 : 500,
      background: DA_DARK,
      borderRadius: 18,
      padding: 14,
      boxShadow: "0 24px 60px -20px rgba(0,0,0,.4), 0 8px 24px -8px rgba(0,0,0,.2)",
      display: "flex", flexDirection: "column", gap: 12,
      transition: "width .25s ease",
    }}>
      {/* Header strip */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 4px" }}>
        <div style={{
          fontFamily: SANS, fontSize: 9.5, fontWeight: 600,
          letterSpacing: 1.4, textTransform: "uppercase",
          color: "rgba(255,255,255,.55)",
        }}>
          {isAr ? "معاينة مباشرة" : "Live preview"}
        </div>

        {/* Phone / Desktop toggle */}
        <div style={{ display: "flex", gap: 2, padding: 2, background: "rgba(255,255,255,.06)", borderRadius: 6 }}>
          <button
            onClick={() => setMode("phone")}
            style={{
              width: 26, height: 22, borderRadius: 4,
              background: isPhone ? DA_GOLD : "transparent",
              color: isPhone ? "#fff" : "rgba(255,255,255,.55)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title="Phone"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="7" y="2" width="10" height="20" rx="2" /><line x1="11" y1="18" x2="13" y2="18" />
            </svg>
          </button>
          <button
            onClick={() => setMode("desktop")}
            style={{
              width: 26, height: 22, borderRadius: 4,
              background: !isPhone ? DA_GOLD : "transparent",
              color: !isPhone ? "#fff" : "rgba(255,255,255,.55)",
              border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title="Desktop"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="14" rx="2" /><path d="M8 21h8M12 17v4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Screen */}
      <div style={{
        background: theme.bg,
        borderRadius: isPhone ? 11 : 7,
        overflow: "hidden",
        height: isPhone ? 540 : 380,
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,.06)",
      }}>
        {isPhone ? (
          <PhoneRender core={core} highlights={highlights} lang={lang} />
        ) : templateId === "aurora" ? (
          <AuroraMiniDesktop core={core} highlights={highlights} lang={lang} />
        ) : (
          <ThemedMiniDesktop core={core} highlights={highlights} lang={lang} theme={theme} />
        )}
      </div>

      {/* Footer */}
      <div style={{ padding: "0 4px" }}>
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          fontFamily: SANS, fontSize: 11, color: "rgba(255,255,255,.7)",
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: DA_GOLD }} />
          <span>{templateLabel}</span>
          <span style={{ color: "rgba(255,255,255,.3)" }}>·</span>
          <span style={{ color: "rgba(255,255,255,.5)" }}>{templateTarget}</span>
        </div>
      </div>
    </div>
  );
}
