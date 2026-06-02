"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  DA_BG, DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2, DA_GOLD, DA_GOLD_DEEP, DA_GOLD_SOFT,
  DA_GREEN, DA_GREEN_SOFT, DA_DANGER, DA_DANGER_SOFT,
} from "@/lib/tokens";

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
  trialEndsAt: number | null;
  createdAt: number;
};

// ─── Design tokens ────────────────────────────────────────────────────────────

const SANS    = `var(--font-inter-tight), system-ui, sans-serif`;
const DISPLAY = `var(--font-instrument-serif), Georgia, serif`;

const BLUE        = "#2563eb";
const BLUE_SOFT   = "#dbeafe";
const AMBER       = "#b45309";
const AMBER_SOFT  = "#fef3c7";
const VIOLET      = "#7c3aed";
const VIOLET_SOFT = "#ede9fe";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isPaid(plan: string) {
  return ["founding", "standard", "start", "grow", "scale"].includes(plan);
}

function trialDaysLeft(trialEndsAt: number | null): number {
  if (!trialEndsAt) return 0;
  return Math.max(0, Math.ceil((trialEndsAt - Date.now()) / 86_400_000));
}

function isTrialActive(trialEndsAt: number | null) {
  return !!trialEndsAt && Date.now() < trialEndsAt;
}

function fmtDate(ts: number) {
  if (!ts) return "—";
  return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Chip({ label, color, bg, border }: { label: string; color: string; bg: string; border?: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "3px 10px", borderRadius: 99, background: bg, border: `1px solid ${border ?? "transparent"}`, fontSize: 11, fontWeight: 700, color, letterSpacing: 0.2, whiteSpace: "nowrap" as const, fontFamily: SANS }}>
      {label}
    </span>
  );
}

const PLAN_CHIP: Record<string, { label: string; color: string; bg: string; border: string }> = {
  founding: { label: "Founding", color: DA_GOLD_DEEP,  bg: DA_GOLD_SOFT,   border: "rgba(176,138,62,0.3)" },
  standard: { label: "Standard", color: VIOLET,         bg: VIOLET_SOFT,    border: "rgba(124,58,237,0.2)" },
  start:    { label: "Start",    color: BLUE,           bg: BLUE_SOFT,      border: "rgba(37,99,235,0.2)"  },
  grow:     { label: "Grow",     color: DA_GOLD_DEEP,  bg: DA_GOLD_SOFT,   border: "rgba(176,138,62,0.3)" },
  scale:    { label: "Scale",    color: VIOLET,         bg: VIOLET_SOFT,    border: "rgba(124,58,237,0.2)" },
  free:     { label: "Free",     color: DA_INK3,        bg: DA_BG,          border: DA_RULE },
};

const DOMAIN_CHIP: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
  pending_dns:      { label: "Pending DNS",    color: AMBER,      bg: AMBER_SOFT,   border: "rgba(180,83,9,0.2)",   dot: AMBER      },
  verifying:        { label: "Verifying",       color: VIOLET,     bg: VIOLET_SOFT,  border: "rgba(124,58,237,0.2)", dot: VIOLET     },
  ssl_provisioning: { label: "SSL",             color: BLUE,       bg: BLUE_SOFT,    border: "rgba(37,99,235,0.2)",  dot: BLUE       },
  active:           { label: "Live",            color: DA_GREEN,   bg: DA_GREEN_SOFT,border: "rgba(77,138,94,0.25)", dot: DA_GREEN   },
  failed:           { label: "Failed",          color: DA_DANGER,  bg: DA_DANGER_SOFT,border: "rgba(192,83,58,0.2)", dot: DA_DANGER  },
};

function DomainChip({ status }: { status: string | null }) {
  if (!status) return <span style={{ color: DA_INK3, fontSize: 12 }}>—</span>;
  const m = DOMAIN_CHIP[status];
  if (!m) return null;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 99, background: m.bg, border: `1px solid ${m.border}`, fontSize: 11, fontWeight: 700, color: m.color }}>
      <span style={{ width: 5, height: 5, borderRadius: "50%", background: m.dot, flexShrink: 0 }} />
      {m.label}
    </span>
  );
}

