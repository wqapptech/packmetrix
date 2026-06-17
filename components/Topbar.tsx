"use client";

import { usePathname, useRouter } from "next/navigation";
import Icon from "./Icon";
import { T } from "@/lib/translations";
import { useLang, switchLang } from "@/hooks/useLang";
import {
  DA_BG, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2, DA_SURFACE, DA_GOLD,
} from "@/lib/tokens";

const SANS = `var(--font-sans)`;

export default function Topbar({
  isMobile = false,
  onMenuClick,
}: {
  isMobile?: boolean;
  onMenuClick?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const lang = useLang();

  const t = T[lang];
  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const pageNames: Record<string, string> = {
    "/dashboard": t.navDashboard,
    "/builder":   t.navBuilder,
    "/packages":  t.navPackages,
    "/leads":     t.navLeads,
    "/profile":   t.navBranding,
    "/paywall":   t.navBilling,
  };

  const pageName = pathname.startsWith("/builder")
    ? t.navBuilder
    : pageNames[pathname] || t.crumbWorkspace;

  const isHome = pathname === "/";

  return (
    <div
      dir={dir}
      style={{
        height: 64,
        paddingInline: isMobile ? 16 : 32,
        borderBottom: `1px solid ${DA_RULE}`,
        background: DA_BG,
        display: "flex",
        alignItems: "center",
        gap: isMobile ? 12 : 16,
        flexShrink: 0,
      }}
    >
      {/* Hamburger — mobile only */}
      {isMobile && (
        <button
          onClick={onMenuClick}
          style={{
            background: "none", border: "none", cursor: "pointer",
            padding: 4, color: DA_INK3,
            display: "flex", alignItems: "center", flexShrink: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
      )}

      {/* Breadcrumb — desktop */}
      {!isMobile && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          fontFamily: SANS, fontSize: 12.5,
        }}>
          <span style={{ color: DA_INK3 }}>{t.crumbWorkspace}</span>
          <span style={{ color: DA_INK3 }}>·</span>
          <span style={{ color: DA_INK1, fontWeight: 500 }}>{pageName}</span>
        </div>
      )}

      {/* Page title — mobile */}
      {isMobile && (
        <span style={{
          fontFamily: SANS, fontSize: 14, fontWeight: 500,
          color: DA_INK1, flex: 1,
        }}>
          {pageName}
        </span>
      )}

      {!isMobile && <div style={{ flex: 1 }} />}

      {/* Language toggle */}
      <div style={{
        display: "flex",
        background: DA_SURFACE,
        border: `1px solid ${DA_RULE2}`,
        borderRadius: 999,
        padding: 2,
      }}>
        {(["en", "ar"] as const).map(l => {
          const active = lang === l;
          return (
            <button
              key={l}
              onClick={() => switchLang(l)}
              style={{
                padding: isMobile ? "4px 9px" : "5px 12px",
                borderRadius: 999,
                border: "none",
                background: active ? DA_INK1 : "transparent",
                color: active ? DA_BG : DA_INK2,
                fontFamily: SANS,
                fontSize: isMobile ? 11 : 12,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              {l === "en" ? "EN" : "عربي"}
            </button>
          );
        })}
      </div>

      {/* New Package CTA */}
      {!isHome && (
        isMobile ? (
          <button
            onClick={() => router.push("/builder")}
            style={{
              width: 34, height: 34, borderRadius: 9, flexShrink: 0,
              background: DA_GOLD, border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Icon name="plus" size={16} color="#fff" strokeWidth={2.5} />
          </button>
        ) : (
          <button
            onClick={() => router.push("/builder")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 7,
              padding: "9px 16px", borderRadius: 9,
              background: DA_GOLD,
              color: "#fff", fontWeight: 600, fontSize: 12.5,
              border: "none", cursor: "pointer", fontFamily: SANS,
              transition: "background .12s",
            }}
          >
            <Icon name="plus" size={14} color="#fff" strokeWidth={2.5} />
            {t.newPackageBtn}
          </button>
        )
      )}
    </div>
  );
}
