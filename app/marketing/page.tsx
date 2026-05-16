"use client";

import { useState } from "react";

const SAND = "#e8c97b";
const SAND_DIM = "#c4a84f";
const NAVY = "#0d1b2e";
const NAVY_MID = "#162540";
const NAVY_LIGHT = "#1e3455";
const SUCCESS = "#2dd4a0";
const BORDER = "rgba(255,255,255,0.08)";
const MUTED = "rgba(255,255,255,0.5)";
const AGENCY_URL =
  process.env.NEXT_PUBLIC_AGENCY_URL ??
  (process.env.NODE_ENV === "development" ? "" : "https://agency.packmetrix.com");

/* ─── Types ─────────────────────────────────────────────── */
type PlanId = "start" | "grow" | "scale";

/* ─── Data ──────────────────────────────────────────────── */
const FEATURES = [
  {
    icon: "✦",
    title: "AI Package Builder",
    desc: "Paste any WhatsApp message or itinerary — AI extracts, structures, and publishes your package page in seconds.",
  },
  {
    icon: "📊",
    title: "Per-Package Analytics",
    desc: "Track views, WhatsApp clicks, and conversion rate for every package. Know exactly what sells.",
  },
  {
    icon: "📥",
    title: "Lead Tracking",
    desc: "Every inquiry is captured and organised. Never lose a potential booking again.",
  },
  {
    icon: "🎨",
    title: "Beautiful Templates",
    desc: "10+ professionally designed templates built specifically for travel packages. Start and Grow plans unlock more.",
  },
  {
    icon: "🌐",
    title: "Custom Domain",
    desc: "Publish your packages under your own domain. Build brand recognition with every shared link.",
  },
  {
    icon: "📱",
    title: "Mobile-First Pages",
    desc: "Every package page looks perfect on the phones your clients use to browse and book.",
  },
];

const STEPS = [
  { n: "01", title: "Paste your package", desc: "Copy any package description, WhatsApp post, or itinerary text and paste it into PackMetrix." },
  { n: "02", title: "AI structures it", desc: "Our AI extracts destination, price, inclusions, and departure airports into a clean, professional format." },
  { n: "03", title: "Choose a template", desc: "Pick from 10+ templates and customise branding, colours, and layout in minutes." },
  { n: "04", title: "Share & track", desc: "Send the link to clients on WhatsApp or Instagram and watch views, leads, and conversions roll in." },
];

type Plan = {
  id: PlanId;
  name: string;
  tagline: string;
  monthly: number;
  annual: number;
  highlight: boolean;
  packages: string;
  users: string;
  templates: string;
  domain: string;
  analytics: string;
  leads: string;
  ai: boolean;
  mobileApp: boolean;
  support: string;
};

const PLANS: Plan[] = [
  {
    id: "start",
    name: "Start",
    tagline: "For solo agents & micro agencies",
    monthly: 29,
    annual: 23,
    highlight: false,
    packages: "Up to 10 packages",
    users: "1 user",
    templates: "2 templates",
    domain: "packmetrix.com/agency",
    analytics: "30-day history",
    leads: "Lead inbox",
    ai: false,
    mobileApp: false,
    support: "Email support",
  },
  {
    id: "grow",
    name: "Grow",
    tagline: "For growing agencies ready to scale",
    monthly: 79,
    annual: 63,
    highlight: true,
    packages: "Up to 30 packages",
    users: "2 users",
    templates: "All templates",
    domain: "Custom domain + SSL",
    analytics: "Full history + CSV export",
    leads: "Lead inbox + export",
    ai: false,
    mobileApp: false,
    support: "Priority email",
  },
  {
    id: "scale",
    name: "Scale",
    tagline: "For established agencies & teams",
    monthly: 179,
    annual: 143,
    highlight: false,
    packages: "Unlimited packages",
    users: "Up to 5 users",
    templates: "All templates",
    domain: "Custom domain + SSL",
    analytics: "Full history + CSV export",
    leads: "Lead inbox + export",
    ai: true,
    mobileApp: true,
    support: "Chat + onboarding call",
  },
];

/* ─── Sub-components ─────────────────────────────────────── */