function TrialChip({ trialEndsAt, plan }: { trialEndsAt: number | null; plan: string }) {
  if (isPaid(plan)) return <span style={{ color: DA_INK3, fontSize: 12 }}>—</span>;
  if (!trialEndsAt) return <Chip label="No trial" color={DA_INK3} bg={DA_BG} border={DA_RULE} />;
  const days = trialDaysLeft(trialEndsAt);
  if (days === 0) return <Chip label="Expired" color={DA_DANGER} bg={DA_DANGER_SOFT} border="rgba(192,83,58,0.2)" />;
  const color  = days <= 3 ? AMBER : DA_GREEN;
  const bg     = days <= 3 ? AMBER_SOFT : DA_GREEN_SOFT;
  const border = days <= 3 ? "rgba(180,83,9,0.2)" : "rgba(77,138,94,0.25)";
  return <Chip label={`${days}d left`} color={color} bg={bg} border={border} />;
}

function StatCard({ value, label, accent }: { value: string | number; label: string; accent?: string }) {
  return (
    <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14, padding: "20px 22px" }}>
      <div style={{ fontSize: 28, fontWeight: 700, color: accent ?? DA_INK1, letterSpacing: -0.8, fontFamily: DISPLAY }}>{value}</div>
      <div style={{ fontSize: 12, fontWeight: 600, color: DA_INK3, marginTop: 4, textTransform: "uppercase" as const, letterSpacing: 0.5, fontFamily: SANS }}>{label}</div>
    </div>
  );
}

function IconBtn({ onClick, title, icon, danger }: { onClick: () => void; title: string; icon: string; danger?: boolean }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{ width: 32, height: 32, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 8, cursor: "pointer", padding: 0, fontSize: 15, fontFamily: SANS, transition: "background .12s",
        background: danger ? DA_DANGER_SOFT : DA_GOLD_SOFT,
        border: `1px solid ${danger ? "rgba(192,83,58,0.25)" : "rgba(176,138,62,0.3)"}`,
        color: danger ? DA_DANGER : DA_GOLD_DEEP,
      }}
    >
      {icon}
    </button>
  );
}

// ─── Extend Trial Modal ───────────────────────────────────────────────────────

