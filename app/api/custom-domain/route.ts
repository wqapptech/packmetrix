import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";

export const dynamic = "force-dynamic";

const ALLOWED_PLANS = new Set(["grow", "scale"]);

// Basic domain validation: no protocol, no path, no spaces, no packmetrix self-registration
function isValidDomain(domain: string): boolean {
  return (
    /^[a-zA-Z0-9][a-zA-Z0-9\-_.]*\.[a-zA-Z]{2,}$/.test(domain) &&
    !domain.includes("packmetrix")
  );
}

// POST /api/custom-domain — save or update custom domain for the authenticated user
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { userId, domain } = body as { userId?: string; domain?: string };
  if (!userId || !domain) {
    return NextResponse.json({ error: "Missing userId or domain" }, { status: 400 });
  }

  const cleanDomain = domain
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/$/, "");

  if (!isValidDomain(cleanDomain)) {
    return NextResponse.json(
      { error: "Invalid domain. Use format: metrics.youragency.com" },
      { status: 400 }
    );
  }

  const userRef = db.collection("users").doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const user = userSnap.data()!;

  if (!ALLOWED_PLANS.has(user.plan)) {
    return NextResponse.json(
      { error: "Custom domains require a Grow or Scale plan" },
      { status: 403 }
    );
  }

  // Reject if this exact domain is already claimed by a different user
  const existingSnap = await db.collection("customDomains").doc(cleanDomain).get();
  if (existingSnap.exists && existingSnap.data()?.userId !== userId) {
    return NextResponse.json(
      { error: "This domain is already registered by another account" },
      { status: 409 }
    );
  }

  // Remove old domain mapping when switching to a new domain
  const oldDomain = user.customDomain as string | undefined;
  if (oldDomain && oldDomain !== cleanDomain) {
    await db.collection("customDomains").doc(oldDomain).delete();
  }

  // Derive the agencySlug — stored on the user doc, otherwise fall back to name
  const agencySlug: string = user.agencySlug || user.name || userId;

  // Write the public lookup document (read by the Edge middleware via Firestore REST API)
  await db.collection("customDomains").doc(cleanDomain).set({
    agencySlug,
    userId,
    updatedAt: Date.now(),
  });

  // Persist on the user profile
  await userRef.update({ customDomain: cleanDomain });

  return NextResponse.json({ success: true, domain: cleanDomain });
}

// DELETE /api/custom-domain — remove custom domain for the authenticated user
export async function DELETE(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid body" }, { status: 400 });

  const { userId } = body as { userId?: string };
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const userRef = db.collection("users").doc(userId);
  const userSnap = await userRef.get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const user = userSnap.data()!;
  const domain = user.customDomain as string | undefined;

  if (domain) {
    await db.collection("customDomains").doc(domain).delete();
  }

  await userRef.update({ customDomain: null });

  return NextResponse.json({ success: true });
}
