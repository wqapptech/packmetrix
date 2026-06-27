import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Packmetrix — A complete branded website for your travel agency",
  description:
    "Give your travel agency a complete branded website — homepage, storefront, and beautiful package pages — on your own domain, in minutes. Bilingual EN/AR with proper RTL, 10 templates, a modular homepage, and lead tracking.",
};

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
