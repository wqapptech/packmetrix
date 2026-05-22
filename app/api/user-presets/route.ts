export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

// GET /api/user-presets?userId=xxx
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    const snap = await db
      .collection("userPresets")
      .where("userId", "==", userId)
      .orderBy("createdAt", "desc")
      .get();

    const presets = snap.docs.map((d: FirebaseFirestore.QueryDocumentSnapshot) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ presets });
  } catch (err: any) {
    console.error("user-presets GET error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

// POST /api/user-presets — save a new template
export async function POST(req: Request) {
  try {
    const { userId, name, sections } = await req.json();
    if (!userId || !name?.trim()) {
      return NextResponse.json({ error: "Missing userId or name" }, { status: 400 });
    }
    if (!Array.isArray(sections)) {
      return NextResponse.json({ error: "sections must be an array" }, { status: 400 });
    }

    const docRef = await db.collection("userPresets").add({
      userId,
      name: name.trim(),
      sections,
      createdAt: Date.now(),
    });

    return NextResponse.json({ id: docRef.id });
  } catch (err: any) {
    console.error("user-presets POST error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/user-presets?id=xxx&userId=xxx
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const userId = searchParams.get("userId");
    if (!id || !userId) return NextResponse.json({ error: "Missing id or userId" }, { status: 400 });

    const snap = await db.collection("userPresets").doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (snap.data()?.userId !== userId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    await db.collection("userPresets").doc(id).delete();
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("user-presets DELETE error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
