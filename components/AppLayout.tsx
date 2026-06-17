"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import Icon from "./Icon";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useLang, switchLang } from "@/hooks/useLang";
import { T } from "@/lib/translations";

// Module-level guard — only sync once per UID per browser session so that
// navigating between pages (which remounts AppLayout) doesn't trigger
// redundant Firestore reads.
let langSyncedForUid: string | null = null;
import {
  DA_SURFACE2, DA_INK3,
  DA_RULE, DA_GOLD,
} from "@/lib/tokens";

type IconName = Parameters<typeof Icon>[0]["name"];

type MobileNavItem = {
  href: string;
  icon: IconName;
  labelKey: keyof typeof T["en"];
};

const MOBILE_NAV: MobileNavItem[] = [
  { href: "/dashboard", icon: "chart",   labelKey: "navDashboard" },
  { href: "/packages",  icon: "archive", labelKey: "navPackages" },
  { href: "/builder",   icon: "package", labelKey: "navBuilder" },
  { href: "/leads",     icon: "users",   labelKey: "navLeads" },
];

const SANS = `var(--font-sans)`;

function MobileBottomNav() {
  const pathname = usePathname();
  const lang = useLang();
  const t = T[lang];

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/home";
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  return (
    <nav style={{
      position: "fixed",
      bottom: 0, left: 0, right: 0,
      zIndex: 90,
      background: DA_SURFACE2,
      borderTop: `1px solid ${DA_RULE}`,
      display: "flex",
      alignItems: "stretch",
      paddingBottom: "env(safe-area-inset-bottom, 0px)",
    }}>
      {MOBILE_NAV.map((item) => {
        const active = isActive(item.href);
        const label = t[item.labelKey] as string;
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              padding: "8px 4px 6px",
              textDecoration: "none",
              color: active ? DA_GOLD : DA_INK3,
              transition: "color 0.12s",
              minHeight: 52,
            }}
          >
            <Icon
              name={item.icon}
              size={20}
              color={active ? DA_GOLD : DA_INK3}
              strokeWidth={active ? 2 : 1.6}
            />
            <span style={{
              fontFamily: SANS,
              fontSize: 10,
              fontWeight: active ? 600 : 400,
              letterSpacing: 0.2,
              color: active ? DA_GOLD : DA_INK3,
              lineHeight: 1,
            }}>
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Props passed to a render-function topbar so it can wire up mobile controls */
export type TopbarRenderProps = { isMobile: boolean; onMenuClick: () => void };

export default function AppLayout({
  children,
  topbar,
}: {
  children: React.ReactNode;
  /**
   * Custom top bar. Can be:
   *  - A ReactNode (static)
   *  - A render function `(props: TopbarRenderProps) => ReactNode` — use this
   *    when your custom bar needs the hamburger handler or isMobile flag.
   */
  topbar?: React.ReactNode | ((props: TopbarRenderProps) => React.ReactNode);
}) {
  const isMobile = useIsMobile();
  const lang = useLang();
  const dir = lang === "ar" ? "rtl" : "ltr";
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // On first login (per browser session), read the user's saved lang from
  // Firestore and apply it.  This makes the preference survive logout/login
  // and work across devices.
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user || langSyncedForUid === user.uid) return;
      langSyncedForUid = user.uid;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const saved = snap.data()?.lang as "en" | "ar" | undefined;
        if (saved === "en" || saved === "ar") {
          switchLang(saved);
        }
      } catch {
        // ignore — localStorage value stays as fallback
      }
    });
    return () => unsub();
  }, []);

  const handleMenuClick = () => setSidebarOpen(o => !o);

  // Resolve topbar: call it if it's a render function, otherwise use as-is
  const resolvedTopbar = typeof topbar === "function"
    ? topbar({ isMobile, onMenuClick: handleMenuClick })
    : topbar;

  // Bottom nav height for mobile content padding
  const BOTTOM_NAV_HEIGHT = 60;

  return (
    <div dir={dir} style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--da-bg)" }}>
      {/* Sidebar — persistent on desktop, overlay on mobile */}
      {!isMobile && (
        <Sidebar isMobile={false} isOpen={true} onClose={() => {}} />
      )}

      {/* Mobile sidebar overlay */}
      {isMobile && sidebarOpen && (
        <>
          <div
            onClick={() => setSidebarOpen(false)}
            style={{
              position: "fixed", inset: 0,
              background: "rgba(0,0,0,0.65)",
              zIndex: 98,
              touchAction: "none",
            }}
          />
          <Sidebar
            isMobile={true}
            isOpen={true}
            onClose={() => setSidebarOpen(false)}
          />
        </>
      )}

      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", minWidth: 0 }}>
        {resolvedTopbar ?? (
          <Topbar isMobile={isMobile} onMenuClick={handleMenuClick} />
        )}
        <div style={{
          flex: 1,
          overflow: "auto",
          paddingBottom: isMobile ? BOTTOM_NAV_HEIGHT : 0,
        }}>
          {children}
        </div>
      </div>

      {/* Mobile bottom navigation */}
      {isMobile && <MobileBottomNav />}
    </div>
  );
}
