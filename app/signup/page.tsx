"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLang, switchLang } from "@/hooks/useLang";
import { T } from "@/lib/translations";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  linkWithCredential,
  EmailAuthProvider,
  OAuthCredential,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import posthog from "posthog-js";
import { TRIAL_DAYS, trialEndsAtFromNow } from "@/lib/trial";

function tr(s: string) { return s.replace("{days}", String(TRIAL_DAYS)); }
import {
  DA_BG, DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2, DA_GOLD, DA_GOLD_SOFT, DA_GREEN, DA_GREEN_SOFT,
  DA_DANGER, DA_DANGER_SOFT,
} from "@/lib/tokens";

const DISPLAY = "var(--font-instrument-serif), Georgia, serif";
const SANS = "var(--font-inter-tight), system-ui, sans-serif";

type Step = "form" | "verify" | "link" | "add-password";

// ── Shared auth shell components ─────────────────────────────────────────────

const GoogleSVG = () => (
  <svg width="16" height="16" viewBox="0 0 48 48">
    <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/>
    <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/>
    <path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.991 21.991 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"/>
    <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/>
  </svg>
);

const WarnSVG = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);

function Spinner({ dark }: { dark?: boolean }) {
  return (
    <span style={{
      width: 14, height: 14, borderRadius: "50%",
      border: dark ? "2px solid rgba(26,22,17,.2)" : "2px solid rgba(255,255,255,.4)",
      borderTopColor: dark ? DA_GOLD : "#fff",
      display: "inline-block",
      animation: "auth-spin 0.8s linear infinite",
      flexShrink: 0,
    }} />
  );
}

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

function AuthCard({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <div style={{
      width: "100%", maxWidth: wide ? 480 : 420,
      background: DA_SURFACE, border: `1px solid ${DA_RULE}`,
      borderRadius: 16, padding: 32,
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
          letterSpacing: 1.5, textTransform: "uppercase", color: DA_GOLD, marginBottom: 12,
        }}>{eyebrow}</div>
      )}
      <div style={{ fontFamily: DISPLAY, fontSize: 32, fontWeight: 400, color: DA_INK1, letterSpacing: -0.8, lineHeight: 1.05 }}>{title}</div>
      {subtitle && (
        <div style={{ fontFamily: SANS, fontSize: 13.5, color: DA_INK2, marginTop: 10, lineHeight: 1.55 }}>{subtitle}</div>
      )}
    </div>
  );
}

const inputBase: React.CSSProperties = {
  width: "100%", padding: "10px 12px",
  background: DA_SURFACE2, border: `1px solid ${DA_RULE}`,
  borderRadius: 8, color: DA_INK1,
  fontSize: 14, fontFamily: SANS, outline: "none", boxSizing: "border-box",
};

function FieldLabel({ label }: { label: string }) {
  return <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 500, color: DA_INK2, marginBottom: 6 }}>{label}</div>;
}

function FormError({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      marginBottom: 16, padding: "10px 12px",
      background: DA_DANGER_SOFT, border: `1px solid rgba(192,83,58,.25)`, borderRadius: 8,
      display: "flex", alignItems: "flex-start", gap: 8,
      fontFamily: SANS, fontSize: 12.5, color: DA_DANGER, lineHeight: 1.5,
    }}>
      <WarnSVG /><div>{children}</div>
    </div>
  );
}

function TrustStrip({ items }: { items: string[] }) {
  return (
    <div style={{
      marginTop: 18, padding: "10px 16px",
      display: "flex", alignItems: "center", justifyContent: "center",
      gap: 18, flexWrap: "wrap",
      fontFamily: SANS, fontSize: 11.5, color: DA_INK2,
    }}>
      {items.map((item, i) => (
        <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 16, height: 16, borderRadius: "50%",
            background: DA_GREEN_SOFT, color: DA_GREEN,
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </span>
          {item}
        </span>
      ))}
    </div>
  );
}

// ── Page logic ────────────────────────────────────────────────────────────────

