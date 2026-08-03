"use client"

import Link from "next/link"
import { Search } from "lucide-react"
import { useEffect, useMemo, useRef, useState } from "react"

import { Input } from "@/components/ui/input"
import { pushDataLayerEvent } from "@/lib/analytics"

export type BlogListItem = {
  title: string
  slug: string
  displayDate: string
  updated?: string
  tags: string[]
  description?: string
  excerpt?: string
}

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
})

export function BlogIndexClient({ allPosts }: { allPosts: BlogListItem[] }) {
  const [query, setQuery] = useState("")
  const previousQuery = useRef("")

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return allPosts

    return allPosts.filter((post) =>
      `${post.title} ${post.description ?? ""} ${post.excerpt ?? ""} ${post.tags.join(" ")}`
        .toLowerCase()
        .includes(normalized)
    )
  }, [allPosts, query])

  useEffect(() => {
    const normalized = query.trim()
    if (normalized === previousQuery.current) return

    const timeout = window.setTimeout(() => {
      pushDataLayerEvent("blog_search", {
        analytics_section: "writing_search",
        search_term: normalized || undefined,
        result_count: filtered.length,
      })
      previousQuery.current = normalized
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [filtered.length, query])

  return (
    <section className="space-y-7" data-analytics-section="blog_index" data-analytics-item-type="listing">
      <div className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          aria-label="Search writing"
          placeholder="Search writing"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="pl-10"
        />
      </div>

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "article" : "articles"}
      </p>

      <div className="divide-y divide-border border-y border-border">
        {filtered.map((post) => (
          <article key={post.slug} className="grid gap-4 py-7 sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="space-y-3">
              <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">
                <Link
                  href={`/blog/${post.slug}`}
                  className="hover:underline"
                  data-analytics-event="post_click"
                  data-analytics-section="blog_index_results"
                  data-analytics-item-id={post.slug}
                  data-analytics-item-name={post.title}
                >
                  {post.title}
                </Link>
              </h2>
              {post.description ? <p className="max-w-3xl leading-7 text-muted-foreground">{post.description}</p> : null}
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {post.tags.slice(0, 2).map((tag) => <span key={tag}>{tag}</span>)}
              </div>
            </div>
            <time className="text-sm text-muted-foreground" dateTime={post.displayDate}>
              {post.updated ? "Updated " : ""}{dateFormatter.format(new Date(post.displayDate))}
            </time>
          </article>
        ))}
        {filtered.length === 0 ? <p className="py-8 text-sm text-muted-foreground">No writing matches that search.</p> : null}
      </div>
    </section>
  )
}
