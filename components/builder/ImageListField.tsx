"use client";

import { useRef, useState } from "react";
import Icon from "@/components/Icon";
import { SAND, SUCCESS, tabBtn } from "./constants";
import { PexelsPhotoSearch } from "./PexelsPhotoSearch";
import {
  DA_BG, DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2, DA_GOLD, DA_GOLD_SOFT, DA_GREEN, DA_GREEN_SOFT, DA_DANGER,
} from "@/lib/tokens";

export function ImageListField({
  value,
  onChange,
  userId,
  lang,
}: {
  value: string[];
  onChange: (urls: string[]) => void;
  userId: string;
  lang: "en" | "ar";
}) {
  const [mode, setMode] = useState<"upload" | "search">("upload");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dragIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  const uploadLabel = lang === "ar" ? "رفع" : "Upload";
  const searchLabel = lang === "ar" ? "بحث عن صور" : "Search Photos";
  const uploadingLabel = lang === "ar" ? "جاري الرفع…" : "Uploading…";
  const clickLabel = lang === "ar" ? "انقر لرفع صور" : "Click to upload photos";
  const fmtHint = lang === "ar" ? "يمكن رفع عدة صور في آن واحد" : "Multiple files at once";
  const heroBadge = lang === "ar" ? "رئيسية" : "Hero";
  const boostTip =
    lang === "ar"
      ? `${value.length} صورة — اسحب لإعادة الترتيب`
      : `${value.length} photo${value.length !== 1 ? "s" : ""} — drag to reorder`;

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("uid", userId);
      files.forEach((f) => fd.append("file", f));
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      onChange([...value, ...(json.urls as string[])]);
    } catch (err: any) {
      setError(err.message || (lang === "ar" ? "فشل الرفع" : "Upload failed"));
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const remove = (i: number) => onChange(value.filter((_, j) => j !== i));

  const onDragStart = (i: number) => { dragIdx.current = i; };
  const onDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOver(i); };
  const onDrop = (i: number) => {
    const from = dragIdx.current;
    if (from === null || from === i) { dragIdx.current = null; setDragOver(null); return; }
    const next = [...value];
    const [moved] = next.splice(from, 1);
    next.splice(i, 0, moved);
    onChange(next);
    dragIdx.current = null;
    setDragOver(null);
  };
  const onDragEnd = () => { dragIdx.current = null; setDragOver(null); };

  return (
    <div>
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

      {value.length > 0 && (
        <>
          <div style={{ padding: "8px 12px", borderRadius: 10, background: DA_GREEN_SOFT, border: `1px solid ${DA_GREEN}40`, fontSize: 12, color: DA_INK2, marginBottom: 12 }}>
            💡 {boostTip}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 14 }}>
            {value.map((url, i) => (
              <div
                key={url + i}
                draggable
                onDragStart={() => onDragStart(i)}
                onDragOver={(e) => onDragOver(e, i)}
                onDrop={() => onDrop(i)}
                onDragEnd={onDragEnd}
                style={{
                  position: "relative",
                  aspectRatio: "4/3",
                  borderRadius: 10,
                  overflow: "hidden",
                  cursor: "grab",
                  background: DA_SURFACE,
                  border: `1px solid ${DA_RULE}`,
                  boxShadow: i === 0 ? `0 0 0 2px ${DA_GOLD}` : "none",
                  opacity: dragOver === i ? 0.5 : 1,
                  outline: dragOver === i ? `2px dashed ${DA_GOLD}` : "none",
                  transition: "opacity 0.15s, outline 0.15s",
                }}
              >
                <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", pointerEvents: "none" }} />
                {i === 0 && (
                  <div style={{ position: "absolute", top: 6, left: 6, background: DA_GOLD, color: DA_SURFACE2, borderRadius: 5, padding: "2px 7px", fontSize: 9, fontWeight: 800, letterSpacing: ".4px" }}>
                    {heroBadge}
                  </div>
                )}
                <button
                  onClick={() => remove(i)}
                  style={{ position: "absolute", top: 4, right: 4, width: 20, height: 20, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "none", color: "white", fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      )}

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
          <input type="file" accept="image/*" multiple hidden onChange={handleFiles} disabled={uploading} />
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
          onSelect={(url) => onChange([...value, url])}
          lang={lang}
        />
      )}
    </div>
  );
}
