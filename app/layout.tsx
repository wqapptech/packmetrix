import type { Metadata } from "next";
import {
  DM_Sans,
  DM_Serif_Display,
  Cormorant_Garamond,
  Instrument_Serif,
  Archivo_Black,
  JetBrains_Mono,
  Inter_Tight,
  Space_Grotesk,
  Inter,
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  IBM_Plex_Sans_Arabic,
  Source_Serif_4,
  Newsreader,
  Noto_Naskh_Arabic,
  Tajawal,
  Mulish,
  Amiri,
  Noto_Sans_Arabic,
  Manrope,
  Cairo,
  Playfair_Display,
  Nunito_Sans,
  Markazi_Text,
  Space_Mono,
  Jost,
  Mukta,
  Archivo,
  Barlow,
  Bricolage_Grotesque,
  Hanken_Grotesk,
  Quicksand,
  Baloo_Bhaijaan_2,
} from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  preload: false,
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  preload: false,
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  preload: false,
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  preload: false,
});

const archivoblack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: "400",
  preload: false,
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  preload: false,
});

const interTight = Inter_Tight({
  variable: "--font-inter-tight",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  preload: false,
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  preload: false,
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  preload: false,
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  preload: false,
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
  preload: false,
});

const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  variable: "--font-ibm-plex-sans-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
});

const notoNaskhArabic = Noto_Naskh_Arabic({
  variable: "--font-noto-naskh-arabic",
  subsets: ["arabic"],
  weight: ["400", "700"],
  preload: false,
});

const tajawal = Tajawal({
  variable: "--font-tajawal",
  subsets: ["arabic"],
  weight: ["400", "500", "700"],
  preload: false,
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
  preload: false,
});

// ── V2 template families (Batch 1: Aurora) ──
const mulish = Mulish({
  variable: "--font-mulish",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  preload: false,
});

const amiri = Amiri({
  variable: "--font-amiri",
  subsets: ["arabic"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  preload: false,
});

const notoSansArabic = Noto_Sans_Arabic({
  variable: "--font-noto-sans-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700", "800"],
  preload: false,
});

// ── V2 template families (Batch 1: Voyage) ──
const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  preload: false,
});

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  preload: false,
});

// ── V2 template families (Batch 1: Petal) ──
const playfair = Playfair_Display({
  variable: "--font-playfair",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  preload: false,
});

const nunitoSans = Nunito_Sans({
  variable: "--font-nunito-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  preload: false,
});

const markaziText = Markazi_Text({
  variable: "--font-markazi",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});

// ── V2 template families (Batch 2: Smart) ──
const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  preload: false,
});

// ── V2 template families (Batch 3: Sakina, Compass) ──
const jost = Jost({
  variable: "--font-jost",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  preload: false,
});

const mukta = Mukta({
  variable: "--font-mukta",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
  preload: false,
});

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  preload: false,
});

// ── V2 template families (Batch 4: Tribe, Family) ──
const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  preload: false,
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  style: ["normal", "italic"],
  preload: false,
});

const quicksand = Quicksand({
  variable: "--font-quicksand",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  preload: false,
});

const balooBhaijaan = Baloo_Bhaijaan_2({
  variable: "--font-baloo",
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  preload: false,
});

export const metadata: Metadata = {
  title: "PackMetrix — Travel Package Intelligence",
  description:
    "How travel agencies present and sell their packages — beautifully, on their own brand, wherever their customers are. AI-powered pages, lead tracking, and 10 stunning templates.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmSerif.variable} ${cormorant.variable} ${instrumentSerif.variable} ${archivoblack.variable} ${jetbrainsMono.variable} ${interTight.variable} ${spaceGrotesk.variable} ${inter.variable} ${ibmPlexMono.variable} ${ibmPlexSans.variable} ${sourceSerif.variable} ${ibmPlexSansArabic.variable} ${notoNaskhArabic.variable} ${tajawal.variable} ${newsreader.variable} ${mulish.variable} ${amiri.variable} ${notoSansArabic.variable} ${manrope.variable} ${cairo.variable} ${playfair.variable} ${nunitoSans.variable} ${markaziText.variable} ${spaceMono.variable} ${jost.variable} ${mukta.variable} ${archivo.variable} ${barlow.variable} ${bricolage.variable} ${hanken.variable} ${quicksand.variable} ${balooBhaijaan.variable} h-full`}
      style={{ fontFamily: "var(--font-inter-tight), 'Inter Tight', system-ui, sans-serif" }}
    >
      <body className="h-full" style={{ fontFamily: "inherit" }}>
        {children}
      </body>
    </html>
  );
}
