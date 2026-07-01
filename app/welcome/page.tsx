"use client";

// Agency welcome wizard — the guided first-run flow (editorial split-screen).
//
// Full-screen (NOT wrapped in AppLayout) so it stays focused. It collects the
// irreducible minimum — brand identity — writes it via the canonical
// brandDocPatch(), seeds a starter homepage, then hands off to the real editors.
// Experienced users can skip at any point; nothing here is ever locked.
//
// Layout: steps 1–3 use a dark-ink branded rail (progress + live preview) beside
// a clean form. Welcome (0) and Done (4) are full-bleed "moments". On mobile the
// rail becomes a compact header and the actions dock to a sticky bottom bar.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import posthog from "posthog-js";
import { useLang, switchLang } from "@/hooks/useLang";
import { useIsMobile } from "@/hooks/useIsMobile";
import { T } from "@/lib/translations";
import {
  BRAND_SWATCHES, ACCENT_SWATCHES, brandDocPatch, toFontPairing, DEFAULT_BRAND_COLOR,
} from "@/lib/brand";
import {
  readOnboarding, onboardingStepPatch, onboardingDismissPatch, onboardingCompletePatch,
} from "@/lib/onboarding";
import { defaultConfig, configDocPatch } from "@/lib/homepage";
import {
  BrandFormState, EMPTY_BRAND_FORM,
  TextField, LogoField, ColorField, FontPairingField, BrandPreview,
} from "@/components/brand/BrandFields";
import {
  DA_BG, DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3, DA_DARK,
  DA_RULE, DA_RULE2, DA_GOLD, DA_GOLD_SOFT, DA_GOLD_DEEP, DA_GREEN,
} from "@/lib/tokens";
import Icon from "@/components/Icon";

const DISPLAY = "var(--font-instrument-serif), Georgia, serif";
const SANS = "var(--font-inter-tight), system-ui, sans-serif";

const FORM_STEPS = [1, 2, 3] as const;
const LAST_FORM_STEP = 3;

// Cream tints for text on the dark ink rail.
const RAIL_CREAM = "#f4f0e8";
const RAIL_MUTE = "rgba(244,240,232,.52)";
const RAIL_FAINT = "rgba(244,240,232,.30)";

