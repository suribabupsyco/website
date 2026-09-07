import "./globals.css";
import "@/components/common/OpeningIntro.css";
import { Inter, Manrope } from "next/font/google";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { siteConfig } from "@/config/site";
import { absoluteUrl, serializeJsonLd, SITE_URL, SOCIAL_IMAGE_URL } from "@/lib/seo";
import OpeningIntro from "@/components/common/OpeningIntro";
import ScrollToTop from "@/components/common/ScrollToTop";
import PendingSubmissionRecovery from "@/components/common/PendingSubmissionRecovery";
import logo from "../../logo-green.png";

const inter = Inter({ subsets: ["latin"], variable: "--font-body", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-heading", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${siteConfig.businessName} | Atchutapuram, Anakapalli`,
    template: `%s | ${siteConfig.shortName}`,
  },
  description: siteConfig.seo.description,
  keywords: siteConfig.seo.keywords,
  authors: [{ name: siteConfig.counsellorName }],
  creator: siteConfig.businessName,
  publisher: siteConfig.businessName,
  alternates: { canonical: "/" },
  category: "Counselling and professional services",
  openGraph: {
    type: "website",
    locale: "en_IN",
    siteName: siteConfig.businessName,
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
    url: "/",
    images: [{ url: SOCIAL_IMAGE_URL, width: 1200, height: 630, alt: `${siteConfig.businessName} — professional counselling and guidance` }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.seo.title,
    description: siteConfig.seo.description,
    images: [SOCIAL_IMAGE_URL],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#173f45",
  colorScheme: "light",
};

const jsonLdSite = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: siteConfig.shortName,
      alternateName: siteConfig.businessName,
      description: siteConfig.seo.description,
      inLanguage: "en-IN",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
    {
      "@type": ["LocalBusiness", "ProfessionalService"],
      "@id": `${SITE_URL}/#organization`,
      name: siteConfig.businessName,
      alternateName: siteConfig.extendedBusinessName,
      description: siteConfig.seo.description,
      url: SITE_URL,
      logo: { "@type": "ImageObject", url: absoluteUrl(logo.src), width: logo.width, height: logo.height },
      image: absoluteUrl(logo.src),
      telephone: siteConfig.phone,
      email: siteConfig.email,
      hasMap: siteConfig.googleMapsUrl,
      address: {
        "@type": "PostalAddress",
        streetAddress: "D/No: 4-12, Satya Sadhan, Thimmarajupeta Village and Post",
        addressLocality: "Atchutapuram",
        addressRegion: "Andhra Pradesh",
        postalCode: "531033",
        addressCountry: "IN",
      },
      geo: { "@type": "GeoCoordinates", latitude: 17.6769227, longitude: 83.34477 },
      areaServed: ["Atchutapuram", "Anakapalli", "Visakhapatnam"],
      availableLanguage: siteConfig.languages,
      openingHoursSpecification: [
        { "@type": "OpeningHoursSpecification", dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"], opens: "18:00", closes: "21:00" },
        { "@type": "OpeningHoursSpecification", dayOfWeek: "Sunday", opens: "10:00", closes: "17:00" },
      ],
    },
    {
      "@type": "Person",
      "@id": `${SITE_URL}/#counsellor`,
      name: siteConfig.counsellorName,
      image: absoluteUrl("/suri-babu-saragadam.jpeg"),
      jobTitle: "Counselling Psychologist",
      knowsLanguage: siteConfig.languages,
      worksFor: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en-IN" className={`${inter.variable} ${manrope.variable}`}>
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLdSite) }} />
      </head>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <ScrollToTop />
        <PendingSubmissionRecovery />
        <OpeningIntro />
        {children}
      </body>
    </html>
  );
}
