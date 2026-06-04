"use client";

import Icon from "@/components/Icon";
import { useLang, switchLang } from "@/hooks/useLang";
import {
  DA_BG, DA_RULE, DA_INK1, DA_INK2, DA_INK3,
  DA_SURFACE, DA_RULE2, DA_GOLD, DA_GREEN,
} from "@/lib/tokens";

const SANS = `var(--font-inter-tight), system-ui, sans-serif`;

export function BuilderTopBar({
  pkgName,
  templateName,
  draftSaved,
  onChangeTemplate,
  onPublish,
  publishing,
  isEditMode,
  onBack,
  onDiscard,
  isMobile = false,
}: {
  pkgName?: string;
  templateName?: string;
  draftSaved: boolean;
  onChangeTemplate: () => void;
  onPublish: () => void;
  publishing?: boolean;
  isEditMode?: boolean;
  onBack?: () => void;
  onDiscard?: () => void;
  isMobile?: boolean;
}) {
  const lang = useLang();
  const isAr = lang === "ar";

  const L = isAr ? {
    workspace: "الوكالة",
    builder: "المنشئ",
    back: "الباقات",
    discard: "تجاهل",
    draftSaved: "تم الحفظ",
    changeTemplate: "تغيير القالب",
    publish: isEditMode ? "حفظ" : "نشر",
    publishFull: isEditMode ? "حفظ التغييرات" : "نشر الصفحة",
    publishing: isEditMode ? "جاري الحفظ…" : "جاري النشر…",
  } : {
    workspace: "Workspace",
    builder: "Builder",
    back: "Packages",
    discard: "Discard",
    draftSaved: "Saved",
    changeTemplate: "Change template",
    publish: isEditMode ? "Save" : "Publish",
    publishFull: isEditMode ? "Save changes" : "Publish page",
    publishing: isEditMode ? "Saving…" : "Publishing…",
  };

  // ── Mobile layout ───────────────────────────────────────────────────────────
  if (isMobile) {
    return (
      <div dir={isAr ? "rtl" : "ltr"} style={{
        height: 56, paddingInline: 12,
        borderBottom: `1px solid ${DA_RULE}`,
        background: DA_BG,
        display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
      }}>
        {/* Back / Discard */}
        {isEditMode && onBack ? (
          <button
            onClick={onBack}
            style={{
              display: "inline-flex", alignItems: "center", gap: 4,
              padding: "6px 10px",
              background: "transparent",
              border: `1px solid ${DA_RULE2}`,
              borderRadius: 7,
              color: DA_INK2,
              fontFamily: SANS,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points={isAr ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
            </svg>
            {L.back}
          </button>
        ) : !isEditMode && onDiscard ? (
          <button
            onClick={onDiscard}
            style={{
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              width: 34, height: 34,
              background: "transparent",
              border: `1px solid ${DA_RULE2}`,
              borderRadius: 8,
              color: DA_INK3,
              cursor: "pointer",
              flexShrink: 0,
            }}
          >
            <Icon name="x" size={16} color={DA_INK3} />
          </button>
        ) : null}

        {/* Package name / builder label */}
        <div style={{
          flex: 1, minWidth: 0,
          fontFamily: SANS, fontSize: 13.5, fontWeight: 500,
          color: DA_INK1,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {pkgName || L.builder}
        </div>

        {/* Draft saved indicator */}
        {draftSaved && (
          <div style={{ display: "flex", alignItems: "center", gap: 4, color: DA_GREEN, flexShrink: 0 }}>
            <Icon name="check" size={12} color={DA_GREEN} strokeWidth={2.5} />
            <span style={{ fontFamily: SANS, fontSize: 11 }}>{L.draftSaved}</span>
          </div>
        )}

        {/* Change template — icon only on mobile */}
        <button
          onClick={onChangeTemplate}
          style={{
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            width: 34, height: 34,
            background: DA_SURFACE, border: `1px solid ${DA_RULE2}`,
            borderRadius: 8, color: DA_INK2,
            cursor: "pointer", flexShrink: 0,
          }}
          title={L.changeTemplate}
        >
          <Icon name="image" size={15} color={DA_INK2} />
        </button>

        {/* Publish CTA */}
        <button
          data-testid="builder-publish"
          onClick={onPublish}
          disabled={publishing}
          style={{
            padding: "8px 14px",
            background: publishing ? DA_SURFACE : DA_GOLD,
            border: publishing ? `1px solid ${DA_RULE2}` : "none",
            borderRadius: 9, color: publishing ? DA_INK3 : "#fff",
            fontFamily: SANS, fontSize: 12.5, fontWeight: 600,
            cursor: publishing ? "not-allowed" : "pointer",
            display: "inline-flex", alignItems: "center", gap: 5,
            flexShrink: 0,
          }}
        >
          {publishing ? (
            <>
              <span className="spinner" style={{ width: 11, height: 11, borderWidth: 1.5, borderTopColor: DA_GOLD }} />
              {L.publishing}
            </>
          ) : (
            <>
              <Icon name="sparkle" size={13} color="#fff" />
              {L.publish}
            </>
          )}
        </button>
      </div>
    );
  }

  // ── Desktop layout ──────────────────────────────────────────────────────────
  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{
      height: 60, paddingInline: 28,
      borderBottom: `1px solid ${DA_RULE}`,
      background: DA_BG,
      display: "flex", alignItems: "center", gap: 16, flexShrink: 0,
    }}>
      {/* Back button — edit mode only */}
      {isEditMode && onBack && (
        <button
          onClick={onBack}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "6px 10px",
            background: "transparent",
            border: `1px solid ${DA_RULE2}`,
            borderRadius: 7,
            color: DA_INK2,
            fontFamily: SANS,
            fontSize: 12,
            fontWeight: 500,
            cursor: "pointer",
            flexShrink: 0,
          }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points={isAr ? "9 18 15 12 9 6" : "15 18 9 12 15 6"} />
          </svg>
          {L.back}
        </button>
      )}

      {/* Breadcrumb */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        fontFamily: SANS, fontSize: 12.5, color: DA_INK3,
      }}>
        <span>{L.workspace}</span>
        <span>·</span>
        <span style={{ color: DA_INK1, fontWeight: 500 }}>{L.builder}</span>
        {pkgName && (
          <>
            <span>·</span>
            <span style={{ color: DA_INK2 }}>{pkgName}</span>
          </>
        )}
      </div>

      <div style={{ flex: 1 }} />

      {/* Language toggle */}
      <div style={{
        display: "flex",
        background: DA_SURFACE,
        border: `1px solid ${DA_RULE2}`,
        borderRadius: 999,
        padding: 2,
        flexShrink: 0,
      }}>
        {(["en", "ar"] as const).map(l => {
          const active = lang === l;
          return (
            <button
              key={l}
              onClick={() => switchLang(l)}
              style={{
                padding: "5px 12px",
                borderRadius: 999,
                border: "none",
                background: active ? DA_INK1 : "transparent",
                color: active ? DA_BG : DA_INK2,
                fontFamily: SANS,
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                transition: "all .15s",
              }}
            >
              {l === "en" ? "EN" : "عربي"}
            </button>
          );
        })}
      </div>

      {/* Draft saved */}
      {draftSaved && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontFamily: SANS, fontSize: 12, color: DA_GREEN }}>
          <Icon name="check" size={13} color={DA_GREEN} strokeWidth={2.5} />
          {L.draftSaved}
        </div>
      )}

      {/* Template chip */}
      {templateName && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "5px 10px 5px 8px",
          background: DA_SURFACE, border: `1px solid ${DA_RULE2}`,
          borderRadius: 999, fontFamily: SANS, fontSize: 12,
        }}>
          <span style={{ width: 7, height: 7, borderRadius: "50%", background: DA_GOLD, flexShrink: 0 }} />
          <span style={{ color: DA_INK1, fontWeight: 500 }}>{templateName}</span>
        </div>
      )}

      {/* Discard — new packages only */}
      {!isEditMode && onDiscard && (
        <button
          onClick={onDiscard}
          style={{
            padding: "7px 12px",
            background: "transparent",
            border: `1px solid ${DA_RULE2}`,
            borderRadius: 8,
            color: DA_INK3,
            fontFamily: SANS,
            fontSize: 12.5,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          {L.discard}
        </button>
      )}

      {/* Change template */}
      <button
        onClick={onChangeTemplate}
        style={{
          padding: "7px 12px",
          background: DA_SURFACE, border: `1px solid ${DA_RULE2}`,
          borderRadius: 8, color: DA_INK1, fontFamily: SANS, fontSize: 12.5, fontWeight: 500,
          cursor: "pointer", display: "inline-flex", alignItems: "center", gap: 6,
        }}
      >
        <Icon name="image" size={13} color={DA_INK2} />
        {L.changeTemplate}
      </button>

      {/* Publish CTA */}
      <button
        data-testid="builder-publish"
        onClick={onPublish}
        disabled={publishing}
        style={{
          padding: "9px 16px",
          background: publishing ? DA_SURFACE : DA_GOLD,
          border: publishing ? `1px solid ${DA_RULE2}` : "none",
          borderRadius: 9, color: publishing ? DA_INK3 : "#fff",
          fontFamily: SANS, fontSize: 13, fontWeight: 600,
          cursor: publishing ? "not-allowed" : "pointer",
          display: "inline-flex", alignItems: "center", gap: 7,
        }}
      >
        {publishing ? (
          <>
            <span className="spinner" style={{ width: 12, height: 12, borderWidth: 1.5, borderTopColor: DA_GOLD }} />
            {L.publishing}
          </>
        ) : (
          <>
            <Icon name="sparkle" size={14} color="#fff" />
            {L.publishFull}
          </>
        )}
      </button>
    </div>
  );
}