export default function WelcomePage() {
  const router = useRouter();
  const lang = useLang();
  const t = T[lang];
  const isAr = lang === "ar";
  const isMobile = useIsMobile();

  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState(0);
  const [brand, setBrand] = useState<BrandFormState>(EMPTY_BRAND_FORM);
  const [saving, setSaving] = useState(false);
  const [nameError, setNameError] = useState(false);
  const prevOnboarding = useRef(readOnboarding(null));

  // ── Auth guard + prefill ──────────────────────────────────────────────────
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.replace("/login"); return; }
      setUid(user.uid);
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const d = snap.data() || {};
        prevOnboarding.current = readOnboarding(d);
        const savedLang = d.lang as "en" | "ar" | undefined;
        if (savedLang === "en" || savedLang === "ar") switchLang(savedLang);
        setBrand({
          name: String(d.name || "") === String(d.email || "") ? "" : String(d.name || ""),
          tagline: String(d.tagline || ""),
          logoUrl: String(d.logoUrl || ""),
          brandColor: String(d.brandColor || "") || DEFAULT_BRAND_COLOR,
          accentColor: String(d.accentColor || ""),
          fontPairing: toFontPairing(d.fontPairing),
          whatsapp: String(d.whatsapp || ""),
          phone: String(d.phone || ""),
          email: String(d.email || ""),
          socials: (d.socials as BrandFormState["socials"]) || {},
        });
        const cur = prevOnboarding.current.currentStep;
        if (cur >= 1 && cur <= LAST_FORM_STEP) setStep(cur);
      } catch {
        /* keep defaults */
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const set = (patch: Partial<BrandFormState>) => setBrand((b) => ({ ...b, ...patch }));

  const persist = async (nextStep: number) => {
    if (!uid) return;
    await updateDoc(doc(db, "users", uid), {
      ...brandDocPatch({
        name: brand.name || (lang === "ar" ? "وكالتي" : "My Agency"),
        tagline: brand.tagline,
        logoUrl: brand.logoUrl,
        brandColor: brand.brandColor || DEFAULT_BRAND_COLOR,
        accentColor: brand.accentColor,
        fontPairing: brand.fontPairing,
        whatsapp: brand.whatsapp,
        phone: brand.phone,
        email: brand.email,
        socials: brand.socials,
      }),
      ...onboardingStepPatch(prevOnboarding.current, nextStep),
    });
    prevOnboarding.current = onboardingStepPatch(prevOnboarding.current, nextStep).onboarding;
  };

  const goNext = async () => {
    if (step === 1 && !brand.name.trim()) { setNameError(true); return; }
    setNameError(false);
    if (step === 0) {
      posthog.capture("onboarding_started");
      await updateDoc(doc(db, "users", uid!), onboardingStepPatch(prevOnboarding.current, 1)).catch(() => {});
      prevOnboarding.current = onboardingStepPatch(prevOnboarding.current, 1).onboarding;
      setStep(1);
      return;
    }
    if (step >= 1 && step < LAST_FORM_STEP) {
      setSaving(true);
      await persist(step + 1).catch(() => {});
      setSaving(false);
      posthog.capture("onboarding_step", { step: step + 1 });
      setStep(step + 1);
      return;
    }
    if (step === LAST_FORM_STEP) {
      await finish();
    }
  };

  const goBack = () => {
    setNameError(false);
    if (step > 0) setStep(step - 1);
  };

  const skip = async () => {
    if (uid) {
      await updateDoc(doc(db, "users", uid), onboardingDismissPatch(prevOnboarding.current)).catch(() => {});
    }
    posthog.capture("onboarding_dismissed", { at_step: step });
    router.push("/dashboard");
  };

  const finish = async () => {
    if (!uid) return;
    setSaving(true);
    try {
      const snap = await getDoc(doc(db, "users", uid));
      const d = snap.data() || {};
      const patch: Record<string, unknown> = {
        ...brandDocPatch({
          name: brand.name || (lang === "ar" ? "وكالتي" : "My Agency"),
          tagline: brand.tagline,
          logoUrl: brand.logoUrl,
          brandColor: brand.brandColor || DEFAULT_BRAND_COLOR,
          accentColor: brand.accentColor,
          fontPairing: brand.fontPairing,
          whatsapp: brand.whatsapp,
          phone: brand.phone,
          email: brand.email,
          socials: brand.socials,
        }),
        ...onboardingCompletePatch(prevOnboarding.current),
      };
      if (!d.homepage) {
        const hasContact = !!(brand.whatsapp || brand.phone || brand.email);
        patch.homepage = configDocPatch(defaultConfig("home", { hasContact }), "home").homepage;
      }
      await updateDoc(doc(db, "users", uid), patch);
      prevOnboarding.current = onboardingCompletePatch(prevOnboarding.current).onboarding;
      posthog.capture("onboarding_completed");
      setStep(4);
    } finally {
      setSaving(false);
    }
  };

  const stepTitle = useMemo(() => {
    switch (step) {
      case 1: return t.wizIdentityTitle;
      case 2: return t.wizLookTitle;
      case 3: return t.wizContactTitle;
      default: return "";
    }
  }, [step, t]);
  const stepSub = step === 1 ? t.wizIdentitySub : step === 2 ? t.wizLookSub : t.wizContactSub;

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: DA_BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{
          width: 22, height: 22, borderRadius: "50%",
          border: `2px solid ${DA_RULE2}`, borderTopColor: DA_GOLD,
          display: "inline-block", animation: "auth-spin 0.8s linear infinite",
        }} />
      </div>
    );
  }

  // ── Full-bleed moments: Welcome (0) and Done (4) ────────────────────────────
  if (step === 0) {
    return <WelcomeStep t={t} isAr={isAr} isMobile={isMobile} onStart={goNext} onSkip={skip} />;
  }
  if (step === 4) {
    return (
      <DoneStep
        t={t} isAr={isAr} isMobile={isMobile}
        onBuild={() => router.push("/builder")}
        onHomepage={() => router.push("/homepage")}
        onDashboard={() => router.push("/dashboard")}
      />
    );
  }

  // ── Form steps 1–3: editorial split ─────────────────────────────────────────
  const formBody = (
    <div key={step} className="fade-up" style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {step === 1 && (
        <>
          <LogoField uid={uid!} lang={lang} logoUrl={brand.logoUrl} onChange={(url) => set({ logoUrl: url })} />
          <div>
            <TextField
              label={t.agencyNameLabel}
              value={brand.name}
              onChange={(v) => { set({ name: v }); if (v.trim()) setNameError(false); }}
              placeholder={t.wizNamePlaceholder}
            />
            {nameError && <div style={{ fontFamily: SANS, fontSize: 12, color: "#c0533a", marginTop: 6 }}>{t.wizNameRequired}</div>}
          </div>
          <TextField label={t.taglineLabel} value={brand.tagline} onChange={(v) => set({ tagline: v })} placeholder={t.wizTaglinePlaceholder} />
        </>
      )}

      {step === 2 && (
        <>
          <ColorField label={t.headerColorLabel} value={brand.brandColor} onChange={(v) => set({ brandColor: v })} swatches={BRAND_SWATCHES} lang={lang} showContrast />
          <ColorField label={t.accentColorLabel} value={brand.accentColor} onChange={(v) => set({ accentColor: v })} swatches={ACCENT_SWATCHES} lang={lang} fallback={brand.brandColor} />
          <div>
            <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: DA_INK2, marginBottom: 8 }}>{t.typographyLabel}</div>
            <FontPairingField value={brand.fontPairing} onChange={(id) => set({ fontPairing: id })} lang={lang} />
          </div>
        </>
      )}

      {step === 3 && (
        <>
          <TextField label={t.wizWhatsappLabel} value={brand.whatsapp} onChange={(v) => set({ whatsapp: v })} placeholder={t.wizWhatsappPlaceholder} type="tel" dir="ltr" />
          <TextField label={t.wizPhoneLabel} value={brand.phone} onChange={(v) => set({ phone: v })} type="tel" dir="ltr" />
          <TextField label={t.wizEmailLabel} value={brand.email} onChange={(v) => set({ email: v })} type="email" dir="ltr" />
          <TextField label={t.wizInstagramLabel} value={brand.socials.instagram || ""} onChange={(v) => set({ socials: { ...brand.socials, instagram: v } })} placeholder={t.wizInstagramPlaceholder} dir="ltr" />
          <div style={{
            display: "flex", gap: 8, alignItems: "flex-start",
            padding: "10px 12px", borderRadius: 9,
            background: DA_GOLD_SOFT, fontFamily: SANS, fontSize: 12, color: DA_GOLD_DEEP, lineHeight: 1.5,
          }}>
            <Icon name="whatsapp" size={15} color={DA_GOLD_DEEP} />
            <span>{t.wizContactHint}</span>
          </div>
        </>
      )}
    </div>
  );

  const navButtons = (sticky: boolean) => (
    <div style={{
      display: "flex", alignItems: "center", gap: 12,
      ...(sticky
        ? {
            position: "sticky", bottom: 0, insetInline: 0,
            padding: "12px 18px calc(12px + env(safe-area-inset-bottom, 0px))",
            background: DA_SURFACE, borderTop: `1px solid ${DA_RULE}`,
          }
        : { marginTop: 30 }),
    }}>
      <button onClick={goBack} style={{
        padding: "12px 18px", borderRadius: 11,
        background: "none", border: `1px solid ${DA_RULE2}`,
        color: DA_INK2, fontFamily: SANS, fontSize: 14, fontWeight: 500, cursor: "pointer",
      }}>
        {t.wizBack}
      </button>
      <button onClick={goNext} disabled={saving} style={{
        flex: 1, padding: "13px 20px", borderRadius: 11,
        background: DA_GOLD, color: "#fff", border: "none",
        fontFamily: SANS, fontSize: 14, fontWeight: 600,
        cursor: saving ? "not-allowed" : "pointer", opacity: saving ? 0.75 : 1,
        display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
        boxShadow: "0 1px 2px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.15)",
      }}>
        {saving ? t.wizSaving : step === LAST_FORM_STEP ? t.wizFinish : t.wizNext}
        {!saving && <Icon name="arrow_right" size={15} color="#fff" strokeWidth={2} />}
      </button>
    </div>
  );

  // ── Mobile ──────────────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div dir={isAr ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: DA_SURFACE, fontFamily: SANS, display: "flex", flexDirection: "column" }}>
        {/* Compact ink header */}
        <div style={{ background: DA_DARK, padding: "16px 18px 18px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at 85% 0%, rgba(176,138,62,.22), transparent 60%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: 7, background: DA_GOLD, color: DA_DARK, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, fontFamily: DISPLAY }}>P</div>
              <span style={{ fontFamily: SANS, fontSize: 12, color: RAIL_MUTE }}>{t.wizStep} {step} {t.wizOf} {LAST_FORM_STEP}</span>
            </div>
            <button onClick={skip} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: SANS, fontSize: 12.5, color: RAIL_MUTE }}>{t.wizSkip}</button>
          </div>
          <div style={{ position: "relative", display: "flex", gap: 5 }}>
            {FORM_STEPS.map((s) => (
              <div key={s} style={{ flex: 1, height: 4, borderRadius: 2, background: s <= step ? DA_GOLD : "rgba(244,240,232,.18)" }} />
            ))}
          </div>
        </div>

        {/* Scrollable form */}
        <div style={{ flex: 1, padding: "22px 18px 24px" }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 28, color: DA_INK1, letterSpacing: -0.6, lineHeight: 1.08 }}>{stepTitle}</div>
          <div style={{ fontFamily: SANS, fontSize: 13.5, color: DA_INK2, marginTop: 7, marginBottom: 22, lineHeight: 1.55 }}>{stepSub}</div>
          {formBody}

          {/* Compact live preview */}
          <div style={{ marginTop: 26 }}>
            <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: DA_INK3, marginBottom: 10 }}>{t.wizPreviewLabel}</div>
            <BrandPreview brand={brand} lang={lang} />
          </div>
        </div>

        {navButtons(true)}
      </div>
    );
  }

  // ── Desktop: split-screen ────────────────────────────────────────────────────
  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ display: "flex", minHeight: "100vh", background: DA_SURFACE, fontFamily: SANS }}>
      {/* Ink rail */}
      <div style={{
        width: "40%", maxWidth: 480, minWidth: 380,
        background: DA_DARK, color: RAIL_CREAM,
        position: "sticky", top: 0, alignSelf: "stretch",
        height: "100vh", overflow: "hidden",
        padding: "40px 44px", boxSizing: "border-box",
        display: "flex", flexDirection: "column",
      }}>
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at 100% 0%, rgba(176,138,62,.20), transparent 55%), radial-gradient(circle at 0% 100%, rgba(176,138,62,.10), transparent 50%)" }} />

        {/* Wordmark */}
        <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: DA_GOLD, color: DA_DARK, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 700, fontFamily: DISPLAY }}>P</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 20, color: RAIL_CREAM }}>Packmetrix</div>
        </div>

        {/* Headline */}
        <div style={{ position: "relative", marginTop: 40 }}>
          <div style={{ fontFamily: DISPLAY, fontSize: 40, lineHeight: 1.06, letterSpacing: -1, color: RAIL_CREAM }}>{t.wizWelcomeTitle}</div>
        </div>

        {/* Step list */}
        <div style={{ position: "relative", marginTop: 36, display: "flex", flexDirection: "column", gap: 4 }}>
          {FORM_STEPS.map((s) => {
            const label = s === 1 ? t.wizIdentityTitle : s === 2 ? t.wizLookTitle : t.wizContactTitle;
            // Tick the current step the moment it's committed (save in flight) —
            // otherwise the last step (which jumps straight to the Done screen)
            // would never reach the "done" state.
            const done = s < step || (saving && s === step);
            const active = s === step && !done;
            return (
              <div key={s} style={{ display: "flex", alignItems: "center", gap: 14, padding: "11px 0" }}>
                <div style={{
                  width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
                  background: done ? DA_GOLD : active ? "rgba(176,138,62,.18)" : "transparent",
                  border: active ? `1.5px solid ${DA_GOLD}` : done ? "none" : `1px solid ${RAIL_FAINT}`,
                  color: done ? DA_DARK : active ? DA_GOLD : RAIL_FAINT,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: SANS, fontSize: 13, fontWeight: 600,
                }}>
                  {done ? <Icon name="check" size={15} color={DA_DARK} strokeWidth={2.5} /> : s}
                </div>
                <span style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: active ? 600 : 500, color: active ? RAIL_CREAM : done ? RAIL_MUTE : RAIL_FAINT }}>{label}</span>
              </div>
            );
          })}
        </div>

        {/* Live preview card */}
        <div style={{ position: "relative", marginTop: "auto" }}>
          <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: 1.2, textTransform: "uppercase", color: RAIL_MUTE, marginBottom: 12 }}>{t.wizPreviewLabel}</div>
          <BrandPreview brand={brand} lang={lang} />
        </div>
      </div>

      {/* Form column */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", overflowY: "auto", height: "100vh" }}>
        <div style={{ width: "100%", maxWidth: 520, padding: "48px 48px 56px", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
          {/* Top row: progress + skip */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
            <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: DA_GOLD_DEEP }}>{t.wizStep} {step} {t.wizOf} {LAST_FORM_STEP}</div>
            <button onClick={skip} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: SANS, fontSize: 13, color: DA_INK3, fontWeight: 500 }}>{t.wizSkip}</button>
          </div>

          <div style={{ fontFamily: DISPLAY, fontSize: 36, color: DA_INK1, letterSpacing: -0.8, lineHeight: 1.08 }}>{stepTitle}</div>
          <div style={{ fontFamily: SANS, fontSize: 14.5, color: DA_INK2, marginTop: 9, marginBottom: 30, lineHeight: 1.55, maxWidth: 440 }}>{stepSub}</div>

          {formBody}
          {navButtons(false)}
        </div>
      </div>
    </div>
  );
}

