import type { Metadata } from "next"

import { ProjectCard } from "@/components/project-card"
import { getPortfolioProjects } from "@/lib/portfolio-projects"
import { site } from "@/lib/site"

export const revalidate = 3600

export default function ProjectsPage() {
  const projects = getPortfolioProjects()

  return (
    <section className="space-y-12" data-analytics-section="projects_page" data-analytics-item-type="project_index">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Projects</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Software built for real work</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Products, research tools, and public systems I have built, adapted, or operated. Each card links to the live work, with source code where it is public.
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" aria-label="Project portfolio">
        {projects.map((project) => <ProjectCard key={project.slug} project={project} compact />)}
      </div>
    </section>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: "Projects",
    description: "Products, research tools, and public systems built, adapted, or operated by Rajeev Gill.",
    alternates: { canonical: "/projects" },
    openGraph: {
      title: `Projects • ${site.name}`,
      description: "Products, research tools, and public systems built, adapted, or operated by Rajeev Gill.",
      url: `${site.siteUrl}/projects`,
    },
  }
}
