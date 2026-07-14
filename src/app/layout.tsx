import type { Metadata } from "next";
import { Albert_Sans } from "next/font/google";
import "./globals.css";

const albertSans = Albert_Sans({
  variable: "--font-albert-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Home | Solidhydrogen",
  description:
    "SOLIDHYDROGEN specialises in hydrides functioning at ambient temperatures for real life hydrogen storage applications.",
  icons: {
    icon: "/seo/favicon-192.png",
    apple: "/seo/favicon-192.png",
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
      className={`${albertSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-[#05203C]">{children}</body>
    </html>
  );
}
