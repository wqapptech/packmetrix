import { notFound } from "next/navigation";
import { db } from "@/lib/firebase-admin";
import CustomDomainPackageDetail from "./_detail";

export const dynamic = "force-dynamic";

async function resolveAgencySlug(host: string): Promise<string | null> {
  const domainSnap = await db.collection("customDomains").doc(host).get();
  if (domainSnap.exists && domainSnap.data()?.status === "active") {
    return domainSnap.data()!.agencySlug as string;
  }

  const userSnap = await db
    .collection("users")
    .where("customDomain", "==", host)
    .where("customDomainStatus", "==", "active")
    .limit(1)
    .get();
  if (!userSnap.empty) {
    const data = userSnap.docs[0].data();
    return (data.agencySlug as string) || null;
  }

  return null;
}

export default async function CustomDomainPackagePage({
  params,
}: {
  params: Promise<{ host: string; packageId: string }>;
}) {
  const { host, packageId } = await params;
  const agencySlug = await resolveAgencySlug(host);
  if (!agencySlug) notFound();

  return <CustomDomainPackageDetail agencySlug={agencySlug} packageId={packageId} />;
}
