"use client"

import { useEffect } from "react"

export default function MermaidInit() {
  useEffect(() => {
    let cancelled = false

    function normalizeRenderedDiagrams() {
      const diagrams = Array.from(
        document.querySelectorAll<SVGSVGElement>(".prose pre.mermaid > svg[aria-roledescription], pre.mermaid > svg[aria-roledescription]")
      )

      for (const svg of diagrams) {
        const naturalWidth = svg.style.maxWidth
        if (svg.getAttribute("width") === "100%" && naturalWidth) {
          svg.style.width = naturalWidth
          svg.style.maxWidth = "none"
        }
        svg.style.height = "auto"
      }
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

      try {
        // Ensure diagrams render immediately on hydration
        await mermaid.run({ querySelector: ".prose pre.mermaid, pre.mermaid" })
        normalizeRenderedDiagrams()
        // Notify listeners that Mermaid diagrams were rendered
        window.dispatchEvent(new Event("mermaid:rendered"))
      } catch (e) {
        if (process.env.NODE_ENV !== "production") {
          console.warn("Mermaid run failed:", e)
        }
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [])

  return null
}
