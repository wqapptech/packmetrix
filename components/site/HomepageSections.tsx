"use client";

// Modular homepage section renderers — match /design-ref/Homepage.dc.html.
// Each section reads the bilingual content from the section model + derived
// agency/brand/package data via Ctx. Brand greens come from deriveBrand() vars;
// warm neutrals are fixed. Honest states throughout: no invented
// text/stats/reviews/badges; stats falls back to qualities when no numbers.

import type { AgencyBrand } from "@/lib/brand";
import { waHref, emailHref } from "@/lib/brand";
import {
  pick, reviewKind, type HomeSection, type Testimonial,
  type HeroContent, type AboutContent, type WhyUsContent, type ServicesContent,
  type FeaturedPackagesContent, type DestinationsContent, type TestimonialsContent,
  type ContactContent, type StatsContent, type SeasonalOffersContent, type AccreditationContent,
  type TeamContent,
} from "@/lib/homepage";
import PackageCard, { arNum, type CardPackage } from "./PackageCard";
import { WaIcon } from "./icons";

export type Ctx = {
  lang: "en" | "ar";
  ar: boolean;
  m: boolean;
  /** true only in the dashboard preview — shows labeled placeholders. Live = false. */
  editor: boolean;
  brand: AgencyBrand;
  agency: Record<string, unknown>;
  packages: (CardPackage & { destination: string })[];
  basePath: string;
  packagesHref: string;
  /** The About page URL ({basePath}/about) — the "Read our story" link target. */
  aboutHref: string;
  /** The Reviews page URL ({basePath}/reviews) — the testimonials "View all" target. */
  reviewsHref: string;
  waLink: string | null;
  openPkg: (id: string) => void;
  scrollContact: () => void;
};

const UI = {
  en: {
    arrow: "→", explore: "Explore", view: "View", from: "From", pp: "/ person", nights: "nights",
    heroCta1: "Plan your trip on WhatsApp", heroCta2: "View packages",
    statYears: "Years guiding travelers", statTravellers: "Trips delivered", statRating: "Average guest rating",
    waCta: "Message on WhatsApp", emailCta: "Send an email",
    tstIllus: "Illustrative — your reviews appear here",
    tstQuote: "A traveler's words will appear here once a guest shares their experience.",
    tstName: "Guest name", tstTrip: "Trip · 2026", tstVideo: "Video review · add yours", tstViewAll: "View all reviews",
    statFallbackNote: "We show qualities, not numbers, until the numbers are real.",
    learnMore: "Learn more",
  },
  ar: {
    arrow: "←", explore: "استكشف", view: "عرض", from: "من", pp: "/ شخص", nights: "ليالٍ",
    heroCta1: "خطّط رحلتك على واتساب", heroCta2: "تصفّح الباقات",
    statYears: "سنوات في إرشاد المسافرين", statTravellers: "رحلة منفّذة", statRating: "متوسط تقييم الضيوف",
    waCta: "راسلنا على واتساب", emailCta: "أرسل بريداً",
    tstIllus: "نموذجي — تظهر مراجعاتك هنا",
    tstQuote: "هنا تظهر كلمات المسافر بعد أن يشاركك الضيف تجربته.",
    tstName: "اسم الضيف", tstTrip: "رحلة · 2026", tstVideo: "مراجعة فيديو · أضف هنا", tstViewAll: "عرض كل المراجعات",
    statFallbackNote: "نعرض الصفات لا الأرقام، حتى تصبح الأرقام حقيقية.",
    learnMore: "اعرف المزيد",
  },
} as const;

const PLACEHOLDER_GRAD = "linear-gradient(135deg, var(--accent), var(--brand-deep))";

function vpad(m: boolean) { return m ? 64 : 104; }

// Editor-only placeholder for an enabled-but-empty authored section. Live
// (editor=false) hides these sections entirely; in the builder preview they
// stay visible+labeled so the agency can locate and fill them. Never shown to
// real visitors.
function EditorEmpty({ label, ctx }: { label: string; ctx: Ctx }) {
  const { m, ar } = ctx;
  return (
    <section style={{ padding: `${vpad(m)}px 0` }}>
      <div className="hp-wrap">
        <div style={{
          border: "1.5px dashed var(--rule)", borderRadius: 16,
          background: "rgba(47,93,80,0.035)", padding: m ? "32px 22px" : "44px 40px",
          display: "flex", flexDirection: "column", alignItems: "center", gap: 8, textAlign: "center",
        }}>
          <span className="hp-tag">{ar ? "تظهر في المعاينة فقط" : "Preview only"}</span>
          <div className="hp-serif" style={{ fontSize: m ? 22 : 26, fontWeight: 600, color: "#2a2620" }}>{label}</div>
          <p style={{ fontSize: 13.5, lineHeight: 1.55, color: "var(--ink3)", maxWidth: "44ch", margin: 0 }}>
            {ar
              ? "هذا القسم مُفعّل لكنه فارغ. أضف المحتوى في المنشئ ليظهر لزوارك."
              : "This section is on but empty. Add content in the builder to show it to your visitors."}
          </p>
        </div>
      </div>
    </section>
  );
}
function h2size(m: boolean) { return m ? 30 : 46; }

