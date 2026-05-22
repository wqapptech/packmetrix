"use client";

import { useState } from "react";
import Icon from "@/components/Icon";
import { SAND } from "./constants";

function getBestMp4(video: any): string {
  const files: any[] = video.video_files || [];
  const hd = files.find((f) => f.quality === "hd" && f.file_type === "video/mp4");
  const sd = files.find((f) => f.file_type === "video/mp4");
  return (hd || sd)?.link || "";
}

export function PexelsVideoSearch({
  onSelect,
  lang,
}: {
  onSelect: (url: string) => void;
  lang: "en" | "ar";
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const searchLabel = lang === "ar" ? "بحث" : "Search";
  const noResults = lang === "ar" ? "لا توجد نتائج" : "No results";
  const useLabel = lang === "ar" ? "استخدام" : "Use";

  const search = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`/api/pexels/videos?query=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.videos || []);
    } catch {}
    setLoading(false);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
          placeholder={lang === "ar" ? "ابحث عن مقاطع فيديو…" : "Search for videos…"}
          style={{
            flex: 1,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 10,
            padding: "10px 14px",
            color: "var(--white)",
            fontSize: 13,
            fontFamily: "inherit",
            outline: "none",
          }}
          onFocus={(e) => (e.target.style.borderColor = `${SAND}60`)}
          onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
        />
        <button
          onClick={search}
          disabled={loading}
          style={{
            padding: "10px 18px",
            borderRadius: 10,
            background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
            color: "#0a1426",
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
            <span className="spinner" style={{ width: 13, height: 13, borderTopColor: "#0a1426" }} />
          ) : (
            <>
              <Icon name="video" size={13} color="#0a1426" />
              {searchLabel}
            </>
          )}
        </button>
      </div>

      {loading && (
        <div style={{ display: "flex", justifyContent: "center", padding: "24px 0" }}>
          <span className="spinner" style={{ borderTopColor: SAND }} />
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div style={{ textAlign: "center", padding: "24px 0", color: "rgba(255,255,255,0.35)", fontSize: 13 }}>
          {noResults}
        </div>
      )}

      {results.length > 0 && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
            {results.map((video) => {
              const mp4 = getBestMp4(video);
              return (
                <div
                  key={video.id}
                  onClick={() => mp4 && onSelect(mp4)}
                  style={{
                    position: "relative",
                    aspectRatio: "16/9",
                    borderRadius: 9,
                    overflow: "hidden",
                    cursor: mp4 ? "pointer" : "default",
                    background: "#0d1b2e",
                  }}
                  onMouseEnter={(e) => {
                    const o = e.currentTarget.querySelector(".px-ov") as HTMLElement;
                    if (o) o.style.opacity = "1";
                  }}
                  onMouseLeave={(e) => {
                    const o = e.currentTarget.querySelector(".px-ov") as HTMLElement;
                    if (o) o.style.opacity = "0";
                  }}
                >
                  <img src={video.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.25)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(255,255,255,0.88)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="#0d1b2e">
                        <polygon points="5,3 19,12 5,21" />
                      </svg>
                    </div>
                  </div>
                  <div
                    className="px-ov"
                    style={{
                      position: "absolute", inset: 0, background: "rgba(0,0,0,0.45)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexDirection: "column", gap: 6, opacity: 0, transition: "opacity .15s",
                    }}
                  >
                    <Icon name="check" size={18} color="#fff" strokeWidth={2.5} />
                    <span style={{ color: "#fff", fontSize: 11, fontWeight: 600 }}>{useLabel}</span>
                  </div>
                  <div style={{ position: "absolute", bottom: 6, right: 8, fontSize: 10, color: "rgba(255,255,255,0.85)", fontWeight: 600, background: "rgba(0,0,0,0.45)", borderRadius: 4, padding: "1px 5px" }}>
                    {Math.floor(video.duration)}s
                  </div>
                </div>
              );
            })}
          </div>
          <div style={{ marginTop: 8, fontSize: 10.5, color: "rgba(255,255,255,0.2)", textAlign: "right" }}>
            <a href="https://www.pexels.com" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Pexels</a>
            {" · "}
            <a href="https://pixabay.com" target="_blank" rel="noopener noreferrer" style={{ color: "rgba(255,255,255,0.3)", textDecoration: "none" }}>Pixabay</a>
          </div>
        </>
      )}
    </div>
  );
}
