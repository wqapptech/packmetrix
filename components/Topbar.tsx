"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import Icon from "./Icon";
import { T } from "@/lib/translations";

const SAND = "#e8c97b";
const LANG_KEY = "packmetrix_lang";

export default function Topbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [lang, setLang] = useState<"en" | "ar">("en");

  useEffect(() => {
    const stored = localStorage.getItem(LANG_KEY) as "en" | "ar" | null;
    if (stored) {
      setLang(stored);
      document.body.setAttribute("data-lang", stored);
    }
  }, []);

  const toggleLang = (l: "en" | "ar") => {
    setLang(l);
    document.body.setAttribute("data-lang", l);
    localStorage.setItem(LANG_KEY, l);
  };

  const t = T[lang];

  const pageNames: Record<string, string> = {
    "/dashboard": t.navDashboard,
    "/builder": t.navBuilder,
    "/packages": t.navPackages,
    "/leads": t.navLeads,
    "/profile": t.navBranding,
    "/paywall": t.navBilling,
  };

  const pageName = pathname.startsWith("/builder") ? t.navBuilder : pageNames[pathname] || t.crumbWorkspace;

  return (
    <div style={{
      position: "sticky", top: 0, zIndex: 30,
      background: "rgba(11,20,36,0.92)", backdropFilter: "blur(14px)",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      padding: "10px 32px", display: "flex", alignItems: "center", gap: 14,
      flexShrink: 0,
    }}>
      <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)" }}>
        {t.crumbWorkspace}{" "}·{" "}
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
        <Icon name="plus" size={14} color="#0a1426" strokeWidth={2.5} /> {t.newPackageBtn}
      </button>
    </div>
  );
}
