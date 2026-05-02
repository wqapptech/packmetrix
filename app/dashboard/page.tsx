"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

import {
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";

import AnalyticsCharts from "@/components/dashboard/AnalyticsCharts";

type Package = {
  id: string;
  userId: string;

  destination: string;
  price: string;

  views: number;
  whatsappClicks: number;
  messengerClicks: number;

  aiInsights?: {
    text: string;
    updatedAt: number;
  };
};

export default function Dashboard() {
  const router = useRouter();

  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const [lastGenerated, setLastGenerated] = useState<
    Record<string, number>
  >({});

  // -----------------------------
  // AUTH GUARD (FIXED)
  // -----------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.uid);
      setAuthLoading(false);
    });

    return () => unsub();
  }, [router]);

  // -----------------------------
  // LOAD PACKAGES (SAFE)
  // -----------------------------
  useEffect(() => {
    if (!userId || authLoading) return;

    const load = async () => {
      setLoading(true);

      const q = query(
        collection(db, "packages"),
        where("userId", "==", userId)
      );

      const snap = await getDocs(q);

      const data: Package[] = snap.docs.map((d) => ({
        id: d.id,
        ...(d.data() as any),
      }));

      setPackages(data);
      setLoading(false);
    };

    load();
  }, [userId, authLoading]);

  // -----------------------------
  // KPI METRICS
  // -----------------------------
  const totalViews = packages.reduce(
    (a, b) => a + (b.views || 0),
    0
  );

  const totalWhatsApp = packages.reduce(
    (a, b) => a + (b.whatsappClicks || 0),
    0
  );

  const totalMessenger = packages.reduce(
    (a, b) => a + (b.messengerClicks || 0),
    0
  );

  const totalClicks = totalWhatsApp + totalMessenger;

  const conversionRate =
    totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;

  // -----------------------------
  // LOADING STATE (AUTH FIRST)
  // -----------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">
          Checking authentication...
        </p>
      </div>
    );
  }

  if (!userId) return null;

  // -----------------------------
  // AI INSIGHTS GENERATION
  // -----------------------------
  const generateInsights = async (pkg: Package) => {
    try {
      const now = Date.now();

      const last = lastGenerated[pkg.id] || 0;

      if (now - last < 60000) {
        alert("Please wait before regenerating insights.");
        return;
      }

      setGeneratingId(pkg.id);

      const res = await fetch("/api/ai/insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId,
          destination: pkg.destination,
          price: pkg.price,
          views: pkg.views,
          whatsappClicks: pkg.whatsappClicks,
          messengerClicks: pkg.messengerClicks,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "AI failed");
      }

      await fetch("/api/save-insights", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: pkg.id,
          text: data.text,
        }),
      });

      setPackages((prev) =>
        prev.map((p) =>
          p.id === pkg.id
            ? {
                ...p,
                aiInsights: {
                  text: data.text,
                  updatedAt: Date.now(),
                },
              }
            : p
        )
      );

      setLastGenerated((prev) => ({
        ...prev,
        [pkg.id]: now,
      }));
    } catch (err) {
      console.error("AI generation failed:", err);
    } finally {
      setGeneratingId(null);
    }
  };

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="min-h-screen bg-gray-50 p-8">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-8">

        <div>
          <h1 className="text-2xl font-bold">
            Agency Dashboard
          </h1>

          <p className="text-sm text-gray-500">
            AI-powered performance intelligence system
          </p>
        </div>

        <button
          onClick={() => router.push("/builder")}
          className="bg-black text-white px-5 py-2 rounded-xl"
        >
          + New Package
        </button>

      </div>

      {/* KPI CARDS */}
      <div className="grid grid-cols-4 gap-4 mb-10">

        <Kpi label="Views" value={totalViews} />
        <Kpi label="WhatsApp" value={totalWhatsApp} />
        <Kpi label="Messenger" value={totalMessenger} />
        <Kpi
          label="Conversion %"
          value={conversionRate.toFixed(1)}
        />

      </div>

      {/* CHARTS */}
      <div className="mb-10">
        <AnalyticsCharts packages={packages} />
      </div>

      {/* PACKAGES */}
      <div className="bg-white rounded-2xl p-6 border">

        <h2 className="text-lg font-semibold mb-6">
          Your Packages
        </h2>

        {loading ? (
          <p>Loading...</p>
        ) : packages.length === 0 ? (
          <p className="text-gray-500">
            No packages created yet
          </p>
        ) : (
          <div className="space-y-6">

            {packages.map((p) => {
              const clicks =
                (p.whatsappClicks || 0) +
                (p.messengerClicks || 0);

              const ctr =
                p.views > 0
                  ? (clicks / p.views) * 100
                  : 0;

              return (
                <div
                  key={p.id}
                  className="border-b pb-6"
                >

                  <div className="flex justify-between">

                    <div>
                      <p className="font-semibold">
                        {p.destination}
                      </p>

                      <p className="text-sm text-gray-500">
                        {p.price}
                      </p>
                    </div>

                    <div className="text-sm text-gray-600 flex gap-4">
                      <span>👀 {p.views}</span>
                      <span>💬 {clicks}</span>
                      <span>
                        📊 {ctr.toFixed(1)}%
                      </span>
                    </div>

                  </div>

                  {/* AI INSIGHTS */}
                  <div className="mt-4 bg-indigo-50 p-4 rounded-xl">

                    <div className="flex justify-between items-center mb-2">

                      <p className="text-xs font-semibold text-indigo-700">
                        AI Insight
                      </p>

                      <button
                        onClick={() =>
                          generateInsights(p)
                        }
                        disabled={generatingId === p.id}
                        className="text-xs text-indigo-600 font-medium disabled:opacity-50"
                      >
                        {generatingId === p.id
                          ? "Analyzing..."
                          : p.aiInsights
                          ? "Regenerate AI"
                          : "Generate AI"}
                      </button>

                    </div>

                    <p className="text-xs text-gray-700 whitespace-pre-line">
                      {p.aiInsights?.text?.trim()
                        ? p.aiInsights.text
                        : "No AI insights yet — generate them to improve conversions."}
                    </p>

                  </div>

                  <div className="mt-3">
                    <button
                      onClick={() =>
                        router.push(`/p/${p.id}`)
                      }
                      className="text-indigo-600 text-sm"
                    >
                      View Landing Page →
                    </button>
                  </div>

                </div>
              );
            })}

          </div>
        )}

      </div>

    </div>
  );
}

// -----------------------------
// KPI COMPONENT
// -----------------------------
function Kpi({
  label,
  value,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="bg-white p-5 rounded-2xl border">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}