// ── tiny icon set for why_us / services (keyed by content.icon) ─────────────
function FeatureIcon({ name }: { name?: string }) {
  const common = { width: 23, height: 23, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "chat": return <svg {...common}><path d="M4 5h16v10H9l-4 4z" /></svg>;
    case "moon": return <svg {...common}><path d="M16.5 4a8 8 0 1 0 3.5 11 6 6 0 0 1-3.5-11z" /></svg>;
    case "shield": return <svg {...common}><path d="M12 3l7 3v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6z" /><path d="M9.2 12l1.9 1.9 3.7-3.8" /></svg>;
    case "clock": return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>;
    case "car": return <svg {...common}><path d="M3 13l1.6-4.6A2 2 0 0 1 6.5 7h11a2 2 0 0 1 1.9 1.4L21 13v4h-2v-1.5H5V17H3z" /><circle cx="7" cy="15.5" r="1.4" /><circle cx="17" cy="15.5" r="1.4" /></svg>;
    case "pin": return <svg {...common}><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" /><circle cx="12" cy="10" r="2.6" /></svg>;
    case "plane": return <svg {...common}><path d="M21 15.5v-1.7l-7.5-4.6V4.2a1.5 1.5 0 0 0-3 0v5L3 13.8v1.7l7.5-2.2v3.4l-1.8 1.4v1.3l3.3-.9 3.3.9v-1.3l-1.8-1.4v-3.4z" /></svg>;
    case "hotel": return <svg {...common}><path d="M3 19v-7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v7M3 15h18M7 10V8a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 13 8v2" /></svg>;
    case "star": return <svg {...common}><path d="M12 3l2.6 5.6 6 .8-4.4 4.2 1.1 6L12 16.9 6.7 19.6l1.1-6L3.4 9.4l6-.8z" /></svg>;
    case "users": return <svg {...common}><circle cx="9" cy="8" r="3" /><circle cx="17" cy="9" r="2.3" /><path d="M3.5 20a5.5 5.5 0 0 1 11 0M15 20a5 5 0 0 1 5.8-1.4" /></svg>;
    case "heart": return <svg {...common}><path d="M12 20s-7-4.6-7-9.6A3.5 3.5 0 0 1 12 8a3.5 3.5 0 0 1 7 2.4C19 15.4 12 20 12 20z" /></svg>;
    default: return <svg {...common}><path d="M9.2 12l1.9 1.9 3.7-3.8" /><circle cx="12" cy="12" r="9" /></svg>;
  }
}

function CheckIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand-text)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flex: "0 0 auto" }}>
      <circle cx="12" cy="12" r="9" /><path d="M8.5 12.2l2.3 2.3 4.7-4.9" />
    </svg>
  );
}

function SectionHead({ eyebrow, heading, ctx, onDark }: { eyebrow?: string; heading?: string; ctx: Ctx; onDark?: boolean }) {
  return (
    <>
      {eyebrow ? <span className={`hp-eyebrow${onDark ? " on-dark" : ""}`}>{eyebrow}</span> : null}
      {heading ? (
        <h2 className="hp-serif hp-h2" style={{ fontSize: h2size(ctx.m), color: onDark ? "#fff" : undefined, maxWidth: "20ch" }}>
          {heading}
        </h2>
      ) : null}
    </>
  );
}

// ── Sections ────────────────────────────────────────────────────────────────

