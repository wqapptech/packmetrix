"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";
import Icon from "@/components/Icon";
import { useLang } from "@/hooks/useLang";
import { T } from "@/lib/translations";

const SAND = "#e8c97b";

type Lead = {
  id: string;
  packageId: string;
  destination: string;
  price: string;
  channel: "whatsapp" | "messenger";
  status: string;
  createdAt: number;
  sessionId?: string;
};

// ── Heat dots ─────────────────────────────────────────────────────────────────

function HeatDots({ level, hot, warm, cool }: { level: number; hot: string; warm: string; cool: string }) {
  const label = level >= 4 ? hot : level >= 3 ? warm : cool;
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
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{label}</div>
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────

function StatusPill({ status, label }: { status: string; label: string }) {
  const styles: Record<string, { bg: string; color: string }> = {
    new:       { bg: "rgba(100,149,237,0.13)", color: "#7eb3f5" },
    contacted: { bg: "rgba(245,166,35,0.13)",  color: "#f5b34a" },
    booked:    { bg: "rgba(45,212,160,0.13)",  color: "#54e0b5" },
    lost:      { bg: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.4)" },
  };
  const m = styles[status] || styles.new;
  return (
    <span style={{ padding: "3px 10px", borderRadius: 99, fontSize: 10.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", background: m.bg, color: m.color }}>
      {label}
    </span>
  );
}

// ── Trip portal teaser ────────────────────────────────────────────────────────

function TripPortalTeaser({ userId, leadId, t }: { userId: string | null; leadId: string; t: typeof T["en"] }) {
  const [requested, setRequested] = useState(false);

  const handleWantFaster = async () => {
    setRequested(true);
    try {
      await addDoc(collection(db, "featureRequests"), {
        feature: "trip-companion-portal",
        leadId,
        userId: userId || "anonymous",
        createdAt: Date.now(),
      });
    } catch {}
  };

  return (
    <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12, background: "rgba(232,201,123,0.06)", border: "1px dashed rgba(232,201,123,0.25)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: SAND }}>{t.tripPortalTitle}</div>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase", color: "rgba(232,201,123,0.6)", background: "rgba(232,201,123,0.1)", border: "1px solid rgba(232,201,123,0.2)", borderRadius: 99, padding: "2px 8px", flexShrink: 0 }}>
          {t.tripPortalComingSoon}
        </span>
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.55, marginBottom: 12 }}>
        {t.tripPortalDesc}
      </div>
      <button
        disabled
        style={{ width: "100%", padding: "9px", borderRadius: 9, background: "rgba(232,201,123,0.06)", border: "1px solid rgba(232,201,123,0.15)", color: "rgba(232,201,123,0.35)", fontSize: 12.5, fontWeight: 700, fontFamily: "inherit", cursor: "not-allowed", marginBottom: 8 }}
      >
        🔒 Generate Trip Portal
      </button>
      {requested ? (
        <div style={{ textAlign: "center", fontSize: 12, color: "#54e0b5", fontWeight: 600 }}>{t.tripPortalRequested}</div>
      ) : (
        <button
          onClick={handleWantFaster}
          style={{ width: "100%", padding: "7px", borderRadius: 9, background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)", fontSize: 11.5, fontFamily: "inherit", cursor: "pointer" }}
        >
          {t.tripPortalWantFaster}
        </button>
      )}
    </div>
  );
}

// ── Detail panel ──────────────────────────────────────────────────────────────

