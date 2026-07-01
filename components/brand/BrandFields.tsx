"use client";

// Shared brand-editing controls.
//
// These are the reusable field primitives for an agency's identity — logo,
// name/tagline, colours, font pairing, contact channels — plus a live brand
// preview. Both the welcome wizard (app/welcome) and the profile editor can
// build on them. They read every constant + helper from lib/brand.ts, and the
// canonical write path stays brandDocPatch(), so the DATA never drifts even if
// a surface arranges the controls differently.

import { useRef, useState } from "react";
import {
  FontPairingId, FONT_PAIRINGS,
  DEFAULT_BRAND_COLOR, brandReadable, ratioBand, fontsForPairing, AgencySocials,
} from "@/lib/brand";
import {
  DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2, DA_GOLD, DA_GOLD_SOFT, DA_DANGER,
} from "@/lib/tokens";
import { T } from "@/lib/translations";

const SANS = "var(--font-inter-tight), system-ui, sans-serif";

// The state the brand controls own — mirrors BrandEditFields in lib/brand.ts so
// a parent can hand the whole object straight to brandDocPatch().
export interface BrandFormState {
  name: string;
  tagline: string;
  logoUrl: string;
  brandColor: string;
  accentColor: string;
  fontPairing: FontPairingId;
  whatsapp: string;
  phone: string;
  email: string;
  socials: AgencySocials;
}

export const EMPTY_BRAND_FORM: BrandFormState = {
  name: "", tagline: "", logoUrl: "",
  brandColor: DEFAULT_BRAND_COLOR, accentColor: "",
  fontPairing: "editorial",
  whatsapp: "", phone: "", email: "",
  socials: {},
};

type Lang = "en" | "ar";

// ── Labeled text input ──────────────────────────────────────────────────────

export function TextField({
  label, value, onChange, placeholder, type = "text", dir,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  dir?: "ltr" | "rtl";
}) {
  return (
    <div>
      <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: DA_INK2, marginBottom: 6 }}>{label}</div>
      <input
        type={type}
        dir={dir}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%", padding: "10px 12px",
          background: DA_SURFACE2, border: `1px solid ${DA_RULE}`,
          borderRadius: 8, color: DA_INK1, fontSize: 14, fontFamily: SANS,
          outline: "none", boxSizing: "border-box",
        }}
        onFocus={(e) => (e.target.style.borderColor = DA_GOLD)}
        onBlur={(e) => (e.target.style.borderColor = DA_RULE)}
      />
    </div>
  );
}

// ── Logo upload ─────────────────────────────────────────────────────────────

export function LogoField({
  uid, lang, logoUrl, onChange,
}: {
  uid: string;
  lang: Lang;
  logoUrl: string;
  onChange: (url: string) => void;
}) {
  const t = T[lang];
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const upload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;
    setUploading(true);
    setErr(null);
    try {
      const fd = new FormData();
      fd.append("uid", uid);
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      onChange(json.urls[0]);
    } catch {
      setErr("Upload failed. Try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
      <div style={{
        width: 64, height: 64, borderRadius: 14, flexShrink: 0,
        border: `1px solid ${DA_RULE}`, overflow: "hidden",
        background: logoUrl ? "transparent" : DA_SURFACE2,
        display: "flex", alignItems: "center", justifyContent: "center",
        color: DA_INK3, fontFamily: SANS, fontSize: 11,
      }}>
        {logoUrl
          ? <img src={logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
          : (lang === "ar" ? "شعار" : "Logo")}
      </div>
      <div style={{ minWidth: 0 }}>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={upload} />
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            style={{
              padding: "8px 14px", borderRadius: 8,
              background: DA_SURFACE2, border: `1px solid ${DA_RULE2}`,
              color: DA_INK1, fontFamily: SANS, fontSize: 13, fontWeight: 500,
              cursor: uploading ? "not-allowed" : "pointer",
            }}
          >
            {uploading ? t.uploadingBtn : t.uploadLogoBtn}
          </button>
          {logoUrl && (
            <button
              onClick={() => onChange("")}
              style={{
                padding: "8px 12px", borderRadius: 8,
                background: "none", border: `1px solid ${DA_RULE2}`,
                color: DA_INK3, fontFamily: SANS, fontSize: 13, cursor: "pointer",
              }}
            >
              {t.removeLogoBtn}
            </button>
          )}
        </div>
        <div style={{ fontFamily: SANS, fontSize: 11, color: err ? DA_DANGER : DA_INK3, marginTop: 8 }}>
          {err || t.logoRecommendedNote}
        </div>
      </div>
    </div>
  );
}

// ── Colour field (swatches + hex + contrast readout) ────────────────────────

export function ColorField({
  label, value, onChange, swatches, lang, showContrast, fallback,
}: {
  label: string;
  value: string;
  onChange: (hex: string) => void;
  swatches: readonly string[];
  lang: Lang;
  showContrast?: boolean;
  fallback?: string;
}) {
  const t = T[lang];
  const effective = value || fallback || DEFAULT_BRAND_COLOR;
  const readable = brandReadable(effective);
  const band = ratioBand(readable.ratio);

  return (
    <div>
      <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: DA_INK2, marginBottom: 8 }}>{label}</div>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {swatches.map((sw) => {
          const active = value.toLowerCase() === sw.toLowerCase();
          return (
            <button
              key={sw}
              onClick={() => onChange(sw)}
              title={sw}
              style={{
                width: 30, height: 30, borderRadius: 8, cursor: "pointer",
                background: sw, border: active ? `2px solid ${DA_INK1}` : `1px solid ${DA_RULE2}`,
                boxShadow: active ? `0 0 0 2px ${DA_SURFACE}` : "none",
              }}
            />
          );
        })}
        <label style={{
          display: "inline-flex", alignItems: "center", gap: 6,
          padding: "5px 8px", borderRadius: 8, border: `1px solid ${DA_RULE2}`,
          background: DA_SURFACE2, cursor: "pointer",
        }}>
          <input
            type="color"
            value={effective}
            onChange={(e) => onChange(e.target.value)}
            style={{ width: 22, height: 22, border: "none", background: "none", padding: 0, cursor: "pointer" }}
          />
          <input
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={fallback ? "" : "#1d4e72"}
            dir="ltr"
            style={{
              width: 76, border: "none", outline: "none", background: "none",
              fontFamily: "var(--font-mono, monospace)", fontSize: 12, color: DA_INK1,
            }}
          />
        </label>
      </div>
      {showContrast && (
        <div style={{
          marginTop: 8, fontFamily: SANS, fontSize: 11,
          color: band.ok ? DA_INK3 : DA_DANGER,
        }}>
          {band.ok
            ? `${lang === "ar" ? "التباين" : "Contrast"} ${readable.ratio.toFixed(1)}:1 · ${lang === "ar" ? band.labelAr : band.label}`
            : t.contrastWarnLabel}
        </div>
      )}
    </div>
  );
}