function Hero(c: HeroContent, ctx: Ctx) {
  const { lang, m, brand } = ctx;
  const eyebrow = pick(c.eyebrow, lang) || brand.name;
  const headline = pick(c.headline, lang) || brand.name;
  const sub = pick(c.sub, lang) || brand.tagline || "";
  const U = UI[lang];
  return (
    <section style={{ position: "relative", height: m ? 560 : 660, background: PLACEHOLDER_GRAD }}>
      {c.image ? (
        <img src={c.image} alt="" onError={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = "0")}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
      ) : null}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(18,26,22,0.5) 0%,rgba(18,26,22,0.12) 32%,rgba(18,26,22,0.28) 60%,rgba(18,26,22,0.82) 100%)" }} />
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end" }}>
        <div style={{ maxWidth: 1280, width: "100%", margin: "0 auto", padding: `0 ${m ? 22 : 56}px ${vpad(m) * 0.62}px` }}>
          <span className="hp-eyebrow on-dark">{eyebrow}</span>
          <h1 className="hp-serif" style={{ fontSize: m ? 42 : 84, fontWeight: 600, lineHeight: 1.04, letterSpacing: "-0.02em", color: "#fff", margin: "18px 0 0", maxWidth: "14ch", textShadow: "0 4px 34px rgba(0,0,0,0.32)" }}>
            {headline}
          </h1>
          {sub ? <p style={{ fontSize: m ? 16 : 19, lineHeight: 1.5, color: "rgba(255,255,255,0.9)", margin: "20px 0 0", maxWidth: "56ch" }}>{sub}</p> : null}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 13, marginTop: 30 }}>
            {ctx.waLink ? (
              <a href={ctx.waLink} target="_blank" rel="noopener noreferrer" className="hp-wabtn" style={{ fontSize: 15.5, padding: "15px 24px" }}>
                <WaIcon size={18} /> {U.heroCta1}
              </a>
            ) : null}
            <a href={ctx.packagesHref} style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "rgba(255,255,255,0.12)", color: "#fff", fontSize: 15.5, fontWeight: 600, padding: "15px 22px", borderRadius: 12, border: "1px solid rgba(255,255,255,0.4)", backdropFilter: "blur(6px)", textDecoration: "none" }}>
              {U.heroCta2}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

