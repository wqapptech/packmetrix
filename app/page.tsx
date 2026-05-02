"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/Button";
import PreviewCard from "@/components/home/PreviewCard";
import PreviewSkeleton from "@/components/home/PreviewSkeleton";

type ExtractedPackage = {
  destination?: string;
  price?: string;
  description?: string;
  advantages?: string[];
  airports?: { name: string; price: string }[];
};

export default function Home() {
  const router = useRouter();

  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ExtractedPackage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleExtract = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setData(null);
    setError(null);

    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || "Extraction failed");
      }

      const json = await res.json();

      setData(json);

      // Save and redirect to builder
      localStorage.setItem("packageData", JSON.stringify(json));
      setTimeout(() => {
        router.push("/builder");
      }, 800); // small delay for UX
    } catch (err: any) {
      console.error("Extraction failed:", err);
      setError("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return (
    <main className="min-h-screen flex flex-col items-center px-6 pt-20">

      {/* Logo */}
      <h1 className="text-xl font-semibold mb-10">Packmetrix</h1>

      {/* Hero */}
      <div className="text-center max-w-2xl mb-10">
        <h2 className="text-5xl font-semibold tracking-tight mb-4">
          Turn Travel Posts into Bookings
        </h2>
        <p className="text-gray-600 text-lg">
          Paste your travel post and generate a high-converting package page in seconds.
        </p>
      </div>

      {/* Input */}
      <div className="max-w-2xl w-full">
        <textarea
          className="w-full h-40 p-4 rounded-2xl border border-gray-200
          focus:ring-2 focus:ring-indigo-500 outline-none"
          placeholder="Paste your Facebook or WhatsApp travel post..."
          value={text}
          onChange={(e) => setText(e.target.value)}
        />

        <div className="mt-4">
          <Button onClick={handleExtract} disabled={loading}>
            {loading ? "Analyzing your post..." : "Extract Package"}
          </Button>
        </div>

        {/* Error */}
        {error && (
          <p className="text-red-500 mt-4 text-sm">{error}</p>
        )}

        {/* RESULT */}
        <div className="mt-6">
          {loading && <PreviewSkeleton />}

          {!loading && data && (
            <PreviewCard data={data} />
          )}
        </div>
      </div>

    </main>
  );
}