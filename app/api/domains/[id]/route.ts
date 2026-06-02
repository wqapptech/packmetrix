import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";
import { clearDomainState } from "@/lib/domain-sync";

export const dynamic = "force-dynamic";

// [id] is the hostname (URL-encoded). The profile page calls:
//   DELETE /api/domains/packages.myagency.com
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser(req.headers.get("authorization"));
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const hostname = decodeURIComponent(id);

  const userSnap = await db.collection("users").doc(user.uid).get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const userData = userSnap.data()!;

  // Scope: only the owning agency may delete their own domain.
  if (userData.customDomain !== hostname) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await clearDomainState(user.uid, hostname);

  return NextResponse.json({ success: true });
}
