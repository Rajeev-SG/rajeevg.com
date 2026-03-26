import type { Metadata } from "next"

import { HackathonAnalyticsDashboard } from "@/components/hackathon-analytics-dashboard"
import { getHackathonBigQueryStatus } from "@/lib/hackathon-bigquery-status"
import { getHackathonAnalyticsDataset } from "@/lib/hackathon-reporting"
import { getDummyHackathonAnalyticsDataset } from "@/lib/hackathon-reporting-dummy"
import { site } from "@/lib/site"

export const runtime = "nodejs"

export default async function HackathonVotingAnalyticsPage() {
  const [live, dummy, status] = await Promise.all([
    getHackathonAnalyticsDataset(),
    Promise.resolve(getDummyHackathonAnalyticsDataset()),
    getHackathonBigQueryStatus(),
  ])

  return <HackathonAnalyticsDashboard live={live} dummy={dummy} status={status} />
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Hackathon voting analytics",
    description:
      "A BigQuery warehouse dashboard for the hackathon voting app, with live warehouse-status proof and a modeled preview shell.",
    alternates: { canonical: "/projects/hackathon-voting-analytics" },
    openGraph: {
      title: `Hackathon voting analytics • ${site.name}`,
      description:
        "A warehouse-first reporting route for the hackathon voting app, focused on BigQuery evidence and modeled event-day analysis.",
      url: `${site.siteUrl}/projects/hackathon-voting-analytics`,
    },
  }
}
