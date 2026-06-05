import type { Metadata } from "next";
import { db } from "@/lib/firebase-admin";

type Props = {
  params: Promise<{ agencySlug: string; packageId: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  try {
    const { packageId, agencySlug } = await params;
    if (!db) return {};

    const pkgSnap = await db.collection("packages").doc(packageId).get();
    if (!pkgSnap.exists) return {};

    const d = pkgSnap.data()!;

    const rawTitle = d.title;
    const title: string =
      (typeof rawTitle === "object" ? rawTitle?.en || rawTitle?.ar : rawTitle) ||
      d.destination ||
      "Travel Package";

    const rawDesc = d.description;
    const description: string =
      (typeof rawDesc === "object" ? rawDesc?.en || rawDesc?.ar : rawDesc) ||
      (d.destination ? `Explore ${d.destination}${d.price ? ` — from ${d.price}` : ""}` : "Explore our travel packages.");

    const image = d.coverImage as string | undefined;

    const isProd = process.env.NEXT_PUBLIC_ENV === "production";
    const url = isProd
      ? `https://${agencySlug}.packmetrix.com/${packageId}`
      : `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/${agencySlug}/${packageId}`;

    return {
      title,
      description,
      openGraph: {
        title,
        description,
        url,
        type: "website",
        siteName: "Packmetrix",
        ...(image ? { images: [{ url: image, width: 1200, height: 630, alt: title }] } : {}),
      },
      twitter: {
        card: image ? "summary_large_image" : "summary",
        title,
        description,
        ...(image ? { images: [image] } : {}),
      },
    };
  } catch {
    return {};
  }
}

export default function PackageLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
