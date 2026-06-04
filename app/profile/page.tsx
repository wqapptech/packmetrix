"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";
import Icon from "@/components/Icon";
import { useLang } from "@/hooks/useLang";
import { useIsMobile } from "@/hooks/useIsMobile";
import { T } from "@/lib/translations";
import { canUseCustomDomain } from "@/lib/limits";
import { toSlug } from "@/lib/trial";
import { DA_BG, DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3, DA_RULE, DA_RULE2, DA_GOLD, DA_GOLD_DEEP, DA_GOLD_SOFT, DA_GREEN, DA_GREEN_SOFT, DA_DANGER, DA_DANGER_SOFT } from "@/lib/tokens";
import { ConfirmModal } from "@/components/ConfirmModal";

const DISPLAY = `var(--font-instrument-serif), Georgia, serif`;
const SANS = `var(--font-inter-tight), system-ui, sans-serif`;

type DomainRecord = { type: string; name: string; value: string };
type DomainStatus = "pending_dns" | "verifying" | "ssl_provisioning" | "active" | "failed" | "";

function isApexDomain(hostname: string): boolean {
  return hostname.split(".").length === 2;
}


// ─── Shared field components ─────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ fontSize: 11, fontWeight: 600, color: DA_INK3, textTransform: "uppercase" as const, letterSpacing: ".5px", marginBottom: 8, marginTop: 18 }}>
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
        width: "100%", background: DA_SURFACE, border: `1px solid ${DA_RULE}`,
        borderRadius: 10, padding: "10px 14px", color: DA_INK1, fontSize: 13,
        fontFamily: SANS, outline: "none", transition: "border-color .15s", ...style,
      }}
      onFocus={e => (e.target.style.borderColor = DA_GOLD)}
      onBlur={e => (e.target.style.borderColor = DA_RULE)}
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
        background: enabled ? DA_GREEN : DA_RULE2,
        transition: "background 0.2s", position: "relative",
      }}>
        <div style={{
          position: "absolute", top: 3, left: enabled ? 21 : 3,
          width: 16, height: 16, borderRadius: "50%", background: "#fff",
          transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
        }} />
      </div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500, color: DA_INK1 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: DA_INK3, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}


// ─── DNS setup modal ─────────────────────────────────────────────────────────

type DnsRecord2 = { purpose: string; type: string; name: string; value: string };

