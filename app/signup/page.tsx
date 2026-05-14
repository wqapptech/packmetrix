"use client";

import { useState, Suspense } from "react";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useRouter, useSearchParams } from "next/navigation";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  linkWithCredential,
  OAuthCredential,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import Icon from "@/components/Icon";
import posthog from "posthog-js";
import { FREE_PACKAGE_LIMIT, FREE_AI_LIMIT } from "@/lib/limits";

const SAND = "#e8c97b";
const SUCCESS = "#2dd4a0";

type PlanId = "free" | "pro" | "agency";
type Step = "form" | "verify" | "link";

const PLANS: { id: PlanId; price: string; period: string; badge?: string; features: string[]; cta: string; disabled?: boolean }[] = [
  {
    id: "free",
    price: "€0",
    period: "",
    features: [`${FREE_PACKAGE_LIMIT} packages`, "Basic analytics", "Lead tracking", "WhatsApp & Messenger CTA"],
    cta: "Start free",
  },
  {
    id: "pro",
    price: "€29",
    period: "/mo",
    badge: "Most popular",
    features: ["Unlimited packages", "AI content writer", "Analytics per package", "Lead inbox", "Arabic + English pages", "Pexels photo library", "AI image generation (coming soon)", "Promo video creator (coming soon)"],
    cta: "Start with Pro",
  },
  {
    id: "agency",
    price: "€79",
    period: "/mo",
    badge: "Coming Soon",
    features: ["Everything in Pro", "Team seats (up to 5)", "White-label branding", "Custom domain", "📱 Companion mobile app"],
    cta: "Notify me",
    disabled: true,
  },
];

function friendlyError(code: string): string {
  switch (code) {
    case "auth/email-already-in-use": return "This email is already in use. Try logging in instead.";
    case "auth/weak-password": return "Password should be at least 6 characters.";
    case "auth/invalid-email": return "Please enter a valid email address.";
    case "auth/popup-closed-by-user": return "";
    default: return "";
  }
}

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px",
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12, color: "#fdfcf9",
  fontSize: 14, fontFamily: "inherit", outline: "none",
};

