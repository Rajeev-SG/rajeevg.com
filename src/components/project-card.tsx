import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Github } from "lucide-react"

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
      id={project.slug}
      className="group flex h-full scroll-mt-24 flex-col overflow-hidden border-border/70 bg-card/60 backdrop-blur-sm"
      data-analytics-section={compact ? "project_spotlight" : "project_card"}
      data-analytics-item-type="project"
      data-analytics-item-id={project.slug}
      data-analytics-item-name={project.title}
      data-analytics-item-category={project.category}
      data-analytics-tech-count={project.tech.length}
    >
      <div className="border-b border-border/60 bg-muted/20">
        <div className="relative aspect-[16/10] overflow-hidden">
          <Image
            src={project.imagePath}
            alt={project.imageAlt}
            fill
            sizes="(max-width: 768px) 100vw, 960px"
            className="object-contain p-3 bg-white dark:bg-slate-900"
            priority={false}
          />
          <div className="absolute inset-0 bg-linear-to-t from-background/22 via-background/4 to-transparent" />
        </div>
      </div>
      <CardHeader className="space-y-4">
        <Badge variant="outline" className="w-fit">{project.category}</Badge>
        <div className="space-y-2">
          <CardTitle className="text-xl sm:text-2xl">{project.title}</CardTitle>
          <CardDescription className="text-sm sm:text-base">
            {project.tagline}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {!compact ? (
          <p className="text-sm leading-7 text-foreground/90 sm:text-base">
            {project.summary}
          </p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          {project.tech.slice(0, 3).map((item) => (
            <Badge key={item} variant="secondary">
              {item}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter className="mt-auto flex flex-wrap gap-2">
          {project.detailLinks?.slice(0, compact ? 1 : 2)
            .filter((detail) => detail.href !== project.liveUrl)
            .map((detail) => (
              <Button key={detail.href} asChild variant="ghost" size="sm">
                <Link href={detail.href}>
                  {detail.label}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
            ))}
          {project.githubUrl ? (
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
          ) : null}
          {project.liveUrl ? (
            project.liveUrl.startsWith("/") ? (
              <Button asChild size="sm">
                <Link
                  href={project.liveUrl}
                  data-analytics-event="project_click"
                  data-analytics-section="project_card"
                  data-analytics-item-type="project_article"
                  data-analytics-item-id={project.slug}
                  data-analytics-item-name={project.title}
                  data-analytics-item-category={project.category}
                  data-analytics-destination="article"
                >
                  <ArrowRight className="size-4" />
                  Read article
                </Link>
              </Button>
            ) : (
              <Button asChild size="sm">
                <a
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
                </a>
              </Button>
            )
          ) : null}
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
