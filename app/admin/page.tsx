"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";

// ─── Types ────────────────────────────────────────────────────────────────────

type DomainRecord = { type: string; name: string; value: string };
type DomainStatus = "pending" | "records_ready" | "verifying" | "active" | "error";

type Agency = {
  uid: string;
  name: string;
  email: string;
  plan: string;
  agencySlug: string;
  customDomain: string | null;
  customDomainStatus: DomainStatus | null;
  customDomainRecords: DomainRecord[];
  customDomainStatusMsg: string;
  createdAt: number;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const SAND    = "#e8c97b";
const SUCCESS = "#2dd4a0";
const BORDER  = "rgba(255,255,255,0.08)";

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:       { label: "Pending",        color: "#f59e0b", bg: "rgba(245,158,11,0.12)"  },
  records_ready: { label: "Records Ready",  color: "#60a5fa", bg: "rgba(96,165,250,0.12)"  },
  verifying:     { label: "Verifying",      color: "#a78bfa", bg: "rgba(167,139,250,0.12)" },
  active:        { label: "Live",           color: SUCCESS,   bg: "rgba(45,212,160,0.12)"  },
  error:         { label: "Error",          color: "#f87171", bg: "rgba(248,113,113,0.12)" },
};

const PLAN_META: Record<string, { label: string; color: string }> = {
  free:  { label: "Free",  color: "rgba(255,255,255,0.35)" },
  start: { label: "Start", color: "#60a5fa" },
  grow:  { label: "Grow",  color: SAND },
  scale: { label: "Scale", color: "#a78bfa" },
};

const DOMAIN_STATUSES: DomainStatus[] = ["pending", "records_ready", "verifying", "active", "error"];

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

// ─── Domain Editor Modal ──────────────────────────────────────────────────────

