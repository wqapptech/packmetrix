import AgencyStorefront from "@/components/AgencyStorefront";

export default function CustomDomainGallery({ agencySlug }: { agencySlug: string }) {
  return <AgencyStorefront agencySlug={agencySlug} />;
}
