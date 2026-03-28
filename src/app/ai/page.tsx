import type { Metadata } from "next"

import { HubPage } from "@/components/content-ops/hub-page"
import { getHubBySlug, getRelatedContent } from "@/lib/content-ops/data"

export default function AiHubPage() {
  const hub = getHubBySlug("ai")
  if (!hub) return null

  const related = getRelatedContent(hub)

  return (
    <HubPage
      hub={hub}
      spotlight={related.filter((record) => record.pageClass === "Flagship").slice(0, 3)}
      proof={related.filter((record) => record.pageClass.includes("Proof") || record.kind === "dashboard").slice(0, 4)}
      glossary={related.filter((record) => record.kind === "glossary").slice(0, 3)}
    />
  )
}

export const metadata: Metadata = {
  title: "AI hub",
  description: "Flagships, proof, workflows, and concept nodes for AI-native delivery and agentic engineering.",
  alternates: { canonical: "/ai" },
}
