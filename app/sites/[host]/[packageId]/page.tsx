import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/firebase-admin";
import CustomDomainPackageDetail from "./_detail";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ host: string; packageId: string }>;
}): Promise<Metadata> {
  try {
    const { host, packageId } = await params;
    if (!db) return {};

    const pkgSnap = await db.collection("packages").doc(packageId).get();
    if (!pkgSnap.exists) return {};

    const d = pkgSnap.data()!;

    const rawTitle = d.title;
    const title: string =
      (typeof rawTitle === "object" ? rawTitle?.en || rawTitle?.ar : rawTitle) ||
      d.destination ||
      "Travel Package";

    const rawDesc = d.description;
    const description: string =
      (typeof rawDesc === "object" ? rawDesc?.en || rawDesc?.ar : rawDesc) ||
      (d.destination ? `Explore ${d.destination}${d.price ? ` — from ${d.price}` : ""}` : "Explore our travel packages.");

    const image = d.coverImage as string | undefined;
    const url = `https://${host}/${packageId}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        type: "website",
        siteName: "Packmetrix",
        ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: title }] } : {}),
      },
      twitter: {
        card: image ? "summary_large_image" : "summary",
        title,
        description,
        ...(image ? { images: [image] } : {}),
      },
    };
  } catch {
    return {};
  }
}

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
