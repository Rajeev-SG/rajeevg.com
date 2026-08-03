import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { site } from "@/lib/site";
import { AnalyticsDataLayer } from "@/components/analytics-data-layer";
import { ConsentManager } from "@/components/consent-manager";
import { TagManagerScript } from "@/components/tag-manager-script";
import { SiteChrome } from "@/components/site-chrome";
import Script from "next/script";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const SITE_URL = site.siteUrl;

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: site.name,
    template: `%s • ${site.name}`,
  },
  description: site.description,
  openGraph: {
    title: site.name,
    description: site.description,
    url: SITE_URL,
    siteName: site.name,
    images: [{ url: site.defaultOgImage }],
    locale: "en",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: site.name,
    description: site.description,
    images: [site.defaultOgImage],
  },
};

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID;
const CLERK_ENABLED = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
);

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const appShell = (
    <>
      {GTM_ID ? <TagManagerScript gtmId={GTM_ID} /> : null}
      <ThemeProvider>
        <SiteChrome>{children}</SiteChrome>
      </ThemeProvider>
      <AnalyticsDataLayer />
      <ConsentManager />
    </>
  )

  return (
    <html lang="en" suppressHydrationWarning>
      <Script id="google-consent-default" strategy="beforeInteractive">
        {`
          window.dataLayer = window.dataLayer || [];
          window.gtag = function gtag(){window.dataLayer.push(arguments);}
          document.documentElement.dataset.analyticsConsent = 'denied';
          window.gtag('consent', 'default', {
            ad_storage: 'denied',
            analytics_storage: 'denied',
            ad_user_data: 'denied',
            ad_personalization: 'denied',
            functionality_storage: 'granted',
            security_storage: 'granted',
            wait_for_update: 500
          });
        `}
      </Script>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {CLERK_ENABLED ? <ClerkProvider>{appShell}</ClerkProvider> : appShell}
      </body>
    </html>
  );
}
