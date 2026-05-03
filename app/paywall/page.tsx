"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import Icon from "@/components/Icon";

const SAND = "#e8c97b";

type Plan = {
  name: string;
  monthly: string;
  annual: string;
  sub?: string;
  sub_annual?: string;
  sub_monthly?: string;
  features: string[];
  cta: string;
  disabled: boolean;
  badge?: string;
  bg: string;
  border: string;
};

const PLANS: Plan[] = [
  {
    name: "Free",
    monthly: "€0",
    annual: "€0",
    sub: "Forever free",
    features: [
      "3 packages",
      "Basic landing page",
      "WhatsApp/Messenger tracking",
      "Lead tracker (Kanban)",
      "7-day analytics",
    ],
    cta: "Current plan",
    disabled: true,
    bg: "rgba(255,255,255,0.03)",
    border: "rgba(255,255,255,0.08)",
  },
  {
    name: "Pro",
    monthly: "€39",
    annual: "€29",
    sub_annual: "per month, billed annually",
    sub_monthly: "per month",
    features: [
      "Unlimited packages",
      "Premium landing page themes",
      "AI Video generation",
      "Advanced analytics (90 days)",
      "Custom domain",
      "Priority support",
      "Remove branding",
    ],
    cta: "Upgrade to Pro",
    disabled: false,
    badge: "MOST POPULAR",
    bg: `linear-gradient(145deg, rgba(232,201,123,0.12), rgba(196,168,79,0.06))`,
    border: `${SAND}50`,
  },
  {
    name: "Agency",
    monthly: "€99",
    annual: "€79",
    sub_annual: "per month, billed annually",
    sub_monthly: "per month",
    features: [
      "Everything in Pro",
      "5 team seats",
      "White-label option",
      "Bulk package import",
      "API access",
      "Dedicated account manager",
    ],
    cta: "Start Agency Trial",
    disabled: false,
    bg: "rgba(78,205,196,0.06)",
    border: "rgba(78,205,196,0.25)",
  },
];

export default function PaywallPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const trigger = searchParams.get("trigger") || "";
  const [annual, setAnnual] = useState(true);

  return (
    <AppLayout>
      <div style={{ flex: 1, overflow: "auto", padding: "40px 48px" }}>
        {/* Back */}
        <button
          onClick={() => router.back()}
          style={{
            background: "none", border: "none", color: "rgba(255,255,255,0.4)",
            fontSize: 13, fontFamily: "inherit", cursor: "pointer",
            display: "flex", alignItems: "center", gap: 6, marginBottom: 32,
          }}
        >
          <Icon name="arrow_left" size={14} /> Back
        </button>

        {/* Header */}
        <div className="fade-up" style={{ textAlign: "center", marginBottom: 36 }}>
          {trigger === "video" && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.3)",
              borderRadius: 99, padding: "5px 14px", fontSize: 12, color: "#f5a623",
              fontWeight: 600, marginBottom: 14,
            }}>
              <Icon name="video" size={13} color="#f5a623" /> AI Video is a Pro feature
            </div>
          )}
          {trigger === "packages" && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)",
              borderRadius: 99, padding: "5px 14px", fontSize: 12, color: "#ef9090",
              fontWeight: 600, marginBottom: 14,
            }}>
              You&apos;ve used all 3 free packages
            </div>
          )}
          <h2 style={{
            fontFamily: "var(--font-dm-serif), 'DM Serif Display', serif",
            fontSize: 36, marginBottom: 10, lineHeight: 1.15,
          }}>
            Upgrade to <em style={{ color: SAND, fontStyle: "italic" }}>grow faster</em>
          </h2>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,0.45)", maxWidth: 480, margin: "0 auto" }}>
            Everything you need to turn more posts into booked trips.
          </p>

          {/* Billing toggle */}
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 0,
            marginTop: 22, background: "rgba(255,255,255,0.05)",
            borderRadius: 99, padding: "5px 6px",
          }}>
            {[
              { label: "Monthly", value: false },
              { label: "Annual", value: true, badge: "-26%" },
            ].map(opt => (
              <button key={String(opt.value)} onClick={() => setAnnual(opt.value)} style={{
                padding: "6px 16px", borderRadius: 99, border: "none",
                background: annual === opt.value ? "rgba(255,255,255,0.12)" : "transparent",
                color: annual === opt.value ? "white" : "rgba(255,255,255,0.4)",
                fontSize: 13, fontFamily: "inherit", cursor: "pointer",
                fontWeight: annual === opt.value ? 600 : 400,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                {opt.label}
                {"badge" in opt && (
                  <span style={{ background: "#2dd4a0", color: "#0d1b2e", borderRadius: 99, padding: "1px 8px", fontSize: 10, fontWeight: 800 }}>
                    {opt.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plans grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 18, maxWidth: 900, margin: "0 auto" }}>
          {PLANS.map((plan, i) => (
            <div key={plan.name} style={{
              background: plan.bg, border: `1px solid ${plan.border}`,
              borderRadius: 20, padding: "24px 22px",
              position: "relative", overflow: "hidden",
            }}>
              {"badge" in plan && plan.badge && (
                <div style={{
                  position: "absolute", top: 14, right: 14,
                  background: SAND, color: "#0d1b2e",
                  borderRadius: 99, padding: "2px 10px", fontSize: 10, fontWeight: 800,
                }}>{plan.badge}</div>
              )}
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: "rgba(255,255,255,0.7)" }}>{plan.name}</div>
              <div style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-1px", color: "#fdfcf9", lineHeight: 1 }}>
                {annual ? plan.annual : plan.monthly}
              </div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginBottom: 20, marginTop: 2 }}>
                {plan.sub ?? (annual ? plan.sub_annual : plan.sub_monthly)}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 22 }}>
                {plan.features.map((f, j) => (
                  <div key={j} style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <Icon name="check" size={13} color={plan.disabled ? "rgba(255,255,255,0.3)" : "#2dd4a0"} strokeWidth={2.5} />
                    <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>{f}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => !plan.disabled && router.push("/dashboard")}
                style={{
                  width: "100%", padding: "11px",
                  background: plan.disabled
                    ? "rgba(255,255,255,0.05)"
                    : i === 1
                    ? `linear-gradient(135deg, ${SAND}, #c4a84f)`
                    : "rgba(78,205,196,0.15)",
                  border: plan.disabled
                    ? "1px solid rgba(255,255,255,0.1)"
                    : i === 1 ? "none" : "1px solid rgba(78,205,196,0.3)",
                  borderRadius: 10, fontSize: 13, fontWeight: 700,
                  color: plan.disabled
                    ? "rgba(255,255,255,0.25)"
                    : i === 1 ? "#0d1b2e" : "#4ecdc4",
                  fontFamily: "inherit", cursor: plan.disabled ? "default" : "pointer",
                }}
              >{plan.cta}</button>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 36, color: "rgba(255,255,255,0.25)", fontSize: 12 }}>
          Trusted by 400+ travel agencies · No lock-in · Cancel anytime
        </div>
      </div>
    </AppLayout>
  );
}
