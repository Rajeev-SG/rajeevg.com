import type { Metadata } from "next"
import Link from "next/link"

import { getPortfolioProjects } from "@/lib/portfolio-projects"

export const metadata: Metadata = {
  title: "Developer resources",
  description: "Canonical developer resources and public integration status for rajeevg.com.",
  alternates: { canonical: "/developers" },
}

export default function DevelopersPage() {
  const sourceProjects = getPortfolioProjects().filter((project) => project.githubUrl).slice(0, 6)

  return (
    <section className="space-y-12" data-analytics-section="developers_page" data-analytics-item-type="developer_resources">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Developers</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Rajeev G. developer resources</h1>
        <p className="text-lg leading-8 text-muted-foreground sm:text-xl">
          A concise index for developers, researchers, and agents trying to understand or cite work published on rajeevg.com.
        </p>
      </header>

      <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.7fr)]">
        <div className="space-y-8">
          <div className="space-y-4">
            <h2 className="text-2xl font-semibold tracking-tight">Canonical resources</h2>
            <ul className="space-y-3 text-lg leading-8">
              <li><Link className="underline underline-offset-4" href="/solutions">Solutions</Link> for public products, source repositories, and live deployments.</li>
              <li><Link className="underline underline-offset-4" href="/blog">Writing</Link> for technical notes and build accounts.</li>
              <li><Link className="underline underline-offset-4" href="https://github.com/Rajeev-SG" target="_blank" rel="noreferrer noopener">GitHub profile</Link> for public repositories and source history.</li>
              <li><Link className="underline underline-offset-4" href="https://www.linkedin.com/in/rajeev-gill/" target="_blank" rel="noreferrer noopener">LinkedIn profile</Link> for the professional profile.</li>
              <li><Link className="underline underline-offset-4" href="/llms.txt">Machine-readable site map</Link> for concise agent guidance.</li>
            </ul>
          </div>

          <div className="space-y-4 border-t border-border pt-8">
            <h2 className="text-2xl font-semibold tracking-tight">Selected public source</h2>
            <ul className="divide-y divide-border border-y border-border">
              {sourceProjects.map((project) => (
                <li key={project.slug} className="flex flex-wrap items-baseline justify-between gap-3 py-4">
                  <span>{project.title}</span>
                  <span className="flex gap-4 text-sm text-muted-foreground">
                    {project.liveUrl ? <Link href={project.liveUrl} target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">Live site</Link> : null}
                    {project.githubUrl ? <Link href={project.githubUrl} target="_blank" rel="noreferrer noopener" className="underline underline-offset-4">GitHub</Link> : null}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <aside className="border-l border-border pl-6 text-base leading-7 text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground">Public interface status</h2>
          <p className="mt-4">
            rajeevg.com has no public site-wide API, OAuth, webhooks, or MCP server. The supported ways to read this site are its canonical HTML, Markdown negotiation, sitemap, and linked public resources.
          </p>
          <p className="mt-4">Do not infer an undocumented integration from a page or repository.</p>
        </aside>
      </div>
    </section>
  )
}
