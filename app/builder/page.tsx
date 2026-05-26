"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";
import Icon from "@/components/Icon";
import { useLang, switchLang } from "@/hooks/useLang";
import { useIsMobile } from "@/hooks/useIsMobile";
import { T } from "@/lib/translations";
import posthog from "posthog-js";
import { FREE_AI_LIMIT } from "@/lib/limits";
import { hasFullAccess } from "@/lib/trial";
import type { AnySectionInstance, CoreForm } from "@/lib/sections/types";
import { DEFAULT_CORE_FORM } from "@/lib/sections/index";
import { PRESET_MAP } from "@/lib/sections/presets";
import { SECTION_REGISTRY } from "@/lib/sections/registry";
import { CoreFieldsEditor } from "@/components/builder/CoreFieldsEditor";
import { SectionList } from "@/components/builder/SectionList";
import { BuilderTopBar } from "@/components/builder/BuilderTopBar";
import { VisualTemplatePicker } from "@/components/builder/TemplatePicker";
import { LivePreviewPhone } from "@/components/builder/LivePreviewPhone";
import { TEMPLATES, DEFAULT_TEMPLATE_ID } from "@/components/templates";
import { DA_BG, DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3, DA_RULE, DA_RULE2, DA_GOLD, DA_GOLD_SOFT, DA_GOLD_DEEP, DA_GREEN, DA_GREEN_SOFT, DA_DANGER } from "@/lib/tokens";

const DISPLAY = `var(--font-instrument-serif), Georgia, serif`;
const DRAFT_KEY = "builderDraft_v2";

// ─── API bridge ───────────────────────────────────────────────────────────────

/**
 * Converts legacy section types to their v2 equivalents in the builder's
 * in-memory state. Called once when loading a package for editing so that
 * any subsequent save writes clean v2 data — no manual migration required
 * for packages touched via the builder.
 *
 * Conversions:
 *   gallery + video + map     → media
 *   flights + departure_dates → departures
 *   payment_plan              → folded into pricing (or new pricing)
 *   booking_terms             → folded into pricing.termsContent
 *   guide                     → people
 */
function upgradeLegacySections(sections: AnySectionInstance[]): AnySectionInstance[] {
  type Raw = Record<string, unknown>;

  const LEGACY = new Set(["gallery", "video", "map", "flights", "departure_dates", "payment_plan", "booking_terms", "guide"]);

  // Buckets for legacy types
  const galleries    = sections.filter((s) => s.type === "gallery");
  const videos       = sections.filter((s) => s.type === "video");
  const maps         = sections.filter((s) => s.type === "map");
  const flightSegs   = sections.filter((s) => s.type === "flights");
  const ddSegs       = sections.filter((s) => s.type === "departure_dates");
  const ppSegs       = sections.filter((s) => s.type === "payment_plan");
  const btSegs       = sections.filter((s) => s.type === "booking_terms");
  const guideSegs    = sections.filter((s) => s.type === "guide");

  // Pass through all non-legacy sections
  const kept: AnySectionInstance[] = sections.filter((s) => !LEGACY.has(s.type));

  const safeMin = (...nums: number[]) => nums.length ? Math.min(...nums) : 0;

  // 1. gallery + video + map → media (skip if media already exists)
  const hasMedia = kept.some((s) => s.type === "media");
  if (!hasMedia && (galleries.length || videos.length || maps.length)) {
    const gallery = galleries[0]?.data as Raw | undefined;
    const video   = videos[0]?.data   as Raw | undefined;
    const map     = maps[0]?.data     as Raw | undefined;
    kept.push({
      id:    `media_upgraded_${Date.now()}`,
      type:  "media",
      order: safeMin(
        ...galleries.map((s) => s.order),
        ...videos.map((s) => s.order),
        ...maps.map((s) => s.order),
      ),
      data: {
        images:     (gallery?.images   as string[]) ?? [],
        videoUrl:   (video?.videoUrl   as string)   ?? "",
        mapImage:   (map?.image        as string)   ?? "",
        mapCaption: (map?.caption      as string)   ?? "",
      },
    } as AnySectionInstance);
  }

  // 2. flights + departure_dates → departures (skip if departures already exists)
  const hasDepartures = kept.some((s) => s.type === "departures");
  if (!hasDepartures && (flightSegs.length || ddSegs.length)) {
    const entries: Raw[] = [];
    for (const s of flightSegs) {
      for (const d of ((s.data as Raw).departures as Raw[] | undefined) ?? []) {
        entries.push({
          date:            d.date            ?? "",
          returnDate:      "",
          spots:           0,
          price:           d.price           ?? "",
          origin:          d.name            ?? "",
          arrivingAirport: d.arrivingAirport ?? "",
          flyingTime:      d.flyingTime      ?? "",
          arrivingTime:    d.arrivingTime    ?? "",
          deal:            false,
        });
      }
    }
    for (const s of ddSegs) {
      for (const d of ((s.data as Raw).dates as Raw[] | undefined) ?? []) {
        entries.push({
          date:       d.date       ?? "",
          returnDate: d.returnDate ?? "",
          spots:      Number(d.spots) || 0,
          price:      d.price     ?? "",
          origin:     "",
          deal:       false,
        });
      }
    }
    kept.push({
      id:    `departures_upgraded_${Date.now()}`,
      type:  "departures",
      order: safeMin(...flightSegs.map((s) => s.order), ...ddSegs.map((s) => s.order)),
      data:  { entries },
    } as AnySectionInstance);
  }

  // 3. payment_plan → fold into existing pricing, or create pricing from it
  if (ppSegs.length) {
    const pp        = ppSegs[0].data as Raw;
    const pricingIdx = kept.findIndex((s) => s.type === "pricing");
    if (pricingIdx >= 0) {
      kept[pricingIdx] = {
        ...kept[pricingIdx],
        data: { ...kept[pricingIdx].data, paymentContent: pp.content ?? "", paymentSteps: pp.steps ?? [] },
      } as AnySectionInstance;
    } else {
      kept.push({
        id:    `pricing_from_pp_${Date.now()}`,
        type:  "pricing",
        order: ppSegs[0].order,
        data:  { tiers: [], cancellation: "", paymentContent: pp.content ?? "", paymentSteps: pp.steps ?? [], termsContent: "" },
      } as AnySectionInstance);
    }
  }

  // 4. booking_terms → fold into pricing.termsContent
  if (btSegs.length) {
    const bt        = btSegs[0].data as Raw;
    const pricingIdx = kept.findIndex((s) => s.type === "pricing");
    if (pricingIdx >= 0) {
      kept[pricingIdx] = {
        ...kept[pricingIdx],
        data: { ...kept[pricingIdx].data, termsContent: bt.content ?? "" },
      } as AnySectionInstance;
    } else {
      kept.push({
        id:    `pricing_from_bt_${Date.now()}`,
        type:  "pricing",
        order: btSegs[0].order,
        data:  { tiers: [], cancellation: "", paymentContent: "", paymentSteps: [], termsContent: bt.content ?? "" },
      } as AnySectionInstance);
    }
  }

  // 5. guide → people (skip if people already exists)
  const hasPeople = kept.some((s) => s.type === "people");
  if (!hasPeople && guideSegs.length) {
    const g = guideSegs[0].data as Raw;
    kept.push({
      id:    `people_from_guide_${Date.now()}`,
      type:  "people",
      order: guideSegs[0].order,
      data: {
        people: [{
          id:        "guide_upgraded",
          role:      "guide",
          name:      g.name      ?? "",
          bio:       g.bio       ?? "",
          photo:     g.photo     ?? "",
          languages: g.languages ?? [],
          years:     0,
          repliesIn: "",
        }],
      },
    } as AnySectionInstance);
  }

  kept.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return kept;
}

