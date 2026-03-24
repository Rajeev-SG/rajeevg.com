"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

type ArticleExplainProps = {
  term: string
  children: React.ReactNode
  className?: string
}

export function ArticleExplain({ term, children, className }: ArticleExplainProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex min-h-8 items-center gap-1.5 rounded-full border border-border/70 bg-muted/70 px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
            className
          )}
          aria-label={`Explain ${term}`}
        >
          <span>{term}</span>
          <span
            aria-hidden="true"
            className="inline-flex size-4 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-semibold"
          >
            ?
          </span>
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="start"
        sideOffset={10}
        className="w-[min(22rem,calc(100vw-2rem))] rounded-2xl border-border/70 bg-background/98 p-4 text-sm leading-6 shadow-xl"
      >
        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            Explainer
          </p>
          <p className="text-sm font-semibold text-foreground">{term}</p>
          <div className="text-muted-foreground">{children}</div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
