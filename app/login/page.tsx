"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  linkWithCredential,
  OAuthCredential,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { onboardingInit, postAuthRoute } from "@/lib/onboarding";
import posthog from "posthog-js";
import { FREE_AI_LIMIT } from "@/lib/limits";
import { trialEndsAtFromNow } from "@/lib/trial";
import { useLang, switchLang } from "@/hooks/useLang";
import { T } from "@/lib/translations";
import {
  DA_BG, DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2, DA_GOLD, DA_DANGER, DA_DANGER_SOFT,
} from "@/lib/tokens";

const DISPLAY = "var(--font-instrument-serif), Georgia, serif";
const SANS = "var(--font-inter-tight), system-ui, sans-serif";

type View = "login" | "link";

const GoogleSVG = () => (
  <svg width="16" height="16" viewBox="0 0 48 48">
    <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
    <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
    <path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.991 21.991 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/>
    <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
  </svg>
);

const CheckSVG = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);

const WarnSVG = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

function AuthShell({ lang, children }: { lang: "en" | "ar"; children: React.ReactNode }) {
  const isAr = lang === "ar";
  return (
    <div dir={isAr ? "rtl" : "ltr"} style={{
      width: "100%", minHeight: "100vh",
      background: DA_BG,
      fontFamily: SANS,
      position: "relative",
      display: "flex", flexDirection: "column",
      overflow: "auto",
    }}>
      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background:
          "radial-gradient(circle at 18% 0%, rgba(176,138,62,.06), transparent 55%)," +
          "radial-gradient(circle at 82% 100%, rgba(176,138,62,.04), transparent 50%)",
      }} />

      {/* Top chrome */}
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

      {/* Content */}
      <div style={{
        position: "relative", zIndex: 1,
        flex: 1, display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "0 24px 32px",
      }}>
        {children}
      </div>

      {/* Footer */}
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
      background: DA_SURFACE,
      border: `1px solid ${DA_RULE}`,
      borderRadius: 16,
      padding: 32,
      boxShadow: "0 1px 2px rgba(26,22,17,.04), 0 12px 32px -16px rgba(26,22,17,.12)",
    }}>{children}</div>
  );
}

function AuthHead({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: 24 }}>
      {eyebrow && (
        <div style={{
          fontFamily: SANS, fontSize: 10.5, fontWeight: 600,
          letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD,
          marginBottom: 12,
        }}>{eyebrow}</div>
      )}
      <div style={{
        fontFamily: DISPLAY, fontSize: 32, fontWeight: 400,
        color: DA_INK1, letterSpacing: -0.8, lineHeight: 1.05,
      }}>{title}</div>
      {subtitle && (
        <div style={{
          fontFamily: SANS, fontSize: 13.5, color: DA_INK2,
          marginTop: 10, lineHeight: 1.55,
        }}>{subtitle}</div>
      )}
    </div>
  );
}

function FieldLabel({ label }: { label: string }) {
  return (
    <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: DA_INK2, marginBottom: 6 }}>{label}</div>
  );
}

const inputBase: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  background: DA_SURFACE2, border: `1px solid ${DA_RULE}`,
  borderRadius: 8, color: DA_INK1,
  fontSize: 14, fontFamily: SANS, outline: "none",
  boxSizing: "border-box",
};

function FormError({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      marginBottom: 16, padding: "10px 12px",
      background: DA_DANGER_SOFT, border: `1px solid rgba(192,83,58,.25)`, borderRadius: 8,
      display: "flex", alignItems: "flex-start", gap: 8,
      fontFamily: SANS, fontSize: 12.5, color: DA_DANGER, lineHeight: 1.5,
    }}>
      <WarnSVG />
      <div>{children}</div>
    </div>
  );
}

function Spinner({ gold }: { gold?: boolean }) {
  return (
    <span style={{
      width: 14, height: 14, borderRadius: "50%",
      border: gold ? `2px solid rgba(176,138,62,.3)` : "2px solid rgba(255,255,255,.4)",
      borderTopColor: gold ? DA_GOLD : "#fff",
      display: "inline-block",
      animation: "auth-spin 0.8s linear infinite",
      flexShrink: 0,
    }} />
  );
}

