"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useLang, switchLang } from "@/hooks/useLang";
import { T } from "@/lib/translations";
import posthog from "posthog-js";
import {
  DA_BG, DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2, DA_GOLD, DA_GOLD_SOFT,
  DA_DANGER, DA_DANGER_SOFT,
} from "@/lib/tokens";

const DISPLAY = "var(--font-instrument-serif), Georgia, serif";
const SANS = "var(--font-inter-tight), system-ui, sans-serif";

// ── Shell / card ─────────────────────────────────────────────────────────────

function AuthShell({ lang, children }: { lang: "en" | "ar"; children: React.ReactNode }) {
  const isAr = lang === "ar";
  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{
      width: "100%", minHeight: "100vh",
      background: DA_BG, fontFamily: SANS,
      position: "relative", display: "flex", flexDirection: "column", overflow: "auto",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background:
          "radial-gradient(circle at 18% 0%, rgba(176,138,62,.06), transparent 55%)," +
          "radial-gradient(circle at 82% 100%, rgba(176,138,62,.04), transparent 50%)",
      }} />

      <div style={{
        position: "relative", zIndex: 1,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "22px 32px",
      }}>
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, color: DA_INK1, textDecoration: "none" }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: DA_INK1, color: DA_GOLD,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 14, fontWeight: 700, fontFamily: DISPLAY, letterSpacing: -0.5,
          }}>P</div>
          <div style={{ fontFamily: DISPLAY, fontSize: 20, color: DA_INK1, letterSpacing: -0.3 }}>Packmetrix</div>
        </a>

        <div style={{
          display: "flex", padding: 3,
          background: DA_SURFACE, border: `1px solid ${DA_RULE2}`, borderRadius: 999,
          fontFamily: SANS, fontSize: 12, fontWeight: 500,
        }}>
          {(["EN", "عربي"] as const).map((l, i) => {
            const active = (lang === "en" && i === 0) || (lang === "ar" && i === 1);
            return (
              <div
                key={l}
                onClick={() => switchLang(i === 0 ? "en" : "ar")}
                style={{
                  padding: "4px 13px", borderRadius: 999,
                  background: active ? DA_INK1 : "transparent",
                  color: active ? DA_BG : DA_INK2,
                  cursor: "pointer", userSelect: "none",
                }}
              >{l}</div>
            );
          })}
        </div>
      </div>

      <div style={{
        position: "relative", zIndex: 1,
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 24px 32px",
      }}>
        {children}
      </div>

      <div style={{
        position: "relative", zIndex: 1,
        padding: "16px 32px 24px",
        display: "flex", justifyContent: "center", alignItems: "center", gap: 16,
        fontFamily: SANS, fontSize: 12, color: DA_INK3,
      }}>
        <span>© 2026 Packmetrix</span>
        <span style={{ color: DA_RULE2 }}>·</span>
        <a href="/privacy" style={{ color: DA_INK3, textDecoration: "none" }}>{isAr ? "الخصوصية" : "Privacy"}</a>
        <span style={{ color: DA_RULE2 }}>·</span>
        <a href="/terms" style={{ color: DA_INK3, textDecoration: "none" }}>{isAr ? "الشروط" : "Terms"}</a>
        <span style={{ color: DA_RULE2 }}>·</span>
        <a href="mailto:hello@packmetrix.com" style={{ color: DA_GOLD, textDecoration: "none", fontWeight: 500 }}>{isAr ? "تواصل معنا" : "Contact"}</a>
      </div>
    </div>
  );
}

function AuthCard({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      width: "100%", maxWidth: 420,
      background: DA_SURFACE, border: `1px solid ${DA_RULE}`,
      borderRadius: 16, padding: 32,
      boxShadow: "0 1px 2px rgba(26,22,17,.04), 0 12px 32px -16px rgba(26,22,17,.12)",
    }}>{children}</div>
  );
}

