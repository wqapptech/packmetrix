// Satori-compatible PDF page components, adapted from export-pdf.jsx.
// Each PdfPage is rendered to PNG via ImageResponse, then stitched into a PDF
// by pdf-lib. A4 at 96dpi = 794×1123px.
//
// Same satori constraints as images.tsx — no logical CSS, no backdrop-filter,
// inline SVGs only, cover image as <img> data URI.

import type { ExportData } from "./data";
import { DESTINATION_GRADIENTS } from "@/lib/destination";

const A4_W = 794;
const A4_H = 1123;

// Satori does not resolve flex:1 into concrete px — every text-bearing
// container needs a hard pixel width or text collapses to one word per line.
const PAD       = 56;                          // horizontal page margin
const CONTENT_W = A4_W - PAD * 2;             // 682 — usable column width
const INCL_GAP  = 24;                          // gap between incl/excl columns
const INCL_COL  = Math.floor((CONTENT_W - INCL_GAP) / 2); // 329 — each column
const INCL_TEXT = INCL_COL - 15 - 8;                      // 306 — text within each item
const BOX_W     = 560;                                    // centered card width (~82% of CONTENT_W)

const T = {
  bg:        "#f4f0e8",
  surface:   "#fbf8f0",
  surface2:  "#ffffff",
  ink1:      "#1a1611",
  ink2:      "#5e564a",
  ink3:      "#968d7c",
  rule:      "#e6dcc6",
  rule2:     "#d8ccb0",
  gold:      "#b08a3e",
  goldDeep:  "#8b6b2a",
  goldSoft:  "#f1e4be",
  green:     "#4d8a5e",
  greenSoft: "#e0eede",
  mono:      "ui-monospace, monospace",
};

function pdfSans(lang: "en" | "ar") {
  return lang === "ar"
    ? '"IBM Plex Sans Arabic", "Inter", system-ui, sans-serif'
    : '"Inter", -apple-system, system-ui, sans-serif';
}
function pdfDisplay(lang: "en" | "ar") {
  return lang === "ar"
    ? '"IBM Plex Sans Arabic", "Instrument Serif", Georgia, serif'
    : '"Instrument Serif", Georgia, serif';
}
function coverBg(data: ExportData) {
  return DESTINATION_GRADIENTS[data.destinationKind] ?? DESTINATION_GRADIENTS.default;
}

function LogoMark({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 272 330" fill="none">
      <path d="M11.21 0.42C44.158 0.06 77.108-0.06 110.058 0.07C134.817 0.07 172.216-1.76 194.97 4.29C212.417 9.01 228.362 18.13 241.279 30.77C252.861 41.91 269.136 65.75 270.979 81.7L271.881 84.7C279.138 113.78 274.413 144.55 258.767 170.12C243.547 195.02 218.977 212.79 190.557 219.44C179.307 222.02 168.258 222.33 156.765 222L81.818 222.26C82.01 213.6 81.092 159.03 82.941 155.85L84.679 155.79C113.247 152.11 151.052 159.45 178.807 153.7C209.092 147.43 219.583 102.43 197.636 80.43C191.643 74.41 184.089 70.18 175.824 68.22C165.409 65.72 91.966 66.73 76.564 66.61C69.238 59.57 60.017 50.9 53.728 43.2C48.527 38.62 46.494 36.51 42.009 31.21C31.443 21.27 21.441 10.02 11.21 0.42Z" fill="#b08a3e"/>
      <path d="M0.921 330.24C2.231 230.88 0.109 131.03 1.13 31.61C1.176 27.16 0.521 18.95 1.986 15.14L3.335 15.16L5.088 17.38C25.119 37.18 45.321 59.71 65.255 78.87L65.431 167.17C65.44 182.07 65.991 201.8 65.071 216.19C65.956 230.74 65.313 249.39 65.398 264.42C43.896 285.25 22.306 308.83 0.921 330.24Z" fill="#b08a3e"/>
    </svg>
  );
}

function CheckIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function WaIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  );
}

// ── Shared page footer ────────────────────────────────────────────────────────

function PageFooter({ data, lang, n, total }: {
  data: ExportData; lang: "en" | "ar"; n: number; total: number;
}) {
  const sans  = pdfSans(lang);
  const isAr  = lang === "ar";
  return (
    <div style={{
      position: "absolute",
      bottom:   0,
      left:     0,
      right:    0,
      height:   52,
      paddingLeft:  isAr ? 0  : 56,
      paddingRight: isAr ? 56 : 0,
      borderTop: `1px solid ${T.rule}`,
      display:   "flex",
      alignItems: "center",
      justifyContent: "space-between",
      fontFamily: sans,
      fontSize:   11,
      color:      T.ink3,
      flexDirection: isAr ? "row-reverse" : "row",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 7, flexDirection: isAr ? "row-reverse" : "row" }}>
        <LogoMark size={13} />
        <span>{data.agency || "Packmetrix"}</span>
      </div>
      <span style={{ direction: "ltr" }}>{data.url}</span>
      <span>{isAr ? `صفحة ${n} من ${total}` : `Page ${n} of ${total}`}</span>
    </div>
  );
}

function SectionTitle({ kicker, title, sans, display, isAr }: {
  kicker: string; title: string; sans: string; display: string; isAr: boolean;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", marginBottom: 24, width: CONTENT_W }}>
      <div style={{
        display: "flex",
        fontFamily: sans, fontSize: 10.5, fontWeight: 600,
        letterSpacing: "1.6px", textTransform: "uppercase" as const, color: T.gold, marginBottom: 7,
        textAlign: isAr ? "right" : "left",
        direction: isAr ? "rtl" : "ltr",
        width: CONTENT_W,
      }}>{kicker}</div>
      <div style={{
        display: "flex",
        fontFamily: display, fontSize: 28, fontWeight: 400,
        color: T.ink1, letterSpacing: "-0.6px", lineHeight: 1.1,
        textAlign: isAr ? "right" : "left",
        direction: isAr ? "rtl" : "ltr",
        width: CONTENT_W,
      }}>{title}</div>
    </div>
  );
}

// ─── Page 1: Cover ───────────────────────────────────────────────────────────

