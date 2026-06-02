import { notFound } from "next/navigation";
import { db } from "@/lib/firebase-admin";
import CustomDomainGallery from "./_gallery";

export const dynamic = "force-dynamic";

export default async function CustomDomainGalleryPage({
  params,
}: {
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;

  const snap = await db.collection("customDomains").doc(host).get();
  if (!snap.exists || snap.data()?.status !== "active") {
    notFound();
  }

  const agencySlug: string = snap.data()!.agencySlug;
  return <CustomDomainGallery agencySlug={agencySlug} />;
}
