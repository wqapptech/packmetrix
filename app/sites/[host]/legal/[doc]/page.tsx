import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/firebase-admin";
import LegalPage from "@/components/site/LegalPage";
import { resolveSiteMode } from "@/lib/site-mode";
import { LEGAL_TYPES, DEFAULT_LEGAL_TITLE, type LegalType } from "@/lib/legal";

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
  params: Promise<{ host: string; doc: string }>;
}): Promise<Metadata> {
  const { host, doc } = await params;
  if (!LEGAL_TYPES.includes(doc as LegalType)) return { title: "PackMetrix" };
  const slug = await resolveAgencySlug(host);
  const agency = slug ? await fetchAgencyBySlug(slug) : null;
  const name = agency?.name || "Travel Agency";
  return { title: `${DEFAULT_LEGAL_TITLE[doc as LegalType].en} — ${name}` };
}

export default async function CustomDomainLegalPage({
  params,
}: {
  params: Promise<{ host: string; doc: string }>;
}) {
  const { host, doc } = await params;
  if (!LEGAL_TYPES.includes(doc as LegalType)) notFound();
  const agencySlug = await resolveAgencySlug(host);
  if (!agencySlug) notFound();

  const agency = await fetchAgencyBySlug(agencySlug);
  const siteMode = resolveSiteMode(agency);

  return <LegalPage agencySlug={agencySlug} basePath="" docType={doc as LegalType} siteMode={siteMode} />;
}
