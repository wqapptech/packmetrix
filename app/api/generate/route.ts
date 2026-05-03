import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      destination,
      price,
      description,
      advantages,
      airports,
      userId,
      nights,
      includes,
      excludes,
      itinerary,
      pricingTiers,
      cancellation,
      whatsapp,
      messenger,
    } = body;

    // -----------------------------
    // VALIDATION (IMPORTANT)
    // -----------------------------
    if (!userId) {
      return NextResponse.json(
        { error: "Missing userId" },
        { status: 400 }
      );
    }

    if (!destination || !price) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // -----------------------------
    // CREATE PACKAGE
    // -----------------------------
    const docRef = await db.collection("packages").add({
      userId,
      destination,
      price,
      description: description || "",
      advantages: Array.isArray(advantages) ? advantages : [],
      airports: Array.isArray(airports) ? airports : [],
      nights: nights || null,
      includes: Array.isArray(includes) ? includes : [],
      excludes: Array.isArray(excludes) ? excludes : [],
      itinerary: Array.isArray(itinerary) ? itinerary : [],
      pricingTiers: Array.isArray(pricingTiers) ? pricingTiers : [],
      cancellation: cancellation || "",
      whatsapp: whatsapp || "",
      messenger: messenger || "",

      views: 0,
      whatsappClicks: 0,
      messengerClicks: 0,

      createdAt: Date.now(),
    });

    // -----------------------------
    // SAFE RESPONSE
    // -----------------------------
    return NextResponse.json({
      id: docRef.id,
    });
  } catch (err: any) {
    console.error("generate-package error:", err);

    // NEVER LET NEXT.JS RETURN HTML ERROR PAGE
    return NextResponse.json(
      {
        error: err?.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}