function SignupPageInner() {
  const router = useRouter();
  const isMobile = useIsMobile();
  const searchParams = useSearchParams();
  const fromGate = searchParams.get("from") === "gate";

  const [step, setStep] = useState<Step>("form");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("free");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  // Account linking state (Google sign-in with existing email/password account)
  const [linkPending, setLinkPending] = useState<{ credential: OAuthCredential; email: string } | null>(null);
  const [linkPassword, setLinkPassword] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const passwordTouched = password.length > 0;
  const passwordValid = password.length >= 8 && password.length <= 64;
  const confirmTouched = confirmPassword.length > 0;
  const passwordsMatch = password === confirmPassword;
  const valid = name.trim() && email.trim() && passwordValid && passwordsMatch && confirmTouched;

  const handleSignup = async () => {
    if (!valid) return;
    setLoading(true);
    setError(null);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await setDoc(doc(db, "users", userCred.user.uid), {
        email: userCred.user.email,
        name,
        plan: "free",
        aiUsage: 0,
        aiLimit: FREE_AI_LIMIT,
        stripeCustomerId: null,
        createdAt: Date.now(),
      });
      await sendEmailVerification(userCred.user, {
        url: `${window.location.origin}/builder`,
      });
      posthog.identify(userCred.user.uid, { email: userCred.user.email, name });
      posthog.capture("user_signed_up", { plan: selectedPlan, email: userCred.user.email, from_gate: fromGate });
      setStep("verify");
    } catch (err: any) {
      posthog.captureException(err);
      const msg = friendlyError(err?.code);
      setError(msg || err?.message || "Signup failed. Please try again.");
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
        await setDoc(docRef, {
          email: user.email,
          name: user.displayName || "",
          plan: "free",
          aiUsage: 0,
          aiLimit: FREE_AI_LIMIT,
          stripeCustomerId: null,
          createdAt: Date.now(),
        });
        posthog.capture("user_signed_up", { method: "google", plan: selectedPlan, email: user.email, from_gate: fromGate });
      } else {
        posthog.capture("user_logged_in", { method: "google", email: user.email });
      }
      posthog.identify(user.uid, { email: user.email, name: user.displayName });
      if (isNewUser && selectedPlan === "pro") {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.uid, billingPeriod: "monthly" }),
        });
        const json = await res.json();
        if (json.url) { window.location.href = json.url; return; }
      }
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
      const msg = friendlyError(err?.code);
      setError(msg || "Google sign-in failed. Please try again.");
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleLinkAccount = async () => {
    if (!linkPending || !linkPassword) { setLinkError("Please enter your password."); return; }
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
      const msg = friendlyError(err?.code);
      setLinkError(msg || "Failed to link accounts. Please check your password.");
    } finally {
      setLinkLoading(false);
    }
  };

  const handleContinueAfterVerify = async () => {
    setVerifyLoading(true);
    setVerifyError(null);
    try {
      if (!auth.currentUser) { router.push("/login"); return; }
      await auth.currentUser.reload();
      if (auth.currentUser.emailVerified) {
        if (selectedPlan === "pro") {
          const res = await fetch("/api/stripe/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: auth.currentUser.uid, billingPeriod: "monthly" }),
          });
          const json = await res.json();
          if (json.url) { window.location.href = json.url; return; }
        }
        router.push("/builder");
      } else {
        setVerifyError("Not verified yet — please click the link in your inbox.");
      }
    } catch {
      setVerifyError("Couldn't check verification. Please try again.");
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser || resendLoading) return;
    setResendLoading(true);
    setResendSent(false);
    try {
      await sendEmailVerification(auth.currentUser, {
        url: `${window.location.origin}/builder`,
      });
      setResendSent(true);
    } catch {
      setVerifyError("Failed to resend. Please try again shortly.");
    } finally {
      setResendLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSignup();
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--navy, #0d1b2e)",
      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
      padding: "40px 24px 60px", color: "#fdfcf9",
    }}>
      <div className="fade-up" style={{ maxWidth: 860, margin: "0 auto" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, margin: "0 auto 14px",
            background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="sparkle" size={22} color="#0d1b2e" strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, marginBottom: 6 }}>Start growing your bookings</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Choose a plan — upgrade or downgrade anytime.</p>
        </div>

        {fromGate && (
          <div style={{
            background: "rgba(46,212,160,0.08)", border: "1px solid rgba(46,212,160,0.2)",
            borderRadius: 12, padding: "12px 16px", marginBottom: 28,
            display: "flex", alignItems: "center", gap: 12, maxWidth: 480, margin: "0 auto 28px",
          }}>
            <Icon name="check" size={16} color="#2dd4a0" strokeWidth={2.5} />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
              Your package is ready — create an account to save it
            </span>
          </div>
        )}

        {/* Verify email step */}
        {step === "verify" && (
          <div style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: 22, margin: "0 auto 28px",
              background: "rgba(232,201,123,0.1)", border: "1px solid rgba(232,201,123,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon name="mail" size={30} color={SAND} strokeWidth={1.5} />
            </div>
            <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Verify your email</h2>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 6, lineHeight: 1.6 }}>
              We sent a verification link to
            </p>
            <p style={{ fontSize: 14, color: SAND, fontWeight: 600, marginBottom: 28 }}>{email}</p>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 32, lineHeight: 1.7 }}>
              Click the link in the email to verify your account. Once verified, come back here to continue.
            </p>

            {verifyError && (
              <p style={{ fontSize: 12, color: "#ef9090", marginBottom: 16 }}>{verifyError}</p>
            )}
            {resendSent && (
              <p style={{ fontSize: 12, color: SUCCESS, marginBottom: 16 }}>Verification email resent!</p>
            )}

            <button
              onClick={handleContinueAfterVerify}
              disabled={verifyLoading}
              style={{
                width: "100%", padding: "13px",
                background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
                border: "none", borderRadius: 12,
                fontSize: 14, fontWeight: 700, color: "#0d1b2e",
                fontFamily: "inherit", cursor: verifyLoading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                marginBottom: 14, opacity: verifyLoading ? 0.7 : 1,
              }}
            >
              {verifyLoading
                ? <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: "#0d1b2e" }} /> Checking…</>
                : "I've verified my email →"}
            </button>

            <button
              onClick={handleResendVerification}
              disabled={resendLoading}
              style={{
                background: "none", border: "none", fontSize: 13,
                color: resendLoading ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.4)",
                cursor: resendLoading ? "not-allowed" : "pointer", fontFamily: "inherit",
              }}
            >
              {resendLoading ? "Sending…" : "Resend verification email"}
            </button>

            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 24, lineHeight: 1.6 }}>
              Wrong email?{" "}
              <button
                onClick={() => setStep("form")}
                style={{ background: "none", border: "none", fontSize: 12, color: SAND, cursor: "pointer", fontFamily: "inherit" }}
              >
                Go back
              </button>
            </p>
          </div>
        )}

        {/* Link accounts step */}
        {step === "link" && linkPending && (
          <div style={{ maxWidth: 420, margin: "0 auto" }}>
            <div style={{
              background: "rgba(232,201,123,0.08)", border: "1px solid rgba(232,201,123,0.2)",
              borderRadius: 12, padding: "14px 16px", marginBottom: 20,
              fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5,
            }}>
              <strong style={{ color: SAND, display: "block", marginBottom: 4 }}>Account already exists</strong>
              <span style={{ color: "#fdfcf9" }}>{linkPending.email}</span> already has a PackMetrix account.
              Enter your password to link Google sign-in to it.
            </div>

            <input
              type="password"
              value={linkPassword}
              onChange={e => setLinkPassword(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleLinkAccount(); }}
              placeholder="Your existing password"
              style={{ ...inputStyle, marginBottom: 14 }}
              onFocus={e => (e.target.style.borderColor = `${SAND}70`)}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />

            {linkError && <p style={{ fontSize: 12, color: "#ef9090", marginBottom: 10 }}>{linkError}</p>}

            <button
              onClick={handleLinkAccount}
              disabled={linkLoading}
              style={{
                width: "100%", padding: "13px",
                background: linkLoading ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${SAND}, #c4a84f)`,
                border: "none", borderRadius: 12,
                fontSize: 14, fontWeight: 700,
                color: linkLoading ? "rgba(255,255,255,0.3)" : "#0d1b2e",
                fontFamily: "inherit", cursor: linkLoading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                marginBottom: 16,
              }}
            >
              {linkLoading
                ? <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: SAND }} /> Linking…</>
                : "Link Google & sign in"}
            </button>

            <button
              onClick={() => { setStep("form"); setLinkPending(null); setLinkPassword(""); setLinkError(null); }}
              style={{
                background: "none", border: "none", fontSize: 13,
                color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 6, margin: "0 auto",
              }}
            >
              <Icon name="arrow_left" size={14} color="rgba(255,255,255,0.4)" strokeWidth={2} />
              Back
            </button>
          </div>
        )}

        {/* Signup form step */}
        {step === "form" && (
          <>
            {/* Plan picker */}
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)", gap: 14, marginBottom: 36 }}>
              {PLANS.map(plan => {
                const isSelected = selectedPlan === plan.id;
                const isPro = plan.id === "pro";
                return (
                  <div
                    key={plan.id}
                    onClick={() => !plan.disabled && setSelectedPlan(plan.id)}
                    style={{
                      borderRadius: 18,
                      border: isSelected
                        ? `2px solid ${isPro ? SAND : "rgba(255,255,255,0.3)"}`
                        : "1px solid rgba(255,255,255,0.08)",
                      background: isSelected
                        ? isPro ? "rgba(232,201,123,0.07)" : "rgba(255,255,255,0.04)"
                        : "rgba(255,255,255,0.02)",
                      padding: "24px 22px",
                      cursor: plan.disabled ? "default" : "pointer",
                      position: "relative",
                      opacity: plan.disabled ? 0.55 : 1,
                      transition: "border 0.15s, background 0.15s",
                    }}
                  >
                    {plan.badge && (
                      <div style={{
                        position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
                        padding: "3px 12px", borderRadius: 99, fontSize: 10.5, fontWeight: 800,
                        background: plan.id === "agency" ? "rgba(255,255,255,0.08)" : SAND,
                        color: plan.id === "agency" ? "rgba(255,255,255,0.5)" : "#0a1426",
                        whiteSpace: "nowrap",
                      }}>{plan.badge}</div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: isSelected ? "#fff" : "rgba(255,255,255,0.6)", textTransform: "capitalize" }}>{plan.id}</div>
                      <div style={{
                        width: 16, height: 16, borderRadius: "50%",
                        border: `2px solid ${isSelected ? (isPro ? SAND : "rgba(255,255,255,0.6)") : "rgba(255,255,255,0.2)"}`,
                        background: isSelected ? (isPro ? SAND : "rgba(255,255,255,0.6)") : "transparent",
                        flexShrink: 0, marginTop: 1,
                      }} />
                    </div>

                    <div style={{ display: "flex", alignItems: "baseline", gap: 3, marginBottom: 16 }}>
                      <span style={{
                        fontFamily: "'DM Serif Display', serif", fontSize: 30,
                        color: isSelected ? (isPro ? SAND : "#fff") : "rgba(255,255,255,0.4)",
                        letterSpacing: "-0.6px",
                      }}>{plan.price}</span>
                      {plan.period && <span style={{ fontSize: 13, color: "rgba(255,255,255,0.3)" }}>{plan.period}</span>}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                      {plan.features.map((f, i) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12 }}>
                          <span style={{ color: isSelected ? SUCCESS : "rgba(255,255,255,0.25)", fontSize: 10 }}>✓</span>
                          <span style={{ color: isSelected ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.35)" }}>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Form area */}
            <div style={{ maxWidth: 420, margin: "0 auto" }}>

              {/* Google sign-up */}
              <button
                onClick={handleGoogleSignup}
                disabled={googleLoading}
                style={{
                  width: "100%", padding: "12px 16px",
                  background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 12, fontSize: 14, fontWeight: 600,
                  color: "rgba(255,255,255,0.85)", fontFamily: "inherit",
                  cursor: googleLoading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
                  marginBottom: 16, transition: "background 0.15s",
                }}
                onMouseEnter={e => { if (!googleLoading) (e.currentTarget.style.background = "rgba(255,255,255,0.1)"); }}
                onMouseLeave={e => { (e.currentTarget.style.background = "rgba(255,255,255,0.06)"); }}
              >
                {googleLoading
                  ? <span className="spinner" style={{ width: 18, height: 18, borderTopColor: SAND }} />
                  : <GoogleIcon />}
                Continue with Google
              </button>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>or sign up with email</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              </div>

              {/* Email/password fields */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                {[
                  { value: name, setter: setName, placeholder: "Your name or agency name", type: "text" },
                  { value: email, setter: setEmail, placeholder: "Work email", type: "email" },
                ].map((field, i) => (
                  <input
                    key={i}
                    type={field.type}
                    value={field.value}
                    onChange={e => field.setter(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={field.placeholder}
                    style={inputStyle}
                    onFocus={e => (e.target.style.borderColor = `${SAND}70`)}
                    onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                  />
                ))}
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Create a password"
                    style={{
                      ...inputStyle,
                      borderColor: passwordTouched && !passwordValid ? "#ef9090" : undefined,
                    }}
                    onFocus={e => (e.target.style.borderColor = passwordTouched && !passwordValid ? "#ef9090" : `${SAND}70`)}
                    onBlur={e => (e.target.style.borderColor = passwordTouched && !passwordValid ? "#ef9090" : "rgba(255,255,255,0.1)")}
                  />
                  <p style={{
                    fontSize: 11.5, marginTop: 6, marginLeft: 2,
                    color: passwordTouched && !passwordValid ? "#ef9090" : "rgba(255,255,255,0.25)",
                  }}>
                    {passwordTouched && password.length > 64
                      ? "Password must be 64 characters or fewer."
                      : "8–64 characters."}
                  </p>
                </div>
                <div>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Confirm password"
                    style={{
                      ...inputStyle,
                      borderColor: confirmTouched && !passwordsMatch ? "#ef9090" : undefined,
                    }}
                    onFocus={e => (e.target.style.borderColor = confirmTouched && !passwordsMatch ? "#ef9090" : `${SAND}70`)}
                    onBlur={e => (e.target.style.borderColor = confirmTouched && !passwordsMatch ? "#ef9090" : "rgba(255,255,255,0.1)")}
                  />
                  {confirmTouched && !passwordsMatch && (
                    <p style={{ fontSize: 11.5, marginTop: 6, marginLeft: 2, color: "#ef9090" }}>
                      Passwords don't match.
                    </p>
                  )}
                </div>
              </div>

              {error && <p style={{ fontSize: 12, color: "#ef9090", marginBottom: 10 }}>{error}</p>}

              <button
                onClick={handleSignup}
                disabled={loading || !valid}
                style={{
                  width: "100%", padding: "13px",
                  background: !valid ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${SAND}, #c4a84f)`,
                  border: "none", borderRadius: 12,
                  fontSize: 14, fontWeight: 700,
                  color: !valid ? "rgba(255,255,255,0.25)" : "#0d1b2e",
                  fontFamily: "inherit", cursor: !valid ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  transition: "all 0.2s",
                }}
              >
                {loading ? (
                  <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: SAND }} /> Creating account…</>
                ) : selectedPlan === "pro" ? "Create account & go Pro →" : "Create free account"}
              </button>

              {selectedPlan === "pro" && (
                <p style={{ textAlign: "center", fontSize: 11.5, color: "rgba(255,255,255,0.3)", marginTop: 10 }}>
                  You'll be redirected to Stripe to complete payment. Cancel anytime.
                </p>
              )}

              <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 14, lineHeight: 1.6 }}>
                By signing up you agree to our Terms & Privacy Policy.
              </p>
              <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
                Already have an account?{" "}
                <a href="/login" style={{ color: SAND, fontWeight: 600, textDecoration: "none" }}>Log in</a>
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={null}>
      <SignupPageInner />
    </Suspense>
  );
}
