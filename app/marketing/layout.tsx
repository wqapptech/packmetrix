import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Packmetrix — Present and sell your travel packages, beautifully",
  description:
    "How travel agencies present and sell their packages — beautifully, on their own brand, wherever their customers are. AI-powered pages, lead tracking, and 10 stunning templates.",
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