function DnsSetupModal({
  open, onClose, allRecords, apexGuidance, copiedKey, onCopy, lang, t,
}: {
  open: boolean;
  onClose: () => void;
  allRecords: DnsRecord2[];
  apexGuidance: string | null;
  copiedKey: string | null;
  onCopy: (key: string, value: string) => void;
  lang: string;
  t: typeof import("@/lib/translations").T.en;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 600,
        background: "rgba(26,22,17,0.52)",
        backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20, animation: "cmFadeIn .15s ease",
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes cmFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes cmSlideUp { from { opacity:0; transform:translateY(12px) scale(.96) } to { opacity:1; transform:none } }
      `}</style>
      <div
        dir={lang === "ar" ? "rtl" : "ltr"}
        style={{
          position: "relative", width: "100%", maxWidth: 580,
          maxHeight: "88vh", overflowY: "auto",
          background: DA_SURFACE, borderRadius: 18,
          boxShadow: "0 24px 72px rgba(26,22,17,0.22), 0 4px 20px rgba(26,22,17,0.08)",
          border: `1px solid ${DA_RULE}`,
          animation: "cmSlideUp .22s cubic-bezier(.22,1,.36,1)",
          padding: "24px 26px 28px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
          <div style={{ fontSize: 14, fontWeight: 700, fontFamily: SANS, color: DA_INK1 }}>
            {lang === "ar" ? "تعليمات إعداد النطاق" : "Domain setup instructions"}
          </div>
          <button
            onClick={onClose}
            style={{ width: 30, height: 30, borderRadius: 9, background: "transparent", border: `1px solid ${DA_RULE}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", padding: 0 }}
          >
            <Icon name="x" size={13} color={DA_INK3} />
          </button>
        </div>

        {/* Apex domain note */}
        {apexGuidance && (
          <div style={{ marginBottom: 14, padding: "11px 14px", borderRadius: 9, background: "rgba(245,158,11,0.07)", border: "1px solid rgba(245,158,11,0.25)", fontSize: 12, color: "#7a5c00", lineHeight: 1.6 }}>
            <strong>{lang === "ar" ? "ملاحظة النطاق الجذر: " : "Apex domain note: "}</strong>{apexGuidance}
          </div>
        )}

        {/* DNS records table */}
        {allRecords.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, fontFamily: SANS, color: DA_INK3, textTransform: "uppercase" as const, letterSpacing: ".5px", marginBottom: 8 }}>{t.customDomainRecordsTitle}</div>
            <div style={{ overflowX: "auto", borderRadius: 8, border: `1px solid ${DA_RULE}`, background: DA_SURFACE }}>
              <div style={{ minWidth: 480 }}>
                <div style={{ display: "grid", gridTemplateColumns: "90px 52px 1fr 1fr", background: DA_BG, padding: "6px 10px", gap: 8 }}>
                  {[lang === "ar" ? "الغرض" : "Purpose", t.customDomainRecordType, t.customDomainRecordName, t.customDomainRecordValue].map((h, i) => (
                    <div key={i} style={{ fontSize: 10, fontWeight: 700, fontFamily: SANS, color: DA_INK3, textTransform: "uppercase" as const, letterSpacing: ".5px" }}>{h}</div>
                  ))}
                </div>
                {allRecords.map((rec, idx) => (
                  <div key={`${rec.type}:${idx}`} style={{ display: "grid", gridTemplateColumns: "90px 52px 1fr 1fr", padding: "8px 10px", gap: 8, alignItems: "start", borderTop: `1px solid ${DA_RULE}`, background: idx % 2 === 0 ? "transparent" : DA_BG }}>
                    <div style={{ fontSize: 10, color: DA_INK3, paddingTop: 2, lineHeight: 1.4 }}>{rec.purpose}</div>
                    <div style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 700, color: "#2563eb", paddingTop: 2 }}>{rec.type}</div>
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                      <div style={{ fontFamily: "monospace", fontSize: 11, color: DA_INK2, wordBreak: "break-all" as const }}>{rec.name}</div>
                      <button onClick={() => onCopy(`n:${idx}`, rec.name)} style={{ alignSelf: "flex-start", padding: "2px 7px", borderRadius: 5, background: copiedKey === `n:${idx}` ? DA_GREEN_SOFT : DA_SURFACE, border: `1px solid ${copiedKey === `n:${idx}` ? DA_GREEN : DA_RULE}`, color: copiedKey === `n:${idx}` ? DA_GREEN : DA_INK3, fontSize: 10, fontWeight: 600, fontFamily: SANS, cursor: "pointer", whiteSpace: "nowrap" as const, transition: "all .15s" }}>
                        {copiedKey === `n:${idx}` ? t.customDomainCopiedBtn : t.customDomainCopyBtn}
                      </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" as const, gap: 4 }}>
                      <div style={{ fontFamily: "monospace", fontSize: 10.5, color: DA_INK3, wordBreak: "break-all" as const }}>{rec.value}</div>
                      <button onClick={() => onCopy(`v:${idx}`, rec.value)} style={{ alignSelf: "flex-start", padding: "2px 7px", borderRadius: 5, background: copiedKey === `v:${idx}` ? DA_GREEN_SOFT : DA_SURFACE, border: `1px solid ${copiedKey === `v:${idx}` ? DA_GREEN : DA_RULE}`, color: copiedKey === `v:${idx}` ? DA_GREEN : DA_INK3, fontSize: 10, fontWeight: 600, fontFamily: SANS, cursor: "pointer", whiteSpace: "nowrap" as const, transition: "all .15s" }}>
                        {copiedKey === `v:${idx}` ? t.customDomainCopiedBtn : t.customDomainCopyBtn}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* How to add DNS records */}
        <div style={{ padding: "12px 14px", borderRadius: 9, background: DA_BG, border: `1px solid ${DA_RULE}` }}>
          <div style={{ fontSize: 11.5, fontWeight: 700, fontFamily: SANS, color: DA_INK1, marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
            <Icon name="link" size={12} color={DA_INK3} />
            {t.customDomainDnsHowTo}
          </div>
          <ol style={{ margin: 0, paddingLeft: lang === "ar" ? 0 : 16, paddingRight: lang === "ar" ? 16 : 0, display: "flex", flexDirection: "column" as const, gap: 5 }}>
            {[t.customDomainDnsStep1, t.customDomainDnsStep2, t.customDomainDnsStep3, t.customDomainDnsStep4].map((step, i) => (
              <li key={i} style={{ fontSize: 11.5, color: DA_INK3, lineHeight: 1.55 }}>{step}</li>
            ))}
          </ol>
          <div style={{ marginTop: 10, fontSize: 11, color: DA_INK3 }}>{t.customDomainDnsNote}</div>
          <div style={{ marginTop: 10, borderTop: `1px solid ${DA_RULE}`, paddingTop: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, fontFamily: SANS, color: DA_INK2, marginBottom: 5 }}>{t.customDomainProviderTitle}</div>
            <ul style={{ margin: 0, paddingLeft: lang === "ar" ? 0 : 14, paddingRight: lang === "ar" ? 14 : 0, display: "flex", flexDirection: "column" as const, gap: 3 }}>
              {[t.customDomainProviderNamecheap, t.customDomainProviderCloudflare, t.customDomainProviderGodaddy, t.customDomainProviderGoogle].map((tip, i) => (
                <li key={i} style={{ fontSize: 11, color: DA_INK3, listStyle: "disc" }}>{tip}</li>
              ))}
            </ul>
          </div>
        </div>
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

  // Storefront fields
  const [storefrontLanguage, setStorefrontLanguage] = useState<"en" | "ar">("en");
  const [brandColor, setBrandColor] = useState("#1d4e72");
  const [about_en, setAboutEn] = useState("");
  const [about_ar, setAboutAr] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [statsYears, setStatsYears] = useState("");
  const [statsTravellers, setStatsTravellers] = useState("");
  const [statsRating, setStatsRating] = useState("");

  const savedState = useRef({
    name: "", tagline: "", email: "", phone: "", logoUrl: "",
    enableReviews: false, showReviews: true,
    storefrontLanguage: "en" as "en" | "ar", brandColor: "#1d4e72",
    about_en: "", about_ar: "", whatsapp: "", statsYears: "", statsTravellers: "", statsRating: "",
  });
  const hasChanges = (
    name !== savedState.current.name ||
    tagline !== savedState.current.tagline ||
    email !== savedState.current.email ||
    phone !== savedState.current.phone ||
    logoUrl !== savedState.current.logoUrl ||
    enableReviews !== savedState.current.enableReviews ||
    showReviews !== savedState.current.showReviews ||
    storefrontLanguage !== savedState.current.storefrontLanguage ||
    brandColor !== savedState.current.brandColor ||
    about_en !== savedState.current.about_en ||
    about_ar !== savedState.current.about_ar ||
    whatsapp !== savedState.current.whatsapp ||
    statsYears !== savedState.current.statsYears ||
    statsTravellers !== savedState.current.statsTravellers ||
    statsRating !== savedState.current.statsRating
  );

  const [plan, setPlan] = useState<string>("");
  const [agencySlug, setAgencySlug] = useState<string>("");
  const [customDomain, setCustomDomain] = useState<string>("");
  const [domainInput, setDomainInput] = useState<string>("");
  const [domainSaving, setDomainSaving] = useState(false);
  const [domainSaved, setDomainSaved] = useState(false);
  const [domainRemoving, setDomainRemoving] = useState(false);
  const [domainError, setDomainError] = useState<string | null>(null);
  const [domainStatus, setDomainStatus] = useState<DomainStatus>("");
  const [domainCfId, setDomainCfId] = useState<string>("");
  const [cnameRecord, setCnameRecord] = useState<DomainRecord | null>(null);
  const [verificationRecords, setVerificationRecords] = useState<DomainRecord[]>([]);
  const [sslRecords, setSslRecords] = useState<DomainRecord[]>([]);
  const [apexGuidance, setApexGuidance] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [confirmRemoveOpen, setConfirmRemoveOpen] = useState(false);
  const [dnsSetupOpen, setDnsSetupOpen] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirmEmail, setDeleteConfirmEmail] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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
        const _name = d.name || "";
        const _tagline = d.tagline || "";
        const _email = d.email || "";
        const _phone = d.phone || "";
        const _logoUrl = d.logoUrl || "";
        const _enableReviews = d.enableReviews === true;
        const _showReviews = d.showReviews !== false;
        const _storefrontLanguage: "en" | "ar" = d.storefrontLanguage === "ar" ? "ar" : "en";
        const _brandColor = d.brandColor || "#1d4e72";
        const _about_en = d.about_en || d.about || "";
        const _about_ar = d.about_ar || "";
        const _whatsapp = d.whatsapp || "";
        const _statsYears = d.statsYears ? String(d.statsYears) : "";
        const _statsTravellers = d.statsTravellers ? String(d.statsTravellers) : "";
        const _statsRating = d.statsRating ? String(d.statsRating) : "";
        setName(_name);
        setTagline(_tagline);
        setEmail(_email);
        setPhone(_phone);
        setLogoUrl(_logoUrl);
        setEnableReviews(_enableReviews);
        setShowReviews(_showReviews);
        setStorefrontLanguage(_storefrontLanguage);
        setBrandColor(_brandColor);
        setAboutEn(_about_en);
        setAboutAr(_about_ar);
        setWhatsapp(_whatsapp);
        setStatsYears(_statsYears);
        setStatsTravellers(_statsTravellers);
        setStatsRating(_statsRating);
        savedState.current = {
          name: _name, tagline: _tagline, email: _email, phone: _phone, logoUrl: _logoUrl,
          enableReviews: _enableReviews, showReviews: _showReviews,
          storefrontLanguage: _storefrontLanguage, brandColor: _brandColor,
          about_en: _about_en, about_ar: _about_ar, whatsapp: _whatsapp,
          statsYears: _statsYears, statsTravellers: _statsTravellers, statsRating: _statsRating,
        };
        setPlan(d.plan || "");
        const _slug = d.agencySlug ? d.agencySlug : toSlug(d.name || "");
        setAgencySlug(_slug);
        if (!d.agencySlug && _slug) {
          updateDoc(doc(db, "users", u.uid), { agencySlug: _slug }).catch(() => {});
        }
        const savedDomain = d.customDomain || "";
        setCustomDomain(savedDomain);
        setDomainInput(savedDomain);
        setDomainCfId(d.customDomainCfId || "");
        setDomainStatus(savedDomain ? (d.customDomainStatus || "") as DomainStatus : "");
        setVerificationRecords(d.customDomainVerificationRecords || []);
        setSslRecords(d.customDomainSslRecords || []);
        if (savedDomain && !isApexDomain(savedDomain)) {
          setCnameRecord({ type: "CNAME", name: savedDomain, value: "cname.packmetrix.com" });
        }
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
    const statsYearsNum = statsYears ? Number(statsYears) : 0;
    const statsTravellersNum = statsTravellers ? Number(statsTravellers) : 0;
    const statsRatingNum = statsRating ? Number(parseFloat(statsRating).toFixed(1)) : 0;
    await updateDoc(doc(db, "users", uid), {
      name, tagline, email, phone, logoUrl, enableReviews, showReviews,
      storefrontLanguage, brandColor, about_en, about_ar, whatsapp,
      statsYears: statsYearsNum, statsTravellers: statsTravellersNum, statsRating: statsRatingNum,
    });
    savedState.current = {
      name, tagline, email, phone, logoUrl, enableReviews, showReviews,
      storefrontLanguage, brandColor, about_en, about_ar, whatsapp,
      statsYears, statsTravellers, statsRating,
    };
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
      setDomainStatus(json.status as DomainStatus);
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
      setDomainStatus(data.status as DomainStatus);
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
      setCnameRecord(null); setVerificationRecords([]); setSslRecords([]); setApexGuidance(null);
      setDomainError(null);
      setDomainRemoving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!auth.currentUser) return;
    if (deleteConfirmEmail.toLowerCase().trim() !== email.toLowerCase().trim()) {
      setDeleteError(lang === "ar" ? "البريد الإلكتروني غير مطابق." : "Email does not match.");
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch("/api/delete-account", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const json = await res.json();
        setDeleteError(json.error || "Deletion failed. Please try again.");
        return;
      }
      await signOut(auth);
      router.push("/");
    } catch {
      setDeleteError("Deletion failed. Please try again or contact hello@packmetrix.com.");
    } finally {
      setDeleting(false);
    }
  };

  // Auto-refresh every 30 s while CF is verifying / provisioning SSL.
  useEffect(() => {
    const IN_PROGRESS: DomainStatus[] = ["pending_dns", "verifying", "ssl_provisioning"];
    if (!domainCfId || !IN_PROGRESS.includes(domainStatus as DomainStatus)) return;
    const id = setInterval(async () => {
      if (!auth.currentUser) return;
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`/api/domains/${domainCfId}/status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setDomainStatus(data.status as DomainStatus);
      setVerificationRecords(data.verification_records ?? []);
      setSslRecords(data.ssl_records ?? []);
      if (data.error_message) setDomainError(data.error_message);
    }, 30_000);
    return () => clearInterval(id);
  }, [domainStatus, domainCfId]);

  if (authLoading) {
    return (
      <AppLayout>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: DA_BG }}>
          <span className="spinner-warm" />
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
            <div style={{ fontSize: 26, fontWeight: 400, fontFamily: DISPLAY, color: DA_INK1, letterSpacing: "-0.3px" }}>{t.brandingTitle}</div>
            <div style={{ fontSize: 13, fontFamily: SANS, color: DA_INK3, marginTop: 4 }}>{t.brandingSubtitle}</div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            style={{
              padding: "9px 20px", borderRadius: 9, fontSize: 13, fontWeight: 700, fontFamily: SANS,
              background: saved ? DA_GREEN_SOFT : DA_GOLD,
              border: saved ? `1px solid ${DA_GREEN}` : "none",
              color: saved ? DA_GREEN : "#fff",
              cursor: (saving || !hasChanges) ? "not-allowed" : "pointer",
              display: "flex", alignItems: "center", gap: 8, transition: "all .2s",
              opacity: hasChanges || saved ? 1 : 0.35,
            }}
          >
            {saving
              ? <><span className="spinner-warm" style={{ width: 13, height: 13, borderTopColor: "#fff" }} /> {t.savingBtn}</>
              : saved
              ? <><Icon name="check" size={13} color={DA_GREEN} strokeWidth={2.5} /> {t.savedBtn}</>
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
            <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: SANS, color: DA_INK1, marginBottom: 18 }}>{t.agencyProfileLabel}</div>

              {/* Logo upload */}
              <div style={{ display: "flex", gap: 14, marginBottom: 18, alignItems: "center" }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 14, flexShrink: 0,
                  background: logoUrl ? "transparent" : DA_BG,
                  border: `1px solid ${DA_RULE}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  overflow: "hidden", color: DA_INK1, fontSize: 22, fontWeight: 800,
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
                    style={{ padding: "7px 12px", borderRadius: 8, background: DA_SURFACE, border: `1px solid ${DA_RULE2}`, color: DA_INK2, fontSize: 11.5, fontWeight: 600, cursor: uploading ? "not-allowed" : "pointer", fontFamily: SANS }}
                  >
                    {uploading ? t.uploadingBtn : t.uploadLogoBtn}
                  </button>
                  {uploadError && <div style={{ fontSize: 11, color: DA_DANGER, marginTop: 5 }}>{uploadError}</div>}
                  <div style={{ fontSize: 11, color: DA_INK3, marginTop: 6 }}>{t.logoRecommendedNote}</div>
                  {logoUrl && (
                    <button onClick={() => setLogoUrl("")} style={{ fontSize: 11, color: DA_INK3, background: "none", border: "none", cursor: "pointer", fontFamily: SANS, padding: 0, marginTop: 4 }}>{t.removeLogoBtn}</button>
                  )}
                </div>
              </div>

              <FieldLabel>{t.agencyNameLabel}</FieldLabel>
              <Input value={name} onChange={setName} placeholder="e.g. Aegean Travel" />

              <FieldLabel>{t.taglineLabel}</FieldLabel>
              <Input value={tagline} onChange={setTagline} placeholder="Curated Mediterranean journeys · est. 2014" />

              <FieldLabel>{t.contactLabel}</FieldLabel>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 8 }}>
                <Input value={email} onChange={setEmail} placeholder="hello@agency.com" />
                <Input value={phone} onChange={setPhone} placeholder="+1 555 000 1234" />
              </div>
            </div>

            {/* Storefront settings */}
            <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: SANS, color: DA_INK1, marginBottom: 4 }}>
                {lang === "ar" ? "إعدادات الواجهة العامة" : "Storefront settings"}
              </div>
              <div style={{ fontSize: 11.5, color: DA_INK3, marginBottom: 18, lineHeight: 1.5 }}>
                {lang === "ar"
                  ? "هذه الحقول تغذّي صفحتك العامة — تظهر الأقسام فقط عند ملء بياناتها."
                  : "These fields power your public storefront — sections appear only when their data is filled in."}
              </div>

              {/* Storefront language */}
              <FieldLabel>{lang === "ar" ? "لغة الواجهة العامة" : "Storefront language"}</FieldLabel>
              <div style={{ display: "flex", gap: 8 }}>
                {(["en", "ar"] as const).map((l) => (
                  <button
                    key={l}
                    onClick={() => setStorefrontLanguage(l)}
                    style={{
                      flex: 1, padding: "9px 0", borderRadius: 9, fontSize: 13, fontWeight: 600,
                      fontFamily: SANS, cursor: "pointer", transition: "all .15s",
                      background: storefrontLanguage === l ? DA_GOLD : DA_SURFACE,
                      color: storefrontLanguage === l ? "#fff" : DA_INK2,
                      border: `1.5px solid ${storefrontLanguage === l ? DA_GOLD : DA_RULE}`,
                    }}
                  >
                    {l === "en" ? "English" : "العربية"}
                  </button>
                ))}
              </div>
              <div style={{ fontSize: 11, color: DA_INK3, marginTop: 6, lineHeight: 1.5 }}>
                {lang === "ar"
                  ? "تحدد هذه اللغة الباقات التي تظهر — تُعرض باقات هذه اللغة فقط."
                  : "Sets which packages appear — only packages in this language are shown."}
              </div>

              {/* Brand color */}
              <FieldLabel>{lang === "ar" ? "لون الهوية" : "Brand color"}</FieldLabel>
              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ position: "relative", flexShrink: 0 }}>
                  <input
                    type="color"
                    value={brandColor}
                    onChange={e => setBrandColor(e.target.value)}
                    style={{ width: 42, height: 42, borderRadius: 9, border: `1px solid ${DA_RULE}`, cursor: "pointer", padding: 2, background: "transparent" }}
                  />
                </div>
                <Input
                  value={brandColor}
                  onChange={v => { if (/^#[0-9a-fA-F]{0,6}$/.test(v)) setBrandColor(v); }}
                  placeholder="#1d4e72"
                  style={{ fontFamily: "monospace", maxWidth: 120 }}
                />
                <div style={{ width: 36, height: 36, borderRadius: 9, background: brandColor, border: `1px solid ${DA_RULE}`, flexShrink: 0 }} />
              </div>
              <div style={{ fontSize: 11, color: DA_INK3, marginTop: 6 }}>
                {lang === "ar"
                  ? "يُستخدم على الأزرار والروابط في صفحتك العامة."
                  : "Used on buttons and links in your storefront."}
              </div>

              {/* About */}
              <FieldLabel>{lang === "ar" ? "نبذة عن الوكالة" : "About your agency"}</FieldLabel>
              <div style={{ fontSize: 11, color: DA_INK3, marginBottom: 8 }}>
                {lang === "ar" ? "أدخل النص بالإنجليزية والعربية — كلٌّ يظهر في نسخته اللغوية." : "Enter text in both languages — each is shown in its language version."}
              </div>
              {[
                { label: "English", value: about_en, set: setAboutEn, dir: "ltr", placeholder: "A short paragraph about who you are and the kind of journeys you design…" },
                { label: "العربية", value: about_ar, set: setAboutAr, dir: "rtl", placeholder: "اكتب مقدمة قصيرة عن وكالتك وطبيعة رحلاتك…" },
              ].map(({ label, value, set, dir, placeholder }) => (
                <div key={label} style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: DA_INK3, marginBottom: 5, letterSpacing: ".06em" }}>{label}</div>
                  <textarea
                    value={value}
                    onChange={e => set(e.target.value)}
                    placeholder={placeholder}
                    dir={dir}
                    rows={3}
                    style={{
                      width: "100%", background: DA_SURFACE, border: `1px solid ${DA_RULE}`,
                      borderRadius: 10, padding: "10px 14px", color: DA_INK1, fontSize: 13,
                      fontFamily: SANS, outline: "none", resize: "vertical", lineHeight: 1.6,
                      transition: "border-color .15s", boxSizing: "border-box",
                    }}
                    onFocus={e => (e.target.style.borderColor = DA_GOLD)}
                    onBlur={e => (e.target.style.borderColor = DA_RULE)}
                  />
                </div>
              ))}

              {/* WhatsApp */}
              <FieldLabel>{lang === "ar" ? "واتساب (للتواصل)" : "WhatsApp number"}</FieldLabel>
              <Input
                value={whatsapp}
                onChange={setWhatsapp}
                placeholder="+971 50 000 0000"
              />
              <div style={{ fontSize: 11, color: DA_INK3, marginTop: 6 }}>
                {lang === "ar"
                  ? "يُفعّل زر واتساب العائم وشريط التواصل في الصفحة العامة."
                  : "Enables the floating WhatsApp button and contact band on your storefront."}
              </div>

              {/* Trust stats */}
              <div style={{ marginTop: 20, paddingTop: 18, borderTop: `1px solid ${DA_RULE}` }}>
                <div style={{ fontSize: 12, fontWeight: 600, fontFamily: SANS, color: DA_INK2, marginBottom: 4 }}>
                  {lang === "ar" ? "أرقام الثقة (اختياري)" : "Trust figures (optional)"}
                </div>
                <div style={{ fontSize: 11, color: DA_INK3, marginBottom: 14, lineHeight: 1.5 }}>
                  {lang === "ar"
                    ? "تظهر هذه الأرقام فقط عند ملئها. لا تُدخل أرقاماً افتراضية."
                    : "These appear only when filled in. Only enter real numbers — never invented."}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr", gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: DA_INK3, marginBottom: 5 }}>
                      {lang === "ar" ? "سنوات الخبرة" : "Years in business"}
                    </div>
                    <Input
                      value={statsYears}
                      onChange={v => { if (/^\d*$/.test(v)) setStatsYears(v); }}
                      placeholder="12"
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: DA_INK3, marginBottom: 5 }}>
                      {lang === "ar" ? "مسافرون استضفتهم" : "Travellers hosted"}
                    </div>
                    <Input
                      value={statsTravellers}
                      onChange={v => { if (/^\d*$/.test(v)) setStatsTravellers(v); }}
                      placeholder="2400"
                    />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: DA_INK3, marginBottom: 5 }}>
                      {lang === "ar" ? "متوسط التقييم (من 5)" : "Avg. rating (out of 5)"}
                    </div>
                    <Input
                      value={statsRating}
                      onChange={v => { if (/^\d*\.?\d*$/.test(v) && parseFloat(v || "0") <= 5) setStatsRating(v); }}
                      placeholder="4.9"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Reviews settings */}
            <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: SANS, color: DA_INK1, marginBottom: 4 }}>{t.reviewsSettingsTitle}</div>
              <div style={{ fontSize: 11.5, color: DA_INK3, marginBottom: 14 }}>
                Ratings & reviews from visitors on your landing pages
              </div>
              <div style={{ borderTop: `1px solid ${DA_RULE}` }}>
                <Toggle
                  enabled={enableReviews}
                  onChange={setEnableReviews}
                  label={t.enableReviewsLabel}
                  sub={t.enableReviewsSub}
                />
                <div style={{ borderTop: `1px solid ${DA_RULE}` }}>
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
            <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: SANS, color: DA_INK1, marginBottom: 4 }}>{t.customDomainSectionTitle}</div>
              <div style={{ fontSize: 11.5, color: DA_INK3, marginBottom: 14 }}>{t.customDomainSectionSub}</div>

              {!canUseCustomDomain(plan) ? (
                /* ── Upgrade gate ── */
                <div style={{ borderRadius: 10, background: DA_GOLD_SOFT, border: `1px solid ${DA_RULE2}`, padding: "16px 18px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Icon name="lock" size={14} color={DA_GOLD} />
                    <div style={{ fontSize: 12.5, fontWeight: 700, fontFamily: SANS, color: DA_GOLD }}>{t.customDomainUpgradeTitle}</div>
                  </div>
                  <div style={{ fontSize: 11.5, color: DA_INK3, marginBottom: 14 }}>{t.customDomainUpgradeSub}</div>
                  <a href="/paywall" style={{ display: "inline-block", padding: "8px 16px", borderRadius: 8, background: DA_GOLD, color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: SANS, textDecoration: "none" }}>
                    {t.customDomainUpgradeBtn}
                  </a>
                </div>
              ) : customDomain ? (() => {
                /* ── Domain registered — CF state-based UI ── */
                const allRecords: Array<{ purpose: string; type: string; name: string; value: string }> = [
                  ...(cnameRecord ? [{ purpose: lang === "ar" ? "توجيه الزيارات" : "Route traffic", type: cnameRecord.type, name: cnameRecord.name, value: cnameRecord.value }] : []),
                  ...verificationRecords.map(r => ({ purpose: lang === "ar" ? "التحقق من الملكية" : "Ownership verification", type: r.type, name: r.name, value: r.value })),
                  ...sslRecords.map(r => ({ purpose: lang === "ar" ? "شهادة SSL" : "SSL certificate", type: r.type, name: r.name, value: r.value })),
                ];

                // ── Active ─────────────────────────────────────────────────
                if (domainStatus === "active") return (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: DA_GREEN_SOFT, border: `1px solid ${DA_GREEN}`, marginBottom: 12 }}>
                      <Icon name="check" size={13} color={DA_GREEN} strokeWidth={2.5} />
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, fontFamily: SANS, color: DA_GREEN, textTransform: "uppercase" as const, letterSpacing: ".5px" }}>{t.customDomainStatusActive}</div>
                        <div style={{ fontSize: 12, fontFamily: "monospace", color: DA_INK2, marginTop: 1 }}>{customDomain}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: DA_INK3, marginBottom: 12 }}>{t.customDomainStatusActiveDesc}</div>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" as const }}>
                      <a
                        href={`https://${customDomain}`} target="_blank" rel="noopener noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "8px 14px", borderRadius: 9, background: DA_GOLD, color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: SANS, textDecoration: "none" }}
                      >
                        <Icon name="globe" size={13} color="#fff" /> {lang === "ar" ? "زيارة الموقع" : "Visit site"}
                      </a>
                      <button
                        onClick={() => setConfirmRemoveOpen(true)} disabled={domainRemoving}
                        style={{ padding: "8px 14px", borderRadius: 9, background: DA_DANGER_SOFT, border: "none", color: DA_DANGER, fontSize: 12, fontWeight: 600, fontFamily: SANS, cursor: domainRemoving ? "not-allowed" : "pointer" }}
                      >
                        {t.customDomainRemoveBtn}
                      </button>
                    </div>
                    {domainError && <div style={{ fontSize: 11.5, color: DA_DANGER, marginTop: 8 }}>{domainError}</div>}
                  </div>
                );

                // ── Failed ─────────────────────────────────────────────────
                if (domainStatus === "failed") return (
                  <div>
                    <div style={{ padding: "12px 14px", borderRadius: 10, background: DA_DANGER_SOFT, border: `1px solid ${DA_DANGER}`, marginBottom: 12 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, fontFamily: SANS, color: DA_DANGER, textTransform: "uppercase" as const, letterSpacing: ".5px", marginBottom: 4 }}>{t.customDomainStatusError}</div>
                      <div style={{ fontSize: 12, fontFamily: "monospace", color: DA_INK2, marginBottom: 6 }}>{customDomain}</div>
                      <div style={{ fontSize: 12, color: DA_INK3, lineHeight: 1.5 }}>
                        {domainError || (lang === "ar"
                          ? "لم نتمكن من التحقق من نطاقك. تحقق من سجلات DNS وحاول مجدداً، أو تواصل معنا للمساعدة."
                          : "We couldn't complete domain verification. Check your DNS records and try again, or contact us for help."
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 12, color: DA_INK3, marginBottom: 12, lineHeight: 1.6 }}>
                      <strong>{lang === "ar" ? "تحقق من:" : "Check:"}</strong>{" "}
                      {lang === "ar"
                        ? "هل السجلات مُضافة بالضبط كما أُرسلت إليك؟ هل انقضت مدة التحقق (48 ساعة)؟ هل هناك تعارض في النطاق؟"
                        : "Are the records added exactly as sent? Did verification time out (48h)? Is there a domain conflict?"}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={() => setConfirmRemoveOpen(true)} disabled={domainRemoving}
                        style={{ padding: "8px 14px", borderRadius: 9, background: DA_GOLD, border: "none", color: "#fff", fontSize: 12, fontWeight: 700, fontFamily: SANS, cursor: domainRemoving ? "not-allowed" : "pointer" }}
                      >
                        {lang === "ar" ? "تجربة نطاق مختلف" : "Try a different domain"}
                      </button>
                      <a href="mailto:support@packmetrix.com" style={{ display: "inline-flex", alignItems: "center", padding: "8px 14px", borderRadius: 9, background: DA_SURFACE2, border: `1px solid ${DA_RULE}`, color: DA_INK2, fontSize: 12, fontWeight: 600, fontFamily: SANS, textDecoration: "none" }}>
                        {lang === "ar" ? "تواصل معنا" : "Contact support"}
                      </a>
                    </div>
                  </div>
                );

                // ── In-progress: pending_dns | verifying | ssl_provisioning ─
                const statusLabel =
                  domainStatus === "pending_dns"      ? (lang === "ar" ? "في انتظار سجلات DNS"  : "Waiting for DNS records") :
                  domainStatus === "ssl_provisioning" ? (lang === "ar" ? "جارٍ إعداد SSL"        : "Provisioning SSL certificate") :
                  t.customDomainStatusVerifying;
                const statusDesc =
                  domainStatus === "pending_dns"      ? (lang === "ar" ? "أضف سجلات DNS التالية عند مسجّل نطاقك لتفعيل نطاقك." : "Add the DNS records below at your domain registrar to activate your domain.") :
                  domainStatus === "ssl_provisioning" ? (lang === "ar" ? "تم التحقق من سجلات DNS. نعمل الآن على إعداد شهادة SSL." : "DNS records verified. We're now provisioning your SSL certificate — this can take a few minutes.") :
                  t.customDomainStatusVerifyingDesc;
                const statusColor =
                  domainStatus === "ssl_provisioning" ? "#1d4ed8" :
                  domainStatus === "verifying"        ? "#7c3aed" : "#b45309";
                const statusBg =
                  domainStatus === "ssl_provisioning" ? "rgba(96,165,250,0.07)" :
                  domainStatus === "verifying"        ? "rgba(167,139,250,0.07)" : "rgba(245,158,11,0.07)";
                const statusBorder =
                  domainStatus === "ssl_provisioning" ? "rgba(96,165,250,0.25)" :
                  domainStatus === "verifying"        ? "rgba(167,139,250,0.25)" : "rgba(245,158,11,0.25)";
                const spinnerColor =
                  domainStatus === "ssl_provisioning" ? "#2563eb" :
                  domainStatus === "verifying"        ? "#7c3aed" : "#f59e0b";

                return (
                  <div>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "12px 14px", borderRadius: 10, background: statusBg, border: `1px solid ${statusBorder}`, marginBottom: 12 }}>
                      <span className="spinner-warm" style={{ width: 10, height: 10, borderTopColor: spinnerColor, flexShrink: 0, marginTop: 2 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, fontFamily: SANS, color: statusColor, textTransform: "uppercase" as const, letterSpacing: ".5px", marginBottom: 3 }}>{statusLabel}</div>
                        <div style={{ fontSize: 12, fontFamily: "monospace", color: DA_INK3, wordBreak: "break-all" as const }}>{customDomain}</div>
                      </div>
                      <div style={{ fontSize: 10, color: DA_INK3, flexShrink: 0 }}>
                        {lang === "ar" ? "تحديث تلقائي كل 30 ث" : "Auto-refreshing every 30s"}
                      </div>
                    </div>

                    <div style={{ fontSize: 12, color: DA_INK3, lineHeight: 1.65, marginBottom: 12 }}>{statusDesc}</div>

                    <button
                      onClick={() => setDnsSetupOpen(true)}
                      style={{ display: "inline-flex", alignItems: "center", gap: 5, padding: "7px 12px", borderRadius: 8, background: DA_BG, border: `1px solid ${DA_RULE}`, color: DA_GOLD_DEEP, fontSize: 12, fontWeight: 600, fontFamily: SANS, cursor: "pointer", marginBottom: 14, textDecoration: "none" }}
                    >
                      <Icon name="link" size={12} color={DA_GOLD_DEEP} />
                      {lang === "ar" ? "عرض سجلات DNS والتعليمات" : "View DNS records & instructions"}
                    </button>

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={handleRefreshStatus} disabled={refreshing}
                        style={{ padding: "7px 12px", borderRadius: 8, background: DA_SURFACE, border: `1px solid ${DA_RULE}`, color: DA_INK2, fontSize: 11, fontWeight: 600, fontFamily: SANS, cursor: refreshing ? "not-allowed" : "pointer" }}
                      >
                        {refreshing ? t.customDomainRefreshingBtn : t.customDomainRefreshBtn}
                      </button>
                      <button
                        onClick={() => setConfirmRemoveOpen(true)} disabled={domainRemoving}
                        style={{ padding: "7px 12px", borderRadius: 8, background: DA_DANGER_SOFT, border: "none", color: DA_DANGER, fontSize: 11, fontWeight: 600, fontFamily: SANS, cursor: domainRemoving ? "not-allowed" : "pointer" }}
                      >
                        {t.customDomainRemoveBtn}
                      </button>
                    </div>
                    {domainError && <div style={{ fontSize: 11.5, color: DA_DANGER, marginTop: 8 }}>{domainError}</div>}
                  </div>
                );
              })() : (
                /* ── No domain yet ── */
                <div>
                  {agencySlug && (
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 10.5, fontWeight: 600, fontFamily: SANS, color: DA_INK3, textTransform: "uppercase" as const, letterSpacing: ".5px", marginBottom: 5 }}>
                        {t.customDomainCurrentUrl}
                      </div>
                      <div style={{ fontSize: 12, color: DA_INK2, fontFamily: "monospace", background: DA_BG, border: `1px solid ${DA_RULE}`, borderRadius: 7, padding: "6px 10px" }}>
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
                      style={{ flex: 1, background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 10, padding: "10px 14px", color: DA_INK1, fontSize: 13, fontFamily: "monospace", outline: "none", transition: "border-color .15s" }}
                      onFocus={e => (e.target.style.borderColor = DA_GOLD)}
                      onBlur={e => (e.target.style.borderColor = DA_RULE)}
                    />
                    <button
                      onClick={handleSaveDomain}
                      disabled={domainSaving || !domainInput.trim()}
                      style={{
                        padding: "10px 14px", borderRadius: 10, fontSize: 12.5, fontWeight: 700, fontFamily: SANS,
                        background: domainSaved ? DA_GREEN_SOFT : DA_GOLD,
                        border: domainSaved ? `1px solid ${DA_GREEN}` : "none",
                        color: domainSaved ? DA_GREEN : "#fff",
                        cursor: (domainSaving || !domainInput.trim()) ? "not-allowed" : "pointer",
                        opacity: !domainInput.trim() ? 0.5 : 1, flexShrink: 0, whiteSpace: "nowrap" as const,
                      }}
                    >
                      {domainSaving ? t.customDomainSavingBtn : domainSaved ? <><Icon name="check" size={12} color={DA_GREEN} strokeWidth={2.5} /> {t.customDomainSavedBtn}</> : t.customDomainSaveBtn}
                    </button>
                  </div>
                  <div style={{ fontSize: 11, color: DA_INK3, marginTop: 6 }}>{t.customDomainSubdomainHint}</div>
                  {domainError && <div style={{ fontSize: 11.5, color: DA_DANGER, marginTop: 8 }}>{domainError}</div>}
                  <div style={{ marginTop: 12, fontSize: 11.5, color: DA_INK3, lineHeight: 1.6 }}>
                    {lang === "ar"
                      ? "أدخل نطاقك ← احصل على سجلات DNS ← أضفها عند مسجّل النطاق ← يصبح نطاقك مباشراً."
                      : "Submit your domain → get DNS records → add them at your registrar → go live."
                    }
                    {" "}
                    <button
                      onClick={() => setDnsSetupOpen(true)}
                      style={{ background: "none", border: "none", padding: 0, color: DA_GOLD_DEEP, fontSize: 11.5, fontWeight: 600, fontFamily: SANS, cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}
                    >
                      {lang === "ar" ? "تفاصيل الإعداد" : "Setup details"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Danger zone */}
            <div style={{ background: DA_SURFACE, border: `1px solid ${DA_DANGER}`, borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ fontSize: 13, fontWeight: 600, fontFamily: SANS, color: DA_DANGER, marginBottom: 4 }}>
                {lang === "ar" ? "منطقة الخطر" : "Danger zone"}
              </div>
              <div style={{ fontSize: 11.5, color: DA_INK3, marginBottom: 16, lineHeight: 1.5 }}>
                {lang === "ar"
                  ? "حذف حسابك يزيل جميع الباقات والعملاء والبيانات نهائياً. هذا الإجراء لا يمكن التراجع عنه."
                  : "Deleting your account permanently removes all packages, leads, and data. This cannot be undone."}
              </div>
              <button
                onClick={() => { setDeleteOpen(true); setDeleteConfirmEmail(""); setDeleteError(null); }}
                style={{
                  padding: "8px 16px", borderRadius: 9,
                  background: DA_DANGER_SOFT, border: `1px solid ${DA_DANGER}`,
                  color: DA_DANGER, fontSize: 12.5, fontWeight: 600, fontFamily: SANS,
                  cursor: "pointer",
                }}
              >
                {lang === "ar" ? "حذف حسابي" : "Delete my account"}
              </button>
            </div>

        </div>
      </div>
      {/* ── Remove domain confirmation modal ── */}
      <ConfirmModal
        open={confirmRemoveOpen}
        onClose={() => { if (!domainRemoving) setConfirmRemoveOpen(false); }}
        loading={domainRemoving}
        variant="warning"
        icon="globe"
        dir={lang === "ar" ? "rtl" : "ltr"}
        title={domainStatus === "failed" ? t.domainRetryTitle : t.domainRemoveTitle}
        message={domainStatus === "active" ? t.domainRemoveActiveMsg : t.domainRemoveInactiveMsg}
        confirmLabel={domainRemoving ? t.domainRemovingLabel : t.domainRemoveConfirm}
        cancelLabel={t.modalCancel}
        onConfirm={async () => {
          if (domainStatus === "failed") {
            await handleResetDomain();
          } else {
            await handleRemoveDomain();
          }
          setConfirmRemoveOpen(false);
        }}
      >
        {domainError && (
          <div style={{ fontSize: 12, color: DA_DANGER, padding: "8px 12px", borderRadius: 8, background: DA_DANGER_SOFT, border: `1px solid ${DA_DANGER}`, marginBottom: 4 }}>
            {domainError}
          </div>
        )}
      </ConfirmModal>
      {/* ── Delete account modal ── */}
      <ConfirmModal
        open={deleteOpen}
        onClose={() => { if (!deleting) { setDeleteOpen(false); setDeleteConfirmEmail(""); setDeleteError(null); } }}
        loading={deleting}
        variant="danger"
        title={lang === "ar" ? "حذف الحساب نهائياً؟" : "Delete account permanently?"}
        message={lang === "ar" ? "لا يمكن التراجع عن هذا الإجراء." : "This action cannot be undone."}
        confirmLabel={lang === "ar" ? "حذف حسابي" : "Delete my account"}
        cancelLabel={lang === "ar" ? "إلغاء" : "Cancel"}
        dir={lang === "ar" ? "rtl" : "ltr"}
        onConfirm={handleDeleteAccount}
      >
        <div style={{ marginBottom: 14, padding: "10px 13px", background: DA_DANGER_SOFT, borderRadius: 9, fontSize: 12.5, color: DA_DANGER, lineHeight: 1.6 }}>
          {lang === "ar" ? (
            <>• جميع صفحات الباقات<br />• جميع العملاء والبيانات<br />• النطاق المخصص<br />• حسابك بالكامل</>
          ) : (
            <>• All package pages<br />• All leads and analytics<br />• Your custom domain<br />• Your account and profile</>
          )}
        </div>
        <div style={{ fontSize: 12, fontWeight: 500, color: DA_INK2, marginBottom: 6 }}>
          {lang === "ar" ? `أدخل بريدك الإلكتروني للتأكيد` : `Type your email to confirm`}
        </div>
        <input
          type="email"
          value={deleteConfirmEmail}
          onChange={e => { setDeleteConfirmEmail(e.target.value); setDeleteError(null); }}
          placeholder={email}
          disabled={deleting}
          style={{
            width: "100%", padding: "9px 12px",
            background: DA_SURFACE, border: `1px solid ${DA_RULE}`,
            borderRadius: 8, color: DA_INK1, fontSize: 13,
            fontFamily: SANS, outline: "none", boxSizing: "border-box",
          }}
          onFocus={e => (e.target.style.borderColor = DA_DANGER)}
          onBlur={e => (e.target.style.borderColor = DA_RULE)}
        />
        {deleteError && (
          <div style={{ fontSize: 12, color: DA_DANGER, padding: "8px 12px", borderRadius: 8, background: DA_DANGER_SOFT, border: `1px solid ${DA_DANGER}`, marginTop: 10 }}>
            {deleteError}
          </div>
        )}
      </ConfirmModal>
      {/* ── DNS setup modal ── */}
      <DnsSetupModal
        open={dnsSetupOpen}
        onClose={() => setDnsSetupOpen(false)}
        allRecords={(() => {
          if (!customDomain) return [];
          return [
            ...(cnameRecord ? [{ purpose: lang === "ar" ? "توجيه الزيارات" : "Route traffic", type: cnameRecord.type, name: cnameRecord.name, value: cnameRecord.value }] : []),
            ...verificationRecords.map(r => ({ purpose: lang === "ar" ? "التحقق من الملكية" : "Ownership verification", type: r.type, name: r.name, value: r.value })),
            ...sslRecords.map(r => ({ purpose: lang === "ar" ? "شهادة SSL" : "SSL certificate", type: r.type, name: r.name, value: r.value })),
          ];
        })()}
        apexGuidance={apexGuidance}
        copiedKey={copiedKey}
        onCopy={handleCopyRecord}
        lang={lang}
        t={t}
      />
    </AppLayout>
  );
}
