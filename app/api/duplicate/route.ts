export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { packageId, userId } = await req.json();

    if (!packageId || !userId) {
      return NextResponse.json({ error: "Missing packageId or userId" }, { status: 400 });
    }

    const snap = await db.collection("packages").doc(packageId).get();
    if (!snap.exists) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }

    const data = snap.data()!;
    if (data.userId !== userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id: _id, ...rest } = data as Record<string, unknown>;
    const title = typeof rest.title === "string" && rest.title
      ? `${rest.title} (Copy)`
      : typeof rest.destination === "string" && rest.destination
        ? `${rest.destination} (Copy)`
        : "Package (Copy)";

    const docRef = await db.collection("packages").add({
      ...rest,
      title,
      isActive: false,
      views: 0,
      whatsappClicks: 0,
      messengerClicks: 0,
      createdAt: Date.now(),
    });

    return NextResponse.json({ id: docRef.id, agencySlug: data.agencySlug ?? "" });
  } catch (err: any) {
    console.error("duplicate-package error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