function DetailPanel({ lead, userId, onStatusChange, t }: { lead: Lead; userId: string | null; onStatusChange: (id: string, status: string) => void; t: typeof T["en"] }) {
  const initials = (lead.destination || "?").slice(0, 2).toUpperCase();
  const avatarColors = ["#c66a3d", "#1f5f8e", "#7c3aed", "#0d6e3f", "#b45309"];
  const avatarColor = avatarColors[Math.abs(lead.id.charCodeAt(0)) % avatarColors.length];
  const heat = lead.status === "booked" ? 5 : lead.status === "contacted" ? 3 : lead.status === "new" ? 2 : 1;
  const channelColor = lead.channel === "whatsapp" ? "#25d366" : "#0084ff";
  const statusLabel = t[`status${lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}` as keyof typeof t] as string || lead.status;

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
        <StatusPill status={lead.status} label={statusLabel} />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".5px" }}>{t.engagementCol}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: heat >= 4 ? "#54e0b5" : SAND, marginTop: 3 }}>{heat}/5 · {heat >= 4 ? t.heatHot : heat >= 3 ? t.heatWarm : t.heatCool}</div>
        </div>
        <div style={{ padding: "10px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".5px" }}>{t.channelCol}</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 3, color: channelColor }}>
            {lead.channel === "whatsapp" ? "WhatsApp" : "Messenger"}
          </div>
        </div>
      </div>

      {/* Activity */}
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12 }}>{t.activityTitle}</div>
      {[
        { title: t.actLeadCreated, sub: `${lead.channel === "whatsapp" ? "WhatsApp" : "Messenger"} CTA`, time: new Date(lead.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }), c: channelColor },
        { title: t.actViewedPricing, sub: t.actScrolledPricing, time: t.actDuringVisit, c: SAND },
        { title: t.actLandedOnPage, sub: `${lead.destination}`, time: t.actSessionStart, c: "#1f5f8e" },
      ].map((a, i) => (
        <div key={i} style={{ display: "flex", gap: 11, paddingBottom: 12, marginBottom: 12, borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.05)" : "none" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.c, marginTop: 6, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>{a.title}</div>
            <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", marginTop: 2, lineHeight: 1.4 }}>{a.sub}</div>
            <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>{a.time}</div>
          </div>
        </div>
      ))}

      {/* Session ref */}
      {lead.sessionId && (
        <div style={{ padding: "8px 12px", background: "rgba(255,255,255,0.03)", borderRadius: 8, marginBottom: 14, display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: ".5px" }}>{t.waRefLabel}</span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: "rgba(255,255,255,0.65)", fontFamily: "monospace" }}>{lead.sessionId.slice(0, 8)}</span>
          <span style={{ fontSize: 10.5, color: "rgba(255,255,255,0.3)", marginLeft: "auto" }}>{t.searchInWhatsApp}</span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
        <a
          href="https://web.whatsapp.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ flex: 1, minWidth: 110, padding: "10px", borderRadius: 9, background: "#25d366", color: "#fff", border: "none", fontSize: 12.5, fontWeight: 700, cursor: "pointer", textDecoration: "none", textAlign: "center", display: "block" }}
        >
          {t.openWhatsAppBtn}
        </a>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        {lead.status !== "contacted" && lead.status !== "booked" && (
          <button
            onClick={() => onStatusChange(lead.id, "contacted")}
            style={{ flex: 1, padding: "9px 12px", borderRadius: 9, background: "rgba(245,179,74,0.1)", border: "1px solid rgba(245,179,74,0.25)", color: "#f5b34a", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            {t.markContactedBtn}
          </button>
        )}
        {lead.status !== "booked" && (
          <button
            onClick={() => onStatusChange(lead.id, "booked")}
            style={{ flex: 1, padding: "9px 12px", borderRadius: 9, background: "rgba(84,224,181,0.1)", border: "1px solid rgba(84,224,181,0.25)", color: "#54e0b5", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            {t.markBookedBtn}
          </button>
        )}
        {lead.status !== "lost" && lead.status !== "booked" && (
          <button
            onClick={() => onStatusChange(lead.id, "lost")}
            style={{ flex: 1, padding: "9px 12px", borderRadius: 9, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            {t.markLostBtn}
          </button>
        )}
        {(lead.status === "booked" || lead.status === "lost") && (
          <button
            onClick={() => onStatusChange(lead.id, "new")}
            style={{ flex: 1, padding: "9px 12px", borderRadius: 9, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontSize: 12, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}
          >
            {t.reopenBtn}
          </button>
        )}
      </div>
      {lead.status === "booked" && <TripPortalTeaser userId={userId} leadId={lead.id} t={t} />}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
  const router = useRouter();
  const lang = useLang();
  const t = T[lang];

  const [authLoading, setAuthLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [selected, setSelected] = useState<Lead | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      setUserId(user.uid);
      const q = query(collection(db, "leads"), where("userId", "==", user.uid), orderBy("createdAt", "desc"));
      const snap = await getDocs(q);
      const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as Lead));
      setLeads(list);
      if (list.length > 0) setSelected(list[0]);
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  const exportCsv = () => {
    const rows = [
      ["Destination", "Price", "Channel", "Status", "Created At"],
      ...filtered.map(l => [
        l.destination,
        l.price,
        l.channel,
        l.status,
        new Date(l.createdAt).toISOString(),
      ]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${activeTab}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const updateStatus = async (id: string, status: string) => {
    await fetch("/api/update-lead-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId: id, status }),
    });
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    setSelected(prev => prev?.id === id ? { ...prev, status } : prev);
  };

  const statusLabel = (s: string) => {
    const map: Record<string, string> = {
      all: t.tabAll, new: t.tabNew, contacted: t.tabContacted, booked: t.tabBooked, lost: t.tabLost,
    };
    return map[s] || s;
  };

  const tabs = [
    { k: "all",       count: leads.length },
    { k: "new",       count: leads.filter(l => l.status === "new").length },
    { k: "contacted", count: leads.filter(l => l.status === "contacted").length },
    { k: "booked",    count: leads.filter(l => l.status === "booked").length },
    { k: "lost",      count: leads.filter(l => l.status === "lost").length },
  ];

  const filtered = activeTab === "all" ? leads : leads.filter(l => l.status === activeTab);

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
      <div dir={lang === "ar" ? "rtl" : "ltr"} style={{ padding: "28px 32px 60px", maxWidth: 1240 }}>

        {/* Page head */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 22 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.4px" }}>{t.leadsPageTitle}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
              {leads.length} {leads.length !== 1 ? t.activeConversations : t.activeConversation}
              {leads.length > 0 && ` · ${t.updatedJustNow}`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={exportCsv} style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)", fontSize: 12.5, fontFamily: "inherit", cursor: "pointer" }}>
              {t.exportCsv}
            </button>
          </div>
        </div>

        {/* Status tabs */}
        <div style={{ display: "flex", gap: 8, marginBottom: 20, borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
          {tabs.map(tab => (
            <button key={tab.k} onClick={() => setActiveTab(tab.k)} style={{
              padding: "10px 16px", border: "none", background: "none",
              color: activeTab === tab.k ? SAND : "rgba(255,255,255,0.5)",
              fontSize: 13, fontWeight: activeTab === tab.k ? 700 : 500,
              cursor: "pointer", fontFamily: "inherit",
              borderBottom: activeTab === tab.k ? `2px solid ${SAND}` : "2px solid transparent",
              marginBottom: -1, transition: "all .15s",
            }}>
              {statusLabel(tab.k)} <span style={{ marginLeft: 5, fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{tab.count}</span>
            </button>
          ))}
        </div>

        {leads.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 12 }}>
            <Icon name="users" size={40} color="rgba(255,255,255,0.08)" strokeWidth={1} />
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.3)" }}>{t.noLeadsYet}</p>
            <p style={{ fontSize: 12, maxWidth: 280, textAlign: "center", color: "rgba(255,255,255,0.25)" }}>
              {t.leadsAppearNote}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 18 }}>
            {/* Lead list */}
            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, overflow: "hidden" }}>
              {/* Column headers */}
              <div style={{ padding: "12px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", fontSize: 10.5, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".5px", gap: 14 }}>
                <div style={{ width: 38 }} />
                <div style={{ flex: 2 }}>{t.colLead}</div>
                <div style={{ flex: 1.4 }}>{t.colPackage}</div>
                <div style={{ width: 70 }}>{t.colHeat}</div>
                <div style={{ width: 80 }}>{t.colStatus}</div>
                <div style={{ width: 60, textAlign: lang === "ar" ? "left" : "right" }}>{t.colWhen}</div>
              </div>

              {filtered.length === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.3)" }}>
                  {statusLabel(activeTab)} — {t.noLeadsYet.toLowerCase()}
                </div>
              ) : filtered.map(lead => {
                const isSelected = selected?.id === lead.id;
                const initials = (lead.destination || "?").slice(0, 2).toUpperCase();
                const avatarColors = ["#c66a3d", "#1f5f8e", "#7c3aed", "#0d6e3f", "#b45309"];
                const avatarColor = avatarColors[Math.abs(lead.id.charCodeAt(0)) % avatarColors.length];
                const heat = lead.status === "booked" ? 5 : lead.status === "contacted" ? 3 : lead.status === "new" ? 2 : 1;
                const sLabel = t[`status${lead.status.charAt(0).toUpperCase() + lead.status.slice(1)}` as keyof typeof t] as string || lead.status;

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
                      borderLeft: lang === "ar" ? undefined : isSelected ? `2px solid ${SAND}` : "2px solid transparent",
                      borderRight: lang === "ar" ? isSelected ? `2px solid ${SAND}` : "2px solid transparent" : undefined,
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: "50%", flexShrink: 0, background: avatarColor, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff" }}>
                      {initials}
                    </div>
                    <div style={{ flex: 2, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.destination}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{t.viaChannel} {lead.channel === "whatsapp" ? "WhatsApp" : "Messenger"}</div>
                    </div>
                    <div style={{ flex: 1.4, fontSize: 12, color: "rgba(255,255,255,0.65)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {lead.price || lead.destination}
                    </div>
                    <div style={{ width: 70 }}>
                      <HeatDots level={heat} hot={t.heatHot} warm={t.heatWarm} cool={t.heatCool} />
                    </div>
                    <div style={{ width: 80 }}>
                      <StatusPill status={lead.status} label={sLabel} />
                    </div>
                    <div style={{ width: 60, textAlign: lang === "ar" ? "left" : "right", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
                      {new Date(lead.createdAt).toLocaleDateString(t.dateLocale, { day: "numeric", month: "short" })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Detail panel */}
            {selected ? (
              <DetailPanel lead={selected} userId={userId} onStatusChange={updateStatus} t={t} />
            ) : (
              <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <p style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>{t.selectLeadNote}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