function About(c: AboutContent, ctx: Ctx) {
  const { lang, m, brand, agency } = ctx;
  const derivedBody = lang === "ar"
    ? String(agency.about_ar || agency.about_en || "")
    : String(agency.about_en || agency.about_ar || "");
  const body = pick(c.body, lang) || derivedBody;
  const heading = pick(c.heading, lang) || brand.name;
  const link = pick(c.link, lang);
  if (!body) {
    if (ctx.editor) return <EditorEmpty label={pick(c.eyebrow, lang) || (lang === "ar" ? "من نحن" : "About")} ctx={ctx} />;
    return null; // honest-empty: nothing to say yet
  }
  return (
    <section style={{ padding: `${vpad(m)}px 0` }}>
      <div className="hp-wrap" style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(2,1fr)", gap: m ? 28 : 64, alignItems: "center" }}>
        <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", height: m ? 260 : 440, background: PLACEHOLDER_GRAD }}>
          {c.image ? <img src={c.image} alt="" onError={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = "0")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
        </div>
        <div>
          <SectionHead eyebrow={pick(c.eyebrow, lang)} ctx={ctx} />
          <h2 className="hp-serif hp-h2" style={{ fontSize: h2size(ctx.m), maxWidth: "18ch" }}>{heading}</h2>
          <p style={{ fontSize: m ? 16 : 18, lineHeight: 1.65, color: "var(--ink2)", margin: "22px 0 0", maxWidth: "54ch" }}>{body}</p>
          {link ? <a href={ctx.aboutHref} className="hp-link" style={{ marginTop: 26 }}>{link}<span className="hp-arrow">{UI[lang].arrow}</span></a> : null}
        </div>
      </div>
    </section>
  );
}

function CardsSection(c: WhyUsContent | ServicesContent, ctx: Ctx, opts: { alt?: boolean; small?: boolean }) {
  const { lang, m } = ctx;
  const items = c.items || [];
  if (!items.length) {
    if (ctx.editor) return <EditorEmpty label={pick(c.heading, lang) || pick(c.eyebrow, lang) || (lang === "ar" ? "قسم" : "Section")} ctx={ctx} />;
    return null; // honest-empty until authored
  }
  const cardBg = opts.alt ? "var(--card)" : "var(--paper2)";
  return (
    <section style={{ padding: `${vpad(m)}px 0`, background: opts.alt ? "var(--alt)" : undefined, borderTop: opts.alt ? "1px solid var(--rule)" : undefined, borderBottom: opts.alt ? "1px solid var(--rule)" : undefined }}>
      <div className="hp-wrap">
        <SectionHead eyebrow={pick(c.eyebrow, lang)} heading={pick(c.heading, lang)} ctx={ctx} />
        <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(4,1fr)", gap: opts.small ? 18 : 20, marginTop: 42 }}>
          {items.map((it, i) => (
            <div key={i} style={{ background: cardBg, border: "1px solid var(--rule)", borderRadius: opts.small ? 15 : 16, padding: opts.small ? "24px 22px 26px" : "28px 26px 30px" }}>
              {opts.small ? (
                <div style={{ color: "var(--brand-text)" }}><FeatureIcon name={it.icon} /></div>
              ) : (
                <div className="hp-iconbox"><FeatureIcon name={it.icon} /></div>
              )}
              <h3 className="hp-serif" style={{ fontSize: opts.small ? 21 : 23, fontWeight: 600, margin: "16px 0 0", letterSpacing: "-0.01em" }}>{pick(it.title, lang)}</h3>
              <p style={{ fontSize: opts.small ? 13.5 : 14.5, lineHeight: opts.small ? 1.55 : 1.6, color: "var(--ink2)", margin: "8px 0 0" }}>{pick(it.desc, lang)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedPackages(c: FeaturedPackagesContent, ctx: Ctx) {
  const { lang, m, packages } = ctx;
  if (!packages.length) return null;
  const list = packages.slice(0, c.limit || 4);
  const link = pick(c.link, lang);
  return (
    <section style={{ padding: `${vpad(m)}px 0`, background: "var(--alt)", borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)" }}>
      <div className="hp-wrap">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div><SectionHead eyebrow={pick(c.eyebrow, lang)} heading={pick(c.heading, lang)} ctx={ctx} /></div>
          {link ? <a href={ctx.packagesHref} className="hp-link" style={{ paddingBottom: 6 }}>{link}<span className="hp-arrow">{UI[lang].arrow}</span></a> : null}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(4,1fr)", gap: 20, marginTop: 42 }}>
          {list.map((p) => (
            <PackageCard key={p.id} pkg={p} lang={lang} onOpen={() => ctx.openPkg(p.id)} />
          ))}
        </div>
      </div>
    </section>
  );
}

function Destinations(c: DestinationsContent, ctx: Ctx) {
  const { lang, m, packages } = ctx;
  const U = UI[lang];

  // Explicit bilingual tiles authored on the section take priority — they are
  // prefilled from package destinations but fully editable (rename / image / add
  // coverage countries). Tiles link to the filtered catalog by default; an agency
  // can opt a tile out by setting clickable:false (e.g. a country with no packages).
  type Tile = { name: string; image?: string; clickable: boolean; filter?: string };
  let tiles: Tile[];
  if (c.items?.length) {
    tiles = c.items.map((it) => ({
      name: pick(it.name, lang),
      image: it.image,
      clickable: it.clickable !== false,
      filter: it.filter,
    }));
  } else {
    // Derived from distinct package destinations — no invented trip counts.
    const seen = new Map<string, string | undefined>();
    for (const p of packages) {
      if (p.destination && !seen.has(p.destination)) seen.set(p.destination, p.coverImage || p.images?.[0]);
    }
    tiles = Array.from(seen.entries()).map(([name, img]) => ({ name, image: c.images?.[name] || img, clickable: true, filter: name }));
  }
  if (!tiles.length) return null;

  // Append a destination filter so the catalog opens pre-filtered to this country.
  const filteredHref = (filter?: string) => {
    const f = (filter ?? "").trim();
    if (!f) return ctx.packagesHref;
    return `${ctx.packagesHref}${ctx.packagesHref.includes("?") ? "&" : "?"}destination=${encodeURIComponent(f)}`;
  };

  const cols = Math.min(4, tiles.length) || 1;
  return (
    <section style={{ padding: `${vpad(m)}px 0` }}>
      <div className="hp-wrap">
        <SectionHead eyebrow={pick(c.eyebrow, lang)} heading={pick(c.heading, lang)} ctx={ctx} />
        <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : `repeat(${cols},1fr)`, gap: 18, marginTop: 42 }}>
          {tiles.map((t, i) => {
            const inner = (
              <>
                {t.image ? <img src={t.image} alt={t.name} onError={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = "0")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(15,20,17,0) 38%,rgba(15,20,17,0.72) 100%)" }} />
                <div style={{ position: "absolute", insetInline: 0, bottom: 0, padding: 20 }}>
                  <h3 className="hp-serif" style={{ fontSize: 26, fontWeight: 600, color: "#fff", letterSpacing: "-0.01em" }}>{t.name}</h3>
                  {t.clickable ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 7, fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.92)", marginTop: 4 }}>{U.explore}<span className="hp-arrow" style={{ fontSize: 15 }}>{U.arrow}</span></span>
                  ) : null}
                </div>
              </>
            );
            const style = { height: m ? 220 : 340, background: PLACEHOLDER_GRAD } as const;
            return t.clickable
              ? <a key={i} href={filteredHref(t.filter ?? t.name)} className="hp-dest" style={style}>{inner}</a>
              : <div key={i} className="hp-dest" style={{ ...style, cursor: "default" }}>{inner}</div>;
          })}
        </div>
      </div>
    </section>
  );
}

// The avatar + name + trip byline shared by every review kind. Renders nothing
// when a media-only review carries no name/trip/photo (honest — no fabricated
// attribution).
function ReviewByline({ it, ctx }: { it: Testimonial; ctx: Ctx }) {
  const { lang } = ctx;
  const name = (it.name || "").trim();
  const trip = pick(it.trip, lang);
  if (!name && !trip && !it.photo) return null;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto", paddingTop: 22 }}>
      {(it.photo || name) ? (
        <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#e2dbcc", display: "grid", placeItems: "center", overflow: "hidden", fontSize: 16, fontWeight: 600, color: "#8a7f6a", fontFamily: "var(--font-instrument-serif), serif" }}>
          {it.photo ? <img src={it.photo} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} /> : name.charAt(0).toUpperCase()}
        </div>
      ) : null}
      <div>
        {name ? <div style={{ fontSize: 14.5, fontWeight: 600, color: "#2a2620" }}>{name}</div> : null}
        {trip ? <div style={{ fontSize: 13, color: "var(--ink3)" }}>{trip}</div> : null}
      </div>
    </div>
  );
}

// One review card. The kind is inferred from the media URL (reviewKind): a video
// clip, an image screenshot, or — when there's no media — the classic quote card.
// Branch on kind FIRST so a media review never falls through to an empty quote.
// Shared by the home Testimonials section and the dedicated /reviews page.
export function ReviewTile({ it, ctx }: { it: Testimonial; ctx: Ctx }) {
  const { lang, m } = ctx;
  const kind = reviewKind(it.media);
  const frame = { background: "var(--card)", border: "1px solid var(--rule)", borderRadius: 18, overflow: "hidden", display: "flex", flexDirection: "column" } as const;
  if (kind === "video") {
    return (
      <div style={frame}>
        <video src={it.media} controls playsInline preload="metadata" className="hp-review-media" />
        <div style={{ padding: "0 20px" }}><ReviewByline it={it} ctx={ctx} /></div>
      </div>
    );
  }
  if (kind === "image") {
    return (
      <div style={frame}>
        <img src={it.media} alt={it.name || ""} loading="lazy" className="hp-review-media" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
        <div style={{ padding: "0 20px" }}><ReviewByline it={it} ctx={ctx} /></div>
      </div>
    );
  }
  return (
    <div style={{ ...frame, padding: "34px 34px 30px" }}>
      <div className="hp-serif" style={{ fontSize: 54, lineHeight: 0.6, color: "var(--brand-text)", height: 30 }}>&ldquo;</div>
      <p className="hp-serif" style={{ fontSize: m ? 21 : 26, lineHeight: 1.4, letterSpacing: "-0.01em", color: "#2a2620", margin: "14px 0 0" }}>{pick(it.quote, lang)}</p>
      <ReviewByline it={it} ctx={ctx} />
    </div>
  );
}

function Testimonials(c: TestimonialsContent, ctx: Ctx) {
  const { lang, m } = ctx;
  const U = UI[lang];
  const items = c.items || [];
  // Live (editor=false): no real reviews → hide the section entirely. The
  // "appears here" illustrative placeholder is editor-only.
  if (!items.length && !ctx.editor) return null;
  const limit = Math.max(1, c.limit || 4);
  const list = items.slice(0, limit);
  const hasMore = items.length > list.length;
  const viewAll = pick(c.link, lang) || U.tstViewAll;
  return (
    <section style={{ padding: `${vpad(m)}px 0`, background: "var(--alt)", borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)" }}>
      <div className="hp-wrap">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 20, flexWrap: "wrap" }}>
          <div><SectionHead eyebrow={pick(c.eyebrow, lang)} heading={pick(c.heading, lang)} ctx={ctx} /></div>
          {items.length === 0
            ? <span className="hp-tag">{U.tstIllus}</span>
            : hasMore ? <a href={ctx.reviewsHref} className="hp-link" style={{ paddingBottom: 6 }}>{viewAll}<span className="hp-arrow">{U.arrow}</span></a> : null}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(2,1fr)", gap: 20, marginTop: 40, alignItems: "start" }}>
          {items.length
            ? list.map((it, i) => <ReviewTile key={i} it={it} ctx={ctx} />)
            : (
              <>
                <div style={{ background: "var(--card)", border: "1px solid var(--rule)", borderRadius: 18, padding: "34px 34px 30px", display: "flex", flexDirection: "column" }}>
                  <div className="hp-serif" style={{ fontSize: 54, lineHeight: 0.6, color: "var(--brand-text)", height: 30 }}>&ldquo;</div>
                  <p className="hp-serif" style={{ fontSize: m ? 21 : 26, lineHeight: 1.4, letterSpacing: "-0.01em", color: "#2a2620", margin: "14px 0 0" }}>{U.tstQuote}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto", paddingTop: 26 }}>
                    <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#e2dbcc", border: "1px dashed #c9bd9f", display: "grid", placeItems: "center", fontSize: 8, fontWeight: 600, letterSpacing: "0.08em", color: "#8a7f6a", fontFamily: "ui-monospace,monospace" }}>PHOTO</div>
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 600, color: "#2a2620" }}>{U.tstName}</div>
                      <div style={{ fontSize: 13, color: "var(--ink3)" }}>{U.tstTrip}</div>
                    </div>
                  </div>
                </div>
                <div style={{ position: "relative", borderRadius: 18, overflow: "hidden", backgroundColor: "#dfd8c8", backgroundImage: "repeating-linear-gradient(135deg,rgba(47,93,80,0.06) 0,rgba(47,93,80,0.06) 1px,transparent 1px,transparent 13px)", minHeight: m ? 240 : "auto", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ width: 64, height: 64, borderRadius: "50%", background: "rgba(255,255,255,0.92)", display: "grid", placeItems: "center", margin: "0 auto", boxShadow: "0 10px 24px -8px rgba(0,0,0,0.3)" }}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="var(--brand-text)"><path d="M8 5.5v13l11-6.5z" /></svg>
                    </div>
                    <div style={{ fontFamily: "ui-monospace,'SF Mono',Menlo,monospace", fontSize: 11, letterSpacing: "0.14em", textTransform: "uppercase", color: "#8a7f6a", marginTop: 16 }}>{U.tstVideo}</div>
                  </div>
                </div>
              </>
            )}
        </div>
      </div>
    </section>
  );
}

