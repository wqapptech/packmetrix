"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import Icon from "@/components/Icon";
import posthog from "posthog-js";

const SAND = "#e8c97b";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill in all fields."); return; }
    setLoading(true);
    setError(null);
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      posthog.identify(userCred.user.uid, { email: userCred.user.email });
      posthog.capture("user_logged_in", { email: userCred.user.email });
      router.push("/builder");
    } catch (err: any) {
      posthog.capture("login_failed", { error_code: err?.code });
      posthog.captureException(err);
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
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
            <Icon name="sparkle" size={22} color="#0d1b2e" strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Welcome back</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>Sign in to your PackMetrics account</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Email address"
            style={{
              width: "100%", padding: "12px 16px",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, color: "#fdfcf9",
              fontSize: 14, fontFamily: "inherit", outline: "none",
            }}
            onFocus={e => (e.target.style.borderColor = `${SAND}70`)}
            onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
          />
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Password"
            style={{
              width: "100%", padding: "12px 16px",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12, color: "#fdfcf9",
              fontSize: 14, fontFamily: "inherit", outline: "none",
            }}
            onFocus={e => (e.target.style.borderColor = `${SAND}70`)}
            onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
          />
        </div>

        {error && <p style={{ fontSize: 12, color: "#ef9090", marginBottom: 10 }}>{error}</p>}

        <div style={{ textAlign: "right", marginBottom: 16 }}>
          <button style={{ background: "none", border: "none", fontSize: 12, color: SAND, cursor: "pointer", fontFamily: "inherit" }}>
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
      </div>
    </div>
  );
}
