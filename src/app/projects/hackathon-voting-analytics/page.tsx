import type { Metadata } from "next"

import { HackathonAnalyticsDashboard } from "@/components/hackathon-analytics-dashboard"
import { getHackathonAnalyticsDataset } from "@/lib/hackathon-reporting"
import { getDummyHackathonAnalyticsDataset } from "@/lib/hackathon-reporting-dummy"
import { site } from "@/lib/site"

export const runtime = "nodejs"

export default async function HackathonVotingAnalyticsPage() {
  const [live, dummy] = await Promise.all([
    getHackathonAnalyticsDataset(),
    Promise.resolve(getDummyHackathonAnalyticsDataset()),
  ])

  return <HackathonAnalyticsDashboard live={live} dummy={dummy} />
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Hackathon voting analytics",
    description:
      "An advanced analytics dashboard for the hackathon voting app, with live BigQuery-backed reporting and a dummy-preview shell.",
    alternates: { canonical: "/projects/hackathon-voting-analytics" },
    openGraph: {
      title: `Hackathon voting analytics • ${site.name}`,
      description:
        "A reporting route for the hackathon voting app, designed to replace the weak Looker Studio artifact with a richer public dashboard.",
      url: `${site.siteUrl}/projects/hackathon-voting-analytics`,
    },
  }
}
