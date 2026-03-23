import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { site } from "@/lib/site";
import { ThemeToggle } from "@/components/theme-toggle";
import { AnalyticsDataLayer } from "@/components/analytics-data-layer";
import { ConsentManager } from "@/components/consent-manager";
import { TagManagerScript } from "@/components/tag-manager-script";
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
const GTM_SCRIPT_ORIGIN =
  process.env.NEXT_PUBLIC_GTM_SCRIPT_ORIGIN || "https://www.googletagmanager.com";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
        {GTM_ID ? <TagManagerScript gtmId={GTM_ID} scriptOrigin={GTM_SCRIPT_ORIGIN} /> : null}
        <ThemeProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="border-b border-border bg-background sticky top-0 z-30">
                <div className="mx-auto xl:mx-0 xl:mr-auto w-full max-w-screen-lg px-4 sm:px-6 md:px-8">
                  <div className="flex h-12 items-center gap-2">
                    <SidebarTrigger />
                    <div className="ml-auto">
                      <ThemeToggle />
                    </div>
                  </div>
                </div>
              </header>
              <main className="min-w-0">
                <div className="mx-auto xl:mx-0 xl:mr-auto w-full max-w-screen-lg px-4 sm:px-6 md:px-8">
                  <div className="py-8 md:py-10">{children}</div>
                </div>
              </main>
            </SidebarInset>
          </SidebarProvider>
        </ThemeProvider>
        <AnalyticsDataLayer />
        <ConsentManager />
      </body>
    </html>
  );
}
