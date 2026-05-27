"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { addDoc, collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";
import Icon from "@/components/Icon";
import { useLang } from "@/hooks/useLang";
import { useIsMobile } from "@/hooks/useIsMobile";
import { T } from "@/lib/translations";
import posthog from "posthog-js";
import {
  DA_BG, DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2, DA_GOLD, DA_GOLD_SOFT, DA_GREEN, DA_GREEN_SOFT,
  DA_DANGER, DA_DANGER_SOFT,
} from "@/lib/tokens";

const DISPLAY = `var(--font-instrument-serif), Georgia, serif`;
const SANS = `var(--font-inter-tight), system-ui, sans-serif`;

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
            background: n <= level ? DA_GOLD : DA_RULE2,
          }} />
        ))}
      </div>
      <div style={{ fontSize: 10, color: DA_INK3, marginTop: 3 }}>{label}</div>
    </div>
  );
}

// ── Status pill ───────────────────────────────────────────────────────────────

function StatusPill({ status, label }: { status: string; label: string }) {
  const styles: Record<string, { bg: string; color: string; border?: string }> = {
    new:       { bg: DA_GOLD_SOFT, color: DA_GOLD },
    contacted: { bg: DA_SURFACE, color: DA_INK2, border: `1px solid ${DA_RULE2}` },
    booked:    { bg: DA_GREEN_SOFT, color: DA_GREEN },
    lost:      { bg: DA_SURFACE, color: DA_INK3 },
  };
  const m = styles[status] || styles.new;
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 99, fontSize: 10.5, fontWeight: 700,
      textTransform: "uppercase", letterSpacing: ".5px",
      background: m.bg, color: m.color,
      border: m.border || "none",
    }}>
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
    <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 12, background: DA_GOLD_SOFT, border: `1px dashed ${DA_RULE2}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10, marginBottom: 8 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: DA_GOLD, fontFamily: DISPLAY }}>{t.tripPortalTitle}</div>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: ".5px", textTransform: "uppercase",
          color: DA_GOLD, background: DA_SURFACE, border: `1px solid ${DA_RULE2}`,
          borderRadius: 99, padding: "2px 8px", flexShrink: 0,
        }}>
          {t.tripPortalComingSoon}
        </span>
      </div>
      <div style={{ fontSize: 12, color: DA_INK3, lineHeight: 1.55, marginBottom: 12 }}>
        {t.tripPortalDesc}
      </div>
      <button
        disabled
        style={{
          width: "100%", padding: "9px", borderRadius: 9,
          background: DA_SURFACE, border: `1px solid ${DA_RULE2}`,
          color: DA_INK3, fontSize: 12.5, fontWeight: 700,
          fontFamily: "inherit", cursor: "not-allowed", marginBottom: 8,
        }}
      >
        🔒 Generate Trip Portal
      </button>
      {requested ? (
        <div style={{ textAlign: "center", fontSize: 12, color: DA_GREEN, fontWeight: 600 }}>{t.tripPortalRequested}</div>
      ) : (
        <button
          onClick={handleWantFaster}
          style={{
            width: "100%", padding: "7px", borderRadius: 9,
            background: "none", border: `1px solid ${DA_RULE}`,
            color: DA_INK3, fontSize: 11.5, fontFamily: "inherit", cursor: "pointer",
          }}
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
    <div style={{
      background: DA_SURFACE, border: `1px solid ${DA_RULE}`,
      borderRadius: 14, padding: "20px 22px",
      position: "sticky", top: 16, alignSelf: "start",
    }}>
      {/* Header */}
      <div style={{ display: "flex", gap: 14, marginBottom: 18, alignItems: "center" }}>
        <div style={{
          width: 48, height: 48, borderRadius: "50%", flexShrink: 0,
          background: avatarColor, display: "flex", alignItems: "center",
          justifyContent: "center", fontSize: 16, fontWeight: 700, color: "#fff",
        }}>
          {initials}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: DA_INK1 }}>{lead.destination}</div>
          <div style={{ fontSize: 11.5, color: DA_INK3 }}>
            {lead.price} · {lead.channel === "whatsapp" ? "WhatsApp" : "Messenger"}
          </div>
        </div>
        <StatusPill status={lead.status} label={statusLabel} />
      </div>

      {/* Stats */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 18 }}>
        <div style={{ padding: "10px 12px", background: DA_BG, border: `1px solid ${DA_RULE}`, borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: DA_INK3, textTransform: "uppercase", letterSpacing: ".5px" }}>{t.engagementCol}</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: heat >= 4 ? DA_GREEN : DA_GOLD, marginTop: 3 }}>
            {heat}/5 · {heat >= 4 ? t.heatHot : heat >= 3 ? t.heatWarm : t.heatCool}
          </div>
        </div>
        <div style={{ padding: "10px 12px", background: DA_BG, border: `1px solid ${DA_RULE}`, borderRadius: 8 }}>
          <div style={{ fontSize: 10, color: DA_INK3, textTransform: "uppercase", letterSpacing: ".5px" }}>{t.channelCol}</div>
          <div style={{ fontSize: 14, fontWeight: 700, marginTop: 3, color: channelColor }}>
            {lead.channel === "whatsapp" ? "WhatsApp" : "Messenger"}
          </div>
        </div>
      </div>

      {/* Activity */}
      <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: DA_INK1 }}>{t.activityTitle}</div>
      {[
        { title: t.actLeadCreated, sub: `${lead.channel === "whatsapp" ? "WhatsApp" : "Messenger"} CTA`, time: new Date(lead.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }), c: channelColor },
        { title: t.actViewedPricing, sub: t.actScrolledPricing, time: t.actDuringVisit, c: DA_GOLD },
        { title: t.actLandedOnPage, sub: `${lead.destination}`, time: t.actSessionStart, c: "#1f5f8e" },
      ].map((a, i) => (
        <div key={i} style={{ display: "flex", gap: 11, paddingBottom: 12, marginBottom: 12, borderBottom: i < 2 ? `1px solid ${DA_RULE}` : "none" }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: a.c, marginTop: 6, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12.5, fontWeight: 600, color: DA_INK1 }}>{a.title}</div>
            <div style={{ fontSize: 11.5, color: DA_INK2, marginTop: 2, lineHeight: 1.4 }}>{a.sub}</div>
            <div style={{ fontSize: 10.5, color: DA_INK3, marginTop: 3 }}>{a.time}</div>
          </div>
        </div>
      ))}

      {/* Session ref */}
      {lead.sessionId && (
        <div style={{
          padding: "8px 12px", background: DA_BG, border: `1px solid ${DA_RULE}`,
          borderRadius: 8, marginBottom: 14, display: "flex", alignItems: "center", gap: 8,
        }}>
          <span style={{ fontSize: 10, color: DA_INK3, textTransform: "uppercase", letterSpacing: ".5px" }}>{t.waRefLabel}</span>
          <span style={{ fontSize: 11.5, fontWeight: 600, color: DA_INK2, fontFamily: "monospace" }}>{lead.sessionId.slice(0, 8)}</span>
          <span style={{ fontSize: 10.5, color: DA_INK3, marginLeft: "auto" }}>{t.searchInWhatsApp}</span>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: "flex", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
        <a
          href="https://web.whatsapp.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            flex: 1, minWidth: 110, padding: "10px", borderRadius: 9,
            background: "#25d366", color: "#fff", border: "none",
            fontSize: 12.5, fontWeight: 700, cursor: "pointer",
            textDecoration: "none", textAlign: "center", display: "block",
          }}
        >
          {t.openWhatsAppBtn}
        </a>
      </div>
      <div style={{ display: "flex", gap: 8, marginTop: 8, flexWrap: "wrap" }}>
        {lead.status !== "contacted" && lead.status !== "booked" && (
          <button
            onClick={() => onStatusChange(lead.id, "contacted")}
            style={{
              flex: 1, padding: "9px 12px", borderRadius: 9,
              background: DA_GOLD_SOFT, border: `1px solid ${DA_GOLD}`,
              color: DA_GOLD, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {t.markContactedBtn}
          </button>
        )}
        {lead.status !== "booked" && (
          <button
            onClick={() => onStatusChange(lead.id, "booked")}
            style={{
              flex: 1, padding: "9px 12px", borderRadius: 9,
              background: DA_GREEN_SOFT, border: `1px solid ${DA_GREEN}`,
              color: DA_GREEN, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {t.markBookedBtn}
          </button>
        )}
        {lead.status !== "lost" && lead.status !== "booked" && (
          <button
            onClick={() => onStatusChange(lead.id, "lost")}
            style={{
              flex: 1, padding: "9px 12px", borderRadius: 9,
              background: DA_SURFACE, border: `1px solid ${DA_RULE2}`,
              color: DA_INK3, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}
          >
            {t.markLostBtn}
          </button>
        )}
        {(lead.status === "booked" || lead.status === "lost") && (
          <button
            onClick={() => onStatusChange(lead.id, "new")}
            style={{
              flex: 1, padding: "9px 12px", borderRadius: 9,
              background: DA_SURFACE, border: `1px solid ${DA_RULE2}`,
              color: DA_INK3, fontSize: 12, fontWeight: 600,
              cursor: "pointer", fontFamily: "inherit",
            }}
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
  const isMobile = useIsMobile();
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

      // Fetch packages and leads in parallel; only keep leads for existing packages
      const [pkgSnap, leadsSnap] = await Promise.all([
        getDocs(query(collection(db, "packages"), where("userId", "==", user.uid))),
        getDocs(query(collection(db, "leads"), where("userId", "==", user.uid), orderBy("createdAt", "desc"))),
      ]);

      const activePackageIds = new Set(pkgSnap.docs.map(d => d.id));
      const list = leadsSnap.docs
        .map(d => ({ id: d.id, ...d.data() } as Lead))
        .filter(l => activePackageIds.has(l.packageId));

      setLeads(list);
      if (list.length > 0) setSelected(list[0]);
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  const exportCsv = () => {
    posthog.capture("leads_exported", { filter: activeTab, count: filtered.length });
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
    const lead = leads.find(l => l.id === id);
    posthog.capture("lead_status_updated", { new_status: status, previous_status: lead?.status, channel: lead?.channel });
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
          <span className="spinner-warm" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div dir={lang === "ar" ? "rtl" : "ltr"} style={{ padding: isMobile ? "16px 16px 40px" : "28px 32px 60px", maxWidth: 1240 }}>

        {/* Page head */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: 22, flexWrap: "wrap", gap: 12,
        }}>
          <div>
            <div style={{ fontSize: isMobile ? 24 : 26, fontWeight: 400, color: DA_INK1, fontFamily: DISPLAY }}>{t.leadsPageTitle}</div>
            <div style={{ fontSize: 13, color: DA_INK3, marginTop: 4, fontFamily: SANS }}>
              {leads.length} {leads.length !== 1 ? t.activeConversations : t.activeConversation}
              {leads.length > 0 && ` · ${t.updatedJustNow}`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={exportCsv}
              style={{
                padding: "7px 12px", borderRadius: 8,
                background: DA_SURFACE, border: `1px solid ${DA_RULE2}`,
                color: DA_INK2, fontSize: 12.5, fontFamily: "inherit", cursor: "pointer",
              }}
            >
              {t.exportCsv}
            </button>
          </div>
        </div>

        {/* Status tabs */}
        <div style={{
          display: "flex", gap: isMobile ? 4 : 8, marginBottom: 20,
          borderBottom: `1px solid ${DA_RULE}`,
          overflowX: isMobile ? "auto" : undefined,
          scrollbarWidth: "none",
        }}>
          {tabs.map(tab => (
            <button
              key={tab.k}
              onClick={() => setActiveTab(tab.k)}
              style={{
                padding: isMobile ? "8px 12px" : "10px 16px",
                border: "none", background: "none",
                color: activeTab === tab.k ? DA_GOLD : DA_INK3,
                fontSize: isMobile ? 12 : 13,
                fontWeight: activeTab === tab.k ? 600 : 500,
                cursor: "pointer", fontFamily: "inherit",
                borderBottom: activeTab === tab.k ? `2px solid ${DA_GOLD}` : "2px solid transparent",
                marginBottom: -1, transition: "all .15s",
                flexShrink: 0,
                whiteSpace: "nowrap",
              }}
            >
              {statusLabel(tab.k)}{" "}
              <span style={{ marginLeft: 4, fontSize: 10.5, color: DA_INK3 }}>{tab.count}</span>
            </button>
          ))}
        </div>

        {leads.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 0", gap: 12 }}>
            <Icon name="users" size={32} color={DA_RULE2} strokeWidth={1.5} />
            <p style={{ fontSize: 14, color: DA_INK3 }}>{t.noLeadsYet}</p>
            <p style={{ fontSize: 12, maxWidth: 280, textAlign: "center", color: DA_INK3 }}>
              {t.leadsAppearNote}
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1fr", gap: 18 }}>
            {/* Lead list */}
            <div style={{
              background: DA_SURFACE, border: `1px solid ${DA_RULE}`,
              borderRadius: 14, overflow: "hidden",
            }}>
              {/* Column headers */}
              <div style={{
                padding: isMobile ? "10px 14px" : "12px 20px",
                borderBottom: `1px solid ${DA_RULE}`,
                display: "flex", fontSize: 10.5, fontWeight: 700,
                color: DA_INK3, textTransform: "uppercase", letterSpacing: ".5px",
                gap: isMobile ? 10 : 14,
                background: DA_BG,
              }}>
                <div style={{ width: isMobile ? 32 : 38 }} />
                <div style={{ flex: 2 }}>{t.colLead}</div>
                {!isMobile && <div style={{ flex: 1.4 }}>{t.colPackage}</div>}
                {!isMobile && <div style={{ width: 70 }}>{t.colHeat}</div>}
                <div style={{ width: isMobile ? 72 : 80 }}>{t.colStatus}</div>
                {!isMobile && <div style={{ width: 60, textAlign: lang === "ar" ? "left" : "right" }}>{t.colWhen}</div>}
              </div>

              {filtered.length === 0 ? (
                <div style={{ padding: "32px 0", textAlign: "center", fontSize: 13, color: DA_INK3 }}>
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
                      display: "flex", alignItems: "center",
                      gap: isMobile ? 10 : 14,
                      padding: isMobile ? "12px 14px" : "14px 20px",
                      borderBottom: `1px solid ${DA_RULE}`,
                      cursor: "pointer",
                      background: isSelected ? DA_GOLD_SOFT : "transparent",
                      transition: "background .15s",
                      borderLeft: lang === "ar" ? undefined : isSelected ? `2px solid ${DA_GOLD}` : "2px solid transparent",
                      borderRight: lang === "ar" ? isSelected ? `2px solid ${DA_GOLD}` : "2px solid transparent" : undefined,
                    }}
                    onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = DA_BG; }}
                    onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                  >
                    <div style={{
                      width: isMobile ? 32 : 38, height: isMobile ? 32 : 38,
                      borderRadius: "50%", flexShrink: 0,
                      background: avatarColor, display: "flex", alignItems: "center",
                      justifyContent: "center", fontSize: isMobile ? 11 : 13, fontWeight: 700, color: "#fff",
                    }}>
                      {initials}
                    </div>
                    <div style={{ flex: 2, minWidth: 0 }}>
                      <div style={{ fontSize: isMobile ? 13 : 13.5, fontWeight: 600, color: DA_INK1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{lead.destination}</div>
                      <div style={{ fontSize: 11, color: DA_INK3 }}>{t.viaChannel} {lead.channel === "whatsapp" ? "WhatsApp" : "Messenger"}</div>
                    </div>
                    {!isMobile && (
                      <div style={{ flex: 1.4, fontSize: 12, color: DA_INK2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {lead.price || lead.destination}
                      </div>
                    )}
                    {!isMobile && (
                      <div style={{ width: 70 }}>
                        <HeatDots level={heat} hot={t.heatHot} warm={t.heatWarm} cool={t.heatCool} />
                      </div>
                    )}
                    <div style={{ width: isMobile ? 72 : 80 }}>
                      <StatusPill status={lead.status} label={sLabel} />
                    </div>
                    {!isMobile && (
                      <div style={{ width: 60, textAlign: lang === "ar" ? "left" : "right", fontSize: 11, color: DA_INK3 }}>
                        {new Date(lead.createdAt).toLocaleDateString(t.dateLocale, { day: "numeric", month: "short" })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Detail panel */}
            {selected ? (
              <DetailPanel lead={selected} userId={userId} onStatusChange={updateStatus} t={t} />
            ) : (
              <div style={{
                background: DA_SURFACE, border: `1px solid ${DA_RULE}`,
                borderRadius: 14, padding: "20px 22px",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <p style={{ fontSize: 13, color: DA_INK3 }}>{t.selectLeadNote}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
