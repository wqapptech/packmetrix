export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { QueryDocumentSnapshot, DocumentReference } from "firebase-admin/firestore";
import { db, adminAuth } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";

async function batchDelete(refs: DocumentReference[]) {
  for (let i = 0; i < refs.length; i += 500) {
    const batch = db.batch();
    refs.slice(i, i + 500).forEach(ref => batch.delete(ref));
    await batch.commit();
  }
}

export async function DELETE(req: Request) {
  const user = await verifyUser(req.headers.get("authorization"));
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { uid } = user;

  const userSnap = await db.collection("users").doc(uid).get();
  if (!userSnap.exists) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const userData = userSnap.data()!;

  const [packagesSnap, leadsSnap] = await Promise.all([
    db.collection("packages").where("userId", "==", uid).get(),
    db.collection("leads").where("userId", "==", uid).get(),
  ]);

  await Promise.all([
    batchDelete(packagesSnap.docs.map((d: QueryDocumentSnapshot) => d.ref)),
    batchDelete(leadsSnap.docs.map((d: QueryDocumentSnapshot) => d.ref)),
  ]);

  if (userData.customDomain) {
    await db.collection("customDomains").doc(userData.customDomain).delete().catch(() => {});
  }

  await db.collection("users").doc(uid).delete();

  await adminAuth.deleteUser(uid);

  return NextResponse.json({ success: true });
}
