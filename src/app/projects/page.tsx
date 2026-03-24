import type { Metadata } from "next"
import Link from "next/link"

import { ProjectCard } from "@/components/project-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { site } from "@/lib/site"
import { getPortfolioProjects } from "@/lib/portfolio-projects"

export const revalidate = 3600

export default function ProjectsPage() {
  const projects = getPortfolioProjects()
  const categories = Array.from(new Set(projects.map((project) => project.category))).sort()

  return (
    <section
      className="space-y-10"
      data-analytics-section="projects_page"
      data-analytics-item-type="page_section"
      data-analytics-page-context="primary"
      data-analytics-page-content-group="projects"
      data-analytics-page-content-type="project_index"
      data-analytics-page-project-count={projects.length}
      data-analytics-page-project-categories={categories.join("|")}
    >
      <div className="space-y-4" data-analytics-section="projects_intro" data-analytics-item-type="page_intro">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">
          Portfolio
        </p>
        <div className="space-y-3">
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight sm:text-4xl">
            Public projects with real repos and real live URLs
          </h1>
          <p className="max-w-3xl text-base text-muted-foreground sm:text-lg">
            I wanted this to read more like a working index than a polished gallery. Everything
            here links to a public GitHub repo and a live public URL, so you can inspect the code
            and the product instead of taking my word for it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">{projects.length} live projects</Badge>
          <Badge variant="outline">GitHub visibility checked</Badge>
          <Badge variant="outline">Homepage URLs verified from repo metadata</Badge>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="overflow-hidden border-border/70 bg-linear-to-br from-background via-background to-muted/40">
          <CardHeader className="gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Reporting route
              </p>
              <CardTitle className="text-2xl sm:text-3xl">
                Hackathon voting analytics dashboard
              </CardTitle>
              <CardDescription className="max-w-3xl text-sm leading-6 sm:text-base">
                A dedicated reporting surface for the voting app, built to replace the muddy Looker
                Studio artifact with a cleaner BigQuery-backed dashboard and a fully reviewable dummy
                preview mode.
              </CardDescription>
            </div>
            <Button asChild>
              <Link href="/projects/hackathon-voting-analytics">Open analytics dashboard</Link>
            </Button>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="outline">ECharts and Observable Plot</Badge>
            <Badge variant="outline">Live BigQuery mode</Badge>
            <Badge variant="outline">Dummy preview mode</Badge>
            <Badge variant="outline">Hackathon-only reporting dataset</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6">
        {projects.map((project) => (
          <ProjectCard key={project.slug} project={project} />
        ))}
      </div>
    </section>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Projects",
    description: "A portfolio of public projects with live URLs and GitHub repositories.",
    alternates: { canonical: "/projects" },
    openGraph: {
      title: `Projects • ${site.name}`,
      description:
        "A portfolio of public projects with live URLs, GitHub repositories, and implementation notes.",
      url: `${site.siteUrl}/projects`,
    },
  }
}
