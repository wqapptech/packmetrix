import { Metadata } from "next";
import { db } from "@/lib/firebase-admin";
import AgencyStorefront from "@/components/AgencyStorefront";

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
  params: Promise<{ agencySlug: string }>;
}): Promise<Metadata> {
  const { agencySlug } = await params;
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

export default async function AgencyPackagesPage({
  params,
}: {
  params: Promise<{ agencySlug: string }>;
}) {
  const { agencySlug } = await params;
  if (!agencySlug) return null;
  return <AgencyStorefront agencySlug={agencySlug} basePath={`/${agencySlug}`} />;
}
