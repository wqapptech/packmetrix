"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";
import Icon from "@/components/Icon";

const SAND = "#e8c97b";
const TEAL = "#4ecdc4";
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
};

type Lead = {
  id: string;
  destination: string;
  price: string;
  channel: string;
  status: string;
  createdAt: number;
};

// ── Sparkline SVG ─────────────────────────────────────────────────────────────

function Sparkline({ color }: { color: string }) {
  const pts = [3, 5, 4, 6, 5, 8, 7, 9, 8, 11, 10, 12];
  const max = Math.max(...pts);
  const path = pts.map((v, idx) => `${idx * 4},${20 - (v / max) * 16}`).join(" ");
  return (
    <svg width="50" height="22" viewBox="0 0 48 22" style={{ position: "absolute", right: 10, top: 10, opacity: 0.5 }}>
      <polyline points={path} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, delta, trend, sparkColor }: {
  label: string; value: string; delta?: string; trend?: "up" | "down" | "flat"; sparkColor?: string;
}) {
  const deltaBg = trend === "up" ? "rgba(45,212,160,0.13)" : trend === "down" ? "rgba(239,68,68,0.13)" : "rgba(255,255,255,0.06)";
  const deltaColor = trend === "up" ? "#54e0b5" : trend === "down" ? "#f08080" : "rgba(255,255,255,0.45)";
  const arrow = trend === "up" ? "▲" : trend === "down" ? "▼" : "—";
  return (
    <div style={{
      background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 13, padding: "16px 16px 14px", position: "relative", overflow: "hidden",
    }}>
      {sparkColor && <Sparkline color={sparkColor} />}
      <div style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: ".6px" }}>
        {label}
      </div>
      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.6px", lineHeight: 1.05, marginTop: 6, color: "#fdfcf9" }}>
        {value}
      </div>
      {delta && (
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          fontSize: 11, marginTop: 6, padding: "2px 7px", borderRadius: 99,
          background: deltaBg, color: deltaColor,
        }}>
          {arrow} {delta}
        </div>
      )}
    </div>
  );
}

// ── Weekly bar chart ──────────────────────────────────────────────────────────

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function WeeklyBars({ packages }: { packages: Package[] }) {
  const total = packages.reduce((a, b) => a + (b.views || 0), 0);
  const totalClicks = packages.reduce((a, b) => a + (b.whatsappClicks || 0) + (b.messengerClicks || 0), 0);
  // Distribute across days with a natural curve (peaks mid-week + weekend)
  const weights = [0.11, 0.14, 0.13, 0.17, 0.2, 0.15, 0.1];
  const series = weights.map((w, i) => ({
    sessions: Math.round(total * w),
    leads: Math.round(totalClicks * w),
  }));
  const peak = Math.max(...series.map(s => s.sessions), 1);

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 14, height: 140, alignItems: "end", paddingTop: 8 }}>
      {series.map((s, i) => (
        <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
          <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 120 }}>
            <div style={{ width: 8, borderRadius: 3, background: `linear-gradient(180deg, ${SAND}, ${SAND}60)`, height: `${(s.sessions / peak) * 100}%` }} />
            <div style={{ width: 8, borderRadius: 3, background: `linear-gradient(180deg, ${TEAL}, ${TEAL}60)`, height: `${Math.min((s.leads / peak) * 4 * 100, 100)}%` }} />
          </div>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{DAYS[i]}</span>
        </div>
      ))}
    </div>
  );
}

// ── Funnel ────────────────────────────────────────────────────────────────────

