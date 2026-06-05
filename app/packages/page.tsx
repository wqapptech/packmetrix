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
import { PackageCard } from "@/components/packages/PackageCard";
import { ConfirmModal } from "@/components/ConfirmModal";
import { TEMPLATE_MAP } from "@/components/templates";
import type { TAgency, LocStr } from "@/components/templates/types";
import {
  DA_BG,
  DA_SURFACE,
  DA_SURFACE2,
  DA_INK1,
  DA_INK2,
  DA_INK3,
  DA_RULE,
  DA_RULE2,
  DA_GOLD,
  DA_GOLD_SOFT,
  DA_GREEN,
  DA_GREEN_SOFT,
  DA_DANGER,
  DA_DANGER_SOFT,
} from "@/lib/tokens";

const DISPLAY = `var(--font-instrument-serif), Georgia, serif`;
const SANS = `var(--font-inter-tight), system-ui, sans-serif`;

function pkgUrl(slug: string, id: string, customDomain?: string): string {
  if (customDomain) return `https://${customDomain}/${id}`;
  if (process.env.NODE_ENV === "development") return `http://localhost:3000/${slug}/${id}`;
  if (process.env.NEXT_PUBLIC_ENV !== "production") {
    return `${process.env.NEXT_PUBLIC_APP_URL}/${slug}/${id}`;
  }
  return `https://${slug}.packmetrix.com/${id}`;
}

function agencyUrl(slug: string, customDomain?: string): string {
  if (customDomain) return `https://${customDomain}`;
  if (process.env.NODE_ENV === "development") return `http://localhost:3000/${slug}`;
  if (process.env.NEXT_PUBLIC_ENV !== "production") {
    return `${process.env.NEXT_PUBLIC_APP_URL}/${slug}`;
  }
  return `https://${slug}.packmetrix.com`;
}

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
  primaryLanguage: "en" | "ar";
};

