"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";
import { useLang } from "@/hooks/useLang";
import { useIsMobile } from "@/hooks/useIsMobile";
import posthog from "posthog-js";
import { isTrialActive, trialDaysLeft } from "@/lib/trial";

const SAND = "#e8c97b";
const SUCCESS = "#2dd4a0";

type PlanKey = "start" | "grow" | "scale";

const MONTHLY = { start: 29, grow: 79, scale: 179 };
const ANNUAL_MONTHLY = { start: 23, grow: 63, scale: 143 };
const ANNUAL_TOTAL = { start: 276, grow: 756, scale: 1716 };

const PLAN_FEATURES: Record<PlanKey, { label: string; included: boolean; soon?: boolean }[]> = {
  start: [
    { label: "10 package pages", included: true },
    { label: "2 templates", included: true },
    { label: "Lead inbox (WhatsApp & Messenger)", included: true },
    { label: "30-day analytics history", included: true },
    { label: "All templates", included: false },
    { label: "Lead export (CSV)", included: false },
    { label: "Custom domain", included: false },
  ],
  grow: [
    { label: "30 package pages", included: true },
    { label: "All templates", included: true },
    { label: "Lead inbox (WhatsApp & Messenger)", included: true },
    { label: "Unlimited analytics history", included: true },
    { label: "Lead export (CSV)", included: true },
    { label: "Custom domain", included: true },
    { label: "Mobile app", included: false, soon: true },
  ],
  scale: [
    { label: "Unlimited package pages", included: true },
    { label: "All templates", included: true },
    { label: "Lead inbox (WhatsApp & Messenger)", included: true },
    { label: "Unlimited analytics history", included: true },
    { label: "Lead export (CSV)", included: true },
    { label: "Custom domain", included: true },
    { label: "Mobile app", included: true, soon: true },
  ],
};

function parsePackagePrice(s: string): number {
  const n = parseFloat(s.replace(/[^\d.]/g, ""));
  return n > 10 ? n : 0;
}

function Stat({ v, l, sub }: { v: string; l: string; sub?: string }) {
  return (
    <div>
      <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: SAND, letterSpacing: "-0.5px", lineHeight: 1 }}>{v}</div>
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.5)", marginTop: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".4px" }}>{l}</div>
      {sub && <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function FeatureRow({ label, included, soon }: { label: string; included: boolean; soon?: boolean }) {
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "center", padding: "6px 0", opacity: included ? 1 : 0.35 }}>
      <div style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
        background: included ? `${SAND}22` : "rgba(255,255,255,0.05)",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 9, color: included ? SAND : "rgba(255,255,255,0.25)",
      }}>
        {included ? "✓" : "—"}
      </div>
      <span style={{ fontSize: 12.5, color: included ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.3)", flex: 1 }}>{label}</span>
      {soon && included && (
        <span style={{ fontSize: 9, fontWeight: 800, padding: "2px 6px", borderRadius: 99, background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: ".3px" }}>Soon</span>
      )}
    </div>
  );
}

