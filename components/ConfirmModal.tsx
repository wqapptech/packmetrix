"use client";

import React, { useEffect } from "react";
import {
  DA_SURFACE, DA_INK1, DA_INK2, DA_INK3, DA_RULE,
  DA_DANGER, DA_DANGER_SOFT, DA_GOLD, DA_GOLD_SOFT,
} from "@/lib/tokens";
import Icon from "@/components/Icon";
import type { IconName } from "@/components/Icon";
import { useLang } from "@/hooks/useLang";
import { T } from "@/lib/translations";

const SANS    = `var(--font-inter-tight), system-ui, sans-serif`;
const DISPLAY = `var(--font-instrument-serif), Georgia, serif`;

export type ConfirmVariant = "danger" | "warning" | "default";

const VARIANT_CFG: Record<ConfirmVariant, {
  icon: IconName;
  iconColor: string;
  iconBg: string;
  confirmBg: string;
}> = {
  danger: {
    icon: "trash",
    iconColor: DA_DANGER,
    iconBg: DA_DANGER_SOFT,
    confirmBg: DA_DANGER,
  },
  warning: {
    icon: "x",
    iconColor: "#a16207",
    iconBg: "#fef9ee",
    confirmBg: "#a16207",
  },
  default: {
    icon: "copy",
    iconColor: DA_GOLD,
    iconBg: DA_GOLD_SOFT,
    confirmBg: DA_GOLD,
  },
};

export interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  variant?: ConfirmVariant;
  icon?: IconName;
  children?: React.ReactNode;
  dir?: "ltr" | "rtl";
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  cancelLabel,
  loading = false,
  variant = "default",
  icon,
  children,
  dir,
}: ConfirmModalProps) {
  const lang = useLang();
  const t = T[lang];
  const resolvedDir = dir ?? (lang === "ar" ? "rtl" : "ltr");
  const resolvedConfirmLabel = confirmLabel ?? t.modalConfirm;
  const resolvedCancelLabel = cancelLabel ?? t.modalCancel;
  const cfg = VARIANT_CFG[variant];
  const iconName: IconName = icon ?? cfg.icon;

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !loading) onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, loading, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 600,
        background: "rgba(26,22,17,0.52)",
        backdropFilter: "blur(4px)",
        WebkitBackdropFilter: "blur(4px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: 20,
        animation: "cmFadeIn .15s ease",
      }}
      onClick={e => { if (e.target === e.currentTarget && !loading) onClose(); }}
    >
      <style>{`
        @keyframes cmFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes cmSlideUp { from { opacity:0; transform:translateY(12px) scale(.96) } to { opacity:1; transform:none } }
      `}</style>

      <div
        dir={resolvedDir}
        style={{
          position: "relative",
          width: "100%", maxWidth: 400,
          background: DA_SURFACE,
          borderRadius: 22,
          boxShadow: "0 24px 72px rgba(26,22,17,0.22), 0 4px 20px rgba(26,22,17,0.08)",
          border: `1px solid ${DA_RULE}`,
          animation: "cmSlideUp .22s cubic-bezier(.22,1,.36,1)",
          overflow: "hidden",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={loading}
          style={{
            position: "absolute", top: 14,
            insetInlineEnd: 14,
            width: 30, height: 30, borderRadius: 9,
            background: "transparent",
            border: `1px solid ${DA_RULE}`,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 0,
            opacity: loading ? 0.4 : 1,
          }}
        >
          <Icon name="x" size={13} color={DA_INK3} />
        </button>

        {/* Icon + title */}
        <div style={{ padding: "40px 30px 22px", textAlign: "center" }}>
          <div style={{
            width: 58, height: 58, borderRadius: 17,
            background: cfg.iconBg,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            marginBottom: 18,
          }}>
            <Icon name={iconName} size={24} color={cfg.iconColor} strokeWidth={1.8} />
          </div>

          <div style={{
            fontFamily: DISPLAY, fontSize: 22, fontWeight: 400,
            color: DA_INK1, lineHeight: 1.2,
          }}>
            {title}
          </div>

          {message && (
            <div style={{
              fontFamily: SANS, fontSize: 13.5, color: DA_INK2,
              lineHeight: 1.65, marginTop: 10, maxWidth: 320, margin: "10px auto 0",
            }}>
              {message}
            </div>
          )}
        </div>

        {/* Optional extra content */}
        {children && (
          <div style={{ padding: "0 30px 4px" }}>
            {children}
          </div>
        )}

        {/* Footer */}
        <div style={{
          padding: "20px 30px 30px",
          display: "flex", gap: 10, justifyContent: "flex-end",
        }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              padding: "10px 22px",
              borderRadius: 11,
              background: "transparent",
              border: `1.5px solid ${DA_RULE}`,
              color: DA_INK2,
              fontSize: 13.5, fontWeight: 500, fontFamily: SANS,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.55 : 1,
              transition: "opacity .12s",
            }}
          >
            {resolvedCancelLabel}
          </button>

          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "10px 22px",
              borderRadius: 11,
              background: cfg.confirmBg,
              color: "#fff",
              border: "none",
              fontSize: 13.5, fontWeight: 600, fontFamily: SANS,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.72 : 1,
              display: "flex", alignItems: "center", gap: 7,
              transition: "opacity .12s",
            }}
          >
            {loading && (
              <span
                className="spinner-warm"
                style={{ width: 13, height: 13, borderTopColor: "#fff", flexShrink: 0 }}
              />
            )}
            {resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
