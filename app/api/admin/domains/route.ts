import { NextResponse } from "next/server";
import type { QueryDocumentSnapshot } from "firebase-admin/firestore";
import { db } from "@/lib/firebase-admin";
import { verifyAdminToken } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// GET /api/admin/domains — list all custom domain requests for the admin dashboard.
// Returns domains with their associated agency info for display.
export async function GET(req: Request) {
  const admin = await verifyAdminToken(req.headers.get("authorization"));
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const snap = await db
    .collection("customDomains")
    .orderBy("updatedAt", "desc")
    .get();

  // Enrich with agency name + email from users collection.
  const enriched = await Promise.all(
    snap.docs.map(async (doc: QueryDocumentSnapshot) => {
      const data = doc.data();
      let agencyName = data.agencySlug ?? "";
      let agencyEmail = "";
      try {
        const userSnap = await db.collection("users").doc(data.userId).get();
        if (userSnap.exists) {
          agencyName = userSnap.data()!.name || agencyName;
          agencyEmail = userSnap.data()!.email || "";
        }
      } catch { /* best-effort */ }
      return {
        hostname: doc.id,
        status: data.status,
        agencySlug: data.agencySlug,
        agencyName,
        agencyEmail,
        userId: data.userId,
        dns_records: data.dns_records ?? [],
        updatedAt: data.updatedAt ?? 0,
      };
    })
  );

  return NextResponse.json({ domains: enriched });
}
