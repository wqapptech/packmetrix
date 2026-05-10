"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import Icon from "@/components/Icon";

const SAND = "#e8c97b";
const SUCCESS = "#2dd4a0";

type PlanId = "free" | "pro" | "agency";

const PLANS: { id: PlanId; price: string; period: string; badge?: string; features: string[]; cta: string; disabled?: boolean }[] = [
  {
    id: "free",
    price: "€0",
    period: "",
    features: ["1 package", "Basic analytics", "Lead tracking", "WhatsApp & Messenger CTA"],
    cta: "Start free",
  },
  {
    id: "pro",
    price: "€29",
    period: "/mo",
    badge: "Most popular",
    features: ["Unlimited packages", "AI content writer", "AI image generation", "Promo video creator", "Analytics per package", "Lead inbox", "Arabic + English pages", "Pexels photo library"],
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

function SignupPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromGate = searchParams.get("from") === "gate";

  const [selectedPlan, setSelectedPlan] = useState<PlanId>("free");
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
      if (selectedPlan === "pro") {
        // Send to Stripe immediately after account creation
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: userCred.user.uid, billingPeriod: "monthly" }),
        });
        const json = await res.json();
        if (json.url) { window.location.href = json.url; return; }
      }
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

        {/* Plan picker */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 36 }}>
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

                {/* Radio dot */}
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

        {/* Signup form */}
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
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
