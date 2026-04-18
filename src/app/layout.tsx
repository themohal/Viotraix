import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Viotraix — AI-Powered Workplace Safety Inspector",
    template: "%s | Viotraix",
  },
  description:
    "Upload workplace photos and get instant AI-powered safety compliance audits. Detect OSHA violations, fire hazards, and compliance issues. Save thousands on professional safety audits.",
  keywords: [
    "workplace safety",
    "OSHA compliance",
    "safety audit",
    "AI safety inspection",
    "workplace compliance",
    "safety violations",
    "fire safety audit",
  ],
  openGraph: {
    title: "Viotraix — AI-Powered Workplace Safety Inspector",
    description:
      "Upload workplace photos and get instant AI-powered safety compliance audits.",
    url: process.env.NEXT_PUBLIC_APP_URL,
    siteName: "Viotraix",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Viotraix — AI-Powered Workplace Safety Inspector",
    description:
      "Upload workplace photos and get instant AI-powered safety compliance audits.",
  },
  robots: {
    index: true,
    follow: true,
  },
  verification: {
    google: "eDw2fWEXVf7ksLhgsc25Dxh4O_h3lT81o7SH6rKQGpQ",
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Viotraix",
  applicationCategory: "BusinessApplication",
  description:
    "AI-powered visual compliance and safety inspection for workplaces",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "4.99",
    highPrice: "79",
    priceCurrency: "USD",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
