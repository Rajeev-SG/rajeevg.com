import type { Metadata } from "next"
import Link from "next/link"
import { unstable_noStore as noStore } from "next/cache"
import { ArrowRight, Layers3, LibraryBig, LineChart, Workflow } from "lucide-react"

import { ContentLinkCard } from "@/components/content-ops/content-link-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getContentOpsData } from "@/lib/content-ops/data"
import { getSortedVisiblePostsLive, isLocalRuntimeOverlayEnabled } from "@/lib/server-posts"
import { site } from "@/lib/site"

export const revalidate = 3600

export default async function Home() {
  if (isLocalRuntimeOverlayEnabled()) noStore()
  const latestPosts = getSortedVisiblePostsLive().slice(0, 4)
  const contentOps = await getContentOpsData()
  const flagships = contentOps.inventory.filter((record) => record.pageClass === "Flagship").slice(0, 3)
  const proofAssets = contentOps.inventory
    .filter(
      (record) =>
        record.pageClass.includes("Proof") || record.kind === "dashboard" || record.kind === "project"
    )
    .slice(0, 4)

  if (!latestPosts.length) {
    return (
      <section className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight">No posts yet</h1>
        <p className="text-muted-foreground">
          Add a Markdown file under <code>content/posts/</code> to get started.
        </p>
      </section>
    )
  }

  return (
    <section className="space-y-12">
      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-border/70 bg-linear-to-br from-background via-background to-sky-500/5">
          <CardHeader className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary">AI workflows</Badge>
              <Badge variant="secondary">Analytics systems</Badge>
              <Badge variant="secondary">Proof-backed content</Badge>
            </div>
            <CardTitle className="max-w-4xl text-4xl tracking-tight sm:text-5xl">
              Practical AI, analytics, and delivery systems that survive contact with real work.
            </CardTitle>
            <CardDescription className="max-w-3xl text-base leading-7 sm:text-lg">
              rajeevg.com now behaves like a content graph, not a rolling blog list: flagship essays define the point
              of view, proof pages show what shipped, playbooks turn that into action, and bounded concept nodes help
              readers and search systems route into the right next step.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/ai">
                Explore AI hub
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/analytics">
                Explore analytics hub
                <ArrowRight className="ml-2 size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/proof">View proof assets</Link>
            </Button>
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Strategic hubs</CardDescription>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Layers3 className="size-5 text-sky-500" />
                {contentOps.hubs.length}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              AI, analytics, playbooks, and proof routes now organise the public site around need-states instead of chronology alone.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Interactive proof</CardDescription>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <LineChart className="size-5 text-emerald-500" />
                {contentOps.interactiveAssets.length}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Live dashboards and project routes reinforce the essays with inspectable evidence, not just explanations.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Queued next content</CardDescription>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Workflow className="size-5 text-amber-500" />
                {contentOps.queuedIdeas.length}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Existing posts already seed the next playbooks, checklists, and concept nodes inside the CMS.
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardDescription>Glossary nodes</CardDescription>
              <CardTitle className="flex items-center gap-2 text-2xl">
                <LibraryBig className="size-5 text-violet-500" />
                {contentOps.glossary.length}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Bounded concept pages make the site easier to cite, route, and understand without thin pSEO sprawl.
            </CardContent>
          </Card>
        </div>
      </div>

      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Start here</p>
          <h2 className="text-3xl font-semibold tracking-tight">Flagships that define the system</h2>
          <p className="max-w-3xl text-muted-foreground">
            These are the thesis pages: where the site explains what matters, what good looks like, and how the rest of the graph should be read.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {flagships.map((record) => (
            <ContentLinkCard key={record.id} record={record} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Proof and tooling</p>
          <h2 className="text-3xl font-semibold tracking-tight">Evidence you can actually inspect</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {proofAssets.map((record) => (
            <ContentLinkCard key={record.id} record={record} />
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Latest writing</p>
            <h2 className="text-3xl font-semibold tracking-tight">Recent articles still stay visible</h2>
          </div>
          <Button asChild variant="outline">
            <Link href="/blog">Browse full archive</Link>
          </Button>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {latestPosts.map((post) => (
            <Card key={post.slug} className="h-full">
              <CardHeader>
                <CardTitle className="text-xl">
                  <Link href={`/blog/${post.slug}`} className="hover:underline">
                    {post.title}
                  </Link>
                </CardTitle>
                <CardDescription>{post.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {post.tags.slice(0, 4).map((tag) => (
                    <Badge key={tag} variant="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(post.updated || post.date).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </section>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: site.name,
    description: site.description,
    alternates: {
      canonical: "/",
    },
  }
}
