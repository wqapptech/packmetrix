"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";
import Icon from "@/components/Icon";

const SAND = "#e8c97b";
const SUCCESS = "#2dd4a0";
const TEAL = "#4ecdc4";

type Package = {
  id: string;
  destination: string;
  price: string;
  views: number;
  whatsappClicks: number;
  messengerClicks: number;
  createdAt?: number;
};

// ── Bar chart (SVG) ───────────────────────────────────────────────────────────

function BarChart({ packages }: { packages: Package[] }) {
  const maxVal = Math.max(...packages.map(p => p.views), 1);
  const W = 500;
  const H = 140;
  const barW = 30;
  const gap = 60;
  const groupW = barW * 2 + 10;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 30}`} style={{ overflow: "visible" }}>
      {[0.25, 0.5, 0.75, 1].map((pct, i) => (
        <line key={i} x1={0} y1={H * (1 - pct)} x2={W} y2={H * (1 - pct)}
          stroke="rgba(255,255,255,0.05)" strokeWidth={1} />
      ))}
      {packages.map((pkg, i) => {
        const cx = 20 + i * (groupW + gap) + groupW / 2;
        const viewH = (pkg.views / maxVal) * H;
        const clickH = ((pkg.whatsappClicks + pkg.messengerClicks) / maxVal) * H;
        const label = pkg.destination.split(",")[0];
        return (
          <g key={pkg.id}>
            <rect x={cx - barW - 5} y={H - viewH} width={barW} height={viewH}
              fill={SAND} opacity={0.75} rx={4} />
            <rect x={cx + 5} y={H - clickH} width={barW} height={clickH}
              fill={TEAL} opacity={0.75} rx={4} />
            <text x={cx} y={H + 20} textAnchor="middle"
              fill="rgba(255,255,255,0.35)" fontSize={11} fontFamily="DM Sans, sans-serif">
              {label.length > 10 ? label.slice(0, 10) + "…" : label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ── Lead funnel ───────────────────────────────────────────────────────────────

const FUNNEL_STAGES = [
  { key: "views", label: "Page Views", color: SAND },
  { key: "clicks", label: "CTA Clicks", color: TEAL },
  { key: "booked", label: "Bookings", color: SUCCESS },
];

function LeadFunnel({ packages }: { packages: Package[] }) {
  const views = packages.reduce((a, b) => a + (b.views || 0), 0);
  const clicks = packages.reduce((a, b) => a + (b.whatsappClicks || 0) + (b.messengerClicks || 0), 0);
  const booked = Math.round(clicks * 0.15);

  const values = { views, clicks, booked };
  const maxVal = Math.max(views, 1);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {FUNNEL_STAGES.map(({ key, label, color }) => {
        const val = values[key as keyof typeof values];
        const pct = (val / maxVal) * 100;
        return (
          <div key={key}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: color, display: "inline-block" }} />
                {label}
              </span>
              <span style={{ fontSize: 12, fontWeight: 700, color }}>{val.toLocaleString()}</span>
            </div>
            <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, opacity: 0.8, transition: "width 0.6s" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Package row ───────────────────────────────────────────────────────────────

function PackageRow({ pkg, onView, isLast }: { pkg: Package; onView: () => void; isLast: boolean }) {
  const clicks = (pkg.whatsappClicks || 0) + (pkg.messengerClicks || 0);
  const ctr = (pkg.views || 0) > 0 ? ((clicks / pkg.views) * 100).toFixed(1) : "0.0";
  const dotColors = ["#c9713a", "#2d7a4e", "#2563a8", "#7c3aed", "#0f766e"];
  const dotColor = dotColors[Math.abs(pkg.id.charCodeAt(0)) % dotColors.length];

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 16, padding: "14px 24px",
      borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)",
      transition: "background 0.15s",
    }}
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
    >
      <div style={{ width: 36, height: 36, borderRadius: 10, background: dotColor, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="map" size={14} color="rgba(255,255,255,0.7)" />
      </div>
      <div style={{ flex: 2 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{pkg.destination}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
          {pkg.price}{pkg.createdAt ? ` · Created ${new Date(pkg.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : ""}
        </div>
      </div>
      <StatCell label="Views" value={(pkg.views || 0).toLocaleString()} />
      <StatCell label="Clicks" value={clicks} />
      <StatCell label="CTR" value={`${ctr}%`} />
      <button onClick={onView} style={{
        background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 8, padding: "5px 12px",
        color: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "inherit",
        cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
      }}>
        <Icon name="eye" size={11} /> View
      </button>
    </div>
  );
}

