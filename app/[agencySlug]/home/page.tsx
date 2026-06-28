import { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "@/lib/firebase-admin";
import Homepage from "@/components/site/Homepage";
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
  const name = agency?.name || "PackMetrix";
  return { title: name, description: agency?.tagline || agency?.about || `${name} — home` };
}

// Mode-aware: catalog → live homepage preview (before flipping). site → the
// homepage already serves at root, so redirect to keep one canonical URL.
export default async function AgencyHomePage({
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
  if (resolveSiteMode(agency) === "site") redirect(basePath || "/");

  // Catalog-mode preview: the agency is previewing their not-yet-public homepage,
  // so enabled-but-empty sections render a labeled placeholder (editor=true) — the
  // agency can see the section exists and fill it. Once flipped to site mode the
  // homepage serves at root with editor=false, where empties are hidden from real
  // visitors (no dummy data, no empty boxes).
  return <Homepage agencySlug={agencySlug} basePath={basePath} editor />;
}
