"use client";

import { useParams } from "next/navigation";
import AgencyStorefront from "@/components/AgencyStorefront";

export default function AgencyPackagesPage() {
  const params = useParams();
  const agencySlug = params?.agencySlug as string;
  if (!agencySlug) return null;
  return <AgencyStorefront agencySlug={agencySlug} basePath={`/${agencySlug}`} />;
}
