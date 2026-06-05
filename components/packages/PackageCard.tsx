"use client";

import { useState, useRef, useEffect } from "react";
import type { TListPackage, TAgency } from "@/components/templates/types";
import { locStr } from "@/components/templates/types";
import type { Lang } from "@/lib/translations";
import { T } from "@/lib/translations";
import Icon from "@/components/Icon";
import { guessDestinationKind, DESTINATION_GRADIENTS } from "@/lib/destination";
import {
  DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK3,
  DA_RULE, DA_RULE2, DA_GOLD, DA_GREEN, DA_GREEN_SOFT,
} from "@/lib/tokens";

const DISPLAY = `var(--font-instrument-serif), Georgia, serif`;
const SANS = `var(--font-inter-tight), system-ui, sans-serif`;

function ShareDropdown({ shareUrl, title, price, lang }: { shareUrl: string; title: string; price: string; lang: Lang }) {
  const [open, setOpen] = useState(false);
  const [igCopied, setIgCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const isAr = lang === "ar";

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const shareWA = () => {
    const msg = [`✈️ *${title}*`, price ? `💰 ${price}` : null, "", shareUrl].filter(Boolean).join("\n");
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener,noreferrer");
    setOpen(false);
  };

  const shareIG = () => {
    navigator.clipboard?.writeText(shareUrl);
    setIgCopied(true);
    // Keep dropdown open so user sees "Copied!" then close
    setTimeout(() => {
      setOpen(false);
      setIgCopied(false);
    }, 1400);
  };

  const shareFB = () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, "_blank", "noopener,noreferrer,width=580,height=440");
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((v) => !v)}
        title={isAr ? "مشاركة" : "Share"}
        style={{
          background: DA_SURFACE2,
          border: `1px solid ${DA_RULE2}`,
          borderRadius: 7,
          color: DA_INK1,
          fontFamily: SANS,
          fontSize: 12,
          fontWeight: 500,
          cursor: "pointer",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: 32,
          height: 30,
        }}
      >
        <Icon name="share" size={12} color="currentColor" />
      </button>

      {open && (
        <div style={{
          position: "absolute",
          bottom: "calc(100% + 6px)",
          ...(isAr ? { left: 0 } : { right: 0 }),
          background: DA_SURFACE,
          border: `1px solid ${DA_RULE}`,
          borderRadius: 10,
          padding: 6,
          display: "flex",
          flexDirection: "column",
          gap: 3,
          zIndex: 50,
          minWidth: 170,
          boxShadow: "0 4px 16px rgba(0,0,0,.1)",
        }}>
          <button onClick={shareWA} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 10px", borderRadius: 7, border: "none",
            background: "transparent", cursor: "pointer", fontFamily: SANS,
            fontSize: 12.5, fontWeight: 500, color: DA_INK1, textAlign: "left",
          }}>
            <span style={{ width: 20, height: 20, borderRadius: 5, background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="whatsapp" size={11} color="#fff" />
            </span>
            WhatsApp
          </button>
          <button onClick={shareIG} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 10px", borderRadius: 7, border: "none",
            background: "transparent", cursor: "pointer", fontFamily: SANS,
            fontSize: 12.5, fontWeight: 500, color: DA_INK1, textAlign: "left",
          }}>
            <span style={{ width: 20, height: 20, borderRadius: 5, background: "linear-gradient(135deg,#f58529,#dd2a7b,#8134af)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 10, color: "#fff", fontWeight: 700 }}>
              IG
            </span>
            {igCopied ? (isAr ? "تم النسخ!" : "Copied!") : "Instagram"}
          </button>
          <button onClick={shareFB} style={{
            display: "flex", alignItems: "center", gap: 8,
            padding: "7px 10px", borderRadius: 7, border: "none",
            background: "transparent", cursor: "pointer", fontFamily: SANS,
            fontSize: 12.5, fontWeight: 500, color: DA_INK1, textAlign: "left",
          }}>
            <span style={{ width: 20, height: 20, borderRadius: 5, background: "#1877F2", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <Icon name="facebook" size={11} color="#fff" />
            </span>
            Facebook
          </button>
        </div>
      )}
    </div>
  );
}

