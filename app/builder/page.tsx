"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { auth, db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";

import Button from "@/components/ui/Button";
import PreviewCard from "@/components/home/PreviewCard";

type PackageForm = {
  destination: string;
  price: string;
  description: string;
  advantages: string[];
  airports: { name: string; price: string }[];
  whatsapp?: string;
  messenger?: string;
};

export default function BuilderPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [usage, setUsage] = useState<any>(null);

  const [form, setForm] = useState<PackageForm>({
    destination: "",
    price: "",
    description: "",
    advantages: [],
    airports: [],
  });

  // -----------------------------
  // AUTH SAFE INIT
  // -----------------------------
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        router.push("/login");
        return;
      }

      setUser(u);

      // load user doc
      const ref = doc(db, "users", u.uid);
      const snap = await getDoc(ref);

      if (snap.exists()) {
        setUsage(snap.data());
      } else {
        await setDoc(ref, {
          plan: "free",
          packagesUsed: 0,
          aiLimit: 10,
          createdAt: Date.now(),
        });

        setUsage({
          plan: "free",
          packagesUsed: 0,
          aiLimit: 10,
        });
      }

      setAuthLoading(false);
    });

    return () => unsub();
  }, [router]);

  // -----------------------------
  // LIMIT CHECK (SAFE)
  // -----------------------------
  const isBlocked = false
   /*  usage?.plan === "free" &&
    (usage?.packagesUsed || 0) >= 3; */

  // -----------------------------
  // AI EXTRACT
  // -----------------------------
  const handleExtract = async () => {
    if (!text.trim()) return;

    setLoading(true);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      const json = await res.json();

      setForm((prev) => ({
        ...prev,
        ...json,
      }));
    } catch (err) {
      console.error("Extract failed:", err);
    }

    setLoading(false);
  };

  // -----------------------------
  // CREATE PACKAGE
  // -----------------------------
  const handleCreate = async () => {
    if (!user) {
      router.push("/login");
      return;
    }

    if (!form.destination || !form.price) {
      setError("Destination and price are required.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...form, userId: user.uid }),
      });

      const json = await res.json();

      if (!res.ok || !json.id) {
        setError(json.error || "Something went wrong. Please try again.");
        return;
      }

      // SAFE increment
      const ref = doc(db, "users", user.uid);
      await updateDoc(ref, {
        packagesUsed: increment(1),
      });

      router.push(`/p/${json.id}`);
    } catch (err) {
      console.error("Create failed:", err);
    }

    setLoading(false);
  };

  // -----------------------------
  // LOADING STATE
  // -----------------------------
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">
          Loading builder...
        </p>
      </div>
    );
  }

  // -----------------------------
  // PAYWALL
  // -----------------------------
  if (isBlocked) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center p-10">

        <h1 className="text-2xl font-bold">
          Free limit reached 🚫
        </h1>

        <p className="text-gray-500 mt-2">
          Upgrade to Pro to unlock unlimited packages
        </p>

        <button
          onClick={async () => {
            const res = await fetch(
              "/api/stripe/checkout",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  userId: user.uid,
                }),
              }
            );

            const data = await res.json();
            window.location.href = data.url;
          }}
          className="mt-6 bg-black text-white px-6 py-3 rounded-xl"
        >
          Upgrade to Pro
        </button>

      </div>
    );
  }

  // -----------------------------
  // UI
  // -----------------------------
  return (
    <div className="min-h-screen p-10 bg-gray-50">

      <h1 className="text-2xl font-bold mb-6">
        Package Builder
      </h1>

      <textarea
        className="w-full h-40 p-4 border rounded-xl"
        placeholder="Paste your travel post..."
        value={text}
        onChange={(e) => setText(e.target.value)}
      />

      <Button onClick={handleExtract} disabled={loading}>
        {loading ? "Processing..." : "Extract"}
      </Button>

      <div className="mt-6 space-y-4">

        <input
          className="w-full p-3 border rounded-xl"
          placeholder="Destination"
          value={form.destination}
          onChange={(e) =>
            setForm({
              ...form,
              destination: e.target.value,
            })
          }
        />

        <input
          className="w-full p-3 border rounded-xl"
          placeholder="Price"
          value={form.price}
          onChange={(e) =>
            setForm({ ...form, price: e.target.value })
          }
        />

        <textarea
          className="w-full p-3 border rounded-xl h-32"
          placeholder="Description"
          value={form.description}
          onChange={(e) =>
            setForm({
              ...form,
              description: e.target.value,
            })
          }
        />

      </div>

      {error && (
        <p className="mt-4 text-red-500 text-sm">{error}</p>
      )}

      <div className="mt-2">
        <Button onClick={handleCreate}>
          Generate Landing Page
        </Button>
      </div>

      <div className="mt-10">
        <PreviewCard data={form} />
      </div>

    </div>
  );
}