"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import AppLayout from "@/components/AppLayout";
import { T } from "@/lib/translations";
import { useLang } from "@/hooks/useLang";

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
  const lang = useLang();
  const t = T[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

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
      <div dir={dir} style={{ padding: "28px 32px 60px", maxWidth: 1240 }}>

        {/* Page head */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.4px" }}>{t.billingTitle}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", marginTop: 4 }}>
            {t.freePlanLabel} · {packageCount} {t.billingDescPackage !== t.billingDescPackages ? (packageCount === 1 ? t.billingDescPackage : t.billingDescPackages) : t.billingDescPackages} / 3
          </div>
        </div>

        {/* Hero paywall card */}
        <div style={{
          background: "linear-gradient(160deg, rgba(232,201,123,0.06), rgba(11,20,36,0.6))",
          border: "1px solid rgba(232,201,123,0.22)",
          borderRadius: 24, padding: "40px 44px", position: "relative", overflow: "hidden",
          marginBottom: 20,
        }}>
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
                {t.billingGettingResults}
              </div>

              <h1 style={{ fontFamily: "'DM Serif Display', serif", fontSize: 48, lineHeight: 1.05, letterSpacing: "-1px", marginBottom: 16 }}>
                {t.billingH1a} <em style={{ color: SAND, fontStyle: "italic" }}>{t.billingH1em}</em><br />
                {t.billingH1b}
              </h1>

              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.6)", lineHeight: 1.65, maxWidth: 480, marginBottom: 32 }}>
                {packageCount > 0 ? (
                  <>
                    {t.billingDescA} {packageCount} {packageCount !== 1 ? t.billingDescPackages : t.billingDescPackage},{" "}
                    {t.billingDescViews.replace("{n}", totalViews.toLocaleString())}{" "}
                    {t.billingDescDriven} {totalClicks} {t.billingDescWA}{" "}
                    <b style={{ color: "#fff" }}>€{estRevenue.toLocaleString()} {t.billingDescRevenue}</b>{" "}
                    {t.billingDescFree}
                  </>
                ) : t.billingDescNew}
              </p>

              {/* Stats */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 10, marginBottom: 32 }}>
                <Stat v={String(packageCount)} l={t.statPackagesLive} sub={t.statFreeLimit} />
                <Stat v={totalClicks.toLocaleString()} l={t.statLeadsGenerated} />
                <Stat v={totalViews > 0 ? `${((totalClicks / totalViews) * 100).toFixed(1)}%` : "—"} l={t.statConversionBilling} sub={t.statIndustryAvg} />
                <Stat v={`€${estRevenue.toLocaleString()}`} l={t.statRevenue} />
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
                    ? <><span className="spinner" style={{ width: 15, height: 15, borderTopColor: "#0a1426" }} /> {t.redirectingBtn}</>
                    : t.upgradeBtn
                  }
                </button>
                <button onClick={() => router.back()} style={{ padding: "14px 22px", borderRadius: 10, background: "none", border: "1px solid rgba(255,255,255,0.14)", color: "rgba(255,255,255,0.6)", fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit" }}>
                  {t.maybeLater}
                </button>
              </div>
              <div style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)" }}>
                {t.billingCancelNote}
              </div>
            </div>

            {/* Right — unlock list */}
            <div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", textTransform: "uppercase", letterSpacing: ".7px", fontWeight: 700, marginBottom: 16 }}>{t.whatUnlocksPro}</div>
              <UnlockRow icon="∞" title={t.unlockPackages} sub={`${t.billingDescA} ${packageCount}/3`} />
              <UnlockRow icon="✦" title={t.unlockAiOpts} sub={t.unlockAiOptsLeft} />
              <UnlockRow icon="🎯" title={t.unlockAB} sub={t.unlockABSub} />
              <UnlockRow icon="📊" title={t.unlockAnalytics} sub={t.unlockAnalyticsSub} />
              <UnlockRow icon="🌍" title={t.unlockMultilang} sub={t.unlockMultilangSub} />
              <UnlockRow icon="↗" title={t.unlockDomain} sub={t.unlockDomainSub} />
              <UnlockRow icon="💬" title={t.unlockWhatsAppBiz} sub={t.unlockWhatsAppBizSub} />
              <UnlockRow icon="👤" title={t.unlockSeats} />
            </div>
          </div>
        </div>

        {/* Usage bar */}
        <div style={{ background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 14, padding: "20px 22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700 }}>{t.freeUsageTitle}</div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 2 }}>
                {packageCount} / 3 {t.billingDescPackages} · 5 / 10 {t.unlockAiOpts.toLowerCase()}
              </div>
            </div>
            <button onClick={handleUpgrade} style={{ padding: "7px 14px", borderRadius: 8, background: "none", border: `1px solid ${SAND}50`, color: SAND, fontSize: 12, fontWeight: 600, fontFamily: "inherit", cursor: "pointer" }}>
              {t.upgradeProArrow}
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
