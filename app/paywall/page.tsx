"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";

const SAND = "#e8c97b";
const SUCCESS = "#2dd4a0";

function Stat({ v, l, sub }: { v: string; l: string; sub?: string }) {
  return (
    <div>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 32, color: SAND, letterSpacing: "-0.6px", lineHeight: 1 }}>{v}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", marginTop: 6, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".4px" }}>{l}</div>
      {sub && <div style={{ fontSize: 10.5, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function UnlockRow({ icon, title, sub }: { icon: string; title: string; sub?: string }) {
  return (
    <div style={{ display: "flex", gap: 11, alignItems: "flex-start", padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ width: 28, height: 28, borderRadius: 8, background: "rgba(232,201,123,0.13)", color: SAND, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, flexShrink: 0 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

export default function PaywallPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [packageCount, setPackageCount] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUserId(u.uid);
      const snap = await getDocs(query(collection(db, "packages"), where("userId", "==", u.uid)));
      const pkgs = snap.docs.map(d => d.data());
      setPackageCount(pkgs.length);
      setTotalViews(pkgs.reduce((a, p) => a + (p.views || 0), 0));
      setTotalClicks(pkgs.reduce((a, p) => a + (p.whatsappClicks || 0) + (p.messengerClicks || 0), 0));
    });
    return () => unsub();
  }, [router]);

  const handleUpgrade = async () => {
    if (!userId) { router.push("/login"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } catch (err) {
      console.error("Checkout error", err);
    } finally {
      setLoading(false);
    }
  };

  const estRevenue = totalClicks * 150;

  return (
    <AppLayout>
      <div style={{ padding: "28px 32px 60px", maxWidth: 1240 }}>

        {/* Page head */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.4px" }}>Billing</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
            Free plan · {packageCount} of 3 packages used
          </div>
        </div>

        {/* Hero paywall card */}
        <div style={{
          background: "linear-gradient(160deg, rgba(232,201,123,0.06), rgba(11,20,36,0.6))",
          border: "1px solid rgba(232,201,123,0.22)",
          borderRadius: 24, padding: "40px 44px", position: "relative", overflow: "hidden",
          marginBottom: 20,
        }}>
          {/* Dot pattern */}
          <svg style={{ position: "absolute", inset: 0, opacity: 0.07, pointerEvents: "none" }} width="100%" height="100%">
            <pattern id="pwgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <circle cx="20" cy="20" r="1" fill={SAND} />
            </pattern>
            <rect width="100%" height="100%" fill="url(#pwgrid)" />
          </svg>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 48, position: "relative" }}>
            {/* Left */}
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 12px", borderRadius: 99, background: "rgba(45,212,160,0.13)", border: "1px solid rgba(45,212,160,0.3)", color: SUCCESS, fontSize: 11.5, fontWeight: 700, marginBottom: 24 }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: SUCCESS, display: "inline-block" }} />
                You&apos;re getting results
              </div>

              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 48, lineHeight: 1.05, letterSpacing: "-1px", marginBottom: 16 }}>
                You&apos;re already getting <em style={{ color: SAND, fontStyle: "italic" }}>leads.</em><br />
                Now scale this.
              </h1>

              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.65, maxWidth: 480, marginBottom: 32 }}>
                {packageCount > 0
                  ? <>You&apos;ve shipped {packageCount} package{packageCount !== 1 ? "s" : ""}, racked up {totalViews.toLocaleString()} views, and driven {totalClicks} WhatsApp conversations. That&apos;s <b style={{ color: "#fff" }}>€{estRevenue.toLocaleString()} in potential revenue</b> — and you&apos;re on the free plan.</>
                  : "Start your first package and watch your leads roll in. Upgrade to Pro for unlimited packages, AI image generation, and advanced analytics."
                }
              </p>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 32 }}>
                <Stat v={String(packageCount)} l="Packages live" sub="Free limit: 3" />
                <Stat v={totalClicks.toLocaleString()} l="Leads generated" />
                <Stat v={totalViews > 0 ? `${((totalClicks / totalViews) * 100).toFixed(1)}%` : "—"} l="Conversion" sub="Industry avg: 0.9%" />
                <Stat v={`€${estRevenue.toLocaleString()}`} l="Revenue (est.)" />
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 14 }}>
                <button
                  onClick={handleUpgrade}
                  disabled={loading}
                  style={{
                    display: "inline-flex", alignItems: "center", gap: 8,
                    padding: "14px 28px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                    background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
                    color: "#0a1426", border: "none", cursor: loading ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {loading
                    ? <><span className="spinner" style={{ width: 15, height: 15, borderTopColor: "#0a1426" }} /> Redirecting…</>
                    : "✦ Upgrade to Pro · €29/mo"
                  }
                </button>
                <button onClick={() => router.back()} style={{ padding: "14px 22px", borderRadius: 10, background: "none", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.6)", fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                  Maybe later
                </button>
              </div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>
                Cancel anytime · 7-day refund · billed monthly
              </div>
            </div>

            {/* Right — unlock list */}
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: ".7px", fontWeight: 700, marginBottom: 16 }}>What unlocks with Pro</div>
              <UnlockRow icon="∞" title="Unlimited packages" sub={`You're at ${packageCount}/3 today`} />
              <UnlockRow icon="✦" title="Unlimited AI optimization" sub="Currently 5 uses left" />
              <UnlockRow icon="🎯" title="Goal-driven A/B tests" sub="Run 3 variants automatically" />
              <UnlockRow icon="📊" title="Advanced analytics" sub="UTM, cohort, attribution · 90 days" />
              <UnlockRow icon="🌍" title="Multi-language landing pages" sub="EN + AR + 6 more" />
              <UnlockRow icon="↗" title="Custom domain" sub="book.youragency.com" />
              <UnlockRow icon="💬" title="WhatsApp Business API" sub="Auto-reply, templates" />
              <UnlockRow icon="👤" title="Up to 5 team seats" />
            </div>
          </div>
        </div>

        {/* Usage bar */}
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>Free plan usage</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                {packageCount} of 3 packages · 5 of 10 AI optimizations
              </div>
            </div>
            <button onClick={handleUpgrade} style={{ padding: "7px 14px", borderRadius: 8, background: "none", border: `1px solid ${SAND}50`, color: SAND, fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
              Upgrade to Pro →
            </button>
          </div>
          <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
            <div style={{ height: "100%", width: `${Math.min((packageCount / 3) * 100, 100)}%`, background: `linear-gradient(90deg, ${SAND}, ${SUCCESS})`, borderRadius: 99, transition: "width .8s" }} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
