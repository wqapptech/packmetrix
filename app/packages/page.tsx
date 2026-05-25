"use client";

import "../packages.css";
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
import { PackageCard } from "@/components/packages/PackageCard";
import { TEMPLATE_MAP } from "@/components/templates";
import type { TAgency, LocStr } from "@/components/templates/types";

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
  title?: LocStr;
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
      setAgency({ name, tagline: data.tagline || "", logoUrl: data.logoUrl || "" });
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
  const draftCount  = packages.filter(p => !p.agencySlug).length;
  const totalViews  = packages.reduce((s, p) => s + (p.views || 0), 0);
  const totalLeads  = packages.reduce((s, p) => s + (p.whatsappClicks || 0) + (p.messengerClicks || 0), 0);
  const avgConv     = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0;

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filteredPkgs = (() => {
    switch (filter) {
      case "live":  return packages.filter(p => p.agencySlug && p.isActive !== false);
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

  const countLabel = packages.length > 0
    ? `${activeCount} ${lang === "ar" ? "نشط" : "active"} · ${draftCount} ${lang === "ar" ? "مسودة" : "draft"}`
    : "";

  return (
    <AppLayout>
      <div dir={dir} style={{ padding: isMobile ? "16px" : "24px", maxWidth: 1280 }}>
        <div className="dash">

          {/* Header — title + filters + CTA all in one row (spec: dash__head) */}
          <div className="dash__head">
            <div className="dash__title">
              {t.yourPackages}
              {countLabel && <small>{countLabel}</small>}
            </div>
            <div className="dash__filters">
              {([
                ["all",   t.filterAll],
                ["live",  t.filterLive],
                ["draft", t.filterDraft],
                ["top",   t.filterTopPerformers],
              ] as [FilterTab, string][]).map(([tab, label]) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={"dash__filter" + (filter === tab ? " dash__filter--active" : "")}
                >
                  {label}
                </button>
              ))}
              <button
                onClick={() => canCreate ? router.push("/builder") : router.push("/paywall")}
                className="dash__filter dash__filter--cta"
              >
                + {t.newPackageBtn}
              </button>
            </div>
          </div>

          {/* Stats row — shown once data is loaded and packages exist */}
          {!loading && packages.length > 0 && (
            <div className="dash__stats">
              {[
                { v: String(activeCount),                           l: t.statsActivePackages },
                { v: totalViews.toLocaleString(),                   l: t.statsViewsThirtyDay },
                { v: totalLeads.toLocaleString(),                   l: t.statsLeadsThirtyDay },
                { v: avgConv > 0 ? avgConv.toFixed(2) + "%" : "—", l: t.statsAvgConversion  },
              ].map((s, i) => (
                <div key={i} className="dash__stat">
                  <div className="v">{s.v}</div>
                  <div className="l">{s.l}</div>
                </div>
              ))}
            </div>
          )}

          {/* Content */}
          {loading ? (
            <div className="dash__loading">
              <span className="spinner" style={{ borderTopColor: "var(--dash-ink)", borderColor: "var(--dash-line)" }} />
            </div>
          ) : packages.length === 0 ? (
            <div className="dash__empty">
              <div className="dash__empty-icon">
                <Icon name="archive" size={20} color="var(--dash-mut)" />
              </div>
              <div>
                <div className="dash__empty-title">{t.noPackages}</div>
                <div className="dash__empty-sub">{t.createFirst}</div>
              </div>
              <button
                onClick={() => canCreate ? router.push("/builder") : router.push("/paywall")}
                className="dash__filter dash__filter--cta"
                style={{ padding: "10px 20px", borderRadius: 9, fontSize: 13 }}
              >
                + {t.newPackageBtn}
              </button>
            </div>
          ) : filteredPkgs.length === 0 ? (
            <div style={{ padding: "60px 24px", textAlign: "center", color: "var(--dash-mut)", fontSize: 14 }}>
              {t.noPackages}
            </div>
          ) : (
            <div className="dash__grid">
              {filteredPkgs.map(pkg => {
                const tpl = pkg.templateId ? TEMPLATE_MAP[pkg.templateId] : undefined;
                return (
                  <PackageCard
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
      </div>
    </AppLayout>
  );
}
