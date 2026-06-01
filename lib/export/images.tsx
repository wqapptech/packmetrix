// Satori-compatible render components for the shareable images.
// Adapted from the design's export-images.jsx:
//   - Logical CSS (insetInlineStart etc.) replaced with explicit left/right
//   - backdrop-filter, textShadow, repeating-linear-gradient removed (not supported)
//   - Icons inlined as <svg> elements
//   - QR code rendered as <img src={qrDataUri}>
//   - Cover image rendered as <img> (base64 data URI) or gradient fallback
//
// These components are used server-side only (next/og ImageResponse).
// They are NOT imported by any client component.

import type { ExportData } from "./data";
import { DESTINATION_GRADIENTS } from "@/lib/destination";

// Warm Editorial token values (matching lib/tokens.ts DA_* constants)
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

function exportSans(lang: "en" | "ar") {
  return lang === "ar"
    ? '"IBM Plex Sans Arabic", "Inter", system-ui, sans-serif'
    : '"Inter", -apple-system, system-ui, sans-serif';
}
function exportDisplay(lang: "en" | "ar") {
  return lang === "ar"
    ? '"IBM Plex Sans Arabic", "Instrument Serif", Georgia, serif'
    : '"Instrument Serif", Georgia, serif';
}

function coverBg(data: ExportData): string {
  return DESTINATION_GRADIENTS[data.destinationKind] ?? DESTINATION_GRADIENTS.default;
}

// Packmetrix logo — simplified inline SVG (gold fill, 272×330 viewBox)
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
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
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

// ─── Shared sub-elements ──────────────────────────────────────────────────────

