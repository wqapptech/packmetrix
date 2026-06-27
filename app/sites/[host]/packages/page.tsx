import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/firebase-admin";
import AgencyStorefront from "@/components/AgencyStorefront";
import { resolveSiteMode } from "@/lib/site-mode";

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
  if (!userSnap.empty) return (userSnap.docs[0].data().agencySlug as string) || null;
  return null;
}

async function fetchAgencyBySlug(slug: string) {
  const snap = await db.collection("users").where("agencySlug", "==", slug).limit(1).get();
  return snap.empty ? null : snap.docs[0].data();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ host: string }>;
}): Promise<Metadata> {
  const { host } = await params;
  const slug = await resolveAgencySlug(host);
  if (!slug) return { title: "PackMetrix" };
  const agency = await fetchAgencyBySlug(slug);
  const name = agency?.name || "Travel Agency";
  return { title: `${name} — Travel Packages`, description: agency?.tagline || agency?.about || `Browse travel packages by ${name}` };
}

// The storefront on the custom-domain tree, moved here under the root flip.
export default async function CustomDomainPackagesPage({
  params,
}: {
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const agencySlug = await resolveAgencySlug(host);
  if (!agencySlug) notFound();

  const agency = await fetchAgencyBySlug(agencySlug);
  const siteMode = resolveSiteMode(agency);

  return <AgencyStorefront agencySlug={agencySlug} basePath="" siteMode={siteMode} />;
}