/**
 * Supplements a sections array with people / trek_profile / scarcity sections
 * derived from legacy Firestore flat fields (agent, difficulty, priceWas…).
 * Only creates a section if the type is not already present.
 * Called after upgradeLegacySections() so section→section conversions happen first.
 */
function supplementFromFlatFields(
  sections: AnySectionInstance[],
  d: Record<string, unknown>
): AnySectionInstance[] {
  const result = [...sections];

  const agent = d.agent as Record<string, unknown> | undefined;
  if (agent?.name && !result.some((s) => s.type === "people")) {
    result.push({
      id:    `people_from_flat_${Date.now()}`,
      type:  "people",
      order: result.length,
      data: {
        people: [{
          id:        "agent_legacy",
          role:      agent.role      ?? "agent",
          name:      agent.name,
          bio:       "",
          photo:     agent.avatar    ?? "",
          languages: [],
          years:     typeof agent.years === "number" ? agent.years : 0,
          repliesIn: agent.repliesIn ?? "",
        }],
      },
    } as AnySectionInstance);
  }

  if ((d.difficulty || d.maxAltitude || d.distanceKm) && !result.some((s) => s.type === "trek_profile")) {
    result.push({
      id:    `trek_from_flat_${Date.now()}`,
      type:  "trek_profile",
      order: result.length,
      data: {
        difficulty:  d.difficulty  ?? "",
        maxAltitude: typeof d.maxAltitude === "number" ? d.maxAltitude : 0,
        distanceKm:  typeof d.distanceKm  === "number" ? d.distanceKm  : 0,
        fitnessNote: typeof d.fitnessNote === "string"  ? d.fitnessNote : "",
      },
    } as AnySectionInstance);
  }

  if ((d.priceWas || d.spotsRemaining) && !result.some((s) => s.type === "scarcity")) {
    result.push({
      id:    `scarcity_from_flat_${Date.now()}`,
      type:  "scarcity",
      order: result.length,
      data: {
        wasPrice:       d.priceWas       ?? "",
        spotsRemaining: typeof d.spotsRemaining === "number" ? d.spotsRemaining : 0,
        totalSpots:     typeof d.totalSpots      === "number" ? d.totalSpots      : 0,
        firstDepartureDate: "",
      },
    } as AnySectionInstance);
  }

  return result;
}

