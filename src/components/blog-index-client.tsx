"use client"

import Link from "next/link"
import { useEffect, useMemo, useRef, useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { TagCombobox } from "@/components/tag-combobox"
import { pushDataLayerEvent } from "@/lib/analytics"

export type BlogListItem = {
  title: string
  slug: string
  date: string
  displayDate: string
  updated?: string
  tags: string[]
  description?: string
  excerpt?: string
  pageClass?: string
  pillar?: string
  cluster?: string
}

export function BlogIndexClient({
  allPosts,
  allTags,
}: {
  allPosts: BlogListItem[]
  allTags: string[]
}) {
  const [q, setQ] = useState("")
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const previousQuery = useRef("")
  const hasFocusedSearch = useRef(false)

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return allPosts.filter((p) => {
      const hay = `${p.title} ${(p.description ?? "")} ${(p.excerpt ?? "")}`.toLowerCase()
      const textOk = !query || hay.includes(query)
      const tagsOk =
        selectedTags.length === 0 || selectedTags.every((t) => p.tags.includes(t))
      return textOk && tagsOk
    })
  }, [q, selectedTags, allPosts])

  const trackTagToggle = (tag: string, nextTags: string[]) => {
    setSelectedTags(nextTags)
    pushDataLayerEvent("tag_click", {
      analytics_section: "blog_filters",
      filter_tag: tag,
      selected_tag_count: nextTags.length,
      selected_tags: nextTags.join("|") || undefined,
      filter_state: nextTags.includes(tag) ? "selected" : "cleared",
    })
  }

  const toggleTag = (tag: string) => {
    const nextTags = selectedTags.includes(tag)
      ? selectedTags.filter((x) => x !== tag)
      : [...selectedTags, tag]

    trackTagToggle(tag, nextTags)
  }

  useEffect(() => {
    const query = q.trim()
    if (query === previousQuery.current) return

    const timeout = window.setTimeout(() => {
      pushDataLayerEvent("blog_search", {
        analytics_section: "blog_filters",
        search_term: query || undefined,
        search_term_length: query.length,
        selected_tag_count: selectedTags.length,
        selected_tags: selectedTags.join("|") || undefined,
        result_count: filtered.length,
      })
      previousQuery.current = query
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [filtered.length, q, selectedTags])

  return (
    <section
      className="space-y-6"
      data-analytics-section="blog_index"
      data-analytics-item-type="listing"
      data-analytics-page-context="primary"
      data-analytics-page-content-group="blog"
      data-analytics-page-content-type="blog_index"
      data-analytics-page-total-post-count={allPosts.length}
      data-analytics-page-total-tag-count={allTags.length}
    >
      <h1 className="text-3xl font-bold tracking-tight">Blog</h1>

      <div className="flex flex-col gap-3">
        <Input
          placeholder="Search articles…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => {
            if (hasFocusedSearch.current) return
            hasFocusedSearch.current = true
            pushDataLayerEvent("blog_search_focus", {
              analytics_section: "blog_filters",
              selected_tag_count: selectedTags.length,
            })
          }}
          data-analytics-section="blog_filters"
          data-analytics-item-type="search_input"
        />
        {/* Mobile: combobox for tag selection */}
        <div className="md:hidden">
          <TagCombobox
            allTags={allTags}
            selected={selectedTags}
            onChange={() => undefined}
            onToggleTag={trackTagToggle}
            buttonLabel="Filter tags"
          />
        </div>
        {/* Desktop: clickable badges */}
        <div className="hidden md:flex md:flex-wrap gap-2">
          {allTags.map((t) => (
            <Badge
              key={t}
              variant={selectedTags.includes(t) ? "default" : "outline"}
              onClick={() => toggleTag(t)}
              className="cursor-pointer select-none"
              title={selectedTags.includes(t) ? "Remove tag" : "Add tag"}
              data-analytics-section="blog_filters"
              data-analytics-item-type="tag_filter"
              data-analytics-item-name={t}
            >
              {t}
            </Badge>
          ))}
        </div>
        {/* Show active tags, if any */}
        {selectedTags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedTags.map((t) => (
              <Badge
                key={t}
                variant="secondary"
                onClick={() => toggleTag(t)}
                className="cursor-pointer select-none"
                data-analytics-section="blog_filters_active"
                data-analytics-item-type="tag_filter"
                data-analytics-item-name={t}
              >
                {t}
              </Badge>
            ))}
          </div>
        )}
      </div>

      <ul className="space-y-4">
        {filtered.map((post) => (
          <li key={post.slug} className="border-b border-border pb-4">
            <Link
              href={`/blog/${post.slug}`}
              prefetch={false}
              className="text-lg font-semibold hover:underline"
              data-analytics-event="post_click"
              data-analytics-section="blog_index_results"
              data-analytics-item-type="post_link"
              data-analytics-item-id={post.slug}
              data-analytics-item-name={post.title}
            >
              {post.title}
            </Link>
            {post.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {post.description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap gap-2">
              {post.pageClass ? <Badge variant="secondary">{post.pageClass}</Badge> : null}
              {post.pillar ? <Badge variant="outline">{post.pillar}</Badge> : null}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {post.updated ? "Updated " : ""}
              {new Date(post.displayDate).toLocaleDateString()}
            </p>
          </li>
        ))}
        {filtered.length === 0 && (
          <li className="text-sm text-muted-foreground">No matching posts.</li>
        )}
      </ul>
    </section>
  )
}
