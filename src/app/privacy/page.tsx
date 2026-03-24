import type { Metadata } from "next"
import Link from "next/link"

import { ConsentPreferencesButton } from "@/components/consent-preferences-button"
import { Card, CardContent } from "@/components/ui/card"
import { site } from "@/lib/site"

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} handles analytics, consent, and site data.`,
  alternates: { canonical: "/privacy" },
}

export default function PrivacyPage() {
  return (
    <section
      className="space-y-8"
      data-analytics-section="privacy_policy"
      data-analytics-item-type="page_section"
      data-analytics-page-context="primary"
      data-analytics-page-content-group="legal"
      data-analytics-page-content-type="privacy_policy"
    >
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Privacy</p>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy policy</h1>
        <p className="max-w-2xl text-base text-muted-foreground sm:text-lg">
          This site uses consented analytics to understand what people read and interact with.
          Advertising-related consent stays denied, and analytics storage only turns on after you
          explicitly allow it.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <ConsentPreferencesButton
          label="Open privacy settings"
          variant="outline"
          size="sm"
        />
        <Link
          href="mailto:rajeev.sgill@gmail.com"
          className="underline underline-offset-4 transition-colors hover:text-foreground"
          data-analytics-event="contact_click"
          data-analytics-section="privacy_policy"
          data-analytics-item-type="email_link"
          data-analytics-item-name="Privacy contact"
        >
          Contact: rajeev.sgill@gmail.com
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-border/70 bg-card/60">
          <CardContent className="space-y-3 p-6">
            <h2 className="text-lg font-semibold">What gets collected</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>page views, referrers, device and viewport context</li>
              <li>site interactions like navigation clicks, searches, tag filters, and scroll depth</li>
              <li>consent state changes so measurement reflects your preference</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-border/70 bg-card/60">
          <CardContent className="space-y-3 p-6">
            <h2 className="text-lg font-semibold">What does not happen</h2>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>advertising consent is not enabled through this site</li>
              <li>analytics storage is not granted until you opt in</li>
              <li>there is no sale of visitor data through this site</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-5 text-sm leading-7 text-muted-foreground">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">1. Data controller</h2>
          <p>
            Rajeev Gill operates this website at <Link href={site.siteUrl} className="underline underline-offset-4">{site.siteUrl.replace(/^https?:\/\//, "")}</Link>.
            For privacy questions, requests, or corrections, use{" "}
            <Link href="mailto:rajeev.sgill@gmail.com" className="underline underline-offset-4">
              rajeev.sgill@gmail.com
            </Link>.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">2. Legal basis</h2>
          <p>
            Essential site operation and security use necessary storage. Analytics measurement is
            based on consent. If you decline analytics, the site keeps analytics storage denied.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">3. Analytics stack</h2>
          <p>
            This site uses Google Tag Manager, Google Analytics 4, a server-side GTM endpoint, and
            Vercel-hosted infrastructure to collect consented interaction data. Reporting and
            warehouse analysis may also flow through Google Cloud services including BigQuery and
            Looker Studio.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">4. Cookies and local storage</h2>
          <p>
            The site stores your consent preference locally so it can respect your choice on future
            visits. If you grant analytics, Google Analytics cookies may be set. If you deny
            analytics, analytics storage remains denied.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">5. Third-party processors</h2>
          <p>
            Depending on your consent choice, data may be processed by Google and Vercel as service
            providers for analytics delivery, infrastructure, and site operations.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">6. Your choices</h2>
          <p>
            You can reopen privacy settings at any time from the site chrome or footer and switch
            between necessary-only and analytics-enabled measurement. You can also clear relevant
            cookies and local storage in your browser.
          </p>
        </div>

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">7. Policy updates</h2>
          <p>
            This policy may be updated when the site’s analytics, hosting, or data handling changes.
            Material updates should be reflected on this page.
          </p>
        </div>
      </div>

      <p className="text-xs leading-6 text-muted-foreground">
        This page is a practical site privacy policy, not legal advice. If you need a jurisdiction-specific compliance review, use qualified legal counsel.
      </p>
    </section>
  )
}
