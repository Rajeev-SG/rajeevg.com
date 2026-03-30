import Link from "next/link"
import type { Metadata } from "next"
import { unstable_noStore as noStore } from "next/cache"

import { BlogIndexClient } from "@/components/blog-index-client"
import { ContentLinkCard } from "@/components/content-ops/content-link-card"
import { Button } from "@/components/ui/button"
import { getContentInventoryBySlug, getContentOpsData } from "@/lib/content-ops/data"
import { getPostEffectiveDate } from "@/lib/posts"
import { getSortedVisiblePostsLive, isLocalRuntimeOverlayEnabled } from "@/lib/server-posts"
import { site } from "@/lib/site"

export const revalidate = 3600

export default async function BlogIndex() {
  if (isLocalRuntimeOverlayEnabled()) noStore()
  const docs = getSortedVisiblePostsLive()
  const contentOps = await getContentOpsData()

  const allPosts = docs.map((p) => {
    const strategy = getContentInventoryBySlug(p.slug)

    return {
      title: p.title,
      slug: p.slug,
      date: p.date,
      displayDate: getPostEffectiveDate(p),
      updated: p.updated,
      tags: p.tags ?? [],
      description: p.description,
      excerpt: p.excerpt,
      pageClass: strategy?.pageClass,
      pillar: strategy?.pillar,
      cluster: strategy?.cluster,
    }
  })

  const allTags = Array.from(new Set(docs.flatMap((p) => p.tags ?? []))).sort((a, b) => a.localeCompare(b))

  const flagships = contentOps.inventory.filter((record) => record.pageClass === "Flagship").slice(0, 3)
  const playbooks = contentOps.inventory
    .filter((record) => record.pageClass.includes("Workflow") || record.pageClass.includes("Supporting"))
    .slice(0, 3)

  return (
    <section className="space-y-10">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">Archive and discovery</p>
        <h1 className="text-4xl font-semibold tracking-tight">Writing organised around pillars, proof, and playbooks</h1>
        <p className="max-w-3xl text-muted-foreground">
          The archive still contains every public post, but it now lives inside a clearer graph: flagships define the thesis, proof pages show what shipped, and workflow nodes route readers toward action.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Button asChild variant="outline" className="justify-start sm:w-auto">
            <Link href="/ai">AI hub</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start sm:w-auto">
            <Link href="/analytics">Analytics hub</Link>
          </Button>
          <Button asChild variant="outline" className="justify-start sm:w-auto">
            <Link href="/proof">Proof hub</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-2">
        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Flagships</p>
            <h2 className="text-2xl font-semibold tracking-tight">Core opinion and operating models</h2>
          </div>
          <div className="grid gap-4">
            {flagships.map((record) => (
              <ContentLinkCard key={record.id} record={record} />
            ))}
          </div>
        </section>

        <section className="space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Playbooks and bridges</p>
            <h2 className="text-2xl font-semibold tracking-tight">Action-oriented guides and supporting routes</h2>
          </div>
          <div className="grid gap-4">
            {playbooks.map((record) => (
              <ContentLinkCard key={record.id} record={record} />
            ))}
          </div>
        </section>
      </div>

      <BlogIndexClient allPosts={allPosts} allTags={allTags} />
    </section>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Blog",
    description: site.description,
    alternates: { canonical: "/blog" },
  }
}