function NavBar() {
  return (
    <nav style={{
      position: "sticky", top: 0, zIndex: 100,
      background: `${NAVY}f0`,
      backdropFilter: "blur(12px)",
      borderBottom: `1px solid ${BORDER}`,
      padding: "0 32px",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      height: 64,
    }}>
      <a href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
        <img src="/logo.svg" alt="PackMetrix" style={{ width: 28, height: 28 }} />
        <span style={{ fontWeight: 700, fontSize: 17, letterSpacing: "-0.3px", color: "#fdfcf9" }}>
          Pack<em style={{ color: SAND, fontStyle: "normal", fontWeight: 600 }}>metrix</em>
        </span>
      </a>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <a
          href="#pricing"
          style={{ color: MUTED, fontSize: 13.5, fontWeight: 500, textDecoration: "none", padding: "6px 12px" }}
        >
          Pricing
        </a>
        <a
          href={`${AGENCY_URL}/login`}
          style={{ color: MUTED, fontSize: 13.5, fontWeight: 500, textDecoration: "none", padding: "6px 12px" }}
        >
          Login
        </a>
        <a
          href={`${AGENCY_URL}/signup`}
          style={{
            background: `linear-gradient(135deg, ${SAND}, ${SAND_DIM})`,
            color: NAVY, fontWeight: 700, fontSize: 13.5,
            padding: "8px 18px", borderRadius: 9, textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 6,
          }}
        >
          Open Agency App →
        </a>
      </div>
    </nav>
  );
}

