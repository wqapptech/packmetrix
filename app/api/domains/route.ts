import { NextResponse } from "next/server";
import { db, adminAuth } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";
import { upsertDomainState } from "@/lib/domain-sync";
import { sendDomainRequestedAdminEmail } from "@/lib/email";
import { toSlug } from "@/lib/trial";

export const dynamic = "force-dynamic";

const ALLOWED_PLANS = new Set(["founding", "standard", "grow", "scale"]);

function isValidHostname(hostname: string): boolean {
  return (
    /^[a-zA-Z0-9][a-zA-Z0-9\-_.]*\.[a-zA-Z]{2,}$/.test(hostname) &&
    !hostname.toLowerCase().includes("packmetrix")
  );
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

  const agencySlug: string = userData.agencySlug || toSlug(userData.name || "") || user.uid;
  const now = Date.now();

  await upsertDomainState(user.uid, agencySlug, {
    hostname,
    status: "requested",
    dns_records: [],
    error_message: "",
    created_at: now,
    updated_at: now,
  });

  // Email admin so they can add the domain to App Hosting + generate DNS records.
  try {
    const userRecord = await adminAuth.getUser(user.uid);
    const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://packmetrix.com"}/admin`;
    await sendDomainRequestedAdminEmail({
      agencyName: userData.name || agencySlug,
      agencyEmail: userRecord.email ?? userData.email ?? "",
      hostname,
      adminUrl,
    });
  } catch { /* email failure must not block the response */ }

  return NextResponse.json({ hostname, status: "requested" });
}
