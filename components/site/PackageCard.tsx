"use client";

// The committed storefront package card — shared by the storefront grid and
// the homepage featured_packages section. Self-contained: handles Arabic-Indic
// numerals and its own bilingual micro-labels. Styles live in storefront.css.

import "@/app/storefront.css";
import { locStr, type LocStr } from "@/components/templates/types";

export type CardPackage = {
  id: string;
  title?: LocStr;
  destination: string;
  price: string;
  nights?: string | number;
  coverImage?: string;
  images?: string[];
  featured?: boolean;
};

const LABELS = {
  en: { from: "From", nights: "nights", pp: "/ person", view: "View", featured: "Featured" },
  ar: { from: "من", nights: "ليالٍ", pp: "/ شخص", view: "عرض", featured: "مختارة" },
} as const;

/** Convert Western digits to Arabic-Indic (and thousands comma to ٬) for AR. */
export function arNum(s: string | number, ar: boolean): string {
  const str = String(s);
  if (!ar) return str;
  return str.replace(/[0-9]/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]).replace(/,/g, "٬");
}

export default function PackageCard({
  pkg,
  lang,
  onOpen,
}: {
  pkg: CardPackage;
  lang: "en" | "ar";
  onOpen: () => void;
}) {
  const ar = lang === "ar";
  const L = LABELS[lang];
  const title = locStr(pkg.title, lang) || pkg.destination;
  const img = pkg.coverImage || pkg.images?.[0];
  const nights = Number(pkg.nights);
  const hasNights = Number.isFinite(nights) && nights > 0;
  return (
    <article className="sf-card" onClick={onOpen}>
      <div className="sf-card__media">
        {img && (
          <img
            src={img}
            alt={title}
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).style.opacity = "0";
            }}
          />
        )}
        <span className="sf-card__accent" />
        {hasNights && (
          <span className="sf-card__nights">{arNum(nights, ar)} {L.nights}</span>
        )}
      </div>
      <div className="sf-card__body">
        {pkg.featured && (
          <div className="sf-card__eyebrow">
            <span className="sf-card__dot" />
            {L.featured}
          </div>
        )}
        <h3 className="sf-serif sf-card__title">{title}</h3>
        <div className="sf-card__foot">
          <div>
            <div className="sf-card__from">{L.from}</div>
            <div className="sf-serif sf-card__price">
              {arNum(pkg.price, ar)} <span className="sf-card__pp">{L.pp}</span>
            </div>
          </div>
          <span className="sf-card__view">
            {L.view}
            <span className="sf-card__arrow">{ar ? "←" : "→"}</span>
          </span>
        </div>
      </div>
    </article>
  );
}
