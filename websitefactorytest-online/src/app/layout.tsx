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
import { getSettings } from "@/lib/site";
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

export async function generateMetadata(): Promise<Metadata> {
  const publicBaseUrl = getPublicBaseUrl();
  const settings = getSettings();

  const siteName = settings.site_name || process.env.SITE_NAME || "";
  const metaTitle = settings.meta_title || siteName;
  const metaDesc = settings.meta_description;

  return {
    metadataBase: new URL(publicBaseUrl),
    title: metaTitle || { default: siteName || "Website", template: `%s | ${siteName || "Website"}` },
    description: metaDesc || undefined,
    icons: {
      icon: settings.favicon || "/seo/favicon.png",
      apple: settings.favicon || "/seo/favicon.png",
    },
    twitter: {
      card: "summary_large_image",
    },
    openGraph: {
      title: metaTitle || siteName || "Website",
      description: metaDesc || undefined,
      url: publicBaseUrl,
      siteName: siteName || undefined,
      locale: "en_US",
      type: "website",
      images: settings.og_image ? [{ url: settings.og_image }] : [],
    },
  };
}

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
