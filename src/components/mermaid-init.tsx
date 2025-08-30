"use client"

import { useEffect } from "react"

export default function MermaidInit() {
  useEffect(() => {
    let cancelled = false

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
