"use client"
import { useEffect } from "react"
import mermaid from "mermaid"

export default function MermaidInit() {
  useEffect(() => {
    mermaid.initialize({
      startOnLoad: false,
      securityLevel: "loose",
      theme: "base",
      themeVariables: {
        primaryColor: "var(--card)",
        primaryTextColor: "var(--foreground)",
        lineColor: "var(--border)",
        background: "transparent",
      },
    })
    mermaid.run().finally(() => {
      // Trigger observers (e.g. tooltip overlay) after diagrams render
      window.dispatchEvent(new Event("resize"))
    })
  }, [])
  return null
}
