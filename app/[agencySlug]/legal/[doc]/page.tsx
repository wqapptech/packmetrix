import { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { db } from "@/lib/firebase-admin";
import LegalPage from "@/components/site/LegalPage";
import { resolveSiteMode } from "@/lib/site-mode";
import { LEGAL_TYPES, DEFAULT_LEGAL_TITLE, type LegalType } from "@/lib/legal";

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
  params: Promise<{ agencySlug: string; doc: string }>;
}): Promise<Metadata> {
  const { agencySlug, doc } = await params;
  if (!LEGAL_TYPES.includes(doc as LegalType)) return { title: "PackMetrix" };
  const agency = await fetchAgencyBySlug(agencySlug);
  const name = agency?.name || "Travel Agency";
  return { title: `${DEFAULT_LEGAL_TITLE[doc as LegalType].en} — ${name}` };
}

export default async function AgencyLegalPage({
  params,
}: {
  params: Promise<{ agencySlug: string; doc: string }>;
}) {
  const { agencySlug, doc } = await params;
  if (!agencySlug || !LEGAL_TYPES.includes(doc as LegalType)) notFound();

  const h = await headers();
  const host = (h.get("x-forwarded-host") || h.get("host") || "").split(":")[0].toLowerCase();
  const isSubdomainAccess = /^[a-z0-9-]+\.packmetrix\.com$/.test(host);
  const basePath = isSubdomainAccess ? "" : `/${agencySlug}`;

  const agency = await fetchAgencyBySlug(agencySlug);
  const siteMode = resolveSiteMode(agency);

  return <LegalPage agencySlug={agencySlug} basePath={basePath} docType={doc as LegalType} siteMode={siteMode} />;
}
