"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Icon from "./Icon";

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
  const [user, setUser] = useState<{ email: string; initials: string } | null>(null);
  const [firstPackageId, setFirstPackageId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const parts = (u.displayName || u.email || "").split(/[\s@]/);
        const initials = parts.slice(0, 2).map(p => p[0]?.toUpperCase() || "").join("") || "AG";
        setUser({ email: u.email || "", initials });
        try {
          const snap = await getDocs(query(collection(db, "packages"), where("userId", "==", u.uid), limit(1)));
          if (!snap.empty) setFirstPackageId(snap.docs[0].id);
        } catch {}
      } else {
        setUser(null);
        setFirstPackageId(null);
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

  return (
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
          <NavLink
            key={item.label}
            item={item}
            active={isActive(item.href)}
            locked={isLocked(item.href)}
          />
        ))}

        {/* Settings section */}
        <div style={{
          fontSize: 10, textTransform: "uppercase", letterSpacing: ".7px",
          color: "rgba(255,255,255,0.25)", padding: "14px 14px 6px", fontWeight: 700,
        }}>Settings</div>
        {NAV_SETTINGS.map((item) => (
          <NavLink
            key={item.label}
            item={item}
            active={isActive(item.href)}
            locked={isLocked(item.href)}
          />
        ))}

        {/* Visitor View section */}
        <div style={{
          fontSize: 10, textTransform: "uppercase", letterSpacing: ".7px",
          color: "rgba(255,255,255,0.25)", padding: "14px 14px 6px", fontWeight: 700,
        }}>Visitor View</div>
        <NavLink
          item={{
            href: firstPackageId ? `/p/${firstPackageId}` : "/builder",
            icon: "globe",
            label: "Landing page ↗",
            external: Boolean(firstPackageId),
          }}
          active={false}
          locked={!user}
        />
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
                <div style={{ fontSize: 10.5, color: SAND }}>Free Plan</div>
              </div>
            </div>
            <button onClick={handleLogout} style={{
              width: "100%", padding: "8px 10px", borderRadius: 8,
              background: "none", border: "1px solid rgba(255,255,255,0.07)",
              color: "rgba(255,255,255,0.3)", fontSize: 12, fontFamily: "inherit",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>
              <Icon name="logout" size={12} color="rgba(255,255,255,0.25)" /> Sign out
            </button>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, padding: "4px 0" }}>
            <Link href="/signup" style={{
              display: "block", width: "100%", padding: "9px", textAlign: "center",
              background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
              borderRadius: 9, color: "#0d1b2e", fontSize: 12, fontWeight: 700,
              textDecoration: "none",
            }}>Sign up free</Link>
            <Link href="/login" style={{
              display: "block", width: "100%", padding: "8px", textAlign: "center",
              background: "none", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 9, color: "rgba(255,255,255,0.4)",
              fontSize: 12, textDecoration: "none",
            }}>Log in</Link>
          </div>
        )}
      </div>
    </aside>
  );
}
