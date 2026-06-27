import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/firebase-admin";
import Homepage from "@/components/site/Homepage";
import { resolveSiteMode } from "@/lib/site-mode";

export const dynamic = "force-dynamic";

async function fetchAgencyBySlug(slug: string) {
  const snap = await db.collection("users").where("agencySlug", "==", slug).limit(1).get();
  return snap.empty ? null : snap.docs[0].data();
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
    return (userSnap.docs[0].data().agencySlug as string) || null;
  }
  return null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ host: string }>;
}): Promise<Metadata> {
  const { host } = await params;
  const slug = await resolveAgencySlug(host);
  if (!slug) return { title: "PackMetrix" };
  const userSnap = await db.collection("users").where("agencySlug", "==", slug).limit(1).get();
  const agency = userSnap.empty ? null : userSnap.docs[0].data();
  const name = agency?.name || "PackMetrix";
  return { title: name, description: agency?.tagline || agency?.about || `${name} — home` };
}

// Mode-aware: catalog → live homepage preview; site → homepage already serves
// at root, so redirect to the canonical root URL.
export default async function CustomDomainHomePage({
  params,
}: {
  params: Promise<{ host: string }>;
}) {
  const { host } = await params;
  const agencySlug = await resolveAgencySlug(host);
  if (!agencySlug) notFound();

  const agency = await fetchAgencyBySlug(agencySlug);
  if (resolveSiteMode(agency) === "site") redirect("/");

  // Catalog-mode preview: the agency is previewing their not-yet-public homepage,
  // so enabled-but-empty sections render a labeled placeholder (editor=true). Once
  // flipped to site mode the homepage serves at root with editor=false, where
  // empties are hidden from real visitors (no dummy data, no empty boxes).
  return <Homepage agencySlug={agencySlug} basePath="" editor />;
}
