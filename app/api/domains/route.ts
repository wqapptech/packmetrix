import { NextResponse } from "next/server";
import { db, adminAuth } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";
import { createCustomHostname, deleteCustomHostname } from "@/lib/cloudflare";
import { mapCFStatus, extractDnsRecords, upsertDomainState } from "@/lib/domain-sync";
import { sendDomainAddedEmail } from "@/lib/email";
import { toSlug } from "@/lib/trial";

export const dynamic = "force-dynamic";

const ALLOWED_PLANS = new Set(["founding", "standard", "grow", "scale"]);

function isValidHostname(hostname: string): boolean {
  return (
    /^[a-zA-Z0-9][a-zA-Z0-9\-_.]*\.[a-zA-Z]{2,}$/.test(hostname) &&
    !hostname.toLowerCase().includes("packmetrix")
  );
}

// Apex = exactly two DNS labels (e.g. "acmetravel.com"). Subdomains have three or more.
function isApexDomain(hostname: string): boolean {
  return hostname.split(".").length === 2;
}

export async function POST(req: Request) {
  if (process.env.NEXT_PUBLIC_ENV !== "production") {
    return NextResponse.json(
      { error: "Custom domain registration is disabled on non-production environments" },
      { status: 503 }
    );
  }

  const user = await verifyUser(req.headers.get("authorization"));
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => null);
  if (!body?.hostname || typeof body.hostname !== "string") {
    return NextResponse.json({ error: "Missing hostname" }, { status: 400 });
  }

  const hostname = body.hostname
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  if (!isValidHostname(hostname)) {
    return NextResponse.json(
      { error: "Invalid hostname. Use format: packages.youragency.com" },
      { status: 400 }
    );
  }

  const userSnap = await db.collection("users").doc(user.uid).get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const userData = userSnap.data()!;

  if (!ALLOWED_PLANS.has(userData.plan)) {
    return NextResponse.json(
      { error: "Custom domains require a paid plan" },
      { status: 403 }
    );
  }

  // One domain per agency — must delete before registering a new one.
  if (userData.customDomain && userData.customDomainStatus != null) {
    return NextResponse.json(
      { error: "You already have a custom domain. Remove it before adding a new one." },
      { status: 409 }
    );
  }

  // Reject if hostname is already claimed by a different account.
  const existingSnap = await db.collection("customDomains").doc(hostname).get();
  if (existingSnap.exists && existingSnap.data()?.userId !== user.uid) {
    return NextResponse.json(
      { error: "This hostname is already registered by another account" },
      { status: 409 }
    );
  }

  let cfResult;
  try {
    cfResult = await createCustomHostname(hostname);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Cloudflare error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const agencySlug: string = userData.agencySlug || toSlug(userData.name || "") || user.uid;
  const status = mapCFStatus(cfResult);
  const { verification_records, ssl_records } = extractDnsRecords(cfResult);
  const now = Date.now();

  try {
    await upsertDomainState(user.uid, agencySlug, {
      hostname,
      cf_hostname_id: cfResult.id,
      status,
      verification_records,
      ssl_records,
      error_message: "",
      created_at: now,
      updated_at: now,
    });
  } catch {
    // Roll back the Cloudflare hostname so the user can try again.
    try { await deleteCustomHostname(cfResult.id); } catch { /* best-effort */ }
    return NextResponse.json({ error: "Failed to save domain — please try again" }, { status: 502 });
  }

  const apex = isApexDomain(hostname);
  const cnameTarget = process.env.CLOUDFLARE_CUSTOM_HOSTNAME_TARGET ?? "cname.packmetrix.com";
  const cnameRecord = apex ? undefined : { type: "CNAME" as const, name: hostname, value: cnameTarget };

  try {
    const userRecord = await adminAuth.getUser(user.uid);
    if (userRecord.email) {
      await sendDomainAddedEmail({
        to: userRecord.email,
        hostname,
        cnameRecord,
        verificationRecords: verification_records,
        sslRecords: ssl_records,
      });
    }
  } catch { /* email failure must not block the response */ }

  const apexGuidance = apex
    ? `${hostname} is a root/apex domain. A plain CNAME is not valid at an apex per the DNS spec. Your DNS provider must support CNAME flattening (ALIAS records), or you must add A records pointing to Cloudflare's IP addresses. Check your registrar's documentation for ALIAS/CNAME flattening, or contact support@packmetrix.com for help.`
    : undefined;

  return NextResponse.json({
    hostname,
    cf_hostname_id: cfResult.id,
    status,
    is_apex: apex,
    cname_record: cnameRecord ?? null,
    verification_records,
    ssl_records,
    ...(apexGuidance ? { apex_guidance: apexGuidance } : {}),
  });
}