function Stats(c: StatsContent, ctx: Ctx) {
  const { lang, ar, m, agency } = ctx;
  const U = UI[lang];
  const nums: [string, string][] = [];
  // Numbers are authored on the section (single source). Legacy agency.stats*
  // remain a fallback only — for configs saved before stats moved off Branding.
  const y = Number(c.years) || Number(agency.statsYears) || 0;
  const tr = Number(c.travellers) || Number(agency.statsTravellers) || 0;
  const ra = Number(c.rating) || Number(agency.statsRating) || 0;
  if (y) nums.push([arNum(y, ar), U.statYears]);
  if (tr) nums.push([arNum(tr, ar) + "+", U.statTravellers]);
  if (ra) nums.push([arNum(ra, ar), U.statRating]);
  const showNumbers = nums.length > 0;
  const qualities = (c.qualities || []).map((q) => pick(q, lang)).filter(Boolean);
  const authoredNote = pick(c.fallbackNote, lang);
  const note = authoredNote || U.statFallbackNote;
  // Honest fallback stays live when it has real content (qualities or an authored
  // note). Fully-empty (no numbers, no qualities, no authored note) → hide live;
  // editor still shows it with the default note so the agency knows it exists.
  const hasFallbackContent = qualities.length > 0 || !!authoredNote;
  if (!showNumbers && !hasFallbackContent && !ctx.editor) return null;
  return (
    <section style={{ padding: `${vpad(m)}px 0` }}>
      <div className="hp-wrap">
        <SectionHead eyebrow={pick(c.eyebrow, lang)} heading={pick(c.heading, lang)} ctx={ctx} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 20, marginTop: 26 }}>
          {showNumbers ? (
            <div style={{ border: "1px solid var(--rule)", borderRadius: 18, padding: "30px 30px 32px", background: "var(--paper2)" }}>
              <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : `repeat(${nums.length},1fr)`, gap: 24 }}>
                {nums.map(([n, label], i) => (
                  <div key={i}>
                    <div className="hp-serif" style={{ fontSize: m ? 44 : 56, fontWeight: 600, letterSpacing: "-0.02em", lineHeight: 0.9, color: "var(--brand-text)" }}>{n}</div>
                    <div style={{ fontSize: 13.5, color: "var(--ink2)", marginTop: 11 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ border: "1px solid var(--rule)", borderRadius: 18, padding: "30px 30px 32px", background: "var(--paper2)" }}>
              {qualities.length ? (
                <div style={{ display: "flex", flexDirection: "column", gap: 13 }}>
                  {qualities.map((q, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}><CheckIcon /><span style={{ fontSize: 15, color: "#2a2620" }}>{q}</span></div>
                  ))}
                </div>
              ) : null}
              <p style={{ fontSize: 12.5, lineHeight: 1.55, color: "var(--ink3)", margin: qualities.length ? "22px 0 0" : 0 }}>{note}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function SeasonalOffers(c: SeasonalOffersContent, ctx: Ctx) {
  const { lang, m } = ctx;
  const heading = pick(c.heading, lang);
  const body = pick(c.body, lang);
  if (!heading && !body) {
    if (ctx.editor) return <EditorEmpty label={pick(c.eyebrow, lang) || (lang === "ar" ? "عرض موسمي" : "Seasonal offer")} ctx={ctx} />;
    return null; // honest-empty until authored
  }
  const cta = pick(c.cta, lang) || UI[lang].learnMore;
  return (
    <section style={{ padding: `0 0 ${vpad(m)}px` }}>
      <div className="hp-wrap">
        <div style={{ position: "relative", overflow: "hidden", borderRadius: 22, background: "linear-gradient(120deg, var(--brand), var(--brand-deep))", color: "#eef2ee", display: "grid", gridTemplateColumns: m ? "1fr" : "1.1fr 0.9fr" }}>
          <div style={{ padding: m ? "40px 26px" : "60px 56px" }}>
            <span className="hp-eyebrow on-dark">{pick(c.eyebrow, lang)}</span>
            <h3 className="hp-serif" style={{ fontSize: m ? 30 : 42, fontWeight: 600, lineHeight: 1.16, letterSpacing: "-0.02em", color: "#fff", margin: "16px 0 0", maxWidth: "16ch" }}>{heading}</h3>
            {body ? <p style={{ fontSize: 15.5, lineHeight: 1.6, color: "rgba(238,242,238,0.85)", margin: "16px 0 0", maxWidth: "46ch" }}>{body}</p> : null}
            <a href={ctx.waLink || ctx.packagesHref} target={ctx.waLink ? "_blank" : undefined} rel={ctx.waLink ? "noopener noreferrer" : undefined} style={{ display: "inline-flex", alignItems: "center", gap: 9, background: "#fff", color: "var(--brand-deep)", fontSize: 15, fontWeight: 600, padding: "14px 22px", borderRadius: 12, marginTop: 26, textDecoration: "none" }}>{cta}<span className="hp-arrow" style={{ fontSize: 16 }}>{UI[lang].arrow}</span></a>
          </div>
          <div style={{ position: "relative", minHeight: m ? 220 : "auto", background: PLACEHOLDER_GRAD }}>
            {c.image ? <img src={c.image} alt="" onError={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = "0")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} /> : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function Accreditation(c: AccreditationContent, ctx: Ctx) {
  const { lang, m } = ctx;
  const badges = c.badges || [];
  if (!badges.length) {
    if (ctx.editor) return <EditorEmpty label={pick(c.eyebrow, lang) || (lang === "ar" ? "اعتمادات" : "Accreditation")} ctx={ctx} />;
    return null; // never invent badges
  }
  return (
    <section style={{ padding: `0 0 ${vpad(m)}px` }}>
      <div className="hp-wrap">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap", marginBottom: 24 }}>
          <span className="hp-eyebrow">{pick(c.eyebrow, lang)}</span>
          {pick(c.tag, lang) ? <span className="hp-tag">{pick(c.tag, lang)}</span> : null}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: m ? "1fr" : "repeat(4,1fr)", gap: 16 }}>
          {badges.map((b, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 13, background: "var(--paper2)", border: "1px solid var(--rule)", borderRadius: 14, padding: "20px 22px" }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: "var(--brand-tint)", display: "grid", placeItems: "center", flex: "0 0 auto", color: "var(--brand-text)" }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l7 3v5c0 4.5-3 7.8-7 9-4-1.2-7-4.5-7-9V6z" /><path d="M9.2 12l1.9 1.9 3.7-3.8" /></svg>
              </div>
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 600, color: "#2a2620" }}>{pick(b.title, lang)}</div>
                {pick(b.note, lang) ? <div style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 2 }}>{pick(b.note, lang)}</div> : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Contact(c: ContactContent, ctx: Ctx) {
  const { lang, m, brand } = ctx;
  const U = UI[lang];
  const heading = pick(c.heading, lang);
  const body = pick(c.body, lang);
  const note = pick(c.note, lang);
  return (
    <section id="hp-contact" style={{ background: "var(--brand-deep)", color: "var(--brand-on)" }}>
      <div className="hp-wrap" style={{ padding: `${vpad(m)}px ${m ? 22 : 56}px`, textAlign: "center" }}>
        <span className="hp-eyebrow is-center on-dark">{pick(c.eyebrow, lang)}</span>
        {heading ? <h2 className="hp-serif" style={{ fontSize: m ? 34 : 54, fontWeight: 600, lineHeight: 1.12, letterSpacing: "-0.02em", color: "#fff", margin: "18px auto 0", maxWidth: "18ch" }}>{heading}</h2> : null}
        {body ? <p style={{ fontSize: m ? 16 : 18, lineHeight: 1.6, color: "color-mix(in srgb, var(--brand-on) 85%, transparent)", margin: "18px auto 0", maxWidth: "50ch" }}>{body}</p> : null}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 13, marginTop: 32 }}>
          {ctx.waLink ? <a href={ctx.waLink} target="_blank" rel="noopener noreferrer" className="hp-wabtn" style={{ fontSize: 16, padding: "16px 26px" }}><WaIcon size={19} /> {U.waCta}</a> : null}
          {brand.email ? <a href={emailHref(brand.email, m)} {...(m ? {} : { target: "_blank", rel: "noopener noreferrer" })} className="hp-ghostbtn" style={{ fontSize: 16, padding: "16px 24px", color: "#fff", border: "1px solid rgba(255,255,255,0.4)" }}>{U.emailCta}</a> : null}
        </div>
        {note ? <div style={{ fontSize: 13, color: "color-mix(in srgb, var(--brand-on) 60%, transparent)", marginTop: 18 }}>{note}</div> : null}
      </div>
    </section>
  );
}

