"use client";

import React, { useState } from "react";
import "@/app/aurora.css";
import { useIsDesktop, BaseCard, LightboxCarousel } from "./shared";
import { T, localizeTierLabel } from "@/lib/translations";
import type { TPageProps, TCardProps, TPackage } from "./types";

// ─── Icons ────────────────────────────────────────────────────────────────────

function WaIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

function CheckIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ShieldIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

function SparkIcon({ size = 13 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6L12 2z" />
    </svg>
  );
}

function PlayIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" style={{ flexShrink: 0 }}>
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function ArrowIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
}

// ─── Stars ────────────────────────────────────────────────────────────────────

function AuStars({ value, size = 12, color = "var(--au-brand)" }: { value: number; size?: number; color?: string }) {
  return (
    <span style={{ display: "inline-flex", gap: 2, color, fontSize: size, lineHeight: 1 }}>
      {"★★★★★".split("").map((s, i) => (
        <span key={i} style={{ opacity: i < Math.round(value) ? 1 : 0.25 }}>{s}</span>
      ))}
    </span>
  );
}

// ─── Section data helpers ─────────────────────────────────────────────────────

type SecData = Record<string, unknown>;

function findSec(pkg: TPackage, type: string): SecData | undefined {
  return pkg.sections?.find((s) => s.type === type)?.data as SecData | undefined;
}

function secArr(data: SecData | undefined, key: string): SecData[] {
  if (!data) return [];
  const v = data[key];
  if (!Array.isArray(v)) return [];
  return v.filter((item): item is SecData => item != null && typeof item === "object");
}

function secStr(data: SecData | undefined, key: string): string {
  if (!data) return "";
  const v = data[key];
  return typeof v === "string" ? v : "";
}

function secNum(data: SecData | undefined, key: string): number | undefined {
  if (!data) return undefined;
  const v = data[key];
  return typeof v === "number" ? v : undefined;
}

function secStrArr(data: SecData | undefined, key: string): string[] {
  if (!data) return [];
  const v = data[key];
  if (!Array.isArray(v)) return [];
  return v.filter((item): item is string => typeof item === "string");
}

function secItemStr(item: unknown, ...keys: string[]): string {
  if (typeof item === "string") return item;
  if (!item || typeof item !== "object") return "";
  const obj = item as SecData;
  for (const k of keys) {
    const v = secStr(obj, k);
    if (v) return v;
  }
  return "";
}

function secArrMixed(data: SecData | undefined, key: string): Array<SecData | string> {
  if (!data) return [];
  const v = data[key];
  if (!Array.isArray(v)) return [];
  return v.filter((item) => item != null) as Array<SecData | string>;
}

// ─── Meals + visa label maps (EN / AR) ───────────────────────────────────────

const MEAL_LABELS: Record<string, { en: string; ar: string }> = {
  none:          { en: "Meals not included",              ar: "لا تشمل الوجبات" },
  breakfast:     { en: "Breakfast included",              ar: "الإفطار مشمول" },
  half_board:    { en: "Half board · breakfast + dinner", ar: "نصف إقامة · إفطار وعشاء" },
  full_board:    { en: "Full board · all meals",          ar: "إقامة كاملة" },
  all_inclusive: { en: "All-inclusive · meals + drinks",  ar: "شامل كل شيء" },
};

const VISA_LABELS: Record<string, { en: string; ar: string }> = {
  free:       { en: "Visa-free / on arrival",      ar: "بدون تأشيرة / عند الوصول" },
  included:   { en: "Visa included by agency",     ar: "تأشيرة مشمولة في السعر" },
  assistance: { en: "Visa support provided",       ar: "دعم في استخراج التأشيرة" },
  required:   { en: "Visa required · we assist",   ar: "تأشيرة مطلوبة · نساعدك" },
};

