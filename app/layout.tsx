import type { Metadata } from "next";
import { Archivo_Black, IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const plexSans = IBM_Plex_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const archivoBlack = Archivo_Black({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Yaphet Lemiesa — Working Drawing",
  description:
    "Hardware, AI, and robotics work, drawn straight from the GitHub source.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // suppressHydrationWarning: browser extensions (e.g. Liner) inject
    // attributes onto <html>/<body> before React hydrates, which otherwise
    // trips a hydration mismatch. This suppresses only attribute-level noise on
    // these two elements, not real mismatches inside the app.
    <html
      lang="en"
      className={`${plexMono.variable} ${plexSans.variable} ${archivoBlack.variable}`}
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