function PlanCard({
  planKey, annual, selected, onSelect, loading,
}: {
  planKey: PlanKey;
  annual: boolean;
  selected: boolean;
  onSelect: () => void;
  loading: boolean;
}) {
  const isGrow = planKey === "grow";
  const price = annual ? ANNUAL_MONTHLY[planKey] : MONTHLY[planKey];
  const labels: Record<PlanKey, string> = { start: "Start", grow: "Grow", scale: "Scale" };
  const descs: Record<PlanKey, string> = {
    start: "Perfect for getting started",
    grow: "For agencies growing fast",
    scale: "For multi-user teams",
  };

  return (
    <div
      onClick={onSelect}
      style={{
        border: `1px solid ${selected ? SAND : isGrow ? "rgba(232,201,123,0.25)" : "rgba(255,255,255,0.09)"}`,
        borderRadius: 18,
        padding: "24px 22px",
        background: selected
          ? `linear-gradient(160deg, rgba(232,201,123,0.09), rgba(11,20,36,0.5))`
          : isGrow
            ? "rgba(232,201,123,0.03)"
            : "rgba(255,255,255,0.015)",
        cursor: "pointer",
        position: "relative",
        transition: "border-color 0.15s, background 0.15s",
        display: "flex", flexDirection: "column", gap: 16,
      }}
    >
      {isGrow && (
        <div style={{
          position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
          background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
          color: "#0a1426", fontSize: 10, fontWeight: 800,
          padding: "3px 12px", borderRadius: 99, letterSpacing: ".5px", whiteSpace: "nowrap",
        }}>MOST POPULAR</div>
      )}

      <div>
        <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4, color: isGrow ? SAND : "rgba(255,255,255,0.9)" }}>
          {labels[planKey]}
        </div>
        <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>{descs[planKey]}</div>
      </div>

      <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
        <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 34, letterSpacing: "-0.8px", color: "#fff" }}>€{price}</span>
        <span style={{ fontSize: 13, color: "rgba(255,255,255,0.4)" }}>/mo</span>
        {annual && (
          <span style={{ fontSize: 10.5, color: SUCCESS, fontWeight: 600, marginLeft: 6 }}>
            billed €{ANNUAL_TOTAL[planKey]}/yr
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
        {PLAN_FEATURES[planKey].map((f) => (
          <FeatureRow key={f.label} label={f.label} included={f.included} soon={f.soon} />
        ))}
      </div>

      <button
        onClick={(e) => { e.stopPropagation(); onSelect(); }}
        disabled={loading && selected}
        style={{
          width: "100%", padding: "11px", borderRadius: 9, fontSize: 13, fontWeight: 700,
          border: `1px solid ${selected ? SAND : isGrow ? "rgba(232,201,123,0.3)" : "rgba(255,255,255,0.1)"}`,
          background: selected
            ? `linear-gradient(135deg, ${SAND}, #c4a84f)`
            : isGrow
              ? "rgba(232,201,123,0.08)"
              : "none",
          color: selected ? "#0a1426" : isGrow ? SAND : "rgba(255,255,255,0.5)",
          cursor: loading && selected ? "not-allowed" : "pointer",
          fontFamily: "inherit",
          display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
          transition: "all 0.15s",
        }}
      >
        {loading && selected
          ? <><span className="spinner" style={{ width: 13, height: 13, borderTopColor: selected ? "#0a1426" : SAND }} /> Redirecting…</>
          : selected ? `✦ Subscribe to ${labels[planKey]}` : `Choose ${labels[planKey]}`
        }
      </button>
    </div>
  );
}