function DomainEditorModal({
  agency,
  token,
  onClose,
  onSaved,
}: {
  agency: Agency;
  token: string;
  onClose: () => void;
  onSaved: (updated: Partial<Agency>) => void;
}) {
  const [status, setStatus]       = useState<DomainStatus>(agency.customDomainStatus ?? "pending");
  const [statusMsg, setStatusMsg] = useState(agency.customDomainStatusMsg ?? "");
  const [records, setRecords]     = useState<DomainRecord[]>(
    agency.customDomainRecords?.length ? agency.customDomainRecords : [{ type: "A", name: "@", value: "" }]
  );
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const addRecord = () => setRecords(r => [...r, { type: "A", name: "", value: "" }]);
  const removeRecord = (idx: number) => setRecords(r => r.filter((_, i) => i !== idx));
  const updateRecord = (idx: number, field: keyof DomainRecord, value: string) =>
    setRecords(r => r.map((rec, i) => i === idx ? { ...rec, [field]: value } : rec));

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/custom-domain", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ userId: agency.uid, status, records, statusMsg }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Save failed");
      onSaved({ customDomainStatus: status, customDomainRecords: records, customDomainStatusMsg: statusMsg });
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: "100%", maxWidth: 560, background: "#111c2d", border: `1px solid ${BORDER}`, borderRadius: 16, overflow: "hidden", maxHeight: "90vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${BORDER}`, display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{agency.name || agency.email}</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
              {agency.customDomain
                ? <span style={{ fontFamily: "monospace" }}>{agency.customDomain}</span>
                : <span style={{ fontStyle: "italic" }}>No domain set</span>}
            </div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "2px 6px" }}>×</button>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "20px 22px", display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Status */}
          <div>
            <Label>Setup Status</Label>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: 8, marginTop: 8 }}>
              {DOMAIN_STATUSES.map(s => {
                const m = STATUS_META[s];
                const active = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    style={{ padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", border: `1px solid ${active ? m.color : "rgba(255,255,255,0.1)"}`, background: active ? m.bg : "transparent", color: active ? m.color : "rgba(255,255,255,0.45)", transition: "all .15s" }}
                  >
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Status message (for errors or notes) */}
          <div>
            <Label>Status message <span style={{ fontWeight: 400, color: "rgba(255,255,255,0.3)" }}>(shown to agency — optional)</span></Label>
            <textarea
              value={statusMsg}
              onChange={e => setStatusMsg(e.target.value)}
              placeholder="e.g. Your CNAME record is incorrect. Expected value: packmetrics-77450.web.app"
              rows={2}
              style={{ ...fieldStyle, resize: "vertical" as const, minHeight: 56 }}
            />
          </div>

          {/* DNS Records */}
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
              <Label>DNS Records</Label>
              <button
                onClick={addRecord}
                style={{ fontSize: 11.5, fontWeight: 600, padding: "4px 10px", borderRadius: 7, background: "rgba(232,201,123,0.1)", border: `1px solid rgba(232,201,123,0.25)`, color: SAND, cursor: "pointer", fontFamily: "inherit" }}
              >
                + Add record
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {records.map((rec, idx) => (
                <div key={idx} style={{ display: "grid", gridTemplateColumns: "72px 1fr 1fr 28px", gap: 6, alignItems: "center" }}>
                  <select
                    value={rec.type}
                    onChange={e => updateRecord(idx, "type", e.target.value)}
                    style={{ ...fieldStyle, padding: "8px 6px" }}
                  >
                    {["A", "AAAA", "CNAME", "TXT", "MX"].map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                  <input
                    value={rec.name}
                    onChange={e => updateRecord(idx, "name", e.target.value)}
                    placeholder="Name (e.g. @)"
                    style={fieldStyle}
                  />
                  <input
                    value={rec.value}
                    onChange={e => updateRecord(idx, "value", e.target.value)}
                    placeholder="Value"
                    style={{ ...fieldStyle, fontFamily: "monospace", fontSize: 11.5 }}
                  />
                  <button
                    onClick={() => removeRecord(idx)}
                    disabled={records.length === 1}
                    style={{ background: "none", border: "none", color: "rgba(248,113,113,0.6)", fontSize: 16, cursor: records.length === 1 ? "not-allowed" : "pointer", opacity: records.length === 1 ? 0.3 : 1, padding: 0, lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Column headers */}
            <div style={{ display: "grid", gridTemplateColumns: "72px 1fr 1fr 28px", gap: 6, marginTop: 4 }}>
              {["Type", "Name", "Value", ""].map((h, i) => (
                <div key={i} style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", textTransform: "uppercase" as const, letterSpacing: ".4px" }}>{h}</div>
              ))}
            </div>
          </div>

          {error && (
            <div style={{ fontSize: 12, color: "#f87171", padding: "8px 12px", borderRadius: 8, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)" }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 22px", borderTop: `1px solid ${BORDER}`, display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button onClick={onClose} style={{ padding: "9px 18px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: `1px solid ${BORDER}`, color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{ padding: "9px 20px", borderRadius: 9, background: `linear-gradient(135deg, ${SAND}, #c4a84f)`, color: "#0d1b2e", fontSize: 13, fontWeight: 700, border: "none", cursor: saving ? "not-allowed" : "pointer", fontFamily: "inherit", opacity: saving ? 0.7 : 1 }}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" as const, letterSpacing: ".5px" }}>{children}</div>;
}

const fieldStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 8,
  padding: "8px 10px",
  color: "#fdfcf9",
  fontSize: 12.5,
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AdminPage() {
  const router = useRouter();
  const [token, setToken]         = useState<string | null>(null);
  const [agencies, setAgencies]   = useState<Agency[]>([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [editing, setEditing]     = useState<Agency | null>(null);
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

  const handleSaved = (uid: string, updated: Partial<Agency>) => {
    setAgencies(prev => prev.map(a => a.uid === uid ? { ...a, ...updated } : a));
  };

  const filtered = agencies.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || (a.customDomain ?? "").toLowerCase().includes(q);
    const matchPlan = filterPlan === "all" || a.plan === filterPlan;
    return matchSearch && matchPlan;
  });

  const withDomain    = agencies.filter(a => a.customDomain).length;
  const activeCount   = agencies.filter(a => a.customDomainStatus === "active").length;
  const pendingCount  = agencies.filter(a => a.customDomainStatus === "pending" || a.customDomainStatus === "records_ready" || a.customDomainStatus === "verifying").length;

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
          <div style={{ display: "grid", gridTemplateColumns: "1fr 180px 70px 180px 130px 100px", padding: "10px 16px", background: "rgba(255,255,255,0.03)", borderBottom: `1px solid ${BORDER}`, gap: 12 }}>
            {["Agency", "Email", "Plan", "Custom Domain", "Status", ""].map((h) => (
              <div key={h} style={{ fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" as const, letterSpacing: ".5px" }}>{h}</div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: "40px 16px", textAlign: "center", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No agencies found</div>
          ) : (
            filtered.map((agency, idx) => (
              <div
                key={agency.uid}
                style={{ display: "grid", gridTemplateColumns: "1fr 180px 70px 180px 130px 100px", padding: "13px 16px", borderTop: idx === 0 ? "none" : `1px solid ${BORDER}`, gap: 12, alignItems: "center", background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}
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

                {/* Action */}
                <div>
                  {agency.customDomain ? (
                    <button
                      onClick={() => setEditing(agency)}
                      style={{ padding: "5px 12px", borderRadius: 7, background: "rgba(232,201,123,0.1)", border: `1px solid rgba(232,201,123,0.25)`, color: SAND, fontSize: 11.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
                    >
                      Manage
                    </button>
                  ) : (
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,0.2)" }}>No domain</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Domain editor modal */}
      {editing && token && (
        <DomainEditorModal
          agency={editing}
          token={token}
          onClose={() => setEditing(null)}
          onSaved={(updated) => { handleSaved(editing.uid, updated); setEditing(null); }}
        />
      )}
    </>
  );
}
