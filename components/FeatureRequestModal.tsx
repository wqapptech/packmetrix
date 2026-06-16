"use client";

import React, { useEffect, useRef, useState } from "react";
import { auth } from "@/lib/firebase";
import { usePathname } from "next/navigation";
import {
  DA_SURFACE, DA_INK1, DA_INK2, DA_INK3, DA_RULE, DA_RULE2,
  DA_GOLD, DA_GOLD_SOFT,
} from "@/lib/tokens";
import Icon from "@/components/Icon";
import { useLang } from "@/hooks/useLang";
import { T } from "@/lib/translations";

const SANS    = `var(--font-sans)`;
const DISPLAY = `var(--font-display)`;

const MAX_LEN = 1000;

const CATEGORIES_EN = ["Templates", "Builder", "Storefront", "Sharing", "Billing", "Other"];
const CATEGORIES_AR = ["القوالب", "المنشئ", "الواجهة", "المشاركة", "الفواتير", "أخرى"];

export interface FeatureRequestModalProps {
  open: boolean;
  onClose: () => void;
  prefillEmail?: string;
}

export function FeatureRequestModal({ open, onClose, prefillEmail = "" }: FeatureRequestModalProps) {
  const lang = useLang();
  const t = T[lang];
  const isAr = lang === "ar";
  const dir = isAr ? "rtl" : "ltr";
  const pathname = usePathname();

  const [text, setText] = useState("");
  const [category, setCategory] = useState("");
  const [email, setEmail] = useState(prefillEmail);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const textRef = useRef<HTMLTextAreaElement>(null);

  // Sync email when prefill changes (e.g. auth loads after modal mounts)
  useEffect(() => {
    if (prefillEmail && !email) setEmail(prefillEmail);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefillEmail]);

  // Focus textarea on open
  useEffect(() => {
    if (open && status === "idle") {
      setTimeout(() => textRef.current?.focus(), 80);
    }
  }, [open, status]);

  // Escape to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && status !== "loading") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, status, onClose]);

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setText("");
        setCategory("");
        setEmail(prefillEmail);
        setStatus("idle");
      }, 200);
    }
  }, [open, prefillEmail]);

  if (!open) return null;

  const categories = isAr ? CATEGORIES_AR : CATEGORIES_EN;
  const textTrimmed = text.trim();
  const canSubmit = textTrimmed.length > 0 && textTrimmed.length <= MAX_LEN && status === "idle";

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setStatus("loading");
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) throw new Error("not-authenticated");
      const idToken = await currentUser.getIdToken();

      const res = await fetch("/api/feature-request", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          text: textTrimmed,
          category,
          email: email.trim(),
          lang,
          page: pathname,
        }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error || "failed");
      }

      setStatus("success");
    } catch {
      setStatus("error");
    }
  };

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
      onClick={e => { if (e.target === e.currentTarget && status !== "loading") onClose(); }}
    >
      <style>{`
        @keyframes cmFadeIn { from { opacity:0 } to { opacity:1 } }
        @keyframes cmSlideUp { from { opacity:0; transform:translateY(12px) scale(.96) } to { opacity:1; transform:none } }
        .fr-textarea:focus { outline: none; border-color: ${DA_GOLD} !important; box-shadow: 0 0 0 3px ${DA_GOLD_SOFT} !important; }
        .fr-select:focus { outline: none; border-color: ${DA_GOLD} !important; box-shadow: 0 0 0 3px ${DA_GOLD_SOFT} !important; }
        .fr-input:focus { outline: none; border-color: ${DA_GOLD} !important; box-shadow: 0 0 0 3px ${DA_GOLD_SOFT} !important; }
      `}</style>

      <div
        dir={dir}
        style={{
          position: "relative",
          width: "100%", maxWidth: 460,
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
          disabled={status === "loading"}
          style={{
            position: "absolute", top: 14,
            insetInlineEnd: 14,
            width: 30, height: 30, borderRadius: 9,
            background: "transparent",
            border: `1px solid ${DA_RULE}`,
            cursor: status === "loading" ? "not-allowed" : "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 0,
            opacity: status === "loading" ? 0.4 : 1,
          }}
        >
          <Icon name="x" size={13} color={DA_INK3} />
        </button>

        {status === "success" ? (
          /* ── Success state ── */
          <div style={{ padding: "48px 30px 40px", textAlign: "center" }}>
            <div style={{
              width: 58, height: 58, borderRadius: 17,
              background: DA_GOLD_SOFT,
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              marginBottom: 18,
            }}>
              <Icon name="sparkle" size={24} color={DA_GOLD} strokeWidth={1.8} />
            </div>
            <div style={{
              fontFamily: DISPLAY, fontSize: 22, fontWeight: 400,
              color: DA_INK1, lineHeight: 1.2, marginBottom: 10,
            }}>
              {t.featureReqSuccess}
            </div>
            <div style={{
              fontFamily: SANS, fontSize: 13.5, color: DA_INK2,
              lineHeight: 1.65,
            }}>
              {t.featureReqSuccessBody}
            </div>
            <button
              onClick={onClose}
              style={{
                marginTop: 28,
                padding: "10px 28px",
                borderRadius: 11,
                background: DA_GOLD,
                color: "#fff",
                border: "none",
                fontSize: 13.5, fontWeight: 600, fontFamily: SANS,
                cursor: "pointer",
              }}
            >
              {isAr ? "تم" : "Done"}
            </button>
          </div>
        ) : (
          /* ── Form state ── */
          <>
            {/* Header */}
            <div style={{ padding: "36px 30px 20px" }}>
              <div style={{
                width: 44, height: 44, borderRadius: 13,
                background: DA_GOLD_SOFT,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                marginBottom: 14,
              }}>
                <Icon name="sparkle" size={20} color={DA_GOLD} strokeWidth={1.8} />
              </div>
              <div style={{
                fontFamily: DISPLAY, fontSize: 22, fontWeight: 400,
                color: DA_INK1, lineHeight: 1.2,
              }}>
                {t.featureReqTitle}
              </div>
            </div>

            {/* Form fields */}
            <div style={{ padding: "0 30px" }}>
              {/* Main request textarea */}
              <div style={{ marginBottom: 14 }}>
                <label style={{
                  display: "block",
                  fontFamily: SANS, fontSize: 12.5, fontWeight: 500,
                  color: DA_INK2, marginBottom: 6,
                }}>
                  {t.featureReqLabel}
                  <span style={{ color: DA_GOLD, marginInlineStart: 3 }}>*</span>
                </label>
                <textarea
                  ref={textRef}
                  className="fr-textarea"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder={t.featureReqPlaceholder}
                  rows={4}
                  maxLength={MAX_LEN}
                  dir={isAr ? "rtl" : "ltr"}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: `1.5px solid ${DA_RULE2}`,
                    background: DA_SURFACE,
                    fontFamily: SANS, fontSize: 13.5,
                    color: DA_INK1,
                    lineHeight: 1.55,
                    resize: "vertical",
                    boxSizing: "border-box",
                    transition: "border-color .12s, box-shadow .12s",
                  }}
                />
                {text.length > MAX_LEN * 0.85 && (
                  <div style={{
                    fontFamily: SANS, fontSize: 11, color: text.length > MAX_LEN ? "#c0392b" : DA_INK3,
                    textAlign: isAr ? "left" : "right", marginTop: 3,
                  }}>
                    {text.length}/{MAX_LEN}
                  </div>
                )}
              </div>

              {/* Category select */}
              <div style={{ marginBottom: 14 }}>
                <label style={{
                  display: "block",
                  fontFamily: SANS, fontSize: 12.5, fontWeight: 500,
                  color: DA_INK2, marginBottom: 6,
                }}>
                  {t.featureReqCategoryLabel}
                </label>
                <select
                  className="fr-select"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  dir={isAr ? "rtl" : "ltr"}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: `1.5px solid ${DA_RULE2}`,
                    background: DA_SURFACE,
                    fontFamily: SANS, fontSize: 13.5,
                    color: category ? DA_INK1 : DA_INK3,
                    boxSizing: "border-box",
                    cursor: "pointer",
                    transition: "border-color .12s, box-shadow .12s",
                    appearance: "none",
                  }}
                >
                  <option value="">{isAr ? "اختر فئة…" : "Choose a category…"}</option>
                  {categories.map((c, i) => (
                    <option key={i} value={CATEGORIES_EN[i]}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Email field */}
              <div style={{ marginBottom: 4 }}>
                <label style={{
                  display: "block",
                  fontFamily: SANS, fontSize: 12.5, fontWeight: 500,
                  color: DA_INK2, marginBottom: 6,
                }}>
                  {t.featureReqEmailLabel}
                </label>
                <input
                  type="email"
                  className="fr-input"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  dir="ltr"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: `1.5px solid ${DA_RULE2}`,
                    background: DA_SURFACE,
                    fontFamily: SANS, fontSize: 13.5,
                    color: DA_INK1,
                    boxSizing: "border-box",
                    transition: "border-color .12s, box-shadow .12s",
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div style={{
              padding: "20px 30px 28px",
              display: "flex", flexDirection: "column", gap: 10,
            }}>
              {status === "error" && (
                <div style={{
                  fontFamily: SANS, fontSize: 12.5, color: "#c0392b",
                  background: "#fdf2f2", border: "1px solid #f5c6cb",
                  borderRadius: 8, padding: "8px 12px",
                }}>
                  {t.featureReqError}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
                <button
                  onClick={onClose}
                  disabled={status === "loading"}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 11,
                    background: "transparent",
                    border: `1.5px solid ${DA_RULE}`,
                    color: DA_INK2,
                    fontSize: 13.5, fontWeight: 500, fontFamily: SANS,
                    cursor: status === "loading" ? "not-allowed" : "pointer",
                    opacity: status === "loading" ? 0.55 : 1,
                    transition: "opacity .12s",
                  }}
                >
                  {t.modalCancel}
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!canSubmit}
                  style={{
                    padding: "10px 22px",
                    borderRadius: 11,
                    background: DA_GOLD,
                    color: "#fff",
                    border: "none",
                    fontSize: 13.5, fontWeight: 600, fontFamily: SANS,
                    cursor: canSubmit ? "pointer" : "not-allowed",
                    opacity: canSubmit ? 1 : 0.55,
                    display: "flex", alignItems: "center", gap: 7,
                    transition: "opacity .12s",
                  }}
                >
                  {status === "loading" && (
                    <span
                      className="spinner-warm"
                      style={{ width: 13, height: 13, borderTopColor: "#fff", flexShrink: 0 }}
                    />
                  )}
                  {t.featureReqSubmit}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
