"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";

export default function PackagePage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!id || id === "undefined") {
        console.error("Invalid package id");
        setLoading(false);
        return;
      }

      try {
        const ref = doc(db, "packages", id);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          router.push("/builder");
          return;
        }

        setData({
          id: snap.id,
          ...snap.data(),
        });
      } catch (err) {
        console.error("Firestore error:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  if (loading) {
    return (
      <div className="p-10">
        Loading package...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-10">
        Package not found
      </div>
    );
  }

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">
        {data.destination}
      </h1>

      <p className="text-gray-600 mt-2">
        {data.price}
      </p>

      <p className="mt-4 whitespace-pre-line">
        {data.description}
      </p>
    </div>
  );
}