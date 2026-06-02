import { notFound } from "next/navigation";
import { db } from "@/lib/firebase-admin";
import CustomDomainPackageDetail from "./_detail";

export const dynamic = "force-dynamic";

export default async function CustomDomainPackagePage({
  params,
}: {
  params: Promise<{ host: string; packageId: string }>;
}) {
  const { host, packageId } = await params;

  const snap = await db.collection("customDomains").doc(host).get();
  if (!snap.exists || snap.data()?.status !== "active") {
    notFound();
  }

  const agencySlug: string = snap.data()!.agencySlug;
  return <CustomDomainPackageDetail agencySlug={agencySlug} packageId={packageId} />;
}
