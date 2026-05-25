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
  IBM_Plex_Mono,
  IBM_Plex_Sans,
  Source_Serif_4,
} from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const dmSerif = DM_Serif_Display({
  variable: "--font-dm-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

const archivoblack = Archivo_Black({
  variable: "--font-archivo-black",
  subsets: ["latin"],
  weight: "400",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
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
});

const ibmPlexMono = IBM_Plex_Mono({
  variable: "--font-ibm-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const sourceSerif = Source_Serif_4({
  variable: "--font-source-serif",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "PackMetrix — Travel Package Intelligence",
  description:
    "Turn travel packages into high-converting landing pages in seconds. Paste any description, itinerary, or WhatsApp message — AI extracts, structures, and publishes.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${dmSans.variable} ${dmSerif.variable} ${cormorant.variable} ${instrumentSerif.variable} ${archivoblack.variable} ${jetbrainsMono.variable} ${interTight.variable} ${spaceGrotesk.variable} ${ibmPlexMono.variable} ${ibmPlexSans.variable} ${sourceSerif.variable} h-full`}
      style={{ fontFamily: "var(--font-dm-sans), 'DM Sans', sans-serif" }}
    >
      <body className="h-full" style={{ fontFamily: "inherit" }}>
        {children}
      </body>
    </html>
  );
}
