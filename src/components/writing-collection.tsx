import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { getPostEffectiveDate } from "@/lib/posts"
import { getSortedVisiblePostsLive } from "@/lib/server-posts"

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

export function WritingCollection({
  eyebrow,
  title,
  description,
  matchingTags,
}: {
  eyebrow: string
  title: string
  description: string
  matchingTags: string[]
}) {
  const tags = new Set(matchingTags)
  const posts = getSortedVisiblePostsLive().filter((post) => post.tags.some((tag) => tags.has(tag)))

  return (
    <section className="space-y-12">
      <header className="max-w-3xl space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-muted-foreground">{eyebrow}</p>
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">{title}</h1>
        <p className="text-lg leading-8 text-muted-foreground">{description}</p>
      </header>

      <div className="divide-y divide-border border-y border-border">
        {posts.map((post) => (
          <article key={post.slug} className="grid gap-3 py-7 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="space-y-2">
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                <Link href={`/blog/${post.slug}`} className="hover:underline">{post.title}</Link>
              </h2>
              {post.description ? <p className="max-w-3xl leading-7 text-muted-foreground">{post.description}</p> : null}
              <Link href={`/blog/${post.slug}`} className="inline-flex items-center gap-2 text-sm font-medium hover:underline">
                Read article <ArrowRight className="size-4" />
              </Link>
            </div>
            <time className="text-sm text-muted-foreground" dateTime={getPostEffectiveDate(post)}>
              {dateFormatter.format(new Date(getPostEffectiveDate(post)))}
            </time>
          </article>
        ))}
      </div>
    </section>
  )
}
