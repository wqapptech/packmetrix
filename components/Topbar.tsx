"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Icon from "./Icon";

const SAND = "#e8c97b";

const PAGE_NAMES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/builder": "Builder",
  "/leads": "Leads",
  "/profile": "Branding",
};

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "ar">("en");

  useEffect(() => {
    const stored = (typeof document !== "undefined" && document.body.getAttribute("data-lang")) as "en" | "ar" | null;
    if (stored) setLang(stored);
  }, []);

  const toggleLang = (l: "en" | "ar") => {
    setLang(l);
    document.body.setAttribute("data-lang", l);
  };

  const pageName = pathname.startsWith("/builder") ? "Builder" : PAGE_NAMES[pathname] || "Workspace";

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 30,
      background: "rgba(11,20,36,0.92)", backdropFilter: "blur(14px)",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      padding: "10px 32px", display: "flex", alignItems: "center", gap: 14,
      flexShrink: 0,
    }}>
      <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)" }}>
        Workspace{" "}·{" "}
        <strong style={{ color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{pageName}</strong>
      </div>
      <div style={{ flex: 1 }} />

      {/* Language toggle */}
      <div style={{
        display: "inline-flex",
        background: "rgba(255,255,255,0.05)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 99, padding: 3,
      }}>
        {(["en", "ar"] as const).map(l => (
          <button
            key={l}
            onClick={() => toggleLang(l)}
            style={{
              padding: "4px 10px", borderRadius: 99, border: "none",
              background: lang === l ? SAND : "none",
              color: lang === l ? "#0a1426" : "rgba(255,255,255,0.4)",
              fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit",
              transition: "all .15s",
            }}
          >
            {l === "en" ? "EN" : "عربية"}
          </button>
        ))}
      </div>

      {/* View Landing */}
      <button
        onClick={() => router.push("/dashboard")}
        style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          padding: "7px 12px", borderRadius: 8, cursor: "pointer",
          fontSize: 12.5, color: "rgba(255,255,255,0.65)",
          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
          fontFamily: "inherit", transition: "all .15s",
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.07)"; (e.currentTarget as HTMLButtonElement).style.color = "#fff"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.04)"; (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.65)"; }}
      >
        <Icon name="eye" size={13} /> View Landing
      </button>

      {/* New Package CTA */}
      <button
        onClick={() => router.push("/builder")}
        style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "9px 16px", borderRadius: 9,
          background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
          color: "#0a1426", fontWeight: 700, fontSize: 12.5,
          border: "none", cursor: "pointer", fontFamily: "inherit",
        }}
      >
        <Icon name="plus" size={14} color="#0a1426" strokeWidth={2.5} /> New Package
      </button>
    </div>
  );
}
