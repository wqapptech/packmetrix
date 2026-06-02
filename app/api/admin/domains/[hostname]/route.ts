import { NextResponse } from "next/server";
import { db, adminAuth } from "@/lib/firebase-admin";
import { verifyAdminToken } from "@/lib/admin-auth";
import { upsertDomainState, type DnsRecord, type DomainStatus } from "@/lib/domain-sync";
import { sendDomainRecordsReadyEmail, sendDomainActiveEmail, sendDomainFailedEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

// PATCH /api/admin/domains/[hostname]
//
// Actions:
//   action = "set_records" — admin pastes App Hosting-generated DNS records.
//                            Advances status: requested → records_ready.
//                            Emails the agency with the records.
//
//   action = "mark_active"  — manual override: advance to active regardless of poll state.
//                             Use when IAM polling isn't working or as a last resort.
//
//   action = "mark_failed"  — manual override: mark as failed.
//
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ hostname: string }> }
) {
  const admin = await verifyAdminToken(req.headers.get("authorization"));
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { hostname: rawHostname } = await params;
  const hostname = decodeURIComponent(rawHostname);

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const action: string = body.action ?? "set_records";

  // Find the agency that owns this hostname.
  const domainSnap = await db.collection("customDomains").doc(hostname).get();
  if (!domainSnap.exists) {
    return NextResponse.json({ error: "Domain not found" }, { status: 404 });
  }
  const { userId, agencySlug } = domainSnap.data()!;

  const userSnap = await db.collection("users").doc(userId).get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: "Agency not found" }, { status: 404 });
  }
  const userData = userSnap.data()!;
  const createdAt = (userData.customDomainCreatedAt as number | null) ?? Date.now();
  const existingRecords: DnsRecord[] = userData.customDomainDnsRecords ?? [];

  if (action === "set_records") {
    const dns_records: DnsRecord[] = body.dns_records;
    if (!Array.isArray(dns_records) || dns_records.length === 0) {
      return NextResponse.json({ error: "dns_records must be a non-empty array" }, { status: 400 });
    }

    // Basic validation of each record.
    for (const r of dns_records) {
      if (!r.type || !r.name || !r.value) {
        return NextResponse.json({ error: "Each record must have type, name, and value" }, { status: 400 });
      }
    }

    await upsertDomainState(userId, agencySlug, {
      hostname,
      status: "records_ready",
      dns_records,
      error_message: "",
      created_at: createdAt,
      updated_at: Date.now(),
    });

    // Email the agency with the records to add.
    try {
      const userRecord = await adminAuth.getUser(userId);
      if (userRecord.email) {
        await sendDomainRecordsReadyEmail({
          to: userRecord.email,
          hostname,
          dnsRecords: dns_records,
        });
      }
    } catch { /* email failure must not block the response */ }

    return NextResponse.json({ success: true, status: "records_ready" });
  }

  if (action === "mark_active") {
    await upsertDomainState(userId, agencySlug, {
      hostname,
      status: "active",
      dns_records: existingRecords,
      error_message: "",
      created_at: createdAt,
      updated_at: Date.now(),
    });
    try {
      const userRecord = await adminAuth.getUser(userId);
      if (userRecord.email) {
        await sendDomainActiveEmail({ to: userRecord.email, hostname });
      }
    } catch { /* best-effort */ }
    return NextResponse.json({ success: true, status: "active" });
  }

  if (action === "mark_failed") {
    const errorMessage: string = body.error_message ?? "Domain setup could not be completed.";
    await upsertDomainState(userId, agencySlug, {
      hostname,
      status: "failed",
      dns_records: existingRecords,
      error_message: errorMessage,
      created_at: createdAt,
      updated_at: Date.now(),
    });
    try {
      const userRecord = await adminAuth.getUser(userId);
      if (userRecord.email) {
        await sendDomainFailedEmail({ to: userRecord.email, hostname, errorMessage });
      }
    } catch { /* best-effort */ }
    return NextResponse.json({ success: true, status: "failed" });
  }

  return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
}

