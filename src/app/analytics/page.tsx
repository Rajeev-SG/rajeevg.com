import type { Metadata } from "next"

import { WritingCollection } from "@/components/writing-collection"

export default function AnalyticsPage() {
  return (
    <WritingCollection
      eyebrow="Analytics"
      title="Measurement that reflects the real system"
      description="Writing about consent, GA4, data quality, reporting, and the gaps between browser-visible activity and the records a business actually relies on."
      matchingTags={["analytics", "ga4", "measurement", "consent", "bigquery", "gtm", "privacy"]}
    />
  )
}

export const metadata: Metadata = {
  title: "Analytics writing",
  description: "Writing by Rajeev Gill about analytics, consent, GA4, reporting, and measurement quality.",
  alternates: { canonical: "/analytics" },
}
