import { NextResponse } from "next/server";
import { QueryDocumentSnapshot, DocumentReference } from "firebase-admin/firestore";
import { db, adminAuth } from "@/lib/firebase-admin";
import { verifyAdminToken } from "@/lib/admin-auth";

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
      agencySlug: d.agencySlug || d.name || "",
      customDomain: d.customDomain || null,
      customDomainStatus: d.customDomainStatus || null,
      trialEndsAt: d.trialEndsAt || null,
      createdAt: d.createdAt || 0,
    };
  });

  return NextResponse.json({ agencies });
}

export async function PATCH(req: Request) {
  const admin = await verifyAdminToken(req.headers.get("authorization"));
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { uid, trialEndsAt } = await req.json();
  if (!uid || typeof trialEndsAt !== "number") {
    return NextResponse.json({ error: "Missing uid or trialEndsAt" }, { status: 400 });
  }

  await db.collection("users").doc(uid).update({ trialEndsAt });

  return NextResponse.json({ success: true, trialEndsAt });
}
