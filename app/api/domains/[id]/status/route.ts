import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";
import { getCustomHostname } from "@/lib/cloudflare";
import { mapCFStatus, extractDnsRecords, upsertDomainState } from "@/lib/domain-sync";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser(req.headers.get("authorization"));
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: cfHostnameId } = await params;

  const userSnap = await db.collection("users").doc(user.uid).get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const userData = userSnap.data()!;

  // Scope: only the owning agency may query their own hostname.
  if (userData.customDomainCfId !== cfHostnameId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let cfResult;
  try {
    cfResult = await getCustomHostname(cfHostnameId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Cloudflare error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const agencySlug: string = userData.agencySlug || userData.name || user.uid;
  const status = mapCFStatus(cfResult);
  const { verification_records, ssl_records } = extractDnsRecords(cfResult);
  const now = Date.now();

  await upsertDomainState(user.uid, agencySlug, {
    hostname: userData.customDomain as string,
    cf_hostname_id: cfHostnameId,
    status,
    verification_records,
    ssl_records,
    error_message: cfResult.ssl?.validation_errors?.[0]?.message ?? "",
    created_at: (userData.customDomainCreatedAt as number | null) ?? now,
    updated_at: now,
  });

  return NextResponse.json({
    hostname: userData.customDomain,
    cf_hostname_id: cfHostnameId,
    status,
    verification_records,
    ssl_records,
    error_message: cfResult.ssl?.validation_errors?.[0]?.message ?? "",
  });
}
