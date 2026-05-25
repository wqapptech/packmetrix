"use client";

import React from "react";
import "@/app/aurora.css";
import { useIsDesktop, BaseCard } from "./shared";
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

// Read a field from an item that may be a plain string or an object.
// Falls back across multiple key names until one returns a non-empty value.
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

// Like secArr but also includes plain-string elements (wraps them as { _s: value }).
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
  // builder: separate "meals" section (key "plan") and "visa" section (key "included")
  // richer schema: "inclusions" section with "meals" / "visa" keys
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
          <span className="au-eb">{lang === "ar" ? "خطة الوجبات" : "Meal plan"}</span>
          <div className="au-v2-mv__chip-body">
            <h4>{MEAL_LABELS[meals]?.[lang] ?? meals}</h4>
          </div>
        </div>
      )}
      {visaStatus && (
        <div className="au-v2-mv__chip">
          <span className="au-eb">{lang === "ar" ? "التأشيرة" : "Visa"}</span>
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

function AuHighlightsSection({ pkg }: { pkg: TPackage }) {
  const data = findSec(pkg, "highlights");
  const rawItems = secArrMixed(data, "items");
  if (rawItems.length < 2) return null;
  return (
    <section className="au-v2 au-v2-hl">
      <div className="au-v2-hl__head">
        <div className="au-eb">{secStr(data, "eyebrow") || "Three things to know"}</div>
        <h2 className="au-v2__title">What we <em>designed</em> in</h2>
      </div>
      <div className="au-v2-hl__grid">
        {rawItems.map((item, i) => {
          const num = secItemStr(item, "num") || String(i + 1).padStart(2, "0");
          // builder tagList stores plain strings; repeater stores {title, body}
          const title = secItemStr(item, "title");
          const body = secItemStr(item, "body");
          return (
            <article key={i} className="au-v2-hl__card">
              <div className="au-v2-hl__num">{num}</div>
              <h3 className="au-v2-hl__title">{title || (typeof item === "string" ? item : "")}</h3>
              {body && <p className="au-v2-hl__body">{body}</p>}
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ─── Hotels ───────────────────────────────────────────────────────────────────

function AuHotelsSection({ pkg }: { pkg: TPackage }) {
  const data = findSec(pkg, "hotels");
  const hotels = secArr(data, "hotels").length ? secArr(data, "hotels") : secArr(data, "items");

  if (hotels.length) {
    return (
      <section className="au-v2 au-v2-htl">
        <div className="au-v2__head">
          <div>
            <div className="au-eb">{secStr(data, "eyebrow") || "Where you stay"}</div>
            <h2 className="au-v2__title">The <em>properties</em></h2>
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
                  {nights && <span className="au-v2-htl__nights">{nights} nights</span>}
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

  // Tier-3 fallback — schema gap: rich hotels[] not yet stored
  if (!pkg.hotelDescription?.trim()) return null;
  return (
    <section className="au-v2 au-v2-htl">
      <div className="au-v2__head">
        <div>
          <div className="au-eb">Where you stay</div>
          <h2 className="au-v2__title">The <em>properties</em></h2>
        </div>
        <p className="au-v2__lede">{pkg.hotelDescription}</p>
      </div>
    </section>
  );
}

// ─── Gallery mobile ───────────────────────────────────────────────────────────

function AuGalleryMobile({ pkg }: { pkg: TPackage }) {
  const images = pkg.gallery?.map((g) => g.src) ?? pkg.images ?? [];
  if (!images.length) return null;
  return (
    <section className="au-gal-m">
      <div className="au-section__head">
        <div className="au-eb">In photographs</div>
      </div>
      <div className="au-gal-m__grid">
        {images.slice(0, 5).map((src, i) => (
          <div key={i} className="au-gal-m__cell">
            <img src={src} alt={pkg.destination} />
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Gallery desktop ──────────────────────────────────────────────────────────

function AuGalleryDesktop({ pkg }: { pkg: TPackage }) {
  const items = pkg.gallery ?? (pkg.images ?? []).map((src) => ({ src, caption: "" }));
  if (!items.length) return null;
  return (
    <section className="au-d-gallery">
      <div className="au-section__head" style={{ padding: 0, marginBottom: 28 }}>
        <div className="au-eb">In photographs</div>
        <h2 className="au-d-story-section__title" style={{ marginTop: 14, fontSize: 44 }}>
          What guests <em>photograph</em>
        </h2>
      </div>
      <div className="au-d-gallery__grid">
        {items.slice(0, 5).map((g, i) => (
          <div key={i} className="au-d-gallery__cell">
            <img src={g.src} alt={g.caption || pkg.destination} />
            {g.caption && <div className="au-d-gallery__cap">{g.caption}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── Media (video + map) ──────────────────────────────────────────────────────

function AuMediaSection({ pkg }: { pkg: TPackage }) {
  const mediaSec = findSec(pkg, "media");
  const videoUrl = secStr(mediaSec, "videoUrl") || pkg.videoUrl || "";
  const videoPoster = secStr(mediaSec, "videoPoster") || "";
  const mapSrc = secStr(mediaSec, "mapImage") || secStr(mediaSec, "mapSrc") || "";
  const mapCaption = secStr(mediaSec, "mapCaption") || "";
  if (!videoUrl && !videoPoster && !mapSrc) return null;
  return (
    <section className="au-v2 au-v2-med">
      <div className="au-v2__head">
        <div>
          <div className="au-eb">Film &amp; map</div>
          <h2 className="au-v2__title">A minute of <em>what it looks like</em></h2>
        </div>
      </div>
      <div className="au-v2-med__row">
        {(videoUrl || videoPoster) && (
          <figure className="au-v2-med__video">
            {videoPoster && <img src={videoPoster} alt="film poster" />}
            <button className="au-v2-med__play" aria-label="Play video">
              <PlayIcon size={22} />
            </button>
            <figcaption className="au-v2-med__caption">Film</figcaption>
          </figure>
        )}
        {mapSrc && (
          <figure className="au-v2-med__map">
            <img src={mapSrc} alt="map" />
            <figcaption className="au-v2-med__caption au-v2-med__caption--map">
              <span className="au-eb" style={{ color: "#fff" }}>The route</span>
              {mapCaption && <span>{mapCaption}</span>}
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}

// ─── Extras ───────────────────────────────────────────────────────────────────

function AuExtrasSection({ pkg }: { pkg: TPackage }) {
  const data = findSec(pkg, "extras");
  const items = secArr(data, "items");
  if (!items.length) return null;
  return (
    <section className="au-v2 au-v2-ex">
      <div className="au-v2__head">
        <div>
          <div className="au-eb">À la carte</div>
          <h2 className="au-v2__title">Quiet <em>additions</em></h2>
        </div>
        <p className="au-v2__lede">
          Nothing required — these are the small things returning guests ask for.
        </p>
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

function AuTransfersSection({ pkg }: { pkg: TPackage }) {
  const data = findSec(pkg, "transfers");
  if (!data) return null;
  // Builder stores items as tagList (strings) or as rich repeater objects
  const rawItems = secArrMixed(data, "items");
  const desc = secStr(data, "description");
  if (!rawItems.length && !desc) return null;
  return (
    <section className="au-v2 au-v2-tx">
      <div className="au-v2__head">
        <div>
          <div className="au-eb">Getting there &amp; around</div>
          <h2 className="au-v2__title">Private <em>throughout</em></h2>
        </div>
        {desc && !rawItems.length && <p className="au-v2__lede">{desc}</p>}
      </div>
      {rawItems.length > 0 && (
        <ol className="au-v2-tx__list">
          {rawItems.map((t, i) => {
            // tagList: plain string → use as the leg label
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
                <div className="au-v2-tx__pill">{included ? "Included" : "Add-on"}</div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

// ─── Pricing ──────────────────────────────────────────────────────────────────

function AuPricingSection({ pkg }: { pkg: TPackage }) {
  const pricingData = findSec(pkg, "pricing");
  // Rich schema: instalments[] each has { amount, when, desc }
  const instalments = secArr(pricingData, "instalments");
  // Rich schema: cancellation[] each has { window, refund }
  const cancellationRows = secArr(pricingData, "cancellation");
  const pricingNote = secStr(pricingData, "note");

  // Tier-3 fallbacks
  const tiers = pkg.pricingTiers ?? [];
  const cancellationString = pkg.cancellation;

  const hasLeft = instalments.length > 0 || tiers.length > 0;
  const hasRight = cancellationRows.length > 0 || !!cancellationString;

  if (!hasLeft && !hasRight) return null;

  return (
    <section className="au-v2 au-v2-pr">
      <div className="au-v2__head">
        <div>
          <div className="au-eb">Payment &amp; cancellation</div>
          <h2 className="au-v2__title">Pay over <em>milestones</em></h2>
        </div>
        <p className="au-v2__lede">We don&apos;t ask for the full sum upfront.</p>
      </div>
      <div className="au-v2-pr__grid">
        {hasLeft && (
          <div className="au-v2-pr__col">
            <h4 className="au-v2-pr__h">Instalment schedule</h4>
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
                      <div className="au-v2-pr__when">{t.label}</div>
                    </li>
                  ))}
            </ol>
          </div>
        )}
        {hasRight && (
          <div className="au-v2-pr__col">
            <h4 className="au-v2-pr__h">Cancellation policy</h4>
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

function AuDeparturesMobile({ pkg }: { pkg: TPackage }) {
  const deps = pkg.departures ?? [];
  if (!deps.length) return null;
  return (
    <section className="au-section" style={{ paddingTop: 0 }}>
      <div className="au-section__head">
        <div className="au-eb">Departures</div>
        <h2 className="au-section__title">Four windows <em>this season</em></h2>
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
                  {d.spots <= 3 ? `Only ${d.spots} left` : `${d.spots} spots`}
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

function AuTiersMobile({ pkg }: { pkg: TPackage }) {
  const tiers = pkg.pricingTiers ?? [];
  if (!tiers.length) return null;
  return (
    <section className="au-section" style={{ paddingTop: 24 }}>
      <div className="au-section__head">
        <div className="au-eb">Three ways to stay</div>
        <h2 className="au-section__title">Suite, villa, <em>or residence</em></h2>
      </div>
      <div className="au-tiers">
        {tiers.map((t, i) => (
          <div key={i} className={`au-tier${t.pop ? " au-tier--pop" : ""}`}>
            {t.pop && <div className="au-tier__badge">Most chosen</div>}
            <div className="au-tier__top">
              <span className="au-tier__label">{t.label}</span>
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

function AuDeparturesTiersDesktop({ pkg }: { pkg: TPackage }) {
  const deps = pkg.departures ?? [];
  const tiers = pkg.pricingTiers ?? [];
  if (!deps.length && !tiers.length) return null;
  return (
    <section className="au-d-book">
      {deps.length > 0 && (
        <div className="au-d-book__col">
          <div className="au-eb" style={{ marginBottom: 14 }}>Departures</div>
          <h3>Four <em>windows</em></h3>
          <div className="au-d-deps">
            {deps.map((d, i) => {
              const parts = d.date.split(" ");
              return (
                <div key={i} className="au-d-dep">
                  <div className="au-d-dep__date">{parts[0]} <b>{parts[1]}</b></div>
                  <div className="au-deps__sub">{parts[2] ?? ""}</div>
                  <div className={`au-d-dep__spots${d.spots <= 3 ? " low" : ""}`}>
                    {d.spots <= 3 ? `Only ${d.spots} left` : `${d.spots} spots`}
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
          <div className="au-eb" style={{ marginBottom: 14 }}>Three ways to stay</div>
          <h3>Suite, villa, <em>or residence</em></h3>
          <div className="au-d-tiers">
            {tiers.map((t, i) => (
              <div key={i} className={`au-d-tier${t.pop ? " au-d-tier--pop" : ""}`}>
                {t.pop && <div className="au-d-tier__badge">Most chosen</div>}
                <div className="au-d-tier__label">{t.label}</div>
                <div className="au-d-tier__price">{t.price}</div>
                <div className="au-d-tier__from">per guest, double occupancy</div>
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

function AuFaqSection({ pkg }: { pkg: TPackage }) {
  const data = findSec(pkg, "faq");
  const items = secArr(data, "items");
  if (!items.length) return null;
  return (
    <section className="au-v2 au-v2-faq">
      <div className="au-v2__head">
        <div>
          <div className="au-eb">Questions, mostly anticipated</div>
          <h2 className="au-v2__title">What guests usually <em>ask</em></h2>
        </div>
        <p className="au-v2__lede">
          If your question isn&apos;t here, WhatsApp us. We reply inside thirty minutes.
        </p>
      </div>
      <dl className="au-v2-faq__list">
        {items.map((f, i) => {
          // builder stores {question, answer}; bundle sample used {q, a}
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

function AuImportantNotesSection({ pkg }: { pkg: TPackage }) {
  const data = findSec(pkg, "important_notes");
  const notes = secArr(data, "notes");
  const items = notes.length ? notes : secArr(data, "items");
  if (!items.length) return null;
  return (
    <section className="au-v2 au-v2-no">
      <div className="au-v2__head">
        <div>
          <div className="au-eb">Practical notes</div>
          <h2 className="au-v2__title">What to <em>know</em></h2>
        </div>
        <p className="au-v2__lede">Things we&apos;d tell a friend before they went.</p>
      </div>
      <div className="au-v2-no__grid">
        {items.map((n, i) => {
          const severity = secStr(n, "severity");
          // builder stores plain {text}; richer format has {title, body, severity}
          const title = secStr(n, "title") || secStr(n, "text");
          const body = secStr(n, "body");
          const isWarn = severity === "warn";
          return (
            <article key={i} className={`au-v2-no__card${isWarn ? " au-v2-no__card--warn" : ""}`}>
              <div className="au-v2-no__tag">{isWarn ? "Important" : "Good to know"}</div>
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

function AuReviewsMobile({ pkg }: { pkg: TPackage }) {
  const reviews = pkg.reviews ?? [];
  if (!reviews.length) return null;
  return (
    <section className="au-reviews">
      <div className="au-section__head" style={{ marginBottom: 16 }}>
        <div className="au-eb">Guest letters</div>
      </div>
      {pkg.rating != null && (
        <div className="au-rev-summary">
          <div className="au-rev-summary__big">{pkg.rating}</div>
          <div className="au-rev-summary__sub">
            <AuStars value={pkg.rating} size={14} />
            <div style={{ marginTop: 6 }}>
              <b>{pkg.reviewCount} guests</b> over three seasons
            </div>
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

function AuReviewsDesktop({ pkg }: { pkg: TPackage }) {
  const reviews = pkg.reviews ?? [];
  if (!reviews.length) return null;
  return (
    <section className="au-d-reviews">
      <div className="au-d-reviews__top">
        <div>
          <div className="au-eb" style={{ marginBottom: 18 }}>Guest letters</div>
          {pkg.rating != null && (
            <>
              <div className="au-d-reviews__big">{pkg.rating}</div>
              <div className="au-d-reviews__big-sub">
                <AuStars value={pkg.rating} size={12} />
                <span style={{ marginLeft: 8 }}>
                  <b>{pkg.reviewCount}</b> guests over three seasons
                </span>
              </div>
            </>
          )}
        </div>
        <p className="au-d-reviews__sub">
          Real reviews from real travellers — no screenshots, no aggregator.
        </p>
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
    <section className="au-section--paper">
      <div className="au-section" style={{ background: "transparent" }}>
        <div className="au-section__head">
          <div className="au-eb">{lang === "ar" ? "ما يشمله السعر" : "What is included"}</div>
        </div>
        <AuMealsVisaChips pkg={pkg} lang={lang} />
        <div className="au-incl">
          {inc.length > 0 && (
            <div className="au-incl__col">
              <h4>{lang === "ar" ? "مشمول" : "Included"}</h4>
              <ul className="au-incl__list au-incl__list--in">
                {inc.map((s, i) => <li key={i}><CheckIcon size={13} />{s}</li>)}
              </ul>
            </div>
          )}
          {exc.length > 0 && (
            <div className="au-incl__col">
              <h4>{lang === "ar" ? "غير مشمول" : "Not included"}</h4>
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
    <section className="au-d-incl">
      <div>
        <div className="au-eb" style={{ marginBottom: 12 }}>
          {lang === "ar" ? "ما يشمله السعر" : "Inclusions"}
        </div>
        <h2 className="au-d-incl__title">Everything <em>considered</em></h2>
        <AuMealsVisaChips pkg={pkg} lang={lang} />
      </div>
      <div className="au-d-incl__cols">
        {inc.length > 0 && (
          <div>
            <h4>{lang === "ar" ? "مشمول" : "Included"}</h4>
            <ul className="in">
              {inc.map((s, i) => <li key={i}><CheckIcon size={13} />{s}</li>)}
            </ul>
          </div>
        )}
        {exc.length > 0 && (
          <div>
            <h4>{lang === "ar" ? "غير مشمول" : "Not included"}</h4>
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

function AuPeopleSection({ pkg, onWhatsApp }: { pkg: TPackage; onWhatsApp: () => void }) {
  const people = pkg.people ?? [];
  if (!people.length) return null;
  const agentPerson = people.find((p) => p.role === "agent" || p.role === "curator" || p.role === "trip_lead");
  const guides = people.filter((p) => p.role === "guide");
  return (
    <section className="au-v2 au-v2-pp">
      <div className="au-v2__head">
        <div>
          <div className="au-eb">The team</div>
          <h2 className="au-v2__title">Designer, driver, <em>and the guide</em></h2>
        </div>
        <p className="au-v2__lede">
          The people you&apos;ll be in touch with — each has been part of our team for years.
        </p>
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
                  <span className="au-v2-pp__pill">{agentPerson.years} years</span>
                )}
                {agentPerson.repliesIn && (
                  <span className="au-v2-pp__pill au-v2-pp__pill--g">
                    <span className="au-agent__pulse" />
                    Replies in {agentPerson.repliesIn}
                  </span>
                )}
              </div>
              <div className="au-v2-pp__lead-cta">
                <button className="au-cta-wa" style={{ padding: "12px 18px" }} onClick={onWhatsApp}>
                  <WaIcon size={14} /> Message {agentPerson.name.split(" ")[0]}
                </button>
                <button className="au-cta-out">Book a 20-min call</button>
              </div>
            </div>
          </article>
        )}
        {guides.length > 0 && (
          <div className="au-v2-pp__guides">
            <div className="au-eb">Guides on the ground</div>
            {guides.map((g, i) => (
              <article key={i} className="au-v2-pp__guide">
                {g.photo && <img src={g.photo} alt={g.name} />}
                <div>
                  <h4>{g.name}</h4>
                  <div className="au-v2-pp__guide-role">{g.role}</div>
                  {g.bio && <p>{g.bio}</p>}
                  {(g.languages?.length || g.years != null) && (
                    <div className="au-v2-pp__guide-meta">
                      {[g.languages?.join(" · "), g.years != null ? `${g.years} yrs` : ""].filter(Boolean).join(" · ")}
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

function AuAboutAgencySection({ pkg, agency }: { pkg: TPackage; agency: TPageProps["agency"] }) {
  const data = findSec(pkg, "about_agency");
  if (!data && !agency.tagline) return null;
  // builder stores {content, image}; richer schema uses {story, teamPhoto, founded, teamSize, lastTrip}
  const story = secStr(data, "story") || secStr(data, "content");
  const founded = secNum(data, "founded");
  const teamSizeNum = secNum(data, "teamSize");
  const teamSizeStr = teamSizeNum != null ? String(teamSizeNum) : secStr(data, "teamSize");
  const teamPhoto = secStr(data, "teamPhoto") || secStr(data, "image");
  const lastTrip = secStr(data, "lastTrip");
  const currentYear = new Date().getFullYear();
  return (
    <section className="au-v2 au-v2-ag">
      <div className="au-v2-ag__left">
        <div className="au-eb">
          The agency{founded ? ` · since ${founded}` : ""}
        </div>
        <h2 className="au-v2__title" style={{ marginTop: 18 }}>
          A small <em>studio</em>{founded ? `, ${currentYear - founded} years in` : ""}
        </h2>
        {story && <p className="au-v2-ag__story">{story}</p>}
        {(founded || teamSizeStr) && (
          <div className="au-v2-ag__stats">
            {founded && (
              <div>
                <div className="v">{currentYear - founded}+</div>
                <div className="l">Years</div>
              </div>
            )}
            {teamSizeStr && (
              <div>
                <div className="v">{teamSizeStr}</div>
                <div className="l">On the team</div>
              </div>
            )}
            <div>
              <div className="v">180</div>
              <div className="l">Trips per year</div>
            </div>
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

// ─── Custom ───────────────────────────────────────────────────────────────────

function AuCustomSection({ pkg }: { pkg: TPackage }) {
  const data = findSec(pkg, "custom");
  const rawBlocks = secArr(data, "blocks");
  const blocks = rawBlocks.length ? rawBlocks : secArr(data, "items");
  if (!blocks.length) return null;
  return (
    <section className="au-v2 au-v2-cu">
      {blocks.map((c, i) => (
        <article key={i} className="au-v2-cu__block">
          <div className="au-eb">Editor&rsquo;s note</div>
          <h3 className="au-v2-cu__h">{secStr(c, "heading")}</h3>
          <p className="au-v2-cu__p">{secStr(c, "body")}</p>
        </article>
      ))}
    </section>
  );
}

// ─── Final CTA (mobile) ───────────────────────────────────────────────────────

function AuFinalCtaMobile({ agentFirst, onWhatsApp }: { agentFirst: string; onWhatsApp: () => void }) {
  return (
    <section className="au-final">
      <h2 className="au-final__title">Shall we <em>begin?</em></h2>
      <p className="au-final__sub">
        Send {agentFirst} a note. They&apos;ll reply, ask three questions, and write you a personal itinerary.
      </p>
      <button className="au-cta-wa" style={{ width: "auto", padding: "16px 26px" }} onClick={onWhatsApp}>
        <WaIcon size={16} /> Message {agentFirst} on WhatsApp
      </button>
    </section>
  );
}

// ─── Final CTA (desktop) ──────────────────────────────────────────────────────

function AuFinalCtaDesktop({ agentFirst, onWhatsApp }: { agentFirst: string; onWhatsApp: () => void }) {
  return (
    <section className="au-v2 au-v2-cta">
      <h2 className="au-v2-cta__h">Shall we <em>begin?</em></h2>
      <p className="au-v2-cta__p">
        Send {agentFirst} a note. They&apos;ll reply, ask three questions about how you like to wake up, and write you a personal itinerary inside 24 hours.
      </p>
      <div className="au-v2-cta__row">
        <button className="au-cta-wa" style={{ padding: "16px 28px", fontSize: 14 }} onClick={onWhatsApp}>
          <WaIcon size={15} /> Message {agentFirst} on WhatsApp
        </button>
        <button className="au-cta-out" style={{ padding: "15px 24px" }}>Book a 20-min call</button>
      </div>
    </section>
  );
}

// ─── Trust strip (mobile, 2-col grid) ────────────────────────────────────────

function AuTrustStrip({ agent }: { agent?: TPackage["agent"] }) {
  const items: { icon: React.ReactNode; text: string }[] = [
    { icon: <ShieldIcon size={13} />, text: "Free cancel · 30 days" },
    { icon: <WaIcon size={13} />, text: "Book via WhatsApp" },
    { icon: <SparkIcon size={13} />, text: "Curated, never resold" },
    ...(agent?.years ? [{ icon: <CheckIcon size={13} />, text: `${agent.years} yrs in travel` }] : []),
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

function AuDesktopTrustStrip({ agent }: { agent?: TPackage["agent"] }) {
  const items = [
    { icon: <ShieldIcon size={18} />, t: "Free cancellation",      s: "Up to 30 days before departure" },
    { icon: <WaIcon size={18} />,     t: "Pay via WhatsApp",       s: "Card, transfer, or instalments" },
    { icon: <SparkIcon size={18} />,  t: "Curated, never resold",  s: "Designed in-house, not by a wholesaler" },
    { icon: <CheckIcon size={18} />,  t: agent?.years ? `${agent.years} years in travel` : "Verified experience", s: "On-the-ground partners" },
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

function AuAgentDarkBand({ pkg }: { pkg: TPackage }) {
  const agent = pkg.agent;
  if (!agent?.name) return null;
  return (
    <section className="au-agent">
      <div className="au-eb au-eb--light" style={{ color: "rgba(255,255,255,0.6)" }}>Curated by</div>
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
        Online · replies in {agent.repliesIn ?? "<30 min"}
      </div>
    </section>
  );
}

// ─── Chapter itinerary (mobile) ───────────────────────────────────────────────

function AuChaptersMobile({ pkg }: { pkg: TPackage }) {
  const itinerary = (pkg.itinerary ?? []).filter((it) => it.title?.trim());
  if (!itinerary.length) return null;
  return (
    <section className="au-section" style={{ paddingTop: 32 }}>
      <div className="au-section__head">
        <div className="au-eb">Day by day</div>
        <h2 className="au-section__title">
          Days that read like <em>chapters</em>
        </h2>
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
          Read the remaining {itinerary.length - 4} chapters <ArrowIcon size={14} />
        </button>
      )}
    </section>
  );
}

// ─── Chapter itinerary (desktop) ─────────────────────────────────────────────

function AuChaptersDesktop({ pkg }: { pkg: TPackage }) {
  const itinerary = (pkg.itinerary ?? []).filter((it) => it.title?.trim());
  if (!itinerary.length) return null;
  return (
    <section className="au-d-story-section">
      <div className="au-d-story-section__head">
        <div>
          <div className="au-eb">Day by day</div>
          <h2 className="au-d-story-section__title">
            <em>Chapters</em>
          </h2>
        </div>
        <p className="au-d-story-section__lede">
          Not an itinerary so much as a sequence. Some days are full; some are deliberately empty. The pace is yours.
        </p>
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
            {d.chapter && <div className="au-d-story__chap">Chapter · {d.chapter}</div>}
            <h3 className="au-d-story__title">{d.title}</h3>
            {d.desc && <p className="au-d-story__desc">{d.desc}</p>}
          </div>
        </article>
      ))}
    </section>
  );
}

// ─── Desktop editorial intro ──────────────────────────────────────────────────

function AuDesktopIntro({ pkg }: { pkg: TPackage }) {
  const nights = pkg.nights ? Number(pkg.nights) : null;
  const desc = pkg.description ?? "";
  return (
    <section className="au-d-intro">
      <div>
        <div className="au-eb">The journey · 01</div>
        <h2 className="au-d-intro__title">
          {nights ? `${nights} nights, ` : ""}<em>carefully unhurried</em>
        </h2>
        {nights && <div className="au-d-intro__sub">{nights} chapters · {pkg.destination}</div>}
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
  const agentFirst = agentName.split(" ")[0] || "us";
  const dep = pkg.departures?.[0];
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
              {["The journey", "Chapters", "Stay", "Departures", "Guest letters"].map((l) => (
                <a key={l} className="au-d-nav__link">{l}</a>
              ))}
              {pkg.price && (
                <div className="au-d-nav__price">From <b>{pkg.price}</b></div>
              )}
              <button className="au-cta-wa" style={{ padding: "10px 18px", fontSize: 13 }} onClick={onWhatsApp}>
                <WaIcon size={14} /> Speak to {agentFirst}
              </button>
            </div>
          </div>

          {/* ── Split hero ──────────────────────────────────────────────── */}
          <section className="au-d-hero">
            <div className="au-d-hero__text">
              <div>
                <div className="au-d-hero__topbar">
                  <div className="au-eb">{pkg.destination}</div>
                  {pkg.rating != null && (
                    <div className="rating">
                      <AuStars value={pkg.rating} size={12} />
                      {" "}{pkg.rating} · {pkg.reviewCount} guests
                    </div>
                  )}
                </div>
                <h1 className="au-d-hero__title">{title}</h1>
                {pkg.description && <p className="au-d-hero__desc">{pkg.description}</p>}
                <div className="au-d-hero__cta-row">
                  <div className="au-d-hero__price-block">
                    <div className="lab">From · per guest</div>
                    <div className="price">{pkg.price}</div>
                    {nights && <div className="sub">{nights} nights · double occupancy</div>}
                  </div>
                  <div className="au-d-hero__buttons">
                    <button className="au-cta-wa" style={{ padding: "14px 24px" }} onClick={onWhatsApp}>
                      <WaIcon size={15} /> Speak to {agentFirst}
                    </button>
                    <button className="au-cta-out" style={{ padding: "13px 20px" }}>Save</button>
                  </div>
                </div>
              </div>
              <div className="au-d-hero__bottom">
                {nights && (
                  <div>
                    <div className="v">{nights} nights</div>
                    <div className="l">{pkg.destination}</div>
                  </div>
                )}
                <div>
                  <div className="v">Free 30 days</div>
                  <div className="l">Cancel without penalty</div>
                </div>
                {pkg.spotsRemaining != null && dep && (
                  <div>
                    <div className="v">Departs {dep.date.split(",")[0]}</div>
                    <div className="l">Only {pkg.spotsRemaining} of {pkg.totalSpots} left</div>
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
          {(pkg.spotsRemaining != null || pkg.viewersNow != null || pkg.recentBookings) && (
            <div className="au-d-ribbon">
              {pkg.spotsRemaining != null && (
                <div className="au-d-ribbon__group">
                  <span className="au-d-ribbon__dot" />
                  <span>
                    Only <b>{pkg.spotsRemaining} of {pkg.totalSpots}</b> left
                    {dep ? ` for ${dep.date.split(" ").slice(0, 2).join(" ")}` : ""}
                  </span>
                </div>
              )}
              {pkg.viewersNow != null && (
                <div className="au-d-ribbon__group">
                  <span><b>{pkg.viewersNow}</b> travellers viewing</span>
                </div>
              )}
              {pkg.recentBookings && (
                <div className="au-d-ribbon__group">
                  <span>Last booked <b>{pkg.recentBookings.hoursAgo} hours ago</b></span>
                </div>
              )}
              <div className="au-d-ribbon__spacer" />
              <a
                className="au-d-ribbon__group"
                style={{ color: "rgba(255,255,255,0.7)", textDecoration: "underline", textUnderlineOffset: 3, cursor: "pointer" }}
              >
                See all departures →
              </a>
            </div>
          )}

          {/* ── Desktop trust strip ─────────────────────────────────────── */}
          <AuDesktopTrustStrip agent={pkg.agent} />

          {/* ── Editorial intro ─────────────────────────────────────────── */}
          <AuDesktopIntro pkg={pkg} />

          {/* ── Highlights ──────────────────────────────────────────────── */}
          <AuHighlightsSection pkg={pkg} />

          {/* ── Chapter itinerary (first 4) ──────────────────────────────── */}
          <AuChaptersDesktop pkg={pkg} />

          {/* ── Hotels ──────────────────────────────────────────────────── */}
          <AuHotelsSection pkg={pkg} />

          {/* ── Gallery ─────────────────────────────────────────────────── */}
          <AuGalleryDesktop pkg={pkg} />

          {/* ── Media ───────────────────────────────────────────────────── */}
          <AuMediaSection pkg={pkg} />

          {/* ── Extras ──────────────────────────────────────────────────── */}
          <AuExtrasSection pkg={pkg} />

          {/* ── Transfers ───────────────────────────────────────────────── */}
          <AuTransfersSection pkg={pkg} />

          {/* ── Pricing ─────────────────────────────────────────────────── */}
          <AuPricingSection pkg={pkg} />

          {/* ── Departures + Tiers ──────────────────────────────────────── */}
          <AuDeparturesTiersDesktop pkg={pkg} />

          {/* ── FAQ ─────────────────────────────────────────────────────── */}
          <AuFaqSection pkg={pkg} />

          {/* ── Important notes ─────────────────────────────────────────── */}
          <AuImportantNotesSection pkg={pkg} />

          {/* ── Reviews ─────────────────────────────────────────────────── */}
          <AuReviewsDesktop pkg={pkg} />

          {/* ── Inclusions ──────────────────────────────────────────────── */}
          <AuInclusionsDesktop pkg={pkg} lang={lang} />

          {/* ── People (foregrounded) ────────────────────────────────────── */}
          <AuPeopleSection pkg={pkg} onWhatsApp={onWhatsApp} />

          {/* ── About agency ────────────────────────────────────────────── */}
          <AuAboutAgencySection pkg={pkg} agency={agency} />

          {/* ── Custom ──────────────────────────────────────────────────── */}
          <AuCustomSection pkg={pkg} />

          {/* ── Final CTA ───────────────────────────────────────────────── */}
          <AuFinalCtaDesktop agentFirst={agentFirst} onWhatsApp={onWhatsApp} />

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
            <button className="au-m-nav__cta">Save</button>
          </div>

          {/* ── Hero ────────────────────────────────────────────────────── */}
          <div className="au-m-hero">
            {coverImage && <img className="au-m-hero__img" src={coverImage} alt={pkg.destination} />}
            <div className="au-m-hero__veil" />
            <div className="au-m-hero__top">
              <div className="au-eb au-eb--light">{pkg.destination}</div>
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
                Curated{nights ? `, ${nights} nights` : ""}{agentName ? ` · ${agentName}` : ""}
              </div>
              <h1 className="au-m-hero__title">{title}</h1>
            </div>
          </div>

          {/* ── Floating booking card ────────────────────────────────────── */}
          <div className="au-m-booking">
            <div className="au-m-booking__top">
              <div>
                <div className="au-m-booking__price-lab">From · per guest</div>
                <div className="au-m-booking__price">{pkg.price}</div>
                <div className="au-m-booking__sub">double occupancy</div>
              </div>
              {dep && (
                <div className="au-m-booking__nights">
                  {nights && <b>{nights} nights</b>}
                  <div className="au-m-booking__nights-l">{dep.date.split(",")[0]}</div>
                </div>
              )}
            </div>
            {pkg.spotsRemaining != null && pkg.totalSpots != null && (
              <div className="au-m-booking__scarcity">
                <span className="dot" />
                <span>
                  <i>Only </i><b>{pkg.spotsRemaining}</b> of {pkg.totalSpots} villas remaining <i>for this departure</i>
                </span>
              </div>
            )}
            <div className="au-m-booking__cta">
              <button className="au-cta-wa" onClick={onWhatsApp}>
                <WaIcon size={15} /> Speak to {agentFirst}
              </button>
              <button className="au-cta-out" aria-label="Save">♡</button>
            </div>
          </div>

          {/* ── Trust strip ─────────────────────────────────────────────── */}
          <AuTrustStrip agent={pkg.agent} />

          {/* ── Editorial intro ─────────────────────────────────────────── */}
          <section className="au-section">
            <div className="au-section__head">
              <div className="au-eb">The journey</div>
            </div>
            <p className="au-prose">{pkg.description}</p>
          </section>

          {/* ── Highlights ──────────────────────────────────────────────── */}
          <AuHighlightsSection pkg={pkg} />

          {/* ── Chapter itinerary (first 4 + read more) ─────────────────── */}
          <AuChaptersMobile pkg={pkg} />

          {/* ── Hotels ──────────────────────────────────────────────────── */}
          <AuHotelsSection pkg={pkg} />

          {/* ── Gallery ─────────────────────────────────────────────────── */}
          <AuGalleryMobile pkg={pkg} />

          {/* ── Media ───────────────────────────────────────────────────── */}
          <AuMediaSection pkg={pkg} />

          {/* ── Departures ──────────────────────────────────────────────── */}
          <AuDeparturesMobile pkg={pkg} />

          {/* ── Tiers ───────────────────────────────────────────────────── */}
          <AuTiersMobile pkg={pkg} />

          {/* ── Extras ──────────────────────────────────────────────────── */}
          <AuExtrasSection pkg={pkg} />

          {/* ── Transfers ───────────────────────────────────────────────── */}
          <AuTransfersSection pkg={pkg} />

          {/* ── Pricing ─────────────────────────────────────────────────── */}
          <AuPricingSection pkg={pkg} />

          {/* ── FAQ ─────────────────────────────────────────────────────── */}
          <AuFaqSection pkg={pkg} />

          {/* ── Important notes ─────────────────────────────────────────── */}
          <AuImportantNotesSection pkg={pkg} />

          {/* ── People ──────────────────────────────────────────────────── */}
          <AuPeopleSection pkg={pkg} onWhatsApp={onWhatsApp} />

          {/* ── About agency ────────────────────────────────────────────── */}
          <AuAboutAgencySection pkg={pkg} agency={agency} />

          {/* ── Custom ──────────────────────────────────────────────────── */}
          <AuCustomSection pkg={pkg} />

          {/* ── Dark agent closing band ──────────────────────────────────── */}
          <AuAgentDarkBand pkg={pkg} />

          {/* ── Reviews ─────────────────────────────────────────────────── */}
          <AuReviewsMobile pkg={pkg} />

          {/* ── Inclusions ──────────────────────────────────────────────── */}
          <AuInclusionsMobile pkg={pkg} lang={lang} />

          {/* ── Final CTA ───────────────────────────────────────────────── */}
          <AuFinalCtaMobile agentFirst={agentFirst} onWhatsApp={onWhatsApp} />

          {/* ── Sticky bottom bar ───────────────────────────────────────── */}
          <div className="au-sticky">
            <div>
              <div className="au-sticky__price">{pkg.price}</div>
              <div className="au-sticky__sub">
                <span className="dot" />
                {pkg.spotsRemaining != null ? `${pkg.spotsRemaining} left` : ""}
                {dep ? ` · ${dep.date.split(",")[0]}` : ""}
              </div>
            </div>
            <button className="au-cta-wa au-sticky__cta" style={{ padding: "12px 18px" }} onClick={onWhatsApp}>
              <WaIcon size={14} /> Speak to {agentFirst}
            </button>
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
