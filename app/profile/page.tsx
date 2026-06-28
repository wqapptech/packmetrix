"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";
import Icon from "@/components/Icon";
import { useLang } from "@/hooks/useLang";
import { useIsMobile } from "@/hooks/useIsMobile";
import { T } from "@/lib/translations";
import { canUseCustomDomain } from "@/lib/limits";
import { toSlug } from "@/lib/trial";
import { DA_BG, DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3, DA_RULE, DA_RULE2, DA_GOLD, DA_GOLD_DEEP, DA_GOLD_SOFT, DA_GREEN, DA_GREEN_SOFT, DA_DANGER, DA_DANGER_SOFT } from "@/lib/tokens";
import { ConfirmModal } from "@/components/ConfirmModal";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import {
  type AgencyBrand, type FontPairingId,
  DEFAULT_BRAND_COLOR, FONT_PAIRINGS, BRAND_SWATCHES, ACCENT_SWATCHES,
  brandDocPatch, brandReadable, accentReadable, ratioBand, deriveBrand, fontsForPairing, toFontPairing,
} from "@/lib/brand";

const DISPLAY = `var(--font-display)`;
const SANS = `var(--font-sans)`;

type DomainRecord = { type: string; name: string; value: string };
type DomainStatus = "pending_dns" | "verifying" | "ssl_provisioning" | "active" | "failed" | "";

function isApexDomain(hostname: string): boolean {
  return hostname.split(".").length === 2;
}


// ─── Shared field components ─────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: DA_INK3, textTransform: "uppercase" as const, letterSpacing: ".5px", marginBottom: 8, marginTop: 18 }}>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, style, "data-testid": testId }: { value: string; onChange: (v: string) => void; placeholder?: string; style?: React.CSSProperties; "data-testid"?: string }) {
  return (
    <input
      data-testid={testId}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", background: DA_SURFACE, border: `1px solid ${DA_RULE}`,
        borderRadius: 10, padding: "10px 14px", color: DA_INK1, fontSize: 13,
        fontFamily: SANS, outline: "none", transition: "border-color .15s", ...style,
      }}
      onFocus={e => (e.target.style.borderColor = DA_GOLD)}
      onBlur={e => (e.target.style.borderColor = DA_RULE)}
    />
  );
}

// ─── Colour control: native picker doubles as preview + curated swatches + a
// persistent WCAG contrast readout. Hex input is the escape hatch. ────────────

