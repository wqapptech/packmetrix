"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  linkWithCredential,
  OAuthCredential,
} from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Icon from "@/components/Icon";
import posthog from "posthog-js";
import { FREE_AI_LIMIT } from "@/lib/limits";

const SAND = "#e8c97b";
const SUCCESS = "#2dd4a0";

type View = "login" | "forgot" | "link";

function friendlyError(code: string): string {
  switch (code) {
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential": return "Incorrect email or password.";
    case "auth/invalid-email": return "Please enter a valid email address.";
    case "auth/too-many-requests": return "Too many attempts. Please try again later.";
    case "auth/popup-closed-by-user": return "";
    default: return "";
  }
}

const inputStyle: React.CSSProperties = {
  width: "100%", padding: "12px 16px",
  background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
  borderRadius: 12, color: "#fdfcf9",
  fontSize: 14, fontFamily: "inherit", outline: "none",
};

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0 }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const [view, setView] = useState<View>("login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot password state
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetError, setResetError] = useState<string | null>(null);

  // Account linking state (Google sign-in with existing email/password account)
  const [linkPending, setLinkPending] = useState<{ credential: OAuthCredential; email: string } | null>(null);
  const [linkPassword, setLinkPassword] = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    setError(null);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      if (!userCred.user.emailVerified) {
        await sendEmailVerification(userCred.user, {
          url: `${window.location.origin}/builder`,
        });
        await signOut(auth);
        setError("Please verify your email before signing in. We've sent a new verification link to your inbox.");
        return;
      }
      posthog.identify(userCred.user.uid, { email: userCred.user.email });
      posthog.capture("user_logged_in", { email: userCred.user.email });
      router.push("/builder");
    } catch (err: any) {
      posthog.capture("login_failed", { error_code: err?.code });
      posthog.captureException(err);
      const msg = friendlyError(err?.code);
      setError(msg || err?.message || "Login failed. Please try again.");
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
      if (!snap.exists()) {
        await setDoc(docRef, {
          email: user.email,
          name: user.displayName || "",
          plan: "free",
          aiUsage: 0,
          aiLimit: FREE_AI_LIMIT,
          stripeCustomerId: null,
          createdAt: Date.now(),
        });
        posthog.capture("user_signed_up", { method: "google", email: user.email });
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
          setView("link");
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

  const handleForgotPassword = async () => {
    if (!resetEmail.trim()) { setResetError("Please enter your email address."); return; }
    setResetLoading(true);
    setResetError(null);
    try {
      await sendPasswordResetEmail(auth, resetEmail, {
        url: `${window.location.origin}/login`,
      });
      setResetSent(true);
    } catch (err: any) {
      const msg = friendlyError(err?.code);
      setResetError(msg || "Failed to send reset email. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--navy, #0d1b2e)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
      padding: 24, color: "#fdfcf9",
    }}>
      <div className="fade-up" style={{ width: "100%", maxWidth: 400 }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, margin: "0 auto 14px",
            background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name={view === "forgot" ? "lock" : "sparkle"} size={22} color="#0d1b2e" strokeWidth={2} />
          </div>
          {view === "login" ? (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Welcome back</h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Sign in to your PackMetrix account</p>
            </>
          ) : view === "link" ? (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Link Google account</h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Connect Google to your existing account</p>
            </>
          ) : (
            <>
              <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Reset password</h1>
              <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>We'll send a reset link to your inbox</p>
            </>
          )}
        </div>

        {/* Login view */}
        {view === "login" && (
          <>
            {/* Google sign-in */}
            <button
              onClick={handleGoogleLogin}
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
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.25)", whiteSpace: "nowrap" }}>or sign in with email</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Email address"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = `${SAND}70`)}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Password"
                style={inputStyle}
                onFocus={e => (e.target.style.borderColor = `${SAND}70`)}
                onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
              />
            </div>

            {error && <p style={{ fontSize: 12, color: "#ef9090", marginBottom: 10 }}>{error}</p>}

            <div style={{ textAlign: "right", marginBottom: 16 }}>
              <button
                onClick={() => { setView("forgot"); setResetEmail(email); setError(null); }}
                style={{ background: "none", border: "none", fontSize: 12, color: SAND, cursor: "pointer", fontFamily: "inherit" }}
              >
                Forgot password?
              </button>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{
                width: "100%", padding: "13px",
                background: loading ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${SAND}, #c4a84f)`,
                border: "none", borderRadius: 12,
                fontSize: 14, fontWeight: 700,
                color: loading ? "rgba(255,255,255,0.3)" : "#0d1b2e",
                fontFamily: "inherit", cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
              }}
            >
              {loading ? (
                <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: SAND }} /> Signing in…</>
              ) : "Sign in"}
            </button>

            <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 20 }}>
              No account yet?{" "}
              <a href="/signup" style={{ color: SAND, fontWeight: 600, textDecoration: "none" }}>
                Sign up free
              </a>
            </p>
          </>
        )}

        {/* Forgot password view */}
        {view === "forgot" && (
          <>
            {!resetSent ? (
              <>
                <input
                  type="email"
                  value={resetEmail}
                  onChange={e => setResetEmail(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") handleForgotPassword(); }}
                  placeholder="Your email address"
                  style={{ ...inputStyle, marginBottom: 14 }}
                  onFocus={e => (e.target.style.borderColor = `${SAND}70`)}
                  onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                />

                {resetError && <p style={{ fontSize: 12, color: "#ef9090", marginBottom: 12 }}>{resetError}</p>}

                <button
                  onClick={handleForgotPassword}
                  disabled={resetLoading}
                  style={{
                    width: "100%", padding: "13px",
                    background: resetLoading ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${SAND}, #c4a84f)`,
                    border: "none", borderRadius: 12,
                    fontSize: 14, fontWeight: 700,
                    color: resetLoading ? "rgba(255,255,255,0.3)" : "#0d1b2e",
                    fontFamily: "inherit", cursor: resetLoading ? "not-allowed" : "pointer",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                    marginBottom: 16,
                  }}
                >
                  {resetLoading ? (
                    <><span className="spinner" style={{ width: 16, height: 16, borderTopColor: SAND }} /> Sending…</>
                  ) : "Send reset link"}
                </button>
              </>
            ) : (
              <div style={{
                background: "rgba(46,212,160,0.08)", border: "1px solid rgba(46,212,160,0.2)",
                borderRadius: 12, padding: "16px 20px", marginBottom: 20,
                display: "flex", alignItems: "flex-start", gap: 12,
              }}>
                <div style={{ marginTop: 2 }}><Icon name="check" size={16} color={SUCCESS} strokeWidth={2.5} /></div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#fdfcf9", marginBottom: 4 }}>Reset link sent</p>
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.5 }}>
                    Check <span style={{ color: SAND }}>{resetEmail}</span> for a link to reset your password.
                  </p>
                </div>
              </div>
            )}

            <button
              onClick={() => { setView("login"); setResetSent(false); setResetError(null); }}
              style={{
                background: "none", border: "none", fontSize: 13,
                color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 6, margin: "0 auto",
              }}
            >
              <Icon name="arrow_left" size={14} color="rgba(255,255,255,0.4)" strokeWidth={2} />
              Back to sign in
            </button>
          </>
        )}

        {/* Link accounts view */}
        {view === "link" && linkPending && (
          <>
            <div style={{
              background: "rgba(232,201,123,0.08)", border: "1px solid rgba(232,201,123,0.2)",
              borderRadius: 12, padding: "14px 16px", marginBottom: 20,
              fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.5,
            }}>
              <strong style={{ color: SAND, display: "block", marginBottom: 4 }}>Account already exists</strong>
              <span style={{ color: "#fdfcf9" }}>{linkPending.email}</span> already has a PackMetrics account.
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
              onClick={() => { setView("login"); setLinkPending(null); setLinkPassword(""); setLinkError(null); }}
              style={{
                background: "none", border: "none", fontSize: 13,
                color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "inherit",
                display: "flex", alignItems: "center", gap: 6, margin: "0 auto",
              }}
            >
              <Icon name="arrow_left" size={14} color="rgba(255,255,255,0.4)" strokeWidth={2} />
              Back to sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
}
