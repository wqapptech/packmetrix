import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/firebase-admin";
import Homepage from "@/components/site/Homepage";
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
  const name = agency?.name || "PackMetrix";
  return { title: `${name} — About`, description: agency?.tagline || agency?.about || `About ${name}` };
}

// The About page is a distinct, section-driven page (users/{uid}.aboutPage),
// served at /about on the custom domain in BOTH catalog and site mode (never at
// root, so no redirect). editor=true (catalog) shows placeholders; site mode
// renders editor=false (honest empties hidden).
export default async function CustomDomainAboutPage({
  params,
}: {
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const agencySlug = await resolveAgencySlug(host);
  if (!agencySlug) notFound();

  const agency = await fetchAgencyBySlug(agencySlug);
  const editor = resolveSiteMode(agency) !== "site";

  return <Homepage page="about" agencySlug={agencySlug} basePath="" editor={editor} />;
}
