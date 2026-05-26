"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { SAND, SUCCESS, tabBtn } from "./constants";
import { PexelsPhotoSearch } from "./PexelsPhotoSearch";
import {
  DA_BG, DA_SURFACE, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2, DA_GOLD, DA_GREEN, DA_DANGER,
} from "@/lib/tokens";

export function ImageField({
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

  const uploadLabel = lang === "ar" ? "رفع" : "Upload";
  const searchLabel = lang === "ar" ? "بحث عن صور" : "Search Photos";
  const removeLabel = lang === "ar" ? "إزالة" : "Remove";
  const uploadingLabel = lang === "ar" ? "جاري الرفع…" : "Uploading…";
  const clickLabel = lang === "ar" ? "انقر لرفع صورة" : "Click to upload an image";
  const fmtHint = lang === "ar" ? "JPG أو PNG أو WebP" : "JPG, PNG or WebP";

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
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
      setError(err.message || (lang === "ar" ? "فشل الرفع" : "Upload failed"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div>
      {value && (
        <div style={{ marginBottom: 12 }}>
          <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: 12, overflow: "hidden", border: `1px solid ${DA_RULE}`, marginBottom: 8 }}>
            <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Icon name="check" size={13} color={DA_GREEN} strokeWidth={2.5} />
            <span style={{ fontSize: 12, color: DA_GREEN, fontWeight: 600, flex: 1 }}>
              {lang === "ar" ? "تم تعيين الصورة" : "Image set"}
            </span>
            <button
              onClick={() => onChange("")}
              style={{ fontSize: 12, color: DA_INK3, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit" }}
            >
              {removeLabel}
            </button>
          </div>
        </div>
      )}

      <div style={{ display: "inline-flex", background: DA_BG, borderRadius: 99, padding: "4px 5px", marginBottom: 14, gap: 4 }}>
        <button onClick={() => setMode("upload")} style={tabBtn(mode === "upload")}>
          <Icon name="image" size={12} color={mode === "upload" ? DA_SURFACE : DA_INK3} />
          {uploadLabel}
        </button>
        <button onClick={() => setMode("search")} style={tabBtn(mode === "search")}>
          <Icon name="image" size={12} color={mode === "search" ? DA_GOLD : DA_INK3} />
          <span style={{ color: mode === "search" ? DA_GOLD : undefined }}>{searchLabel}</span>
        </button>
      </div>

      {error && <p style={{ fontSize: 12, color: DA_DANGER, marginBottom: 10 }}>{error}</p>}

      {mode === "upload" && (
        <label
          style={{
            display: "block",
            border: `1.5px dashed ${DA_RULE}`,
            borderRadius: 14,
            padding: "28px 20px",
            textAlign: "center",
            cursor: uploading ? "not-allowed" : "pointer",
            background: DA_BG,
            transition: "border-color 0.2s",
          }}
          onMouseEnter={(e) => !uploading && (e.currentTarget.style.borderColor = DA_GOLD)}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = DA_RULE)}
        >
          <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={handleFile} disabled={uploading} />
          {uploading ? (
            <>
              <span className="spinner-warm" style={{ borderTopColor: DA_GOLD }} />
              <div style={{ fontSize: 12, color: DA_INK3, marginTop: 8 }}>{uploadingLabel}</div>
            </>
          ) : (
            <>
              <Icon name="image" size={28} color={DA_RULE2} />
              <div style={{ fontSize: 13, fontWeight: 600, color: DA_INK3, marginTop: 10 }}>{clickLabel}</div>
              <div style={{ fontSize: 11, color: DA_INK3, marginTop: 4 }}>{fmtHint}</div>
            </>
          )}
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
