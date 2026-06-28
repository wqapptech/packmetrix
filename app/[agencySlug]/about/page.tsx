import { Metadata } from "next";
import { headers } from "next/headers";
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
  return { title: `${name} — About`, description: agency?.tagline || agency?.about || `About ${name}` };
}

// The About page is a distinct, section-driven page (users/{uid}.aboutPage). It
// lives at /about in BOTH catalog and site mode — it is never served at root, so
// there's no redirect. editor=true in catalog mode shows labeled placeholders for
// enabled-but-empty sections; once flipped to site mode it renders editor=false
// (honest empties hidden from real visitors).
export default async function AgencyAboutPage({
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
  const editor = resolveSiteMode(agency) !== "site";

  return <Homepage page="about" agencySlug={agencySlug} basePath={basePath} editor={editor} />;
}
