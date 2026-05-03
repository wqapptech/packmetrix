"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Icon from "@/components/Icon";

type ItineraryDay = { day: number; title: string; desc: string };
type PricingTier = { label: string; price: string };
type Airport = { name: string; price: string };

type PackageData = {
  id: string;
  destination: string;
  price: string;
  nights?: string | number;
  description: string;
  includes?: string[];
  excludes?: string[];
  advantages?: string[];
  airports?: Airport[];
  itinerary?: ItineraryDay[];
  pricingTiers?: PricingTier[];
  cancellation?: string;
  whatsapp?: string;
  messenger?: string;
};

// Default agency branding — in a real app this comes from the agency's profile
const AGENCY = {
  name: "Viagens Horizonte",
  tagline: "Experts in curated travel experiences since 2008",
  primaryColor: "#c9713a",
  website: "www.viagenshorizonte.pt",
  phone: "+351 21 345 6789",
  instagram: "@viagenshorizonte",
};

function AgencyLogo({ color = "#c9713a", size = 32 }: { color?: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <circle cx="20" cy="22" r="9" fill={color} opacity="0.9" />
      <rect x="4" y="29" width="32" height="3" rx="1.5" fill={color} />
      <line x1="20" y1="4" x2="20" y2="10" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <line x1="8" y1="8" x2="12" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="8" x2="28" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function ImgPlaceholder({ label, height = 220, color = "#c9713a", rounded = 14 }: { label: string; height?: number; color?: string; rounded?: number }) {
  const id = label.replace(/\s/g, "-").toLowerCase();
  return (
    <div style={{ width: "100%", height, borderRadius: rounded, overflow: "hidden", position: "relative", background: `${color}18`, border: `1px solid ${color}20`, flexShrink: 0 }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
        <defs>
          <pattern id={`stripe-${id}`} width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="6" height="12" fill={`${color}14`} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#stripe-${id})`} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Icon name="image" size={22} color={`${color}60`} />
        <span style={{ fontSize: 10, color: `${color}80`, fontFamily: "monospace", textAlign: "center", padding: "0 12px", lineHeight: 1.4 }}>{label}</span>
      </div>
    </div>
  );
}

function VideoPlaceholder({ height = 220, rounded = 14 }: { height?: number; rounded?: number }) {
  return (
    <div style={{ width: "100%", height, borderRadius: rounded, overflow: "hidden", position: "relative", background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.08)", flexShrink: 0 }}>
      <svg width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.12 }}>
        <defs>
          <pattern id="vid-stripe" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
            <rect width="7" height="14" fill="rgba(255,255,255,0.3)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#vid-stripe)" />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
        </div>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", fontFamily: "monospace", textAlign: "center", padding: "0 16px", lineHeight: 1.5 }}>promo reel · AI-generated video</span>
      </div>
    </div>
  );
}

function LandingSection({ title, children, brandColor }: { title: string; children: React.ReactNode; brandColor: string }) {
  return (
    <div style={{ marginBottom: 56 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <div style={{ width: 3, height: 24, borderRadius: 99, background: brandColor, flexShrink: 0 }} />
        <h2 style={{ fontFamily: "var(--font-dm-serif), 'DM Serif Display', serif", fontSize: 24, color: "#0d1b2e", lineHeight: 1 }}>{title}</h2>
      </div>
      {children}
    </div>
  );
}

export default function PackagePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [data, setData] = useState<PackageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeDay, setActiveDay] = useState(0);

  useEffect(() => {
    const load = async () => {
      if (!id || id === "undefined") { router.push("/builder"); return; }
      try {
        const ref = doc(db, "packages", id);
        const snap = await getDoc(ref);
        if (!snap.exists()) { router.push("/builder"); return; }
        setData({ id: snap.id, ...snap.data() } as PackageData);
      } catch (err) {
        console.error("Firestore error:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, router]);

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#fdfcf9", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ borderTopColor: AGENCY.primaryColor }} />
      </div>
    );
  }

  if (!data) return null;

  const brandColor = AGENCY.primaryColor;
  const includes = data.includes?.length ? data.includes : (data.advantages || []);
  const excludes = data.excludes || [];
  const airports = data.airports || [];
  const itinerary = data.itinerary || [];
  const pricingTiers = data.pricingTiers || [];
  const nights = data.nights ? Number(data.nights) : null;
  const whatsappHref = data.whatsapp ? `https://wa.me/${data.whatsapp.replace(/\D/g, "")}` : "#";
  const messengerHref = data.messenger
    ? `https://${data.messenger.startsWith("m.me") ? "" : "m.me/"}${data.messenger}`
    : "#";

  return (
    <div style={{ minHeight: "100vh", background: "#fdfcf9", color: "#0d1b2e", fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}>

      {/* ── AGENCY HEADER BAR ────────────────────────────────────────────────── */}
      <div style={{
        background: brandColor,
        padding: "10px 48px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AgencyLogo color="white" size={28} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "white", letterSpacing: "-0.2px" }}>{AGENCY.name}</div>
            <div style={{ fontSize: 10, color: "rgba(255,255,255,0.7)" }}>{AGENCY.tagline}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 5 }}>
            <Icon name="link" size={11} color="rgba(255,255,255,0.6)" /> {AGENCY.website}
          </span>
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.75)", display: "flex", alignItems: "center", gap: 5 }}>
            <Icon name="star" size={11} color="rgba(255,255,255,0.6)" /> {AGENCY.instagram}
          </span>
          {data.whatsapp && (
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" style={{
              background: "rgba(255,255,255,0.2)", backdropFilter: "blur(4px)",
              borderRadius: 8, padding: "6px 14px",
              fontSize: 12, fontWeight: 700, color: "white", textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.3)",
            }}>Contact us</a>
          )}
        </div>
      </div>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <div style={{
        height: 480, position: "relative", overflow: "hidden",
        display: "flex", flexDirection: "column", justifyContent: "flex-end",
        padding: "0 56px 48px",
      }}>
        {/* Cover image placeholder background */}
        <div style={{ position: "absolute", inset: 0 }}>
          <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
            <defs>
              <pattern id="hero-stripe" width="16" height="16" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                <rect width="8" height="16" fill={`${brandColor}22`} />
              </pattern>
              <linearGradient id="hero-fade" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f5e4c8" stopOpacity="1" />
                <stop offset="100%" stopColor={brandColor} stopOpacity="0.85" />
              </linearGradient>
            </defs>
            <rect width="100%" height="100%" fill="url(#hero-fade)" />
            <rect width="100%" height="100%" fill="url(#hero-stripe)" />
          </svg>
          <div style={{ position: "absolute", top: 16, right: 16, background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", borderRadius: 8, padding: "5px 10px", fontSize: 10, color: "rgba(255,255,255,0.7)", fontFamily: "monospace", display: "flex", alignItems: "center", gap: 5 }}>
            <Icon name="image" size={10} color="rgba(255,255,255,0.6)" /> cover photo · {data.destination}
          </div>
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(13,10,6,0.72) 0%, transparent 55%)" }} />
        </div>

        {/* Hero content */}
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
            {nights && (
              <span style={{ background: "rgba(255,255,255,0.18)", backdropFilter: "blur(8px)", borderRadius: 99, padding: "5px 12px", fontSize: 12, color: "white" }}>
                {nights} Days
              </span>
            )}
            <span style={{ background: brandColor, backdropFilter: "blur(8px)", borderRadius: 99, padding: "5px 12px", fontSize: 12, color: "white", fontWeight: 700 }}>
              From {data.price}
            </span>
          </div>
          <h1 style={{
            fontFamily: "var(--font-dm-serif), 'DM Serif Display', serif",
            fontSize: 56, color: "white", lineHeight: 1.05,
            marginBottom: 14, textShadow: "0 2px 24px rgba(0,0,0,0.5)",
          }}>
            {data.destination}
          </h1>
          {data.description && (
            <p style={{ fontSize: 16, color: "rgba(255,255,255,0.75)", maxWidth: 500, lineHeight: 1.65 }}>
              {data.description}
            </p>
          )}
        </div>
      </div>

      {/* ── STICKY NAV BAR (branded) ──────────────────────────────────────────── */}
      <div style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(253,252,249,0.97)", backdropFilter: "blur(14px)",
        borderBottom: `2px solid ${brandColor}30`,
        padding: "12px 48px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
          <AgencyLogo color={brandColor} size={22} />
          <span style={{ fontSize: 13, fontWeight: 700, color: brandColor, marginLeft: 8 }}>{AGENCY.name}</span>
          <span style={{ width: 1, height: 16, background: "rgba(13,27,46,0.12)", margin: "0 16px" }} />
          {nights && (
            <div style={{ marginRight: 20 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(13,27,46,0.35)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Duration</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0d1b2e" }}>{nights} days / {nights - 1} nights</div>
            </div>
          )}
          {airports.length > 0 && (
            <div style={{ marginRight: 20 }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(13,27,46,0.35)", textTransform: "uppercase", letterSpacing: "0.5px" }}>Departure</div>
              <div style={{ fontSize: 12, fontWeight: 600, color: "#0d1b2e" }}>{airports.map(a => a.name.split(" ")[0]).join(", ")}</div>
            </div>
          )}
          <div style={{ marginRight: 20 }}>
            <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(13,27,46,0.35)", textTransform: "uppercase", letterSpacing: "0.5px" }}>From</div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "#0d1b2e" }}>{data.price}</div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          {data.whatsapp && (
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" style={{
              background: "#25d366", color: "white", borderRadius: 9, padding: "9px 18px",
              fontSize: 13, fontWeight: 700, textDecoration: "none",
              display: "flex", alignItems: "center", gap: 7,
            }}>
              <Icon name="whatsapp" size={14} color="white" /> Book via WhatsApp
            </a>
          )}
          {data.messenger && (
            <a href={messengerHref} target="_blank" rel="noopener noreferrer" style={{
              background: "#0084ff", color: "white", borderRadius: 9, padding: "9px 18px",
              fontSize: 13, fontWeight: 700, textDecoration: "none",
            }}>Messenger</a>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1020, margin: "0 auto", padding: "56px 40px 80px" }}>

        {/* ── MEDIA GALLERY ──────────────────────────────────────────────────── */}
        <LandingSection title="Photos & Video" brandColor={brandColor}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "220px 160px", gap: 10, marginBottom: 10 }}>
            <div style={{ gridRow: "1 / 3", gridColumn: "1 / 2" }}>
              <ImgPlaceholder label={"cover photo\n" + data.destination} height={390} color={brandColor} />
            </div>
            <div style={{ gridColumn: "2 / 4" }}>
              <VideoPlaceholder height={220} />
            </div>
            <ImgPlaceholder label="gallery · destination view" height={160} color={brandColor} />
            <ImgPlaceholder label="gallery · local culture" height={160} color={brandColor} />
          </div>
          <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 }}>
            {["Landmark view", "Local cuisine", "Hotel room", "Day excursion", "Sunset scene"].map((label, i) => (
              <div key={i} style={{ width: 110, height: 72, borderRadius: 8, overflow: "hidden", flexShrink: 0, position: "relative", background: `${brandColor}18`, border: `1px solid ${brandColor}20` }}>
                <svg width="100%" height="100%" style={{ position: "absolute", inset: 0 }}>
                  <defs>
                    <pattern id={`thumb-${i}`} width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                      <rect width="5" height="10" fill={`${brandColor}14`} />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill={`url(#thumb-${i})`} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: 9, color: `${brandColor}80`, textAlign: "center", lineHeight: 1.3, padding: "0 6px", fontFamily: "monospace" }}>{label}</span>
                </div>
              </div>
            ))}
            <div style={{ width: 110, height: 72, borderRadius: 8, flexShrink: 0, background: `${brandColor}12`, border: `1px dashed ${brandColor}30`, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <span style={{ fontSize: 11, color: `${brandColor}80`, textAlign: "center", lineHeight: 1.4 }}>+3 more</span>
            </div>
          </div>
        </LandingSection>

        {/* ── PRICING TIERS ──────────────────────────────────────────────────── */}
        {pricingTiers.length > 0 && (
          <LandingSection title="Choose Your Package" brandColor={brandColor}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(pricingTiers.length, 3)}, 1fr)`, gap: 16 }}>
              {pricingTiers.map((tier, i) => (
                <div key={i} style={{
                  background: i === 0 ? `linear-gradient(135deg, ${brandColor}, #8b4513)` : "rgba(13,27,46,0.03)",
                  border: `1px solid ${i === 0 ? "transparent" : "rgba(13,27,46,0.1)"}`,
                  borderRadius: 16, padding: "24px 22px", position: "relative", overflow: "hidden",
                }}>
                  {i === 0 && <div style={{ position: "absolute", top: 12, right: 12, background: "rgba(255,255,255,0.22)", borderRadius: 99, padding: "3px 10px", fontSize: 10, fontWeight: 700, color: "white" }}>MOST POPULAR</div>}
                  <div style={{ fontSize: 13, fontWeight: 600, color: i === 0 ? "rgba(255,255,255,0.7)" : "rgba(13,27,46,0.5)", marginBottom: 14 }}>{tier.label}</div>
                  <div style={{ fontSize: 38, fontWeight: 800, color: i === 0 ? "white" : "#0d1b2e", letterSpacing: "-1px", lineHeight: 1 }}>{tier.price}</div>
                  <div style={{ fontSize: 11, color: i === 0 ? "rgba(255,255,255,0.5)" : "rgba(13,27,46,0.4)", marginBottom: 18 }}>per person</div>
                  {data.whatsapp && (
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer" style={{
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                      background: i === 0 ? "rgba(255,255,255,0.2)" : brandColor,
                      color: "white", textDecoration: "none", borderRadius: 9, padding: "9px",
                      fontSize: 12, fontWeight: 700,
                    }}>
                      <Icon name="whatsapp" size={13} color="white" /> Book this option
                    </a>
                  )}
                </div>
              ))}
            </div>
          </LandingSection>
        )}

        {/* ── WHAT'S INCLUDED ────────────────────────────────────────────────── */}
        {(includes.length > 0 || excludes.length > 0) && (
          <LandingSection title="What's Included" brandColor={brandColor}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28 }}>
              {includes.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#2dd4a0", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.6px" }}>Included</div>
                  {includes.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 11, alignItems: "flex-start" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(45,212,160,0.12)", border: "1px solid rgba(45,212,160,0.28)", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="check" size={10} color="#2dd4a0" strokeWidth={2.5} />
                      </div>
                      <span style={{ fontSize: 13, color: "rgba(13,27,46,0.72)", lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}
              {excludes.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.6px" }}>Not Included</div>
                  {excludes.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 11, alignItems: "flex-start" }}>
                      <div style={{ width: 20, height: 20, borderRadius: "50%", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", flexShrink: 0, marginTop: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="x" size={10} color="#ef4444" strokeWidth={2.5} />
                      </div>
                      <span style={{ fontSize: 13, color: "rgba(13,27,46,0.5)", lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </LandingSection>
        )}

        {/* ── DAY-BY-DAY ITINERARY (vertical timeline) ──────────────────────── */}
        {itinerary.length > 0 && (
          <LandingSection title="Day-by-Day Itinerary" brandColor={brandColor}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {itinerary.map((day, i) => (
                <div
                  key={i}
                  onClick={() => setActiveDay(activeDay === i ? -1 : i)}
                  style={{
                    display: "flex", gap: 18,
                    borderLeft: `2px solid ${i <= activeDay ? brandColor : "rgba(13,27,46,0.1)"}`,
                    paddingLeft: 24, paddingTop: 4, paddingBottom: 20,
                    transition: "border-color 0.2s",
                    position: "relative", cursor: "pointer",
                  }}
                >
                  <div style={{
                    position: "absolute", left: -10, top: 4,
                    width: 18, height: 18, borderRadius: "50%",
                    background: i <= activeDay ? brandColor : "rgba(13,27,46,0.08)",
                    border: `2px solid ${i <= activeDay ? brandColor : "rgba(13,27,46,0.15)"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    transition: "all 0.2s",
                  }}>
                    {i < activeDay && <Icon name="check" size={8} color="white" strokeWidth={3} />}
                    {i === activeDay && <div style={{ width: 6, height: 6, borderRadius: "50%", background: "white" }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
                        <span style={{ fontSize: 11, fontWeight: 800, color: brandColor }}>DAY {day.day}</span>
                        <span style={{ fontSize: 15, fontWeight: 700, color: "#0d1b2e" }}>{day.title}</span>
                      </div>
                      <span style={{
                        fontSize: 12, color: "rgba(13,27,46,0.3)",
                        display: "inline-block", transition: "transform 0.2s",
                        transform: activeDay === i ? "rotate(180deg)" : "rotate(0)",
                      }}>▾</span>
                    </div>
                    {activeDay === i && (
                      <p style={{ fontSize: 13, color: "rgba(13,27,46,0.6)", lineHeight: 1.7, marginTop: 8, paddingRight: 32 }}>
                        {day.desc}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </LandingSection>
        )}

        {/* ── DEPARTURE OPTIONS ──────────────────────────────────────────────── */}
        {airports.length > 0 && (
          <LandingSection title="Departure Options" brandColor={brandColor}>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(airports.length, 3)}, 1fr)`, gap: 12 }}>
              {airports.map((a, i) => (
                <div key={i} style={{
                  background: i === 0 ? `${brandColor}08` : "rgba(13,27,46,0.03)",
                  border: `1px solid ${i === 0 ? brandColor + "25" : "rgba(13,27,46,0.08)"}`,
                  borderRadius: 13, padding: "18px 20px",
                }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#0d1b2e", marginBottom: 2 }}>{a.name}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: brandColor, letterSpacing: "-0.5px", marginBottom: 10 }}>{a.price}</div>
                  {data.whatsapp && (
                    <a href={whatsappHref} target="_blank" rel="noopener noreferrer" style={{
                      display: "flex", alignItems: "center", gap: 5,
                      fontSize: 12, color: brandColor, fontWeight: 600, textDecoration: "none",
                    }}>
                      <Icon name="whatsapp" size={12} color={brandColor} /> Book this flight →
                    </a>
                  )}
                </div>
              ))}
            </div>
          </LandingSection>
        )}

        {/* ── CANCELLATION POLICY ────────────────────────────────────────────── */}
        {data.cancellation && (
          <div style={{ background: "rgba(45,212,160,0.06)", border: "1px solid rgba(45,212,160,0.2)", borderRadius: 12, padding: "16px 20px", marginBottom: 56, display: "flex", gap: 12, alignItems: "center" }}>
            <Icon name="check" size={18} color="#2dd4a0" strokeWidth={2} />
            <span style={{ fontSize: 14, color: "rgba(13,27,46,0.7)" }}>{data.cancellation}</span>
          </div>
        )}

        {/* ── AGENCY FOOTER CTA ──────────────────────────────────────────────── */}
        <div style={{
          background: `linear-gradient(135deg, ${brandColor} 0%, #6b3518 100%)`,
          borderRadius: 22, overflow: "hidden", position: "relative",
          padding: "44px 52px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          gap: 32,
        }}>
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.07 }} viewBox="0 0 80 80" preserveAspectRatio="xMidYMid slice">
            <defs><pattern id="geo-cta" width="40" height="40" patternUnits="userSpaceOnUse"><polygon points="20,0 40,10 40,30 20,40 0,30 0,10" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#geo-cta)" />
          </svg>
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
              <AgencyLogo color="rgba(255,255,255,0.85)" size={24} />
              <span style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.8)" }}>{AGENCY.name}</span>
            </div>
            <div style={{ fontFamily: "var(--font-dm-serif), 'DM Serif Display', serif", fontSize: 30, color: "white", marginBottom: 8, lineHeight: 1.2 }}>
              Ready to explore {data.destination}?
            </div>
            <div style={{ fontSize: 14, color: "rgba(255,255,255,0.6)", marginBottom: 6 }}>
              Contact us to reserve your spot today
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>
              {AGENCY.phone} · {AGENCY.website}
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative", flexShrink: 0 }}>
            {data.whatsapp && (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" style={{
                background: "#25d366", color: "white", borderRadius: 12, padding: "14px 28px",
                fontSize: 15, fontWeight: 700, textDecoration: "none",
                display: "flex", alignItems: "center", gap: 10,
                boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
              }}>
                <Icon name="whatsapp" size={18} color="white" /> Book via WhatsApp
              </a>
            )}
            {data.messenger && (
              <a href={messengerHref} target="_blank" rel="noopener noreferrer" style={{
                background: "rgba(255,255,255,0.18)", color: "white", borderRadius: 12, padding: "12px 28px",
                fontSize: 14, fontWeight: 600, textDecoration: "none",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.25)",
              }}>
                Message on Messenger
              </a>
            )}
            {!data.whatsapp && !data.messenger && (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Contact info not set — edit in the Builder.</div>
            )}
          </div>
        </div>

        {/* ── AGENCY FOOTER ──────────────────────────────────────────────────── */}
        <div style={{
          marginTop: 40, paddingTop: 28, borderTop: "1px solid rgba(13,27,46,0.08)",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AgencyLogo color={brandColor} size={26} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#0d1b2e" }}>{AGENCY.name}</div>
              <div style={{ fontSize: 11, color: "rgba(13,27,46,0.4)" }}>{AGENCY.tagline}</div>
            </div>
          </div>
          <div style={{ fontSize: 11, color: "rgba(13,27,46,0.3)", textAlign: "right" }}>
            <div>{AGENCY.phone} · {AGENCY.website}</div>
            <div style={{ marginTop: 3 }}>Page powered by PackMetrics</div>
          </div>
        </div>
      </div>
    </div>
  );
}
