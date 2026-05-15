"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";
import Icon from "@/components/Icon";
import TemplateSelector from "@/components/TemplateSelector";
import PackageRenderer from "@/components/PackageRenderer";
import { useLang } from "@/hooks/useLang";
import { useIsMobile } from "@/hooks/useIsMobile";
import { T } from "@/lib/translations";
import { DEFAULT_TEMPLATE_ID, TEMPLATE_MAP } from "@/components/templates/index";
import { IsDesktopProvider } from "@/components/templates/shared";
import type { TPackage, TAgency } from "@/components/templates/types";

const SAND = "#e8c97b";
const SUCCESS = "#2dd4a0";

// ─── Mock package for preview when agency has no packages ────────────────────

const MOCK_PACKAGE: TPackage = {
  id: "preview-mock",
  destination: "Santorini, Greece",
  price: "€1,499",
  nights: "7",
  title: "Santorini Escape · 7 Nights of Azure Bliss",
  description:
    "Immerse yourself in the iconic white-washed villages of Oia and Fira. Watch the world-famous sunset from your private terrace, cruise the caldera at dusk, and savour fresh seafood by the sea.",
  includes: [
    "Return flights from your city",
    "7 nights boutique cave hotel",
    "Private caldera cruise",
    "Daily breakfast",
    "Airport transfers",
  ],
  excludes: ["Travel insurance", "Personal expenses"],
  hotelDescription:
    "Your home is a carved cave suite in Oia, perched on the rim of the caldera with uninterrupted views of the volcanic islands and the Aegean Sea.",
  airports: [
    { name: "London Heathrow (LHR)", arrivingAirport: "Santorini (JTR)", price: "€1,499", date: "15 Nov", flyingTime: "09:00", arrivingTime: "14:30" },
    { name: "Amsterdam (AMS)", arrivingAirport: "Santorini (JTR)", price: "€1,350", date: "15 Nov", flyingTime: "10:15", arrivingTime: "15:00" },
  ],
  itinerary: [
    { day: 1, title: "Arrival & Oia sunset", desc: "Check in, walk to the famous sunset viewpoint and enjoy your first caldera dinner." },
    { day: 2, title: "Caldera boat cruise", desc: "Private catamaran to the volcanic islands, hot springs, and sea caves." },
    { day: 3, title: "Fira & local wine", desc: "Explore Fira's museums and taste the island's unique Assyrtiko wines." },
    { day: 4, title: "Hidden beaches day", desc: "Visit Red Beach and Perissa, both unique to Santorini's volcanic landscape." },
    { day: 5, title: "Akrotiri ruins & farm", desc: "The prehistoric city of Akrotiri and a local tomato factory visit." },
    { day: 6, title: "Cooking class", desc: "Learn to cook traditional Greek mezze with a local chef." },
    { day: 7, title: "Departure", desc: "Late checkout, final stroll through Oia, transfer to the airport." },
  ],
  pricingTiers: [
    { label: "Per person (2 pax)", price: "€1,499" },
    { label: "Solo traveller", price: "€1,799" },
    { label: "Child (2–11)", price: "€899" },
    { label: "Infant (under 2)", price: "€0" },
  ],
  cancellation: "Free cancellation up to 30 days before departure",
  whatsapp: "+1234567890",
  messenger: "youragency",
  coverImage: "https://images.pexels.com/photos/1285625/pexels-photo-1285625.jpeg?auto=compress&cs=tinysrgb&w=1260",
  images: [
    "https://images.pexels.com/photos/3264720/pexels-photo-3264720.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/1010657/pexels-photo-1010657.jpeg?auto=compress&cs=tinysrgb&w=800",
    "https://images.pexels.com/photos/2245435/pexels-photo-2245435.jpeg?auto=compress&cs=tinysrgb&w=800",
  ],
  language: "en",
  isActive: true,
  reviews: [
    { id: "r1", name: "Sophie M.", text: "Absolutely magical trip — the cave suite was beyond our expectations.", rating: 5 },
    { id: "r2", name: "James & Anna K.", text: "The private cruise at sunset was the highlight. Will definitely book again!", rating: 5 },
    { id: "r3", name: "Laila R.", text: "Seamless from start to finish. Thank you for a perfect honeymoon.", rating: 5 },
  ],
};

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

// ─── Scaled template preview ─────────────────────────────────────────────────

