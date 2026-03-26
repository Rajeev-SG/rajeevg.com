import type { Metadata } from "next"

import { HackathonGa4Dashboard } from "@/components/hackathon-ga4-dashboard"
import { getDummyHackathonGa4Report, getHackathonGa4Report } from "@/lib/hackathon-ga4-reporting"
import { site } from "@/lib/site"

export const runtime = "nodejs"

export default async function HackathonVotingGa4Page() {
  const [live, dummy] = await Promise.all([
    getHackathonGa4Report(),
    Promise.resolve(getDummyHackathonGa4Report()),
  ])

  return <HackathonGa4Dashboard live={live} dummy={dummy} />
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Hackathon GA4 reporting",
    description:
      "A direct GA4 dashboard for the hackathon voting app, filtered to vote.rajeevg.com and focused on telemetry quality for the live event day.",
    alternates: { canonical: "/projects/hackathon-voting-analytics/google-analytics" },
    openGraph: {
      title: `Hackathon GA4 reporting • ${site.name}`,
      description:
        "A Google Analytics Data API surface for the hackathon voting app, focused on consent impact, telemetry quality, and event-day behavior.",
      url: `${site.siteUrl}/projects/hackathon-voting-analytics/google-analytics`,
    },
  }
}
