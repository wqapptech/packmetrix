"use client";

import "@/app/voyage.css";
import React, { useState } from "react";
import { T, localizeTierLabel } from "@/lib/translations";
import {
  useIsDesktop,
  BaseCard,
  DesktopNav,
  DesktopFooter,
  WAButton,
  AgencyBar,
  DContainer,
  StickyCTA,
  LightboxCarousel,
} from "./shared";
import type { TPageProps, TCardProps, TPricingTier } from "./types";

// ─── Constants ────────────────────────────────────────────────────────────────

const ACID  = "#d6f43d";
const BG    = "#0a0b0c";
const FG    = "#f0ede6";
const MUT   = "rgba(240,237,230,0.55)";
const SMUT  = "rgba(240,237,230,0.35)";
const LINE  = "rgba(255,255,255,0.09)";
const PINK  = "#e03660";
const ARCH  = "var(--font-archivo-black,'Archivo Black',sans-serif)";
const MONO  = "var(--font-jetbrains-mono,'JetBrains Mono',monospace)";

// ─── Data helpers ──────────────────────────────────────────────────────────────

type SD = Record<string, unknown>;

function findSec(pkg: TPageProps["pkg"], type: string): SD | undefined {
  return pkg.sections?.find((s) => s.type === type)?.data as SD | undefined;
}
function findAllSec(pkg: TPageProps["pkg"], type: string): SD[] {
  return (pkg.sections?.filter((s) => s.type === type).map((s) => s.data) ?? []) as SD[];
}
function secArr(d: SD | undefined, key: string): SD[] {
  if (!d) return [];
  const v = d[key];
  if (!Array.isArray(v)) return [];
  return v.filter((x): x is SD => x != null && typeof x === "object");
}
function secStr(d: SD | undefined, key: string): string {
  if (!d) return "";
  const v = d[key];
  return typeof v === "string" ? v : "";
}
function secNum(d: SD | undefined, key: string): number | undefined {
  if (!d) return undefined;
  const v = d[key];
  return typeof v === "number" ? v : undefined;
}
function secStrArr(d: SD | undefined, key: string): string[] {
  if (!d) return [];
  const v = d[key];
  return Array.isArray(v) ? v.filter((s): s is string => typeof s === "string") : [];
}
function itemStr(item: SD | string, ...keys: string[]): string {
  if (typeof item === "string") return item;
  for (const k of keys) {
    const v = (item as SD)[k];
    if (typeof v === "string" && v) return v;
  }
  return "";
}

// ─── Label maps ───────────────────────────────────────────────────────────────

const MEAL_LABELS: Record<string, { en: string; ar: string }> = {
  none:         { en: "Meals not included",  ar: "الوجبات غير مشمولة" },
  breakfast:    { en: "Breakfast included",  ar: "الإفطار مشمول" },
  half_board:   { en: "Half board",          ar: "إقامة نصفية" },
  full_board:   { en: "Full board",          ar: "إقامة كاملة" },
  all_inclusive:{ en: "All inclusive",       ar: "شامل بالكامل" },
};
const VISA_LABELS: Record<string, { en: string; ar: string }> = {
  included:   { en: "Visa included",    ar: "التأشيرة مشمولة" },
  assistance: { en: "Visa assistance",  ar: "مساعدة في التأشيرة" },
  required:   { en: "Visa required",    ar: "التأشيرة مطلوبة" },
  free:       { en: "Visa-free",        ar: "بدون تأشيرة" },
};

// ─── Icons ─────────────────────────────────────────────────────────────────────

function WaIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.116.553 4.103 1.523 5.828L.069 23.447a.5.5 0 00.484.553h.046l5.748-1.503A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.694-.5-5.24-1.374l-.364-.21-3.825 1 1.016-3.715-.232-.378A9.953 9.953 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function ArrowIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

// ─── Ticker ────────────────────────────────────────────────────────────────────

function VyTicker({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: "en" | "ar" }) {
  const t = T[lang];
  const messages: string[] = [];
  const scarcity = pkg.scarcity;
  if (scarcity?.spotsRemaining != null) messages.push(`${t.vyOnlyNSpotsLeft} ${scarcity.spotsRemaining} ${t.vySpotsLeft}`);
  const depSec = findSec(pkg, "departures");
  const deps = secArr(depSec, "departures").length ? secArr(depSec, "departures") : secArr(depSec, "items");
  if (deps[0]) {
    const d = itemStr(deps[0], "date");
    if (d) messages.push(`${t.vyNextDeparture}: ${d}`);
  }
  if (scarcity?.wasPrice && pkg.price) messages.push(t.vyTickerSave);
  if (!messages.length) return null;

  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => setIdx((i) => (i + 1) % messages.length), 3000);
    return () => clearInterval(id);
  }, [messages.length]);

  return (
    <div className="vy-ticker">
      <span className="vy-ticker__pulse" />
      <span className="vy-ticker__text">{messages[idx]}</span>
    </div>
  );
}

// ─── Gallery ───────────────────────────────────────────────────────────────────

function VyGalleryMobile({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: "en" | "ar" }) {
  const t = T[lang];
  const data = findSec(pkg, "media");
  const photos = secStrArr(data, "images").length ? secStrArr(data, "images") : (pkg.images ?? []);
  const [lbIdx, setLbIdx] = useState<number | null>(null);
  if (!photos.length) return null;
  return (
    <section className="vy-gal" data-pmx-section="media">
      <div className="vy-sec__eb">{t.vyPhotos}</div>
      <div className="vy-gal__grid">
        {photos.slice(0, 6).map((src, i) => (
          <div key={i} className="vy-gal__cell" onClick={() => setLbIdx(i)} style={{ cursor: "pointer" }}>
            <img src={src} alt="photo" onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }} />
          </div>
        ))}
      </div>
      {lbIdx !== null && <LightboxCarousel images={photos} startIndex={lbIdx} onClose={() => setLbIdx(null)} />}
    </section>
  );
}

function VyGalleryDesktop({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: "en" | "ar" }) {
  const t = T[lang];
  const data = findSec(pkg, "media");
  const photos = secStrArr(data, "images").length ? secStrArr(data, "images") : (pkg.images ?? []);
  const [lbIdx, setLbIdx] = useState<number | null>(null);
  if (!photos.length) return null;
  return (
    <section className="vy-d-sec" data-pmx-section="media">
      <div className="vy-d-sec__head">
        <div>
          <div className="vy-d-sec__eb">{t.gallery}</div>
          <h2 className="vy-d-sec__title">{t.vyCapturedMoments}</h2>
        </div>
      </div>
      <div className="vy-d-gal">
        {photos.slice(0, 6).map((src, i) => (
          <div key={i} className="vy-d-gal__cell" onClick={() => setLbIdx(i)} style={{ cursor: "pointer" }}>
            <img src={src} alt="photo" onError={(e) => { (e.currentTarget.parentElement as HTMLElement).style.display = "none"; }} />
          </div>
        ))}
      </div>
      {lbIdx !== null && <LightboxCarousel images={photos} startIndex={lbIdx} onClose={() => setLbIdx(null)} />}
    </section>
  );
}

// ─── Itinerary ─────────────────────────────────────────────────────────────────