function Hero() {
  return (
    <section style={{
      padding: "96px 32px 80px",
      background: `linear-gradient(160deg, rgba(30,52,90,0.6) 0%, ${NAVY} 60%)`,
      borderBottom: `1px solid ${BORDER}`,
      textAlign: "center",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Dot grid bg */}
      <svg style={{ position: "absolute", inset: 0, opacity: 0.04, pointerEvents: "none" }} width="100%" height="100%">
        <pattern id="hero-grid" width="48" height="48" patternUnits="userSpaceOnUse">
          <circle cx="24" cy="24" r="1.2" fill={SAND} />
        </pattern>
        <rect width="100%" height="100%" fill="url(#hero-grid)" />
      </svg>

      <div style={{ position: "relative", maxWidth: 720, margin: "0 auto" }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 7,
          background: `${SAND}18`, border: `1px solid ${SAND}40`,
          borderRadius: 99, padding: "5px 14px",
          fontSize: 12, fontWeight: 600, color: SAND, marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: SUCCESS, display: "inline-block" }} />
          Travel Package Intelligence
        </div>

        <h1 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: "clamp(36px, 6vw, 64px)",
          fontWeight: 400,
          lineHeight: 1.08,
          letterSpacing: "-1.5px",
          color: "#fdfcf9",
          marginBottom: 24,
        }}>
          Turn travel packages into{" "}
          <em style={{ color: SAND, fontStyle: "italic" }}>high-converting</em>
          <br />landing pages
        </h1>

        <p style={{
          fontSize: "clamp(15px, 2vw, 18px)",
          color: MUTED,
          lineHeight: 1.7,
          maxWidth: 520,
          margin: "0 auto 40px",
        }}>
          PackMetrix helps travel agencies publish professional package pages, track views,
          capture leads, and measure conversion — in minutes, not days.
        </p>

        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href={`${AGENCY_URL}/signup`}
            style={{
              background: `linear-gradient(135deg, ${SAND}, ${SAND_DIM})`,
              color: NAVY, fontWeight: 700, fontSize: 15,
              padding: "14px 28px", borderRadius: 11, textDecoration: "none",
              display: "inline-flex", alignItems: "center", gap: 8,
            }}
          >
            ✦ Get Started Free
          </a>
          <a
            href="#how-it-works"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: `1px solid ${BORDER}`,
              color: "rgba(255,255,255,0.7)", fontWeight: 600, fontSize: 15,
              padding: "14px 28px", borderRadius: 11, textDecoration: "none",
            }}
          >
            See how it works →
          </a>
        </div>

        {/* Mini trust bar */}
        <div style={{ marginTop: 48, display: "flex", justifyContent: "center", gap: 32, flexWrap: "wrap" }}>
          {[
            { v: "10+", l: "Templates" },
            { v: "4", l: "Analytics metrics" },
            { v: "2", l: "Languages" },
          ].map((s) => (
            <div key={s.l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 28, color: SAND, letterSpacing: "-0.5px" }}>{s.v}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", fontWeight: 600, textTransform: "uppercase", letterSpacing: ".5px", marginTop: 2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Features() {
  return (
    <section style={{ padding: "88px 32px", background: NAVY }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: MUTED, marginBottom: 12 }}>
            Everything you need
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 400, letterSpacing: "-0.8px", color: "#fdfcf9" }}>
            Built for travel agencies,{" "}
            <em style={{ color: SAND, fontStyle: "italic" }}>not generic tools</em>
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}>
          {FEATURES.map((f) => (
            <div
              key={f.title}
              style={{
                background: NAVY_MID,
                border: `1px solid ${BORDER}`,
                borderRadius: 18,
                padding: "28px 28px",
                transition: "border-color 0.2s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = `${SAND}30`)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = BORDER)}
            >
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${SAND}12`, border: `1px solid ${SAND}25`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20, marginBottom: 16,
              }}>
                {f.icon}
              </div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#fdfcf9", marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13.5, color: MUTED, lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section id="how-it-works" style={{ padding: "88px 32px", background: NAVY_MID, borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}` }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: MUTED, marginBottom: 12 }}>
            How it works
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 400, letterSpacing: "-0.8px", color: "#fdfcf9" }}>
            From paste to published{" "}
            <em style={{ color: SAND, fontStyle: "italic" }}>in minutes</em>
          </h2>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: 24,
          position: "relative",
        }}>
          {STEPS.map((s, i) => (
            <div key={s.n} style={{ position: "relative" }}>
              {/* Connector line (hidden on small screens via CSS) */}
              {i < STEPS.length - 1 && (
                <div className="hide-mobile" style={{
                  position: "absolute", top: 22, left: "calc(50% + 22px)",
                  width: "calc(100% - 22px)", height: 1,
                  background: `linear-gradient(90deg, ${SAND}40, transparent)`,
                }} />
              )}
              <div style={{
                background: NAVY, border: `1px solid ${BORDER}`,
                borderRadius: 18, padding: "28px 24px", textAlign: "center",
              }}>
                <div style={{
                  width: 44, height: 44, borderRadius: "50%",
                  background: `${SAND}15`, border: `1px solid ${SAND}35`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'DM Serif Display', serif", fontSize: 16, color: SAND,
                  margin: "0 auto 16px",
                }}>
                  {s.n}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#fdfcf9", marginBottom: 8 }}>{s.title}</div>
                <div style={{ fontSize: 13, color: MUTED, lineHeight: 1.6 }}>{s.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingCard({ plan, annual }: { plan: Plan; annual: boolean }) {
  const price = annual ? plan.annual : plan.monthly;
  const rows: { label: string; value: string | boolean }[] = [
    { label: "Users", value: plan.users },
    { label: "Packages", value: plan.packages },
    { label: "Templates", value: plan.templates },
    { label: "Domain", value: plan.domain },
    { label: "Analytics", value: plan.analytics },
    { label: "Leads", value: plan.leads },
    { label: "AI features", value: plan.ai ? "Included" : false },
    { label: "Client mobile app", value: plan.mobileApp ? "Included" : false },
    { label: "Support", value: plan.support },
  ];

  return (
    <div style={{
      background: plan.highlight ? `linear-gradient(160deg, rgba(232,201,123,0.07), ${NAVY_MID})` : NAVY_MID,
      border: plan.highlight ? `1px solid ${SAND}45` : `1px solid ${BORDER}`,
      borderRadius: 22,
      padding: "36px 30px",
      position: "relative",
      display: "flex", flexDirection: "column",
    }}>
      {plan.highlight && (
        <div style={{
          position: "absolute", top: -13, left: "50%", transform: "translateX(-50%)",
          background: `linear-gradient(135deg, ${SAND}, ${SAND_DIM})`,
          color: NAVY, fontSize: 10.5, fontWeight: 800,
          padding: "4px 14px", borderRadius: 99, letterSpacing: ".5px", textTransform: "uppercase",
          whiteSpace: "nowrap",
        }}>
          Most popular
        </div>
      )}

      <div style={{ marginBottom: 24 }}>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#fdfcf9", marginBottom: 4 }}>{plan.name}</div>
        <div style={{ fontSize: 12.5, color: MUTED, marginBottom: 20 }}>{plan.tagline}</div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
          <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42, color: "#fdfcf9", letterSpacing: "-1px" }}>
            €{price}
          </span>
          <span style={{ fontSize: 13, color: "rgba(255,255,255,0.35)", fontWeight: 500 }}>/mo</span>
        </div>
        {annual && (
          <div style={{ fontSize: 11.5, color: SUCCESS, fontWeight: 600, marginTop: 4 }}>
            Billed annually — save 20%
          </div>
        )}
      </div>

      <a
        href={`${AGENCY_URL}/signup`}
        style={{
          display: "block", textAlign: "center",
          background: plan.highlight ? `linear-gradient(135deg, ${SAND}, ${SAND_DIM})` : "rgba(255,255,255,0.06)",
          border: plan.highlight ? "none" : `1px solid ${BORDER}`,
          color: plan.highlight ? NAVY : "rgba(255,255,255,0.75)",
          fontWeight: 700, fontSize: 14,
          padding: "12px 20px", borderRadius: 10, textDecoration: "none",
          marginBottom: 28,
        }}
      >
        Get started →
      </a>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 0 }}>
        {rows.map((r) => {
          const active = r.value !== false;
          return (
            <div
              key={r.label}
              style={{
                display: "flex", justifyContent: "space-between", alignItems: "center",
                padding: "9px 0",
                borderBottom: `1px solid ${BORDER}`,
                opacity: active ? 1 : 0.3,
              }}
            >
              <span style={{ fontSize: 12.5, color: MUTED }}>{r.label}</span>
              <span style={{ fontSize: 12.5, fontWeight: 600, color: active ? "#fdfcf9" : "rgba(255,255,255,0.25)" }}>
                {typeof r.value === "string" ? r.value : r.value ? "✓" : "—"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Pricing() {
  const [annual, setAnnual] = useState(false);

  return (
    <section id="pricing" style={{ padding: "88px 32px", background: NAVY }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "1px", color: MUTED, marginBottom: 12 }}>
            Pricing
          </div>
          <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 400, letterSpacing: "-0.8px", color: "#fdfcf9", marginBottom: 16 }}>
            Simple pricing,{" "}
            <em style={{ color: SAND, fontStyle: "italic" }}>no surprises</em>
          </h2>
          <p style={{ fontSize: 15, color: MUTED, maxWidth: 440, margin: "0 auto 28px" }}>
            Start free, upgrade when you see results. Cancel anytime.
          </p>

          {/* Billing toggle */}
          <div style={{ display: "inline-flex", alignItems: "center", background: "rgba(255,255,255,0.05)", borderRadius: 10, padding: 4, gap: 2 }}>
            {[false, true].map((isAnnual) => (
              <button
                key={String(isAnnual)}
                onClick={() => setAnnual(isAnnual)}
                style={{
                  padding: "7px 18px", borderRadius: 7, fontSize: 13, fontWeight: 700,
                  border: "none", cursor: "pointer", fontFamily: "inherit",
                  background: annual === isAnnual ? (isAnnual ? SAND : "rgba(255,255,255,0.1)") : "transparent",
                  color: annual === isAnnual ? (isAnnual ? NAVY : "#fff") : MUTED,
                  display: "flex", alignItems: "center", gap: 7, transition: "all 0.15s",
                }}
              >
                {isAnnual ? "Annual" : "Monthly"}
                {isAnnual && (
                  <span style={{
                    fontSize: 10, fontWeight: 800, padding: "2px 6px", borderRadius: 99,
                    background: annual ? NAVY : SAND,
                    color: annual ? SAND : NAVY,
                  }}>Save 20%</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
          alignItems: "start",
        }}>
          {PLANS.map((plan) => (
            <PricingCard key={plan.id} plan={plan} annual={annual} />
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: 32 }}>
          <p style={{ fontSize: 12.5, color: "rgba(255,255,255,0.3)" }}>
            All plans include a free trial. No credit card required to start.
          </p>
        </div>
      </div>
    </section>
  );
}

function CtaBanner() {
  return (
    <section style={{
      padding: "80px 32px",
      background: `linear-gradient(135deg, rgba(232,201,123,0.08), ${NAVY_MID})`,
      borderTop: `1px solid ${SAND}25`,
      borderBottom: `1px solid ${BORDER}`,
      textAlign: "center",
    }}>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 400, letterSpacing: "-0.8px", color: "#fdfcf9", marginBottom: 16 }}>
          Ready to grow{" "}
          <em style={{ color: SAND, fontStyle: "italic" }}>your agency?</em>
        </h2>
        <p style={{ fontSize: 16, color: MUTED, marginBottom: 32, lineHeight: 1.65 }}>
          Set up your first package in under 10 minutes. No design skills needed.
        </p>
        <a
          href={`${AGENCY_URL}/signup`}
          style={{
            background: `linear-gradient(135deg, ${SAND}, ${SAND_DIM})`,
            color: NAVY, fontWeight: 700, fontSize: 15,
            padding: "15px 32px", borderRadius: 12, textDecoration: "none",
            display: "inline-flex", alignItems: "center", gap: 8,
          }}
        >
          ✦ Start for free — no credit card
        </a>
      </div>
    </section>
  );
}

function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer style={{
      background: "#080f1a",
      borderTop: `1px solid ${BORDER}`,
      padding: "48px 32px 32px",
      color: "rgba(255,255,255,0.35)",
    }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 40, justifyContent: "space-between", marginBottom: 40 }}>
          {/* Brand */}
          <div style={{ maxWidth: 260 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <img src="/logo.svg" alt="PackMetrix" style={{ width: 24, height: 24 }} />
              <span style={{ fontWeight: 700, fontSize: 15, color: "#fdfcf9" }}>
                Pack<em style={{ color: SAND, fontStyle: "normal" }}>metrix</em>
              </span>
            </div>
            <p style={{ fontSize: 12.5, lineHeight: 1.65 }}>
              Travel Package Intelligence — helping travel agencies publish, track, and convert better.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".7px", color: "rgba(255,255,255,0.25)", marginBottom: 14 }}>
                Product
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Agency App", href: AGENCY_URL },
                  { label: "Pricing", href: "#pricing" },
                  { label: "Templates", href: `${AGENCY_URL}/signup` },
                ].map((l) => (
                  <a key={l.label} href={l.href} style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.color = SAND)}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>

            <div>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".7px", color: "rgba(255,255,255,0.25)", marginBottom: 14 }}>
                Legal
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "Privacy Policy", href: "/privacy" },
                  { label: "Terms of Service", href: "/terms" },
                ].map((l) => (
                  <a key={l.label} href={l.href} style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, textDecoration: "none" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "rgba(255,255,255,0.65)")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                  >
                    {l.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{
          borderTop: `1px solid rgba(255,255,255,0.06)`,
          paddingTop: 24,
          display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "space-between", alignItems: "center",
        }}>
          <div style={{ fontSize: 12 }}>
            © {year} PackMetrix. All rights reserved.
          </div>
          <div style={{ fontSize: 12, display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
            <span>Operated by</span>
            <span style={{ color: "rgba(255,255,255,0.55)", fontWeight: 600 }}>WQ AppTech</span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
            <span>Eenmanszaak registered in the Netherlands</span>
            <span style={{ color: "rgba(255,255,255,0.2)" }}>·</span>
            <span>
              KvK{" "}
              <a
                href="https://www.kvk.nl/zoeken/?q=WQ+AppTech"
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "rgba(255,255,255,0.45)", textDecoration: "underline" }}
              >
                91019001
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function MarketingPage() {
  return (
    <div style={{ background: NAVY, minHeight: "100vh", color: "#fdfcf9", fontFamily: "var(--font-dm-sans), 'DM Sans', system-ui, sans-serif" }}>
      <NavBar />
      <Hero />
      <Features />
      <HowItWorks />
      <Pricing />
      <CtaBanner />
      <Footer />
    </div>
  );
}
