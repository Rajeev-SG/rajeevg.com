"use client"

import { useState, type ReactNode } from "react"
import Link from "next/link"
import { Search } from "lucide-react"

import { Input } from "@/components/ui/input"
import type { FeatureListing } from "@/lib/adpi/feature-pages"

type BrowseFeature = FeatureListing & { href: string }

export function FeatureBrowse({ features, initialQuery, gallery }: {
  features: BrowseFeature[]
  initialQuery: string
  gallery: ReactNode
}) {
  const [query, setQuery] = useState(initialQuery)
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  const matches = features.filter(({ name, vendor, platform, category, searchTerms, summary }) => {
    const searchable = [name, vendor, platform, category, summary, ...searchTerms].join(" ").toLowerCase()
    return terms.every((term) => searchable.includes(term))
  })
  const platforms = new Map<string, Map<string, BrowseFeature[]>>()
  for (const feature of matches) {
    const categories = platforms.get(feature.vendor) ?? new Map<string, BrowseFeature[]>()
    const category = feature.category
    const items = categories.get(category) ?? []
    items.push(feature)
    categories.set(category, items)
    platforms.set(feature.vendor, categories)
  }

  return (
    <div className="space-y-8">
      <div role="search" className="relative max-w-xl">
        <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" aria-hidden="true" />
        <Input
          type="search"
          aria-label="Search features"
          placeholder="Search features on any platform"
          className="h-11 pl-9"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </div>

      {terms.length === 0 && gallery}

      <section aria-labelledby="browse-features" className="space-y-4">
        <h2 id="browse-features" className="text-xl font-semibold tracking-tight sm:text-2xl">
          {terms.length ? "Search results" : "Browse by platform"}
        </h2>
        <p className="sr-only" role="status">{matches.length} {matches.length === 1 ? "feature" : "features"}</p>
        {matches.length === 0 && <p className="text-muted-foreground">No matching features.</p>}
        <div className="grid items-start gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...platforms].map(([platform, categories]) => (
            <section key={platform} className="min-w-0 rounded-xl border">
              <h3 className="rounded-t-xl border-b bg-muted/60 px-4 py-3 font-semibold">{platform}</h3>
              {[...categories].sort(([a], [b]) => a.localeCompare(b, "en")).map(([category, items]) => (
                <div key={category} className="space-y-1 px-4 py-3 [&+&]:border-t">
                  <h4 className="text-xs font-medium text-muted-foreground">{category}</h4>
                  <ul>
                    {items.map(({ id, name, href }) => (
                      <li key={id}>
                        <Link href={href} className="block rounded-sm py-1.5 text-sm font-medium leading-snug text-primary hover:underline hover:underline-offset-4">
                          {name}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </section>
          ))}
        </div>
      </section>
    </div>
  )
}
