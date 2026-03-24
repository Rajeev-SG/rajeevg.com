import type { Metadata } from "next"

import { SiteAnalyticsDashboard } from "@/components/site-analytics-dashboard"
import { getGa4SiteAnalyticsDashboard } from "@/lib/ga4-site-reporting"
import { site } from "@/lib/site"

export const runtime = "nodejs"

export default async function SiteAnalyticsPage() {
  const report = await getGa4SiteAnalyticsDashboard()

  return <SiteAnalyticsDashboard report={report} />
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "GA4 content analytics",
    description:
      "A custom GA4 reporting route for rajeevg.com, with the site’s promoted schema and content performance surfaced directly in the UI.",
    alternates: { canonical: "/projects/site-analytics" },
    openGraph: {
      title: `GA4 content analytics • ${site.name}`,
      description:
        "A filtered main-site reporting layer for rajeevg.com, built on the GA4 Data API and tailored to the site’s custom event schema.",
      url: `${site.siteUrl}/projects/site-analytics`,
    },
  }
}
