// Font loading for satori / next/og rendering.
// ArrayBuffers are cached at module scope so warm Cloud Run instances pay the
// fetch cost only once (first request after cold start).

export type ExportFonts = {
  interReg:     ArrayBuffer;
  interSemi:    ArrayBuffer;
  instSerif:    ArrayBuffer;
  ibmSansArReg: ArrayBuffer;
  ibmSansArSemi:ArrayBuffer;
};

let _cache: Promise<ExportFonts> | null = null;

async function fetchGoogleFont(family: string, weight: number): Promise<ArrayBuffer> {
  const css = await fetch(
    `https://fonts.googleapis.com/css2?family=${encodeURIComponent(family)}:wght@${weight}&display=swap`,
    { headers: { "User-Agent": "Mozilla/5.0" } },
  ).then((r) => r.text());

  // Extract the first woff2/ttf URL from the @font-face block
  const match = css.match(/src:\s*url\(([^)]+\.(?:woff2|ttf))\)/);
  if (!match) throw new Error(`Font URL not found for ${family}:${weight}`);

  return fetch(match[1]).then((r) => r.arrayBuffer());
}

function loadAll(): Promise<ExportFonts> {
  return Promise.all([
    fetchGoogleFont("Inter", 400),
    fetchGoogleFont("Inter", 600),
    fetchGoogleFont("Instrument Serif", 400),
    fetchGoogleFont("IBM Plex Sans Arabic", 400),
    fetchGoogleFont("IBM Plex Sans Arabic", 600),
    // Noto Naskh Arabic omitted: its GSUB lookup type 5 format 3 tables crash
    // satori's OpenType parser. IBM Plex Sans Arabic handles both sans and display.
  ]).then(([interReg, interSemi, instSerif, ibmSansArReg, ibmSansArSemi]) => ({
    interReg,
    interSemi,
    instSerif,
    ibmSansArReg,
    ibmSansArSemi,
  }));
}

export function getExportFonts(): Promise<ExportFonts> {
  if (!_cache) _cache = loadAll();
  return _cache;
}

type Weight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

export function buildFontList(fonts: ExportFonts, lang: "en" | "ar") {
  // IBM Plex Sans Arabic is included in all renders as a fallback so that
  // Arabic characters in any field (e.g. destination stored as Arabic) don't
  // trigger satori's unsupported GSUB lookup crash when the primary EN fonts
  // (Instrument Serif) are processed for Arabic codepoints.
  const base: { name: string; data: ArrayBuffer; weight: Weight; style: "normal" | "italic" }[] = [
    { name: "Inter",                data: fonts.interReg,     weight: 400, style: "normal" },
    { name: "Inter",                data: fonts.interSemi,    weight: 600, style: "normal" },
    { name: "Instrument Serif",     data: fonts.instSerif,    weight: 400, style: "normal" },
    { name: "IBM Plex Sans Arabic", data: fonts.ibmSansArReg,  weight: 400, style: "normal" },
    { name: "IBM Plex Sans Arabic", data: fonts.ibmSansArSemi, weight: 600, style: "normal" },
  ];
  return base;
}
