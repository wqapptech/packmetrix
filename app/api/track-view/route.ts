export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: Request) {
  try {
    const { id, sessionId } = await req.json();

    if (!id || !sessionId) {
      return NextResponse.json({ error: "Missing id or sessionId" }, { status: 400 });
    }

    const sessionRef = db.collection("packageSessions").doc(`${id}_${sessionId}`);
    const sessionSnap = await sessionRef.get();

    if (sessionSnap.exists) {
      return NextResponse.json({ skipped: true });
    }

    await sessionRef.set({ packageId: id, sessionId, createdAt: Date.now() });
    await db.collection("packages").doc(id).update({ views: FieldValue.increment(1) });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("track-view error:", err);
    return NextResponse.json({ error: "tracking failed" }, { status: 500 });
  }
}
