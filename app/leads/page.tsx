"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";
import Icon from "@/components/Icon";

const SAND = "#e8c97b";

const STATUS_COLORS: Record<string, string> = {
  new: "#4ecdc4",
  contacted: "#a78bfa",
  negotiating: "#f5a623",
  booked: "#2dd4a0",
  lost: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New Lead",
  contacted: "Contacted",
  negotiating: "Negotiating",
  booked: "Booked",
  lost: "Lost",
};

const STATUSES = ["new", "contacted", "negotiating", "booked", "lost"];

type Lead = {
  id: string;
  name: string;
  status: string;
  channel: "whatsapp" | "messenger";
  date: string;
  packageName: string;
  pkgColor: string;
};

// ── Lead card (Kanban) ────────────────────────────────────────────────────────

function LeadCard({ lead, onDragStart, updateStatus }: {
  lead: Lead;
  onDragStart: () => void;
  updateStatus: (id: string, status: string) => void;
}) {
  return (
    <div
      draggable
      onDragStart={onDragStart}
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10, padding: 12,
        cursor: "grab", userSelect: "none",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 13, fontWeight: 600 }}>{lead.name}</span>
        <span style={{ width: 20, height: 20, borderRadius: "50%", background: lead.pkgColor, display: "inline-block", flexShrink: 0 }} />
      </div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginBottom: 8 }}>{lead.packageName}</div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{
          fontSize: 10,
          color: lead.channel === "whatsapp" ? "#25d366" : "#0084ff",
          background: lead.channel === "whatsapp" ? "rgba(37,211,102,0.1)" : "rgba(0,132,255,0.1)",
          borderRadius: 99, padding: "2px 8px",
        }}>
          {lead.channel === "whatsapp" ? "WhatsApp" : "Messenger"}
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)" }}>{lead.date}</span>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {STATUSES.filter(s => s !== lead.status).map(s => (
          <button key={s} onClick={() => updateStatus(lead.id, s)} style={{
            fontSize: 9, background: `${STATUS_COLORS[s]}15`,
            border: `1px solid ${STATUS_COLORS[s]}30`,
            borderRadius: 99, padding: "2px 7px", color: STATUS_COLORS[s],
            fontFamily: "inherit", cursor: "pointer",
          }}>→ {STATUS_LABELS[s]}</button>
        ))}
      </div>
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────