export function PdfCover({ data, lang, qrDataUri }: {
  data: ExportData; lang: "en" | "ar"; qrDataUri: string;
}) {
  const sans    = pdfSans(lang);
  const display = pdfDisplay(lang);
  const isAr    = lang === "ar";
  const coverH  = 696;

  return (
    <div style={{
      display:   "flex",
      width:     A4_W,
      height:    A4_H,
      background: T.surface,
      position:  "relative",
      overflow:  "hidden",
      fontFamily: sans,
      direction:  isAr ? "rtl" : "ltr",
    }}>
      {/* Cover — top 62% */}
      <div style={{
        display: "flex", position: "absolute", top: 0, left: 0, right: 0, height: coverH, overflow: "hidden",
      }}>
        {data.coverImageUrl ? (
          <img src={data.coverImageUrl} style={{
            position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
            width: "100%", height: "100%", objectFit: "cover",
          }} />
        ) : (
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: coverBg(data) }} />
        )}
        {/* Full scrim for legibility */}
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
          background: "linear-gradient(180deg, rgba(13,10,6,.35) 0%, rgba(13,10,6,.55) 100%)",
        }} />

        {/* Brand bar */}
        <div style={{
          position: "absolute", top: 44,
          left:  isAr ? 0  : 56,
          right: isAr ? 56 : 0,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexDirection: isAr ? "row-reverse" : "row",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexDirection: isAr ? "row-reverse" : "row" }}>
            <div style={{
              width: 34, height: 34, borderRadius: 34 * 0.26,
              background: "rgba(255,255,255,.14)",
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <LogoMark size={20} />
            </div>
            <div style={{ fontFamily: display, fontSize: 21, color: "#fff", letterSpacing: "-0.3px" }}>
              Packmetrix
            </div>
          </div>
          <div style={{
            padding: "7px 16px", background: "rgba(255,255,255,.16)", borderRadius: 999,
            color: "#fff", fontFamily: sans, fontSize: 15, fontWeight: 600,
            display: "flex", alignItems: "center", gap: 8,
            flexDirection: isAr ? "row-reverse" : "row",
          }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: T.gold }} />
            {data.tag}
          </div>
        </div>

        {/* Title block — bottom of cover */}
        <div style={{
          position: "absolute",
          left:  isAr ? 0 : 56,
          right: isAr ? 56 : 0,
          bottom: 56,
          top:    coverH - 340,
          display: "flex", flexDirection: "column", justifyContent: "flex-end", overflow: "hidden",
        }}>
          <div style={{
            display: "flex",
            fontFamily: sans, fontSize: 17, fontWeight: 600, letterSpacing: "2px",
            textTransform: "uppercase" as const, color: "rgba(255,255,255,.9)", marginBottom: 14,
            textAlign: isAr ? "right" : "left",
          }}>
            {data.destination}
          </div>
          <div style={{
            display: "flex",
            fontFamily: display, fontSize: 56, fontWeight: 400, color: "#fff",
            letterSpacing: "-1.4px", lineHeight: 1.0,
            textAlign: isAr ? "right" : "left",
          }}>
            {data.title}
          </div>
          {data.subtitle && (
            <div style={{
              display: "flex",
              fontFamily: sans, fontSize: 18, color: "rgba(255,255,255,.85)", marginTop: 16,
              textAlign: isAr ? "right" : "left",
            }}>
              {data.subtitle.length > 127 ? data.subtitle.slice(0, 127) + "…" : data.subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Lower facts band */}
      <div style={{
        position: "absolute", top: coverH, left: 0, right: 0, bottom: 0,
        paddingTop: 36,
        paddingLeft: isAr ? 0 : 56,
        paddingRight: isAr ? 56 : 0,
        display: "flex", flexDirection: "column",
      }}>
        {/* Fact row: duration, dates, price */}
        <div style={{ display: "flex", flexDirection: isAr ? "row-reverse" : "row", width: CONTENT_W }}>
          {[
            {
              k: isAr ? "المدة" : "Duration",
              v: data.nights ? (isAr ? `${data.nights} ليالٍ` : `${data.nights} nights`) : "—",
            },
            { k: isAr ? "التواريخ" : "Dates",           v: data.dates  || "—" },
            { k: isAr ? "السعر للفرد" : "Price / person", v: data.price  || "—" },
          ].map((f, i) => (
            <div key={i} style={{
              flex: 1,
              display: "flex", flexDirection: "column",
              paddingLeft:   isAr ? 0 : (i > 0 ? 20 : 0),
              paddingRight:  isAr ? (i > 0 ? 20 : 0) : 0,
              ...(!isAr && i > 0 ? { borderLeft: `1px solid ${T.rule}` } : {}),
              ...(isAr  && i > 0 ? { borderRight: `1px solid ${T.rule}` } : {}),
            }}>
              <div style={{
                display: "flex",
                fontFamily: sans, fontSize: 10.5, fontWeight: 600,
                letterSpacing: "1.2px", textTransform: "uppercase" as const,
                color: T.ink3, marginBottom: 8,
                textAlign: isAr ? "right" : "left",
                direction: isAr ? "rtl" : "ltr",
              }}>{f.k}</div>
              <div style={{
                display: "flex",
                fontFamily: display, fontSize: 26, fontWeight: 400,
                color: T.ink1, letterSpacing: "-0.4px", lineHeight: 1.05,
                textAlign: isAr ? "right" : "left",
                direction: isAr ? "rtl" : "ltr",
              }}>{f.v}</div>
            </div>
          ))}
        </div>

        <div style={{ flex: 1 }} />

        {/* Agency + QR card — narrower and centered */}
        <div style={{ display: "flex", width: CONTENT_W, justifyContent: "center", marginBottom: 60 }}>
          <div style={{
            width: BOX_W,
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "20px 24px",
            background: T.bg, border: `1px solid ${T.rule}`, borderRadius: 12,
            flexDirection: isAr ? "row-reverse" : "row",
          }}>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {data.agency && (
                <div style={{
                  display: "flex",
                  fontFamily: display, fontSize: 22, color: T.ink1, letterSpacing: "-0.3px",
                  textAlign: isAr ? "right" : "left",
                }}>{data.agency}</div>
              )}
              {data.agencyTag && (
                <div style={{
                  display: "flex",
                  fontFamily: sans, fontSize: 13, color: T.ink2, marginTop: 4,
                  textAlign: isAr ? "right" : "left",
                }}>{data.agencyTag}</div>
              )}
            </div>
            <div style={{
              display: "flex", alignItems: "center", gap: 16,
              flexDirection: isAr ? "row-reverse" : "row",
            }}>
              {data.whatsapp && (
                <div style={{ display: "flex", flexDirection: "column", textAlign: isAr ? "left" : "right" }}>
                  <div style={{
                    display: "flex",
                    fontFamily: sans, fontSize: 11, color: T.ink3,
                    letterSpacing: ".5px", textTransform: "uppercase" as const,
                  }}>
                    {isAr ? "للحجز" : "To book"}
                  </div>
                  <div style={{
                    display: "flex",
                    fontFamily: sans, fontSize: 16, fontWeight: 600, color: T.ink1,
                    marginTop: 3, direction: "ltr",
                    textAlign: isAr ? "right" : "left",
                  }}>{data.whatsapp}</div>
                </div>
              )}
              <img src={qrDataUri} width={68} height={68} style={{ borderRadius: 4, flexShrink: 0 }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page 2+: Overview (first page only) + Itinerary chunk ──────────────────
// itinerarySlice: the pre-chunked days for this page — NO further slicing here.
// showOverview:   true only on the first content page.
// disclosureNote: set on the final content page when days > MAX_DAYS (see route.ts).

export function PdfContent({ data, lang, pageNum, total, itinerarySlice, showOverview, disclosureNote }: {
  data:           ExportData;
  lang:           "en" | "ar";
  pageNum:        number;
  total:          number;
  itinerarySlice: ExportData["itinerary"];
  showOverview:   boolean;
  disclosureNote?: { text: string; url: string };
}) {
  const sans    = pdfSans(lang);
  const display = pdfDisplay(lang);
  const isAr    = lang === "ar";

  const overviewRaw  = data.overview || "";
  const overviewText = overviewRaw.length > 500
    ? overviewRaw.slice(0, 497) + "…"
    : overviewRaw;

  return (
    <div style={{
      display:       "flex",
      flexDirection: "column",
      width:         A4_W,
      height:        A4_H,
      background:    T.surface,
      position:      "relative",
      overflow:      "hidden",
      fontFamily:    sans,
      direction:     isAr ? "rtl" : "ltr",
    }}>
      <div style={{
        display:        "flex",
        flexDirection:  "column",
        justifyContent: "flex-start",
        flex:           1,
        boxSizing:      "border-box",
        width:          A4_W,
        paddingTop:     48,
        paddingLeft:    isAr ? 0  : PAD,
        paddingRight:   isAr ? PAD : 0,
        paddingBottom:  116,
      }}>
        {/* Overview — first content page only */}
        {showOverview && (
          <div style={{ display: "flex", flexDirection: "column", width: CONTENT_W, marginBottom: 24 }}>
            <SectionTitle
              kicker={isAr ? "نظرة عامة" : "Overview"}
              title={isAr ? "عن الرحلة" : "About this journey"}
              sans={sans} display={display} isAr={isAr}
            />
            {overviewText && (
              <div style={{
                display: "flex",
                width: CONTENT_W,
                fontFamily: sans, fontSize: 13.5, color: T.ink2, lineHeight: 1.65,
                textAlign: isAr ? "right" : "left",
                direction: isAr ? "rtl" : "ltr",
              }}>
                {overviewText}
              </div>
            )}
          </div>
        )}

        {/* Itinerary — chunking in route.ts is the only control; no slice here */}
        {itinerarySlice.length > 0 && (
          <>
            <SectionTitle
              kicker={
                showOverview
                  ? (isAr ? "البرنامج" : "Itinerary")
                  : (isAr ? "البرنامج (تابع)" : "Itinerary (cont.)")
              }
              title={isAr ? "يوماً بيوم" : "Day by day"}
              sans={sans} display={display} isAr={isAr}
            />
            <div style={{ display: "flex", position: "relative", marginBottom: 24 }}>
              {/* Vertical timeline line */}
              <div style={{
                position: "absolute",
                left:  isAr ? "auto" : 6,
                right: isAr ? 6      : "auto",
                top: 8, bottom: 8,
                width: 1.5,
                background: T.rule,
              }} />
              <div style={{ width: CONTENT_W, display: "flex", flexDirection: "column", gap: 12 }}>
                {itinerarySlice.map((row, i) => (
                  <div key={i} style={{
                    display: "flex", gap: 16, position: "relative",
                    flexDirection: isAr ? "row-reverse" : "row",
                  }}>
                    <div style={{
                      width: 13, height: 13, borderRadius: "50%",
                      background: T.gold, border: `2.5px solid ${T.surface}`,
                      marginTop: 4, flexShrink: 0,
                    }} />
                    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
                      <div style={{
                        display: "flex", alignItems: "baseline", gap: 10,
                        flexDirection: isAr ? "row-reverse" : "row",
                      }}>
                        <span style={{
                          fontFamily: sans, fontSize: 10.5, fontWeight: 600,
                          letterSpacing: ".8px", textTransform: "uppercase" as const,
                          color: T.gold, minWidth: 56,
                          textAlign: isAr ? "right" : "left",
                        }}>{row.d}</span>
                        <span style={{
                          fontFamily: display, fontSize: 16, color: T.ink1, letterSpacing: "-0.2px",
                          direction: isAr ? "rtl" : "ltr",
                          minWidth: 0,
                        }}>{row.t}</span>
                      </div>
                      {row.b && (
                        <div style={{
                          display: "flex",
                          fontFamily: sans, fontSize: 12.5, color: T.ink2,
                          lineHeight: 1.5, marginTop: 3,
                          paddingLeft:  isAr ? 0  : 66,
                          paddingRight: isAr ? 66 : 0,
                          textAlign: isAr ? "right" : "left",
                          direction: isAr ? "rtl" : "ltr",
                          width: "100%",
                          boxSizing: "border-box",
                        }}>{row.b}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Disclosure note — shown when itinerary was capped at MAX_DAYS */}
            {disclosureNote && (
              <div style={{
                paddingTop: 12, borderTop: `1px solid ${T.rule}`,
                display: "flex", flexDirection: "column", gap: 2,
              }}>
                <div style={{
                  display: "flex",
                  fontFamily: sans, fontSize: 11, color: T.gold,
                  textAlign: isAr ? "right" : "left",
                }}>
                  {disclosureNote.text}
                </div>
                <div style={{
                  display: "flex",
                  fontFamily: sans, fontSize: 11, color: T.ink3,
                  direction: "ltr", textAlign: isAr ? "right" : "left",
                }}>
                  {disclosureNote.url}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <PageFooter data={data} lang={lang} n={pageNum} total={total} />
    </div>
  );
}

// ─── Page 3: Inclusions + Pricing + Contact CTA ───────────────────────────────

export function PdfContact({ data, lang, pageNum, total, qrDataUri }: {
  data: ExportData; lang: "en" | "ar"; pageNum: number; total: number; qrDataUri: string;
}) {
  const sans    = pdfSans(lang);
  const display = pdfDisplay(lang);
  const isAr    = lang === "ar";

  return (
    <div style={{
      display:        "flex",
      flexDirection:  "column",
      width:          A4_W,
      height:         A4_H,
      background:     T.surface,
      position:       "relative",
      overflow:       "hidden",
      fontFamily:     sans,
      direction:      isAr ? "rtl" : "ltr",
    }}>
      <div style={{
        paddingTop:     48,
        paddingLeft:    isAr ? 0  : PAD,
        paddingRight:   isAr ? PAD : 0,
        paddingBottom:  116,
        flex:           1,
        boxSizing:      "border-box",
        width:          A4_W,
        display:        "flex",
        flexDirection:  "column",
        justifyContent: "space-between",
      }}>
        {/* Inclusions — wrapped so it counts as one flex child for space-between */}
        {(data.includes.length > 0 || data.excludes.length > 0) && (
          <div style={{ display: "flex", flexDirection: "column", width: CONTENT_W }}>
            <SectionTitle
              kicker={isAr ? "التفاصيل" : "Details"}
              title={isAr ? "ما يشمله وما لا يشمله" : "What's included"}
              sans={sans} display={display} isAr={isAr}
            />
            <div style={{
              display: "flex", flexDirection: isAr ? "row-reverse" : "row",
              gap: INCL_GAP, width: CONTENT_W, marginBottom: 24,
            }}>
              {/* Included */}
              <div style={{ width: INCL_COL, flexShrink: 0, display: "flex", flexDirection: "column" }}>
                <div style={{
                  fontFamily: sans, fontSize: 11.5, fontWeight: 600, color: T.green,
                  marginBottom: 10,
                  display: "flex", alignItems: "center", gap: 6,
                  flexDirection: isAr ? "row-reverse" : "row",
                }}>
                  <span style={{ color: T.green }}><CheckIcon size={13} /></span>
                  {isAr ? "يشمل" : "Included"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.includes.slice(0, 8).map((x, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: 8,
                      fontFamily: sans, fontSize: 12.5, color: T.ink1,
                      flexDirection: isAr ? "row-reverse" : "row",
                    }}>
                      <div style={{
                        width: 15, height: 15, borderRadius: "50%",
                        background: T.greenSoft, color: T.green, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        marginTop: 1,
                      }}>
                        <CheckIcon size={9} />
                      </div>
                      <span style={{ width: INCL_TEXT, textAlign: isAr ? "right" : "left" }}>{x}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Excluded */}
              <div style={{ width: INCL_COL, flexShrink: 0, display: "flex", flexDirection: "column" }}>
                <div style={{
                  display: "flex",
                  fontFamily: sans, fontSize: 11.5, fontWeight: 600,
                  color: T.ink3, marginBottom: 10,
                  textAlign: isAr ? "right" : "left",
                  direction: isAr ? "rtl" : "ltr",
                  width: INCL_COL,
                }}>
                  {isAr ? "لا يشمل" : "Not included"}
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {data.excludes.slice(0, 6).map((x, i) => (
                    <div key={i} style={{
                      display: "flex", alignItems: "flex-start", gap: 8,
                      fontFamily: sans, fontSize: 12.5, color: T.ink2,
                      flexDirection: isAr ? "row-reverse" : "row",
                    }}>
                      <div style={{
                        width: 15, height: 15, borderRadius: "50%",
                        background: T.bg, border: `1px solid ${T.rule2}`,
                        color: T.ink3, flexShrink: 0, flexDirection: "row",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 10, marginTop: 1,
                      }}>×</div>
                      <span style={{ width: INCL_TEXT, textAlign: isAr ? "right" : "left" }}>{x}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Price band — narrower and centered */}
        {data.price && (
          <div style={{ display: "flex", width: CONTENT_W, justifyContent: "center" }}>
            <div style={{
              width: BOX_W,
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "18px 22px",
              background: T.goldSoft, border: `1px solid rgba(176,138,62,.3)`, borderRadius: 12,
              flexDirection: isAr ? "row-reverse" : "row",
            }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div style={{
                  display: "flex",
                  fontFamily: sans, fontSize: 10.5, fontWeight: 600,
                  letterSpacing: "1px", textTransform: "uppercase" as const,
                  color: T.goldDeep,
                  textAlign: isAr ? "right" : "left",
                }}>
                  {isAr ? "السعر النهائي" : "Total price"}
                </div>
                <div style={{
                  display: "flex",
                  fontFamily: sans, fontSize: 12.5, color: T.ink2, marginTop: 4,
                  textAlign: isAr ? "right" : "left",
                }}>
                  {data.perPerson}
                </div>
              </div>
              <div style={{
                display: "flex", alignItems: "baseline", gap: 10,
                flexDirection: isAr ? "row-reverse" : "row",
              }}>
                {data.was && (
                  <span style={{
                    fontFamily: sans, fontSize: 17, color: T.ink3, textDecoration: "line-through",
                  }}>{data.was}</span>
                )}
                <span style={{
                  fontFamily: display, fontSize: 40, color: T.ink1,
                  letterSpacing: "-1px", lineHeight: 0.9,
                }}>{data.price}</span>
              </div>
            </div>
          </div>
        )}

        {/* Contact CTA block — narrower and centered */}
        <div style={{ display: "flex", width: CONTENT_W, justifyContent: "center", marginBottom: 60 }}>
          <div style={{
            width: BOX_W,
            padding: "24px 28px",
            background: T.ink1, borderRadius: 14,
            display: "flex", alignItems: "center", gap: 24,
            flexDirection: isAr ? "row-reverse" : "row",
          }}>
            <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{
                display: "flex",
                fontFamily: display, fontSize: 26, color: "#fff",
                letterSpacing: "-0.5px", lineHeight: 1.1,
                textAlign: isAr ? "right" : "left",
              }}>
                {isAr ? "جاهزون للحجز؟" : "Ready to book?"}
              </div>
              <div style={{
                display: "flex",
                fontFamily: sans, fontSize: 13, color: "rgba(255,255,255,.7)",
                marginTop: 8, lineHeight: 1.5,
                textAlign: isAr ? "right" : "left",
              }}>
                {isAr
                  ? "راسلونا على واتساب وسنؤكد مقعدكم خلال دقائق."
                  : "Message us on WhatsApp and we'll confirm your seat in minutes."}
              </div>
              {data.whatsapp && (
                <div style={{
                  display: "flex", alignItems: "center", gap: 10, marginTop: 16,
                  flexDirection: isAr ? "row-reverse" : "row",
                }}>
                  <div style={{
                    width: 38, height: 38, borderRadius: 9, background: "#25D366",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, color: "#fff",
                  }}>
                    <WaIcon size={20} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{
                      display: "flex",
                      fontFamily: sans, fontSize: 17, fontWeight: 600, color: "#fff",
                      direction: "ltr", textAlign: isAr ? "right" : "left",
                    }}>{data.whatsapp}</div>
                    <div style={{
                      display: "flex",
                      fontFamily: sans, fontSize: 11, color: "rgba(255,255,255,.55)",
                      direction: "ltr", textAlign: isAr ? "right" : "left",
                    }}>{data.url}</div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0 }}>
              <img src={qrDataUri} width={112} height={112} style={{ borderRadius: 6 }} />
              <div style={{
                display: "flex",
                fontFamily: sans, fontSize: 10, color: "rgba(255,255,255,.5)", marginTop: 6,
              }}>
                {isAr ? "امسح للصفحة الكاملة" : "Scan for full page"}
              </div>
            </div>
          </div>
        </div>
      </div>

      <PageFooter data={data} lang={lang} n={pageNum} total={total} />
    </div>
  );
}