function VyItineraryMobile({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: "en" | "ar" }) {
  const t = T[lang];
  const data = findSec(pkg, "itinerary");
  const items = secArr(data, "items").length ? secArr(data, "items") : secArr(data, "days");
  // Legacy fallback
  const legacyItems = items.length ? items : (pkg.itinerary ?? []).map((it) => it as unknown as SD);
  if (!legacyItems.length) return null;
  return (
    <section id="itinerary" className="vy-sec" style={{ scrollMarginTop: 60 }} data-pmx-section="itinerary">
      <div className="vy-sec__eb">{t.dayByDay}</div>
      <div className="vy-itin-scroll">
        {legacyItems.map((it, i) => {
          const day = itemStr(it, "day") || String(i + 1);
          const chapter = itemStr(it, "chapter");
          const title = itemStr(it, "title");
          const desc = itemStr(it, "desc", "description");
          const img = itemStr(it, "img", "image");
          return (
            <article key={i} className="vy-ticket">
              {img && (
                <div className="vy-ticket__img">
                  <img src={img} alt={title} />
                  {chapter && <div className="vy-ticket__stamp">{chapter}</div>}
                </div>
              )}
              <div className="vy-ticket__body">
                <div className="vy-ticket__day">D{String(day).padStart(2, "0")}</div>
                {chapter && !img && <div className="vy-ticket__chap">{chapter}</div>}
                <div className="vy-ticket__title">{title}</div>
                {desc && <div className="vy-ticket__desc">{desc}</div>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function VyItineraryDesktop({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: "en" | "ar" }) {
  const t = T[lang];
  const data = findSec(pkg, "itinerary");
  const items = secArr(data, "items").length ? secArr(data, "items") : secArr(data, "days");
  const legacyItems = items.length ? items : (pkg.itinerary ?? []).map((it) => it as unknown as SD);
  if (!legacyItems.length) return null;
  const heading = secStr(data, "heading");
  return (
    <section id="itinerary" className="vy-d-sec" style={{ scrollMarginTop: 64 }} data-pmx-section="itinerary">
      <div className="vy-d-sec__head">
        <div>
          <div className="vy-d-sec__eb">{t.dayByDay}</div>
          <h2 className="vy-d-sec__title">{heading || t.vyTheSchedule}</h2>
        </div>
      </div>
      <div className="vy-d-tickets">
        {legacyItems.map((it, i) => {
          const day = itemStr(it, "day") || String(i + 1);
          const chapter = itemStr(it, "chapter");
          const title = itemStr(it, "title");
          const desc = itemStr(it, "desc", "description");
          const img = itemStr(it, "img", "image");
          return (
            <article key={i} className="vy-d-ticket">
              {img && (
                <div className="vy-d-ticket__img">
                  <img src={img} alt={title} />
                  {chapter && <div className="vy-d-ticket__stamp">{chapter}</div>}
                </div>
              )}
              <div className="vy-d-ticket__body">
                <div className="vy-d-ticket__day">D{String(day).padStart(2, "0")}</div>
                {chapter && !img && <div className="vy-d-ticket__chap">{chapter}</div>}
                <div className="vy-d-ticket__title">{title}</div>
                {desc && <div className="vy-d-ticket__desc">{desc}</div>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ─── Highlights ────────────────────────────────────────────────────────────────

function VyHighlightsSection({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: "en" | "ar" }) {
  const t = T[lang];
  const data = findSec(pkg, "highlights");
  const items = secArr(data, "items");
  if (items.length < 2) return null;
  return (
    <section className="vy-v2 vy-v2-hl" data-pmx-section="highlights">
      <div className="vy-v2__eb">{t.vyWhyThisTrip}</div>
      <div className="vy-v2-hl__grid">
        {items.slice(0, 3).map((item, i) => (
          <article key={i} className="vy-v2-hl__card">
            <div className="vy-v2-hl__n">{String(i + 1).padStart(2, "0")}</div>
            <h3 className="vy-v2-hl__t">{itemStr(item, "title")}</h3>
            {itemStr(item, "body", "desc") && (
              <p className="vy-v2-hl__s">{itemStr(item, "body", "desc")}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

// ─── Hotels ────────────────────────────────────────────────────────────────────

function VyHotelsSection({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: "en" | "ar" }) {
  const t = T[lang];
  const data = findSec(pkg, "hotel");
  const allHotelSecs = findAllSec(pkg, "hotel");
  // Build hotel list: from single section items array, or from multiple hotel sections
  let hotels: SD[] = secArr(data, "hotels").length
    ? secArr(data, "hotels")
    : secArr(data, "items");
  if (!hotels.length && allHotelSecs.length > 1) {
    hotels = allHotelSecs.map((s) => {
      const name = secStr(s, "name") || secStr(s, "heading");
      return { ...s, name };
    });
  }
  if (!hotels.length) return null;
  const heading = secStr(data, "heading");
  const stopsLabel = hotels.length !== 1 ? t.vyStopsPlural : t.vyStops;
  return (
    <section className="vy-v2 vy-v2-htl" data-pmx-section="hotel">
      <div className="vy-v2__head">
        <div className="vy-v2__eb">{t.vyWhereYouCrash} · {hotels.length} {stopsLabel}</div>
        <h2 className="vy-v2__title">
          {heading || (hotels.length === 1 ? t.vyYourBase : `${hotels.length} ${t.vyCities}, ${hotels.length} ${t.vyRooms}`)}
        </h2>
      </div>
      <div className="vy-v2-htl__grid" data-count={Math.min(hotels.length, 4)}>
        {hotels.slice(0, 4).map((h, i) => {
          const nights = secNum(h, "nights");
          const stars = secNum(h, "stars");
          const facilities = secStrArr(h, "facilities");
          const photo = itemStr(h, "photo", "image");
          const location = itemStr(h, "location", "city");
          return (
            <article key={i} className="vy-v2-htl__card">
              <div className="vy-v2-htl__img">
                {photo && <img src={photo} alt={itemStr(h, "name")} />}
                {location && <div className="vy-v2-htl__stamp">{location.toUpperCase()}</div>}
                {nights != null && <div className="vy-v2-htl__nights">{nights}N</div>}
              </div>
              <div className="vy-v2-htl__body">
                <div className="vy-v2-htl__top">
                  <h3 className="vy-v2-htl__name">{itemStr(h, "name")}</h3>
                  {stars != null && (
                    <div className="vy-v2-htl__stars">{"★".repeat(Math.round(Math.min(stars, 5)))}</div>
                  )}
                </div>
                {itemStr(h, "note", "description") && (
                  <p className="vy-v2-htl__note">{itemStr(h, "note", "description")}</p>
                )}
                {facilities.length > 0 && (
                  <ul className="vy-v2-htl__fac">
                    {facilities.slice(0, 5).map((f, j) => <li key={j}>{f}</li>)}
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

// ─── Media ─────────────────────────────────────────────────────────────────────

function vyToEmbed(url: string): string {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&?/]+)/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1`;
  const vi = url.match(/vimeo\.com\/(\d+)/);
  if (vi) return `https://player.vimeo.com/video/${vi[1]}?autoplay=1`;
  return url;
}

function VyMediaSection({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: "en" | "ar" }) {
  const t = T[lang];
  const data = findSec(pkg, "media");
  const videoUrl = secStr(data, "videoUrl") || secStr(data, "video");
  const videoPoster = secStr(data, "videoPoster") || secStr(data, "poster");
  const videoDuration = secStr(data, "videoDuration") || secStr(data, "duration");
  const mapSrc = secStr(data, "mapImage") || secStr(data, "map");
  const mapCaption = secStr(data, "mapCaption");
  const [playing, setPlaying] = useState(false);
  if (!videoUrl && !videoPoster && !mapSrc) return null;
  const hasVideo = !!(videoUrl || videoPoster);
  const hasMap = !!mapSrc;
  const isEmbed = videoUrl && (videoUrl.includes("youtube") || videoUrl.includes("youtu.be") || videoUrl.includes("vimeo"));
  return (
    <section className="vy-v2 vy-v2-med" data-pmx-section="media">
      <div className="vy-v2__head">
        <div className="vy-v2__eb">{t.vyFilmRoute}</div>
        <h2 className="vy-v2__title">{t.vyMoveAtSpeed}</h2>
      </div>
      <div className="vy-v2-med__row">
        {hasVideo && (
          <figure className="vy-v2-med__video" style={{ margin: 0 }}>
            {playing && videoUrl ? (
              isEmbed
                ? <iframe src={vyToEmbed(videoUrl)} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none" }} />
                : <video src={videoUrl} controls autoPlay playsInline style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", background: "#000" }} />
            ) : (
              <>
                {videoPoster
                  ? <img src={videoPoster} alt="trip film" />
                  : <div style={{ position: "absolute", inset: 0, background: "#111" }} />
                }
                {videoUrl && (
                  <button className="vy-v2-med__play" aria-label="Play video" onClick={() => setPlaying(true)}>
                    <PlayIcon />
                  </button>
                )}
                <figcaption>{t.vyPlay}{videoDuration ? ` · ${videoDuration}` : ""}</figcaption>
              </>
            )}
          </figure>
        )}
        {hasMap && (
          <figure className="vy-v2-med__map" style={{ margin: 0 }}>
            <img src={mapSrc} alt="route map" />
            <figcaption>
              <span className="vy-v2-med__stamp">{t.vyRoute}</span>
              {mapCaption && <span>{mapCaption}</span>}
            </figcaption>
          </figure>
        )}
      </div>
    </section>
  );
}

// ─── Meals + Visa chips ────────────────────────────────────────────────────────

function VyMealsVisaChips({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: "en" | "ar" }) {
  const t = T[lang];
  const incSec = findSec(pkg, "inclusions") as { meals?: string; visa?: { status: string; details?: string } } | undefined;
  const meals = incSec?.meals;
  const visa = incSec?.visa;
  if (!meals && !visa) return null;
  return (
    <div className="vy-v2-mv">
      {meals && (
        <div className="vy-v2-mv__chip">
          <span className="vy-v2-mv__stamp">{t.auMealPlan.toUpperCase()}</span>
          <div className="vy-v2-mv__name">{MEAL_LABELS[meals]?.[lang] ?? meals}</div>
        </div>
      )}
      {visa && (
        <div className="vy-v2-mv__chip">
          <span className="vy-v2-mv__stamp vy-v2-mv__stamp--alert">{t.auVisa.toUpperCase()}</span>
          <div className="vy-v2-mv__name">{VISA_LABELS[visa.status]?.[lang] ?? visa.status}</div>
          {visa.details && <p>{visa.details}</p>}
        </div>
      )}
    </div>
  );
}

// ─── Inclusions ────────────────────────────────────────────────────────────────

function VyInclusionsSection({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: "en" | "ar" }) {
  const t = T[lang];
  const data = findSec(pkg, "inclusions");
  const includes = secStrArr(data, "includes").length
    ? secStrArr(data, "includes")
    : (pkg.includes ?? pkg.advantages ?? []);
  const excludes = secStrArr(data, "excludes").length
    ? secStrArr(data, "excludes")
    : (pkg.excludes ?? []);
  if (!includes.length && !excludes.length) return null;
  const heading = secStr(data, "heading");
  return (
    <section id="included" className="vy-v2 vy-v2-inc" style={{ scrollMarginTop: 64 }} data-pmx-section="inclusions">
      <div className="vy-v2__head">
        <div className="vy-v2__eb">{t.vyWhatsIn}</div>
        <h2 className="vy-v2__title">{heading || t.vyInclusionsAndNot}</h2>
      </div>
      <VyMealsVisaChips pkg={pkg} lang={lang} />
      <div className="vy-v2-inc__cols">
        {includes.length > 0 && (
          <div>
            <h4 className="vy-v2-inc__h">{t.includedLabel}</h4>
            <ul className="vy-v2-inc__list vy-v2-inc__list--in">
              {includes.map((s, i) => (
                <li key={i}>
                  <span className="vy-v2-inc__check">✓</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {excludes.length > 0 && (
          <div>
            <h4 className="vy-v2-inc__h">{t.notIncluded}</h4>
            <ul className="vy-v2-inc__list vy-v2-inc__list--out">
              {excludes.map((s, i) => (
                <li key={i}>
                  <span className="vy-v2-inc__x">✕</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Extras ────────────────────────────────────────────────────────────────────

function VyExtrasSection({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: "en" | "ar" }) {
  const t = T[lang];
  const data = findSec(pkg, "extras");
  const items = secArr(data, "items").length ? secArr(data, "items") : secArr(data, "extras");
  if (!items.length) return null;
  const heading = secStr(data, "heading");
  return (
    <section className="vy-v2 vy-v2-ex" data-pmx-section="extras">
      <div className="vy-v2__head">
        <div className="vy-v2__eb">{t.vyAddOnsPayOnDay}</div>
        <h2 className="vy-v2__title">{heading || t.vyBoltOnsNoPressure}</h2>
      </div>
      <div className="vy-v2-ex__grid">
        {items.slice(0, 5).map((e, i) => (
          <article key={i} className="vy-v2-ex__card">
            {itemStr(e, "price") && <div className="vy-v2-ex__price">{itemStr(e, "price")}</div>}
            <h3 className="vy-v2-ex__name">{itemStr(e, "label", "title", "name")}</h3>
            {itemStr(e, "desc", "description") && (
              <p className="vy-v2-ex__desc">{itemStr(e, "desc", "description")}</p>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}

// ─── Transfers ─────────────────────────────────────────────────────────────────

function VyTransfersSection({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: "en" | "ar" }) {
  const t = T[lang];
  const data = findSec(pkg, "transfers");
  const items = secArr(data, "transfers").length ? secArr(data, "transfers") : secArr(data, "items");
  if (!items.length) return null;
  const heading = secStr(data, "heading");
  return (
    <section className="vy-v2 vy-v2-tx" data-pmx-section="transfers">
      <div className="vy-v2__head">
        <div className="vy-v2__eb">{t.vyGettingThere}</div>
        <h2 className="vy-v2__title">{heading || t.vyGettingBetween}</h2>
      </div>
      <ol className="vy-v2-tx__list">
        {items.map((item, i) => {
          const included = (item as SD & { included?: boolean }).included !== false;
          const leg = itemStr(item, "leg", "route", "title");
          const mode = itemStr(item, "mode", "type");
          const duration = itemStr(item, "duration");
          const note = itemStr(item, "note", "description");
          return (
            <li key={i} className="vy-v2-tx__row">
              <div className="vy-v2-tx__dot">{String(i + 1).padStart(2, "0")}</div>
              <div style={{ minWidth: 0 }}>
                <div className="vy-v2-tx__leg">{leg}</div>
                {(mode || duration) && (
                  <div className="vy-v2-tx__meta">
                    {[mode, duration].filter(Boolean).join(" · ")}
                  </div>
                )}
                {note && <div className="vy-v2-tx__note">{note}</div>}
              </div>
              <span className={`vy-v2-tx__pill${included ? "" : " vy-v2-tx__pill--out"}`}>
                {included ? t.vyIncPill : t.vyAddOnPill}
              </span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

// ─── Pricing ───────────────────────────────────────────────────────────────────

function VyPricingSection({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: "en" | "ar" }) {
  const t = T[lang];
  const data = findSec(pkg, "pricing");
  const instalments = secArr(data, "instalments").length
    ? secArr(data, "instalments")
    : secArr(data, "paymentPlan");
  const cancellation = secArr(data, "cancellation").length
    ? secArr(data, "cancellation")
    : secArr(data, "cancellationPolicy");
  const deposit = secStr(data, "deposit");
  const cancellationStr = secStr(data, "cancellation") || pkg.cancellation;
  if (!instalments.length && !cancellation.length && !deposit && !cancellationStr) return null;
  const heading = secStr(data, "heading");
  return (
    <section id="pricing" className="vy-v2 vy-v2-pr" style={{ scrollMarginTop: 64 }} data-pmx-section="pricing">
      <div className="vy-v2__head">
        <div className="vy-v2__eb">{t.vyMoneyStuff}</div>
        <h2 className="vy-v2__title">{heading || t.vyPayInThree}</h2>
      </div>
      <div className="vy-v2-pr__grid">
        {instalments.length > 0 && (
          <div>
            <div className="vy-v2-pr__h">{t.vyInstalments}</div>
            <ol className="vy-v2-pr__ladder">
              {instalments.map((inst, i) => (
                <li key={i}>
                  <span className="vy-v2-pr__amount">{itemStr(inst, "amount", "price")}</span>
                  <div>
                    <div className="vy-v2-pr__when">{itemStr(inst, "when", "label", "title")}</div>
                    {itemStr(inst, "desc", "description") && (
                      <div className="vy-v2-pr__desc">{itemStr(inst, "desc", "description")}</div>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        )}
        <div>
          <div className="vy-v2-pr__h">{t.cancellationLabel}</div>
          {cancellation.length > 0 ? (
            <ul className="vy-v2-pr__cancel">
              {cancellation.map((c, i) => (
                <li key={i}>
                  <div className="vy-v2-pr__window">{itemStr(c, "window", "label", "period")}</div>
                  <div className="vy-v2-pr__refund">{itemStr(c, "refund", "policy", "description")}</div>
                </li>
              ))}
            </ul>
          ) : cancellationStr ? (
            <p style={{ fontSize: 13, color: MUT, lineHeight: 1.6 }}>{cancellationStr}</p>
          ) : (
            <p style={{ fontSize: 13, color: SMUT, lineHeight: 1.6 }}>{t.vyContactForCancellation}</p>
          )}
        </div>
      </div>
    </section>
  );
}

// ─── Departures ────────────────────────────────────────────────────────────────

function VyDeparturesMobile({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: "en" | "ar" }) {
  const t = T[lang];
  const data = findSec(pkg, "departures");
  const deps = secArr(data, "departures").length ? secArr(data, "departures") : secArr(data, "items");
  const tiers = (pkg.pricingTiers ?? []).filter((tier) => tier.price);
  if (!deps.length && !tiers.length) return null;
  return (
    <section className="vy-sec" data-pmx-section="departures">
      <div className="vy-sec__eb">{t.vyDates}</div>
      {deps.length > 0 && (
        <div className="vy-deps">
          {deps.slice(0, 4).map((d, i) => {
            const date = itemStr(d, "date");
            const spots = secNum(d, "spots") ?? secNum(d, "spotsRemaining");
            const price = itemStr(d, "price");
            const sold = spots === 0;
            return (
              <div key={i} className={`vy-dep${i === 0 ? " vy-dep--sel" : ""}${sold ? " vy-dep--sold" : ""}`}>
                <div className="vy-dep__date">{date}</div>
                {spots != null && <div className="vy-dep__sub">{sold ? t.soldOut : `${spots} ${t.vyNLeft}`}</div>}
                {price && <div className="vy-dep__price">{price}</div>}
              </div>
            );
          })}
        </div>
      )}
      {tiers.length > 0 && (
        <div className="vy-tiers" style={{ marginTop: deps.length ? 16 : 0 }}>
          {tiers.map((tier, i) => (
            <div key={i} className={`vy-tier${i === 0 ? " vy-tier--pop" : ""}${(tier as TPricingTier & { soldOut?: boolean }).soldOut ? " vy-tier--sold" : ""}`}>
              <div className="vy-tier__top">
                <div className="vy-tier__name">{localizeTierLabel(tier.label, lang)}</div>
                <div className="vy-tier__price">{tier.price}</div>
              </div>
              <div className="vy-tier__sub">{t.perPerson}</div>
              {tier.perks?.length && (
                <ul className="vy-tier__perks">
                  {tier.perks.map((p, j) => (
                    <li key={j}><CheckIcon />{p}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function VyDeparturesDesktop({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: "en" | "ar" }) {
  const t = T[lang];
  const data = findSec(pkg, "departures");
  const deps = secArr(data, "departures").length ? secArr(data, "departures") : secArr(data, "items");
  const tiers = (pkg.pricingTiers ?? []).filter((tier) => tier.price);
  if (!deps.length && !tiers.length) return null;
  return (
    <section className="vy-d-sec" data-pmx-section="departures">
      <div className="vy-d-sec__head">
        <div>
          <div className="vy-d-sec__eb">{t.vyDates}</div>
          <h2 className="vy-d-sec__title">{t.vyWhenToGo}</h2>
        </div>
      </div>
      <div className="vy-d-book">
        {deps.length > 0 && (
          <div>
            <h3>{t.departures}</h3>
            <div className="vy-d-deps">
              {deps.slice(0, 6).map((d, i) => {
                const date = itemStr(d, "date");
                const spots = secNum(d, "spots") ?? secNum(d, "spotsRemaining");
                const price = itemStr(d, "price");
                const sold = spots === 0;
                return (
                  <div key={i} className={`vy-d-dep${i === 0 ? " vy-d-dep--sel" : ""}${sold ? " vy-dep--sold" : ""}`}>
                    <div className="vy-d-dep__date">{date}</div>
                    <div className="vy-d-dep__spots">{sold ? t.soldOut : spots != null ? `${spots} ${t.vySpots}` : ""}</div>
                    <div className="vy-d-dep__price">{price}</div>
                    <ArrowIcon />
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {tiers.length > 0 && (
          <div>
            <h3>{t.vyTiers}</h3>
            <div className="vy-d-tiers">
              {tiers.map((tier, i) => (
                <div key={i} className={`vy-tier${i === 0 ? " vy-tier--pop" : ""}${(tier as TPricingTier & { soldOut?: boolean }).soldOut ? " vy-tier--sold" : ""}`}>
                  <div className="vy-tier__top">
                    <div className="vy-tier__name">{localizeTierLabel(tier.label, lang)}</div>
                    <div className="vy-tier__price">{tier.price}</div>
                  </div>
                  <div className="vy-tier__sub">{t.perPerson}</div>
                  {tier.perks?.length && (
                    <ul className="vy-tier__perks">
                      {tier.perks.map((p, j) => (
                        <li key={j}><CheckIcon />{p}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

// ─── FAQ ────────────────────────────────────────────────────────────────────────

function VyFaqSection({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: "en" | "ar" }) {
  const t = T[lang];
  const data = findSec(pkg, "faq");
  const items = secArr(data, "items");
  if (!items.length) return null;
  const heading = secStr(data, "heading");
  return (
    <section className="vy-v2 vy-v2-faq" data-pmx-section="faq">
      <div className="vy-v2__head">
        <div className="vy-v2__eb">{t.vyFaqEyebrow}</div>
        <h2 className="vy-v2__title">{heading || t.vyWhatCrewAsk}</h2>
      </div>
      <dl className="vy-v2-faq__list">
        {items.map((f, i) => (
          <React.Fragment key={i}>
            <dt>
              <span className="vy-v2-faq__n">Q.{String(i + 1).padStart(2, "0")}</span>
              <span>{itemStr(f, "q", "question")}</span>
            </dt>
            <dd>{itemStr(f, "a", "answer")}</dd>
          </React.Fragment>
        ))}
      </dl>
    </section>
  );
}

// ─── Important notes ───────────────────────────────────────────────────────────

function VyImportantNotesSection({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: "en" | "ar" }) {
  const t = T[lang];
  const data = findSec(pkg, "important_notes");
  const notes = secArr(data, "notes").length ? secArr(data, "notes") : secArr(data, "items");
  if (!notes.length) return null;
  const heading = secStr(data, "heading");
  return (
    <section className="vy-v2 vy-v2-no" data-pmx-section="important_notes">
      <div className="vy-v2__head">
        <div className="vy-v2__eb">{t.vyReadThese}</div>
        <h2 className="vy-v2__title">{heading || t.vyPracticalStuff}</h2>
      </div>
      <div className="vy-v2-no__grid">
        {notes.map((n, i) => {
          const severity = itemStr(n, "severity");
          const isWarn = severity === "warn" || severity === "warning";
          return (
            <article key={i} className={`vy-v2-no__card${isWarn ? " vy-v2-no__card--warn" : ""}`}>
              <div className="vy-v2-no__tag">{isWarn ? `⚠ ${t.vyReadThisTag}` : t.vyFyiTag}</div>
              <h3 className="vy-v2-no__t">{itemStr(n, "title", "text")}</h3>
              {itemStr(n, "body", "description") && (
                <p className="vy-v2-no__b">{itemStr(n, "body", "description")}</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

// ─── Reviews ───────────────────────────────────────────────────────────────────

function VyReviewsSection({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: "en" | "ar" }) {
  const t = T[lang];
  const data = findSec(pkg, "reviews");
  const secReviews = secArr(data, "reviews").length ? secArr(data, "reviews") : secArr(data, "items");
  const heading = secStr(data, "heading");

  // Render section-authored reviews when available, otherwise fall back to
  // customer-submitted reviews stored in the flat pkg.reviews field.
  if (secReviews.length > 0) {
    return (
      <section className="vy-v2" data-pmx-section="reviews">
        <div className="vy-v2__head">
          <div className="vy-v2__eb">{t.vyWhatCrewSays}</div>
          <h2 className="vy-v2__title">{heading || t.vyRealFeedback}</h2>
        </div>
        <div className="vy-v2-revs__grid">
          {secReviews.map((r, i) => {
            const name = itemStr(r, "name", "reviewer");
            const text = itemStr(r, "text", "review", "content");
            const rating = secNum(r, "rating") ?? 5;
            const avatar = itemStr(r, "avatar", "photo");
            const location = itemStr(r, "location", "where");
            return (
              <article key={i} className="vy-rev">
                <div className="vy-rev__top">
                  {avatar
                    ? <img src={avatar} alt={name} style={{ width: 32, height: 32, borderRadius: "50%", objectFit: "cover" }} />
                    : <div className="vy-rev__avatar">{name[0]?.toUpperCase()}</div>
                  }
                  <div>
                    <div className="vy-rev__who">{name}</div>
                    {location && <div className="vy-rev__where">{location}</div>}
                  </div>
                  <div className="vy-rev__stars">{"★".repeat(Math.round(Math.min(rating, 5)))}</div>
                </div>
                <div className="vy-rev__text">{text}</div>
              </article>
            );
          })}
        </div>
      </section>
    );
  }

  // Fallback: customer-submitted reviews (pkg.reviews flat field)
  const flatReviews = pkg.reviews ?? [];
  if (!flatReviews.length) return null;
  return (
    <section className="vy-v2" data-pmx-section="reviews">
      <div className="vy-v2__head">
        <div className="vy-v2__eb">{t.vyWhatCrewSays}</div>
        <h2 className="vy-v2__title">{heading || t.vyRealFeedback}</h2>
      </div>
      <div className="vy-v2-revs__grid">
        {flatReviews.map((r, i) => (
          <article key={i} className="vy-rev">
            <div className="vy-rev__top">
              <div className="vy-rev__avatar">{r.name[0]?.toUpperCase()}</div>
              <div>
                <div className="vy-rev__who">{r.name}</div>
                {r.country && <div className="vy-rev__where">{r.country}</div>}
              </div>
              <div className="vy-rev__stars">{"★".repeat(Math.round(Math.min(r.rating, 5)))}</div>
            </div>
            <div className="vy-rev__text">{r.text}</div>
          </article>
        ))}
      </div>
    </section>
  );
}

// ─── People ────────────────────────────────────────────────────────────────────

function VyPeopleSection({ pkg, lang, onWhatsApp }: { pkg: TPageProps["pkg"]; lang: "en" | "ar"; onWhatsApp?: () => void }) {
  const t = T[lang];
  const data = findSec(pkg, "people");
  const people = secArr(data, "people").length ? secArr(data, "people") : (pkg.people ?? []).map((p) => p as unknown as SD);
  // Also support legacy pkg.agent
  const agentFromPeople = people.find((p) => itemStr(p, "role") === "agent");
  const legacyAgent = pkg.agent as { name?: string; avatar?: string; role?: string; bio?: string; years?: number; repliesIn?: string } | undefined;
  const agent = agentFromPeople ?? (legacyAgent ? { name: legacyAgent.name, photo: legacyAgent.avatar, role: "agent", bio: legacyAgent.bio ?? "", yearsExperience: legacyAgent.years, replyTime: legacyAgent.repliesIn } as SD : undefined);
  const guides = people.filter((p) => itemStr(p, "role") === "guide");
  if (!agent && !guides.length) return null;
  return (
    <section className="vy-v2 vy-v2-pp" style={{ padding: 0 }} data-pmx-section="people">
      {agent && (
        <div className="vy-v2-pp__lead">
          {itemStr(agent, "photo", "avatar") && (
            <img className="vy-v2-pp__img" src={itemStr(agent, "photo", "avatar")} alt={itemStr(agent, "name")} />
          )}
          <div>
            <div className="vy-v2-pp__role">{itemStr(agent, "title", "role")}</div>
            <h3 className="vy-v2-pp__name">{itemStr(agent, "name")}</h3>
            {itemStr(agent, "bio") && <p className="vy-v2-pp__bio">{itemStr(agent, "bio")}</p>}
            <div className="vy-v2-pp__row">
              {secStrArr(agent, "languages").length > 0 && (
                <span className="vy-v2-pp__pill">{secStrArr(agent, "languages").join(" · ")}</span>
              )}
              {secNum(agent, "yearsExperience") != null && (
                <span className="vy-v2-pp__pill">{secNum(agent, "yearsExperience")} {t.vyYrsExp}</span>
              )}
              {itemStr(agent, "replyTime") && (
                <span className="vy-v2-pp__pill vy-v2-pp__pill--live">
                  <span className="vy-v2-pp__pulse" />
                  {t.vyRepliesPrefix} {itemStr(agent, "replyTime")}
                </span>
              )}
            </div>
            {pkg.whatsapp && <button className="vy-v2-pp__cta" onClick={onWhatsApp}>
              <WaIcon size={14} />
              {t.bookWhatsApp}
            </button>}
          </div>
        </div>
      )}
      {guides.length > 0 && (
        <div style={{ padding: "24px 36px 36px", background: PINK }}>
          <div className="vy-v2-pp__guides">
            <div className="vy-v2-pp__eb">{t.auGuidesOnGround}</div>
            <div className="vy-v2-pp__guide-row">
              {guides.map((g, i) => (
                <div key={i} className="vy-v2-pp__guide">
                  {itemStr(g, "photo", "avatar") && (
                    <img src={itemStr(g, "photo", "avatar")} alt={itemStr(g, "name")} />
                  )}
                  <div>
                    <b style={{ fontSize: 13, color: "#fff" }}>{itemStr(g, "name")}</b>
                    {itemStr(g, "title", "bio") && (
                      <div className="vy-v2-pp__guide-meta">{itemStr(g, "title", "bio")}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── About agency ──────────────────────────────────────────────────────────────

function VyAboutAgencySection({ pkg, agency, lang }: { pkg: TPageProps["pkg"]; agency: TPageProps["agency"]; lang: "en" | "ar" }) {
  const t = T[lang];
  const data = findSec(pkg, "about_agency");
  const story = secStr(data, "story") || secStr(data, "content");
  const foundedRaw = (data as SD | undefined)?.founded;
  const founded = typeof foundedRaw === "number" ? foundedRaw : undefined;
  const teamSize = secStr(data, "teamSize") || secStr(data, "team");
  const teamPhoto = secStr(data, "teamPhoto") || secStr(data, "image") || secStr(data, "photo");
  if (!story && !founded && !teamPhoto && !agency.tagline) return null;
  const currentYear = new Date().getFullYear();
  const heading = secStr(data, "heading");
  return (
    <section className="vy-v2" data-pmx-section="about_agency">
      <div className="vy-v2__head">
        <div className="vy-v2__eb">{agency.name} · {t.vyTheOutfit}</div>
        <h2 className="vy-v2__title">{heading || t.vyRealTripsNotTours}</h2>
      </div>
      <div className="vy-v2-ag">
        <div>
          {story && <p className="vy-v2-ag__story">{story}</p>}
          {founded && (
            <div className="vy-v2-ag__last">
              <span className="vy-v2-pp__pulse" />
              {t.vySince} {founded}
            </div>
          )}
        </div>
        <div>
          {(founded || teamSize) && (
            <div className="vy-v2-ag__stats">
              {founded && (
                <div className="vy-v2-ag__stat">
                  <div className="v">{currentYear - founded}+</div>
                  <div className="l">{t.auYearsLabel}</div>
                </div>
              )}
              {teamSize && (
                <div className="vy-v2-ag__stat">
                  <div className="v">{teamSize}</div>
                  <div className="l">{t.vyCrew}</div>
                </div>
              )}
            </div>
          )}
          {teamPhoto && <img className="vy-v2-ag__photo" src={teamPhoto} alt={`${agency.name} team`} />}
        </div>
      </div>
    </section>
  );
}

// ─── Other Packages ───────────────────────────────────────────────────────────

function VyOtherPackagesSection({ pkg, lang, agencySlug }: { pkg: TPageProps["pkg"]; lang: "en" | "ar"; agencySlug?: string }) {
  const t = T[lang];
  const data = findSec(pkg, "other_packages");
  const cards = secArr(data, "packages");
  if (!cards.length) return null;
  const heading = secStr(data, "heading") || t.otherPackagesHeading;
  const isRtl = lang === "ar";
  return (
    <section style={{ padding: "40px 20px 0", background: BG }} dir={isRtl ? "rtl" : "ltr"} data-pmx-section="other_packages">
      <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase" as const, color: MUT, marginBottom: 14 }}>{heading}</div>
      <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8, scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}>
        {cards.map((card, i) => {
          const img = secStr(card, "image");
          const title = itemStr(card, "title");
          const dest = secStr(card, "destination");
          const price = secStr(card, "price");
          const nights = secStr(card, "nights");
          const link = secStr(card, "link");
          return (
            <a key={i} href={link || undefined} style={{
              flex: "0 0 190px", minWidth: 190, borderRadius: 10, overflow: "hidden",
              textDecoration: "none", border: `1px solid ${LINE}`,
              background: "rgba(255,255,255,0.06)", scrollSnapAlign: "start",
              display: "flex", flexDirection: "column",
            }}>
              <div style={{ width: "100%", height: 120, background: LINE, flexShrink: 0, position: "relative" }}>
                {img && <img src={img} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />}
              </div>
              <div style={{ padding: "10px 12px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 3 }}>
                {dest && <div style={{ fontFamily: MONO, fontSize: 9.5, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase" as const, color: ACID }}>{dest}</div>}
                <div style={{ fontFamily: ARCH, fontSize: 13, fontWeight: 700, color: FG, lineHeight: 1.3 }}>{title}</div>
                {(nights || price) && (
                  <div style={{ marginTop: "auto", paddingTop: 6, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    {nights && <span style={{ fontFamily: MONO, fontSize: 10.5, color: MUT }}>{nights}</span>}
                    {price && <span style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: ACID }}>{price}</span>}
                  </div>
                )}
              </div>
            </a>
          );
        })}
      </div>
      {agencySlug && (
        <div style={{ marginTop: 14, textAlign: isRtl ? "left" : "right" }}>
          <a href={`/${agencySlug}`} style={{ fontFamily: MONO, fontSize: 11.5, fontWeight: 700, color: ACID, textDecoration: "none", letterSpacing: "0.5px" }}>
            {t.navAllPackages} →
          </a>
        </div>
      )}
    </section>
  );
}

// ─── Custom blocks ─────────────────────────────────────────────────────────────

function VyCustomSection({ pkg, lang }: { pkg: TPageProps["pkg"]; lang: "en" | "ar" }) {
  const t = T[lang];
  const data = findSec(pkg, "custom");
  const allCustom = findAllSec(pkg, "custom");
  const blocks: SD[] = secArr(data, "blocks").length
    ? secArr(data, "blocks")
    : secArr(data, "items").length
    ? secArr(data, "items")
    : allCustom;
  if (!blocks.length) return null;
  return (
    <section className="vy-v2 vy-v2-cu" data-pmx-section="custom">
      {blocks.map((c, i) => (
        <article key={i} className="vy-v2-cu__block">
          <div className="vy-v2-cu__stamp">{t.vyEditorialsCut}</div>
          {itemStr(c, "image", "photo") && (
            <img className="vy-v2-cu__img" src={itemStr(c, "image", "photo")} alt="" />
          )}
          <h3 className="vy-v2-cu__h">{itemStr(c, "heading", "title")}</h3>
          <p className="vy-v2-cu__p">{itemStr(c, "body", "content", "text")}</p>
        </article>
      ))}
    </section>
  );
}

// ─── Final CTA ─────────────────────────────────────────────────────────────────

function VyFinalCta({ pkg, agency, lang, onWhatsApp, onMessenger }: {
  pkg: TPageProps["pkg"];
  agency: TPageProps["agency"];
  lang: "en" | "ar";
  onWhatsApp?: () => void;
  onMessenger?: () => void;
}) {
  const t = T[lang];
  const scarcity = pkg.scarcity;
  const hasMessenger = !!(pkg.messenger || pkg.contacts?.some((c) => c.type === "messenger"));
  const firstAgentName = (pkg.people ?? []).find((p) => p.role === "agent")?.name?.split(" ")[0]
    ?? (pkg.agent as { name?: string } | undefined)?.name?.split(" ")[0]
    ?? agency.name;
  return (
    <section className="vy-v2-cta">
      <div className="vy-v2-cta__eb">
        {scarcity?.spotsRemaining != null
          ? `${scarcity.spotsRemaining} ${t.vySpotsLeftBookNow}`
          : `${agency.name} · ${t.vyAgencyBookNow}`}
      </div>
      <h2 className="vy-v2-cta__h">{t.vyGetIn}</h2>
      <p className="vy-v2-cta__p">
        {firstAgentName} {lang === "ar" ? t.vyIsOnlinePrefixAr : t.vyIsOnlinePrefix}
      </p>
      <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
        {pkg.whatsapp && <button className="vy-v2-cta__btn" onClick={onWhatsApp}>
          <WaIcon size={15} /> {t.bookWhatsApp}
        </button>}
        {hasMessenger && onMessenger && (
          <button className="vy-v2-cta__btn" style={{ background: "transparent", border: `2px solid ${ACID}`, color: ACID }} onClick={onMessenger}>
            {t.vyMessenger}
          </button>
        )}
      </div>
    </section>
  );
}

// ─── Mobile footer ─────────────────────────────────────────────────────────────

function VyMobileFooter({ agency }: { agency: TPageProps["agency"] }) {
  return (
    <footer className="vy-m-foot">
      <div className="vy-m-foot__name">{agency.name}</div>
      {agency.tagline && <div>{agency.tagline}</div>}
      <div style={{ marginTop: 8 }}>{T["en"].poweredBy}</div>
    </footer>
  );
}

// ─── TemplateVoyagePage ────────────────────────────────────────────────────────

export function TemplateVoyagePage({ pkg, agency, onWhatsApp, onMessenger, lang }: TPageProps) {
  const t = T[lang];
  const nights   = pkg.nights ? Number(pkg.nights) : null;
  const cover    = pkg.coverImage || "";
  const isRtl    = lang === "ar";
  const isDesktop = useIsDesktop();

  // Nav links
  const depSec   = findSec(pkg, "departures");
  const hasDeps   = secArr(depSec, "departures").length > 0 || secArr(depSec, "items").length > 0;
  const hasItin   = !!(findSec(pkg, "itinerary") || pkg.itinerary?.length);
  const hasInc    = !!(findSec(pkg, "inclusions") || pkg.includes?.length);
  const navLinks  = [
    ...(hasItin ? [{ label: t.navItinerary, href: "#itinerary" }] : []),
    ...(hasInc  ? [{ label: t.navIncluded,  href: "#included"  }] : []),
    ...(hasDeps ? [{ label: t.vyDates,      href: "#pricing"   }] : []),
  ];

  if (isDesktop) {
    return (
      <div className="vy" style={{ direction: isRtl ? "rtl" : "ltr" }}>
        <DesktopNav agency={agency} price={pkg.price} brand={ACID} navLinks={navLinks} lang={lang} dark onWhatsApp={pkg.whatsapp ? onWhatsApp : undefined} />

        {/* Ticker */}
        <VyTicker pkg={pkg} lang={lang} />

        {/* Desktop hero: big number + destination left, image + buy card right */}
        <div className="vy-d-hero" data-pmx-section="hero">
          <div className="vy-d-hero__left">
            <div className="vy-d-hero__top">
              <span>{agency.name}</span>
              {pkg.rating != null && (
                <span className="vy-d-hero__rating">{"★".repeat(Math.round(pkg.rating))} {pkg.rating}</span>
              )}
            </div>
            {nights && (
              <div className="vy-d-hero__num">
                {nights}<span className="unit">{t.nightsLabel}</span>
              </div>
            )}
            <div className="vy-d-hero__dest" data-pmx-field="title">{pkg.destination?.split(",")[0]}</div>
            {pkg.description && <p className="vy-d-hero__desc">{pkg.description}</p>}
          </div>
          <div className="vy-d-hero__right">
            <div className="vy-d-hero__img">
              {cover
                ? <img src={cover} alt={pkg.destination} />
                : <div style={{ position: "absolute", inset: 0, background: `linear-gradient(135deg, ${ACID}22, ${BG})` }} />
              }
              {pkg.destination && (
                <div className="vy-d-hero__img-cap" data-pmx-field="destination">{pkg.destination.split(",")[0].toUpperCase()}</div>
              )}
            </div>
            <div className="vy-d-hero__buy">
              <div className="vy-d-hero__buy-row">
                <div className="vy-d-hero__buy-lab">{t.vyAllInFrom}</div>
                {pkg.scarcity?.spotsRemaining != null && (
                  <div className="vy-d-hero__buy-spots">
                    <span className="dot" />
                    {pkg.scarcity.spotsRemaining} {t.vySpots}
                  </div>
                )}
              </div>
              <div className="vy-d-hero__buy-price" data-pmx-field="price">{pkg.price}</div>
              {pkg.whatsapp && <div className="vy-d-hero__buy-cta">
                <button className="vy-cta-d" onClick={onWhatsApp}>
                  <WaIcon size={15} /> {t.bookWhatsApp}
                </button>
              </div>}
            </div>
          </div>
        </div>

        {/* Stats strip */}
        {(nights || pkg.totalSpots || pkg.rating != null) && (
          <div className="vy-d-stats">
            {nights && (
              <div className="vy-d-stats__cell">
                <div className="v">{nights}<em>{t.nightsLabel}</em></div>
                <div className="l">{t.vyTripLength}</div>
              </div>
            )}
            {pkg.totalSpots && (
              <div className="vy-d-stats__cell">
                <div className="v">{pkg.totalSpots}</div>
                <div className="l">{t.vyMaxCrew}</div>
              </div>
            )}
            {pkg.rating != null && (
              <div className="vy-d-stats__cell">
                <div className="v"><em>{pkg.rating}</em></div>
                <div className="l">{pkg.reviewCount ? `${pkg.reviewCount} ${t.vyReviews}` : t.vyRating}</div>
              </div>
            )}
            {pkg.scarcity?.spotsRemaining != null && (
              <div className="vy-d-stats__cell">
                <div className="v"><em>{pkg.scarcity.spotsRemaining}</em></div>
                <div className="l">{t.vySpotsLeft}</div>
              </div>
            )}
          </div>
        )}

        {/* Sections in order */}
        <VyHighlightsSection pkg={pkg} lang={lang} />
        <VyItineraryDesktop pkg={pkg} lang={lang} />
        <VyHotelsSection pkg={pkg} lang={lang} />
        <VyGalleryDesktop pkg={pkg} lang={lang} />
        <VyMediaSection pkg={pkg} lang={lang} />
        <VyInclusionsSection pkg={pkg} lang={lang} />
        <VyExtrasSection pkg={pkg} lang={lang} />
        <VyTransfersSection pkg={pkg} lang={lang} />
        <VyPricingSection pkg={pkg} lang={lang} />
        <VyDeparturesDesktop pkg={pkg} lang={lang} />
        <VyFaqSection pkg={pkg} lang={lang} />
        <VyImportantNotesSection pkg={pkg} lang={lang} />
        <VyReviewsSection pkg={pkg} lang={lang} />
        <VyPeopleSection pkg={pkg} lang={lang} onWhatsApp={pkg.whatsapp ? onWhatsApp : undefined} />
        <VyAboutAgencySection pkg={pkg} agency={agency} lang={lang} />
        <VyOtherPackagesSection pkg={pkg} lang={lang} agencySlug={agency.agencySlug} />
        <VyCustomSection pkg={pkg} lang={lang} />
        <VyFinalCta pkg={pkg} agency={agency} lang={lang} onWhatsApp={pkg.whatsapp ? onWhatsApp : undefined} onMessenger={onMessenger} />
        <DesktopFooter agency={agency} brand={ACID} dark />
      </div>
    );
  }

  // ── Mobile ──────────────────────────────────────────────────────────────────
  return (
    <div className="vy vy--mobile" style={{ direction: isRtl ? "rtl" : "ltr" }}>
      <AgencyBar agency={agency} price={pkg.price} brand={ACID} onWhatsApp={pkg.whatsapp ? onWhatsApp : undefined} lang={lang} navLinks={navLinks} dark />
      <VyTicker pkg={pkg} lang={lang} />

      {/* Mobile hero */}
      <div style={{ position: "relative", overflow: "hidden" }} data-pmx-section="hero">
        {/* Big poster number */}
        <div style={{ padding: "22px 16px 0" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontFamily: MONO, fontSize: 10, color: MUT, letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 12 }}>
            <span data-pmx-field="destination">{pkg.destination}</span>
            {pkg.scarcity?.spotsRemaining != null && (
              <span style={{ color: ACID, fontWeight: 700 }}>{pkg.scarcity.spotsRemaining} {t.vySpots}</span>
            )}
          </div>
          {nights && (
            <div style={{ fontFamily: ARCH, fontSize: 120, lineHeight: 0.85, letterSpacing: "-5px", color: FG }}>{nights}</div>
          )}
          {nights && (
            <div style={{ fontFamily: MONO, fontSize: 11, color: MUT, letterSpacing: "0.8px", textTransform: "uppercase", marginTop: 6 }}>{t.nightsLabel}</div>
          )}
          <div style={{ fontFamily: ARCH, fontSize: 44, lineHeight: 0.92, letterSpacing: "-2px", textTransform: "uppercase", marginTop: 14, color: FG }} data-pmx-field="title">
            {pkg.destination?.split(",")[0]}
          </div>
        </div>

        {/* Cover image */}
        {cover && (
          <div style={{ margin: "20px -0px 0", height: 220, overflow: "hidden", position: "relative" }}>
            <img src={cover} alt={pkg.destination} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
            <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 50%, rgba(10,11,12,0.85))" }} />
          </div>
        )}
      </div>

      {/* Poster price card */}
      <div style={{ margin: "16px 16px", background: ACID, color: BG, padding: "20px 20px", borderRadius: 6 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 4 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: "0.6px", textTransform: "uppercase", fontWeight: 700 }}>{t.vyAllInFrom}</div>
          {pkg.scarcity?.spotsRemaining != null && (
            <div style={{ fontFamily: MONO, fontSize: 10, background: BG, color: ACID, padding: "3px 7px", borderRadius: 3, display: "inline-flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: PINK, display: "inline-block" }} />
              {pkg.scarcity.spotsRemaining} {t.vyNLeft}
            </div>
          )}
        </div>
        <div style={{ fontFamily: ARCH, fontSize: 64, lineHeight: 0.9, letterSpacing: "-3px", marginBottom: 8 }} data-pmx-field="price">{pkg.price}</div>
        <div style={{ fontFamily: MONO, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.6px", marginBottom: 20 }}>
          {nights ? `${nights} ${t.nightsLabel} · ` : ""}{t.perPerson}
        </div>
        {pkg.whatsapp && <button className="vy-cta" onClick={onWhatsApp}>
          <WaIcon size={14} /> {t.bookWhatsApp}
        </button>}
      </div>

      {/* Description */}
      {pkg.description && (
        <div style={{ padding: "0 16px 4px" }}>
          <p style={{ fontSize: 14, color: MUT, lineHeight: 1.65, margin: 0 }}>{pkg.description}</p>
        </div>
      )}

      {/* Sections in order */}
      <VyHighlightsSection pkg={pkg} lang={lang} />
      <VyItineraryMobile pkg={pkg} lang={lang} />
      <VyHotelsSection pkg={pkg} lang={lang} />
      <VyGalleryMobile pkg={pkg} lang={lang} />
      <VyMediaSection pkg={pkg} lang={lang} />
      <VyInclusionsSection pkg={pkg} lang={lang} />
      <VyExtrasSection pkg={pkg} lang={lang} />
      <VyTransfersSection pkg={pkg} lang={lang} />
      <VyPricingSection pkg={pkg} lang={lang} />
      <VyDeparturesMobile pkg={pkg} lang={lang} />
      <VyFaqSection pkg={pkg} lang={lang} />
      <VyImportantNotesSection pkg={pkg} lang={lang} />
      <VyReviewsSection pkg={pkg} lang={lang} />
      <VyPeopleSection pkg={pkg} lang={lang} onWhatsApp={pkg.whatsapp ? onWhatsApp : undefined} />
      <VyAboutAgencySection pkg={pkg} agency={agency} lang={lang} />
      <VyOtherPackagesSection pkg={pkg} lang={lang} agencySlug={agency.agencySlug} />
      <VyCustomSection pkg={pkg} lang={lang} />
      <VyFinalCta pkg={pkg} agency={agency} lang={lang} onWhatsApp={pkg.whatsapp ? onWhatsApp : undefined} onMessenger={onMessenger} />
      <VyMobileFooter agency={agency} />

      {/* Sticky bar */}
      <div className="vy-sticky">
        <div>
          <div className="vy-sticky__price">{pkg.price}</div>
          <div className="vy-sticky__sub">
            {nights ? <><b>{nights}{t.nightsLabel}</b> · </> : null}
            {t.perPerson}
          </div>
        </div>
        {pkg.whatsapp && <button className="vy-sticky__btn" onClick={onWhatsApp}>
          <WaIcon size={13} /> {t.vyBookNow}
        </button>}
      </div>
    </div>
  );
}

// ─── TemplateVoyageCard ────────────────────────────────────────────────────────

export function TemplateVoyageCard({ pkg, agency, lang, onView, onEdit, onDelete, onToggleActive, onDuplicate }: TCardProps) {
  return (
    <BaseCard
      pkg={pkg} agency={agency} lang={lang}
      onView={onView} onEdit={onEdit} onDelete={onDelete}
      onToggleActive={onToggleActive} onDuplicate={onDuplicate}
    />
  );
}
