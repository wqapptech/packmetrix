"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Icon from "@/components/Icon";

type ItineraryDay = { day: number; title: string; desc: string };
type PricingTier  = { label: string; price: string };
type Airport      = { name: string; price: string };

type PackageData = {
  id: string; userId: string;
  destination: string; price: string; nights?: string | number; description: string;
  includes?: string[]; excludes?: string[]; advantages?: string[];
  airports?: Airport[]; itinerary?: ItineraryDay[]; pricingTiers?: PricingTier[];
  cancellation?: string; whatsapp?: string; messenger?: string;
  coverImage?: string; images?: string[]; videoUrl?: string;
};

type AgencyProfile = { name: string; tagline?: string; email: string; logoUrl?: string; brandColor?: string };

const DEFAULT_BRAND = "#1f5f8e";
const BG  = "#fdfcf9";
const INK = "#0d1b2e";
const BORDER = "rgba(13,27,46,0.08)";
const MUTED  = "rgba(13,27,46,0.55)";
const SUPER_MUTED = "rgba(13,27,46,0.35)";

function AgencyMark({ logoUrl, color = DEFAULT_BRAND, size = 32 }: { logoUrl?: string; color?: string; size?: number }) {
  if (logoUrl) return <img src={logoUrl} alt="" style={{ width: size, height: size, objectFit: "contain", borderRadius: 6 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.4, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
      {String(size)}
    </div>
  );
}

function WAButton({ onClick, label = "Book via WhatsApp", size = "lg" }: { onClick: () => void; label?: string; size?: "sm" | "lg" }) {
  const pad = size === "lg" ? "14px 24px" : "9px 18px";
  const fs = size === "lg" ? 15 : 13;
  return (
    <button onClick={onClick} style={{
      background: "#25d366", color: "#fff", border: "none", borderRadius: 10,
      padding: pad, fontSize: fs, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
      display: "flex", alignItems: "center", gap: 9,
      boxShadow: size === "lg" ? "0 8px 24px rgba(37,211,102,0.3)" : "none",
    }}>
      <svg width={size === "lg" ? 16 : 14} height={size === "lg" ? 16 : 14} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.5 14.4c-.3-.1-1.7-.8-2-.9-.3-.1-.5-.1-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.1-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.4.1-.6.1-.1.3-.3.4-.5.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5-.1-.1-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.1.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z"/>
        <path d="M20.5 3.5C18.2 1.2 15.2 0 12 0 5.4 0 .1 5.3.1 11.9c0 2.1.5 4.1 1.6 5.9L0 24l6.4-1.7c1.7.9 3.7 1.4 5.6 1.4 6.6 0 11.9-5.3 11.9-11.9 0-3.2-1.2-6.2-3.4-8.3zM12 21.8c-1.7 0-3.4-.5-4.9-1.3l-.4-.2-3.7 1 1-3.6-.2-.4c-.9-1.5-1.4-3.3-1.4-5 0-5.5 4.5-9.9 9.9-9.9 2.6 0 5.1 1 7 2.9 1.9 1.9 2.9 4.4 2.9 7-.1 5.4-4.5 9.5-10.2 9.5z"/>
      </svg>
      {label}
    </button>
  );
}

export default function PackagePage() {
  const params = useParams();
  const id     = params?.id as string;
  const router = useRouter();

  const [data,    setData]    = useState<PackageData | null>(null);
  const [agency,  setAgency]  = useState<AgencyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id || id === "undefined") { router.push("/builder"); return; }
      try {
        const pkgSnap = await getDoc(doc(db, "packages", id));
        if (!pkgSnap.exists()) { router.push("/builder"); return; }
        const pkg = { id: pkgSnap.id, ...pkgSnap.data() } as PackageData;
        setData(pkg);

        if (pkg.userId) {
          const userSnap = await getDoc(doc(db, "users", pkg.userId));
          if (userSnap.exists()) {
            const u = userSnap.data();
            setAgency({ name: u.name || u.email || "Travel Agency", tagline: u.tagline || "", email: u.email || "", logoUrl: u.logoUrl || "", brandColor: u.brandColor || "" });
          }
        }

        let sid = sessionStorage.getItem("pmx_sid");
        if (!sid) { sid = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem("pmx_sid", sid); }
        fetch("/api/track-view", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, sessionId: sid }) });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [id, router]);

  const trackClick = (type: "whatsapp" | "messenger") =>
    fetch("/api/track-click", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packageId: id, type }) });

  if (loading) return (
    <div style={{ minHeight: "100vh", background: "#fdfcf9", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner" style={{ borderTopColor: DEFAULT_BRAND }} />
    </div>
  );
  if (!data) return null;

  const bg         = BG;
  const ink        = INK;
  const border     = BORDER;
  const muted      = MUTED;
  const superMuted = SUPER_MUTED;

  const brandColor  = agency?.brandColor || DEFAULT_BRAND;
  const agencyName  = agency?.name || "Travel Agency";
  const agencyLogo  = agency?.logoUrl || "";
  const includes    = data.includes?.length ? data.includes : (data.advantages || []);
  const excludes    = data.excludes || [];
  const airports    = data.airports || [];
  const itinerary   = (data.itinerary || []).filter(it => it.title?.trim());
  const pricingTiers = data.pricingTiers || [];
  const nights      = data.nights ? Number(data.nights) : null;
  const coverImage  = data.coverImage || "";
  const images      = data.images?.filter(Boolean) || [];
  const videoUrl    = data.videoUrl || "";
  const allImages   = [coverImage, ...images].filter(Boolean);

  const openWA = () => {
    if (!data.whatsapp) return;
    trackClick("whatsapp");
    window.open(`https://wa.me/${data.whatsapp.replace(/\D/g, "")}`, "_blank", "noopener,noreferrer");
  };
  const openMessenger = () => {
    if (!data.messenger) return;
    trackClick("messenger");
    const url = data.messenger.startsWith("m.me") ? `https://${data.messenger}` : `https://m.me/${data.messenger}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div style={{ minHeight: "100vh", background: bg, color: ink, fontFamily: "'DM Sans', sans-serif" }}>

      {/* ── AGENCY HEADER ───────────────────────────────────────────────────── */}
      <div style={{ padding: "14px 56px", borderBottom: `1px solid ${border}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: bg, position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AgencyMark logoUrl={agencyLogo} color={brandColor} size={32} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: ink, letterSpacing: "-0.2px" }}>{agencyName}</div>
            {agency?.tagline && <div style={{ fontSize: 10.5, color: superMuted }}>{agency.tagline}</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 13, color: muted, fontWeight: 500 }}>
          {itinerary.length > 0 && <a href="#itinerary" style={{ textDecoration: "none", color: "inherit" }}>Itinerary</a>}
          {(includes.length > 0 || excludes.length > 0) && <a href="#included" style={{ textDecoration: "none", color: "inherit" }}>Included</a>}
          {pricingTiers.filter(t => t.price).length > 0 && <a href="#pricing" style={{ textDecoration: "none", color: "inherit" }}>Pricing</a>}
          {data.whatsapp && <WAButton onClick={openWA} label={`Book · ${data.price}`} size="sm" />}
        </div>
      </div>

      {/* ── HERO — 2-column split ────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", minHeight: 560 }}>

        {/* Left: editorial copy */}
        <div style={{ padding: "64px 56px 56px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: bg }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: brandColor, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 24 }}>
              <span style={{ width: 24, height: 1, background: brandColor, display: "inline-block" }} />
              {data.destination}
            </div>

            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 62, lineHeight: 1.03, letterSpacing: "-1.5px", marginBottom: 22, color: ink, fontWeight: 400 }}>
              {data.description
                ? data.description.split(/[.!?]/)[0].trim()
                : data.destination}
            </h1>

            {data.description && data.description.split(/[.!?]/).length > 1 && (
              <p style={{ fontSize: 16, color: muted, lineHeight: 1.7, maxWidth: 480, marginBottom: 36 }}>
                {data.description.split(/[.!?]/).slice(1).join(". ").replace(/^\.\s*/, "").trim()}
              </p>
            )}

            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: 10.5, color: superMuted, textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 3 }}>From</div>
                <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 40, color: ink, fontWeight: 400, letterSpacing: "-1px", lineHeight: 1 }}>{data.price}</div>
                {nights && <div style={{ fontSize: 11, color: superMuted }}>per person · {nights} nights</div>}
              </div>
              {airports.length > 0 && (
                <>
                  <div style={{ width: 1, height: 48, background: border }} />
                  <div>
                    <div style={{ fontSize: 10.5, color: superMuted, textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 3 }}>Departures</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: ink }}>{airports.map(a => a.name.split(" ")[0]).join(" · ")}</div>
                  </div>
                </>
              )}
            </div>

            <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
              {data.whatsapp && <WAButton onClick={openWA} />}
              {data.messenger && (
                <button onClick={openMessenger} style={{ padding: "14px 22px", borderRadius: 10, background: "transparent", color: ink, border: `1.5px solid ${border}`, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  Message us ▷
                </button>
              )}
            </div>
          </div>

          {/* Trust signals */}
          <div style={{ display: "flex", gap: 24, alignItems: "center", paddingTop: 24, borderTop: `1px solid ${border}` }}>
            {data.cancellation && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: ink }}>Free cancellation</div>
                <div style={{ fontSize: 11, color: superMuted }}>{data.cancellation.split("–")[0].trim()}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: ink }}>~5 min to book</div>
              <div style={{ fontSize: 11, color: superMuted }}>via WhatsApp</div>
            </div>
            {nights && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: ink }}>{nights} nights</div>
                <div style={{ fontSize: 11, color: superMuted }}>{nights + 1} day itinerary</div>
              </div>
            )}
          </div>
        </div>

        {/* Right: image collage */}
        <div style={{ position: "relative", overflow: "hidden", background: allImages[0] ? `url(${allImages[0]}) center/cover` : `linear-gradient(135deg, ${brandColor}40, ${brandColor}80)` }}>
          <div style={{ position: "absolute", top: 20, right: 20, padding: "6px 14px", borderRadius: 99, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", fontSize: 11, fontWeight: 700, color: ink }}>
            ✦ Editor&apos;s pick
          </div>
          {allImages.length >= 2 && (
            <div style={{ position: "absolute", bottom: 20, left: 20, right: 20, display: "flex", gap: 8 }}>
              {allImages.slice(1, 5).map((src, i) => (
                <div key={i} style={{ flex: 1, aspectRatio: "1", borderRadius: 10, background: `url(${src}) center/cover`, border: "2px solid rgba(255,255,255,0.5)", boxShadow: "0 4px 14px rgba(0,0,0,0.25)" }} />
              ))}
              {allImages.length > 5 && (
                <div style={{ flex: 1, aspectRatio: "1", borderRadius: 10, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(6px)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 13, fontWeight: 700 }}>
                  +{allImages.length - 5}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "72px 40px 96px" }}>

        {/* ── ITINERARY ──────────────────────────────────────────────────────── */}
        {itinerary.length > 0 && (
          <section id="itinerary" style={{ marginBottom: 72 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: brandColor, letterSpacing: "1.5px", textTransform: "uppercase" }}>Day by day</span>
            </div>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 38, lineHeight: 1.1, fontWeight: 400, color: ink, marginBottom: 32 }}>Your journey</h2>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(itinerary.length, 5)}, 1fr)`, gap: 14 }}>
              {itinerary.map((it, i) => (
                <div key={i} style={{ background: bg, borderRadius: 14, padding: "20px 18px", border: `1px solid ${border}`, boxShadow: `0 2px 8px ${border}` }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: brandColor, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10 }}>Day {it.day}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: ink, lineHeight: 1.3, marginBottom: 8 }}>{it.title || "—"}</div>
                  {it.desc && <div style={{ fontSize: 12, color: muted, lineHeight: 1.55 }}>{it.desc}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── WHAT'S INCLUDED ────────────────────────────────────────────────── */}
        {(includes.length > 0 || excludes.length > 0) && (
          <section id="included" style={{ marginBottom: 72 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 38, lineHeight: 1.1, fontWeight: 400, color: ink, marginBottom: 32 }}>What&apos;s included</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
              {includes.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#2dd4a0", marginBottom: 18, textTransform: "uppercase", letterSpacing: "0.6px" }}>Included</div>
                  {includes.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, marginBottom: 13, alignItems: "flex-start" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(45,212,160,0.1)", border: "1px solid rgba(45,212,160,0.25)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="check" size={10} color="#2dd4a0" strokeWidth={2.5} />
                      </div>
                      <span style={{ fontSize: 14, color: muted, lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}
              {excludes.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", marginBottom: 18, textTransform: "uppercase", letterSpacing: "0.6px" }}>Not included</div>
                  {excludes.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, marginBottom: 13, alignItems: "flex-start" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="x" size={10} color="#ef4444" strokeWidth={2.5} />
                      </div>
                      <span style={{ fontSize: 14, color: muted, lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ── PRICING TIERS ──────────────────────────────────────────────────── */}
        {pricingTiers.filter(t => t.price).length > 0 && (
          <section id="pricing" style={{ marginBottom: 72 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 38, lineHeight: 1.1, fontWeight: 400, color: ink, marginBottom: 32 }}>Choose your option</h2>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(pricingTiers.filter(t => t.price).length, 3)}, 1fr)`, gap: 16 }}>
              {pricingTiers.filter(t => t.price).map((tier, i) => (
                <div key={i} style={{
                  background: i === 0 ? `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)` : bg,
                  border: `1px solid ${i === 0 ? "transparent" : "rgba(13,27,46,0.1)"}`,
                  borderRadius: 18, padding: "28px 24px", position: "relative", overflow: "hidden",
                  boxShadow: i === 0 ? `0 12px 32px ${brandColor}30` : "0 2px 8px rgba(13,27,46,0.04)",
                }}>
                  {i === 0 && <div style={{ position: "absolute", top: 14, right: 14, background: "rgba(255,255,255,0.22)", borderRadius: 99, padding: "3px 10px", fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: ".3px" }}>MOST POPULAR</div>}
                  <div style={{ fontSize: 13, fontWeight: 600, color: i === 0 ? "rgba(255,255,255,0.7)" : muted, marginBottom: 14 }}>{tier.label}</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42, fontWeight: 400, color: i === 0 ? "#fff" : ink, letterSpacing: "-1px", lineHeight: 1 }}>{tier.price}</div>
                  <div style={{ fontSize: 11, color: i === 0 ? "rgba(255,255,255,0.5)" : superMuted, marginBottom: 20 }}>per person</div>
                  {data.whatsapp && (
                    <button onClick={openWA} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: i === 0 ? "rgba(255,255,255,0.2)" : brandColor, color: "#fff", border: "none", borderRadius: 9, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      Book this option →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── MEDIA GALLERY ──────────────────────────────────────────────────── */}
        {(allImages.length > 1 || videoUrl) && (
          <section style={{ marginBottom: 72 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 38, lineHeight: 1.1, fontWeight: 400, color: ink, marginBottom: 32 }}>Gallery</h2>
            {videoUrl && (
              <video src={videoUrl} controls style={{ width: "100%", borderRadius: 14, background: ink, maxHeight: 400, marginBottom: 14 }} />
            )}
            {allImages.length > 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {allImages.slice(1).map((url, i) => (
                  <img key={i} src={url} alt="" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 12 }} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── DEPARTURE OPTIONS ──────────────────────────────────────────────── */}
        {airports.length > 0 && (
          <section style={{ marginBottom: 72 }}>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 38, lineHeight: 1.1, fontWeight: 400, color: ink, marginBottom: 32 }}>Departure options</h2>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(airports.length, 3)}, 1fr)`, gap: 14 }}>
              {airports.map((a, i) => (
                <div key={i} style={{ background: i === 0 ? `${brandColor}08` : "rgba(13,27,46,0.02)", border: `1px solid ${i === 0 ? brandColor + "30" : "rgba(13,27,46,0.08)"}`, borderRadius: 14, padding: "22px 22px" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: ink, marginBottom: 4 }}>{a.name}</div>
                  <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, fontWeight: 400, color: brandColor, letterSpacing: "-0.5px", lineHeight: 1, marginBottom: 14 }}>{a.price}</div>
                  {data.whatsapp && (
                    <button onClick={openWA} style={{ fontSize: 13, color: brandColor, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
                      Book this flight →
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── FOOTER CTA ─────────────────────────────────────────────────────── */}
        <div style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}bb 100%)`, borderRadius: 24, overflow: "hidden", position: "relative", padding: "52px 56px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 40 }}>
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06, pointerEvents: "none" }} viewBox="0 0 80 80" preserveAspectRatio="xMidYMid slice">
            <defs><pattern id="geo-cta" width="40" height="40" patternUnits="userSpaceOnUse"><polygon points="20,0 40,10 40,30 20,40 0,30 0,10" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#geo-cta)" />
          </svg>
          <div style={{ position: "relative" }}>
            <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 36, color: "#fff", marginBottom: 10, lineHeight: 1.15 }}>
              Ready to explore {data.destination}?
            </div>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.65)" }}>Reserve your spot — it only takes 5 minutes.</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative", flexShrink: 0 }}>
            {data.whatsapp && <WAButton onClick={openWA} />}
            {data.messenger && (
              <button onClick={openMessenger} style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", backdropFilter: "blur(8px)" }}>
                Message on Messenger
              </button>
            )}
            {!data.whatsapp && !data.messenger && (
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>Contact info not set — edit in Builder.</div>
            )}
          </div>
        </div>

        {/* ── PAGE FOOTER ────────────────────────────────────────────────────── */}
        <div style={{ marginTop: 48, paddingTop: 28, borderTop: "1px solid rgba(13,27,46,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AgencyMark logoUrl={agencyLogo} color={brandColor} size={26} />
            <div style={{ fontSize: 13, fontWeight: 700, color: ink }}>{agencyName}</div>
          </div>
          <div style={{ fontSize: 11, color: superMuted }}>Powered by Packmetrix</div>
        </div>
      </div>
    </div>
  );
}
