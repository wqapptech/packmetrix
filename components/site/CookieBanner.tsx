"use client";

// GDPR cookie consent banner — bottom-anchored, brand-styled, EN+AR/RTL.
// States: default (Accept all / Reject non-essential / Manage) and manage
// (Essential locked + Preferences/Analytics/Marketing toggles). Persists the
// choice to a cookie + localStorage so it never re-prompts. Ported from the
// locked Cookie Banner design; the fixed green maps to brand vars.

import { useEffect, useState } from "react";
import type { AgencyBrand } from "@/lib/brand";
import { useIsDesktop } from "./useIsDesktop";

const STORAGE_KEY = "pm_cookie_consent";

type Consent = { essential: true; preferences: boolean; analytics: boolean; marketing: boolean; ts: number };

const STR = {
  en: {
    title: "We value your privacy",
    body: "We use cookies to run the site, remember your language, and understand how it's used. Choose which to allow.",
    cookieLink: "Cookie Policy", privacyLink: "Privacy Policy",
    accept: "Accept all", reject: "Reject non-essential", manage: "Manage", save: "Save choices",
    manageTitle: "Manage cookies",
    cats: {
      essential: ["Essential", "Required for the site to work — always on"],
      preferences: ["Preferences", "Remember your language and choices"],
      analytics: ["Analytics", "Help us understand how the site is used"],
      marketing: ["Marketing", "Personalized offers — only with your consent"],
    },
  },
  ar: {
    title: "نحترم خصوصيتك",
    body: "نستخدم ملفات الارتباط لتشغيل الموقع وتذكّر لغتك وفهم طريقة استخدامه. اختر ما تسمح به.",
    cookieLink: "سياسة ملفات الارتباط", privacyLink: "سياسة الخصوصية",
    accept: "قبول الكل", reject: "رفض غير الأساسي", manage: "إدارة", save: "حفظ الخيارات",
    manageTitle: "إدارة ملفات الارتباط",
    cats: {
      essential: ["أساسية", "مطلوبة لعمل الموقع — مفعّلة دائماً"],
      preferences: ["تفضيلات", "تذكّر لغتك وخياراتك"],
      analytics: ["تحليلات", "تساعدنا على فهم استخدام الموقع"],
      marketing: ["تسويقية", "عروض مخصّصة — بموافقتك فقط"],
    },
  },
} as const;

function persist(c: Omit<Consent, "ts">) {
  const value: Consent = { ...c, ts: Date.now() };
  try {
    const json = JSON.stringify(value);
    localStorage.setItem(STORAGE_KEY, json);
    document.cookie = `${STORAGE_KEY}=${encodeURIComponent(json)};path=/;max-age=${60 * 60 * 24 * 365};SameSite=Lax`;
  } catch {
    /* storage blocked — banner will re-show, which is acceptable */
  }
}

function hasConsent(): boolean {
  try {
    if (localStorage.getItem(STORAGE_KEY)) return true;
  } catch { /* ignore */ }
  return document.cookie.split("; ").some((c) => c.startsWith(`${STORAGE_KEY}=`));
}

