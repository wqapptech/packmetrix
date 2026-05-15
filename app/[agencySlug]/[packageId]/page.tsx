"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PackageRenderer from "@/components/PackageRenderer";
import type { TPackage, TAgency, Lang } from "@/components/templates/types";
import { DEFAULT_TEMPLATE_ID } from "@/components/templates/index";

const DEFAULT_BRAND = "#1f5f8e";
const BG  = "#fdfcf9";
const INK = "#0d1b2e";

export default function PackagePage() {
  const params      = useParams();
  const packageId   = params?.packageId as string;
  const agencySlug  = params?.agencySlug as string;
  const router      = useRouter();

  const [pkg,     setPkg]     = useState<TPackage | null>(null);
  const [agency,  setAgency]  = useState<TAgency | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!packageId || packageId === "undefined") { router.push("/builder"); return; }
      try {
        const pkgSnap = await getDoc(doc(db, "packages", packageId));
        if (!pkgSnap.exists()) { router.push("/builder"); return; }
        const data = { id: pkgSnap.id, ...pkgSnap.data() } as TPackage;
        setPkg(data);

        if (data.userId) {
          const userSnap = await getDoc(doc(db, "users", data.userId));
          if (userSnap.exists()) {
            const u = userSnap.data();
            setAgency({
              name: u.name || u.email || "Travel Agency",
              tagline: u.tagline || "",
              logoUrl: u.logoUrl || "",
              brandColor: u.brandColor || DEFAULT_BRAND,
              activeTemplate: u.activeTemplate || DEFAULT_TEMPLATE_ID,
              agencySlug: agencySlug || u.agencySlug || "",
              enableReviews: u.enableReviews === true,
              showReviews: u.showReviews !== false,
            });
          }
        }

        let sid = localStorage.getItem("pmx_session");
        if (!sid) { sid = crypto.randomUUID(); localStorage.setItem("pmx_session", sid); }
        fetch("/api/track-view", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: packageId, sessionId: sid }),
        });
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
    fetch("/api/track-click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ packageId, sessionId: getSession(), source: type }),
    });

  if (loading) return (
    <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div className="spinner" style={{ borderTopColor: DEFAULT_BRAND }} />
    </div>
  );
  if (!pkg) return null;

  if (pkg.isActive === false) {
    const lang = (pkg.language === "ar" ? "ar" : "en") as Lang;
    const dir = lang === "ar" ? "rtl" : "ltr";
    return (
      <div dir={dir} style={{ minHeight: "100vh", background: BG, color: INK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 40, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(13,27,46,0.06)", border: "1px solid rgba(13,27,46,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>○</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: INK }}>Package unavailable</div>
        <div style={{ fontSize: 15, color: "rgba(13,27,46,0.55)", maxWidth: 380, lineHeight: 1.6 }}>This package is not currently available. Contact the agency for alternatives.</div>
      </div>
    );
  }

  const lang = (pkg.language === "ar" ? "ar" : "en") as Lang;
  const effectiveAgency: TAgency = agency || {
    name: "Travel Agency",
    brandColor: DEFAULT_BRAND,
    activeTemplate: DEFAULT_TEMPLATE_ID,
    agencySlug: agencySlug || "",
    enableReviews: false,
    showReviews: false,
  };

  const openWA = () => {
    if (!pkg.whatsapp) return;
    const sid = getSession();
    trackClick("whatsapp");
    const msg = encodeURIComponent(`Hi, I'm interested in the ${pkg.destination} package (${pkg.price}). [ref:${sid.slice(0, 8)}]`);
    window.open(`https://wa.me/${pkg.whatsapp.replace(/\D/g, "")}?text=${msg}`, "_blank", "noopener,noreferrer");
  };

  const openMessenger = () => {
    if (!pkg.messenger) return;
    trackClick("messenger");
    const url = pkg.messenger.startsWith("m.me") ? `https://${pkg.messenger}` : `https://m.me/${pkg.messenger}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <PackageRenderer
      pkg={pkg}
      agency={effectiveAgency}
      lang={lang}
      onWhatsApp={openWA}
      onMessenger={openMessenger}
    />
  );
}