function StatusPill({ status, onChange }: { status: string; onChange: (s: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button onClick={() => setOpen(o => !o)} style={{
        background: `${STATUS_COLORS[status]}18`,
        border: `1px solid ${STATUS_COLORS[status]}40`,
        borderRadius: 99, padding: "4px 10px",
        color: STATUS_COLORS[status], fontSize: 11, fontWeight: 600,
        fontFamily: "inherit", cursor: "pointer",
      }}>
        {STATUS_LABELS[status]} ▾
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", left: 0, zIndex: 100,
          background: "var(--navy-light, #1e3455)", border: "1px solid var(--border)",
          borderRadius: 10, overflow: "hidden", minWidth: 130,
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        }}>
          {STATUSES.map(s => (
            <button key={s} onClick={() => { onChange(s); setOpen(false); }} style={{
              display: "block", width: "100%", padding: "9px 12px",
              background: s === status ? `${STATUS_COLORS[s]}18` : "none",
              border: "none", textAlign: "left",
              color: STATUS_COLORS[s], fontSize: 12, fontFamily: "inherit", cursor: "pointer",
            }}>{STATUS_LABELS[s]}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filter, setFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [dragging, setDragging] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }

      // Load packages to get lead data
      const q = query(collection(db, "packages"), where("userId", "==", user.uid));
      const snap = await getDocs(q);
      const dotColors = ["#c9713a", "#2d7a4e", "#2563a8", "#7c3aed", "#0f766e"];

      // Each package click becomes a "lead" (approximated from click counts)
      const loadedLeads: Lead[] = [];
      snap.docs.forEach((d, di) => {
        const pkg = d.data();
        const pkgColor = dotColors[di % dotColors.length];
        const clicks = (pkg.whatsappClicks || 0) + (pkg.messengerClicks || 0);
        // Create lead placeholders from click counts (real leads would come from a leads sub-collection)
        for (let i = 0; i < Math.min(clicks, 3); i++) {
          loadedLeads.push({
            id: `${d.id}-lead-${i}`,
            name: `Lead #${loadedLeads.length + 1}`,
            status: ["new", "contacted", "negotiating"][i % 3],
            channel: i % 2 === 0 ? "whatsapp" : "messenger",
            date: new Date(pkg.createdAt || Date.now()).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
            packageName: pkg.destination || "Package",
            pkgColor,
          });
        }
      });

      setLeads(loadedLeads);
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  const updateStatus = (id: string, status: string) => {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
  };

  const filtered = filter === "all" ? leads : leads.filter(l => l.status === filter);

  if (authLoading) {
    return (
      <AppLayout>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="spinner" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", padding: "32px 40px 0" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22, flexShrink: 0 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>Lead Tracker</h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>{leads.length} leads tracked</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {(["kanban", "list"] as const).map(m => (
              <button key={m} onClick={() => setViewMode(m)} style={{
                background: viewMode === m ? `${SAND}20` : "rgba(255,255,255,0.04)",
                border: viewMode === m ? `1px solid ${SAND}50` : "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, padding: "7px 14px",
                color: viewMode === m ? SAND : "rgba(255,255,255,0.4)",
                fontSize: 12, fontFamily: "inherit", cursor: "pointer", fontWeight: 500,
                textTransform: "capitalize",
              }}>{m}</button>
            ))}
          </div>
        </div>

        {/* Status filter row */}
        <div style={{ display: "flex", gap: 10, marginBottom: 22, flexShrink: 0, flexWrap: "wrap" }}>
          {STATUSES.map(s => {
            const count = leads.filter(l => l.status === s).length;
            return (
              <button key={s} onClick={() => setFilter(f => f === s ? "all" : s)} style={{
                background: filter === s ? `${STATUS_COLORS[s]}18` : "rgba(255,255,255,0.03)",
                border: `1px solid ${filter === s ? STATUS_COLORS[s] + "50" : "rgba(255,255,255,0.08)"}`,
                borderRadius: 10, padding: "8px 14px",
                display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
              }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: STATUS_COLORS[s], display: "inline-block" }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: filter === s ? STATUS_COLORS[s] : "rgba(255,255,255,0.5)" }}>{STATUS_LABELS[s]}</span>
                <span style={{ fontSize: 12, fontWeight: 800, color: filter === s ? STATUS_COLORS[s] : "rgba(255,255,255,0.35)" }}>{count}</span>
              </button>
            );
          })}
        </div>

        {leads.length === 0 ? (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, color: "rgba(255,255,255,0.2)" }}>
            <Icon name="users" size={40} color="rgba(255,255,255,0.08)" strokeWidth={1} />
            <p style={{ fontSize: 14 }}>No leads yet</p>
            <p style={{ fontSize: 12, maxWidth: 280, textAlign: "center", color: "rgba(255,255,255,0.3)" }}>
              Leads appear here when visitors click your WhatsApp or Messenger CTAs on landing pages.
            </p>
          </div>
        ) : viewMode === "kanban" ? (
          // Kanban
          <div style={{ flex: 1, overflow: "auto", display: "flex", gap: 12, paddingBottom: 32 }}>
            {STATUSES.map(status => {
              const colLeads = leads.filter(l => l.status === status);
              return (
                <div key={status} style={{
                  minWidth: 210, maxWidth: 230,
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 14, overflow: "hidden",
                  display: "flex", flexDirection: "column", flexShrink: 0,
                }}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => { if (dragging) { updateStatus(dragging, status); setDragging(null); } }}
                >
                  <div style={{ padding: "12px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: "50%", background: STATUS_COLORS[status], display: "inline-block" }} />
                      <span style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.7)" }}>{STATUS_LABELS[status]}</span>
                    </div>
                    <span style={{ background: `${STATUS_COLORS[status]}20`, color: STATUS_COLORS[status], borderRadius: 99, padding: "1px 8px", fontSize: 11, fontWeight: 700 }}>{colLeads.length}</span>
                  </div>
                  <div style={{ flex: 1, overflow: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 8 }}>
                    {colLeads.map(lead => (
                      <LeadCard key={lead.id} lead={lead} onDragStart={() => setDragging(lead.id)} updateStatus={updateStatus} />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          // List view
          <div style={{ flex: 1, overflow: "auto", paddingBottom: 32 }}>
            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, overflow: "hidden" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 120px 100px 130px", padding: "10px 18px", borderBottom: "1px solid rgba(255,255,255,0.07)", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.3)", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                <span>Name</span><span>Package</span><span>Channel</span><span>Date</span><span>Status</span>
              </div>
              {filtered.map((lead, i) => (
                <div key={lead.id} style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr 120px 100px 130px",
                  padding: "12px 18px",
                  borderBottom: i < filtered.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  alignItems: "center",
                }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>{lead.name}</span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)" }}>{lead.packageName}</span>
                  <span style={{ fontSize: 12, color: lead.channel === "whatsapp" ? "#25d366" : "#0084ff" }}>
                    {lead.channel === "whatsapp" ? "WhatsApp" : "Messenger"}
                  </span>
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>{lead.date}</span>
                  <StatusPill status={lead.status} onChange={s => updateStatus(lead.id, s)} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
