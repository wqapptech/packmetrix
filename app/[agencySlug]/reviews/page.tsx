import { Metadata } from "next";
import { headers } from "next/headers";
import { db } from "@/lib/firebase-admin";
import ReviewsPage from "@/components/site/ReviewsPage";

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
  return { title: `${name} — Reviews`, description: agency?.tagline || `Customer reviews — ${name}` };
}

// The Reviews page lists every customer review (video + image + text) authored on
// the home testimonials section. It lives at /reviews in BOTH catalog and site
// mode (never served at root, so no redirect). It always renders real data — the
// honest-empty state lives inside ReviewsPage.
export default async function AgencyReviewsPage({
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

  return <ReviewsPage agencySlug={agencySlug} basePath={basePath} />;
}
