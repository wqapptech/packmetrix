"use client";

import { useEffect, useState, Suspense } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { collection, getDocs, query, where } from "firebase/firestore";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { T, type Lang } from "@/lib/translations";

type Package = {
  id: string;
  destination: string;
  price: string;
  nights?: string | number;
  coverImage?: string;
  images?: string[];
  agencySlug?: string;
  isActive?: boolean;
  language?: string;
};

type AgencyProfile = {
  name: string;
  tagline?: string;
  logoUrl?: string;
  brandColor?: string;
  language?: string;
};

const BG     = "#fdfcf9";
const INK    = "#0d1b2e";
const BORDER = "rgba(13,27,46,0.08)";
const MUTED  = "rgba(13,27,46,0.55)";
const SUPER_MUTED = "rgba(13,27,46,0.35)";
const DEFAULT_BRAND = "#1f5f8e";

function AgencyMark({ logoUrl, name, color = DEFAULT_BRAND, size = 32 }: { logoUrl?: string; name?: string; color?: string; size?: number }) {
  if (logoUrl) return <img src={logoUrl} alt="" style={{ width: size, height: size, objectFit: "contain", borderRadius: 6 }} />;
  const initials = (name || "A").slice(0, 2).toUpperCase();
  return (
    <div style={{ width: size, height: size, borderRadius: 8, background: color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 800, color: "#fff", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function AgencyPackagesPageInner() {
  const params        = useParams();
  const agencySlug    = params?.agencySlug as string;
  const router        = useRouter();
  const searchParams  = useSearchParams();
  const langParam     = searchParams.get("lang");

  const [packages, setPackages] = useState<Package[]>([]);
  const [agency,   setAgency]   = useState<AgencyProfile | null>(null);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!agencySlug) return;
      try {
        const snap = await getDocs(
          query(collection(db, "packages"), where("agencySlug", "==", agencySlug))
        );
        const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Package));
        const active = all.filter(p => p.isActive !== false);
        setPackages(active);

        const first = all[0];
        if (first) {
          const pkgDoc = snap.docs[0];
          const userId = (pkgDoc.data() as any).userId;
          if (userId) {
            const userSnap = await getDoc(doc(db, "users", userId));
            if (userSnap.exists()) {
              const u = userSnap.data();
              setAgency({
                name: u.name || u.email || "Travel Agency",
                tagline: u.tagline || "",
                logoUrl: u.logoUrl || "",
                brandColor: u.brandColor || "",
                language: u.language || first.language || "en",
              });
            }
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [agencySlug]);

  const lang         = ((langParam || agency?.language || packages[0]?.language || "en") === "ar" ? "ar" : "en") as Lang;
  const t            = T[lang];
  const isRtl        = lang === "ar";
  const dir          = isRtl ? "rtl" : "ltr";
  const bodyFont     = isRtl ? "'Cairo', 'Noto Sans Arabic', system-ui, sans-serif" : "'DM Sans', sans-serif";
  const headingFont  = isRtl ? "'Cairo', 'Noto Sans Arabic', system-ui, sans-serif" : "'DM Serif Display', serif";
  const brandColor   = agency?.brandColor || DEFAULT_BRAND;
  const agencyName   = agency?.name || "";

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div className="spinner" style={{ borderTopColor: brandColor }} />
      </div>
    );
  }

  return (
    <div dir={dir} style={{ minHeight: "100vh", background: BG, color: INK, fontFamily: bodyFont }}>

      {/* Header */}
      <div style={{ padding: "14px 56px", borderBottom: `1px solid ${BORDER}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: BG, position: "sticky", top: 0, zIndex: 50, backdropFilter: "blur(12px)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AgencyMark logoUrl={agency?.logoUrl} name={agencyName} color={brandColor} size={32} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 800, color: INK, letterSpacing: "-0.2px" }}>{agencyName}</div>
            {agency?.tagline && <div style={{ fontSize: 10.5, color: SUPER_MUTED }}>{agency.tagline}</div>}
          </div>
        </div>
      </div>

      {/* Hero section */}
      <div style={{ padding: "64px 56px 40px", maxWidth: 1140, margin: "0 auto" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: brandColor, letterSpacing: isRtl ? "0.5px" : "1.5px", textTransform: "uppercase", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: 24, height: 1, background: brandColor, display: "inline-block" }} />
          {agencyName}
        </div>
        <h1 style={{ fontFamily: headingFont, fontSize: isRtl ? 40 : 52, lineHeight: isRtl ? 1.3 : 1.05, letterSpacing: isRtl ? "-0.5px" : "-1.2px", color: INK, fontWeight: isRtl ? 700 : 400, marginBottom: 10 }}>
          {t.agencyPackagesHeading}
        </h1>
        <div style={{ fontSize: 14, color: MUTED }}>
          {packages.length} {packages.length === 1 ? t.packageLive : t.packagesLive}
        </div>
      </div>

      {/* Package grid */}
      <div style={{ maxWidth: 1140, margin: "0 auto", padding: "0 56px 96px" }}>
        {packages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "80px 0", color: MUTED, fontSize: 15 }}>
            {t.noActivePackages}
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 24 }}>
            {packages.map(pkg => {
              const thumb = pkg.coverImage || pkg.images?.[0];
              const nights = pkg.nights ? Number(pkg.nights) : null;
              return (
                <div
                  key={pkg.id}
                  onClick={() => router.push(`/${agencySlug}/${pkg.id}`)}
                  style={{ cursor: "pointer", borderRadius: 18, overflow: "hidden", border: `1px solid ${BORDER}`, background: BG, boxShadow: "0 2px 12px rgba(13,27,46,0.05)", transition: "box-shadow 0.2s, transform 0.2s" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 8px 32px rgba(13,27,46,0.12)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(-2px)"; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.boxShadow = "0 2px 12px rgba(13,27,46,0.05)"; (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)"; }}
                >
                  {/* Cover */}
                  <div style={{ height: 200, background: thumb ? `url(${thumb}) center/cover` : `linear-gradient(135deg, ${brandColor}40, ${brandColor}80)`, position: "relative" }}>
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 40%, rgba(13,27,46,0.55))" }} />
                    {nights && (
                      <div style={{ position: "absolute", top: 14, right: isRtl ? "auto" : 14, left: isRtl ? 14 : "auto", padding: "4px 12px", borderRadius: 99, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(8px)", fontSize: 11, fontWeight: 700, color: INK }}>
                        {nights} {t.nightsLabel}
                      </div>
                    )}
                    <div style={{ position: "absolute", left: isRtl ? "auto" : 18, right: isRtl ? 18 : "auto", bottom: 16, color: "#fff" }}>
                      <div style={{ fontFamily: headingFont, fontSize: 22, fontWeight: isRtl ? 700 : 400, lineHeight: 1.1, letterSpacing: "-0.3px" }}>{pkg.destination}</div>
                    </div>
                  </div>

                  {/* Card body */}
                  <div style={{ padding: "18px 20px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <div style={{ fontSize: 10, color: SUPER_MUTED, textTransform: "uppercase", letterSpacing: ".7px", marginBottom: 3 }}>{t.from}</div>
                      <div style={{ fontFamily: headingFont, fontSize: 26, fontWeight: isRtl ? 700 : 400, color: INK, letterSpacing: "-0.5px", lineHeight: 1 }}>{pkg.price}</div>
                      <div style={{ fontSize: 11, color: SUPER_MUTED, marginTop: 2 }}>{t.perPerson}</div>
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); router.push(`/${agencySlug}/${pkg.id}`); }}
                      style={{ padding: "10px 18px", borderRadius: 10, background: brandColor, color: "#fff", border: "none", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      {t.viewPackage}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ borderTop: `1px solid ${BORDER}`, padding: "24px 56px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <AgencyMark logoUrl={agency?.logoUrl} name={agencyName} color={brandColor} size={26} />
          <div style={{ fontSize: 13, fontWeight: 700, color: INK }}>{agencyName}</div>
        </div>
        <div style={{ fontSize: 11, color: SUPER_MUTED }}>{t.poweredBy}</div>
      </div>
    </div>
  );
}

export default function AgencyPackagesPage() {
  return (
    <Suspense fallback={null}>
      <AgencyPackagesPageInner />
    </Suspense>
  );
}
