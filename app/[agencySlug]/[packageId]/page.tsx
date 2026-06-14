"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { doc, getDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PackageRenderer from "@/components/PackageRenderer";
import type { TPackage, TAgency, Lang } from "@/components/templates/types";
import { locStr } from "@/components/templates/types";
import { DEFAULT_TEMPLATE_ID } from "@/components/templates/index";
import { T } from "@/lib/translations";
import { normalizePkg } from "@/lib/sections/normalize";

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
      let step = "packages";
      try {
        const pkgSnap = await getDoc(doc(db, "packages", packageId));
        if (!pkgSnap.exists()) { router.push("/builder"); return; }
        const data = { id: pkgSnap.id, ...pkgSnap.data() } as TPackage;
        const normalized = normalizePkg(data);

        if (data.userId && normalized.sections?.some(s => s.type === "other_packages")) {
          const othersSnap = await getDocs(
            query(collection(db, "packages"), where("userId", "==", data.userId))
          );
          const pkgLang = data.primaryLanguage || "ar";
          const cards = othersSnap.docs
            .filter(d => d.id !== packageId && d.data().isActive !== false && d.data().status !== "draft")
            .slice(0, 4)
            .map(d => {
              const pd = d.data();
              const title = typeof pd.title === "object" && pd.title !== null
                ? (pkgLang === "ar"
                  ? ((pd.title as Record<string, string>).ar || (pd.title as Record<string, string>).en || pd.destination || "")
                  : ((pd.title as Record<string, string>).en || (pd.title as Record<string, string>).ar || pd.destination || ""))
                : String(pd.title || pd.destination || "");
              return {
                title,
                destination: String(pd.destination || ""),
                price: String(pd.price || ""),
                nights: pd.nights ? String(pd.nights) : "",
                image: String(pd.coverImage || ""),
                link: `/${agencySlug}/${d.id}`,
              };
            });
          const idx = normalized.sections!.findIndex(s => s.type === "other_packages");
          if (idx !== -1) {
            normalized.sections![idx] = {
              ...normalized.sections![idx],
              data: { ...normalized.sections![idx].data, packages: cards },
            };
          }
        }

        setPkg(normalized);

        if (data.userId) {
          step = "users";
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
      } catch (err) { console.error(`[PackagePage] Firestore read failed on "${step}":`, err); }
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
    const lang = (pkg.primaryLanguage === "ar" ? "ar" : "en") as Lang;
    const t = T[lang];
    const dir = lang === "ar" ? "rtl" : "ltr";
    return (
      <div data-testid="pkg-unavailable" dir={dir} style={{ minHeight: "100vh", background: BG, color: INK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16, padding: 40, textAlign: "center" }}>
        <div style={{ width: 64, height: 64, borderRadius: 18, background: "rgba(13,27,46,0.06)", border: "1px solid rgba(13,27,46,0.08)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>○</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: INK }}>{t.packageUnavailableTitle}</div>
        <div style={{ fontSize: 15, color: "rgba(13,27,46,0.55)", maxWidth: 380, lineHeight: 1.6 }}>{t.packageUnavailableSub}</div>
      </div>
    );
  }

  const lang = (pkg.primaryLanguage === "ar" ? "ar" : "en") as Lang;
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
    trackClick("whatsapp");
    const title = locStr(pkg.title, lang) || pkg.destination;
    const body = lang === "ar"
      ? `السلام عليكم! أنا مهتم بباقة "${title}" (${pkg.price}). هل يمكنكم تزويدي بمزيد من التفاصيل؟`
      : `Hi! I'm interested in the "${title}" package (${pkg.price}). Could you share more details?`;
    const msg = encodeURIComponent(body);
    window.open(`https://wa.me/${pkg.whatsapp.replace(/\D/g, "")}?text=${msg}`, "_blank", "noopener,noreferrer");
  };

  const openMessenger = () => {
    if (!pkg.messenger) return;
    trackClick("messenger");
    const url = pkg.messenger.startsWith("m.me") ? `https://${pkg.messenger}` : `https://m.me/${pkg.messenger}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div data-testid="pkg-page">
      <PackageRenderer
        pkg={pkg}
        agency={effectiveAgency}
        lang={lang}
        templateId={pkg.templateId}
        onWhatsApp={openWA}
        onMessenger={openMessenger}
      />
    </div>
  );
}
