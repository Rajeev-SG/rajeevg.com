import type { Metadata } from "next"

import { HubPage } from "@/components/content-ops/hub-page"
import { getHubBySlug, getRelatedContent } from "@/lib/content-ops/data"

export default function PlaybooksHubPage() {
  const hub = getHubBySlug("playbooks")
  if (!hub) return null

  const related = getRelatedContent(hub)

  return (
    <HubPage
      hub={hub}
      spotlight={related.filter((record) => record.pageClass.includes("Workflow") || record.pageClass.includes("Supporting")).slice(0, 3)}
      proof={related.filter((record) => record.kind === "idea" || record.pageClass.includes("Proof")).slice(0, 4)}
      glossary={related.filter((record) => record.kind === "glossary").slice(0, 3)}
    />
  )
}

export const metadata: Metadata = {
  title: "Playbooks",
  description: "Workflow-first guides, checklists, and derived content opportunities.",
  alternates: { canonical: "/playbooks" },
}
