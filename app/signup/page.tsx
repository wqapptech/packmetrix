"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import Icon from "@/components/Icon";

const SAND = "#e8c97b";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromGate = searchParams.get("from") === "gate";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = name.trim() && email.trim() && password.trim();

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
        aiLimit: 10,
        stripeCustomerId: null,
        createdAt: Date.now(),
      });
      router.push("/builder");
    } catch (err: any) {
      setError(err?.message || "Signup failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSignup();
  };

  return (
    <div style={{
      minHeight: "100vh", background: "var(--navy, #0d1b2e)",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif",
      padding: 24, color: "#fdfcf9",
    }}>
      <div className="fade-up" style={{ width: 440 }}>
        {/* "From gate" context banner */}
        {fromGate && (
          <div style={{
            background: "rgba(46,212,160,0.08)", border: "1px solid rgba(46,212,160,0.2)",
            borderRadius: 12, padding: "12px 16px", marginBottom: 24,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <Icon name="check" size={16} color="#2dd4a0" strokeWidth={2.5} />
            <span style={{ fontSize: 13, color: "rgba(255,255,255,0.65)" }}>
              Your package is ready — create an account to save it
            </span>
          </div>
        )}

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, margin: "0 auto 14px",
            background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <Icon name="sparkle" size={22} color="#0d1b2e" strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 6 }}>Start for free</h1>
          <p style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>No credit card required. 3 packages free.</p>
        </div>

        {/* Free plan badge */}
        <div style={{
          background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 14, padding: "14px 18px", marginBottom: 22,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "rgba(255,255,255,0.75)", marginBottom: 2 }}>Free Plan</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>3 packages · Basic analytics · Lead tracking</div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, color: SAND }}>€0</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 16 }}>
          {[
            { value: name, setter: setName, placeholder: "Your name or agency name", type: "text" },
            { value: email, setter: setEmail, placeholder: "Work email", type: "email" },
            { value: password, setter: setPassword, placeholder: "Create a password", type: "password" },
          ].map((field, i) => (
            <input
              key={i}
              type={field.type}
              value={field.value}
              onChange={e => field.setter(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={field.placeholder}
              style={{
                width: "100%", padding: "12px 16px",
                background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 12, color: "#fdfcf9",
                fontSize: 14, fontFamily: "inherit", outline: "none",
              }}
              onFocus={e => (e.target.style.borderColor = `${SAND}70`)}
              onBlur={e => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
            />
          ))}
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
          ) : "Create free account"}
        </button>

        <p style={{ textAlign: "center", fontSize: 12, color: "rgba(255,255,255,0.25)", marginTop: 14, lineHeight: 1.6 }}>
          By signing up you agree to our Terms & Privacy Policy.
        </p>
        <p style={{ textAlign: "center", fontSize: 13, color: "rgba(255,255,255,0.35)", marginTop: 8 }}>
          Already have an account?{" "}
          <a href="/login" style={{ color: SAND, fontWeight: 600, textDecoration: "none" }}>
            Log in
          </a>
        </p>
      </div>
    </div>
  );
}
