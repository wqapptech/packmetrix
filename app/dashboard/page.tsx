"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import {
  collection, doc, getDoc, getDocs, query, where, orderBy, updateDoc,
} from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import posthog from "posthog-js";
import AppLayout from "@/components/AppLayout";
import Icon from "@/components/Icon";
import { useLang } from "@/hooks/useLang";
import { useIsMobile } from "@/hooks/useIsMobile";
import { T } from "@/lib/translations";
import {
  readOnboarding, onboardingDismissPatch, onboardingRestorePatch,
  onboardingChecklist, checklistProgress,
  type ChecklistItem,
} from "@/lib/onboarding";
import { homepageHasContent } from "@/lib/homepage";
import {
  DA_BG, DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2, DA_GOLD, DA_GOLD_DEEP, DA_GOLD_SOFT,
  DA_GREEN, DA_GREEN_SOFT, DA_DANGER,
} from "@/lib/tokens";
import { ConfirmModal } from "@/components/ConfirmModal";
import { locStr } from "@/components/templates/types";
import type { LocStr } from "@/components/templates/types";

const SANS    = `var(--font-sans)`;
const DISPLAY = `var(--font-display)`;
const MONO    = `var(--font-jetbrains-mono), monospace`;

type Package = {
  id: string;
  destination: string;
  title?: LocStr;
  price: string;
  views: number;
  whatsappClicks: number;
  messengerClicks: number;
  createdAt?: number;
  coverImage?: string;
  images?: string[];
  agencySlug?: string;
  isActive?: boolean;
  primaryLanguage?: "en" | "ar";
};

type Lead = {
  id: string;
  destination: string;
  price: string;
  channel: string;
  status: string;
  createdAt: number;
};


function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ── Launch checklist ───────────────────────────────────────────────────────────
// Persistent, derived-from-real-data guidance to a live site. Each step deep-links
// into its real editor; the "publish" step surfaces the shareable site link.

type ChecklistMeta = {
  label: string; sub: string; cta: string;
  action: () => void;
};

