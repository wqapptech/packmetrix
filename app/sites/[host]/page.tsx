import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/firebase-admin";
import CustomDomainGallery from "./_gallery";

export const dynamic = "force-dynamic";

async function fetchAgencyBySlug(slug: string) {
  if (!db) return null;
  try {
    const snap = await db.collection("users")
      .where("agencySlug", "==", slug)
      .limit(1)
      .get();
    return snap.empty ? null : snap.docs[0].data();
  } catch {
    return null;
  }
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ host: string }>;
}): Promise<Metadata> {
  const { host } = await params;
  const domainSnap = await db.collection("customDomains").doc(host).get();
  if (!domainSnap.exists || domainSnap.data()?.status !== "active") {
    return { title: "PackMetrix" };
  }

  const agencySlug: string = domainSnap.data()!.agencySlug;
  const agency = await fetchAgencyBySlug(agencySlug);
  if (!agency) return { title: "PackMetrix" };

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

  const snap = await db.collection("customDomains").doc(host).get();
  if (!snap.exists || snap.data()?.status !== "active") {
    notFound();
  }

  const agencySlug: string = snap.data()!.agencySlug;
  return <CustomDomainGallery agencySlug={agencySlug} />;
}
