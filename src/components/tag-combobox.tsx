"use client"

import * as React from "react"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Check, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

export function TagCombobox({
  allTags,
  selected,
  onChange,
  className,
  buttonLabel = "Filter tags",
}: {
  allTags: string[]
  selected: string[]
  onChange(tags: string[]): void
  className?: string
  buttonLabel?: string
}) {
  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState("")

  const tags = useMemo(() => {
    const f = filter.trim().toLowerCase()
    const list = [...allTags]
    list.sort((a, b) => a.localeCompare(b))
    if (!f) return list
    return list.filter((t) => t.toLowerCase().includes(f))
  }, [allTags, filter])

  const toggle = (tag: string) => {
    const next = selected.includes(tag)
      ? selected.filter((t) => t !== tag)
      : [...selected, tag]
    onChange(next)
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn("justify-between", className)}>
          <span>{buttonLabel}</span>
          <ChevronDown className="size-4 opacity-70" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-2 w-64">
        <div className="space-y-2">
          <Input
            placeholder="Type to filter tags…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <ScrollArea className="h-56 rounded-md border">
            <ul className="p-1">
              {tags.length === 0 ? (
                <li className="text-sm text-muted-foreground py-6 text-center">
                  No tags found
                </li>
              ) : (
                tags.map((t) => {
                  const active = selected.includes(t)
                  return (
                    <li key={t}>
                      <button
                        type="button"
                        onClick={() => toggle(t)}
                        className={cn(
                          "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground",
                          active && "bg-accent text-accent-foreground"
                        )}
                      >
                        <Check className={cn("size-4", active ? "opacity-100" : "opacity-0")} />
                        <span className="truncate">{t}</span>
                      </button>
                    </li>
                  )
                })
              )}
            </ul>
          </ScrollArea>
        </div>
      </PopoverContent>
    </Popover>
  )
}
