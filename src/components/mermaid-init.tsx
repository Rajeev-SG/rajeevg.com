"use client"

import { useEffect } from "react"

const UNPROCESSED_MERMAID_SELECTOR = ".prose pre.mermaid:not([data-processed]), pre.mermaid:not([data-processed])"
const RENDERED_SVG_SELECTOR = ".prose pre.mermaid > svg[aria-roledescription], pre.mermaid > svg[aria-roledescription]"
const MERMAID_CONTAINER_SELECTOR = ".prose pre.mermaid, pre.mermaid"

export default function MermaidInit() {
  useEffect(() => {
    let cancelled = false
    let observer: MutationObserver | null = null
    let resizeObserver: ResizeObserver | null = null

    function updateScrollableState(pre: HTMLPreElement) {
      const overflowX = pre.scrollWidth - pre.clientWidth
      const isScrollable = overflowX > 12
      const nearStart = pre.scrollLeft < 8
      const nearEnd = pre.scrollLeft + pre.clientWidth > pre.scrollWidth - 8

      pre.dataset.scrollable = isScrollable ? "true" : "false"
      pre.dataset.scrollLeftEdge = isScrollable && !nearStart ? "true" : "false"
      pre.dataset.scrollRightEdge = isScrollable && !nearEnd ? "true" : "false"
    }

    function bindScrollableContainers() {
      const containers = Array.from(
        document.querySelectorAll<HTMLPreElement>(MERMAID_CONTAINER_SELECTOR)
      )

      for (const pre of containers) {
        let hint = pre.querySelector<HTMLElement>(".mermaid-scroll-hint")
        if (!hint) {
          hint = document.createElement("span")
          hint.className = "mermaid-scroll-hint"
          hint.textContent = "Scroll sideways to see full diagram"
          hint.setAttribute("aria-hidden", "true")
          pre.append(hint)
        }

        if (pre.dataset.scrollHintBound !== "true") {
          pre.dataset.scrollHintBound = "true"
          pre.addEventListener("scroll", () => updateScrollableState(pre), {
            passive: true,
          })
          resizeObserver?.observe(pre)
        }

        updateScrollableState(pre)
      }
    }

    function normalizeRenderedDiagrams() {
      const diagrams = Array.from(
        document.querySelectorAll<SVGSVGElement>(RENDERED_SVG_SELECTOR)
      )

      for (const svg of diagrams) {
        const naturalWidth = svg.style.maxWidth
        if (svg.getAttribute("width") === "100%" && naturalWidth) {
          svg.style.width = naturalWidth
          svg.style.maxWidth = "none"
        }
        svg.style.height = "auto"
      }

      bindScrollableContainers()
    }

    async function init() {
      const mod = await import("mermaid")
      const mermaid = mod.default
      if (cancelled) return

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "loose",
        theme: "base",
        // Use concrete colors to match our inline-svg server theme
        themeVariables: {
          primaryColor: "#ffffff",
          primaryTextColor: "#111111",
          primaryBorderColor: "#e5e7eb",
          lineColor: "#9ca3af",
          background: "transparent",
        },
      })

      async function renderPendingDiagrams() {
        if (cancelled) return

        const pending = document.querySelectorAll<HTMLPreElement>(UNPROCESSED_MERMAID_SELECTOR)
        if (pending.length === 0) {
          return
        }

        try {
          await mermaid.run({ querySelector: UNPROCESSED_MERMAID_SELECTOR })
        } catch (e) {
          if (process.env.NODE_ENV !== "production") {
            console.warn("Mermaid run failed:", e)
          }
          return
        }

        normalizeRenderedDiagrams()
        window.dispatchEvent(new Event("mermaid:rendered"))
      }

      // Render immediately for the common case, then keep watching in case
      // streamed or re-hydrated content inserts Mermaid blocks after mount.
      await renderPendingDiagrams()
      if (cancelled) return

      observer = new MutationObserver(() => {
        void renderPendingDiagrams()
      })

      const articleRoot = document.querySelector("#article-content") ?? document.body
      observer.observe(articleRoot, {
        childList: true,
        subtree: true,
      })

      resizeObserver = new ResizeObserver(() => {
        bindScrollableContainers()
      })

      bindScrollableContainers()

      // One extra frame helps catch late text swaps on static-to-hydrated pages.
      requestAnimationFrame(() => {
        void renderPendingDiagrams()
        bindScrollableContainers()
      })
    }

    void init()
    return () => {
      cancelled = true
      observer?.disconnect()
      resizeObserver?.disconnect()
    }
  }, [])

  return null
}
