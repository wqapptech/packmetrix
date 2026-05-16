"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

const NAVY = "#0d1b2e";
const SAND = "#e8c97b";
const BORDER = "rgba(255,255,255,0.08)";

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
      <div style={{ minHeight: "100vh", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span className="spinner" />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: NAVY, color: "#fdfcf9", fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Header */}
      <div style={{ height: 52, borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 24px", background: "rgba(255,255,255,0.02)", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: `linear-gradient(135deg, ${SAND}, #c4a84f)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: 14, fontWeight: 900, color: NAVY }}>P</span>
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#fdfcf9" }}>PackMetrix</span>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "2px 7px", borderRadius: 5, background: "rgba(232,201,123,0.12)", border: `1px solid rgba(232,201,123,0.25)`, color: SAND }}>Admin</span>
        </div>
        {email && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{email}</span>
            <button
              onClick={handleSignOut}
              style={{ fontSize: 11.5, fontWeight: 600, padding: "5px 12px", borderRadius: 7, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.5)", cursor: "pointer", fontFamily: "inherit" }}
            >
              Sign out
            </button>
          </div>
        )}
      </div>

      {/* Page content */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px" }}>
        {children}
      </div>
    </div>
  );
}
