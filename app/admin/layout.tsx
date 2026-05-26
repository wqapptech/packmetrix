"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  DA_BG, DA_SURFACE, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_GOLD, DA_GOLD_DEEP, DA_GOLD_SOFT,
} from "@/lib/tokens";

const SANS = `var(--font-inter-tight), system-ui, sans-serif`;
const DISPLAY = `var(--font-instrument-serif), Georgia, serif`;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user && !isLoginPage) {
        router.replace("/admin/login");
      } else {
        setEmail(user?.email ?? null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, [router, isLoginPage]);

  const handleSignOut = async () => {
    await signOut(auth);
    router.replace("/admin/login");
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: DA_BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: DA_BG, color: DA_INK1, fontFamily: SANS }}>
      {/* Header */}
      <div style={{ height: 54, borderBottom: `1px solid ${DA_RULE}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 28px", background: DA_SURFACE, position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: `linear-gradient(135deg, ${DA_GOLD}, ${DA_GOLD_DEEP})`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: "#fff", fontFamily: DISPLAY }}>P</span>
          </div>
          <span style={{ fontSize: 14, fontWeight: 700, color: DA_INK1, letterSpacing: -0.2, fontFamily: SANS }}>PackMetrix</span>
          <span style={{ fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 6, background: DA_GOLD_SOFT, border: `1px solid rgba(176,138,62,0.25)`, color: DA_GOLD_DEEP, letterSpacing: 0.5, textTransform: "uppercase" as const }}>Admin</span>
        </div>
        {email && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: DA_INK3 }}>{email}</span>
            <button
              onClick={handleSignOut}
              style={{ fontSize: 12, fontWeight: 600, padding: "6px 14px", borderRadius: 8, background: "transparent", border: `1px solid ${DA_RULE}`, color: DA_INK2, cursor: "pointer", fontFamily: SANS }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 1240, margin: "0 auto", padding: "32px 28px" }}>
        {children}
      </div>
    </div>
  );
}
