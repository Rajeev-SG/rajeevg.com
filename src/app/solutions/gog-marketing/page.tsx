import type { Metadata } from "next"
import GogMarketingLanding from "./landing"

export const metadata: Metadata = {
  title: "gog-marketing | Put your Google marketing tools to work",
  description: "Connect Google marketing tools to your agents and choose the accounts, resources and tasks they can use. Explore gog-marketing and its private pilot.",
  alternates: { canonical: "/solutions/gog-marketing" },
}

export default function GogMarketingPage() {
  return <GogMarketingLanding />
}
