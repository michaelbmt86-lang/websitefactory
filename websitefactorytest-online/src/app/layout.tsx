// ============================================================================
// ROOT LAYOUT (Website Factory Framework)
//
// Patterns:
//   - metadataBase: Required for OG images and sitemap/robots URLs
//   - Must match the production domain (used by sitemap.ts, robots.ts)
//   - Fonts: Montserrat (headings) + Inter (body) via next/font/google
//   - twitter.card: "summary_large_image" for social sharing
// ============================================================================

import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import { getPublicBaseUrl } from "@/lib/public-url";
import "./globals.css";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const publicBaseUrl = getPublicBaseUrl();

export const metadata: Metadata = {
  metadataBase: new URL(publicBaseUrl),
  title: "Market Leaders in Sustainable Packaging | BioPak Australia",
  description:
    "Award-winning plant-based compostable packaging that puts the planet first. We design food service and catering packaging for the circular economy.",
  icons: {
    icon: "/seo/favicon.png",
    apple: "/seo/favicon.png",
  },
  twitter: {
    card: "summary_large_image",
  },
  openGraph: {
    title: "Market Leaders in Sustainable Packaging | BioPak Australia",
    description:
      "Award-winning plant-based compostable packaging that puts the planet first.",
    url: publicBaseUrl,
    siteName: "BioPak Australia",
    locale: "en_AU",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${montserrat.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-gray-900">
        {children}
      </body>
    </html>
  );
}
