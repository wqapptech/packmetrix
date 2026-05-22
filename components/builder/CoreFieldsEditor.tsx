"use client";

import Icon from "@/components/Icon";
import type { CoreForm } from "@/lib/sections/types";
import { SAND } from "./constants";
import { FieldLabel, TextInput, TextArea } from "./primitives";

export function CoreFieldsEditor({
  core,
  onChange,
  userId,
  lang,
}: {
  core: CoreForm;
  onChange: (c: CoreForm) => void;
  userId: string;
  lang: "en" | "ar";
}) {
  const set = <K extends keyof CoreForm>(key: K, val: CoreForm[K]) =>
    onChange({ ...core, [key]: val });

  const l = lang === "ar";

  return (
    <div>
      {/* Language picker */}
      <FieldLabel>{l ? "لغة الصفحة" : "Landing page language"}</FieldLabel>
      <div style={{ display: "flex", gap: 10, marginBottom: 4 }}>
        {(["en", "ar"] as const).map((lng) => (
          <button
            key={lng}
            onClick={() => set("language", lng)}
            style={{
              flex: 1,
              padding: "10px 16px",
              borderRadius: 10,
              border: core.language === lng
                ? `1.5px solid ${SAND}`
                : "1px solid rgba(255,255,255,0.1)",
              background: core.language === lng
                ? `${SAND}18`
                : "rgba(255,255,255,0.03)",
              color: core.language === lng ? SAND : "rgba(255,255,255,0.5)",
              fontSize: 13,
              fontWeight: core.language === lng ? 700 : 400,
              cursor: "pointer",
              fontFamily: "inherit",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              transition: "all 0.15s",
            }}
          >
            {lng === "en" ? (
              <><span style={{ fontSize: 15 }}>🇬🇧</span> {l ? "الإنجليزية" : "English"}</>
            ) : (
              <><span style={{ fontSize: 15 }}>🇸🇦</span> {l ? "العربية" : "Arabic"}</>
            )}
          </button>
        ))}
      </div>
      {core.language === "ar" && (
        <div style={{ marginBottom: 14, padding: "8px 12px", borderRadius: 8, background: "rgba(232,201,123,0.06)", border: "1px solid rgba(232,201,123,0.18)", fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
          {l ? "سيُعرض محتوى الصفحة من اليمين إلى اليسار" : "The landing page will be displayed right-to-left."}
        </div>
      )}

      <FieldLabel required>{l ? "الوجهة" : "Destination"}</FieldLabel>
      <TextInput
        value={core.destination}
        onChange={(v) => set("destination", v)}
        placeholder={l ? "مثال: مكة المكرمة، المملكة العربية السعودية" : "e.g. Mecca, Saudi Arabia"}
      />

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <FieldLabel required>{l ? "السعر الأساسي" : "Base price"}</FieldLabel>
          <TextInput
            value={core.price}
            onChange={(v) => set("price", v)}
            placeholder={l ? "مثال: 1,200 €" : "e.g. 1,200 €"}
          />
        </div>
        <div style={{ flex: 1 }}>
          <FieldLabel>{l ? "عدد الليالي" : "Nights"}</FieldLabel>
          <TextInput
            value={core.nights}
            onChange={(v) => set("nights", v)}
            placeholder={l ? "مثال: 7" : "e.g. 7"}
          />
        </div>
      </div>

      <FieldLabel>{l ? "عنوان الباقة" : "Package title"}</FieldLabel>
      <TextInput
        value={core.title}
        onChange={(v) => set("title", v)}
        placeholder={l ? "مثال: باقة العمرة المميزة ٢٠٢٥" : "e.g. Premium Umrah Package 2025"}
      />

      <FieldLabel>{l ? "وصف قصير" : "Short description"}</FieldLabel>
      <TextArea
        value={core.description}
        onChange={(v) => set("description", v as string)}
        placeholder={l ? "وصف موجز يُعرض في أعلى الصفحة…" : "A short teaser shown at the top of the page…"}
        rows={3}
      />

      <div style={{ marginTop: 4, marginBottom: 18, padding: "12px 14px", borderRadius: 10, background: "rgba(232,201,123,0.05)", border: "1px solid rgba(232,201,123,0.18)", fontSize: 12, color: "rgba(255,255,255,0.6)", lineHeight: 1.55 }}>
        <span style={{ color: SAND }}>✦ </span>
        {l ? "اجعل العنوان جذاباً — يظهر في أعلى الصفحة والروابط المشتركة." : "Make the title compelling — it appears at the top of the page and in shared links."}
      </div>

      <FieldLabel>{l ? "رقم واتساب" : "WhatsApp number"}</FieldLabel>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", fontSize: 15, pointerEvents: "none" }}>
          <Icon name="whatsapp" size={16} color="#25d366" />
        </div>
        <input
          value={core.whatsapp}
          onChange={(e) => set("whatsapp", e.target.value)}
          placeholder="+1 234 567 8900"
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "10px 14px 10px 40px",
            color: "var(--white)",
            fontSize: 13,
            fontFamily: "inherit",
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = `${SAND}60`)}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
        />
      </div>

      <FieldLabel>{l ? "رابط ماسنجر" : "Messenger link"}</FieldLabel>
      <div style={{ position: "relative" }}>
        <div style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }}>
          <Icon name="messenger" size={16} color="#0a7cff" />
        </div>
        <input
          value={core.messenger}
          onChange={(e) => set("messenger", e.target.value)}
          placeholder="https://m.me/yourpage"
          style={{
            width: "100%",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "10px 14px 10px 40px",
            color: "var(--white)",
            fontSize: 13,
            fontFamily: "inherit",
            outline: "none",
            transition: "border-color 0.2s",
          }}
          onFocus={(e) => (e.target.style.borderColor = `${SAND}60`)}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
        />
      </div>

      {/* Cover image */}
      <CoverImageField value={core.coverImage} onChange={(v) => set("coverImage", v)} userId={userId} lang={lang} />
    </div>
  );
}

