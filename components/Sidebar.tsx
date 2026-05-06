"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { addDoc, collection } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Icon from "./Icon";
import { useLang } from "@/hooks/useLang";
import { T } from "@/lib/translations";

type IconName = Parameters<typeof Icon>[0]["name"];

type NavItem = {
  href?: string;
  icon: IconName;
  label: string;
  pro?: boolean;
  external?: boolean;
};

const NAV_MAIN: NavItem[] = [
  { href: "/dashboard", icon: "chart",   label: "Dashboard" },
  { href: "/builder",   icon: "package", label: "Builder" },
  { href: "/packages",  icon: "archive", label: "Packages" },
  { href: "/leads",     icon: "users",   label: "Leads" },
  { icon: "sparkle",                     label: "AI Optimizer", pro: true },
];

const NAV_SETTINGS: NavItem[] = [
  { href: "/profile",  icon: "globe",        label: "Branding" },
  { href: "/paywall",  icon: "credit_card",  label: "Billing" },
];

const SAND = "#e8c97b";
const GATED = ["/builder", "/dashboard", "/leads", "/profile", "/paywall"];

function NavLink({ item, active, locked }: { item: NavItem; active: boolean; locked: boolean }) {
  const style = {
    display: "flex", alignItems: "center", gap: 11,
    padding: "9px 12px", borderRadius: 9,
    background: active ? `${SAND}1f` : "transparent",
    color: active ? SAND : item.pro ? "rgba(255,255,255,0.3)" : locked ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.55)",
    fontSize: 13.5, fontWeight: active ? 600 : 500,
    textDecoration: "none", transition: "all .15s",
    cursor: item.pro || !item.href ? "default" : "pointer",
    border: "none",
    fontFamily: "inherit", width: "100%", textAlign: "left" as const,
  };

  const inner = (
    <>
      <Icon
        name={item.icon}
        size={15}
        color={active ? SAND : item.pro ? "rgba(255,255,255,0.2)" : locked ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.4)"}
        strokeWidth={active ? 2.2 : 1.8}
      />
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.pro && (
        <span style={{
          fontSize: 9, fontWeight: 800, letterSpacing: "0.5px",
          background: `${SAND}25`, color: SAND,
          borderRadius: 4, padding: "2px 5px",
        }}>PRO</span>
      )}
      {locked && !item.pro && (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round">
          <rect x="3" y="11" width="18" height="11" rx="2" />
          <path d="M7 11V7a5 5 0 0110 0v4" />
        </svg>
      )}
    </>
  );

  if (item.pro || !item.href) {
    return <div style={style}>{inner}</div>;
  }

  return (
    <Link
      href={locked ? "/login" : item.href}
      target={item.external ? "_blank" : undefined}
      style={style}
    >
      {inner}
    </Link>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const lang = useLang();
  const t = T[lang];

  const [user, setUser] = useState<{ email: string; initials: string; uid: string } | null>(null);
  const [aiModal, setAiModal] = useState(false);
  const [aiRequested, setAiRequested] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const labelMap: Record<string, string> = {
    "Dashboard":    t.navDashboard,
    "Builder":      t.navBuilder,
    "Packages":     t.navPackages,
    "Leads":        t.navLeads,
    "AI Optimizer": t.navAiOptimizer,
    "Branding":     t.navBranding,
    "Billing":      t.navBilling,
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const parts = (u.displayName || u.email || "").split(/[\s@]/);
        const initials = parts.slice(0, 2).map(p => p[0]?.toUpperCase() || "").join("") || "AG";
        setUser({ email: u.email || "", initials, uid: u.uid });
      } else {
        setUser(null);
      }
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/");
  };

  const isActive = (href?: string) => {
    if (!href) return false;
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/";
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  const isLocked = (href?: string) => href ? GATED.includes(href) && !user : false;

  const handleAiRequest = async () => {
    setAiLoading(true);
    try {
      await addDoc(collection(db, "featureRequests"), {
        feature: "ai-optimizer",
        userId: user?.uid || "anonymous",
        email: user?.email || "",
        createdAt: Date.now(),
      });
      setAiRequested(true);
    } catch {}
    setAiLoading(false);
  };

  return (
    <>
    {aiModal && (
      <div
        onClick={() => setAiModal(false)}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}
      >
        <div onClick={e => e.stopPropagation()} style={{ background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 20, padding: "36px 32px", maxWidth: 360, width: "100%", textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: `${SAND}18`, border: `1px solid ${SAND}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, margin: "0 auto 16px" }}>✦</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#fdfcf9", marginBottom: 8 }}>{t.comingSoonTitle}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6, marginBottom: 28 }}>
            <b style={{ color: "#fff" }}>{t.navAiOptimizer}</b> {t.aiOptimizerModal}
          </div>
          {aiRequested ? (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 10, background: "rgba(45,212,160,0.1)", border: "1px solid rgba(45,212,160,0.3)", color: "#2dd4a0", fontSize: 13, fontWeight: 600 }}>
              {t.onTheList}
            </div>
          ) : (
            <button
              onClick={handleAiRequest}
              disabled={aiLoading}
              style={{ padding: "11px 24px", borderRadius: 10, background: `linear-gradient(135deg, ${SAND}, #c4a84f)`, border: "none", color: "#0a1426", fontSize: 13, fontWeight: 700, cursor: aiLoading ? "not-allowed" : "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              {aiLoading ? "…" : t.iWantFaster}
            </button>
          )}
          <div>
            <button onClick={() => setAiModal(false)} style={{ marginTop: 16, fontSize: 12, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>{t.closeBtn}</button>
          </div>
        </div>
      </div>
    )}
    <aside style={{
      width: 230, minWidth: 230, height: "100vh",
      background: "rgba(7,14,26,0.97)",
      borderRight: "1px solid rgba(255,255,255,0.08)",
      display: "flex", flexDirection: "column",
      padding: "22px 0", flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "0 20px 24px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32,
          background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
          borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0, fontSize: 15, fontWeight: 800, color: "#0a1426",
        }}>
          P
        </div>
        <span style={{ fontWeight: 700, fontSize: 15.5, letterSpacing: "-0.3px", color: "#fdfcf9" }}>
          Pack<em style={{ color: SAND, fontStyle: "normal", fontWeight: 600 }}>metrix</em>
        </span>
      </div>

      {/* Main nav */}
      <nav style={{ flex: 1, padding: "0 12px", display: "flex", flexDirection: "column", gap: 2, overflowY: "auto" }}>
        {NAV_MAIN.map((item) => (
          item.label === "AI Optimizer" ? (
            <div key={item.label} onClick={() => setAiModal(true)} style={{ display: "flex", alignItems: "center", gap: 11, padding: "9px 12px", borderRadius: 9, color: "rgba(255,255,255,0.3)", fontSize: 13.5, fontWeight: 500, cursor: "pointer", transition: "all .15s" }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <Icon name="sparkle" size={15} color="rgba(255,255,255,0.2)" strokeWidth={1.8} />
              <span style={{ flex: 1 }}>{t.navAiOptimizer}</span>
              <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: "0.5px", background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.3)", borderRadius: 4, padding: "2px 5px" }}>{t.aiOptimizerSoon}</span>
            </div>
          ) : (
            <NavLink
              key={item.label}
              item={{ ...item, label: labelMap[item.label] ?? item.label }}
              active={isActive(item.href)}
              locked={isLocked(item.href)}
            />
          )
        ))}

        {/* Settings section */}
        <div style={{
          fontSize: 10, textTransform: "uppercase", letterSpacing: ".7px",
          color: "rgba(255,255,255,0.25)", padding: "14px 14px 6px", fontWeight: 700,
        }}>{t.sectionSettings}</div>
        {NAV_SETTINGS.map((item) => (
          <NavLink
            key={item.label}
            item={{ ...item, label: labelMap[item.label] ?? item.label }}
            active={isActive(item.href)}
            locked={isLocked(item.href)}
          />
        ))}

      </nav>

      {/* Footer */}
      <div style={{ padding: "0 12px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 12 }}>
        {user ? (
          <div>
            <div style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 10px", borderRadius: 10, marginBottom: 6,
              cursor: "pointer",
            }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.03)")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #1f5f8e, #0e3a5c)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "#fff",
              }}>{user.initials}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600, color: "rgba(255,255,255,0.85)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </div>
                <div style={{ fontSize: 10.5, color: SAND }}>{t.freePlanLabel}</div>
              </div>
            </div>
            <button onClick={handleLogout} style={{
              width: "100%", padding: "8px 10px", borderRadius: 8,
              background: "none", border: "1px solid rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.3)", fontSize: 12, fontFamily: "inherit",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>
              <Icon name="logout" size={12} color="rgba(255,255,255,0.25)" /> {t.signOut}
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "4px 0" }}>
            <Link href="/signup" style={{
              display: "block", width: "100%", padding: "9px", textAlign: "center",
              background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
              borderRadius: 9, color: "#0d1b2e", fontSize: 12, fontWeight: 700,
              textDecoration: "none",
            }}>{t.signUpFree}</Link>
            <Link href="/login" style={{
              display: "block", width: "100%", padding: "8px", textAlign: "center",
              background: "none", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 9, color: "rgba(255,255,255,0.4)",
              fontSize: 12, textDecoration: "none",
            }}>{t.logIn}</Link>
          </div>
        )}
      </div>
    </aside>
    </>
  );
}