function friendlyError(code: string, t: typeof T["en"]): string {
  switch (code) {
    case "auth/email-already-in-use": return t.authErrAlreadyInUse;
    case "auth/weak-password": return t.authErrWeakPassword;
    case "auth/invalid-email": return t.authErrInvalidEmail;
    case "auth/popup-closed-by-user": return "";
    default: return "";
  }
}

function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromGate = searchParams.get("from") === "gate";
  const lang = useLang();
  const t = T[lang];
  const isAr = lang === "ar";

  const [step, setStep] = useState<Step>("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const [linkPending, setLinkPending] = useState<{ credential: OAuthCredential; email: string } | null>(null);
  const [linkPassword, setLinkPassword] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const [addPasswordPending, setAddPasswordPending] = useState<{ email: string; password: string } | null>(null);
  const [addPasswordLoading, setAddPasswordLoading] = useState(false);
  const [addPasswordError, setAddPasswordError] = useState<string | null>(null);

  const passwordTouched = password.length > 0;
  const passwordValid = password.length >= 8 && password.length <= 64;
  const confirmTouched = confirmPassword.length > 0;
  const passwordsMatch = password === confirmPassword;
  const valid = name.trim() && email.trim() && passwordValid && passwordsMatch && confirmTouched;

  const newUserDoc = (_uid: string, userEmail: string | null, displayName?: string) => ({
    email: userEmail,
    name: displayName || name,
    plan: "free",
    trialEndsAt: trialEndsAtFromNow(),
    aiUsage: 0,
    stripeCustomerId: null,
    createdAt: Date.now(),
  });

  const handleSignup = async () => {
    if (!valid) return;
    setLoading(true);
    setError(null);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCred.user.uid), newUserDoc(userCred.user.uid, userCred.user.email));
      await sendEmailVerification(userCred.user, { url: `${window.location.origin}/builder` });
      posthog.identify(userCred.user.uid, { email: userCred.user.email, name });
      posthog.capture("user_signed_up", { method: "email", trial_days: TRIAL_DAYS, from_gate: fromGate });
      setStep("verify");
    } catch (err: any) {
      if (err?.code === "auth/email-already-in-use") {
        setAddPasswordPending({ email, password });
        setStep("add-password");
        return;
      }
      posthog.captureException(err);
      setError(friendlyError(err?.code, t) || err?.message || t.authErrSignupFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
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
        await setDoc(docRef, newUserDoc(user.uid, user.email, user.displayName || ""));
        posthog.capture("user_signed_up", { method: "google", trial_days: TRIAL_DAYS, from_gate: fromGate });
      } else {
        posthog.capture("user_logged_in", { method: "google", email: user.email });
      }
      posthog.identify(user.uid, { email: user.email, name: user.displayName });
      router.push("/builder");
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") return;
      if (err?.code === "auth/account-exists-with-different-credential") {
        const pending = GoogleAuthProvider.credentialFromError(err);
        const pendingEmail = err.customData?.email as string;
        if (pending && pendingEmail) {
          setLinkPending({ credential: pending, email: pendingEmail });
          setStep("link");
          return;
        }
      }
      posthog.captureException(err);
      setError(friendlyError(err?.code, t) || t.authErrGoogleSignin);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAddPasswordToGoogle = async () => {
    if (!addPasswordPending) return;
    setAddPasswordLoading(true);
    setAddPasswordError(null);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ login_hint: addPasswordPending.email });
      const userCred = await signInWithPopup(auth, provider);
      const emailCredential = EmailAuthProvider.credential(addPasswordPending.email, addPasswordPending.password);
      await linkWithCredential(userCred.user, emailCredential);
      posthog.identify(userCred.user.uid, { email: userCred.user.email });
      posthog.capture("account_linked", { method: "email_to_google", email: userCred.user.email });
      router.push("/builder");
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user") return;
      setAddPasswordError(t.authErrLinkFailedRetry);
    } finally {
      setAddPasswordLoading(false);
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
      router.push("/builder");
    } catch (err: any) {
      posthog.captureException(err);
      setLinkError(friendlyError(err?.code, t) || t.authErrLinkFailed);
    } finally {
      setLinkLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser || resendLoading) return;
    setResendLoading(true);
    setResendSent(false);
    try {
      await sendEmailVerification(auth.currentUser, { url: `${window.location.origin}/builder` });
      setResendSent(true);
    } catch {
      setVerifyError(t.authVerifyResendError);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <AuthShell lang={lang}>
      <div className="fade-up" style={{ width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", alignItems: "stretch" }}>

        {/* ── Signup form ── */}
        {step === "form" && (
          <>
            <AuthCard>
              <AuthHead
                eyebrow={tr(t.auth2SignupEyebrow)}
                title={t.authSignupTitle}
                subtitle={t.auth2SignupSubtitle}
              />

              {error && <FormError>{error}</FormError>}

              {/* Google button */}
              <button
                onClick={handleGoogleSignup}
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
                {googleLoading ? <Spinner dark /> : <GoogleSVG />}
                {t.authContinueWithGoogle}
              </button>

              {/* Or divider */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12, margin: "20px 0",
                fontFamily: SANS, fontSize: 11, color: DA_INK3, letterSpacing: 0.5, textTransform: "uppercase",
              }}>
                <div style={{ flex: 1, height: 1, background: DA_RULE }} />
                {t.auth2OrWithEmail}
                <div style={{ flex: 1, height: 1, background: DA_RULE }} />
              </div>

              {/* Fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <div>
                  <FieldLabel label={t.auth2SignupNameLabel} />
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSignup(); }}
                    placeholder={t.auth2SignupNamePlaceholder}
                    style={inputBase}
                    onFocus={e => (e.target.style.borderColor = DA_GOLD)}
                    onBlur={e => (e.target.style.borderColor = DA_RULE)}
                  />
                </div>
                <div>
                  <FieldLabel label={isAr ? "البريد الإلكتروني" : "Email"} />
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSignup(); }}
                    placeholder={t.authWorkEmailPlaceholder}
                    style={inputBase}
                    onFocus={e => (e.target.style.borderColor = DA_GOLD)}
                    onBlur={e => (e.target.style.borderColor = DA_RULE)}
                  />
                </div>
                <div>
                  <FieldLabel label={isAr ? "كلمة المرور" : "Password"} />
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSignup(); }}
                    placeholder="••••••••"
                    style={{
                      ...inputBase,
                      borderColor: passwordTouched && !passwordValid ? DA_DANGER : DA_RULE,
                    }}
                    onFocus={e => (e.target.style.borderColor = passwordTouched && !passwordValid ? DA_DANGER : DA_GOLD)}
                    onBlur={e => (e.target.style.borderColor = passwordTouched && !passwordValid ? DA_DANGER : DA_RULE)}
                  />
                  <div style={{
                    marginTop: 6, fontFamily: SANS, fontSize: 11.5,
                    color: passwordTouched && !passwordValid ? DA_DANGER : DA_INK3,
                  }}>
                    {passwordTouched && password.length > 64 ? t.authPasswordMaxHint : t.authPasswordHint}
                  </div>
                </div>
                <div>
                  <FieldLabel label={isAr ? "تأكيد كلمة المرور" : "Confirm password"} />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter") handleSignup(); }}
                    placeholder="••••••••"
                    style={{
                      ...inputBase,
                      borderColor: confirmTouched && !passwordsMatch ? DA_DANGER : DA_RULE,
                    }}
                    onFocus={e => (e.target.style.borderColor = confirmTouched && !passwordsMatch ? DA_DANGER : DA_GOLD)}
                    onBlur={e => (e.target.style.borderColor = confirmTouched && !passwordsMatch ? DA_DANGER : DA_RULE)}
                  />
                  {confirmTouched && !passwordsMatch && (
                    <div style={{ marginTop: 6, fontFamily: SANS, fontSize: 11.5, color: DA_DANGER }}>{t.authPasswordsMismatch}</div>
                  )}
                </div>
              </div>

              {/* Submit */}
              <button
                onClick={handleSignup}
                disabled={loading || !valid}
                style={{
                  width: "100%", marginTop: 22, padding: "13px 18px",
                  background: !valid ? DA_RULE : DA_GOLD, color: !valid ? DA_INK3 : "#fff",
                  border: "none", borderRadius: 10,
                  fontFamily: SANS, fontSize: 14, fontWeight: 600,
                  cursor: !valid || loading ? "not-allowed" : "pointer",
                  boxShadow: valid ? "0 1px 2px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.15)" : "none",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "background 0.15s",
                }}
              >
                {loading && <Spinner />}
                {loading ? t.authCreatingAccount : t.auth2StartTrial}
              </button>

              {/* Cross-link */}
              <div style={{ marginTop: 18, textAlign: "center", fontFamily: SANS, fontSize: 12.5, color: DA_INK2 }}>
                {t.auth2HaveAccount}{" "}
                <a href="/login" style={{ color: DA_GOLD, fontWeight: 500, textDecoration: "none" }}>{t.auth2SignIn}</a>
              </div>
            </AuthCard>

            {/* Trust strip */}
            <TrustStrip items={[tr(t.auth2Trust1), t.auth2Trust2, t.auth2Trust3]} />

            <div style={{
              marginTop: 14, textAlign: "center",
              fontFamily: SANS, fontSize: 11, color: DA_INK3, lineHeight: 1.5,
            }}>{t.authTermsText}</div>
          </>
        )}

        {/* ── Email verification step ── */}
        {step === "verify" && (
          <AuthCard>
            {/* Envelope icon */}
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
              }}>{t.auth2VerifyEyebrow}</div>
              <div style={{
                fontFamily: DISPLAY, fontSize: 28, fontWeight: 400,
                color: DA_INK1, marginTop: 10, letterSpacing: -0.6, lineHeight: 1.1,
              }}>{t.auth2VerifyTitle}</div>
              <div style={{ fontFamily: SANS, fontSize: 13.5, color: DA_INK2, marginTop: 14, lineHeight: 1.55 }}>
                {t.auth2VerifySub}{" "}
                <span style={{ color: DA_INK1, fontWeight: 500, direction: "ltr", display: "inline-block" }}>{email}</span>
                <br />{t.auth2VerifyAfterText}
              </div>
            </div>

            {/* Spam note */}
            <div style={{
              marginTop: 24, padding: "12px 14px",
              background: DA_BG, border: `1px solid ${DA_RULE}`, borderRadius: 9,
              fontFamily: SANS, fontSize: 11.5, color: DA_INK3, lineHeight: 1.5,
              textAlign: isAr ? "right" : "left",
            }}>{t.auth2SpamNote}</div>

            {verifyError && (
              <div style={{ marginTop: 12, fontFamily: SANS, fontSize: 12.5, color: DA_DANGER, textAlign: "center" }}>{verifyError}</div>
            )}
            {resendSent && (
              <div style={{ marginTop: 12, fontFamily: SANS, fontSize: 12.5, color: DA_GREEN, textAlign: "center" }}>{t.authVerifyResent}</div>
            )}

            {/* Actions */}
            <div style={{ marginTop: 20, display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                onClick={handleResendVerification}
                disabled={resendLoading}
                style={{
                  padding: "8px 14px",
                  background: DA_SURFACE2, border: `1px solid ${DA_RULE2}`, borderRadius: 8,
                  color: DA_INK1, fontFamily: SANS, fontSize: 12.5, fontWeight: 500,
                  cursor: resendLoading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {resendLoading && <Spinner dark />}
                {t.auth2VerifyResend}
              </button>
              <button
                onClick={() => setStep("form")}
                style={{
                  padding: "8px 14px",
                  background: "transparent", border: "none",
                  color: DA_INK2, fontFamily: SANS, fontSize: 12.5, fontWeight: 500,
                  cursor: "pointer",
                }}
              >{t.auth2VerifyWrong}</button>
            </div>
          </AuthCard>
        )}

        {/* ── Link accounts step ── */}
        {step === "link" && linkPending && (
          <AuthCard>
            <AuthHead eyebrow={t.authLinkGoogleTitle} title={t.authLinkGoogleSubtitle ?? t.authLinkGoogleTitle} />

            <div style={{
              padding: "12px 14px",
              background: DA_BG, border: `1px solid ${DA_RULE}`, borderRadius: 9,
              fontFamily: SANS, fontSize: 13, color: DA_INK2, lineHeight: 1.55, marginBottom: 20,
            }}>
              <span style={{ color: DA_INK1, fontWeight: 500 }}>{linkPending.email}</span>{" "}
              {t.authLinkAccountDescSuffix}
            </div>

            {linkError && <FormError>{linkError}</FormError>}

            <div>
              <FieldLabel label={isAr ? "كلمة المرور الحالية" : "Existing password"} />
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
                background: DA_GOLD, color: "#fff", border: "none", borderRadius: 10,
                fontFamily: SANS, fontSize: 14, fontWeight: 600,
                cursor: linkLoading ? "not-allowed" : "pointer", opacity: linkLoading ? 0.8 : 1,
                boxShadow: "0 1px 2px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.15)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {linkLoading && <Spinner />}
              {linkLoading ? t.authLinking : t.authLinkGoogleBtn}
            </button>

            <div style={{ marginTop: 18, textAlign: "center" }}>
              <button
                onClick={() => { setStep("form"); setLinkPending(null); setLinkPassword(""); setLinkError(null); }}
                style={{
                  background: "none", border: "none", fontFamily: SANS, fontSize: 12.5,
                  color: DA_GOLD, fontWeight: 500, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 5,
                }}
              >
                <span style={{ transform: isAr ? "scaleX(-1)" : "none", display: "inline-flex" }}>←</span>
                {t.authBack}
              </button>
            </div>
          </AuthCard>
        )}

        {/* ── Add password to existing Google account ── */}
        {step === "add-password" && addPasswordPending && (
          <AuthCard>
            <div style={{
              width: 56, height: 56, borderRadius: "50%",
              background: DA_GOLD_SOFT, color: DA_GOLD,
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 20px",
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
            </div>

            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 400, color: DA_INK1, letterSpacing: -0.6, lineHeight: 1.1 }}>{t.authAddPasswordTitle}</div>
              <div style={{ fontFamily: SANS, fontSize: 13.5, color: DA_INK2, marginTop: 10, lineHeight: 1.55 }}>
                <span style={{ color: DA_INK1, fontWeight: 500 }}>{addPasswordPending.email}</span>{" "}
                {t.authAddPasswordDescSuffix}
              </div>
            </div>

            {addPasswordError && <FormError>{addPasswordError}</FormError>}

            <button
              onClick={handleAddPasswordToGoogle}
              disabled={addPasswordLoading}
              style={{
                width: "100%", padding: "11px 14px",
                background: DA_SURFACE2, border: `1px solid ${DA_RULE2}`, borderRadius: 9,
                color: DA_INK1, fontFamily: SANS, fontSize: 13.5, fontWeight: 500,
                display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                cursor: addPasswordLoading ? "not-allowed" : "pointer", opacity: addPasswordLoading ? 0.7 : 1,
                marginBottom: 10,
              }}
            >
              {addPasswordLoading ? <Spinner dark /> : <GoogleSVG />}
              {t.authAddPasswordGoogleBtn}
            </button>

            <a
              href="/login"
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                width: "100%", padding: "13px 18px",
                background: DA_GOLD, color: "#fff", border: "none", borderRadius: 10,
                fontFamily: SANS, fontSize: 14, fontWeight: 600,
                textDecoration: "none", boxSizing: "border-box", marginBottom: 12,
              }}
            >{t.authLogInInstead}</a>

            <div style={{ textAlign: "center" }}>
              <button
                onClick={() => { setStep("form"); setAddPasswordPending(null); setAddPasswordError(null); }}
                style={{
                  background: "none", border: "none", fontFamily: SANS, fontSize: 12.5,
                  color: DA_GOLD, fontWeight: 500, cursor: "pointer",
                  display: "inline-flex", alignItems: "center", gap: 5,
                }}
              >
                <span style={{ transform: isAr ? "scaleX(-1)" : "none", display: "inline-flex" }}>←</span>
                {t.authBack}
              </button>
            </div>
          </AuthCard>
        )}

      </div>
    </AuthShell>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}
