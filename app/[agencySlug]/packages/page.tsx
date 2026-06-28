import { Metadata } from "next";
import { headers } from "next/headers";
import { db } from "@/lib/firebase-admin";
import AgencyStorefront from "@/components/AgencyStorefront";
import { resolveSiteMode } from "@/lib/site-mode";

export const dynamic = "force-dynamic";

async function fetchAgencyBySlug(slug: string) {
  if (!db) return null;
  try {
    const snap = await db.collection("users").where("agencySlug", "==", slug).limit(1).get();
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
  return {
    title: `${name} — Travel Packages`,
    description: agency.tagline || agency.about || `Browse travel packages by ${name}`,
  };
}

// The storefront, moved here under the root flip. Stays routable in catalog mode
// too (just an extra path to the storefront). Nav reflects the agency's mode.
export default async function PackagesPage({
  params,
}: {
  params: Promise<{ agencySlug: string }>;
}) {
  const { agencySlug } = await params;
  if (!agencySlug) return null;

  const h = await headers();
  const host = (h.get("x-forwarded-host") || h.get("host") || "").split(":")[0].toLowerCase();
  const isSubdomainAccess = /^[a-z0-9-]+\.packmetrix\.com$/.test(host);
  const basePath = isSubdomainAccess ? "" : `/${agencySlug}`;

  const agency = await fetchAgencyBySlug(agencySlug);
  const siteMode = resolveSiteMode(agency);

  return <AgencyStorefront agencySlug={agencySlug} basePath={basePath} siteMode={siteMode} />;
}
