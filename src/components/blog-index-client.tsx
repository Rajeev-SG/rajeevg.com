"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { TagCombobox } from "@/components/tag-combobox"

export type BlogListItem = {
  title: string
  slug: string
  date: string
  tags: string[]
  description?: string
  excerpt?: string
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

  const toggleTag = (t: string) => {
    setSelectedTags((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]
    )
  }

  return (
    <section className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">Blog</h1>

      <div className="flex flex-col gap-3">
        <Input
          placeholder="Search articles…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {/* Mobile: combobox for tag selection */}
        <div className="md:hidden">
          <TagCombobox
            allTags={allTags}
            selected={selectedTags}
            onChange={setSelectedTags}
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
              className="text-lg font-semibold hover:underline"
            >
              {post.title}
            </Link>
            {post.description && (
              <p className="text-sm text-muted-foreground mt-1">
                {post.description}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              {new Date(post.date).toLocaleDateString()}
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
