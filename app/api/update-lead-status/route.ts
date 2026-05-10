export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

const VALID_STATUSES = ["new", "contacted", "booked", "lost"];

export async function POST(req: Request) {
  try {
    const { leadId, status } = await req.json();

    if (!leadId || !status) {
      return NextResponse.json({ error: "Missing leadId or status" }, { status: 400 });
    }
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    await db.collection("leads").doc(leadId).update({ status, updatedAt: Date.now() });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("update-lead-status error:", err);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}
