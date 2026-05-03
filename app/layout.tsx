import type { Metadata, Viewport } from "next";
import { Fraunces, Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
  axes: ["opsz", "SOFT"]
});

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
  display: "swap"
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hurricane-atlas.vercel.app"),
  title: {
    default: "Hurricane Atlas — North Atlantic, 1953 to present",
    template: "%s · Hurricane Atlas"
  },
  description:
    "An interactive editorial atlas of every named North Atlantic hurricane from 1953 to today. Built on the NOAA HURDAT2 best-track record.",
  openGraph: {
    title: "Hurricane Atlas — North Atlantic, 1953 to present",
    description:
      "Every named North Atlantic hurricane since 1953, mapped, ranked, narrated.",
    type: "website"
  },
  robots: { index: true, follow: true }
};

export const viewport: Viewport = {
  themeColor: "#fdfdfb",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${geist.variable} ${jetbrains.variable}`}
      data-theme="paper"
    >
      <body className="min-h-screen bg-paper text-ink antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-paper focus:px-3 focus:py-1 focus:font-mono focus:text-xs focus:text-ink"
        >
          Skip to content
        </a>
        <div className="paper-noise" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
