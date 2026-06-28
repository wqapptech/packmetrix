"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import Icon from "./Icon";
import { useLang } from "@/hooks/useLang";
import { T } from "@/lib/translations";
import { FeatureRequestModal } from "./FeatureRequestModal";
import {
  DA_BG, DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2, DA_GOLD, DA_GOLD_SOFT,
} from "@/lib/tokens";

type IconName = Parameters<typeof Icon>[0]["name"];

type NavItem = {
  href: string;
  icon: IconName;
  labelKey: keyof typeof T["en"];
};

const NAV_MAIN: NavItem[] = [
  { href: "/dashboard", icon: "chart",       labelKey: "navDashboard" },
  { href: "/builder",   icon: "package",     labelKey: "navBuilder" },
  { href: "/homepage",  icon: "home",        labelKey: "navHomepage" },
  { href: "/packages",  icon: "archive",     labelKey: "navPackages" },
  { href: "/leads",     icon: "users",       labelKey: "navLeads" },
];

const NAV_SETTINGS: NavItem[] = [
  { href: "/profile",  icon: "globe",        labelKey: "navBranding" },
  { href: "/paywall",  icon: "credit_card",  labelKey: "navBilling" },
];

const SANS = `var(--font-sans)`;
const DISPLAY = `var(--font-display)`;

