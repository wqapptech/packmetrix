"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";
import Icon from "@/components/Icon";
import { useLang } from "@/hooks/useLang";
import { useIsMobile } from "@/hooks/useIsMobile";
import { T } from "@/lib/translations";
import posthog from "posthog-js";
import { FREE_AI_LIMIT } from "@/lib/limits";
import { hasFullAccess } from "@/lib/trial";
import type { AnySectionInstance, CoreForm } from "@/lib/sections/types";
import { DEFAULT_CORE_FORM } from "@/lib/sections/index";
import { CoreFieldsEditor } from "@/components/builder/CoreFieldsEditor";
import { SectionList } from "@/components/builder/SectionList";
import { PresetPicker } from "@/components/builder/PresetPicker";
import { MiniPreview } from "@/components/builder/MiniPreview";
import { TemplateExtrasEditor, DEFAULT_EXTRAS } from "@/components/builder/TemplateExtrasEditor";
import type { TemplateExtras } from "@/components/builder/TemplateExtrasEditor";
import { TEMPLATES, DEFAULT_TEMPLATE_ID } from "@/components/templates";

const SAND = "#e8c97b";
const SUCCESS = "#2dd4a0";
const DRAFT_KEY = "builderDraft_v2";

// ─── API bridge ───────────────────────────────────────────────────────────────

function buildApiPayload(
  core: CoreForm,
  sections: AnySectionInstance[],
  extras: TemplateExtras,
  userId: string,
  templateId: string,
  extraId?: string
) {
  const get = <T,>(type: AnySectionInstance["type"]): T | undefined =>
    sections.find((s) => s.type === type)?.data as T | undefined;

  type ArrStr = string[];
  const inclusions = get<{ includes: ArrStr; excludes: ArrStr }>("inclusions");
  const flights = get<{ departures: Record<string, unknown>[] }>("flights");
  const itinerary = get<{ days: Record<string, unknown>[] }>("itinerary");
  const pricing = get<{ tiers: { label: string; price: string }[]; cancellation: string }>("pricing");
  const hotel = get<{ description: string }>("hotel");
  const gallery = get<{ images: ArrStr }>("gallery");
  const video = get<{ videoUrl: string }>("video");

  // Template-specific extras
  const agent = extras.agentName
    ? {
        name: extras.agentName,
        role: extras.agentRole || "",
        ...(extras.agentAvatar    ? { avatar:    extras.agentAvatar }                       : {}),
        ...(extras.agentYears     ? { years:     Number(extras.agentYears) }                : {}),
        ...(extras.agentRepliesIn ? { repliesIn: extras.agentRepliesIn }                    : {}),
      }
    : null;

  const departures = extras.firstDepartureDate
    ? [{ date: extras.firstDepartureDate, spots: extras.departureSpots ? Number(extras.departureSpots) : 0 }]
    : null;

  return {
    ...(extraId ? { id: extraId } : {}),
    userId,
    templateId,
    // core
    destination:     core.destination,
    price:           core.price,
    nights:          core.nights,
    title:           core.title,
    description:     core.description,
    language:        core.language,
    whatsapp:        core.whatsapp,
    messenger:       core.messenger,
    coverImage:      core.coverImage,
    // sections mapped to flat fields
    includes:        inclusions?.includes ?? [],
    excludes:        inclusions?.excludes ?? [],
    airports:        flights?.departures ?? [],
    itinerary:       itinerary?.days ?? [],
    pricingTiers:    pricing?.tiers ?? [],
    cancellation:    pricing?.cancellation ?? "",
    hotelDescription: hotel?.description ?? "",
    images:          gallery?.images ?? [],
    videoUrl:        video?.videoUrl ?? "",
    // forward full sections array
    sections,
    // template extras
    ...(agent      ? { agent }                                 : { agent: null }),
    ...(extras.difficulty  ? { difficulty:     extras.difficulty }              : {}),
    ...(extras.maxAltitude ? { maxAltitude:    Number(extras.maxAltitude) }     : {}),
    ...(extras.distanceKm  ? { distanceKm:     Number(extras.distanceKm) }      : {}),
    ...(extras.spotsRemaining ? { spotsRemaining: Number(extras.spotsRemaining) } : {}),
    ...(extras.viewersNow  ? { viewersNow:     Number(extras.viewersNow) }      : {}),
    ...(extras.priceWas    ? { priceWas:       extras.priceWas }                : {}),
    ...(extras.saving      ? { saving:         extras.saving }                  : {}),
    ...(departures         ? { departures }                                     : {}),
  };
}

