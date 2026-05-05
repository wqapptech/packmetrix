"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";
import Icon from "@/components/Icon";

const SAND = "#e8c97b";

type Lead = {
  id: string;
  packageId: string;
  destination: string;
  price: string;
  channel: "whatsapp" | "messenger";
  status: string;
  createdAt: number;
};

const TAB_STATUS: Record<string, string | null> = {
  all: null,
  pending: "new",
  booked: "booked",
  lost: "lost",
};

// ── Heat dots ─────────────────────────────────────────────────────────────────

function HeatDots({ level }: { level: number }) {
  return (
    <div>
      <div style={{ display: "flex", gap: 3 }}>
        {[1, 2, 3, 4, 5].map(n => (
          <span key={n} style={{
            display: "inline-block", width: 5, height: 5, borderRadius: "50%",
            background: n <= level ? SAND : "rgba(255,255,255,0.1)",
          }} />
        ))}
      </div>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>
        {level >= 4 ? "Hot" : level >= 3 ? "Warm" : "Cool"}
      </div>
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────

const STATUS_META: Record<string, { bg: string; color: string; label: string }> = {
  new:         { bg: "rgba(245,166,35,0.13)",  color: "#f5b34a", label: "Pending" },
  contacted:   { bg: "rgba(245,166,35,0.13)",  color: "#f5b34a", label: "Pending" },
  negotiating: { bg: "rgba(245,166,35,0.13)",  color: "#f5b34a", label: "Pending" },
  booked:      { bg: "rgba(45,212,160,0.13)",  color: "#54e0b5", label: "Booked"  },
  lost:        { bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)", label: "Lost" },
};

function StatusPill({ status }: { status: string }) {
  const m = STATUS_META[status] || STATUS_META.new;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", background: m.bg, color: m.color }}>
      {m.label}
    </span>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({ lead, onStatusChange }: { lead: Lead; onStatusChange: (id: string, status: string) => void }) {
  const initials = (lead.destination || "?").slice(0, 2).toUpperCase();
  const avatarColors = ["#c66a3d", "#1f5f8e", "#7c3aed", "#0d6e3f", "#b45309"];
  const avatarColor = avatarColors[Math.abs(lead.id.charCodeAt(0)) % avatarColors.length];
  const heat = lead.status === "booked" ? 5 : lead.status === "negotiating" ? 4 : lead.status === "contacted" ? 3 : lead.status === "new" ? 2 : 1;
  const channelColor = lead.channel === "whatsapp" ? "#25d366" : "#0084ff";
  const channelBg = lead.channel === "whatsapp" ? "rgba(37,211,102,0.08)" : "rgba(0,132,255,0.08)";
  const channelBorder = lead.channel === "whatsapp" ? "rgba(37,211,102,0.25)" : "rgba(0,132,255,0.25)";

  return (
    <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px", position: "sticky", top: 16, alignSelf: "start" }}>
      {/* Header */}
      <div style={{ display: "flex", gap: 14, marginBottom: 18, alignItems: "center" }}>
        <div style={{ width: 48, height: 48, borderRadius: "50%", flexShrink: 0, background: avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff" }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700 }}>{lead.destination}</div>
          <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)" }}>
            {lead.price} · {lead.channel === "whatsapp" ? "WhatsApp" : "Messenger"}
          </div>
        </div>
        <StatusPill status={lead.status} />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".5px" }}>Engagement</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: heat >= 4 ? "#54e0b5" : SAND, marginTop: 3 }}>{heat}/5 · {heat >= 4 ? "Hot" : heat >= 3 ? "Warm" : "Cool"}</div>
        </div>
        <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".5px" }}>Channel</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 3, color: channelColor }}>
            {lead.channel === "whatsapp" ? "WhatsApp" : "Messenger"}
          </div>
        </div>
      </div>

      {/* Activity */}
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>Activity</div>
      {[
        { t: "Lead created", s: `Clicked ${lead.channel === "whatsapp" ? "WhatsApp" : "Messenger"} CTA on landing page`, time: new Date(lead.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }), c: channelColor },
        { t: "Viewed pricing", s: "Scrolled to pricing section", time: "During visit", c: SAND },
        { t: "Landed on page", s: `From ${lead.destination} package`, time: "Session start", c: "#1f5f8e" },
      ].map((a, i) => (
        <div key={i} style={{ display: "flex", gap: 11, paddingBottom: 12, marginBottom: 12, borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.c, marginTop: 6, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{a.t}</div>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", marginTop: 2, lineHeight: 1.4 }}>{a.s}</div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{a.time}</div>
          </div>
        </div>
      ))}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <a
          href={`https://wa.me/${lead.channel === "whatsapp" ? "" : ""}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ flex: 1, padding: "10px", borderRadius: 9, background: "#25d366", color: "#fff", border: "none", fontSize: 12.5, fontWeight: 700, cursor: "pointer", textDecoration: "none", textAlign: "center", display: "block" }}
        >
          Reply on WA
        </a>
        {lead.status !== "booked" && (
          <button
            onClick={() => onStatusChange(lead.id, "booked")}
            style={{ padding: "10px 14px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "#fff", fontSize: 12.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            Mark booked
          </button>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const router = useRouter();
  const [authLoading, setAuthLoading] = useState(true);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<Lead | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      const q = query(collection(db, "leads"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead));
      setLeads(list);
      if (list.length > 0) setSelected(list[0]);
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  const updateStatus = async (id: string, status: string) => {
    await updateDoc(doc(db, "leads", id), { status });
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    setSelected(prev => prev?.id === id ? { ...prev, status } : prev);
  };

  const tabs = [
    { k: "all",     l: "All",     count: leads.length },
    { k: "pending", l: "Pending", count: leads.filter(l => ["new", "contacted", "negotiating"].includes(l.status)).length },
    { k: "booked",  l: "Booked",  count: leads.filter(l => l.status === "booked").length },
    { k: "lost",    l: "Lost",    count: leads.filter(l => l.status === "lost").length },
  ];

  const filtered = activeTab === "all"
    ? leads
    : activeTab === "pending"
    ? leads.filter(l => ["new", "contacted", "negotiating"].includes(l.status))
    : leads.filter(l => l.status === activeTab);

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
      <div style={{ padding: "28px 32px 60px", maxWidth: 1240 }}>

        {/* Page head */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.4px" }}>Leads</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
              {leads.length} active conversation{leads.length !== 1 ? "s" : ""}
              {leads.length > 0 && " · updated just now"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)", fontSize: 12.5, fontFamily: "inherit", cursor: "pointer" }}>
              Export CSV
            </button>
            <button style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)", fontSize: 12.5, fontFamily: "inherit", cursor: "pointer" }}>
              Sync WhatsApp
            </button>
          </div>
        </div>

        {/* Status tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          {tabs.map(t => (
            <button key={t.k} onClick={() => setActiveTab(t.k)} style={{
              padding: "10px 16px", border: "none", background: "none",
              color: activeTab === t.k ? SAND : "rgba(255,255,255,0.5)",
              fontSize: 13, fontWeight: activeTab === t.k ? 700 : 500,
              cursor: "pointer", fontFamily: "inherit",
              borderBottom: activeTab === t.k ? `2px solid ${SAND}` : "2px solid transparent",
              marginBottom: -1, transition: "all .15s",
            }}>
              {t.l} <span style={{ marginLeft: 5, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{t.count}</span>
            </button>
          ))}
        </div>

        {leads.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 12 }}>
            <Icon name="users" size={40} color="rgba(255,255,255,0.08)" strokeWidth={1} />
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }}>No leads yet</p>
            <p style={{ fontSize: 12, maxWidth: 280, textAlign: "center", color: "rgba(255,255,255,0.25)" }}>
              Leads appear when visitors tap your WhatsApp or Messenger CTA on a landing page.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18 }}>
            {/* Lead list */}
            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden" }}>
              {/* Column headers */}
              <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".5px", gap: 14 }}>
                <div style={{ width: 38 }} />
                <div style={{ flex: 2, marginLeft: 0 }}>Lead</div>
                <div style={{ flex: 1.4 }}>Package</div>
                <div style={{ width: 70 }}>Heat</div>
                <div style={{ width: 80 }}>Status</div>
                <div style={{ width: 60, textAlign: "right" }}>When</div>
              </div>

              {filtered.length === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
                  No {activeTab} leads
                </div>
              ) : filtered.map(lead => {
                const isSelected = selected?.id === lead.id;
                const initials = (lead.destination || "?").slice(0, 2).toUpperCase();
                const avatarColors = ["#c66a3d", "#1f5f8e", "#7c3aed", "#0d6e3f", "#b45309"];
                const avatarColor = avatarColors[Math.abs(lead.id.charCodeAt(0)) % avatarColors.length];
                const heat = lead.status === "booked" ? 5 : lead.status === "negotiating" ? 4 : lead.status === "contacted" ? 3 : lead.status === "new" ? 2 : 1;

                return (
                  <div
                    key={lead.id}
                    onClick={() => setSelected(lead)}
                    style={{
                      display: "flex", alignItems: "center", gap: 14, padding: "14px 20px",
                      borderBottom: "1px solid rgba(255,255,255,0.05)",
                      cursor: "pointer",
                      background: isSelected ? "rgba(232,201,123,0.06)" : "transparent",
                      transition: "background .15s",
                      borderLeft: isSelected ? `2px solid ${SAND}` : "2px solid transparent",
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                      {initials}
                    </div>
                    <div style={{ flex: 2, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.destination}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>via {lead.channel === "whatsapp" ? "WhatsApp" : "Messenger"}</div>
                    </div>
                    <div style={{ flex: 1.4, fontSize: 12, color: "rgba(255,255,255,0.65)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {lead.price || lead.destination}
                    </div>
                    <div style={{ width: 70 }}>
                      <HeatDots level={heat} />
                    </div>
                    <div style={{ width: 80 }}>
                      <StatusPill status={lead.status} />
                    </div>
                    <div style={{ width: 60, textAlign: "right", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                      {new Date(lead.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail panel */}
            {selected ? (
              <DetailPanel lead={selected} onStatusChange={updateStatus} />
            ) : (
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>Select a lead to see details</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
