import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

export async function GET() {
  const snap = await db.collection("config").doc("foundingCounter").get();
  const data = snap.data() ?? {};
  const claimed = (data.claimed as number) ?? 0;
  const cap = (data.cap as number) ?? 50;
  const remaining = Math.max(0, cap - claimed);
  return NextResponse.json({ claimed, cap, remaining });
}