function Spinner() {
  return (
    <span style={{
      width: 14, height: 14, borderRadius: "50%",
      border: "2px solid rgba(255,255,255,.4)",
      borderTopColor: "#fff",
      display: "inline-block",
      animation: "auth-spin 0.8s linear infinite",
      flexShrink: 0,
    }} />
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

function ForgotPageInner() {
  const searchParams = useSearchParams();
  const lang = useLang();
  const t = T[lang];
  const isAr = lang === "ar";

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!email.trim()) { setError(t.authErrPleaseFillEmail); return; }
    setLoading(true);
    setError(null);
    try {
      // Reset email is generated + delivered server-side (Admin SDK + Resend),
      // bypassing Firebase's hosted email template. The endpoint returns success
      // even for unknown addresses, so this never reveals whether an account exists.
      const res = await fetch("/api/send-password-reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), redirectUrl: `${window.location.origin}/login` }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "reset_failed");
      }
      setSent(true);
    } catch (err: any) {
      posthog.capture("reset_email_failed", { error: err?.message });
      setError(t.authErrResetFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell lang={lang}>
      <div className="fade-up" style={{ width: "100%", maxWidth: 420 }}>

        {/* ── Form state ── */}
        {!sent && (
          <AuthCard>
            <div style={{ marginBottom: 24 }}>
              <div style={{
                fontFamily: SANS, fontSize: 10.5, fontWeight: 600,
                letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD, marginBottom: 12,
              }}>{t.auth2ForgotEyebrow}</div>
              <div style={{ fontFamily: DISPLAY, fontSize: 32, fontWeight: 400, color: DA_INK1, letterSpacing: -0.8, lineHeight: 1.05 }}>
                {t.auth2ForgotTitle}
              </div>
              <div style={{ fontFamily: SANS, fontSize: 13.5, color: DA_INK2, marginTop: 10, lineHeight: 1.55 }}>
                {t.auth2ForgotSubtitle}
              </div>
            </div>

            {error && (
              <div style={{
                marginBottom: 16, padding: "10px 12px",
                background: DA_DANGER_SOFT, border: `1px solid rgba(192,83,58,.25)`, borderRadius: 8,
                display: "flex", alignItems: "flex-start", gap: 8,
                fontFamily: SANS, fontSize: 12.5, color: DA_DANGER, lineHeight: 1.5,
              }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <div>{error}</div>
              </div>
            )}

            <div>
              <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: DA_INK2, marginBottom: 6 }}>
                {isAr ? "البريد الإلكتروني" : "Email"}
              </div>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleSend(); }}
                placeholder="you@agency.com"
                style={{
                  width: "100%", padding: "10px 12px",
                  background: DA_SURFACE2, border: `1px solid ${DA_RULE}`,
                  borderRadius: 8, color: DA_INK1,
                  fontSize: 14, fontFamily: SANS, outline: "none", boxSizing: "border-box",
                }}
                onFocus={e => (e.target.style.borderColor = DA_GOLD)}
                onBlur={e => (e.target.style.borderColor = DA_RULE)}
              />
            </div>

            <button
              onClick={handleSend}
              disabled={loading}
              style={{
                width: "100%", marginTop: 22, padding: "13px 18px",
                background: DA_GOLD, color: "#fff",
                border: "none", borderRadius: 10,
                fontFamily: SANS, fontSize: 14, fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.8 : 1,
                boxShadow: "0 1px 2px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.15)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {loading && <Spinner />}
              {loading ? t.authSending : t.auth2ForgotSubmit}
            </button>

            <div style={{ marginTop: 18, textAlign: "center" }}>
              <a
                href="/login"
                style={{
                  fontFamily: SANS, fontSize: 12.5, color: DA_GOLD, fontWeight: 500,
                  textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5,
                }}
              >
                <span style={{ transform: isAr ? "scaleX(-1)" : "none", display: "inline-flex" }}>←</span>
                {t.auth2ForgotBack}
              </a>
            </div>
          </AuthCard>
        )}

        {/* ── Email sent state ── */}
        {sent && (
          <AuthCard>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: DA_GOLD_SOFT, color: DA_GOLD,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>

            <div style={{ textAlign: "center" }}>
              <div style={{
                fontFamily: SANS, fontSize: 10.5, fontWeight: 600,
                letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD,
              }}>{t.auth2ResetSentEyebrow}</div>
              <div style={{
                fontFamily: DISPLAY, fontSize: 28, fontWeight: 400,
                color: DA_INK1, marginTop: 10, letterSpacing: -0.6, lineHeight: 1.1,
              }}>{t.auth2ResetSentTitle}</div>
              <div style={{ fontFamily: SANS, fontSize: 13.5, color: DA_INK2, marginTop: 14, lineHeight: 1.55 }}>
                {t.auth2ResetSentSub}{" "}
                <span style={{ color: DA_INK1, fontWeight: 500, direction: "ltr", display: "inline-block" }}>{email}</span>
              </div>
            </div>

            <div style={{
              marginTop: 24, padding: "12px 14px",
              background: DA_BG, border: `1px solid ${DA_RULE}`, borderRadius: 9,
              fontFamily: SANS, fontSize: 11.5, color: DA_INK3, lineHeight: 1.5,
              textAlign: isAr ? "right" : "left",
            }}>{t.auth2SpamNote}</div>

            <div style={{ marginTop: 20, textAlign: "center" }}>
              <a
                href="/login"
                style={{
                  fontFamily: SANS, fontSize: 12.5, color: DA_GOLD, fontWeight: 500,
                  textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 5,
                }}
              >
                <span style={{ transform: isAr ? "scaleX(-1)" : "none", display: "inline-flex" }}>←</span>
                {t.auth2ForgotBack}
              </a>
            </div>
          </AuthCard>
        )}

      </div>
    </AuthShell>
  );
}

export default function ForgotPage() {
  return (
    <Suspense fallback={null}>
      <ForgotPageInner />
    </Suspense>
  );
}