function buildApiPayload(
  core: CoreForm,
  sections: AnySectionInstance[],
  userId: string,
  templateId: string,
  extraId?: string
) {
  type ArrStr = string[];

  const get = <T,>(type: AnySectionInstance["type"]): T | undefined =>
    sections.find((s) => s.type === type)?.data as T | undefined;

  const inclusions  = get<{ includes: ArrStr; excludes: ArrStr }>("inclusions");
  const itinerary   = get<{ days: Record<string, unknown>[] }>("itinerary");
  const pricing     = get<{ tiers: { label: string; price: string }[]; cancellation: string }>("pricing");
  const hotels      = sections.filter((s) => s.type === "hotel");
  const mediaSec    = get<{ images?: ArrStr; videoUrl?: string }>("media");
  const peopleSec   = get<{ people: Array<Record<string, unknown>> }>("people");
  const trekSec     = get<{ difficulty: string; maxAltitude: number; distanceKm: number }>("trek_profile");
  const scarcitySec = get<{ wasPrice: string; spotsRemaining: number; totalSpots: number }>("scarcity");
  const depSec      = get<{ entries: Array<Record<string, unknown>> }>("departures");

  const hotelDescription = hotels.length > 0
    ? String((hotels[0].data as Record<string, unknown>).description ?? "")
    : "";

  // Derive legacy agent flat field from people section for template backward compat
  const firstPerson = peopleSec?.people?.[0];
  const agent = firstPerson ? {
    name:      String(firstPerson.name      ?? ""),
    role:      String(firstPerson.role      ?? "agent"),
    ...(firstPerson.photo     ? { avatar:    String(firstPerson.photo) }     : {}),
    ...(firstPerson.years     ? { years:     Number(firstPerson.years) }     : {}),
    ...(firstPerson.repliesIn ? { repliesIn: String(firstPerson.repliesIn) } : {}),
  } : null;

  // Derive legacy departures flat field
  const legacyDepartures = (depSec?.entries ?? [])
    .filter((e) => e.date)
    .map((e) => ({
      date:  String(e.date  ?? ""),
      spots: Number(e.spots) || 0,
      ...(e.price ? { price: String(e.price) } : {}),
    }));

  // Derive legacy airports flat field from departures entries that have an origin
  const airports = (depSec?.entries ?? [])
    .filter((e) => e.origin)
    .map((e) => ({
      name:            String(e.origin           ?? ""),
      price:           String(e.price            ?? ""),
      ...(e.date            ? { date:            String(e.date) }            : {}),
      ...(e.arrivingAirport ? { arrivingAirport: String(e.arrivingAirport) } : {}),
      ...(e.flyingTime      ? { flyingTime:      String(e.flyingTime) }      : {}),
      ...(e.arrivingTime    ? { arrivingTime:    String(e.arrivingTime) }    : {}),
    }));

  return {
    ...(extraId ? { id: extraId } : {}),
    userId,
    templateId,
    // v2 core — stored as LocalizedString
    title:           { en: core.titleEn, ar: core.titleAr },
    description:     { en: core.descriptionEn, ar: core.descriptionAr },
    destination:     core.destination,
    price:           core.price,
    currency:        core.currency || undefined,
    nights:          core.nights,
    primaryLanguage: core.primaryLanguage,
    language:        core.primaryLanguage,
    whatsapp:        core.whatsapp,
    messenger:       core.messenger,
    coverImage:      core.coverImage,
    // flat fields for template backward compat (derived from v2 sections)
    includes:        inclusions?.includes  ?? [],
    excludes:        inclusions?.excludes  ?? [],
    itinerary:       itinerary?.days       ?? [],
    pricingTiers:    pricing?.tiers        ?? [],
    cancellation:    pricing?.cancellation ?? "",
    hotelDescription,
    images:          mediaSec?.images      ?? [],
    videoUrl:        mediaSec?.videoUrl    ?? "",
    airports,
    // v2 canonical sections[] — single source of truth
    sections,
    // legacy flat fields for templates that read TPackage directly
    ...(agent       ? { agent }                                              : { agent: null }),
    ...(trekSec     ? { difficulty:     trekSec.difficulty,
                        maxAltitude:    trekSec.maxAltitude,
                        distanceKm:     trekSec.distanceKm }                : {}),
    ...(scarcitySec ? { priceWas:       scarcitySec.wasPrice,
                        spotsRemaining: scarcitySec.spotsRemaining,
                        totalSpots:     scarcitySec.totalSpots }            : {}),
    ...(legacyDepartures.length ? { departures: legacyDepartures }         : {}),
  };
}

// ─── Builder UI phases ────────────────────────────────────────────────────────

type UiPhase = "template" | "build";
type Tab = "core" | "sections" | "seo";

