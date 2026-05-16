import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { verifyAdminToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const admin = await verifyAdminToken(req.headers.get("authorization"));
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { userId, status, records, statusMsg } = body as {
    userId: string;
    status: string;
    records: { type: string; name: string; value: string }[];
    statusMsg: string;
  };

  if (!userId || !status) {
    return NextResponse.json({ error: "Missing userId or status" }, { status: 400 });
  }

  const userRef = db.collection("users").doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  await userRef.update({
    customDomainStatus: status,
    customDomainRecords: records ?? [],
    customDomainStatusMsg: statusMsg ?? "",
  });

  return NextResponse.json({ success: true });
}
