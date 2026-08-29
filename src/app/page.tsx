import type { Metadata } from "next"
import Link from "next/link"
import { unstable_noStore as noStore } from "next/cache"
import { ArrowRight, Mail } from "lucide-react"

import { ProjectCard } from "@/components/project-card"
import { Button } from "@/components/ui/button"
import { getPortfolioProjects } from "@/lib/portfolio-projects"
import { getPostEffectiveDate } from "@/lib/posts"
import { getSortedVisiblePostsLive, isLocalRuntimeOverlayEnabled } from "@/lib/server-posts"
import { site } from "@/lib/site"

export const revalidate = 3600

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

export default function Home() {
  if (isLocalRuntimeOverlayEnabled()) noStore()

  const featuredSlugs = [
    "agent-operations-control-plane",
    "coding-agent-observatory",
    "agent-routing-and-lifecycle-system",
    "global-measurement-governance-system",
    "media-qa-attribution-toolkit",
  ]
  const selectedSlugs = new Set(featuredSlugs)
  const selectedProjects = getPortfolioProjects().filter((project) => selectedSlugs.has(project.slug))
  const latestPosts = getSortedVisiblePostsLive().slice(0, 3)
  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Rajeev Gill",
    url: site.siteUrl,
    description: "Software developer building practical systems around AI, data, analytics, and adtech.",
    jobTitle: "Software developer",
    knowsAbout: ["AI-assisted software development", "data and analytics", "adtech workflows", "product engineering"],
    sameAs: ["https://github.com/Rajeev-SG", "https://www.linkedin.com/in/rajeev-gill/"],
  }

  return (
    <div className="space-y-24 sm:space-y-28">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      <section className="grid min-h-[58vh] content-center gap-10 py-8 lg:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)] lg:items-end">
        <div className="space-y-7">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Rajeev Gill</p>
          <h1 className="max-w-4xl text-5xl font-semibold tracking-[-0.045em] sm:text-6xl lg:text-7xl">
            I build practical software around AI, data, analytics, and adtech.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            My work sits between product thinking and implementation, with a bias toward systems that make real work less messy.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link href="/solutions">
                View selected solutions
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/blog">Read my writing</Link>
            </Button>
          </div>
        </div>

        <div className="border-l border-border pl-6 text-sm leading-7 text-muted-foreground">
          <p>Based in London. Interested in useful AI, clearer measurement, and software that holds up outside a demo.</p>
          <Link href="mailto:rajeev.sgill@gmail.com" className="mt-4 inline-flex items-center gap-2 font-medium text-foreground hover:underline">
            <Mail className="size-4" />
            Get in touch
          </Link>
        </div>
      </section>

      <section className="space-y-8" aria-labelledby="selected-projects">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Featured solutions</p>
            <h2 id="selected-projects" className="text-3xl font-semibold tracking-tight sm:text-4xl">Systems I operate now</h2>
          </div>
          <Link href="/solutions" className="inline-flex items-center gap-2 text-sm font-medium hover:underline">
            See all solutions <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {selectedProjects.map((project) => (
            <ProjectCard key={project.slug} project={project} compact />
          ))}
        </div>
      </section>

      <section className="space-y-8" aria-labelledby="recent-writing">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Recent writing</p>
            <h2 id="recent-writing" className="text-3xl font-semibold tracking-tight sm:text-4xl">Notes from the work</h2>
          </div>
          <Link href="/blog" className="inline-flex items-center gap-2 text-sm font-medium hover:underline">
            Browse all writing <ArrowRight className="size-4" />
          </Link>
        </div>
        <div className="divide-y divide-border border-y border-border">
          {latestPosts.map((post) => (
            <article key={post.slug} className="grid gap-3 py-6 sm:grid-cols-[1fr_auto] sm:items-start">
              <div className="space-y-2">
                <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
                  <Link href={`/blog/${post.slug}`} className="hover:underline">{post.title}</Link>
                </h3>
                {post.description ? <p className="max-w-3xl leading-7 text-muted-foreground">{post.description}</p> : null}
              </div>
              <time className="text-sm text-muted-foreground" dateTime={getPostEffectiveDate(post)}>
                {dateFormatter.format(new Date(getPostEffectiveDate(post)))}
              </time>
            </article>
          ))}
        </div>
      </section>

      <section className="border-t border-border pt-12">
        <div className="max-w-2xl space-y-5">
          <h2 className="text-3xl font-semibold tracking-tight">Have something useful to build?</h2>
          <p className="text-lg leading-8 text-muted-foreground">I am always interested in thoughtful software, analytics, and AI work where the practical details matter.</p>
          <Button asChild variant="outline">
            <Link href="mailto:rajeev.sgill@gmail.com">Email me</Link>
          </Button>
        </div>
      </section>
    </div>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: site.name,
    description: site.description,
    alternates: { canonical: "/" },
  }
}
