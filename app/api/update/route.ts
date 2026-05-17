export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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

    const userSnap = await db.collection("users").doc(userId).get();
    const userData = userSnap.exists ? userSnap.data()! : {};
    const agencyName = userData.name || "";
    const emailPrefix = slugify((userData.email || "").split("@")[0]);
    const agencySlug = slugify(agencyName) || emailPrefix || userId.slice(0, 8).toLowerCase();

    await ref.update({
      agencySlug,
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

    return NextResponse.json({ id, agencySlug });
  } catch (err: any) {
    console.error("update-package error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
