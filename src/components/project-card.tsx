import Link from "next/link"
import { ArrowUpRight, Github } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  getPortfolioProject,
  type PortfolioProject,
} from "@/lib/portfolio-projects"

type ProjectCardProps = {
  project: PortfolioProject
  compact?: boolean
}

export function ProjectCard({ project, compact = false }: ProjectCardProps) {
  return (
    <Card
      id={compact ? undefined : project.slug}
      className="scroll-mt-24 border-border/70 bg-card/60 backdrop-blur-sm"
      data-analytics-section={compact ? "project_spotlight" : "project_card"}
      data-analytics-item-type="project"
      data-analytics-item-id={project.slug}
      data-analytics-item-name={project.title}
      data-analytics-item-category={project.category}
      data-analytics-tech-count={project.tech.length}
    >
      <CardHeader className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{project.category}</Badge>
          <Badge variant="secondary">{project.repoVisibility.toLowerCase()}</Badge>
        </div>
        <div className="space-y-2">
          <CardTitle className="text-xl sm:text-2xl">{project.title}</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {project.tagline}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm leading-7 text-foreground/90 sm:text-base">
          {project.summary}
        </p>
        {!compact ? (
          <div className="space-y-2 rounded-lg border border-border/70 bg-background/70 p-4">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
              How it works
            </p>
            <p className="text-sm leading-7 text-muted-foreground sm:text-[15px]">
              {project.howItWorks}
            </p>
          </div>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {project.tech.map((item) => (
            <Badge key={item} variant="outline" data-analytics-event="project_tech_click" data-analytics-section="project_card" data-analytics-item-type="project_tech" data-analytics-item-name={item}>
              {item}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted-foreground">{project.inclusionReason}</p>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline" size="sm">
            <Link
              href={project.githubUrl}
              target="_blank"
              rel="noreferrer noopener"
              data-analytics-event="project_click"
              data-analytics-section="project_card"
              data-analytics-item-type="project_repo"
              data-analytics-item-id={project.slug}
              data-analytics-item-name={project.title}
              data-analytics-item-category={project.category}
              data-analytics-destination="github"
            >
              <Github className="size-4" />
              GitHub
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer noopener"
              data-analytics-event="project_click"
              data-analytics-section="project_card"
              data-analytics-item-type="project_live_site"
              data-analytics-item-id={project.slug}
              data-analytics-item-name={project.title}
              data-analytics-item-category={project.category}
              data-analytics-destination="live_site"
            >
              <ArrowUpRight className="size-4" />
              Live site
            </Link>
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}

export function ProjectSpotlight({ slug }: { slug: string }) {
  const project = getPortfolioProject(slug)

  if (!project) {
    return null
  }

  return <ProjectCard project={project} compact />
}