// ─── SEO tab (auto-generated preview) ────────────────────────────────────────

function SeoTab({ core, lang }: { core: CoreForm; lang: "en" | "ar" }) {
  const l = lang === "ar";
  const seoTitle = core.titleEn || core.destination || "";
  const seoTitleAr = core.titleAr || core.destination || "";
  const seoDesc = (core.descriptionEn || "").slice(0, 160);
  const seoDescAr = (core.descriptionAr || "").slice(0, 160);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ padding: "12px 16px", background: DA_GOLD_SOFT, border: `1px solid rgba(176,138,62,.25)`, borderRadius: 10, fontSize: 13, color: DA_INK2, lineHeight: 1.55 }}>
        <span style={{ color: DA_GOLD, fontWeight: 600 }}>✦ </span>
        {l
          ? "بيانات SEO تُولَّد تلقائياً من معلومات الباقة عند النشر. لا حاجة لأي إعداد يدوي."
          : "SEO metadata is automatically generated from your core info at publish time. No manual setup needed."}
      </div>

      <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 12, padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, color: DA_INK3, marginBottom: 12 }}>
          {l ? "معاينة جوجل" : "Google preview"}
        </div>
        <div style={{ fontSize: 18, color: "#1a0dab", lineHeight: 1.3, marginBottom: 4 }}>
          {seoTitle || (l ? "عنوان الباقة" : "Package title")}
        </div>
        <div style={{ fontSize: 13, color: "#006621", marginBottom: 4 }}>packmetrix.com/your-agency/…</div>
        <div style={{ fontSize: 13, color: "#545454", lineHeight: 1.5 }}>
          {seoDesc || (l ? "وصف الباقة سيظهر هنا…" : "Package description will appear here…")}
        </div>
      </div>

      {seoTitleAr && seoTitleAr !== seoTitle && (
        <div dir="rtl" style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, color: DA_INK3, marginBottom: 12 }}>
            {l ? "معاينة جوجل — عربي" : "Google preview — Arabic"}
          </div>
          <div style={{ fontSize: 18, color: "#1a0dab", lineHeight: 1.3, marginBottom: 4 }}>{seoTitleAr}</div>
          <div style={{ fontSize: 13, color: "#006621", marginBottom: 4 }}>packmetrix.com/your-agency/…</div>
          <div style={{ fontSize: 13, color: "#545454", lineHeight: 1.5 }}>{seoDescAr || "…"}</div>
        </div>
      )}

      {core.coverImage && (
        <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 12, padding: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, color: DA_INK3, marginBottom: 12 }}>
            {l ? "صورة المشاركة (OG Image)" : "Sharing image (OG image)"}
          </div>
          <div style={{ position: "relative", width: "100%", aspectRatio: "1200/630", borderRadius: 8, overflow: "hidden" }}>
            <img src={core.coverImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          <div style={{ fontSize: 12, color: DA_INK3, marginTop: 8 }}>
            {l ? "صورة الغلاف تُستخدم تلقائياً عند المشاركة." : "Your cover image is automatically used when shared."}
          </div>
        </div>
      )}
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
              if (draft.templateId) setSelectedTemplateId(draft.templateId);
              // Convert old Phase-1 extras (if present) into sections so no draft data is lost
              const base: AnySectionInstance[] = Array.isArray(draft.sections) ? draft.sections : [];
              const e = draft.extras ?? {};
              const fakeFlat: Record<string, unknown> = {
                agent: e.agentName ? { name: e.agentName, role: e.agentRole, avatar: e.agentAvatar, years: e.agentYears ? Number(e.agentYears) : 0, repliesIn: e.agentRepliesIn } : undefined,
                difficulty: e.difficulty, maxAltitude: e.maxAltitude ? Number(e.maxAltitude) : undefined,
                distanceKm: e.distanceKm ? Number(e.distanceKm) : undefined,
                priceWas: e.priceWas, spotsRemaining: e.spotsRemaining ? Number(e.spotsRemaining) : undefined,
              };
              setSections(supplementFromFlatFields(upgradeLegacySections(base), fakeFlat));
              setUiPhase("build");
            } catch {}
          }
        }
      } else {
        posthog.capture("builder_opened", { mode: "edit" });

        const pkgSnap = await getDoc(doc(db, "packages", editId));
        if (pkgSnap.exists() && pkgSnap.data()?.userId === u.uid) {
          const d = pkgSnap.data();

          // Resolve v2 LocalizedString or legacy plain string for title/description
          const rawTitle = d.title;
          const rawDesc  = d.description;
          const titleEn  = rawTitle && typeof rawTitle === "object" ? (rawTitle.en || "") : (rawTitle || "");
          const titleAr  = rawTitle && typeof rawTitle === "object" ? (rawTitle.ar || "") : "";
          const descEn   = rawDesc  && typeof rawDesc  === "object" ? (rawDesc.en  || "") : (rawDesc  || "");
          const descAr   = rawDesc  && typeof rawDesc  === "object" ? (rawDesc.ar  || "") : "";
          const primaryLanguage = (d.primaryLanguage || d.language) === "ar" ? "ar" as const : "en" as const;

          setCore({
            titleEn,
            titleAr,
            destination:     d.destination  || "",
            price:           d.price        || "",
            currency:        d.currency     || "",
            nights:          d.nights ? String(d.nights) : "5",
            descriptionEn:   descEn,
            descriptionAr:   descAr,
            primaryLanguage,
            whatsapp:        d.whatsapp     || "",
            messenger:       d.messenger    || "",
            coverImage:      d.coverImage   || "",
          });

          if (d.templateId) setSelectedTemplateId(d.templateId);

          if (Array.isArray(d.sections) && d.sections.length > 0) {
            // Upgrade legacy section types, then supplement from any remaining flat fields
            setSections(supplementFromFlatFields(upgradeLegacySections(d.sections as AnySectionInstance[]), d));
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

            // Upgrade legacy section types + supplement with flat-field people/trek/scarcity
            setSections(supplementFromFlatFields(upgradeLegacySections(rebuilt), d));
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
      localStorage.setItem(DRAFT_KEY, JSON.stringify({ core, sections, templateId: selectedTemplateId }));
      setDraftStatus("saved");
    }, 1500);
    return () => clearTimeout(timer);
  }, [core, sections, selectedTemplateId, isEditMode, authLoading, uiPhase]);

  // ── Discard ──────────────────────────────────────────────────────────────────

  const handleDiscard = () => {
    const confirmed = confirm(
      l
        ? "سيتم حذف مسودتك. هل تريد الاستمرار؟"
        : "Discard this package? Your draft will be lost."
    );
    if (!confirmed) return;
    localStorage.removeItem(DRAFT_KEY);
    router.push("/packages");
  };

  // ── Submit ───────────────────────────────────────────────────────────────────

  const handleSubmit = async () => {
    if (!core.destination || !core.price) {
      setError(l ? "الوجهة والسعر مطلوبان" : "Destination and price are required.");
      return;
    }
    setError(null);
    setGenerating(true);
    try {
      const payload = buildApiPayload(core, sections, user.uid, selectedTemplateId, isEditMode ? editId ?? undefined : undefined);

      if (isEditMode && editId) {
        const res = await fetch("/api/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = await res.json();
        if (!res.ok) { setError(json.error || "Something went wrong."); return; }
        if (json.agencySlug) setAgencySlug(json.agencySlug);
        posthog.capture("package_updated", { destination: core.destination, language: core.primaryLanguage, templateId: selectedTemplateId });
        router.push("/packages");
        return;
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
        posthog.capture("package_published", { destination: core.destination, language: core.primaryLanguage, nights: core.nights, templateId: selectedTemplateId });
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
    ? process.env.NODE_ENV === "development"
      ? `http://localhost:3000/${agencySlug}/${finalPackageId}`
      : `https://${agencySlug}.packmetrix.com/${finalPackageId}`
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
          <span className="spinner-warm" />
        </div>
      </AppLayout>
    );
  }

  // ── Success (PublishSuccess) ─────────────────────────────────────────────────

  if (done && finalPackageId) {
    const LS = l ? {
      title: isEditMode ? "تم حفظ التغييرات." : "تم نشر صفحة الباقة!",
      sub: isEditMode
        ? "تم تحديث الصفحة بنجاح."
        : "صفحة هبوطك جاهزة للمشاركة. الصقها في واتساب أو إنستغرام أو التيك توك.",
      copy: "نسخ الرابط", copied: "تم النسخ",
      preview: "معاينة الصفحة",
      dashboard: "العودة للوحة",
      share: "مشاركة عبر",
      wa: "واتساب", ig: "إنستغرام",
      next: "ما الخطوة التالية؟",
      next1: "شارك الرابط مع عملائك المهتمين",
      next2: "كل ضغط على واتساب يظهر فوراً في لوحة العملاء",
      next3: "اصنع باقة جديدة في دقائق",
    } : {
      title: isEditMode ? "Changes saved." : "Landing page is live.",
      sub: isEditMode
        ? "Your page has been updated successfully."
        : "Your package page is ready to share. Paste the link into WhatsApp, Instagram or TikTok and watch the leads come in.",
      copy: "Copy link", copied: "Copied",
      preview: "Preview page",
      dashboard: "Back to dashboard",
      share: "Share via",
      wa: "WhatsApp", ig: "Instagram",
      next: "What happens next?",
      next1: "Send the link to interested travellers",
      next2: "Every WhatsApp tap lands in your Leads inbox in real time",
      next3: "Build another package in minutes",
    };
    return (
      <AppLayout>
        <div dir={l ? "rtl" : "ltr"} style={{
          flex: 1, padding: "60px 40px",
          background: DA_BG, overflowY: "auto",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontFamily: "inherit",
        }}>
          <div style={{ width: "100%", maxWidth: 640, textAlign: "center" }}>
            <div style={{ width: 72, height: 72, borderRadius: "50%", background: DA_GREEN_SOFT, color: DA_GREEN, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Icon name="check" size={32} color={DA_GREEN} strokeWidth={2.5} />
            </div>
            <div style={{ fontFamily: DISPLAY, fontSize: 52, fontWeight: 400, color: DA_INK1, marginTop: 24, letterSpacing: -1.2, lineHeight: 1 }}>
              {LS.title}
            </div>
            <div style={{ fontSize: 14, color: DA_INK2, marginTop: 14, lineHeight: 1.55, maxWidth: 460, margin: "14px auto 0" }}>
              {LS.sub}
            </div>

            {/* URL row */}
            <div style={{ marginTop: 28, padding: 6, background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 12, display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ flex: 1, padding: "10px 14px", display: "flex", alignItems: "center", gap: 10, fontSize: 13, color: DA_INK1, fontFamily: "var(--font-jetbrains-mono), ui-monospace, monospace" }}>
                <Icon name="link" size={14} color={DA_GOLD} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", direction: "ltr" }}>{shareUrl}</span>
              </div>
              <button onClick={handleCopy} style={{ background: copied ? DA_GREEN_SOFT : DA_GOLD, border: "none", borderRadius: 9, padding: "10px 16px", color: copied ? DA_GREEN : "#fff", fontFamily: "inherit", fontSize: 13, fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6 }}>
                <Icon name="copy" size={13} color={copied ? DA_GREEN : "#fff"} />
                {copied ? LS.copied : LS.copy}
              </button>
            </div>

            {/* CTAs */}
            <div style={{ display: "flex", gap: 10, justifyContent: "center", marginTop: 16 }}>
              <button onClick={() => router.push(`/${agencySlug}/${finalPackageId}`)} style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 10, padding: "10px 20px", fontSize: 13.5, fontWeight: 500, fontFamily: "inherit", cursor: "pointer", color: DA_INK1, display: "flex", alignItems: "center", gap: 7 }}>
                <Icon name="eye" size={14} color={DA_INK2} /> {LS.preview}
              </button>
              <button onClick={() => router.push("/dashboard")} style={{ background: "transparent", border: "none", borderRadius: 10, padding: "10px 20px", fontSize: 13.5, color: DA_INK3, fontFamily: "inherit", cursor: "pointer" }}>
                {LS.dashboard}
              </button>
            </div>

            {/* Share rail */}
            <div style={{ marginTop: 28, padding: "16px 18px", background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 12, display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, color: DA_INK3 }}>{LS.share}</div>
              <button style={{ padding: "7px 14px", background: "#25D366", color: "#fff", border: "none", borderRadius: 8, fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, display: "inline-flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                <Icon name="whatsapp" size={13} color="#fff" /> {LS.wa}
              </button>
              <button style={{ padding: "7px 14px", background: "linear-gradient(135deg, #f58529 0%, #dd2a7b 50%, #8134af 100%)", color: "#fff", border: "none", borderRadius: 8, fontFamily: "inherit", fontSize: 12.5, fontWeight: 600, cursor: "pointer" }}>
                {LS.ig}
              </button>
            </div>

            {/* Next steps */}
            <div style={{ marginTop: 28, padding: "18px 22px", background: DA_GOLD_SOFT, border: `1px solid rgba(176,138,62,.3)`, borderRadius: 12, textAlign: "left" as const }}>
              <div style={{ fontSize: 11.5, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase" as const, color: DA_GOLD_DEEP, marginBottom: 10 }}>{LS.next}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {[LS.next1, LS.next2, LS.next3].map((line, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: DA_GOLD, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "inherit", fontSize: 11, fontWeight: 600, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ fontSize: 13, color: DA_INK1 }}>{line}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  // ── Discard bar (template + preset phases) ───────────────────────────────────

  const DiscardTopBar = !isEditMode ? (
    <div dir={l ? "rtl" : "ltr"} style={{
      height: 52, paddingInline: 24,
      borderBottom: `1px solid ${DA_RULE}`,
      background: DA_BG,
      display: "flex", alignItems: "center", gap: 10, justifyContent: "flex-end",
      flexShrink: 0,
    }}>
      {/* Language toggle */}
      <div style={{ display: "flex", background: DA_SURFACE2, border: `1px solid ${DA_RULE2}`, borderRadius: 999, padding: 2 }}>
        {(["en", "ar"] as const).map(code => {
          const active = lang === code;
          return (
            <button
              key={code}
              onClick={() => switchLang(code)}
              style={{
                padding: "4px 11px", borderRadius: 999, border: "none",
                background: active ? DA_INK1 : "transparent",
                color: active ? DA_BG : DA_INK2,
                fontFamily: `var(--font-inter-tight), system-ui, sans-serif`,
                fontSize: 11.5, fontWeight: 500, cursor: "pointer", transition: "all .15s",
              }}
            >
              {code === "en" ? "EN" : "عربي"}
            </button>
          );
        })}
      </div>
      <button
        onClick={handleDiscard}
        style={{
          padding: "6px 14px",
          background: "transparent",
          border: `1px solid ${DA_RULE2}`,
          borderRadius: 8,
          color: DA_INK3,
          fontSize: 12.5,
          fontWeight: 500,
          cursor: "pointer",
          fontFamily: `var(--font-inter-tight), system-ui, sans-serif`,
        }}
      >
        {l ? "تجاهل" : "Discard"}
      </button>
    </div>
  ) : undefined;

  // ── Template + trip-type step ────────────────────────────────────────────────

  if (uiPhase === "template") {
    return (
      <AppLayout topbar={DiscardTopBar}>
        <VisualTemplatePicker
          selectedId={selectedTemplateId}
          isEditMode={isEditMode}
          onCancel={isEditMode ? () => setUiPhase("build") : undefined}
          onStart={(templateId, tripTypeId, userPresetSections) => {
            setSelectedTemplateId(templateId);
            const hasExisting = sections.length > 0;
            if (userPresetSections) {
              setSections(userPresetSections);
            } else if (tripTypeId) {
              const preset = PRESET_MAP[tripTypeId];
              if (preset) {
                const instantiated: AnySectionInstance[] = preset.sections.map((ps, i) => ({
                  id: `${ps.type}_${Date.now()}_${i}`,
                  type: ps.type,
                  order: hasExisting ? sections.length + i : i,
                  data: { ...(SECTION_REGISTRY[ps.type as keyof typeof SECTION_REGISTRY]?.defaultData ?? {}), ...(ps.data ?? {}) },
                } as AnySectionInstance));
                if (hasExisting) {
                  setSections((prev) => {
                    const existingTypes = new Set(prev.map((s) => s.type));
                    const missing = instantiated.filter((s) => !existingTypes.has(s.type));
                    return [...prev, ...missing.map((s, i) => ({ ...s, order: prev.length + i }))];
                  });
                } else {
                  setSections(instantiated);
                }
              }
            }
            setTab("sections");
            setUiPhase("build");
          }}
          lang={lang}
          isMobile={isMobile}
          userId={user?.uid}
          onAiExtract={(result) => {
            setCore((c) => ({
              ...c,
              ...(result.destination     ? { destination:     result.destination }     : {}),
              ...(result.price           ? { price:           result.price }           : {}),
              ...(result.nights          ? { nights:          result.nights }          : {}),
              ...(result.titleEn         ? { titleEn:         result.titleEn }         : {}),
              ...(result.titleAr         ? { titleAr:         result.titleAr }         : {}),
              ...(result.descriptionEn   ? { descriptionEn:   result.descriptionEn }   : {}),
              ...(result.descriptionAr   ? { descriptionAr:   result.descriptionAr }   : {}),
              ...(result.primaryLanguage ? { primaryLanguage: result.primaryLanguage } : {}),
            }));
            if (result.includes?.length) {
              setSections((prev) => {
                if (prev.some((s) => s.type === "inclusions")) return prev;
                return [...prev, {
                  id: `inclusions_ai_${Date.now()}`,
                  type: "inclusions" as const,
                  order: prev.length,
                  data: { includes: result.includes!, excludes: [] },
                }];
              });
            }
            if (result.suggestedTemplateId) setSelectedTemplateId(result.suggestedTemplateId);
            setUiPhase("build");
          }}
        />
      </AppLayout>
    );
  }

  // ── Build view ───────────────────────────────────────────────────────────────

  const selectedTpl = TEMPLATES.find(t => t.id === selectedTemplateId);
  const pkgDisplayName = core.titleEn || core.titleAr || core.destination || undefined;
  const templateDisplayName = selectedTpl ? (l ? selectedTpl.nameAr : selectedTpl.name) : undefined;

  return (
    <AppLayout topbar={
      <BuilderTopBar
        pkgName={pkgDisplayName}
        templateName={templateDisplayName}
        draftSaved={draftStatus === "saved"}
        onChangeTemplate={() => setUiPhase("template")}
        onPublish={handleSubmit}
        publishing={generating}
        isEditMode={isEditMode}
        onBack={isEditMode ? () => router.push("/packages") : undefined}
        onDiscard={!isEditMode ? handleDiscard : undefined}
      />
    }>
      <div style={{ flex: 1, overflow: "auto", padding: isMobile ? "20px 16px 80px" : "28px 40px 60px" }}>

        {/* Save-as-template modal */}
        {saveAsOpen && (
          <div style={{ position: "fixed", inset: 0, zIndex: 999, background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }} onClick={() => setSaveAsOpen(false)}>
            <div style={{ background: DA_SURFACE2, border: `1px solid ${DA_RULE}`, borderRadius: 18, padding: "28px 24px", width: "100%", maxWidth: 380 }} onClick={e => e.stopPropagation()}>
              <div style={{ fontSize: 16, fontWeight: 600, marginBottom: 6, color: DA_INK1 }}>{t.saveAsTemplateModalTitle}</div>
              <div style={{ fontSize: 12.5, color: DA_INK3, marginBottom: 18, lineHeight: 1.5 }}>
                {l ? `سيتم حفظ ${sections.length} قسماً كقالب يمكنك إعادة استخدامه.` : `Save ${sections.length} sections as a reusable template.`}
              </div>
              <input
                autoFocus value={saveName} onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSaveAsTemplate(); }}
                onFocus={e => { e.currentTarget.style.borderColor = DA_GOLD; }}
                onBlur={e => { e.currentTarget.style.borderColor = DA_RULE; }}
                placeholder={t.saveAsTemplatePlaceholder}
                style={{ width: "100%", background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 10, padding: "9px 14px", color: DA_INK1, fontSize: 13.5, fontFamily: "inherit", outline: "none", boxSizing: "border-box" as const }}
              />
              <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                <button onClick={() => setSaveAsOpen(false)} style={{ flex: 1, padding: "9px", borderRadius: 9, border: `1px solid ${DA_RULE}`, background: DA_SURFACE, color: DA_INK2, fontSize: 13, cursor: "pointer", fontFamily: "inherit" }}>
                  {t.saveAsTemplateCancel}
                </button>
                <button onClick={handleSaveAsTemplate} disabled={!saveName.trim() || saveAsStatus === "saving" || saveAsStatus === "saved"}
                  style={{ flex: 2, padding: "9px", borderRadius: 9, border: saveAsStatus === "saved" ? `1px solid ${DA_GREEN}` : "none", background: saveAsStatus === "saved" ? DA_GREEN_SOFT : !saveName.trim() ? DA_SURFACE : DA_GOLD, color: saveAsStatus === "saved" ? DA_GREEN : !saveName.trim() ? DA_INK3 : "#fff", fontSize: 13, fontWeight: 700, cursor: !saveName.trim() || saveAsStatus !== "idle" ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                  {saveAsStatus === "saving" ? t.saveAsTemplateSaving : saveAsStatus === "saved" ? t.saveAsTemplateSaved : t.saveAsTemplateSave}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab bar + secondary actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "inline-flex", background: DA_SURFACE, border: `1px solid ${DA_RULE2}`, borderRadius: 10, padding: 4, gap: 4 }}>
            {(["core", "sections", "seo"] as Tab[]).map((tabKey) => {
              const active = tab === tabKey;
              const tabLabel = tabKey === "core"
                ? (l ? "المعلومات الأساسية" : "Core info")
                : tabKey === "sections"
                  ? (l ? "الأقسام" : "Sections")
                  : (l ? "SEO والمشاركة" : "SEO & social");
              const count = tabKey === "sections" ? sections.length : undefined;
              return (
                <button
                  key={tabKey}
                  onClick={() => setTab(tabKey)}
                  style={{
                    padding: "7px 14px", borderRadius: 7, border: "none",
                    background: active ? DA_INK1 : "transparent",
                    color: active ? DA_BG : DA_INK2,
                    fontSize: 13, fontWeight: active ? 500 : 400,
                    fontFamily: "inherit", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: 7,
                    transition: "all 0.15s",
                  }}
                >
                  {tabLabel}
                  {count !== undefined && (
                    <span style={{ fontSize: 10.5, fontFamily: "var(--font-jetbrains-mono), monospace", background: active ? "rgba(255,255,255,.12)" : DA_BG, color: active ? DA_BG : DA_INK3, borderRadius: 999, padding: "1px 7px" }}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Secondary actions */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {sections.length > 0 && (
              <button onClick={() => { setSaveAsOpen(true); setSaveName(""); setSaveAsStatus("idle"); }} style={{ fontSize: 12, color: DA_INK3, background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 8, padding: "5px 10px", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 5 }}>
                <Icon name="copy" size={11} color={DA_INK3} />
                {t.saveAsTemplateBtn}
              </button>
            )}
          </div>
        </div>

        {/* Content + preview rail */}
        <div style={{ display: "flex", gap: 36, alignItems: "flex-start" }}>
          <div className="fade-in" key={tab} style={{ flex: 1, minWidth: 0 }}>
            {tab === "core" && (
              <CoreFieldsEditor core={core} onChange={setCore} userId={user?.uid ?? ""} lang={lang} />
            )}
            {tab === "sections" && (
              <SectionList sections={sections} onChange={setSections} userId={user?.uid ?? ""} lang={lang} templateId={selectedTemplateId} />
            )}
            {tab === "seo" && (
              <SeoTab core={core} lang={lang} />
            )}
          </div>

          {!isMobile && (
            <div style={{ flexShrink: 0, position: "sticky", top: 24 }}>
              <LivePreviewPhone core={core} sections={sections} lang={lang} templateId={selectedTemplateId} />
            </div>
          )}
        </div>

        {error && (
          <p style={{ marginTop: 16, fontSize: 13, color: DA_DANGER }}>{error}</p>
        )}
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
