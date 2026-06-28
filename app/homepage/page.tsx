"use client";

// Homepage section builder — the WRITE side over the homepage model
// (lib/homepage.ts). Toggle / reorder / edit the 11 buildable sections with a
// live preview, then "Save homepage" writes users/{uid}.homepage via
// homepageDocPatch (mirrors the Branding brandDocPatch flow). The 5 deferred
// section types are never offered. Hero is required (always enabled). Derived /
// Branding-owned content is read-only here (edited in Branding).

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";
import Icon from "@/components/Icon";
import { useLang } from "@/hooks/useLang";
import { useIsMobile } from "@/hooks/useIsMobile";
import {
  readHomepageConfig, isBuildableType, configDocPatch, makeSection, deriveDestinationItems,
  buildableFor, coreTypesFor, type DestinationTile, type HomePageKind, type HomeSection, type HomeSectionType,
} from "@/lib/homepage";
import { HomeSectionList } from "@/components/homebuilder/HomeSectionList";
import { HomePreviewPane } from "@/components/homebuilder/HomePreviewPane";
import { HomepageAddPicker } from "@/components/homebuilder/HomepageAddPicker";
import { DA_BG, DA_INK1, DA_INK3, DA_RULE2, DA_SURFACE, DA_GOLD, DA_GREEN, DA_GREEN_SOFT } from "@/lib/tokens";

const DISPLAY = `var(--font-display)`;
const SANS = `var(--font-sans)`;

type Seed = { hasAbout?: boolean; hasPackages?: boolean; hasDestinations?: boolean; hasContact?: boolean };

// Reconcile a stored page config → its editor list (core-default + add-on model).
// Keep stored buildable sections for THIS page in order; ensure every Core type
// is present (append missing Core disabled) so the backbone is always reachable.
// More sections appear only if they were added (present in the stored config) —
// introduced via the Add picker, not seeded. Hero is always enabled. Page-scoped:
// the homepage list never surfaces About-only sections (team) and vice-versa.
function buildEditorSections(raw: unknown, seed: Seed, page: HomePageKind): HomeSection[] {
  const stored = readHomepageConfig(raw, seed, page);
  const allowed = buildableFor(page);
  const buildable = stored.sections
    .filter((s) => isBuildableType(s.type) && allowed.includes(s.type))
    .map((s) => ({ ...s }));
  const present = new Set(buildable.map((s) => s.type));
  for (const type of coreTypesFor(page)) if (!present.has(type)) buildable.push(makeSection(type, false));
  return buildable.map((s, i) => ({ ...s, order: i, enabled: s.type === "hero" ? true : s.enabled }));
}

// Prefill the Countries section with package-derived tiles when the agency hasn't
// authored any yet, so the section opens already populated and editable. Once the
// agency has saved explicit countries (items present) we leave them untouched —
// the curated list is theirs. No packages → nothing to prefill (leave empty).
function prefillCountries(sections: HomeSection[], items: DestinationTile[]): HomeSection[] {
  if (!items.length) return sections;
  return sections.map((s) => {
    if (s.type !== "destinations") return s;
    const c = (s.content || {}) as Record<string, unknown>;
    if (Array.isArray(c.items) && c.items.length) return s;
    return { ...s, content: { ...c, items } as HomeSection["content"] };
  });
}

const STR = {
  en: { crumb: "Workspace · Settings · Pages", title: "Page Builder", subtitle: "The same section builder as a package — but for your site pages. Toggle, reorder and edit; the preview rebuilds instantly.", save: "Save & publish", saving: "Saving…", saved: "Saved", preview: "Preview page", sections: "Sections", on: "on", add: "Add a section", hint: "Drag to reorder · toggle to enable · edit for content.", pageHome: "Home", pageAbout: "About" },
  ar: { crumb: "الوكالة · الإعدادات · الصفحات", title: "منشئ الصفحات", subtitle: "نفس بنّاء أقسام الباقة — لكن لصفحات موقعك. فعّل، رتّب، وحرّر؛ تُعاد بناء المعاينة فوراً.", save: "حفظ ونشر", saving: "جارٍ الحفظ…", saved: "تم الحفظ", preview: "معاينة الصفحة", sections: "الأقسام", on: "مفعّل", add: "أضف قسماً", hint: "اسحب لإعادة الترتيب · بدّل للتفعيل · حرّر للمحتوى.", pageHome: "الرئيسية", pageAbout: "من نحن" },
};