type FilterTab = "all" | "live" | "draft" | "top";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function StatTile({
  value,
  label,
  sub,
  trend,
  isMobile,
}: {
  value: string;
  label: string;
  sub: string;
  trend?: string;
  isMobile: boolean;
}) {
  return (
    <div style={{
      background: DA_SURFACE,
      border: `1px solid ${DA_RULE}`,
      borderRadius: 12,
      padding: isMobile ? "14px 16px" : 20,
      display: "flex",
      flexDirection: "column",
      gap: 4,
    }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
        <div style={{
          fontFamily: DISPLAY,
          fontSize: isMobile ? 32 : 40,
          fontWeight: 400,
          color: DA_INK1,
          letterSpacing: -1,
          lineHeight: 1,
        }}>
          {value}
        </div>
        {trend && (
          <span style={{
            fontSize: 11,
            fontWeight: 600,
            color: DA_GREEN,
            background: DA_GREEN_SOFT,
            padding: "1px 6px",
            borderRadius: 999,
            fontFamily: SANS,
          }}>
            {trend}
          </span>
        )}
      </div>
      <div style={{
        fontFamily: SANS,
        fontSize: 11,
        fontWeight: 600,
        color: DA_INK3,
        letterSpacing: .8,
        textTransform: "uppercase",
        marginTop: 2,
      }}>
        {label}
      </div>
      <div style={{ fontFamily: SANS, fontSize: 11, color: DA_INK3 }}>
        {sub}
      </div>
    </div>
  );
}

export default function PackagesPage() {
  const router = useRouter();
  const lang = useLang();
  const isMobile = useIsMobile();
  const t = T[lang];
  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [agencySlug, setAgencySlug] = useState("agency");
  const [userId, setUserId] = useState("");
  const [canCreate, setCanCreate] = useState(false);
  const [agency, setAgency] = useState<TAgency>({ name: "Agency" });
  const [filter, setFilter] = useState<FilterTab>("all");
  const [sortLabel] = useState(isAr ? "ترتيب حسب: التحويل" : "Sort: conversion");
  const [customDomain, setCustomDomain] = useState<string | undefined>(undefined);
  const [confirmAction, setConfirmAction] = useState<{ type: "delete" | "duplicate"; pkg: Package } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [deleteLeadCount, setDeleteLeadCount] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }
      setUserId(user.uid);
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.exists() ? snap.data() : {};
      const name = data.name || "";
      setAgencySlug(slugify(name) || "agency");
      setCanCreate(hasFullAccess(data.plan, data.trialEndsAt));
      setAgency({ name, tagline: data.tagline || "", logoUrl: data.logoUrl || "" });
      if (data.customDomainStatus === "active" && data.customDomain) {
        setCustomDomain(data.customDomain);
      }
      setAuthLoading(false);

      const pkgSnap = await getDocs(query(collection(db, "packages"), where("userId", "==", user.uid)));
      setPackages(pkgSnap.docs.map((d) => {
        const data = d.data();
        const primaryLanguage: "en" | "ar" =
          (data.primaryLanguage || data.language) === "ar" ? "ar" : "en";
        return { id: d.id, ...data, primaryLanguage } as Package;
      }));
      setLoading(false);
    });
    return () => unsub();
  }, [router]);

  if (authLoading) {
    return (
      <AppLayout>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="spinner-warm" />
        </div>
      </AppLayout>
    );
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const activeCount = packages.filter((p) => p.agencySlug && p.isActive !== false).length;
  const draftCount  = packages.filter((p) => !p.agencySlug).length;
  const totalViews  = packages.reduce((s, p) => s + (p.views || 0), 0);
  const totalLeads  = packages.reduce((s, p) => s + (p.whatsappClicks || 0) + (p.messengerClicks || 0), 0);
  const avgConv     = totalViews > 0 ? (totalLeads / totalViews) * 100 : 0;

  const countLabel =
    packages.length > 0
      ? `${activeCount} ${isAr ? "نشط" : "active"} · ${draftCount} ${isAr ? "مسودة" : "draft"}`
      : "";

  // ── Filter ─────────────────────────────────────────────────────────────────
  const filteredPkgs = (() => {
    switch (filter) {
      case "live":
        return packages.filter((p) => p.agencySlug && p.isActive !== false);
      case "draft":
        return packages.filter((p) => !p.agencySlug);
      case "top": {
        const withConv = packages
          .filter((p) => (p.views || 0) > 0)
          .map((p) => ({
            ...p,
            _conv: ((p.whatsappClicks || 0) + (p.messengerClicks || 0)) / (p.views || 1),
          }))
          .sort((a, b) => b._conv - a._conv);
        const half = Math.ceil(withConv.length / 2) || 1;
        return withConv.slice(0, half);
      }
      default:
        return packages;
    }
  })();

  const filterTabs: [FilterTab, string][] = [
    ["all",  t.filterAll],
    ["live", t.filterLive],
    ["draft", t.filterDraft],
    ["top",  t.filterTopPerformers],
  ];

  const range30d = isAr ? "آخر ٣٠ يوم" : "Last 30 days";

  return (
    <>
    <AppLayout>
      <div
        dir={dir}
        style={{
          padding: isMobile ? "20px 16px 48px" : "32px 40px 56px",
          maxWidth: 1280,
          background: DA_BG,
          minHeight: "100%",
        }}
      >
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 28,
          gap: 18,
          flexWrap: "wrap",
        }}>
          <div>
            {/* Eyebrow crumb */}
            <div style={{
              fontFamily: SANS,
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1.3,
              textTransform: "uppercase",
              color: DA_INK3,
              marginBottom: 10,
            }}>
              {isAr ? "الوكالة · الباقات" : "Workspace · Packages"}
            </div>
            <div style={{
              fontFamily: DISPLAY,
              fontSize: isMobile ? 32 : 42,
              fontWeight: 400,
              color: DA_INK1,
              letterSpacing: -1,
              lineHeight: 1,
            }}>
              {t.yourPackages}
            </div>
            {countLabel && (
              <div style={{ fontFamily: SANS, fontSize: 13.5, color: DA_INK2, marginTop: 8 }}>
                {countLabel}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            <a
              href={agencyUrl(agencySlug, customDomain)}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                background: DA_SURFACE,
                color: DA_INK2,
                border: `1px solid ${DA_RULE2}`,
                borderRadius: 9,
                padding: "8px 16px",
                fontSize: 13,
                fontWeight: 600,
                fontFamily: SANS,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                textDecoration: "none",
              }}
            >
              <Icon name="globe" size={14} color={DA_INK3} />
              {isAr ? "معاينة المتجر" : "Preview storefront"}
            </a>
            <button
              onClick={() => (canCreate ? router.push("/builder") : router.push("/paywall"))}
              style={{
                background: DA_GOLD,
                color: "#fff",
                border: "none",
                borderRadius: 9,
                padding: "8px 18px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: SANS,
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Icon name="plus" size={14} color="#fff" />
              {t.newPackageBtn}
            </button>
          </div>
        </div>

        {/* ── Stat tiles ────────────────────────────────────────────────── */}
        {!loading && packages.length > 0 && (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
            gap: 14,
            marginBottom: 20,
          }}>
            <StatTile
              value={String(activeCount)}
              label={t.statsActivePackages}
              sub={range30d}
              isMobile={isMobile}
            />
            <StatTile
              value={totalViews.toLocaleString()}
              label={t.statsViewsThirtyDay}
              sub={range30d}
              isMobile={isMobile}
            />
            <StatTile
              value={totalLeads.toLocaleString()}
              label={t.statsLeadsThirtyDay}
              sub={range30d}
              trend={totalLeads > 0 ? `+${totalLeads}` : undefined}
              isMobile={isMobile}
            />
            <StatTile
              value={avgConv > 0 ? avgConv.toFixed(2) + "%" : "—"}
              label={t.statsAvgConversion}
              sub={range30d}
              isMobile={isMobile}
            />
          </div>
        )}

        {/* ── Filter bar ────────────────────────────────────────────────── */}
        {!loading && packages.length > 0 && (
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            marginBottom: 20,
            flexWrap: "wrap",
          }}>
            {filterTabs.map(([tab, label]) => {
              const isActive = filter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 999,
                    border: `1px solid ${isActive ? "transparent" : DA_RULE2}`,
                    fontSize: 12.5,
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: SANS,
                    background: isActive ? DA_INK1 : DA_SURFACE,
                    color: isActive ? DA_BG : DA_INK1,
                    transition: "background .12s, color .12s",
                  }}
                >
                  {label}
                </button>
              );
            })}
            <div style={{ flex: 1 }} />
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              background: DA_SURFACE,
              border: `1px solid ${DA_RULE2}`,
              borderRadius: 8,
              fontFamily: SANS,
              fontSize: 12.5,
              color: DA_INK2,
              cursor: "pointer",
              userSelect: "none",
            }}>
              {sortLabel}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={DA_INK3} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>
        )}

        {/* ── Content ───────────────────────────────────────────────────── */}
        {loading ? (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
            <span className="spinner-warm" />
          </div>
        ) : packages.length === 0 ? (
          <div style={{
            padding: 56,
            textAlign: "center",
            background: DA_SURFACE,
            border: `1px solid ${DA_RULE}`,
            borderRadius: 16,
          }}>
            <div style={{
              width: 72, height: 72, borderRadius: 18,
              background: DA_GOLD_SOFT, color: DA_GOLD,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              marginBottom: 22,
            }}>
              <Icon name="archive" size={32} color={DA_GOLD} strokeWidth={1.5} />
            </div>
            <div style={{
              fontFamily: DISPLAY, fontSize: 32, fontWeight: 400,
              color: DA_INK1, letterSpacing: -.6, marginBottom: 10,
            }}>
              {isAr ? "لا توجد باقات بعد." : "No packages yet."}
            </div>
            <div style={{
              fontSize: 14, color: DA_INK2,
              maxWidth: 420, marginInline: "auto", lineHeight: 1.55, marginBottom: 22,
              fontFamily: SANS,
            }}>
              {t.createFirst}
            </div>
            <button
              onClick={() => (canCreate ? router.push("/builder") : router.push("/paywall"))}
              style={{
                background: DA_GOLD, color: "#fff", border: "none",
                borderRadius: 9, padding: "9px 22px",
                fontSize: 14, fontWeight: 600, cursor: "pointer", fontFamily: SANS,
                display: "inline-flex", alignItems: "center", gap: 6,
              }}
            >
              <Icon name="plus" size={15} color="#fff" />
              {t.newPackageBtn}
            </button>
          </div>
        ) : filteredPkgs.length === 0 ? (
          <div style={{
            fontSize: 14, color: DA_INK3, textAlign: "center", padding: "60px 0", fontFamily: SANS,
          }}>
            {t.noPackages}
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)",
            gap: 16,
          }}>
            {filteredPkgs.map((pkg) => {
              const tpl = pkg.templateId ? TEMPLATE_MAP[pkg.templateId] : undefined;
              return (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  agency={agency}
                  lang={lang}
                  templateName={tpl ? (isAr ? tpl.nameAr : tpl.name) : undefined}
                  onView={() =>
                    window.open(
                      pkgUrl(pkg.agencySlug || agencySlug, pkg.id, customDomain),
                      "_blank",
                      "noopener,noreferrer"
                    )
                  }
                  onEdit={() => router.push(`/builder?id=${pkg.id}`)}
                  onCopyLink={
                    pkg.agencySlug
                      ? () => navigator.clipboard?.writeText(pkgUrl(pkg.agencySlug!, pkg.id, customDomain))
                      : undefined
                  }
                  shareUrl={pkg.agencySlug ? pkgUrl(pkg.agencySlug, pkg.id, customDomain) : undefined}
                  onDelete={async () => {
                    const leadsSnap = await getDocs(query(collection(db, "leads"), where("packageId", "==", pkg.id)));
                    setDeleteLeadCount(leadsSnap.size);
                    setConfirmAction({ type: "delete", pkg });
                  }}
                  onToggleActive={async () => {
                    const next = pkg.isActive === false ? true : false;
                    posthog.capture("package_toggled_active", { destination: pkg.destination, is_active: next });
                    await updateDoc(doc(db, "packages", pkg.id), { isActive: next });
                    setPackages((prev) =>
                      prev.map((p) => (p.id === pkg.id ? { ...p, isActive: next } : p))
                    );
                  }}
                  onDuplicate={() => setConfirmAction({ type: "duplicate", pkg })}
                />
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>

    <ConfirmModal
      open={confirmAction !== null}
      onClose={() => { if (!confirmLoading) setConfirmAction(null); }}
      loading={confirmLoading}
      dir={dir}
      variant={confirmAction?.type === "delete" ? "danger" : "default"}
      icon={confirmAction?.type === "delete" ? "trash" : "copy"}
      title={
        confirmAction?.type === "delete"
          ? (isAr ? "حذف الباقة؟" : "Delete package?")
          : (isAr ? "تكرار الباقة؟" : "Duplicate package?")
      }
      message={
        confirmAction?.type === "delete"
          ? isAr
            ? deleteLeadCount > 0
              ? `سيتم حذف هذه الباقة و${deleteLeadCount} ${deleteLeadCount === 1 ? "عميل محتمل" : "عملاء محتملون"} نهائياً. لا يمكن التراجع عن هذا الإجراء.`
              : "سيتم حذف هذه الباقة نهائياً ولا يمكن التراجع."
            : deleteLeadCount > 0
              ? `This will permanently delete the package and its ${deleteLeadCount} ${deleteLeadCount === 1 ? "lead" : "leads"}. This cannot be undone.`
              : "This package will be permanently deleted. This cannot be undone."
          : (isAr ? "سيتم إنشاء نسخة جديدة كمسودة غير نشطة." : "A copy will be created as an inactive draft.")
      }
      confirmLabel={
        confirmAction?.type === "delete"
          ? (isAr ? "نعم، احذف" : "Delete")
          : (isAr ? "نعم، كرّر" : "Duplicate")
      }
      cancelLabel={isAr ? "إلغاء" : "Cancel"}
      onConfirm={async () => {
        if (!confirmAction) return;
        setConfirmLoading(true);
        try {
          if (confirmAction.type === "delete") {
            posthog.capture("package_deleted", { destination: confirmAction.pkg.destination, views: confirmAction.pkg.views, leads_deleted: deleteLeadCount });
            // Cascade-delete associated leads in parallel with the package
            const leadsSnap = await getDocs(query(collection(db, "leads"), where("packageId", "==", confirmAction.pkg.id)));
            await Promise.all([
              deleteDoc(doc(db, "packages", confirmAction.pkg.id)),
              ...leadsSnap.docs.map(d => deleteDoc(d.ref)),
            ]);
            setPackages(prev => prev.filter(p => p.id !== confirmAction.pkg.id));
          } else {
            const res = await fetch("/api/duplicate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ packageId: confirmAction.pkg.id, userId }),
            });
            if (res.ok) {
              const { id, agencySlug: slug } = await res.json();
              setPackages(prev => [
                { ...confirmAction.pkg, id, agencySlug: slug, isActive: false, views: 0, whatsappClicks: 0, messengerClicks: 0, createdAt: Date.now() },
                ...prev,
              ]);
            }
          }
        } finally {
          setConfirmLoading(false);
          setConfirmAction(null);
        }
      }}
    />
    </>
  );
}
