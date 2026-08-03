import type { Metadata } from "next"
import { unstable_noStore as noStore } from "next/cache"

import { BlogIndexClient } from "@/components/blog-index-client"
import { getPostEffectiveDate } from "@/lib/posts"
import { getSortedVisiblePostsLive, isLocalRuntimeOverlayEnabled } from "@/lib/server-posts"
import { site } from "@/lib/site"

export const revalidate = 3600

export default function BlogIndex() {
  if (isLocalRuntimeOverlayEnabled()) noStore()
  const posts = getSortedVisiblePostsLive().map((post) => ({
    title: post.title,
    slug: post.slug,
    displayDate: getPostEffectiveDate(post),
    updated: post.updated,
    tags: post.tags ?? [],
    description: post.description,
    excerpt: post.excerpt,
  }))

  return (
    <section className="space-y-10">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">Writing</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Useful notes on AI, analytics, and building software</h1>
        <p className="text-lg leading-8 text-muted-foreground">
          Practical accounts of what I built, what made the work difficult, and what I would do differently next time.
        </p>
      </header>
      <BlogIndexClient allPosts={posts} />
    </section>
  )
}

export function generateMetadata(): Metadata {
  return {
    title: "Writing",
    description: `Writing by ${site.name} about AI, analytics, data, and practical software delivery.`,
    alternates: { canonical: "/blog" },
  }
}
