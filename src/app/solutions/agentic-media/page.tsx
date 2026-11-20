import type { Metadata } from "next"

import { site } from "@/lib/site"
import { AgenticMediaWall } from "./agentic-media-wall"

const DESCRIPTION =
  "Twenty-nine finished short-form vertical videos from five agent-built experiments, each kept with its engine, render time, narration and the skill that produced it."

export const metadata: Metadata = {
  title: "Agentic media",
  description: DESCRIPTION,
  alternates: { canonical: "/solutions/agentic-media" },
  openGraph: {
    title: `Agentic media • ${site.name}`,
    description: DESCRIPTION,
    url: `${site.siteUrl}/solutions/agentic-media`,
    type: "website",
  },
}

export default function AgenticMediaPage() {
  return (
    <section
      data-analytics-section="agentic_media"
      data-analytics-item-type="solution"
      data-analytics-item-id="agentic-media"
      data-analytics-item-name="Agentic media"
    >
      <AgenticMediaWall />
    </section>
  )
}