function ColorField({
  lang, label, role, value, onChange, swatches, brandFallback, hint, children,
}: {
  lang: "en" | "ar";
  label: string;
  role: "brand" | "accent";
  value: string;
  onChange: (v: string) => void;
  swatches: readonly string[];
  brandFallback: string;
  hint?: string;
  children?: React.ReactNode;
}) {
  const isAr = lang === "ar";
  const isBrand = role === "brand";
  const effective = value || (isBrand ? DEFAULT_BRAND_COLOR : brandFallback);
  const br = brandReadable(effective);
  const ac = accentReadable(effective);
  const ratio = isBrand ? br.ratio : ac.ratio;
  const band = ratioBand(ratio);
  const warn = isBrand ? br.on !== "#ffffff" : !band.ok;
  return (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
        <input
          type="color"
          value={effective}
          onChange={e => onChange(e.target.value)}
          style={{ width: 46, height: 46, borderRadius: 10, border: `1px solid ${DA_RULE}`, cursor: "pointer", padding: 2, background: "transparent", flexShrink: 0 }}
        />
        <Input
          value={value}
          onChange={v => { if (/^#?[0-9a-fA-F]{0,6}$/.test(v)) onChange(v.startsWith("#") || v === "" ? v : "#" + v); }}
          placeholder={isBrand ? DEFAULT_BRAND_COLOR : (isAr ? "افتراضي: لون الهوية" : "Defaults to brand colour")}
          style={{ fontFamily: "monospace", maxWidth: 150 }}
        />
        <div style={{ display: "flex", gap: 6 }}>
          {swatches.map((s) => {
            const sel = s.toLowerCase() === (value || "").toLowerCase();
            return (
              <button
                key={s}
                onClick={() => onChange(s)}
                title={s}
                style={{
                  width: 24, height: 24, borderRadius: 7, background: s, cursor: "pointer", padding: 0,
                  border: "none",
                  boxShadow: sel ? `0 0 0 2px ${DA_BG}, 0 0 0 4px ${DA_INK1}` : "inset 0 0 0 1px rgba(0,0,0,.12)",
                }}
              />
            );
          })}
        </div>
        {children}
      </div>
      {hint && <div style={{ fontSize: 11, color: DA_INK3, marginTop: 6 }}>{hint}</div>}

      {/* Persistent contrast readout */}
      <div style={{
        marginTop: 12, padding: "10px 12px", borderRadius: 9,
        background: warn ? DA_DANGER_SOFT : DA_BG,
        border: `1px solid ${warn ? DA_DANGER : DA_RULE}`,
        display: "flex", alignItems: "center", gap: 10,
      }}>
        {isBrand ? (
          <div style={{ minWidth: 64, height: 32, borderRadius: 7, background: effective, color: br.on, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontSize: 12.5, fontWeight: 700, flexShrink: 0 }}>
            {isAr ? "زر" : "Button"}
          </div>
        ) : (
          <div style={{ minWidth: 64, height: 32, borderRadius: 7, background: "#faf5e8", color: ac.text, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: SANS, fontSize: 12.5, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", flexShrink: 0 }}>
            {isAr ? "نص" : "Aa"}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 500, color: warn ? DA_DANGER : DA_INK1 }}>{ratio.toFixed(1)}:1</span>
            <span style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: ".4px", padding: "1px 7px", borderRadius: 999, background: band.ok ? DA_GREEN_SOFT : DA_DANGER_SOFT, color: band.ok ? DA_GREEN : DA_DANGER }}>
              {isAr ? band.labelAr : band.label}
            </span>
          </div>
          <div style={{ fontFamily: SANS, fontSize: 11.5, color: warn ? DA_DANGER : DA_INK3, marginTop: 2, lineHeight: 1.35 }}>
            {isBrand
              ? (warn
                  ? (isAr ? "النص الأبيض غير واضح — سنستخدم نصاً داكناً على الأزرار." : "White text is hard to read here — we’ll use dark text on buttons.")
                  : (isAr ? "نص أبيض واضح على لون علامتك." : "White text reads clearly on your brand colour."))
              : (isAr ? "يُعتَّم تلقائياً ليبقى واضحاً كنص على الورق الكريمي." : "Auto-darkened so it stays legible as text on cream paper.")}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Social link glyphs + row ────────────────────────────────────────────────

const SOCIAL_GLYPH: Record<string, (s: number) => React.ReactNode> = {
  whatsapp: (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M.057 24l1.687-6.163a11.867 11.867 0 0 1-1.587-5.946C.16 5.335 5.495 0 12.05 0a11.817 11.817 0 0 1 8.413 3.488 11.824 11.824 0 0 1 3.48 8.414c-.003 6.557-5.338 11.892-11.893 11.892a11.9 11.9 0 0 1-5.688-1.448L.057 24zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884a9.86 9.86 0 0 0 1.51 5.26l-.999 3.648 3.978-1.607zm5.83-7.062c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/></svg>,
  snapchat: (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.6c2.6 0 4.4 1.9 4.5 4.6 0 .6 0 1.3-.1 1.9.3.2.7.2 1 .1.6-.2 1.2.5.8 1.1-.3.5-1 .7-1.5.9-.3.1-.4.2-.3.6.3 1.2 1.6 2.4 2.9 2.7.5.1.5.7.1.9-.6.3-1.4.4-1.7.6-.1.2 0 .5-.2.7-.2.2-.7.1-1.2.1-.7 0-1.2.5-1.8 1-.7.5-1.4 1-2.7 1s-2-.5-2.7-1c-.6-.5-1.1-1-1.8-1-.5 0-1 .1-1.2-.1-.2-.2-.1-.5-.2-.7-.3-.2-1.1-.3-1.7-.6-.4-.2-.4-.8.1-.9 1.3-.3 2.6-1.5 2.9-2.7.1-.4 0-.5-.3-.6-.5-.2-1.2-.4-1.5-.9-.4-.6.2-1.3.8-1.1.3.1.7.1 1-.1-.1-.6-.1-1.3-.1-1.9C7.6 4.5 9.4 2.6 12 2.6Z"/></svg>,
  tiktok: (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M14 3c.3 2 1.6 3.5 3.6 3.8v2.4c-1.3 0-2.5-.4-3.6-1.1v5.7c0 2.9-2 5.2-5 5.2s-5-2.3-5-5.2 2.3-5.1 5.2-4.9v2.5c-1.5-.2-2.8.9-2.8 2.4 0 1.4 1 2.4 2.4 2.4s2.4-1 2.4-2.6V3H14Z"/></svg>,
  instagram: (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17" cy="7" r="1.1" fill="currentColor" stroke="none"/></svg>,
  facebook: (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M14 8.5V6.8c0-.7.2-1.1 1.2-1.1H17V2.8c-.4 0-1.4-.1-2.5-.1-2.6 0-4.2 1.5-4.2 4.3v1.5H7.6v3.1H10V21h3.4v-9.4h2.5l.4-3.1H14Z"/></svg>,
  youtube: (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M22 8.2c-.2-1.4-.8-2.2-2.3-2.4C17.9 5.5 12 5.5 12 5.5s-5.9 0-7.7.3C2.8 6 2.2 6.8 2 8.2 1.7 9.7 1.7 12 1.7 12s0 2.3.3 3.8c.2 1.4.8 2.2 2.3 2.4 1.8.3 7.7.3 7.7.3s5.9 0 7.7-.3c1.5-.2 2.1-1 2.3-2.4.3-1.5.3-3.8.3-3.8s0-2.3-.3-3.8ZM10 15V9l5.2 3L10 15Z"/></svg>,
  x: (s) => <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 3h3l-6.6 7.6L21.8 21h-6l-4.7-6.1L5.6 21h-3l7-8.1L2.6 3h6.1l4.3 5.7L17.5 3Zm-1 16h1.6L7.6 4.7H5.9L16.5 19Z"/></svg>,
};

function SocialRow({
  glyph, value, onChange, placeholder, readOnly,
}: {
  glyph: React.ReactNode;
  value: string;
  onChange?: (v: string) => void;
  placeholder?: string;
  readOnly?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
      <div style={{ width: 34, height: 34, borderRadius: 9, flexShrink: 0, background: DA_SURFACE2, border: `1px solid ${DA_RULE2}`, color: DA_INK1, display: "flex", alignItems: "center", justifyContent: "center" }}>{glyph}</div>
      <div style={{ flex: 1, opacity: value ? 1 : 0.62 }}>
        <Input value={value} onChange={onChange ?? (() => {})} placeholder={placeholder} style={{ direction: "ltr", ...(readOnly ? { background: DA_BG, color: DA_INK3, pointerEvents: "none" } : {}) }} />
      </div>
    </div>
  );
}


// ─── DNS setup modal ─────────────────────────────────────────────────────────

type DnsRecord2 = { purpose: string; type: string; name: string; value: string };

function DnsSetupModal({
  open, onClose, allRecords, apexGuidance, copiedKey, onCopy, lang, t,
}: {
  open: boolean;
  onClose: () => void;
  allRecords: DnsRecord2[];
  apexGuidance: string | null;
  copiedKey: string | null;
  onCopy: (key: string, value: string) => void;
  lang: string;
  t: typeof import("@/lib/translations").T.en;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 600,
        background: "rgba(26,22,17,0.52)",
        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, animation: "cmFadeIn .15s ease",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes cmFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes cmSlideUp { from { opacity:0; transform:translateY(12px) scale(.96) } to { opacity:1; transform:none } }
      `}</style>
      <div
        dir={lang === "ar" ? "rtl" : "ltr"}
        style={{
          position: "relative", width: "100%", maxWidth: 580,
          maxHeight: "88vh", overflowY: "auto",
          background: DA_SURFACE, borderRadius: 18,
          boxShadow: "0 24px 72px rgba(26,22,17,0.22), 0 4px 20px rgba(26,22,17,0.08)",
          border: `1px solid ${DA_RULE}`,
          animation: "cmSlideUp .22s cubic-bezier(.22,1,.36,1)",
          padding: "24px 26px 28px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: SANS, color: DA_INK1 }}>
            {lang === "ar" ? "تعليمات إعداد النطاق" : "Domain setup instructions"}
          </div>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 9, background: "transparent", border: `1px solid ${DA_RULE}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
          >
            <Icon name="x" size={13} color={DA_INK3} />
          </button>
        </div>

        {/* Apex domain note */}
        {apexGuidance && (
          <div style={{ marginBottom: 14, padding: "11px 14px", borderRadius: 9, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)", fontSize: 12, color: "#7a5c00", lineHeight: 1.6 }}>
            <strong>{lang === "ar" ? "ملاحظة النطاق الجذر: " : "Apex domain note: "}</strong>{apexGuidance}
          </div>
        )}

        {/* DNS records table */}
        {allRecords.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, fontFamily: SANS, color: DA_INK3, textTransform: "uppercase" as const, letterSpacing: ".5px", marginBottom: 8 }}>{t.customDomainRecordsTitle}</div>
            <div style={{ overflowX: "auto", borderRadius: 8, border: `1px solid ${DA_RULE}`, background: DA_SURFACE }}>
              <div style={{ minWidth: 480 }}>
                <div style={{ display: "grid", gridTemplateColumns: "90px 52px 1fr 1fr", background: DA_BG, padding: "6px 10px", gap: 8 }}>
                  {[lang === "ar" ? "الغرض" : "Purpose", t.customDomainRecordType, t.customDomainRecordName, t.customDomainRecordValue].map((h, i) => (
                    <div key={i} style={{ fontSize: 10, fontWeight: 700, fontFamily: SANS, color: DA_INK3, textTransform: "uppercase" as const, letterSpacing: ".5px" }}>{h}</div>
                  ))}
                </div>
                {allRecords.map((rec, idx) => (
                  <div key={`${rec.type}:${idx}`} style={{ display: "grid", gridTemplateColumns: "90px 52px 1fr 1fr", padding: "8px 10px", gap: 8, alignItems: "start", borderTop: `1px solid ${DA_RULE}`, background: idx % 2 === 0 ? "transparent" : DA_BG }}>
                    <div style={{ fontSize: 10, color: DA_INK3, paddingTop: 2, lineHeight: 1.4 }}>{rec.purpose}</div>
                    <div style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "#2563eb", paddingTop: 2 }}>{rec.type}</div>
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                      <div style={{ fontFamily: "monospace", fontSize: 11, color: DA_INK2, wordBreak: "break-all" as const }}>{rec.name}</div>
                      <button onClick={() => onCopy(`n:${idx}`, rec.name)} style={{ alignSelf: "flex-start", padding: "2px 7px", borderRadius: 5, background: copiedKey === `n:${idx}` ? DA_GREEN_SOFT : DA_SURFACE, border: `1px solid ${copiedKey === `n:${idx}` ? DA_GREEN : DA_RULE}`, color: copiedKey === `n:${idx}` ? DA_GREEN : DA_INK3, fontSize: 10, fontWeight: 600, fontFamily: SANS, cursor: "pointer", whiteSpace: "nowrap" as const, transition: "all .15s" }}>
                        {copiedKey === `n:${idx}` ? t.customDomainCopiedBtn : t.customDomainCopyBtn}
                      </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                      <div style={{ fontFamily: "monospace", fontSize: 10.5, color: DA_INK3, wordBreak: "break-all" as const }}>{rec.value}</div>
                      <button onClick={() => onCopy(`v:${idx}`, rec.value)} style={{ alignSelf: "flex-start", padding: "2px 7px", borderRadius: 5, background: copiedKey === `v:${idx}` ? DA_GREEN_SOFT : DA_SURFACE, border: `1px solid ${copiedKey === `v:${idx}` ? DA_GREEN : DA_RULE}`, color: copiedKey === `v:${idx}` ? DA_GREEN : DA_INK3, fontSize: 10, fontWeight: 600, fontFamily: SANS, cursor: "pointer", whiteSpace: "nowrap" as const, transition: "all .15s" }}>
                        {copiedKey === `v:${idx}` ? t.customDomainCopiedBtn : t.customDomainCopyBtn}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* How to add DNS records */}
        <div style={{ padding: "12px 14px", borderRadius: 9, background: DA_BG, border: `1px solid ${DA_RULE}` }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, fontFamily: SANS, color: DA_INK1, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="link" size={12} color={DA_INK3} />
            {t.customDomainDnsHowTo}
          </div>
          <ol style={{ margin: 0, paddingLeft: lang === "ar" ? 0 : 16, paddingRight: lang === "ar" ? 16 : 0, display: "flex", flexDirection: "column" as const, gap: 5 }}>
            {[t.customDomainDnsStep1, t.customDomainDnsStep2, t.customDomainDnsStep3, t.customDomainDnsStep4].map((step, i) => (
              <li key={i} style={{ fontSize: 11.5, color: DA_INK3, lineHeight: 1.55 }}>{step}</li>
            ))}
          </ol>
          <div style={{ marginTop: 10, fontSize: 11, color: DA_INK3 }}>{t.customDomainDnsNote}</div>
          <div style={{ marginTop: 10, borderTop: `1px solid ${DA_RULE}`, paddingTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, fontFamily: SANS, color: DA_INK2, marginBottom: 5 }}>{t.customDomainProviderTitle}</div>
            <ul style={{ margin: 0, paddingLeft: lang === "ar" ? 0 : 14, paddingRight: lang === "ar" ? 14 : 0, display: "flex", flexDirection: "column" as const, gap: 3 }}>
              {[t.customDomainProviderNamecheap, t.customDomainProviderCloudflare, t.customDomainProviderGodaddy, t.customDomainProviderGoogle].map((tip, i) => (
                <li key={i} style={{ fontSize: 11, color: DA_INK3, listStyle: "disc" }}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}


// ─── Profile tab bar (Brand · Account) ───────────────────────────────────────
// Splits Settings by PURPOSE per the design: Brand = identity & look,
// Account = domain & account. Sits full-bleed directly under the AppLayout chrome.

function ProfileTabBar({
  lang, isMobile, active, onChange, t,
}: {
  lang: "en" | "ar";
  isMobile: boolean;
  active: "brand" | "account";
  onChange: (tab: "brand" | "account") => void;
  t: typeof import("@/lib/translations").T.en;
}) {
  const tabs = [
    { id: "brand" as const, icon: "globe" as const, label: t.brandTabLabel, sub: t.brandTabSub },
    { id: "account" as const, icon: "settings" as const, label: t.accountTabLabel, sub: t.accountTabSub },
  ];
  return (
    <div style={{
      display: "flex", alignItems: "stretch", gap: 4,
      padding: isMobile ? "0 12px" : "0 32px", background: DA_SURFACE,
      borderBottom: `1px solid ${DA_RULE}`, flexShrink: 0,
    }}>
      {tabs.map((tab) => {
        const on = tab.id === active;
        return (
          <button
            key={tab.id}
            data-testid={`profile-tab-${tab.id}`}
            onClick={() => onChange(tab.id)}
            style={{
              display: "flex", alignItems: "center", gap: 9, cursor: "pointer",
              padding: "14px 14px 12px", background: "transparent", border: "none",
              borderBottom: `2px solid ${on ? DA_GOLD : "transparent"}`, marginBottom: -1,
              textAlign: lang === "ar" ? "right" : "left",
            }}
          >
            <div style={{
              width: 30, height: 30, borderRadius: 8, flexShrink: 0,
              background: on ? DA_GOLD_SOFT : DA_SURFACE2,
              border: `1px solid ${on ? "transparent" : DA_RULE2}`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name={tab.icon} size={15} color={on ? DA_GOLD_DEEP : DA_INK3} />
            </div>
            {isMobile ? (
              <div style={{ fontSize: 13.5, fontWeight: 600, fontFamily: SANS, color: on ? DA_INK1 : DA_INK2 }}>{tab.label}</div>
            ) : (
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, fontFamily: SANS, color: on ? DA_INK1 : DA_INK2, lineHeight: 1.1 }}>{tab.label}</div>
                <div style={{ fontSize: 11, fontFamily: SANS, color: DA_INK3, marginTop: 1 }}>{tab.sub}</div>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}


// ─── Main page ────────────────────────────────────────────────────────────────

export default function BrandingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lang = useLang();
  const isMobile = useIsMobile();
  const t = T[lang];

  const [uid, setUid] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"brand" | "account">("brand");

  // Root surface: "site" = homepage at root, "catalog" = package catalog at root.
  // Mirrors users/{uid}.siteMode (default "site"); persists immediately on change.
  const [siteMode, setSiteMode] = useState<"catalog" | "site">("site");
  const [siteModeSaved, setSiteModeSaved] = useState(false);

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const [brandColor, setBrandColor] = useState(DEFAULT_BRAND_COLOR);
  const [accentColor, setAccentColor] = useState("");
  const [fontPairing, setFontPairing] = useState<FontPairingId>("editorial");
  const [whatsapp, setWhatsapp] = useState("");

  // Social links (all optional)
  const [instagram, setInstagram] = useState("");
  const [snapchat, setSnapchat] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [facebook, setFacebook] = useState("");
  const [youtube, setYoutube] = useState("");
  const [x, setX] = useState("");

  // Which language the live preview renders in.
  const [previewLang, setPreviewLang] = useState<"en" | "ar">("en");

  // The preview renders the real desktop chrome at a virtual 1160px width and
  // scales it down to fit the editor column (faithful "what ships" view).
  const PREVIEW_VW = 1160;
  const previewFrameRef = useRef<HTMLDivElement>(null);
  const previewInnerRef = useRef<HTMLDivElement>(null);
  const [previewScale, setPreviewScale] = useState(0.45);
  const [previewH, setPreviewH] = useState(0);

  const savedState = useRef({
    name: "", tagline: "", email: "", phone: "", logoUrl: "",
    brandColor: DEFAULT_BRAND_COLOR,
    accentColor: "", fontPairing: "editorial" as FontPairingId,
    whatsapp: "",
    instagram: "", snapchat: "", tiktok: "", facebook: "", youtube: "", x: "",
  });
  const hasChanges = (
    name !== savedState.current.name ||
    tagline !== savedState.current.tagline ||
    email !== savedState.current.email ||
    phone !== savedState.current.phone ||
    logoUrl !== savedState.current.logoUrl ||
    brandColor !== savedState.current.brandColor ||
    accentColor !== savedState.current.accentColor ||
    fontPairing !== savedState.current.fontPairing ||
    whatsapp !== savedState.current.whatsapp ||
    instagram !== savedState.current.instagram ||
    snapchat !== savedState.current.snapchat ||
    tiktok !== savedState.current.tiktok ||
    facebook !== savedState.current.facebook ||
    youtube !== savedState.current.youtube ||
    x !== savedState.current.x
  );

  const [plan, setPlan] = useState<string>("");
  const [agencySlug, setAgencySlug] = useState<string>("");
  const [customDomain, setCustomDomain] = useState<string>("");
  const [domainInput, setDomainInput] = useState<string>("");
  const [domainSaving, setDomainSaving] = useState(false);
  const [domainSaved, setDomainSaved] = useState(false);
  const [domainRemoving, setDomainRemoving] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [domainStatus, setDomainStatus] = useState<DomainStatus>("");
  const [domainCfId, setDomainCfId] = useState<string>("");
  const [cnameRecord, setCnameRecord] = useState<DomainRecord | null>(null);
  const [verificationRecords, setVerificationRecords] = useState<DomainRecord[]>([]);
  const [sslRecords, setSslRecords] = useState<DomainRecord[]>([]);
  const [apexGuidance, setApexGuidance] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [dnsSetupOpen, setDnsSetupOpen] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUid(u.uid);
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) {
        const d = snap.data();
        const _name = d.name || "";
        const _tagline = d.tagline || "";
        const _email = d.email || "";
        const _phone = d.phone || "";
        const _logoUrl = d.logoUrl || "";
        const _brandColor = d.brandColor || DEFAULT_BRAND_COLOR;
        const _accentColor = d.accentColor || "";
        const _fontPairing = toFontPairing(d.fontPairing);
        const _whatsapp = d.whatsapp || "";
        const _soc = (d.socials || {}) as Record<string, string>;
        const _social = (k: string) => String((_soc[k] ?? d[k]) || "");
        const _instagram = _social("instagram");
        const _snapchat = _social("snapchat");
        const _tiktok = _social("tiktok");
        const _facebook = _social("facebook");
        const _youtube = _social("youtube");
        const _x = _social("x");
        setName(_name);
        setTagline(_tagline);
        setEmail(_email);
        setPhone(_phone);
        setLogoUrl(_logoUrl);
        setBrandColor(_brandColor);
        setAccentColor(_accentColor);
        setFontPairing(_fontPairing);
        setWhatsapp(_whatsapp);
        setInstagram(_instagram);
        setSnapchat(_snapchat);
        setTiktok(_tiktok);
        setFacebook(_facebook);
        setYoutube(_youtube);
        setX(_x);
        savedState.current = {
          name: _name, tagline: _tagline, email: _email, phone: _phone, logoUrl: _logoUrl,
          brandColor: _brandColor,
          accentColor: _accentColor, fontPairing: _fontPairing,
          whatsapp: _whatsapp,
          instagram: _instagram, snapchat: _snapchat, tiktok: _tiktok,
          facebook: _facebook, youtube: _youtube, x: _x,
        };
        setPlan(d.plan || "");
        setSiteMode(d.siteMode === "catalog" ? "catalog" : "site");
        const _slug = d.agencySlug ? d.agencySlug : toSlug(d.name || "");
        setAgencySlug(_slug);
        if (!d.agencySlug && _slug) {
          updateDoc(doc(db, "users", u.uid), { agencySlug: _slug }).catch(() => {});
        }
        const savedDomain = d.customDomain || "";
        setCustomDomain(savedDomain);
        setDomainInput(savedDomain);
        setDomainCfId(d.customDomainCfId || "");
        setDomainStatus(savedDomain ? (d.customDomainStatus || "") as DomainStatus : "");
        setVerificationRecords(d.customDomainVerificationRecords || []);
        setSslRecords(d.customDomainSslRecords || []);
        if (savedDomain && !isApexDomain(savedDomain)) {
          setCnameRecord({ type: "CNAME", name: savedDomain, value: "cname.packmetrix.com" });
        }
      }

      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("uid", uid);
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      setLogoUrl(json.urls[0]);
    } catch {
      setUploadError("Upload failed. Try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!uid) return;
    setSaving(true);
    // One canonical, typed brand write (name/tagline/logo/colours/fonts/contact/
    // socials). Storefront-language, reviews, about, and stats were retired from
    // this tab — about + stats are now authored in the homepage builder.
    await updateDoc(doc(db, "users", uid), {
      ...brandDocPatch({
        name, tagline, logoUrl, brandColor, accentColor, fontPairing,
        whatsapp, phone, email,
        socials: { instagram, snapchat, tiktok, facebook, youtube, x },
      }),
    });
    savedState.current = {
      name, tagline, email, phone, logoUrl,
      brandColor, accentColor, fontPairing, whatsapp,
      instagram, snapchat, tiktok, facebook, youtube, x,
    };
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  // Root surface is a single-field setting — persist it immediately on change
  // (the Account tab has no top-level Save button). Optimistic: update UI first.
  const handleSiteModeChange = async (mode: "catalog" | "site") => {
    if (mode === siteMode) return;
    setSiteMode(mode);
    if (!auth.currentUser) return;
    await updateDoc(doc(db, "users", auth.currentUser.uid), { siteMode: mode });
    setSiteModeSaved(true);
    setTimeout(() => setSiteModeSaved(false), 2500);
  };

  const handleSaveDomain = async () => {
    if (!auth.currentUser) return;
    setDomainSaving(true);
    setDomainError(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ hostname: domainInput }),
      });
      const json = await res.json();
      if (!res.ok) { setDomainError(json.error || t.customDomainError); return; }
      setCustomDomain(json.hostname);
      setDomainInput(json.hostname);
      setDomainCfId(json.cf_hostname_id);
      setDomainStatus(json.status as DomainStatus);
      setCnameRecord(json.cname_record ?? null);
      setVerificationRecords(json.verification_records ?? []);
      setSslRecords(json.ssl_records ?? []);
      setApexGuidance(json.apex_guidance ?? null);
      setDomainSaved(true);
      setTimeout(() => setDomainSaved(false), 2500);
    } catch {
      setDomainError(t.customDomainError);
    } finally {
      setDomainSaving(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!domainCfId || !auth.currentUser) return;
    setRefreshing(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/domains/${domainCfId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setDomainStatus(data.status as DomainStatus);
      setVerificationRecords(data.verification_records ?? []);
      setSslRecords(data.ssl_records ?? []);
      if (data.error_message) setDomainError(data.error_message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopyRecord = (name: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedKey(name);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const handleRemoveDomain = async () => {
    if (!domainCfId || !auth.currentUser) return;
    setDomainRemoving(true);
    setDomainError(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/domains/${domainCfId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const json = await res.json();
        setDomainError(json.error || t.customDomainRemoveError);
        return;
      }
      setCustomDomain(""); setDomainInput(""); setDomainCfId(""); setDomainStatus("");
      setCnameRecord(null); setVerificationRecords([]); setSslRecords([]); setApexGuidance(null);
    } catch {
      setDomainError(t.customDomainRemoveError);
    } finally {
      setDomainRemoving(false);
    }
  };

  const handleResetDomain = async () => {
    if (!auth.currentUser) return;
    setDomainRemoving(true);
    try {
      if (domainCfId) {
        const token = await auth.currentUser.getIdToken();
        await fetch(`/api/domains/${domainCfId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    } finally {
      setCustomDomain(""); setDomainInput(""); setDomainCfId(""); setDomainStatus("");
      setCnameRecord(null); setVerificationRecords([]); setSslRecords([]); setApexGuidance(null);
      setDomainError(null);
      setDomainRemoving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) return;
    if (deleteConfirmEmail.toLowerCase().trim() !== email.toLowerCase().trim()) {
      setDeleteError(lang === "ar" ? "البريد الإلكتروني غير مطابق." : "Email does not match.");
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/delete-account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const json = await res.json();
        setDeleteError(json.error || "Deletion failed. Please try again.");
        return;
      }
      await signOut(auth);
      router.push("/");
    } catch {
      setDeleteError("Deletion failed. Please try again or contact hello@packmetrix.com.");
    } finally {
      setDeleting(false);
    }
  };

  // Auto-refresh every 30 s while CF is verifying / provisioning SSL.
  useEffect(() => {
    const IN_PROGRESS: DomainStatus[] = ["pending_dns", "verifying", "ssl_provisioning"];
    if (!domainCfId || !IN_PROGRESS.includes(domainStatus as DomainStatus)) return;
    const id = setInterval(async () => {
      if (!auth.currentUser) return;
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/domains/${domainCfId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setDomainStatus(data.status as DomainStatus);
      setVerificationRecords(data.verification_records ?? []);
      setSslRecords(data.ssl_records ?? []);
      if (data.error_message) setDomainError(data.error_message);
    }, 30_000);
    return () => clearInterval(id);
  }, [domainStatus, domainCfId]);

  // Keep the scaled preview sized to its frame and content. Re-runs whenever the
  // preview can remount or its container can resize — notably the Brand/Account
  // tab switch (the frame is a fresh DOM node on return) and the mobile/desktop
  // slot swap. A zero-width frame (mid-layout) is ignored so we never collapse
  // the preview to scale 0.
  useEffect(() => {
    if (authLoading || activeTab !== "brand") return;
    const frame = previewFrameRef.current;
    const inner = previewInnerRef.current;
    if (!frame || !inner) return;
    const update = () => {
      const w = frame.clientWidth;
      if (!w) return;
      const s = w / PREVIEW_VW;
      setPreviewScale(s);
      setPreviewH(inner.scrollHeight * s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(frame);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [authLoading, activeTab, isMobile, lang]);

  // ── Live preview: build the REAL AgencyBrand from draft state ──────────────
  const previewFonts = fontsForPairing(fontPairing, previewLang);
  const previewBrand: AgencyBrand = {
    name: name || (previewLang === "ar" ? "وكالتك" : "Your Agency"),
    tagline: tagline || undefined,
    logoUrl: logoUrl || undefined,
    brandColor: brandColor || DEFAULT_BRAND_COLOR,
    accentColor: accentColor || undefined,
    displayFont: previewFonts.display,
    bodyFont: previewFonts.body,
    whatsapp: whatsapp || undefined,
    phone: phone || undefined,
    email: email || undefined,
    socials: {
      instagram: instagram || undefined, snapchat: snapchat || undefined,
      tiktok: tiktok || undefined, facebook: facebook || undefined,
      youtube: youtube || undefined, x: x || undefined,
    },
  };
  const previewVars = deriveBrand(brandColor || DEFAULT_BRAND_COLOR, accentColor || undefined);

  // The live brand preview — real SiteHeader/SiteFooter, scaled. Rendered in the
  // sticky right rail on desktop, stacked on mobile.
  const previewPanel = (
    <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14, padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, marginBottom: 14 }}>
        <div style={{ fontSize: 11.5, fontWeight: 600, fontFamily: SANS, color: DA_INK2, textTransform: "uppercase", letterSpacing: ".6px" }}>{t.livePreviewLabel}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, color: DA_INK3, fontFamily: SANS }}>{t.previewLangLabel}</span>
          <div style={{ display: "flex", gap: 4 }}>
            {(["en", "ar"] as const).map((l) => (
              <button
                key={l}
                onClick={() => setPreviewLang(l)}
                style={{
                  padding: "4px 10px", borderRadius: 7, fontSize: 11.5, fontWeight: 600, fontFamily: SANS,
                  cursor: "pointer", transition: "all .15s",
                  background: previewLang === l ? DA_GOLD : DA_SURFACE,
                  color: previewLang === l ? "#fff" : DA_INK2,
                  border: `1px solid ${previewLang === l ? DA_GOLD : DA_RULE}`,
                }}
              >
                {l === "en" ? "EN" : "ع"}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div
        ref={previewFrameRef}
        style={{
          borderRadius: 12, border: `1px solid ${DA_RULE}`, overflow: "hidden",
          background: "#f4f0e8", height: previewH || 360,
        }}
      >
        <div
          ref={previewInnerRef}
          dir={previewLang === "ar" ? "rtl" : "ltr"}
          style={{
            ...(previewVars as React.CSSProperties),
            ["--font-display" as string]: previewBrand.displayFont,
            ["--font-body" as string]: previewBrand.bodyFont,
            width: PREVIEW_VW,
            transform: `scale(${previewScale})`,
            transformOrigin: "top left",
            background: "#f4f0e8",
            fontFamily: previewBrand.bodyFont,
          }}
        >
          <SiteHeader brand={previewBrand} lang={previewLang} active="home" packagesHref="#" homeHref="#" />
          <div style={{ padding: "52px 56px 60px" }}>
            <div style={{ fontSize: 13, letterSpacing: ".18em", textTransform: "uppercase", color: "var(--brand-text)", fontWeight: 600 }}>
              {previewLang === "ar" ? "رحلات مختارة بعناية" : "Curated journeys"}
            </div>
            <div style={{ fontFamily: previewBrand.displayFont, fontSize: 60, lineHeight: 1.04, color: "#1a1611", margin: "16px 0 0", maxWidth: 820, fontWeight: previewLang === "ar" ? 700 : 400 }}>
              {previewLang === "ar" ? "رحلات مصمّمة بعناية، على هويتك أنت" : "Beautifully designed journeys, on your own brand"}
            </div>
            <p style={{ fontSize: 18, lineHeight: 1.65, color: "#5e564a", margin: "20px 0 0", maxWidth: 640 }}>
              {previewLang === "ar"
                ? "هكذا يرى عملاؤك صفحاتك العامة — الشعار واللون والخط كما اخترتها."
                : "This is how visitors see your public pages — your logo, colour and type, exactly as you set them."}
            </p>
            <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
              <span style={{ background: "var(--brand)", color: "var(--brand-on)", padding: "13px 24px", borderRadius: 10, fontWeight: 600, fontSize: 15 }}>
                {previewLang === "ar" ? "تصفّح الباقات" : "Browse packages"}
              </span>
              <span style={{ background: "transparent", color: "var(--brand-text)", border: "1.5px solid var(--brand)", padding: "13px 24px", borderRadius: 10, fontWeight: 600, fontSize: 15 }}>
                {previewLang === "ar" ? "تواصل معنا" : "Contact us"}
              </span>
            </div>
          </div>
          <SiteFooter brand={previewBrand} lang={previewLang} packagesHref="#" homeHref="#" />
        </div>
      </div>
    </div>
  );

  // ── Account-tab cards (root surface + custom domain + danger zone) ─────────
  // The full custom-domain state machine and the delete-account handlers are
  // preserved verbatim from the old single-scroll layout — only their HOME moved
  // from the Brand left column to the Account tab.

  // Root surface: what visitors see at the agency's root URL.
  const rootModeCard = (
    <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14, padding: "20px 22px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 4 }}>
        <div style={{ fontSize: 13, fontWeight: 600, fontFamily: SANS, color: DA_INK1 }}>
          {lang === "ar" ? "صفحة البداية" : "Landing page"}
        </div>
        {siteModeSaved && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 600, fontFamily: SANS, color: DA_GREEN }}>
            <Icon name="check" size={12} color={DA_GREEN} strokeWidth={2.5} />
            {lang === "ar" ? "تم الحفظ" : "Saved"}
          </span>
        )}
      </div>
      <div style={{ fontSize: 11.5, color: DA_INK3, marginBottom: 16, lineHeight: 1.5 }}>
        {lang === "ar"
          ? "اختر ما يراه الزوار عند فتح رابطك الرئيسي."
          : "Choose what visitors see when they open your root URL."}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
        {([
          {
            id: "site" as const, icon: "home" as const,
            title: lang === "ar" ? "الصفحة الرئيسية" : "Homepage",
            desc: lang === "ar"
              ? "صفحة هبوط كاملة بالأقسام؛ تظهر الباقات على ‎/packages."
              : "A full landing page with sections; your packages live at /packages.",
          },
          {
            id: "catalog" as const, icon: "package" as const,
            title: lang === "ar" ? "كتالوج الباقات" : "Package catalog",
            desc: lang === "ar"
              ? "شبكة المتجر مباشرةً على رابطك الرئيسي."
              : "Your storefront grid directly at your root URL.",
          },
        ]).map((opt) => {
          const on = siteMode === opt.id;
          return (
            <button
              key={opt.id}
              data-testid={`site-mode-${opt.id}`}
              onClick={() => handleSiteModeChange(opt.id)}
              dir={lang === "ar" ? "rtl" : "ltr"}
              style={{
                textAlign: lang === "ar" ? "right" : "left", cursor: "pointer",
                padding: "14px 16px", borderRadius: 11, background: on ? DA_GOLD_SOFT : DA_SURFACE,
                border: `1.5px solid ${on ? DA_GOLD : DA_RULE}`, transition: "all .15s",
                display: "flex", flexDirection: "column", gap: 6,
                boxShadow: on ? `0 0 0 3px rgba(176,138,62,.14)` : "none",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, fontFamily: SANS, fontWeight: 600, color: on ? DA_GOLD_DEEP : DA_INK1 }}>
                  <Icon name={opt.icon} size={14} color={on ? DA_GOLD_DEEP : DA_INK3} />
                  {opt.title}
                </span>
                {on && <Icon name="check" size={13} color={DA_GOLD} strokeWidth={3} />}
              </div>
              <div style={{ fontSize: 11.5, color: DA_INK2, lineHeight: 1.4 }}>{opt.desc}</div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const customDomainCard = (
    <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14, padding: "20px 22px" }}>
      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: SANS, color: DA_INK1, marginBottom: 4 }}>{t.customDomainSectionTitle}</div>
      <div style={{ fontSize: 11.5, color: DA_INK3, marginBottom: 14 }}>{t.customDomainSectionSub}</div>

      {!canUseCustomDomain(plan) ? (
        /* ── Upgrade gate ── */
        <div style={{ borderRadius: 10, background: DA_GOLD_SOFT, border: `1px solid ${DA_RULE2}`, padding: "16px 18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <Icon name="lock" size={14} color={DA_GOLD} />
            <div style={{ fontSize: 12.5, fontWeight: 700, fontFamily: SANS, color: DA_GOLD }}>{t.customDomainUpgradeTitle}</div>
          </div>
          <div style={{ fontSize: 11.5, color: DA_INK3, marginBottom: 14 }}>{t.customDomainUpgradeSub}</div>
          <a href="/paywall" style={{ display: "inline-block", padding: "8px 16px", borderRadius: 8, background: DA_GOLD, color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: SANS, textDecoration: "none" }}>
            {t.customDomainUpgradeBtn}
          </a>
        </div>
      ) : customDomain ? (() => {
        /* ── Domain registered — CF state-based UI ── */
        const allRecords: Array<{ purpose: string; type: string; name: string; value: string }> = [
          ...(cnameRecord ? [{ purpose: lang === "ar" ? "توجيه الزيارات" : "Route traffic", type: cnameRecord.type, name: cnameRecord.name, value: cnameRecord.value }] : []),
          ...verificationRecords.map(r => ({ purpose: lang === "ar" ? "التحقق من الملكية" : "Ownership verification", type: r.type, name: r.name, value: r.value })),
          ...sslRecords.map(r => ({ purpose: lang === "ar" ? "شهادة SSL" : "SSL certificate", type: r.type, name: r.name, value: r.value })),
        ];

        // ── Active ─────────────────────────────────────────────────
        if (domainStatus === "active") return (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: DA_GREEN_SOFT, border: `1px solid ${DA_GREEN}`, marginBottom: 12 }}>
              <Icon name="check" size={13} color={DA_GREEN} strokeWidth={2.5} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, fontFamily: SANS, color: DA_GREEN, textTransform: "uppercase" as const, letterSpacing: ".5px" }}>{t.customDomainStatusActive}</div>
                <div style={{ fontSize: 12, fontFamily: "monospace", color: DA_INK2, marginTop: 1 }}>{customDomain}</div>
              </div>
            </div>
            <div style={{ fontSize: 12, color: DA_INK3, marginBottom: 12 }}>{t.customDomainStatusActiveDesc}</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
              <a
                href={`https://${customDomain}`} target="_blank" rel="noopener noreferrer"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, background: DA_GOLD, color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: SANS, textDecoration: "none" }}
              >
                <Icon name="globe" size={13} color="#fff" /> {lang === "ar" ? "زيارة الموقع" : "Visit site"}
              </a>
              <button
                onClick={() => setConfirmRemoveOpen(true)} disabled={domainRemoving}
                style={{ padding: "8px 14px", borderRadius: 9, background: DA_DANGER_SOFT, border: "none", color: DA_DANGER, fontSize: 12, fontWeight: 600, fontFamily: SANS, cursor: domainRemoving ? "not-allowed" : "pointer" }}
              >
                {t.customDomainRemoveBtn}
              </button>
            </div>
            {domainError && <div style={{ fontSize: 11.5, color: DA_DANGER, marginTop: 8 }}>{domainError}</div>}
          </div>
        );

        // ── Failed ─────────────────────────────────────────────────
        if (domainStatus === "failed") return (
          <div>
            <div style={{ padding: "12px 14px", borderRadius: 10, background: DA_DANGER_SOFT, border: `1px solid ${DA_DANGER}`, marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: SANS, color: DA_DANGER, textTransform: "uppercase" as const, letterSpacing: ".5px", marginBottom: 4 }}>{t.customDomainStatusError}</div>
              <div style={{ fontSize: 12, fontFamily: "monospace", color: DA_INK2, marginBottom: 6 }}>{customDomain}</div>
              <div style={{ fontSize: 12, color: DA_INK3, lineHeight: 1.5 }}>
                {domainError || (lang === "ar"
                  ? "لم نتمكن من التحقق من نطاقك. تحقق من سجلات DNS وحاول مجدداً، أو تواصل معنا للمساعدة."
                  : "We couldn't complete domain verification. Check your DNS records and try again, or contact us for help."
                )}
              </div>
            </div>
            <div style={{ fontSize: 12, color: DA_INK3, marginBottom: 12, lineHeight: 1.6 }}>
              <strong>{lang === "ar" ? "تحقق من:" : "Check:"}</strong>{" "}
              {lang === "ar"
                ? "هل السجلات مُضافة بالضبط كما أُرسلت إليك؟ هل انقضت مدة التحقق (48 ساعة)؟ هل هناك تعارض في النطاق؟"
                : "Are the records added exactly as sent? Did verification time out (48h)? Is there a domain conflict?"}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setConfirmRemoveOpen(true)} disabled={domainRemoving}
                style={{ padding: "8px 14px", borderRadius: 9, background: DA_GOLD, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: SANS, cursor: domainRemoving ? "not-allowed" : "pointer" }}
              >
                {lang === "ar" ? "تجربة نطاق مختلف" : "Try a different domain"}
              </button>
              <a href="mailto:support@packmetrix.com" style={{ display: "inline-flex", alignItems: "center", padding: "8px 14px", borderRadius: 9, background: DA_SURFACE2, border: `1px solid ${DA_RULE}`, color: DA_INK2, fontSize: 12, fontWeight: 600, fontFamily: SANS, textDecoration: "none" }}>
                {lang === "ar" ? "تواصل معنا" : "Contact support"}
              </a>
            </div>
          </div>
        );

        // ── In-progress: pending_dns | verifying | ssl_provisioning ─
        const statusLabel =
          domainStatus === "pending_dns"      ? (lang === "ar" ? "في انتظار سجلات DNS"  : "Waiting for DNS records") :
          domainStatus === "ssl_provisioning" ? (lang === "ar" ? "جارٍ إعداد SSL"        : "Provisioning SSL certificate") :
          t.customDomainStatusVerifying;
        const statusDesc =
          domainStatus === "pending_dns"      ? (lang === "ar" ? "أضف سجلات DNS التالية عند مسجّل نطاقك لتفعيل نطاقك." : "Add the DNS records below at your domain registrar to activate your domain.") :
          domainStatus === "ssl_provisioning" ? (lang === "ar" ? "تم التحقق من سجلات DNS. نعمل الآن على إعداد شهادة SSL." : "DNS records verified. We're now provisioning your SSL certificate — this can take a few minutes.") :
          t.customDomainStatusVerifyingDesc;
        const statusColor =
          domainStatus === "ssl_provisioning" ? "#1d4ed8" :
          domainStatus === "verifying"        ? "#7c3aed" : "#b45309";
        const statusBg =
          domainStatus === "ssl_provisioning" ? "rgba(96,165,250,0.07)" :
          domainStatus === "verifying"        ? "rgba(167,139,250,0.07)" : "rgba(245,158,11,0.07)";
        const statusBorder =
          domainStatus === "ssl_provisioning" ? "rgba(96,165,250,0.25)" :
          domainStatus === "verifying"        ? "rgba(167,139,250,0.25)" : "rgba(245,158,11,0.25)";
        const spinnerColor =
          domainStatus === "ssl_provisioning" ? "#2563eb" :
          domainStatus === "verifying"        ? "#7c3aed" : "#f59e0b";

        return (
          <div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderRadius: 10, background: statusBg, border: `1px solid ${statusBorder}`, marginBottom: 12 }}>
              <span className="spinner-warm" style={{ width: 10, height: 10, borderTopColor: spinnerColor, flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, fontFamily: SANS, color: statusColor, textTransform: "uppercase" as const, letterSpacing: ".5px", marginBottom: 3 }}>{statusLabel}</div>
                <div style={{ fontSize: 12, fontFamily: "monospace", color: DA_INK3, wordBreak: "break-all" as const }}>{customDomain}</div>
              </div>
              <div style={{ fontSize: 10, color: DA_INK3, flexShrink: 0 }}>
                {lang === "ar" ? "تحديث تلقائي كل 30 ث" : "Auto-refreshing every 30s"}
              </div>
            </div>

            <div style={{ fontSize: 12, color: DA_INK3, lineHeight: 1.65, marginBottom: 12 }}>{statusDesc}</div>

            <button
              onClick={() => setDnsSetupOpen(true)}
              style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, background: DA_BG, border: `1px solid ${DA_RULE}`, color: DA_GOLD_DEEP, fontSize: 12, fontWeight: 600, fontFamily: SANS, cursor: "pointer", marginBottom: 14, textDecoration: "none" }}
            >
              <Icon name="link" size={12} color={DA_GOLD_DEEP} />
              {lang === "ar" ? "عرض سجلات DNS والتعليمات" : "View DNS records & instructions"}
            </button>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handleRefreshStatus} disabled={refreshing}
                style={{ padding: "7px 12px", borderRadius: 8, background: DA_SURFACE, border: `1px solid ${DA_RULE}`, color: DA_INK2, fontSize: 11, fontWeight: 600, fontFamily: SANS, cursor: refreshing ? "not-allowed" : "pointer" }}
              >
                {refreshing ? t.customDomainRefreshingBtn : t.customDomainRefreshBtn}
              </button>
              <button
                onClick={() => setConfirmRemoveOpen(true)} disabled={domainRemoving}
                style={{ padding: "7px 12px", borderRadius: 8, background: DA_DANGER_SOFT, border: "none", color: DA_DANGER, fontSize: 11, fontWeight: 600, fontFamily: SANS, cursor: domainRemoving ? "not-allowed" : "pointer" }}
              >
                {t.customDomainRemoveBtn}
              </button>
            </div>
            {domainError && <div style={{ fontSize: 11.5, color: DA_DANGER, marginTop: 8 }}>{domainError}</div>}
          </div>
        );
      })() : (
        /* ── No domain yet ── */
        <div>
          {agencySlug && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 10.5, fontWeight: 600, fontFamily: SANS, color: DA_INK3, textTransform: "uppercase" as const, letterSpacing: ".5px", marginBottom: 5 }}>
                {t.customDomainCurrentUrl}
              </div>
              <div style={{ fontSize: 12, color: DA_INK2, fontFamily: "monospace", background: DA_BG, border: `1px solid ${DA_RULE}`, borderRadius: 7, padding: "6px 10px" }}>
                packmetrix.com/{encodeURIComponent(agencySlug)}
              </div>
            </div>
          )}
          <FieldLabel>{t.customDomainLabel}</FieldLabel>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={domainInput}
              onChange={e => { setDomainInput(e.target.value); setDomainError(null); }}
              placeholder={t.customDomainPlaceholder}
              style={{ flex: 1, background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 10, padding: "10px 14px", color: DA_INK1, fontSize: 13, fontFamily: "monospace", outline: "none", transition: "border-color .15s" }}
              onFocus={e => (e.target.style.borderColor = DA_GOLD)}
              onBlur={e => (e.target.style.borderColor = DA_RULE)}
            />
            <button
              onClick={handleSaveDomain}
              disabled={domainSaving || !domainInput.trim()}
              style={{
                padding: "10px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 700, fontFamily: SANS,
                background: domainSaved ? DA_GREEN_SOFT : DA_GOLD,
                border: domainSaved ? `1px solid ${DA_GREEN}` : "none",
                color: domainSaved ? DA_GREEN : "#fff",
                cursor: (domainSaving || !domainInput.trim()) ? "not-allowed" : "pointer",
                opacity: !domainInput.trim() ? 0.5 : 1, flexShrink: 0, whiteSpace: "nowrap" as const,
              }}
            >
              {domainSaving ? t.customDomainSavingBtn : domainSaved ? <><Icon name="check" size={12} color={DA_GREEN} strokeWidth={2.5} /> {t.customDomainSavedBtn}</> : t.customDomainSaveBtn}
            </button>
          </div>
          <div style={{ fontSize: 11, color: DA_INK3, marginTop: 6 }}>{t.customDomainSubdomainHint}</div>
          {domainError && <div style={{ fontSize: 11.5, color: DA_DANGER, marginTop: 8 }}>{domainError}</div>}
          <div style={{ marginTop: 12, fontSize: 11.5, color: DA_INK3, lineHeight: 1.6 }}>
            {lang === "ar"
              ? "أدخل نطاقك ← احصل على سجلات DNS ← أضفها عند مسجّل النطاق ← يصبح نطاقك مباشراً."
              : "Submit your domain → get DNS records → add them at your registrar → go live."
            }
            {" "}
            <button
              onClick={() => setDnsSetupOpen(true)}
              style={{ background: "none", border: "none", padding: 0, color: DA_GOLD_DEEP, fontSize: 11.5, fontWeight: 600, fontFamily: SANS, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}
            >
              {lang === "ar" ? "تفاصيل الإعداد" : "Setup details"}
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const dangerZoneCard = (
    <div style={{ background: DA_SURFACE, border: `1px solid ${DA_DANGER}`, borderRadius: 14, padding: "20px 22px" }}>
      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: SANS, color: DA_DANGER, marginBottom: 4 }}>
        {lang === "ar" ? "منطقة الخطر" : "Danger zone"}
      </div>
      <div style={{ fontSize: 11.5, color: DA_INK3, marginBottom: 16, lineHeight: 1.5 }}>
        {lang === "ar"
          ? "حذف حسابك يزيل جميع الباقات والعملاء والبيانات نهائياً. هذا الإجراء لا يمكن التراجع عنه."
          : "Deleting your account permanently removes all packages, leads, and data. This cannot be undone."}
      </div>
      <button
        onClick={() => { setDeleteOpen(true); setDeleteConfirmEmail(""); setDeleteError(null); }}
        style={{
          padding: "8px 16px", borderRadius: 9,
          background: DA_DANGER_SOFT, border: `1px solid ${DA_DANGER}`,
          color: DA_DANGER, fontSize: 12.5, fontWeight: 600, fontFamily: SANS,
          cursor: "pointer",
        }}
      >
        {lang === "ar" ? "حذف حسابي" : "Delete my account"}
      </button>
    </div>
  );

  if (authLoading) {
    return (
      <AppLayout>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: DA_BG }}>
          <span className="spinner-warm" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/*
        Desktop: the outer div fills the AppLayout scroll area (height: 100%) and uses
        a flex-column layout so the grid below can grow to fill remaining space.
        Mobile: normal document flow with padding — no height constraint.
      */}
      <div
        dir={lang === "ar" ? "rtl" : "ltr"}
        style={isMobile ? {
          display: "flex", flexDirection: "column",
        } : {
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          boxSizing: "border-box",
        }}
      >
        {/* Tabs — Brand · Account (full-bleed under the app chrome) */}
        <ProfileTabBar lang={lang} isMobile={isMobile} active={activeTab} onChange={setActiveTab} t={t} />

        {/* Tab content */}
        <div style={isMobile ? {
          padding: "16px 16px 40px",
        } : {
          flex: 1, minHeight: 0, display: "flex", flexDirection: "column",
          overflow: "hidden", padding: "28px 32px 28px", boxSizing: "border-box",
          maxWidth: 1400,
        }}>
        {/* Page head — reflects the active tab */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: isMobile ? 24 : 20,
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, fontFamily: SANS, color: DA_GOLD, textTransform: "uppercase", letterSpacing: "1.2px" }}>{activeTab === "brand" ? t.brandingCrumb : t.accountCrumb}</div>
            <div style={{ fontSize: 34, fontWeight: 400, fontFamily: DISPLAY, color: DA_INK1, letterSpacing: "-0.8px", marginTop: 6, lineHeight: 1 }}>{activeTab === "brand" ? t.brandingTitle : t.accountTitle}</div>
            <div style={{ fontSize: 13, fontFamily: SANS, color: DA_INK3, marginTop: 8, maxWidth: 560, lineHeight: 1.5 }}>{activeTab === "brand" ? t.brandingSubtitle : t.accountSubtitle}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {activeTab === "brand" && (
              <button
                data-testid="profile-save"
                onClick={handleSave}
                disabled={saving || !hasChanges}
                style={{
                  padding: "9px 20px", borderRadius: 9, fontSize: 13, fontWeight: 700, fontFamily: SANS,
                  background: saved ? DA_GREEN_SOFT : DA_GOLD,
                  border: saved ? `1px solid ${DA_GREEN}` : "none",
                  color: saved ? DA_GREEN : "#fff",
                  cursor: (saving || !hasChanges) ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 8, transition: "all .2s",
                  opacity: hasChanges || saved ? 1 : 0.35,
                }}
              >
                {saving
                  ? <><span className="spinner-warm" style={{ width: 13, height: 13, borderTopColor: "#fff" }} /> {t.savingBtn}</>
                  : saved
                  ? <><Icon name="check" size={13} color={DA_GREEN} strokeWidth={2.5} /> {t.savedBtn}</>
                  : t.saveChangesBtn
                }
              </button>
            )}
          </div>
        </div>

        {activeTab === "account" ? (
          /* ── ACCOUNT tab — custom domain + danger zone only ── */
          <div style={isMobile ? {
            display: "flex", flexDirection: "column", gap: 16,
          } : {
            flex: 1, minHeight: 0, overflowY: "auto",
          }}>
            <div style={{ maxWidth: 760, display: "flex", flexDirection: "column", gap: 16 }}>
              {rootModeCard}
              {customDomainCard}
              {dangerZoneCard}
            </div>
          </div>
        ) : (
        <div style={isMobile ? {
          display: "flex", flexDirection: "column", gap: 16,
        } : {
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
        }}>
          {/* Mobile: preview on top so colour/font edits are visible immediately */}
          {isMobile && previewPanel}
          <div style={isMobile ? {
            display: "flex", flexDirection: "column", gap: 16, marginTop: 16,
          } : {
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.55fr) minmax(0, 1fr)",
            gap: 18,
            alignItems: "start",
          }}>
            {/* LEFT — config */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16, minWidth: 0 }}>

            {/* Agency identity */}
            <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: SANS, color: DA_INK1, marginBottom: 4 }}>{t.agencyProfileLabel}</div>
              <div style={{ fontSize: 11.5, color: DA_INK3, marginBottom: 16, lineHeight: 1.5 }}>{t.agencyProfileSub}</div>

              {/* Logo upload */}
              <div style={{ display: "flex", gap: 14, marginBottom: 18, alignItems: "center" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 14, flexShrink: 0,
                  background: logoUrl ? "transparent" : DA_BG,
                  border: `1px solid ${DA_RULE}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", color: DA_INK1, fontSize: 22, fontWeight: 800,
                }}>
                  {logoUrl
                    ? <img src={logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    : (name ? name.slice(0, 2).toUpperCase() : "AG")
                  }
                </div>
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleLogoUpload} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{ padding: "7px 12px", borderRadius: 8, background: DA_SURFACE, border: `1px solid ${DA_RULE2}`, color: DA_INK2, fontSize: 11.5, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer", fontFamily: SANS }}
                  >
                    {uploading ? t.uploadingBtn : t.uploadLogoBtn}
                  </button>
                  {uploadError && <div style={{ fontSize: 11, color: DA_DANGER, marginTop: 5 }}>{uploadError}</div>}
                  <div style={{ fontSize: 11, color: DA_INK3, marginTop: 6 }}>{t.logoRecommendedNote}</div>
                  {logoUrl && (
                    <button onClick={() => setLogoUrl("")} style={{ fontSize: 11, color: DA_INK3, background: "none", border: "none", cursor: "pointer", fontFamily: SANS, padding: 0, marginTop: 4 }}>{t.removeLogoBtn}</button>
                  )}
                </div>
              </div>

              <FieldLabel>{t.agencyNameLabel}</FieldLabel>
              <Input data-testid="profile-name" value={name} onChange={setName} placeholder="e.g. Aegean Travel" />

              <FieldLabel>{t.taglineLabel}</FieldLabel>
              <Input value={tagline} onChange={setTagline} placeholder="Curated Mediterranean journeys · est. 2014" />
            </div>

            {/* Brand colours */}
            <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: SANS, color: DA_INK1, marginBottom: 4 }}>{t.brandColorsLabel}</div>
              <div style={{ fontSize: 11.5, color: DA_INK3, marginBottom: 16, lineHeight: 1.5 }}>{t.colorUsedNote}</div>

              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>
                <ColorField
                  lang={lang} label={t.headerColorLabel} role="brand"
                  value={brandColor} onChange={setBrandColor}
                  swatches={BRAND_SWATCHES} brandFallback={brandColor || DEFAULT_BRAND_COLOR}
                />
                <ColorField
                  lang={lang} label={t.accentColorLabel} role="accent"
                  value={accentColor} onChange={setAccentColor}
                  swatches={ACCENT_SWATCHES} brandFallback={brandColor || DEFAULT_BRAND_COLOR}
                  hint={t.accentColorHint}
                >
                  {accentColor && (
                    <button onClick={() => setAccentColor("")} style={{ fontSize: 11, color: DA_INK3, background: "none", border: "none", cursor: "pointer", fontFamily: SANS, padding: 0 }}>
                      {lang === "ar" ? "مسح" : "Clear"}
                    </button>
                  )}
                </ColorField>
              </div>
            </div>

            {/* Font pairing */}
            <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: SANS, color: DA_INK1, marginBottom: 4 }}>{t.typographyLabel}</div>
              <div style={{ fontSize: 11.5, color: DA_INK3, marginBottom: 16, lineHeight: 1.5 }}>{t.typographyHint}</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 10 }}>
                {(Object.keys(FONT_PAIRINGS) as FontPairingId[]).map((id) => {
                  const p = FONT_PAIRINGS[id];
                  const set = lang === "ar" ? p.ar : p.en;
                  const on = fontPairing === id;
                  return (
                    <button
                      key={id}
                      onClick={() => setFontPairing(id)}
                      dir={lang === "ar" ? "rtl" : "ltr"}
                      style={{
                        textAlign: lang === "ar" ? "right" : "left", cursor: "pointer",
                        padding: "14px 16px", borderRadius: 11, background: on ? DA_GOLD_SOFT : DA_SURFACE,
                        border: `1.5px solid ${on ? DA_GOLD : DA_RULE}`, transition: "all .15s",
                        display: "flex", flexDirection: "column", gap: 6,
                        boxShadow: on ? `0 0 0 3px rgba(176,138,62,.14)` : "none",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: 12.5, fontFamily: SANS, fontWeight: 600, color: on ? DA_GOLD_DEEP : DA_INK1 }}>
                          {lang === "ar" ? p.labelAr : p.label}
                        </span>
                        {on && <Icon name="check" size={13} color={DA_GOLD} strokeWidth={3} />}
                      </div>
                      <div style={{ fontFamily: set.display, fontSize: 24, lineHeight: 1.1, color: DA_INK1, letterSpacing: "-0.4px", marginTop: 2 }}>
                        {lang === "ar" ? "اكتشف العالم" : "See the world"}
                      </div>
                      <div style={{ fontFamily: set.body, fontSize: 11.5, color: DA_INK2, lineHeight: 1.4 }}>
                        {lang === "ar" ? p.note.ar : p.note.en}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Contact */}
            <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: SANS, color: DA_INK1, marginBottom: 16 }}>{t.contactLabel}</div>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
                <Input value={email} onChange={setEmail} placeholder="hello@agency.com" />
                <Input value={phone} onChange={setPhone} placeholder="+1 555 000 1234" />
              </div>
              <div style={{ marginTop: 8 }}>
                <Input value={whatsapp} onChange={setWhatsapp} placeholder="WhatsApp · +971 50 000 0000" />
              </div>
              <div style={{ fontSize: 11, color: DA_INK3, marginTop: 6 }}>
                {lang === "ar"
                  ? "يُفعّل زر واتساب العائم وشريط التواصل في صفحتك العامة."
                  : "WhatsApp enables the floating chat button and contact band on your storefront."}
              </div>
            </div>

            {/* Social links — Gulf essentials first, then More */}
            <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: SANS, color: DA_INK1, marginBottom: 4 }}>{t.socialsLabel}</div>
              <div style={{ fontSize: 11.5, color: DA_INK3, marginBottom: 16, lineHeight: 1.5 }}>{t.socialsHint}</div>

              <div style={{ fontSize: 10.5, fontWeight: 700, fontFamily: SANS, color: DA_INK3, textTransform: "uppercase", letterSpacing: "1.2px", marginBottom: 12 }}>{t.socialsGulfLabel}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {/* WhatsApp READS the canonical whatsapp field — edit it in Contact above */}
                <SocialRow glyph={SOCIAL_GLYPH.whatsapp(16)} value={whatsapp} readOnly placeholder="WhatsApp · +971 50 000 0000" />
                <SocialRow glyph={SOCIAL_GLYPH.snapchat(16)} value={snapchat} onChange={setSnapchat} placeholder="https://snapchat.com/add/…" />
                <SocialRow glyph={SOCIAL_GLYPH.tiktok(15)} value={tiktok} onChange={setTiktok} placeholder="https://tiktok.com/@…" />
                <SocialRow glyph={SOCIAL_GLYPH.instagram(16)} value={instagram} onChange={setInstagram} placeholder="https://instagram.com/…" />
              </div>

              <div style={{ fontSize: 10.5, fontWeight: 700, fontFamily: SANS, color: DA_INK3, textTransform: "uppercase", letterSpacing: "1.2px", margin: "18px 0 12px" }}>{t.socialsMoreLabel}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <SocialRow glyph={SOCIAL_GLYPH.facebook(16)} value={facebook} onChange={setFacebook} placeholder="https://facebook.com/…" />
                <SocialRow glyph={SOCIAL_GLYPH.youtube(16)} value={youtube} onChange={setYoutube} placeholder="https://youtube.com/@…" />
                <SocialRow glyph={SOCIAL_GLYPH.x(15)} value={x} onChange={setX} placeholder="https://x.com/…" />
              </div>
            </div>

            </div>{/* LEFT column */}

            {/* RIGHT — sticky live preview (desktop only; mobile shows it on top) */}
            {!isMobile && (
              <div style={{ position: "sticky", top: 0, minWidth: 0 }}>
                {previewPanel}
              </div>
            )}
          </div>{/* grid */}
        </div>
        )}
        </div>{/* tab content */}
      </div>
      {/* ── Remove domain confirmation modal ── */}
      <ConfirmModal
        open={confirmRemoveOpen}
        onClose={() => { if (!domainRemoving) setConfirmRemoveOpen(false); }}
        loading={domainRemoving}
        variant="warning"
        icon="globe"
        dir={lang === "ar" ? "rtl" : "ltr"}
        title={domainStatus === "failed" ? t.domainRetryTitle : t.domainRemoveTitle}
        message={domainStatus === "active" ? t.domainRemoveActiveMsg : t.domainRemoveInactiveMsg}
        confirmLabel={domainRemoving ? t.domainRemovingLabel : t.domainRemoveConfirm}
        cancelLabel={t.modalCancel}
        onConfirm={async () => {
          if (domainStatus === "failed") {
            await handleResetDomain();
          } else {
            await handleRemoveDomain();
          }
          setConfirmRemoveOpen(false);
        }}
      >
        {domainError && (
          <div style={{ fontSize: 12, color: DA_DANGER, padding: "8px 12px", borderRadius: 8, background: DA_DANGER_SOFT, border: `1px solid ${DA_DANGER}`, marginBottom: 4 }}>
            {domainError}
          </div>
        )}
      </ConfirmModal>
      {/* ── Delete account modal ── */}
      <ConfirmModal
        open={deleteOpen}
        onClose={() => { if (!deleting) { setDeleteOpen(false); setDeleteConfirmEmail(""); setDeleteError(null); } }}
        loading={deleting}
        variant="danger"
        title={lang === "ar" ? "حذف الحساب نهائياً؟" : "Delete account permanently?"}
        message={lang === "ar" ? "لا يمكن التراجع عن هذا الإجراء." : "This action cannot be undone."}
        confirmLabel={lang === "ar" ? "حذف حسابي" : "Delete my account"}
        cancelLabel={lang === "ar" ? "إلغاء" : "Cancel"}
        dir={lang === "ar" ? "rtl" : "ltr"}
        onConfirm={handleDeleteAccount}
      >
        <div style={{ marginBottom: 14, padding: "10px 13px", background: DA_DANGER_SOFT, borderRadius: 9, fontSize: 12.5, color: DA_DANGER, lineHeight: 1.6 }}>
          {lang === "ar" ? (
            <>• جميع صفحات الباقات<br />• جميع العملاء والبيانات<br />• النطاق المخصص<br />• حسابك بالكامل</>
          ) : (
            <>• All package pages<br />• All leads and analytics<br />• Your custom domain<br />• Your account and profile</>
          )}
        </div>
        <div style={{ fontSize: 12, fontWeight: 500, color: DA_INK2, marginBottom: 6 }}>
          {lang === "ar" ? `أدخل بريدك الإلكتروني للتأكيد` : `Type your email to confirm`}
        </div>
        <input
          type="email"
          value={deleteConfirmEmail}
          onChange={e => { setDeleteConfirmEmail(e.target.value); setDeleteError(null); }}
          placeholder={email}
          disabled={deleting}
          style={{
            width: "100%", padding: "9px 12px",
            background: DA_SURFACE, border: `1px solid ${DA_RULE}`,
            borderRadius: 8, color: DA_INK1, fontSize: 13,
            fontFamily: SANS, outline: "none", boxSizing: "border-box",
          }}
          onFocus={e => (e.target.style.borderColor = DA_DANGER)}
          onBlur={e => (e.target.style.borderColor = DA_RULE)}
        />
        {deleteError && (
          <div style={{ fontSize: 12, color: DA_DANGER, padding: "8px 12px", borderRadius: 8, background: DA_DANGER_SOFT, border: `1px solid ${DA_DANGER}`, marginTop: 10 }}>
            {deleteError}
          </div>
        )}
      </ConfirmModal>
      {/* ── DNS setup modal ── */}
      <DnsSetupModal
        open={dnsSetupOpen}
        onClose={() => setDnsSetupOpen(false)}
        allRecords={(() => {
          if (!customDomain) return [];
          return [
            ...(cnameRecord ? [{ purpose: lang === "ar" ? "توجيه الزيارات" : "Route traffic", type: cnameRecord.type, name: cnameRecord.name, value: cnameRecord.value }] : []),
            ...verificationRecords.map(r => ({ purpose: lang === "ar" ? "التحقق من الملكية" : "Ownership verification", type: r.type, name: r.name, value: r.value })),
            ...sslRecords.map(r => ({ purpose: lang === "ar" ? "شهادة SSL" : "SSL certificate", type: r.type, name: r.name, value: r.value })),
          ];
        })()}
        apexGuidance={apexGuidance}
        copiedKey={copiedKey}
        onCopy={handleCopyRecord}
        lang={lang}
        t={t}
      />
    </AppLayout>
  );
}
