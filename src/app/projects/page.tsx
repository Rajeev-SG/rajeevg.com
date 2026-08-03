import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Github } from "lucide-react"

import { ProjectCard } from "@/components/project-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getPortfolioProjects } from "@/lib/portfolio-projects"
import { site } from "@/lib/site"

export const revalidate = 3600

export default function ProjectsPage() {
  const projects = getPortfolioProjects()
  const featuredSlugs = new Set(["open-gtm-index", "hackathon-voting-app", "model-intelligence-maintainer"])
  const featured = projects.filter((project) => featuredSlugs.has(project.slug))
  const more = projects.filter((project) => !featuredSlugs.has(project.slug))

  return (
    <section className="space-y-16" data-analytics-section="projects_page" data-analytics-item-type="project_index">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Projects</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Software built for real work</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          A selection of products, research tools, and operational systems I have designed and built. Each project links to the working product and its source code.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-3" aria-label="Selected projects">
        {featured.map((project) => <ProjectCard key={project.slug} project={project} compact />)}
      </div>

      <section className="space-y-5" aria-labelledby="more-projects">
        <h2 id="more-projects" className="text-2xl font-semibold tracking-tight">More projects</h2>
        <div className="divide-y divide-border border-y border-border">
          {more.map((project) => (
            <article id={project.slug} key={project.slug} className="scroll-mt-24 py-7">
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">{project.title}</h3>
                    <Badge variant="outline">{project.category}</Badge>
                  </div>
                  <p className="max-w-3xl leading-7 text-muted-foreground">{project.tagline}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {project.detailLinks?.map((detail) => (
                    <Button key={detail.href} asChild variant="ghost" size="sm">
                      <Link href={detail.href}>{detail.label}<ArrowRight className="size-4" /></Link>
                    </Button>
                  ))}
                  <Button asChild variant="outline" size="sm">
                    <Link href={project.githubUrl} target="_blank" rel="noreferrer noopener"><Github className="size-4" />GitHub</Link>
                  </Button>
                  <Button asChild size="sm">
                    <Link href={project.liveUrl} target="_blank" rel="noreferrer noopener">Live site<ArrowUpRight className="size-4" /></Link>
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </section>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: "Projects",
    description: "Products, research tools, and operational software built by Rajeev Gill.",
    alternates: { canonical: "/projects" },
    openGraph: {
      title: `Projects • ${site.name}`,
      description: "Products, research tools, and operational software built by Rajeev Gill.",
      url: `${site.siteUrl}/projects`,
    },
  }
}
