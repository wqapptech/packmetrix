"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Icon from "@/components/Icon";
import { T, type Lang } from "@/lib/translations";

type ItineraryDay = { day: number; title: string; desc: string };
type PricingTier  = { label: string; price: string };
type Airport      = { name: string; price: string; date?: string; arrivingAirport?: string; flyingTime?: string; arrivingTime?: string };

type PackageData = {
  id: string; userId: string;
  destination: string; price: string; nights?: string | number; description: string;
  includes?: string[]; excludes?: string[]; advantages?: string[];
  hotelDescription?: string;
  airports?: Airport[]; itinerary?: ItineraryDay[]; pricingTiers?: PricingTier[];
  cancellation?: string; whatsapp?: string; messenger?: string;
  coverImage?: string; images?: string[]; videoUrl?: string;
  language?: string; isActive?: boolean;
};

type AgencyProfile = { name: string; tagline?: string; email: string; logoUrl?: string; brandColor?: string };

const DEFAULT_BRAND = "#1f5f8e";
const BG  = "#fdfcf9";
const INK = "#0d1b2e";
const BORDER = "rgba(13,27,46,0.08)";
const MUTED  = "rgba(13,27,46,0.55)";
const SUPER_MUTED = "rgba(13,27,46,0.35)";

function AgencyMark({ logoUrl, name, color = DEFAULT_BRAND, size = 32 }: { logoUrl?: string; name?: string; color?: string; size?: number }) {
  if (logoUrl) return <img src={logoUrl} alt="" style={{ width: size, height: size, objectFit: "contain", borderRadius: 6 }} />;
  const initials = (name || "A").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function WAButton({ onClick, label, size = "lg" }: { onClick: () => void; label: string; size?: "sm" | "lg" }) {
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
  const params      = useParams();
  const packageId   = params?.packageId as string;
  const agencySlug  = params?.agencySlug as string;
  const router      = useRouter();

  const [data,    setData]    = useState<PackageData | null>(null);
  const [agency,  setAgency]  = useState<AgencyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!packageId || packageId === "undefined") { router.push("/builder"); return; }
      try {
        const pkgSnap = await getDoc(doc(db, "packages", packageId));
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

        let sid = localStorage.getItem("pmx_session");
        if (!sid) { sid = crypto.randomUUID(); localStorage.setItem("pmx_session", sid); }
        fetch("/api/track-view", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: packageId, sessionId: sid }) });
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    };
    load();
  }, [packageId, router]);

  const getSession = () => {
    let sid = localStorage.getItem("pmx_session");
    if (!sid) { sid = crypto.randomUUID(); localStorage.setItem("pmx_session", sid); }
    return sid;
  };

  const trackClick = (type: "whatsapp" | "messenger") =>
    fetch("/api/track-click", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ packageId, sessionId: getSession(), source: type }) });

  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner" style={{ borderTopColor: DEFAULT_BRAND }} />
    </div>
  );
  if (!data) return null;

  if (data.isActive === false) {
    const lang = (data.language === "ar" ? "ar" : "en") as Lang;
    const t = T[lang];
    return (
      <div style={{ minHeight: "100vh", background: BG, color: INK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 40, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(13,27,46,0.06)", border: `1px solid ${BORDER}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>○</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: INK }}>{t.packageUnavailableTitle}</div>
        <div style={{ fontSize: 15, color: MUTED, maxWidth: 380, lineHeight: 1.6 }}>{t.packageUnavailableSub}</div>
      </div>
    );
  }

  const lang = (data.language === "ar" ? "ar" : "en") as Lang;
  const t = T[lang];
  const isRtl = lang === "ar";
  const dir = isRtl ? "rtl" : "ltr";
  const arabicFont = "'Cairo', 'Noto Sans Arabic', system-ui, sans-serif";
  const bodyFont = isRtl ? arabicFont : "'DM Sans', sans-serif";
  const headingFont = isRtl ? arabicFont : "'DM Serif Display', serif";

  const brandColor   = agency?.brandColor || DEFAULT_BRAND;
  const agencyName   = agency?.name || "Travel Agency";
  const agencyLogo   = agency?.logoUrl || "";
  const includes     = data.includes?.length ? data.includes : (data.advantages || []);
  const excludes     = data.excludes || [];
  const airports     = (data.airports || []).filter(a => a.name?.trim());
  const itinerary    = (data.itinerary || []).filter(it => it.title?.trim());
  const pricingTiers = data.pricingTiers || [];
  const nights       = data.nights ? Number(data.nights) : null;
  const coverImage   = data.coverImage || "";
  const images       = data.images?.filter(Boolean) || [];
  const videoUrl     = data.videoUrl || "";
  const allImages    = [coverImage, ...images].filter(Boolean);

  const openWA = () => {
    if (!data.whatsapp) return;
    const sid = getSession();
    trackClick("whatsapp");
    const msg = encodeURIComponent(`Hi, I'm interested in the ${data.destination} package (${data.price}). [ref:${sid.slice(0, 8)}]`);
    window.open(`https://wa.me/${data.whatsapp.replace(/\D/g, "")}?text=${msg}`, "_blank", "noopener,noreferrer");
  };
  const openMessenger = () => {
    if (!data.messenger) return;
    trackClick("messenger");
    const url = data.messenger.startsWith("m.me") ? `https://${data.messenger}` : `https://m.me/${data.messenger}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div dir={dir} style={{ minHeight: "100vh", background: BG, color: INK, fontFamily: bodyFont }}>

      {/* ── AGENCY HEADER ───────────────────────────────────────────────────── */}
      <div style={{ padding: "14px 56px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: BG, position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AgencyMark logoUrl={agencyLogo} name={agencyName} color={brandColor} size={32} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: INK, letterSpacing: "-0.2px" }}>{agencyName}</div>
            {agency?.tagline && <div style={{ fontSize: 10.5, color: SUPER_MUTED }}>{agency.tagline}</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 24, fontSize: 13, color: MUTED, fontWeight: 500 }}>
          {itinerary.length > 0 && <a href="#itinerary" style={{ textDecoration: "none", color: "inherit" }}>{t.navItinerary}</a>}
          {(includes.length > 0 || excludes.length > 0) && <a href="#included" style={{ textDecoration: "none", color: "inherit" }}>{t.navIncluded}</a>}
          {pricingTiers.filter(tier => tier.price).length > 0 && <a href="#pricing" style={{ textDecoration: "none", color: "inherit" }}>{t.navPricing}</a>}
          <button
            onClick={() => router.push(`/${agencySlug}?lang=${lang}`)}
            style={{ textDecoration: "none", color: MUTED, background: "none", border: `1px solid ${BORDER}`, borderRadius: 8, padding: "6px 14px", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            {t.navAllPackages}
          </button>
          {data.whatsapp && <WAButton onClick={openWA} label={`${t.bookPrice} ${data.price}`} size="sm" />}
        </div>
      </div>

      {/* ── HERO ────────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: isRtl ? "1fr 1.1fr" : "1.1fr 1fr", minHeight: 560 }}>
        <div style={{ padding: "64px 56px 56px", display: "flex", flexDirection: "column", justifyContent: "space-between", background: BG, order: isRtl ? 2 : 1 }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, fontWeight: 700, color: brandColor, letterSpacing: isRtl ? "0.5px" : "1.5px", textTransform: "uppercase", marginBottom: 24 }}>
              <span style={{ width: 24, height: 1, background: brandColor, display: "inline-block" }} />
              {data.destination}
            </div>
            <h1 style={{ fontFamily: headingFont, fontSize: isRtl ? 48 : 62, lineHeight: isRtl ? 1.3 : 1.03, letterSpacing: isRtl ? "-0.5px" : "-1.5px", marginBottom: 22, color: INK, fontWeight: isRtl ? 700 : 400 }}>
              {data.description ? data.description.split(/[.!?]/)[0].trim() : data.destination}
            </h1>
            {data.description && data.description.split(/[.!?]/).length > 1 && (
              <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.7, maxWidth: 480, marginBottom: 36 }}>
                {data.description.split(/[.!?]/).slice(1).join(". ").replace(/^\.\s*/, "").trim()}
              </p>
            )}
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 32 }}>
              <div>
                <div style={{ fontSize: 10.5, color: SUPER_MUTED, textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 3 }}>{t.from}</div>
                <div style={{ fontFamily: headingFont, fontSize: 40, color: INK, fontWeight: isRtl ? 700 : 400, letterSpacing: "-1px", lineHeight: 1 }}>{data.price}</div>
                {nights && <div style={{ fontSize: 11, color: SUPER_MUTED }}>{t.perPerson} · {nights} {t.nightsLabel}</div>}
              </div>
              {airports.length > 0 && (
                <>
                  <div style={{ width: 1, height: 48, background: BORDER }} />
                  <div>
                    <div style={{ fontSize: 10.5, color: SUPER_MUTED, textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 3 }}>{t.departures}</div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: INK }}>{airports.map(a => a.name.split(" ")[0]).join(" · ")}</div>
                  </div>
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
              {data.whatsapp && <WAButton onClick={openWA} label={t.bookWhatsApp} />}
              {data.messenger && (
                <button onClick={openMessenger} style={{ padding: "14px 22px", borderRadius: 10, background: "transparent", color: INK, border: `1.5px solid ${BORDER}`, fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                  {t.messageUs}
                </button>
              )}
            </div>
          </div>
          <div style={{ display: "flex", gap: 24, alignItems: "center", paddingTop: 24, borderTop: `1px solid ${BORDER}` }}>
            {data.cancellation && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: INK }}>{t.freeCancellation}</div>
                <div style={{ fontSize: 11, color: SUPER_MUTED }}>{data.cancellation.split("–")[0].trim()}</div>
              </div>
            )}
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: INK }}>{t.bookTime}</div>
              <div style={{ fontSize: 11, color: SUPER_MUTED }}>{t.viaWhatsAppShort}</div>
            </div>
            {nights && (
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: INK }}>{nights} {t.nightsNights}</div>
                <div style={{ fontSize: 11, color: SUPER_MUTED }}>{nights + 1} {t.dayItinerary}</div>
              </div>
            )}
          </div>
        </div>
        <div style={{ position: "relative", overflow: "hidden", background: allImages[0] ? INK : `linear-gradient(135deg, ${brandColor}40, ${brandColor}80)`, order: isRtl ? 1 : 2 }}>
          {allImages[0] && (
            <img src={allImages[0]} alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          )}
          <div style={{ position: "absolute", top: 20, right: isRtl ? "auto" : 20, left: isRtl ? 20 : "auto", padding: "6px 14px", borderRadius: 99, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", fontSize: 11, fontWeight: 700, color: INK, zIndex: 1 }}>
            {t.editorsPick}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ─────────────────────────────────────────────────────── */}
      <div style={{ maxWidth: 1080, margin: "0 auto", padding: "72px 40px 96px" }}>

        {itinerary.length > 0 && (
          <section id="itinerary" style={{ marginBottom: 72 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: brandColor, letterSpacing: isRtl ? "0.5px" : "1.5px", textTransform: "uppercase" }}>{t.dayByDay}</span>
            <h2 style={{ fontFamily: headingFont, fontSize: isRtl ? 32 : 38, lineHeight: isRtl ? 1.4 : 1.1, fontWeight: isRtl ? 700 : 400, color: INK, marginBottom: 32, marginTop: 10 }}>{t.yourJourney}</h2>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(itinerary.length, 5)}, 1fr)`, gap: 14 }}>
              {itinerary.map((it, i) => (
                <div key={i} style={{ background: BG, borderRadius: 14, padding: "20px 18px", border: `1px solid ${BORDER}`, boxShadow: `0 2px 8px ${BORDER}` }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: brandColor, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 10 }}>{t.dayLabel} {it.day}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: INK, lineHeight: 1.3, marginBottom: 8 }}>{it.title}</div>
                  {it.desc && <div style={{ fontSize: 12, color: MUTED, lineHeight: 1.55 }}>{it.desc}</div>}
                </div>
              ))}
            </div>
          </section>
        )}

        {(includes.length > 0 || excludes.length > 0) && (
          <section id="included" style={{ marginBottom: 72 }}>
            <h2 style={{ fontFamily: headingFont, fontSize: isRtl ? 32 : 38, lineHeight: isRtl ? 1.4 : 1.1, fontWeight: isRtl ? 700 : 400, color: INK, marginBottom: 32 }}>{t.whatsIncluded}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40 }}>
              {includes.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#2dd4a0", marginBottom: 18, textTransform: "uppercase", letterSpacing: "0.6px" }}>{t.includedLabel}</div>
                  {includes.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, marginBottom: 13, alignItems: "flex-start" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(45,212,160,0.1)", border: "1px solid rgba(45,212,160,0.25)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="check" size={10} color="#2dd4a0" strokeWidth={2.5} />
                      </div>
                      <span style={{ fontSize: 14, color: MUTED, lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}
              {excludes.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", marginBottom: 18, textTransform: "uppercase", letterSpacing: "0.6px" }}>{t.notIncluded}</div>
                  {excludes.map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, marginBottom: 13, alignItems: "flex-start" }}>
                      <div style={{ width: 22, height: 22, borderRadius: "50%", background: "rgba(239,68,68,0.07)", border: "1px solid rgba(239,68,68,0.2)", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Icon name="x" size={10} color="#ef4444" strokeWidth={2.5} />
                      </div>
                      <span style={{ fontSize: 14, color: MUTED, lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {pricingTiers.filter(tier => tier.price).length > 0 && (
          <section id="pricing" style={{ marginBottom: 72 }}>
            <h2 style={{ fontFamily: headingFont, fontSize: isRtl ? 32 : 38, lineHeight: isRtl ? 1.4 : 1.1, fontWeight: isRtl ? 700 : 400, color: INK, marginBottom: 32 }}>{t.chooseOption}</h2>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(pricingTiers.filter(tier => tier.price).length, 3)}, 1fr)`, gap: 16 }}>
              {pricingTiers.filter(tier => tier.price).map((tier, i) => (
                <div key={i} style={{ background: i === 0 ? `linear-gradient(135deg, ${brandColor}, ${brandColor}cc)` : BG, border: `1px solid ${i === 0 ? "transparent" : "rgba(13,27,46,0.1)"}`, borderRadius: 18, padding: "28px 24px", position: "relative", overflow: "hidden", boxShadow: i === 0 ? `0 12px 32px ${brandColor}30` : "0 2px 8px rgba(13,27,46,0.04)" }}>
                  {i === 0 && <div style={{ position: "absolute", top: 14, right: isRtl ? "auto" : 14, left: isRtl ? 14 : "auto", background: "rgba(255,255,255,0.22)", borderRadius: 99, padding: "3px 10px", fontSize: 10, fontWeight: 700, color: "#fff", letterSpacing: ".3px" }}>{t.mostPopular}</div>}
                  <div style={{ fontSize: 13, fontWeight: 600, color: i === 0 ? "rgba(255,255,255,0.7)" : MUTED, marginBottom: 14 }}>{tier.label}</div>
                  <div style={{ fontFamily: headingFont, fontSize: 42, fontWeight: isRtl ? 700 : 400, color: i === 0 ? "#fff" : INK, letterSpacing: "-1px", lineHeight: 1 }}>{tier.price}</div>
                  <div style={{ fontSize: 11, color: i === 0 ? "rgba(255,255,255,0.5)" : SUPER_MUTED, marginBottom: 20 }}>{t.perPerson}</div>
                  {data.whatsapp && (
                    <button onClick={openWA} style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, background: i === 0 ? "rgba(255,255,255,0.2)" : brandColor, color: "#fff", border: "none", borderRadius: 9, padding: "10px", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                      {t.bookThisOption}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {(allImages.length > 1 || videoUrl) && (
          <section style={{ marginBottom: 72 }}>
            <h2 style={{ fontFamily: headingFont, fontSize: isRtl ? 32 : 38, lineHeight: isRtl ? 1.4 : 1.1, fontWeight: isRtl ? 700 : 400, color: INK, marginBottom: 32 }}>{t.gallery}</h2>
            {videoUrl && <video src={videoUrl} controls style={{ width: "100%", borderRadius: 14, background: INK, maxHeight: 400, marginBottom: 14 }} />}
            {allImages.length > 1 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
                {allImages.slice(1).map((url, i) => (
                  <img key={i} src={url} alt="" style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 12 }} />
                ))}
              </div>
            )}
          </section>
        )}

        {data.hotelDescription && (
          <section style={{ marginBottom: 72 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: brandColor, letterSpacing: isRtl ? "0.5px" : "1.5px", textTransform: "uppercase" }}>{t.hotelLabel}</span>
            <h2 style={{ fontFamily: headingFont, fontSize: isRtl ? 32 : 38, lineHeight: isRtl ? 1.4 : 1.1, fontWeight: isRtl ? 700 : 400, color: INK, marginBottom: 24, marginTop: 10 }}>{t.hotelSectionTitle}</h2>
            <p style={{ fontSize: 16, color: MUTED, lineHeight: 1.75, maxWidth: 720 }}>{data.hotelDescription}</p>
          </section>
        )}

        {airports.length > 0 && (
          <section style={{ marginBottom: 72 }}>
            <h2 style={{ fontFamily: headingFont, fontSize: isRtl ? 32 : 38, lineHeight: isRtl ? 1.4 : 1.1, fontWeight: isRtl ? 700 : 400, color: INK, marginBottom: 32 }}>{t.departureOptions}</h2>
            <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(airports.length, 3)}, 1fr)`, gap: 14 }}>
              {airports.map((a, i) => (
                <div key={i} style={{ background: i === 0 ? `${brandColor}08` : "rgba(13,27,46,0.02)", border: `1px solid ${i === 0 ? brandColor + "30" : "rgba(13,27,46,0.08)"}`, borderRadius: 14, padding: "22px 22px" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: INK, marginBottom: 6 }}>
                    {a.arrivingAirport ? `${a.name} → ${a.arrivingAirport}` : a.name}
                  </div>
                  {a.date && (
                    <div style={{ fontSize: 12, color: MUTED, marginBottom: 6, display: "flex", alignItems: "center", gap: 5 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      {a.date}
                    </div>
                  )}
                  {(a.flyingTime || a.arrivingTime) && (
                    <div style={{ fontSize: 12, color: MUTED, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {a.flyingTime && <span>{a.flyingTime}</span>}
                      {a.flyingTime && a.arrivingTime && <span style={{ opacity: 0.4 }}>→</span>}
                      {a.arrivingTime && <span>{a.arrivingTime}</span>}
                    </div>
                  )}
                  <div style={{ fontFamily: headingFont, fontSize: 32, fontWeight: isRtl ? 700 : 400, color: brandColor, letterSpacing: "-0.5px", lineHeight: 1, marginBottom: 14 }}>{a.price}</div>
                  {data.whatsapp && (
                    <button onClick={openWA} style={{ fontSize: 13, color: brandColor, fontWeight: 600, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, display: "flex", alignItems: "center", gap: 4 }}>
                      {t.bookThisFlight}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CTA banner */}
        <div style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}bb 100%)`, borderRadius: 24, overflow: "hidden", position: "relative", padding: "52px 56px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 40 }}>
          <svg style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.06, pointerEvents: "none" }} viewBox="0 0 80 80" preserveAspectRatio="xMidYMid slice">
            <defs><pattern id="geo-cta" width="40" height="40" patternUnits="userSpaceOnUse"><polygon points="20,0 40,10 40,30 20,40 0,30 0,10" fill="none" stroke="white" strokeWidth="0.5" /></pattern></defs>
            <rect width="100%" height="100%" fill="url(#geo-cta)" />
          </svg>
          <div style={{ position: "relative" }}>
            <div style={{ fontFamily: headingFont, fontSize: isRtl ? 28 : 36, color: "#fff", marginBottom: 10, lineHeight: isRtl ? 1.5 : 1.15 }}>{t.readyToExplore} {data.destination}?</div>
            <div style={{ fontSize: 15, color: "rgba(255,255,255,0.65)" }}>{t.reserveSpot}</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10, position: "relative", flexShrink: 0 }}>
            {data.whatsapp && <WAButton onClick={openWA} label={t.bookWhatsApp} />}
            {data.messenger && (
              <button onClick={openMessenger} style={{ background: "rgba(255,255,255,0.18)", color: "#fff", border: "1px solid rgba(255,255,255,0.28)", borderRadius: 10, padding: "12px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", backdropFilter: "blur(8px)" }}>
                {t.messageMessenger}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 48, paddingTop: 28, borderTop: "1px solid rgba(13,27,46,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <AgencyMark logoUrl={agencyLogo} name={agencyName} color={brandColor} size={26} />
            <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>{agencyName}</div>
          </div>
          <div style={{ fontSize: 11, color: SUPER_MUTED }}>{t.poweredBy}</div>
        </div>
      </div>
    </div>
  );
}
