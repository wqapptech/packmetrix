import { NextResponse } from "next/server";
import { db } from "@/lib/firebase-admin";
import { verifyUser } from "@/lib/verify-user";
import { deleteCustomHostname } from "@/lib/cloudflare";
import { clearDomainState } from "@/lib/domain-sync";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await verifyUser(req.headers.get("authorization"));
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: cfHostnameId } = await params;

  const userSnap = await db.collection("users").doc(user.uid).get();
  if (!userSnap.exists) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  const userData = userSnap.data()!;

  // Scope: only the owning agency may delete their own hostname.
  if (userData.customDomainCfId !== cfHostnameId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const hostname: string | null = userData.customDomain ?? null;
  if (!hostname) {
    return NextResponse.json({ error: "No domain found" }, { status: 404 });
  }

  try {
    await deleteCustomHostname(cfHostnameId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Cloudflare error";
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  await clearDomainState(user.uid, hostname);

  return NextResponse.json({ success: true });
}
