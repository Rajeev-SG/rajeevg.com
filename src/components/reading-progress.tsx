"use client"

import * as React from "react"
import { Progress } from "@/components/ui/progress"

function clamp(n: number, min = 0, max = 1) {
  return Math.max(min, Math.min(max, n))
}

function pageY(el: HTMLElement) {
  return el.getBoundingClientRect().top + window.scrollY
}

export function ReadingProgress({ targetId = "article-content" }: { targetId?: string }) {
  const [value, setValue] = React.useState(0)
  const targetRef = React.useRef<HTMLElement | null>(null)
  const frame = React.useRef<number | null>(null)

  const recalcAndUpdate = React.useCallback(() => {
    const el = targetRef.current
    if (!el) return setValue(0)

    const start = pageY(el)
    const height = el.offsetHeight
    const viewport = window.innerHeight
    const end = Math.max(start, start + height - viewport)

    // If content shorter than viewport, mark complete.
    if (height <= viewport) {
      setValue(100)
      return
    }

    const y = window.scrollY
    const pct = clamp((y - start) / (end - start)) * 100
    setValue(pct)
  }, [])

  const schedule = React.useCallback(() => {
    if (frame.current != null) return
    frame.current = window.requestAnimationFrame(() => {
      frame.current = null
      recalcAndUpdate()
    })
  }, [recalcAndUpdate])

  React.useEffect(() => {
    targetRef.current = document.getElementById(targetId) as HTMLElement | null
    if (!targetRef.current) return

    const onScroll = () => schedule()
    const onResize = () => schedule()

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onResize)

    let ro: ResizeObserver | null = null
    if (typeof ResizeObserver !== "undefined") {
      ro = new ResizeObserver(() => schedule())
      ro.observe(targetRef.current)
    }

    // initial measurement
    recalcAndUpdate()

    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onResize)
      if (ro) ro.disconnect()
      if (frame.current != null) cancelAnimationFrame(frame.current)
    }
  }, [targetId, recalcAndUpdate, schedule])

  return (
    <div aria-hidden className="pointer-events-none sticky top-12 z-0 -mt-8 md:-mt-10 mb-3 md:mb-4">
      <Progress value={value} className="h-1" />
    </div>
  )
}
