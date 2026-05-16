import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { verifyAdminToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const admin = await verifyAdminToken(req.headers.get("authorization"));
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const snap = await db
    .collection("users")
    .orderBy("createdAt", "desc")
    .get();

  const agencies = snap.docs.map((doc) => {
    const d = doc.data();
    return {
      uid: doc.id,
      name: d.name || "",
      email: d.email || "",
      plan: d.plan || "free",
      agencySlug: d.agencySlug || d.name || "",
      customDomain: d.customDomain || null,
      customDomainStatus: d.customDomainStatus || null,
      customDomainRecords: d.customDomainRecords || [],
      customDomainStatusMsg: d.customDomainStatusMsg || "",
      createdAt: d.createdAt || 0,
    };
  });

  return NextResponse.json({ agencies });
}
