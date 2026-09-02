"use client"

import { ChevronDown } from "lucide-react"
import { useEffect, useState } from "react"

import type { ArticleHeading } from "@/components/mdx-content"
import { cn } from "@/lib/utils"

type ArticleTocProps = {
  headings: ArticleHeading[]
  className?: string
}

function TocLinks({
  headings,
  activeId,
  touchFriendly = false,
}: {
  headings: ArticleHeading[]
  activeId: string
  touchFriendly?: boolean
}) {
  return (
    <ol className="m-0 list-none space-y-1 p-0">
      {headings.map((heading) => {
        const active = heading.id === activeId

        return (
          <li key={heading.id} className="m-0 p-0">
            <a
              href={`#${heading.id}`}
              aria-current={active ? "location" : undefined}
              className={cn(
                "rounded-md text-sm leading-5 no-underline transition-colors hover:text-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
                touchFriendly ? "flex min-h-11 items-center py-2" : "block py-1.5",
                heading.depth === 3 ? "pl-4" : "pl-2 font-medium",
                active ? "bg-muted text-foreground" : "text-muted-foreground"
              )}
              onClick={(event) => {
                const details = event.currentTarget.closest("details")
                details?.removeAttribute("open")
              }}
            >
              {heading.text}
            </a>
          </li>
        )
      })}
    </ol>
  )
}

export function ArticleToc({ headings, className }: ArticleTocProps) {
  const [activeId, setActiveId] = useState(headings[0]?.id ?? "")

  useEffect(() => {
    if (!headings.length) return

    const elements = headings
      .map((heading) => document.getElementById(heading.id))
      .filter((element): element is HTMLElement => Boolean(element))

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)

        if (visible[0]?.target.id) setActiveId(visible[0].target.id)
      },
      { rootMargin: "-96px 0px -72% 0px", threshold: [0, 1] }
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [headings])

  if (!headings.length) return null

  return (
    <div className={cn("not-prose xl:sticky xl:top-24", className)}>
      <details className="group mb-8 rounded-xl border border-border/70 bg-muted/30 xl:hidden">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          <span>On this page</span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-open:rotate-180" aria-hidden />
        </summary>
        <nav aria-label="Table of contents" className="border-t border-border/70 px-3 py-3">
          <TocLinks headings={headings} activeId={activeId} touchFriendly />
        </nav>
      </details>

      <aside className="hidden max-h-[calc(100vh-7rem)] overflow-y-auto rounded-xl border border-border/70 bg-background/95 p-3 shadow-sm xl:block">
        <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
          On this page
        </p>
        <nav aria-label="Table of contents">
          <TocLinks headings={headings} activeId={activeId} />
        </nav>
      </aside>
    </div>
  )
}
