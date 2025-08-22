import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { GA } from "@/components/ga";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Suspense } from "react";
import { site } from "@/lib/site";
import { ThemeToggle } from "@/components/theme-toggle";

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

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
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
        {GA_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}', { send_page_view: false });
              `}
            </Script>
            <Suspense fallback={null}>
              <GA id={GA_ID} />
            </Suspense>
          </>
        ) : null}
      </body>
    </html>
  );
}
