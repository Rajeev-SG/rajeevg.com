import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { ContentLinkCard } from "@/components/content-ops/content-link-card"
import { Badge } from "@/components/ui/badge"
import { getGlossaryBySlug, getRelatedContent } from "@/lib/content-ops/data"

export default async function GlossaryDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const glossary = getGlossaryBySlug(slug)
  if (!glossary) return notFound()

  const related = getRelatedContent(glossary)

  return (
    <section className="space-y-8">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{glossary.pageClass}</Badge>
          <Badge variant="outline">{glossary.pillar}</Badge>
        </div>
        <div className="space-y-3">
          <h1 className="text-4xl font-semibold tracking-tight">{glossary.title}</h1>
          <p className="max-w-3xl text-lg text-muted-foreground">{glossary.notes}</p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4 rounded-2xl border p-6">
          <h2 className="text-2xl font-semibold tracking-tight">Why this concept matters operationally</h2>
          <p className="text-muted-foreground">{glossary.differentiationAngle}</p>
          <p className="text-muted-foreground">{glossary.evidence}</p>
        </div>
        <div className="space-y-4 rounded-2xl border p-6">
          <h2 className="text-2xl font-semibold tracking-tight">Use it to navigate</h2>
          <div className="flex flex-wrap gap-2">
            {glossary.nextSteps.map((step) => (
              <Badge key={step} variant="outline">
                {step}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Related pages</p>
          <h2 className="text-2xl font-semibold tracking-tight">Where to go next</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {related.slice(0, 3).map((record) => (
            <ContentLinkCard key={record.id} record={record} />
          ))}
        </div>
      </section>
    </section>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const glossary = getGlossaryBySlug(slug)
  if (!glossary) return {}

  return {
    title: glossary.title,
    description: glossary.notes,
    alternates: { canonical: glossary.url },
  }
}