function LaunchChecklist({
  items, lang, isMobile = false, siteUrl,
  onBrand, onHomepage, onPackage, onDomain, onDismiss,
}: {
  items: ChecklistItem[];
  lang: "en" | "ar";
  isMobile?: boolean;
  siteUrl?: string;
  onBrand: () => void;
  onHomepage: () => void;
  onPackage: () => void;
  onDomain: () => void;
  onDismiss: () => void;
}) {
  const t = T[lang];
  const isAr = lang === "ar";
  const [copied, setCopied] = useState(false);

  const required = items.filter((it) => !it.optional);
  const doneCount = required.filter((it) => it.done).length;
  const pct = Math.round(checklistProgress(items) * 100);

  const copyLink = () => {
    if (!siteUrl) { onPackage(); return; }
    navigator.clipboard?.writeText(siteUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  const meta: Record<string, ChecklistMeta> = {
    brand:    { label: t.launchStepBrand,    sub: t.launchStepBrandSub,    cta: t.launchStepBrandCta,    action: onBrand },
    homepage: { label: t.launchStepHomepage, sub: t.launchStepHomepageSub, cta: t.launchStepHomepageCta, action: onHomepage },
    package:  { label: t.launchStepPackage,  sub: t.launchStepPackageSub,  cta: t.launchStepPackageCta,  action: onPackage },
    publish:  { label: t.launchStepPublish,  sub: t.launchStepPublishSub,  cta: copied ? t.launchStepPublishCopied : t.launchStepPublishCta, action: copyLink },
    domain:   { label: t.launchStepDomain,   sub: t.launchStepDomainSub,   cta: t.launchStepDomainCta,   action: onDomain },
  };

  return (
    <div style={{ background: DA_SURFACE, border: `1px solid ${DA_RULE}`, borderRadius: 16, overflow: "hidden" }}>
      {/* Header band */}
      <div style={{
        padding: isMobile ? "18px 16px" : "22px 28px",
        background: DA_GOLD_SOFT, borderBottom: `1px solid ${DA_RULE}`,
        display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 16, flexWrap: "wrap",
      }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: SANS, fontSize: 10.5, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD_DEEP }}>
            {t.launchEyebrow}
          </div>
          <div style={{ fontFamily: DISPLAY, fontSize: isMobile ? 24 : 30, fontWeight: 400, color: DA_INK1, marginTop: 8, letterSpacing: -0.5, lineHeight: 1.15 }}>
            {t.launchTitle}
          </div>
          {!isMobile && (
            <div style={{ fontFamily: SANS, fontSize: 13.5, color: DA_INK2, marginTop: 8, maxWidth: 520, lineHeight: 1.55 }}>
              {t.launchSub}
            </div>
          )}
        </div>
        <div style={{ textAlign: isAr ? "left" : "right" }}>
          <div style={{ fontFamily: MONO, fontSize: 11, color: DA_GOLD_DEEP, letterSpacing: -0.2, marginBottom: 8 }}>
            {doneCount} {t.launchProgressOf} {required.length} {t.launchProgressDone} · {pct}%
          </div>
          <div style={{ width: isMobile ? 120 : 160, height: 5, borderRadius: 3, background: "rgba(176,138,62,.22)", overflow: "hidden", marginInlineStart: isAr ? 0 : "auto" }}>
            <div style={{ width: `${pct}%`, height: "100%", background: DA_GOLD, borderRadius: 3, transition: "width .3s" }} />
          </div>
        </div>
      </div>

      {/* Step rows */}
      {items.map((item, i) => {
        const m = meta[item.key];
        const isDone = item.done;
        return (
          <div key={item.key} style={{
            display: "flex", alignItems: "center", gap: isMobile ? 12 : 18,
            padding: isMobile ? "14px 16px" : "16px 28px",
            borderBottom: i < items.length - 1 ? `1px solid ${DA_RULE}` : "none",
          }}>
            {/* Check circle */}
            <div style={{
              width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
              background: isDone ? DA_GREEN : DA_BG,
              border: isDone ? "none" : `1px dashed ${DA_RULE2}`,
              color: isDone ? "#fff" : DA_INK3,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontFamily: SANS, fontSize: 12, fontWeight: 600,
            }}>
              {isDone ? <Icon name="check" size={15} color="#fff" strokeWidth={2.5} /> : i + 1}
            </div>

            {/* Body */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <div style={{ fontFamily: SANS, fontSize: 14.5, fontWeight: 600, color: DA_INK1, textDecoration: isDone ? "line-through" : "none", opacity: isDone ? 0.7 : 1 }}>
                  {m.label}
                </div>
                {item.optional && (
                  <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 600, color: DA_INK3, padding: "1px 6px", borderRadius: 4, background: DA_BG }}>
                    {t.launchOptional}
                  </span>
                )}
              </div>
              {!isDone && !isMobile && (
                <div style={{ fontFamily: SANS, fontSize: 12.5, color: DA_INK2, marginTop: 3 }}>{m.sub}</div>
              )}
            </div>

            {/* Action / done chip */}
            {isDone ? (
              <div style={{ fontFamily: SANS, fontSize: 11.5, color: DA_GREEN, fontWeight: 500, display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                <Icon name="check" size={12} color={DA_GREEN} strokeWidth={2.5} />
                {t.launchDone}
              </div>
            ) : (
              <button onClick={m.action} style={{
                display: "inline-flex", alignItems: "center", gap: 6, flexShrink: 0,
                padding: "8px 14px", borderRadius: 9,
                background: item.key === "domain" ? "none" : DA_GOLD,
                border: item.key === "domain" ? `1px solid ${DA_RULE2}` : "none",
                color: item.key === "domain" ? DA_INK2 : "#fff",
                fontFamily: SANS, fontWeight: 600, fontSize: 12.5, cursor: "pointer",
              }}>
                {item.key === "publish" && siteUrl && <Icon name="copy" size={13} color="#fff" />}
                {m.cta}
              </button>
            )}
          </div>
        );
      })}

      {/* Footer: dismiss */}
      <div style={{ padding: isMobile ? "10px 16px" : "12px 28px", borderTop: `1px solid ${DA_RULE}`, display: "flex", justifyContent: isAr ? "flex-start" : "flex-end" }}>
        <button onClick={onDismiss} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: SANS, fontSize: 12, color: DA_INK3 }}>
          {t.launchDismiss}
        </button>
      </div>
    </div>
  );
}

// ── Stat tile ──────────────────────────────────────────────────────────────────

function StatTile({
  eyebrow, value, sub, trend, ghosted = false, compact = false,
}: {
  eyebrow: string;
  value: string;
  sub: string;
  trend?: string;
  ghosted?: boolean;
  compact?: boolean;
}) {
  return (
    <div style={{
      background: ghosted ? "transparent" : DA_SURFACE,
      border: `1px solid ${DA_RULE}`,
      borderStyle: ghosted ? "dashed" : "solid",
      borderRadius: 12,
      padding: compact ? "14px 14px" : 20,
      opacity: ghosted ? 0.65 : 1,
    }}>
      <div style={{
        fontFamily: SANS, fontSize: compact ? 9.5 : 10.5, fontWeight: 600,
        letterSpacing: 1.2, textTransform: "uppercase", color: DA_INK3,
      }}>
        {eyebrow}
      </div>
      <div style={{
        fontFamily: DISPLAY, fontSize: compact ? 30 : 40, fontWeight: 400,
        color: ghosted ? DA_INK3 : DA_INK1,
        marginTop: compact ? 6 : 10, letterSpacing: -1, lineHeight: 1,
      }}>
        {value}
      </div>
      <div style={{
        marginTop: 6, display: "flex", alignItems: "center", gap: 6,
        fontSize: compact ? 10.5 : 12, color: DA_INK2,
      }}>
        {trend && (
          <span style={{ color: DA_GREEN, fontFamily: MONO, fontSize: 11, letterSpacing: -0.2 }}>
            {trend}
          </span>
        )}
        <span>{sub}</span>
      </div>
    </div>
  );
}

