import type { Metadata, Viewport } from "next";
import { Archivo, STIX_Two_Text } from "next/font/google";
import "./globals.css";

// Two voices: STIX Two Text, the face scientific publishing set itself in,
// for everything that is read; Archivo for the bar, lists and small print.
const stix = STIX_Two_Text({
  variable: "--font-stix",
  subsets: ["latin"],
  style: ["normal", "italic"],
  display: "swap",
});

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Yaphet Lemiesa",
  description:
    "Research and systems by Yaphet Lemiesa, MIT EECS: cyber risk on small data, retrieval over knowledge graphs, memory-bound inference and agent evaluation. Ask it a question.",
};

export const viewport: Viewport = {
  themeColor: "#f7f7f5",
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
    <html lang="en" className={`${stix.variable} ${archivo.variable}`} suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
