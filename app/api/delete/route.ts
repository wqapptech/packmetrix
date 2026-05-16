export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export async function POST(req: Request) {
  try {
    const { id, userId } = await req.json();

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

    const leadsSnap = await db.collection("leads").where("packageId", "==", id).get();
    if (!leadsSnap.empty) {
      const batch = db.batch();
      leadsSnap.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    }

    await ref.delete();

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("delete-package error:", err);
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
