import { NextResponse } from "next/server";
import { QueryDocumentSnapshot, DocumentReference } from "firebase-admin/firestore";
import { db, adminAuth } from "@/lib/firebase-admin";
import { verifyAdminToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const KEEP_EMAIL = "hello@packmetrix.com";

async function batchDelete(refs: DocumentReference[]) {
  for (let i = 0; i < refs.length; i += 500) {
    const batch = db.batch();
    refs.slice(i, i + 500).forEach(ref => batch.delete(ref));
    await batch.commit();
  }
}

export async function POST(req: Request) {
  const admin = await verifyAdminToken(req.headers.get("authorization"));
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const snap = await db.collection("users").get();
  const toDelete = snap.docs.filter((d: QueryDocumentSnapshot) => d.data().email !== KEEP_EMAIL);

  let deleted = 0;
  for (const userDoc of toDelete) {
    const uid = userDoc.id;
    const data = userDoc.data();

    const [pkgSnap, leadSnap] = await Promise.all([
      db.collection("packages").where("userId", "==", uid).get(),
      db.collection("leads").where("userId", "==", uid).get(),
    ]);

    await batchDelete([
      ...pkgSnap.docs.map((d: QueryDocumentSnapshot) => d.ref),
      ...leadSnap.docs.map((d: QueryDocumentSnapshot) => d.ref),
    ]);

    if (data.customDomain) {
      await db.collection("customDomains").doc(data.customDomain).delete().catch(() => {});
    }

    await db.collection("users").doc(uid).delete();
    try { await adminAuth.deleteUser(uid); } catch {}

    deleted++;
  }

  return NextResponse.json({ success: true, deleted });
}
