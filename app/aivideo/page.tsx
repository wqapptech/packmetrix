"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";
import Icon from "@/components/Icon";

const SAND = "#e8c97b";

const VIDEO_STYLES = [
  { id: "cinematic", label: "Cinematic",   desc: "Wide shots, slow transitions, dramatic captions" },
  { id: "social",    label: "Social Reel", desc: "Fast cuts, text overlays, trending aesthetic" },
  { id: "luxury",    label: "Luxury",      desc: "Elegant pacing, gold tones, premium feel" },
  { id: "adventure", label: "Adventure",   desc: "Dynamic energy, bold typography, action music" },
];

const MUSIC_OPTIONS = ["Upbeat", "Cinematic", "Tropical", "Acoustic", "No music"];

type StyleId = "cinematic" | "social" | "luxury" | "adventure";

const STYLE_CONFIGS: Record<StyleId, { bg: string; caption: string; sub: string; serif: boolean }> = {
  cinematic: { bg: "linear-gradient(160deg,#1a0d08,#c9713a)", caption: "Escape to Your Destination", sub: "5 days from €899",   serif: true  },
  social:    { bg: "linear-gradient(135deg,#ff6b35,#f7c59f)",  caption: "DESTINATION 🔥",              sub: "5 Days · From €899", serif: false },
  luxury:    { bg: "linear-gradient(160deg,#1a1208,#c4a84f)",  caption: "A Destination Escape",         sub: "An Exclusive Journey", serif: true },
  adventure: { bg: "linear-gradient(160deg,#0d2e1b,#25d366)",  caption: "DISCOVER THE WORLD",           sub: "FROM €899 · BOOK NOW", serif: false },
};

const GEN_STEPS = [
  "Analysing package content…",
  "Selecting best images…",
  "Generating scene transitions…",
  "Adding captions & music…",
  "Rendering final video…",
];

function VideoMockup({ styleId, duration }: { styleId: StyleId; duration: number }) {
  const cfg = STYLE_CONFIGS[styleId];
  return (
    <div style={{
      width: "100%", aspectRatio: "9/16",
      background: cfg.bg, borderRadius: 18,
      position: "relative", overflow: "hidden",
      border: "1px solid rgba(255,255,255,0.1)",
      boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
    }}>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 18 }}>
        {cfg.serif && <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.22)" }} />}
        <div style={{ position: "relative" }}>
          <div style={{
            fontFamily: cfg.serif ? "var(--font-dm-serif), 'DM Serif Display', serif" : "var(--font-dm-sans), 'DM Sans', sans-serif",
            fontSize: 20, color: "white", lineHeight: 1.2, marginBottom: 5,
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}>{cfg.caption}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)" }}>{cfg.sub}</div>
          <div style={{ marginTop: 12, background: SAND, color: "#0d1b2e", borderRadius: 8, padding: "7px 14px", fontSize: 11, fontWeight: 700, display: "inline-block" }}>
            Book via WhatsApp
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", width: 44, height: 44, borderRadius: "50%", background: "rgba(255,255,255,0.18)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
      </div>
      <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(0,0,0,0.45)", borderRadius: 99, padding: "3px 10px", fontSize: 10, color: "rgba(255,255,255,0.7)" }}>
        {duration}s
      </div>
    </div>
  );
}

