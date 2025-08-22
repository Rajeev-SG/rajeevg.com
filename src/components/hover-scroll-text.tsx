"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

type HoverScrollTextProps = {
  text: string
  className?: string
}

// Allow CSS custom property on style
type CSSVarStyles = React.CSSProperties & { ["--scroll-distance"]?: string }

export function HoverScrollText({ text, className }: HoverScrollTextProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const [distance, setDistance] = React.useState(0)
  const [animating, setAnimating] = React.useState(false)

  const handleEnter = () => {
    const container = containerRef.current
    const content = contentRef.current
    if (!container || !content) return

    const overflow = content.scrollWidth - container.clientWidth
    if (overflow > 0) {
      setDistance(overflow)
      setAnimating(true)
    }
  }

  const handleLeave = () => {
    setAnimating(false)
  }

  // Duration: ~50px per second
  const durationMs = Math.max(1500, Math.round((distance / 50) * 1000))

  return (
    <div
      ref={containerRef}
      className={cn("min-w-0 w-full overflow-hidden", className)}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div
        ref={contentRef}
        className="inline-block whitespace-nowrap will-change-transform"
        style={
          animating
            ? ({
                "--scroll-distance": `${distance}px`,
                animation: `hover-marquee ${durationMs}ms ease-in-out 0s infinite alternate` as React.CSSProperties["animation"],
              } as CSSVarStyles)
            : undefined
        }
        aria-label={text}
      >
        {text}
      </div>
    </div>
  )
}