function AuMealsVisaChips({ pkg, lang }: { pkg: TPackage; lang: "en" | "ar" }) {
  const inclData = findSec(pkg, "inclusions");
  const mealsData = findSec(pkg, "meals");
  const visaData = findSec(pkg, "visa");
  const meals = secStr(inclData, "meals") || secStr(mealsData, "plan");
  const visaStatus = secStr(inclData, "visa") || secStr(visaData, "included");
  const visaDetails = secStr(inclData, "visaDetails") || secStr(visaData, "notes");
  if (!meals && !visaStatus) return null;
  return (
    <div className="au-v2-mv">
      {meals && (
        <div className="au-v2-mv__chip">
          <span className="au-eb">{T[lang].auMealPlan}</span>
          <div className="au-v2-mv__chip-body">
            <h4>{MEAL_LABELS[meals]?.[lang] ?? meals}</h4>
          </div>
        </div>
      )}
      {visaStatus && (
        <div className="au-v2-mv__chip">
          <span className="au-eb">{T[lang].auVisa}</span>
          <div className="au-v2-mv__chip-body">
            <h4>{VISA_LABELS[visaStatus]?.[lang] ?? visaStatus}</h4>
            {visaDetails && <p>{visaDetails}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Highlights ───────────────────────────────────────────────────────────────

function AuHighlightsSection({ pkg, lang }: { pkg: TPackage; lang: "en" | "ar" }) {
  const data = findSec(pkg, "highlights");
  const rawItems = secArrMixed(data, "items");
  if (rawItems.length < 2) return null;
  return (
    <section id="au-highlights" className="au-v2 au-v2-hl" data-pmx-section="highlights">
      <div className="au-v2-hl__head">
        <div className="au-eb">{secStr(data, "eyebrow") || T[lang].auHighlightsEyebrow}</div>
        <h2 className="au-v2__title">{T[lang].auHighlightsHeading}</h2>
      </div>
      <div className="au-v2-hl__grid">
        {rawItems.map((item, i) => {
          const isStr = typeof item === "string";
          const num = isStr ? String(i + 1).padStart(2, "0") : (secStr(item as SecData, "num") || String(i + 1).padStart(2, "0"));
          const title = isStr ? item : secStr(item as SecData, "title");
          const body = isStr ? "" : secStr(item as SecData, "body");
          return (
            <article key={i} className="au-v2-hl__card">
              <div className="au-v2-hl__num">{num}</div>
              <h3 className="au-v2-hl__title">{title}</h3>
              {body && <p className="au-v2-hl__body">{body}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ─── Hotels ───────────────────────────────────────────────────────────────────

function AuHotelsSection({ pkg, lang }: { pkg: TPackage; lang: "en" | "ar" }) {
  const data = findSec(pkg, "hotels");
  const hotels = secArr(data, "hotels").length ? secArr(data, "hotels") : secArr(data, "items");

  if (hotels.length) {
    return (
      <section id="au-stay" className="au-v2 au-v2-htl" data-pmx-section="hotel">
        <div className="au-v2__head">
          <div>
            <div className="au-eb">{secStr(data, "eyebrow") || T[lang].auWhereYouStay}</div>
            <h2 className="au-v2__title">{T[lang].auTheProperties}</h2>
          </div>
          {secStr(data, "lede") && <p className="au-v2__lede">{secStr(data, "lede")}</p>}
        </div>
        <div className="au-v2-htl__grid" data-count={hotels.length}>
          {hotels.map((h, i) => {
            const facilities = secStrArr(h, "facilities");
            const stars = secNum(h, "stars");
            const nights = secStr(h, "nights");
            return (
              <article key={i} className="au-v2-htl__card">
                <div className="au-v2-htl__img">
                  {secStr(h, "photo") && <img src={secStr(h, "photo")} alt={secStr(h, "name")} />}
                  {nights && <span className="au-v2-htl__nights">{nights} {T[lang].nightsLabel}</span>}
                </div>
                <div className="au-v2-htl__body">
                  <div className="au-v2-htl__top">
                    <div>
                      {secStr(h, "location") && <div className="au-v2-htl__loc">{secStr(h, "location")}</div>}
                      <h3 className="au-v2-htl__name">{secStr(h, "name")}</h3>
                    </div>
                    {stars != null && (
                      <div className="au-v2-htl__stars">
                        <AuStars value={stars} size={11} />
                      </div>
                    )}
                  </div>
                  {secStr(h, "note") && <p className="au-v2-htl__note">{secStr(h, "note")}</p>}
                  {facilities.length > 0 && (
                    <ul className="au-v2-htl__fac">
                      {facilities.map((f, j) => <li key={j}>{f}</li>)}
                    </ul>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  if (!pkg.hotelDescription?.trim()) return null;
  return (
    <section className="au-v2 au-v2-htl" data-pmx-section="hotel">
      <div className="au-v2__head">
        <div>
          <div className="au-eb">{T[lang].auWhereYouStay}</div>
          <h2 className="au-v2__title">{T[lang].auTheProperties}</h2>
        </div>
        <p className="au-v2__lede">{pkg.hotelDescription}</p>
      </div>
    </section>
  );
}

// ─── Gallery mobile ───────────────────────────────────────────────────────────

function AuGalleryMobile({ pkg, lang }: { pkg: TPackage; lang: "en" | "ar" }) {
  const images = pkg.gallery?.map((g) => g.src) ?? pkg.images ?? [];
  const [lbIdx, setLbIdx] = useState<number | null>(null);
  if (!images.length) return null;
  return (
    <section className="au-gal-m" data-pmx-section="media">
      <div className="au-section__head">
        <div className="au-eb">{T[lang].auInPhotographs}</div>
      </div>
      <div className="au-gal-m__grid">
        {images.slice(0, 5).map((src, i) => (
          <div key={i} className="au-gal-m__cell" onClick={() => setLbIdx(i)} style={{ cursor: "pointer" }}>
            <img src={src} alt={pkg.destination} />
          </div>
        ))}
      </div>
      {lbIdx !== null && <LightboxCarousel images={images} startIndex={lbIdx} onClose={() => setLbIdx(null)} />}
    </section>
  );
}

// ─── Gallery desktop ──────────────────────────────────────────────────────────

function AuGalleryDesktop({ pkg, lang }: { pkg: TPackage; lang: "en" | "ar" }) {
  const items = pkg.gallery ?? (pkg.images ?? []).map((src) => ({ src, caption: "" }));
  const images = items.map((g) => g.src);
  const [lbIdx, setLbIdx] = useState<number | null>(null);
  if (!items.length) return null;
  return (
    <section className="au-d-gallery" data-pmx-section="media">
      <div className="au-section__head" style={{ padding: 0, marginBottom: 28 }}>
        <div className="au-eb">{T[lang].auInPhotographs}</div>
        <h2 className="au-d-story-section__title" style={{ marginTop: 14, fontSize: 44 }}>
          {T[lang].auWhatGuestsPhotograph}
        </h2>
      </div>
      <div className="au-d-gallery__grid">
        {items.slice(0, 5).map((g, i) => (
          <div key={i} className="au-d-gallery__cell" onClick={() => setLbIdx(i)} style={{ cursor: "pointer" }}>
            <img src={g.src} alt={g.caption || pkg.destination} />
            {g.caption && <div className="au-d-gallery__cap">{g.caption}</div>}
          </div>
        ))}
      </div>
      {lbIdx !== null && <LightboxCarousel images={images} startIndex={lbIdx} onClose={() => setLbIdx(null)} />}
    </section>
  );
}

// ─── Media (video + map) ──────────────────────────────────────────────────────

function auToEmbed(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1`;
  const vi = url.match(/vimeo\.com\/(\d+)/);
  if (vi) return `https://player.vimeo.com/video/${vi[1]}?autoplay=1`;
  return url;
}

function AuMediaSection({ pkg, lang }: { pkg: TPackage; lang: "en" | "ar" }) {
  const mediaSec = findSec(pkg, "media");
  const videoUrl = secStr(mediaSec, "videoUrl") || pkg.videoUrl || "";
  const videoPoster = secStr(mediaSec, "videoPoster") || "";
  const mapSrc = secStr(mediaSec, "mapImage") || secStr(mediaSec, "mapSrc") || "";
  const mapCaption = secStr(mediaSec, "mapCaption") || "";
  const [playing, setPlaying] = useState(false);
  if (!videoUrl && !videoPoster && !mapSrc) return null;
  const isEmbed = videoUrl && (videoUrl.includes("youtube") || videoUrl.includes("youtu.be") || videoUrl.includes("vimeo"));
  return (
    <section className="au-v2 au-v2-med" data-pmx-section="media">
      <div className="au-v2__head">
        <div>
          <div className="au-eb">{T[lang].auFilmMap}</div>
          <h2 className="au-v2__title">{T[lang].auAMinuteOf}</h2>
        </div>
      </div>
      <div className="au-v2-med__row">
        {(videoUrl || videoPoster) && (
          <figure className="au-v2-med__video">
            {playing && videoUrl ? (
              isEmbed
                ? <iframe src={auToEmbed(videoUrl)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} />
                : <video src={videoUrl} controls autoPlay playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", background: "#000" }} />
            ) : (
              <>
                {videoPoster && <img src={videoPoster} alt="" />}
                {videoUrl && (
                  <button className="au-v2-med__play" aria-label="Play video" onClick={() => setPlaying(true)}>
                    <PlayIcon size={22} />
                  </button>
                )}
                <figcaption className="au-v2-med__caption">{T[lang].auFilmMap}</figcaption>
              </>
            )}
          </figure>
        )}
        {mapSrc && (
          <figure className="au-v2-med__map">
            <img src={mapSrc} alt="" />
            <figcaption className="au-v2-med__caption au-v2-med__caption--map">
              <span className="au-eb" style={{ color: "#fff" }}>{T[lang].navItinerary}</span>
              {mapCaption && <span>{mapCaption}</span>}
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}

// ─── Extras ───────────────────────────────────────────────────────────────────

function AuExtrasSection({ pkg, lang }: { pkg: TPackage; lang: "en" | "ar" }) {
  const data = findSec(pkg, "extras");
  const items = secArr(data, "items");
  if (!items.length) return null;
  return (
    <section className="au-v2 au-v2-ex" data-pmx-section="extras">
      <div className="au-v2__head">
        <div>
          <div className="au-eb">{T[lang].auALaCarte}</div>
          <h2 className="au-v2__title">{T[lang].auALaCarteHeading}</h2>
        </div>
        <p className="au-v2__lede">{T[lang].auNothingRequired}</p>
      </div>
      <div className="au-v2-ex__list">
        {items.map((e, i) => {
          const name = secStr(e, "label") || secStr(e, "name");
          const desc = secStr(e, "desc") || secStr(e, "description");
          return (
            <article key={i} className="au-v2-ex__row">
              <div className="au-v2-ex__main">
                <h3 className="au-v2-ex__name">{name}</h3>
                {desc && <p className="au-v2-ex__desc">{desc}</p>}
              </div>
              {secStr(e, "price") && <div className="au-v2-ex__price">{secStr(e, "price")}</div>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ─── Transfers ────────────────────────────────────────────────────────────────

function AuTransfersSection({ pkg, lang }: { pkg: TPackage; lang: "en" | "ar" }) {
  const data = findSec(pkg, "transfers");
  if (!data) return null;
  const rawItems = secArrMixed(data, "items");
  const desc = secStr(data, "description");
  if (!rawItems.length && !desc) return null;
  return (
    <section className="au-v2 au-v2-tx" data-pmx-section="transfers">
      <div className="au-v2__head">
        <div>
          <div className="au-eb">{T[lang].auGettingAround}</div>
          <h2 className="au-v2__title">{T[lang].auTransfersHeading}</h2>
        </div>
        {desc && !rawItems.length && <p className="au-v2__lede">{desc}</p>}
      </div>
      {rawItems.length > 0 && (
        <ol className="au-v2-tx__list">
          {rawItems.map((t, i) => {
            const leg = secItemStr(t, "leg", "from", "title") || (typeof t === "string" ? t : "");
            const meta = typeof t === "object"
              ? [secStr(t as SecData, "mode"), secStr(t as SecData, "duration")].filter(Boolean).join(" · ")
              : "";
            const note = typeof t === "object" ? secStr(t as SecData, "note") : "";
            const included = typeof t === "object" ? (t as SecData).included !== false : true;
            return (
              <li key={i} className="au-v2-tx__row">
                <div className="au-v2-tx__num">{String(i + 1).padStart(2, "0")}</div>
                <div className="au-v2-tx__main">
                  <div className="au-v2-tx__leg">{leg}</div>
                  {meta && <div className="au-v2-tx__meta">{meta}</div>}
                  {note && <div className="au-v2-tx__note">{note}</div>}
                </div>
                <div className="au-v2-tx__pill">{included ? T[lang].includedLabel : T[lang].auAddon}</div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function AuPricingSection({ pkg, lang }: { pkg: TPackage; lang: "en" | "ar" }) {
  const pricingData = findSec(pkg, "pricing");
  const instalments = secArr(pricingData, "instalments");
  const cancellationRows = secArr(pricingData, "cancellation");
  const pricingNote = secStr(pricingData, "note");

  const tiers = pkg.pricingTiers ?? [];
  const cancellationString = pkg.cancellation;

  const hasLeft = instalments.length > 0 || tiers.length > 0;
  const hasRight = cancellationRows.length > 0 || !!cancellationString;

  if (!hasLeft && !hasRight) return null;

  return (
    <section className="au-v2 au-v2-pr" data-pmx-section="pricing">
      <div className="au-v2__head">
        <div>
          <div className="au-eb">{T[lang].auPaymentCancellation}</div>
          <h2 className="au-v2__title">{T[lang].auPayOverMilestones}</h2>
        </div>
        <p className="au-v2__lede">{T[lang].auNotAskUpfront}</p>
      </div>
      <div className="au-v2-pr__grid">
        {hasLeft && (
          <div className="au-v2-pr__col">
            <h4 className="au-v2-pr__h">{T[lang].auInstalmentSchedule}</h4>
            <ol className="au-v2-pr__ladder">
              {instalments.length > 0
                ? instalments.map((it, i) => (
                    <li key={i} className="au-v2-pr__step">
                      <div className="au-v2-pr__amount">{secStr(it, "amount")}</div>
                      <div className="au-v2-pr__when">{secStr(it, "when")}</div>
                      {secStr(it, "desc") && <div className="au-v2-pr__desc">{secStr(it, "desc")}</div>}
                    </li>
                  ))
                : tiers.map((t, i) => (
                    <li key={i} className="au-v2-pr__step">
                      <div className="au-v2-pr__amount">{t.price}</div>
                      <div className="au-v2-pr__when">{localizeTierLabel(t.label, lang)}</div>
                    </li>
                  ))}
            </ol>
          </div>
        )}
        {hasRight && (
          <div className="au-v2-pr__col">
            <h4 className="au-v2-pr__h">{T[lang].auCancellationPolicy}</h4>
            {cancellationRows.length > 0 && (
              <ul className="au-v2-pr__cancel">
                {cancellationRows.map((c, i) => (
                  <li key={i}>
                    <div className="au-v2-pr__window">{secStr(c, "window")}</div>
                    <div className="au-v2-pr__refund">{secStr(c, "refund")}</div>
                  </li>
                ))}
              </ul>
            )}
            {(pricingNote || cancellationString) && (
              <div className="au-v2-pr__note">
                <i>{pricingNote || cancellationString}</i>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Departures (mobile) ──────────────────────────────────────────────────────

function AuDeparturesMobile({ pkg, lang }: { pkg: TPackage; lang: "en" | "ar" }) {
  const deps = pkg.departures ?? [];
  if (!deps.length) return null;
  return (
    <section className="au-section" style={{ paddingTop: 0 }} data-pmx-section="departures">
      <div className="au-section__head">
        <div className="au-eb">{T[lang].departures}</div>
        <h2 className="au-section__title">{T[lang].auThisSeason}</h2>
      </div>
      <div className="au-deps">
        <div className="au-deps__list">
          {deps.map((d, i) => {
            const parts = d.date.split(" ");
            return (
              <div key={i} className="au-deps__row">
                <div>
                  <div className="au-deps__date">{parts[0]} <b>{parts[1]}</b></div>
                </div>
                <div>
                  <div className="au-deps__sub">{parts[2] ?? ""}</div>
                </div>
                <div className={`au-deps__spots${d.spots <= 3 ? " low" : ""}`}>
                  {d.spots <= 3
                    ? T[lang].auOnlyNLeft.replace("{n}", String(d.spots))
                    : `${d.spots} ${T[lang].vySpots}`}
                </div>
                {d.price && <div className="au-deps__price">{d.price}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─── Tiers (mobile) ───────────────────────────────────────────────────────────

function AuTiersMobile({ pkg, lang }: { pkg: TPackage; lang: "en" | "ar" }) {
  const tiers = pkg.pricingTiers ?? [];
  if (!tiers.length) return null;
  return (
    <section className="au-section" style={{ paddingTop: 24 }} data-pmx-section="pricing">
      <div className="au-section__head">
        <div className="au-eb">{T[lang].auAccommodation}</div>
        <h2 className="au-section__title">{T[lang].auChooseYourStay}</h2>
      </div>
      <div className="au-tiers">
        {tiers.map((t, i) => (
          <div key={i} className={`au-tier${t.pop ? " au-tier--pop" : ""}`}>
            {t.pop && <div className="au-tier__badge">{T[lang].auMostChosen}</div>}
            <div className="au-tier__top">
              <span className="au-tier__label">{localizeTierLabel(t.label, lang)}</span>
              <span className="au-tier__price">{t.price}</span>
            </div>
            {t.perks?.length ? (
              <ul className="au-tier__perks">
                {t.perks.map((p, j) => <li key={j}><CheckIcon size={13} /> {p}</li>)}
              </ul>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Departures + Tiers (desktop, side by side) ───────────────────────────────

function AuDeparturesTiersDesktop({ pkg, lang }: { pkg: TPackage; lang: "en" | "ar" }) {
  const deps = pkg.departures ?? [];
  const tiers = pkg.pricingTiers ?? [];
  if (!deps.length && !tiers.length) return null;
  return (
    <section id="au-departures" className="au-d-book" data-pmx-section="departures">
      {deps.length > 0 && (
        <div className="au-d-book__col">
          <div className="au-eb" style={{ marginBottom: 14 }}>{T[lang].departures}</div>
          <h3>{T[lang].auThisSeason}</h3>
          <div className="au-d-deps">
            {deps.map((d, i) => {
              const parts = d.date.split(" ");
              return (
                <div key={i} className="au-d-dep">
                  <div className="au-d-dep__date">{parts[0]} <b>{parts[1]}</b></div>
                  <div className="au-deps__sub">{parts[2] ?? ""}</div>
                  <div className={`au-d-dep__spots${d.spots <= 3 ? " low" : ""}`}>
                    {d.spots <= 3
                      ? T[lang].auOnlyNLeft.replace("{n}", String(d.spots))
                      : `${d.spots} ${T[lang].vySpots}`}
                  </div>
                  {d.price && <div className="au-d-dep__price">{d.price}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
      {tiers.length > 0 && (
        <div className="au-d-book__col">
          <div className="au-eb" style={{ marginBottom: 14 }}>{T[lang].auAccommodation}</div>
          <h3>{T[lang].auChooseYourStay}</h3>
          <div className="au-d-tiers">
            {tiers.map((t, i) => (
              <div key={i} className={`au-d-tier${t.pop ? " au-d-tier--pop" : ""}`}>
                {t.pop && <div className="au-d-tier__badge">{T[lang].auMostChosen}</div>}
                <div className="au-d-tier__label">{localizeTierLabel(t.label, lang)}</div>
                <div className="au-d-tier__price">{t.price}</div>
                <div className="au-d-tier__from">{T[lang].auPerGuestDouble}</div>
                {t.perks?.length ? (
                  <ul className="au-d-tier__perks">
                    {t.perks.map((p, j) => <li key={j}><CheckIcon size={13} />{p}</li>)}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

function AuFaqSection({ pkg, lang }: { pkg: TPackage; lang: "en" | "ar" }) {
  const data = findSec(pkg, "faq");
  const items = secArr(data, "items");
  if (!items.length) return null;
  return (
    <section className="au-v2 au-v2-faq" data-pmx-section="faq">
      <div className="au-v2__head">
        <div>
          <div className="au-eb">{T[lang].auQuestionsAnticipated}</div>
          <h2 className="au-v2__title">{T[lang].auWhatGuestsAsk}</h2>
        </div>
        <p className="au-v2__lede">{T[lang].auFaqWhatsApp}</p>
      </div>
      <dl className="au-v2-faq__list">
        {items.map((f, i) => {
          const q = secStr(f, "q") || secStr(f, "question");
          const a = secStr(f, "a") || secStr(f, "answer");
          return (
            <React.Fragment key={i}>
              <dt className="au-v2-faq__q">
                <span className="au-v2-faq__qm">{String(i + 1).padStart(2, "0")}</span>
                <span className="au-v2-faq__qt">{q}</span>
              </dt>
              <dd className="au-v2-faq__a">{a}</dd>
            </React.Fragment>
          );
        })}
      </dl>
    </section>
  );
}

// ─── Important notes ──────────────────────────────────────────────────────────

function AuImportantNotesSection({ pkg, lang }: { pkg: TPackage; lang: "en" | "ar" }) {
  const data = findSec(pkg, "important_notes");
  const notes = secArr(data, "notes");
  const items = notes.length ? notes : secArr(data, "items");
  if (!items.length) return null;
  return (
    <section className="au-v2 au-v2-no" data-pmx-section="important_notes">
      <div className="au-v2__head">
        <div>
          <div className="au-eb">{T[lang].auPracticalNotes}</div>
          <h2 className="au-v2__title">{T[lang].auWhatToKnow}</h2>
        </div>
        <p className="au-v2__lede">{T[lang].auThingsWeTell}</p>
      </div>
      <div className="au-v2-no__grid">
        {items.map((n, i) => {
          const severity = secStr(n, "severity");
          const title = secStr(n, "title") || secStr(n, "text");
          const body = secStr(n, "body");
          const isWarn = severity === "warn";
          return (
            <article key={i} className={`au-v2-no__card${isWarn ? " au-v2-no__card--warn" : ""}`}>
              <div className="au-v2-no__tag">{isWarn ? T[lang].auImportant : T[lang].auGoodToKnow}</div>
              <h3 className="au-v2-no__title">{title}</h3>
              {body && <p className="au-v2-no__body">{body}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ─── Reviews (mobile) ─────────────────────────────────────────────────────────

function AuReviewsMobile({ pkg, lang, agency }: { pkg: TPackage; lang: "en" | "ar"; agency: TPageProps["agency"] }) {
  const reviews = pkg.reviews ?? [];
  if (!reviews.length || agency.showReviews === false) return null;
  return (
    <section className="au-reviews" data-pmx-section="reviews">
      <div className="au-section__head" style={{ marginBottom: 16 }}>
        <div className="au-eb">{T[lang].auGuestLetters}</div>
      </div>
      {pkg.rating != null && (
        <div className="au-rev-summary">
          <div className="au-rev-summary__big">{pkg.rating}</div>
          <div className="au-rev-summary__sub">
            <AuStars value={pkg.rating} size={14} />
            {pkg.reviewCount != null && (
              <div style={{ marginTop: 6 }}>
                <b>{pkg.reviewCount}</b> {T[lang].auGuests}
              </div>
            )}
          </div>
        </div>
      )}
      {reviews.slice(0, 2).map((r, i) => (
        <article key={i} className="au-rev">
          <p className="au-rev__pull">
            <span className="au-rev__quote">&ldquo;</span>{r.text}
          </p>
          <div className="au-rev__by">
            <b>{r.name}</b>
            {r.country && ` · ${r.country}`}
            {r.createdAt ? ` · ${new Date(r.createdAt).getFullYear()}` : ""}
          </div>
        </article>
      ))}
    </section>
  );
}

// ─── Reviews (desktop) ────────────────────────────────────────────────────────

function AuReviewsDesktop({ pkg, lang, agency }: { pkg: TPackage; lang: "en" | "ar"; agency: TPageProps["agency"] }) {
  const reviews = pkg.reviews ?? [];
  if (!reviews.length || agency.showReviews === false) return null;
  return (
    <section id="au-reviews" className="au-d-reviews" data-pmx-section="reviews">
      <div className="au-d-reviews__top">
        <div>
          <div className="au-eb" style={{ marginBottom: 18 }}>{T[lang].auGuestLetters}</div>
          {pkg.rating != null && (
            <>
              <div className="au-d-reviews__big">{pkg.rating}</div>
              <div className="au-d-reviews__big-sub">
                <AuStars value={pkg.rating} size={12} />
                {pkg.reviewCount != null && (
                  <span style={{ marginLeft: 8 }}>
                    <b>{pkg.reviewCount}</b> {T[lang].auGuests}
                  </span>
                )}
              </div>
            </>
          )}
        </div>
        <p className="au-d-reviews__sub">{T[lang].auRealReviews}</p>
      </div>
      <div className="au-d-reviews__grid">
        {reviews.map((r, i) => (
          <article key={i} className="au-d-rev">
            <p className="au-d-rev__pull">{r.text}</p>
            <div className="au-d-rev__by">
              <b>{r.name}</b>
              {r.country && ` · ${r.country}`}
              {r.createdAt ? ` · ${new Date(r.createdAt).getFullYear()}` : ""}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ─── Inclusions (mobile) ──────────────────────────────────────────────────────

function AuInclusionsMobile({ pkg, lang }: { pkg: TPackage; lang: "en" | "ar" }) {
  const inc = pkg.includes ?? [];
  const exc = pkg.excludes ?? [];
  if (!inc.length && !exc.length) return null;
  return (
    <section className="au-section--paper" data-pmx-section="inclusions">
      <div className="au-section" style={{ background: "transparent" }}>
        <div className="au-section__head">
          <div className="au-eb">{T[lang].auWhatIsIncluded}</div>
        </div>
        <AuMealsVisaChips pkg={pkg} lang={lang} />
        <div className="au-incl">
          {inc.length > 0 && (
            <div className="au-incl__col">
              <h4>{T[lang].includedLabel}</h4>
              <ul className="au-incl__list au-incl__list--in">
                {inc.map((s, i) => <li key={i}><CheckIcon size={13} />{s}</li>)}
              </ul>
            </div>
          )}
          {exc.length > 0 && (
            <div className="au-incl__col">
              <h4>{T[lang].notIncluded}</h4>
              <ul className="au-incl__list au-incl__list--out">
                {exc.map((s, i) => <li key={i}><XIcon size={13} />{s}</li>)}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Inclusions (desktop) ─────────────────────────────────────────────────────

function AuInclusionsDesktop({ pkg, lang }: { pkg: TPackage; lang: "en" | "ar" }) {
  const inc = pkg.includes ?? [];
  const exc = pkg.excludes ?? [];
  if (!inc.length && !exc.length) return null;
  return (
    <section className="au-d-incl" data-pmx-section="inclusions">
      <div>
        <div className="au-eb" style={{ marginBottom: 12 }}>{T[lang].auInclusions}</div>
        <h2 className="au-d-incl__title">{T[lang].auEverythingConsidered}</h2>
        <AuMealsVisaChips pkg={pkg} lang={lang} />
      </div>
      <div className="au-d-incl__cols">
        {inc.length > 0 && (
          <div>
            <h4>{T[lang].includedLabel}</h4>
            <ul className="in">
              {inc.map((s, i) => <li key={i}><CheckIcon size={13} />{s}</li>)}
            </ul>
          </div>
        )}
        {exc.length > 0 && (
          <div>
            <h4>{T[lang].notIncluded}</h4>
            <ul className="out">
              {exc.map((s, i) => <li key={i}><XIcon size={13} />{s}</li>)}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── People ───────────────────────────────────────────────────────────────────

function AuPeopleSection({ pkg, lang, onWhatsApp }: { pkg: TPackage; lang: "en" | "ar"; onWhatsApp?: () => void }) {
  const people = pkg.people ?? [];
  if (!people.length) return null;
  const agentPerson = people.find((p) => p.role === "agent" || p.role === "curator" || p.role === "trip_lead");
  const guides = people.filter((p) => p.role === "guide");
  return (
    <section className="au-v2 au-v2-pp" data-pmx-section="people">
      <div className="au-v2__head">
        <div>
          <div className="au-eb">{T[lang].auTheTeam}</div>
          <h2 className="au-v2__title">{T[lang].auTeamHeading}</h2>
        </div>
        <p className="au-v2__lede">{T[lang].auTeamLede}</p>
      </div>
      <div className="au-v2-pp__row">
        {agentPerson && (
          <article className="au-v2-pp__lead">
            {agentPerson.photo && (
              <img className="au-v2-pp__lead-img" src={agentPerson.photo} alt={agentPerson.name} />
            )}
            <div>
              <div className="au-v2-pp__lead-role">{agentPerson.role}</div>
              <h3 className="au-v2-pp__lead-name">{agentPerson.name}</h3>
              {agentPerson.bio && <p className="au-v2-pp__lead-bio">{agentPerson.bio}</p>}
              <div className="au-v2-pp__lead-row">
                {agentPerson.languages?.length ? (
                  <span className="au-v2-pp__pill">{agentPerson.languages.join(" · ")}</span>
                ) : null}
                {agentPerson.years != null && (
                  <span className="au-v2-pp__pill">{agentPerson.years} {T[lang].auYearsInTravel}</span>
                )}
                {agentPerson.repliesIn && (
                  <span className="au-v2-pp__pill au-v2-pp__pill--g">
                    <span className="au-agent__pulse" />
                    {T[lang].auRepliesIn} {agentPerson.repliesIn}
                  </span>
                )}
              </div>
              {onWhatsApp && (
              <div className="au-v2-pp__lead-cta">
                <button data-testid="wa-cta" className="au-cta-wa" style={{ padding: "12px 18px" }} onClick={onWhatsApp}>
                  <WaIcon size={14} /> {T[lang].auMessageWAPrefix} {agentPerson.name.split(" ")[0]} {T[lang].auOnWhatsApp}
                </button>
              </div>
              )}
            </div>
          </article>
        )}
        {guides.length > 0 && (
          <div className="au-v2-pp__guides">
            <div className="au-eb">{T[lang].auGuidesOnGround}</div>
            {guides.map((g, i) => (
              <article key={i} className="au-v2-pp__guide">
                {g.photo && <img src={g.photo} alt={g.name} />}
                <div>
                  <h4>{g.name}</h4>
                  <div className="au-v2-pp__guide-role">{g.role}</div>
                  {g.bio && <p>{g.bio}</p>}
                  {(g.languages?.length || g.years != null) && (
                    <div className="au-v2-pp__guide-meta">
                      {[g.languages?.join(" · "), g.years != null ? `${g.years} ${T[lang].auYearsInTravel}` : ""].filter(Boolean).join(" · ")}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── About agency ─────────────────────────────────────────────────────────────

function AuAboutAgencySection({ pkg, lang, agency }: { pkg: TPackage; lang: "en" | "ar"; agency: TPageProps["agency"] }) {
  const data = findSec(pkg, "about_agency");
  if (!data && !agency.tagline) return null;
  const story = secStr(data, "story") || secStr(data, "content");
  const founded = secNum(data, "founded");
  const teamSizeNum = secNum(data, "teamSize");
  const teamSizeStr = teamSizeNum != null ? String(teamSizeNum) : secStr(data, "teamSize");
  const teamPhoto = secStr(data, "teamPhoto") || secStr(data, "image");
  const lastTrip = secStr(data, "lastTrip");
  const currentYear = new Date().getFullYear();
  return (
    <section className="au-v2 au-v2-ag" data-pmx-section="about_agency">
      <div className="au-v2-ag__left">
        <div className="au-eb">
          {T[lang].auTheAgency}{founded ? ` · ${lang === "ar" ? "منذ" : "since"} ${founded}` : ""}
        </div>
        <h2 className="au-v2__title" style={{ marginTop: 18 }}>
          {T[lang].auSmallStudio}{founded ? `, ${currentYear - founded} ${T[lang].auYearsLabel.toLowerCase()}` : ""}
        </h2>
        {story && <p className="au-v2-ag__story">{story}</p>}
        {(founded || teamSizeStr) && (
          <div className="au-v2-ag__stats">
            {founded && (
              <div>
                <div className="v">{currentYear - founded}+</div>
                <div className="l">{T[lang].auYearsLabel}</div>
              </div>
            )}
            {teamSizeStr && (
              <div>
                <div className="v">{teamSizeStr}</div>
                <div className="l">{T[lang].auOnTheTeam}</div>
              </div>
            )}
          </div>
        )}
        {lastTrip && (
          <div className="au-v2-ag__last">
            <span className="au-agent__pulse" />
            {lastTrip}
          </div>
        )}
      </div>
      {teamPhoto && (
        <div className="au-v2-ag__photo">
          <img src={teamPhoto} alt={`${agency.name} team`} />
        </div>
      )}
    </section>
  );
}

// ─── Other Packages ───────────────────────────────────────────────────────────

function AuOtherPackagesSection({ pkg, lang, agencySlug }: { pkg: TPackage; lang: "en" | "ar"; agencySlug?: string }) {
  const data = findSec(pkg, "other_packages");
  const cards = secArr(data, "packages");
  if (!cards.length) return null;
  const t = T[lang];
  const heading = secStr(data, "heading") || t.otherPackagesHeading;
  const isRtl = lang === "ar";
  return (
    <section className="au-section" dir={isRtl ? "rtl" : "ltr"} data-pmx-section="other_packages">
      <div className="au-section__head">
        <div className="au-eb">{heading}</div>
      </div>
      <div style={{
        display: "flex", gap: 16, overflowX: "auto",
        paddingBottom: 8,
        scrollSnapType: "x mandatory",
        WebkitOverflowScrolling: "touch",
      }}>
        {cards.map((card, i) => {
          const img = secStr(card, "image");
          const title = secStr(card, "title");
          const dest = secStr(card, "destination");
          const price = secStr(card, "price");
          const nights = secStr(card, "nights");
          const link = secStr(card, "link");
          return (
            <a
              key={i}
              href={link || undefined}
              style={{
                flex: "0 0 220px", minWidth: 220, borderRadius: 14,
                overflow: "hidden", textDecoration: "none",
                border: "1px solid rgba(13,27,46,0.10)",
                background: "#fff",
                scrollSnapAlign: "start",
                display: "flex", flexDirection: "column",
                transition: "box-shadow 0.18s",
              }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 28px -6px rgba(13,27,46,0.18)")}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
            >
              <div style={{ width: "100%", height: 130, background: "rgba(13,27,46,0.06)", flexShrink: 0 }}>
                {img && <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
              </div>
              <div style={{ padding: "12px 14px 14px", flex: 1, display: "flex", flexDirection: "column", gap: 4 }}>
                {dest && <div style={{ fontSize: 10.5, fontWeight: 600, letterSpacing: 1, textTransform: "uppercase", color: "var(--au-brand)", fontFamily: "var(--font-inter-tight, sans-serif)" }}>{dest}</div>}
                <div style={{ fontSize: 14, fontWeight: 700, color: "#0d1b2e", lineHeight: 1.3, fontFamily: "var(--au-serif, Georgia, serif)" }}>{title}</div>
                {(nights || price) && (
                  <div style={{ marginTop: "auto", paddingTop: 8, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    {nights && <span style={{ fontSize: 11.5, color: "rgba(13,27,46,0.5)", fontFamily: "var(--font-inter-tight, sans-serif)" }}>{nights}</span>}
                    {price && <span style={{ fontSize: 13, fontWeight: 700, color: "var(--au-brand)", fontFamily: "var(--font-inter-tight, sans-serif)" }}>{price}</span>}
                  </div>
                )}
              </div>
            </a>
          );
        })}
      </div>
      {agencySlug && (
        <div style={{ marginTop: 16, textAlign: isRtl ? "left" : "right" }}>
          <a href={`/${agencySlug}`} style={{ fontSize: 13, fontWeight: 600, color: "var(--au-brand)", textDecoration: "none", fontFamily: "var(--font-inter-tight, sans-serif)" }}>
            {t.navAllPackages} →
          </a>
        </div>
      )}
    </section>
  );
}

// ─── Custom ───────────────────────────────────────────────────────────────────

function AuCustomSection({ pkg, lang }: { pkg: TPackage; lang: "en" | "ar" }) {
  const data = findSec(pkg, "custom");
  const rawBlocks = secArr(data, "blocks");
  const blocks = rawBlocks.length ? rawBlocks : secArr(data, "items");
  if (!blocks.length) return null;
  return (
    <section className="au-v2 au-v2-cu" data-pmx-section="custom">
      {blocks.map((c, i) => (
        <article key={i} className="au-v2-cu__block">
          <div className="au-eb">{T[lang].auEditorNote}</div>
          <h3 className="au-v2-cu__h">{secStr(c, "heading")}</h3>
          <p className="au-v2-cu__p">{secStr(c, "body")}</p>
        </article>
      ))}
    </section>
  );
}

// ─── Final CTA (mobile) ───────────────────────────────────────────────────────

function AuFinalCtaMobile({ agentFirst, lang, onWhatsApp }: { agentFirst: string; lang: "en" | "ar"; onWhatsApp?: () => void }) {
  return (
    <section className="au-final">
      <h2 className="au-final__title">{T[lang].auShallWeBegin}</h2>
      <p className="au-final__sub">
        {T[lang].auSendToPrefix} {agentFirst} {T[lang].auSendNote}
      </p>
      {onWhatsApp && <button data-testid="wa-cta" className="au-cta-wa" style={{ width: "auto", padding: "16px 26px" }} onClick={onWhatsApp}>
        <WaIcon size={16} /> {T[lang].auMessageWAPrefix} {agentFirst} {T[lang].auOnWhatsApp}
      </button>}
    </section>
  );
}

// ─── Final CTA (desktop) ──────────────────────────────────────────────────────

function AuFinalCtaDesktop({ agentFirst, lang, onWhatsApp }: { agentFirst: string; lang: "en" | "ar"; onWhatsApp?: () => void }) {
  return (
    <section className="au-v2 au-v2-cta">
      <h2 className="au-v2-cta__h">{T[lang].auShallWeBegin}</h2>
      <p className="au-v2-cta__p">
        {T[lang].auSendToPrefix} {agentFirst} {T[lang].auSendNoteLong}
      </p>
      <div className="au-v2-cta__row">
        {onWhatsApp && <button data-testid="wa-cta" className="au-cta-wa" style={{ padding: "16px 28px", fontSize: 14 }} onClick={onWhatsApp}>
          <WaIcon size={15} /> {T[lang].auMessageWAPrefix} {agentFirst} {T[lang].auOnWhatsApp}
        </button>}
      </div>
    </section>
  );
}

// ─── Trust strip (mobile, 2-col grid) ────────────────────────────────────────

function AuTrustStrip({ lang, agent }: { lang: "en" | "ar"; agent?: TPackage["agent"] }) {
  const items: { icon: React.ReactNode; text: string }[] = [
    { icon: <ShieldIcon size={13} />, text: T[lang].auFreeCancelDays },
    { icon: <WaIcon size={13} />, text: T[lang].bookWhatsApp },
    { icon: <SparkIcon size={13} />, text: T[lang].auCuratedNeverResold },
    ...(agent?.years ? [{ icon: <CheckIcon size={13} />, text: `${agent.years} ${T[lang].auYearsInTravel}` }] : []),
  ];
  return (
    <div className="au-trust">
      {items.map((c, i) => (
        <div key={i} className="au-trust__cell">
          <span className="au-trust__icon">{c.icon}</span>
          {c.text}
        </div>
      ))}
    </div>
  );
}

// ─── Trust strip (desktop) ────────────────────────────────────────────────────

function AuDesktopTrustStrip({ lang, agent }: { lang: "en" | "ar"; agent?: TPackage["agent"] }) {
  const items = [
    { icon: <ShieldIcon size={18} />, t: T[lang].freeCancellation,      s: T[lang].auUpTo30Days },
    { icon: <WaIcon size={18} />,     t: T[lang].auPayViaWA,            s: T[lang].auCardTransfer },
    { icon: <SparkIcon size={18} />,  t: T[lang].auCuratedNeverResold,  s: T[lang].auDesignedInHouse },
    { icon: <CheckIcon size={18} />,
      t: agent?.years ? `${agent.years} ${T[lang].auYearsInTravel}` : T[lang].auVerifiedExperience,
      s: T[lang].auOnGroundPartners },
  ];
  return (
    <div className="au-d-trust">
      {items.map((c, i) => (
        <div key={i} className="au-d-trust__cell">
          {c.icon}
          <div>
            <div className="t">{c.t}</div>
            <div className="s">{c.s}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Dark agent closing band (mobile) ─────────────────────────────────────────

function AuAgentDarkBand({ pkg, lang }: { pkg: TPackage; lang: "en" | "ar" }) {
  const agent = pkg.agent;
  if (!agent?.name) return null;
  return (
    <section className="au-agent">
      <div className="au-eb au-eb--light" style={{ color: "rgba(255,255,255,0.6)" }}>{T[lang].curatedByPrefix}</div>
      <div className="au-agent__inner" style={{ marginTop: 14 }}>
        {agent.avatar && (
          <img className="au-agent__avatar" src={agent.avatar} alt={agent.name} />
        )}
        <div>
          <div className="au-agent__name">{agent.name}</div>
          <div className="au-agent__role">{agent.role}</div>
        </div>
      </div>
      <div className="au-agent__pill">
        <span className="au-agent__pulse" />
        {T[lang].auOnline}{agent.repliesIn ? ` · ${T[lang].auRepliesIn} ${agent.repliesIn}` : ""}
      </div>
    </section>
  );
}

// ─── Chapter itinerary (mobile) ───────────────────────────────────────────────

function AuChaptersMobile({ pkg, lang }: { pkg: TPackage; lang: "en" | "ar" }) {
  const itinerary = (pkg.itinerary ?? []).filter((it) => it.title?.trim());
  if (!itinerary.length) return null;
  return (
    <section className="au-section" style={{ paddingTop: 32 }} data-pmx-section="itinerary">
      <div className="au-section__head">
        <div className="au-eb">{T[lang].dayByDay}</div>
        <h2 className="au-section__title">{T[lang].auDaysLikeChapters}</h2>
      </div>
      {itinerary.slice(0, 4).map((d, i) => (
        <article key={i} className="au-story">
          {d.img && (
            <div className="au-story__img">
              <img src={d.img} alt={d.title} />
            </div>
          )}
          <div className="au-story__head">
            <div className="au-story__day">{String(d.day).padStart(2, "0")}</div>
            {d.chapter && <div className="au-story__chap">{d.chapter}</div>}
          </div>
          <h3 className="au-story__title">{d.title}</h3>
          {d.desc && <p className="au-story__desc">{d.desc}</p>}
        </article>
      ))}
      {itinerary.length > 4 && (
        <button
          className="au-cta-out"
          style={{ marginLeft: 0, fontFamily: '"Instrument Serif", serif', fontSize: 16, fontStyle: "italic", border: "none", padding: "8px 0", color: "var(--au-brand)" }}
        >
          {T[lang].auReadRemainingPrefix} {itinerary.length - 4} {T[lang].auReadRemainingChapters} <ArrowIcon size={14} />
        </button>
      )}
    </section>
  );
}

// ─── Chapter itinerary (desktop) ─────────────────────────────────────────────

function AuChaptersDesktop({ pkg, lang }: { pkg: TPackage; lang: "en" | "ar" }) {
  const itinerary = (pkg.itinerary ?? []).filter((it) => it.title?.trim());
  if (!itinerary.length) return null;
  return (
    <section id="au-itinerary" className="au-d-story-section" data-pmx-section="itinerary">
      <div className="au-d-story-section__head">
        <div>
          <div className="au-eb">{T[lang].dayByDay}</div>
          <h2 className="au-d-story-section__title">{T[lang].auChapters}</h2>
        </div>
        <p className="au-d-story-section__lede">{T[lang].auItineraryLede}</p>
      </div>
      {itinerary.slice(0, 4).map((d, i) => (
        <article key={i} className={`au-d-story${i % 2 ? " au-d-story--flip" : ""}`}>
          {d.img && (
            <div className="au-d-story__media">
              <img src={d.img} alt={d.title} />
            </div>
          )}
          <div className="au-d-story__body">
            <div className="au-d-story__day">{String(d.day).padStart(2, "0")}</div>
            {d.chapter && <div className="au-d-story__chap">{d.chapter}</div>}
            <h3 className="au-d-story__title">{d.title}</h3>
            {d.desc && <p className="au-d-story__desc">{d.desc}</p>}
          </div>
        </article>
      ))}
    </section>
  );
}

// ─── Desktop editorial intro ──────────────────────────────────────────────────

function AuDesktopIntro({ pkg, lang }: { pkg: TPackage; lang: "en" | "ar" }) {
  const nights = pkg.nights ? Number(pkg.nights) : null;
  const desc = pkg.description ?? "";
  return (
    <section className="au-d-intro">
      <div>
        <div className="au-eb">{T[lang].editorialTheJourney} · 01</div>
        <h2 className="au-d-intro__title">
          {nights ? `${nights} ${T[lang].nightsLabel}, ` : ""}{T[lang].auCarefullyUnhurried}
        </h2>
        {nights && <div className="au-d-intro__sub">{nights} {T[lang].auChaptersOf} {pkg.destination}</div>}
      </div>
      {desc && (
        <p className="au-d-intro__prose">
          <span className="dropcap">{desc[0]}</span>
          {desc.slice(1)}
        </p>
      )}
    </section>
  );
}

// ─── Desktop footer ───────────────────────────────────────────────────────────

function AuDesktopFooter({ agency }: { agency: TPageProps["agency"] }) {
  return (
    <div className="au-d-foot">
      <div><b>{agency.name}</b>{agency.tagline ? ` · ${agency.tagline}` : ""}</div>
      <div>Powered by Packmetrix</div>
    </div>
  );
}

// ─── TemplateAuroraPage ───────────────────────────────────────────────────────

export function TemplateAuroraPage({ pkg, agency, onWhatsApp, lang = "en" }: TPageProps) {
  const isDesktop = useIsDesktop();
  const nights = pkg.nights ? Number(pkg.nights) : null;
  const coverImage = pkg.coverImage ?? "";
  const title = pkg.title ?? pkg.destination;
  const agentName =
    pkg.people?.find((p) => p.role === "agent" || p.role === "curator" || p.role === "trip_lead")?.name
    ?? pkg.agent?.name
    ?? "";
  const agentFirst = agentName.split(" ")[0] || (lang === "ar" ? "الفريق" : "us");
  const dep = pkg.departures?.[0];
  const hasDepartures = (pkg.departures?.length ?? 0) > 0;
  const agencyInitial = agency.name?.[0] ?? "A";

  return (
    <div className={`au${!isDesktop ? " au--mobile" : ""}`} dir={lang === "ar" ? "rtl" : "ltr"} lang={lang}>
      {isDesktop ? (
        <>
          {/* ── Desktop nav ─────────────────────────────────────────────── */}
          <div className="au-d-nav">
            <div className="au-d-nav__brand">
              <div className="au-m-nav__mark au-d-nav__mark" style={{ width: 32, height: 32, fontSize: 16 }}>
                {agencyInitial}
              </div>
              <div>
                <div className="au-d-nav__name">{agency.name}</div>
                {agency.tagline && <div className="au-d-nav__sub">{agency.tagline}</div>}
              </div>
            </div>
            <div className="au-d-nav__links">
              {[
                { label: T[lang].auNavTheJourney, id: "au-highlights" },
                { label: T[lang].auNavChapters,   id: "au-itinerary" },
                { label: T[lang].auNavStay,        id: "au-stay" },
                ...(hasDepartures ? [{ label: T[lang].departures, id: "au-departures" }] : []),
                { label: T[lang].auNavGuestLetters, id: "au-reviews" },
              ].map(({ label, id }) => (
                <a
                  key={label}
                  className="au-d-nav__link"
                  href={`#${id}`}
                  onClick={(e) => { e.preventDefault(); document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }); }}
                >{label}</a>
              ))}
              {pkg.price && (
                <div className="au-d-nav__price">{T[lang].from} <b>{pkg.price}</b></div>
              )}
              {pkg.whatsapp && <button data-testid="wa-cta" className="au-cta-wa" style={{ padding: "10px 18px", fontSize: 13 }} onClick={onWhatsApp}>
                <WaIcon size={14} /> {T[lang].auSpeakTo} {agentFirst}
              </button>}
            </div>
          </div>

          {/* ── Split hero ──────────────────────────────────────────────── */}
          <section className="au-d-hero" data-pmx-section="hero">
            <div className="au-d-hero__text">
              <div>
                <div className="au-d-hero__topbar">
                  <div className="au-eb" data-pmx-field="destination">{pkg.destination}</div>
                  {pkg.rating != null && (
                    <div className="rating">
                      <AuStars value={pkg.rating} size={12} />
                      {" "}{pkg.rating} · {pkg.reviewCount} {T[lang].auGuests}
                    </div>
                  )}
                </div>
                <h1 className="au-d-hero__title" data-pmx-field="title">{title}</h1>
                {pkg.description && <p className="au-d-hero__desc">{pkg.description}</p>}
                <div className="au-d-hero__cta-row">
                  <div className="au-d-hero__price-block">
                    <div className="lab">{T[lang].auFromPerGuest}</div>
                    <div className="price" data-pmx-field="price">{pkg.price}</div>
                    {nights && <div className="sub">{nights} {T[lang].nightsLabel} · {T[lang].auDoubleOccupancy}</div>}
                  </div>
                  <div className="au-d-hero__buttons">
                    {pkg.whatsapp && <button data-testid="wa-cta" className="au-cta-wa" style={{ padding: "14px 24px" }} onClick={onWhatsApp}>
                      <WaIcon size={15} /> {T[lang].auSpeakTo} {agentFirst}
                    </button>}
                  </div>
                </div>
              </div>
              <div className="au-d-hero__bottom">
                {nights && (
                  <div>
                    <div className="v">{nights} {T[lang].nightsLabel}</div>
                    <div className="l">{pkg.destination}</div>
                  </div>
                )}
                <div>
                  <div className="v">{T[lang].auFree30Days}</div>
                  <div className="l">{T[lang].auCancelNoPenalty}</div>
                </div>
                {pkg.scarcity?.spotsRemaining != null && dep && (
                  <div>
                    <div className="v">{T[lang].auDeparts} {dep.date.split(",")[0]}</div>
                    <div className="l">
                      {pkg.scarcity.totalSpots != null
                        ? T[lang].auOnlyNOfMLeft.replace("{n}", String(pkg.scarcity.spotsRemaining)).replace("{m}", String(pkg.scarcity.totalSpots))
                        : T[lang].auOnlyNLeft.replace("{n}", String(pkg.scarcity.spotsRemaining))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="au-d-hero__img">
              {coverImage && <img src={coverImage} alt={pkg.destination} />}
              <div className="au-d-hero__img-caption">{pkg.destination}</div>
            </div>
          </section>

          {/* ── Scarcity ribbon ─────────────────────────────────────────── */}
          {(pkg.scarcity?.spotsRemaining != null || pkg.viewersNow != null || pkg.recentBookings) && (
            <div className="au-d-ribbon">
              {pkg.scarcity?.spotsRemaining != null && (
                <div className="au-d-ribbon__group">
                  <span className="au-d-ribbon__dot" />
                  <span>
                    {pkg.scarcity.totalSpots != null
                      ? T[lang].auOnlyNOfMLeft.replace("{n}", String(pkg.scarcity.spotsRemaining)).replace("{m}", String(pkg.scarcity.totalSpots))
                      : T[lang].auOnlyNLeft.replace("{n}", String(pkg.scarcity.spotsRemaining))}
                    {dep ? ` · ${dep.date.split(" ").slice(0, 2).join(" ")}` : ""}
                  </span>
                </div>
              )}
              {pkg.viewersNow != null && (
                <div className="au-d-ribbon__group">
                  <span><b>{pkg.viewersNow}</b> {T[lang].auTravellersViewing}</span>
                </div>
              )}
              {pkg.recentBookings && (
                <div className="au-d-ribbon__group">
                  <span>{T[lang].auLastBooked} <b>{pkg.recentBookings.hoursAgo} {T[lang].auHoursAgo}</b></span>
                </div>
              )}
              <div className="au-d-ribbon__spacer" />
              {hasDepartures && (
                <a
                  className="au-d-ribbon__group"
                  href="#au-departures"
                  onClick={(e) => { e.preventDefault(); document.getElementById("au-departures")?.scrollIntoView({ behavior: "smooth" }); }}
                  style={{ color: "rgba(255,255,255,0.7)", textDecoration: "underline", textUnderlineOffset: 3, cursor: "pointer" }}
                >
                  {T[lang].auSeeAllDepartures}
                </a>
              )}
            </div>
          )}

          {/* ── Desktop trust strip ─────────────────────────────────────── */}
          <AuDesktopTrustStrip lang={lang} agent={pkg.agent} />

          {/* ── Editorial intro ─────────────────────────────────────────── */}
          <AuDesktopIntro pkg={pkg} lang={lang} />

          {/* ── Highlights ──────────────────────────────────────────────── */}
          <AuHighlightsSection pkg={pkg} lang={lang} />

          {/* ── Chapter itinerary (first 4) ──────────────────────────────── */}
          <AuChaptersDesktop pkg={pkg} lang={lang} />

          {/* ── Hotels ──────────────────────────────────────────────────── */}
          <AuHotelsSection pkg={pkg} lang={lang} />

          {/* ── Gallery ─────────────────────────────────────────────────── */}
          <AuGalleryDesktop pkg={pkg} lang={lang} />

          {/* ── Media ───────────────────────────────────────────────────── */}
          <AuMediaSection pkg={pkg} lang={lang} />

          {/* ── Extras ──────────────────────────────────────────────────── */}
          <AuExtrasSection pkg={pkg} lang={lang} />

          {/* ── Transfers ───────────────────────────────────────────────── */}
          <AuTransfersSection pkg={pkg} lang={lang} />

          {/* ── Pricing ─────────────────────────────────────────────────── */}
          <AuPricingSection pkg={pkg} lang={lang} />

          {/* ── Departures + Tiers ──────────────────────────────────────── */}
          <AuDeparturesTiersDesktop pkg={pkg} lang={lang} />

          {/* ── FAQ ─────────────────────────────────────────────────────── */}
          <AuFaqSection pkg={pkg} lang={lang} />

          {/* ── Important notes ─────────────────────────────────────────── */}
          <AuImportantNotesSection pkg={pkg} lang={lang} />

          {/* ── Reviews ─────────────────────────────────────────────────── */}
          <AuReviewsDesktop pkg={pkg} lang={lang} agency={agency} />

          {/* ── Inclusions ──────────────────────────────────────────────── */}
          <AuInclusionsDesktop pkg={pkg} lang={lang} />

          {/* ── People (foregrounded) ────────────────────────────────────── */}
          <AuPeopleSection pkg={pkg} lang={lang} onWhatsApp={pkg.whatsapp ? onWhatsApp : undefined} />

          {/* ── About agency ────────────────────────────────────────────── */}
          <AuAboutAgencySection pkg={pkg} lang={lang} agency={agency} />

          {/* ── Custom ──────────────────────────────────────────────────── */}
          <AuCustomSection pkg={pkg} lang={lang} />

          {/* ── Other packages ──────────────────────────────────────────── */}
          <AuOtherPackagesSection pkg={pkg} lang={lang} agencySlug={agency.agencySlug} />

          {/* ── Final CTA ───────────────────────────────────────────────── */}
          <AuFinalCtaDesktop agentFirst={agentFirst} lang={lang} onWhatsApp={pkg.whatsapp ? onWhatsApp : undefined} />

          {/* ── Footer ──────────────────────────────────────────────────── */}
          <AuDesktopFooter agency={agency} />
        </>
      ) : (
        <>
          {/* ── Mobile nav ──────────────────────────────────────────────── */}
          <div className="au-m-nav">
            <div className="au-m-nav__brand">
              <div className="au-m-nav__mark">{agencyInitial}</div>
              <div>
                <div className="au-m-nav__name">{agency.name}</div>
                {agency.tagline && <div className="au-m-nav__sub">{agency.tagline}</div>}
              </div>
            </div>
          </div>

          {/* ── Hero ────────────────────────────────────────────────────── */}
          <div className="au-m-hero" data-pmx-section="hero">
            {coverImage && <img className="au-m-hero__img" src={coverImage} alt={pkg.destination} />}
            <div className="au-m-hero__veil" />
            <div className="au-m-hero__top">
              <div className="au-eb au-eb--light" data-pmx-field="destination">{pkg.destination}</div>
              {pkg.rating != null && (
                <div className="au-m-hero__rating">
                  <AuStars value={pkg.rating} size={10} color="#fff" />
                  {" "}{pkg.rating} · {pkg.reviewCount}
                </div>
              )}
            </div>
            <div className="au-m-hero__bottom">
              <div
                className="au-m-hero__stamp"
                style={{ textAlign: "left", color: "rgba(255,255,255,0.7)", marginBottom: 6 }}
              >
                {T[lang].curatedByPrefix}{nights ? `, ${nights} ${T[lang].nightsLabel}` : ""}{agentName ? ` · ${agentName}` : ""}
              </div>
              <h1 className="au-m-hero__title" data-pmx-field="title">{title}</h1>
            </div>
          </div>

          {/* ── Floating booking card ────────────────────────────────────── */}
          <div className="au-m-booking">
            <div className="au-m-booking__top">
              <div>
                <div className="au-m-booking__price-lab">{T[lang].auFromPerGuest}</div>
                <div className="au-m-booking__price" data-pmx-field="price">{pkg.price}</div>
                <div className="au-m-booking__sub">{T[lang].auDoubleOccupancy}</div>
              </div>
              {dep && (
                <div className="au-m-booking__nights">
                  {nights && <b>{nights} {T[lang].nightsLabel}</b>}
                  <div className="au-m-booking__nights-l">{dep.date.split(",")[0]}</div>
                </div>
              )}
            </div>
            {pkg.scarcity?.spotsRemaining != null && (
              <div className="au-m-booking__scarcity">
                <span className="dot" />
                <span>
                  {pkg.scarcity.totalSpots != null
                    ? T[lang].auOnlyNOfMLeft.replace("{n}", String(pkg.scarcity.spotsRemaining)).replace("{m}", String(pkg.scarcity.totalSpots))
                    : T[lang].auOnlyNLeft.replace("{n}", String(pkg.scarcity.spotsRemaining))}
                </span>
              </div>
            )}
            {pkg.whatsapp && <div className="au-m-booking__cta">
              <button data-testid="wa-cta" className="au-cta-wa" onClick={onWhatsApp}>
                <WaIcon size={15} /> {T[lang].auSpeakTo} {agentFirst}
              </button>
            </div>}
          </div>

          {/* ── Trust strip ─────────────────────────────────────────────── */}
          <AuTrustStrip lang={lang} agent={pkg.agent} />

          {/* ── Editorial intro ─────────────────────────────────────────── */}
          <section className="au-section">
            <div className="au-section__head">
              <div className="au-eb">{T[lang].editorialTheJourney}</div>
            </div>
            <p className="au-prose">{pkg.description}</p>
          </section>

          {/* ── Highlights ──────────────────────────────────────────────── */}
          <AuHighlightsSection pkg={pkg} lang={lang} />

          {/* ── Chapter itinerary (first 4 + read more) ─────────────────── */}
          <AuChaptersMobile pkg={pkg} lang={lang} />

          {/* ── Hotels ──────────────────────────────────────────────────── */}
          <AuHotelsSection pkg={pkg} lang={lang} />

          {/* ── Gallery ─────────────────────────────────────────────────── */}
          <AuGalleryMobile pkg={pkg} lang={lang} />

          {/* ── Media ───────────────────────────────────────────────────── */}
          <AuMediaSection pkg={pkg} lang={lang} />

          {/* ── Departures ──────────────────────────────────────────────── */}
          <AuDeparturesMobile pkg={pkg} lang={lang} />

          {/* ── Tiers ───────────────────────────────────────────────────── */}
          <AuTiersMobile pkg={pkg} lang={lang} />

          {/* ── Extras ──────────────────────────────────────────────────── */}
          <AuExtrasSection pkg={pkg} lang={lang} />

          {/* ── Transfers ───────────────────────────────────────────────── */}
          <AuTransfersSection pkg={pkg} lang={lang} />

          {/* ── Pricing ─────────────────────────────────────────────────── */}
          <AuPricingSection pkg={pkg} lang={lang} />

          {/* ── FAQ ─────────────────────────────────────────────────────── */}
          <AuFaqSection pkg={pkg} lang={lang} />

          {/* ── Important notes ─────────────────────────────────────────── */}
          <AuImportantNotesSection pkg={pkg} lang={lang} />

          {/* ── People ──────────────────────────────────────────────────── */}
          <AuPeopleSection pkg={pkg} lang={lang} onWhatsApp={pkg.whatsapp ? onWhatsApp : undefined} />

          {/* ── About agency ────────────────────────────────────────────── */}
          <AuAboutAgencySection pkg={pkg} lang={lang} agency={agency} />

          {/* ── Custom ──────────────────────────────────────────────────── */}
          <AuCustomSection pkg={pkg} lang={lang} />

          {/* ── Other packages ──────────────────────────────────────────── */}
          <AuOtherPackagesSection pkg={pkg} lang={lang} agencySlug={agency.agencySlug} />

          {/* ── Dark agent closing band ──────────────────────────────────── */}
          <AuAgentDarkBand pkg={pkg} lang={lang} />

          {/* ── Reviews ─────────────────────────────────────────────────── */}
          <AuReviewsMobile pkg={pkg} lang={lang} agency={agency} />

          {/* ── Inclusions ──────────────────────────────────────────────── */}
          <AuInclusionsMobile pkg={pkg} lang={lang} />

          {/* ── Final CTA ───────────────────────────────────────────────── */}
          <AuFinalCtaMobile agentFirst={agentFirst} lang={lang} onWhatsApp={pkg.whatsapp ? onWhatsApp : undefined} />

          {/* ── Sticky bottom bar ───────────────────────────────────────── */}
          <div className="au-sticky">
            <div>
              <div className="au-sticky__price">{pkg.price}</div>
              <div className="au-sticky__sub">
                <span className="dot" />
                {pkg.spotsRemaining != null ? (lang === "ar" ? `${pkg.spotsRemaining} متبقي` : `${pkg.spotsRemaining} left`) : ""}
                {dep ? ` · ${dep.date.split(",")[0]}` : ""}
              </div>
            </div>
            {pkg.whatsapp && <button data-testid="wa-cta" className="au-cta-wa au-sticky__cta" style={{ padding: "12px 18px" }} onClick={onWhatsApp}>
              <WaIcon size={14} /> {T[lang].auSpeakTo} {agentFirst}
            </button>}
          </div>
        </>
      )}
    </div>
  );
}

// ─── TemplateAuroraCard ───────────────────────────────────────────────────────

export function TemplateAuroraCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