function ExtendTrialModal({ agency, token, onClose, onExtended }: {
  agency: Agency; token: string; onClose: () => void; onExtended: (uid: string, ts: number) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [days, setDays]     = useState(14);
  const [mode, setMode]     = useState<"add" | "set">("add");

  const active    = isTrialActive(agency.trialEndsAt);
  const daysLeft  = trialDaysLeft(agency.trialEndsAt);
  const newExpiry = mode === "add"
    ? (active && agency.trialEndsAt ? agency.trialEndsAt : Date.now()) + days * 86_400_000
    : Date.now() + days * 86_400_000;

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/agencies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid: agency.uid, trialEndsAt: newExpiry }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      onExtended(agency.uid, newExpiry);
      onClose();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const inputStyle: React.CSSProperties = { width: "100%", background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 10, padding: "10px 14px", color: DA_INK1, fontSize: 14, fontWeight: 600, fontFamily: SANS, outline: "none" };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(26,22,17,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 460, background: DA_SURFACE2, border: `1px solid ${DA_RULE}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(26,22,17,0.15)" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${DA_RULE}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: DA_INK1, fontFamily: DISPLAY }}>Extend Trial</div>
            <div style={{ fontSize: 12.5, color: DA_INK2, marginTop: 3 }}>{agency.name || agency.email}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: DA_INK3, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column" as const, gap: 20 }}>
          {/* Current status */}
          <div style={{ padding: "12px 16px", borderRadius: 12, background: DA_BG, border: `1px solid ${DA_RULE}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: DA_INK3, fontWeight: 600 }}>Current trial</div>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>
              {!agency.trialEndsAt
                ? <span style={{ color: DA_INK3 }}>No trial set</span>
                : active
                ? <span style={{ color: DA_GREEN }}>{daysLeft}d remaining · expires {fmtDate(agency.trialEndsAt)}</span>
                : <span style={{ color: DA_DANGER }}>Expired {fmtDate(agency.trialEndsAt)}</span>}
            </div>
          </div>

          {/* Mode toggle */}
          <div style={{ display: "flex", gap: 8 }}>
            {(["add", "set"] as const).map(m => (
              <button key={m} onClick={() => setMode(m)} style={{ flex: 1, padding: "9px 0", borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SANS, transition: "all .15s",
                background: mode === m ? DA_GOLD_SOFT : "transparent",
                border: `1px solid ${mode === m ? "rgba(176,138,62,0.4)" : DA_RULE}`,
                color: mode === m ? DA_GOLD_DEEP : DA_INK2,
              }}>
                {m === "add" ? "Add days" : "Set from today"}
              </button>
            ))}
          </div>

          {/* Quick pick */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: DA_INK3, letterSpacing: 0.6, textTransform: "uppercase" as const, marginBottom: 10, fontFamily: SANS }}>Quick pick</div>
            <div style={{ display: "flex", gap: 8 }}>
              {[7, 14, 30, 60].map(d => (
                <button key={d} onClick={() => setDays(d)} style={{ flex: 1, padding: "10px 0", borderRadius: 10, fontSize: 13.5, fontWeight: 700, cursor: "pointer", fontFamily: SANS, transition: "all .12s",
                  background: days === d ? DA_GOLD : DA_BG,
                  border: `1px solid ${days === d ? "rgba(176,138,62,0.5)" : DA_RULE}`,
                  color: days === d ? "#fff" : DA_INK2,
                }}>
                  {d}d
                </button>
              ))}
            </div>
          </div>

          {/* Custom */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: DA_INK3, letterSpacing: 0.6, textTransform: "uppercase" as const, marginBottom: 8, fontFamily: SANS }}>Custom days</div>
            <input type="number" min={1} max={365} value={days} onChange={e => setDays(Math.max(1, Math.min(365, Number(e.target.value))))} style={inputStyle} />
          </div>

          {/* Preview */}
          <div style={{ padding: "14px 16px", borderRadius: 12, background: DA_GOLD_SOFT, border: "1px solid rgba(176,138,62,0.25)" }}>
            <div style={{ fontSize: 11, color: DA_GOLD_DEEP, fontWeight: 600, marginBottom: 4, opacity: 0.7 }}>New expiry date</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: DA_GOLD_DEEP, fontFamily: DISPLAY }}>{fmtDate(newExpiry)}</div>
          </div>

          {error && <div style={{ fontSize: 12.5, color: DA_DANGER, padding: "10px 14px", borderRadius: 10, background: DA_DANGER_SOFT, border: "1px solid rgba(192,83,58,0.2)" }}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${DA_RULE}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} disabled={saving} style={{ padding: "10px 20px", borderRadius: 10, background: "transparent", border: `1px solid ${DA_RULE}`, color: DA_INK2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "10px 24px", borderRadius: 10, background: saving ? DA_GOLD_SOFT : DA_GOLD, color: saving ? DA_GOLD_DEEP : "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: saving ? "not-allowed" : "pointer", fontFamily: SANS }}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Grant Plan Modal ─────────────────────────────────────────────────────────

const PLAN_OPTIONS: { value: string; label: string }[] = [
  { value: "founding", label: "Founding" },
  { value: "standard", label: "Standard" },
  { value: "start",    label: "Start" },
  { value: "grow",     label: "Grow" },
  { value: "scale",    label: "Scale" },
  { value: "free",     label: "Free (downgrade)" },
];

function GrantPlanModal({ agency, token, onClose, onGranted }: {
  agency: Agency; token: string; onClose: () => void; onGranted: (uid: string, plan: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState<string | null>(null);
  const [plan, setPlan]     = useState<string>("founding");

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/agencies", {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ uid: agency.uid, plan }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      onGranted(agency.uid, plan);
      onClose();
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  const currentChip = PLAN_CHIP[agency.plan] ?? PLAN_CHIP.free;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(26,22,17,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 440, background: DA_SURFACE2, border: `1px solid ${DA_RULE}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(26,22,17,0.15)" }}>
        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${DA_RULE}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: DA_INK1, fontFamily: DISPLAY }}>Grant Subscription</div>
            <div style={{ fontSize: 12.5, color: DA_INK2, marginTop: 3 }}>{agency.name || agency.email}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: DA_INK3, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column" as const, gap: 18 }}>
          {/* Current plan */}
          <div style={{ padding: "12px 16px", borderRadius: 12, background: DA_BG, border: `1px solid ${DA_RULE}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontSize: 12, color: DA_INK3, fontWeight: 600 }}>Current plan</div>
            <Chip label={currentChip.label} color={currentChip.color} bg={currentChip.bg} border={currentChip.border} />
          </div>

          {/* Plan picker */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: DA_INK3, letterSpacing: 0.6, textTransform: "uppercase" as const, marginBottom: 10, fontFamily: SANS }}>Grant plan</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
              {PLAN_OPTIONS.map(opt => {
                const chip = PLAN_CHIP[opt.value] ?? PLAN_CHIP.free;
                const selected = plan === opt.value;
                return (
                  <button key={opt.value} onClick={() => setPlan(opt.value)} style={{ padding: "10px 6px", borderRadius: 10, fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: SANS, transition: "all .12s",
                    background: selected ? chip.bg : "transparent",
                    border: `1px solid ${selected ? chip.border : DA_RULE}`,
                    color: selected ? chip.color : DA_INK2,
                  }}>
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ padding: "12px 16px", borderRadius: 12, background: DA_GOLD_SOFT, border: "1px solid rgba(176,138,62,0.25)", fontSize: 12.5, color: DA_GOLD_DEEP, lineHeight: 1.55 }}>
            This bypasses Stripe and sets the plan directly. No charge is applied. Use for internal accounts, demos, or manual exceptions.
          </div>

          {error && <div style={{ fontSize: 12.5, color: DA_DANGER, padding: "10px 14px", borderRadius: 10, background: DA_DANGER_SOFT, border: "1px solid rgba(192,83,58,0.2)" }}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${DA_RULE}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} disabled={saving} style={{ padding: "10px 20px", borderRadius: 10, background: "transparent", border: `1px solid ${DA_RULE}`, color: DA_INK2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>Cancel</button>
          <button onClick={handleSave} disabled={saving} style={{ padding: "10px 24px", borderRadius: 10, background: saving ? DA_GOLD_SOFT : DA_GOLD, color: saving ? DA_GOLD_DEEP : "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: saving ? "not-allowed" : "pointer", fontFamily: SANS }}>
            {saving ? "Saving…" : "Grant plan"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Modal ─────────────────────────────────────────────────────────────

function DeleteAgencyModal({ agency, token, onClose, onDeleted }: {
  agency: Agency; token: string; onClose: () => void; onDeleted: (uid: string) => void;
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
    } catch (err: any) { setError(err.message); }
    finally { setDeleting(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(26,22,17,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 440, background: DA_SURFACE2, border: `1px solid ${DA_RULE}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(26,22,17,0.15)" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${DA_RULE}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: DA_DANGER, fontFamily: DISPLAY }}>Delete Agency</div>
            <div style={{ fontSize: 12.5, color: DA_INK2, marginTop: 3 }}>{agency.name || agency.email}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: DA_INK3, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>
        <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column" as const, gap: 16 }}>
          <div style={{ padding: "14px 16px", borderRadius: 12, background: DA_DANGER_SOFT, border: "1px solid rgba(192,83,58,0.2)", fontSize: 13.5, color: DA_INK1, lineHeight: 1.65 }}>
            This will permanently delete:
            <ul style={{ margin: "8px 0 0", paddingLeft: 18, color: DA_INK2 }}>
              <li>Agency account &amp; profile</li>
              <li>All packages and leads</li>
              <li>Custom domain configuration</li>
              <li>Firebase Auth account</li>
            </ul>
          </div>
          <div style={{ fontSize: 13, color: DA_INK2 }}>
            This <strong style={{ color: DA_INK1 }}>cannot be undone</strong>. Deleting <strong style={{ color: DA_INK1 }}>{agency.name || agency.email}</strong>.
          </div>
          {error && <div style={{ fontSize: 12.5, color: DA_DANGER, padding: "10px 14px", borderRadius: 10, background: DA_DANGER_SOFT, border: "1px solid rgba(192,83,58,0.2)" }}>{error}</div>}
        </div>
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${DA_RULE}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} disabled={deleting} style={{ padding: "10px 20px", borderRadius: 10, background: "transparent", border: `1px solid ${DA_RULE}`, color: DA_INK2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>Cancel</button>
          <button onClick={handleDelete} disabled={deleting} style={{ padding: "10px 22px", borderRadius: 10, background: deleting ? DA_DANGER_SOFT : DA_DANGER, color: deleting ? DA_DANGER : "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: deleting ? "not-allowed" : "pointer", fontFamily: SANS }}>
            {deleting ? "Deleting…" : "Delete permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Wipe Modal ───────────────────────────────────────────────────────────────

function WipeModal({ token, onClose, onWiped }: { token: string; onClose: () => void; onWiped: (count: number) => void }) {
  const [wiping, setWiping] = useState(false);
  const [error, setError]   = useState<string | null>(null);

  const handleWipe = async () => {
    setWiping(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/cleanup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Cleanup failed");
      const { deleted } = await res.json();
      onWiped(deleted);
      onClose();
    } catch (err: any) { setError(err.message); }
    finally { setWiping(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(26,22,17,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 460, background: DA_SURFACE2, border: `1px solid ${DA_RULE}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(26,22,17,0.15)" }}>
        <div style={{ padding: "20px 24px", borderBottom: `1px solid ${DA_RULE}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: DA_DANGER, fontFamily: DISPLAY }}>Wipe test data</div>
            <div style={{ fontSize: 12.5, color: DA_INK2, marginTop: 3 }}>Delete all agencies except wqapptech@gmail.com</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: DA_INK3, fontSize: 22, cursor: "pointer", lineHeight: 1, padding: "0 4px" }}>×</button>
        </div>
        <div style={{ padding: "22px 24px", display: "flex", flexDirection: "column" as const, gap: 16 }}>
          <div style={{ padding: "14px 16px", borderRadius: 12, background: DA_DANGER_SOFT, border: "1px solid rgba(192,83,58,0.2)", fontSize: 13.5, color: DA_INK1, lineHeight: 1.65 }}>
            This will permanently delete <strong>every agency</strong> except <strong>wqapptech@gmail.com</strong>, including all their packages, leads, custom domains, and Firebase Auth accounts.
          </div>
          <div style={{ fontSize: 13, color: DA_INK2 }}>This <strong style={{ color: DA_INK1 }}>cannot be undone</strong>.</div>
          {error && <div style={{ fontSize: 12.5, color: DA_DANGER, padding: "10px 14px", borderRadius: 10, background: DA_DANGER_SOFT, border: "1px solid rgba(192,83,58,0.2)" }}>{error}</div>}
        </div>
        <div style={{ padding: "16px 24px", borderTop: `1px solid ${DA_RULE}`, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <button onClick={onClose} disabled={wiping} style={{ padding: "10px 20px", borderRadius: 10, background: "transparent", border: `1px solid ${DA_RULE}`, color: DA_INK2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>Cancel</button>
          <button onClick={handleWipe} disabled={wiping} style={{ padding: "10px 22px", borderRadius: 10, background: wiping ? DA_DANGER_SOFT : DA_DANGER, color: wiping ? DA_DANGER : "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: wiping ? "not-allowed" : "pointer", fontFamily: SANS }}>
            {wiping ? "Wiping…" : "Wipe all test data"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Domain Management Modal ──────────────────────────────────────────────────

function DomainModal({ agency, token, onClose, onUpdated }: {
  agency: Agency; token: string; onClose: () => void;
  onUpdated: (uid: string, status: string) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError]  = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const status = agency.customDomainStatus;
  const hostname = agency.customDomain;

  const IN_PROGRESS: (DomainStatus | null)[] = ["pending_dns", "verifying", "ssl_provisioning"];

  const patchDomain = async (body: Record<string, unknown>) => {
    setSaving(true); setError(null); setSuccess(null);
    try {
      const res = await fetch(`/api/admin/domains/${encodeURIComponent(hostname!)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Failed");
      const { status: newStatus } = await res.json();
      setSuccess(`Status updated to ${newStatus}`);
      onUpdated(agency.uid, newStatus);
    } catch (err: any) { setError(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(26,22,17,0.5)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ width: "100%", maxWidth: 480, background: DA_SURFACE2, border: `1px solid ${DA_RULE}`, borderRadius: 20, overflow: "hidden", boxShadow: "0 20px 60px rgba(26,22,17,0.15)" }}>
        {/* Header */}
        <div style={{ padding: "18px 24px", borderBottom: `1px solid ${DA_RULE}`, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: DA_INK1, fontFamily: DISPLAY }}>Domain Management</div>
            <div style={{ fontSize: 11.5, color: DA_INK3, marginTop: 3 }}>{agency.name || agency.email}</div>
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: DA_INK3, fontSize: 22, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column" as const, gap: 14 }}>
          {/* Status info */}
          <div style={{ padding: "10px 14px", borderRadius: 10, background: DA_BG, border: `1px solid ${DA_RULE}` }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: DA_INK3, marginBottom: 4 }}>HOSTNAME</div>
            <div style={{ fontFamily: "monospace", fontSize: 13, color: DA_INK1, fontWeight: 600 }}>{hostname}</div>
            <div style={{ marginTop: 6 }}><DomainChip status={status} /></div>
          </div>

          {/* In-progress: CF is polling automatically */}
          {IN_PROGRESS.includes(status) && (
            <div style={{ padding: "10px 13px", borderRadius: 8, background: DA_BG, border: `1px solid ${DA_RULE}`, fontSize: 12, color: DA_INK3, lineHeight: 1.6 }}>
              Cloudflare is verifying this domain automatically. DNS records were sent to the agency by email when they registered. Use the overrides below only if polling is stuck.
            </div>
          )}

          {/* Terminal states */}
          {(status === "active" || status === "failed") && (
            <div style={{ fontSize: 12.5, color: DA_INK3, lineHeight: 1.6 }}>
              {status === "active" ? "Domain is live. The agency can visit their site." : "Domain failed. The agency sees an error and can remove and re-register."}
            </div>
          )}

          {success && <div style={{ fontSize: 12.5, color: DA_GREEN, padding: "10px 14px", borderRadius: 10, background: DA_GREEN_SOFT, border: "1px solid rgba(77,138,94,0.25)" }}>{success}</div>}
          {error   && <div style={{ fontSize: 12.5, color: DA_DANGER, padding: "10px 14px", borderRadius: 10, background: DA_DANGER_SOFT, border: "1px solid rgba(192,83,58,0.2)" }}>{error}</div>}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 24px", borderTop: `1px solid ${DA_RULE}`, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10, flexWrap: "wrap" as const }}>
          {IN_PROGRESS.includes(status) && (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => patchDomain({ action: "mark_active" })} disabled={saving}
                style={{ padding: "8px 14px", borderRadius: 9, background: DA_GREEN_SOFT, border: "1px solid rgba(77,138,94,0.25)", color: DA_GREEN, fontSize: 12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: SANS }}>
                Mark active
              </button>
              <button onClick={() => patchDomain({ action: "mark_failed", error_message: "Manually marked as failed." })} disabled={saving}
                style={{ padding: "8px 14px", borderRadius: 9, background: DA_DANGER_SOFT, border: "1px solid rgba(192,83,58,0.2)", color: DA_DANGER, fontSize: 12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", fontFamily: SANS }}>
                Mark failed
              </button>
            </div>
          )}
          <div style={{ display: "flex", gap: 8, marginLeft: "auto" }}>
            <button onClick={onClose} disabled={saving} style={{ padding: "9px 18px", borderRadius: 10, background: "transparent", border: `1px solid ${DA_RULE}`, color: DA_INK2, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}>Close</button>
          </div>
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
  const [filterPlan, setFilterPlan] = useState("all");
  const [deleting, setDeleting]   = useState<Agency | null>(null);
  const [extending, setExtending] = useState<Agency | null>(null);
  const [granting, setGranting]   = useState<Agency | null>(null);
  const [wiping, setWiping]       = useState(false);
  const [wipeMsg, setWipeMsg]     = useState<string | null>(null);
  const [managingDomain, setManagingDomain] = useState<Agency | null>(null);

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
      const res = await fetch("/api/admin/agencies", { headers: { Authorization: `Bearer ${t}` } });
      if (res.status === 403) { router.replace("/admin/login"); return; }
      if (!res.ok) throw new Error("Failed to load agencies");
      setAgencies((await res.json()).agencies);
    } catch (e: any) { setError(e.message); }
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { if (token) loadAgencies(token); }, [token, loadAgencies]);

  const handleDeleted  = (uid: string) => setAgencies(prev => prev.filter(a => a.uid !== uid));
  const handleExtended = (uid: string, ts: number) => setAgencies(prev => prev.map(a => a.uid === uid ? { ...a, trialEndsAt: ts } : a));
  const handleGranted  = (uid: string, plan: string) => setAgencies(prev => prev.map(a => a.uid === uid ? { ...a, plan } : a));
  const handleDomainUpdated = (uid: string, status: string) => setAgencies(prev => prev.map(a => a.uid === uid ? { ...a, customDomainStatus: status as any } : a));
  const handleWiped    = (count: number) => {
    setWipeMsg(`Deleted ${count} test ${count === 1 ? "agency" : "agencies"}.`);
    if (token) loadAgencies(token);
  };

  const filtered = agencies.filter(a => {
    const q = search.toLowerCase();
    const matchSearch = !q || a.name.toLowerCase().includes(q) || a.email.toLowerCase().includes(q) || (a.customDomain ?? "").toLowerCase().includes(q) || (a.agencySlug ?? "").toLowerCase().includes(q);
    return matchSearch && (filterPlan === "all" || a.plan === filterPlan);
  });

  const totalPaid        = agencies.filter(a => isPaid(a.plan)).length;
  const totalTrialActive = agencies.filter(a => !isPaid(a.plan) && isTrialActive(a.trialEndsAt)).length;
  const totalExpired     = agencies.filter(a => !isPaid(a.plan) && a.trialEndsAt && !isTrialActive(a.trialEndsAt)).length;
  const withDomain       = agencies.filter(a => a.customDomain).length;

  const COLS = "minmax(160px,1.6fr) minmax(150px,1.4fr) 90px 100px minmax(150px,1.2fr) 110px 114px";

  const inputBase: React.CSSProperties = { background: DA_SURFACE2, border: `1px solid ${DA_RULE}`, borderRadius: 10, padding: "9px 14px", color: DA_INK1, fontSize: 13, fontFamily: SANS, outline: "none" };

  return (
    <>
      {/* Title row */}
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, flexWrap: "wrap" as const, gap: 12 }}>
        <div>
          <div style={{ fontSize: 26, fontWeight: 400, color: DA_INK1, fontFamily: DISPLAY, letterSpacing: -0.3 }}>Agencies</div>
          <div style={{ fontSize: 13, color: DA_INK3, marginTop: 4, fontFamily: SANS }}>{agencies.length} total</div>
        </div>
        <button
          onClick={() => setWiping(true)}
          style={{ padding: "9px 18px", borderRadius: 10, background: DA_DANGER_SOFT, border: "1px solid rgba(192,83,58,0.2)", color: DA_DANGER, fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: SANS }}
        >
          Wipe test data
        </button>
      </div>

      {wipeMsg && (
        <div style={{ marginBottom: 20, padding: "12px 16px", borderRadius: 12, background: DA_GREEN_SOFT, border: "1px solid rgba(77,138,94,0.25)", fontSize: 13, color: DA_GREEN, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {wipeMsg}
          <button onClick={() => setWipeMsg(null)} style={{ background: "none", border: "none", color: DA_GREEN, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
        </div>
      )}

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 12, marginBottom: 28 }}>
        <StatCard value={agencies.length} label="Total" />
        <StatCard value={totalPaid} label="Paid" accent={DA_GOLD} />
        <StatCard value={totalTrialActive} label="Trial active" accent={DA_GREEN} />
        <StatCard value={totalExpired} label="Trial expired" accent={DA_DANGER} />
        <StatCard value={withDomain} label="Custom domains" accent={BLUE} />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap" as const }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, domain, slug…" style={{ ...inputBase, flex: 1, minWidth: 220 }} />
        <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} style={{ ...inputBase, cursor: "pointer" }}>
          <option value="all">All plans</option>
          <option value="founding">Founding</option>
          <option value="standard">Standard</option>
          <option value="free">Free</option>
          <option value="start">Start</option>
          <option value="grow">Grow</option>
          <option value="scale">Scale</option>
        </select>
        <button onClick={() => token && loadAgencies(token)} style={{ ...inputBase, cursor: "pointer", fontWeight: 600, color: DA_INK2 }}>
          ↻ Refresh
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}><span className="spinner" /></div>
      ) : error ? (
        <div style={{ color: DA_DANGER, fontSize: 13, padding: "20px 0" }}>{error}</div>
      ) : (
        <div style={{ borderRadius: 16, border: `1px solid ${DA_RULE}`, overflow: "hidden", overflowX: "auto" as const, background: DA_SURFACE2 }}>
          {/* Header */}
          <div style={{ display: "grid", gridTemplateColumns: COLS, padding: "11px 20px", background: DA_BG, borderBottom: `1px solid ${DA_RULE}`, gap: 12, minWidth: 820 }}>
            {["Agency", "Email", "Plan", "Trial", "Custom Domain", "Joined", ""].map((h, i) => (
              <div key={i} style={{ fontSize: 10.5, fontWeight: 700, color: DA_INK3, textTransform: "uppercase" as const, letterSpacing: 0.6, fontFamily: SANS }}>{h}</div>
            ))}
          </div>

          {filtered.length === 0 ? (
            <div style={{ padding: "56px 20px", textAlign: "center" as const, color: DA_INK3, fontSize: 13, fontFamily: SANS }}>No agencies found</div>
          ) : filtered.map((agency, idx) => (
            <div
              key={agency.uid}
              style={{ display: "grid", gridTemplateColumns: COLS, padding: "14px 20px", borderTop: idx === 0 ? "none" : `1px solid ${DA_RULE}`, gap: 12, alignItems: "center", minWidth: 820, background: idx % 2 === 0 ? DA_SURFACE2 : DA_SURFACE }}
            >
              {/* Agency */}
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 13.5, fontWeight: 600, color: DA_INK1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, fontFamily: SANS }}>{agency.name || "—"}</div>
                {agency.agencySlug && <div style={{ fontSize: 10.5, color: DA_INK3, fontFamily: "monospace", marginTop: 2 }}>/{agency.agencySlug}</div>}
              </div>

              {/* Email */}
              <div style={{ fontSize: 12.5, color: DA_INK2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const, fontFamily: SANS }}>{agency.email}</div>

              {/* Plan */}
              <div>{(() => { const m = PLAN_CHIP[agency.plan] ?? PLAN_CHIP.free; return <Chip label={m.label} color={m.color} bg={m.bg} border={m.border} />; })()}</div>

              {/* Trial */}
              <div><TrialChip trialEndsAt={agency.trialEndsAt} plan={agency.plan} /></div>

              {/* Domain */}
              <div style={{ minWidth: 0 }}>
                {agency.customDomain ? (
                  <>
                    <div style={{ fontSize: 12, fontFamily: "monospace", color: DA_INK2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{agency.customDomain}</div>
                    <div style={{ marginTop: 3 }}><DomainChip status={agency.customDomainStatus} /></div>
                  </>
                ) : <span style={{ color: DA_INK3, fontSize: 12 }}>—</span>}
              </div>

              {/* Joined */}
              <div style={{ fontSize: 12, color: DA_INK3, fontFamily: SANS }}>{fmtDate(agency.createdAt)}</div>

              {/* Actions */}
              <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                {agency.customDomain && (
                  <IconBtn onClick={() => setManagingDomain(agency)} title="Manage domain" icon={agency.customDomainStatus === "pending_dns" ? "🔔" : "🌐"} />
                )}
                <IconBtn onClick={() => setGranting(agency)} title="Grant plan" icon="⭐" />
                <IconBtn onClick={() => setExtending(agency)} title="Extend trial" icon="⏱" />
                <IconBtn onClick={() => setDeleting(agency)} title="Delete agency" icon="🗑" danger />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      {granting && token && (
        <GrantPlanModal agency={granting} token={token} onClose={() => setGranting(null)} onGranted={(uid, plan) => { handleGranted(uid, plan); setGranting(null); }} />
      )}
      {extending && token && (
        <ExtendTrialModal agency={extending} token={token} onClose={() => setExtending(null)} onExtended={(uid, ts) => { handleExtended(uid, ts); setExtending(null); }} />
      )}
      {deleting && token && (
        <DeleteAgencyModal agency={deleting} token={token} onClose={() => setDeleting(null)} onDeleted={(uid) => { handleDeleted(uid); setDeleting(null); }} />
      )}
      {wiping && token && (
        <WipeModal token={token} onClose={() => setWiping(null!)} onWiped={handleWiped} />
      )}
      {managingDomain && token && (
        <DomainModal
          agency={managingDomain}
          token={token}
          onClose={() => setManagingDomain(null)}
          onUpdated={(uid, status) => { handleDomainUpdated(uid, status); }}
        />
      )}
    </>
  );
}
