"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface OverlayItem {
  href: string
  label: string
  // absolute position inside the SVG box in CSS pixels (relative to the SVG's top-left)
  x: number
  y: number
  width: number
  height: number
  isExternal: boolean
}

interface SvgOverlay {
  // key for React
  key: string
  // absolute position relative to the container element (CSS pixels)
  top: number
  left: number
  width: number
  height: number
  // scale from SVG viewBox units to CSS pixels
  scaleX: number
  scaleY: number
  items: OverlayItem[]
}

function getLabelFromAnchor(a: SVGElement): string {
  // Prefer child <title>
  const titleEl = a.querySelector("title")
  if (titleEl?.textContent) return titleEl.textContent
  // Fallback to aria-label
  const aria = a.getAttribute("aria-label")
  if (aria) return aria
  // Fallback to data-title
  const dataTitle = a.getAttribute("data-title")
  if (dataTitle) return dataTitle
  // Last resort, the href
  const href = (a as SVGAElement).getAttribute("href") || (a as SVGAElement).getAttribute("xlink:href") || ""
  return href
}

function isExternalHref(href: string): boolean {
  return /^(https?:)?\/\//.test(href)
}

function computeItems(svg: SVGSVGElement, svgRect: DOMRect): OverlayItem[] {
  const items: OverlayItem[] = []
  // Clickable anchors created by Mermaid for `click ... href` directives
  const anchors = Array.from(svg.querySelectorAll("a") as unknown as NodeListOf<SVGAElement>)
  anchors.forEach((a: SVGAElement) => {
    const href = a.getAttribute("href") || a.getAttribute("xlink:href") || ""
    if (!href) return
    // Measure via client rect to account for transforms, viewBox scaling, and layout shifts
    const aRect = a.getBoundingClientRect()
    const x = aRect.left - svgRect.left
    const y = aRect.top - svgRect.top
    const width = aRect.width
    const height = aRect.height
    const label = getLabelFromAnchor(a)
    items.push({
      href,
      label,
      x,
      y,
      width,
      height,
      isExternal: isExternalHref(href),
    })
  })
  return items
}

function computeScale(svg: SVGSVGElement): { scaleX: number; scaleY: number } {
  const vb = svg.viewBox.baseVal
  const rect = svg.getBoundingClientRect()
  if (vb && (vb.width || vb.height)) {
    const scaleX = rect.width / (vb.width || 1)
    const scaleY = rect.height / (vb.height || 1)
    return { scaleX, scaleY }
  }
  // Fallback: assume 1:1 (not ideal but prevents NaN)
  return { scaleX: 1, scaleY: 1 }
}

const isDev = process.env.NODE_ENV !== "production"

function roundNodeCorners(svg: SVGSVGElement, radiusPx = 12) {
  // Set rx/ry for rectangle shapes within graph nodes to add rounded corners
  const rects = svg.querySelectorAll<SVGRectElement>(".node rect")
  rects.forEach((r) => {
    r.setAttribute("rx", String(radiusPx))
    r.setAttribute("ry", String(radiusPx))
  })
}

export function MermaidTooltips({ containerSelector = "#article-content" }: { containerSelector?: string }) {
  const containerRef = React.useRef<HTMLElement | null>(null)
  const [overlays, setOverlays] = React.useState<SvgOverlay[]>([])

  const scan = React.useCallback(() => {
    const cont = containerRef.current
    if (!cont) return
    const sectionRect = cont.getBoundingClientRect()
    const svgs = Array.from(cont.querySelectorAll<SVGSVGElement>("svg[aria-roledescription]"))
    if (isDev) console.debug("[MermaidTooltips] scan: found svgs=", svgs.length)

    const newOverlays: SvgOverlay[] = []
    svgs.forEach((svg, idx) => {
      // Apply rounding enhancement on nodes
      roundNodeCorners(svg)

      const svgRect = svg.getBoundingClientRect()
      const { scaleX, scaleY } = computeScale(svg)
      const items = computeItems(svg, svgRect)
      if (!items.length) return
      if (isDev) console.debug("[MermaidTooltips] svg", idx, { svgRect, items })
      newOverlays.push({
        key: `svg-${idx}`,
        top: svgRect.top - sectionRect.top + cont.scrollTop,
        left: svgRect.left - sectionRect.left + cont.scrollLeft,
        width: svgRect.width,
        height: svgRect.height,
        scaleX,
        scaleY,
        items,
      })
    })
    setOverlays(newOverlays)
    if (isDev) console.debug("[MermaidTooltips] overlays updated", newOverlays)
  }, [])

  React.useEffect(() => {
    const container = document.querySelector(containerSelector) as HTMLElement | null
    containerRef.current = container
    if (!container) return
    if (isDev) {
      const pos = getComputedStyle(container).position
      if (!["relative", "absolute", "fixed"].includes(pos)) {
        console.warn(
          "[MermaidTooltips] Container is not positioned; overlays may misalign. Expected relative/absolute/fixed, got:",
          pos
        )
      } else {
        console.debug("[MermaidTooltips] Using container", containerSelector, "position:", pos)
      }
    }

    scan()

    const resizeObs = new ResizeObserver(() => scan())
    resizeObs.observe(container)
    // Observe each SVG as well for layout changes
    Array.from(container.querySelectorAll("svg[aria-roledescription]")).forEach((el) => resizeObs.observe(el))

    const onResize = () => scan()
    const onScroll = () => scan()
    const onMermaidRendered = () => scan()
    window.addEventListener("resize", onResize)
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("mermaid:rendered", onMermaidRendered)

    return () => {
      window.removeEventListener("resize", onResize)
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("mermaid:rendered", onMermaidRendered)
      resizeObs.disconnect()
    }
  }, [containerSelector, scan])

  if (!containerRef.current || !overlays.length) return null

  // Render overlays inside the content container so absolute positioning is relative to it.
  return createPortal(
    <TooltipProvider delayDuration={150}>
      <div className="pointer-events-none absolute inset-0 z-10">
        {overlays.map((ov) => (
          <div
            key={ov.key}
            className="pointer-events-none absolute"
            style={{ top: ov.top, left: ov.left, width: ov.width, height: ov.height }}
          >
            {ov.items.map((it, i) => {
              const style = {
                left: it.x + 4,
                top: it.y + 4,
                width: Math.max(8, it.width - 8),
                height: Math.max(8, it.height - 8),
              } as React.CSSProperties
              const debugClass = isDev ? "ring-1 ring-sky-400/40 hover:ring-sky-400/80 bg-sky-400/5" : ""
              return (
                <Tooltip key={`${ov.key}-item-${i}`}>
                  <TooltipTrigger asChild>
                    <a
                      href={it.href}
                      target={it.isExternal ? "_blank" : undefined}
                      rel={it.isExternal ? "noreferrer noopener" : undefined}
                      className={`pointer-events-auto absolute block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer hover:ring-2 hover:ring-ring/40 transition-shadow ${debugClass}`}
                      style={style}
                      aria-label={it.label}
                    >
                      <span className="absolute inset-0" />
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {it.label || (it.isExternal ? "Open link" : "Open")}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        ))}
      </div>
    </TooltipProvider>,
    containerRef.current
  )
}
