import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Github } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getPortfolioProject } from "@/lib/portfolio-projects"
import { site } from "@/lib/site"

const EARLIER_SLUGS = [
  { slug: "workflow-garden", lesson: "Education content needs maintenance ownership, not just publishing." },
  { slug: "github-canvas-monitor", lesson: "Dashboards only work when they lead to a decision, not just a view." },
  { slug: "proof-pack", lesson: "Provenance needs a permanent home; it cannot live in a chat transcript." },
  { slug: "choice-compass", lesson: "Simplicity beats feature count, but a simple tool still needs a real job." },
  { slug: "mark-notes", lesson: "Local-first is a real product constraint, not a marketing word." },
  { slug: "singulyr-pact", lesson: "Prototype-to-production is a gap that scope discipline has to close." },
  { slug: "openreview", lesson: "Attributed forks still ship; adapting maintained OSS beats rebuilding it." },
  { slug: "singulyr", lesson: "A launch site can be real product infrastructure, not just a landing page." },
  { slug: "rajeevg-com", lesson: "This site itself is a living product; every article is a maintained asset." },
] as const

export const revalidate = 3600

export default function EarlierProductsPage() {
  const items = EARLIER_SLUGS
    .map((entry) => ({ entry, project: getPortfolioProject(entry.slug) }))
    .filter((x): x is { entry: typeof EARLIER_SLUGS[number]; project: NonNullable<ReturnType<typeof getPortfolioProject>> } => Boolean(x.project))

  return (
    <article className="space-y-12" data-analytics-section="earlier_products" data-analytics-item-type="narrative">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Earlier products &amp; experiments</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">What was tried, what each taught, and what survived</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Not every experiment becomes a capability. These nine are kept visible on purpose: each one taught something specific that now shows up in the current solutions — proof discipline, governance thinking, local-first constraints, and scope honesty. None were deleted; each was either promoted or filed here with its lesson.
        </p>
        <figure className="overflow-hidden rounded-2xl border bg-card shadow-sm">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/images/articles-2026-08/earlier-products-lessons.svg" alt="Diagram grouping nine earlier products by the lesson each one taught and what survived into current work" className="w-full bg-background object-contain" loading="lazy" decoding="async" />
          <figcaption className="border-t bg-card px-4 py-3 text-sm leading-6 text-muted-foreground">
            Each earlier product mapped to its lesson. <a className="font-medium underline underline-offset-4" href="/downloads/earlier-products-lessons.excalidraw">Download the editable Excalidraw source</a>. Evidence date: 29 August 2026.
          </figcaption>
        </figure>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {items.map(({ entry, project }) => (
          <Card key={entry.slug} id={entry.slug} className="flex h-full flex-col">
            <CardHeader className="space-y-3">
              <Badge variant="outline" className="w-fit">{project.category}</Badge>
              <CardTitle className="text-xl">{project.title}</CardTitle>
              <CardDescription>{project.tagline}</CardDescription>
            </CardHeader>
            <CardContent className="mt-auto space-y-4">
              <p className="text-sm leading-6 text-muted-foreground"><span className="font-medium text-foreground">Lesson:</span> {entry.lesson}</p>
              <div className="flex flex-wrap gap-2">
                {project.githubUrl ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={project.githubUrl} target="_blank" rel="noreferrer noopener"><Github className="size-4" /> GitHub</a>
                  </Button>
                ) : null}
                {project.liveUrl?.startsWith("/") ? (
                  <Button asChild variant="ghost" size="sm">
                    <Link href={project.liveUrl}><ArrowRight className="size-4" /> Read article</Link>
                  </Button>
                ) : project.liveUrl ? (
                  <Button asChild variant="ghost" size="sm">
                    <a href={project.liveUrl} target="_blank" rel="noreferrer noopener"><ArrowUpRight className="size-4" /> Live</a>
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="max-w-3xl text-sm leading-7 text-muted-foreground">
        The current solution inventory lives at <Link className="underline underline-offset-4" href="/solutions">Solutions &amp; capabilities</Link>.
      </p>
    </article>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: "Earlier products and experiments",
    description: "Nine earlier products and experiments: what each taught, what survived into current work, and why none were deleted.",
    alternates: { canonical: "/solutions/earlier-products" },
    openGraph: {
      title: `Earlier products and experiments • ${site.name}`,
      description: "Nine earlier products and experiments: what each taught, what survived into current work, and why none were deleted.",
      url: `${site.siteUrl}/solutions/earlier-products`,
    },
  }
}
