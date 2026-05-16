import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "PackMetrix — Travel Package Intelligence",
  description:
    "Turn travel packages into high-converting landing pages in seconds. Analytics, lead tracking, and beautiful templates — built for travel agencies.",
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