// ─── Builder UI phases ────────────────────────────────────────────────────────

type UiPhase = "template" | "preset" | "build";
type Tab = "core" | "sections";

// ─── Template selection step ──────────────────────────────────────────────────

function TemplateStep({
  selectedId,
  onSelect,
  onContinue,
  lang,
}: {
  selectedId: string;
  onSelect: (id: string) => void;
  onContinue: () => void;
  lang: "en" | "ar";
}) {
  const t = T[lang];
  const isRtl = lang === "ar";
  const isMobile = useIsMobile();

  return (
    <div dir={isRtl ? "rtl" : "ltr"} style={{ maxWidth: 880, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{
          fontSize: isMobile ? 22 : 26, fontWeight: 700,
          letterSpacing: "-0.4px", marginBottom: 8,
        }}>
          {t.builderTemplateStepTitle}
        </h2>
        <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>
          {t.builderTemplateStepSub}
        </p>
      </div>

      {/* Template grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(3, 1fr)",
        gap: 12,
        marginBottom: 32,
      }}>
        {TEMPLATES.map(tpl => {
          const isSelected = tpl.id === selectedId;
          const name = isRtl ? tpl.nameAr : tpl.name;
          const target = isRtl ? tpl.targetAr : tpl.target;

          return (
            <div
              key={tpl.id}
              onClick={() => tpl.available && onSelect(tpl.id)}
              style={{
                borderRadius: 12,
                border: `1.5px solid ${isSelected ? tpl.templateColor : "rgba(255,255,255,0.08)"}`,
                overflow: "hidden",
                cursor: tpl.available ? "pointer" : "default",
                transition: "border-color .15s, transform .15s",
                background: isSelected ? `${tpl.templateColor}0d` : "rgba(255,255,255,0.02)",
                opacity: tpl.available ? 1 : 0.5,
              }}
            >
              {/* Template colour swatch / thumbnail */}
              <div style={{
                height: 4,
                background: tpl.templateColor,
              }} />
              <div style={{
                height: 72,
                background: tpl.previewBg,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {/* Simple decorative element using template brand colour */}
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: `${tpl.templateColor}22`,
                  border: `1.5px solid ${tpl.templateColor}55`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: tpl.templateColor }} />
                </div>

                {/* Coming-soon badge */}
                {!tpl.available && (
                  <div style={{
                    position: "absolute", top: 7, right: isRtl ? undefined : 7, left: isRtl ? 7 : undefined,
                    fontSize: 9, fontWeight: 700, padding: "2px 7px", borderRadius: 3,
                    background: "rgba(0,0,0,0.45)", color: "rgba(255,255,255,0.7)",
                    letterSpacing: "0.3px", textTransform: "uppercase",
                  }}>
                    {t.builderTemplateComingSoon}
                  </div>
                )}

                {/* Selected checkmark */}
                {isSelected && tpl.available && (
                  <div style={{
                    position: "absolute", top: 7, right: isRtl ? undefined : 7, left: isRtl ? 7 : undefined,
                    width: 18, height: 18, borderRadius: "50%",
                    background: tpl.templateColor,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Label */}
              <div style={{ padding: "10px 12px" }}>
                <div style={{
                  fontSize: 13, fontWeight: 700, color: "#fdfcf9",
                  marginBottom: 2,
                }}>
                  {name}
                </div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>
                  {target}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Continue button */}
      <div style={{ display: "flex", justifyContent: isRtl ? "flex-start" : "flex-end" }}>
        <button
          onClick={onContinue}
          style={{
            background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
            color: "#0d1b2e", border: "none", borderRadius: 10,
            padding: "11px 28px", fontSize: 13.5, fontWeight: 700,
            fontFamily: "inherit", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 8,
          }}
        >
          {t.builderTemplateContinue}
          <Icon name="arrow_right" size={14} color="#0d1b2e" />
        </button>
      </div>
    </div>
  );
}

// ─── Main builder ─────────────────────────────────────────────────────────────

function BuilderPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("id");
  const isEditMode = Boolean(editId);

  const lang = useLang();
  const isMobile = useIsMobile();
  const l = lang === "ar";
  const t = T[lang];

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("core");
  const [uiPhase, setUiPhase] = useState<UiPhase>(isEditMode ? "build" : "template");
  const [selectedTemplateId, setSelectedTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [core, setCore] = useState<CoreForm>({ ...DEFAULT_CORE_FORM });
  const [sections, setSections] = useState<AnySectionInstance[]>([]);
  const [extras, setExtras] = useState<TemplateExtras>({ ...DEFAULT_EXTRAS });
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);
  const [packageId, setPackageId] = useState<string | null>(null);
  const [agencySlug, setAgencySlug] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [draftStatus, setDraftStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [saveAsOpen, setSaveAsOpen] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [saveAsStatus, setSaveAsStatus] = useState<"idle" | "saving" | "saved">("idle");

  // ── Auth + load ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUser(u);

      const userRef = doc(db, "users", u.uid);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        await setDoc(userRef, { plan: "free", packagesUsed: 0, aiLimit: FREE_AI_LIMIT, createdAt: Date.now() });
      }

      if (!editId) {
        const userData = userSnap.exists() ? userSnap.data() : {};
        if (!hasFullAccess(userData.plan, userData.trialEndsAt)) {
          router.push("/paywall");
          return;
        }
        posthog.capture("builder_opened", { mode: "new" });

        // Restore draft (includes templateId + extras)
        if (typeof window !== "undefined") {
          const raw = localStorage.getItem(DRAFT_KEY);
          if (raw) {
            try {
              const draft = JSON.parse(raw);
              if (draft.core) setCore(draft.core);
              if (Array.isArray(draft.sections)) setSections(draft.sections);
              if (draft.templateId) setSelectedTemplateId(draft.templateId);
              if (draft.extras) setExtras({ ...DEFAULT_EXTRAS, ...draft.extras });
              setUiPhase("build");
            } catch {}
          }
        }
      } else {
        posthog.capture("builder_opened", { mode: "edit" });

        const pkgSnap = await getDoc(doc(db, "packages", editId));
        if (pkgSnap.exists() && pkgSnap.data()?.userId === u.uid) {
          const d = pkgSnap.data();

          setCore({
            destination:  d.destination  || "",
            price:        d.price        || "",
            nights:       d.nights ? String(d.nights) : "5",
            title:        d.title        || "",
            description:  d.description  || "",
            language:     d.language === "ar" ? "ar" : "en",
            whatsapp:     d.whatsapp     || "",
            messenger:    d.messenger    || "",
            coverImage:   d.coverImage   || "",
          });

          if (d.templateId) setSelectedTemplateId(d.templateId);

          // Reconstruct template extras from flat Firestore fields
          setExtras({
            agentName:           d.agent?.name        || "",
            agentRole:           d.agent?.role        || "",
            agentAvatar:         d.agent?.avatar      || "",
            agentYears:          d.agent?.years       ? String(d.agent.years) : "",
            agentRepliesIn:      d.agent?.repliesIn   || "",
            difficulty:          d.difficulty         || "",
            maxAltitude:         d.maxAltitude        ? String(d.maxAltitude) : "",
            distanceKm:          d.distanceKm         ? String(d.distanceKm)  : "",
            firstDepartureDate:  d.departures?.[0]?.date  || "",
            departureSpots:      d.departures?.[0]?.spots ? String(d.departures[0].spots) : "",
            spotsRemaining:      d.spotsRemaining     ? String(d.spotsRemaining) : "",
            viewersNow:          d.viewersNow         ? String(d.viewersNow)  : "",
            priceWas:            d.priceWas           || "",
            saving:              d.saving             || "",
          });

          if (Array.isArray(d.sections) && d.sections.length > 0) {
            setSections(d.sections as AnySectionInstance[]);
          } else {
            // Old package format — reconstruct sections from flat fields
            const rebuilt: AnySectionInstance[] = [];
            let order = 0;
            const push = (type: AnySectionInstance["type"], data: Record<string, unknown>) => {
              rebuilt.push({ id: `${type}_legacy`, type, order: order++, data });
            };

            if (Array.isArray(d.airports) && d.airports.length) push("flights", { departures: d.airports });
            if (d.hotelDescription) push("hotel", { description: d.hotelDescription });
            if (Array.isArray(d.itinerary) && d.itinerary.length) push("itinerary", { days: d.itinerary });
            if (Array.isArray(d.includes) && d.includes.length) push("inclusions", { includes: d.includes, excludes: d.excludes ?? [] });
            if (Array.isArray(d.pricingTiers) && d.pricingTiers.length) push("pricing", { tiers: d.pricingTiers, cancellation: d.cancellation ?? "" });
            if (Array.isArray(d.images) && d.images.length) push("gallery", { images: d.images });
            if (d.videoUrl) push("video", { videoUrl: d.videoUrl });

            setSections(rebuilt);
          }

          setPackageId(editId);
          if (d.agencySlug) setAgencySlug(d.agencySlug);
          setUiPhase("build");
        } else {
          router.push("/dashboard");
          return;
        }
      }

      setAuthLoading(false);
    });
    return () => unsub();
  }, [router, editId]);

  // ── Autosave draft (includes templateId) ────────────────────────────────────

  useEffect(() => {
    if (isEditMode || authLoading || uiPhase !== "build") return;
    setDraftStatus("saving");
    const timer = setTimeout(() => {
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ core, sections, templateId: selectedTemplateId, extras }));
      setDraftStatus("saved");
    }, 1500);
    return () => clearTimeout(timer);
  }, [core, sections, selectedTemplateId, extras, isEditMode, authLoading, uiPhase]);

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!core.destination || !core.price) {
      setError(l ? "الوجهة والسعر مطلوبان" : "Destination and price are required.");
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const payload = buildApiPayload(core, sections, extras, user.uid, selectedTemplateId, isEditMode ? editId ?? undefined : undefined);

      if (isEditMode && editId) {
        const res = await fetch("/api/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error || "Something went wrong."); return; }
        if (json.agencySlug) setAgencySlug(json.agencySlug);
        posthog.capture("package_updated", { destination: core.destination, language: core.language, templateId: selectedTemplateId });
      } else {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok || !json.id) { setError(json.error || "Something went wrong."); return; }
        await updateDoc(doc(db, "users", user.uid), { packagesUsed: increment(1) });
        setPackageId(json.id);
        if (json.agencySlug) setAgencySlug(json.agencySlug);
        localStorage.removeItem(DRAFT_KEY);
        posthog.capture("package_published", { destination: core.destination, language: core.language, nights: core.nights, templateId: selectedTemplateId });
      }
      setDone(true);
    } catch (err: any) {
      posthog.captureException(err);
      setError(err.message || "Something went wrong.");
    } finally {
      setGenerating(false);
    }
  };

  const handleSaveAsTemplate = async () => {
    if (!saveName.trim() || !user?.uid || !sections.length) return;
    setSaveAsStatus("saving");
    try {
      await fetch("/api/user-presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.uid, name: saveName.trim(), sections }),
      });
      setSaveAsStatus("saved");
      setTimeout(() => { setSaveAsOpen(false); setSaveName(""); setSaveAsStatus("idle"); }, 1200);
    } catch {
      setSaveAsStatus("idle");
    }
  };

  const finalPackageId = packageId || editId;
  const shareUrl = finalPackageId && agencySlug
    ? `https://${agencySlug}.packmetrix.com/${finalPackageId}`
    : "";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Loading ──────────────────────────────────────────────────────────────────

  if (authLoading) {
    return (
      <AppLayout>
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span className="spinner" />
        </div>
      </AppLayout>
    );
  }

  // ── Success ──────────────────────────────────────────────────────────────────

  if (done && finalPackageId) {
    return (
      <AppLayout>
        <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 24, padding: 48 }}>
          <div className="fade-up" style={{ textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: "rgba(45,212,160,0.15)", border: `2px solid ${SUCCESS}`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}>
              <Icon name="check" size={32} color={SUCCESS} strokeWidth={2.5} />
            </div>
            <h2 style={{ fontFamily: "var(--font-dm-serif), serif", fontSize: 32, marginBottom: 10 }}>
              {isEditMode
                ? (l ? "تم حفظ التغييرات" : "Changes saved")
                : (l ? "تم إنشاء الصفحة!" : "Landing page created!")}
            </h2>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 15, maxWidth: 400 }}>
              {isEditMode
                ? (l ? "تم تحديث الصفحة بنجاح." : "Your page has been updated successfully.")
                : (l ? "صفحة الباقة جاهزة للمشاركة." : "Your package page is ready to share.")}
            </p>
          </div>

          <div style={{ background: "rgba(255,255,255,0.04)", border: "1px solid var(--border)", borderRadius: 12, padding: "12px 18px", display: "flex", alignItems: "center", gap: 12, maxWidth: 480, width: "100%" }}>
            <Icon name="link" size={16} color={SAND} />
            <span style={{ flex: 1, fontSize: 13, color: "rgba(255,255,255,0.6)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{shareUrl}</span>
            <button onClick={handleCopy} style={{ background: `${SAND}22`, border: `1px solid ${SAND}40`, borderRadius: 8, padding: "5px 12px", fontSize: 12, color: copied ? SUCCESS : SAND, cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
              {copied ? (l ? "تم النسخ!" : "Copied!") : (l ? "نسخ" : "Copy")}
            </button>
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={() => router.push(`/${agencySlug}/${finalPackageId}`)} style={{ background: `linear-gradient(135deg, ${SAND}, #c4a84f)`, color: "#0d1b2e", border: "none", borderRadius: 10, padding: "11px 24px", fontSize: 14, fontWeight: 700, fontFamily: "inherit", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
              <Icon name="eye" size={16} color="#0d1b2e" /> {l ? "معاينة الصفحة" : "Preview page"}
            </button>
            <button onClick={() => router.push("/dashboard")} style={{ background: "rgba(255,255,255,0.06)", border: "1px solid var(--border)", color: "rgba(255,255,255,0.7)", borderRadius: 10, padding: "11px 24px", fontSize: 14, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
              {l ? "لوحة التحكم" : "Dashboard"}
            </button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Template step ────────────────────────────────────────────────────────────

  if (uiPhase === "template") {
    return (
      <AppLayout>
        <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "24px 16px 48px" : "48px 48px" }}>
          <TemplateStep
            selectedId={selectedTemplateId}
            onSelect={setSelectedTemplateId}
            onContinue={() => setUiPhase("preset")}
            lang={lang}
          />
        </div>
      </AppLayout>
    );
  }

  // ── Preset picker ────────────────────────────────────────────────────────────

  if (uiPhase === "preset") {
    return (
      <AppLayout>
        <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "24px 16px" : "48px 48px" }}>
          <PresetPicker
            lang={lang}
            userId={user?.uid}
            onApply={(coreOverrides, presetSections) => {
              setCore((c) => ({ ...c, ...coreOverrides }));
              setSections(presetSections);
              setUiPhase("build");
            }}
          />
        </div>
      </AppLayout>
    );
  }

  // ── Build view ───────────────────────────────────────────────────────────────

  const selectedTpl = TEMPLATES.find(t => t.id === selectedTemplateId);

  return (
    <AppLayout>
      <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "20px 16px 80px" : "32px 48px 60px" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>
              {isEditMode
                ? (l ? "تعديل الباقة" : "Edit package")
                : (l ? "منشئ الباقات" : "Package builder")}
            </h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>
              {isEditMode
                ? (l ? "قم بتحديث محتوى الصفحة وانشر التغييرات" : "Update content and publish changes")
                : (l ? "أضف الأقسام وانشر صفحتك في ثوانٍ" : "Add sections and publish your page in seconds")}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
            {!isEditMode && draftStatus !== "idle" && (
              <div style={{ fontSize: 12, color: draftStatus === "saved" ? "rgba(45,212,160,0.7)" : "rgba(255,255,255,0.35)", display: "flex", alignItems: "center", gap: 5 }}>
                {draftStatus === "saving"
                  ? <><span className="spinner" style={{ width: 10, height: 10, borderWidth: 1.5, borderTopColor: "rgba(255,255,255,0.35)" }} /> {l ? "حفظ مسودة…" : "Saving draft…"}</>
                  : <><Icon name="check" size={11} color="rgba(45,212,160,0.7)" strokeWidth={2.5} /> {l ? "تم حفظ المسودة" : "Draft saved"}</>}
              </div>
            )}

            {/* Active template pill */}
            {selectedTpl && (
              <button
                onClick={() => setUiPhase("template")}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 7,
                  fontSize: 12, color: "rgba(255,255,255,0.6)",
                  background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit",
                }}
              >
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: selectedTpl.templateColor, flexShrink: 0 }} />
                {l ? selectedTpl.nameAr : selectedTpl.name}
                <Icon name="edit" size={10} color="rgba(255,255,255,0.35)" />
              </button>
            )}

            {sections.length > 0 && (
              <button
                onClick={() => { setSaveAsOpen(true); setSaveName(""); setSaveAsStatus("idle"); }}
                style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6 }}
              >
                <Icon name="copy" size={11} color="rgba(255,255,255,0.35)" />
                {t.saveAsTemplateBtn}
              </button>
            )}
            {!isEditMode && (
              <button
                onClick={() => setUiPhase("preset")}
                style={{ fontSize: 12, color: "rgba(255,255,255,0.35)", background: "none", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: "5px 12px", cursor: "pointer", fontFamily: "inherit" }}
              >
                {l ? "تغيير النموذج المبدئي" : "Change preset"}
              </button>
            )}
          </div>
        </div>

        {/* Save-as-template modal */}
        {saveAsOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setSaveAsOpen(false)}>
            <div style={{ background: "#0d1b2e", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 18, padding: "28px 24px", width: "100%", maxWidth: 380 }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 6 }}>
                {t.saveAsTemplateModalTitle}
              </div>
              <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.4)", marginBottom: 18, lineHeight: 1.5 }}>
                {l
                  ? `سيتم حفظ ${sections.length} قسماً كقالب يمكنك إعادة استخدامه.`
                  : `Save ${sections.length} sections as a reusable template.`}
              </div>
              <input
                autoFocus
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSaveAsTemplate(); }}
                placeholder={t.saveAsTemplatePlaceholder}
                style={{ width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 10, padding: "9px 14px", color: "#fff", fontSize: 13.5, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const }}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button
                  onClick={() => setSaveAsOpen(false)}
                  style={{ flex: 1, padding: "9px", borderRadius: 9, border: "1px solid rgba(255,255,255,0.08)", background: "transparent", color: "rgba(255,255,255,0.4)", fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}
                >
                  {t.saveAsTemplateCancel}
                </button>
                <button
                  onClick={handleSaveAsTemplate}
                  disabled={!saveName.trim() || saveAsStatus === "saving" || saveAsStatus === "saved"}
                  style={{ flex: 2, padding: "9px", borderRadius: 9, border: "none", background: saveAsStatus === "saved" ? "rgba(45,212,160,0.2)" : !saveName.trim() ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${SAND}, #c4a84f)`, color: saveAsStatus === "saved" ? "#2dd4a0" : !saveName.trim() ? "rgba(255,255,255,0.25)" : "#0d1b2e", fontSize: 13, fontWeight: 700, cursor: !saveName.trim() || saveAsStatus !== "idle" ? "not-allowed" : "pointer", fontFamily: "inherit" }}
                >
                  {saveAsStatus === "saving" ? t.saveAsTemplateSaving : saveAsStatus === "saved" ? t.saveAsTemplateSaved : t.saveAsTemplateSave}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab bar */}
        <div style={{ display: "inline-flex", background: "rgba(255,255,255,0.05)", borderRadius: 99, padding: "4px 5px", marginBottom: 24, gap: 4 }}>
          {(["core", "sections"] as Tab[]).map((tabKey) => {
            const active = tab === tabKey;
            const tabLabel = tabKey === "core"
              ? (l ? "المعلومات الأساسية" : "Core info")
              : (l ? "الأقسام" : "Sections");
            const count = tabKey === "sections" ? sections.length : undefined;
            return (
              <button
                key={tabKey}
                onClick={() => setTab(tabKey)}
                style={{
                  padding: "8px 16px", borderRadius: 99, border: "none",
                  background: active ? "rgba(255,255,255,0.1)" : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.4)",
                  fontSize: 13, fontWeight: active ? 600 : 400,
                  fontFamily: "inherit", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 7,
                  transition: "all 0.15s",
                }}
              >
                {tabLabel}
                {count !== undefined && (
                  <span style={{ fontSize: 11, background: active ? SAND : "rgba(255,255,255,0.08)", color: active ? "#0d1b2e" : "rgba(255,255,255,0.4)", borderRadius: 99, padding: "1px 7px", fontWeight: 700 }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content + preview */}
        <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
          <div className="fade-in" key={tab} style={{ flex: 1, maxWidth: isMobile ? "100%" : 580 }}>
            {tab === "core" && (
              <>
                <CoreFieldsEditor
                  core={core}
                  onChange={setCore}
                  userId={user?.uid ?? ""}
                  lang={lang}
                />
                <TemplateExtrasEditor
                  templateId={selectedTemplateId}
                  extras={extras}
                  onChange={setExtras}
                  userId={user?.uid ?? ""}
                  lang={lang}
                />
              </>
            )}
            {tab === "sections" && (
              <SectionList
                sections={sections}
                onChange={setSections}
                userId={user?.uid ?? ""}
                lang={lang}
              />
            )}
          </div>

          {!isMobile && (
            <div style={{ width: 260, flexShrink: 0 }}>
              <MiniPreview core={core} sections={sections} lang={lang} />
            </div>
          )}
        </div>

        {/* Error */}
        {error && (
          <p style={{ marginTop: 16, fontSize: 13, color: "var(--danger)" }}>{error}</p>
        )}

        {/* Publish bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)", gap: 12 }}>
          {isEditMode ? (
            <button
              onClick={handleSubmit}
              disabled={generating}
              style={{
                background: generating ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${SAND}, #c4a84f)`,
                color: generating ? "rgba(255,255,255,0.4)" : "#0d1b2e",
                border: "none", borderRadius: 10, padding: "11px 28px",
                fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                cursor: generating ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              {generating
                ? <><span className="spinner" style={{ borderTopColor: SAND }} /> {l ? "جاري الحفظ…" : "Saving…"}</>
                : <><Icon name="check" size={14} color="#0d1b2e" strokeWidth={2.5} /> {l ? "حفظ التغييرات" : "Save changes"}</>
              }
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={generating}
              style={{
                background: generating ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${SAND}, #c4a84f)`,
                color: generating ? "rgba(255,255,255,0.4)" : "#0d1b2e",
                border: "none", borderRadius: 10, padding: "11px 28px",
                fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                cursor: generating ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 8,
              }}
            >
              {generating
                ? <><span className="spinner" style={{ borderTopColor: SAND }} /> {l ? "جاري النشر…" : "Publishing…"}</>
                : <><Icon name="sparkle" size={14} color="#0d1b2e" strokeWidth={2.5} /> {l ? "نشر الصفحة" : "Publish page"}</>
              }
            </button>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

export default function BuilderPage() {
  return (
    <Suspense fallback={null}>
      <BuilderPageInner />
    </Suspense>
  );
}
