import { posts, type Post } from "#velite"
import { BlogIndexClient } from "@/components/blog-index-client"
import type { Metadata } from "next"
import { site } from "@/lib/site"

export const revalidate = 3600

export default function BlogIndex() {
  const docs = posts
    .filter((p: Post) => process.env.NODE_ENV !== "production" || !p.draft)
    .sort((a: Post, b: Post) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const allPosts = docs.map((p: Post) => ({
    title: p.title,
    slug: p.slug,
    date: p.date,
    tags: p.tags ?? [],
    description: p.description,
    excerpt: p.excerpt, // available from Velite config
  }))

  const allTags = Array.from(new Set(docs.flatMap((p: Post) => p.tags ?? []))).sort(
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

