import type { Metadata } from "next"
import Link from "next/link"

import { ProjectCard } from "@/components/project-card"
import { getPortfolioProjects } from "@/lib/portfolio-projects"
import { site } from "@/lib/site"

export const revalidate = 3600

const GROUPS = [
  { key: "AI & Agent Systems", blurb: "Systems that keep agents running, measured, and honest about cost." },
  { key: "Martech & Measurement", blurb: "Governance, QA, and reconciliation that make marketing data trustworthy." },
  { key: "Products & Operational Tools", blurb: "Working products that support real operations, not demos." },
] as const

export default function SolutionsPage() {
  const projects = getPortfolioProjects()
  const grouped = GROUPS.map((group) => ({
    ...group,
    items: projects.filter((p) => p.category === group.key),
  })).filter((g) => g.items.length > 0)

  return (
    <section className="space-y-16" data-analytics-section="solutions_page" data-analytics-item-type="solution_index">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Solutions &amp; capabilities</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Systems built and operated for real work</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Each entry is something I have built, run, and can defend with evidence: live URLs, write-ups, or open source, with a real last-updated date. The complete inventory is date-ordered within each grouping.
        </p>
        <p className="text-sm leading-7 text-muted-foreground">
          Earlier products and experiments live separately in <Link className="underline underline-offset-4" href="/solutions/earlier-products">Earlier products and experiments</Link>, with what each one taught.
        </p>
      </header>

      {grouped.map((group) => (
        <div key={group.key} className="space-y-6">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{group.key}</h2>
            <p className="text-sm leading-7 text-muted-foreground">{group.blurb}</p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3" aria-label={`${group.key} solutions`}>
            {group.items.map((project) => <ProjectCard key={project.slug} project={project} compact />)}
          </div>
        </div>
      ))}
    </section>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: "Solutions & capabilities",
    description: "AI and agent systems, martech and measurement governance, and operational products built, run, and evidenced by Rajeev Gill.",
    alternates: { canonical: "/solutions" },
    openGraph: {
      title: `Solutions & capabilities • ${site.name}`,
      description: "AI and agent systems, martech and measurement governance, and operational products built, run, and evidenced by Rajeev Gill.",
      url: `${site.siteUrl}/solutions`,
    },
  }
}
