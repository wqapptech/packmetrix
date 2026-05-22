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
import { T } from "@/lib/translations";

type TDict = typeof T["en"];

const SAND = "#e8c97b";
const SUCCESS = "#2dd4a0";

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

function FeatureRow({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "center", padding: "5px 0" }}>
      <div style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
        background: `${SAND}22`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 9, color: SAND,
      }}>✓</div>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.75)" }}>{label}</span>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ borderBottom: "1px solid rgba(255,255,255,0.07)", padding: "14px 0", cursor: "pointer" }}
      onClick={() => setOpen(!open)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: "rgba(255,255,255,0.85)" }}>{q}</span>
        <span style={{
          fontSize: 18, color: "rgba(255,255,255,0.35)", flexShrink: 0,
          transform: open ? "rotate(45deg)" : "none", transition: "transform 0.15s", display: "inline-block",
        }}>+</span>
      </div>
      {open && (
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 8, lineHeight: 1.65 }}>{a}</div>
      )}
    </div>
  );
}

export default function PaywallPage() {
  const router = useRouter();
  const lang = useLang();
  const t = T[lang] as TDict;
  const isMobile = useIsMobile();
  const dir = lang === "ar" ? "rtl" : "ltr";

  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [packageCount, setPackageCount] = useState(0);
  const [totalViews, setTotalViews] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [avgPrice, setAvgPrice] = useState(800);
  const [annual, setAnnual] = useState(false);
  const [trialEndsAt, setTrialEndsAt] = useState<number | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [spotsRemaining, setSpotsRemaining] = useState<number | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) { router.push("/login"); return; }
      setUserId(u.uid);
      const userSnap = await getDoc(doc(db, "users", u.uid));
      if (userSnap.exists()) {
        setTrialEndsAt(userSnap.data()?.trialEndsAt ?? null);
        setUserPlan(userSnap.data()?.plan ?? "free");
        setStripeCustomerId(userSnap.data()?.stripeCustomerId ?? null);
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

  useEffect(() => {
    fetch("/api/founding-spots")
      .then(r => r.json())
      .then(data => setSpotsRemaining(data.remaining ?? 0))
      .catch(() => setSpotsRemaining(0));
  }, []);

  const handleCheckout = async (plan: "founding" | "standard") => {
    if (!userId) { router.push("/login"); return; }
    setLoading(true);
    posthog.capture("upgrade_initiated", { plan, billing_period: annual ? "annual" : "monthly" });
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, plan, billingPeriod: annual ? "annual" : "monthly" }),
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

  const handleManage = async () => {
    if (!userId) { router.push("/login"); return; }
    setLoading(true);
    posthog.capture("manage_subscription_clicked", { current_plan: userPlan });
    try {
      const res = await fetch("/api/stripe/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });
      const json = await res.json();
      if (json.url) window.location.href = json.url;
    } catch (err) {
      posthog.captureException(err);
      console.error("Portal error", err);
    } finally {
      setLoading(false);
    }
  };

  const trialActive = isTrialActive(trialEndsAt);
  const daysLeft = trialDaysLeft(trialEndsAt);
  const estRevenue = Math.round(totalClicks * avgPrice * 0.15);
  const isPaid = ["founding", "standard", "start", "grow", "scale"].includes(userPlan);
  const foundingSoldOut = spotsRemaining !== null && spotsRemaining <= 0;
  const activePlan: "founding" | "standard" = foundingSoldOut ? "standard" : "founding";

  const monthlyPrice = activePlan === "founding" ? 39 : 79;
  const annualTotal = activePlan === "founding" ? 390 : 756;
  const annualEquivStr = activePlan === "founding" ? "32.50" : "63";
  const displayedPriceStr = annual ? annualEquivStr : String(monthlyPrice);

  const isAr = lang === "ar";

  const features = isAr ? [
    "صفحات باقات غير محدودة",
    "جميع القوالب",
    "صندوق بريد العملاء (واتساب وماسنجر)",
    "تصدير العملاء (CSV)",
    "تاريخ تحليلات غير محدود",
    "نطاق مخصص",
    "كتابة محتوى بالذكاء الاصطناعي",
    "حتى عضوَين في الفريق",
  ] : [
    "Unlimited package pages",
    "All templates",
    "Lead inbox (WhatsApp & Messenger)",
    "Lead export (CSV)",
    "Unlimited analytics history",
    "Custom domain",
    "AI-powered content writing",
    "Up to 2 team members",
  ];

  const faqs = isAr ? [
    { q: "ماذا يحدث عند نفاد المقاعد التأسيسية؟", a: "بمجرد الاستفادة من جميع المقاعد الـ50، يرتفع السعر إلى 79€ شهرياً. يحتفظ الأعضاء المؤسسون بسعرهم للأبد." },
    { q: "هل سعري التأسيسي مثبّت للأبد؟", a: "نعم. لن يرتفع سعرك الشهري أو السنوي بغض النظر عن التغييرات المستقبلية في الأسعار." },
    { q: "ما ضمان الأداء بالتحديد؟", a: "إذا لم تحصل على أول عميل محتمل مؤهل خلال 30 يوماً مدفوعاً، نستردّ لك المبلغ كاملاً دون أسئلة." },
    { q: "هل يمكنني الإلغاء في أي وقت؟", a: "نعم. ألغِ من بوابة الفواتير في أي وقت. لا قيود ولا رسوم إلغاء." },
  ] : [
    { q: "What happens when Founding spots sell out?", a: "Once all 50 spots are claimed, the price increases to €79/month. Founding Members keep their rate for life." },
    { q: "Is my Founding rate locked forever?", a: "Yes. Your monthly or annual price will never increase, regardless of future pricing changes." },
    { q: "What exactly is the performance guarantee?", a: "If you don't receive your first qualified lead within 30 paid days, we refund you in full. No questions asked." },
    { q: "Can I cancel anytime?", a: "Yes. Cancel from your billing portal at any time. No lock-in, no cancellation fees." },
  ];

  return (
    <AppLayout>
      <div dir={dir} style={{ padding: isMobile ? "16px 16px 60px" : "28px 32px 80px", maxWidth: 640, margin: "0 auto" }}>

        {/* Trial / plan status banner */}
        <div style={{
          marginBottom: 28, padding: "14px 20px", borderRadius: 14,
          background: isPaid
            ? "linear-gradient(135deg, rgba(232,201,123,0.07), rgba(11,20,36,0.4))"
            : trialActive
              ? "linear-gradient(135deg, rgba(232,201,123,0.05), rgba(11,20,36,0.3))"
              : "rgba(255,80,80,0.06)",
          border: `1px solid ${isPaid ? "rgba(232,201,123,0.2)" : trialActive ? "rgba(232,201,123,0.15)" : "rgba(255,80,80,0.18)"}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: isPaid ? `${SAND}18` : trialActive ? `${SAND}12` : "rgba(255,80,80,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
            }}>
              {isPaid ? "✦" : trialActive ? "⏳" : "⚠️"}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: isPaid ? SAND : trialActive ? "#fff" : "#ff8080" }}>
                {isPaid
                  ? `${t.youreOnPlanPrefix} ${userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}${t.youreOnPlanSuffix ? ` ${t.youreOnPlanSuffix}` : ""}`
                  : trialActive
                    ? `${daysLeft} ${t.trialDaysLeftSuffix}`
                    : t.trialExpiredTitle
                }
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 2 }}>
                {isPaid
                  ? t.manageSubscription
                  : trialActive
                    ? t.trialSubscribeBeforeEnds
                    : t.trialSubscribeNowRestore
                }
              </div>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            {!isPaid && (
              <div style={{
                padding: "6px 14px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                background: trialActive ? `${SAND}20` : "rgba(255,80,80,0.12)",
                color: trialActive ? SAND : "#ff8080",
              }}>
                {trialActive
                  ? `${t.trialEndsOn} ${new Date(trialEndsAt!).toLocaleDateString(t.dateLocale, { day: "numeric", month: "short", year: "numeric" })}`
                  : t.trialExpiredBadge
                }
              </div>
            )}
            {isPaid && !!stripeCustomerId && (
              <button
                onClick={handleManage}
                disabled={loading}
                style={{
                  padding: "7px 16px", borderRadius: 99, fontSize: 12, fontWeight: 700,
                  background: `${SAND}18`, border: `1px solid ${SAND}40`, color: SAND,
                  cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
                }}
              >
                {loading ? t.redirectingBtn : t.manageSubscriptionBtn}
              </button>
            )}
          </div>
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
              { v: String(packageCount), l: t.packages },
              { v: totalViews.toLocaleString(), l: t.billingTotalViews },
              { v: String(totalClicks), l: t.billingDirectInquiries },
              { v: `€${estRevenue.toLocaleString()}`, l: t.billingEstRevenue, sub: t.billingConversionRate },
            ].map(({ v, l, sub }) => (
              <div key={l} style={{ padding: "18px 20px", background: "rgba(7,14,26,0.8)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                <Stat v={v} l={l} sub={sub} />
              </div>
            ))}
          </div>
        )}

        {/* Founding offer section */}
        <div style={{ marginBottom: 40 }}>

          {/* Eyebrow */}
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            {foundingSoldOut ? (
              <span style={{
                fontSize: 11, fontWeight: 800, padding: "3px 12px", borderRadius: 99,
                background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
                color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: ".5px",
              }}>
                {isAr ? "نفدت المقاعد التأسيسية" : "Founding spots sold out"}
              </span>
            ) : (
              <>
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: "3px 12px", borderRadius: 99,
                  background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
                  color: "#0a1426", textTransform: "uppercase", letterSpacing: ".5px",
                }}>
                  {isAr ? "عرض محدود" : "Limited Offer"}
                </span>
                {spotsRemaining !== null && (
                  <span style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", fontWeight: 500 }}>
                    {isAr
                      ? `${spotsRemaining} من 50 مقعداً متبقياً`
                      : `${spotsRemaining} of 50 spots remaining`
                    }
                  </span>
                )}
              </>
            )}
          </div>

          {/* Headline */}
          <h1 style={{
            margin: "0 0 6px", fontFamily: "'DM Serif Display', serif",
            fontSize: isMobile ? 30 : 38, letterSpacing: "-0.8px",
            color: "#fff", lineHeight: 1.15,
          }}>
            {foundingSoldOut
              ? (isAr ? "ابدأ مع الخطة القياسية" : "Get Started with Standard")
              : (isAr ? "كن عضواً مؤسساً" : "Become a Founding Member")
            }
          </h1>
          <p style={{ margin: "0 0 28px", fontSize: 14, color: "rgba(255,255,255,0.45)" }}>
            {foundingSoldOut
              ? (isAr ? "المقاعد التأسيسية نفدت. الأسعار القياسية تُطبَّق الآن." : "Founding spots are gone. Standard pricing now applies.")
              : (isAr ? "احجز أقل سعر — للأبد. يضمن لنا كل عضو مؤسس الاستمرار في البناء." : "Lock in the lowest price — forever. Every Founding Member helps us build.")
            }
          </p>

          {/* Monthly/annual toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
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
                  {isAnnual ? t.billingAnnual : t.billingMonthly}
                  {isAnnual && (
                    <span style={{
                      fontSize: 9.5, fontWeight: 800, padding: "2px 5px", borderRadius: 99,
                      background: annual ? "#0a1426" : "rgba(255,255,255,0.12)",
                      color: annual ? SAND : "rgba(255,255,255,0.5)",
                    }}>
                      {isAr ? "وفّر 17%" : "Save 17%"}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Pricing card */}
          <div style={{
            borderRadius: 20,
            border: `1.5px solid ${foundingSoldOut ? "rgba(255,255,255,0.1)" : "rgba(232,201,123,0.35)"}`,
            background: foundingSoldOut
              ? "rgba(255,255,255,0.02)"
              : "linear-gradient(160deg, rgba(232,201,123,0.07), rgba(11,20,36,0.5))",
            padding: "28px 28px 24px",
            position: "relative",
            marginBottom: 16,
          }}>
            {!foundingSoldOut && (
              <div style={{
                position: "absolute", top: -12, left: dir === "rtl" ? "auto" : 24, right: dir === "rtl" ? 24 : "auto",
                background: `linear-gradient(135deg, ${SAND}, #c4a84f)`,
                color: "#0a1426", fontSize: 10, fontWeight: 800,
                padding: "3px 14px", borderRadius: 99, letterSpacing: ".5px", whiteSpace: "nowrap",
              }}>
                {isAr ? "عضو مؤسس" : "FOUNDING MEMBER"}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: foundingSoldOut ? "rgba(255,255,255,0.7)" : SAND, marginBottom: 4 }}>
                  {foundingSoldOut
                    ? (isAr ? "قياسي" : "Standard")
                    : (isAr ? "تأسيسي" : "Founding")
                  }
                </div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
                  {foundingSoldOut
                    ? (isAr ? "للأعضاء الجدد" : "For new members")
                    : (isAr ? "مثبّت مدى الحياة · لن يرتفع أبداً" : "Locked in for life · Never increases")
                  }
                </div>
              </div>
              <div style={{ textAlign: dir === "rtl" ? "left" : "right" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3, justifyContent: dir === "rtl" ? "flex-start" : "flex-end" }}>
                  <span style={{ fontFamily: "'DM Serif Display', serif", fontSize: 42, letterSpacing: "-1px", color: "#fff", lineHeight: 1 }}>
                    €{displayedPriceStr}
                  </span>
                  <span style={{ fontSize: 14, color: "rgba(255,255,255,0.4)" }}>{t.billingPerMonth}</span>
                </div>
                {annual && (
                  <div style={{ fontSize: 11, color: SUCCESS, fontWeight: 600, marginTop: 3 }}>
                    {isAr ? `مدفوع €${annualTotal} سنوياً` : `billed €${annualTotal}/yr`}
                  </div>
                )}
                {!foundingSoldOut && !annual && (
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 3 }}>
                    {isAr ? "مقابل 79€/شهر للأعضاء الجدد" : "vs. €79/mo standard"}
                  </div>
                )}
              </div>
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", marginBottom: 20 }} />

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 20px", marginBottom: 24 }}>
              {features.map((f) => <FeatureRow key={f} label={f} />)}
            </div>

            {isPaid ? (
              <button
                onClick={handleManage}
                disabled={loading}
                style={{
                  width: "100%", padding: "13px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  border: `1px solid ${SAND}40`, background: `${SAND}18`, color: SAND,
                  cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                }}
              >
                {loading
                  ? <><span className="spinner" style={{ width: 13, height: 13 }} /> {t.redirectingBtn}</>
                  : t.manageSubscriptionBtn
                }
              </button>
            ) : (
              <button
                onClick={() => handleCheckout(activePlan)}
                disabled={loading}
                style={{
                  width: "100%", padding: "13px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  border: "none",
                  background: foundingSoldOut ? "rgba(255,255,255,0.08)" : `linear-gradient(135deg, ${SAND}, #c4a84f)`,
                  color: foundingSoldOut ? "rgba(255,255,255,0.75)" : "#0a1426",
                  cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  transition: "opacity 0.15s",
                }}
              >
                {loading
                  ? <><span className="spinner" style={{ width: 13, height: 13, borderTopColor: foundingSoldOut ? "#fff" : "#0a1426" }} /> {t.redirectingBtn}</>
                  : foundingSoldOut
                    ? (isAr ? "✦ ابدأ الآن" : "✦ Get Started")
                    : (isAr ? "✦ احجز مقعدك التأسيسي" : "✦ Claim Your Founding Spot")
                }
              </button>
            )}
          </div>

          {/* After-founding note */}
          {!foundingSoldOut && (
            <div style={{
              padding: "10px 16px", borderRadius: 10,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
                {isAr
                  ? `بعد نفاد المقاعد: 79€/شهر${annual ? " · 756€/سنة" : ""}`
                  : `After founding sells out: €79/mo${annual ? " · €756/yr annual" : ""}`
                }
              </span>
            </div>
          )}
        </div>

        {/* Performance guarantee */}
        <div style={{
          marginBottom: 40, padding: "20px 24px", borderRadius: 16,
          background: "rgba(45,212,160,0.05)",
          border: "1px solid rgba(45,212,160,0.2)",
          display: "flex", gap: 16, alignItems: "flex-start",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: "rgba(45,212,160,0.12)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, color: SUCCESS,
          }}>✓</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: SUCCESS, marginBottom: 5 }}>
              {isAr ? "ضمان الأداء" : "Performance Guarantee"}
            </div>
            <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.65 }}>
              {isAr
                ? "احصل على أول عميل محتمل مؤهل خلال 30 يوماً مدفوعاً — أو نستردّ لك المبلغ كاملاً دون أسئلة."
                : "Get your first qualified lead within 30 paid days — or we refund you in full. No questions asked."
              }
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>
            {isAr ? "أسئلة شائعة" : "Common questions"}
          </div>
          {faqs.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>

        {/* Fine print */}
        <div style={{ textAlign: "center", fontSize: 11.5, color: "rgba(255,255,255,0.3)", lineHeight: 1.8 }}>
          {isAr
            ? "ضمان عميل خلال 30 يوماً · إلغاء في أي وقت · دفع آمن عبر Stripe"
            : "30-day lead guarantee · Cancel anytime · Billed securely via Stripe"
          }<br />
          {t.billingFinePrint2}
        </div>

      </div>
    </AppLayout>
  );
}
