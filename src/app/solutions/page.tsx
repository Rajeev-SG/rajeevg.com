import type { Metadata } from "next"
import Link from "next/link"

import { ProjectCard } from "@/components/project-card"
import { getPortfolioProjects } from "@/lib/portfolio-projects"
import { site } from "@/lib/site"

import SignalRoom from "./signal-room"

export const revalidate = 86400

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
    <section className="space-y-8 sm:space-y-10" data-analytics-section="solutions_page" data-analytics-item-type="solution_index">
      <header className="flex flex-wrap items-center justify-between gap-x-6">
        <h1 className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Solutions &amp; capabilities</h1>
        <a href="#solution-inventory" className="inline-flex min-h-11 items-center gap-2 text-sm font-medium underline-offset-4 hover:underline">
          Browse the portfolio <span aria-hidden="true">↓</span>
        </a>
      </header>

      <SignalRoom />

      <div id="solution-inventory" className="max-w-3xl scroll-mt-24 space-y-3 pt-4">
        <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">Systems built and operated for real work</h2>
        <p className="text-lg leading-8 text-muted-foreground">
          Each entry is something I have built, run, and can defend with evidence: live URLs, write-ups, or open source, with a real last-updated date. The complete inventory is date-ordered within each grouping.
        </p>
        <p className="text-sm leading-7 text-muted-foreground">
          Earlier products and experiments live separately in <Link className="underline underline-offset-4" href="/solutions/earlier-products">Earlier products and experiments</Link>, with what each one taught.
        </p>
      </div>

      {grouped.map((group) => (
        <div key={group.key} className="space-y-6 pt-6">
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