export default function Sidebar({
  isMobile = false,
  isOpen = true,
  onClose,
}: {
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const lang = useLang();
  const t = T[lang];
  const isAr = lang === "ar";

  const [user, setUser] = useState<{
    email: string;
    initials: string;
    uid: string;
    plan: string;
    agencyName: string;
  } | null>(null);
  const [logoutHovered, setLogoutHovered] = useState(false);
  const [featureReqHovered, setFeatureReqHovered] = useState(false);
  const [featureReqOpen, setFeatureReqOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        const snap = await getDoc(doc(db, "users", u.uid));
        const data = snap.data() || {};
        const agencyName = (data.name as string) || "";
        const plan = (data.plan as string) || "free";
        const source = agencyName || u.displayName || u.email || "";
        const parts = source.split(/[\s@]/);
        const initials =
          parts.slice(0, 2).map((p: string) => p[0]?.toUpperCase() || "").join("") || "AG";
        setUser({ email: u.email || "", initials, uid: u.uid, plan, agencyName });
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

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard" || pathname === "/home";
    return pathname === href || (href !== "/" && pathname.startsWith(href));
  };

  const planLabel = (plan: string) => {
    if (plan === "founding") return t.planFoundingMember;
    if (["standard", "paid", "pro", "start", "grow", "scale"].includes(plan)) return t.planSubscribed;
    return t.planFreeTrial;
  };

  const renderItem = (item: NavItem) => {
    const active = isActive(item.href);
    const label = t[item.labelKey] as string;
    return (
      <Link
        key={item.href}
        href={item.href}
        onClick={isMobile ? onClose : undefined}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 11,
          padding: "9px 11px",
          borderRadius: 8,
          background: active ? DA_INK1 : "transparent",
          color: active ? DA_BG : DA_INK1,
          fontFamily: SANS,
          fontSize: 13.5,
          fontWeight: active ? 500 : 400,
          textDecoration: "none",
          transition: "background 0.12s",
          cursor: "pointer",
        }}
      >
        <span style={{ display: "flex", flexShrink: 0 }}>
          <Icon
            name={item.icon}
            size={15}
            color={active ? DA_GOLD : DA_INK3}
            strokeWidth={active ? 2 : 1.8}
          />
        </span>
        <span style={{ flex: 1 }}>{label}</span>
      </Link>
    );
  };

  return (
    <aside
      dir={isAr ? "rtl" : "ltr"}
      style={{
        width: 240,
        minWidth: 240,
        height: "100vh",
        background: DA_SURFACE2,
        borderInlineEnd: `1px solid ${DA_RULE}`,
        display: "flex",
        flexDirection: "column",
        padding: "20px 0",
        flexShrink: 0,
        ...(isMobile
          ? {
              position: "fixed" as const,
              insetInlineStart: 0,
              top: 0,
              zIndex: 99,
              transform: isOpen
                ? "translateX(0)"
                : isAr
                ? "translateX(100%)"
                : "translateX(-100%)",
              transition: "transform 0.26s cubic-bezier(0.22, 1, 0.36, 1)",
              boxShadow: isOpen ? "4px 0 32px rgba(26,22,17,0.1)" : "none",
            }
          : {}),
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "0 16px 20px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 8,
            flexShrink: 0,
            background: DA_INK1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <img
            src="/logo.svg"
            alt=""
            style={{
              width: 18,
              height: 18,
              objectFit: "contain",
              filter:
                "brightness(0) saturate(100%) invert(72%) sepia(35%) saturate(600%) hue-rotate(5deg) brightness(95%)",
            }}
          />
        </div>
        <span
          style={{
            fontFamily: DISPLAY,
            fontSize: 19,
            fontWeight: 400,
            color: DA_INK1,
            letterSpacing: -0.3,
            flex: 1,
          }}
        >
          Packmetrix
        </span>
        {isMobile && (
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: DA_INK3,
              display: "flex",
            }}
          >
            <Icon name="x" size={18} color={DA_INK3} />
          </button>
        )}
      </div>

      {/* Main nav */}
      <nav
        style={{
          flex: 1,
          padding: "0 10px",
          display: "flex",
          flexDirection: "column",
          gap: 2,
          overflowY: "auto",
        }}
        onClick={isMobile ? onClose : undefined}
      >
        {NAV_MAIN.map(renderItem)}

        {/* Settings label */}
        <div
          style={{
            fontSize: 10.5,
            fontFamily: SANS,
            fontWeight: 600,
            letterSpacing: 1.2,
            textTransform: "uppercase",
            color: DA_INK3,
            padding: "18px 11px 7px",
          }}
        >
          {t.sectionSettings}
        </div>

        {NAV_SETTINGS.map(renderItem)}
      </nav>

      {/* User footer */}
      <div
        style={{
          padding: "12px 10px 0",
          borderTop: `1px solid ${DA_RULE}`,
        }}
      >
        {user ? (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: 10,
                borderRadius: 10,
                background: DA_SURFACE,
                border: `1px solid ${DA_RULE}`,
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",
                  flexShrink: 0,
                  background: DA_INK1,
                  color: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontFamily: SANS,
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                {user.initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 12.5,
                    fontWeight: 500,
                    color: DA_INK1,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {user.agencyName || user.email}
                </div>
                <div
                  style={{
                    fontFamily: SANS,
                    fontSize: 10.5,
                    color: DA_INK3,
                  }}
                >
                  {planLabel(user.plan)}
                </div>
              </div>
            </div>
            <button
              onClick={() => setFeatureReqOpen(true)}
              onMouseEnter={() => setFeatureReqHovered(true)}
              onMouseLeave={() => setFeatureReqHovered(false)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                background: featureReqHovered ? DA_SURFACE : "none",
                border: `1px solid ${featureReqHovered ? DA_RULE2 : "transparent"}`,
                color: DA_INK3,
                fontSize: 12,
                fontFamily: SANS,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.12s",
                marginBottom: 2,
              }}
            >
              <Icon name="sparkle" size={12} color={DA_INK3} />
              {t.featureReqMenuItem}
            </button>
            <button
              onClick={handleLogout}
              onMouseEnter={() => setLogoutHovered(true)}
              onMouseLeave={() => setLogoutHovered(false)}
              style={{
                width: "100%",
                padding: "8px 10px",
                borderRadius: 8,
                background: logoutHovered ? DA_SURFACE : "none",
                border: `1px solid ${logoutHovered ? DA_RULE2 : "transparent"}`,
                color: DA_INK3,
                fontSize: 12,
                fontFamily: SANS,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
                transition: "all 0.12s",
              }}
            >
              <Icon name="logout" size={12} color={DA_INK3} />
              {t.signOut}
            </button>

            <FeatureRequestModal
              open={featureReqOpen}
              onClose={() => setFeatureReqOpen(false)}
              prefillEmail={user.email}
            />
          </>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 6,
              padding: "4px 0",
            }}
          >
            <Link
              href="/signup"
              style={{
                display: "block",
                width: "100%",
                padding: "9px",
                textAlign: "center",
                background: DA_GOLD,
                borderRadius: 9,
                color: "#fff",
                fontSize: 12,
                fontWeight: 700,
                textDecoration: "none",
                fontFamily: SANS,
              }}
            >
              {t.signUpFree}
            </Link>
            <Link
              href="/login"
              style={{
                display: "block",
                width: "100%",
                padding: "8px",
                textAlign: "center",
                background: "none",
                border: `1px solid ${DA_RULE2}`,
                borderRadius: 9,
                color: DA_INK2,
                fontSize: 12,
                textDecoration: "none",
                fontFamily: SANS,
              }}
            >
              {t.logIn}
            </Link>
          </div>
        )}
      </div>
    </aside>
  );
}
