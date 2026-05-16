"use client";

import { useState, Suspense } from "react";
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
import { TRIAL_DAYS, trialEndsAtFromNow } from "@/lib/trial";

const SAND = "#e8c97b";
const SUCCESS = "#2dd4a0";

type Step = "form" | "verify" | "link";

const TRIAL_INCLUDES = [
  "Up to 30 packages",
  "All templates",
  "Full analytics + CSV export",
  "Lead inbox + export",
  "Custom domain + SSL",
  "2 users",
  "Priority email support",
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
  const searchParams = useSearchParams();
  const fromGate = searchParams.get("from") === "gate";

  const [step, setStep] = useState<Step>("form");
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

  const [linkPending, setLinkPending] = useState<{ credential: OAuthCredential; email: string } | null>(null);
  const [linkPassword, setLinkPassword] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const passwordTouched = password.length > 0;
  const passwordValid = password.length >= 8 && password.length <= 64;
  const confirmTouched = confirmPassword.length > 0;
  const passwordsMatch = password === confirmPassword;
  const valid = name.trim() && email.trim() && passwordValid && passwordsMatch && confirmTouched;

  const newUserDoc = (uid: string, userEmail: string | null, displayName?: string) => ({
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
      posthog.captureException(err);
      setError(friendlyError(err?.code) || err?.message || "Signup failed. Please try again.");
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
      setError(friendlyError(err?.code) || "Google sign-in failed. Please try again.");
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
      setLinkError(friendlyError(err?.code) || "Failed to link accounts. Please check your password.");
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
      await sendEmailVerification(auth.currentUser, { url: `${window.location.origin}/builder` });
      setResendSent(true);
    } catch {
      setVerifyError("Failed to resend. Please try again shortly.");
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--navy, #0d1b2e)",
      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "40px 24px 60px", color: "#fdfcf9",
    }}>
      <div className="fade-up" style={{ width: "100%", maxWidth: 880, display: "grid", gridTemplateColumns: step === "form" ? "1fr 1fr" : "1fr", gap: 40, alignItems: "start" }}>

        {/* ── Left: trial pitch (form step only) ── */}
        {step === "form" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 32 }}>
              <img src="/logo.svg" alt="PackMetrix" style={{ width: 28, height: 28 }} />
              <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.3px" }}>
                Pack<em style={{ color: SAND, fontStyle: "normal" }}>metrix</em>
              </span>
            </div>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: `${SAND}18`, border: `1px solid ${SAND}35`, borderRadius: 99, padding: "4px 12px", fontSize: 11.5, fontWeight: 600, color: SAND, marginBottom: 20 }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: SUCCESS, display: "inline-block" }} />
              {TRIAL_DAYS}-day free trial
            </div>

            <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 400, lineHeight: 1.12, letterSpacing: "-0.8px", marginBottom: 14 }}>
              Try the full product,{" "}
              <em style={{ color: SAND, fontStyle: "italic" }}>free for {TRIAL_DAYS} days</em>
            </h1>

            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 28 }}>
              No credit card required. Get full access to everything — then choose a plan that fits your agency once you've seen the results.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".7px", color: "rgba(255,255,255,0.3)", marginBottom: 12 }}>
                What's included in your trial
              </div>
              {TRIAL_INCLUDES.map((f) => (
                <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ width: 20, height: 20, borderRadius: 6, background: `${SUCCESS}18`, border: `1px solid ${SUCCESS}30`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <span style={{ color: SUCCESS, fontSize: 10, fontWeight: 700 }}>✓</span>
                  </div>
                  <span style={{ fontSize: 13, color: "rgba(255,255,255,0.7)" }}>{f}</span>
                </div>
              ))}
            </div>

            {fromGate && (
              <div style={{ background: `${SUCCESS}10`, border: `1px solid ${SUCCESS}25`, borderRadius: 10, padding: "10px 14px", marginTop: 20, display: "flex", alignItems: "center", gap: 10 }}>
                <Icon name="check" size={14} color={SUCCESS} strokeWidth={2.5} />
                <span style={{ fontSize: 12.5, color: "rgba(255,255,255,0.65)" }}>Your package is ready — create an account to save it</span>
              </div>
            )}
          </div>
        )}

        {/* ── Right: form / verify / link ── */}
        <div>

          {/* Verify email */}
          {step === "verify" && (
            <div style={{ maxWidth: 420, margin: "0 auto", textAlign: "center" }}>
              <div style={{ width: 72, height: 72, borderRadius: 22, margin: "0 auto 28px", background: `${SAND}15`, border: `1px solid ${SAND}25`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Icon name="mail" size={30} color={SAND} strokeWidth={1.5} />
              </div>
              <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 10 }}>Verify your email</h2>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginBottom: 6, lineHeight: 1.6 }}>We sent a link to</p>
              <p style={{ fontSize: 14, color: SAND, fontWeight: 600, marginBottom: 28 }}>{email}</p>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 32, lineHeight: 1.7 }}>
                Click the link to verify, then come back here. Your {TRIAL_DAYS}-day trial starts immediately.
              </p>
              {verifyError && <p style={{ fontSize: 12, color: "#ef9090", marginBottom: 16 }}>{verifyError}</p>}
              {resendSent && <p style={{ fontSize: 12, color: SUCCESS, marginBottom: 16 }}>Verification email resent!</p>}
              <button onClick={handleContinueAfterVerify} disabled={verifyLoading} style={{ width: "100%", padding: "13px", background: `linear-gradient(135deg, ${SAND}, #c4a84f)`, border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, color: "#0d1b2e", fontFamily: "inherit", cursor: verifyLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 14, opacity: verifyLoading ? 0.7 : 1 }}>
                {verifyLoading ? <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: "#0d1b2e" }} /> Checking…</> : "I've verified my email →"}
              </button>
              <button onClick={handleResendVerification} disabled={resendLoading} style={{ background: "none", border: "none", fontSize: 13, color: resendLoading ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.4)", cursor: resendLoading ? "not-allowed" : "pointer", fontFamily: "inherit" }}>
                {resendLoading ? "Sending…" : "Resend verification email"}
              </button>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.2)", marginTop: 24 }}>
                Wrong email?{" "}
                <button onClick={() => setStep("form")} style={{ background: "none", border: "none", fontSize: 12, color: SAND, cursor: "pointer", fontFamily: "inherit" }}>Go back</button>
              </p>
            </div>
          )}

          {/* Link accounts */}
          {step === "link" && linkPending && (
            <div style={{ maxWidth: 420, margin: "0 auto" }}>
              <div style={{ background: `${SAND}10`, border: `1px solid ${SAND}25`, borderRadius: 12, padding: "14px 16px", marginBottom: 20, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5 }}>
                <strong style={{ color: SAND, display: "block", marginBottom: 4 }}>Account already exists</strong>
                <span style={{ color: "#fdfcf9" }}>{linkPending.email}</span> already has a PackMetrix account. Enter your password to link Google sign-in to it.
              </div>
              <input type="password" value={linkPassword} onChange={e => setLinkPassword(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleLinkAccount(); }} placeholder="Your existing password" style={{ ...inputStyle, marginBottom: 14 }} onFocus={e => (e.target.style.borderColor = `${SAND}70`)} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
              {linkError && <p style={{ fontSize: 12, color: "#ef9090", marginBottom: 10 }}>{linkError}</p>}
              <button onClick={handleLinkAccount} disabled={linkLoading} style={{ width: "100%", padding: "13px", background: linkLoading ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${SAND}, #c4a84f)`, border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, color: linkLoading ? "rgba(255,255,255,0.3)" : "#0d1b2e", fontFamily: "inherit", cursor: linkLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 16 }}>
                {linkLoading ? <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: SAND }} /> Linking…</> : "Link Google & sign in"}
              </button>
              <button onClick={() => { setStep("form"); setLinkPending(null); setLinkPassword(""); setLinkError(null); }} style={{ background: "none", border: "none", fontSize: 13, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", gap: 6, margin: "0 auto" }}>
                <Icon name="arrow_left" size={14} color="rgba(255,255,255,0.4)" strokeWidth={2} /> Back
              </button>
            </div>
          )}

          {/* Signup form */}
          {step === "form" && (
            <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 20, padding: "32px 28px" }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 6 }}>Create your account</h2>
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginBottom: 24 }}>No credit card required</p>

              <button onClick={handleGoogleSignup} disabled={googleLoading} style={{ width: "100%", padding: "12px 16px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 12, fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.85)", fontFamily: "inherit", cursor: googleLoading ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16, transition: "background 0.15s" }} onMouseEnter={e => { if (!googleLoading) e.currentTarget.style.background = "rgba(255,255,255,0.1)"; }} onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}>
                {googleLoading ? <span className="spinner" style={{ width: 18, height: 18, borderTopColor: SAND }} /> : <GoogleIcon />}
                Continue with Google
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>or sign up with email</span>
                <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
                {[
                  { value: name, setter: setName, placeholder: "Your name or agency name", type: "text" },
                  { value: email, setter: setEmail, placeholder: "Work email", type: "email" },
                ].map((field, i) => (
                  <input key={i} type={field.type} value={field.value} onChange={e => field.setter(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleSignup(); }} placeholder={field.placeholder} style={inputStyle} onFocus={e => (e.target.style.borderColor = `${SAND}70`)} onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")} />
                ))}
                <div>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleSignup(); }} placeholder="Create a password" style={{ ...inputStyle, borderColor: passwordTouched && !passwordValid ? "#ef9090" : undefined }} onFocus={e => (e.target.style.borderColor = passwordTouched && !passwordValid ? "#ef9090" : `${SAND}70`)} onBlur={e => (e.target.style.borderColor = passwordTouched && !passwordValid ? "#ef9090" : "rgba(255,255,255,0.1)")} />
                  <p style={{ fontSize: 11.5, marginTop: 5, color: passwordTouched && !passwordValid ? "#ef9090" : "rgba(255,255,255,0.25)" }}>
                    {passwordTouched && password.length > 64 ? "Max 64 characters." : "8–64 characters."}
                  </p>
                </div>
                <div>
                  <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} onKeyDown={e => { if (e.key === "Enter") handleSignup(); }} placeholder="Confirm password" style={{ ...inputStyle, borderColor: confirmTouched && !passwordsMatch ? "#ef9090" : undefined }} onFocus={e => (e.target.style.borderColor = confirmTouched && !passwordsMatch ? "#ef9090" : `${SAND}70`)} onBlur={e => (e.target.style.borderColor = confirmTouched && !passwordsMatch ? "#ef9090" : "rgba(255,255,255,0.1)")} />
                  {confirmTouched && !passwordsMatch && <p style={{ fontSize: 11.5, marginTop: 5, color: "#ef9090" }}>Passwords don't match.</p>}
                </div>
              </div>

              {error && <p style={{ fontSize: 12, color: "#ef9090", marginBottom: 10 }}>{error}</p>}

              <button onClick={handleSignup} disabled={loading || !valid} style={{ width: "100%", padding: "13px", background: !valid ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${SAND}, #c4a84f)`, border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700, color: !valid ? "rgba(255,255,255,0.25)" : "#0d1b2e", fontFamily: "inherit", cursor: !valid ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8, transition: "all 0.2s" }}>
                {loading ? <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: SAND }} /> Creating account…</> : `Start ${TRIAL_DAYS}-day free trial →`}
              </button>

              <p style={{ textAlign: "center", fontSize: 11.5, color: "rgba(255,255,255,0.25)", marginTop: 12, lineHeight: 1.6 }}>
                By signing up you agree to our Terms & Privacy Policy.
              </p>
              <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
                Already have an account?{" "}
                <a href="/login" style={{ color: SAND, fontWeight: 600, textDecoration: "none" }}>Log in</a>
              </p>
            </div>
          )}
        </div>
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