export default function LoginPage() {
  const router = useRouter();
  const lang = useLang();
  const t = T[lang];
  const isAr = lang === "ar";

  const [view, setView] = useState<View>("login");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [linkPending, setLinkPending] = useState<{ credential: OAuthCredential; email: string } | null>(null);
  const [linkPassword, setLinkPassword] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  function friendlyError(code: string): string {
    switch (code) {
      case "auth/user-not-found":
      case "auth/wrong-password":
      case "auth/invalid-credential": return t.authErrEmailOrPassword;
      case "auth/invalid-email": return t.authErrInvalidEmail;
      case "auth/too-many-requests": return t.authErrTooManyRequests;
      case "auth/popup-closed-by-user": return "";
      default: return "";
    }
  }

  const handleLogin = async () => {
    if (!email || !password) { setError(t.authErrPleaseFillAll); return; }
    setLoading(true);
    setError(null);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      if (!userCred.user.emailVerified) {
        await sendEmailVerification(userCred.user, { url: `${window.location.origin}/welcome` });
        await signOut(auth);
        setError(t.authErrEmailVerification);
        return;
      }
      posthog.identify(userCred.user.uid, { email: userCred.user.email });
      posthog.capture("user_logged_in", { email: userCred.user.email });
      const snap = await getDoc(doc(db, "users", userCred.user.uid));
      router.push(postAuthRoute(snap.data()));
    } catch (err: any) {
      posthog.capture("login_failed", { error_code: err?.code });
      posthog.captureException(err);
      setError(friendlyError(err?.code) || err?.message || t.authErrLoginFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError(null);
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      const user = userCred.user;
      const docRef = doc(db, "users", user.uid);
      const snap = await getDoc(docRef);
      const isNewUser = !snap.exists();
      if (isNewUser) {
        await setDoc(docRef, {
          email: user.email,
          name: user.displayName || "",
          plan: "free",
          trialEndsAt: trialEndsAtFromNow(),
          aiUsage: 0,
          aiLimit: FREE_AI_LIMIT,
          stripeCustomerId: null,
          createdAt: Date.now(),
          onboarding: onboardingInit(),
        });
        posthog.capture("user_signed_up", { method: "google", email: user.email });
      } else {
        posthog.capture("user_logged_in", { method: "google", email: user.email });
      }
      posthog.identify(user.uid, { email: user.email, name: user.displayName });
      router.push(isNewUser ? "/welcome" : postAuthRoute(snap.data()));
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") return;
      if (err?.code === "auth/account-exists-with-different-credential") {
        const pending = GoogleAuthProvider.credentialFromError(err);
        const pendingEmail = err.customData?.email as string;
        if (pending && pendingEmail) {
          setLinkPending({ credential: pending, email: pendingEmail });
          setView("link");
          return;
        }
      }
      posthog.captureException(err);
      setError(friendlyError(err?.code) || t.authErrGoogleSignin);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLinkAccount = async () => {
    if (!linkPending || !linkPassword) { setLinkError(t.authErrPleaseFillAll); return; }
    setLinkLoading(true);
    setLinkError(null);
    try {
      const userCred = await signInWithEmailAndPassword(auth, linkPending.email, linkPassword);
      await linkWithCredential(userCred.user, linkPending.credential);
      posthog.identify(userCred.user.uid, { email: userCred.user.email });
      posthog.capture("account_linked", { method: "google", email: userCred.user.email });
      const linkedSnap = await getDoc(doc(db, "users", userCred.user.uid));
      router.push(postAuthRoute(linkedSnap.data()));
    } catch (err: any) {
      posthog.captureException(err);
      setLinkError(friendlyError(err?.code) || t.authErrLinkFailed);
    } finally {
      setLinkLoading(false);
    }
  };

  return (
    <AuthShell lang={lang}>
      <div className="fade-up" style={{ width: "100%", maxWidth: 420 }}>

        {/* ── Login view ── */}
        {view === "login" && (
          <AuthCard>
            <AuthHead
              eyebrow={t.auth2LoginEyebrow}
              title={t.authLoginTitle}
              subtitle={t.auth2LoginSubtitle}
            />

            {error && <div data-testid="login-error"><FormError>{error}</FormError></div>}

            {/* Google button */}
            <button
              onClick={handleGoogleLogin}
              disabled={googleLoading}
              style={{
                width: "100%", padding: "11px 14px",
                background: DA_SURFACE2, border: `1px solid ${DA_RULE2}`, borderRadius: 9,
                color: DA_INK1, fontFamily: SANS, fontSize: 13.5, fontWeight: 500,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                cursor: googleLoading ? "not-allowed" : "pointer",
                opacity: googleLoading ? 0.7 : 1,
              }}
            >
              {googleLoading ? <Spinner gold /> : <GoogleSVG />}
              {t.authContinueWithGoogle}
            </button>

            {/* Or divider */}
            <div style={{
              display: "flex", alignItems: "center", gap: 12,
              margin: "20px 0",
              fontFamily: SANS, fontSize: 11, color: DA_INK3,
              letterSpacing: 0.5, textTransform: "uppercase",
            }}>
              <div style={{ flex: 1, height: 1, background: DA_RULE }} />
              {t.auth2OrWithEmail}
              <div style={{ flex: 1, height: 1, background: DA_RULE }} />
            </div>

            {/* Fields */}
            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 4 }}>
              <div>
                <FieldLabel label={isAr ? "البريد الإلكتروني" : "Email"} />
                <input
                  data-testid="login-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleLogin(); }}
                  placeholder={t.authEmailPlaceholder}
                  style={inputBase}
                  onFocus={e => (e.target.style.borderColor = DA_GOLD)}
                  onBlur={e => (e.target.style.borderColor = DA_RULE)}
                />
              </div>
              <div>
                <FieldLabel label={isAr ? "كلمة المرور" : "Password"} />
                <input
                  data-testid="login-password"
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleLogin(); }}
                  placeholder="••••••••"
                  style={inputBase}
                  onFocus={e => (e.target.style.borderColor = DA_GOLD)}
                  onBlur={e => (e.target.style.borderColor = DA_RULE)}
                />
              </div>
              <div style={{ textAlign: isAr ? "left" : "right", marginTop: -6 }}>
                <button
                  onClick={() => router.push(`/forgot${email ? `?email=${encodeURIComponent(email)}` : ""}`)}
                  style={{ background: "none", border: "none", fontFamily: SANS, fontSize: 12, color: DA_GOLD, fontWeight: 500, cursor: "pointer" }}
                >
                  {t.authForgotPassword}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              data-testid="login-submit"
              onClick={handleLogin}
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
              {loading ? t.authSigningIn : t.auth2LoginSubmit}
            </button>

            {/* Cross-link */}
            <div style={{
              marginTop: 18, textAlign: "center",
              fontFamily: SANS, fontSize: 12.5, color: DA_INK2,
            }}>
              {t.auth2NoAccount}{" "}
              <a href="/signup" style={{ color: DA_GOLD, fontWeight: 500, textDecoration: "none" }}>
                {t.auth2CreateAccount}
              </a>
            </div>
          </AuthCard>
        )}

        {/* ── Link accounts view ── */}
        {view === "link" && linkPending && (
          <AuthCard>
            <AuthHead
              eyebrow={t.authLinkGoogleTitle}
              title={t.authLinkGoogleSubtitle ?? t.authLinkGoogleTitle}
            />

            <div style={{
              padding: "12px 14px",
              background: DA_BG, border: `1px solid ${DA_RULE}`, borderRadius: 9,
              fontFamily: SANS, fontSize: 13, color: DA_INK2, lineHeight: 1.55,
              marginBottom: 20,
            }}>
              <span style={{ color: DA_INK1, fontWeight: 500 }}>{linkPending.email}</span>{" "}
              {t.authLinkAccountDescSuffix}
            </div>

            {linkError && <FormError>{linkError}</FormError>}

            <div>
              <FieldLabel label={t.authExistingPasswordPlaceholder ?? "Password"} />
              <input
                type="password"
                value={linkPassword}
                onChange={e => setLinkPassword(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") handleLinkAccount(); }}
                placeholder={t.authExistingPasswordPlaceholder}
                style={inputBase}
                onFocus={e => (e.target.style.borderColor = DA_GOLD)}
                onBlur={e => (e.target.style.borderColor = DA_RULE)}
              />
            </div>

            <button
              onClick={handleLinkAccount}
              disabled={linkLoading}
              style={{
                width: "100%", marginTop: 22, padding: "13px 18px",
                background: DA_GOLD, color: "#fff",
                border: "none", borderRadius: 10,
                fontFamily: SANS, fontSize: 14, fontWeight: 600,
                cursor: linkLoading ? "not-allowed" : "pointer",
                opacity: linkLoading ? 0.8 : 1,
                boxShadow: "0 1px 2px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.15)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {linkLoading && <Spinner />}
              {linkLoading ? t.authLinking : t.authLinkGoogleBtn}
            </button>

            <div style={{ marginTop: 18, textAlign: "center" }}>
              <button
                onClick={() => { setView("login"); setLinkPending(null); setLinkPassword(""); setLinkError(null); }}
                style={{
                  background: "none", border: "none", fontFamily: SANS, fontSize: 12.5,
                  color: DA_GOLD, fontWeight: 500, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 5,
                }}
              >
                <span style={{ transform: isAr ? "scaleX(-1)" : "none", display: "inline-flex" }}>←</span>
                {t.authBackToSignIn}
              </button>
            </div>
          </AuthCard>
        )}

      </div>
    </AuthShell>
  );
}
