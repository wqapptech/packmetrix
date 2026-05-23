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
import { hasFullAccess } from "@/lib/trial";
import { BaseCard } from "@/components/templates/shared";
import { TEMPLATE_MAP } from "@/components/templates";
import type { TAgency } from "@/components/templates/types";

const SAND = "#e8c97b";
const AGENCY_BASE =
  process.env.NEXT_PUBLIC_AGENCY_URL ??
  (process.env.NODE_ENV === "development" ? "http://localhost:3000" : "https://agency.packmetrix.com");

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
  title?: string;
  templateId?: string;
};

type FilterTab = "all" | "live" | "draft" | "top";

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
  const [userId, setUserId] = useState("");
  const [canCreate, setCanCreate] = useState(false);
  const [agency, setAgency] = useState<TAgency>({ name: "Agency" });
  const [filter, setFilter] = useState<FilterTab>("all");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      setUserId(user.uid);
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.exists() ? snap.data() : {};
      const name = data.name || "";
      setAgencySlug(slugify(name) || "agency");
      setCanCreate(hasFullAccess(data.plan, data.trialEndsAt));
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

  // ── Stats ──────────────────────────────────────────────────────────────────
  const activeCount = packages.filter(p => p.agencySlug && p.isActive !== false).length;
  const totalViews  = packages.reduce((s, p) => s + (p.views || 0), 0);
  const totalLeads  = packages.reduce((s, p) => s + (p.whatsappClicks || 0) + (p.messengerClicks || 0), 0);
  const avgConv     = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0;

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filteredPkgs = (() => {
    switch (filter) {
      case "live": return packages.filter(p => p.agencySlug && p.isActive !== false);
      case "draft": return packages.filter(p => !p.agencySlug);
      case "top": {
        const withConv = packages
          .filter(p => (p.views || 0) > 0)
          .map(p => ({ ...p, _conv: ((p.whatsappClicks || 0) + (p.messengerClicks || 0)) / (p.views || 1) }))
          .sort((a, b) => b._conv - a._conv);
        const half = Math.ceil(withConv.length / 2) || 1;
        return withConv.slice(0, half);
      }
      default: return packages;
    }
  })();

  return (
    <AppLayout>
      <div dir={dir} style={{ padding: isMobile ? "16px 16px 40px" : "24px 28px 60px", maxWidth: 1280 }}>

        {/* Stats strip */}
        {!loading && packages.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(4, 1fr)",
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 14,
            overflow: "hidden",
            marginBottom: 20,
          }}>
            {[
              { v: String(activeCount), l: t.statsActivePackages },
              { v: totalViews.toLocaleString(), l: t.statsViewsThirtyDay },
              { v: totalLeads.toLocaleString(), l: t.statsLeadsThirtyDay },
              { v: avgConv > 0 ? avgConv.toFixed(2) + "%" : "—", l: t.statsAvgConversion },
            ].map((s, i) => (
              <div key={i} style={{ padding: "18px 20px", borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none" }}>
                <div style={{
                  fontFamily: "var(--font-instrument-serif, serif)",
                  fontSize: 30, lineHeight: 1, letterSpacing: "-0.5px",
                  color: "#fdfcf9",
                }}>
                  {s.v}
                </div>
                <div style={{
                  fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 6,
                  letterSpacing: "0.5px", textTransform: "uppercase", fontWeight: 600,
                  fontFamily: "var(--font-jetbrains-mono, monospace)",
                }}>
                  {s.l}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filter bar + New package button */}
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "center", gap: 12, marginBottom: 20, flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {([
              ["all",   t.filterAll],
              ["live",  t.filterLive],
              ["draft", t.filterDraft],
              ["top",   t.filterTopPerformers],
            ] as [FilterTab, string][]).map(([tab, label]) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                style={{
                  fontSize: 12, padding: "6px 14px",
                  border: `1px solid ${filter === tab ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.1)"}`,
                  borderRadius: 999,
                  background: filter === tab ? "rgba(255,255,255,0.1)" : "transparent",
                  color: filter === tab ? "#fdfcf9" : "rgba(255,255,255,0.45)",
                  cursor: "pointer", fontWeight: filter === tab ? 600 : 400,
                  fontFamily: "inherit", transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => canCreate ? router.push("/builder") : router.push("/paywall")}
            style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "9px 16px", borderRadius: 9,
              background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
              color: "#0a1426", fontWeight: 700, fontSize: 12.5,
              border: "none", cursor: "pointer", fontFamily: "inherit", flexShrink: 0,
            }}
          >
            <Icon name="plus" size={14} color="#0a1426" strokeWidth={2.5} /> {t.newPackageBtn}
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
            <span className="spinner" />
          </div>
        ) : packages.length === 0 ? (
          <div style={{
            display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", height: 320, gap: 16,
            background: "rgba(255,255,255,0.025)",
            border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16,
          }}>
            <div style={{ width: 52, height: 52, borderRadius: 14, background: `${SAND}18`, border: `1px solid ${SAND}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="archive" size={22} color={SAND} />
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 6 }}>{t.noPackages}</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{t.createFirst}</div>
            </div>
            <button
              onClick={() => canCreate ? router.push("/builder") : router.push("/paywall")}
              style={{ padding: "10px 20px", borderRadius: 9, background: `linear-gradient(135deg, ${SAND}, #c4a84f)`, color: "#0a1426", fontWeight: 700, fontSize: 13, border: "none", cursor: "pointer", fontFamily: "inherit", display: "inline-flex", alignItems: "center", gap: 8 }}
            >
              <Icon name="plus" size={14} color="#0a1426" strokeWidth={2.5} /> {t.newPackageBtn}
            </button>
          </div>
        ) : filteredPkgs.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.35)", fontSize: 14 }}>
            {t.noPackages}
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: 16,
          }}>
            {filteredPkgs.map(pkg => {
              const tpl = pkg.templateId ? TEMPLATE_MAP[pkg.templateId] : undefined;
              return (
                <BaseCard
                  key={pkg.id}
                  pkg={pkg}
                  agency={agency}
                  lang={lang}
                  stripeColor={tpl?.templateColor}
                  templateName={tpl ? (lang === "ar" ? tpl.nameAr : tpl.name) : undefined}
                  templateDark={tpl?.dark}
                  onView={() => window.open(`${AGENCY_BASE}/${pkg.agencySlug || agencySlug}/${pkg.id}`, "_blank", "noopener,noreferrer")}
                  onEdit={() => router.push(`/builder?id=${pkg.id}`)}
                  onCopyLink={pkg.agencySlug
                    ? () => navigator.clipboard?.writeText(`${AGENCY_BASE}/${pkg.agencySlug}/${pkg.id}`)
                    : undefined
                  }
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
                  onDuplicate={async () => {
                    if (!confirm(t.confirmDuplicate)) return;
                    const res = await fetch("/api/duplicate", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ packageId: pkg.id, userId }),
                    });
                    if (!res.ok) return;
                    const { id, agencySlug: slug } = await res.json();
                    setPackages(prev => [{
                      ...pkg,
                      id,
                      agencySlug: slug,
                      isActive: false,
                      views: 0,
                      whatsappClicks: 0,
                      messengerClicks: 0,
                      createdAt: Date.now(),
                    }, ...prev]);
                  }}
                />
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
