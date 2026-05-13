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

const SAND = "#e8c97b";
const SUCCESS = "#2dd4a0";

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

function scoreFromConv(conv: number): number {
  if (conv >= 5) return 95;
  if (conv >= 3) return 85;
  if (conv >= 2) return 75;
  if (conv >= 1) return 60;
  if (conv > 0) return 45;
  return 30;
}

const DOT_COLORS = ["#c9713a", "#2d7a4e", "#2563a8", "#7c3aed", "#0f766e"];

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

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.exists() ? snap.data() : {};
      const name = data.name || "";
      setAgencySlug(slugify(name) || "agency");
      setIsPro(data.plan === "pro" || data.plan === "agency");
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
            {packages.map((pkg, idx) => (
              <PackageCard
                key={pkg.id}
                pkg={pkg}
                dotColor={DOT_COLORS[idx % DOT_COLORS.length]}
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

function PackageCard({
  pkg, dotColor, lang, onView, onEdit, onDelete, onToggleActive,
}: {
  pkg: Package;
  dotColor: string;
  lang: "en" | "ar";
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  const t = T[lang];
  const thumbUrl = pkg.coverImage || pkg.images?.[0];
  const clicks = (pkg.whatsappClicks || 0) + (pkg.messengerClicks || 0);
  const conv = (pkg.views || 0) > 0 ? (clicks / pkg.views) * 100 : 0;
  const score = scoreFromConv(conv);
  const scoreColor = score >= 80 ? SUCCESS : score >= 65 ? SAND : "#f5a623";
  const isPublished = Boolean(pkg.agencySlug);
  const isActive = pkg.isActive !== false;
  const badgeBg = !isPublished ? "rgba(255,255,255,0.18)" : isActive ? "rgba(45,212,160,0.88)" : "rgba(180,90,30,0.82)";
  const badgeColor = !isPublished ? "#fff" : "#0a1426";
  const badgeLabel = !isPublished ? t.packageStatusDraft : isActive ? `● ${t.live}` : `○ ${t.packageStatusInactive}`;

  return (
    <div style={{
      background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 14, overflow: "hidden",
    }}>
      {/* Cover image */}
      <div style={{ height: 160, position: "relative", background: thumbUrl ? `url(${thumbUrl}) center/cover` : dotColor, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {!thumbUrl && <Icon name="map" size={28} color="rgba(255,255,255,0.5)" />}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, transparent 45%, rgba(0,0,0,0.55))" }} />

        {/* Status badge */}
        <div style={{
          position: "absolute", top: 12, left: 12,
          padding: "3px 10px", borderRadius: 99,
          background: badgeBg, backdropFilter: "blur(8px)",
          color: badgeColor,
          fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: ".4px",
        }}>
          {badgeLabel}
        </div>

        {/* Score badge */}
        <div style={{
          position: "absolute", top: 12, right: 12,
          padding: "4px 10px", borderRadius: 99,
          background: "rgba(0,0,0,0.45)", backdropFilter: "blur(8px)",
          color: "#fff", fontSize: 10.5, fontWeight: 700,
        }}>
          Score <b style={{ color: scoreColor, marginLeft: 4 }}>{score}</b>
        </div>

        {/* Package name over image */}
        <div style={{ position: "absolute", left: 14, right: 14, bottom: 12, color: "#fff" }}>
          <div style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.3px", lineHeight: 1.1 }}>{pkg.destination}</div>
          <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>{pkg.price}</div>
        </div>
      </div>

      {/* Stats + actions */}
      <div style={{ padding: "14px 18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 12 }}>
          <Stat value={(pkg.views || 0).toLocaleString()} label={t.statViews} />
          <Stat value={String(clicks)} label={t.statLeads} />
          <Stat value={conv.toFixed(1) + "%"} label={t.statConversion} color={scoreColor} />
        </div>

        <div style={{ display: "flex", gap: 6 }}>
          <ActionBtn label={t.preview} onClick={onView} />
          <ActionBtn label={t.apply} onClick={onEdit} icon="edit" />
          {isPublished && (
            <button
              onClick={onToggleActive}
              title={isActive ? t.markInactive : t.markActive}
              style={{
                width: 32, height: 32, borderRadius: 7,
                background: isActive ? "rgba(45,212,160,0.08)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${isActive ? "rgba(45,212,160,0.25)" : "rgba(255,255,255,0.08)"}`,
                color: isActive ? "rgba(45,212,160,0.8)" : "rgba(255,255,255,0.35)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18.36 6.64A9 9 0 1 1 5.64 5.64" /><line x1="12" y1="2" x2="12" y2="12" />
              </svg>
            </button>
          )}
          <button
            onClick={onDelete}
            style={{
              width: 32, height: 32, borderRadius: 7,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              color: "rgba(220,80,80,0.7)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
            title={t.deletePackage}
          >
            <Icon name="trash" size={14} color="rgba(220,80,80,0.7)" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: color || "#fdfcf9" }}>{value}</div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".4px", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function ActionBtn({ label, onClick, icon }: { label: string; onClick: () => void; icon?: "edit" }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: "7px", borderRadius: 7,
        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        color: "rgba(255,255,255,0.7)", fontSize: 11.5, fontWeight: 600,
        cursor: "pointer", fontFamily: "inherit",
        display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
      }}
    >
      {icon && <Icon name={icon} size={12} color="rgba(255,255,255,0.55)" />}
      {label}
    </button>
  );
}
