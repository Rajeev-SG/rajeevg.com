import type { Metadata } from "next"

import { HubPage } from "@/components/content-ops/hub-page"
import { getHubBySlug, getRelatedContent } from "@/lib/content-ops/data"

export default function ProofHubPage() {
  const hub = getHubBySlug("proof")
  if (!hub) return null

  const related = getRelatedContent(hub)

  return (
    <HubPage
      hub={hub}
      spotlight={related.filter((record) => record.pageClass.includes("Proof")).slice(0, 3)}
      proof={related.filter((record) => record.kind === "dashboard" || record.kind === "project").slice(0, 4)}
      glossary={related.filter((record) => record.kind === "glossary").slice(0, 3)}
    />
  )
}

export const metadata: Metadata = {
  title: "Proof",
  description: "Shipped systems, case studies, analytics dashboards, and proof-backed project writing.",
  alternates: { canonical: "/proof" },
}
