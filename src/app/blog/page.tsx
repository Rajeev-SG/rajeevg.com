import { BlogIndexClient } from "@/components/blog-index-client"
import type { Metadata } from "next"
import { site } from "@/lib/site"
import { getSortedVisiblePosts } from "@/lib/posts"

export const revalidate = 3600

export default function BlogIndex() {
  const docs = getSortedVisiblePosts()

  const allPosts = docs.map((p) => ({
    title: p.title,
    slug: p.slug,
    date: p.date,
    tags: p.tags ?? [],
    description: p.description,
    excerpt: p.excerpt, // available from Velite config
  }))

  const allTags = Array.from(new Set(docs.flatMap((p) => p.tags ?? []))).sort(
    (a, b) => a.localeCompare(b)
  )

  return <BlogIndexClient allPosts={allPosts} allTags={allTags} />
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Blog",
    description: site.description,
    alternates: { canonical: "/blog" },
  }
}
