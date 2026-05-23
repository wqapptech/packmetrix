"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";
import Icon from "@/components/Icon";
import { useLang } from "@/hooks/useLang";
import { useIsMobile } from "@/hooks/useIsMobile";
import { T } from "@/lib/translations";
import { DEFAULT_TEMPLATE_ID } from "@/components/templates/index";
import { canUseCustomDomain } from "@/lib/limits";

type DomainRecord = { type: string; name: string; value: string };
type DomainStatus = "pending_dns" | "verifying" | "ssl_provisioning" | "active" | "failed" | "";

function isApexDomain(hostname: string): boolean {
  return hostname.split(".").length === 2;
}

const SAND = "#e8c97b";
const SUCCESS = "#2dd4a0";


// ─── Shared field components ─────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", textTransform: "uppercase" as const, letterSpacing: ".5px", marginBottom: 8, marginTop: 18 }}>
      {children}
    </div>
  );
}

function Input({ value, onChange, placeholder, style }: { value: string; onChange: (v: string) => void; placeholder?: string; style?: React.CSSProperties }) {
  return (
    <input
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: "100%", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 10, padding: "10px 14px", color: "#fdfcf9", fontSize: 13,
        fontFamily: "inherit", outline: "none", transition: "border-color .15s", ...style,
      }}
      onFocus={e => (e.target.style.borderColor = `${SAND}60`)}
      onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
    />
  );
}

function Toggle({ enabled, onChange, label, sub }: { enabled: boolean; onChange: (v: boolean) => void; label: string; sub?: string }) {
  return (
    <div
      onClick={() => onChange(!enabled)}
      style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", padding: "12px 0" }}
    >
      <div style={{
        width: 40, height: 22, borderRadius: 11, flexShrink: 0,
        background: enabled ? SUCCESS : "rgba(255,255,255,0.12)",
        transition: "background 0.2s", position: "relative",
      }}>
        <div style={{
          position: "absolute", top: 3, left: enabled ? 21 : 3,
          width: 16, height: 16, borderRadius: "50%", background: "#fff",
          transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
        }} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: "#fdfcf9" }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}


// ─── Main page ────────────────────────────────────────────────────────────────

