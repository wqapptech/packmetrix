export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, userId, ...fields } = body;

    if (!id || !userId) {
      return NextResponse.json({ error: "Missing id or userId" }, { status: 400 });
    }

    const ref = db.collection("packages").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    if (snap.data()?.userId !== userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    await ref.update({
      destination:      fields.destination      || "",
      price:            fields.price            || "",
      title:            fields.title            || "",
      description:      fields.description      || "",
      nights:           fields.nights           || null,
      includes:         Array.isArray(fields.includes)     ? fields.includes     : [],
      excludes:         Array.isArray(fields.excludes)     ? fields.excludes     : [],
      hotelDescription: fields.hotelDescription || "",
      airports:         Array.isArray(fields.airports)     ? fields.airports     : [],
      itinerary:        Array.isArray(fields.itinerary)    ? fields.itinerary    : [],
      pricingTiers:     Array.isArray(fields.pricingTiers) ? fields.pricingTiers : [],
      cancellation:     fields.cancellation     || "",
      whatsapp:         fields.whatsapp         || "",
      messenger:        fields.messenger        || "",
      coverImage:       fields.coverImage       || "",
      images:           Array.isArray(fields.images) ? fields.images : [],
      videoUrl:         fields.videoUrl         || "",
      language:         fields.language === "ar" ? "ar" : "en",
      updatedAt:        Date.now(),
    });

    return NextResponse.json({ id });
  } catch (err: any) {
    console.error("update-package error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