// ── Package row ────────────────────────────────────────────────────────────────

function PackageRow({
  pkg, lang, isMobile, onView, onEdit, onDeleteRequest, isLast,
}: {
  pkg: Package;
  lang: "en" | "ar";
  isMobile?: boolean;
  onView: () => void;
  onEdit: () => void;
  onDeleteRequest: () => void;
  isLast: boolean;
}) {
  const t = T[lang];

  const isLive    = pkg.isActive !== false && !!pkg.agencySlug;
  const thumbUrl  = pkg.coverImage || pkg.images?.[0];
  const clicks    = (pkg.whatsappClicks || 0) + (pkg.messengerClicks || 0);
  const conv      = (pkg.views || 0) > 0 ? ((clicks / pkg.views) * 100) : 0;
  const convStr   = conv.toFixed(1) + "%";

  const dotColors = ["#c9713a", "#2d7a4e", "#2563a8", "#7c3aed", "#0f766e"];
  const dotColor  = dotColors[Math.abs(pkg.id.charCodeAt(0)) % dotColors.length];

  return (
    <div
      onMouseEnter={e => !isMobile && (e.currentTarget.style.background = DA_BG)}
      onMouseLeave={e => !isMobile && (e.currentTarget.style.background = "transparent")}
      style={{
        display: "flex", alignItems: "center", gap: 14,
        padding: isMobile ? "12px 16px" : "14px 22px",
        borderBottom: isLast ? "none" : `1px solid ${DA_RULE}`,
        transition: "background .12s",
      }}
    >
      {/* Thumbnail */}
      <div style={{
        width: isMobile ? 44 : 56,
        height: isMobile ? 44 : 56,
        borderRadius: 9, flexShrink: 0,
        background: thumbUrl ? `url("${thumbUrl}") center/cover` : dotColor,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden",
        border: `1px solid ${DA_RULE}`,
      }}>
        {!thumbUrl && (
          <Icon name="map" size={isMobile ? 14 : 16} color="rgba(255,255,255,0.7)" />
        )}
      </div>

      {/* Name + stats */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
          <div style={{
            fontFamily: SANS, fontSize: 13.5, fontWeight: 500, color: DA_INK1,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}>
            {locStr(pkg.title, pkg.primaryLanguage || lang) || pkg.destination}
          </div>
          <span style={{
            padding: "1px 7px", borderRadius: 99, fontSize: 10, fontWeight: 600,
            background: isLive ? DA_GREEN_SOFT : DA_BG,
            color: isLive ? DA_GREEN : DA_INK3,
            flexShrink: 0,
          }}>
            {isLive ? t.dashLive : t.dashDraft}
          </span>
        </div>
        <div style={{
          display: "flex", gap: 12,
          fontFamily: MONO, fontSize: 11, color: DA_INK3, letterSpacing: -0.2,
        }}>
          <span>{(pkg.views || 0).toLocaleString()} {t.statViews.toLowerCase()}</span>
          <span>{clicks} {t.statLeads.toLowerCase()}</span>
          <span>{convStr}</span>
          {pkg.price && <span>· {pkg.price}</span>}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
        <button onClick={onView} title={t.viewBtn} style={{
          width: 30, height: 30, borderRadius: 7,
          border: `1px solid ${DA_RULE2}`, background: DA_SURFACE2,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="eye" size={13} color={DA_INK2} />
        </button>
        <button onClick={onEdit} title={t.editBtn} style={{
          width: 30, height: 30, borderRadius: 7,
          border: `1px solid ${DA_RULE2}`, background: DA_SURFACE2,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Icon name="edit" size={13} color={DA_INK2} />
        </button>
        <button
          onClick={onDeleteRequest}
          title={t.deletePackage}
          style={{
            width: 30, height: 30, borderRadius: 7,
            border: `1px solid ${DA_DANGER}30`,
            background: "none", cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <Icon name="trash" size={13} color={`${DA_DANGER}99`} />
        </button>
      </div>
    </div>
  );
}

// ── First-run dashboard ────────────────────────────────────────────────────────

function DashboardFirstRun({
  agencyName, lang, isMobile,
  checklistItems, checklistDismissed, siteUrl,
  onBranding, onBuild, onHomepage, onDomain, onDismissChecklist, onRestoreChecklist,
}: {
  agencyName: string;
  lang: "en" | "ar";
  isMobile: boolean;
  checklistItems: ChecklistItem[];
  checklistDismissed: boolean;
  siteUrl?: string;
  onBranding: () => void;
  onBuild: () => void;
  onHomepage: () => void;
  onDomain: () => void;
  onDismissChecklist: () => void;
  onRestoreChecklist: () => void;
}) {
  const t = T[lang];
  const isAr = lang === "ar";

  const ghostMetrics = [
    { eyebrow: t.pageViews,  value: "—", sub: t.rangeLast30 },
    { eyebrow: t.leads,      value: "—", sub: t.rangeLast30 },
    { eyebrow: t.booked,     value: "—", sub: t.rangeLast30 },
    { eyebrow: t.viewToLead, value: "—", sub: t.rangeLast30 },
  ];

  return (
    <div style={{ padding: isMobile ? "16px 16px 40px" : "32px 40px 56px" }}>
      {/* Greeting */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontFamily: SANS, fontSize: 10.5, fontWeight: 600,
          letterSpacing: 1.2, textTransform: "uppercase",
          color: DA_INK3, marginBottom: 10,
        }}>
          {t.crumbWorkspace} · {t.navDashboard}
        </div>
        <div style={{
          fontFamily: DISPLAY,
          fontSize: isMobile ? 34 : 48,
          fontWeight: 400,
          color: DA_INK1, letterSpacing: -1, lineHeight: 1,
        }}>
          {t.dashWelcome}, {agencyName}
        </div>
        <div style={{
          fontFamily: SANS, fontSize: 14, color: DA_INK2,
          marginTop: 10, maxWidth: 560,
        }}>
          {isAr
            ? "حساب جديد · لا توجد بيانات بعد. لنبدأ الرحلة."
            : "Brand new account · no data yet. Let's get you to your first live page."
          }
        </div>
      </div>

      {/* Launch checklist */}
      {!checklistDismissed ? (
        <div style={{ marginBottom: 32 }}>
          <LaunchChecklist
            items={checklistItems}
            lang={lang}
            isMobile={isMobile}
            siteUrl={siteUrl}
            onBrand={onBranding}
            onHomepage={onHomepage}
            onPackage={onBuild}
            onDomain={onDomain}
            onDismiss={onDismissChecklist}
          />
        </div>
      ) : (
        /* Recoverable when hidden — a subtle bar, not a nag */
        <div style={{
          marginBottom: 32,
          display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
          padding: "12px 16px", background: DA_SURFACE,
          border: `1px solid ${DA_RULE}`, borderRadius: 12,
        }}>
          <Icon name="sparkle" size={15} color={DA_GOLD} />
          <span style={{ fontFamily: SANS, fontSize: 13, color: DA_INK2 }}>{t.launchHiddenNote}</span>
          <button onClick={onRestoreChecklist} style={{
            marginInlineStart: "auto",
            background: "none", border: "none", cursor: "pointer",
            fontFamily: SANS, fontSize: 13, fontWeight: 600, color: DA_GOLD,
          }}>
            {t.launchShow}
          </button>
        </div>
      )}

      {/* Ghosted metrics label */}
      <div style={{
        fontFamily: SANS, fontSize: 11.5, fontWeight: 500,
        letterSpacing: 0.5, textTransform: "uppercase",
        color: DA_INK3, marginBottom: 14,
      }}>
        {t.dashMetricsGhostedLabel}
      </div>

      {/* Ghosted tiles */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
        gap: 14,
        marginBottom: 32,
      }}>
        {ghostMetrics.map((m, i) => (
          <StatTile key={i} {...m} ghosted compact={isMobile} />
        ))}
      </div>

      {/* Help band */}
      <div style={{
        display: "flex", alignItems: "center", gap: 18,
        padding: 22,
        background: DA_SURFACE,
        border: `1px solid ${DA_RULE}`,
        borderRadius: 12,
        flexWrap: "wrap",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: 12,
          background: DA_GREEN_SOFT,
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Icon name="whatsapp" size={20} color={DA_GREEN} />
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontFamily: SANS, fontSize: 14, fontWeight: 600, color: DA_INK1 }}>
            {t.dashHelpTitle}
          </div>
          <div style={{ fontFamily: SANS, fontSize: 13, color: DA_INK2, marginTop: 2 }}>
            {t.dashHelpSub}
          </div>
        </div>
        <a
          href="https://wa.me/31621339606"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-flex", alignItems: "center", gap: 7,
            padding: "9px 16px", borderRadius: 9,
            background: DA_SURFACE2,
            border: `1px solid ${DA_RULE2}`,
            color: DA_INK1,
            fontFamily: SANS, fontWeight: 500, fontSize: 13,
            textDecoration: "none",
          }}
        >
          <Icon name="whatsapp" size={14} color={DA_GREEN} />
          {t.dashHelpCta}
        </a>
      </div>
    </div>
  );
}

// ── Populated dashboard ────────────────────────────────────────────────────────

type DateRange = "7" | "30" | "90" | "all";

function DashboardPopulated({
  agencyName, packages, leads, userId, lang, isMobile, loading, onDeletePackage, customDomain, homepageViews,
}: {
  agencyName: string;
  packages: Package[];
  leads: Lead[];
  userId: string | null;
  lang: "en" | "ar";
  isMobile: boolean;
  loading: boolean;
  onDeletePackage: (id: string) => void;
  customDomain?: string;
  homepageViews: number;
}) {
  const router = useRouter();
  const t = T[lang];
  const isAr = lang === "ar";

  const [dateRange, setDateRange] = useState<DateRange>("30");
  const [rangeOpen, setRangeOpen] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Package | null>(null);
  const [deleting, setDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setRangeOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const startMs = dateRange === "all"
    ? 0
    : Date.now() - Number(dateRange) * 24 * 60 * 60 * 1000;

  const filteredPkgs  = startMs === 0 ? packages  : packages.filter(p => (p.createdAt || 0) >= startMs);
  const filteredLeads = startMs === 0 ? leads      : leads.filter(l => (l.createdAt || 0) >= startMs);

  const totalViews  = filteredPkgs.reduce((a, b) => a + (b.views || 0), 0);
  const totalClicks = filteredPkgs.reduce((a, b) => a + (b.whatsappClicks || 0) + (b.messengerClicks || 0), 0);
  const totalLeads  = filteredLeads.length;
  const totalBooked = filteredLeads.filter(l => l.status === "booked").length;
  const convRate    = totalViews > 0
    ? ((totalClicks / totalViews) * 100).toFixed(1) + "%"
    : "0.0%";

  const livePkgCount  = packages.filter(p => p.isActive !== false && !!p.agencySlug).length;
  const userAgencySlug = slugify(agencyName) || "agency";

  const dateRangeOptions: { k: DateRange; l: string }[] = [
    { k: "7",   l: t.rangeLast7 },
    { k: "30",  l: t.rangeLast30 },
    { k: "90",  l: t.rangeLast90 },
    { k: "all", l: t.rangeAllTime },
  ];
  const activeRangeLabel = dateRangeOptions.find(o => o.k === dateRange)?.l ?? t.rangeLast30;

  const metrics = [
    { eyebrow: t.pageViews,  value: homepageViews.toLocaleString(), sub: t.rangeAllTime },
    { eyebrow: t.leads,      value: totalLeads.toLocaleString(),  sub: activeRangeLabel },
    { eyebrow: t.booked,     value: totalBooked.toLocaleString(), sub: activeRangeLabel },
    { eyebrow: t.viewToLead, value: convRate,                     sub: activeRangeLabel },
  ];

  const leadStatusStyles: Record<string, { bg: string; color: string }> = {
    new:         { bg: DA_GOLD_SOFT,   color: DA_GOLD },
    contacted:   { bg: DA_BG,          color: DA_INK2 },
    negotiating: { bg: DA_GOLD_SOFT,   color: DA_GOLD },
    booked:      { bg: DA_GREEN_SOFT,  color: DA_GREEN },
    lost:        { bg: DA_BG,          color: DA_INK3 },
  };

  const today = new Date();
  const subDate = today.toLocaleDateString(t.dateLocale, {
    weekday: "long", day: "numeric", month: "long",
  });
  const subText = `${subDate} · ${livePkgCount} ${livePkgCount !== 1 ? t.packagesLive : t.packageLive}`;

  const sortedPackages = [...packages].sort((a, b) => {
    const cA = (a.views || 0) > 0
      ? (((a.whatsappClicks || 0) + (a.messengerClicks || 0)) / a.views)
      : 0;
    const cB = (b.views || 0) > 0
      ? (((b.whatsappClicks || 0) + (b.messengerClicks || 0)) / b.views)
      : 0;
    return cB - cA;
  });

  return (
    <>
    <div style={{ padding: isMobile ? "16px 16px 40px" : "32px 40px 56px" }}>
      {/* Header */}
      <div style={{
        display: "flex", alignItems: "flex-end",
        justifyContent: "space-between",
        marginBottom: 28, gap: 16, flexWrap: "wrap",
      }}>
        <div>
          <div style={{
            fontFamily: SANS, fontSize: 10.5, fontWeight: 600,
            letterSpacing: 1.2, textTransform: "uppercase",
            color: DA_INK3, marginBottom: 10,
          }}>
            {t.crumbWorkspace} · {t.navDashboard}
          </div>
          <div style={{
            fontFamily: DISPLAY,
            fontSize: isMobile ? 30 : 44,
            fontWeight: 400,
            color: DA_INK1, letterSpacing: -1, lineHeight: 1,
          }}>
            {t.dashGoodMorning}, {agencyName}
          </div>
          <div style={{ fontFamily: SANS, fontSize: 13.5, color: DA_INK2, marginTop: 8 }}>
            {subText}
          </div>
        </div>

        {/* Date range picker */}
        <div ref={dropdownRef} style={{ position: "relative" }}>
          <button
            onClick={() => setRangeOpen(o => !o)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 14px",
              background: DA_SURFACE,
              border: `1px solid ${DA_RULE2}`,
              borderRadius: 8,
              fontFamily: SANS, fontSize: 13, color: DA_INK2,
              cursor: "pointer",
            }}
          >
            <Icon name="calendar" size={14} color={DA_INK3} />
            {activeRangeLabel}
            <span style={{ fontSize: 10, color: DA_INK3 }}>▾</span>
          </button>
          {rangeOpen && (
            <div style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              insetInlineEnd: 0,
              width: 160,
              background: DA_SURFACE2,
              border: `1px solid ${DA_RULE}`,
              borderRadius: 10, overflow: "hidden",
              boxShadow: "0 12px 32px rgba(26,22,17,0.12)",
              zIndex: 100,
            }}>
              {dateRangeOptions.map(({ k, l }) => (
                <button
                  key={k}
                  onClick={() => { setDateRange(k); setRangeOpen(false); }}
                  style={{
                    width: "100%", padding: "10px 14px",
                    background: dateRange === k ? DA_GOLD_SOFT : "none",
                    border: "none",
                    color: dateRange === k ? DA_GOLD : DA_INK2,
                    fontSize: 13, fontFamily: SANS, cursor: "pointer",
                    textAlign: isAr ? "right" : "left",
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}
                >
                  {l}
                  {dateRange === k && <span style={{ fontSize: 11, color: DA_GOLD }}>✓</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stat tiles */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)",
        gap: 14,
        marginBottom: 24,
      }}>
        {metrics.map((m, i) => <StatTile key={i} {...m} compact={isMobile} />)}
      </div>

      {/* Two-col: packages + leads */}
      <div style={{
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1.6fr 1fr",
        gap: 18,
      }}>
        {/* Packages */}
        <div style={{
          background: DA_SURFACE,
          border: `1px solid ${DA_RULE}`,
          borderRadius: 14, overflow: "hidden",
        }}>
          <div style={{
            padding: "18px 22px 14px",
            borderBottom: `1px solid ${DA_RULE}`,
            display: "flex", alignItems: "flex-end",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: DA_INK1 }}>
                {t.yourPackages}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: DA_INK3, marginTop: 2 }}>
                {t.dashSortedByConversion}
              </div>
            </div>
            <button
              onClick={() => router.push("/packages")}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                fontFamily: SANS, fontSize: 12, fontWeight: 500, color: DA_GOLD,
                background: "none", border: "none", cursor: "pointer", padding: 0,
              }}
            >
              {t.dashViewAll}
              <Icon name="arrow_right" size={12} color={DA_GOLD} strokeWidth={2} />
            </button>
          </div>

          {loading ? (
            <div style={{ padding: 32, textAlign: "center" }}>
              <span className="spinner-warm" />
            </div>
          ) : packages.length === 0 ? (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <Icon name="package" size={32} color={DA_INK3} strokeWidth={1} />
              <p style={{
                marginTop: 12, fontSize: 14, color: DA_INK3, fontFamily: SANS,
              }}>
                {t.noPackages}
              </p>
              <button
                onClick={() => router.push("/builder")}
                style={{
                  marginTop: 16, background: DA_GOLD_SOFT,
                  border: `1px solid ${DA_GOLD}40`,
                  borderRadius: 10, padding: "8px 20px",
                  color: DA_GOLD, fontSize: 13,
                  fontFamily: SANS, cursor: "pointer", fontWeight: 600,
                }}
              >
                {t.createFirst}
              </button>
            </div>
          ) : (
            sortedPackages.map((pkg, i, arr) => (
              <PackageRow
                key={pkg.id}
                pkg={pkg}
                lang={lang}
                isMobile={isMobile}
                onView={() => {
                  const slug = pkg.agencySlug || userAgencySlug;
                  const url = customDomain
                    ? `https://${customDomain}/${pkg.id}`
                    : process.env.NEXT_PUBLIC_ENV !== "production"
                      ? `${process.env.NEXT_PUBLIC_APP_URL}/${slug}/${pkg.id}`
                      : `https://${slug}.packmetrix.com/${pkg.id}`;
                  window.open(url, "_blank", "noopener,noreferrer");
                }}
                onEdit={() => router.push(`/builder?id=${pkg.id}`)}
                onDeleteRequest={() => setPendingDelete(pkg)}
                isLast={i === arr.length - 1}
              />
            ))
          )}
        </div>

        {/* Leads */}
        <div style={{
          background: DA_SURFACE,
          border: `1px solid ${DA_RULE}`,
          borderRadius: 14, overflow: "hidden",
        }}>
          <div style={{
            padding: "18px 22px 14px",
            borderBottom: `1px solid ${DA_RULE}`,
            display: "flex", alignItems: "flex-end",
            justifyContent: "space-between",
          }}>
            <div>
              <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: DA_INK1 }}>
                {t.recentLeads}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 12, color: DA_INK3, marginTop: 2 }}>
                {filteredLeads.length > 0
                  ? `${filteredLeads.length} ${isAr ? "عميل محتمل" : "total"}`
                  : "—"
                }
              </div>
            </div>
            <button
              onClick={() => router.push("/leads")}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                fontFamily: SANS, fontSize: 12, fontWeight: 500, color: DA_GOLD,
                background: "none", border: "none", cursor: "pointer", padding: 0,
              }}
            >
              {t.dashViewAll}
              <Icon name="arrow_right" size={12} color={DA_GOLD} strokeWidth={2} />
            </button>
          </div>

          {loading ? (
            <div style={{ padding: 32, textAlign: "center" }}>
              <span className="spinner-warm" />
            </div>
          ) : filteredLeads.length === 0 ? (
            <div style={{
              padding: "32px 22px", textAlign: "center",
              color: DA_INK3, fontSize: 13, fontFamily: SANS,
            }}>
              {t.noLeadsInPeriod}
            </div>
          ) : (
            filteredLeads.slice(0, 8).map((lead, i, arr) => {
              const initials    = (lead.destination || "?").slice(0, 2).toUpperCase();
              const avatarColors = ["#c66a3d", "#1f5f8e", "#7c3aed", "#0d6e3f"];
              const avatarColor  = avatarColors[i % avatarColors.length];
              const ss           = leadStatusStyles[lead.status] || leadStatusStyles.new;
              const statusLabel  =
                lead.status === "new"         ? (isAr ? "جديد"        : "New")
                : lead.status === "contacted" ? (isAr ? "تم التواصل"  : "Contacted")
                : lead.status === "negotiating" ? (isAr ? "يتفاوض"    : "Negotiating")
                : lead.status === "booked"    ? (isAr ? "محجوز"       : "Booked")
                : lead.status === "lost"      ? (isAr ? "خسرنا"       : "Lost")
                : lead.status;

              return (
                <div key={lead.id} style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 22px",
                  borderBottom: i < arr.length - 1 ? `1px solid ${DA_RULE}` : "none",
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: "50%",
                    background: avatarColor, color: "#fff",
                    flexShrink: 0, display: "flex", alignItems: "center",
                    justifyContent: "center",
                    fontFamily: SANS, fontSize: 13, fontWeight: 600,
                  }}>
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{
                      fontFamily: SANS, fontSize: 13, fontWeight: 500, color: DA_INK1,
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>
                      {lead.destination}
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: 11.5, color: DA_INK3 }}>
                      {lead.channel === "whatsapp" ? t.viaWhatsApp : t.viaMessenger}
                    </div>
                  </div>
                  <div style={{
                    display: "flex", flexDirection: "column",
                    alignItems: isAr ? "flex-start" : "flex-end",
                    gap: 4,
                  }}>
                    <span style={{
                      padding: "2px 8px", borderRadius: 99,
                      fontSize: 10.5, fontWeight: 600,
                      background: ss.bg, color: ss.color,
                      textTransform: "uppercase", letterSpacing: 0.5,
                    }}>
                      {statusLabel}
                    </span>
                    <div style={{
                      fontFamily: MONO, fontSize: 10.5,
                      color: DA_INK3, letterSpacing: -0.2,
                    }}>
                      {new Date(lead.createdAt).toLocaleDateString(t.dateLocale, {
                        day: "numeric", month: "short",
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>

    <ConfirmModal
      open={pendingDelete !== null}
      onClose={() => { if (!deleting) setPendingDelete(null); }}
      loading={deleting}
      variant="danger"
      title={isAr ? "حذف الباقة؟" : "Delete package?"}
      message={isAr ? "سيتم حذف هذه الباقة نهائياً ولا يمكن التراجع." : "This package will be permanently deleted. This cannot be undone."}
      confirmLabel={isAr ? "نعم، احذف" : "Delete"}
      cancelLabel={isAr ? "إلغاء" : "Cancel"}
      dir={isAr ? "rtl" : "ltr"}
      onConfirm={async () => {
        if (!pendingDelete) return;
        setDeleting(true);
        try {
          const res = await fetch("/api/delete", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: pendingDelete.id, userId }),
          });
          if (res.ok) onDeletePackage(pendingDelete.id);
        } finally {
          setDeleting(false);
          setPendingDelete(null);
        }
      }}
    />
    </>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();
  const lang   = useLang();
  const isMobile = useIsMobile();

  const [packages,    setPackages]    = useState<Package[]>([]);
  const [leads,       setLeads]       = useState<Lead[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [userId,      setUserId]      = useState<string | null>(null);
  const [agencyName,  setAgencyName]  = useState("Agency");
  const [hasBranding, setHasBranding] = useState(false);
  const [hasHomepage, setHasHomepage] = useState(false);
  const [agencySlug, setAgencySlug] = useState<string | undefined>(undefined);
  const [hasCustomDomain, setHasCustomDomain] = useState(false);
  const [checklistDismissed, setChecklistDismissed] = useState(false);
  const [customDomain, setCustomDomain] = useState<string | undefined>(undefined);
  const [homepageViews, setHomepageViews] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }
      setUserId(user.uid);
      const snap = await getDoc(doc(db, "users", user.uid));
      if (snap.exists()) {
        const data = snap.data();
        if (data.name) setAgencyName(data.name);
        setHasBranding(!!(data.name && data.logoUrl));
        setHasHomepage(homepageHasContent(data));
        setAgencySlug(data.agencySlug || undefined);
        setHasCustomDomain(data.customDomainStatus === "active" && !!data.customDomain);
        setChecklistDismissed(readOnboarding(data).dismissed);
        setHomepageViews(Number(data.homepageViews) || 0);
        if (data.customDomainStatus === "active" && data.customDomain) {
          setCustomDomain(data.customDomain);
        }
      }
      setAuthLoading(false);
    });
    return () => unsub();
  }, [router]);

  const dismissChecklist = async () => {
    if (!userId) return;
    setChecklistDismissed(true);
    const snap = await getDoc(doc(db, "users", userId));
    await updateDoc(doc(db, "users", userId), onboardingDismissPatch(readOnboarding(snap.data())));
    posthog.capture("onboarding_dismissed", { at: "dashboard_checklist" });
  };

  const restoreChecklist = async () => {
    if (!userId) return;
    setChecklistDismissed(false);
    const snap = await getDoc(doc(db, "users", userId));
    await updateDoc(doc(db, "users", userId), onboardingRestorePatch(readOnboarding(snap.data())));
    posthog.capture("onboarding_restored", { at: "dashboard_checklist" });
  };

  useEffect(() => {
    if (!userId) return;
    const load = async () => {
      const [pkgSnap, leadSnap] = await Promise.all([
        getDocs(query(collection(db, "packages"), where("userId", "==", userId))),
        getDocs(query(collection(db, "leads"), where("userId", "==", userId), orderBy("createdAt", "desc"))),
      ]);
      setPackages(pkgSnap.docs.map(d => ({ id: d.id, ...d.data() } as Package)));
      setLeads(leadSnap.docs.map(d => ({ id: d.id, ...d.data() } as Lead)));
      setLoading(false);
    };
    load();
  }, [userId]);

  if (authLoading) {
    return (
      <AppLayout>
        <div style={{
          flex: 1, display: "flex",
          alignItems: "center", justifyContent: "center",
          background: DA_BG, height: "100%",
        }}>
          <span className="spinner-warm" />
        </div>
      </AppLayout>
    );
  }

  const hasPublishedPackage = !loading && packages.some(
    p => p.isActive !== false && !!p.agencySlug,
  );
  const hasAnyPackage = !loading && packages.length > 0;

  const checklistItems = onboardingChecklist({
    hasBrand: hasBranding,
    hasHomepage,
    hasAnyPackage,
    hasPublishedPackage,
    hasCustomDomain,
  });

  // The shareable link for the launch checklist's "go live" step.
  const siteUrl = hasPublishedPackage
    ? (customDomain
        ? `https://${customDomain}`
        : (agencySlug && typeof window !== "undefined" ? `${window.location.origin}/${agencySlug}` : undefined))
    : undefined;

  return (
    <AppLayout>
      <div
        dir={lang === "ar" ? "rtl" : "ltr"}
        style={{ background: DA_BG, minHeight: "100%" }}
      >
        {hasPublishedPackage ? (
          <DashboardPopulated
            agencyName={agencyName}
            packages={packages}
            leads={leads}
            userId={userId}
            lang={lang}
            isMobile={isMobile}
            loading={loading}
            onDeletePackage={(id) => setPackages(prev => prev.filter(p => p.id !== id))}
            customDomain={customDomain}
            homepageViews={homepageViews}
          />
        ) : (
          <DashboardFirstRun
            agencyName={agencyName}
            lang={lang}
            isMobile={isMobile}
            checklistItems={checklistItems}
            checklistDismissed={checklistDismissed}
            siteUrl={siteUrl}
            onBranding={() => router.push("/profile")}
            onBuild={() => router.push("/builder")}
            onHomepage={() => router.push("/homepage")}
            onDomain={() => router.push("/profile")}
            onDismissChecklist={dismissChecklist}
            onRestoreChecklist={restoreChecklist}
          />
        )}
      </div>
    </AppLayout>
  );
}