export default function BrandingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lang = useLang();
  const isMobile = useIsMobile();
  const t = T[lang];

  const [uid, setUid] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [enableReviews, setEnableReviews] = useState(false);
  const [showReviews, setShowReviews] = useState(true);

  const [activeTemplate, setActiveTemplate] = useState(DEFAULT_TEMPLATE_ID);

  const [plan, setPlan] = useState<string>("");
  const [agencySlug, setAgencySlug] = useState<string>("");
  const [customDomain, setCustomDomain] = useState<string>("");
  const [domainInput, setDomainInput] = useState<string>("");
  const [domainCfId, setDomainCfId] = useState<string>("");
  const [domainSaving, setDomainSaving] = useState(false);
  const [domainSaved, setDomainSaved] = useState(false);
  const [domainRemoving, setDomainRemoving] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [domainStatus, setDomainStatus] = useState<DomainStatus>("");
  const [cnameRecord, setCnameRecord] = useState<DomainRecord | null>(null);
  const [verificationRecords, setVerificationRecords] = useState<DomainRecord[]>([]);
  const [sslRecords, setSslRecords] = useState<DomainRecord[]>([]);
  const [apexGuidance, setApexGuidance] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUid(u.uid);
      const snap = await getDoc(doc(db, "users", u.uid));
      if (snap.exists()) {
        const d = snap.data();
        setName(d.name || "");
        setTagline(d.tagline || "");
        setEmail(d.email || "");
        setPhone(d.phone || "");
        setLogoUrl(d.logoUrl || "");
        if (d.activeTemplate) setActiveTemplate(d.activeTemplate);
        setEnableReviews(d.enableReviews === true);
        setShowReviews(d.showReviews !== false); // default true
        setPlan(d.plan || "");
        setAgencySlug(d.agencySlug || d.name || "");
        const savedDomain = d.customDomain || "";
        setCustomDomain(savedDomain);
        setDomainInput(savedDomain);
        setDomainCfId(d.customDomainCfId || "");
        setDomainStatus((d.customDomainStatus as DomainStatus) || "");
        setVerificationRecords(d.customDomainVerificationRecords || []);
        setSslRecords(d.customDomainSslRecords || []);
        if (savedDomain && !isApexDomain(savedDomain)) setCnameRecord({ type: "CNAME", name: savedDomain, value: "cname.packmetrix.com" });
      }

      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uid) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("uid", uid);
      fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Upload failed");
      setLogoUrl(json.urls[0]);
    } catch {
      setUploadError("Upload failed. Try again.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleSave = async () => {
    if (!uid) return;
    setSaving(true);
    await updateDoc(doc(db, "users", uid), { name, tagline, email, phone, logoUrl, activeTemplate, enableReviews, showReviews });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleSaveDomain = async () => {
    if (!auth.currentUser) return;
    setDomainSaving(true);
    setDomainError(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/domains", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ hostname: domainInput }),
      });
      const json = await res.json();
      if (!res.ok) { setDomainError(json.error || t.customDomainError); return; }
      setCustomDomain(json.hostname);
      setDomainInput(json.hostname);
      setDomainCfId(json.cf_hostname_id);
      setDomainStatus(json.status);
      setCnameRecord(json.cname_record ?? null);
      setVerificationRecords(json.verification_records ?? []);
      setSslRecords(json.ssl_records ?? []);
      setApexGuidance(json.apex_guidance ?? null);
      setDomainSaved(true);
      setTimeout(() => setDomainSaved(false), 2500);
    } catch {
      setDomainError(t.customDomainError);
    } finally {
      setDomainSaving(false);
    }
  };

  const handleRefreshStatus = async () => {
    if (!domainCfId || !auth.currentUser) return;
    setRefreshing(true);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/domains/${domainCfId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setDomainStatus(data.status);
      setVerificationRecords(data.verification_records ?? []);
      setSslRecords(data.ssl_records ?? []);
      if (data.error_message) setDomainError(data.error_message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCopyRecord = (name: string, value: string) => {
    navigator.clipboard.writeText(value).then(() => {
      setCopiedKey(name);
      setTimeout(() => setCopiedKey(null), 2000);
    });
  };

  const handleRemoveDomain = async () => {
    if (!domainCfId || !auth.currentUser) return;
    setDomainRemoving(true);
    setDomainError(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/domains/${domainCfId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const json = await res.json();
        setDomainError(json.error || t.customDomainRemoveError);
        return;
      }
      setCustomDomain(""); setDomainInput(""); setDomainCfId(""); setDomainStatus("");
      setCnameRecord(null); setVerificationRecords([]); setSslRecords([]); setApexGuidance(null);
    } catch {
      setDomainError(t.customDomainRemoveError);
    } finally {
      setDomainRemoving(false);
    }
  };

  const handleResetDomain = async () => {
    if (!auth.currentUser) return;
    setDomainRemoving(true);
    try {
      if (domainCfId) {
        const token = await auth.currentUser.getIdToken();
        await fetch(`/api/domains/${domainCfId}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    } finally {
      setCustomDomain(""); setDomainInput(""); setDomainCfId(""); setDomainStatus("");
      setCnameRecord(null); setVerificationRecords([]); setSslRecords([]); setApexGuidance(null); setDomainError(null);
      setDomainRemoving(false);
    }
  };

  // Auto-refresh every 30 s while the domain is in a pending state.
  useEffect(() => {
    const POLLING = ["pending_dns", "verifying", "ssl_provisioning"];
    if (!domainCfId || !POLLING.includes(domainStatus)) return;
    const id = setInterval(async () => {
      if (!auth.currentUser) return;
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/domains/${domainCfId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setDomainStatus(data.status);
      setVerificationRecords(data.verification_records ?? []);
      setSslRecords(data.ssl_records ?? []);
      if (data.error_message) setDomainError(data.error_message);
    }, 30_000);
    return () => clearInterval(id);
  }, [domainStatus, domainCfId]);

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
      {/*
        Desktop: the outer div fills the AppLayout scroll area (height: 100%) and uses
        a flex-column layout so the grid below can grow to fill remaining space.
        Mobile: normal document flow with padding — no height constraint.
      */}
      <div
        dir={lang === "ar" ? "rtl" : "ltr"}
        style={isMobile ? {
          padding: "16px 16px 40px",
        } : {
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          padding: "28px 32px 28px",
          boxSizing: "border-box",
          maxWidth: 1400,
        }}
      >
        {/* Page head */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: isMobile ? 24 : 20,
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.4px" }}>{t.brandingTitle}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>{t.brandingSubtitle}</div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              padding: "9px 20px", borderRadius: 9, fontSize: 13, fontWeight: 700,
              background: saved ? "rgba(45,212,160,0.15)" : `linear-gradient(135deg, ${SAND}, #c4a84f)`,
              border: saved ? `1px solid ${SUCCESS}` : "none",
              color: saved ? SUCCESS : "#0d1b2e",
              fontFamily: "inherit", cursor: saving ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8, transition: "all .2s",
            }}
          >
            {saving
              ? <><span className="spinner" style={{ width: 13, height: 13, borderTopColor: "#0d1b2e" }} /> {t.savingBtn}</>
              : saved
              ? <><Icon name="check" size={13} color={SUCCESS} strokeWidth={2.5} /> {t.savedBtn}</>
              : t.saveChangesBtn
            }
          </button>
        </div>

        <div style={isMobile ? {
          display: "flex", flexDirection: "column", gap: 16,
        } : {
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: 16,
          maxWidth: 560,
        }}>

            {/* Agency profile */}
            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 18 }}>{t.agencyProfileLabel}</div>

              {/* Logo upload */}
              <div style={{ display: "flex", gap: 14, marginBottom: 18, alignItems: "center" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 14, flexShrink: 0,
                  background: logoUrl ? "transparent" : "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", color: "#fff", fontSize: 22, fontWeight: 800,
                }}>
                  {logoUrl
                    ? <img src={logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    : (name ? name.slice(0, 2).toUpperCase() : "AG")
                  }
                </div>
                <div>
                  <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleLogoUpload} />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.7)", fontSize: 11.5, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                  >
                    {uploading ? t.uploadingBtn : t.uploadLogoBtn}
                  </button>
                  {uploadError && <div style={{ fontSize: 11, color: "#ef9090", marginTop: 5 }}>{uploadError}</div>}
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>{t.logoRecommendedNote}</div>
                  {logoUrl && (
                    <button onClick={() => setLogoUrl("")} style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", padding: 0, marginTop: 4 }}>{t.removeLogoBtn}</button>
                  )}
                </div>
              </div>

              <FieldLabel>{t.agencyNameLabel}</FieldLabel>
              <Input value={name} onChange={setName} placeholder="e.g. Aegean Travel" />

              <FieldLabel>{t.taglineLabel}</FieldLabel>
              <Input value={tagline} onChange={setTagline} placeholder="Curated Mediterranean journeys · est. 2014" />

              <FieldLabel>{t.contactLabel}</FieldLabel>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                <Input value={email} onChange={setEmail} placeholder="hello@agency.com" />
                <Input value={phone} onChange={setPhone} placeholder="+1 555 000 1234" />
              </div>
            </div>

            {/* Reviews settings */}
            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t.reviewsSettingsTitle}</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>
                Ratings & reviews from visitors on your landing pages
              </div>
              <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                <Toggle
                  enabled={enableReviews}
                  onChange={setEnableReviews}
                  label={t.enableReviewsLabel}
                  sub={t.enableReviewsSub}
                />
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
                  <Toggle
                    enabled={showReviews}
                    onChange={setShowReviews}
                    label={t.showReviewsLabel}
                    sub={t.showReviewsSub}
                  />
                </div>
              </div>
            </div>

            {/* Custom domain */}
            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 4 }}>{t.customDomainSectionTitle}</div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", marginBottom: 14 }}>{t.customDomainSectionSub}</div>

              {!canUseCustomDomain(plan) ? (
                /* ── Upgrade gate ── */
                <div style={{ borderRadius: 10, background: "rgba(232,201,123,0.06)", border: "1px solid rgba(232,201,123,0.18)", padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Icon name="lock" size={14} color={SAND} />
                    <div style={{ fontSize: 12.5, fontWeight: 700, color: SAND }}>{t.customDomainUpgradeTitle}</div>
                  </div>
                  <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>{t.customDomainUpgradeSub}</div>
                  <a href="/paywall" style={{ display: "inline-block", padding: "8px 16px", borderRadius: 8, background: `linear-gradient(135deg, ${SAND}, #c4a84f)`, color: "#0d1b2e", fontSize: 12, fontWeight: 700, textDecoration: "none" }}>
                    {t.customDomainUpgradeBtn}
                  </a>
                </div>
              ) : customDomain ? (() => {
                /* ── Domain is registered — render state-specific UI ── */
                const allRecords = ([cnameRecord, ...verificationRecords, ...sslRecords] as (DomainRecord | null)[]).filter(Boolean) as DomainRecord[];

                /* ── Active ── */
                if (domainStatus === "active") return (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "rgba(45,212,160,0.07)", border: "1px solid rgba(45,212,160,0.2)", marginBottom: 12 }}>
                      <Icon name="check" size={13} color={SUCCESS} strokeWidth={2.5} />
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: SUCCESS, textTransform: "uppercase" as const, letterSpacing: ".5px" }}>Active</div>
                        <div style={{ fontSize: 12, fontFamily: "monospace", color: "rgba(255,255,255,0.6)", marginTop: 1 }}>{customDomain}</div>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                      <a
                        href={`https://${customDomain}`} target="_blank" rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, background: `linear-gradient(135deg, ${SAND}, #c4a84f)`, color: "#0d1b2e", fontSize: 12, fontWeight: 700, textDecoration: "none" }}
                      >
                        <Icon name="globe" size={13} color="#0d1b2e" /> Visit site
                      </a>
                      <button
                        onClick={() => setConfirmRemoveOpen(true)} disabled={domainRemoving}
                        style={{ padding: "8px 14px", borderRadius: 9, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#ef9090", fontSize: 12, fontWeight: 600, cursor: domainRemoving ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                      >
                        {t.customDomainRemoveBtn}
                      </button>
                    </div>
                    {domainError && <div style={{ fontSize: 11.5, color: "#ef9090", marginTop: 8 }}>{domainError}</div>}
                  </div>
                );

                /* ── Failed ── */
                if (domainStatus === "failed") return (
                  <div>
                    <div style={{ padding: "12px 14px", borderRadius: 10, background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)", marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#f87171", textTransform: "uppercase" as const, letterSpacing: ".5px", marginBottom: 4 }}>Verification failed</div>
                      <div style={{ fontSize: 12, fontFamily: "monospace", color: "rgba(255,255,255,0.5)", marginBottom: 6 }}>{customDomain}</div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                        {domainError || "DNS records were not found within 48 hours. Please check your registrar settings and try again."}
                      </div>
                    </div>
                    <button
                      onClick={() => setConfirmRemoveOpen(true)} disabled={domainRemoving}
                      style={{ padding: "8px 14px", borderRadius: 9, background: `linear-gradient(135deg, ${SAND}, #c4a84f)`, border: "none", color: "#0d1b2e", fontSize: 12, fontWeight: 700, cursor: domainRemoving ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                    >
                      Try a different domain
                    </button>
                  </div>
                );

                /* ── Pending DNS / Verifying / SSL provisioning ── */
                const isApex = isApexDomain(customDomain);
                const statusMeta = {
                  pending_dns:      { color: "#f59e0b", bg: "rgba(245,158,11,0.07)",  border: "rgba(245,158,11,0.2)",  label: "Waiting for DNS",        desc: isApex ? "Follow the apex domain guidance below at your registrar, then wait a few minutes." : "Add the CNAME record below at your registrar, then wait a few minutes." },
                  verifying:        { color: "#a78bfa", bg: "rgba(167,139,250,0.07)", border: "rgba(167,139,250,0.2)", label: "Verifying",              desc: "Cloudflare detected your DNS record and is verifying it. HTTPS may take a few minutes to become active once verification completes." },
                  ssl_provisioning: { color: "#60a5fa", bg: "rgba(96,165,250,0.07)",  border: "rgba(96,165,250,0.2)",  label: "Issuing SSL certificate", desc: "DNS is verified. Your SSL certificate is being issued — HTTPS will become active within a few minutes." },
                };
                const meta = statusMeta[domainStatus as keyof typeof statusMeta] ?? statusMeta.pending_dns;
                return (
                  <div>
                    {/* Status badge */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, padding: "10px 14px", borderRadius: 10, background: meta.bg, border: `1px solid ${meta.border}`, marginBottom: 12 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="spinner" style={{ width: 10, height: 10, borderTopColor: meta.color, flexShrink: 0 }} />
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: meta.color, textTransform: "uppercase" as const, letterSpacing: ".5px" }}>{meta.label}</div>
                          <div style={{ fontSize: 12, fontFamily: "monospace", color: "rgba(255,255,255,0.5)", marginTop: 1 }}>{customDomain}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", flexShrink: 0 }}>Auto-refreshing every 30s</div>
                    </div>
                    <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginBottom: 12, lineHeight: 1.5 }}>{meta.desc}</div>

                    {/* Apex domain guidance */}
                    {isApex && (apexGuidance || domainStatus === "pending_dns") && (
                      <div style={{ marginBottom: 14, padding: "12px 14px", borderRadius: 9, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.18)" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "#f59e0b", textTransform: "uppercase" as const, letterSpacing: ".5px", marginBottom: 6 }}>Apex domain — special DNS required</div>
                        <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                          {apexGuidance || `${customDomain} is a root/apex domain. A plain CNAME is not valid at an apex per the DNS spec. Your DNS provider must support CNAME flattening (ALIAS records), or you must add A records pointing to Cloudflare's IP addresses. Check your registrar's documentation or contact support@packmetrix.com for help.`}
                        </div>
                      </div>
                    )}

                    {/* DNS records table */}
                    {allRecords.length > 0 && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" as const, letterSpacing: ".5px", marginBottom: 8 }}>
                          {t.customDomainRecordsTitle}
                        </div>
                        <div style={{ borderRadius: 8, overflow: "hidden", border: "1px solid rgba(255,255,255,0.07)" }}>
                          <div style={{ display: "grid", gridTemplateColumns: "55px 1fr 1fr auto", background: "rgba(255,255,255,0.04)", padding: "6px 10px", gap: 8 }}>
                            {[t.customDomainRecordType, t.customDomainRecordName, t.customDomainRecordValue, ""].map((h, i) => (
                              <div key={i} style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,0.3)", textTransform: "uppercase" as const, letterSpacing: ".5px" }}>{h}</div>
                            ))}
                          </div>
                          {allRecords.map((rec, idx) => (
                            <div key={`${rec.type}:${rec.name}:${idx}`} style={{ display: "grid", gridTemplateColumns: "55px 1fr 1fr auto", padding: "8px 10px", gap: 8, alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.05)", background: idx % 2 === 0 ? "transparent" : "rgba(255,255,255,0.015)" }}>
                              <div style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: meta.color }}>{rec.type}</div>
                              <div style={{ fontFamily: "monospace", fontSize: 11, color: "rgba(255,255,255,0.7)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{rec.name}</div>
                              <div style={{ fontFamily: "monospace", fontSize: 10.5, color: "rgba(255,255,255,0.55)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" as const }}>{rec.value}</div>
                              <button
                                onClick={() => { const k = `${rec.type}:${rec.name}:${idx}`; handleCopyRecord(k, rec.value); }}
                                style={{ padding: "3px 9px", borderRadius: 5, background: copiedKey === `${rec.type}:${rec.name}:${idx}` ? "rgba(45,212,160,0.12)" : "rgba(255,255,255,0.06)", border: `1px solid ${copiedKey === `${rec.type}:${rec.name}:${idx}` ? "rgba(45,212,160,0.3)" : "rgba(255,255,255,0.1)"}`, color: copiedKey === `${rec.type}:${rec.name}:${idx}` ? SUCCESS : "rgba(255,255,255,0.5)", fontSize: 10.5, fontWeight: 600, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" as const, transition: "all .15s" }}
                              >
                                {copiedKey === `${rec.type}:${rec.name}:${idx}` ? t.customDomainCopiedBtn : t.customDomainCopyBtn}
                              </button>
                            </div>
                          ))}
                        </div>
                        <div style={{ marginTop: 8, fontSize: 11, color: "rgba(255,255,255,0.3)" }}>
                          Need help? Check your registrar&apos;s documentation for adding DNS records.
                        </div>
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={handleRefreshStatus} disabled={refreshing}
                        style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)", fontSize: 11, fontWeight: 600, cursor: refreshing ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                      >
                        {refreshing ? t.customDomainRefreshingBtn : t.customDomainRefreshBtn}
                      </button>
                      <button
                        onClick={() => setConfirmRemoveOpen(true)} disabled={domainRemoving}
                        style={{ padding: "7px 12px", borderRadius: 8, background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.18)", color: "#ef9090", fontSize: 11, fontWeight: 600, cursor: domainRemoving ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                      >
                        {t.customDomainRemoveBtn}
                      </button>
                    </div>
                    {domainError && <div style={{ fontSize: 11.5, color: "#ef9090", marginTop: 8 }}>{domainError}</div>}
                  </div>
                );
              })() : (
                /* ── No domain yet ── */
                <div>
                  {agencySlug && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" as const, letterSpacing: ".5px", marginBottom: 5 }}>
                        {t.customDomainCurrentUrl}
                      </div>
                      <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontFamily: "monospace", background: "rgba(255,255,255,0.04)", borderRadius: 7, padding: "6px 10px" }}>
                        packmetrix.com/{encodeURIComponent(agencySlug)}
                      </div>
                    </div>
                  )}
                  <FieldLabel>{t.customDomainLabel}</FieldLabel>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={domainInput}
                      onChange={e => { setDomainInput(e.target.value); setDomainError(null); }}
                      placeholder={t.customDomainPlaceholder}
                      style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "10px 14px", color: "#fdfcf9", fontSize: 13, fontFamily: "monospace", outline: "none" }}
                      onFocus={e => (e.target.style.borderColor = `${SAND}60`)}
                      onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
                    />
                    <button
                      onClick={handleSaveDomain}
                      disabled={domainSaving || !domainInput.trim()}
                      style={{
                        padding: "10px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 700,
                        background: domainSaved ? "rgba(45,212,160,0.15)" : `linear-gradient(135deg, ${SAND}, #c4a84f)`,
                        border: domainSaved ? `1px solid ${SUCCESS}` : "none",
                        color: domainSaved ? SUCCESS : "#0d1b2e",
                        fontFamily: "inherit", cursor: (domainSaving || !domainInput.trim()) ? "not-allowed" : "pointer",
                        opacity: !domainInput.trim() ? 0.5 : 1, flexShrink: 0, whiteSpace: "nowrap" as const,
                      }}
                    >
                      {domainSaving ? t.customDomainSavingBtn : domainSaved ? <><Icon name="check" size={12} color={SUCCESS} strokeWidth={2.5} /> {t.customDomainSavedBtn}</> : t.customDomainSaveBtn}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 6 }}>{t.customDomainSubdomainHint}</div>
                  {domainError && <div style={{ fontSize: 11.5, color: "#ef9090", marginTop: 8 }}>{domainError}</div>}
                  <div style={{ marginTop: 16, padding: "14px 16px", borderRadius: 10, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <div style={{ fontSize: 11.5, fontWeight: 700, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="link" size={13} color="rgba(255,255,255,0.4)" />
                      {t.customDomainDnsTitle}
                    </div>
                    <ol style={{ margin: 0, paddingLeft: lang === "ar" ? 0 : 16, paddingRight: lang === "ar" ? 16 : 0, listStyle: "decimal", display: "flex", flexDirection: "column" as const, gap: 6 }}>
                      <li style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)" }}>{t.customDomainDnsStep1}</li>
                      <li style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)" }}>{t.customDomainDnsStep2}</li>
                      <li style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)" }}>{t.customDomainDnsStep3}</li>
                      <li style={{ fontSize: 11.5, color: "rgba(255,255,255,0.5)" }}>{t.customDomainDnsStep4}</li>
                    </ol>
                    <div style={{ marginTop: 10, fontSize: 11, color: "rgba(255,255,255,0.35)" }}>{t.customDomainDnsNote}</div>
                  </div>
                </div>
              )}
            </div>

        </div>
      </div>
      {/* ── Remove domain confirmation modal ── */}
      {confirmRemoveOpen && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 300, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
          onClick={e => { if (e.target === e.currentTarget && !domainRemoving) setConfirmRemoveOpen(false); }}
        >
          <div style={{ width: "100%", maxWidth: 420, background: "#111c2d", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 16, overflow: "hidden" }}>
            {/* Header */}
            <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fdfcf9" }}>
                  {domainStatus === "failed" ? "Remove & try a different domain" : "Remove custom domain"}
                </div>
                <div style={{ fontSize: 12, fontFamily: "monospace", color: "rgba(255,255,255,0.4)", marginTop: 3 }}>{customDomain}</div>
              </div>
              <button
                onClick={() => setConfirmRemoveOpen(false)} disabled={domainRemoving}
                style={{ background: "none", border: "none", color: "rgba(255,255,255,0.4)", fontSize: 20, cursor: "pointer", lineHeight: 1, padding: "2px 4px", flexShrink: 0 }}
              >×</button>
            </div>

            {/* Body */}
            <div style={{ padding: "18px 22px" }}>
              <p style={{ margin: "0 0 16px", fontSize: 13, color: "rgba(255,255,255,0.55)", lineHeight: 1.6 }}>
                {domainStatus === "active"
                  ? `Your site at https://${customDomain} will stop working immediately. You can connect a new domain after removing this one.`
                  : `This will remove the domain registration. You can connect a new domain straight away.`}
              </p>
              {domainError && (
                <div style={{ fontSize: 12, color: "#f87171", padding: "8px 12px", borderRadius: 8, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.2)", marginBottom: 14 }}>
                  {domainError}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  onClick={() => setConfirmRemoveOpen(false)} disabled={domainRemoving}
                  style={{ padding: "9px 18px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 600, cursor: domainRemoving ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                >
                  Cancel
                </button>
                <button
                  disabled={domainRemoving}
                  onClick={async () => {
                    if (domainStatus === "failed") {
                      await handleResetDomain();
                    } else {
                      await handleRemoveDomain();
                    }
                    setConfirmRemoveOpen(false);
                  }}
                  style={{ padding: "9px 20px", borderRadius: 9, background: domainRemoving ? "rgba(239,68,68,0.3)" : "rgba(239,68,68,0.85)", color: "#fff", fontSize: 13, fontWeight: 700, border: "none", cursor: domainRemoving ? "not-allowed" : "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}
                >
                  {domainRemoving && <span className="spinner" style={{ width: 12, height: 12, borderTopColor: "#fff", flexShrink: 0 }} />}
                  {domainRemoving ? "Removing…" : "Yes, remove domain"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