function ExportLogoBar({
  data, lang, logoSize = 44,
}: {
  data: ExportData; lang: "en" | "ar"; logoSize?: number;
}) {
  const sans = exportSans(lang);
  const isAr = lang === "ar";
  return (
    <div style={{
      position:    "absolute",
      top:          40,
      left:         44,
      right:        44,
      display:     "flex",
      alignItems:  "center",
      justifyContent: "space-between",
      flexDirection: isAr ? "row-reverse" : "row",
    }}>
      {/* Brand lock-up */}
      <div style={{ display: "flex", alignItems: "center", gap: 9, flexDirection: isAr ? "row-reverse" : "row" }}>
        <div style={{
          width: logoSize, height: logoSize, borderRadius: logoSize * 0.26,
          background: "rgba(255,255,255,.14)",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <LogoMark size={logoSize * 0.58} />
        </div>
        <div style={{
          fontFamily: exportDisplay(lang),
          fontSize:   logoSize * 0.62,
          color:      "#fff",
          letterSpacing: "-0.3px",
        }}>
          Packmetrix
        </div>
      </div>
      {/* Tag pill */}
      <div style={{
        padding:      "9px 18px",
        background:   "rgba(255,255,255,.16)",
        borderRadius: 999,
        color:        "#fff",
        fontFamily:   sans,
        fontSize:     22,
        fontWeight:   600,
        display:      "flex",
        alignItems:   "center",
        gap:           9,
        flexDirection: isAr ? "row-reverse" : "row",
      }}>
        <span style={{ width: 10, height: 10, borderRadius: "50%", background: T.gold }} />
        {data.tag}
      </div>
    </div>
  );
}

function CoverLayer({ data, height }: { data: ExportData; height: number }) {
  return (
    <div style={{
      display:  "flex",
      position: "absolute",
      top:      0,
      left:     0,
      right:    0,
      height,
      overflow: "hidden",
    }}>
      {/* Real cover image or gradient fallback */}
      {data.coverImageUrl ? (
        <img
          src={data.coverImageUrl}
          style={{
            position:  "absolute",
            top:       0, left: 0, right: 0, bottom: 0,
            width:     "100%",
            height:    "100%",
            objectFit: "cover",
          }}
        />
      ) : (
        <div style={{
          position: "absolute",
          top:      0, left: 0, right: 0, bottom: 0,
          background: coverBg(data),
        }} />
      )}
      {/* Bottom scrim */}
      <div style={{
        position:   "absolute",
        top:        0, left: 0, right: 0, bottom: 0,
        background: "linear-gradient(180deg, rgba(13,10,6,.15) 0%, transparent 35%, transparent 50%, rgba(13,10,6,.82) 100%)",
      }} />
    </div>
  );
}

// ─── Square 1:1 (1080×1080) ──────────────────────────────────────────────────

export function ShareSquare({ data, lang, qrDataUri }: { data: ExportData; lang: "en" | "ar"; qrDataUri: string }) {
  const sans    = exportSans(lang);
  const display = exportDisplay(lang);
  const isAr    = lang === "ar";
  const prompt  = isAr ? "كل التفاصيل والحجز على واتساب" : "Full details + book on WhatsApp";
  const coverH  = 624;

  return (
    <div style={{
      display:   "flex",
      width:     1080,
      height:    1080,
      background: T.bg,
      position:  "relative",
      overflow:  "hidden",
      fontFamily: sans,
      direction:  isAr ? "rtl" : "ltr",
    }}>
      {/* Cover */}
      <CoverLayer data={data} height={coverH} />

      {/* Brand bar (absolute inside cover) */}
      <ExportLogoBar data={data} lang={lang} logoSize={44} />

      {/* Title block — bottom of cover */}
      <div style={{
        position: "absolute",
        left:     44,
        right:    44,
        bottom:   1080 - coverH + 38,  // = 456 + 38 from bottom of image = 494 from bottom
        top:      coverH - 200,         // gives enough vertical space
        display:  "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
      }}>
        <div style={{
          fontFamily:    sans,
          fontSize:      26,
          fontWeight:    600,
          letterSpacing: "2px",
          textTransform: "uppercase" as const,
          color:         "rgba(255,255,255,.92)",
          marginBottom:  14,
          textAlign:     isAr ? "right" : "left",
        }}>
          {data.destination}
        </div>
        <div style={{
          fontFamily:    display,
          fontSize:      72,
          fontWeight:    400,
          color:         "#fff",
          letterSpacing: "-1.5px",
          lineHeight:    1.0,
          textAlign:     isAr ? "right" : "left",
        }}>
          {data.title}
        </div>
      </div>

      {/* Lower panel */}
      <div style={{
        position:  "absolute",
        top:       coverH,
        left:      0,
        right:     0,
        bottom:    0,
        display:   "flex",
        flexDirection: "column",
        paddingTop:   40,
        paddingLeft:  isAr ? 0 : 44,
        paddingRight: isAr ? 44 : 0,
        paddingBottom: 0,
      }}>
        {/* Highlights + price row */}
        <div style={{
          display:       "flex",
          gap:           28,
          alignItems:    "flex-start",
          paddingLeft:   isAr ? 44 : 0,
          paddingRight:  isAr ? 0 : 44,
          flexDirection: isAr ? "row-reverse" : "row",
        }}>
          {/* Highlights list */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
            {data.highlights.map((h, i) => (
              <div key={i} style={{
                display:       "flex",
                alignItems:    "center",
                gap:           14,
                flexDirection: isAr ? "row-reverse" : "row",
              }}>
                <div style={{
                  width:       34,
                  height:      34,
                  borderRadius: "50%",
                  background:  T.goldSoft,
                  color:       T.goldDeep,
                  flexShrink:  0,
                  display:     "flex",
                  alignItems:  "center",
                  justifyContent: "center",
                }}>
                  <CheckIcon size={19} />
                </div>
                <span style={{ fontFamily: sans, fontSize: 27, color: T.ink1, fontWeight: 600, lineHeight: 1.2 }}>
                  {h}
                </span>
              </div>
            ))}
          </div>

          {/* Price block */}
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: isAr ? "flex-start" : "flex-end",
            flexShrink: 0,
          }}>
            {data.was && (
              <div style={{ fontFamily: sans, fontSize: 26, color: T.ink3, textDecoration: "line-through" }}>
                {data.was}
              </div>
            )}
            <div style={{ fontFamily: display, fontSize: 72, fontWeight: 400, color: T.ink1, letterSpacing: "-2px", lineHeight: 0.9 }}>
              {data.price}
            </div>
            <div style={{ fontFamily: sans, fontSize: 21, color: T.ink2, marginTop: 6 }}>
              {data.perPerson}
            </div>
            {data.saving && (
              <div style={{
                display:      "flex",
                alignSelf:    "flex-start",
                marginTop:    12,
                padding:      "5px 14px",
                background:   T.green,
                color:        "#fff",
                borderRadius: 999,
                fontFamily:   sans,
                fontSize:     20,
                fontWeight:   600,
              }}>
                {data.saving}
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* CTA bar */}
        <div style={{
          marginLeft:   isAr ? 0 : -44,
          marginRight:  isAr ? -44 : 0,
          paddingTop:   30,
          paddingBottom: 30,
          paddingLeft:  isAr ? 44 : 44,
          paddingRight: isAr ? 44 : 44,
          background:   T.ink1,
          display:      "flex",
          alignItems:   "center",
          gap:          22,
          flexDirection: isAr ? "row-reverse" : "row",
        }}>
          {/* Real QR code */}
          <img src={qrDataUri} width={108} height={108} style={{ borderRadius: 6, flexShrink: 0 }} />

          {/* WhatsApp call-to-action */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{
              display:       "flex",
              alignItems:    "center",
              gap:           12,
              color:         "#fff",
              flexDirection: isAr ? "row-reverse" : "row",
            }}>
              <div style={{
                width:       40,
                height:      40,
                borderRadius: 10,
                background:  "#25D366",
                display:     "flex",
                alignItems:  "center",
                justifyContent: "center",
                flexShrink:  0,
                color:       "#fff",
              }}>
                <WaIcon size={23} />
              </div>
              <span style={{ fontFamily: sans, fontSize: 30, fontWeight: 600, letterSpacing: "-0.3px" }}>
                {prompt}
              </span>
            </div>
            <div style={{
              fontFamily:   sans,
              fontSize:     20,
              color:        "rgba(255,255,255,.6)",
              marginTop:    10,
              letterSpacing: "-0.2px",
              direction:    "ltr",
              textAlign:    isAr ? "right" : "left",
              marginLeft:   isAr ? 0 : 52,
              marginRight:  isAr ? 52 : 0,
            }}>
              {data.url}
            </div>
          </div>

          {/* Agency */}
          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: isAr ? "flex-start" : "flex-end",
            flexShrink: 0,
          }}>
            {data.agency && (
              <div style={{ fontFamily: display, fontSize: 25, color: "#fff", letterSpacing: "-0.3px" }}>
                {data.agency}
              </div>
            )}
            {data.agencyTag && (
              <div style={{ fontFamily: sans, fontSize: 17, color: "rgba(255,255,255,.55)", marginTop: 3 }}>
                {data.agencyTag}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Vertical 9:16 (1080×1920) ───────────────────────────────────────────────

export function ShareVertical({ data, lang, qrDataUri }: { data: ExportData; lang: "en" | "ar"; qrDataUri: string }) {
  const sans    = exportSans(lang);
  const display = exportDisplay(lang);
  const isAr    = lang === "ar";
  const prompt  = isAr ? "اسحب لأعلى · أو راسلنا على واتساب" : "Full details + book on WhatsApp";
  const coverH  = 1230;

  return (
    <div style={{
      display:   "flex",
      width:     1080,
      height:    1920,
      background: T.bg,
      position:  "relative",
      overflow:  "hidden",
      fontFamily: sans,
      direction:  isAr ? "rtl" : "ltr",
    }}>
      {/* Cover */}
      <CoverLayer data={data} height={coverH} />

      {/* Brand bar */}
      <div style={{
        position:  "absolute",
        top:        64,
        left:       56,
        right:      56,
        display:   "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexDirection: isAr ? "row-reverse" : "row",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexDirection: isAr ? "row-reverse" : "row" }}>
          <div style={{
            width: 52, height: 52, borderRadius: 52 * 0.26,
            background: "rgba(255,255,255,.14)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <LogoMark size={30} />
          </div>
          <div style={{ fontFamily: display, fontSize: 32, color: "#fff", letterSpacing: "-0.3px" }}>
            Packmetrix
          </div>
        </div>
        <div style={{
          padding: "12px 24px", background: "rgba(255,255,255,.16)", borderRadius: 999,
          color: "#fff", fontFamily: sans, fontSize: 28, fontWeight: 600,
          display: "flex", alignItems: "center", gap: 11,
          flexDirection: isAr ? "row-reverse" : "row",
        }}>
          <span style={{ width: 12, height: 12, borderRadius: "50%", background: T.gold }} />
          {data.tag}
        </div>
      </div>

      {/* Title block — bottom of cover. Top is set high so long titles have room upward. */}
      <div style={{
        position: "absolute",
        left:     56,
        right:    56,
        bottom:   1920 - coverH + 70,
        top:      coverH - 500,          // 730px from top → 410px height available
        display:  "flex",
        flexDirection: "column",
        justifyContent: "flex-end",
        overflow: "hidden",              // clamp within the designated area
      }}>
        <div style={{
          fontFamily: sans, fontSize: 30, fontWeight: 600, letterSpacing: "2.5px",
          textTransform: "uppercase" as const, color: "rgba(255,255,255,.92)", marginBottom: 18,
          textAlign: isAr ? "right" : "left",
        }}>
          {data.destination}
        </div>
        <div style={{
          fontFamily: display, fontSize: 88, fontWeight: 400, color: "#fff",
          letterSpacing: "-1.5px", lineHeight: 1.0,
          textAlign: isAr ? "right" : "left",
        }}>
          {data.title}
        </div>
        {data.subtitle && (
          <div style={{
            fontFamily: sans, fontSize: 30, color: "rgba(255,255,255,.85)", marginTop: 18, lineHeight: 1.3,
            textAlign: isAr ? "right" : "left",
          }}>
            {data.subtitle.slice(0, 100)}
          </div>
        )}
      </div>

      {/* Lower panel */}
      <div style={{
        position:  "absolute",
        top:       coverH,
        left:      0,
        right:     0,
        bottom:    0,
        display:   "flex",
        flexDirection: "column",
        paddingTop:    52,
        paddingLeft:   56,
        paddingRight:  56,
        paddingBottom: 0,
      }}>
        {/* Highlights + price */}
        <div style={{
          display:       "flex",
          alignItems:    "flex-end",
          justifyContent: "space-between",
          gap:           28,
          paddingBottom: 36,
          borderBottom:  `2px solid ${T.rule}`,
          flexDirection: isAr ? "row-reverse" : "row",
        }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 18 }}>
            {data.highlights.map((h, i) => (
              <div key={i} style={{
                display: "flex", alignItems: "center", gap: 16,
                flexDirection: isAr ? "row-reverse" : "row",
              }}>
                <div style={{
                  width: 40, height: 40, borderRadius: "50%",
                  background: T.goldSoft, color: T.goldDeep,
                  flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <CheckIcon size={22} />
                </div>
                <span style={{ fontFamily: sans, fontSize: 32, color: T.ink1, fontWeight: 600 }}>{h}</span>
              </div>
            ))}
          </div>

          <div style={{
            display: "flex", flexDirection: "column",
            alignItems: isAr ? "flex-start" : "flex-end",
            flexShrink: 0,
          }}>
            {data.was && (
              <div style={{ fontFamily: sans, fontSize: 30, color: T.ink3, textDecoration: "line-through" }}>
                {data.was}
              </div>
            )}
            <div style={{ fontFamily: display, fontSize: 96, fontWeight: 400, color: T.ink1, letterSpacing: "-2.5px", lineHeight: 0.9 }}>
              {data.price}
            </div>
            <div style={{ fontFamily: sans, fontSize: 26, color: T.ink2, marginTop: 8 }}>
              {data.perPerson}
            </div>
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* CTA bar */}
        <div style={{
          marginLeft:  -56,
          marginRight: -56,
          paddingTop:   44,
          paddingBottom: 56,
          paddingLeft:  56,
          paddingRight: 56,
          background:  T.ink1,
          display:     "flex",
          alignItems:  "center",
          gap:         32,
          flexDirection: isAr ? "row-reverse" : "row",
        }}>
          <img src={qrDataUri} width={168} height={168} style={{ borderRadius: 8, flexShrink: 0 }} />

          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 16, color: "#fff", marginBottom: 16,
              flexDirection: isAr ? "row-reverse" : "row",
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 14, background: "#25D366",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0, color: "#fff",
              }}>
                <WaIcon size={32} />
              </div>
              <span style={{
                fontFamily: sans, fontSize: 38, fontWeight: 600,
                letterSpacing: "-0.5px", lineHeight: 1.05, color: "#fff",
              }}>
                {prompt}
              </span>
            </div>

            <div style={{
              fontFamily: sans, fontSize: 26, color: "rgba(255,255,255,.6)",
              letterSpacing: "-0.2px", direction: "ltr",
              textAlign: isAr ? "right" : "left",
            }}>
              {data.url}
            </div>

            <div style={{
              marginTop: 20, paddingTop: 20,
              borderTop: "1px solid rgba(255,255,255,.14)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              flexDirection: isAr ? "row-reverse" : "row",
            }}>
              {data.agency && (
                <div style={{ fontFamily: display, fontSize: 32, color: "#fff", letterSpacing: "-0.3px" }}>
                  {data.agency}
                </div>
              )}
              {data.agencyTag && (
                <div style={{ fontFamily: sans, fontSize: 22, color: "rgba(255,255,255,.55)" }}>
                  {data.agencyTag}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
