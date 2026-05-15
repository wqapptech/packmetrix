export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const { packageId, name, rating, text } = await req.json();

    if (!packageId || !name?.trim() || !text?.trim()) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const ratingNum = Number(rating);
    if (!Number.isFinite(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }

    const pkgRef = db.collection("packages").doc(packageId);
    const pkgSnap = await pkgRef.get();
    if (!pkgSnap.exists) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const review = {
      id: crypto.randomUUID(),
      name: String(name).trim().slice(0, 100),
      text: String(text).trim().slice(0, 1000),
      rating: Math.round(ratingNum),
      createdAt: Date.now(),
    };

    await pkgRef.update({ reviews: FieldValue.arrayUnion(review) });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("submit-review error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