export default function CookieBanner({
  brand,
  lang,
  cookieHref,
  privacyHref,
}: {
  brand: AgencyBrand;
  lang: "en" | "ar";
  cookieHref?: string;
  privacyHref?: string;
}) {
  const desktop = useIsDesktop();
  const m = !desktop;
  const ar = lang === "ar";
  const L = STR[lang];

  const [visible, setVisible] = useState(false);
  const [manage, setManage] = useState(false);
  const [prefs, setPrefs] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!hasConsent()) setVisible(true);
  }, []);

  if (!visible) return null;

  const close = () => setVisible(false);
  const acceptAll = () => { persist({ essential: true, preferences: true, analytics: true, marketing: true }); close(); };
  const rejectNonEssential = () => { persist({ essential: true, preferences: false, analytics: false, marketing: false }); close(); };
  const saveChoices = () => { persist({ essential: true, preferences: prefs, analytics, marketing }); close(); };

  const btnW = m ? "100%" : "auto";
  const ghostBtn: React.CSSProperties = { fontSize: 14, fontWeight: 600, padding: "12px 18px", borderRadius: 11, cursor: "pointer", background: "transparent", color: "#3a342b", border: "1px solid #e0d6c2", width: btnW, fontFamily: "inherit" };
  const brandBtn: React.CSSProperties = { fontSize: 14, fontWeight: 600, padding: "12px 20px", borderRadius: 11, cursor: "pointer", background: "var(--brand)", color: "var(--brand-on)", border: "1px solid var(--brand)", width: btnW, whiteSpace: "nowrap", fontFamily: "inherit" };

  const Toggle = ({ on, locked, onToggle }: { on: boolean; locked?: boolean; onToggle?: () => void }) => (
    <div
      onClick={locked ? undefined : onToggle}
      role="switch"
      aria-checked={on}
      style={{ width: 44, height: 25, borderRadius: 999, background: on ? "var(--brand)" : "#d8ccb2", display: "flex", alignItems: "center", justifyContent: on ? "flex-end" : "flex-start", padding: 3, flex: "0 0 auto", cursor: locked ? "default" : "pointer", transition: "background .15s" }}
    >
      <span style={{ width: 19, height: 19, borderRadius: "50%", background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.25)" }} />
    </div>
  );

  const cats: { key: string; label: string; desc: string; on: boolean; locked?: boolean; onToggle?: () => void }[] = [
    { key: "essential", label: L.cats.essential[0], desc: L.cats.essential[1], on: true, locked: true },
    { key: "preferences", label: L.cats.preferences[0], desc: L.cats.preferences[1], on: prefs, onToggle: () => setPrefs((v) => !v) },
    { key: "analytics", label: L.cats.analytics[0], desc: L.cats.analytics[1], on: analytics, onToggle: () => setAnalytics((v) => !v) },
    { key: "marketing", label: L.cats.marketing[0], desc: L.cats.marketing[1], on: marketing, onToggle: () => setMarketing((v) => !v) },
  ];

  return (
    <div dir={ar ? "rtl" : "ltr"} style={{ position: "fixed", insetInline: 0, bottom: 0, zIndex: 60, padding: m ? 12 : 16, fontFamily: brand.bodyFont }}>
      <div style={{ background: "#fffdf7", border: "1px solid #e7ddc8", borderRadius: 16, boxShadow: "0 -1px 0 rgba(0,0,0,0.02), 0 18px 50px -16px rgba(26,22,17,0.4)", padding: m ? "22px 20px" : "24px 28px", maxWidth: 1180, margin: "0 auto" }}>
        {!manage ? (
          <div style={{ display: "flex", alignItems: m ? "stretch" : "center", gap: m ? 18 : 28, flexDirection: m ? "column" : "row" }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 14, flex: 1, minWidth: 0 }}>
              <div style={{ width: 42, height: 42, borderRadius: 11, background: "var(--brand-tint)", color: "var(--brand-text)", display: "grid", placeItems: "center", flex: "0 0 auto" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="M12 3a9 9 0 1 0 9 9 3 3 0 0 1-3-3 3 3 0 0 1-3-3 3 3 0 0 1-3-3z" strokeLinejoin="round" /><circle cx="9" cy="11" r="1" fill="currentColor" stroke="none" /><circle cx="13" cy="15" r="1" fill="currentColor" stroke="none" /><circle cx="15.5" cy="10.5" r="1" fill="currentColor" stroke="none" /></svg>
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: brand.displayFont, fontSize: 19, fontWeight: 600, letterSpacing: "-0.01em" }}>{L.title}</div>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: "#5e564a", margin: "5px 0 0", maxWidth: "64ch" }}>{L.body}</p>
                {(cookieHref || privacyHref) && (
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
                    {cookieHref && <a href={cookieHref} style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-text)", textDecoration: "underline", textUnderlineOffset: 2, whiteSpace: "nowrap" }}>{L.cookieLink}</a>}
                    {cookieHref && privacyHref && <span style={{ color: "#c9bd9f" }}>·</span>}
                    {privacyHref && <a href={privacyHref} style={{ fontSize: 13, fontWeight: 600, color: "var(--brand-text)", textDecoration: "underline", textUnderlineOffset: 2, whiteSpace: "nowrap" }}>{L.privacyLink}</a>}
                  </div>
                )}
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, flexDirection: m ? "column" : "row", flex: "0 0 auto", width: m ? "100%" : "auto" }}>
              <button onClick={() => setManage(true)} style={ghostBtn}>{L.manage}</button>
              <button onClick={rejectNonEssential} style={ghostBtn}>{L.reject}</button>
              <button onClick={acceptAll} style={brandBtn}>{L.accept}</button>
            </div>
          </div>
        ) : (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
              <div style={{ fontFamily: brand.displayFont, fontSize: 21, fontWeight: 600, letterSpacing: "-0.01em" }}>{L.manageTitle}</div>
              <button onClick={() => setManage(false)} aria-label="Close" style={{ width: 34, height: 34, borderRadius: 9, border: "1px solid #e0d6c2", background: "transparent", display: "grid", placeItems: "center", cursor: "pointer", flex: "0 0 auto" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3a342b" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 2, marginTop: 18 }}>
              {cats.map((c) => (
                <div key={c.key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 18, padding: "15px 0", borderTop: "1px solid #ece4d3" }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14.5, fontWeight: 600, color: "#2a2620" }}>{c.label}</div>
                    <div style={{ fontSize: 13, lineHeight: 1.45, color: "#978d7c", marginTop: 2 }}>{c.desc}</div>
                  </div>
                  <Toggle on={c.on} locked={c.locked} onToggle={c.onToggle} />
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, flexDirection: m ? "column" : "row", marginTop: 22, justifyContent: "flex-end" }}>
              <button onClick={rejectNonEssential} style={ghostBtn}>{L.reject}</button>
              <button onClick={saveChoices} style={{ ...ghostBtn, color: "var(--brand-text)", border: "1px solid var(--brand-text)" }}>{L.save}</button>
              <button onClick={acceptAll} style={brandBtn}>{L.accept}</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