function TemplatePreview({ pkg, agency, lang, templateId, fillHeight }: {
  pkg: TPackage; agency: TAgency; lang: "en" | "ar"; templateId: string; fillHeight?: boolean;
}) {
  const tpl = TEMPLATE_MAP[templateId] || TEMPLATE_MAP[DEFAULT_TEMPLATE_ID];
  const Page = tpl.Page;
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerW, setContainerW] = useState(0);
  const [containerH, setContainerH] = useState(0);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const t = T[lang];

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const sync = (w: number, h: number) => {
      setContainerW(p => Math.abs(p - w) > 1 ? w : p);
      setContainerH(p => Math.abs(p - h) > 1 ? h : p);
    };
    const { width, height } = el.getBoundingClientRect();
    sync(width, height);
    // overflow:hidden on the root stops the ResizeObserver loop by decoupling
    // the container's size from its children's rendered size.
    const ro = new ResizeObserver(entries => {
      const { width: w, height: h } = entries[0].contentRect;
      sync(w, h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const DESKTOP_RENDER_W = 1280;
  const MOBILE_RENDER_W = 390;
  const effectiveW = containerW || 760;
  const desktopScale = effectiveW / DESKTOP_RENDER_W;
  const PHONE_DISPLAY_W = Math.min(260, effectiveW * 0.38);
  const mobileScale = PHONE_DISPLAY_W / MOBILE_RENDER_W;

  // Phone screen height: use ideal 9:19 ratio, capped by available container space.
  // 160px accounts for the phone frame chrome + toggle row + note bar.
  const phoneScreenH = Math.max(400, Math.min(
    Math.round(PHONE_DISPLAY_W * 19 / 9),
    (containerH || 700) - 160,
  ));

  // Fallback fixed preview height used when not filling the parent column
  const PREVIEW_H = "clamp(400px, calc(100vh - 320px), 800px)";

  const rootStyle: React.CSSProperties = fillHeight
    ? { width: "100%", height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }
    : { width: "100%", overflow: "hidden" };

  return (
    <div ref={containerRef} style={rootStyle}>
      {/* Toggle + label row */}
      <div style={{ flexShrink: 0, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase" as const, letterSpacing: ".6px" }}>
          {t.livePreviewLabel}
        </div>
        <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.06)", borderRadius: 8, padding: 3, gap: 2 }}>
          {(["desktop", "mobile"] as const).map(mode => (
            <button
              key={mode}
              onClick={() => setPreviewMode(mode)}
              style={{
                padding: "5px 14px", borderRadius: 6, border: "none", cursor: "pointer", fontFamily: "inherit",
                fontSize: 11.5, fontWeight: 600,
                background: previewMode === mode ? "rgba(255,255,255,0.12)" : "transparent",
                color: previewMode === mode ? "#fff" : "rgba(255,255,255,0.4)",
                transition: "all 0.15s",
              }}
            >
              {mode === "desktop" ? t.previewDesktopBtn : t.previewMobileBtn}
            </button>
          ))}
        </div>
      </div>

      {/* Preview frame — grows to fill remaining height when fillHeight=true */}
      <div style={fillHeight
        ? { flex: 1, minHeight: 0, overflow: "hidden" }
        : { overflow: "hidden" }
      }>
        {previewMode === "desktop" ? (
          <IsDesktopProvider value={true}>
            <div style={{
              borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)",
              overflow: "hidden", boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
              ...(fillHeight
                ? { height: "100%", display: "flex", flexDirection: "column" }
                : {}),
            }}>
              {/* Browser chrome */}
              <div style={{ height: 32, background: "#1c2333", display: "flex", alignItems: "center", padding: "0 14px", gap: 8, flexShrink: 0 }}>
                <div style={{ display: "flex", gap: 5 }}>
                  {["#ef4444", "#f59e0b", "#22c55e"].map((c, i) => (
                    <div key={i} style={{ width: 9, height: 9, borderRadius: "50%", background: c, opacity: 0.7 }} />
                  ))}
                </div>
                <div style={{ flex: 1, background: "rgba(255,255,255,0.06)", borderRadius: 5, padding: "3px 12px", fontSize: 10, color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                  packmetrix.com / your-agency / …
                </div>
              </div>
              {/* Scrollable scaled template */}
              <div style={{
                overflowY: "auto", overflowX: "hidden", background: "#fff", position: "relative",
                ...(fillHeight
                  ? { flex: 1, minHeight: 0 }
                  : { height: PREVIEW_H, minHeight: 480 }),
              }}>
                <div style={{ width: DESKTOP_RENDER_W, zoom: desktopScale, transformOrigin: "top left", pointerEvents: "none" }}>
                  <Page pkg={pkg} agency={agency} lang={lang} onWhatsApp={() => {}} onMessenger={() => {}} />
                </div>
              </div>
            </div>
          </IsDesktopProvider>
        ) : (
          /* ── Mobile preview ── */
          <IsDesktopProvider value={false}>
            <div style={{
              display: "flex", justifyContent: "center",
              ...(fillHeight ? { alignItems: "center", height: "100%" } : {}),
            }}>
              <div style={{ flexShrink: 0 }}>
                <div style={{
                  width: PHONE_DISPLAY_W + 14, borderRadius: 36,
                  background: "#1a1a2e", padding: "14px 7px 20px",
                  boxShadow: "0 32px 80px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.1)",
                }}>
                  <div style={{ width: 60, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.15)", margin: "0 auto 10px" }} />
                  {/* Screen — clips content; inner div scrolls */}
                  <div style={{
                    width: PHONE_DISPLAY_W,
                    height: fillHeight ? phoneScreenH : 560,
                    borderRadius: 20,
                    overflow: "hidden", background: "#fff",
                  }}>
                    <div style={{ overflowY: "auto", overflowX: "hidden", height: "100%" }}>
                      <div style={{ width: MOBILE_RENDER_W, zoom: mobileScale, transformOrigin: "top left", pointerEvents: "none" }}>
                        <Page pkg={pkg} agency={agency} lang={lang} onWhatsApp={() => {}} onMessenger={() => {}} />
                      </div>
                    </div>
                  </div>
                  <div style={{ width: 80, height: 4, borderRadius: 2, background: "rgba(255,255,255,0.2)", margin: "12px auto 0" }} />
                </div>
              </div>
            </div>
          </IsDesktopProvider>
        )}
      </div>

      <div style={{ flexShrink: 0, marginTop: 10, padding: "10px 14px", borderRadius: 9, background: "rgba(45,212,160,0.06)", border: "1px solid rgba(45,212,160,0.15)", fontSize: 11.5, color: "rgba(255,255,255,0.55)" }}>
        {t.changesApplyNote}
      </div>
    </div>
  );
}

// ─── Placeholder shown when no packages exist ────────────────────────────────

function NoPackagePreview({ lang }: { lang: "en" | "ar" }) {
  const t = T[lang];
  return (
    <div style={{ width: "100%", height: 580, borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14 }}>
      <div style={{ width: 52, height: 52, borderRadius: 14, background: `${SAND}12`, border: `1px solid ${SAND}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon name="map" size={22} color={SAND} />
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 600 }}>{t.noPackages}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 5 }}>{t.createFirst}</div>
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
  const [templateSaving, setTemplateSaving] = useState(false);

  const [previewPkg, setPreviewPkg] = useState<TPackage | null>(null);

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
      }

      // Load first package for live preview; fall back to mock data
      const pkgSnap = await getDocs(query(collection(db, "packages"), where("userId", "==", u.uid)));
      if (!pkgSnap.empty) {
        const first = pkgSnap.docs[0];
        setPreviewPkg({ id: first.id, ...first.data() } as TPackage);
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

  const handleSelectTemplate = async (id: string) => {
    setActiveTemplate(id);
    if (!uid) return;
    setTemplateSaving(true);
    await updateDoc(doc(db, "users", uid), { activeTemplate: id });
    setTemplateSaving(false);
  };

  if (authLoading) {
    return (
      <AppLayout>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="spinner" />
        </div>
      </AppLayout>
    );
  }

  // Agency object for live preview — use mock data if no packages
  const previewAgency: TAgency = { name: name || "Your Agency", tagline, logoUrl, activeTemplate, enableReviews, showReviews };
  const previewPackage = previewPkg || MOCK_PACKAGE;

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

        {/* Two-column layout. On desktop: fills remaining height, left panel scrolls
            independently, right panel's TemplatePreview takes full column height. */}
        <div style={isMobile ? {
          display: "flex", flexDirection: "column", gap: 16,
        } : {
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: "380px 1fr",
          gap: 20,
        }}>

          {/* Left: settings + template selector */}
          <div style={isMobile ? {
            display: "flex", flexDirection: "column", gap: 16,
          } : {
            display: "flex", flexDirection: "column", gap: 16,
            overflowY: "auto",
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

            {/* Template selector */}
            <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px" }}>
              {templateSaving && (
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12, fontSize: 11.5, color: "rgba(45,212,160,0.8)" }}>
                  <span className="spinner" style={{ width: 12, height: 12, borderTopColor: "#2dd4a0" }} />
                  {t.savingBtn}
                </div>
              )}
              <TemplateSelector
                activeTemplateId={activeTemplate}
                lang={lang}
                onSelect={handleSelectTemplate}
              />
            </div>
          </div>

          {/* Right: live template preview.
              minWidth:0 stops the grid track growing to the 1280px rendered template width.
              overflow:hidden clips the ResizeObserver-measured container correctly. */}
          <div style={isMobile ? { minWidth: 0 } : { minWidth: 0, overflow: "hidden" }}>
            <TemplatePreview
              pkg={previewPackage}
              agency={previewAgency}
              lang={lang}
              templateId={activeTemplate}
              fillHeight={!isMobile}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