function StatCell({ label, value, accent }: { label: string; value: any; accent?: string }) {
  return (
    <div style={{ flex: 1, textAlign: "center" }}>
      <div style={{ fontSize: 14, fontWeight: 700, color: accent || "rgba(255,255,255,0.85)" }}>{value}</div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 1, textTransform: "uppercase", letterSpacing: "0.4px" }}>{label}</div>
    </div>
  );
}

// ── KPI card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, icon, sub }: { label: string; value: string; icon: any; sub: string }) {
  return (
    <div className="fade-up" style={{
      background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)",
      borderRadius: 14, padding: "18px 18px",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</span>
        <div style={{ width: 28, height: 28, borderRadius: 8, background: `${SAND}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon name={icon} size={13} color={SAND} />
        </div>
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.5px", color: "var(--white)", lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 11, color: SUCCESS, marginTop: 6 }}>↑ {sub}</div>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push("/login"); return; }
      setUserId(user.uid);
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const q = query(collection(db, "packages"), where("userId", "==", userId));
      const snap = await getDocs(q);
      setPackages(snap.docs.map(d => ({ id: d.id, ...d.data() } as Package)));
      setLoading(false);
    };
    load();
  }, [userId]);

  if (authLoading) {
    return (
      <AppLayout>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="spinner" />
        </div>
      </AppLayout>
    );
  }

  const totalViews = packages.reduce((a, b) => a + (b.views || 0), 0);
  const totalClicks = packages.reduce((a, b) => a + (b.whatsappClicks || 0) + (b.messengerClicks || 0), 0);
  const convRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0";

  return (
    <AppLayout>
      <div style={{ flex: 1, overflow: "auto", padding: "36px 44px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Agency Dashboard</h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              {new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} · Last updated just now
            </p>
          </div>
          <button onClick={() => router.push("/builder")} style={{
            background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
            color: "#0d1b2e", border: "none", borderRadius: 10,
            padding: "10px 20px", fontSize: 13, fontWeight: 700,
            fontFamily: "inherit", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <Icon name="plus" size={15} color="#0d1b2e" strokeWidth={2.5} /> New Package
          </button>
        </div>

        {/* KPI row */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 24 }}>
          <KpiCard label="Total Views" value={totalViews.toLocaleString()} icon="eye" sub="+18% this week" />
          <KpiCard label="Total Clicks" value={totalClicks.toLocaleString()} icon="whatsapp" sub="+12% this week" />
          <KpiCard label="Conversion" value={`${convRate}%`} icon="trending" sub="+2.1pts" />
          <KpiCard label="Packages" value={String(packages.length)} icon="package" sub="Total created" />
        </div>

        {/* Chart + funnel */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 320px", gap: 20, marginBottom: 20 }}>
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 14, padding: "22px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 2 }}>Package Performance</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>Views vs clicks by package</div>
              </div>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                {[{ color: SAND, label: "Views" }, { color: TEAL, label: "Clicks" }].map(({ color, label }) => (
                  <span key={label} style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 2, background: color, display: "inline-block" }} />{label}
                  </span>
                ))}
              </div>
            </div>
            {loading ? (
              <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="spinner" />
              </div>
            ) : packages.length === 0 ? (
              <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>
                No packages yet
              </div>
            ) : (
              <BarChart packages={packages} />
            )}
          </div>

          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 14, padding: "22px 24px" }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Lead Funnel</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", marginBottom: 20 }}>Across all packages</div>
            <LeadFunnel packages={packages} />
          </div>
        </div>

        {/* Package list */}
        <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid var(--border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Your Packages</div>
            <button onClick={() => router.push("/leads")} style={{
              background: "none", border: `1px solid ${SAND}40`,
              borderRadius: 8, padding: "5px 12px", color: SAND,
              fontSize: 12, fontFamily: "inherit", cursor: "pointer", fontWeight: 500,
            }}>View all leads →</button>
          </div>
          {loading ? (
            <div style={{ padding: 32, textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>
              <span className="spinner" />
            </div>
          ) : packages.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <Icon name="package" size={32} color="rgba(255,255,255,0.1)" strokeWidth={1} />
              <p style={{ marginTop: 12, fontSize: 14, color: "rgba(255,255,255,0.3)" }}>No packages yet</p>
              <button onClick={() => router.push("/builder")} style={{
                marginTop: 16, background: `${SAND}18`, border: `1px solid ${SAND}40`,
                borderRadius: 10, padding: "8px 20px", color: SAND,
                fontSize: 13, fontFamily: "inherit", cursor: "pointer", fontWeight: 600,
              }}>Create your first package</button>
            </div>
          ) : (
            packages.map((pkg, i) => (
              <PackageRow key={pkg.id} pkg={pkg} onView={() => router.push(`/p/${pkg.id}`)} isLast={i === packages.length - 1} />
            ))
          )}
        </div>
      </div>
    </AppLayout>
  );
}
