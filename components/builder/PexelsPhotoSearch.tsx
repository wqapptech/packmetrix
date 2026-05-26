"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { SAND } from "./constants";
import {
  DA_BG, DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_GOLD, DA_GREEN,
} from "@/lib/tokens";

function interleave3<T>(a: T[], b: T[], c: T[]): T[] {
  const out: T[] = [];
  const len = Math.max(a.length, b.length, c.length);
  for (let i = 0; i < len; i++) {
    if (i < a.length) out.push(a[i]);
    if (i < b.length) out.push(b[i]);
    if (i < c.length) out.push(c[i]);
  }
  return out;
}

export function PexelsPhotoSearch({
  onSelect,
  placeholder,
  lang,
}: {
  onSelect: (url: string) => void;
  placeholder?: string;
  lang: "en" | "ar";
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchLabel = lang === "ar" ? "بحث" : "Search";
  const noResults = lang === "ar" ? "لا توجد نتائج" : "No results";
  const useLabel = lang === "ar" ? "استخدام" : "Use";
  const photoBy = lang === "ar" ? "صورة بواسطة" : "Photo by";
  const onUnsplash = lang === "ar" ? "على Unsplash" : "on Unsplash";

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const [pexelsRes, unsplashRes] = await Promise.allSettled([
        fetch(`/api/pexels/photos?query=${encodeURIComponent(query)}`).then(
          (r) => r.json()
        ),
        fetch(`/api/unsplash/photos?query=${encodeURIComponent(query)}`).then(
          (r) => r.json()
        ),
      ]);
      const pexels: any[] =
        pexelsRes.status === "fulfilled" ? pexelsRes.value.photos || [] : [];
      const rawUnsplash: any[] =
        unsplashRes.status === "fulfilled"
          ? unsplashRes.value.photos || []
          : [];
      const unsplash = rawUnsplash.map((p) => ({
        ...p,
        src: { medium: p.src.small, large: p.src.regular, large2x: p.src.regular },
        _unsplash: true,
      }));
      const px = pexels.filter((p: any) => !String(p.id).startsWith("pb_"));
      const pb = pexels.filter((p: any) => String(p.id).startsWith("pb_"));
      setResults(interleave3(px, pb, unsplash));
    } catch {}
    setLoading(false);
  };

  const handleSelect = (photo: any) => {
    if (photo._unsplash && photo.downloadLocation) {
      fetch("/api/unsplash/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ downloadLocation: photo.downloadLocation }),
      }).catch(() => {});
    }
    onSelect(photo.src.large2x || photo.src.large);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder={placeholder || (lang === "ar" ? "ابحث عن صور…" : "Search for photos…")}
          style={{
            flex: 1,
            background: DA_SURFACE,
            border: `1px solid ${DA_RULE}`,
            borderRadius: 10,
            padding: "10px 14px",
            color: DA_INK1,
            fontSize: 13,
            fontFamily: "inherit",
            outline: "none",
          }}
          onFocus={(e) => (e.target.style.borderColor = DA_GOLD)}
          onBlur={(e) => (e.target.style.borderColor = DA_RULE)}
        />
        <button
          onClick={search}
          disabled={loading}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
            color: DA_SURFACE2,
            fontWeight: 700,
            fontSize: 13,
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            display: "flex",
            alignItems: "center",
            gap: 7,
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? (
            <span className="spinner-warm" style={{ width: 13, height: 13, borderTopColor: DA_SURFACE2 }} />
          ) : (
            <>
              <Icon name="image" size={13} color={DA_SURFACE2} />
              {searchLabel}
            </>
          )}
        </button>
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
          <span className="spinner-warm" style={{ borderTopColor: DA_GOLD }} />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div style={{ textAlign: "center", padding: "24px 0", color: DA_INK3, fontSize: 13 }}>
          {noResults}
        </div>
      )}

      {results.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
            {results.map((photo) => (
              <div
                key={photo.id}
                onClick={() => handleSelect(photo)}
                title={photo.photographer}
                style={{ position: "relative", aspectRatio: "4/3", borderRadius: 9, overflow: "hidden", cursor: "pointer" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.outline = `2px solid ${DA_GOLD}`;
                  const o = e.currentTarget.querySelector(".px-ov") as HTMLElement;
                  if (o) o.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.outline = "none";
                  const o = e.currentTarget.querySelector(".px-ov") as HTMLElement;
                  if (o) o.style.opacity = "0";
                }}
              >
                <img src={photo.src.medium} alt={photo.alt} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                <div
                  className="px-ov"
                  style={{
                    position: "absolute", inset: 0, background: "rgba(0,0,0,0.48)",
                    display: "flex", flexDirection: "column", alignItems: "center",
                    justifyContent: "center", gap: 5, opacity: 0, transition: "opacity .15s", padding: 8,
                  }}
                >
                  <Icon name="check" size={18} color={DA_GREEN} strokeWidth={2.5} />
                  <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>{useLabel}</span>
                  {photo._unsplash && (
                    <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.6)", textAlign: "center", lineHeight: 1.4 }}>
                      {photoBy}{" "}
                      <a
                        href={`${photo.photographerUrl}?utm_source=packmetrix&utm_medium=referral`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        style={{ color: "rgba(255,255,255,0.85)", textDecoration: "underline" }}
                      >
                        {photo.photographer}
                      </a>{" "}
                      {onUnsplash}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, fontSize: 10.5, color: DA_INK3, textAlign: "right" }}>
            <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" style={{ color: DA_INK3, textDecoration: "none" }}>Pexels</a>
            {" · "}
            <a href="https://unsplash.com/?utm_source=packmetrix&utm_medium=referral" target="_blank" rel="noopener noreferrer" style={{ color: DA_INK3, textDecoration: "none" }}>Unsplash</a>
          </div>
        </>
      )}
    </div>
  );
}