type Props = {
  pkg: TListPackage;
  agency: TAgency;
  lang: Lang;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  onDuplicate?: () => void;
  onCopyLink?: () => void;
  shareUrl?: string;
  templateName?: string;
  nights?: string | number;
  // kept for API compat, unused in new design:
  stripeColor?: string;
  templateDark?: boolean;
};

export function PackageCard({
  pkg, lang,
  onView, onEdit, onDelete, onToggleActive, onDuplicate, onCopyLink, shareUrl,
  templateName, nights,
}: Props) {
  const t = T[lang];
  const isAr = lang === "ar";
  const [linkCopied, setLinkCopied] = useState(false);

  const handleCopyLink = () => {
    onCopyLink?.();
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2000);
  };
  const clicks = (pkg.whatsappClicks || 0) + (pkg.messengerClicks || 0);
  const conv = (pkg.views || 0) > 0 ? (clicks / (pkg.views || 1)) * 100 : 0;
  const isPublished = Boolean(pkg.agencySlug);
  const isActive = pkg.isActive !== false;

  const destKind = guessDestinationKind(pkg.destination || "");
  const coverGrad = DESTINATION_GRADIENTS[destKind] ?? DESTINATION_GRADIENTS.default;

  const statusLabel = !isPublished
    ? t.packageStatusDraft
    : isActive
    ? t.live
    : t.packageStatusInactive;
  const isLive = isPublished && isActive;

  const btnBase: React.CSSProperties = {
    background: DA_SURFACE2,
    border: `1px solid ${DA_RULE2}`,
    borderRadius: 7,
    color: DA_INK1,
    fontFamily: SANS,
    fontSize: 12,
    fontWeight: 500,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  };

  return (
    <div style={{
      background: DA_SURFACE,
      border: `1px solid ${DA_RULE}`,
      borderRadius: 14,
      display: "flex",
      flexDirection: "column",
      opacity: isPublished && !isActive ? 0.72 : 1,
    }}>
      {/* Cover — overflow:hidden here (not root) so the export dropdown can float above */}
      <div style={{ position: "relative", height: 170, flexShrink: 0, overflow: "hidden", borderRadius: "14px 14px 0 0" }}>
        {pkg.coverImage ? (
          <img
            src={pkg.coverImage}
            alt={pkg.destination}
            style={{ width: "100%", height: 170, objectFit: "cover", display: "block" }}
          />
        ) : (
          <div style={{
            width: "100%", height: 170, background: coverGrad,
            position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", inset: 0,
              backgroundImage: "repeating-linear-gradient(45deg, rgba(255,255,255,.04) 0, rgba(255,255,255,.04) 1px, transparent 1px, transparent 8px)",
            }} />
            <div style={{
              position: "absolute", inset: 0,
              background: "linear-gradient(180deg, transparent 50%, rgba(0,0,0,.4) 100%)",
            }} />
          </div>
        )}

        {/* Template chip */}
        {templateName && (
          <div style={{
            position: "absolute", top: 12,
            ...(isAr ? { right: 12 } : { left: 12 }),
            padding: "3px 9px",
            background: "rgba(0,0,0,.5)",
            backdropFilter: "blur(8px)",
            color: "#fff",
            borderRadius: 999,
            fontSize: 10.5,
            fontFamily: SANS,
            fontWeight: 500,
            display: "inline-flex", alignItems: "center", gap: 5,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: DA_GOLD, flexShrink: 0 }} />
            {templateName}
          </div>
        )}

        {/* Status badge */}
        <div style={{
          position: "absolute", top: 12,
          ...(isAr ? { left: 12 } : { right: 12 }),
        }}>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 9px",
            background: "rgba(0,0,0,.5)",
            backdropFilter: "blur(8px)",
            borderRadius: 999,
            fontSize: 10.5, fontWeight: 500, fontFamily: SANS,
            color: isLive ? "#6fde9f" : "rgba(255,255,255,.75)",
          }}>
            {isLive && (
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#6fde9f", flexShrink: 0 }} />
            )}
            {statusLabel}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        <div>
          <div style={{
            fontFamily: DISPLAY, fontSize: 18, fontWeight: 400,
            color: DA_INK1, letterSpacing: -.3, lineHeight: 1.15,
          }}>
            {locStr(pkg.title, lang) || pkg.destination}
          </div>
          <div style={{
            display: "flex", alignItems: "center", gap: 6, marginTop: 5,
            fontFamily: SANS, fontSize: 11.5, color: DA_INK3, flexWrap: "wrap",
          }}>
            <span>{pkg.price}</span>
            {nights && (
              <>
                <span>·</span>
                <span>{nights} {isAr ? "ليالٍ" : "nights"}</span>
              </>
            )}
            {pkg.createdAt && (
              <>
                <span>·</span>
                <span>{new Date(pkg.createdAt).toLocaleDateString(
                  lang === "ar" ? "ar-SA" : "en-GB",
                  { day: "numeric", month: "short" }
                )}</span>
              </>
            )}
          </div>
        </div>

        {/* 3-up stats */}
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
          padding: "10px 0",
          borderTop: `1px solid ${DA_RULE}`,
          borderBottom: `1px solid ${DA_RULE}`,
        }}>
          {[
            { value: (pkg.views || 0).toLocaleString(), label: t.statViews },
            { value: String(clicks),                    label: t.statLeads },
            { value: conv > 0 ? conv.toFixed(1) + "%" : "—", label: t.statConversion },
          ].map((s, i) => (
            <div key={i}>
              <div style={{
                fontFamily: DISPLAY, fontSize: 18, fontWeight: 400,
                color: DA_INK1, letterSpacing: -.3,
              }}>{s.value}</div>
              <div style={{
                fontSize: 10, fontFamily: SANS, color: DA_INK3,
                marginTop: 1, letterSpacing: .3, textTransform: "uppercase",
              }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Primary actions */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "auto" }}>
          <button onClick={onEdit} style={{ ...btnBase, flex: 1, padding: "7px 0" }}>
            <Icon name="edit" size={11} color="currentColor" />
            {t.apply}
          </button>
          <button onClick={onView} style={{ ...btnBase, flex: 1, padding: "7px 0" }}>
            <Icon name="eye" size={11} color="currentColor" />
            {t.preview}
          </button>
          {onCopyLink && (
            <button
              onClick={handleCopyLink}
              title={linkCopied ? (isAr ? "تم النسخ!" : "Copied!") : t.copyLink}
              style={{
                ...btnBase,
                width: 32, height: 30,
                background: linkCopied ? DA_GREEN_SOFT : DA_SURFACE2,
                border: `1px solid ${linkCopied ? DA_GREEN : DA_RULE2}`,
                transition: "background .15s, border-color .15s",
              }}
            >
              <Icon name={linkCopied ? "check" : "copy"} size={12} color={linkCopied ? DA_GREEN : "currentColor"} />
            </button>
          )}
          {shareUrl && isPublished && (
            <ShareDropdown
              shareUrl={shareUrl}
              title={locStr(pkg.title, lang) || pkg.destination}
              price={pkg.price}
              lang={lang}
            />
          )}
        </div>

        {/* Secondary actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 4 }}>
            {onDuplicate && (
              <button
                onClick={onDuplicate}
                title={t.duplicatePackageTooltip}
                style={{
                  padding: "3px 8px",
                  background: "transparent",
                  border: `1px solid ${DA_RULE2}`,
                  borderRadius: 5,
                  color: DA_INK3,
                  fontFamily: SANS,
                  fontSize: 11,
                  cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 4,
                }}
              >
                <Icon name="copy" size={10} color="currentColor" />
                {isAr ? "تكرار" : "Duplicate"}
              </button>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {isPublished && (
              <button
                onClick={onToggleActive}
                title={isActive ? t.markInactive : t.markActive}
                style={{
                  padding: "3px 8px",
                  background: isActive ? DA_GREEN_SOFT : DA_SURFACE2,
                  border: `1px solid ${DA_RULE2}`,
                  borderRadius: 5,
                  color: isActive ? DA_GREEN : DA_INK3,
                  fontFamily: SANS,
                  fontSize: 10.5,
                  fontWeight: 500,
                  cursor: "pointer",
                }}
              >
                {isActive ? t.markInactive : t.markActive}
              </button>
            )}
            <button
              onClick={onDelete}
              title={t.deletePackage}
              style={{
                padding: "4px 6px",
                background: "transparent",
                border: "none",
                color: "rgba(180,50,50,.55)",
                cursor: "pointer",
              }}
            >
              <Icon name="trash" size={13} color="currentColor" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