// Team — About-page section. Photos are agency-uploaded; a member without a
// photo renders a placeholder slot (never a stock face). Empty members → hidden
// live; editor shows the labeled placeholder so the agency can fill it.
function Team(c: TeamContent, ctx: Ctx) {
  const { lang, m } = ctx;
  const members = c.members || [];
  if (!members.length) {
    if (ctx.editor) return <EditorEmpty label={pick(c.heading, lang) || pick(c.eyebrow, lang) || (lang === "ar" ? "الفريق" : "Team")} ctx={ctx} />;
    return null; // honest-empty: no team published yet
  }
  const note = pick(c.note, lang);
  const slot = lang === "ar" ? "صورة الفريق" : "team photo";
  return (
    <section style={{ padding: `${vpad(m)}px 0` }}>
      <div className="hp-wrap">
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 24, flexWrap: "wrap" }}>
          <div><SectionHead eyebrow={pick(c.eyebrow, lang)} heading={pick(c.heading, lang)} ctx={ctx} /></div>
          {note ? <p style={{ fontSize: 14.5, lineHeight: 1.6, color: "var(--ink2)", maxWidth: "40ch", margin: 0 }}>{note}</p> : null}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: m ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: m ? 16 : 22, marginTop: 40 }}>
          {members.map((p, i) => {
            const name = pick(p.name, lang);
            const role = pick(p.role, lang);
            return (
              <div key={i}>
                <div style={{ position: "relative", aspectRatio: "4 / 5", borderRadius: 16, overflow: "hidden", border: "1px solid var(--rule)", backgroundColor: "#efe9dc", backgroundImage: "repeating-linear-gradient(135deg,rgba(47,93,80,0.06) 0,rgba(47,93,80,0.06) 1px,transparent 1px,transparent 11px)", display: "grid", placeItems: "center" }}>
                  {p.photo ? (
                    <img src={p.photo} alt={name} onError={(e) => ((e.currentTarget as HTMLImageElement).style.opacity = "0")} style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ textAlign: "center", padding: 18 }}>
                      <svg width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="#b3a88f" strokeWidth="1.5" style={{ margin: "0 auto" }}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" strokeLinecap="round" /></svg>
                      <div style={{ fontFamily: "ui-monospace,'SF Mono',Menlo,monospace", fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: "#a59a85", marginTop: 12 }}>{slot}</div>
                    </div>
                  )}
                </div>
                {name ? <h3 className="hp-serif" style={{ fontSize: 21, fontWeight: 600, letterSpacing: "-0.01em", margin: "16px 0 0" }}>{name}</h3> : null}
                {role ? <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--brand-text)", marginTop: 3 }}>{role}</div> : null}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Dispatcher ──────────────────────────────────────────────────────────────

export function renderSection(section: HomeSection, ctx: Ctx): React.ReactNode {
  switch (section.type) {
    case "hero": return Hero(section.content as HeroContent, ctx);
    case "about": return About(section.content as AboutContent, ctx);
    case "why_us": return CardsSection(section.content as WhyUsContent, ctx, { alt: true });
    case "services": return CardsSection(section.content as ServicesContent, ctx, { small: true });
    case "featured_packages": return FeaturedPackages(section.content as FeaturedPackagesContent, ctx);
    case "destinations": return Destinations(section.content as DestinationsContent, ctx);
    case "testimonials": return Testimonials(section.content as TestimonialsContent, ctx);
    case "stats": return Stats(section.content as StatsContent, ctx);
    case "seasonal_offers": return SeasonalOffers(section.content as SeasonalOffersContent, ctx);
    case "accreditation": return Accreditation(section.content as AccreditationContent, ctx);
    case "team": return Team(section.content as TeamContent, ctx);
    case "contact": return Contact(section.content as ContactContent, ctx);
    // blog / gallery / faq / how_it_works / map: modeled, renderer deferred.
    default: return null;
  }
}

export { waHref };