export default function PaywallPage() {
  const router = useRouter();
  const lang = useLang();
  const isMobile = useIsMobile();
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [packageCount, setPackageCount] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [avgPrice, setAvgPrice] = useState(800);
  const [annual, setAnnual] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>("grow");
  const [trialEndsAt, setTrialEndsAt] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUserId(u.uid);
      const userSnap = await getDoc(doc(db, "users", u.uid));
      if (userSnap.exists()) {
        setTrialEndsAt(userSnap.data()?.trialEndsAt ?? null);
        setUserPlan(userSnap.data()?.plan ?? "free");
      }
      const snap = await getDocs(query(collection(db, "packages"), where("userId", "==", u.uid)));
      const pkgs = snap.docs.map(d => d.data());
      setPackageCount(pkgs.length);
      const views = pkgs.reduce((a, p) => a + (p.views || 0), 0);
      const clicks = pkgs.reduce((a, p) => a + (p.whatsappClicks || 0) + (p.messengerClicks || 0), 0);
      setTotalViews(views);
      setTotalClicks(clicks);
      const prices = pkgs.map(p => parsePackagePrice(p.price || "")).filter(n => n > 0);
      setAvgPrice(prices.length > 0 ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 800);
      posthog.capture("paywall_viewed", { package_count: pkgs.length, total_views: views, total_clicks: clicks });
    });
    return () => unsub();
  }, [router]);

  const handleUpgrade = async () => {
    if (!userId) { router.push("/login"); return; }
    setLoading(true);
    posthog.capture("upgrade_initiated", { plan: selectedPlan, billing_period: annual ? "annual" : "monthly" });
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan: selectedPlan, billingPeriod: annual ? "annual" : "monthly" }),
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } catch (err) {
      posthog.captureException(err);
      console.error("Checkout error", err);
    } finally {
      setLoading(false);
    }
  };

  const trialActive = isTrialActive(trialEndsAt);
  const daysLeft = trialDaysLeft(trialEndsAt);
  const estRevenue = Math.round(totalClicks * avgPrice * 0.15);
  const isPaid = userPlan === "start" || userPlan === "grow" || userPlan === "scale";

  return (
    <AppLayout>
      <div dir={dir} style={{ padding: isMobile ? "16px 16px 60px" : "28px 32px 80px", maxWidth: 1100 }}>

        {/* Trial status banner */}
        <div style={{
          marginBottom: 28, padding: "14px 20px", borderRadius: 14,
          background: trialActive
            ? "linear-gradient(135deg, rgba(232,201,123,0.07), rgba(11,20,36,0.4))"
            : "rgba(255,80,80,0.06)",
          border: `1px solid ${trialActive ? "rgba(232,201,123,0.2)" : "rgba(255,80,80,0.18)"}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: trialActive ? `${SAND}18` : "rgba(255,80,80,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
            }}>
              {isPaid ? "✦" : trialActive ? "⏳" : "⚠️"}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: isPaid ? SAND : trialActive ? "#fff" : "#ff8080" }}>
                {isPaid
                  ? `You're on the ${userPlan.charAt(0).toUpperCase() + userPlan.slice(1)} plan`
                  : trialActive
                    ? `${daysLeft} days left in your free trial`
                    : "Your free trial has expired"
                }
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                {isPaid
                  ? "Manage your subscription below"
                  : trialActive
                    ? "Subscribe before it ends to keep full access to all features"
                    : "Subscribe now to restore access to your packages and leads"
                }
              </div>
            </div>
          </div>
          {!isPaid && (
            <div style={{
              padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700,
              background: trialActive ? `${SAND}20` : "rgba(255,80,80,0.12)",
              color: trialActive ? SAND : "#ff8080",
            }}>
              {trialActive ? `Trial ends ${new Date(trialEndsAt!).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}` : "Trial expired"}
            </div>
          )}
        </div>

        {/* Page title */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.4px" }}>Billing</div>
        </div>

        {/* Stats row */}
        {(packageCount > 0 || totalViews > 0) && (
          <div style={{
            display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)",
            gap: 1, marginBottom: 32,
            background: "rgba(255,255,255,0.05)", borderRadius: 14, overflow: "hidden",
            border: "1px solid rgba(255,255,255,0.07)",
          }}>
            {[
              { v: String(packageCount), l: "Packages", sub: undefined },
              { v: totalViews.toLocaleString(), l: "Total views", sub: undefined },
              { v: String(totalClicks), l: "Direct inquiries", sub: undefined },
              { v: `€${estRevenue.toLocaleString()}`, l: "Est. revenue", sub: "at 15% conversion" },
            ].map(({ v, l, sub }) => (
              <div key={l} style={{ padding: "18px 20px", background: "rgba(7,14,26,0.8)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                <Stat v={v} l={l} sub={sub} />
              </div>
            ))}
          </div>
        )}

        {/* Annual / Monthly toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>Choose your plan</div>
          <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,0.06)", borderRadius: 10, padding: 4, gap: 2 }}>
            {[false, true].map(isAnnual => (
              <button
                key={String(isAnnual)}
                onClick={() => setAnnual(isAnnual)}
                style={{
                  padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                  border: "none", cursor: "pointer", fontFamily: "inherit",
                  background: annual === isAnnual ? (isAnnual ? SAND : "rgba(255,255,255,0.12)") : "transparent",
                  color: annual === isAnnual ? (isAnnual ? "#0a1426" : "#fff") : "rgba(255,255,255,0.4)",
                  display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
                }}
              >
                {isAnnual ? "Annual" : "Monthly"}
                {isAnnual && (
                  <span style={{
                    fontSize: 9.5, fontWeight: 800, padding: "2px 5px", borderRadius: 99,
                    background: annual ? "#0a1426" : "rgba(255,255,255,0.12)",
                    color: annual ? SAND : "rgba(255,255,255,0.5)",
                  }}>Save 20%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3,1fr)",
          gap: 14, marginBottom: 32,
        }}>
          {(["start", "grow", "scale"] as PlanKey[]).map((planKey) => (
            <PlanCard
              key={planKey}
              planKey={planKey}
              annual={annual}
              selected={selectedPlan === planKey}
              onSelect={() => {
                setSelectedPlan(planKey);
                handleUpgrade();
              }}
              loading={loading}
            />
          ))}
        </div>

        {/* Fine print */}
        <div style={{ textAlign: "center", fontSize: 11.5, color: "rgba(255,255,255,0.3)", lineHeight: 1.8 }}>
          Cancel anytime · 7-day money-back guarantee · Billed securely via Stripe<br />
          All plans include unlimited leads and views · Prices in EUR (VAT may apply)
        </div>

      </div>
    </AppLayout>
  );
}
