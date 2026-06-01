import { NextResponse } from "next/server";
import { QueryDocumentSnapshot, DocumentReference } from "firebase-admin/firestore";
import { db, adminAuth } from "@/lib/firebase-admin";
import { verifyAdminToken } from "@/lib/admin-auth";
import { toSlug } from "@/lib/trial";

export const dynamic = "force-dynamic";

async function batchDelete(refs: DocumentReference[]) {
  for (let i = 0; i < refs.length; i += 500) {
    const batch = db.batch();
    refs.slice(i, i + 500).forEach(ref => batch.delete(ref));
    await batch.commit();
  }
}

export async function DELETE(req: Request) {
  const admin = await verifyAdminToken(req.headers.get("authorization"));
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { uid } = await req.json();
  if (!uid) return NextResponse.json({ error: "Missing uid" }, { status: 400 });

  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists) return NextResponse.json({ error: "Agency not found" }, { status: 404 });

  const userData = userDoc.data()!;

  const [packagesSnap, leadsSnap] = await Promise.all([
    db.collection("packages").where("userId", "==", uid).get(),
    db.collection("leads").where("userId", "==", uid).get(),
  ]);

  await batchDelete(packagesSnap.docs.map((d: QueryDocumentSnapshot) => d.ref));
  await batchDelete(leadsSnap.docs.map((d: QueryDocumentSnapshot) => d.ref));

  if (userData.customDomain) {
    await db.collection("customDomains").doc(userData.customDomain).delete().catch(() => {});
  }

  await db.collection("users").doc(uid).delete();

  try { await adminAuth.deleteUser(uid); } catch {}

  return NextResponse.json({ success: true });
}

export async function GET(req: Request) {
  const admin = await verifyAdminToken(req.headers.get("authorization"));
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const snap = await db
    .collection("users")
    .orderBy("createdAt", "desc")
    .get();

  const agencies = snap.docs.map((doc: QueryDocumentSnapshot) => {
    const d = doc.data();
    return {
      uid: doc.id,
      name: d.name || "",
      email: d.email || "",
      plan: d.plan || "free",
      agencySlug: d.agencySlug || toSlug(d.name || ""),
      customDomain: d.customDomain || null,
      customDomainStatus: d.customDomainStatus || null,
      trialEndsAt: d.trialEndsAt || null,
      createdAt: d.createdAt || 0,
    };
  });

  return NextResponse.json({ agencies });
}

const VALID_PLANS = ["free", "founding", "standard", "start", "grow", "scale"] as const;

export async function PATCH(req: Request) {
  const admin = await verifyAdminToken(req.headers.get("authorization"));
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const { uid } = body;
  if (!uid) return NextResponse.json({ error: "Missing uid" }, { status: 400 });

  if (typeof body.trialEndsAt === "number") {
    await db.collection("users").doc(uid).update({ trialEndsAt: body.trialEndsAt });
    return NextResponse.json({ success: true, trialEndsAt: body.trialEndsAt });
  }

  if (typeof body.plan === "string" && (VALID_PLANS as readonly string[]).includes(body.plan)) {
    const updates: Record<string, unknown> = { plan: body.plan };
    if (body.plan !== "free") {
      updates.cancelAtPeriodEnd = false;
      updates.currentPeriodEnd = null;
    }
    await db.collection("users").doc(uid).update(updates);
    return NextResponse.json({ success: true, plan: body.plan });
  }

  return NextResponse.json({ error: "Missing trialEndsAt or valid plan" }, { status: 400 });
}
