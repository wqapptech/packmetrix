export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, db } from "@/lib/firebase-admin";
import { sendFeatureRequestEmail } from "@/lib/email";
import { FieldValue } from "firebase-admin/firestore";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export async function POST(req: NextRequest) {
  // ── Auth: verify ID token server-side; never trust client-supplied identity ──
  const authHeader = req.headers.get("Authorization") || "";
  const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!idToken) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(idToken);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ── Validate request body ──────────────────────────────────────────────────
  const body = await req.json().catch(() => ({}));
  const text = typeof body.text === "string" ? body.text.trim() : "";
  const category = typeof body.category === "string" ? body.category.trim() : "";
  const submitterEmail = typeof body.email === "string" ? body.email.trim() : "";
  const lang = body.lang === "ar" ? "ar" : "en";
  const page = typeof body.page === "string" ? body.page.slice(0, 200) : "/";

  if (!text) {
    return NextResponse.json({ error: "Request text is required" }, { status: 400 });
  }
  if (text.length > 1000) {
    return NextResponse.json({ error: "Request text too long" }, { status: 400 });
  }

  // ── Resolve agency identity from Firestore (server-side, verified UID) ─────
  const userSnap = await db.collection("users").doc(uid).get();
  const userData = userSnap.exists ? userSnap.data()! : {};
  const agencyName: string = (userData.name as string) || "";
  const agencySlug: string =
    (userData.agencySlug as string) ||
    slugify(agencyName) ||
    uid.slice(0, 8).toLowerCase();
  const resolvedEmail: string = submitterEmail || (userData.email as string) || "";

  // ── Write to Firestore ─────────────────────────────────────────────────────
  await db.collection("featureRequests").add({
    text,
    category,
    submitterEmail: resolvedEmail,
    agencyId: uid,
    agencyName,
    agencySlug,
    lang,
    page,
    status: "new",
    createdAt: FieldValue.serverTimestamp(),
  });

  // ── Email notification (best-effort; don't fail the request if email fails) ─
  try {
    await sendFeatureRequestEmail({
      text,
      category,
      submitterEmail: resolvedEmail,
      agencyId: uid,
      agencyName,
      agencySlug,
      lang,
      page,
    });
  } catch (err) {
    console.error("[feature-request] email failed:", err);
  }

  return NextResponse.json({ ok: true });
}
