import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";
import { getAppHostingDomain } from "@/lib/app-hosting";
import { mapAppHostingStatus, upsertDomainState, type DomainStatus } from "@/lib/domain-sync";

export const dynamic = "force-dynamic";

// [id] is the hostname (URL-encoded).
// Only polls App Hosting for statuses where the domain has been added to the backend
// (records_ready and verifying). For requested status, returns the Firestore state.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser(req.headers.get("authorization"));
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const hostname = decodeURIComponent(id);

  const userSnap = await db.collection("users").doc(user.uid).get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const userData = userSnap.data()!;

  // Scope: only the owning agency may query their own domain.
  if (userData.customDomain !== hostname) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const currentStatus = (userData.customDomainStatus as DomainStatus | null) ?? "requested";
  const agencySlug: string = userData.agencySlug || userData.name || user.uid;
  const createdAt = (userData.customDomainCreatedAt as number | null) ?? Date.now();
  const dnsRecords = userData.customDomainDnsRecords ?? [];

  // Only hit App Hosting API when the domain is actually in-flight there.
  if (currentStatus === "records_ready" || currentStatus === "verifying") {
    try {
      const result = await getAppHostingDomain(hostname);
      if (result) {
        const mapped = mapAppHostingStatus(result.hostState, result.certState);
        if (mapped && mapped !== currentStatus) {
          await upsertDomainState(user.uid, agencySlug, {
            hostname,
            status: mapped,
            dns_records: dnsRecords,
            error_message: mapped === "failed" ? `Host: ${result.hostState}, Cert: ${result.certState}` : "",
            created_at: createdAt,
            updated_at: Date.now(),
          });
          return NextResponse.json({ hostname, status: mapped, dns_records: dnsRecords });
        }
      }
    } catch { /* best-effort; return cached status below */ }
  }

  return NextResponse.json({
    hostname,
    status: currentStatus,
    dns_records: dnsRecords,
  });
}