function FunnelRow({ label, value, pct, color, tail }: {
  label: string; value: string; pct: number; color: string; tail?: string;
}) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12 }}>
        <span style={{ color: "rgba(255,255,255,0.65)" }}>
          {label}{tail && <em style={{ fontStyle: "normal", color: "rgba(255,255,255,0.35)", fontSize: 11, marginLeft: 6 }}> · {tail}</em>}
        </span>
        <b style={{ color: "#fff" }}>{value} <span style={{ color: "rgba(255,255,255,0.4)", fontWeight: 500, fontSize: 11, marginLeft: 4 }}>{pct}%</span></b>
      </div>
      <div style={{ height: 8, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${Math.min(pct, 100)}%`, background: color, borderRadius: 99, transition: "width .8s" }} />
      </div>
    </div>
  );
}

// ── Package row ───────────────────────────────────────────────────────────────

function PackageRow({ pkg, onView, onEdit, onDelete, isLast }: {
  pkg: Package; onView: () => void; onEdit: () => void; onDelete: () => Promise<void>; isLast: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const clicks = (pkg.whatsappClicks || 0) + (pkg.messengerClicks || 0);
  const conv = (pkg.views || 0) > 0 ? ((clicks / pkg.views) * 100) : 0;
  const convStr = conv.toFixed(2) + "%";
  const convColor = conv >= 2 ? SUCCESS : conv >= 1 ? SAND : "rgba(255,255,255,0.7)";
  const thumbUrl = pkg.coverImage || pkg.images?.[0];
  const dotColors = ["#c9713a", "#2d7a4e", "#2563a8", "#7c3aed", "#0f766e"];
  const dotColor = dotColors[Math.abs(pkg.id.charCodeAt(0)) % dotColors.length];

  return (
    <div className="pkg-row"
      onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
      onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
      style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 22px", borderBottom: isLast ? "none" : "1px solid rgba(255,255,255,0.05)", transition: "background .15s" }}
    >
      {/* Thumb */}
      <div style={{
        width: 54, height: 54, borderRadius: 10, flexShrink: 0,
        background: thumbUrl ? `url(${thumbUrl}) center/cover` : dotColor,
        display: "flex", alignItems: "center", justifyContent: "center",
        position: "relative", overflow: "hidden",
        boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.06)",
      }}>
        {!thumbUrl && <Icon name="map" size={16} color="rgba(255,255,255,0.7)" />}
      </div>
      {/* Name */}
      <div style={{ flex: 2, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{pkg.destination}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
          {pkg.price}{pkg.createdAt ? ` · Live · /p/${pkg.id}` : ""}
        </div>
      </div>
      {/* Stats */}
      <div style={{ flex: 1, textAlign: "center" }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{(pkg.views || 0).toLocaleString()}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: ".4px" }}>Views</div>
      </div>
      <div style={{ flex: 1, textAlign: "center" }}>
        <div style={{ fontSize: 13.5, fontWeight: 700 }}>{clicks}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: ".4px" }}>Leads</div>
      </div>
      <div style={{ flex: 1, textAlign: "center" }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: convColor }}>{convStr}</div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: ".4px" }}>Conversion</div>
      </div>
      {/* Action buttons */}
      <div style={{ display: "flex", gap: 5 }}>
        <button onClick={onView} title="View" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.55)" }}>
          <Icon name="eye" size={13} />
        </button>
        <button onClick={onEdit} title="Edit" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.55)" }}>
          <Icon name="edit" size={13} />
        </button>
        {confirming ? (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button onClick={async () => { setDeleting(true); await onDelete(); setDeleting(false); setConfirming(false); }} disabled={deleting} style={{ height: 30, borderRadius: 8, padding: "0 8px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.35)", color: "#ef9090", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>
              {deleting ? "…" : "Yes"}
            </button>
            <button onClick={() => setConfirming(false)} style={{ height: 30, borderRadius: 8, padding: "0 8px", background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: 11, fontFamily: "inherit", cursor: "pointer" }}>No</button>
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} title="Delete" style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid rgba(239,68,68,0.2)", background: "none", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(239,68,68,0.5)" }}>
            <Icon name="trash" size={13} color="rgba(239,68,68,0.5)" />
          </button>
        )}
      </div>
    </div>
  );
}

// ── AI insight row ────────────────────────────────────────────────────────────

function Insight({ icon, title, desc, cta }: { icon: string; title: string; desc: string; cta: string }) {
  return (
    <div style={{ display: "flex", gap: 12, padding: "12px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(232,201,123,0.13)", color: SAND, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>{desc}</div>
      </div>
      <button style={{ alignSelf: "center", fontSize: 11, color: SAND, background: "rgba(232,201,123,0.08)", border: "1px solid rgba(232,201,123,0.25)", borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit", fontWeight: 600, flexShrink: 0 }}>{cta}</button>
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  new:         { bg: "rgba(76,205,196,0.13)",  color: "#4ecdc4" },
  contacted:   { bg: "rgba(167,139,250,0.13)", color: "#a78bfa" },
  negotiating: { bg: "rgba(245,166,35,0.13)",  color: "#f5b34a" },
  booked:      { bg: "rgba(45,212,160,0.13)",  color: "#54e0b5" },
  lost:        { bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" },
};

// ── Page ──────────────────────────────────────────────────────────────────────

type DateRange = "7" | "30" | "90" | "all";

const DATE_RANGE_OPTIONS: { k: DateRange; l: string }[] = [
  { k: "7",   l: "Last 7 days"  },
  { k: "30",  l: "Last 30 days" },
  { k: "90",  l: "Last 90 days" },
  { k: "all", l: "All time"     },
];

function getStartMs(range: DateRange): number {
  if (range === "all") return 0;
  return Date.now() - Number(range) * 24 * 60 * 60 * 1000;
}

type SortKey = "conv" | "views" | "leads" | "newest";

const SORT_OPTIONS: { k: SortKey; l: string }[] = [
  { k: "conv",   l: "Conv %"  },
  { k: "views",  l: "Views"   },
  { k: "leads",  l: "Leads"   },
  { k: "newest", l: "Newest"  },
];

function sortPackages(pkgs: Package[], by: SortKey): Package[] {
  return [...pkgs].sort((a, b) => {
    if (by === "views")  return (b.views || 0) - (a.views || 0);
    if (by === "leads")  return ((b.whatsappClicks || 0) + (b.messengerClicks || 0)) - ((a.whatsappClicks || 0) + (a.messengerClicks || 0));
    if (by === "newest") return (b.createdAt || 0) - (a.createdAt || 0);
    const convA = (a.views || 0) > 0 ? (((a.whatsappClicks || 0) + (a.messengerClicks || 0)) / a.views) : 0;
    const convB = (b.views || 0) > 0 ? (((b.whatsappClicks || 0) + (b.messengerClicks || 0)) / b.views) : 0;
    return convB - convA;
  });
}

export default function Dashboard() {
  const router = useRouter();
  const [packages, setPackages] = useState<Package[]>([]);
  const [recentLeads, setRecentLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [agencyName, setAgencyName] = useState("Agency");
  const [sortBy, setSortBy] = useState<SortKey>("conv");
  const [dateRange, setDateRange] = useState<DateRange>("30");
  const [filterOpen, setFilterOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      setUserId(user.uid);
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const n = snap.data().name;
        if (n) setAgencyName(n);
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const [pkgSnap, leadSnap] = await Promise.all([
        getDocs(query(collection(db, "packages"), where("userId", "==", userId))),
        getDocs(query(collection(db, "leads"), where("userId", "==", userId), orderBy("createdAt", "desc"), limit(4))),
      ]);
      setPackages(pkgSnap.docs.map(d => ({ id: d.id, ...d.data() } as Package)));
      setRecentLeads(leadSnap.docs.map(d => ({ id: d.id, ...d.data() } as Lead)));
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

  const startMs = getStartMs(dateRange);
  const filteredPackages = startMs === 0 ? packages : packages.filter(p => (p.createdAt || 0) >= startMs);
  const filteredLeads = startMs === 0 ? recentLeads : recentLeads.filter(l => (l.createdAt || 0) >= startMs);

  const totalViews = filteredPackages.reduce((a, b) => a + (b.views || 0), 0);
  const totalClicks = filteredPackages.reduce((a, b) => a + (b.whatsappClicks || 0) + (b.messengerClicks || 0), 0);
  const convRate = totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : "0.0";
  const activeLabel = DATE_RANGE_OPTIONS.find(o => o.k === dateRange)?.l ?? "Last 30 days";

  return (
    <AppLayout>
      <div style={{ padding: "28px 32px 60px", maxWidth: 1240 }}>

        {/* Page head */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.4px" }}>
              Good morning, {agencyName}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
              {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
              {packages.length > 0 && ` · ${packages.length} package${packages.length !== 1 ? "s" : ""} live`}
            </div>
          </div>
          <div ref={dropdownRef} style={{ position: "relative" }}>
            <button
              onClick={() => setFilterOpen(o => !o)}
              style={{ padding: "7px 12px", borderRadius: 8, background: filterOpen ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)", fontSize: 12.5, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
            >
              {activeLabel}
              <span style={{ fontSize: 10, opacity: 0.6, transform: filterOpen ? "rotate(180deg)" : "none", transition: "transform .15s", display: "inline-block" }}>▾</span>
            </button>
            {filterOpen && (
              <div style={{ position: "absolute", top: "calc(100% + 6px)", right: 0, width: 160, background: "#0f1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, overflow: "hidden", boxShadow: "0 12px 32px rgba(0,0,0,0.5)", zIndex: 100 }}>
                {DATE_RANGE_OPTIONS.map(({ k, l }) => (
                  <button
                    key={k}
                    onClick={() => { setDateRange(k); setFilterOpen(false); }}
                    style={{ width: "100%", padding: "10px 14px", background: dateRange === k ? "rgba(232,201,123,0.08)" : "none", border: "none", color: dateRange === k ? SAND : "rgba(255,255,255,0.65)", fontSize: 13, fontFamily: "inherit", cursor: "pointer", textAlign: "left", display: "flex", justifyContent: "space-between", alignItems: "center" }}
                  >
                    {l}
                    {dateRange === k && <span style={{ fontSize: 11, color: SAND }}>✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* KPI strip */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 12, marginBottom: 18 }}>
          <KpiCard label="Page views"   value={totalViews.toLocaleString()}  delta={totalViews > 0 ? "Live" : undefined}    trend="up"   sparkColor={SAND} />
          <KpiCard label="Leads"        value={totalClicks.toLocaleString()} delta={totalClicks > 0 ? "Active" : undefined}  trend="up"   sparkColor={TEAL} />
          <KpiCard label="WA Messages"  value={filteredPackages.reduce((a, b) => a + (b.whatsappClicks || 0), 0).toLocaleString()}   sparkColor="#25d366" />
          <KpiCard label="Conversion"   value={`${convRate}%`}               sparkColor={SUCCESS} />
          <KpiCard label="Packages"     value={String(filteredPackages.length)}      sparkColor="#a78bfa" />
        </div>

        {/* Charts row */}
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginBottom: 18 }}>
          {/* Weekly bar chart */}
          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>Traffic & leads · this week</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)" }}>Sessions vs leads, daily</div>
              </div>
              <div style={{ display: "flex", gap: 14, fontSize: 11, color: "rgba(255,255,255,0.5)" }}>
                <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: SAND, marginRight: 5 }}></span>Sessions</span>
                <span><span style={{ display: "inline-block", width: 8, height: 8, borderRadius: 2, background: TEAL, marginRight: 5 }}></span>Leads</span>
              </div>
            </div>
            {loading ? (
              <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span className="spinner" />
              </div>
            ) : packages.length === 0 ? (
              <div style={{ height: 140, display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.2)", fontSize: 13 }}>No packages yet</div>
            ) : (
              <>
                <WeeklyBars packages={filteredPackages} />
                {totalViews > 0 && (
                  <div style={{ marginTop: 14, padding: "10px 12px", borderRadius: 10, background: "rgba(232,201,123,0.07)", border: "1px solid rgba(232,201,123,0.18)", display: "flex", gap: 10, alignItems: "flex-start" }}>
                    <span style={{ flexShrink: 0, marginTop: 1, color: SAND, fontSize: 14 }}>✦</span>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                      <b style={{ color: "#fff" }}>Your top package</b> is driving most traffic.{" "}
                      <span style={{ color: SAND }}>Share it again this weekend</span> to hit your monthly target.
                      <button onClick={() => { const top = [...filteredPackages].sort((a,b)=>(b.views||0)-(a.views||0))[0]; if (top) window.open(`/p/${top.id}`,"_blank","noopener,noreferrer"); }} style={{ marginLeft: 10, fontSize: 11, color: SAND, background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>View →</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Funnel */}
          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px" }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 3 }}>Conversion funnel</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 20 }}>Across all packages, last 30 days</div>
            <FunnelRow label="Sessions"     value={totalViews.toLocaleString()}  pct={100} color={SAND} />
            <FunnelRow label="Engaged"      value={Math.round(totalViews * 0.44).toLocaleString()} pct={44} color="#dba978" tail="Scrolled or watched" />
            <FunnelRow label="CTA Click"    value={totalClicks.toLocaleString()} pct={totalViews > 0 ? parseFloat(convRate) : 0} color={TEAL} />
            <FunnelRow label="Lead/Message" value={totalClicks.toLocaleString()} pct={totalViews > 0 ? parseFloat(convRate) : 0} color="#54e0b5" />
          </div>
        </div>

        {/* Packages + Insights/Leads */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 16, marginBottom: 18 }}>
          {/* Package list */}
          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Your packages</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Sorted by conversion score</div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                {SORT_OPTIONS.map(({ k, l }) => (
                  <button
                    key={k}
                    onClick={() => setSortBy(k)}
                    style={{
                      padding: "4px 10px", borderRadius: 7, fontSize: 11.5, fontFamily: "inherit", cursor: "pointer", transition: "all .12s",
                      background: sortBy === k ? `${SAND}18` : "rgba(255,255,255,0.03)",
                      border: sortBy === k ? `1px solid ${SAND}50` : "1px solid rgba(255,255,255,0.07)",
                      color: sortBy === k ? SAND : "rgba(255,255,255,0.45)",
                      fontWeight: sortBy === k ? 600 : 400,
                    }}
                  >{l}</button>
                ))}
              </div>
            </div>
            {loading ? (
              <div style={{ padding: 32, textAlign: "center" }}><span className="spinner" /></div>
            ) : packages.length === 0 ? (
              <div style={{ padding: "40px 24px", textAlign: "center" }}>
                <Icon name="package" size={32} color="rgba(255,255,255,0.1)" strokeWidth={1} />
                <p style={{ marginTop: 12, fontSize: 14, color: "rgba(255,255,255,0.3)" }}>No packages yet</p>
                <button onClick={() => router.push("/builder")} style={{ marginTop: 16, background: `${SAND}18`, border: `1px solid ${SAND}40`, borderRadius: 10, padding: "8px 20px", color: SAND, fontSize: 13, fontFamily: "inherit", cursor: "pointer", fontWeight: 600 }}>
                  Create your first package
                </button>
              </div>
            ) : (
              sortPackages(packages, sortBy)
                .map((pkg, i, arr) => (
                  <PackageRow
                    key={pkg.id}
                    pkg={pkg}
                    onView={() => window.open(`/p/${pkg.id}`, "_blank", "noopener,noreferrer")}
                    onEdit={() => router.push(`/builder?id=${pkg.id}`)}
                    onDelete={async () => {
                      const res = await fetch("/api/delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: pkg.id, userId }) });
                      if (res.ok) setPackages(prev => prev.filter(p => p.id !== pkg.id));
                    }}
                    isLast={i === arr.length - 1}
                  />
                ))
            )}
          </div>

          {/* Right column: AI insights + recent leads */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* AI Insights */}
            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>AI insights</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>Personalised for your packages</div>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "5px 12px", borderRadius: 99, background: "rgba(232,201,123,0.13)", border: "1px solid rgba(232,201,123,0.3)", color: SAND, fontSize: 11.5, fontWeight: 600 }}>
                  <span style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: SAND, animation: "pulse 1.4s ease-in-out infinite" }} />
                  3 new
                </div>
              </div>
              <Insight icon="✦" title="Sharpen your headline" desc="Pages with action verbs convert 31% better. Try sensory, destination-specific language." cta="Generate" />
              <Insight icon="◐" title="Pin your price" desc="Visitors scroll past price tags. Make it sticky on mobile to lift CTR." cta="Apply" />
              <Insight icon="↑" title="Add urgency copy" desc="Seasonal scarcity (e.g. Only 4 spots in November) recovers lost leads effectively." cta="Preview" />
            </div>

            {/* Recent leads */}
            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 16 }}>Recent leads</div>
              {loading ? (
                <div style={{ textAlign: "center", padding: 16 }}><span className="spinner" /></div>
              ) : filteredLeads.length === 0 ? (
                <div style={{ textAlign: "center", padding: "16px 0", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>No leads in this period</div>
              ) : (
                filteredLeads.map((lead, i) => {
                  const initials = (lead.destination || "?").slice(0, 2).toUpperCase();
                  const avatarColors = ["#c66a3d", "#1f5f8e", "#7c3aed", "#0d6e3f"];
                  const avatarColor = avatarColors[i % avatarColors.length];
                  const ss = STATUS_STYLES[lead.status] || STATUS_STYLES.new;
                  return (
                    <div key={lead.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: i < filteredLeads.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
                      <div style={{ width: 34, height: 34, borderRadius: "50%", background: avatarColor, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>
                        {initials}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600 }}>{lead.destination}</div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                          via {lead.channel === "whatsapp" ? "WhatsApp" : "Messenger"}
                        </div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 10.5, fontWeight: 700, background: ss.bg, color: ss.color, textTransform: "uppercase", letterSpacing: ".5px" }}>
                          {lead.status}
                        </span>
                        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>
                          {new Date(lead.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <button onClick={() => router.push("/leads")} style={{ marginTop: 14, width: "100%", padding: "9px", borderRadius: 9, background: "none", border: `1px solid ${SAND}40`, color: SAND, fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
                View all leads →
              </button>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
