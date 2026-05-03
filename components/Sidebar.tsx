"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Icon from "./Icon";

type IconName = Parameters<typeof Icon>[0]["name"];

const NAV: { href: string; icon: IconName; label: string; pro?: boolean }[] = [
  { href: "/",          icon: "home",    label: "Home" },
  { href: "/builder",   icon: "package", label: "Builder" },
  { href: "/aivideo",   icon: "video",   label: "AI Video", pro: true },
  { href: "/dashboard", icon: "chart",   label: "Dashboard" },
  { href: "/leads",     icon: "users",   label: "Leads" },
];

const SAND = "#e8c97b";
const GATED = ["/builder", "/aivideo", "/dashboard", "/leads"];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<{ email: string; initials: string } | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u) {
        const parts = (u.displayName || u.email || "").split(/[\s@]/);
        const initials = parts.slice(0, 2).map(p => p[0]?.toUpperCase() || "").join("") || "AG";
        setUser({ email: u.email || "", initials });
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

  return (
    <aside style={{
      width: 220, minWidth: 220, height: "100vh",
      background: "rgba(10,18,32,0.97)",
      borderRight: "1px solid rgba(255,255,255,0.08)",
      display: "flex", flexDirection: "column",
      padding: "24px 0", flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{ padding: "0 20px 28px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{
          width: 32, height: 32,
          background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
          borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Icon name="sparkle" size={16} color="#0d1b2e" strokeWidth={2} />
        </div>
        <span style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.3px", color: "#fdfcf9" }}>
          PackMetrics
        </span>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: "0 12px", display: "flex", flexDirection: "column", gap: 2 }}>
        {NAV.map(({ href, icon, label, pro }) => {
          const active = pathname === href || (href !== "/" && pathname.startsWith(href));
          const locked = GATED.includes(href) && !user;
          return (
            <Link
              key={href}
              href={locked ? "/login" : href}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 10,
                background: active ? `${SAND}22` : "transparent",
                color: active ? SAND : locked ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.55)",
                fontSize: 14, fontWeight: active ? 600 : 400,
                textDecoration: "none", transition: "all 0.15s",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Icon
                  name={icon}
                  size={16}
                  color={active ? SAND : locked ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.4)"}
                  strokeWidth={active ? 2.2 : 1.8}
                />
                {label}
              </div>
              {pro && (
                <span style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: "0.4px",
                  background: `${SAND}30`, color: SAND,
                  borderRadius: 4, padding: "2px 5px",
                }}>PRO</span>
              )}
              {locked && !pro && (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Auth section */}
      <div style={{ padding: "0 12px", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 14 }}>
        {user ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", marginBottom: 8 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: "linear-gradient(135deg, #4ecdc4, #2d7a4e)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, fontWeight: 700, color: "#fff",
              }}>{user.initials}</div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {user.email}
                </div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>Free Plan</div>
              </div>
            </div>
            <button onClick={handleLogout} style={{
              width: "100%", padding: "8px 10px", borderRadius: 8,
              background: "none", border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(255,255,255,0.35)", fontSize: 12, fontFamily: "inherit",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
            }}>
              <Icon name="logout" size={12} color="rgba(255,255,255,0.3)" /> Sign out
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
