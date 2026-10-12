import type { Metadata } from "next"
import GogMarketingLanding from "./landing"

export const metadata: Metadata = {
  title: "gog-marketing — Marketing data without the technical headache",
  description: "A simpler way for marketers to access Google marketing and analytics workflows.",
  alternates: { canonical: "/solutions/gog-marketing" },
}

export default function GogMarketingPage() {
  return <GogMarketingLanding />
}