export default function AIVideoPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [phase, setPhase] = useState<"config" | "generating" | "done">("config");
  const [styleId, setStyleId] = useState<StyleId>("cinematic");
  const [music, setMusic] = useState("upbeat");
  const [duration, setDuration] = useState(60);
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push("/login"); return; }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  const handleGenerate = () => {
    setPhase("generating");
    setProgress(0);
    let p = 0;
    intervalRef.current = setInterval(() => {
      p += Math.random() * 8 + 2;
      if (p >= 100) {
        p = 100;
        clearInterval(intervalRef.current!);
        setTimeout(() => setPhase("done"), 400);
      }
      setProgress(Math.min(p, 100));
    }, 220);
  };

  const currentStep = Math.floor((progress / 100) * GEN_STEPS.length);

  if (authLoading) {
    return (
      <AppLayout>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="spinner" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ flex: 1, overflow: "auto", padding: "36px 52px" }}>
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 32 }}>
          <div>
            <button onClick={() => router.push("/builder")} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.35)", fontSize: 12, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, marginBottom: 10 }}>
              <Icon name="arrow_left" size={12} /> Back to builder
            </button>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4, display: "flex", alignItems: "center", gap: 10 }}>
              <Icon name="video" size={20} color={SAND} /> AI Marketing Video
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Generate a promo video from your package details</p>
          </div>
          <div style={{ background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", borderRadius: 10, padding: "8px 14px", display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="sparkle" size={13} color="#f5a623" />
            <span style={{ fontSize: 12, color: "#f5a623", fontWeight: 600 }}>Pro Feature</span>
          </div>
        </div>

        {phase === "config" && (
          <div style={{ display: "flex", gap: 36 }}>
            {/* Config panel */}
            <div style={{ flex: 1, maxWidth: 500 }}>
              {/* Source package stub */}
              <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "16px 18px", marginBottom: 24, display: "flex", gap: 14, alignItems: "center" }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: "linear-gradient(135deg,#c9713a,#6b3518)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="map" size={18} color="rgba(255,255,255,0.8)" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>Your latest package</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Ready to generate promo video</div>
                </div>
                <Icon name="check" size={16} color="#2dd4a0" strokeWidth={2.5} />
              </div>

              {/* Style picker */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Video Style</div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {VIDEO_STYLES.map(vs => (
                    <button key={vs.id} onClick={() => setStyleId(vs.id as StyleId)} style={{
                      padding: "12px 14px", borderRadius: 12, textAlign: "left",
                      background: styleId === vs.id ? `${SAND}15` : "rgba(255,255,255,0.03)",
                      border: `1px solid ${styleId === vs.id ? SAND + "60" : "rgba(255,255,255,0.08)"}`,
                      cursor: "pointer", fontFamily: "inherit",
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: styleId === vs.id ? SAND : "rgba(255,255,255,0.75)", marginBottom: 3 }}>{vs.label}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", lineHeight: 1.4 }}>{vs.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Music */}
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Background Music</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {MUSIC_OPTIONS.map(m => (
                    <button key={m} onClick={() => setMusic(m.toLowerCase())} style={{
                      padding: "7px 14px", borderRadius: 99,
                      background: music === m.toLowerCase() ? `${SAND}18` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${music === m.toLowerCase() ? SAND + "50" : "rgba(255,255,255,0.08)"}`,
                      color: music === m.toLowerCase() ? SAND : "rgba(255,255,255,0.45)",
                      fontSize: 12, fontFamily: "inherit", cursor: "pointer",
                      fontWeight: music === m.toLowerCase() ? 600 : 400,
                    }}>{m}</button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div style={{ marginBottom: 28 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Duration</div>
                <div style={{ display: "flex", gap: 8 }}>
                  {[30, 60, 90].map(d => (
                    <button key={d} onClick={() => setDuration(d)} style={{
                      padding: "8px 20px", borderRadius: 99,
                      background: duration === d ? `${SAND}18` : "rgba(255,255,255,0.04)",
                      border: `1px solid ${duration === d ? SAND + "50" : "rgba(255,255,255,0.08)"}`,
                      color: duration === d ? SAND : "rgba(255,255,255,0.45)",
                      fontSize: 13, fontFamily: "inherit", cursor: "pointer",
                      fontWeight: duration === d ? 600 : 400,
                    }}>{d}s</button>
                  ))}
                </div>
              </div>

              <button onClick={handleGenerate} style={{
                width: "100%", padding: "13px",
                background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
                border: "none", borderRadius: 12,
                fontSize: 14, fontWeight: 700, color: "#0d1b2e",
                fontFamily: "inherit", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}>
                <Icon name="sparkle" size={16} color="#0d1b2e" strokeWidth={2.5} />
                Generate {duration}s Video
              </button>
            </div>

            {/* Preview */}
            <div style={{ width: 260, flexShrink: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 12 }}>Preview Concept</div>
              <VideoMockup styleId={styleId} duration={duration} />
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginTop: 10, textAlign: "center", lineHeight: 1.5 }}>
                Actual output uses your uploaded images and package details
              </div>
            </div>
          </div>
        )}

        {phase === "generating" && (
          <div className="fade-in" style={{ maxWidth: 520, margin: "0 auto", textAlign: "center", paddingTop: 40 }}>
            {/* Animated phone frame */}
            <div style={{
              width: 280, height: 500, margin: "0 auto 32px",
              background: "linear-gradient(160deg, #c9713a, #1a0d08)",
              borderRadius: 24, position: "relative", overflow: "hidden",
              border: "2px solid rgba(255,255,255,0.1)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
            }}>
              {/* Scan line */}
              <div style={{
                position: "absolute", left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, transparent, ${SAND}, transparent)`,
                top: `${progress}%`, transition: "top 0.3s",
                boxShadow: `0 0 12px ${SAND}`,
              }} />
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 20 }}>
                <div className="shimmer-bg" style={{ height: 28, width: "70%", borderRadius: 6, marginBottom: 8, background: "rgba(255,255,255,0.15)" }} />
                <div className="shimmer-bg" style={{ height: 14, width: "50%", borderRadius: 4, background: "rgba(255,255,255,0.1)" }} />
              </div>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Generating your video…</h3>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>
              {GEN_STEPS[Math.min(currentStep, GEN_STEPS.length - 1)]}
            </p>
            <div style={{ height: 6, background: "rgba(255,255,255,0.08)", borderRadius: 99, overflow: "hidden", maxWidth: 320, margin: "0 auto" }}>
              <div style={{ height: "100%", borderRadius: 99, background: `linear-gradient(90deg, ${SAND}, #c4a84f)`, width: `${progress}%`, transition: "width 0.3s" }} />
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 8 }}>{Math.round(progress)}%</div>
          </div>
        )}

        {phase === "done" && (
          <div className="fade-in" style={{ maxWidth: 560, margin: "0 auto", textAlign: "center", paddingTop: 20 }}>
            <div style={{ fontSize: 13, color: "#2dd4a0", fontWeight: 600, marginBottom: 16, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
              <Icon name="check" size={14} color="#2dd4a0" strokeWidth={2.5} /> Video ready!
            </div>

            {/* Video player mockup */}
            <div style={{
              width: 280, height: 500, margin: "0 auto 24px",
              background: "linear-gradient(160deg, #c9713a 0%, #3d1a08 60%, #0d1b2e 100%)",
              borderRadius: 24, position: "relative", overflow: "hidden",
              border: "2px solid rgba(255,255,255,0.12)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
              cursor: "pointer",
            }}>
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 56, height: 56, borderRadius: "50%", background: "rgba(255,255,255,0.2)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
              </div>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "flex-end", padding: 20 }}>
                <div style={{ background: "rgba(0,0,0,0.4)", borderRadius: 12, padding: "12px 14px", backdropFilter: "blur(6px)" }}>
                  <div style={{ fontFamily: "var(--font-dm-serif), 'DM Serif Display', serif", fontSize: 18, color: "white", marginBottom: 4 }}>Your Package Video</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>From €899 · Promo reel</div>
                </div>
              </div>
              <div style={{ position: "absolute", top: 14, right: 14, background: "rgba(0,0,0,0.5)", borderRadius: 99, padding: "3px 10px", fontSize: 11, color: "rgba(255,255,255,0.7)" }}>
                {duration}s
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 20 }}>
              {[
                { icon: "link" as const, label: "Copy link", primary: true },
                { icon: "copy" as const, label: "Download", primary: false },
                { icon: "whatsapp" as const, label: "Share", primary: false },
              ].map((a, i) => (
                <button key={i} style={{
                  padding: "9px 16px", borderRadius: 10,
                  background: a.primary ? `linear-gradient(135deg, ${SAND}, #c4a84f)` : "rgba(255,255,255,0.06)",
                  border: a.primary ? "none" : "1px solid rgba(255,255,255,0.1)",
                  color: a.primary ? "#0d1b2e" : "rgba(255,255,255,0.65)",
                  fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <Icon name={a.icon} size={13} color={a.primary ? "#0d1b2e" : "rgba(255,255,255,0.65)"} /> {a.label}
                </button>
              ))}
            </div>

            <button onClick={() => router.push("/builder")} style={{
              padding: "10px 28px", borderRadius: 10,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              color: "rgba(255,255,255,0.6)", fontSize: 13, fontFamily: "inherit", cursor: "pointer",
            }}>
              Continue to publish →
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
