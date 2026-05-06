import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const { packageId, sessionId, source } = await req.json();

    if (!packageId || !sessionId || !source) {
      return NextResponse.json({ error: "Missing packageId, sessionId, or source" }, { status: 400 });
    }
    if (source !== "whatsapp" && source !== "messenger") {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }

    // Dedup: one lead per session per package
    const existing = await db.collection("leads")
      .where("sessionId", "==", sessionId)
      .where("packageId", "==", packageId)
      .limit(1)
      .get();

    if (!existing.empty) {
      await existing.docs[0].ref.update({ updatedAt: Date.now() });
      return NextResponse.json({ skipped: true });
    }

    const pkgSnap = await db.collection("packages").doc(packageId).get();
    if (!pkgSnap.exists) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 });
    }
    const pkg = pkgSnap.data()!;

    const now = Date.now();
    await db.collection("leads").add({
      packageId,
      sessionId,
      userId: pkg.userId,
      destination: pkg.destination || "",
      price: pkg.price || "",
      source,
      channel: source,
      status: "new",
      createdAt: now,
      updatedAt: now,
    });

    const field = source === "whatsapp" ? "whatsappClicks" : "messengerClicks";
    await db.collection("packages").doc(packageId).update({ [field]: FieldValue.increment(1) });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("track-click error:", err);
    return NextResponse.json({ error: "Failed to track" }, { status: 500 });
  }
}
