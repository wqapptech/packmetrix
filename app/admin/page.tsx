"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

type DomainStatus = "pending_dns" | "verifying" | "ssl_provisioning" | "active" | "failed";

type Agency = {
  uid: string;
  name: string;
  email: string;
  plan: string;
  agencySlug: string;
  customDomain: string | null;
  customDomainStatus: DomainStatus | null;
  createdAt: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SAND    = "#e8c97b";
const SUCCESS = "#2dd4a0";
const BORDER  = "rgba(255,255,255,0.08)";

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending_dns:      { label: "Pending DNS",      color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  verifying:        { label: "Verifying",         color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  ssl_provisioning: { label: "SSL Provisioning",  color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  active:           { label: "Live",              color: SUCCESS,   bg: "rgba(45,212,160,0.12)"  },
  failed:           { label: "Failed",            color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

const PLAN_META: Record<string, { label: string; color: string }> = {
  free:  { label: "Free",  color: "rgba(255,255,255,0.35)" },
  start: { label: "Start", color: "#60a5fa" },
  grow:  { label: "Grow",  color: SAND },
  scale: { label: "Scale", color: "#a78bfa" },
};

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string | null }) {
  if (!status) return <span style={{ color: "rgba(255,255,255,0.25)", fontSize: 12 }}>—</span>;
  const m = STATUS_META[status] ?? STATUS_META.pending;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "2px 9px", borderRadius: 99, background: m.bg, fontSize: 11.5, fontWeight: 600, color: m.color }}>
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: m.color, flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const m = PLAN_META[plan] ?? PLAN_META.free;
  return (
    <span style={{ fontSize: 11.5, fontWeight: 700, color: m.color, textTransform: "uppercase" as const, letterSpacing: ".4px" }}>
      {m.label}
    </span>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

function DeleteAgencyModal({
  agency,
  token,
  onClose,
  onDeleted,
}: {
  agency: Agency;
  token: string;
  onClose: () => void;
  onDeleted: (uid: string) => void;
}) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError]       = useState<string | null>(null);

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/agencies", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid: agency.uid }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Delete failed");
      onDeleted(agency.uid);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: 460, background: "#111c2d", border: "1px solid rgba(248,113,113,0.25)", borderRadius: 16, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#f87171" }}>Delete Agency</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{agency.name || agency.email}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "2px 6px" }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 22px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ padding: "14px 16px", borderRadius: 10, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 1.6 }}>
            This will permanently delete:
            <ul style={{ margin: "8px 0 0", paddingLeft: 18 }}>
              <li>The agency account &amp; profile</li>
              <li>All packages</li>
              <li>All leads</li>
              <li>Custom domain configuration</li>
              <li>Firebase Auth account</li>
            </ul>
          </div>
          <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)" }}>
            This action <strong style={{ color: "rgba(255,255,255,0.7)" }}>cannot be undone</strong>. Are you sure you want to delete <strong style={{ color: "#fdfcf9" }}>{agency.name || agency.email}</strong>?
          </div>
          {error && (
            <div style={{ fontSize: 12, color: "#f87171", padding: "8px 12px", borderRadius: 8, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 22px", borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} disabled={deleting} style={{ padding: "9px 18px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            style={{ padding: "9px 20px", borderRadius: 9, background: deleting ? "rgba(248,113,113,0.3)" : "rgba(248,113,113,0.85)", color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: deleting ? "not-allowed" : "pointer", fontFamily: "inherit" }}
          >
            {deleting ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken]         = useState<string | null>(null);
  const [agencies, setAgencies]   = useState<Agency[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [deleting, setDeleting]   = useState<Agency | null>(null);
  const [filterPlan, setFilterPlan] = useState<string>("all");

  // Get Firebase ID token then load agencies
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/admin/login"); return; }
      const t = await user.getIdToken();
      setToken(t);
    });
    return () => unsub();
  }, [router]);

  const loadAgencies = useCallback(async (t: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/agencies", {
        headers: { Authorization: `Bearer ${t}` },
      });
      if (res.status === 403) { router.replace("/admin/login"); return; }
      if (!res.ok) throw new Error("Failed to load agencies");
      const data = await res.json();
      setAgencies(data.agencies);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (token) loadAgencies(token);
  }, [token, loadAgencies]);

  const handleDeleted = (uid: string) => {
    setAgencies(prev => prev.filter(a => a.uid !== uid));
  };

  const filtered = agencies.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || (a.customDomain ?? "").toLowerCase().includes(q);
    const matchPlan = filterPlan === "all" || a.plan === filterPlan;
    return matchSearch && matchPlan;
  });

  const withDomain    = agencies.filter(a => a.customDomain).length;
  const activeCount   = agencies.filter(a => a.customDomainStatus === "active").length;
  const pendingCount  = agencies.filter(a => a.customDomainStatus === "pending_dns" || a.customDomainStatus === "verifying" || a.customDomainStatus === "ssl_provisioning").length;

  return (
    <>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.3px" }}>Agencies</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>
          {agencies.length} total · {withDomain} with custom domain · {activeCount} live · {pendingCount} pending
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" as const }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search by name, email or domain…"
          style={{ flex: 1, minWidth: 220, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 9, padding: "9px 14px", color: "#fdfcf9", fontSize: 13, fontFamily: "inherit", outline: "none" }}
        />
        <select
          value={filterPlan}
          onChange={e => setFilterPlan(e.target.value)}
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, borderRadius: 9, padding: "9px 12px", color: "#fdfcf9", fontSize: 13, fontFamily: "inherit", outline: "none", cursor: "pointer" }}
        >
          <option value="all">All plans</option>
          <option value="free">Free</option>
          <option value="start">Start</option>
          <option value="grow">Grow</option>
          <option value="scale">Scale</option>
        </select>
        <button
          onClick={() => token && loadAgencies(token)}
          style={{ padding: "9px 14px", borderRadius: 9, background: "rgba(255,255,255,0.04)", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
        >
          ↻ Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
          <span className="spinner" />
        </div>
      ) : error ? (
        <div style={{ color: "#f87171", fontSize: 13 }}>{error}</div>
      ) : (
        <div style={{ borderRadius: 12, border: `1px solid ${BORDER}`, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 70px 180px 130px 40px", padding: "10px 16px", background: "rgba(255,255,255,0.03)", borderBottom: `1px solid ${BORDER}`, gap: 12 }}>
            {["Agency", "Email", "Plan", "Custom Domain", "Status", ""].map((h, i) => (
              <div key={i} style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" as const, letterSpacing: ".5px" }}>{h}</div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: "40px 16px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No agencies found</div>
          ) : (
            filtered.map((agency, idx) => (
              <div
                key={agency.uid}
                style={{ display: "grid", gridTemplateColumns: "1fr 180px 70px 180px 130px 40px", padding: "13px 16px", borderTop: idx === 0 ? "none" : `1px solid ${BORDER}`, gap: 12, alignItems: "center", background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}
              >
                {/* Agency name + slug */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{agency.name || "—"}</div>
                  {agency.agencySlug && (
                    <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", fontFamily: "monospace", marginTop: 1 }}>/{agency.agencySlug}</div>
                  )}
                </div>

                {/* Email */}
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{agency.email}</div>

                {/* Plan */}
                <div><PlanBadge plan={agency.plan} /></div>

                {/* Custom domain */}
                <div style={{ fontSize: 12, fontFamily: "monospace", color: agency.customDomain ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.2)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>
                  {agency.customDomain ?? "—"}
                </div>

                {/* Status */}
                <div>{agency.customDomain ? <StatusBadge status={agency.customDomainStatus} /> : <span style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>—</span>}</div>

                {/* Delete */}
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <button
                    onClick={() => setDeleting(agency)}
                    title="Delete agency"
                    style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 7, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", color: "#f87171", fontSize: 14, cursor: "pointer", lineHeight: 1, padding: 0 }}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleting && token && (
        <DeleteAgencyModal
          agency={deleting}
          token={token}
          onClose={() => setDeleting(null)}
          onDeleted={(uid) => { handleDeleted(uid); setDeleting(null); }}
        />
      )}
    </>
  );
}