export default function HomepageBuilderPage() {
  const router = useRouter();
  const lang = useLang();
  const isMobile = useIsMobile();
  const t = STR[lang];

  const [uid, setUid] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [agencyDoc, setAgencyDoc] = useState<Record<string, unknown>>({});
  const [agencySlug, setAgencySlug] = useState("preview");
  // Two independent page configs edited in the same builder, switched by `page`.
  const [page, setPage] = useState<HomePageKind>("home");
  const [sectionsByPage, setSectionsByPage] = useState<Record<HomePageKind, HomeSection[]>>({ home: [], about: [] });
  const [previewLang, setPreviewLang] = useState<"en" | "ar">("en");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  // Saved snapshot per page (state, not ref) so hasChanges is render-safe.
  const [savedByPage, setSavedByPage] = useState<Record<HomePageKind, string>>({ home: "", about: "" });

  const sections = sectionsByPage[page];
  const setSections = (next: HomeSection[]) => setSectionsByPage((prev) => ({ ...prev, [page]: next }));

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUid(u.uid);
      try {
        const snap = await getDoc(doc(db, "users", u.uid));
        const d = snap.exists() ? (snap.data() as Record<string, unknown>) : {};
        setAgencyDoc(d);
        setAgencySlug(String(d.agencySlug || "preview"));
        setPreviewLang(d.storefrontLanguage === "ar" ? "ar" : "en");
        const hasContact = !!(d.whatsapp || d.phone || d.email);

        // Distinct package countries → prefill the Countries section (and gate it
        // ON for an agency that has packages but no stored config yet).
        const pkgSnap = await getDocs(query(collection(db, "packages"), where("userId", "==", u.uid)));
        const destItems = deriveDestinationItems(
          pkgSnap.docs.map((p) => p.data() as { destination?: string; coverImage?: string; images?: string[] })
        );

        const homeEditor = prefillCountries(
          buildEditorSections(d.homepage, { hasAbout: !!(d.about_en || d.about_ar), hasContact, hasDestinations: destItems.length > 0 }, "home"),
          destItems,
        );
        const aboutEditor = buildEditorSections(d.aboutPage, { hasContact }, "about");
        setSectionsByPage({ home: homeEditor, about: aboutEditor });
        setSavedByPage({ home: JSON.stringify(homeEditor), about: JSON.stringify(aboutEditor) });
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [router]);

  const hasChanges = JSON.stringify(sections) !== savedByPage[page];

  const addSection = (type: HomeSectionType) => {
    if (sections.some((s) => s.type === type)) return;
    setSections([...sections, { ...makeSection(type, true), order: sections.length }]);
    setShowPicker(false);
  };

  const switchPage = (next: HomePageKind) => {
    if (next === page) return;
    setShowPicker(false);
    setPage(next);
  };

  // Open the live page in a new browser tab. Mirrors HomePreviewPane's
  // openDesktop: /{slug}/{page} is the catalog-mode preview; fall back to the
  // synthetic /home-preview for a brand-new agency with no slug yet.
  const openPreview = () => {
    const slug = agencySlug && agencySlug !== "preview" ? agencySlug : null;
    const url = slug ? `/${slug}/${page}?language=${previewLang}` : "/home-preview";
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleSave = async () => {
    if (!uid) return;
    setSaving(true);
    const patch = configDocPatch({ version: 1, sections }, page);
    await updateDoc(doc(db, "users", uid), patch);
    setSavedByPage((prev) => ({ ...prev, [page]: JSON.stringify(sections) }));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) {
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
      <div
        dir={lang === "ar" ? "rtl" : "ltr"}
        style={isMobile
          ? { padding: "16px 16px 40px" }
          : { height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", padding: "28px 32px", boxSizing: "border-box", maxWidth: 1400 }}
      >
        {/* Head */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: isMobile ? 20 : 18, flexShrink: 0 }}>
          <div>
            <div style={{ fontSize: 10.5, fontWeight: 700, fontFamily: SANS, color: DA_GOLD, textTransform: "uppercase", letterSpacing: "1.2px" }}>{t.crumb}</div>
            <div style={{ fontSize: 34, fontWeight: 400, fontFamily: DISPLAY, color: DA_INK1, letterSpacing: "-0.8px", marginTop: 6, lineHeight: 1 }}>{t.title}</div>
            <div style={{ fontSize: 13, fontFamily: SANS, color: DA_INK3, marginTop: 8, maxWidth: 460, lineHeight: 1.5 }}>{t.subtitle}</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <button
              onClick={openPreview}
              style={{
                padding: "9px 18px", borderRadius: 9, fontSize: 13, fontWeight: 600, fontFamily: SANS,
                background: DA_SURFACE, border: `1px solid ${DA_RULE2}`, color: DA_INK1, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 8, transition: "all .2s",
              }}
            >
              <Icon name="eye" size={13} color={DA_INK1} strokeWidth={2} />
              {t.preview}
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              style={{
                padding: "9px 20px", borderRadius: 9, fontSize: 13, fontWeight: 700, fontFamily: SANS,
                background: saved ? DA_GREEN_SOFT : DA_GOLD, border: saved ? `1px solid ${DA_GREEN}` : "none",
                color: saved ? DA_GREEN : "#fff", cursor: saving || !hasChanges ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", gap: 8, transition: "all .2s", opacity: hasChanges || saved ? 1 : 0.35,
              }}
            >
              {saving
                ? <><span className="spinner-warm" style={{ width: 13, height: 13, borderTopColor: "#fff" }} /> {t.saving}</>
                : saved
                ? <><Icon name="check" size={13} color={DA_GREEN} strokeWidth={2.5} /> {t.saved}</>
                : t.save}
            </button>
          </div>
        </div>

        {/* Page tabs — choose WHICH site page to edit. The About page is where
            the Team section lives; the Home page never offers it. */}
        <div style={{ display: "flex", gap: 6, marginBottom: 16, flexShrink: 0, borderBottom: `1px solid ${DA_RULE2}` }}>
          {(["home", "about"] as const).map((p) => {
            const on = page === p;
            return (
              <button
                key={p}
                onClick={() => switchPage(p)}
                style={{
                  position: "relative", padding: "10px 18px", border: "none", background: "transparent",
                  cursor: "pointer", fontFamily: SANS, fontSize: 14, fontWeight: on ? 700 : 600,
                  color: on ? DA_GOLD : DA_INK3, marginBottom: -1,
                  borderBottom: `2px solid ${on ? DA_GOLD : "transparent"}`, transition: "color .15s",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                  <Icon name={p === "home" ? "home" : "users"} size={14} color={on ? DA_GOLD : DA_INK3} />
                  {p === "home" ? t.pageHome : t.pageAbout}
                </span>
              </button>
            );
          })}
        </div>

        {/* Body: section list + sticky preview */}
        <div style={isMobile
          ? { display: "flex", flexDirection: "column", gap: 20 }
          : { flex: 1, minHeight: 0, display: "flex", gap: 28, alignItems: "flex-start" }}
        >
          <div style={isMobile ? {} : { flex: 1, minWidth: 0, maxWidth: 620, overflowY: "auto", height: "100%", paddingBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: DA_INK3, letterSpacing: ".5px", textTransform: "uppercase", marginBottom: 4 }}>
              {t.sections} · {sections.filter((s) => s.type === "hero" || s.enabled).length} {t.on}
            </div>
            <div style={{ fontSize: 12, color: DA_INK3, marginBottom: 14, lineHeight: 1.5 }}>{t.hint}</div>
            <HomeSectionList
              key={page}
              sections={sections}
              onChange={setSections}
              userId={uid || ""}
              lang={lang}
            />

            <div style={{ marginTop: 14 }}>
              {showPicker ? (
                <HomepageAddPicker
                  present={new Set(sections.map((s) => s.type))}
                  onAdd={addSection}
                  onClose={() => setShowPicker(false)}
                  lang={lang}
                  page={page}
                />
              ) : (
                <button
                  onClick={() => setShowPicker(true)}
                  style={{
                    width: "100%", padding: 14, background: DA_SURFACE, border: `2px dashed ${DA_RULE2}`,
                    borderRadius: 11, color: DA_GOLD, fontFamily: SANS, fontSize: 13.5, fontWeight: 500,
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 7, cursor: "pointer",
                  }}
                >
                  <Icon name="plus" size={15} color={DA_GOLD} />
                  {t.add}
                </button>
              )}
            </div>
          </div>

          <div style={isMobile ? { display: "flex", justifyContent: "center" } : { flexShrink: 0, position: "sticky", top: 0 }}>
            <HomePreviewPane
              config={{ version: 1, sections }}
              agency={agencyDoc}
              agencySlug={agencySlug}
              lang={previewLang}
              onLangChange={setPreviewLang}
              page={page}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
