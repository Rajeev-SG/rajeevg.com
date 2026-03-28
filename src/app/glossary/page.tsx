import type { Metadata } from "next"

import { ContentLinkCard } from "@/components/content-ops/content-link-card"
import { getGlossaryRoutes } from "@/lib/content-ops/data"

export default function GlossaryIndexPage() {
  const glossary = getGlossaryRoutes()

  return (
    <section className="space-y-8">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Glossary</p>
        <h1 className="text-4xl font-semibold tracking-tight">Concept nodes that anchor the content graph</h1>
        <p className="max-w-3xl text-muted-foreground">
          These are the bounded, high-signal concept pages that support the flagship essays and proof assets without turning the site into a thin glossary factory.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {glossary.map((record) => (
          <ContentLinkCard key={record.id} record={record} />
        ))}
      </div>
    </section>
  )
}

export const metadata: Metadata = {
  title: "Glossary",
  description: "Bounded concept pages for the core AI and analytics terms used across rajeevg.com.",
  alternates: { canonical: "/glossary" },
}