// ─── Inline cover-image picker ─────────────────────────────────────────────────

import { useState } from "react";
import { tabBtn } from "./constants";
import { PexelsPhotoSearch } from "./PexelsPhotoSearch";

const COVER_RATIO = 16 / 9;
const SUCCESS = "#2dd4a0";

function CoverImageField({
  value,
  onChange,
  userId,
  lang,
}: {
  value: string;
  onChange: (url: string) => void;
  userId: string;
  lang: "en" | "ar";
}) {
  const [mode, setMode] = useState<"upload" | "search">("upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const l = lang === "ar";

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    const img = new Image();
    const objUrl = URL.createObjectURL(file);
    img.src = objUrl;
    await new Promise<void>((res) => { img.onload = () => res(); });
    URL.revokeObjectURL(objUrl);

    if (img.width < 1200 || img.height < 675) {
      setError(l ? `الصورة صغيرة جداً (${img.width}×${img.height}). الحد الأدنى 1200×675.` : `Image too small (${img.width}×${img.height}px). Minimum 1200×675px.`);
      e.target.value = "";
      return;
    }
    const ratio = img.width / img.height;
    if (ratio < 1.6 || ratio > 2.0) {
      setError(l ? "يُرجى استخدام صورة أفقية بنسبة 16:9 تقريباً." : "Please use a landscape image close to 16:9 ratio.");
      e.target.value = "";
      return;
    }

    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("uid", userId);
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      onChange(json.urls[0]);
      setMode("upload");
    } catch (err: any) {
      setError(err.message || (l ? "فشل الرفع" : "Upload failed"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div style={{ marginTop: 4 }}>
      <FieldLabel>{l ? "صورة الغلاف" : "Cover image"}</FieldLabel>

      {value && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: `${COVER_RATIO}`, borderRadius: 12, overflow: "hidden", marginBottom: 8 }}>
            <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="check" size={13} color={SUCCESS} strokeWidth={2.5} />
            <span style={{ fontSize: 12, color: SUCCESS, fontWeight: 600, flex: 1 }}>
              {l ? "تم تعيين صورة الغلاف" : "Cover image set"}
            </span>
            <button onClick={() => onChange("")} style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              {l ? "إزالة" : "Remove"}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.05)", borderRadius: 99, padding: "4px 5px", marginBottom: 14, gap: 4 }}>
        <button onClick={() => setMode("upload")} style={tabBtn(mode === "upload")}>
          <Icon name="image" size={12} color={mode === "upload" ? "#fff" : "rgba(255,255,255,0.4)"} />
          {l ? "رفع" : "Upload"}
        </button>
        <button onClick={() => setMode("search")} style={tabBtn(mode === "search")}>
          <Icon name="image" size={12} color={mode === "search" ? SAND : "rgba(255,255,255,0.4)"} />
          <span style={{ color: mode === "search" ? SAND : undefined }}>{l ? "بحث في Pexels" : "Search Pexels"}</span>
        </button>
      </div>

      {error && <p style={{ fontSize: 12, color: "#ef9090", marginBottom: 10 }}>{error}</p>}

      {mode === "upload" && (
        <label
          style={{ display: "block", border: "1.5px dashed rgba(255,255,255,0.15)", borderRadius: 14, overflow: "hidden", cursor: uploading ? "not-allowed" : "pointer", transition: "border-color 0.2s" }}
          onMouseEnter={(e) => !uploading && (e.currentTarget.style.borderColor = `${SAND}50`)}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)")}
        >
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFile} disabled={uploading} />
          <div style={{ position: "relative", width: "100%", paddingTop: `${(1 / COVER_RATIO) * 100}%`, background: "rgba(255,255,255,0.02)" }}>
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
              {uploading ? (
                <><span className="spinner" style={{ borderTopColor: SAND }} /><span style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>{l ? "جاري الرفع…" : "Uploading…"}</span></>
              ) : (
                <>
                  <Icon name="image" size={28} color="rgba(255,255,255,0.15)" />
                  <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>{l ? "انقر لرفع صورة الغلاف" : "Click to upload cover image"}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)" }}>{l ? "الحد الأدنى 1200×675 — 16:9" : "Min 1200×675px — 16:9"}</div>
                </>
              )}
            </div>
          </div>
        </label>
      )}

      {mode === "search" && (
        <PexelsPhotoSearch
          onSelect={(url) => { onChange(url); setMode("upload"); }}
          lang={lang}
        />
      )}
    </div>
  );
}
