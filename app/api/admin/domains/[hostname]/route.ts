import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";
import { sendDomainActiveEmail, sendDomainFailedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

const ADMIN_UIDS = new Set((process.env.ADMIN_UIDS ?? "").split(",").filter(Boolean));

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ hostname: string }> }
) {
  const user = await verifyUser(req.headers.get("authorization"));
  if (!user || !ADMIN_UIDS.has(user.uid)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { hostname: rawHostname } = await params;
  const hostname = decodeURIComponent(rawHostname);
  const body = await req.json().catch(() => null);
  const action: string = body?.action;

  if (!["mark_active", "mark_failed"].includes(action)) {
    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  }

  const domainSnap = await db.collection("customDomains").doc(hostname).get();
  if (!domainSnap.exists) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }
  const domainData = domainSnap.data()!;
  const userId: string = domainData.userId;

  const userSnap = await db.collection("users").doc(userId).get();
  const userEmail: string | undefined = userSnap.data()?.email;

  if (action === "mark_active") {
    await db.collection("customDomains").doc(hostname).update({
      status: "active",
      error_message: "",
      updated_at: Date.now(),
    });
    await db.collection("users").doc(userId).update({
      customDomainStatus: "active",
      customDomainError: "",
    });
    if (userEmail) {
      try { await sendDomainActiveEmail({ to: userEmail, hostname }); } catch { /* best-effort */ }
    }
    return NextResponse.json({ status: "active" });
  }

  // mark_failed
  const errorMessage: string = body?.error_message ?? "Manually marked as failed.";
  await db.collection("customDomains").doc(hostname).update({
    status: "failed",
    error_message: errorMessage,
    updated_at: Date.now(),
  });
  await db.collection("users").doc(userId).update({
    customDomainStatus: "failed",
    customDomainError: errorMessage,
  });
  if (userEmail) {
    try { await sendDomainFailedEmail({ to: userEmail, hostname, errorMessage }); } catch { /* best-effort */ }
  }
  return NextResponse.json({ status: "failed" });
}
