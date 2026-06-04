import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/firebase-admin";
import CustomDomainGallery from "./_gallery";

export const dynamic = "force-dynamic";

async function resolveAgencySlug(host: string): Promise<string | null> {
  // Primary: fast index kept in sync by upsertDomainState
  const domainSnap = await db.collection("customDomains").doc(host).get();
  if (domainSnap.exists && domainSnap.data()?.status === "active") {
    return domainSnap.data()!.agencySlug as string;
  }

  // Fallback: look up the users collection directly (handles manually-seeded agencies)
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

export async function generateMetadata({
  params,
}: {
  params: Promise<{ host: string }>;
}): Promise<Metadata> {
  const { host } = await params;
  const agencySlug = await resolveAgencySlug(host);
  if (!agencySlug) return { title: "PackMetrix" };

  const userSnap = await db
    .collection("users")
    .where("agencySlug", "==", agencySlug)
    .limit(1)
    .get();
  if (userSnap.empty) return { title: "PackMetrix" };

  const agency = userSnap.docs[0].data();
  const name = agency.name || "Travel Agency";
  const title = `${name} — Travel Packages`;
  const description = agency.about || agency.tagline || `Browse travel packages by ${name}`;
  const image = agency.logoUrl as string | undefined;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  };
}

export default async function CustomDomainGalleryPage({
  params,
}: {
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const agencySlug = await resolveAgencySlug(host);
  if (!agencySlug) notFound();

  return <CustomDomainGallery agencySlug={agencySlug} />;
}