// ── Step 0: Welcome (full-bleed moment) ─────────────────────────────────────

function WelcomeStep({
  t, isAr, isMobile, onStart, onSkip,
}: {
  t: typeof T["en"]; isAr: boolean; isMobile: boolean;
  onStart: () => void; onSkip: () => void;
}) {
  const points = [t.wizWelcomePt1, t.wizWelcomePt2, t.wizWelcomePt3];
  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{
      minHeight: "100vh", background: DA_DARK, fontFamily: SANS,
      display: "flex", flexDirection: "column", position: "relative", overflow: "hidden",
    }}>
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(circle at 20% 0%, rgba(176,138,62,.20), transparent 55%), radial-gradient(circle at 85% 100%, rgba(176,138,62,.12), transparent 50%)" }} />

      {/* Top wordmark */}
      <div style={{ position: "relative", padding: isMobile ? "22px 22px" : "28px 40px", display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, background: DA_GOLD, color: DA_DARK, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, fontFamily: DISPLAY }}>P</div>
        <div style={{ fontFamily: DISPLAY, fontSize: 19, color: RAIL_CREAM }}>Packmetrix</div>
      </div>

      {/* Centered content */}
      <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: isMobile ? "8px 24px 40px" : "0 32px 40px" }}>
        <div className="fade-up" style={{ maxWidth: 560 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "5px 13px", borderRadius: 999,
            background: "rgba(176,138,62,.16)", border: `1px solid rgba(176,138,62,.3)`,
            fontFamily: SANS, fontSize: 11.5, fontWeight: 600, color: DA_GOLD, letterSpacing: 0.4, marginBottom: 22,
          }}>
            <Icon name="sparkle" size={13} color={DA_GOLD} />
            {t.wizWelcomeEyebrow}
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: isMobile ? 40 : 60, color: RAIL_CREAM, letterSpacing: -1.4, lineHeight: 1.02 }}>
            {t.wizWelcomeTitle}
          </div>
          <div style={{ fontFamily: SANS, fontSize: isMobile ? 14.5 : 16, color: RAIL_MUTE, marginTop: 18, lineHeight: 1.6, maxWidth: 500, marginInline: "auto" }}>
            {t.wizWelcomeBody}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 380, margin: "30px auto 0", textAlign: isAr ? "right" : "left" }}>
            {points.map((p) => (
              <div key={p} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 24, height: 24, borderRadius: "50%", flexShrink: 0, background: "rgba(176,138,62,.18)", border: `1px solid rgba(176,138,62,.4)`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon name="check" size={13} color={DA_GOLD} strokeWidth={2.5} />
                </div>
                <span style={{ fontFamily: SANS, fontSize: 14, color: RAIL_CREAM }}>{p}</span>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 34, display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
            <button onClick={onStart} style={{
              padding: "15px 36px", borderRadius: 13,
              background: DA_GOLD, color: DA_DARK, border: "none",
              fontFamily: SANS, fontSize: 15.5, fontWeight: 700, cursor: "pointer",
              display: "inline-flex", alignItems: "center", gap: 9,
              boxShadow: "0 8px 24px -8px rgba(176,138,62,.5)",
            }}>
              {t.wizWelcomeStart}
              <Icon name="arrow_right" size={17} color={DA_DARK} strokeWidth={2.2} />
            </button>
            <div style={{ fontFamily: SANS, fontSize: 12, color: RAIL_FAINT }}>{t.wizWelcomeTime}</div>
            <button onClick={onSkip} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: SANS, fontSize: 13, color: RAIL_MUTE, fontWeight: 500, textDecoration: "underline" }}>
              {t.wizWelcomeSkip}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step 4: Done (full-bleed moment) ────────────────────────────────────────

function DoneStep({
  t, isAr, isMobile, onBuild, onHomepage, onDashboard,
}: {
  t: typeof T["en"]; isAr: boolean; isMobile: boolean;
  onBuild: () => void; onHomepage: () => void; onDashboard: () => void;
}) {
  const cards = [
    { icon: "package" as const, title: t.wizDoneBuildPkg, sub: t.wizDoneBuildPkgSub, action: onBuild, primary: true },
    { icon: "home" as const, title: t.wizDoneHomepage, sub: t.wizDoneHomepageSub, action: onHomepage, primary: false },
  ];
  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{ minHeight: "100vh", background: DA_BG, fontFamily: SANS, display: "flex", alignItems: "center", justifyContent: "center", padding: isMobile ? "32px 20px" : "40px" }}>
      <div className="fade-up" style={{ width: "100%", maxWidth: 620, textAlign: "center" }}>
        <div style={{ width: 66, height: 66, borderRadius: "50%", margin: "0 auto 22px", background: DA_GREEN, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 10px 30px -10px rgba(77,138,94,.6)" }}>
          <Icon name="check" size={32} color="#fff" strokeWidth={2.5} />
        </div>
        <div style={{ fontFamily: SANS, fontSize: 11.5, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: DA_GREEN, marginBottom: 10 }}>{t.wizDoneEyebrow}</div>
        <div style={{ fontFamily: DISPLAY, fontSize: isMobile ? 34 : 48, color: DA_INK1, letterSpacing: -1.2, lineHeight: 1.04 }}>{t.wizDoneTitle}</div>
        <div style={{ fontFamily: SANS, fontSize: 15, color: DA_INK2, marginTop: 14, lineHeight: 1.6, maxWidth: 480, marginInline: "auto" }}>{t.wizDoneBody}</div>

        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 14, marginTop: 34, textAlign: isAr ? "right" : "left" }}>
          {cards.map((c) => (
            <button key={c.title} onClick={c.action} style={{
              padding: 22, borderRadius: 16, cursor: "pointer",
              background: c.primary ? DA_GOLD_SOFT : DA_SURFACE,
              border: `1px solid ${c.primary ? DA_GOLD : DA_RULE}`,
              display: "flex", flexDirection: "column", gap: 11, alignItems: "flex-start",
              boxShadow: c.primary ? "0 8px 24px -14px rgba(176,138,62,.5)" : "none",
              transition: "transform .12s",
            }}
              onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={(e) => (e.currentTarget.style.transform = "none")}
            >
              <div style={{ width: 42, height: 42, borderRadius: 12, background: c.primary ? DA_GOLD : DA_SURFACE2, border: c.primary ? "none" : `1px solid ${DA_RULE}`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name={c.icon} size={20} color={c.primary ? "#fff" : DA_INK2} />
              </div>
              <div style={{ fontFamily: SANS, fontSize: 15.5, fontWeight: 600, color: DA_INK1 }}>{c.title}</div>
              <div style={{ fontFamily: SANS, fontSize: 12.5, color: DA_INK2, lineHeight: 1.5 }}>{c.sub}</div>
            </button>
          ))}
        </div>

        <button onClick={onDashboard} style={{ marginTop: 24, background: "none", border: "none", cursor: "pointer", fontFamily: SANS, fontSize: 13.5, color: DA_INK2, fontWeight: 500, display: "inline-flex", alignItems: "center", gap: 6 }}>
          {t.wizDoneDashboard}
          <Icon name="arrow_right" size={14} color={DA_INK2} strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
