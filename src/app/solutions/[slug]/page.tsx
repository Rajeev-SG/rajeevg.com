import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowRight, ArrowUpRight, Github } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getPortfolioProject, portfolioProjects } from "@/lib/portfolio-projects"
import { site } from "@/lib/site"

export const revalidate = 3600
export const dynamicParams = false

const dateFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" })

export function generateStaticParams() {
  return portfolioProjects.map((project) => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const project = getPortfolioProject(slug)
  if (!project) return {}
  return {
    title: project.title,
    description: project.tagline,
    alternates: { canonical: `/solutions/${project.slug}` },
    openGraph: {
      title: `${project.title} • ${site.name}`,
      description: project.tagline,
      url: `${site.siteUrl}/solutions/${project.slug}`,
    },
  }
}

export default async function SolutionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = getPortfolioProject(slug)
  if (!project) notFound()

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    description: project.summary,
    dateModified: project.lastUpdated,
    url: `${site.siteUrl}/solutions/${project.slug}`,
    author: { "@type": "Person", name: "Rajeev Gill" },
  }

  return (
    <article className="space-y-10" data-analytics-section="solution_detail" data-analytics-item-type="solution" data-analytics-item-id={project.slug}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="space-y-4">
        <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Badge variant="outline">{project.category}</Badge>
          <time dateTime={project.lastUpdated}>Evidence date: {dateFormatter.format(new Date(project.lastUpdated))}</time>
        </div>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{project.title}</h1>
        <p className="max-w-3xl text-lg leading-8 text-muted-foreground">{project.tagline}</p>
      </header>

      <figure className="overflow-hidden rounded-2xl border bg-card shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/images/solutions/${project.slug}.svg`} alt={project.imageAlt} className="w-full bg-background object-contain" loading="lazy" decoding="async" />
        <figcaption className="border-t bg-card px-4 py-3 text-sm leading-6 text-muted-foreground">
          {project.imageAlt} <a className="font-medium underline underline-offset-4" href={`/downloads/${project.slug}.excalidraw`}>Download the editable Excalidraw source</a>.
        </figcaption>
      </figure>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-xl">What it is</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm leading-7 text-foreground/90 sm:text-base">
            <p>{project.summary}</p>
            <p>{project.howItWorks}</p>
          </CardContent>
        </Card>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Evidence &amp; links</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <a href={project.liveUrl} target="_blank" rel="noreferrer noopener">
                  <ArrowUpRight className="size-4" /> {project.liveUrl.startsWith("/") ? "Read the article" : "Live site"}
                </a>
              </Button>
              {project.githubUrl ? (
                <Button asChild size="sm" variant="outline">
                  <a href={project.githubUrl} target="_blank" rel="noreferrer noopener">
                    <Github className="size-4" /> GitHub
                  </a>
                </Button>
              ) : null}
            </CardContent>
          </Card>
          {project.detailLinks?.length ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Related reading</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {project.detailLinks.map((link) => (
                  <Link key={link.href} href={link.href} className="flex items-center gap-2 underline underline-offset-4">
                    <ArrowRight className="size-4" /> {link.label}
                  </Link>
                ))}
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </article>
  )
}