// ── Font pairing picker ─────────────────────────────────────────────────────

export function FontPairingField({
  value, onChange, lang,
}: {
  value: FontPairingId;
  onChange: (id: FontPairingId) => void;
  lang: Lang;
}) {
  const isAr = lang === "ar";
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
      {(Object.keys(FONT_PAIRINGS) as FontPairingId[]).map((id) => {
        const p = FONT_PAIRINGS[id];
        const active = value === id;
        const fonts = fontsForPairing(id, lang);
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            style={{
              textAlign: isAr ? "right" : "left",
              padding: "12px 14px", borderRadius: 12, cursor: "pointer",
              background: active ? DA_GOLD_SOFT : DA_SURFACE2,
              border: active ? `1.5px solid ${DA_GOLD}` : `1px solid ${DA_RULE}`,
            }}
          >
            <div style={{ fontFamily: fonts.display, fontSize: 22, color: DA_INK1, lineHeight: 1.1 }}>
              {isAr ? "رحلة" : "Journey"}
            </div>
            <div style={{ fontFamily: fonts.body, fontSize: 12, color: DA_INK2, marginTop: 4 }}>
              {isAr ? "نص تجريبي للمعاينة" : "The quick brown fox jumps"}
            </div>
            <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 600, color: active ? DA_GOLD : DA_INK3, marginTop: 8 }}>
              {isAr ? p.labelAr : p.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Live brand preview (header mock + package card) ─────────────────────────

export function BrandPreview({
  brand, lang,
}: {
  brand: BrandFormState;
  lang: Lang;
}) {
  const isAr = lang === "ar";
  const fonts = fontsForPairing(brand.fontPairing, lang);
  const color = brand.brandColor || DEFAULT_BRAND_COLOR;
  const onColor = brandReadable(color).on;
  const accent = brand.accentColor || color;
  const name = brand.name || (isAr ? "وكالتك" : "Your Agency");

  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{
      borderRadius: 16, overflow: "hidden",
      border: `1px solid ${DA_RULE}`, background: DA_SURFACE,
      boxShadow: "0 12px 40px -20px rgba(26,22,17,.3)",
    }}>
      {/* Header bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: "12px 16px", background: color,
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, flexShrink: 0,
          background: brand.logoUrl ? "transparent" : "rgba(255,255,255,.18)",
          overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center",
          color: onColor, fontFamily: fonts.display, fontSize: 15,
        }}>
          {brand.logoUrl
            ? <img src={brand.logoUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            : name.slice(0, 1).toUpperCase()}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: fonts.display, fontSize: 16, color: onColor, lineHeight: 1.1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {name}
          </div>
          {brand.tagline && (
            <div style={{ fontFamily: fonts.body, fontSize: 10, color: onColor, opacity: 0.8 }}>{brand.tagline}</div>
          )}
        </div>
        <div style={{ marginInlineStart: "auto", display: "flex", gap: 12 }}>
          {[isAr ? "الباقات" : "Packages", isAr ? "من نحن" : "About"].map((l) => (
            <span key={l} style={{ fontFamily: fonts.body, fontSize: 11, color: onColor, opacity: 0.85 }}>{l}</span>
          ))}
        </div>
      </div>

      {/* Body: a sample package card */}
      <div style={{ padding: 16, background: DA_SURFACE }}>
        <div style={{
          borderRadius: 12, overflow: "hidden", border: `1px solid ${DA_RULE}`, background: DA_SURFACE2,
        }}>
          <div style={{
            height: 96,
            background: `linear-gradient(135deg, ${color}, ${accent})`,
          }} />
          <div style={{ padding: 14 }}>
            <div style={{ fontFamily: fonts.display, fontSize: 18, color: DA_INK1, lineHeight: 1.15 }}>
              {isAr ? "رحلة إلى كابادوكيا" : "Cappadocia Escape"}
            </div>
            <div style={{ fontFamily: fonts.body, fontSize: 12, color: DA_INK2, marginTop: 4 }}>
              {isAr ? "٥ ليالٍ · شامل" : "5 nights · All-inclusive"}
            </div>
            <div style={{
              marginTop: 12, display: "inline-flex", alignItems: "center", gap: 8,
              padding: "8px 14px", borderRadius: 9,
              background: color, color: onColor,
              fontFamily: fonts.body, fontSize: 12, fontWeight: 600,
            }}>
              {isAr ? "احجز عبر واتساب" : "Book on WhatsApp"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
