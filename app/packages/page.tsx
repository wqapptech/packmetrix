"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, deleteDoc, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";
import Icon from "@/components/Icon";
import { useLang } from "@/hooks/useLang";
import { useIsMobile } from "@/hooks/useIsMobile";
import { T } from "@/lib/translations";
import posthog from "posthog-js";
import { FREE_PACKAGE_LIMIT } from "@/lib/limits";
import { BaseCard } from "@/components/templates/shared";
import type { TAgency } from "@/components/templates/types";

const SAND = "#e8c97b";

type Package = {
  id: string;
  destination: string;
  price: string;
  views: number;
  whatsappClicks: number;
  messengerClicks: number;
  createdAt?: number;
  coverImage?: string;
  images?: string[];
  agencySlug?: string;
  isActive?: boolean;
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}



export default function PackagesPage() {
  const router = useRouter();
  const lang = useLang();
  const isMobile = useIsMobile();
  const t = T[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [agencySlug, setAgencySlug] = useState("agency");
  const [isPro, setIsPro] = useState(false);
  const [agency, setAgency] = useState<TAgency>({ name: "Agency" });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.exists() ? snap.data() : {};
      const name = data.name || "";
      setAgencySlug(slugify(name) || "agency");
      setIsPro(data.plan === "pro" || data.plan === "agency");
      setAgency({
        name,
        tagline: data.tagline || "",
        logoUrl: data.logoUrl || "",
      });
      setAuthLoading(false);

      const pkgSnap = await getDocs(query(collection(db, "packages"), where("userId", "==", user.uid)));
      setPackages(pkgSnap.docs.map(d => ({ id: d.id, ...d.data() } as Package)));
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  if (authLoading) {
    return (
      <AppLayout>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="spinner" />
        </div>
      </AppLayout>
    );
  }

  const liveCount = packages.filter(p => p.agencySlug && p.isActive !== false).length;

  return (
    <AppLayout>
      <div dir={dir} style={{ padding: isMobile ? "16px 16px 40px" : "28px 32px 60px", maxWidth: 1240 }}>
        {/* Page head */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.4px" }}>{t.navPackages}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
              {packages.length} {t.packages.toLowerCase()} · {liveCount} {t.live.toLowerCase()}
            </div>
          </div>
          <button
            onClick={() => (!isPro && packages.length >= FREE_PACKAGE_LIMIT) ? router.push("/paywall") : router.push("/builder")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "9px 16px", borderRadius: 9,
              background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
              color: "#0a1426", fontWeight: 700, fontSize: 12.5,
              border: "none", cursor: "pointer", fontFamily: "inherit",
            }}
          >
            <Icon name="plus" size={14} color="#0a1426" strokeWidth={2.5} /> {t.newPackageBtn}
          </button>
        </div>

        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
            <span className="spinner" />
          </div>
        ) : packages.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            height: 320, gap: 16,
            background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 16,
          }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `${SAND}18`, border: `1px solid ${SAND}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="archive" size={22} color={SAND} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{t.noPackages}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{t.createFirst}</div>
            </div>
            <button
              onClick={() => (!isPro && packages.length >= FREE_PACKAGE_LIMIT) ? router.push("/paywall") : router.push("/builder")}
              style={{
                padding: "10px 20px", borderRadius: 9,
                background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
                color: "#0a1426", fontWeight: 700, fontSize: 13,
                border: "none", cursor: "pointer", fontFamily: "inherit",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}
            >
              <Icon name="plus" size={14} color="#0a1426" strokeWidth={2.5} /> {t.newPackageBtn}
            </button>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)", gap: 16 }}>
            {packages.map(pkg => (
              <BaseCard
                key={pkg.id}
                pkg={pkg}
                agency={agency}
                lang={lang}
                onView={() => window.open(`/${pkg.agencySlug || agencySlug}/${pkg.id}`, "_blank", "noopener,noreferrer")}
                onEdit={() => router.push(`/builder?id=${pkg.id}`)}
                onDelete={async () => {
                  if (!confirm(t.confirmDeletePackage)) return;
                  posthog.capture("package_deleted", { destination: pkg.destination, views: pkg.views });
                  await deleteDoc(doc(db, "packages", pkg.id));
                  setPackages(prev => prev.filter(p => p.id !== pkg.id));
                }}
                onToggleActive={async () => {
                  const next = pkg.isActive === false ? true : false;
                  posthog.capture("package_toggled_active", { destination: pkg.destination, is_active: next });
                  await updateDoc(doc(db, "packages", pkg.id), { isActive: next });
                  setPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, isActive: next } : p));
                }}
              />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}

