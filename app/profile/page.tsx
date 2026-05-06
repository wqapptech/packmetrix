"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";
import Icon from "@/components/Icon";
import { useLang } from "@/hooks/useLang";
import { T, type Lang } from "@/lib/translations";

const SAND = "#e8c97b";
const SUCCESS = "#2dd4a0";

const COLOR_SWATCHES = ["#1f5f8e", "#0d6e3f", "#a47e2c", "#c66a3d", "#7c3aed", "#0d1b2e", "#b91c1c", "#0891b2"];

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

function LandingPreview({ logoUrl, name, tagline, color, lang }: { logoUrl: string; name: string; tagline: string; color: string; lang: Lang }) {
  const t = T[lang];
  const isRtl = lang === "ar";
  const initials = (name || "AG").slice(0, 2).toUpperCase();

  return (
    <div dir={isRtl ? "rtl" : "ltr"} style={{ borderRadius: 14, overflow: "hidden", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 16px 48px rgba(0,0,0,0.3)", background: "#fdfcf9" }}>
      {/* Browser chrome */}
      <div style={{ background: "#1c2333", padding: "10px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["#ef4444", "#f59e0b", "#22c55e"].map((c, i) => (
            <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.8 }} />
          ))}
        </div>
        <div style={{ flex: 1, background: "rgba(255,255,255,0.07)", borderRadius: 6, padding: "4px 10px", fontSize: 10, color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
          packmetrix.com/your-agency/package-id
        </div>
      </div>

      {/* Agency header */}
      <div style={{ background: "#fdfcf9", padding: "13px 24px", borderBottom: "1px solid rgba(13,27,46,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 8, flexShrink: 0,
            background: logoUrl ? "transparent" : `linear-gradient(135deg, ${color}, ${color}cc)`,
            border: logoUrl ? "1px solid rgba(13,27,46,0.1)" : "none",
            display: "flex", alignItems: "center", justifyContent: "center",
            overflow: "hidden", color: "#fff", fontSize: 11, fontWeight: 800,
          }}>
            {logoUrl
              ? <img src={logoUrl} alt="logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              : initials
            }
          </div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 800, color: "#0d1b2e", letterSpacing: "-0.2px" }}>{name || "Your Agency"}</div>
            {tagline && <div style={{ fontSize: 9.5, color: "rgba(13,27,46,0.45)", marginTop: 1 }}>{tagline}</div>}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 14, fontSize: 11, color: "rgba(13,27,46,0.5)", fontWeight: 500 }}>
          <span>{t.navItinerary}</span>
          <span>{t.navPricing}</span>
          <div style={{ padding: "6px 12px", borderRadius: 7, background: color, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
            <span>{t.bookWhatsApp}</span>
          </div>
        </div>
      </div>

      {/* Hero teaser */}
      <div style={{ display: "grid", gridTemplateColumns: isRtl ? "1fr 1.1fr" : "1.1fr 1fr" }}>
        {/* Copy */}
        <div style={{ padding: "28px 24px", background: "#fdfcf9", order: isRtl ? 2 : 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 9.5, fontWeight: 700, color, letterSpacing: isRtl ? "0.5px" : "1.2px", textTransform: "uppercase", marginBottom: 14 }}>
            <span style={{ width: 18, height: 1, background: color, display: "inline-block" }} />
            {t.yourDestination}
          </div>
          <div style={{ fontFamily: isRtl ? "'Cairo', sans-serif" : "'DM Serif Display', serif", fontSize: 26, lineHeight: isRtl ? 1.4 : 1.1, letterSpacing: isRtl ? "-0.3px" : "-0.5px", marginBottom: 10, color: "#0d1b2e" }}>
            {isRtl ? "شاهد البحر الأبيض يتلألأ عند الغروب" : "Watch the Aegean\nturn gold at dusk"}
          </div>
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 9.5, color: "rgba(13,27,46,0.45)", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 2 }}>{t.from}</div>
            <div style={{ fontFamily: isRtl ? "'Cairo', sans-serif" : "'DM Serif Display', serif", fontSize: 28, color: "#0d1b2e", letterSpacing: "-0.5px", lineHeight: 1 }}>€1,499</div>
            <div style={{ fontSize: 10, color: "rgba(13,27,46,0.4)", marginTop: 2 }}>{t.perPerson} · 5 {t.nightsLabel}</div>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <div style={{ padding: "8px 14px", borderRadius: 7, background: "#25d366", color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", gap: 5 }}>
              <span>📱</span> {t.viaWhatsAppShort}
            </div>
            <div style={{ padding: "8px 14px", borderRadius: 7, background: "transparent", border: "1.5px solid rgba(13,27,46,0.12)", color: "#0d1b2e", fontSize: 11, fontWeight: 600 }}>
              {t.messageMessenger}
            </div>
          </div>
        </div>
        {/* Image placeholder */}
        <div style={{ background: `linear-gradient(155deg, ${color}40 0%, ${color}90 100%)`, minHeight: 240, display: "flex", alignItems: "flex-end", padding: 12, order: isRtl ? 1 : 2 }}>
          <div style={{ padding: "4px 10px", borderRadius: 99, background: "rgba(255,255,255,0.85)", backdropFilter: "blur(6px)", fontSize: 9.5, fontWeight: 700, color: "#0d1b2e" }}>
            {t.editorsPick}
          </div>
        </div>
      </div>

      {/* Color accent bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, ${color}, ${color}55)` }} />
    </div>
  );
}

export default function BrandingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lang = useLang();
  const t = T[lang];

  const [uid, setUid] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [name, setName] = useState("");
  const [tagline, setTagline] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [brandColor, setBrandColor] = useState(COLOR_SWATCHES[0]);
  const [customColor, setCustomColor] = useState("");
  const [isCustom, setIsCustom] = useState(false);

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
        if (d.brandColor) {
          if (COLOR_SWATCHES.includes(d.brandColor)) {
            setBrandColor(d.brandColor);
          } else {
            setIsCustom(true);
            setCustomColor(d.brandColor);
          }
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
    const color = isCustom ? customColor : brandColor;
    await updateDoc(doc(db, "users", uid), { name, tagline, email, phone, logoUrl, brandColor: color });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const activeColor = isCustom ? customColor : brandColor;

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
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.4px" }}>{t.brandingTitle}</div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
              {t.brandingSubtitle}
            </div>
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

        <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 20 }}>

          {/* Left: Agency profile */}
          <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px", alignSelf: "start" }}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 18 }}>{t.agencyProfileLabel}</div>

            {/* Logo upload */}
            <div style={{ display: "flex", gap: 14, marginBottom: 18, alignItems: "center" }}>
              <div style={{
                width: 64, height: 64, borderRadius: 14, flexShrink: 0,
                background: logoUrl ? "transparent" : `linear-gradient(135deg, ${activeColor}, ${activeColor}99)`,
                border: logoUrl ? "1px solid rgba(255,255,255,0.1)" : "none",
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

            <FieldLabel>{t.headerColorLabel}</FieldLabel>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
              {COLOR_SWATCHES.map(c => (
                <button
                  key={c}
                  onClick={() => { setBrandColor(c); setIsCustom(false); }}
                  style={{
                    width: 28, height: 28, borderRadius: 7, background: c, cursor: "pointer",
                    border: !isCustom && brandColor === c ? "2px solid #fff" : "2px solid transparent",
                    boxShadow: !isCustom && brandColor === c ? "0 0 0 2px rgba(255,255,255,0.2)" : "none",
                    transition: "all .1s", flexShrink: 0,
                  }}
                />
              ))}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 28, height: 28, borderRadius: 7, background: isCustom ? customColor : "rgba(255,255,255,0.06)", border: isCustom ? "2px solid #fff" : "2px solid rgba(255,255,255,0.1)", flexShrink: 0, overflow: "hidden", position: "relative" }}>
                <input
                  type="color"
                  value={isCustom ? customColor : activeColor}
                  onChange={e => { setCustomColor(e.target.value); setIsCustom(true); }}
                  style={{ position: "absolute", inset: -4, width: "calc(100% + 8px)", height: "calc(100% + 8px)", cursor: "pointer", opacity: 0 }}
                />
              </div>
              <input
                value={isCustom ? customColor : activeColor}
                onChange={e => { setCustomColor(e.target.value); setIsCustom(true); }}
                placeholder="#hex"
                style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "6px 10px", color: "#fff", fontSize: 12, fontFamily: "monospace", outline: "none" }}
              />
              <div style={{ width: 28, height: 28, borderRadius: 7, background: activeColor, flexShrink: 0 }} />
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
              {t.colorUsedNote}
            </div>
          </div>

          {/* Right: live preview */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".6px", marginBottom: 12 }}>
              {t.livePreviewLabel}
            </div>
            <LandingPreview
              logoUrl={logoUrl}
              name={name}
              tagline={tagline}
              color={activeColor}
              lang={lang}
            />
            <div style={{ marginTop: 10, padding: "10px 14px", borderRadius: 9, background: "rgba(45,212,160,0.06)", border: "1px solid rgba(45,212,160,0.15)", fontSize: 11.5, color: "rgba(255,255,255,0.55)" }}>
              {t.changesApplyNote}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
