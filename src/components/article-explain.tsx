"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

type ArticleExplainProps = {
  term: string
  children: React.ReactNode
  className?: string
}

export function ArticleExplain({ term, children, className }: ArticleExplainProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1 rounded-full border border-border/70 bg-muted/70 px-2 py-0.5 text-xs font-medium text-foreground transition-colors hover:bg-muted",
            className
          )}
        >
          <span>{term}</span>
          <span
            aria-hidden="true"
            className="inline-flex size-4 items-center justify-center rounded-full bg-foreground/10 text-[10px] font-semibold"
          >
            ?
          </span>
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" sideOffset={8} className="max-w-xs px-3 py-2 text-sm leading-5">
        {children}
      </TooltipContent>
    </Tooltip>
  )
}
