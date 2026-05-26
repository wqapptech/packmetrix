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
import {
  DA_BG, DA_SURFACE, DA_SURFACE2, DA_INK1, DA_INK2, DA_INK3,
  DA_RULE, DA_RULE2, DA_GOLD, DA_GOLD_DEEP, DA_GOLD_SOFT,
  DA_GREEN, DA_GREEN_SOFT, DA_DANGER, DA_DANGER_SOFT,
} from "@/lib/tokens";

type TDict = typeof T["en"];

const DISPLAY = `var(--font-instrument-serif), Georgia, serif`;
const SANS = `var(--font-inter-tight), system-ui, sans-serif`;

function parsePackagePrice(s: string): number {
  const n = parseFloat(s.replace(/[^\d.]/g, ""));
  return n > 10 ? n : 0;
}

function Stat({ v, l, sub }: { v: string; l: string; sub?: string }) {
  return (
    <div>
      <div style={{ fontFamily: DISPLAY, fontSize: 28, color: DA_GOLD, letterSpacing: "-0.5px", lineHeight: 1 }}>{v}</div>
      <div style={{ fontSize: 11, color: DA_INK3, marginTop: 5, fontWeight: 600, textTransform: "uppercase", letterSpacing: ".4px" }}>{l}</div>
      {sub && <div style={{ fontSize: 10, color: DA_INK3, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function FeatureRow({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "center", padding: "5px 0" }}>
      <div style={{
        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
        background: DA_GOLD_SOFT,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 9, color: DA_GOLD,
      }}>✓</div>
      <span style={{ fontSize: 13, color: DA_INK2 }}>{label}</span>
    </div>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      style={{ borderBottom: `1px solid ${DA_RULE}`, padding: "14px 0", cursor: "pointer" }}
      onClick={() => setOpen(!open)}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: DA_INK1 }}>{q}</span>
        <span style={{
          fontSize: 18, color: DA_INK3, flexShrink: 0,
          transform: open ? "rotate(45deg)" : "none", transition: "transform 0.15s", display: "inline-block",
        }}>+</span>
      </div>
      {open && (
        <div style={{ fontSize: 13, color: DA_INK2, marginTop: 8, lineHeight: 1.65 }}>{a}</div>
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

  if (!userId) {
    return (
      <AppLayout>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
          <span className="spinner-warm" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div dir={dir} style={{ background: DA_BG, padding: isMobile ? "16px 16px 60px" : "28px 32px 80px", maxWidth: 640, margin: "0 auto" }}>

        {/* Trial / plan status banner */}
        <div style={{
          marginBottom: 28, padding: "14px 20px", borderRadius: 14,
          background: isPaid
            ? DA_GOLD_SOFT
            : trialActive
              ? DA_SURFACE
              : DA_DANGER_SOFT,
          border: isPaid
            ? `1px solid ${DA_RULE2}`
            : trialActive
              ? `1px solid ${DA_RULE}`
              : `1px solid ${DA_DANGER}`,
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10, flexShrink: 0,
              background: isPaid ? DA_GOLD_SOFT : trialActive ? DA_BG : DA_DANGER_SOFT,
              display: "flex", alignItems: "center", justifyContent: "center", fontSize: 17,
            }}>
              {isPaid ? "✦" : trialActive ? "⏳" : "⚠️"}
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: isPaid ? DA_GOLD : trialActive ? DA_INK1 : DA_DANGER }}>
                {isPaid
                  ? `${t.youreOnPlanPrefix} ${userPlan.charAt(0).toUpperCase() + userPlan.slice(1)}${t.youreOnPlanSuffix ? ` ${t.youreOnPlanSuffix}` : ""}`
                  : trialActive
                    ? `${daysLeft} ${t.trialDaysLeftSuffix}`
                    : t.trialExpiredTitle
                }
              </div>
              <div style={{ fontSize: 12, color: DA_INK3, marginTop: 2 }}>
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
                background: trialActive ? DA_GOLD_SOFT : DA_DANGER_SOFT,
                color: trialActive ? DA_GOLD : DA_DANGER,
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
                  background: DA_GOLD_SOFT, border: `1px solid ${DA_RULE2}`, color: DA_GOLD,
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
            background: DA_RULE, borderRadius: 14, overflow: "hidden",
            border: `1px solid ${DA_RULE}`,
          }}>
            {[
              { v: String(packageCount), l: t.packages },
              { v: totalViews.toLocaleString(), l: t.billingTotalViews },
              { v: String(totalClicks), l: t.billingDirectInquiries },
              { v: `€${estRevenue.toLocaleString()}`, l: t.billingEstRevenue, sub: t.billingConversionRate },
            ].map(({ v, l, sub }) => (
              <div key={l} style={{ padding: "18px 20px", background: DA_SURFACE, borderRight: `1px solid ${DA_RULE}` }}>
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
                background: DA_SURFACE, border: `1px solid ${DA_RULE2}`,
                color: DA_INK3, textTransform: "uppercase", letterSpacing: ".5px",
              }}>
                {isAr ? "نفدت المقاعد التأسيسية" : "Founding spots sold out"}
              </span>
            ) : (
              <>
                <span style={{
                  fontSize: 11, fontWeight: 800, padding: "3px 12px", borderRadius: 999,
                  background: DA_GOLD,
                  color: "#fff", textTransform: "uppercase", letterSpacing: ".5px",
                }}>
                  {isAr ? "عرض محدود" : "Limited Offer"}
                </span>
                {spotsRemaining !== null && (
                  <span style={{ fontSize: 12, color: DA_INK3, fontWeight: 500 }}>
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
            margin: "0 0 6px", fontFamily: DISPLAY,
            fontSize: isMobile ? 30 : 38, letterSpacing: "-0.8px",
            color: DA_INK1, lineHeight: 1.15,
          }}>
            {foundingSoldOut
              ? (isAr ? "ابدأ مع الخطة القياسية" : "Get Started with Standard")
              : (isAr ? "كن عضواً مؤسساً" : "Become a Founding Member")
            }
          </h1>
          <p style={{ margin: "0 0 28px", fontSize: 14, color: DA_INK3 }}>
            {foundingSoldOut
              ? (isAr ? "المقاعد التأسيسية نفدت. الأسعار القياسية تُطبَّق الآن." : "Founding spots are gone. Standard pricing now applies.")
              : (isAr ? "احجز أقل سعر — للأبد. يضمن لنا كل عضو مؤسس الاستمرار في البناء." : "Lock in the lowest price — forever. Every Founding Member helps us build.")
            }
          </p>

          {/* Monthly/annual toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24 }}>
            <div style={{
              display: "inline-flex", alignItems: "center",
              background: DA_SURFACE, border: `1px solid ${DA_RULE}`,
              borderRadius: 10, padding: 4, gap: 2,
            }}>
              {[false, true].map(isAnnual => (
                <button
                  key={String(isAnnual)}
                  onClick={() => setAnnual(isAnnual)}
                  style={{
                    padding: "6px 14px", borderRadius: 7, fontSize: 12, fontWeight: 700,
                    border: "none", cursor: "pointer", fontFamily: "inherit",
                    background: annual === isAnnual
                      ? (isAnnual ? DA_GOLD : DA_SURFACE2)
                      : "transparent",
                    color: annual === isAnnual
                      ? (isAnnual ? "#fff" : DA_INK1)
                      : DA_INK3,
                    display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s",
                  }}
                >
                  {isAnnual ? t.billingAnnual : t.billingMonthly}
                  {isAnnual && (
                    <span style={{
                      fontSize: 9.5, fontWeight: 800, padding: "2px 5px", borderRadius: 99,
                      background: DA_GOLD_SOFT,
                      color: DA_GOLD,
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
            border: foundingSoldOut ? `1px solid ${DA_RULE}` : `1.5px solid ${DA_GOLD}`,
            background: foundingSoldOut ? DA_SURFACE : DA_GOLD_SOFT,
            padding: "28px 28px 24px",
            position: "relative",
            marginBottom: 16,
          }}>
            {!foundingSoldOut && (
              <div style={{
                position: "absolute", top: -12, left: dir === "rtl" ? "auto" : 24, right: dir === "rtl" ? 24 : "auto",
                background: DA_GOLD,
                color: "#fff", fontSize: 10, fontWeight: 800,
                padding: "3px 14px", borderRadius: 99, letterSpacing: ".5px", whiteSpace: "nowrap",
              }}>
                {isAr ? "عضو مؤسس" : "FOUNDING MEMBER"}
              </div>
            )}

            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: foundingSoldOut ? DA_INK2 : DA_GOLD, marginBottom: 4 }}>
                  {foundingSoldOut
                    ? (isAr ? "قياسي" : "Standard")
                    : (isAr ? "تأسيسي" : "Founding")
                  }
                </div>
                <div style={{ fontSize: 12, color: DA_INK3 }}>
                  {foundingSoldOut
                    ? (isAr ? "للأعضاء الجدد" : "For new members")
                    : (isAr ? "مثبّت مدى الحياة · لن يرتفع أبداً" : "Locked in for life · Never increases")
                  }
                </div>
              </div>
              <div style={{ textAlign: dir === "rtl" ? "left" : "right" }}>
                <div style={{ display: "flex", alignItems: "baseline", gap: 3, justifyContent: dir === "rtl" ? "flex-start" : "flex-end" }}>
                  <span style={{ fontFamily: DISPLAY, fontSize: 42, letterSpacing: "-1px", color: DA_INK1, lineHeight: 1 }}>
                    €{displayedPriceStr}
                  </span>
                  <span style={{ fontSize: 14, color: DA_INK3 }}>{t.billingPerMonth}</span>
                </div>
                {annual && (
                  <div style={{ fontSize: 11, color: DA_GREEN, fontWeight: 600, marginTop: 3 }}>
                    {isAr ? `مدفوع €${annualTotal} سنوياً` : `billed €${annualTotal}/yr`}
                  </div>
                )}
                {!foundingSoldOut && !annual && (
                  <div style={{ fontSize: 11, color: DA_INK3, marginTop: 3 }}>
                    {isAr ? "مقابل 79€/شهر للأعضاء الجدد" : "vs. €79/mo standard"}
                  </div>
                )}
              </div>
            </div>

            <div style={{ height: 1, background: DA_RULE, marginBottom: 20 }} />

            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: "0 20px", marginBottom: 24 }}>
              {features.map((f) => <FeatureRow key={f} label={f} />)}
            </div>

            {isPaid ? (
              <button
                onClick={handleManage}
                disabled={loading}
                style={{
                  width: "100%", padding: "13px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  border: `1px solid ${DA_RULE2}`, background: DA_SURFACE, color: DA_GOLD,
                  cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                }}
              >
                {loading
                  ? <><span className="spinner-warm" style={{ width: 13, height: 13 }} /> {t.redirectingBtn}</>
                  : t.manageSubscriptionBtn
                }
              </button>
            ) : (
              <button
                onClick={() => handleCheckout(activePlan)}
                disabled={loading}
                style={{
                  width: "100%", padding: "13px", borderRadius: 10, fontSize: 14, fontWeight: 700,
                  border: foundingSoldOut ? `1px solid ${DA_RULE}` : "none",
                  background: foundingSoldOut ? DA_SURFACE : DA_GOLD,
                  color: foundingSoldOut ? DA_INK1 : "#fff",
                  cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                  transition: "opacity 0.15s",
                }}
              >
                {loading
                  ? <><span className="spinner-warm" style={{ width: 13, height: 13, borderTopColor: foundingSoldOut ? DA_INK1 : "#fff" }} /> {t.redirectingBtn}</>
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
              background: DA_BG,
              border: `1px solid ${DA_RULE}`,
            }}>
              <span style={{ fontSize: 12, color: DA_INK3 }}>
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
          background: DA_GREEN_SOFT,
          border: `1px solid ${DA_GREEN}`,
          display: "flex", gap: 16, alignItems: "flex-start",
        }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10, flexShrink: 0,
            background: DA_GREEN_SOFT,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 18, color: DA_GREEN,
          }}>✓</div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: DA_GREEN, marginBottom: 5 }}>
              {isAr ? "ضمان الأداء" : "Performance Guarantee"}
            </div>
            <div style={{ fontSize: 13, color: DA_INK2, lineHeight: 1.65 }}>
              {isAr
                ? "احصل على أول عميل محتمل مؤهل خلال 30 يوماً مدفوعاً — أو نستردّ لك المبلغ كاملاً دون أسئلة."
                : "Get your first qualified lead within 30 paid days — or we refund you in full. No questions asked."
              }
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: SANS, fontSize: 15, fontWeight: 600, color: DA_INK1, marginBottom: 4 }}>
            {isAr ? "أسئلة شائعة" : "Common questions"}
          </div>
          {faqs.map((item) => (
            <FaqItem key={item.q} q={item.q} a={item.a} />
          ))}
        </div>

        {/* Fine print */}
        <div style={{ textAlign: "center", fontSize: 11.5, color: DA_INK3, lineHeight: 1.8 }}>
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
